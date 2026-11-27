export const banditRules = Object.freeze({
  distanceUnit: 2,
  gearGradeOdds: [[0.95, 0.05, 0], [0.04, 0.92, 0.04], [0, 0.06, 0.94]],
  wornWeights: { armor: 4, weapon: 2, offhand: 1, head: 2, boots: 2, belt: 1, charm: 1 },
  concealmentFactor: 1.25,
  maxConcealment: 0.45,
  ordinaryGearChance: 0.24,
  richGearChance: 0.75,
  recruitDelay: 18,
  recruitInterval: 6,
  fatalDefeatBase: 0.16,
  fatalDefeatPerTier: 0.02,
  fatalDefeatCap: 0.32,
  fatalChiefDefeat: 0.30,
  ignoreUnarmedChance: 0.65,
});

export const roadKey = (a, b) => [a, b].sort().join('|');

function draw(state) {
  state.roadSeed = (Math.imul(state.roadSeed ?? 1, 1664525) + 1013904223) >>> 0;
  return state.roadSeed / 0x100000000;
}

function chooseWeighted(state, rows, weight) {
  if (!rows.length) return null;
  let position = draw(state) * rows.reduce((sum, row) => sum + weight(row), 0);
  for (const row of rows) {
    position -= weight(row);
    if (position < 0) return row;
  }
  return rows.at(-1);
}

function range(state, [min, max]) {
  return min + Math.floor(draw(state) * (max - min + 1));
}

function crewRoster(crew) {
  return crew.members.flatMap((headcount, tier) =>
    Array.from({ length: headcount }, (_, index) => ({ tier, key: `${tier}:${index}` })));
}

function crewRecord(state, id) {
  return (state.banditCrews[id] ??= { encounters: 0, defeated: [] });
}

function lostLeader(state, crew, kit) {
  const boss = kit.data.roadBandits.dens[crew.den]?.boss;
  return boss && (state.siteVictories[crew.den]?.[boss] ?? 0) > 0;
}

function recruitmentTerms(crew) {
  return crew.recruit ?? { delay: banditRules.recruitDelay, interval: banditRules.recruitInterval };
}

function recruitsByNow(state, id, kit) {
  const record = state.banditCrews[id];
  if (!record?.defeated.length || record.nextRecruitDay == null || state.day < record.nextRecruitDay) return record;
  const crew = kit.data.roadBandits.crews[id];
  const { interval } = recruitmentTerms(crew);
  const amount = Math.min(record.defeated.length, Math.floor((state.day - record.nextRecruitDay) / interval) + 1);
  const recruits = { ...record.recruits };
  for (const key of record.defeated.slice(0, amount)) recruits[key] = (recruits[key] ?? 0) + 1;
  const defeated = record.defeated.slice(amount);
  return { ...record, defeated, recruits, nextRecruitDay: defeated.length ? record.nextRecruitDay + amount * interval : null };
}

function unresolvedBandit(crewId, enemies, state) {
  const roster = crewRoster(enemies);
  const defeated = new Set(state.banditCrews[crewId]?.defeated);
  const met = state.roadTrip.banditsMet ?? [];
  return roster.filter(({ key }) => !defeated.has(key) && !met.includes(`${crewId}/${key}`));
}

function memberLootSeed(state, bandit) {
  const replacement = state.banditCrews[bandit.crew]?.recruits?.[bandit.member] ?? 0;
  const identity = `${bandit.crew}:${bandit.member}${replacement ? `:${replacement}` : ''}`;
  return [...identity].reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0,
    state.banditLootSeed,
  );
}

function readWornGear(state, kit) {
  const gradeWeights = [0, 0, 0];
  let visible = 0;
  for (const [slot, id] of Object.entries(state.equipment)) {
    const gear = kit.records.gear[id];
    const tier = gear && (Object.hasOwn(gear, 'apparentTier') ? gear.apparentTier : gear.tier);
    if (!Number.isInteger(tier) || tier < 0) continue;
    const grade = Math.min(2, Math.floor(tier / 3));
    gradeWeights[grade] += banditRules.wornWeights[slot] ?? 1;
    visible++;
  }
  const strongest = gradeWeights.findLastIndex((weight) => weight > 0);
  const total = gradeWeights.reduce((sum, weight) => sum + weight, 0);
  const grade = gradeWeights.findIndex((weight) => weight >= total * 0.58);
  return { grade: visible >= 2 && grade !== -1 ? grade : null, visible, strongest };
}

