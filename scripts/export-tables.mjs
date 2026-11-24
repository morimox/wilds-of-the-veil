import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import data from '../data.mjs';
import { baseEscapeChance, createGame, rules, view } from '../engine.mjs';
import { banditRules, roadKey } from '../bandits.mjs';
import { bulkSaleRules, economyData } from '../economy.mjs';
import { alchemyData } from '../alchemy.mjs';
import { localGoods, roadGraph, settlementOf, transportRules } from '../world.mjs';
import { trainingData } from '../training.mjs';
import { hazardData } from '../hazards.mjs';

const output = fileURLToPath(new URL('../docs/tables/', import.meta.url));
const names = new Map();
for (const list of Object.values(data).filter(Array.isArray)) {
  for (const entry of list) {
    if (entry.name) names.set(entry.id, entry.name);
  }
}

const titles = {
  id: '标识', name: '名称', tier: '境界要求', price: '购入价（灵钱）', sell: '卖出价（灵钱）',
  desc: '说明', hp: '气血', qi: '真气', atk: '攻击', def: '防御', insight: '修为',
  cost: '费用', need: '所需物品', days: '时间（天）', kind: '类别', slot: '装备部位',
  retreat: '有空当时增加脱身概率', durability: '最大耐久', repair: '修理费（灵钱）',
  toxin: '丹毒变化', wound: '消除伤势', focus: '定息层数', damage: '固定伤害',
  guard: '额外防御', power: '攻击修正', pierce: '破甲', break: '削减重招伤害',
  reveal: '发现条件', result: '产物', count: '数量', travel: '行程（天）',
  hint: '线索提示', text: '正文', label: '选项', coins: '灵钱', loot: '所得物品',
  enemy: '引发战斗', mult: '倍率', reward: '奖励物品', region: '所属地区', value: '数值',
  hidden: '条件满足前隐藏', secret: '跳过通常的去向提示', revisit: '支持满足条件后回查',
  consume: '消耗所需物品',
  evidence: '证物',
};

const ruleDescriptions = {
  backpackCapacity: '行囊格数。已装备物品和关键线索不占格',
  backpackStackSize: '同种可堆叠物品每格上限',
  restDays: '村内休整单次用时（天）',
  restHp: '村内休整单次恢复气血（点）',
  restQi: '村内休整单次恢复真气（点）',
  restWounds: '村内休整单次消除伤势（处）',
  restToxin: '村内休整单次清除丹毒（点）',
  reliefRations: '休整时村民补助可补足至此份数，只供自用',
  exploreDays: '开始一次探索的用时（天）',
  explorePressure: '每次探索增加的压力（点）',
  firstRegionInsight: '首次探索一个地区获得的修为（点）',
  pressureThreshold: '探索压力高于此值时开始额外消耗真气（点）',
  pressureQi: '压力超限的每次探索所消耗的真气（点）',
  battleDays: '战斗操作每回合用时（天）',
  perceptionScale: '洞察概率曲线分母的固定项。洞察差除以固定项与洞察差之和',
  perceptionCap: '洞察优势转化为看破的概率上限',
  observedHitLimit: '敌人参考最近几次实际承受的主动出招伤害',
  combatDodgeCap: '完好装备对普通近击的闪避叠加上限',
  combatChargeFloor: '蓄势下一次亲手出招的最小原始增伤',
  combatChargeFactor: '蓄势增伤按人物攻击计算的比例',
  enemyChargeFactor: '敌方蓄势增伤按基础攻击计算的比例',
  chargeBreakDamage: '蓄势被气血伤害打散的单回合伤害下限',
  worthyFightPractice: '首次赢过某种同境或更强的野外对手，额外增加的历练进度',
  harvestEncounterDays: '采集中遭遇伏击时开打前用时（天）',
  retreatDays: '撤出战斗所需用时（天）',
  escapeDodgeFactor: '战斗闪避值折算成脱身概率的倍率',
  escapeChanceCap: '普通敌手有空当时的脱身概率上限',
  banditEscapeChanceCap: '强盗有空当时的脱身概率上限',
  mixedTrackDays: '混合猎场的同一路脚印消散用时（游戏日）',
  mixedTrackHealingPerDay: '失去接触的猎物每日恢复气血（向下取整）',
  emptyReturnDays: '空腹返村额外用时（天）',
  waitDays: '主动等候一次的游戏天数',
  maxSatiety: '饱腹度上限',
  batchMealTarget: '主动连吃时的饱腹目标（须容纳每份食物完整的饱腹增量）',
  satietyDrainPerDay: '每游戏日消耗的饱腹度',
  rationSatiety: '每份普通干粮恢复的饱腹度',
  emptyAttackMultiplier: '空腹交手时对普通与兵刃术诀出伤的倍率',
  unpackBasketDays: '拆开药篓所用的游戏天数',
  guardBonus: '主动格挡增加的防御（点）',
  guardQiRecovery: '对方守势时调息恢复的真气（点）',
  ebbCycleDays: '闭潮渡退水循环（游戏日）',
  ebbWindowDays: '每次退水维持时间（游戏日）',
  heavyGuardBonus: '主动格挡遇到重招时再增加的防御（点）',
  guardCounter: '格挡重招时的反击伤害（点）',
  enemyGuardBonus: '敌方防御意图至少增加的防御（点）',
  minAttackDamage: '有攻击伤害的行动经防御结算后的最小伤害（点）',
  durabilityLoss: '每次触发装备磨损扣除的耐久（点）',
  woundPenalty: '每处伤势降低的气血上限（点）',
  toxinThreshold: '丹毒达到此值时触发额外代价（点）',
  toxinDamage: '服丹后丹毒达到阈值时扣除的气血（点），保留至少 1 点气血',
  focusLimit: '可存储的定息层数上限',
  focusDamage: '施术消耗一层定息时增加的伤害',
  researchDays: '每次静修耗时（天）',
  researchQi: '每次静修消耗的真气（点）',
  researchInsight: '每次静修获得的修为（点）',
  researchLimit: '每一境界可进行的有效静修次数',
  mealHeal: '吃一份干粮恢复的气血',
  fallDays: '战败或气血耗尽被救回村所用的时间（天）',
  fallMaxCoinLoss: '被救回时扣除灵钱的上限',
  fallCoinLossFactor: '被救回时按此比例扣除灵钱，向上取整后受上限限制',
  fallWounds: '被救回时增加的伤势（处）',
  fallHpFactor: '被救回时将气血设为当时气血上限的此比例，向上取整',
  fallQi: '被救回后留下的真气（点），受真气上限限制',
  maxWounds: '伤势数量上限',
  maxTradeCount: '单次买卖可提交的最大数量',
  combatDodgeCap: '被动闪避概率上限',
  combatActiveDodge: '主动闪避计入的基础闪避值',
  combatActiveDodgeCap: '主动闪避概率上限',
  combatDodgeAccuracyScale: '命中抵消闪避的折算基准',
  combatQuickDodgeFactor: '重招、远程或抽气时被动闪避值的乘数',
  combatActiveQuickDodgeFactor: '远程或抽气时主动闪避基础值的乘数',
  combatConsecutiveDodges: '连续闪开伤害后的上限，下一次符合条件的有效攻势命中',
  largeRealmGap: '额外境界压制起始差距（小境界数）',
  largeRealmPressure: '每个超出的小境界带来的对方攻势倍率增项及己方输出除数增项',
  largeRealmAccuracy: '每个超出的小境界额外提高的敌方命中',
};

const name = (id) => names.get(id) ?? id;
const ref = (id) => names.has(id) ? `${name(id)}（${id}）` : id;
const resources = (entries = {}) => Object.entries(entries)
  .map(([id, count]) => `${ref(id)}×${count}`).join('、');
const realm = (id) => data.realms.find((entry) => entry.id === id)?.name ?? id;
const knownKinds = {
  gear: '装备', material: '材料', food: '口粮', object: '任务实物', pill: '丹药', talisman: '符箓', key: '线索', ammo: '弹药', manual: '内功书',
  attack: '普通攻势', heavy: '重招', guard: '防御', dodge: '闪避', drain: '吸取真气', heal: '恢复', focus: '蓄势', remedy: '服药',
};
const slotNames = data.equipmentSlots;
const reveal = ({ item, quest, need } = {}) => {
  const lead = [item && `得知物品 ${ref(item)}`, quest && `完成委托 ${ref(quest)}`].filter(Boolean).join(' 或 ');
  return [lead, need && `须持有 ${resources(need)}`].filter(Boolean).join('；');
};
const renderers = {
  slot: (id) => slotNames[id] ?? id,
  kind: (id) => knownKinds[id] ?? id,
  region: ref,
  enemy: ref,
  result: ref,
  need: resources,
  loot: resources,
  reward: resources,
  reveal,
};

