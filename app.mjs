import { data } from "./data.mjs";
import { act, createGame, handConflict, rules, view } from "./engine.mjs";
import { economyData, saleTotal } from "./economy.mjs";
import { banditRules } from "./bandits.mjs";

const itemRows = Object.fromEntries(data.items.map(item => [item.id, item]));
const foodRows = Object.fromEntries(data.foods.map(food => [food.id, food]));
const formulaIds = new Set(data.recipes.flatMap(recipe => recipe.formula ? [recipe.formula] : []));
const foodRecipeIds = new Set(economyData.projects.flatMap(project => project.reveal?.startsWith("recipe_") ? [project.reveal] : []));
const gearRows = new Map(data.gear.map(row => [row.id, row]));
const pillRows = new Map(data.pills.map(row => [row.id, row]));
const talismanRows = new Map(data.talismans.map(row => [row.id, row]));
const manualRows = new Map(data.innerStyles.map(row => [row.id, row]));
const ammoRows = new Map(data.ammunition.map(row => [row.id, row]));
const containerRows = new Map(economyData.containerPlans.map(row => [row.id, row]));
const clueMaterials = new Set(["heart_silt", "stillwell_salt"]);
const bookCategories = ["武器", "装备", "弹药", "丹药", "内功", "符箓", "口粮", "材料", "丹方", "线索", "其他"];
const bookNames = new Intl.Collator("zh-CN");
const enemyRows = Object.fromEntries(data.enemies.map(enemy => [enemy.id, enemy]));
const slotNames = data.equipmentSlots;
const intentNames = { attack: "进攻", heavy: "重击", guard: "防御", dodge: "闪避", heal: "疗伤", remedy: "服药", drain: "吸取真气", focus: "蓄势", recoverQi: "回气" };
const kindNames = { material: "材料", food: "口粮", object: "随身物件", gear: "装备", pill: "丹药", talisman: "符箓", key: "线索", ammo: "弹药", manual: "内功", container: "收纳", currency: "灵钱" };
const weaponNames = { fist: "拳与指虎", sword: "剑", blade: "刀斧", spear: "枪戟", staff: "棍杖", hammer: "锤", bow: "弓", crossbow: "弩" };
const serviceNames = { cultivate: "修行", workshop: "工坊", market: "坊市", quests: "委托" };
const apprenticeQuests = ["lost_basket_return", "reed_salve", "apprentice_waterline"];
const app = document.querySelector("#app");
const main = document.querySelector("#main");
const guide = document.querySelector("#help");
const encyclopedia = document.querySelector("#encyclopedia");
const bookBody = encyclopedia.querySelector("[data-book-body]");
const bookStatus = encyclopedia.querySelector("[data-book-status]");
const bookToggle = app.querySelector(".topbar [data-open-encyclopedia]");
const disposal = document.querySelector("#disposal");
const guideDeduction = guide.querySelector("[data-guide-deduction]");
const guideAffiliation = document.createElement("p");
guideAffiliation.className = "fine sect-affiliation";
guideAffiliation.hidden = true;
guide.querySelector(".dialog-head").after(guideAffiliation);
const guideBags = document.createElement("details");
guideBags.className = "guide-topic guide-bags";
guideBags.hidden = true;
guideBags.innerHTML = `<summary>整理乾坤袋</summary>
  <p class="fine">点行囊里的乾坤袋打开。右键点行囊物品会尽量装入袋中，右键点袋里的物品会尽量取回。按住 Shift 再右键只移一件。</p>
  <p class="fine">触屏或用键盘时，点开物品，再选「装入」或「取回」。要用袋里的东西，先取回行囊。</p>
  <p class="fine">行囊只能带一只乾坤袋。换袋前，把原来的整只存仓或放在脚边。</p>`;
guide.querySelector("[data-reset]").before(guideBags);
const kit = document.querySelector("#kit");
const notices = document.querySelector("#notices");
const opening = document.querySelector("#opening");
const transfer = document.querySelector("#transfer");
const instantRoutes = ["gateJump", "gateScroll", "arrayJump"];
const roadTravelActions = ["travel", "roadContinue", "roadBack"];
const banditPaymentActions = ["banditPay", "banditSettle", "banditSurrender"];
const banditOfferActions = ["banditPayCoins", "banditPayItem", "banditClearOffer"];
const bagTransferActions = ["econBagDeposit", "econBagWithdraw"];
let state = freshGame();
let screen = "journey";
let marketMode = "buy";
let activeFacility = "warehouse";
let openingTimer;
let restartNotice = false;
let transferTimer;
let selectedItem = null;
let openBagId = null;
let combatObservation = null;
const kitSectionOpen = new Map();
let meditationClue = null;
let deductionHistoryOpen = false;
const openDeductions = new Set();
let atlasProvince = null;
let atlasPoint = null;
let atlasEdge = null;
let atlasIndexOpen = false;
let atlasRoadsOpen = false;
const atlasZoomLevels = [0.75, 1, 1.25, 1.5, 2, 2.5];
const atlasCameras = new Map();
let atlasWheel = null;
let atlasDrag = null;
let atlasSuppressClick = false;
let bookCategory = null;
let bookEditing = null;
const bookDrafts = new Map();
let pendingDisposal = null;
const experimentDrafts = new Map();

