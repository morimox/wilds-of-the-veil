import { data } from "./data.mjs";
import { act, createGame, rules, view } from "./engine.mjs";

const itemRows = Object.fromEntries(data.items.map(item => [item.id, item]));
const foodRows = Object.fromEntries(data.foods.map(food => [food.id, food]));
const formulaIds = new Set(data.recipes.flatMap(recipe => recipe.formula ? [recipe.formula] : []));
const enemyRows = Object.fromEntries(data.enemies.map(enemy => [enemy.id, enemy]));
const eventRows = Object.fromEntries(data.events.map(event => [event.id, event]));
const slotNames = { weapon: "兵刃", armor: "护具", charm: "法器" };
const intentNames = { attack: "进攻", heavy: "蓄势", guard: "守势", heal: "疗伤", drain: "夺气" };
const kindNames = { material: "材料", food: "口粮", object: "随身物件", gear: "装备", pill: "丹药", talisman: "符箓", key: "线索", ammo: "弹药" };
const serviceNames = { cultivate: "修行", workshop: "工坊", market: "坊市", quests: "委托" };
const apprenticeQuests = ["lost_basket_return", "reed_salve", "apprentice_waterline"];
const app = document.querySelector("#app");
const main = document.querySelector("#main");
const guide = document.querySelector("#help");
const kit = document.querySelector("#kit");
const notices = document.querySelector("#notices");
const opening = document.querySelector("#opening");
let state = freshGame();
let screen = "journey";
let marketMode = "buy";
let activeFacility = "warehouse";
let openingTimer;
let selectedItem = null;
let activeDeduction = null;
const deductionDrafts = new Map();
const experimentDrafts = new Map();

function dismissOpening() {
  if (opening.hidden) return;
  clearTimeout(openingTimer);
  opening.hidden = true;
  app.inert = false;
  main.querySelector("button")?.focus({ preventScroll: true });
}

function showOpening() {
  opening.hidden = false;
  app.inert = true;
  opening.querySelector("[data-skip-opening]").focus({ preventScroll: true });
  openingTimer = setTimeout(dismissOpening, matchMedia("(prefers-reduced-motion: reduce)").matches ? 800 : 2800);
}

function freshGame() {
  return createGame(crypto.getRandomValues(new Uint32Array(1))[0] || 1);
}

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function linkButton(label, action, value = "", tone = "", disabled = false, count = 1) {
  return `<button type="button" class="button ${tone}" data-action="${action}" data-value="${escape(value)}"${count > 1 ? ` data-count="${count}"` : ""}${disabled ? " disabled" : ""}>${escape(label)}</button>`;
}

function quantityForm(action, value, item, label, { maximum, suggested = 1, showLimit = false, disabled = false }) {
  const gathering = action === "choose";
  const locked = disabled || maximum < 1;
  const initial = locked ? 0 : Math.min(suggested, maximum);
  const inputLabel = gathering ? `${label}的采集数量` : `拾取${item.name}的数量`;
  return `<form class="quantity-action" data-quantity="${action}" data-value="${escape(value)}" data-item-id="${escape(item.id)}">
    <label class="quantity-label">${gathering ? '<span class="fine">数量</span>' : ""}
      <input type="number" name="count" aria-label="${escape(inputLabel)}" inputmode="numeric" min="1" max="${Math.max(1, maximum)}" step="1" value="${initial}" required${locked ? " disabled" : ""}>
    </label>
    ${showLimit && !locked ? `<span class="fine quantity-limit">最多 ${maximum}</span>` : ""}
    <button type="submit" class="button${gathering ? "" : " quiet"}"${locked ? " disabled" : ""}>${escape(label)}</button>
  </form>`;
}

function tabButton(label, tab) {
  return `<button type="button" class="button quiet" data-tab="${tab}">${escape(label)}</button>`;
}

function panel(title, body, aside = "") {
  return `<section class="panel"><div class="panel-header"><h2>${escape(title)}</h2>${aside}</div>${body}</section>`;
}

function tag(text, tone = "") {
  return `<span class="tag ${tone}">${escape(text)}</span>`;
}

function card(title, desc, badge = "", actions = "", entry = "", need = null) {
  const name = entry ? `<span class="entry-anchor"><button class="item-trigger" type="button" data-entry aria-expanded="false">${escape(title)}</button><span class="item-tip" role="tooltip">${escape(publicText(entry))}</span></span>` : escape(title);
  const required = need ? supplies(need) : "";
  return `<article class="card"><div class="card-head"><h3>${name}</h3>${badge}</div>${desc ? `<p>${escape(publicText(desc))}</p>` : ""}${required ? `<p>需${escape(required)}</p>` : ""}${actions ? `<div class="actions">${actions}</div>` : ""}</article>`;
}

function meter(label, current, total) {
  const value = Math.min(100, Math.max(0, 100 * current / (total || 1)));
  return `<div class="meter"><span>${label} · ${condition(current, total)}</span>
    <span class="meter-track" style="--fill:${value}%" aria-hidden="true"><i></i></span></div>`;
}

function supplies(entries) {
  return Object.entries(entries ?? {}).map(([id, count]) => `${itemRows[id]?.name ?? id} ×${count}`).join("、");
}

function condition(current, total) {
  if (current <= 0) return "耗尽";
  if (current / total < 0.3) return "危急";
  return current < total ? "有损" : "充足";
}

function publicText(text, damage = false) {
  return String(text ?? "")
    .replace(/×\s*\d+(?:\.\d+)?/g, "")
    .replace(/(?:见识|修为|灵钱)\s*[+−-]\s*\d+(?:\.\d+)?。?/g, "")
    .replace(/真气\s*[+−-]\s*\d+(?:\.\d+)?/g, "真气受损")
    .replace(/，\s*\d+(?:\.\d+)?枚灵钱/g, "")
    .replace(/\d+(?:\.\d+)?枚灵钱/g, "灵钱")
    .replace(/丹毒积重，损失\d+点生命/g, "丹毒发作")
    .replace(/恢复了\d+点生命/g, "恢复了些气血")
    .replace(/抽走你\d+点真气/g, "夺走了你的真气")
    .replace(/\d+(?:\.\d+)?点(?:生命|真气|见识)/g, match => match.replace(/^\d+(?:\.\d+)?点/, ""))
    .replace(/\d+(?:\.\d+)?份/g, "些")
    .replace(/\d+(?:\.\d+)?点伤(?:害)?/g, match => damage ? match : "伤害")
    .replace(/\d+(?:\.\d+)?(?!(?:[\d.]|点伤))/g, "");
}

function tierName(id) {
  return data.realms.find(row => row.id === id)?.name ?? "";
}

