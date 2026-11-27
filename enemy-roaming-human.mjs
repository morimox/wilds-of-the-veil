const roadArms = {
  road_knife_runner: ['knife', 'knife', '短刀上还缠着灰布。', ['straw_cape', 'reed_hat', 'hide_shield']],
  road_spear_taker: ['short_spear', 'spear', '矛杆握处磨得发亮。', ['hide_coat', 'reed_boots', 'hide_shield', 'iron_coat']],
  road_bow_robber: ['reed_bow', 'bow', '弓把裂了道口，用麻绳缠紧。', ['hide_coat', 'breath_belt', 'frost_robe']],
  road_salt_cutter: ['weir_knife', 'knife', '一柄宽刀贴着垫了盐袋的左肩。', ['iron_coat', 'tide_charm', 'sky_cloak']],
  road_piked_guard: ['tide_spear', 'spear', '长枪的枪尖下系着个绳钩。', ['tide_coat', 'side_hook', 'breath_belt', 'gauze_armor']],
  road_shield_broker: ['iron_sword', 'sword', '补过几处的甲片里露出一截剑柄。', ['hide_shield', 'iron_coat', 'tide_coat', 'gauze_armor', 'coal_tassel']],
  road_wind_swordsman: ['iron_sword', 'sword', '他束起披风，一柄沉剑急抬了一下。', ['frost_robe', 'tide_charm', 'coal_tassel', 'fault_coat']],
  road_black_bowist: ['black_crossbow', 'crossbow', '肩头挨着弩托，一支暗金短矢已搭好。', ['breath_belt', 'frost_robe', 'jade_pendant', 'fault_coat']],
  road_sandal_halberd: ['snow_halberd', 'spear', '他穿着软底靴，身旁一直立着长戟。', ['tide_coat', 'sky_cloak', 'gauze_armor', 'fault_coat']],
};

const roadArmsAlternates = {
  road_bow_robber: ['pine_bow', 'bow', '一张硬木长弓斜挂在肩上，箭已抽了出来。'],
  road_wind_swordsman: ['sky_sword', 'sword', '披风下滑出一把窄剑，剑身被他稳稳持平。'],
  road_black_bowist: ['lake_bow', 'bow', '暗处露出的长弓比人还高，他只拉开半张弦。'],
  road_sandal_halberd: ['coil_pole', 'staff', '软底靴踏过砂石没出声，他把一根带铜纹的长杖横到路上。'],
};

// Ordinary den troops keep their uniform, job and fixed quest stock. This list
// tells the independent combat patterns which weapon those troops already use.
const campArms = {
  bandit_den_scout: 'spear',
  bandit_den_sentry: 'knife',
  bandit_den_bodyguard: 'knife',
  bandit_red_rope_watch: 'spear',
  bandit_red_rope_knife: 'knife',
  bandit_salt_cave_watch: 'knife',
  bandit_salt_cave_bow: 'bow',
};

const playbook = {
  knife: ['贴身拿短刀削腕', '屈肘横刀挡住身前', '压开兵器，顺手削过来', '刀背朝外，收肘蓄力', '踏近，反手重劈', '错开你的手臂，快削一刀'],
  sword: ['平剑刺向肋下', '竖起剑身护住手臂', '借着两剑一碰，回手出剑', '剑尖垂地，后手蓄力', '转腕拖剑，由下往上重斩', '剑尖连点两下'],
  spear: ['压住枪尾，斜扎一枪', '把长杆斜架在身前', '推开兵器，转杆回刺', '双手握住杆尾蓄力', '踩稳前脚，抡起长杆横扫', '枪尖一抖，直取手腕'],
  bow: ['退半步射来一箭', '压低身子，横弓架住来招', '架开来招，转身放箭', '稳住弓身，慢慢拉满弓弦', '松弦放出一支重箭', '朝你落脚处快放一箭'],
  crossbow: ['抬弩射来一矢', '蹲低护住弩身', '避开来势，从低处放出短矢', '压住弩臂，换上一支重矢', '抬弩放出一支重矢', '突然抬弩，朝腰间射来'],
  staff: ['斜抡一杖打向小臂', '横杖护住胸腹', '拨开来招，翻转杖头回打', '收杖到腰边蓄力', '踩住前脚，重杖抡下', '摆动杖尾打向膝侧'],
  unknown: ['上前一步迎面打来', '收手护住胸腹', '让开来势，转身反击', '沉肩收手蓄力', '提步向前，重重一击', '贴近一步抢先出手'],
};

const gradeMedicineChance = [9, 11, 13, 22, 25, 29, 34, 38, 42];

function carriedMedicine(tier, integer) {
  const draw = integer(1, 100);
  if (draw > gradeMedicineChance[tier]) return null;
  const count = tier >= 7 && draw <= 2 ? 3 : tier >= 5 && draw <= 6 ? 2 : 1;
  const id = tier < 2 ? 'salve' : tier < 4 ? 'heal_pill'
    : tier < 7 ? 'tide_pill' : count === 1 ? 'jade_pill' : 'gold_salve';
  return { id, count };
}

function existingWeapon(enemy) {
  if (campArms[enemy.id]) return campArms[enemy.id];
  const visible = enemy.intents.filter(({ kind }) => kind === 'attack' || kind === 'heavy').map(({ name }) => name).join(' ');
  if (enemy.intents.some(({ ranged }) => ranged)) return visible.includes('弩') ? 'crossbow' : 'bow';
  return [['刀', 'knife'], ['剑', 'sword'], ['枪矛戟', 'spear'], ['杖棍篙', 'staff']]
    .find(([names]) => Array.from(names).some(name => visible.includes(name)))?.[1] ?? 'unknown';
}

