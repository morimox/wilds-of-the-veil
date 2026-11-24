import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { economyData } from './economy.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const bagId = 'qiankun_bag';
const foldId = 'qiankun_fold_bag';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function deny(state, action, payload = {}) {
  const before = structuredClone(state);
  const result = act(state, action, payload);
  assert.equal(result.ok, false, `${action}: ${result.message}`);
  assert.deepEqual(state, before);
}

function equippedBags({ fold = false } = {}) {
  const state = createGame(331);
  state.knownItems.push('qiankun_pattern', 'qiankun_fold_pattern');
  state.economy.warehouse = { hide: 22, black_iron: 8, core: 12, foundation_core: 2 };
  state.coins = 180;
  play(state, 'econCraftBag', { id: bagId });
  if (fold) play(state, 'econCraftBag', { id: foldId });
  return state;
}

function bag(state, id = bagId) {
  return view(state).economy.containers.find((item) => item.id === id);
}

function heldInside(state, id, container = bagId) {
  return bag(state, container)?.stored.find((item) => item.id === id)?.count ?? 0;
}

function put(state, id, count = 'all', container = bagId) {
  return play(state, 'econBagDeposit', { bagId: container, id, count });
}

function pull(state, id, count = 'all', container = bagId) {
  return play(state, 'econBagWithdraw', { bagId: container, id, count });
}

function fillMainWithRations(state) {
  const pack = view(state);
  const currentlyUsed = Math.ceil((state.inventory.ration ?? 0) / rules.backpackStackSize);
  state.inventory.ration = (pack.backpackCapacity - pack.backpackUsed + currentlyUsed) * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, pack.backpackCapacity);
}

test('the extra bag holds separate stacks, trims an all-transfer, and rejects an exact overflow', () => {
  const state = equippedBags();
  const capacity = bag(state).capacity;
  const slotSize = rules.backpackStackSize;
  assert.equal(view(state).backpackCapacity, 12);
  assert.equal(view(state).backpackUsed, 2);
  assert.equal(capacity, 16);
  assert.equal(bag(state).used, 0);

  state.ground.village = { wood: 10 * slotSize };
  play(state, 'take', { id: 'wood' });
  put(state, 'wood');
  assert.equal(heldInside(state, 'wood'), 10 * slotSize);
  assert.equal(view(state).backpackUsed, 2);

  const remaining = (capacity - 10) * slotSize;
  state.ground.village = { wood: remaining + 1 };
  play(state, 'take', { id: 'wood' });
  deny(state, 'econBagDeposit', { bagId, id: 'wood', count: remaining + 1 });
  put(state, 'wood');
  assert.equal(state.inventory.wood, 1);
  assert.equal(bag(state).used, capacity);
  assert.equal(heldInside(state, 'wood'), capacity * slotSize);
  deny(state, 'econBagDeposit', { bagId, id: 'wood', count: 'all' });

  state.ground.village = { wood: slotSize - 2 };
  play(state, 'take', { id: 'wood' });
  fillMainWithRations(state);
  deny(state, 'econBagWithdraw', { bagId, id: 'wood', count: 2 });
  pull(state, 'wood');
  assert.equal(state.inventory.wood, slotSize);
  assert.equal(heldInside(state, 'wood'), capacity * slotSize - 1);
  deny(state, 'econBagWithdraw', { bagId, id: 'wood', count: 'all' });
});

test('two actual bags stay independent and use, trading, and making still need items in hand', () => {
  const state = equippedBags({ fold: true });
  state.inventory.wood = 3;
  state.inventory.reed = 2;
  state.knownItems.push('wood', 'reed');
  put(state, 'ration');
  put(state, 'wood', 'all', foldId);
  assert.equal(heldInside(state, 'ration'), 3);
  assert.equal(heldInside(state, 'ration', foldId), 0);
  assert.equal(heldInside(state, 'wood'), 0);
  assert.equal(heldInside(state, 'wood', foldId), 3);
  assert.equal(view(state).backpackCapacity, 12);
  assert.equal(view(state).backpackUsed, 3);
  deny(state, 'econBagDeposit', { bagId, id: foldId, count: 1 });
  deny(state, 'econBagDeposit', { bagId, id: bagId, count: 1 });
  deny(state, 'eat', { id: 'ration' });
  deny(state, 'sell', { id: 'wood' });
  deny(state, 'craft', { id: 'r_reed_bow' });

  pull(state, 'ration', 1);
  play(state, 'eat', { id: 'ration' });
  assert.equal(heldInside(state, 'ration'), 2);
  pull(state, 'wood', 1, foldId);
  play(state, 'craft', { id: 'r_reed_bow' });
  assert.equal(state.inventory.reed_bow, 1);
  assert.equal(heldInside(state, 'wood', foldId), 2);
});

test('making a bag in a full pack requires the carried materials to free a slot', () => {
  const state = createGame(335);
  state.knownItems.push('qiankun_pattern');
  state.economy.warehouse = { hide: 10, black_iron: 3, core: 4 };
  state.coins = 100;
  fillMainWithRations(state);
  deny(state, 'econCraftBag', { id: bagId });

  Object.assign(state.inventory, state.economy.warehouse);
  state.economy.warehouse = {};
  fillMainWithRations(state);
  play(state, 'econCraftBag', { id: bagId });
  assert.equal(state.inventory[bagId], 1);
  assert.equal(state.inventory.hide, undefined);
  assert.equal(state.inventory.black_iron, undefined);
  assert.equal(state.inventory.core, undefined);
});

