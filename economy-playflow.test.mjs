import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { tradeCapacityReason, tradeQuantityOptions } from './economy.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, result.message);
  return result;
}

test('a cash reward that cannot fit remains visible and collectible at the work site', () => {
  const state = createGame(815);
  state.region = 'willow_post';
  state.event = 'willow_yard';
  state.coins = 0;
  const full = rules.backpackCapacity * rules.backpackStackSize;
  state.inventory = { wood: full };
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);

  const result = play(state, 'choose', { index: 1 });
  assert.deepEqual(result.spilled, { spirit_coin: 8 });
  assert.equal(state.inventory.wood, full - 3);
  assert.equal(state.event, 'willow_yard');
  assert.equal(view(state).groundLoot.spirit_coin, 8);
  assert.equal(act(state, 'choose', { index: 1 }).ok, false);

  play(state, 'discard', { id: 'wood', count: rules.backpackStackSize });
  play(state, 'take', { id: 'spirit_coin' });
  assert.equal(state.coins, 8);
  assert.equal(view(state).groundLoot.spirit_coin, undefined);
});

test('the smith can inspect leather in the village warehouse without taking it', () => {
  const state = createGame(810);
  state.inventory.hide = 2;
  state.knownItems.push('hide');
  play(state, 'econDeposit', { id: 'hide', count: 2 });
  assert.ok(!view(state).discoveredRecipes.includes('r_hide_coat'));

  play(state, 'showHideToSmith');
  assert.ok(view(state).discoveredRecipes.includes('r_hide_coat'));
  assert.equal(state.inventory.hide, undefined);
  assert.equal(state.economy.warehouse.hide, 2);
});

test('vendor dialogue agrees with an empty stall and the actual hand-in reward', () => {
  const state = createGame(811);
  const stockedGreeting = play(state, 'merchantTalk', { id: 'staff_vendor' }).message;
  play(state, 'unequip', { slot: 'weapon' });
  play(state, 'sell', { id: 'cudgel' });
  play(state, 'buy', { id: 'cudgel' });

  const staff = view(state).market.stalls.find((entry) => entry.id === 'staff_vendor');
  const emptyGreeting = play(state, 'merchantTalk', { id: 'staff_vendor' }).message;
  assert.equal(staff.offers[0].stock, 0);
  assert.equal(emptyGreeting, staff.merchant.greeting);
  assert.ok(!emptyGreeting.includes(stockedGreeting));

  state.coins = 60;
  state.economy.warehouse = { wood: 8, ore: 4 };
  play(state, 'buy', { id: 'reed_arrow', count: 12 });
  const before = state.inventory.reed_arrow;
  const order = play(state, 'merchantOrder', { id: 'fletcher' });
  assert.match(order.message, /图样交给了你/);
  assert.equal(state.inventory.arrow_pattern, 1);
  assert.equal(state.inventory.reed_arrow, before);
});

test('village bulk sales settle both prices in one order and replenish on the shared clock', () => {
  const state = createGame(814);
  Object.assign(state.inventory, { ore: 32, core: 20 });
  const offer = (id) => view(state).market.sales.find((item) => item.id === id);
  const before = state.coins;
  assert.deepEqual(offer('ore').demand, { regular: 3, reserve: 2, remaining: 12, nextAt: null });
  const split = structuredClone(state);
  play(split, 'sell', { id: 'ore', count: 8 });
  play(split, 'localSell', { id: 'ore', count: 7 });
  const result = play(state, 'sell', { id: 'ore', count: 15 });
  assert.match(result.message, /42枚灵钱/);
  assert.equal(state.coins - before, 42);
  assert.equal(split.coins, state.coins);
  assert.deepEqual(split.economy.saleDemand, state.economy.saleDemand);
  assert.equal(offer('ore').price, 2);
  assert.equal(offer('core').demand.remaining, 10);
  const refused = structuredClone(state);
  assert.equal(act(state, 'sell', { id: 'ore', count: 18 }).ok, false);
  assert.deepEqual(state, refused);

  for (let i = 0; i < 9; i++) play(state, 'wait');
  assert.equal(offer('ore').demand.remaining, 0);
  play(state, 'wait');
  assert.equal(offer('ore').demand.remaining, 4);
  assert.equal(offer('ore').price, 3);
  const balance = state.coins;
  play(state, 'localSell', { id: 'ore', count: 9 });
  assert.equal(state.coins - balance, 22);
  assert.equal(offer('ore').demand.remaining, 0);
});