export function apparentBanditGrade(state, kit) {
  return readWornGear(state, kit).grade;
}

export function roadBanditRisk(state, leg, kit) {
  if (leg.cross?.ferry || leg.cross?.guarded) return null;
  const profile = kit.data.roadBandits.roads.find(({ a, b }) => roadKey(a, b) === leg.key);
  if (!profile) return null;
  const crew = kit.data.roadBandits.crews[profile.crew];
  if (lostLeader(state, crew, kit)) {
    return { chance: 0, crew: profile.crew, riskText: '寨主倒了，沿路已无人敢伸手收钱。' };
  }
  const den = kit.data.roadBandits.dens[crew.den];
  const livingGuards = den ? (kit.banditDenPopulation?.(state, crew.den) ?? den.heads) : 0;
  const routed = den ? Math.max(0, den.heads - livingGuards) : 0;
  const population = crew.members.reduce((sum, number) => sum + number, 0);
  const defeated = recruitsByNow(state, profile.crew, kit)?.defeated.length ?? 0;
  const remaining = Math.max(0, population - defeated);
  const patrol = den ? den.minFactor + (1 - den.minFactor) * Math.min(1, livingGuards / den.heads) : 1;
  const avoidance = kit.activeGear(state)
    .flatMap(({ trait, traits = [] }) => [trait, ...traits])
    .reduce((sum, trait) => sum + (trait?.kind === 'dodge' ? trait.bonus : 0), 0);
  const concealment = Math.min(banditRules.maxConcealment, avoidance * banditRules.concealmentFactor);
  const sectPatrol = kit.measuringPatrolFactor?.(state, leg) ?? 1;
  return { chance: profile.chance * (remaining / population) * patrol * (1 - concealment) * sectPatrol, crew: profile.crew,
    riskText: !remaining ? '近来已看不见守路伸手的人。'
      : defeated >= population / 2 ? '这一带拦路的人已经少多了。'
      : sectPatrol < 1 ? '守尺观的巡堤弟子近来常走这段路。'
        : routed ? '路边的贼哨少了。' : profile.riskText };
}

function pickBandit(state, appearance, crewId, kit) {
  const crew = kit.data.roadBandits.crews[crewId];
  const roster = unresolvedBandit(crewId, crew, state);
  // When the cut of the clothes and the arms disagree, only scouts willing to
  // probe that apparent level will step off the road. A bare traveler is no prize.
  const odds = appearance.grade === null
    ? [[0.8, 0.12, 0], [0.35, 0.6, 0.05], [0, 0.3, 0.7]][Math.max(0, appearance.strongest)]
    : banditRules.gearGradeOdds[appearance.grade];
  let roll = draw(state);
  const stage = odds.findIndex((weight) => {
    roll -= weight;
    return roll < 0;
  });
  // An empty grade leaves its share of the road quiet.
  const members = roster.filter(({ tier }) => Math.floor(tier / 3) === stage);
  return chooseWeighted(state, members, ({ tier }) => [4, 3, 2][tier % 3]);
}

function unvisitedRoadStories(state, kit) {
  const met = state.roadTrip.banditsMet ?? [];
  return kit.data.roadBandits.fixed.filter(({ id }) => !state.resolvedBandits.includes(id) && !met.includes(id));
}

function roadStory(state, leg, crewId, grade, kit) {
  const options = unvisitedRoadStories(state, kit).filter(({ allowFight }) => allowFight !== false);
  const encounters = state.banditCrews[crewId]?.encounters ?? 0;
  const forced = options.find((story) => story.crew === crewId && story.forceAt && encounters + 1 >= story.forceAt);
  if (forced) return forced;
  const story = options.find(({ a, b, enemy, fee }) => roadKey(a, b) === leg.key &&
    (fee == null || Math.floor(kit.records.enemies[enemy].tier / 3) === grade));
  return story && draw(state) < story.chance ? story : null;
}

