import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';
import { stageRetreatOpening } from './game-test-fixtures.mjs';
import { chooseEnemyIntent } from './combat-tactics.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, result.message);
  return result;
}

test('mist grows with elapsed field time; a deeper reserve delays exhaustion', () => {
  const exposure = (realm) => {
    const state = createGame(29);
    state.region = 'marsh';
    state.realm = realm;
    const hp = view(state).maxHp;
    state.hp = hp;
    state.qi = view(state).maxQi;
    state.satiety = 100;
    const drains = [];
    while (state.qi > 0) {
      if (state.satiety < 12) play(state, 'eat');
      const result = play(state, 'wait');
      if (result.fogLoss) drains.push(result.fogLoss);
    }
    assert.equal(state.qi, 0);
    assert.equal(state.hp, hp);
    assert.ok(drains[1] > drains[0]);
    return state.day;
  };
  const caps = data.realms.map(({ qi }) => qi);
  assert.ok(caps.every((qi, index) => index === 0 || qi > caps[index - 1]));
  assert.ok(exposure(8) > exposure(0));
});

test('field combat and local withdrawal leave the clock, food and mist untouched', () => {
  const state = createGame(51);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  play(state, 'choose', { index: 0 });
  const clock = () => ({
    day: state.day, satiety: state.satiety, pressure: state.pressure, exposure: state.fogExposure,
  });
  const before = clock();
  const startingHp = state.hp;
  for (let turn = 0; turn < 5; turn += 1) {
    const result = play(state, 'guard');
    assert.equal(result.fogLoss, undefined);
    assert.deepEqual(clock(), before);
    assert.equal(state.combat.round, turn + 1);
  }
  assert.ok(state.hp < startingHp);
  stageRetreatOpening(state);
  assert.equal(play(state, 'retreat').retreated, true);
  assert.deepEqual(clock(), before);
  if (state.event) play(state, 'leave');
  assert.ok(play(state, 'wait').fogLoss > 0);
  assert.ok(state.day > before.day);
  assert.ok(state.satiety < before.satiety);
  assert.ok(state.pressure > before.pressure);
});

test('offensive symbols spend the paper while recovery medicine restores only Qi', () => {
  const state = createGame(13);
  state.combat = { id: 'mud_beast', hp: 25, round: 0 };
  state.inventory.ember_talisman = 1;
  state.inventory.qi_powder = 1;
  state.qi = 0;
  assert.ok(play(state, 'use', { id: 'ember_talisman' }).damageDealt > 0);
  assert.equal(state.qi, 0);
  assert.equal(state.inventory.ember_talisman, undefined);
  state.combat = null;
  const hp = state.hp;
  const powder = data.pills.find(({ id }) => id === 'qi_powder');
  play(state, 'use', { id: 'qi_powder' });
  assert.equal(state.hp, hp);
  assert.equal(state.qi, powder.qi);
});

test('a spell-only enemy spends its own finite Qi and has to take a turn to recover', () => {
  const enemy = data.enemies.find(({ id }) => id === 'fault_warden');
  assert.ok(enemy);
  const state = createGame(39);
  state.realm = rules.resistanceTier + 1;
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  state.combat = { id: enemy.id, hp: enemy.hp, enemyQi: 0, round: 0 };
  const first = play(state, 'guard');
  assert.equal(first.enemyMove.kind, 'recoverQi');
  assert.equal(first.damageTaken, 0);
  const stock = state.combat.enemyQi;
  assert.ok(stock > 0);
  for (let attempt = 0; attempt < 4; attempt++) {
    const qi = state.combat.enemyQi;
    const result = play(state, 'guard');
    if (result.enemyMove.damageType === 'magic') {
      assert.ok(state.combat.enemyQi < qi);
      assert.equal(view(state).currentEnemy.enemyQi, undefined);
      return;
    }
  }
  assert.fail('The enemy never spent Qi after recovering');
});

test('human opponents cannot heal by breathing once their Qi runs out', () => {
  const healers = data.enemies.filter((enemy) => enemy.tags.includes('human')
    && enemy.intents.some((intent) => intent.kind === 'heal'));
  const warden = healers.find((enemy) => enemy.id === 'border_rope_warden');
  assert.ok(warden);
  assert.equal(warden.qi, 16);
  for (const enemy of healers) {
    const recovery = enemy.intents.filter((intent) => intent.kind === 'heal');
    assert.ok(recovery.every((intent) => intent.qiCost > 0 && intent.qiCost <= enemy.qi), enemy.id);
    const choice = chooseEnemyIntent(enemy, { round: 2, hp: 1, qi: 0, rng: 0.5 });
    assert.notEqual(choice.kind, 'heal', enemy.id);
  }
});
