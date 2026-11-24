import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';
import { apparentBanditGrade, checkRoadBanditStep, roadBanditRisk } from './bandits.mjs';
import { backFromRoad, continueRoad, roadGraph, roadTripView, travelRoad } from './world.mjs';

const regions = Object.fromEntries(data.regions.map((region) => [region.id, region]));
const foods = Object.fromEntries(data.foods.map((food) => [food.id, food]));

function roadKit(checkRoadStep) {
  return {
    data, rules, records: { regions }, checkRoadStep,
    owns: (state, id) => state.inventory[id] ?? 0,
    roadProtection: () => null,
    advance(state, days, rate = rules.satietyDrainPerDay) {
      state.day = Math.round((state.day + days) * 1000) / 1000;
      state.satiety = Math.max(0, Number((state.satiety - days * rate).toFixed(3)));
    },
    eatOnRoad(state, id) {
      state.inventory[id] -= 1;
      state.satiety += foods[id].satiety;
      return { ok: true };
    },
    goodsText: (items) => Object.keys(items).join('、'),
    say: (_state, message) => ({ ok: true, message }),
    refuse: (message) => ({ ok: false, message }),
  };
}

function traveler(region, known = []) {
  const state = createGame(621);
  state.region = region;
  state.discovered = [...new Set([region, ...state.discovered, ...known])];
  state.satiety = 96;
  return state;
}

test('the shortest route uses only known roads and can improve on a longer direct edge', () => {
  const state = traveler('village', ['pine_ridge', 'ford']);
  const journey = (destination) => view(state).world.journeys.find(({ id }) => id === destination);
  assert.deepEqual(journey('pine_ridge').path, ['village', 'pine_ridge']);
  assert.ok(!view(state).world.edges.some(({ key }) => key === 'ford|village'));
  state.seenChoices.push('ford_lamp_channel:0');
  const shorter = journey('pine_ridge');
  assert.deepEqual(shorter.path, ['village', 'ford', 'pine_ridge']);
  assert.equal(shorter.units, 6);
  assert.equal(shorter.days, 1.5);
  const direct = view(state).world.edges.find(({ key }) => key === 'pine_ridge|village');
  assert.equal(direct.units, 8);
  assert.ok(!journey('snow_pass'));
});

test('a single planned journey can pass through both permitted province crossings', () => {
  const through = ['ford', 'zhao_city', 'flood_market', 'zhao_pass', 'mingsha_city'];
  const state = traveler('village', through);
  state.inventory.ration = 15;
  const route = () => view(state).world.journeys.find(({ id }) => id === 'mingsha_city');
  assert.equal(route(), undefined);
  state.knownItems.push('ferry_manifest');
  assert.equal(route(), undefined);
  state.knownItems.push('sand_writ');
  const trip = route();
  assert.ok(trip.available);
  assert.deepEqual(trip.path, ['village', 'marsh', ...through]);
  assert.equal(trip.days, 15.75);
  assert.equal(trip.units, 63);
});

test('interrupted progress resumes after the exact step; returning revisits only the walked distance', () => {
  const checked = [];
  const kit = roadKit((state, leg, index) => {
    checked.push([leg.from, index, state.roadTrip.stop]);
    return index === 2 ? { message: '停步' } : null;
  });
  const state = traveler('marsh', ['ridge']);
  const day = state.day;
  const first = travelRoad(state, 'ridge', kit);
  assert.equal(first.roadInterrupted, true);
  assert.equal(first.message, '停步');
  assert.equal(state.region, 'marsh');
  assert.equal(state.day, day + 0.5);
  assert.equal(state.roadTrip.stop, 'road:marsh|ridge:2');
  assert.equal(roadTripView(state, kit).remainingUnits, 1);
  assert.ok(continueRoad(state, kit).ok);
  assert.equal(state.region, 'ridge');
  assert.equal(state.roadTrip, null);
  assert.equal(state.day, day + 0.75);
  assert.deepEqual(checked.map(([, index]) => index), [1, 2, 3]);

  const reverse = travelRoad(state, 'marsh', kit);
  assert.ok(reverse.roadInterrupted);
  assert.equal(state.roadTrip.stop, 'road:marsh|ridge:2');
  assert.equal(state.region, 'ridge');
  assert.equal(state.day, day + 1.25);
  const turnBack = backFromRoad(state, kit);
  assert.equal(turnBack.roadInterrupted, true);
  assert.equal(state.roadTrip.stop, 'road:marsh|ridge:2');
  assert.equal(state.roadTrip.destination, 'ridge');
  assert.equal(state.day, day + 1.5);
  assert.ok(continueRoad(state, kit).ok);
  assert.equal(state.region, 'ridge');
  assert.equal(state.roadTrip, null);
  assert.equal(state.day, day + 1.75);
  assert.deepEqual(checked.slice(3).map(([, index]) => index), [3, 2, 2, 3]);
});

