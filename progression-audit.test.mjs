import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, view } from './engine.mjs';

test('the sheltered alcove lets a traveler prepare for the undertow guardian', () => {
  const state = createGame(42);
  state.region = 'undertow_grotto';
  state.discovered.push(state.region);
  state.inventory.undertow_entry = 1;
  state.knownItems.push('undertow_entry');
  state.satiety = 100;
  state.pressure = 5;
  state.qi = 0;
  assert.ok(act(state, 'visit', { id: 'undertow_bed' }).ok);
  const before = view(state);
  assert.match(before.currentEvent.text, /背风的石凹/);
  assert.ok(act(state, 'choose', { index: 4 }).ok);
  const recovered = view(state);
  assert.equal(recovered.qi, 12);
  assert.ok(recovered.fogTier < before.fogTier);
  assert.equal(recovered.day - before.day, 0.5);
  assert.equal(recovered.currentEvent.id, 'undertow_bed');
  assert.equal(act(state, 'choose', { index: 4 }).ok, false);
  assert.equal(act(state, 'choose', { index: 0 }).ok, true);
  assert.equal(view(state).currentEnemy.id, 'undertow_moundback');
});

test('the cold-kiln record uses authentic proof and can be earned without cash', () => {
  const state = createGame(40);
  state.region = 'cold_kiln';
  state.discovered.push(state.region);
  state.coins = 0;
  state.satiety = 100;
  state.inventory.sand_well_chit = 1;
  state.inventory.stillwell_salt = 1;
  assert.ok(act(state, 'visit', { id: 'sand_cold_kiln_house' }).ok);
  assert.match(act(state, 'choose', { index: 1 }).message, /18/);
  assert.ok(!view(state).visibleChoices.some(choice => choice.index === 2));
  assert.ok(act(state, 'choose', { index: 0 }).ok);
  assert.equal(state.event, 'sand_cold_kiln_house');
  assert.ok(view(state).visibleChoices.some(choice => choice.index === 2 && choice.available));
  assert.ok(act(state, 'choose', { index: 2 }).ok);
  assert.equal(state.inventory.cold_kiln_record, 1);
  assert.equal(state.inventory.sand_well_chit, 1);
  assert.equal(state.inventory.stillwell_salt, 1);
  assert.equal(state.coins, 0);
  assert.ok(act(state, 'visit', { id: 'sand_cold_kiln_house' }).ok);
  assert.match(view(state).currentEvent.text, /炉门重新挂上/);
  assert.ok(!view(state).visibleChoices.some(choice => choice.index === 1 || choice.index === 2));
});

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
