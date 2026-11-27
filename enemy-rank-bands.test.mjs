import assert from 'node:assert/strict';
import test from 'node:test';
import { applyEnemyRanks, enemyRankLabels, enemySpecialtyLabels } from './enemy-rank-bands.mjs';

const base = { tier: 4, hp: 76, atk: 16, def: 6, perception: 18, strategy: 'instinct', tags: ['beast'],
  intents: [{ kind: 'attack' }] };

function fighter(id, changes = {}) {
  return Object.assign(structuredClone(base), { id }, changes);
}

test('strength bands make different same-stage fighters and preserve overlap between minor realms', () => {
  const low = fighter('comparison_low', { hp: 57, atk: 14, def: 5 });
  const regular = fighter('comparison_middle');
  const advanced = fighter('comparison_upper', { hp: 96, atk: 20, def: 7 });
  const nextRealmLow = fighter('comparison_next', { tier: 5, hp: 75, atk: 16 });
  assert.equal(enemyRankLabels.prodigy, '天骄');
  applyEnemyRanks([low, regular, advanced, nextRealmLow]);
  assert.deepEqual([low.rank, regular.rank, advanced.rank, nextRealmLow.rank], ['lower', 'middle', 'upper', 'lower']);
  assert.ok(advanced.hp > low.hp * 1.4 && advanced.atk > low.atk * 1.2);
  assert.ok(advanced.hp > nextRealmLow.hp && advanced.atk > nextRealmLow.atk);
});

test('specialties reinforce different attributes and preserve actions, timing and items', () => {
  const guard = [{ kind: 'guard' }];
  const thick = fighter('comparison_thick', { strategy: 'bulwark', intents: guard });
  const fast = fighter('comparison_fast', { dodge: 0.1 });
  const sharp = fighter('comparison_sharp', { strategy: 'counter', tags: ['human'] });
  const accurate = fighter('comparison_accurate', { accuracy: 0.08 });
  const caster = fighter('comparison_caster', { qi: 30, intents: [{ kind: 'drain', qiCost: 4 }] });
  const heavy = fighter('comparison_heavy', { strategy: 'predator', medicine: { id: 'salve', count: 1 },
    loot: { beast_meat: 1 }, intents: [{ kind: 'heavy', mult: 1.7, follows: 'guard' }] });
  const examples = [thick, fast, sharp, accurate, caster, heavy];
  const before = structuredClone(examples);
  applyEnemyRanks(examples);
  assert.deepEqual(examples.map(enemy => enemySpecialtyLabels[enemy.specialty]), ['固守', '闪避', '洞察', '追击', '术法', '强攻']);
  assert.ok(thick.def > fast.def && thick.hp > fast.hp);
  assert.ok(fast.dodge > before[1].dodge);
  assert.ok(sharp.perception > before[2].perception);
  assert.ok(accurate.accuracy > before[3].accuracy);
  assert.ok(caster.qi > before[4].qi);
  assert.ok(heavy.atk > before[5].atk);
  for (const [index, enemy] of examples.entries()) {
    for (const field of ['intents', 'tags', 'tier', 'medicine', 'loot']) assert.deepEqual(enemy[field], before[index][field]);
  }
  assert.equal(thick.intents, guard);
});

test('the protected opening, endings and tournament keep vetted combat numbers while gaining descriptive ranks', () => {
  const testedIds = ['reed_hare', 'reed_fox', 'mud_beast', 'tide_spirit', 'mirror_warden', 'fault_warden',
    'foundation_warden', 'terrace_stride', 'terrace_han', 'terrace_gu'];
  const protectedEnemies = testedIds.map(id => fighter(id));
  const original = structuredClone(protectedEnemies);
  applyEnemyRanks(protectedEnemies);
  assert.deepEqual(protectedEnemies.map(({ rank, specialty, ...enemy }) => enemy), original);
  assert.equal(protectedEnemies[0].rank, 'lower');
  assert.equal(protectedEnemies.at(-1).rank, 'prodigy');
});

test('an author may mark a stronger champion explicitly without a stat drop from a lower band target', () => {
  const champion = fighter('comparison_champion', { rank: 'prodigy', specialty: 'evasive', hp: 220, atk: 40, def: 15 });
  applyEnemyRanks([champion]);
  assert.deepEqual([champion.hp, champion.atk, champion.def], [220, 40, 15]);
  assert.ok(champion.dodge > 0);
});
