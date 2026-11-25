import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

const reedManual = 'reed_hand_manual';
const forgeManual = 'forge_fist_manual';
const stepManual = 'shallows_step_manual';
const enemies = Object.fromEntries(data.enemies.map((enemy) => [enemy.id, enemy]));
const gear = Object.fromEntries(data.gear.map((entry) => [entry.id, entry]));

function play(state, action, payload = {}) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function deny(state, action, payload = {}) {
  const before = structuredClone(state);
  const result = act(state, action, payload);
  assert.equal(result.ok, false, `${action}: ${result.message}`);
  assert.deepEqual(state, before, `${action} changed state despite being refused`);
}

function equip(state, id) {
  state.inventory[id] = 1;
  state.durability[id] = gear[id].durability;
  play(state, 'equip', { id });
}

function claimReedBook(state) {
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'reed_banks' });
  play(state, 'choose', { index: 2 });
  play(state, 'leave');
  play(state, 'visit', { id: 'reed_ferryman' });
  return play(state, 'choose', { index: 4 });
}

function gather(state, index, id) {
  play(state, 'beginGather', { index });
  play(state, 'finishGather');
  play(state, 'take', { id });
}

function stage(state, id, kind) {
  const enemy = enemies[id];
  const intent = enemy.intents.find((entry) => entry.kind === kind);
  assert.ok(intent, `${enemy.name} has no ${kind} intent`);
  state.combat = { id, round: 0, hp: enemy.hp, escapeBonus: 0, plan: { round: 0, reader: null, intent } };
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  return state;
}

function manual(state, id) {
  return view(state).innerStyle?.books.find((book) => book.id === id);
}

function seedForRoll(min, max) {
  for (let seed = 0; seed < 20_000; seed++) {
    const roll = ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000;
    if (roll >= min && roll < max) return seed;
  }
  throw new Error('No seed for requested roll');
}

test('a new character can hunt bare-handed with their walking stick still equipped', () => {
  const hunt = (action) => {
    const state = createGame(731);
    assert.equal(view(state).innerStyle, null);
    play(state, 'travel', { id: 'marsh' });
    play(state, 'visit', { id: 'mud_track' });
    play(state, 'choose', { index: 2 });
    assert.equal(state.combat.id, 'reed_fox');
    assert.equal(view(state).combatFist.chargeAvailable, false);
    deny(state, 'fistCharge');
    const startingDay = state.day;
    let turns = 0;
    while (turns < 8 && state.combat) {
      play(state, view(state).intent?.kind === 'heavy' ? 'guard' : action);
      turns += 1;
    }
    assert.ok(state.defeated.includes('reed_fox'));
    assert.equal(state.equipment.weapon, 'cudgel');
    assert.equal(state.day, startingDay);
    return { hp: state.hp, turns, wear: gear.cudgel.durability - state.durability.cudgel };
  };
  const bare = hunt('fistAttack');
  const armed = hunt('attack');
  assert.equal(bare.wear, 0);
  assert.ok(armed.wear > 0);
  assert.ok(bare.hp > 0 && bare.hp <= armed.hp);
  assert.ok(bare.turns > armed.turns);
});

test('the ferryman introduces a single real book and a full bag leaves it available for collection', () => {
  const state = createGame(419);
  deny(state, 'equipManual', { id: reedManual });
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, view(state).backpackCapacity);
  const award = claimReedBook(state);
  assert.equal(award.spilled?.[reedManual], 1);
  assert.equal(state.ground.reed_ferryman[reedManual], 1);
  assert.equal(state.inventory[reedManual], undefined);
  assert.equal(view(state).innerStyle, null);
  deny(state, 'take', { id: reedManual });
  play(state, 'leave');
  play(state, 'visit', { id: 'reed_ferryman' });
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'take', { id: reedManual });
  assert.equal(state.inventory[reedManual], 1);
  assert.equal(manual(state, reedManual).rank, 1);
  assert.equal(view(state).innerStyle.active, null);
  play(state, 'equipManual', { id: reedManual });
  assert.equal(view(state).innerStyle.active.id, reedManual);
  deny(state, 'choose', { index: 4 });
  assert.equal(state.inventory[reedManual], 1);
});

