import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, view } from './engine.mjs';

function play(state, action, value) {
  const payload = typeof value === 'number' ? { index: value } : { id: value };
  const result = act(state, action, payload);
  assert.equal(result.ok, true, result.message);
  return result;
}

function gatherOne(state, index, item) {
  play(state, 'beginGather', index);
  play(state, 'finishGather');
  play(state, 'take', item);
}

test('a new gatherer can hear of the ridge map before deciding whether to spar', () => {
  const state = createGame(4250);
  play(state, 'travel', 'marsh');
  assert.ok(!view(state).sites.some(({ id }) => id === 'reed_ferryman'));
  play(state, 'visit', 'reed_banks');
  assert.match(view(state).currentEvent.text, /刨木声/);
  const meeting = play(state, 'choose', 2);
  assert.match(meeting.message, /匀些给我补桨.*旧山路图/);
  assert.equal(state.event, 'reed_banks');
  gatherOne(state, 0, 'reed');
  play(state, 'leave');
  play(state, 'visit', 'mud_track');
  gatherOne(state, 1, 'wood');
  play(state, 'leave');
  play(state, 'visit', 'reed_ferryman');
  play(state, 'choose', 0);
  assert.ok(state.inventory.ridge_rubbing);
  assert.equal(state.defeated.length, 0);
  assert.ok(view(state).world.roads.some(({ id, available }) => id === 'ridge' && available));
});

test('a shoal resident or a river worker can independently point out the old door', () => {
  for (const route of ['shoal', 'worker']) {
    const state = createGame(4251);
    play(state, 'travel', 'marsh');
    assert.equal(act(state, 'visit', { id: 'undertow_door' }).ok, false);
    if (route === 'shoal') {
      play(state, 'travel', 'pale_shoal');
      play(state, 'visit', 'shoal_baskets');
      assert.match(play(state, 'choose', 2).message, /回白苇滩.*石门/);
      play(state, 'travel', 'marsh');
      play(state, 'eat', 'ration');
    } else {
      play(state, 'visit', 'marsh_pole_lesson');
      assert.match(play(state, 'choose', 0).message, /高苇.*石门/);
    }
    assert.ok(view(state).sites.some(({ id }) => id === 'undertow_door'));
    play(state, 'visit', 'undertow_door');
    assert.match(play(state, 'choose', 0).message, /换了方向/);
    assert.ok(!state.inventory.undertow_entry);
    assert.ok(!state.discovered.includes('undertow_grotto'));
  }
});

test('an opening hunter can turn a hare and gathered fuel into meals before returning to a town', () => {
  const state = createGame(4252);
  play(state, 'travel', 'marsh');
  play(state, 'visit', 'mud_track');
  play(state, 'choose', 5);
  for (let turns = 0; state.combat && turns < 8; turns += 1) {
    play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.equal(state.combat, null);
  play(state, 'take', 'beast_meat');
  gatherOne(state, 1, 'wood');
  play(state, 'choose', 3);
  play(state, 'visit', 'old_fire');
  const before = state.satiety;
  play(state, 'choose', 4);
  assert.equal(state.event, 'old_fire');
  assert.equal(state.inventory.beast_meat, undefined);
  assert.equal(state.inventory.wood, 1);
  assert.equal(state.inventory.meat_broth, 2);
  assert.equal(state.inventory.ration, 3);
  assert.equal(state.satiety, before - 12);
  play(state, 'eat', 'meat_broth');
  assert.equal(state.satiety, before - 12 + 44);
});
