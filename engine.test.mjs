import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame, prepareQuietRoad, stageRetreatOpening } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  if (state.event && ['travel', 'visit', 'revisit', 'wait'].includes(action)) {
    const left = act(state, 'leave');
    assert.equal(left.ok, true, left.message);
  }
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function deduceFrom(state, id, item) {
  assert.equal(play(state, 'meditate', { item }).meditation, 'ready');
  assert.equal(play(state, 'deduce', { id }).deduction, 'recorded');
}

function choose(state, index) {
  const choice = view(state).visibleChoices.find((entry) => entry.index === index);
  if (choice?.gather?.length) play(state, 'beginGather', { index });
  const result = choice?.gather?.length ? play(state, 'finishGather') : play(state, 'choose', { index });
  pickGathered(state, result.gathered);
  return result;
}

function pickGathered(state, gathered) {
  for (const id of Object.keys(gathered ?? {})) {
    const available = view(state).groundPickup[id] ?? 0;
    if (available) play(state, 'take', { id });
  }
}

function walk(state, id) {
  prepareQuietRoad(state);
  play(state, 'travel', { id });
}

function seek(state, id) {
  play(state, 'visit', { id });
  assert.equal(view(state).currentEvent.id, id);
}

function chooseAt(state, site, index) {
  seek(state, site);
  return choose(state, index);
}

function supplyFixture(state, needs) {
  for (const [id, count] of Object.entries(needs ?? {})) {
    state.inventory[id] = Math.max(state.inventory[id] ?? 0, count);
    if (!state.knownItems.includes(id)) state.knownItems.push(id);
  }
}

function advanceFromFixture(state, realmId) {
  const goal = data.realms.find(({ id }) => id === realmId);
  assert.equal(view(state).nextRealm.id, goal.id);
  supplyFixture(state, goal.need);
  state.coins = Math.max(state.coins, goal.cost);
  state.insight = Math.max(state.insight, goal.insight);
  state.practice[state.realm] = Math.max(state.practice[state.realm] ?? 0, goal.practice ?? 0);
  play(state, 'breakthrough');
}

function workForge(state, recipeId) {
  const recipe = data.recipes.find(({ id }) => id === recipeId);
  supplyFixture(state, recipe.need);
  buildFromFixture(state, 'forge', recipe.facilityLevel ?? 1);
  supplyFixture(state, recipe.need);
  if (recipe.requiresShownHide && !state.showedHideToSmith) play(state, 'showHideToSmith');
  state.coins = Math.max(state.coins, recipe.cost);
  play(state, 'econStart', { id: recipeId });
  finishProject(state, 'forge');
}

const facility = (state, wanted) => view(state).economy.facilities.find(({ id }) => id === wanted);

function buildFromFixture(state, project, level = 1) {
  while (facility(state, project).level < level) {
    const { upgrade } = facility(state, project);
    supplyFixture(state, upgrade.need);
    state.coins = Math.max(state.coins, upgrade.cost);
    play(state, 'econBuild', { id: project });
  }
}

function finishProject(state, project) {
  let [job] = facility(state, project).jobs;
  while (!job.ready) {
    play(state, 'wait');
    [job] = facility(state, project).jobs;
  }
  play(state, 'econCollect', { id: job.id });
}

function feed(state, minimum) {
  while (state.satiety < minimum) {
    if (!state.inventory.ration && state.region === 'village') play(state, 'rest');
    play(state, 'eat');
  }
}

function uncoverFerryman(state) {
  const result = chooseAt(state, 'bank_watch', 1);
  assert.equal(state.event, 'bank_watch');
  play(state, 'leave');
  return result;
}

const marshLandmarks = ['reed_banks', 'sunk_pack', 'mud_track', 'bank_watch', 'marsh_pole_lesson'];
const siteIds = (state) => view(state).sites.map(({ id }) => id);
const marketStock = (state) => view(state).market.stalls.flatMap(({ offers }) => offers.map(({ id }) => id));

test('public village services are accessible immediately while material trades and recipes retain prerequisites', () => {
  let state = createGame();
  const opening = view(state);
  assert.deepEqual(opening.services, ['quests', 'market', 'workshop']);
  assert.deepEqual(opening.discoveredQuests, ['patch_ferry', 'reed_salve']);
  assert.equal(opening.quests.find(({ id }) => id === 'reed_salve').ready, false);
  assert.deepEqual(opening.discoveredRecipes, []);
  assert.equal(opening.combatWeapon.spellQi, 0);
  assert.deepEqual(opening.discoveredItems, ['ration', 'cudgel', 'straw_cape']);
  assert.equal(opening.nextRealm, null);
  const start = JSON.stringify(state);
  for (const [action, payload] of [
    ['handin', { id: 'reed_salve' }], ['handin', { id: 'patch_ferry' }], ['craft', { id: 'r_reed_bow' }],
    ['repair', { id: 'cudgel' }], ['research'], ['breakthrough'],
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
  chooseAt(state, 'reed_banks', 1);
  chooseAt(state, 'mud_track', 1);
  uncoverFerryman(state);
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop']);
  assert.ok(view(state).discoveredRecipes.includes('r_reed_bow'));
  assert.equal(view(state).discoveredRecipes.includes('r_hide_coat'), false);
  feed(state, 35);
  chooseAt(state, 'reed_ferryman', 0);
  assert.equal(view(state).services.includes('cultivate'), false);
  feed(state, 35);
  chooseAt(state, 'reed_ferryman', 2);
  chooseAt(state, 'drowned_mast', 1);
  walk(state, 'village');
  assert.ok(view(state).discoveredQuests.includes('apprentice_waterline'));
  play(state, 'sell', { id: 'reed', count: state.inventory.reed });
  state = JSON.parse(JSON.stringify(state));
  assert.equal(state.inventory.reed, undefined);
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop', 'cultivate']);
  assert.ok(view(state).discoveredRecipes.includes('r_reed_bow'));
  assert.ok(view(state).nextRealm);
});

test('stalls stock real goods from the start and crafting knowledge does not add to the shelves', () => {
  const state = createGame();
  const initialStock = marketStock(state);
  for (const item of ['ration', 'wood', 'reed', 'cudgel', 'knife', 'straw_cape', 'salve', 'qi_powder', 'reed_arrow', 'millet_seed']) {
    assert.ok(initialStock.includes(item), item);
  }
  assert.equal(view(state).discoveredRecipes.includes('r_qi'), false);
  const coins = state.coins;
  play(state, 'buy', { id: 'qi_powder' });
  assert.equal(state.inventory.qi_powder, 1);
  assert.equal(state.coins, coins - data.items.find(({ id }) => id === 'qi_powder').price);
  assert.equal(view(state).discoveredRecipes.includes('r_qi'), false);
  assert.deepEqual(marketStock(state), initialStock);

  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'mud_track', 1);
  walk(state, 'village');
  assert.ok(view(state).discoveredRecipes.includes('r_reed_bow'));
  assert.equal(view(state).discoveredRecipes.includes('r_grain'), false);
  assert.deepEqual(marketStock(state), initialStock);
  const unchanged = structuredClone(state);
  assert.match(act(state, 'buy', { id: 'grain_pill' }).message, /摊上没摆/);
  assert.deepEqual(state, unchanged);
  assert.equal(view(state).market.sales.some(({ id }) => id === 'reed_bow'), false);

  play(state, 'craft', { id: 'r_reed_bow' });
  assert.deepEqual(marketStock(state), initialStock);
  const bow = view(state).market.sales.find(({ id }) => id === 'reed_bow');
  assert.equal(bow.count, 1);
  assert.equal(bow.canSell, true);
  play(state, 'sell', { id: 'reed_bow' });
  assert.equal(view(state).market.sales.some(({ id }) => id === 'reed_bow'), false);
  assert.deepEqual(marketStock(state), initialStock);
});

test('a supply hand-in changes its stall and protected possessions cannot be sold', () => {
  const state = createGame();
  const stock = marketStock(state);
  assert.ok(!stock.includes('reed_talisman'));
  const staff = view(state).market.sales.find(({ id }) => id === 'cudgel');
  assert.equal(staff.count, 0);
  assert.equal(staff.canSell, false);
  assert.match(act(state, 'sell', { id: 'cudgel' }).message, /先卸下/);

  play(state, 'sell', { id: 'ration', count: 3 });
  play(state, 'rest');
  const reliefFood = view(state).market.sales.find(({ id }) => id === 'ration');
  assert.equal(reliefFood.count, 0);
  assert.equal(reliefFood.canSell, false);
  assert.match(act(state, 'sell', { id: 'ration' }).message, /只供自用/);
  play(state, 'buy', { id: 'ration' });
  assert.equal(view(state).market.sales.find(({ id }) => id === 'ration').count, 1);
  play(state, 'sell', { id: 'ration' });
  assert.equal(state.inventory.ration, rules.reliefRations);
  assert.equal(state.reliefRations, rules.reliefRations);

  walk(state, 'marsh');
  chooseAt(state, 'mud_track', 1);
  walk(state, 'village');
  assert.deepEqual(marketStock(state), stock);
  assert.equal(view(state).discoveredRecipes.includes('r_reed'), false);
  assert.match(act(state, 'buy', { id: 'reed_talisman' }).message, /摊上没摆/);
  play(state, 'handin', { id: 'patch_ferry' });
  assert.deepEqual(marketStock(state).filter(id => !stock.includes(id)), ['reed_talisman']);
  play(state, 'buy', { id: 'reed_talisman' });
  assert.equal(state.inventory.reed_talisman, 1);
  assert.equal(view(state).discoveredRecipes.includes('r_reed'), false);
});

test('a weapon maker restocks and can sell a replacement after the first is sold', () => {
  const state = createGame();
  const id = 'split_axe';
  const offer = () => view(state).market.stalls.find(({ offers }) => offers.some((row) => row.id === id))
    .offers.find((row) => row.id === id);
  const start = offer();
  state.coins = start.price * 2;
  play(state, 'buy', { id });
  assert.equal(offer().stock, start.stock - 1);
  assert.equal(state.inventory[id], 1);
  play(state, 'econDeposit', { id, count: 1 });
  for (let tick = 0; offer().stock === 0 && tick < 40; tick++) play(state, 'wait');
  assert.ok(offer().stock > 0);
  const stored = structuredClone(state);
  assert.match(act(state, 'buy', { id }).message, /只能持有一件/);
  assert.deepEqual(state, stored);
  play(state, 'econWithdraw', { id, count: 1 });
  play(state, 'sell', { id });
  assert.equal(state.inventory[id], undefined);
  play(state, 'buy', { id });
  assert.equal(state.inventory[id], 1);
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
  assert.deepEqual(choices.map(({ index }) => index), [0, 1, 2]);
  assert.ok(choices.every((choice) =>
    !['hp', 'injury', 'outcome', 'loot', 'enemy'].some((field) => Object.hasOwn(choice, field))));
  assert.doesNotMatch(JSON.stringify(choices), /割伤|划伤|划破|受伤|蚌壳/);
  const healthBefore = state.hp;
  const result = play(state, 'choose', { index: 1 });
  assert.equal(result.injury.amount, healthBefore - state.hp);
  assert.equal(result.injury.amount, 4);
  assert.match(result.injury.cause, /划破/);
  assert.equal(state.log.some((entry) => entry.includes(result.injury.cause)), false);
  assert.equal(state.inventory.reed, undefined);
  assert.ok(result.gathered.reed > 0);
  pickGathered(state, result.gathered);
  assert.equal(state.inventory.reed, result.gathered.reed);
  assert.deepEqual(siteIds(state), marshLandmarks);
  assert.equal(state.inventory.reed_lines, undefined);
  assert.equal(view(state).activeClues.includes('oar_mark'), false);

  walk(state, 'village');
  const handin = play(state, 'handin', { id: 'reed_salve' });
  assert.match(handin.outcome, /膏|伤/);
  assert.equal(state.inventory.salve, 1);
  assert.equal(state.inventory.reed_lines, undefined);
  assert.equal(state.inventory.oar_mark, undefined);
  assert.equal(state.inventory.ridge_rubbing, undefined);
  assert.equal(view(state).deductionDraft, null);
  feed(state, 45);
  walk(state, 'marsh');
  assert.deepEqual(siteIds(state), marshLandmarks);
});

test('a timed harvest spends exactly one batch and the pile stays at its site until taken', () => {
  const state = createGame();
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  const event = data.events.find(({ id }) => id === 'reed_banks');
  const { index, gather: [gather] } = view(state).visibleChoices[0];
  const batch = event.choices[index];
  const stock = () => view(state).sites.find(({ id }) => id === 'reed_banks').stocks.reed;
  assert.equal(gather.id, 'reed');
  assert.equal(gather.maximum, stock());
  assert.equal(gather.suggested, batch.loot.reed);

  const amount = gather.suggested;
  const before = state.day;
  const initialStock = stock();
  play(state, 'beginGather', { index });
  assert.equal(state.day, before);
  assert.equal(stock(), initialStock);
  const result = play(state, 'finishGather');
  assert.deepEqual(result.gathered, { reed: amount });
  assert.equal(state.day - before, batch.days);
  assert.equal(stock(), initialStock - amount);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).groundLoot.reed, amount);
  assert.equal(view(state).groundPickup.reed, amount);
  assert.equal(state.expeditionLoot.reed, undefined);

  const waiting = structuredClone(state);
  assert.equal(act(state, 'take', { id: 'reed', count: amount + 1 }).ok, false);
  assert.deepEqual(state, waiting);
  walk(state, 'village');
  assert.equal(view(state).groundLoot.reed, undefined);
  feed(state, 45);
  walk(state, 'marsh');
  assert.equal(view(state).groundLoot.reed, undefined);
  seek(state, 'reed_banks');
  assert.equal(view(state).groundLoot.reed, amount);
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, amount);
  assert.equal(view(state).groundLoot.reed, undefined);
});

