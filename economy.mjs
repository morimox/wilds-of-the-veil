const facilities = [
  {
    id: 'warehouse', name: '仓库', start: 1,
    desc: '木架上能存材料和换下的器具。院里修造时也能来这里取料。',
    upgrades: [
      { need: { wood: 24, reed: 14 }, cost: 16, days: 2 },
      { need: { wood: 36, ore: 18, black_iron: 8 }, cost: 30, days: 3 },
    ],
  },
  {
    id: 'garden', name: '药畦', start: 0, reveal: 'millet_seed',
    desc: '后墙下有两道蓄雨的浅沟，正好翻成畦安置粟种。下种后可以出门，等熟时再来收。',
    upgrades: [
      { need: { wood: 8, reed: 6 }, cost: 5, days: 1 },
      { need: { wood: 18, kiln_clay: 10 }, cost: 14, days: 2 },
      { need: { kiln_clay: 14, reed: 12, hide: 6 }, cost: 32, days: 3 },
    ],
  },
  {
    id: 'hearth', name: '备粮灶', start: 0, reveal: 'millet_grain', alternateReveal: 'beast_meat',
    desc: '院角还留着旧火眼。砌好灶眼能支锅炖兽肉，架上蒸屉也能烘干新收的谷子。',
    upgrades: [
      { need: { wood: 8, reed: 6 }, cost: 5, days: 1 },
      { need: { wood: 16, ore: 8, kiln_clay: 6 }, cost: 12, days: 2 },
    ],
  },
  {
    id: 'furnace', name: '炼丹炉', start: 0, reveal: 'kiln_manual', alternateReveal: 'furnace_sketch',
    desc: '在背风墙下留一道低风口。摊开丹方投药点火，封过炉便可留它慢慢温养。',
    upgrades: [
      { need: { wood: 12, ore: 5, reed: 6 }, cost: 12, days: 1.5 },
      { need: { kiln_clay: 10, ore: 8, wood: 10 }, cost: 24, days: 2.5 },
      { need: { black_iron: 12, hide: 6, core: 5 }, cost: 56, days: 4 },
    ],
  },
  {
    id: 'forge', name: '锻炉', start: 0, reveal: 'ore',
    desc: '有了寒铁，可以用铁箍固定炉口，挨着干墙搭起锻炉。炉体越稳，一回能接下的活越多。',
    upgrades: [
      { need: { wood: 14, ore: 8 }, cost: 14, days: 2 },
      { need: { ore: 10, kiln_clay: 8, black_iron: 6 }, cost: 28, days: 3 },
      { need: { black_iron: 16, hide: 8, core: 6 }, cost: 56, days: 4 },
    ],
  },
];

