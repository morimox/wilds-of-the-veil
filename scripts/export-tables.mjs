import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import data from '../data.mjs';
import { createGame, rules } from '../engine.mjs';
import { economyData } from '../economy.mjs';
import { alchemyData } from '../alchemy.mjs';

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
  retreat: '脱身减伤加成', durability: '最大耐久', repair: '修理费（灵钱）',
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
  harvestEncounterDays: '采集中遭遇伏击时开打前用时（天）',
  retreatDays: '撤出战斗所需用时（天）',
  retreatDamageFactor: '脱身时先乘此值，再计算减伤和防御',
  emptyReturnDays: '空腹返村额外用时（天）',
  waitDays: '主动等候一次的游戏天数',
  maxSatiety: '饱腹度上限',
  satietyDrainPerDay: '每游戏日消耗的饱腹度',
  rationSatiety: '每份普通干粮恢复的饱腹度',
  emptyAttackMultiplier: '空腹交手时对普通与兵刃术诀出伤的倍率',
  unpackBasketDays: '拆开药篓所用的游戏天数',
  guardBonus: '主动格挡增加的防御（点）',
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
};

const name = (id) => names.get(id) ?? id;
const ref = (id) => names.has(id) ? `${name(id)}（${id}）` : id;
const resources = (entries = {}) => Object.entries(entries)
  .map(([id, count]) => `${ref(id)}×${count}`).join('、');
