import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, view } from './engine.mjs';

test('the heirloom seal can be brought home early, and dispatch waits for the ferry', () => {
  const state = createGame(9);
  assert.equal(view(state).quests.some(({ id }) => id === 'sky_treaty'), false);
  state.realm = 2;
  state.discovered.push('ford', 'sky_terrace');
  state.knownItems.push('ford_chart', 'sky_seal');
  state.inventory.sky_seal = 1;

  const quest = () => view(state).quests.find(({ id }) => id === 'sky_treaty');
  assert.equal(quest().ready, false);
  assert.match(quest().blockedReason, /旧渡还关着/);
  const prior = structuredClone(state);
  const blocked = act(state, 'handin', { id: 'sky_treaty' });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.message, quest().blockedReason);
  assert.deepEqual(state, prior);

  state.inventory.seal = 1;
  assert.equal(act(state, 'handin', { id: 'last_lantern' }).ok, true);
  assert.equal(view(state).completionPhase, 'ford');
  assert.equal(act(state, 'resume').ok, true);
  assert.equal(quest().ready, true);
  assert.equal(act(state, 'handin', { id: 'sky_treaty' }).ok, true);
  assert.equal(view(state).completionPhase, 'final');
  assert.equal(view(state).realmIndex, 2);
});

test('the field ration pill directly feeds the traveler and never creates loose rations', () => {
  const state = createGame(9);
  state.region = 'marsh';
  state.satiety = 0;
  state.inventory.grain_pill = 3;
  const rations = state.inventory.ration;
  const takePill = () => act(state, 'use', { id: 'grain_pill' });
  assert.equal(takePill().ok, true);
  assert.equal(state.satiety, 88);
  assert.equal(state.inventory.ration, rations);
  assert.equal(state.inventory.grain_pill, 2);
  assert.equal(state.toxin, 4);
  assert.equal(takePill().ok, true);
  assert.equal(state.satiety, 100);
  const prior = structuredClone(state);
  assert.equal(takePill().ok, false);
  assert.deepEqual(state, prior);
});