function hasSupply(s, needed, stock = s.inventory) {
  return Object.entries(needed ?? {}).every(([id, count]) => (stock[id] ?? 0) >= count);
}

function homeMaterials(s) {
  return s.homeMaterials ?? s.inventory;
}

function inVillage(s) {
  return s.mode === "village";
}

function vital(label, current, max, low, explanation) {
  return `<details class="vital${low ? " low" : ""}">
    <summary>${label} <b>${Math.floor(current)}/${max}</b></summary>
    <p>${escape(explanation)}</p>
  </details>`;
}

function stats(s) {
  const warnings = [];
  const meal = data.foods.find(({ id }) => s.inventory[id] > 0);
  const showsQi = s.knownArts.length > 0 || s.pressure > rules.pressureThreshold;
  if (s.satiety === 0) warnings.push("空腹乏力");
  if (!meal && s.satiety < rules.rationSatiety) warnings.push("口粮已尽");
  if (s.toxin >= rules.toxinThreshold) warnings.push("丹毒发作");
  const danger = s.pressure > rules.pressureThreshold;
  const marks = Array.from({ length: rules.pressureThreshold }, (_, i) =>
    `<i class="${i < s.pressure ? "filled" : ""}"></i>`).join("");
  const fog = s.pressure >= rules.pressureThreshold ? `<details class="pressure${danger ? " danger" : ""}">
    <summary>${danger ? "雾压过重" : "雾压"} <span class="fog-marks" aria-hidden="true">${marks}</span></summary>
    <span>雾积满后，再探索会耗真气。回村就会散去。</span>
  </details>` : "";
  const canEat = s.mode !== "victory" && meal && (s.satiety < s.maxSatiety || s.hp < s.maxHp);
  const canUseSalve = s.hp < s.maxHp && s.inventory.salve > 0 && ["village", "field", "combat"].includes(s.mode);
  return `<div class="player-line"><span class="realm">${escape(s.realm.name)}</span>
    ${vital("气血", s.hp, s.maxHp, s.hp / s.maxHp < 0.3, "气血耗尽会倒下。伤药和回村歇息可以恢复。")}
    ${canUseSalve ? linkButton("敷伤药", "use", "salve", "quick-eat") : ""}
    ${vital("饱腹", s.satiety, s.maxSatiety, s.satiety < 24, `每过一日少 ${rules.satietyDrainPerDay} 点。吃一份干粮补 ${rules.rationSatiety} 点。`)}
    ${canEat ? linkButton(`吃${itemRows[meal.id].name}`, "eat", meal.id, "quick-eat") : ""}
    ${showsQi ? vital("真气", s.qi, s.maxQi, s.qi < s.maxQi / 3, "术诀和久留雾中会耗真气。回村歇息可以恢复。") : ""}
    ${warnings.map(text => `<span class="warning">${text}</span>`).join("")}${fog}</div>`;
}

function discovered(s, region) {
  const known = s.discovered;
  if (Array.isArray(known)) return known.includes(region.id) || region.id === s.region.id;
  if (known && typeof known === "object") return Boolean(known[region.id]) || region.id === s.region.id;
  return !region.reveal || region.id === s.region.id;
}

function routeAction(s, r) {
  const homeward = r.id === "village";
  const hungry = !homeward && s.satiety <= 0;
  const days = homeward ? s.region.travel + (s.satiety <= 0 ? rules.emptyReturnDays : 0) : r.travel;
  const note = hungry ? "空腹" : days ? `${days} 日` : "";
  return `<div class="route-action">${linkButton(homeward ? "回村" : `去${r.name}`, "travel", r.id, "", hungry)}${note ? `<span class="fine">${escape(note)}</span>` : ""}</div>`;
}

function siteResources(s, site) {
  const stock = Object.entries(site?.stocks ?? {}).map(([id, count]) =>
    count > 0 ? `${itemRows[id].name} ×${count}` : `${itemRows[id].name}已采空`);
  const witnessedEnemies = (eventRows[site?.id]?.choices ?? []).filter((choice, index) =>
    choice.enemy && s.seenChoices.includes(`${site.id}:${index}`)).map(choice => choice.enemy);
  const creatures = Object.entries(site?.creatures ?? {}).filter(([id]) => witnessedEnemies.includes(id)).map(([id, count]) =>
    count > 0 ? `${enemyRows[id].name} ×${count}` : `暂未见${enemyRows[id].name}`);
  return [...stock, ...creatures].join(" · ");
}

function siteList(s) {
  return `<div class="site-list">${(s.sites ?? []).map(site => {
    const stateText = siteResources(s, site);
    return `<div class="site-row">${linkButton(site.name, "visit", site.id, "", s.satiety <= 0)}${stateText ? `<span class="fine">${escape(stateText)}</span>` : ""}</div>`;
  }).join("")}</div>`;
}

function journey(s) {
  if (s.mode === "event") return eventScreen(s);
  if (s.mode === "combat") return combatScreen(s);
  if (s.mode === "victory") {
    const final = s.completionPhase === "final";
    return panel(final ? "山河归定" : "潮印归灯", `<p class="intro">${final ? "衡印归村，送信的人带着你走过的山路，往沿途驿站去了。" : "旧渡重新点起了灯。渡船也带回了岭外的消息。"}</p><div class="actions">${linkButton("继续行旅", "resume", "", "primary")}</div>`);
  }
  const known = data.regions.filter(region => region.id !== s.region.id && discovered(s, region));
  const newest = [...s.discovered].reverse().find(id => id !== s.region.id && id !== "village");
  const nearby = known.length <= 4 ? known : known.filter(region => region.id === "village" || region.id === newest ||
    (s.region.id !== "marsh" && region.id === "marsh"));
  const further = known.filter(region => !nearby.includes(region));
  const isHome = inVillage(s);
  const needRest = s.hp < s.maxHp || s.qi < s.maxQi || s.wounds || s.toxin || s.pressure || (s.inventory.ration ?? 0) < rules.reliefRations;
  return panel(s.region.name, `${isHome ? "" : siteList(s)}<div class="actions place-actions">
    ${nearby.map(region => routeAction(s, region)).join("")}
    ${isHome ? tabButton("找药僮", "apprentice") : ""}
    ${isHome && s.services.includes("workshop") ? tabButton("去工坊", "workshop") : ""}
    ${isHome && s.services.includes("market") ? tabButton("逛坊市", "market") : ""}
    ${isHome && s.economy ? tabButton("去后院", "yard") : ""}
    ${isHome && s.alchemy ? tabButton("找丹师", "alchemy") : ""}
    ${isHome && needRest ? linkButton("歇息", "rest") : ""}
    ${!isHome ? linkButton("等半日", "wait", "", "quiet", s.satiety <= 0) : ""}
  </div>${further.length ? `<details class="route-list"><summary>其他已知去路</summary><div class="actions">${further.map(region => routeAction(s, region)).join("")}</div></details>` : ""}`);
}