function stopForPasserby(state, leg, units, kit) {
  const story = unvisitedRoadStories(state, kit)
    .find(({ a, b, allowFight }) => allowFight === false && roadKey(a, b) === leg.key);
  if (!story || draw(state) >= 1 - (1 - story.chance) ** units) return null;
  (state.roadTrip.banditsMet ??= []).push(story.id);
  state.roadBandit = { fixed: story.id, nonThreat: true, fee: null, intro: story.intro };
  return { ...kit.say(state, story.intro), roadInterrupted: true };
}

function stopForBandit(state, leg, crewId, kit) {
  const appearance = readWornGear(state, kit);
  const { grade, visible, strongest } = appearance;
  const fixed = roadStory(state, leg, crewId, grade, kit);
  const member = fixed ? null : pickBandit(state, appearance, crewId, kit);
  if (!fixed && !member) return null;
  const pool = member && kit.data.roadBandits.pools.find(({ tier }) => tier === member.tier);
  const enemy = fixed ? fixed.enemy : pool.enemy;
  const stage = enemy ? Math.floor(kit.records.enemies[enemy].tier / 3) : grade;
  const nonThreat = Boolean(fixed && (fixed.allowFight === false || (fixed.fee != null && stage !== (grade ?? strongest))));
  const fee = fixed ? (nonThreat ? null : fixed.fee ?? null)
    : range({ roadSeed: memberLootSeed(state, { crew: crewId, member: member.key }) ^ 0x85a3ef1f }, pool.fee);
  const onStoryRoad = fixed && roadKey(fixed.a, fixed.b) === leg.key;
  const generation = state.banditCrews[crewId]?.recruits?.[member?.key] ?? 0;
  const individual = fixed ? null : kit.individualAt(state, enemy, `road:${crewId}:${member.key}:${generation}`);
  const uncertain = grade === null ? '他先看你手边，再抬眼打量你的行装，半晌才伸手拦住。' : '';
  const unexpected = stage < grade
    ? '他先打量你背光的一侧，伸手时并没看清护具的纹样。'
    : '路边的人本像是在等别的旅客。见你到了近处，他才挪身拦住。';
  const message = fixed
    ? ((nonThreat && fixed.nonThreatIntro) || (onStoryRoad ? fixed.intro : fixed.crewIntro ?? fixed.intro))
    : [uncertain || (stage === grade ? '来人横在道上，朝你的行囊抬了抬下巴。' : unexpected), individual.loadout?.tell].filter(Boolean).join('');
  (state.roadTrip.banditsMet ??= []).push(fixed?.id ?? `${crewId}/${member.key}`);
  crewRecord(state, crewId).encounters++;
  const passChance = visible === 0 ? banditRules.ignoreUnarmedChance : grade === null && stage < strongest ? 0.7 : 0;
  if (!fixed && passChance > 0 && draw(state) < passChance) {
    const pass = visible === 0 ? '「瞧不出有什么油水。走罢。」' : '他又看了一眼那件行头，收了兵器。「算了，过罢。」';
    return { ...kit.say(state, `强盗上下看了你一眼。${pass}`),
      roadInterrupted: true, banditDismissed: true };
  }
  state.roadBandit = { enemy, fixed: fixed?.id, crew: crewId, member: member?.key,
    fee, intro: message, nonThreat, ...(individual ? { individual } : {}) };
  return { ...kit.say(state, message), roadInterrupted: true };
}