const projects = [
  {
    id: 'sow_millet', name: '下种育粟', facility: 'garden', level: 1,
    description: '在浅沟上拢些灵草的长茎保湿，留下一穗作下回的种。',
    need: { millet_seed: 1, reed: 1 }, loot: { millet_grain: 6, millet_seed: 1 }, days: 6, cost: 0,
  },
  {
    id: 'root_spirit_leaf', name: '压茎培灵草', facility: 'garden', level: 2,
    description: '用松木支起遮阴架，把灵草带芽的茎压进湿土，等茎节生根。',
    need: { reed: 2, wood: 2 }, loot: { reed: 6 }, days: 9, cost: 0, reveal: 'reed',
  },
  {
    id: 'winter_spirit_leaf', name: '暖畦育灵草', facility: 'garden', level: 3,
    description: '把兽革盖住新苗，松木在畦边慢烧保温。一次能育满一畦，等得也久。',
    need: { reed: 4, hide: 1, wood: 3 }, loot: { reed: 14 }, days: 15, cost: 3, reveal: 'hide',
  },
  {
    id: 'steam_millet', name: '蒸粟烘干粮', facility: 'hearth', level: 1, reveal: 'millet_grain',
    description: '蒸熟的粟米摊在苇席上烘干，再拿油纸分包。',
    need: { millet_grain: 3, wood: 1 }, loot: { ration: 6 }, days: 1.5, cost: 0,
  },
  {
    id: 'cook_travel_cakes', name: '烘一匣行粮', facility: 'hearth', level: 2, reveal: 'millet_grain',
    description: '炉炕能铺两张苇席，天还亮着先把下一趟路的粮做起来。',
    need: { millet_grain: 8, wood: 2, reed: 1 }, loot: { ration: 18 }, days: 3, cost: 2,
  },
  {
    id: 'simmer_meat_broth', name: '煨山炉肉汤', facility: 'hearth', level: 1, reveal: 'beast_meat',
    description: '剔去生兽肉上的筋膜，炖熟后连浓汤一并封好。',
    need: { beast_meat: 1, wood: 1 }, loot: { meat_broth: 1 }, days: 0.5, cost: 0,
  },
  {
    id: 'cook_herb_stew', name: '炖灵草肉', facility: 'hearth', level: 2, reveal: 'meat_broth',
    description: '照肉汤的火候煨上一锅，收汁前下灵草，分作两包。',
    need: { beast_meat: 2, reed: 1, wood: 1 }, loot: { herb_stew: 2 }, days: 1.5, cost: 0,
  },
  {
    id: 'cook_crystal_feast', name: '蒸禾香封肉', facility: 'hearth', level: 2, reveal: 'herb_stew',
    description: '先用灵草焖透兽肉，再在肉汁里蒸熟新谷，最后用荷叶分包扎紧。',
    need: { beast_meat: 3, reed: 2, millet_grain: 4, wood: 2 }, loot: { crystal_feast: 3 }, days: 2.5, cost: 1,
  },
  {
    id: 'render_resin_salve', name: '熬松脂膏', facility: 'hearth', level: 2,
    description: '用小火把松油里的水汽收出去，分进干净的瓷罐。',
    need: { wood: 3, reed: 2 }, loot: { salve: 6 }, days: 2.5, cost: 2, reveal: 'wood',
  },
];

