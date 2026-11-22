import { data } from "./data.mjs";
import { act, createGame, rules, view } from "./engine.mjs";

const itemRows = Object.fromEntries(data.items.map(item => [item.id, item]));
const slotNames = { weapon: "兵刃", armor: "护具", charm: "法器" };
const intentNames = { attack: "进攻", heavy: "蓄势", guard: "守势", heal: "疗伤", drain: "夺气" };
const kindNames = { material: "材料", food: "口粮", gear: "装备", pill: "丹药", talisman: "符箓", key: "线索" };
const serviceNames = { cultivate: "修行", workshop: "工坊", market: "坊市", quests: "委托" };
const app = document.querySelector("#app");
const main = document.querySelector("#main");
const guide = document.querySelector("#help");
const kit = document.querySelector("#kit");
const notices = document.querySelector("#notices");
const opening = document.querySelector("#opening");
let state = freshGame();
let screen = "journey";
let openingTimer;
let selectedItem = null;
let activeDeduction = null;
const deductionDrafts = new Map();

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
  openingTimer = setTimeout(dismissOpening, matchMedia("(prefers-reduced-motion: reduce)").matches ? 1600 : 5200);
}

function freshGame() {
  return createGame(crypto.getRandomValues(new Uint32Array(1))[0] || 1);
}

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function linkButton(label, action, value = "", tone = "", disabled = false) {
  return `<button type="button" class="button ${tone}" data-action="${action}" data-value="${escape(value)}"${disabled ? " disabled" : ""}>${escape(label)}</button>`;
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

function card(title, desc, badge = "", actions = "", entry = "") {
  const name = entry ? `<span class="entry-anchor"><button class="item-trigger" type="button" data-entry aria-expanded="false">${escape(title)}</button><span class="item-tip" role="tooltip">${escape(publicText(entry))}</span></span>` : escape(title);
  return `<article class="card"><div class="card-head"><h3>${name}</h3>${badge}</div>${desc ? `<p>${escape(publicText(desc))}</p>` : ""}${actions ? `<div class="actions">${actions}</div>` : ""}</article>`;
}

function meter(label, current, total) {
  const value = Math.min(100, Math.max(0, 100 * current / (total || 1)));
  return `<div class="meter"><span>${label} · ${condition(current, total)}</span>
    <span class="meter-track" style="--fill:${value}%" aria-hidden="true"><i></i></span></div>`;
}

function supplies(entries) {
  return Object.keys(entries ?? {}).map(id => itemRows[id]?.name ?? id).join("、");
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

function hasSupply(s, needed) {
  return Object.entries(needed ?? {}).every(([id, count]) => (s.inventory[id] ?? 0) >= count);
}

function inVillage(s) {
  return s.mode === "village";
}

function stats(s) {
  const warnings = [];
  if (s.mode === "combat") {
    warnings.push(`气血${condition(s.hp, s.maxHp)}`, `真气${condition(s.qi, s.maxQi)}`);
  } else {
    if (s.hp / s.maxHp < 0.3) warnings.push("气血危急");
    else if (s.hp < s.maxHp || s.wounds) warnings.push("受伤");
    if (s.qi < s.maxQi / 3) warnings.push("真气将尽");
  }
  if ((s.inventory.ration ?? 0) < rules.reliefRations) warnings.push("口粮不足");
  if (s.toxin >= rules.toxinThreshold) warnings.push("丹毒发作");
  const danger = s.pressure > rules.pressureThreshold;
  const marks = Array.from({ length: rules.pressureThreshold }, (_, i) =>
    `<i class="${i < s.pressure ? "filled" : ""}"></i>`).join("");
  const fog = s.pressure ? `<details class="pressure${danger ? " danger" : ""}">
    <summary>${danger ? "雾压过重" : "雾压"} <span class="fog-marks" aria-hidden="true">${marks}</span></summary>
    <span>雾积满后，再探索会耗真气。回村就会散去。</span>
  </details>` : "";
  return `<div class="player-line"><span class="realm">${escape(s.realm.name)}</span>${warnings.map(text => `<span class="warning">${text}</span>`).join("")}${fog}</div>`;
}

function discovered(s, region) {
  const known = s.discovered;
  if (Array.isArray(known)) return known.includes(region.id) || region.id === s.region.id;
  if (known && typeof known === "object") return Boolean(known[region.id]) || region.id === s.region.id;
  return !region.reveal || region.id === s.region.id;
}

function routeAction(s, r, primary) {
  const homeward = r.id === "village";
  const locked = r.tier > s.realm.id;
  const route = homeward ? s.region : r;
  const shortfall = Math.max(0, route.food - (s.inventory.ration ?? 0));
  const note = locked ? `需${tierName(r.tier)}` : shortfall ? (homeward ? "缺粮回程会慢些" : "口粮不足") : "";
  return `<div class="route-action">${linkButton(homeward ? "回村" : `去${r.name}`, "travel", r.id, primary ? "primary" : "", locked || (!homeward && shortfall > 0))}${note ? `<span class="fine">${escape(note)}</span>` : ""}</div>`;
}

function journey(s) {
  if (s.mode === "event") return eventScreen(s);
  if (s.mode === "combat") return combatScreen(s);
  if (s.mode === "victory") return panel("潮印归灯", `<p class="intro">旧渡重新点起了灯。</p><div class="actions">${linkButton("继续行旅", "resume", "", "primary")}</div>`);
  const known = data.regions.filter(region => region.id !== s.region.id && discovered(s, region));
  const isHome = inVillage(s);
  const needRest = s.hp < s.maxHp || s.qi < s.maxQi || s.wounds || s.toxin || s.pressure || (s.inventory.ration ?? 0) < rules.reliefRations;
  return panel(s.region.name, `<div class="actions place-actions">
    ${isHome ? "" : linkButton("探索", "explore", "", "primary")}
    ${known.map((r, i) => routeAction(s, r, isHome && i === 0)).join("")}
    ${isHome && needRest ? linkButton("歇息", "rest") : ""}
    ${(s.revisitableEvents ?? []).map(e => linkButton(`回查${e.name}`, "revisit", e.id)).join("")}
  </div>`);
}

function eventScreen(s) {
  const event = s.currentEvent;
  const choices = s.visibleChoices.map(choice => {
    const details = [choice.desc, choice.lockedReason].map(text => publicText(text)).filter(Boolean).join(" ");
    return `<div class="choice">${linkButton(choice.label, "choose", choice.index, "", choice.available === false)}${details ? `<p>${escape(details)}</p>` : ""}</div>`;
  }).join("");
  return panel(event.name, `<div class="scene scene-${escape(s.region.id)}" aria-hidden="true"></div><p class="intro">${escape(publicText(event.text))}</p><div class="choice-list">${choices}</div><div class="actions">${linkButton("离开", "leave", "", "quiet")}</div>`, tag(s.region.name));
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
  return panel(enemy.name, `<p class="intro">${escape(publicText(enemy.desc))}</p>
    <div class="intent"><b>下一招 · ${escape(intent?.name)}</b>　${escape(intentNames[intent?.kind] ?? "")}</div>
    ${meter("对方气血", hp, enemy.maxHp)}
    <div class="actions">${linkButton("出手", "attack", "", "primary")}${linkButton("防御", "guard")}${linkButton("撤退", "retreat", "", "danger")}</div>
    ${arts.length ? `<div class="card-grid learned-arts">${arts.map(row => card(row.name, "", "", linkButton(s.qi < row.cost ? "真气不足" : "施展", "art", row.id, "", s.qi < row.cost), row.desc)).join("")}</div>` : ""}
    `, tag(tierName(enemy.tier), "warn"));
}

function gearCondition(remaining, total) {
  return !remaining ? "损坏" : remaining / total < 0.25 ? "将坏" : remaining < total ? "磨损" : "完好";
}

function gearDescription(item, gear, remaining) {
  const description = gear.entry || `${tierName(gear.tier)}散修可用。${item.desc}`;
  return remaining === undefined ? description : `${description} 目前${gearCondition(remaining, gear.durability)}。`;
}

function itemSlot(item, location, description, actions = "", label = "") {
  const key = `${location}-${item.id}`;
  const open = selectedItem === key;
  return `<div class="item-row" data-item-row="${escape(key)}">
    ${label ? `<span class="slot-label">${escape(label)}</span>` : ""}
    <button type="button" class="item-trigger" data-item="${escape(key)}" aria-expanded="${open}" aria-describedby="tip-${escape(key)}">${escape(item.name)}</button>
    <span class="item-tip" id="tip-${escape(key)}" role="tooltip">${escape(publicText(description))}</span>
    ${actions ? `<div class="item-tools"${open ? "" : " hidden"}>${actions}</div>` : ""}
  </div>`;
}

function pack(s) {
  const canEquip = inVillage(s) || s.mode === "field";
  const canUse = canEquip || s.mode === "combat";
  const canRepair = inVillage(s) && s.services?.includes("workshop");
  const worn = Object.entries(s.equipment).filter(([, id]) => id).map(([slot, id]) => {
    const gear = data.gear.find(row => row.id === id);
    const remaining = s.durability[id] ?? gear.durability;
    return itemSlot(itemRows[id], "worn", gearDescription(itemRows[id], gear, remaining),
      (canEquip ? linkButton("卸下", "unequip", slot) : "") + (canRepair && remaining < gear.durability ? linkButton(s.coins < gear.repair ? "灵钱不足" : "修理", "repair", id, "quiet", s.coins < gear.repair) : ""),
      slotNames[slot]);
  });
  const carried = data.items.filter(row => s.inventory[row.id] && !Object.values(s.equipment).includes(row.id));
  const inventory = carried.filter(row => row.kind !== "key").map(row => {
    const gear = data.gear.find(g => g.id === row.id);
    const pill = data.pills.find(g => g.id === row.id);
    const seal = data.talismans.find(g => g.id === row.id);
    let actions = "";
    if (gear) {
      const remaining = s.durability[row.id] ?? gear.durability;
      actions = (canEquip ? linkButton("装备", "equip", row.id, "", gear.tier > s.realm.id || remaining <= 0) : "") +
        (canRepair && remaining < gear.durability ? linkButton(s.coins < gear.repair ? "灵钱不足" : "修理", "repair", row.id, "quiet", s.coins < gear.repair) : "");
    }
    if (pill && canUse) actions = linkButton("服用", "use", row.id, "", pill.tier > s.realm.id);
    if (seal && s.mode === "combat") actions = linkButton("用符", "use", row.id, "", seal.tier > s.realm.id);
    if (row.id === "ration" && canUse && s.hp < s.maxHp) actions = linkButton("吃口粮", "eat");
    if (canEquip) actions += linkButton("放下", "discard", row.id, "quiet");
    const description = gear ? gearDescription(row, gear, s.durability[row.id] ?? gear.durability) : pill ? pillSummary(pill) : seal ? talismanSummary(seal) : row.desc;
    return itemSlot(row, "held", description, actions);
  });
  const clues = carried.filter(row => row.kind === "key").map(row => itemSlot(row, "clue", row.desc));
  const ground = canEquip ? Object.keys(s.groundLoot ?? {}).map(id => {
    const item = itemRows[id];
    const gear = data.gear.find(row => row.id === id);
    return itemSlot(item, "ground", gear ? gearDescription(item, gear) : item.desc, linkButton("拾起", "take", id));
  }) : [];
  const meter = Array.from({ length: s.backpackCapacity }, (_, i) => `<i${i < s.backpackUsed ? ' class="filled"' : ""}></i>`).join("");
  const room = s.backpackUsed >= s.backpackCapacity ? "已满" : s.backpackUsed >= s.backpackCapacity - 2 ? "快满了" : "有空位";
  return `<section class="kit-section"><h2>装备</h2>${worn.join("") || '<p class="fine">空</p>'}</section>
    <section class="kit-section"><div class="kit-head"><h2>行囊</h2><span class="fine">${room}</span></div>
      <div class="bag-slots" role="img" aria-label="行囊容量${room}">${meter}</div>
      ${inventory.join("") || '<p class="fine">空</p>'}
    </section>
    ${clues.length ? `<section class="kit-section"><h2>线索</h2>${clues.join("")}</section>` : ""}
    ${ground.length ? `<section class="kit-section"><h2>脚边</h2>${ground.join("")}</section>` : ""}`;
}

function village(s) {
  return panel("村务", `<div class="actions place-actions">${(s.services ?? []).map(service => tabButton(serviceNames[service], service)).join("")}</div>`);
}

function cultivation(s) {
  const next = s.nextRealm;
  const missing = next ? [s.insight < next.insight && "根基尚未稳固", s.coins < next.cost && "灵钱不足", !hasSupply(s, next.need) && `还缺${supplies(next.need)}`].filter(Boolean) : [];
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
  const recipes = data.recipes.filter(row => s.discoveredRecipes.includes(row.id));
  return panel("工坊", `<div class="workshop-art" aria-hidden="true"></div><div class="card-grid">${recipes.map(row => {
    const result = itemRows[row.result];
    const gear = data.gear.find(g => g.id === row.result);
    const pill = data.pills.find(g => g.id === row.result);
    const talisman = data.talismans.find(g => g.id === row.result);
    const need = supplies(row.need);
    const reason = !hasSupply(s, row.need) ? "材料不足" : s.coins < row.cost ? "灵钱不足" : "";
    const entry = gear ? gearDescription(result, gear) : pill ? pillSummary(pill) : talisman ? talismanSummary(talisman) : result.desc;
    return card(result.name, need ? `需${need}` : "", tag(kindNames[result.kind] ?? ""), linkButton(reason || "制备", "craft", row.id, "", Boolean(reason)), entry);
  }).join("")}</div>`);
}

function market(s) {
  if (!inVillage(s)) return panel("坊市", '<p class="section-note">村里的摊主还在，回来再做打算。</p>');
  const currentTier = new Map([...data.gear, ...data.pills, ...data.talismans].map(row => [row.id, row.tier]));
  return panel("坊市", `<div class="card-grid">${data.items.filter(row => s.discoveredItems.includes(row.id) && ((row.price > 0 && (currentTier.get(row.id) ?? 0) <= s.realm.id) || (row.sell > 0 && s.inventory[row.id]))).map(row => {
    const equipped = Object.values(s.equipment).includes(row.id);
    const gear = data.gear.find(g => g.id === row.id);
    const options = [
      row.price > 0 && (currentTier.get(row.id) ?? 0) <= s.realm.id ? linkButton(row.price > s.coins ? "灵钱不足" : "购入", "buy", row.id, "", row.price > s.coins) : "",
      row.sell > 0 && s.inventory[row.id] ? linkButton("卖出", "sell", row.id, "quiet", equipped) : "",
    ].join("");
    const pill = data.pills.find(entry => entry.id === row.id);
    const seal = data.talismans.find(entry => entry.id === row.id);
    return card(row.name, "", s.inventory[row.id] ? tag("持有") : "", options, gear ? gearDescription(row, gear) : pill ? pillSummary(pill) : seal ? talismanSummary(seal) : row.desc);
  }).join("")}</div>`);
}

function questDone(s, row) {
  if (Array.isArray(s.completedQuests)) return s.completedQuests.includes(row.id);
  const status = Array.isArray(s.quests) ? s.quests.find(q => q.id === row.id) : s.quests?.[row.id];
  return status === true || Boolean(status?.done ?? status?.completed);
}

function visibleQuests(s) {
  return s.quests.filter(row => (row.tier ?? 0) <= s.realm.id);
}

function questBoard(s) {
  const list = visibleQuests(s);
  return panel("委托", `<div class="card-grid">${list.map(row => {
    const done = questDone(s, row);
    const unmet = !hasSupply(s, row.need);
    return card(row.name, `${row.desc} 交付 ${supplies(row.need)}。`,
      done ? tag("已交付", "off") : "",
      done ? "" : linkButton(unmet ? "材料不足" : "交付", "handin", row.id, "primary", unmet));
  }).join("")}</div>`);
}

function deductionBoard(s) {
  const cases = s.deductions ?? [];
  if (!cases.length) return panel("沙盘", '<p class="intro">旅途中值得推敲的疑点会收进这里。</p>');
  const current = cases.find(row => row.id === activeDeduction) ?? cases.find(row => !row.completed) ?? cases[0];
  const draft = deductionDrafts.get(current.id);
  const casesBar = cases.length > 1 ? `<div class="actions deduction-cases">${cases.map(row => `<button type="button" class="button ${row.id === current.id ? "primary" : ""}" data-case="${escape(row.id)}" aria-pressed="${row.id === current.id}">${escape(row.name)}${row.completed ? " ✓" : ""}</button>`).join("")}</div>` : "";
  const evidence = (s.evidence ?? []).map(item => `<label class="evidence-option"><input type="checkbox" name="evidence" value="${escape(item.id)}"${draft?.evidence.includes(item.id) ? " checked" : ""}>
    <span><strong>${escape(item.name)}</strong><small>${escape(publicText(item.desc))}</small></span></label>`).join("");
  const hypotheses = current.hypotheses.map(hypothesis => `<label class="evidence-option"><input type="radio" name="hypothesis" value="${escape(hypothesis.id)}" required${draft?.hypothesis === hypothesis.id ? " checked" : ""}>
    <span>${escape(publicText(hypothesis.label))}</span></label>`).join("");
  return panel("沙盘推演", casesBar + `<h3>${escape(current.name)}</h3><p class="intro training-note">${escape(publicText(current.desc))}</p>` +
    (current.completed ? `<p class="intent">${escape(publicText(current.success))}</p>` :
      `<form class="deduction" data-deduction="${escape(current.id)}">
        <fieldset><legend>选出支撑结论的证物</legend>${evidence || '<p class="intro">手头还没有证物。</p>'}</fieldset>
        <fieldset><legend>你的解释</legend>${hypotheses}</fieldset>
        <div class="actions"><button class="button primary" type="submit"${evidence ? "" : " disabled"}>落子推演</button></div>
      </form>`), tag(current.completed ? "已解" : "待推敲", current.completed ? "" : "warn"));
}

function render() {
  const s = view(state);
  const inEncounter = s.mode === "event" || s.mode === "combat" || s.mode === "victory";
  const showVillage = inVillage(s) && Boolean(s.services?.length);
  const available = {
    journey: true, village: showVillage, deduction: Boolean(s.deductions?.length),
  };
  for (const service of Object.keys(serviceNames)) available[service] = showVillage && s.services.includes(service);
  const tab = inEncounter || !available[screen] ? "journey" : screen;
  const content = { journey, village, cultivate: cultivation, workshop, market, quests: questBoard, deduction: deductionBoard };
  document.querySelector("#clock").textContent = s.day % 1 < 0.5 ? "白昼" : "夜里";
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
  const lines = [];
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
  const goods = acquired.filter(item => item.kind !== "key");
  const clues = acquired.filter(item => item.kind === "key");
  let narrative = result.message ?? "";
  if (result.damageDealt || result.damageTaken) {
    narrative = narrative.replace(/(?:造成|你受了|脱身时受了|另造成)\d+点伤(?:害)?。?/g, "").replace(/反击，[。]?/g, "反击。");
  }
  if (acquired.length) narrative = narrative.replace(/获得[^。]+。/g, "");
  if (result.injury) narrative = narrative.replace(result.injury.cause, "").replace(/丹毒积重，损失\d+点生命。?/g, "");
  if (result.ok && (action === "travel" || action === "explore" || action === "revisit")) {
    narrative = narrative.replace(/^(?:抵达[^。]+|在[^。]+遇上[^。]+)。/, "");
  }
  narrative = publicText(narrative).trim();
  if (narrative) lines.push(narrative);
  if (goods.length) lines.push(`获得${goods.map(item => item.name).join("、")}。`);
  if (clues.length) lines.push(`得到线索「${clues.map(item => item.name).join("、")}」。`);
  const didRecover = ["choose", "eat", "use", "rest"].includes(action) && after.hp > before.hp && !result.injury;
  const changes = [
    didRecover && !narrative.includes("气血") && "气血恢复",
    after.qi > before.qi && ["choose", "use", "rest"].includes(action) && !narrative.includes("真气") && "真气恢复",
    after.qi < before.qi && ["choose", "explore", "revisit", "art"].includes(action) && !narrative.includes("真气") && "消耗了真气",
    (after.inventory.ration ?? 0) < (before.inventory.ration ?? 0) && ["travel", "choose"].includes(action) && "用了些口粮",
    after.coins > before.coins && !["sell"].includes(action) && "获得灵钱",
  ].filter(Boolean);
  if (changes.length) lines.push(changes.join("，") + "。");
  const overflow = Object.keys(result.spilled ?? {}).map(id => itemRows[id].name);
  if (overflow.length) lines.push(`行囊装不下，${overflow.join("、")}留在脚边。`);
  for (const id of after.discovered) {
    if (!before.discovered.includes(id)) lines.push(`找到去${data.regions.find(region => region.id === id).name}的路。`);
  }
  return lines;
}

function performAction(action, payload) {
  const before = { inventory: { ...state.inventory }, discovered: [...state.discovered], hp: state.hp, qi: state.qi, coins: state.coins };
  const result = act(state, action, payload);
  if (["travel", "explore", "choose", "leave", "revisit", "resume"].includes(action)) screen = "journey";
  if (action === "travel" || action === "discard" || action === "take" || action === "equip" || action === "unequip") selectedItem = null;
  render();
  showNotice(feedback(before, state, result, action), Boolean(result.injury || result.damageTaken || !result.ok));
  if (["travel", "explore", "choose", "revisit"].includes(action)) main.scrollIntoView({ block: "nearest" });
}

document.addEventListener("submit", event => {
  const form = event.target;
  if (!form.matches("[data-deduction]")) return;
  event.preventDefault();
  const selected = new FormData(form);
  activeDeduction = form.dataset.deduction;
  const guess = { id: activeDeduction, evidence: selected.getAll("evidence"), hypothesis: selected.get("hypothesis") };
  deductionDrafts.set(activeDeduction, guess);
  performAction("deduce", guess);
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
    selectedItem = null;
    activeDeduction = null;
    deductionDrafts.clear();
    notices.replaceChildren();
    guide.close();
    render();
    showOpening();
    return;
  }
  if (button.dataset.tab) {
    screen = button.dataset.tab;
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
    action === "unequip" ? { slot: value } : { id: value };
  performAction(action, payload);
});

render();
document.querySelector("#boot-status").hidden = true;
app.hidden = false;
showOpening();
