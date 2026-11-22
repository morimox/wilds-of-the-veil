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
  returnShortageDays: '回村路上每少带一份干粮额外用时（天）',
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
  ['discovered', '已知地区', initial.discovered.map(ref).join('、')],
  ['victoryQuest', '完成故事的委托', ref(data.victoryQuest)],
].map(([id, name, value]) => ({ id, name, value }));

const drawn = data.regions.flatMap((region) => {
  const total = region.draws.reduce((sum, draw) => sum + Math.max(0, draw.weight), 0);
  return region.draws.map((draw) => ({
    region: region.id, ...draw, eventName: name(draw.event), total,
    chance: total > 0 && draw.weight > 0 ? `${(100 * draw.weight / total).toFixed(2)}%` : '0.00%',
  }));
});
const choices = data.events.flatMap(({ id, name, choices }) =>
  choices.map((choice, index) => ({ event: id, eventName: name, order: index + 1, ...choice })));
const intents = data.enemies.flatMap(({ id, name, intents }) =>
  intents.map((intent, index) => ({ enemyId: id, enemyName: name, order: index + 1, ...intent })));
const deductions = data.deductions ?? [];
const hypotheses = deductions.flatMap((deduction) => deduction.hypotheses.map((hypothesis, index) => ({
  deductionId: deduction.id,
  deductionName: deduction.name,
  order: index + 1,
  ...hypothesis,
})));
const deductionRows = deductions.map((deduction) => ({
  ...deduction,
  answerText: deduction.hypotheses.find(({ id }) => id === deduction.answer)?.label,
}));
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
    'retreat', 'durability', 'repair',
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
  ]),
  table('regions', '地区', gated(data.regions), [
    'id', 'name', 'tier', tier, 'travel', ['food', '行程干粮'], 'reveal', 'hint', 'desc',
  ], { omit: ['draws'], note: '发现去处后，仍需达到对应境界才能前往。发现条件通过线索与委托判定，遇见哪些事件见下表。' }),
  table('region-encounters', '地区遭遇概率', drawn, [
    'region', ['event', '事件标识'], ['eventName', '事件名称'], ['weight', '权重'],
    ['total', '有效总权重'], ['chance', '单次探索概率'],
  ], { note: '每次探索独立抽选，正权重除以该地区有效总权重。百分比显示到小数点后两位，精确值可用权重相除。' }),
  table('events', '事件正文', data.events, ['id', 'name', 'revisit', 'text'], {
    omit: ['choices'],
    note: '已见过的可回查事件，若有满足要求且尚未走过的隐藏选项，当前地区可主动回查。主动回查使用与寻常探索相同的时间与压力。'
  }),
  table('event-choices', '事件选项', choices, [
    ['event', '事件标识'], ['eventName', '事件名称'], ['order', '选项序号'], 'label', 'days', ['food', '消耗干粮'],
    ['coins', '灵钱变化'], ['hp', '气血变化'], ['qi', '真气变化'], ['insight', '首次选中所得修为'],
    'need', 'consume', 'hidden', 'loot', 'enemy', 'desc',
  ], { note: '标为消耗所需物品时会扣除该列物品。隐藏选项所需物品齐备后才显示。' }),
  table('enemies', '敌人', gated(data.enemies), [
    'id', 'name', ['tier', '敌方境界'], tier, 'hp', 'atk', 'def', ['coins', '战利灵钱'], ['insight', '首胜修为'], 'loot', 'desc',
  ], { omit: ['intents'] }),
  table('enemy-intents', '敌人回合意图', intents, [
    ['enemyId', '敌人标识'], ['enemyName', '敌人名称'], ['order', '动作序号'], 'name', 'kind', 'mult',
  ], { note: '每场交手从动作 1 开始，按序循环。攻势倍率修正基础攻击，防御意图倍率用于计算敌方防御。' }),
  table('quests', '委托', gated(data.quests), [
    'id', 'name', ['tier', '标注境界'], tier, 'reveal', 'desc', 'need', 'reward', ['coins', '奖励灵钱'], ['insight', '奖励修为'],
  ]),
  table('deductions', '沙盘推演答案与奖励', gated(deductionRows), [
    'id', 'name', 'tier', tier, 'reveal', 'desc', ['evidence', '所需证物及份数', resources],
    ['answer', '正确解释标识'], ['answerText', '正确解释'], ['days', '单次推演用时（天）'],
    'reward', ['insight', '成功所得修为'], ['miss', '失败反馈'], ['success', '成功反馈'],
  ], {
    omit: ['hypotheses'],
    note: '**剧透。** 此表公开每桩疑案的证物组合、正确解释、结果与奖励。有效提交会消耗时间，证物及数量须与所需组合完全相符。'
  }),
  table('deduction-hypotheses', '沙盘推演的解释候选', hypotheses, [
    ['deductionId', '推演标识'], ['deductionName', '推演名称'], ['order', '候选序号'], ['id', '解释标识'], ['label', '解释文本'],
  ]),
  table('rules', '通用规则参数', ruleRows, ['id', 'value', 'desc'], {
    note: '村内休整会清空野外探索压力，回村也会清空。修为来自首次探索某个地区、首次选择指定选项、首次击败对应敌人、静修、委托和沙盘推演。'
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
  '**剧透。** 此页包含完整地图、线索、委托、遭遇及沙盘推演答案。首次游玩可以直接从落灯村出发。',
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
