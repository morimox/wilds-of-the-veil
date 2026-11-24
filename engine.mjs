import * as moduleData from './data.mjs';
import { initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo, backpackCapacity, backpackName, saleQuote, saleTotal, recordSale } from './economy.mjs';
import { hazardView, hazardAction, hazardVictory } from './hazards.mjs';
import { initialAlchemyState, alchemyView, alchemyAction } from './alchemy.mjs';
import { alwaysKnownRegion, learnAdjacentRegions, settlementOf, initialWorld, worldView, worldAction, travelRoad, rescueSettlement } from './world.mjs';
import { initialTraining, trainingStats, trainingPerks, restoreTrainingSense, needsSenseRest, trainingView, trainingAction, recordTrainingRead } from './training.mjs';
import { initialMechanisms, mechanismView, mechanismAction } from './mechanisms.mjs';
import { tournamentData, initialTournament, tournamentView, tournamentAction, tournamentResolution } from './tournament.mjs';
import { chooseEnemyIntent } from './combat-tactics.mjs';

const data = { ...moduleData.default, ...moduleData };

const records = Object.fromEntries(
  ['realms', 'items', 'gear', 'foods', 'pills', 'talismans', 'arts', 'recipes', 'regions', 'events', 'enemies', 'quests', 'deductions', 'sites', 'ammunition']
    .map((key) => [key, Object.assign(Object.create(null), Object.fromEntries((data[key] ?? []).map((entry) => [entry.id, entry])))]),
);
const experiments = Object.fromEntries(data.events.filter(({ experiment }) => experiment).map(({ experiment }) => [experiment.id, experiment]));
const supply = 'ration';
const hub = 'village';
const slots = Object.keys(data.equipmentSlots);
const hypothesisLimit = 180;