const merchantOrders = {
  ration: {
    units: 6, regularText: '「你几趟都来我这儿包干粮。柜后还压着能下种的谷子。你肯收拾院子的话，试着种一畦。」',
    name: '给粮摊补两张蒸席', text: '拣灵草的干净长茎编成垫蒸笼的席，陶嫂答应分你发得好的粟种。',
    need: { reed: 6 }, reward: { millet_seed: 3, millet_grain: 4 },
    outcome: '陶嫂把灵草交给编席的人，捧出一包饱满粟种。「收的时候留一穗，冬前用得上。」',
    repeat: {
      name: '送一袋晒谷', text: '陶嫂愿收晒好的谷子，把蒸好的口粮匀给种粮人。',
      need: { millet_grain: 8 }, reward: { ration: 8 }, cooldown: 6,
      outcome: '摊主在袋口掐了一把，粒粒干硬，另从食盒分出八包口粮。',
    },
  },
  wood: {
    units: 5, regularText: '「你拣柴跟买柴都舍得费工。我以前沿石脊去割过松脂，有条小路，别人容易踩过去。」',
    name: '缚稳木客的柴担', text: '木客要借晾韧了的灵草长茎捆柴，也愿把自己走过的一道旧路说给你。',
    need: { reed: 8 }, reward: { pine_ledge_note: 1 },
    outcome: '木客挨根试过柴绳，从挑担夹层抽出一张旧纸。青崖一侧，石脊背后标着一线细路。',
  },
  reed: {
    units: 3, regularText: '「我晒灵草的架子松了。你要有直的松木，我换一把能播的粟种给你。」',
    name: '把晒草架撑直', text: '摊主缺松木替掉旧支脚。有了架子，铺着的灵草就能晒透。',
    need: { wood: 7 }, reward: { millet_seed: 2, reed: 4 },
    outcome: '新撑条把晒架挑高，灵草终于离开了潮气。鹭娘抖掉夹层里的糠，分出一小把粟种。',
    repeat: {
      name: '收一束补架柴', text: '摊主隔几天收些结实的枝条来更换晒架。',
      need: { wood: 9 }, reward: { reed: 5 }, cooldown: 7,
      outcome: '摊主取下晒透的一束灵草，把新松木捆在架脚下备用。',
    },
  },
  salve: {
    units: 4, regularText: '「常往野外跑的人，一罐膏用得是真快。我锅里的护草也快没了。」',
    name: '给药商续锅料', text: '捎来够一锅的灵草和引火松木，药商留两罐自用，剩下的分给你。',
    need: { reed: 8, wood: 3 }, reward: { salve: 4, wood: 2 },
    outcome: '药商煨好两小锅膏，分出四罐，把未用的两块松木一并还给你。',
  },
  qi_powder: {
    units: 4, regularText: '「你要的多，我也得天天碾。旧碾槽裂了，撑得住寒铁的才能再开。」',
    name: '重钉药碾', text: '用寒铁给药碾做紧箍，再给下一磨备几束灵草。',
    need: { ore: 5, reed: 8 }, reward: { qi_powder: 5 },
    outcome: '药商推了推修紧的碾轮，粉从缝里落进布袋。他晾开一半，另一半称给你。',
  },
  reed_arrow: {
    units: 12, regularText: '「你拿走的苇箭够插一圈靶了。木头会削，不妨看看铁箭头是怎么收口的。」',
    name: '替箭匠凑齐一扎箭坯', text: '箭匠用松木试直度，也要一点寒铁示范套上箭头的做法。',
    need: { wood: 8, ore: 4 }, reward: { arrow_pattern: 1 },
    outcome: '锥子在箭头后面转了一圈，寒铁刚好套稳。箭匠把开料寸路画给你，顺手搁下一枝样箭。',
  },
  millet_seed: {
    units: 4, regularText: '「你买这么些种，看来要种好几轮。晒些谷子拿来，我看看哪畦留种最好。」',
    name: '送一袋新收的谷', text: '常圃农会把谷粒淘一遍，分出适合留种的那几穗。',
    need: { millet_grain: 8 }, reward: { millet_seed: 4, ration: 3 },
    outcome: '常圃农用水淘走空壳，留住沉底的谷粒，再拿冬前存好的几份干粮换你。',
    repeat: {
      name: '给圃农留种', text: '常圃农每隔一阵收一袋晒透的谷，换出自家种过的种子。',
      need: { millet_grain: 10 }, reward: { millet_seed: 4, reed: 3 }, cooldown: 9,
      outcome: '收粮袋叠在墙角，常圃农另取一小把精挑的种。',
    },
  },
  reed_talisman: {
    units: 3, regularText: '「一张符管一阵水汽。你下次带晒过的灵草来，我也能跟你分一匣。」',
    name: '收一束干灵草作符底', text: '摊主说纸糊得太湿，一翻便卷。先要一扎晾干的灵草长茎。',
    need: { reed: 12, wood: 6 }, reward: { reed_talisman: 6 },
    outcome: '船商挑了最干的灵草捣浆糊纸，等到边角平整，把揭下的六张分给你。',
  },
  heal_pill: {
    units: 2, regularText: '「药船在旧闸等了好些年。如今上了岸，还得找些活叶慢慢温炉。」',
    name: '给复航药船送鲜药', text: '药商想用松木温炉，也愿拿成丹换几束新拔的灵草。',
    need: { reed: 12, wood: 5 }, reward: { heal_pill: 5 },
    outcome: '药商把带芽的灵草另放，其余放到窗纸下晾着，分给你一只装好丹药的瓷瓶。',
  },
};

