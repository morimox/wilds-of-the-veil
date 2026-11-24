import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

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

test('offensive symbols spend Qi as well as the paper; recovery medicine restores only Qi', () => {
  const state = createGame(13);
  state.combat = { id: 'mud_beast', hp: 25, round: 0 };
  state.inventory.ember_talisman = 1;
  state.inventory.qi_powder = 1;
  const { qiCost } = data.talismans.find(({ id }) => id === 'ember_talisman');
  state.qi = qiCost - 1;
  assert.match(act(state, 'use', { id: 'ember_talisman' }).message, /真气不足/);
  assert.equal(state.inventory.ember_talisman, 1);
  state.combat = null;
  const hp = state.hp;
  const powder = data.pills.find(({ id }) => id === 'qi_powder');
  play(state, 'use', { id: 'qi_powder' });
  assert.equal(state.hp, hp);
  assert.equal(state.qi, qiCost - 1 + powder.qi);
  state.combat = { id: 'mud_beast', hp: 25, round: 0 };
  const before = state.qi;
  assert.ok(play(state, 'use', { id: 'ember_talisman' }).damageDealt > 0);
  assert.equal(state.qi, before - qiCost);
  assert.equal(state.inventory.ember_talisman, undefined);
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
