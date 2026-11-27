import { saleQuote, saleTotal, recordSale, tradeCapacityReason, tradeQuantityOptions } from './economy.mjs';
import { atlasBorderRoad, atlasGeography, atlasLocation, atlasRoadDistance, atlasRoadPath } from './atlas-geography.mjs';
import { measuringSectAction, measuringSectView, measuringAffiliation } from './measuring-sect.mjs';

const home = 'village';
const roadUnitDays = 0.25;
const withMileage = (link) => ({ ...link, days: atlasRoadDistance(atlasRoadPath(link.a, link.b), Boolean(link.openedBy)) * roadUnitDays });
const ferryPass = { ferry: true, item: 'ferry_manifest', quest: 'last_lantern',
  reason: '旧渡重新开船后可以走这条路。也可以拿货单搭商船。' };
const sandPass = { item: 'sand_writ', reason: '沙驿的守门人会查通行凭证。可以先去叠石驿关问问。' };
const crossings = [
  { a: 'ford', b: 'zhao_city', label: '外港水路', ...ferryPass, onPermit: true, guarded: true },
  { a: 'zhao_pass', b: 'mingsha_city', label: '穿沙商路', ...sandPass, onPermit: true, guarded: true },
  { a: 'willow_post', b: 'flood_market', label: '折水驿的货船线', ...ferryPass },
  { a: 'rope_sands', b: 'cinder_inn', label: '沿沙坡的驿路', ...sandPass },
].map(withMileage);
const regionalRoads = [
  ['kiln_valley', 'snow_pass', '窑谷上雪关的石阶'],
  ['ridge', 'kiln_valley', '窑车旧路'],
  ['fish_ladder', 'willow_post', '沿旧渠的纤道'],
  ['green_dyke', 'measuring_hall', '守尺观外的堤路'],
  ['frog_pond', 'ring_isles', '浅塘东岸路'],
  ['old_marker', 'scale_bog', '石碑后的小堤'],
  ['zhao_hermit', 'charcoal_ridge', '水驿南面的山道'],
  ['zhao_hermit', 'burnt_weir', '内堰西路'],
  ['flood_market', 'measuring_hall', '运尺的河堤路'],
  ['cinder_inn', 'silk_tent_road', '炭篷驿外的帐道'],
  ['silk_tent_road', 'sand_bell_cloister', '背向风口的挑担路'],
  ['chalk_hoof_trail', 'sand_bell_cloister', '白蹄道的南坡'],
  ['stillwell_mouth', 'wind_slate', '井口南边的背风路'],
  ['wind_slate', 'hanging_vein', '矿梁下的碎石路'],
  ['guest_mill', 'camel_grass_dunes', '磨坊南边的沙坡路'],
  ['hollow_silo', 'glass_hail_sink', '空仓外的石坡'],
];
const shortcuts = [
  { a: 'village', b: 'ford', label: '旧灯渠', openedBy: 'ford_lamp_channel:0' },
  { a: 'hanging_vein', b: 'cold_kiln', label: '石场旧车道', openedBy: 'sand_hunt_colony:4' },
].map(withMileage);
const arrayPlans = {
  wuliang: { coins: 96, need: { wood: 36, ore: 20, core: 18, black_iron: 8 } },
  zhaoyuan: { coins: 115, need: { wood: 32, ore: 28, core: 24, black_iron: 18 } },
  mingsha: { coins: 140, need: { wood: 28, ore: 32, core: 32, black_iron: 25 } },
};
export const transportRules = Object.freeze({ gatePrice: 2, gateDays: 0.125, arrayPrice: 4, arrayDays: 0.25, scrollPrice: 2, scrollDays: 0.125,
  roadUnitDays, arrayPlans, crossings, shortcuts });

export function initialWorld() {
  return { lastSettlement: home, gates: [], arrays: {}, avoidedRoads: [], shops: {}, recovery: {}, affiliation: null, memberships: {} };
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
  const { data } = kit;
  const province = provinceOf(data, state.region);
  const localRoads = roadGraph(data, { state }).filter((edge) =>
    provinceOf(data, edge.from) === province && provinceOf(data, edge.to) === province);
  const destinations = [...knownRoutes(state, localRoads)].filter(([id]) => settlementOf(data, id));
  destinations.sort(([, left], [, right]) => left.units - right.units);
  if (destinations.length) return destinations[0][0];
  const last = state.world?.lastSettlement;
  return last && settlementOf(data, last) ? last : home;
}

function crossBlocker(state, edge) {
  return edge && !known(state, edge.item) && !state.completedQuests.includes(edge.quest) ? edge.reason : '';
}

const roadKey = (from, to) => [from, to].sort().join('|');

