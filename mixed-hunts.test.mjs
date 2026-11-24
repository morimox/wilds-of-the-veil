import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';

const quarry = 'sand_hunt_colony';
const actors = ['sand_quarry_skink', 'sand_quarry_guard', 'sand_quarry_matriarch'];

function play(state, action, detail = {}) {
  const result = act(state, action, detail);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function arrive(seed, counts) {
  const state = createGame(seed);
  state.region = 'hanging_vein';
  state.discovered.push(state.region);
  state.realm = 7;
  state.hp = 90;
  state.seenChoices.push('sand_hunt_anchors:1');
  if (counts) {
    state.localPools[quarry] = { creatures: Object.fromEntries(
      actors.map((id, index) => [id, { count: counts[index], nextAt: null }]),
    ) };
  }
  play(state, 'visit', { id: quarry });
  return state;
}

const countAt = (state) => {
  const { creatures } = view(state).sites.find(({ id }) => id === quarry);
  return actors.map((id) => creatures[id]);
};

test('the quarry samples living opponents, preserves them on retreat and closes after clearing', () => {
  const full = arrive(1);
  assert.deepEqual(countAt(full), [72, 8, 1]);
  play(full, 'choose', { index: 0 });
  assert.equal(full.combat.id, actors[0]);
  play(full, 'retreat');
  assert.deepEqual(countAt(full), [72, 8, 1]);
  assert.ok(!full.siteVictories[quarry]);
  assert.ok(!full.ground[quarry]);

  const late = arrive(1, [0, 0, 1]);
  play(late, 'choose', { index: 0 });
  assert.equal(late.combat.id, actors[2]);
  late.combat.hp = 1;
  const result = play(late, 'attack');
  assert.ok(result.gathered.gold_core >= 3);
  assert.equal(late.inventory.gold_core, undefined);
  assert.deepEqual(countAt(late), [0, 0, 0]);
  assert.equal(view(late).visibleChoices[0].available, false);
  assert.equal(act(late, 'choose', { index: 0 }).ok, false);
  play(late, 'take', { id: 'gold_core' });
  assert.equal(late.inventory.gold_core, result.gathered.gold_core);
});

test('fixed and independent chance drops can differ even against the same type of opponent', () => {
  const outcomes = { guard: new Set(), matriarch: new Set() };
  for (const kind of ['guard', 'matriarch']) {
    for (const index of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const seed = Math.imul(index, 2654435761) >>> 0;
      const state = arrive(seed, kind === 'guard' ? [0, 1, 0] : [0, 0, 1]);
      play(state, 'choose', { index: 0 });
      const enemy = data.enemies.find(({ id }) => id === state.combat.id);
      state.combat.hp = 1;
      const { gathered } = play(state, 'attack');
      assert.equal(gathered.beast_meat, enemy.loot.beast_meat);
      assert.equal(gathered.hide, enemy.loot.hide);
      outcomes[kind].add(gathered.gold_core ?? 0);
    }
  }
  assert.deepEqual(outcomes.guard, new Set([0, 3]));
  assert.deepEqual(outcomes.matriarch, new Set([3, 8]));
});