test('the ferryman recipe makes usable knuckles, which wear on strikes until they break', () => {
  const state = createGame(731);
  claimReedBook(state);
  play(state, 'equipManual', { id: reedManual });
  play(state, 'leave');
  play(state, 'visit', { id: 'reed_banks' });
  gather(state, 0, 'reed');
  gather(state, 1, 'reed');
  play(state, 'leave');
  play(state, 'visit', { id: 'mud_track' });
  gather(state, 1, 'wood');
  play(state, 'choose', { index: 0 });
  for (let turn = 0; turn < 8 && state.combat; turn++) {
    play(state, view(state).intent?.kind === 'heavy' ? 'guard' : 'fistAttack');
  }
  assert.ok(state.defeated.includes('mud_beast'));
  play(state, 'take', { id: 'hide' });
  play(state, 'leave');
  play(state, 'eat', { id: 'ration' });
  play(state, 'visit', { id: 'reed_ferryman' });
  play(state, 'choose', { index: 0 });
  play(state, 'travel', { id: 'ridge' });
  play(state, 'eat', { id: 'ration' });
  play(state, 'visit', { id: 'ore_rain' });
  gather(state, 0, 'ore');
  play(state, 'leave');
  play(state, 'travel', { id: 'village' });
  const recipe = data.recipes.find(({ id }) => id === 'r_leather_knuckles');
  const book = state.inventory[reedManual];
  play(state, 'craft', { id: recipe.id });
  assert.equal(state.inventory[reedManual], book);
  assert.equal(state.inventory.leather_knuckles, 1);
  play(state, 'equip', { id: 'leather_knuckles' });
  state.durability.leather_knuckles = 1;
  stage(state, 'reed_fox', 'attack');
  assert.ok(view(state).combatFist.name.includes('指虎'));
  const armedDamage = play(state, 'fistAttack').damageDealt;
  assert.equal(state.durability.leather_knuckles, 0);
  stage(state, 'reed_fox', 'attack');
  assert.match(view(state).combatFist.name, /徒手/);
  assert.ok(play(state, 'fistAttack').damageDealt < armedDamage);
  assert.equal(state.durability.leather_knuckles, 0);
});

test('a single active inner style gives general strength and focuses the action that actually struck', () => {
  const source = createGame(523);
  source.inventory[reedManual] = 1;
  source.inventory.eaves_breath_manual = 1;
  equip(source, 'iron_sword');
  equip(source, 'side_hook');
  const baseline = structuredClone(source);
  const reed = structuredClone(source);
  play(reed, 'equipManual', { id: reedManual });
  const hit = (state, action) => play(stage(structuredClone(state), 'reed_fox', 'attack'), action).damageDealt;
  assert.equal(hit(reed, 'attack') - hit(baseline, 'attack'), 1);
  assert.equal(hit(reed, 'offhandAttack') - hit(baseline, 'offhandAttack'), 1);
  assert.equal(hit(reed, 'fistAttack') - hit(baseline, 'fistAttack'), 3);

  const eaves = structuredClone(source);
  play(eaves, 'equipManual', { id: 'eaves_breath_manual' });
  play(reed, 'equipManual', { id: 'eaves_breath_manual' });
  assert.equal(view(reed).innerStyle.active.id, 'eaves_breath_manual');
  assert.equal(view(reed).innerStyle.books.length, 2);
  for (const action of ['attack', 'offhandAttack', 'fistAttack']) {
    assert.equal(hit(reed, action), hit(eaves, action));
  }
  play(reed, 'unequipManual');
  assert.equal(view(reed).innerStyle.active, null);
  assert.equal(hit(reed, 'fistAttack'), hit(baseline, 'fistAttack'));
});

test('learned fist damage survives a broken main weapon and an empty quiver without using that weapon', () => {
  const state = createGame(205);
  state.inventory[reedManual] = 1;
  play(state, 'equipManual', { id: reedManual });
  equip(state, 'reed_bow');
  const hit = (source, action) => {
    const scenario = stage(structuredClone(source), 'reed_fox', 'attack');
    const { damageDealt } = play(scenario, action);
    return { damageDealt, durability: scenario.durability.reed_bow };
  };
  const dry = hit(state, 'attack');
  const bare = hit(state, 'fistAttack');
  assert.deepEqual(dry, bare);
  assert.equal(dry.durability, gear.reed_bow.durability);
  state.inventory.reed_arrow = 2;
  const loaded = hit(state, 'attack');
  assert.ok(loaded.damageDealt > bare.damageDealt);
  assert.equal(loaded.durability, gear.reed_bow.durability - 1);
  state.durability.reed_bow = 0;
  assert.deepEqual(hit(state, 'attack'), { damageDealt: bare.damageDealt, durability: 0 });
});

