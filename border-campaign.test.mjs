import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, rules, view } from './engine.mjs';
import { data } from './data.mjs';

function play(state, action, details = {}) {
  const result = act(state, action, details);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

const choose = (state, index) => play(state, 'choose', { index });
const available = (state, index) => Boolean(view(state).visibleChoices.find((choice) => choice.index === index)?.available);
const knownHere = (state, id) => view(state).sites.some((site) => site.id === id);

function traveler(realm = 4) {
  const state = createGame(2021);
  // Stage the approach with a paid-for earlier loadout and the valid pass. Use the actual road for the final crossing.
  state.region = 'zhao_pass';
  state.discovered.push('zhao_pass', 'mingsha_city');
  state.knownItems.push('sand_writ');
  state.realm = realm;
  state.coins = 36;
  state.inventory.ration = 20;
  state.inventory.salve = 7;
  state.inventory.heal_pill = 4;
  state.inventory.qi_powder = 5;
  state.knownArts.push('cliff_cut', 'bell_strike');
  if (realm >= 4) state.knownArts.push('sky_axis');

  const pack = realm >= 4 ? ['coil_pole', 'gauze_armor', 'jade_pendant'] :
    realm >= 2 ? ['weir_knife', 'iron_coat', 'tide_charm', 'hide_shield'] : [];
  for (const id of pack) {
    const gear = data.gear.find((entry) => entry.id === id);
    state.inventory[id] = 1;
    state.durability[id] = gear.durability;
    play(state, 'equip', { id });
  }
  play(state, 'travel', { id: 'mingsha_city' });
  refillAtInn(state);
  return state;
}

function refillAtInn(state) {
  while (state.hp < view(state).maxHp || state.qi < view(state).maxQi || state.pressure > 0) {
    eatBeforeMoving(state);
    play(state, 'rest');
  }
}

function eatBeforeMoving(state) {
  if (state.satiety < 57) play(state, 'eat', { id: 'ration' });
}

function go(state, id) {
  if (state.event) play(state, 'leave');
  eatBeforeMoving(state);
  play(state, 'travel', { id });
}

function visit(state, id) {
  eatBeforeMoving(state);
  play(state, 'visit', { id });
}

function watchBriefing(state) {
  visit(state, 'border_watch_desk');
  assert.match(choose(state, 0).outcome, /白蹄旧道.*断纬帐道.*担盐岗/);
}

function shift(state, trail, id) {
  for (const region of trail) go(state, region);
  visit(state, id);
}

function fight(state, index, expected, ledger = []) {
  eatBeforeMoving(state);
  const boss = expected === 'border_silo_leader';
  if (boss) {
    const { maxHp, maxQi } = view(state);
    if (state.hp <= maxHp - 16 && state.inventory.heal_pill) play(state, 'use', { id: 'heal_pill' });
    while (state.qi <= maxQi - 7 && state.inventory.qi_powder) play(state, 'use', { id: 'qi_powder' });
  }
  choose(state, index);
  assert.equal(state.combat.id, expected);
  const startingHealth = state.hp;
  const turns = { enemy: expected, attack: 0, guard: 0, art: 0, use: 0, damageTaken: 0 };
  const day = state.day;
  while (state.combat) {
    const { intent, maxHp, maxQi } = view(state);
    const kind = intent?.kind;
    const pressureArt = state.realm >= 4 ? 'sky_axis' : 'cliff_cut';
    const heavyCost = state.realm >= 4 ? 7 : 4;
    let move = 'attack';
    let id;
    if (kind !== 'heavy' && state.hp < maxHp * 0.5 && state.inventory.heal_pill) {
      move = 'use';
      id = 'heal_pill';
    } else if (kind !== 'heavy' && state.hp < maxHp * 0.36 && state.inventory.salve) {
      move = 'use';
      id = 'salve';
    } else if (kind === 'guard' && state.qi < heavyCost && state.inventory.qi_powder) {
      move = 'use';
      id = 'qi_powder';
    } else if (kind === 'guard' && state.qi <= maxQi - rules.guardQiRecovery) {
      move = 'guard';
    } else if ((['heal', 'heavy'].includes(kind) || (boss && kind !== 'guard')) && state.qi >= heavyCost) {
      move = 'art';
      id = pressureArt;
    } else if (kind === 'heavy') {
      move = 'guard';
    } else if (kind !== 'guard' && state.qi >= heavyCost + 4) {
      move = 'art';
      id = 'bell_strike';
    }
    const result = play(state, move, { id });
    turns[move] += 1;
    turns.damageTaken += result.damageTaken ?? 0;
    assert.ok(state.day - day < 7, `stalled on ${expected}`);
  }
  assert.ok(state.defeated.includes(expected), `lost to ${expected}, began at ${startingHealth} health\n${state.log.slice(-12).join('\n')}`);
  assert.ok(state.event, `winner was not returned to ${expected}'s scene`);
  assert.deepEqual(view(state).groundLoot, {}, 'human opponents gave no body drops');
  ledger.push(turns);
  return turns;
}

test('a normal outfitted traveler clears ten opponents with distinct tactics, may rest, then returns the ledger exactly once', (t) => {
  const state = traveler();
  const ledger = [];
  const startDay = state.day;
  const startCoins = state.coins;
  const startFood = state.inventory.ration;
  const startHealing = state.inventory.heal_pill;
  const startQi = state.inventory.qi_powder;
  const startSalve = state.inventory.salve;

  // These are still the normal places people used before the patrol began.
  shift(state, ['salt_ledger_barrows', 'chalk_hoof_trail'], 'sand_approach_hoof');
  assert.equal(knownHere(state, 'border_hoof_patrol'), false);
  go(state, 'mingsha_city');
  watchBriefing(state);
  assert.equal(view(state).quests.some(({ id }) => id === 'border_close_account'), false);

  // Start with the middle patrol. The rewards are for work and are left unclaimed until payment.
  shift(state, ['silk_tent_road'], 'border_cart_patrol');
  assert.equal(available(state, 1), false);
  const coinsBefore = state.coins;
  fight(state, 0, 'border_axle_poleman', ledger);
  assert.equal(state.coins, coinsBefore);
  assert.match(choose(state, 1).outcome, /架风板/);
  assert.equal(state.coins, coinsBefore + 20);
  assert.equal(act(state, 'choose', { index: 1 }).ok, false);

  // Leave the two other independent patrols undone while the first lead opens the ridge.
  shift(state, ['guest_mill', 'sand_bell_cloister', 'wind_slate'], 'border_wind_track');
  assert.equal(available(state, 1), false);
  fight(state, 0, 'border_wind_ambusher', ledger);
  const afterAmbush = [state.hp, state.qi];
  choose(state, 2);
  assert.ok(state.hp > afterAmbush[0] || state.qi > afterAmbush[1]);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);

  // Break off at a real inn, then continue from the second encounter.
  go(state, 'sand_bell_cloister');
  refillAtInn(state);
  shift(state, ['wind_slate'], 'border_wind_track');
  assert.equal(available(state, 0), false);
  fight(state, 1, 'border_rope_warden', ledger);
  choose(state, 3);

  shift(state, ['cold_kiln'], 'border_kiln_depot');
  assert.equal(available(state, 3), false);
  fight(state, 0, 'border_kiln_shield', ledger);
  choose(state, 1);
  fight(state, 2, 'border_kiln_brazier', ledger);
  choose(state, 3);

  shift(state, ['hollow_silo'], 'border_silo_den');
  choose(state, 0);
  assert.equal(available(state, 4), false);
  fight(state, 2, 'border_silo_roof', ledger);
  assert.equal(available(state, 4), false);
  assert.match(act(state, 'choose', { index: 4 }).message, /1/);
  fight(state, 1, 'border_silo_chain', ledger);
  assert.equal(available(state, 4), true);
  choose(state, 3);
  fight(state, 4, 'border_silo_leader', ledger);

  // Full bags leave ordinary rewards where granted. The key ledger can still come out with the player.
  const oldOre = state.inventory.ore;
  state.inventory.ore = rules.backpackCapacity * rules.backpackStackSize;
  choose(state, 5);
  assert.equal(state.inventory.border_warehouse_ledger, 1);
  assert.equal(view(state).groundLoot.black_iron, 3);
  if (oldOre) state.inventory.ore = oldOre;
  else delete state.inventory.ore;
  play(state, 'take', { id: 'black_iron' });
  assert.equal(state.inventory.black_iron, 3);
  assert.equal(act(state, 'choose', { index: 5 }).ok, false);

  go(state, 'sand_bell_cloister');
  refillAtInn(state);
  go(state, 'mingsha_city');
  assert.ok(view(state).quests.find(({ id }) => id === 'border_close_account')?.ready);
  play(state, 'handin', { id: 'border_close_account' });
  assert.equal(state.inventory.border_warehouse_ledger, undefined);
  assert.equal(state.inventory.border_watch_charm, 1);
  assert.equal(act(state, 'handin', { id: 'border_close_account' }).ok, false);

  shift(state, ['salt_ledger_barrows'], 'border_salt_patrol');
  fight(state, 0, 'border_ledger_cutter', ledger);
  choose(state, 1);
  shift(state, ['chalk_hoof_trail'], 'border_hoof_patrol');
  fight(state, 0, 'border_ridge_runner', ledger);
  choose(state, 1);

  const totals = ['attack', 'guard', 'art', 'use', 'damageTaken'].reduce((all, key) => ({
    ...all, [key]: ledger.reduce((sum, entry) => sum + entry[key], 0),
  }), {});
  const turns = totals.attack + totals.guard + totals.art + totals.use;
  assert.equal(new Set(ledger.map(({ enemy }) => enemy)).size, 10);
  assert.ok(turns >= 50 && turns <= 115);
  assert.ok(totals.guard > 0 && totals.art > 0 && totals.attack > 0);
  assert.equal(state.coins - startCoins, 206);
  t.diagnostic(`10 bouts, ${turns} rounds: ${JSON.stringify(totals)}`);
  t.diagnostic(ledger.map((entry) => `${entry.enemy}:${entry.attack + entry.guard + entry.art + entry.use}`).join(', '));
  t.diagnostic(`From first arrival: ${state.day - startDay} game days, ${state.coins - startCoins} coins net, ${startFood + 4 - (state.inventory.ration ?? 0)} rations eaten.`);
  t.diagnostic(`Stock change: ${startHealing - (state.inventory.heal_pill ?? 0)} healing pills used, ${startQi - (state.inventory.qi_powder ?? 0)} qi powders used, ${(state.inventory.salve ?? 0) - startSalve} salves gained.`);
});

