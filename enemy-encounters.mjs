import { rollHumanLoadout } from './enemy-roaming-human.mjs';

const builds = [
  { hp: 0, atk: 0, def: 0, eye: 0, dodge: 0, accuracy: 0, tell: '' },
  { hp: 0.13, atk: 0.08, def: -1, eye: -2, dodge: -0.02, accuracy: 0, tell: '体格格外结实，脚下一发力便逼了过来。' },
  { hp: 0.09, atk: -0.10, def: 2, eye: -1, dodge: -0.04, accuracy: 0, tell: '侧身迎敌时，身上最结实的一面总朝着你。' },
  { hp: -0.11, atk: 0, def: -1, eye: 1, dodge: 0.09, accuracy: 0.03, tell: '身形轻快，在原地也不住地换着落脚的地方。' },
  { hp: -0.04, atk: -0.06, def: 0, eye: 5, dodge: 0.03, accuracy: 0.10, tell: '视线始终跟着你的手，一点动静也没放过。' },
];
const sizes = [
  { threshold: 17, hp: -0.14, atk: -0.12, def: -1, eye: -3, tell: '身量比同类单薄一些。' },
  { threshold: 47, hp: -0.06, atk: -0.04, def: 0, eye: -1, tell: '' },
  { threshold: 75, hp: 0.04, atk: 0.03, def: 0, eye: 0, tell: '' },
  { threshold: 94, hp: 0.13, atk: 0.10, def: 1, eye: 2, tell: '' },
  { threshold: 100, hp: 0.22, atk: 0.17, def: 2, eye: 4, tell: '同类留下的浅脚印中，只有这一道踩进了实土。' },
];

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

function individualRandom(seed, identity) {
  let current = (seed >>> 0) ^ 2166136261;
  for (let i = 0; i < identity.length; i++) current = Math.imul(current ^ identity.charCodeAt(i), 16777619) >>> 0;
  return {
    integer(min, max) {
      current = (Math.imul(1664525, current) + 1013904223) >>> 0;
      return min + Math.floor((current / 0x100000000) * (max + 1 - min));
    },
  };
}

export function rollEnemyIndividual(enemy, seed, identity, { novice = false } = {}) {
  const random = individualRandom(seed, identity);
  const { integer } = random;
  const human = enemy.tags?.includes('human');
  const roll = integer(1, 100);
  const size = sizes.find(({ threshold }) => roll <= threshold);
  const roleRoll = integer(0, 7);
  const form = builds[Math.max(0, roleRoll - 3)];
  const arms = human ? rollHumanLoadout(enemy, random) : null;
  const scale = novice ? 0.55 : 1;
  const shift = (value, ratio, low, high) => Math.round(value * (1 + clamp(ratio * scale, low, high)));
  const sizeTell = human ? (roll > 94 ? '来人步子极稳，靠近时也没有急着亮招。' : '') : size.tell;
  const encounterTell = [arms?.loadout.tell, sizeTell || form.tell].filter(Boolean).join(' ');
  const individual = {
    hp: shift(enemy.hp, size.hp + form.hp + integer(-4, 4) / 100, -0.28, novice ? 0 : 0.37),
    atk: shift(enemy.atk, size.atk + form.atk + integer(-3, 3) / 100, -0.24, novice ? 0 : 0.28),
    def: Math.max(0, enemy.def + Math.min(novice ? 0 : Infinity, Math.round(scale * (size.def + form.def + integer(-1, 1))))),
    perception: Math.max(0, (enemy.perception ?? 0) + (novice ? 0 : size.eye + form.eye + integer(-2, 2))),
    dodge: clamp((arms?.dodge ?? enemy.dodge ?? 0) + scale * form.dodge, 0, 0.30),
    accuracy: clamp((arms?.accuracy ?? enemy.accuracy ?? 0) + (novice ? 0 : form.accuracy), 0, 0.38),
    encounterTell,
  };
  if (!arms) return individual;
  const { dodge, accuracy, ...loadout } = arms;
  return { ...individual, ...loadout };
}

export function variesAtSite(enemy, site, denBoss) {
  const pool = site?.creatures?.[enemy.id];
  return Boolean(pool?.interval > 0 && pool.growth > 0 && !enemy.sparring && !site.protectedArena && denBoss !== enemy.id);
}
