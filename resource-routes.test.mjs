import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

const option = (state, index) => view(state).visibleChoices.find((choice) => choice.index === index);
const stocks = (state) => view(state).sites.find(({ id }) => id === state.event).stocks;

function useGathering(state, index) {
  play(state, 'beginGather', { index });
  return play(state, 'finishGather');
}

test('a pick crafted from the miner’s sample speeds slope work without duplicating its stock', () => {
  const state = createGame();
  state.region = 'ridge';
  state.discovered.push('ridge');
  play(state, 'visit', { id: 'ore_rain' });
  assert.equal(option(state, 4), undefined);
  play(state, 'choose', { index: 2 });
  assert.ok(state.inventory.blade_template);
  play(state, 'leave');
  play(state, 'travel', { id: 'village' });
  state.economy.buildings.forge = 1;
  state.inventory.ore = 4;
  state.inventory.wood = 2;
  state.knownItems.push('ore', 'wood');
  play(state, 'econStart', { id: 'r_miner_pick' });
  if (state.satiety < 30) play(state, 'eat', { id: 'ration' });
  play(state, 'econWait', { id: 'forge' });
  const [job] = view(state).economy.facilities.find(({ id }) => id === 'forge').jobs;
  assert.equal(job.ready, true);
  play(state, 'econCollect', { id: job.id });
  assert.equal(state.inventory.miner_pick, 1);
  state.satiety = 100;
  play(state, 'travel', { id: 'ridge' });
  play(state, 'visit', { id: 'ore_rain' });
  assert.match(option(state, 4).lockedReason, /副手.*短柄矿镐/);
  play(state, 'equip', { id: 'miner_pick' });
  const before = structuredClone(state);
  const worn = structuredClone(state);
  worn.durability.miner_pick = 1;
  assert.match(useGathering(worn, 4).message, /短柄矿镐已损坏/);
  assert.equal(option(worn, 4).available, false);
  const stock = stocks(state).ore_slope;
  const faster = useGathering(state, 4);
  const ordinary = useGathering(before, 1);
  assert.equal(state.day < before.day, true);
  assert.equal(faster.gathered.ore, 4);
  assert.equal(ordinary.gathered.ore, 3);
  assert.equal(stocks(state).ore_slope, stock - 4);
  assert.equal(state.durability.miner_pick, 17);
  assert.equal(faster.injury, undefined);
  assert.equal(ordinary.injury.amount, 6);
  state.durability.miner_pick = 0;
  assert.equal(option(state, 4).available, false);
  assert.equal(option(state, 1).available, true);
});

test('the back of the sill offers one safe batch only while the tide has time to stay down', () => {
  const state = createGame();
  state.region = 'ford';
  state.satiety = 100;
  state.day = 1.25;
  play(state, 'visit', { id: 'low_tide' });
  assert.match(view(state).currentEvent.text, /石板还淹着/);
  assert.match(option(state, 6).lockedReason, /每隔两日/);
  assert.equal(option(state, 0).available, true);
  assert.equal(option(state, 2).available, true);
  state.day = 2.125;
  assert.match(view(state).currentEvent.text, /石板露出水面/);
  const old = stocks(state).core_silt;
  const result = useGathering(state, 6);
  assert.equal(result.gathered.core, 2);
  assert.equal(stocks(state).core_silt, old - 2);
  assert.equal(state.combat, null);
  assert.match(option(state, 6).lockedReason, /来不及/);
  assert.equal(option(state, 2).available, false);
});

test('repairing the winch adds a fair repeatable food trade with a real cooldown', () => {
  const state = createGame();
  state.region = 'black_mine';
  Object.assign(state.inventory, { black_iron: 6, kiln_clay: 4, meat_broth: 2, wood: 1 });
  state.satiety = 100;
  play(state, 'visit', { id: 'winch_house' });
  assert.equal(option(state, 2), undefined);
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory.snow_token, 1);
  play(state, 'choose', { index: 2 });
  assert.equal(state.inventory.core, 4);
  assert.equal(state.inventory.meat_broth, undefined);
  assert.equal(state.inventory.wood, undefined);
  assert.equal(state.coins, 15);
  assert.match(option(state, 2).lockedReason, /4 日后/);
  Object.assign(state.inventory, { meat_broth: 2, wood: 1 });
  state.day += 4;
  assert.equal(option(state, 2).available, true);
  play(state, 'choose', { index: 2 });
  assert.equal(state.inventory.core, 8);
  assert.equal(state.coins, 10);
});
