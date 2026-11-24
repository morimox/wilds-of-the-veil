import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame, stageRetreatOpening } from './game-test-fixtures.mjs';

const definition = (id) => data.sites.find((site) => site.id === id);
const field = (state, id) => view(state).sites.find((site) => site.id === id);
const choice = (state, index) => view(state).visibleChoices.find((row) => row.index === index);

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function expedition(id, seed = 500) {
  const site = definition(id);
  const state = createGame(seed);
  // Stage a well-equipped traveler late enough for renewable guarding populations to reach their caps.
  state.day = 24;
  state.realm = 3;
  state.discovered.push(site.region);
  state.inventory.ration = 20;
  state.inventory.salve = 15;
  state.knownArts.push('bell_strike');
  state.seenChoices.push(...(site.afterChoices ?? []).slice(0, 1));
  for (const [slot, id] of Object.entries({ weapon: 'sky_sword', armor: 'sky_cloak', charm: 'jade_pendant' })) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
    state.equipment[slot] = id;
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.region = site.region;
  return state;
}

function feed(state) {
  if (state.satiety < 53) play(state, 'eat', { id: 'ration' });
}

function enter(state, id) {
  feed(state);
  play(state, 'visit', { id });
  assert.equal(view(state).currentEvent.id, id);
}

function defeat(state, index, enemy) {
  const site = view(state).currentEvent.id;
  feed(state);
  play(state, 'choose', { index });
  assert.equal(view(state).currentEnemy.id, enemy);
  for (let turn = 0; state.combat && turn < 40; turn += 1) {
    if (view(state).intent?.kind === 'heavy') play(state, 'guard');
    else if (state.hp < 20) play(state, 'use', { id: 'salve' });
    else if (state.qi >= 4) play(state, 'art', { id: 'bell_strike' });
    else play(state, 'attack');
  }
  assert.equal(view(state).currentEvent?.id, site, state.log.slice(-5).join('\n'));
}

function gather(state, index) {
  play(state, 'beginGather', { index });
  return play(state, 'finishGather');
}

function waitUntil(state, day) {
  while (state.day < day) {
    feed(state);
    play(state, 'wait');
  }
}

test('guarded ore stays closed until the last sentry falls, then reopens for a full cycle', () => {
  const site = 'miner_echo';
  const enemy = 'ore_wight';
  const state = expedition(site);
  enter(state, site);
  assert.match(choice(state, 3).lockedReason, /还有\s*3\s*只/);
  assert.doesNotMatch(choice(state, 3).lockedReason, /持锤矿煞/);
  assert.equal(choice(state, 1).available, true);
  defeat(state, 0, enemy);
  assert.match(choice(state, 3).lockedReason, /还有\s*2\s*只/);
  defeat(state, 0, enemy);
  assert.equal(field(state, site).creatures[enemy], 1);
  assert.match(choice(state, 3).lockedReason, /还有\s*1\s*只/);
  assert.equal(act(state, 'beginGather', { index: 3 }).ok, false);
  const pendingSpawn = state.localPools[site].creatures[enemy].nextAt;
  defeat(state, 0, enemy);
  const returnTime = state.localPools[site].creatures[enemy].nextAt;
  assert(returnTime > pendingSpawn);
  assert.equal(returnTime - state.day, definition(site).creatures[enemy].interval);
  assert.equal(choice(state, 3).available, true);
  const { gathered } = gather(state, 3);
  assert.ok(gathered.ore > 0);
  assert.equal(choice(state, 3).available, true);
  play(state, 'leave');
  waitUntil(state, returnTime);
  enter(state, site);
  assert.equal(field(state, site).creatures[enemy], 1);
  assert.equal(choice(state, 3).available, false);
  assert.equal(choice(state, 1).available, true);
  assert.equal(view(state).groundLoot.ore, gathered.ore);
  play(state, 'take', { id: 'ore' });
});

