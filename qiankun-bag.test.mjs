import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { economyAction, economyData } from './economy.mjs';
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

function equippedBag() {
  const state = createGame(331);
  state.knownItems.push('qiankun_pattern', 'qiankun_fold_pattern');
  state.economy.warehouse = { hide: 22, black_iron: 8, core: 12, foundation_core: 2 };
  state.coins = 180;
  play(state, 'econCraftBag', { id: bagId });
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
  const state = equippedBag();
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

test('putting all ordinary food in a bag leaves the full meal pouch and relief food on hand', () => {
  const state = equippedBag();
  const slotSize = rules.backpackStackSize;
  state.satiety = 1;
  play(state, 'eat', { id: 'ration' });
  play(state, 'eat', { id: 'ration' });
  play(state, 'eat', { id: 'ration' });
  play(state, 'rest');
  assert.equal(state.reliefRations, 3);
  state.ground.village = { ration: 2 * slotSize - 3 };
  play(state, 'take', { id: 'ration' });
  assert.equal(view(state).packedMeal.count, slotSize);
  assert.equal(bag(state).carried.find(({ id }) => id === 'ration').maximum, slotSize);

  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: slotSize + 1 });
  put(state, 'ration');
  assert.equal(view(state).packedMeal.count, slotSize);
  assert.equal(state.inventory.ration, slotSize);
  assert.equal(state.reliefRations, 3);
  assert.equal(heldInside(state, 'ration'), slotSize);
  assert.equal(bag(state).carried.some(({ id }) => id === 'ration'), false);
  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: 'all' });

  play(state, 'setMealPouch', { id: 'none' });
  put(state, 'ration');
  assert.equal(heldInside(state, 'ration'), 2 * slotSize - 3);
  assert.equal(state.inventory.ration, 3);
  assert.equal(state.reliefRations, 3);
  deny(state, 'sell', { id: 'ration', count: 1 });
  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: 'all' });
});

test('the bag quote and action both stop at room in an existing dry food stack', () => {
  const state = equippedBag();
  const slotSize = rules.backpackStackSize;
  state.economy.containers[bagId].items = { wood: (bag(state).capacity - 1) * slotSize, ration: slotSize - 2 };
  state.ground.village = { ration: slotSize + 5 };
  play(state, 'take', { id: 'ration' });
  const quote = bag(state).carried.find(({ id }) => id === 'ration');
  assert.equal(quote.count, 8);
  assert.equal(quote.maximum, 2);
  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: 3 });
  put(state, 'ration');
  assert.equal(heldInside(state, 'ration'), slotSize);
  assert.equal(view(state).packedMeal.count, slotSize);
  assert.equal(state.inventory.ration, slotSize + 6);
  assert.equal(bag(state).carried.find(({ id }) => id === 'ration').maximum, 0);
  deny(state, 'econBagDeposit', { bagId, id: 'ration', count: 'all' });
});

test('bag storage keeps the selected food on hand without a meal pouch counter', () => {
  const state = equippedBag();
  const before = structuredClone(state);
  const kit = {
    owns: (state, id) => state.inventory[id] ?? 0,
    records: { items: { ration: { kind: 'food' } } },
    isEvidence: () => false,
    refuse: (message) => ({ ok: false, message }),
  };
  const result = economyAction(state, 'econBagDeposit', { bagId, id: 'ration', count: 'all' }, kit);
  assert.equal(result.ok, false);
  assert.match(result.message, /先把便当栏里的口粮移回行囊/);
  assert.deepEqual(state, before);
});

