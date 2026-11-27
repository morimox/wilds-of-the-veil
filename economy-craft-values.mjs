import { materialBuyback } from './economy-material-values.mjs';

const commonInputs = ['wood', 'reed', 'ore', 'hide', 'core', 'black_iron', 'kiln_clay'];
const majorMaterials = ['qi_core', 'foundation_core', 'gold_core'];
const tierFoods = ['beast_meat', 'foundation_meat', 'gold_meat'];
const guardedIngredient = { r_gold_spirit_pendant: 'ember_ore_pith' };

export const craftValueTargets = {
  markup: 0.12,
  boughtInputShare: 0.85,
  shopBuybackShare: 0.5,
  baseMaterialMinimum: [0, 14, 25],
  baseMedicineCount: [0, 2, 4],
};

export const progressionFees = [0, 18, 36, 18, 120, 245, 340, 950, 1650];

function cheapestCashOffers(items, market, regionDetails, measuringSect) {
  const prices = new Map();
  const add = (id, price) => {
    if (price > 0) prices.set(id, Math.min(price, prices.get(id) ?? Infinity));
  };
  for (const stall of market.stalls) {
    for (const { id } of stall.offers) add(id, items.get(id)?.price);
  }
  for (const { settlement } of Object.values(regionDetails)) {
    for (const [id, { price }] of Object.entries(settlement?.goods ?? {})) add(id, price);
  }
  for (const { id, price } of measuringSect.store) add(id, price);
  return prices;
}

function addGearInputs(recipe, gear, stage, items) {
  const count = commonInputs.reduce((total, id) => total + (recipe.need[id] ?? 0), 0);
  const extra = Math.max(0, craftValueTargets.baseMaterialMinimum[stage] - count);
  if (extra) {
    const foundation = commonInputs.filter(id => recipe.need[id]).sort((a, b) => recipe.need[b] - recipe.need[a])[0]
      ?? (gear.slot === 'armor' || gear.slot === 'boots' ? 'hide' : 'ore');
    recipe.need[foundation] = (recipe.need[foundation] ?? 0) + extra;
  }
  const rare = majorMaterials[stage];
  if (!recipe.need[rare]) recipe.need[rare] = stage;
  const guarded = guardedIngredient[recipe.id];
  if (items.has(guarded)) recipe.need[guarded] = 1;
}

function addMedicineInputs(recipe, pill, stage) {
  const base = (pill.qi ?? 0) > (pill.hp ?? 0) || pill.sense > 0 ? 'qi_powder' : 'salve';
  recipe.need[base] = Math.max(recipe.need[base] ?? 0, craftValueTargets.baseMedicineCount[stage]);
  const rare = majorMaterials[stage];
  if (!recipe.need[rare]) recipe.need[rare] = 1;
}

function addConsumableInputs(recipe, product, stage) {
  const base = product.kind === 'ammo' ? 'iron_arrow'
    : product.kind === 'food' ? 'ration' : 'reed';
  const count = product.kind === 'ammo' ? stage * 3 : stage + 2;
  recipe.need[base] = Math.max(recipe.need[base] ?? 0, count);
  const rare = product.kind === 'food' ? tierFoods[stage] : majorMaterials[stage];
  if (!recipe.need[rare]) recipe.need[rare] = 1;
}

function supplyLines(itemById, market, regionDetails, measuringSect) {
  const shops = Object.values(regionDetails).flatMap(({ settlement }) => settlement ? [settlement] : []);
  for (const { buys } of shops) {
    for (const [id, price] of Object.entries(buys ?? {})) {
      if (itemById.get(id)?.kind === 'material') buys[id] = materialBuyback(id, price, itemById.get(id).sell);
    }
  }
  for (const [id, item] of itemById) {
    if (item.kind !== 'material' || !item.sell) continue;
    const highest = Math.max(item.sell, ...shops.map(({ buys }) => buys?.[id] ?? 0));
    const floor = Math.ceil(highest * 1.45);
    if (market.stalls.some(({ offers }) => offers.some(row => row.id === id))) item.price = Math.max(item.price, floor);
    for (const { goods } of shops) {
      if (goods?.[id]) goods[id].price = Math.max(goods[id].price, floor);
    }
    for (const offer of measuringSect.store) {
      if (offer.id === id) offer.price = Math.max(offer.price, floor);
    }
  }
}

