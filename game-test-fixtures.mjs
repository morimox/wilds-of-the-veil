import { data } from './data.mjs';
import { createGame } from './engine.mjs';

export function prepareQuietRoad(state) {
  // The next 92 road draws are above the highest road risk of 0.17.
  state.roadSeed = 15505888;
}

export function createQuietGame(seed) {
  const state = createGame(seed);
  prepareQuietRoad(state);
  return state;
}

export function stageRetreatOpening(state) {
  const enemy = data.enemies.find(({ id }) => id === state.combat.id);
  const intent = enemy.intents.find(({ kind }) => !['attack', 'heavy', 'drain'].includes(kind));
  if (!intent) throw new Error(`${enemy.name} has no retreat opening`);
  state.combat.plan = { round: state.combat.round, reader: 'player', intent };
  state.escapeSeed = 1972;
}
