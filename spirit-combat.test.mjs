import assert from 'node:assert/strict';
import test from 'node:test';
import data from './data.mjs';
import { act, view } from './engine.mjs';
import { considerEnemySpirit, spiritSkills } from './spirit-combat.mjs';
import { createQuietGame } from './game-test-fixtures.mjs';

function actOk(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, result.message);
  return result;
}

test('an enemy can declare a school and reserve without reading a player action', () => {
  const fight = { round: 0 };
  const elder = { id: 'new_examiner', tier: 7, spiritSkill: 'press_edge', spiritReserve: 2 };
  considerEnemySpirit(fight, elder, { kind: 'attack' });
  assert.equal(fight.enemySpirit, undefined);
  assert.equal(fight.enemySense, undefined);
  considerEnemySpirit(fight, elder, { kind: 'guard' });
  assert.equal(fight.enemySpirit.id, 'press_edge');
  assert.equal(fight.enemySense, 0);
  fight.round = fight.enemySpirit.ready;
  considerEnemySpirit(fight, elder, { kind: 'guard' });
  assert.equal(fight.enemySpirit.start, 0);
  const young = { round: 0 };
  considerEnemySpirit(young, { ...elder, tier: 5 }, { kind: 'guard' });
  assert.equal(young.enemySpirit, undefined);
});

function wield(state, id) {
  const gear = data.gear.find((row) => row.id === id);
  state.inventory[id] = 1;
  state.durability[id] = gear.durability;
  actOk(state, 'equip', { id });
}

function roundIntent(state, kind) {
  const { id, round } = state.combat;
  const intent = data.enemies.find((row) => row.id === id).intents.find((entry) => entry.kind === kind);
  assert.ok(intent, `No ${kind} for ${id}`);
  state.combat.plan = { round, reader: null, intent };
}

function duel(skill, { id = 'sand_riven_scorpion', mode = 'guard', weapon = 'gold_iron_blade' } = {}) {
  const state = createQuietGame(813);
  state.realm = 8;
  state.training.sense = 3;
  state.training.spiritKnown = [skill];
  state.training.spiritActive = skill;
  wield(state, weapon);
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.combat = { id, hp: 300, round: 0, escapeBonus: 0 };
  state.enemyEvadeSeed = 4897;
  roundIntent(state, mode);
  return state;
}

test('all five teachings unlock at their source, while a gold pendant adds only one spirit', () => {
  const state = createQuietGame(310);
  state.coins = 900;
  assert.equal(act(state, 'spiritStudy', { id: 'turn_edge' }).ok, false);
  assert.equal(view(state).spiritSense, null);
  state.realm = 6;
  assert.equal(view(state).spiritSense.max, 2);
  state.realm = 7;
  assert.equal(view(state).spiritSense.max, 3);
  state.realm = 8;
  assert.equal(view(state).spiritSense.max, 3);
  assert.deepEqual(view(state).spiritSense.source, { natural: 3, equipment: null });
  wield(state, 'gold_spirit_pendant');
  assert.equal(view(state).spiritSense.max, 4);
  assert.deepEqual(view(state).spiritSense.source, { natural: 3, equipment: {
    id: 'gold_spirit_pendant', name: '静水护心佩', bonus: 1,
  } });
  state.realm = 7;
  assert.equal(view(state).spiritSense.max, 3);
  state.realm = 8;
  state.durability.gold_spirit_pendant = 0;
  assert.equal(view(state).spiritSense.max, 3);
  assert.deepEqual(view(state).spiritSense.source, { natural: 3, equipment: null });
  for (const skill of spiritSkills) {
    state.region = skill.region;
    assert.equal(act(state, 'spiritStudy', { id: skill.id }).ok, false);
    actOk(state, 'visit', { id: skill.site });
    if (skill.proof || skill.defeated) {
      assert.equal(act(state, 'spiritStudy', { id: skill.id }).ok, false);
      if (skill.proof) state.knownItems.push(skill.proof);
      if (skill.defeated) state.defeated.push(skill.defeated);
    }
    const before = state.coins;
    assert.ok(view(state).spiritSense.rows.some(row => row.id === skill.id && !row.learned && row.site === state.event));
    actOk(state, 'spiritStudy', { id: skill.id });
    assert.equal(state.coins, before - (skill.price ?? 0));
    assert.equal(act(state, 'spiritStudy', { id: skill.id }).ok, false);
    if (skill === spiritSkills[0]) assert.equal(act(state, 'spiritEquip', { id: skill.id }).ok, false);
    else actOk(state, 'spiritEquip', { id: skill.id });
    assert.equal(view(state).spiritSense.active.id, skill.id);
    actOk(state, 'leave');
  }
  assert.equal(view(state).spiritSense.rows.filter(({ learned }) => learned).length, 5);
});

