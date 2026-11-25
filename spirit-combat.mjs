import data from './data.mjs';

export const spiritSkills = [
  { id: 'fold_armor', name: '折甲', cost: 2, duration: 3, cooldown: 6, strength: 0.5, stat: 'physicalResist',
    region: 'zhao_city', site: 'zhao_flood_office', teacher: '杜椿', defeated: 'fault_warden',
    desc: '物抗减半，架招失去卸力效果。对手还可以闪避。',
    lesson: '杜椿把分柱水君拦下来的那一股水引入浅盘，拨开两截交错的竹片。甲再厚，架不住两边的力同时抽开。' },
  { id: 'split_stream', name: '并流', cost: 3, duration: 2, cooldown: 7, strength: 3,
    region: 'glass_rotunda', site: 'sand_glass_chamber', teacher: '邢既横', defeated: 'sand_sundial_master',
    desc: '下一回合打中的一击造成三倍伤害。可以趁发动时蓄势。',
    lesson: '邢既横把铜轮转了一圈，支住一重一轻两股回力，让你等它们碰到一处再出手。' },
  { id: 'turn_edge', name: '返势', cost: 1, duration: 1, cooldown: 4,
    region: 'measuring_hall', site: 'zhao_bamboo_duel', teacher: '傅澄', price: 180,
    desc: '这回合对手若发动攻击，来招折回对手身上。',
    lesson: '傅澄把尺横在你腕下。你连着三次往下压，第三次刚发力，尺身已经转了半圈。' },
  { id: 'veil_eye', name: '遮眼', cost: 1, duration: 3, cooldown: 5, strength: 0.5, stat: 'perception',
    region: 'cold_kiln', site: 'sand_cold_kiln_house', teacher: '阮杪', proof: 'cold_kiln_record', price: 90,
    desc: '对手洞察减半。这个回合已经看破的动作照常，往后两回合更容易瞒住起手。',
    lesson: '阮杪把冷炉验火册翻到画着水汽的一页。他教你让动作起在雾纹外，把要落的地方留在雾纹里。' },
  { id: 'press_edge', name: '压锋', cost: 2, duration: 2, cooldown: 5, strength: 0.6, stat: 'attack',
    region: 'cold_kiln', site: 'sand_cold_kiln_house', teacher: '阮杪', defeated: 'sand_inverted_keeper',
    desc: '对手两回合内的出手力道削去四成。',
    lesson: '阮杪听完倒驿锁影的事，在一截铁链上另挂了只齐重的秤砣。你照他的指点重新拽了一下，链子尚未回紧，力先泄了。' },
];

const spirits = new Map(spiritSkills.map((skill) => [skill.id, skill]));
const firstTier = 6;
const reserves = new Map(data.gear.filter((gear) => gear.tier >= firstTier && gear.spiritReserve).map(({ id, tier }) => [id, tier]));
const statNames = { physicalResist: '物抗', perception: '洞察', attack: '攻击' };
const enemyPractices = {
  fault_warden: 'fold_armor',
  sand_inverted_keeper: 'turn_edge',
  sand_sundial_master: 'split_stream',
};

function reserveGear(state) {
  return Object.values(state.equipment).find((id) => state.realm >= (reserves.get(id) ?? Infinity) && state.durability[id] > 0);
}

function naturalCapacity(state) {
  return state.realm < firstTier ? 0 : state.realm === firstTier ? 2 : 3;
}

export function spiritCapacity(state) {
  return naturalCapacity(state) + Number(Boolean(reserveGear(state)));
}

export function spiritFrame(combat, enemy = false) {
  const current = enemy ? combat?.enemySpirit : combat?.playerSpirit;
  return current && combat.round < current.end ? current : null;
}

function frameFor(skill, round) {
  return { id: skill.id, strength: skill.strength, start: round, end: round + skill.duration, ready: round + skill.cooldown };
}

function spiritBlocker(state, skill) {
  const { combat, training } = state;
  if (!combat) return '交手时才能用神识。';
  if (!skill || !spiritCapacity(state) || !training.spiritKnown?.includes(skill.id)) return '先学会并选用一门神识。';
  const round = combat.round;
  if ((combat.playerSpirit?.ready ?? 0) > round) return '这门神识还没缓过来。';
  if (training.sense < skill.cost) return '神识不足。';
  return '';
}

