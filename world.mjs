const home = 'village';
const legacy = new Set(['village', 'marsh', 'ridge', 'ford', 'hidden', 'pine_ridge', 'kiln_valley', 'herb_basin', 'black_mine', 'snow_pass', 'sky_terrace']);
const crossings = [
  { a: 'ford', b: 'zhao_city', label: '外港水路', days: 5.5, item: 'ferry_manifest', quest: 'last_lantern', reason: '旧渡重新开船后可以走这条路。也可以拿货单搭商船。' },
  { a: 'zhao_pass', b: 'mingsha_city', label: '穿沙商路', days: 6.5, item: 'sand_writ', reason: '沙驿的守门人会查通行凭证。可以先去叠石驿关问问。' },
];
const arrayPlans = {
  wuliang: { coins: 96, need: { wood: 36, ore: 20, core: 18, black_iron: 8 } },
  zhaoyuan: { coins: 115, need: { wood: 32, ore: 28, core: 24, black_iron: 18 } },
  mingsha: { coins: 140, need: { wood: 28, ore: 32, core: 32, black_iron: 25 } },
};
export const transportRules = Object.freeze({ gatePrice: 2, gateDays: 0.125, arrayPrice: 4, arrayDays: 0.25, scrollDays: 0.125, arrayPlans, crossings });

export function initialWorld() {
  return { lastSettlement: home, gates: [], arrays: {}, shops: {}, recovery: {}, affiliation: null, memberships: {} };
}

const detail = (data, id) => data.regionDetails?.[id] ?? {};
const provinceOf = (data, id) => detail(data, id).province ?? 'wuliang';
const marked = (state, id) => state.discovered.includes(id);
const known = (state, id) => state.knownItems.includes(id);
const otherside = ({ a, b }, at) => a === at ? b : b === at ? a : null;

export function settlementOf(data, id) {
  const settlement = detail(data, id).settlement;
  if (!settlement && id !== home) return null;
  return { type: '村庄', ...settlement, inn: settlement?.inn !== false, home: id === home };
}

export function alwaysKnownRegion(id) {
  return id === home || id === 'marsh';
}

export function rescueSettlement(state, kit) {
  const last = state.world?.lastSettlement;
  return last && settlementOf(kit.data, last) ? last : home;
}

function crossRoute(from, to) {
  return crossings.find((edge) => otherside(edge, from) === to);
}

function crossBlocker(state, edge) {
  return edge && !known(state, edge.item) && !state.completedQuests.includes(edge.quest) ? edge.reason : '';
}

function signedRoad(data, from, to) {
  return detail(data, from).links?.includes(to) || detail(data, to).links?.includes(from);
}

function directRoad(from, to, kit) {
  const fromRegion = kit.records.regions[from];
  const toRegion = kit.records.regions[to];
  if (!fromRegion || !toRegion || from === to) return null;
  const cross = crossRoute(from, to);
  if (cross) return { days: cross.days, cross };
  if (legacy.has(from) && legacy.has(to)) return { days: (to === home ? fromRegion : toRegion).travel ?? 0 };
  if (provinceOf(kit.data, from) !== provinceOf(kit.data, to) || !signedRoad(kit.data, from, to)) return null;
  const days = Math.max(0.5, Math.round(((fromRegion.travel ?? 1) + (toRegion.travel ?? 1)) * 2) / 4);
  return { days };
}

export function learnAdjacentRegions(state, kit) {
  for (const region of kit.data.regions) {
    if (marked(state, region.id) || !directRoad(state.region, region.id, kit)) continue;
    const cross = crossRoute(state.region, region.id);
    if (cross ? crossBlocker(state, cross) : region.reveal || region.secret) continue;
    state.discovered.push(region.id);
  }
  // A permit describes both landing points. Merely seeing a locked crossing never reveals its destination.
  for (const edge of crossings) {
    if (crossBlocker(state, edge)) continue;
    for (const id of [edge.a, edge.b]) if (kit.records.regions[id] && !marked(state, id)) state.discovered.push(id);
  }
}

