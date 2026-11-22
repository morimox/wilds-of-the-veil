import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, `${action}: ${result.message}`);
  return result;
}

function choose(state, index) {
  play(state, 'choose', { index });
}

function walk(state, id) {
  play(state, 'travel', { id });
}

function exploreWith(state, actions) {
  play(state, 'explore');
  const index = actions[view(state).currentEvent.id];
  if (index === undefined) play(state, 'leave');
  else choose(state, index);
}

function restock(state, minimum) {
  const short = minimum - (state.inventory.ration ?? 0);
  if (short <= 0) return;
  const buyable = Math.min(short, Math.floor(state.coins / 3));
  if (buyable > 0) play(state, 'buy', { id: 'ration', count: buyable });
  if ((state.inventory.ration ?? 0) < 3) play(state, 'rest');
}

function seek(state, id) {
  for (let draw = 0; draw < 48; draw++) {
    play(state, 'explore');
    if (view(state).currentEvent.id === id) return;
    play(state, 'leave');
  }
  assert.fail(`没有找到测试事件 ${id}`);
}

test('village services and their contents are found gradually and guarded by the engine', () => {
  let state = createGame(1);
  const opening = view(state);
  assert.deepEqual(opening.services, []);
  assert.deepEqual(opening.discoveredQuests, []);
  assert.deepEqual(opening.discoveredRecipes, []);
  assert.deepEqual(opening.discoveredArts, []);
  assert.deepEqual(opening.discoveredItems, ['ration', 'cudgel', 'straw_cape']);
  assert.equal(opening.nextRealm, null);
  assert.equal(opening.discoveryHint, '');
  const start = JSON.stringify(state);
  for (const [action, payload] of [
    ['handin', { id: 'patch_ferry' }], ['craft', { id: 'r_salve' }], ['repair', { id: 'cudgel' }],
    ['research'], ['breakthrough'], ['learn', { id: 'reed_cleave' }], ['buy', { id: 'ration' }], ['sell', { id: 'ration' }],
  ]) {
    assert.equal(act(state, action, payload).ok, false);
    assert.equal(JSON.stringify(state), start);
  }

  walk(state, 'marsh');
  seek(state, 'reed_banks');
  assert.deepEqual(view(state).services, []);
  choose(state, 0);
  assert.deepEqual(view(state).services, ['quests']);
  seek(state, 'old_fire');
  choose(state, 1);
  assert.deepEqual(view(state).services, ['quests', 'market']);
  seek(state, 'sunk_pack');
  choose(state, 0);
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop']);
  assert.ok(view(state).discoveredRecipes.includes('r_salve'));
  assert.equal(view(state).discoveredRecipes.includes('r_hide_coat'), false);
  walk(state, 'village');
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop']);
  assert.ok(view(state).discoveredQuests.includes('reed_salve'));
  assert.equal(view(state).discoveredQuests.includes('coat_mend'), false);
  assert.equal(view(state).discoveredItems.includes('path_charm'), false);
  assert.equal(act(state, 'buy', { id: 'path_charm' }).ok, false);
  play(state, 'handin', { id: 'reed_salve' });
  play(state, 'sell', { id: 'reed', count: 1 });
  state = JSON.parse(JSON.stringify(state));
  assert.equal(state.inventory.reed, undefined);
  assert.deepEqual(view(state).services, ['quests', 'market', 'workshop', 'cultivate']);
  assert.ok(view(state).discoveredRecipes.includes('r_qi'));
  assert.ok(view(state).discoveredItems.includes('knife'));
  play(state, 'learn', { id: 'reed_cleave' });

  const ferrymanRoute = createGame(1);
  walk(ferrymanRoute, 'marsh');
  seek(ferrymanRoute, 'reed_ferryman');
  choose(ferrymanRoute, 0);
  assert.deepEqual(view(ferrymanRoute).services, ['quests', 'market', 'cultivate']);
  assert.deepEqual(view(ferrymanRoute).discoveredQuests, ['patch_ferry']);
});

