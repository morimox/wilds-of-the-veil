import assert from 'node:assert/strict';
import test from 'node:test';
import { alchemyData } from './alchemy.mjs';
import { data } from './data.mjs';
import { act, view } from './engine.mjs';
import { createQuietGame } from './game-test-fixtures.mjs';
import { progressionReissues } from './progression-recovery.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function refuseUnchanged(state, action, payload, reason) {
  const before = structuredClone(state);
  const refused = act(state, action, payload);
  assert.equal(refused.ok, false, `${action}: ${refused.message}`);
  if (reason) assert.match(refused.message, reason);
  assert.deepEqual(state, before);
}

function brew(state, recipe, id) {
  play(state, 'econStart', { id: recipe });
  const job = state.economy.jobs.find(({ loot }) => loot[id]);
  assert.ok(job);
  while (state.day < job.readyDay) play(state, 'wait');
  play(state, 'econCollect', { id: job.id });
  assert.ok(state.inventory[id] > 0);
}

test('verifying the three seals opens paid repeat foundation charges and a second real furnace batch', () => {
  const state = createQuietGame(90);
  const { refill, inquiry } = alchemyData;
  state.realm = 2;
  state.coins = 340;
  state.knownItems.push('clinic_note', 'furnace_sketch', 'formula_foundation');
  state.economy.buildings.furnace = 2;
  state.economy.warehouse = { reed: 16, kiln_clay: 3, core: 12, black_iron: 8, qi_core: 48 };
  refuseUnchanged(state, 'alchemyAdvance', { id: refill.id }, /三印还没有对完/);
  state.alchemy.inquiryIndex = inquiry.length;
  state.inventory.foundation_charge = 1;
  refuseUnchanged(state, 'alchemyAdvance', { id: refill.id }, /已经备了/);
  brew(state, 'r_foundation', 'foundation_pill');
  play(state, 'discard', { id: 'foundation_pill' });
  assert.equal(state.inventory.foundation_pill, undefined);
  assert.equal(state.ground.village.foundation_pill, 1);

  const open = view(state).alchemy.inquiry;
  assert.equal(open.id, refill.id);
  assert.deepEqual(open.need, refill.need);
  const coins = state.coins;
  const day = state.day;
  state.coins = refill.price - 1;
  refuseUnchanged(state, 'alchemyAdvance', { id: refill.id }, /灵钱/);
  state.coins = coins;
  play(state, 'alchemyAdvance', { id: refill.id });
  assert.equal(state.day - day, refill.days);
  assert.equal(state.coins, coins - refill.price);
  assert.equal(state.economy.warehouse.kiln_clay, undefined);
  assert.equal(state.inventory.foundation_charge, 1);
  brew(state, 'r_foundation', 'foundation_pill');
  assert.equal(state.inventory.foundation_pill, 1);
  assert.equal(state.ground.village.foundation_pill, 1);
});

function renewedMaterial(state, { region, site, id, index, firstClaim, interval }) {
  state.region = region;
  state.discovered.push(region);
  state.knownItems.push('undertow_entry', 'sand_well_open');
  state.satiety = 100;
  play(state, 'visit', { id: site });
  assert.ok(!view(state).visibleChoices.some(({ index: choice }) => choice === index));
  play(state, 'leave');
  state.seenChoices.push(`${site}:${firstClaim}`);
  play(state, 'visit', { id: site });
  const harvest = () => {
    if (state.satiety <= 18) play(state, 'eat', { id: 'ration' });
    const prior = state.inventory[id] ?? 0;
    play(state, 'beginGather', { index });
    play(state, 'finishGather');
    assert.equal(state.inventory[id] ?? 0, prior);
    play(state, 'take', { id });
    assert.equal(state.inventory[id], prior + 1);
  };
  while (view(state).visibleChoices.find(({ index: choice }) => choice === index).available) harvest();
  const emptyAt = state.day;
  assert.match(view(state).visibleChoices.find(({ index: choice }) => choice === index).lockedReason, /采空/);
  play(state, 'leave');
  while (state.day < emptyAt + interval) {
    if (state.satiety <= 24) play(state, 'eat', { id: 'ration' });
    play(state, 'wait');
  }
  play(state, 'visit', { id: site });
  harvest();
  play(state, 'leave');
}