const stockSources = {
  ration: '陶嫂去看和好的面，下一屉还要等面醒透。',
  wood: '木贩指了指院里晾着的几根湿枝。「干透才搬过来。」',
  reed: '鹭娘把空篮翻面晾水。「下一捆灵草还铺在晒架上。」',
  cudgel: '裴匠把竹篓下那段木头往手边挪了挪。「杖节得一寸寸削平。」',
  knife: '炉里只剩一坯粗铁，卢打铁截好刀料，压回炭上。',
  straw_cape: '任匠掰开一把刚理好的蓑草，压在膝头等编。',
  salve: '夏婆拿干净罐子挨个烤了烤。药锅里的松脂还没收稠。',
  qi_powder: '石浣把空纸摊好。「还得把粗粉过一遍细筛。」',
  reed_arrow: '冯翎翻过空箭篓。「苇秆削了，尾上的线还没缠。」',
  millet_seed: '常圃农在袋底摸了一把，只摸出几粒空壳。「新晒的得再筛筛。」',
  reed_talisman: '莫船家翻开符匣，底纸还是湿的。「下一扎还挂在舱口晾。」',
  heal_pill: '苏家的伙计摇了摇瓶。「下一炉在船上煨着。」',
};

const warehouseStack = 40;
const warehouseCap = [0, 16, 32, 56];
const setupDays = 0.25;
const collectDays = 0.25;

export const economyData = {
  facilities, projects, merchantOrders, warehouseStack, warehouseCap,
  setupDays, collectDays, jobSlots: '等于设施等级',
};

export function initialEconomyState() {
  return {
    warehouse: {},
    warehouseWear: {},
    buildings: Object.fromEntries(facilities.map(({ id, start }) => [id, start])),
    jobs: [],
    nextJob: 1,
    merchants: {},
    stock: {},
  };
}

function normalizeEconomy(state) {
  state.economy ??= initialEconomyState();
  return state.economy;
}

function effectiveLevel(state, facility) {
  return state.economy?.buildings[facility.id] ?? facility.start;
}

function knowsFacility(state, facility, kit) {
  if (effectiveLevel(state, facility) > 0 || !facility.reveal) return true;
  return [facility.reveal, facility.alternateReveal].filter(Boolean).some((id) =>
    state.knownItems.includes(id) || kit.homeSupplies(state, id) > 0);
}

function goodsVolume(goods, kit) {
  return Object.entries(goods).reduce((size, [id, count]) =>
    size + (kit.records.gear[id] ? count : Math.ceil(count / warehouseStack)), 0);
}

function storedItems(state) {
  return state.economy?.warehouse ?? {};
}

function depositable(state, id, kit) {
  const item = kit.records.items[id];
  if (!item || item.kind === 'key' || item.keepOnFall || Object.values(state.equipment).includes(id)) return 0;
  return Math.max(0, kit.owns(state, id) - (id === 'ration' ? (state.reliefRations ?? 0) : 0));
}

function spaceInWarehouse(state) {
  return warehouseCap[state.economy?.buildings.warehouse ?? 1];
}

function depositReason(state, id, count, kit) {
  const held = depositable(state, id, kit);
  if (held < count) return '手头没有这么多能入库的东西。';
  const stored = storedItems(state);
  if (stored[id] && kit.records.gear[id]) return '仓库已有同名装备。';
  if (goodsVolume({ ...stored, [id]: (stored[id] ?? 0) + count }, kit) > spaceInWarehouse(state)) return '仓架放不下了。';
  return '';
}

function withdrawalReason(state, id, count, kit) {
  if ((storedItems(state)[id] ?? 0) < count) return '仓库里没有这么多。';
  if (kit.records.gear[id] && kit.owns(state, id)) return '行囊已有同名装备。';
  if (!kit.hasRoom(state, { [id]: count })) return '行囊装不下。';
  return '';
}

function transferable(count, rejects) {
  let low = 0;
  let high = count;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (rejects(middle)) high = middle - 1;
    else low = middle;
  }
  return low;
}

