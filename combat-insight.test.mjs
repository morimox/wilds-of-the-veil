import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const enemies = Object.fromEntries(data.enemies.map((enemy) => [enemy.id, enemy]));
const gear = Object.fromEntries(data.gear.map((entry) => [entry.id, entry]));
const pills = Object.fromEntries(data.pills.map((pill) => [pill.id, pill]));

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function equip(state, id) {
  state.inventory[id] = 1;
  state.durability[id] = gear[id].durability;
  play(state, 'equip', { id });
}

function seedBetween(min, max) {
  for (let seed = 0; seed < 20_000; seed++) {
    const roll = ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000;
    if (roll >= min && roll < max) return seed;
  }
  throw new Error('Missing deterministic roll');
}

function staged(id, { realm = 0, items = [], round = 0, hp, seed } = {}) {
  const state = createGame(421);
  state.realm = realm;
  for (const item of items) equip(state, item);
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  if (seed !== undefined) state.combatSeed = seed;
  state.combat = { id, round, hp: hp ?? enemies[id].hp, escapeBonus: 0 };
  return state;
}

test('a perceptive weapon changes a real first draw without exposing or rerolling hidden moves', () => {
  const reedFox = (item) => {
    const state = createGame(731);
    if (item) equip(state, item);
    state.combatSeed = seedBetween(0.31, 0.35);
    play(state, 'travel', { id: 'marsh' });
    play(state, 'visit', { id: 'mud_track' });
    play(state, 'choose', { index: 2 });
    return state;
  };
  const novice = reedFox();
  const swordsman = reedFox('iron_sword');
  const before = view(novice);
  assert.equal(before.combatRead, null);
  assert.equal(before.intent, null);
  assert.equal(Object.hasOwn(before, 'intentDamage'), false);
  assert.equal(before.retreatRisk, null);
  assert.equal(before.openingShotReady, false);
  assert.equal(before.combat.plan, undefined);
  assert.equal(before.currentEnemy.intents, undefined);
  const reading = view(swordsman);
  assert.equal(reading.combatRead, 'player');
  assert.deepEqual(Object.keys(reading.intent).sort(), ['damageType', 'kind', 'name']);
  assert.equal(reading.intent.kind, 'attack');
  assert.equal(reading.intent.damageType, 'physical');
  assert.equal(Object.hasOwn(reading, 'intentDamage'), false);
  assert.deepEqual(reading.retreatRisk, { blocked: true });
  const seed = novice.combatSeed;
  const world = novice.encounterSeed;
  assert.equal(act(novice, 'selectAmmo', { id: 'black_bolt' }).ok, false);
  assert.equal(novice.combatSeed, seed);
  assert.equal(view(novice).intent, null);
  const resolved = play(novice, 'guard');
  assert.equal(resolved.enemyMove.kind, 'attack');
  assert.match(resolved.message, new RegExp(resolved.enemyMove.name));
  assert.equal(view(novice).lastEnemyIntent.name, resolved.enemyMove.name);
  assert.notEqual(novice.combatSeed, seed);
  assert.equal(novice.encounterSeed, world);
});

test('a read gives a human the actual chosen action, and persistent attacks still draw replies', () => {
  const seed = seedBetween(0.05, 0.09);
  const state = staged('sand_basket_mender', { realm: 7, items: ['tide_coat', 'anvil_hammer'], seed });
  assert.equal(act(state, 'selectAmmo', { id: 'bad_ammo' }).ok, false);
  assert.equal(view(state).combatRead, 'enemy');
  assert.equal(view(state).intent, null);
  assert.equal(view(state).retreatRisk, null);
  const charging = play(state, 'attack');
  assert.match(charging.message, /看破了你的起手/);
  assert.ok(['attack', 'heavy'].includes(charging.enemyMove.kind));
  assert.equal(charging.damageDealt, charging.reflectedDamage);
  assert.equal(view(state).chargingWeapon, null);

  const wards = staged('sand_basket_mender', { realm: 7, items: ['tide_coat'], seed });
  const replies = [];
  for (let turn = 0; wards.combat && turn < 16; turn++) {
    const result = play(wards, 'attack');
    if (result.enemyMove) replies.push(result.enemyMove.kind);
  }
  assert.ok(replies.length >= 3);
  assert.ok(replies.some((kind) => kind === 'attack' || kind === 'heavy'));
  assert.ok(replies.every((kind, i) => kind !== 'guard' || replies[i - 1] !== 'guard'));
});

