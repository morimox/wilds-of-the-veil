import test from 'node:test';
import assert from 'node:assert/strict';
import { act, rules, view } from './engine.mjs';
import { createQuietGame as createGame } from './game-test-fixtures.mjs';
import { data } from './data.mjs';
import { transportRules } from './world.mjs';

function play(state, action, payload) {
  const response = act(state, action, payload);
  assert.ok(response.ok, `${action}: ${response.message}`);
  return response;
}

function deniedWithoutChanges(state, action, payload, message) {
  const before = structuredClone(state);
  const outcome = act(state, action, payload);
  assert.equal(outcome.ok, false);
  if (message) assert.match(outcome.message, message);
  assert.deepEqual(state, before);
}

function walk(state, id) {
  state.satiety = 100;
  play(state, 'travel', { id });
}

function reachWillow(state) {
  for (const id of ['marsh', 'pale_shoal', 'willow_post']) walk(state, id);
}

function reachZhao(state, permit = 'ferry_manifest') {
  state.discovered.push('ford');
  if (permit === 'last_lantern') state.completedQuests.push(permit);
  else state.knownItems.push(permit);
  walk(state, 'ford');
  walk(state, 'zhao_city');
}

test('three provinces expose only situationally known points and roads with exact costs', () => {
  const state = createGame();
  assert.deepEqual(view(state).world.points.map(({ id }) => id), ['village', 'marsh']);
  assert.equal(view(state).world.provinces.length, 3);
  assert.equal(data.regions.length, 60);
  deniedWithoutChanges(state, 'travel', { id: 'undertow_grotto' }, /找.*路/);

  state.discovered.push('ford');
  walk(state, 'ford');
  assert.equal(view(state).world.points.some(({ id }) => id === 'zhao_city'), false);
  const crossingHint = /旧渡.*开船.*货单.*商船/;
  assert.match(view(state).world.crossings[0].reason, crossingHint);
  state.discovered.push('zhao_city');
  const closed = view(state).world.roads.find(({ id }) => id === 'zhao_city');
  assert.equal(closed.available, false);
  deniedWithoutChanges(state, 'travel', { id: 'zhao_city' }, crossingHint);

  state.knownItems.push('ferry_manifest');
  const day = state.day;
  const quote = view(state).world.roads.find(({ id }) => id === 'zhao_city');
  assert.equal(quote.days, 5.5);
  assert.equal(quote.available, true);
  play(state, 'travel', { id: 'zhao_city' });
  assert.equal(state.day - day, quote.days);
  assert.equal(view(state).world.province, 'zhaoyuan');
  assert.equal(state.world.lastSettlement, 'zhao_city');
  assert.equal(view(state).world.roads.some(({ id }) => id === 'village'), false);

  walk(state, 'flood_market');
  walk(state, 'zhao_pass');
  deniedWithoutChanges(state, 'travel', { id: 'mingsha_city' }, /找.*路/);
  state.knownItems.push('sand_writ');
  play(state, 'wait');
  state.satiety = 100;
  state.inventory.ration = 1;
  const west = view(state).world.roads.find(({ id }) => id === 'mingsha_city');
  assert.equal(west.days, 6.5);
  assert.ok(west.available);
  walk(state, 'mingsha_city');
  assert.equal(view(state).world.province, 'mingsha');
});

test('all sixty world points sit on real connected roads once all clues are known', () => {
  const state = createGame();
  state.knownItems.push(...data.items.map(({ id }) => id));
  state.completedQuests.push(...data.quests.map(({ id }) => id));
  state.inventory = Object.fromEntries(data.items.filter(({ kind }) => kind === 'key').map(({ id }) => [id, 1]));
  state.inventory.ration = 2;
  const reachable = new Set([state.region]);
  const arrivals = [state];
  for (let index = 0; index < arrivals.length; index += 1) {
    const traveler = arrivals[index];
    traveler.satiety = 100;
    for (const road of view(traveler).world.roads) {
      if (reachable.has(road.id) || !road.available) continue;
      const branch = structuredClone(traveler);
      play(branch, 'travel', { id: road.id });
      assert.equal(branch.region, road.id);
      assert.ok(Math.abs(branch.day - traveler.day - road.days) < 0.001);
      reachable.add(branch.region);
      arrivals.push(branch);
    }
  }
  assert.deepEqual(reachable, new Set(data.regions.map(({ id }) => id)));
  for (const province of data.provinces) {
    const points = Object.values(data.regionDetails).filter((region) => region.province === province.id);
    assert.equal(points.length, 20);
    assert.equal(new Set(points.map(({ x, y }) => `${x},${y}`)).size, points.length);
    assert.ok(points.some(({ settlement }) => settlement));
    assert.equal(points.filter(({ array }) => array).length, 1);
  }
});

