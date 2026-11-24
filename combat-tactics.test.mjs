import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseEnemyIntent } from './combat-tactics.mjs';

const hit = { kind: 'attack', name: '试手', mult: 1 };
const shield = { kind: 'guard', name: '收臂', mult: 1.5 };
const heavy = { kind: 'heavy', name: '重砸', mult: 1.5 };
const heal = { kind: 'heal', name: '缓气', mult: 0.6 };
const drain = { kind: 'drain', name: '抽气', mult: 0.9 };
const fighter = { hp: 100, atk: 20, def: 8, intents: [hit, shield, heavy, heal, drain] };
const defender = { ...fighter, strategy: 'bulwark' };
const context = { round: 0, hp: 60, charged: false };
const samples = (...damages) => damages.map((damage) => ({ damage, guarded: false }));

test('choosing a move only needs enemy state, past direct hits, and a successfully read category', () => {
  const hiddenInputs = (read) => ({
    ...context,
    round: 2,
    read,
    observedHits: samples(10),
    get player() { assert.fail('cannot see the player stat block'); },
    get assess() { assert.fail('cannot forecast the pending action'); },
  });
  assert.equal(chooseEnemyIntent(fighter, hiddenInputs()), heavy);
  assert.equal(chooseEnemyIntent(defender, hiddenInputs()), heavy);
  assert.equal(chooseEnemyIntent(defender, hiddenInputs({ kind: 'focus' })), heavy);
});

test('an opponent guards when its measured pressure suggests danger but must answer the next strike', () => {
  const endangered = { ...context, hp: 9, read: { kind: 'strike' }, observedHits: samples(10) };
  assert.equal(chooseEnemyIntent(defender, endangered), shield);
  assert.equal(chooseEnemyIntent(defender, { ...endangered, previousKind: 'guard' }), hit);
  assert.equal(chooseEnemyIntent(defender, { ...endangered, observedHits: [{ damage: 9, guarded: true }] }), hit);
});

test('observed pressure starts after one hit and rises or falls with more recent hits', () => {
  const exposed = { ...context, hp: 50, read: { kind: 'strike' } };
  assert.equal(chooseEnemyIntent(defender, exposed), hit);
  assert.equal(chooseEnemyIntent(defender, { ...exposed, observedHits: samples(22) }), shield);
  assert.equal(chooseEnemyIntent(defender, { ...exposed, observedHits: samples(4, 5, 21) }), shield);
  assert.equal(chooseEnemyIntent(defender, { ...exposed, observedHits: samples(21, 5, 4) }), hit);
  assert.equal(chooseEnemyIntent({ ...fighter, strategy: 'predator' }, { ...exposed, observedHits: samples(4, 5, 21) }), hit);
});

test('preparing exposes a player to physical attack, and a tactical opponent may charge into a brace', () => {
  const examiner = { ...fighter, strategy: 'duelist' };
  const focusRead = { ...context, read: { kind: 'focus' } };
  assert.equal(chooseEnemyIntent(fighter, focusRead), hit);
  assert.equal(chooseEnemyIntent(examiner, focusRead), heavy);
  assert.equal(chooseEnemyIntent(examiner, { ...focusRead, previousKind: 'heavy' }), hit);
  assert.equal(chooseEnemyIntent(examiner, { ...context, read: { kind: 'brace' } }).kind, 'focus');
  assert.equal(chooseEnemyIntent(examiner, { ...context, charged: true, read: { kind: 'brace' } }), hit);
  assert.equal(chooseEnemyIntent(fighter, { ...context, read: { kind: 'brace' } }), hit);
});

test('opponents spend an opening on recovery only while injured and do not heal twice in a row', () => {
  const exposed = { ...context, hp: 30, round: 2, previousKind: 'attack', read: { kind: 'recover' }, observedHits: samples(7) };
  assert.equal(chooseEnemyIntent(defender, exposed), heal);
  assert.equal(chooseEnemyIntent(defender, { ...exposed, previousKind: 'heal' }), hit);
  assert.equal(chooseEnemyIntent(defender, { ...exposed, hp: 3, read: { kind: 'strike' }, observedHits: samples(9) }), heavy);
  assert.equal(chooseEnemyIntent({ ...fighter, strategy: 'schemer' }, { ...exposed, hp: 60 }), drain);
});

test('a wounded opponent takes a safe opening to use a dose or weighs it against observed danger', () => {
  const medicine = { id: 'heal_pill', name: '合络丹', hp: 16, action: '吞了一枚合络丹' };
  const recovery = { kind: 'remedy', name: medicine.action };
  const depleted = { ...context, hp: 38, medicine };
  for (const kind of ['brace', 'focus', 'recover', 'switch']) {
    assert.deepEqual(chooseEnemyIntent(defender, { ...depleted, read: { kind }, observedHits: samples(40) }), recovery);
  }
  assert.deepEqual(chooseEnemyIntent(defender, { ...depleted, observedHits: samples(6) }), recovery);
  assert.equal(chooseEnemyIntent(defender, { ...depleted, observedHits: samples(42) }), hit);
  assert.equal(chooseEnemyIntent(defender, depleted), hit);
  assert.equal(chooseEnemyIntent(defender, { ...context, medicine, hp: 98, read: { kind: 'recover' } }), hit);
});

test('a medicine cooldown also covers innate healing and a depleted supply gives no medicine action', () => {
  const medicine = { id: 'heal_pill', name: '合络丹', hp: 16 };
  const exposed = { ...context, hp: 30, medicine, round: 3, read: { kind: 'recover' } };
  assert.deepEqual(chooseEnemyIntent(defender, exposed), { kind: 'remedy', name: '服下合络丹' });
  for (const previousKind of ['heal', 'remedy']) {
    assert.equal(chooseEnemyIntent(defender, { ...exposed, previousKind }), hit);
  }
  assert.equal(chooseEnemyIntent(defender, { ...exposed, medicine: undefined }), heal);
});
