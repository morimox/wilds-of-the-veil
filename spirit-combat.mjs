import data from './data.mjs';

export const spiritSkills = [
  { id: 'fold_armor', name: '折甲', cost: 2, duration: 3, cooldown: 6, strength: 0.5, stat: 'physicalResist',
    region: 'zhao_city', site: 'zhao_flood_office', teacher: '杜椿', defeated: 'fault_warden',
    desc: '使对手的物抗减半，防御失去减伤效果。对手仍可闪避。',
    lesson: '杜椿把浅盘里的水引到两截交叠的竹片上。他用指尖各拨一下，两片竹子刚一错开，水就穿了过去。' },
  { id: 'split_stream', name: '并流', cost: 3, duration: 2, cooldown: 7, strength: 3,
    region: 'glass_rotunda', site: 'sand_glass_chamber', teacher: '邢既横', defeated: 'sand_sundial_master',
    desc: '只在下一回合，打中造成三倍伤害。发动时可以先蓄势。',
    lesson: '邢既横让你把手按在铜轮上。第一下震动过去，他仍让你按住。等第二下从另一头传来，他才点头让你松手。' },
  { id: 'turn_edge', name: '返势', cost: 1, duration: 1, cooldown: 4,
    region: 'measuring_hall', site: 'zhao_bamboo_duel', teacher: '傅澄', price: 180,
    desc: '这回合若对手出招打你，它会吃下自己的那一招。对手若收招，你也就无招可借。',
    lesson: '傅澄把尺横在你腕下。你连着三次往下压，第三次刚发力，尺身已经转了半圈。' },
  { id: 'veil_eye', name: '遮眼', cost: 1, duration: 3, cooldown: 5, strength: 0.5, stat: 'perception',
    region: 'cold_kiln', site: 'sand_cold_kiln_house', teacher: '阮杪', proof: 'cold_kiln_record', price: 90,
    desc: '使对手的洞察减半。这回合的读招已经判定，接下来两回合更容易瞒住起手。',
    lesson: '阮杪把冷炉验火册翻到画着水汽的一页，自己站到灯影底下。你看见他已经抬手，却没看清手里何时多了一截竹片。' },
  { id: 'press_edge', name: '压锋', cost: 2, duration: 2, cooldown: 5, strength: 0.6, stat: 'attack',
    region: 'cold_kiln', site: 'sand_cold_kiln_house', teacher: '阮杪', defeated: 'sand_inverted_keeper',
    desc: '使对手两回合内的攻击威力降低四成。',
    lesson: '阮杪听完倒驿锁影的事，取了两只同样重的秤砣挂在铁链两侧。他让你先拽一头，再拨另一头，链子立时松下来。' },
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
  const next = skill.id === 'split_stream' ? '这回合可先蓄势，下一回合再出手。' : '这回合不能攻击。';
  return kit.say(state, `施展${skill.name}，用去${skill.cost}点神识。${next}`);
}

export function spiritBlocksStrike(combat) {
  return Boolean(combat && spiritFrame(combat)?.start === combat.round);
}

export function considerEnemySpirit(combat, enemy, intent) {
  const skill = spirits.get(enemy.spiritSkill ?? enemyPractices[enemy.id]);
  if (!skill || enemy.tier < firstTier || (combat.enemySpirit?.ready ?? 0) > combat.round) return;
  const canUse = ['guard', 'dodge', 'focus', 'recoverQi'].includes(intent.kind);
  const reserve = combat.enemySense ?? enemy.spiritReserve ?? 3;
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
  const enemy = combat && kit.enemyOf(state);
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
