import test from 'node:test';
import assert from 'node:assert/strict';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, action + ': ' + result.message);
  return result;
}

function walk(state, ...places) {
  for (const id of places) {
    if (state.event) play(state, 'leave');
    if (state.satiety < 45) play(state, 'eat', { id: 'ration' });
    play(state, 'travel', { id });
  }
}

function visit(state, id) {
  if (state.event) play(state, 'leave');
  play(state, 'visit', { id });
}

function fieldChoice(state, index) {
  return play(state, 'choose', { index });
}

const sites = (state) => view(state).sites.map(({ id }) => id);
const jobs = (state) => view(state).sect.jobs;

function footOfTheSlope(state) {
  visit(state, 'lantern_term');
  assert.match(view(state).currentEvent.text, /两个灯钩/);
  fieldChoice(state, 2);
  assert.equal(state.inventory.lantern_route_copy, 1);
  walk(state, 'pine_ridge', 'screen_slope');
  assert.ok(sites(state).includes('slope_lantern_gap'));
  assert.ok(!sites(state).includes('slope_lantern_high'));
  assert.ok(!sites(state).includes('slope_lantern_low'));
  visit(state, 'slope_lantern_gap');
  assert.equal(act(state, 'choose', { index: 1 }).ok, false);
  fieldChoice(state, 0);
  assert.equal(state.inventory.lantern_clasp, 1);
}

test('an unaffiliated traveler can light and report the lower road without a fight', () => {
  const state = createGame(19);
  state.discovered.push('pine_ridge');
  play(state, 'buy', { id: 'wood' });
  walk(state, 'pine_ridge', 'lantern_court');
  play(state, 'localBuy', { id: 'ration', count: 2 });
  assert.ok(!jobs(state).some(({ id }) => id === 'lantern_spare_watch'));
  footOfTheSlope(state);
  const lower = view(state).visibleChoices.find(({ index }) => index === 1);
  const upper = view(state).visibleChoices.find(({ index }) => index === 2);
  assert.equal(lower.available, true);
  assert.match(lower.desc, /照不到旧吊板.*先留着铜扣/);
  assert.equal(upper.available, false);
  assert.match(upper.desc, /浅沟和旧吊板就都能照亮/);
  assert.match(upper.lockedReason, /兽革/);
  assert.match(upper.lockedReason, /寒铁/);
  fieldChoice(state, 1);
  assert.equal(state.inventory.lantern_clasp, undefined);
  assert.equal(state.inventory.lantern_low_note, 1);
  assert.ok(sites(state).includes('slope_lantern_low'));
  assert.ok(!sites(state).includes('slope_lantern_high'));
  visit(state, 'slope_lantern_gap');
  assert.match(view(state).currentEvent.text, /铜扣已经铆进扁石.*旧吊板那头仍旧很暗/);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  visit(state, 'slope_lantern_low');
  play(state, 'beginGather', { index: 0 });
  play(state, 'finishGather');
  assert.equal(view(state).groundLoot.reed, 2);
  walk(state, 'pine_ridge', 'lantern_court');
  const coins = state.coins;
  play(state, 'handin', { id: 'lantern_low_report' });
  assert.equal(state.coins, coins + 10);
  assert.equal(state.world.affiliation, null);
  assert.equal(state.inventory.lantern_low_note, undefined);
  assert.equal(act(state, 'handin', { id: 'lantern_high_report' }).ok, false);
  assert.equal(act(state, 'sectWork', { id: 'lantern_spare_watch' }).ok, false);
});

