import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function choose(state, index) {
  play(state, 'choose', { index });
}

function walk(state, id) {
  play(state, 'travel', { id });
}

function seek(state, id) {
  play(state, 'visit', { id });
  assert.equal(view(state).currentEvent.id, id);
}

function chooseAt(state, site, index) {
  seek(state, site);
  return play(state, 'choose', { index });
}

function feed(state, minimum) {
  while (state.satiety < minimum) {
    if (!state.inventory.ration && state.region === 'village') play(state, 'rest');
    play(state, 'eat');
  }
}

function uncoverFerryman(state) {
  return chooseAt(state, 'bank_watch', 1);
}

const marshLandmarks = ['reed_banks', 'sunk_pack', 'mud_track', 'bank_watch'];
const siteIds = (state) => view(state).sites.map(({ id }) => id);

test('public village services are accessible immediately while material trades and recipes retain prerequisites', () => {
  let state = createGame();
  const opening = view(state);
  assert.deepEqual(opening.services, ['quests', 'market', 'workshop']);
  assert.deepEqual(opening.discoveredQuests, ['reed_salve']);
  assert.equal(opening.quests.find(({ id }) => id === 'reed_salve').ready, false);
  assert.deepEqual(opening.discoveredRecipes, []);
  assert.deepEqual(opening.discoveredArts, []);
  assert.deepEqual(opening.discoveredItems, ['ration', 'cudgel', 'straw_cape']);
  assert.equal(opening.nextRealm, null);
  const start = JSON.stringify(state);
  for (const [action, payload] of [
    ['handin', { id: 'reed_salve' }], ['handin', { id: 'patch_ferry' }], ['craft', { id: 'r_salve' }],
    ['repair', { id: 'cudgel' }], ['research'], ['breakthrough'], ['learn', { id: 'reed_cleave' }],
    ['buy', { id: 'path_charm' }], ['showHideToSmith'],
  ]) {
    assert.equal(act(state, action, payload).ok, false);
    assert.equal(JSON.stringify(state), start);
  }

  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  assert.deepEqual(siteIds(state), marshLandmarks);
  walk(state, 'village');
  assert.equal(view(state).quests.find(({ id }) => id === 'reed_salve').ready, true);
  assert.equal(view(state).discoveredQuests.includes('apprentice_waterline'), false);
  assert.equal(view(state).discoveredQuests.includes('coat_mend'), false);
  assert.equal(view(state).discoveredItems.includes('path_charm'), false);
  assert.equal(act(state, 'buy', { id: 'path_charm' }).ok, false);
  play(state, 'handin', { id: 'reed_salve' });
  assert.equal(state.inventory.salve, 1);
  assert.ok(!view(state).discovered.includes('ridge'));
  feed(state, 70);
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'mud_track', 1);
  uncoverFerryman(state);
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop']);
  assert.ok(view(state).discoveredRecipes.includes('r_salve'));
  assert.equal(view(state).discoveredRecipes.includes('r_hide_coat'), false);
  feed(state, 35);
  chooseAt(state, 'reed_ferryman', 0);
  assert.equal(view(state).services.includes('cultivate'), false);
  feed(state, 35);
  chooseAt(state, 'drowned_mast', 1);
  walk(state, 'village');
  assert.ok(view(state).discoveredQuests.includes('apprentice_waterline'));
  play(state, 'sell', { id: 'reed' });
  state = JSON.parse(JSON.stringify(state));
  assert.equal(state.inventory.reed, undefined);
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop', 'cultivate']);
  assert.ok(view(state).discoveredRecipes.includes('r_qi'));
  play(state, 'learn', { id: 'reed_cleave' });
});

test('marsh landmarks are consistent across visits and new sites require an actual route clue', () => {
  const state = createGame();
  walk(state, 'marsh');
  assert.deepEqual(siteIds(state), marshLandmarks);
  for (const id of ['bank_watch', 'mud_track', 'sunk_pack', 'reed_banks']) {
    seek(state, id);
    play(state, 'leave');
    assert.deepEqual(siteIds(state), marshLandmarks);
  }
  walk(state, 'village');
  feed(state, 68);
  walk(state, 'marsh');
  assert.deepEqual(siteIds(state), marshLandmarks);
  for (const id of ['reed_ferryman', 'old_fire', 'drowned_mast']) {
    const unchanged = structuredClone(state);
    assert.equal(act(state, 'visit', { id }).ok, false);
    assert.deepEqual(state, unchanged);
  }

  const bank = structuredClone(state);
  assert.match(uncoverFerryman(bank).outcome, /渡工|桨/);
  assert.deepEqual(siteIds(bank).filter(id => !marshLandmarks.includes(id)), ['reed_ferryman']);

  const shallows = structuredClone(state);
  assert.match(chooseAt(shallows, 'sunk_pack', 1).outcome, /渡工|桨/);
  assert.deepEqual(siteIds(shallows).filter(id => !marshLandmarks.includes(id)), ['reed_ferryman']);
  assert.match(chooseAt(shallows, 'reed_ferryman', 2).outcome, /断桅|沉桅/);
  assert.ok(siteIds(shallows).includes('drowned_mast'));
  assert.equal(shallows.inventory.ridge_rubbing, undefined);
  assert.equal(shallows.inventory.reed, undefined);
  assert.deepEqual(shallows.completedQuests, []);

  assert.match(chooseAt(state, 'mud_track', 3).outcome, /石渠/);
  assert.deepEqual(siteIds(state).filter(id => !marshLandmarks.includes(id)), ['old_fire']);
  walk(state, 'village');
  feed(state, 44);
  walk(state, 'marsh');
  assert.deepEqual(siteIds(state).filter(id => !marshLandmarks.includes(id)), ['old_fire']);
});

