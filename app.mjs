import { data } from "./data.mjs";
import { act, createGame, rules, view } from "./engine.mjs";

const key = "wilds-of-the-veil-save-v1";
const itemRows = Object.fromEntries(data.items.map(item => [item.id, item]));
const slotNames = { weapon: "兵刃", armor: "护具", charm: "法器" };
const intentNames = { attack: "进攻", heavy: "蓄势", guard: "守势", heal: "疗伤", drain: "夺气" };
const kindNames = { material: "材料", food: "口粮", gear: "装备", pill: "丹药", talisman: "符箓", key: "线索" };
const screens = ["journey", "pack", "cultivate", "workshop", "market", "quests", "deduction"];
const main = document.querySelector("#main");
const guide = document.querySelector("#help");
let state = load();
let screen = screens.includes(location.hash.slice(1)) ? location.hash.slice(1) : "journey";
let response = null;
let activeDeduction = null;
const deductionDrafts = new Map();

function freshGame() {
  return createGame(crypto.getRandomValues(new Uint32Array(1))[0] || 1);
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved?.format === 1 && saved.state) {
      const snapshot = view(saved.state);
      if (snapshot.realm && snapshot.region && Number.isFinite(snapshot.hp)) return saved.state;
    }
  } catch {
    // A missing, invalid, or blocked local save can be replaced by a new game.
  }
  return freshGame();
}

function persist() {
  try {
    localStorage.setItem(key, JSON.stringify({ format: 1, state }));
    document.querySelector("#save").textContent = "● 已记入行记";
  } catch {
    document.querySelector("#save").textContent = "本页存档不可用";
  }
}

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function linkButton(label, action, value = "", tone = "", disabled = false) {
  return `<button type="button" class="button ${tone}" data-action="${action}" data-value="${escape(value)}"${disabled ? " disabled" : ""}>${escape(label)}</button>`;
}

function panel(title, body, aside = "", className = "") {
  return `<section class="panel ${className}"><div class="panel-header"><h2>${escape(title)}</h2>${aside}</div>${body}</section>`;
}

function tag(text, tone = "") {
  return `<span class="tag ${tone}">${escape(text)}</span>`;
}

function card(title, desc, badge = "", actions = "") {
  return `<article class="card"><div class="card-head"><h3>${escape(title)}</h3>${badge}</div><p>${escape(desc)}</p>${actions ? `<div class="actions">${actions}</div>` : ""}</article>`;
}

function meter(label, current, total, tone = "") {
  const value = Math.min(100, Math.max(0, 100 * current / (total || 1)));
  return `<div class="meter"><div class="meter-label"><span>${label}</span><b>${current} / ${total}</b></div>
    <span class="meter-track ${tone}" style="--fill:${value}%" aria-hidden="true"><i></i></span></div>`;
}

function supplies(entries, empty = "无") {
  return Object.entries(entries ?? {}).map(([id, count]) => `${itemRows[id]?.name ?? id} ×${count}`).join("、") || empty;
}

function statLine(label, value) {
  return `<div class="side-line"><span>${label}</span><b>${escape(value)}</b></div>`;
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
  const survival = [statLine("口粮", s.inventory.ration ?? 0), statLine("灵钱", s.coins), statLine("修为", s.insight)];
  if (s.pressure) survival.push(statLine("雾压", `${s.pressure} / ${rules.pressureThreshold}`));
  if (s.toxin) survival.push(statLine("丹毒", s.toxin));
  if (s.wounds) survival.push(statLine("伤势", s.wounds));
  if (s.attack !== undefined) survival.push(statLine("攻 / 防", `${s.attack} / ${s.defense}`));
  return panel("道身", meter("气血", s.hp, s.maxHp) + meter("内力 · 真气", s.qi, s.maxQi, "qi") +
    `<div class="side-lines">${survival.join("")}</div>`, tag(s.realm.name), "stat-panel");
}

function discovered(s, region) {
  const known = s.discovered;
  if (Array.isArray(known)) return known.includes(region.id) || region.id === s.region.id;
  if (known && typeof known === "object") return Boolean(known[region.id]) || region.id === s.region.id;
  return !region.reveal || region.id === s.region.id;
}