test('opponents with the same observations answer the same action even when the real loadout and health differ', () => {
  const seed = seedBetween(0.05, 0.09);
  const weak = staged('sand_basket_mender', { realm: 7, seed });
  const strong = staged('sand_basket_mender', { realm: 7, seed, items: ['foil_sword', 'fault_coat'] });
  weak.hp = 1;
  assert.notEqual(view(weak).physicalResist, view(strong).physicalResist);
  assert.notEqual(view(weak).magicResist, view(strong).magicResist);
  const a = play(weak, 'attack');
  const b = play(strong, 'attack');
  assert.match(a.message, /看破了你的起手/);
  assert.match(b.message, /看破了你的起手/);
  assert.equal(a.enemyMove.name, b.enemyMove.name);
  assert.notEqual(a.damageDealt, b.damageDealt);
  assert.equal(strong.combat.observedHits[0].damage, b.damageDealt);

  const first = strong.combat.observedHits[0].damage;
  strong.inventory.cudgel = 1;
  strong.durability.cudgel = gear.cudgel.durability;
  strong.knownArts.push('gold_ember_point');
  const locked = structuredClone(strong);
  assert.match(act(strong, 'combatEquip', { id: 'cudgel' }).message, /交手中不能换装备/);
  assert.deepEqual(strong, locked);
  assert.equal(strong.combat.observedHits.length, 1);
  const next = play(strong, 'art', { id: 'gold_ember_point' });
  assert.equal(strong.combat.observedHits[1].damage, next.damageDealt - next.reflectedDamage);
  assert.notEqual(first, strong.combat.observedHits[1].damage);
});

test('the opposing health band conceals different actual health and resistance even after reading the attack', () => {
  const id = 'sand_riven_scorpion';
  const enemy = enemies[id];
  const original = { hp: enemy.hp, physicalResist: enemy.physicalResist, magicResist: enemy.magicResist };
  const actor = staged(id, { realm: 7, items: ['foil_sword'], hp: Math.round(original.hp * 0.55) });
  actor.combat.plan = { round: 0, reader: 'player', intent: enemy.intents.find(({ kind }) => kind === 'attack') };
  const later = structuredClone(actor);
  const before = view(actor);
  const sturdy = play(actor, 'attack');
  try {
    enemy.hp += 40;
    enemy.physicalResist = 0;
    enemy.magicResist = 0.46;
    later.combat.hp = Math.round(enemy.hp * 0.55);
    const read = view(later);
    assert.equal(read.combatRead, 'player');
    assert.equal(read.currentEnemy.health, 0.55);
    assert.deepEqual(read.currentEnemy, before.currentEnemy);
    assert.deepEqual(read.intent, before.intent);
    assert.deepEqual(read.retreatRisk, before.retreatRisk);
    for (const key of ['hp', 'maxHp', 'def', 'qi', 'physicalResist', 'magicResist', 'tier']) {
      assert.equal(Object.hasOwn(read.currentEnemy, key), false);
    }
    assert.ok(play(later, 'attack').damageDealt > sturdy.damageDealt);
  } finally {
    Object.assign(enemy, original);
  }
});

test('a safe charge takes two turns and wears the selected weapon only on release', () => {
  const state = staged('ford_shale_crab', { realm: 2, items: ['anvil_hammer'] });
  const start = state.day;
  const durability = state.durability.anvil_hammer;
  const result = play(state, 'attack');
  assert.equal(result.enemyMove.kind, 'guard');
  assert.equal(state.day - start, rules.battleDays);
  assert.equal(result.damageDealt, 0);
  assert.equal(state.durability.anvil_hammer, durability);
  assert.deepEqual(view(state).chargingWeapon, { slot: 'weapon', id: 'anvil_hammer', name: '短柄铁锤' });
  const release = play(state, 'attack');
  assert.ok(release.damageDealt > 0);
  assert.equal(state.day - start, 2 * rules.battleDays);
  assert.equal(state.durability.anvil_hammer, durability - 1);
  assert.equal(view(state).chargingWeapon, null);

  const ordinary = staged('ford_shale_crab', { realm: 2, items: ['iron_sword'] });
  const ordinaryStart = ordinary.day;
  const hit = play(ordinary, 'attack');
  assert.ok(hit.damageDealt > 0);
  assert.equal(ordinary.day - ordinaryStart, rules.battleDays);
  assert.equal(ordinary.durability.iron_sword, gear.iron_sword.durability - 1);
  assert.equal(view(ordinary).chargingWeapon, null);
});

