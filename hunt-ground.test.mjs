import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';

const herb = {
  site: 'herb_den', region: 'herb_basin', lead: 'mist_shelter',
  chief: 'herb_den_elder', counts: [24, 8, 6, 1],
  observation: /干岸.*颈甲/, healing: 10, cooldown: 2.25,
};
const quarry = {
  site: 'sand_hunt_colony', region: 'hanging_vein', lead: 'sand_hunt_anchors',
  chief: 'sand_quarry_matriarch', counts: [48, 24, 8, 1],
  observation: /石台.*背棘/, healing: 12, cooldown: 2.5,
};

function play(state, action, detail = {}) {
  const result = act(state, action, detail);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function arrive(ground, seed = 1, creatures = null) {
  const state = createGame(seed);
  state.region = ground.region;
  state.discovered.push(ground.region);
  state.world.arrived = true;
  state.realm = 8;
  for (const id of ['foil_sword', 'fault_coat', 'jade_pendant']) {
    state.inventory[id] = 1;
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
    play(state, 'equip', { id });
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.inventory.wood = 6;
  state.inventory.ration = 6;
  state.satiety = 100;
  state.knownArts.push('sky_axis');
  play(state, 'visit', { id: ground.lead });
  play(state, 'choose', { index: 1 });
  if (state.event) play(state, 'leave');
  if (creatures) {
    const members = Object.keys(data.sites.find(({ id }) => id === ground.site).creatures);
    state.localPools[ground.site] = { creatures: Object.fromEntries(
      members.map((id, index) => [id, { count: creatures[index] ?? 0, nextAt: null }]),
    ) };
  }
  play(state, 'visit', { id: ground.site });
  return state;
}

const option = (state, index) => view(state).visibleChoices.find((entry) => entry.index === index);
const residents = (state, ground) => Object.values(view(state).sites.find(({ id }) => id === ground.site).creatures);

function finishFight(state) {
  for (let i = 0; state.combat && i < 20; i++) {
    const intent = view(state).intent.kind;
    if (state.qi >= 7 && intent !== 'guard') play(state, 'art', { id: 'sky_axis' });
    else play(state, 'attack');
  }
  assert.ok(state.event);
  assert.equal(state.combat, null);
}

for (const ground of [herb, quarry]) {
  test(`either approach can meet the chief on the first draw at ${ground.site}`, () => {
    const rolls = Array.from({ length: 1_000 }, (_, index) => (Math.imul(index + 1, 2654435761) >>> 0));
    const size = ground.counts.reduce((total, n) => total + n, 0);
    const seed = rolls.find((id) => {
      const roll = ((Math.imul(1664525, id) + 1013904223) >>> 0) / 0x100000000;
      return roll >= (size - 1) / size;
    });
    assert.ok(seed);
    const outer = arrive(ground, seed);
    const inner = arrive(ground, seed);
    assert.deepEqual(residents(inner, ground), ground.counts);
    assert.equal(option(inner, 2), undefined);
    assert.equal(act(inner, 'choose', { index: 2 }).ok, false);
    assert.match(play(inner, 'choose', { index: 1 }).message, ground.observation);
    assert.equal(option(inner, 1), undefined);
    assert.equal(option(inner, 2).available, true);
    play(outer, 'choose', { index: 0 });
    play(inner, 'choose', { index: 2 });
    assert.equal(outer.combat.id, ground.chief);
    assert.equal(inner.combat.id, ground.chief);
    assert.equal(outer.combat.openingRange, false);
    assert.equal(inner.combat.openingRange, true);
    const duration = (state) => data.events.find(({ id }) => id === state.combat.siteId).choices[state.combat.huntChoice].days;
    assert.ok(duration(outer) < duration(inner));
    finishFight(inner);
    assert.deepEqual(residents(inner, ground), [...ground.counts.slice(0, -1), 0]);
    const part = ground === herb ? 'den_neck_plate' : 'quarry_back_spine';
    assert.equal(inner.inventory[part], undefined);
    assert.equal(view(inner).groundLoot[part], 1);
    play(inner, 'take', { id: part });
    assert.equal(inner.inventory[part], 1);
    assert.match(option(inner, 4).lockedReason, new RegExp(`还有 ${size - 1} 只`));
  });

  test(`the temporary rest at ${ground.site} consumes wood and waits for the fire to cool`, () => {
    const state = arrive(ground);
    state.hp -= 20;
    state.qi -= 20;
    const before = { wood: state.inventory.wood, hp: state.hp, qi: state.qi, day: state.day };
    play(state, 'choose', { index: 3 });
    assert.equal(state.event, ground.site);
    assert.equal(state.day, before.day + 0.5);
    assert.equal(state.inventory.wood, before.wood - 1);
    assert.equal(state.hp, before.hp + ground.healing);
    assert.equal(state.qi, before.qi + 8);
    assert.match(option(state, 3).lockedReason, /旧灶|火盆/);
    assert.equal(act(state, 'choose', { index: 3 }).ok, false);
    assert.equal(state.inventory.wood, before.wood - 1);
    const ready = state.day + ground.cooldown;
    play(state, 'leave');
    while (state.day < ready) play(state, 'wait');
    play(state, 'visit', { id: ground.site });
    assert.equal(option(state, 3).available, true);
  });
}

test('only clearing the cave and reconnecting the channel opens its own replenishing herbs', () => {
  const wild = arrive(herb);
  assert.equal(option(wild, 4).available, false);
  assert.equal(option(wild, 5), undefined);
  const state = arrive(herb, 1, [1, 0, 0]);
  play(state, 'choose', { index: 0 });
  finishFight(state);
  assert.deepEqual(residents(state, herb), [0, 0, 0, 0]);
  assert.equal(option(state, 4).available, true);
  play(state, 'choose', { index: 4 });
  assert.equal(option(state, 4), undefined);
  assert.match(view(state).currentEvent.text, /取水槽接好了/);
  const herbs = () => view(state).sites.find(({ id }) => id === herb.site).stocks.reed_water;
  const initial = herbs();
  while (herbs()) {
    play(state, 'beginGather', { index: 5 });
    assert.ok(play(state, 'finishGather').gathered.reed > 0);
  }
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).groundLoot.reed, initial);
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, initial);
  play(state, 'leave');
  for (let step = 0; step < 10; step++) {
    if (state.satiety < 35) play(state, 'eat', { id: 'ration' });
    play(state, 'wait');
  }
  play(state, 'visit', { id: herb.site });
  assert.ok(herbs() > 0);
  assert.deepEqual(residents(state, herb), [0, 0, 0, 0]);
});

test('bringing wood after the last quarry enemy opens the actual old cart road', () => {
  const state = arrive(quarry, 1, [1, 0, 0]);
  const directTo = (id) => view(state).world.roads.find((road) => road.id === id);
  assert.equal(option(state, 4).available, false);
  assert.equal(directTo('cold_kiln'), undefined);
  assert.ok(!state.discovered.includes('cold_kiln'));
  play(state, 'choose', { index: 0 });
  finishFight(state);
  assert.equal(directTo('cold_kiln'), undefined);
  assert.equal(option(state, 4).available, true);
  play(state, 'choose', { index: 4 });
  assert.equal(state.inventory.wood, 4);
  assert.equal(state.inventory.black_iron, 3);
  assert.equal(option(state, 4), undefined);
  assert.match(view(state).currentEvent.text, /冷炉院的烟囱/);
  assert.ok(state.discovered.includes('cold_kiln'));
  play(state, 'leave');
  assert.equal(directTo('cold_kiln')?.days, 0.875);
  play(state, 'travel', { id: 'cold_kiln' });
  assert.equal(state.region, 'cold_kiln');
  assert.equal(directTo(quarry.region)?.days, 0.875);
});
