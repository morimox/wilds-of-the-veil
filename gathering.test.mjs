import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function deny(state, action, payload) {
  const before = structuredClone(state);
  assert.equal(act(state, action, payload).ok, false, action);
  assert.deepEqual(state, before);
}

function enterMarsh(site) {
  const state = createGame(500);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: site });
  return state;
}

function stocks(state, site) {
  return view(state).sites.find(({ id }) => id === site).stocks;
}

test('each clicked gathering action waits before advancing time and leaves the site open', () => {
  const site = 'mud_track';
  const index = 1;
  const state = enterMarsh(site);
  const { days, loot } = data.events.find(({ id }) => id === site).choices[index];
  const start = { day: state.day, satiety: state.satiety, stock: stocks(state, site).wood };
  assert.equal(start.stock, 4);
  deny(state, 'finishGather');
  deny(state, 'beginGather', { index: 0 });

  for (let completed = 0; completed < 2; completed++) {
    const now = { day: state.day, satiety: state.satiety, hp: state.hp, stock: stocks(state, site).wood };
    play(state, 'beginGather', { index });
    assert.equal(state.gathering.siteId, site);
    assert.equal(state.gathering.index, index);
    assert.equal(state.gathering.days, days);
    assert.equal(view(state).currentEvent.id, site);
    assert.deepEqual([state.day, state.satiety, state.hp, stocks(state, site).wood], Object.values(now));
    assert.equal(view(state).groundLoot.wood ?? 0, completed * loot.wood);
    deny(state, 'beginGather', { index });
    deny(state, 'choose', { index });
    deny(state, 'take', { id: 'wood' });
    deny(state, 'leave');
    deny(state, 'travel', { id: 'village' });

    assert.deepEqual(play(state, 'finishGather').gathered, { wood: loot.wood });
    assert.equal(state.gathering, null);
    assert.equal(view(state).currentEvent.id, site);
    assert.equal(view(state).groundLoot.wood, (completed + 1) * loot.wood);
    assert.equal(state.inventory.wood, undefined);
    assert.equal(stocks(state, site).wood, start.stock - (completed + 1) * loot.wood);
    assert.equal(state.day, start.day + (completed + 1) * days);
    assert.equal(state.satiety, start.satiety - (completed + 1) * days * rules.satietyDrainPerDay);
    deny(state, 'finishGather');
  }
  assert.equal(view(state).visibleChoices.find((row) => row.index === index).available, false);
  deny(state, 'beginGather', { index });
});

test('emptying the bank leaves deep reeds intact and cuts land only when work finishes', () => {
  const site = 'reed_banks';
  const state = enterMarsh(site);
  const started = { ...stocks(state, site) };
  assert.deepEqual(started, { reed: 2, reed_deep: 3 });

  play(state, 'beginGather', { index: 0 });
  assert.deepEqual(play(state, 'finishGather').gathered, { reed: 2 });
  assert.deepEqual(stocks(state, site), { reed: 0, reed_deep: started.reed_deep });
  const deep = view(state).visibleChoices.find(({ index }) => index === 1);
  assert.equal(deep.available, true);
  assert.doesNotMatch(`${deep.label} ${deep.desc}`, /划伤|蚌壳|受伤/);
  const hp = state.hp;
  play(state, 'beginGather', { index: 1 });
  assert.equal(state.hp, hp);
  const gathered = play(state, 'finishGather');
  assert.deepEqual(gathered.gathered, { reed: 3 });
  assert.equal(gathered.injury.amount, 4);
  assert.match(gathered.injury.cause, /蚌壳/);
  assert.equal(state.hp, hp - 4);
  assert.deepEqual(stocks(state, site), { reed: 0, reed_deep: 0 });
  assert.equal(view(state).groundLoot.reed, 5);
  assert.equal(view(state).currentEvent.id, site);
});

