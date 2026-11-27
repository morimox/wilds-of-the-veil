import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, details = {}) {
  const result = act(state, action, details);
  assert.equal(result.ok, true, result.message);
  return result;
}

const choices = (state) => view(state).visibleChoices.map(({ index }) => index);

test('uncollected meat from each hunt expires separately without spoiling a player stash', () => {
  const state = createGame(48);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'mud_track' });
  const hunt = () => {
    play(state, 'choose', { index: 5 });
    state.combat.hp = 1;
    play(state, 'attack');
  };
  hunt();
  const firstDay = state.day;
  const quantity = view(state).groundLoot.beast_meat;
  assert.ok(quantity > 0);
  assert.deepEqual(view(state).freshGroundMeat, ['beast_meat']);
  play(state, 'take', { id: 'beast_meat', count: 1 });
  play(state, 'discard', { id: 'beast_meat', count: 1 });

  state.day += 5;
  hunt();
  const secondDay = state.day;
  const secondBatch = view(state).groundLoot.beast_meat - quantity;
  assert.ok(secondBatch > 0);
  const existingCores = view(state).groundLoot.qi_core;
  play(state, 'leave');
  const passExpiry = (day) => {
    state.day = day + rules.freshBattleMeatDays - 0.5;
    state.satiety = 100;
    play(state, 'wait');
  };
  passExpiry(firstDay);
  assert.equal(state.ground.mud_track.beast_meat, 1 + secondBatch);
  passExpiry(secondDay);
  assert.equal(state.ground.mud_track.beast_meat, 1);
  assert.equal(state.ground.mud_track.qi_core, existingCores);
  play(state, 'visit', { id: 'mud_track' });
  assert.deepEqual(view(state).freshGroundMeat, []);
});

test('the basket mender agrees to a protected bout only after the conversation', () => {
  const state = createGame(337);
  state.region = 'bone_dry_rill';
  play(state, 'visit', { id: 'sand_basket_shed' });
  assert.deepEqual(choices(state), [0]);
  assert.match(view(state).currentEvent.text, /补箩筐/);
  assert.equal(act(state, 'choose', { index: 3 }).ok, false);
  play(state, 'choose', { index: 0 });
  assert.deepEqual(choices(state), [1]);
  play(state, 'choose', { index: 1 });
  assert.deepEqual(choices(state), [2]);
  play(state, 'choose', { index: 2 });
  assert.deepEqual(choices(state), [3]);
  assert.equal(state.combat, null);

  const money = state.coins;
  state.hp = 1;
  play(state, 'choose', { index: 3 });
  assert.equal(view(state).currentEnemy.id, 'sand_basket_mender');
  assert.ok(view(state).currentEnemy.sparring);
  assert.match(play(state, 'attack').message, /收手/);
  assert.equal(view(state).mode, 'event');
  assert.equal(state.coins, money);
  assert.equal(state.wounds, 0);
  assert.ok(!choices(state).includes(4));
  assert.ok(!view(state).visibleChoices.find(({ index }) => index === 3).available);

  play(state, 'leave');
  play(state, 'wait');
  play(state, 'visit', { id: 'sand_basket_shed' });
  play(state, 'choose', { index: 3 });
  state.combat.hp = 1;
  play(state, 'attack');
  play(state, 'choose', { index: 4 });
  assert.equal(view(state).currentEvent.id, 'sand_basket_shed');
  assert.ok(!choices(state).includes(4));
  assert.match(view(state).currentEvent.text, /那颗松石拨到圈外/);
  assert.ok(choices(state).includes(5));
  play(state, 'choose', { index: 5 });
  assert.equal(state.inventory.stone_shoulder_manual, 1);
});

test('the three bag patterns are tied to work, an observed object, and victory', () => {
  const state = createGame(338);
  state.region = 'flood_market';
  state.inventory.wood = 5;
  play(state, 'visit', { id: 'zhao_float_goods' });
  assert.ok(!choices(state).includes(2));
  play(state, 'choose', { index: 0 });
  assert.match(view(state).currentEvent.text, /干网/);
  play(state, 'choose', { index: 2 });
  assert.equal(state.inventory.qiankun_pattern, 1);
  assert.ok(!choices(state).includes(2));

  state.region = 'sand_bell_cloister';
  state.inventory.ore = 2;
  state.inventory.core = 1;
  state.coins = 100;
  play(state, 'visit', { id: 'sand_cloister_trial' });
  play(state, 'choose', { index: 0 });
  assert.equal(view(state).currentEvent.id, 'sand_cloister_trial');
  play(state, 'leave');
  play(state, 'visit', { id: 'sand_ring_maker' });
  assert.match(view(state).currentEvent.text, /大|宽/);
  play(state, 'choose', { index: 1 });
  assert.equal(state.inventory.qiankun_fold_pattern, 1);
  play(state, 'leave');

  state.region = 'glass_rotunda';
  play(state, 'visit', { id: 'sand_glass_chamber' });
  assert.match(view(state).currentEvent.text, /刀鞘.*铁环/);
  assert.ok(!choices(state).includes(1));
  play(state, 'choose', { index: 0 });
  assert.equal(view(state).currentEnemy.sparring, true);
  state.combat.hp = 1;
  play(state, 'attack');
  assert.match(view(state).currentEvent.text, /收了刀.*铁环/);
  play(state, 'choose', { index: 1 });
  assert.equal(state.inventory.qiankun_inner_pattern, 1);
  assert.ok(!choices(state).includes(1));
});