function dismissOpening() {
  if (opening.hidden) return;
  clearTimeout(openingTimer);
  opening.hidden = true;
  app.inert = false;
  main.querySelector("button")?.focus({ preventScroll: true });
  if (restartNotice) {
    restartNotice = false;
    showNotice(["新的行程开始了。"], false);
  }
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

function entryLabel(title, entry) {
  return entry ? `<span class="entry-anchor"><button class="item-trigger" type="button" data-entry aria-expanded="false">${escape(title)}</button>
    <span class="item-tip" role="tooltip">${itemTipBody(entry.text ?? entry, entry.stats, entry.id)}</span></span>` : escape(title);
}

function card(title, desc, badge = "", actions = "", entry = "", need = null) {
  const name = entryLabel(title, entry);
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
  return s.mode === "road" && (!s.roadTrip?.bandit || s.roadTrip.bandit.aftermath);
}

function atLanding(s) {
  return inVillage(s) && s.region.id === "village";
}

function vital(label, current, max, low, explanation, bar = "") {
  return `<details class="vital${low ? " low" : ""}${bar ? ` vital-bar ${bar}` : ""}">
    <summary>${label} <b>${Math.floor(current)}/${max}</b>${bar ? `<span class="meter-track" style="--fill:${100 * current / max}%" aria-hidden="true"><i></i></span>` : ""}</summary>
    <p>${escape(explanation)}</p>
  </details>`;
}

function stats(s) {
  const warnings = [];
  const meal = s.packedMeal?.count ? s.packedMeal : null;
  if (s.satiety === 0) warnings.push("空腹乏力");
  if (!data.foods.some(({ id }) => s.inventory[id] > 0) && s.satiety < rules.rationSatiety) warnings.push("口粮已尽");
  if (s.toxin >= rules.toxinThreshold) warnings.push("丹毒发作");
  const fog = fogMeter(s);
  const medicineAllowed = !s.currentEnemy?.medicineRestricted;
  const canEat = !s.gathering && (["village", "field", "event"].includes(s.mode) || onOpenRoad(s)) &&
    meal && s.edibleMeals.includes(meal.id);
  const canUseSalve = medicineAllowed && s.hp < s.maxHp && s.inventory.salve > 0 && (["village", "field", "combat"].includes(s.mode) || onOpenRoad(s));
  const sense = s.spiritSense;
  const senseSource = sense && `境界 ${sense.source.natural} 格${sense.source.equipment ? `＋${sense.source.equipment.name} ${sense.source.equipment.bonus} 格` : ""}`;
  return `<div class="player-line"><span class="realm">${escape(s.realm.name)}</span>
    ${vital("气血", s.hp, s.maxHp, s.hp / s.maxHp < 0.3, "气血耗尽会倒下。敷伤药或在据点歇息都能恢复。", "health")}
    ${canUseSalve ? linkButton("敷伤药", "use", "salve", "quick-eat") : ""}
    ${vital("饱腹", s.satiety, s.maxSatiety, s.satiety < 24, `每过一日少 ${rules.satietyDrainPerDay} 点。吃一份干粮补 ${rules.rationSatiety} 点。`)}
    ${canEat ? linkButton(`吃${itemRows[meal.id].name}`, "eat", meal.id, "quick-eat") : ""}
    ${vital("真气", s.qi, s.maxQi, s.qi < s.maxQi / 3, "催动法攻兵器或冥想会耗气。露天活动时，雾压到了第三格也会耗气。回气散或歇息能补回来。", "qi")}
    ${sense ? `<details class="vital sense"><summary title="${escape(senseSource)}">神识 <b>${sense.current}/${sense.max}</b><span class="meter-track" aria-hidden="true"><i style="--fill:${100 * sense.current / sense.max}%"></i></span></summary><p>${escape(senseSource)}。交手时可用选好的神识，歇息或用相应药物能恢复。</p></details>` : ""}
    ${warnings.map(text => `<span class="warning">${text}</span>`).join("")}${fog}</div>`;
}

function fogMeter(s) {
  const color = s.fogTier === rules.fogNotches ? " severe" : s.fogTier >= rules.pressureThreshold ? " danger" : "";
  const marks = Array.from({ length: rules.fogNotches }, (_, index) =>
    `<i${index < s.fogTier ? ' class="filled"' : ''}></i>`).join("");
  const explanation = s.mode === "combat" ? "交手时雾压保持不动。继续在露天探查、采集或等候才会积雾。"
    : !s.fogExposed ? "这里避雾，真气暂时不会被雾耗去。"
    : s.fogTier === 5 ? "真气流失极快。回到落脚处能散雾。"
    : s.fogTier === 4 ? "真气流失得更快。回到落脚处能散雾。"
    : s.fogTier === 3 ? "真气开始流失。回到落脚处能散雾。"
    : "露天待得越久，雾压越高。第三格开始耗真气。";
  return `<details class="pressure${s.fogExposed ? color : ""}">
    <summary aria-label="雾压 ${s.fogTier} 格，共 ${rules.fogNotches} 格">雾压 <span class="fog-marks" aria-hidden="true">${marks}</span></summary>
    <span>${explanation}</span>
  </details>`;
}
function distance(units) {
  return `${units * banditRules.distanceUnit} 里`;
}

function routeAction(road, edges = [], label = road.rescue ? `慢慢走到${road.name}` : road.id === "village" ? "回村" : `去${road.name}`) {
  const forecast = [road.meals && Object.keys(road.meals).length && `途中吃 ${supplies(road.meals)}`,
    road.emptyOnArrival && !road.rescue && "到时会空腹"].filter(Boolean).join(" · ");
  const note = [road.units != null && distance(road.units), `${road.days} 日`, road.via?.length && `经 ${road.via.join("、")}`,
    road.reason || forecast].filter(Boolean).join(" · ");
  const path = road.path ?? [];
  const directlyConnects = ({ from, to }) => path.some((id, index) => (id === from && path[index + 1] === to) || (id === to && path[index + 1] === from));
  const warnings = [...new Set(edges.filter(edge => edge.riskText && directlyConnects(edge)).map(edge => edge.riskText))];
  return `<div class="route-action">${linkButton(label, "travel", road.id, "", !road.available)}
    <div class="route-notes"><span class="fine">${escape(note)}</span>${warnings.map(warning => `<p class="fine route-warning">${escape(warning)}</p>`).join("")}
      ${road.restock ? linkButton(`先去${road.restock.name}补给`, "travel", road.restock.id, "quiet") : ""}</div></div>`;
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

function banditOffers(s, bandit) {
  if (bandit.remaining <= 0) return "";
  const offers = (bandit.offers ?? []).filter(offer => offer.count > 0 && offer.price > 0);
  if (!offers.length) return "";
  const expanded = main.querySelector("[data-road-offers]")?.open;
  const rows = offers.map(({ id, name, held, count, price }) => {
    const quantity = Math.min(count, Math.ceil(bandit.remaining / price));
    const entry = `road-offer-${id}`;
    const first = linkButton("选 1 件", "banditPayItem", id, "quiet", false, 1, entry);
    const batch = quantity > 1 ? linkButton(`选 ${quantity} 件`, "banditPayItem", id, "quiet", false, quantity, entry) : "";
    return `<div class="road-offer"><span id="${escape(entry)}">${entryLabel(name, itemEntry(s, id))} <small class="fine">×${held ?? count} · 每件抵 ${price} 灵钱</small></span><div class="actions">${first}${batch}</div></div>`;
  });
  return `<details class="road-offers" data-road-offers${expanded ? " open" : ""}><summary>拿东西抵价</summary>${rows.join("")}</details>`;
}

function banditDraft(bandit) {
  if (!bandit.offerValue) return "";
  const goods = (bandit.offeredGoods ?? []).map(({ name, count }) => `${name} ×${count}`);
  const contents = [bandit.offerCoins > 0 && `${bandit.offerCoins} 灵钱`, ...goods].filter(Boolean).join("、");
  return `<div class="road-draft">
    <p>准备交出${escape(contents)}</p>
    <p class="fine">合计抵 ${bandit.offerValue} 灵钱${bandit.remaining > 0 ? ` · 还差 ${bandit.remaining} 灵钱` : ""}</p>
    <div class="actions">${linkButton("确认交付", "banditSettle", "", "primary", bandit.remaining > 0)}
      ${linkButton("重新选", "banditClearOffer", "", "quiet")}</div></div>`;
}

function banditScreen(s, bandit, preparation = "") {
  const remaining = bandit.remaining;
  const askingForMoney = !bandit.aftermath && remaining != null;
  const directCash = askingForMoney && !bandit.offerValue && bandit.coins >= bandit.fee;
  const cashToOffer = askingForMoney ? Math.min(remaining, bandit.coins - (bandit.offerCoins ?? 0)) : 0;
  const pay = directCash ? linkButton(`付 ${bandit.fee} 灵钱`, "banditPay", "", "primary")
    : cashToOffer > 0 ? linkButton(`选 ${cashToOffer} 灵钱`, "banditPayCoins") : "";
  const surrender = askingForMoney && bandit.allValue < bandit.fee
    ? linkButton("交出行装，求他放行", "banditSurrender", "", "quiet", false, 1, "road-surrender-note") : "";
  const fight = !bandit.aftermath && bandit.fightAllowed !== false ? linkButton("动手闯过去", "banditFight", "", "danger") : "";
  const pass = bandit.passAllowed ? `<div class="actions">${linkButton("从旁边过去", "banditPass", "", "quiet")}</div>` : "";
  const ask = bandit.actions ?? [];
  const plot = ask.map(({ id, label, desc, available, reason }) => `<div class="choice">
    ${desc ? `<p>${escape(desc)}</p>` : ""}${linkButton(label, "banditPlot", id, "quiet", available === false)}
    ${reason ? `<p class="choice-blocker">${escape(reason)}</p>` : ""}</div>`).join("");
  return panel(bandit.aftermath ? "交手之后" : bandit.name, `<p class="intro">${escape(bandit.intro)}</p>
    ${askingForMoney ? `<p class="road-demand">开价 ${bandit.fee} 灵钱<span class="fine">钱袋 ${bandit.coins} 灵钱</span></p>` : ""}
    ${pay || surrender || fight ? `<div class="actions">${pay}${surrender}${fight}</div>` : ""}
    ${surrender ? '<p class="fine road-surrender" id="road-surrender-note">他会拿走灵钱、能抵价的东西，以及身上和包里的装备。</p>' : ""}
    ${askingForMoney ? banditDraft(bandit) + banditOffers(s, bandit) : ""}${preparation}${plot ? `<div class="choice-list">${plot}</div>` : ""}${pass}`);
}

function roadScreen(s) {
  const road = s.roadTrip;
  const preparation = road.afterBattle ? groundSection(s, "脚边的战利品") : "";
  if (road.bandit) return banditScreen(s, road.bandit, preparation);
  const turnBack = road.fromName ? `折回${road.fromName}` : "沿原路折返";
  return panel(road.afterBattle ? "交手之后" : "路上", `${preparation}<div class="actions place-actions">${linkButton("继续赶路", "roadContinue", "", "primary")}
    ${linkButton(turnBack, "roadBack", "", "quiet")}</div>`);
}

function deathScreen(s) {
  const death = s.banditDeath;
  return panel("行程结束", `<p class="intro">${escape(death?.desc ?? "你倒在了路上。")}</p>
    <div class="actions"><button type="button" class="button primary" data-reset="death">重新开始</button></div>`,
    death?.name ? tag(death.name, "warn") : "");
}

function journey(s) {
  if (s.mode === "death") return deathScreen(s);
  if (s.mode === "event") return eventScreen(s);
  if (s.mode === "combat") return combatScreen(s);
  if (s.mode === "road") return roadScreen(s);
  if (s.mode === "victory") {
    const final = s.completionPhase === "final";
    return panel(final ? "旧渡通行契" : "旧渡重新开船", `<p class="intro">${final ? "村里收到了衡印。送信的人乘渡船出发，去给沿岸驿站送通行文书。" : "渡口重新点起了灯。第一趟船也带回了岭外的消息。"}</p><div class="actions">${linkButton("继续上路", "resume", "", "primary")}</div>`);
  }
  const roads = [...s.world.roads].sort((left, right) => left.days - right.days);
  const isHome = inVillage(s);
  const originalHome = atLanding(s);
  const needRest = s.hp < s.maxHp || s.qi < s.maxQi || s.wounds || s.toxin || s.fogTier || (s.inventory.ration ?? 0) < rules.reliefRations ||
    (s.spiritSense && s.spiritSense.current < s.spiritSense.max);
  return panel(s.region.name, `${groundSection(s)}${siteList(s)}${hazardNotice(s.localHazard)}
  ${roads.length ? `<div class="atlas-local-roads">${roads.map(road => routeAction(road, s.world.edges)).join("")}</div>` : ""}
  <div class="actions place-actions">
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
    ${!isHome ? linkButton("等半日", "wait", "", "quiet", s.satiety <= 0) :
      s.region.id === data.tournament.region && s.boutPause > 0 && !needRest ? linkButton("在场边等半日", "wait", "", "quiet") : ""}
  </div>
  ${s.world.crossings.map(({ label, reason }) => `<p class="fine crossing">${escape(label)} · ${escape(reason)}</p>`).join("")}`);
}

const atlasPairs = (coords) => coords.map(([x, y]) => `${x},${y}`).join(" ");
const atlasAt = ([x, y], [left, top, width, height]) => `--x:${100 * (x - left) / width}%;--y:${100 * (y - top) / height}%`;

function atlasInk(world, frame, roads = "", overview = false) {
  const { provinces, terrain, step } = world.geography;
  const lands = Object.entries(provinces).map(([id, { outline }]) =>
    `<polygon class="atlas-land atlas-land-${id}" points="${atlasPairs(outline)}"/>`).join("");
  const rivers = terrain.rivers.map((path) => `<path d="${path}"/>`).join("");
  const hills = terrain.ridges.map(([x, y, width]) =>
    `<path d="M${x - width} ${y + width / 2} l${width * 0.68} ${-width * 0.87} ${width * 0.32} ${width * 0.3} ${width * 0.39} ${-width * 0.36} ${width * 0.65} ${width * 0.92} M${x - width * 0.12} ${y + width * 0.35} l${width * 0.48} ${-width * 0.65} ${width * 0.22} ${width * 0.27}"/>`).join("");
  const dunes = terrain.dunes.map((path) => `<path d="${path}"/>`).join("");
  const [x, y, width, height] = frame;
  const scaleX = x + width - step * 5 - 11;
  const scaleY = y + height - 11;
  return `<svg class="atlas-ink" viewBox="${frame.join(" ")}" ${overview ? 'aria-hidden="true"' : 'aria-label="州内道路和比例尺"'}>
    ${lands}<g class="atlas-rivers">${rivers}</g><g class="atlas-hills">${hills}</g><g class="atlas-dunes">${dunes}</g>${roads}
    ${overview ? "" : `<g class="atlas-scale" aria-hidden="true"><path d="M${scaleX} ${scaleY - 3}v3h${step * 5}v-3"/><text x="${scaleX + step * 2.5}" y="${scaleY - 5}">十里</text></g>`}</svg>`;
}

function atlasOverview(world) {
  const { overview: frame, provinces: shapes } = world.geography;
  const provinces = world.provinces.map(({ id, name }) =>
    `<button type="button" class="atlas-province" style="${atlasAt(shapes[id].label, frame)}" data-atlas-province="${escape(id)}"${id === world.province ? ' aria-current="location"' : ""}>${escape(name)}</button>`).join("");
  return panel("山河总图", `<div class="atlas-view">${atlasViewport("overview", frame, "各州地图", atlasInk(world, frame, "", true) + provinces)}</div>`);
}

function atlasViewport(id, frame, label, ink) {
  const zoom = atlasCameras.get(id)?.zoom ?? 1;
  const position = atlasZoomLevels.indexOf(zoom);
  const zoomButton = (direction, name, symbol, disabled) =>
    `<button type="button" class="button quiet atlas-zoom" data-atlas-zoom="${direction}" aria-controls="atlas-viewport"
      aria-label="${name}" aria-disabled="${disabled}">${symbol}</button>`;
  return `<div class="atlas-frame">
    <div class="atlas-zoom-tools" role="group" aria-label="地图缩放">
      ${zoomButton(-1, "缩小地图", "−", position === 0)}
      <span class="atlas-zoom-level" aria-live="polite">${Math.round(100 * zoom)}%</span>
      ${zoomButton(1, "放大地图", "+", position === atlasZoomLevels.length - 1)}
    </div>
    <div class="atlas-scroll${id === "overview" ? " atlas-scroll-overview" : ""}" id="atlas-viewport" data-atlas-scroll="${id}" data-atlas-enlarged="${zoom > 1}"
      style="--map-ratio:${frame[2]} / ${frame[3]};--atlas-zoom:${zoom}" role="region" aria-label="${label}" tabindex="0">
      <div class="atlas-canvas ${id === "overview" ? "atlas-overview" : "atlas-map"}">${ink}</div>
    </div>
  </div>`;
}

const atlasZoom = (viewport) => Number(viewport.style.getPropertyValue("--atlas-zoom"));

function moveAtlas(viewport, dx, dy) {
  viewport.scrollTo(viewport.scrollLeft + dx, viewport.scrollTop + dy);
}

function centerAtlasOn(viewport, target) {
  if (!target) return;
  const bounds = viewport.getBoundingClientRect();
  const point = target.getBoundingClientRect();
  moveAtlas(viewport, point.left + point.width / 2 - bounds.left - viewport.clientWidth / 2,
    point.top + point.height / 2 - bounds.top - viewport.clientHeight / 2);
}

function changeAtlasZoom(viewport, step, pointer) {
  const position = atlasZoomLevels.indexOf(atlasZoom(viewport)) + step;
  const next = atlasZoomLevels[position];
  if (!next) return;
  const bounds = viewport.getBoundingClientRect();
  const x = pointer?.clientX ?? bounds.left + viewport.clientWidth / 2;
  const y = pointer?.clientY ?? bounds.top + viewport.clientHeight / 2;
  const canvas = viewport.firstElementChild;
  const before = canvas.getBoundingClientRect();
  const mapX = Math.max(0, Math.min(1, (x - before.left) / before.width));
  const mapY = Math.max(0, Math.min(1, (y - before.top) / before.height));
  viewport.style.setProperty("--atlas-zoom", next);
  viewport.dataset.atlasEnlarged = next > 1;
  const after = canvas.getBoundingClientRect();
  moveAtlas(viewport, after.left + mapX * after.width - x, after.top + mapY * after.height - y);
  const tools = viewport.previousElementSibling;
  tools.querySelector(".atlas-zoom-level").textContent = Math.round(next * 100) + "%";
  tools.querySelector('[data-atlas-zoom="-1"]').setAttribute("aria-disabled", position === 0);
  tools.querySelector('[data-atlas-zoom="1"]').setAttribute("aria-disabled", position === atlasZoomLevels.length - 1);
}

function atlasRoadName(edge, points) {
  return edge.province ? `${points[edge.from].name} · 往${edge.name}` : `${points[edge.from].name} — ${points[edge.to].name}`;
}

function atlasRoadMark(edge, chosen, name) {
  const coords = atlasPairs(edge.survey);
  return `<g class="atlas-road${edge.avoided ? " avoided" : ""}${chosen ? " chosen" : ""}${!edge.available ? " closed" : ""}${edge.water ? " water" : ""}${edge.province ? " cross" : ""}${edge.risky ? " risky" : ""}"
    data-atlas-edge="${escape(edge.key)}" role="button" tabindex="0" aria-label="${escape(name + (edge.avoided ? "，已避开" : ""))}" aria-pressed="${edge.key === atlasEdge}">
    <title>${escape(name)}</title><polyline class="atlas-road-ink" points="${coords}"/><polyline class="atlas-road-hit" points="${coords}"/></g>`;
}

function atlasLabelOffsets(points, frame, selected) {
  const factor = 680 / frame[2];
  const projected = points.map((point) => ({ point, x: (point.x - frame[0]) * factor, y: (point.y - frame[1]) * factor }));
  const space = projected.map(({ x, y }) => [x - 9, y - 9, x + 9, y + 9]);
  const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]))
    * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const bounds = [4, 6, 676, frame[3] * factor - 22];
  const priority = (point) => Number(point.id === selected.id) * 3 + Number(point.settlement) + Number(point.current) * 2;
  return Object.fromEntries(projected.sort((a, b) => priority(b.point) - priority(a.point)).map(({ point, x, y }) => {
    const width = [...point.name].length * 12 + 9;
    const side = width / 2;
    const positions = [[0, 17], [0, -17], [side + 11, 0], [-side - 11, 0],
      [side + 5, -13], [-side - 5, 13], [side + 5, 13], [-side - 5, -13],
      [0, 33], [0, -33], [side + 11, 26], [-side - 11, 26], [side + 11, -26], [-side - 11, -26],
      [side + 20, 36], [-side - 20, 36], [side + 20, -36], [-side - 20, -36]];
    const candidates = positions.map(([dx, dy], index) => {
      const box = [x + dx - width / 2, y + dy - 11, x + dx + width / 2, y + dy + 11];
      const cost = (width * 22 - overlap(box, bounds)) * 6 + space.reduce((sum, inside) => sum + overlap(box, inside), 0) + index * 0.1;
      return { dx, dy, box, cost };
    });
    const { dx, dy, box } = candidates.reduce((best, row) => row.cost < best.cost ? row : best);
    space.push(box);
    return [point.id, `--label-x:${dx}px;--label-y:${dy}px`];
  }));
}

function atlasMap(world, province, points, byId, selected, route, edges) {
  const frame = world.geography.provinces[province].frame;
  const routeLegs = new Set((route?.path ?? []).slice(1).map((id, index) => [route.path[index], id].sort().join("|")));
  const inkOrder = (edge) => edge.key === atlasEdge ? 2 : Number(routeLegs.has(edge.key));
  const lines = [...edges].sort((a, b) => inkOrder(a) - inkOrder(b))
    .map((edge) => atlasRoadMark(edge, routeLegs.has(edge.key), atlasRoadName(edge, byId))).join("");
  const borders = new Map();
  for (const edge of edges) {
    if (!edge.province) continue;
    const end = edge.survey.at(-1);
    const prior = edge.survey.at(-2);
    if (!prior) continue;
    const angle = Math.atan2(end[1] - prior[1], end[0] - prior[0]);
    const arrow = `<span class="atlas-border-arrow" aria-hidden="true" style="${atlasAt(end, frame)};--arrow:${angle}rad"></span>`;
    const row = borders.get(edge.province);
    if (row) row.arrows += arrow;
    else borders.set(edge.province, { label: edge.name, end, arrows: arrow });
  }
  const crossLabels = [...borders.values()].map(({ label, end, arrows }) =>
    `${arrows}<span class="atlas-cross-label" aria-hidden="true" style="${atlasAt(end, frame)}">往${escape(label)}</span>`).join("");
  const offsets = atlasLabelOffsets(points, frame, selected);
  const marks = points.map(point => `<button type="button" class="atlas-mark${point.current ? " here" : ""}${point.settlement ? " town" : ""}${point.portal ? " portal" : ""}${point.attuned ? " linked" : ""}"
    style="${atlasAt([point.x, point.y], frame)};${offsets[point.id]}" data-atlas-point="${escape(point.id)}" aria-label="${escape(point.name)}" aria-pressed="${point.id === selected.id}">
    <span class="atlas-dot"></span><span class="atlas-label">${escape(point.name)}</span></button>`).join("");
  return `${atlasViewport(province, frame, "已知地点和道路", atlasInk(world, frame, lines) + marks + crossLabels)}
    <p class="atlas-legend"><span class="atlas-key key-wild">野外</span><span class="atlas-key key-town">休息点</span><span class="atlas-key key-portal">传送门</span>${edges.some(({ risky }) => risky) ? '<span class="atlas-key key-risk">险路</span>' : ""}</p>`;
}

