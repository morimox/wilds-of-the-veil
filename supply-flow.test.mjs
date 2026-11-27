import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function unchanged(state, action, payload = {}) {
  const before = structuredClone(state);
  assert.equal(act(state, action, payload).ok, false);
  assert.deepEqual(state, before);
}

function stateWithoutLog(state) {
  const { log, ...rest } = state;
  return rest;
}

test('inn recovery matches the half-day cycle with wounds, pressure, poison, training and relief food', () => {
  const state = createGame(25);
  state.region = 'cinder_inn';
  state.discovered.push(state.region);
  state.realm = 5;
  state.hp = 22;
  state.qi = 7;
  state.wounds = 2;
  state.pressure = 5;
  state.toxin = 28;
  state.training.levels = { breath: 2, spirit: 2 };
  state.inventory.ration = 1;
  state.satiety = 27;

  const repeated = structuredClone(state);
  const sessions = view(state).restSessions;
  assert.equal(sessions, 9);
  for (let i = 0; i < sessions; i++) play(repeated, 'rest');

  const outcome = play(state, 'restUntilRecovered');
  assert.match(outcome.message, /歇了4\.5日/);
  assert.match(outcome.message, /匀给你2份干粮/);
  assert.deepEqual(stateWithoutLog(state), stateWithoutLog(repeated));
  assert.equal(view(state).restSessions, 0);
  assert.equal(state.satiety, 0);
  assert.equal(state.inventory.ration, rules.reliefRations);
  unchanged(state, 'restUntilRecovered');
});

test('a full bag with a different meal in the pouch does not block recovery or drop relief food', () => {
  const state = createGame(26);
  state.hp = 4;
  state.qi = 0;
  delete state.inventory.ration;
  state.mealPouch = 'meat_broth';
  state.inventory.meat_broth = 1;
  state.coins = 0;
  state.inventory.wood = rules.backpackCapacity * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  const summary = play(state, 'restUntilRecovered');
  assert.match(summary.message, /行囊已满/);
  assert.equal(state.hp, view(state).maxHp);
  assert.equal(state.qi, view(state).maxQi);
  assert.ok(!state.inventory.ration);
  assert.deepEqual(view(state).groundLoot, {});
  unchanged(state, 'restUntilRecovered');
  unchanged(state, 'rest');
});

test('an empty meal slot can save ground food and relief food when the main pack is full', () => {
  const state = createGame(29);
  delete state.inventory.ration;
  state.mealPouch = 'meat_broth';
  state.coins = 0;
  state.inventory.wood = rules.backpackCapacity * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  const relief = structuredClone(state);
  play(relief, 'rest');
  assert.deepEqual(view(relief).packedMeal, { id: 'ration', count: rules.reliefRations });
  assert.equal(relief.reliefRations, rules.reliefRations);
  assert.deepEqual(view(relief).groundLoot, {});

  state.ground.village = { ration: rules.backpackStackSize + 1 };
  assert.equal(view(state).groundPickup.ration, rules.backpackStackSize);
  play(state, 'take', { id: 'ration' });
  assert.deepEqual(view(state).packedMeal, { id: 'ration', count: rules.backpackStackSize });
  assert.deepEqual(view(state).groundLoot, { ration: 1 });
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
});

test('an explicit batch of one selected food gives the same full meals, honors stock, and never wastes satiety', () => {
  const state = createGame(27);
  state.satiety = 1;
  state.hp = 18;
  state.inventory.ration = 5;
  state.inventory.meat_broth = 2;
  state.reliefRations = 2;
  const repeated = structuredClone(state);
  assert.equal(view(state).batchMeals.ration, 3);
  assert.equal(view(state).batchMeals.meat_broth, 2);
  for (let i = 0; i < 3; i++) play(repeated, 'eat', { id: 'ration' });
  assert.match(play(state, 'batchEat', { id: 'ration' }).message, /3份干粮/);
  assert.deepEqual(stateWithoutLog(state), stateWithoutLog(repeated));
  assert.equal(state.inventory.meat_broth, 2);
  assert.equal(state.satiety, 97);
  assert.equal(state.reliefRations, 0);
  unchanged(state, 'batchEat', { id: 'ration' });

  state.satiety = 22;
  state.inventory.ration = 3;
  assert.equal(view(state).batchMeals.ration, 2);
  play(state, 'batchEat', { id: 'ration' });
  assert.equal(state.satiety, 86);
  assert.equal(state.inventory.ration, 1);
});

test('batch meals work in a scene and never bypass active gathering or a combat round', () => {
  const state = createGame(28);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'reed_banks' });
  state.satiety = 1;
  play(state, 'batchEat', { id: 'ration' });
  assert.equal(view(state).currentEvent.id, 'reed_banks');
  play(state, 'beginGather', { index: 0 });
  assert.deepEqual(view(state).batchMeals, {});
  unchanged(state, 'batchEat', { id: 'ration' });
  unchanged(state, 'restUntilRecovered');

  play(state, 'finishGather');
  play(state, 'leave');
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  state.satiety = 10;
  state.inventory.ration = 3;
  assert.deepEqual(view(state).batchMeals, {});
  unchanged(state, 'batchEat', { id: 'ration' });
  unchanged(state, 'restUntilRecovered');
  unchanged(state, 'eat', { id: 'ration' });
  unchanged(state, 'use', { id: 'ration' });
  assert.equal(state.combat.round, 0);
  assert.equal(state.inventory.ration, 3);
});
