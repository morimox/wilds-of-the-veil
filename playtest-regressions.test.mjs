import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { createQuietGame } from './game-test-fixtures.mjs';

test('a full pack cannot block the final handoff or lose the closing gifts', () => {
  const state = createQuietGame(42);
  state.completedQuests.push('last_lantern');
  state.won = true;
  state.knownItems.push('sky_seal');
  state.inventory = { sky_seal: 1, wood: (rules.backpackCapacity - 1) * rules.backpackStackSize };
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);
  assert.equal(view(state).quests.find(({ id }) => id === 'sky_treaty').ready, true);

  const result = act(state, 'handin', { id: 'sky_treaty' });
  assert.ok(result.ok, result.message);
  assert.equal(state.inventory.sky_seal, undefined);
  assert.equal(state.finalWon, true);
  assert.equal(result.spilled.jade_pill, 2);
  assert.equal(state.ground.village.jade_pill, 2);

  assert.ok(act(state, 'resume').ok);
  assert.ok(act(state, 'discard', { id: 'wood', count: rules.backpackStackSize }).ok);
  assert.ok(act(state, 'take', { id: 'jade_pill' }).ok);
  assert.equal(state.inventory.jade_pill, 2);
  assert.equal(act(state, 'handin', { id: 'sky_treaty' }).ok, false);
});

test('canceling a harvest preserves the scene, time and resource pool', () => {
  const state = createQuietGame(44);
  assert.ok(act(state, 'travel', { id: 'marsh' }).ok);
  assert.ok(act(state, 'visit', { id: 'reed_banks' }).ok);
  const day = state.day;
  const inventory = structuredClone(state.inventory);
  const stock = structuredClone(view(state).sites.find(({ id }) => id === 'reed_banks').stocks);
  assert.ok(act(state, 'beginGather', { index: 0 }).ok);
  assert.ok(act(state, 'cancelGather').ok);
  assert.equal(state.day, day);
  assert.equal(state.event, 'reed_banks');
  assert.equal(state.gathering, null);
  assert.deepEqual(state.inventory, inventory);
  assert.deepEqual(view(state).sites.find(({ id }) => id === 'reed_banks').stocks, stock);
  assert.ok(act(state, 'beginGather', { index: 0 }).ok);
  assert.ok(act(state, 'finishGather').ok);
  assert.equal(state.event, 'reed_banks');
  assert.ok(view(state).groundLoot.reed > 0);
});

test('empty satiety slows a known local edge and leaving a small site uses that same route', () => {
  const state = createQuietGame(46);
  assert.ok(act(state, 'travel', { id: 'marsh' }).ok);
  state.discovered.push('ridge');
  assert.ok(act(state, 'visit', { id: 'reed_banks' }).ok);
  state.satiety = 0;
  const day = state.day;
  const quote = view(state).world.journeys.find(({ id }) => id === 'ridge');
  assert.equal(quote.available, true);
  assert.equal(quote.rescue, true);
  assert.deepEqual(quote.path, ['marsh', 'ridge']);
  assert.ok(act(state, 'travel', { id: 'ridge' }).ok);
  assert.equal(state.region, 'ridge');
  assert.equal(state.event, null);
  assert.equal(state.day - day, quote.days);
});

test('watching and resting do not immediately put the player back outside the scene', () => {
  const state = createQuietGame(47);
  state.region = 'kiln_valley';
  state.hp = 12;
  state.qi = 12;
  state.satiety = 96;
  assert.ok(act(state, 'visit', { id: 'abandoned_kiln' }).ok);
  const qi = state.qi;
  assert.ok(act(state, 'choose', { index: 1 }).ok);
  assert.equal(state.event, 'abandoned_kiln');
  assert.equal(state.qi, qi + 5);
  assert.ok(act(state, 'choose', { index: 2 }).ok);
  assert.equal(state.event, 'abandoned_kiln');
  assert.equal(state.inventory.resin_tamper, 1);
  assert.ok(view(state).visibleChoices.some(({ label, available }) => available && label.includes('石牌')));
});