export function checkRoadBanditStep(state, leg, index, kit) {
  const risks = (state.roadTrip.banditRiskByLeg ??= {});
  if (!Object.hasOwn(risks, leg.key)) risks[leg.key] = roadBanditRisk(state, leg, kit);
  const profile = risks[leg.key];
  const units = Math.min(1, leg.stepUnits ?? 1);
  if (profile?.chance > 0 && draw(state) < 1 - (1 - profile.chance) ** units) {
    const roster = recruitsByNow(state, profile.crew, kit);
    if (roster) state.banditCrews[profile.crew] = roster;
    const pause = stopForBandit(state, leg, profile.crew, kit);
    if (pause) return pause;
  }
  const passerby = stopForPasserby(state, leg, units, kit);
  if (passerby) return passerby;
  if (Object.keys(kit.groundAt(state)).length) {
    return { ...kit.say(state, '你认出路边这处石脚，地上还有些东西。'), roadInterrupted: true };
  }
  return null;
}

function demands(state, kit) {
  return Object.entries(state.inventory).flatMap(([id]) => {
    const item = kit.records.items[id];
    const count = kit.saleTerms(state, id).count;
    if (!(item?.sell > 0) || count <= 0 || kit.isEvidence(item) || item.keepOnFall || item.kind === 'manual') return [];
    const price = item.price > 0 ? Math.round((item.price + item.sell) / 2) : item.sell;
    return [{ id, name: item.name, count, price }];
  });
}

function storyOf(state, kit) {
  return kit.data.roadBandits.fixed.find(({ id }) => id === state.roadBandit?.fixed);
}

function plotOptions(story, encounter) {
  if (encounter.aftermath) return story?.afterWin?.actions ?? [];
  return [...(story?.actions ?? []), ...(encounter.nonThreat ? story?.nonThreatActions ?? [] : [])];
}

function plotReason(state, option, kit) {
  if (state.coins < (option.coins ?? 0)) return `还要带${option.coins}枚灵钱。`;
  const missing = Object.fromEntries(Object.entries(option.need ?? {})
    .map(([id, count]) => [id, count - kit.saleTerms(state, id).count])
    .filter(([, count]) => count > 0));
  if (!Object.keys(missing).length) return '';
  return [`手边还缺${kit.goodsText(missing)}。`, kit.packedRequirement(state, missing)].filter(Boolean).join(' ');
}

function tollOffer(state, bandit, kit) {
  const { coins = 0, goods = {} } = bandit.offer ?? {};
  const saleable = demands(state, kit);
  const offered = saleable.filter(({ id }) => goods[id] > 0)
    .map((item) => ({ ...item, count: Math.min(goods[item.id], item.count) }));
  const offerCoins = Math.min(coins, state.coins);
  const value = offerCoins + offered.reduce((sum, item) => sum + item.count * item.price, 0);
  return { saleable, offered, offerCoins, value, remaining: Math.max(0, bandit.fee - value),
    allValue: state.coins + saleable.reduce((sum, item) => sum + item.count * item.price, 0) };
}

export function roadBanditView(state, kit) {
  const bandit = state.roadBandit;
  if (!bandit || state.combat) return null;
  const story = storyOf(state, kit);
  const quote = bandit.fee === null ? null : tollOffer(state, bandit, kit);
  return { name: story?.name ?? kit.records.enemies[bandit.enemy].name,
    intro: bandit.intro,
    fee: bandit.fee, remaining: quote?.remaining ?? null, coins: state.coins,
    offerCoins: quote?.offerCoins ?? 0, offerValue: quote?.value ?? 0, offeredGoods: quote?.offered ?? [],
    offers: (quote?.saleable ?? []).flatMap(({ count, price, ...goods }) => {
      const selected = quote.offered.find(({ id }) => id === goods.id)?.count ?? 0;
      const held = count - selected;
      return held && quote.remaining > 0 ? [{ ...goods, held, count: Math.min(held, Math.ceil(quote.remaining / price)), price }] : [];
    }),
    allValue: quote?.allValue ?? state.coins,
    aftermath: Boolean(bandit.aftermath),
    passAllowed: bandit.nonThreat && !bandit.aftermath,
    fightAllowed: !bandit.nonThreat && !bandit.aftermath,
    actions: plotOptions(story, bandit).map(({ id, label, desc, ...option }) => {
      const reason = plotReason(state, option, kit);
      return { id, label, desc, available: !reason, reason };
    }),
  };
}

