import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const snow = {
  id: 'snow_armor_bank', region: 'snow_pass', start: 19, cap: 29,
  directed: [['snow_flat_scale', 1], ['snow_seam_crab', 2]],
  mixed: [['snow_gully_otter', 0], ['snow_rime_antelope', 0]],
};
const sand = {
  id: 'sand_armor_bank', region: 'glass_hail_sink', start: 20, cap: 32,
  directed: [['sand_spine_lizard', 3], ['sand_riven_scorpion', 4]],
  mixed: [['sand_quarry_rockscorpion', 1], ['sand_glass_lynx', 0], ['sand_quarry_guard', 2]],
};
const quarry = 'sand_hunt_colony';
const sharedScorpion = 'sand_quarry_rockscorpion';

const group = (state, id) => view(state).sites.find((site) => site.id === id).creatures;
const population = (state, id) => Object.values(group(state, id)).reduce((total, count) => total + count, 0);
const firstRoll = (seed) => ((Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32;

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function expedition(site, day = 1) {
  const state = createGame(8);
  state.region = site.region;
  state.discovered.push(site.region);
  state.day = day;
  state.realm = data.realms.at(-1).id;
  state.inventory.ration = 16;
  for (const id of ['foil_sword', 'fault_coat', 'jade_pendant']) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
    play(state, 'equip', { id });
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  play(state, 'visit', { id: site.id });
  return state;
}

function defeat(state, index, enemy) {
  const id = state.event;
  if (state.satiety < 55) play(state, 'eat', { id: 'ration' });
  if (index === 0) {
    const { encounter } = data.events.find((event) => event.id === id).choices[index];
    const current = group(state, id);
    const deck = encounter.flatMap((foe) => Array(current[foe]).fill(foe));
    const seed = Array.from({ length: 100 }, (_, offset) => (Math.imul(offset + 1, 2654435761) >>> 0))
      .find((candidate) => deck[Math.floor(firstRoll(candidate) * deck.length)] === enemy);
    assert.notEqual(seed, undefined, `expected an encounter with ${enemy}`);
    state.encounterSeed = seed;
  }
  play(state, 'choose', { index });
  assert.equal(view(state).currentEnemy.id, enemy);
  let result;
  for (let turn = 0; turn < 28 && state.combat; turn += 1) {
    const intent = view(state).intent?.kind;
    result = play(state, intent === 'heavy' ? 'guard' : 'attack');
  }
  assert.equal(state.combat, null);
  assert.equal(state.event, id);
  return result.gathered;
}

function waitUntil(state, day) {
  while (state.day < day) {
    if (state.satiety < 25) play(state, 'eat', { id: 'ration' });
    play(state, 'wait');
  }
}

for (const site of [snow, sand]) {
  test(`the scale bank ${site.id} offers directed fights and the right body parts`, () => {
    const fresh = expedition(site);
    const full = expedition(site, 200);
    assert.equal(population(fresh, site.id), site.start);
    assert.equal(population(full, site.id), site.cap);
    assert.equal(Object.keys(group(fresh, site.id)).length, site.directed.length + site.mixed.length);

    for (const [index, [enemy, expected]] of [
      ...site.directed.map((entry, index) => [index + 1, entry]),
      ...site.mixed.map((entry) => [0, entry]),
    ]) {
      const state = structuredClone(full);
      const before = group(state, site.id);
      const loot = defeat(state, index, enemy);
      assert.equal(loot.hard_scale ?? 0, expected);
      assert.deepEqual(group(state, site.id), { ...before, [enemy]: before[enemy] - 1 });
      assert.equal(state.inventory.hard_scale, undefined);
      assert.equal(view(state).groundLoot.hard_scale ?? 0, expected);
      if (expected) {
        play(state, 'take', { id: 'hard_scale' });
        assert.equal(state.inventory.hard_scale, expected);
      }
    }
  });
}

test('snow lizards and crabs return to their own bank while the other species stay capped', () => {
  const state = expedition(snow, 200);
  const complete = group(state, snow.id);
  for (const [offset, [enemy]] of snow.directed.entries()) defeat(state, offset + 1, enemy);
  const spent = state.localPools[snow.id].creatures;
  const returns = snow.directed.map(([enemy]) => spent[enemy].nextAt);
  assert.ok(returns.every((day) => day > state.day));
  assert.equal(population(state, snow.id), snow.cap - 2);
  play(state, 'leave');
  waitUntil(state, Math.max(...returns));
  play(state, 'visit', { id: snow.id });
  assert.deepEqual(group(state, snow.id), complete);
});

test('scorpion victories in the renewable sand bank and the finite quarry stay independent', () => {
  const state = expedition(sand, 200);
  state.discovered.push('hanging_vein');
  const fullBank = group(state, sand.id);
  defeat(state, 0, sharedScorpion);
  const { nextAt } = state.localPools[sand.id].creatures[sharedScorpion];
  assert.ok(nextAt > state.day);
  assert.equal(group(state, sand.id)[sharedScorpion], fullBank[sharedScorpion] - 1);
  play(state, 'leave');
  play(state, 'travel', { id: 'hanging_vein' });
  play(state, 'visit', { id: 'sand_hunt_anchors' });
  play(state, 'choose', { index: 1 });
  play(state, 'leave');
  play(state, 'visit', { id: quarry });
  const fullQuarry = group(state, quarry);
  assert.equal(fullQuarry[sharedScorpion], 24);
  assert.equal(state.siteVictories[quarry], undefined);
  defeat(state, 0, sharedScorpion);
  assert.equal(group(state, quarry)[sharedScorpion], fullQuarry[sharedScorpion] - 1);
  assert.equal(state.localPools[quarry].creatures[sharedScorpion].nextAt, null);
  assert.deepEqual(state.localPools[sand.id].creatures[sharedScorpion], { count: fullBank[sharedScorpion] - 1, nextAt });
  assert.equal(state.siteVictories[sand.id][sharedScorpion], 1);
  assert.equal(state.siteVictories[quarry][sharedScorpion], 1);
  play(state, 'leave');
  waitUntil(state, nextAt);
  play(state, 'visit', { id: quarry });
  assert.deepEqual(group(state, quarry), { ...fullQuarry, [sharedScorpion]: fullQuarry[sharedScorpion] - 1 });
  play(state, 'leave');
  play(state, 'travel', { id: sand.region });
  play(state, 'visit', { id: sand.id });
  assert.deepEqual(group(state, sand.id), fullBank);
});
