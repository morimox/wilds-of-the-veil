import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, view } from './engine.mjs';
import { createQuietGame, stageRetreatOpening } from './game-test-fixtures.mjs';
import { rollEnemyIndividual } from './enemy-encounters.mjs';

const enemies = new Map(data.enemies.map(enemy => [enemy.id, enemy]));
const play = (state, action, payload) => {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
};

test('individual builds vary independently within their stage and the novice ranges stay safe', () => {
  const parent = enemies.get('reed_fox');
  const ordinary = Array.from({ length: 200 }, (_, index) => rollEnemyIndividual(parent, 82411, `ridge:${index}`));
  const novice = Array.from({ length: 200 }, (_, index) => rollEnemyIndividual(parent, 82411, `marsh:${index}`, { novice: true }));
  assert.ok(Math.max(...ordinary.map(({ hp }) => hp)) / Math.min(...ordinary.map(({ hp }) => hp)) >= 1.5);
  assert.ok(new Set(ordinary.map(({ perception }) => perception)).size > 8);
  assert.ok(ordinary.some(({ hp, atk }) => hp > parent.hp && atk < parent.atk));
  assert.ok(novice.some(({ hp }) => hp < parent.hp));
  assert.ok(novice.every(({ hp, atk, def }) => hp <= parent.hp && atk <= parent.atk && def <= parent.def));
  assert.ok([...ordinary, ...novice].every(profile => !Object.hasOwn(profile, 'tier') && profile.dodge <= 0.30));
});

test('a recurring opponent stays the same on return, then a second actual hunt gets a fresh individual', () => {
  const state = createQuietGame(9821);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 2 });
  const first = structuredClone(state.combat.individual);
  assert.ok(first);
  const seed = state.encounterSeed;
  assert.equal(view(state).currentEnemy.hp, undefined);
  assert.equal(view(state).currentEnemy.perception, undefined);
  assert.equal(view(state).currentEnemy.intents, undefined);
  assert.equal(view(state).enemyIndividualSeed, undefined);
  assert.deepEqual(state.combat.individual, first);
  assert.equal(state.encounterSeed, seed);

  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  assert.equal(view(state).currentEvent?.id, 'mud_track');
  play(state, 'choose', { index: 2 });
  assert.deepEqual(state.combat.individual, first);
  for (let i = 0; state.combat && i < 10; i++) {
    play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.equal(state.siteVictories.mud_track.reed_fox, 1);
  assert.ok(view(state).groundLoot.qi_core >= 1);
  play(state, 'choose', { index: 2 });
  assert.notDeepEqual(state.combat.individual, first);
  assert.equal(view(state).currentEnemy.id, 'reed_fox');
});

test('a unique field trial continues to use the authored opponent', () => {
  const state = createQuietGame(174);
  state.region = 'marsh';
  state.discovered.push('marsh');
  play(state, 'visit', { id: 'marsh_pole_lesson' });
  play(state, 'choose', { index: 1 });
  assert.equal(state.combat.id, 'river_spar_captain');
  assert.equal(state.combat.individual, undefined);
  assert.equal(state.combat.hp, enemies.get('river_spar_captain').hp);
});
