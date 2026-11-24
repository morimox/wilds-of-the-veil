import { data } from "./data.mjs";
import { act, createGame, handConflict, rules, view } from "./engine.mjs";
import { saleTotal } from "./economy.mjs";
import { banditRules } from "./bandits.mjs";

const itemRows = Object.fromEntries(data.items.map(item => [item.id, item]));
const foodRows = Object.fromEntries(data.foods.map(food => [food.id, food]));
const formulaIds = new Set(data.recipes.flatMap(recipe => recipe.formula ? [recipe.formula] : []));
const enemyRows = Object.fromEntries(data.enemies.map(enemy => [enemy.id, enemy]));
const slotNames = data.equipmentSlots;
const intentNames = { attack: "进攻", heavy: "重击", guard: "防御", dodge: "闪避", heal: "疗伤", remedy: "服药", drain: "吸取真气", focus: "蓄势" };
const kindNames = { material: "材料", food: "口粮", object: "随身物件", gear: "装备", pill: "丹药", talisman: "符箓", key: "线索", ammo: "弹药", manual: "内功" };
const weaponNames = { fist: "拳与指虎", sword: "剑", blade: "刀斧", spear: "枪戟", staff: "棍杖", hammer: "锤", bow: "弓", crossbow: "弩" };
const manualRankName = new Intl.NumberFormat("zh-CN-u-nu-hanidec");
const serviceNames = { cultivate: "修行", workshop: "工坊", market: "坊市", quests: "委托" };
const apprenticeQuests = ["lost_basket_return", "reed_salve", "apprentice_waterline"];
const app = document.querySelector("#app");
const main = document.querySelector("#main");
const guide = document.querySelector("#help");
const kit = document.querySelector("#kit");
const notices = document.querySelector("#notices");
const opening = document.querySelector("#opening");
const transfer = document.querySelector("#transfer");
const instantRoutes = ["gateJump", "gateScroll", "arrayJump"];
const roadTravelActions = ["travel", "roadContinue", "roadBack"];
const banditPaymentActions = ["banditPay", "banditPayCoins", "banditPayItem", "banditSurrender"];
let state = freshGame();
let screen = "journey";
let marketMode = "buy";
let activeFacility = "warehouse";
let openingTimer;
let transferTimer;
let selectedItem = null;
let combatObservation = null;
const kitSectionOpen = new Map();
let activeDeduction = null;
let atlasProvince = null;
let atlasPoint = null;
let atlasIndexOpen = false;
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

function dismissTransfer() {
  if (transfer.hidden) return;
  clearTimeout(transferTimer);
  transfer.hidden = true;
  app.inert = false;
  main.querySelector("button")?.focus({ preventScroll: true });
}

function showTransfer() {
  const province = data.provinces.find(({ id }) => id === data.regionDetails[state.region].province);
  transfer.dataset.province = province.id;
  transfer.querySelector("h2").textContent = province.name;
  transfer.querySelector("p").textContent = province.arrival;
  app.inert = true;
  transfer.hidden = false;
  transfer.querySelector("[data-skip-transfer]").focus({ preventScroll: true });
  transferTimer = setTimeout(dismissTransfer, matchMedia("(prefers-reduced-motion: reduce)").matches ? 950 : 1700);
}

