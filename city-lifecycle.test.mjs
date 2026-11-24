import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, view } from './engine.mjs';
import { data } from './data.mjs';

function play(state, action, payload = {}) {
  const out = act(state, action, payload);
  assert.ok(out.ok, `${state.region} ${action}: ${out.message}`);
  return out;
}

function visit(state, id) {
  play(state, 'visit', { id });
}

function choose(state, index) {
  return play(state, 'choose', { index });
}

function finish(state) {
  if (state.event) play(state, 'leave');
}

function travel(state, id) {
  while (state.satiety < 60) play(state, 'eat');
  play(state, 'travel', { id });
}

function throughTown() {
  const state = createGame(154);
  state.region = 'ford';
  state.world.arrived = true;
  state.coins = 100;
  Object.assign(state.inventory, { wood: 4, ore: 2, ration: 16 });
  visit(state, 'ford_packet_boat');
  choose(state, 0);
  travel(state, 'zhao_city');
  while (state.satiety < 75) play(state, 'eat');
  return state;
}

function choice(state, index) {
  return view(state).currentEvent.choices.find(item => item.index === index);
}

test('the official names the water-station witness and quotes the extra fare before issuing the permit', () => {
  const state = throughTown();
  travel(state, 'flood_market');
  travel(state, 'zhao_pass');
  visit(state, 'zhao_ridge_permit');
  assert.equal(choice(state, 0).cost, 11);
  assert.match(choice(state, 0).lockedReason, /漏潮货签/);
  assert.match(choose(state, 2).message, /杨木水栈余节/);
  finish(state);
  travel(state, 'flood_market');
  Object.assign(state.inventory, { wood: 9, hide: 3 });
  visit(state, 'zhao_float_goods');
  choose(state, 0);
  finish(state);
  travel(state, 'zhao_pass');
  visit(state, 'zhao_ridge_permit');
  const coins = state.coins;
  assert.equal(choice(state, 0).available, true);
  choose(state, 0);
  assert.equal(coins - state.coins, 11);
  assert.equal(state.inventory.sand_writ, 1);
  assert.equal(state.inventory.zhao_sand_chit, undefined);
  const expected = { zhao_ridge_permit: 11, zhao_firedoor: 8, zhao_glass_net: 16 };
  for (const [id, cost] of Object.entries(expected)) {
    const offer = data.events.find(event => event.id === id).choices[0];
    assert.equal(offer.coins, -cost);
    assert.equal(offer.coins, -cost);
  }
});

test('a raised rain flag stays up and the hide coat protects against a real marten hit', () => {
  const state = throughTown();
  travel(state, 'green_dyke');
  visit(state, 'zhao_dyke_bend');
  assert.doesNotMatch(view(state).currentEvent.text, /拉起的雨旗/);
  choose(state, 2);
  finish(state);
  visit(state, 'zhao_dyke_bend');
  assert.match(view(state).currentEvent.text, /拉起的雨旗/);
  assert.equal(choice(state, 2), undefined);
  finish(state);
  const coat = data.gear.find(item => item.id === 'hide_coat');
  state.inventory[coat.id] = 1;
  state.durability[coat.id] = coat.durability;
  play(state, 'equip', { id: coat.id });
  visit(state, 'zhao_dyke_bend');
  choose(state, 1);
  const enemy = view(state).currentEnemy;
  assert.ok(enemy.tags.includes('beast'));
  assert.equal(play(state, 'attack').damageTaken, 1);
  assert.ok(data.enemies.filter(item => item.loot?.beast_meat).every(item => item.tags.includes('beast')));
});

test('the kiln vents expose a fixed outside handful while the later guarded mine still stays guarded', () => {
  const state = throughTown();
  state.knownItems.push('fire_cloth');
  state.inventory.fire_cloth = 1;
  travel(state, 'measuring_hall');
  travel(state, 'charcoal_ridge');
  travel(state, 'night_pit');
  visit(state, 'zhao_bank_fire');
  assert.equal(choice(state, 3), undefined);
  choose(state, 2);
  assert.ok(choice(state, 3).available);
  play(state, 'beginGather', { index: 3 });
  play(state, 'finishGather');
  assert.equal(state.inventory.black_iron, undefined);
  assert.equal(view(state).groundLoot.black_iron, 2);
  assert.match(view(state).currentEvent.text, /火光缩回炉嘴/);
  assert.match(choice(state, 1).lockedReason, /挡着/);
  assert.equal(choice(state, 3), undefined);
  play(state, 'take', { id: 'black_iron' });
  assert.equal(state.inventory.black_iron, 2);
});