test('trading enumerates the permitted quantities even when smaller quantities cannot fit', () => {
  const state = createGame(815);
  state.coins = 9;
  delete state.inventory.wood;
  state.inventory.ore = 1;
  const { backpackCapacity, backpackUsed } = view(state);
  state.inventory.ore += (backpackCapacity - backpackUsed) * 20;
  assert.equal(view(state).backpackUsed, backpackCapacity);

  const capacityCalls = [];
  const kit = {
    currency: 'spirit_coin',
    hasRoom(current, received, spent) {
      assert.equal(current, state);
      capacityCalls.push([received, spent]);
      return Object.values(spent)[0] === 9;
    },
  };
  const allowed = tradeQuantityOptions(3, (count) => tradeCapacityReason(state, {
    id: 'wood', count, total: 3 * count, buying: true,
  }, kit));
  assert.deepEqual(allowed, [3]);
  assert.deepEqual(capacityCalls, [
    [{ wood: 1 }, { spirit_coin: 3 }],
    [{ wood: 2 }, { spirit_coin: 6 }],
    [{ wood: 3 }, { spirit_coin: 9 }],
  ]);

  const ownOffer = () => view(state).market.stalls.flatMap(({ offers }) => offers)
    .find(({ id }) => id === 'wood');
  assert.deepEqual(ownOffer().quantities, [3]);
  const beforeBuy = structuredClone(state);
  assert.equal(act(state, 'buy', { id: 'wood' }).ok, false);
  assert.deepEqual(state, beforeBuy);
  play(state, 'buy', { id: 'wood', count: 3 });
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.wood, 3);
  assert.equal(view(state).backpackUsed, backpackCapacity);

  const sale = view(state).market.sales.find(({ id }) => id === 'wood');
  assert.deepEqual(sale.quantities, [3]);
  const beforeSale = structuredClone(state);
  assert.equal(act(state, 'sell', { id: 'wood' }).ok, false);
  assert.deepEqual(state, beforeSale);
  play(state, 'sell', { id: 'wood', count: 3 });
  assert.ok(state.coins > 0);
  assert.equal(state.inventory.wood, undefined);
  assert.equal(view(state).backpackUsed, backpackCapacity);

  const inTown = structuredClone(beforeBuy);
  inTown.region = 'zhao_city';
  inTown.coins = 10;
  const townMarket = () => view(inTown).localMarket;
  assert.deepEqual(townMarket().offers.find(({ id }) => id === 'wood').quantities, [2]);
  const beforeTownBuy = structuredClone(inTown);
  assert.equal(act(inTown, 'localBuy', { id: 'wood' }).ok, false);
  assert.deepEqual(inTown, beforeTownBuy);
  play(inTown, 'localBuy', { id: 'wood', count: 2 });
  assert.equal(inTown.coins, 0);
  assert.deepEqual(townMarket().buys.find(({ id }) => id === 'wood').quantities, [2]);
  const beforeTownSale = structuredClone(inTown);
  assert.equal(act(inTown, 'localSell', { id: 'wood' }).ok, false);
  assert.deepEqual(inTown, beforeTownSale);
  play(inTown, 'localSell', { id: 'wood', count: 2 });
  assert.ok(inTown.coins > 0);
  assert.equal(inTown.inventory.wood, undefined);
  assert.equal(view(inTown).backpackUsed, backpackCapacity);
});