test('a harvesting injury only happens on completion and leaves the batch at the original site', () => {
  const state = createGame();
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  state.hp = 1;
  const { index, gather: [gather] } = view(state).visibleChoices[1];
  play(state, 'beginGather', { index });
  assert.equal(state.hp, 1);
  const result = play(state, 'finishGather');
  assert.equal(result.injury.amount, 1);
  assert.deepEqual(result.gathered, { reed: gather.suggested });
  assert.equal(result.gatheredRegion, 'marsh');
  assert.equal(view(state).mode, 'village');
  assert.equal(state.inventory.reed, undefined);
  assert.deepEqual(view(state).groundLoot, {});
  feed(state, 42);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  assert.equal(view(state).groundLoot.reed, gather.suggested);
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
  const depletedAt = state.day - 0.25;
  const pool = data.sites.find(({ id }) => id === 'reed_banks').stocks.reed;
  const recovery = depletedAt + pool.interval * (pool.depletedFactor ?? 1);
  choose(state, 1);
  assert.equal(state.inventory.reed, reedStart + 3);
  assert.equal(reeds(state), 0);
  assert.equal(Object.hasOwn(view(state).sites.find(({ id }) => id === 'mud_track'), 'creatures'), false);
  seek(state, 'reed_banks');
  assert.match(view(state).currentEvent.text, /只剩还没长开的嫩芽/);
  const beforeInvalidHarvest = structuredClone(state);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.deepEqual(state, beforeInvalidHarvest);
  play(state, 'leave');
  assert.equal(reeds(state), 0);
  while (state.day < recovery) {
    assert.equal(reeds(state), 0);
    feed(state, 10);
    play(state, 'wait');
  }
  assert.equal(reeds(state), pool.growth);
  const beforeLooking = structuredClone(state);
  view(state);
  assert.deepEqual(state, beforeLooking);

  const hunting = createGame();
  walk(hunting, 'marsh');
  seek(hunting, 'mud_track');
  const initial = huntCount(hunting);
  const carried = { ...hunting.inventory };
  const huntCoins = hunting.coins;
  const retreating = structuredClone(hunting);
  choose(retreating, 0);
  play(retreating, 'attack');
  const wounded = retreating.combat.hp;
  stageRetreatOpening(retreating);
  assert.equal(play(retreating, 'retreat').retreated, true);
  assert.equal(huntCount(retreating), initial);
  assert.equal(retreating.event, 'mud_track');
  assert.match(view(retreating).visibleChoices.find(({ index }) => index === 0).desc, /上回遇到的泥鳞兽/);
  const returnDay = retreating.day;
  const walkAround = structuredClone(retreating);
  const renewed = play(retreating, 'choose', { index: 0 });
  assert.match(renewed.outcome, /循着方才的踪迹回去，泥鳞兽还在近处/);
  assert.equal(retreating.day - returnDay, rules.huntEdgeApproachDays);
  assert.equal(retreating.combat.hp, wounded);
  assert.ok(retreating.combat.hp < data.enemies.find(({ id }) => id === 'mud_beast').hp);
  play(walkAround, 'leave');
  seek(walkAround, 'mud_track');
  const laterDay = walkAround.day;
  choose(walkAround, 0);
  assert.equal(walkAround.day - laterDay, 0.5);
  choose(hunting, 0);
  for (let turn = 0; hunting.combat && turn < 6; turn++) play(hunting, 'attack');
  assert.equal(hunting.combat, null);
  assert.equal(huntCount(hunting), initial - 1);
  pickGathered(hunting, view(hunting).groundLoot);
  assert.deepEqual(hunting.inventory, { ...carried, beast_meat: 2, hide: 2, qi_core: 1 });
  assert.deepEqual(hunting.completedQuests, []);
  assert.equal(hunting.coins, huntCoins);
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
  assert.equal(view(hunting).visibleChoices[0].available, true);
  supplyFixture(hunting, { salve: 9 });
  for (let attempts = 0; huntCount(hunting) > 0 && attempts < 8; attempts++) {
    choose(hunting, 0);
    while (hunting.combat) {
      const intent = view(hunting).intent?.kind;
      if (intent === 'heavy') play(hunting, 'guard');
      else if (hunting.hp < 15) play(hunting, 'use', { id: 'salve' });
      else play(hunting, 'attack');
    }
  }
  assert.equal(view(hunting).visibleChoices[0].available, false);
  assert.match(view(hunting).currentEvent.text, /平静|看不到鳞片/);
  assert.equal(act(hunting, 'choose', { index: 0 }).ok, false);
  play(hunting, 'leave');
  while (hunting.day < hunting.localPools.mud_track.creatures.mud_beast.nextAt) {
    feed(hunting, 10);
    play(hunting, 'wait');
  }
  assert.equal(huntCount(hunting), 1);
  feed(hunting, 20);
  seek(hunting, 'mud_track');
  assert.equal(view(hunting).visibleChoices[0].available, true);
});

