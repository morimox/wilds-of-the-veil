import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view, weaponRepairNeed } from './engine.mjs';
import { createQuietGame as createGame, stageRetreatOpening } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function firstHunt() {
  const state = createGame(1);
  play(state, 'buy', { id: 'knife' });
  play(state, 'equip', { id: 'knife' });
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'bank_watch' });
  play(state, 'choose', { index: 0 });
  for (const action of ['attack', 'guard', 'eat', 'attack', 'guard', 'eat', 'attack']) play(state, action);
  play(state, 'choose', { index: 2 });
  play(state, 'equip', { id: 'hook_blade' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  for (let hit = 0; hit < 3; hit++) play(state, 'attack');
  play(state, 'take', { id: 'hide' });
  return state;
}

test('a field defeat leaves new gear at the encounter with its wear and keeps the route map', () => {
  const state = firstHunt();
  play(state, 'choose', { index: 0 });
  play(state, 'attack');
  const wearBefore = state.durability.hook_blade;
  const result = play(state, 'attack');
  assert.match(result.message, /渡口钩刃×1.*落在碎石水眼/);
  assert.equal(state.region, 'village');
  assert.equal(state.equipment.weapon, null);
  assert.equal(state.inventory.ridge_rubbing, 1);
  assert.equal(state.inventory.knife, 1);
  assert.equal(state.inventory.hook_blade, undefined);
  assert.equal(state.inventory.hide, undefined);
  assert.deepEqual(state.ground.mud_track, { beast_meat: 2, qi_core: 1, hook_blade: 1, hide: 2 });

  play(state, 'rest');
  play(state, 'eat');
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  assert.equal(view(state).groundPickup.hook_blade, 1);
  play(state, 'take', { id: 'hook_blade' });
  assert.equal(state.inventory.hook_blade, 1);
  assert.equal(state.durability.hook_blade, wearBefore - 1);
  assert.equal(view(state).groundLoot.hook_blade, undefined);
});

test('falling during withdrawal drops the load at the encounter rather than on the regional overview', () => {
  const state = firstHunt();
  play(state, 'leave');
  play(state, 'visit', { id: 'reed_banks' });
  play(state, 'beginGather', { index: 1 });
  play(state, 'finishGather');
  play(state, 'leave');
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  play(state, 'attack');
  const result = play(state, 'retreat');
  assert.match(result.message, /落在碎石水眼/);
  assert.equal(state.region, 'village');
  assert.equal(state.ground.mud_track.hook_blade, 1);
  assert.equal(state.ground.marsh, undefined);
  assert.equal(state.ground.reed_banks.reed, 3);
});

test('only designated local smiths repair the gear in hand at the quoted price', () => {
  const state = createGame(1);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  play(state, 'attack');
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  const worn = state.durability.cudgel;
  assert.ok(worn < 26);
  assert.equal(view(state).repairService, null);
  assert.equal(act(state, 'repair', { id: 'cudgel' }).ok, false);

  // Resume the same expedition at its later settlement arrivals with the worn staff.
  for (const [region, name, price] of [
    ['zhao_city', '蒲霖的后炉', 5],
    ['sand_bell_cloister', '梁弦的外院修具台', 6],
    ['village', '落灯村工坊', 3],
  ]) {
    state.region = region;
    state.durability.cudgel = worn;
    state.coins = price - 1;
    const quote = view(state).repairService;
    assert.equal(quote.name, name);
    assert.equal(quote.prices.cudgel, price);

    const denied = act(state, 'repair', { id: 'cudgel' });
    assert.equal(denied.ok, false);
    assert.ok(denied.message.includes(String(price)));
    assert.equal(state.durability.cudgel, worn);
    assert.equal(state.coins, price - 1);
    state.coins++;
    assert.ok(play(state, 'repair', { id: 'cudgel' }).message.includes(String(price)));
    assert.equal(state.coins, 0);
    assert.equal(state.durability.cudgel, 26);
    assert.equal(act(state, 'repair', { id: 'cudgel' }).ok, false);
    if (region !== 'village') {
      assert.equal(act(state, 'craft', { id: 'r_reed_arrow' }).ok, false);
      assert.deepEqual(view(state).discoveredRecipes, []);
    }
  }

  state.region = 'measuring_hall';
  state.durability.cudgel = worn;
  assert.equal(view(state).repairService, null);
  assert.equal(act(state, 'repair', { id: 'cudgel' }).ok, false);
  assert.equal(state.durability.cudgel, worn);
});

test('a staff worn to zero by a real strike can be fixed with carried and stored material', () => {
  const state = createGame(31);
  play(state, 'buy', { id: 'wood', count: 2 });
  play(state, 'econDeposit', { id: 'wood', count: 1 });
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  state.durability.cudgel = 1;
  const strike = play(state, 'attack');
  assert.match(strike.message, /枣木杖.*损坏/);
  assert.equal(state.durability.cudgel, 0);
  assert.equal(act(state, 'repairMaterials', { id: 'cudgel' }).ok, false);
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  assert.equal(act(state, 'repairMaterials', { id: 'cudgel' }).ok, false);
  play(state, 'travel', { id: 'village' });
  state.coins = 0;

  assert.deepEqual(view(state).repairService.materials.cudgel, { need: { wood: 2 }, reason: '' });
  play(state, 'repairMaterials', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, 26);
  assert.deepEqual(weaponRepairNeed('cudgel', 26), {});
  assert.equal(view(state).repairService.materials.cudgel, undefined);
  assert.equal(state.inventory.wood, undefined);
  assert.equal(state.economy.warehouse.wood, undefined);
  assert.equal(state.coins, 0);
  assert.equal(act(state, 'repairMaterials', { id: 'cudgel' }).ok, false);
});

test('a remote smith consumes only carried parts for rare and off-hand weapons and scales the quote to wear', () => {
  const state = createGame(81);
  state.region = 'zhao_city';
  state.inventory.foil_sword = 1;
  state.inventory.side_hook = 1;
  state.inventory.hide_shield = 1;
  Object.assign(state.durability, { foil_sword: 0, side_hook: 25, hide_shield: 0 });
  state.economy.warehouse = { ore: 10, black_iron: 10, core: 10 };
  const book = () => view(state).repairService.materials;
  const required = { ore: 2, black_iron: 2, core: 1 };
  assert.deepEqual(book().foil_sword.need, required);
  assert.match(book().foil_sword.reason, /还缺/);
  const before = structuredClone(state);
  assert.equal(act(state, 'repairMaterials', { id: 'foil_sword' }).ok, false);
  assert.deepEqual(state, before);
  assert.equal(book().hide_shield, undefined);
  assert.equal(act(state, 'repairMaterials', { id: 'hide_shield' }).ok, false);

  Object.assign(state.inventory, required);
  assert.equal(book().foil_sword.reason, '');
  play(state, 'repairMaterials', { id: 'foil_sword' });
  assert.equal(state.durability.foil_sword, 66);
  assert.deepEqual(state.economy.warehouse, before.economy.warehouse);
  assert.equal(state.coins, before.coins);
  assert.equal(state.inventory.ore, undefined);
  state.durability.foil_sword = 64;
  assert.deepEqual(book().foil_sword.need, { ore: 1, black_iron: 1, core: 1 });

  state.inventory.ore = 1;
  state.inventory.wood = 2;
  assert.deepEqual(book().side_hook, { need: { ore: 1, wood: 1 }, reason: '' });
  play(state, 'repairMaterials', { id: 'side_hook' });
  assert.equal(state.durability.side_hook, 30);
  assert.equal(state.inventory.wood, 1);
});