export function roadGraph(data, { state } = {}) {
  const regions = new Map(data.regions.map((region) => [region.id, region]));
  const roads = new Map();
  const add = (a, b, extra = {}) => {
    if (!regions.has(a) || !regions.has(b) || a === b) return;
    const key = roadKey(a, b);
    const [from, to] = key.split('|');
    const path = atlasRoadPath(from, to);
    if (!path) return;
    const units = atlasRoadDistance(path, Boolean(extra.openedBy));
    roads.set(key, { from, to, key, days: units * roadUnitDays, units, survey: path, ...extra });
  };
  for (const a of regions.keys()) {
    for (const b of detail(data, a).links ?? []) {
      if (regions.has(b) && provinceOf(data, a) === provinceOf(data, b)) add(a, b);
    }
  }
  for (const [a, b, label] of regionalRoads) {
    add(a, b, { label });
  }
  for (const cross of crossings) add(cross.a, cross.b, { cross, label: cross.label, water: Boolean(cross.ferry) });
  for (const shortcut of shortcuts) {
    if (!state || state.seenChoices.includes(shortcut.openedBy)) {
      add(shortcut.a, shortcut.b, { label: shortcut.label, openedBy: shortcut.openedBy });
    }
  }
  return [...roads.values()];
}

function directRoad(from, to, edges) {
  return edges.find((edge) => edge.key === roadKey(from, to));
}

export function learnAdjacentRegions(state, kit) {
  const edges = roadGraph(kit.data, { state });
  for (const region of kit.data.regions) {
    const edge = directRoad(state.region, region.id, edges);
    if (marked(state, region.id) || !edge || crossBlocker(state, edge.cross) || region.reveal || region.secret) continue;
    state.discovered.push(region.id);
    if (edge.cross && !edge.cross.onPermit) {
      kit.say(state, `路牌写着「${edge.label}」，顺着走可以到${region.name}。`);
    }
  }
  // The permits name the main crossings. Secondary crossings are learned at their entrances.
  for (const edge of crossings) {
    if (!edge.onPermit || crossBlocker(state, edge)) continue;
    for (const id of [edge.a, edge.b]) if (kit.records.regions[id] && !marked(state, id)) state.discovered.push(id);
  }
}

function openKnownRoads(state, edges) {
  const known = new Set([state.region, ...state.discovered]);
  const avoided = new Set(state.world.avoidedRoads);
  return edges.filter((edge) => known.has(edge.from) && known.has(edge.to) && !isAvoidedRoad(edge, avoided) && !crossBlocker(state, edge.cross));
}

function isAvoidedRoad(edge, avoided) {
  return !edge.cross?.guarded && avoided.has(edge.key);
}

function roadNeighbors(edges) {
  const neighbors = new Map();
  for (const edge of edges) {
    for (const point of [edge.from, edge.to]) {
      if (!neighbors.has(point)) neighbors.set(point, []);
      neighbors.get(point).push(edge);
    }
  }
  return neighbors;
}

function hasDetour(edge, neighbors) {
  const reached = new Set([edge.from]);
  for (const point of reached) {
    for (const leg of neighbors.get(point) ?? []) {
      if (leg.key === edge.key) continue;
      const next = leg.from === point ? leg.to : leg.from;
      if (next === edge.to) return true;
      reached.add(next);
    }
  }
  return false;
}

function roadAvoidance(state, edge, neighbors) {
  if (!marked(state, edge.from) || !marked(state, edge.to)) return '认清这条路的两头后，才能选择绕行。';
  if (edge.cross?.guarded) return '这条跨州通路有人巡守，不能标红。';
  if (state.roadTrip || state.event || state.combat || state.gathering) return '停在地图地点时才能改走法。';
  if (state.world.avoidedRoads?.includes(edge.key)) return '';
  const closed = crossBlocker(state, edge.cross);
  if (closed) return closed;
  return hasDetour(edge, neighbors) ? '' : '绕开这条路会让已知去路断开。';
}

function toggleRoadAvoidance(state, id, kit) {
  const edges = roadGraph(kit.data, { state });
  const edge = edges.find(({ key }) => key === id);
  if (!edge || !marked(state, edge.from) || !marked(state, edge.to)) return kit.refuse('图上还没有这条路。');
  const reason = roadAvoidance(state, edge, roadNeighbors(openKnownRoads(state, edges)));
  if (reason) return kit.refuse(reason);
  const avoided = state.world.avoidedRoads ??= [];
  const index = avoided.indexOf(edge.key);
  const ends = [edge.from, edge.to].map((point) => kit.records.regions[point].name).join('到');
  if (index >= 0) {
    avoided.splice(index, 1);
    return kit.say(state, `已恢复${ends}这条路。`);
  }
  avoided.push(edge.key);
  return kit.say(state, `将绕过${ends}这条路。`);
}

