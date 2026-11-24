import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, view } from './engine.mjs';
import { createQuietGame as createGame, stageRetreatOpening } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `第 ${state.day} 日，${state.region} ${action} ${JSON.stringify(payload)}: ${result.message}`);
  return result;
}

const option = (state, index) => view(state).visibleChoices.find((choice) => choice.index === index);
const field = (state, id) => view(state).sites.find((site) => site.id === id);
const visit = (state, id) => play(state, 'visit', { id });
const choose = (state, index) => play(state, 'choose', { index });
const leave = (state) => { if (state.event) play(state, 'leave'); };
const travel = (state, id) => {
  leave(state);
  while (state.satiety < 58 && state.inventory.ration) play(state, 'eat', { id: 'ration' });
  play(state, 'travel', { id });
};

function gather(state, index, id) {
  play(state, 'beginGather', { index });
  play(state, 'finishGather');
  play(state, 'take', { id });
}

function reachRidge(state) {
  travel(state, 'marsh');
  visit(state, 'reed_banks');
  choose(state, 2);
  gather(state, 0, 'reed');
  leave(state);
  visit(state, 'mud_track');
  gather(state, 1, 'wood');
  leave(state);
  visit(state, 'reed_ferryman');
  choose(state, 0);
  travel(state, 'ridge');
}

function fight(state, index, enemy, { arts = false } = {}) {
  const boss = enemy === 'caravan_broker';
  while (state.satiety < (boss ? 62 : 28) && state.inventory.ration) play(state, 'eat', { id: 'ration' });
  if (boss) {
    if (state.hp < view(state).maxHp - 16 && state.inventory.heal_pill) play(state, 'use', { id: 'heal_pill' });
    while (state.qi < view(state).maxQi - 6 && state.inventory.qi_powder) play(state, 'use', { id: 'qi_powder' });
  }
  const from = state.event;
  const coins = state.coins;
  const start = state.day;
  choose(state, index);
  assert.equal(view(state).currentEnemy.id, enemy);
  assert.equal(view(state).currentEnemy.sparring, false);
  let rounds = 0;
  while (state.combat && rounds < 22) {
    const observed = view(state);
    const move = observed.intent?.kind;
    if (move === 'heavy') play(state, 'guard');
    else if (boss && move === 'heal' && state.qi >= 3) play(state, 'art', { id: 'hook_current' });
    else if (boss && move === 'drain' && state.qi < 4 && state.inventory.qi_powder) play(state, 'use', { id: 'qi_powder' });
    else if (boss && state.hp <= 24 && state.inventory.heal_pill) play(state, 'use', { id: 'heal_pill' });
    else if (state.hp <= 15 && state.inventory.salve) play(state, 'use', { id: 'salve' });
    else if (boss && state.qi >= 4 && move !== 'guard') play(state, 'art', { id: 'bell_strike' });
    else if (arts && !boss && state.qi >= 8 && move !== 'guard') play(state, 'art', { id: 'reed_cleave' });
    else play(state, 'attack');
    rounds += 1;
  }
  assert.equal(state.event, from, state.log.slice(-8).join('\n'));
  assert.equal(state.coins, coins, 'there is no automatic purse from winning a battle');
  assert.equal(state.day - start, (rounds + 1) / 8);
  return rounds;
}

function followCrash(state) {
  assert.equal(field(state, 'caravan_wreck'), undefined);
  visit(state, 'caravan_slate');
  assert.match(choose(state, 0).message, /翻车弯/);
  leave(state);
  visit(state, 'caravan_wreck');
  assert.equal(option(state, 1).available, false);
  const rounds = fight(state, 0, 'caravan_mule_hound');
  assert.deepEqual(view(state).groundLoot, { hide: 1, qi_core: 1 });
  play(state, 'take', { id: 'qi_core' });
  assert.match(choose(state, 1).message, /石灯.*墙/);
  travel(state, 'screen_slope');
  return rounds;
}

