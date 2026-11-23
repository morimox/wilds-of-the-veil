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
  for (let i = 0; state.combat && i < 16; i++) play(state, view(state).intent.kind === 'heavy' ? 'guard' : 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.event, null);
  assert.equal(state.region, 'measuring_hall');
  assert.deepEqual(view(state).groundLoot, {});
}

test('three real arena opponents, rest between bouts, and a one-time first place teaching', () => {
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
    assert.equal(act(state, 'rest').ok, false);
    assert.equal(act(state, 'tournamentFight').ok, false);
    winCurrentBout(state);
    assert.equal(view(state).tournament.wins, index + 1);
    if (index < 2) {
      state.qi = 0;
      play(state, 'rest');
      assert.equal(state.qi, rules.restQi);
      play(state, 'eat');
    }
  }
  assert.equal(view(state).tournament.result, '三场全胜');
  assert.equal(view(state).tournament.best, 3);
  assert.match(view(state).tournament.claimName, /三场全胜.*奖品/);
  assert.equal(state.knownArts.includes('terrace_reversing_stance'), false);
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
  assert.ok(state.knownArts.includes('terrace_reversing_stance'));
  assert.equal(act(state, 'tournamentClaim').ok, false);

  const prizeLead = atTheHall();
  prizeLead.region = 'village';
  prizeLead.realm = 5;
  prizeLead.knownItems.push('tournament_citation');
  assert.equal(view(prizeLead).discoveredArts.includes('terrace_reversing_stance'), false);
  assert.match(act(prizeLead, 'learn', { id: 'terrace_reversing_stance' }).message, /当面教/);
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
  assert.ok(state.hp >= 1);
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