function eventScreen(s) {
  const event = s.currentEvent;
  const local = (s.sites ?? []).find(site => site.id === event.id);
  const painted = ["marsh", "ridge", "ford", "hidden"].includes(s.region.id);
  const resources = siteResources(s, local);
  const choices = s.visibleChoices.map(choice => {
    const cue = publicText(choice.desc);
    const blocker = publicText(choice.lockedReason);
    const gathers = choice.gather ?? [];
    const controls = gathers.length ? gathers.map(item => quantityForm("choose", choice.index, item,
      gathers.length === 1 ? choice.label : `${choice.label} · ${item.name}`,
      { ...item, showLimit: true, disabled: !choice.available })).join("") :
      linkButton(choice.label, "choose", choice.index, "", choice.available === false);
    return `<div class="choice">
      ${cue ? `<p class="choice-cue">${escape(cue)}</p>` : ""}
      ${controls}
      ${blocker ? `<p class="choice-blocker">${escape(blocker)}</p>` : ""}
    </div>`;
  }).join("");
  return panel(event.name, `${painted ? `<div class="scene scene-${escape(s.region.id)}" aria-hidden="true"></div>` : ""}
    <p class="intro">${escape(publicText(event.text))}</p>
    ${resources ? `<p class="site-stock">${escape(resources)}</p>` : ""}
    <div class="choice-list">${choices}</div>
    ${s.experiment ? experimentForm(s.experiment) : ""}
    <div class="actions">${linkButton("离开", "leave", "", "quiet")}</div>`, tag(s.region.name));
}

function thoughtDetails(thought) {
  return thought ? `<details class="trial-thought"><summary>看沙盘上的猜想</summary>
    <p class="player-thought">${escape(thought.hypothesis)}</p>
  </details>` : "";
}

function experimentForm(experiment) {
  const draft = experimentDrafts.get(experiment.id);
  const controls = experiment.controls.map(control => `<label class="experiment-control">
    <span>${escape(control.label)}</span>
    <select name="setting-${escape(control.id)}" required>
      <option value="" disabled${draft?.[control.id] ? "" : " selected"}>请选择</option>
      ${control.options.map(option => `<option value="${escape(option.id)}"${draft?.[control.id] === option.id ? " selected" : ""}>${escape(option.label)}</option>`).join("")}
    </select>
    </label>`).join("");
  return `<form class="experiment" data-experiment="${escape(experiment.id)}">
    <p class="intro">${escape(experiment.desc)}</p>
    ${thoughtDetails(experiment.thought)}
    <div class="experiment-controls">${controls}</div>
    <div class="actions"><button type="submit" class="button">当场试一次</button></div>
  </form>`;
}

function pillSummary(row) {
  return [row.hp && "疗伤", row.qi && "回气", row.food && "充饥", row.toxin < 0 && "解丹毒", row.wound && "调理伤势", row.focus && "凝神"].filter(Boolean).join(" · ");
}

function talismanSummary(row) {
  return [row.damage && "伤敌", row.guard && "护身", row.retreat && "助撤"].filter(Boolean).join(" · ");
}

function artSummary(row) {
  return ["耗真气", row.pierce && "穿甲", row.guard && "护身", row.break && "拆重招"].filter(Boolean).join(" · ");
}

function combatScreen(s) {
  const enemy = s.currentEnemy;
  const intent = s.intent;
  const hp = s.enemyHp ?? enemy.currentHp ?? enemy.hp;
  const arts = data.arts.filter(row => s.knownArts.includes(row.id));
  const weapon = s.combatWeapon;
  const ammoBar = weapon?.needsAmmo ? `<div class="combat-ammo">
    <p class="fine">${escape(weapon.name)} · ${weapon.isLoaded ? "已备弹药" : "弹药已尽，可徒手出手"}</p>
    <div class="actions">${(weapon.ammo ?? []).map(ammo => linkButton(
      `${ammo.name} ×${ammo.count}`, "selectAmmo", ammo.id, ammo.selected ? "primary" : "quiet", ammo.count <= 0 || ammo.selected,
    )).join("")}</div>
  </div>` : "";
  const backup = weapon?.needsAmmo && !weapon.isLoaded && weapon.meleeAlternative;
  const observation = enemy.desc ? `<details class="field-note"><summary>观察对手</summary><p>${escape(publicText(enemy.desc))}</p></details>` : "";
  const techniques = arts.map(row => {
    const reason = row.tier > s.realm.id ? `${tierName(row.tier)}可施展` : s.qi < row.cost ? "真气不足" :
      weapon?.needsAmmo && !weapon.isLoaded && row.weaponBased !== false ? "弹药已尽" : "";
    return card(row.name, "", "", linkButton(reason || "施展", "art", row.id, "", Boolean(reason)), row.desc);
  });
  return panel(enemy.name, `
    <div class="intent"><b>下一招 · ${escape(intent?.name)}</b>　${escape(intentNames[intent?.kind] ?? "")}</div>
    ${meter("对方气血", hp, enemy.maxHp)}
    ${ammoBar}
    <div class="actions">${linkButton(weapon?.needsAmmo && !weapon.isLoaded ? "徒手出手" : "出手", "attack", "", "primary")}${linkButton(intent.kind === "heavy" ? "架招" : "防御", "guard")}${linkButton("撤退", "retreat", "", "danger")}
      ${backup ? linkButton(`换用${backup.name}`, "combatEquip", backup.id, "quiet") : ""}
    </div>
    ${observation}
    ${techniques.length ? `<div class="card-grid learned-arts">${techniques.join("")}</div>` : ""}
    `, tag(tierName(enemy.tier), "warn"));
}

function gearCondition(remaining, total) {
  return !remaining ? "损坏" : remaining / total < 0.25 ? "将坏" : remaining < total ? "磨损" : "完好";
}

function gearDescription(item, gear, remaining) {
  const description = gear.entry || `${tierName(gear.tier)}散修可用。${item.desc}`;
  return remaining === undefined ? description : `${description} 目前${gearCondition(remaining, gear.durability)}。`;
}

