import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function enter(siteId) {
  const state = createGame(2419);
  state.region = data.sites.find(site => site.id === siteId).region;
  state.day = 52;
  state.realm = 6;
  state.inventory.sky_sword = 1;
  state.durability.sky_sword = 55;
  state.equipment.weapon = 'sky_sword';
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.satiety = 100;
  state.inventory.ration = 9;
  play(state, 'visit', { id: siteId });
  return state;
}

const counts = (state) => view(state).sites.find(site => site.id === state.event).creatures;
const option = (state, index) => view(state).visibleChoices.find(offer => offer.index === index);

function hunt(state, index, expected) {
  if (state.satiety < 45) play(state, 'eat', { id: 'ration' });
  play(state, 'choose', { index });
  assert.equal(view(state).currentEnemy.id, expected);
  for (let turn = 0; state.combat && turn < 8; turn++) play(state, view(state).intent.kind === 'heavy' ? 'guard' : 'attack');
  assert.equal(state.combat, null);
  assert.ok(state.defeated.includes(expected));
}

test('the dune pheasant can be hunted out without moving the hare pool or shutting off the grass', () => {
  const state = enter('sand_dune_grass');
  const rabbit = 'sand_dune_hare';
  const pheasant = 'sand_ridge_pheasant';
  const original = counts(state);
  assert.equal(Object.keys(original).length, 4);
  assert.ok(original[rabbit] > 1 && original[pheasant] > 1);
  assert.match(view(state).currentEvent.text, /耳朵.*褐翅.*梅花脚印.*拱土声/);

  const originalTracks = counts(state)[pheasant];
  for (let i = 0; i < originalTracks; i++) hunt(state, 2, pheasant);
  assert.equal(counts(state)[rabbit], original[rabbit]);
  assert.equal(counts(state)[pheasant], 0);
  assert.equal(option(state, 0).available, true);
  assert.equal(option(state, 1).available, true);
  assert.equal(option(state, 2).available, false);
  assert.equal(option(state, 3).available, true);
  assert.equal(option(state, 4).available, true);
  assert.match(view(state).currentEvent.text, /耳朵.*空谷壳/);
});

test('foxes and boars provide a distinct leather and food route in the same hunting ground', () => {
  const fox = 'sand_salt_fox';
  const boar = 'sand_root_boar';
  const foxTrail = enter('sand_dune_grass');
  const foxStart = counts(foxTrail);
  hunt(foxTrail, 3, fox);
  assert.deepEqual(view(foxTrail).groundLoot, { beast_meat: 1, hide: 2, qi_core: 1 });
  assert.equal(counts(foxTrail)[fox], foxStart[fox] - 1);
  assert.equal(counts(foxTrail)[boar], foxStart[boar]);

  const boarTrail = enter('sand_dune_grass');
  const boarStart = counts(boarTrail);
  hunt(boarTrail, 4, boar);
  assert.deepEqual(view(boarTrail).groundLoot, { beast_meat: 4, hide: 1, qi_core: 3 });
  assert.equal(counts(boarTrail)[boar], boarStart[boar] - 1);
  assert.equal(counts(boarTrail)[fox], boarStart[fox]);
});

test('only the jackal controls access to the deep ore at the mixed vein site', () => {
  const state = enter('sand_hanging_support');
  const jackal = 'sand_vein_jackal';
  const skink = 'sand_iron_skink';
  const original = counts(state);
  assert.match(view(state).currentEvent.text, /金眼.*鳞背花斑/);
  hunt(state, 3, skink);
  assert.equal(counts(state)[jackal], original[jackal]);
  assert.match(option(state, 2).lockedReason, new RegExp(`还有\\s*${original[jackal]}\\s*只`));

  for (let i = 0; i < original[jackal]; i++) hunt(state, 1, jackal);
  assert.equal(counts(state)[jackal], 0);
  assert.ok(counts(state)[skink] > 0);
  assert.equal(option(state, 2).available, true);
  play(state, 'beginGather', { index: 2 });
  assert.ok(play(state, 'finishGather').gathered.black_iron > 0);
});
