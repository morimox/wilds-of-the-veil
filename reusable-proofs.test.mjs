import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
import { createQuietGame, prepareQuietRoad } from './game-test-fixtures.mjs';

const map = 'eddy_note';
const recipe = 'r_bank_talisman';
const shortcut = 'ford_lamp_channel';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function leave(state) {
  if (state.event) play(state, 'leave');
}

function feed(state, minimum) {
  while (state.satiety < minimum) {
    if (!state.inventory.ration && state.region === 'village') play(state, 'rest');
    play(state, 'eat');
  }
}

function visit(state, id) {
  leave(state);
  feed(state, 24);
  play(state, 'visit', { id });
}

function walk(state, id) {
  leave(state);
  feed(state, 64);
  prepareQuietRoad(state);
  return play(state, 'travel', { id });
}

function chooseAt(state, site, index) {
  visit(state, site);
  const choice = view(state).visibleChoices.find((choice) => choice.index === index);
  assert.ok(choice?.available, `${site} choice ${index}`);
  if (!choice.gather?.length) return play(state, 'choose', { index });
  play(state, 'beginGather', { index });
  const result = play(state, 'finishGather');
  for (const id of Object.keys(result.gathered ?? {})) play(state, 'take', { id });
  return result;
}

function obtainMapAndLearnTheFord() {
  const state = createQuietGame(20261123);
  play(state, 'buy', { id: 'ration', count: 5 });
  walk(state, 'marsh');
  chooseAt(state, 'reed_banks', 0);
  chooseAt(state, 'reed_banks', 1);
  chooseAt(state, 'mud_track', 1);
  chooseAt(state, 'mud_track', 3);
  chooseAt(state, 'old_fire', 1);
  chooseAt(state, 'bank_watch', 1);
  chooseAt(state, 'reed_ferryman', 0);
  chooseAt(state, 'reed_ferryman', 2);

  walk(state, 'village');
  play(state, 'handin', { id: 'apprentice_waterline' });
  play(state, 'rest');
  assert.ok(!view(state).discoveredRecipes.includes(recipe));
  assert.equal(play(state, 'meditate', { item: 'reed_lines' }).meditation, 'ready');
  assert.equal(play(state, 'deduce', { id: 'find_eddy' }).deduction, 'recorded');

  walk(state, 'marsh');
  visit(state, 'drowned_mast');
  assert.equal(play(state, 'experiment', {
    id: 'find_eddy', settings: { release: 'stone_back', water: 'rising' },
  }).deduction, 'verified');
  assert.equal(state.inventory[map], 1);
  assert.ok(!view(state).discoveredRecipes.includes(recipe));
  assert.equal(act(state, 'showEddyMapToSmith').ok, false);

  walk(state, 'ridge');
  chooseAt(state, 'ore_rain', 0);
  chooseAt(state, 'miner_echo', 2);
  chooseAt(state, 'stone_niche', 0);
  walk(state, 'village');
  play(state, 'handin', { id: 'sell_forging' });
  return state;
}

function craftTwice(state) {
  assert.ok(!view(state).discoveredRecipes.includes(recipe));
  const before = state.day;
  play(state, 'showEddyMapToSmith');
  assert.equal(state.day, before);
  assert.equal(state.inventory[map], 1);
  assert.equal(act(state, 'showEddyMapToSmith').ok, false);
  for (const total of [2, 4]) {
    assert.ok(view(state).discoveredRecipes.includes(recipe));
    play(state, 'craft', { id: recipe });
    assert.equal(state.inventory.bank_talisman, total);
    assert.equal(state.inventory[map], 1);
  }
}

function unlockShortcutAndWalkHome(state) {
  walk(state, 'ford');
  const roadHome = () => view(state).world.journeys.find(({ id }) => id === 'village');
  assert.equal(roadHome().direct, false);
  const before = roadHome().days;
  assert.match(chooseAt(state, shortcut, 0).outcome, /打个双结/);
  assert.equal(state.inventory[map], 1);
  assert.equal(roadHome().direct, true);
  assert.ok(roadHome().days < before);
  assert.deepEqual(roadHome().path, ['ford', 'village']);
  assert.match(walk(state, 'village').message, /旧灯渠/);
}

test('the original 回汊图 survives two talisman batches before it opens the shortcut', () => {
  const state = obtainMapAndLearnTheFord();
  craftTwice(state);
  unlockShortcutAndWalkHome(state);
});

test('the original 回汊图 opens the shortcut and then still supports two talisman batches', () => {
  const state = obtainMapAndLearnTheFord();
  unlockShortcutAndWalkHome(state);
  craftTwice(state);
});
