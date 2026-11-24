import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createGame, rules, view } from './engine.mjs';
import { transportRules } from './world.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function refuses(state, action, payload, reason) {
  const before = structuredClone(state);
  const result = act(state, action, payload);
  assert.equal(result.ok, false);
  assert.equal(result.message, reason);
  assert.deepEqual(state, before);
}

function reachZhaoCity() {
  const state = createGame(42);
  play(state, 'travel', { id: 'marsh' });
  state.knownItems.push('ferry_manifest');
  play(state, 'wait');
  play(state, 'travel', { id: 'ford' });
  play(state, 'travel', { id: 'zhao_city' });
  return state;
}

const roadTo = (state, target) => view(state).world.roads.find(({ id }) => id === target);
const offerFor = (state, item) => view(state).localMarket.offers.find(({ id }) => id === item);

test('an empty-bellied traveler can reach a local bed and recover before taking a cross-province road', () => {
  const state = reachZhaoCity();
  play(state, 'rest');
  while (state.inventory.ration && state.satiety < 55) play(state, 'eat', { id: 'ration' });
  play(state, 'travel', { id: 'flood_market' });
  play(state, 'travel', { id: 'zhao_pass' });
  state.knownItems.push('sand_writ');
  play(state, 'wait');

  state.satiety = 0;
  state.coins = 0;
  delete state.inventory.ration;
  const emergency = roadTo(state, 'zhao_city');
  assert.ok(emergency.available && emergency.rescue);
  const crossing = roadTo(state, 'mingsha_city');
  assert.equal(crossing.available, false);
  assert.equal(crossing.rescue, false);
  assert.match(crossing.reason, /跨州路/);
  refuses(state, 'travel', { id: 'mingsha_city' }, crossing.reason);

  const day = state.day;
  play(state, 'travel', { id: 'zhao_city' });
  assert.equal(state.day - day, emergency.days);
  for (let i = 0; i < 2; i++) {
    play(state, 'rest');
    while (state.inventory.ration && state.satiety < 65) play(state, 'eat', { id: 'ration' });
  }
  assert.ok(state.inventory.ration > 0);
  play(state, 'travel', { id: 'flood_market' });
  play(state, 'travel', { id: 'zhao_pass' });
  const fare = roadTo(state, 'mingsha_city');
  assert.equal(fare.days, transportRules.crossings.find(({ b }) => b === 'mingsha_city').days);
  assert.equal(fare.available, true);
  const departure = state.day;
  play(state, 'travel', { id: 'mingsha_city' });
  assert.equal(state.region, 'mingsha_city');
  assert.equal(state.day - departure, fare.days);
});

test('the town market gives the same refusal in its quote and in the transaction', () => {
  const state = reachZhaoCity();
  const id = 'weir_knife';
  state.coins = 0;
  let quote = offerFor(state, id);
  assert.match(quote.reason, /灵钱/);
  refuses(state, 'localBuy', { id }, quote.reason);

  state.coins = quote.price * 3;
  state.economy.warehouse[id] = 1;
  quote = offerFor(state, id);
  assert.match(quote.reason, /同名装备/);
  refuses(state, 'localBuy', { id }, quote.reason);

  delete state.economy.warehouse[id];
  const ration = state.inventory.ration;
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  quote = offerFor(state, id);
  assert.match(quote.reason, /行囊/);
  refuses(state, 'localBuy', { id }, quote.reason);

  state.inventory.ration = ration;
  quote = offerFor(state, id);
  assert.equal(quote.reason, '');
  assert.equal(quote.maximum, 1);
  play(state, 'localBuy', { id });
  assert.equal(state.inventory[id], 1);
  assert.equal(state.coins, quote.price * 2);
  quote = offerFor(state, id);
  assert.equal(quote.count, 0);
  assert.match(quote.reason, /卖完/);
  refuses(state, 'localBuy', { id }, quote.reason);
});

test('a full serving of relief food is available for use even though the local vendor will not buy it', () => {
  const state = reachZhaoCity();
  delete state.inventory.ration;
  play(state, 'rest');
  const sale = view(state).localMarket.buys.find(({ id }) => id === 'ration');
  assert.equal(sale.count, 0);
  assert.match(sale.reason, /救济/);
  refuses(state, 'localSell', { id: 'ration' }, sale.reason);
  play(state, 'eat', { id: 'ration' });
  assert.ok(state.satiety > 0);
});

test('regional bulk quotes and explicit meal sellers respect their local market rules', () => {
  const state = reachZhaoCity();
  Object.assign(state.inventory, { core: 26, beast_meat: 5 });
  const listing = (id) => view(state).localMarket.buys.find((item) => item.id === id);
  assert.deepEqual(listing('core').demand, { regular: 10, reserve: 6, remaining: 10, nextAt: null });
  const start = state.coins;
  play(state, 'localSell', { id: 'core', count: 12 });
  assert.equal(state.coins - start, 112);
  assert.equal(listing('core').price, 6);
  assert.equal(listing('beast_meat'), undefined);
  refuses(state, 'localSell', { id: 'beast_meat' }, '这件东西不能卖。');

  state.region = 'willow_post';
  assert.equal(listing('core').demand.remaining, 10);
  assert.equal(listing('beast_meat').price, 2);
  const before = state.coins;
  play(state, 'localSell', { id: 'beast_meat', count: 3 });
  assert.equal(state.coins - before, 6);
  assert.equal(state.inventory.beast_meat, 2);
  state.region = 'cinder_inn';
  assert.equal(listing('beast_meat').price, 2);
  state.region = 'zhao_city';
  assert.equal(listing('core').demand.remaining, 0);
});