function valueText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (Array.isArray(value)) return value.map(valueText).join('、');
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, child]) => `${titles[key] ?? key}＝${valueText(child)}`).join('、');
  }
  return value;
}

function table(file, heading, rows, fields, { note = '', omit = [] } = {}) {
  const explicit = fields.map((field) => typeof field === 'string' ? [field] : field);
  const present = new Set([...explicit.map(([key]) => key), ...omit]);
  const remaining = new Set(rows.flatMap(Object.keys).filter((key) => !present.has(key)));
  const columns = [...explicit, ...[...remaining].map((key) => [key])];
  const headers = columns.map(([key, title]) => title ?? titles[key] ?? key);
  const values = rows.map((row) => columns.map(([key, , format]) => {
    const value = row[key];
    if (value === null || value === undefined) return '';
    const renderer = format ?? renderers[key] ?? valueText;
    return renderer(value);
  }));
  return { file, heading, note, values: [headers, ...values] };
}

const described = (rows) => rows.map((row) => ({ ...row, name: name(row.id) }));
const gated = (rows) => rows.map((row) => ({ ...row, realmName: realm(row.tier ?? 0) }));
const tier = ['realmName', '境界名'];
const initial = createGame(20261122);
const initialItems = Object.entries(initial.inventory).map(([id, count]) => ({ id, name: name(id), count }));
const initialGear = Object.entries(initial.equipment).map(([slot, id]) => ({
  slot, id, name: name(id), durability: initial.durability[id],
}));
const initialArts = initial.knownArts.map((id) => ({ id, name: name(id) }));
const startState = [
  ['day', '日期（天）', initial.day],
  ['region', '地区', ref(initial.region)],
  ['realm', '境界', realm(initial.realm)],
  ...['hp', 'qi', 'coins', 'insight', 'pressure', 'wounds', 'toxin', 'focus', 'reliefRations']
    .map((key) => [key, ({
      pressure: '探索压力', wounds: '伤势', toxin: '丹毒', focus: '定息', reliefRations: '自用补助干粮',
    })[key] ?? titles[key], initial[key]]),
  ['satiety', '饱腹度', initial.satiety],
  ['discovered', '已知地区', initial.discovered.map(ref).join('、')],
  ['victoryQuest', '旧渡章节委托', ref(data.victoryQuest)],
  ...(data.finalQuest ? [['finalQuest', '最终委托', ref(data.finalQuest)]] : []),
].map(([id, name, value]) => ({ id, name, value }));

const siteNames = new Map(data.sites.map(site => [site.id, site.name]));
const siteRef = (id) => `${siteNames.get(id)}（${id}）`;
const stockDetails = (id, { item = id, label, ...pool }) => ({ poolId: id, object: item, label, ...pool });
const populationCurve = (pool) => pool.interval > 0 && pool.growth > 0 ? pool.curve ?? 'fixed' : 'none';
const curveText = (id) => ({ wild: '随种群密度变化', fixed: '固定间隔', none: '不回补' })[id] ?? id;
const percent = (value) => `${Number((value * 100).toFixed(6))}%`;
const worldPools = data.sites.flatMap(site => [
  ...Object.entries(site.stocks ?? {}).map(([id, pool]) => ({ site: site.id, kind: '资源', ...stockDetails(id, pool) })),
  ...Object.entries(site.creatures ?? {}).map(([id, pool]) =>
    ({ site: site.id, kind: '种群', poolId: id, object: id, ...pool, curve: populationCurve(pool) })),
]);
const basketOptions = [
  { action: '查看', note: data.basket.inspect, days: 0 },
  { action: '拆篓', note: data.basket.unpack.outcome, days: rules.unpackBasketDays, loot: data.basket.unpack.loot, spent: { [data.basket.item]: 1 } },
];
const choices = data.events.flatMap(({ id, name, choices }) =>
  choices.map((choice, index) => ({ event: id, eventName: name, order: index + 1, ...choice })));
const guardedActors = choices.flatMap((choice) =>
  [].concat(choice.guardedBy ?? choice.ambush?.enemy ?? choice.afterFight ?? []).map((actor) => ({ choice, actor })));
const guardedChoices = guardedActors.map(({ choice, actor }) => {
  const site = data.sites.find(({ id }) => id === choice.event);
  const pool = site.creatures[actor];
  const curve = populationCurve(pool);
  const stocks = Object.entries(site.stocks ?? {}).filter(([, stock]) => stock.choices.includes(choice.order - 1))
    .map(([id, stock]) => stockDetails(id, stock));
  const finite = stocks.length > 0 && stocks.every(({ interval, growth }) => !interval || !growth);
  const clearDelayApplies = choice.guardedBy || (choice.ambush && curve === 'wild');
  let condition;
  let revisit;
  if (choice.guardedBy) {
    condition = '通过前要清除该行动所列的全部看守';
    revisit = curve === 'none' ? '本种看守不会回来，完成条件后可再回来办理尚未领取的事' :
      finite ? '本种看守回来时须再清场，库存采尽后不再补充' : '本种看守回来才须再清场，库存独立回补';
  } else if (choice.ambush) {
    condition = '可直接采，活跃对手可能打断每批采集';
    revisit = '回补后仍可直接采，有对手在场时每批可能遭遇';
  } else if (choice.perWin) {
    condition = '每次获胜解锁本班奖品';
    revisit = '同一地每场胜利对应一次领取；领取间隔按现场选项计算';
  } else {
    condition = '获胜一次后可办理一次';
    revisit = '已获胜便可回来办理，领取后关闭选项';
  }
  return {
    site: site.id, region: site.region, actor, action: choice.label, condition, revisit, loot: choice.loot, ambush: choice.ambush?.chance,
    stocks: stocks.map(({ object, label, start, cap, interval, growth }) =>
      `${label ?? name(object)}（初始${start}、上限${cap}${interval > 0 && growth > 0 ? `、每${interval}日补${growth}` : '、存量有限'}）`).join('、'),
    start: pool.start, cap: pool.cap, interval: pool.interval, growth: pool.growth, curve,
    firstReturn: clearDelayApplies && curve !== 'none'
      ? Number((pool.interval * (pool.depletedFactor ?? 1)).toFixed(6)) : undefined,
  };
});
const describeChoice = (key) => {
  const [event, index] = key.split(':');
  const choice = data.events.find(row => row.id === event)?.choices[Number(index)];
  return choice ? `${ref(event)} · ${choice.label}` : key;
};
const traitText = (trait) => [
  ({ damage: '额外伤害', pierce: '额外穿甲', guard: '额外护持', reflect: '受相应近击后的反伤', dodge: '被动闪避值', accuracy: '降低对手闪避的命中值' })[trait.kind] ?? trait.kind,
  trait.enemyTag && `敌人标签 ${trait.enemyTag}`,
  trait.intent && (knownKinds[trait.intent] ?? trait.intent),
  `加成 ${['dodge', 'accuracy'].includes(trait.kind) ? percent(trait.bonus) : trait.bonus}`,
].filter(Boolean).join(' · ');
const intents = data.enemies.flatMap(({ id, name, intents }) =>
  intents.map((intent, index) => ({ enemyId: id, enemyName: name, order: index + 1, ...intent })));
const deductions = data.deductions ?? [];
const experiments = data.events.filter((event) => event.experiment)
  .map(({ id, experiment }) => ({ site: id, ...experiment }));
const experimentOptions = experiments.flatMap(({ id, site, controls, solution, misses }) =>
  controls.flatMap((control) => control.options.map((option) => ({
    deductionId: id, site, control: control.id, controlLabel: control.label,
    id: option.id, label: option.label,
    producesResult: solution[control.id] === option.id,
    observation: misses?.[control.id]?.[option.id],
  }))));