test('a known distant destination shows its intermediate roads and cannot skip an unknown link', () => {
  const state = createGame();
  state.discovered.push('sky_terrace');
  assert.equal(view(state).world.journeys.some(({ id }) => id === 'sky_terrace'), false);
  deniedWithoutChanges(state, 'travel', { id: 'sky_terrace' }, /接不上|接上/);
  state.discovered.push('ridge', 'black_mine', 'snow_pass');
  const journey = view(state).world.journeys.find(({ id }) => id === 'sky_terrace');
  assert.deepEqual(journey.path, ['village', 'marsh', 'ridge', 'black_mine', 'snow_pass', 'sky_terrace']);
  assert.deepEqual(journey.via, ['白苇滩', '沉钟岭', '玄砂矿脉', '碎云雪关']);
  assert.ok(journey.days > data.regions.find(({ id }) => id === 'sky_terrace').travel);
  assert.equal(view(state).world.roads.some(({ id }) => id === 'sky_terrace'), false);
  assert.deepEqual(journey.meals, { ration: 2 });
  const day = state.day;
  play(state, 'travel', { id: 'sky_terrace' });
  assert.equal(state.region, 'sky_terrace');
  assert.equal(state.day - day, journey.days);
  assert.equal(state.inventory.ration, 1);
  assert.ok(state.satiety >= 20);
  assert.deepEqual(state.eventsSeen, {});
});

test('a cross-province passage consumes only the quoted meals and rejects an underprepared departure', () => {
  const state = createGame();
  state.region = 'zhao_pass';
  state.discovered.push('zhao_pass', 'mingsha_city');
  state.knownItems.push('sand_writ');
  state.satiety = 100;
  delete state.inventory.ration;
  const route = () => view(state).world.roads.find(({ id }) => id === 'mingsha_city');
  assert.equal(route().available, false);
  deniedWithoutChanges(state, 'travel', { id: 'mingsha_city' }, /口粮还不够/);
  state.inventory.ration = 2;
  const day = state.day;
  const quoted = route();
  assert.deepEqual(quoted.meals, { ration: 1 });
  assert.equal(quoted.days, 6.5);
  assert.match(play(state, 'travel', { id: 'mingsha_city' }).message, /途中吃了干粮×1/);
  assert.equal(state.day - day, quoted.days);
  assert.equal(state.satiety, 28);
  assert.equal(state.inventory.ration, 1);
});

test('the Zhaoyuan city seller gives the physical scale clue once without requiring a purchase or bag slot', () => {
  const state = createGame();
  const clue = 'market_scale_verse';
  deniedWithoutChanges(state, 'localAsk', {}, /没有这件事/);
  state.inventory.ferry_manifest = 1;
  reachZhao(state);
  state.inventory.ration = rules.backpackCapacity * rules.backpackStackSize;
  const opening = view(state);
  assert.equal(opening.backpackUsed, rules.backpackCapacity);
  assert.match(opening.localMarket.talk.label, /蒲霖/);
  assert.equal(opening.localMarket.talk.heard, false);
  assert.ok(opening.localMarket.offers.some(({ id, count }) => id === 'ore' && count > 0));
  assert.equal(state.inventory[clue], undefined);
  const before = { day: state.day, satiety: state.satiety, coins: state.coins, shops: structuredClone(state.world.shops) };
  assert.match(play(state, 'localAsk').message, /六两/);
  assert.equal(state.day, before.day + 0.125);
  assert.equal(state.satiety, before.satiety - 0.125 * rules.satietyDrainPerDay);
  assert.equal(state.coins, before.coins);
  assert.equal(state.inventory[clue], 1);
  assert.ok(state.knownItems.includes(clue));
  assert.equal(view(state).localMarket.talk.heard, true);
  assert.equal(view(state).backpackUsed, rules.backpackCapacity);
  assert.equal(view(state).groundLoot[clue], undefined);
  assert.deepEqual(state.world.shops, before.shops);
  play(state, 'localAsk');
  assert.equal(state.day, before.day + 0.125);
  assert.equal(state.satiety, before.satiety - 0.125 * rules.satietyDrainPerDay);
  assert.equal(state.coins, before.coins);
  assert.equal(state.inventory[clue], 1);
  assert.equal(state.knownItems.filter((item) => item === clue).length, 1);
  walk(state, 'flood_market');
  assert.equal(view(state).localMarket?.talk ?? null, null);
  deniedWithoutChanges(state, 'localAsk', {}, /没有这件事/);
});

