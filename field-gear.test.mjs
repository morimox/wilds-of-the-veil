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

test('the equipped and intact staff postpones fog fatigue for two exposed visits', () => {
  for (const mode of ['worn', 'packed', 'broken']) {
    const state = outfitted('coil_pole', mode);
    const startQi = state.qi;
    const expectedTolerance = rules.pressureThreshold + (mode === 'worn' ? 2 : 0);
    assert.equal(view(state).fogTolerance, expectedTolerance);
    play(state, 'travel', { id: 'marsh' });
    const route = ['reed_banks', 'sunk_pack', 'mud_track', 'bank_watch', 'reed_banks', 'sunk_pack'];
    for (const [step, id] of route.entries()) {
      const result = play(state, 'visit', { id });
      assert.equal(state.pressure, step + 1);
      assert.equal(state.qi, startQi - Math.max(0, state.pressure - expectedTolerance) * rules.pressureQi);
      assert.equal(/回烟长杖微热/.test(result.message), mode === 'worn' && [4, 5].includes(state.pressure));
      play(state, 'leave');
    }
    play(state, 'travel', { id: 'village' });
    assert.equal(state.pressure, 0);
  }
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
