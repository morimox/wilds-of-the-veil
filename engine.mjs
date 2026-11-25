import * as moduleData from './data.mjs';
import { initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo, backpackCapacity, backpackName, saleQuote, saleTotal, recordSale, containerHasItem, containerCarryReason } from './economy.mjs';
import { hazardView, hazardAction, hazardVictory } from './hazards.mjs';
import { initialAlchemyState, alchemyView, alchemyAction } from './alchemy.mjs';
import { alwaysKnownRegion, learnAdjacentRegions, settlementOf, localGoods, initialWorld, worldView, worldAction, travelRoad, rescueSettlement, continueRoad, backFromRoad, roadTripView } from './world.mjs';
import { initialTraining, trainingStats, trainingPerks, restoreTrainingSense, needsSenseRest, trainingView, trainingAction } from './training.mjs';
import { considerEnemySpirit, invokeSpirit, spiritBlocksStrike, spiritCapacity, spiritFrame } from './spirit-combat.mjs';
import { initialMechanisms, mechanismView, mechanismAction } from './mechanisms.mjs';
import { tournamentData, initialTournament, tournamentView, tournamentAction, tournamentResolution } from './tournament.mjs';
import { chooseEnemyIntent } from './combat-tactics.mjs';
import { checkRoadBanditStep, roadBanditRisk, roadBanditView, banditAction, winRoadBandit, banditDefeat, recoverBanditSpoils } from './bandits.mjs';
import { sandboxDeductions } from './sandbox-deductions.mjs';

const data = { ...moduleData.default, ...moduleData };

const records = Object.fromEntries(
  ['realms', 'items', 'gear', 'foods', 'pills', 'talismans', 'recipes', 'regions', 'events', 'enemies', 'quests', 'deductions', 'sites', 'ammunition', 'innerStyles']
    .map((key) => [key, Object.assign(Object.create(null), Object.fromEntries((data[key] ?? []).map((entry) => [entry.id, entry])))]),
);
const experiments = Object.fromEntries(data.events.filter(({ experiment }) => experiment).map(({ experiment }) => [experiment.id, experiment]));
const experimentSites = Object.fromEntries(data.events.filter(({ experiment }) => experiment)
  .map(({ id, experiment }) => [experiment.id, id]));
const supply = 'ration';
const currency = 'spirit_coin';
const hub = 'village';
const slots = Object.keys(data.equipmentSlots);
const guideBookId = 'encyclopedia';
const guideNoteLimit = 480;

export const rules = Object.freeze({
  restDays: 0.5,
  restHp: 8,
  restQi: 9,
  restWounds: 1,
  restToxin: 15,
  reliefRations: 3,
  exploreDays: 0.25,
  explorePressure: 0.8,
  firstRegionInsight: 1,
  fogNotches: 5,
  pressureThreshold: 3,
  pressureQi: 1,
  fogPulseDays: 0.25,
  fogProtectionPerPoint: 0.2,
  fogProtectionCap: 0.6,
  fogMaxPressure: 7,
  fogMaxDrain: 14,
  fogRestPerDay: 4.8,
  deductionQiCost: 3,
  battleDays: 0,
  regulatedBoutCooldown: 0.5,
  regulatedBoutHpFraction: 0.5,
  perceptionScale: 12,
  perceptionCap: 0.7,
  observedHitLimit: 3,
  combatDodgeCap: 0.30,
  combatActiveDodge: 0.36,
  combatActiveDodgeCap: 0.50,
  combatDodgeAccuracyScale: 0.25,
  combatQuickDodgeFactor: 0.55,
  combatActiveQuickDodgeFactor: 0.65,
  combatConsecutiveDodges: 2,
  largeRealmGap: 3,
  largeRealmPressure: 0.14,
  largeRealmAccuracy: 0.035,
  combatChargeFloor: 4,
  combatChargeFactor: 0.35,
  enemyChargeFactor: 0.25,
  resistanceTier: 6,
  resistanceCap: 0.60,
  magicPowerFactor: 1.32,
  chargeBreakDamage: 4,
  harvestEncounterDays: 0.125,
  ebbCycleDays: 2,
  ebbWindowDays: 0.625,
  retreatDays: 0,
  escapeDodgeFactor: 0.75,
  escapeChanceCap: 0.85,
  banditEscapeChanceCap: 0.40,
  mixedTrackDays: 3,
  mixedTrackHealingPerDay: 6,
  emptyReturnDays: 0.25,
  waitDays: 0.5,
  maxSatiety: 100,
  batchMealTarget: 80,
  satietyDrainPerDay: 16,
  rationSatiety: records.foods.ration.satiety,
  emptyAttackMultiplier: 0.75,
  unpackBasketDays: 0.25,
  guardBonus: 3,
  heavyGuardBonus: 4,
  guardCounter: 3,
  guardQiRecovery: 4,
  enemyGuardBonus: 2,
  minAttackDamage: 1,
  durabilityLoss: 1,
  woundPenalty: 2,
  toxinThreshold: 30,
  toxinDamage: 1,
  focusLimit: 3,
  focusDamage: 3,
  researchDays: 0.5,
  researchQi: 1,
  researchInsight: 1,
  researchLimit: 2,
  practicePerDay: 1,
  worthyFightPractice: 2,
  mealHeal: records.foods.ration.hp,
  fallDays: 1,
  fallMaxCoinLoss: 4,
  fallCoinLossFactor: 0.2,
  fallWounds: 1,
  fallHpFactor: 0.5,
  fallQi: 1,
  maxWounds: 3,
  maxTradeCount: 99,
  backpackCapacity: 12,
  backpackStackSize: 20,
});

const resourceEntries = (resources) => Object.entries(resources && typeof resources === 'object' ? resources : {});
const owns = (state, id) => id === currency ? state.coins : state.inventory[id] ?? 0;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const realmOf = (state) => records.realms[state.realm];
const regionOf = (state) => records.regions[state.region];
const enemyOf = (state) => state.combat ? records.enemies[state.combat.id] : null;
const inProtectedBout = (state) => Boolean(enemyOf(state)?.sparring && records.sites[state.combat.siteId]?.protectedArena);
const inRegulatedBout = (state) => inProtectedBout(state) && Boolean(records.sites[state.combat.siteId].regulatedBout);
const regulatedBoutRestriction = '这场切磋禁用药物和饮食。';
const atHome = (state) => state.region === hub;
const isSettlement = (state) => Boolean(settlementOf(data, state.region));
const nameOf = (id) => records.items[id]?.name ?? id;
const goodsText = (resources) => resourceEntries(resources)
  .filter(([, count]) => count > 0).map(([id, count]) => `${nameOf(id)}×${count}`).join('、');

function activeGear(state) {
  return Object.values(state.equipment).map((id) => records.gear[id])
    .filter((entry) => entry && state.durability[entry.id] > 0);
}

function activeManual(state) {
  return owns(state, state.activeManual) > 0 ? records.innerStyles[state.activeManual] : null;
}

function manualRank(state, id) {
  return state.manualRanks?.[id] ?? 1;
}

function activeManualRank(state) {
  const manual = activeManual(state);
  return manual?.ranks[manualRank(state, manual.id) - 1];
}

function manualFocus(state, weaponClass) {
  const manual = activeManual(state);
  return manual?.specialty.includes(weaponClass) ? activeManualRank(state)?.focus : null;
}

function fogBuildup(state) {
  const gearProtection = Math.max(0, ...activeGear(state).map(({ field }) => field?.fogTolerance ?? 0));
  const manualProtection = activeManualRank(state)?.base.fogTolerance ?? 0;
  const reduction = Math.min(rules.fogProtectionCap, (gearProtection + manualProtection) * rules.fogProtectionPerPoint);
  return rules.explorePressure * (1 - reduction);
}

function roadProtection(state, province) {
  return activeGear(state).find(({ field }) => field?.roadSatiety?.province === province);
}

function stats(state) {
  const realm = realmOf(state);
  const worn = activeGear(state);
  const trained = trainingStats(state);
  const manual = activeManualRank(state)?.base ?? {};
  const sum = (key) => worn.reduce((total, entry) => total + (entry[key] ?? 0), 0);
  const resistance = (key) => state.realm < rules.resistanceTier ? 0
    : clamp((realm[key] ?? 0) + sum(key) + (manual[key] ?? 0), 0, rules.resistanceCap);
  return {
    maxHp: Math.max(1, realm.hp + sum('hp') + trained.hp + (manual.hp ?? 0) - rules.woundPenalty * state.wounds),
    maxQi: Math.max(1, realm.qi + sum('qi') + trained.qi + (manual.qi ?? 0)),
    attack: realm.atk + sum('atk') + (manual.atk ?? 0),
    magicAttack: Math.ceil(realm.atk * rules.magicPowerFactor) + sum('magicAtk') + (manual.magicAtk ?? 0),
    defense: realm.def + sum('def') + trained.def + (manual.def ?? 0),
    physicalResist: resistance('physicalResist'),
    magicResist: resistance('magicResist'),
    perception: (realm.perception ?? 0) + sum('perception') + (manual.perception ?? 0),
    retreat: sum('retreat') + (manual.retreat ?? 0),
  };
}

function normalize(state) {
  state.wounds = clamp(state.wounds, 0, rules.maxWounds);
  state.focus = clamp(state.focus, 0, rules.focusLimit);
  state.toxin = Math.max(0, state.toxin);
  const { maxHp, maxQi } = stats(state);
  state.hp = clamp(state.hp, 0, maxHp);
  state.qi = clamp(state.qi, 0, maxQi);
  if (state.training) state.training.sense = Math.min(state.training.sense ?? 0, spiritCapacity(state));
}

const regulatedBoutWaitDays = (state) => Math.max(0, Math.round(((state.regulatedBoutUntil ?? 0) - state.day) * 1000) / 1000);

function regulatedBoutBlocker(state) {
  const remaining = regulatedBoutWaitDays(state);
  if (remaining > 0) return `裁判请你先在场边歇一歇。还要等 ${remaining} 日。`;
  if (state.hp < Math.ceil(stats(state).maxHp * rules.regulatedBoutHpFraction)) {
    return '裁判见你气血还没到一半，请先歇息养伤。';
  }
  return '';
}

function setRegulatedBoutRecovery(state) {
  state.regulatedBoutUntil = state.day + rules.regulatedBoutCooldown;
}

function advance(state, days, satietyRate = rules.satietyDrainPerDay, sheltered = false) {
  const elapsed = days ?? 0;
  if (elapsed === 0) return;
  state.day = Math.round((state.day + elapsed) * 1000) / 1000;
  state.satiety = Math.max(0, +(state.satiety - elapsed * satietyRate).toFixed(3));
  if (!sheltered) accumulateFog(state, elapsed);
}

function fogExposureActive(state) {
  const site = records.sites[state.event ?? state.combat?.siteId];
  return !state.roadTrip && !site?.fogShelter && (!settlementOf(data, state.region)?.inn || Boolean(site?.exposed));
}

function fogTier(pressure) {
  return pressure > 0 ? clamp(Math.floor(pressure), 1, rules.fogNotches) : 0;
}

function fogDrain(pressure) {
  const excess = pressure - rules.pressureThreshold;
  if (excess < 0) return 0;
  return Math.min(rules.fogMaxDrain, Math.floor(rules.pressureQi + excess + excess ** 2));
}

function accumulateFog(state, elapsed) {
  if (elapsed <= 0 || !fogExposureActive(state)) return;
  const exposure = Math.round(((state.fogExposure ?? 0) + elapsed) * 1000) / 1000;
  const pulses = Math.floor(exposure / rules.fogPulseDays);
  state.fogExposure = exposure - pulses * rules.fogPulseDays;
  if (!pulses) return;
  const buildup = fogBuildup(state);
  const qiBefore = state.qi;
  for (let pulse = 0; pulse < pulses; pulse += 1) {
    state.pressure = Math.min(rules.fogMaxPressure, Math.round((state.pressure + buildup) * 1000) / 1000);
    state.qi = Math.max(0, state.qi - fogDrain(state.pressure));
  }
  if (qiBefore > state.qi) state.actionFogLoss = (state.actionFogLoss ?? 0) + qiBefore - state.qi;
}

function restOutOfFog(state, elapsed) {
  state.pressure = Math.max(0, Math.round((state.pressure - elapsed * rules.fogRestPerDay) * 1000) / 1000);
  state.fogExposure = 0;
}
function recordPractice(state) {
  const day = Math.floor(state.day);
  if (state.practicedOn[state.realm] === day) return;
  state.practicedOn[state.realm] = day;
  state.practice[state.realm] = (state.practice[state.realm] ?? 0) + rules.practicePerDay;
}

function occupiesBackpack(state, id) {
  return !isEvidence(records.items[id]) && !Object.values(state.equipment).includes(id);
}

function mealPouchCount(state, id, count) {
  return id === state.mealPouch ? Math.min(count, rules.backpackStackSize) : 0;
}

function ordinarySlots(state, id, count) {
  return count > 0 && occupiesBackpack(state, id)
    ? Math.ceil((count - mealPouchCount(state, id, count)) / rules.backpackStackSize) : 0;
}

function backpackSlots(state, inventory = state.inventory, coins = state.coins) {
  return resourceEntries(inventory).reduce((slotsUsed, [id, count]) =>
    slotsUsed + ordinarySlots(state, id, count), Number(coins > 0));
}

function fittingItems(state, resources, spent = {}) {
  const inventory = { ...state.inventory };
  for (const [id, count] of resourceEntries(spent)) {
    if (id !== currency) inventory[id] = Math.max(0, (inventory[id] ?? 0) - count);
  }
  const coins = Math.max(0, state.coins - (spent?.[currency] ?? 0));
  let available = Math.max(0, backpackCapacity(state, rules.backpackCapacity) - backpackSlots(state, inventory, coins));
  let bagPlaces = Number(!containerCarryReason(inventory));
  const accepted = {};
  const spilled = {};
  const stackSize = rules.backpackStackSize;
  for (const [id, count] of resourceEntries(resources)) {
    if (!(count > 0) || !records.items[id]) continue;
    if (id === currency) {
      if (coins > 0 || available > 0) {
        accepted[id] = count;
        if (!coins) available--;
      } else spilled[id] = count;
      continue;
    }
    const current = inventory[id] ?? 0;
    const kind = records.items[id].kind;
    const single = Boolean(records.gear[id]) || kind === 'reference';
    const bag = kind === 'container';
    if (single && current) continue;
    const desired = single ? 1 : count;
    const occupies = occupiesBackpack(state, id);
    const used = ordinarySlots(state, id, current);
    const pouchRoom = id === state.mealPouch ? stackSize : 0;
    const room = occupies ? Math.max(0, (available + used) * stackSize + pouchRoom - current) : desired;
    const fits = Math.min(desired, room, bag ? bagPlaces : desired);
    if (fits) accepted[id] = fits;
    if (fits < desired) spilled[id] = desired - fits;
    if (occupies) available -= ordinarySlots(state, id, current + fits) - used;
    if (bag) bagPlaces -= fits;
  }
  return { accepted, spilled };
}

function combinedResources(...lists) {
  const combined = {};
  for (const list of lists) {
    for (const [id, count] of resourceEntries(list)) combined[id] = (combined[id] ?? 0) + count;
  }
  return combined;
}

function groundPlace(state) {
  return state.event ?? state.combat?.siteId ?? state.roadTrip?.stop ?? state.region;
}

const roadsideActions = new Set(['eat', 'batchEat', 'use', 'equip', 'unequip', 'equipManual',
  'unequipManual', 'selectAmmo', 'take', 'setMealPouch']);
const containerTransfers = new Set(['econBagDeposit', 'econBagWithdraw']);
const equipmentChanges = new Set(['equip', 'unequip', 'combatEquip', 'equipManual', 'unequipManual', 'upgradeManual']);

function groundAt(state, place = groundPlace(state)) {
  return state.ground?.[place] ?? {};
}

function groundPickupLimit(state, id, available = groundAt(state)[id]) {
  if (!available || (records.gear[id] && gearReserved(state, id)) || groundPickupReason(state, id)) return 0;
  return fittingItems(state, { [id]: available }).accepted[id] ?? 0;
}

function groundPickupReason(state, id, count) {
  const kind = records.items[id]?.kind;
  if (kind === 'container') return containerCarryReason(state.inventory, count);
  if (kind === 'reference' && gearReserved(state, id)) return '你已有这本书。';
  return '';
}

function leaveOnGround(state, resources, durability = {}, place = groundPlace(state)) {
  if (Object.keys(resources).length) {
    (state.ground ??= {})[place] = combinedResources(groundAt(state, place), resources);
  }
  for (const [id, count] of resourceEntries(resources)) {
    const gear = records.gear[id];
    if (!gear) continue;
    const worn = ((state.groundDurability ??= {})[place] ??= {});
    (worn[id] ??= []).push(...Array(count).fill(durability[id] ?? gear.durability));
  }
}

function addItems(state, resources, found = false) {
  const result = fittingItems(state, resources);
  leaveOnGround(state, result.spilled);
  for (const [id, count] of resourceEntries(result.accepted)) {
    if (id === currency) {
      state.coins += count;
      continue;
    }
    const gear = records.gear[id];
    state.inventory[id] = owns(state, id) + count;
    if (!state.knownItems.includes(id)) state.knownItems.push(id);
    if (gear) state.durability[id] = gear.durability;
    if (found && !isSettlement(state)) state.expeditionLoot[id] = (state.expeditionLoot[id] ?? 0) + count;
  }
  return result;
}

function addCoins(state, amount) {
  if (amount > 0) return addItems(state, { [currency]: amount });
  state.coins += amount;
  return { accepted: {}, spilled: {} };
}

function removeItem(state, id, count, spendRelief = true) {
  const remaining = owns(state, id) - count;
  if (id === currency) {
    state.coins = Math.max(0, remaining);
    return;
  }
  if (remaining > 0) {
    state.inventory[id] = remaining;
  } else {
    delete state.inventory[id];
    if (state.activeManual === id) {
      state.activeManual = null;
      normalize(state);
    }
    if (records.gear[id]) {
      delete state.durability[id];
      const slot = records.gear[id].slot;
      if (state.equipment[slot] === id) state.equipment[slot] = null;
    }
  }
  if (state.expeditionLoot[id]) {
    state.expeditionLoot[id] = Math.max(0, state.expeditionLoot[id] - count);
    if (state.expeditionLoot[id] === 0) delete state.expeditionLoot[id];
  }
  if (id === supply && spendRelief) state.reliefRations = Math.max(0, state.reliefRations - count);
}

function missingItems(state, resources) {
  return Object.fromEntries(resourceEntries(resources)
    .map(([id, count]) => [id, count - owns(state, id)]).filter(([, count]) => count > 0));
}