function transfer(state, id, count, deposit, kit) {
  if (!kit.records.items[id] || !Number.isSafeInteger(count) || count < 1) return kit.refuse('请选择实际物件和件数。');
  const why = deposit ? depositReason(state, id, count, kit) : withdrawalReason(state, id, count, kit);
  if (why) return kit.refuse(why);
  const economy = normalizeEconomy(state);
  if (deposit) {
    if (kit.records.gear[id]) economy.warehouseWear[id] = state.durability[id];
    kit.removeItem(state, id, count, false);
    economy.warehouse[id] = (economy.warehouse[id] ?? 0) + count;
  } else {
    kit.addItems(state, { [id]: count });
    economy.warehouse[id] -= count;
    if (!economy.warehouse[id]) delete economy.warehouse[id];
    if (kit.records.gear[id]) {
      state.durability[id] = economy.warehouseWear[id] ?? kit.records.gear[id].durability;
      delete economy.warehouseWear[id];
    }
  }
  return kit.say(state, `${deposit ? '存入' : '取出'}${kit.nameOf(id)}×${count}。`);
}

function allProjects(state, kit) {
  const yardPlans = projects.filter(({ reveal }) => !reveal || state.knownItems.includes(reveal));
  const benchPlans = kit.data.recipes.filter((row) => row.facility && kit.knowsRecipe(state, row))
    .map((row) => ({
      id: row.id, name: kit.nameOf(row.result), description: row.desc ?? '',
      need: row.need, loot: { [row.result]: row.count ?? 1 }, cost: row.cost ?? 0, days: row.days,
      facility: row.facility, level: row.facilityLevel ?? 1,
    }));
  return [...yardPlans, ...benchPlans];
}

function nextUpgrade(state, facility, kit) {
  const row = facility.upgrades[effectiveLevel(state, facility) - facility.start];
  return row ? { ...row, reason: kit.homeRequirements(state, row.cost, row.need) || '' } : null;
}

function activeProjects(state, id) {
  return (state.economy?.jobs ?? []).filter((job) => job.facility === id);
}

function heldGear(state, loot, kit) {
  return Object.keys(loot).some((id) => kit.records.gear[id] && kit.homeSupplies(state, id));
}

function projectBlocker(state, project, facility, kit) {
  const level = effectiveLevel(state, facility);
  if (project.level > level) return `需${facility.name}${project.level}级。`;
  const active = activeProjects(state, facility.id);
  if (active.length >= level) return '这处还在忙。';
  const pending = (state.economy?.jobs ?? []).some(({ loot }) =>
    Object.keys(project.loot).some((id) => kit.records.gear[id] && loot[id]));
  if (heldGear(state, project.loot, kit) || pending) {
    return '手上已经有同名器具或正在打造。';
  }
  return kit.homeRequirements(state, project.cost, project.need) || '';
}

function collectionBlocker(state, job, kit) {
  if (heldGear(state, job.loot, kit)) return '身边已有同名器具，先把它处置妥当。';
  if (!kit.hasRoom(state, job.loot)) return '先在行囊腾出空位。';
  return '';
}

function projectView(state, job, kit) {
  const remaining = job.readyDay - state.day > 1e-9 ? job.readyDay - state.day : 0;
  return {
    id: job.id, name: job.name, remaining, ready: remaining === 0, loot: job.loot,
    reason: remaining === 0 ? collectionBlocker(state, job, kit) : '',
  };
}

