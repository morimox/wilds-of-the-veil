import test from 'node:test';
import assert from 'node:assert/strict';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame, stageRetreatOpening } from './game-test-fixtures.mjs';
import { data } from './data.mjs';
import { trainingData } from './training.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, result.message);
  return result;
}

function teachable(state, id) {
  const track = trainingData.find((entry) => entry.id === id);
  state.knownItems.push(track.lead);
  state.region = track.region;
  state.coins = track.ranks.reduce((total, rank) => total + rank.coins, 0);
  for (const rank of track.ranks) {
    for (const [item, count] of Object.entries(rank.need)) state.inventory[item] = (state.inventory[item] ?? 0) + count;
  }
  return track;
}

function combat(state, id, round = 0) {
  const enemy = data.enemies.find((entry) => entry.id === id);
  state.combat = { id, hp: enemy.hp, round, escapeBonus: 0,
    plan: { round, intent: enemy.intents[round % enemy.intents.length], reader: null } };
  return enemy;
}

test('a focused medicine restores spent spirit without healing or adding true qi', () => {
  const state = createGame(7);
  state.realm = 2;
  state.inventory.sense_powder = 2;
  assert.match(view(state).medicineUseReasons.sense_powder, /先学会神识/);
  assert.equal(act(state, 'use', { id: 'sense_powder' }).ok, false);
  assert.equal(state.inventory.sense_powder, 2);
  teachable(state, 'spirit');
  play(state, 'trainStudy', { id: 'spirit' });
  const enemy = combat(state, 'mud_beast');
  for (let i = 0; i < 2; i++) {
    play(state, 'readSpirit');
    play(state, 'guard');
  }
  assert.equal(view(state).spiritSense.current, 0);
  const round = state.combat.round;
  const guard = enemy.intents.find(({ kind }) => kind === 'guard');
  state.combat.plan = { round, reader: null, intent: guard };
  const day = state.day;
  const hp = state.hp;
  const qi = state.qi;
  const dose = play(state, 'use', { id: 'sense_powder' });
  assert.match(dose.message, /神识回了2点/);
  assert.equal(state.combat.round, round + 1);
  assert.equal(state.day - day, rules.battleDays);
  assert.equal(view(state).spiritSense.current, 2);
  assert.equal(view(state).spiritSense.canRead, true);
  assert.equal(state.hp, hp);
  assert.equal(state.qi, qi);
  assert.equal(state.inventory.sense_powder, 1);
  const ready = structuredClone(state);
  assert.match(act(state, 'use', { id: 'sense_powder' }).message, /神识已经养足/);
  assert.deepEqual(state, ready);
});

test('a mixed medicine restores both resources in one round and can restore only the missing one', () => {
  const state = createGame(11);
  state.realm = 2;
  state.inventory.heart_pill = 2;
  teachable(state, 'spirit');
  play(state, 'trainStudy', { id: 'spirit' });
  state.training.sense = 0;
  const maxHp = view(state).maxHp;
  state.hp = maxHp - 18;
  const enemy = combat(state, 'mud_beast');
  state.combat.plan.intent = enemy.intents.find(({ kind }) => kind === 'guard');
  const fullSpirit = structuredClone(state);
  fullSpirit.training.sense = 2;
  const fullHealth = structuredClone(state);
  fullHealth.hp = maxHp;
  const untrained = structuredClone(state);
  untrained.training.levels.spirit = 0;

  const day = state.day;
  const dose = play(state, 'use', { id: 'heart_pill' });
  assert.match(dose.message, /气血回了14点。神识回了1点/);
  assert.equal(state.inventory.heart_pill, 1);
  assert.equal(state.combat.round, 1);
  assert.equal(state.day - day, rules.battleDays);
  assert.equal(state.hp, maxHp - 4);
  assert.equal(state.training.sense, 1);
  assert.equal(state.toxin, 10);

  play(fullSpirit, 'use', { id: 'heart_pill' });
  assert.equal(fullSpirit.hp, maxHp - 4);
  assert.equal(fullSpirit.training.sense, 2);
  play(fullHealth, 'use', { id: 'heart_pill' });
  assert.equal(fullHealth.hp, maxHp);
  assert.equal(fullHealth.training.sense, 1);
  play(untrained, 'use', { id: 'heart_pill' });
  assert.equal(untrained.hp, maxHp - 4);
  assert.equal(view(untrained).spiritSense, null);
});

test('a charged hit stops the spirit and health effects of a mixed medicine before its dose is spent', () => {
  const state = createGame(15);
  state.realm = 2;
  teachable(state, 'spirit');
  play(state, 'trainStudy', { id: 'spirit' });
  state.inventory.heart_pill = 1;
  state.training.sense = 1;
  const enemy = combat(state, 'bandit_den_leader');
  state.combat.plan.intent = enemy.intents.find(({ kind }) => kind === 'focus');
  play(state, 'guard');
  assert.equal(state.combat.enemyCharged, true);
  state.combat.plan = { round: 1, reader: null, intent: enemy.intents.find(({ kind }) => kind === 'heavy') };
  const hp = state.hp;
  const day = state.day;
  const result = play(state, 'use', { id: 'heart_pill' });
  assert.match(result.message, /药还在手里/);
  assert.ok(result.damageTaken > 0);
  assert.equal(state.hp, hp - result.damageTaken);
  assert.equal(state.training.sense, 1);
  assert.equal(state.toxin, 0);
  assert.equal(state.inventory.heart_pill, 1);
  assert.equal(state.combat.round, 2);
  assert.equal(state.day - day, rules.battleDays);
});