function safeRoad(state, target, kit) {
  if (!settlementOf(kit.data, target)?.inn || provinceOf(kit.data, target) !== provinceOf(kit.data, state.region)) return null;
  const cost = new Map([[state.region, 0]]);
  const unvisited = new Set(state.discovered);
  while (unvisited.size) {
    let nearest;
    let nearestCost = Infinity;
    for (const id of unvisited) {
      if ((cost.get(id) ?? Infinity) < nearestCost) { nearest = id; nearestCost = cost.get(id); }
    }
    if (!nearest) return null;
    if (nearest === target) return { days: nearestCost, rescue: true };
    unvisited.delete(nearest);
    for (const id of unvisited) {
      const road = directRoad(nearest, id, kit);
      if (!road || road.cross) continue;
      const nextCost = nearestCost + road.days;
      if (nextCost < (cost.get(id) ?? Infinity)) cost.set(id, nextCost);
    }
  }
  return null;
}

function quoteRoad(state, id, kit) {
  if (!kit.records.regions[id]) return { reason: '找不到这条路。' };
  if (!marked(state, id)) return { reason: '你还没有找到那条路。' };
  if (state.region === id) return { reason: '你已经在这里。' };
  const road = directRoad(state.region, id, kit) ?? (state.satiety === 0 ? safeRoad(state, id, kit) : null);
  if (!road) return { reason: '此处没有直达的路。' };
  const blockedCrossing = crossBlocker(state, road.cross);
  if (blockedCrossing) return { ...road, reason: blockedCrossing };
  if (state.satiety === 0) {
    if (road.cross) return { ...road, reason: '腹中空空，先回住处吃些东西，再走跨州路。' };
    if (!settlementOf(kit.data, id)?.inn) return { ...road, reason: '腹中空空，先吃些东西。' };
    return { ...road, days: road.days + kit.rules.emptyReturnDays, rescue: true, reason: '' };
  }
  return { ...road, reason: '' };
}

function arrive(state, id, days, kit, clearEvent = false) {
  kit.advance(state, days);
  state.region = id;
  state.world.arrived = true;
  if (clearEvent) state.event = null;
  if (settlementOf(kit.data, id)) {
    state.world.lastSettlement = id;
    state.expeditionLoot = {};
    state.pressure = 0;
  }
}

export function travelRoad(state, id, kit) {
  const road = quoteRoad(state, id, kit);
  if (road.reason) return kit.refuse(road.reason);
  arrive(state, id, road.days, kit);
  return kit.say(state, `抵达${kit.records.regions[id].name}。${road.rescue ? '腹中没了力气，沿路慢走了一程。' : ''}`);
}

function gateQuote(state, id, kit, scroll) {
  if (!detail(kit.data, id).portal || !state.world.gates.includes(id)) return '要先到那里点亮传送门。';
  if (id === state.region) return '你已经在这处门旁。';
  if (scroll) return kit.owns(state, 'gate_scroll') > 0 ? '' : '行囊里没有传送卷轴。';
  if (!detail(kit.data, state.region).portal || !state.world.gates.includes(state.region)) return '先站到一座已经点亮的传送门旁。';
  if (provinceOf(kit.data, id) !== provinceOf(kit.data, state.region)) return '普通传送门只能连到本州。';
  if (state.coins < transportRules.gatePrice) return `还差${transportRules.gatePrice - state.coins}枚灵钱。`;
  return '';
}

function attune(state, kit) {
  if (!detail(kit.data, state.region).portal) return kit.refuse('这里没有传送门。');
  if (state.world.gates.includes(state.region)) return kit.refuse('这座传送门已经点亮。');
  state.world.gates.push(state.region);
  return kit.say(state, `手碰到门上的石块，亮光沿门框绕了一圈。以后可以传到${kit.records.regions[state.region].name}了。`);
}

function jumpGate(state, id, kit, scroll) {
  const reason = gateQuote(state, id, kit, scroll);
  if (reason) return kit.refuse(reason);
  if (scroll) kit.removeItem(state, 'gate_scroll', 1);
  else state.coins -= transportRules.gatePrice;
  arrive(state, id, scroll ? transportRules.scrollDays : transportRules.gateDays, kit, true);
  return kit.say(state, scroll ? `卷轴化成灰。抬头已经到了${kit.records.regions[id].name}。` : `门框一亮，转眼已到${kit.records.regions[id].name}。`);
}