export function economyView(state, kit) {
  if (!kit.atHome(state)) return { facilities: [], warehouse: { used: 0, capacity: 0, stored: [], carried: [] } };
  const localFacilities = facilities.filter((facility) => knowsFacility(state, facility, kit)).map((facility) => {
    const { id, name, desc } = facility;
    const level = effectiveLevel(state, facility);
    return { id, name, desc, level, maxLevel: facility.start + facility.upgrades.length, upgrade: nextUpgrade(state, facility, kit) };
  });
  const plans = allProjects(state, kit);
  for (const facility of localFacilities) {
    const definition = facilities.find(({ id }) => id === facility.id);
    facility.projects = plans.filter(({ facility: id }) => id === facility.id)
      .map((plan) => ({ ...plan, reason: projectBlocker(state, plan, definition, kit) }));
    facility.jobs = activeProjects(state, facility.id).map((job) => projectView(state, job, kit));
  }
  const stored = storedItems(state);
  const row = (id, count, check) => ({
    id, name: kit.nameOf(id), count, maximum: transferable(count, check), reason: count ? check(1) : '',
  });
  const warehouse = {
    used: goodsVolume(stored, kit), capacity: spaceInWarehouse(state),
    stored: Object.entries(stored).map(([id, count]) => row(id, count, (quantity) => withdrawalReason(state, id, quantity, kit))),
    carried: Object.keys(state.inventory).map((id) => {
      const count = depositable(state, id, kit);
      return row(id, count, (quantity) => depositReason(state, id, quantity, kit));
    }).filter(({ count }) => count > 0),
  };
  return { facilities: localFacilities, warehouse };
}

function buildFacility(state, id, kit) {
  const facility = facilities.find((entry) => entry.id === id);
  if (!facility || !knowsFacility(state, facility, kit)) return kit.refuse('还没找到这里的用法。');
  const step = nextUpgrade(state, facility, kit);
  if (!step) return kit.refuse('这里的梁和炉墙已经收拾妥当。');
  if (step.reason) return kit.refuse(step.reason);
  kit.spendHome(state, step.cost, step.need);
  normalizeEconomy(state).buildings[id] = effectiveLevel(state, facility) + 1;
  kit.advance(state, step.days);
  return kit.say(state, `${facility.name}已收拾到${effectiveLevel(state, facility)}级。`);
}

function startProject(state, id, kit) {
  const project = allProjects(state, kit).find((row) => row.id === id);
  const facility = project && facilities.find((row) => row.id === project.facility);
  if (!facility || !knowsFacility(state, facility, kit)) return kit.refuse('这道作法还没打听清楚。');
  const blocked = projectBlocker(state, project, facility, kit);
  if (blocked) return kit.refuse(blocked);
  kit.spendHome(state, project.cost, project.need);
  const economy = normalizeEconomy(state);
  const job = {
    id: `job-${economy.nextJob++}`, facility: facility.id, name: project.name,
    loot: project.loot, readyDay: state.day + setupDays + project.days,
  };
  economy.jobs.push(job);
  kit.advance(state, setupDays);
  return kit.say(state, `${project.name}已经起手，过些时候来收。`);
}

function collectProject(state, id, kit) {
  const economy = normalizeEconomy(state);
  const index = economy.jobs.findIndex((job) => job.id === id);
  if (index < 0) return kit.refuse('这炉或这一畦已经收过了。');
  const job = economy.jobs[index];
  if (job.readyDay - state.day > 1e-9) return kit.refuse('火候还没到，等一回再看。');
  const blocked = collectionBlocker(state, job, kit);
  if (blocked) return kit.refuse(blocked);
  economy.jobs.splice(index, 1);
  kit.addItems(state, job.loot);
  kit.advance(state, collectDays);
  return kit.say(state, `收好${kit.goodsText(job.loot)}。`);
}

function stockEntry(state, stallId, offer) {
  const policy = offer.stock;
  if (!policy) return null;
  const old = state.economy?.stock[`${stallId}:${offer.id}`];
  if (!old) return { count: policy.cap, day: state.day };
  if (!(policy.interval > 0) || !(policy.growth > 0)) return old;
  const periods = Math.max(0, Math.floor((state.day - old.day) / policy.interval + 1e-9));
  const count = Math.min(policy.cap, old.count + periods * policy.growth);
  return { count, day: count === policy.cap ? state.day : old.day + periods * policy.interval };
}

export function marketStock(state, stallId, offer) {
  return stockEntry(state, stallId, offer)?.count ?? null;
}

function merchantState(state, id) {
  return state.economy?.merchants[id] ?? { paid: 0, completed: false, repeatAfter: 0 };
}