test('crews return on a timed shift and each victory holds its own uncollected pay', () => {
  const state = traveler(2);
  watchBriefing(state);
  shift(state, ['salt_ledger_barrows', 'chalk_hoof_trail'], 'border_hoof_patrol');
  const coins = state.coins;
  assert.equal(available(state, 1), false);
  fight(state, 0, 'border_ridge_runner');
  assert.equal(state.coins, coins);
  assert.equal(available(state, 0), false);
  assert.equal(available(state, 1), true);
  const returnAt = state.localPools.border_hoof_patrol.creatures.border_ridge_runner.nextAt;
  assert.ok(returnAt > state.day + 6);
  play(state, 'leave');
  while (state.day < returnAt - rules.exploreDays) {
    eatBeforeMoving(state);
    play(state, 'wait');
  }
  visit(state, 'border_hoof_patrol');
  assert.equal(available(state, 0), true);
  assert.equal(available(state, 1), true);

  // Settle both actual wins later, without losing the first or generating a third payment.
  go(state, 'mingsha_city');
  refillAtInn(state);
  shift(state, ['salt_ledger_barrows', 'chalk_hoof_trail'], 'border_hoof_patrol');
  fight(state, 0, 'border_ridge_runner');
  assert.equal(state.coins, coins);
  choose(state, 1);
  assert.equal(state.coins, coins + 16);
  assert.equal(available(state, 1), true);
  choose(state, 1);
  assert.equal(state.coins, coins + 32);
  assert.equal(act(state, 'choose', { index: 1 }).ok, false);
});