test('the upper repair opens protected mineral access and members can take a recurring lamp shift', () => {
  const state = createGame(19);
  state.discovered.push('pine_ridge');
  Object.assign(state.inventory, { wood: 10, hide: 4, ore: 2, reed: 7 });
  state.coins = 30;
  walk(state, 'pine_ridge', 'lantern_court');
  play(state, 'sectJoin');
  play(state, 'localBuy', { id: 'ration', count: 2 });
  assert.ok(!jobs(state).some(({ id }) => id === 'lantern_spare_watch'));
  footOfTheSlope(state);
  assert.deepEqual(view(state).visibleChoices.filter(({ available }) => available).map(({ index }) => index), [1, 2]);
  fieldChoice(state, 2);
  assert.equal(state.inventory.lantern_high_note, 1);
  assert.ok(sites(state).includes('slope_lantern_high'));
  assert.ok(sites(state).includes('slope_lantern_low'));
  visit(state, 'slope_lantern_high');
  assert.equal(act(state, 'beginGather', { index: 2 }).ok, false);
  play(state, 'beginGather', { index: 0 });
  play(state, 'finishGather');
  assert.equal(view(state).groundLoot.core, 2);
  walk(state, 'pine_ridge', 'lantern_court');
  play(state, 'handin', { id: 'lantern_high_report' });
  const coins = state.coins;
  const day = state.day;
  play(state, 'sectWork', { id: 'lantern_spare_watch' });
  assert.equal(state.coins, coins + 8);
  assert.equal(state.day, day + 0.5);
  assert.equal(view(state).affiliation.credit, 2);
  const until = jobs(state).find(({ id }) => id === 'lantern_spare_watch');
  assert.equal(until.nextAt, state.day + 5);
  assert.match(until.reason, /5日后再来/);
  assert.equal(act(state, 'sectWork', { id: 'lantern_spare_watch' }).ok, false);
});

test('the nominal title is already on the register and ward cooldown uses elapsed time', () => {
  const state = createGame(19);
  state.discovered.push('pine_ridge');
  Object.assign(state.inventory, { wood: 10, hide: 3, reed: 8 });
  state.coins = 30;
  walk(state, 'pine_ridge', 'lantern_court');
  play(state, 'sectJoin');
  const title = view(state).sect.ranks[0];
  assert.equal(title.name, '候灯人');
  assert.equal(title.honorary, true);
  assert.equal(title.available, false);
  assert.equal(act(state, 'sectClaim', { id: title.id }).ok, false);
  play(state, 'sectWork', { id: 'lantern_shift' });
  const job = () => jobs(state).find(({ id }) => id === 'lantern_shift');
  assert.match(job().reason, /7日后再来/);
  play(state, 'wait');
  assert.match(job().reason, /6.5日后再来/);
});

test('spirit guard expires after reading through an opponent’s own guard', () => {
  const state = createGame(19);
  state.knownItems.push('phase_chart');
  state.region = 'zhao_city';
  Object.assign(state.inventory, { qi_core: 2, core: 3 });
  state.coins = 40;
  play(state, 'trainStudy', { id: 'spirit' });
  state.region = 'reed_meadows';
  visit(state, 'meadow_ruts');
  fieldChoice(state, 0);
  play(state, 'guard');
  state.combat.plan.reader = null;
  const unread = structuredClone(state);
  play(state, 'readSpirit');
  assert.equal(view(state).intent.kind, 'guard');
  assert.equal(play(state, 'attack').enemyMove.kind, 'guard');
  assert.equal(play(unread, 'attack').enemyMove.kind, 'guard');
  const followed = play(state, 'attack');
  const ordinary = play(unread, 'attack');
  assert.equal(followed.enemyMove.kind, 'heavy');
  assert.equal(followed.damageTaken, ordinary.damageTaken);
});

test('the ladder passage stays open when clear even if its iron deposit is empty', () => {
  const state = createGame(19);
  state.region = 'fish_ladder';
  state.realm = 6;
  state.hp = view(state).maxHp;
  visit(state, 'ladder_drop');
  const site = () => view(state).sites.find(({ id }) => id === 'ladder_drop');
  while (site().creatures.river_gateback > 0) {
    fieldChoice(state, 1);
    while (state.combat) play(state, 'attack');
  }
  while (site().stocks.ore > 0) {
    play(state, 'beginGather', { index: 2 });
    play(state, 'finishGather');
  }
  assert.match(view(state).currentEvent.text, /铁砂筛光/);
  assert.match(view(state).currentEvent.text, /能踩到底下的槽边/);
  assert.equal(site().stocks.ore, 0);
});