const itemsById = new Map(data.items.map((item) => [item.id, item]));
const purchaseTiers = new Map([...data.gear, ...data.pills, ...data.talismans].map(({ id, tier }) => [id, tier]));
const marketOffers = data.market.stalls.flatMap((stall) => stall.offers.map(({ id, afterQuest, stock }) => ({
  stallId: stall.id, stallName: stall.name, merchantText: stall.desc, id, name: name(id),
  price: itemsById.get(id).price, afterQuest, purchaseTier: purchaseTiers.get(id),
  cap: stock?.cap, interval: stock?.interval, growth: stock?.growth,
})));
const merchantOrders = Object.entries(economyData.merchantOrders).flatMap(([goods, { repeat, units, regularText, ...order }]) => [
  { goods, phase: '首单', units, regularText, ...order },
  ...(repeat ? [{ goods, phase: '续单', units, ...repeat }] : []),
]);
const facilityNames = new Map(economyData.facilities.map(({ id, name: label }) => [id, label]));
const facilityRef = (id) => `${facilityNames.get(id) ?? id}（${id}）`;
const facilityLevels = economyData.facilities.flatMap(({ id, name, start, desc, reveal, alternateReveal, upgrades }) =>
  [{ id, name, level: start, desc }, ...upgrades.map((upgrade, index) => ({ id, name, desc, level: start + index + 1, ...upgrade }))]
    .map((row) => ({
      ...row,
      slots: id === 'warehouse' ? economyData.warehouseCap[row.level] : row.level,
      stack: id === 'warehouse' ? economyData.warehouseStack : undefined,
      reveal,
      alternateReveal,
    })));
const weaponClass = { staff: '杖', blade: '刀', sword: '剑', spear: '长兵', axe: '斧', bow: '弓', crossbow: '弩', hammer: '锤', fist: '徒手与指虎' };
const offeredItems = new Set(marketOffers.map(({ id }) => id));
const itemTradeRows = data.items.map((item) => ({ ...item, price: offeredItems.has(item.id) ? item.price : 0 }));
const localOfferRows = data.regions.flatMap(({ id: region }) => {
  const settlement = settlementOf(data, region);
  if (!settlement) return [];
  return Object.entries(localGoods(settlement)).map(([id, offer]) => ({ region, id, name: name(id), ...offer }));
});
const acquisitionRows = data.gear.filter(({ slot }) => slot === 'weapon').flatMap(({ id }) => [
  ...(Object.values(data.starting.gear).includes(id) ? [{ id, method: '初始装备' }] : []),
  ...marketOffers.filter((offer) => offer.id === id).map((offer) => ({
    id, method: '坊市', source: offer.stallName, price: offer.price, interval: offer.interval, afterQuest: offer.afterQuest,
    repeatable: offer.cap === undefined || offer.growth > 0,
  })),
  ...localOfferRows.filter((offer) => offer.id === id).map((offer) => ({
    id, method: '定居点货架', source: ref(offer.region), price: offer.price, interval: offer.interval,
    repeatable: offer.interval > 0 && (offer.growth ?? 1) > 0,
  })),
  ...data.recipes.filter((recipe) => recipe.result === id).map((recipe) => ({
    id, method: '制作', source: recipe.id, price: recipe.cost, need: recipe.need, repeatable: true,
  })),
  ...choices.filter(({ loot }) => loot?.[id]).map(({ event, order, afterFight, perWin }) => {
    const site = data.sites.find(({ id }) => id === event);
    return { id, method: afterFight ? '胜后另行领取' : '现场获得', source: describeChoice(`${event}:${order - 1}`), afterFight,
      interval: perWin ? site.creatures?.[afterFight]?.interval : undefined,
      repeatable: !site.once?.includes(order - 1),
    };
  }),
]).map((row) => ({ ...row, weapon: name(row.id) }));
const stapleRows = ['wood', 'reed', 'hide', 'ore', 'core', 'black_iron', 'kiln_clay', 'beast_meat', 'qi_core', 'foundation_core', 'gold_core', 'beast_eye', 'hard_scale', 'battle_sinew'].map((id) => ({
  id, name: name(id),
  pools: worldPools.filter((pool) => pool.kind === '资源' && pool.object === id && pool.growth > 0)
    .map(({ site, label }) => label ? `${siteRef(site)} · ${label}` : siteRef(site)).join('、'),
  enemySources: data.enemies.filter((enemy) => enemy.loot?.[id] || enemy.chanceLoot?.[id]).map((enemy) => enemy.name).join('、'),
  recipes: data.recipes.filter(({ need }) => need?.[id]).length,
  facilities: facilityLevels.filter(({ need }) => need?.[id]).length,
  projects: economyData.projects.filter(({ need }) => need?.[id]).length,
  exchanges: choices.filter(({ consume, need }) => consume && need?.[id]).length,
  breakthrough: data.realms.filter(({ need }) => need?.[id]).length,
  training: trainingData.flatMap(({ ranks }) => ranks).filter(({ need }) => need?.[id]).length,
}));
const huntedItems = ['qi_core', 'foundation_core', 'gold_core', 'beast_meat', 'beast_eye', 'hide', 'hard_scale', 'battle_sinew',
  'den_neck_plate', 'quarry_back_spine', 'dyke_backstrap', 'ridge_ramhorn'];
const huntSources = worldPools.filter(({ kind }) => kind === '种群').flatMap((pool) => {
  const enemy = data.enemies.find(({ id }) => id === pool.object);
  const site = data.sites.find(({ id }) => id === pool.site);
  const { choices } = data.events.find(({ id }) => id === site.id);
  const approach = choices.filter(({ enemy: id, encounter }) => id === enemy.id || encounter?.includes(enemy.id))
    .map(({ label }) => label).join('、');
  return huntedItems.filter((id) => enemy.loot?.[id] || enemy.chanceLoot?.[id]).map((id) => {
    const { count: bonus, chance } = enemy.chanceLoot?.[id] ?? {};
    const fixed = enemy.loot?.[id] ?? 0;
    return {
      id, enemy: enemy.id, realm: realm(enemy.tier), place: site.region, site: site.id, approach, fixed, bonus, chance,
      average: Number((fixed + (bonus ?? 0) * (chance ?? 0)).toFixed(3)),
      start: pool.start, cap: pool.cap, interval: pool.interval, growth: pool.growth, curve: pool.curve,
      access: [reveal(site.reveal), ...(site.afterChoices ?? []).map(describeChoice)].filter(Boolean).join('、'),
    };
  });
});
const mixedHunts = choices.filter(({ encounter }) => encounter).flatMap(({ event, label, encounter, encounterWeights, days, afterChoice }) => {
  const site = data.sites.find(({ id }) => id === event);
  const initial = encounter.reduce((count, id) => count + site.creatures[id].start, 0);
  const weight = (id) => encounterWeights?.[id] ?? 1;
  const weighted = encounter.reduce((count, id) => count + site.creatures[id].start * weight(id), 0);
  return encounter.map((id) => ({
    site: event, label, enemy: id, total: initial, days, weight: weight(id),
    unlock: afterChoice === undefined ? '' : describeChoice(`${event}:${afterChoice}`),
    initialChance: weighted ? site.creatures[id].start * weight(id) / weighted : 0, ...site.creatures[id],
  }));
});
const formatChanceLoot = (entries) => Object.entries(entries).map(([id, { count, chance }]) =>
  `${ref(id)}×${count}（${percent(chance)}）`).join('、');
const huntCosts = [
  ...data.realms.map(({ name, need }) => ({ type: '突破', name, need })),
  ...data.recipes.map(({ result, need, count }) => ({ type: '配方', name: name(result), need, output: count ?? 1 })),
  ...trainingData.flatMap(({ name, ranks }) => ranks.map(({ need }, index) => ({ type: '修习', name: `${name} 第${index + 1}阶`, need }))),
  ...economyData.backpackExpansions.map(({ name, need }) => ({ type: '行囊', name, need })),
  ...economyData.projects.map(({ name, need, loot }) => ({ type: '后院生产', name, need, output: resources(loot) })),
].flatMap(({ type, name, need, output }) => huntedItems.filter((id) => need?.[id])
  .map((id) => ({ id, type, name, count: need[id], output })));
const alchemyFormulae = data.recipes.filter(({ formula }) => formula).map((recipe) => {
  const offer = alchemyData.offers.find(({ id }) => id === recipe.formula);
  const step = alchemyData.inquiry.find(({ reward }) => reward?.[recipe.formula]);
  const found = choices.filter(({ loot }) => loot?.[recipe.formula]);
  const handins = data.quests.filter(({ reward }) => reward?.[recipe.formula]).map(({ name }) => name);
  const fieldTests = experiments.filter(({ reward }) => reward?.[recipe.formula]).map(({ site }) => siteRef(site));
  const sects = data.sects.filter(({ ranks }) => ranks.some(({ reward }) => reward?.[recipe.formula])).map(({ name }) => name);
  return { id: recipe.formula, name: name(recipe.formula), result: recipe.result, recipe: recipe.id, need: recipe.need,
    source: offer ? alchemyData.town.name : step?.label ?? [...found.map(({ event, order }) => describeChoice(`${event}:${order - 1}`)), ...handins, ...fieldTests, ...sects].join('、'),
    price: offer?.price, reveal: offer?.reveal };
});
const ruleRows = Object.entries({ ...data.rules, ...rules })
  .map(([id, value]) => ({ id, value, desc: ruleDescriptions[id] ?? '' }));
