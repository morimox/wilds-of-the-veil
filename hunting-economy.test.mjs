import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { economyData } from './economy.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action} ${JSON.stringify(payload)}: ${result.message}`);
  return result;
}

function deny(state, action, payload) {
  const before = structuredClone(state);
  assert.equal(act(state, action, payload).ok, false);
  assert.deepEqual(state, before);
}

function hunt(state, site, foe, art) {
  const event = data.events.find(({ id }) => id === site);
  const index = event.choices.findIndex(({ enemy }) => enemy === foe);
  assert.notEqual(index, -1);
  play(state, 'visit', { id: site });
  play(state, 'choose', { index });
  assert.equal(view(state).currentEnemy.id, foe);
  for (let round = 0; state.combat && round < 24; round++) {
    if (view(state).intent.kind === 'heavy') play(state, 'guard');
    else if (art && state.qi >= art.cost) play(state, 'art', { id: art.id });
    else play(state, 'attack');
  }
  assert.equal(state.combat, null);
  assert.ok(state.defeated.includes(foe));
  assert.equal(view(state).currentEvent?.id, site);
}

function readyHearth(state) {
  return view(state).economy.facilities.find(({ id }) => id === 'hearth');
}

test('a fresh hunt leaves anatomy outside the bag until the player picks what to take', () => {
  const state = createGame();
  const openingCoins = state.coins;
  const openingBag = { ...state.inventory };
  const openingSatiety = state.satiety;
  assert.equal(readyHearth(state), undefined);

  play(state, 'travel', { id: 'marsh' });
  hunt(state, 'mud_track', 'mud_beast');
  assert.deepEqual(state.inventory, openingBag);
  assert.deepEqual(view(state).groundLoot, { beast_meat: 2, hide: 2, qi_core: 1 });
  assert.deepEqual(state.expeditionLoot, {});
  assert.equal(state.coins, openingCoins);
  assert.ok(state.satiety < openingSatiety);
  assert.equal(state.didEat, false);
  assert.equal(readyHearth(state), undefined);
  assert.equal(view(state).groundPickup.beast_meat, 2);
  deny(state, 'take', { id: 'beast_meat', count: 3 });
  deny(state, 'take', { id: 'beast_meat', count: 1.5 });
  play(state, 'take', { id: 'beast_meat', count: 1 });
  assert.equal(state.inventory.beast_meat, 1);
  assert.equal(view(state).groundLoot.beast_meat, 1);
  assert.equal(state.expeditionLoot.beast_meat, 1);
  assert.equal(state.inventory.qi_core, undefined);
  play(state, 'take', { id: 'qi_core' });
  play(state, 'take', { id: 'hide' });
  deny(state, 'use', { id: 'beast_meat' });

  play(state, 'leave');
  play(state, 'travel', { id: 'village' });
  assert.deepEqual(view(state).groundLoot, {});
  assert.equal(readyHearth(state).level, 0);
  assert.deepEqual(readyHearth(state).projects.map(({ id }) => id), ['simmer_meat_broth']);
  deny(state, 'sell', { id: 'beast_meat' });
  play(state, 'sell', { id: 'hide' });
  assert.equal(state.inventory.hide, 1);
  deny(state, 'buy', { id: 'qi_core' });
  play(state, 'sell', { id: 'qi_core' });
  assert.equal(state.coins, openingCoins + 10);
  assert.equal(state.inventory.qi_core, undefined);
});

