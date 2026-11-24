import assert from 'node:assert/strict';
import test from 'node:test';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function hunt(state, site, index) {
  play(state, 'visit', { id: site });
  play(state, 'choose', { index });
}

function prepareBow() {
  const state = createGame(25);
  play(state, 'travel', { id: 'marsh' });
  play(state, 'visit', { id: 'reed_banks' });
  for (const index of [0, 1]) {
    play(state, 'beginGather', { index });
    play(state, 'finishGather');
    play(state, 'take', { id: 'reed' });
  }
  play(state, 'eat');
  play(state, 'leave');
  play(state, 'visit', { id: 'mud_track' });
  for (let batch = 0; batch < 2; batch += 1) {
    play(state, 'beginGather', { index: 1 });
    play(state, 'finishGather');
    play(state, 'take', { id: 'wood' });
  }
  play(state, 'leave');
  play(state, 'travel', { id: 'village' });
  play(state, 'craft', { id: 'r_reed_bow' });
  play(state, 'craft', { id: 'r_reed_arrow' });
  play(state, 'equip', { id: 'reed_bow' });
  play(state, 'rest');
  play(state, 'eat');
  play(state, 'travel', { id: 'marsh' });
  return state;
}

test('an opening arrow against a visible charge spends one arrow and one turn, and only stops the first hit', () => {
  const state = prepareBow();
  const melee = structuredClone(state);
  play(melee, 'equip', { id: 'cudgel' });
  hunt(state, 'mud_track', 2);
  hunt(melee, 'mud_track', 2);
  state.combat.plan.reader = 'player';
  melee.combat.plan.reader = 'player';
  assert.equal(view(state).intent.name, view(melee).intent.name);
  assert.equal(view(state).openingShotReady, true);
  assert.equal(view(melee).openingShotReady, false);
  assert.ok(play(melee, 'attack').damageTaken > 0);

  const day = state.day;
  const ammo = state.inventory.reed_arrow;
  const durability = state.durability.reed_bow;
  const first = play(state, 'attack');
  assert.match(first.message, /拦住了苇尾狐的冲势/);
  assert.equal(first.damageTaken, 0);
  assert.ok(first.damageDealt > 0);
  assert.equal(state.day, day + rules.battleDays);
  assert.equal(state.inventory.reed_arrow, ammo - 1);
  assert.equal(state.durability.reed_bow, durability - 1);
  assert.equal(state.combat.round, 1);
  assert.equal(view(state).openingShotReady, false);
  play(state, 'guard');
  const later = play(state, 'attack');
  assert.equal(later.enemyMove.kind, 'heavy');
  assert.ok(later.damageTaken > 0);
});

test('an unloaded bow, a non-shot action, and a foe already within reach give no opening protection', () => {
  const prepared = prepareBow();
  const emptyBow = structuredClone(prepared);
  play(emptyBow, 'discard', { id: 'reed_arrow' });
  hunt(emptyBow, 'mud_track', 2);
  assert.equal(view(emptyBow).openingShotReady, false);
  assert.ok(play(emptyBow, 'attack').damageTaken > 0);

  const guarded = structuredClone(prepared);
  hunt(guarded, 'mud_track', 5);
  guarded.combat.plan.reader = null;
  assert.equal(view(guarded).openingShotPossible, true);
  assert.equal(view(guarded).openingShotReady, false);
  assert.doesNotMatch(play(guarded, 'guard').message, /拦住了/);
  assert.equal(guarded.inventory.reed_arrow, prepared.inventory.reed_arrow);
  assert.equal(view(guarded).openingShotReady, false);

  hunt(prepared, 'mud_track', 0);
  assert.equal(view(prepared).openingShotReady, false);
  assert.ok(play(prepared, 'attack').damageTaken > 0);
});

test('an outer bank provides range while an ambush or cave removes it', () => {
  const state = prepareBow();
  state.region = 'ford';
  state.discovered.push('ford');
  hunt(state, 'low_tide', 5);
  assert.equal(state.combat.id, 'mud_beast');
  assert.equal(view(state).openingShotPossible, true);
  assert.equal(play(state, 'attack').damageTaken, 0);

  const gatherer = prepareBow();
  gatherer.region = 'herb_basin';
  gatherer.discovered.push('herb_basin');
  gatherer.encounterSeed = 1;
  const hunter = structuredClone(gatherer);
  hunt(hunter, 'vine_pond', 0);
  assert.equal(hunter.combat.id, 'vine_stag');
  assert.equal(view(hunter).openingShotPossible, true);
  const missedShot = structuredClone(hunter);
  missedShot.enemyEvadeSeed = 1972;
  const missed = play(missedShot, 'attack');
  assert.match(missed.message, /侧身闪过/);
  assert.ok(missed.damageTaken > 0);
  hunter.enemyEvadeSeed = 0;
  assert.equal(play(hunter, 'attack').damageTaken, 0);
  play(gatherer, 'visit', { id: 'vine_pond' });
  play(gatherer, 'beginGather', { index: 2 });
  play(gatherer, 'finishGather');
  assert.equal(gatherer.combat.id, 'vine_stag');
  assert.equal(view(gatherer).openingShotPossible, false);
  assert.equal(view(gatherer).openingShotReady, false);
  assert.ok(play(gatherer, 'attack').damageTaken > 0);

  const cave = prepareBow();
  cave.region = 'herb_basin';
  cave.discovered.push('herb_basin');
  hunt(cave, 'mist_shelter', 1);
  if (cave.event) play(cave, 'leave');
  play(cave, 'eat');
  hunt(cave, 'herb_den', 0);
  assert.equal(view(cave).openingShotPossible, false);
  assert.equal(view(cave).openingShotReady, false);
  assert.ok(play(cave, 'attack').damageTaken > 0);
});

test('an art intercepts only when it actually uses the bow or crossbow', () => {
  const prepared = prepareBow();
  prepared.realm = 2;
  prepared.knownArts.push('reed_cleave', 'tide_part');
  const emptyHandArt = structuredClone(prepared);
  const crossbow = structuredClone(prepared);
  crossbow.inventory.black_crossbow = 1;
  crossbow.durability.black_crossbow = 36;
  crossbow.inventory.black_bolt = 1;
  play(crossbow, 'equip', { id: 'black_crossbow' });
  for (const state of [prepared, emptyHandArt, crossbow]) hunt(state, 'mud_track', 2);

  const art = play(emptyHandArt, 'art', { id: 'tide_part' });
  assert.ok(art.damageTaken > 0);
  assert.equal(emptyHandArt.inventory.reed_arrow, prepared.inventory.reed_arrow);
  assert.equal(emptyHandArt.durability.reed_bow, prepared.durability.reed_bow);
  assert.equal(view(emptyHandArt).openingShotReady, false);

  assert.match(play(prepared, 'art', { id: 'reed_cleave' }).message, /拦住了/);
  assert.match(play(crossbow, 'attack').message, /拦住了/);
  assert.equal(view(crossbow).combatWeapon.isLoaded, false);
  assert.equal(crossbow.inventory.black_bolt, undefined);
  assert.equal(crossbow.combat.round, 1);
});