test('the forge names the location of an existing blade and its actual production stage', () => {
  const state = createGame(816);
  state.coins = 25;
  state.knownItems.push('ore', 'wood', 'blade_template');
  state.economy.buildings.forge = 1;
  state.inventory.iron_sword = 1;
  state.inventory.qiankun_bag = 1;
  state.economy.warehouse = { ore: 6, wood: 3 };
  const forge = () => view(state).economy.facilities.find(({ id }) => id === 'forge');
  const reason = () => forge().projects.find(({ id }) => id === 'r_iron_sword').reason;

  assert.match(reason(), /身上已有/);
  play(state, 'econDeposit', { id: 'iron_sword' });
  assert.match(reason(), /仓库里已有/);
  play(state, 'econWithdraw', { id: 'iron_sword' });
  play(state, 'econBagDeposit', { bagId: 'qiankun_bag', id: 'iron_sword' });
  assert.match(reason(), /乾坤袋里已有/);
  play(state, 'econBagWithdraw', { bagId: 'qiankun_bag', id: 'iron_sword' });
  play(state, 'discard', { id: 'iron_sword' });
  assert.equal(state.ground.village.iron_sword, 1);
  assert.equal(reason(), '');

  play(state, 'econStart', { id: 'r_iron_sword' });
  assert.match(reason(), /正在制作/);
  play(state, 'econWait', { id: 'forge' });
  assert.match(reason(), /已做完，尚未领取/);
  play(state, 'econCollect', { id: forge().jobs[0].id });
  assert.match(reason(), /身上已有/);
  assert.equal(state.inventory.iron_sword, 1);
  assert.equal(state.ground.village.iron_sword, 1);
});

test('storing a running inner manual discloses that its effects stop', () => {
  const state = createGame(817);
  state.inventory.reed_hand_manual = 1;
  play(state, 'equipManual', { id: 'reed_hand_manual' });
  const stored = play(state, 'econDeposit', { id: 'reed_hand_manual' });
  assert.match(stored.message, /内功已停止运转/);
  assert.equal(state.activeManual, null);
  play(state, 'econWithdraw', { id: 'reed_hand_manual' });
  assert.equal(state.activeManual, null);
  assert.equal(state.inventory.reed_hand_manual, 1);
});

test('the alchemist only gives directions for the current proof and follows the brew to breakthrough', () => {
  const state = createGame(812);
  state.realm = 2;
  state.coins = 160;
  state.insight = 70;
  state.practice[2] = 14;
  state.knownItems.push('foundation_ledger', 'kiln_manual');
  state.alchemy.inquiryIndex = 3;
  state.economy.buildings.furnace = 2;
  state.economy.warehouse = { reed: 8, core: 8, black_iron: 4, qi_core: 24 };

  assert.match(view(state).alchemy.progressText, /碎云雪关/);
  state.inventory.foundation_warden_proof = 1;
  state.defeated.push('foundation_warden');
  assert.equal(view(state).alchemy.progressText, '');
  assert.equal(view(state).alchemy.inquiry.id, 'finish_foundation_formula');
  play(state, 'alchemyAdvance', { id: 'finish_foundation_formula' });
  assert.match(view(state).alchemy.progressText, /药引/);

  play(state, 'econStart', { id: 'r_foundation' });
  assert.match(view(state).alchemy.progressText, /还在火上/);
  const [batch] = state.economy.jobs;
  while (state.day < batch.readyDay) play(state, 'wait');
  assert.match(view(state).alchemy.progressText, /可以去收丹/);
  assert.match(act(state, 'econStoreJob', { id: batch.id }).message, /亲手收好/);
  play(state, 'econCollect', { id: batch.id });
  assert.match(view(state).alchemy.progressText, /闭关突破时再服/);
  assert.match(view(state).alchemy.progressText, /「村务」进「修行」/);

  play(state, 'breakthrough');
  assert.equal(view(state).alchemy.progressText, '');
});

