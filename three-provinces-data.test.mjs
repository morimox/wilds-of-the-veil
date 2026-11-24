import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './data.mjs';
import { createGame } from './engine.mjs';
import { trainingData } from './training.mjs';

const byId = (rows) => new Map(rows.map((row) => [row.id, row]));
const regions = byId(data.regions);
const items = byId(data.items);
const enemies = byId(data.enemies);
const sites = byId(data.sites);
const events = byId(data.events);
const provinceOf = (id) => data.regionDetails[id].province;

test('each province has twenty distinct marked places, local scenes, usable inns and its own array', () => {
  assert.equal(data.provinces.length, 3);
  assert.equal(data.regions.length, 60);
  assert.equal(regions.size, 60);
  assert.equal(Object.keys(data.regionDetails).length, 60);
  for (const { id: province } of data.provinces) {
    const places = data.regions.filter(({ id }) => provinceOf(id) === province);
    const details = places.map(({ id }) => data.regionDetails[id]);
    assert.equal(places.length, 20, province);
    assert.equal(new Set(details.map(({ x, y }) => `${x},${y}`)).size, 20, province);
    assert.ok(details.every(({ x, y }) => x > 0 && x < 100 && y > 0 && y < 100), province);
    assert.ok(details.filter(({ settlement }) => settlement && settlement.inn !== false).length >= 2, province);
    assert.ok(details.filter(({ portal }) => portal).length >= 2, province);
    assert.equal(details.filter(({ array, settlement }) => array && settlement).length, 1, province);
    assert.ok(places.some(({ tier }) => tier === 0) && places.some(({ tier, secret }) => tier >= 5 && secret), province);
    const localFights = data.sites.filter(({ region }) => provinceOf(region) === province)
      .flatMap(({ creatures }) => Object.keys(creatures ?? {})).map((enemy) => enemies.get(enemy));
    assert.ok(localFights.some(({ tier }) => tier <= 1), province);
    assert.ok(localFights.some(({ tier, sparring }) => tier >= 3 && sparring), province);
  }
  for (const { id } of data.regions) {
    const links = data.regionDetails[id].links;
    assert.ok(links.every((to) => regions.has(to) && to !== id), id);
    assert.equal(new Set(links).size, links.length, id);
    if (id !== 'village') assert.ok(data.sites.some(({ region }) => region === id), id);
  }
});

test('new scene requirements, guarded gains and enemy bodies reference real things', () => {
  assert.equal(sites.size, data.sites.length);
  assert.equal(events.size, data.events.length);
  assert.equal(items.size, data.items.length);
  assert.equal(enemies.size, data.enemies.length);
  assert.equal(data.sites.length, data.events.length);
  const animalParts = new Set(['beast_meat', 'hide', 'beast_eye']);
  const officialOpponents = new Set(data.tournament.matches.map(({ enemy }) => enemy));
  for (const enemy of data.enemies) {
    const { id, intents, tags, tier = 0, sparring } = enemy;
    assert.ok(intents.some(({ kind }) => kind === 'attack'), id);
    assert.ok(intents.some(({ kind }) => kind === 'heavy'), id);
    const loot = Object.keys(enemy.loot ?? {});
    if (sparring) {
      assert.ok(tags.includes('human'), id);
      const hosts = data.sites.filter((site) => site.creatures?.[id] || (site.id === data.tournament.site && officialOpponents.has(id)));
      assert.ok(hosts.length > 0 && hosts.every(({ protectedArena }) => protectedArena), id);
    }
    if (tags.includes('human')) assert.equal(loot.length, 0, id);
    const core = tier < 3 ? 'qi_core' : tier < 6 ? 'foundation_core' : 'gold_core';
    assert.ok(loot.every((key) => key === core || animalParts.has(key)), id);
  }
  for (const site of data.sites) {
    assert.ok(regions.has(site.region), site.id);
    const choices = events.get(site.id).choices;
    const pools = Object.entries(site.stocks ?? {});
    const creatures = site.creatures ?? {};
    for (const [index, action] of choices.entries()) {
      for (const enemy of [action.enemy, action.guardedBy, action.afterFight, action.ambush?.enemy].filter(Boolean)) {
        assert.ok(enemies.has(enemy) && creatures[enemy], `${site.id}:${index}:${enemy}`);
        assert.ok(choices.some((choice) => choice.enemy === enemy), `${site.id}:${index}:${enemy}`);
      }
      if (action.ambush) assert.ok(action.ambush.chance > 0 && action.ambush.chance < 1, site.id);
      for (const id of Object.keys(action.need ?? {})) assert.ok(items.has(id), `${site.id}:${index}:${id}`);
      for (const id of Object.keys(action.loot ?? {})) {
        assert.ok(items.has(id), `${site.id}:${index}:${id}`);
        const stock = pools.filter(([key, pool]) => (pool.item ?? key) === id && pool.choices.includes(index));
        assert.ok(stock.length <= 1, `${site.id}:${index}:${id}`);
        const tradesMaterials = action.consume && Object.keys(action.need ?? {}).length > 0;
        assert.ok(stock.length || site.once?.includes(index) || action.perWin || tradesMaterials, `${site.id}:${index}:${id}`);
      }
    }
    for (const [key, pool] of pools) {
      assert.ok(pool.start <= pool.cap && pool.start >= 0, `${site.id}:${key}`);
      for (const index of pool.choices) {
        assert.ok(choices[index].loot[pool.item ?? key] > 0 && choices[index].days > 0, `${site.id}:${index}:${key}`);
      }
    }
  }
  for (const { id, lead, region, ranks } of trainingData) {
    assert.ok(items.has(lead), id);
    assert.ok(data.regionDetails[region].settlement, id);
    assert.equal(ranks.length, 3, id);
    assert.ok(ranks.every(({ coins, days, need }) => coins > 0 && days > 0 && Object.keys(need).every((key) => items.has(key))), id);
  }
  for (const { id, site, lead, reward } of data.mechanisms) {
    assert.ok(sites.has(site), id);
    if (lead) assert.ok(items.has(lead.item), id);
    for (const key of Object.keys(reward ?? {})) assert.ok(items.has(key), `${id}:${key}`);
  }
});

