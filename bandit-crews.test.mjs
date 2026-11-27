import assert from 'node:assert/strict';
import test from 'node:test';
import { banditRules, checkRoadBanditStep, roadBanditRisk } from './bandits.mjs';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';
import { roadGraph } from './world.mjs';

const crewId = 'grey_gully';
const greyLeader = 'bandit_den_leader';
const map = roadGraph(data);
const firstRoad = map.find(({ key }) => key === 'ridge|screen_slope');
const secondRoad = map.find(({ key }) => key === 'herb_basin|screen_slope');
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

const quietSeed = seedFor(...Array.from({ length: 16 }, () => [0.19, 1]));
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
  state.region = 'ridge';
  state.discovered.push('ridge', 'ford', 'screen_slope', 'herb_basin');
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

function stageDen() {
  const den = data.roadBandits.crews[crewId].den;
  const site = data.sites.find(({ id }) => id === den);
  const event = data.events.find(({ id }) => id === den);
  const state = readyTraveler();
  state.region = site.region;
  state.banditLeads.push(den);
  play(state, 'visit', { id: den });
  return { den, site, event, state };
}

function encounterInDen(state, seed) {
  state.encounterSeed = seed;
  const start = play(state, 'choose', { index: 0 });
  assert.ok(state.combat);
  const encounterText = data.events.find(({ id }) => id === state.combat.siteId)?.choices[0].encounterText;
  assert.ok(start.message.includes(encounterText[state.combat.id]), 'the approach describes the defender actually drawn');
  return state.combat.id;
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
      const { [data.roadBandits.dens[den].boss]: leader, ...guards } = hideout.creatures;
      assert.equal(leader.growth, 0);
      assert.ok(Object.values(guards).every(({ interval, growth }) => interval >= 28 && growth > 0));
      assert.equal(Object.values(hideout.creatures).reduce((sum, { start }) => sum + start, 0), data.roadBandits.dens[den].heads);
    }
    const local = readyTraveler();
    local.region = headquarters.region;
    assert.ok(!view(local).sites.some(({ name }) => name === headquarters.name));
  }
  assert.equal(Object.values(crews).filter(({ den }) => den).length, 3);
  const state = readyTraveler();
  assert.equal(risk(state, map.find(({ key }) => key === 'marsh|village')), 0);
});

test('regional witnesses point to a hidden den, where the chief alone opens the cache and clears its roads', () => {
  const outings = [
    { crew: 'ferryWood', witness: 'bandit_net_keeper', prize: 'bandit_ford_bell', money: 490, purse: 66 },
    { crew: 'windBridge', witness: 'bandit_salt_carrier', prize: 'bandit_salt_boots', money: 1750, purse: 210, carried: true },
  ];
  for (const { crew, witness, prize, money, purse, carried } of outings) {
    const { den, headquarters } = data.roadBandits.crews[crew];
    const { heads, boss } = data.roadBandits.dens[den];
    const roads = data.roadBandits.roads.filter((row) => row.crew === crew)
      .map(({ a, b }) => map.find(({ key }) => key === [a, b].sort().join('|')));
    const traveler = readyTraveler();
    traveler.region = headquarters.region;
    traveler.realm = 8;
    equip(traveler, 'fault_coat');
    equip(traveler, 'foil_sword');
    traveler.hp = view(traveler).maxHp;
    assert.ok(roads.every((road) => risk(traveler, road) > 0));
    assert.equal(act(traveler, 'visit', { id: den }).ok, false);
    play(traveler, 'visit', { id: witness });
    play(traveler, 'choose', { index: 0 });
    play(traveler, 'leave');
    play(traveler, 'visit', { id: den });
    assert.equal(act(traveler, 'choose', { index: 1 }).ok, false);
    assert.equal(encounterInDen(traveler, seedFor([1 - 0.5 / heads, 1])), boss);
    const beforeFight = traveler.coins;
    finishFight(traveler);
    assert.equal(traveler.siteVictories[den][boss], 1);
    assert.ok(roads.every((road) => risk(traveler, road) === 0));
    assert.equal(traveler.coins, beforeFight);
    assert.equal(view(traveler).groundLoot.spirit_coin, purse);
    play(traveler, 'take', { id: 'spirit_coin' });
    assert.equal(traveler.coins, beforeFight + purse);
    assert.equal(view(traveler).groundLoot.spirit_coin, undefined);
    if (carried) {
      assert.equal(view(traveler).groundLoot[prize], 1);
      play(traveler, 'take', { id: prize });
      assert.equal(traveler.durability[prize], Math.ceil(data.gear.find(item => item.id === prize).durability * 0.8));
    }
    const prior = traveler.coins;
    play(traveler, 'choose', { index: 1 });
    assert.equal(traveler.coins, prior + money);
    assert.equal(traveler.inventory[prize], 1);
    assert.equal(view(traveler).groundLoot[prize], undefined);
    assert.equal(act(traveler, 'choose', { index: 1 }).ok, false);
    assert.notEqual(encounterInDen(traveler, seedFor([0.95, 1])), boss);
  }
});