test('uncarried harvest remains at the exact gathering site and a full bag takes only what fits', () => {
  const site = 'reed_banks';
  const state = enterMarsh(site);
  play(state, 'beginGather', { index: 0 });
  play(state, 'finishGather');
  play(state, 'leave');
  const elsewhere = 'mud_track';
  assert.deepEqual(view(state).groundLoot, {});
  play(state, 'visit', { id: elsewhere });
  assert.deepEqual(view(state).groundLoot, {});
  deny(state, 'take', { id: 'reed' });
  play(state, 'leave');
  play(state, 'visit', { id: site });
  assert.deepEqual(view(state).groundLoot, { reed: 2 });

  state.inventory.ration = (rules.backpackCapacity - 1) * rules.backpackStackSize;
  state.inventory.reed = rules.backpackStackSize - 1;
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, rules.backpackStackSize);
  assert.deepEqual(view(state).groundLoot, { reed: 1 });
  assert.equal(view(state).currentEvent.id, site);
  deny(state, 'take', { id: 'reed' });
});

test('one click retrieves one kind of remains from the fight site', () => {
  const site = 'mud_track';
  const state = enterMarsh(site);
  play(state, 'choose', { index: 0 });
  assert.equal(view(state).currentEnemy.id, 'mud_beast');
  for (let round = 0; state.combat && round < 24; round++) {
    play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.equal(view(state).currentEvent.id, site);
  assert.deepEqual(view(state).groundLoot, { beast_meat: 2, hide: 2, qi_core: 1 });
  play(state, 'take', { id: 'hide' });
  assert.equal(state.inventory.hide, 2);
  assert.equal(state.inventory.beast_meat, undefined);
  assert.deepEqual(view(state).groundLoot, { beast_meat: 2, qi_core: 1 });

  play(state, 'leave');
  play(state, 'visit', { id: 'reed_banks' });
  assert.deepEqual(view(state).groundLoot, {});
  deny(state, 'take', { id: 'qi_core' });
  play(state, 'leave');
  play(state, 'visit', { id: site });
  play(state, 'take', { id: 'qi_core' });
  assert.equal(state.inventory.qi_core, 1);
  assert.deepEqual(view(state).groundLoot, { beast_meat: 2 });
});

test('a timed harvest can be interrupted without moving stock into the pickup pile', () => {
  const state = createGame(0);
  state.discovered.push('ford');
  play(state, 'travel', { id: 'ford' });
  const site = 'low_tide';
  play(state, 'visit', { id: site });
  const stock = stocks(state, site).core_silt;
  const startDay = state.day;
  play(state, 'beginGather', { index: 2 });
  assert.equal(state.combat, null);
  assert.equal(stocks(state, site).core_silt, stock);
  const interrupted = play(state, 'finishGather');
  assert.equal(state.gathering, null);
  assert.equal(interrupted.ambush, 'rope_eel');
  assert.equal(interrupted.gathered, undefined);
  assert.equal(state.day, startDay + rules.harvestEncounterDays);
  assert.equal(view(state).currentEnemy.id, 'rope_eel');
  assert.equal(stocks(state, site).core_silt, stock);
  assert.equal(view(state).groundLoot.core, undefined);
});

test('a fall during collection leaves the material where it was gathered', () => {
  const site = 'reed_banks';
  const state = enterMarsh(site);
  state.hp = 4;
  play(state, 'beginGather', { index: 1 });
  assert.equal(state.hp, 4);
  const result = play(state, 'finishGather');
  assert.equal(result.injury.amount, 4);
  assert.equal(view(state).mode, 'village');
  assert.equal(state.gathering, null);
  assert.deepEqual(view(state).groundLoot, {});
  assert.equal(state.inventory.reed, undefined);

  play(state, 'eat', { id: 'ration' });
  play(state, 'travel', { id: 'marsh' });
  assert.deepEqual(view(state).groundLoot, {});
  play(state, 'visit', { id: site });
  assert.deepEqual(view(state).groundLoot, { reed: 3 });
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, 3);
});