function payItems(state, resources) {
  for (const [id, count] of resourceEntries(resources)) {
    if (count > 0) removeItem(state, id, count);
  }
}

function say(state, message) {
  state.log.push(message);
  if (state.log.length > 60) state.log.shift();
  return { ok: true, message };
}

function refuse(message) {
  return { ok: false, message };
}

function wear(state, slot) {
  const item = state.equipment[slot];
  if (!item || state.durability[item] <= 0) return '';
  state.durability[item] = Math.max(0, state.durability[item] - rules.durabilityLoss);
  return state.durability[item] === 0 ? ` ${nameOf(item)}已损坏。` : '';
}

function victoryQuestId() {
  return data.victoryQuest ?? data.quests.find((quest) => quest.need?.seal > 0)?.id;
}

function isRevealed(state, reveal) {
  if (!reveal) return true;
  const hasLead = state.knownItems.includes(reveal.item) || state.completedQuests.includes(reveal.quest);
  return (!reveal.item && !reveal.quest || hasLead) && Object.keys(missingItems(state, reveal.need)).length === 0;
}

function refreshDiscovery(state) {
  for (const region of data.regions) {
    const knowsRoute = region.reveal ? isRevealed(state, region.reveal) : alwaysKnownRegion(region.id);
    if (knowsRoute && !state.discovered.includes(region.id)) {
      state.discovered.push(region.id);
      if (region.reveal) say(state, `你找到了通往${region.name}的路。`);
    }
  }
  if (state.world.arrived) learnAdjacentRegions(state, economyKit);
}

function knowsService(state, id) {
  if (id === 'quests' && state.completedQuests.length) return true;
  if (id === 'cultivate' && (state.realm > 0 || Object.values(state.studies).some(Boolean))) return true;
  const service = data.services.find((entry) => entry.id === id);
  return Boolean(service?.public) || (service?.items ?? []).some((item) => state.knownItems.includes(item)) ||
    (service?.choices ?? []).some((choice) => state.seenChoices.includes(choice));
}

function knowsMaterials(state, need) {
  return resourceEntries(need).every(([id, count]) => count <= 0 || state.knownItems.includes(id));
}

function knowsQuest(state, quest) {
  if (state.completedQuests.includes(quest.id)) return true;
  if (quest.id === 'lost_basket_return' && state.basketDisposition === 'unpacked') return false;
  if (quest.afterQuest && !state.completedQuests.includes(quest.afterQuest)) return false;
  if ((quest.tier ?? 0) > state.realm) return false;
  if (quest.id === victoryQuestId() && !state.discovered.includes('ford') && !state.knownItems.includes('seal')) return false;
  if (quest.id === 'sell_forging' && !state.discovered.includes('ridge')) return false;
  return isRevealed(state, quest.reveal) && (quest.requiresKnownMaterials !== true || knowsMaterials(state, quest.need));
}

function knowsRecipe(state, recipe) {
  return recipe.tier <= state.realm && (!recipe.requiresShownHide || state.showedHideToSmith) &&
    isRevealed(state, recipe.reveal) && (recipe.formula
      ? state.knownItems.includes(recipe.formula)
      : recipe.requiresKnownMaterials === false || knowsMaterials(state, recipe.need));
}

function canCraftScroll(state) {
  return data.recipes.some((recipe) => recipe.result === 'gate_scroll' && !recipe.facility && knowsRecipe(state, recipe));
}

function knowsItem(state, item) {
  if (state.knownItems.includes(item.id)) return true;
  const object = records.gear[item.id] ?? records.pills[item.id] ?? records.talismans[item.id];
  if (object && object.tier > state.realm) return false;
  if (item.reveal) return isRevealed(state, item.reveal);
  return data.recipes.some((recipe) => recipe.result === item.id && knowsRecipe(state, recipe));
}

function isEvidence(item) {
  return item?.kind === 'key' || item?.evidence === true;
}

function itemIdsWithCount(goods) {
  return resourceEntries(goods).filter(([id, count]) => count > 0 && Object.hasOwn(records.items, id)).map(([id]) => id);
}

function rememberSeenItems(state, ids) {
  const seen = new Set(state.itemSightings);
  const previous = seen.size;
  for (const id of ids) seen.add(id);
  if (seen.size === previous) return false;
  state.itemSightings = [...seen];
  return true;
}

function recordItemSightings(state, result) {
  const visibleGround = !state.banditDeath && !state.combat && !state.victoryPending &&
    (!state.roadBandit || state.roadBandit.aftermath);
  rememberSeenItems(state, [
    ...itemIdsWithCount(state.inventory),
    ...itemIdsWithCount(state.economy?.warehouse),
    ...itemIdsWithCount(result?.gathered),
    ...(visibleGround ? itemIdsWithCount(groundAt(state)) : []),
  ]);
}

function guideBookView(state) {
  if (!owns(state, guideBookId) || state.banditDeath) return null;
  return { noteLimit: guideNoteLimit, entries: guideItemIds(state).map((id) => ({ id, note: state.itemNotes?.[id] ?? '' })) };
}

function guideItemIds(state) {
  return [...new Set([...(state.itemSightings ?? []), ...itemIdsWithCount(state.inventory)])];
}

function editGuideNote(state, { id, text }) {
  if (!owns(state, guideBookId) || state.banditDeath) return refuse('得把百科全书带在身上。');
  if (!Object.hasOwn(records.items, id) || !guideItemIds(state).includes(id)) return refuse('书上还没有这件物品。');
  if (typeof text !== 'string' || text.length > guideNoteLimit) return refuse(`一条说明最多写${guideNoteLimit}字。`);
  const notes = state.itemNotes ??= {};
  if (text === '') delete notes[id];
  else notes[id] = text;
  return { ok: true };
}

function offeredObservationIds(state, source) {
  if (state.banditDeath || state.victoryPending || state.combat || state.roadTrip || state.event || state.gathering) return [];
  if (source === 'market' && atHome(state) && knowsService(state, 'market')) {
    return data.market.stalls.flatMap(({ offers }) => stockedOffers(state, offers).map(({ id }) => id));
  }
  if (source === 'localMarket' && !atHome(state)) {
    const place = settlementOf(data, state.region);
    return place ? Object.keys(localGoods(place)).filter((id) => records.items[id] && !isEvidence(records.items[id])) : [];
  }
  if (source === 'alchemy' && atHome(state)) return alchemyView(state, economyKit)?.offers.map(({ id }) => id) ?? [];
  return [];
}

function observeGuideItems(state, { source, ids }) {
  if (!Array.isArray(ids) || ids.length > data.items.length) return refuse('没有看见这些东西。');
  const visible = new Set(offeredObservationIds(state, source));
  if (ids.some((id) => !visible.has(id))) return refuse('没有看见这些东西。');
  return { ok: true, changed: rememberSeenItems(state, ids) };
}

function knowsDeduction(state, entry) {
  return (entry.tier ?? 0) <= state.realm && isRevealed(state, entry.reveal);
}

function hasDeduced(state, id) {
  return state.deductionHistory.some((entry) => entry.id === id);
}

function usedDeductionClues(state) {
  return [...new Set(state.deductionHistory.flatMap(({ id }) => Object.keys(experiments[id].need)))];
}

function deductionDraftView(state) {
  const id = state.deductionDraftId;
  if (!id || !hasChoiceNeeds(state, experiments[id])) return null;
  const items = Object.keys(experiments[id].need).map((key) => {
    const { id, name, desc } = records.items[key];
    return { id, name, desc };
  });
  return { id, title: records.deductions[id].name, items };
}

export function createGame(seed = Math.floor(Math.random() * 0x100000000)) {
  const settings = data.starting ?? {};
  const state = {
    day: 1,
    realm: 0,
    region: hub,
    world: initialWorld(),
    training: initialTraining(),
    activeManual: null,
    manualRanks: {},
    mechanisms: initialMechanisms(),
    tournament: initialTournament(),
    regulatedBoutUntil: 0,
    hp: 0,
    satiety: clamp(settings.satiety ?? rules.maxSatiety, 0, rules.maxSatiety),
    didEat: false,
    qi: 0,
    coins: settings.coins ?? 10,
    mealPouch: supply,
    insight: settings.insight ?? 0,
    pressure: 0,
    fogExposure: 0,
    wounds: 0,
    toxin: 0,
    focus: 0,
    inventory: {},
    knownItems: [],
    itemSightings: [],
    itemNotes: {},
    reliefRations: 0,
    equipment: Object.fromEntries(slots.map((slot) => [slot, null])),
    durability: {},
    completedQuests: [],
    economy: initialEconomyState(),
    alchemy: initialAlchemyState(),
    completedDeductions: [],
    deductionDraftId: null,
    deductionHistory: [],
    explored: [],
    discovered: [],
    eventsSeen: {},
    seenChoices: [],
    localPools: {},
    siteVictories: {},
    siteClaims: {},
    huntTracks: {},
    siteWitnesses: {},
    encounterSeed: seed >>> 0,
    combatSeed: (seed ^ 0x9e3779b9) >>> 0,
    evadeSeed: (seed ^ 0x85ebca6b) >>> 0,
    enemyEvadeSeed: (seed ^ 0x27d4eb2f) >>> 0,
    roadSeed: (seed ^ 0xc2b2ae35) >>> 0,
    banditLootSeed: (seed ^ 0x76f1c043) >>> 0,
    banditLossSeed: (seed ^ 0x0c53d24f) >>> 0,
    escapeSeed: (seed ^ 0x165667b1) >>> 0,
    roadTrip: null,
    roadBandit: null,
    banditCrews: {},
    banditSpoils: {},
    banditDeath: null,
    resolvedBandits: [],
    banditLeads: [],
    basketInspected: false,
    basketDisposition: null,
    showedHideToSmith: false,
    defeated: [],
    studies: {},
    practice: {},
    practicedOn: {},
    event: null,
    gathering: null,
    combat: null,
    selectedAmmo: null,
    expeditionLoot: {},
    ground: {},
    groundDurability: {},
    won: false,
    wonDay: null,
    victoryPending: false,
    completionPhase: null,
    finalWon: false,
    finalDay: null,
    log: [],
  };
  addItems(state, settings.inventory ?? { ration: 4, wood: 2 });
  for (const id of Array.isArray(settings.gear) ? settings.gear : Object.values(settings.gear ?? {})) {
    if (records.gear[id]) {
      addItems(state, { [id]: 1 });
      state.equipment[records.gear[id].slot] = id;
    }
  }
  recordItemSightings(state);
  const { maxHp, maxQi } = stats(state);
  state.hp = maxHp;
  state.qi = maxQi;
  refreshDiscovery(state);
  return state;
}

function currentIntent(state) {
  return state.combat?.plan?.intent ?? null;
}

function readableIntent(state) {
  return state.combat?.plan?.reader === 'enemy' ? null : currentIntent(state);
}

function enemyMedicine(state) {
  if (inRegulatedBout(state)) return null;
  const carried = enemyOf(state)?.medicine;
  if (!carried || (state.combat.medicineLeft ?? carried.count) <= 0) return null;
  const { id, count } = carried;
  const name = nameOf(id);
  const action = id === 'salve' ? `敷上${name}` : id === 'jade_pill' ? `喝下${name}` : `服下${name}`;
  return { id, name, action, hp: records.pills[id].hp, qi: records.pills[id].qi ?? 0, left: state.combat.medicineLeft ?? count };
}

function enemyContext(state) {
  const { round, hp, lastEnemyIntent, enemyCharged, observedHits } = state.combat;
  return {
    round, hp, previousKind: lastEnemyIntent?.kind, charged: Boolean(enemyCharged),
    observedHits: observedHits ?? [], medicine: enemyMedicine(state), qi: state.combat.enemyQi ?? enemyOf(state)?.qi ?? 0,
  };
}

function prepareCombatRound(state) {
  const combat = state.combat;
  if (!combat || combat.plan?.round === combat.round) return;
  const enemy = enemyOf(state);
  const context = enemyContext(state);
  const affectsPlayer = spiritFrame(combat, true);
  const affectsEnemy = spiritFrame(combat);
  const perceivedPlayer = stats(state).perception * (affectsPlayer?.id === 'veil_eye' ? affectsPlayer.strength : 1);
  const perceivedEnemy = (enemy.perception ?? 0) * (affectsEnemy?.id === 'veil_eye' ? affectsEnemy.strength : 1);
  const gap = perceivedPlayer - perceivedEnemy;
  const magnitude = Math.abs(gap);
  const chance = Math.min(rules.perceptionCap, magnitude / (rules.perceptionScale + magnitude));
  const seed = state.combatSeed ?? ((state.encounterSeed ^ 0x9e3779b9) >>> 0);
  state.combatSeed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  const reads = state.combatSeed / 0x100000000 < chance;
  combat.plan = { round: combat.round, reader: reads ? (gap > 0 ? 'player' : 'enemy') : null,
    intent: chooseEnemyIntent(enemy, context) };
}

function canInterceptOpening(state, intent) {
  return Boolean(state.combat?.openingRange && state.combat.round === 0 &&
    (intent?.kind === 'attack' || intent?.kind === 'heavy') && !intent.ranged && intent.damageType !== 'magic');
}

function visibleAttack(intent) {
  if (!intent) return null;
  const { name, kind } = intent;
  return { name, kind, ...(attackingIntent(intent) ? { damageType: intent.damageType ?? 'physical' } : {}) };
}

function hasChoiceNeeds(state, choice) {
  return Object.keys(missingItems(state, choice.need)).length === 0;
}

function siteWins(state, site, enemy) {
  return state.siteVictories?.[site?.id]?.[enemy] ?? 0;
}

const choiceGuards = (choice) => [].concat(choice.guardedBy ?? []);

const choiceExcluded = (state, choice, site) =>
  Boolean(choice.excludesChoices?.some((index) => state.seenChoices.includes(`${site.id}:${index}`)));

function knowsChoice(state, choice, site) {
  const previous = choice.afterChoice ?? choice.afterVisitChoice;
  const reissue = choice.reissue;
  if (reissue && (!state.knownItems.includes(reissue.item) || owns(state, reissue.item) ||
      (reissue.beforeQuest && state.completedQuests.includes(reissue.beforeQuest)) ||
      (reissue.beforeItem && state.knownItems.includes(reissue.beforeItem)))) return false;
  return (previous === undefined || state.seenChoices.includes(typeof previous === 'string' && previous.includes(':') ? previous : `${site?.id}:${previous}`)) &&
    (!choice.afterFight || siteWins(state, site, choice.afterFight) > 0) &&
    (!choice.hideWhenExcluded || !choiceExcluded(state, choice, site)) &&
    (!choice.hidden || hasChoiceNeeds(state, choice));
}

function knowsSite(state, site) {
  const visited = state.eventsSeen[site.region] ?? [];
  const startsVisible = !site.afterChoices?.length && !site.reveal && !site.afterBandit;
  return startsVisible || visited.includes(site.id) ||
    Boolean(site.afterBandit && state.banditLeads.includes(site.id)) ||
    Boolean(site.afterChoices?.some((id) => state.seenChoices.includes(id))) ||
    Boolean(site.reveal && isRevealed(state, site.reveal));
}

function recoveryDays(pool, count, wild) {
  if (count === 0) return pool.interval * (pool.depletedFactor ?? 1);
  if (!wild) return pool.interval;
  const distanceFromHalf = count / pool.cap - 0.5;
  return pool.interval * (0.8 + 2.4 * distanceFromHalf ** 2);
}

function poolAt(state, site, kind, id) {
  const pool = site[kind][id];
  const canGrow = pool.interval > 0 && pool.growth > 0;
  const wild = kind === 'creatures' && pool.curve === 'wild';
  const stored = state.localPools[site.id]?.[kind]?.[id] ?? {
    count: pool.start,
    nextAt: canGrow && pool.start < pool.cap ? 1 + recoveryDays(pool, pool.start, wild) : null,
  };
  if (!canGrow || stored.nextAt === null || state.day < stored.nextAt) return stored;
  if (wild) {
    let { count, nextAt } = stored;
    while (nextAt !== null && state.day >= nextAt) {
      count = Math.min(pool.cap, count + pool.growth);
      nextAt = count < pool.cap ? nextAt + recoveryDays(pool, count, true) : null;
    }
    return { count, nextAt };
  }
  const periods = Math.floor((state.day - stored.nextAt) / pool.interval) + 1;
  const count = Math.min(pool.cap, stored.count + periods * pool.growth);
  return { count, nextAt: count < pool.cap ? stored.nextAt + periods * pool.interval : null };
}

function spendPool(state, site, kind, id, amount) {
  const pool = site[kind][id];
  const current = poolAt(state, site, kind, id);
  const count = current.count - amount;
  let nextAt = current.nextAt;
  if (pool.interval > 0 && pool.growth > 0) {
    const wild = kind === 'creatures' && pool.curve === 'wild';
    const recovery = recoveryDays(pool, count, wild);
    const holdsPassage = kind === 'creatures' && records.events[site.id]?.choices.some((choice) => choiceGuards(choice).includes(id));
    if (count === 0 && (pool.depletedFactor !== undefined || holdsPassage || wild)) nextAt = state.day + recovery;
    else if (nextAt === null) nextAt = state.day + recovery;
  }
  const local = (state.localPools[site.id] ??= {});
  (local[kind] ??= {})[id] = { count, nextAt };
}

function poolCounts(state, site, kind) {
  return Object.fromEntries(Object.keys(site[kind] ?? {}).map((id) => [id, poolAt(state, site, kind, id).count]));
}

function currentSites(state) {
  return data.sites.filter((site) => site.region === state.region && knowsSite(state, site));
}

function viewSite(state, site) {
  const visited = state.eventsSeen[site.region]?.includes(site.id) ?? false;
  const stocks = visited && site.stocks ? poolCounts(state, site, 'stocks') : null;
  const choices = records.events[site.id]?.choices ?? [];
  return {
    id: site.id, name: site.name, visited,
    witnessedEnemies: [...new Set([...(state.siteWitnesses?.[site.id] ?? []), ...Object.keys(state.siteVictories?.[site.id] ?? {})])],
    ...(stocks ? { stocks, stockDetails: Object.entries(stocks)
      .filter(([id]) => site.stocks[id].choices.some((index) => choices[index] && knowsChoice(state, choices[index], site)))
      .map(([id, count]) => {
        const pool = site.stocks[id];
        const item = pool.item ?? id;
        return { id, item, label: pool.label ?? nameOf(item), count, renewable: pool.interval > 0 && pool.growth > 0 };
      }) } : {}),
    ...(visited && site.creatures ? { creatures: poolCounts(state, site, 'creatures') } : {}),
    hasGroundLoot: Object.keys(groundAt(state, site.id)).length > 0,
  };
}

