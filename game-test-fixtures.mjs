import { data } from './data.mjs';
import { createGame } from './engine.mjs';

export function prepareQuietRoad(state) {
  // The next 110 road draws are above 0.1. Keep quest and field tests on their intended routes.
  state.roadSeed = 172102;
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