ruleRows.push(
  { id: 'setupDays', value: economyData.setupDays, desc: '每次开启生产的操作耗时（日）' },
  { id: 'collectDays', value: economyData.collectDays, desc: '每次领取成品的操作耗时（日）' },
  { id: 'consumableBatchLimit', value: economyData.consumableBatchLimit, desc: '常用消耗品每单合批数上限；材料、灵钱和工期照批数累加' },
  { id: 'facilityOrderMultiplier', value: economyData.facilityOrderMultiplier, desc: '工位开工及待领总单数上限为设施等级乘此数' },
);
const normalHit = (enemy) => [...new Set(enemy.intents.filter(({ kind }) => kind === 'attack')
  .map(({ mult }) => Math.ceil(enemy.atk * (mult ?? 1))))].join(' / ');
const enemyRows = gated(data.enemies.map((enemy) => ({ ...enemy, normalHits: normalHit(enemy), escapeChance: baseEscapeChance(enemy) })));
const foodRows = described(data.foods).map((meal) => {
  const project = meal.grade > 0 ? economyData.projects.find((row) => row.loot?.[meal.id]) : undefined;
  return { ...meal, need: project?.need, level: project?.level, cost: project?.cost, days: project?.days, count: project?.loot[meal.id] };
});
const regionRows = data.regions.map((region) => {
  const { province, x, y, links, portal, array } = data.regionDetails[region.id];
  return { ...region, province, x, y, links, portal: Boolean(portal), array: Boolean(array),
    town: settlementOf(data, region.id)?.type };
});
const towns = regionRows.filter(({ town }) => town);
const marketProbe = createGame(15);
marketProbe.inventory = Object.fromEntries(data.items.map(({ id }) => [id, 1]));
const localSaleRows = towns.flatMap(({ id: region }) => {
  marketProbe.region = region;
  return view(marketProbe).localMarket.buys.map(({ id, price, demand }) => ({
    region, id, name: name(id), price, reserve: demand?.reserve,
    capacity: demand?.remaining, replenished: demand ? bulkSaleRules[id].replenished : undefined,
    days: demand ? bulkSaleRules[id].days : undefined,
  }));
});
const localRepairRows = towns.flatMap(({ id: region }) => {
  marketProbe.region = region;
  const repair = view(marketProbe).repairService;
  if (!repair) return [];
  return Object.entries(repair.prices).map(([id, price]) => ({
    region, service: repair.name, id, name: name(id), surcharge: repair.surcharge, price,
  }));
});
const sectJobs = data.sects.flatMap((sect) => sect.jobs.map((job) => ({ region: sect.region, sect: sect.name, ...job })));
const sectRanks = data.sects.flatMap((sect) => sect.ranks.map((rank) => ({ region: sect.region, sect: sect.name, ...rank })));
const trainingRows = trainingData.flatMap(({ ranks, ...track }) => ranks.map((rank, index) => ({ ...track, ...rank, level: index + 1 })));
const transportRows = [
  ...transportRules.crossings.map(({ a, b, label, days, item, quest, reason }) => ({ label, a, b, days, item, quest, reason })),
  ...transportRules.shortcuts.map(({ a, b, label, days, openedBy }) => ({ label, a, b, days, reason: describeChoice(openedBy) })),
  { label: '州内门至门', price: transportRules.gatePrice, days: transportRules.gateDays, reason: '亲自认下两端传送门。' },
  { label: '传送卷轴', days: transportRules.scrollDays, item: 'gate_scroll', reason: '每次使用一张，从任意安全停靠点传往已认门。' },
  { label: '跨州阵至阵', price: transportRules.arrayPrice, days: transportRules.arrayDays, reason: '两端州阵已修通。' },
];
const roadProfiles = new Map(data.roadBandits.roads.map((profile) => [roadKey(profile.a, profile.b), profile]));
const roadRows = roadGraph(data).map((edge) => {
  const profile = roadProfiles.get(edge.key);
  return { ...edge, distance: edge.units * banditRules.distanceUnit, chance: profile?.chance ?? 0, crew: profile?.crew,
    mode: edge.water ? '渡船' : edge.cross ? '跨州陆路' : edge.openedBy ? '支路' : '普通陆路',
    open: edge.openedBy ? describeChoice(edge.openedBy)
      : [edge.cross?.item, edge.cross?.quest].filter(Boolean).map(ref).join(' 或 '), riskText: profile?.riskText };
});
const crewRows = Object.entries(data.roadBandits.crews).map(([id, crew]) => ({
  id, ...crew, count: crew.members.reduce((sum, value) => sum + value, 0),
  hideout: crew.headquarters?.name, baseRegion: crew.headquarters?.region,
  roads: data.roadBandits.roads.filter(({ crew: owner }) => owner === id).map(({ a, b }) => `${name(a)} 至 ${name(b)}`).join('、'),
  delay: crew.recruit?.delay ?? banditRules.recruitDelay, interval: crew.recruit?.interval ?? banditRules.recruitInterval,
  inside: data.roadBandits.dens[crew.den]?.heads, minFactor: data.roadBandits.dens[crew.den]?.minFactor,
  leaderlessDelay: crew.den && banditRules.leaderlessDelay, leaderlessInterval: crew.den && banditRules.leaderlessInterval,
}));
const banditRanges = ([min, max]) => `${min}–${max}`;
const rollList = (pool) => pool.map(({ id, weight }) => `${ref(id)} × ${weight}`).join('、');
const fixedBanditRows = data.roadBandits.fixed.flatMap(({ id, a, b, chance, intro, enemy, fee, actions, afterPay, afterWin, crew, forceAt, nonThreatActions }) => [
  ...actions.map(({ id: action, ...choice }) => ({ action, ...choice })),
  ...(nonThreatActions ?? []).map(({ id: action, ...choice }) => ({ action, ...choice })),
  ...(fee != null ? [{ action: 'pay', label: '交过路钱', ...afterPay }] : []),
  ...(afterWin?.actions?.length ? afterWin.actions.map(({ id: action, ...choice }) => ({ action, ...choice, intro: afterWin.intro }))
    : [{ action: 'victory', label: '胜后', ...afterWin }]),
].map((row) => ({ id, a, b, chance, intro, enemy, fee, crew, forceAt, ...row })));
const arrayRows = regionRows.filter(({ array }) => array).map(({ id: region, province }) => ({
  region, province, ...transportRules.arrayPlans[province],
}));
const mechanismRows = (data.mechanisms ?? []).map(({ lead, failure, moves, dials, rewardOnGround, ...record }) => ({
  ...record, lead: lead?.item, leadText: lead?.text, damage: failure?.damage ?? 0, fatal: failure?.fatal ?? false,
  moves: moves.map(({ label }) => label), dials: dials?.map(({ name, states }) => `${name}（${states.join('／')}）`),
}));
const marketTalkRows = towns.flatMap(({ id: region }) => {
  const talk = settlementOf(data, region).talk;
  return talk ? [{ region, ...talk }] : [];
});
const matchRows = data.tournament.matches.map((match, index) => ({ ...match, order: index + 1, region: data.tournament.region,
  lead: data.tournament.lead, fee: data.tournament.fee, days: data.tournament.boutDays, cooldown: data.tournament.cooldown }));
const tournamentPrizes = data.tournament.prizes.map((prize, wins) => ({ ...prize, wins }));
const incidentJobNames = { report: '向杨芹报信', brace: '加固栏杆', move: '撤驮兽', look: '从草丘查水源',
  divert: '给旧水槽分流', fight: '前往截住盐泥豺', repair: '善后修栏', settle: '结清工钱' };
const manualSources = data.events.flatMap(({ id, choices }) => choices.flatMap((choice, index) =>
  Object.keys(choice.loot ?? {}).map((item) => [item, describeChoice(`${id}:${index}`)])));
manualSources.push(...fixedBanditRows.flatMap(({ a, b, label, loot }) =>
  Object.keys(loot ?? {}).map((item) => [item, `${name(a)}至${name(b)} · ${label}`])));