function getSurvivor(state, configuration) {
  visit(state, 'caravan_lamp_wall');
  assert.equal(option(state, 1), undefined);
  const rounds = fight(state, 0, 'caravan_lookout', configuration);
  assert.deepEqual(view(state).groundLoot, {});
  assert.match(choose(state, 1).message, /扶到石屋/);
  assert.ok(state.inventory.caravan_token);
  assert.ok(state.inventory.caravan_gate_key);
  assert.equal(option(state, 1), undefined);
  return rounds;
}

test('a new traveler can rescue the driver in two fights and stop there', (context) => {
  const state = createGame(20261124);
  play(state, 'buy', { id: 'salve', count: 1 });
  reachRidge(state);
  const start = state.day;
  let rounds = followCrash(state);
  visit(state, 'caravan_wagon_rise');
  assert.match(view(state).currentEvent.text, /铁锁还挂着/);
  assert.deepEqual(view(state).visibleChoices, []);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  leave(state);
  rounds += getSurvivor(state);
  travel(state, 'ridge');
  visit(state, 'caravan_slate');
  const purse = state.coins;
  const rations = state.inventory.ration ?? 0;
  choose(state, 1);
  assert.equal(state.coins - purse, 18);
  assert.equal(state.inventory.ration - rations, 2);
  assert.equal(state.inventory.caravan_token, undefined);
  assert.equal(option(state, 1), undefined);
  assert.equal(option(state, 2), undefined);
  assert.deepEqual(state.defeated, ['caravan_mule_hound', 'caravan_lookout']);
  assert.equal(state.wounds, 0);
  context.diagnostic(`救人 2 场 ${rounds} 回合，${state.day - start} 游戏日，实地领到 18 灵钱与两份干粮、一份松脂膏，另可带走一枚妖丹。`);
});

function readyExpedition() {
  const state = createGame(20261124);
  reachRidge(state);
  // Stage ordinary late-Qi equipment to isolate the continuation's balance from cultivation prerequisites.
  state.realm = 2;
  for (const [id, quantity] of Object.entries({ iron_sword: 1, iron_coat: 1, hide_shield: 1, ration: 9, salve: 5, heal_pill: 2, qi_powder: 3 })) {
    state.inventory[id] = quantity;
    const equipment = data.gear.find((record) => record.id === id);
    if (!equipment) continue;
    state.durability[id] = equipment.durability;
    play(state, 'equip', { id });
  }
  state.knownArts.push('reed_cleave', 'hook_current', 'bell_strike');
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  return state;
}