export function applyCraftValueEconomy({ items, gear, realms, recipes, projects, pills, market, regionDetails, measuringSect }) {
  for (const realm of realms) {
    realm.cost = progressionFees[realm.id] ?? realm.cost;
  }
  for (const equipment of gear) {
    const scale = equipment.tier >= 6 ? 2.2 : equipment.tier >= 3 ? 1.4 : 1;
    if (equipment.repair > 0) equipment.repair = Math.ceil(equipment.repair * scale);
  }
  const itemById = new Map(items.map(item => [item.id, item]));
  const gearById = new Map(gear.map(item => [item.id, item]));
  const pillById = new Map(pills.map(item => [item.id, item]));
  supplyLines(itemById, market, regionDetails, measuringSect);
  for (const job of measuringSect.jobs) {
    if (!['inner', 'elder'].includes(job.office)) continue;
    const supplies = Object.entries(job.need).reduce((sum, [id, count]) => sum + (itemById.get(id)?.sell ?? 0) * count, 0);
    job.coins = Math.max(job.coins, Math.round(supplies * 0.55));
  }
  const offers = cheapestCashOffers(itemById, market, regionDetails, measuringSect);
  const revised = [];
  const caps = new Map();
  const production = [
    ...recipes.map(recipe => ({ recipe, productId: recipe.result, batch: recipe.count ?? 1 })),
    ...projects.flatMap(recipe => Object.entries(recipe.loot ?? {})
      .filter(([id]) => itemById.get(id)?.kind === 'food')
      .map(([productId, batch]) => ({ recipe, productId, batch }))),
  ];
  for (const { recipe, productId, batch } of production) {
    const product = itemById.get(productId);
    const equipment = gearById.get(productId);
    const medicine = pillById.get(productId);
    const stage = Math.floor((equipment?.tier ?? recipe.tier ?? 0) / 3);
    if (stage < 1 || stage > 2 || !['gear', 'pill', 'food', 'ammo', 'talisman'].includes(product?.kind)) continue;

    recipe.need = { ...recipe.need };
    if (equipment) addGearInputs(recipe, equipment, stage, itemById);
    else if (medicine) addMedicineInputs(recipe, medicine, stage);
    else addConsumableInputs(recipe, product, stage);

    const total = Object.entries(recipe.need).reduce((sum, [id, count]) => sum + (itemById.get(id)?.sell ?? 0) * count, 0);
    if (recipe.cost > 0) recipe.cost = Math.min(recipe.cost, Math.max(1, Math.floor(total * 0.07)));
    const boughtInputs = Object.entries(recipe.need).reduce((sum, [id, count]) =>
      sum + (offers.get(id) ?? Infinity) * count, recipe.cost ?? 0);
    const goal = Math.round(total * (1 + craftValueTargets.markup) / batch);
    const cap = Math.floor(Math.min(
      goal,
      boughtInputs * craftValueTargets.boughtInputShare / batch,
      (offers.get(productId) ?? Infinity) * craftValueTargets.shopBuybackShare,
    ));
    caps.set(productId, Math.min(cap, caps.get(productId) ?? Infinity));
    revised.push({ id: recipe.id, product: productId, stage, need: recipe.need, batch, materialsValue: total, cost: recipe.cost ?? 0 });
  }
  for (const [id, price] of caps) itemById.get(id).sell = Math.max(1, price);
  return revised.map(row => ({ ...row, unitSell: itemById.get(row.product).sell, outputValue: itemById.get(row.product).sell * row.batch }));
}