function resolveBandit(state, story, reward, message, kit) {
  if (story) (state.resolvedBandits ??= []).push(story.id);
  const found = reward?.revealSite && kit.records.sites[reward.revealSite];
  const newRoute = found && !state.banditLeads.includes(found.id);
  if (newRoute) state.banditLeads.push(found.id);
  const { accepted, spilled } = kit.addItems(state, reward?.loot ?? {}, true);
  const carried = kit.goodsText(accepted);
  const onGround = kit.goodsText(spilled);
  state.roadBandit = null;
  const outcome = `${message}${carried ? `得到${carried}。` : ''}${onGround ? `${onGround}留在脚边。` : ''}` +
    (newRoute ? `从${kit.records.regions[found.region].name}可以去「${found.name}」了。` : '');
  if (story && state.roadTrip) state.roadTrip.storyAftermath = outcome;
  return { ...kit.say(state, outcome), roadStoryResolved: Boolean(story), roadInterrupted: true };
}

function payAndPass(state, story, message, kit) {
  const aftermath = story?.afterPay;
  return resolveBandit(state, story, aftermath, message + (aftermath?.outcome ?? ''), kit);
}

function settleToll(state, story, coins, goods, kit) {
  for (const [id, count] of Object.entries(goods)) kit.removeItem(state, id, count, false);
  state.coins -= coins;
  const contents = [coins && `${coins}枚灵钱`, kit.goodsText(goods)].filter(Boolean).join('、');
  return { ...payAndPass(state, story, contents
    ? `你交出${contents}。他侧过身让出路。`
    : '你把空钱袋翻给他看。他嘟囔了一声，转进草里。', kit), paidGoods: goods, paidCoins: coins };
}

function spoilsOwner(state, siteId) {
  const road = state.roadBandit;
  if (!siteId && road) {
    return road.fixed ? `story:${road.fixed}` : `crew:${road.crew}/${road.member}`;
  }
  return siteId ? `den:${siteId}` : null;
}

function confiscate(state, siteId, kit, otherGoods = {}) {
  const gear = Object.keys(state.inventory).filter((id) => kit.records.gear[id])
    .map((id) => ({ id, durability: state.durability[id] }));
  const coins = state.coins;
  const goods = { ...otherGoods, ...Object.fromEntries(gear.map(({ id }) => [id, 1])) };
  const owner = spoilsOwner(state, siteId);
  if (owner && (coins || Object.keys(goods).length)) {
    const hold = (state.banditSpoils[owner] ??= { coins: 0, gear: [], goods: {} });
    hold.coins += coins;
    hold.gear.push(...gear);
    for (const [id, count] of Object.entries(otherGoods)) hold.goods[id] = (hold.goods[id] ?? 0) + count;
  }
  state.coins = 0;
  for (const [id, count] of Object.entries(goods)) kit.removeItem(state, id, count, false);
  return { goods, coins };
}

export function banditDefeat(state, enemy, kit) {
  const siteId = state.combat.siteId;
  const chief = kit.data.roadBandits.dens[siteId]?.boss === enemy.id;
  const chance = chief ? banditRules.fatalChiefDefeat
    : Math.min(banditRules.fatalDefeatCap, banditRules.fatalDefeatBase + enemy.tier * banditRules.fatalDefeatPerTier);
  state.banditLossSeed = (Math.imul(state.banditLossSeed, 1664525) + 1013904223) >>> 0;
  return { ...confiscate(state, siteId, kit), deadly: state.banditLossSeed / 0x100000000 < chance };
}

