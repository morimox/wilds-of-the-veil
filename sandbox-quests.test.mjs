import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, rules, view } from './engine.mjs';
import { createQuietGame, prepareQuietRoad } from './game-test-fixtures.mjs';
import { sandboxQuestsEast } from './sandbox-quests-east.mjs';
import { sandboxQuestsWest } from './sandbox-quests-west.mjs';

const quests = [...sandboxQuestsWest, ...sandboxQuestsEast];
const sites = new Map(data.sites.map((site) => [site.id, site]));
const events = new Map(data.events.map((event) => [event.id, event]));
const items = new Map(data.items.map((item) => [item.id, item]));
const enemies = new Map(data.enemies.map((enemy) => [enemy.id, enemy]));
const regions = new Map(data.regions.map((region) => [region.id, region]));

function play(state, action, payload) {
  const result = act(state, action, payload);
  assert.equal(result.ok, true, action + ' at ' + state.region + ': ' + result.message);
  return result;
}

function leave(state) {
  if (state.event) play(state, 'leave');
}

function visit(state, id) {
  leave(state);
  play(state, 'visit', { id });
  assert.equal(view(state).currentEvent.id, id);
}

function walk(state, id) {
  leave(state);
  prepareQuietRoad(state);
  while (state.satiety < 75) play(state, 'eat');
  assert.ok(view(state).world.points.some((point) => point.id === id), 'Route should be discovered: ' + id);
  play(state, 'travel', { id });
  assert.equal(state.region, id);
}

function supply(state, need) {
  for (const [id, count] of Object.entries(need ?? {})) {
    state.inventory[id] = Math.max(state.inventory[id] ?? 0, count);
    if (!state.knownItems.includes(id)) state.knownItems.push(id);
  }
}

function visitFromRegionFixture(state, id) {
  leave(state);
  const site = sites.get(id);
  state.region = site.region;
  if (!state.discovered.includes(site.region)) state.discovered.push(site.region);
  for (const reveal of [regions.get(site.region).reveal, site.reveal]) {
    if (reveal?.item) supply(state, { [reveal.item]: 1 });
    if (reveal?.quest) state.completedQuests.push(reveal.quest);
    supply(state, reveal?.need);
  }
  const [prerequisite] = site.afterChoices ?? [];
  if (prerequisite && !state.seenChoices.includes(prerequisite)) state.seenChoices.push(prerequisite);
  visit(state, id);
}

function choiceNamed(state, label) {
  return view(state).visibleChoices.find((choice) => choice.label === label);
}

function collectClue(state, clue) {
  const choice = choiceNamed(state, clue.action.label);
  assert.ok(choice, 'Missing source choice for ' + clue.id);
  play(state, 'choose', { index: choice.index });
  assert.equal(state.inventory[clue.id], 1);
  assert.ok(view(state).activeClues.includes(clue.id));
  visit(state, clue.site);
  assert.equal(choiceNamed(state, clue.action.label), undefined);
  assert.equal(act(state, 'choose', { index: choice.index }).ok, false, 'The clue cannot be collected twice');
}

function defeatGuard(state, site, id) {
  const index = events.get(site).choices.findIndex((choice) => choice.enemy === id);
  assert.ok(index >= 0, 'Missing guard action at ' + site);
  play(state, 'choose', { index });
  assert.equal(state.combat.id, id);
  // Stage the last hit. Starting the fight and recording the victory both use normal actions.
  state.combat.hp = 1;
  for (let turn = 0; state.combat && turn < 12; turn += 1) play(state, 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.event, site);
  assert.ok(state.siteVictories[site]?.[id] > 0);
}

