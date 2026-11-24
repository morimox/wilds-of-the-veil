import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const blade = 'gully_king_blade';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function ask(state, action, id) {
  const prior = structuredClone(state);
  const result = act(state, action, { id, count: 1 });
  assert.equal(result.ok, false);
  assert.match(result.message, /无法重新取得/);
  assert.equal(result.confirmation.action, action);
  assert.equal(result.confirmation.id, id);
  assert.equal(result.confirmation.count, 1);
  assert.equal(result.confirmation.maximum, 1);
  assert.deepEqual(state, prior);
  return result.confirmation;
}

test('loose supplies can be set down during collection and combat without spending a turn', () => {
  const state = createGame(731);
  state.inventory.wood = 4;
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'reed_banks' });
  play(state, 'beginGather', { index: 0 });
  const collection = state.gathering;
  const day = state.day;
  const used = view(state).backpackUsed;
  play(state, 'discard', { id: 'wood', count: 4 });
  assert.equal(state.gathering, collection);
  assert.equal(state.day, day);
  assert.equal(view(state).backpackUsed, used - 1);
  assert.equal(state.ground.reed_banks.wood, 4);
  assert.equal(act(state, 'take', { id: 'wood' }).ok, false);
  play(state, 'finishGather');
  play(state, 'take', { id: 'wood' });
  assert.equal(state.inventory.wood, 4);
  play(state, 'leave');
  state.inventory.reed_hand_manual = 1;
  play(state, 'equipManual', { id: 'reed_hand_manual' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 2 });
  assert.ok(state.combat);
  const { round, plan } = state.combat;
  const fightDay = state.day;
  play(state, 'discard', { id: 'wood', count: 1 });
  assert.equal(state.combat.round, round);
  assert.equal(state.combat.plan, plan);
  assert.equal(state.day, fightDay);
  assert.equal(state.ground.mud_track.wood, 1);
  assert.match(act(state, 'discard', { id: 'cudgel' }).message, /先把装备收下/);
  assert.match(act(state, 'discard', { id: 'reed_hand_manual' }).message, /先停下运功/);
  assert.equal(state.activeManual, 'reed_hand_manual');
});

test('an optional trophy needs confirmation for both markets and can be retrieved after setting it down', () => {
  const state = createGame(799);
  state.inventory[blade] = 1;
  state.durability[blade] = 3;
  const drop = ask(state, 'discard', blade);
  assert.match(drop.name, /许涧的宽背刀/);
  assert.equal(drop.place, 'village');
  const elsewhere = structuredClone(state);
  elsewhere.region = 'marsh';
  assert.match(act(elsewhere, 'discard', { id: blade, count: 1, confirmed: true, expectedPlace: drop.place }).message, /重新确认/);
  assert.equal(elsewhere.inventory[blade], 1);
  play(state, 'discard', { id: blade, count: 1, confirmed: true, expectedPlace: drop.place });
  assert.equal(state.inventory[blade], undefined);
  assert.equal(view(state).groundLoot[blade], 1);
  play(state, 'take', { id: blade });
  assert.equal(state.durability[blade], 3);

  const nearby = structuredClone(state);
  nearby.region = 'zhao_city';
  for (const [source, action] of [[state, 'sell'], [nearby, 'localSell']]) {
    const offer = ask(source, action, blade);
    const cash = source.coins;
    assert.match(act(source, action, { id: blade, count: 2, confirmed: true }).message, /没有这么多/);
    play(source, action, { id: blade, count: 1, confirmed: true, expectedPlace: offer.place });
    assert.ok(source.coins > cash);
    assert.equal(source.inventory[blade], undefined);
    assert.equal(view(source).groundLoot[blade], undefined);
  }
});

test('discarded rescue food frees space without re-entering the selling pool', () => {
  const state = createGame(492);
  state.inventory.ration = 6;
  state.reliefRations = 2;
  play(state, 'discard', { id: 'ration', count: 1 });
  assert.equal(state.reliefRations, 2);
  assert.equal(view(state).groundLoot.ration, 1);
  const mixed = play(state, 'discard', { id: 'ration', count: 5 });
  assert.match(mixed.message, /×3.*舍弃了 2 份救济干粮/);
  assert.equal(state.reliefRations, 0);
  assert.equal(state.inventory.ration, undefined);
  assert.equal(view(state).groundLoot.ration, 4);
  play(state, 'take', { id: 'ration' });
  play(state, 'sell', { id: 'ration', count: 4 });
  assert.equal(state.inventory.ration, undefined);
  assert.equal(view(state).groundLoot.ration, undefined);
});

test('both renewable breakthrough medicines can be placed down without a limited-item warning', () => {
  const state = createGame(977);
  for (const id of ['foundation_pill', 'gold_powder']) {
    state.inventory[id] = 1;
    assert.equal(view(state).discardOptions[id].maximum, 1);
    play(state, 'discard', { id });
    assert.equal(view(state).groundLoot[id], 1);
    play(state, 'take', { id });
    assert.equal(state.inventory[id], 1);
  }
});