function siteText(state, site, event) {
  if (!site) return event.text;
  const trial = event.experiment;
  const verified = trial?.afterText && state.completedDeductions.includes(trial.id) ? trial.afterText : null;
  const changed = Object.entries(site.afterOnceText ?? {}).findLast(([index]) => state.seenChoices.includes(`${event.id}:${index}`));
  const opened = Object.entries(site.afterWinText ?? {}).find(([id]) => siteWins(state, site, id) > 0);
  const stocks = poolCounts(state, site, 'stocks');
  const creatures = poolCounts(state, site, 'creatures');
  if (site.emptyText && [...Object.values(stocks), ...Object.values(creatures)].every((count) => !count)) return site.emptyText;
  const choiceDetails = Object.entries(site.choiceText ?? {}).map(([index, words]) =>
    state.seenChoices.includes(`${event.id}:${index}`) ? words.after : words.before);
  const stockDetails = Object.entries(site.stockText ?? {}).map(([id, words]) => stocks[id] ? words.present : words.absent);
  const creatureDetails = Object.entries(site.creatureText ?? {}).map(([id, words]) => creatures[id] ? words.present : words.absent);
  const tide = site.ebbText && (ebbTimeLeft(state) > 0 ? site.ebbText.low : site.ebbText.high);
  return [verified ?? changed?.[1] ?? opened?.[1] ?? event.text, tide, ...choiceDetails, ...stockDetails, ...creatureDetails].filter(Boolean).join('');
}

function availableExperiment(state, event) {
  const trial = event?.experiment;
  if (!trial || records.sites[event.id]?.region !== state.region || state.completedDeductions.includes(trial.id)) return null;
  return hasDeduced(state, trial.id) && hasChoiceNeeds(state, trial) ? trial : null;
}

function experimentBlocker(state, event, trial) {
  const site = records.sites[event.id];
  if (trial.afterFight && siteWins(state, site, trial.afterFight) === 0) {
    return `先过${records.enemies[trial.afterFight].name}这一关。`;
  }
  if (remainingGuards(state, site, trial) > 0) {
    const guards = choiceGuards(trial).filter((id) => site.creatures[id] && poolAt(state, site, 'creatures', id).count > 0);
    return `${guards.map((id) => records.enemies[id].name).join('、')}又堵住了去路。`;
  }
  const missing = missingItems(state, trial.fieldNeed);
  return Object.keys(missing).length ? `手边还缺${goodsText(missing)}。` : '';
}

function revisitableEvents(state) {
  if (state.event || state.combat) return [];
  return (state.eventsSeen[state.region] ?? []).map((id) => records.events[id]).filter((event) =>
    availableExperiment(state, event) || (event.revisit && event.choices.some((choice, index) =>
      choice.hidden && hasChoiceNeeds(state, choice) && !state.seenChoices.includes(`${event.id}:${index}`))));
}

export function view(state) {
  const enemy = enemyOf(state);
  const combatRead = state.combat?.plan?.reader ?? null;
  const observed = combatRead === 'player';
  const intent = observed ? readableIntent(state) : null;
  const inSettlement = isSettlement(state);
  const mode = state.banditDeath ? 'death' : state.victoryPending ? 'victory' : state.combat ? 'combat'
    : state.roadTrip ? 'road' : state.event ? 'event' : inSettlement ? 'village' : 'field';
  const questLocation = inSettlement ? state.region : hub;
  const discoveredQuests = data.quests.filter((quest) => (quest.region ?? hub) === questLocation && knowsQuest(state, quest));
  const services = data.services.filter(({ id }) => knowsService(state, id) && (!inSettlement || atHome(state) ||
    id === 'cultivate' || (id === 'quests' && discoveredQuests.length) || (id === 'workshop' && canCraftScroll(state)))).map(({ id }) => id);
  const knownRecipes = services.includes('workshop') ? data.recipes.filter((recipe) => !recipe.facility &&
    (!inSettlement || atHome(state) || recipe.result === 'gate_scroll') && knowsRecipe(state, recipe)) : [];
  const currentEvent = state.event ? records.events[state.event] : null;
  const currentSite = currentEvent && records.sites[currentEvent.id];
  const experiment = availableExperiment(state, currentEvent);
  const usedClues = usedDeductionClues(state);
  const activeClues = data.items.filter((item) =>
    !item.breakthrough && !item.recipeOnly && isEvidence(item) && owns(state, item.id) > 0 && !usedClues.includes(item.id));
  const nextRealm = services.includes('cultivate') ? records.realms[state.realm + 1] ?? null : null;
  const groundLoot = { ...groundAt(state) };
  const combatWeapon = weaponView(state);
  const side = sideWeapon(state);
  const fist = fistWeapon(state);
  const fistTechnique = activeManualRank(state)?.fistCharge;
  const fistChargeReason = combatFistReason(state, fistTechnique);
  const studies = trainingView(state, economyKit);
  const visibleChoices = (currentEvent?.choices ?? []).map((choice, index) => {
    const blocker = choiceBlocker(state, choice, currentSite, index);
    const { label, desc, hidden } = choice;
    const gather = gatherOptions(state, choice, currentSite, index);
    const track = choice.encounter && activeHuntTrack(state, currentSite, index);
    const trace = track ? `上回遇到的${records.enemies[track.enemy].name}还守在这条路上。` : '';
    return { label, desc: blocker?.depleted ? '' : `${desc ?? ''}${trace}`, hidden, index, cost: Math.max(0, -(choice.coins ?? 0)),
      available: !blocker, lockedReason: blocker?.reason ?? '',
      ...(gather.length ? { gather } : {}) };
  }).filter(({ index }) => !completedSiteChoice(state, currentSite, index) &&
    knowsChoice(state, currentEvent.choices[index], currentSite));
  const { combatSeed, evadeSeed, enemyEvadeSeed, roadSeed, banditLootSeed, banditLossSeed, escapeSeed, combat, roadTrip,
    roadBandit, banditCrews, banditSpoils, resolvedBandits, banditLeads, itemSightings, itemNotes,
    huntTracks, deductionDraftId, deductionHistory, pressure, fogExposure, actionFogLoss, ...visibleState } = state;
  return {
    ...visibleState,
    inventory: { ...state.inventory, ...(state.coins > 0 ? { [currency]: state.coins } : {}) },
    packedMeal: state.mealPouch ? { id: state.mealPouch, count: mealPouchCount(state, state.mealPouch, owns(state, state.mealPouch)) } : null,
    edibleMeals: mode === 'combat' ? [] : data.foods.filter(({ id }) => !mealBlocker(state, id)).map(({ id }) => id),
    ...stats(state),
    guideBook: guideBookView(state),
    itemNotes: { ...itemNotes },
    ...worldView(state, economyKit),
    roadTrip: roadTrip ? { ...roadTripView(state, economyKit), bandit: roadBanditView(state, economyKit) } : null,
    localHazard: hazardView(state, economyKit),
    training: studies.rows,
    innerStyle: innerStyleView(state, combatWeapon, side),
    mechanism: mechanismView(state, economyKit),
    spiritSense: studies.spiritSense,
    medicineUseReasons: Object.fromEntries(resourceEntries(state.inventory).flatMap(([id]) => {
      const reason = senseMedicineBlocker(state, records.pills[id]);
      return reason ? [[id, reason]] : [];
    })),
    tournament: tournamentView(state, economyKit),
    maxSatiety: rules.maxSatiety,
    restSessions: mode === 'village' && settlementOf(data, state.region)?.inn ? recoverySessions(state) : 0,
    batchMeals: (['field', 'village', 'event'].includes(mode) || (mode === 'road' && (!roadBandit || roadBandit.aftermath))) && !state.gathering
      ? Object.fromEntries(data.foods.map(({ id }) => [id, batchMealCount(state, id)]).filter(([, count]) => count > 1))
      : {},
    fogTier: fogTier(pressure),
    fogExposed: fogExposureActive(state),
    mode,
    day: state.day,
    realmIndex: state.realm,
    realm: realmOf(state),
    nextRealm,
    progression: {
      practice: state.practice[state.realm] ?? 0,
      requiredPractice: nextRealm?.practice ?? 0,
      pending: nextRealm ? breakthroughBlockers(state, nextRealm) : [],
    },
    regionId: state.region,
    region: regionOf(state),
    services,
    repairService: mode === 'village' ? repairServiceView(state) : null,
    backpackUsed: backpackSlots(state),
    backpackCapacity: backpackCapacity(state, rules.backpackCapacity),
    backpackName: backpackName(state, rules.backpackCapacity),
    discardOptions: Object.fromEntries(itemIdsWithCount(state.inventory).map((id) => [id, discardTerms(state, id)])),
    groundLoot,
    groundWear: Object.fromEntries(resourceEntries(groundLoot).filter(([id]) => records.gear[id])
      .map(([id]) => [id, state.groundDurability?.[groundPlace(state)]?.[id]?.[0] ?? records.gear[id].durability])),
    groundPickup: Object.fromEntries(resourceEntries(groundLoot).map(([id, count]) => [id, groundPickupLimit(state, id, count)])),
    groundPickupReasons: Object.fromEntries(resourceEntries(groundLoot).flatMap(([id]) => {
      const reason = groundPickupReason(state, id);
      return reason ? [[id, reason]] : [];
    })),
    sites: currentSites(state).map((site) => viewSite(state, site)),
    currentEvent: currentEvent ? { id: currentEvent.id, name: currentEvent.name, text: siteText(state, currentSite, currentEvent), choices: visibleChoices } : null,
    visibleChoices,
    experiment: experiment ? {
      id: experiment.id,
      desc: experiment.desc,
      blockedReason: experimentBlocker(state, currentEvent, experiment),
      controls: experiment.controls.map(({ id, label, options }) => ({
        id, label, options: options.map(({ id, label }) => ({ id, label })),
      })),
    } : null,
    revisitableEvents: revisitableEvents(state).map(({ id, name }) => ({ id, name })),
    combat: combat ? { id: combat.id, siteId: combat.siteId, round: combat.round } : null,
    currentEnemy: enemy ? { id: enemy.id, name: enemy.name, desc: enemy.desc,
      sparring: inProtectedBout(state), medicineRestricted: inRegulatedBout(state),
      health: Math.max(0.05, Math.round(20 * combat.hp / enemy.hp) / 20) } : null,
    boutPause: regulatedBoutWaitDays(state),
    combatWeapon,
    combatOffhand: side ? { id: side.id, name: nameOf(side.id), chargeRequired: Boolean(side.chargeRequired) } : null,
    combatFist: combat ? { name: fist ? nameOf(fist.id) : '徒手出拳',
      chargeName: fistTechnique ? fistTechnique.name ?? '蓄势出拳' : null,
      chargeAvailable: Boolean(fistTechnique && !fistChargeReason), chargeReason: fistChargeReason } : null,
    openingShotReady: canInterceptOpening(state, intent) && Boolean(combatWeapon.selectedAmmo),
    openingShotPossible: Boolean(combat?.openingRange && combat.round === 0 && combatWeapon.selectedAmmo),
    combatRead,
    combatCharge: Boolean(combat?.playerCharge),
    chargingWeapon: combat?.playerCharge ? { ...combat.playerCharge,
      name: combat.playerCharge.id === 'bare_fist' ? '拳势' : nameOf(combat.playerCharge.id) } : null,
    enemyCharged: Boolean(combat?.enemyCharged),
    lastEnemyIntent: combat?.lastEnemyIntent ?? null,
    intent: visibleAttack(intent),
    retreatRisk: intent && !inProtectedBout(state) ? { blocked: attackingIntent(intent) } : null,
    breathingQi: intent?.kind === 'guard' ? breathingQi(state) : 0,
    discoveredRecipes: knownRecipes.map(({ id }) => id),
    craftReasons: inSettlement ? Object.fromEntries(knownRecipes.map((recipe) => [recipe.id, craftBlocker(state, recipe)])) : {},
    discoveredQuests: discoveredQuests.map(({ id }) => id),
    discoveredItems: data.items.filter((item) => knowsItem(state, item)).map(({ id }) => id),
    market: !inSettlement || atHome(state) ? marketView(state) : { stalls: [], sales: [] },
    economy: economyView(state, economyKit),
    alchemy: alchemyView(state, economyKit),
    homeMaterials: inSettlement ? Object.fromEntries(data.items.map(({ id }) => [id, homeSupplies(state, id)]).filter(([, count]) => count > 0)) : {},
    evidence: activeClues.map(({ id, name, desc }) => ({ id, name, desc, count: owns(state, id) })),
    activeClues: activeClues.map(({ id }) => id),
    usedClues,
    deductionQiCost: rules.deductionQiCost,
    deductionDraft: deductionDraftView(state),
    deductionHistory: deductionHistory.map(({ id, day }) => {
      const site = records.sites[experimentSites[id]];
      return {
        id, day, title: records.deductions[id].name, ...sandboxDeductions[id],
        destination: site && { region: records.regions[site.region].name, site: site.name },
        verified: state.completedDeductions.includes(id),
      };
    }),
    quests: discoveredQuests.map((quest) => {
      const completed = state.completedQuests.includes(quest.id);
      const blockedReason = completed ? '' : questBlocker(state, quest);
      return { ...quest, completed, ready: !completed && !blockedReason, blockedReason };
    }),
    lastMessage: state.log.at(-1) ?? '',
  };
}

function travel(state, id) {
  return travelRoad(state, id, economyKit);
}

function visit(state, id) {
  const site = records.sites[id];
  if (!site || site.region !== state.region || !knowsSite(state, site)) return refuse('你还不知道怎么去那里。');
  if (state.satiety === 0) return refuse('腹中空空，先吃些东西。');
  return encounter(state, site.id);
}

function revisit(state, id) {
  return revisitableEvents(state).some((event) => event.id === id)
    ? visit(state, id)
    : refuse('你还不知道该回哪里查这条线索。');
}

function wait(state) {
  if (!isSettlement(state) && state.satiety === 0) return refuse('腹中空空，先吃些东西，或退回住处歇脚。');
  advance(state, rules.waitDays);
  return say(state, '等了半日。');
}

function encounter(state, id) {
  const region = regionOf(state);
  state.event = id;
  advance(state, rules.exploreDays);
  const known = state.eventsSeen[state.region] ?? [];
  if (!known.includes(id)) state.eventsSeen[state.region] = [...known, id];
  const first = !state.explored.includes(state.region);
  if (first) {
    state.explored.push(state.region);
    state.insight += rules.firstRegionInsight;
  }
  return say(state, `在${region.name}遇上${records.events[id].name}。${first ? `初探此地，见识+${rules.firstRegionInsight}。` : ''}`);
}

function startCombat(state, id, siteId, openingRange = false) {
  const enemy = records.enemies[id];
  if (siteId) {
    const witnesses = ((state.siteWitnesses ??= {})[siteId] ??= []);
    if (!witnesses.includes(id)) witnesses.push(id);
  }
  state.combat = { id, siteId, hp: enemy.hp, enemyQi: enemy.qi ?? 0, round: 0, escapeBonus: 0, openingRange };
}

function completedSiteChoice(state, site, index) {
  if (site?.once?.includes(index) && state.seenChoices.includes(`${site.id}:${index}`)) return true;
  const choice = site && records.events[site.id]?.choices[index];
  return Boolean(choice?.perWin && (state.siteClaims?.[site.id]?.[index] ?? 0) >= siteWins(state, site, choice.afterFight));
}

function choiceStocks(site, choice, index) {
  return Object.entries(site?.stocks ?? {})
    .filter(([key, pool]) => pool.choices.includes(index) && choice.loot?.[pool.item ?? key] > 0)
    .map(([key, pool]) => ({ key, id: pool.item ?? key, pool }));
}

function remainingGuards(state, site, choice) {
  return choiceGuards(choice).reduce((count, id) => count + (site?.creatures?.[id] ? poolAt(state, site, 'creatures', id).count : 0), 0);
}

function worldRoll(state) {
  state.encounterSeed = (Math.imul(1664525, state.encounterSeed) + 1013904223) >>> 0;
  return state.encounterSeed / 0x100000000;
}

function encounterPools(state, site, encounter) {
  return encounter.map((id) => [id, poolAt(state, site, 'creatures', id).count]);
}

function activeHuntTrack(state, site, index) {
  const trace = state.huntTracks?.[site.id]?.[index];
  return trace && state.day - trace.day < rules.mixedTrackDays &&
    poolAt(state, site, 'creatures', trace.enemy).count > 0 ? trace : null;
}

function saveHuntTrack(state) {
  const fight = state.combat;
  if (fight?.huntChoice === undefined) return;
  const tracks = ((state.huntTracks ??= {})[fight.siteId] ??= {});
  tracks[fight.huntChoice] = { enemy: fight.id, hp: fight.hp, day: state.day,
    observedHits: fight.observedHits ?? [], medicineLeft: fight.medicineLeft, enemyQi: fight.enemyQi };
}

function selectEncounter(state, site, choice) {
  const pools = encounterPools(state, site, choice.encounter)
    .map(([id, count]) => [id, count * (choice.encounterWeights?.[id] ?? 1)]);
  const total = pools.reduce((sum, [, count]) => sum + count, 0);
  if (!total) return null;
  let ticket = Math.floor(worldRoll(state) * total);
  for (const [id, count] of pools) {
    if (ticket < count) return id;
    ticket -= count;
  }
  return null;
}

function rollHarvestAmbush(state, site, ambush) {
  if (!ambush || !records.enemies[ambush.enemy] || !(ambush.chance > 0) || !site?.creatures?.[ambush.enemy] ||
      poolAt(state, site, 'creatures', ambush.enemy).count === 0) return false;
  return worldRoll(state) < ambush.chance;
}

function ebbTimeLeft(state) {
  return rules.ebbWindowDays - state.day % rules.ebbCycleDays;
}

function fieldToolWear(state, item) {
  return state.equipment.offhand === item ? state.durability[item] ?? 0 : 0;
}

function gatherOptions(state, choice, site, index) {
  const foodPerBatch = (choice.days ?? 0) * rules.satietyDrainPerDay;
  // A final batch can use up the remaining food, but an empty stomach cannot start a new batch.
  const foodBatches = foodPerBatch ? Math.ceil(state.satiety / foodPerBatch) : Infinity;
  const toolBatches = choice.fieldTool ? fieldToolWear(state, choice.fieldTool) : Infinity;
  const tideBatches = choice.ebbOnly ? Math.max(0, Math.floor(ebbTimeLeft(state) / choice.days)) : Infinity;
  const batches = Math.min(foodBatches, toolBatches, tideBatches);
  return choiceStocks(site, choice, index).map(({ key, id }) => {
    const yieldPerBatch = choice.loot[id];
    const maximum = Math.min(poolAt(state, site, 'stocks', key).count, yieldPerBatch * batches);
    return { id, name: nameOf(id), maximum, suggested: Math.min(maximum, yieldPerBatch) };
  }).filter(({ maximum }) => maximum > 0);
}

