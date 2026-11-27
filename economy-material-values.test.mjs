import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { act, createGame, view } from './engine.mjs';
import { materialBuyback, materialDemandRules, materialEconomy } from './economy-material-values.mjs';
import { localGoods } from './world.mjs';

const items = new Map(data.items.map(item => [item.id, item]));
const enemies = new Map(data.enemies.map(enemy => [enemy.id, enemy]));
const siteById = new Map(data.sites.map(site => [site.id, site]));
const events = new Map(data.events.map(event => [event.id, event]));
const appraisal = new Map(materialEconomy.map(row => [row.id, row]));

test('ordinary materials have low prices even when the same item can be collected under guard', () => {
  for (const item of data.items.filter(item => item.kind === 'material')) {
    const row = appraisal.get(item.id);
    assert.ok(row, item.id);
    assert.equal(item.sell, row.sell, item.id);
    if (row.access !== 'open') continue;
    assert.ok(row.sell >= 1 && row.sell <= 5, item.id);
    assert.ok(materialBuyback(row.id, 20, row.sell) <= 5, item.id);
  }
  for (const id of ['hide', 'ore', 'core', 'black_iron']) assert.equal(appraisal.get(id)?.access, 'open');
  assert.equal(materialBuyback('wood', 2, 1), 2);
  assert.equal(materialBuyback('gold_core', undefined, 200), 200);
  assert.ok(materialBuyback('gold_core', 41, 200) > 200);
});

test('merchants buy high-rank hunting materials without putting them on cash shelves', () => {
  const hunted = ['foundation_core', 'gold_core', 'foundation_meat', 'gold_meat', 'hard_scale', 'battle_sinew'];
  const forSale = new Set([
    ...data.market.stalls.flatMap(stall => stall.offers.map(offer => offer.id)),
    ...Object.values(data.regionDetails).filter(region => region.settlement)
      .flatMap(region => Object.keys(localGoods(region.settlement))),
    ...data.measuringSect.store.map(offer => offer.id),
  ]);
  for (const id of hunted) {
    assert.ok(!forSale.has(id), id);
    assert.ok(items.get(id).sell > 0, id);
  }
  const state = createGame(21);
  state.coins = 10_000;
  for (const id of hunted) assert.equal(act(state, 'buy', { id }).ok, false, id);
  state.inventory.gold_core = 1;
  assert.ok(act(state, 'sell', { id: 'gold_core' }).ok);
  assert.equal(state.inventory.gold_core, undefined);
});

test('all exclusive deposits have a real guard and bounded harvests', () => {
  const deposits = materialEconomy.filter(row => row.source === 'protectedGather');
  assert.ok(deposits.length >= 4);
  for (const row of deposits) {
    const site = siteById.get(row.site);
    const stock = site.stocks[row.id];
    const index = stock.choices[0];
    const action = events.get(site.id).choices[index];
    assert.deepEqual(action.guardedBy, row.guards);
    assert.equal(stock.cap, action.loot[row.id]);
    assert.ok(stock.cap >= 1 && stock.cap <= 2);
    assert.equal(Math.max(...row.guards.map(id => enemies.get(id).tier)), row.tier);
    if (stock.interval) {
      assert.ok(row.guards.some(id => {
        const guard = site.creatures[id];
        return guard.interval > 0 && guard.growth > 0 && guard.interval * (guard.depletedFactor ?? 1) < stock.interval;
      }), site.id);
    } else assert.equal(stock.growth, 0);
  }
  assert.ok(appraisal.get('silver_leaf_heart').sell < appraisal.get('bell_crystal_sand').sell);
  assert.ok(appraisal.get('bell_crystal_sand').sell < appraisal.get('coldvein_herb').sell);
});

test('guarded deposits have practical local uses with material and coin costs', () => {
  const orders = [
    ['mist_shelter', 'silver_leaf_heart', 'gold_salve', 2, 8],
    ['sand_ring_maker', 'bell_crystal_sand', 'clear_needle', 16, 5],
    ['zhao_leak_bench', 'coldvein_herb', 'return_breath_pill', 3, 24],
  ];
  for (const [site, material, product, count, price] of orders) {
    const state = createGame(21);
    state.region = siteById.get(site).region;
    state.coins = 100;
    if (site === 'sand_ring_maker') {
      Object.assign(state.inventory, { ore: 2, core: 1 });
      assert.ok(act(state, 'visit', { id: 'sand_cloister_trial' }).ok);
      assert.ok(act(state, 'choose', { index: 0 }).ok);
      assert.ok(act(state, 'leave').ok);
    }
    assert.ok(act(state, 'visit', { id: site }).ok, site);
    const event = events.get(site);
    const index = event.choices.findIndex(choice => choice.need?.[material] === 1 && choice.loot?.[product] === count);
    assert.ok(index >= 0, site);
    assert.equal(view(state).visibleChoices.some(choice => choice.index === index), false);
    Object.assign(state.inventory, event.choices[index].need);
    state.pressure = 5;
    const qi = state.qi;
    assert.ok(act(state, 'choose', { index }).ok);
    assert.equal(state.event, site);
    assert.equal(state.inventory[material], undefined);
    assert.equal(state.inventory[product], count);
    assert.equal(state.coins, 100 - price);
    if (site === 'zhao_leak_bench') assert.equal(state.qi, qi, 'waiting with the alchemist behind the closed door does not drain qi');
  }
});

