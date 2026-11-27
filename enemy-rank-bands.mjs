export const enemyRankLabels = Object.freeze({ lower: '下段', middle: '中段', upper: '上段', prodigy: '天骄' });

export const enemySpecialtyLabels = Object.freeze({
  balanced: '均衡', guard: '固守', evasive: '闪避', precise: '追击', insight: '洞察', spell: '术法', offense: '强攻',
});

const ranks = Object.keys(enemyRankLabels);
// [气血, 基础攻击, 基础防御]，其中上段跨到下一小境的下段仍会有重叠。
const realmBands = [
  [[18, 5, 0], [24, 7, 1], [31, 9, 2], [37, 11, 3]],
  [[29, 8, 2], [36, 10, 3], [44, 11, 4], [55, 14, 5]],
  [[42, 11, 3], [49, 12, 4], [60, 14, 5], [72, 16, 6]],
  [[52, 12, 4], [64, 14, 5], [78, 16, 7], [92, 18, 8]],
  [[62, 14, 5], [76, 16, 6], [92, 18, 8], [110, 21, 9]],
  [[74, 16, 6], [90, 18, 7], [109, 21, 9], [131, 25, 10]],
  [[90, 18, 7], [108, 22, 8], [130, 25, 10], [155, 29, 12]],
  [[103, 20, 8], [124, 25, 9], [150, 28, 11], [178, 33, 13]],
  [[119, 23, 9], [141, 28, 11], [172, 33, 13], [202, 38, 15]],
];

const fixedRoleRanks = new Map(Object.entries({
  reed_hare: 'lower', ford_silver_dace: 'lower', reed_fox: 'middle', mud_beast: 'middle',
  marsh_ghost: 'upper', bank_runner: 'upper', caravan_lookout: 'upper',
  foundation_duelist: 'upper', foundation_kiln_echo: 'upper', foundation_warden: 'prodigy',
  bell_wraith: 'middle', tide_spirit: 'prodigy', vine_king: 'prodigy',
  snow_warden: 'upper', mirror_warden: 'prodigy', caravan_broker: 'upper',
  herb_den_elder: 'prodigy', encyclopedia_weir_snake: 'upper', zhao_cargo_keeper: 'upper',
  zhao_spar: 'upper', river_copper_echo: 'upper', border_silo_leader: 'prodigy', dyke_old_croc: 'prodigy',
  bandit_den_leader: 'upper', bandit_red_rope_chief: 'upper', bandit_salt_cave_chief: 'upper',
  river_spar_captain: 'prodigy', fault_warden: 'prodigy', sand_quarry_matriarch: 'upper',
  ridge_armory_ram: 'upper', sand_sundial_master: 'prodigy', sand_basket_mender: 'upper',
  terrace_stride: 'upper', terrace_zheng: 'middle', terrace_meng: 'middle', terrace_lu: 'prodigy', terrace_ning: 'prodigy',
  terrace_crossbeam: 'middle', terrace_yu: 'middle', terrace_finalist: 'middle', terrace_xie: 'prodigy', terrace_han: 'prodigy',
  terrace_yao: 'middle', terrace_wen: 'middle', terrace_zhao: 'middle', terrace_liang: 'prodigy', terrace_gu: 'prodigy',
}));

// 首次狩猎、固定货队、剧情门槛以及已单独调过的十五名擂台对手。
const lockedTemplates = new Set([
  'reed_hare', 'reed_fox', 'mud_beast', 'marsh_ghost', 'bank_runner', 'bell_wraith', 'tide_spirit', 'mirror_warden', 'fault_warden',
  'foundation_duelist', 'foundation_kiln_echo', 'foundation_warden',
  'caravan_mule_hound', 'caravan_lookout', 'caravan_guard_hound', 'caravan_hook_guard', 'caravan_broker',
  'encyclopedia_weir_snake', 'border_silo_chain', 'border_silo_leader',
  ...[...fixedRoleRanks.keys()].filter(id => id.startsWith('terrace_')),
]);

