import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame } from './game-test-fixtures.mjs';

const quest = 'encyclopedia_compile';
const desk = 'encyclopedia_copy_desk';
const note = 'encyclopedia_clerk_note';
const snake = 'encyclopedia_weir_snake';
const weirLeaf = 'encyclopedia_weir_leaf';
const kilnProof = 'encyclopedia_kiln_proof';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function beginAtTheHall(realm = 0) {
  const state = createQuietGame(42);
  state.realm = realm;
  state.region = 'measuring_hall';
  state.world.lastSettlement = state.region;
  state.discovered.push(state.region, 'charcoal_ridge');
  return state;
}

function walk(state, ...destinations) {
  for (const id of destinations) {
    if (state.satiety < 40) play(state, 'eat', { id: 'ration' });
    play(state, 'travel', { id });
    assert.equal(state.region, id);
  }
}

function askAndAccept(state) {
  play(state, 'visit', { id: desk });
  assert.doesNotMatch(play(state, 'choose', { index: 0 }).message, /百科全书/);
  assert.doesNotMatch(play(state, 'choose', { index: 1 }).message, /百科全书/);
  assert.equal(state.inventory[note], 1);
}

test('the desk encounter can be asked about, left, or accepted at the lowest realm without naming the book', () => {
  const state = beginAtTheHall();
  assert.equal(state.realm, 0);
  assert.ok(view(state).sites.some(({ id }) => id === desk));
  play(state, 'visit', { id: desk });
  assert.deepEqual(view(state).visibleChoices.map(({ index }) => index), [0]);
  assert.doesNotMatch(view(state).currentEvent.text, /百科全书/);
  assert.doesNotMatch(play(state, 'choose', { index: 0 }).message, /百科全书/);
  assert.equal(state.inventory[note], undefined);
  assert.deepEqual(view(state).visibleChoices.map(({ index }) => index), [1]);
  play(state, 'leave');
  assert.ok(!view(state).quests.some(({ id }) => id === quest));
  play(state, 'visit', { id: desk });
  assert.deepEqual(view(state).visibleChoices.map(({ index }) => index), [1]);
  play(state, 'choose', { index: 1 });
  assert.equal(state.realm, 0);
  assert.equal(state.inventory[note], 1);
  assert.ok(view(state).quests.some(({ id }) => id === quest));
  assert.equal(state.inventory.encyclopedia, undefined);
  assert.match(act(state, 'handin', { id: quest }).message, /还缺/);
});

test('the two leads require an actual fight and repair, then a free physical slot to claim the single book', () => {
  const state = beginAtTheHall(4);
  Object.assign(state.inventory, { ration: 28, wood: 4, hide: 3, battle_sinew: 1, salve: 2 });
  state.knownArts.push('reed_cleave');
  state.knownItems.push('sand_writ');
  for (const id of ['iron_sword', 'iron_coat', 'hide_shield']) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
    play(state, 'equip', { id });
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  askAndAccept(state);
  walk(state, 'charcoal_ridge', 'burnt_weir');
  play(state, 'visit', { id: 'encyclopedia_weir_beam' });
  assert.ok(!view(state).visibleChoices.some(({ index }) => index === 1));
  if (state.satiety < 40) play(state, 'eat', { id: 'ration' });
  play(state, 'choose', { index: 0 });
  assert.equal(view(state).currentEnemy.id, snake);
  for (let round = 0; round < 15 && state.combat; round++) {
    const { intent, hp, qi } = view(state);
    if (intent?.kind === 'heavy') play(state, 'guard');
    else if (hp <= 19 && state.inventory.salve) play(state, 'use', { id: 'salve' });
    else if (qi >= 2) play(state, 'art', { id: 'reed_cleave' });
    else play(state, 'attack');
  }
  assert.ok(state.defeated.includes(snake));
  assert.equal(state.inventory.encyclopedia, undefined);
  assert.equal(view(state).groundLoot.encyclopedia, undefined);
  assert.equal(state.inventory[weirLeaf], undefined);
  assert.equal(view(state).groundLoot[weirLeaf], undefined);
  assert.equal(state.inventory.battle_sinew, 1);
  play(state, 'take', { id: 'battle_sinew' });
  if (!state.satiety) play(state, 'eat', { id: 'ration' });
  play(state, 'choose', { index: 1 });
  assert.equal(state.inventory[weirLeaf], 1);
  walk(state, 'rope_sands', 'zhao_pass', 'mingsha_city', 'sand_bell_cloister', 'wind_slate', 'cold_kiln');
  play(state, 'visit', { id: 'encyclopedia_paper_shed' });
  if (state.satiety < 18) play(state, 'eat', { id: 'ration' });
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory[kilnProof], 1);
  assert.equal(state.inventory.battle_sinew, undefined);
  assert.equal(state.inventory.wood, undefined);
  assert.equal(state.inventory.hide, undefined);
  walk(state, 'measuring_hall');

  const rationSlots = Math.ceil(state.inventory.ration / rules.backpackStackSize);
  const current = view(state);
  state.inventory.ration = (current.backpackCapacity - current.backpackUsed + rationSlots) * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, current.backpackCapacity);
  const full = structuredClone(state);
  const blocked = act(state, 'handin', { id: quest });
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /行囊已满/);
  assert.deepEqual(state, full);
  state.inventory.ration -= rules.backpackStackSize;
  const before = view(state).backpackUsed;
  assert.match(play(state, 'handin', { id: quest }).message, /百科全书/);
  assert.equal(state.inventory.encyclopedia, 1);
  assert.equal(view(state).backpackUsed, before + 1);
  assert.equal(state.inventory[weirLeaf], undefined);
  assert.equal(state.inventory[kilnProof], undefined);
  assert.equal(act(state, 'handin', { id: quest }).ok, false);
  assert.equal(state.inventory.encyclopedia, 1);
});