function choiceBlocker(state, choice, site, index) {
  if (completedSiteChoice(state, site, index)) return { reason: '这件事已经办过了。' };
  if (choiceExcluded(state, choice, site)) {
    return { reason: choice.excludedReason ?? '这趟已经答应替另一边办事。' };
  }
  if (choice.phase === 'night' && state.day % 1 < 0.5) return { reason: choice.phaseReason ?? '等到夜里再来。' };
  const cooldown = (state.siteCooldowns?.[site.id]?.[index] ?? 0) - state.day;
  if (cooldown > 0) return { reason: `${choice.cooldownText ?? (choice.afterFight ? '下一班还没回来。' : '眼下还得等一等。')}${Math.ceil(cooldown * 8) / 8} 日后再来。` };
  if (choice.ebbOnly && ebbTimeLeft(state) < choice.days) {
    return { reason: ebbTimeLeft(state) > 0 ? '水已经开始回涨，来不及绕过去再采一遍。' : '水盖过了石脊。每隔两日会退一次。' };
  }
  if (choice.fieldTool && !fieldToolWear(state, choice.fieldTool)) {
    return { reason: `副手要装备完好的${nameOf(choice.fieldTool)}。` };
  }
  if (site?.regulatedBout && records.enemies[choice.enemy]?.sparring) {
    const reason = regulatedBoutBlocker(state);
    if (reason) return { reason };
  }
  if ((state.world.recovery[`${site?.id}:${choice.enemy}`] ?? 0) > state.day) return { reason: '教习收了练兵，先歇一歇再来。' };
  if (site?.creatures?.[choice.enemy] && poolAt(state, site, 'creatures', choice.enemy).count === 0) {
    const reason = records.enemies[choice.enemy]?.sparring
      ? (site.creatures[choice.enemy].interval > 0 ? '对方收了兵器，过几日再来切磋。' : '这场切磋已经比过了。')
      : '眼下没有可追的对手。';
    return { reason, depleted: true };
  }
  if (choice.encounter && !encounterPools(state, site, choice.encounter).some(([, count]) => count > 0)) {
    return { reason: '这里已经静下来了，找不到还能交手的对手。', depleted: true };
  }
  const stocks = choiceStocks(site, choice, index);
  if (stocks.length && stocks.every(({ key }) => poolAt(state, site, 'stocks', key).count === 0)) {
    const renewable = stocks.some(({ pool }) => pool.interval > 0 && pool.growth > 0);
    return { reason: renewable ? '这里暂时已经采空了。' : '这处材料已经取尽。', depleted: true };
  }
  const guards = remainingGuards(state, site, choice);
  if (guards > 0) {
    const activeGuards = choiceGuards(choice).filter((id) => poolAt(state, site, 'creatures', id).count > 0);
    const humans = activeGuards.filter((id) => records.enemies[id].tags.includes('human')).length;
    const unit = humans === 0 ? '只' : humans === activeGuards.length ? '人' : '个对手';
    return { reason: `还有 ${guards} ${unit}挡着这条路。` };
  }
  if (choice.perWin && Object.keys(choice.loot ?? {}).some((id) => records.gear[id] &&
      (gearReserved(state, id) || Object.values(state.ground).some((pile) => pile[id])))) {
    return { reason: '同样的奖品已有一份。' };
  }
  if (state.satiety === 0 && ((choice.days ?? 0) > 0 || choice.enemy || choice.encounter)) return { reason: '腹中空空，先吃些东西。' };
  const coins = choice.coins ?? 0;
  const missing = missingItems(state, choice.need);
  if (Object.keys(missing).length) return { reason: `还缺${goodsText(missing)}。` };
  if (choice.reissue && !hasRoom(state, choice.loot, choice.need)) return { reason: '行囊放不下，先腾一格。' };
  if (state.coins + coins < 0) return { reason: `还需${-coins}枚灵钱。` };
  return null;
}

function beginGather(state, index) {
  const event = records.events[state.event];
  const site = records.sites[state.event];
  const choice = event.choices[index];
  if (!Number.isInteger(index) || !choice || !knowsChoice(state, choice, site) || !choiceStocks(site, choice, index).length) {
    return refuse('请选择眼前能采的东西。');
  }
  const blocker = choiceBlocker(state, choice, site, index);
  if (blocker) return refuse(blocker.reason);
  state.gathering = { siteId: site.id, index, days: choice.days };
  return { ok: true };
}

function choose(state, { index, itemId, count }) {
  const event = records.events[state.event];
  const site = records.sites[event.id];
  const choice = event.choices[index];
  if (!Number.isInteger(index) || !choice || !knowsChoice(state, choice, site)) {
    return refuse('请选择眼前能做的事。');
  }
  const blocker = choiceBlocker(state, choice, site, index);
  if (blocker) return refuse(blocker.reason);
  const track = choice.encounter && activeHuntTrack(state, site, index);
  const options = gatherOptions(state, choice, site, index);
  const gatherArmor = options.length && choice.injury && choice.hp < 0
    ? activeGear(state).find(({ field }) => field?.gatherPadding > 0) : undefined;
  const padding = Math.min(gatherArmor?.field.gatherPadding ?? 0, Math.max(0, -(choice.hp ?? 0) - 1));
  const hpChange = (choice.hp ?? 0) + padding;
  const explicitQuantity = itemId !== undefined || count !== undefined;
  let batches = 1;
  let requested;
  if (explicitQuantity) {
    const selected = options.find(({ id }) => id === itemId);
    if (!selected || !Number.isSafeInteger(count) || count < 1 || count > selected.maximum) {
      return refuse('请选择这里能采的材料和数量。');
    }
    const yieldPerBatch = choice.loot[selected.id];
    const injuryPerBatch = Math.max(0, -hpChange);
    batches = Math.ceil(count / yieldPerBatch);
    // The injury follows gathering. If it causes a fall, no further batch can start.
    if (injuryPerBatch) batches = Math.min(batches, Math.ceil(state.hp / injuryPerBatch));
    requested = { [selected.id]: Math.min(count, batches * yieldPerBatch) };
  } else {
    requested = Object.fromEntries(options.map(({ id, suggested }) => [id, suggested]));
  }
  const lootAvailable = { ...choice.loot };
  const stocks = choiceStocks(site, choice, index);
  const stockKeys = new Map(stocks.map(({ id, key }) => [id, key]));
  for (const { id } of stocks) delete lootAvailable[id];
  const collected = resourceEntries(requested);
  const gathered = {};
  let interrupted = false;
  let ambush = null;
  let completedBatches = 0;
  let toolMessage = '';
  const coins = choice.coins ?? 0;
  const healthBefore = state.hp;
  const fogBefore = fogTier(state.pressure);
  for (let batch = 0; batch < batches; batch += 1) {
    if (remainingGuards(state, site, choice) > 0) {
      interrupted = true;
      break;
    }
    if (collected.length && rollHarvestAmbush(state, site, choice.ambush)) {
      ambush = choice.ambush;
      advance(state, rules.harvestEncounterDays);
      break;
    }
    if (batch === 0) {
      if (choice.consume) payItems(state, choice.need);
      addCoins(state, coins);
    }
    for (const [id, amount] of collected) {
      const yieldPerBatch = choice.loot[id];
      const portion = Math.min(yieldPerBatch, amount - batch * yieldPerBatch);
      if (portion > 0) {
        spendPool(state, site, 'stocks', stockKeys.get(id), portion);
        gathered[id] = (gathered[id] ?? 0) + portion;
      }
    }
    advance(state, choice.days, rules.satietyDrainPerDay, choice.fogRest || choice.fogShelter);
    if (choice.fogRest) restOutOfFog(state, choice.days);
    if (choice.fieldTool) toolMessage += wear(state, 'offhand');
    state.hp += hpChange;
    state.qi += choice.qi ?? 0;
    normalize(state);
    completedBatches += 1;
    if (collected.length && state.hp > 0) recordPractice(state);
  }
  const amount = Math.max(0, healthBefore - state.hp);
  const injury = amount ? { cause: choice.injury ?? '你在途中受了伤。', amount } : undefined;
  const choiceKey = `${event.id}:${index}`;
  const first = completedBatches > 0 && !state.seenChoices.includes(choiceKey);
  const insight = first ? (choice.insight ?? 0) : 0;
  if (first) {
    state.seenChoices.push(choiceKey);
    state.insight = Math.max(0, state.insight + insight);
  }
  if (completedBatches && choice.perWin) {
    const claims = (state.siteClaims[site.id] ??= {});
    claims[index] = (claims[index] ?? 0) + 1;
  }
  if (completedBatches && choice.cooldown) ((state.siteCooldowns ??= {})[site.id] ??= {})[index] = state.day + choice.cooldown;
  const { accepted, spilled } = addItems(state, completedBatches ? lootAvailable : {}, true);
  const gatheredRegion = state.region;
  const gatheredGoods = goodsText(gathered);
  leaveOnGround(state, gathered);
  const hunt = completedBatches > 0 && choice.encounter;
  const enemy = ambush?.enemy ?? choice.enemy ?? (hunt ? track?.enemy ?? selectEncounter(state, site, choice) : null);
  const continuesHere = choice.stay || event.choices.some((next) => next.afterChoice === index);
  if (enemy && records.enemies[enemy]) {
    state.event = null;
    startCombat(state, enemy, site?.id, !ambush && !track && choice.openingRange === true);
    if (hunt) {
      state.combat.huntChoice = index;
      if (track) {
        const healed = Math.floor((state.day - track.day) * rules.mixedTrackHealingPerDay);
        state.combat.hp = Math.min(state.combat.hp, track.hp + healed);
        state.combat.observedHits = [...(track.observedHits ?? [])];
        state.combat.medicineLeft = track.medicineLeft;
        const maxEnemyQi = enemyOf(state).qi ?? 0;
        state.combat.enemyQi = Math.min(maxEnemyQi, (track.enemyQi ?? maxEnemyQi) + Math.floor(healed / 2));
      }
    }
  } else if (!continuesHere && !stocks.length && !Object.keys(spilled).length) {
    state.event = null;
  }
  const loot = goodsText(accepted);
  const ambushText = ambush ? ambush.outcome ?? '你正在采集，有东西忽然扑了过来。' : null;
  const outcome = ambushText ?? choice.outcome;
  const protectedFromInjury = completedBatches > 0 && padding > 0 && `${nameOf(gatherArmor.id)}卸掉了一些力道。`;
  const fogRelief = choice.fogRest && fogBefore > fogTier(state.pressure);
  const detail = [completedBatches > 0 && choice.outcome, interrupted && '看守又回来了，你收手退到外面。', gatheredGoods && `采得${gatheredGoods}，留在脚边。`,
    toolMessage, protectedFromInjury, fogRelief && '雾压缓了下来。', ambushText, loot && `获得${loot}。`,
    insight > 0 && `见识+${insight}。`].filter(Boolean).join('');
  const result = say(state, detail || choice.label);
  return {
    ...(state.hp === 0 ? fall(state, event.id) : result),
    outcome,
    injury,
    spilled,
    ...(ambush ? { ambush: ambush.enemy } : {}),
    ...(gatheredGoods ? { gathered, gatheredRegion, gatheredSite: site.id } : {}),
  };
}

function endSparring(state, enemy) {
  const combat = state.combat;
  const siteId = combat?.siteId;
  const regulated = inRegulatedBout(state);
  state.event = regulated ? null : siteId ?? null;
  state.combat = null;
  state.focus = 0;
  state.hp = regulated ? 1 : Math.max(1, Math.floor(stats(state).maxHp * 0.25));
  advance(state, 0.5);
  if (regulated) setRegulatedBoutRecovery(state);
  const tournament = tournamentResolution(state, combat, false);
  if (tournament) state.event = null;
  else if (!regulated && siteId) state.world.recovery[`${siteId}:${enemy.id}`] = state.day + 0.5;
  const result = regulated ? '你到场边坐了半日，起身时仍只剩一口气。' : '你坐到场边歇过半日，这场试招输了。';
  return say(state, `${enemy.name}在最后一式收手。${tournament || (regulated ? '裁判叫停，判你这场负。' : '')}${result}`);
}

function fall(state, place = groundPlace(state)) {
  const enemy = enemyOf(state);
  if (inProtectedBout(state)) return endSparring(state, enemy);
  const loss = enemy?.tags.includes('bandit') ? banditDefeat(state, enemy, economyKit) : null;
  if (loss?.deadly) {
    const desc = '强盗夺了行装和钱袋。你倒在原地，再也没能站起来。';
    state.banditDeath = { name: enemy.name, desc };
    state.combat = null;
    state.event = null;
    state.roadTrip = null;
    state.roadBandit = null;
    return { ...say(state, desc), banditLoss: loss, fell: true };
  }
  saveHuntTrack(state);
  const coinsLost = Math.min(rules.fallMaxCoinLoss, Math.ceil(state.coins * rules.fallCoinLossFactor));
  const lostGoods = loss ? {} : Object.fromEntries(Object.entries(state.expeditionLoot)
    .map(([id, count]) => [id, Math.min(owns(state, id), count)])
    .filter(([id, count]) => count > 0 && records.items[id]?.kind !== 'key' && !records.items[id]?.keepOnFall));
  leaveOnGround(state, lostGoods, state.durability, place);
  const dropped = goodsText(lostGoods);
  const placeName = state.roadTrip ? '刚才交手的路边' : records.sites[place]?.name ?? regionOf(state).name;
  for (const [id, count] of Object.entries(lostGoods)) removeItem(state, id, count);
  state.expeditionLoot = {};
  state.coins -= coinsLost;
  state.region = rescueSettlement(state, economyKit);
  state.event = null;
  state.gathering = null;
  state.combat = null;
  state.roadTrip = null;
  state.roadBandit = null;
  state.pressure = 0;
  state.fogExposure = 0;
  state.focus = 0;
  state.toxin = 0;
  state.wounds = Math.min(rules.maxWounds, state.wounds + rules.fallWounds);
  advance(state, rules.fallDays);
  state.hp = Math.ceil(stats(state).maxHp * rules.fallHpFactor);
  state.qi = Math.min(rules.fallQi, stats(state).maxQi);
  if (loss) return { ...say(state, `强盗夺了行装和钱袋，留下你一条命。过路人扶你回到${regionOf(state).name}。`),
    banditLoss: loss, fell: true };
  return say(state, `路人把你送回${regionOf(state).name}。${coinsLost ? `药费${coinsLost}枚灵钱。` : ''}${dropped ? `${dropped}落在${placeName}，还能回去找。` : ''}可在此歇息。`);
}

function mechanismFailure(state, { damage = 0, fatal = false }, cause) {
  const amount = fatal ? state.hp : Math.min(damage, state.hp);
  if (!amount) return say(state, cause);
  state.hp -= amount;
  const fell = state.hp === 0;
  return { ...(fell ? fall(state) : say(state, cause)), injury: { cause, amount }, fell };
}

function finishCombat(state, enemy) {
  const combat = state.combat;
  if (combat.roadBandit) {
    state.combat = null;
    state.focus = 0;
    recordPractice(state);
    return winRoadBandit(state, enemy, economyKit);
  }
  const site = records.sites[combat.siteId];
  const protectedBout = inProtectedBout(state);
  if (inRegulatedBout(state)) setRegulatedBoutRecovery(state);
  if (site?.creatures?.[enemy.id]) {
    spendPool(state, site, 'creatures', enemy.id, 1);
    const wins = (state.siteVictories[site.id] ??= {});
    wins[enemy.id] = (wins[enemy.id] ?? 0) + 1;
    const tracks = state.huntTracks?.[site.id];
    for (const [index, track] of Object.entries(tracks ?? {})) {
      if (track.enemy === enemy.id) delete tracks[index];
    }
  }
  const tournament = tournamentResolution(state, combat, true);
  state.combat = null;
  state.event = tournament ? null : site?.id ?? null;
  const first = !state.defeated.includes(enemy.id);
  if (first) state.defeated.push(enemy.id);
  const insight = first ? (enemy.insight ?? 0) : 0;
  state.insight += insight;
  recordPractice(state);
  const worthy = first && !protectedBout && enemy.tier >= state.realm;
  if (worthy) state.practice[state.realm] = (state.practice[state.realm] ?? 0) + rules.worthyFightPractice;
  const gathered = protectedBout ? {} : { ...enemy.loot };
  if (!protectedBout) {
    for (const [id, { count, chance }] of Object.entries(enemy.chanceLoot ?? {})) {
      if (worldRoll(state) < chance) gathered[id] = (gathered[id] ?? 0) + count;
    }
  }
  leaveOnGround(state, gathered);
  const loot = goodsText(gathered);
  const hazard = hazardVictory(state, enemy.id, site?.id);
  const isDenBattle = Boolean(data.roadBandits.dens[site?.id]);
  const chiefFell = data.roadBandits.dens[site?.id]?.boss === enemy.id;
  const rescuedGear = isDenBattle ? recoverBanditSpoils(state, site.id, economyKit, chiefFell) : '';
  const roadNews = chiefFell
    ? '把守几条路的人撤走了，往后这一伙人不再出来拦路。' : '';
  const winText = protectedBout ? '试招中胜过' : isDenBattle || enemy.tags.includes('beast') ? '击杀了' : '击败了';
  return {
    message: `${winText}${enemy.name}。${loot ? `脚边留下${loot}。` : ''}${insight ? `见识+${insight}。` : ''}${worthy ? '经过这一战，运气又熟了一分。' : ''}${tournament}${hazard}${roadNews}${rescuedGear}`,
    ...(loot ? { gathered, gatheredRegion: state.region, gatheredSite: site?.id } : {}),
  };
}

function attackingIntent(intent) {
  return ['attack', 'heavy', 'drain'].includes(intent.kind);
}

function estimatedHit(state, enemy, intent) {
  if (!attackingIntent(intent)) return 0;
  const extra = state.combat.enemyCharged ? Math.ceil(enemy.atk * rules.enemyChargeFactor) : 0;
  return Math.ceil((Math.ceil(enemy.atk * (intent.mult ?? 1)) + extra) * realmPressure(state, enemy));
}

function excessRealmGap(state, enemy) {
  return Math.max(0, enemy.tier - state.realm - rules.largeRealmGap + 1);
}

function realmPressure(state, enemy) {
  return 1 + excessRealmGap(state, enemy) * rules.largeRealmPressure;
}

function breathingQi(state) {
  const recovery = rules.guardQiRecovery + (activeManualRank(state)?.base.breathingQi ?? 0);
  return Math.min(recovery, Math.max(0, stats(state).maxQi - state.qi));
}