test('harvesting only gives materials and reveals damage strictly after an action', () => {
  const state = createGame(9);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  const choices = view(state).visibleChoices;
  assert.equal(choices.length, 2);
  assert.ok(choices.every((choice) =>
    !['hp', 'injury', 'outcome', 'loot', 'enemy'].some((field) => Object.hasOwn(choice, field))));
  assert.doesNotMatch(JSON.stringify(choices), /割伤|划伤|划破|受伤|蚌壳/);
  const healthBefore = state.hp;
  const result = play(state, 'choose', { index: 1 });
  assert.equal(result.injury.amount, healthBefore - state.hp);
  assert.equal(result.injury.amount, 4);
  assert.match(result.injury.cause, /划破/);
  assert.equal(state.log.some((entry) => entry.includes(result.injury.cause)), false);
  assert.ok(state.inventory.reed);
  assert.equal(state.inventory.reed_lines, undefined);
  assert.equal(view(state).deductions.some(({ id }) => id === 'find_eddy'), false);

  walk(state, 'village');
  const handin = play(state, 'handin', { id: 'reed_salve' });
  assert.match(handin.outcome, /水|石/);
  assert.equal(state.inventory.reed_lines, 1);
  assert.equal(state.inventory.oar_mark, 1);
  assert.ok(view(state).deductions.some(({ id }) => id === 'find_eddy'));
});

test('backpack slots are finite and overflow can be picked up in the same place', () => {
  const state = createGame(1);
  const { backpackCapacity, backpackStackSize } = rules;
  assert.equal(view(state).backpackUsed, 1);
  assert.equal(view(state).backpackCapacity, backpackCapacity);
  state.inventory.ration = backpackCapacity * backpackStackSize;
  assert.equal(view(state).backpackUsed, backpackCapacity);
  assert.equal(act(state, 'unequip', { slot: 'weapon' }).ok, false);
  assert.equal(act(state, 'discard', { id: 'cudgel' }).ok, false);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  const overflow = play(state, 'choose', { index: 0 });
  assert.ok(overflow.spilled.reed > 0);
  assert.equal(state.inventory.reed, undefined);
  assert.equal(view(state).groundLoot.reed, overflow.spilled.reed);
  assert.equal(act(state, 'take', { id: 'reed' }).ok, false);
  assert.equal(view(state).backpackUsed, backpackCapacity);
  play(state, 'discard', { id: 'ration', count: backpackStackSize });
  assert.equal(view(state).groundLoot.ration, backpackStackSize);
  play(state, 'take', { id: 'reed' });
  assert.equal(state.inventory.reed, overflow.spilled.reed);
  assert.equal(view(state).groundLoot.reed, undefined);
  const before = state.inventory.ration;
  play(state, 'take', { id: 'ration' });
  assert.equal(state.inventory.ration, backpackStackSize * (backpackCapacity - 1));
  assert.equal(view(state).groundLoot.ration, backpackStackSize - (state.inventory.ration - before));
  walk(state, 'village');
  assert.deepEqual(view(state).groundLoot, {});
  walk(state, 'marsh');
  assert.ok(view(state).groundLoot.ration > 0);
});