test('an unlocked fractional shortcut uses the same cache positions in both directions', () => {
  const state = traveler('cold_kiln', ['hanging_vein']);
  state.seenChoices.push('sand_hunt_colony:4');
  const shortcut = roadGraph(data, { state }).find(({ key }) => key === 'cold_kiln|hanging_vein');
  assert.equal(shortcut.units, 3.5);
  const checked = [];
  const kit = roadKit((state, leg, index) => {
    checked.push([state.roadTrip.stop, leg.stepUnits]);
    return null;
  });
  assert.ok(travelRoad(state, 'hanging_vein', kit).ok);
  assert.ok(travelRoad(state, 'cold_kiln', kit).ok);
  assert.deepEqual(checked.map(([, units]) => units), [1, 1, 1, 0.5, 0.5, 1, 1, 1]);
  assert.deepEqual(checked.slice(0, 4), checked.slice(4).reverse());
});

test('ferry units do not roll for bandits and interrupted journeys only consume meals as needed', () => {
  const state = traveler('ford', ['zhao_city', 'flood_market']);
  state.knownItems.push('ferry_manifest');
  state.world.lastSettlement = 'willow_post';
  state.expeditionLoot = { ore: 2 };
  let checked = 0;
  const kit = roadKit((_state, leg) => {
    assert.equal(leg.water, undefined);
    return ++checked === 1 ? true : null;
  });
  const result = travelRoad(state, 'flood_market', kit);
  assert.ok(result.roadInterrupted);
  assert.equal(state.region, 'zhao_city');
  assert.equal(state.day, 6.75);
  assert.equal(state.world.lastSettlement, 'willow_post');
  assert.deepEqual(state.expeditionLoot, { ore: 2 });
  assert.equal(state.inventory.ration, 3);
  assert.equal(state.satiety, 4);
  assert.ok(continueRoad(state, kit).ok);
  assert.equal(state.region, 'flood_market');
  assert.equal(state.day, 7.5);
  assert.equal(state.inventory.ration, 2);
  assert.equal(checked, 4);
});

const allGear = Object.fromEntries(data.gear.map((entry) => [entry.id, entry]));
const roadPolicyKit = { data, records: { gear: allGear },
  banditDenPopulation: (state, id) => Object.values(data.sites.find((site) => site.id === id).creatures)
    .reduce((sum, { start }) => sum + start, 0) -
    Object.values(state.siteVictories[id] ?? {}).reduce((sum, won) => sum + won, 0),
  activeGear: (state) => Object.values(state.equipment).filter((id) => state.durability[id] > 0).map((id) => allGear[id]) };
const riskyLeg = { key: 'marsh|ridge' };
const banditStepKit = { ...roadPolicyKit, records: {
  ...roadPolicyKit.records, enemies: Object.fromEntries(data.enemies.map((enemy) => [enemy.id, enemy])),
}, groundAt: () => ({}), say: (_state, message) => ({ ok: true, message }) };

function seedWith(...limits) {
  for (let seed = 0; seed < 100000; seed++) {
    let cursor = seed;
    if (limits.every((limit) => {
      cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0;
      return cursor / 0x100000000 < limit;
    })) return seed;
  }
  throw new Error('No seed in range matches the required draws');
}

function interrupted({ fixed = true } = {}) {
  const state = traveler('marsh', ['ridge']);
  if (!fixed) state.resolvedBandits.push('road_slate_peg');
  state.roadSeed = seedWith(0.05, 0.55, 0.5);
  const result = act(state, 'travel', { id: 'ridge' });
  assert.equal(result.roadInterrupted, true);
  return state;
}