function knownRoutes(state, edges) {
  const routes = new Map([[state.region, { units: 0, legs: [] }]]);
  const unvisited = new Set([state.region, ...state.discovered]);
  const neighbors = roadNeighbors(openKnownRoads(state, edges));
  while (unvisited.size) {
    let nearest;
    let nearestCost = Infinity;
    for (const id of unvisited) {
      if ((routes.get(id)?.units ?? Infinity) < nearestCost) { nearest = id; nearestCost = routes.get(id).units; }
    }
    if (!nearest) break;
    unvisited.delete(nearest);
    for (const edge of neighbors.get(nearest) ?? []) {
      const id = edge.from === nearest ? edge.to : edge.from;
      if (!unvisited.has(id)) continue;
      const units = nearestCost + edge.units;
      if (units < (routes.get(id)?.units ?? Infinity)) {
        routes.set(id, { units, legs: [...routes.get(nearest).legs, { ...edge, from: nearest, to: id }] });
      }
    }
  }
  return routes;
}

function roadFood(state, required, kit) {
  let deficit = Math.max(0, required - state.satiety);
  const meals = {};
  let satiety = 0;
  const foods = [...kit.data.foods].sort((a, b) => a.satiety - b.satiety);
  for (const food of foods) {
    const count = Math.min(kit.owns(state, food.id), Math.ceil(deficit / food.satiety));
    if (!count) continue;
    meals[food.id] = count;
    const foodSatiety = count * food.satiety;
    satiety += foodSatiety;
    deficit = Math.max(0, deficit - foodSatiety);
  }
  return { meals, deficit, satiety };
}

function legDiet(state, leg, kit) {
  const protection = leg.cross ? null : kit.roadProtection(state, provinceOf(kit.data, leg.to));
  const rate = kit.rules.satietyDrainPerDay * (1 - (protection?.field.roadSatiety.fraction ?? 0));
  return { rate, protection };
}

function quoteRoad(state, id, kit, edges, routes) {
  if (!kit.records.regions[id]) return { reason: '找不到这条路。' };
  if (!marked(state, id)) return { reason: '你还没有找到那条路。' };
  if (state.region === id) return { reason: '你已经在这里。' };
  const route = routes.get(id);
  if (!route) {
    const blocked = directRoad(state.region, id, edges);
    const reason = crossBlocker(state, blocked?.cross);
    return reason ? { ...blocked, legs: [{ ...blocked, from: state.region, to: id }], reason }
      : { reason: '没找到能从这里接上的路。' };
  }
  const legs = route.legs.map((leg) => ({ ...leg, ...legDiet(state, leg, kit) }));
  const road = { ...route, legs, days: route.units * transportRules.roadUnitDays, cross: legs.some((leg) => leg.cross) };
  if (state.satiety === 0) {
    if (road.cross) return { ...road, reason: '腹中空空，先回住处吃些东西，再走跨州路。' };
    return { ...road, days: road.days + kit.rules.emptyReturnDays, rescue: true, reason: '' };
  }
  const provisions = legs.reduce((sum, leg) => sum + leg.days * leg.rate, 0);
  const remaining = state.satiety - provisions;
  const longWalk = legs.length > 1 && road.days >= 2.5;
  const reserve = longWalk ? 20 : 0;
  const autoMeals = road.cross || longWalk;
  const food = autoMeals ? roadFood(state, provisions + reserve, kit) : null;
  const foodShort = road.cross && food.deficit > reserve;
  let restock;
  if (foodShort) {
    const availableFood = state.satiety + food.satiety;
    let traveledCost = 0;
    for (const leg of legs.slice(0, -1)) {
      traveledCost += leg.days * leg.rate;
      if (traveledCost > availableFood) break;
      if (!settlementOf(kit.data, leg.to)?.inn) continue;
      restock = { id: leg.to, name: kit.records.regions[leg.to].name };
      break;
    }
  }
  return { ...road, autoMeals, reserve, meals: food?.meals, emptyOnArrival: remaining + (food?.satiety ?? 0) <= 0,
    restock, reason: foodShort ? `带的口粮还不够走完全程。还缺能补 ${Math.ceil(food.deficit - reserve)} 点饱腹的口粮。` : '' };
}

function arrive(state, id, days, kit, { clearEvent = false, satietyRate } = {}) {
  kit.advance(state, days, satietyRate, true);
  state.region = id;
  state.world.arrived = true;
  if (clearEvent) state.event = null;
  if (settlementOf(kit.data, id)) {
    state.world.lastSettlement = id;
    state.expeditionLoot = {};
    state.pressure = 0;
    state.fogExposure = 0;
  }
}