test('a bag keeps its contents through warehouse and ground storage and reserves its equipped-kind items', () => {
  const state = equippedBags({ fold: true });
  state.inventory.qiankun_pattern = 1;
  state.reliefRations = state.inventory.ration;
  deny(state, 'econBagDeposit', { bagId, id: 'cudgel', count: 1 });
  deny(state, 'econBagDeposit', { bagId, id: 'qiankun_pattern', count: 1 });
  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: 'all' });

  state.inventory.knife = 1;
  state.durability.knife = 17;
  put(state, 'knife');
  assert.equal(heldInside(state, 'knife'), 1);
  assert.equal(state.inventory.knife, undefined);
  deny(state, 'equip', { id: 'knife' });
  state.ground.village = { knife: 1 };
  deny(state, 'take', { id: 'knife' });
  deny(state, 'buy', { id: 'knife' });

  const warehouseCapacity = view(state).economy.warehouse.capacity;
  state.economy.warehouse.hide = warehouseCapacity * economyData.warehouseStack;
  deny(state, 'econDeposit', { id: bagId, count: 1 });
  state.economy.warehouse.hide -= economyData.warehouseStack;
  play(state, 'econDeposit', { id: bagId, count: 1 });
  assert.equal(view(state).economy.warehouse.used, warehouseCapacity);
  assert.equal(state.economy.warehouse[bagId], 1);
  assert.equal(bag(state), undefined);
  deny(state, 'econBagWithdraw', { bagId, id: 'knife', count: 1 });
  deny(state, 'econCraftBag', { id: bagId });
  deny(state, 'take', { id: 'knife' });
  play(state, 'econWithdraw', { id: bagId, count: 1 });
  assert.equal(heldInside(state, 'knife'), 1);

  play(state, 'discard', { id: bagId, count: 1 });
  assert.equal(view(state).groundLoot[bagId], 1);
  assert.equal(bag(state), undefined);
  deny(state, 'econCraftBag', { id: bagId });
  deny(state, 'take', { id: 'knife' });
  play(state, 'take', { id: bagId });
  pull(state, 'knife');
  assert.equal(state.inventory.knife, 1);
  assert.equal(state.durability.knife, 17);
  assert.equal(bag(state).used, 0);
});

test('carried bag storage works in the field and stays closed while gathering or fighting', () => {
  const state = equippedBags();
  state.inventory.wood = 2;
  put(state, 'wood', 1);
  play(state, 'travel', { id: 'marsh' });
  deny(state, 'econCraftBag', { id: foldId });
  play(state, 'visit', { id: 'reed_banks' });
  put(state, 'wood');
  assert.equal(heldInside(state, 'wood'), 2);
  pull(state, 'wood', 1);
  play(state, 'beginGather', { index: 0 });
  deny(state, 'econBagWithdraw', { bagId, id: 'wood', count: 1 });
  deny(state, 'econBagDeposit', { bagId, id: 'wood', count: 1 });
  play(state, 'finishGather');
  put(state, 'wood');
  play(state, 'leave');

  play(state, 'discard', { id: bagId, count: 1 });
  play(state, 'take', { id: bagId });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  deny(state, 'econBagWithdraw', { bagId, id: 'wood', count: 1 });
  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: 1 });

  const beast = data.enemies.find(({ id }) => id === state.combat.id);
  state.combat.plan = { round: 0, reader: null, intent: beast.intents.find(({ kind }) => kind === 'attack') };
  state.hp = 1;
  play(state, 'attack');
  assert.equal(state.region, 'village');
  assert.equal(state.inventory[bagId], 1);
  assert.equal(heldInside(state, 'wood'), 2);
});

test('a trophy protected from falling can still be moved out of the pack', () => {
  const state = equippedBags();
  const id = 'gully_king_blade';
  state.ground.village = { [id]: 1 };
  play(state, 'take', { id });
  put(state, id);
  assert.equal(heldInside(state, id), 1);
  pull(state, id);
  play(state, 'econDeposit', { id, count: 1 });
  assert.equal(state.economy.warehouse[id], 1);
  assert.equal(state.inventory[id], undefined);
});

test('bandit robbery strips ordinary carried gear and leaves the bag and its contents intact', () => {
  const state = equippedBags();
  state.inventory.knife = 1;
  state.durability.knife = 17;
  put(state, 'knife');
  play(state, 'travel', { id: 'marsh' });
  state.discovered.push('ridge');
  state.resolvedBandits.push('road_slate_peg');
  state.roadSeed = 1972;
  assert.equal(play(state, 'travel', { id: 'ridge' }).roadInterrupted, true);
  play(state, 'banditFight');
  const foe = data.enemies.find(({ id }) => id === state.combat.id);
  state.combat.plan = { round: 0, reader: null, intent: foe.intents.find(({ kind }) => kind === 'attack') };
  state.banditLossSeed = 1500;
  state.hp = 1;
  play(state, 'attack');
  assert.equal(state.region, 'village');
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.cudgel, undefined);
  assert.equal(state.inventory[bagId], 1);
  assert.equal(heldInside(state, 'knife'), 1);
  pull(state, 'knife');
  assert.equal(state.durability.knife, 17);
});

test('an active manual has to stop before storage, and repacking preserves the learned rank', () => {
  const state = equippedBags();
  const manual = 'eaves_breath_manual';
  state.realm = 3;
  state.inventory[manual] = 1;
  state.manualRanks[manual] = 2;
  play(state, 'equipManual', { id: manual });
  deny(state, 'econBagDeposit', { bagId, id: manual, count: 1 });
  play(state, 'unequipManual');
  put(state, manual);
  assert.equal(heldInside(state, manual), 1);
  assert.equal(view(state).innerStyle, null);
  deny(state, 'equipManual', { id: manual });
  pull(state, manual);
  play(state, 'equipManual', { id: manual });
  assert.equal(view(state).innerStyle.active.rank, 2);
});