test('completed food comes off the fire and a paid materials order cooks several batches at once', () => {
  const state = createGame(813);
  state.inventory.wood = 15;
  state.inventory.reed = 6;
  state.inventory.beast_meat = 7;
  state.knownItems.push('beast_meat', 'recipe_meat_broth');
  play(state, 'econBuild', { id: 'hearth' });
  const hearth = () => view(state).economy.facilities.find(({ id }) => id === 'hearth');
  const broth = () => hearth().projects.find(({ id }) => id === 'simmer_meat_broth');
  assert.deepEqual(broth().batches.map(({ count, days }) => [count, days]), [[2, 1], [3, 1.5], [4, 2]]);
  const beforeInvalidBatch = structuredClone(state);
  assert.equal(act(state, 'econStart', { id: broth().id, count: 5 }).ok, false);
  assert.deepEqual(state, beforeInvalidBatch);

  play(state, 'econStart', { id: broth().id });
  assert.match(broth().reason, /还在忙/);
  play(state, 'wait');
  const first = hearth().jobs[0];
  assert.equal(first.ready, true);
  assert.equal(broth().reason, '');
  const beforeOrder = state.day;
  play(state, 'econStart', { id: broth().id, count: 3 });
  assert.equal(state.inventory.beast_meat, 3);
  assert.equal(state.inventory.wood, 3);
  assert.equal(state.economy.jobs[1].readyDay, beforeOrder + 1.75);
  assert.deepEqual(state.economy.jobs[1].loot, { meat_broth: 3 });
  const beforeWaiting = state.day;
  const health = state.hp;
  const qi = state.qi;
  const expectedEnd = state.economy.jobs[1].readyDay;
  state.satiety = 8;
  assert.deepEqual(hearth().wait, { days: 0.5, satiety: 8, ready: false });
  play(state, 'econWait', { id: 'hearth' });
  assert.equal(state.day, beforeWaiting + 0.5);
  assert.equal(state.satiety, 0);
  assert.equal(state.hp, health);
  assert.equal(state.qi, qi);
  assert.equal(hearth().jobs[1].ready, false);
  assert.equal(act(state, 'econWait', { id: 'hearth' }).ok, false);
  play(state, 'eat', { id: 'ration' });
  play(state, 'econWait', { id: 'hearth' });
  assert.equal(state.day, expectedEnd);
  assert.equal(hearth().wait, null);
  assert.match(broth().reason, /案上堆满成品/);
  assert.equal(act(state, 'econStart', { id: broth().id }).ok, false);

  const bag = view(state);
  state.inventory.ore = (bag.backpackCapacity - bag.backpackUsed) * 20;
  assert.equal(view(state).backpackUsed, bag.backpackCapacity);
  assert.match(hearth().jobs[0].reason, /行囊腾出空位/);
  play(state, 'econStoreJob', { id: first.id });
  assert.equal(state.economy.warehouse.meat_broth, 1);
  assert.equal(state.inventory.meat_broth, undefined);
  assert.ok(state.knownItems.includes('meat_broth'));
  assert.equal(broth().reason, '');
  assert.equal(act(state, 'econStoreJob', { id: first.id }).ok, false);
  play(state, 'econStoreJob', { id: hearth().jobs[0].id });
  assert.equal(state.economy.warehouse.meat_broth, 4);
});

test('unloading a full warehouse merges spilled raw materials and leaves food and evidence in hand', () => {
  const state = createGame(814);
  const otherMaterials = data.items.filter(({ id, kind }) =>
    ['material', 'food', 'pill', 'ammo', 'talisman'].includes(kind) && id !== 'wood' && id !== 'reed').slice(0, 15);
  state.economy.warehouse = { wood: 39, ...Object.fromEntries(otherMaterials.map(({ id }) => [id, 40])) };
  Object.assign(state.inventory, { wood: 4, reed: 3, salve: 2, ridge_rubbing: 1, beast_meat: 1 });
  state.durability.cudgel = 23;
  assert.equal(view(state).economy.warehouse.used, 16);
  assert.deepEqual(view(state).economy.warehouse.materialPlan, { wood: 1 });
  const failed = structuredClone(state);
  assert.match(act(state, 'econDeposit', { id: 'wood', count: 2 }).message, /还差1格/);
  assert.deepEqual(state, failed);
  const before = structuredClone(state.inventory);
  play(state, 'econStoreMaterials');
  assert.deepEqual(state.inventory, { ...before, wood: 3 });
  assert.equal(state.economy.warehouse.wood, 40);
  assert.equal(state.durability.cudgel, 23);
  assert.equal(act(state, 'econStoreMaterials').ok, false);
});