test('an unguarded shallow pile has independent stock from the deeper deposit', () => {
  for (const [site, safe, deep, material, openIndex, deepIndex, needsClearance] of [
    ['miner_echo', 'ore', 'ore_wall', 'ore', 1, 3, true],
    ['low_tide', 'core', 'core_silt', 'core', 0, 2, false],
  ]) {
    const state = expedition(site, 0);
    enter(state, site);
    const stocks = () => Object.fromEntries(field(state, site).stockDetails.map(({ id, count }) => [id, count]));
    const before = stocks();
    assert.equal(before[safe], definition(site).stocks[safe].cap);
    assert.equal(before[deep], definition(site).stocks[deep].cap);
    assert.equal(choice(state, deepIndex).available, !needsClearance);
    assert.equal(choice(state, openIndex).available, true);
    const { gathered } = gather(state, openIndex);
    assert.ok(gathered[material] > 0);
    assert.equal(view(state).currentEvent.id, site);
    assert.equal(state.encounterSeed, 0);
    assert.equal(stocks()[safe], before[safe] - gathered[material]);
    assert.equal(stocks()[deep], before[deep]);
    assert.equal(view(state).groundLoot[material], gathered[material]);
  }
});

test('the assayer points out a guarded paying job with its own ore seam and return cycle', () => {
  const id = 'ledge_mine';
  const enemy = 'ore_wight';
  const state = expedition(id);
  state.seenChoices = state.seenChoices.filter((key) => key !== 'ore_rain:2');
  assert.equal(field(state, id), undefined);
  enter(state, 'ore_rain');
  play(state, 'choose', { index: 2 });
  const neighboringStock = field(state, 'ore_rain').stocks;
  play(state, 'leave');
  enter(state, id);
  assert.equal(choice(state, 1).available, false);
  assert.equal(choice(state, 2)?.available ?? false, false);
  defeat(state, 0, enemy);
  const returnTime = state.localPools[id].creatures[enemy].nextAt;
  const before = state.coins;
  const rations = state.inventory.ration;
  play(state, 'choose', { index: 2 });
  assert.equal(state.coins - before, 8);
  assert.equal(state.inventory.ration, rations + 1);
  assert.equal(choice(state, 2)?.available ?? false, false);
  assert.deepEqual(gather(state, 1).gathered, { ore: 4, core: 2 });
  assert.deepEqual(gather(state, 1).gathered, { ore: 4, core: 2 });
  assert.equal(choice(state, 1)?.available ?? false, false);
  assert.deepEqual(field(state, 'ore_rain').stocks, neighboringStock);
  play(state, 'leave');
  waitUntil(state, returnTime);
  enter(state, id);
  assert.equal(field(state, id).creatures[enemy], 1);
  assert.equal(choice(state, 1).available, false);
  assert.equal(choice(state, 2)?.available ?? false, false);
  defeat(state, 0, enemy);
  play(state, 'choose', { index: 2 });
  assert.equal(state.coins - before, 16);
});

test('a returning kiln hound does not replenish the finite clay in the cabinet', () => {
  const site = 'kiln_flue';
  const enemy = 'cinder_hound';
  const state = expedition(site);
  enter(state, site);
  const guards = field(state, site).creatures[enemy];
  assert(guards > 0);
  for (let i = 0; i < guards; i += 1) {
    defeat(state, 0, enemy);
  }
  const carriedClay = field(state, site).stocks.kiln_clay;
  assert(carriedClay > 0);
  assert.deepEqual(gather(state, 4).gathered, { kiln_clay: carriedClay });
  play(state, 'leave');
  waitUntil(state, state.localPools[site].creatures[enemy].nextAt);
  enter(state, site);
  assert.equal(field(state, site).creatures[enemy], 1);
  assert.equal(field(state, site).stocks.kiln_clay, 0);
  defeat(state, 0, enemy);
  assert.equal(choice(state, 4)?.available ?? false, false);
  assert.equal(field(state, site).stocks.kiln_clay, 0);
});

