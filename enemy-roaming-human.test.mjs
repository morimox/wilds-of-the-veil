import assert from 'node:assert/strict';
import test from 'node:test';
import { banditContent } from './bandit-content.mjs';
import { chooseEnemyIntent } from './combat-tactics.mjs';
import { rollHumanLoadout } from './enemy-roaming-human.mjs';

const enemyOf = id => banditContent.enemies.find(enemy => enemy.id === id);
const fixedRolls = (...rolls) => ({ integer: () => {
  assert.ok(rolls.length, 'unexpected additional random draw');
  return rolls.shift();
} });

test('regulated and inhuman opponents are excluded from random equipment', () => {
  const rabbit = { ...enemyOf('road_knife_runner'), tags: ['beast'] };
  const sparring = { ...enemyOf('road_knife_runner'), sparring: true };
  assert.equal(rollHumanLoadout(rabbit, fixedRolls()), null);
  assert.equal(rollHumanLoadout(sparring, fixedRolls()), null);
});

test('each regular road portrait uses attacks and possible dropped gear from its actual equipment', () => {
  for (const pool of banditContent.roadBandits.pools) {
    const base = enemyOf(pool.enemy);
    const original = structuredClone(base);
    const outcomes = new Set();
    for (let lookup = 1; lookup <= 100; lookup++) {
      const profile = rollHumanLoadout(base, { integer: () => lookup });
      const { loadout, intents, medicine } = profile;
      outcomes.add(loadout.id);
      assert.ok(loadout.tell);
      assert.ok(loadout.gearIds.includes(loadout.weapon));
      assert.ok(pool.gear.some(({ id }) => loadout.gearIds.includes(id)), base.id);
      assert.ok(pool.richGear.some(({ id }) => loadout.gearIds.includes(id)), base.id);
      assert.ok(intents.some(({ kind, qiCost, damageType }) => kind === 'attack' && !qiCost && !damageType));
      if (pool.tier < 6) assert.ok(intents.every(({ qiCost }) => !qiCost));
      if (medicine?.count >= 2) assert.ok(pool.tier >= 5);
      if (medicine?.count >= 3) assert.ok(pool.tier >= 7);
    }
    assert.ok(outcomes.size >= 3, base.id);
    assert.deepEqual(base, original);
  }
});

test('a stance pays off only after its tell and a caster keeps fighting after qi is gone', () => {
  const scout = enemyOf('bandit_den_scout');
  const charge = rollHumanLoadout(scout, fixedRolls(99, 100));
  const ordinary = { ...scout, ...charge };
  const context = { round: 1, hp: ordinary.hp, qi: 0 };
  assert.equal(chooseEnemyIntent(ordinary, context).kind, 'focus');
  assert.equal(chooseEnemyIntent(ordinary, { ...context, round: 2, charged: true }).spendsCharge, true);
  assert.equal(chooseEnemyIntent(ordinary, { ...context, round: 2 }).spendsCharge, undefined);
  assert.equal(charge.medicine, null);

  const chief = enemyOf('road_sandal_halberd');
  const channel = rollHumanLoadout(chief, fixedRolls(1, 1, 2));
  const armed = { ...chief, ...channel };
  assert.equal(channel.loadout.weapon, 'coil_pole');
  assert.ok(channel.loadout.changesWeapon);
  assert.match(channel.desc, /长杖/);
  assert.equal(channel.medicine.count, 3);
  assert.equal(chooseEnemyIntent(armed, { round: 2, hp: armed.hp, qi: armed.qi }).damageType, 'magic');
  assert.equal(chooseEnemyIntent(armed, { round: 2, hp: armed.hp, qi: 0 }).qiCost, undefined);
});

test('gold road archers keep distinct armor penetration on their ordinary and heavy shots', () => {
  const source = enemyOf('road_black_bowist');
  const quick = rollHumanLoadout(source, fixedRolls(99, 45, 95));
  const charged = rollHumanLoadout(source, fixedRolls(1, 99, 95));
  const beginner = rollHumanLoadout(enemyOf('road_bow_robber'), fixedRolls(99, 45, 95));

  assert.equal(quick.loadout.weapon, 'black_crossbow');
  assert.ok(quick.intents.filter(({ ranged }) => ranged).every(({ pierce }) => pierce === 6));
  assert.equal(charged.loadout.weapon, 'lake_bow');
  assert.equal(charged.intents.find(({ kind }) => kind === 'heavy').pierce, 5);
  assert.ok(beginner.intents.every(({ pierce }) => !pierce));
});
