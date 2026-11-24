import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, rules, view } from './engine.mjs';

const cap = rules.backpackCapacity;
const stack = rules.backpackStackSize;

test('swapping to a two-handed bow accounts for both returned items before committing', () => {
  const state = createGame(42);
  state.inventory = { cudgel: 1, hide_shield: 1, reed_bow: 1, wood: (cap - 2) * stack };
  state.equipment.weapon = 'cudgel';
  state.equipment.offhand = 'hide_shield';
  state.durability.hide_shield = 12;
  state.durability.reed_bow = 9;
  assert.equal(view(state).backpackUsed, cap);
  const before = structuredClone(state);
  assert.match(act(state, 'equip', { id: 'reed_bow' }).message, /行囊已满/);
  assert.deepEqual(state, before);

  assert.ok(act(state, 'discard', { id: 'wood', count: stack }).ok);
  assert.ok(act(state, 'equip', { id: 'reed_bow' }).ok);
  assert.equal(state.equipment.weapon, 'reed_bow');
  assert.equal(state.equipment.offhand, null);
  assert.equal(state.inventory.hide_shield, 1);
  assert.equal(state.durability.hide_shield, 12);
  assert.equal(view(state).backpackUsed, cap);
});

test('currency uses one slot at any amount and cannot be picked up into a full empty purse', () => {
  const state = createGame(42);
  state.coins = 0;
  state.inventory = { wood: cap * stack };
  state.ground.village = { spirit_coin: 1400 };
  assert.equal(view(state).backpackUsed, cap);
  assert.match(act(state, 'take', { id: 'spirit_coin' }).message, /行囊已满/);
  assert.equal(state.ground.village.spirit_coin, 1400);
  assert.ok(act(state, 'discard', { id: 'wood', count: stack }).ok);
  assert.ok(act(state, 'take', { id: 'spirit_coin' }).ok);
  assert.equal(view(state).inventory.spirit_coin, 1400);
  assert.equal(view(state).backpackUsed, cap);
  state.ground.village.spirit_coin = 27;
  assert.ok(act(state, 'take', { id: 'spirit_coin' }).ok);
  assert.equal(state.coins, 1427);
  assert.equal(view(state).backpackUsed, cap);
  assert.ok(act(state, 'discard', { id: 'spirit_coin' }).ok);
  assert.equal(view(state).backpackUsed, cap - 1);
});

test('paying out the entire purse frees room for a newly bought item', () => {
  const state = createGame(43);
  state.coins = 3;
  state.inventory = { ore: (cap - 1) * stack, ration: undefined };
  assert.equal(view(state).backpackUsed, cap);
  const result = act(state, 'buy', { id: 'wood' });
  assert.ok(result.ok, result.message);
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.wood, 1);
  assert.equal(view(state).backpackUsed, cap);
});

test('one packed meal type feeds the quick action and food cannot be taken during combat', () => {
  const state = createGame(42);
  state.inventory = { ration: 3, meat_broth: 2, herb_stew: 2 };
  state.satiety = 20;
  state.hp = 8;
  state.qi = 0;
  const count = view(state).backpackUsed;
  assert.ok(act(state, 'setMealPouch', { id: 'herb_stew' }).ok);
  assert.deepEqual(view(state).packedMeal, { id: 'herb_stew', count: 2 });
  assert.equal(view(state).backpackUsed, count);
  const meal = act(state, 'eat');
  assert.equal(meal.ok, true);
  assert.equal(state.inventory.ration, 3);
  assert.equal(state.inventory.herb_stew, 1);
  assert.match(meal.message, /真气\+13/);
  assert.equal(state.hp, 22);
  assert.equal(state.satiety, 76);

  assert.ok(act(state, 'travel', { id: 'marsh' }).ok);
  assert.ok(act(state, 'visit', { id: 'mud_track' }).ok);
  assert.ok(act(state, 'choose', { index: 0 }).ok);
  const foodBefore = state.inventory.herb_stew;
  const roundBefore = state.combat.round;
  assert.match(act(state, 'eat').message, /交手中只能用药/);
  assert.match(act(state, 'use', { id: 'herb_stew' }).message, /交手中只能用药/);
  assert.equal(state.inventory.herb_stew, foodBefore);
  assert.equal(state.combat.round, roundBefore);
});
