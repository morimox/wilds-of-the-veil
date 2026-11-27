import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, rules, view } from './engine.mjs';
import { data } from './data.mjs';
import { tournamentData } from './tournament.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, result.message);
  return result;
}

function arriveForCheck(region) {
  const state = createGame(563);
  state.region = region;
  state.coins = 100;
  return state;
}

test('returning to any former sect quotes the same free admission it charges', () => {
  for (const sect of data.sects) {
    const state = arriveForCheck(sect.region);
    Object.assign(state.inventory, sect.join.need);
    assert.equal(view(state).sect.join.coins, sect.join.coins);
    play(state, 'sectJoin');
    play(state, 'sectLeave');
    state.coins = 0;
    const quote = view(state).sect.join;
    assert.equal(quote.returning, true);
    assert.equal(quote.available, true);
    assert.equal(quote.coins, 0);
    assert.deepEqual(quote.need, {});
    assert.match(play(state, 'sectJoin').message, /旧功劳都在|功劳与大比成绩都在/);
    assert.equal(state.coins, 0);
  }
});

test('sect rewards tell players about capacity before the claim and can use a partial stack', () => {
  const state = arriveForCheck('sand_bell_cloister');
  Object.assign(state.inventory, { hide: 4, ore: 6, wood: 4 });
  play(state, 'sectJoin');
  play(state, 'sectWork', { id: 'ring_braces' });
  const rank = () => view(state).sect.ranks[0];
  const filler = 'iron_arrow';
  state.inventory[filler] = (view(state).backpackCapacity - view(state).backpackUsed) * rules.backpackStackSize;
  assert.equal(rank().available, false);
  assert.match(rank().reason, /行囊装不下/);
  const claim = () => act(state, 'sectClaim', { id: rank().id });
  assert.equal(claim().message, rank().reason);
  assert.equal(rank().claimed, false);
  play(state, 'discard', { id: filler, count: rules.backpackStackSize });
  state.inventory.salve = 1;
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  assert.equal(rank().available, true);
  assert.ok(claim().ok);
  assert.equal(state.inventory.salve, 3);
});

test('fixed fixtures and borrowed devices keep their new site states on return', () => {
  const stops = [
    { region: 'dry_sound_bridge', site: 'sand_bridge_rail', index: 1, supplies: { wood: 2 }, changed: /新木顶住了桥板/ },
    { region: 'sand_bell_cloister', site: 'sand_cloister_trial', index: 0, supplies: { ore: 2, core: 1 }, changed: /新铁脚/ },
    { region: 'guest_mill', site: 'sand_guest_miller', index: 0, supplies: { reed: 2 }, changed: /杯子没再漏/ },
    { region: 'zhao_hermit', site: 'zhao_leak_bench', index: 0, supplies: { return_tide_note: 1, wood: 6, ore: 3 }, changed: /漏斗没动/ },
    { region: 'glass_bank', site: 'zhao_glass_net', index: 0, supplies: { ore: 5, wood: 5, core: 2 }, changed: /搁灯的地方空了/ },
    { region: 'cinder_inn', site: 'puzzle_bridge_verse', index: 0, supplies: {}, changed: /少了铜环与小牌/ },
  ];
  for (const { region, site, index, supplies, changed } of stops) {
    const state = arriveForCheck(region);
    Object.assign(state.inventory, supplies);
    play(state, 'visit', { id: site });
    play(state, 'choose', { index });
    if (state.event) play(state, 'leave');
    play(state, 'visit', { id: site });
    const event = view(state).currentEvent;
    assert.match(event.text, changed, site);
    assert.ok(!event.choices.some((row) => row.index === index));
  }
});

test('the tournament distinguishes an unpaid fee from a hungry registered fighter', () => {
  const state = arriveForCheck(tournamentData.region);
  assert.match(act(state, 'tournamentEnroll').message, /只收守尺观弟子/);
  Object.assign(state.inventory, data.measuringSect.join.need);
  play(state, 'sectJoin');
  const fee = tournamentData.stages[0].fee;
  state.coins = fee - 1;
  const earlier = view(state).tournament;
  assert.equal(earlier.canEnroll, false);
  assert.equal(earlier.enrollReason, act(state, 'tournamentEnroll').message);

  state.coins = fee;
  play(state, 'tournamentEnroll');
  state.satiety = 1;
  play(state, 'wait');
  const hungry = view(state).tournament;
  assert.equal(hungry.enrollReason, '');
  assert.equal(hungry.canFight, false);
  assert.match(hungry.fightReason, /空腹/);
  assert.equal(hungry.fightReason, act(state, 'tournamentFight').message);
  play(state, 'eat');
  assert.ok(view(state).tournament.canFight);
  play(state, 'tournamentFight');
  assert.equal(state.coins, 0);
});

test('when the granary shifts on a miss, the saved order resets without losing the prize', () => {
  const state = arriveForCheck('crane_granary');
  const moves = (ids) => ids.forEach((id) => play(state, 'mechanismMove', { id }));
  const read = () => view(state).mechanism;
  play(state, 'visit', { id: 'puzzle_granary_catch' });
  moves(['place_chock', 'wedge_cloth', 'steady_catch']);
  assert.equal(read().sequence.length, 3);
  const missed = play(state, 'mechanismTry');
  assert.equal(missed.injury.amount, 3);
  assert.match(missed.message, /把滑出的石头和木块全取出来/);
  assert.deepEqual(read().sequence, []);
  assert.deepEqual(view(state).groundLoot, {});
  moves(['wedge_cloth', 'place_chock', 'steady_catch']);
  play(state, 'mechanismTry');
  assert.equal(read().complete, true);
  assert.deepEqual(view(state).groundLoot, { ration: 6, wood: 4 });
});