test('upgrading a real book checks the location, materials and payment before changing anything', () => {
  const state = createGame(424);
  claimReedBook(state);
  play(state, 'equipManual', { id: reedManual });
  deny(state, 'upgradeManual', { id: reedManual });
  play(state, 'leave');
  play(state, 'travel', { id: 'village' });
  let next = manual(state, reedManual).upgrade;
  assert.ok(next);
  assert.equal(next.available, false);
  assert.ok(next.need.length >= 2);
  const [missing, ...otherNeeds] = next.need;
  for (const { id, count } of otherNeeds) state.inventory[id] = count;
  if (missing.count > 1) state.economy.warehouse[missing.id] = missing.count - 1;
  deny(state, 'upgradeManual', { id: reedManual });
  state.economy.warehouse[missing.id] = missing.count;
  state.coins = next.coins - 1;
  deny(state, 'upgradeManual', { id: reedManual });
  state.coins = next.coins;
  next = manual(state, reedManual).upgrade;
  assert.equal(next.available, true);
  const day = state.day;
  play(state, 'upgradeManual', { id: reedManual });
  assert.equal(state.day, day + next.days);
  assert.equal(state.coins, 0);
  assert.equal(state.economy.warehouse[missing.id], undefined);
  for (const { id } of otherNeeds) assert.equal(state.inventory[id], undefined);
  assert.equal(manual(state, reedManual).rank, 2);
  assert.equal(view(state).innerStyle.active.rank, 2);
  const beforeProgress = structuredClone(state);
  beforeProgress.manualRanks[reedManual] = manual(state, reedManual).maxRank;
  assert.equal(manual(beforeProgress, reedManual).upgrade, null);
  deny(beforeProgress, 'upgradeManual', { id: reedManual });

  play(state, 'discard', { id: reedManual });
  assert.equal(view(state).innerStyle, null);
  assert.equal(state.activeManual, null);
  play(state, 'take', { id: reedManual });
  assert.equal(manual(state, reedManual).rank, 2);
  assert.equal(view(state).innerStyle.active, null);

  play(state, 'equipManual', { id: reedManual });
  play(state, 'econDeposit', { id: reedManual });
  assert.equal(state.economy.warehouse[reedManual], 1);
  assert.equal(view(state).innerStyle, null);
  assert.equal(state.activeManual, null);
  play(state, 'econWithdraw', { id: reedManual });
  assert.equal(state.economy.warehouse[reedManual], undefined);
  assert.equal(manual(state, reedManual).rank, 2);
  assert.equal(view(state).innerStyle.active, null);
});

function forgeFighter(rank, enemy = 'ford_shale_crab', intent = 'guard') {
  const state = createGame(421);
  state.realm = 5;
  state.inventory[forgeManual] = 1;
  state.manualRanks[forgeManual] = rank;
  play(state, 'equipManual', { id: forgeManual });
  equip(state, 'iron_sword');
  return stage(state, enemy, intent);
}

test('forged-heart fists use two separate turns and wear no unrelated weapon', () => {
  const untrained = forgeFighter(1);
  assert.equal(view(untrained).combatFist.chargeAvailable, false);
  deny(untrained, 'fistCharge');

  const state = forgeFighter(2);
  assert.equal(view(state).combatFist.chargeAvailable, true);
  const { day, qi } = state;
  const ordinary = play(structuredClone(state), 'fistAttack');
  const preparation = play(state, 'fistCharge');
  assert.equal(preparation.damageDealt, 0);
  assert.equal(state.day - day, rules.battleDays);
  assert.equal(view(state).chargingWeapon.slot, 'fist');
  deny(state, 'attack');
  deny(state, 'unequipManual');
  const release = play(state, 'fistCharge');
  assert.ok(release.damageDealt > ordinary.damageDealt);
  assert.equal(state.day - day, 2 * rules.battleDays);
  assert.equal(state.qi, qi);
  assert.equal(state.durability.iron_sword, gear.iron_sword.durability);
  assert.equal(view(state).chargingWeapon, null);
});