test('the water station outskirts are pickable without exposing the guarded chart', () => {
  const state = throughTown();
  state.knownItems.push('lab_beacon');
  state.inventory.lab_beacon = 1;
  travel(state, 'green_dyke');
  travel(state, 'old_marker');
  travel(state, 'zhao_hermit');
  travel(state, 'jade_mill');
  travel(state, 'sunken_lab');
  visit(state, 'zhao_submerged_table');
  assert.equal(choice(state, 1), undefined);
  play(state, 'beginGather', { index: 2 });
  play(state, 'finishGather');
  assert.equal(state.combat, null);
  assert.equal(view(state).groundLoot.core, 7);
  assert.equal(state.inventory.phase_chart, undefined);
  assert.equal(choice(state, 1), undefined);
});

test('a cook and a granary manager settle dry-grain accounts without forcing a ladder repair', () => {
  const state = throughTown();
  assert.ok(!view(state).quests.some(item => item.id === 'zhao_porridge_reply'));
  visit(state, 'zhao_porridge_shed');
  choose(state, 0);
  finish(state);
  assert.ok(view(state).quests.some(item => item.id === 'zhao_porridge_reply' && !item.ready));
  travel(state, 'flood_market');
  travel(state, 'crane_granary');
  visit(state, 'zhao_grain_ladder');
  assert.equal(choice(state, 0).available, false);
  choose(state, 2);
  finish(state);
  visit(state, 'zhao_grain_ladder');
  assert.match(view(state).currentEvent.text, /两袋干谷/);
  assert.equal(choice(state, 2), undefined);
  finish(state);
  travel(state, 'flood_market');
  travel(state, 'zhao_city');
  const ration = state.inventory.ration;
  assert.match(play(state, 'handin', { id: 'zhao_porridge_reply' }).message, /干谷/);
  assert.equal(state.inventory.ration, ration + 3);
  assert.equal(act(state, 'handin', { id: 'zhao_porridge_reply' }).ok, false);
});

test('the river bounty verifies real evidence, leaves a way to help without fighting, and closes only after a true repair', () => {
  const state = throughTown();
  visit(state, 'zhao_flood_office');
  choose(state, 2);
  finish(state);
  travel(state, 'green_dyke');
  visit(state, 'zhao_shutter_tracks');
  choose(state, 0);
  finish(state);
  travel(state, 'frog_pond');
  visit(state, 'zhao_pond_shutter');
  assert.equal(choice(state, 1), undefined);
  assert.equal(choice(state, 2), undefined);
  choose(state, 0);
  assert.equal(state.combat, null);
  assert.match(view(state).currentEvent.text, /两条空船都上了高岸/);
  finish(state);
  travel(state, 'green_dyke');
  travel(state, 'zhao_city');
  play(state, 'handin', { id: 'zhao_bank_rescue' });
  assert.equal(act(state, 'handin', { id: 'zhao_gate_bounty' }).ok, false);

  state.realm = 3;
  state.hp = view(state).maxHp;
  const spear = data.gear.find(item => item.id === 'tide_spear');
  state.inventory[spear.id] = 1;
  state.durability[spear.id] = spear.durability;
  play(state, 'equip', { id: spear.id });
  travel(state, 'green_dyke');
  travel(state, 'frog_pond');
  visit(state, 'zhao_pond_shutter');
  choose(state, 1);
  for (let turns = 0; state.combat && turns < 15; turns += 1) {
    play(state, view(state).intent.kind === 'heavy' ? 'guard' : 'attack');
  }
  assert.ok(state.siteVictories.zhao_pond_shutter.zhao_gate_otter);
  assert.ok(view(state).groundLoot.beast_meat > 0);
  assert.equal(state.inventory.zhao_gate_receipt, undefined);
  if (!state.event) visit(state, 'zhao_pond_shutter');
  choose(state, 2);
  finish(state);
  visit(state, 'zhao_pond_shutter');
  assert.match(view(state).currentEvent.text, /便门已经扶正/);
  assert.equal(choice(state, 2), undefined);
  finish(state);
  travel(state, 'green_dyke');
  travel(state, 'zhao_city');
  const coins = state.coins;
  play(state, 'handin', { id: 'zhao_gate_bounty' });
  assert.equal(state.coins, coins + 31);
  assert.equal(act(state, 'handin', { id: 'zhao_gate_bounty' }).ok, false);
});