test('capacity checks do not charge for a refused transaction and discarded gear keeps its wear', () => {
  const state = createGame(1);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  choose(state, 0);
  seek(state, 'old_fire');
  choose(state, 1);
  seek(state, 'sunk_pack');
  choose(state, 0);
  walk(state, 'village');
  state.inventory = { cudgel: 1, straw_cape: 1, reed: 2, ration: (rules.backpackCapacity - 1) * rules.backpackStackSize };
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);
  const before = structuredClone(state);
  for (const [action, payload] of [
    ['craft', { id: 'r_qi' }], ['buy', { id: 'ration' }], ['handin', { id: 'reed_salve' }],
  ]) {
    assert.match(act(state, action, payload).message, /行囊已满/);
    assert.deepEqual(state, before);
  }
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'craft', { id: 'r_qi' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'handin', { id: 'reed_salve' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  state.durability.cudgel = 5;
  play(state, 'unequip', { slot: 'weapon' });
  play(state, 'discard', { id: 'cudgel' });
  play(state, 'take', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, 5);
  assert.equal(act(state, 'discard', { id: 'reed_lines' }).ok, false);
});

test('a clue reveals a road across saves and travel still requires the appropriate realm', () => {
  let state = createGame(1);
  assert.deepEqual(view(state).discovered, ['village', 'marsh']);
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  assert.equal(view(state).discoveredItems.includes('sand'), false);
  assert.equal(view(state).discoveredQuests.includes('last_lantern'), false);
  walk(state, 'marsh');
  exploreWith(state, { reed_banks: 0 });
  walk(state, 'village');
  play(state, 'handin', { id: 'reed_salve' });
  assert.ok(view(state).discovered.includes('ridge'));
  assert.equal(act(state, 'travel', { id: 'ridge' }).ok, false);
  state = JSON.parse(JSON.stringify(state));
  assert.ok(view(state).discovered.includes('ridge'));
  assert.equal(view(state).region.id, 'village');
});

test('a spent expedition can abandon an event and reach free relief without resetting progress', () => {
  const state = createGame(1);
  walk(state, 'marsh');
  play(state, 'explore');
  state.inventory.ration = 0;
  const before = JSON.stringify(state);
  assert.equal(act(state, 'choose', { index: 0 }).ok, false);
  assert.equal(JSON.stringify(state), before);
  play(state, 'leave');
  walk(state, 'village');
  play(state, 'rest');
  assert.ok(state.inventory.ration >= 3);
  assert.equal(act(state, 'sell', { id: 'ration' }).ok, false);
  assert.equal(view(state).insight, 1);
});

test('damage wears equipped gear, defeating an enemy rewards only first-kill insight, and falling is recoverable', () => {
  const state = createGame(1);
  walk(state, 'marsh');
  const before = state.durability.cudgel;
  state.combat = { id: 'mud_beast', hp: 1, round: 0, escapeBonus: 0 };
  const finishingBlow = play(state, 'attack');
  assert.equal(finishingBlow.damageDealt, 1);
  assert.equal(finishingBlow.damageTaken, 0);
  assert.equal(state.durability.cudgel, before - 1);
  const insight = state.insight;
  state.combat = { id: 'mud_beast', hp: 1, round: 0, escapeBonus: 0 };
  play(state, 'attack');
  assert.equal(state.insight, insight);
  assert.ok(state.inventory.hide > 0);

  state.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  state.inventory.kiln_shard = 1;
  state.expeditionLoot.kiln_shard = 1;
  state.hp = 1;
  assert.equal(play(state, 'attack').damageTaken, 1);
  assert.equal(view(state).mode, 'village');
  assert.equal(state.wounds, 1);
  assert.equal(state.inventory.hide, undefined);
  assert.ok(state.inventory.cudgel);
  assert.equal(state.inventory.kiln_shard, 1);
  play(state, 'rest');
  assert.equal(state.wounds, 0);
  assert.ok(state.hp > 1);
  play(state, 'repair', { id: 'cudgel' });
  assert.equal(state.durability.cudgel, before);
});

test('a bow found by following material knowledge hits a furred beast harder', () => {
  const state = createGame(1);
  for (const { entry } of data.gear) {
    assert.ok(entry);
    assert.doesNotMatch(entry, /[0-9]/);
  }
  assert.equal(view(state).discoveredRecipes.includes('r_reed_bow'), false);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  choose(state, 0);
  assert.equal(view(state).discoveredRecipes.includes('r_reed_bow'), false);
  seek(state, 'mud_track');
  choose(state, 1);
  walk(state, 'village');
  assert.ok(view(state).discoveredRecipes.includes('r_reed_bow'));
  play(state, 'craft', { id: 'r_reed_bow' });
  play(state, 'equip', { id: 'reed_bow' });
  walk(state, 'marsh');
  seek(state, 'mud_track');
  choose(state, 2);
  assert.equal(view(state).currentEnemy.id, 'reed_fox');

  const broken = structuredClone(state);
  broken.durability.reed_bow = 0;
  play(broken, 'attack');
  assert.equal(view(broken).currentEnemy.hp, 24 - 7);
  const scaled = structuredClone(state);
  scaled.combat = { id: 'mud_beast', hp: 25, round: 0, escapeBonus: 0 };
  play(scaled, 'attack');
  assert.equal(view(scaled).currentEnemy.hp, 25 - 8);

  play(state, 'attack');
  assert.equal(view(state).currentEnemy.hp, 24 - 13);
  play(state, 'attack');
  assert.equal(view(state).mode, 'field');
  assert.ok(view(state).defeated.includes('reed_fox'));
});

test('weapon piercing and armor effects follow the actual enemy and intent', () => {
  const state = createGame(1);
  walk(state, 'marsh');
  state.inventory.knife = 1;
  state.durability.knife = 30;
  state.inventory.hide_coat = 1;
  state.durability.hide_coat = 29;
  play(state, 'equip', { id: 'knife' });
  play(state, 'equip', { id: 'hide_coat' });
  state.combat = { id: 'mud_beast', hp: 25, round: 0, escapeBonus: 0 };
  const beforeBeast = state.hp;
  play(state, 'attack');
  assert.equal(view(state).currentEnemy.hp, 25 - 11);
  assert.equal(state.hp, beforeBeast - 1);

  state.combat = { id: 'marsh_ghost', hp: 28, round: 1, escapeBonus: 0 };
  const beforeSpirit = state.hp;
  play(state, 'attack');
  assert.equal(view(state).currentEnemy.hp, 28 - 9);
  assert.equal(state.hp, beforeSpirit - 4);

  state.combat = null;
  state.realm = 1;
  state.inventory.iron_coat = 1;
  state.durability.iron_coat = 38;
  play(state, 'equip', { id: 'iron_coat' });
  state.hp = 40;
  state.combat = { id: 'ore_wight', hp: 40, round: 0, escapeBonus: 0 };
  play(state, 'attack');
  assert.equal(state.hp, 40 - 5);
  play(state, 'attack');
  assert.equal(state.hp, 40 - 5 - 12);
});

test('restoratives heal, toxin applies at the threshold, and a retreat talisman is spent immediately', () => {
  const state = createGame(1);
  walk(state, 'marsh');
  seek(state, 'sunk_pack');
  choose(state, 0);
  seek(state, 'reed_banks');
  choose(state, 0);
  walk(state, 'village');
  play(state, 'handin', { id: 'reed_salve' });
  const salve = data.pills.find(({ id }) => id === 'salve');
  const maxHp = view(state).maxHp;
  state.hp = maxHp - salve.hp - 2;
  state.toxin = rules.toxinThreshold - salve.toxin;
  play(state, 'use', { id: 'salve' });
  assert.equal(state.hp, maxHp - 2 - rules.toxinDamage);
  assert.equal(state.inventory.salve, undefined);
  play(state, 'rest');
  assert.equal(state.toxin, rules.toxinThreshold - rules.restToxin);
  assert.equal(state.hp, maxHp);

  walk(state, 'marsh');
  state.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  const before = state.hp;
  play(state, 'use', { id: 'reed_talisman' });
  assert.equal(state.hp, before);
  assert.equal(state.inventory.reed_talisman, undefined);
  assert.equal(view(state).mode, 'field');
});

test('deduction checks actual evidence and offers no spoilers, spends time on mistakes, and persists success', () => {
  const state = createGame(1);
  const id = 'find_eddy';
  const answer = 'behind_stone';
  const evidence = ['reed_lines', 'oar_mark'];
  const attempt = { id, evidence, hypothesis: answer };
  const beforeRevealed = state.day;
  assert.equal(view(state).deductions.some((entry) => entry.id === id), false);
  assert.equal(act(state, 'deduce', attempt).ok, false);
  assert.equal(state.day, beforeRevealed);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  assert.equal(act(state, 'deduce', attempt).ok, false);
  choose(state, 0);
  walk(state, 'village');
  play(state, 'handin', { id: 'reed_salve' });
  const opened = view(state);
  const visible = opened.deductions.find((entry) => entry.id === id);
  assert.equal(visible.completed, false);
  for (const field of ['answer', 'evidence', 'reward', 'success', 'miss']) assert.equal(Object.hasOwn(visible, field), false);
  assert.ok(evidence.every((itemId) => opened.evidence.some((item) => item.id === itemId && item.count > 0)));
  const beforeDay = state.day;
  const beforeInsight = state.insight;
  const wrongHypothesis = visible.hypotheses.find((entry) => entry.id !== answer).id;
  assert.equal(act(state, 'deduce', { ...attempt, hypothesis: wrongHypothesis }).deduction, 'miss');
  assert.equal(state.day, beforeDay + visible.days);
  assert.equal(act(state, 'deduce', { ...attempt, evidence: [...evidence, 'ridge_rubbing'] }).deduction, 'miss');
  assert.equal(state.insight, beforeInsight);
  assert.equal(state.inventory.eddy_note, undefined);

  walk(state, 'marsh');
  const beforeCorrect = state.day;
  assert.equal(act(state, 'deduce', attempt).deduction, 'solved');
  assert.equal(state.day, beforeCorrect + visible.days);
  assert.ok(state.insight > beforeInsight);
  assert.ok(evidence.every((itemId) => state.inventory[itemId] >= 1));
  assert.equal(state.inventory.eddy_note, 1);

  state.combat = { id: 'mud_beast', hp: 25, round: 1, escapeBonus: 0 };
  state.hp = 1;
  play(state, 'attack');
  assert.equal(state.inventory.eddy_note, 1);
  const reloaded = JSON.parse(JSON.stringify(state));
  const complete = view(reloaded).deductions.find((entry) => entry.id === id);
  assert.equal(complete.completed, true);
  assert.ok(complete.success);
  const completedDay = reloaded.day;
  assert.equal(act(reloaded, 'deduce', attempt).ok, false);
  assert.equal(reloaded.day, completedDay);
  assert.equal(reloaded.inventory.eddy_note, 1);
});

test('a seeded run completes both realms and the main quest, then unlocks the secret map', () => {
  const state = createGame(1);
  walk(state, 'marsh');
  seek(state, 'reed_banks');
  choose(state, 0);
  seek(state, 'old_fire');
  choose(state, 1);
  seek(state, 'sunk_pack');
  choose(state, 0);
  walk(state, 'village');
  play(state, 'handin', { id: 'patch_ferry' });
  const marshActions = { reed_banks: 0, sunk_pack: 1, mud_track: 1, old_fire: 1, reed_ferryman: 0 };
  const ridgeActions = { ore_rain: 0, empty_oven: 1, miner_echo: 1, rope_run: 0, stone_niche: 0 };

  for (let visit = 0; visit < 5 && ((state.inventory.reed ?? 0) < 3 || state.insight < 8); visit++) {
    restock(state, 9);
    walk(state, 'marsh');
    for (let draw = 0; draw < 6 && (state.inventory.ration ?? 0) > 0; draw++) {
      if ((state.inventory.reed ?? 0) >= 3 && state.insight >= 8) break;
      exploreWith(state, marshActions);
    }
    walk(state, 'village');
    const firewood = Math.max(0, (state.inventory.wood ?? 0) - 2);
    if (firewood) play(state, 'sell', { id: 'wood', count: firewood });
  }
  play(state, 'handin', { id: 'reed_salve' });
  play(state, 'breakthrough');
  assert.equal(view(state).realmIndex, 1);

  const ridgePrepared = () => (state.inventory.ore ?? 0) >= 5 && state.inventory.core && state.insight >= 20 && state.coins >= 50;
  for (let visit = 0; visit < 6 && !ridgePrepared(); visit++) {
    restock(state, 9);
    walk(state, 'ridge');
    for (let draw = 0; draw < 6 && (state.inventory.ration ?? 0) > 0; draw++) {
      if (ridgePrepared()) break;
      exploreWith(state, ridgeActions);
    }
    walk(state, 'village');
    const surplus = Math.max(0, (state.inventory.ore ?? 0) - 5);
    if (surplus) play(state, 'sell', { id: 'ore', count: surplus });
  }
  assert.ok(ridgePrepared(), JSON.stringify({ inventory: state.inventory, coins: state.coins, insight: state.insight, log: state.log.slice(-15) }));
  play(state, 'handin', { id: 'sell_forging' });
  play(state, 'craft', { id: 'r_iron_sword' });
  play(state, 'equip', { id: 'iron_sword' });
  play(state, 'breakthrough');
  assert.equal(view(state).realmIndex, 2);
  assert.ok(view(state).discovered.includes('ford'));
  play(state, 'learn', { id: 'reed_cleave' });
  play(state, 'learn', { id: 'stone_brace' });

  restock(state, 9);
  walk(state, 'ford');
  const fordActions = { low_tide: 0, boat_shade: 0, tide_keeper: 0, flood_lines: 0, lock_deck: 0 };
  for (let draw = 0; draw < 12 && !state.combat; draw++) {
    if (!state.inventory.ration) {
      walk(state, 'village');
      restock(state, 6);
      walk(state, 'ford');
    }
    exploreWith(state, fordActions);
  }
  assert.equal(view(state).currentEnemy.id, 'tide_spirit');

  const techniqueCost = 2;
  for (let turn = 0; turn < 10 && view(state).mode === 'combat'; turn++) {
    const panel = view(state);
    if (panel.intent.kind === 'guard' && panel.hp < panel.maxHp - 8 && state.inventory.salve) {
      play(state, 'use', { id: 'salve' });
    } else if (panel.intent.kind === 'heavy' && panel.currentEnemy.hp > 17 && panel.qi >= techniqueCost) {
      play(state, 'art', { id: 'stone_brace' });
    } else if (state.inventory.tide_talisman && panel.currentEnemy.hp > 17) {
      play(state, 'use', { id: 'tide_talisman' });
    } else if (panel.qi >= techniqueCost) {
      play(state, 'art', { id: 'reed_cleave' });
    } else {
      play(state, 'attack');
    }
  }
  assert.equal(view(state).mode, 'field', state.log.slice(-8).join('\n'));
  assert.equal(state.inventory.seal, 1);
  assert.equal(state.won, false);
  walk(state, 'village');
  play(state, 'handin', { id: 'last_lantern' });
  assert.equal(view(state).mode, 'victory');
  assert.equal(state.inventory.seal, undefined);
  const wonDay = state.day;
  play(state, 'resume');
  assert.equal(view(state).mode, 'village');
  assert.equal(view(state).discovered.includes('hidden'), false);
  assert.equal(view(state).discoveryHint, '');
  assert.equal(act(state, 'travel', { id: 'hidden' }).ok, false);
  restock(state, 8);
  walk(state, 'marsh');
  seek(state, 'old_fire');
  const early = view(state);
  assert.equal(early.visibleChoices.some(({ index }) => index === 3), false);
  assert.equal(early.currentEvent.choices.some(({ index }) => index === 3), false);
  assert.equal(act(state, 'choose', { index: 3 }).ok, false);
  choose(state, 2);
  assert.equal(state.inventory.kiln_shard, 1);
  walk(state, 'ridge');
  seek(state, 'stone_niche');
  assert.ok(view(state).visibleChoices.some(({ index, available }) => index === 2 && available));
  choose(state, 2);
  assert.equal(state.inventory.kiln_shard, 1);
  assert.equal(state.inventory.bell_clapper, 1);
  walk(state, 'ford');
  seek(state, 'boat_shade');
  choose(state, 2);
  assert.equal(state.inventory.bell_clapper, 1);
  assert.equal(state.inventory.backwash_mark, 1);
  assert.equal(state.inventory.secret_pass, undefined);
  assert.equal(act(state, 'travel', { id: 'hidden' }).ok, false);
  assert.equal(act(state, 'deduce', {
    id: 'trace_backwash', evidence: ['kiln_shard', 'bell_clapper', 'backwash_mark'], hypothesis: 'lamplit_reverse',
  }).deduction, 'solved');
  assert.equal(state.inventory.backwash_theory, 1);
  assert.equal(view(state).discovered.includes('hidden'), false);
  walk(state, 'marsh');
  assert.ok(view(state).revisitableEvents.some(({ id }) => id === 'old_fire'));
  play(state, 'revisit', { id: 'old_fire' });
  choose(state, 3);
  assert.ok(view(state).discovered.includes('hidden'));
  walk(state, 'village');
  restock(state, 5);
  walk(state, 'hidden');
  seek(state, 'upstream_lights');
  const wood = state.inventory.wood;
  choose(state, 0);
  assert.equal(state.inventory.wood, wood - 1);
  assert.ok(state.inventory.dry_wick > 0);
  assert.equal(state.wonDay, wonDay);
});