test('each settlement trades its listed goods and never buys an item above another shop price', () => {
  const items = new Map(data.items.map((item) => [item.id, item]));
  const sellable = data.items.filter(({ sell, kind, evidence }) => sell > 0 && kind !== 'key' && !evidence);
  const shopPrices = new Map();
  const sellQuotes = [];
  const noteShopPrice = (id, price) => {
    assert.ok(Number.isSafeInteger(price) && price > 0, `${id} at ${price}`);
    shopPrices.set(id, Math.min(shopPrices.get(id) ?? Infinity, price));
  };
  for (const stall of data.market.stalls) {
    for (const { id } of stall.offers) noteShopPrice(id, items.get(id).price);
  }
  for (const [region, { settlement }] of Object.entries(data.regionDetails).filter(([, detail]) => detail.settlement)) {
    const state = createGame();
    state.region = region;
    state.inventory = Object.fromEntries(sellable.map(({ id }) => [id, 1]));
    const screen = view(state);
    assert.ok(screen.settlement?.inn && screen.localMarket);
    if (region !== 'village') {
      const offered = new Set(screen.localMarket.offers.map(({ id }) => id));
      for (const id of ['ration', ...Object.keys(settlement.goods ?? {})]) assert.ok(offered.has(id), `${region} is missing ${id}`);
    }
    for (const { id, price } of screen.localMarket.offers) noteShopPrice(id, price);
    assert.deepEqual(new Set(screen.localMarket.buys.map(({ id }) => id)), new Set(sellable.map(({ id }) => id)));
    sellQuotes.push(...screen.localMarket.buys, ...screen.market.sales);
  }
  for (const { id, price } of sellQuotes) {
    assert.ok(Number.isSafeInteger(price) && price > 0, `${id} at ${price}`);
    assert.ok(price <= (shopPrices.get(id) ?? Infinity), `${id} can be bought for ${shopPrices.get(id)} and resold for ${price}`);
  }
});

test('settlement market stock, supplies, rest and safety stay local', () => {
  const state = createGame();
  state.coins = 35;
  state.economy.warehouse.wood = 50;
  reachWillow(state);
  const villageQuestIds = new Set(data.quests.filter((quest) => !quest.region).map(({ id }) => id));
  assert.equal(view(state).mode, 'village');
  assert.equal(view(state).settlement.home, false);
  assert.equal(view(state).settlement.inn, true);
  assert.ok(view(state).discoveredQuests.every((id) => !villageQuestIds.has(id)));
  assert.ok((view(state).homeMaterials.wood ?? 0) < 50);
  assert.deepEqual(view(state).market.stalls, []);
  deniedWithoutChanges(state, 'buy', { id: 'ration' });
  deniedWithoutChanges(state, 'econWithdraw', { id: 'wood', count: 1 });
  deniedWithoutChanges(state, 'handin', { id: 'patch_ferry' });

  const ration = () => view(state).localMarket.offers.find(({ id }) => id === 'ration');
  const previous = ration();
  play(state, 'localBuy', { id: 'ration', count: 2 });
  assert.equal(state.coins, 35 - previous.price * 2);
  assert.equal(ration().count, previous.count - 2);
  assert.equal(state.world.shops.village, undefined);
  const nextRestock = state.world.shops.willow_post.ration.nextAt;
  while (state.day + rules.waitDays < nextRestock) play(state, 'wait');
  assert.equal(ration().count, previous.count - 2);
  while (state.day < nextRestock) play(state, 'wait');
  assert.ok(ration().count > previous.count - 2);
  state.inventory.ore = 2;
  const oreSale = view(state).localMarket.buys.find(({ id }) => id === 'ore');
  assert.equal(oreSale.count, 2);
  const afterSupplies = state.coins;
  play(state, 'localSell', { id: 'ore', count: 1 });
  assert.equal(state.coins, afterSupplies + oreSale.price);
  assert.equal(state.inventory.ore, 1);
  assert.equal(state.economy.warehouse.wood, 50);
  state.inventory.undertow_entry = 1;
  deniedWithoutChanges(state, 'localSell', { id: 'undertow_entry' });

  state.hp = 1;
  state.satiety = 0;
  delete state.inventory.ration;
  play(state, 'rest');
  assert.equal(state.hp, 1 + rules.restHp);
  assert.ok(state.inventory.ration);
  deniedWithoutChanges(state, 'localSell', { id: 'ration', count: 1 });
  play(state, 'eat', { id: 'ration' });

  walk(state, 'pale_shoal');
  walk(state, 'gauge_tower');
  state.satiety = 0;
  const emergency = view(state).world.roads.find(({ id }) => id === 'willow_post');
  assert.ok(emergency.available && emergency.rescue);
  const before = state.day;
  play(state, 'travel', { id: 'willow_post' });
  assert.equal(state.day - before, emergency.days);

  walk(state, 'pale_shoal');
  state.hp = 1;
  state.combat = { id: 'mud_beast', round: 0, hp: 999 };
  play(state, 'attack');
  assert.equal(state.region, 'willow_post');
  assert.equal(view(state).mode, 'village');
  assert.ok(state.wounds > 0);
});