test('a guarded herb is gathered separately from the spirit that blocks the bank', () => {
  const state = createGame();
  play(state, 'buy', { id: 'knife' });
  play(state, 'equip', { id: 'knife' });
  const coins = state.coins;
  walk(state, 'marsh');
  uncoverFerryman(state);
  seek(state, 'reed_ferryman');
  assert.match(view(state).currentEvent.text, /白苇/);
  assert.equal(view(state).visibleChoices.find(({ index }) => index === 3).available, false);
  assert.equal(act(state, 'choose', { index: 3 }).ok, false);

  const escaping = structuredClone(state);
  choose(escaping, 1);
  stageRetreatOpening(escaping);
  assert.equal(play(escaping, 'retreat').retreated, true);
  seek(escaping, 'reed_ferryman');
  assert.equal(act(escaping, 'choose', { index: 3 }).ok, false);
  assert.equal(escaping.inventory.reed, undefined);
  assert.equal(escaping.inventory.qi_core, undefined);

  for (let tries = 0; tries < 3 && !view(state).visibleChoices.find(({ index }) => index === 3).available; tries++) {
    choose(state, 1);
    assert.equal(view(state).currentEnemy.id, 'marsh_ghost');
    for (let turn = 0; state.combat && turn < 8; turn++) {
      play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
    }
    assert.equal(view(state).currentEvent?.id, 'reed_ferryman', state.log.slice(-5).join('\n'));
    assert.equal(state.inventory.reed, undefined);
    assert.equal(state.inventory.reed_talisman, undefined);
    assert.equal(state.coins, coins);
    assert.equal(view(state).groundLoot.reed, undefined);
    feed(state, 35);
  }
  assert.equal(state.inventory.qi_core, undefined);
  assert.ok(view(state).groundLoot.qi_core >= 1);
  assert.equal(view(state).visibleChoices.find(({ index }) => index === 3).available, true);
  const preHarvest = view(state).sites.find(({ id }) => id === 'reed_ferryman').stocks.reed;
  play(state, 'beginGather', { index: 3 });
  play(state, 'finishGather');
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).groundLoot.reed, 3);
  play(state, 'take', { id: 'reed', count: 3 });
  assert.equal(state.inventory.reed, 3);
  assert.equal(state.localPools.reed_ferryman.stocks.reed.count, preHarvest - 3);
});

test('a crafted shield gives up two-handed weapons and wears only when bracing a heavy hit', () => {
  const state = createGame();
  supplyFixture(state, { ore: 1 });
  workForge(state, 'r_hide_shield');
  play(state, 'equip', { id: 'hide_shield' });
  supplyFixture(state, { reed_bow: 1, knife: 1 });
  state.durability.reed_bow = 10;
  state.durability.knife = 10;
  play(state, 'equip', { id: 'reed_bow' });
  assert.equal(state.equipment.offhand, null);
  assert.equal(state.inventory.hide_shield, 1);
  assert.match(act(state, 'equip', { id: 'hide_shield' }).message, /双手兵刃/);
  play(state, 'equip', { id: 'knife' });
  play(state, 'equip', { id: 'hide_shield' });
  feed(state, 60);
  walk(state, 'marsh');
  seek(state, 'mud_track');
  choose(state, 0);
  const initialWear = state.durability.hide_shield;
  play(state, 'guard');
  assert.equal(state.durability.hide_shield, initialWear);
  const locked = structuredClone(state);
  for (const [action, payload] of [['combatEquip', { id: 'reed_bow' }], ['equip', { id: 'reed_bow' }], ['unequip', { slot: 'offhand' }]]) {
    assert.match(act(state, action, payload).message, /交手中不能换装备/);
    assert.deepEqual(state, locked);
  }
  const before = structuredClone(state);
  before.equipment.offhand = null;
  const protectedHit = play(state, 'guard');
  const bareHit = play(before, 'guard');
  assert.equal(state.durability.hide_shield, initialWear - 1);
  assert.match(protectedHit.message, /包革小盾/);
  assert.equal(protectedHit.damageTaken, Math.max(0, bareHit.damageTaken - 3));
});

test('an expedition can hunt and turn its meat into road food at the local inn', () => {
  const state = createGame();
  play(state, 'buy', { id: 'knife' });
  play(state, 'equip', { id: 'knife' });
  walk(state, 'marsh');
  seek(state, 'mud_track');
  choose(state, 5);
  while (state.combat) play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  pickGathered(state, view(state).groundLoot);
  assert.equal(state.inventory.beast_meat, 2);
  choose(state, 5);
  while (state.combat) play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  pickGathered(state, view(state).groundLoot);
  assert.equal(state.inventory.beast_meat, 4);
  choose(state, 1);
  feed(state, 65);
  walk(state, 'pale_shoal');
  walk(state, 'willow_post');
  seek(state, 'willow_yard');
  const initialMoney = state.coins;
  const initialDay = state.day;
  const initialWood = state.inventory.wood;
  play(state, 'choose', { index: 2 });
  assert.equal(state.coins, initialMoney - 3);
  assert.equal(state.day, initialDay + 0.75);
  assert.equal(state.inventory.wood, initialWood - 1);
  assert.equal(state.inventory.beast_meat, 1);
  assert.equal(state.inventory.meat_broth, 3);
  assert.equal(view(state).visibleChoices.find(({ index }) => index === 2).available, false);
  const hunger = state.satiety;
  play(state, 'eat', { id: 'meat_broth' });
  assert.equal(state.satiety, Math.min(100, hunger + 44));
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
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'take', { id: 'lost_basket', count: 1 });
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
  const prompt = act(opened, 'unpackBasket');
  assert.match(prompt.message, /药僮就收不到/);
  assert.deepEqual(opened, state);
  assert.equal(act(opened, 'unpackBasket', { confirmed: true, expectedPlace: 'village' }).ok, false);
  play(opened, 'unpackBasket', { confirmed: true, expectedPlace: prompt.confirmation.place });
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
  const { gathered } = play(state, 'choose', { index: 0 });
  assert.ok(gathered.reed > 0);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).groundLoot.reed, gathered.reed);
  const blocked = structuredClone(state);
  assert.equal(view(state).groundPickup.reed, 0);
  assert.equal(act(state, 'take', { id: 'reed', count: 1 }).ok, false);
  assert.deepEqual(state, blocked);
  assert.equal(view(state).backpackUsed, backpackCapacity);
  play(state, 'discard', { id: 'ration', count: backpackStackSize });
  assert.equal(view(state).groundLoot.ration, backpackStackSize);
  play(state, 'take', { id: 'reed', count: gathered.reed });
  assert.equal(state.inventory.reed, gathered.reed);
  assert.equal(view(state).groundLoot.reed, undefined);
  const before = state.inventory.ration;
  const max = view(state).groundPickup.ration;
  assert.equal(max, 1);
  const partialBlocked = structuredClone(state);
  assert.equal(act(state, 'take', { id: 'ration', count: max + 1 }).ok, false);
  assert.deepEqual(state, partialBlocked);
  play(state, 'take', { id: 'ration', count: max });
  assert.equal(state.inventory.ration, backpackStackSize * (backpackCapacity - 1));
  assert.equal(view(state).groundLoot.ration, backpackStackSize - (state.inventory.ration - before));
  walk(state, 'village');
  assert.deepEqual(view(state).groundLoot, {});
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  assert.ok(view(state).groundLoot.ration > 0);
});