function arrayPlan(data, id) {
  const array = detail(data, id).array;
  return array && (array === true ? arrayPlans[provinceOf(data, id)] : array);
}

function arrayView(state, id, kit) {
  const plan = arrayPlan(kit.data, id);
  if (!plan) return null;
  const contribution = state.world.arrays[id];
  const coins = plan.coins ?? 0;
  const coinsPaid = contribution?.coins ?? 0;
  const paid = { ...contribution?.goods };
  const remaining = Object.fromEntries(Object.entries(plan.need).map(([item, total]) => [item, total - (paid[item] ?? 0)]));
  const limits = Object.fromEntries(Object.entries(remaining).map(([item, due]) => [item, Math.min(due, kit.homeSupplies(state, item))]));
  limits.coins = Math.min(coins - coinsPaid, state.coins);
  const active = Object.values(remaining).every((due) => due === 0) && coins === coinsPaid;
  return { need: plan.need, paid, remaining, coins, coinsPaid, limits, active, canFund: !active && Object.values(limits).some(Boolean),
    reason: active ? '' : '地上的石板裂了。把下面的材料凑齐，工匠就能修好传送阵。' };
}

function contributeArray(state, id, count, kit) {
  const local = arrayView(state, state.region, kit);
  if (!local) return kit.refuse('这里没有州阵。');
  if (local.active) return kit.refuse('这座州阵已经修好。');
  if (!Object.hasOwn(local.limits, id)) return kit.refuse('修这座传送阵用不上这件东西。');
  if (!Number.isSafeInteger(count) || count < 1 || count > local.limits[id]) return kit.refuse('这次能交的数量有限，请看修阵清单。');
  const contribution = (state.world.arrays[state.region] ??= { goods: {}, coins: 0 });
  if (id === 'coins') {
    state.coins -= count;
    contribution.coins += count;
  } else {
    kit.spendHome(state, 0, { [id]: count });
    contribution.goods[id] = (contribution.goods[id] ?? 0) + count;
  }
  const active = arrayView(state, state.region, kit).active;
  return kit.say(state, `交给工匠${id === 'coins' ? `${count}枚灵钱` : `${kit.nameOf(id)}×${count}`}。${active ? '光沿新铺的石板亮起来。传送阵修好了。' : '工匠收下这一批，划掉清单上相应的数。'}`);
}

function arrayQuote(state, id, kit) {
  if (id === state.region) return '你已经在这座州阵。';
  if (!arrayPlan(kit.data, id) || !marked(state, id)) return '还不知道那一州的传送阵在哪儿。';
  if (!arrayView(state, state.region, kit)?.active) return '这里的传送阵还没修好。';
  if (!arrayView(state, id, kit).active) return '对面的传送阵也要修好。';
  if (state.coins < transportRules.arrayPrice) return `还差${transportRules.arrayPrice - state.coins}枚灵钱。`;
  return '';
}

function jumpArray(state, id, kit) {
  const reason = arrayQuote(state, id, kit);
  if (reason) return kit.refuse(reason);
  state.coins -= transportRules.arrayPrice;
  arrive(state, id, transportRules.arrayDays, kit, true);
  return kit.say(state, `脚下的石板闪过一道光。你已经到了${kit.records.regions[id].name}。`);
}

function shopStock(state, id, offer) {
  const stored = state.world.shops[state.region]?.[id];
  const cap = offer.cap ?? offer.start ?? 1;
  const interval = offer.interval ?? 0;
  const initial = offer.start ?? cap;
  const count = stored?.count ?? initial;
  const nextAt = stored ? stored.nextAt : interval > 0 && initial < cap ? 1 + interval : null;
  if (nextAt === null || state.day < nextAt) return { count, nextAt };
  const periods = 1 + Math.floor((state.day - nextAt) / interval);
  const updated = Math.min(cap, count + periods * (offer.growth ?? 1));
  return { count: updated, nextAt: updated < cap ? nextAt + periods * interval : null };
}

export function localGoods(place) {
  if (place.home) return place.goods ?? {};
  return { ration: { price: 5, start: 6, cap: 8, interval: 2 }, ...place.goods };
}

const localPrice = (item, offer) => Math.max(item.sell ?? 0, offer.price);

