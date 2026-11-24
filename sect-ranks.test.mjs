import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function job(state, id) {
  return view(state).sect.jobs.find(entry => entry.id === id);
}

function denyUnchanged(state, action, payload) {
  const before = structuredClone(state);
  const result = act(state, action, payload);
  assert.equal(result.ok, false);
  assert.deepEqual(state, before);
  return result.message;
}

test('sect standing unlocks appropriate work independently of cultivation and optional gifts', () => {
  const state = createGame(731);
  assert.equal(view(state).affiliation, null);
  state.region = 'measuring_hall';
  state.discovered.push('measuring_hall', 'old_marker');
  state.coins = 80;
  state.inventory = { cudgel: 1, wood: 12, reed: 11, hide: 3, ore: 8, core: 7, foundation_core: 1 };
  assert.equal(view(state).sect.disciple, null);
  assert.ok(view(state).sites.some(({ id }) => id === 'zhao_bamboo_duel'));
  assert.match(denyUnchanged(state, 'sectWork', { id: 'gauge_posts' }), /还没加入/);

  play(state, 'sectJoin');
  assert.equal(view(state).sect.disciple.name, '外门弟子');
  assert.match(view(state).sect.disciple.role, /木桩/);
  assert.equal(job(state, 'gauge_silt').available, false);
  assert.match(denyUnchanged(state, 'sectWork', { id: 'gauge_silt' }), /内门弟子/);
  assert.match(denyUnchanged(state, 'sectWork', { id: 'gauge_flood_check' }), /执事弟子/);

  const inner = play(state, 'sectWork', { id: 'gauge_posts' });
  assert.match(inner.message, /内门弟子/);
  assert.equal(view(state).sect.disciple.name, '内门弟子');
  assert.equal(view(state).affiliation.disciple.name, '内门弟子');
  assert.equal(view(state).affiliation.disciple.credit, 4);
  assert.equal(job(state, 'gauge_silt').available, true);

  const availableSlots = view(state).backpackCapacity - view(state).backpackUsed;
  state.inventory.iron_arrow = availableSlots * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  const reward = view(state).sect.ranks.find(rank => rank.disciple === '内门弟子');
  assert.match(denyUnchanged(state, 'sectClaim', { id: reward.id }), /行囊装不下/);
  assert.equal(view(state).sect.disciple.name, '内门弟子');
  play(state, 'sectWork', { id: 'gauge_silt' });
  assert.equal(job(state, 'gauge_flood_check').available, false);

  const steward = play(state, 'sectWork', { id: 'gauge_pillbox' });
  assert.match(steward.message, /执事弟子/);
  assert.equal(state.realm, 0);
  assert.equal(view(state).sect.disciple.name, '执事弟子');
  assert.equal(job(state, 'gauge_flood_check').available, true);
  play(state, 'sectWork', { id: 'gauge_flood_check' });
  assert.equal(state.inventory.heal_pill, 1);
  assert.match(denyUnchanged(state, 'sectWork', { id: 'gauge_flood_check' }), /再来/);

  play(state, 'sectClaim', { id: reward.id });
  assert.ok(state.knownArts.includes(reward.art));
  assert.equal(view(state).sect.disciple.name, '执事弟子');
  assert.equal(act(state, 'sectClaim', { id: reward.id }).ok, false);

  play(state, 'travel', { id: 'old_marker' });
  assert.equal(view(state).sect, null);
  assert.equal(view(state).affiliation.disciple.name, '执事弟子');
  play(state, 'travel', { id: 'measuring_hall' });
  const coins = state.coins;
  const credit = view(state).affiliation.credit;
  play(state, 'sectLeave');
  assert.equal(view(state).affiliation, null);
  assert.equal(view(state).sect.disciple, null);
  play(state, 'sectJoin');
  assert.equal(state.coins, coins);
  assert.equal(view(state).affiliation.credit, credit);
  assert.equal(view(state).sect.disciple.name, '执事弟子');
});