test('reflection requires a successful close hit and works through the normal victory settlement', () => {
  const state = staged('herb_den_lizard', { realm: 4, items: ['den_armguard'], hp: 1 });
  state.combat.siteId = 'herb_den';
  state.region = 'herb_basin';
  const intact = structuredClone(state);
  state.durability.den_armguard = 0;
  const result = play(intact, 'guard');
  assert.equal(result.reflectedDamage, 1);
  assert.equal(result.damageDealt, 1);
  assert.ok(result.damageTaken > 0);
  assert.equal(result.gathered.hard_scale, 2);
  assert.equal(intact.inventory.hard_scale, undefined);
  assert.equal(intact.siteVictories.herb_den.herb_den_lizard, 1);
  const worn = play(state, 'guard');
  assert.equal(worn.reflectedDamage, 0);
  assert.ok(state.combat);

  const ranged = [...data.enemies].sort((a, b) => b.atk - a.atk)
    .find((enemy) => enemy.intents.some((intent) => intent.ranged && intent.kind === 'attack'));
  assert.ok(ranged);
  const arrow = ranged.intents.find((intent) => intent.ranged && intent.kind === 'attack');
  const shot = staged(ranged.id, { realm: 4, items: ['den_armguard'] });
  shot.combat.plan = { round: shot.combat.round, intent: arrow, reader: null };
  const landed = play(shot, 'attack');
  assert.ok(landed.damageTaken > 0);
  assert.equal(landed.reflectedDamage, 0);
});

test('an injured human spends a carried medicine in one turn and cannot use it a second time', () => {
  const state = staged('sand_basket_mender', { realm: 7, hp: 41, seed: seedBetween(0.05, 0.09) });
  state.combat.observedHits = [{ damage: 12, guarded: false }];
  const initial = state.day;
  const first = play(state, 'guard');
  assert.equal(first.enemyMove.kind, 'remedy');
  assert.match(first.message, /服下济潮丹/);
  assert.equal(state.day - initial, rules.battleDays);
  assert.equal(state.combat.hp, 41 + pills.tide_pill.hp);
  assert.equal(state.combat.medicineLeft, 0);
  for (let turn = 0; state.combat && turn < 4; turn++) {
    assert.notEqual(play(state, 'guard').enemyMove?.kind, 'remedy');
  }
});

test('a completed charged strike can stop a dose, while a miss or a normal strike leaves room to take it', () => {
  const id = 'sand_basket_mender';
  const guard = enemies[id].intents.find(({ kind }) => kind === 'guard');
  const remedy = { kind: 'remedy', name: '服下济潮丹' };
  const prepared = staged(id, { realm: 5, hp: 68, items: ['anvil_hammer'] });
  prepared.combat.plan = { round: 0, reader: null, intent: guard };
  play(prepared, 'attack');
  assert.equal(prepared.combat.round, 1);
  assert.equal(view(prepared).chargingWeapon.id, 'anvil_hammer');
  prepared.combat.plan = { round: 1, reader: null, intent: remedy };
  prepared.combat.medicineLeft = 1;
  const missed = structuredClone(prepared);
  const day = prepared.day;
  prepared.enemyEvadeSeed = seedBetween(0.80, 0.83);
  const hit = play(prepared, 'attack');
  assert.ok(hit.damageDealt > 0);
  assert.match(hit.message, /这一击打断/);
  assert.equal(hit.enemyMove.name, '取药时被打断');
  assert.equal(prepared.combat.hp, 68 - hit.damageDealt);
  assert.equal(prepared.combat.medicineLeft, 1);
  assert.equal(prepared.combat.round, 2);
  assert.equal(prepared.day - day, rules.battleDays);
  assert.equal(view(prepared).chargingWeapon, null);

  missed.enemyEvadeSeed = seedBetween(0.02, 0.03);
  const whiff = play(missed, 'attack');
  assert.equal(whiff.missed, true);
  assert.equal(missed.combat.hp, 68 + pills.tide_pill.hp);
  assert.equal(missed.combat.medicineLeft, 0);

  const ordinary = staged(id, { realm: 5, hp: 68 });
  ordinary.combat.plan = { round: 0, reader: null, intent: remedy };
  ordinary.enemyEvadeSeed = seedBetween(0.80, 0.83);
  const quick = play(ordinary, 'attack');
  assert.ok(quick.damageDealt > 0);
  assert.equal(ordinary.combat.hp, 68 - quick.damageDealt + pills.tide_pill.hp);
  assert.equal(ordinary.combat.medicineLeft, 0);
});