test('each full road unit uses the same threshold regardless of earlier encounters', () => {
  const leg = { ...riskyLeg, stepUnits: 1 };
  for (const [seed, shouldStop] of [[2023, true], [2075, false]]) {
    for (const prior of [0, 1, 2, 4]) {
      const state = traveler('marsh', ['ridge']);
      state.resolvedBandits.push('road_slate_peg');
      state.roadSeed = seed;
      state.roadTrip = { banditsMet: Array.from({ length: prior }, (_, i) => `already-met-${i}`) };
      assert.equal(Boolean(checkRoadBanditStep(state, leg, 1, banditStepKit)?.roadInterrupted), shouldStop);
      assert.equal(state.roadTrip.banditsMet.length, prior + Number(shouldStop));
    }
  }
});

test('an entered edge keeps its threshold until the player starts a new crossing', () => {
  const state = traveler('marsh', ['ridge']);
  state.resolvedBandits.push('road_slate_peg');
  state.roadTrip = {};
  state.roadSeed = 2075;
  assert.equal(checkRoadBanditStep(state, riskyLeg, 1, banditStepKit), null);
  const defeated = Array.from({ length: 16 }, (_, index) => `0:${index}`);
  state.banditCrews.grey_gully = { encounters: 0, defeated };
  assert.ok(roadBanditRisk(state, riskyLeg, banditStepKit).chance < 0.020);
  state.roadSeed = 2023;
  assert.ok(checkRoadBanditStep(state, riskyLeg, 2, banditStepKit)?.roadInterrupted);
  assert.equal(state.roadTrip.banditRiskByLeg[riskyLeg.key].chance, 0.027);
});

test('village paths, guarded city roads, ferries and teleport scrolls do not roll a road encounter', () => {
  const state = traveler('village');
  state.roadSeed = seedWith(0.02);
  const seed = state.roadSeed;
  assert.ok(act(state, 'travel', { id: 'marsh' }).ok);
  assert.equal(state.region, 'marsh');
  const roads = roadGraph(data);
  const safe = data.roadBandits.roads.every(({ a, b }) => ![a, b].some((id) =>
    id === 'village' || data.regionDetails[id]?.settlement));
  assert.ok(safe);
  assert.equal(state.roadSeed, seed);
  assert.equal(roadBanditRisk(state, roads.find(({ water }) => water), roadPolicyKit), null);
  const gate = roads.find(({ key }) => key === 'ford|village');
  assert.equal(roadBanditRisk(state, gate, roadPolicyKit), null);
  state.inventory.gate_scroll = 1;
  state.world.gates.push('village');
  assert.ok(act(state, 'gateScroll', { id: 'village' }).ok);
  assert.equal(state.region, 'village');
  assert.equal(state.roadSeed, seed);
});

test('the main grade comes from the visible armor, independent of true realm and gear hidden in the bag', () => {
  const state = interrupted({ fixed: false });
  const twin = structuredClone(state);
  twin.realm = 8;
  twin.inventory.fault_coat = 1;
  assert.equal(apparentBanditGrade(twin, roadPolicyKit), 0);
  assert.match(view(state).roadTrip.bandit.name, /强盗 · 炼气/);
  assert.equal(view(state).roadTrip.bandit.name, view(twin).roadTrip.bandit.name);
  twin.equipment.armor = 'fault_coat';
  assert.equal(apparentBanditGrade(twin, roadPolicyKit), 2);
  const feeByMajor = [0, 1, 2].map((grade) => data.roadBandits.pools.filter(({ tier }) => Math.floor(tier / 3) === grade)
    .map(({ fee }) => fee));
  for (const [index, fees] of feeByMajor.slice(1).entries()) {
    assert.ok(Math.min(...fees.map(([min]) => min)) > Math.max(...feeByMajor[index].map(([, max]) => max)));
  }
});