test('harvesting only gives materials and reveals damage strictly after an action', () => {
  const state = createGame();
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  const choices = view(state).visibleChoices;
  assert.deepEqual(choices.map(({ index }) => index), [0, 1]);
  assert.ok(choices.every((choice) =>
    !['hp', 'injury', 'outcome', 'loot', 'enemy'].some((field) => Object.hasOwn(choice, field))));
  assert.doesNotMatch(JSON.stringify(choices), /割伤|划伤|划破|受伤|蚌壳/);
  const healthBefore = state.hp;
  const result = play(state, 'choose', { index: 1 });
  assert.equal(result.injury.amount, healthBefore - state.hp);
  assert.equal(result.injury.amount, 4);
  assert.match(result.injury.cause, /划破/);
  assert.equal(state.log.some((entry) => entry.includes(result.injury.cause)), false);
  assert.ok(state.inventory.reed);
  assert.deepEqual(siteIds(state), marshLandmarks);
  assert.equal(state.inventory.reed_lines, undefined);
  assert.equal(view(state).deductions.some(({ id }) => id === 'find_eddy'), false);

  walk(state, 'village');
  const handin = play(state, 'handin', { id: 'reed_salve' });
  assert.match(handin.outcome, /膏|伤/);
  assert.equal(state.inventory.salve, 1);
  assert.equal(state.inventory.reed_lines, undefined);
  assert.equal(state.inventory.oar_mark, undefined);
  assert.equal(state.inventory.ridge_rubbing, undefined);
  assert.ok(!view(state).deductions.some(({ id }) => id === 'find_eddy'));
  feed(state, 45);
  walk(state, 'marsh');
  assert.deepEqual(siteIds(state), marshLandmarks);
});

test('chosen sites retain depletion, and only elapsed days replenish their local stocks and animals', () => {
  const huntCount = (state) => view(state).sites.find(({ id }) => id === 'mud_track').creatures.mud_beast;
  const reeds = (state) => view(state).sites.find(({ id }) => id === 'reed_banks').stocks.reed;
  const state = createGame();
  walk(state, 'marsh');
  assert.deepEqual(siteIds(state), marshLandmarks);
  const beforeInvalid = structuredClone(state);
  assert.equal(act(state, 'visit', { id: 'drowned_mast' }).ok, false);
  assert.deepEqual(state, beforeInvalid);

  seek(state, 'reed_banks');
  const reedStart = reeds(state);
  choose(state, 0);
  assert.equal(reeds(state), reedStart - 2);
  chooseAt(state, 'reed_banks', 1);
  assert.equal(state.inventory.reed, reedStart);
  assert.equal(reeds(state), 0);
  assert.equal(Object.hasOwn(view(state).sites.find(({ id }) => id === 'mud_track'), 'creatures'), false);
  seek(state, 'reed_banks');
  assert.match(view(state).currentEvent.text, /采完/);
  const beforeInvalidHarvest = structuredClone(state);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.deepEqual(state, beforeInvalidHarvest);
  play(state, 'leave');
  assert.equal(reeds(state), 0);
  while (state.day < 5) play(state, 'wait');
  assert.ok(reeds(state) > 0);
  const beforeLooking = structuredClone(state);
  view(state);
  assert.deepEqual(state, beforeLooking);

  const hunting = createGame();
  walk(hunting, 'marsh');
  seek(hunting, 'mud_track');
  const initial = huntCount(hunting);
  const retreating = structuredClone(hunting);
  choose(retreating, 0);
  play(retreating, 'retreat');
  assert.equal(huntCount(retreating), initial);
  choose(hunting, 0);
  for (let turn = 0; hunting.combat && turn < 6; turn++) play(hunting, 'attack');
  assert.equal(hunting.combat, null);
  assert.equal(huntCount(hunting), initial - 1);
  assert.ok(hunting.inventory.hide);
  assert.equal(hunting.inventory.reed, undefined);
  assert.deepEqual(hunting.completedQuests, []);
  assert.equal(hunting.inventory.ration, 4);
  const smith = structuredClone(hunting);
  walk(smith, 'village');
  assert.equal(view(smith).discoveredRecipes.includes('r_hide_coat'), false);
  assert.equal(view(smith).discoveredItems.includes('hide_coat'), false);
  assert.equal(act(smith, 'craft', { id: 'r_hide_coat' }).ok, false);
  const dayAtWorkshop = smith.day;
  play(smith, 'showHideToSmith');
  assert.equal(smith.day, dayAtWorkshop);
  assert.equal(smith.inventory.hide, hunting.inventory.hide);
  assert.ok(view(smith).discoveredRecipes.includes('r_hide_coat'));
  assert.ok(view(smith).discoveredItems.includes('hide_coat'));
  play(smith, 'craft', { id: 'r_hide_coat' });
  assert.ok(smith.inventory.hide_coat);
  assert.ok(view(smith).discoveredRecipes.includes('r_hide_coat'));
  seek(hunting, 'mud_track');
  assert.equal(view(hunting).visibleChoices[0].available, false);
  assert.match(view(hunting).currentEvent.text, /平静|看不到鳞片/);
  assert.equal(act(hunting, 'choose', { index: 0 }).ok, false);
  play(hunting, 'leave');
  while (hunting.day < 5) play(hunting, 'wait');
  assert.equal(huntCount(hunting), initial);
  feed(hunting, 20);
  seek(hunting, 'mud_track');
  assert.equal(view(hunting).visibleChoices[0].available, true);
});