function itemSlot(item, location, description, actions = "", label = "", count = 0) {
  const key = `${location}-${item.id}`;
  const open = selectedItem === key;
  return `<div class="item-row" data-item-row="${escape(key)}">
    ${label ? `<span class="slot-label">${escape(label)}</span>` : ""}
    <button type="button" class="item-trigger" data-item="${escape(key)}" aria-expanded="${open}" aria-describedby="tip-${escape(key)}">${escape(item.name)}${count ? `<span class="item-count">×${count}</span>` : ""}</button>
    <span class="item-tip" id="tip-${escape(key)}" role="tooltip">${escape(publicText(description))}</span>
    ${actions ? `<div class="item-tools"${open ? "" : " hidden"}>${actions}</div>` : ""}
  </div>`;
}

function pack(s) {
  const canEquip = inVillage(s) || s.mode === "field";
  const canUse = canEquip || s.mode === "combat";
  const canEat = canUse || s.mode === "event";
  const canRepair = inVillage(s) && s.services?.includes("workshop");
  const worn = Object.entries(s.equipment).filter(([, id]) => id).map(([slot, id]) => {
    const gear = data.gear.find(row => row.id === id);
    const remaining = s.durability[id] ?? gear.durability;
    return itemSlot(itemRows[id], "worn", gearDescription(itemRows[id], gear, remaining),
      (canEquip ? linkButton("卸下", "unequip", slot) : "") + (canRepair && remaining < gear.durability ? linkButton(s.coins < gear.repair ? "灵钱不足" : "修理", "repair", id, "quiet", s.coins < gear.repair) : ""),
      slotNames[slot]);
  });
  const carried = data.items.filter(row => s.inventory[row.id] && !Object.values(s.equipment).includes(row.id));
  const inventory = carried.filter(row => row.kind !== "key" || row.id === "foundation_pill").map(row => {
    const gear = data.gear.find(g => g.id === row.id);
    const pill = data.pills.find(g => g.id === row.id);
    const seal = data.talismans.find(g => g.id === row.id);
    let actions = "";
    if (gear) {
      const remaining = s.durability[row.id] ?? gear.durability;
      actions = (canEquip ? linkButton("装备", "equip", row.id, "", gear.tier > s.realm.id || remaining <= 0) : "") +
        (s.mode === "combat" && gear.slot === "weapon" ? linkButton("换用兵刃", "combatEquip", row.id, "", gear.tier > s.realm.id || remaining <= 0) : "") +
        (canRepair && remaining < gear.durability ? linkButton(s.coins < gear.repair ? "灵钱不足" : "修理", "repair", row.id, "quiet", s.coins < gear.repair) : "");
    }
    if (pill && canUse) {
      const healthy = row.id === "salve" && s.hp >= s.maxHp;
      const label = row.id === "salve" ? (healthy ? "气血已满" : "敷伤药") : "服用";
      actions = linkButton(label, "use", row.id, "", pill.tier > s.realm.id || healthy);
    }
    if (seal && s.mode === "combat") actions = linkButton("用符", "use", row.id, "", seal.tier > s.realm.id);
    if (foodRows[row.id] && canEat && (s.satiety < s.maxSatiety || s.hp < s.maxHp)) actions = linkButton(`吃${row.name}`, "eat", row.id);
    if (row.id === "lost_basket" && canEquip) {
      if (!s.basketInspected) actions += linkButton("查看药篓", "inspectBasket");
      if (inVillage(s)) actions += tabButton("找药僮", "apprentice");
      actions += linkButton("拆篓取药", "unpackBasket", "", "danger");
    }
    if (canEquip && row.id !== "foundation_pill") actions += linkButton("放下", "discard", row.id, "quiet");
    const description = gear ? gearDescription(row, gear, s.durability[row.id] ?? gear.durability) : pill ? pillSummary(pill) : seal ? talismanSummary(seal) : row.desc;
    return itemSlot(row, "held", description, actions, "", s.inventory[row.id]);
  });
  const keys = carried.filter(row => row.kind === "key" && row.id !== "foundation_pill");
  const keySlot = row => itemSlot(row, "clue", row.desc, "", "", s.inventory[row.id]);
  const clues = keys.filter(row => !formulaIds.has(row.id)).map(keySlot);
  const formulae = keys.filter(row => formulaIds.has(row.id)).map(keySlot);
  const ground = canEquip ? Object.entries(s.groundLoot ?? {}).map(([id, count]) => {
    const item = itemRows[id];
    const gear = data.gear.find(row => row.id === id);
    const maximum = s.groundPickup?.[id] ?? 0;
    return `<div class="ground-row">
      ${itemSlot(item, "ground", gear ? gearDescription(item, gear) : item.desc, "", "", count)}
      ${quantityForm("take", id, item, maximum ? "拾起" : "拿不了", { maximum, showLimit: maximum < count })}
    </div>`;
  }) : [];
  const meter = Array.from({ length: s.backpackCapacity }, (_, i) => `<i${i < s.backpackUsed ? ' class="filled"' : ""}></i>`).join("");
  const room = s.backpackUsed >= s.backpackCapacity ? "已满" : s.backpackUsed >= s.backpackCapacity - 2 ? "快满了" : "有空位";
  return `<section class="kit-section"><h2>装备</h2>${worn.join("") || '<p class="fine">空</p>'}</section>
    <section class="kit-section"><div class="kit-head"><h2>行囊</h2><span class="fine">${room}</span></div>
      <div class="bag-slots" role="img" aria-label="行囊容量${room}">${meter}</div>
      ${inventory.join("") || '<p class="fine">空</p>'}
    </section>
    ${clues.length ? `<section class="kit-section"><h2>线索</h2>${clues.join("")}</section>` : ""}
    ${formulae.length ? `<details class="kit-section formula-kit"><summary>丹方 · ${formulae.length}</summary>${formulae.join("")}</details>` : ""}
    ${ground.length ? `<section class="kit-section"><h2>脚边</h2>${ground.join("")}</section>` : ""}`;
}

function villageServices(s) {
  return s.services.filter(service => service !== "workshop" && service !== "market" &&
    (service !== "quests" || visibleQuests(s).length));
}

function village(s) {
  return panel("村务", `<div class="actions place-actions">${villageServices(s).map(service => tabButton(serviceNames[service], service)).join("")}</div>`);
}