function adventureBanner(s) {
  const home = s.region.id === "village";
  return `<section class="hero hero-${escape(s.region.id)}">
    <p class="eyebrow">${home ? "山河行记 · 暂歇处" : `山河行记 · ${escape(s.realm.name)}`}</p>
    <h1>${escape(s.region.name)}</h1>
    <p>${escape(s.region.desc)}</p>
  </section>`;
}

function regionCard(s, r) {
  const here = r.id === s.region.id;
  const locked = r.tier > s.realm.id;
  const canTravel = here || !(s.mode === "event" || s.mode === "combat");
  const route = r.id === "village" ? s.region : r;
  const shortOnFood = r.id !== "village" && (s.inventory.ration ?? 0) < route.food;
  return `<article class="region region-${escape(r.id)}${here ? " current" : ""}">
    <div class="card-head"><h3>${escape(r.name)}</h3>${tag(here ? "所在" : locked ? tierName(r.tier) + "方可进入" : r.id === "village" ? "安全" : "可前往", locked ? "off" : "")}</div>
    <p>${escape(r.desc)}</p>
    ${!here ? `<div class="actions">${linkButton(r.id === "village" ? "返村" : "前往", "travel", r.id, "", locked || !canTravel || shortOnFood)}<span class="fine">耗时 ${route.travel} 日 · 口粮 ${route.food}${shortOnFood ? "（不足）" : ""}</span></div>` : ""}
  </article>`;
}

function journey(s) {
  if (s.mode === "event") return eventScreen(s);
  if (s.mode === "combat") return combatScreen(s);
  if (s.mode === "victory") return adventureBanner(s) + panel("潮印归灯", `<p class="intro">你携潮印回到了村里。村人重新点起旧渡的灯。归来时是行旅第 ${s.wonDay ?? s.day} 日。</p><div class="actions">${linkButton("继续行旅", "resume", "", "primary")}</div>`);
  const known = data.regions.filter(region => discovered(s, region));
  const isHome = inVillage(s);
  const firstDeparture = isHome && !s.explored.includes("marsh")
    ? linkButton("出发去白苇滩", "travel", "marsh", "primary", (s.inventory.ration ?? 0) < (data.regions.find(r => r.id === "marsh")?.food ?? 0))
    : "";
  const instructions = isHome ? "出门前清点口粮。若途中找到了陌生的线索，可以循迹再走远一些。" : "看看眼前还有什么可查。局势吃紧时，带着已经到手的东西回村。";
  const fog = s.discoveryHint ? `<p class="region fogged">${escape(s.discoveryHint)}</p>` : "";
  return adventureBanner(s) + panel(isHome ? "整备出发" : "在地行事",
    `<p class="section-note">${instructions}</p>
      <div class="actions">${firstDeparture}${isHome ? linkButton("在村歇息", "rest") : linkButton("探查四周", "explore", "", "primary")}${linkButton("吃口粮", "eat", "", "quiet", !s.inventory.ration)}${(s.revisitableEvents ?? []).map(e => linkButton(`回查 · ${e.name}`, "revisit", e.id)).join("")}</div>`) +
    panel("已知去处", `<div class="region-grid">${known.map(r => regionCard(s, r)).join("")}${fog}</div>`);
}

function eventScreen(s) {
  const event = s.currentEvent;
  const choices = (s.visibleChoices ?? event.choices.map((choice, index) => ({ ...choice, index }))).map(choice => {
    const costs = [choice.days ? `${choice.days} 日` : "", choice.food ? `口粮 −${choice.food}` : "", choice.coins < 0 ? `灵钱 −${-choice.coins}` : "",
      choice.hp < 0 ? `气血 −${-choice.hp}` : "", choice.qi < 0 ? `真气 −${-choice.qi}` : "", choice.enemy ? "可能交战" : ""].filter(Boolean).join(" · ");
    const disabled = choice.available === false || s.coins < -(choice.coins ?? 0) || (s.inventory.ration ?? 0) < (choice.food ?? 0);
    const condition = choice.lockedReason ? `<br><span class="fine">${escape(choice.lockedReason)}</span>` : "";
    return `<article class="choice"><div><h3>${escape(choice.label)}</h3><p>${escape(choice.desc)}${costs ? `<br><span class="metal">${escape(costs)}</span>` : ""}${condition}</p></div>${linkButton("选择", "choose", choice.index, choice.index === 0 ? "primary" : "", disabled)}</article>`;
  }).join("");
  return panel(event.name, `<p class="intro">${escape(event.text)}</p><div class="choice-list">${choices}</div><div class="actions">${linkButton("就此离开", "leave", "", "quiet")}</div>`, tag(s.region.name));
}

