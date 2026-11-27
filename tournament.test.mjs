import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createGame, rules, view } from './engine.mjs';
import { data } from './data.mjs';
import { tournamentData } from './tournament.mjs';

const [outer, inner, elder] = tournamentData.stages;
const guild = 'water_gauge';

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function atTheHall() {
  const state = createGame(93);
  state.region = 'measuring_hall';
  state.world.lastSettlement = state.region;
  state.coins = 600;
  return state;
}

function joinTheHall(state) {
  const sect = data.sects.find(({ id }) => id === guild);
  Object.assign(state.inventory, sect.join.need);
  play(state, 'sectJoin');
  assert.equal(state.world.affiliation, guild);
}

function recoverForFlowTest(state) {
  while (state.day < state.regulatedBoutUntil) play(state, 'wait');
  state.satiety = 100;
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
}

function advanceRound(state, match) {
  recoverForFlowTest(state);
  assert.equal(view(state).tournament.match.name, match.name);
  assert.equal(view(state).tournament.match.grade, match.grade);
  play(state, 'tournamentFight');
  assert.equal(view(state).currentEnemy.id, match.enemy);
  assert.equal(view(state).currentEnemy.sparring, true);
  assert.equal(view(state).currentEnemy.medicineRestricted, true);
  assert.equal(act(state, 'rest').ok, false);
  assert.equal(act(state, 'tournamentFight').ok, false);
  state.combat.hp = 1;
  for (let i = 0; state.combat && i < 6; i++) play(state, 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.event, null);
  assert.equal(state.region, 'measuring_hall');
  assert.deepEqual(view(state).groundLoot, {});
}

function waitToEnterAgain(state, stage) {
  while (state.day < state.tournament.stages[stage.id].until) play(state, 'wait');
  recoverForFlowTest(state);
}

function claim(state, stage) {
  const pending = view(state).tournament.claims.find(({ id }) => id === stage.id);
  assert.ok(pending?.available);
  const before = { ...state.inventory, spirit_coin: state.coins };
  play(state, 'tournamentClaim', { id: stage.id });
  const after = { ...state.inventory, spirit_coin: state.coins };
  for (const [id, count] of Object.entries(pending.reward)) assert.equal(after[id] - (before[id] ?? 0), count, id);
  return pending.reward;
}

test('three teams have five distinct opponents with staged realms and strictly higher cumulative prizes', () => {
  const opponents = tournamentData.matches.map(({ enemy }) => data.enemies.find(({ id }) => id === enemy));
  assert.equal(new Set(opponents.map(({ id }) => id)).size, 15);
  assert.deepEqual(opponents.map(({ tier }) => tier), [0, 1, 2, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 7, 8]);
  for (const stage of tournamentData.stages) {
    assert.deepEqual(stage.prizes[0].reward, {});
    const strength = stage.matches.map(({ enemy }) => opponents.find(({ id }) => id === enemy));
    for (const [index, prize] of stage.prizes.slice(1).entries()) {
      const before = stage.prizes[index].reward;
      assert.ok(prize.reward.spirit_coin > (before.spirit_coin ?? 0), stage.id);
      assert.ok(Object.entries(before).every(([id, count]) => prize.reward[id] >= count), stage.id);
      if (index > 0) {
        assert.ok(strength[index].hp > strength[index - 1].hp, stage.id);
        assert.ok(strength[index].atk > strength[index - 1].atk, stage.id);
      }
    }
  }
});

test('membership, five fights per stage, stock room, promotions, and one visible handover', () => {
  const state = atTheHall();
  assert.equal(view(state).tournament.enlisted, false);
  assert.match(act(state, 'tournamentEnroll').message, /只收守尺观弟子/);
  assert.equal(state.coins, 600);
  joinTheHall(state);
  state.realm = 8;
  recoverForFlowTest(state);
  play(state, 'visit', { id: tournamentData.site });
  assert.match(play(state, 'choose', { index: 0 }).message, /各有五场/);
  assert.equal(state.event, tournamentData.site);
  assert.equal(view(state).tournament.canEnroll, true);
  assert.match(act(state, 'tournamentEnroll', { id: 'inner' }).message, /只能报名本门身份/);

  for (const stage of [outer, inner, elder]) {
    assert.equal(view(state).tournament.stageId, stage.id);
    const cash = state.coins;
    play(state, 'tournamentEnroll', { id: stage.id });
    assert.equal(state.coins, cash - stage.fee);
    assert.equal(act(state, 'tournamentEnroll').ok, false);
    for (const [index, match] of stage.matches.entries()) {
      advanceRound(state, match);
      assert.equal(state.tournament.stages[stage.id].wins, index + 1);
      if (index < stage.matches.length - 1) {
        const pending = view(state).tournament;
        assert.equal(pending.canFight, false);
        assert.equal(act(state, 'tournamentFight').message, pending.fightReason);
        assert.match(pending.fightReason, /先在场边歇/);
      }
    }
    assert.equal(state.tournament.stages[stage.id].result, '五场全胜');
    assert.equal(view(state).tournament.stages.find(({ id }) => id === stage.id).best, 5);
    assert.equal(act(state, 'tournamentEnroll', { id: stage.id }).ok, false);
  }

  assert.equal(state.tournament.handoverPending, true);
  assert.equal(state.world.memberships[guild].office, 'elder');
  assert.equal(view(state).tournament.handover.available, true);
  assert.match(act(state, 'tournamentEnroll').message, /来接印/);
  assert.match(play(state, 'tournamentHandover').message, /秦观澜.*闭关冲元婴中期/);
  assert.equal(state.world.memberships[guild].office, 'actingHead');
  assert.equal(view(state).tournament.handover.done, true);
  assert.equal(act(state, 'tournamentHandover').ok, false);
  assert.equal(act(state, 'tournamentFight').ok, false);

  const rations = state.inventory.ration;
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  assert.equal(view(state).tournament.canClaim, false);
  assert.deepEqual(view(state).tournament.claims.map(({ id }) => id), ['outer', 'inner', 'elder']);
  assert.match(act(state, 'tournamentClaim', { id: 'inner' }).message, /行囊装不下/);
  assert.equal(state.tournament.stages.inner.claimed, 0);
  state.inventory.ration = rations;
  assert.deepEqual(claim(state, inner), inner.prizes[5].reward);
  assert.deepEqual(claim(state, outer), outer.prizes[5].reward);
  assert.deepEqual(claim(state, elder), elder.prizes[5].reward);
  assert.equal(state.inventory.terrace_counter_manual, 1);
  assert.equal(state.inventory.tournament_citation, 1);
  assert.equal(state.inventory.measuring_cedar_ruler, 1);
  assert.equal(state.inventory.measuring_river_seal, 1);
  assert.equal(act(state, 'tournamentClaim').ok, false);
});