const innerStyleRanks = data.innerStyles.flatMap(({ id, name, grade, tier, specialty, ranks }) =>
  ranks.map(({ base, focus, fistCharge, effect, tier: rankTier = tier, cost = 0, days = 0, need }, index) => ({
    id, name, grade, rank: index + 1, maxRank: ranks.length, tier: rankTier, cost, days, need, effect,
    specialty, source: manualSources.find(([item]) => item === id)?.[1],
    ...base, focusAtk: focus?.atk, focusPierce: focus?.pierce, focusGuard: focus?.guard,
    fistName: fistCharge?.name, fistPower: fistCharge?.power, fistPierce: fistCharge?.pierce, fistQi: fistCharge?.qi,
  })));

const tables = [
  table('realms', '境界与突破', data.realms, [
    'id', 'name', ['hp', '基础气血'], ['qi', '基础真气'], ['atk', '基础攻击'], ['def', '基础防御'], ['perception', '基础洞察'],
    ['insight', '突破所需修为'], ['practice', '本境有效历练日'], ['cost', '突破费用（灵钱）'], 'need',
    ['requireQuest', '所需世界进程', ref], ['requireDefeated', '须亲自击败的对手', (ids) => ids.map(ref).join('、')],
    ['pressure', '越过本境的出伤倍率'], 'days',
  ], { note: '出伤倍率用于向更高境界进攻。相隔两境时，两档倍率连乘。' }),
  table('items', '物品与交易', itemTradeRows, ['id', 'name', 'kind', 'price', 'sell', 'desc'],
    { note: '价格为 0 表示无对应买卖渠道。买入的货源与到货条件见坊市货单。卖出按手中符合规则的物件结算。' }),
  table('common-materials', '常用原料跨系统用途', stapleRows, [
    'id', 'name', ['pools', '可回生的现场'], ['enemySources', '解取的对手'],
    ['recipes', '用到的配方数'], ['projects', '用到的后院项目数'], ['facilities', '用到的设施升级数'],
    ['exchanges', '野外交付选择数'], ['breakthrough', '直接用于突破的境数'], ['training', '用到的修习级数'],
  ]),
  table('hunt-material-sources', '各地猎物材料和回补', huntSources, [
    ['id', '材料', ref], ['place', '地区', ref], ['site', '小地点', siteRef], 'enemy', ['realm', '对手境界'],
    ['fixed', '每胜保证的数量'], ['bonus', '概率额外数量'], ['chance', '额外掉率', percent], ['average', '每胜平均数量'],
    ['start', '初始数'], ['cap', '最多'], ['interval', '基准回补间隔（游戏日）'],
    ['growth', '一次回补数'], ['curve', '回补规律', curveText], ['access', '小地点的发现方式'], ['approach', '现场主动交手'],
  ], { note: '三阶妖丹、妖目、生兽肉和首领专属部位见于当场击败对应妖物，独斗和重复猎场在回补栏区分。兽革另有雪蜕类的现场库存，见常用原料表。每胜的物品仍须在脚边拾取。含隐地剧透。' }),
  table('mixed-hunts', '混合猎场的初始种群', mixedHunts, [
    ['site', '小地点', siteRef], 'label', 'enemy', ['unlock', '先开哪条进路'], 'days',
    ['total', '初始总数'], ['start', '本种初始数'], ['weight', '该走法中每只的抽取权重'],
    ['initialChance', '首次遇见本种的概率', percent], ['cap', '本种上限'], ['interval', '基准回补（游戏日）'],
  ], { omit: ['growth'], note: '本种当前数量乘走法权重，再除以所有在场权重之和。两处大型据点每只对手权重相同，首领参与首次抽取。同地点两条走法共享种群。撤退或倒地后，三日内重走原路会接着遇到之前的对手。' }),
  table('hunt-material-costs', '猎获原料的实际消耗', huntCosts, [
    ['id', '消耗原料', ref], ['type', '玩法'], 'name', ['count', '一次耗量'], ['output', '产量（如适用）'],
  ], { note: '突破材料与制作破境丹的投入分别列出。炮制高阶丹药、做特殊箭和其他消耗品可按已有合批规则追加，每批都扣该栏原料。' }),
  table('market-offers', '坊市货单', marketOffers, [
    ['stallId', '摊位标识'], ['stallName', '摊位'], 'id', 'name', 'price',
    ['afterQuest', '实际到货所需的委托', ref], ['purchaseTier', '购入所需境界', realm],
    ['cap', '常态库存上限'], ['interval', '每批补货间隔（天）'], ['growth', '每批补货量'],
    ['merchantText', '摊主介绍'],
  ], { note: '到货条件为空的商品从开局陈列。售价按件。库存一栏为空时可常时补货。每位摊主专卖一种，制作条件由配方表另列。' }),
  table('merchant-orders', '商人熟客委托', merchantOrders, [
    ['goods', '商人专营物品', ref], ['phase', '委托阶段'], ['units', '累计付费购入件数'],
    'name', ['regularText', '成为熟客时摊主的话'], ['text', '商人委托'], 'need', 'cost', 'reward',
    ['cooldown', '可接下一单的间隔（天）'], ['outcome', '交付后回话'],
  ], { note: '实际成功买入的件数累加。首单只结一次，续单等到商人处理完上一批货再接。' }),
  table('facility-levels', '后院设施与升级', facilityLevels, [
    'id', 'name', ['level', '设施等级'], ['slots', '仓储格数或并行工位数'],
    ['stack', '仓库每格堆叠上限'], ['reveal', '看见设施需实际取得的物件', ref], ['alternateReveal', '另一件可引出设施的物件', ref],
    'need', ['cost', '搭建扩建费用（灵钱）'], 'days', 'desc',
  ], { note: '起始仓库已经可用。等级 0 的生产设施需要先搭建。生产工位数与等级相等，完工单移出工位。开工及待领总单数最多为设施等级的两倍，仓库单列实际格数。' }),
  table('backpack-expansions', '行囊和乾坤袋', [
    { name: '行囊', capacity: rules.backpackCapacity, source: '初来落灯村' },
    ...economyData.backpackExpansions,
  ], [
    'name', ['capacity', '容量（格）'], ['source', '来历'], ['lead', '实际发现的材料或袋样', ref],
    'need', ['cost', '制作费用（灵钱）'], 'days',
  ], { note: '每档同种物品每格可放 20 件。落灯村皮匠照袋样制作，新袋容量较大时自动使用，所携物件直接随身。' }),
  table('yard-projects', '后院种植与备粮', economyData.projects, [
    'id', 'name', ['facility', '使用设施', facilityRef], ['level', '所需设施等级'],
    'need', 'loot', ['cost', '费用（灵钱）'], ['days', '等待成熟天数'],
    ['reveal', '来源线索', ref], ['description', '现场说明'],
  ], { note: '炼丹和锻造的批次产量与投入见制作用方。常用品可合批，产量、材料、灵钱和工期按批数结算。成熟后可到后院收取，普通成品也可直接入仓。' }),
  table('gear', '装备', gated(described(data.gear.map(({ trait, traits = [], ...item }) =>
    ({ ...item, effects: [trait, ...traits].filter(Boolean) })))), [
    'id', 'name', 'slot', ['weaponClass', '兵刃类别', (id) => weaponClass[id] ?? id],
    ['hands', '用几只手'], ['brace', '主动架重招减伤'],
    ['chargeRequired', '蓄力与出招共占两回合'], ['chargePierce', '主武器完成蓄力时穿甲'],
    ['sideAtk', '副武器出手攻击修正'], ['sidePierce', '副武器出手穿甲'], ['sideGuard', '副武器出手护持'],
    ['ammo', '适用弹药', (ids) => ids.map(ref).join('、')],
    'tier', tier, 'atk', 'def', ['hp', '气血上限修正'], ['qi', '真气上限修正'], ['perception', '洞察加成'],
    'retreat', 'durability', 'repair', ['entry', '玩家主动查读的词条'], ['effects', '特殊作用与具体数值', (entries) => entries.map(traitText).join('、')],
    ['field', '野外作用', (field) => [
      field.fogTolerance && '开始耗气的雾压上限 +' + field.fogTolerance,
      field.gatherPadding && '每批采集减伤 ' + field.gatherPadding + '，至少受 1 点伤',
      field.roadSatiety && '鸣沙境内普通步行耗粮 −' + (field.roadSatiety.fraction * 100) + '%',
    ].filter(Boolean).join('、')],
  ], { note: '装备耐久为 0 后失去战斗加成。双手兵刃与副手互斥。盾主动挡重招并确实缓冲时损耗耐久。反伤须承受相应近战的气血损伤并能继续交手。脱身 0.17 表示有空当时加 17 个百分点。' }),
  table('weapon-acquisition', '武器获取渠道', acquisitionRows, [
    'id', ['weapon', '武器'], ['method', '获得方法'], ['source', '具体来源'], ['price', '单次成本（灵钱）'],
    'need', ['afterFight', '现场领取前需击败', ref], ['interval', '货源或对手恢复间隔（天）'],
    ['repeatable', '可重复获取'], ['afterQuest', '供货前置', ref],
  ], { note: '胜后另行领取的物件来自事先约定的奖品或实际可查看的位置。交手结算只给身体材料。' }),
  table('ammunition', '弹药与命中效果', described(data.ammunition ?? []), [
    'id', 'name', ['atk', '每发攻击修正'], ['pierce', '每发基础穿甲'], ['trait', '适用目标与加成', traitText],
  ], { note: '远射和借远兵的术诀每次实际出手扣 1 发。缺弹时普通出手改为徒手，换兵刃会经过一回合。' }),
  table('inner-styles', '内功来源、每重效果与修习费用', gated(innerStyleRanks), [
    'id', 'name', ['grade', '品阶'], ['source', '获得途径'],
    ['rank', '重数'], ['maxRank', '最高重数'], 'tier', tier, ['cost', '灵钱'], 'need', 'days',
    ['specialty', '专攻兵刃', (types) => types.map((type) => weaponClass[type]).join('、')],
    ['atk', '通用攻击'], ['hp', '气血上限'], ['def', '防御'], ['qi', '真气上限'], ['perception', '洞察'],
    ['restQi', '每半日额外回气'], ['fogTolerance', '雾压承受加值'], ['breathingQi', '双守势额外回气'],
    ['retreat', '脱身概率加成', percent], ['dodge', '被动闪避值', percent], ['evadeQi', '闪避成功回气'],
    ['focusAtk', '专攻额外攻击'], ['focusPierce', '专攻穿甲'], ['focusGuard', '专攻护持'],
    ['fistName', '蓄力拳'], ['fistPower', '蓄力拳出手攻击加值'], ['fistPierce', '蓄力拳额外穿甲'],
    ['fistQi', '蓄力拳出手耗气'], ['effect', '词条说明'],
  ], { note: '一次只运转一本。基础效果与同一招实际所用兵刃的专攻同时生效。同本历重用当前重数的整行，数值不逐重累加。运转必须带在行囊里。' }),
  table('foods', '口粮与料理', foodRows, [
    'id', 'name', ['grade', '料理档次'], ['satiety', '食用恢复饱腹'], ['hp', '食用恢复气血'],
    ['level', '备粮灶等级'], 'need', 'count', ['cost', '每批费用（灵钱）'], 'days',
  ], { note: '生兽肉须带回备粮灶。恢复值按角色当下上限封顶。干粮也可向摊主买，备粮灶的两种干粮制法列于后院项目。' }),
  table('pills', '丹药', gated(described(data.pills.map((pill) => ({ satiety: 0, ...pill })))), [
    'id', 'name', 'tier', tier, ['hp', '气血变化'], ['qi', '真气变化'], ['satiety', '食用恢复饱腹'], 'toxin', 'wound', 'focus',
  ], { note: '暖谷丸吃下后直接补饱腹，饱腹按上限封顶。筑基丹用于突破，实际制作配方和各阶段成本见筑基丹访查及制作用方。' }),
  table('alchemy-formulas', '丹方与取得方式', alchemyFormulae, [
    'id', 'name', 'result', ['recipe', '制法标识'], ['source', '来源'], ['price', '丹方买价（灵钱）'],
    ['reveal', '丹师愿出示前提', ref], 'need',
  ]),
  table('foundation-inquiry', '筑基丹访查', alchemyData.inquiry, [
    'id', ['label', '步骤'], ['price', '费用（灵钱）'], 'days', 'tier', ['proof', '需带回的实物', ref],
    ['defeated', '需胜过的对手', ref], 'reward', 'text', ['reply', '交付结果'], ['progress', '离村前一站提示'],
  ], { note: '依序完成。合方后仍须用炼丹炉投料、等待并领取筑基丹。' }),
  table('talismans', '符箓', gated(described(data.talismans)), [
    'id', 'name', 'tier', tier, 'damage', 'guard', 'retreat',
  ]),
  table('arts', '术法', gated(data.arts), [
    'id', 'name', 'tier', tier, ['cost', '施术耗气'], 'power', 'pierce', 'guard', 'break', ['price', '学习费用（灵钱）'], 'reveal', 'desc',
    ['weaponBased', '借兵刃施展'],
  ]),
  table('recipes', '制作用方', gated(data.recipes), [
    'id', 'result', 'count', 'tier', tier, ['cost', '制作费用（灵钱）'], 'need', 'days', 'reveal',
    ['requiresShownHide', '需给工匠看过兽革'], ['formula', '所需丹方', ref],
    ['facility', '生产设施', facilityRef], ['facilityLevel', '设施最低等级'],
  ]),
  table('regions', '三州大地图点位', gated(regionRows), [
    'id', 'name', ['province', '州', ref], ['x', '横坐标'], ['y', '纵坐标'], ['links', '标定邻路', (ids) => ids.map(ref).join('、')],
    ['town', '定居点类型'], ['portal', '有普通传送门'], ['array', '有州阵'], ['tier', '威胁参考阶'], ['realmName', '威胁参考境界'], 'travel', 'reveal', 'desc',
  ], { omit: ['draws', 'food'], note: '图上显示已知道的点。实际可走路线、要花的时间和道具限制由引擎按所在点结算。威胁标记只用于内容参考。' }),
  table('world-transport', '长程道路、传送门与卷轴', transportRows, [
    ['label', '交通'], ['a', '起点', ref], ['b', '终点', ref], 'price', 'days', ['item', '道具或凭证', ref], ['quest', '另一路由', ref], ['reason', '使用条件'],
  ]),
  table('roads', '实际路段、距离和拦路概率', roadRows, [
    ['from', '一端', ref], ['to', '另一端', ref], ['mode', '路段类型'], 'label', ['units', '路格'], ['distance', '里程（里）'],
    'days', ['chance', '满员时每完整路格的基础拦路概率', percent], ['crew', '管这片路的团伙'], ['open', '启用条件'], ['riskText', '路边所见'],
  ], { note: '一个完整路格为 2 里、0.25 日。短半格按距离比例判定。已知且可走的路按里程选最短；零概率路段、渡船、传送门、卷轴与州阵不会掷拦路签。' }),
  table('bandit-crews', '强盗团伙和常驻人数', crewRows, [
    'id', 'name', ['roads', '共享当场人数的路段'], ['count', '初始外出人数'],
    ['members', '炼气初期至金丹后期各小境人数', (counts) => counts.join(' / ')],
    ['hideout', '据点位置'], ['baseRegion', '所处区域', ref], ['den', '可进的藏身处', siteRef],
    ['inside', '寨内人数'], ['minFactor', '寨内守卫清空后的路段概率倍率', percent],
    ['delay', '首个空缺补员用时（日）'], ['interval', '之后补一人用时（日）'],
    ['leaderlessDelay', '首领败退后首个空缺等待（日）'], ['leaderlessInterval', '首领败退后补一人用时（日）'],
  ], { note: '进不了的窝也有实际名单。管辖路每步先乘剩余人数比例，可进山寨按当下活跃守卫再另乘一项。寨主被击败后，巡路倍率上限为 55%。' }),
  table('bandit-pools', '拦路要价、财物和装备', gated(data.roadBandits.pools), [
    'tier', tier, ['enemy', '对手', ref], ['fee', '索要灵钱范围', banditRanges], ['cash', '一般胜后灵钱范围', banditRanges],
    ['richChance', '富裕成员概率', percent], ['richCash', '富裕成员灵钱范围', banditRanges],
    ['gear', '一般成员装备及权重', rollList], ['richGear', '富裕成员装备及权重', rollList],
  ], { note: '一般与富裕成员分别有 24% 和 75% 的概率带一件可缴装备。款物随本局的成员固定；玩家已持有或占用同名装备时，该件无第二份。' }),
  table('bandit-stories', '拦路人物与一次性结局', fixedBanditRows, [
    'id', ['a', '通常出现的一端', ref], ['b', '通常出现的另一端', ref], ['crew', '提前遇见的计数范围'],
    ['forceAt', '未解决时保底遭遇'], ['chance', '普通遇见后转为此人的概率', percent], 'enemy', ['fee', '开价（灵钱）'],
    ['intro', '初遇场景'], ['action', '动作标识'], 'label', 'desc', 'need', 'loot', ['revealSite', '可发现的藏身处', siteRef], ['outcome', '结果'],
  ]),
  table('world-arrays', '州阵修复', arrayRows, ['region', ['province', '州', ref], ['coins', '总需灵钱'], 'need'],
    { note: '可分批交钱和材料。两端全部修通即可通行。修好后传送时另计路费。' }),
  table('settlement-goods', '各定居点本地买进货单', localOfferRows, ['region', 'id', 'name', 'price', ['start', '初始存货'], ['cap', '存货上限'], ['interval', '补货间隔（天）'], ['growth', '每次补货量']],
    { note: '未标每次补货数量时为一件。落灯村的具名货架另见坊市货单。' }),
  table('settlement-buyback', '各定居点收购价与常价收量', localSaleRows, ['region', 'id', 'name', ['price', '常价（每件）'],
    ['reserve', '当期超量价（每件）'], ['capacity', '常价收满件数'], ['replenished', '每期恢复件数'], ['days', '恢复间隔（日）']],
    { note: '关键物品、装备中的物品与救济干粮的收取限制另行校验。旧坊市专门商人的实际报价见对应表。' }),
  table('settlement-repairs', '接修地点与逐件工钱', localRepairRows,
    ['region', ['service', '修具处'], 'id', 'name', ['surcharge', '异地加价（灵钱）'], ['price', '修满费用（灵钱）']],
    { note: '只接修玩家随身或穿在身上的装备。报价按件，支付灵钱后立即修满。' }),
  table('regional-incidents', '地方灾情与善后', Object.entries(hazardData.jobs).map(([id, job]) => ({
    id, name: incidentJobNames[id], days: job.days, need: job.need, pay: job.reward,
    warning: id === 'report' ? hazardData.warningDays : undefined,
    surge: id === 'report' ? hazardData.surgeDays : undefined,
  })), ['id', 'name', 'days', 'need', ['pay', '结工钱时获得（灵钱）'], ['warning', '示警期（游戏日）'], ['surge', '兽群经过（游戏日）']],
  { note: '拿到兽迹后向炭篷驿报信才开始计时。兽潮可提前疏水结束，没赶上也能在事后回驿站看现场。工钱仅按实际完成的动作结一次。' }),
  table('market-talk', '摊上的线索', marketTalkRows, ['region', ['label', '交谈动作'], ['lead', '交付的线索', ref], ['outcome', '摊主所说']]),
  table('sect-admission', '宗门和入门物资', data.sects.map(({ jobs, ranks, join, ...sect }) => ({ ...sect, ...join })), ['region', 'id', 'name', 'desc', 'need', ['coins', '入门灵钱']]),
  table('sect-jobs', '宗门差事', sectJobs, ['region', ['sect', '宗门'], 'id', 'name', 'desc', 'need', 'reward', ['coins', '灵钱报酬'], ['credit', '增加功劳'],
    ['afterQuests', '做完任一委托后出现', (ids) => ids.map(ref).join('、')], 'days', ['cooldown', '下一单间隔（天）']]),
  table('sect-awards', '宗门功劳与回报', sectRanks, ['region', ['sect', '宗门'], 'name', ['credit', '功劳门槛'], 'reward', ['art', '传授术诀', ref]]),
  table('tournament', '守尺观大比', matchRows, ['region', ['order', '场次'], 'name', 'enemy', ['lead', '认得赛帖的证物', ref],
    ['fee', '每届报名费'], 'days', ['cooldown', '下次报名间隔（天）'], ['note', '对手介绍']],
    { note: '各轮均由裁判护场。散修也可报名，符合领取条件的奖品可稍后领。' }),
  table('tournament-prizes', '会比名次回礼', tournamentPrizes, [['wins', '胜场'], 'name', 'reward', ['art', '授予术诀', ref]]),
  table('training', '修习项目、每阶成本和战力效果', trainingRows, [
    'id', 'name', ['level', '阶次'], 'region', ['teacher', '传授人物'], ['lead', '发现所需线索', ref], 'need', ['coins', '灵钱'], 'days', ['effect', '本阶效果'],
    ['hp', '气血上限加成'], ['def', '防御加成'], ['qi', '真气上限加成'], ['restQi', '歇息额外真气'],
    ['sealDamage', '符伤加成'], ['sealGuard', '符护加成'], ['element', '对应五行单项增量'], ['senseMax', '神识上限'], ['senseGuard', '读势减伤'],
  ], { note: '同一修习的各阶段效果不叠加，以当前最高一阶为准。消费当前一级所列材料和时间。当地导师才可升级。' }),
  table('region-encounters', '地区内的可选地点', data.sites, [
    'region', 'id', 'name', ['protectedArena', '是否约定保护性切磋'],
    ['afterChoices', '发现路线的具体动作', (keys) => keys.map(describeChoice).join('、')],
    'reveal', ['once', '一次性选项序号', (indexes) => indexes.map((index) => index + 1).join('、')],
    ['emptyText', '地点耗尽时可见情形'], ['afterOnceText', '一次性行动后的场景'],
    ['afterWinText', '当地胜利后的场景', (entries) => Object.entries(entries).map(([id, text]) => `${ref(id)}：${text}`).join('、')],
    ['stockText', '依各处资源存量出现的景象'], ['choiceText', '可同时出现的行动前后景象'],
    ['creatureText', '动物存在或耗尽时的景象'], ['ebbText', '退水及涨水景象'],
  ], { omit: ['stocks', 'creatures'], note: '发现条件为空即是入境可见的地标。隐蔽地点需遇到相应的指路、岔路或物证。发现后会持续显示。' }),
  table('world-regrowth', '各地点库存与种群', worldPools, [
    ['site', '地点', siteRef], ['kind', '类型', valueText], ['object', '资源或敌人', ref],
    ['poolId', '存量标识'], ['label', '现场存量名称'],
    ['start', '初始量'], ['cap', '上限'], ['interval', '基准恢复间隔（游戏日）'], ['growth', '每次恢复'], ['curve', '种群回补规律', curveText],
    ['depletedFactor', '耗空后首次恢复用时倍率'],
    ['fixedPopulation', '按指定班期和人数回补'],
    ['choices', '消耗此资源的选项序号', (indexes) => indexes.map((index) => index + 1).join('、')],
  ], { note: '恢复间隔或恢复量为 0 时不回补。部分野生种群的非零存量回补间隔随密度调整，系数为 0.8 + 2.4 ×（存量／上限 − 0.5）²。曲线种群和清场点看守从最后一只落败时起按基准间隔和耗空倍率计首只。只有击败当场对手才减少该地点种群。' }),
  table('guarded-sites', '守护采集、途中伏击与胜后领取', guardedChoices, [
    ['region', '地区', ref], ['site', '地点', siteRef], ['actor', '对手', ref], ['action', '现场动作'],
    ['condition', '放行条件'], ['ambush', '有活跃对手时每批触发几率', percent], ['loot', '一批或一次所得'], ['stocks', '物品池'],
    ['start', '第1日对手数量'], ['cap', '对手上限'], ['interval', '基准补充间隔（游戏日）'], ['growth', '每次补充数量'], ['curve', '种群回补规律', curveText],
    ['firstReturn', '清场后首只回归（游戏日）'], ['revisit', '再访条件'],
  ], { note: '对手数量和物品库存分别变化。伏击在每批开始前判定，遭遇后尚未开始的一批留在原处。胜后领取类使用条件列，回归天数仅用于清场和伏击采集点。' }),
  table('events', '事件正文', data.events, ['id', 'name', 'revisit', 'text'], {
    omit: ['choices', 'experiment'],
    note: '每个事件对应一个可选地点。回到地点后可看到之前行动留下的变化，满足条件的隐藏选项才显示。'
  }),
  table('event-choices', '事件选项', choices, [
    ['event', '事件标识'], ['eventName', '事件名称'], ['order', '选项序号'], 'label', 'days',
    ['coins', '灵钱变化'], ['hp', '气血变化'], ['qi', '真气变化'], ['insight', '首次选中所得修为'],
    'need', 'consume', 'hidden', 'loot', 'enemy', ['openingRange', '远处开战，可先发一箭'], ['afterChoice', '先做同一地点的选项序号', (index) => index + 1],
    ['afterVisitChoice', '此前做过的同地点选项序号', (index) => index + 1],
    ['encounter', '抽取的当地种群', (ids) => ids.map(ref).join('、')],
    ['encounterWeights', '此进路不同对手的权重', (values) => Object.entries(values).map(([id, weight]) => `${ref(id)}×${weight}`).join('、')],
    ['afterFight', '现场选项需先击败', ref], ['perWin', '每次胜利才可再次领取'],
    ['guardedBy', '在场会挡住选择的对手', (ids) => [].concat(ids).map(ref).join('、')],
    ['excludesChoices', '与同一地点这些选项互斥', (indexes) => indexes.map((index) => index + 1).join('、')],
    ['excludedReason', '互斥时告诉玩家的缘由'], ['hideWhenExcluded', '互斥时隐藏此选项'],
    ['ambush', '有对手时每批采集伏击', ({ enemy, chance }) => `${ref(enemy)} · ${percent(chance)}`],
    ['phase', '昼夜要求', (phase) => phase === 'night' ? '入夜后' : phase], ['phaseReason', '未到时的提示'],
    ['ebbOnly', '须在退水期间做完'], ['fieldTool', '副手须持完好采集工具', ref], ['cooldown', '完成后复做间隔（游戏日）'],
    ['cooldownText', '复做间隔的现场说明'],
    ['stay', '执行后留在原地'],
    ['desc', '选前可见内容'], ['outcome', '执行后结果'], ['injury', '执行后受伤原因'],
  ], { omit: ['food'], note: '采集类选项的用时、伤害及产量按一批编排。每点一次、完成一批，所得先放在当前具体地点。标为消耗所需物品时会扣除该列物品。受伤、战斗和实际所得只在行动后报告。' }),
  table('mechanisms', '现场机关与试错', mechanismRows, [
    'id', ['site', '现场', siteRef], ['title', '机关'], ['mode', '形式'], 'desc', ['lead', '实际需携带的线索物', ref], ['leadText', '线索内容'],
    ['moves', '可操作的部件'], ['dials', '实际状态'], ['solution', '开发验收用解法'], ['miss', '误试结果'], ['damage', '误试气血伤害'], ['fatal', '误试是否直接倒下'], ['resetOnMiss', '误试后机关是否复位'], 'reward', ['success', '解开的结果'],
  ]),
  table('basket', '药篓物件操作', basketOptions, [
    ['action', '操作'], 'days', ['spent', '消耗物件', resources], 'loot', ['note', '执行后反馈'],
  ], { note: '查看保留药篓。带回后可交还药僮，完整交还和拆篓取物互相排斥。交付奖励见委托表。' }),
  table('enemies', '敌人', enemyRows, [
    'id', 'name', ['tier', '敌方境界'], tier, 'hp', ['atk', '基础攻击'], ['normalHits', '普攻扣防前伤害'],
    'def', ['perception', '洞察'], ['accuracy', '命中值', percent], ['dodge', '被动闪避值', percent],
    ['escapeChance', '未被进攻时基础脱身概率', percent],
    ['innerStyleName', '使用内功'], ['manualGuard', '内功兵刃专攻护持'], ['manualPierce', '内功兵刃专攻穿甲'],
    ['strategy', '交手策略', (id) => ({
      instinct: '本能', predator: '抢攻', bulwark: '守中求进', duelist: '见招拆招', schemer: '耗气与破势',
    })[id] ?? id], ['medicine', '单场携带补药', ({ id, count }) => `${ref(id)}×${count}`],
    ['tags', '装备克制标签'], ['sparring', '仅在护场地结算切磋'], ['insight', '首胜修为'],
    ['loot', '固定解取的身体掉落', resources], ['chanceLoot', '概率额外掉落', formatChanceLoot], 'desc',
  ], { omit: ['intents'], note: '普攻取所列攻击乘招式倍率后向上取整。攻击等基础值已经算入敌方内功，出招专攻护持另列，差距至少三小境时另有压制。概率掉落与固定掉落分别结算。' }),
  table('enemy-intents', '敌人回合意图', intents, [
    ['enemyId', '敌人标识'], ['enemyName', '敌人名称'], ['order', '常用动作序号'], 'name', 'kind', 'mult', ['ranged', '远程出手'],
  ], { note: '普通妖兽大多按这些习性出招。人物和部分大妖用自己承受过的伤害估计威胁。抽中洞察后能看到玩家这回合动作的类别。攻势倍率修正基础攻击，防御意图倍率用于计算敌方防御。' }),
  table('quests', '委托', gated(data.quests), [
    'id', 'name', 'region', ['tier', '标注境界'], tier, 'reveal', ['afterQuest', '展示前置委托', ref], ['requireQuest', '交付前置委托', ref], ['waitForQuest', '等待交付时的人物对话'], 'desc', 'need', 'reward', ['learnArts', '当面传授的术诀', (ids) => ids.map(ref).join('、')], ['coins', '奖励灵钱'], ['insight', '奖励修为'], ['requiresKnownMaterials', '展示需要认识材料'], ['outcome', '交付后人物或事件反馈'],
  ], { note: '先发现委托入口，材料认知默认有要求。' }),
  table('services', '村务发现条件', data.services, [
    'id', 'name', ['public', '开局已有入口'], ['items', '获得任一材料或线索', (items) => items.map(ref).join('、')],
    ['choices', '完成任一事件选项', (keys) => keys.map(describeChoice).join('、')],
  ], {
    note: '公开村务开局即可办理。其他入口在满足表中的任一条件后记住，回村即可使用。具体人物仍需实际接触。'
  }),
  table('deductions', '沙盘疑点', gated(deductions), [
    'id', 'name', 'tier', tier, 'reveal', 'desc',
  ], {
    note: '玩家写下自己的猜想，可选携带的物件作参考。沙盘本身不判定猜想，也不会发放奖励。'
  }),
  table('field-experiments', '现场验证与发现', experiments, [
    ['id', '沙盘疑点', ref], ['site', '验证地点', siteRef], ['desc', '现场观察'], 'need',
    ['days', '每次尝试用时（天）'], 'reward', ['learnArts', '现场学会术诀', (ids) => ids.map(ref).join('、')],
    ['insight', '成功所得修为'], ['outcome', '验证后的观察'],
  ], {
    omit: ['controls', 'solution', 'misses'],
    note: '**剧透。** 此表列出各处验证的现场条件和奖励。持有现场能用到的物件并带着猜想才能尝试。结论由操作结果成立后获得。'
  }),
  table('experiment-controls', '现场操作与观察结果', experimentOptions, [
    ['deductionId', '沙盘疑点', ref], ['site', '验证地点', siteRef],
    ['control', '操作标识'], ['controlLabel', '操作名称'], ['id', '设定标识'], ['label', '现场设定'],
    ['producesResult', '验证成立所用位置或时机'], ['observation', '此设定的现场反馈'],
  ], {
    note: '**剧透。** 每处验证由多项实际操作共同决定。失败只显示一项可在现场察觉的反应。'
  }),
  table('rules', '通用规则参数', ruleRows, ['id', 'value', 'desc'], {
    note: '村内休整会清空野外探索压力，回村也会清空。修为来自首次探索某个地区、首次选择指定选项、首次击败对应敌人、静修、委托和现场验证。'
  }),
  table('starting-state', '开局状态与完成条件', startState, ['id', 'name', 'value'],
    { note: '交付结束委托记录当时所用天数并显示结算，之后可继续探索。' }),
  table('starting-items', '开局行囊', initialItems, ['id', 'name', 'count'],
    { note: '已穿戴的装备也在行囊中。' }),
  table('starting-gear', '开局穿戴', initialGear, ['slot', 'id', 'name', ['durability', '初始耐久']]),
  table('starting-arts', '开局术法', initialArts, ['id', 'name']),
];