function meditateAndRecord(state, quest, clue) {
  const beforeQi = state.qi;
  const history = view(state).deductionHistory;
  assert.equal(play(state, 'meditate', { item: clue.id }).meditation, 'ready');
  assert.equal(state.qi, beforeQi - rules.deductionQiCost);
  const draft = view(state).deductionDraft;
  assert.equal(draft.id, quest.id);
  assert.deepEqual(draft.items.map((item) => item.id), quest.clues.map((item) => item.id));
  assert.equal(Object.hasOwn(draft, 'conclusion'), false);
  assert.deepEqual(view(state).deductionHistory, history);
  assert.equal(play(state, 'deduce', { id: quest.id }).deduction, 'recorded');
  assert.equal(view(state).deductionDraft, null);
  const { id, conclusion, reason, verified } = view(state).deductionHistory.at(-1);
  assert.deepEqual({
    id, conclusion, reason, verified,
  }, { id: quest.id, conclusion: quest.conclusion, reason: quest.reason, verified: false });
  const destination = sites.get(quest.site);
  assert.deepEqual(view(state).deductionHistory.at(-1).destination, {
    region: regions.get(destination.region).name, site: destination.name,
  });
  const archived = view(state);
  for (const { id } of quest.clues) {
    assert.ok(archived.usedClues.includes(id));
    assert.equal(archived.evidence.some((entry) => entry.id === id), false);
    assert.equal(act(state, 'meditate', { item: id }).ok, false);
  }
}

function verifyOnSite(state, quest) {
  visit(state, quest.site);
  assert.equal(view(state).experiment, null);
  if (state.qi < rules.deductionQiCost && state.inventory.qi_powder) play(state, 'use', { id: 'qi_powder' });
  meditateAndRecord(state, quest, quest.clues[0]);
  const { id, experiment } = quest;
  assert.equal(view(state).experiment.id, id);
  assert.equal(play(state, 'experiment', { id, settings: experiment.solution }).deduction, 'verified');
}

test('new sandbox cases have distinct, discoverable clues and real field controls in all three provinces', () => {
  assert.equal(quests.length, 22);
  assert.equal(new Set(quests.map((quest) => quest.site)).size, quests.length);
  const allClues = quests.flatMap((quest) => quest.clues);
  assert.equal(new Set(allClues.map((clue) => clue.id)).size, allClues.length);
  assert.deepEqual(new Set(quests.map((quest) => data.regionDetails[sites.get(quest.site).region].province)), new Set([
    'wuliang', 'zhaoyuan', 'mingsha',
  ]));
  const fresh = createQuietGame(833);
  assert.deepEqual(view(fresh).activeClues, []);
  assert.deepEqual(view(fresh).deductionHistory, []);
  assert.equal(view(fresh).deductionDraft, null);
  for (const clue of allClues) assert.equal(fresh.knownItems.includes(clue.id), false);
  for (const quest of quests) {
    const { clues, experiment, id, site } = quest;
    assert.ok(clues.length >= 2 && new Set(clues.map((clue) => clue.site)).size === clues.length);
    assert.equal(events.get(site).experiment.id, id);
    for (const clue of clues) {
      const source = events.get(clue.site);
      const index = source.choices.findIndex((choice) => choice.loot?.[clue.id] === 1);
      assert.ok(sites.get(clue.site).once.includes(index), clue.id);
      assert.equal(items.get(clue.id).name, clue.name);
    }
    for (const control of experiment.controls) {
      assert.ok(control.options.length >= 2);
      assert.ok(control.options.some((option) => option.id === experiment.solution[control.id]));
      for (const option of control.options.filter((row) => row.id !== experiment.solution[control.id])) {
        assert.ok(experiment.misses[control.id]?.[option.id], 'Missing field response: ' + id + '/' + option.id);
      }
    }
  }
});