function cultivation(s) {
  const next = s.nextRealm;
  const missing = s.progression?.pending ?? (next ? [s.insight < next.insight && "根基尚未稳固", s.coins < next.cost && "灵钱不足",
    !hasSupply(s, next.need, homeMaterials(s)) && `还缺${supplies(next.need)}`].filter(Boolean) : []);
  const training = panel("修行", `<div class="actions place-actions">${linkButton("打坐", "research")}
    ${next ? linkButton("尝试突破", "breakthrough", "", "primary", missing.length > 0) : ""}</div>
    ${missing.length ? `<p class="fine">${escape(missing.join(" · "))}</p>` : ""}`);
  const visibleArts = data.arts.filter(row => s.discoveredArts.includes(row.id));
  return training + (visibleArts.length ? panel("术诀", `<div class="card-grid">${visibleArts.map(row => {
    const known = s.knownArts.includes(row.id);
    return card(row.name, "", known ? tag("已习得") : "",
      known ? "" : linkButton(s.coins < row.price ? "灵钱不足" : "习得", "learn", row.id, "", s.coins < row.price), `${artSummary(row)}。 ${row.desc}`);
  }).join("")}</div>`) : "");
}

function workshop(s) {
  const recipes = data.recipes.filter(row => !row.facility && s.discoveredRecipes.includes(row.id));
  const household = homeMaterials(s);
  const smithMap = s.quests.find(row => row.id === "sell_forging" && !row.completed);
  const remarks = [
    s.inventory.hide > 0 && recipes.some(row => row.id === "r_hide_coat") &&
      "工匠捻了捻你带来的兽革。「这皮韧，攒两张，我给你缝件挡牙的褂子。」",
    s.inventory.eddy_note > 0 && recipes.some(row => row.id === "r_bank_talisman") &&
      "工匠用炭条顺着回汊图勾了一遍。「把这道弯画进符里，缠住你的劲就能往旁边卸。」",
    !smithMap && !recipes.length && "工匠在门边磨剪子，脚边卷着几块旧皮。",
  ].filter(Boolean).map(line => `<p class="intro">${escape(line)}</p>`).join("");
  const mapTrade = smithMap ? `<p class="intro">${escape(smithMap.desc)}</p>${smithMap.ready ? `<div class="actions">${linkButton("递一块寒铁", "handin", smithMap.id)}</div>` : ""}` : "";
  return panel("工坊", `${recipes.length ? '<div class="workshop-art" aria-hidden="true"></div>' : ""}
    ${remarks}${mapTrade}
    <div class="card-grid">${recipes.map(row => {
    const result = itemRows[row.result];
    const gear = data.gear.find(g => g.id === row.result);
    const pill = data.pills.find(g => g.id === row.result);
    const talisman = data.talismans.find(g => g.id === row.result);
    const reason = !hasSupply(s, row.need, household) ? "材料不足" : s.coins < row.cost ? "灵钱不足" : "";
    const entry = gear ? gearDescription(result, gear) : pill ? pillSummary(pill) : talisman ? talismanSummary(talisman) : result.desc;
    return card(result.name, "", tag(kindNames[result.kind] ?? ""), linkButton(reason || "制备", "craft", row.id, "", Boolean(reason)), entry, row.need);
  }).join("")}</div>`);
}

function storageRows(rows, action) {
  const depositing = action === "econDeposit";
  const label = depositing ? "存入" : "取出";
  return rows.length ? rows.map(row => {
    const bulk = Math.min(row.count, row.maximum ?? row.count);
    return `<div class="storage-row"><span>${escape(row.name)} <small>×${row.count}</small></span>
      <div class="actions">
        ${linkButton(row.reason || `${label}一份`, action, row.id, "quiet", Boolean(row.reason))}
        ${!row.reason && bulk > 1 ? linkButton(`${label} ×${bulk}`, action, row.id, "", false, bulk) : ""}
      </div>
    </div>`;
  }).join("") : '<p class="fine">空</p>';
}

function warehouseScreen(warehouse) {
  return `<div class="storage-columns">
    <section><h3>行囊可存</h3>${storageRows(warehouse.carried, "econDeposit")}</section>
    <section><h3>仓中存货 <span class="fine">${warehouse.used}/${warehouse.capacity} 格</span></h3>
      ${storageRows(warehouse.stored, "econWithdraw")}
    </section>
  </div>`;
}

function productionScreen(facility) {
  const upgrade = facility.upgrade;
  const upgradePanel = upgrade ? `<div class="facility-upgrade">
    <p class="fine">${[supplies(upgrade.need), upgrade.cost && `${upgrade.cost} 灵钱`, upgrade.days && `${upgrade.days} 日`].filter(Boolean).map(escape).join(" · ")}</p>
    <div class="actions">${linkButton(upgrade.reason || (facility.level ? "扩建" : "搭建"), "econBuild", facility.id, "", Boolean(upgrade.reason))}</div>
  </div>` : "";
  const jobs = facility.jobs.map(job => card(
    job.name, "", job.ready ? tag("已可领取") : tag(`还需 ${Number(job.remaining.toFixed(2))} 日`, "off"),
    job.ready ? linkButton(job.reason || "收取", "econCollect", job.id, "", Boolean(job.reason)) : "",
  )).join("");
  const projects = facility.projects.map(project => {
    const badge = [project.days && `${project.days} 日`, project.cost && `${project.cost} 灵钱`].filter(Boolean).join(" · ");
    return card(project.name, project.description, badge ? tag(badge, "off") : "",
      linkButton(project.reason || "开始", "econStart", project.id, "", Boolean(project.reason)), "", project.need);
  }).join("");
  return upgradePanel + (jobs ? `<div class="card-grid">${jobs}</div>` : "") +
    (projects ? `<div class="card-grid">${projects}</div>` : "");
}

function yard(s) {
  const { facilities, warehouse } = s.economy;
  const current = facilities.find(facility => facility.id === activeFacility) ?? facilities[0];
  if (!current) return panel("后院", "");
  const entrances = facilities.map(facility => `<button type="button" class="button${facility.id === current.id ? " primary" : " quiet"}"
    data-facility="${escape(facility.id)}" aria-pressed="${facility.id === current.id}">${escape(facility.name)}</button>`).join("");
  const inside = current.id === "warehouse"
    ? warehouseScreen(warehouse) + productionScreen(current)
    : productionScreen(current);
  return panel("后院", `<div class="actions facility-tabs">${entrances}</div>
    <p class="intro facility-intro">${escape(current.desc)}</p>${inside}`, current.level > 0 ? tag(`${current.name} · ${current.level} 级`) : "");
}