function salePrice(place, item, kit) {
  if (!(item?.sell > 0) || kit.isEvidence(item)) return 0;
  const offered = [place.buys?.[item.id] ?? item.sell];
  if (item.price > 0 && kit.data.market?.stalls.some((stall) => stall.offers.some(({ id }) => id === item.id))) offered.push(item.price);
  for (const settlement of Object.values(kit.data.regionDetails ?? {}).map((region) => region.settlement).filter(Boolean)) {
    const supply = localGoods(settlement)[item.id];
    if (supply?.price > 0) offered.push(localPrice(item, supply));
  }
  return Math.min(...offered);
}

function localSaleTerms(state, id, kit, requested = 1) {
  const equipped = Object.values(state.equipment).includes(id);
  const count = equipped ? 0 : kit.homeBagAvailable(state, id);
  const reason = kit.owns(state, id) < requested ? '手头没有这么多货。' :
    equipped ? '先卸下这件装备。' : count < requested ? '救济的干粮只供自用。' : '';
  return { count, reason };
}

function localPurchaseBlocker(state, id, kit, count, inStock, price) {
  if (count > inStock) return inStock ? '摊上没有这么多货。' : '这批货已经卖完。';
  if (state.coins < price * count) return '手头的灵钱不够。';
  if (kit.records.gear[id] && (count !== 1 || kit.gearReserved(state, id))) return '同名装备只能留一件。';
  if (!kit.hasRoom(state, { [id]: count })) return '行囊装不下这笔货。';
  return '';
}

function localMarket(state, kit) {
  const place = settlementOf(kit.data, state.region);
  if (!place) return null;
  const offers = Object.entries(localGoods(place)).filter(([id]) => kit.records.items[id] && !kit.isEvidence(kit.records.items[id])).map(([id, offer]) => {
    const { count } = shopStock(state, id, offer);
    const price = localPrice(kit.records.items[id], offer);
    const reason = localPurchaseBlocker(state, id, kit, 1, count, price);
    let maximum = reason ? 0 : Math.min(kit.rules.maxTradeCount, count, price > 0 ? Math.floor(state.coins / price) : count);
    if (kit.records.gear[id]) maximum = Math.min(maximum, 1);
    while (maximum > 1 && !kit.hasRoom(state, { [id]: maximum })) maximum--;
    return { id, count, price, maximum, reason };
  });
  const buys = kit.data.items.filter((item) => kit.owns(state, item.id) > 0).map((item) => ({ id: item.id,
    price: salePrice(place, item, kit), ...localSaleTerms(state, item.id, kit) })).filter(({ price }) => price > 0);
  return { offers, buys, talk: place.talk ? { label: place.talk.label, heard: known(state, place.talk.lead) } : null };
}

function localAsk(state, kit) {
  const talk = settlementOf(kit.data, state.region)?.talk;
  if (!talk) return kit.refuse('这里的摊上没有这件事可问。');
  if (!known(state, talk.lead)) {
    kit.advance(state, 0.125);
    kit.addItems(state, { [talk.lead]: 1 });
  }
  return kit.say(state, talk.outcome);
}

function localTrade(state, id, count, kit, buying) {
  const place = settlementOf(kit.data, state.region);
  const record = kit.records.items[id];
  if (!place || !record || !Number.isSafeInteger(count) || count < 1 || count > kit.rules.maxTradeCount) return kit.refuse('这桩买卖办不成。');
  if (!buying) {
    const price = salePrice(place, record, kit);
    if (!price) return kit.refuse('这件东西不能卖。');
    const sale = localSaleTerms(state, id, kit, count);
    if (sale.reason) return kit.refuse(sale.reason);
    kit.removeItem(state, id, count);
    state.coins += price * count;
    return kit.say(state, `卖出${record.name}×${count}，收了${price * count}枚灵钱。`);
  }
  const offer = localGoods(place)[id];
  if (!offer || kit.isEvidence(record)) return kit.refuse('这个摊位没卖那件东西。');
  const stock = shopStock(state, id, offer);
  const price = localPrice(record, offer);
  const reason = localPurchaseBlocker(state, id, kit, count, stock.count, price);
  if (reason) return kit.refuse(reason);
  const cost = price * count;
  const remaining = stock.count - count;
  const nextAt = offer.interval > 0 ? stock.nextAt ?? state.day + offer.interval : null;
  (state.world.shops[state.region] ??= {})[id] = { count: remaining, nextAt };
  state.coins -= cost;
  kit.addItems(state, { [id]: count });
  return kit.say(state, `买到${record.name}×${count}，付了${cost}枚灵钱。`);
}