test('satiety follows game time and only a deliberate meal consumes food', () => {
  const state = createGame();
  const initialRations = state.inventory.ration;
  const day = state.day;
  assert.equal(view(state).satiety, 68);
  assert.equal(view(state).maxSatiety, rules.maxSatiety);
  assert.equal(view(state).didEat, false);
  play(state, 'eat');
  assert.equal(view(state).didEat, true);
  assert.equal(act(state, 'eat').ok, false);
  assert.equal(state.day, day);

  walk(state, 'marsh');
  assert.equal(state.satiety, 100 - rules.satietyDrainPerDay);
  assert.equal(state.inventory.ration, initialRations - 1);
  seek(state, 'reed_banks');
  assert.equal(state.satiety, 100 - (1 + rules.exploreDays) * rules.satietyDrainPerDay);
  assert.equal(state.hp, view(state).maxHp);
  const beforeEating = state.day;
  play(state, 'eat');
  assert.equal(state.day, beforeEating);
  assert.equal(state.satiety, rules.maxSatiety);
  assert.equal(state.inventory.ration, initialRations - 2);
  choose(state, 0);
  assert.equal(state.satiety, 100 - 0.25 * rules.satietyDrainPerDay);
  assert.equal(state.inventory.ration, initialRations - 2);
  while (state.satiety > 0) play(state, 'wait');
  assert.equal(act(state, 'visit', { id: 'reed_banks' }).ok, false);
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  const beforeReturn = state.day;
  walk(state, 'village');
  assert.equal(state.day - beforeReturn, 1 + rules.emptyReturnDays);
  play(state, 'eat');
  assert.equal(state.satiety, rules.rationSatiety);

  const full = createGame();
  full.combat = { id: 'mud_beast', hp: 25, round: 0, escapeBonus: 0 };
  const hungry = structuredClone(full);
  hungry.satiety = 0;
  assert.ok(play(full, 'attack').damageDealt > play(hungry, 'attack').damageDealt);
});

test('the actual lost basket can be inspected and returned once, or its contents taken instead', () => {
  const state = createGame();
  walk(state, 'marsh');
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  const lifted = chooseAt(state, 'sunk_pack', 0);
  assert.equal(lifted.spilled.lost_basket, 1);
  assert.equal(state.inventory.lost_basket, undefined);
  assert.equal(view(state).groundLoot.lost_basket, 1);
  seek(state, 'sunk_pack');
  assert.match(view(state).currentEvent.text, /篓绳/);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  play(state, 'leave');
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'take', { id: 'lost_basket' });
  assert.equal(state.inventory.lost_basket, 1);
  assert.equal(view(state).groundLoot.lost_basket, undefined);
  assert.equal(state.inventory.salve, undefined);
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  const inspected = play(state, 'inspectBasket');
  assert.ok(inspected.outcome);
  assert.equal(view(state).basketInspected, true);
  assert.equal(state.inventory.lost_basket, 1);

  const wounded = structuredClone(state);
  wounded.hp = 1;
  wounded.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  play(wounded, 'attack');
  assert.equal(wounded.region, 'village');
  assert.equal(wounded.inventory.lost_basket, 1);

  const opened = structuredClone(state);
  play(opened, 'unpackBasket');
  assert.equal(view(opened).basketDisposition, 'unpacked');
  assert.equal(opened.inventory.lost_basket, undefined);
  assert.ok(opened.inventory.salve);
  walk(opened, 'village');
  assert.equal(act(opened, 'handin', { id: 'lost_basket_return' }).ok, false);
  assert.equal(view(opened).discoveredQuests.includes('lost_basket_return'), false);

  walk(state, 'village');
  assert.ok(view(state).quests.some(({ id, ready }) => id === 'lost_basket_return' && ready));
  const handedIn = play(state, 'handin', { id: 'lost_basket_return' });
  assert.ok(handedIn.outcome);
  assert.equal(view(state).basketDisposition, 'returned');
  assert.equal(state.inventory.lost_basket, undefined);
  assert.equal(act(state, 'handin', { id: 'lost_basket_return' }).ok, false);
  assert.equal(act(state, 'unpackBasket').ok, false);
  feed(state, 45);
  walk(state, 'marsh');
  seek(state, 'sunk_pack');
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
});