test('lesson fees, equipment changes and an empty spirit reserve cannot be bypassed', () => {
  const state = createQuietGame(310);
  state.realm = 6;
  state.region = 'measuring_hall';
  state.coins = 179;
  actOk(state, 'visit', { id: 'zhao_bamboo_duel' });
  const before = view(state).spiritSense;
  assert.equal(before.active, null);
  assert.deepEqual(before.rows.map(({ id, blocker }) => [id, blocker]), [['turn_edge', '灵钱不足。']]);
  assert.equal(act(state, 'spiritStudy', { id: 'turn_edge' }).ok, false);
  assert.equal(state.coins, 179);
  assert.equal(act(state, 'spiritEquip', { id: 'turn_edge' }).ok, false);
  state.coins++;
  actOk(state, 'spiritStudy', { id: 'turn_edge' });
  assert.equal(state.coins, 0);
  assert.equal(view(state).spiritSense.active.id, 'turn_edge');
  assert.equal(state.training.sense, 0);

  const attack = duel('split_stream', { weapon: 'gold_confluence_staff' });
  attack.training.sense = 2;
  assert.match(act(attack, 'invokeSpirit').message, /不足/);
  assert.equal(attack.training.sense, 2);
  attack.training.sense = 3;
  attack.training.spiritKnown.push('turn_edge');
  attack.inventory.ember_talisman = 1;
  actOk(attack, 'invokeSpirit');
  const beforeQi = attack.qi;
  assert.equal(act(attack, 'weaponSpell').ok, false);
  assert.equal(attack.qi, beforeQi);
  assert.equal(act(attack, 'use', { id: 'ember_talisman' }).ok, false);
  assert.equal(attack.inventory.ember_talisman, 1);
  assert.equal(act(attack, 'spiritEquip', { id: 'turn_edge' }).ok, false);
  assert.equal(act(attack, 'invokeSpirit').ok, false);
  assert.equal(attack.combat.round, 0);
  assert.equal(view(attack).spiritSense.active.id, 'split_stream');
  actOk(attack, 'guard');
  assert.match(act(attack, 'invokeSpirit').message, /还没缓过来/);
});

test('cooldown includes the casting round and defensive medicine can finish that round', () => {
  const state = duel('turn_edge');
  state.hp -= 5;
  state.inventory.salve = 1;
  actOk(state, 'invokeSpirit');
  assert.equal(view(state).spiritSense.waiting, 4);
  actOk(state, 'use', { id: 'salve' });
  assert.equal(state.inventory.salve, undefined);
  assert.equal(state.combat.round, 1);
  assert.equal(view(state).spiritSense.remaining, 0);
  for (const cooldown of [3, 2, 1]) {
    assert.equal(view(state).spiritSense.waiting, cooldown);
    assert.match(act(state, 'invokeSpirit').message, /还没缓过来/);
    roundIntent(state, 'guard');
    actOk(state, 'guard');
  }
  assert.equal(view(state).spiritSense.waiting, 0);
  actOk(state, 'invokeSpirit');
  assert.equal(state.training.sense, 1);
});

test('fold armor includes the activation turn, disables stance, preserves enemy dodge, then expires', () => {
  const seed = duel('fold_armor');
  const unchanged = structuredClone(seed);
  const day = seed.day;
  const qi = seed.qi;
  actOk(seed, 'invokeSpirit');
  assert.equal(seed.training.sense, 1);
  assert.equal(view(seed).spiritSense.waiting, 6);
  assert.equal(view(seed).spiritSense.remaining, 3);
  assert.equal(view(seed).intent, null);
  assert.equal(act(seed, 'attack').ok, false);
  assert.equal(act(seed, 'fistAttack').ok, false);
  assert.equal(act(seed, 'spiritEquip', { id: 'turn_edge' }).ok, false);
  assert.equal(seed.day, day);
  assert.equal(seed.qi, qi);
  actOk(seed, 'guard');
  actOk(unchanged, 'guard');
  roundIntent(seed, 'guard');
  roundIntent(unchanged, 'guard');
  const plain = actOk(unchanged, 'attack');
  const opened = actOk(seed, 'attack');
  assert.ok(opened.damageDealt > plain.damageDealt);
  assert.equal(view(seed).spiritSense.remaining, 1);
  roundIntent(seed, 'guard');
  actOk(seed, 'attack');
  assert.equal(view(seed).spiritSense.remaining, 0);
  assert.equal(view(seed).spiritSense.waiting, 3);

  const dodging = duel('fold_armor', { id: 'sand_spine_lizard', mode: 'guard' });
  actOk(dodging, 'invokeSpirit');
  actOk(dodging, 'guard');
  dodging.combat.plan = { round: 1, reader: null, intent: { kind: 'dodge', name: '侧开' } };
  dodging.enemyEvadeSeed = 7132;
  const missed = actOk(dodging, 'attack');
  assert.equal(missed.missed, true);
  assert.equal(missed.damageDealt, 0);
});