test('a mixed toll transfers goods and coins together on confirmation, then the walk can continue', () => {
  const state = interrupted();
  assert.equal(state.roadBandit.fixed, 'road_slate_peg');
  const firstStop = state.roadTrip.progress;
  const arrivalAtStop = state.day;
  state.coins = 6;
  state.inventory.wood = 2;
  assert.equal(act(state, 'roadContinue').ok, false);
  assert.equal(act(state, 'banditPayItem', { id: 'wood', count: 3 }).ok, false);
  assert.equal(act(state, 'banditPayItem', { id: 'cudgel' }).ok, false);
  assert.equal(view(state).roadTrip.bandit.offers.find(({ id }) => id === 'wood').price, 2);
  assert.ok(act(state, 'banditPayItem', { id: 'wood', count: 2 }).ok);
  assert.equal(view(state).roadTrip.bandit.remaining, 1);
  assert.equal(act(state, 'banditSettle').ok, false);
  assert.equal(state.coins, 6);
  assert.equal(state.inventory.wood, 2);
  assert.ok(act(state, 'banditPayCoins').ok);
  assert.equal(state.coins, 6);
  assert.equal(state.inventory.wood, 2);
  assert.equal(state.roadTrip.progress, firstStop);
  assert.equal(state.day, arrivalAtStop);
  assert.ok(state.roadBandit);
  assert.equal(act(state, 'roadContinue').ok, false);

  const allCash = structuredClone(state);
  const cashOnly = act(allCash, 'banditPay');
  assert.ok(cashOnly.ok, cashOnly.message);
  assert.equal(cashOnly.paidCoins, state.roadBandit.fee);
  assert.equal(allCash.inventory.wood, 2);
  assert.equal(allCash.roadBandit, null);

  const confirmed = act(state, 'banditSettle');
  assert.ok(confirmed.ok, confirmed.message);
  assert.deepEqual(confirmed.paidGoods, { wood: 2 });
  assert.equal(confirmed.paidCoins, 1);
  assert.equal(state.coins, 5);
  assert.equal(state.inventory.wood, undefined);
  assert.equal(state.equipment.weapon, 'cudgel');
  assert.equal(state.equipment.armor, 'straw_cape');
  assert.equal(state.roadTrip.progress, firstStop);
  assert.equal(state.roadBandit, null);
  assert.equal(act(state, 'banditSettle').ok, false);
  assert.ok(state.banditLeads.includes('bandit_slope_den'));
  assert.equal(state.inventory.road_sleeve_manual, undefined);
  assert.ok(state.resolvedBandits.includes('road_slate_peg'));
  const dayAtStop = state.day;
  state.roadSeed = 2300;
  assert.ok(act(state, 'roadContinue').ok);
  assert.equal(state.region, 'ridge');
  assert.equal(state.day, dayAtStop + 0.5);
});

test('a traveler short of money hands over gear and collateral together and keeps protected supplies', () => {
  const state = interrupted();
  state.coins = 1;
  state.inventory.wood = 1;
  state.inventory.quarry_spear = 1;
  state.durability.quarry_spear = allGear.quarry_spear.durability;
  state.inventory.road_sleeve_manual = 1;
  state.inventory.ridge_rubbing = 1;
  state.reliefRations = state.inventory.ration;
  const coinsBefore = view(state).roadTrip.bandit.allValue;
  assert.equal(coinsBefore, 3);
  assert.ok(act(state, 'banditPayCoins').ok);
  assert.ok(act(state, 'banditPayItem', { id: 'wood', count: 1 }).ok);
  assert.equal(state.coins, 1);
  assert.equal(state.inventory.wood, 1);
  const paid = act(state, 'banditSurrender');
  assert.ok(paid.ok);
  assert.equal(paid.paidCoins, 1);
  assert.deepEqual(paid.paidGoods, { wood: 1, quarry_spear: 1, cudgel: 1, straw_cape: 1 });
  for (const id of Object.keys(paid.paidGoods)) assert.equal(state.inventory[id], undefined);
  assert.ok(Object.values(state.equipment).every((item) => item === null));
  assert.equal(state.coins, 0);
  for (const id of ['ration', 'road_sleeve_manual', 'ridge_rubbing']) {
    assert.ok(state.inventory[id]);
  }
  assert.equal(state.roadBandit, null);
});