function followStory(permitOnly) {
  const initial = createGame(72);
  const reached = new Set(initial.discovered);
  const goods = new Set(Object.keys(initial.inventory));
  const actions = new Set();
  const victories = new Set();
  const quests = new Set();
  const has = (need) => Object.keys(need ?? {}).every((id) => goods.has(id));
  const revealed = (lead) => !lead || ((!lead.item && !lead.quest) || goods.has(lead.item) || quests.has(lead.quest)) && has(lead.need);
  const grant = (loot) => Object.keys(loot ?? {}).forEach((id) => goods.add(id));
  const mechanisms = new Map(data.mechanisms.map((mechanism) => [mechanism.site, mechanism]));
  const towns = Object.entries(data.regionDetails);
  const roads = new Map(towns.map(([id, detail]) => [id,
    towns.filter(([other, value]) => detail.links.includes(other) || value.links.includes(id)).map(([other]) => other),
  ]));
  function knownCrossing(from, to) {
    const edge = [from, to];
    if (edge.includes('ford') && edge.includes('zhao_city')) return goods.has('ferry_manifest') || quests.has('last_lantern');
    if (edge.includes('zhao_pass') && edge.includes('mingsha_city')) return goods.has('sand_writ');
    return true;
  }
  const stateSize = () => reached.size + goods.size + actions.size + victories.size + quests.size;
  let previousSize;
  do {
    previousSize = stateSize();
    for (const id of reached) {
      for (const to of roads.get(id)) {
        if (knownCrossing(id, to) && revealed(regions.get(to).reveal)) reached.add(to);
      }
      grant(data.regionDetails[id].settlement?.goods);
    }
    for (const quest of data.quests) {
      if (permitOnly && quest.id === 'last_lantern') continue;
      if (reached.has(quest.region ?? 'village') && revealed(quest.reveal) && has(quest.need) &&
          (!quest.requireQuest || quests.has(quest.requireQuest))) {
        quests.add(quest.id);
        grant(quest.reward);
      }
    }
    for (const site of data.sites) {
      if (!reached.has(site.region) || !revealed(site.reveal) || (site.afterChoices?.length && !site.afterChoices.some((key) => actions.has(key)))) continue;
      const { choices, experiment } = events.get(site.id);
      for (const [index, choice] of choices.entries()) {
        if (!has(choice.need) || (choice.afterFight && !victories.has(`${site.id}:${choice.afterFight}`))) continue;
        actions.add(`${site.id}:${index}`);
        grant(choice.loot);
        if (choice.enemy) {
          victories.add(`${site.id}:${choice.enemy}`);
          grant(enemies.get(choice.enemy).loot);
        }
      }
      if (experiment && has(experiment.need)) grant(experiment.reward);
      const mechanism = mechanisms.get(site.id);
      if (mechanism && (!mechanism.lead || goods.has(mechanism.lead.item))) grant(mechanism.reward);
    }
  } while (previousSize !== stateSize());
  return { goods, reached };
}

test('the alternate boat document can expose all three provinces and late proof has no narrative cycle', () => {
  assert.deepEqual(createGame(72).discovered, ['village', 'marsh']);
  const { goods, reached } = followStory(true);
  assert.deepEqual(data.regions.filter(({ id }) => !reached.has(id)).map(({ id }) => id), []);
  for (const id of ['ferry_manifest', 'sand_writ', 'echo_tuning_key', 'undertow_wedge', 'cold_kiln_record', 'heart_silt',
    'stillwell_salt', 'gate_scroll_formula', 'gold_formula']) assert.ok(goods.has(id), id);
});

test('late evidence and special materials are tied to their particular jobs or locations', () => {
  function sitesYielding(key) {
    return data.events.filter(({ choices }) => choices.some(({ loot }) => loot?.[key])).map(({ id }) => sites.get(id).region);
  }
  assert.deepEqual(sitesYielding('echo_tuning_key'), ['sand_bell_cloister']);
  assert.deepEqual(sitesYielding('stillwell_salt'), ['stillwell_vault']);
  assert.deepEqual(sitesYielding('cold_kiln_record'), ['cold_kiln']);
  assert.deepEqual(sitesYielding('heart_silt'), ['undertow_grotto']);
  assert.deepEqual(sitesYielding('gate_scroll_formula'), ['counter_bell']);
  assert.deepEqual(sitesYielding('sand_archive_trace'), []);
  assert.deepEqual(data.mechanisms.filter(({ reward }) => reward?.sand_archive_trace).map(({ site }) => sites.get(site).region), ['chalk_hoof_trail']);
  const receipt = data.events.find(({ experiment }) => experiment?.id === 'gold_assay').experiment;
  assert.deepEqual(receipt.reward, { gold_formula: 1 });
  assert.ok(['cold_kiln_record', 'stillwell_salt', 'heart_silt', 'phase_chart'].every((id) => receipt.need[id] === 1));
});