const blend = (oldValue, target, targetShare) => Math.round(oldValue * (1 - targetShare) + target * targetShare);
const roundRate = value => Math.round(value * 1000) / 1000;

function selectRank(enemy, bands) {
  if (Object.hasOwn(enemyRankLabels, enemy.rank)) return enemy.rank;
  const role = fixedRoleRanks.get(enemy.id);
  if (role) return role;
  const [hp, atk, def] = bands[1];
  // 甲厚与高洞察用于标明打法。它们对数值段位的权重低于续战和单回合伤害。
  const weight = 0.50 * enemy.hp / hp + 0.38 * enemy.atk / atk + 0.12 * (enemy.def + 2) / (def + 2);
  if (weight >= 1.16) return 'upper';
  if (weight <= 0.90) return 'lower';
  return 'middle';
}

function selectSpecialty(enemy, bands) {
  if (Object.hasOwn(enemySpecialtyLabels, enemy.specialty)) return enemy.specialty;
  const intents = enemy.intents ?? [];
  const guard = intents.some(({ kind }) => kind === 'guard');
  if (enemy.strategy === 'footwork' || (enemy.dodge ?? 0) >= 0.09) return 'evasive';
  if (enemy.strategy === 'counter') return 'insight';
  if (enemy.strategy === 'bulwark' || (guard && enemy.def > bands[1][2] &&
    enemy.tags?.some(tag => tag === 'scaled' || tag === 'stoneborn'))) return 'guard';
  if (intents.some(({ kind, damageType }) => kind === 'drain' || damageType === 'magic')) return 'spell';
  if ((enemy.accuracy ?? 0) >= 0.07 || intents.some(intent => intent.ranged || intent.accuracy >= 0.12)) return 'precise';
  if (enemy.strategy === 'predator' || intents.some(({ kind, mult }) => kind === 'heavy' && mult >= 1.58)) return 'offense';
  return 'balanced';
}

function resolveStats(enemy, bands, rank, specialty) {
  const level = ranks.indexOf(rank);
  const [health, force, protection] = bands[level];
  const bonus = level > 1;
  const raiseToBand = (oldValue, target, share) => Math.max(level === 3 ? oldValue : 0, blend(oldValue, target, share));
  const hp = raiseToBand(enemy.hp, health, 0.62);
  const atk = raiseToBand(enemy.atk, force, 0.55);
  const def = raiseToBand(enemy.def, protection, 0.35);
  const tuned = { hp, atk, def };
  if (specialty === 'guard') {
    tuned.hp = Math.round(hp * (bonus ? 1.055 : 1.025));
    tuned.def = def + 1;
  } else if (specialty === 'offense') {
    tuned.atk = atk + (bonus ? 2 : 1);
  } else if (specialty === 'evasive') {
    const cap = enemy.tags?.includes('human') ? 0.29 : 0.25;
    tuned.dodge = Math.max(enemy.dodge ?? 0, roundRate(Math.min(cap, (enemy.dodge ?? 0.06) + (bonus ? 0.035 : 0.02))));
    tuned.def = Math.max(level === 3 ? enemy.def : 0, def - 1);
  } else if (specialty === 'insight') {
    tuned.perception = (enemy.perception ?? 0) + (bonus ? 3 : 1);
  } else if (specialty === 'precise') {
    tuned.accuracy = Math.max(enemy.accuracy ?? 0, roundRate(Math.min(0.23, (enemy.accuracy ?? 0.04) + (bonus ? 0.036 : 0.024))));
  } else if (specialty === 'spell' && enemy.qi > 0) {
    tuned.qi = Math.round(enemy.qi * (bonus ? 1.14 : 1.075));
  }
  return tuned;
}

export function applyEnemyRanks(enemies) {
  for (const enemy of enemies) {
    const bands = realmBands[enemy.tier] ?? realmBands.at(-1);
    const rank = selectRank(enemy, bands);
    const specialty = selectSpecialty(enemy, bands);
    if (!lockedTemplates.has(enemy.id)) Object.assign(enemy, resolveStats(enemy, bands, rank, specialty));
    Object.assign(enemy, { rank, specialty });
  }
  return enemies;
}
