import assert from 'node:assert/strict';
import test from 'node:test';
import { banditRules, roadBanditRisk } from './bandits.mjs';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';
import { roadGraph } from './world.mjs';

const crewId = 'grey_gully';
const greyLeader = 'bandit_den_leader';
const map = roadGraph(data);
const firstRoad = map.find(({ key }) => key === 'marsh|ridge');
const secondRoad = map.find(({ key }) => key === 'ford|ridge');
const gear = Object.fromEntries(data.gear.map((item) => [item.id, item]));
const banditPolicy = { data, records: { gear },
  activeGear: (state) => Object.values(state.equipment).filter((id) => state.durability[id] > 0).map((id) => gear[id]),
};

function seedFor(...ranges) {
  for (let seed = 0; seed < 500_000; seed++) {
    let cursor = seed;
    if (ranges.every(([min, max]) => {
      cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0;
      const roll = cursor / 0x100000000;
      return roll >= min && roll < max;
    })) return seed;
  }
  throw new Error('No seed for requested succession of draw ranges');
}

const quietSeed = seedFor(...Array.from({ length: 12 }, () => [0.1, 1]));
const chargedRiskSeed = seedFor([0, 0.0001], [0.95, 1]);
const lowGradeEncounterSeed = seedFor([0, 0.0001], [0, 0.4]);
const fixedEncounterSeed = seedFor([0, 0.0001], [0, 0.2]);
const matchingStageSeed = seedFor([0, 0.0001], [0.15, 0.85]);
const crewState = (state) => state.banditCrews[crewId];
const risk = (state, road) => roadBanditRisk(state, road, banditPolicy)?.chance ?? 0;
const crewMembers = () => data.roadBandits.crews[crewId].members.flatMap((count, tier) =>
  Array.from({ length: count }, (_, index) => `${tier}:${index}`));

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${state.region} – ${action}: ${result.message}`);
  return result;
}

function readyTraveler() {
  const state = createGame(1129);
  state.region = 'marsh';
  state.discovered.push('ridge', 'ford', 'screen_slope');
  state.coins = 100;
  state.satiety = 96;
  return state;
}

function nextThreat(state, destination, seed = chargedRiskSeed) {
  state.roadSeed = seed;
  state.satiety = 96;
  const result = play(state, 'travel', { id: destination });
  assert.equal(result.roadInterrupted, true);
  assert.equal(state.roadBandit.crew, crewId);
  return state.roadBandit;
}

function finishRoad(state, destination) {
  state.roadSeed = quietSeed;
  play(state, 'roadContinue');
  assert.equal(state.roadTrip, null);
  assert.equal(state.region, destination);
}

function equip(state, id) {
  state.inventory[id] = 1;
  state.durability[id] = gear[id].durability;
  play(state, 'equip', { id });
}

function winRoadFight(state) {
  play(state, 'banditFight');
  return finishFight(state);
}

function finishFight(state) {
  let result;
  for (let turn = 0; state.combat && turn < 14; turn++) result = play(state, 'attack');
  assert.equal(state.combat, null);
  return result;
}

test('all hazardous edges belong to populated crews with a headquarters and most trails stay safe', () => {
  const { crews, roads } = data.roadBandits;
  assert.ok(Object.keys(crews).length > 1);
  assert.ok(map.length / 2 > roads.length);
  for (const { a, b, crew } of roads) {
    const edge = map.find(({ key }) => key === [a, b].sort().join('|'));
    assert.ok(edge, `${a} to ${b} is unconnected`);
    assert.equal(Boolean(edge.water), false);
    assert.ok(crews[crew]?.members.some((count) => count > 0), `${crew} needs a population`);
  }
  for (const { members, den, headquarters } of Object.values(crews)) {
    assert.ok(data.regions.some(({ id }) => id === headquarters.region));
    assert.ok(headquarters.name);
    assert.equal(members.length, 9);
    assert.ok(members.every((count) => Number.isInteger(count) && count >= 0));
    if (den) {
      const hideout = data.sites.find(({ id, region }) => id === den && region === headquarters.region);
      assert.ok(hideout);
      const { [greyLeader]: leader, ...guards } = hideout.creatures;
      assert.equal(leader.growth, 0);
      assert.ok(Object.values(guards).every(({ interval, growth }) => interval >= 28 && growth > 0));
      assert.equal(Object.values(hideout.creatures).reduce((sum, { start }) => sum + start, 0), data.roadBandits.dens[den].heads);
    }
    const local = readyTraveler();
    local.region = headquarters.region;
    assert.ok(!view(local).sites.some(({ name }) => name === headquarters.name));
  }
  assert.equal(Object.values(crews).filter(({ den }) => den).length, 1);
  const state = readyTraveler();
  assert.equal(risk(state, map.find(({ key }) => key === 'marsh|village')), 0);
});

test('the third actual encounter shares its count across roads and a stronger traveler can ask about the hideout', () => {
  const state = readyTraveler();
  const source = data.roadBandits.fixed.find(({ crew, forceAt }) => crew === crewId && forceAt === 3);
  assert.ok(source);
  const outsider = structuredClone(state);
  outsider.region = 'screen_slope';
  assert.ok(!view(outsider).sites.some(({ id }) => id === data.roadBandits.crews[crewId].den));
  for (const [index, destination] of ['ridge', 'ford'].entries()) {
    const bandit = nextThreat(state, destination);
    assert.ok(bandit.member);
    assert.equal(bandit.fixed, undefined);
    assert.equal(crewState(state).encounters, index + 1);
    const prior = structuredClone(crewState(state));
    view(state);
    assert.equal(act(state, 'roadContinue').ok, false);
    assert.deepEqual(crewState(state), prior);
    const fee = bandit.fee;
    assert.equal(play(state, 'banditPay').paidCoins, fee);
    assert.deepEqual(crewState(state), prior);
    finishRoad(state, destination);
  }

  state.realm = 8;
  equip(state, 'fault_coat');
  equip(state, 'foil_sword');
  const tip = nextThreat(state, 'ridge');
  assert.equal(tip.fixed, source.id);
  assert.equal(crewState(state).encounters, 3);
  assert.equal(view(state).roadTrip.bandit.remaining, null);
  const option = view(state).roadTrip.bandit.actions.find(({ id }) => id === 'ask_cart_road');
  assert.ok(option?.available);
  const beforeCoins = state.coins;
  play(state, 'banditPlot', { id: option.id });
  assert.equal(state.coins, beforeCoins);
  assert.deepEqual(crewState(state).defeated, []);
  assert.ok(state.resolvedBandits.includes(source.id));
  finishRoad(state, 'ridge');
  play(state, 'travel', { id: 'screen_slope' });
  assert.ok(view(state).sites.some(({ id }) => id === data.roadBandits.crews[crewId].den));
});

test('one victory barely changes a fresh large crew and its loot does not reroll with travel RNG', () => {
  const state = readyTraveler();
  state.realm = 8;
  state.hp = view(state).maxHp;
  state.resolvedBandits.push('road_slate_peg');
  const otherCrewRoad = map.find(({ key }) => key === 'ford|marsh');
  const base = [risk(state, firstRoad), risk(state, secondRoad), risk(state, otherCrewRoad)];
  const size = crewMembers().length;
  assert.ok(size >= 40);
  const bandit = nextThreat(state, 'ridge', lowGradeEncounterSeed);
  const comparison = structuredClone(state);
  comparison.roadSeed = quietSeed;
  const victim = winRoadFight(state);
  const comparisonVictim = winRoadFight(comparison);
  assert.deepEqual(crewState(state).defeated, [bandit.member]);
  assert.equal(victim.roadCoins, comparisonVictim.roadCoins);
  assert.deepEqual(view(state).groundLoot, view(comparison).groundLoot);
  assert.deepEqual(state.groundDurability, comparison.groundDurability);
  for (const [index, road] of [firstRoad, secondRoad].entries()) {
    assert.ok(Math.abs(risk(state, road) - base[index] * (size - 1) / size) < 1e-12);
  }
  assert.equal(risk(state, otherCrewRoad), base[2]);
});

test('road wins temporarily empty the shared patrol and recruits arrive one at a time', () => {
  const state = readyTraveler();
  state.realm = 8;
  state.hp = view(state).maxHp;
  state.resolvedBandits.push('road_slate_peg');
  const members = crewMembers();
  const base = [risk(state, firstRoad), risk(state, secondRoad)];
  assert.ok(base.every((chance) => chance > 0));
  const live = Math.min(2, members.length);
  assert.equal(live, 2);
  state.banditCrews[crewId] = { encounters: 0, defeated: members.slice(live) };
  const wins = [];
  let firstRecruitDay;

  for (const [index, destination] of ['ridge', 'ford'].entries()) {
    const remaining = live - index;
    for (const [roadIndex, road] of [firstRoad, secondRoad].entries()) {
      const expected = base[roadIndex] * remaining / members.length;
      assert.ok(Math.abs(risk(state, road) - expected) < 1e-12);
    }
    const target = nextThreat(state, destination, lowGradeEncounterSeed);
    assert.ok(target.member);
    assert.ok(!crewState(state).defeated.includes(target.member));
    winRoadFight(state);
    assert.equal(state.roadBandit, null);
    assert.ok(crewState(state).defeated.includes(target.member));
    wins.push(target.member);
    if (index === 0) firstRecruitDay = state.day + banditRules.recruitDelay;
    assert.equal(crewState(state).nextRecruitDay, firstRecruitDay);
    finishRoad(state, destination);
  }
  assert.equal(new Set(wins).size, 2);
  assert.equal(new Set(crewState(state).defeated).size, members.length);
  assert.equal(risk(state, firstRoad), 0);
  assert.equal(risk(state, secondRoad), 0);

  state.day = firstRecruitDay - 1.25;
  state.roadSeed = chargedRiskSeed;
  const late = play(state, 'travel', { id: 'ridge' });
  assert.equal(late.roadInterrupted, undefined);
  assert.equal(state.region, 'ridge');
  assert.equal(state.roadBandit, null);
  assert.equal(crewState(state).encounters, 2);

  state.day = firstRecruitDay;
  const snapshot = structuredClone(crewState(state));
  assert.ok(Math.abs(risk(state, firstRoad) - base[0] / members.length) < 1e-12);
  assert.ok(Math.abs(risk(state, secondRoad) - base[1] / members.length) < 1e-12);
  assert.deepEqual(crewState(state), snapshot);

  const newcomer = nextThreat(state, 'ford', lowGradeEncounterSeed);
  assert.equal(crewState(state).recruits[newcomer.member], 1);
  assert.equal(crewState(state).defeated.length, members.length - 1);
  assert.equal(crewState(state).nextRecruitDay, firstRecruitDay + banditRules.recruitInterval);
  play(state, 'banditPay');
  finishRoad(state, 'ford');

  state.day = firstRecruitDay + banditRules.recruitInterval;
  const twoRecruits = nextThreat(state, 'ridge', lowGradeEncounterSeed);
  assert.equal(crewState(state).defeated.length, members.length - 2);
  assert.equal(Object.values(crewState(state).recruits).reduce((sum, count) => sum + count, 0), 2);
  assert.equal(crewState(state).nextRecruitDay, firstRecruitDay + 2 * banditRules.recruitInterval);
  assert.ok(crewState(state).recruits[twoRecruits.member]);
});

test('the camp can rebuild its patrol but never its leader or paid treasury', () => {
  const state = readyTraveler();
  state.realm = 8;
  state.hp = view(state).maxHp;
  state.resolvedBandits.push('road_slate_peg');
  nextThreat(state, 'ridge', lowGradeEncounterSeed);
  winRoadFight(state);
  const originalRecruitDay = crewState(state).nextRecruitDay;
  finishRoad(state, 'ridge');
  nextThreat(state, 'ford', lowGradeEncounterSeed);
  winRoadFight(state);
  finishRoad(state, 'ford');

  const den = data.roadBandits.crews[crewId].den;
  const camp = data.sites.find(({ id }) => id === den);
  const event = data.events.find(({ id }) => id === den);
  const treasury = event.choices.findIndex(({ afterFight, coins }) => afterFight === greyLeader && coins >= 150);
  assert.ok(treasury >= 0);
  state.banditLeads.push(den);
  equip(state, 'fault_coat');
  equip(state, 'foil_sword');
  state.inventory.ration = 15;
  play(state, 'travel', { id: camp.region });
  play(state, 'visit', { id: den });
  for (const [id, { start }] of Object.entries(camp.creatures)) {
    const index = event.choices.findIndex(({ enemy }) => enemy === id);
    assert.ok(index >= 0);
    if (id === greyLeader) {
      const afterDueRecruit = structuredClone(state);
      afterDueRecruit.day = originalRecruitDay;
      play(afterDueRecruit, 'choose', { index });
      finishFight(afterDueRecruit);
      assert.equal(Object.values(crewState(afterDueRecruit).recruits).reduce((sum, count) => sum + count, 0), 1);
      assert.equal(crewState(afterDueRecruit).defeated.length, 1);
      assert.equal(crewState(afterDueRecruit).nextRecruitDay, afterDueRecruit.day + banditRules.leaderlessDelay);
    }
    for (let round = 0; round < start; round++) {
      if (state.satiety < 40) play(state, 'eat', { id: 'ration' });
      play(state, 'choose', { index });
      assert.equal(state.combat.id, id);
      finishFight(state);
    }
  }

  assert.equal(state.siteVictories[den][greyLeader], 1);
  const leaderFallDay = state.day;
  assert.ok(originalRecruitDay > leaderFallDay);
  const deferredRecruitDay = leaderFallDay + banditRules.leaderlessDelay;
  assert.equal(crewState(state).nextRecruitDay, deferredRecruitDay);
  const pocket = state.coins;
  play(state, 'choose', { index: treasury });
  assert.equal(state.coins, pocket + event.choices[treasury].coins);
  const leaderless = structuredClone(state);
  leaderless.day = deferredRecruitDay;
  play(leaderless, 'leave');
  play(leaderless, 'equip', { id: 'straw_cape' });
  play(leaderless, 'equip', { id: 'cudgel' });
  nextThreat(leaderless, 'ridge', lowGradeEncounterSeed);
  assert.ok(crewState(leaderless).defeated.length > 0);
  assert.equal(crewState(leaderless).nextRecruitDay, deferredRecruitDay + banditRules.leaderlessInterval);

  const liveCamp = () => view(state).sites.find(({ id }) => id === den).creatures;
  const { [greyLeader]: ignored, ...ordinary } = camp.creatures;
  const [firstReturning] = Object.keys(ordinary).sort((a, b) =>
    state.localPools[den].creatures[a].nextAt - state.localPools[den].creatures[b].nextAt);
  const ordinaryRejoin = state.localPools[den].creatures[firstReturning].nextAt;
  assert.ok(ordinaryRejoin > state.day);
  state.day = ordinaryRejoin - 0.001;
  assert.equal(liveCamp()[firstReturning], 0);
  state.day = ordinaryRejoin;
  assert.equal(liveCamp()[firstReturning], ordinary[firstReturning].growth);
  assert.equal(liveCamp()[greyLeader], 0);

  state.day += 365;
  for (const [id, { cap }] of Object.entries(ordinary)) assert.equal(liveCamp()[id], cap);
  assert.equal(liveCamp()[greyLeader], 0);
  assert.ok(risk(state, firstRoad) < 0.055);
  const total = state.coins;
  play(state, 'leave');
  play(state, 'visit', { id: den });
  assert.equal(act(state, 'choose', { index: treasury }).ok, false);
  assert.equal(state.coins, total);
});

test('a paid member can meet another traveler but cannot collect twice in the same trip', () => {
  const state = readyTraveler();
  state.resolvedBandits.push('road_slate_peg');
  const [remaining, ...unavailable] = crewMembers();
  state.banditCrews[crewId] = { encounters: 0, defeated: unavailable };
  const first = nextThreat(state, 'ridge', lowGradeEncounterSeed);
  assert.equal(first.member, remaining);
  play(state, 'banditPay');
  state.roadSeed = lowGradeEncounterSeed;
  const resumed = play(state, 'roadContinue');
  assert.equal(resumed.roadInterrupted, undefined);
  assert.equal(state.roadTrip, null);
  assert.equal(crewState(state).encounters, 1);

  const revisited = nextThreat(state, 'ford', lowGradeEncounterSeed);
  assert.equal(revisited.member, remaining);
  assert.equal(revisited.fee, first.fee);
  assert.equal(crewState(state).encounters, 2);
});

test('the all-Gold crew ignores worn starter gear and challenges a visibly high-grade traveler', () => {
  const { crews, roads, fixed } = data.roadBandits;
  const [crew] = Object.entries(crews).find(([, { members }]) => members.slice(0, 6).every((count) => count === 0)) ?? [];
  assert.ok(crew);
  const hasPlot = ({ a, b }) => fixed.some((story) => [story.a, story.b].sort().join('|') === [a, b].sort().join('|'));
  const ordinaryPath = roads.find((road) => road.crew === crew && !hasPlot(road));
  assert.ok(ordinaryPath);
  const { a, b } = ordinaryPath;
  const ordinary = readyTraveler();
  ordinary.region = a;
  ordinary.discovered.push(a, b);
  ordinary.roadSeed = matchingStageSeed;
  const matching = structuredClone(ordinary);
  const startedWith = ordinary.roadSeed;
  assert.equal(play(ordinary, 'travel', { id: b }).roadInterrupted, undefined);
  assert.equal(ordinary.region, b);
  assert.notEqual(ordinary.roadSeed, startedWith);
  assert.ok(!ordinary.banditCrews[crew]?.encounters);

  matching.realm = 8;
  equip(matching, 'fault_coat');
  equip(matching, 'foil_sword');
  const challenged = play(matching, 'travel', { id: b });
  assert.equal(challenged.roadInterrupted, true);
  assert.equal(matching.roadBandit.crew, crew);
  assert.ok(data.enemies.find(({ id }) => id === matching.roadBandit.enemy).tier >= 6);
  assert.equal(matching.banditCrews[crew].encounters, 1);
});

test('the wounded bandit can be spared or killed after defeating him and either choice points to the den', () => {
  const state = readyTraveler();
  state.realm = 8;
  state.hp = view(state).maxHp;
  const bandit = nextThreat(state, 'ridge', fixedEncounterSeed);
  assert.equal(bandit.fixed, 'road_slate_peg');
  winRoadFight(state);
  assert.ok(state.roadBandit.aftermath);
  assert.ok(!state.resolvedBandits.includes(bandit.fixed));
  assert.ok(!state.banditLeads.includes(data.roadBandits.crews[crewId].den));
  assert.equal(act(state, 'banditFight').ok, false);
  assert.equal(act(state, 'banditPay').ok, false);
  assert.equal(act(state, 'roadContinue').ok, false);
  const choices = view(state).roadTrip.bandit.actions.filter(({ available }) => available).map(({ id }) => id);
  assert.deepEqual(choices, ['spare_slate_robber', 'kill_slate_robber']);

  const spared = structuredClone(state);
  const killed = structuredClone(state);
  assert.match(play(spared, 'banditPlot', { id: 'spare_slate_robber' }).message, /「.*灰沟.*」/);
  assert.match(play(killed, 'banditPlot', { id: 'kill_slate_robber' }).message, /送货图.*图上/);
  assert.equal(spared.inventory.ration, state.inventory.ration);
  assert.equal(killed.inventory.ration, state.inventory.ration + 1);
  for (const branch of [spared, killed]) {
    assert.equal(branch.roadBandit, null);
    assert.equal(branch.roadTrip.progress, state.roadTrip.progress);
    assert.ok(branch.resolvedBandits.includes(bandit.fixed));
    assert.ok(branch.banditLeads.includes(data.roadBandits.crews[crewId].den));
    assert.equal(act(branch, 'banditPlot', { id: 'kill_slate_robber' }).ok, false);
    finishRoad(branch, 'ridge');
  }
});
