import * as moduleData from './data.mjs';
import { initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo } from './economy.mjs';
import { initialAlchemyState, alchemyView, alchemyAction } from './alchemy.mjs';
import { alwaysKnownRegion, learnAdjacentRegions, settlementOf, initialWorld, worldView, worldAction, travelRoad, rescueSettlement } from './world.mjs';
import { initialTraining, trainingStats, trainingPerks, restoreTrainingSense, needsSenseRest, trainingView, trainingAction, recordTrainingRead } from './training.mjs';
import { initialMechanisms, mechanismView, mechanismAction } from './mechanisms.mjs';
import { tournamentData, initialTournament, tournamentView, tournamentAction, tournamentResolution } from './tournament.mjs';

const data = { ...moduleData.default, ...moduleData };

const records = Object.fromEntries(
  ['realms', 'items', 'gear', 'foods', 'pills', 'talismans', 'arts', 'recipes', 'regions', 'events', 'enemies', 'quests', 'deductions', 'sites', 'ammunition']
    .map((key) => [key, Object.assign(Object.create(null), Object.fromEntries((data[key] ?? []).map((entry) => [entry.id, entry])))]),
);
const experiments = Object.fromEntries(data.events.filter(({ experiment }) => experiment).map(({ experiment }) => [experiment.id, experiment]));
const supply = 'ration';
const hub = 'village';
const slots = ['weapon', 'armor', 'charm'];
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
  harvestEncounterDays: 0.125,
  retreatDays: 0.25,
  retreatDamageFactor: 0.5,
  emptyReturnDays: 0.25,
  waitDays: 0.5,
  maxSatiety: 100,
  satietyDrainPerDay: 16,
  rationSatiety: records.foods.ration.satiety,
  emptyAttackMultiplier: 0.75,
  unpackBasketDays: 0.25,
  guardBonus: 3,
  heavyGuardBonus: 4,
  guardCounter: 3,
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