test('teachers only appear after their particular leads; each rank consumes its own materials and time', () => {
  const state = createGame(6);
  assert.deepEqual(view(state).training, []);
  assert.equal(view(state).spiritSense, null);
  assert.equal(act(state, 'trainStudy', { id: 'breath' }).ok, false);
  state.knownItems.push('echo_method');
  assert.match(act(state, 'trainStudy', { id: 'breath' }).message, /折水驿/);
  const track = teachable(state, 'breath');
  const initialQi = view(state).maxQi;
  const blank = structuredClone(state);
  blank.inventory.core = 0;
  const before = structuredClone(blank);
  assert.match(act(blank, 'trainStudy', { id: 'breath' }).message, /灵晶/);
  assert.deepEqual(blank, before);

  for (const [index, rank] of track.ranks.entries()) {
    const beforeCoins = state.coins;
    const beforeDay = state.day;
    const materials = { ...state.inventory };
    assert.deepEqual(view(state).training[0].next.need, rank.need);
    play(state, 'trainStudy', { id: 'breath' });
    assert.equal(state.coins, beforeCoins - rank.coins);
    assert.equal(state.day, beforeDay + rank.days);
    for (const [item, count] of Object.entries(rank.need)) assert.equal(state.inventory[item] ?? 0, materials[item] - count);
    assert.equal(view(state).training[0].level, index + 1);
    assert.equal(view(state).maxQi, initialQi + rank.qi);
  }
  assert.equal(view(state).training[0].next, null);
  assert.match(act(state, 'trainStudy', { id: 'breath' }).message, /学完/);
  state.qi = 0;
  play(state, 'rest');
  assert.equal(state.qi, rules.restQi + 3);
});

test('body, seals and elements act on separate combat rules', () => {
  const body = createGame(8);
  teachable(body, 'body');
  const natural = view(body);
  for (let i = 0; i < 3; i += 1) play(body, 'trainStudy', { id: 'body' });
  assert.equal(view(body).maxHp, natural.maxHp + 12);
  assert.equal(view(body).defense, natural.defense + 2);

  const base = createGame(8);
  base.inventory.ember_talisman = 1;
  combat(base, 'mud_beast');
  const trainedSeal = structuredClone(base);
  trainedSeal.training.levels.seals = 3;
  const withoutSeal = play(base, 'use', { id: 'ember_talisman' });
  const withSeal = play(trainedSeal, 'use', { id: 'ember_talisman' });
  assert.equal(withSeal.damageDealt, withoutSeal.damageDealt + 5);
  assert.equal(withSeal.damageTaken, withoutSeal.damageTaken);
  assert.equal(trainedSeal.inventory.ember_talisman, undefined);

  const caster = createGame(8);
  combat(caster, 'marsh_ghost');
  const elemental = structuredClone(caster);
  elemental.training.levels.elements = 3;
  assert.equal(play(elemental, 'attack').damageDealt - play(caster, 'attack').damageDealt, 3);
  const hunter = createGame(8);
  combat(hunter, 'mud_beast');
  const prepared = structuredClone(hunter);
  prepared.training.levels.elements = 3;
  const hit = play(hunter, 'attack');
  const countered = play(prepared, 'attack');
  assert.equal(countered.damageDealt - hit.damageDealt, 2);
  assert.equal(hit.damageTaken - countered.damageTaken, 3);
});

test('one spirit reading per round, one guarded reply, and rest at a visited new town refills it', () => {
  const state = createGame(13);
  teachable(state, 'spirit');
  play(state, 'trainStudy', { id: 'spirit' });
  assert.deepEqual(view(state).spiritSense, { current: 2, max: 2, canRead: false, prediction: null });
  const enemy = combat(state, 'mud_beast');
  const baseline = structuredClone(state);
  assert.equal(view(state).intent, null);
  const day = state.day;
  play(state, 'readSpirit');
  assert.equal(state.day, day);
  assert.equal(view(state).spiritSense.current, 1);
  assert.equal(view(state).spiritSense.prediction.name, enemy.intents[0].name);
  assert.equal(act(state, 'readSpirit').ok, false);
  assert.equal(act(state, 'trainStudy', { id: 'spirit' }).ok, false);
  const expected = play(baseline, 'attack');
  const guarded = play(state, 'attack');
  assert.equal(expected.damageTaken - guarded.damageTaken, 2);
  assert.equal(guarded.enemyMove.name, enemy.intents[0].name);
  assert.equal(state.combat.spiritGuard, undefined);
  assert.equal(view(state).spiritSense.prediction, null);
  state.combat.plan.reader = 'enemy';
  play(state, 'readSpirit');
  assert.equal(view(state).spiritSense.prediction, null);
  assert.equal(view(state).intent, null);
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  assert.equal(view(state).spiritSense.current, 0);
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.region = 'mingsha_city';
  play(state, 'rest');
  assert.equal(view(state).spiritSense.current, 2);
});

test('a lethal hit in protected sparring ends the match without wounds, payment or victory aid', () => {
  const state = createGame(22);
  state.region = 'sand_bell_cloister';
  play(state, 'visit', { id: 'sand_cloister_trial' });
  play(state, 'choose', { index: 1 });
  const day = state.day;
  const coins = state.coins;
  const inventory = { ...state.inventory };
  state.hp = 1;
  const result = play(state, 'attack');
  assert.match(result.message, /试招输了/);
  assert.equal(state.region, 'sand_bell_cloister');
  assert.equal(state.event, 'sand_cloister_trial');
  assert.equal(state.combat, null);
  assert.ok(state.hp >= 1);
  assert.equal(state.wounds, 0);
  assert.equal(state.coins, coins);
  assert.equal(state.day, day + rules.battleDays + 0.5);
  assert.deepEqual(state.inventory, inventory);
  assert.equal(state.siteVictories.sand_cloister_trial, undefined);
  assert.equal(view(state).sites.some(({ id }) => id === 'sand_ring_maker'), false);
});
