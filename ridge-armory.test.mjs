import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const site = 'ridge_armory_refuge';
const horn = 'ridge_ramhorn';
const quest = 'ridge_bracer_commission';
const pattern = 'ridge_bracer_pattern';
const bracer = 'ridge_bracer';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function travel(state, id) {
  if (state.satiety < 38) play(state, 'eat', { id: 'ration' });
  play(state, 'travel', { id });
}

function win(state) {
  for (let rounds = 0; state.combat && rounds < 16; rounds += 1) {
    if (state.hp < 36 && state.inventory.heal_pill) play(state, 'use', { id: 'heal_pill' });
    else if (view(state).intent?.kind === 'heavy') play(state, 'guard');
    else play(state, 'attack');
  }
  assert.equal(state.combat, null);
  assert.equal(state.event, site);
}

test('the two wind paths share thirty animals and the real horn leads to a reusable forge pattern', () => {
  // Stage a traveler who has already reached gold and built a level-three forge.
  const state = createGame(913);
  state.region = 'wind_slate';
  state.discovered.push('wind_slate', 'sand_bell_cloister');
  state.realm = 6;
  state.coins = 126;
  state.inventory.ration = 12;
  state.inventory.heal_pill = 2;
  state.economy.buildings.forge = 3;
  for (const id of ['foil_sword', 'fault_coat', 'coal_tassel']) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
    play(state, 'equip', { id });
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  assert.equal(view(state).sites.some(({ id }) => id === site), false);
  travel(state, 'sand_bell_cloister');
  assert.equal(view(state).discoveredQuests.includes(quest), false);
  play(state, 'visit', { id: 'ridge_armory_bench' });
  play(state, 'choose', { index: 0 });
  play(state, 'leave');
  travel(state, 'wind_slate');
  play(state, 'visit', { id: site });
  assert.deepEqual(Object.values(view(state).sites.find(({ id }) => id === site).creatures), [16, 8, 5, 1]);

  // Select a seed whose real encounter draw falls on the leader's final ticket.
  const finalTicket = Array.from({ length: 2_000 }, (_, index) => (Math.imul(index + 1, 2654435761) >>> 0))
    .find((seed) => ((Math.imul(1664525, seed) + 1013904223) >>> 0) / 0x100000000 >= 29 / 30);
  assert.notEqual(finalTicket, undefined);
  state.encounterSeed = finalTicket;
  const longer = structuredClone(state);
  play(state, 'choose', { index: 0 });
  const opening = view(longer).visibleChoices[1];
  assert.equal(opening.available, true);
  play(longer, 'choose', { index: 1 });
  assert.equal(state.combat.id, 'ridge_armory_ram');
  assert.equal(longer.combat.id, state.combat.id);
  assert.equal(state.combat.openingRange, false);
  assert.equal(longer.combat.openingRange, true);
  assert.equal(longer.day - state.day, 0.25);
  win(state);
  assert.equal(state.siteVictories[site].ridge_armory_ram, 1);
  assert.equal(view(state).groundLoot[horn], 1);
  assert.equal(state.inventory[horn], undefined);
  play(state, 'take', { id: horn });
  play(state, 'take', { id: 'battle_sinew' });
  play(state, 'take', { id: 'hide' });
  assert.equal(state.inventory.battle_sinew, 3);
  play(state, 'leave');
  travel(state, 'sand_bell_cloister');
  assert.equal(act(state, 'handin', { id: quest }).ok, false);
  play(state, 'restUntilRecovered');
  travel(state, 'wind_slate');
  play(state, 'visit', { id: site });
  state.encounterSeed = 1;
  play(state, 'choose', { index: 0 });
  assert.equal(state.combat.id, 'ridge_armory_goat');
  win(state);
  play(state, 'take', { id: 'battle_sinew' });
  assert.equal(state.inventory.battle_sinew, 4);
  play(state, 'leave');
  travel(state, 'sand_bell_cloister');
  play(state, 'visit', { id: 'ridge_armory_bench' });
  assert.ok(view(state).siteQuests.some(row => row.id === quest && row.ready));
  play(state, 'handin', { id: quest });
  assert.equal(state.inventory[horn], 1);
  assert.equal(state.inventory[pattern], 1);
  assert.equal(state.inventory.battle_sinew, undefined);
  assert.match(view(state).currentEvent.text, /弦稳稳地绷在新钩上/);
  assert.equal(act(state, 'handin', { id: quest }).ok, false);
  play(state, 'leave');

  // Stage the return to the main forge with gathered ingredients.
  state.region = 'village';
  const recipe = data.recipes.find(({ result }) => result === bracer);
  Object.assign(state.inventory, recipe.need);
  state.knownItems.push(...Object.keys(recipe.need));
  const withoutHorn = structuredClone(state);
  delete withoutHorn.inventory[horn];
  assert.equal(act(withoutHorn, 'econStart', { id: recipe.id }).ok, false);
  play(state, 'econStart', { id: recipe.id });
  while (state.day < state.economy.jobs[0].readyDay) {
    if (state.satiety < 25) play(state, 'eat', { id: 'ration' });
    play(state, 'econWait', { id: 'forge' });
  }
  play(state, 'econCollect', { id: state.economy.jobs[0].id });
  play(state, 'equip', { id: bracer });
  assert.equal(state.inventory[horn], 1);
  assert.equal(state.equipment.offhand, bracer);
});