test('a bandit who reads medicine releases a prepared strike, but a dodge lets the dose through', () => {
  const id = 'bandit_den_leader';
  const target = enemies[id];
  const state = staged(id, { realm: 7, items: ['frost_robe', 'bandit_salt_boots'] });
  const priorGuard = target.intents.find(({ kind }) => kind === 'guard');
  const focus = target.intents.find(({ kind }) => kind === 'focus');
  state.combat.plan = { round: 0, reader: null, intent: focus };
  play(state, 'guard');
  assert.equal(state.combat.enemyCharged, true);
  state.combat.plan = { round: 1, reader: 'enemy', intent: priorGuard };
  state.hp = 40;
  state.qi = 10;
  state.wounds = 1;
  state.toxin = 5;
  state.inventory.jade_pill = 1;
  const healedHp = state.hp + pills.jade_pill.hp;
  const restoredQi = state.qi + pills.jade_pill.qi;
  const miss = structuredClone(state);
  const unread = structuredClone(state);
  const meal = structuredClone(state);
  const day = state.day;
  state.evadeSeed = seedBetween(0.80, 0.83);
  miss.evadeSeed = seedBetween(0.01, 0.02);
  meal.evadeSeed = state.evadeSeed;
  unread.combat.plan.reader = null;

  const blocked = play(state, 'use', { id: 'jade_pill' });
  assert.equal(blocked.enemyMove.kind, 'heavy');
  assert.ok(blocked.damageTaken > 0);
  assert.match(blocked.message, /看破了你的起手.*打断。药还在手里/);
  assert.equal(state.hp, 40 - blocked.damageTaken);
  assert.equal(state.qi, 10);
  assert.equal(state.wounds, 1);
  assert.equal(state.toxin, 5);
  assert.equal(state.inventory.jade_pill, 1);
  assert.equal(state.combat.enemyCharged, false);
  assert.equal(state.combat.round, 2);
  assert.equal(state.day - day, rules.battleDays);

  const evaded = play(miss, 'use', { id: 'jade_pill' });
  assert.equal(evaded.dodged, true);
  assert.equal(miss.hp, healedHp);
  assert.equal(miss.qi, restoredQi);
  assert.equal(miss.inventory.jade_pill, undefined);
  assert.equal(miss.combat.enemyCharged, false);
  const noDose = act(miss, 'use', { id: 'jade_pill' });
  assert.equal(noDose.ok, false);
  assert.equal(miss.hp, healedHp);
  assert.equal(miss.combat.round, 2);

  const closed = play(unread, 'use', { id: 'jade_pill' });
  assert.equal(closed.enemyMove.kind, 'guard');
  assert.equal(unread.hp, healedHp);
  assert.equal(unread.inventory.jade_pill, undefined);
  assert.equal(unread.combat.enemyCharged, true);

  const supplies = meal.inventory.ration;
  assert.doesNotMatch(play(meal, 'eat', { id: 'ration' }).message, /打断/);
  assert.equal(meal.inventory.ration, supplies - 1);
});

test('an empty medicine supply cannot restore health even if a dose was already planned', () => {
  const state = staged('sand_sundial_master', { realm: 7, hp: 40 });
  state.combat.medicineLeft = 0;
  state.combat.plan = { round: 0, reader: null, intent: { kind: 'remedy', name: '喝下照心露' } };
  const result = play(state, 'guard');
  assert.match(result.message, /药袋，已经空了/);
  assert.equal(state.combat.hp, 40);
  assert.equal(state.combat.medicineLeft, 0);
  for (let turn = 0; state.combat && turn < 5; turn++) {
    assert.notEqual(play(state, 'guard').enemyMove?.kind, 'remedy');
  }
});

test('passive dodge combines compatible worn items with diminishing returns', () => {
  const duel = staged('sand_spine_lizard', { realm: 6, items: ['frost_robe', 'path_charm', 'reed_boots'] });
  const attack = enemies.sand_spine_lizard.intents.find(({ kind }) => kind === 'attack');
  duel.combat.plan = { round: 0, reader: null, intent: attack };
  const aboveChance = structuredClone(duel);
  const disabled = structuredClone(duel);
  const boots = duel.durability.reed_boots;
  duel.evadeSeed = seedBetween(0.22, 0.24);
  aboveChance.evadeSeed = seedBetween(0.28, 0.30);
  disabled.evadeSeed = duel.evadeSeed;
  disabled.durability.reed_boots = 0;
  assert.equal(play(duel, 'attack').dodged, true);
  assert.equal(duel.durability.reed_boots, boots - 1);
  assert.ok(play(aboveChance, 'attack').damageTaken > 0);
  assert.ok(play(disabled, 'attack').damageTaken > 0);
  const heavy = staged('sand_spine_lizard', { realm: 2, items: ['reed_boots'] });
  heavy.combat.plan = { round: 0, reader: null, intent: enemies.sand_spine_lizard.intents.find(({ kind }) => kind === 'heavy') };
  const seed = heavy.evadeSeed;
  assert.ok(play(heavy, 'attack').damageTaken > 0);
  assert.equal(heavy.evadeSeed, seed);
});