test('backpack slots are finite and overflow can be picked up in the same place', () => {
  const state = createGame();
  const { backpackCapacity, backpackStackSize } = rules;
  assert.equal(view(state).backpackUsed, 1);
  assert.equal(view(state).backpackCapacity, backpackCapacity);
  state.inventory.ration = backpackCapacity * backpackStackSize - 1;
  assert.equal(view(state).backpackUsed, backpackCapacity);
  assert.equal(act(state, 'unequip', { slot: 'weapon' }).ok, false);
  assert.equal(act(state, 'discard', { id: 'cudgel' }).ok, false);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  const overflow = play(state, 'choose', { index: 0 });
  assert.ok(overflow.spilled.reed > 0);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).groundLoot.reed, overflow.spilled.reed);
  assert.equal(act(state, 'take', { id: 'reed' }).ok, false);
  assert.equal(view(state).backpackUsed, backpackCapacity);
  play(state, 'discard', { id: 'ration', count: backpackStackSize });
  assert.equal(view(state).groundLoot.ration, backpackStackSize);
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, overflow.spilled.reed);
  assert.equal(view(state).groundLoot.reed, undefined);
  const before = state.inventory.ration;
  play(state, 'take', { id: 'ration' });
  assert.equal(state.inventory.ration, backpackStackSize * (backpackCapacity - 1));
  assert.equal(view(state).groundLoot.ration, backpackStackSize - (state.inventory.ration - before));
  walk(state, 'village');
  assert.deepEqual(view(state).groundLoot, {});
  walk(state, 'marsh');
  assert.ok(view(state).groundLoot.ration > 0);
});

test('capacity checks do not charge for a refused transaction and discarded gear keeps its wear', () => {
  const state = createGame();
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  walk(state, 'village');
  state.inventory = { cudgel: 1, straw_cape: 1, reed: 2, ration: (rules.backpackCapacity - 1) * rules.backpackStackSize };
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);
  const before = structuredClone(state);
  for (const [action, payload] of [
    ['craft', { id: 'r_qi' }], ['buy', { id: 'ration' }], ['handin', { id: 'reed_salve' }],
  ]) {
    assert.match(act(state, action, payload).message, /行囊已满/);
    assert.deepEqual(state, before);
  }
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'craft', { id: 'r_qi' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'handin', { id: 'reed_salve' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  state.durability.cudgel = 5;
  play(state, 'unequip', { slot: 'weapon' });
  play(state, 'discard', { id: 'cudgel' });
  play(state, 'take', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, 5);
});

test('the boatman and village smith trade maps that open travel for a beginning character', () => {
  const state = createGame();
  assert.deepEqual(view(state).discovered, ['village', 'marsh']);
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  assert.equal(view(state).discoveredItems.includes('sand'), false);
  assert.equal(view(state).discoveredQuests.includes('last_lantern'), false);
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'mud_track', 1);
  feed(state, 60);
  uncoverFerryman(state);
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  feed(state, 60);
  const before = { reed: state.inventory.reed, wood: state.inventory.wood };
  const exchange = chooseAt(state, 'reed_ferryman', 0);
  assert.match(exchange.outcome, /沉钟岭的路图/);
  assert.equal(state.inventory.reed ?? 0, before.reed - 2);
  assert.equal(state.inventory.wood, before.wood - 1);
  assert.equal(state.inventory.ridge_rubbing, 1);
  assert.ok(view(state).discovered.includes('ridge'));
  assert.deepEqual(state.completedQuests, []);

  const reloaded = JSON.parse(JSON.stringify(state));
  feed(reloaded, 70);
  walk(reloaded, 'ridge');
  assert.equal(view(reloaded).realmIndex, 0);
  assert.deepEqual(siteIds(reloaded), ['ore_rain', 'empty_oven', 'miner_echo', 'rope_run']);
  assert.equal(act(reloaded, 'travel', { id: 'ford' }).ok, false);
  chooseAt(reloaded, 'ore_rain', 0);
  assert.equal(siteIds(reloaded).includes('stone_niche'), false);
  const detour = structuredClone(reloaded);
  seek(detour, 'miner_echo');
  play(detour, 'leave');
  assert.equal(siteIds(detour).includes('stone_niche'), false);
  feed(detour, 35);
  assert.match(chooseAt(detour, 'miner_echo', 2).outcome, /石龛/);
  assert.equal(siteIds(detour).includes('stone_niche'), true);
  assert.equal(siteIds(detour).includes('cracked_bell'), false);
  feed(detour, 30);
  assert.match(chooseAt(detour, 'stone_niche', 1).outcome, /裂钟|石阶/);
  assert.equal(siteIds(detour).includes('cracked_bell'), true);
  walk(reloaded, 'village');
  const ore = reloaded.inventory.ore;
  const mapTrade = play(reloaded, 'handin', { id: 'sell_forging' });
  assert.match(mapTrade.outcome, /通往闭潮渡的水图/);
  assert.equal(reloaded.inventory.ore, ore - 1);
  assert.equal(reloaded.inventory.ford_chart, 1);
  feed(reloaded, 65);
  walk(reloaded, 'ford');
  assert.equal(view(reloaded).realmIndex, 0);
  assert.deepEqual(siteIds(reloaded), ['low_tide', 'boat_shade', 'flood_lines', 'lock_deck']);
});

