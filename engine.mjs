import * as moduleData from './data.mjs';

const data = { ...moduleData.default, ...moduleData };

const records = Object.fromEntries(
  ['realms', 'items', 'gear', 'pills', 'talismans', 'arts', 'recipes', 'regions', 'events', 'enemies', 'quests', 'deductions']
    .map((key) => [key, Object.assign(Object.create(null), Object.fromEntries((data[key] ?? []).map((entry) => [entry.id, entry])))]),
);
const supply = 'ration';
const hub = 'village';
const slots = ['weapon', 'armor', 'charm'];

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
  retreatDays: 0.25,
  retreatDamageFactor: 0.5,
  returnShortageDays: 0.25,
  guardBonus: 3,
  guardCounter: 2,
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
  mealHeal: 2,
  fallDays: 1,
  fallMaxCoinLoss: 4,
  fallCoinLossFactor: 0.2,
  fallWounds: 1,
  fallHpFactor: 0.5,
  fallQi: 1,
  maxWounds: 3,
  maxTradeCount: 99,
});

const resourceEntries = (resources) => Object.entries(resources && typeof resources === 'object' ? resources : {});
const owns = (state, id) => state.inventory[id] ?? 0;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const realmOf = (state) => records.realms[state.realm];
const regionOf = (state) => records.regions[state.region];
const enemyOf = (state) => state.combat ? records.enemies[state.combat.id] : null;
const atHome = (state) => state.region === hub;
const nameOf = (id) => records.items[id]?.name ?? id;
const goodsText = (resources) => resourceEntries(resources)
  .filter(([, count]) => count > 0).map(([id, count]) => `${nameOf(id)}×${count}`).join('、');

function seedNumber(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return (seed >>> 0) || 1;
  let result = 2166136261;
  for (const character of String(seed)) {
    result = Math.imul(result ^ character.codePointAt(0), 16777619);
  }
  return (result >>> 0) || 1;
}

function random(state) {
  let next = state.randomSeed;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  state.randomSeed = next >>> 0;
  return state.randomSeed / 4294967296;
}

function activeGear(state) {
  return Object.values(state.equipment).map((id) => records.gear[id])
    .filter((entry) => entry && state.durability[entry.id] > 0);
}

function stats(state) {
  const realm = realmOf(state);
  const worn = activeGear(state);
  const sum = (key) => worn.reduce((total, entry) => total + (entry[key] ?? 0), 0);
  return {
    maxHp: Math.max(1, realm.hp + sum('hp') - rules.woundPenalty * state.wounds),
    maxQi: Math.max(1, realm.qi + sum('qi')),
    attack: realm.atk + sum('atk'),
    defense: realm.def + sum('def'),
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
  state.day = Math.round((state.day + (days ?? 0)) * 1000) / 1000;
}

function addItems(state, resources, found = false) {
  for (const [id, count] of resourceEntries(resources)) {
    if (count <= 0) continue;
    const gear = records.gear[id];
    if (gear && owns(state, id)) continue;
    state.inventory[id] = owns(state, id) + (gear ? 1 : count);
    if (!state.knownItems.includes(id)) state.knownItems.push(id);
    if (gear) state.durability[id] = gear.durability;
    if (found && !atHome(state)) state.expeditionLoot[id] = (state.expeditionLoot[id] ?? 0) + (gear ? 1 : count);
  }
}

function removeItem(state, id, count) {
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
  if (id === supply) state.reliefRations = Math.max(0, state.reliefRations - count);
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
    if (isRevealed(state, region.reveal) && !state.discovered.includes(region.id)) {
      state.discovered.push(region.id);
      if (region.reveal) say(state, `你找到了通往${region.name}的路。`);
    }
  }
}

function knowsService(state, id) {
  if (id === 'quests' && state.completedQuests.length) return true;
  if (id === 'cultivate' && (state.realm > 0 || Object.values(state.studies).some(Boolean))) return true;
  const service = data.services.find((entry) => entry.id === id);
  return (service?.items ?? []).some((item) => state.knownItems.includes(item)) ||
    (service?.choices ?? []).some((choice) => state.seenChoices.includes(choice));
}