test('a heavy reply scatters a charged fist and guarding also clears any stored preparation', () => {
  const interrupted = forgeFighter(2, 'sand_spine_lizard', 'heavy');
  const attack = play(interrupted, 'fistCharge');
  assert.ok(attack.damageTaken >= rules.chargeBreakDamage);
  assert.equal(attack.damageDealt, 0);
  assert.equal(view(interrupted).chargingWeapon, null);

  const defended = forgeFighter(2);
  play(defended, 'fistCharge');
  play(defended, 'guard');
  assert.equal(view(defended).chargingWeapon, null);
  assert.equal(defended.durability.iron_sword, gear.iron_sword.durability);
});

test('active evasion is a full turn, and the stepping manual recovers qi only on a real evasion', () => {
  const source = createGame(512);
  source.realm = 3;
  source.inventory[stepManual] = 1;
  play(source, 'equipManual', { id: stepManual });
  stage(source, 'reed_fox', 'heavy');
  source.qi = 5;
  const lowRoll = seedForRoll(0, 0.01);
  const highRoll = seedForRoll(0.6, 0.8);
  const evading = structuredClone(source);
  evading.evadeSeed = lowRoll;
  const result = play(evading, 'dodge');
  assert.equal(result.dodged, true);
  assert.equal(result.damageTaken, 0);
  assert.equal(result.damageDealt, 0);
  assert.equal(evading.day - source.day, rules.battleDays);
  assert.equal(evading.qi, source.qi + 1);
  assert.equal(evading.durability.straw_cape, source.durability.straw_cape);
  assert.equal(evading.encounterSeed, source.encounterSeed);

  const missed = structuredClone(source);
  const ordinary = structuredClone(source);
  missed.evadeSeed = highRoll;
  ordinary.evadeSeed = highRoll;
  const exposed = play(missed, 'dodge');
  assert.equal(exposed.dodged, false);
  assert.ok(exposed.damageTaken > 0);
  assert.equal(exposed.damageTaken, play(ordinary, 'fistAttack').damageTaken);
  assert.equal(missed.qi, source.qi);

  const notAttacked = structuredClone(source);
  notAttacked.combat.plan.intent = enemies.reed_fox.intents.find(({ kind }) => kind === 'guard');
  notAttacked.evadeSeed = lowRoll;
  const waiting = play(notAttacked, 'dodge');
  assert.equal(waiting.dodged, false);
  assert.equal(notAttacked.qi, source.qi);
});

test('manual-based passive evasion still works and two consecutive dodges admit the next blow', () => {
  const state = createGame(638);
  state.realm = 3;
  state.inventory[stepManual] = 1;
  play(state, 'equipManual', { id: stepManual });
  stage(state, 'reed_fox', 'heavy');
  state.qi = 5;
  const intent = enemies.reed_fox.intents.find(({ kind }) => kind === 'heavy');
  const roll = seedForRoll(0, 0.01);
  const outcomes = [];
  for (const action of ['fistAttack', 'dodge', 'dodge', 'dodge']) {
    state.combat.plan = { round: state.combat.round, reader: null, intent };
    state.evadeSeed = roll;
    outcomes.push(play(state, action));
  }
  assert.deepEqual(outcomes.map(({ dodged }) => dodged), [true, true, false, true]);
  assert.equal(state.qi, 8);
});

test('a precise weapon must actually be used to counter an evasive enemy', () => {
  const state = createGame(812);
  state.realm = 3;
  equip(state, 'trail_cutter');
  stage(state, 'zhao_rush_eel', 'attack');
  state.enemyEvadeSeed = seedForRoll(0.09, 0.10);
  const bare = structuredClone(state);
  const precise = structuredClone(state);
  assert.equal(play(bare, 'fistAttack').damageDealt, 0);
  assert.equal(bare.combat.observedHits?.length ?? 0, 0);
  assert.equal(bare.durability.trail_cutter, gear.trail_cutter.durability);
  const landed = play(precise, 'attack');
  assert.ok(landed.damageDealt > 0);
  assert.equal(precise.combat.observedHits.at(-1).damage, landed.damageDealt);
  assert.equal(precise.durability.trail_cutter, gear.trail_cutter.durability - 1);
});