test('the full expedition clears both guard groups and collects its cargo proof under player control', (context) => {
  const state = readyExpedition();
  const start = state.day;
  const purse = state.coins;
  const startingSalve = state.inventory.salve;
  let rounds = followCrash(state);
  rounds += getSurvivor(state, { arts: true });
  leave(state);
  visit(state, 'caravan_wagon_rise');
  choose(state, 0);
  assert.equal(state.inventory.caravan_gate_key, undefined);
  assert.match(option(state, 2).lockedReason, /2/);
  rounds += fight(state, 1, 'caravan_guard_hound', { arts: true });
  assert.match(option(state, 2).lockedReason, /1/);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  leave(state);
  visit(state, 'caravan_wagon_rise');
  assert.equal(field(state, 'caravan_wagon_rise').creatures.caravan_guard_hound, 1);
  assert.equal(option(state, 0), undefined);
  rounds += fight(state, 1, 'caravan_guard_hound', { arts: true });
  assert.equal(view(state).groundLoot.qi_core, 4);
  play(state, 'take', { id: 'qi_core' });
  choose(state, 2);
  leave(state);
  visit(state, 'caravan_granary');
  assert.equal(option(state, 2), undefined);
  assert.match(option(state, 1).lockedReason, /2/);
  rounds += fight(state, 0, 'caravan_hook_guard', { arts: true });
  assert.match(option(state, 1).lockedReason, /1/);
  rounds += fight(state, 0, 'caravan_hook_guard', { arts: true });
  assert.deepEqual(view(state).groundLoot, {});
  const bossRounds = fight(state, 1, 'caravan_broker', { arts: true });
  rounds += bossRounds;
  assert.equal(state.inventory.caravan_lading, undefined);
  assert.equal(state.coins, purse);
  assert.equal(state.siteVictories.caravan_granary.caravan_broker, 1);

  const fieldSupplies = data.items.filter(({ kind, id }) => !['gear', 'key'].includes(kind) && !state.inventory[id]);
  for (const { id } of fieldSupplies) {
    const current = view(state);
    if (current.backpackUsed === current.backpackCapacity) break;
    state.inventory[id] = 1;
  }
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  choose(state, 2);
  assert.equal(state.inventory.caravan_lading, 1);
  assert.equal(option(state, 2), undefined);
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);

  travel(state, 'ridge');
  visit(state, 'caravan_slate');
  choose(state, 1);
  choose(state, 2);
  assert.equal(state.inventory.caravan_lading, undefined);
  assert.equal(state.coins - purse, 70);
  assert.equal(view(state).groundLoot.caravan_bell, 1);
  assert.match(view(state).currentEvent.text, /预备沿背崖往渡口运粮/);
  const relaxed = fieldSupplies.find(({ id }) => state.inventory[id]);
  play(state, 'discard', { id: relaxed.id, count: 1 });
  play(state, 'take', { id: 'caravan_bell' });
  play(state, 'equip', { id: 'caravan_bell' });
  assert.equal(state.equipment.charm, 'caravan_bell');
  assert.equal(act(state, 'choose', { index: 2 }).ok, false);
  leave(state);

  // The quay still uses its original map gate. The cargo story changes what happens there after arrival.
  assert.equal(act(state, 'travel', { id: 'ford' }).ok, false);
  visit(state, 'rope_run');
  choose(state, 0);
  leave(state);
  visit(state, 'stone_niche');
  choose(state, 0);
  travel(state, 'ford');
  visit(state, 'caravan_ford_cargo');
  choose(state, 0);
  assert.match(view(state).currentEvent.text, /已经搬进船舱/);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  context.diagnostic(`追货 7 场 ${rounds} 回合，首领 ${bossRounds} 回合，连取水图并到渡口 ${state.day - start} 游戏日。主线收益 70 灵钱、5 妖丹、驱雾车铃；本段用了 ${startingSalve + 1 - (state.inventory.salve ?? 0)} 份松脂膏。`);
});

test('retreat and defeat leave the guards in place and preserve the reopened side door', () => {
  const state = readyExpedition();
  followCrash(state);
  getSurvivor(state, { arts: true });
  leave(state);
  visit(state, 'caravan_wagon_rise');
  choose(state, 0);
  choose(state, 1);
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  visit(state, 'caravan_wagon_rise');
  assert.equal(field(state, 'caravan_wagon_rise').creatures.caravan_guard_hound, 2);
  assert.equal(option(state, 0), undefined);
  assert.equal(option(state, 2).available, false);

  for (const slot of ['armor', 'offhand']) play(state, 'unequip', { slot });
  state.hp = 1;
  choose(state, 1);
  assert.match(play(state, 'attack').message, /送回/);
  assert.equal(state.inventory.caravan_token, 1);
  assert.equal(state.inventory.caravan_gate_key, undefined);
  assert.equal(state.wounds, 1);
  play(state, 'rest');
  travel(state, 'screen_slope');
  visit(state, 'caravan_wagon_rise');
  assert.match(option(state, 2).lockedReason, /2/);
  assert.equal(option(state, 0), undefined);
  assert.equal(field(state, 'caravan_granary'), undefined);
});