const localSect = (state, kit) => kit.data.sects?.find(({ region }) => region === state.region);
const pledge = (state, sect) => state.world.memberships[sect.id];

function sectView(state, kit) {
  const sect = localSect(state, kit);
  if (!sect) return null;
  const membership = pledge(state, sect);
  const joined = state.world.affiliation === sect.id;
  const joinReason = joined ? '' : state.world.affiliation ? '先回原来的师门辞行，再来拜师。' :
    membership ? '' : kit.homeRequirements(state, sect.join?.coins ?? 0, sect.join?.need) || '';
  const credit = membership?.credit ?? 0;
  const jobs = sect.jobs.map((job) => {
    const nextAt = membership?.jobs[job.id] ?? 0;
    const reason = !joined ? '这桩活只交给本门弟子。' : nextAt > state.day ? `管事还在忙上次的活，第${Math.ceil(nextAt)}日再来。` :
      kit.homeRequirements(state, 0, job.need) || (!kit.hasRoom(state, job.reward ?? {}, kit.homeBagSpend(state, job.need)) ? '行囊腾出些地方，就能带走回礼。' : '');
    return { ...job, nextAt, available: !reason && !state.event && !state.combat, reason };
  });
  const ranks = sect.ranks.map((rank, index) => ({ ...rank, id: String(index), claimed: membership?.ranks.includes(index) ?? false,
    available: joined && credit >= rank.credit && !membership?.ranks.includes(index), reason: credit < rank.credit ? `尚需${rank.credit - credit}份门中功劳。` : '' }));
  return { ...sect, join: { ...sect.join, available: !joined && !joinReason, reason: joinReason }, joined, credit, jobs, ranks };
}

function actSect(state, action, id, kit) {
  const local = localSect(state, kit);
  if (!local) return kit.refuse('这里没有师门管事。');
  const view = sectView(state, kit);
  if (action === 'sectJoin') {
    if (!view.join.available) return kit.refuse(view.join.reason || '你已经是这门的人。');
    if (!pledge(state, local)) {
      kit.spendHome(state, local.join?.coins ?? 0, local.join?.need);
      state.world.memberships[local.id] = { credit: 0, jobs: {}, ranks: [] };
    }
    state.world.affiliation = local.id;
    return kit.say(state, local.join?.text ?? `${local.name}的管事翻开册子，写下你的名字。`);
  }
  if (!view.joined) return kit.refuse('你还没加入这个师门。');
  if (action === 'sectLeave') {
    state.world.affiliation = null;
    return kit.say(state, `你向${local.name}辞行。管事合上册子，说哪天你再回来，从前的功劳还算数。`);
  }
  const member = pledge(state, local);
  if (action === 'sectWork') {
    const job = view.jobs.find((entry) => entry.id === id);
    if (!job?.available) return kit.refuse(job?.reason || '眼下办不了这桩差事。');
    kit.spendHome(state, 0, job.need);
    kit.addItems(state, job.reward ?? {});
    state.coins += job.coins ?? 0;
    member.credit += job.credit;
    member.jobs[id] = state.day + job.cooldown;
    return kit.say(state, `${job.text ?? ''}办完「${job.name}」，得${job.credit}份功劳${job.coins ? `和${job.coins}枚灵钱` : ''}。`);
  }
  const rank = view.ranks.find((entry) => entry.id === String(id));
  if (!rank?.available) return kit.refuse(rank?.reason || '这笔门中回礼现在领不了。');
  if (!kit.hasRoom(state, rank.reward ?? {})) return kit.refuse('行囊装不下这笔回礼。');
  member.ranks.push(Number(rank.id));
  kit.addItems(state, rank.reward ?? {});
  if (rank.art && !state.knownArts.includes(rank.art)) state.knownArts.push(rank.art);
  const gifts = kit.goodsText(rank.reward);
  const art = rank.art ? kit.records.arts[rank.art]?.name : '';
  return kit.say(state, `${rank.text ?? ''}管事在名册上给你写了「${rank.name}」。${gifts ? `领到${gifts}。` : ''}${art ? `学会「${art}」。` : ''}`);
}