export const rules = Object.freeze({
  restDays: 0.5,
  restHp: 8,
  restQi: 5,
  restWounds: 1,
  restToxin: 15,
  reliefRations: 3,
  exploreDays: 0.25,
  explorePressure: 1,
  firstRegionInsight: 1,
  pressureThreshold: 3,
  pressureQi: 1,
  battleDays: 0.125,
  perceptionScale: 12,
  perceptionCap: 0.7,
  observedHitLimit: 3,
  combatDodgeCap: 0.30,
  combatChargeFloor: 4,
  combatChargeFactor: 0.35,
  enemyChargeFactor: 0.25,
  chargeBreakDamage: 4,
  harvestEncounterDays: 0.125,
  ebbCycleDays: 2,
  ebbWindowDays: 0.625,
  retreatDays: 0.25,
  retreatDamageFactor: 0.5,
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
  guardQiRecovery: 2,
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
  combatSwitchGuard: 1,
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
const owns = (state, id) => state.inventory[id] ?? 0;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const realmOf = (state) => records.realms[state.realm];
const regionOf = (state) => records.regions[state.region];
const enemyOf = (state) => state.combat ? records.enemies[state.combat.id] : null;
const inProtectedBout = (state) => Boolean(enemyOf(state)?.sparring && records.sites[state.combat.siteId]?.protectedArena);
const atHome = (state) => state.region === hub;
const isSettlement = (state) => Boolean(settlementOf(data, state.region));
const nameOf = (id) => records.items[id]?.name ?? id;
const goodsText = (resources) => resourceEntries(resources)
  .filter(([, count]) => count > 0).map(([id, count]) => `${nameOf(id)}×${count}`).join('、');

function activeGear(state) {
  return Object.values(state.equipment).map((id) => records.gear[id])
    .filter((entry) => entry && state.durability[entry.id] > 0);
}

function fogProtection(state) {
  let protection;
  for (const gear of activeGear(state)) {
    if ((gear.field?.fogTolerance ?? 0) > (protection?.field.fogTolerance ?? 0)) protection = gear;
  }
  return protection;
}

function roadProtection(state, province) {
  return activeGear(state).find(({ field }) => field?.roadSatiety?.province === province);
}

function stats(state) {
  const realm = realmOf(state);
  const worn = activeGear(state);
  const trained = trainingStats(state);
  const sum = (key) => worn.reduce((total, entry) => total + (entry[key] ?? 0), 0);
  return {
    maxHp: Math.max(1, realm.hp + sum('hp') + trained.hp - rules.woundPenalty * state.wounds),
    maxQi: Math.max(1, realm.qi + sum('qi') + trained.qi),
    attack: realm.atk + sum('atk'),
    defense: realm.def + sum('def') + trained.def,
    perception: (realm.perception ?? 0) + sum('perception'),
    retreat: sum('retreat'),
  };
}

function normalize(state) {
  state.wounds = clamp(state.wounds, 0, rules.maxWounds);
  state.focus = clamp(state.focus, 0, rules.focusLimit);
  state.toxin = Math.max(0, state.toxin);
  const { maxHp, maxQi } = stats(state);
  state.hp = clamp(state.hp, 0, maxHp);
  state.qi = clamp(state.qi, 0, maxQi);
}

function advance(state, days, satietyRate = rules.satietyDrainPerDay) {
  const elapsed = days ?? 0;
  state.day = Math.round((state.day + elapsed) * 1000) / 1000;
  state.satiety = Math.max(0, +(state.satiety - elapsed * satietyRate).toFixed(3));
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

function backpackSlots(state, inventory = state.inventory) {
  return resourceEntries(inventory).reduce((slotsUsed, [id, count]) =>
    slotsUsed + (occupiesBackpack(state, id) ? Math.ceil(count / rules.backpackStackSize) : 0), 0);
}

function fittingItems(state, resources, spent = {}) {
  const inventory = { ...state.inventory };
  for (const [id, count] of resourceEntries(spent)) inventory[id] = Math.max(0, (inventory[id] ?? 0) - count);
  let available = Math.max(0, backpackCapacity(state, rules.backpackCapacity) - backpackSlots(state, inventory));
  const accepted = {};
  const spilled = {};
  const stackSize = rules.backpackStackSize;
  for (const [id, count] of resourceEntries(resources)) {
    if (count <= 0 || !records.items[id]) continue;
    const current = inventory[id] ?? 0;
    const gear = records.gear[id];
    if (gear && current) continue;
    const desired = gear ? 1 : count;
    const occupies = occupiesBackpack(state, id);
    const used = Math.ceil(current / stackSize);
    const fits = occupies ? Math.min(desired, (available + used) * stackSize - current) : desired;
    if (fits) accepted[id] = fits;
    if (fits < desired) spilled[id] = desired - fits;
    if (occupies) available -= Math.ceil((current + fits) / stackSize) - used;
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
  return state.event ?? state.combat?.siteId ?? state.region;
}

function groundAt(state, place = groundPlace(state)) {
  return state.ground?.[place] ?? {};
}

function groundPickupLimit(state, id, available = groundAt(state)[id]) {
  if (!available || (records.gear[id] && gearReserved(state, id))) return 0;
  return fittingItems(state, { [id]: available }).accepted[id] ?? 0;
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
    const gear = records.gear[id];
    state.inventory[id] = owns(state, id) + count;
    if (!state.knownItems.includes(id)) state.knownItems.push(id);
    if (gear) state.durability[id] = gear.durability;
    if (found && !isSettlement(state)) state.expeditionLoot[id] = (state.expeditionLoot[id] ?? 0) + count;
  }
  return result;
}

function removeItem(state, id, count, spendRelief = true) {
  const remaining = owns(state, id) - count;
  if (remaining > 0) {
    state.inventory[id] = remaining;
  } else {
    delete state.inventory[id];
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
      : knowsMaterials(state, recipe.need));
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

function knowsDeduction(state, entry) {
  return (entry.tier ?? 0) <= state.realm && isRevealed(state, entry.reveal);
}

export function createGame(seed = Math.floor(Math.random() * 0x100000000)) {
  const settings = data.starting ?? {};
  const state = {
    day: 1,
    realm: 0,
    region: hub,
    world: initialWorld(),
    training: initialTraining(),
    mechanisms: initialMechanisms(),
    tournament: initialTournament(),
    hp: 0,
    satiety: clamp(settings.satiety ?? rules.maxSatiety, 0, rules.maxSatiety),
    didEat: false,
    qi: 0,
    coins: settings.coins ?? 10,
    insight: settings.insight ?? 0,
    pressure: 0,
    wounds: 0,
    toxin: 0,
    focus: 0,
    inventory: {},
    knownItems: [],
    reliefRations: 0,
    equipment: Object.fromEntries(slots.map((slot) => [slot, null])),
    durability: {},
    knownArts: [...(settings.arts ?? data.arts.filter((entry) => entry.tier === 0 && !entry.price && !entry.prizeOnly)
      .slice(0, 1).map((entry) => entry.id))],
    completedQuests: [],
    economy: initialEconomyState(),
    alchemy: initialAlchemyState(),
    completedDeductions: [],
    deductionThoughts: {},
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
  const carried = enemyOf(state)?.medicine;
  if (!carried || (state.combat.medicineLeft ?? carried.count) <= 0) return null;
  const { id, count } = carried;
  const name = nameOf(id);
  const action = id === 'salve' ? `敷上${name}` : id === 'jade_pill' ? `喝下${name}` : `服下${name}`;
  return { id, name, action, hp: records.pills[id].hp, left: state.combat.medicineLeft ?? count };
}

function enemyContext(state) {
  const { round, hp, lastEnemyIntent, enemyCharged, observedHits } = state.combat;
  return {
    round, hp, previousKind: lastEnemyIntent?.kind, charged: Boolean(enemyCharged),
    observedHits: observedHits ?? [], medicine: enemyMedicine(state),
  };
}

function prepareCombatRound(state) {
  const combat = state.combat;
  if (!combat || combat.plan?.round === combat.round) return;
  const enemy = enemyOf(state);
  const context = enemyContext(state);
  const gap = stats(state).perception - (enemy.perception ?? 0);
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
    (intent?.kind === 'attack' || intent?.kind === 'heavy'));
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
  return (choice.afterChoice === undefined || state.seenChoices.includes(`${site?.id}:${choice.afterChoice}`)) &&
    (!choice.afterFight || siteWins(state, site, choice.afterFight) > 0) &&
    (!choice.hideWhenExcluded || !choiceExcluded(state, choice, site)) &&
    (!choice.hidden || hasChoiceNeeds(state, choice));
}

function knowsSite(state, site) {
  const visited = state.eventsSeen[site.region] ?? [];
  const startsVisible = !site.afterChoices?.length && !site.reveal;
  return startsVisible || visited.includes(site.id) ||
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
    if (count === 0 && (pool.depletedFactor > 1 || holdsPassage || wild)) nextAt = state.day + recovery;
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
  return [changed?.[1] ?? opened?.[1] ?? event.text, tide, ...choiceDetails, ...stockDetails, ...creatureDetails].filter(Boolean).join('');
}

function availableExperiment(state, event) {
  const trial = event?.experiment;
  if (!trial || records.sites[event.id]?.region !== state.region || state.completedDeductions.includes(trial.id)) return null;
  const thought = state.deductionThoughts?.[trial.id];
  const linked = thought?.evidence.some((id) => (trial.need?.[id] ?? 0) > 0);
  return linked && hasChoiceNeeds(state, trial) ? trial : null;
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
  const observed = combatRead === 'player' || (state.combat && state.combat.spiritReadRound === state.combat.round);
  const intent = observed ? readableIntent(state) : null;
  const inSettlement = isSettlement(state);
  const mode = state.victoryPending ? 'victory' : state.combat ? 'combat' : state.event ? 'event' : inSettlement ? 'village' : 'field';
  const questLocation = inSettlement ? state.region : hub;
  const discoveredQuests = data.quests.filter((quest) => (quest.region ?? hub) === questLocation && knowsQuest(state, quest));
  const services = data.services.filter(({ id }) => knowsService(state, id) && (!inSettlement || atHome(state) ||
    id === 'cultivate' || (id === 'quests' && discoveredQuests.length) || (id === 'workshop' && canCraftScroll(state)))).map(({ id }) => id);
  const knownRecipes = services.includes('workshop') ? data.recipes.filter((recipe) => !recipe.facility &&
    (!inSettlement || atHome(state) || recipe.result === 'gate_scroll') && knowsRecipe(state, recipe)) : [];
  const currentEvent = state.event ? records.events[state.event] : null;
  const currentSite = currentEvent && records.sites[currentEvent.id];
  const experiment = availableExperiment(state, currentEvent);
  const nextRealm = services.includes('cultivate') ? records.realms[state.realm + 1] ?? null : null;
  const groundLoot = { ...groundAt(state) };
  const combatWeapon = weaponView(state);
  const side = sideWeapon(state);
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
  const { combatSeed, evadeSeed, combat, ...visibleState } = state;
  return {
    ...visibleState,
    ...stats(state),
    ...worldView(state, economyKit),
    localHazard: hazardView(state, economyKit),
    training: studies.rows,
    mechanism: mechanismView(state, economyKit),
    spiritSense: studies.spiritSense,
    tournament: tournamentView(state, economyKit),
    maxSatiety: rules.maxSatiety,
    restSessions: mode === 'village' && settlementOf(data, state.region)?.inn ? recoverySessions(state) : 0,
    batchMeals: ['field', 'village', 'event'].includes(mode) && !state.gathering
      ? Object.fromEntries(data.foods.map(({ id }) => [id, batchMealCount(state, id)]).filter(([, count]) => count > 1))
      : {},
    fogTolerance: rules.pressureThreshold + (fogProtection(state)?.field.fogTolerance ?? 0),
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
    groundLoot,
    groundWear: Object.fromEntries(resourceEntries(groundLoot).filter(([id]) => records.gear[id])
      .map(([id]) => [id, state.groundDurability?.[groundPlace(state)]?.[id]?.[0] ?? records.gear[id].durability])),
    groundPickup: Object.fromEntries(resourceEntries(groundLoot).map(([id, count]) => [id, groundPickupLimit(state, id, count)])),
    sites: currentSites(state).map((site) => viewSite(state, site)),
    currentEvent: currentEvent ? { id: currentEvent.id, name: currentEvent.name, text: siteText(state, currentSite, currentEvent), choices: visibleChoices } : null,
    visibleChoices,
    experiment: experiment ? {
      id: experiment.id,
      desc: experiment.desc,
      thought: state.deductionThoughts[experiment.id],
      controls: experiment.controls.map(({ id, label, options }) => ({
        id, label, options: options.map(({ id, label }) => ({ id, label })),
      })),
    } : null,
    revisitableEvents: revisitableEvents(state).map(({ id, name }) => ({ id, name })),
    combat: combat ? { id: combat.id, siteId: combat.siteId, round: combat.round } : null,
    currentEnemy: enemy ? { id: enemy.id, name: enemy.name, tier: enemy.tier, desc: enemy.desc,
      sparring: inProtectedBout(state), maxHp: enemy.hp, hp: combat.hp } : null,
    combatWeapon,
    combatOffhand: side ? { id: side.id, name: nameOf(side.id), chargeRequired: Boolean(side.chargeRequired) } : null,
    openingShotReady: canInterceptOpening(state, intent) && Boolean(combatWeapon.selectedAmmo),
    openingShotPossible: Boolean(combat?.openingRange && combat.round === 0 && combatWeapon.selectedAmmo),
    combatRead,
    combatCharge: Boolean(combat?.playerCharged),
    enemyCharged: Boolean(combat?.enemyCharged),
    lastEnemyIntent: combat?.lastEnemyIntent ?? null,
    intent,
    intentDamage: intent ? estimatedHit(state, enemy, intent) : null,
    retreatRisk: intent && !inProtectedBout(state) ? retreatRisk(state, enemy, intent) : null,
    breathingQi: intent?.kind === 'guard' ? breathingQi(state) : 0,
    discoveredArts: data.arts.filter((art) => state.knownArts.includes(art.id) ||
      (!art.prizeOnly && (!inSettlement || atHome(state)) && services.includes('cultivate') && art.tier <= state.realm && isRevealed(state, art.reveal))).map(({ id }) => id),
    discoveredRecipes: knownRecipes.map(({ id }) => id),
    craftReasons: inSettlement ? Object.fromEntries(knownRecipes.map((recipe) => [recipe.id, craftBlocker(state, recipe)])) : {},
    discoveredQuests: discoveredQuests.map(({ id }) => id),
    discoveredItems: data.items.filter((item) => knowsItem(state, item)).map(({ id }) => id),
    market: !inSettlement || atHome(state) ? marketView(state) : { stalls: [], sales: [] },
    economy: economyView(state, economyKit),
    alchemy: alchemyView(state, economyKit),
    homeMaterials: inSettlement ? Object.fromEntries(data.items.map(({ id }) => [id, homeSupplies(state, id)]).filter(([, count]) => count > 0)) : {},
    evidence: data.items.filter((item) => !item.breakthrough && isEvidence(item) && owns(state, item.id) > 0)
      .map(({ id, name, desc }) => ({ id, name, desc, count: owns(state, id) })),
    deductions: (data.deductions ?? []).filter((entry) => knowsDeduction(state, entry)).map((entry) => {
      const { id, name, desc } = entry;
      const completed = state.completedDeductions.includes(id);
      return {
        id, name, desc, completed, thought: state.deductionThoughts?.[id] ?? null,
        ...(completed ? { observation: experiments[id]?.outcome } : {}),
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
  advance(state, rules.exploreDays);
  const exposed = !settlementOf(data, state.region)?.inn || records.sites[id]?.exposed;
  if (exposed) state.pressure += rules.explorePressure;
  state.event = id;
  const known = state.eventsSeen[state.region] ?? [];
  if (!known.includes(id)) state.eventsSeen[state.region] = [...known, id];
  const first = !state.explored.includes(state.region);
  if (first) {
    state.explored.push(state.region);
    state.insight += rules.firstRegionInsight;
  }
  const protection = fogProtection(state);
  const tolerance = rules.pressureThreshold + (protection?.field.fogTolerance ?? 0);
  const pressurized = exposed && state.pressure > rules.pressureThreshold && state.qi > 0;
  const burdened = pressurized && state.pressure > tolerance;
  if (burdened) state.qi = Math.max(0, state.qi - rules.pressureQi);
  const fog = burdened ? `在雾里走久了，真气−${rules.pressureQi}。`
    : pressurized ? `${nameOf(protection.id)}微热，胸口逼来的雾气散了些。` : '';
  return say(state, `在${region.name}遇上${records.events[id].name}。${first ? `初探此地，见识+${rules.firstRegionInsight}。` : ''}${fog}`);
}

function startCombat(state, id, siteId, openingRange = false) {
  const enemy = records.enemies[id];
  if (siteId) {
    const witnesses = ((state.siteWitnesses ??= {})[siteId] ??= []);
    if (!witnesses.includes(id)) witnesses.push(id);
  }
  state.combat = { id, siteId, hp: enemy.hp, round: 0, escapeBonus: 0, openingRange };
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
    observedHits: fight.observedHits ?? [], medicineLeft: fight.medicineLeft };
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
      state.coins += coins;
    }
    for (const [id, amount] of collected) {
      const yieldPerBatch = choice.loot[id];
      const portion = Math.min(yieldPerBatch, amount - batch * yieldPerBatch);
      if (portion > 0) {
        spendPool(state, site, 'stocks', stockKeys.get(id), portion);
        gathered[id] = (gathered[id] ?? 0) + portion;
      }
    }
    advance(state, choice.days);
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
      }
    }
  } else if (!continuesHere && !stocks.length && !Object.keys(spilled).length) {
    state.event = null;
  }
  const loot = goodsText(accepted);
  const ambushText = ambush ? ambush.outcome ?? '你正在采集，有东西忽然扑了过来。' : null;
  const outcome = ambushText ?? choice.outcome;
  const protectedFromInjury = completedBatches > 0 && padding > 0 && `${nameOf(gatherArmor.id)}卸掉了一些力道。`;
  const detail = [completedBatches > 0 && choice.outcome, interrupted && '看守又回来了，你收手退到外面。', gatheredGoods && `采得${gatheredGoods}，留在脚边。`,
    toolMessage, protectedFromInjury, ambushText, loot && `获得${loot}。`,
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
  state.event = siteId ?? null;
  state.combat = null;
  state.focus = 0;
  state.hp = Math.max(1, Math.floor(stats(state).maxHp * 0.25));
  advance(state, 0.5);
  const tournament = tournamentResolution(state, combat, false);
  if (tournament) state.event = null;
  else if (siteId) state.world.recovery[`${siteId}:${enemy.id}`] = state.day + 0.5;
  return say(state, `${enemy.name}在最后一式收手。你坐到场边歇过半日，这场试招输了。${tournament}`);
}

function fall(state, place = groundPlace(state)) {
  const enemy = enemyOf(state);
  if (inProtectedBout(state)) return endSparring(state, enemy);
  saveHuntTrack(state);
  const coinsLost = Math.min(rules.fallMaxCoinLoss, Math.ceil(state.coins * rules.fallCoinLossFactor));
  const lostGoods = Object.fromEntries(Object.entries(state.expeditionLoot)
    .map(([id, count]) => [id, Math.min(owns(state, id), count)])
    .filter(([id, count]) => count > 0 && records.items[id]?.kind !== 'key' && !records.items[id]?.keepOnFall));
  leaveOnGround(state, lostGoods, state.durability, place);
  const dropped = goodsText(lostGoods);
  const placeName = records.sites[place]?.name ?? regionOf(state).name;
  for (const [id, count] of Object.entries(lostGoods)) removeItem(state, id, count);
  state.expeditionLoot = {};
  state.coins -= coinsLost;
  state.region = rescueSettlement(state, economyKit);
  state.event = null;
  state.gathering = null;
  state.combat = null;
  state.pressure = 0;
  state.focus = 0;
  state.toxin = 0;
  state.wounds = Math.min(rules.maxWounds, state.wounds + rules.fallWounds);
  advance(state, rules.fallDays);
  state.hp = Math.ceil(stats(state).maxHp * rules.fallHpFactor);
  state.qi = Math.min(rules.fallQi, stats(state).maxQi);
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
  const site = records.sites[combat.siteId];
  const protectedBout = inProtectedBout(state);
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
  return {
    message: `${protectedBout ? '试招中胜过' : '击退'}${enemy.name}。${loot ? `脚边留下${loot}。` : ''}${insight ? `见识+${insight}。` : ''}${worthy ? '经过这一战，运气又熟了一分。' : ''}${tournament}${hazard}`,
    ...(loot ? { gathered, gatheredRegion: state.region, gatheredSite: site?.id } : {}),
  };
}

function attackingIntent(intent) {
  return ['attack', 'heavy', 'drain'].includes(intent.kind);
}

function estimatedHit(state, enemy, intent) {
  if (!attackingIntent(intent)) return 0;
  const extra = state.combat.enemyCharged ? Math.ceil(enemy.atk * rules.enemyChargeFactor) : 0;
  return Math.ceil(enemy.atk * (intent.mult ?? 1)) + extra;
}

function breathingQi(state) {
  return Math.min(rules.guardQiRecovery, Math.max(0, stats(state).maxQi - state.qi));
}

function retreatRisk(state, enemy, intent, bonus = 0, guard = 0) {
  const { defense, retreat: retreatBonus } = stats(state);
  const training = trainingPerks(state, enemy, intent);
  const reduction = clamp(retreatBonus + (state.combat.escapeBonus ?? 0) + bonus, 0, 1);
  const damage = Math.max(0, Math.ceil(estimatedHit(state, enemy, intent) * rules.retreatDamageFactor * (1 - reduction))
    - defense - guard - training.guard);
  return { damage, wouldFall: damage > 0 && damage >= state.hp, retreatBonus };
}

function crossRealmFactor(state, enemy) {
  return data.realms
    .filter(({ id }) => id > state.realm && id <= enemy.tier)
    .reduce((factor, realm) => factor * (realm.pressure ?? 1), 1);
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

function weaponView(state) {
  const { weapon, compatible, ammo } = weaponLoadout(state);
  const meleeAlternative = data.gear.find(({ id, slot, ammo: needs, tier }) =>
    slot === 'weapon' && !needs?.length && id !== weapon?.id && tier <= state.realm && owns(state, id) > 0 && state.durability[id] > 0);
  return {
    id: weapon?.id ?? null,
    name: weapon ? nameOf(weapon.id) : '徒手',
    weaponClass: weapon?.weaponClass ?? (weapon ? 'melee' : 'unarmed'),
    chargeRequired: Boolean(weapon?.chargeRequired),
    needsAmmo: compatible.length > 0,
    isLoaded: !compatible.length || Boolean(ammo),
    selectedAmmo: ammo?.id ?? null,
    ammo: compatible.map((id) => ({ id, name: nameOf(id), count: owns(state, id), selected: id === ammo?.id })),
    meleeAlternative: meleeAlternative ? { id: meleeAlternative.id, name: nameOf(meleeAlternative.id) } : null,
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
  const effects = { damage: 0, pierce: 0, guard: 0, reflect: 0, dodge: 0 };
  for (const trait of traits) {
    if (!trait || (trait.enemyTag && !enemy.tags?.includes(trait.enemyTag)) ||
        (trait.intent && trait.intent !== intent.kind) || !Object.hasOwn(effects, trait.kind)) continue;
    effects[trait.kind] += trait.bonus;
  }
  return effects;
}

function combatEffects(state, enemy, intent, move) {
  const { damage = 0, pierce = 0, brace = false, wearWeapon = false, hungerAffected = wearWeapon, ammo } = move;
  const { defense, attack: force } = stats(state);
  const heavyBrace = brace && intent.kind === 'heavy';
  const counter = heavyBrace ? rules.guardCounter : 0;
  const guard = (move.guard ?? 0) + (brace ? rules.guardBonus + (heavyBrace ? rules.heavyGuardBonus : 0) : 0);
  const interrupt = ['heavy', 'heal', 'focus'].includes(intent.kind) ? move.interrupt ?? 0 : 0;
  const charge = move.chargeable && damage > 0 && state.combat.playerCharged
    ? Math.max(rules.combatChargeFloor, Math.ceil((move.chargeBase ?? force) * rules.combatChargeFactor)) : 0;
  const training = trainingPerks(state, enemy, intent);
  const traits = combatTraits([
    ...activeGear(state).flatMap(({ trait, traits = [] }) => [trait, ...traits]), ammo?.trait, ...(ammo?.traits ?? []),
  ], enemy, intent);
  const weaponDamageBonus = wearWeapon ? traits.damage : 0;
  const weaponPierceBonus = wearWeapon ? traits.pierce : 0;
  const armor = intent.kind === 'guard'
    ? Math.max(enemy.def + rules.enemyGuardBonus, Math.ceil(enemy.def * (intent.mult ?? 1)))
    : enemy.def;
  const hunger = hungerAffected && state.satiety === 0 ? rules.emptyAttackMultiplier : 1;
  const effectiveDamage = Math.floor((damage + charge + weaponDamageBonus + training.damage + (ammo?.atk ?? 0)) * hunger * crossRealmFactor(state, enemy));
  const dealt = damage > 0
    ? Math.max(rules.minAttackDamage, effectiveDamage - Math.max(0, armor - pierce - weaponPierceBonus - training.pierce - (ammo?.pierce ?? 0))) : 0;
  const hit = Boolean(ammo && dealt > 0 && canInterceptOpening(state, intent));
  const incoming = hit || !attackingIntent(intent) ? 0
    : Math.max(0, estimatedHit(state, enemy, intent) - defense - guard - traits.guard - training.guard - interrupt);
  const shield = heavyBrace && incoming > 0 ? activeGear(state).find(({ slot, brace }) => slot === 'offhand' && brace) : null;
  const received = Math.max(0, incoming - (shield?.brace ?? 0));
  const qiToPlayer = intent.kind === 'drain' ? Math.min(state.qi, received) : 0;
  const damageToPlayer = received - qiToPlayer;
  const healing = intent.kind === 'heal' ? Math.max(0, Math.ceil(enemy.atk * (intent.mult ?? 1)) - interrupt) : 0;
  const reflect = damageToPlayer > 0 && damageToPlayer < state.hp && !intent.ranged &&
    (intent.kind === 'attack' || intent.kind === 'heavy') ? traits.reflect : 0;
  const dodge = damageToPlayer > 0 && intent.kind === 'attack' && !intent.ranged ? Math.min(rules.combatDodgeCap, traits.dodge) : 0;
  return { dealt, counter, hit, charge, interrupt, shield, reflect, dodge, healing, qiToPlayer, damageToPlayer };
}

function evaded(state, chance) {
  if (!chance) return false;
  const seed = state.evadeSeed ?? ((state.combatSeed ^ 0x85ebca6b) >>> 0);
  state.evadeSeed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return state.evadeSeed / 0x100000000 < chance;
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
  const { kind = 'recover', brace, wearWeapon, ammo, message } = move;
  const intent = respondToMove(state, enemy, kind);
  const result = combatEffects(state, enemy, intent, move);
  const { dealt, counter, hit, charge, interrupt, shield, reflect, dodge, healing, qiToPlayer, damageToPlayer } = result;
  const healthBefore = state.hp;
  const enemyMove = { name: intent.name, kind: intent.kind };
  const read = state.combat.plan.reader === 'enemy' ? `${enemy.name}看破了你的起手。` : '';
  delete state.combat.spiritGuard;
  let damageDealt = Math.min(state.combat.hp, dealt + counter);
  let reflectedDamage = 0;
  if (dealt > 0) {
    const landed = { damage: Math.min(state.combat.hp, dealt), guarded: intent.kind === 'guard' };
    const observed = (state.combat.observedHits ??= []);
    observed.push(landed);
    if (observed.length > rules.observedHitLimit) observed.shift();
  }
  state.combat.hp -= dealt + counter;
  if (charge) state.combat.playerCharged = false;
  if (kind === 'focus') state.combat.playerCharged = true;
  const recovered = brace && intent.kind === 'guard' ? breathingQi(state) : 0;
  state.qi += recovered;
  advance(state, rules.battleDays);
  const weaponDamage = wearWeapon ? wear(state, 'weapon') : move.wearSlot ? wear(state, move.wearSlot) : '';
  if (ammo) removeItem(state, ammo.id, 1);
  const playerMove = brace ? counter ? '你挡住重招，趁对手还没收招打了回去。'
    : recovered ? `你趁对手守势回了${recovered}点真气。` : '你收回手，挡在身前。' : message;
  let summary = `${read}${playerMove}${charge ? '你将蓄好的劲送了出去。' : ''}${ammo ? `用掉一枚${nameOf(ammo.id)}。` : ''}${damageDealt ? `造成${damageDealt}点伤害。` : ''}${weaponDamage}`;
  if (state.combat.hp <= 0) {
    if (counter) summary += `「${intent.name}」被你截住了。`;
    return combatVictory(state, enemy, summary, { damageDealt, damageTaken: 0, ...(counter ? { enemyMove } : {}) });
  }
  summary += intent.kind === 'remedy' ? `${enemy.name}${intent.name}。` : `${enemy.name}使出「${intent.name}」。`;
  if (attackingIntent(intent)) state.combat.enemyCharged = false;
  const dodged = evaded(state, dodge);
  if (hit) {
    summary += `这一箭拦住了${enemy.name}的冲势。`;
  } else if (dodged) {
    summary += '你错开半步，这一招落了空。' + wear(state, 'boots');
  } else if (intent.kind === 'heal') {
    const before = state.combat.hp;
    state.combat.hp = Math.min(enemy.hp, before + healing);
    const restored = state.combat.hp - before;
    summary += interrupt && !restored ? `${enemy.name}调息被打断。`
      : `${enemy.name}${interrupt ? '调息受阻，只' : ''}恢复了${restored}点生命。`;
  } else if (intent.kind === 'remedy') {
    const dose = enemyMedicine(state);
    state.combat.medicineLeft = dose.left - 1;
    const restored = Math.min(enemy.hp - state.combat.hp, dose.hp);
    state.combat.hp += restored;
    summary += `气血回了${restored}点。`;
  } else if (intent.kind === 'guard') {
    summary += `${enemy.name}稳住了架势。`;
  } else if (intent.kind === 'focus') {
    state.combat.enemyCharged = dealt < rules.chargeBreakDamage && !interrupt;
    summary += state.combat.enemyCharged ? '它的下一记出招会更重。' : '蓄势被你打断了。';
  } else {
    if (shield) summary += nameOf(shield.id) + '卸掉了一股冲力。' + wear(state, 'offhand');
    state.qi -= qiToPlayer;
    state.hp -= damageToPlayer;
    const armorDamage = damageToPlayer ? wear(state, 'armor') : '';
    if (intent.kind === 'drain') {
      summary += `${enemy.name}抽走你${qiToPlayer}点真气${damageToPlayer ? `，另造成${damageToPlayer}点伤害` : ''}。${armorDamage}`;
    } else {
      summary += damageToPlayer ? `你受了${damageToPlayer}点伤。${armorDamage}` : '你挡下了这一招。';
    }
    if (state.combat.playerCharged && damageToPlayer >= rules.chargeBreakDamage) {
      state.combat.playerCharged = false;
      summary += '你蓄着的劲被打散了。';
    }
    if (reflect > 0) {
      reflectedDamage = Math.min(state.combat.hp, reflect);
      state.combat.hp -= reflectedDamage;
      damageDealt += reflectedDamage;
      summary += `护具把来劲弹了回去，造成${reflectedDamage}点反伤。`;
    }
  }
  if (state.combat.hp <= 0) return combatVictory(state, enemy, summary, { damageDealt, damageTaken: healthBefore - state.hp, enemyMove, reflectedDamage });
  state.combat.lastEnemyIntent = enemyMove;
  state.combat.round += 1;
  normalize(state);
  const damageTaken = Math.max(0, healthBefore - state.hp);
  say(state, summary);
  const fell = state.hp === 0 ? fall(state) : null;
  return { ...fell, ok: true, message: summary + (fell?.message ?? ''), damageDealt, damageTaken, enemyMove, reflectedDamage, dodged };
}

function retreat(state, bonus = 0, lead = '', guard = 0) {
  if (state.combat?.tournament === tournamentData.id) return tournamentAction(state, 'tournamentWithdraw', economyKit);
  const enemy = enemyOf(state);
  if (inProtectedBout(state)) {
    advance(state, rules.retreatDays);
    state.combat = null;
    state.focus = 0;
    return { ...say(state, `${lead}你退后一步，${enemy.name}也收了招。这场切磋到此为止。`), damageDealt: 0, damageTaken: 0 };
  }
  const intent = respondToMove(state, enemy, 'retreat');
  const { damage: received, retreatBonus } = retreatRisk(state, enemy, intent, bonus, guard);
  advance(state, rules.retreatDays);
  const charmDamage = retreatBonus > 0 ? wear(state, 'charm') : '';
  const armorDamage = received ? wear(state, 'armor') : '';
  const healthBefore = state.hp;
  state.hp -= received;
  normalize(state);
  const damageTaken = Math.max(0, healthBefore - state.hp);
  const outerEdge = state.combat.huntChoice !== undefined ? state.combat.siteId : null;
  const position = outerEdge ? '退回了这处猎场的外沿' : `仍在${regionOf(state).name}`;
  const reaction = attackingIntent(intent) ? `${enemy.name}以「${intent.name}」追来。` : '';
  const summary = `${lead}${reaction}你退出了与${enemy.name}的交手，${position}。${received ? `脱身时受了${received}点伤。` : ''}${charmDamage}${armorDamage}`;
  say(state, summary);
  if (state.hp === 0) {
    const fell = fall(state);
    return { ...fell, message: summary + fell.message, damageDealt: 0, damageTaken };
  }
  if (outerEdge) {
    saveHuntTrack(state);
    state.event = outerEdge;
  }
  state.combat = null;
  return { ok: true, message: summary, damageDealt: 0, damageTaken };
}

function cast(state, id) {
  const art = records.arts[id];
  if (!art || !state.knownArts.includes(id)) return refuse('你还没学会这门术。');
  if (art.tier > state.realm) return refuse('这门术需要更高境界。');
  const cost = art.cost ?? 0;
  if (state.qi < cost) return refuse('真气不足。');
  const { weapon, compatible, ammo } = weaponLoadout(state);
  const weaponBased = art.weaponBased !== false;
  if (weaponBased && compatible.length && !ammo) return refuse('这门术要借兵器出手，先备上弹药。');
  if (weaponBased && weapon?.chargeRequired && !state.combat.playerCharged) return refuse('这件兵器得先蓄势。');
  state.qi -= cost;
  const focus = state.focus >= 1 ? 1 : 0;
  state.focus -= focus;
  return combatTurn(state, {
    kind: 'strike', chargeable: true,
    damage: stats(state).attack - (weaponBased ? 0 : weapon?.atk ?? 0) + (art.power ?? 0) + focus * rules.focusDamage,
    pierce: (art.pierce ?? 0) + (weaponBased && state.combat.playerCharged ? weapon?.chargePierce ?? 0 : 0),
    guard: art.guard,
    interrupt: art.break,
    wearWeapon: weaponBased && Boolean(weapon),
    hungerAffected: weaponBased,
    ammo: weaponBased ? ammo : null,
    message: `你使出${art.name}。`,
  });
}

function attack(state) {
  const { weapon, compatible, ammo } = weaponLoadout(state);
  const unarmed = !weapon || (compatible.length > 0 && !ammo);
  if (!unarmed && weapon.chargeRequired && !state.combat.playerCharged) return refuse('这件兵器得先蓄势。');
  return combatTurn(state, {
    kind: 'strike', chargeable: true,
    damage: stats(state).attack - (unarmed ? weapon?.atk ?? 0 : 0),
    pierce: !unarmed && state.combat.playerCharged ? weapon.chargePierce : 0,
    wearWeapon: !unarmed,
    hungerAffected: true,
    ammo,
    message: unarmed ? '你空手出招。' : '你抢先出手。',
  });
}

function offhandAttack(state) {
  const side = sideWeapon(state);
  if (!side) return refuse('手边没有可出招的副兵器。');
  if (side.chargeRequired && !state.combat.playerCharged) return refuse('这件副兵器得先蓄势。');
  const { weapon } = weaponLoadout(state);
  const damage = stats(state).attack - (weapon?.atk ?? 0) + side.sideAtk;
  return combatTurn(state, {
    kind: 'strike', chargeable: true, hungerAffected: true, wearSlot: 'offhand',
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

function eat(state, inCombat, id = supply, batch = false) {
  if (id === 'beast_meat' && owns(state, id)) return refuse('肉还生着。带回村用灶煮熟就能吃。');
  const food = records.foods[id];
  if (!food || !owns(state, id)) return refuse('没有这份可吃的口粮。');
  if (state.satiety >= rules.maxSatiety && state.hp >= stats(state).maxHp) return refuse('你还很饱，气血也足。');
  const count = batch ? batchMealCount(state, id) : 1;
  if (batch && count < 2) return refuse('眼下不必连吃。');
  removeItem(state, id, count);
  state.didEat = true;
  const before = state.hp;
  const initialSatiety = state.satiety;
  state.satiety = Math.min(rules.maxSatiety, state.satiety + food.satiety * count);
  state.hp += food.hp * count;
  normalize(state);
  const satietyRestored = state.satiety - initialSatiety;
  const recovered = [satietyRestored && `饱腹+${satietyRestored}`, state.hp > before && `气血+${state.hp - before}`].filter(Boolean);
  const message = `你吃下${count > 1 ? `${count}份` : ''}${nameOf(id)}。${recovered.length ? `${recovered.join('，')}。` : ''}`;
  return inCombat ? combatTurn(state, { message }) : say(state, message);
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

function use(state, id, inCombat) {
  if (records.foods[id] || id === 'beast_meat') return eat(state, inCombat, id);
  if (!owns(state, id)) return refuse('行囊里没有这件物品。');
  if (records.items[id]?.breakthrough) return refuse(`${nameOf(id)}要在闭关突破时服下。`);
  const pill = records.pills[id];
  const talisman = records.talismans[id];
  const entry = pill ?? talisman;
  if (!entry) return refuse('这件物品不能直接使用。');
  if (entry.tier > state.realm) return refuse('你目前承受不了这件物品的效力。');
  if (talisman && !inCombat) return refuse('这道符要在战斗中用。');
  if (pill?.satiety && state.satiety >= rules.maxSatiety) return refuse('你还很饱。');
  removeItem(state, id, 1);
  if (pill) {
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
    const toxic = state.toxin >= rules.toxinThreshold;
    const toxinDamage = toxic ? Math.max(0, Math.min(state.hp - 1, rules.toxinDamage)) : 0;
    state.hp -= toxinDamage;
    const applied = id === 'salve' ? '你把松脂膏敷在伤口上。' : `你服下${nameOf(id)}。`;
    const message = applied + (toxinDamage ? `丹毒积重，损失${toxinDamage}点生命。` : '');
    const result = inCombat ? combatTurn(state, { message }) : say(state, message);
    return {
      ...result,
      injury: toxinDamage ? { cause: '丹毒发作。', amount: toxinDamage } : undefined,
    };
  }
  const message = `你催动${nameOf(id)}。`;
  const training = trainingPerks(state);
  const guard = talisman.guard > 0 ? talisman.guard + training.sealGuard : 0;
  if (talisman.retreat > 0 && !talisman.damage) return retreat(state, talisman.retreat, message, guard);
  state.combat.escapeBonus += talisman.retreat ?? 0;
  return combatTurn(state, {
    kind: talisman.damage > 0 ? 'strike' : 'brace',
    damage: talisman.damage > 0 ? talisman.damage + training.sealDamage : 0,
    pierce: Infinity,
    guard,
    message,
  });
}

export function handConflict(equipment, id) {
  const gear = records.gear[id];
  if (gear?.hands === 2 && equipment.offhand) return '先卸下副手装备。';
  if (gear?.slot === 'offhand' && records.gear[equipment.weapon]?.hands === 2) return '先收起双手兵刃。';
  return '';
}

function equip(state, id, inCombat = false) {
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (inCombat && gear.slot !== 'weapon') return refuse('交手时只能换兵器。');
  if (state.realm < gear.tier) return refuse('这件装备需要更高境界。');
  if (!state.durability[id]) return refuse('这件装备需要先修理。');
  if (state.equipment[gear.slot] === id) return refuse('你已经穿戴了这件装备。');
  const conflict = handConflict(state.equipment, id);
  if (conflict) return refuse(conflict);
  state.equipment[gear.slot] = id;
  normalize(state);
  const message = `换上${nameOf(id)}。`;
  return inCombat ? combatTurn(state, { kind: 'switch', guard: rules.combatSwitchGuard, message }) : say(state, message);
}

function unequip(state, slot) {
  if (!slots.includes(slot) || !state.equipment[slot]) return refuse('这个位置没有装备。');
  if (backpackSlots(state) >= backpackCapacity(state, rules.backpackCapacity)) return refuse('行囊已满，收不下这件装备。');
  const id = state.equipment[slot];
  state.equipment[slot] = null;
  normalize(state);
  return say(state, `收起${nameOf(id)}。`);
}

function discard(state, id, count = owns(state, id)) {
  if (!records.items[id] || !Number.isInteger(count) || count < 1 || count > owns(state, id)) return refuse('行囊里没有这件东西。');
  if (isEvidence(records.items[id])) return refuse('随身信物不能放到地上。');
  if (!occupiesBackpack(state, id)) return refuse('先把装备收下。');
  if (id === supply && owns(state, id) - state.reliefRations < count) return refuse('村里匀给你的口粮只供自用。');
  leaveOnGround(state, { [id]: count }, state.durability);
  removeItem(state, id, count, false);
  return say(state, `把${nameOf(id)}放到地上。`);
}

function takeFromGround(state, id, requested) {
  const ground = groundAt(state);
  const available = ground[id] ?? 0;
  if (!records.items[id] || available < 1 || (requested !== undefined &&
      (!Number.isSafeInteger(requested) || requested < 1 || requested > available))) return refuse('这里没有这么多东西可捡。');
  const gear = records.gear[id];
  if (gear && gearReserved(state, id)) return refuse('同名装备已在手上、仓里或锻炉里。');
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

function recoverySessions(state) {
  const { maxHp, maxQi } = stats(state);
  const unwoundedHp = maxHp + state.wounds * rules.woundPenalty;
  return Math.max(
    Math.ceil((unwoundedHp - state.hp) / rules.restHp),
    Math.ceil((maxQi - state.qi) / (rules.restQi + trainingPerks(state).restQi)),
    Math.ceil(state.wounds / rules.restWounds), Math.ceil(state.toxin / rules.restToxin),
    state.pressure || needsSenseRest(state) ? 1 : 0,
  );
}

function applyHalfDayRest(state) {
  advance(state, rules.restDays);
  state.wounds -= rules.restWounds;
  state.toxin -= rules.restToxin;
  state.pressure = 0;
  state.hp += rules.restHp;
  state.qi += rules.restQi + trainingPerks(state).restQi;
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

function learn(state, id) {
  const art = records.arts[id];
  if (!art) return refuse('坊市没有这部术诀。');
  if (art.prizeOnly && !state.knownArts.includes(id)) return refuse('这门术要找会用它的人当面教。');
  if (!isRevealed(state, art.reveal)) return refuse('你还没有这门术的传承线索。');
  if (state.knownArts.includes(id)) return refuse('你已经掌握了这门术。');
  if (art.tier > state.realm) return refuse('这门术需要更高境界。');
  const price = art.price ?? 0;
  if (state.coins < price) return refuse(`学这门术需要${price}枚灵钱。`);
  state.coins -= price;
  state.knownArts.push(id);
  return say(state, `学会${art.name}。`);
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

function hasRoom(state, loot, spent) {
  return !Object.keys(fittingItems(state, loot, spent).spilled).length;
}

function gearReserved(state, id) {
  return owns(state, id) || state.economy.warehouse[id] || state.economy.jobs.some(({ loot }) => loot[id]);
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
  return say(state, '工匠拎起兽革，顺着纹路拽了拽。「两片够衬一件褂子。再攒一片，配松木和炉里的铁箍，还能包一面小盾。」');
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
  if (!hasRoom(state, { [item.id]: count })) return '行囊已满。';
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
      const blockedReason = purchaseBlocker(state, item, 1, stock);
      let maximum = blockedReason ? 0 : Math.min(rules.maxTradeCount, stock ?? Infinity, Math.floor(state.coins / item.price));
      if (records.gear[item.id] && maximum) maximum = 1;
      while (maximum > 1 && !hasRoom(state, { [item.id]: maximum })) maximum--;
      return { id: offer.id, price: item.price, stock, maximum, canBuy: !blockedReason, blockedReason };
    }),
  })).filter(({ offers }) => offers.length);
  const sales = data.items.filter(({ id, sell }) => sell > 0 && owns(state, id)).map(({ id, sell }) => {
    const { count, blockedReason } = saleTerms(state, id);
    return { id, ...saleQuote(state, id, sell), count, canSell: !blockedReason, blockedReason };
  });
  return { stalls, sales };
}

function trade(state, id, count, buying, stallId) {
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
    const { blockedReason } = saleTerms(state, id, count);
    if (blockedReason) return refuse(blockedReason);
    const quote = saleQuote(state, id, price);
    total = saleTotal(quote, count);
    removeItem(state, id, count, false);
    state.coins += total;
    recordSale(state, id, count, quote);
  }
  return { ...say(state, `${buying ? '买入' : '卖出'}${item.name}×${count}，${total}枚灵钱。${merchantMessage}`), merchantMessage };
}

function repairServiceView(state) {
  const service = settlementOf(data, state.region)?.repair;
  if (!service) return null;
  return {
    ...service,
    prices: Object.fromEntries(resourceEntries(state.inventory).filter(([id]) => records.gear[id])
      .map(([id]) => [id, repairPrice(records.gear[id], service)])),
  };
}

function repairPrice(gear, service) {
  return (gear.repair ?? 1) + service.surcharge;
}

function repair(state, id) {
  const service = settlementOf(data, state.region)?.repair;
  if (!service) return refuse('这里没有接活的修具匠。');
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (state.durability[id] >= gear.durability) return refuse('这件装备已经完好。');
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
  return hasRoom(state, quest.reward, homeBagSpend(state, quest.need)) ? '' : '行囊已满，放不下回礼。';
}

function handin(state, id) {
  const quest = records.quests[id];
  if (!quest || (quest.region ?? hub) !== state.region || !knowsQuest(state, quest)) return refuse('这里找不到这份委托。');
  if (state.completedQuests.includes(id)) return refuse('这份委托已经交付。');
  const reason = questBlocker(state, quest);
  if (reason) return refuse(reason);
  spendHome(state, 0, quest.need);
  addItems(state, quest.reward);
  state.coins += quest.coins ?? 0;
  state.insight += quest.insight ?? 0;
  state.completedQuests.push(id);
  for (const id of quest.learnArts ?? []) {
    if (!state.knownArts.includes(id)) state.knownArts.push(id);
  }
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

function deduce(state, { id, evidence, hypothesis }) {
  const deduction = records.deductions[id];
  if (!deduction || !knowsDeduction(state, deduction)) return refuse('你还没遇到这个疑点。');
  if (state.completedDeductions.includes(id)) return refuse('这桩疑案已经在现场验过了。');
  const text = typeof hypothesis === 'string' ? hypothesis.trim() : '';
  if (!text || text.length > hypothesisLimit || !Array.isArray(evidence)) {
    return refuse(`请写下自己的猜想，最多${hypothesisLimit}字。`);
  }
  const selected = [...new Set(evidence)];
  if (selected.some((itemId) => typeof itemId !== 'string' || !isEvidence(records.items[itemId]) || !owns(state, itemId))) {
    return refuse('只能摆上随身可查的证物。');
  }
  (state.deductionThoughts ??= {})[id] = { hypothesis: text, evidence: selected };
  return { ...say(state, '猜想已摆在沙盘上。'), deduction: 'pinned' };
}

function tryExperiment(state, { id, settings }) {
  const trial = availableExperiment(state, records.events[state.event]);
  if (!trial || trial.id !== id) return refuse('这里还缺验证这个猜想的条件。');
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
  for (const art of trial.learnArts ?? []) {
    if (!state.knownArts.includes(art)) state.knownArts.push(art);
  }
  const { spilled } = addItems(state, trial.reward, true);
  return { ...say(state, trial.outcome), deduction: 'verified', spilled };
}

const economyKit = {
  data, records, rules, owns, atHome, resourceEntries, say, refuse, advance, addItems, removeItem, startCombat, readableIntent,
  missingItems, payItems, hasRoom, backpackSlots, leaveOnGround, groundAt, nameOf, goodsText, normalize,
  isEvidence, knowsRecipe, homeSupplies, homeRequirements, spendHome, homeBagSpend, homeBagAvailable, gearReserved, mechanismFailure, roadProtection,
  eatOnRoad: (state, id) => eat(state, false, id),
};

function canUseVillageAction(state, action, payload) {
  if (action === 'rest' || action === 'restUntilRecovered') return settlementOf(data, state.region)?.inn;
  if (action === 'repair') return Boolean(settlementOf(data, state.region)?.repair);
  if (atHome(state)) return true;
  if (!isSettlement(state)) return false;
  return action === 'breakthrough' || action === 'research' || action === 'handin' ||
    (action === 'craft' && records.recipes[payload.id]?.result === 'gate_scroll');
}

const villageActions = {
  rest: (state) => rest(state),
  restUntilRecovered: (state) => rest(state, true),
  learn: (state, { id }) => learn(state, id),
  research: (state) => research(state),
  breakthrough: (state) => breakthrough(state),
  craft: (state, { id }) => craft(state, id),
  showHideToSmith,
  buy: (state, { id, count = 1, stallId }) => trade(state, id, count, true, stallId),
  sell: (state, { id, count = 1 }) => trade(state, id, count, false),
  repair: (state, { id }) => repair(state, id),
  handin: (state, { id }) => handin(state, id),
};

const serviceForAction = {
  learn: 'cultivate', research: 'cultivate', breakthrough: 'cultivate',
  craft: 'workshop', showHideToSmith: 'workshop', buy: 'market', sell: 'market', handin: 'quests',
};

const generalActions = {
  travel: (state, { id }) => travel(state, id),
  visit: (state, { id }) => visit(state, id),
  revisit: (state, { id }) => revisit(state, id),
  wait,
  eat: (state, { id }) => eat(state, false, id || supply),
  batchEat: (state, { id }) => eat(state, false, id || supply, true),
  inspectBasket,
  unpackBasket,
  use: (state, { id }) => use(state, id, false),
  equip: (state, { id }) => equip(state, id),
  unequip: (state, { slot }) => unequip(state, slot),
  discard: (state, { id, count }) => discard(state, id, count),
  take: (state, { id, count }) => takeFromGround(state, id, count),
  selectAmmo: (state, { id }) => selectAmmo(state, id),
  deduce,
};

const combatActions = {
  attack,
  offhandAttack,
  tournamentWithdraw: (state) => tournamentAction(state, 'tournamentWithdraw', economyKit),
  readSpirit: (state) => recordTrainingRead(state, economyKit),
  selectAmmo: (state, { id }) => selectAmmo(state, id),
  combatEquip: (state, { id }) => equip(state, id, true),
  guard: (state) => combatTurn(state, { kind: 'brace', brace: true }),
  focus: (state) => state.combat.playerCharged ? refuse('你已经蓄好劲了。')
    : combatTurn(state, { kind: 'focus', message: '你沉肩蓄力。' }),
  art: (state, { id }) => cast(state, id),
  use: (state, { id }) => use(state, id, true),
  eat: (state, { id }) => eat(state, true, id || supply),
  retreat: (state) => retreat(state),
};

function takeTurn(state, action, payload) {
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
    if (Object.hasOwn(combatActions, action)) return combatActions[action](state, payload);
    return refuse('先处理眼前的对手。');
  }
  if (action === 'gateScroll') return worldAction(state, action, payload, economyKit);
  const tournament = tournamentAction(state, action, economyKit);
  if (tournament) return tournament;
  if (state.event) {
    const mechanism = mechanismAction(state, action, payload, economyKit);
    if (mechanism) return mechanism;
    if (action === 'eat') return eat(state, false, payload.id || supply);
    if (action === 'batchEat') return eat(state, false, payload.id || supply, true);
    if (action === 'use') return use(state, payload.id, false);
    if (action === 'equip') return equip(state, payload.id);
    if (action === 'unequip') return unequip(state, payload.slot);
    if (action === 'inspectBasket') return inspectBasket(state);
    if (action === 'unpackBasket') return unpackBasket(state);
    if (action === 'selectAmmo') return selectAmmo(state, payload.id);
    if (action === 'take') return takeFromGround(state, payload.id, payload.count);
    if (action === 'discard') return discard(state, payload.id, payload.count);
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
  prepareCombatRound(state);
  const result = takeTurn(state, action, payload);
  if (result.ok) {
    prepareCombatRound(state);
    refreshDiscovery(state);
  }
  return result;
}
