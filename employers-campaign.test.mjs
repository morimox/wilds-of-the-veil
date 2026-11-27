import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame, stageRetreatOpening } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action} ${JSON.stringify(payload)}: ${result.message}`);
  return result;
}

function arriveAtZhao() {
  const state = createGame(3241);
  state.region = 'zhao_city';
  state.discovered.push('zhao_city');
  state.world.arrived = true;
  state.world.lastSettlement = 'zhao_city';
  state.realm = 3;
  state.coins = 50;
  Object.assign(state.inventory, { ration: 9, wood: 2, hide: 1, ore: 1, heal_pill: 5, qi_powder: 4 });
  for (const id of ['sky_sword', 'sky_cloak', 'hide_shield', 'tide_charm', 'breath_belt']) {
    const gear = data.gear.find((entry) => entry.id === id);
    state.inventory[id] = 1;
    state.durability[id] = gear.durability;
    play(state, 'equip', { id });
  }
  state.inventory.resin_staff = 1;
  state.durability.resin_staff = data.gear.find(({ id }) => id === 'resin_staff').durability;
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  return state;
}

function choose(state, index) {
  return play(state, 'choose', { index });
}

function takeRoad(state, ...regions) {
  if (state.event) play(state, 'leave');
  for (const id of regions) {
    if (state.satiety < 32) play(state, 'eat', { id: 'ration' });
    play(state, 'travel', { id });
  }
}

function restUntilReady(state) {
  for (let i = 0; i < 4; i += 1) {
    if (state.hp === view(state).maxHp && state.qi === view(state).maxQi && state.toxin === 0) break;
    play(state, 'rest');
  }
}

function option(state, index) {
  return view(state).visibleChoices.find((entry) => entry.index === index);
}

function bout(state, index, enemy) {
  if (state.satiety < 35) play(state, 'eat', { id: 'ration' });
  const chief = enemy === 'zhao_cargo_keeper' || enemy === 'zhao_sluice_anchor';
  if (enemy === 'zhao_cargo_keeper') play(state, 'equip', { id: 'resin_staff' });
  const { maxHp, maxQi } = view(state);
  if (state.inventory.heal_pill && state.hp < (chief ? maxHp - 15 : maxHp / 2)) play(state, 'use', { id: 'heal_pill' });
  while (state.inventory.qi_powder && state.qi <= (chief ? maxQi - 7 : 4)) play(state, 'use', { id: 'qi_powder' });
  choose(state, index);
  assert.equal(view(state).currentEnemy.id, enemy);
  const site = state.combat.siteId;
  const previous = state.siteVictories[site]?.[enemy] ?? 0;
  let turns = 0;
  while (state.combat && turns < 22) {
    const { intent, combatWeapon } = view(state);
    const kind = intent?.kind;
    if (state.hp < maxHp * 0.55 && state.inventory.heal_pill && kind !== 'heavy') play(state, 'use', { id: 'heal_pill' });
    else if (kind === 'heavy') play(state, 'guard');
    else if (kind === 'guard' && combatWeapon.spellQi > state.qi && state.inventory.qi_powder) play(state, 'use', { id: 'qi_powder' });
    else if (combatWeapon.spellQi && state.qi >= combatWeapon.spellQi && kind !== 'guard') play(state, 'weaponSpell');
    else play(state, 'attack');
    turns += 1;
  }
  assert.equal(state.combat, null, `${enemy} ran past ${turns} turns`);
  assert.equal(state.event, site, `victory returns to ${site}\n${state.log.slice(-12).join('\n')}`);
  assert.equal(state.siteVictories[site][enemy], previous + 1);
  return turns;
}

function finishStops(state, first, second, note) {
  const front = state.event;
  assert.match(option(state, 2).lockedReason, /4/);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  let turns = bout(state, 0, first);
  assert.match(option(state, 2).lockedReason, /3/);
  assert.equal(option(state, 0).retired, false, 'the second fixed guard must still appear in the site screen');
  play(state, 'leave');
  play(state, 'visit', { id: front });
  assert.match(option(state, 2).lockedReason, /3/);
  assert.equal(option(state, 0).retired, false, 'reentering does not hide the surviving fixed guard');
  turns += bout(state, 1, second);
  turns += bout(state, 0, first);
  assert.match(option(state, 2).lockedReason, /1/);
  turns += bout(state, 1, second);
  assert.equal(option(state, 2).available, true);
  assert.equal(option(state, 0).retired, true);
  assert.equal(option(state, 1).retired, true);
  assert.equal(state.inventory[note], undefined, 'proof is at the site, outside the combat reward');
  choose(state, 2);
  assert.equal(state.inventory[note], 1);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  return turns;
}

function finishSource(state, first, second, chief) {
  assert.equal(option(state, 3), undefined, 'boss is only identified at the inner approach');
  assert.equal(option(state, 4), undefined);
  let turns = bout(state, 0, first);
  turns += bout(state, 0, first);
  turns += bout(state, 1, second);
  choose(state, 2);
  assert.equal(option(state, 3).available, true);
  assert.equal(option(state, 4), undefined);
  choose(state, 3);
  assert.equal(view(state).currentEnemy.id, chief);
  const site = state.combat.siteId;
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  assert.equal(state.siteVictories[site][chief], undefined, 'retreat never clears a guard');
  play(state, 'visit', { id: site });
  assert.equal(option(state, 3).available, true);
  turns += bout(state, 3, chief);
  assert.equal(option(state, 4).available, true);
  assert.equal(option(state, 3), undefined, 'the one-off lookout no longer advertises a fight');
  return turns;
}

test('cargo cover pays the deposit once and exhibits exactly eight persistent victories', (context) => {
  const state = arriveAtZhao();
  play(state, 'visit', { id: 'zhao_public_scales' });
  choose(state, 0);
  assert.equal(state.coins, 36);
  assert.equal(state.inventory.zhao_sluice_agreement, undefined);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.equal(act(state, 'choose', { index: 1 }).ok, false);
  assert.equal(option(state, 1), undefined);
  assert.equal(state.inventory.wood, 2);
  takeRoad(state, 'flood_market', 'glass_bank');
  play(state, 'visit', { id: 'zhao_cargo_pole' });
  let turns = finishStops(state, 'zhao_cargo_roper', 'zhao_cargo_archer', 'zhao_cargo_receipt');
  assert.deepEqual(view(state).groundLoot, {});
  takeRoad(state, 'flood_market', 'zhao_city');
  const frontPay = { id: 'zhao_cargo_front_pay' };
  play(state, 'visit', { id: 'zhao_public_scales' });
  assert.deepEqual(view(state).siteQuests.map(({ id }) => id), [frontPay.id]);
  play(state, 'handin', frontPay);
  assert.match(view(state).currentEvent.text, /押钱一栏划清/);
  assert.equal(view(state).siteQuests.length, 0);
  assert.equal(state.coins, 79);
  assert.equal(act(state, 'handin', frontPay).ok, false);
  assert.equal(state.inventory.zhao_cargo_receipt ?? 0, 0);
  play(state, 'leave');
  restUntilReady(state);
  takeRoad(state, 'flood_market', 'glass_bank', 'beacon_reefs');
  play(state, 'visit', { id: 'zhao_cargo_blue_reef' });
  turns += finishSource(state, 'zhao_cargo_shield', 'zhao_cargo_hook', 'zhao_cargo_keeper');
  assert.ok(!state.seenChoices.includes('zhao_sluice_outer_isle:2'));
  assert.equal(state.inventory.zhao_cargo_ledger, undefined);
  choose(state, 4);
  assert.equal(act(state, 'choose', { index: 4 }).ok, false);
  takeRoad(state, 'glass_bank', 'flood_market', 'zhao_city');
  const deepPay = { id: 'zhao_cargo_deep_pay' };
  play(state, 'visit', { id: 'zhao_public_scales' });
  assert.deepEqual(view(state).siteQuests.map(({ id }) => id), [deepPay.id]);
  play(state, 'handin', deepPay);
  assert.match(view(state).currentEvent.text, /各家该补回的米/);
  assert.equal(state.coins, 147);
  assert.equal(state.inventory.zhao_cargo_brace, 1);
  assert.equal(act(state, 'handin', deepPay).ok, false);
  assert.equal(Object.values(state.siteVictories).flatMap(Object.values).reduce((sum, count) => sum + count, 0), 8);
  context.diagnostic(`8 wins, ${turns} battle rounds plus a deliberate retreat, 97 net coins`);
});

test('sluice guard spends the actual wood, hide and ore before paying the repair once', (context) => {
  const state = arriveAtZhao();
  play(state, 'visit', { id: 'zhao_public_scales' });
  state.inventory.hide = 0;
  assert.equal(act(state, 'choose', { index: 1 }).ok, false);
  assert.equal(state.inventory.wood, 2);
  state.inventory.hide = 1;
  choose(state, 1);
  assert.equal(state.inventory.wood ?? 0, 0);
  assert.equal(state.inventory.hide ?? 0, 0);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.equal(option(state, 0), undefined);
  takeRoad(state, 'green_dyke', 'frog_pond', 'ring_isles');
  play(state, 'visit', { id: 'zhao_sluice_outer_isle' });
  assert.ok(!view(state).world.points.some(({ id }) => id === 'jade_mill'));
  let turns = finishStops(state, 'zhao_sluice_eel', 'zhao_sluice_echo', 'zhao_sluice_receipt');
  assert.deepEqual(view(state).world.journeys.find(({ id }) => id === 'jade_mill').path,
    ['ring_isles', 'frog_pond', 'scale_bog', 'jade_mill']);
  assert.deepEqual(view(state).groundLoot, { beast_meat: 4, qi_core: 4 });
  takeRoad(state, 'green_dyke', 'zhao_city');
  play(state, 'visit', { id: 'zhao_public_scales' });
  assert.deepEqual(view(state).siteQuests.map(({ id }) => id), ['zhao_sluice_front_pay']);
  play(state, 'handin', { id: 'zhao_sluice_front_pay' });
  assert.match(view(state).currentEvent.text, /收好了浅洲闸的试水条/);
  assert.equal(state.coins, 84);
  assert.equal(state.inventory.zhao_sluice_receipt ?? 0, 0);
  assert.ok(view(state).world.points.some(({ id }) => id === 'jade_mill'), 'directions survive handing over the note');
  play(state, 'leave');
  restUntilReady(state);
  takeRoad(state, 'green_dyke', 'frog_pond', 'scale_bog', 'jade_mill');
  play(state, 'visit', { id: 'zhao_sluice_mill_intake' });
  turns += finishSource(state, 'zhao_sluice_wash', 'zhao_sluice_shade', 'zhao_sluice_anchor');
  assert.equal(state.inventory.zhao_sluice_witness, undefined);
  state.inventory.ore = 0;
  assert.equal(act(state, 'choose', { index: 4 }).ok, false);
  state.inventory.ore = 1;
  choose(state, 4);
  assert.equal(state.inventory.ore ?? 0, 0);
  assert.equal(act(state, 'choose', { index: 4 }).ok, false);
  takeRoad(state, 'zhao_hermit', 'old_marker', 'measuring_hall', 'zhao_city');
  const deepPay = { id: 'zhao_sluice_deep_pay' };
  play(state, 'visit', { id: 'zhao_public_scales' });
  play(state, 'handin', deepPay);
  assert.match(view(state).currentEvent.text, /新写的放水时辰/);
  assert.equal(state.coins, 142);
  assert.equal(state.inventory.leaf_pill, 2);
  assert.equal(state.inventory.zhao_cargo_brace, undefined);
  assert.equal(act(state, 'handin', deepPay).ok, false);
  assert.equal(Object.values(state.siteVictories).flatMap(Object.values).reduce((sum, count) => sum + count, 0), 8);
  context.diagnostic(`8 wins, ${turns} battle rounds plus a deliberate retreat, 92 coins and 4 material units used`);
});

test('front and final proofs can be handed to the employer in either order', () => {
  for (const [index, first, last, frontOnly, closed] of [
    [0, ['zhao_cargo_receipt', 'zhao_cargo_front_pay'], ['zhao_cargo_ledger', 'zhao_cargo_deep_pay'], /押钱一栏划清/, /各家该补回的米/],
    [1, ['zhao_sluice_receipt', 'zhao_sluice_front_pay'], ['zhao_sluice_witness', 'zhao_sluice_deep_pay'], /收好了浅洲闸的试水条/, /新写的放水时辰/],
  ]) {
    const state = arriveAtZhao();
    play(state, 'visit', { id: 'zhao_public_scales' });
    choose(state, index);
    for (const [id] of [first, last]) {
      state.inventory[id] = 1;
      state.knownItems.push(id);
    }
    const frontFirst = structuredClone(state);
    play(frontFirst, 'handin', { id: first[1] });
    assert.match(view(frontFirst).currentEvent.text, frontOnly);
    play(frontFirst, 'handin', { id: last[1] });
    assert.match(view(frontFirst).currentEvent.text, closed);
    play(state, 'handin', { id: last[1] });
    assert.match(view(state).currentEvent.text, closed);
    assert.deepEqual(view(state).siteQuests.map(({ id }) => id), [first[1]]);
    play(state, 'handin', { id: first[1] });
    assert.match(view(state).currentEvent.text, closed);
    assert.equal(state.coins, frontFirst.coins);
    assert.deepEqual(state.inventory, frontFirst.inventory);
  }
});
