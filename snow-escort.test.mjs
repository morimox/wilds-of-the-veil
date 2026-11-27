import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function traveler() {
  const state = createGame(21);
  state.region = 'snow_pass';
  state.discovered.push('snow_pass');
  state.realm = 2;
  state.inventory.ration = 8;
  state.inventory.wood = 6;
  state.inventory.salve = 5;
  for (const id of ['weir_knife', 'iron_coat', 'tide_charm', 'hide_shield']) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
    play(state, 'equip', { id });
  }
  return state;
}

const visit = (state, id) => play(state, 'visit', { id });
const choose = (state, index) => play(state, 'choose', { index });
const option = (state, index) => view(state).visibleChoices.find((entry) => entry.index === index);
const leave = (state) => state.event && play(state, 'leave');

test('a hungry traveler can enter the fire shed and buy its reserved meal', () => {
  const state = traveler();
  state.satiety = 0;
  state.coins = 3;
  delete state.inventory.ration;
  assert.equal(view(state).sites.find(({ id }) => id === 'snow_fire').canEnter, true);
  assert.equal(view(state).sites.find(({ id }) => id === 'silk_bough').canEnter, false);
  assert.equal(act(state, 'visit', { id: 'silk_bough' }).ok, false);

  visit(state, 'snow_fire');
  choose(state, 3);
  assert.equal(option(state, 6).lockedReason, '还差6灵钱（共需9枚）。');
  state.coins = 9;
  assert.equal(option(state, 6).available, true);
  choose(state, 6);
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.ration, 3);
  assert.equal(state.satiety, 0);
  play(state, 'eat', { id: 'ration' });
  assert.ok(state.satiety > 0);
  assert.equal(option(state, 6), undefined);
});

function fight(state, index) {
  if (state.satiety < 58) play(state, 'eat', { id: 'ration' });
  choose(state, index);
  let rounds = 0;
  while (state.combat && rounds < 18) {
    const { intent, maxHp } = view(state);
    if (state.hp < maxHp * 0.45 && state.inventory.salve && ['guard', 'heavy', undefined].includes(intent?.kind)) {
      play(state, 'use', { id: 'salve' });
    } else if (intent?.kind === 'heavy') {
      play(state, 'guard');
    } else {
      play(state, 'attack');
    }
    rounds++;
  }
  assert.ok(state.event && !state.combat, 'victory returned to the same site');
  return rounds;
}

function heatAtShed(state) {
  leave(state);
  for (let count = 0; count < 3; count++) {
    if (state.satiety < 50) play(state, 'eat', { id: 'ration' });
    visit(state, 'snow_fire');
    choose(state, 1);
    leave(state);
  }
}

test('five fights can secure the snow road without leather, and an unfinished fight still blocks the ladder', (t) => {
  const state = traveler();
  assert.ok(!view(state).sites.some(({ id }) => id === 'snow_ladder'));
  visit(state, 'snow_fire');
  assert.equal(option(state, 0).available, false);
  choose(state, 3);
  leave(state);
  heatAtShed(state);
  visit(state, 'snow_ladder');
  assert.match(option(state, 2).lockedReason, /3 只/);

  let rounds = fight(state, 0);
  assert.match(option(state, 2).lockedReason, /2 只/);
  const beforeHawk = state.practice[2];
  const alreadyPracticed = state.practicedOn[2];
  rounds += fight(state, 1);
  const dailyPoint = alreadyPracticed === Math.floor(state.day) ? 0 : rules.practicePerDay;
  assert.equal(state.practice[2] - beforeHawk, dailyPoint + rules.worthyFightPractice);
  leave(state);
  heatAtShed(state);
  visit(state, 'snow_ladder');
  assert.match(option(state, 2).lockedReason, /1 只/);
  rounds += fight(state, 0);
  assert.equal(option(state, 2).available, true);
  choose(state, 2);
  leave(state);
  visit(state, 'snow_beam');
  assert.equal(option(state, 1).available, false);
  rounds += fight(state, 0);
  rounds += fight(state, 1);
  const freeSlots = view(state).backpackCapacity - view(state).backpackUsed;
  state.inventory.wood = (state.inventory.wood ?? 0) + freeSlots * rules.backpackStackSize;
  assert.equal(view(state).backpackCapacity, view(state).backpackUsed);
  const coins = state.coins;
  const salves = state.inventory.salve ?? 0;
  choose(state, 2);
  assert.equal(state.coins - coins, 30);
  assert.equal(state.inventory.snow_escort_done, 1);
  assert.equal((state.inventory.salve ?? 0) + (view(state).groundLoot.salve ?? 0), salves + 2);
  assert.ok(!state.inventory.sky_cord);
  leave(state);
  visit(state, 'snow_fire');
  assert.equal(option(state, 4).available, true);
  choose(state, 4);
  assert.equal(state.inventory.sky_cord, 1);
  assert.ok(state.discovered.includes('sky_terrace'));
  leave(state);
  visit(state, 'snow_fire');
  assert.match(option(state, 0).lockedReason, /教给你/);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  t.diagnostic(`雪关修栈：5 场 ${rounds} 回合，30 灵钱，一次交付开启天衡石台。`);
});

test('the original material route can be used even after talking with the rope carrier', () => {
  const state = traveler();
  state.inventory.hide = 6;
  state.inventory.reed = 5;
  visit(state, 'snow_fire');
  choose(state, 3);
  leave(state);
  visit(state, 'snow_fire');
  choose(state, 0);
  assert.equal(state.inventory.sky_cord, 1);
  assert.ok(state.discovered.includes('sky_terrace'));
  assert.ok(view(state).sites.some(({ id }) => id === 'snow_ladder'));
  leave(state);
  // A later expedition can still deliver its rubbing, with the route token already granted.
  state.inventory.snow_escort_done = 1;
  visit(state, 'snow_fire');
  assert.equal(option(state, 4), undefined);
  choose(state, 5);
  assert.equal(state.inventory.sky_cord, 1);
  assert.ok(!state.inventory.snow_escort_done);
});
