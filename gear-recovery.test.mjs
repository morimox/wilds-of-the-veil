import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
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
