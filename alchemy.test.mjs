import assert from 'node:assert/strict';
import test from 'node:test';
import { alchemyData } from './alchemy.mjs';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';

const play = (state, action, payload) => {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
};

function deny(state, action, payload) {
  const previous = structuredClone(state);
  assert.equal(act(state, action, payload).ok, false);
  assert.deepEqual(state, previous);
}

function closeScene(state) {
  if (view(state).mode === 'event') play(state, 'leave');
}

function enter(state, site, index) {
  play(state, 'visit', { id: site });
  play(state, 'choose', { index });
}

test('bringing a real herb to the apprentice introduces the alchemist and a bought formula can be used', () => {
  const state = createGame(0);
  assert.equal(view(state).alchemy, null);
  deny(state, 'alchemyBuyFormula', { id: 'formula_qi' });
  play(state, 'travel', { id: 'marsh' });
  enter(state, 'reed_banks', 0);
  closeScene(state);
  play(state, 'travel', { id: 'village' });
  play(state, 'handin', { id: 'reed_salve' });
  assert.ok(view(state).alchemy.offers.some((offer) => offer.id === 'formula_qi'));
  assert.equal(state.inventory.formula_detox, 1);
  const furnace = () => view(state).economy.facilities.find(({ id }) => id === 'furnace');
  assert.equal(furnace(), undefined);
  play(state, 'alchemyTalk');
  play(state, 'alchemyTalk');
  assert.equal(state.inventory.furnace_sketch, 1);
  assert.ok(furnace());

  // This setup isolates consent and production from another round of material collection.
  state.coins = 100;
  for (const [id, count] of Object.entries(furnace().upgrade.need)) {
    state.inventory[id] = count + 2;
    if (!state.knownItems.includes(id)) state.knownItems.push(id);
  }
  play(state, 'econBuild', { id: 'furnace' });
  deny(state, 'econStart', { id: 'r_qi' });
  deny(state, 'craft', { id: 'r_qi' });
  deny(state, 'alchemyBuyFormula', { id: 'formula_detox' });
  deny(state, 'alchemyBuyFormula', { id: 'formula_foundation' });
  const coins = state.coins;
  play(state, 'alchemyBuyFormula', { id: 'formula_qi' });
  assert.equal(coins - state.coins, 10);
  assert.equal(state.inventory.formula_qi, 1);
  deny(state, 'alchemyBuyFormula', { id: 'formula_qi' });
  play(state, 'econStart', { id: 'r_qi' });
  const timer = () => furnace().jobs[0];
  deny(state, 'econCollect', { id: timer().id });
  while (!timer().ready) play(state, 'wait');
  play(state, 'econCollect', { id: timer().id });
  assert.equal(state.inventory.qi_powder, data.recipes.find(({ id }) => id === 'r_qi').count);
});

test('foundation payments reveal only the next earned site and the final charge can brew once', () => {
  const state = createGame(0);
  state.realm = 2;
  state.insight = 120;
  state.practice[2] = 25;
  state.coins = 500;
  state.knownItems.push('stone_rubbing', 'foundation_ledger', 'ore', 'wood', 'reed', 'core', 'kiln_clay', 'black_iron');
  state.inventory.foundation_ledger = 1;
  state.economy.warehouse = { ore: 50, wood: 50, reed: 30, core: 20, kiln_clay: 40, black_iron: 20 };
  deny(state, 'buy', { id: 'foundation_pill' });
  deny(state, 'breakthrough');
  deny(state, 'alchemyAdvance', { id: alchemyData.inquiry[1].id });
  const startedCoins = state.coins;
  const startedDay = state.day;
  let fees = 0;
  let days = 0;
  for (const [index, step] of alchemyData.inquiry.entries()) {
    if (index > 0) {
      assert.equal(view(state).alchemy.inquiry, null);
      assert.ok(view(state).alchemy.progressText);
      deny(state, 'alchemyAdvance', { id: step.id });
      state.inventory[step.proof] = 1;
      deny(state, 'alchemyAdvance', { id: step.id });
      // Dedicated fights and world routes are played from a fresh state in the route audit.
      state.defeated.push(step.defeated);
    }
    const available = view(state).alchemy.inquiry;
    assert.equal(available.id, step.id);
    assert.equal(available.reason, '');
    play(state, 'alchemyAdvance', { id: step.id });
    fees += step.price;
    days += step.days;
    assert.equal(state.coins, startedCoins - fees);
    assert.equal(state.day, startedDay + days);
    deny(state, 'alchemyAdvance', { id: step.id });
  }
  assert.equal(fees, 237);
  assert.equal(state.inventory.formula_foundation, 1);
  assert.equal(state.inventory.foundation_charge, 1);
  assert.ok(!state.inventory.foundation_pill);
  deny(state, 'breakthrough');
  play(state, 'alchemyTalk');
  play(state, 'econBuild', { id: 'furnace' });
  deny(state, 'econStart', { id: 'r_foundation' });
  play(state, 'econBuild', { id: 'furnace' });
  play(state, 'econStart', { id: 'r_foundation' });
  const furnace = () => view(state).economy.facilities.find(({ id }) => id === 'furnace');
  assert.ok(!state.inventory.foundation_charge);
  deny(state, 'econStart', { id: 'r_foundation' });
  deny(state, 'breakthrough');
  while (!furnace().jobs[0].ready) play(state, 'wait');
  play(state, 'econCollect', { id: furnace().jobs[0].id });
  assert.equal(state.inventory.foundation_pill, 1);
  assert.equal(view(state).evidence.some(({ id }) => id === 'foundation_pill'), false);
  deny(state, 'use', { id: 'foundation_pill' });
  deny(state, 'discard', { id: 'foundation_pill' });
  play(state, 'breakthrough');
  assert.equal(view(state).realm.name, '筑基初期');
  assert.equal(state.inventory.foundation_pill, undefined);
  assert.equal(view(state).nextRealm, null);
  deny(state, 'econStart', { id: 'r_foundation' });
});