function pillSummary(row) {
  return [row.hp && `气血 +${row.hp}`, row.qi && `真气 +${row.qi}`, row.food && `口粮 +${row.food}`, row.toxin && `丹毒 ${row.toxin > 0 ? "+" : ""}${row.toxin}`,
    row.wound && `伤势 −${row.wound}`, row.focus && `凝神 +${row.focus}（下次伤害术诀 +${rules.focusDamage}）`].filter(Boolean).join(" · ");
}

function talismanSummary(row) {
  return [row.damage && `伤害 ${row.damage}`, row.guard && `护持 ${row.guard}`, row.retreat && `撤退反击基准伤害 −${Math.round(row.retreat * 100)}%`].filter(Boolean).join(" · ");
}

function artSummary(row) {
  return [`耗真气 ${row.cost}`, row.power && `相对普攻 ${signed(row.power)}`, row.pierce && `穿透 ${row.pierce}`, row.guard && `护持 ${row.guard}`, row.break && `破势 ${row.break}`].filter(Boolean).join(" · ");
}

function combatScreen(s) {
  const enemy = s.currentEnemy;
  const intent = s.intent;
  const hp = s.enemyHp ?? enemy.currentHp ?? enemy.hp;
  const arts = data.arts.filter(row => s.knownArts.includes(row.id));
  const pills = data.pills.filter(row => s.inventory[row.id] && row.tier <= s.realm.id);
  const seals = data.talismans.filter(row => s.inventory[row.id] && row.tier <= s.realm.id);
  const retreatDamage = Math.max(0, Math.ceil(s.intentDamage * rules.retreatDamageFactor * (1 - Math.min(1, s.retreat + (s.combat?.escapeBonus ?? 0)))) - s.defense);
  return panel(enemy.name, `<p class="intro">${escape(enemy.desc)}</p>
    <div class="intent"><b>下一招 · ${escape(intent?.name)}</b>　${escape(intentNames[intent?.kind] ?? "")}${s.intentDamage ? ` · 伤害 ${s.intentDamage}（减伤前）` : ""}</div>
    ${meter("对方气血", hp, enemy.maxHp, "enemy")}
    <div class="actions">${linkButton("出手", "attack", "", "primary")}${linkButton("防御", "guard")}${linkButton(`撤退 · ${retreatDamage} 点伤`, "retreat", "", "danger")}</div>
    <hr class="rule"><div class="card-grid">
    ${arts.map(row => card(row.name, `${artSummary(row)}。 ${row.desc}`, "", linkButton("施展", "art", row.id, "", s.qi < row.cost))).join("")}
    ${pills.map(row => card(itemRows[row.id].name, pillSummary(row), tag(`×${s.inventory[row.id]}`), linkButton("服用", "use", row.id))).join("")}
    ${seals.map(row => card(itemRows[row.id].name, talismanSummary(row), tag(`×${s.inventory[row.id]}`), linkButton("用符", "use", row.id))).join("")}
    </div>`, tag(tierName(enemy.tier), "warn"));
}

function signed(number) {
  return number >= 0 ? `+${number}` : `−${Math.abs(number)}`;
}

function gearSummary(g) {
  return [g.atk && `攻 ${signed(g.atk)}`, g.def && `防 ${signed(g.def)}`, g.hp && `气血上限 ${signed(g.hp)}`, g.qi && `真气上限 ${signed(g.qi)}`, g.retreat && `撤退反击基准伤害 −${Math.round(g.retreat * 100)}%`].filter(Boolean).join(" · ");
}