test('the burst skill can set up a heavy weapon and triples its next attack', () => {
  const state = duel('split_stream', { weapon: 'anvil_hammer' });
  const ordinary = structuredClone(state);
  actOk(state, 'invokeSpirit');
  actOk(state, 'attack');
  actOk(ordinary, 'attack');
  assert.ok(view(state).chargingWeapon);
  assert.equal(view(state).spiritSense.remaining, 1);
  roundIntent(state, 'guard');
  roundIntent(ordinary, 'guard');
  const burst = actOk(state, 'attack');
  const single = actOk(ordinary, 'attack');
  assert.equal(burst.damageDealt, single.damageDealt * 3);
  assert.equal(view(state).spiritSense.remaining, 0);
  assert.equal(state.training.sense, 0);
  assert.deepEqual(view(state).spiritSense.readings, []);
});

test('one-turn deflection needs an incoming attack and enemy deflection hides its source', () => {
  const state = duel('turn_edge', { mode: 'attack' });
  const quiet = structuredClone(state);
  roundIntent(quiet, 'guard');
  actOk(state, 'invokeSpirit');
  actOk(quiet, 'invokeSpirit');
  const reflected = actOk(state, 'guard');
  assert.ok(reflected.reflectedDamage > 0);
  assert.equal(reflected.damageTaken, 0);
  assert.equal(actOk(quiet, 'guard').damageDealt, 0);
  assert.equal(view(quiet).spiritSense.waiting, 3);
  assert.deepEqual(view(state).spiritSense.readings, []);

  const boss = duel('turn_edge', { id: 'sand_inverted_keeper', mode: 'guard' });
  const result = actOk(boss, 'attack');
  assert.ok(result.damageTaken > 0);
  assert.equal(result.damageDealt, 0);
  assert.equal(boss.combat.enemySpirit.id, 'turn_edge');
  assert.equal(Object.hasOwn(view(boss).combat, 'enemySpirit'), false);
  assert.doesNotMatch(result.message, /返势|神识/);
});

test('studying a weakening technique shows only its stat, and pressure cuts a temporary strike', () => {
  const state = duel('press_edge', { mode: 'attack' });
  const rival = data.enemies.find((enemy) => enemy.id === state.combat.id);
  state.training.spiritKnown.push('veil_eye', 'split_stream');
  assert.deepEqual(view(state).spiritSense.readings, [
    { label: '洞察', value: rival.perception }, { label: '攻击', value: rival.atk },
  ]);
  const ordinary = structuredClone(state);
  actOk(state, 'invokeSpirit');
  const reduced = actOk(state, 'guard');
  const unmodified = actOk(ordinary, 'guard');
  assert.ok(reduced.damageTaken < unmodified.damageTaken);
  assert.equal(view(state).spiritSense.remaining, 1);
  roundIntent(state, 'attack');
  actOk(state, 'guard');
  assert.equal(view(state).spiritSense.remaining, 0);
});

test('obscuring perception only affects subsequent turn decisions', () => {
  const treated = duel('veil_eye', { id: 'sand_sundial_master' });
  const untreated = structuredClone(treated);
  treated.combatSeed = untreated.combatSeed = 7132;
  assert.equal(view(treated).combatRead, null);
  actOk(treated, 'invokeSpirit');
  assert.equal(view(treated).combatRead, null);
  actOk(treated, 'guard');
  actOk(untreated, 'guard');
  assert.equal(view(treated).combatRead, 'player');
  assert.equal(view(untreated).combatRead, 'enemy');
});

test('the two migrated manuals have different passive uses while only one can run at once', () => {
  const natural = duel('press_edge', { mode: 'heavy' });
  const prepareManual = (id, rank) => {
    const state = structuredClone(natural);
    delete state.combat;
    state.inventory[id] = 1;
    state.manualRanks[id] = rank;
    actOk(state, 'equipManual', { id });
    state.combat = structuredClone(natural.combat);
    return state;
  };
  const echo = prepareManual('echo_guard_manual', 3);
  const terrace = prepareManual('terrace_counter_manual', 3);
  echo.qi = terrace.qi = 20;
  const bare = actOk(natural, 'guard');
  const standing = actOk(echo, 'guard');
  const riposte = actOk(terrace, 'guard');
  assert.ok(standing.damageTaken < riposte.damageTaken && riposte.damageTaken < bare.damageTaken);
  assert.equal(standing.damageDealt, bare.damageDealt);
  assert.ok(riposte.damageDealt > bare.damageDealt);
  assert.equal(echo.qi, 23);
  assert.equal(terrace.qi, 20);
  delete terrace.combat;
  terrace.inventory.echo_guard_manual = 1;
  actOk(terrace, 'equipManual', { id: 'echo_guard_manual' });
  assert.equal(view(terrace).innerStyle.active.id, 'echo_guard_manual');
  assert.equal(view(terrace).innerStyle.books.length, 2);
});