export function recordPurchase(state, stallId, count, offer) {
  const economy = normalizeEconomy(state);
  const prior = merchantState(state, stallId);
  economy.merchants[stallId] = { ...prior, paid: prior.paid + count };
  const stock = stockEntry(state, stallId, offer);
  if (stock) economy.stock[`${stallId}:${offer.id}`] = { ...stock, count: stock.count - count };
  const relationship = merchantOrders[offer.id];
  return relationship && prior.paid < relationship.units && prior.paid + count >= relationship.units
    ? relationship.regularText : '';
}

function atStall(state, stall) {
  return (stall?.offers ?? []).some(({ afterQuest }) => !afterQuest || state.completedQuests.includes(afterQuest));
}

function orderAt(state, stall) {
  if (!atStall(state, stall)) return null;
  const profile = merchantOrders[stall.offers[0].id];
  const saved = merchantState(state, stall.id);
  if (!profile || saved.paid < profile.units) return null;
  return saved.completed ? profile.repeat ?? null : profile;
}

function orderBlocker(state, order, saved, kit) {
  if (state.day < saved.repeatAfter) return '商人还在料理上一单。';
  const needs = kit.homeRequirements(state, order.cost ?? 0, order.need);
  if (needs) return needs;
  const spent = kit.homeBagSpend(state, order.need);
  return kit.hasRoom(state, order.reward, spent) ? '' : '先在行囊腾出空位。';
}

export function merchantInfo(state, stall, kit) {
  if (!atStall(state, stall)) return null;
  const offer = stall.offers[0];
  const profile = merchantOrders[offer.id];
  const saved = merchantState(state, stall.id);
  const regular = Boolean(profile && saved.paid >= profile.units);
  const order = orderAt(state, stall);
  const unavailable = marketStock(state, stall.id, offer) === 0 ? (offer.restockText ?? stockSources[offer.id]) : '';
  const greeting = regular && !saved.completed ? profile.regularText : stall.desc;
  return {
    greeting: [greeting, unavailable].filter(Boolean).join(' '),
    regular, completed: saved.completed,
    order: order ? {
      name: order.name, need: order.need, reward: order.reward, cost: order.cost ?? 0,
      text: order.text, reason: orderBlocker(state, order, saved, kit),
    } : null,
  };
}

function merchantTalk(state, id, kit) {
  const stall = kit.data.market.stalls.find((entry) => entry.id === id);
  const details = merchantInfo(state, stall, kit);
  return details ? kit.say(state, details.greeting || '摊主把能卖的货拢到秤边。') : kit.refuse('摊主还没到。');
}

function fulfillOrder(state, id, kit) {
  const stall = kit.data.market.stalls.find((entry) => entry.id === id);
  const order = orderAt(state, stall);
  if (!order) return kit.refuse('这家摊还没有要交托的买卖。');
  const saved = merchantState(state, id);
  const why = orderBlocker(state, order, saved, kit);
  if (why) return kit.refuse(why);
  kit.spendHome(state, order.cost ?? 0, order.need);
  kit.addItems(state, order.reward);
  const cooldown = order.cooldown ?? merchantOrders[stall.offers[0].id].repeat?.cooldown ?? 0;
  normalizeEconomy(state).merchants[id] = {
    ...saved, completed: true, repeatAfter: state.day + cooldown,
  };
  return kit.say(state, order.outcome);
}

export function economyAction(state, action, { id, count = 1 }, kit) {
  const actions = {
    econDeposit: () => transfer(state, id, count, true, kit),
    econWithdraw: () => transfer(state, id, count, false, kit),
    econBuild: () => buildFacility(state, id, kit),
    econStart: () => startProject(state, id, kit),
    econCollect: () => collectProject(state, id, kit),
    merchantTalk: () => merchantTalk(state, id, kit),
    merchantOrder: () => fulfillOrder(state, id, kit),
  };
  if (!Object.hasOwn(actions, action)) return null;
  if (!kit.atHome(state)) return kit.refuse('回落灯村才能办这件事。');
  return actions[action]();
}
