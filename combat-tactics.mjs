const strategies = {
  predator: { guardAt: 0.86, healAt: 0.22 },
  bulwark: { guardAt: 0.42, healAt: 0.48 },
  duelist: { guardAt: 0.62, healAt: 0.3 },
  schemer: { guardAt: 0.68, healAt: 0.43 },
  counter: { guardAt: 0.38, healAt: 0.3 },
  footwork: { guardAt: 0.68, healAt: 0.32 },
};

const focus = { kind: 'focus', name: '蓄势待发' };
const fallback = { kind: 'guard', name: '勉强架住双手', mult: 1 };
const isAttack = (kind) => kind === 'attack' || kind === 'heavy' || kind === 'drain';

function recentEstimate(values) {
  const weights = values.length * (values.length + 1) / 2;
  const weighted = values.reduce((sum, value, index) => sum + value * (index + 1), 0);
  return Math.max(values.at(-1), Math.ceil(weighted / weights));
}

function incomingEstimate(enemy, guard, observedHits) {
  if (!observedHits.length) return null;
  const cushion = guard ? Math.max(2, Math.ceil(enemy.def * (guard.mult ?? 1)) - enemy.def) : 0;
  const adjustment = Math.ceil(cushion / 2);
  return {
    open: recentEstimate(observedHits.map(({ damage, guarded }) => damage + (guarded ? adjustment : 0))),
    braced: recentEstimate(observedHits.map(({ damage, guarded }) => Math.max(1, damage - (guarded ? 0 : adjustment)))),
  };
}

function worthwhileHeal(enemy, heal, hp, threat, threshold) {
  if (!heal || hp > enemy.hp * threshold || threat >= hp) return false;
  const missing = enemy.hp - hp;
  const restored = Math.min(missing, Math.ceil(enemy.atk * (heal.mult ?? 1)));
  return restored > Math.max(2, threat);
}

function pursuitAttack(attacks) {
  let best = null;
  let bestAccuracy = -Infinity;
  for (const attack of attacks) {
    const quick = attack.ranged || attack.damageType === 'magic' || attack.kind === 'drain';
    const accuracy = (attack.accuracy ?? 0) + (quick ? 0.15 : 0);
    if (accuracy <= bestAccuracy) continue;
    best = attack;
    bestAccuracy = accuracy;
  }
  return best;
}

