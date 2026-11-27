import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { data } from './data.mjs';
import { createQuietGame } from './game-test-fixtures.mjs';
import { beginMeasuringManagement, measuringPatrolFactor, measuringSectContent, measuringSectData } from './measuring-sect.mjs';

const key = 'water_gauge';
const current = state => state.world.memberships[key];
const work = (state, id) => act(state, 'sectWork', { id });
const buy = (state, id, count = 1) => act(state, 'sectBuy', { id, count });

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function noChange(state, action, payload = {}) {
  const before = structuredClone(state);
  const result = act(state, action, payload);
  assert.equal(result.ok, false);
  assert.deepEqual(state, before);
  return result.message;
}

function atSect() {
  const state = createQuietGame(62);
  state.region = 'measuring_hall';
  state.world.lastSettlement = state.region;
  state.coins = 500;
  state.inventory = { reed: 16, wood: 19, ore: 20, hide: 3, core: 12 };
  return state;
}

test('sect manifests cover all three ranks and use actual items or elder proofs', () => {
  const { offices, jobs, store, exchange, patrol } = measuringSectData;
  assert.equal(jobs.length, 18);
  for (const office of ['outer', 'inner', 'elder']) {
    const available = jobs.filter(job => job.office === office);
    assert.equal(available.length, 6);
    assert.ok(available.some(job => job.type.includes('狩猎')));
    assert.ok(available.every(job => job.coins > 0 && job.credit > 0 && job.cooldown > 0));
    assert.ok(offices[office].name);
    assert.ok(store.some(row => row.office === office));
    assert.ok(exchange.some(row => row.office === office));
  }
  const stock = [...store, ...exchange];
  assert.ok(new Set(stock.map(row => row.id)).size >= 40);
  for (const id of [...stock.map(row => row.id), ...jobs.flatMap(job => Object.keys(job.need))]) {
    assert.ok(data.items.some(item => item.id === id), id);
  }
  assert.ok(jobs.filter(job => job.needsQuest).every(job => data.quests.some(quest => quest.id === job.needsQuest)));
  assert.ok(jobs.filter(job => job.needsDefeat).every(job => data.enemies.some(enemy => enemy.id === job.needsDefeat)));
  assert.ok(patrol.roads.every(key => data.roadBandits.roads.some(({ a, b }) => [a, b].sort().join('|') === key)));
  assert.ok(measuringSectContent.gear.every(({ id }) => data.gear.some(gear => gear.id === id)));
  assert.ok(measuringSectContent.innerStyles.every(({ id }) => data.innerStyles.some(manual => manual.id === id)));
});

test('job cash and contribution settle together, retain cooldowns, and do not grant rank', () => {
  const state = atSect();
  assert.match(noChange(state, 'sectWork', { id: 'gauge_posts' }), /还没加入/);
  play(state, 'sectJoin');
  assert.equal(current(state).office, 'outer');
  assert.equal(view(state).sect.jobs.length, 18);
  assert.match(noChange(state, 'sectWork', { id: 'gauge_silt' }), /内门弟子/);
  const coins = state.coins;
  play(state, 'sectWork', { id: 'gauge_posts' });
  assert.equal(state.coins, coins + 18);
  assert.equal(state.inventory.wood, 9);
  assert.equal(state.inventory.ore, 18);
  assert.equal(view(state).sect.credit, 4);
  assert.equal(view(state).sect.earned, 4);
  assert.equal(view(state).affiliation.disciple.name, '外门弟子');
  assert.match(noChange(state, 'sectWork', { id: 'gauge_posts' }), /6 日后再来/);
  current(state).office = 'inner';
  assert.equal(work(state, 'gauge_posts').ok, false);
  assert.match(work(state, 'gauge_frog_inspection').message, /查验青埂旧闸/);
  state.day = current(state).jobs.gauge_posts;
  assert.ok(work(state, 'gauge_posts').ok);
  assert.equal(view(state).sect.credit, 8);
  assert.equal(view(state).affiliation.disciple.name, '内门弟子');
});

test('the store spends money and only returns a matching, capacity-checked quantity', () => {
  const state = atSect();
  play(state, 'sectJoin');
  state.coins = 8;
  const currencySlotCount = view(state).backpackCapacity - 1;
  state.inventory = { wood: currencySlotCount * rules.backpackStackSize };
  const shop = view(state).sect.store.find(offer => offer.id === 'ration');
  assert.ok(shop);
  // Full pack and last eight coins: using the whole purse frees a slot for both rations.
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  assert.ok(shop.counts.includes(2));
  assert.match(noChange(state, 'sectBuy', { id: 'measuring_tide_staff', count: 1 }), /长老/);
  assert.ok(buy(state, 'ration', 2).ok);
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.ration, 2);
  assert.equal(view(state).sect.store.find(row => row.id === 'ration').stock, 10);
  state.day += 4;
  assert.equal(view(state).sect.store.find(row => row.id === 'ration').stock, 12);
});