test('capacity checks do not charge for a refused transaction and discarded gear keeps its wear', () => {
  const state = createGame();
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  walk(state, 'village');
  supplyFixture(state, { wood: 3 });
  state.inventory = { cudgel: 1, straw_cape: 1, reed: 2, wood: 3, ration: (rules.backpackCapacity - 2) * rules.backpackStackSize };
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);
  const before = structuredClone(state);
  for (const [action, payload] of [
    ['craft', { id: 'r_reed_arrow' }], ['buy', { id: 'ration' }], ['handin', { id: 'reed_salve' }],
  ]) {
    assert.match(act(state, action, payload).message, action === 'handin' ? /再腾出 1 格/ : /行囊已满/);
    assert.deepEqual(state, before);
  }
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'craft', { id: 'r_reed_arrow' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'handin', { id: 'reed_salve' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  state.durability.cudgel = 5;
  play(state, 'unequip', { slot: 'weapon' });
  play(state, 'discard', { id: 'cudgel' });
  play(state, 'take', { id: 'cudgel', count: 1 });
  assert.equal(state.durability.cudgel, 5);
});

test('the boatman and village smith trade maps that open travel for a beginning character', () => {
  const state = createGame();
  assert.deepEqual(view(state).discovered, ['village', 'marsh']);
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  assert.equal(view(state).discoveredItems.includes('core'), false);
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
  assert.match(exchange.outcome, /沉钟岭(?:的)?路图/);
  assert.equal(state.inventory.reed ?? 0, before.reed - 2);
  assert.equal(state.inventory.wood, before.wood - 1);
  assert.equal(state.inventory.ridge_rubbing, 1);
  assert.ok(view(state).discovered.includes('ridge'));
  assert.deepEqual(state.completedQuests, []);

  const reloaded = JSON.parse(JSON.stringify(state));
  feed(reloaded, 70);
  walk(reloaded, 'ridge');
  assert.equal(view(reloaded).realmIndex, 0);
  assert.deepEqual(siteIds(reloaded), ['ore_rain', 'empty_oven', 'miner_echo', 'rope_run', 'caravan_slate', 'bandit_marsh_lamp', 'counter_bell_door']);
  assert.equal(act(reloaded, 'travel', { id: 'ford' }).ok, false);
  chooseAt(reloaded, 'ore_rain', 0);
  assert.equal(siteIds(reloaded).includes('stone_niche'), false);
  const detour = structuredClone(reloaded);
  seek(detour, 'miner_echo');
  play(detour, 'leave');
  assert.equal(siteIds(detour).includes('stone_niche'), false);
  feed(detour, 35);
  assert.match(chooseAt(detour, 'miner_echo', 2).outcome, /回声石洞/);
  assert.equal(siteIds(detour).includes('stone_niche'), true);
  assert.equal(siteIds(detour).includes('cracked_bell'), false);
  feed(detour, 30);
  assert.match(chooseAt(detour, 'stone_niche', 1).outcome, /裂钟|石阶/);
  assert.equal(siteIds(detour).includes('cracked_bell'), true);
  walk(reloaded, 'village');
  const ore = reloaded.inventory.ore;
  const alreadyMapped = structuredClone(reloaded);
  supplyFixture(alreadyMapped, { ford_chart: 1 });
  assert.match(view(alreadyMapped).quests.find(({ id }) => id === 'sell_forging').desc, /早认得/);
  play(alreadyMapped, 'handin', { id: 'sell_forging' });
  assert.equal(alreadyMapped.inventory.ford_chart, 1);
  assert.equal(alreadyMapped.inventory.ore, ore - 1);
  assert.equal(alreadyMapped.inventory.iron_talisman, 1);
  assert.ok(view(alreadyMapped).market.stalls.some(({ offers }) => offers.some(({ id }) => id === 'iron_sword')));
  const mapTrade = play(reloaded, 'handin', { id: 'sell_forging' });
  assert.match(mapTrade.outcome, /通往闭潮渡的水图/);
  assert.equal(reloaded.inventory.ore, ore - 1);
  assert.equal(reloaded.inventory.ford_chart, 1);
  feed(reloaded, 65);
  walk(reloaded, 'ford');
  assert.equal(view(reloaded).realmIndex, 0);
  assert.deepEqual(siteIds(reloaded), ['low_tide', 'boat_shade', 'flood_lines', 'lock_deck', 'ford_packet_boat', 'ford_below_steps']);
});

test('the old sluice takes both the stone map and a tested current to become a two-way road', () => {
  const state = createGame(20261123);
  const site = 'ford_lamp_channel';
  const roadTo = (run, id) => view(run).world.journeys.find((road) => road.id === id);
  const fedWalk = (run, id) => {
    feed(run, 64);
    walk(run, id);
  };

  play(state, 'buy', { id: 'ration', count: 4 });
  fedWalk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'reed_banks', 1);
  chooseAt(state, 'mud_track', 1);
  uncoverFerryman(state);
  feed(state, 48);
  chooseAt(state, 'reed_ferryman', 0);
  chooseAt(state, 'reed_ferryman', 2);
  fedWalk(state, 'village');
  play(state, 'handin', { id: 'apprentice_waterline' });
  play(state, 'rest');
  fedWalk(state, 'marsh');
  const guessed = structuredClone(state);
  deduceFrom(state, 'find_eddy', 'reed_lines');
  seek(state, 'drowned_mast');
  const trial = play(state, 'experiment', { id: 'find_eddy', settings: { release: 'stone_back', water: 'rising' } });
  assert.equal(trial.deduction, 'verified');

  fedWalk(guessed, 'ridge');
  chooseAt(guessed, 'miner_echo', 2);
  assert.match(chooseAt(guessed, 'stone_niche', 0).outcome, /村口灯座/);
  fedWalk(guessed, 'ford');
  assert.ok(siteIds(guessed).includes(site));
  seek(guessed, site);
  assert.ok(!view(guessed).visibleChoices.some(({ index }) => index === 0));
  assert.match(choose(guessed, 1).outcome, /白苇滩/);
  assert.equal(roadTo(guessed, 'village').direct, false);

  fedWalk(state, 'ridge');
  chooseAt(state, 'ore_rain', 0);
  fedWalk(state, 'village');
  play(state, 'handin', { id: 'sell_forging' });
  fedWalk(state, 'ford');
  assert.ok(!siteIds(state).includes(site));
  const ordinary = roadTo(state, 'village');
  assert.equal(ordinary.direct, false);

  fedWalk(state, 'ridge');
  chooseAt(state, 'miner_echo', 2);
  chooseAt(state, 'stone_niche', 0);
  fedWalk(state, 'ford');
  assert.equal(roadTo(state, 'village').days, ordinary.days);
  assert.match(chooseAt(state, site, 0).outcome, /打个双结/);
  for (const destination of ['village', 'ford']) {
    assert.equal(roadTo(state, destination).direct, true);
    assert.ok(roadTo(state, destination).days < ordinary.days);
    assert.match(play(state, 'travel', { id: destination }).message, /旧灯渠/);
  }
});

