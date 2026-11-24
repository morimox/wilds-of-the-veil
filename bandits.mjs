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
  leaderlessDelay: 36,
  leaderlessInterval: 12,
  leaderlessPatrol: 0.55,
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

function recruitmentTerms(state, crew, kit) {
  if (lostLeader(state, crew, kit)) return { delay: banditRules.leaderlessDelay, interval: banditRules.leaderlessInterval };
  return crew.recruit ?? { delay: banditRules.recruitDelay, interval: banditRules.recruitInterval };
}

function recruitsByNow(state, id, kit) {
  const record = state.banditCrews[id];
  if (!record?.defeated.length || record.nextRecruitDay == null || state.day < record.nextRecruitDay) return record;
  const crew = kit.data.roadBandits.crews[id];
  const { interval } = recruitmentTerms(state, crew, kit);
  const amount = Math.min(record.defeated.length, Math.floor((state.day - record.nextRecruitDay) / interval) + 1);
  const recruits = { ...record.recruits };
  for (const key of record.defeated.slice(0, amount)) recruits[key] = (recruits[key] ?? 0) + 1;
  const defeated = record.defeated.slice(amount);
  return { ...record, defeated, recruits, nextRecruitDay: defeated.length ? record.nextRecruitDay + amount * interval : null };
}