export function baseEscapeChance(enemy) {
  if (enemy.escapeChance !== undefined) return enemy.escapeChance;
  const tags = enemy.tags ?? [];
  const base = tags.includes('human') ? 0.32
    : tags.includes('stoneborn') ? 0.62
    : tags.includes('furred') ? 0.42
    : tags.includes('spirit') ? 0.44 : 0.58;
  return Math.max(0.18, base - (enemy.tier ?? 0) * 0.018 - (enemy.hp >= 90 ? 0.06 : 0));
}

function escapeChance(state, enemy, intent, bonus) {
  const evasion = combatTraits(activeGear(state).flatMap(({ trait, traits = [] }) => [trait, ...traits]), enemy, intent).dodge
    + (activeManualRank(state)?.base.dodge ?? 0);
  const cap = enemy.tags?.includes('bandit') ? rules.banditEscapeChanceCap : rules.escapeChanceCap;
  return clamp(baseEscapeChance(enemy) + stats(state).retreat + evasion * rules.escapeDodgeFactor + (state.combat.escapeBonus ?? 0) + bonus, 0, cap);
}

function crossRealmFactor(state, enemy) {
  return data.realms
    .filter(({ id }) => id > state.realm && id <= enemy.tier)
    .reduce((factor, realm) => factor * (realm.pressure ?? 1), 1) / realmPressure(state, enemy);
}

function weaponLoadout(state) {
  const id = state.equipment.weapon;
  const weapon = state.durability[id] > 0 ? records.gear[id] : null;
  const compatible = weapon?.ammo ?? [];
  const stocked = (ammoId) => records.ammunition[ammoId] && owns(state, ammoId);
  const selected = compatible.includes(state.selectedAmmo) && stocked(state.selectedAmmo)
    ? state.selectedAmmo : compatible.find(stocked);
  return { weapon, compatible, ammo: records.ammunition[selected] ?? null };
}

function fistWeapon(state) {
  const { weapon } = weaponLoadout(state);
  return weapon?.weaponClass === 'fist' ? weapon : null;
}

function weaponView(state) {
  const { weapon, compatible, ammo } = weaponLoadout(state);
  return {
    id: weapon?.id ?? null,
    name: weapon ? nameOf(weapon.id) : '徒手',
    weaponClass: weapon?.weaponClass ?? (weapon ? 'melee' : 'unarmed'),
    chargeRequired: Boolean(weapon?.chargeRequired),
    spellQi: weapon?.spellQi ?? 0,
    needsAmmo: compatible.length > 0,
    isLoaded: !compatible.length || Boolean(ammo),
    selectedAmmo: ammo?.id ?? null,
    ammo: compatible.map((id) => ({ id, name: nameOf(id), count: owns(state, id), selected: id === ammo?.id })),
  };
}

function selectAmmo(state, id) {
  const { compatible } = weaponLoadout(state);
  if (!compatible.includes(id) || !records.ammunition[id] || !owns(state, id)) return refuse('手边没有合用的弹药。');
  state.selectedAmmo = id;
  return say(state, `取用${nameOf(id)}。`);
}

function sideWeapon(state) {
  const gear = records.gear[state.equipment.offhand];
  return gear?.sideAtk && state.durability[gear.id] > 0 ? gear : null;
}

function combatTraits(traits, enemy, intent) {
  const effects = { damage: 0, pierce: 0, guard: 0, reflect: 0, dodge: 0, accuracy: 0 };
  for (const trait of traits) {
    if (!trait || (trait.enemyTag && !enemy.tags?.includes(trait.enemyTag)) ||
        (trait.intent && trait.intent !== intent.kind) || !Object.hasOwn(effects, trait.kind)) continue;
    effects[trait.kind] += trait.bonus;
  }
  return effects;
}

function damageAfterResistance(raw, resistance) {
  return raw > 0 ? Math.max(1, Math.floor(raw * (1 - clamp(resistance ?? 0, 0, rules.resistanceCap)))) : 0;
}

function combatEffects(state, enemy, intent, move) {
  const { damage = 0, pierce = 0, brace = false, wearWeapon = false, hungerAffected = wearWeapon, ammo } = move;
  const { defense, attack: force, physicalResist, magicResist, maxQi } = stats(state);
  const playerSpirit = spiritFrame(state.combat);
  const enemySpirit = spiritFrame(state.combat, true);
  const breaksEnemyGuard = playerSpirit?.id === 'fold_armor';
  const breaksPlayerGuard = enemySpirit?.id === 'fold_armor';
  const spell = move.damageType === 'magic';
  const enemySpell = intent.damageType === 'magic';
  const enemyPhysical = enemy.tier >= rules.resistanceTier ? (enemy.physicalResist ?? 0) * (breaksEnemyGuard ? playerSpirit.strength : 1) : 0;
  const enemyMagic = enemy.tier >= rules.resistanceTier ? enemy.magicResist : 0;
  const enemyResist = spell ? enemyMagic : enemyPhysical;
  const focus = manualFocus(state, move.weaponClass);
  const manual = activeManualRank(state)?.base ?? {};
  const heavyBrace = brace && intent.kind === 'heavy';
  const counter = heavyBrace && !enemySpell && !breaksPlayerGuard && !spiritBlocksStrike(state.combat) && playerSpirit?.id !== 'turn_edge'
    ? damageAfterResistance(Math.max(1, Math.floor((rules.guardCounter + (manual.counter ?? 0)) / realmPressure(state, enemy))), enemyPhysical) : 0;
  const stanceGuard = brace && !breaksPlayerGuard ? rules.guardBonus + (heavyBrace ? rules.heavyGuardBonus + (manual.heavyGuard ?? 0) : 0) : 0;
  const stanceQi = heavyBrace && !breaksPlayerGuard && playerSpirit?.id !== 'turn_edge'
    ? Math.min(manual.heavyGuardQi ?? 0, Math.max(0, maxQi - state.qi)) : 0;
  const guard = (move.guard ?? 0) + (focus?.guard ?? 0) + stanceGuard;
  const proposedInterrupt = ['heavy', 'heal', 'focus'].includes(intent.kind) ? move.interrupt ?? 0 : 0;
  const charge = move.releaseCharge && damage > 0
    ? Math.max(rules.combatChargeFloor, Math.ceil(((move.chargeBase ?? force) + (focus?.atk ?? 0)) * rules.combatChargeFactor)) : 0;
  const training = trainingPerks(state, enemy, intent);
  const gearTraits = ({ trait, traits = [] }) => [trait, ...traits];
  const worn = activeGear(state);
  const traits = combatTraits(worn.flatMap(gearTraits), enemy, intent);
  const strikingSlot = wearWeapon ? 'weapon' : move.wearSlot;
  const strikingTraits = strikingSlot ? combatTraits([
    ...worn.filter(({ slot, sideAtk }) => slot === strikingSlot || (slot !== 'weapon' && !sideAtk)).flatMap(gearTraits),
    ammo?.trait, ...(ammo?.traits ?? []),
  ], enemy, intent) : null;
  const armor = intent.kind === 'guard' && !breaksEnemyGuard
    ? Math.max(enemy.def + rules.enemyGuardBonus, Math.ceil(enemy.def * (intent.mult ?? 1)))
    : enemy.def + (attackingIntent(intent) ? enemy.manualGuard ?? 0 : 0);
  const hunger = hungerAffected && state.satiety === 0 ? rules.emptyAttackMultiplier : 1;
  const effectiveDamage = Math.floor((damage + charge + (focus?.atk ?? 0) + (strikingTraits?.damage ?? 0)
    + training.damage + (ammo?.atk ?? 0)) * hunger * crossRealmFactor(state, enemy));
  const rawDamage = damage > 0
    ? Math.max(rules.minAttackDamage, effectiveDamage - Math.max(0, armor - pierce - (focus?.pierce ?? 0)
      - (strikingTraits?.pierce ?? 0) - training.pierce - (ammo?.pierce ?? 0))) : 0;
  const playerBurst = playerSpirit?.id === 'split_stream' && state.combat.round === playerSpirit.start + 1 ? playerSpirit.strength : 1;
  const proposedDamage = move.fixedDamage ?? damageAfterResistance(rawDamage, enemyResist) * playerBurst;
  const enemyActiveDodge = intent.kind === 'dodge';
  const missChance = dodgeChance((enemy.dodge ?? 0) + (enemyActiveDodge ? rules.combatActiveDodge : 0), strikingTraits?.accuracy ?? 0,
    enemyActiveDodge ? rules.combatActiveDodgeCap : rules.combatDodgeCap);
  const selfStrike = enemySpirit?.id === 'turn_edge' && damage > 0;
  const missed = !selfStrike && proposedDamage > 0 && Boolean(move.weaponClass) && combatEvaded(state, 'enemy', missChance);
  const dealt = missed || selfStrike ? 0 : proposedDamage;
  const interrupt = missed || selfStrike ? 0 : proposedInterrupt;
  const hit = Boolean(ammo && dealt > 0 && canInterceptOpening(state, intent));
  const enemyPierce = enemySpell ? intent.pierce ?? 0 : (enemy.manualPierce ?? 0) + (intent.pierce ?? 0);
  const enemyBurst = enemySpirit?.id === 'split_stream' && state.combat.round === enemySpirit.start + 1 ? enemySpirit.strength : 1;
  const incomingPower = Math.ceil(estimatedHit(state, enemy, intent) * (playerSpirit?.id === 'press_edge' ? playerSpirit.strength : 1));
  const returnsIncoming = playerSpirit?.id === 'turn_edge' && attackingIntent(intent) && !hit;
  const returned = returnsIncoming
    ? damageAfterResistance(Math.max(1, incomingPower - Math.max(0, enemy.def - enemyPierce)), enemySpell ? enemyMagic : enemyPhysical) * enemyBurst : 0;
  const backfire = selfStrike ? (move.fixedDamage ?? damageAfterResistance(
    Math.max(1, effectiveDamage - Math.max(0, defense - pierce - (focus?.pierce ?? 0))), spell ? magicResist : physicalResist) * playerBurst) : 0;
  const incoming = hit || !attackingIntent(intent) || returnsIncoming ? 0
    : Math.max(0, incomingPower - Math.max(0, defense - enemyPierce)
      - guard - traits.guard - training.guard - interrupt);
  const shield = heavyBrace && !enemySpell && incoming > 0 && !breaksPlayerGuard
    ? activeGear(state).find(({ slot, brace }) => slot === 'offhand' && brace) : null;
  const received = damageAfterResistance(Math.max(0, incoming - (shield?.brace ?? 0)),
    enemySpell ? magicResist : physicalResist * (breaksPlayerGuard ? enemySpirit.strength : 1)) * enemyBurst;
  const healing = intent.kind === 'heal' ? Math.max(0, Math.ceil(enemy.atk * (intent.mult ?? 1)) - interrupt) : 0;
  const reflect = !enemySpell && !intent.ranged && (intent.kind === 'attack' || intent.kind === 'heavy')
    ? damageAfterResistance(traits.reflect, enemy.physicalResist) : 0;
  const quick = enemySpell || intent.ranged || intent.kind === 'drain';
  const hardToEvade = quick || intent.kind === 'heavy';
  const passive = (traits.dodge + (activeManualRank(state)?.base.dodge ?? 0)) * (hardToEvade ? rules.combatQuickDodgeFactor : 1);
  const active = move.evade ? rules.combatActiveDodge * (quick ? rules.combatActiveQuickDodgeFactor : 1) : 0;
  const accuracy = (enemy.accuracy ?? 0) + (intent.accuracy ?? 0) + excessRealmGap(state, enemy) * rules.largeRealmAccuracy;
  const dodge = received > 0
    ? dodgeChance(passive + active, accuracy, move.evade ? rules.combatActiveDodgeCap : rules.combatDodgeCap) : 0;
  return { dealt, counter, missed, hit, charge, interrupt, shield, reflect, dodge, healing, received, returned, backfire, stanceQi };
}

function dodgeChance(evasion, accuracy, cap) {
  return Math.min(cap, evasion / (1 + evasion) / (1 + accuracy / rules.combatDodgeAccuracyScale));
}

function combatEvaded(state, defender, chance) {
  const combat = state.combat;
  const streaks = (combat.dodgeStreaks ??= {});
  const seedKey = defender === 'enemy' ? 'enemyEvadeSeed' : 'evadeSeed';
  const seed = state[seedKey] ?? ((state.evadeSeed ^ 0x27d4eb2f) >>> 0);
  const eligible = chance > 0 && (streaks[defender] ?? 0) < rules.combatConsecutiveDodges;
  if (eligible) state[seedKey] = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  const success = eligible && state[seedKey] / 0x100000000 < chance;
  streaks[defender] = success ? (streaks[defender] ?? 0) + 1 : 0;
  return success;
}

function respondToMove(state, enemy, kind) {
  const intent = currentIntent(state);
  return state.combat.plan.reader === 'enemy'
    ? chooseEnemyIntent(enemy, { ...enemyContext(state), read: { kind } }) : intent;
}

function combatVictory(state, enemy, summary, results) {
  const { message, ...outcome } = finishCombat(state, enemy);
  normalize(state);
  return { ...say(state, summary + message), ...outcome, ...results };
}

function combatTurn(state, move) {
  const enemy = enemyOf(state);
  const { kind = 'recover', brace, wearWeapon, ammo, medicine, message } = move;
  const intent = respondToMove(state, enemy, kind);
  considerEnemySpirit(state.combat, enemy, intent);
  const result = combatEffects(state, enemy, intent, move);
  const { dealt, counter, missed, hit, charge, interrupt, shield, reflect, dodge, healing, received, returned, backfire, stanceQi } = result;
  const incoming = state.combat.hp > dealt + counter + returned && !hit && received > 0;
  const dodged = incoming && combatEvaded(state, 'player', dodge);
  const interruptedMedicine = medicine && state.combat.enemyCharged && incoming && !dodged;
  const doseTaken = medicine && !interruptedMedicine ? applyMedicine(state, medicine) : null;
  const { message: doseMessage, ...medicineResult } = doseTaken ?? {};
  const qiToPlayer = intent.kind === 'drain' ? Math.min(state.qi, received) : 0;
  const damageToPlayer = received - qiToPlayer;
  const healthBefore = state.hp;
  const enemyMove = visibleAttack(intent);
  const read = state.combat.plan.reader === 'enemy' ? `${enemy.name}看破了你的起手。` : '';
  let damageDealt = move.fixedDamage && dealt ? dealt : Math.min(state.combat.hp, dealt + counter);
  let reflectedDamage = Math.min(Math.max(0, state.combat.hp - dealt - counter), returned);
  if (dealt > 0) {
    const landed = { damage: Math.min(state.combat.hp, dealt), guarded: intent.kind === 'guard' };
    const observed = (state.combat.observedHits ??= []);
    observed.push(landed);
    if (observed.length > rules.observedHitLimit) observed.shift();
  }
  state.combat.hp = Math.max(0, state.combat.hp - dealt - counter - reflectedDamage);
  if (counter > 0) (state.combat.dodgeStreaks ??= {}).enemy = 0;
  const abandoned = state.combat.playerCharge && !move.releaseCharge;
  state.combat.playerCharge = move.prepareWeapon ?? null;
  const recovered = brace && intent.kind === 'guard' ? breathingQi(state) : 0;
  state.qi += recovered + stanceQi;
  const weaponDamage = wearWeapon ? wear(state, 'weapon') : move.wearSlot ? wear(state, move.wearSlot) : '';
  if (ammo) removeItem(state, ammo.id, 1);
  const playerMove = brace ? counter ? '你挡住重招，趁对手还没收招打了回去。'
    : recovered ? `你趁对手守势回了${recovered}点真气。` : '你收回手，挡在身前。' : message;
  const medicineMove = interruptedMedicine ? `你刚取出${nameOf(medicine)}，便被对手蓄好的招打断。药还在手里。` : doseMessage;
  let summary = `${read}${abandoned ? '你收住了方才蓄着的劲。' : ''}${medicineMove ?? playerMove}${stanceQi ? `卸开这一招，真气回了${stanceQi}点。` : ''}${charge ? '你将蓄好的劲送了出去。' : ''}${ammo ? `用掉一枚${nameOf(ammo.id)}。` : ''}${missed ? `${enemy.name}侧身闪过了这一击。` : ''}${damageDealt ? `造成${damageDealt}点伤害。` : ''}${weaponDamage}`;
  if (backfire) {
    state.hp = Math.max(0, state.hp - backfire);
    summary += `你打出的劲折了回来，自己受了${backfire}点伤。`;
  }
  if (reflectedDamage) {
    damageDealt += reflectedDamage;
    summary += `「${intent.name}」折了回去，${enemy.name}受了${reflectedDamage}点反伤。`;
  }
  if (state.combat.hp <= 0) {
    advance(state, rules.battleDays);
    if (counter) summary += `「${intent.name}」被你截住了。`;
    return combatVictory(state, enemy, summary, { damageDealt, damageTaken: 0, reflectedDamage, ...((counter || returned) ? { enemyMove } : {}) });
  }
  if (intent.kind !== 'remedy') summary += `${enemy.name}使出「${intent.name}」。`;
  if (intent.qiCost > 0) state.combat.enemyQi = Math.max(0, (state.combat.enemyQi ?? enemy.qi ?? 0) - intent.qiCost);
  if (attackingIntent(intent)) state.combat.enemyCharged = false;
  if (returned) {
    // The attacker already took the reflected blow.
  } else if (hit) {
    summary += `这一箭拦住了${enemy.name}的冲势。`;
  } else if (dodged) {
    summary += '你错开半步，这一招落了空。' + wear(state, 'boots');
    const restored = Math.min((activeManualRank(state)?.base.evadeQi ?? 0), Math.max(0, stats(state).maxQi - state.qi));
    if (restored) {
      state.qi += restored;
      summary += `脚下站稳，一口气转回来，真气恢复${restored}点。`;
    }
  } else if (intent.kind === 'heal') {
    const before = state.combat.hp;
    state.combat.hp = Math.min(enemy.hp, before + healing);
    const restored = state.combat.hp - before;
    summary += interrupt && !restored ? `${enemy.name}调息被打断。`
      : `${enemy.name}${interrupt ? '调息受阻，只' : ''}恢复了${restored}点生命。`;
  } else if (intent.kind === 'remedy') {
    const dose = enemyMedicine(state);
    if (dose) rememberSeenItems(state, [dose.id]);
    if (!dose) {
      enemyMove.name = '摸了摸空药袋';
      summary += `${enemy.name}摸了摸药袋，已经空了。`;
    } else if (charge && dealt > 0) {
      enemyMove.name = '取药时被打断';
      summary += `${enemy.name}刚取出${dose.name}，便被你这一击打断，药仍攥在手里。`;
    } else {
      state.combat.medicineLeft = dose.left - 1;
      const restored = Math.min(enemy.hp - state.combat.hp, dose.hp);
      state.combat.hp += restored;
      state.combat.enemyQi = Math.min(enemy.qi ?? 0, (state.combat.enemyQi ?? enemy.qi ?? 0) + dose.qi);
      summary += `${enemy.name}${intent.name}。`;
      if (restored > 0) {
        summary += `气血回了${restored}点。`;
        medicineResult.enemyMedicineRecovery = restored;
      }
    }
  } else if (intent.kind === 'guard') {
    summary += `${enemy.name}稳住了架势。`;
  } else if (intent.kind === 'dodge') {
    summary += missed ? '他贴着路沿站稳。' : '他错开一步，绕到了旁边。';
  } else if (intent.kind === 'recoverQi') {
    const before = state.combat.enemyQi ?? enemy.qi ?? 0;
    state.combat.enemyQi = Math.min(enemy.qi ?? 0, before + (intent.recover ?? 0));
    summary += '对手收敛气息，慢慢回了些劲。';
  } else if (intent.kind === 'focus') {
    state.combat.enemyCharged = dealt < rules.chargeBreakDamage && !interrupt;
    summary += state.combat.enemyCharged ? '它的下一记出招会更重。' : '蓄势被你打断了。';
  } else {
    if (move.evade && (qiToPlayer || damageToPlayer)) summary += '脚下没能让开。';
    if (shield) summary += nameOf(shield.id) + '卸掉了一股冲力。' + wear(state, 'offhand');
    state.qi -= qiToPlayer;
    state.hp -= damageToPlayer;
    const armorDamage = damageToPlayer ? wear(state, 'armor') : '';
    if (intent.kind === 'drain') {
      summary += `${enemy.name}抽走你${qiToPlayer}点真气${damageToPlayer ? `，另造成${damageToPlayer}点伤害` : ''}。${armorDamage}`;
    } else {
      summary += damageToPlayer ? `你受了${damageToPlayer}点伤。${armorDamage}` : '你挡下了这一招。';
    }
    if (state.combat.playerCharge && damageToPlayer >= rules.chargeBreakDamage) {
      state.combat.playerCharge = null;
      summary += '你蓄着的劲被打散了。';
    }
    if (reflect > 0 && damageToPlayer > 0 && state.hp > 0) {
      reflectedDamage = Math.min(state.combat.hp, reflect);
      state.combat.hp -= reflectedDamage;
      damageDealt += reflectedDamage;
      summary += `护具把来劲弹了回去，造成${reflectedDamage}点反伤。`;
    }
  }
  advance(state, rules.battleDays);
  if (state.combat.hp <= 0) {
    return combatVictory(state, enemy, summary, { ...medicineResult, damageDealt, damageTaken: healthBefore - state.hp, enemyMove, reflectedDamage, dodged, missed });
  }
  state.combat.lastEnemyIntent = enemyMove;
  state.combat.round += 1;
  normalize(state);
  const damageTaken = Math.max(0, healthBefore - state.hp);
  say(state, summary);
  const fell = state.hp === 0 ? fall(state) : null;
  return { ...fell, ...medicineResult, ok: true, message: summary + (fell?.message ?? ''), damageDealt, damageTaken, enemyMove, reflectedDamage, dodged, missed };
}

