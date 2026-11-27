import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { localGoods } from './world.mjs';

const items = new Map(data.items.map(item => [item.id, item]));
const crafted = new Map(data.craftEconomy.map(row => [row.product, row]));
const shopOffers = [
  ...data.market.stalls.flatMap(stall => stall.offers.map(({ id }) => [id, items.get(id).price])),
  ...Object.values(data.regionDetails).flatMap(({ settlement }) =>
    settlement ? Object.entries(localGoods(settlement)).map(([id, offer]) => [id, offer.price]) : []),
  ...data.measuringSect.store.map(({ id, price }) => [id, price]),
];
const cheapest = new Map();
for (const [id, price] of shopOffers) {
  if (price > 0) cheapest.set(id, Math.min(cheapest.get(id) ?? Infinity, price));
}

test('high-tier production combines plentiful basic inputs with materials from its own stage', () => {
  assert.equal(crafted.get('sky_sword').need.foundation_core, 4);
  assert.equal(crafted.get('gold_spirit_pendant').need.ember_ore_pith, 1);
  assert.equal(crafted.get('gold_spirit_pendant').need.gold_core, 5);
  assert.ok(crafted.get('gold_spirit_pendant').need.core >= 10);
  assert.equal(crafted.get('return_breath_pill').need.qi_powder, 4);
  assert.equal(crafted.get('return_breath_pill').need.gold_core, 1);
  assert.equal(crafted.get('herb_stew').need.ration, 3);
  assert.equal(crafted.get('herb_stew').need.foundation_meat, 2);
  assert.equal(crafted.get('crystal_feast').need.ration, 4);
  assert.equal(crafted.get('crystal_feast').need.gold_meat, 1);
  assert.equal(crafted.get('clear_needle').need.iron_arrow, 3);
  assert.equal(crafted.get('clear_needle').batch, 12);
  assert.ok(!crafted.has('gold_powder') && !crafted.has('foundation_pill'));
});

test('processing adds modest value on most lines without financing shop-only recycling', () => {
  let valueAdded = 0;
  for (const row of data.craftEconomy) {
    if (row.outputValue > row.materialsValue) valueAdded++;
    assert.ok(row.outputValue <= row.materialsValue * 1.12 + row.batch / 2 + 1, row.id);
    const shopInput = Object.entries(row.need).reduce((sum, [id, count]) => sum + count * (cheapest.get(id) ?? Infinity), row.cost);
    assert.ok(row.outputValue < shopInput, row.id);
    if (cheapest.has(row.product)) assert.ok(row.unitSell <= cheapest.get(row.product) / 2, row.id);
  }
  assert.ok(valueAdded >= data.craftEconomy.length * 0.85);
  assert.ok(cheapest.get('crystal_feast') < cheapest.get('gold_iron_blade') / 20);
});