function eatTripMeal(state, trip, kit) {
  const food = kit.data.foods.filter((item) => item.satiety > 0 && kit.owns(state, item.id))
    .reduce((smallest, item) => !smallest || item.satiety < smallest.satiety ? item : smallest, null);
  if (!food || !kit.eatOnRoad(state, food.id).ok) return false;
  trip.meals[food.id] = (trip.meals[food.id] ?? 0) + 1;
  return true;
}

function advanceRoad(state, trip, days, rate, kit) {
  const end = Math.round((state.day + days) * 1000) / 1000;
  let remaining = days;
  while (trip.autoMeals && state.satiety < remaining * rate) {
    const untilHungry = state.satiety / rate;
    if (untilHungry > 0) kit.advance(state, untilHungry, rate);
    remaining = Math.max(0, end - state.day);
    if (!eatTripMeal(state, trip, kit)) break;
  }
  kit.advance(state, Math.max(0, end - state.day), rate);
}

function nextRoadStep(leg, progress) {
  if (leg.from < leg.to) {
    const index = Math.floor(progress) + 1;
    return { index, units: Math.min(index, leg.units) - progress };
  }
  const position = leg.units - progress;
  const index = Math.ceil(position);
  return { index, units: position - index + 1 };
}

function finishRoad(state, trip, kit) {
  if (state.satiety < trip.reserve) eatTripMeal(state, trip, kit);
  arrive(state, trip.destination, trip.extraDays, kit);
  state.roadTrip = null;
  const labels = trip.legs.filter(({ label }) => label).map(({ label }) => label);
  const used = kit.goodsText(trip.meals);
  const travelText = trip.extraDays ? '腹中没了力气，沿路慢走了一程。'
    : trip.protection && state.satiety > 0 ? `裹紧${kit.nameOf(trip.protection)}的衣襟挡住风沙，这一程没那么耗力。` : '';
  const destination = kit.records.regions[trip.destination].name;
  const arrival = trip.backtrack ? `你沿着刚走过的路折回${destination}。` : `抵达${destination}。`;
  return { ...kit.say(state, `${arrival}${labels.length && !trip.backtrack ? `这次走的是${labels.join('、')}。` : ''}${used ? `途中吃了${used}。` : ''}${travelText}`),
    ...(used ? { travelMeals: trip.meals } : {}) };
}

function walkRoad(state, kit) {
  const trip = state.roadTrip;
  trip.stop = null;
  delete trip.afterBattle;
  delete trip.storyAftermath;
  while (trip.legIndex < trip.legs.length) {
    const leg = trip.legs[trip.legIndex];
    const { rate, protection } = legDiet(state, leg, kit);
    if (protection) trip.protection = protection.id;
    while (trip.progress < leg.units) {
      const { index, units } = nextRoadStep(leg, trip.progress);
      advanceRoad(state, trip, units * transportRules.roadUnitDays, rate, kit);
      trip.progress += units;
      trip.unitsWalked += units;
      if (leg.water || !kit.checkRoadStep) continue;
      trip.stop = `road:${leg.key}:${index}`;
      const pause = kit.checkRoadStep(state, { ...leg, stepUnits: units }, index);
      if (pause) return { ok: true, roadInterrupted: true, ...(typeof pause === 'object' ? pause : kit.say(state, '你停在路上。')) };
      trip.stop = null;
    }
    state.region = leg.to;
    trip.legIndex += 1;
    trip.progress = 0;
  }
  return finishRoad(state, trip, kit);
}

export function travelRoad(state, id, kit) {
  if (state.roadTrip) return kit.refuse('先走完或折回现在走的这段路。');
  const edges = roadGraph(kit.data, { state });
  const road = quoteRoad(state, id, kit, edges, knownRoutes(state, edges));
  if (road.reason) return kit.refuse(road.reason);
  state.event = null;
  state.huntEdge = null;
  state.roadTrip = { destination: id, legs: road.legs, legIndex: 0, progress: 0, unitsWalked: 0, totalUnits: road.units,
    stop: null, autoMeals: Boolean(road.autoMeals), reserve: road.reserve ?? 0,
    extraDays: road.rescue ? kit.rules.emptyReturnDays : 0, meals: {} };
  return walkRoad(state, kit);
}

export function continueRoad(state, kit) {
  const trip = state.roadTrip;
  if (!trip) return kit.refuse('你当前没有在路上。');
  if (state.combat) return kit.refuse('先处理眼前的对手。');
  const remaining = trip.legs.slice(trip.legIndex);
  if (!trip.backtrack && remaining.some(({ cross }) => cross)) {
    const provisions = remaining.reduce((cost, leg, i) => cost + (leg.units - (i === 0 ? trip.progress : 0))
      * transportRules.roadUnitDays * legDiet(state, leg, kit).rate, 0);
    const shortfall = roadFood(state, provisions, kit).deficit;
    if (shortfall > 0) return kit.refuse(`带的口粮还不够走完这段路。还缺能补 ${Math.ceil(shortfall)} 点饱腹的口粮。`);
  }
  return walkRoad(state, kit);
}