function rolledArms(enemy, integer) {
  const primary = roadArms[enemy.id];
  if (!primary) return { family: existingWeapon(enemy), gearIds: [] };
  const alternative = roadArmsAlternates[enemy.id];
  const swappedArms = alternative && integer(1, 100) <= 26;
  const [weapon, family, tell] = swappedArms ? alternative : primary;
  return { weapon, family, tell, gearIds: [weapon, ...primary[3]], swappedArms };
}

function preferredPattern(enemy, family) {
  if (family === 'bow' || family === 'crossbow' || enemy.strategy === 'footwork') return 'quick';
  if (enemy.strategy === 'bulwark' || enemy.strategy === 'counter') return 'counter';
  return enemy.strategy === 'predator' ? 'charge' : 'pressure';
}

function choosePattern(enemy, family, spell, integer) {
  const draw = integer(1, 100);
  if (spell && draw <= 13) return 'channel';
  if (draw <= 49) return preferredPattern(enemy, family);
  if (draw <= 66) return 'quick';
  if (draw <= 82) return 'counter';
  return 'charge';
}

function buildPattern(pattern, basic, names, tier, spell) {
  const [, guardName, counterName, gatherName, chargeName, quickName] = names;
  const ranged = basic.ranged === true;
  const copyAttack = (name, mult, extra = {}) => ({ kind: 'attack', name, mult, ...(ranged ? { ranged } : {}), ...extra });
  const defense = (mult) => ({ kind: 'guard', name: guardName, mult });
  const dodge = { kind: 'dodge', name: ranged ? '沿着石脚退开半步' : '侧身溜向一旁' };
  const moderate = tier < 3 ? 1.32 : 1.43;
  switch (pattern) {
    case 'quick':
      return { strategy: 'footwork', intents: [basic, dodge, copyAttack(quickName, 0.98, { accuracy: 0.18 }), defense(1.34)] };
    case 'counter':
      return { strategy: 'counter', intents: [basic, defense(tier < 3 ? 1.55 : 1.72),
        copyAttack(counterName, tier < 3 ? 1.12 : 1.23, { follows: 'guard', pierce: tier < 3 ? 1 : 2 }), dodge] };
    case 'charge':
      return { strategy: 'predator', intents: [basic, { kind: 'focus', name: gatherName },
        copyAttack(chargeName, moderate, { kind: 'heavy', spendsCharge: true }), defense(1.33)] };
    case 'channel':
      return { strategy: 'schemer', intents: [basic, defense(1.34), spell, dodge] };
    default:
      return { strategy: 'duelist', intents: [basic, copyAttack(quickName, 1.05, { accuracy: 0.09 }), defense(1.33),
        copyAttack(chargeName, moderate, { kind: 'heavy' })] };
  }
}

/** Choose once per actual recurring opponent. Integer bounds are inclusive.
 * The caller keeps unique encounters out of this roll; regulated sparring is
 * also excluded here. The returned patch is private combat state. */
export function rollHumanLoadout(enemy, { integer }) {
  if (!enemy.tags?.includes('human') || enemy.sparring) return null;
  const tier = Math.min(8, Math.max(0, Math.floor(enemy.tier ?? 0)));
  const { weapon, family, gearIds, tell, swappedArms } = rolledArms(enemy, integer);
  const names = playbook[family];
  const ranged = family === 'bow' || family === 'crossbow';
  const previousBasic = enemy.intents.find(({ kind, qiCost, damageType }) => kind === 'attack' && !qiCost && damageType !== 'magic');
  const basic = previousBasic && !weapon ? { ...previousBasic } : { kind: 'attack', name: names[0], mult: 1, ...(ranged ? { ranged } : {}) };
  const authoredSpell = enemy.intents.find(({ kind, qiCost, damageType }) =>
    ['attack', 'heavy', 'drain'].includes(kind) && qiCost > 0 && damageType === 'magic');
  const technique = weapon === 'coil_pole'
    ? { kind: 'attack', name: '铜纹亮了两截，杖头荡来一股气劲', mult: 1.35, damageType: 'magic', qiCost: 16 }
    : authoredSpell && { ...authoredSpell };
  const spell = tier >= 6 && technique;
  const pattern = choosePattern(enemy, family, spell, integer);
  const fight = buildPattern(pattern, basic, names, tier, spell);
  if (tier >= 6 && ranged) {
    const arrowPierce = family === 'crossbow' ? 6 : 3;
    fight.intents = fight.intents.map((intent) => intent.ranged && ['attack', 'heavy'].includes(intent.kind)
      ? { ...intent, pierce: (intent.pierce ?? 0) + arrowPierce + (intent.kind === 'heavy' ? 2 : 0) }
      : intent);
  }
  return {
    loadout: { id: pattern, ...(weapon && { weapon }), gearIds, ...(tell && { tell }), ...(swappedArms && { changesWeapon: true }) },
    ...fight,
    qi: pattern === 'channel' ? Math.max(spell.qiCost * 2, enemy.qi ?? 0) : 0,
    medicine: carriedMedicine(tier, integer),
    ...(pattern === 'quick' ? { dodge: Math.max(enemy.dodge ?? 0, tier < 3 ? 0.07 : 0.12) } : {}),
    ...(swappedArms && { desc: tell }),
  };
}