function csvCell(value) {
  const text = String(value ?? '');
  return /[,"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function markdownCell(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
}

function markdownTable({ heading, note, values }) {
  const [header, ...rows] = values;
  const line = (row) => `| ${row.map(markdownCell).join(' | ')} |`;
  return [
    `## ${heading}`, '', ...(note ? [note, ''] : []),
    line(header), line(header.map(() => '---')), ...rows.map(line),
  ].join('\n');
}

await mkdir(output, { recursive: true });
const introduction = [
  '# 《雾渡山河》数值与内容表',
  '',
  '**剧透。** 此页包含完整地图、线索、委托、遭遇及现场验证的成立条件。首次游玩可以直接从落灯村出发。',
  '',
  '由游戏数据和规则自动生成。同目录 CSV 使用 UTF-8 和字节顺序标记，可直接导入表格软件。空白单元格表示该字段未设置，数字 0 表示明确设为零。',
  '',
  '修改项目中的游戏数据后，在项目根目录运行 `npm run tables` 即可重新导出。',
].join('\n');
await Promise.all([
  writeFile(resolve(output, 'README.md'), [introduction, ...tables.map(markdownTable)].join('\n\n') + '\n', 'utf8'),
  ...tables.map(({ file, values }) => writeFile(
    resolve(output, `${file}.csv`),
    `\uFEFF${values.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`,
    'utf8',
  )),
]);