test('a bandit can dismiss the stripped traveler without asking for another payment or dropping anything', () => {
  const state = interrupted();
  state.coins = 0;
  state.reliefRations = state.inventory.ration;
  assert.ok(act(state, 'banditSurrender').ok);
  assert.ok(Object.values(state.equipment).every((id) => id === null));
  state.roadSeed = 2300;
  assert.ok(act(state, 'roadContinue').ok);
  assert.equal(state.region, 'ridge');

  const inventory = structuredClone(state.inventory);
  const lootSeed = state.banditLootSeed;
  const encounters = state.banditCrews.grey_gully.encounters;
  state.roadSeed = seedWith(0.05, 0.55, 0.5, 0.6);
  let afterDismissal = state.roadSeed;
  for (let draw = 0; draw < 4; draw++) afterDismissal = (Math.imul(afterDismissal, 1664525) + 1013904223) >>> 0;
  const result = act(state, 'travel', { id: 'marsh' });
  assert.equal(result.banditDismissed, true);
  assert.equal(result.roadInterrupted, true);
  assert.equal(state.roadBandit, null);
  assert.equal(state.combat, null);
  assert.equal(view(state).roadTrip.bandit, null);
  assert.equal(state.banditCrews.grey_gully.encounters, encounters + 1);
  assert.deepEqual(view(state).groundLoot, {});
  assert.deepEqual(state.inventory, inventory);
  assert.equal(state.coins, 0);
  assert.equal(state.banditLootSeed, lootSeed);
  assert.equal(state.roadSeed, afterDismissal);

  for (const action of ['banditPay', 'banditSurrender', 'banditFight']) {
    assert.equal(act(state, action).ok, false);
    assert.equal(state.roadSeed, afterDismissal);
  }
  state.roadSeed = 2300;
  assert.ok(act(state, 'roadContinue').ok);
  assert.equal(state.region, 'marsh');
});

test('helping the wounded road bandit teaches the manual once and the den leader controls linked road danger', () => {
  const state = interrupted();
  assert.equal(act(state, 'banditPlot', { id: 'bind_road_arm' }).ok, false);
  state.inventory.salve = 1;
  const result = act(state, 'banditPlot', { id: 'bind_road_arm' });
  assert.ok(result.ok);
  assert.equal(state.inventory.salve, undefined);
  assert.equal(state.inventory.road_sleeve_manual, 1);
  assert.equal(act(state, 'banditPlot', { id: 'bind_road_arm' }).ok, false);
  assert.equal(roadBanditRisk(state, riskyLeg, roadPolicyKit).chance, 0.027);
  const den = data.sites.find(({ id }) => id === 'bandit_slope_den');
  state.siteVictories[den.id] = { bandit_den_scout: 1 };
  const firstChance = roadBanditRisk(state, riskyLeg, roadPolicyKit).chance;
  assert.ok(firstChance < 0.027 && firstChance > 0.025);
  state.siteVictories[den.id].bandit_den_leader = 1;
  assert.equal(roadBanditRisk(state, riskyLeg, roadPolicyKit).chance, 0);
});

test('intact normal dodge gear reduces road risk without changing the fixed road distance', () => {
  const state = traveler('marsh', ['ridge']);
  const chance = roadBanditRisk(state, riskyLeg, roadPolicyKit).chance;
  const boots = allGear.reed_boots;
  state.equipment.boots = boots.id;
  state.durability[boots.id] = 1;
  assert.ok(roadBanditRisk(state, riskyLeg, roadPolicyKit).chance < chance);
  state.durability[boots.id] = 0;
  assert.equal(roadBanditRisk(state, riskyLeg, roadPolicyKit).chance, chance);
  assert.equal(view(state).world.journeys.find(({ id }) => id === 'ridge').units, 3);
});

test('attacking bandits block escape and make their normal strike; known openings use a low seeded chance', () => {
  const state = interrupted({ fixed: false });
  assert.ok(act(state, 'banditFight').ok);
  state.combat.plan.reader = 'player';
  state.combat.plan.intent = { kind: 'attack', name: '逼身砍来' };
  state.escapeSeed = seedWith(0.01);
  const danger = view(state).retreatRisk;
  assert.equal(danger.blocked, true);
  const failed = act(state, 'retreat');
  assert.equal(failed.retreated, false);
  assert.ok(failed.damageTaken > 0);
  assert.equal(state.combat.round, 1);
  state.combat.plan.reader = 'player';
  state.combat.plan.intent = { kind: 'guard', name: '横刀护身' };
  const opportunity = view(state).retreatRisk;
  assert.deepEqual(opportunity, { blocked: false });
  const unlucky = structuredClone(state);
  unlucky.escapeSeed = 0;
  assert.equal(act(unlucky, 'retreat').retreated, false);
  const interruptedReturn = structuredClone(state);
  interruptedReturn.roadSeed = seedWith(0.035, 0.75, 0.4);
  const chased = act(interruptedReturn, 'retreat');
  assert.equal(chased.retreated, true);
  assert.equal(chased.roadInterrupted, true);
  assert.equal(interruptedReturn.roadTrip.destination, 'marsh');
  assert.ok(interruptedReturn.roadBandit);
  assert.doesNotMatch(chased.message, /沿着刚走过的路折回/);
  const success = act(state, 'retreat');
  assert.equal(success.retreated, true);
  assert.equal(state.roadTrip, null);
  assert.equal(state.roadBandit, null);
  assert.equal(state.region, 'marsh');
});