test('the opponent hands over the map and agreed blade only after the spar at that site', () => {
  const state = createGame();
  walk(state, 'marsh');
  seek(state, 'bank_watch');
  assert.equal(view(state).visibleChoices.some(({ index }) => index === 2), false);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  choose(state, 0);
  assert.equal(view(state).currentEnemy.id, 'bank_runner');
  assert.equal(state.inventory.ridge_rubbing, undefined);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(state.didEat, false);

  const retreating = structuredClone(state);
  play(retreating, 'retreat');
  assert.equal(retreating.inventory.ridge_rubbing, undefined);
  seek(retreating, 'bank_watch');
  assert.equal(act(retreating, 'choose', { index: 2 }).ok, false);
  play(retreating, 'leave');
  assert.equal(act(retreating, 'travel', { id: 'ridge' }).ok, false);

  for (let turn = 0; state.combat && turn < 10; turn++) {
    play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.ok(view(state).defeated.includes('bank_runner'));
  assert.equal(state.inventory.ridge_rubbing, undefined);
  assert.equal(state.inventory.hook_blade, undefined);
  assert.equal(state.siteVictories.bank_watch.bank_runner, 1);
  assert.ok(!view(state).sites.find(({ id }) => id === 'bank_watch').witnessedEnemies.includes('bank_runner'));
  assert.match(view(state).currentEvent.text, /解开了系住折图的细绳/);
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  const alreadyMapped = structuredClone(state);
  supplyFixture(alreadyMapped, { ridge_rubbing: 1 });
  assert.match(view(alreadyMapped).visibleChoices.find(({ index }) => index === 2).desc, /刀柄朝你/);
  chooseAt(alreadyMapped, 'bank_watch', 2);
  assert.equal(alreadyMapped.inventory.ridge_rubbing, 1);
  assert.equal(alreadyMapped.inventory.hook_blade, 1);
  chooseAt(state, 'bank_watch', 2);
  assert.equal(state.inventory.ridge_rubbing, 1);
  assert.equal(state.inventory.hook_blade, 1);
  assert.equal(view(state).sites.find(({ id }) => id === 'bank_watch').creatures.bank_runner, 0);
  seek(state, 'bank_watch');
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  play(state, 'leave');
  feed(state, 60);
  walk(state, 'ridge');
  assert.equal(view(state).realmIndex, 0);
});

test('returning for a new shift at the sparring ground can replace a sold prize blade', () => {
  const state = createGame();
  state.realm = 1;
  supplyFixture(state, { ridge_rubbing: 1, ford_chart: 1, pine_pass: 1, short_spear: 1 });
  const spear = data.gear.find(({ id }) => id === 'short_spear');
  state.durability.short_spear = spear.durability;
  play(state, 'equip', { id: spear.id });

  const prize = 'trail_cutter';
  const spar = () => {
    while (state.hp < view(state).maxHp || state.qi < view(state).maxQi) play(state, 'rest');
    feed(state, 90);
    walk(state, 'pine_ridge');
    seek(state, 'pine_spar');
    assert.equal(act(state, 'choose', { index: 2 }).ok, false);
    choose(state, 0);
    assert.equal(view(state).currentEnemy.id, 'road_sparrer');
    for (let turns = 0; state.combat && turns < 8; turns++) {
      play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
    }
    assert.equal(view(state).currentEvent?.id, 'pine_spar', state.log.slice(-6).join('\n'));
    assert.equal(view(state).sites.find(({ id }) => id === 'pine_spar').creatures.road_sparrer, 0);
    assert.equal(state.inventory[prize], undefined);
  };
  const waitForShift = () => {
    const nextAt = state.localPools.pine_spar.creatures.road_sparrer.nextAt;
    while (state.day < nextAt) play(state, 'wait');
  };

  spar();
  choose(state, 2);
  assert.equal(state.inventory[prize], 1);
  seek(state, 'pine_spar');
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  play(state, 'leave');
  walk(state, 'village');
  play(state, 'econDeposit', { id: prize, count: 1 });
  waitForShift();
  spar();
  assert.match(act(state, 'choose', { index: 2 }).message, /奖品已有/);
  assert.equal(state.inventory[prize], undefined);
  assert.equal(state.economy.warehouse[prize], 1);
  assert.equal(state.ground.pine_spar?.[prize], undefined);
  play(state, 'leave');
  walk(state, 'village');
  play(state, 'econWithdraw', { id: prize, count: 1 });
  play(state, 'sell', { id: prize });
  feed(state, 90);
  walk(state, 'pine_ridge');
  chooseAt(state, 'pine_spar', 2);
  assert.equal(state.inventory[prize], 1);
  assert.equal(state.siteClaims.pine_spar[2], 2);
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

test('reading a heavy attack gives free bracing and a counter while guarding a regular hit does not counter', () => {
  const state = createGame(0);
  walk(state, 'marsh');
  chooseAt(state, 'mud_track', 0);
  const regular = structuredClone(state);
  const regularGuard = play(regular, 'guard');
  assert.equal(regularGuard.damageDealt, 0);
  play(state, 'attack');
  state.combat.plan.reader = 'player';
  assert.equal(view(state).intent?.kind, 'heavy');
  const attacking = structuredClone(state);
  const traded = play(attacking, 'attack');
  const beforeQi = state.qi;
  const braced = play(state, 'guard');
  assert.equal(state.qi, beforeQi - (braced.fogLoss ?? 0));
  assert.equal(braced.damageDealt, rules.guardCounter);
  assert.equal(braced.damageTaken, Math.max(0, traded.damageTaken - rules.guardBonus - rules.heavyGuardBonus));
  assert.equal(view(state).mode, 'combat');
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
  assert.equal(state.inventory.hide, undefined);
  play(state, 'take', { id: 'hide', count: view(state).groundLoot.hide });
  assert.ok(state.inventory.hide > 0);
  const collectedHide = state.inventory.hide;

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
  assert.deepEqual(view(state).recoverableLoss?.goods, { hide: collectedHide });
  assert.equal(view(state).recoverableLoss?.place, 'marsh');
  play(state, 'rest');
  assert.equal(state.wounds, 0);
  assert.ok(state.hp > 1);
  play(state, 'repair', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, before);
  assert.equal(view(state).recoverableLoss?.goods.hide, collectedHide);
  walk(state, 'marsh');
  play(state, 'take', { id: 'hide' });
  assert.equal(view(state).recoverableLoss, undefined);
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
  feed(state, 35);
  chooseAt(state, 'mud_track', 1);
  walk(state, 'village');
  assert.ok(view(state).discoveredRecipes.includes('r_reed_bow'));
  play(state, 'craft', { id: 'r_reed_bow' });
  play(state, 'craft', { id: 'r_reed_arrow' });
  play(state, 'equip', { id: 'reed_bow' });
  feed(state, 50);
  walk(state, 'marsh');
  seek(state, 'mud_track');
  choose(state, 2);
  assert.equal(view(state).currentEnemy.id, 'reed_fox');

  const fox = { ...data.enemies.find(({ id }) => id === 'reed_fox'), ...state.combat.individual };
  const beast = data.enemies.find(({ id }) => id === 'mud_beast');
  const bow = data.gear.find(({ id }) => id === 'reed_bow');
  const arrow = data.ammunition.find(({ id }) => id === 'reed_arrow');
  const unarmed = data.realms[0].atk;
  const ammunition = state.inventory.reed_arrow;
  const bowPower = unarmed + bow.atk + arrow.atk;
  const broken = structuredClone(state);
  broken.durability.reed_bow = 0;
  assert.equal(play(broken, 'attack').damageDealt, unarmed - fox.def);
  assert.equal(broken.inventory.reed_arrow, ammunition);
  const scaled = structuredClone(state);
  scaled.combat = { id: beast.id, hp: beast.hp, round: 0, escapeBonus: 0 };
  assert.equal(play(scaled, 'attack').damageDealt, bowPower - Math.max(0, beast.def - arrow.pierce));

  assert.ok(bow.trait.bonus > 0);
  assert.equal(play(state, 'attack').damageDealt, bowPower + bow.trait.bonus - Math.max(0, fox.def - arrow.pierce));
  let turns = 1;
  while (state.combat && turns < 5) {
    play(state, 'attack');
    turns++;
  }
  assert.equal(view(state).currentEvent?.id, 'mud_track');
  assert.ok(view(state).defeated.includes('reed_fox'));
  assert.equal(state.inventory.reed_arrow, ammunition - turns);
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
  const knife = data.gear.find(({ id }) => id === 'knife');
  const hide = data.gear.find(({ id }) => id === 'hide_coat');
  const beast = data.enemies.find(({ id }) => id === 'mud_beast');
  const spirit = data.enemies.find(({ id }) => id === 'marsh_ghost');
  const power = data.realms[0].atk + knife.atk;
  const defense = view(state).defense;
  assert.ok(knife.trait.bonus > 0 && hide.trait.bonus > 0);
  state.combat = { id: beast.id, hp: beast.hp, round: 0, escapeBonus: 0 };
  const beforeBeast = state.hp;
  assert.equal(play(state, 'attack').damageDealt, power - Math.max(0, beast.def - knife.trait.bonus));
  assert.equal(state.hp, beforeBeast - Math.max(0, Math.ceil(beast.atk * beast.intents[0].mult) - defense - hide.trait.bonus));

  state.combat = { id: spirit.id, hp: spirit.hp, round: 1, escapeBonus: 0 };
  const beforeSpirit = state.hp;
  assert.equal(play(state, 'attack').damageDealt, power - spirit.def);
  assert.equal(state.hp, beforeSpirit - Math.max(0, Math.ceil(spirit.atk * spirit.intents[1].mult) - defense));

  state.combat = null;
  state.realm = 1;
  state.inventory.iron_coat = 1;
  const iron = data.gear.find(({ id }) => id === 'iron_coat');
  const wight = data.enemies.find(({ id }) => id === 'ore_wight');
  state.durability.iron_coat = iron.durability;
  play(state, 'equip', { id: 'iron_coat' });
  const healthy = view(state).maxHp;
  state.hp = healthy;
  state.combat = { id: wight.id, hp: wight.hp, round: 0, escapeBonus: 0 };
  const armorDefense = view(state).defense;
  play(state, 'attack');
  assert.equal(state.hp, healthy - Math.max(0, Math.ceil(wight.atk * wight.intents[0].mult) - armorDefense));
  const beforeHeavy = state.hp;
  play(state, 'attack');
  assert.equal(state.hp, beforeHeavy - Math.max(0, Math.ceil(wight.atk * wight.intents[1].mult) - armorDefense - iron.trait.bonus));
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
  const blocked = play(state, 'use', { id: 'reed_talisman' });
  assert.equal(blocked.retreated, false);
  assert.ok(state.hp < before);
  assert.ok(state.combat);
  assert.equal(state.inventory.reed_talisman, undefined);
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  assert.equal(view(state).mode, 'field');
});

test('meditation brings complete evidence to the board; only a field trial gives the unique map', () => {
  const state = createGame();
  const id = 'find_eddy';
  const settings = { release: 'stone_back', water: 'rising' };
  assert.deepEqual(view(state).activeClues, []);
  assert.equal(act(state, 'deduce', { id }).ok, false);
  assert.equal(act(state, 'meditate', { item: 'ration' }).ok, false);
  play(state, 'buy', { id: 'ration', count: 4 });
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  choose(state, 0);
  choose(state, 1);
  chooseAt(state, 'mud_track', 1);
  feed(state, 50);
  uncoverFerryman(state);
  feed(state, 40);
  chooseAt(state, 'reed_ferryman', 0);
  chooseAt(state, 'reed_ferryman', 2);
  walk(state, 'village');
  play(state, 'rest');
  const beforePartial = state.qi;
  assert.equal(play(state, 'meditate', { item: 'oar_mark' }).message, '没什么头绪。');
  assert.equal(state.qi, beforePartial - rules.deductionQiCost);
  assert.equal(view(state).deductionDraft, null);
  assert.ok(view(state).activeClues.includes('oar_mark'));
  play(state, 'handin', { id: 'apprentice_waterline' });
  assert.equal(state.completedQuests.includes('reed_salve'), false);
  const tired = structuredClone(state);
  tired.qi = rules.deductionQiCost - 1;
  assert.equal(act(tired, 'meditate', { item: 'reed_lines' }).ok, false);
  assert.equal(tired.qi, rules.deductionQiCost - 1);
  play(state, 'rest');

  feed(state, 60);
  walk(state, 'marsh');
  seek(state, 'mud_track');
  assert.equal(view(state).experiment, null);
  assert.equal(act(state, 'experiment', { id, settings }).ok, false);
  play(state, 'leave');
  seek(state, 'drowned_mast');
  const noSelection = structuredClone(state);
  assert.equal(view(state).experiment, null);
  assert.equal(act(state, 'experiment', { id, settings }).ok, false);
  assert.deepEqual(state, noSelection);
  play(state, 'leave');
  assert.equal(view(state).revisitableEvents.some(({ id }) => id === 'drowned_mast'), false);

  const beforeDay = state.day;
  const beforeQi = state.qi;
  const evidence = ['oar_mark', 'reed_lines'];
  assert.equal(play(state, 'meditate', { item: 'reed_lines' }).meditation, 'ready');
  const draft = view(state).deductionDraft;
  assert.equal(draft.id, id);
  assert.deepEqual(draft.items.map((item) => item.id), evidence);
  assert.deepEqual(view(state).deductionHistory, []);
  assert.equal(Object.hasOwn(draft, 'conclusion'), false);
  seek(state, 'drowned_mast');
  assert.equal(view(state).experiment, null);
  const fieldDay = state.day;
  assert.equal(play(state, 'deduce', { id }).deduction, 'recorded');
  assert.equal(state.day, fieldDay);
  assert.ok(fieldDay > beforeDay);
  assert.equal(state.qi, beforeQi - rules.deductionQiCost);
  assert.equal(view(state).deductionDraft, null);
  const [entry] = view(state).deductionHistory;
  assert.match(entry.conclusion, /白苇滩.*高岸.*刚上涨/);
  assert.match(entry.reason, /靠岸图.*水线图/);
  assert.equal(entry.verified, false);
  assert.deepEqual(view(state).usedClues, evidence);
  assert.ok(evidence.every((key) => !view(state).evidence.some((clue) => clue.id === key)));
  assert.equal(act(state, 'meditate', { item: 'oar_mark' }).ok, false);
  assert.equal(state.inventory.eddy_note, undefined);
  assert.equal(view(state).discoveredRecipes.includes('r_bank_talisman'), false);
  assert.ok(view(state).experiment);
  for (const field of ['answer', 'expected', 'need', 'reward', 'success', 'miss']) {
    assert.equal(Object.hasOwn(view(state).experiment, field), false);
  }
  const noProof = structuredClone(state);
  delete noProof.inventory.reed_lines;
  assert.equal(view(noProof).experiment, null);
  assert.equal(act(noProof, 'experiment', { id, settings }).ok, false);
  const withoutRecord = structuredClone(state);
  withoutRecord.deductionHistory = [];
  assert.equal(view(withoutRecord).experiment, null);

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
  assert.equal(view(state).deductionHistory[0].verified, false);
  assert.equal(state.insight, beforeTrialInsight);
  assert.equal(state.inventory.eddy_note, undefined);
  assert.equal(play(state, 'experiment', { id, settings }).deduction, 'verified');
  assert.ok(state.insight > beforeTrialInsight);
  assert.ok(evidence.every((itemId) => state.inventory[itemId] >= 1));
  assert.equal(state.inventory.eddy_note, 1);
  assert.ok(!view(state).evidence.some(({ id }) => id === 'eddy_note'));
  assert.equal(view(state).discoveredRecipes.includes('r_bank_talisman'), false);
  assert.equal(act(state, 'showEddyMapToSmith').ok, false);
  assert.equal(act(state, 'discard', { id: 'eddy_note' }).confirmation.id, 'eddy_note');
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
  const [complete] = view(reloaded).deductionHistory;
  assert.deepEqual(complete, { ...entry, verified: true });
  const completedDay = reloaded.day;
  assert.equal(act(reloaded, 'deduce', { id }).ok, false);
  assert.equal(act(reloaded, 'experiment', { id, settings }).ok, false);
  assert.equal(reloaded.day, completedDay);
  assert.equal(reloaded.inventory.eddy_note, 1);
});

test('a full pack leaves the only backwater map at its verification site for later pickup', () => {
  const state = createGame();
  state.region = 'marsh';
  supplyFixture(state, { oar_mark: 1, reed_lines: 1, ration: rules.backpackCapacity * rules.backpackStackSize });
  deduceFrom(state, 'find_eddy', 'oar_mark');
  seek(state, 'drowned_mast');
  const trial = { id: 'find_eddy', settings: { release: 'stone_back', water: 'rising' } };
  assert.equal(play(state, 'experiment', trial).spilled.eddy_note, 1);
  assert.equal(state.inventory.eddy_note, undefined);
  assert.equal(view(state).groundLoot.eddy_note, 1);
  assert.equal(view(state).deductionHistory[0].verified, true);
  assert.equal(act(state, 'experiment', trial).ok, false);
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'leave');
  seek(state, 'drowned_mast');
  play(state, 'take', { id: 'eddy_note' });
  assert.equal(state.inventory.eddy_note, 1);
  assert.equal(act(state, 'take', { id: 'eddy_note' }).ok, false);
});

test('the gold assay archives its clues without using up the crafting samples', () => {
  const state = createGame();
  state.region = 'zhao_hermit';
  state.discovered.push('zhao_hermit');
  const needs = { cold_kiln_record: 1, phase_chart: 1, heart_silt: 2, stillwell_salt: 1 };
  supplyFixture(state, needs);
  deduceFrom(state, 'gold_assay', 'phase_chart');
  assert.deepEqual(view(state).deductionHistory.map(({ id }) => id), ['gold_assay']);
  assert.deepEqual(view(state).usedClues, Object.keys(needs));
  assert.ok(Object.keys(needs).every(id => !view(state).activeClues.includes(id)));
  seek(state, 'zhao_assay_tubs');
  assert.equal(state.inventory.gold_formula, undefined);
  assert.equal(play(state, 'experiment', { id: 'gold_assay', settings: { fall: 'even', salt: 'warm' } }).deduction, 'verified');
  assert.equal(state.inventory.gold_formula, 1);
  assert.equal(state.inventory.heart_silt, needs.heart_silt);
  assert.equal(state.inventory.stillwell_salt, needs.stillwell_salt);
});

test('separate mountain observations lead to earning a passive manual on site in 炼气', () => {
  const state = createGame();
  const id = 'read_echo';
  play(state, 'buy', { id: 'ration', count: 4 });
  play(state, 'buy', { id: 'qi_powder' });
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
  assert.equal(state.inventory.echo_guard_manual, undefined);
  const shelter = chooseAt(state, 'empty_oven', 0);
  assert.match(shelter.message, /雾压缓了下来/);
  assert.equal(play(state, 'meditate', { item: 'echo_note' }).meditation, 'incomplete');
  assert.equal(state.inventory.echo_method, undefined);
  assert.equal(state.inventory.echo_guard_manual, undefined);
  feed(state, 54);
  chooseAt(state, 'miner_echo', 2);
  seek(state, 'stone_niche');
  assert.equal(view(state).experiment, null);
  choose(state, 1);
  assert.equal(state.inventory.stone_rubbing, 1);
  feed(state, 48);
  seek(state, 'stone_niche');
  assert.match(view(state).currentEvent.text, /龛口|矿壳|细缝|石/);
  if (state.qi < rules.deductionQiCost) play(state, 'use', { id: 'qi_powder' });
  deduceFrom(state, id, 'stone_rubbing');
  assert.equal(view(state).experiment.id, id);
  assert.equal(play(state, 'experiment', { id, settings: { hand: 'palm', beat: 'first' } }).deduction, 'miss');
  assert.equal(state.inventory.echo_guard_manual, undefined);
  assert.equal(play(state, 'experiment', { id, settings: { hand: 'palm', beat: 'second' } }).deduction, 'verified');
  assert.equal(state.inventory.echo_method, 1);
  assert.equal(state.inventory.echo_guard_manual, 1);
  assert.equal(view(state).realmIndex, 0);
  const tooSoon = act(state, 'equipManual', { id: 'echo_guard_manual' });
  assert.equal(tooSoon.ok, false);
  assert.match(tooSoon.message, /修为|境界|炼气中期/);
  play(state, 'leave');
  feed(state, 40);
  chooseAt(state, 'miner_echo', 0);
  assert.equal(view(state).mode, 'combat');
  assert.equal(view(state).innerStyle?.active, null);
});

test('the old ford route and its optional hidden map remain playable with earned gear', () => {
  const state = createGame();
  const travelFed = (id) => {
    if (state.region === 'village') supplyFixture(state, { ration: 9 });
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
  workFed('reed_ferryman', 2);
  workFed('drowned_mast', 1);
  travelFed('village');
  play(state, 'handin', { id: 'lost_basket_return' });
  play(state, 'handin', { id: 'patch_ferry' });
  play(state, 'handin', { id: 'reed_salve' });
  assert.equal(act(state, 'breakthrough').ok, false);
  advanceFromFixture(state, 1);
  assert.equal(view(state).realmIndex, 1);

  travelFed('ridge');
  workFed('ore_rain', 0);
  workFed('ore_rain', 1);
  workFed('ore_rain', 2);
  workFed('empty_oven', 1);
  workFed('miner_echo', 1);
  assert.equal(siteIds(state).includes('stone_niche'), false);
  workFed('rope_run', 0);
  assert.ok(siteIds(state).includes('stone_niche'));
  workFed('stone_niche', 0);
  assert.equal(siteIds(state).includes('cracked_bell'), false);
  travelFed('village');
  assert.ok(state.inventory.ore >= 5);
  assert.equal(state.inventory.core, 1);
  play(state, 'handin', { id: 'sell_forging' });
  workForge(state, 'r_iron_sword');
  workForge(state, 'r_iron_coat');
  play(state, 'equip', { id: 'iron_sword' });
  play(state, 'equip', { id: 'iron_coat' });
  advanceFromFixture(state, 2);
  assert.equal(view(state).realmIndex, 2);
  assert.ok(view(state).discovered.includes('ford'));
  state.coins = Math.max(state.coins, 30);

  travelFed('ford');
  workFed('low_tide', 0);
  workFed('flood_lines', 0);
  travelFed('village');
  assert.equal(state.inventory.tide_note, 1);
  state.coins = Math.max(state.coins, 66);
  feed(state, 70);
  play(state, 'buy', { id: 'wood' });
  play(state, 'craft', { id: 'r_tide_talisman' });
  play(state, 'buy', { id: 'qi_powder' });
  while (state.hp < view(state).maxHp || state.qi < view(state).maxQi) play(state, 'rest');
  travelFed('ford');
  assert.equal(siteIds(state).includes('tide_keeper'), false);
  workFed('lock_deck', 1);
  assert.ok(siteIds(state).includes('tide_keeper'));
  for (let stop = 0; stop < 2; stop += 1) workFed('ford_relay', 1);
  play(state, 'use', { id: 'qi_powder' });
  feed(state, 45);
  seek(state, 'tide_keeper');
  assert.equal(view(state).visibleChoices.some(({ index }) => index === 2), false);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  choose(state, 0);
  assert.equal(view(state).currentEnemy.id, 'tide_spirit');

  for (let turn = 0; turn < 10 && view(state).mode === 'combat'; turn++) {
    const panel = view(state);
    if (panel.intent?.kind === 'guard' && panel.hp < panel.maxHp - 8 && state.inventory.salve) {
      play(state, 'use', { id: 'salve' });
    } else if (panel.intent?.kind === 'guard' && panel.qi < 5 && state.inventory.qi_powder) {
      play(state, 'use', { id: 'qi_powder' });
    } else if (panel.intent?.kind === 'heavy' && panel.currentEnemy.health > 0.25) {
      play(state, 'guard');
    } else if (state.inventory.tide_talisman && panel.currentEnemy.health > 0.25) {
      play(state, 'use', { id: 'tide_talisman' });
    } else {
      play(state, 'attack');
    }
  }
  assert.equal(view(state).currentEvent?.id, 'tide_keeper', state.log.slice(-8).join('\n'));
  assert.equal(state.inventory.seal, undefined);
  assert.equal(state.inventory.qi_core, undefined);
  assert.equal(view(state).groundLoot.qi_core, 4);
  play(state, 'take', { id: 'qi_core', count: 4 });
  assert.equal(state.won, false);
  assert.equal(view(state).sites.find(({ id }) => id === 'tide_keeper').creatures.tide_spirit, 0);
  chooseAt(state, 'tide_keeper', 2);
  assert.equal(state.inventory.seal, 1);
  travelFed('village');
  assert.equal(marketStock(state).includes('heal_pill'), false);
  play(state, 'handin', { id: 'last_lantern' });
  assert.equal(view(state).mode, 'victory');
  assert.equal(state.inventory.seal, undefined);
  const wonDay = state.day;
  play(state, 'resume');
  assert.equal(view(state).mode, 'village');
  assert.ok(marketStock(state).includes('heal_pill'));
  const lowRealm = structuredClone(state);
  lowRealm.realm = 0;
  const lateOffer = view(lowRealm).market.stalls.flatMap(({ offers }) => offers).find(({ id }) => id === 'heal_pill');
  assert.equal(lateOffer.canBuy, true);
  play(lowRealm, 'buy', { id: 'heal_pill' });
  assert.match(act(lowRealm, 'use', { id: 'heal_pill' }).message, /承受不了/);
  assert.deepEqual(marketStock(lowRealm), marketStock(state));
  assert.equal(view(state).discovered.includes('hidden'), false);
  assert.equal(act(state, 'travel', { id: 'hidden' }).ok, false);
  play(state, 'buy', { id: 'ration', count: 4 });
  travelFed('marsh');
  seek(state, 'old_fire');
  const early = view(state);
  assert.equal(early.visibleChoices.some(({ index }) => index === 3), true);
  assert.equal(early.discovered.includes('hidden'), false);
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
  workFed('ford_relay', 1);
  deduceFrom(state, 'trace_backwash', 'bell_clapper');
  if (state.event) play(state, 'leave');
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
  if (!state.inventory.wood) play(state, 'buy', { id: 'wood' });
  travelFed('hidden');
  assert.deepEqual(siteIds(state), ['upstream_lights', 'sunken_mooring', 'still_pole']);
  seek(state, 'upstream_lights');
  const wood = state.inventory.wood;
  const qi = state.qi;
  choose(state, 0);
  assert.equal(state.inventory.wood ?? 0, wood - 1);
  assert.equal(state.qi, Math.min(view(state).maxQi, qi + 4));
  feed(state, 20);
  chooseAt(state, 'still_pole', 0);
  assert.equal(state.inventory.lamp_sketch, 1);
  assert.equal(state.wonDay, wonDay);
  travelFed('ford');
  assert.equal(view(state).sites.find(({ id }) => id === 'tide_keeper').creatures.tide_spirit, 0);
});

test('the moved ford platform stays moved when its food was recovered before or afterward', () => {
  for (const order of [[0, 1], [1, 0]]) {
    const state = createGame();
    supplyFixture(state, { ridge_rubbing: 1, ford_chart: 1, ration: 5 });
    play(state, 'wait');
    feed(state, 100);
    walk(state, 'ford');
    assert.equal(siteIds(state).includes('tide_keeper'), false);
    assert.equal(siteIds(state).includes('ford_relay'), false);
    for (const index of order) {
      feed(state, 65);
      chooseAt(state, 'lock_deck', index);
    }
    assert.ok(siteIds(state).includes('tide_keeper'));
    assert.ok(siteIds(state).includes('ford_relay'));
    seek(state, 'lock_deck');
    assert.match(view(state).currentEvent.text, /石阶已露出/);
    assert.doesNotMatch(view(state).currentEvent.text, /还牵着木排/);
  }
});

test('the medicine stall buys a limited batch of finished remedies below its retail prices', () => {
  const state = createGame(79);
  const stall = data.market.stalls.find(row => row.offers.some(({ id }) => id === 'salve'));
  const id = stall.id;
  state.coins = 100;
  play(state, 'buy', { stallId: id, id: 'salve', count: 4 });
  supplyFixture(state, { reed: 8, wood: 3 });
  play(state, 'merchantOrder', { id });
  const order = () => view(state).market.stalls.find(row => row.id === id).merchant.order;
  assert.match(order().reason, /上一单/);
  state.day += 14;
  assert.match(order().reason, /回气散/);
  supplyFixture(state, { qi_powder: 3 });
  const purchaseCost = order().need.salve * data.items.find(item => item.id === 'salve').price
    + order().need.qi_powder * data.items.find(item => item.id === 'qi_powder').price;
  assert.ok(order().reward.spirit_coin < purchaseCost);
  const before = state.coins;
  play(state, 'merchantOrder', { id });
  assert.equal(state.coins, before + 26);
  assert.equal(state.inventory.salve, 4);
  assert.equal(state.inventory.qi_powder, undefined);
  assert.match(order().reason, /上一单/);
  assert.equal(act(state, 'merchantOrder', { id }).ok, false);
  assert.equal(state.coins, before + 26);
});

test('paid purchases reveal only that specialist’s order and the planted seed sustains multiple trips', () => {
  const state = createGame();
  const stallId = 'rice_vendor';
  const merchant = () => view(state).market.stalls.find(({ id }) => id === stallId).merchant;
  assert.equal(facility(state, 'garden'), undefined);
  assert.equal(merchant().order, null);
  assert.equal(act(state, 'buy', { stallId, id: 'wood' }).ok, false);
  assert.equal(act(state, 'buy', { stallId, id: 'ration', count: 7 }).ok, false);
  assert.equal(merchant().order, null);
  play(state, 'buy', { stallId, id: 'ration', count: 5 });
  assert.equal(merchant().order, null);
  const regular = play(state, 'buy', { stallId, id: 'ration' });
  assert.ok(regular.merchantMessage);
  assert.equal(merchant().regular, true);
  assert.match(merchant().order.reason, new RegExp(data.items.find(({ id }) => id === 'reed').name));
  assert.equal(facility(state, 'garden'), undefined);
  assert.equal(view(state).market.stalls.filter(({ merchant: row }) => row.regular).length, 1);

  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'reed_banks', 1);
  chooseAt(state, 'mud_track', 1);
  walk(state, 'village');
  supplyFixture(state, { reed: 6 });
  play(state, 'econDeposit', { id: 'reed', count: 6 });
  play(state, 'merchantOrder', { id: stallId });
  assert.equal(state.economy.warehouse.reed, undefined);
  assert.equal(state.inventory.millet_seed, 3);
  assert.ok(merchant().completed);
  assert.match(merchant().order.reason, /上一单/);
  assert.equal(facility(state, 'garden').level, 0);
  assert.equal(facility(state, 'hearth').level, 0);
  buildFromFixture(state, 'garden');
  supplyFixture(state, { reed: 1 });
  play(state, 'econStart', { id: 'sow_millet' });
  const [sowing] = facility(state, 'garden').jobs;
  assert.equal(act(state, 'econCollect', { id: sowing.id }).ok, false);
  assert.equal(sowing.ready, false);
  const remaining = sowing.remaining;
  feed(state, 55);
  walk(state, 'marsh');
  uncoverFerryman(state);
  walk(state, 'village');
  assert.ok(facility(state, 'garden').jobs[0].remaining < remaining);
  finishProject(state, 'garden');
  assert.equal(state.inventory.millet_seed, 3);
  assert.equal(state.inventory.millet_grain, 10);
  assert.equal(act(state, 'econCollect', { id: sowing.id }).ok, false);
  play(state, 'merchantOrder', { id: stallId });
  assert.equal(state.inventory.millet_grain, 2);

  buildFromFixture(state, 'hearth');
  supplyFixture(state, { millet_grain: 3, wood: 1 });
  play(state, 'econDeposit', { id: 'millet_grain', count: 3 });
  play(state, 'econStart', { id: 'steam_millet' });
  assert.equal(state.economy.warehouse.millet_grain, undefined);
  const rationCount = state.inventory.ration ?? 0;
  finishProject(state, 'hearth');
  assert.equal(state.inventory.ration, rationCount + 6);
});

test('ranged strikes spend compatible ammo, and an empty bow falls back to fists without leaving the hand', () => {
  const state = createGame();
  state.realm = 2;
  state.hp = 47;
  state.qi = 22;
  supplyFixture(state, { reed_bow: 1, reed_arrow: 1, iron_arrow: 1, black_bolt: 3, qi_powder: 1 });
  state.durability.reed_bow = data.gear.find(({ id }) => id === 'reed_bow').durability;
  play(state, 'equip', { id: 'reed_bow' });
  walk(state, 'marsh');
  chooseAt(state, 'mud_track', 0);
  assert.equal(view(state).combatWeapon.selectedAmmo, 'reed_arrow');
  const before = structuredClone(state);
  assert.equal(act(state, 'selectAmmo', { id: 'black_bolt' }).ok, false);
  assert.deepEqual(state, before);
  play(state, 'selectAmmo', { id: 'iron_arrow' });
  assert.equal(view(state).combatWeapon.selectedAmmo, 'iron_arrow');
  const hit = play(state, 'attack');
  assert.ok(hit.damageDealt > 0);
  assert.equal(state.inventory.iron_arrow, undefined);
  assert.equal(state.inventory.black_bolt, 3);
  assert.equal(view(state).combatWeapon.selectedAmmo, 'reed_arrow');
  state.combat.hp = 1;
  assert.equal(play(state, 'attack').ok, true);
  assert.equal(view(state).currentEvent?.id, 'mud_track');
  assert.equal(state.inventory.reed_arrow, undefined);

  play(state, 'use', { id: 'qi_powder' });
  choose(state, 2);
  assert.equal(view(state).combatWeapon.isLoaded, false);
  const bowWear = state.durability.reed_bow;
  const unloaded = structuredClone(state);
  assert.match(act(state, 'weaponSpell').message, /无法引气/);
  assert.deepEqual(state, unloaded);
  assert.match(play(state, 'attack').message, /空手/);
  assert.equal(state.durability.reed_bow, bowWear);
  if (view(state).mode === 'combat') {
    const locked = structuredClone(state);
    assert.match(act(state, 'combatEquip', { id: 'cudgel' }).message, /交手中不能换装备/);
    assert.deepEqual(state, locked);
    assert.equal(view(state).combatWeapon.id, 'reed_bow');
  }
  assert.equal(state.inventory.black_bolt, 3);
});

test('a prepared ford expedition opens each later region through field contacts, then verifies a design and finishes at 筑基初期', () => {
  const state = createGame(731);
  // The earlier route test earns and collects the ford seal. Start with that expedition's supplies.
  supplyFixture(state, { ford_chart: 1, ridge_rubbing: 1, seal: 1, ore: 1, tide_coat: 1, tide_note: 1 });
  state.realm = 2;
  state.coins = 700;
  state.insight = 60;
  state.seenChoices.push('drowned_mast:1');
  state.durability.tide_coat = data.gear.find(({ id }) => id === 'tide_coat').durability;
  play(state, 'equip', { id: 'tide_coat' });
  play(state, 'handin', { id: 'last_lantern' });
  assert.equal(state.completionPhase, 'ford');
  play(state, 'resume');

  const provision = () => {
    if (state.region !== 'village') walk(state, 'village');
    for (let day = 0; day < 10 && ((state.inventory.ration ?? 0) < 16); day++) {
      const stock = view(state).market.stalls.find(({ id }) => id === 'rice_vendor').offers[0];
      if (stock.maximum) play(state, 'buy', { id: stock.id, count: Math.min(16 - (state.inventory.ration ?? 0), stock.maximum) });
      else play(state, 'wait');
    }
    while (state.hp < view(state).maxHp || state.qi < view(state).maxQi) play(state, 'rest');
    feed(state, 76);
  };
  const visitAndChoose = (id, choice) => {
    feed(state, 42);
    return chooseAt(state, id, choice);
  };
  const gather = (siteId, item, quota) => {
    const region = state.region;
    for (let turn = 0; turn < 80 && (state.inventory[item] ?? 0) < quota; turn++) {
      if ((state.inventory.ration ?? 0) < 2 || state.hp < 12) {
        provision();
        walk(state, region);
      }
      feed(state, 42);
      if (state.event !== siteId) seek(state, siteId);
      const harvest = view(state).visibleChoices.find(({ available, gather }) => available && gather?.some(({ id }) => id === item));
      if (harvest) choose(state, harvest.index);
      else play(state, 'wait');
    }
    assert.ok((state.inventory[item] ?? 0) >= quota, item);
    if (state.event) play(state, 'leave');
  };
  const openRoute = (siteId, key, next) => {
    assert.equal(act(state, 'travel', { id: next }).ok, false);
    const require = data.events.find(({ id }) => id === siteId).choices[0].need;
    const carried = { ...state.inventory };
    visitAndChoose(siteId, 0);
    for (const [id, count] of Object.entries(require)) assert.equal(state.inventory[id] ?? 0, carried[id] - count, id);
    assert.equal(state.inventory[key], 1);
    assert.ok(view(state).discovered.includes(next));
  };

  provision();
  walk(state, 'pine_ridge');
  gather('pine_stand', 'wood', 8);
  openRoute('timber_bridge', 'kiln_tracks', 'kiln_valley');
  assert.equal(view(state).realmIndex, 2);

  provision();
  walk(state, 'kiln_valley');
  gather('clay_bank', 'kiln_clay', 6);
  assert.equal(state.inventory.herb_tie, undefined);
  openRoute('kiln_carter', 'herb_tie', 'herb_basin');
  const kiln = view(state).sites.map(({ id }) => id);
  assert.equal(kiln.includes('kiln_flue'), false);
  visitAndChoose('abandoned_kiln', 0);
  assert.equal(state.inventory.kiln_manual, 1);
  assert.ok(view(state).sites.some(({ id }) => id === 'kiln_flue'));
  gather('clay_bank', 'kiln_clay', 4);

  provision();
  assert.equal(facility(state, 'furnace').level, 0);
  play(state, 'buy', { id: 'wood', count: 4 });
  walk(state, 'herb_basin');
  gather('herb_beds', 'reed', 8);
  openRoute('mist_shelter', 'mine_guide', 'black_mine');
  visitAndChoose('mist_shelter', 1);
  assert.equal(state.inventory.herb_press, 1);
  gather('herb_beds', 'reed', 5);

  provision();
  walk(state, 'black_mine');
  gather('mine_tailings', 'black_iron', 6);
  openRoute('winch_house', 'snow_token', 'snow_pass');
  visitAndChoose('winch_house', 1);
  assert.equal(state.inventory.vein_pattern, 1);
  assert.equal(state.inventory.arrow_pattern, 1);

  provision();
  walk(state, 'snow_pass');
  gather('silk_bough', 'hide', 6);
  openRoute('snow_fire', 'sky_cord', 'sky_terrace');
  visitAndChoose('white_ravine', 2);
  assert.equal(state.inventory.hook_iron, 1);

  provision();
  walk(state, 'sky_terrace');
  assert.equal(view(state).realmIndex, 2);
  assert.equal(view(state).sites.some(({ id }) => id === 'mirror_gate'), false);
  visitAndChoose('old_observatory', 0);
  assert.ok(view(state).sites.some(({ id }) => id === 'mirror_gate'));
  visitAndChoose('old_observatory', 2);
  visitAndChoose('cloud_scree', 2);
  visitAndChoose('old_observatory', 1);
  const deduction = 'align_axis';
  deduceFrom(state, deduction, 'vein_pattern');
  assert.equal(state.inventory.axis_tuning, undefined);
  seek(state, 'old_observatory');
  assert.equal(play(state, 'experiment', { id: deduction, settings: { notch: 'outer', shadow: 'center' } }).deduction, 'miss');
  assert.equal(state.inventory.axis_tuning, undefined);
  assert.equal(play(state, 'experiment', { id: deduction, settings: { notch: 'inner', shadow: 'center' } }).deduction, 'verified');
  assert.equal(state.inventory.axis_tuning, 1);
  play(state, 'leave');
  gather('cloud_scree', 'core', 8);

  provision();
  const legacyRoute = ['marsh', 'ridge', 'ford', 'pine_ridge', 'kiln_valley', 'herb_basin', 'black_mine', 'snow_pass', 'sky_terrace'];
  assert.deepEqual(view(state).discovered.filter((id) => legacyRoute.includes(id)), legacyRoute);
  assert.ok(legacyRoute.every((id) => data.sites.filter(({ region }) => region === id).length >= 3));
  assert.ok(view(state).discovered.includes('zhao_city'));
  assert.ok(!view(state).discovered.includes('undertow_grotto') && !view(state).discovered.includes('counter_bell'));
  assert.equal(view(state).quests.some(({ id }) => id === 'sky_treaty'), false);
  workForge(state, 'r_snow_halberd');
  play(state, 'equip', { id: 'snow_halberd' });
  supplyFixture(state, { heal_pill: 4 });
  provision();
  walk(state, 'snow_pass');
  visitAndChoose('white_ravine', 0);
  for (let turn = 0; turn < 30 && state.combat; turn++) {
    const panel = view(state);
    if (panel.hp < panel.maxHp - 15 && state.inventory.heal_pill && panel.intent?.kind !== 'heavy') play(state, 'use', { id: 'heal_pill' });
    else if (panel.intent?.kind === 'heavy') play(state, 'guard');
    else play(state, 'attack');
  }
  assert.equal(view(state).groundLoot.foundation_core, 3, state.log.slice(-8).join('\n'));
  play(state, 'take', { id: 'foundation_core', count: 3 });
  assert.ok(state.defeated.includes('snow_warden'));

  provision();
  const realm = data.realms.find(({ id }) => id === 3);
  state.coins = Math.max(state.coins, realm.cost + 20);
  assert.ok(state.insight >= realm.insight);
  assert.ok(state.practice[2] >= realm.practice);
  assert.match(act(state, 'breakthrough').message, /筑基丹/);
  // The alchemy-chain integration test earns and brews the pill from its own clues.
  // Here it is a fixture to isolate the old world's independent final route.
  supplyFixture(state, { foundation_pill: 1 });
  play(state, 'breakthrough');
  assert.equal(state.realm, 3);
  assert.equal(state.inventory.foundation_pill, undefined);
  assert.equal(view(state).nextRealm.name, '筑基中期');

  for (const id of ['r_sky_bow', 'r_cloud_arrow', 'r_sky_cloak']) workForge(state, id);
  play(state, 'equip', { id: 'sky_bow' });
  play(state, 'equip', { id: 'sky_cloak' });
  provision();
  walk(state, 'sky_terrace');
  feed(state, 42);
  seek(state, 'mirror_gate');
  assert.equal(view(state).visibleChoices.some(({ index }) => index === 2), false);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  choose(state, 0);
  const ammo = state.inventory.cloud_arrow;
  const cores = state.inventory.foundation_core ?? 0;
  for (let turn = 0; turn < 12 && state.combat; turn++) {
    play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.ok(state.inventory.cloud_arrow < ammo);
  assert.ok(state.defeated.includes('mirror_warden'), state.log.slice(-8).join('\n'));
  assert.equal(state.inventory.foundation_core ?? 0, cores);
  assert.equal(view(state).groundLoot.foundation_core, 2);
  play(state, 'take', { id: 'foundation_core', count: 2 });
  assert.equal(state.inventory.foundation_core, cores + 2);
  assert.equal(state.inventory.sky_seal, undefined);
  chooseAt(state, 'mirror_gate', 2);
  assert.equal(state.inventory.sky_seal, 1);
  provision();
  for (const id of ['foundation_core', 'beast_meat']) {
    const count = state.inventory[id];
    if (count) play(state, 'econDeposit', { id, count });
  }
  play(state, 'handin', { id: 'sky_treaty' });
  assert.equal(state.completionPhase, 'final');
  assert.equal(state.finalWon, true);
  assert.equal(state.won, true);
  assert.equal(state.inventory.sky_seal, undefined);
  play(state, 'resume');
  assert.equal(view(state).mode, 'village');
});