test('the opponent carries another copy of the first map until a fight is won', () => {
  const state = createGame();
  walk(state, 'marsh');
  chooseAt(state, 'bank_watch', 0);
  assert.equal(view(state).currentEnemy.id, 'bank_runner');
  assert.equal(state.inventory.ridge_rubbing, undefined);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(state.didEat, false);

  const retreating = structuredClone(state);
  play(retreating, 'retreat');
  assert.equal(retreating.inventory.ridge_rubbing, undefined);
  assert.equal(act(retreating, 'travel', { id: 'ridge' }).ok, false);

  for (let turn = 0; state.combat && turn < 10; turn++) {
    play(state, view(state).intent.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.ok(view(state).defeated.includes('bank_runner'));
  assert.equal(state.inventory.ridge_rubbing, 1);
  assert.equal(view(state).sites.find(({ id }) => id === 'bank_watch').creatures.bank_runner, 0);
  feed(state, 60);
  walk(state, 'ridge');
  assert.equal(view(state).realmIndex, 0);
});

test('a spent expedition can abandon an event and reach free relief without resetting progress', () => {
  const state = createGame();
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  state.satiety = 0;
  state.inventory.ration = 0;
  const before = JSON.stringify(state);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.equal(JSON.stringify(state), before);
  play(state, 'leave');
  walk(state, 'village');
  play(state, 'rest');
  assert.ok(state.inventory.ration >= 3);
  assert.equal(act(state, 'sell', { id: 'ration' }).ok, false);
  assert.equal(view(state).insight, 1);
});

test('damage wears equipped gear, defeating an enemy rewards only first-kill insight, and falling is recoverable', () => {
  const state = createGame();
  walk(state, 'marsh');
  const before = state.durability.cudgel;
  state.combat = { id: 'mud_beast', hp: 1, round: 0, escapeBonus: 0 };
  const finishingBlow = play(state, 'attack');
  assert.equal(finishingBlow.damageDealt, 1);
  assert.equal(finishingBlow.damageTaken, 0);
  assert.equal(state.durability.cudgel, before - 1);
  const insight = state.insight;
  state.combat = { id: 'mud_beast', hp: 1, round: 0, escapeBonus: 0 };
  play(state, 'attack');
  assert.equal(state.insight, insight);
  assert.ok(state.inventory.hide > 0);

  state.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  state.inventory.kiln_shard = 1;
  state.expeditionLoot.kiln_shard = 1;
  state.hp = 1;
  assert.equal(play(state, 'attack').damageTaken, 1);
  assert.equal(view(state).mode, 'village');
  assert.equal(state.wounds, 1);
  assert.equal(state.inventory.hide, undefined);
  assert.ok(state.inventory.cudgel);
  assert.equal(state.inventory.kiln_shard, 1);
  play(state, 'rest');
  assert.equal(state.wounds, 0);
  assert.ok(state.hp > 1);
  play(state, 'repair', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, before);
});

test('a bow found by following material knowledge hits a furred beast harder', () => {
  const state = createGame();
  for (const { entry } of data.gear) {
    assert.ok(entry);
    assert.doesNotMatch(entry, /[0-9]/);
  }
  assert.equal(view(state).discoveredRecipes.includes('r_reed_bow'), false);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  choose(state, 0);
  assert.equal(view(state).discoveredRecipes.includes('r_reed_bow'), false);
  chooseAt(state, 'reed_banks', 1);
  seek(state, 'mud_track');
  choose(state, 1);
  walk(state, 'village');
  assert.ok(view(state).discoveredRecipes.includes('r_reed_bow'));
  play(state, 'craft', { id: 'r_reed_bow' });
  play(state, 'equip', { id: 'reed_bow' });
  feed(state, 50);
  walk(state, 'marsh');
  seek(state, 'mud_track');
  choose(state, 2);
  assert.equal(view(state).currentEnemy.id, 'reed_fox');

  const broken = structuredClone(state);
  broken.durability.reed_bow = 0;
  play(broken, 'attack');
  assert.equal(view(broken).currentEnemy.hp, 24 - 7);
  const scaled = structuredClone(state);
  scaled.combat = { id: 'mud_beast', hp: 25, round: 0, escapeBonus: 0 };
  play(scaled, 'attack');
  assert.equal(view(scaled).currentEnemy.hp, 25 - 8);

  play(state, 'attack');
  assert.equal(view(state).currentEnemy.hp, 24 - 13);
  play(state, 'attack');
  assert.equal(view(state).mode, 'field');
  assert.ok(view(state).defeated.includes('reed_fox'));
});

test('weapon piercing and armor effects follow the actual enemy and intent', () => {
  const state = createGame();
  walk(state, 'marsh');
  state.inventory.knife = 1;
  state.durability.knife = 30;
  state.inventory.hide_coat = 1;
  state.durability.hide_coat = 29;
  play(state, 'equip', { id: 'knife' });
  play(state, 'equip', { id: 'hide_coat' });
  state.combat = { id: 'mud_beast', hp: 25, round: 0, escapeBonus: 0 };
  const beforeBeast = state.hp;
  play(state, 'attack');
  assert.equal(view(state).currentEnemy.hp, 25 - 11);
  assert.equal(state.hp, beforeBeast - 1);

  state.combat = { id: 'marsh_ghost', hp: 28, round: 1, escapeBonus: 0 };
  const beforeSpirit = state.hp;
  play(state, 'attack');
  assert.equal(view(state).currentEnemy.hp, 28 - 9);
  assert.equal(state.hp, beforeSpirit - 4);

  state.combat = null;
  state.realm = 1;
  state.inventory.iron_coat = 1;
  state.durability.iron_coat = 38;
  play(state, 'equip', { id: 'iron_coat' });
  state.hp = 40;
  state.combat = { id: 'ore_wight', hp: 40, round: 0, escapeBonus: 0 };
  play(state, 'attack');
  assert.equal(state.hp, 40 - 5);
  play(state, 'attack');
  assert.equal(state.hp, 40 - 5 - 12);
});

test('restoratives heal, toxin applies at the threshold, and a retreat talisman is spent immediately', () => {
  const state = createGame();
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  walk(state, 'village');
  play(state, 'handin', { id: 'reed_salve' });
  const salve = data.pills.find(({ id }) => id === 'salve');
  const maxHp = view(state).maxHp;
  state.hp = maxHp - salve.hp - 2;
  state.toxin = rules.toxinThreshold - salve.toxin;
  assert.match(play(state, 'use', { id: 'salve' }).message, /敷在伤口/);
  assert.equal(state.hp, maxHp - 2 - rules.toxinDamage);
  assert.equal(state.inventory.salve, undefined);
  play(state, 'rest');
  assert.equal(state.toxin, rules.toxinThreshold - rules.restToxin);
  assert.equal(state.hp, maxHp);

  walk(state, 'marsh');
  state.inventory.reed_talisman = 1;
  state.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  const before = state.hp;
  play(state, 'use', { id: 'reed_talisman' });
  assert.equal(state.hp, before);
  assert.equal(state.inventory.reed_talisman, undefined);
  assert.equal(view(state).mode, 'field');
});

test('the board keeps the player’s own guess and only the physical trial can verify it', () => {
  const state = createGame();
  const id = 'find_eddy';
  const guess = { id, evidence: [], hypothesis: '浮沫多的地方也许更好走。' };
  const settings = { release: 'stone_back', water: 'rising' };
  const beforeRevealed = state.day;
  assert.equal(view(state).deductions.some((entry) => entry.id === id), false);
  assert.equal(act(state, 'deduce', guess).ok, false);
  assert.equal(state.day, beforeRevealed);
  play(state, 'buy', { id: 'ration', count: 4 });
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  choose(state, 0);
  assert.equal(view(state).deductions.some((entry) => entry.id === id), false);
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'mud_track', 1);
  feed(state, 50);
  uncoverFerryman(state);
  feed(state, 40);
  chooseAt(state, 'reed_ferryman', 0);
  walk(state, 'village');
  play(state, 'handin', { id: 'apprentice_waterline' });
  assert.equal(state.completedQuests.includes('reed_salve'), false);
  const opened = view(state);
  const visible = opened.deductions.find((entry) => entry.id === id);
  assert.equal(visible.completed, false);
  assert.equal(visible.thought, null);
  for (const field of ['answer', 'hypotheses', 'evidence', 'reward', 'expected', 'success', 'miss']) {
    assert.equal(Object.hasOwn(visible, field), false);
  }
  const evidence = ['reed_lines', 'oar_mark'];
  assert.ok(evidence.every((itemId) => opened.evidence.some((item) => item.id === itemId && item.count > 0)));
  const beforeDay = state.day;
  const beforeInsight = state.insight;
  for (const malformed of [
    { ...guess, hypothesis: '  ' }, { ...guess, hypothesis: '猜'.repeat(181) },
    { ...guess, evidence: ['echo_note'] }, { ...guess, evidence: ['ration'] },
  ]) {
    assert.equal(act(state, 'deduce', malformed).ok, false);
  }
  assert.equal(act(state, 'experiment', { id, settings }).ok, false);
  assert.equal(play(state, 'deduce', guess).deduction, 'pinned');
  const revised = { id, evidence: ['ridge_rubbing'], hypothesis: '水退时不妨看看石头后头。' };
  assert.equal(play(state, 'deduce', revised).deduction, 'pinned');
  assert.deepEqual(view(state).deductions.find(entry => entry.id === id).thought, {
    hypothesis: revised.hypothesis, evidence: revised.evidence,
  });
  assert.equal(state.day, beforeDay);
  assert.equal(state.insight, beforeInsight);
  assert.equal(state.inventory.eddy_note, undefined);
  assert.equal(view(state).discoveredRecipes.includes('r_bank_talisman'), false);

  feed(state, 60);
  walk(state, 'marsh');
  seek(state, 'mud_track');
  assert.equal(view(state).experiment, null);
  assert.equal(act(state, 'experiment', { id, settings }).ok, false);
  play(state, 'leave');
  seek(state, 'drowned_mast');
  assert.ok(view(state).experiment);
  for (const field of ['answer', 'expected', 'need', 'reward', 'success', 'miss']) {
    assert.equal(Object.hasOwn(view(state).experiment, field), false);
  }
  const noProof = structuredClone(state);
  delete noProof.inventory.reed_lines;
  assert.equal(view(noProof).experiment, null);
  assert.equal(act(noProof, 'experiment', { id, settings }).ok, false);
  const noThought = structuredClone(state);
  delete noThought.deductionThoughts;
  assert.equal(view(noThought).experiment, null);

  const beforeTrial = state.day;
  const beforeTrialInsight = state.insight;
  assert.equal(act(state, 'experiment', { id, settings: { release: 'stone_back' } }).ok, false);
  assert.equal(act(state, 'experiment', { id, settings: { ...settings, reward: 'eddy_note' } }).ok, false);
  assert.equal(state.day, beforeTrial);
  const miss = play(state, 'experiment', { id, settings: { ...settings, release: 'open_bank' } });
  assert.equal(miss.deduction, 'miss');
  assert.ok(state.day > beforeTrial);
  assert.ok(miss.message);
  assert.equal(view(state).currentEvent.id, 'drowned_mast');
  assert.equal(view(state).deductions.find(entry => entry.id === id).completed, false);
  assert.equal(state.insight, beforeTrialInsight);
  assert.equal(state.inventory.eddy_note, undefined);
  assert.equal(play(state, 'experiment', { id, settings }).deduction, 'verified');
  assert.ok(state.insight > beforeTrialInsight);
  assert.ok(evidence.every((itemId) => state.inventory[itemId] >= 1));
  assert.equal(state.inventory.eddy_note, 1);
  assert.equal(view(state).experiment, null);
  const afterTrial = structuredClone(state);
  assert.equal(act(state, 'experiment', { id, settings }).ok, false);
  assert.deepEqual(state, afterTrial);

  state.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  state.event = null;
  state.hp = 1;
  play(state, 'attack');
  assert.equal(state.inventory.eddy_note, 1);
  const reloaded = JSON.parse(JSON.stringify(state));
  const complete = view(reloaded).deductions.find((entry) => entry.id === id);
  assert.equal(complete.completed, true);
  assert.equal(complete.thought.hypothesis, revised.hypothesis);
  const completedDay = reloaded.day;
  assert.equal(act(reloaded, 'deduce', guess).ok, false);
  assert.equal(act(reloaded, 'experiment', { id, settings }).ok, false);
  assert.equal(reloaded.day, completedDay);
  assert.equal(reloaded.inventory.eddy_note, 1);
});

test('separate mountain observations lead to learning a technique at the site in 炼气', () => {
  const state = createGame();
  const id = 'read_echo';
  play(state, 'buy', { id: 'ration', count: 4 });
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'mud_track', 1);
  uncoverFerryman(state);
  feed(state, 50);
  chooseAt(state, 'reed_ferryman', 0);
  feed(state, 70);
  walk(state, 'ridge');
  chooseAt(state, 'empty_oven', 1);
  assert.equal(state.inventory.echo_note, 1);
  assert.equal(state.knownArts.includes('earth_echo'), false);
  play(state, 'deduce', {
    id, evidence: ['echo_note'], hypothesis: '那幅画上的人手心朝下，也许在等岩壁回应。',
  });
  assert.equal(state.inventory.echo_method, undefined);
  assert.equal(state.knownArts.includes('earth_echo'), false);
  feed(state, 54);
  chooseAt(state, 'miner_echo', 2);
  seek(state, 'stone_niche');
  assert.equal(view(state).experiment, null);
  choose(state, 1);
  assert.equal(state.inventory.stone_rubbing, 1);
  feed(state, 48);
  seek(state, 'stone_niche');
  assert.match(view(state).currentEvent.text, /龛口|矿壳|细缝|石/);
  assert.equal(view(state).experiment.id, id);
  assert.equal(play(state, 'experiment', { id, settings: { hand: 'palm', beat: 'first' } }).deduction, 'miss');
  assert.equal(state.knownArts.includes('earth_echo'), false);
  assert.equal(play(state, 'experiment', { id, settings: { hand: 'palm', beat: 'second' } }).deduction, 'verified');
  assert.equal(state.inventory.echo_method, 1);
  assert.equal(state.knownArts.includes('earth_echo'), true);
  assert.equal(view(state).realmIndex, 0);
  play(state, 'leave');
  feed(state, 40);
  chooseAt(state, 'miner_echo', 0);
  assert.equal(view(state).mode, 'combat');
  const tooSoon = act(state, 'art', { id: 'earth_echo' });
  assert.equal(tooSoon.ok, false);
  assert.match(tooSoon.message, /境界|筑基/);
});