function pack(s) {
  const worn = Object.entries(slotNames).map(([slot, name]) => {
    const id = s.equipment[slot];
    if (!id) return card(name, "空");
    const gear = data.gear.find(row => row.id === id);
    const remaining = s.durability[id] ?? gear.durability;
    return card(`${name} · ${itemRows[id].name}`, `${gearSummary(gear)} · 耐久 ${remaining}/${gear.durability}`, tag(remaining ? "佩戴中" : "损坏", remaining ? "" : "warn"),
      linkButton("卸下", "unequip", slot) + (inVillage(s) ? linkButton(`修理 · ${gear.repair} 灵钱`, "repair", id, "quiet", remaining >= gear.durability || s.coins < gear.repair) : ""));
  });
  const inventory = data.items.filter(row => s.inventory[row.id] && !Object.values(s.equipment).includes(row.id)).map(row => {
    const gear = data.gear.find(g => g.id === row.id);
    const pill = data.pills.find(g => g.id === row.id);
    const seal = data.talismans.find(g => g.id === row.id);
    let actions = "";
    if (gear) {
      const remaining = s.durability[row.id] ?? gear.durability;
      actions = linkButton("装备", "equip", row.id, "", gear.tier > s.realm.id) +
        (inVillage(s) ? linkButton(`修理 · ${gear.repair} 灵钱`, "repair", row.id, "quiet", remaining >= gear.durability || s.coins < gear.repair) : "");
    }
    if (pill) actions = linkButton("服用", "use", row.id, "", pill.tier > s.realm.id);
    if (row.id === "ration") actions = linkButton("吃口粮", "eat");
    const effects = gear ? `${gearSummary(gear)} · 耐久 ${s.durability[row.id] ?? gear.durability}/${gear.durability}` : pill ? pillSummary(pill) : seal ? talismanSummary(seal) : "";
    return card(row.name, [row.desc, effects].filter(Boolean).join(" "), tag(`${row.kind === "key" ? "线索 · " : ""}×${s.inventory[row.id]}`), actions);
  });
  return panel("所佩装备", `<div class="card-grid">${worn.join("")}</div>`) +
    panel("行囊", inventory.length ? `<div class="card-grid">${inventory.join("")}</div>` : '<p class="section-note">行囊里空空如也。</p>');
}

function cultivation(s) {
  const next = data.realms.find(row => row.id === s.realm.id + 1);
  const locked = !inVillage(s);
  const pace = next ? `下一境 · ${next.name}。需要修为 ${next.insight}、灵钱 ${next.cost}、${supplies(next.need)}，耗时 ${next.days} 日。` : "本卷所录修行至此圆满。";
  const training = panel("修行", `<p class="intro">${escape(pace)}${locked ? " 回到村里可打坐、学术和突破。" : ""}</p>
    <p class="section-note training-note">真气是施展术诀的内力。歇息和丹药可以回气，久留于雾中则会持续耗气。</p>
    <div class="actions">${linkButton("打坐参悟", "research", "", "", locked)}${next ? linkButton("尝试突破", "breakthrough", "", "primary", locked) : ""}</div>`, tag(s.realm.name));
  const visibleArts = data.arts.filter(row => s.discoveredArts.includes(row.id));
  return training + panel("术诀", `<div class="card-grid">${visibleArts.map(row => {
    const known = s.knownArts.includes(row.id);
    return card(row.name, `${artSummary(row)}。 ${row.desc}`, tag(known ? "已习得" : `${row.price} 灵钱`, known ? "" : "off"),
      known ? "" : linkButton("习得", "learn", row.id, "", locked || s.coins < row.price));
  }).join("")}</div>`);
}