test('an active dodge can evade fast or heavy attacks, with worse odds against a shot', () => {
  const enemy = 'border_wind_ambusher';
  const shot = enemies[enemy].intents.find(({ kind, ranged }) => kind === 'heavy' && ranged);
  const duel = staged(enemy, { realm: 3 });
  duel.combat.plan = { round: 0, reader: null, intent: shot };
  const attainable = structuredClone(duel);
  const close = structuredClone(duel);
  close.combat.plan.intent.ranged = false;
  // With his accuracy, a roll between the shot and close-quarters odds separates the two.
  duel.evadeSeed = seedBetween(0.13, 0.15);
  close.evadeSeed = duel.evadeSeed;
  attainable.evadeSeed = seedBetween(0.01, 0.04);
  assert.equal(play(duel, 'dodge').dodged, false);
  assert.equal(play(close, 'dodge').dodged, true);
  assert.equal(play(attainable, 'dodge').dodged, true);
});

test('enemy specialties lead to different dodge, aim, and insight outcomes on the same rolls', () => {
  const agile = staged('sand_quarry_skink', { realm: 4 });
  const plated = staged('sand_quarry_rockscorpion', { realm: 4 });
  agile.enemyEvadeSeed = plated.enemyEvadeSeed = seedBetween(0.07, 0.09);
  assert.equal(play(agile, 'attack').damageDealt, 0);
  assert.ok(play(plated, 'attack').damageDealt > 0);

  const viper = staged('sand_rattle_viper', { realm: 1 });
  const fox = staged('sand_salt_fox', { realm: 1 });
  viper.evadeSeed = fox.evadeSeed = seedBetween(0.20, 0.22);
  assert.equal(play(viper, 'dodge').dodged, false);
  assert.equal(play(fox, 'dodge').dodged, true);

  const seed = seedBetween(0.10, 0.12);
  const scorpion = staged('sand_riven_scorpion', { realm: 7, seed });
  const matriarch = staged('sand_quarry_matriarch', { realm: 7, seed });
  assert.equal(act(scorpion, 'selectAmmo', { id: 'bad_ammo' }).ok, false);
  assert.equal(act(matriarch, 'selectAmmo', { id: 'bad_ammo' }).ok, false);
  assert.equal(view(scorpion).combatRead, 'player');
  assert.equal(view(matriarch).combatRead, 'enemy');
});

test('both ordinary and charge-only weapons can be paired and selected in either hand', () => {
  const hammer = staged('ford_shale_crab', { realm: 4, items: ['anvil_hammer', 'side_hook', 'reed_hat', 'reed_boots', 'breath_belt'] });
  assert.equal(view(hammer).combatOffhand.name, '系绳短钩');
  assert.equal(view(hammer).combatWeapon.chargeRequired, true);
  const prepared = structuredClone(hammer);
  const quick = play(hammer, 'offhandAttack');
  assert.ok(quick.damageDealt > 0);
  assert.equal(hammer.durability.anvil_hammer, gear.anvil_hammer.durability);
  assert.equal(hammer.durability.side_hook, gear.side_hook.durability - 1);
  assert.equal(play(prepared, 'attack').damageDealt, 0);
  const pending = structuredClone(prepared);
  assert.equal(act(prepared, 'offhandAttack').ok, false);
  assert.deepEqual(prepared, pending);
  const heavy = play(prepared, 'attack');
  assert.ok(heavy.damageDealt > quick.damageDealt);
  assert.equal(view(prepared).chargingWeapon, null);

  const chisel = staged('ford_shale_crab', { realm: 4, items: ['iron_sword', 'scale_chisel'] });
  assert.equal(view(chisel).combatOffhand.chargeRequired, true);
  const plain = structuredClone(chisel);
  assert.ok(play(plain, 'attack').damageDealt > 0);
  assert.equal(play(chisel, 'offhandAttack').damageDealt, 0);
  assert.deepEqual(view(chisel).chargingWeapon, { slot: 'offhand', id: 'scale_chisel', name: '破鳞短凿' });
  assert.ok(play(chisel, 'offhandAttack').damageDealt > 0);
  assert.equal(view(chisel).chargingWeapon, null);
  assert.equal(chisel.durability.iron_sword, gear.iron_sword.durability);

  const quickPair = staged('ford_shale_crab', { realm: 2, items: ['iron_sword', 'side_hook'] });
  play(quickPair, 'attack');
  play(quickPair, 'offhandAttack');
  assert.equal(quickPair.durability.iron_sword, gear.iron_sword.durability - 1);
  assert.equal(quickPair.durability.side_hook, gear.side_hook.durability - 1);
  assert.equal(view(quickPair).chargingWeapon, null);
});