test('a confirmed sentry returning during collection stops the next batch', () => {
  const site = 'miner_echo';
  const enemy = 'ore_wight';
  const state = expedition(site);
  enter(state, site);
  // Place the expedition just before a scheduled return to cover the batch boundary directly.
  state.localPools[site] = { creatures: { [enemy]: { count: 0, nextAt: state.day + 1 } } };
  assert.equal(field(state, site).creatures[enemy], 0);
  assert.equal(choice(state, 3).available, true);
  const result = gather(state, 3);
  assert.deepEqual(result.gathered, { ore: 3, core: 2 });
  assert.equal(view(state).groundLoot.ore, 3);
  assert.equal(field(state, site).stocks.ore_wall, 1);
  assert.equal(field(state, site).creatures[enemy], 1);
  assert.equal(choice(state, 3).available, false);
  assert.equal(act(state, 'beginGather', { index: 3 }).ok, false);
});

test('encounter-prone harvesting can succeed, get interrupted, or be safe when the population is empty', () => {
  for (const [site, enemy, index, stock, item] of [
    ['low_tide', 'rope_eel', 2, 'core_silt', 'core'],
    ['vine_pond', 'vine_stag', 2, 'reed', 'reed'],
  ]) {
    const hit = expedition(site, 0);
    enter(hit, site);
    assert(field(hit, site).creatures[enemy] > 0);
    assert.equal(choice(hit, index).available, true);
    const before = { day: hit.day, insight: hit.insight, stock: field(hit, site).stocks[stock] };
    const interrupted = gather(hit, index);
    assert.equal(interrupted.ambush, enemy);
    assert.equal(interrupted.gathered, undefined);
    assert.equal(hit.day - before.day, rules.harvestEncounterDays);
    assert.equal(hit.insight, before.insight);
    assert.equal(hit.seenChoices.includes(`${site}:${index}`), false);
    assert.equal(field(hit, site).stocks[stock], before.stock);
    assert.equal(view(hit).groundLoot[item], undefined);
    assert.equal(view(hit).currentEnemy.id, enemy);
    const present = field(hit, site).creatures[enemy];
    stageRetreatOpening(hit);
    assert.equal(play(hit, 'retreat').retreated, true);
    assert.equal(field(hit, site).creatures[enemy], present);
    assert(field(hit, site).witnessedEnemies.includes(enemy));
    enter(hit, site);
    assert.equal(choice(hit, index).available, true);

    const miss = expedition(site, 500);
    enter(miss, site);
    assert(field(miss, site).creatures[enemy] > 0);
    const normalYield = data.events.find(({ id }) => id === site).choices[index].loot[item];
    assert.deepEqual(gather(miss, index).gathered, { [item]: normalYield });
    assert.equal(view(miss).currentEvent.id, site);

    const empty = expedition(site, 0);
    enter(empty, site);
    empty.localPools[site] = { creatures: { [enemy]: { count: 0, nextAt: empty.day + 3 } } };
    const initialSeed = empty.encounterSeed;
    assert.deepEqual(gather(empty, index).gathered, { [item]: normalYield });
    assert.equal(empty.encounterSeed, initialSeed);
    assert.equal(view(empty).currentEvent.id, site);
  }
});

test('an ambush in a later batch leaves the first batch on the ground', () => {
  const site = 'vine_pond';
  const state = expedition(site, 1001);
  enter(state, site);
  const stock = field(state, site).stocks.reed;
  assert(stock >= 6);
  const started = state.day;
  assert.deepEqual(gather(state, 2).gathered, { reed: 4 });
  const result = gather(state, 2);
  assert.equal(result.ambush, 'vine_stag');
  assert.equal(result.gathered, undefined);
  assert.equal(state.day - started, 0.75 + rules.harvestEncounterDays);
  assert.equal(field(state, site).stocks.reed, stock - 4);
  assert.equal(view(state).groundLoot.reed, 4);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).currentEnemy.id, 'vine_stag');
});