test('the contribution counter keeps its own balance and requires purchase to learn a formula', () => {
  const state = atSect();
  play(state, 'sectJoin');
  current(state).office = 'inner';
  current(state).credit = 80;
  current(state).earned = 80;
  assert.ok(!state.knownItems.includes('formula_gold_salve'));
  play(state, 'sectExchange', { id: 'formula_gold_salve' });
  assert.equal(state.inventory.formula_gold_salve, 1);
  assert.ok(state.knownItems.includes('formula_gold_salve'));
  assert.equal(view(state).sect.credit, 51);
  assert.equal(view(state).sect.earned, 80);
  assert.match(noChange(state, 'sectExchange', { id: 'formula_gold_salve' }), /领完/);
  play(state, 'sectLeave');
  assert.equal(view(state).affiliation, null);
  play(state, 'sectJoin');
  assert.equal(view(state).affiliation.disciple.name, '内门弟子');
  assert.equal(view(state).sect.credit, 51);
  assert.match(noChange(state, 'sectExchange', { id: 'formula_gold_salve' }), /领完/);
  assert.match(noChange(state, 'sectFundHall', { count: 10 }), /代宗主/);
});

test('a sold contribution coat cannot be farmed, including an older outstanding restock', () => {
  const state = atSect();
  play(state, 'sectJoin');
  const member = current(state);
  member.office = 'elder';
  member.credit = 90;
  play(state, 'sectExchange', { id: 'fault_coat' });
  assert.equal(member.credit, 45);
  assert.equal(state.inventory.fault_coat, 1);

  // This date was saved by the previous restock rule.
  member.stock.exchange.fault_coat.nextAt = state.day + 18;
  play(state, 'localSell', { id: 'fault_coat', count: 1 });
  assert.equal(state.inventory.fault_coat ?? 0, 0);
  state.day += 30;
  const offer = view(state).sect.exchange.find(row => row.id === 'fault_coat');
  assert.equal(offer.stock, 0);
  assert.equal(offer.nextAt, null);
  assert.match(noChange(state, 'sectExchange', { id: 'fault_coat' }), /领完/);
  assert.ok(data.regions.some(region => data.regionDetails[region.id]?.settlement?.goods?.fault_coat));
  assert.ok(data.recipes.some(recipe => recipe.result === 'fault_coat'));
});

test('a newly appointed acting head can buy unclaimed sect books without earning more contribution', () => {
  const state = atSect();
  play(state, 'sectJoin');
  const member = current(state);
  member.office = 'elder';
  member.credit = 36;
  state.coins = 1500;
  assert.match(noChange(state, 'sectBuy', { id: 'measuring_calm_peak_manual' }), /代宗主/);
  play(state, 'sectExchange', { id: 'measuring_water_breath_manual' });
  assert.equal(member.credit, 0);

  member.office = 'actingHead';
  beginMeasuringManagement(state);
  assert.equal(view(state).sect.jobs.length, 0);
  assert.equal(view(state).sect.exchange.length, 0);
  const balance = view(state).sect.management.fund;
  assert.match(noChange(state, 'sectBuy', { id: 'measuring_water_breath_manual' }), /领完/);
  play(state, 'sectBuy', { id: 'measuring_calm_peak_manual' });
  assert.equal(state.inventory.measuring_calm_peak_manual, 1);
  assert.equal(state.coins, 250);
  assert.equal(member.credit, 0);
  assert.equal(view(state).sect.management.fund, balance);
  assert.match(noChange(state, 'sectExchange', { id: 'measuring_calm_peak_manual' }), /领完/);
});

test('an acting head dispatches time-bound assignments and keeps treasury funds separate', () => {
  const state = atSect();
  play(state, 'sectJoin');
  const member = current(state);
  member.office = 'actingHead';
  member.credit = 9;
  beginMeasuringManagement(state);
  const { management, jobs, exchange } = view(state).sect;
  assert.equal(management.fund, 96);
  assert.equal(jobs.length, 0);
  assert.ok(exchange.length > 0);
  assert.match(noChange(state, 'sectWork', { id: 'gauge_posts' }), /议事堂/);
  assert.match(noChange(state, 'sectLeave'), /不能辞行/);
  const coins = state.coins;
  play(state, 'sectManageOrder', { id: 'settleGrain' });
  assert.equal(view(state).sect.management.fund, 80);
  assert.match(noChange(state, 'sectManageOrder', { id: 'fetchHerbs' }), /上一趟/);
  assert.match(noChange(state, 'sectSettleOrder'), /4 日后/);
  state.day += 4;
  play(state, 'sectSettleOrder');
  assert.equal(view(state).sect.management.fund, 112);
  assert.equal(state.coins, coins);
  assert.equal(member.credit, 9);
  assert.match(noChange(state, 'sectSettleOrder'), /没有/);
  assert.match(noChange(state, 'sectFundHall', { count: 61 }), /添不了/);
  play(state, 'sectFundHall', { count: 60 });
  assert.equal(view(state).sect.management.fund, 172);
  assert.equal(state.coins, coins - 60);
  state.day += 35;
  assert.equal(view(state).sect.management.fund, 240);
});