test('the former one-time gold powder reagents reappear as manual field harvests and support repeat batches', () => {
  const state = createQuietGame(91);
  state.realm = 5;
  state.inventory.ration = 30;
  renewedMaterial(state, { region: 'undertow_grotto', site: 'undertow_bed', id: 'heart_silt', index: 3, firstClaim: 1, interval: 9 });
  renewedMaterial(state, { region: 'stillwell_vault', site: 'sand_stillwell_vault', id: 'stillwell_salt', index: 2, firstClaim: 1, interval: 11 });
  assert.ok(state.inventory.heart_silt >= 2);
  assert.ok(state.inventory.stillwell_salt >= 2);
  state.region = 'village';
  state.coins = 300;
  state.knownItems.push('furnace_sketch', 'gold_formula');
  state.economy.buildings.furnace = 3;
  state.economy.warehouse = { reed: 36, core: 32, black_iron: 20, foundation_core: 56 };
  brew(state, 'r_gold_powder', 'gold_powder');
  play(state, 'discard', { id: 'gold_powder' });
  brew(state, 'r_gold_powder', 'gold_powder');
  assert.equal(state.inventory.gold_powder, 1);
  assert.equal(state.coins, 64);
});

test('a discarded progression proof can be replaced at its source without repeating the preceding fight', () => {
  for (const { site: id, item, need, days } of progressionReissues) {
    const state = createQuietGame(12);
    const site = data.sites.find((row) => row.id === id);
    const event = data.events.find((row) => row.id === id);
    const index = event.choices.findIndex((choice) => choice.reissue?.item === item);
    assert.ok(index >= 0, item);
    state.region = site.region;
    state.discovered.push(site.region);
    if (site.reveal?.item) state.knownItems.push(site.reveal.item);
    if (site.afterChoices) state.seenChoices.push(...site.afterChoices);
    state.satiety = 100;
    play(state, 'visit', { id });
    const option = () => view(state).visibleChoices.find((choice) => choice.index === index);
    assert.equal(option(), undefined, item);
    state.knownItems.push(item);
    state.inventory[item] = 1;
    assert.equal(option(), undefined, item);
    play(state, 'discard', { id: item });
    assert.match(option().lockedReason, /还缺/);
    refuseUnchanged(state, 'choose', { index }, /还缺/);
    Object.assign(state.inventory, need);
    const timestamp = state.day;
    play(state, 'choose', { index });
    assert.equal(state.day - timestamp, days, item);
    assert.equal(state.inventory[item], 1, item);
    assert.equal(state.ground[id][item], 1, item);
    play(state, 'visit', { id });
    assert.equal(option(), undefined, item);
  }
});

test('replacement seals remain valid chapter and final turn-ins', () => {
  const state = createQuietGame(12);
  state.knownItems.push('ford_chart', 'seal', 'sky_seal');
  state.inventory.ore = 5;
  state.inventory.wood = 2;
  state.inventory.core = 2;
  for (const item of ['seal', 'sky_seal']) {
    const { site: id, beforeQuest } = progressionReissues.find((row) => row.item === item);
    const site = data.sites.find((row) => row.id === id);
    const index = data.events.find((row) => row.id === id).choices.findIndex((choice) => choice.reissue?.item === item);
    state.satiety = 100;
    state.region = site.region;
    state.discovered.push(site.region);
    state.seenChoices.push(...site.afterChoices);
    play(state, 'visit', { id });
    play(state, 'choose', { index });
    state.region = 'village';
    play(state, 'handin', { id: beforeQuest });
    assert.equal(state.inventory[item], undefined);
    assert.ok(state.completedQuests.includes(beforeQuest));
    play(state, 'resume');
  }
  assert.equal(state.finalWon, true);
});
