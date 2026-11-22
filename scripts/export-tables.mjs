import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import data from '../data.mjs';
import { createGame, rules } from '../engine.mjs';

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
  food: '干粮', toxin: '丹毒变化', wound: '消除伤势', focus: '定息层数', damage: '固定伤害',
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
  gear: '装备', material: '材料', food: '口粮', pill: '丹药', talisman: '符箓', key: '线索',
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
  ['victoryQuest', '完成故事的委托', ref(data.victoryQuest)],
].map(([id, name, value]) => ({ id, name, value }));

const siteNames = new Map(data.sites.map(site => [site.id, site.name]));
const siteRef = (id) => `${siteNames.get(id)}（${id}）`;
const worldPools = data.sites.flatMap(site => [
  ...Object.entries(site.stocks ?? {}).map(([id, pool]) => ({ site: site.id, kind: '资源', object: id, ...pool })),
  ...Object.entries(site.creatures ?? {}).map(([id, pool]) => ({ site: site.id, kind: '种群', object: id, ...pool })),
]);
const basketOptions = [
  { action: '查看', note: data.basket.inspect, days: 0 },
  { action: '拆篓', note: data.basket.unpack.outcome, days: rules.unpackBasketDays, loot: data.basket.unpack.loot, spent: { [data.basket.item]: 1 } },
];
const choices = data.events.flatMap(({ id, name, choices }) =>
  choices.map((choice, index) => ({ event: id, eventName: name, order: index + 1, ...choice })));
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
const ruleRows = Object.entries({ ...data.rules, ...rules })
  .map(([id, value]) => ({ id, value, desc: ruleDescriptions[id] ?? '' }));