test('wild foxes return slowly at the edges and faster around half full', () => {
  const site = 'mud_track';
  const enemy = 'reed_fox';
  const pool = definition(site).creatures[enemy];
  const state = expedition(site);
  enter(state, site);
  assert.equal(field(state, site).creatures[enemy], pool.cap);
  for (let attempt = 0; field(state, site).creatures[enemy] > 0 && attempt < pool.cap * 2; attempt += 1) {
    defeat(state, 2, enemy);
  }
  assert.equal(field(state, site).creatures[enemy], 0);
  const countAt = (day) => {
    const later = structuredClone(state);
    later.day = day;
    return field(later, site).creatures[enemy];
  };
  let next = state.localPools[site].creatures[enemy].nextAt;
  assert.equal(next, state.day + pool.interval * (pool.depletedFactor ?? 1));
  assert.equal(countAt(next - 0.01), 0);
  const gaps = [];
  for (let count = 1; count < pool.cap; count += 1) {
    assert.equal(countAt(next + 0.01), count);
    const gap = pool.interval * (0.8 + 2.4 * (count / pool.cap - 0.5) ** 2);
    assert.equal(countAt(next + gap - 0.01), count);
    gaps.push(gap);
    next += gap;
  }
  assert(gaps[0] > gaps[1] && gaps.at(-1) > gaps[1]);
  assert.equal(countAt(next + 0.01), pool.cap);
  assert.equal(countAt(next + 100), pool.cap);
});

test('the upper grove has a unique leader while the usual deer do not block the shallows', () => {
  const site = 'vine_pond';
  const state = expedition(site);
  enter(state, site);
  assert.equal(choice(state, 2).available, true);
  assert.equal(choice(state, 4), undefined);
  assert.equal(field(state, site).stockDetails.some(({ id }) => id === 'reed_upper'), false);
  assert.equal(act(state, 'beginGather', { index: 4 }).ok, false);
  assert.equal(field(state, site).creatures.vine_king, 1);
  defeat(state, 3, 'vine_king');
  assert.equal(field(state, site).creatures.vine_king, 0);
  assert(field(state, site).creatures.vine_stag > 0);
  assert.equal(choice(state, 4).available, true);
  assert(field(state, site).stockDetails.some(({ id }) => id === 'reed_upper'));
  const upper = field(state, site).stocks.reed_upper;
  const first = gather(state, 4).gathered.reed;
  feed(state);
  const second = gather(state, 4).gathered.reed;
  assert.equal(first + second, upper);
  play(state, 'leave');
  waitUntil(state, state.day + 20);
  enter(state, site);
  assert.equal(field(state, site).creatures.vine_king, 0);
  assert(field(state, site).stocks.reed_upper > 0);
  assert.equal(choice(state, 4).available, true);
});

test('the human sentry returns on a fixed shift measured from the victory', () => {
  const site = 'pine_spar';
  const enemy = 'road_sparrer';
  const state = expedition(site);
  enter(state, site);
  defeat(state, 0, enemy);
  const pool = state.localPools[site].creatures[enemy];
  assert.equal(pool.nextAt - state.day, 8);
  const earlier = { ...state, day: pool.nextAt - 0.01 };
  const later = { ...state, day: pool.nextAt + 0.01 };
  assert.equal(field(earlier, site).creatures[enemy], 0);
  assert.equal(field(later, site).creatures[enemy], 1);
});

test('one defeated sentry opens the one-time tool locker even when others remain', () => {
  const site = 'deep_vein';
  const enemy = 'vein_sentinel';
  const state = expedition(site);
  enter(state, site);
  assert.equal(field(state, site).creatures[enemy], 3);
  assert.equal(choice(state, 2), undefined);
  defeat(state, 0, enemy);
  assert.equal(field(state, site).creatures[enemy], 2);
  assert.equal(choice(state, 2).available, true);
  assert.equal(choice(state, 3).available, false);
  play(state, 'leave');
  waitUntil(state, state.localPools[site].creatures[enemy].nextAt);
  enter(state, site);
  assert.equal(field(state, site).creatures[enemy], 3);
  assert.equal(choice(state, 2).available, true);
  play(state, 'choose', { index: 2 });
  assert.equal(state.inventory.star_blade, undefined);
  assert.equal(state.inventory.star_blade_pattern, 1);
  enter(state, site);
  assert.equal(choice(state, 2), undefined);
  assert.equal(choice(state, 3).available, false);
});