test('an ordinary settlement can make the known scroll formula without using another town\'s warehouse', () => {
  const state = createGame();
  state.coins = 70;
  state.economy.warehouse.core = 5;
  reachWillow(state);
  const recipe = data.recipes.find(({ result }) => result === 'gate_scroll');
  const { id } = recipe;
  deniedWithoutChanges(state, 'craft', { id }, /做法/);
  state.knownItems.push(recipe.formula);
  Object.assign(state.inventory, { reed: 1, wood: 1 });
  deniedWithoutChanges(state, 'craft', { id }, /灵晶/);
  state.inventory.core = 1;
  play(state, 'craft', { id });
  assert.equal(state.inventory.gate_scroll, recipe.count);
  assert.equal(state.economy.warehouse.core, 5);
  assert.equal(state.coins, 70 - recipe.cost);
});

test('a gate needs attunement, scrolls work from an idle scene, and the cheapest gate fare stays local', () => {
  const state = createGame();
  state.coins = 40;
  state.inventory.gate_scroll = 2;
  play(state, 'attuneGate');
  deniedWithoutChanges(state, 'attuneGate');
  deniedWithoutChanges(state, 'gateScroll', { id: 'willow_post' }, /先到.*点亮传送门/);
  reachWillow(state);
  play(state, 'attuneGate');
  const local = view(state).world.gates.find(({ id }) => id === 'village');
  assert.equal(local.price, 2);
  assert.equal(local.available, true);
  play(state, 'gateJump', { id: 'village' });
  assert.equal(state.coins, 38);
  assert.equal(state.inventory.gate_scroll, 2);

  reachZhao(state, 'last_lantern');
  play(state, 'attuneGate');
  deniedWithoutChanges(state, 'gateJump', { id: 'willow_post' }, /传送门.*只能.*本州/);
  assert.equal(view(state).world.localArray.active, false);
  play(state, 'gateScroll', { id: 'village' });
  assert.equal(state.world.lastSettlement, 'village');
  walk(state, 'marsh');
  play(state, 'visit', { id: 'reed_banks' });
  const date = state.day;
  play(state, 'beginGather', { index: 0 });
  deniedWithoutChanges(state, 'gateScroll', { id: 'zhao_city' }, /采集/);
  play(state, 'finishGather');
  const gatheredTime = state.day - date;
  assert.ok(gatheredTime > 0);
  assert.equal(state.event, 'reed_banks');
  const scrollTime = state.day;
  play(state, 'gateScroll', { id: 'zhao_city' });
  assert.equal(state.day - scrollTime, transportRules.scrollDays);
  assert.equal(state.event, null);
  assert.equal(state.inventory.gate_scroll, undefined);
  assert.equal(state.region, 'zhao_city');
  assert.equal(state.coins, 38);
  assert.equal(view(state).world.localArray.active, false);
});