const realm = (id) => data.realms.find((entry) => entry.id === id)?.name ?? id;
const knownKinds = {
  gear: '装备', material: '材料', food: '口粮', object: '任务实物', pill: '丹药', talisman: '符箓', key: '线索', ammo: '弹药',
  attack: '普通攻势', heavy: '重招', guard: '防御', drain: '吸取真气', heal: '恢复',
};
const slotNames = { weapon: '武器', armor: '护具', charm: '饰物' };
const reveal = ({ item, quest } = {}) => [
  item && `得知物品 ${ref(item)}`,
  quest && `完成委托 ${ref(quest)}`,
].filter(Boolean).join(' 或 ');
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
const guardedChoices = choices.filter(({ guardedBy, afterFight, ambush }) => guardedBy || afterFight || ambush).map((choice) => {
  const site = data.sites.find(({ id }) => id === choice.event);
  const actor = choice.guardedBy ?? choice.ambush?.enemy ?? choice.afterFight;
  const pool = site.creatures[actor];
  const curve = populationCurve(pool);
  const stocks = Object.entries(site.stocks ?? {}).filter(([, stock]) => stock.choices.includes(choice.order - 1))
    .map(([id, stock]) => stockDetails(id, stock));
  const finite = stocks.length > 0 && stocks.every(({ interval, growth }) => !interval || !growth);
  const clearDelayApplies = choice.guardedBy || (choice.ambush && curve === 'wild');
  let condition;
  let revisit;
  if (choice.guardedBy) {
    condition = curve === 'none' ? '击败看守后永久开放' : '清除本地全部看守';
    revisit = curve === 'none' ? '取胜后有余料即可直接采，库存单独回生' :
      finite ? '有余料且看守回来时须再清场，采尽后不再补充' : '看守回来才须再清场，库存单独回生';
  } else if (choice.ambush) {
    condition = '可直接采，活跃对手可能打断每批采集';
    revisit = '回补后仍可直接采，有对手在场时每批可能遭遇';
  } else if (choice.perWin) {
    condition = '每次获胜解锁本班奖品';
    revisit = '换班后再胜可领取下一班奖品';
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
  ({ damage: '额外伤害', pierce: '额外穿甲', guard: '额外护持' })[trait.kind] ?? trait.kind,
  trait.enemyTag && `敌人标签 ${trait.enemyTag}`,
  trait.intent && (knownKinds[trait.intent] ?? trait.intent),
  `加成 ${trait.bonus}`,
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
const weaponClass = { staff: '杖', blade: '刀', sword: '剑', spear: '长兵', axe: '斧', bow: '弓', crossbow: '弩' };
const offeredItems = new Set(marketOffers.map(({ id }) => id));
const itemTradeRows = data.items.map((item) => ({ ...item, price: offeredItems.has(item.id) ? item.price : 0 }));
const acquisitionRows = data.gear.filter(({ slot }) => slot === 'weapon').flatMap(({ id }) => [
  ...(Object.values(data.starting.gear).includes(id) ? [{ id, method: '初始装备' }] : []),
  ...marketOffers.filter((offer) => offer.id === id).map((offer) => ({
    id, method: '坊市', source: offer.stallName, price: offer.price, interval: offer.interval, afterQuest: offer.afterQuest,
    repeatable: offer.cap === undefined || offer.growth > 0,
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
const stapleRows = ['wood', 'reed', 'hide', 'ore', 'core', 'black_iron', 'kiln_clay', 'beast_meat', 'qi_core', 'foundation_core', 'beast_eye'].map((id) => ({
  id, name: name(id),
  pools: worldPools.filter((pool) => pool.kind === '资源' && pool.object === id && pool.growth > 0)
    .map(({ site, label }) => label ? `${siteRef(site)} · ${label}` : siteRef(site)).join('、'),
  enemySources: data.enemies.filter((enemy) => enemy.loot?.[id]).map((enemy) => enemy.name).join('、'),
  recipes: data.recipes.filter(({ need }) => need?.[id]).length,
  facilities: facilityLevels.filter(({ need }) => need?.[id]).length,
  projects: economyData.projects.filter(({ need }) => need?.[id]).length,
  exchanges: choices.filter(({ consume, need }) => consume && need?.[id]).length,
  breakthrough: data.realms.filter(({ need }) => need?.[id]).length,
}));
const alchemyFormulae = data.recipes.filter(({ formula }) => formula).map((recipe) => {
  const offer = alchemyData.offers.find(({ id }) => id === recipe.formula);
  const step = alchemyData.inquiry.find(({ reward }) => reward?.[recipe.formula]);
  const found = choices.filter(({ loot }) => loot?.[recipe.formula]);
  const handins = data.quests.filter(({ reward }) => reward?.[recipe.formula]).map(({ name }) => name);
  return { id: recipe.formula, name: name(recipe.formula), result: recipe.result, recipe: recipe.id, need: recipe.need,
    source: offer ? alchemyData.town.name : step?.label ?? [...found.map(({ event, order }) => describeChoice(`${event}:${order - 1}`)), ...handins].join('、'),
    price: offer?.price, reveal: offer?.reveal };
});
const ruleRows = Object.entries({ ...data.rules, ...rules })
  .map(([id, value]) => ({ id, value, desc: ruleDescriptions[id] ?? '' }));
ruleRows.push(
  { id: 'setupDays', value: economyData.setupDays, desc: '每次开启生产的操作耗时（日）' },
  { id: 'collectDays', value: economyData.collectDays, desc: '每次领取成品的操作耗时（日）' },
);
const normalHit = (enemy) => [...new Set(enemy.intents.filter(({ kind }) => kind === 'attack')
  .map(({ mult }) => Math.ceil(enemy.atk * (mult ?? 1))))].join(' / ');
const enemyRows = gated(data.enemies.map((enemy) => ({ ...enemy, normalHits: normalHit(enemy) })));
const foodRows = described(data.foods).map((meal) => {
  const project = meal.grade > 0 ? economyData.projects.find((row) => row.loot?.[meal.id]) : undefined;
  return { ...meal, need: project?.need, level: project?.level, cost: project?.cost, days: project?.days, count: project?.loot[meal.id] };
});

const tables = [
  table('realms', '境界与突破', data.realms, [
    'id', 'name', ['hp', '基础气血'], ['qi', '基础真气'], ['atk', '基础攻击'], ['def', '基础防御'],
    ['insight', '突破所需修为'], ['practice', '本境有效历练日'], ['cost', '突破费用（灵钱）'], 'need',
    ['requireQuest', '所需世界进程', ref], ['requireDefeated', '须亲自击败的对手', (ids) => ids.map(ref).join('、')],
    ['pressure', '越过本境的出伤倍率'], 'days',
  ], { note: '出伤倍率用于向更高境界进攻。相隔两境时，两档倍率连乘。' }),
  table('items', '物品与交易', itemTradeRows, ['id', 'name', 'kind', 'price', 'sell', 'desc'],
    { note: '价格为 0 表示无对应买卖渠道。买入的货源与到货条件见坊市货单。卖出按手中符合规则的物件结算。' }),
  table('common-materials', '常用原料跨系统用途', stapleRows, [
    'id', 'name', ['pools', '可回生的现场'], ['enemySources', '解取的对手'],
    ['recipes', '用到的配方数'], ['projects', '用到的后院项目数'], ['facilities', '用到的设施升级数'],
    ['exchanges', '野外交付选择数'], ['breakthrough', '直接用于突破的境数'],
  ]),
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
  ], { note: '起始仓库已经可用。等级 0 的生产设施需要先搭建。生产工位数与等级相等，仓库单列实际格数。' }),
  table('yard-projects', '后院种植与备粮', economyData.projects, [
    'id', 'name', ['facility', '使用设施', facilityRef], ['level', '所需设施等级'],
    'need', 'loot', ['cost', '费用（灵钱）'], ['days', '等待成熟天数'],
    ['reveal', '来源线索', ref], ['description', '现场说明'],
  ], { note: '炼丹和锻造的批次产量与投入见制作用方。操作后世界时间继续走，成熟后需要当面收取。' }),
  table('gear', '装备', gated(described(data.gear)), [
    'id', 'name', 'slot', ['weaponClass', '兵刃类别', (id) => weaponClass[id] ?? id],
    ['ammo', '适用弹药', (ids) => ids.map(ref).join('、')],
    'tier', tier, 'atk', 'def', ['hp', '气血上限修正'], ['qi', '真气上限修正'],
    'retreat', 'durability', 'repair', ['entry', '玩家主动查读的词条'], ['trait', '特殊作用与具体数值', traitText],
  ], { note: '装备耐久为 0 后失去加成。脱身加成为伤害减免系数，0.17 即减免 17%。' }),
  table('weapon-acquisition', '武器获取渠道', acquisitionRows, [
    'id', ['weapon', '武器'], ['method', '获得方法'], ['source', '具体来源'], ['price', '单次成本（灵钱）'],
    'need', ['afterFight', '现场领取前需击败', ref], ['interval', '货源或对手恢复间隔（天）'],
    ['repeatable', '可重复获取'], ['afterQuest', '供货前置', ref],
  ], { note: '胜后另行领取的物件来自事先约定的奖品或实际可查看的位置。交手结算只给身体材料。' }),
  table('ammunition', '弹药与命中效果', described(data.ammunition ?? []), [
    'id', 'name', ['atk', '每发攻击修正'], ['pierce', '每发基础穿甲'], ['trait', '适用目标与加成', traitText],
  ], { note: '远射和借远兵的术诀每次实际出手扣 1 发。缺弹时普通出手改为徒手，换兵刃会经过一回合。' }),
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
  table('regions', '地区', gated(data.regions), [
    'id', 'name', ['tier', '威胁参考阶'], ['realmName', '威胁参考境界'], 'travel', 'reveal', 'hint', 'desc',
  ], { omit: ['draws', 'food'], note: '拿到对应路图或通行信物即可前往。威胁标记只用于内容参考。行走消耗游戏时间和饱腹。' }),
  table('region-encounters', '地区内的可选地点', data.sites, [
    'region', 'id', 'name',
    ['afterChoices', '发现路线的具体动作', (keys) => keys.map(describeChoice).join('、')],
    'reveal', ['once', '一次性选项序号', (indexes) => indexes.map((index) => index + 1).join('、')],
    ['emptyText', '地点耗尽时可见情形'], ['afterOnceText', '一次性行动后的场景'],
    ['afterWinText', '当地胜利后的场景', (entries) => Object.entries(entries).map(([id, text]) => `${ref(id)}：${text}`).join('、')],
    ['creatureText', '动物存在或耗尽时的景象'],
  ], { omit: ['stocks', 'creatures'], note: '发现条件为空即是入境可见的地标。隐蔽地点需遇到相应的指路、岔路或物证。发现后会持续显示。' }),
  table('world-regrowth', '各地点库存与种群', worldPools, [
    ['site', '地点', siteRef], ['kind', '类型', valueText], ['object', '资源或敌人', ref],
    ['poolId', '存量标识'], ['label', '现场存量名称'],
    ['start', '初始量'], ['cap', '上限'], ['interval', '基准恢复间隔（游戏日）'], ['growth', '每次恢复'], ['curve', '种群回补规律', curveText],
    ['depletedFactor', '耗空后首次恢复用时倍率'],
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
    'need', 'consume', 'hidden', 'loot', 'enemy', ['afterFight', '现场选项需先击败', ref], ['perWin', '每次胜利才可再次领取'],
    ['guardedBy', '在场会挡住选择的对手', ref], ['ambush', '有对手时每批采集伏击', ({ enemy, chance }) => `${ref(enemy)} · ${percent(chance)}`],
    ['desc', '选前可见内容'], ['outcome', '执行后结果'], ['injury', '执行后受伤原因'],
  ], { omit: ['food'], note: '采集类选项的用时、伤害及产量按一批编排，指定份数时按所需批次结算。收益先放在原处。标为消耗所需物品时会扣除该列物品。受伤、战斗和实际所得只在行动后报告。' }),
  table('basket', '药篓物件操作', basketOptions, [
    ['action', '操作'], 'days', ['spent', '消耗物件', resources], 'loot', ['note', '执行后反馈'],
  ], { note: '查看保留药篓。带回后可交还药僮，完整交还和拆篓取物互相排斥。交付奖励见委托表。' }),
  table('enemies', '敌人', enemyRows, [
    'id', 'name', ['tier', '敌方境界'], tier, 'hp', ['atk', '基础攻击'], ['normalHits', '普攻扣防前伤害'],
    'def', ['tags', '装备克制标签'], ['insight', '首胜修为'], ['loot', '实际身体掉落', resources], 'desc',
  ], { omit: ['intents'], note: '每个普攻取基础攻击乘招式倍率后向上取整。重招另列于意图表。对手守着的草药、矿物、文书与奖品需要在现场另行取得。' }),
  table('enemy-intents', '敌人回合意图', intents, [
    ['enemyId', '敌人标识'], ['enemyName', '敌人名称'], ['order', '动作序号'], 'name', 'kind', 'mult',
  ], { note: '每场交手从动作 1 开始，按序循环。攻势倍率修正基础攻击，防御意图倍率用于计算敌方防御。' }),
  table('quests', '委托', gated(data.quests), [
    'id', 'name', ['tier', '标注境界'], tier, 'reveal', ['afterQuest', '展示前置委托', ref], ['requireQuest', '交付前置委托', ref], ['waitForQuest', '等待交付时的人物对话'], 'desc', 'need', 'reward', ['coins', '奖励灵钱'], ['insight', '奖励修为'], ['requiresKnownMaterials', '展示需要认识材料'], ['outcome', '交付后人物或事件反馈'],
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