test('the acting head can improve local restocking and actually place timed road patrols', () => {
  const state = atSect();
  play(state, 'sectJoin');
  current(state).office = 'actingHead';
  beginMeasuringManagement(state);
  assert.equal(view(state).sect.store.find(row => row.id === 'salve').interval, 3);
  play(state, 'sectUpgradeHall', { id: 'garden' });
  assert.equal(view(state).sect.store.find(row => row.id === 'salve').interval, 2.25);
  assert.equal(view(state).sect.store.find(row => row.id === 'ration').interval, 2);
  play(state, 'sectManageOrder', { id: 'dykePatrol' });
  const starts = view(state).sect.management.active.doneAt;
  const protectedRoad = { key: 'green_dyke|old_marker' };
  assert.equal(measuringPatrolFactor(state, protectedRoad), 1);
  state.day = starts + 2;
  assert.equal(measuringPatrolFactor(state, protectedRoad), 0.60);
  play(state, 'sectSettleOrder');
  const { patrolUntil } = view(state).sect.management;
  assert.equal(patrolUntil, starts + 5);
  assert.equal(measuringPatrolFactor(state, protectedRoad), 0.60);
  assert.equal(measuringPatrolFactor(state, { key: 'frog_pond|scale_bog' }), 1);
  assert.ok(view(state).sect.management.lastReport.includes('两段堤路'));
  state.day = patrolUntil;
  assert.equal(measuringPatrolFactor(state, protectedRoad), 1);
  play(state, 'sectManageOrder', { id: 'dykePatrol' });
  const nextStarts = view(state).sect.management.active.doneAt;
  state.day = nextStarts + 36;
  assert.equal(measuringPatrolFactor(state, protectedRoad), 1);
  assert.match(play(state, 'sectSettleOrder').message, /巡堤已在第.*日结束/);
  assert.equal(view(state).sect.management.patrolUntil, 0);
  assert.equal(measuringPatrolFactor(state, protectedRoad), 1);
});

test('an elder must bring actual expedition proofs before turning in reusable goods', () => {
  const state = atSect();
  play(state, 'sectJoin');
  current(state).office = 'elder';
  Object.assign(state.inventory, { ore: 12, core: 12, gold_core: 10, battle_sinew: 8, black_iron: 9 });
  assert.match(noChange(state, 'sectWork', { id: 'gauge_three_gauges' }), /校准三州的水尺/);
  assert.match(noChange(state, 'sectWork', { id: 'gauge_warden_report' }), /打退/);

  state.completedQuests.push('zhao_joint_measure');
  state.defeated.push('fault_warden');
  play(state, 'sectWork', { id: 'gauge_three_gauges' });
  play(state, 'sectWork', { id: 'gauge_warden_report' });
  assert.equal(state.inventory.gold_core, 3);
  assert.equal(state.inventory.black_iron, 1);
  assert.equal(current(state).credit, 73);
  assert.equal(current(state).office, 'elder');
  assert.match(noChange(state, 'sectWork', { id: 'gauge_warden_report' }), /24 日后再来/);
});

test('running supplies replaces the missing shop stock and can never put provisions in the player pack', () => {
  const state = atSect();
  play(state, 'sectJoin');
  current(state).office = 'actingHead';
  beginMeasuringManagement(state);
  assert.ok(buy(state, 'salve', 5).ok);
  assert.equal(view(state).sect.store.find(row => row.id === 'salve').stock, 0);
  play(state, 'sectManageOrder', { id: 'fetchHerbs' });
  state.day = view(state).sect.management.active.doneAt;
  play(state, 'sectSettleOrder');
  assert.equal(view(state).sect.store.find(row => row.id === 'salve').stock, 3);
  assert.equal(view(state).sect.store.find(row => row.id === 'qi_powder').stock, 5);
  assert.equal(state.inventory.salve, 5);
  assert.match(view(state).sect.management.lastReport, /松脂膏×3/);
  assert.doesNotMatch(view(state).sect.management.lastReport, /回气散/);
});