function freshGame() {
  return createGame(crypto.getRandomValues(new Uint32Array(1))[0] || 1);
}

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function linkButton(label, action, value = "", tone = "", disabled = false, count = 1, descriptionId = "") {
  return `<button type="button" class="button ${tone}" data-action="${action}" data-value="${escape(value)}"${count > 1 ? ` data-count="${count}"` : ""}${descriptionId ? ` aria-describedby="${escape(descriptionId)}"` : ""}${disabled ? " disabled" : ""}>${escape(label)}</button>`;
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

function onOpenRoad(s) {
  return s.mode === "road" && !s.roadTrip?.bandit;
}

function atLanding(s) {
  return inVillage(s) && s.region.id === "village";
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
  const showsQi = s.knownArts.length > 0 || s.pressure > rules.pressureThreshold || Boolean(s.combatFist?.chargeName);
  if (s.satiety === 0) warnings.push("空腹乏力");
  if (!meal && s.satiety < rules.rationSatiety) warnings.push("口粮已尽");
  if (s.toxin >= rules.toxinThreshold) warnings.push("丹毒发作");
  const tolerance = s.fogTolerance ?? rules.pressureThreshold;
  const danger = s.pressure > tolerance;
  const marks = Array.from({ length: tolerance }, (_, i) =>
    `<i class="${i < s.pressure ? "filled" : ""}"></i>`).join("");
  const fog = s.pressure >= rules.pressureThreshold ? `<details class="pressure${danger ? " danger" : ""}">
    <summary>${danger ? "雾压过重" : "雾压"} <span class="fog-marks" aria-hidden="true">${marks}</span></summary>
    <span>雾积满后，再探索会耗真气。到有人歇脚的地方就会散去。</span>
  </details>` : "";
  const canEat = s.mode !== "victory" && (s.mode !== "road" || onOpenRoad(s)) && meal && (s.satiety < s.maxSatiety || s.hp < s.maxHp);
  const canUseSalve = s.hp < s.maxHp && s.inventory.salve > 0 && (["village", "field", "combat"].includes(s.mode) || onOpenRoad(s));
  const sense = s.spiritSense;
  return `<div class="player-line"><span class="realm">${escape(s.realm.name)}</span>
    ${vital("气血", s.hp, s.maxHp, s.hp / s.maxHp < 0.3, "气血耗尽会倒下。敷伤药或在据点歇息都能恢复。")}
    ${canUseSalve ? linkButton("敷伤药", "use", "salve", "quick-eat") : ""}
    ${vital("饱腹", s.satiety, s.maxSatiety, s.satiety < 24, `每过一日少 ${rules.satietyDrainPerDay} 点。吃一份干粮补 ${rules.rationSatiety} 点。`)}
    ${canEat ? linkButton(`吃${itemRows[meal.id].name}`, "eat", meal.id, "quick-eat") : ""}
    ${showsQi ? vital("真气", s.qi, s.maxQi, s.qi < s.maxQi / 3, "施展术诀、打出部分招式或在雾中久留会消耗真气。歇息时能恢复。") : ""}
    ${sense ? `<details class="vital sense"><summary>神识 <b>${sense.current}/${sense.max}</b><span class="meter-track" aria-hidden="true"><i style="--fill:${100 * sense.current / sense.max}%"></i></span></summary><p>用一点神识，能减轻这一回合的伤。对方若已经拿定了招，也能看清它。歇息能恢复神识。</p></details>` : ""}
    ${warnings.map(text => `<span class="warning">${text}</span>`).join("")}${fog}</div>`;
}

function distance(units) {
  return `${units * banditRules.distanceUnit} 里`;
}

function routeAction(road, edges = []) {
  const label = road.rescue ? `慢慢走到${road.name}` : road.id === "village" ? "回村" : `去${road.name}`;
  const forecast = [road.meals && Object.keys(road.meals).length && `途中吃 ${supplies(road.meals)}`,
    road.emptyOnArrival && !road.rescue && "到时会空腹"].filter(Boolean).join(" · ");
  const note = [road.units != null && distance(road.units), `${road.days} 日`, road.via?.length && `经 ${road.via.join("、")}`,
    road.reason || forecast].filter(Boolean).join(" · ");
  const path = road.path ?? [];
  const directlyConnects = ({ from, to }) => path.some((id, index) => (id === from && path[index + 1] === to) || (id === to && path[index + 1] === from));
  const warnings = [...new Set(edges.filter(edge => edge.riskText && directlyConnects(edge)).map(edge => edge.riskText))];
  return `<div class="route-action">${linkButton(label, "travel", road.id, "", !road.available)}
    <div class="route-notes"><span class="fine">${escape(note)}</span>${warnings.map(warning => `<p class="fine route-warning">${escape(warning)}</p>`).join("")}</div></div>`;
}

function siteResources(s, site) {
  const stock = (site?.stockDetails ?? []).map(({ label, count, renewable }) =>
    count > 0 ? `${label} ×${count}` : `${label}${renewable ? "已采空" : "已取尽"}`);
  const witnessedEnemies = site?.witnessedEnemies ?? [];
  const creatures = Object.entries(site?.creatures ?? {}).filter(([id]) => witnessedEnemies.includes(id)).map(([id, count]) =>
    count > 0 ? `${enemyRows[id].name} ×${count}` : `暂未见${enemyRows[id].name}`);
  return [...stock, ...creatures].join(" · ");
}

function siteList(s) {
  return `<div class="site-list">${(s.sites ?? []).map(site => {
    const stateText = [siteResources(s, site), site.hasGroundLoot && "留有物品"].filter(Boolean).join(" · ");
    return `<div class="site-row">${linkButton(site.name, "visit", site.id, "", s.satiety <= 0)}${stateText ? `<span class="fine">${escape(stateText)}</span>` : ""}</div>`;
  }).join("")}</div>`;
}

function hazardNotice(hazard) {
  if (!hazard) return "";
  return `<section class="local-incident"><h3>${escape(hazard.title)}</h3><p class="intro">${escape(hazard.desc)}</p>
    ${hazard.actions.length ? `<div class="actions">${hazard.actions.map(({ id, label, reason }) =>
      `<div class="route-action">${linkButton(label, "hazard", id, "", Boolean(reason))}${reason ? `<p class="fine">${escape(reason)}</p>` : ""}</div>`).join("")}</div>` : ""}</section>`;
}

function roadPosition(road) {
  if (!road) return "";
  const from = road.fromName ?? road.from;
  const to = road.toName ?? road.to;
  const onLastStep = road.legUnits > 0 && road.progress >= road.legUnits;
  const location = onLastStep ? `${to}附近` : from && to && from !== to ? `${from}与${to}之间` : from || to || "";
  return `<p class="road-position" aria-label="行程进度"><strong>去${escape(road.destinationName ?? road.destination)}</strong><span>还剩 ${distance(road.remainingUnits)}</span>${location ? `<small>${escape(location)}</small>` : ""}</p>`;
}

function banditOffers(bandit) {
  const offers = (bandit.offers ?? []).filter(offer => offer.count > 0 && offer.price > 0);
  if (!offers.length) return "";
  const expanded = main.querySelector("[data-road-offers]")?.open;
  const rows = offers.map(({ id, name, held, count, price }) => {
    const quantity = Math.min(count, Math.ceil(bandit.remaining / price));
    const entry = `road-offer-${id}`;
    const first = linkButton("交 1 件", "banditPayItem", id, "quiet", false, 1, entry);
    const batch = quantity > 1 ? linkButton(`交 ${quantity} 件`, "banditPayItem", id, "quiet", false, quantity, entry) : "";
    return `<div class="road-offer"><span id="${escape(entry)}">${escape(name)} <small class="fine">×${held ?? count} · 每件抵 ${price} 灵钱</small></span><div class="actions">${first}${batch}</div></div>`;
  });
  return `<details class="road-offers" data-road-offers${expanded ? " open" : ""}><summary>拿东西抵价</summary>${rows.join("")}</details>`;
}

function banditScreen(bandit) {
  const remaining = bandit.remaining;
  const askingForMoney = !bandit.aftermath && remaining != null;
  const pay = !askingForMoney ? "" : bandit.coins >= remaining ? linkButton(`付 ${remaining} 灵钱`, "banditPay", "", "primary")
    : bandit.coins > 0 ? linkButton(`先付 ${bandit.coins} 灵钱`, "banditPayCoins") : "";
  const surrender = askingForMoney && bandit.allValue < remaining
    ? linkButton(bandit.allValue ? "交出所有能抵价的东西" : "亮出空钱袋，请他放行", "banditSurrender", "", "quiet") : "";
  const fight = !bandit.aftermath && bandit.fightAllowed !== false ? linkButton("动手闯过去", "banditFight", "", "danger") : "";
  const pass = bandit.passAllowed ? `<div class="actions">${linkButton("从旁边过去", "banditPass", "", "quiet")}</div>` : "";
  const ask = bandit.actions ?? [];
  const plot = ask.map(({ id, label, desc, available, reason }) => `<div class="choice">
    ${desc ? `<p>${escape(desc)}</p>` : ""}${linkButton(label, "banditPlot", id, "quiet", available === false)}
    ${reason ? `<p class="choice-blocker">${escape(reason)}</p>` : ""}</div>`).join("");
  return panel(bandit.aftermath ? "交手之后" : bandit.name, `<p class="intro">${escape(bandit.intro)}</p>
    ${askingForMoney ? `<p class="road-demand">开价 ${bandit.fee} 灵钱${remaining !== bandit.fee ? ` · 还差 ${remaining} 灵钱` : ""}<span class="fine">钱袋 ${bandit.coins} 灵钱</span></p>` : ""}
    ${pay || surrender || fight ? `<div class="actions">${pay}${surrender}${fight}</div>` : ""}
    ${askingForMoney ? banditOffers(bandit) : ""}${plot ? `<div class="choice-list">${plot}</div>` : ""}${pass}`);
}

function roadScreen(s) {
  const road = s.roadTrip;
  if (road.bandit) return banditScreen(road.bandit);
  const turnBack = road.fromName ? `折回${road.fromName}` : "沿原路折返";
  return panel("路上", `<div class="actions place-actions">${linkButton("继续赶路", "roadContinue", "", "primary")}
    ${linkButton(turnBack, "roadBack", "", "quiet")}</div>`);
}

function journey(s) {
  if (s.mode === "event") return eventScreen(s);
  if (s.mode === "combat") return combatScreen(s);
  if (s.mode === "road") return roadScreen(s);
  if (s.mode === "victory") {
    const final = s.completionPhase === "final";
    return panel(final ? "旧渡通行契" : "旧渡重新开船", `<p class="intro">${final ? "村里收到了衡印。送信的人乘渡船出发，去给沿岸驿站送通行文书。" : "渡口重新点起了灯。第一趟船也带回了岭外的消息。"}</p><div class="actions">${linkButton("继续上路", "resume", "", "primary")}</div>`);
  }
  const roads = [...s.world.roads].sort((left, right) => left.days - right.days);
  const nearby = roads.slice(0, 5);
  const further = roads.slice(5);
  const isHome = inVillage(s);
  const originalHome = atLanding(s);
  const needRest = s.hp < s.maxHp || s.qi < s.maxQi || s.wounds || s.toxin || s.pressure || (s.inventory.ration ?? 0) < rules.reliefRations ||
    (s.spiritSense && s.spiritSense.current < s.spiritSense.max);
  return panel(s.region.name, `${siteList(s)}${hazardNotice(s.localHazard)}<div class="actions place-actions">
    ${nearby.map(road => routeAction(road, s.world.edges)).join("")}
    ${originalHome ? tabButton("找药僮", "apprentice") : ""}
    ${originalHome && s.services.includes("workshop") ? tabButton("去工坊", "workshop") : ""}
    ${originalHome && s.services.includes("market") ? tabButton("逛坊市", "market") : ""}
    ${isHome && !originalHome && s.localMarket ? tabButton("买卖", "localMarket") : ""}
    ${isHome && !originalHome && s.repairService ? `<span class="fine">${escape(s.repairService.description)}</span>` : ""}
    ${originalHome && s.economy ? tabButton("去后院", "yard") : ""}
    ${originalHome && s.alchemy ? tabButton("找丹师", "alchemy") : ""}
    ${isHome && (needRest || !originalHome) ? linkButton("歇息", "rest") : ""}
    ${s.restSessions > 1 ? linkButton(`歇到缓过来 · ${s.restSessions * rules.restDays}日`, "restUntilRecovered", "", "quiet") : ""}
    ${s.sect ? tabButton("找宗门管事", "sect") : ""}
    ${s.tournament ? tabButton("去看宗门大比", "tournament") : ""}
    ${isHome && s.training?.some(({ region }) => region === s.region.id) ? tabButton("请教修习", "training") : ""}
    ${!isHome ? linkButton("等半日", "wait", "", "quiet", s.satiety <= 0) : ""}
  </div>${further.length ? `<details class="route-list"><summary>其他已知去路</summary><div class="actions">${further.map(road => routeAction(road, s.world.edges)).join("")}</div></details>` : ""}
  ${s.world.crossings.map(({ label, reason }) => `<p class="fine crossing">${escape(label)} · ${escape(reason)}</p>`).join("")}`);
}

function atlasMap(province, points, selected, route, edges) {
  const byId = Object.fromEntries(points.map((point) => [point.id, point]));
  const paths = new Set();
  const routeLegs = new Set((route?.path ?? []).slice(1).map((id, index) => [route.path[index], id].sort().join("/")));
  const lines = [];
  for (const { from, to } of edges ?? []) {
    const point = byId[from];
    const neighbor = byId[to];
    const path = [from, to].sort().join("/");
    if (!point || !neighbor || paths.has(path)) continue;
    paths.add(path);
    const dx = neighbor.x - point.x;
    const dy = (neighbor.y - point.y) / 1.45;
    lines.push(`<i aria-hidden="true" class="atlas-road${routeLegs.has(path) ? " chosen" : ""}" style="--x:${point.x}%;--y:${point.y}%;--length:${Math.hypot(dx, dy)}%;--angle:${Math.atan2(dy, dx)}rad"></i>`);
  }
  const marks = points.map(point => `<button type="button" class="atlas-mark${point.current ? " here" : ""}${point.settlement ? " town" : ""}${point.attuned ? " linked" : ""}"
    style="--x:${point.x}%;--y:${point.y}%" data-atlas-point="${escape(point.id)}" aria-label="${escape(point.name)}" aria-pressed="${point.id === selected.id}">
    <span class="atlas-dot"></span><span class="atlas-label">${escape(point.name)}</span></button>`).join("");
  return `<div class="atlas-map atlas-${escape(province)}" aria-label="已知地点位置">${lines.join("")}${marks}</div>`;
}

function arrayLedger(array) {
  if (!array) return "";
  if (array.active) return '<p class="fine">这里的传送阵已修好。两边都修好后，就能跨州传送。</p>';
  const rows = Object.entries({ ...array.need, coins: array.coins }).map(([id, total]) => {
    const paid = id === "coins" ? array.coinsPaid : array.paid[id] ?? 0;
    const maximum = array.limits[id] ?? 0;
    return `<div class="array-row"><span>${escape(id === "coins" ? "灵钱" : itemRows[id].name)} <b>${paid}/${total}</b></span>
      ${maximum ? `${linkButton("交一份", "arrayContribute", id, "quiet")}${maximum > 1 ? linkButton(`交 ${maximum}`, "arrayContribute", id, "quiet", false, maximum) : ""}` : ""}</div>`;
  }).join("");
  return `<section class="atlas-local"><h3>修跨州传送阵</h3><p class="fine">${escape(array.reason)}</p>${rows}</section>`;
}

function atlas(s) {
  const world = s.world;
  const province = atlasProvince && world.points.some(({ province: id }) => id === atlasProvince) ? atlasProvince : world.province;
  const points = world.points.filter((point) => point.province === province);
  const selected = points.find(({ id }) => id === atlasPoint) ?? points.find(({ current }) => current) ?? points[0];
  const tabs = world.provinces.filter(({ id }) => world.points.some(({ province: known }) => known === id)).map(({ id, name }) =>
    `<button type="button" class="button ${id === province ? "primary" : "quiet"}" data-atlas-province="${escape(id)}" aria-pressed="${id === province}">${escape(name)}</button>`).join("");
  if (!selected) return panel("山河图", "");
  const idle = s.mode !== "event";
  const road = idle && world.journeys.find(({ id }) => id === selected.id);
  const gate = world.gates.find(({ id }) => id === selected.id);
  const array = idle && world.arrays.find(({ id }) => id === selected.id);
  const marks = [selected.current ? "你在这里" : "", selected.settlement ? "可歇息" : "", selected.attuned ? "传送门已点亮" : ""].filter(Boolean).join(" · ");
  const currentGate = idle && selected.current && world.localGate && !world.localGate.attuned;
  const recipe = data.recipes.find(({ id }) => id === "r_gate_scroll");
  const makeScroll = idle && s.settlement && s.discoveredRecipes.includes(recipe.id);
  const scrollBlocker = makeScroll && s.craftReasons[recipe.id];
  const usable = gate && !selected.current;
  const transport = `<div class="actions atlas-actions">
      ${road ? routeAction(road, world.edges) : ""}
      ${currentGate ? linkButton("点亮传送门", "attuneGate") : ""}
      ${idle && usable && world.localGate?.attuned && selected.province === world.province ? linkButton(`门间传送 · ${gate.price} 灵钱`, "gateJump", gate.id, "", !gate.available) : ""}
      ${usable && world.scrollCount ? linkButton(`展开卷轴 · 余 ${world.scrollCount} 张`, "gateScroll", gate.id, "", !gate.byScroll) : ""}
      ${array && selected.id !== s.region.id && world.localArray?.active ? linkButton(`跨州传送 · ${array.price} 灵钱`, "arrayJump", array.id, "", !array.available) : ""}
      ${makeScroll && selected.current ? linkButton(scrollBlocker || "制备传送卷轴", "craft", recipe.id, "quiet", Boolean(scrollBlocker)) : ""}
    </div>`;
  return panel("山河图", `<div class="actions atlas-tabs" aria-label="州">${tabs}</div>
    ${atlasMap(province, points, selected, road, world.edges)}
    <details class="atlas-index"${atlasIndexOpen ? " open" : ""}><summary>查已知地点</summary><div class="actions">${points.map(({ id, name }) =>
      `<button type="button" class="button quiet" data-atlas-point="${escape(id)}">${escape(name)}</button>`).join("")}</div></details>
    <div class="atlas-place"><h3>${escape(selected.name)}</h3>${marks ? tag(marks) : ""}
    <p class="intro">${escape(selected.description)}</p>${transport}
    ${makeScroll && selected.current ? `<p class="fine">每批 ${recipe.count} 张 · ${recipe.cost} 灵钱 · ${escape(supplies(recipe.need))}</p>` : ""}
    ${array && !array.available && selected.id !== s.region.id && world.localArray?.active ? `<p class="fine">${escape(array.reason)}</p>` : ""}
    </div>${idle && selected.current ? arrayLedger(world.localArray) : ""}`);
}

function eventScreen(s) {
  const event = s.currentEvent;
  const local = (s.sites ?? []).find(site => site.id === event.id);
  const painted = ["marsh", "ridge", "ford", "hidden"].includes(s.region.id);
  const resources = siteResources(s, local);
  const gathering = s.gathering;
  const description = s.mechanism?.complete ? s.mechanism.text : event.text;
  const choices = s.visibleChoices.map(choice => {
    const cue = publicText(choice.desc);
    const blocker = choice.lockedReason;
    const active = gathering?.index === choice.index;
    const button = linkButton(choice.label, choice.gather?.length ? "beginGather" : "choose", choice.index, "", Boolean(gathering) || !choice.available);
    return `<div class="choice">
      ${cue ? `<p class="choice-cue">${escape(cue)}</p>` : ""}
      ${button}
      ${choice.cost ? `<p class="fine">花费 ${choice.cost} 灵钱</p>` : ""}
      ${active ? '<div class="gather-progress"><span aria-live="polite">采集中…</span><progress max="1" value="0" aria-label="采集进度" data-gather-progress tabindex="-1"></progress></div>' : ""}
      ${blocker ? `<p class="choice-blocker">${escape(blocker)}</p>` : ""}
    </div>`;
  }).join("");
  return panel(event.name, `${painted ? `<div class="scene scene-${escape(s.region.id)}" aria-hidden="true"></div>` : ""}
    <p class="intro">${escape(publicText(description))}</p>
    ${resources ? `<p class="site-stock">${escape(resources)}</p>` : ""}
    <div class="choice-list">${choices}</div>
    ${s.mechanism && !s.mechanism.complete ? mechanismPanel(s.mechanism) : ""}
    ${s.experiment ? `<fieldset class="event-experiment"${gathering ? " disabled" : ""}>${experimentForm(s.experiment)}</fieldset>` : ""}
    <div class="actions">${linkButton("离开", "leave", "", "quiet", Boolean(gathering))}</div>`, tag(s.region.name));
}

function mechanismPanel(puzzle) {
  const readings = puzzle.readout.map(({ name, value }) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join("");
  const notes = puzzle.mode === "sequence" && puzzle.sequence.length ? `<p class="fine">刚才的顺序　${puzzle.sequence.map(({ label }) => escape(label)).join(" · ")}</p>` : "";
  return `<section class="mechanism"><h3>${escape(puzzle.title)}</h3><p class="intro">${escape(puzzle.desc)}</p>
    ${puzzle.leadText ? `<p class="fine">${escape(puzzle.leadText)}</p>` : ""}
    ${readings ? `<dl class="mechanism-reading">${readings}</dl>` : ""}${notes}
    <div class="actions">${puzzle.moves.map(({ id, label }) => linkButton(label, "mechanismMove", id, "quiet", !puzzle.canMove)).join("")}</div>
    <div class="actions">${linkButton(puzzle.tryLabel ?? "试试机关", "mechanismTry", "", "primary", !puzzle.canTry)}${linkButton("恢复原样", "mechanismReset", "", "quiet", !puzzle.canReset)}</div>
    ${puzzle.reason ? `<p class="fine">${escape(puzzle.reason)}</p>` : ""}</section>`;
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
  return [row.hp && "恢复气血", row.qi && "恢复真气", row.satiety && "充饥", row.toxin < 0 && "减轻丹毒", row.wound && "减轻伤势", row.focus && "加强下一次术诀"].filter(Boolean).join(" · ");
}

function talismanSummary(row) {
  return [row.damage && "伤敌", row.guard && "少受伤", row.retreat && "撤退时好脱身"].filter(Boolean).join(" · ");
}

function artSummary(row) {
  return ["消耗真气", row.pierce && "能穿甲", row.guard && "少受伤", row.break && "能截断重招与调息"].filter(Boolean).join(" · ");
}

function combatScreen(s) {
  const enemy = s.currentEnemy;
  const intent = s.intent;
  const hp = s.enemyHp ?? enemy.currentHp ?? enemy.hp;
  const arts = data.arts.filter(row => s.knownArts.includes(row.id));
  const weapon = s.combatWeapon;
  const side = s.combatOffhand;
  const fist = s.combatFist;
  const canMainAttack = Boolean(weapon?.id && (!weapon.needsAmmo || weapon.isLoaded));
  const ordinaryPunch = !fist?.name || ["徒手", "徒手出拳"].includes(fist.name) ? "徒手出拳" : `用${fist.name}出拳`;
  const ammoBar = weapon?.needsAmmo ? `<div class="combat-ammo">
    <p class="fine">${escape(weapon.name)} · ${weapon.isLoaded ? "已备弹药" : "弹药已尽，可徒手出手"}</p>
    <div class="actions">${(weapon.ammo ?? []).map(ammo => linkButton(
      `${ammo.name} ×${ammo.count}`, "selectAmmo", ammo.id, ammo.selected ? "primary" : "quiet", ammo.count <= 0 || ammo.selected,
    )).join("")}</div>
  </div>` : "";
  const backup = weapon?.needsAmmo && !weapon.isLoaded && weapon.meleeAlternative;
  const openingShot = intent && s.openingShotReady;
  const charging = s.chargingWeapon;
  const mainCharged = charging?.slot === "weapon" && charging.id === weapon?.id;
  const sideCharged = charging?.slot === "offhand" && charging.id === side?.id;
  const fistCharged = charging?.slot === "fist";
  const mainBlocked = Boolean(charging && !mainCharged);
  const sideBlocked = Boolean(charging && !sideCharged);
  const attackLabel = !canMainAttack ? ordinaryPunch : weapon.chargeRequired ? `用${weapon.name}${mainCharged ? "打出" : "蓄力"}`
    : weapon.weaponClass === "fist" ? `用${weapon.name}出拳` : openingShot ? "抢先放箭" : `用${weapon.name}出手`;
  const sideLabel = side?.chargeRequired ? `用${side.name}${sideCharged ? "打出" : "蓄力"}` : side && `用${side.name}出手`;
  const fistChargeLabel = fistCharged ? `打出${fist?.chargeName ?? charging.name}` : `蓄力 · ${fist?.chargeName}`;
  const fistChargeReason = (!charging || fistCharged) && fist?.chargeReason?.replace(/[。！]+$/, "");
  const fistChargeDisabled = (!fistCharged && Boolean(charging)) || !fist?.chargeAvailable || Boolean(fistChargeReason);
  const guardLabel = intent?.kind === "heavy" ? "挡住重招" : intent?.kind === "guard" && s.breathingQi ? "收势调息" : "防御";
  const flight = intent && s.retreatRisk;
  const retreatLabel = enemy.sparring ? "认输" : "撤退";
  const retreatCue = flight?.blocked ? (flight.wouldFall ? "对方正要出手，这时脱不开身，挨上一招可能会倒下。" : "对方正要出手，这时脱不开身。")
    : flight ? "对方这回合没在进攻，可以找空当脱身。" : "";
  const intentLine = intent
    ? `<div class="intent"><b>看破来招 · ${escape(intent.name)}</b>　${escape(intentNames[intent.kind])}</div>`
    : `<p class="intent unread">${s.combatRead === "enemy" ? "对方盯着你的起手，没先露招。" : "一时看不清对方的来招。"}</p>`;
  const openingNote = openingShot ? "对方还隔着一段路。这一回合放箭，能拦住它的头一扑。"
    : !intent && s.openingShotPossible ? "还隔着一段路。对方若冲来，首箭能拦一下。" : "";
  const chargeNote = [
    charging && (fistCharged ? '拳劲已收住，可以打出这一拳。' : `${charging.name}已经蓄好力，可以出手。`),
    s.enemyCharged && "对方已经攒足了劲。",
  ].filter(Boolean).join("");
  const spiritLabel = intent || s.combatRead === "enemy" ? "凝神护身" : "凝神看招";
  const observation = enemy.desc ? `<details class="field-note"${combatObservation === state.combat ? " open" : ""}><summary>观察对手</summary><p>${escape(publicText(enemy.desc))}</p></details>` : "";
  const techniques = arts.map(row => {
    const reason = row.tier > s.realm.id ? `${tierName(row.tier)}可施展` : s.qi < row.cost ? "真气不足" :
      weapon?.needsAmmo && !weapon.isLoaded && row.weaponBased !== false ? "弹药已尽"
        : mainBlocked && row.weaponBased !== false ? "先取消蓄力"
          : weapon?.chargeRequired && !mainCharged && row.weaponBased !== false ? "兵器须先蓄力" : "";
    const action = intent?.kind === "heal" && row.break > 0 ? "施展 · 压住调息" : "施展";
    return card(row.name, "", "", linkButton(reason || action, "art", row.id, "", Boolean(reason)), row.desc);
  });
  return panel(enemy.name, `
    ${intentLine}
    ${openingNote ? `<p class="fine">${openingNote}</p>` : ""}
    ${chargeNote ? `<p class="fine">${escape(chargeNote)}</p>` : ""}
    ${enemy.sparring ? '<p class="fine">约好点到为止，一方撑不住就收招。</p>' : ""}
    ${meter("对方气血", hp, enemy.maxHp)}
    ${ammoBar}
    <div class="actions">${linkButton(attackLabel, !canMainAttack && fist ? "fistAttack" : "attack", "", fistCharged ? "" : "primary", mainBlocked)}
      ${side ? linkButton(sideLabel, "offhandAttack", "", "", sideBlocked) : ""}
      ${canMainAttack && fist && weapon.weaponClass !== "fist" ? linkButton(ordinaryPunch, "fistAttack", "", "", Boolean(charging)) : ""}
      ${fist?.chargeName || fistCharged ? linkButton(fistChargeReason ? `${fistChargeLabel}（${fistChargeReason}）` : fistChargeLabel,
        "fistCharge", "", fistCharged ? "primary" : "", fistChargeDisabled) : ""}
      ${linkButton(guardLabel, "guard")}
      <span class="action-hint">${linkButton("闪避", "dodge", "", "", false, 1, "dodge-explanation")}<span class="item-tip" id="dodge-explanation" role="tooltip">侧身躲开来招。若被击中，照常受伤。</span></span>
      ${charging ? linkButton("取消蓄力", "cancelCharge", "", "quiet") : ""}
      ${linkButton(retreatLabel, "retreat", "", flight?.blocked ? "danger" : "quiet", false, 1, retreatCue ? "retreat-cue" : "")}
      ${backup ? linkButton(`换用${backup.name}`, "combatEquip", backup.id, "quiet") : ""}
      ${s.spiritSense ? linkButton(spiritLabel, "readSpirit", "", "quiet", !s.spiritSense.canRead) : ""}
    </div>
    ${retreatCue ? `<p class="fine retreat-cue" id="retreat-cue">${escape(retreatCue)}</p>` : ""}
    ${s.lastEnemyIntent ? `<p class="fine">上回合 · ${escape(s.lastEnemyIntent.name)}</p>` : ""}
    ${observation}
    ${techniques.length ? `<div class="card-grid learned-arts">${techniques.join("")}</div>` : ""}
    `, tag(tierName(enemy.tier), "warn"));
}

function gearCondition(remaining, total) {
  return !remaining ? "损坏" : remaining / total < 0.25 ? "将坏" : remaining < total ? "磨损" : "完好";
}

function gearDescription(item, gear, remaining) {
  const entry = gear.entry || `${tierName(gear.tier)}散修可用。${item.desc}`;
  const ranged = gear.ammo?.length ? "遇上从远处冲来的对手，可放箭拦住它的头一扑。" : "";
  const perception = gear.perception >= 5 ? "完好时，持用它能明显帮你察觉来招。"
    : gear.perception >= 3 ? "完好时，持用它更容易察觉来招。"
    : gear.perception > 0 ? "完好时，持用它略能帮你察觉来招。"
    : gear.perception < 0 ? "持用时，较难察觉对手的来招。" : "";
  const reflection = [gear.trait, ...(gear.traits ?? [])].find(trait => trait?.kind === "reflect");
  const reflect = reflection && !/反伤|反震/.test(entry)
    ? `挨下近身${reflection.intent === "heavy" ? "重招" : "普攻"}而受伤时，能把部分力道震回去。` : "";
  const charge = gear.chargeRequired && !/蓄势|蓄力/.test(entry) ? "得先蓄势才能用它出招。" : "";
  const description = entry + perception + reflect + ranged + charge + (gear.hands === 2 ? "须双手使用，副手要空出来。" : "");
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

function manualDescription(book, active = false) {
  const specialty = [...new Set(book.specialty.map(kind => weaponNames[kind]).filter(Boolean))].join("、");
  const rank = manualRankName.format(book.rank);
  const rankText = book.rank >= book.maxRank ? `已练到最高的第${rank}层。`
    : `已练到第${rank}层，可练至第${manualRankName.format(book.maxRank)}层。`;
  return [book.grade && `${book.grade}内功。`, book.desc, book.effect, specialty && `专练${specialty}。`,
    active && book.aligned && "手头的打法合它的路数。", rankText].filter(Boolean).join(" ");
}

function manualActions(book, active, canManage, canTrain) {
  if (!canManage) return "";
  const stance = active ? linkButton("收功", "unequipManual", book.id)
    : linkButton(book.canEquip ? "运功" : book.equipReason || "暂不能运功", "equipManual", book.id, "", !book.canEquip);
  const upgrade = book.upgrade;
  if (!upgrade) return stance;
  const canUpgrade = canTrain && upgrade.available;
  const cost = [upgrade.need.map(row => `${row.name} ×${row.count}`).join("、"), upgrade.coins && `${upgrade.coins} 灵钱`]
    .filter(Boolean).join("、");
  const requirements = [cost && `需${cost}。`, upgrade.days > 0 && `用时 ${upgrade.days} 日。`,
    !canTrain ? "到歇脚处再练。" : !upgrade.available && upgrade.reason].filter(Boolean).join(" ");
  return stance + linkButton("研习下一层", "upgradeManual", book.id, "quiet", !canUpgrade) +
    (requirements ? `<p class="fine manual-upgrade-note">${escape(requirements)}</p>` : "");
}

function pack(s) {
  const canEquip = inVillage(s) || s.mode === "field" || s.mode === "event" || onOpenRoad(s);
  const canManageManual = canEquip && !s.gathering;
  const canUse = canEquip || s.mode === "combat";
  const canEat = canUse;
  const repair = s.mode === "village" ? s.repairService : null;
  function repairAction(id, remaining, durability) {
    const price = repair?.prices[id];
    if (price == null || remaining >= durability) return "";
    return linkButton(`修理 · ${price}钱`, "repair", id, "quiet", s.coins < price);
  }
  const worn = Object.entries(s.equipment).filter(([, id]) => id).map(([slot, id]) => {
    const gear = data.gear.find(row => row.id === id);
    const remaining = s.durability[id] ?? gear.durability;
    return itemSlot(itemRows[id], "worn", gearDescription(itemRows[id], gear, remaining),
      (canEquip ? linkButton("卸下", "unequip", slot) : "") + repairAction(id, remaining, gear.durability),
      slotNames[slot]);
  });
  const manuals = new Map((s.innerStyle?.books ?? []).map(book => [book.id, book]));
  const activeManual = s.innerStyle?.active;
  if (activeManual) worn.push(itemSlot(itemRows[activeManual.id], "worn", manualDescription(activeManual, true),
    manualActions(activeManual, true, canManageManual, !onOpenRoad(s)), "内功"));
  const carried = data.items.filter(row => s.inventory[row.id] && row.id !== activeManual?.id && !Object.values(s.equipment).includes(row.id));
  const inventory = carried.filter(row => row.kind !== "key" || row.breakthrough).map(row => {
    const gear = data.gear.find(g => g.id === row.id);
    const pill = data.pills.find(g => g.id === row.id);
    const seal = data.talismans.find(g => g.id === row.id);
    const book = manuals.get(row.id);
    let actions = "";
    if (gear) {
      const remaining = s.durability[row.id] ?? gear.durability;
      const conflict = handConflict(s.equipment, row.id);
      const disabled = Boolean(conflict) || gear.tier > s.realm.id || remaining <= 0;
      const reason = conflict.slice(0, -1);
      actions = (canEquip ? linkButton(reason || "装备", "equip", row.id, "", disabled) : "") +
        (s.mode === "combat" && gear.slot === "weapon" ? linkButton(reason || "换用兵刃", "combatEquip", row.id, "", disabled) : "") +
        repairAction(row.id, remaining, gear.durability);
    }
    if (pill && canUse) {
      const healthy = row.id === "salve" && s.hp >= s.maxHp;
      const label = row.id === "salve" ? (healthy ? "气血已满" : "敷伤药") : "服用";
      actions = linkButton(label, "use", row.id, "", pill.tier > s.realm.id || healthy);
    }
    if (seal && s.mode === "combat") actions = linkButton("用符", "use", row.id, "", seal.tier > s.realm.id);
    if (book) actions = manualActions(book, false, canManageManual, !onOpenRoad(s));
    if (foodRows[row.id] && canEat && (s.satiety < s.maxSatiety || s.hp < s.maxHp)) {
      actions = linkButton(`吃${row.name}`, "eat", row.id);
      const quantity = s.batchMeals[row.id];
      if (quantity > 1) actions += linkButton(`连吃 ${quantity} 份`, "batchEat", row.id, "quiet");
    }
    if (row.id === "lost_basket" && canEquip && !onOpenRoad(s)) {
      if (!s.basketInspected) actions += linkButton("查看药篓", "inspectBasket");
      if (inVillage(s)) actions += tabButton("找药僮", "apprentice");
      actions += linkButton("拆篓取药", "unpackBasket", "", "danger");
    }
    if (row.id === "gate_scroll" && canEquip && !s.gathering && !onOpenRoad(s)) actions += tabButton("展开卷轴", "atlas");
    if (canEquip && !row.breakthrough) actions += linkButton("放下", "discard", row.id, "quiet");
    const description = book ? manualDescription(book) : gear ? gearDescription(row, gear, s.durability[row.id] ?? gear.durability) : pill ? pillSummary(pill) : seal ? talismanSummary(seal) : row.desc;
    return itemSlot(row, "held", description, actions, "", s.inventory[row.id]);
  });
  const keys = carried.filter(row => row.kind === "key" && !row.breakthrough);
  const keySlot = row => itemSlot(row, "clue", row.desc, "", "", s.inventory[row.id]);
  const clues = keys.filter(row => !formulaIds.has(row.id)).map(keySlot);
  const formulae = keys.filter(row => formulaIds.has(row.id)).map(keySlot);
  const ground = canEquip ? Object.entries(s.groundLoot ?? {}).map(([id, count]) => {
    const item = itemRows[id];
    const gear = data.gear.find(row => row.id === id);
    const maximum = s.groundPickup?.[id] ?? 0;
    const label = maximum === count ? "拾取全部" : maximum ? `拾取 ${maximum}` : "拿不了";
    const cue = maximum ? `${label} · ${item.name}` : gear ? `${item.name}暂时拿不了` : `${item.name} · 行囊已满`;
    return `<div class="ground-row">
      ${itemSlot(item, "ground", gear ? gearDescription(item, gear, s.groundWear[id]) : item.desc, "", "", count)}
      <button type="button" class="button quiet" data-action="take" data-value="${escape(id)}" aria-label="${escape(cue)}"${s.gathering || !maximum ? " disabled" : ""}>${label}</button>
    </div>`;
  }) : [];
  const capacityLabel = `已用${s.backpackUsed}格，共${s.backpackCapacity}格`;
  const useProgress = s.backpackCapacity > 20;
  const meter = useProgress
    ? `<progress class="pack-meter" max="${s.backpackCapacity}" value="${s.backpackUsed}" aria-label="${capacityLabel}"></progress>`
    : `<div class="bag-slots" role="img" aria-label="${capacityLabel}">${Array.from({ length: s.backpackCapacity }, (_, i) => `<i${i < s.backpackUsed ? ' class="filled"' : ""}></i>`).join("")}</div>`;
  const room = s.backpackUsed >= s.backpackCapacity ? "已满" : s.backpackUsed >= s.backpackCapacity - 2 ? "快满了" : "有空位";
  return `<section class="kit-section"><h2>装备</h2>${worn.join("") || '<p class="fine">空</p>'}</section>
    <section class="kit-section"><div class="kit-head"><h2>${escape(s.backpackName)}</h2><span class="fine" title="${capacityLabel}">${useProgress ? `${s.backpackUsed}/${s.backpackCapacity} 格` : room}</span></div>
      ${meter}
      ${inventory.join("") || '<p class="fine">空</p>'}
    </section>
    ${kitDetails("clues", "线索", clues, clues.length <= 5)}
    ${kitDetails("formulae", "丹方", formulae)}
    ${ground.length ? `<section class="kit-section"><h2>脚边</h2>${ground.join("")}</section>` : ""}`;
}

function kitDetails(id, label, rows, defaultOpen = false) {
  if (!rows.length) return "";
  return `<details class="kit-section formula-kit"${(kitSectionOpen.get(id) ?? defaultOpen) ? " open" : ""}>
    <summary data-kit-section="${id}">${label} · ${rows.length}</summary>${rows.join("")}
  </details>`;
}

function villageServices(s) {
  return s.services.filter(service => service !== "workshop" && service !== "market" &&
    (service !== "quests" || visibleQuests(s).length));
}

function village(s) {
  return panel(atLanding(s) ? "村务" : `${s.region.name}的事务`, `<div class="actions place-actions">${villageServices(s).map(service => tabButton(serviceNames[service], service)).join("")}</div>`);
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
    household.hide > 0 && recipes.some(row => row.id === "r_hide_coat") &&
      "工匠捻了捻兽革。「这皮韧，攒两张，我给你缝件挡牙的褂子。」",
    s.inventory.eddy_note > 0 && recipes.some(row => row.id === "r_bank_talisman") &&
      "工匠用炭条描过回汊图上的弯道。「把这道弯画在纸符上。有人追你时，你能借它侧身脱开。」",
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
    const reason = s.craftReasons[row.id];
    const entry = gear ? gearDescription(result, gear) : pill ? pillSummary(pill) : talisman ? talismanSummary(talisman) : result.desc;
    return card(result.name, `${row.cost} 灵钱 · ${row.days} 日`, tag(kindNames[result.kind] ?? ""),
      linkButton(reason || "制备", "craft", row.id, "", Boolean(reason)), entry, row.need);
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
  const unload = Object.keys(warehouse.materialPlan).length ? `<div class="actions">
    ${linkButton("存放原料", "econStoreMaterials", "", "quiet")}
    <span class="fine">${escape(supplies(warehouse.materialPlan))}</span>
  </div>` : "";
  return `<div class="storage-columns">
    <section><h3>行囊可存</h3>${unload}${storageRows(warehouse.carried, "econDeposit")}</section>
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
    job.name, "", tag(`${job.batches > 1 ? `${job.batches} 批 · ` : ""}${job.ready ? "已完工" : `还需 ${Number(job.remaining.toFixed(2))} 日`}`, job.ready ? "" : "off"),
    `<span class="fine">${escape(supplies(job.loot))}</span>` + (job.ready ?
      linkButton(job.reason || "收进行囊", "econCollect", job.id, "", Boolean(job.reason)) +
      (!job.storeReason || job.storeReason === "仓架放不下了。"
        ? linkButton(job.storeReason || "收进仓库", "econStoreJob", job.id, "quiet", Boolean(job.storeReason)) : "") : ""),
  )).join("");
  const wait = facility.wait;
  const waitAction = wait ? `<div class="actions">
    ${linkButton(wait.days ? `${wait.ready ? "等到完工" : "等一阵"} · ${wait.days} 日` : "先吃点东西", "econWait", facility.id, "quiet", !wait.days)}
    ${wait.days ? `<span class="fine">饱腹 −${Number(wait.satiety.toFixed(3))}</span>` : ""}
  </div>` : "";
  const projects = facility.projects.map(project => {
    const badge = [project.days && `${project.days} 日`, project.cost && `${project.cost} 灵钱`].filter(Boolean).join(" · ");
    const bulk = project.batches.length ? `<details class="route-list">
      <summary>合批做</summary>${project.batches.map(batch => `<div class="actions">
        ${linkButton(`做 ${batch.count} 批`, "econStart", project.id, "quiet", false, batch.count)}
        <span class="fine">${escape([supplies(batch.need), batch.cost && `${batch.cost} 灵钱`, `${batch.days} 日`].filter(Boolean).join(" · "))}</span>
      </div>`).join("")}
    </details>` : "";
    return card(project.name, project.description, badge ? tag(badge, "off") : "",
      linkButton(project.reason || "做一批", "econStart", project.id, "", Boolean(project.reason)) + bulk, "", project.need);
  }).join("");
  return upgradePanel + (jobs ? `<div class="card-grid">${jobs}</div>${waitAction}` : "") +
    (projects ? `<div class="card-grid">${projects}</div>` : "");
}

function yard(s) {
  const { facilities, warehouse, backpack } = s.economy;
  const options = backpack ? [...facilities, { id: "backpack", name: "皮匠", desc: backpack.desc }] : facilities;
  const current = options.find(facility => facility.id === activeFacility) ?? options[0];
  if (!current) return panel("后院", "");
  const entrances = options.map(facility => `<button type="button" class="button${facility.id === current.id ? " primary" : " quiet"}"
    data-facility="${escape(facility.id)}" aria-pressed="${facility.id === current.id}">${escape(facility.name)}</button>`).join("");
  const inside = current.id === "backpack" ? backpackScreen(backpack) : (
    (current.id === "warehouse" ? warehouseScreen(warehouse) : "") + productionScreen(current));
  return panel("后院", `<div class="actions facility-tabs">${entrances}</div>
    <p class="intro facility-intro">${escape(current.desc)}</p>${inside}`, current.level > 0 ? tag(`${current.name} · ${current.level} 级`) : "");
}

function backpackScreen(backpack) {
  const upgrades = backpack.upgrades.map((row) => card(row.name, row.desc, tag(`${row.capacity} 格`),
    `<span class="fine">${row.cost} 枚灵钱 · ${row.days} 日</span>` +
      linkButton(row.label, "econExpandPack", row.capacity, "", Boolean(row.reason)) +
      (row.reason ? `<span class="fine">${escape(row.reason)}</span>` : ""),
    "", row.need)).join("");
  return `<p class="fine">随身用的是${escape(backpack.name)}，共 ${backpack.capacity} 格。</p>
    ${upgrades ? `<div class="card-grid">${upgrades}</div>` : ""}`;
}

function salePriceTag(entry) {
  const label = entry.demand ? `${entry.demand.reserve}–${entry.demand.regular}` : entry.price;
  return tag(`${label} 灵钱/件`);
}

function saleDemandNote({ demand }) {
  if (!demand) return "";
  const note = demand.remaining ? `常价还收 ${demand.remaining} 件，余货每件 ${demand.reserve} 灵钱。`
    : `这批常价已收满。第${Math.floor(demand.nextAt)}日再收，眼下每件 ${demand.reserve} 灵钱。`;
  return `<span class="fine">${note}</span>`;
}

function saleButtonLabel(label, entry, count) {
  return entry.demand ? `${label} · ${saleTotal(entry, count)} 灵钱` : label;
}

function regularSaleButton(entry, action, batch) {
  const count = entry.demand?.remaining;
  return count > 1 && count < batch
    ? linkButton(saleButtonLabel(`常价卖出 ×${count}`, entry, count), action, entry.id, "quiet", false, count)
    : "";
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
  const price = selling ? salePriceTag(entry) : tag(`${entry.price} 灵钱/件`);
  const quantity = selling && entry.count ? `<span class="fine">可卖 ×${entry.count}</span>` : "";
  const action = selling ? "sell" : "buy";
  const batch = Math.min(entry.demand ? rules.maxTradeCount : 5, selling ? entry.count : entry.maximum);
  const batchLabel = `${selling ? "卖出" : "购入"} ×${batch}`;
  const bulk = allowed && !gear && batch > 1 ? linkButton(saleButtonLabel(batchLabel, entry, batch), action, item.id, "quiet", false, batch) : "";
  const regular = selling && allowed ? regularSaleButton(entry, action, batch) : "";
  const stock = !selling && Number.isFinite(entry.stock) ? `<span class="fine">摊上余 ${entry.stock}</span>` : "";
  return card(item.name, "", price, `${linkButton(allowed ? saleButtonLabel(label, entry, 1) : label, action, item.id, "", !allowed)}${regular}${bulk}${quantity}${stock}${saleDemandNote(entry)}`, detail);
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
  const specialized = s.market.sales.filter(({ canSell }) => canSell);
  const fallback = s.localMarket?.buys.filter((entry) => !specialized.some(({ id }) => id === entry.id)) ?? [];
  const contents = marketMode === "sell"
    ? (specialized.length || fallback.length ? `<div class="card-grid">${specialized.map(entry => marketItem(s, entry, true)).join("")}${fallback.map(entry => localMarketItem(entry, true)).join("")}</div>`
      : '<p class="intro">行囊里暂时没有能卖的东西。</p>')
    : s.market.stalls.map(stall => `<section class="market-stall">
      <h3>${escape(stall.name)}</h3>
      <div class="card-grid">${stall.offers.map(entry => marketItem(s, entry, false)).join("")}</div>
      ${merchantOffer(stall)}
    </section>`).join("");
  return panel("坊市", marketSwitcher() + contents, tag(`灵钱 ${s.coins}`));
}

function marketSwitcher() {
  const button = (id, name) => `<button type="button" class="button${marketMode === id ? " primary" : " quiet"}"
    data-market-mode="${id}" aria-pressed="${marketMode === id}">${name}</button>`;
  return `<div class="actions market-switch">${button("buy", "摊上的货")}${button("sell", "卖手里的货")}</div>`;
}

function localMarketItem(entry, selling) {
  const item = itemRows[entry.id];
  const gear = data.gear.find(({ id }) => id === item.id);
  const pill = data.pills.find(({ id }) => id === item.id);
  const maximum = selling ? Math.min(entry.count, rules.maxTradeCount) : entry.maximum;
  const label = selling ? "卖出" : "购入";
  const action = selling ? "localSell" : "localBuy";
  const reason = entry.reason || (selling ? "暂不能出手" : entry.count ? "眼下买不了" : "已卖完");
  const buttons = linkButton(maximum ? saleButtonLabel(label, entry, 1) : reason, action, item.id, "", !maximum) +
    (selling ? regularSaleButton(entry, action, maximum) : "") +
    (maximum > 1 ? linkButton(saleButtonLabel(`${label} ×${maximum}`, entry, maximum), action, item.id, "quiet", false, maximum) : "");
  const stock = `<span class="fine">${selling ? "可卖" : "在摊"} ×${entry.count}</span>`;
  return card(item.name, "", selling ? salePriceTag(entry) : tag(`${entry.price} 灵钱/件`), `${buttons}${stock}${saleDemandNote(entry)}`,
    gear ? gearDescription(item, gear) : pill ? pillSummary(pill) : item.desc);
}

function localMarketScreen(s) {
  const selling = marketMode === "sell";
  const rows = selling ? s.localMarket.buys : s.localMarket.offers;
  const talk = s.localMarket.talk;
  return panel(`${s.region.name}集市`, `${marketSwitcher()}${talk ? `<div class="actions">${linkButton(talk.label, "localAsk", "", "quiet")}</div>` : ""}${rows.length ? `<div class="card-grid">${rows.map(entry => localMarketItem(entry, selling)).join("")}</div>` :
    '<p class="intro">行囊里暂时没有能卖的东西。</p>'}`, tag(`灵钱 ${s.coins}`));
}

function sectScreen(s) {
  const sect = s.sect;
  const joining = sect.join;
  const jobs = sect.joined ? sect.jobs.map(job => card(job.name, job.desc, tag(`${job.credit} 功劳`),
    linkButton(job.reason || "交这班差事", "sectWork", job.id, "", !job.available), "", job.need)).join("") : "";
  const ranks = sect.joined ? sect.ranks.map(rank => {
    const art = data.arts.find(({ id }) => id === rank.art);
    return card(rank.name, [supplies(rank.reward), art?.name].filter(Boolean).join(" · "), tag(`${rank.credit} 功劳`),
      rank.claimed || rank.honorary ? "" : linkButton(rank.reason || "领门中回礼", "sectClaim", rank.id, "", !rank.available));
  }).join("") : "";
  const invitation = sect.joined ? "" : joining.returning ? '<p class="fine">退门前的功劳还在。</p>' :
    `<p class="fine">入门 ${joining.coins} 灵钱 · ${escape(supplies(joining.need))}</p>`;
  const button = sect.joined ? linkButton("向管事辞行", "sectLeave", "", "quiet") :
    linkButton(joining.reason || (joining.returning ? "回师门" : "向管事投帖"), "sectJoin", "", "", !joining.available);
  return panel(sect.name, `<p class="intro">${escape(sect.desc)}</p>${invitation}<div class="actions">${button}</div>
    ${jobs ? `<div class="card-grid">${jobs}${ranks}</div>` : ""}`, sect.joined ? tag(`${sect.credit} 功劳`) : "");
}

function tournamentScreen(s) {
  const match = s.tournament;
  const opponent = match.match;
  const blocker = match.enrolled ? match.fightReason : match.enrollReason;
  return panel(match.name, `<p class="intro">${escape(match.desc)}</p>
    ${match.result ? `<p class="fine">${escape(match.result)}</p>` : ""}
    ${opponent ? `<p class="intro">${escape(opponent.name)} · ${escape(opponent.opponent)}<br>${escape(opponent.note)}</p>` : ""}
    ${blocker ? `<p class="fine">${escape(blocker)}</p>` : ""}
    ${match.claimBlocked ? `<p class="fine">${escape(match.claimBlocked)}</p>` : ""}
    <div class="actions">
      ${!match.enrolled ? linkButton(`报名 · ${match.fee} 灵钱`, "tournamentEnroll", "", "", !match.canEnroll) : ""}
      ${match.enrolled ? linkButton("登台过招", "tournamentFight", "", "primary", !match.canFight) : ""}
      ${match.canWithdraw ? linkButton("跟裁判说退赛", "tournamentWithdraw", "", "quiet") : ""}
      ${match.canClaim ? linkButton(match.claimName || "领取奖品", "tournamentClaim") : ""}
    </div>`, match.enrolled ? tag(`已胜 ${match.wins} 场`) : "");
}

function trainingScreen(s) {
  const rows = s.training ?? [];
  const contents = rows.map(track => {
    const where = data.regions.find(({ id }) => id === track.region)?.name;
    const teacher = [track.trainer, where].filter(Boolean).join(" · ");
    const status = track.level ? `${track.level}/${track.maxLevel} 阶` : "还没学";
    const next = track.next;
    const payment = next ? `${supplies(next.need)} · ${next.coins} 灵钱 · ${next.days} 日` : "";
    const button = next ? linkButton(track.blockedReason || "交材料，跟师傅学", "trainStudy", track.id, "", !track.available) : "";
    return `<article class="card study-track"><h3>${escape(track.name)} ${tag(status)}</h3>
      <p>${escape(track.desc)}</p><p class="fine">${escape(teacher)}</p>
      ${track.level ? `<p class="study-effect">${escape(track.effect)}</p>` : ""}
      ${next ? `<p class="fine">下一阶 ${escape(next.effect)}</p><p class="fine">${escape(payment)}</p>` : ""}
      ${button ? `<div class="actions">${button}</div>` : ""}</article>`;
  }).join("");
  const affiliation = s.affiliation ? tag(`${s.affiliation.name} · ${s.affiliation.credit} 功劳`) : "";
  return panel("修习进度", `<div class="card-grid">${contents}</div>`, affiliation);
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
    const note = !done && row.blockedReason ? ` ${row.blockedReason}` : "";
    return card(row.name, row.desc + note,
      done ? tag("已交付", "off") : "",
      done ? "" : linkButton(row.ready ? "交付" : "暂不能交付", "handin", row.id, "primary", !row.ready), "", row.need);
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

const focusKeys = ["data-action", "data-value", "data-count", "data-tab", "data-facility",
  "data-market-mode", "data-case", "data-item", "data-atlas-province", "data-atlas-point"];

function keyboardFocus() {
  const control = document.activeElement;
  if (!control?.matches("button:focus-visible")) return null;
  const area = control.closest("#main, #player-status, #kit, .navigation");
  if (!area) return null;
  const keys = focusKeys.filter(key => control.hasAttribute(key))
    .map(key => `[${key}="${CSS.escape(control.getAttribute(key))}"]`).join("");
  return { area, keys };
}

function restoreKeyboardFocus(focus) {
  if (!focus) return;
  const candidates = focus.keys ? [...focus.area.querySelectorAll(`button${focus.keys}:enabled`)] : [];
  const inspected = focus.area === kit && selectedItem ? kit.querySelector(`[data-item="${CSS.escape(selectedItem)}"]`) : null;
  const chosen = candidates.find(control => control.getClientRects().length) ?? inspected ??
    [...main.querySelectorAll("button:enabled")].find(control => control.getClientRects().length);
  if (chosen) {
    chosen.focus({ preventScroll: true });
  } else {
    const heading = main.querySelector("h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
}

function render() {
  const focus = keyboardFocus();
  const s = view(state);
  if (s.mode !== "combat") combatObservation = null;
  const inEvent = s.mode === "event";
  const inEncounter = s.mode === "combat" || s.mode === "victory" || s.mode === "road" || Boolean(s.gathering);
  const services = inVillage(s) ? villageServices(s) : [];
  const originalHome = atLanding(s);
  const knowMap = s.region.id !== "village" || s.discovered.length > 2 || Object.keys(s.eventsSeen).length > 0;
  const available = {
    journey: true, village: Boolean(services.length), apprentice: originalHome, deduction: Boolean(s.deductions?.length),
    workshop: originalHome && s.services.includes("workshop"), market: originalHome && s.services.includes("market"),
    yard: originalHome && Boolean(s.economy), alchemy: originalHome && Boolean(s.alchemy),
    atlas: knowMap && (!inEvent || s.world.scrollCount > 0), localMarket: inVillage(s) && !originalHome && Boolean(s.localMarket),
    sect: inVillage(s) && Boolean(s.sect), tournament: inVillage(s) && Boolean(s.tournament), training: Boolean(s.training?.length),
  };
  for (const service of services) available[service] = true;
  const tab = inEncounter || !available[screen] || (inEvent && screen !== "atlas") ? "journey" : screen;
  const content = { journey, village, apprentice, cultivate: cultivation, workshop, market, yard, alchemy, quests: questBoard,
    deduction: deductionBoard, atlas, localMarket: localMarketScreen, sect: sectScreen, tournament: tournamentScreen, training: trainingScreen };
  document.querySelector("#clock").textContent = `第${Math.floor(s.day)}日 · ${s.day % 1 < 0.5 ? "白昼" : "夜里"}`;
  document.querySelector("#player-status").innerHTML = stats(s);
  kit.innerHTML = pack(s);
  for (const button of document.querySelectorAll("#player-status [data-action], #kit [data-action]")) {
    if (s.gathering) button.disabled = true;
  }
  for (const button of document.querySelectorAll(".navigation button")) {
    const id = button.dataset.tab;
    button.hidden = inEncounter || id === tab || !available[id] || (inEvent && !["journey", "atlas"].includes(id));
  }
  guide.querySelector('[data-tab="training"]').hidden = !available.training || inEncounter || inEvent;
  main.innerHTML = roadPosition(s.roadTrip) + content[tab](s);
  restoreKeyboardFocus(focus);
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
  const ate = action === "eat" || action === "batchEat";
  const rested = action === "rest" || action === "restUntilRecovered";
  if (result.ok && ["buy", "sell", "localBuy", "localSell"].includes(action)) {
    const selling = action === "sell" || action === "localSell";
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
  if (result.ok && banditPaymentActions.includes(action)) {
    const cost = [result.paidCoins > 0 && `${result.paidCoins} 灵钱`, supplies(result.paidGoods)].filter(Boolean).join("、");
    if (cost) lines.push(`交出${cost}。`);
  }
  if (result.roadCoins > 0) lines.push(`从路上捡到 ${result.roadCoins} 灵钱。`);
  if (result.ok && (action === "attack" || action === "art")) {
    const spent = (data.ammunition ?? []).filter(({ id }) => (before.inventory[id] ?? 0) > (after.inventory[id] ?? 0));
    for (const { id } of spent) lines.push(`消耗${itemRows[id].name} ×${before.inventory[id] - (after.inventory[id] ?? 0)}。`);
  }
  if (result.injury?.amount) {
    const cause = result.injury.cause.replace(/[。！]+$/, "");
    lines.push(`${cause}，气血减少 ${result.injury.amount} 点。`);
  }
  if (result.damageDealt || result.damageTaken) {
    const reflected = result.reflectedDamage ? `，其中反伤 ${result.reflectedDamage} 点` : "";
    lines.push([
      result.damageDealt && `造成 ${result.damageDealt} 点伤害${reflected}。`,
      result.damageTaken && `受到 ${result.damageTaken} 点伤害。`,
    ].filter(Boolean).join(""));
  }
  const acquired = data.items.filter(item => (after.inventory[item.id] ?? 0) > (before.inventory[item.id] ?? 0));
  const goods = acquired.filter(item => item.kind !== "key" || item.id === "foundation_pill");
  const clues = acquired.filter(item => item.kind === "key" && item.id !== "foundation_pill");
  const picking = result.ok && action === "take";
  const gathered = supplies(result.gathered);
  let narrative = result.message ?? "";
  if (result.paidCoins || Object.keys(result.paidGoods ?? {}).length) {
    narrative = narrative.replace(/^你(?:递给他|交出|交了)[^。]+。/, "").replace(/他还要\d+枚。/, "");
  }
  if (result.roadCoins) narrative = narrative.replace(/从他掉下的钱袋里捡到\d+枚灵钱。/, "");
  if (ate) narrative = narrative.replace(/(?:饱腹|气血)\+\d+(?:\.\d+)?[，。]?/g, "");
  if (result.damageDealt || result.damageTaken) {
    narrative = narrative.replace(/(?:造成|你受了|脱身时受了|另造成)\d+点伤(?:害)?。?/g, "")
      .replace(/，造成\d+点反伤。/g, "。").replace(/反击，[。]?/g, "反击。");
  }
  if (acquired.length) narrative = narrative.replace(/获得[^。]+。/g, "");
  if (picking && acquired.length) narrative = "";
  if (gathered) narrative = narrative.replace(/采得[^。]*，留在脚边。|脚边留下[^。]*。/g, "");
  if (result.injury) narrative = narrative.replace(result.injury.cause, "").replace(/丹毒积重，损失\d+点生命。?/g, "");
  if (result.ok && !result.roadInterrupted && [...roadTravelActions, "visit", "revisit"].includes(action)) {
    narrative = narrative.replace(/^(?:抵达[^。]+|在[^。]+遇上[^。]+)。/, "");
  }
  if (result.travelMeals) narrative = narrative.replace(/途中吃了[^。]+。/, "");
  if (!result.ok || (action !== "batchEat" && action !== "restUntilRecovered")) narrative = publicText(narrative);
  narrative = narrative.replace(/^初探此地[，。]?/, "").trim();
  if (narrative) lines.push(narrative);
  if (supplies(result.travelMeals)) lines.push(`途中吃了${supplies(result.travelMeals)}。${result.roadInterrupted ? "停步" : "抵达"}时饱腹 ${Math.floor(after.satiety)} 点。`);
  if (gathered) {
    const place = result.gatheredRegion && result.gatheredRegion !== after.region
      ? data.sites.find(({ id }) => id === result.gatheredSite)?.name ?? data.regions.find(({ id }) => id === result.gatheredRegion)?.name
      : "脚边";
    lines.push(`${["choose", "finishGather"].includes(action) ? "采到" : "战利品"}${gathered}，留在${place ?? "原处"}。`);
  }
  if (goods.length) lines.push(`${picking ? "拾起" : "获得"}${goods.map(item => `${item.name} ×${after.inventory[item.id] - (before.inventory[item.id] ?? 0)}`).join("、")}。`);
  if (result.leftOnGround) lines.push(`行囊装不下剩下的，${supplies(result.leftOnGround)}留在脚边。`);
  if (clues.length) lines.push(`得到线索「${clues.map(item => item.name).join("、")}」。`);
  const didRecover = (ate || rested || action === "choose" || action === "use") && after.hp > before.hp && !result.injury;
  const changes = [
    didRecover && !narrative.includes("气血") && `气血回升 ${after.hp - before.hp} 点`,
    action === "guard" && after.qi > before.qi && `真气回升 ${after.qi - before.qi} 点`,
    after.qi > before.qi && (rested || action === "choose" || action === "use") && !narrative.includes("真气") && "真气恢复",
    after.qi < before.qi && ["choose", "visit", "revisit", "art", "fistCharge"].includes(action) && !narrative.includes("真气") && `真气减少 ${before.qi - after.qi} 点`,
    after.satiety > before.satiety && (ate || action === "use") && `饱腹回升 ${Math.floor(after.satiety) - Math.floor(before.satiety)} 点`,
    action === "restUntilRecovered" && Math.floor(after.satiety) < Math.floor(before.satiety) && `饱腹减少 ${Math.floor(before.satiety) - Math.floor(after.satiety)} 点`,
    action === "finishGather" && Math.floor(after.satiety) < Math.floor(before.satiety) && `饱腹减少 ${Math.floor(before.satiety) - Math.floor(after.satiety)} 点`,
    roadTravelActions.includes(action) && !result.travelMeals && Math.floor(after.satiety) < Math.floor(before.satiety) && `赶路消耗 ${Math.floor(before.satiety) - Math.floor(after.satiety)} 点饱腹`,
    after.coins > before.coins && !result.roadCoins && !banditPaymentActions.includes(action) && action !== "sell" && "获得灵钱",
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
  const transferred = result.ok && instantRoutes.includes(action);
  if ([...roadTravelActions, "visit", "choose", "leave", "revisit", "resume"].includes(action) || transferred) screen = "journey";
  if (transferred || (result.ok && roadTravelActions.includes(action))) {
    atlasProvince = null;
    atlasPoint = null;
  }
  if ([...roadTravelActions, "discard", "take", "equip", "unequip"].includes(action)) selectedItem = null;
  if (result.ok && action === "equipManual") selectedItem = `worn-${payload.id}`;
  if (result.ok && action === "unequipManual") selectedItem = `held-${payload.id}`;
  render();
  if (action === "beginGather" && result.ok) {
    runGatherProgress(state.gathering);
    return;
  }
  const lines = feedback(before, state, result, action);
  showNotice(lines, Boolean(result.injury || result.damageTaken || !result.ok));
  if (transferred) showTransfer();
  if ([...roadTravelActions, "visit", "choose", "revisit"].includes(action)) main.scrollIntoView({ block: "nearest" });
}

function runGatherProgress(job) {
  const bar = main.querySelector("[data-gather-progress]");
  const duration = Math.max(750, job.days * 2000);
  const startedAt = performance.now();
  bar.focus({ preventScroll: true });
  function tick(now) {
    if (state.gathering !== job) return;
    bar.value = Math.min(1, (now - startedAt) / duration);
    if (bar.value < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  setTimeout(() => {
    if (state.gathering !== job) return;
    const restoreFocus = document.activeElement === bar;
    performAction("finishGather");
    if (restoreFocus && state.event === job.siteId) {
      const next = main.querySelector(`[data-action="beginGather"][data-value="${job.index}"]:enabled`) ??
        main.querySelector('[data-action="leave"]');
      next?.focus({ preventScroll: true });
    }
  }, duration);
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
  if (!form.matches("[data-deduction], [data-experiment]")) return;
  event.preventDefault();
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
  const observation = event.target.closest(".field-note > summary");
  if (observation && state.combat) combatObservation = observation.parentElement.open ? null : state.combat;
  const summary = event.target.closest("summary[data-kit-section]");
  if (summary) kitSectionOpen.set(summary.dataset.kitSection, !summary.parentElement.open);
  const atlasSummary = event.target.closest(".atlas-index > summary");
  if (atlasSummary) atlasIndexOpen = !atlasSummary.parentElement.open;
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-skip-opening")) {
    dismissOpening();
    return;
  }
  if (button.hasAttribute("data-skip-transfer")) {
    dismissTransfer();
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
    kitSectionOpen.clear();
    atlasProvince = null;
    atlasPoint = null;
    atlasIndexOpen = false;
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
  if (button.dataset.atlasProvince) {
    atlasProvince = button.dataset.atlasProvince;
    atlasPoint = null;
    render();
    main.querySelector(`[data-atlas-province="${atlasProvince}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.atlasPoint) {
    const origin = button.closest(".atlas-index") ? ".atlas-index" : ".atlas-map";
    atlasPoint = button.dataset.atlasPoint;
    atlasProvince = data.regionDetails[atlasPoint].province;
    render();
    main.querySelector(`${origin} [data-atlas-point="${atlasPoint}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.tab) {
    screen = button.dataset.tab;
    if (guide.open) guide.close();
    if (screen === "workshop" && !state.showedHideToSmith) {
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
  const payload = ["choose", "beginGather"].includes(action) ? { index: Number(value) } :
    action === "unequip" ? { slot: value } : action === "take" ? { id: value } : { id: value, count: Number(button.dataset.count ?? 1) };
  performAction(action, payload);
});

render();
document.querySelector("#boot-status").hidden = true;
app.hidden = false;
showOpening();
