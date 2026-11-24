import assert from 'node:assert/strict';
import test from 'node:test';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';
import { act, rules, view } from './engine.mjs';

const book = 'encyclopedia';
const bag = 'qiankun_bag';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

test('a book its owner set down stays on the ground if they fill the freed slot', () => {
  const state = createGame(34);
  state.inventory[book] = 1;
  const warning = act(state, 'discard', { id: book, count: 1 });
  assert.equal(warning.confirmation.id, book);
  assert.equal(state.inventory[book], 1);
  play(state, 'discard', { id: book, count: 1, confirmed: true, expectedPlace: warning.confirmation.place });
  const pack = view(state);
  const extraSlots = pack.backpackCapacity - pack.backpackUsed;
  state.inventory.ration += rules.backpackStackSize * extraSlots;
  assert.equal(view(state).backpackUsed, pack.backpackCapacity);
  assert.equal(act(state, 'take', { id: book }).ok, false);
  assert.equal(state.ground.village[book], 1);
  assert.equal(state.inventory[book], undefined);
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  const before = view(state).backpackUsed;
  play(state, 'take', { id: book });
  assert.equal(view(state).backpackUsed, before + 1);
  assert.equal(state.inventory[book], 1);
});

test('the reference book can move through the warehouse, a space bag, and the ground', () => {
  const state = createGame(341);
  state.ground.village = { [book]: 1, [bag]: 1 };
  play(state, 'take', { id: book });
  play(state, 'take', { id: bag });
  assert.ok(view(state).guideBook);
  play(state, 'editGuideNote', { id: 'ration', text: '走远路前可以带着。' });
  play(state, 'econDeposit', { id: book, count: 1 });
  assert.equal(view(state).guideBook, null);
  assert.equal(view(state).itemNotes.ration, '走远路前可以带着。');
  assert.equal(act(state, 'editGuideNote', { id: 'ration', text: '试改' }).ok, false);
  state.ground.village[book] = 1; // Even a duplicate ground entry cannot produce a second copy.
  assert.equal(act(state, 'take', { id: book }).ok, false);
  delete state.ground.village[book];
  play(state, 'econWithdraw', { id: book, count: 1 });
  play(state, 'econBagDeposit', { bagId: bag, id: book, count: 1 });
  assert.equal(view(state).guideBook, null);
  play(state, 'econBagWithdraw', { bagId: bag, id: book, count: 1 });
  play(state, 'discard', { id: book, count: 1, confirmed: true });
  assert.equal(view(state).guideBook, null);
  play(state, 'take', { id: book });
  assert.equal(view(state).guideBook.entries.find(({ id }) => id === 'ration').note, '走远路前可以带着。');
});