export function recoverBanditSpoils(state, siteId, kit, chiefFell = false) {
  const owners = [spoilsOwner(state, siteId)];
  if (chiefFell) {
    const crews = Object.entries(kit.data.roadBandits.crews).filter(([, crew]) => crew.den === siteId).map(([id]) => id);
    const stories = kit.data.roadBandits.fixed.filter(({ crew }) => crews.includes(crew)).map(({ id }) => `story:${id}`);
    owners.push(...Object.keys(state.banditSpoils).filter((key) => stories.includes(key) ||
      crews.some((id) => key.startsWith(`crew:${id}/`))));
  }
  const goods = {};
  let coins = 0;
  for (const owner of owners) {
    const hold = state.banditSpoils[owner];
    if (!hold) continue;
    delete state.banditSpoils[owner];
    coins += hold.coins;
    kit.leaveOnGround(state, hold.goods);
    for (const [id, count] of Object.entries(hold.goods)) goods[id] = (goods[id] ?? 0) + count;
    for (const { id, durability } of hold.gear) {
      kit.leaveOnGround(state, { [id]: 1 }, { [id]: durability });
      goods[id] = (goods[id] ?? 0) + 1;
    }
  }
  const cash = kit.addCoins(state, coins);
  const recovered = [coins && `${coins}枚灵钱`, kit.goodsText(goods)].filter(Boolean).join('、');
  return recovered ? `先前被强盗拿走的${recovered}找回来了。${Object.keys(goods).length ? '物件留在脚边。' : ''}${cash.spilled[kit.currency] ? '灵钱也留在脚边。' : ''}` : '';
}

const roadActions = new Set(['banditFight', 'banditPlot', 'banditPass', 'banditPay', 'banditPayCoins', 'banditPayItem',
  'banditSurrender', 'banditSettle', 'banditClearOffer']);

export function banditAction(state, action, { id, count = 1 }, kit) {
  if (!state.roadBandit || !roadActions.has(action)) return null;
  const bandit = state.roadBandit;
  const story = storyOf(state, kit);
  if (bandit.aftermath && action !== 'banditPlot') return kit.refuse('他还在等你答话。');
  if (action === 'banditPass') {
    if (!bandit.nonThreat) return kit.refuse('眼下他还挡在路上。');
    return resolveBandit(state, null, null, story?.passOutcome ?? '他侧过身让出路，你沿路往前走。', kit);
  }
  if (action === 'banditFight') {
    if (bandit.nonThreat) return kit.refuse('他已经把兵器收起，让开了路。');
    delete bandit.offer;
    kit.startCombat(state, bandit.enemy, undefined, false, bandit.individual);
    state.combat.roadBandit = true;
    return kit.say(state, '你把行囊拢到身后，摆开架势。');
  }
  if (action === 'banditPlot') {
    const option = plotOptions(story, bandit).find((entry) => entry.id === id);
    if (!option) return kit.refuse('眼下没有这个说法。');
    const reason = plotReason(state, option, kit);
    if (reason) return kit.refuse(reason);
    for (const [itemId, amount] of Object.entries(option.need ?? {})) kit.removeItem(state, itemId, amount, false);
    state.coins -= option.coins ?? 0;
    return resolveBandit(state, story, option, option.outcome, kit);
  }
  if (bandit.fee === null) return kit.refuse('他并未开口讨钱。');
  const { saleable, offered, offerCoins, remaining, allValue } = tollOffer(state, bandit, kit);
  if (action === 'banditPay') {
    if (state.coins < bandit.fee) return kit.refuse('手头的灵钱还不够。');
    return settleToll(state, story, bandit.fee, {}, kit);
  }
  if (action === 'banditClearOffer') {
    if (!bandit.offer) return kit.refuse('你还没挑东西。');
    delete bandit.offer;
    return kit.say(state, '你把挑出的钱物收回，重新打量他。');
  }
  if (action === 'banditSettle') {
    if (remaining) return kit.refuse(`还差${remaining}枚灵钱。`);
    return settleToll(state, story, offerCoins, Object.fromEntries(offered.map(({ id, count }) => [id, count])), kit);
  }
  if (action === 'banditSurrender') {
    if (allValue >= bandit.fee) {
      return kit.refuse('手里的东西还凑得齐，挑几样给他就能过去。');
    }
    const others = Object.fromEntries(saleable.filter(({ id }) => !kit.records.gear[id]).map(({ id, count }) => [id, count]));
    const paid = confiscate(state, null, kit, others);
    const message = paid.coins || Object.keys(paid.goods).length ? '你交出能抵价的财物和随身行装。强盗拿上东西，放你过去。'
      : '你摊开手。他踢了一脚空钱袋，挥手让你过去。';
    return { ...payAndPass(state, story, message, kit),
      paidGoods: paid.goods, paidCoins: paid.coins };
  }
  if (action === 'banditPayCoins') {
    const coins = Math.min(state.coins - offerCoins, remaining);
    if (!coins) return kit.refuse('手边没有更多散钱可添。');
    (bandit.offer ??= { coins: 0, goods: {} }).coins = offerCoins + coins;
    return kit.say(state, `打算添上${coins}枚灵钱。`);
  }
  const quote = saleable.find((item) => item.id === id);
  const selected = bandit.offer?.goods[id] ?? 0;
  if (!quote || !Number.isSafeInteger(count) || count < 1 ||
      count > Math.min(quote.count - selected, Math.ceil(remaining / quote.price))) {
    return kit.refuse('挑一样他肯收的物件，再看看数量。');
  }
  (bandit.offer ??= { coins: 0, goods: {} }).goods[id] = selected + count;
  return kit.say(state, `挑出${quote.name}×${count}，可抵${count * quote.price}枚灵钱。`);
}

