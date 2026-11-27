import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const play = (state, action, options) => {
  const result = act(state, action, options);
  assert.equal(result.ok, true, result.message);
  return result;
};
const travel = (state, id) => play(state, 'travel', { id });
const visit = (state, id) => play(state, 'visit', { id });
const choose = (state, index) => play(state, 'choose', { index });
const scene = (state) => view(state).currentEvent.text;

function gather(state, index, item) {
  play(state, 'beginGather', { index });
  play(state, 'finishGather');
  if (item) play(state, 'take', { id: item });
}

test('each patch of reeds describes its own depletion and regrowth', () => {
  const state = createGame(37540);
  travel(state, 'marsh');
  visit(state, 'reed_banks');
  assert.match(scene(state), /能挖芯的白苇.*长实的苇芯/);
  gather(state, 0, 'reed');
  assert.match(scene(state), /踏石边翻过的泥里只剩.*回水湾里还有长实/);
  assert.deepEqual(view(state).visibleChoices.map(({ available }) => available), [false, true, true]);
  gather(state, 1, 'reed');
  assert.match(scene(state), /踏石边翻过的泥.*回水湾那丛采过了/);

  play(state, 'leave');
  for (let i = 0; i < 15; i++) {
    if (state.satiety < 12) play(state, 'eat');
    play(state, 'wait');
  }
  visit(state, 'reed_banks');
  assert.match(scene(state), /能挖芯的白苇.*长实的苇芯/);
});

test('the repaired channel, released goose, and source of driftwood retain independent states', () => {
  const state = createGame(37540);
  travel(state, 'marsh');
  play(state, 'eat');
  travel(state, 'reed_meadows');
  visit(state, 'meadow_channel');
  choose(state, 3);
  visit(state, 'meadow_channel');
  assert.match(scene(state), /槽板向外翘着.*放走野雁/);
  gather(state, 1, 'wood');
  gather(state, 1, 'wood');
  assert.match(scene(state), /漂木已清开/);
  choose(state, 2);
  visit(state, 'meadow_channel');
  assert.match(scene(state), /新换的槽板撑稳了.*先前放走野雁/);
  assert.ok(!view(state).visibleChoices.some(({ index }) => index === 2 || index === 3));
});

test('the dry wood and paper scraps in the rain shelter leave distinct changes behind', () => {
  const state = createGame(37540);
  travel(state, 'marsh');
  play(state, 'eat');
  visit(state, 'mud_track');
  choose(state, 3);
  visit(state, 'old_fire');
  gather(state, 1, 'wood');
  gather(state, 1, 'wood');
  assert.match(scene(state), /露着一角破瓦.*夹着一点纸边.*石板底下已经空了/);
  choose(state, 2);
  assert.equal(state.event, 'old_fire');
  assert.match(scene(state), /瓦角的地方还留着.*夹着一点纸边.*石板底下已经空了/);
  choose(state, 3);
  assert.equal(state.event, 'old_fire');
  play(state, 'leave');
  visit(state, 'old_fire');
  assert.match(scene(state), /瓦角的地方还留着.*砖缝里留下一缕松灰.*石板底下已经空了/);
});

test('the dike spar keeps its agreed safety and never gives the route map for withdrawing or losing', () => {
  const start = () => {
    const state = createGame(37540);
    travel(state, 'marsh');
    visit(state, 'bank_watch');
    choose(state, 0);
    assert.equal(view(state).currentEnemy.sparring, true);
    return state;
  };
  const withdrawal = start();
  play(withdrawal, 'attack');
  const { hp, durability, coins } = structuredClone(withdrawal);
  assert.match(play(withdrawal, 'retreat').message, /收了招/);
  assert.equal(withdrawal.hp, hp);
  assert.deepEqual(withdrawal.durability, durability);
  assert.equal(withdrawal.coins, coins);
  assert.equal(withdrawal.inventory.ridge_rubbing, undefined);

  const loss = start();
  loss.hp = 1;
  assert.match(play(loss, 'attack').message, /收手/);
  assert.equal(loss.region, 'marsh');
  assert.equal(loss.coins, coins);
  assert.equal(loss.wounds, 0);
  assert.equal(loss.inventory.ridge_rubbing, undefined);
  assert.ok(!view(loss).visibleChoices.some(({ index }) => index === 2));
});