export function backFromRoad(state, kit) {
  const trip = state.roadTrip;
  if (!trip) return kit.refuse('你当前没有在路上。');
  if (state.combat) return kit.refuse('先处理眼前的对手。');
  const leg = trip.legs[trip.legIndex];
  const returnLeg = { ...leg, from: leg.to, to: leg.from };
  state.roadTrip = { ...trip, destination: returnLeg.to, legs: [returnLeg], legIndex: 0,
    progress: leg.units - trip.progress, unitsWalked: 0, totalUnits: trip.progress,
    reserve: 0, extraDays: 0, meals: {}, backtrack: true };
  return walkRoad(state, kit);
}

export function roadTripView(state, kit) {
  const trip = state.roadTrip;
  if (!trip) return null;
  const leg = trip.legs[trip.legIndex];
  return { destination: trip.destination, destinationName: kit.records.regions[trip.destination].name,
    from: leg.from, fromName: kit.records.regions[leg.from].name, to: leg.to, toName: kit.records.regions[leg.to].name,
    key: leg.key, progress: trip.progress, legUnits: leg.units, unitsWalked: trip.unitsWalked, totalUnits: trip.totalUnits,
    remainingUnits: trip.totalUnits - trip.unitsWalked,
    stop: trip.stop, afterBattle: Boolean(trip.afterBattle), storyAftermath: trip.storyAftermath,
    backDays: trip.progress * transportRules.roadUnitDays };
}

function gateQuote(state, id, kit, scroll) {
  if (!marked(state, id) || !detail(kit.data, id).portal || !state.world.gates.includes(id)) return '要先到那里点亮传送门。';
  if (id === state.region) return '你已经在这处门旁。';
  if (scroll) {
    if (!kit.owns(state, 'gate_scroll')) return '行囊里没有传送卷轴。';
  } else {
    if (!detail(kit.data, state.region).portal || !state.world.gates.includes(state.region)) return '先站到一座已经点亮的传送门旁。';
    if (provinceOf(kit.data, id) !== provinceOf(kit.data, state.region)) return '普通传送门只能连到本州。';
  }
  const price = scroll ? transportRules.scrollPrice : transportRules.gatePrice;
  if (state.coins < price) return `还差${price - state.coins}枚灵钱。`;
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
  state.coins -= scroll ? transportRules.scrollPrice : transportRules.gatePrice;
  arrive(state, id, scroll ? transportRules.scrollDays : transportRules.gateDays, kit, { clearEvent: true });
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
  arrive(state, id, transportRules.arrayDays, kit, { clearEvent: true });
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
  if (!item || kit.isEvidence(item)) return 0;
  const localOffer = place.buys?.[item.id] ?? item.sell;
  if (!(localOffer > 0)) return 0;
  const offered = [localOffer];
  if (item.price > 0 && kit.data.market?.stalls.some((stall) => stall.offers.some(({ id }) => id === item.id))) offered.push(item.price);
  for (const settlement of Object.values(kit.data.regionDetails ?? {}).map((region) => region.settlement).filter(Boolean)) {
    const supply = localGoods(settlement)[item.id];
    if (supply?.price > 0) offered.push(localPrice(item, supply));
  }
  const sectPrice = kit.data.measuringSect?.store.find(offer => offer.id === item.id)?.price;
  if (sectPrice > 0) offered.push(Math.max(0, sectPrice - 1));
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
  return tradeCapacityReason(state, { id, count, total: price * count, buying: true }, kit);
}