export function deferBanditRecruits(state, siteId, enemyId, kit) {
  if (kit.data.roadBandits.dens[siteId]?.boss !== enemyId) return;
  for (const [id, crew] of Object.entries(kit.data.roadBandits.crews)) {
    if (crew.den !== siteId) continue;
    const record = recruitsByNow(state, id, kit);
    if (!record) continue;
    state.banditCrews[id] = record;
    if (record.defeated.length) record.nextRecruitDay = Math.max(record.nextRecruitDay ?? 0, state.day + banditRules.leaderlessDelay);
  }
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

export function apparentBanditGrade(state, kit) {
  const gradeWeights = [0, 0, 0];
  for (const [slot, id] of Object.entries(state.equipment)) {
    const gear = kit.records.gear[id];
    if (gear) gradeWeights[Math.min(2, Math.floor(gear.tier / 3))] += banditRules.wornWeights[slot] ?? 1;
  }
  const median = gradeWeights.reduce((sum, amount) => sum + amount, 0) / 2;
  return gradeWeights[0] >= median ? 0 : gradeWeights[0] + gradeWeights[1] >= median ? 1 : 2;
}

export function roadBanditRisk(state, leg, kit) {
  if (leg.cross?.ferry) return null;
  const profile = kit.data.roadBandits.roads.find(({ a, b }) => roadKey(a, b) === leg.key);
  if (!profile) return null;
  const crew = kit.data.roadBandits.crews[profile.crew];
  const den = kit.data.roadBandits.dens[crew.den];
  const leaderless = lostLeader(state, crew, kit);
  const livingGuards = den ? (kit.banditDenPopulation?.(state, crew.den) ?? den.heads) : 0;
  const routed = den ? Math.max(0, den.heads - livingGuards) : 0;
  const population = crew.members.reduce((sum, number) => sum + number, 0);
  const defeated = recruitsByNow(state, profile.crew, kit)?.defeated.length ?? 0;
  const remaining = Math.max(0, population - defeated);
  const maximumPatrol = leaderless ? banditRules.leaderlessPatrol : 1;
  const patrol = den ? den.minFactor + (maximumPatrol - den.minFactor) * Math.min(1, livingGuards / den.heads) : 1;
  const avoidance = kit.activeGear(state)
    .flatMap(({ trait, traits = [] }) => [trait, ...traits])
    .reduce((sum, trait) => sum + (trait?.kind === 'dodge' ? trait.bonus : 0), 0);
  const concealment = Math.min(banditRules.maxConcealment, avoidance * banditRules.concealmentFactor);
  return { chance: profile.chance * (remaining / population) * patrol * (1 - concealment), crew: profile.crew,
    riskText: !remaining ? '近来已看不见守路伸手的人。'
      : leaderless ? '坡寨换了人看门，路边的贼哨稀了。'
      : defeated >= population / 2 ? '这一带拦路的人已经少多了。'
      : routed ? '路边的贼哨少了。' : profile.riskText };
}

function pickBandit(state, grade, crewId, kit) {
  const stages = banditRules.gearGradeOdds[grade].map((weight, index) => ({ index, weight }));
  const stage = chooseWeighted(state, stages, ({ weight }) => weight).index;
  const crew = kit.data.roadBandits.crews[crewId];
  return chooseWeighted(state, unresolvedBandit(crewId, crew, state).filter(({ tier }) => Math.floor(tier / 3) === stage),
    ({ tier }) => [4, 3, 2][tier % 3]);
}

function roadStory(state, leg, crewId, grade, kit) {
  const met = state.roadTrip.banditsMet ?? [];
  const options = kit.data.roadBandits.fixed.filter(({ id }) => !state.resolvedBandits.includes(id) && !met.includes(id));
  const encounters = state.banditCrews[crewId]?.encounters ?? 0;
  const forced = options.find((story) => story.crew === crewId && story.forceAt && encounters + 1 >= story.forceAt);
  if (forced) return forced;
  const story = options.find(({ a, b, enemy, fee }) => roadKey(a, b) === leg.key &&
    (fee == null || Math.floor(kit.records.enemies[enemy].tier / 3) === grade));
  return story && draw(state) < story.chance ? story : null;
}

function stopForBandit(state, leg, crewId, kit) {
  const grade = apparentBanditGrade(state, kit);
  const fixed = roadStory(state, leg, crewId, grade, kit);
  const member = fixed ? null : pickBandit(state, grade, crewId, kit);
  if (!fixed && !member) return null;
  const pool = member && kit.data.roadBandits.pools.find(({ tier }) => tier === member.tier);
  const enemy = fixed?.enemy ?? pool.enemy;
  const stage = Math.floor(kit.records.enemies[enemy].tier / 3);
  const nonThreat = Boolean(fixed && fixed.fee != null && stage !== grade);
  const fee = fixed ? (nonThreat ? null : fixed.fee ?? null)
    : range({ roadSeed: memberLootSeed(state, { crew: crewId, member: member.key }) ^ 0x85a3ef1f }, pool.fee);
  const onStoryRoad = fixed && roadKey(fixed.a, fixed.b) === leg.key;
  const unexpected = stage < grade
    ? '他先打量你背光的一侧，伸手时并没看清护具的纹样。'
    : '路边的人本像是在等别的旅客。见你到了近处，他才挪身拦住。';
  const message = fixed
    ? (nonThreat ? fixed.nonThreatIntro : onStoryRoad ? fixed.intro : fixed.crewIntro ?? fixed.intro)
    : (stage === grade ? '他横着兵器挡住路，朝你的行囊抬了抬下巴。' : unexpected);
  state.roadBandit = { enemy, fixed: fixed?.id, crew: crewId, member: member?.key,
    fee, paid: 0, intro: message, nonThreat };
  (state.roadTrip.banditsMet ??= []).push(fixed?.id ?? `${crewId}/${member.key}`);
  crewRecord(state, crewId).encounters++;
  return { ...kit.say(state, message), roadInterrupted: true };
}

export function checkRoadBanditStep(state, leg, index, kit) {
  const profile = roadBanditRisk(state, leg, kit);
  if (profile?.chance > 0 && draw(state) < profile.chance * Math.min(1, leg.stepUnits ?? 1)) {
    const roster = recruitsByNow(state, profile.crew, kit);
    if (roster) state.banditCrews[profile.crew] = roster;
    const pause = stopForBandit(state, leg, profile.crew, kit);
    if (pause) return pause;
  }
  if (Object.keys(kit.groundAt(state)).length) {
    return { ...kit.say(state, '你认出路边这处石脚，地上还有些东西。'), roadInterrupted: true };
  }
  return null;
}

function demands(state, kit) {
  return Object.entries(state.inventory).flatMap(([id]) => {
    const item = kit.records.items[id];
    const count = kit.saleTerms(state, id).count;
    return item?.sell > 0 && count > 0 && !kit.isEvidence(item) && !item.keepOnFall && item.kind !== 'manual'
      ? [{ id, name: item.name, count, price: item.sell }] : [];
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
    .filter(([id, count]) => kit.saleTerms(state, id).count < count));
  return Object.keys(missing).length ? `手边还缺${kit.goodsText(missing)}。` : '';
}

export function roadBanditView(state, kit) {
  const bandit = state.roadBandit;
  if (!bandit || state.combat) return null;
  const story = storyOf(state, kit);
  const remaining = bandit.fee === null ? null : bandit.fee - bandit.paid;
  const offers = remaining === null ? [] : demands(state, kit);
  return { name: kit.records.enemies[bandit.enemy].name,
    intro: bandit.intro,
    fee: bandit.fee, remaining, coins: state.coins,
    offers: offers.map(({ count, price, ...goods }) => ({ ...goods, held: count, count: Math.min(count, Math.ceil(remaining / price)), price })),
    allValue: state.coins + offers.reduce((sum, { count, price }) => sum + count * price, 0),
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
  return { ...kit.say(state, `${message}${carried ? `得到${carried}。` : ''}${onGround ? `${onGround}留在脚边。` : ''}` +
    (newRoute ? `从${kit.records.regions[found.region].name}可以去「${found.name}」了。` : '')),
    roadInterrupted: true };
}

function payAndPass(state, story, message, kit) {
  const aftermath = story?.afterPay;
  return resolveBandit(state, story, aftermath, message + (aftermath?.outcome ?? ''), kit);
}

const roadActions = new Set(['banditFight', 'banditPlot', 'banditPass', 'banditPay', 'banditPayCoins', 'banditPayItem', 'banditSurrender']);

export function banditAction(state, action, { id, count = 1 }, kit) {
  if (!state.roadBandit || !roadActions.has(action)) return null;
  const bandit = state.roadBandit;
  const story = storyOf(state, kit);
  if (bandit.aftermath && action !== 'banditPlot') return kit.refuse('他还在等你答话。');
  if (action === 'banditPass') {
    if (!bandit.nonThreat) return kit.refuse('眼下他还挡在路上。');
    return resolveBandit(state, null, null, '他扶着车板退开一步，你沿路往前走。', kit);
  }
  if (action === 'banditFight') {
    if (bandit.nonThreat) return kit.refuse('他已经把兵器收起，让开了路。');
    kit.startCombat(state, bandit.enemy);
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
  const remaining = bandit.fee - bandit.paid;
  if (action === 'banditSurrender') {
    const offers = demands(state, kit);
    if (state.coins + offers.reduce((sum, item) => sum + item.count * item.price, 0) >= remaining) {
      return kit.refuse('手里的东西还凑得齐，挑几样给他就能过去。');
    }
    const paid = { ...Object.fromEntries(offers.map((item) => [item.id, item.count])) };
    for (const item of offers) kit.removeItem(state, item.id, item.count, false);
    const coins = state.coins;
    state.coins = 0;
    const contents = [coins && `${coins}枚灵钱`, kit.goodsText(paid)].filter(Boolean).join('、');
    return { ...payAndPass(state, story, contents
      ? `你交出${contents}。他掂了掂，侧过身让出路。`
      : '你把空钱袋翻给他看。他嘟囔了一声，转进草里。', kit), paidGoods: paid, paidCoins: coins };
  }
  if (action === 'banditPay' || action === 'banditPayCoins') {
    const coins = Math.min(state.coins, remaining);
    if (!coins || (action === 'banditPay' && coins < remaining)) return kit.refuse('手头的灵钱还不够。');
    state.coins -= coins;
    bandit.paid += coins;
    const message = `你递给他${coins}枚灵钱。`;
    return { ...(coins === remaining ? payAndPass(state, story, message + '他让开了路。', kit)
      : kit.say(state, message + `他还要${remaining - coins}枚。`)), paidCoins: coins };
  }
  const quote = demands(state, kit).find((item) => item.id === id);
  if (!quote || !Number.isSafeInteger(count) || count < 1 || count > Math.min(quote.count, Math.ceil(remaining / quote.price))) {
    return kit.refuse('挑一样他肯收的物件，再看看数量。');
  }
  kit.removeItem(state, id, count, false);
  const value = count * quote.price;
  bandit.paid += value;
  const message = `你交了${quote.name}×${count}，抵${value}枚灵钱。`;
  return { ...(value >= remaining ? payAndPass(state, story, message + '他让开了路。', kit)
    : kit.say(state, message + `他还要${remaining - value}枚。`)), paidGoods: { [id]: count } };
}

export function winRoadBandit(state, enemy, kit) {
  const bandit = state.roadBandit;
  const story = storyOf(state, kit);
  const pool = kit.data.roadBandits.pools.find(({ enemy: id }) => id === enemy.id);
  const lead = `你击退了${enemy.name}。`;
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
    const { delay } = recruitmentTerms(state, crew, kit);
    record.nextRecruitDay = state.day + delay;
  }
  const lootRoll = { roadSeed: memberLootSeed(state, bandit) };
  const rich = draw(lootRoll) < pool.richChance;
  const coins = range(lootRoll, rich ? pool.richCash : pool.cash);
  const candidate = draw(lootRoll) < (rich ? banditRules.richGearChance : banditRules.ordinaryGearChance)
    ? chooseWeighted(lootRoll, rich ? pool.richGear : pool.gear, ({ weight }) => weight) : null;
  const item = candidate && !kit.gearReserved(state, candidate.id) ? kit.records.gear[candidate.id] : null;
  const goods = item ? { [item.id]: 1 } : {};
  const wear = item ? { [item.id]: Math.ceil(item.durability * range(lootRoll, rich ? [65, 87] : [34, 65]) / 100) } : {};
  kit.leaveOnGround(state, goods, wear);
  state.coins += coins;
  const loot = kit.goodsText(goods);
  return { ...resolveBandit(state, null, null, lead + (coins ? `从他掉下的钱袋里捡到${coins}枚灵钱。` : '') +
    (loot ? `他把${loot}落在了脚边。` : coins ? '' : '他身上没落下什么。'), kit),
    roadCoins: coins, ...(loot ? { gathered: goods, gatheredRegion: state.region } : {}) };
}
