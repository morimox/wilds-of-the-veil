import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createGame, rules, view } from './engine.mjs';
import { data } from './data.mjs';
import { tournamentData } from './tournament.mjs';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function atTheHall() {
  const state = createGame(93);
  state.region = 'measuring_hall';
  state.world.lastSettlement = state.region;
  state.coins = 60;
  return state;
}

function getInvitation(state) {
  play(state, 'visit', { id: 'zhao_bamboo_duel' });
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory.body_breath_note, 1);
  assert.equal(state.world.affiliation, null);
}

function outfitForThreeBouts(state) {
  state.realm = 5;
  state.inventory.ration = 8;
  for (const id of ['sky_sword', 'gauze_armor', 'coal_tassel']) {
    const gear = data.gear.find((row) => row.id === id);
    state.equipment[gear.slot] = id;
    state.inventory[id] = 1;
    state.durability[id] = gear.durability;
  }
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
}

function winCurrentBout(state) {
  for (let i = 0; state.combat && i < 16; i++) play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.event, null);
  assert.equal(state.region, 'measuring_hall');
  assert.deepEqual(view(state).groundLoot, {});
}

test('three real arena opponents, rest between bouts, and a one-time first place manual', () => {
  const state = atTheHall();
  assert.equal(view(state).tournament, null);
  assert.equal(act(state, 'tournamentEnroll').ok, false);
  assert.equal(state.coins, 60);
  getInvitation(state);
  outfitForThreeBouts(state);
  assert.equal(view(state).tournament.canEnroll, true);
  play(state, 'tournamentEnroll');
  assert.equal(state.coins, 60 - tournamentData.fee);
  assert.equal(act(state, 'tournamentEnroll').ok, false);

  for (const [index, match] of tournamentData.matches.entries()) {
    assert.equal(view(state).tournament.match.name, match.name);
    assert.equal(view(state).tournament.canFight, true);
    play(state, 'tournamentFight');
    assert.equal(view(state).currentEnemy.id, match.enemy);
    assert.equal(view(state).currentEnemy.sparring, true);
    assert.equal(view(state).currentEnemy.medicineRestricted, true);
    assert.equal(act(state, 'rest').ok, false);
    assert.equal(act(state, 'tournamentFight').ok, false);
    winCurrentBout(state);
    assert.equal(view(state).tournament.wins, index + 1);
    if (index < 2) {
      const blocked = view(state).tournament;
      assert.equal(blocked.canFight, false);
      assert.equal(act(state, 'tournamentFight').message, blocked.fightReason);
      assert.match(blocked.fightReason, /先在场边歇/);
      state.qi = 0;
      play(state, 'rest');
      assert.equal(state.qi, rules.restQi);
      play(state, 'eat');
    }
  }
  assert.equal(view(state).tournament.result, '三场全胜');
  assert.equal(view(state).tournament.best, 3);
  assert.match(view(state).tournament.claimName, /三场全胜.*奖品/);
  assert.equal(state.inventory.terrace_counter_manual, undefined);
  assert.equal(view(state).tournament.canEnroll, false);

  const rations = state.inventory.ration;
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  assert.equal(view(state).tournament.canClaim, false);
  assert.equal(act(state, 'tournamentClaim').ok, false);
  assert.equal(state.tournament.claimed, -1);
  state.inventory.ration = rations;
  play(state, 'tournamentClaim');
  assert.equal(state.inventory.tournament_citation, 1);
  assert.equal(state.inventory.jade_pill, 2);
  assert.equal(state.inventory.terrace_counter_manual, 1);
  assert.equal(act(state, 'tournamentClaim').ok, false);

  const prizeLead = atTheHall();
  prizeLead.region = 'village';
  prizeLead.realm = 5;
  prizeLead.knownItems.push('tournament_citation');
  assert.equal(prizeLead.inventory.terrace_counter_manual, undefined);
  assert.equal(act(prizeLead, 'equipManual', { id: 'terrace_counter_manual' }).ok, false);
});

test('loss preserves score validity and possessions; one consolation with a four-day re-entry delay', () => {
  const state = atTheHall();
  getInvitation(state);
  play(state, 'tournamentEnroll');
  play(state, 'tournamentFight');
  const purse = state.coins;
  const belongings = { ...state.inventory };
  state.hp = 1;
  assert.match(play(state, 'attack').message, /最后一式收手/);
  assert.equal(state.region, 'measuring_hall');
  assert.equal(state.combat, null);
  assert.equal(state.event, null);
  assert.equal(state.hp, 1);
  assert.equal(state.wounds, 0);
  assert.deepEqual(state.inventory, belongings);
  assert.equal(state.coins, purse);
  assert.equal(state.tournament.wins, 0);
  assert.equal(state.tournament.until - state.day, tournamentData.cooldown);
  assert.match(act(state, 'tournamentEnroll').message, /等四个游戏日.*再报名/);
  play(state, 'tournamentClaim');
  assert.equal(state.inventory.ration, belongings.ration + 2);
  assert.equal(act(state, 'tournamentClaim').ok, false);
  while (state.day < state.tournament.until) play(state, 'wait');
  play(state, 'tournamentEnroll');
  if (state.satiety === 0) play(state, 'eat');
  assert.equal(view(state).tournament.canFight, false);
  assert.match(view(state).tournament.fightReason, /气血还没到一半/);
  play(state, 'restUntilRecovered');
  if (state.satiety === 0) play(state, 'eat');
  assert.equal(view(state).tournament.canFight, true);
  play(state, 'tournamentWithdraw');
  assert.equal(act(state, 'tournamentClaim').ok, false);
  assert.equal(state.coins, purse - tournamentData.fee);
});