for (const quest of quests) {
  test(quest.title + ' requires discovery, and its trial can fail without duplicating rewards', () => {
    const state = createQuietGame(833);
    state.realm = data.realms.at(-1).id;
    state.hp = 95;
    state.qi = 90;

    const [first] = quest.clues;
    for (const clue of quest.clues) {
      visitFromRegionFixture(state, clue.site);
      if (clue.action.afterFight) {
        assert.equal(choiceNamed(state, clue.action.label), undefined);
        defeatGuard(state, clue.site, clue.action.afterFight);
      }
      if (clue.action.guardedBy) {
        while (!choiceNamed(state, clue.action.label).available) defeatGuard(state, clue.site, clue.action.guardedBy);
        const returning = structuredClone(state);
        returning.day += 40;
        const choice = choiceNamed(returning, clue.action.label);
        assert.equal(choice.available, false);
        assert.equal(act(returning, 'choose', { index: choice.index }).ok, false);
        while (!choiceNamed(returning, clue.action.label).available) defeatGuard(returning, clue.site, clue.action.guardedBy);
      }
      if (clue.action.hidden && clue.action.need) assert.equal(choiceNamed(state, clue.action.label), undefined);
      supply(state, clue.action.need);
      collectClue(state, clue);
      if (clue === first) {
        const beforeQi = state.qi;
        assert.equal(play(state, 'meditate', { item: clue.id }).meditation, 'incomplete');
        assert.equal(state.qi, beforeQi - rules.deductionQiCost);
        assert.equal(view(state).deductionDraft, null);
        assert.equal(act(state, 'deduce', { id: quest.id }).ok, false);
      }
    }

    const { site, experiment, id } = quest;
    const correctly = { id, settings: experiment.solution };
    visitFromRegionFixture(state, site);
    assert.equal(view(state).experiment, null);
    assert.equal(act(state, 'experiment', correctly).ok, false);
    if (state.qi < rules.deductionQiCost) {
      supply(state, { qi_powder: 1 });
      play(state, 'use', { id: 'qi_powder' });
    }
    meditateAndRecord(state, quest, quest.clues.at(-1));
    if (experiment.afterFight) {
      const enemy = enemies.get(experiment.afterFight);
      const refused = act(state, 'experiment', correctly);
      assert.equal(refused.ok, false);
      assert.ok(refused.message.includes(enemy.name));
      defeatGuard(state, site, enemy.id);
    }
    if (experiment.guardedBy) {
      const enemy = enemies.get(experiment.guardedBy);
      while (view(state).experiment.blockedReason.includes(enemy.name)) defeatGuard(state, site, enemy.id);
      const returning = structuredClone(state);
      returning.day += 40;
      assert.ok(view(returning).experiment.blockedReason.includes(enemy.name));
      assert.match(act(returning, 'experiment', correctly).message, /又堵住了去路/);
      while (view(returning).experiment.blockedReason.includes(enemy.name)) defeatGuard(returning, site, enemy.id);
    }
    for (const [item, count] of Object.entries(experiment.fieldNeed ?? {})) {
      delete state.inventory[item];
      const refused = act(state, 'experiment', correctly);
      assert.equal(refused.ok, false);
      assert.ok(refused.message.includes(items.get(item).name));
      leave(state);
      assert.ok(view(state).revisitableEvents.some((event) => event.id === site));
      play(state, 'revisit', { id: site });
      supply(state, { [item]: count });
    }
    const prizes = Object.entries(experiment.reward ?? {});
    for (const control of experiment.controls) {
      for (const option of control.options.filter((row) => row.id !== experiment.solution[control.id])) {
        const tryAgain = structuredClone(state);
        const settings = { ...experiment.solution, [control.id]: option.id };
        const failed = play(tryAgain, 'experiment', { id, settings });
        assert.equal(failed.deduction, 'miss');
        assert.equal(failed.message, experiment.misses[control.id][option.id]);
        assert.ok(tryAgain.day > state.day);
        assert.equal(view(tryAgain).deductionHistory[0].verified, false);
        for (const [prize] of prizes) assert.equal(tryAgain.inventory[prize], state.inventory[prize]);
      }
    }
    const before = { ...state.inventory };
    assert.equal(play(state, 'experiment', correctly).deduction, 'verified');
    for (const [prize, count] of prizes) assert.equal(state.inventory[prize], (before[prize] ?? 0) + count);
    for (const [item] of Object.entries(experiment.fieldNeed ?? {})) assert.equal(state.inventory[item], before[item]);
    for (const skill of experiment.learnArts ?? []) assert.ok(state.knownArts.includes(skill));
    assert.equal(view(state).deductionHistory[0].verified, true);
    if (experiment.afterText) {
      assert.ok(view(state).currentEvent.text.startsWith(experiment.afterText));
      if (state.satiety === 0) {
        supply(state, { ration: 1 });
        play(state, 'eat', { id: 'ration' });
      }
      visit(state, site);
      assert.ok(view(state).currentEvent.text.startsWith(experiment.afterText));
    }
    const after = structuredClone(state);
    assert.equal(act(state, 'experiment', correctly).ok, false);
    assert.deepEqual(state, after);
  });
}

