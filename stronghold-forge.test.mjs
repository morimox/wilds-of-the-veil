import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function equip(state, id) {
  if (!state.inventory[id]) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
  }
  play(state, 'equip', { id });
}

function prepareForge(recipe) {
  const state = createGame(45);
  state.realm = recipe.tier;
  state.economy.buildings.forge = recipe.facilityLevel;
  state.coins = recipe.cost + 20;
  state.satiety = rules.maxSatiety;
  for (const [material, amount] of Object.entries(recipe.need)) {
    state.inventory[material] = amount;
    state.knownItems.push(material);
  }
  return state;
}

for (const [recipeId, sample, scaleCount] of [
  ['r_den_armguard', 'den_neck_plate', 8],
  ['r_quarry_spear', 'quarry_back_spine', 14],
]) {
  test(`a stronghold piece takes the actual ${sample} as a reusable forging pattern`, () => {
    const recipe = data.recipes.find(({ id }) => id === recipeId);
    const state = prepareForge(recipe);
    assert.equal(act(state, 'econStart', { id: recipeId }).ok, false);
    state.knownItems.push(sample);
    assert.equal(act(state, 'econStart', { id: recipeId }).ok, false);
    state.inventory[sample] = 1;
    const money = state.coins;
    assert.equal(recipe.need.hard_scale, scaleCount);
    state.inventory.hard_scale -= 1;
    const short = act(state, 'econStart', { id: recipeId });
    assert.equal(short.ok, false);
    assert.match(short.message, /厚甲片×1/);
    assert.equal(state.coins, money);
    assert.equal(state.inventory[sample], 1);
    state.inventory.hard_scale += 1;
    play(state, 'econStart', { id: recipeId });
    for (const material of Object.keys(recipe.need)) assert.equal(state.inventory[material], undefined);
    assert.equal(state.coins, money - recipe.cost);
    assert.equal(state.inventory[sample], 1);
    assert.equal(act(state, 'sell', { id: sample, count: 1 }).ok, false);
    assert.equal(act(state, 'buy', { id: recipe.result, count: 1 }).ok, false);
    const [job] = state.economy.jobs;
    assert.equal(act(state, 'econCollect', { id: job.id }).ok, false);
    while (state.day < job.readyDay) {
      if (state.satiety < 25) play(state, 'eat', { id: 'ration' });
      play(state, 'econWait', { id: 'forge' });
    }
    play(state, 'econCollect', { id: job.id });
    assert.equal(state.inventory[recipe.result], 1);
    assert.equal(state.inventory[sample], 1);
    assert.equal(act(state, 'discard', { id: sample }).ok, false);
    play(state, 'equip', { id: recipe.result });
    assert.equal(state.equipment[data.gear.find(({ id }) => id === recipe.result).slot], recipe.result);
  });
}

test('mid- and late-stage body armor use the common scales without requiring a stronghold trophy', () => {
  for (const [recipeId, scaleCount] of [['r_gauze_armor', 8], ['r_fault_coat', 16]]) {
    const recipe = data.recipes.find(({ id }) => id === recipeId);
    const state = prepareForge(recipe);
    state.knownItems.push(recipe.reveal.item);
    assert.equal(recipe.need.hard_scale, scaleCount);
    state.inventory.hard_scale -= 1;
    const short = act(state, 'econStart', { id: recipeId });
    assert.equal(short.ok, false);
    assert.match(short.message, /厚甲片×1/);
    assert.equal(act(state, 'buy', { id: 'hard_scale', count: 1 }).ok, false);
    assert.equal(act(state, 'sell', { id: 'hard_scale', count: 1 }).ok, false);
    state.inventory.hard_scale += 1;
    play(state, 'econDeposit', { id: 'hard_scale', count: 1 });
    play(state, 'econStart', { id: recipeId });
    assert.equal(state.inventory.hard_scale, undefined);
    assert.equal(state.economy.warehouse.hard_scale, undefined);
  }
});

function duel(id, tier, round = 0) {
  const enemy = data.enemies.find((entry) => entry.id === id);
  const state = createGame(45);
  state.realm = tier;
  state.combat = { id, hp: enemy.hp, round };
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  return state;
}

test('the armguard cushions braced hits and occupies the same hand as a shield or tool', () => {
  const state = duel('herb_den_elder', 4, 2);
  const withShield = structuredClone(state);
  withShield.combat = null;
  equip(withShield, 'hide_shield');
  withShield.combat = { ...state.combat };
  const combat = state.combat;
  state.combat = null;
  const plain = view(state);
  equip(state, 'den_armguard');
  const wearing = view(state);
  assert.equal(wearing.maxHp - plain.maxHp, 5);
  assert.equal(wearing.maxQi - plain.maxQi, 4);
  assert.equal(wearing.defense - plain.defense, 2);
  state.inventory.reed_bow = 1;
  state.durability.reed_bow = data.gear.find(({ id }) => id === 'reed_bow').durability;
  const archer = structuredClone(state);
  equip(archer, 'reed_bow');
  assert.equal(archer.equipment.offhand, null);
  assert.equal(archer.inventory.den_armguard, 1);
  const working = structuredClone(state);
  equip(working, 'miner_pick');
  assert.equal(working.equipment.offhand, 'miner_pick');
  state.combat = combat;
  const guard = play(state, 'guard');
  assert.equal(guard.damageTaken, play(withShield, 'guard').damageTaken - 3);
  assert.match(guard.message, /蒲根护臂/);
  assert.equal(state.durability.den_armguard, 55);
});

test('the spear trades ordinary damage for penetration against scaled opponents even after resistance', () => {
  for (const [enemy, expectedDirection] of [['sand_quarry_guard', 1], ['sand_glass_lynx', -1]]) {
    const state = duel(enemy, 5);
    state.enemyEvadeSeed = 0; // Compare two actual hits, including against the agile lynx.
    const sword = structuredClone(state);
    sword.combat = null;
    equip(sword, 'foil_sword');
    sword.combat = { ...state.combat };
    const combat = state.combat;
    state.combat = null;
    equip(state, 'quarry_spear');
    equip(state, 'den_armguard');
    state.combat = combat;
    const strike = (fighter) => {
      const result = play(fighter, 'attack');
      return result.damageDealt - (result.reflectedDamage ?? 0);
    };
    assert.equal(Math.sign(strike(state) - strike(sword)), expectedDirection);
  }
});