function retreat(state, bonus = 0, lead = '', guard = 0) {
  if (state.combat?.tournament === tournamentData.id) return tournamentAction(state, 'tournamentWithdraw', economyKit);
  const enemy = enemyOf(state);
  if (inProtectedBout(state)) {
    advance(state, rules.retreatDays);
    if (inRegulatedBout(state)) {
      setRegulatedBoutRecovery(state);
      state.event = null;
    }
    state.combat = null;
    state.focus = 0;
    return { ...say(state, `${lead}你退后一步，${enemy.name}也收了招。这场切磋到此为止。`), damageDealt: 0, damageTaken: 0 };
  }
  const intent = respondToMove(state, enemy, 'retreat');
  const blocked = attackingIntent(intent);
  const chance = blocked ? 0 : escapeChance(state, enemy, intent, bonus);
  if (!blocked) state.escapeSeed = (Math.imul(state.escapeSeed ?? 1, 1664525) + 1013904223) >>> 0;
  if (blocked || state.escapeSeed / 0x100000000 >= chance) {
    const failure = combatTurn(state, { kind: 'retreat', guard,
      message: `${lead}你转身要走，${enemy.name}紧跟上来，没能脱身。` });
    return { ...failure, retreated: false };
  }
  advance(state, rules.retreatDays);
  const charmDamage = activeGear(state).some(({ slot, retreat }) => slot === 'charm' && retreat > 0) ? wear(state, 'charm') : '';
  const outerEdge = state.combat.huntChoice !== undefined ? state.combat.siteId : null;
  const road = state.combat.roadBandit;
  const escaped = `${lead}趁${enemy.name}使出「${intent.name}」，你脱开身`;
  if (outerEdge) {
    saveHuntTrack(state);
    state.event = outerEdge;
  }
  state.combat = null;
  state.focus = 0;
  if (road) {
    state.roadBandit = null;
    const returning = backFromRoad(state, economyKit);
    return { ...returning, ...say(state, `${escaped}。${charmDamage}${returning.message}`), damageDealt: 0, damageTaken: 0, retreated: true };
  }
  const position = outerEdge ? '退回了这处猎场的外沿' : `仍在${regionOf(state).name}`;
  const summary = `${escaped}，${position}。${charmDamage}`;
  return { ...say(state, summary), damageDealt: 0, damageTaken: 0, retreated: true };
}

const spiritStrikeRestriction = '这回合已经用了神识，可以防御、闪避或蓄势。';

function weaponSpell(state) {
  const { weapon } = weaponLoadout(state);
  if (!weapon?.spellQi) return refuse('这件兵器无法引气伤敌。');
  if (spiritBlocksStrike(state.combat)) return refuse(spiritStrikeRestriction);
  if (state.combat.playerCharge) return refuse('先收住正在蓄着的劲。');
  if (state.qi < weapon.spellQi) return refuse('真气不足。');
  state.qi -= weapon.spellQi;
  const focus = state.focus >= 1 ? 1 : 0;
  state.focus -= focus;
  return combatTurn(state, {
    kind: 'strike', damageType: 'magic', weaponClass: weapon.weaponClass,
    damage: stats(state).magicAttack + (weapon.spellPower ?? 0) + focus * rules.focusDamage,
    pierce: weapon.spellPierce, guard: weapon.spellGuard, interrupt: weapon.spellInterrupt,
    wearWeapon: true, hungerAffected: false,
    message: `你将真气送入${nameOf(weapon.id)}。用去${weapon.spellQi}点真气。`,
  });
}

function prepareWeaponAttack(state, weapon) {
  const pending = state.combat.playerCharge;
  if (pending) return pending.slot === weapon?.slot && pending.id === weapon?.id ? null : refuse('先收住正在蓄着的劲。');
  if (!weapon?.chargeRequired) return null;
  return combatTurn(state, {
    kind: 'focus', prepareWeapon: { slot: weapon.slot, id: weapon.id },
    message: `你握住${nameOf(weapon.id)}，沉肩蓄力。`,
  });
}

function attack(state) {
  const { weapon, compatible, ammo } = weaponLoadout(state);
  if (!weapon || (compatible.length && !ammo)) return fistAttack(state);
  const preparation = prepareWeaponAttack(state, weapon);
  if (preparation) return preparation;
  if (spiritBlocksStrike(state.combat)) return refuse(spiritStrikeRestriction);
  const releaseCharge = Boolean(weapon.chargeRequired);
  return combatTurn(state, {
    kind: 'strike', releaseCharge,
    weaponClass: weapon.weaponClass,
    damage: stats(state).attack,
    fixedDamage: weapon.fixedDamage && state.creatorMode ? state.creatorSwordDamage : undefined,
    pierce: releaseCharge ? weapon.chargePierce : 0,
    wearWeapon: true,
    hungerAffected: true,
    ammo,
    message: weapon.weaponClass === 'fist' ? `你用${nameOf(weapon.id)}出拳。`
      : releaseCharge ? `你挥动${nameOf(weapon.id)}出手。` : '你抢先出手。',
  });
}

function fistMove(state, technique) {
  const { weapon } = weaponLoadout(state);
  const fist = weapon?.weaponClass === 'fist' ? weapon : null;
  const force = stats(state).attack - (fist ? 0 : weapon?.atk ?? 0);
  return combatTurn(state, {
    kind: 'strike', weaponClass: 'fist', wearWeapon: Boolean(fist), hungerAffected: true,
    damage: force + (technique?.power ?? 0), pierce: technique?.pierce ?? 0,
    releaseCharge: Boolean(technique), chargeBase: force,
    message: technique ? `你使出${technique.name ?? '蓄势拳'}，${fist ? '指虎' : '拳锋'}贴着对手的中门送出。`
      : fist ? `你用${nameOf(fist.id)}出拳。` : '你空手出拳。',
  });
}

function fistAttack(state) {
  if (spiritBlocksStrike(state.combat)) return refuse(spiritStrikeRestriction);
  if (state.combat.playerCharge) return refuse('先收住正在蓄着的劲。');
  return fistMove(state);
}

function fistChargeBlocker(state) {
  const pending = state.combat.playerCharge;
  if (pending && (pending.slot !== 'fist' || pending.id !== (fistWeapon(state)?.id ?? 'bare_fist'))) return '先收住正在蓄着的劲。';
  if (pending && spiritBlocksStrike(state.combat)) return spiritStrikeRestriction;
  return '';
}

function combatFistReason(state, technique) {
  return state.combat && technique ? fistChargeBlocker(state) : '';
}

function fistCharge(state) {
  const technique = activeManualRank(state)?.fistCharge;
  if (!technique) return refuse('你还没练会这门蓄势拳。');
  const reason = fistChargeBlocker(state);
  if (reason) return refuse(reason);
  if (!state.combat.playerCharge) return combatTurn(state, {
    kind: 'focus', prepareWeapon: { slot: 'fist', id: fistWeapon(state)?.id ?? 'bare_fist' },
    message: '你收拳沉肩，将腰腹的力慢慢聚到拳上。',
  });
  return fistMove(state, technique);
}

function offhandAttack(state) {
  const side = sideWeapon(state);
  if (!side) return refuse('手边没有可出招的副兵器。');
  const preparation = prepareWeaponAttack(state, side);
  if (preparation) return preparation;
  if (spiritBlocksStrike(state.combat)) return refuse(spiritStrikeRestriction);
  const { weapon } = weaponLoadout(state);
  const damage = stats(state).attack - (weapon?.atk ?? 0) + side.sideAtk;
  return combatTurn(state, {
    kind: 'strike', releaseCharge: Boolean(side.chargeRequired), hungerAffected: true, wearSlot: 'offhand',
    weaponClass: side.weaponClass,
    damage, chargeBase: damage, pierce: side.sidePierce, guard: side.sideGuard,
    message: `你用${nameOf(side.id)}出手。`,
  });
}

function batchMealCount(state, id) {
  const food = records.foods[id];
  if (!food?.satiety || state.satiety >= rules.batchMealTarget) return 0;
  return Math.min(owns(state, id), Math.ceil((rules.batchMealTarget - state.satiety) / food.satiety),
    Math.floor((rules.maxSatiety - state.satiety) / food.satiety));
}

function mealBlocker(state, id) {
  if (state.combat) return '交手中只能用药。';
  if (id === 'beast_meat' && owns(state, id)) return '肉还生着。带到灶边煮熟才能吃。';
  const food = records.foods[id];
  if (!food || !owns(state, id)) return '没有这份可吃的口粮。';
  const { maxHp, maxQi } = stats(state);
  if (state.satiety < rules.maxSatiety || (food.hp > 0 && state.hp < maxHp) ||
      (food.qi > 0 && state.qi < maxQi) || (food.sense > 0 && needsSenseRest(state))) return '';
  return '眼下用不着吃这份口粮。';
}

function setMealPouch(state, id) {
  const next = id === 'none' ? null : id;
  if (next && (!records.foods[next] || !owns(state, next))) return refuse('行囊里没有这份口粮。');
  if (state.mealPouch === next) return refuse('便当栏已经这样放了。');
  if (backpackSlots({ ...state, mealPouch: next }) > backpackCapacity(state, rules.backpackCapacity)) {
    return refuse('行囊已满，收不下腾出的口粮。');
  }
  state.mealPouch = next;
  return say(state, next ? `把${nameOf(next)}放进便当栏。` : '把便当收进行囊。');
}

function eat(state, inCombat, id = state.mealPouch, batch = false) {
  const reason = inCombat ? '交手中只能用药。' : mealBlocker(state, id);
  if (reason) return refuse(reason);
  const food = records.foods[id];
  const count = batch ? batchMealCount(state, id) : 1;
  if (batch && count < 2) return refuse('眼下不必连吃。');
  removeItem(state, id, count);
  state.didEat = true;
  const before = state.hp;
  const qiBefore = state.qi;
  const initialSatiety = state.satiety;
  state.satiety = Math.min(rules.maxSatiety, state.satiety + food.satiety * count);
  state.hp += food.hp * count;
  state.qi += (food.qi ?? 0) * count;
  const sense = food.sense ? restoreTrainingSense(state, food.sense * count) : 0;
  normalize(state);
  const satietyRestored = state.satiety - initialSatiety;
  const recovered = [satietyRestored && `饱腹+${satietyRestored}`, state.hp > before && `气血+${state.hp - before}`,
    state.qi > qiBefore && `真气+${state.qi - qiBefore}`, sense > 0 && `神识+${sense}`].filter(Boolean);
  const message = `你吃下${count > 1 ? `${count}份` : ''}${nameOf(id)}。${recovered.length ? `${recovered.join('，')}。` : ''}`;
  return say(state, message);
}

function inspectBasket(state) {
  const basket = data.basket;
  if (!basket || !owns(state, basket.item)) return refuse('手边没有药篓。');
  state.basketInspected = true;
  return { ...say(state, basket.inspect), outcome: basket.inspect };
}

function unpackBasket(state) {
  const basket = data.basket;
  if (!basket || !owns(state, basket.item)) return refuse('手边没有药篓。');
  if (!isSettlement(state) && state.satiety === 0) return refuse('腹中空空，先吃些东西。');
  removeItem(state, basket.item, 1);
  state.basketDisposition = 'unpacked';
  advance(state, rules.unpackBasketDays);
  const { spilled } = addItems(state, basket.unpack.loot, true);
  return { ...say(state, basket.unpack.outcome), outcome: basket.unpack.outcome, spilled };
}

function senseMedicineBlocker(state, pill) {
  if (!pill?.sense || needsSenseRest(state) || (pill.hp > 0 && state.hp < stats(state).maxHp)) return '';
  if (!spiritCapacity(state)) return '金丹结成后才能积蓄神识。';
  return pill.hp > 0 ? '气血和神识都养足了。' : '神识已经养足。';
}

function applyMedicine(state, id) {
  const pill = records.pills[id];
  removeItem(state, id, 1);
  const hp = state.hp;
  const qi = state.qi;
  state.hp += pill.hp ?? 0;
  state.qi += pill.qi ?? 0;
  state.toxin += pill.toxin ?? 0;
  state.wounds -= pill.wound ?? 0;
  state.focus += pill.focus ?? 0;
  if (pill.satiety > 0) {
    state.satiety = Math.min(rules.maxSatiety, state.satiety + pill.satiety);
    state.didEat = true;
  }
  normalize(state);
  const restored = state.hp - hp;
  const restoredQi = state.qi - qi;
  const sense = restoreTrainingSense(state, pill.sense ?? 0);
  const toxic = state.toxin >= rules.toxinThreshold;
  const toxinDamage = toxic ? Math.max(0, Math.min(state.hp - 1, rules.toxinDamage)) : 0;
  state.hp -= toxinDamage;
  const applied = id === 'salve' ? '你把松脂膏敷在伤口上。' : `你服下${nameOf(id)}。`;
  const message = applied + (restored > 0 ? `气血回了${restored}点。` : '') + (restoredQi > 0 ? `真气回了${restoredQi}点。` : '')
    + (sense > 0 ? `神识回了${sense}点。` : '')
    + (toxinDamage ? `丹毒积重，损失${toxinDamage}点生命。` : '');
  return { message, medicineRecovery: { hp: Math.max(0, restored), sense },
    injury: toxinDamage ? { cause: '丹毒发作。', amount: toxinDamage } : undefined };
}

function use(state, id, inCombat) {
  if (records.foods[id] || id === 'beast_meat') return eat(state, inCombat, id);
  if (!owns(state, id)) return refuse('行囊里没有这件物品。');
  if (records.items[id]?.breakthrough) return refuse(`${nameOf(id)}要在闭关突破时服下。`);
  const pill = records.pills[id];
  if (pill && inCombat && inRegulatedBout(state)) return refuse(regulatedBoutRestriction);
  const talisman = records.talismans[id];
  const entry = pill ?? talisman;
  if (!entry) return refuse('这件物品不能直接使用。');
  if (entry.tier > state.realm) return refuse('你目前承受不了这件物品的效力。');
  if (talisman && !inCombat) return refuse('这道符要在战斗中用。');
  if (pill?.satiety && state.satiety >= rules.maxSatiety) return refuse('你还很饱。');
  if (pill) {
    const reason = senseMedicineBlocker(state, pill);
    if (reason) return refuse(reason);
    if (inCombat) return combatTurn(state, { kind: 'medicine', medicine: id });
    const { message, ...dose } = applyMedicine(state, id);
    return { ...say(state, message), ...dose };
  }
  if (talisman.damage > 0 && spiritBlocksStrike(state.combat)) return refuse(spiritStrikeRestriction);
  removeItem(state, id, 1);
  const message = `你催动${nameOf(id)}。`;
  const training = trainingPerks(state);
  const guard = talisman.guard > 0 ? talisman.guard + training.sealGuard : 0;
  if (talisman.retreat > 0 && !talisman.damage) return retreat(state, talisman.retreat, message, guard);
  state.combat.escapeBonus += talisman.retreat ?? 0;
  return combatTurn(state, {
    kind: talisman.damage > 0 ? 'strike' : 'brace',
    damageType: 'magic',
    damage: talisman.damage > 0 ? talisman.damage + training.sealDamage : 0,
    pierce: Infinity,
    guard,
    message,
  });
}

export function handConflict(equipment, id) {
  const gear = records.gear[id];
  if (gear?.slot === 'offhand' && records.gear[equipment.weapon]?.hands === 2) return '先收起双手兵刃。';
  return '';
}