function advance(state, days) {
  const elapsed = days ?? 0;
  state.day = Math.round((state.day + elapsed) * 1000) / 1000;
  state.satiety = Math.max(0, +(state.satiety - elapsed * rules.satietyDrainPerDay).toFixed(3));
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
  let available = Math.max(0, rules.backpackCapacity - backpackSlots(state, inventory));
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

function leaveOnGround(state, resources, durability = {}) {
  const place = groundPlace(state);
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
    equipment: { weapon: null, armor: null, charm: null },
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
    siteWitnesses: {},
    encounterSeed: seed >>> 0,
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
  const enemy = enemyOf(state);
  if (!enemy) return null;
  return enemy.intents[state.combat.round % enemy.intents.length];
}

function hasChoiceNeeds(state, choice) {
  return Object.keys(missingItems(state, choice.need)).length === 0;
}

function siteWins(state, site, enemy) {
  return state.siteVictories?.[site?.id]?.[enemy] ?? 0;
}

function knowsChoice(state, choice, site) {
  return (!choice.afterFight || siteWins(state, site, choice.afterFight) > 0) &&
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
    const holdsPassage = kind === 'creatures' && records.events[site.id]?.choices.some((choice) => choice.guardedBy === id);
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
  const details = Object.entries(site.creatureText ?? {}).map(([id, words]) => creatures[id] ? words.present : words.absent).filter(Boolean);
  return [changed?.[1] ?? opened?.[1] ?? event.text, ...details].join('');
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
  const intent = currentIntent(state);
  const inSettlement = isSettlement(state);
  const mode = state.victoryPending ? 'victory' : state.combat ? 'combat' : state.event ? 'event' : inSettlement ? 'village' : 'field';
  const questLocation = inSettlement ? state.region : hub;
  const discoveredQuests = data.quests.filter((quest) => (quest.region ?? hub) === questLocation && knowsQuest(state, quest));
  const services = data.services.filter(({ id }) => knowsService(state, id) && (!inSettlement || atHome(state) ||
    id === 'cultivate' || (id === 'quests' && discoveredQuests.length) || (id === 'workshop' && canCraftScroll(state)))).map(({ id }) => id);
  const currentEvent = state.event ? records.events[state.event] : null;
  const currentSite = currentEvent && records.sites[currentEvent.id];
  const experiment = availableExperiment(state, currentEvent);
  const nextRealm = services.includes('cultivate') ? records.realms[state.realm + 1] ?? null : null;
  const groundLoot = { ...groundAt(state) };
  const studies = trainingView(state, economyKit);
  const visibleChoices = (currentEvent?.choices ?? []).map((choice, index) => {
    const blocker = choiceBlocker(state, choice, currentSite, index);
    const { label, desc, hidden } = choice;
    const gather = gatherOptions(state, choice, currentSite, index);
    return { label, desc: blocker?.depleted ? '' : desc, hidden, index, available: !blocker, lockedReason: blocker?.reason ?? '',
      ...(gather.length ? { gather } : {}) };
  }).filter(({ index }) => !completedSiteChoice(state, currentSite, index) &&
    knowsChoice(state, currentEvent.choices[index], currentSite));
  return {
    ...state,
    ...stats(state),
    ...worldView(state, economyKit),
    training: studies.rows,
    mechanism: mechanismView(state, economyKit),
    spiritSense: studies.spiritSense,
    tournament: tournamentView(state, economyKit),
    maxSatiety: rules.maxSatiety,
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
    backpackUsed: backpackSlots(state),
    backpackCapacity: rules.backpackCapacity,
    groundLoot,
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
    currentEnemy: enemy ? { ...enemy, sparring: inProtectedBout(state), maxHp: enemy.hp, hp: state.combat.hp } : null,
    combatWeapon: weaponView(state),
    intent,
    intentDamage: enemy && intent ? estimatedHit(enemy, intent) : 0,
    discoveredArts: data.arts.filter((art) => state.knownArts.includes(art.id) ||
      (!art.prizeOnly && (!inSettlement || atHome(state)) && services.includes('cultivate') && art.tier <= state.realm && isRevealed(state, art.reveal))).map(({ id }) => id),
    discoveredRecipes: services.includes('workshop') ? data.recipes.filter((recipe) => !recipe.facility &&
      (!inSettlement || atHome(state) || recipe.result === 'gate_scroll') && knowsRecipe(state, recipe)).map(({ id }) => id) : [],
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
    : refuse('眼下还找不到可回查的去处。');
}

function wait(state) {
  if (!isSettlement(state) && state.satiety === 0) return refuse('腹中空空，先吃些东西，或退回住处歇脚。');
  advance(state, rules.waitDays);
  return say(state, '等了半日。');
}

function encounter(state, id) {
  const region = regionOf(state);
  advance(state, rules.exploreDays);
  state.pressure += rules.explorePressure;
  state.event = id;
  const known = state.eventsSeen[state.region] ?? [];
  if (!known.includes(id)) state.eventsSeen[state.region] = [...known, id];
  const first = !state.explored.includes(state.region);
  if (first) {
    state.explored.push(state.region);
    state.insight += rules.firstRegionInsight;
  }
  const burdened = state.pressure > rules.pressureThreshold && state.qi > 0;
  if (burdened) state.qi = Math.max(0, state.qi - rules.pressureQi);
  return say(state, `在${region.name}遇上${records.events[id].name}。${first ? `初探此地，见识+${rules.firstRegionInsight}。` : ''}${burdened ? `久探耗神，真气−${rules.pressureQi}。` : ''}`);
}

function startCombat(state, id, siteId) {
  const enemy = records.enemies[id];
  if (siteId) {
    const witnesses = ((state.siteWitnesses ??= {})[siteId] ??= []);
    if (!witnesses.includes(id)) witnesses.push(id);
  }
  state.combat = { id, siteId, hp: enemy.hp, round: 0, escapeBonus: 0 };
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
  return site?.creatures?.[choice.guardedBy] ? poolAt(state, site, 'creatures', choice.guardedBy).count : 0;
}

function rollHarvestAmbush(state, site, ambush) {
  if (!ambush || !records.enemies[ambush.enemy] || !(ambush.chance > 0) || !site?.creatures?.[ambush.enemy] ||
      poolAt(state, site, 'creatures', ambush.enemy).count === 0) return false;
  state.encounterSeed = (Math.imul(1664525, state.encounterSeed) + 1013904223) >>> 0;
  return state.encounterSeed / 0x100000000 < ambush.chance;
}

function gatherOptions(state, choice, site, index) {
  const foodPerBatch = (choice.days ?? 0) * rules.satietyDrainPerDay;
  // A final batch can use up the remaining food, but an empty stomach cannot start a new batch.
  const batches = foodPerBatch ? Math.ceil(state.satiety / foodPerBatch) : Infinity;
  return choiceStocks(site, choice, index).map(({ key, id }) => {
    const yieldPerBatch = choice.loot[id];
    const maximum = Math.min(poolAt(state, site, 'stocks', key).count, yieldPerBatch * batches);
    return { id, name: nameOf(id), maximum, suggested: Math.min(maximum, yieldPerBatch) };
  }).filter(({ maximum }) => maximum > 0);
}

function choiceBlocker(state, choice, site, index) {
  if (completedSiteChoice(state, site, index)) return { reason: '这件事已经办过了。' };
  if ((state.world.recovery[`${site?.id}:${choice.enemy}`] ?? 0) > state.day) return { reason: '教习收了练兵，先歇一歇再来。' };
  if (site?.creatures?.[choice.enemy] && poolAt(state, site, 'creatures', choice.enemy).count === 0) {
    return { reason: '眼下没有可追的对手。', depleted: true };
  }
  const stocks = choiceStocks(site, choice, index);
  if (stocks.length && stocks.every(({ key }) => poolAt(state, site, 'stocks', key).count === 0)) {
    const renewable = stocks.some(({ pool }) => pool.interval > 0 && pool.growth > 0);
    return { reason: renewable ? '这里暂时已经采空了。' : '这处材料已经取尽。', depleted: true };
  }
  const guards = remainingGuards(state, site, choice);
  if (guards > 0) return { reason: `还有 ${guards} 只挡着这条路。` };
  if (choice.perWin && Object.keys(choice.loot ?? {}).some((id) => records.gear[id] &&
      (gearReserved(state, id) || Object.values(state.ground).some((pile) => pile[id])))) {
    return { reason: '同样的奖品已有一份。' };
  }
  if (state.satiety === 0 && ((choice.days ?? 0) > 0 || choice.enemy)) return { reason: '腹中空空，先吃些东西。' };
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
  const options = gatherOptions(state, choice, site, index);
  const explicitQuantity = itemId !== undefined || count !== undefined;
  let batches = 1;
  let requested;
  if (explicitQuantity) {
    const selected = options.find(({ id }) => id === itemId);
    if (!selected || !Number.isSafeInteger(count) || count < 1 || count > selected.maximum) {
      return refuse('请选择这里能采的材料和数量。');
    }
    const yieldPerBatch = choice.loot[selected.id];
    const injuryPerBatch = Math.max(0, -(choice.hp ?? 0));
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
    state.hp += choice.hp ?? 0;
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
  if (completedBatches && choice.perWin) (state.siteClaims[site.id] ??= {})[index] = siteWins(state, site, choice.afterFight);
  const { accepted, spilled } = addItems(state, completedBatches ? lootAvailable : {}, true);
  const gatheredRegion = state.region;
  const gatheredGoods = goodsText(gathered);
  leaveOnGround(state, gathered);
  const enemy = ambush?.enemy ?? choice.enemy;
  if (enemy && records.enemies[enemy]) {
    state.event = null;
    startCombat(state, enemy, site?.id);
  } else if (!stocks.length && !Object.keys(spilled).length) {
    state.event = null;
  }
  const loot = goodsText(accepted);
  const ambushText = ambush ? ambush.outcome ?? '你正在采集，有东西忽然扑了过来。' : null;
  const outcome = ambushText ?? choice.outcome;
  const detail = [completedBatches > 0 && choice.outcome, interrupted && '看守又回来了，你收手退到外面。', gatheredGoods && `采得${gatheredGoods}，留在脚边。`,
    ambushText, loot && `获得${loot}。`,
    insight > 0 && `见识+${insight}。`].filter(Boolean).join('');
  const result = say(state, detail || choice.label);
  return {
    ...(state.hp === 0 ? fall(state) : result),
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

function fall(state) {
  const enemy = enemyOf(state);
  if (inProtectedBout(state)) return endSparring(state, enemy);
  const coinsLost = Math.min(rules.fallMaxCoinLoss, Math.ceil(state.coins * rules.fallCoinLossFactor));
  const lostGoods = Object.fromEntries(Object.entries(state.expeditionLoot).filter(([id]) =>
    records.items[id]?.kind !== 'key' && !records.items[id]?.keepOnFall));
  const dropped = goodsText(lostGoods);
  for (const [id, count] of Object.entries(lostGoods)) removeItem(state, id, Math.min(owns(state, id), count));
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
  return say(state, `路人把你送回${regionOf(state).name}。${coinsLost ? `药费${coinsLost}枚灵钱。` : ''}${dropped ? `路上遗落${dropped}。` : ''}可在此歇息。`);
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
  }
  const tournament = tournamentResolution(state, combat, true);
  state.combat = null;
  state.event = tournament ? null : site?.id ?? null;
  const first = !state.defeated.includes(enemy.id);
  if (first) state.defeated.push(enemy.id);
  const insight = first ? (enemy.insight ?? 0) : 0;
  state.insight += insight;
  recordPractice(state);
  const gathered = protectedBout ? {} : { ...enemy.loot };
  leaveOnGround(state, gathered);
  const loot = goodsText(gathered);
  return {
    message: `${protectedBout ? '试招中胜过' : '击退'}${enemy.name}。${loot ? `脚边留下${loot}。` : ''}${insight ? `见识+${insight}。` : ''}${tournament}`,
    ...(loot ? { gathered, gatheredRegion: state.region, gatheredSite: site?.id } : {}),
  };
}

function estimatedHit(enemy, intent) {
  if (intent.kind === 'guard' || intent.kind === 'heal') return 0;
  return Math.ceil(enemy.atk * (intent.mult ?? 1));
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

function combatTraits(traits, enemy, intent) {
  const effects = { damage: 0, pierce: 0, guard: 0 };
  for (const trait of traits) {
    if (!trait || (trait.enemyTag && !enemy.tags?.includes(trait.enemyTag)) ||
        (trait.intent && trait.intent !== intent.kind) || !Object.hasOwn(effects, trait.kind)) continue;
    effects[trait.kind] += trait.bonus;
  }
  return effects;
}

function combatTurn(state, { damage = 0, pierce = 0, guard = 0, interrupt = 0, counter = 0,
  wearWeapon = false, hungerAffected = wearWeapon, ammo = null, message }) {
  const enemy = enemyOf(state);
  const intent = currentIntent(state);
  const { defense } = stats(state);
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
  const effectiveDamage = Math.floor((damage + weaponDamageBonus + training.damage + (ammo?.atk ?? 0)) * hunger * crossRealmFactor(state, enemy));
  const dealt = damage > 0
    ? Math.max(rules.minAttackDamage, effectiveDamage - Math.max(0, armor - pierce - weaponPierceBonus - training.pierce - (ammo?.pierce ?? 0))) : 0;
  const damageDealt = Math.min(state.combat.hp, dealt + counter);
  const healthBefore = state.hp;
  state.combat.hp -= dealt + counter;
  advance(state, rules.battleDays);
  const weaponDamage = wearWeapon ? wear(state, 'weapon') : '';
  if (ammo) removeItem(state, ammo.id, 1);
  let summary = `${message}${ammo ? `用掉一枚${nameOf(ammo.id)}。` : ''}${dealt + counter ? `造成${dealt + counter}点伤害。` : ''}${weaponDamage}`;
  if (state.combat.hp <= 0) {
    const { message: outcome, ...results } = finishCombat(state, enemy);
    normalize(state);
    return { ...say(state, summary + outcome), damageDealt, damageTaken: 0, ...results };
  }
  if (intent.kind === 'heal') {
    const before = state.combat.hp;
    state.combat.hp = Math.min(enemy.hp, before + Math.max(0, Math.ceil(enemy.atk * (intent.mult ?? 1)) - interrupt));
    summary += `${enemy.name}恢复了${state.combat.hp - before}点生命。`;
  } else if (intent.kind === 'guard') {
    summary += `${enemy.name}稳住了架势。`;
  } else {
    const received = Math.max(0, estimatedHit(enemy, intent) - defense - guard - traits.guard - training.guard - interrupt);
    delete state.combat.spiritGuard;
    if (intent.kind === 'drain') {
      const lostQi = Math.min(state.qi, received);
      state.qi -= lostQi;
      state.hp -= received - lostQi;
      const armorDamage = received > lostQi ? wear(state, 'armor') : '';
      summary += `${enemy.name}抽走你${lostQi}点真气${received > lostQi ? `，另造成${received - lostQi}点伤害` : ''}。${armorDamage}`;
    } else {
      state.hp -= received;
      const armorDamage = received ? wear(state, 'armor') : '';
      summary += received ? `${enemy.name}反击，你受了${received}点伤。${armorDamage}` : '你挡下了这一招。';
    }
  }
  state.combat.round += 1;
  normalize(state);
  const damageTaken = Math.max(0, healthBefore - state.hp);
  say(state, summary);
  return { ...(state.hp === 0 ? fall(state) : { ok: true, message: summary }), damageDealt, damageTaken };
}

function retreat(state, bonus = 0, lead = '', guard = 0) {
  if (state.combat?.tournament === tournamentData.id) return tournamentAction(state, 'tournamentWithdraw', economyKit);
  const enemy = enemyOf(state);
  const intent = currentIntent(state);
  const { defense, retreat: retreatBonus } = stats(state);
  const training = trainingPerks(state, enemy, intent);
  const reduction = clamp(retreatBonus + state.combat.escapeBonus + bonus, 0, 1);
  const received = Math.max(0, Math.ceil(estimatedHit(enemy, intent) * rules.retreatDamageFactor * (1 - reduction))
    - defense - guard - training.guard);
  advance(state, rules.retreatDays);
  const charmDamage = retreatBonus > 0 ? wear(state, 'charm') : '';
  const armorDamage = received ? wear(state, 'armor') : '';
  const healthBefore = state.hp;
  state.hp -= received;
  normalize(state);
  const damageTaken = Math.max(0, healthBefore - state.hp);
  const summary = `${lead}你退出了与${enemy.name}的交手，仍在${regionOf(state).name}。${received ? `脱身时受了${received}点伤。` : ''}${charmDamage}${armorDamage}`;
  say(state, summary);
  if (state.hp === 0 && inProtectedBout(state)) return { ...endSparring(state, enemy), damageDealt: 0, damageTaken };
  state.combat = null;
  return { ...(state.hp === 0 ? fall(state) : { ok: true, message: summary }), damageDealt: 0, damageTaken };
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
  state.qi -= cost;
  const focus = state.focus >= 1 ? 1 : 0;
  state.focus -= focus;
  return combatTurn(state, {
    damage: stats(state).attack - (weaponBased ? 0 : weapon?.atk ?? 0) + (art.power ?? 0) + focus * rules.focusDamage,
    pierce: art.pierce,
    guard: art.guard,
    interrupt: currentIntent(state).kind === 'heavy' ? art.break : 0,
    wearWeapon: weaponBased && Boolean(weapon),
    hungerAffected: weaponBased,
    ammo: weaponBased ? ammo : null,
    message: `你使出${art.name}。`,
  });
}

function attack(state) {
  const { weapon, compatible, ammo } = weaponLoadout(state);
  const unarmed = !weapon || (compatible.length > 0 && !ammo);
  return combatTurn(state, {
    damage: stats(state).attack - (unarmed ? weapon?.atk ?? 0 : 0),
    wearWeapon: !unarmed,
    hungerAffected: true,
    ammo,
    message: unarmed ? '你空手出招。' : '你抢先出手。',
  });
}

function eat(state, inCombat, id = supply) {
  if (id === 'beast_meat' && owns(state, id)) return refuse('这肉还生着，得带回村起灶。');
  const food = records.foods[id];
  if (!food || !owns(state, id)) return refuse('没有这份可吃的口粮。');
  if (state.satiety >= rules.maxSatiety && state.hp >= stats(state).maxHp) return refuse('你还很饱，气血也足。');
  removeItem(state, id, 1);
  state.didEat = true;
  const before = state.hp;
  const initialSatiety = state.satiety;
  state.satiety = Math.min(rules.maxSatiety, state.satiety + food.satiety);
  state.hp += food.hp;
  normalize(state);
  const satietyRestored = state.satiety - initialSatiety;
  const recovered = [satietyRestored && `饱腹+${satietyRestored}`, state.hp > before && `气血+${state.hp - before}`].filter(Boolean);
  const message = `你吃下${nameOf(id)}。${recovered.length ? `${recovered.join('，')}。` : ''}`;
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
  if (talisman && !inCombat) return refuse('遇敌时才可催动这道符。');
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
    damage: talisman.damage > 0 ? talisman.damage + training.sealDamage : 0,
    pierce: Infinity,
    guard,
    message,
  });
}

function equip(state, id, inCombat = false) {
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (inCombat && gear.slot !== 'weapon') return refuse('交手时只能换兵器。');
  if (state.realm < gear.tier) return refuse('这件装备需要更高境界。');
  if (!state.durability[id]) return refuse('这件装备需要先修理。');
  if (state.equipment[gear.slot] === id) return refuse('你已经穿戴了这件装备。');
  state.equipment[gear.slot] = id;
  normalize(state);
  const message = `换上${nameOf(id)}。`;
  return inCombat ? combatTurn(state, { guard: rules.combatSwitchGuard, message }) : say(state, message);
}

function unequip(state, slot) {
  if (!slots.includes(slot) || !state.equipment[slot]) return refuse('这个位置没有装备。');
  if (backpackSlots(state) >= rules.backpackCapacity) return refuse('行囊已满，收不下这件装备。');
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

function rest(state) {
  const { maxHp, maxQi } = stats(state);
  const needsRest = state.hp < maxHp || state.qi < maxQi || state.wounds || state.toxin || state.pressure || needsSenseRest(state);
  const relief = Math.max(0, rules.reliefRations - owns(state, supply));
  if (!needsRest && !relief) return refuse('你已经歇足了。');
  const granted = fittingItems(state, { [supply]: relief }).accepted[supply] ?? 0;
  if (relief && !granted && !needsRest) return refuse('行囊已满，拿不了干粮。');
  advance(state, rules.restDays);
  state.wounds -= rules.restWounds;
  state.toxin -= rules.restToxin;
  state.pressure = 0;
  state.hp += rules.restHp;
  state.qi += rules.restQi + trainingPerks(state).restQi;
  const recoveredSense = restoreTrainingSense(state);
  normalize(state);
  if (granted) {
    state.reliefRations += granted;
    addItems(state, { [supply]: granted });
  }
  return say(state, `在${regionOf(state).name}歇了半日。${recoveredSense ? '神识也养回来了。' : ''}${granted ? `灶上匀给你${granted}份${nameOf(supply)}。` : relief ? '行囊已满，拿不了干粮。' : ''}`);
}

function learn(state, id) {
  const art = records.arts[id];
  if (!art) return refuse('坊市没有这部术诀。');
  if (art.prizeOnly && !state.knownArts.includes(id)) return refuse('这门术要由传习人亲自教授。');
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
  if (sessions >= rules.researchLimit) return refuse('这一境的静修已经尽了功效，可到外面增进见识。');
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
  if (!next) return refuse('你已经走到了此地传承的尽头。');
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

function craft(state, id) {
  const recipe = records.recipes[id];
  if (!recipe) return refuse('没有这张配方。');
  if (recipe.facility) return refuse('这道工序需要在相应设施里开工。');
  if (recipe.tier > state.realm) return refuse('这一手做法需要更高境界。');
  if (!knowsRecipe(state, recipe)) return refuse('你还没找到这个做法。');
  if (records.gear[recipe.result] && gearReserved(state, recipe.result)) return refuse('同名装备已在手上、仓里或锻炉里。');
  const missing = homeRequirements(state, recipe.cost, recipe.need);
  if (missing) return refuse(missing);
  const loot = { [recipe.result]: recipe.count ?? 1 };
  if (!hasRoom(state, loot, homeBagSpend(state, combinedResources(recipe.cost, recipe.need)))) return refuse('行囊已满，放不下制成的东西。');
  spendHome(state, recipe.cost, recipe.need);
  advance(state, recipe.days);
  addItems(state, loot);
  return say(state, `制成${nameOf(recipe.result)}×${recipe.count ?? 1}。`);
}

function showHideToSmith(state) {
  if (!owns(state, 'hide')) return refuse('手里没有兽革。');
  if (state.showedHideToSmith) return refuse('工匠已经看过兽革。');
  state.showedHideToSmith = true;
  return say(state, '工匠拎起兽革，顺着纹路拽了拽。「两片就够衬一件褂子。下回让那水兽咬在这上头。」');
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
    return { id, price: sell, count, canSell: !blockedReason, blockedReason };
  });
  return { stalls, sales };
}

function trade(state, id, count, buying, stallId) {
  const item = records.items[id];
  if (!item || !Number.isInteger(count) || count < 1 || count > rules.maxTradeCount) return refuse('请选择交易物品及数量。');
  const price = buying ? item.price : item.sell;
  if (!(price > 0)) return refuse('坊市没有这门买卖。');
  let merchantMessage = '';
  if (buying) {
    const stall = data.market.stalls.find((row) => (!stallId || stallId === row.id) &&
      stockedOffers(state, row.offers).some((offer) => offer.id === id));
    if (!stall) return refuse('摊上没摆这件货。');
    const offer = stockedOffers(state, stall.offers).find((row) => row.id === id);
    const blockedReason = purchaseBlocker(state, item, count, marketStock(state, stall.id, offer));
    if (blockedReason) return refuse(blockedReason);
    state.coins -= price * count;
    addItems(state, { [id]: count });
    merchantMessage = recordPurchase(state, stall.id, count, offer);
  } else {
    const { blockedReason } = saleTerms(state, id, count);
    if (blockedReason) return refuse(blockedReason);
    removeItem(state, id, count, false);
    state.coins += price * count;
  }
  return { ...say(state, `${buying ? '买入' : '卖出'}${item.name}×${count}，${price * count}枚灵钱。${merchantMessage}`), merchantMessage };
}

function repair(state, id) {
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (state.durability[id] >= gear.durability) return refuse('这件装备已经完好。');
  const cost = gear.repair ?? 1;
  const missing = homeRequirements(state, cost);
  if (missing) return refuse(missing);
  spendHome(state, cost);
  state.durability[id] = gear.durability;
  return say(state, `修好${nameOf(id)}，耐久已满。`);
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
  if (!deduction || !knowsDeduction(state, deduction)) return refuse('眼下没有这桩疑案的头绪。');
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
  if (!trial || trial.id !== id) return refuse('眼前还没有能这样试的东西。');
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
  data, records, rules, owns, atHome, resourceEntries, say, refuse, advance, addItems, removeItem, startCombat,
  missingItems, payItems, hasRoom, backpackSlots, leaveOnGround, groundAt, nameOf, goodsText, normalize,
  isEvidence, knowsRecipe, homeSupplies, homeRequirements, spendHome, homeBagSpend, homeBagAvailable, gearReserved, mechanismFailure,
};

function canUseVillageAction(state, action, payload) {
  if (action === 'rest') return settlementOf(data, state.region)?.inn;
  if (atHome(state)) return true;
  if (!isSettlement(state)) return false;
  return action === 'breakthrough' || action === 'research' || action === 'handin' ||
    (action === 'craft' && records.recipes[payload.id]?.result === 'gate_scroll');
}

const villageActions = {
  rest: (state) => rest(state),
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
  craft: 'workshop', showHideToSmith: 'workshop', repair: 'workshop', buy: 'market', sell: 'market', handin: 'quests',
};

const generalActions = {
  travel: (state, { id }) => travel(state, id),
  visit: (state, { id }) => visit(state, id),
  revisit: (state, { id }) => revisit(state, id),
  wait,
  eat: (state, { id }) => eat(state, false, id || supply),
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
  tournamentWithdraw: (state) => tournamentAction(state, 'tournamentWithdraw', economyKit),
  readSpirit: (state) => recordTrainingRead(state, economyKit),
  selectAmmo: (state, { id }) => selectAmmo(state, id),
  combatEquip: (state, { id }) => equip(state, id, true),
  guard: (state) => {
    const heavy = currentIntent(state).kind === 'heavy';
    return combatTurn(state, {
      guard: rules.guardBonus + (heavy ? rules.heavyGuardBonus : 0),
      counter: heavy ? rules.guardCounter : 0,
      message: heavy ? '你架住重招，顺势还手。' : '你收身架守。',
    });
  },
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
    refuse('眼下无法这样做。');
}

export function act(state, action, payload = {}) {
  const result = takeTurn(state, action, payload);
  if (result.ok) refreshDiscovery(state);
  return result;
}
