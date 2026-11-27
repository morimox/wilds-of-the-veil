import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';
import { marketPricePolicy } from './economy-price-ladder.mjs';

const { equipmentPrices, localLines, supplyPrices } = marketPricePolicy;
const items = new Map(data.items.map(item => [item.id, item]));
const gear = new Map(data.gear.map(item => [item.id, item]));
const homeOffers = data.market.stalls.flatMap(stall => stall.offers.map(({ id }) => [id, items.get(id).price]));
const townOffers = Object.values(data.regionDetails).flatMap(({ settlement }) =>
  Object.entries(settlement?.goods ?? {}).map(([id, offer]) => [id, offer.price, offer]));
const sectOffers = data.measuringSect.store.map(offer => [offer.id, offer.price, offer]);
const allCashGear = [...homeOffers, ...townOffers, ...sectOffers].filter(([id]) => gear.has(id));

test('home quotes and regional markups preserve tenfold realm averages without widening the starter floor', () => {
  const lowest = new Map();
  for (const [id, quote, offer] of allCashGear) {
    const markup = offer?.markup ?? 0;
    assert.equal(quote, Math.round(equipmentPrices[id] * (1 + markup)), id);
    if (markup) assert.ok(offer.imported && markup >= 0.20 && markup <= 0.45, id);
    lowest.set(id, Math.min(lowest.get(id) ?? quote, quote));
    assert.ok(items.get(id).sell < quote, id);
  }
  assert.deepEqual(new Set(lowest.keys()), new Set(Object.keys(equipmentPrices)));
  const groups = [[], [], []];
  for (const [id, quote] of lowest) groups[Math.floor(gear.get(id).tier / 3)].push(quote);
  const averages = groups.map(group => group.reduce((total, quote) => total + quote, 0) / group.length);
  assert.ok(groups.every(group => group.length >= 4));
  for (const [index, average] of averages.slice(1).entries()) {
    assert.ok(average / averages[index] >= 9 && average / averages[index] <= 12);
  }
  assert.equal(lowest.get('cudgel'), 5);
  assert.equal(lowest.get('straw_cape'), 6);
  assert.equal(lowest.get('iron_sword'), 33);
  assert.ok(lowest.get('gold_tide_staff') > 2 * lowest.get('gold_iron_blade'));
});

test('named workshops keep their craft equipment and shops do not sell unique trophies', () => {
  const listed = new Set(allCashGear.map(([id]) => id));
  for (const id of ['gold_brow_guard', 'gold_scale_coat', 'gold_spirit_pendant', 'gold_confluence_staff']) {
    assert.equal(listed.has(id), false);
    assert.ok(data.recipes.some(recipe => recipe.result === id), id);
  }
  for (const id of ['measuring_cedar_ruler', 'gully_king_blade', 'bandit_salt_boots']) {
    assert.equal(listed.has(id), false);
    assert.equal(data.recipes.some(recipe => recipe.result === id), false);
  }
});

test('regional stores have named lines across neighboring stages, with slower stock for imported goods', () => {
  for (const [region, shelf] of Object.entries(localLines)) {
    for (const [id, line] of Object.entries(shelf)) {
      const quote = equipmentPrices[id] ?? supplyPrices[id];
      const actual = data.regionDetails[region].settlement.goods[id];
      assert.deepEqual(actual, { ...line, price: quote == null ? actual.price : Math.round(quote * (1 + (line.markup ?? 0))) });
      assert.ok(actual.merchant && actual.department && actual.source && actual.price > 0, id);
    }
  }
  const tiers = (region, department, definitions) => [...new Set(
    Object.entries(data.regionDetails[region].settlement.goods).filter(([, offer]) => offer.department === department)
      .map(([id]) => definitions.find(row => row.id === id).tier),
  )].sort((a, b) => a - b);
  assert.deepEqual(tiers('zhao_city', '兵器铺', data.gear), [0, 1, 2, 3]);
  assert.deepEqual(tiers('mingsha_city', '兵器铺', data.gear), [4, 5, 6, 7]);
  assert.deepEqual(tiers('zhao_city', '丹药铺', data.pills), [0, 1, 2, 3]);
  assert.deepEqual(tiers('mingsha_city', '丹药铺', data.pills), [0, 1, 2, 3, 4]);
  const local = data.regionDetails.cinder_inn.settlement.goods.foil_sword;
  const importRow = data.regionDetails.mingsha_city.settlement.goods.foil_sword;
  assert.ok(importRow.price > local.price && importRow.interval > local.interval && importRow.imported);
  const sectTiers = new Set(data.measuringSect.store.map(offer => gear.get(offer.id)?.tier));
  for (let tier = 0; tier <= 7; tier++) assert.ok(sectTiers.has(tier));
  assert.ok(homeOffers.every(([id]) => !gear.has(id) || gear.get(id).tier < 3));
});

test('the same imported equipment physically costs more and replenishes later than its local line', () => {
  const state = createGame(529);
  const id = 'foil_sword';
  state.coins = 2_000;
  state.region = 'mingsha_city';
  const foreign = view(state).localMarket.offers.find(offer => offer.id === id);
  assert.equal(foreign.price, 1_225);
  assert.equal(act(state, 'localBuy', { id }).ok, true);
  assert.equal(state.coins, 2_000 - foreign.price);
  state.region = 'cinder_inn';
  const local = view(state).localMarket.offers.find(offer => offer.id === id);
  assert.equal(local.price, 980);
  assert.equal(local.count, 1);
});

test('a costly consignment quotes and charges the same number and cannot fund its own replacement', () => {
  const state = createGame(507);
  const id = 'gold_tide_staff';
  state.region = 'mingsha_city';
  const offer = () => view(state).localMarket.offers.find(row => row.id === id);
  const amount = equipmentPrices[id];
  state.coins = amount - 1;
  assert.equal(offer().maximum, 0);
  assert.equal(act(state, 'localBuy', { id }).message, offer().reason);
  state.coins = amount;
  assert.equal(offer().maximum, 1);
  assert.equal(act(state, 'localBuy', { id }).ok, true);
  assert.equal(state.coins, 0);
  assert.equal(state.inventory[id], 1);
  assert.equal(offer().count, 0);
  assert.equal(act(state, 'equip', { id }).ok, false);
  assert.equal(act(state, 'localSell', { id }).ok, true);
  assert.equal(state.coins, items.get(id).sell);
  assert.ok(state.coins < amount);
  state.day += localLines.mingsha_city[id].interval;
  assert.equal(offer().count, 1);
});
