import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, result.message);
  return result;
}

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

  play(state, 'breakthrough');
  assert.equal(view(state).alchemy.progressText, '');
});

test('completed food comes off the fire and a paid materials order cooks several batches at once', () => {
  const state = createGame(813);
  state.inventory.wood = 15;
  state.inventory.reed = 6;
  state.inventory.beast_meat = 7;
  state.knownItems.push('beast_meat');
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
  const before = structuredClone(state.inventory);
  play(state, 'econStoreMaterials');
  assert.deepEqual(state.inventory, { ...before, wood: 3 });
  assert.equal(state.economy.warehouse.wood, 40);
  assert.equal(state.durability.cudgel, 23);
  assert.equal(act(state, 'econStoreMaterials').ok, false);
});
