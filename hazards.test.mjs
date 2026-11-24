import assert from 'node:assert/strict';
import test from 'node:test';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';
import { hazardData } from './hazards.mjs';

const { inn, rill, dunes, site, trace, enemy, jobs } = hazardData;
const farm = 'kiln_roof_farm';

function play(state, action, payload, count) {
  const result = act(state, action, payload);
  if (count) count.actions++;
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function at(region) {
  const state = createGame(19);
  state.region = region;
  state.satiety = 100;
  state.day = 17;
  return state;
}

function to(state, id, count) {
  return play(state, 'travel', { id }, count);
}

function job(state, id, count) {
  return play(state, 'hazard', { id }, count);
}

function offer(state, id) {
  return view(state).localHazard?.actions.find(entry => entry.id === id);
}

function materials(state, count) {
  to(state, rill, count);
  const pit = 'sand_gravel_rill';
  play(state, 'visit', { id: pit }, count);
  for (const [index, id] of ['wood', 'ore'].entries()) {
    play(state, 'beginGather', { index }, count);
    play(state, 'finishGather', undefined, count);
    play(state, 'take', { id }, count);
  }
  play(state, 'leave', undefined, count);
  to(state, inn, count);
}

function reported(count, prepare = false) {
  const state = at(inn);
  state.discovered.push(inn, farm);
  state.world.lastSettlement = inn;
  assert.equal(view(state).localHazard, null);
  assert.equal(act(state, 'hazard', { id: 'report' }).ok, false);
  to(state, farm, count);
  to(state, dunes, count);
  play(state, 'visit', { id: site }, count);
  play(state, 'choose', { index: 0 }, count);
  assert.equal(state.inventory[trace], 1);
  to(state, farm, count);
  to(state, inn, count);
  assert.equal(view(state).localHazard.phase, 'report');
  play(state, 'eat', { id: 'ration' }, count);
  if (prepare) materials(state, count);
  play(state, 'eat', { id: 'ration' }, count);
  job(state, 'report', count);
  assert.equal(view(state).localHazard.phase, 'warning');
  assert.equal(act(state, 'hazard', { id: 'report' }).ok, false);
  return state;
}

test('locals can turn the water away and evacuate animals without combat', (t) => {
  const count = { actions: 0 };
  const state = reported(count);
  assert.match(offer(state, 'brace').reason, /寒铁/);
  job(state, 'move', count);
  to(state, farm, count);
  to(state, dunes, count);
  if (view(state).localHazard.phase === 'warning') {
    assert.equal(offer(state, 'fight'), undefined);
  }
  job(state, 'look', count);
  assert.equal(view(state).localHazard.phase, 'surge');
  assert.ok(offer(state, 'fight'));
  to(state, farm, count);
  to(state, rill, count);
  job(state, 'divert', count);
  assert.equal(view(state).localHazard.phase, 'aftermath');
  assert.match(view(state).localHazard.desc, /水正顺旧槽/);
  to(state, inn, count);
  assert.match(view(state).localHazard.desc, /栏杆还立着.*一头没少/);
  assert.equal(offer(state, 'repair'), undefined);
  assert.equal(state.combat, null);
  const before = state.coins;
  job(state, 'settle', count);
  assert.equal(state.coins - before, jobs.move.reward + jobs.divert.reward);
  assert.equal(act(state, 'hazard', { id: 'settle' }).ok, false);
  t.diagnostic(`${count.actions} player actions and ${state.day - 17} game days from the inn through the payout`);
});

test('a prepared fighter can brace the enclosure and stop the chasing jackal', (t) => {
  const count = { actions: 0 };
  const state = reported(count, true);
  assert.equal(offer(state, 'brace').reason, '');
  const beforeWood = state.inventory.wood;
  job(state, 'brace', count);
  assert.equal(state.inventory.ore ?? 0, 0);
  assert.equal(state.inventory.wood ?? 0, beforeWood - 2);
  state.inventory.tide_spear = 1;
  state.durability.tide_spear = 28;
  state.realm = 3;
  play(state, 'equip', { id: 'tide_spear' }, count);
  to(state, farm, count);
  to(state, dunes, count);
  while (view(state).localHazard.phase === 'warning') play(state, 'wait', undefined, count);
  job(state, 'fight', count);
  assert.equal(state.combat?.id, enemy);
  for (let turn = 0; state.combat && turn < 9; turn++) {
    play(state, 'attack', undefined, count);
  }
  assert.ok(state.defeated.includes(enemy));
  assert.equal(view(state).groundLoot.qi_core, 2);
  play(state, 'take', { id: 'qi_core' }, count);
  play(state, 'leave', undefined, count);
  assert.equal(offer(state, 'fight'), undefined);
  to(state, farm, count);
  to(state, inn, count);
  if (state.inventory.ration) play(state, 'eat', { id: 'ration' }, count);
  while (view(state).localHazard.phase !== 'aftermath') play(state, 'wait', undefined, count);
  assert.match(view(state).localHazard.desc, /栏杆还立着/);
  const before = state.coins;
  job(state, 'settle', count);
  assert.equal(state.coins - before, jobs.brace.reward + jobs.fight.reward);
  t.diagnostic(`${count.actions} actions and ${state.day - 17} game days for the preparation and combat route`);
});

test('waiting out the tide leaves a recoverable damaged rail and a single paid repair', () => {
  const state = reported();
  const active = state.hazards[hazardData.id];
  while (state.day < active.ends) play(state, 'wait');
  assert.match(view(state).localHazard.desc, /挤坏/);
  assert.equal(offer(state, 'settle'), undefined);
  if (state.satiety === 0) {
    play(state, 'rest');
    assert.ok(state.reliefRations);
    play(state, 'eat', { id: 'ration' });
  }
  if (state.satiety < 60 && state.inventory.ration) play(state, 'eat', { id: 'ration' });
  materials(state);
  if (state.satiety === 0) {
    if (!state.inventory.ration) play(state, 'rest');
    play(state, 'eat', { id: 'ration' });
  }
  job(state, 'repair');
  assert.match(view(state).localHazard.desc, /新木撑起/);
  assert.equal(offer(state, 'repair'), undefined);
  const coins = state.coins;
  job(state, 'settle');
  assert.equal(state.coins - coins, jobs.repair.reward);
});

test('fixing the flow while the warning is still in effect resolves it immediately', () => {
  const state = at(rill);
  state.hazards = { [hazardData.id]: { starts: 18, ends: 22, look: true } };
  assert.equal(view(state).localHazard.phase, 'warning');
  job(state, 'divert');
  assert.ok(state.day < state.hazards[hazardData.id].starts);
  assert.equal(view(state).localHazard.phase, 'aftermath');
  assert.equal(offer(state, 'divert'), undefined);
});

test('sheltered people do not build pressure while exposed errands still do', () => {
  const indoor = at(inn);
  for (let i = 0; i < 4; i++) {
    play(indoor, 'visit', { id: 'sand_cinder_kitchen' });
    play(indoor, 'leave');
  }
  assert.equal(indoor.pressure, 0);
  assert.equal(indoor.qi, 12);
  const outdoor = at('wind_slate');
  for (let i = 0; i < 4; i++) {
    play(outdoor, 'visit', { id: 'sand_wind_work' });
    play(outdoor, 'leave');
  }
  assert.equal(outdoor.pressure, 4);
  assert.equal(outdoor.qi, 11);
});

test('separate wind-slate stocks are reflected in their own rock crevices', () => {
  const state = at('wind_slate');
  play(state, 'visit', { id: 'sand_wind_work' });
  assert.match(view(state).currentEvent.text, /看见铁色.*亮着几块/);
  for (let i = 0; i < 3; i++) {
    play(state, 'beginGather', { index: 0 });
    play(state, 'finishGather');
  }
  assert.match(view(state).currentEvent.text, /岩缝已经刮空.*亮着几块/);
  assert.equal(view(state).visibleChoices[1].available, true);
});