function knowsMaterials(state, need) {
  return resourceEntries(need).every(([id, count]) => count <= 0 || state.knownItems.includes(id));
}

function knowsQuest(state, quest) {
  if (state.completedQuests.includes(quest.id)) return true;
  if ((quest.tier ?? 0) > state.realm) return false;
  if (quest.id === victoryQuestId() && !state.discovered.includes('ford') && !state.knownItems.includes('seal')) return false;
  if (quest.need?.ore && !state.discovered.includes('ridge')) return false;
  return isRevealed(state, quest.reveal) && (quest.requiresKnownMaterials === false || knowsMaterials(state, quest.need));
}

function knowsRecipe(state, recipe) {
  return recipe.tier <= state.realm && isRevealed(state, recipe.reveal) && knowsMaterials(state, recipe.need);
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

export function createGame(seed = Date.now()) {
  const settings = data.starting ?? {};
  const state = {
    version: 1,
    randomSeed: seedNumber(seed),
    day: 1,
    realm: 0,
    region: hub,
    hp: 0,
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
    knownArts: [...(settings.arts ?? data.arts.filter((entry) => entry.tier === 0 && !entry.price)
      .slice(0, 1).map((entry) => entry.id))],
    completedQuests: [],
    completedDeductions: [],
    explored: [],
    discovered: [],
    eventsSeen: {},
    seenChoices: [],
    defeated: [],
    studies: {},
    event: null,
    combat: null,
    expeditionLoot: {},
    won: false,
    wonDay: null,
    victoryPending: false,
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

function revisitableEvents(state) {
  if (atHome(state) || state.event || state.combat) return [];
  return (state.eventsSeen[state.region] ?? []).map((id) => records.events[id]).filter((event) =>
    event.revisit && event.choices.some((choice, index) =>
      choice.hidden && hasChoiceNeeds(state, choice) && !state.seenChoices.includes(`${event.id}:${index}`)));
}

export function view(state) {
  const enemy = enemyOf(state);
  const intent = currentIntent(state);
  const mode = state.victoryPending ? 'victory' : state.combat ? 'combat' : state.event ? 'event' : atHome(state) ? 'village' : 'field';
  const nextRegion = data.regions.find(({ id, secret, hidden }) => !secret && !hidden && !state.discovered.includes(id));
  const services = data.services.filter(({ id }) => knowsService(state, id)).map(({ id }) => id);
  const discoveredQuests = services.includes('quests') ? data.quests.filter((quest) => knowsQuest(state, quest)) : [];
  const currentEvent = state.event ? records.events[state.event] : null;
  const visibleChoices = (currentEvent?.choices ?? []).map((choice, index) => {
    const lockedReason = choiceBlocker(state, choice);
    return { ...choice, index, available: !lockedReason, lockedReason };
  }).filter((choice) => !choice.hidden || hasChoiceNeeds(state, choice));
  return {
    ...state,
    ...stats(state),
    mode,
    day: state.day,
    realmIndex: state.realm,
    realm: realmOf(state),
    nextRealm: services.includes('cultivate') ? records.realms[state.realm + 1] ?? null : null,
    regionId: state.region,
    region: regionOf(state),
    services,
    currentEvent: currentEvent ? { ...currentEvent, choices: visibleChoices } : null,
    visibleChoices,
    revisitableEvents: revisitableEvents(state).map(({ id, name }) => ({ id, name })),
    currentEnemy: enemy ? { ...enemy, maxHp: enemy.hp, hp: state.combat.hp } : null,
    intent,
    intentDamage: enemy && intent ? estimatedHit(enemy, intent) : 0,
    discoveryHint: state.explored.length ? nextRegion?.hint ?? '' : '',
    discoveredArts: data.arts.filter((art) => state.knownArts.includes(art.id) ||
      (services.includes('cultivate') && art.tier <= state.realm && isRevealed(state, art.reveal))).map(({ id }) => id),
    discoveredRecipes: services.includes('workshop') ? data.recipes.filter((recipe) => knowsRecipe(state, recipe)).map(({ id }) => id) : [],
    discoveredQuests: discoveredQuests.map(({ id }) => id),
    discoveredItems: data.items.filter((item) => knowsItem(state, item)).map(({ id }) => id),
    evidence: data.items.filter((item) => isEvidence(item) && owns(state, item.id) > 0)
      .map(({ id, name, desc }) => ({ id, name, desc, count: owns(state, id) })),
    deductions: (data.deductions ?? []).filter((entry) => knowsDeduction(state, entry)).map((entry) => {
      const { id, name, desc, hypotheses, days, success } = entry;
      const completed = (state.completedDeductions ?? []).includes(id);
      return { id, name, desc, hypotheses: hypotheses.map(({ id, label }) => ({ id, label })), days, completed, ...(completed ? { success } : {}) };
    }),
    quests: discoveredQuests.map((quest) => ({
      ...quest,
      completed: state.completedQuests.includes(quest.id),
      ready: Object.keys(missingItems(state, quest.need)).length === 0,
    })),
    lastMessage: state.log.at(-1) ?? '',
  };
}

function travel(state, id) {
  const destination = records.regions[id];
  if (!destination) return refuse('找不到这条路。');
  if (!state.discovered.includes(id)) return refuse('你还没有找到那条路。');
  if (state.region === id) return refuse('你已经在这里。');
  if (destination.tier > state.realm) return refuse(`前往${destination.name}需要${records.realms[destination.tier].name}。`);
  const route = id === hub ? regionOf(state) : destination;
  const food = route.food ?? 0;
  if (id !== hub && owns(state, supply) < food) return refuse(`上路至少需备${food}份${nameOf(supply)}。`);
  const shortage = Math.max(0, food - owns(state, supply));
  if (food > shortage) removeItem(state, supply, food - shortage);
  advance(state, (route.travel ?? 0) + rules.returnShortageDays * shortage);
  state.region = id;
  if (id === hub) {
    state.expeditionLoot = {};
    state.pressure = 0;
  }
  const delay = shortage ? '口粮不足，路上多歇了几次。' : '';
  return say(state, `抵达${destination.name}。${delay}`);
}

function explore(state) {
  const region = regionOf(state);
  if (atHome(state)) return refuse('先选一处去向。');
  const draws = region.draws.filter((entry) => entry.weight > 0);
  let selection = random(state) * draws.reduce((sum, entry) => sum + entry.weight, 0);
  const draw = draws.find((entry) => (selection -= entry.weight) < 0) ?? draws.at(-1);
  if (!draw || !records.events[draw.event]) return refuse('这一带眼下没有可查的动静。');
  return encounter(state, draw.event);
}

function revisit(state, id) {
  return revisitableEvents(state).some((event) => event.id === id)
    ? encounter(state, id)
    : refuse('眼下还找不到可回查的去处。');
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

function startCombat(state, id) {
  const enemy = records.enemies[id];
  state.combat = { id, hp: enemy.hp, round: 0, escapeBonus: 0 };
}

function choiceBlocker(state, choice) {
  const food = Math.max(0, choice.food ?? 0);
  const coins = choice.coins ?? 0;
  const missing = missingItems(state, choice.need);
  if (Object.keys(missing).length) return `还缺${goodsText(missing)}。`;
  if (food + (choice.consume ? choice.need?.[supply] ?? 0 : 0) > owns(state, supply)) return `还需${food}份${nameOf(supply)}。`;
  if (state.coins + coins < 0) return `还需${-coins}枚灵钱。`;
  return '';
}

function choose(state, index) {
  const event = records.events[state.event];
  const choice = event.choices[index];
  if (!Number.isInteger(index) || !choice || (choice.hidden && !hasChoiceNeeds(state, choice))) {
    return refuse('请选择眼前能做的事。');
  }
  const blocker = choiceBlocker(state, choice);
  if (blocker) return refuse(blocker);
  const food = Math.max(0, choice.food ?? 0);
  const coins = choice.coins ?? 0;
  if (choice.consume) payItems(state, choice.need);
  if (food) removeItem(state, supply, food);
  state.event = null;
  advance(state, choice.days);
  state.coins += coins;
  state.hp += choice.hp ?? 0;
  state.qi += choice.qi ?? 0;
  normalize(state);
  const choiceKey = `${event.id}:${index}`;
  const first = !state.seenChoices.includes(choiceKey);
  const insight = first ? (choice.insight ?? 0) : 0;
  if (first) {
    state.seenChoices.push(choiceKey);
    state.insight = Math.max(0, state.insight + insight);
  }
  addItems(state, choice.loot, true);
  if (choice.enemy && records.enemies[choice.enemy]) startCombat(state, choice.enemy);
  const loot = goodsText(choice.loot);
  const detail = [choice.desc, loot && `获得${loot}。`, insight > 0 && `见识+${insight}。`].filter(Boolean).join('');
  say(state, detail || choice.label);
  return state.hp === 0 ? fall(state) : { ok: true, message: state.log.at(-1) };
}

function fall(state) {
  const coinsLost = Math.min(rules.fallMaxCoinLoss, Math.ceil(state.coins * rules.fallCoinLossFactor));
  const lostGoods = Object.fromEntries(Object.entries(state.expeditionLoot).filter(([id]) =>
    records.items[id]?.kind !== 'key' && !records.items[id]?.keepOnFall));
  const dropped = goodsText(lostGoods);
  for (const [id, count] of Object.entries(lostGoods)) removeItem(state, id, Math.min(owns(state, id), count));
  state.expeditionLoot = {};
  state.coins -= coinsLost;
  state.region = hub;
  state.event = null;
  state.combat = null;
  state.pressure = 0;
  state.focus = 0;
  state.toxin = 0;
  state.wounds = Math.min(rules.maxWounds, state.wounds + rules.fallWounds);
  advance(state, rules.fallDays);
  state.hp = Math.ceil(stats(state).maxHp * rules.fallHpFactor);
  state.qi = Math.min(rules.fallQi, stats(state).maxQi);
  return say(state, `村人把你捎了回来。${coinsLost ? `药费${coinsLost}枚灵钱。` : ''}${dropped ? `路上遗落${dropped}。` : ''}可在村内歇息。`);
}

function finishCombat(state, enemy) {
  state.combat = null;
  const first = !state.defeated.includes(enemy.id);
  if (first) state.defeated.push(enemy.id);
  const insight = first ? (enemy.insight ?? 0) : 0;
  state.insight += insight;
  state.coins += enemy.coins ?? 0;
  addItems(state, enemy.loot, true);
  const loot = goodsText(enemy.loot);
  return `击退${enemy.name}。${loot ? `获得${loot}。` : ''}${enemy.coins ? `灵钱+${enemy.coins}。` : ''}${insight ? `见识+${insight}。` : ''}`;
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

function combatTraits(state, enemy, intent) {
  const effects = { damage: 0, pierce: 0, guard: 0 };
  for (const { trait } of activeGear(state)) {
    if (!trait || (trait.enemyTag && !enemy.tags?.includes(trait.enemyTag)) ||
        (trait.intent && trait.intent !== intent.kind)) continue;
    effects[trait.kind] += trait.bonus;
  }
  return effects;
}

function combatTurn(state, { damage = 0, pierce = 0, guard = 0, interrupt = 0, counter = 0, wearWeapon = false, message }) {
  const enemy = enemyOf(state);
  const intent = currentIntent(state);
  const { defense } = stats(state);
  const traits = combatTraits(state, enemy, intent);
  const weaponDamageBonus = wearWeapon ? traits.damage : 0;
  const weaponPierceBonus = wearWeapon ? traits.pierce : 0;
  const armor = intent.kind === 'guard'
    ? Math.max(enemy.def + rules.enemyGuardBonus, Math.ceil(enemy.def * (intent.mult ?? 1)))
    : enemy.def;
  const effectiveDamage = Math.floor((damage + weaponDamageBonus) * crossRealmFactor(state, enemy));
  const dealt = damage > 0 ? Math.max(rules.minAttackDamage, effectiveDamage - Math.max(0, armor - pierce - weaponPierceBonus)) : 0;
  state.combat.hp -= dealt + counter;
  advance(state, rules.battleDays);
  const weaponDamage = wearWeapon ? wear(state, 'weapon') : '';
  let summary = `${message}${dealt + counter ? `造成${dealt + counter}点伤害。` : ''}${weaponDamage}`;
  if (state.combat.hp <= 0) {
    const outcome = finishCombat(state, enemy);
    normalize(state);
    return say(state, summary + outcome);
  }
  if (intent.kind === 'heal') {
    const before = state.combat.hp;
    state.combat.hp = Math.min(enemy.hp, before + Math.max(0, Math.ceil(enemy.atk * (intent.mult ?? 1)) - interrupt));
    summary += `${enemy.name}恢复了${state.combat.hp - before}点生命。`;
  } else if (intent.kind === 'guard') {
    summary += `${enemy.name}稳住了架势。`;
  } else {
    const received = Math.max(0, estimatedHit(enemy, intent) - defense - guard - traits.guard - interrupt);
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
  say(state, summary);
  return state.hp === 0 ? fall(state) : { ok: true, message: summary };
}

function retreat(state, bonus = 0, lead = '', guard = 0) {
  const enemy = enemyOf(state);
  const intent = currentIntent(state);
  const { defense, retreat: retreatBonus } = stats(state);
  const reduction = clamp(retreatBonus + state.combat.escapeBonus + bonus, 0, 1);
  const received = Math.max(0, Math.ceil(estimatedHit(enemy, intent) * rules.retreatDamageFactor * (1 - reduction))
    - defense - guard);
  advance(state, rules.retreatDays);
  const charmDamage = retreatBonus > 0 ? wear(state, 'charm') : '';
  const armorDamage = received ? wear(state, 'armor') : '';
  state.hp -= received;
  state.combat = null;
  normalize(state);
  const summary = `${lead}你退出了与${enemy.name}的交手，仍在${regionOf(state).name}。${received ? `脱身时受了${received}点伤。` : ''}${charmDamage}${armorDamage}`;
  say(state, summary);
  return state.hp === 0 ? fall(state) : { ok: true, message: summary };
}

function cast(state, id) {
  const art = records.arts[id];
  if (!art || !state.knownArts.includes(id)) return refuse('你还没学会这门术。');
  if (art.tier > state.realm) return refuse('这门术需要更高境界。');
  const cost = art.cost ?? 0;
  if (state.qi < cost) return refuse('真气不足。');
  state.qi -= cost;
  const focus = state.focus >= 1 ? 1 : 0;
  state.focus -= focus;
  return combatTurn(state, {
    damage: stats(state).attack + (art.power ?? 0) + focus * rules.focusDamage,
    pierce: art.pierce,
    guard: art.guard,
    interrupt: currentIntent(state).kind === 'heavy' ? art.break : 0,
    wearWeapon: true,
    message: `你使出${art.name}。`,
  });
}

function eat(state, inCombat) {
  if (!owns(state, supply)) return refuse('没有可吃的口粮。');
  if (state.hp >= stats(state).maxHp) return refuse('眼下气血充足。');
  removeItem(state, supply, 1);
  const before = state.hp;
  state.hp += rules.mealHeal;
  normalize(state);
  const message = `你吃下${nameOf(supply)}，生命+${state.hp - before}。`;
  return inCombat ? combatTurn(state, { message }) : say(state, message);
}

function use(state, id, inCombat) {
  if (id === supply) return eat(state, inCombat);
  if (!owns(state, id)) return refuse('行囊里没有这件物品。');
  const pill = records.pills[id];
  const talisman = records.talismans[id];
  const entry = pill ?? talisman;
  if (!entry) return refuse('这件物品不能直接使用。');
  if (entry.tier > state.realm) return refuse('你目前承受不了这件物品的效力。');
  if (talisman && !inCombat) return refuse('遇敌时才可催动这道符。');
  removeItem(state, id, 1);
  if (pill) {
    state.hp += pill.hp ?? 0;
    state.qi += pill.qi ?? 0;
    state.toxin += pill.toxin ?? 0;
    state.wounds -= pill.wound ?? 0;
    state.focus += pill.focus ?? 0;
    if (pill.food > 0) addItems(state, { [supply]: pill.food });
    normalize(state);
    const toxic = state.toxin >= rules.toxinThreshold;
    const toxinDamage = toxic ? Math.max(0, Math.min(state.hp - 1, rules.toxinDamage)) : 0;
    state.hp -= toxinDamage;
    const message = `你服下${nameOf(id)}。${toxinDamage ? `丹毒积重，损失${toxinDamage}点生命。` : ''}`;
    return inCombat ? combatTurn(state, { message }) : say(state, message);
  }
  const message = `你催动${nameOf(id)}。`;
  if (talisman.retreat > 0 && !talisman.damage) return retreat(state, talisman.retreat, message, talisman.guard);
  state.combat.escapeBonus += talisman.retreat ?? 0;
  return combatTurn(state, {
    damage: talisman.damage,
    pierce: Infinity,
    guard: talisman.guard,
    message,
  });
}

function equip(state, id) {
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (state.realm < gear.tier) return refuse('这件装备需要更高境界。');
  if (!state.durability[id]) return refuse('这件装备需要先修理。');
  if (state.equipment[gear.slot] === id) return refuse('你已经穿戴了这件装备。');
  state.equipment[gear.slot] = id;
  normalize(state);
  return say(state, `换上${nameOf(id)}。`);
}

function unequip(state, slot) {
  if (!slots.includes(slot) || !state.equipment[slot]) return refuse('这个位置没有装备。');
  const id = state.equipment[slot];
  state.equipment[slot] = null;
  normalize(state);
  return say(state, `收起${nameOf(id)}。`);
}

function rest(state) {
  const needsRest = state.hp < stats(state).maxHp || state.qi < stats(state).maxQi || state.wounds || state.toxin || state.pressure;
  const relief = Math.max(0, rules.reliefRations - owns(state, supply));
  if (!needsRest && !relief) return refuse('你已经歇足了。');
  advance(state, rules.restDays);
  state.wounds -= rules.restWounds;
  state.toxin -= rules.restToxin;
  state.pressure = 0;
  state.hp += rules.restHp;
  state.qi += rules.restQi;
  normalize(state);
  if (relief) {
    state.reliefRations += relief;
    addItems(state, { [supply]: relief });
  }
  return say(state, `在村里歇了半日。${relief ? `灶上匀给你${relief}份${nameOf(supply)}。` : ''}`);
}

function learn(state, id) {
  const art = records.arts[id];
  if (!art) return refuse('坊市没有这部术诀。');
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
  return say(state, `静修半日，见识+${rules.researchInsight}。`);
}

function requirements(state, cost, need) {
  if (typeof cost === 'number' && state.coins < cost) return `需要${cost}枚灵钱。`;
  const missing = missingItems(state, need);
  if (Object.keys(missing).length) return `还缺${goodsText(missing)}。`;
  const costMissing = missingItems(state, cost);
  if (Object.keys(costMissing).length) return `还缺${goodsText(costMissing)}。`;
  for (const [id, count] of resourceEntries(cost)) {
    if (owns(state, id) < (need?.[id] ?? 0) + count) return `还缺${nameOf(id)}。`;
  }
  return '';
}

function pay(state, cost, need) {
  if (typeof cost === 'number') state.coins -= cost;
  else payItems(state, cost);
  payItems(state, need);
}

function breakthrough(state) {
  const next = records.realms[state.realm + 1];
  if (!next) return refuse('你已经走到了此地传承的尽头。');
  if (state.insight < next.insight) return refuse(`突破需要${next.insight}点见识。`);
  const missing = requirements(state, next.cost, next.need);
  if (missing) return refuse(missing);
  pay(state, next.cost, next.need);
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
  if (recipe.tier > state.realm) return refuse('这一手做法需要更高境界。');
  if (!knowsRecipe(state, recipe)) return refuse('你还没找到这个做法。');
  if (records.gear[recipe.result] && owns(state, recipe.result)) return refuse('你已经有这件装备，可以在坊市修理。');
  const missing = requirements(state, recipe.cost, recipe.need);
  if (missing) return refuse(missing);
  pay(state, recipe.cost, recipe.need);
  advance(state, recipe.days);
  addItems(state, { [recipe.result]: recipe.count ?? 1 });
  return say(state, `制成${nameOf(recipe.result)}×${recipe.count ?? 1}。`);
}

function trade(state, id, count, buying) {
  const item = records.items[id];
  if (!item || !Number.isInteger(count) || count < 1 || count > rules.maxTradeCount) return refuse('请选择交易物品及数量。');
  if (!knowsItem(state, item)) return refuse('坊市还没有这件物品的消息。');
  const price = buying ? item.price : item.sell;
  if (!(price > 0)) return refuse('坊市没有这门买卖。');
  const gear = records.gear[id];
  if (buying) {
    const object = gear ?? records.pills[id] ?? records.talismans[id];
    if (object && object.tier > state.realm) return refuse('等境界到了再想这件物品。');
    if (gear && (owns(state, id) || count !== 1)) return refuse('同种装备只能持有一件。');
    if (state.coins < price * count) return refuse(`这批物品需要${price * count}枚灵钱。`);
    state.coins -= price * count;
    addItems(state, { [id]: count });
  } else {
    if (owns(state, id) < count) return refuse('行囊里没有这么多。');
    if (gear && state.equipment[gear.slot] === id) return refuse('先把这件装备收下。');
    if (id === supply && owns(state, id) - state.reliefRations < count) return refuse('村里匀给你的口粮只供自用。');
    removeItem(state, id, count);
    state.coins += price * count;
  }
  return say(state, `${buying ? '买入' : '卖出'}${item.name}×${count}，${price * count}枚灵钱。`);
}

function repair(state, id) {
  const gear = records.gear[id];
  if (!gear || !owns(state, id)) return refuse('行囊里没有这件装备。');
  if (state.durability[id] >= gear.durability) return refuse('这件装备已经完好。');
  const cost = gear.repair ?? 1;
  const missing = requirements(state, cost);
  if (missing) return refuse(missing);
  pay(state, cost);
  state.durability[id] = gear.durability;
  return say(state, `修好${nameOf(id)}，耐久已满。`);
}

function handin(state, id) {
  const quest = records.quests[id];
  if (!quest || !knowsQuest(state, quest)) return refuse('找不到这份委托。');
  if (state.completedQuests.includes(id)) return refuse('这份委托已经交付。');
  const missing = missingItems(state, quest.need);
  if (Object.keys(missing).length) return refuse(`还缺${goodsText(missing)}。`);
  payItems(state, quest.need);
  addItems(state, quest.reward);
  state.coins += quest.coins ?? 0;
  state.insight += quest.insight ?? 0;
  state.completedQuests.push(id);
  const victory = id === victoryQuestId();
  if (victory) {
    state.won = true;
    state.wonDay = state.day;
    state.victoryPending = true;
  }
  return say(state, `已交付${quest.name}。${victory ? '村人接过镇渡印，旧渡重新开闸。' : ''}`);
}

function deduce(state, { id, evidence, hypothesis }) {
  const deduction = records.deductions[id];
  if (!deduction || !knowsDeduction(state, deduction)) return refuse('眼下没有这桩疑案的头绪。');
  if (state.completedDeductions?.includes(id)) return refuse('这桩疑案已经推明。');
  if (!deduction.hypotheses.some(({ id }) => id === hypothesis) || !Array.isArray(evidence)) {
    return refuse('请摆好证物，再选一个推断。');
  }
  const submitted = new Map();
  for (const itemId of evidence) {
    if (typeof itemId !== 'string' || !isEvidence(records.items[itemId])) return refuse('只能使用随身可查的证物。');
    const count = (submitted.get(itemId) ?? 0) + 1;
    if (count > owns(state, itemId)) return refuse('行囊里没有这么多证物。');
    submitted.set(itemId, count);
  }
  advance(state, deduction.days);
  const required = resourceEntries(deduction.evidence);
  const matches = submitted.size === required.length && required.every(([id, count]) => submitted.get(id) === count);
  if (!matches || hypothesis !== deduction.answer) {
    return { ...say(state, deduction.miss ?? '线索还连不起来，重新理一理证物和推断。'), deduction: 'miss' };
  }
  (state.completedDeductions ??= []).push(id);
  state.insight += deduction.insight ?? 0;
  addItems(state, deduction.reward);
  const result = say(state, deduction.success);
  refreshDiscovery(state);
  return { ...result, deduction: 'solved' };
}

const villageActions = {
  rest: (state) => rest(state),
  learn: (state, { id }) => learn(state, id),
  research: (state) => research(state),
  breakthrough: (state) => breakthrough(state),
  craft: (state, { id }) => craft(state, id),
  buy: (state, { id, count = 1 }) => trade(state, id, count, true),
  sell: (state, { id, count = 1 }) => trade(state, id, count, false),
  repair: (state, { id }) => repair(state, id),
  handin: (state, { id }) => handin(state, id),
};

const serviceForAction = {
  learn: 'cultivate', research: 'cultivate', breakthrough: 'cultivate',
  craft: 'workshop', repair: 'workshop', buy: 'market', sell: 'market', handin: 'quests',
};

const generalActions = {
  travel: (state, { id }) => travel(state, id),
  explore: (state) => explore(state),
  revisit: (state, { id }) => revisit(state, id),
  eat: (state) => eat(state, false),
  use: (state, { id }) => use(state, id, false),
  equip: (state, { id }) => equip(state, id),
  unequip: (state, { slot }) => unequip(state, slot),
  deduce,
};

const combatActions = {
  attack: (state) => combatTurn(state, {
    damage: stats(state).attack,
    wearWeapon: true,
    message: '你抢先出手。',
  }),
  guard: (state) => combatTurn(state, {
    guard: rules.guardBonus,
    counter: currentIntent(state).kind === 'heavy' ? rules.guardCounter : 0,
    message: '你收身架守。',
  }),
  art: (state, { id }) => cast(state, id),
  use: (state, { id }) => use(state, id, true),
  eat: (state) => eat(state, true),
  retreat: (state) => retreat(state),
};

function takeTurn(state, action, payload) {
  if (state.victoryPending) {
    if (action !== 'resume') return refuse('收好这段游记，即可继续出门。');
    state.victoryPending = false;
    return say(state, '旧渡照常开船。你仍可留在村里，或再去寻路。');
  }
  if (state.combat) {
    if (Object.hasOwn(combatActions, action)) {
      const result = combatActions[action](state, payload);
      if (result.ok) refreshDiscovery(state);
      return result;
    }
    return refuse('先处理眼前的对手。');
  }
  if (state.event) {
    if (action === 'choose') {
      const result = choose(state, payload.index);
      if (result.ok) refreshDiscovery(state);
      return result;
    }
    if (action === 'leave') {
      state.event = null;
      return say(state, '你放下这桩事，沿原路退出。');
    }
    return refuse('先决定如何处理眼前的事。');
  }
  if (Object.hasOwn(villageActions, action)) {
    if (!atHome(state)) return refuse('这件事要回村办理。');
    const service = serviceForAction[action];
    if (service && !knowsService(state, service)) return refuse('你还没有找到这个门路。');
    const result = villageActions[action](state, payload);
    if (result.ok) refreshDiscovery(state);
    return result;
  }
  if (Object.hasOwn(generalActions, action)) return generalActions[action](state, payload);
  return refuse('眼下无法这样做。');
}

export function act(state, action, payload = {}) {
  const unknownServices = data.services.filter(({ id }) => !knowsService(state, id));
  const result = takeTurn(state, action, payload);
  if (!result.ok) return result;
  const found = unknownServices.filter(({ id }) => knowsService(state, id)).map(({ name }) => name);
  if (!found.length) return result;
  const notice = `打听到了村里的${found.join('、')}。`;
  say(state, notice);
  return { ...result, message: result.message + notice };
}