export function winRoadBandit(state, enemy, kit) {
  const bandit = state.roadBandit;
  state.roadTrip.afterBattle = true;
  const story = storyOf(state, kit);
  const pool = kit.data.roadBandits.pools.find(({ enemy: id }) => id === enemy.id);
  const recovered = recoverBanditSpoils(state, null, kit);
  const lead = story ? `你击退了${enemy.name}。${recovered}` : `你击杀了${enemy.name}。${recovered}`;
  if (story?.afterWin?.actions?.length) {
    bandit.aftermath = true;
    bandit.fee = null;
    bandit.intro = story.afterWin.intro;
    return { ...kit.say(state, lead + bandit.intro), roadInterrupted: true };
  }
  if (story) return resolveBandit(state, story, story.afterWin, lead + (story.afterWin?.outcome ?? ''), kit);
  const record = recruitsByNow(state, bandit.crew, kit) ?? crewRecord(state, bandit.crew);
  state.banditCrews[bandit.crew] = record;
  record.defeated.push(bandit.member);
  if (record.nextRecruitDay == null) {
    const crew = kit.data.roadBandits.crews[bandit.crew];
    const { delay } = recruitmentTerms(crew);
    record.nextRecruitDay = state.day + delay;
  }
  const lootRoll = { roadSeed: memberLootSeed(state, bandit) };
  const rich = draw(lootRoll) < pool.richChance;
  const coins = range(lootRoll, rich ? pool.richCash : pool.cash);
  const choices = rich ? pool.richGear : pool.gear;
  const wornGear = enemy.loadout?.gearIds;
  const carried = wornGear ? choices.filter(({ id }) => wornGear.includes(id)) : choices;
  const candidate = draw(lootRoll) < (rich ? banditRules.richGearChance : banditRules.ordinaryGearChance) && carried.length
    ? chooseWeighted(lootRoll, carried, ({ weight }) => weight) : null;
  const item = candidate && !kit.groundAt(state)[candidate.id] && !kit.gearReserved(state, candidate.id)
    ? kit.records.gear[candidate.id] : null;
  const goods = { ...(coins ? { [kit.currency]: coins } : {}), ...(item ? { [item.id]: 1 } : {}) };
  const wear = item ? { [item.id]: Math.ceil(item.durability * range(lootRoll, rich ? [65, 87] : [34, 65]) / 100) } : {};
  kit.leaveOnGround(state, goods, wear);
  const loot = kit.goodsText(goods);
  const found = loot ? `脚边留下${loot}。` : '他身上没落下什么。';
  return { ...resolveBandit(state, null, null, lead + found, kit),
    ...(loot ? { gathered: goods, gatheredRegion: state.region } : {}) };
}
