import assert from 'node:assert/strict';
import test from 'node:test';
import { banditTaleContent } from './bandit-tale-content.mjs';
import { act, createGame, rules, view } from './engine.mjs';
import { prepareQuietRoad } from './game-test-fixtures.mjs';

const [story] = banditTaleContent.fixed;
const [shed, papers, counter] = banditTaleContent.sites.map(({ id }) => id);
const [sackTag, witness, receipts, manual] = banditTaleContent.items.map(({ id }) => id);
const granary = 'crane_granary';
const glass = 'glass_bank';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action} ${JSON.stringify(payload)}: ${result.message}`);
  return result;
}

function canChoose(state, index) {
  return view(state).visibleChoices.some(choice => choice.index === index && choice.available);
}

function meetCarrier(from, to, { full = false, clearPatrol = false } = {}) {
  const state = createGame(731);
  state.region = from;
  state.discovered.push(from, to);
  state.roadSeed = 2081;
  if (clearPatrol) state.siteVictories.bandit_red_rope_den = { bandit_red_rope_chief: 1 };
  if (full) state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  const result = play(state, 'travel', { id: to });
  assert.equal(result.roadInterrupted, true);
  assert.equal(state.roadBandit.fixed, story.id);
  assert.equal(state.banditCrews.ferryWood, undefined);
  return state;
}

function continueTo(state, to) {
  prepareQuietRoad(state);
  play(state, 'roadContinue');
  assert.equal(state.roadTrip, null);
  assert.equal(state.region, to);
}

function walk(state, to) {
  prepareQuietRoad(state);
  play(state, 'travel', { id: to });
  assert.equal(state.roadTrip, null);
  assert.equal(state.region, to);
}

test('the grain carrier can be passed without a fee or a fight and never opens the shed by himself', () => {
  const state = meetCarrier(granary, glass);
  const { bandit } = view(state).roadTrip;
  assert.equal(bandit.fightAllowed, false);
  assert.equal(bandit.passAllowed, true);
  assert.equal(bandit.fee, null);
  assert.equal(act(state, 'banditFight').ok, false);
  const result = play(state, 'banditPass');
  assert.match(result.message, /贴着车边走/);
  assert.equal(state.banditLeads.includes(shed), false);
  assert.equal(state.resolvedBandits.includes(story.id), false);
  continueTo(state, glass);
});

test('both grain resolutions follow real evidence and award the manual with a full bag even after the pirates are defeated', () => {
  const state = meetCarrier(glass, granary, { full: true, clearPatrol: true });
  const capacity = view(state).backpackCapacity;
  assert.equal(view(state).backpackUsed, capacity);
  const remaining = view(state).roadTrip.remainingUnits;
  play(state, 'banditPlot', { id: 'hear_grain_oath' });
  assert.equal(view(state).roadTrip.remainingUnits, remaining);
  continueTo(state, granary);
  assert.ok(view(state).sites.some(site => site.id === shed));
  assert.equal(view(state).sites.some(site => site.id === counter), false);
  play(state, 'visit', { id: shed });
  assert.equal(canChoose(state, 1), false);
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory[sackTag], 1);
  play(state, 'choose', { index: 1 });
  assert.equal(state.inventory[witness], 1);
  assert.equal(view(state).backpackUsed, capacity);
  play(state, 'leave');

  const quietReturn = structuredClone(state);
  play(quietReturn, 'visit', { id: counter });
  assert.equal(canChoose(quietReturn, 1), false);
  play(quietReturn, 'choose', { index: 0 });
  assert.equal(canChoose(quietReturn, 2), false);
  play(quietReturn, 'choose', { index: 1 });
  assert.equal(quietReturn.inventory[manual], undefined);
  assert.equal(view(quietReturn).groundLoot[manual], 1);
  play(quietReturn, 'leave');
  play(quietReturn, 'visit', { id: counter });
  assert.equal(view(quietReturn).groundLoot[manual], 1);
  play(quietReturn, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(quietReturn, 'take', { id: manual });
  assert.equal(quietReturn.inventory[manual], 1);
  assert.equal(act(quietReturn, 'choose', { index: 1 }).ok, false);
  assert.equal(act(quietReturn, 'choose', { index: 2 }).ok, false);

  const publicHearing = structuredClone(state);
  walk(publicHearing, glass);
  play(publicHearing, 'visit', { id: papers });
  play(publicHearing, 'choose', { index: 0 });
  assert.equal(publicHearing.inventory[receipts], 1);
  assert.equal(view(publicHearing).backpackUsed, capacity);
  play(publicHearing, 'leave');
  walk(publicHearing, granary);
  play(publicHearing, 'eat', { id: 'ration' });
  play(publicHearing, 'visit', { id: counter });
  play(publicHearing, 'choose', { index: 0 });
  assert.ok(canChoose(publicHearing, 1) && canChoose(publicHearing, 2));
  assert.equal(canChoose(publicHearing, 3), false);
  const coins = publicHearing.coins;
  play(publicHearing, 'choose', { index: 2 });
  assert.equal(publicHearing.coins, coins + 14);
  assert.equal(publicHearing.inventory[manual], undefined);
  assert.equal(act(publicHearing, 'choose', { index: 1 }).ok, false);
  assert.equal(act(publicHearing, 'choose', { index: 2 }).ok, false);
  play(publicHearing, 'choose', { index: 3 });
  if (view(publicHearing).groundLoot[manual]) {
    play(publicHearing, 'discard', { id: 'ration', count: rules.backpackStackSize });
    play(publicHearing, 'take', { id: manual });
  }
  assert.equal(publicHearing.inventory[manual], 1);
  assert.equal(act(publicHearing, 'choose', { index: 3 }).ok, false);
});