test('a weak arrival can turn back, or fall and return without opening stages or earning wages', () => {
  const state = traveler(0);
  watchBriefing(state);
  shift(state, ['salt_ledger_barrows', 'chalk_hoof_trail'], 'border_hoof_patrol');
  const coins = state.coins;
  choose(state, 0);
  assert.equal(view(state).currentEnemy.sparring, false);
  const beforeRetreat = state.hp;
  assert.ok(play(state, 'retreat').damageTaken < beforeRetreat);
  assert.equal(state.region, 'chalk_hoof_trail');
  visit(state, 'border_hoof_patrol');
  assert.equal(available(state, 0), true);
  assert.equal(available(state, 1), false);
  assert.equal(state.coins, coins);
  state.hp = 1;
  choose(state, 0);
  play(state, 'attack');
  assert.equal(state.region, 'mingsha_city');
  assert.ok(state.wounds > 0);
  assert.equal(state.siteVictories.border_hoof_patrol, undefined);
  assert.equal(state.seenChoices.includes('border_hoof_patrol:1'), false);
  assert.equal(state.defeated.includes('border_ridge_runner'), false);
  for (const region of ['sand_bell_cloister', 'wind_slate']) go(state, region);
  assert.equal(knownHere(state, 'border_wind_track'), false);
  assert.equal(act(state, 'visit', { id: 'border_wind_track' }).ok, false);
});