test('a fresh journey uncovers the marsh stove and the ferryman by actions at neighboring sites', () => {
  const state = createQuietGame(154);
  const quest = quests.find(({ id }) => id === 'rainproof_fire');
  supply(state, { ration: 8 });
  play(state, 'buy', { id: 'qi_powder' });
  walk(state, 'marsh');
  const [ferryman, soot] = quest.clues;
  const knowsSite = (id) => view(state).sites.some((site) => site.id === id);
  assert.equal(knowsSite(ferryman.site), false);
  assert.equal(knowsSite(soot.site), false);
  visit(state, 'reed_banks');
  play(state, 'choose', { index: 2 });
  assert.equal(knowsSite(ferryman.site), true);
  visit(state, ferryman.site);
  collectClue(state, ferryman);
  visit(state, 'mud_track');
  play(state, 'choose', { index: 3 });
  assert.equal(knowsSite(soot.site), true);
  visit(state, soot.site);
  collectClue(state, soot);
  verifyOnSite(state, quest);
  assert.equal(state.inventory.salve, 2);
});

test('sandboard offers usable clues, and a draft can be set aside without recording or spending anything', () => {
  const state = createQuietGame(154);
  const ready = quests.find(({ id }) => id === 'rainproof_fire');
  const partial = quests.find(({ id }) => id === 'select_millet').clues[0];
  supply(state, { clinic_note: 1 });
  for (const clue of [...ready.clues, partial]) {
    visitFromRegionFixture(state, clue.site);
    collectClue(state, clue);
  }
  assert.deepEqual(view(state).activeClues.sort(), [...ready.clues.map(({ id }) => id), partial.id].sort());
  const before = state.qi;
  assert.equal(act(state, 'meditate', { item: 'clinic_note' }).ok, false);
  assert.equal(state.qi, before);

  const item = ready.clues[0].id;
  play(state, 'meditate', { item });
  assert.equal(view(state).deductionDraft.id, ready.id);
  const after = { qi: state.qi, day: state.day, inventory: { ...state.inventory } };
  play(state, 'clearDeductionDraft');
  assert.deepEqual({ qi: state.qi, day: state.day, inventory: state.inventory }, after);
  assert.equal(view(state).deductionDraft, null);
  assert.equal(act(state, 'deduce', { id: ready.id }).ok, false);
  assert.deepEqual(view(state).deductionHistory, []);

  assert.equal(play(state, 'meditate', { item }).meditation, 'ready');
  assert.equal(play(state, 'meditate', { item: partial.id }).meditation, 'incomplete');
  assert.equal(view(state).deductionDraft, null);
});

test('the ferry and sand-road permits lead to discoveries at the reef and the salt works', () => {
  const state = createQuietGame(154);
  // Begin at the old ferry, after the earlier quest to find the ford.
  state.region = 'ford';
  state.world.arrived = true;
  state.coins = 100;
  supply(state, { wood: 16, ore: 2, hide: 3, ration: 30, qi_powder: 2 });
  assert.equal(view(state).world.points.some((point) => point.id === 'zhao_city'), false);
  visit(state, 'ford_packet_boat');
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory.ferry_manifest, 1);
  walk(state, 'zhao_city');

  const reef = quests.find(({ id }) => id === 'east_reef_light');
  const [nets, berth] = reef.clues;
  assert.equal(view(state).world.points.some((point) => point.id === 'beacon_reefs'), false);
  walk(state, 'flood_market');
  visit(state, berth.site);
  collectClue(state, berth);
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory.zhao_sand_chit, 1);
  walk(state, 'glass_bank');
  visit(state, nets.site);
  collectClue(state, nets);
  walk(state, 'beacon_reefs');
  verifyOnSite(state, reef);

  walk(state, 'glass_bank');
  walk(state, 'rope_sands');
  walk(state, 'zhao_pass');
  assert.equal(view(state).world.points.some((point) => point.id === 'mingsha_city'), false);
  visit(state, 'zhao_ridge_permit');
  play(state, 'choose', { index: 0 });
  assert.equal(state.inventory.sand_writ, 1);
  walk(state, 'mingsha_city');

  const salt = quests.find(({ id }) => id === 'east_salt_tare');
  const [invoice, sack] = salt.clues;
  assert.equal(view(state).world.points.some((point) => point.id === 'guest_mill'), false);
  visit(state, invoice.site);
  collectClue(state, invoice);
  walk(state, 'sand_bell_cloister');
  walk(state, 'silk_tent_road');
  walk(state, 'guest_mill');
  visit(state, sack.site);
  collectClue(state, sack);
  walk(state, 'salt_ledger_barrows');
  verifyOnSite(state, salt);
  assert.deepEqual(view(state).deductionHistory.map(({ id, verified }) => [id, verified]), [
    [reef.id, true],
    [salt.id, true],
  ]);
});