function equip(state, id) {
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (state.realm < gear.tier) return refuse('这件装备需要更高境界。');
  if (!state.durability[id]) return refuse('这件装备需要先修理。');
  if (state.equipment[gear.slot] === id) return refuse('你已经穿戴了这件装备。');
  const conflict = handConflict(state.equipment, id);
  if (conflict) return refuse(conflict);
  const returned = gear.hands === 2 ? state.equipment.offhand : null;
  const equipment = { ...state.equipment, [gear.slot]: id };
  if (returned) equipment.offhand = null;
  if (backpackSlots({ ...state, equipment }) > backpackCapacity(state, rules.backpackCapacity)) {
    return refuse('行囊已满，换装后放不下收起的装备。');
  }
  state.equipment = equipment;
  normalize(state);
  return say(state, `换上${nameOf(id)}。${returned ? `把${nameOf(returned)}收进行囊。` : ''}`);
}

function unequip(state, slot) {
  if (!slots.includes(slot) || !state.equipment[slot]) return refuse('这个位置没有装备。');
  if (backpackSlots(state) >= backpackCapacity(state, rules.backpackCapacity)) return refuse('行囊已满，收不下这件装备。');
  const id = state.equipment[slot];
  state.equipment[slot] = null;
  normalize(state);
  return say(state, `收起${nameOf(id)}。`);
}

function discardPlace(state) {
  return state.combat && inProtectedBout(state) ? state.region : groundPlace(state);
}

function discardTerms(state, id) {
  const item = records.items[id];
  const held = owns(state, id);
  const busy = state.combat || state.gathering || (state.roadBandit && !state.roadBandit.aftermath);
  const reason = !item || held < 1 ? '行囊里没有这件东西。'
    : isEvidence(item) && !item.breakthrough && !item.discardable ? '随身线索不用占行囊，也不必放下。'
      : Object.values(state.equipment).includes(id) ? '先把装备收下。'
        : busy && state.activeManual === id ? '先停下运功，再放下功谱。' : '';
  return { maximum: reason ? 0 : held, relief: id === supply ? Math.min(held, state.reliefRations ?? 0) : 0, reason };
}

function disposalConfirmation(state, action, item, count, maximum, { confirmed, expectedPlace } = {}) {
  if (!item.oneOfAKind) return null;
  const dropping = action === 'discard';
  const place = dropping ? discardPlace(state) : state.region;
  if (confirmed === true) return expectedPlace !== undefined && expectedPlace !== place
    ? refuse('已经离开原处，请重新确认。') : null;
  const placeName = records.sites[place]?.name ?? records.regions[place]?.name ?? '这段路边';
  const message = dropping ? '这件物品无法重新取得。放下后，仍可回这里找。' : '这件物品无法重新取得。卖出后就收不回来了。';
  return { ...refuse(message), confirmation: { action, id: item.id, name: item.name, count, maximum, place, placeName } };
}

function discard(state, { id, count = owns(state, id), confirmed, expectedPlace }) {
  const { maximum, relief, reason } = discardTerms(state, id);
  if (reason) return refuse(reason);
  if (!Number.isSafeInteger(count) || count < 1 || count > maximum) return refuse('行囊里没有这么多。');
  const confirmation = disposalConfirmation(state, 'discard', records.items[id], count, maximum, { confirmed, expectedPlace });
  if (confirmation) return confirmation;
  const dropped = Math.min(count, maximum - relief);
  const forgone = count - dropped;
  if (dropped) leaveOnGround(state, { [id]: dropped }, state.durability, discardPlace(state));
  removeItem(state, id, count, false);
  if (forgone) state.reliefRations -= forgone;
  return say(state, (dropped ? `把${nameOf(id)}${dropped > 1 ? ` ×${dropped}` : ''}放到地上。` : '')
    + (forgone ? `舍弃了 ${forgone} 份救济干粮。` : ''));
}

function takeFromGround(state, id, requested) {
  const ground = groundAt(state);
  const available = ground[id] ?? 0;
  if (!records.items[id] || available < 1 || (requested !== undefined &&
      (!Number.isSafeInteger(requested) || requested < 1 || requested > available))) return refuse('这里没有这么多东西可捡。');
  const gear = records.gear[id];
  if (gear && gearReserved(state, id)) return refuse('同名装备已在手上、仓里或锻炉里。');
  const reason = groundPickupReason(state, id, requested);
  if (reason) return refuse(reason);
  const maximum = groundPickupLimit(state, id);
  const count = requested ?? maximum;
  if (count > maximum) return refuse(maximum ? `行囊只装得下${maximum}份。` : '行囊已满。');
  if (!count) return refuse('行囊已满。');
  ground[id] -= count;
  if (!ground[id]) delete ground[id];
  const picked = { [id]: count };
  addItems(state, picked, true);
  if (gear) {
    const worn = state.groundDurability?.[groundPlace(state)]?.[id];
    state.durability[id] = worn?.shift() ?? gear.durability;
  }
  return { ...say(state, `拾起${goodsText(picked)}。`),
    ...(requested === undefined && ground[id] ? { leftOnGround: { [id]: ground[id] } } : {}) };
}

function restQi(state) {
  return rules.restQi + trainingPerks(state).restQi + (activeManualRank(state)?.base.restQi ?? 0);
}

function recoverySessions(state) {
  const { maxHp, maxQi } = stats(state);
  const unwoundedHp = maxHp + state.wounds * rules.woundPenalty;
  return Math.max(
    Math.ceil((unwoundedHp - state.hp) / rules.restHp),
    Math.ceil((maxQi - state.qi) / restQi(state)),
    Math.ceil(state.wounds / rules.restWounds), Math.ceil(state.toxin / rules.restToxin),
    state.pressure || needsSenseRest(state) ? 1 : 0,
  );
}

function applyHalfDayRest(state) {
  advance(state, rules.restDays);
  state.wounds -= rules.restWounds;
  state.toxin -= rules.restToxin;
  state.pressure = 0;
  state.fogExposure = 0;
  state.hp += rules.restHp;
  state.qi += restQi(state);
  const recoveredSense = restoreTrainingSense(state);
  normalize(state);
  return recoveredSense > 0;
}

function rest(state, untilRecovered = false) {
  const required = recoverySessions(state);
  const relief = Math.max(0, rules.reliefRations - owns(state, supply));
  if (!required && (!relief || untilRecovered)) return refuse('你已经歇足了。');
  const granted = fittingItems(state, { [supply]: relief }).accepted[supply] ?? 0;
  if (relief && !granted && !required) return refuse('行囊已满，拿不了干粮。');
  const sessions = untilRecovered ? required : 1;
  let recoveredSense = false;
  for (let i = 0; i < sessions; i++) {
    if (applyHalfDayRest(state)) recoveredSense = true;
  }
  if (granted) {
    state.reliefRations += granted;
    addItems(state, { [supply]: granted });
  }
  const duration = sessions === 1 ? '半日' : `${sessions * rules.restDays}日`;
  return say(state, `在${regionOf(state).name}歇了${duration}。${recoveredSense ? '神识也养回来了。' : ''}${granted ? `灶上匀给你${granted}份${nameOf(supply)}。` : relief ? '行囊已满，拿不了干粮。' : ''}`);
}

function research(state) {
  const sessions = state.studies[state.realm] ?? 0;
  if (sessions >= rules.researchLimit) return refuse('在这个境界，静修已不能再增长见识。出门探索、交手或办委托都能继续增长。');
  if (state.qi < rules.researchQi) return refuse('真气不足，先歇息片刻。');
  advance(state, rules.researchDays);
  state.qi -= rules.researchQi;
  state.studies[state.realm] = sessions + 1;
  state.insight += rules.researchInsight;
  recordPractice(state);
  return say(state, `静修半日，见识+${rules.researchInsight}。`);
}

function homeBagAvailable(state, id) {
  return Math.max(0, owns(state, id) - (id === supply ? state.reliefRations : 0));
}

function homeSupplies(state, id) {
  return homeBagAvailable(state, id) + (atHome(state) ? state.economy.warehouse[id] ?? 0 : 0);
}

function homeBagSpend(state, resources) {
  return Object.fromEntries(resourceEntries(resources).map(([id, count]) => [id, Math.min(count, homeBagAvailable(state, id))]));
}

function homeRequirements(state, cost, need) {
  if (typeof cost === 'number' && state.coins < cost) return `需要${cost}枚灵钱。`;
  const missing = Object.fromEntries(resourceEntries(combinedResources(cost, need))
    .map(([id, count]) => [id, count - homeSupplies(state, id)]).filter(([, count]) => count > 0));
  if (Object.keys(missing).length) return `还缺${goodsText(missing)}。`;
  return '';
}

function spendHome(state, cost, need) {
  if (typeof cost === 'number') state.coins -= cost;
  const materials = combinedResources(cost, need);
  for (const [id, count] of resourceEntries(materials)) {
    const fromBag = Math.min(count, homeBagAvailable(state, id));
    if (fromBag) removeItem(state, id, fromBag, false);
    if (fromBag === count) continue;
    const { warehouse, warehouseWear } = state.economy;
    warehouse[id] -= count - fromBag;
    if (warehouse[id] === 0) {
      delete warehouse[id];
      delete warehouseWear[id];
    }
  }
}

function manualEquipBlocker(state, manual) {
  if (!manual || !owns(state, manual.id)) return '行囊里没有这本内功。';
  if (state.combat || state.gathering || state.victoryPending) return '等手上的事办完，再换内功。';
  if (state.realm < manual.tier) return '修为还压不住这门内功的行气。';
  return '';
}

function manualUpgradeBlocker(state, manual, next) {
  const locked = manualEquipBlocker(state, manual);
  if (locked) return locked;
  if (!next) return '这本内功已经练至顶层。';
  if (state.event || !settlementOf(data, state.region)?.inn) return '到一处能歇脚的地方再练。';
  if (state.realm < (next.tier ?? manual.tier)) return `到${records.realms[next.tier ?? manual.tier].name}才能再往深处练。`;
  return homeRequirements(state, next.cost, next.need);
}

function innerStyleView(state, weapon, side) {
  const classes = [weapon.isLoaded && weapon.id ? weapon.weaponClass : 'fist', side?.weaponClass];
  const books = data.innerStyles.filter(({ id }) => owns(state, id) > 0).map((manual) => {
    const { id, name, grade, desc, specialty, ranks } = manual;
    const rank = manualRank(state, id);
    const next = ranks[rank];
    const equipReason = manualEquipBlocker(state, manual);
    const reason = next ? manualUpgradeBlocker(state, manual, next) : '';
    return { id, name, grade, desc, specialty, rank, maxRank: ranks.length, effect: ranks[rank - 1].effect,
      aligned: classes.some((type) => specialty.includes(type)), canEquip: !equipReason, equipReason,
      upgrade: next ? { coins: next.cost, days: next.days, tier: records.realms[next.tier ?? manual.tier].name,
        need: resourceEntries(next.need).map(([id, count]) => ({ id, name: nameOf(id), count, total: homeSupplies(state, id) })),
        reason, available: !reason } : null };
  });
  if (!books.length) return null;
  return { books, active: books.find(({ id }) => state.activeManual === id) ?? null };
}

function equipManual(state, id) {
  const manual = records.innerStyles[id];
  const reason = manualEquipBlocker(state, manual);
  if (reason) return refuse(reason);
  if (state.activeManual === id) return refuse('你已经在运转这门内功。');
  state.activeManual = id;
  normalize(state);
  return say(state, `你依着《${manual.name}》调过呼吸，将内息引入新的经路。`);
}

function unequipManual(state) {
  if (!activeManual(state)) return refuse('你还没有运转一门内功。');
  state.activeManual = null;
  normalize(state);
  return say(state, '你收住行气，任真气顺着平时的经路流转。');
}

function upgradeManual(state, id) {
  const manual = records.innerStyles[id];
  const rank = manualRank(state, id);
  const next = manual?.ranks[rank];
  const reason = manualUpgradeBlocker(state, manual, next);
  if (reason) return refuse(reason);
  spendHome(state, next.cost, next.need);
  state.manualRanks[id] = rank + 1;
  advance(state, next.days);
  normalize(state);
  const learned = next.fistCharge && !manual.ranks[rank - 1].fistCharge;
  return say(state, learned ? `你循着《${manual.name}》练通了气路，拳劲终于能在手中收住。`
    : `你慢慢走完《${manual.name}》里新的一重气路。`);
}

function hasRoom(state, loot, spent) {
  return !Object.keys(fittingItems(state, loot, spent).spilled).length;
}

function gearReserved(state, id) {
  return owns(state, id) || state.economy.warehouse[id] || containerHasItem(state, id) || state.economy.jobs.some(({ loot }) => loot[id]);
}

function breakthroughBlockers(state, next) {
  const pending = [];
  if (next.requireQuest && !state.completedQuests.includes(next.requireQuest)) {
    pending.push(`先办完「${records.quests[next.requireQuest].name}」。`);
  }
  for (const id of next.requireDefeated ?? []) {
    if (!state.defeated.includes(id)) pending.push(`还未在实地战胜${records.enemies[id].name}。`);
  }
  for (const id of next.requireVerified ?? []) {
    if (!state.completedDeductions.includes(id)) pending.push(`还未在现场印证「${records.deductions[id].name}」。`);
  }
  if (state.insight < (next.insight ?? 0)) pending.push(`见识尚欠，突破需要${next.insight}点。`);
  const practice = state.practice[state.realm] ?? 0;
  if (practice < (next.practice ?? 0)) pending.push(`这一境还要历练${next.practice - practice}日。`);
  const materials = homeRequirements(state, next.cost, next.need);
  if (materials) pending.push(materials);
  return pending;
}

function breakthrough(state) {
  const next = records.realms[state.realm + 1];
  if (!next) return refuse('你已经到了当前最高境界。');
  const [blocker] = breakthroughBlockers(state, next);
  if (blocker) return refuse(blocker);
  spendHome(state, next.cost, next.need);
  advance(state, next.days);
  state.realm = next.id;
  if (state.realm === rules.resistanceTier) restoreTrainingSense(state);
  const { maxHp, maxQi } = stats(state);
  state.hp = maxHp;
  state.qi = maxQi;
  return say(state, `你踏入${next.name}，气血与真气皆满。`);
}

function craftBlocker(state, recipe) {
  if (!recipe) return '没有这张配方。';
  if (recipe.facility) return '要到配方写的那处工位制作。';
  if (recipe.tier > state.realm) return '这一手做法需要更高境界。';
  if (!knowsRecipe(state, recipe)) return '你还没找到这个做法。';
  if (records.gear[recipe.result] && gearReserved(state, recipe.result)) return '同名装备已在手上、仓里或锻炉里。';
  const missing = homeRequirements(state, recipe.cost, recipe.need);
  if (missing) return missing;
  const loot = { [recipe.result]: recipe.count ?? 1 };
  return hasRoom(state, loot, homeBagSpend(state, combinedResources(recipe.cost, recipe.need))) ? '' : '行囊已满，放不下制成的东西。';
}

function craft(state, id) {
  const recipe = records.recipes[id];
  const blocker = craftBlocker(state, recipe);
  if (blocker) return refuse(blocker);
  const loot = { [recipe.result]: recipe.count ?? 1 };
  spendHome(state, recipe.cost, recipe.need);
  advance(state, recipe.days);
  addItems(state, loot);
  return say(state, `制成${nameOf(recipe.result)}×${recipe.count ?? 1}。`);
}

function showHideToSmith(state) {
  if (!homeSupplies(state, 'hide')) return refuse('行囊和仓库里都没有兽革。');
  if (state.showedHideToSmith) return refuse('工匠已经看过兽革。');
  state.showedHideToSmith = true;
  return say(state, '工匠拎起兽革，顺着纹路拽了拽。「两片够衬一件褂子。再攒一片，配松木和炉里刚打好的铁圈，还能包一面小盾。」');
}

function stockedOffers(state, offers) {
  return offers.filter(({ id, afterQuest }) =>
    records.items[id]?.price > 0 && (!afterQuest || state.completedQuests.includes(afterQuest)));
}

function purchaseBlocker(state, item, count, stock) {
  if (stock !== null && stock < count) return stock ? '摊上没有这么多货。' : '这批货已经卖完。';
  const gear = records.gear[item.id];
  const object = gear ?? records.pills[item.id] ?? records.talismans[item.id];
  if (object && object.tier > state.realm) return `需${records.realms[object.tier].name}境方可购入。`;
  if (gear && (gearReserved(state, item.id) || count !== 1)) return '同种装备只能持有一件。';
  if (state.coins < item.price * count) return '灵钱不足。';
  if (!hasRoom(state, { [item.id]: count }, { [currency]: item.price * count })) return '行囊已满。';
  return '';
}

function saleTerms(state, id, requested = 1) {
  const held = owns(state, id);
  const gear = records.gear[id];
  const equipped = gear && state.equipment[gear.slot] === id;
  const reserved = id === supply ? state.reliefRations : 0;
  const count = equipped ? 0 : Math.max(0, held - reserved);
  let blockedReason = '';
  if (held < requested) blockedReason = '行囊里没有这么多。';
  else if (equipped) blockedReason = '先卸下这件装备。';
  else if (count < requested) blockedReason = '村里匀给你的口粮只供自用。';
  return { count, blockedReason };
}

function marketView(state) {
  const stalls = data.market.stalls.map((stall) => ({
    ...stall,
    merchant: merchantInfo(state, stall, economyKit),
    offers: stockedOffers(state, stall.offers).map((offer) => {
      const item = records.items[offer.id];
      const stock = marketStock(state, stall.id, offer);
      let maximum = Math.min(rules.maxTradeCount, stock ?? Infinity, Math.floor(state.coins / item.price));
      if (records.gear[item.id] && maximum) maximum = 1;
      while (maximum > 0 && purchaseBlocker(state, item, maximum, stock)) maximum--;
      const blockedReason = maximum ? '' : purchaseBlocker(state, item, 1, stock);
      return { id: offer.id, price: item.price, stock, maximum, canBuy: !blockedReason, blockedReason };
    }),
  })).filter(({ offers }) => offers.length);
  const sales = data.items.filter(({ id, sell }) => sell > 0 && owns(state, id)).map(({ id, sell }) => {
    const { count, blockedReason } = saleTerms(state, id);
    const paymentBlocked = !blockedReason && !hasRoom(state, { [currency]: 1 }, { [id]: count });
    if (paymentBlocked) return { id, ...saleQuote(state, id, sell), count, canSell: false, blockedReason: '行囊满了，收不下卖得的灵钱。' };
    return { id, ...saleQuote(state, id, sell), count, canSell: !blockedReason, blockedReason };
  });
  return { stalls, sales };
}