function workshop(s) {
  const locked = !inVillage(s);
  const recipes = data.recipes.filter(row => s.discoveredRecipes.includes(row.id));
  return panel("工坊", `<div class="workshop-art" aria-hidden="true"></div><p class="section-note">${locked ? "可查看配方。回到村里才能制备。" : "把采回来的材料做成下一趟用得上的物件。"} </p><div class="card-grid">${recipes.map(row => {
    const result = itemRows[row.result];
    const gear = data.gear.find(g => g.id === row.result);
    const pill = data.pills.find(g => g.id === row.result);
    const talisman = data.talismans.find(g => g.id === row.result);
    const effects = gear ? gearSummary(gear) : pill ? pillSummary(pill) : talisman ? talismanSummary(talisman) : result.desc;
    return card(`${result.name} ×${row.count}`, `${supplies(row.need)} · 灵钱 ${row.cost} · ${row.days} 日。 ${effects}`, tag(kindNames[result.kind] ?? ""), linkButton("制备", "craft", row.id, "", locked || !hasSupply(s, row.need) || s.coins < row.cost));
  }).join("")}</div>`);
}

function market(s) {
  if (!inVillage(s)) return panel("坊市", '<p class="section-note">村里的摊主还在，回来再做打算。</p>');
  const currentTier = new Map([...data.gear, ...data.pills, ...data.talismans].map(row => [row.id, row.tier]));
  return panel("坊市", `<div class="card-grid">${data.items.filter(row => s.discoveredItems.includes(row.id) && ((row.price > 0 && (currentTier.get(row.id) ?? 0) <= s.realm.id) || (row.sell > 0 && s.inventory[row.id]))).map(row => {
    const equipped = Object.values(s.equipment).includes(row.id);
    const options = [
      row.price > 0 && (currentTier.get(row.id) ?? 0) <= s.realm.id ? linkButton(`购入 · ${row.price}`, "buy", row.id, "", row.price > s.coins) : "",
      row.sell > 0 && s.inventory[row.id] ? linkButton(`卖出 · ${row.sell}`, "sell", row.id, "quiet", equipped) : "",
    ].join("");
    return card(row.name, row.desc, tag(`持有 ${s.inventory[row.id] ?? 0}`), options);
  }).join("")}</div>`, tag(`${s.coins} 灵钱`));
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
  return panel("村中委托", `<p class="section-note">委托可以提供灵钱、修为和补给。</p><div class="card-grid">${list.map(row => {
    const done = questDone(s, row);
    return card(row.name, `${row.desc} 交付 ${supplies(row.need)}，可得 ${row.coins} 灵钱、${row.insight} 修为${supplies(row.reward, "") ? `、${supplies(row.reward)}` : ""}。`,
      tag(done ? "已交付" : "待办理", done ? "off" : ""),
      done ? "" : linkButton("交付", "handin", row.id, "primary", !inVillage(s) || !hasSupply(s, row.need)));
  }).join("")}</div>`);
}

function deductionBoard(s) {
  const cases = s.deductions ?? [];
  if (!cases.length) return panel("沙盘", '<p class="intro">旅途中值得推敲的疑点会收进这里。</p>');
  const current = cases.find(row => row.id === activeDeduction) ?? cases.find(row => !row.completed) ?? cases[0];
  const draft = deductionDrafts.get(current.id);
  const casesBar = cases.length > 1 ? `<div class="actions deduction-cases">${cases.map(row => `<button type="button" class="button ${row.id === current.id ? "primary" : ""}" data-case="${escape(row.id)}" aria-pressed="${row.id === current.id}">${escape(row.name)}${row.completed ? " ✓" : ""}</button>`).join("")}</div>` : "";
  const evidence = (s.evidence ?? []).map(item => `<label class="evidence-option"><input type="checkbox" name="evidence" value="${escape(item.id)}"${draft?.evidence.includes(item.id) ? " checked" : ""}>
    <span><strong>${escape(item.name)}</strong><small>${escape(item.desc)}</small></span></label>`).join("");
  const hypotheses = current.hypotheses.map(hypothesis => `<label class="evidence-option"><input type="radio" name="hypothesis" value="${escape(hypothesis.id)}" required${draft?.hypothesis === hypothesis.id ? " checked" : ""}>
    <span>${escape(hypothesis.label)}</span></label>`).join("");
  return panel("沙盘推演", casesBar + `<h3>${escape(current.name)}</h3><p class="intro training-note">${escape(current.desc)}</p>` +
    (current.completed ? `<p class="intent">${escape(current.success)}</p>` :
      `<form class="deduction" data-deduction="${escape(current.id)}">
        <fieldset><legend>选出支撑结论的证物</legend>${evidence || '<p class="intro">手头还没有证物。</p>'}</fieldset>
        <fieldset><legend>你的解释</legend>${hypotheses}</fieldset>
        <div class="actions"><button class="button primary" type="submit"${evidence ? "" : " disabled"}>落子推演</button><span class="fine">耗时 ${current.days} 日</span></div>
      </form>`), tag(current.completed ? "已解" : "待推敲", current.completed ? "" : "warn"));
}