function marketItem(s, entry, selling) {
  const item = itemRows[entry.id];
  const gear = data.gear.find(row => row.id === item.id);
  const pill = data.pills.find(row => row.id === item.id);
  const seal = data.talismans.find(row => row.id === item.id);
  const allowed = selling ? entry.canSell : entry.canBuy;
  const label = allowed ? (selling ? "卖出" : "购入") : entry.blockedReason;
  const detail = gear ? gearDescription(item, gear, selling ? s.durability[item.id] : undefined) :
    pill ? pillSummary(pill) : seal ? talismanSummary(seal) : item.desc;
  const price = tag(`${entry.price} 灵钱/件`);
  const quantity = selling && entry.count ? `<span class="fine">可卖 ×${entry.count}</span>` : "";
  const action = selling ? "sell" : "buy";
  const batch = Math.min(5, rules.maxTradeCount, selling ? entry.count : entry.maximum);
  const bulk = allowed && !gear && batch > 1 ? linkButton(`${selling ? "卖出" : "购入"} ×${batch}`, action, item.id, "quiet", false, batch) : "";
  const stock = !selling && Number.isFinite(entry.stock) ? `<span class="fine">摊上余 ${entry.stock}</span>` : "";
  return card(item.name, "", price, `${linkButton(label, action, item.id, "", !allowed)}${bulk}${quantity}${stock}`, detail);
}

function merchantOffer(stall) {
  if (!stall.merchant) return "";
  const info = stall.merchant;
  const order = info.order;
  return `<div class="actions merchant-actions">${linkButton("问货", "merchantTalk", stall.id, "quiet")}</div>
    ${order ? `<details class="merchant-order"><summary>${escape(order.name)}</summary>
      <p class="intro">${escape(order.text)}</p>
      ${order.need ? `<p class="fine">需${escape(supplies(order.need))}</p>` : ""}
      <div class="actions">${linkButton(order.reason || "交给摊主", "merchantOrder", stall.id, "", Boolean(order.reason))}</div>
    </details>` : ""}`;
}

function market(s) {
  if (!inVillage(s)) return panel("坊市", '<p class="section-note">村里的摊主还在，回来再做打算。</p>');
  const modeButton = (id, name) => `<button type="button" class="button${marketMode === id ? " primary" : " quiet"}"
    data-market-mode="${id}" aria-pressed="${marketMode === id}">${name}</button>`;
  const switcher = `<div class="actions market-switch">${modeButton("buy", "摊上的货")}${modeButton("sell", "卖手里的货")}</div>`;
  const contents = marketMode === "sell"
    ? (s.market.sales.length ? `<div class="card-grid">${s.market.sales.map(entry => marketItem(s, entry, true)).join("")}</div>`
      : '<p class="intro">行囊里暂时没有能卖的东西。</p>')
    : s.market.stalls.map(stall => `<section class="market-stall">
      <h3>${escape(stall.name)}</h3>
      <div class="card-grid">${stall.offers.map(entry => marketItem(s, entry, false)).join("")}</div>
      ${merchantOffer(stall)}
    </section>`).join("");
  return panel("坊市", switcher + contents, tag(`灵钱 ${s.coins}`));
}

function alchemy(s) {
  const teacher = s.alchemy;
  const commission = teacher.inquiry;
  const formulae = teacher.offers.map(({ id, name, price, desc, known, reason }) => card(
    name, "", known ? tag("已学会") : tag(`${price} 灵钱`),
    known ? "" : linkButton(reason || "买下丹方", "alchemyBuyFormula", id, "", Boolean(reason)), desc,
  )).join("");
  const inquiry = commission ? `<section class="alchemy-inquiry"><h3>${escape(commission.label)}</h3>
    <p class="intro">${escape(commission.text)}</p>
    ${commission.price ? `<p class="fine">${escape(commission.price)} 灵钱${commission.need ? ` · ${escape(supplies(commission.need))}` : ""}</p>` : ""}
    <div class="actions">${linkButton(commission.reason || "照丹师说的办", "alchemyAdvance", commission.id, "", Boolean(commission.reason))}</div>
  </section>` : "";
  return panel(teacher.name, `<p class="intro">${escape(teacher.intro)}</p>
    <div class="actions">${linkButton("和丹师说话", "alchemyTalk", "", "quiet")}</div>
    ${inquiry}${teacher.progressText ? `<p class="intent">${escape(teacher.progressText)}</p>` : ""}
    ${formulae ? `<details class="merchant-order" open><summary>丹师手里的方子</summary><div class="card-grid">${formulae}</div></details>` : ""}`,
  tag(`灵钱 ${s.coins}`));
}

function questDone(s, row) {
  if (Array.isArray(s.completedQuests)) return s.completedQuests.includes(row.id);
  const status = Array.isArray(s.quests) ? s.quests.find(q => q.id === row.id) : s.quests?.[row.id];
  return status === true || Boolean(status?.done ?? status?.completed);
}

function visibleQuests(s) {
  return s.quests.filter(row => (row.tier ?? 0) <= s.realm.id &&
    !apprenticeQuests.includes(row.id) && row.id !== "sell_forging");
}

function questBoard(s) {
  const list = visibleQuests(s);
  return panel("委托", `<div class="card-grid">${list.map(row => {
    const done = questDone(s, row);
    const unmet = !hasSupply(s, row.need);
    return card(row.name, row.desc,
      done ? tag("已交付", "off") : "",
      done ? "" : linkButton(unmet ? "材料不足" : row.id === "lost_basket_return" ? "交还药篓" : "交付", "handin", row.id, "primary", unmet), "", row.need);
  }).join("")}</div>`);
}

function apprentice(s) {
  const delivery = s.quests.find(quest => quest.id === "lost_basket_return");
  const reeds = s.quests.find(quest => quest.id === "reed_salve" && !quest.completed);
  const waterline = s.quests.find(quest => quest.id === "apprentice_waterline" && !quest.completed);
  const holding = Boolean(s.inventory.lost_basket);
  const basket = holding && delivery ? linkButton("交还药篓", "handin", delivery.id, "primary") : "";
  const tasks = [[reeds, "递一份灵草"], [waterline, "拿灵草换水线图"]].filter(([quest]) => quest)
    .map(([quest, label]) => `<p class="intro">${escape(quest.desc)}</p>
      ${quest.ready ? `<div class="actions">${linkButton(label, "handin", quest.id)}</div>` : ""}`).join("");
  return panel("药僮", `${basket ? `<p class="intro">药僮认出了你手里的竹篓。</p><div class="actions">${basket}</div>` : ""}${tasks || (basket ? "" : '<p class="intro">药僮正忙着看火。</p>')}`);
}