test('a road win pauses for manual pickups, medicine and a change of gear at that roadside coordinate', () => {
  const state = interrupted({ fixed: false });
  const coordinate = state.roadTrip.stop;
  state.realm = 8;
  state.hp = 75;
  state.inventory.salve = 1;
  state.inventory.iron_sword = 1;
  state.equipment.weapon = 'iron_sword';
  state.durability.iron_sword = 38;
  state.banditLootSeed = 3;
  assert.ok(act(state, 'banditFight').ok);
  const combat = structuredClone(state);
  assert.match(act(state, 'combatEquip', { id: 'cudgel' }).message, /交手中不能换装备/);
  assert.deepEqual(state, combat);
  let win;
  for (let i = 0; state.combat && i < 8; i++) win = act(state, 'attack');
  assert.ok(!state.combat);
  assert.ok(win.roadCoins > 0);
  assert.equal(state.roadTrip.stop, coordinate);
  assert.equal(view(state).roadTrip.afterBattle, true);
  assert.equal(state.roadBandit, null);
  assert.deepEqual(view(state).groundLoot, { knife: 1 });
  for (const [id, amount] of Object.entries(view(state).groundLoot)) {
    assert.ok(!state.inventory[id]);
    assert.equal(amount, 1);
    assert.ok(act(state, 'take', { id }).ok);
  }
  const day = state.day;
  const wounds = state.hp;
  assert.ok(act(state, 'use', { id: 'salve' }).ok);
  assert.ok(state.hp > wounds);
  assert.equal(state.inventory.salve, undefined);
  assert.ok(act(state, 'equip', { id: 'knife' }).ok);
  assert.equal(state.equipment.weapon, 'knife');
  assert.equal(state.day, day);
  assert.equal(state.roadTrip.stop, coordinate);
  assert.equal(view(state).roadTrip.afterBattle, true);
  assert.equal(act(state, 'banditFight').ok, false);
  state.roadSeed = 172102;
  assert.ok(act(state, 'roadContinue').ok);
  assert.equal(state.region, 'ridge');
  assert.equal(view(state).roadTrip, null);
});

test('clearing a draft, negotiating separately, or fighting leaves the unconfirmed toll in hand', () => {
  const state = interrupted();
  state.realm = 6;
  state.hp = view(state).maxHp;
  state.coins = 1;
  state.inventory.iron_sword = 1;
  state.equipment.weapon = 'iron_sword';
  state.durability.iron_sword = 38;
  state.durability.cudgel = 9;
  assert.equal(view(state).roadTrip.bandit.offers.find(({ id }) => id === 'cudgel').price, 4);
  assert.ok(act(state, 'banditPayCoins').ok);
  assert.ok(act(state, 'banditPayItem', { id: 'cudgel' }).ok);
  assert.equal(state.coins, 1);
  assert.equal(state.inventory.cudgel, 1);
  assert.equal(state.durability.cudgel, 9);
  assert.equal(view(state).roadTrip.bandit.remaining, 0);

  const cleared = structuredClone(state);
  assert.ok(act(cleared, 'banditClearOffer').ok);
  assert.equal(view(cleared).roadTrip.bandit.remaining, cleared.roadBandit.fee);
  assert.equal(cleared.coins, 1);
  assert.equal(cleared.inventory.cudgel, 1);

  const helped = structuredClone(state);
  helped.inventory.salve = 1;
  assert.ok(act(helped, 'banditPlot', { id: 'bind_road_arm' }).ok);
  assert.equal(helped.inventory.salve, undefined);
  assert.equal(helped.inventory.road_sleeve_manual, 1);
  assert.equal(helped.coins, 1);
  assert.equal(helped.inventory.cudgel, 1);
  assert.equal(helped.roadBandit, null);

  assert.ok(act(state, 'banditFight').ok);
  assert.equal(state.coins, 1);
  assert.equal(state.inventory.cudgel, 1);
  for (let i = 0; state.combat && i < 12; i++) assert.ok(act(state, 'attack').ok);
  assert.ok(state.roadBandit?.aftermath);
  assert.equal(state.coins, 1);
  assert.equal(view(state).groundLoot.cudgel, undefined);
  assert.ok(act(state, 'banditPlot', { id: 'spare_slate_robber' }).ok);
  assert.equal(state.inventory.cudgel, 1);
  assert.equal(state.durability.cudgel, 9);
  assert.equal(state.coins, 1);
});