function atlasRoadDetail(edge, points, canChange) {
  const name = atlasRoadName(edge, points);
  const notes = [edge.label, edge.units && distance(edge.units), `${edge.days} 日`, edge.avoided && "已避开", edge.riskText].filter(Boolean).join(" · ");
  const reason = edge.reason || edge.avoidReason || (!canChange ? "回到当前地点后可调整避开的路。" : "");
  const options = edge.avoided || edge.canAvoid;
  return `<section class="atlas-road-detail" id="atlas-edge-detail" aria-label="选中的道路">
    <div><h3>${escape(name)}</h3>${notes ? `<p class="fine">${escape(notes)}</p>` : ""}</div>
    ${linkButton(edge.avoided ? "恢复此路" : "避开此路", "roadAvoid", edge.key, edge.avoided ? "quiet" : "danger",
      !canChange || !options, 1, reason ? "atlas-edge-reason" : "")}
    ${reason ? `<p class="fine atlas-road-reason" id="atlas-edge-reason">${escape(reason)}</p>` : ""}
  </section>`;
}

function atlasRoadIndex(edges, points, selected) {
  if (!edges.length) return "";
  const touches = ({ from, to }) => from === selected.id || to === selected.id;
  const rows = [...edges].sort((a, b) => Number(touches(b)) - Number(touches(a))
    || atlasRoadName(a, points).localeCompare(atlasRoadName(b, points), "zh-CN"));
  return `<details class="atlas-road-index"${atlasRoadsOpen ? " open" : ""}><summary>选道路</summary>
    <div class="atlas-road-list">${rows.map(edge => `<button type="button" class="button quiet${edge.avoided ? " danger" : ""}"
      data-atlas-edge="${escape(edge.key)}" aria-pressed="${edge.key === atlasEdge}">${escape(atlasRoadName(edge, points))}${edge.avoided ? "　已避开" : ""}</button>`).join("")}
    </div></details>`;
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
  const province = world.provinces.find(({ id }) => id === atlasProvince);
  if (!province) return atlasOverview(world);
  const points = world.points.filter((point) => point.province === province.id);
  const byId = Object.fromEntries(points.map((point) => [point.id, point]));
  const edges = [...world.edges.filter(({ from, to }) => byId[from] && byId[to]),
    ...(world.crossLinks ?? []).filter(({ from }) => byId[from])];
  const selected = points.find(({ id }) => id === atlasPoint) ?? points.find(({ current }) => current) ?? points[0];
  const up = '<button class="button quiet atlas-up" type="button" data-atlas-overview>返回总图</button>';
  if (!selected) return panel(province.name, '<div class="atlas-view"><p class="intro">还没听说州里的去处。</p></div>', up);
  const idle = s.mode !== "event";
  const road = idle && world.journeys.find(({ id }) => id === selected.id);
  const edge = edges.find(({ key }) => key === atlasEdge);
  const gate = world.gates.find(({ id }) => id === selected.id);
  const array = idle && world.arrays.find(({ id }) => id === selected.id);
  const marks = [selected.current ? "你在这里" : "", selected.settlement ? "可歇息" : "", selected.attuned ? "传送门已点亮" : ""].filter(Boolean).join(" · ");
  const currentGate = idle && selected.current && world.localGate && !world.localGate.attuned;
  const recipe = data.recipes.find(({ id }) => id === "r_gate_scroll");
  const makeScroll = idle && s.settlement && s.discoveredRecipes.includes(recipe.id);
  const scrollBlocker = makeScroll && s.craftReasons[recipe.id];
  const usable = gate && !selected.current;
  const doorToDoor = idle && usable && world.localGate?.attuned && selected.province === world.province;
  const reasons = [idle && !road && !selected.current && (selected.travelReason || "目前没有已知的走法。"),
    selected.portal && !selected.current && !selected.attuned && "亲自点亮这里的传送门后，才能传到这里。",
    doorToDoor && !gate.available && gate.reason,
    usable && !gate.byScroll && gate.scrollReason,
    array && !array.available && selected.id !== s.region.id && world.localArray?.active && array.reason].filter(Boolean);
  const transport = `<div class="actions atlas-actions">
      ${road ? routeAction(road, world.edges, road.rescue ? "慢慢走过去" : "走过去") : ""}
      ${currentGate ? linkButton("点亮传送门", "attuneGate") : ""}
      ${doorToDoor ? linkButton(`门间传送 · ${gate.price} 灵钱`, "gateJump", gate.id, "", !gate.available) : ""}
      ${usable ? linkButton(`用卷轴传送 · 1 张 + ${gate.scrollPrice} 灵钱`, "gateScroll", gate.id, "", !gate.byScroll) : ""}
      ${array && selected.id !== s.region.id && world.localArray?.active ? linkButton(`跨州传送 · ${array.price} 灵钱`, "arrayJump", array.id, "", !array.available) : ""}
      ${makeScroll && selected.current ? linkButton(scrollBlocker || "制备传送卷轴", "craft", recipe.id, "quiet", Boolean(scrollBlocker)) : ""}
    </div>`;
  return panel(province.name, `<div class="atlas-view">
    ${atlasMap(world, province.id, points, byId, selected, road, edges)}
    ${edge ? atlasRoadDetail(edge, byId, idle) : ""}
    <div class="atlas-tools"><details class="atlas-index"${atlasIndexOpen ? " open" : ""}><summary>选地点</summary><div class="actions">${points.map(({ id, name }) =>
      `<button type="button" class="button quiet" data-atlas-point="${escape(id)}" aria-pressed="${selected.id === id}">${escape(name)}</button>`).join("")}</div></details>
    ${atlasRoadIndex(edges, byId, selected)}</div>
    <div class="atlas-place"><h3>${escape(selected.name)}</h3>${marks ? tag(marks) : ""}
    <p class="intro">${escape(selected.description)}</p>${transport}
    ${[...new Set(reasons)].map(reason => `<p class="fine">${escape(reason)}</p>`).join("")}
    ${makeScroll && selected.current ? `<p class="fine">每批 ${recipe.count} 张 · ${recipe.cost} 灵钱 · ${escape(supplies(recipe.need))}</p>` : ""}
    </div>${idle && selected.current ? arrayLedger(world.localArray) : ""}</div>`, up);
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
  const lessons = (s.spiritSense?.rows ?? []).filter(skill => skill.site === event.id && !skill.learned);
  return panel(event.name, `${painted ? `<div class="scene scene-${escape(s.region.id)}" aria-hidden="true"></div>` : ""}
    <p class="intro">${escape(publicText(description))}</p>
    ${resources ? `<p class="site-stock">${escape(resources)}</p>` : ""}
    ${groundSection(s)}
    <div class="choice-list">${choices}</div>
    ${lessons.length ? `<div class="choice-list">${lessons.map(skill => `<div class="choice">${spiritLesson(skill, gathering)}</div>`).join("")}</div>` : ""}
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

function experimentForm(experiment) {
  if (experiment.blockedReason) return `<section class="experiment"><p class="fine">${escape(experiment.blockedReason)}</p></section>`;
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
    <div class="experiment-controls">${controls}</div>
    <div class="actions"><button type="submit" class="button">当场试一次</button></div>
  </form>`;
}

function combatScreen(s) {
  const enemy = s.currentEnemy;
  const intent = s.intent;
  const spirit = s.spiritSense;
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
  const openingShot = intent && s.openingShotReady;
  const charging = s.chargingWeapon;
  const mainCharged = charging?.slot === "weapon" && charging.id === weapon?.id;
  const sideCharged = charging?.slot === "offhand" && charging.id === side?.id;
  const fistCharged = charging?.slot === "fist";
  const suppress = spirit?.strikeBlocked;
  const mainBlocked = Boolean((charging && !mainCharged) || (suppress && (!canMainAttack || !weapon.chargeRequired || mainCharged)));
  const sideBlocked = Boolean((charging && !sideCharged) || (suppress && (!side?.chargeRequired || sideCharged)));
  const attackLabel = !canMainAttack ? ordinaryPunch : weapon.chargeRequired ? `用${weapon.name}${mainCharged ? "打出" : "蓄力"}`
    : weapon.weaponClass === "fist" ? `用${weapon.name}出拳` : openingShot ? "抢先放箭"
      : weapon.spellQi ? `用${weapon.name}挥击` : `用${weapon.name}出手`;
  const sideLabel = side?.chargeRequired ? `用${side.name}${sideCharged ? "打出" : "蓄力"}` : side && `用${side.name}出手`;
  const fistChargeLabel = fistCharged ? `打出${fist?.chargeName ?? charging.name}` : `蓄力 · ${fist?.chargeName}`;
  const fistChargeReason = (!charging || fistCharged) && fist?.chargeReason?.replace(/[。！]+$/, "");
  const fistChargeDisabled = (!fistCharged && Boolean(charging)) || !fist?.chargeAvailable || Boolean(fistChargeReason);
  const guardLabel = intent?.kind === "heavy" ? "挡住重招" : intent?.kind === "guard" && s.breathingQi ? "收势调息" : "防御";
  const flight = intent && s.retreatRisk;
  const retreatLabel = enemy.sparring ? "认输" : "撤退";
  const retreatCue = flight?.blocked ? "对方正要出手，这时脱不开身。"
    : flight ? "对方这回合没在进攻，可以找空当脱身。" : "";
  const intentLine = intent
    ? `<div class="intent"><b>看破来招 · ${escape(intent.name)}</b>　${escape(intentNames[intent.kind])}${intent.damageType ? ` · ${intent.damageType === "magic" ? "法攻" : "物攻"}` : ""}</div>`
    : `<p class="intent unread">${s.combatRead === "enemy" ? "对方盯着你的起手，没先露招。" : "一时看不清对方的来招。"}</p>`;
  const openingNote = openingShot ? "对方还隔着一段路。这一回合放箭，能拦住它的头一扑。"
    : !intent && s.openingShotPossible ? "还隔着一段路。对方若冲来，首箭能拦一下。" : "";
  const chargeNote = [
    charging && (fistCharged ? '拳劲已收住，可以打出这一拳。' : `${charging.name}已经蓄好力，可以出手。`),
    s.enemyCharged && "对方已经攒足了劲。",
  ].filter(Boolean).join("");
  const observation = enemy.desc ? `<details class="field-note"${combatObservation === state.combat ? " open" : ""}><summary>观察对手</summary><p>${escape(publicText(enemy.desc))}</p></details>` : "";
  const spell = weapon?.spellQi && linkButton(`催动${weapon.name} · ${weapon.spellQi} 真气`, "weaponSpell", "", "",
    s.qi < weapon.spellQi || Boolean(charging || suppress));
  const knownSpirit = spirit?.active;
  const spiritDescription = suppress ? `这回合可以防御、闪避、蓄势${enemy.medicineRestricted ? "" : "或服药"}。`
    : spirit?.remaining ? `效果还剩 ${spirit.remaining} 回合。` : spirit?.invokeBlocker || knownSpirit?.desc;
  const spiritButton = knownSpirit && `<span class="action-hint">${linkButton(suppress ? `${knownSpirit.name}已发动` : spirit.waiting
    ? `${knownSpirit.name} · 尚需 ${spirit.waiting} 回合` : `${knownSpirit.name} · ${knownSpirit.cost} 神识`,
  "invokeSpirit", "", "quiet", Boolean(spirit.invokeBlocker), 1, "combat-spirit-tip")}<span class="item-tip" id="combat-spirit-tip"
    role="tooltip">${itemTipBody(spiritDescription, spiritStats(knownSpirit))}</span></span>`;
  const readings = spirit?.readings.map(({ label, value }) => `${label} ${value}`).join(" · ");
  return panel(enemy.name, `
    ${intentLine}
    ${openingNote ? `<p class="fine">${openingNote}</p>` : ""}
    ${chargeNote ? `<p class="fine">${escape(chargeNote)}</p>` : ""}
    ${enemy.sparring ? `<p class="fine">${enemy.medicineRestricted ? "裁判叫停就收招。双方在场上不能用药或吃东西。" : "约好点到为止，一方撑不住就收招。"}</p>` : ""}
    ${meter("对方气血", enemy.health, 1)}
    ${ammoBar}
    <div class="actions">${linkButton(attackLabel, !canMainAttack && fist ? "fistAttack" : "attack", "", fistCharged ? "" : "primary", mainBlocked)}
      ${spell || ""}
      ${side ? linkButton(sideLabel, "offhandAttack", "", "", sideBlocked) : ""}
      ${canMainAttack && fist && weapon.weaponClass !== "fist" ? linkButton(ordinaryPunch, "fistAttack", "", "", Boolean(charging || suppress)) : ""}
      ${fist?.chargeName || fistCharged ? linkButton(fistChargeReason ? `${fistChargeLabel}（${fistChargeReason}）` : fistChargeLabel,
        "fistCharge", "", fistCharged ? "primary" : "", fistChargeDisabled) : ""}
      ${linkButton(guardLabel, "guard")}
      <span class="action-hint">${linkButton("闪避", "dodge", "", "", false, 1, "dodge-explanation")}<span class="item-tip" id="dodge-explanation" role="tooltip">侧身躲开来招。若被击中，照常受伤。</span></span>
      ${charging ? linkButton("取消蓄力", "cancelCharge", "", "quiet") : ""}
      ${linkButton(retreatLabel, "retreat", "", flight?.blocked ? "danger" : "quiet", false, 1, retreatCue ? "retreat-cue" : "")}
      ${spiritButton || ""}
    </div>
    ${retreatCue ? `<p class="fine retreat-cue" id="retreat-cue">${escape(retreatCue)}</p>` : ""}
    ${s.lastEnemyIntent ? `<p class="fine">上回合 · ${escape(s.lastEnemyIntent.name)}</p>` : ""}
    ${readings ? `<p class="fine">${escape(readings)}</p>` : ""}
    ${observation}
    `, tag(tierName(enemy.tier), "warn"));
}

function gearCondition(remaining, total) {
  return !remaining ? "损坏" : remaining / total < 0.25 ? "将坏" : remaining < total ? "磨损" : "完好";
}

function itemDescription(s, id) {
  if (Object.hasOwn(s.itemNotes ?? {}, id)) return s.itemNotes[id];
  const item = itemRows[id];
  const gear = gearRows.get(id);
  const manual = manualRows.get(id);
  return publicText(gear?.entry || manual?.desc || item?.desc);
}

const flatEffects = [
  ["atk", "攻击"], ["def", "防御"], ["magicAtk", "法攻"], ["hp", "气血上限"], ["qi", "真气上限"],
  ["perception", "洞察"], ["spiritReserve", "神识上限"], ["physicalResist", "物抗", true], ["magicResist", "魔抗", true],
  ["retreat", "脱身", true], ["dodge", "闪避值", true],
];
const recoveryEffects = [["hp", "气血"], ["satiety", "饱腹"], ["qi", "真气"], ["sense", "神识"]];
const traitNames = { damage: "伤害", pierce: "穿甲", guard: "护持", reflect: "反伤", dodge: "闪避值", accuracy: "命中值" };
const targetNames = { scaled: "鳞甲", stoneborn: "石甲", furred: "带毛", beast: "妖兽", spirit: "精怪" };
const traitIntents = { attack: "普攻", heavy: "重招", drain: "夺气", guard: "防御" };

function numberEffect(value, percent = false) {
  const amount = Math.abs(value);
  return `${value < 0 ? "−" : value > 0 ? "+" : ""}${percent ? Number((amount * 100).toFixed(3)) + "%" : amount}`;
}

function effectRows(record, fields) {
  return fields.filter(([key]) => record[key]).map(([key, label, percent]) => [label, numberEffect(record[key], percent)]);
}

function traitRows(record) {
  return [record.trait, ...(record.traits ?? [])].filter(Boolean).map(({ kind, enemyTag, intent, bonus }) => {
    const condition = [targetNames[enemyTag], traitIntents[intent]].filter(Boolean).join(" · ");
    return [condition ? `${traitNames[kind]} · ${condition}` : traitNames[kind],
      numberEffect(bonus, kind === "dodge" || kind === "accuracy")];
  });
}

function gearStats(s, gear, wear) {
  const hold = gear.slot === "weapon" ? `${gear.hands ?? 1} 手` : "";
  const field = gear.field ?? {};
  return [
    ...(wear === 0 ? [["损坏", "加成暂时失效"]] : []),
    ...effectRows(gear, flatEffects),
    ...(gear.fixedDamage ? [["普攻固定伤害", s.creatorSwordDamage]] : []),
    ...(gear.spellQi ? [["催动法攻耗气", `−${gear.spellQi}`]] : []),
    ...effectRows(gear, [
      ["spellPower", "法攻招式威力"], ["spellPierce", "法攻穿甲"], ["spellGuard", "法攻护持"],
      ["spellInterrupt", "法攻压制"], ["chargePierce", "蓄力穿甲"], ["sideAtk", "副手攻击"],
      ["sidePierce", "副手穿甲"], ["sideGuard", "副手护持"], ["brace", "挡重招额外减伤"],
    ]),
    ...traitRows(gear),
    ...effectRows(field, [["fogTolerance", "挡雾强度"]]),
    ...(field.gatherPadding ? [["采集受伤", numberEffect(-field.gatherPadding)]] : []),
    ...(field.roadSatiety ? [["鸣沙州步行耗粮", numberEffect(-field.roadSatiety.fraction, true)]] : []),
    ...(gear.chargeRequired ? [["出招", "蓄力 1 回合"]] : []),
    ...(gear.ammo?.length ? [["弹药 · 每招 1 发", gear.ammo.map(id => itemRows[id].name).join("、")]] : []),
    ...(hold ? [["持用", hold]] : []),
    ["耐久", `${wear ?? gear.durability} / ${gear.durability}`],
    ["境界要求", gear.fixedDamage ? "无" : tierName(gear.tier)],
  ];
}

function manualStats(book, level) {
  const rank = book.ranks[level - 1];
  const specialty = [...new Set(book.specialty.map(kind => weaponNames[kind]).filter(Boolean))].join("、");
  const fist = rank.fistCharge;
  return [
    ["品阶", book.grade], ["层数", `${level} / ${book.ranks.length}`], ["运功要求", tierName(book.tier)],
    ...effectRows(rank.base, [
      ...flatEffects, ["fogTolerance", "挡雾强度"], ["restQi", "歇息回气"], ["evadeQi", "闪避成功回气"],
      ["heavyGuard", "挡重招减伤"], ["heavyGuardQi", "挡重招回气"], ["counter", "架招反击伤害"],
    ]),
    ...(specialty ? [["专攻", specialty]] : []),
    ...effectRows(rank.focus ?? {}, [["atk", "专攻攻击"], ["pierce", "专攻穿甲"], ["guard", "专攻护持"]]),
    ...(fist ? [[fist.name, "先蓄势 1 回合"], ...effectRows(fist, [["power", "蓄势拳攻击"], ["pierce", "蓄势拳穿甲"]])] : []),
  ];
}

function itemStats(s, id, wear) {
  const gear = gearRows.get(id);
  if (gear) return gearStats(s, gear, wear);
  const pill = pillRows.get(id);
  if (pill) return [
    ...effectRows({ ...pill, wound: -pill.wound }, [...recoveryEffects, ["toxin", "丹毒"], ["wound", "伤势"]]),
    ...(pill.focus ? [["强化法攻", `${numberEffect(rules.focusDamage)} · ${pill.focus} 次`]] : []),
    ["境界要求", tierName(pill.tier)],
    ...(pill.sense ? [["恢复神识要求", tierName(rules.resistanceTier)]] : []),
  ];
  const food = foodRows[id];
  if (food) return effectRows(food, recoveryEffects);
  const ammo = ammoRows.get(id);
  if (ammo) return [["攻击", numberEffect(ammo.atk)], ["穿甲", numberEffect(ammo.pierce)], ...traitRows(ammo)];
  const seal = talismanRows.get(id);
  if (seal) return [
    ...effectRows(seal, [["damage", "出手威力"], ["guard", "护持"], ["retreat", "脱身", true]]),
    ["境界要求", tierName(seal.tier)],
  ];
  const manual = manualRows.get(id);
  if (manual) return manualStats(manual, s.manualRanks?.[id] ?? 1);
  const bag = containerRows.get(id);
  if (bag) return [["袋内容量", `${bag.capacity} 格`]];
  if (itemRows[id]?.kind === "currency") return [["行囊占用", "1 格"]];
  return [];
}

function statList(rows = []) {
  return rows.length ? `<span class="item-tip-values">${rows.map(([label, value]) =>
    `<span class="item-tip-stat"><span>${escape(label)}</span><b>${escape(value)}</b></span>`).join("")}</span>` : "";
}

function itemTipBody(description, stats, id) {
  const item = id ? ` data-item-description="${escape(id)}"` : "";
  return `<span class="item-tip-flavor"${item}>${escape(description)}</span>${statList(stats)}`;
}

function spiritStats(skill) {
  const modifiers = { physicalResist: "对手物抗", perception: "对手洞察", attack: "对手出手威力" };
  return [
    ["神识消耗", `−${skill.cost}`], ["持续", `${skill.duration} 回合`], ["冷却", `${skill.cooldown} 回合`],
    ...(skill.stat ? [[modifiers[skill.stat], numberEffect(skill.strength - 1, true)]] : []),
    ...(skill.id === "split_stream" ? [["下一击伤害", `×${skill.strength}`]] : []),
  ];
}

function spiritLesson(skill, gathering) {
  const price = skill.price ? ` · ${skill.price} 灵钱` : "";
  return linkButton(`向${skill.teacher}请教${skill.name}${price}`, "spiritStudy", skill.id, "quiet",
    Boolean(skill.blocker || gathering)) + (skill.blocker ? `<p class="fine">${escape(skill.blocker)}</p>` : "");
}

function itemEntry(s, id) {
  return { id, text: itemDescription(s, id), stats: itemStats(s, id) };
}

function itemSlot(s, item, location, actions = "", label = "", count = 0, controls = {}) {
  const key = `${location}-${item.id}`;
  const open = controls.openBag ? openBagId === item.id : selectedItem === key;
  const openAction = controls.openBag ? ` data-open-bag="${escape(item.id)}"${open ? ` aria-controls="kit-bag-${escape(item.id)}"` : ""}` : "";
  const shortcut = controls.shortcut
    ? ` data-bag-action="${controls.shortcut.action}" data-bag-id="${escape(controls.shortcut.bagId)}" data-bag-item="${escape(item.id)}"` : "";
  const gear = gearRows.get(item.id);
  const status = gear && controls.wear != null ? `目前${gearCondition(controls.wear, gear.durability)}。` : controls.status ?? "";
  const entry = controls.entry ?? { id: item.id, text: itemDescription(s, item.id), stats: itemStats(s, item.id, controls.wear) };
  return `<div class="item-row" data-item-row="${escape(key)}">
    ${label ? `<span class="slot-label">${escape(label)}</span>` : ""}
    <button type="button" class="item-trigger" data-item="${escape(key)}"${openAction}${shortcut} aria-expanded="${open}" aria-describedby="tip-${escape(key)}">${escape(item.name)}${count ? `<span class="item-count">×${count}</span>` : ""}</button>
    <span class="item-tip" id="tip-${escape(key)}" role="tooltip">${itemTipBody(entry.text, entry.stats, entry.id)}</span>
    ${actions || status ? `<div class="item-tools"${open ? "" : " hidden"}>${status ? `<span class="fine item-status">${escape(status)}</span>` : ""}${actions}</div>` : ""}
  </div>`;
}

function bagTransferButton(label, action, bagId, itemId, count, disabled = false) {
  return `<button type="button" class="button quiet" data-action="${action}" data-bag-id="${escape(bagId)}"
    data-value="${escape(itemId)}" data-count="${count}"${disabled ? " disabled" : ""}>${escape(label)}</button>`;
}

function bagTransferControls(action, bagId, row) {
  if (!row) return {};
  const verb = action === "econBagDeposit" ? "装入" : "取回";
  const maximum = row.maximum ?? 0;
  const first = bagTransferButton(maximum > 1 ? `${verb} 1 件` : verb, action, bagId, row.id, 1, maximum <= 0);
  const more = maximum > 1 ? bagTransferButton(maximum === row.count ? `${verb}全部` : `${verb} ${maximum} 件`, action, bagId, row.id, "all") : "";
  const reason = row.blockedReason || row.reason;
  return { actions: first + more + (maximum <= 0 && reason ? `<p class="fine bag-blocker">${escape(reason)}</p>` : ""),
    shortcut: { action, bagId } };
}

function bagContents(s, bag, canMove) {
  if (!bag) return "";
  const rows = { "材料": [], "补给": [], "装备和功谱": [], "其他物件": [] };
  for (const row of bag.stored) {
    const item = itemRows[row.id];
    const category = item.kind === "material" ? "材料" : ["food", "pill", "ammo", "talisman"].includes(item.kind) ? "补给"
      : ["gear", "manual"].includes(item.kind) ? "装备和功谱" : "其他物件";
    const controls = canMove ? bagTransferControls("econBagWithdraw", bag.id, row) : {};
    rows[category].push(itemSlot(s, item, `bag-${bag.id}`, controls.actions, "", row.count, { ...controls, wear: row.wear }));
  }
  const storage = Object.entries(rows).map(([category, entries]) => kitDetails(`bag-${bag.id}-${category}`, category, entries, entries.length <= 6)).join("");
  return `<section class="kit-section container-kit" id="kit-bag-${escape(bag.id)}"><div class="kit-head">
      <h2>${escape(bag.name)}</h2><span class="fine">${bag.used}/${bag.capacity} 格</span></div>
    <progress class="pack-meter" max="${bag.capacity}" value="${bag.used}" aria-label="${escape(bag.name)}已用${bag.used}格，共${bag.capacity}格"></progress>
    ${storage || '<p class="fine">空</p>'}</section>`;
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

function groundRows(s) {
  return Object.entries(s.groundLoot ?? {}).map(([id, count]) => {
    const item = itemRows[id];
    const maximum = s.groundPickup?.[id] ?? 0;
    const reason = s.groundPickupReasons?.[id] || (!maximum ? "行囊已满，先腾一格。" : "");
    const label = maximum === count ? "拾取全部" : maximum ? `拾取 ${maximum}` : "拿不了";
    const cue = maximum ? `${label} · ${item.name}` : `${item.name} · ${reason}`;
    return `<div class="ground-row">
      ${itemSlot(s, item, "ground", "", "", count, { wear: s.groundWear[id] })}
      <button type="button" class="button quiet" data-action="take" data-value="${escape(id)}" aria-label="${escape(cue)}"${s.gathering || !maximum ? " disabled" : ""}>${label}</button>
      ${reason ? `<p class="fine ground-reason">${escape(reason)}</p>` : ""}
    </div>`;
  });
}

function groundSection(s, title = "脚边的物品") {
  const rows = groundRows(s);
  return rows.length ? `<section class="ground-pickups" aria-label="${title}"><h3>${title}</h3>${rows.join("")}</section>` : "";
}

function discardActions(s, id) {
  const { maximum, relief } = s.discardOptions[id] ?? {};
  if (!maximum) return "";
  const reliefOnly = relief === maximum;
  const label = reliefOnly ? "舍弃救济干粮" : "放下";
  const first = linkButton(maximum > 1 ? reliefOnly ? "舍弃 1 份救济干粮" : "放下 1 件" : label, "discard", id, "quiet");
  const all = reliefOnly ? `舍弃全部救济干粮（${maximum} 份）` : `放下全部（${maximum} 件）${relief ? " · 舍弃救济粮" : ""}`;
  return first + (maximum > 1 ? linkButton(all, "discard", id, "quiet", false, maximum) : "");
}

function meditationBlocked(s) {
  return s.gathering || !["village", "field", "event"].includes(s.mode) ? "先处理眼前的事。"
    : s.qi < s.deductionQiCost ? "真气不足。" : "";
}

function pack(s, showGround) {
  const canEquip = inVillage(s) || s.mode === "field" || s.mode === "event" || onOpenRoad(s);
  const canManageManual = canEquip && !s.gathering;
  const containers = s.economy?.containers ?? [];
  const openBag = containers.find(row => row.id === openBagId);
  const bagSources = new Map((openBag?.carried ?? []).map(row => [row.id, row]));
  const canUse = canEquip || (s.mode === "combat" && !s.currentEnemy?.medicineRestricted);
  const canEat = canManageManual;
  const repair = s.mode === "village" ? s.repairService : null;
  function repairAction(id, remaining, durability) {
    const price = repair?.prices[id];
    if (price == null || remaining >= durability) return "";
    const coins = linkButton(`付钱修理 · ${price}钱`, "repair", id, "quiet", s.coins < price);
    const parts = repair.materials[id];
    if (!parts) return coins;
    return coins + linkButton(`自备料修理 · ${supplies(parts.need)}`, "repairMaterials", id, "quiet", Boolean(parts.reason)) +
      (parts.reason ? `<p class="fine">${escape(parts.reason)}</p>` : "");
  }
  const worn = Object.entries(s.equipment).filter(([, id]) => id).map(([slot, id]) => {
    const gear = gearRows.get(id);
    const remaining = s.durability[id] ?? gear.durability;
    return itemSlot(s, itemRows[id], "worn",
      (canEquip ? linkButton("卸下", "unequip", slot) : "") + repairAction(id, remaining, gear.durability),
      slotNames[slot], 0, { wear: remaining });
  });
  const manuals = new Map((s.innerStyle?.books ?? []).map(book => [book.id, book]));
  const activeManual = s.innerStyle?.active;
  if (activeManual) worn.push(itemSlot(s, itemRows[activeManual.id], "worn",
    manualActions(activeManual, true, canManageManual, !onOpenRoad(s)) + discardActions(s, activeManual.id), "内功", 0,
    { status: activeManual.aligned ? "手头的打法合它的路数。" : "" }));
  const spirit = s.spiritSense;
  if (spirit) {
    const selected = spirit.active;
    const alternatives = spirit.rows.filter(skill => skill.learned && !skill.selected);
    const changes = canManageManual ? alternatives.map(skill =>
      linkButton(`${selected ? "改用" : "选用"}${skill.name}`, "spiritEquip", skill.id, "quiet")).join("") : "";
    const description = selected?.desc || (alternatives.length ? "点开后，可选用一门已习得的神识。" : "可去守尺观的竹尺庭向傅澄请教。");
    worn.push(itemSlot(s, { id: "active-spirit", name: selected?.name || "尚未选用" }, "worn",
      changes, "神识", 0, { entry: { text: description, stats: selected ? spiritStats(selected) : [] } }));
  }
  const carried = data.items.filter(row => s.inventory[row.id] && row.id !== activeManual?.id && !Object.values(s.equipment).includes(row.id));
  const usedClues = new Set(s.usedClues);
  const activeClues = new Set(s.activeClues);
  const meditateReason = meditationBlocked(s);
  const clueActions = id => activeClues.has(id)
    ? `<span class="fine item-status">真气 ${s.qi}/${s.maxQi}${meditateReason ? ` · ${meditateReason}` : ""}</span>
      ${linkButton(`冥想 · ${s.deductionQiCost} 真气`, "meditate", id, "quiet", Boolean(meditateReason))}` : "";
  const meal = s.packedMeal;
  const heldCount = id => s.inventory[id] - (meal?.id === id ? meal.count : 0);
  const inventory = carried.filter(row => heldCount(row.id) > 0 &&
    (row.kind !== "key" || row.breakthrough || clueMaterials.has(row.id) && usedClues.has(row.id))).map(row => {
    const gear = gearRows.get(row.id);
    const pill = pillRows.get(row.id);
    const seal = talismanRows.get(row.id);
    const book = manuals.get(row.id);
    const controls = row.kind === "container" ? { openBag: true } : canManageManual && openBag
      ? bagTransferControls("econBagDeposit", openBag.id, bagSources.get(row.id)) : {};
    let actions = "";
    if (gear) {
      const remaining = s.durability[row.id] ?? gear.durability;
      const conflict = handConflict(s.equipment, row.id);
      const disabled = Boolean(conflict) || gear.tier > s.realm.id || remaining <= 0;
      const reason = conflict.slice(0, -1);
      actions = (canEquip ? linkButton(reason || "装备", "equip", row.id, "", disabled) : "") +
        repairAction(row.id, remaining, gear.durability);
    }
    if (pill && canUse) {
      const healthy = row.id === "salve" && s.hp >= s.maxHp;
      const reason = s.medicineUseReasons[row.id];
      const label = reason ? reason.slice(0, -1) : row.id === "salve" ? (healthy ? "气血已满" : "敷伤药") : "服用";
      actions = linkButton(label, "use", row.id, "", pill.tier > s.realm.id || healthy || Boolean(reason));
    }
    if (seal && s.mode === "combat") actions = linkButton("用符", "use", row.id, "",
      seal.tier > s.realm.id || (seal.damage > 0 && s.spiritSense?.strikeBlocked));
    if (book) actions = manualActions(book, false, canManageManual, !onOpenRoad(s));
    if (foodRows[row.id] && canEat) {
      if (s.edibleMeals.includes(row.id)) {
        actions = linkButton(`吃${row.name}`, "eat", row.id);
        const quantity = s.batchMeals[row.id];
        if (quantity > 1) actions += linkButton(`连吃 ${quantity} 份`, "batchEat", row.id, "quiet");
      }
      if (row.id !== meal?.id) actions += linkButton("放进便当栏", "setMealPouch", row.id, "quiet");
    }
    if (row.id === "lost_basket" && canEquip && !onOpenRoad(s)) {
      if (!s.basketInspected) actions += linkButton("查看药篓", "inspectBasket");
      if (inVillage(s)) actions += tabButton("找药僮", "apprentice");
      actions += linkButton("拆篓取药", "unpackBasket", "", "danger");
    }
    if (row.id === "gate_scroll" && canEquip && !s.gathering && !onOpenRoad(s)) actions += tabButton("展开卷轴", "atlas");
    if (row.id === "encyclopedia") actions += '<button type="button" class="button quiet" data-open-encyclopedia>翻开全书</button>';
    actions += controls.actions ?? "";
    actions += clueActions(row.id) + discardActions(s, row.id);
    return itemSlot(s, row, "held", actions, "", heldCount(row.id), { ...controls, wear: gear ? s.durability[row.id] ?? gear.durability : undefined });
  });
  const keys = carried.filter(row => row.kind === "key" && !row.breakthrough && !usedClues.has(row.id));
  const keySlot = row => itemSlot(s, row, "clue", clueActions(row.id) + discardActions(s, row.id), "", s.inventory[row.id]);
  const clues = keys.filter(row => !formulaIds.has(row.id) && !foodRecipeIds.has(row.id)).map(keySlot);
  const formulae = keys.filter(row => formulaIds.has(row.id)).map(keySlot);
  const foodRecipes = keys.filter(row => foodRecipeIds.has(row.id)).map(keySlot);
  const ground = showGround && canEquip && !s.roadTrip?.afterBattle ? groundRows(s) : [];
  const capacityLabel = `已用${s.backpackUsed}格，共${s.backpackCapacity}格`;
  const useProgress = s.backpackCapacity > 20;
  const meter = useProgress
    ? `<progress class="pack-meter" max="${s.backpackCapacity}" value="${s.backpackUsed}" aria-label="${capacityLabel}"></progress>`
    : `<div class="bag-slots" role="img" aria-label="${capacityLabel}">${Array.from({ length: s.backpackCapacity }, (_, i) => `<i${i < s.backpackUsed ? ' class="filled"' : ""}></i>`).join("")}</div>`;
  const room = s.backpackUsed >= s.backpackCapacity ? "已满" : s.backpackUsed >= s.backpackCapacity - 2 ? "快满了" : "有空位";
  const packedFood = meal?.count
    ? itemSlot(s, itemRows[meal.id], "meal", canEat
      ? (s.edibleMeals.includes(meal.id) ? linkButton("吃", "eat", meal.id) : "") +
        (s.batchMeals[meal.id] > 1 ? linkButton(`连吃 ${s.batchMeals[meal.id]} 份`, "batchEat", meal.id, "quiet") : "") +
        linkButton("移回行囊", "setMealPouch", "none", "quiet") : "", "", meal.count)
    : `<p class="fine">${canEat && carried.some(({ id }) => foodRows[id]) ? "点一份口粮装进来。" : "空"}</p>`;
  return `<section class="kit-section"><h2>装备</h2>${worn.join("") || '<p class="fine">空</p>'}</section>
    <section class="kit-section"><div class="kit-head"><h2>${escape(s.backpackName)}</h2><span class="fine" title="${capacityLabel}">${useProgress ? `${s.backpackUsed}/${s.backpackCapacity} 格` : room}</span></div>
      ${meter}
      <div class="meal-pocket"><h3>便当栏</h3>${packedFood}</div>
      ${inventory.join("") || '<p class="fine">空</p>'}
    </section>
    ${bagContents(s, openBag, canManageManual)}
    ${kitDetails("clues", "线索", clues, clues.length <= 5)}
    ${kitDetails("formulae", "丹方", formulae)}
    ${kitDetails("food-recipes", "食谱", foodRecipes)}
    ${ground.length ? `<section class="kit-section"><h2>脚边</h2>${ground.join("")}</section>` : ""}`;
}

function kitDetails(id, label, rows, defaultOpen = false) {
  if (!rows.length) return "";
  return `<details class="kit-section formula-kit"${(kitSectionOpen.get(id) ?? defaultOpen) ? " open" : ""}>
    <summary data-kit-section="${id}">${label} · ${rows.length}</summary>${rows.join("")}
  </details>`;
}

function categoryOf(item) {
  const gear = gearRows.get(item.id);
  if (gear) return gear.slot === "weapon" || gear.sideAtk ? "武器" : "装备";
  if (item.breakthrough) return "丹药";
  if (formulaIds.has(item.id)) return "丹方";
  const category = kindNames[item.kind];
  return bookCategories.includes(category) ? category : "其他";
}

function encyclopediaEntry(s, item, noteLimit) {
  const id = escape(item.id);
  const description = itemDescription(s, item.id);
  const editing = bookEditing === item.id;
  const modified = Object.hasOwn(s.itemNotes ?? {}, item.id);
  const body = editing ? `<form class="book-form" data-book-note="${id}">
    <label class="sr-only" for="book-note-text">${escape(item.name)}的介绍</label>
    <textarea id="book-note-text" maxlength="${noteLimit}" rows="4">
${escape(bookDrafts.get(item.id) ?? description)}</textarea>
    <div class="actions"><button type="submit" class="button primary">保存介绍</button>
      <button type="button" class="button quiet" data-book-cancel="${id}">取消</button>
      ${modified ? `<button type="button" class="button quiet" data-book-reset="${id}">恢复原文</button>` : ""}
    </div></form>` : `<p class="item-description">${escape(description)}</p>${statList(itemStats(s, item.id, s.durability[item.id]))}
    <div class="actions"><button type="button" class="button quiet" data-book-edit="${id}">改介绍</button>
      ${modified ? `<button type="button" class="button quiet" data-book-reset="${id}">恢复原文</button>` : ""}</div>`;
  return `<article class="book-entry" data-book-entry="${id}"><h3>${escape(item.name)}</h3>${body}</article>`;
}

function renderEncyclopedia(s) {
  const book = s.guideBook;
  if (!book) return;
  const editor = bookBody.querySelector("textarea:focus");
  const selection = editor && [editor.selectionStart, editor.selectionEnd, editor.selectionDirection];
  const scroll = encyclopedia.scrollTop;
  const categories = new Map(bookCategories.map(category => [category, []]));
  for (const { id } of book.entries) {
    const item = itemRows[id];
    if (item) categories.get(categoryOf(item)).push(item);
  }
  const filled = [...categories].filter(([, entries]) => entries.length);
  if (!filled.length) {
    bookBody.innerHTML = '<p class="intro">书页还空着。</p>';
    return;
  }
  if (!categories.get(bookCategory)?.length) bookCategory = filled[0][0];
  const list = categories.get(bookCategory).sort((left, right) => bookNames.compare(left.name, right.name));
  const tabs = filled.map(([category]) => `<button type="button" class="button ${category === bookCategory ? "primary" : "quiet"}"
    data-book-category="${escape(category)}" aria-pressed="${category === bookCategory}">${escape(category)}</button>`).join("");
  bookBody.innerHTML = `<nav class="actions book-categories" aria-label="物品分类">${tabs}</nav>
    <div class="book-entries">${list.map(item => encyclopediaEntry(s, item, book.noteLimit)).join("")}</div>`;
  encyclopedia.scrollTop = scroll;
  if (selection) {
    const next = bookBody.querySelector("textarea");
    next?.focus({ preventScroll: true });
    next?.setSelectionRange(...selection);
  }
}

function saveEncyclopediaNote(id, text) {
  const result = act(state, "editGuideNote", { id, text });
  if (!result.ok) {
    bookStatus.textContent = result.message;
    return;
  }
  bookDrafts.delete(id);
  bookEditing = null;
  const s = view(state);
  const description = itemDescription(s, id);
  for (const tip of app.querySelectorAll(`[data-item-description="${CSS.escape(id)}"]`)) {
    tip.textContent = description;
  }
  renderEncyclopedia(s);
  bookBody.querySelector(`[data-book-edit="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  bookStatus.textContent = text ? "介绍已保存。" : "已恢复原文。";
}

function observeShopItems(s, tab) {
  const rows = tab === "alchemy" ? s.alchemy.offers
    : marketMode !== "buy" ? [] : tab === "market" ? s.market.stalls.flatMap(stall => stall.offers)
      : tab === "localMarket" ? s.localMarket.offers : [];
  const ids = rows.filter(row => (row.stock ?? row.count ?? 1) > 0).map(row => row.id);
  return ids.length && act(state, "observeGuideItems", { source: tab, ids }).changed;
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
  return panel("修行", `<div class="actions place-actions">${linkButton("打坐", "research")}
    ${next ? linkButton("尝试突破", "breakthrough", "", "primary", missing.length > 0) : ""}</div>
    ${missing.length ? `<p class="fine">${escape(missing.join(" · "))}</p>` : ""}`);
}

function workshop(s) {
  const recipes = data.recipes.filter(row => !row.facility && s.discoveredRecipes.includes(row.id));
  const household = homeMaterials(s);
  const smithMap = s.quests.find(row => row.id === "sell_forging" && !row.completed);
  const remarks = [
    household.hide > 0 && recipes.some(row => row.id === "r_hide_coat") &&
      "工匠捻了捻兽革。「这皮韧，攒两张，我给你缝件挡牙的褂子。」",
    !smithMap && !recipes.length && "工匠在门边磨剪子，脚边卷着几块旧皮。",
  ].filter(Boolean).map(line => `<p class="intro">${escape(line)}</p>`).join("");
  const bankTalismanHint = s.inventory.eddy_note > 0 && recipes.some(row => row.id === "r_bank_talisman")
    ? '<p class="intro workshop-hint">工匠沿着回汊图描出一道弯，把原图还给你。「照这一笔能画回汊符。挨逼时借它侧身，容易脱开些。」</p>' : "";
  const mapTrade = smithMap ? `<p class="intro">${escape(smithMap.desc)}</p>${smithMap.ready ? `<div class="actions">${linkButton("递一块寒铁", "handin", smithMap.id)}</div>` : ""}` : "";
  return panel("工坊", `${recipes.length ? '<div class="workshop-art" aria-hidden="true"></div>' : ""}
    ${remarks}${mapTrade}
    <div class="card-grid">${recipes.map(row => {
    const result = itemRows[row.result];
    const reason = s.craftReasons[row.id];
    return card(result.name, `${row.cost} 灵钱 · ${row.days} 日`, tag(kindNames[result.kind] ?? ""),
      linkButton(reason || "制备", "craft", row.id, "", Boolean(reason)), itemEntry(s, row.result), row.need);
  }).join("")}</div>${bankTalismanHint}`);
}

function storageRows(s, rows, action) {
  const depositing = action === "econDeposit";
  const label = depositing ? "存入" : "取出";
  return rows.length ? rows.map(row => {
    const bulk = Math.min(row.count, row.maximum ?? row.count);
    return `<div class="storage-row"><span>${entryLabel(row.name, itemEntry(s, row.id))} <small>×${row.count}</small></span>
      <div class="actions">
        ${linkButton(row.reason || `${label}一份`, action, row.id, "quiet", Boolean(row.reason))}
        ${!row.reason && bulk > 1 ? linkButton(`${label} ×${bulk}`, action, row.id, "", false, bulk) : ""}
      </div>
    </div>`;
  }).join("") : '<p class="fine">空</p>';
}

function warehouseScreen(s, warehouse) {
  const unload = Object.keys(warehouse.materialPlan).length ? `<div class="actions">
    ${linkButton("存放原料", "econStoreMaterials", "", "quiet")}
    <span class="fine">${escape(supplies(warehouse.materialPlan))}</span>
  </div>` : "";
  return `<div class="storage-columns">
    <section><h3>行囊可存</h3>${unload}${storageRows(s, warehouse.carried, "econDeposit")}</section>
    <section><h3>仓中存货 <span class="fine">${warehouse.used}/${warehouse.capacity} 格</span></h3>
      ${storageRows(s, warehouse.stored, "econWithdraw")}
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
  const { facilities, warehouse, backpack, containerPlans = [] } = s.economy;
  const options = backpack || containerPlans.length
    ? [...facilities, { id: "backpack", name: "皮匠", desc: backpack?.desc ?? "皮匠用针挑开旧皮上的一排接缝。" }]
    : facilities;
  const current = options.find(facility => facility.id === activeFacility) ?? options[0];
  if (!current) return panel("后院", "");
  const entrances = options.map(facility => `<button type="button" class="button${facility.id === current.id ? " primary" : " quiet"}"
    data-facility="${escape(facility.id)}" aria-pressed="${facility.id === current.id}">${escape(facility.name)}</button>`).join("");
  const inside = current.id === "backpack" ? backpackScreen(s, backpack, containerPlans) : (
    (current.id === "warehouse" ? warehouseScreen(s, warehouse) : "") + productionScreen(current));
  return panel("后院", `<div class="actions facility-tabs">${entrances}</div>
    <p class="intro facility-intro">${escape(current.desc)}</p>${inside}`, current.level > 0 ? tag(`${current.name} · ${current.level} 级`) : "");
}

function backpackScreen(s, backpack, containerPlans) {
  const upgrades = (backpack?.upgrades ?? []).map((row) => card(row.name, row.desc, tag(`${row.capacity} 格`),
    `<span class="fine">${row.cost} 枚灵钱 · ${row.days} 日</span>` +
      linkButton(row.label, "econExpandPack", row.capacity, "", Boolean(row.reason)) +
      (row.reason ? `<span class="fine">${escape(row.reason)}</span>` : ""),
    "", row.need)).join("");
  const bags = containerPlans.map(row => card(row.name, row.desc, tag(`${row.capacity} 格`),
    `<span class="fine">${row.cost} 枚灵钱 · ${row.days} 日</span>` +
      linkButton(row.label || "缝制", "econCraftBag", row.id, "", Boolean(row.reason)) +
      (row.reason ? `<span class="fine">${escape(row.reason)}</span>` : ""), "", row.need)).join("");
  return `<p class="fine">随身用的是${escape(s.backpackName)}，共 ${s.backpackCapacity} 格。</p>
    ${upgrades || bags ? `<div class="card-grid">${upgrades}${bags}</div>` : ""}`;
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
  const gear = gearRows.get(item.id);
  const allowed = selling ? entry.canSell : entry.canBuy;
  const label = allowed ? (selling ? "卖出" : "购入") : entry.blockedReason;
  const price = selling ? salePriceTag(entry) : tag(`${entry.price} 灵钱/件`);
  const wear = gear && s.durability[item.id];
  const quantity = selling && entry.count ? `<span class="fine">可卖 ×${entry.count}${wear != null && gear ? ` · ${gearCondition(wear, gear.durability)}` : ""}</span>` : "";
  const action = selling ? "sell" : "buy";
  const batch = Math.min(entry.demand ? rules.maxTradeCount : 5, selling ? entry.count : entry.maximum);
  const batchLabel = `${selling ? "卖出" : "购入"} ×${batch}`;
  const bulk = allowed && !gear && batch > 1 ? linkButton(saleButtonLabel(batchLabel, entry, batch), action, item.id, "quiet", false, batch) : "";
  const regular = selling && allowed ? regularSaleButton(entry, action, batch) : "";
  const stock = !selling && Number.isFinite(entry.stock) ? `<span class="fine">摊上余 ${entry.stock}</span>` : "";
  return card(item.name, "", price, `${linkButton(allowed ? saleButtonLabel(label, entry, 1) : label, action, item.id, "", !allowed)}${regular}${bulk}${quantity}${stock}${saleDemandNote(entry)}`, itemEntry(s, item.id));
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
    ? (specialized.length || fallback.length ? `<div class="card-grid">${specialized.map(entry => marketItem(s, entry, true)).join("")}${fallback.map(entry => localMarketItem(s, entry, true)).join("")}</div>`
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

function localMarketItem(s, entry, selling) {
  const item = itemRows[entry.id];
  const maximum = selling ? Math.min(entry.count, rules.maxTradeCount) : entry.maximum;
  const label = selling ? "卖出" : "购入";
  const action = selling ? "localSell" : "localBuy";
  const reason = entry.reason || (selling ? "暂不能出手" : entry.count ? "眼下买不了" : "已卖完");
  const buttons = linkButton(maximum ? saleButtonLabel(label, entry, 1) : reason, action, item.id, "", !maximum) +
    (selling ? regularSaleButton(entry, action, maximum) : "") +
    (maximum > 1 ? linkButton(saleButtonLabel(`${label} ×${maximum}`, entry, maximum), action, item.id, "quiet", false, maximum) : "");
  const stock = `<span class="fine">${selling ? "可卖" : "在摊"} ×${entry.count}</span>`;
  return card(item.name, "", selling ? salePriceTag(entry) : tag(`${entry.price} 灵钱/件`), `${buttons}${stock}${saleDemandNote(entry)}`,
    itemEntry(s, item.id));
}

function localMarketScreen(s) {
  const selling = marketMode === "sell";
  const rows = selling ? s.localMarket.buys : s.localMarket.offers;
  const talk = s.localMarket.talk;
  return panel(`${s.region.name}集市`, `${marketSwitcher()}${talk ? `<div class="actions">${linkButton(talk.label, "localAsk", "", "quiet")}</div>` : ""}${rows.length ? `<div class="card-grid">${rows.map(entry => localMarketItem(s, entry, selling)).join("")}</div>` :
    '<p class="intro">行囊里暂时没有能卖的东西。</p>'}`, tag(`灵钱 ${s.coins}`));
}

function sectScreen(s) {
  const sect = s.sect;
  const joining = sect.join;
  const disciple = sect.disciple;
  const jobs = sect.joined ? sect.jobs.map(job => card(job.name, job.desc, tag(`${job.credit} 功劳`),
    linkButton(job.reason || "交这班差事", "sectWork", job.id, "", !job.available), "", job.need)).join("") : "";
  const ranks = sect.joined ? sect.ranks.map(rank => {
    const role = rank.disciple === disciple?.name && rank.credit === disciple?.credit ? "" : rank.role;
    return card(rank.disciple ?? rank.name, [role, supplies(rank.reward)].filter(Boolean).join(" · "), tag(`${rank.credit} 功劳`),
      rank.claimed || rank.honorary ? "" : linkButton(rank.reason || "领门中回礼", "sectClaim", rank.id, "", !rank.available));
  }).join("") : "";
  const invitation = sect.joined ? "" : joining.returning ? '<p class="fine">退门前的功劳还在。</p>' :
    `<p class="fine">入门 ${joining.coins} 灵钱 · ${escape(supplies(joining.need))}</p>`;
  const button = sect.joined ? linkButton("向管事辞行", "sectLeave", "", "quiet") :
    linkButton(joining.reason || (joining.returning ? "回师门" : "向管事投帖"), "sectJoin", "", "", !joining.available);
  return panel(sect.name, `<p class="intro">${escape(sect.desc)}</p>${disciple?.role ? `<p class="fine sect-affiliation">${escape(disciple.role)}</p>` : ""}
    ${invitation}<div class="actions">${button}</div>${jobs || ranks ? `<div class="card-grid">${jobs}${ranks}</div>` : ""}`,
    disciple ? tag(`${disciple.name} · ${sect.credit} 功劳`) : "");
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
      ${match.enrolled && s.boutPause > 0 ? linkButton("去场边歇半日", s.restSessions ? "rest" : "wait", "", "quiet") : ""}
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
  const affiliation = s.affiliation ? tag(`${s.affiliation.name} · ${s.affiliation.disciple.name}`) : "";
  const spirit = s.spiritSense;
  const skills = spirit?.rows.filter(skill => skill.learned).map((skill) => {
    const action = linkButton(skill.selected ? "正在运用" : "选用", "spiritEquip", skill.id, "", skill.selected);
    return card(skill.name, "", "", action, { text: skill.desc, stats: spiritStats(skill) });
  }).join("");
  const practices = contents ? panel("修习进度", `<div class="card-grid">${contents}</div>`, affiliation) : "";
  return practices + (spirit ? panel("神识", skills ? `<div class="card-grid">${skills}</div>` :
    '<p class="fine">可以去守尺观的竹尺庭向傅澄请教。</p>') : "");
}

function alchemy(s) {
  const teacher = s.alchemy;
  const commission = teacher.inquiry;
  const formulae = teacher.offers.map(({ id, name, price, known, reason }) => card(
    name, "", known ? tag("已学会") : tag(`${price} 灵钱`),
    known ? "" : linkButton(reason || "买下丹方", "alchemyBuyFormula", id, "", Boolean(reason)), itemEntry(s, id),
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
  const pending = list.filter(row => !questDone(s, row));
  const delivered = list.filter(row => questDone(s, row));
  const current = pending.map(row => card(row.name, row.desc + (row.blockedReason ? ` ${row.blockedReason}` : ""), "",
    linkButton(row.ready ? "交付" : "暂不能交付", "handin", row.id, "primary", !row.ready), "", row.need)).join("");
  const history = delivered.map(row => card(row.name, row.desc)).join("");
  return panel("委托", `${current ? `<div class="card-grid">${current}</div>` : ""}
    ${history ? `<details class="merchant-order"${pending.length ? "" : " open"}><summary>已交付 · ${delivered.length}</summary><div class="card-grid">${history}</div></details>` : ""}`);
}

function apprentice(s) {
  const delivery = s.quests.find(quest => quest.id === "lost_basket_return");
  const reeds = s.quests.find(quest => quest.id === "reed_salve" && !quest.completed);
  const waterline = s.quests.find(quest => quest.id === "apprentice_waterline" && !quest.completed);
  const holding = Boolean(s.inventory.lost_basket);
  const tasks = [[holding && delivery, "交还药篓"], [reeds, "递一份灵草"], [waterline, "拿灵草换水线图"]]
    .filter(([quest]) => quest).map(([quest, label]) => `<p class="intro">${escape(quest.desc)}</p>
      ${quest.ready ? `<div class="actions">${linkButton(label, "handin", quest.id, "primary")}</div>` : ""}
      ${quest.blockedReason ? `<p class="choice-blocker">${escape(quest.blockedReason)}</p>` : ""}`).join("");
  return panel("药僮", tasks || '<p class="intro">药僮正忙着看火。</p>');
}

function meditationForm(s) {
  const ids = s.activeClues ?? [];
  if (!ids.length) return "";
  const listed = ids.includes(meditationClue);
  const reason = meditationBlocked(s);
  return `<form class="meditation" data-meditation>
    <label for="meditation-clue">选一条线索</label><div class="meditation-actions">
    <select id="meditation-clue" name="clue" required><option value="" disabled${listed ? "" : " selected"}>请选择</option>
      ${ids.map(id => `<option value="${escape(id)}"${id === meditationClue ? " selected" : ""}>${escape(itemRows[id].name)}</option>`).join("")}
    </select><button type="submit" class="button"${!listed || reason ? " disabled" : ""}${reason ? ' aria-describedby="meditation-blocker"' : ""}>冥想 · ${s.deductionQiCost} 真气</button></div>
    <p class="fine item-description" data-clue-preview${listed ? "" : " hidden"}>${listed ? escape(itemDescription(s, meditationClue)) : ""}</p>
    ${reason ? `<p class="fine" id="meditation-blocker">${escape(reason)}</p>` : ""}</form>`;
}

function deductionHistory(s) {
  const notes = s.deductionHistory ?? [];
  if (!notes.length) return "";
  const recent = [...notes].reverse();
  const ordered = [...recent.filter(note => !note.verified), ...recent.filter(note => note.verified)];
  return `<details class="deduction-history" data-deduction-history${deductionHistoryOpen ? " open" : ""}>
    <summary>推演历史</summary>
    ${ordered.map(({ id, title, conclusion, reason, verified, destination }) =>
      `<details class="deduction-record" data-deduction-record="${escape(id)}"${openDeductions.has(id) ? " open" : ""}>
        <summary>${escape(title)} <span class="fine">· ${verified ? "已验证" : "待验证"}</span></summary>
        ${destination ? `<p class="fine">${escape(destination.region)} · ${escape(destination.site)}</p>` : ""}
        <p>${escape(conclusion)}</p><p class="fine deduction-reason">${escape(reason)}</p>
      </details>`).join("")}
  </details>`;
}

function deductionBoard(s) {
  const draft = s.deductionDraft;
  const history = deductionHistory(s);
  const onTable = draft ? `<section class="deduction-table"><h3>${escape(draft.title)}</h3>
    <ul>${draft.items.map(({ id, name }) => `<li><strong>${escape(name)}</strong>
      <p class="fine item-description" data-item-description="${escape(id)}">${escape(itemDescription(s, id))}</p></li>`).join("")}</ul>
    <div class="actions">${linkButton("推演", "deduce", draft.id, "primary")}${linkButton("收起线索", "clearDeductionDraft", "", "quiet")}</div>
  </section>` : meditationForm(s);
  return atlas(s) + panel("沙盘", onTable + history);
}

const focusKeys = ["data-action", "data-value", "data-count", "data-bag-id", "data-tab", "data-facility",
  "data-market-mode", "data-item", "data-atlas-province", "data-atlas-point", "data-atlas-edge", "data-atlas-overview", "data-atlas-zoom", "data-atlas-scroll"];
const focusControls = ["button", ".atlas-road[data-atlas-edge]", "[data-atlas-scroll]"];
const visibleFocusControls = focusControls.map(selector => selector + ":focus-visible").join(", ");

function keyboardFocus() {
  const control = document.activeElement;
  if (!control?.matches(visibleFocusControls)) return null;
  const area = control.closest("#main, #player-status, #kit, .navigation");
  if (!area) return null;
  const keys = focusKeys.filter(key => control.hasAttribute(key))
    .map(key => `[${key}="${CSS.escape(control.getAttribute(key))}"]`).join("");
  return { area, keys, action: control.dataset.action, bagId: control.dataset.bagId };
}

function restoreKeyboardFocus(focus) {
  if (!focus) return;
  const candidates = focus.keys
    ? [...focus.area.querySelectorAll(focusControls.map(selector => selector + focus.keys + ":not(:disabled)").join(", "))]
    : [];
  const inspected = focus.area === kit && selectedItem ? kit.querySelector(`[data-item="${CSS.escape(selectedItem)}"]`) : null;
  const offerFollowUp = focus.area === main && banditOfferActions.includes(focus.action)
    ? main.querySelector('[data-action="banditSettle"]:enabled') ?? main.querySelector('[data-road-offers] summary') : null;
  const bagFollowUp = focus.area === kit && bagTransferActions.includes(focus.action)
    ? kit.querySelector(`[data-open-bag="${CSS.escape(focus.bagId)}"]`) : null;
  const chosen = candidates.find(control => control.getClientRects().length) ?? inspected ?? offerFollowUp ?? bagFollowUp ??
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
  const previousMap = main.querySelector("[data-atlas-scroll]");
  if (previousMap) atlasCameras.set(previousMap.dataset.atlasScroll, {
    zoom: atlasZoom(previousMap), x: previousMap.scrollLeft, y: previousMap.scrollTop,
  });
  let s = view(state);
  const carriedBags = s.economy?.containers ?? [];
  if (openBagId && !carriedBags.some(row => row.id === openBagId)) openBagId = null;
  if (s.mode !== "combat") combatObservation = null;
  const dead = s.mode === "death";
  const inEvent = s.mode === "event";
  const inEncounter = dead || s.mode === "combat" || s.mode === "victory" || s.mode === "road" || Boolean(s.gathering);
  const services = inVillage(s) ? villageServices(s) : [];
  const originalHome = atLanding(s);
  const available = {
    journey: true, village: Boolean(services.length), apprentice: originalHome,
    deduction: Boolean(s.activeClues?.length || s.deductionDraft || s.deductionHistory?.length),
    workshop: originalHome && s.services.includes("workshop"), market: originalHome && s.services.includes("market"),
    yard: originalHome && Boolean(s.economy), alchemy: originalHome && Boolean(s.alchemy),
    atlas: !inEvent || s.world.scrollCount > 0, localMarket: inVillage(s) && !originalHome && Boolean(s.localMarket),
    sect: inVillage(s) && Boolean(s.sect), tournament: inVillage(s) && Boolean(s.tournament), training: Boolean(s.training?.length || s.spiritSense),
  };
  for (const service of services) available[service] = true;
  const eventTabs = ["journey", "atlas", "deduction"];
  const tab = inEncounter || !available[screen] || (inEvent && !eventTabs.includes(screen)) ? "journey" : screen;
  if (observeShopItems(s, tab)) s = view(state);
  const content = { journey, village, apprentice, cultivate: cultivation, workshop, market, yard, alchemy, quests: questBoard,
    deduction: deductionBoard, atlas, localMarket: localMarketScreen, sect: sectScreen, tournament: tournamentScreen, training: trainingScreen };
  document.querySelector("#clock").textContent = `第${Math.floor(s.day)}日 · ${s.day % 1 < 0.5 ? "白昼" : "夜里"}`;
  const playerStatus = document.querySelector("#player-status");
  playerStatus.hidden = dead;
  playerStatus.innerHTML = dead ? "" : stats(s);
  kit.hidden = dead;
  kit.innerHTML = dead ? "" : pack(s, tab !== "journey");
  app.querySelector("[data-help]").hidden = dead;
  bookToggle.hidden = dead || !s.guideBook;
  if (dead && guide.open) guide.close();
  if (encyclopedia.open) {
    if (bookToggle.hidden) encyclopedia.close();
    else renderEncyclopedia(s);
  }
  for (const button of document.querySelectorAll('#player-status [data-action], #kit [data-action]:not([data-action="discard"])')) {
    if (s.gathering) button.disabled = true;
  }
  for (const button of document.querySelectorAll(".navigation button")) {
    const id = button.dataset.tab;
    button.hidden = inEncounter || id === tab || !available[id] || (inEvent && !eventTabs.includes(id));
  }
  guide.querySelector('[data-tab="training"]').hidden = !available.training || inEncounter || inEvent;
  guideAffiliation.hidden = !s.affiliation;
  guideAffiliation.textContent = s.affiliation ? `${s.affiliation.name} · ${s.affiliation.disciple.name}` : "";
  guideBags.hidden = !carriedBags.length;
  guideDeduction.hidden = !available.deduction;
  main.innerHTML = (dead ? "" : roadPosition(s.roadTrip)) + content[tab](s);
  const nextMap = main.querySelector("[data-atlas-scroll]");
  if (nextMap) {
    const camera = atlasCameras.get(nextMap.dataset.atlasScroll);
    if (camera) nextMap.scrollTo(camera.x, camera.y);
    else centerAtlasOn(nextMap, nextMap.querySelector(".atlas-mark[aria-pressed='true']"));
  }
  restoreKeyboardFocus(focus);
  return s;
}

function selectItem(key) {
  selectedItem = selectedItem === key ? null : key;
  for (const trigger of app.querySelectorAll("#kit [data-item], .ground-pickups [data-item]")) {
    const open = trigger.dataset.openBag ? trigger.dataset.openBag === openBagId : trigger.dataset.item === selectedItem;
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

function feedback(before, after, result, action, presentation, payload) {
  if (result.ok && action === "discard") return [result.message];
  if (result.ok && banditOfferActions.includes(action)) return [];
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
  if (result.ok && bagTransferActions.includes(action)) {
    const item = itemRows[payload.id];
    const bag = itemRows[payload.bagId];
    const count = Math.abs((after.inventory[item.id] ?? 0) - (before.inventory[item.id] ?? 0));
    return count ? [action === "econBagDeposit" ? `把${item.name} ×${count}装入${bag.name}。` : `从${bag.name}取回${item.name} ×${count}。`] : [];
  }
  const lines = [];
  if (result.ok && banditPaymentActions.includes(action)) {
    const cost = [result.paidCoins > 0 && `${result.paidCoins} 灵钱`, supplies(result.paidGoods)].filter(Boolean).join("、");
    if (cost) lines.push(`交出${cost}。`);
  }
  const banditLoss = result.banditLoss;
  if (banditLoss && !banditLoss.deadly) {
    const lost = [banditLoss.coins > 0 && `${banditLoss.coins} 灵钱`, supplies(banditLoss.goods)].filter(Boolean).join("、");
    if (lost) lines.push(`强盗拿走了${lost}。`);
  }
  if (result.roadCoins > 0) lines.push(`从路上捡到 ${result.roadCoins} 灵钱。`);
  if (result.ok && action === "attack") {
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
  const restored = result.medicineRecovery;
  if (restored || result.enemyMedicineRecovery) narrative = narrative.replace(/(?:气血|神识)回了\d+点。/g, "");
  const roadEncounter = result.ok && before.roadBandit !== after.roadBandit && presentation.roadTrip?.bandit;
  if (roadEncounter) {
    lines.push(`路上遇见${roadEncounter.name}。`);
    if (roadEncounter.intro) narrative = narrative.replace(roadEncounter.intro, "");
  }
  const enemy = result.ok && before.combat !== after.combat && presentation.currentEnemy;
  if (enemy && !narrative.includes(enemy.name)) lines.push(`和${enemy.name}交手。`);
  if (action === "banditFight" && enemy) narrative = narrative.replace(/^你把行囊拢到身后，摆开架势。/, "");
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
  if (!result.ok || !["batchEat", "restUntilRecovered", "repairMaterials"].includes(action)) narrative = publicText(narrative);
  narrative = narrative.replace(/^初探此地[，。]?/, "").trim();
  if (narrative) lines.push(narrative);
  const medicineEffect = [restored?.hp > 0 && `气血回了${restored.hp}点。`, restored?.sense > 0 && `神识回了${restored.sense}点。`].filter(Boolean).join("");
  if (medicineEffect) lines.push(medicineEffect);
  if (result.enemyMedicineRecovery) lines.push(`对手气血回了${result.enemyMedicineRecovery}点。`);
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
    didRecover && !restored?.hp && !narrative.includes("气血") && `气血回升 ${after.hp - before.hp} 点`,
    action === "guard" && after.qi > before.qi && `真气回升 ${after.qi - before.qi} 点`,
    after.qi > before.qi && (rested || action === "choose" || action === "use") && !narrative.includes("真气") && "真气恢复",
    result.fogLoss > 0 && `浓雾耗去 ${result.fogLoss} 点真气`,
    !result.fogLoss && after.qi < before.qi && ["choose", "visit", "revisit", "weaponSpell", "meditate"].includes(action) && !narrative.includes("真气") && `真气减少 ${before.qi - after.qi} 点`,
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
  for (const id of after.banditLeads ?? []) {
    if (before.banditLeads.includes(id)) continue;
    const site = data.sites.find(entry => entry.id === id);
    const region = data.regions.find(entry => entry.id === site?.region);
    const cue = site && region && `从${region.name}可以去「${site.name}」了。`;
    if (cue && !narrative.includes(cue)) lines.push(cue);
  }
  return [...new Set(lines)];
}

function confirmDisposal(options, message) {
  pendingDisposal = options;
  const verb = options.action === "discard" ? "放下" : "卖出";
  disposal.querySelector("#disposal-title").textContent = `确认${verb}`;
  disposal.querySelector("[data-disposal-item]").textContent = options.name;
  disposal.querySelector("#disposal-description").textContent = options.action === "discard"
    ? `这件物品无法重新取得。放下后仍可回${options.placeName}找。` : message;
  const quantity = disposal.querySelector('[name="count"]');
  quantity.value = options.count;
  quantity.max = options.maximum;
  quantity.readOnly = options.maximum === 1;
  disposal.querySelector("[data-disposal-submit]").textContent = `确认${verb}`;
  disposal.showModal();
}

function closeDisposal() {
  pendingDisposal = null;
  disposal.close();
}

function performAction(action, payload) {
  const before = {
    inventory: { ...state.inventory }, discovered: [...state.discovered],
    banditLeads: [...(state.banditLeads ?? [])], roadBandit: state.roadBandit, combat: state.combat,
    hp: state.hp, qi: state.qi, satiety: state.satiety, coins: state.coins,
  };
  const result = act(state, action, payload);
  if (result.confirmation) {
    confirmDisposal(result.confirmation, result.message);
    return;
  }
  const readyToDeduce = result.ok && action === "meditate" && result.meditation === "ready";
  const concluded = result.ok && action === "deduce";
  if (action === "meditate") meditationClue = payload.item;
  if (readyToDeduce && screen !== "deduction") atlasProvince = data.regionDetails[state.region]?.province ?? "wuliang";
  if (readyToDeduce || concluded) screen = "deduction";
  if (concluded) {
    deductionHistoryOpen = true;
    openDeductions.add(payload.id);
  }
  const transferred = result.ok && instantRoutes.includes(action);
  if ((result.ok && roadTravelActions.includes(action)) || ["visit", "choose", "leave", "revisit", "resume"].includes(action) || transferred) screen = "journey";
  if (transferred || (result.ok && roadTravelActions.includes(action))) {
    atlasProvince = null;
    atlasPoint = null;
    atlasEdge = null;
  }
  if ([...roadTravelActions, "discard", "take", "equip", "unequip"].includes(action)) selectedItem = null;
  if (result.ok && action === "equipManual") selectedItem = `worn-${payload.id}`;
  if (result.ok && action === "unequipManual") selectedItem = `held-${payload.id}`;
  const presentation = render();
  if (readyToDeduce) main.querySelector('[data-action="deduce"]')?.focus({ preventScroll: true });
  if (concluded) main.querySelector(`[data-deduction-record="${CSS.escape(payload.id)}"] > summary`)?.focus({ preventScroll: true });
  if (action === "beginGather" && result.ok) {
    runGatherProgress(state.gathering);
    return;
  }
  const lines = feedback(before, state, result, action, presentation, payload);
  const newThreat = before.roadBandit !== state.roadBandit && presentation.roadTrip?.bandit?.fightAllowed;
  showNotice(lines, Boolean(result.injury || result.damageTaken || result.banditLoss || presentation.mode === "death" || newThreat || !result.ok));
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
    const progress = main.querySelector("[data-gather-progress]");
    if (progress) progress.value = Math.min(1, (now - startedAt) / duration);
    if (bar.value < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  setTimeout(() => {
    if (state.gathering !== job) return;
    const restoreFocus = document.activeElement === main.querySelector("[data-gather-progress]");
    performAction("finishGather");
    if (restoreFocus && state.event === job.siteId) {
      const next = main.querySelector(`[data-action="beginGather"][data-value="${job.index}"]:enabled`) ??
        main.querySelector('[data-action="leave"]');
      next?.focus({ preventScroll: true });
    }
  }, duration);
}

function readExperiment(form) {
  const settings = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key.slice("setting-".length), value]));
  return { id: form.dataset.experiment, settings };
}

document.addEventListener("input", event => {
  const form = event.target.form;
  if (form?.dataset.bookNote) bookDrafts.set(form.dataset.bookNote, event.target.value);
  if (form?.hasAttribute("data-meditation")) {
    meditationClue = event.target.value;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = !meditationClue || button.hasAttribute("aria-describedby");
    const preview = form.querySelector("[data-clue-preview]");
    preview.textContent = meditationClue ? itemDescription(state, meditationClue) : "";
    preview.hidden = !meditationClue;
  }
  if (form?.dataset.experiment) experimentDrafts.set(form.dataset.experiment, readExperiment(form).settings);
});

document.addEventListener("submit", event => {
  const form = event.target;
  if (form.hasAttribute("data-disposal-confirm")) {
    event.preventDefault();
    if (!pendingDisposal) return;
    const { action, id, place } = pendingDisposal;
    const count = form.elements.count.valueAsNumber;
    closeDisposal();
    performAction(action, { id, count, confirmed: true, expectedPlace: place });
    return;
  }
  if (form.dataset.bookNote) {
    event.preventDefault();
    saveEncyclopediaNote(form.dataset.bookNote, form.querySelector("textarea").value);
    return;
  }
  if (!form.matches("[data-meditation], [data-experiment]")) return;
  event.preventDefault();
  if (form.hasAttribute("data-meditation")) {
    performAction("meditate", { item: new FormData(form).get("clue") });
  } else {
    const trial = readExperiment(form);
    experimentDrafts.set(trial.id, trial.settings);
    performAction("experiment", trial);
  }
});

disposal.addEventListener("cancel", () => { pendingDisposal = null; });

kit.addEventListener("contextmenu", event => {
  const trigger = event.target.closest("button[data-bag-action]");
  if (!trigger || event.button !== 2) return;
  event.preventDefault();
  performAction(trigger.dataset.bagAction, { bagId: trigger.dataset.bagId, id: trigger.dataset.bagItem, count: event.shiftKey ? 1 : "all" });
});

main.addEventListener("wheel", event => {
  const viewport = event.target.closest?.("[data-atlas-scroll]");
  if (!viewport || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
  event.preventDefault();
  if (atlasWheel?.viewport !== viewport || event.timeStamp - atlasWheel.time > 180) {
    atlasWheel = { viewport, time: event.timeStamp, distance: 0 };
  }
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
  atlasWheel.time = event.timeStamp;
  if (Math.sign(delta) !== Math.sign(atlasWheel.distance)) atlasWheel.distance = 0;
  atlasWheel.distance += delta;
  if (Math.abs(atlasWheel.distance) < 48) return;
  changeAtlasZoom(viewport, -Math.sign(atlasWheel.distance), event);
  atlasWheel.distance = 0;
}, { passive: false });

document.addEventListener("pointerdown", event => {
  atlasSuppressClick = false;
  const viewport = event.target.closest?.("[data-atlas-scroll]");
  if (!viewport || event.pointerType === "touch" || event.button !== 0 || !event.isPrimary ||
    (viewport.scrollWidth <= viewport.clientWidth && viewport.scrollHeight <= viewport.clientHeight)) return;
  atlasDrag = { id: event.pointerId, viewport, startX: event.clientX, startY: event.clientY,
    x: viewport.scrollLeft, y: viewport.scrollTop, moving: false };
});

document.addEventListener("pointermove", event => {
  const drag = atlasDrag;
  if (drag?.id !== event.pointerId || !drag.viewport.isConnected) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (!drag.moving) {
    if (Math.hypot(dx, dy) < 5) return;
    drag.viewport.setPointerCapture(event.pointerId);
    drag.viewport.classList.add("atlas-dragging");
    drag.moving = true;
  }
  drag.viewport.scrollTo(drag.x - dx, drag.y - dy);
  event.preventDefault();
});

function endAtlasDrag(event) {
  if (atlasDrag?.id !== event.pointerId) return;
  atlasDrag.viewport.classList.remove("atlas-dragging");
  atlasSuppressClick = atlasDrag.moving;
  atlasDrag = null;
}

document.addEventListener("pointerup", endAtlasDrag);
document.addEventListener("pointercancel", endAtlasDrag);
main.addEventListener("click", event => {
  if (!atlasSuppressClick || !event.detail) return;
  atlasSuppressClick = false;
  if (event.target.closest?.("[data-atlas-scroll]")) event.stopPropagation();
}, true);

document.addEventListener("keydown", event => {
  const viewport = event.target.matches?.("[data-atlas-scroll]") ? event.target : null;
  if (viewport && ["+", "=", "-", "−"].includes(event.key) && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    changeAtlasZoom(viewport, event.key === "+" || event.key === "=" ? 1 : -1);
    return;
  }
  const road = event.target.closest?.(".atlas-road[data-atlas-edge]");
  if (road && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    road.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
});

document.addEventListener("click", event => {
  const observation = event.target.closest(".field-note > summary");
  if (observation && state.combat) combatObservation = observation.parentElement.open ? null : state.combat;
  const summary = event.target.closest("summary[data-kit-section]");
  if (summary) kitSectionOpen.set(summary.dataset.kitSection, !summary.parentElement.open);
  const atlasSummary = event.target.closest(".atlas-index > summary");
  if (atlasSummary) atlasIndexOpen = !atlasSummary.parentElement.open;
  const roadSummary = event.target.closest(".atlas-road-index > summary");
  if (roadSummary) atlasRoadsOpen = !roadSummary.parentElement.open;
  const historySummary = event.target.closest("[data-deduction-history] > summary");
  if (historySummary) deductionHistoryOpen = !historySummary.parentElement.open;
  const deductionSummary = event.target.closest("[data-deduction-record] > summary");
  if (deductionSummary) {
    const record = deductionSummary.parentElement;
    if (record.open) openDeductions.delete(record.dataset.deductionRecord);
    else openDeductions.add(record.dataset.deductionRecord);
  }
  const button = event.target.closest("button, .atlas-road[data-atlas-edge]");
  if (!button) return;
  if (button.hasAttribute("data-skip-opening")) {
    dismissOpening();
    return;
  }
  if (button.hasAttribute("data-skip-transfer")) {
    dismissTransfer();
    return;
  }
  if (button.hasAttribute("data-disposal-cancel")) {
    closeDisposal();
    return;
  }
  if (button.dataset.openBag) {
    openBagId = openBagId === button.dataset.openBag ? null : button.dataset.openBag;
    selectedItem = null;
    render();
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
  if (button.hasAttribute("data-open-encyclopedia")) {
    const s = view(state);
    if (!s.guideBook || s.mode === "death") return;
    bookStatus.textContent = "";
    renderEncyclopedia(s);
    encyclopedia.showModal();
    return;
  }
  if (button.hasAttribute("data-close-encyclopedia")) {
    encyclopedia.close();
    return;
  }
  if (button.dataset.bookCategory) {
    bookCategory = button.dataset.bookCategory;
    bookEditing = null;
    bookStatus.textContent = "";
    renderEncyclopedia(view(state));
    bookBody.querySelector(`[data-book-category="${CSS.escape(bookCategory)}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.bookEdit) {
    bookEditing = button.dataset.bookEdit;
    bookStatus.textContent = "";
    renderEncyclopedia(view(state));
    bookBody.querySelector("textarea")?.focus();
    return;
  }
  if (button.dataset.bookCancel) {
    const id = button.dataset.bookCancel;
    bookDrafts.delete(id);
    bookEditing = null;
    renderEncyclopedia(view(state));
    bookBody.querySelector(`[data-book-edit="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.bookReset) {
    saveEncyclopediaNote(button.dataset.bookReset, "");
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
    if (button.dataset.reset !== "death" && !window.confirm("重新开始这一局？")) return;
    state = freshGame();
    screen = "journey";
    marketMode = "buy";
    activeFacility = "warehouse";
    kitSectionOpen.clear();
    atlasProvince = null;
    atlasPoint = null;
    atlasEdge = null;
    atlasIndexOpen = false;
    atlasRoadsOpen = false;
    bookCategory = null;
    bookEditing = null;
    bookDrafts.clear();
    selectedItem = null;
    openBagId = null;
    for (const topic of guide.querySelectorAll("details")) topic.open = false;
    meditationClue = null;
    deductionHistoryOpen = false;
    openDeductions.clear();
    experimentDrafts.clear();
    notices.replaceChildren();
    if (encyclopedia.open) encyclopedia.close();
    if (disposal.open) closeDisposal();
    guide.close();
    render();
    atlasCameras.clear();
    restartNotice = true;
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
  if (button.dataset.atlasZoom) {
    const viewport = button.closest(".atlas-frame").querySelector("[data-atlas-scroll]");
    changeAtlasZoom(viewport, Number(button.dataset.atlasZoom));
    return;
  }
  if (button.dataset.atlasProvince) {
    atlasProvince = button.dataset.atlasProvince;
    atlasPoint = null;
    atlasEdge = null;
    render();
    (main.querySelector('.atlas-map [aria-pressed="true"]') ?? main.querySelector("[data-atlas-overview]"))?.focus({ preventScroll: true });
    return;
  }
  if (button.hasAttribute("data-atlas-overview")) {
    const province = atlasProvince;
    atlasProvince = null;
    atlasPoint = null;
    atlasEdge = null;
    render();
    main.querySelector(`[data-atlas-province="${CSS.escape(province)}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.atlasPoint) {
    const origin = button.closest(".atlas-index") ? ".atlas-index" : ".atlas-map";
    atlasPoint = button.dataset.atlasPoint;
    atlasProvince = data.regionDetails[atlasPoint].province;
    atlasEdge = null;
    render();
    main.querySelector(`${origin} [data-atlas-point="${CSS.escape(atlasPoint)}"]`)?.focus({ preventScroll: true });
    if (origin === ".atlas-index") {
      const scroll = main.querySelector("[data-atlas-scroll]");
      const label = scroll?.querySelector(`[data-atlas-point="${CSS.escape(atlasPoint)}"]`);
      if (scroll) centerAtlasOn(scroll, label);
    }
    return;
  }
  if (button.dataset.atlasEdge) {
    const fromList = Boolean(button.closest(".atlas-road-index"));
    atlasEdge = button.dataset.atlasEdge;
    render();
    const detail = main.querySelector("#atlas-edge-detail");
    const road = main.querySelector(`.atlas-map [data-atlas-edge="${CSS.escape(atlasEdge)}"]`);
    const scroll = road?.closest("[data-atlas-scroll]");
    if (fromList && scroll) centerAtlasOn(scroll, road);
    (detail?.querySelector("button:enabled") ?? road)?.focus({ preventScroll: true });
    detail?.scrollIntoView({ block: "nearest" });
    return;
  }
  if (button.dataset.tab) {
    screen = button.dataset.tab;
    if (screen === "atlas" || screen === "deduction") {
      atlasProvince = data.regionDetails[state.region]?.province ?? "wuliang";
      atlasPoint = null;
      atlasEdge = null;
    }
    if (guide.open) guide.close();
    if (screen === "workshop" && !state.showedHideToSmith) {
      act(state, "showHideToSmith");
    }
    render();
    return;
  }
  const action = button.dataset.action;
  if (!action) return;
  const value = button.dataset.value;
  if (bagTransferActions.includes(action)) {
    const count = button.dataset.count === "all" ? "all" : Number(button.dataset.count);
    performAction(action, { bagId: button.dataset.bagId, id: value, count });
    return;
  }
  if (action === "meditate") {
    performAction(action, { item: value });
    return;
  }
  const payload = ["choose", "beginGather"].includes(action) ? { index: Number(value) } :
    action === "unequip" ? { slot: value } : action === "take" ? { id: value } : { id: value, count: Number(button.dataset.count ?? 1) };
  performAction(action, payload);
});

render();
document.querySelector("#boot-status").hidden = true;
app.hidden = false;
showOpening();