test('the third actual encounter shares its count across roads and a stronger traveler can ask about the hideout', () => {
  const state = readyTraveler();
  const source = data.roadBandits.fixed.find(({ crew, forceAt }) => crew === crewId && forceAt === 3);
  assert.ok(source);
  const outsider = structuredClone(state);
  outsider.region = 'screen_slope';
  assert.ok(!view(outsider).sites.some(({ id }) => id === data.roadBandits.crews[crewId].den));
  for (const [index, destination] of ['screen_slope', 'herb_basin'].entries()) {
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
  const tip = nextThreat(state, 'screen_slope');
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
  finishRoad(state, 'screen_slope');
  assert.ok(view(state).sites.some(({ id }) => id === data.roadBandits.crews[crewId].den));
});

test('one victory barely changes a fresh large crew and its loot does not reroll with travel RNG', () => {
  const state = readyTraveler();
  state.realm = 8;
  state.hp = view(state).maxHp;
  state.resolvedBandits.push('road_slate_peg');
  const otherCrewRoad = map.find(({ key }) => key === 'black_mine|snow_pass');
  const base = [risk(state, firstRoad), risk(state, secondRoad), risk(state, otherCrewRoad)];
  const size = crewMembers().length;
  assert.ok(size >= 40);
  const bandit = nextThreat(state, 'screen_slope', lowGradeEncounterSeed);
  const comparison = structuredClone(state);
  comparison.roadSeed = quietSeed;
  const victim = winRoadFight(state);
  const comparisonVictim = winRoadFight(comparison);
  assert.deepEqual(crewState(state).defeated, [bandit.member]);
  assert.deepEqual(victim.gathered, comparisonVictim.gathered);
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

  for (const [index, destination] of ['screen_slope', 'herb_basin'].entries()) {
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
    for (const id of Object.keys(view(state).groundLoot)) play(state, 'take', { id });
    finishRoad(state, destination);
  }
  assert.equal(new Set(wins).size, 2);
  assert.equal(new Set(crewState(state).defeated).size, members.length);
  assert.equal(risk(state, firstRoad), 0);
  assert.equal(risk(state, secondRoad), 0);

  state.day = firstRecruitDay - 1.25;
  state.roadSeed = chargedRiskSeed;
  const late = play(state, 'travel', { id: 'screen_slope' });
  assert.equal(late.roadInterrupted, undefined);
  assert.equal(state.region, 'screen_slope');
  assert.equal(state.roadBandit, null);
  assert.equal(crewState(state).encounters, 2);

  state.day = firstRecruitDay;
  const snapshot = structuredClone(crewState(state));
  assert.ok(Math.abs(risk(state, firstRoad) - base[0] / members.length) < 1e-12);
  assert.ok(Math.abs(risk(state, secondRoad) - base[1] / members.length) < 1e-12);
  assert.deepEqual(crewState(state), snapshot);

  const newcomer = nextThreat(state, 'herb_basin', lowGradeEncounterSeed);
  assert.equal(crewState(state).recruits[newcomer.member], 1);
  assert.equal(crewState(state).defeated.length, members.length - 1);
  assert.equal(crewState(state).nextRecruitDay, firstRecruitDay + banditRules.recruitInterval);
  play(state, 'banditPay');
  finishRoad(state, 'herb_basin');

  state.day = firstRecruitDay + banditRules.recruitInterval;
  const twoRecruits = nextThreat(state, 'screen_slope', lowGradeEncounterSeed);
  assert.equal(crewState(state).defeated.length, members.length - 2);
  assert.equal(Object.values(crewState(state).recruits).reduce((sum, count) => sum + count, 0), 2);
  assert.equal(crewState(state).nextRecruitDay, firstRecruitDay + 2 * banditRules.recruitInterval);
  assert.ok(crewState(state).recruits[twoRecruits.member]);
});

test('every live den defender has one ticket in the first draw, including the leader', () => {
  const { event, site, state } = stageDen();
  const assault = event.choices[0];
  const expected = Object.fromEntries(Object.entries(site.creatures).map(([id, { start }]) => [id, start]));
  const headcount = Object.values(expected).reduce((sum, amount) => sum + amount, 0);
  assert.ok(headcount >= 20);
  assert.equal(expected[greyLeader], 1);
  assert.deepEqual([...assault.encounter].sort(), [...Object.keys(expected)].sort());
  assert.ok(Object.values(assault.encounterWeights ?? {}).every((weight) => weight === 1));
  const sampled = {};
  for (let ticket = 0; ticket < headcount; ticket++) {
    const seed = seedFor([(ticket + 0.25) / headcount, (ticket + 0.75) / headcount]);
    const target = encounterInDen(structuredClone(state), seed);
    sampled[target] = (sampled[target] ?? 0) + 1;
  }
  assert.deepEqual(sampled, expected);
});

test('a first-fight leader win opens the one-time cache and ends linked road threats even after ordinary guards return', () => {
  const { den, event, site, state } = stageDen();
  const treasury = 1;
  const blade = 'gully_king_blade';
  const related = data.roadBandits.roads.filter(({ crew }) => crew === crewId);
  const otherRoad = map.find(({ key }) => key === 'black_mine|snow_pass');
  const linkedEdges = related.map(({ a, b }) => map.find(({ key }) => key === [a, b].sort().join('|')));
  const unaffectedRisk = risk(state, otherRoad);
  assert.ok(unaffectedRisk > 0);
  assert.ok(linkedEdges.every((edge) => risk(state, edge) > 0));
  assert.equal(act(state, 'choose', { index: treasury }).ok, false);
  state.realm = 8;
  equip(state, 'fault_coat');
  equip(state, 'foil_sword');
  state.hp = view(state).maxHp;
  const linkedSpoils = `crew:${crewId}/0:0`;
  const otherSpoils = 'crew:elsewhere/0:0';
  state.banditSpoils[linkedSpoils] = { coins: 7, goods: { wood: 1 }, gear: [{ id: 'knife', durability: 8 }] };
  state.banditSpoils[otherSpoils] = { coins: 6, goods: {}, gear: [] };
  const coinsBeforeBoss = state.coins;
  const bossSeed = seedFor([1 - 0.5 / data.roadBandits.dens[den].heads, 1]);
  assert.equal(encounterInDen(state, bossSeed), greyLeader);
  finishFight(state);
  assert.equal(state.coins, coinsBeforeBoss + 7);
  assert.equal(state.banditSpoils[linkedSpoils], undefined);
  assert.equal(state.banditSpoils[otherSpoils].coins, 6);
  assert.deepEqual(view(state).groundLoot, { wood: 1, knife: 1, spirit_coin: 28 });
  play(state, 'take', { id: 'spirit_coin' });
  assert.equal(state.coins, coinsBeforeBoss + 7 + 28);
  play(state, 'take', { id: 'knife' });
  assert.equal(state.durability.knife, 8);
  assert.deepEqual(state.siteVictories[den], { [greyLeader]: 1 });
  assert.ok(linkedEdges.every((edge) => risk(state, edge) === 0));
  assert.equal(risk(state, otherRoad), unaffectedRisk);

  const full = structuredClone(state);
  const pack = view(full);
  const existingRationSlots = Math.ceil(full.inventory.ration / rules.backpackStackSize);
  const roomForRations = pack.backpackCapacity - pack.backpackUsed + existingRationSlots;
  full.inventory.ration = roomForRations * rules.backpackStackSize;
  assert.equal(view(full).backpackUsed, pack.backpackCapacity);
  play(full, 'choose', { index: treasury });
  assert.equal(view(full).groundLoot[blade], 1);
  assert.equal(act(full, 'take', { id: blade }).ok, false);
  play(full, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(full, 'take', { id: blade });
  assert.equal(full.inventory[blade], 1);

  const beforeCache = state.coins;
  play(state, 'choose', { index: treasury });
  assert.equal(state.coins, beforeCache + event.choices[treasury].coins);
  assert.equal(event.choices[treasury].coins, 280);
  assert.equal(state.inventory[blade], 1);
  assert.equal(state.inventory.road_sleeve_manual, 1);
  const total = state.coins;
  const liveCamp = () => view(state).sites.find(({ id }) => id === den).creatures;
  assert.equal(liveCamp()[greyLeader], 0);
  const survivor = encounterInDen(state, bossSeed);
  assert.notEqual(survivor, greyLeader);
  finishFight(state);
  const ordinary = site.creatures[survivor];
  const returnDay = state.localPools[den].creatures[survivor].nextAt;
  assert.ok(returnDay > state.day);
  state.day = returnDay - 0.001;
  assert.equal(liveCamp()[survivor], ordinary.start - 1);
  state.day = returnDay;
  assert.equal(liveCamp()[survivor], ordinary.start);
  state.day += 365;
  assert.equal(liveCamp()[greyLeader], 0);
  assert.equal(act(state, 'choose', { index: treasury }).ok, false);
  assert.equal(state.coins, total);
  assert.ok(linkedEdges.every((edge) => risk(state, edge) === 0));

  for (const { a, b } of related) {
    const journey = structuredClone(state);
    play(journey, 'leave');
    journey.region = a;
    journey.discovered = [a, b];
    journey.roadSeed = chargedRiskSeed;
    journey.satiety = 96;
    assert.equal(play(journey, 'travel', { id: b }).roadInterrupted, undefined);
    assert.equal(journey.region, b);
    assert.equal(journey.roadSeed, chargedRiskSeed);
  }
});

test('a survivor can recover the camp stash from a different defender in the same den', () => {
  const { den, event, site, state } = stageDen();
  const first = encounterInDen(state, seedFor([0, 0.01]));
  const fighter = data.enemies.find(({ id }) => id === first);
  state.combat.plan = { round: 0, reader: null, intent: fighter.intents.find(({ kind }) => kind === 'attack') };
  state.coins = 37;
  state.hp = 1;
  state.banditLossSeed = 1500;
  state.durability.cudgel = 9;
  play(state, 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.region, 'village');
  assert.equal(state.coins, 0);
  assert.equal(state.inventory.cudgel, undefined);

  state.day += rules.mixedTrackDays;
  state.realm = 8;
  state.hp = view(state).maxHp;
  state.satiety = 96;
  state.roadSeed = quietSeed;
  play(state, 'travel', { id: site.region });
  assert.equal(state.region, site.region);
  play(state, 'visit', { id: den });
  const second = event.choices[0].encounter[1];
  const heads = data.roadBandits.dens[den].heads;
  const firstTickets = site.creatures[first].start;
  const secondSeed = seedFor([(firstTickets + 0.25) / heads, (firstTickets + 0.75) / heads]);
  assert.notEqual(first, second);
  assert.equal(encounterInDen(state, secondSeed), second);
  finishFight(state);
  assert.equal(state.coins, 37);
  for (const id of ['cudgel', 'straw_cape']) assert.equal(view(state).groundLoot[id], 1);
  play(state, 'take', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, 8);
});

test('a paid member can meet another traveler but cannot collect twice in the same trip', () => {
  const state = readyTraveler();
  state.resolvedBandits.push('road_slate_peg');
  const [remaining, ...unavailable] = crewMembers();
  state.banditCrews[crewId] = { encounters: 0, defeated: unavailable };
  const first = nextThreat(state, 'screen_slope', lowGradeEncounterSeed);
  assert.equal(first.member, remaining);
  play(state, 'banditPay');
  state.roadSeed = lowGradeEncounterSeed;
  const resumed = play(state, 'roadContinue');
  assert.equal(resumed.roadInterrupted, undefined);
  assert.equal(state.roadTrip, null);
  assert.equal(crewState(state).encounters, 1);

  const revisited = nextThreat(state, 'herb_basin', lowGradeEncounterSeed);
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

test('an empty matching grade does not make the rare adjacent grade intercept every hit', () => {
  const state = readyTraveler();
  equip(state, 'knife');
  assert.equal(state.equipment.armor, 'straw_cape');
  state.resolvedBandits = data.roadBandits.fixed.map(({ id }) => id);
  state.banditCrews[crewId] = { encounters: 0, defeated: crewMembers().filter(key => Number(key.split(':')[0]) < 3) };
  state.roadTrip = { banditsMet: [], banditRiskByLeg: { [firstRoad.key]: { chance: 1, crew: crewId } } };
  state.roadSeed = lowGradeEncounterSeed;
  const policy = { ...banditPolicy, groundAt: () => ({}) };
  assert.equal(checkRoadBanditStep(state, firstRoad, 1, policy), null);
  assert.equal(crewState(state).encounters, 0);
});

test('the wounded bandit can be spared or killed after defeating him and either choice points to the den', () => {
  const state = readyTraveler();
  state.realm = 8;
  state.hp = view(state).maxHp;
  const bandit = nextThreat(state, 'screen_slope', fixedEncounterSeed);
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

  const preparing = structuredClone(state);
  preparing.inventory.salve = 1;
  preparing.hp = 20;
  preparing.ground[preparing.roadTrip.stop] = { wood: 1 };
  play(preparing, 'use', { id: 'salve' });
  play(preparing, 'take', { id: 'wood' });
  assert.equal(preparing.roadBandit.aftermath, true);
  assert.equal(view(preparing).roadTrip.afterBattle, true);
  assert.equal(act(preparing, 'roadContinue').ok, false);
  play(preparing, 'banditPlot', { id: 'spare_slate_robber' });
  assert.equal(preparing.roadBandit, null);
  assert.equal(view(preparing).roadTrip.afterBattle, true);

  const spared = structuredClone(state);
  const killed = structuredClone(state);
  assert.match(play(spared, 'banditPlot', { id: 'spare_slate_robber' }).message, /许涧.*「.*灰沟.*」/);
  assert.match(play(killed, 'banditPlot', { id: 'kill_slate_robber' }).message, /送货图.*图上/);
  assert.equal(spared.inventory.ration, state.inventory.ration);
  assert.equal(killed.inventory.ration, state.inventory.ration + 1);
  for (const branch of [spared, killed]) {
    assert.equal(branch.roadBandit, null);
    assert.equal(branch.roadTrip.progress, state.roadTrip.progress);
    assert.ok(branch.resolvedBandits.includes(bandit.fixed));
    assert.ok(branch.banditLeads.includes(data.roadBandits.crews[crewId].den));
    assert.equal(act(branch, 'banditPlot', { id: 'kill_slate_robber' }).ok, false);
    finishRoad(branch, 'screen_slope');
  }
});