test('dyke and bog hunts keep mixed species and the original shore activity independent', () => {
  const sites = [
    { id: 'zhao_dyke_bend', region: 'green_dyke', way: [], fieldIndex: 0, hunt: 3,
      local: 'zhao_reed_duck', other: 'dyke_marten', clue: /蒲叶/ },
    { id: 'zhao_scales', region: 'scale_bog', way: ['green_dyke', 'frog_pond'], fieldIndex: 1, hunt: 2,
      local: 'zhao_moss_turtle', other: 'mud_shrike', clue: /水湾边的苔背/ },
  ];
  for (const stop of sites) {
    const state = throughTown();
    state.realm = 3;
    state.hp = view(state).maxHp;
    const spear = data.gear.find(item => item.id === 'tide_spear');
    state.inventory[spear.id] = 1;
    state.durability[spear.id] = spear.durability;
    play(state, 'equip', { id: spear.id });
    [...stop.way, stop.region].forEach(id => travel(state, id));
    visit(state, stop.id);
    const population = () => view(state).sites.find(site => site.id === stop.id).creatures;
    const original = population();
    assert.ok(original[stop.local] >= 2 && original[stop.other] >= 1);
    assert.match(view(state).currentEvent.text, stop.clue);
    assert.ok(choice(state, stop.fieldIndex).available);
    choose(state, stop.hunt);
    assert.equal(state.combat.id, stop.local);
    for (let turns = 0; state.combat && turns < 15; turns += 1) {
      play(state, view(state).intent.kind === 'heavy' ? 'guard' : 'attack');
    }
    assert.ok(state.siteVictories[stop.id][stop.local]);
    assert.equal(state.localPools[stop.id].creatures[stop.other], undefined);
    assert.ok(state.localPools[stop.id].creatures[stop.local].nextAt > state.day);
    assert.ok(population()[stop.local] > 0);
    assert.ok(population()[stop.other] >= original[stop.other]);
    assert.ok(choice(state, stop.fieldIndex).available);
  }
});

test('the bog has four repeatable hunts and one species can regrow without spending its neighbors', () => {
  const state = throughTown();
  state.realm = 6;
  state.hp = view(state).maxHp;
  const spear = data.gear.find(item => item.id === 'tide_spear');
  state.inventory[spear.id] = 1;
  state.durability[spear.id] = spear.durability;
  play(state, 'equip', { id: spear.id });
  ['green_dyke', 'frog_pond', 'scale_bog'].forEach(id => travel(state, id));
  const site = 'zhao_scales';
  visit(state, site);
  const populations = () => view(state).sites.find(entry => entry.id === site).creatures;
  const count = Object.values(populations()).reduce((total, atSite) => total + atSite, 0);
  assert.ok(count >= 12);
  assert.equal(Object.keys(populations()).length, 4);
  const hunt = (index, id) => {
    if (state.satiety < 35) play(state, 'eat');
    choose(state, index);
    assert.equal(state.combat.id, id);
    let result;
    for (let turns = 0; state.combat && turns < 12; turns += 1) {
      result = play(state, view(state).intent.kind === 'heavy' ? 'guard' : 'attack');
    }
    assert.equal(state.event, site);
    return result.gathered;
  };
  assert.match(choice(state, 2).desc, /甲缘.*厚皮/);
  assert.deepEqual(hunt(0, 'mud_shrike'), { beast_meat: 5, hide: 3, foundation_core: 2 });
  assert.deepEqual(hunt(2, 'zhao_moss_turtle'), { beast_meat: 3, hide: 4, qi_core: 2 });
  assert.deepEqual(hunt(3, 'glass_frog'), { beast_meat: 3, beast_eye: 1, qi_core: 2 });
  assert.deepEqual(view(state).groundLoot, { beast_meat: 11, hide: 7, foundation_core: 2, qi_core: 4, beast_eye: 1 });
  assert.equal(state.localPools.zhao_frog_shelf, undefined);
  const eel = 'zhao_rush_eel';
  hunt(4, eel);
  const first = state.localPools[site].creatures[eel].count;
  const frogs = structuredClone(state.localPools[site].creatures.glass_frog);
  hunt(4, eel);
  const after = state.localPools[site].creatures[eel];
  assert.ok(after.count < first);
  assert.deepEqual(state.localPools[site].creatures.glass_frog, frogs);
  if (state.satiety < 35) play(state, 'eat');
  assert.ok(choice(state, 1).available);
  finish(state);
  while (state.day < after.nextAt) {
    if (state.satiety < 16) play(state, 'eat');
    play(state, 'wait');
  }
  assert.ok(populations()[eel] > after.count);
});

test('the shop quotes and charges 118 spirit coins for the bank guard sword', () => {
  const state = throughTown();
  const id = 'weir_knife';
  const quote = () => view(state).localMarket.offers.find(offer => offer.id === id);
  assert.equal(quote().price, 118);
  state.coins = 117;
  assert.equal(act(state, 'localBuy', { id }).ok, false);
  assert.equal(quote().count, 1);
  state.coins = 118;
  play(state, 'localBuy', { id });
  assert.equal(state.coins, 0);
  assert.equal(state.inventory[id], 1);
  assert.equal(quote().count, 0);
});