const tables = [
  table('realms', '境界与突破', data.realms, [
    'id', 'name', ['hp', '基础气血'], ['qi', '基础真气'], ['atk', '基础攻击'], ['def', '基础防御'],
    ['insight', '突破所需修为'], ['cost', '突破费用（灵钱）'], 'need', ['pressure', '越过本境的出伤倍率'], 'days',
  ], { note: '出伤倍率用于向更高境界进攻。相隔两境时，两档倍率连乘。' }),
  table('items', '物品与交易', data.items, ['id', 'name', 'kind', 'price', 'sell', 'desc'],
    { note: '价格为 0 表示没有对应的买入或卖出选项。' }),
  table('gear', '装备', gated(described(data.gear)), [
    'id', 'name', 'slot', 'tier', tier, 'atk', 'def', ['hp', '气血上限修正'], ['qi', '真气上限修正'],
    'retreat', 'durability', 'repair', ['entry', '玩家主动查读的词条'], ['trait', '特殊作用与具体数值', traitText],
  ], { note: '装备耐久为 0 后失去加成。脱身加成为伤害减免系数，0.17 即减免 17%。' }),
  table('pills', '丹药', gated(described(data.pills)), [
    'id', 'name', 'tier', tier, ['hp', '气血变化'], ['qi', '真气变化'], ['food', '获得干粮'], 'toxin', 'wound', 'focus',
  ]),
  table('talismans', '符箓', gated(described(data.talismans)), [
    'id', 'name', 'tier', tier, 'damage', 'guard', 'retreat',
  ]),
  table('arts', '术法', gated(data.arts), [
    'id', 'name', 'tier', tier, ['cost', '施术耗气'], 'power', 'pierce', 'guard', 'break', ['price', '学习费用（灵钱）'], 'reveal', 'desc',
  ]),
  table('recipes', '制作用方', gated(data.recipes), [
    'id', 'result', 'count', 'tier', tier, ['cost', '制作费用（灵钱）'], 'need', 'days', 'reveal',
    ['requiresShownHide', '需给工匠看过泥蜕'],
  ]),
  table('regions', '地区', gated(data.regions), [
    'id', 'name', ['tier', '威胁参考阶'], ['realmName', '威胁参考境界'], 'travel', 'reveal', 'hint', 'desc',
  ], { omit: ['draws', 'food'], note: '拿到对应路图或通行信物即可前往。威胁标记只用于内容参考。行走消耗游戏时间和饱腹。' }),
  table('region-encounters', '地区内的可选地点', data.sites, [
    'region', 'id', 'name',
    ['afterChoices', '发现路线的具体动作', (keys) => keys.map(describeChoice).join('、')],
    'reveal', ['once', '一次性选项序号', (indexes) => indexes.map((index) => index + 1).join('、')],
    ['emptyText', '地点耗尽时可见情形'], ['afterOnceText', '一次性行动后的场景'],
    ['creatureText', '动物存在或耗尽时的景象'],
  ], { omit: ['stocks', 'creatures'], note: '发现条件为空即是入境可见的地标。隐蔽地点需遇到相应的指路、岔路或物证。发现后会持续显示。' }),
  table('world-regrowth', '各地点库存与种群', worldPools, [
    ['site', '地点', siteRef], ['kind', '类型', valueText], ['object', '资源或敌人', ref],
    ['start', '初始量'], ['cap', '上限'], ['interval', '恢复间隔（游戏日）'], ['growth', '每次恢复'],
    ['choices', '消耗此资源的选项序号', (indexes) => indexes.map((index) => index + 1).join('、')],
  ], { note: '经游戏时间恢复到上限。恢复间隔或恢复量为 0 时，现场耗尽后不会重生。只有击败当场对手才减少该地点种群。' }),
  table('events', '事件正文', data.events, ['id', 'name', 'revisit', 'text'], {
    omit: ['choices', 'experiment'],
    note: '每个事件对应一个可选地点。回到地点后可看到之前行动留下的变化，满足条件的隐藏选项才显示。'
  }),
  table('event-choices', '事件选项', choices, [
    ['event', '事件标识'], ['eventName', '事件名称'], ['order', '选项序号'], 'label', 'days',
    ['coins', '灵钱变化'], ['hp', '气血变化'], ['qi', '真气变化'], ['insight', '首次选中所得修为'],
    'need', 'consume', 'hidden', 'loot', 'enemy', ['desc', '选前可见内容'], ['outcome', '执行后结果'], ['injury', '执行后受伤原因'],
  ], { omit: ['food'], note: '标为消耗所需物品时会扣除该列物品。隐藏选项所需物品齐备后才显示。受伤原因、扣血、战斗与所得只在选择后结算。' }),
  table('basket', '药篓物件操作', basketOptions, [
    ['action', '操作'], 'days', ['spent', '消耗物件', resources], 'loot', ['note', '执行后反馈'],
  ], { note: '查看保留药篓。带回后可交还药僮，完整交还和拆篓取物互相排斥。交付奖励见委托表。' }),
  table('enemies', '敌人', gated(data.enemies), [
    'id', 'name', ['tier', '敌方境界'], tier, 'hp', 'atk', 'def', ['tags', '装备克制标签'], ['coins', '战利灵钱'], ['insight', '首胜修为'], 'loot', 'desc',
  ], { omit: ['intents'] }),
  table('enemy-intents', '敌人回合意图', intents, [
    ['enemyId', '敌人标识'], ['enemyName', '敌人名称'], ['order', '动作序号'], 'name', 'kind', 'mult',
  ], { note: '每场交手从动作 1 开始，按序循环。攻势倍率修正基础攻击，防御意图倍率用于计算敌方防御。' }),
  table('quests', '委托', gated(data.quests), [
    'id', 'name', ['tier', '标注境界'], tier, 'reveal', ['afterQuest', '前置委托', ref], 'desc', 'need', 'reward', ['coins', '奖励灵钱'], ['insight', '奖励修为'], ['requiresKnownMaterials', '展示需要认识材料'], ['outcome', '交付后人物或事件反馈'],
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
