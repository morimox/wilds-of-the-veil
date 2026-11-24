import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function deny(state, action, payload) {
  const before = structuredClone(state);
  assert.equal(act(state, action, payload).ok, false);
  assert.deepEqual(state, before);
}

test('the leatherworker sews side pockets and makes a separate patterned bag, charging each job once', () => {
  const state = createGame(214);
  assert.equal(view(state).backpackCapacity, 12);
  assert.equal(view(state).economy.backpack, null);
  deny(state, 'econExpandPack', { id: 16 });

  // A drop on the ground is discovered only after the player actually picks it up.
  state.ground.marsh = { hide: 16 };
  play(state, 'travel', { id: 'marsh' });
  play(state, 'take', { id: 'hide' });
  deny(state, 'econExpandPack', { id: 16 });
  play(state, 'travel', { id: 'village' });

  let offer = view(state).economy.backpack.upgrade;
  assert.equal(offer.capacity, 16);
  assert.match(offer.reason, /松木/);
  deny(state, 'econExpandPack', { id: 16 });
  state.economy.warehouse.wood = 4;
  const day = state.day;
  const money = state.coins;
  play(state, 'econExpandPack', { id: '16' });
  assert.equal(state.day, day + 0.5);
  assert.equal(state.coins, money - 12);
  assert.equal(state.inventory.hide, 10);
  assert.equal(state.economy.warehouse.wood, undefined);
  assert.equal(view(state).backpackCapacity, 16);
  assert.equal(view(state).economy.backpack.upgrade, null);
  deny(state, 'econExpandPack', { id: 28 });
  deny(state, 'econCraftBag', { id: 'qiankun_bag' });

  state.ground.village = { black_iron: 3, core: 4, qiankun_pattern: 1 };
  play(state, 'take', { id: 'black_iron' });
  assert.equal(view(state).economy.backpack.upgrade, null);
  play(state, 'take', { id: 'core' });
  play(state, 'take', { id: 'qiankun_pattern' });
  const bag = view(state).economy.containerPlans.find(({ id }) => id === 'qiankun_bag');
  assert.equal(bag.capacity, 16);
  assert.match(bag.reason, /28枚灵钱/);
  deny(state, 'econCraftBag', { id: 'qiankun_bag' });
  state.coins = 30;
  deny(state, 'econExpandPack', { id: 16 });
  play(state, 'econCraftBag', { id: 'qiankun_bag' });
  assert.equal(view(state).backpackCapacity, 16);
  assert.equal(view(state).backpackName, '加缝侧袋的行囊');
  assert.equal(state.inventory.qiankun_bag, 1);
  const owned = view(state).economy.containers.find(({ id }) => id === 'qiankun_bag');
  assert.equal(owned.capacity, 16);
  assert.equal(owned.used, 0);
  assert.equal(view(state).economy.backpack.upgrade, null);
  assert.equal(state.day, day + 1.5);
  assert.equal(state.coins, 2);
  assert.equal(state.inventory.hide, undefined);
  assert.equal(state.inventory.black_iron, undefined);
  assert.equal(state.inventory.core, undefined);
  assert.equal(state.inventory.qiankun_pattern, 1);
  assert.equal(state.realm, 0);
  deny(state, 'econCraftBag', { id: 'qiankun_bag' });
});

test('separately known patterns can be crafted in any order and every bag takes its own pack slot', () => {
  const state = createGame(216);
  assert.equal(view(state).backpackCapacity, 12);
  state.ground.village = { qiankun_pattern: 1, qiankun_fold_pattern: 1, qiankun_inner_pattern: 1 };
  for (const id of Object.keys(state.ground.village)) play(state, 'take', { id });
  assert.equal(view(state).backpackUsed, 1);
  const offers = view(state).economy.containerPlans;
  assert.deepEqual(offers.map(({ capacity }) => capacity), [16, 28, 44]);
  state.economy.warehouse = { hide: 38, black_iron: 16, core: 24, foundation_core: 2, gold_core: 2 };
  state.coins = 160;
  const bagIds = ['qiankun_fold_bag', 'qiankun_bag', 'qiankun_deep_bag'];
  for (const [index, id] of bagIds.entries()) {
    play(state, 'econCraftBag', { id });
    assert.equal(state.inventory[id], 1);
    assert.equal(view(state).backpackCapacity, 12);
    assert.equal(view(state).backpackUsed, index + 2);
    deny(state, 'econCraftBag', { id });
  }
  assert.equal(view(state).backpackName, '行囊');
  assert.deepEqual(view(state).economy.containers.map(({ capacity }) => capacity).sort((a, b) => a - b), [16, 28, 44]);
  assert.deepEqual(state.economy.warehouse, {});
  assert.equal(state.coins, 14);
  assert.equal(state.day, 7);
});

test('expanding a full backpack takes effect on pickups, unequipping and buying', () => {
  const state = createGame(215);
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  state.economy.warehouse = { hide: 6, wood: 4 };
  state.ground.village = { reed: 41 };
  state.coins = 50;
  deny(state, 'take', { id: 'reed' });
  deny(state, 'unequip', { slot: 'weapon' });
  deny(state, 'buy', { id: 'wood' });

  play(state, 'econExpandPack', { id: 16 });
  assert.equal(view(state).backpackUsed, 12);
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, 41);
  assert.equal(view(state).backpackUsed, 15);
  play(state, 'unequip', { slot: 'weapon' });
  assert.equal(view(state).backpackUsed, 16);
  deny(state, 'buy', { id: 'wood' });
  play(state, 'equip', { id: 'cudgel' });
  play(state, 'buy', { id: 'wood' });
  assert.equal(view(state).backpackUsed, 16);
});