function localMarket(state, kit) {
  const place = settlementOf(kit.data, state.region);
  if (!place) return null;
  const offers = Object.entries(localGoods(place)).filter(([id]) => kit.records.items[id] && !kit.isEvidence(kit.records.items[id])).map(([id, offer]) => {
    const { count } = shopStock(state, id, offer);
    const price = localPrice(kit.records.items[id], offer);
    const limit = Math.min(kit.records.gear[id] ? 1 : kit.rules.maxTradeCount, count, price > 0 ? Math.floor(state.coins / price) : count);
    const quantities = tradeQuantityOptions(limit, (quantity) => localPurchaseBlocker(state, id, kit, quantity, count, price));
    const maximum = quantities.at(-1) ?? 0;
    const reason = maximum ? '' : localPurchaseBlocker(state, id, kit, 1, count, price);
    return { id, count, price, quantities, maximum, reason, source: offer.source, department: offer.department,
      merchant: offer.merchant, imported: offer.imported };
  });
  const buys = kit.data.items.flatMap((item) => {
    const price = salePrice(place, item, kit);
    if (!price || !kit.owns(state, item.id)) return [];
    const id = item.id;
    const { count, reason } = localSaleTerms(state, id, kit);
    const quote = saleQuote(state, id, price);
    const reasonAt = (quantity) => tradeCapacityReason(state, { id, count: quantity, total: saleTotal(quote, quantity), buying: false }, kit);
    const quantities = reason ? [] : tradeQuantityOptions(Math.min(count, kit.rules.maxTradeCount), reasonAt);
    const singleSaleReason = quantities.includes(1) ? '' : reason || reasonAt(1);
    return [{ id, ...quote, count, quantities, ...(quantities.length && singleSaleReason ? { singleSaleReason } : {}),
      reason: quantities.length ? '' : singleSaleReason }];
  });
  return { offers, buys, repairReferral: place.repairReferral,
    talk: place.talk ? { label: place.talk.label, heard: known(state, place.talk.lead) } : null };
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

function localTrade(state, id, count, kit, buying, confirmationOptions) {
  const place = settlementOf(kit.data, state.region);
  const record = kit.records.items[id];
  if (!place || !record || !Number.isSafeInteger(count) || count < 1 || count > kit.rules.maxTradeCount) return kit.refuse('这桩买卖办不成。');
  if (!buying) {
    const price = salePrice(place, record, kit);
    if (!price) return kit.refuse('这件东西不能卖。');
    const sale = localSaleTerms(state, id, kit, count);
    if (sale.reason) return kit.refuse(sale.reason);
    const confirmation = kit.disposalConfirmation(state, 'localSell', record, count, Math.min(sale.count, kit.rules.maxTradeCount), confirmationOptions);
    if (confirmation) return confirmation;
    const quote = saleQuote(state, id, price);
    const total = saleTotal(quote, count);
    const capacity = tradeCapacityReason(state, { id, count, total, buying: false }, kit);
    if (capacity) return kit.refuse(capacity);
    kit.removeItem(state, id, count);
    kit.addCoins(state, total);
    recordSale(state, id, count, quote);
    return kit.say(state, `卖出${record.name}×${count}，收了${total}枚灵钱。`);
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

function discipleStanding(sect, credit) {
  let standing = { name: '外门弟子', role: sect.entryRole ?? '', credit: 0 };
  for (const rank of sect.ranks) {
    if (rank.disciple && rank.credit <= credit && rank.credit >= standing.credit) {
      standing = { name: rank.disciple, role: rank.role ?? '', credit: rank.credit };
    }
  }
  return standing;
}

function sectView(state, kit) {
  const sect = localSect(state, kit);
  if (!sect) return null;
  if (sect.id === 'water_gauge') return measuringSectView(state, kit);
  const membership = pledge(state, sect);
  const joined = state.world.affiliation === sect.id;
  const returning = Boolean(membership && !joined);
  const admission = returning ? { coins: 0, need: {} } : sect.join;
  const previousSect = kit.data.sects.find(({ id }) => id === state.world.affiliation);
  const joinReason = joined ? '' : state.world.affiliation ? `先回${previousSect?.name ?? '原师门'}辞行，再来拜师。` :
    kit.homeRequirements(state, admission?.coins ?? 0, admission?.need) || '';
  const credit = membership?.credit ?? 0;
  const disciple = joined ? discipleStanding(sect, credit) : null;
  const jobs = sect.jobs.filter((job) => !job.afterQuests || job.afterQuests.some((id) => state.completedQuests.includes(id))).map((job) => {
    const nextAt = membership?.jobs[job.id] ?? 0;
    const remaining = Number((nextAt - state.day).toFixed(3));
    const rankBlocked = credit < (job.minCredit ?? 0);
    const rankReason = job.rankReason ?? '管事还要你先办几桩别的差事。';
    const reason = !joined ? '这桩活只交给本门弟子。' : rankBlocked ? rankReason :
      nextAt > state.day ? `管事还在忙上次的活，${remaining}日后再来。` : job.days > 0 && state.satiety <= 0 ? '先吃些东西，再去办差。' :
      kit.homeRequirements(state, 0, job.need) || (!kit.hasRoom(state, job.reward ?? {}, kit.homeBagSpend(state, job.need)) ? '行囊腾出些地方，就能带走回礼。' : '');
    return { ...job, nextAt, available: !reason && !state.event && !state.combat, reason };
  });
  const ranks = sect.ranks.map((rank, index) => {
    const claimed = membership?.ranks.includes(index) ?? false;
    const honorary = !Object.values(rank.reward ?? {}).some((count) => count > 0);
    const reason = !joined ? '先入门，再找管事领回礼。' : credit < rank.credit ? `尚需${rank.credit - credit}份门中功劳。` :
      honorary ? '你的名字已经记在册上了。' : !claimed && !kit.hasRoom(state, rank.reward ?? {}) ? '行囊装不下这笔回礼。' : '';
    return { ...rank, id: String(index), claimed, honorary, available: !claimed && !reason, reason };
  });
  return { ...sect, join: { ...admission, returning, available: !joined && !joinReason, reason: joinReason }, joined, credit, disciple, jobs, ranks };
}

function actSect(state, action, id, kit) {
  const local = localSect(state, kit);
  if (!local) return kit.refuse('这里没有师门管事。');
  const view = sectView(state, kit);
  if (action === 'sectJoin') {
    if (!view.join.available) return kit.refuse(view.join.reason || '你已经是这门的人。');
    if (!view.join.returning) {
      kit.spendHome(state, local.join?.coins ?? 0, local.join?.need);
      state.world.memberships[local.id] = { credit: 0, jobs: {}, ranks: [] };
    }
    state.world.affiliation = local.id;
    if (view.join.returning) return kit.say(state, `${local.name}的管事翻到原来那一页，把册子转给你看。旧功劳都在。`);
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
    const { spilled } = kit.addItems(state, { ...job.reward, [kit.currency]: job.coins ?? 0 });
    member.credit += job.credit;
    if (job.days) kit.advance(state, job.days);
    member.jobs[id] = state.day + job.cooldown;
    const newDisciple = discipleStanding(local, member.credit);
    const promotion = newDisciple.name !== view.disciple.name ? `管事把你记入${newDisciple.name}的名册。` : '';
    return kit.say(state, `${job.text ?? ''}办完「${job.name}」，得${job.credit}份功劳${job.coins ? `和${job.coins}枚灵钱` : ''}。${spilled[kit.currency] ? '灵钱暂放在你脚边。' : ''}${promotion}`);
  }
  const rank = view.ranks.find((entry) => entry.id === String(id));
  if (!rank?.available) return kit.refuse(rank?.reason || '这笔门中回礼现在领不了。');
  member.ranks.push(Number(rank.id));
  kit.addItems(state, rank.reward ?? {});
  const gifts = kit.goodsText(rank.reward);
  const register = rank.disciple ? '' : `管事在名册上给你写了「${rank.name}」。`;
  return kit.say(state, `${rank.text ?? ''}${register}${gifts ? `领到${gifts}。` : ''}`);
}

function targetSummary(region, data, reason, extra = {}) {
  return { id: region.id, name: region.name, province: provinceOf(data, region.id), ...extra, reason, available: !reason };
}

export function worldView(state, kit) {
  const actual = kit.records.regions[state.region];
  const here = detail(kit.data, state.region);
  const discovered = kit.data.regions.filter((region) => marked(state, region.id));
  const edges = roadGraph(kit.data, { state });
  const avoidedRoads = new Set(state.world.avoidedRoads);
  const routesFromHere = knownRoutes(state, edges);
  const journeys = discovered.flatMap((region) => {
    if (region.id === state.region) return [];
    const quote = quoteRoad(state, region.id, kit, edges, routesFromHere);
    const ordinary = directRoad(state.region, region.id, edges);
    const via = (quote.legs ?? []).slice(0, -1).map(({ to }) => to);
    return quote.days === undefined ? [] :
      [targetSummary(region, kit.data, quote.reason, { days: quote.days, rescue: Boolean(quote.rescue),
        units: quote.units, direct: Boolean(ordinary && !isAvoidedRoad(ordinary, avoidedRoads)), via: via.map((id) => kit.records.regions[id].name), path: [state.region, ...via, region.id],
        meals: quote.meals, emptyOnArrival: quote.emptyOnArrival, restock: quote.restock })];
  });
  const roads = journeys.filter((road) => road.direct || (road.rescue && settlementOf(kit.data, road.id)?.inn));
  const neighbors = roadNeighbors(openKnownRoads(state, edges));
  const roadStatus = (edge) => {
    const reason = crossBlocker(state, edge.cross);
    const avoidReason = roadAvoidance(state, edge, neighbors);
    return { available: !reason, reason, avoided: isAvoidedRoad(edge, avoidedRoads), canAvoid: !avoidReason, avoidReason };
  };
  const knownEdges = edges.filter(({ from, to }) => marked(state, from) && marked(state, to)).map((edge) => {
    const risk = kit.roadRisk?.(state, edge);
    return { ...edge, ...roadStatus(edge), ...(risk ? { riskText: risk.riskText, risky: risk.chance > 0 } : {}) };
  });
  const provinceNames = new Map((kit.data.provinces ?? []).map(({ id, name }) => [id, name]));
  const knownProvinces = new Set([provinceOf(kit.data, state.region), ...discovered.map(({ id }) => provinceOf(kit.data, id))]);
  const provinces = (kit.data.provinces ?? []).map((province) => ({ ...province, known: knownProvinces.has(province.id) }));
  const crossLinks = edges.filter((edge) => edge.cross && !crossBlocker(state, edge.cross)).flatMap((edge) => {
    const status = roadStatus(edge);
    const risk = kit.roadRisk?.(state, edge);
    return [edge.from, edge.to].flatMap((from) => {
      const other = from === edge.from ? edge.to : edge.from;
      const province = provinceOf(kit.data, other);
      if (!marked(state, from) || !knownProvinces.has(province)) return [];
      return [{ from, province, name: provinceNames.get(province), key: edge.key, label: edge.label,
        destinationName: marked(state, other) ? kit.records.regions[other].name : null,
        units: edge.units, days: edge.days, water: edge.water,
        survey: atlasBorderRoad(atlasRoadPath(from, other), provinceOf(kit.data, from)),
        ...(risk ? { riskText: risk.riskText, risky: risk.chance > 0 } : {}), ...status }];
    });
  });
  const roadsById = Object.fromEntries(journeys.map((road) => [road.id, road]));
  const closedSidePaths = crossings.filter((edge) => {
    const other = otherside(edge, state.region);
    return other && kit.records.regions[other] && !marked(state, other) && crossBlocker(state, edge);
  }).map(({ label, days, reason }) => ({ label, days, reason, available: false }));
  const gates = discovered.filter(({ id }) => state.world.gates.includes(id)).map((region) => {
    const scrollReason = gateQuote(state, region.id, kit, true);
    return targetSummary(region, kit.data, gateQuote(state, region.id, kit, false),
      { days: transportRules.gateDays, price: transportRules.gatePrice, scrollDays: transportRules.scrollDays,
        scrollPrice: transportRules.scrollPrice, byScroll: !scrollReason, scrollReason });
  });
  const arrays = discovered.filter(({ id }) => Boolean(arrayPlan(kit.data, id))).map((region) => targetSummary(region, kit.data, arrayQuote(state, region.id, kit),
    { days: transportRules.arrayDays, price: transportRules.arrayPrice, active: arrayView(state, region.id, kit).active }));
  const points = discovered.map((region) => {
    const { portal, array, description } = detail(kit.data, region.id);
    const [x, y] = atlasLocation(region.id);
    return { id: region.id, name: region.name, province: provinceOf(kit.data, region.id), x, y, description: description ?? region.desc,
      settlement: Boolean(settlementOf(kit.data, region.id)), portal: Boolean(portal), array: Boolean(array), attuned: state.world.gates.includes(region.id),
      current: region.id === state.region, travelable: Boolean(roadsById[region.id]?.available),
      travelReason: roadsById[region.id]?.reason ?? '还不知道从这里接上的路。' };
  });
  const affiliation = kit.data.sects?.find(({ id }) => state.world.affiliation === id);
  const credit = affiliation ? pledge(state, affiliation)?.credit ?? 0 : 0;
  const [hereX, hereY] = atlasLocation(actual.id);
  return { settlement: settlementOf(kit.data, state.region), localMarket: localMarket(state, kit), sect: sectView(state, kit),
    affiliation: measuringAffiliation(state) ?? (affiliation ? { id: affiliation.id, name: affiliation.name, credit, disciple: discipleStanding(affiliation, credit) } : null),
    world: { province: provinceOf(kit.data, state.region), provinces, geography: atlasGeography, points, roads, edges: knownEdges, journeys,
      crossings: closedSidePaths, crossLinks,
      here: { id: actual.id, name: actual.name, province: provinceOf(kit.data, state.region), x: hereX, y: hereY, description: here.description ?? actual.desc },
      scrollCount: kit.owns(state, 'gate_scroll'), gates, localGate: here.portal ? { attuned: state.world.gates.includes(state.region) } : null,
      localArray: arrayView(state, state.region, kit), arrays } };
}

export function worldAction(state, action, payload, kit) {
  const { id, count = 1 } = payload;
  if (action === 'roadAvoid') return toggleRoadAvoidance(state, id, kit);
  if (action === 'attuneGate') return attune(state, kit);
  if (action === 'gateJump') return jumpGate(state, id, kit, false);
  if (action === 'gateScroll') return jumpGate(state, id, kit, true);
  if (action === 'arrayContribute') return contributeArray(state, id, count, kit);
  if (action === 'arrayJump') return jumpArray(state, id, kit);
  if (action === 'localBuy') return localTrade(state, id, count, kit, true);
  if (action === 'localSell') return localTrade(state, id, count, kit, false, payload);
  if (action === 'localAsk') return localAsk(state, kit);
  const measuring = measuringSectAction(state, action, payload, kit);
  if (measuring) return measuring;
  if (['sectJoin', 'sectLeave', 'sectWork', 'sectClaim'].includes(action)) return actSect(state, action, id, kit);
  return null;
}