test('array installments are persistent and require both states to repair their own array', () => {
  const state = createGame();
  state.coins = 500;
  Object.assign(state.inventory, { wood: 100, ore: 100, core: 100, black_iron: 100 });
  const cost = view(state).world.localArray;
  play(state, 'arrayContribute', { id: 'wood', count: 5 });
  play(state, 'arrayContribute', { id: 'coins', count: 11 });
  assert.equal(view(state).world.localArray.paid.wood, 5);
  deniedWithoutChanges(state, 'arrayContribute', { id: 'wood', count: cost.need.wood }, /数量.*修阵清单/);
  deniedWithoutChanges(state, 'arrayContribute', { id: 'wood', count: -1 }, /数量.*修阵清单/);

  function finishArray() {
    const { remaining, coins, coinsPaid } = view(state).world.localArray;
    for (const [id, count] of Object.entries(remaining).filter(([, count]) => count)) play(state, 'arrayContribute', { id, count });
    if (coinsPaid < coins) play(state, 'arrayContribute', { id: 'coins', count: coins - coinsPaid });
    assert.equal(view(state).world.localArray.active, true);
  }

  finishArray();
  reachZhao(state);
  deniedWithoutChanges(state, 'arrayJump', { id: 'village' }, /这里的传送阵.*没修好/);
  const coin = state.coins;
  finishArray();
  assert.equal(state.coins, coin - transportRules.arrayPlans.zhaoyuan.coins);
  const quoted = view(state).world.arrays.find(({ id }) => id === 'village');
  assert.equal(quoted.price, 4);
  assert.ok(quoted.active && quoted.available);
  const before = { day: state.day, coins: state.coins };
  play(state, 'arrayJump', { id: 'village' });
  assert.equal(state.day - before.day, quoted.days);
  assert.equal(state.coins, before.coins - quoted.price);
  assert.equal(view(state).world.localArray.active, true);
  deniedWithoutChanges(state, 'arrayContribute', { id: 'wood', count: 1 }, /已经修好/);
});

test('protected novice sparring preserves luggage and cannot grant a win', () => {
  const state = createGame();
  walk(state, 'marsh');
  play(state, 'visit', { id: 'marsh_pole_lesson' });
  state.hp = 1;
  state.coins = 28;
  state.inventory.wood = 2;
  state.expeditionLoot.wood = 2;
  play(state, 'choose', { index: 1 });
  assert.equal(view(state).currentEnemy.sparring, true);
  for (let round = 0; state.combat && round < 7; round += 1) play(state, 'attack');
  assert.equal(state.combat, null);
  assert.equal(state.region, 'marsh');
  assert.equal(state.event, 'marsh_pole_lesson');
  assert.equal(state.coins, 28);
  assert.equal(state.wounds, 0);
  assert.equal(state.expeditionLoot.wood, 2);
  assert.equal(state.inventory.wood, 2);
  assert.ok(state.hp >= 1);
  assert.equal(state.defeated.includes('river_spar_captain'), false);
  assert.equal(view(state).visibleChoices.some(({ index, available }) => index === 2 && available), false);
  deniedWithoutChanges(state, 'choose', { index: 1 }, /歇一歇/);
});

test('sect admission, contributions, cooldowns and a master reward form an optional loop', () => {
  const state = createGame();
  for (const id of ['pine_ridge', 'lantern_court']) {
    if (id === 'pine_ridge') state.discovered.push(id);
    walk(state, id);
  }
  const initialSect = view(state).sect;
  assert.equal(initialSect.name, '系灯院');
  assert.equal(initialSect.join.available, false);
  deniedWithoutChanges(state, 'sectWork', { id: initialSect.jobs[0].id });
  state.coins = 100;
  Object.assign(state.inventory, { wood: 26, reed: 26, ore: 26, hide: 26 });
  const cost = view(state).sect.join.coins;
  play(state, 'sectJoin');
  assert.equal(state.coins, 100 - cost);
  const master = initialSect.ranks.find(({ art }) => art);
  assert.ok(master);
  deniedWithoutChanges(state, 'sectClaim', { id: master.id }, /功劳/);

  const job = view(state).sect.jobs.find(({ id }) => id === 'lantern_heel');
  play(state, 'sectWork', { id: job.id });
  assert.equal(view(state).affiliation.credit, job.credit);
  deniedWithoutChanges(state, 'sectWork', { id: job.id }, /还在忙上次的活.*再来/);
  while (view(state).affiliation.credit < master.credit) {
    const ready = view(state).sect.jobs.find(({ available }) => available);
    if (ready) play(state, 'sectWork', { id: ready.id });
    else play(state, 'wait');
  }
  play(state, 'sectClaim', { id: master.id });
  assert.ok(state.knownArts.includes(master.art));
  for (const [id, count] of Object.entries(master.reward ?? {})) assert.ok(state.inventory[id] >= count);
  deniedWithoutChanges(state, 'sectClaim', { id: master.id });
  const credit = view(state).affiliation.credit;
  const coins = state.coins;
  play(state, 'sectLeave');
  assert.equal(view(state).affiliation, null);
  play(state, 'sectJoin');
  assert.equal(view(state).affiliation.credit, credit);
  assert.equal(state.coins, coins);
});
