import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createGame, rules, view } from './engine.mjs';
import { data } from './data.mjs';

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.ok(result.ok, `${action}: ${result.message}`);
  return result;
}

function refuseWithoutMutation(state, action, payload) {
  const before = structuredClone(state);
  assert.equal(act(state, action, payload).ok, false);
  assert.deepEqual(state, before);
}

function accessScene(state, mechanism) {
  const site = data.sites.find(({ id }) => id === mechanism.site);
  assert.ok(site);
  state.region = site.region;
  if (!state.discovered.includes(site.region)) state.discovered.push(site.region);
  if (!state.eventsSeen[site.region]?.includes(site.id)) (state.eventsSeen[site.region] ??= []).push(site.id);
  play(state, 'visit', { id: site.id });
  return view(state).mechanism;
}

function winningMoves(mechanism) {
  if (mechanism.mode === 'sequence') return mechanism.solution;
  const initial = mechanism.dials.map(({ initial: index }) => index);
  const key = (setting) => JSON.stringify(setting);
  const goal = key(mechanism.solution);
  const visited = new Set([key(initial)]);
  const states = [{ setting: initial, history: [] }];
  for (let cursor = 0; cursor < states.length; cursor += 1) {
    const { setting, history } = states[cursor];
    if (goal === key(setting)) return history;
    for (const move of mechanism.moves) {
      const next = setting.map((index, i) => {
        const span = mechanism.dials[i].states.length;
        return ((index + (move.shift?.[i] ?? 0)) % span + span) % span;
      });
      if (visited.has(key(next))) continue;
      visited.add(key(next));
      states.push({ setting: next, history: [...history, move.id] });
    }
  }
  assert.fail(`${mechanism.id}: the initial readings cannot reach the solution`);
}

test('the six mechanisms use separate scenes and outside clues have their own source', () => {
  const state = createGame();
  assert.equal(view(state).mechanism, null);
  assert.equal(data.mechanisms.length, 6);
  assert.equal(new Set(data.mechanisms.map(({ site }) => site)).size, 6);
  assert.equal(data.mechanisms.filter(({ mode }) => mode === 'dials').length, 4);
  assert.equal(data.mechanisms.filter(({ mode }) => mode === 'sequence').length, 2);
  assert.deepEqual(data.mechanisms.filter(({ lead }) => !lead).map(({ id, failure }) => [id, failure?.damage ?? 0]),
    [['woven_lantern_hood', 0], ['grain_hatch_catch', 3]]);
  for (const mechanism of data.mechanisms.filter(({ lead }) => lead)) {
    const item = data.items.find(({ id }) => id === mechanism.lead.item);
    assert.ok(item?.kind === 'key' || item?.keepOnFall);
    assert.equal(item.price, 0);
    const sources = data.events.flatMap(({ id, choices }) => choices.flatMap((choice, index) =>
      choice.loot?.[item.id] ? [{ id, index, choice }] : []));
    assert.equal(new Set(sources.map(({ id }) => id)).size, 1);
    const source = data.sites.find(({ id }) => id === sources[0].id);
    const first = sources.filter(({ index }) => source.once.includes(index));
    assert.equal(first.length, 1);
    for (const { index, choice } of sources) {
      if (index === first[0].index) continue;
      assert.equal(choice.afterChoice, first[0].index);
      assert.ok(Object.entries(source.stocks ?? {}).some(([id, pool]) =>
        (pool.item ?? id) === item.id && pool.choices.includes(index) && pool.growth > 0));
    }
    assert.notEqual(source.region, data.sites.find(({ id }) => id === mechanism.site).region);
  }
  for (const action of ['mechanismMove', 'mechanismReset', 'mechanismTry']) refuseWithoutMutation(state, action);
});

