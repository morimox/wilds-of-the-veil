import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function outfitted(id, mode) {
  const gear = data.gear.find((entry) => entry.id === id);
  const state = createGame(8732);
  state.realm = Math.max(6, gear.tier);
  state.inventory[id] = 1;
  state.durability[id] = gear.durability;
  state.satiety = rules.maxSatiety;
  if (mode !== 'packed') play(state, 'equip', { id });
  if (mode === 'broken') state.durability[id] = 0;
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  return state;
}

function exposedVisits(state, count) {
  const readings = [];
  for (let step = 0; step < count; step += 1) {
    const before = state.qi;
    const result = play(state, 'visit', { id: 'reed_banks' });
    const { fogTier } = view(state);
    const loss = result.fogLoss ?? 0;
    assert.equal(before - state.qi, loss);
    readings.push([fogTier, loss]);
    play(state, 'leave');
  }
  return readings;
}

test('only worn intact anti-fog gear slows buildup through the same fixed five bands', () => {
  const bare = [[1, 0], [1, 0], [2, 0], [3, 1], [4, 3], [4, 6], [5, 10], [5, 14]];
  const staff = [[1, 0], [1, 0], [1, 0], [1, 0], [2, 0], [2, 0], [3, 1], [3, 2]];
  const hat = [[1, 0], [1, 0], [1, 0], [2, 0], [3, 1], [3, 2], [4, 4], [5, 7]];
  for (const [id, mode, expected] of [
    ['coil_pole', 'worn', staff], ['coil_pole', 'packed', bare], ['coil_pole', 'broken', bare],
    ['caravan_bell', 'worn', staff], ['reed_hat', 'worn', hat],
    ['border_watch_charm', 'worn', hat], ['gauze_armor', 'worn', bare],
  ]) {
    const state = outfitted(id, mode);
    play(state, 'travel', { id: 'marsh' });
    assert.deepEqual(exposedVisits(state, 8), expected, `${id} (${mode})`);
    const publicState = view(state);
    for (const key of ['pressure', 'fogExposure', 'fogDrain', 'fogTolerance']) assert.ok(!(key in publicState));
    play(state, 'travel', { id: 'village' });
    assert.equal(view(state).fogTier, 0);
  }
});

test('the best item and active fog manual delay the third band but cannot prevent it', () => {
  const state = outfitted('coil_pole', 'worn');
  state.inventory.reed_hat = 1;
  state.durability.reed_hat = 25;
  state.inventory.eaves_breath_manual = 1;
  state.manualRanks.eaves_breath_manual = 3;
  play(state, 'equip', { id: 'reed_hat' });
  play(state, 'travel', { id: 'marsh' });
  assert.deepEqual(exposedVisits(state, 2), [[1, 0], [1, 0]]);
  play(state, 'equipManual', { id: 'eaves_breath_manual' });
  assert.equal(view(state).fogTier, 1);
  assert.deepEqual(exposedVisits(state, 7), [[1, 0], [1, 0], [1, 0], [2, 0], [2, 0], [2, 0], [3, 1]]);
});

test('a sheltered fire pauses heavy fog and the next exposed wait drains remaining qi', () => {
  const state = outfitted('gauze_armor', 'worn');
  state.region = 'ridge';
  state.discovered.push('ridge');
  play(state, 'wait');
  play(state, 'wait');
  play(state, 'wait');
  assert.equal(view(state).fogTier, 4);
  state.qi = 10;
  assert.equal(play(state, 'visit', { id: 'empty_oven' }).fogLoss, undefined);
  assert.equal(view(state).fogExposed, false);
  assert.equal(view(state).fogTier, 4);
  assert.equal(state.qi, 10);
  play(state, 'leave');
  assert.equal(play(state, 'wait').fogLoss, 10);
  assert.equal(view(state).fogTier, 5);
  assert.equal(state.qi, 0);
  assert.equal(play(state, 'wait').fogLoss, undefined);
  assert.equal(state.qi, 0);
});

test('a proper break beside the sheltered stove lowers existing fog and restores qi', () => {
  const state = outfitted('gauze_armor', 'worn');
  state.region = 'ridge';
  state.discovered.push('ridge');
  state.inventory.wood = 1;
  for (let step = 0; step < 4; step += 1) play(state, 'wait');
  assert.equal(view(state).fogTier, 5);
  state.qi = 5;
  play(state, 'visit', { id: 'empty_oven' });
  const rest = play(state, 'choose', { index: 0 });
  assert.match(rest.message, /雾压缓了下来/);
  assert.equal(rest.fogLoss, undefined);
  assert.equal(view(state).fogTier, 4);
  assert.equal(state.qi, 11);
  assert.equal(state.inventory.wood, undefined);
});

test('a scroll skips the origin mist even if enough fractional exposure is left to tick', () => {
  const state = outfitted('gauze_armor', 'worn');
  play(state, 'attuneGate');
  play(state, 'travel', { id: 'marsh' });
  play(state, 'wait');
  play(state, 'wait');
  assert.equal(view(state).fogTier, 3);
  state.fogExposure = 0.125;
  state.inventory.gate_scroll = 1;
  const qi = state.qi;
  assert.equal(play(state, 'gateScroll', { id: 'village' }).fogLoss, undefined);
  assert.equal(state.qi, qi);
  assert.equal(state.region, 'village');
  assert.equal(view(state).fogTier, 0);
});

test('water gauze softens the shell scrape after timed gathering without changing the reed yield', () => {
  for (const mode of ['worn', 'packed', 'broken']) {
    const state = outfitted('gauze_armor', mode);
    play(state, 'travel', { id: 'marsh' });
    play(state, 'visit', { id: 'reed_banks' });
    const before = state.hp;
    play(state, 'beginGather', { index: 1 });
    assert.equal(state.hp, before);
    const result = play(state, 'finishGather');
    const expectedInjury = mode === 'worn' ? 1 : 4;
    assert.equal(state.hp, before - expectedInjury);
    assert.match(result.injury.cause, /碎蚌壳/);
    assert.equal(result.injury.amount, expectedInjury);
    assert.equal(/水纹护甲卸掉/.test(result.message), mode === 'worn');
    assert.deepEqual(result.gathered, { reed: 3 });
    assert.equal(state.event, 'reed_banks');
  }
});

test('raincoat makes local Mingsha roads cheaper to walk and leaves transfer and waiting costs intact', () => {
  for (const mode of ['worn', 'packed', 'broken']) {
    const state = outfitted('fault_coat', mode);
    state.region = 'mingsha_city';
    state.discovered.push('mingsha_city', 'cinder_inn');
    play(state, 'attuneGate');
    const road = view(state).world.roads.find(({ id }) => id === 'cinder_inn');
    const before = state.day;
    const result = play(state, 'travel', { id: 'cinder_inn' });
    const cost = road.days * (mode === 'worn' ? 12 : 16);
    assert.equal(state.day, before + road.days);
    assert.equal(state.satiety, 100 - cost);
    assert.equal(/横渊雨衣/.test(result.message), mode === 'worn');

    play(state, 'attuneGate');
    play(state, 'gateJump', { id: 'mingsha_city' });
    assert.equal(state.satiety, 98 - cost);
    play(state, 'wait');
    assert.equal(state.satiety, 90 - cost);
  }

  const neighboringProvince = outfitted('fault_coat', 'worn');
  play(neighboringProvince, 'travel', { id: 'marsh' });
  assert.equal(neighboringProvince.satiety, 84);
});