test('a chosen route completes both realms and the main quest, then unlocks the secret map', () => {
  const state = createGame();
  const travelFed = (id) => {
    if (id !== 'village') feed(state, 75);
    walk(state, id);
  };
  const workFed = (id, index) => { feed(state, 45); chooseAt(state, id, index); };
  travelFed('marsh');
  workFed('reed_banks', 0);
  workFed('reed_banks', 1);
  workFed('sunk_pack', 0);
  workFed('sunk_pack', 1);
  workFed('mud_track', 3);
  workFed('old_fire', 1);
  workFed('reed_ferryman', 0);
  workFed('drowned_mast', 1);
  travelFed('village');
  play(state, 'handin', { id: 'lost_basket_return' });
  play(state, 'handin', { id: 'patch_ferry' });
  play(state, 'handin', { id: 'reed_salve' });
  play(state, 'breakthrough');
  assert.equal(view(state).realmIndex, 1);

  travelFed('ridge');
  workFed('ore_rain', 0);
  workFed('ore_rain', 1);
  workFed('empty_oven', 1);
  workFed('miner_echo', 1);
  assert.equal(siteIds(state).includes('stone_niche'), false);
  workFed('rope_run', 0);
  assert.ok(siteIds(state).includes('stone_niche'));
  workFed('stone_niche', 0);
  assert.equal(siteIds(state).includes('cracked_bell'), false);
  travelFed('village');
  const surplus = Math.max(0, (state.inventory.ore ?? 0) - 5);
  if (surplus) play(state, 'sell', { id: 'ore', count: surplus });
  assert.ok(state.inventory.ore >= 5);
  assert.equal(state.inventory.core, 1);
  play(state, 'handin', { id: 'sell_forging' });
  play(state, 'craft', { id: 'r_iron_sword' });
  play(state, 'equip', { id: 'iron_sword' });
  play(state, 'breakthrough');
  assert.equal(view(state).realmIndex, 2);
  assert.ok(view(state).discovered.includes('ford'));
  play(state, 'learn', { id: 'reed_cleave' });
  play(state, 'learn', { id: 'stone_brace' });

  travelFed('ford');
  workFed('low_tide', 0);
  workFed('flood_lines', 0);
  assert.equal(siteIds(state).includes('tide_keeper'), false);
  workFed('lock_deck', 1);
  assert.ok(siteIds(state).includes('tide_keeper'));
  workFed('tide_keeper', 0);
  assert.equal(view(state).currentEnemy.id, 'tide_spirit');

  const techniqueCost = 2;
  for (let turn = 0; turn < 10 && view(state).mode === 'combat'; turn++) {
    const panel = view(state);
    if (panel.intent.kind === 'guard' && panel.hp < panel.maxHp - 8 && state.inventory.salve) {
      play(state, 'use', { id: 'salve' });
    } else if (panel.intent.kind === 'heavy' && panel.currentEnemy.hp > 17 && panel.qi >= techniqueCost) {
      play(state, 'art', { id: 'stone_brace' });
    } else if (state.inventory.tide_talisman && panel.currentEnemy.hp > 17) {
      play(state, 'use', { id: 'tide_talisman' });
    } else if (panel.qi >= techniqueCost) {
      play(state, 'art', { id: 'reed_cleave' });
    } else {
      play(state, 'attack');
    }
  }
  assert.equal(view(state).mode, 'field', state.log.slice(-8).join('\n'));
  assert.equal(state.inventory.seal, 1);
  assert.equal(state.won, false);
  assert.equal(view(state).sites.find(({ id }) => id === 'tide_keeper').creatures.tide_spirit, 0);
  travelFed('village');
  play(state, 'handin', { id: 'last_lantern' });
  assert.equal(view(state).mode, 'victory');
  assert.equal(state.inventory.seal, undefined);
  const wonDay = state.day;
  play(state, 'resume');
  assert.equal(view(state).mode, 'village');
  assert.equal(view(state).discovered.includes('hidden'), false);
  assert.equal(act(state, 'travel', { id: 'hidden' }).ok, false);
  play(state, 'buy', { id: 'ration', count: 4 });
  travelFed('marsh');
  seek(state, 'old_fire');
  const early = view(state);
  assert.equal(early.visibleChoices.some(({ index }) => index === 3), false);
  assert.equal(early.currentEvent.choices.some(({ index }) => index === 3), false);
  assert.equal(act(state, 'choose', { index: 3 }).ok, false);
  choose(state, 2);
  assert.equal(state.inventory.kiln_shard, 1);
  travelFed('ridge');
  seek(state, 'stone_niche');
  assert.ok(view(state).visibleChoices.some(({ index, available }) => index === 2 && available));
  choose(state, 2);
  assert.equal(state.inventory.kiln_shard, 1);
  assert.equal(state.inventory.bell_clapper, 1);
  travelFed('ford');
  seek(state, 'boat_shade');
  choose(state, 2);
  assert.equal(state.inventory.bell_clapper, 1);
  assert.equal(state.inventory.backwash_mark, 1);
  assert.equal(state.inventory.secret_pass, undefined);
  assert.equal(act(state, 'travel', { id: 'hidden' }).ok, false);
  assert.equal(play(state, 'deduce', {
    id: 'trace_backwash', evidence: ['bell_clapper', 'backwash_mark'], hypothesis: '反写也许和火光照出来的倒影有关。',
  }).deduction, 'pinned');
  assert.equal(state.inventory.secret_pass, undefined);
  assert.equal(view(state).discovered.includes('hidden'), false);
  assert.equal(state.region, 'ford');
  feed(state, 48);
  assert.ok(view(state).revisitableEvents.some(({ id }) => id === 'boat_shade'));
  play(state, 'revisit', { id: 'boat_shade' });
  const id = 'trace_backwash';
  assert.equal(view(state).experiment.id, id);
  assert.equal(play(state, 'experiment', { id, settings: { tile: 'fire', hanger: 'outer', plate: 'water' } }).deduction, 'miss');
  assert.equal(view(state).discovered.includes('hidden'), false);
  assert.equal(play(state, 'experiment', { id, settings: { tile: 'away', hanger: 'outer', plate: 'water' } }).deduction, 'verified');
  assert.equal(state.inventory.secret_pass, 1);
  assert.equal(view(state).experiment, null);
  assert.ok(view(state).discovered.includes('hidden'));
  play(state, 'leave');
  travelFed('village');
  travelFed('hidden');
  assert.deepEqual(siteIds(state), ['upstream_lights', 'sunken_mooring', 'still_pole']);
  seek(state, 'upstream_lights');
  const wood = state.inventory.wood;
  choose(state, 0);
  assert.equal(state.inventory.wood ?? 0, wood - 1);
  assert.ok(state.inventory.dry_wick > 0);
  assert.equal(state.wonDay, wonDay);
  travelFed('ford');
  assert.equal(view(state).sites.find(({ id }) => id === 'tide_keeper').creatures.tide_spirit, 0);
});