test('the renewable snow beast yields two foundation cores that sell for 21 each', () => {
  const state = createGame();
  // Start with earned equipment already fitted to isolate the snow fight and its population clock.
  state.realm = 3;
  state.region = 'snow_pass';
  state.discovered.push('snow_pass');
  state.equipment = { weapon: 'sky_sword', armor: 'sky_cloak', charm: 'jade_pendant' };
  state.inventory = { ration: 14, sky_sword: 1, sky_cloak: 1, jade_pendant: 1 };
  for (const id of Object.values(state.equipment)) {
    state.durability[id] = data.gear.find((gear) => gear.id === id).durability;
  }
  state.satiety = 100;
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.knownArts.push('sky_axis');
  const art = data.arts.find(({ id }) => id === 'sky_axis');
  const openingCoins = state.coins;
  hunt(state, 'white_ravine', 'snow_warden', art);
  assert.equal(state.region, 'snow_pass');
  assert.equal(state.coins, openingCoins);
  assert.deepEqual(state.inventory, { ration: 14, sky_sword: 1, sky_cloak: 1, jade_pendant: 1 });
  assert.deepEqual(view(state).groundLoot, { beast_meat: 5, hide: 4, beast_eye: 1, foundation_core: 2 });
  play(state, 'take', { id: 'foundation_core' });
  play(state, 'take', { id: 'beast_eye' });
  assert.deepEqual(view(state).groundLoot, { beast_meat: 5, hide: 4 });

  play(state, 'leave');
  const population = () => view(state).sites.find(({ id }) => id === 'white_ravine').creatures.snow_warden;
  const interval = data.sites.find(({ id }) => id === 'white_ravine').creatures.snow_warden.interval;
  const dayWon = state.day;
  assert.equal(population(), 0);
  while (state.day + rules.waitDays < dayWon + interval) {
    if (state.satiety <= 10) play(state, 'eat');
    play(state, 'wait');
  }
  assert.equal(population(), 0);
  if (state.satiety <= 10) play(state, 'eat');
  play(state, 'wait');
  assert.equal(population(), 1);
  play(state, 'travel', { id: 'village' });
  deny(state, 'sell', { id: 'beast_eye' });
  play(state, 'sell', { id: 'foundation_core', count: 2 });
  assert.equal(state.coins, openingCoins + 42);
  assert.equal(state.inventory.foundation_core, undefined);
});

test('stored meat cooks through the three successive dishes, and only eating applies the stated recovery', () => {
  const state = createGame();
  // Supplies are pre-gathered so this test isolates furnace level, production timing and consumption.
  state.coins = 100;
  const ingredients = { beast_meat: 7, wood: 30, reed: 12, ore: 8, kiln_clay: 6, millet_grain: 4 };
  for (const [id, amount] of Object.entries(ingredients)) {
    state.inventory[id] = amount;
    state.knownItems.push(id);
    play(state, 'econDeposit', { id, count: amount });
  }
  const canSee = (id) => readyHearth(state).projects.some((project) => project.id === id);
  assert.equal(canSee('cook_herb_stew'), false);
  assert.equal(canSee('cook_crystal_feast'), false);
  deny(state, 'econStart', { id: 'simmer_meat_broth' });
  play(state, 'econBuild', { id: 'hearth' });

  const dishes = [
    { project: 'simmer_meat_broth', food: 'meat_broth', count: 1, satiety: 44, hp: 3 },
    { project: 'cook_herb_stew', food: 'herb_stew', count: 2, satiety: 56, hp: 5 },
    { project: 'cook_crystal_feast', food: 'crystal_feast', count: 3, satiety: 72, hp: 8 },
  ];
  for (const [index, dish] of dishes.entries()) {
    if (index === 1) {
      deny(state, 'econStart', { id: dish.project });
      play(state, 'econBuild', { id: 'hearth' });
    }
    assert.ok(canSee(dish.project));
    const recipe = economyData.projects.find(({ id }) => id === dish.project);
    const inventoryBefore = { ...state.economy.warehouse };
    const coinsBefore = state.coins;
    const dayBefore = state.day;
    state.hp = 12;
    state.satiety = 75;
    play(state, 'econStart', { id: dish.project });
    assert.equal(state.coins, coinsBefore - recipe.cost);
    for (const [id, count] of Object.entries(recipe.need)) {
      assert.equal(state.economy.warehouse[id] ?? 0, inventoryBefore[id] - count);
    }
    const job = readyHearth(state).jobs[0];
    deny(state, 'econCollect', { id: job.id });
    while (!readyHearth(state).jobs[0].ready) play(state, 'wait');
    assert.ok(state.day >= dayBefore + recipe.days);
    play(state, 'econCollect', { id: job.id });
    assert.equal(state.inventory[dish.food], dish.count);
    assert.equal(state.hp, 12);
    assert.ok(state.satiety < 75);

    state.satiety = 20;
    play(state, 'use', { id: dish.food });
    assert.equal(state.satiety, 20 + dish.satiety);
    assert.equal(state.hp, 12 + dish.hp);
    assert.equal(state.inventory[dish.food] ?? 0, dish.count - 1);
  }
  state.satiety = 80;
  state.hp = view(state).maxHp - 1;
  play(state, 'use', { id: 'crystal_feast' });
  assert.equal(state.hp, view(state).maxHp);
  assert.equal(state.satiety, rules.maxSatiety);
  deny(state, 'use', { id: 'crystal_feast' });
  assert.equal(state.inventory.crystal_feast, 1);
});