function trade(state, id, count, buying, stallId, confirmationOptions) {
  const item = records.items[id];
  if (!item || !Number.isInteger(count) || count < 1 || count > rules.maxTradeCount) return refuse('请选择交易物品及数量。');
  const price = buying ? item.price : item.sell;
  if (!(price > 0)) return refuse('坊市没有这门买卖。');
  let merchantMessage = '';
  let total = price * count;
  if (buying) {
    const stall = data.market.stalls.find((row) => (!stallId || stallId === row.id) &&
      stockedOffers(state, row.offers).some((offer) => offer.id === id));
    if (!stall) return refuse('摊上没摆这件货。');
    const offer = stockedOffers(state, stall.offers).find((row) => row.id === id);
    const blockedReason = purchaseBlocker(state, item, count, marketStock(state, stall.id, offer));
    if (blockedReason) return refuse(blockedReason);
    state.coins -= total;
    addItems(state, { [id]: count });
    merchantMessage = recordPurchase(state, stall.id, count, offer);
  } else {
    const { blockedReason, count: owned } = saleTerms(state, id, count);
    if (blockedReason) return refuse(blockedReason);
    const confirmation = disposalConfirmation(state, 'sell', item, count, Math.min(owned, rules.maxTradeCount), confirmationOptions);
    if (confirmation) return confirmation;
    const quote = saleQuote(state, id, price);
    total = saleTotal(quote, count);
    if (!hasRoom(state, { [currency]: total }, { [id]: count })) return refuse('行囊满了，收不下卖得的灵钱。');
    removeItem(state, id, count, false);
    addCoins(state, total);
    recordSale(state, id, count, quote);
  }
  return { ...say(state, `${buying ? '买入' : '卖出'}${item.name}×${count}，${total}枚灵钱。${merchantMessage}`), merchantMessage };
}

const repairStockByClass = {
  staff: { wood: 2 },
  blade: { ore: 2 },
  sword: { ore: 2 },
  spear: { ore: 2, wood: 2 },
  bow: { wood: 2, reed: 1 },
  crossbow: { wood: 1, ore: 2, hide: 1 },
  hammer: { ore: 2, wood: 1 },
  fist: { hide: 1, ore: 1 },
};

const repairStockByWeapon = {
  knife: { ore: 1 },
  reed_bow: { wood: 1, reed: 1 },
  pine_bow: { wood: 2, hide: 1 },
  resin_staff: { wood: 2, ore: 1 },
  tide_spear: { ore: 2, wood: 1, core: 1 },
  star_blade: { black_iron: 1, ore: 1 },
  coil_spear: { wood: 2, black_iron: 1 },
  black_crossbow: { wood: 1, black_iron: 1, hide: 1 },
  snow_halberd: { wood: 2, black_iron: 1 },
  sky_sword: { black_iron: 1, core: 1 },
  sky_bow: { wood: 2, hide: 1, core: 1 },
  weir_knife: { ore: 2, core: 1 },
  coil_pole: { wood: 2, black_iron: 1 },
  foil_sword: { ore: 2, black_iron: 2, core: 1 },
  lake_bow: { wood: 2, hide: 2, core: 1 },
  quarry_spear: { black_iron: 2, hard_scale: 1 },
  side_hook: { ore: 1, wood: 1 },
  scale_chisel: { black_iron: 1, hard_scale: 1 },
  echo_knuckles: { black_iron: 1, battle_sinew: 1 },
  gully_king_blade: { ore: 2, black_iron: 1 },
  gold_iron_blade: { ore: 2, black_iron: 1 },
  gold_tide_staff: { wood: 2, core: 1 },
  gold_confluence_staff: { wood: 2, core: 2, black_iron: 1 },
};

export function weaponRepairNeed(id, remaining = 0) {
  const gear = records.gear[id];
  if (!gear || !(gear.slot === 'weapon' || gear.sideAtk > 0)) return null;
  const stock = repairStockByWeapon[id] ?? repairStockByClass[gear.weaponClass] ?? repairStockByClass.blade;
  const lost = gear.durability - clamp(remaining, 0, gear.durability);
  return lost > 0 ? Object.fromEntries(resourceEntries(stock)
    .map(([part, count]) => [part, Math.ceil(count * lost / gear.durability)])) : {};
}

function repairServiceView(state) {
  const service = settlementOf(data, state.region)?.repair;
  if (!service) return null;
  const carried = resourceEntries(state.inventory).filter(([id, count]) => records.gear[id] && count > 0);
  return {
    ...service,
    prices: Object.fromEntries(carried.map(([id]) => [id, repairPrice(records.gear[id], service)])),
    materials: Object.fromEntries(carried.flatMap(([id]) => {
      const need = weaponRepairNeed(id, state.durability[id] ?? records.gear[id].durability);
      return need && Object.keys(need).length ? [[id, { need, reason: homeRequirements(state, 0, need) }]] : [];
    })),
  };
}

function repairPrice(gear, service) {
  return (gear.repair ?? 1) + service.surcharge;
}

function repair(state, id, useMaterials = false) {
  const service = settlementOf(data, state.region)?.repair;
  if (!service) return refuse('这里没有接活的修具匠。');
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  const remaining = state.durability[id] ?? gear.durability;
  if (remaining >= gear.durability) return refuse('这件装备已经完好。');
  if (useMaterials) {
    const need = weaponRepairNeed(id, remaining);
    if (!need) return refuse('自备料只接兵器的活。');
    const why = homeRequirements(state, 0, need);
    if (why) return refuse(why);
    spendHome(state, 0, need);
    state.durability[id] = gear.durability;
    return say(state, `用${goodsText(need)}修好${nameOf(id)}，耐久已满。`);
  }
  const cost = repairPrice(gear, service);
  if (state.coins < cost) return refuse(`修这件装备要${cost}枚灵钱。`);
  state.coins -= cost;
  state.durability[id] = gear.durability;
  return say(state, `花了${cost}枚灵钱，修好${nameOf(id)}，耐久已满。`);
}

function questBlocker(state, quest) {
  if (quest.requireQuest && !state.completedQuests.includes(quest.requireQuest)) {
    return quest.waitForQuest ?? `先办完「${records.quests[quest.requireQuest].name}」。`;
  }
  const missing = homeRequirements(state, 0, quest.need);
  if (missing) return missing;
  return hasRoom(state, { ...quest.reward, [currency]: quest.coins ?? 0 }, homeBagSpend(state, quest.need)) ? '' : '行囊已满，放不下回礼。';
}

function handin(state, id) {
  const quest = records.quests[id];
  if (!quest || (quest.region ?? hub) !== state.region || !knowsQuest(state, quest)) return refuse('这里找不到这份委托。');
  if (state.completedQuests.includes(id)) return refuse('这份委托已经交付。');
  const reason = questBlocker(state, quest);
  if (reason) return refuse(reason);
  spendHome(state, 0, quest.need);
  addItems(state, { ...quest.reward, [currency]: quest.coins ?? 0 });
  state.insight += quest.insight ?? 0;
  state.completedQuests.push(id);
  if (id === 'lost_basket_return') state.basketDisposition = 'returned';
  const victory = id === victoryQuestId();
  if (victory) {
    state.won = true;
    state.wonDay = state.day;
    state.victoryPending = true;
    state.completionPhase = 'ford';
  }
  if (id === data.finalQuest) {
    state.finalWon = true;
    state.finalDay = state.day;
    state.victoryPending = true;
    state.completionPhase = 'final';
  }
  const outcome = quest.outcome ?? (victory ? '村人接过镇渡印，旧渡重新开闸。' : undefined);
  return { ...say(state, outcome ?? `已交付${quest.name}。`), outcome };
}

function meditate(state, { item }) {
  const clue = records.items[item];
  if (typeof item !== 'string' || !isEvidence(clue) || clue.breakthrough || clue.recipeOnly || !owns(state, item) || usedDeductionClues(state).includes(item)) {
    return refuse('请选一条手边还未推演过的线索。');
  }
  if (state.qi < rules.deductionQiCost) return refuse('真气不足，歇一歇再想。');
  state.qi -= rules.deductionQiCost;
  const ready = data.deductions.find((entry) => {
    const trial = experiments[entry.id];
    return trial.need[item] > 0 && !hasDeduced(state, entry.id) &&
      knowsDeduction(state, entry) && hasChoiceNeeds(state, trial);
  });
  if (!ready) return { ...say(state, '没什么头绪。'), meditation: 'incomplete' };
  state.deductionDraftId = ready.id;
  return { ...say(state, '几条线索正好能相互印证，已摆上沙盘。'), meditation: 'ready' };
}

function deduce(state, { id }) {
  if (!id || state.deductionDraftId !== id || hasDeduced(state, id) || !hasChoiceNeeds(state, experiments[id])) {
    return refuse('先选一条线索冥想，把相关线索摆上沙盘。');
  }
  state.deductionHistory.push({ id, day: state.day });
  state.deductionDraftId = null;
  return { ...say(state, '想通了。到现场试一试。'), deduction: 'recorded' };
}

function tryExperiment(state, { id, settings }) {
  const trial = availableExperiment(state, records.events[state.event]);
  if (!trial || trial.id !== id) return refuse('这里还缺现场验证所需的线索或物件。');
  const blocked = experimentBlocker(state, records.events[state.event], trial);
  if (blocked) return refuse(blocked);
  if (!settings || typeof settings !== 'object' || Array.isArray(settings) ||
    Object.keys(settings).length !== trial.controls.length || trial.controls.some(({ id: control, options }) =>
      !Object.hasOwn(settings, control) || !options.some(({ id: option }) => option === settings[control]))) {
    return refuse('先决定眼前每一步怎么做。');
  }
  if (state.satiety === 0 && trial.days > 0) return refuse('腹中空空，先吃些东西。');
  advance(state, trial.days ?? 0);
  const mismatch = trial.controls.find(({ id: control }) => settings[control] !== trial.solution[control]);
  if (mismatch) {
    const observation = trial.misses?.[mismatch.id]?.[settings[mismatch.id]] ?? '动静平了，眼前仍和先前一样。';
    return { ...say(state, observation), deduction: 'miss' };
  }
  state.completedDeductions.push(id);
  state.insight += trial.insight ?? 0;
  const { spilled } = addItems(state, trial.reward, true);
  return { ...say(state, trial.outcome), deduction: 'verified', spilled };
}

const economyKit = {
  data, records, rules, currency, owns, atHome, resourceEntries, say, refuse, advance, addItems, addCoins, removeItem, startCombat, readableIntent,
  missingItems, payItems, hasRoom, backpackSlots, leaveOnGround, groundAt, nameOf, goodsText, normalize,
  isEvidence, knowsRecipe, homeSupplies, homeRequirements, spendHome, homeBagSpend, homeBagAvailable, gearReserved, mechanismFailure, roadProtection,
  saleTerms, disposalConfirmation, activeGear, checkRoadStep: (state, leg, index) => checkRoadBanditStep(state, leg, index, economyKit),
  roadRisk: (state, leg) => roadBanditRisk(state, leg, economyKit),
  banditDenPopulation: (state, id) => Object.values(poolCounts(state, records.sites[id], 'creatures')).reduce((sum, count) => sum + count, 0),
  eatOnRoad: (state, id) => eat(state, false, id),
  regulatedBoutBlocker, setRegulatedBoutRecovery,
};

function canUseVillageAction(state, action, payload) {
  if (action === 'rest' || action === 'restUntilRecovered') return settlementOf(data, state.region)?.inn;
  if (action === 'repair' || action === 'repairMaterials') return Boolean(settlementOf(data, state.region)?.repair);
  if (atHome(state)) return true;
  if (!isSettlement(state)) return false;
  return action === 'breakthrough' || action === 'research' || action === 'handin' ||
    (action === 'craft' && records.recipes[payload.id]?.result === 'gate_scroll');
}

const villageActions = {
  rest: (state) => rest(state),
  restUntilRecovered: (state) => rest(state, true),
  research: (state) => research(state),
  breakthrough: (state) => breakthrough(state),
  craft: (state, { id }) => craft(state, id),
  showHideToSmith,
  buy: (state, { id, count = 1, stallId }) => trade(state, id, count, true, stallId),
  sell: (state, { id, count = 1, confirmed, expectedPlace }) => trade(state, id, count, false, undefined, { confirmed, expectedPlace }),
  repair: (state, { id }) => repair(state, id),
  repairMaterials: (state, { id }) => repair(state, id, true),
  handin: (state, { id }) => handin(state, id),
};

const serviceForAction = {
  research: 'cultivate', breakthrough: 'cultivate',
  craft: 'workshop', showHideToSmith: 'workshop', buy: 'market', sell: 'market', handin: 'quests',
};

const generalActions = {
  travel: (state, { id }) => travel(state, id),
  visit: (state, { id }) => visit(state, id),
  revisit: (state, { id }) => revisit(state, id),
  wait,
  eat: (state, { id }) => eat(state, false, id || state.mealPouch),
  batchEat: (state, { id }) => eat(state, false, id || state.mealPouch, true),
  setMealPouch: (state, { id }) => setMealPouch(state, id),
  inspectBasket,
  unpackBasket,
  use: (state, { id }) => use(state, id, false),
  equip: (state, { id }) => equip(state, id),
  unequip: (state, { slot }) => unequip(state, slot),
  equipManual: (state, { id }) => equipManual(state, id),
  unequipManual,
  upgradeManual: (state, { id }) => upgradeManual(state, id),
  take: (state, { id, count }) => takeFromGround(state, id, count),
  selectAmmo: (state, { id }) => selectAmmo(state, id),
  meditate,
  deduce,
};

const combatActions = {
  attack,
  offhandAttack,
  fistAttack,
  fistCharge,
  tournamentWithdraw: (state) => tournamentAction(state, 'tournamentWithdraw', economyKit),
  invokeSpirit: (state) => invokeSpirit(state, economyKit),
  weaponSpell,
  selectAmmo: (state, { id }) => selectAmmo(state, id),
  guard: (state) => combatTurn(state, { kind: 'brace', brace: true }),
  dodge: (state) => combatTurn(state, { kind: 'dodge', evade: true, message: '你侧身挪步。' }),
  cancelCharge: (state) => {
    if (!state.combat.playerCharge) return refuse('眼下没有正在蓄力的招式。');
    state.combat.playerCharge = null;
    return say(state, '你停下蓄力。');
  },
  use: (state, { id }) => use(state, id, true),
  eat: (state, { id }) => eat(state, true, id || supply),
  retreat: (state) => retreat(state),
};

function takeTurn(state, action, payload) {
  if (state.banditDeath) return refuse('这一局已经结束。');
  if (action === 'discard') return discard(state, payload);
  if (state.gathering) {
    if (action !== 'finishGather') return refuse('这次采集还没结束。');
    const { siteId, index } = state.gathering;
    state.gathering = null;
    if (state.event !== siteId) return refuse('已经离开这处采集点。');
    return choose(state, { index });
  }
  if (state.victoryPending) {
    if (action !== 'resume') return refuse('收好这段游记，即可继续出门。');
    state.victoryPending = false;
    return say(state, state.completionPhase === 'final' ? '诸处商旅复行。山河仍可继续探访。' : '旧渡照常开船。你仍可留在村里，或再去寻路。');
  }
  if (state.combat) {
    if (equipmentChanges.has(action)) return refuse('交手中不能换装备。');
    if (Object.hasOwn(combatActions, action)) return combatActions[action](state, payload);
    return refuse('先处理眼前的对手。');
  }
  if (state.roadTrip) {
    if (!state.roadBandit || state.roadBandit.aftermath) {
      if (containerTransfers.has(action)) return economyAction(state, action, payload, economyKit);
      if (roadsideActions.has(action)) return generalActions[action](state, payload);
    }
    if (state.roadBandit) return banditAction(state, action, payload, economyKit) ?? refuse('先处理眼前拦路的人。');
    if (action === 'roadContinue') return continueRoad(state, economyKit);
    if (action === 'roadBack') return backFromRoad(state, economyKit);
    return refuse('先走完这段路，或折回先前的路口。');
  }
  if (action === 'gateScroll') return worldAction(state, action, payload, economyKit);
  const tournament = tournamentAction(state, action, economyKit);
  if (tournament) return tournament;
  if (state.event) {
    const mechanism = mechanismAction(state, action, payload, economyKit);
    if (mechanism) return mechanism;
    if (containerTransfers.has(action)) return economyAction(state, action, payload, economyKit);
    if (action === 'eat' || action === 'batchEat' || action === 'setMealPouch') return generalActions[action](state, payload);
    if (action === 'use') return use(state, payload.id, false);
    if (action === 'equip') return equip(state, payload.id);
    if (action === 'unequip') return unequip(state, payload.slot);
    if (action === 'equipManual') return equipManual(state, payload.id);
    if (action === 'unequipManual') return unequipManual(state);
    if (action === 'upgradeManual') return upgradeManual(state, payload.id);
    if (action === 'inspectBasket') return inspectBasket(state);
    if (action === 'unpackBasket') return unpackBasket(state);
    if (action === 'selectAmmo') return selectAmmo(state, payload.id);
    if (action === 'take') return takeFromGround(state, payload.id, payload.count);
    if (action === 'meditate' || action === 'deduce') return generalActions[action](state, payload);
    if (action === 'beginGather') return beginGather(state, payload.index);
    if (action === 'choose') return choose(state, payload);
    if (action === 'experiment') return tryExperiment(state, payload);
    if (action === 'leave') {
      state.event = null;
      return say(state, '你放下这桩事，沿原路退出。');
    }
    return refuse('先决定如何处理眼前的事。');
  }
  if (Object.hasOwn(villageActions, action)) {
    if (!canUseVillageAction(state, action, payload)) return refuse('这个地方办不了这件事。');
    const service = serviceForAction[action];
    if (service && !knowsService(state, service)) return refuse('你还没有找到这个门路。');
    return villageActions[action](state, payload);
  }
  if (Object.hasOwn(generalActions, action)) return generalActions[action](state, payload);
  return trainingAction(state, action, payload, economyKit) ?? worldAction(state, action, payload, economyKit) ?? economyAction(state, action, payload, economyKit) ?? alchemyAction(state, action, payload, economyKit) ??
    hazardAction(state, action, payload, economyKit) ??
    refuse('眼下无法这样做。');
}

export function act(state, action, payload = {}) {
  if (action === 'observeGuideItems') return observeGuideItems(state, payload ?? {});
  if (action === 'editGuideNote') return editGuideNote(state, payload ?? {});
  prepareCombatRound(state);
  const result = takeTurn(state, action, payload);
  if (state.actionFogLoss) {
    result.fogLoss = state.actionFogLoss;
    delete state.actionFogLoss;
  }
  if (result.ok) {
    prepareCombatRound(state);
    refreshDiscovery(state);
    recordItemSightings(state, result);
  }
  return result;
}
