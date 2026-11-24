import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function startHunt() {
  const state = createGame(0);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  play(state, 'attack');
  return state;
}

function revealCurrentMove(state) {
  state.combat.plan.reader = 'player';
  return view(state);
}

test('enemy guard gives a low-qi traveler an actual choice between pressure and breathing', () => {
  const breathing = startHunt();
  play(breathing, 'guard');
  breathing.qi = 2;
  assert.equal(revealCurrentMove(breathing).intent.kind, 'guard');
  assert.equal(view(breathing).breathingQi, rules.guardQiRecovery);
  const attacking = structuredClone(breathing);
  const almostFull = structuredClone(breathing);
  almostFull.qi = view(almostFull).maxQi - 1;
  assert.equal(view(almostFull).breathingQi, 1);

  const before = view(breathing);
  const rested = play(breathing, 'guard');
  assert.equal(rested.damageDealt, 0);
  assert.equal(breathing.qi, before.qi + rules.guardQiRecovery);
  assert.equal(breathing.day, before.day + rules.battleDays);
  assert.equal(breathing.satiety, before.satiety - rules.battleDays * rules.satietyDrainPerDay);
  assert.equal(view(breathing).breathingQi, 0);
  assert.ok(play(attacking, 'attack').damageDealt > 0);
  assert.equal(attacking.qi, 2);
  play(almostFull, 'guard');
  assert.equal(almostFull.qi, view(almostFull).maxQi);
});

test('interrupting arts can deny an actual field enemy’s restoration', () => {
  const state = createGame(1);
  // Stage the return to the clandestine quay with the previously learned river technique.
  state.region = 'hidden';
  state.discovered.push('hidden');
  state.knownItems.push('secret_pass', 'oar_mark');
  state.knownArts.push('hook_current');
  play(state, 'visit', { id: 'sunken_mooring' });
  play(state, 'choose', { index: 0 });
  play(state, 'attack');
  play(state, 'attack');
  play(state, 'guard');
  assert.equal(revealCurrentMove(state).intent.kind, 'heal');
  const before = state.combat.hp;
  const ordinary = structuredClone(state);
  const strike = play(ordinary, 'attack');
  const interrupt = play(state, 'art', { id: 'hook_current' });
  assert.equal(ordinary.combat.hp, before - strike.damageDealt + 6);
  assert.equal(state.combat.hp, before - interrupt.damageDealt);
  assert.equal(interrupt.enemyMove.kind, 'heal');
  assert.match(interrupt.message, /调息被打断/);
  assert.equal(ordinary.qi - state.qi, 3);
});

test('a known attack blocks retreat and a guard opening offers a seeded escape', () => {
  const state = startHunt();
  assert.equal(revealCurrentMove(state).intent.kind, 'heavy');
  state.hp = 3;
  const safeOpening = structuredClone(state);
  const forecast = view(state).retreatRisk;
  assert.deepEqual(forecast, { blocked: true });
  const failed = play(state, 'retreat');
  assert.equal(failed.retreated, false);
  assert.equal(failed.damageTaken, 3);
  assert.equal(view(state).mode, 'village');

  // A healthier traveler can brace once and wait for a safe opening.
  safeOpening.hp = 18;
  play(safeOpening, 'guard');
  assert.equal(revealCurrentMove(safeOpening).intent.kind, 'guard');
  assert.deepEqual(view(safeOpening).retreatRisk, { blocked: false });
  const unlucky = structuredClone(safeOpening);
  unlucky.escapeSeed = 1500;
  assert.equal(play(unlucky, 'retreat').retreated, false);
  assert.ok(unlucky.combat);
  safeOpening.escapeSeed = 1972;
  assert.equal(play(safeOpening, 'retreat').damageTaken, 0);
  assert.equal(safeOpening.combat, null);
  assert.equal(safeOpening.region, 'marsh');
});