test('a first fight loss preserves possessions and gives no award; same or lower finish pays nothing', () => {
  const state = atTheHall();
  joinTheHall(state);
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
  assert.equal(state.tournament.stages.outer.best, 0);
  assert.equal(state.tournament.stages.outer.until - state.day, outer.cooldown);
  assert.match(act(state, 'tournamentEnroll').message, /再歇 4 日/);
  const nearReopening = structuredClone(state);
  nearReopening.day = state.tournament.stages.outer.until - 0.25;
  assert.match(act(nearReopening, 'tournamentEnroll').message, /再歇 0.25 日/);
  assert.equal(act(state, 'tournamentClaim').ok, false);

  state.realm = 8;
  waitToEnterAgain(state, outer);
  play(state, 'tournamentEnroll');
  advanceRound(state, outer.matches[0]);
  play(state, 'tournamentWithdraw');
  assert.deepEqual(claim(state, outer), outer.prizes[1].reward);
  assert.equal(act(state, 'tournamentClaim').ok, false);

  waitToEnterAgain(state, outer);
  play(state, 'tournamentEnroll');
  advanceRound(state, outer.matches[0]);
  play(state, 'tournamentWithdraw');
  assert.equal(act(state, 'tournamentClaim').ok, false);

  waitToEnterAgain(state, outer);
  play(state, 'tournamentEnroll');
  advanceRound(state, outer.matches[0]);
  advanceRound(state, outer.matches[1]);
  play(state, 'tournamentWithdraw');
  assert.deepEqual(claim(state, outer), outer.prizes[2].increment);
  assert.equal(act(state, 'tournamentClaim').ok, false);

  waitToEnterAgain(state, outer);
  play(state, 'tournamentEnroll');
  advanceRound(state, outer.matches[0]);
  play(state, 'tournamentWithdraw');
  assert.equal(act(state, 'tournamentClaim').ok, false);
  assert.equal(state.tournament.stages.outer.best, 2);
});

test('retreat during an official match concedes only the current competition', () => {
  const state = atTheHall();
  joinTheHall(state);
  state.realm = 8;
  play(state, 'tournamentEnroll');
  advanceRound(state, outer.matches[0]);
  recoverForFlowTest(state);
  play(state, 'tournamentFight');
  const health = state.hp;
  play(state, 'retreat');
  assert.equal(state.hp, health);
  assert.equal(state.tournament.current, null);
  assert.equal(state.tournament.stages.outer.best, 1);
  assert.equal(state.tournament.stages.outer.result, '自行退赛');
  assert.match(view(state).tournament.claimName, /外门大比.*一胜/);
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
  joinTheHall(state);
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

test('the cave swordsman honors the promised trial without official tournament rules', () => {
  const state = createGame(33);
  state.region = 'glass_rotunda';
  state.world.lastSettlement = 'mingsha_city';
  state.hp = 1;
  const purse = state.coins;
  play(state, 'visit', { id: 'sand_glass_chamber' });
  assert.match(view(state).visibleChoices[0].desc, /我就收刀/);
  play(state, 'choose', { index: 0 });
  assert.equal(view(state).currentEnemy.sparring, true);
  assert.equal(view(state).currentEnemy.medicineRestricted, false);
  play(state, 'attack');
  assert.equal(state.region, 'glass_rotunda');
  assert.equal(state.wounds, 0);
  assert.equal(state.coins, purse);
  assert.equal(state.siteVictories.sand_glass_chamber, undefined);
});