function placeJournal(s) {
  const entries = (s.log ?? []).slice(-9).reverse().map(entry => {
    if (typeof entry === "string") return entry;
    return entry.text ?? entry.message;
  }).filter(Boolean);
  let goal = "去白苇滩看看，在装满行囊之前留出返村口粮。";
  if (data.regions.filter(region => discovered(s, region)).length >= 3) goal = "循新线索找路。根据已知的凶险补好装备与丹符。";
  if (s.inventory.seal) goal = "潮印已经入囊。回落灯村交接委托。";
  if (s.won) goal = "旧渡的灯重新点亮。你仍可循手中的线索出门。";
  const openCase = ["village", "field"].includes(s.mode) && s.deductions?.some(row => !row.completed);
  return panel("眼下的事", `<p class="section-note">${goal}</p>${openCase ? '<button type="button" class="button quiet" data-tab="deduction">整理沙盘证物</button>' : ""}`) +
    panel("近来行记", entries.length ? `<ul class="journal-list">${entries.map(line => `<li>${escape(line)}</li>`).join("")}</ul>` : '<p class="section-note">你来到了落灯村。</p>');
}

function render() {
  const s = view(state);
  const inEncounter = s.mode === "event" || s.mode === "combat" || s.mode === "victory";
  const tab = inEncounter || (screen === "deduction" && !s.deductions?.length) ? "journey" : screen;
  const content = { journey, pack, cultivate: cultivation, workshop, market, quests: questBoard, deduction: deductionBoard };
  const hour = Math.round((s.day % 1) * 24);
  document.querySelector("#clock").textContent = `第 ${Math.floor(s.day)} 日 · ${String(hour).padStart(2, "0")}:00`;
  document.querySelector("#sidebar-status").innerHTML = stats(s);
  document.querySelector("#journal").innerHTML = placeJournal(s);
  for (const button of document.querySelectorAll(".navigation button")) {
    const active = button.dataset.tab === tab;
    if (button.dataset.tab === "deduction") button.hidden = !s.deductions?.length;
    button.disabled = inEncounter && !active;
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  const feedback = response?.deduction === "miss" ? " miss" : response?.ok ? "" : " error";
  main.innerHTML = (response?.message ? `<p class="status-message${feedback}">${escape(response.message)}</p>` : "") + content[tab](s);
}

function performAction(action, payload) {
  response = act(state, action, payload);
  if (["travel", "explore", "choose", "leave", "revisit", "resume"].includes(action)) screen = "journey";
  persist();
  render();
  document.querySelector("#announce").textContent = response.message ?? "";
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
  const button = event.target.closest("button, a[data-tab]");
  if (!button) return;
  if (button.hasAttribute("data-help")) {
    guide.showModal();
    return;
  }
  if (button.hasAttribute("data-close")) {
    guide.close();
    return;
  }
  if (button.hasAttribute("data-reset")) {
    if (!window.confirm("要清除当前行记，重新开始吗？")) return;
    state = freshGame();
    response = null;
    screen = "journey";
    activeDeduction = null;
    deductionDrafts.clear();
    guide.close();
    persist();
    render();
    return;
  }
  if (button.dataset.tab) {
    event.preventDefault();
    screen = button.dataset.tab;
    history.replaceState(null, "", `#${screen}`);
    response = null;
    render();
    return;
  }
  if (button.dataset.case) {
    activeDeduction = button.dataset.case;
    response = null;
    render();
    return;
  }
  const action = button.dataset.action;
  if (!action) return;
  const value = button.dataset.value;
  const payload = action === "choose" ? { index: Number(value) } :
    action === "unequip" ? { slot: value } : { id: value, count: 1 };
  performAction(action, payload);
});

persist();
render();