test('the bridge smith leaves the unique short hook at the bridge when the pack is full', () => {
  const state = createQuietGame(833);
  const quest = quests.find(({ id }) => id === 'east_bridge_copper');
  const [wedge, shortHook] = quest.clues;
  visitFromRegionFixture(state, wedge.site);
  collectClue(state, wedge);

  visitFromRegionFixture(state, 'sand_cloister_trial');
  assert.equal(view(state).sites.some((site) => site.id === shortHook.site), false);
  state.coins = 12;
  supply(state, { ore: 2, core: 1 });
  play(state, 'choose', { index: 0 });
  assert.ok(view(state).sites.some((site) => site.id === shortHook.site));
  visit(state, shortHook.site);
  collectClue(state, shortHook);

  visitFromRegionFixture(state, quest.site);
  meditateAndRecord(state, quest, wedge);
  const { backpackCapacity, backpackUsed } = view(state);
  const rationSlots = Math.ceil((state.inventory.ration ?? 0) / rules.backpackStackSize);
  state.inventory.ration = (backpackCapacity - backpackUsed + rationSlots) * rules.backpackStackSize;
  assert.equal(view(state).backpackUsed, backpackCapacity);
  const payload = { id: quest.id, settings: quest.experiment.solution };
  const award = play(state, 'experiment', payload);
  assert.equal(award.spilled.east_bridge_hook, 1);
  assert.equal(state.inventory.east_bridge_hook, undefined);
  assert.equal(view(state).groundPickup.east_bridge_hook, 0);
  assert.equal(act(state, 'take', { id: 'east_bridge_hook' }).ok, false);
  leave(state);
  assert.equal(view(state).groundLoot.east_bridge_hook, undefined);
  visit(state, quest.site);
  assert.equal(view(state).groundLoot.east_bridge_hook, 1);
  play(state, 'discard', { id: 'ration', count: rules.backpackStackSize });
  play(state, 'take', { id: 'east_bridge_hook' });
  assert.equal(state.inventory.east_bridge_hook, 1);
  assert.equal(act(state, 'experiment', payload).ok, false);
  assert.equal(act(state, 'discard', { id: 'east_bridge_hook' }).confirmation.id, 'east_bridge_hook');
});

test('the wheel keeper stops the trial on a loss and stays to operate the wheel after a win', () => {
  const state = createQuietGame(833);
  const site = 'sand_glass_chamber';
  const enemy = 'sand_sundial_master';
  const contest = events.get(site).choices.findIndex((choice) => choice.enemy === enemy);
  visitFromRegionFixture(state, site);
  const lost = structuredClone(state);
  lost.hp = 1;
  play(lost, 'choose', { index: contest });
  assert.equal(view(lost).currentEnemy.sparring, true);
  assert.equal(view(lost).currentEnemy.medicineRestricted, false);
  for (let turn = 0; lost.combat && turn < 12; turn += 1) play(lost, 'attack');
  assert.equal(lost.combat, null);
  assert.equal(lost.region, 'glass_rotunda');
  assert.equal(view(lost).currentEvent.id, site);
  assert.match(lost.log.at(-1), /收手/);
  assert.equal(view(lost).visibleChoices.some(({ index }) => index === 1), false);

  defeatGuard(state, site, enemy);
  assert.match(state.log.at(-1), /切磋|试招/);
  assert.equal(view(state).visibleChoices.some(({ index, available }) => index === 1 && available), true);
  play(state, 'choose', { index: 1 });
  assert.equal(state.inventory.qiankun_inner_pattern, 1);
});
