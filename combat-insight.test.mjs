import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, rules, view } from './engine.mjs';

const enemies = Object.fromEntries(data.enemies.map((enemy) => [enemy.id, enemy]));
const gear = Object.fromEntries(data.gear.map((entry) => [entry.id, entry]));

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
  assert.equal(before.intentDamage, null);
  assert.equal(before.retreatRisk, null);
  assert.equal(before.openingShotReady, false);
  assert.equal(before.combat.plan, undefined);
  assert.equal(before.currentEnemy.intents, undefined);
  assert.equal(view(swordsman).combatRead, 'player');
  assert.equal(view(swordsman).intent.kind, 'attack');
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
  const state = staged('sand_basket_mender', { realm: 7, items: ['tide_coat'], seed: seedBetween(0.05, 0.09) });
  assert.equal(act(state, 'selectAmmo', { id: 'bad_ammo' }).ok, false);
  assert.equal(view(state).combatRead, 'enemy');
  assert.equal(view(state).intent, null);
  assert.equal(view(state).retreatRisk, null);
  const wards = structuredClone(state);
  const charging = play(state, 'focus');
  assert.match(charging.message, /看破了你的起手/);
  assert.ok(['attack', 'heavy'].includes(charging.enemyMove.kind));
  assert.equal(view(state).combatCharge, false);

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
  const strong = staged('sand_basket_mender', { realm: 7, seed, items: ['foil_sword', 'tide_coat'] });
  weak.hp = 1;
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
  play(strong, 'combatEquip', { id: 'cudgel' });
  assert.equal(strong.combat.observedHits.length, 1);
  const next = play(strong, 'attack');
  assert.equal(strong.combat.observedHits[1].damage, next.damageDealt - next.reflectedDamage);
  assert.notEqual(first, strong.combat.observedHits[1].damage);
});

test('a safe charge spends time and strengthens exactly the next damaging attack', () => {
  const state = staged('ford_shale_crab');
  const start = state.day;
  const result = play(state, 'focus');
  assert.equal(result.enemyMove.kind, 'guard');
  assert.equal(state.day - start, rules.battleDays);
  assert.equal(view(state).combatCharge, true);
  const seed = state.combatSeed;
  assert.equal(act(state, 'focus').ok, false);
  assert.equal(state.combatSeed, seed);
  const plain = structuredClone(state);
  plain.combat.playerCharged = false;
  const bonus = Math.max(rules.combatChargeFloor, Math.ceil(view(state).attack * rules.combatChargeFactor));
  assert.equal(play(state, 'attack').damageDealt - play(plain, 'attack').damageDealt, bonus);
  assert.equal(view(state).combatCharge, false);
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
  assert.equal(state.combat.hp, 41 + 24);
  assert.equal(state.combat.medicineLeft, 0);
  for (let turn = 0; state.combat && turn < 4; turn++) {
    assert.notEqual(play(state, 'guard').enemyMove?.kind, 'remedy');
  }
});

test('dodge combines compatible worn items, respects the cap and only consumes a dodge roll for a damaging melee hit', () => {
  const duel = staged('sand_spine_lizard', { realm: 2, items: ['frost_robe', 'path_charm', 'reed_boots'] });
  const attack = enemies.sand_spine_lizard.intents.find(({ kind }) => kind === 'attack');
  duel.combat.plan = { round: 0, reader: null, intent: attack };
  const aboveCap = structuredClone(duel);
  const disabled = structuredClone(duel);
  const boots = duel.durability.reed_boots;
  duel.evadeSeed = seedBetween(0.26, 0.29);
  aboveCap.evadeSeed = seedBetween(0.31, 0.33);
  disabled.evadeSeed = duel.evadeSeed;
  disabled.durability.reed_boots = 0;
  assert.equal(play(duel, 'attack').dodged, true);
  assert.equal(duel.durability.reed_boots, boots - 1);
  assert.ok(play(aboveCap, 'attack').damageTaken > 0);
  assert.ok(play(disabled, 'attack').damageTaken > 0);
  const heavy = staged('sand_spine_lizard', { realm: 2, items: ['reed_boots'] });
  heavy.combat.plan = { round: 0, reader: null, intent: enemies.sand_spine_lizard.intents.find(({ kind }) => kind === 'heavy') };
  const seed = heavy.evadeSeed;
  assert.ok(play(heavy, 'attack').damageTaken > 0);
  assert.equal(heavy.evadeSeed, seed);
});

test('both ordinary and charge-only weapons can be paired and selected in either hand', () => {
  const hammer = staged('ford_shale_crab', { realm: 4, items: ['anvil_hammer', 'side_hook', 'reed_hat', 'reed_boots', 'breath_belt'] });
  assert.equal(view(hammer).combatOffhand.name, '系绳短钩');
  assert.equal(view(hammer).combatWeapon.chargeRequired, true);
  assert.equal(view(hammer).fogTolerance, rules.pressureThreshold + 1);
  const start = hammer.day;
  assert.equal(act(hammer, 'attack').ok, false);
  assert.equal(hammer.day, start);
  const prepared = structuredClone(hammer);
  const quick = play(hammer, 'offhandAttack');
  assert.ok(quick.damageDealt > 0);
  assert.equal(hammer.durability.anvil_hammer, gear.anvil_hammer.durability);
  assert.equal(hammer.durability.side_hook, gear.side_hook.durability - 1);
  play(prepared, 'focus');
  const heavy = play(prepared, 'attack');
  assert.ok(heavy.damageDealt > quick.damageDealt);
  assert.equal(view(prepared).combatCharge, false);

  const chisel = staged('ford_shale_crab', { realm: 4, items: ['iron_sword', 'scale_chisel'] });
  assert.equal(view(chisel).combatOffhand.chargeRequired, true);
  assert.equal(act(chisel, 'offhandAttack').ok, false);
  const plain = structuredClone(chisel);
  assert.ok(play(plain, 'attack').damageDealt > 0);
  play(chisel, 'focus');
  assert.ok(play(chisel, 'offhandAttack').damageDealt > 0);
  assert.equal(view(chisel).combatCharge, false);
  assert.equal(chisel.durability.iron_sword, gear.iron_sword.durability);
});