function targetSummary(region, data, reason, extra = {}) {
  return { id: region.id, name: region.name, province: provinceOf(data, region.id), ...extra, reason, available: !reason };
}

export function worldView(state, kit) {
  const actual = kit.records.regions[state.region];
  const here = detail(kit.data, state.region);
  const discovered = kit.data.regions.filter((region) => marked(state, region.id));
  const roads = discovered.flatMap((region) => {
    if (region.id === state.region) return [];
    const quote = quoteRoad(state, region.id, kit);
    const ordinary = directRoad(state.region, region.id, kit);
    return quote.days === undefined || (!ordinary && !quote.rescue) ? [] :
      [targetSummary(region, kit.data, quote.reason, { days: quote.days, rescue: Boolean(quote.rescue) })];
  });
  const roadsById = Object.fromEntries(roads.map((road) => [road.id, road]));
  const closedSidePaths = crossings.filter((edge) => {
    const other = otherside(edge, state.region);
    return other && kit.records.regions[other] && !marked(state, other) && crossBlocker(state, edge);
  }).map(({ label, days, reason }) => ({ label, days, reason, available: false }));
  const gates = discovered.filter(({ id }) => state.world.gates.includes(id)).map((region) => {
    const scrollReason = gateQuote(state, region.id, kit, true);
    return targetSummary(region, kit.data, gateQuote(state, region.id, kit, false),
      { days: transportRules.gateDays, price: transportRules.gatePrice, scrollDays: transportRules.scrollDays, byScroll: !scrollReason, scrollReason });
  });
  const arrays = discovered.filter(({ id }) => Boolean(arrayPlan(kit.data, id))).map((region) => targetSummary(region, kit.data, arrayQuote(state, region.id, kit),
    { days: transportRules.arrayDays, price: transportRules.arrayPrice, active: arrayView(state, region.id, kit).active }));
  const points = discovered.map((region) => {
    const { x, y, portal, array, description } = detail(kit.data, region.id);
    return { id: region.id, name: region.name, province: provinceOf(kit.data, region.id), x, y, description: description ?? region.desc,
      settlement: Boolean(settlementOf(kit.data, region.id)), portal: Boolean(portal), array: Boolean(array), attuned: state.world.gates.includes(region.id),
      current: region.id === state.region, travelable: Boolean(roadsById[region.id]?.available) };
  });
  const affiliation = kit.data.sects?.find(({ id }) => state.world.affiliation === id);
  return { settlement: settlementOf(kit.data, state.region), localMarket: localMarket(state, kit), sect: sectView(state, kit),
    affiliation: affiliation ? { id: affiliation.id, name: affiliation.name, credit: pledge(state, affiliation).credit } : null,
    world: { province: provinceOf(kit.data, state.region), provinces: kit.data.provinces ?? [], points, roads, crossings: closedSidePaths,
      here: { id: actual.id, name: actual.name, province: provinceOf(kit.data, state.region), x: here.x, y: here.y, description: here.description ?? actual.desc },
      scrollCount: kit.owns(state, 'gate_scroll'), gates, localGate: here.portal ? { attuned: state.world.gates.includes(state.region) } : null,
      localArray: arrayView(state, state.region, kit), arrays } };
}

export function worldAction(state, action, payload, kit) {
  const { id, count = 1 } = payload;
  if (action === 'attuneGate') return attune(state, kit);
  if (action === 'gateJump') return jumpGate(state, id, kit, false);
  if (action === 'gateScroll') return jumpGate(state, id, kit, true);
  if (action === 'arrayContribute') return contributeArray(state, id, count, kit);
  if (action === 'arrayJump') return jumpArray(state, id, kit);
  if (action === 'localBuy') return localTrade(state, id, count, kit, true);
  if (action === 'localSell') return localTrade(state, id, count, kit, false);
  if (action === 'localAsk') return localAsk(state, kit);
  if (['sectJoin', 'sectLeave', 'sectWork', 'sectClaim'].includes(action)) return actSect(state, action, id, kit);
  return null;
}