export function chooseEnemyIntent(enemy, { round, hp, previousKind, charged, read, observedHits = [], medicine, qi = Infinity }) {
  const start = round % enemy.intents.length;
  const order = [...enemy.intents.slice(start), ...enemy.intents.slice(0, start)];
  const recentlyRecovered = previousKind === 'heal' || previousKind === 'remedy';
  const available = order.filter(({ kind, qiCost = 0, follows, spendsCharge }) => qiCost <= qi && kind !== 'recoverQi' &&
    (!follows || follows === previousKind) && (!spendsCharge || charged) &&
    !(kind === 'guard' && previousKind === 'guard') && !(kind === 'heal' && recentlyRecovered) &&
    !(kind === 'focus' && charged) && !(kind === 'dodge' && previousKind === 'dodge' && enemy.strategy === 'footwork'));
  const attacks = available.filter(({ kind }) => isAttack(kind));
  const regain = order.find(({ kind }) => kind === 'recoverQi');
  const planned = available[0] ?? fallback;
  const attack = attacks.find(({ kind }) => kind === 'attack') ?? attacks[0];
  if (!attack) return regain && qi < enemy.qi ? regain : planned;
  const heavy = previousKind === 'heavy' ? null : available.find(({ kind }) => kind === 'heavy');
  const release = attacks.find(({ spendsCharge }) => spendsCharge);
  const prepare = available.find(({ kind }) => kind === 'focus') ?? focus;
  const strategy = Object.hasOwn(strategies, enemy.strategy) ? strategies[enemy.strategy] : null;
  if (read?.kind === 'medicine' && charged) return release ?? heavy ?? attack;

  if (!strategy) {
    if (!read) return planned;
    if (read.kind === 'focus' || read.kind === 'recover' || read.kind === 'medicine') return attack;
    if (planned.kind === 'guard' && read.kind !== 'strike') return attack;
    return planned;
  }

  // The enemy can estimate danger only from hits that have already landed.
  const guard = available.find(({ kind }) => kind === 'guard');
  const heal = available.find(({ kind }) => kind === 'heal');
  const threat = incomingEstimate(enemy, guard ?? order.find(({ kind }) => kind === 'guard'), observedHits);
  const open = threat?.open ?? 0;
  const follow = attacks.find(({ follows }) => follows);

  if (release && (!read || ['strike', 'focus', 'medicine', 'recover'].includes(read.kind))) return release;
  if (follow && (!read || ['strike', 'focus', 'recover'].includes(read.kind))) return follow;

  const safeWindow = ['brace', 'dodge', 'focus', 'recover', 'switch', 'medicine'].includes(read?.kind);
  const recentlyPassive = previousKind === 'guard' || recentlyRecovered || previousKind === 'focus';
  if (medicine?.hp > 0 && !recentlyRecovered && read?.kind !== 'retreat' &&
      (safeWindow || (threat && !recentlyPassive && open < hp))) {
    const restored = Math.min(enemy.hp - hp, medicine.hp);
    const threshold = strategy.healAt + (read?.kind === 'focus' ? 0 : safeWindow ? 0.18 : 0.08);
    const hazard = safeWindow ? 0 : open;
    if (hp <= enemy.hp * threshold && restored >= Math.max(4, Math.ceil(medicine.hp * 0.55)) && restored > hazard &&
        (!worthwhileHeal(enemy, heal, hp, hazard, strategy.healAt) || restored > Math.ceil(enemy.atk * (heal.mult ?? 1)))) {
      return { kind: 'remedy', name: medicine.action ?? `服下${medicine.name}` };
    }
  }

  if (!read) {
    if (threat && worthwhileHeal(enemy, heal, hp, open, strategy.healAt) && isAttack(previousKind)) return heal;
    if (planned.kind === 'heal' && (enemy.hp - hp < 3 || open >= hp)) return attack;
    return planned;
  }

  if (read.kind === 'focus') return heavy ?? attack;
  if (read.kind === 'brace') {
    if (worthwhileHeal(enemy, heal, hp, 0, strategy.healAt)) return heal;
    if (!charged && hp > enemy.hp * 0.25 && enemy.strategy !== 'predator') return prepare;
    return attack;
  }
  if (read.kind === 'dodge') {
    if (worthwhileHeal(enemy, heal, hp, 0, strategy.healAt)) return heal;
    return pursuitAttack(attacks) ?? attack;
  }
  if (read.kind === 'recover' && worthwhileHeal(enemy, heal, hp, 0, strategy.healAt)) return heal;
  if (read.kind !== 'strike') {
    const drain = enemy.strategy === 'schemer' && read.kind === 'recover' && available.find(({ kind }) => kind === 'drain');
    return drain || (enemy.strategy === 'bulwark' ? attack : heavy ?? attack);
  }

  if (enemy.strategy === 'counter' && guard && !recentlyPassive && open >= Math.max(5, hp * 0.12) &&
      threat.braced < hp && threat.braced + 2 <= open) return guard;
  if (enemy.strategy === 'footwork' && open >= Math.max(6, hp * 0.14) && !recentlyPassive) {
    const sidestep = available.find(({ kind }) => kind === 'dodge');
    if (sidestep) return sidestep;
  }

  if (!recentlyPassive && threat) {
    if (guard && threat.braced < hp && open - threat.braced >= 2 && open >= Math.max(3, hp * strategy.guardAt)) return guard;
    if (worthwhileHeal(enemy, heal, hp, open, strategy.healAt)) return heal;
  } else if (!recentlyPassive && planned.kind === 'guard') {
    return planned;
  }
  if (charged && heavy) return heavy;
  if (isAttack(planned.kind) && (planned.kind !== 'heavy' || heavy)) return planned;
  return attack;
}