test('selling or putting down a finite material requires a separate confirmation', () => {
  const state = createGame(21);
  state.inventory.coldvein_herb = 2;
  const sale = act(state, 'sell', { id: 'coldvein_herb', count: 2 });
  assert.match(sale.message, /一共只有 2 份.*卖出后就收不回来了/);
  assert.equal(sale.confirmation.maximum, 2);
  assert.equal(state.inventory.coldvein_herb, 2);
  assert.ok(act(state, 'sell', { id: 'coldvein_herb', count: 1, confirmed: true, expectedPlace: state.region }).ok);
  assert.equal(state.inventory.coldvein_herb, 1);
  const drop = act(state, 'discard', { id: 'coldvein_herb', count: 1 });
  assert.match(drop.message, /可以再回来拾取/);
  assert.equal(state.inventory.coldvein_herb, 1);
  assert.ok(act(state, 'discard', { id: 'coldvein_herb', count: 1, confirmed: true, expectedPlace: drop.confirmation.place }).ok);
  assert.ok(act(state, 'take', { id: 'coldvein_herb' }).ok);
  assert.equal(state.inventory.coldvein_herb, 1);
});

test('body-part income is tied to prey strength while rare parts preserve existing forge templates', () => {
  function gross(enemyId) {
    const enemy = enemies.get(enemyId);
    const sell = (id) => items.get(id)?.sell ?? 0;
    return Object.entries(enemy.loot).reduce((sum, [id, count]) => sum + sell(id) * count, 0)
      + Object.entries(enemy.chanceLoot ?? {}).reduce((sum, [id, drop]) => sum + sell(id) * drop.count * drop.chance, 0);
  }
  const low = gross('reed_fox');
  const middle = gross('snow_gully_otter');
  const high = gross('sand_riven_scorpion');
  assert.ok(low >= 5 && low <= 16, low);
  assert.ok(middle >= 80 && middle <= 200, middle);
  assert.ok(high >= 650 && high <= 1_000, high);
  assert.ok(gross('sand_quarry_matriarch') > high);
  assert.equal(enemies.get('dyke_old_croc').loot.dyke_backstrap, 1);
  assert.equal(enemies.get('sand_quarry_matriarch').loot.quarry_back_spine, 1);
  for (const { id, sell, enemy } of materialEconomy.filter(row => row.enemy)) {
    assert.equal(enemies.get(enemy).loot[id], 1);
    assert.ok(sell >= 100, id);
    assert.equal(items.get(id).price, 0, id);
  }
  for (const id of ['qi_core', 'foundation_core', 'gold_core']) {
    const rule = materialDemandRules[id];
    assert.ok(rule.reserveRate >= 0.8 && rule.replenished > 0);
  }
});

test('the cave deposit must be fought for again after both the stock and its resident return', () => {
  const state = createGame(21);
  state.region = 'night_pit';
  state.discovered.push(state.region);
  state.realm = 8;
  state.inventory.foil_sword = 1;
  state.durability.foil_sword = data.gear.find(({ id }) => id === 'foil_sword').durability;
  state.inventory.fault_coat = 1;
  state.durability.fault_coat = data.gear.find(({ id }) => id === 'fault_coat').durability;
  const play = (action, payload = {}) => {
    const result = act(state, action, payload);
    assert.ok(result.ok, result.message);
    return result;
  };
  play('equip', { id: 'foil_sword' });
  play('equip', { id: 'fault_coat' });
  state.hp = view(state).maxHp;
  state.qi = view(state).maxQi;
  const site = siteById.get('zhao_bank_fire');
  const index = site.stocks.ember_ore_pith.choices[0];
  const fightIndex = events.get(site.id).choices.findIndex(choice => choice.enemy === 'ember_yak');
  const status = () => view(state).visibleChoices.find(choice => choice.index === index);
  play('visit', { id: site.id });
  assert.match(status().lockedReason, /挡着这条路/);
  play('choose', { index: fightIndex });
  for (let n = 0; n < 25 && state.combat; n++) play(view(state).intent?.kind === 'heavy' ? 'guard' : 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.event, site.id);
  assert.equal(view(state).groundLoot.ember_ore_pith, undefined);
  play('beginGather', { index });
  assert.equal(play('finishGather').gathered.ember_ore_pith, 2);
  assert.equal(view(state).groundLoot.ember_ore_pith, 2);
  play('take', { id: 'ember_ore_pith' });
  assert.equal(state.inventory.ember_ore_pith, 2);
  assert.match(status().lockedReason, /已经采空/);

  const stockReturns = state.localPools[site.id].stocks.ember_ore_pith.nextAt;
  assert.ok(state.localPools[site.id].creatures.ember_yak.nextAt < stockReturns);
  state.day = stockReturns;
  assert.match(status().lockedReason, /挡着这条路/);
  assert.equal(act(state, 'beginGather', { index }).ok, false);
});