test('independent bags can be exchanged without sharing contents; usable items still need to be in the pack', () => {
  const state = equippedBag();
  state.inventory.wood = 3;
  state.inventory.reed = 2;
  state.knownItems.push('wood', 'reed');
  play(state, 'setMealPouch', { id: 'none' });
  put(state, 'ration');
  assert.equal(heldInside(state, 'ration'), 3);
  deny(state, 'econBagDeposit', { bagId, id: bagId, count: 1 });
  deny(state, 'econCraftBag', { id: foldId });
  deny(state, 'eat', { id: 'ration' });
  play(state, 'econDeposit', { id: bagId, count: 1 });
  play(state, 'econCraftBag', { id: foldId });
  put(state, 'wood', 'all', foldId);
  assert.equal(heldInside(state, 'ration', foldId), 0);
  assert.equal(heldInside(state, 'wood', foldId), 3);
  assert.equal(view(state).backpackCapacity, 12);
  assert.equal(view(state).backpackUsed, 3);
  assert.match(view(state).economy.warehouse.stored.find((row) => row.id === bagId).reason, /已有一只乾坤袋/);
  deny(state, 'econWithdraw', { id: bagId, count: 1 });
  deny(state, 'sell', { id: 'wood' });
  deny(state, 'craft', { id: 'r_reed_bow' });

  pull(state, 'wood', 1, foldId);
  play(state, 'craft', { id: 'r_reed_bow' });
  assert.equal(state.inventory.reed_bow, 1);
  assert.equal(heldInside(state, 'wood', foldId), 2);

  play(state, 'econDeposit', { id: foldId, count: 1 });
  play(state, 'econWithdraw', { id: bagId, count: 1 });
  assert.equal(heldInside(state, 'wood'), 0);
  pull(state, 'ration', 1);
  play(state, 'eat', { id: 'ration' });
  assert.equal(heldInside(state, 'ration'), 2);
});

test('ground pickups enforce the shared single-bag limit while leaving the other bag on the ground', () => {
  const state = equippedBag();
  play(state, 'setMealPouch', { id: 'none' });
  put(state, 'ration');
  play(state, 'discard', { id: bagId, count: 1 });
  play(state, 'econCraftBag', { id: foldId });
  assert.equal(view(state).groundPickup[bagId], 0);
  assert.match(view(state).groundPickupReasons[bagId], /已有一只乾坤袋/);
  deny(state, 'take', { id: bagId });
  assert.equal(state.ground.village[bagId], 1);

  play(state, 'discard', { id: foldId, count: 1 });
  assert.equal(view(state).groundPickup[bagId], 1);
  play(state, 'take', { id: bagId });
  assert.equal(heldInside(state, 'ration'), 3);
  deny(state, 'take', { id: foldId, count: 1 });
  assert.equal(state.ground.village[foldId], 1);
});

test('the tailor can move a carried bag into a new one and store the old bag without losing wear', () => {
  const state = equippedBag();
  state.inventory.reed_bow = 1;
  state.durability.reed_bow = 4;
  put(state, 'reed_bow');
  play(state, 'setMealPouch', { id: 'none' });
  put(state, 'ration');
  const offer = view(state).economy.containerPlans.find((plan) => plan.id === foldId);
  assert.equal(offer.replacement.used, 2);
  assert.equal(offer.replacement.reason, '');
  const money = state.coins;
  state.coins = 1;
  deny(state, 'econReplaceBag', { id: foldId });
  state.coins = money;
  play(state, 'econReplaceBag', { id: foldId });
  assert.equal(state.coins, money - offer.cost);
  assert.equal(state.inventory[bagId], undefined);
  assert.equal(state.economy.warehouse[bagId], 1);
  assert.deepEqual(state.economy.containers[bagId].items, {});
  assert.equal(heldInside(state, 'ration', foldId), 3);
  assert.equal(heldInside(state, 'reed_bow', foldId), 1);
  pull(state, 'reed_bow', 1, foldId);
  assert.equal(state.durability.reed_bow, 4);
  deny(state, 'econReplaceBag', { id: foldId });
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
  const state = equippedBag();
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
  state.economy.warehouse = { hide: warehouseCapacity * economyData.warehouseStack };
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
  const state = equippedBag();
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
  const state = equippedBag();
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
  const state = equippedBag();
  state.inventory.knife = 1;
  state.durability.knife = 17;
  put(state, 'knife');
  state.region = 'ridge';
  state.discovered.push('ridge', 'screen_slope');
  state.resolvedBandits.push('road_slate_peg');
  state.roadSeed = 1972;
  assert.equal(play(state, 'travel', { id: 'screen_slope' }).roadInterrupted, true);
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
  const state = equippedBag();
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
