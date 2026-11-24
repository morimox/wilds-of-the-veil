import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame } from './game-test-fixtures.mjs';

const staff = data.gear.find(({ id }) => id === 'gold_tide_staff');
const confluence = data.gear.find(({ id }) => id === 'gold_confluence_staff');
const foe = data.enemies.find(({ id }) => id === 'sand_riven_scorpion');

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, result.message);
  return result;
}

function spellDuel(weapon) {
  const state = createQuietGame(421);
  state.realm = 8;
  if (weapon) {
    state.inventory[weapon.id] = 1;
    state.durability[weapon.id] = weapon.durability;
    play(state, 'equip', { id: weapon.id });
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  const intent = foe.intents.find((move) => move.kind === 'attack');
  state.combat = { id: foe.id, hp: foe.hp, round: 0, escapeBonus: 0, plan: { round: 0, reader: null, intent } };
  return state;
}

test('late reserves grow while the strongest weapon spells cost more than early ones', () => {
  assert.deepEqual(data.realms.map(({ qi }) => qi), [30, 38, 50, 63, 77, 92, 120, 146, 177]);
  const early = data.gear.find(({ id }) => id === 'resin_staff');
  const middle = data.gear.find(({ id }) => id === 'coil_pole');
  assert.deepEqual([early, middle, staff, confluence].map(({ spellQi }) => spellQi), [8, 17, 24, 34]);
  assert.equal(view(createQuietGame(421)).combatWeapon.spellQi, 0);
});

test('a working staff raises magical damage and the quoted and paid Qi together', () => {
  const plain = spellDuel();
  const channeled = spellDuel(staff);
  const merged = spellDuel(confluence);
  assert.equal(view(channeled).combatWeapon.spellQi, 24);
  assert.equal(view(channeled).maxQi - view(plain).maxQi, staff.qi);
  assert.equal(view(channeled).magicAttack - view(plain).magicAttack, staff.magicAtk);
  assert.equal(view(merged).combatWeapon.spellQi, 34);
  assert.equal(view(merged).maxQi - view(plain).maxQi, confluence.qi);
  assert.equal(view(merged).magicAttack - view(plain).magicAttack, confluence.magicAtk);
  const initialPlainQi = plain.qi;
  const initialStaffQi = channeled.qi;
  const initialConfluenceQi = merged.qi;
  assert.equal(act(plain, 'weaponSpell').ok, false);
  const guided = play(channeled, 'weaponSpell');
  const combined = play(merged, 'weaponSpell');
  assert.ok(guided.damageDealt > 0);
  assert.ok(combined.damageDealt > guided.damageDealt);
  assert.equal(initialPlainQi - plain.qi, 0);
  assert.equal(initialStaffQi - channeled.qi, 24);
  assert.equal(initialConfluenceQi - merged.qi, 34);
  assert.equal(channeled.durability[staff.id], staff.durability - 1);
});

test('insufficient Qi leaves the fight intact and hitting with the staff costs only wear', () => {
  const state = spellDuel(staff);
  state.qi = staff.spellQi - 1;
  const before = structuredClone(state);
  assert.equal(act(state, 'weaponSpell').message, '真气不足。');
  assert.deepEqual(state, before);

  state.qi = 0;
  state.durability[staff.id] = 1;
  assert.ok(play(state, 'attack').damageDealt > 0);
  assert.equal(state.qi, 0);
  assert.equal(state.durability[staff.id], 0);
  assert.equal(view(state).combatWeapon.spellQi, 0);
  assert.equal(view(state).magicAttack, view(spellDuel()).magicAttack);
});

test('the heavier staff can be forged once the lake accord is known', () => {
  const state = createQuietGame(421);
  state.realm = 8;
  state.economy.buildings.forge = 3;
  const recipe = data.recipes.find(({ result }) => result === confluence.id);
  state.coins = recipe.cost;
  Object.assign(state.inventory, recipe.need);
  state.knownItems.push(...Object.keys(recipe.need));
  const forge = () => view(state).economy.facilities.find(({ id }) => id === 'forge');
  const blueprint = () => forge().projects.find(({ id }) => id === recipe.id);
  assert.equal(blueprint(), undefined);
  assert.equal(act(state, 'econStart', { id: recipe.id }).ok, false);
  state.knownItems.push('fault_receipt');
  state.inventory.fault_receipt = 1;
  assert.equal(blueprint().reason, '');
  play(state, 'econStart', { id: recipe.id });
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.fault_receipt, 1);
  assert.equal(state.inventory.gold_core, undefined);
  const [job] = forge().jobs;
  assert.equal(act(state, 'econCollect', { id: job.id }).ok, false);
  state.satiety = rules.maxSatiety;
  play(state, 'econWait', { id: 'forge' });
  assert.equal(forge().jobs[0].ready, false);
  play(state, 'eat');
  play(state, 'econWait', { id: 'forge' });
  assert.ok(forge().jobs[0].ready);
  play(state, 'econCollect', { id: job.id });
  assert.equal(state.inventory[confluence.id], 1);
  assert.equal(state.durability[confluence.id], confluence.durability);
});