function deductionBoard(s) {
  const cases = s.deductions ?? [];
  if (!cases.length) return panel("沙盘", '<p class="intro">旅途中值得推敲的疑点会收进这里。</p>');
  const current = cases.find(row => row.id === activeDeduction) ?? cases.find(row => !row.completed) ?? cases[0];
  const draft = deductionDrafts.get(current.id) ?? current.thought;
  const casesBar = cases.length > 1 ? `<div class="actions deduction-cases">${cases.map(row => `<button type="button" class="button ${row.id === current.id ? "primary" : ""}" data-case="${escape(row.id)}" aria-pressed="${row.id === current.id}">${escape(row.name)}${row.completed ? " ✓" : ""}</button>`).join("")}</div>` : "";
  const evidence = (s.evidence ?? []).map(item => `<label class="evidence-option"><input type="checkbox" name="evidence" value="${escape(item.id)}"${draft?.evidence.includes(item.id) ? " checked" : ""}>
    <span><strong>${escape(item.name)}</strong><small>${escape(publicText(item.desc))}</small></span></label>`).join("");
  return panel("沙盘", casesBar + `<h3>${escape(current.name)}</h3><p class="intro training-note">${escape(publicText(current.desc))}</p>` +
    (current.completed ? `<p class="intent">${escape(publicText(current.observation))}</p>${thoughtDetails(current.thought)}` :
      `<form class="deduction" data-deduction="${escape(current.id)}">
        ${evidence ? `<details class="deduction-clues"${draft?.evidence.length ? " open" : ""}><summary>摊开随身物件</summary>${evidence}</details>` : ""}
        <label class="deduction-writing">你的猜想
          <textarea name="hypothesis" rows="3" maxlength="180" required>${escape(draft?.hypothesis)}</textarea>
        </label>
        <div class="actions"><button class="button" type="submit">带着猜想去试</button></div>
      </form>`), current.completed ? tag("已在现场验过") : current.thought ? tag("待查证", "warn") : "");
}

function render() {
  const s = view(state);
  const inEncounter = s.mode === "event" || s.mode === "combat" || s.mode === "victory";
  const services = inVillage(s) ? villageServices(s) : [];
  const available = {
    journey: true, village: Boolean(services.length), apprentice: inVillage(s), deduction: Boolean(s.deductions?.length),
    workshop: inVillage(s) && s.services.includes("workshop"),
    market: inVillage(s) && s.services.includes("market"),
    yard: inVillage(s) && Boolean(s.economy),
    alchemy: inVillage(s) && Boolean(s.alchemy),
  };
  for (const service of services) available[service] = true;
  const tab = inEncounter || !available[screen] ? "journey" : screen;
  const content = { journey, village, apprentice, cultivate: cultivation, workshop, market, yard, alchemy, quests: questBoard, deduction: deductionBoard };
  document.querySelector("#clock").textContent = `第${Math.floor(s.day)}日 · ${s.day % 1 < 0.5 ? "白昼" : "夜里"}`;
  document.querySelector("#player-status").innerHTML = stats(s);
  kit.innerHTML = pack(s);
  for (const button of document.querySelectorAll(".navigation button")) {
    button.hidden = inEncounter || button.dataset.tab === tab || !available[button.dataset.tab];
  }
  main.innerHTML = content[tab](s);
}

function selectItem(key) {
  selectedItem = selectedItem === key ? null : key;
  for (const trigger of kit.querySelectorAll("[data-item]")) {
    const open = trigger.dataset.item === selectedItem;
    trigger.setAttribute("aria-expanded", String(open));
    const tools = trigger.parentElement.querySelector(".item-tools");
    if (tools) tools.hidden = !open;
  }
}

function showNotice(lines, warning) {
  if (!lines.length) return;
  const toast = document.createElement("div");
  toast.className = warning ? "toast warning-toast" : "toast";
  for (const line of lines) {
    const text = document.createElement("p");
    text.textContent = line;
    toast.append(text);
  }
  notices.append(toast);
  while (notices.childElementCount > 3) notices.firstElementChild.remove();
  setTimeout(() => toast.remove(), 4400);
}

function feedback(before, after, result, action) {
  if (result.ok && (action === "buy" || action === "sell")) {
    const selling = action === "sell";
    const quantity = item => ((after.inventory[item.id] ?? 0) - (before.inventory[item.id] ?? 0)) * (selling ? -1 : 1);
    const traded = data.items.find(item => quantity(item) > 0);
    if (traded) {
      return [`${selling ? "卖出" : "买入"}${traded.name} ×${quantity(traded)}，${selling ? "收到" : "付出"} ${Math.abs(after.coins - before.coins)} 灵钱。`, result.merchantMessage].filter(Boolean);
    }
  }
  if (result.ok && (action === "econDeposit" || action === "econWithdraw")) {
    const depositing = action === "econDeposit";
    const quantity = item => ((after.inventory[item.id] ?? 0) - (before.inventory[item.id] ?? 0)) * (depositing ? -1 : 1);
    const moved = data.items.find(item => quantity(item) > 0);
    if (moved) return [`${depositing ? "存入" : "取出"}${moved.name} ×${quantity(moved)}。`];
  }
  const lines = [];
  if (result.ok && (action === "attack" || action === "art")) {
    const spent = (data.ammunition ?? []).filter(({ id }) => (before.inventory[id] ?? 0) > (after.inventory[id] ?? 0));
    for (const { id } of spent) lines.push(`消耗${itemRows[id].name} ×${before.inventory[id] - (after.inventory[id] ?? 0)}。`);
  }
  if (result.injury?.amount) {
    const cause = result.injury.cause.replace(/[。！]+$/, "");
    lines.push(`${cause}，气血减少 ${result.injury.amount} 点。`);
  }
  if (result.damageDealt || result.damageTaken) {
    lines.push([
      result.damageDealt && `造成 ${result.damageDealt} 点伤害。`,
      result.damageTaken && `受到 ${result.damageTaken} 点伤害。`,
    ].filter(Boolean).join(""));
  }
  const acquired = data.items.filter(item => (after.inventory[item.id] ?? 0) > (before.inventory[item.id] ?? 0));
  const goods = acquired.filter(item => item.kind !== "key" || item.id === "foundation_pill");
  const clues = acquired.filter(item => item.kind === "key" && item.id !== "foundation_pill");
  const picking = result.ok && action === "take";
  const gathered = supplies(result.gathered);
  let narrative = result.message ?? "";
  if (action === "eat") narrative = narrative.replace(/(?:饱腹|气血)\+\d+(?:\.\d+)?[，。]?/g, "");
  if (result.damageDealt || result.damageTaken) {
    narrative = narrative.replace(/(?:造成|你受了|脱身时受了|另造成)\d+点伤(?:害)?。?/g, "").replace(/反击，[。]?/g, "反击。");
  }
  if (acquired.length) narrative = narrative.replace(/获得[^。]+。/g, "");
  if (picking && acquired.length) narrative = "";
  if (gathered) narrative = narrative.replace(/采得[^。]*，留在脚边。|脚边留下[^。]*。/g, "");
  if (result.injury) narrative = narrative.replace(result.injury.cause, "").replace(/丹毒积重，损失\d+点生命。?/g, "");
  if (result.ok && ["travel", "visit", "revisit"].includes(action)) {
    narrative = narrative.replace(/^(?:抵达[^。]+|在[^。]+遇上[^。]+)。/, "");
  }
  narrative = publicText(narrative).replace(/^初探此地[，。]?/, "").trim();
  if (narrative) lines.push(narrative);
  if (gathered) {
    const region = result.gatheredRegion && result.gatheredRegion !== after.region
      ? data.regions.find(({ id }) => id === result.gatheredRegion)?.name
      : "脚边";
    lines.push(`${action === "choose" ? "采到" : "战利品"}${gathered}，留在${region ?? "原处"}。`);
  }
  if (goods.length) lines.push(`${picking ? "拾起" : "获得"}${goods.map(item => `${item.name} ×${after.inventory[item.id] - (before.inventory[item.id] ?? 0)}`).join("、")}。`);
  if (clues.length) lines.push(`得到线索「${clues.map(item => item.name).join("、")}」。`);
  const didRecover = ["choose", "eat", "use", "rest"].includes(action) && after.hp > before.hp && !result.injury;
  const changes = [
    didRecover && !narrative.includes("气血") && `气血回升 ${after.hp - before.hp} 点`,
    after.qi > before.qi && ["choose", "use", "rest"].includes(action) && !narrative.includes("真气") && "真气恢复",
    after.qi < before.qi && ["choose", "visit", "revisit", "art"].includes(action) && !narrative.includes("真气") && `真气减少 ${before.qi - after.qi} 点`,
    after.satiety > before.satiety && action === "eat" && `饱腹回升 ${Math.floor(after.satiety) - Math.floor(before.satiety)} 点`,
    action === "travel" && Math.floor(after.satiety) < Math.floor(before.satiety) && `赶路消耗 ${Math.floor(before.satiety) - Math.floor(after.satiety)} 点饱腹`,
    after.coins > before.coins && !["sell"].includes(action) && "获得灵钱",
    after.coins < before.coins && ["alchemyBuyFormula", "alchemyAdvance"].includes(action) && `付出 ${before.coins - after.coins} 灵钱`,
  ].filter(Boolean);
  if (changes.length) lines.push(changes.join("，") + "。");
  const overflow = supplies(result.spilled);
  if (overflow) lines.push(`行囊装不下，${overflow}留在脚边。`);
  for (const id of after.discovered) {
    if (!before.discovered.includes(id)) lines.push(`找到去${data.regions.find(region => region.id === id).name}的路。`);
  }
  return lines;
}