for (const mechanism of data.mechanisms ?? []) {
  test(`field mechanism ${mechanism.id} observes, misfires and opens once`, () => {
    const state = createGame();
    const opening = accessScene(state, mechanism);
    assert.equal(opening.id, mechanism.id);
    assert.equal(opening.complete, false);
    assert.equal(opening.canMove, !mechanism.lead);
    assert.equal(opening.canReset, false);
    assert.equal(opening.canTry, !mechanism.lead);
    assert.equal(Object.hasOwn(opening, 'solution'), false);
    assert.equal(opening.readout.length, mechanism.dials?.length ?? 0);
    assert.deepEqual(opening.sequence, []);
    const sight = () => view(state).mechanism;

    assert.equal(opening.leadText, '');
    if (mechanism.lead) {
      assert.ok(mechanism.lead.item && mechanism.lead.blockedText);
      assert.equal(opening.reason, mechanism.lead.blockedText);
      state.knownItems.push(mechanism.lead.item);
      refuseWithoutMutation(state, 'mechanismMove', { id: opening.moves[0].id });
      refuseWithoutMutation(state, 'mechanismTry');
      state.inventory[mechanism.lead.item] = 1;
      assert.equal(sight().leadText, mechanism.lead.text);
    } else {
      assert.equal(opening.reason, '');
    }
    assert.equal(sight().canMove, true);
    assert.equal(sight().canTry, true);
    refuseWithoutMutation(state, 'mechanismMove', { id: 'not-installed-here' });
    refuseWithoutMutation(state, 'mechanismReset');
    const misguided = structuredClone(state);
    const fatal = mechanism.failure?.fatal ?? false;
    const damage = mechanism.failure?.damage ?? 0;
    if (fatal && mechanism.mode === 'sequence') play(misguided, 'mechanismMove', { id: opening.moves[0].id });
    if (fatal) {
      misguided.world.lastSettlement = 'mingsha_city';
      misguided.coins = 21;
      misguided.inventory.wood = 2;
      misguided.expeditionLoot.wood = 1;
    }
    const beforeMisfire = { day: misguided.day, insight: misguided.insight, hp: misguided.hp,
      satiety: misguided.satiety, inventory: { ...misguided.inventory } };
    const failure = play(misguided, 'mechanismTry');
    const elapsed = (mechanism.tryDays ?? 0.25) + (fatal ? rules.fallDays : 0);
    assert.ok(Math.abs(misguided.day - beforeMisfire.day - elapsed) < 0.001);
    assert.ok(Math.abs(misguided.satiety - Math.max(0, beforeMisfire.satiety - elapsed * rules.satietyDrainPerDay)) < 0.001);
    if (fatal || damage) assert.equal(failure.injury.cause, mechanism.miss);
    else assert.equal(failure.injury, undefined);
    assert.equal(misguided.insight, beforeMisfire.insight);
    assert.deepEqual(view(misguided).groundLoot, {});
    if (fatal) {
      assert.equal(failure.injury.amount, beforeMisfire.hp);
      assert.equal(failure.fell, true);
      assert.equal(misguided.region, 'mingsha_city');
      assert.ok(misguided.coins < 21);
      assert.equal(misguided.inventory.wood, 1);
      assert.equal(misguided.inventory[mechanism.lead.item], 1);
      assert.equal(misguided.wounds, rules.fallWounds);
      assert.equal(view(misguided).mechanism, null);
      const afterCollapse = accessScene(misguided, mechanism);
      assert.deepEqual(afterCollapse.sequence, opening.sequence);
      assert.deepEqual(afterCollapse.readout, opening.readout);
      assert.equal(afterCollapse.complete, false);
    } else {
      assert.equal(failure.message, mechanism.miss);
      assert.ok(!failure.fell);
      assert.equal(failure.injury?.amount ?? 0, damage);
      assert.equal(misguided.hp, beforeMisfire.hp - damage);
      assert.deepEqual(misguided.inventory, beforeMisfire.inventory);
      assert.equal(view(misguided).mechanism.complete, false);
      if (damage) {
        const weakened = structuredClone(state);
        weakened.hp = 1;
        const second = play(weakened, 'mechanismTry');
        assert.equal(second.fell, true);
        assert.equal(second.injury.amount, 1);
        assert.equal(weakened.region, 'village');
      }
    }

    const route = winningMoves(mechanism);
    assert.ok(route.length);
    const beforeMotion = state.day;
    play(state, 'mechanismMove', { id: route[0] });
    assert.ok(Math.abs(state.day - beforeMotion - (mechanism.moveDays ?? 0.125)) < 0.001);
    assert.equal(sight().canReset, true);
    const midway = { readout: sight().readout, sequence: sight().sequence };
    play(state, 'leave');
    assert.equal(view(state).mechanism, null);
    assert.deepEqual(accessScene(state, mechanism).readout, midway.readout);
    assert.deepEqual(sight().sequence, midway.sequence);
    play(state, 'mechanismReset');
    assert.deepEqual(sight().readout, opening.readout);
    assert.deepEqual(sight().sequence, opening.sequence);

    const priorSatiety = state.satiety;
    state.satiety = 0;
    assert.equal(sight().canTry, false);
    refuseWithoutMutation(state, 'mechanismTry');
    play(state, 'leave');
    state.satiety = priorSatiety;
    accessScene(state, mechanism);

    for (const id of route) play(state, 'mechanismMove', { id });
    if (mechanism.mode === 'sequence') {
      assert.deepEqual(sight().sequence.map(({ id }) => id), route);
      assert.equal(sight().sequence.every(({ label }) => label), true);
    }
    const padding = 'iron_arrow';
    state.inventory[padding] = (rules.backpackCapacity - view(state).backpackUsed) * rules.backpackStackSize;
    assert.equal(view(state).backpackUsed, rules.backpackCapacity);
    const earnedBefore = state.insight;
    assert.equal(play(state, 'mechanismTry').message, mechanism.success);
    assert.equal(sight().complete, true);
    assert.equal(sight().canTry, false);
    assert.equal(state.insight, earnedBefore + (mechanism.insight ?? 0));
    assert.deepEqual(view(state).groundLoot, mechanism.reward ?? {});
    refuseWithoutMutation(state, 'mechanismTry');
    refuseWithoutMutation(state, 'mechanismMove', { id: route[0] });
    refuseWithoutMutation(state, 'mechanismReset');
    play(state, 'leave');
    assert.deepEqual(view(state).groundLoot, {});
    accessScene(state, mechanism);
    assert.equal(sight().complete, true);
    assert.deepEqual(view(state).groundLoot, mechanism.reward ?? {});
    for (const [id, amount] of Object.entries(mechanism.reward ?? {})) {
      const item = data.items.find((row) => row.id === id);
      assert.ok(item);
      if ((view(state).groundPickup[id] ?? 0) < amount) {
        if (!view(state).groundPickup[id]) refuseWithoutMutation(state, 'take', { id });
        play(state, 'discard', { id: padding, count: rules.backpackStackSize });
      }
      const held = state.inventory[id] ?? 0;
      play(state, 'take', { id });
      assert.equal(state.inventory[id], held + amount);
    }
  });
}

test('both overfilled sequences report their physical capacity and reset without a reward', () => {
  for (const mechanism of data.mechanisms.filter(({ mode }) => mode === 'sequence')) {
    const state = createGame();
    if (mechanism.lead) state.inventory[mechanism.lead.item] = 1;
    const opening = accessScene(state, mechanism);
    for (let strike = 0; strike < opening.maxLength; strike += 1) play(state, 'mechanismMove', { id: opening.moves[0].id });
    const full = view(state).mechanism;
    assert.equal(full.canMove, false);
    assert.equal(full.canTry, true);
    assert.equal(full.sequence.length, full.maxLength);
    refuseWithoutMutation(state, 'mechanismMove', { id: opening.moves[0].id });
    play(state, 'mechanismReset');
    assert.deepEqual(view(state).mechanism.sequence, []);
    assert.deepEqual(view(state).groundLoot, {});
  }
});