function loseRoadFight(state, lossSeed) {
  assert.ok(act(state, 'banditFight').ok);
  const enemy = data.enemies.find(({ id }) => id === state.combat.id);
  const intent = enemy.intents.find(({ kind }) => kind === 'attack');
  state.combat.plan = { round: 0, reader: null, intent };
  state.banditLossSeed = lossSeed;
  state.hp = 1;
  const defeat = act(state, 'attack');
  assert.ok(defeat.ok, defeat.message);
  assert.equal(state.combat, null);
  return defeat;
}

test('a fatal bandit defeat ends the run and refuses all later actions', () => {
  const state = interrupted({ fixed: false });
  loseRoadFight(state, seedWith(0.01));
  assert.equal(view(state).mode, 'death');
  const death = structuredClone(state);
  for (const action of ['travel', 'rest', 'take', 'attack', 'banditPay']) {
    assert.equal(act(state, action, { id: 'ridge' }).ok, false);
    assert.deepEqual(state, death);
  }
});

test('a surviving bandit defeat loses carried gear and cash and the same attacker can be fought for them', () => {
  const state = interrupted({ fixed: false });
  const mugger = state.roadBandit.member;
  const startingRations = state.inventory.ration;
  assert.ok(mugger);
  state.coins = 41;
  state.inventory.ridge_rubbing = 1;
  state.inventory.salve = 1;
  state.inventory.reed_hand_manual = 1;
  state.inventory.knife = 1;
  state.durability.knife = 18;
  state.durability.cudgel = 9;
  loseRoadFight(state, 1500);
  assert.equal(state.region, 'village');
  assert.equal(view(state).mode, 'village');
  assert.equal(state.roadTrip, null);
  assert.equal(state.roadBandit, null);
  assert.equal(state.coins, 0);
  assert.ok(Object.values(state.equipment).every((item) => item === null));
  assert.equal(state.inventory.cudgel, undefined);
  assert.equal(state.inventory.straw_cape, undefined);
  assert.equal(state.inventory.knife, undefined);
  assert.equal(state.inventory.ration, startingRations);
  assert.equal(state.inventory.ridge_rubbing, 1);
  assert.equal(state.inventory.salve, 1);
  assert.equal(state.inventory.reed_hand_manual, 1);

  state.realm = 8;
  state.hp = view(state).maxHp;
  state.satiety = 96;
  assert.ok(act(state, 'travel', { id: 'marsh' }).ok);
  state.banditLootSeed = 3;
  const sameMemberSeed = seedWith(0.05, 0.55, 0.5);
  const other = structuredClone(state);
  other.roadSeed = sameMemberSeed + 1;
  assert.equal(act(other, 'travel', { id: 'ridge' }).roadInterrupted, true);
  assert.ok(other.roadBandit.member);
  assert.notEqual(other.roadBandit.member, mugger);
  assert.ok(act(other, 'banditFight').ok);
  for (let turn = 0; other.combat && turn < 12; turn++) assert.ok(act(other, 'attack').ok);
  assert.equal(other.combat, null);
  assert.equal(view(other).groundLoot.cudgel, undefined);
  assert.ok(other.coins < 41);

  state.roadSeed = sameMemberSeed;
  assert.equal(act(state, 'travel', { id: 'ridge' }).roadInterrupted, true);
  assert.equal(state.roadBandit.member, mugger);
  assert.ok(act(state, 'banditFight').ok);
  let victory;
  for (let turn = 0; state.combat && turn < 12; turn++) victory = act(state, 'attack');
  assert.ok(victory?.ok);
  assert.equal(state.combat, null);
  assert.equal(state.roadBandit, null);
  assert.ok(state.coins >= 41);
  assert.match(victory.message, /击杀|杀死|杀了/);
  for (const id of ['cudgel', 'straw_cape', 'knife']) {
    assert.equal(view(state).groundLoot[id], 1);
    assert.ok(act(state, 'take', { id }).ok);
  }
  assert.equal(state.durability.cudgel, 8);
  assert.equal(state.durability.knife, 18);
});
