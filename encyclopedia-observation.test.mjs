import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

const bookIds = (state) => view(state).guideBook?.entries.map(({ id }) => id) ?? [];

test('the encyclopedia remembers uncollected local finds and actually browsed goods without revealing progress', () => {
  const state = createGame(33);
  assert.equal(view(state).guideBook, null);
  assert.equal(act(state, 'observeGuideItems', { source: 'market', ids: ['heal_pill'] }).ok, false);
  assert.equal(act(state, 'observeGuideItems', { source: 'market', ids: ['knife', 'heal_pill'] }).ok, false);
  assert.equal(state.itemSightings.includes('knife'), false);
  const before = structuredClone(state);
  assert.deepEqual(play(state, 'observeGuideItems', { source: 'market', ids: ['knife'] }), { ok: true, changed: true });
  assert.deepEqual(play(state, 'observeGuideItems', { source: 'market', ids: ['knife'] }), { ok: true, changed: false });
  assert.deepEqual({ ...state, itemSightings: before.itemSightings }, before);
  assert.equal(state.knownItems.includes('knife'), false);
  assert.equal(state.knownItems.includes('reed'), false);

  play(state, 'travel', { id: 'marsh' });
  assert.equal(act(state, 'observeGuideItems', { source: 'market', ids: ['split_axe'] }).ok, false);
  play(state, 'visit', { id: 'reed_banks' });
  play(state, 'beginGather', { index: 0 });
  play(state, 'finishGather');
  assert.ok(view(state).groundLoot.reed);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(state.knownItems.includes('reed'), false);

  play(state, 'leave');
  play(state, 'travel', { id: 'village' });
  state.ground.village = { encyclopedia: 1 };
  state.ground.hidden = { jade_pill: 1 };
  state.knownItems.push('formula_heart');
  play(state, 'take', { id: 'encyclopedia' });
  assert.ok(bookIds(state).includes('reed'));
  assert.ok(bookIds(state).includes('knife'));
  assert.ok(bookIds(state).includes('encyclopedia'));
  for (const unseen of ['split_axe', 'heal_pill', 'jade_pill', 'formula_heart']) assert.ok(!bookIds(state).includes(unseen));
});

test('a handwritten item note costs no action and lasts through storing the book, but a new journey starts clean', () => {
  const state = createGame(53);
  const text = '\n恢复 2 点神识。\n<药瓶> & "记过"  ';
  assert.equal(act(state, 'editGuideNote', { id: 'ration', text }).ok, false);
  state.ground.village = { encyclopedia: 1 };
  play(state, 'take', { id: 'encyclopedia' });
  assert.equal(view(state).guideBook.noteLimit, 480);
  assert.equal(act(state, 'editGuideNote', { id: 'formula_heart', text }).ok, false);
  assert.equal(act(state, 'editGuideNote', { id: '__proto__', text }).ok, false);
  assert.equal(act(state, 'editGuideNote', { id: 'ration', text: '长'.repeat(481) }).ok, false);
  assert.equal(act(state, 'editGuideNote', { id: 'ration', text: 14 }).ok, false);

  state.combat = { id: 'mud_beast', round: 0, hp: 25 };
  const before = structuredClone(state);
  play(state, 'editGuideNote', { id: 'ration', text });
  assert.deepEqual({ ...state, itemNotes: {} }, before);
  assert.equal(view(state).itemNotes.ration, text);
  assert.equal(view(state).guideBook.entries.find(({ id }) => id === 'ration').note, text);
  state.combat = null;

  play(state, 'econDeposit', { id: 'encyclopedia', count: 1 });
  assert.equal(view(state).guideBook, null);
  assert.equal(view(state).itemNotes.ration, text);
  assert.equal(act(state, 'editGuideNote', { id: 'ration', text: '' }).ok, false);
  play(state, 'econWithdraw', { id: 'encyclopedia', count: 1 });
  play(state, 'editGuideNote', { id: 'ration', text: '' });
  assert.equal(view(state).itemNotes.ration, undefined);
  assert.equal(view(state).guideBook.entries.find(({ id }) => id === 'ration').note, '');
  assert.deepEqual(view(createGame(53)).itemNotes, {});
});
