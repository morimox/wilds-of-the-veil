import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, view } from './engine.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, result.message);
  return result;
}

test('the smith can inspect leather in the village warehouse without taking it', () => {
  const state = createGame(810);
  state.inventory.hide = 2;
  state.knownItems.push('hide');
  play(state, 'econDeposit', { id: 'hide', count: 2 });
  assert.ok(!view(state).discoveredRecipes.includes('r_hide_coat'));

  play(state, 'showHideToSmith');
  assert.ok(view(state).discoveredRecipes.includes('r_hide_coat'));
  assert.equal(state.inventory.hide, undefined);
  assert.equal(state.economy.warehouse.hide, 2);
});

test('vendor dialogue agrees with an empty stall and the actual hand-in reward', () => {
  const state = createGame(811);
  const stockedGreeting = play(state, 'merchantTalk', { id: 'staff_vendor' }).message;
  play(state, 'unequip', { slot: 'weapon' });
  play(state, 'sell', { id: 'cudgel' });
  play(state, 'buy', { id: 'cudgel' });

  const staff = view(state).market.stalls.find((entry) => entry.id === 'staff_vendor');
  const emptyGreeting = play(state, 'merchantTalk', { id: 'staff_vendor' }).message;
  assert.equal(staff.offers[0].stock, 0);
  assert.equal(emptyGreeting, staff.merchant.greeting);
  assert.ok(!emptyGreeting.includes(stockedGreeting));

  state.coins = 60;
  state.economy.warehouse = { wood: 8, ore: 4 };
  play(state, 'buy', { id: 'reed_arrow', count: 12 });
  const before = state.inventory.reed_arrow;
  const order = play(state, 'merchantOrder', { id: 'fletcher' });
  assert.match(order.message, /图样交给了你/);
  assert.equal(state.inventory.arrow_pattern, 1);
  assert.equal(state.inventory.reed_arrow, before);
});

test('the alchemist only gives directions for the current proof and follows the brew to breakthrough', () => {
  const state = createGame(812);
  state.realm = 2;
  state.coins = 160;
  state.insight = 70;
  state.practice[2] = 14;
  state.knownItems.push('foundation_ledger', 'kiln_manual');
  state.alchemy.inquiryIndex = 3;
  state.economy.buildings.furnace = 2;
  state.economy.warehouse = { reed: 8, core: 8, black_iron: 4 };

  assert.match(view(state).alchemy.progressText, /碎云雪关/);
  state.inventory.foundation_warden_proof = 1;
  state.defeated.push('foundation_warden');
  assert.equal(view(state).alchemy.progressText, '');
  assert.equal(view(state).alchemy.inquiry.id, 'finish_foundation_formula');
  play(state, 'alchemyAdvance', { id: 'finish_foundation_formula' });
  assert.match(view(state).alchemy.progressText, /药引/);

  play(state, 'econStart', { id: 'r_foundation' });
  assert.match(view(state).alchemy.progressText, /还在火上/);
  const [batch] = state.economy.jobs;
  while (state.day < batch.readyDay) play(state, 'wait');
  assert.match(view(state).alchemy.progressText, /可以去收丹/);
  play(state, 'econCollect', { id: batch.id });
  assert.match(view(state).alchemy.progressText, /闭关突破时再服/);

  play(state, 'breakthrough');
  assert.equal(view(state).alchemy.progressText, '');
});
