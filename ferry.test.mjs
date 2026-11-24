import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, view } from './engine.mjs';

function step(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, result.message);
  return result;
}

test('the ferry shift starts at night, can be waited for in place, and settles once', () => {
  const state = createGame(904);
  state.region = 'ford';
  assert.ok(!view(state).sites.some(({ id }) => id === 'ford_watch_lamp'));
  state.knownItems.push('secret_pass', 'ford_chart');
  step(state, 'visit', { id: 'ford_watch_lamp' });
  const appointment = () => view(state).visibleChoices.find(({ index }) => index === 0);
  assert.match(appointment().lockedReason, /等天黑/);
  const before = [state.day, state.satiety, state.coins];
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.deepEqual([state.day, state.satiety, state.coins], before);
  while (!appointment().available) {
    step(state, 'choose', { index: 1 });
    assert.equal(state.event, 'ford_watch_lamp');
  }
  step(state, 'choose', { index: 0 });
  assert.equal(state.inventory.ferry_watch_tag, 1);
  step(state, 'travel', { id: 'hidden' });
  step(state, 'visit', { id: 'wharf_lee_lamp' });
  step(state, 'choose', { index: 0 });
  assert.equal(state.event, 'wharf_lee_lamp');
  assert.equal(state.inventory.ferry_watch_tag, undefined);
  assert.equal(state.inventory.ferry_watch_reply, 1);

  assert.equal(act(state, 'choose', { index: 1 }).ok, false);
  step(state, 'leave');
  step(state, 'eat', { id: 'ration' });
  step(state, 'travel', { id: 'ford' });
  step(state, 'visit', { id: 'ford_watch_lamp' });
  const payment = state.coins;
  step(state, 'choose', { index: 2 });
  assert.equal(state.coins, payment + 4);
  assert.equal(state.inventory.ferry_watch_reply, undefined);
  step(state, 'visit', { id: 'ford_watch_lamp' });
  assert.ok(!view(state).visibleChoices.some(({ index }) => index === 2));
});

test('repairing the old lamp rewards the actual boat pole once', () => {
  const state = createGame(905);
  state.region = 'hidden';
  state.inventory.wood = 2;
  state.knownItems.push('ferry_watch_tag');
  state.inventory.ferry_watch_tag = 1;
  step(state, 'visit', { id: 'wharf_lee_lamp' });
  assert.ok(!view(state).visibleChoices.some(({ index }) => index === 1));
  step(state, 'choose', { index: 0 });
  step(state, 'choose', { index: 1 });
  assert.equal(state.inventory.ferry_pole, 1);
  assert.equal(state.inventory.wood, undefined);
  step(state, 'visit', { id: 'wharf_lee_lamp' });
  assert.match(view(state).currentEvent.text, /两截新木/);
  assert.ok(!view(state).visibleChoices.some(({ index }) => index === 1));
});