export function invokeSpirit(state, kit) {
  const skill = spirits.get(state.training?.spiritActive);
  const reason = spiritBlocker(state, skill);
  if (reason) return kit.refuse(reason);
  state.training.sense -= skill.cost;
  state.combat.playerSpirit = frameFor(skill, state.combat.round);
  return kit.say(state, `施展${skill.name}，用去${skill.cost}点神识。这回合还能防御、闪避或蓄势。`);
}

export function spiritBlocksStrike(combat) {
  return Boolean(combat && spiritFrame(combat)?.start === combat.round);
}

export function considerEnemySpirit(combat, enemy, intent) {
  const skill = spirits.get(enemyPractices[enemy.id]);
  if (!skill || enemy.tier < firstTier || (combat.enemySpirit?.ready ?? 0) > combat.round) return;
  const canUse = ['guard', 'dodge', 'focus', 'recoverQi'].includes(intent.kind);
  const reserve = combat.enemySense ?? 3;
  if (!canUse || reserve < skill.cost) return;
  combat.enemySense = reserve - skill.cost;
  combat.enemySpirit = frameFor(skill, combat.round);
}

function sourceOpen(state, skill) {
  return (!skill.proof || state.knownItems.includes(skill.proof)) &&
    (!skill.defeated || state.defeated.includes(skill.defeated));
}

function instructionBlocker(state, skill, kit) {
  if (state.region !== skill.region || state.event !== skill.site) return `得去${kit.records.sites[skill.site].name}找${skill.teacher}。`;
  if (state.coins < (skill.price ?? 0)) return '灵钱不足。';
  return '';
}

export function spiritStudies(state, kit) {
  const max = spiritCapacity(state);
  if (!max) return null;
  const { combat, training } = state;
  const reserve = reserveGear(state);
  const source = {
    natural: naturalCapacity(state),
    equipment: reserve ? { id: reserve, name: kit.nameOf(reserve), bonus: 1 } : null,
  };
  const known = training?.spiritKnown ?? [];
  const active = known.includes(training?.spiritActive) ? spirits.get(training.spiritActive) : null;
  const rows = spiritSkills.filter((skill) => known.includes(skill.id) || (state.event === skill.site && sourceOpen(state, skill)))
    .map((skill) => ({ ...skill, learned: known.includes(skill.id), selected: active?.id === skill.id,
      blocker: instructionBlocker(state, skill, kit) }));
  const enemy = combat && kit.records.enemies[combat.id];
  const readings = enemy ? spiritSkills.filter((skill) => known.includes(skill.id) && skill.stat)
    .map(({ stat }) => ({ label: statNames[stat],
      value: stat === 'attack' ? enemy.atk : stat === 'physicalResist'
        ? `${Number(((enemy.physicalResist ?? 0) * 100).toFixed(3))}%` : (enemy[stat] ?? 0) })) : [];
  const current = spiritFrame(combat);
  return { max, current: Math.min(training?.sense ?? 0, max), source, active, rows, readings,
    waiting: combat ? Math.max(0, (combat.playerSpirit?.ready ?? 0) - combat.round) : 0,
    remaining: current ? current.end - combat.round : 0,
    invokeBlocker: spiritBlocker(state, active), strikeBlocked: spiritBlocksStrike(combat) };
}

export function spiritAction(state, action, { id }, kit) {
  if (action !== 'spiritStudy' && action !== 'spiritEquip') return null;
  if (!spiritCapacity(state)) return kit.refuse('金丹结成后才能运用神识。');
  const skill = spirits.get(id);
  if (!skill) return kit.refuse('这里没有这门神识。');
  const training = state.training;
  const known = training.spiritKnown ?? [];
  if (action === 'spiritEquip') {
    if (!known.includes(id)) return kit.refuse('你还没习得这门神识。');
    if (training.spiritActive === id) return kit.refuse(`你已选用「${skill.name}」。`);
    training.spiritActive = id;
    return kit.say(state, `选用神识「${skill.name}」。`);
  }
  if (!sourceOpen(state, skill)) return kit.refuse('眼下还无从学这门神识。');
  if (known.includes(id)) return kit.refuse('你已经习得这门神识。');
  const reason = instructionBlocker(state, skill, kit);
  if (reason) return kit.refuse(reason);
  state.coins -= skill.price ?? 0;
  training.spiritKnown = [...known, id];
  if (!known.includes(training.spiritActive)) training.spiritActive = id;
  return kit.say(state, `${skill.lesson} 你习得了「${skill.name}」。`);
}