test('two charged hands keep separate preparations; manually letting go costs no time', () => {
  const state = staged('ford_shale_crab', { realm: 4, items: ['anvil_hammer', 'scale_chisel'] });
  const start = state.day;
  play(state, 'attack');
  assert.equal(view(state).chargingWeapon.slot, 'weapon');
  assert.equal(act(state, 'offhandAttack').ok, false);
  const seed = state.combatSeed;
  play(state, 'cancelCharge');
  assert.equal(state.combatSeed, seed);
  assert.equal(state.day - start, rules.battleDays);
  assert.equal(state.durability.anvil_hammer, gear.anvil_hammer.durability);
  assert.equal(view(state).chargingWeapon, null);
  assert.equal(play(state, 'offhandAttack').damageDealt, 0);
  assert.equal(view(state).chargingWeapon.slot, 'offhand');
  assert.equal(state.durability.scale_chisel, gear.scale_chisel.durability);
  assert.ok(play(state, 'offhandAttack').damageDealt > 0);
  assert.equal(state.durability.scale_chisel, gear.scale_chisel.durability - 1);
  assert.equal(state.day - start, 3 * rules.battleDays);
});

test('guarding abandons preparation and a strong hit scatters it before the next turn', () => {
  const defended = staged('ford_shale_crab', { realm: 2, items: ['anvil_hammer'] });
  play(defended, 'attack');
  play(defended, 'guard');
  assert.equal(view(defended).chargingWeapon, null);
  assert.equal(defended.durability.anvil_hammer, gear.anvil_hammer.durability);

  const struck = staged('sand_spine_lizard', { realm: 4, items: ['iron_sword', 'scale_chisel'] });
  const foeIntent = enemies.sand_spine_lizard.intents.find(({ kind }) => kind === 'heavy');
  struck.combat.plan = { round: 0, reader: null, intent: foeIntent };
  const preparing = play(struck, 'offhandAttack');
  assert.equal(preparing.damageDealt, 0);
  assert.ok(preparing.damageTaken >= rules.chargeBreakDamage);
  assert.equal(view(struck).chargingWeapon, null);
  assert.equal(struck.durability.scale_chisel, gear.scale_chisel.durability);
});

test('a weapon technique needs its own charged weapon and a bare-handed technique abandons the charge', () => {
  const state = staged('ford_shale_crab', { realm: 4, items: ['anvil_hammer', 'scale_chisel'] });
  state.knownArts.push('reed_cleave', 'tide_part');
  const start = structuredClone(state);
  assert.equal(act(state, 'art', { id: 'reed_cleave' }).ok, false);
  assert.equal(state.day, start.day);
  assert.equal(state.qi, start.qi);
  assert.deepEqual(state.durability, start.durability);

  const offhand = structuredClone(state);
  play(offhand, 'offhandAttack');
  const pending = structuredClone(offhand);
  assert.equal(act(offhand, 'art', { id: 'reed_cleave' }).ok, false);
  assert.deepEqual(offhand, pending);
  assert.ok(play(offhand, 'art', { id: 'tide_part' }).damageDealt > 0);
  assert.equal(view(offhand).chargingWeapon, null);
  assert.equal(offhand.durability.scale_chisel, gear.scale_chisel.durability);
  assert.equal(offhand.durability.anvil_hammer, gear.anvil_hammer.durability);

  play(state, 'attack');
  assert.ok(play(state, 'art', { id: 'reed_cleave' }).damageDealt > 0);
  assert.equal(state.day - start.day, 2 * rules.battleDays);
  assert.equal(view(state).chargingWeapon, null);
  assert.equal(state.durability.anvil_hammer, gear.anvil_hammer.durability - 1);
});