function performAction(action, payload) {
  const before = {
    inventory: { ...state.inventory }, discovered: [...state.discovered],
    hp: state.hp, qi: state.qi, satiety: state.satiety, coins: state.coins,
  };
  const result = act(state, action, payload);
  if (["travel", "visit", "choose", "leave", "revisit", "resume"].includes(action)) screen = "journey";
  if (action === "travel" || action === "discard" || action === "take" || action === "equip" || action === "unequip") selectedItem = null;
  render();
  const lines = feedback(before, state, result, action);
  showNotice(lines, Boolean(result.injury || result.damageTaken || !result.ok));
  if (["travel", "visit", "choose", "revisit"].includes(action)) main.scrollIntoView({ block: "nearest" });
}

function readDeduction(form) {
  const selected = new FormData(form);
  return { id: form.dataset.deduction, hypothesis: selected.get("hypothesis"), evidence: selected.getAll("evidence") };
}

function readExperiment(form) {
  const settings = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key.slice("setting-".length), value]));
  return { id: form.dataset.experiment, settings };
}

document.addEventListener("input", event => {
  const form = event.target.form;
  if (form?.dataset.deduction) deductionDrafts.set(form.dataset.deduction, readDeduction(form));
  if (form?.dataset.experiment) experimentDrafts.set(form.dataset.experiment, readExperiment(form).settings);
});

document.addEventListener("submit", event => {
  const form = event.target;
  if (!form.matches("[data-deduction], [data-experiment], [data-quantity]")) return;
  event.preventDefault();
  if (form.dataset.quantity) {
    const { quantity: action, value, itemId } = form.dataset;
    const count = Number(new FormData(form).get("count"));
    const payload = action === "choose" ? { index: Number(value), itemId, count } : { id: value, count };
    performAction(action, payload);
    return;
  }
  if (form.dataset.deduction) {
    const guess = readDeduction(form);
    activeDeduction = guess.id;
    deductionDrafts.set(guess.id, guess);
    performAction("deduce", guess);
  } else {
    const trial = readExperiment(form);
    experimentDrafts.set(trial.id, trial.settings);
    performAction("experiment", trial);
  }
});

document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-skip-opening")) {
    dismissOpening();
    return;
  }
  if (button.dataset.item) {
    selectItem(button.dataset.item);
    return;
  }
  if (button.hasAttribute("data-entry")) {
    button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
    return;
  }
  if (button.hasAttribute("data-help")) {
    guide.showModal();
    return;
  }
  if (button.hasAttribute("data-close")) {
    guide.close();
    return;
  }
  if (button.hasAttribute("data-reset")) {
    if (!window.confirm("重新开始这一局？")) return;
    state = freshGame();
    screen = "journey";
    marketMode = "buy";
    activeFacility = "warehouse";
    selectedItem = null;
    activeDeduction = null;
    deductionDrafts.clear();
    experimentDrafts.clear();
    notices.replaceChildren();
    guide.close();
    render();
    showOpening();
    return;
  }
  if (button.dataset.marketMode) {
    marketMode = button.dataset.marketMode;
    render();
    return;
  }
  if (button.dataset.facility) {
    activeFacility = button.dataset.facility;
    render();
    return;
  }
  if (button.dataset.tab) {
    screen = button.dataset.tab;
    if (screen === "workshop" && state.inventory.hide > 0 && !state.showedHideToSmith) {
      act(state, "showHideToSmith");
    }
    render();
    return;
  }
  if (button.dataset.case) {
    activeDeduction = button.dataset.case;
    render();
    return;
  }
  const action = button.dataset.action;
  if (!action) return;
  const value = button.dataset.value;
  const payload = action === "choose" ? { index: Number(value) } :
    action === "unequip" ? { slot: value } : { id: value, count: Number(button.dataset.count ?? 1) };
  performAction(action, payload);
});

render();
document.querySelector("#boot-status").hidden = true;
app.hidden = false;
showOpening();