test('ordinary retreat concedes a live official match, and legit earlier wins still count', () => {
  const state = atTheHall();
  getInvitation(state);
  outfitForThreeBouts(state);
  play(state, 'tournamentEnroll');
  play(state, 'tournamentFight');
  winCurrentBout(state);
  play(state, 'wait');
  play(state, 'tournamentFight');
  const health = state.hp;
  play(state, 'retreat');
  assert.equal(state.hp, health);
  assert.equal(state.tournament.enrolled, false);
  assert.equal(state.tournament.best, 1);
  assert.equal(state.tournament.result, '自行退赛');
  assert.match(view(state).tournament.claimName, /第一场.*奖品/);
  play(state, 'tournamentClaim');
  assert.equal(state.inventory.iron_talisman, 1);
  assert.equal(state.inventory.tournament_citation, undefined);
});

test('the brick ring prohibits applying medicine and meal recovery until the fighter steps down', () => {
  const state = atTheHall();
  state.inventory.salve = 2;
  state.inventory.qi_powder = 2;
  state.inventory.grain_pill = 1;
  state.realm = 1;
  state.hp = view(state).maxHp;
  const site = 'zhao_bamboo_duel';
  play(state, 'visit', { id: site });
  assert.match(view(state).visibleChoices.find(({ index }) => index === 1).desc, /药和口粮留在场下/);
  play(state, 'choose', { index: 1 });
  assert.equal(view(state).currentEnemy.medicineRestricted, true);
  for (const [action, id] of [['use', 'salve'], ['use', 'qi_powder'], ['use', 'grain_pill'], ['use', 'ration'], ['eat', 'ration']]) {
    const before = structuredClone(state);
    const blocked = act(state, action, { id });
    assert.equal(blocked.ok, false);
    assert.match(blocked.message, id === 'ration' ? /交手中只能用药/ : /禁用药物和饮食/);
    assert.deepEqual(state, before);
  }
  const purse = state.coins;
  state.hp = 1;
  play(state, 'attack');
  assert.equal(state.hp, 1);
  assert.equal(state.event, null);
  assert.equal(state.combat, null);
  assert.equal(state.coins, purse);
  assert.equal(state.inventory.salve, 2);
  assert.equal(state.wounds, 0);
  assert.equal(view(state).boutPause, rules.regulatedBoutCooldown);
  play(state, 'visit', { id: site });
  assert.match(act(state, 'choose', { index: 1 }).message, /先在场边歇/);
  play(state, 'leave');
  play(state, 'wait');
  play(state, 'visit', { id: site });
  assert.match(act(state, 'choose', { index: 1 }).message, /气血还没到一半/);
  play(state, 'leave');
  play(state, 'use', { id: 'salve' });
  assert.equal(state.inventory.salve, 1);
  play(state, 'restUntilRecovered');
  if (state.satiety < rules.rationSatiety) play(state, 'eat');
  play(state, 'visit', { id: site });
  play(state, 'choose', { index: 1 });
  play(state, 'retreat');
  assert.equal(view(state).boutPause, rules.regulatedBoutCooldown);
});

test('enemy medicine is withheld by strict referee rules even when an opponent carries a dose', () => {
  const state = atTheHall();
  getInvitation(state);
  play(state, 'tournamentEnroll');
  play(state, 'tournamentFight');
  const enemy = data.enemies.find(({ id }) => id === state.combat.id);
  const original = enemy.medicine;
  try {
    enemy.medicine = { id: 'heal_pill', count: 1 };
    Object.assign(state.combat, { round: 2, hp: 10, observedHits: [{ damage: 2 }], lastEnemyIntent: { kind: 'attack' } });
    const unrestricted = structuredClone(state);
    unrestricted.combat.siteId = 'bank_watch';
    act(unrestricted, 'use', { id: 'wood' });
    assert.equal(unrestricted.combat.plan.intent.kind, 'remedy');
    act(state, 'use', { id: 'wood' });
    assert.notEqual(state.combat.plan.intent.kind, 'remedy');
    assert.equal(state.combat.medicineLeft, undefined);
  } finally {
    if (original) enemy.medicine = original;
    else delete enemy.medicine;
  }
});

test('the real cave swordsman has no official referee protection on defeat', () => {
  const state = createGame(33);
  state.region = 'glass_rotunda';
  state.world.lastSettlement = 'mingsha_city';
  state.hp = 1;
  const purse = state.coins;
  play(state, 'visit', { id: 'sand_glass_chamber' });
  play(state, 'choose', { index: 0 });
  assert.equal(view(state).currentEnemy.sparring, false);
  play(state, 'attack');
  assert.equal(state.region, 'mingsha_city');
  assert.equal(state.wounds, 1);
  assert.ok(state.coins < purse);
  assert.equal(state.siteVictories.sand_glass_chamber, undefined);
});
