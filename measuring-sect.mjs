const sectId = 'water_gauge';
const region = 'measuring_hall';

const offices = {
  outer: { name: '外门弟子', role: '跟执事学认汛尺，备齐巡视山脚的木桩、药包和口粮。' },
  inner: { name: '内门弟子', role: '独自沿堤查水，替几处水站查验上游报来的险情。' },
  elder: { name: '长老', role: '主持难办的水事，调集人手守上游险段。' },
  actingHead: { name: '代宗主', role: '秦观澜闭关期间，由你拨用门库、安排差事和修整观里的设施。' },
};
const officeNames = Object.keys(offices);
const standing = (office = 'outer') => officeNames.indexOf(office);

const jobs = [
  { id: 'gauge_posts', office: 'outer', type: '采集', name: '更换断掉的量水桩', need: { wood: 6, ore: 2 }, coins: 18, credit: 4, cooldown: 6,
    desc: '雨后有两根桩被冲松。补齐木桩和铁扣，明早巡堤的人就能往上游去。' },
  { id: 'gauge_pillbox', office: 'outer', type: '采集·狩猎', name: '给巡堤队补药箱', need: { reed: 7, hide: 3 }, coins: 24, credit: 6, cooldown: 9,
    desc: '药箱的外皮烂了。带兽革和新鲜灵草来，执事会让缝匠和坐堂医一起接手。' },
  { id: 'gauge_hare_rations', office: 'outer', type: '狩猎', name: '送肉给夜班的巡堤弟子', need: { beast_meat: 9, wood: 3 }, coins: 19, credit: 5, cooldown: 5,
    desc: '河上夜班赶不上灶房开饭。白苇滩的白耳兔和附近常见小兽都有可用的肉，送来由灶房收拾。' },
  { id: 'gauge_ford_proof', office: 'outer', type: '狩猎', name: '验一批浅滩妖丹', need: { qi_core: 3, hide: 2 }, coins: 29, credit: 8, cooldown: 8,
    desc: '执事想分清滩口近来的妖患。泥鳞兽、苇尾狐一类妖兽的丹和兽革都可以用来查验。' },
  { id: 'gauge_lamp_oil', office: 'outer', type: '采集', name: '备低堤巡夜的灯料', need: { wood: 10, reed: 6 }, coins: 27, credit: 7, cooldown: 8,
    desc: '松木可劈引火条，过季的灵草叶可以裹住灯柄。带来后晾在外廊，留给巡夜轮值的人。' },
  { id: 'gauge_grain_shell', office: 'outer', type: '采集·狩猎', name: '为新弟子缝三副练具', need: { hide: 5, reed: 5, qi_core: 4 }, coins: 44, credit: 12, cooldown: 14,
    desc: '本月多了几个习尺的弟子。厚皮缝护掌，灵草垫在里边，炼气妖丹留给他们练辨气。' },
  { id: 'gauge_silt', office: 'inner', type: '狩猎·阵材', name: '供试水槽的灵晶和妖丹', need: { core: 5, foundation_core: 2 }, coins: 58, credit: 13, cooldown: 12,
    desc: '傅澄想试验阵法长时间浸水会怎样。断桩老蜥、泥鳞鬃犬等筑基妖兽的丹可以入阵。' },
  { id: 'gauge_flood_check', office: 'inner', type: '采集·校验', name: '校准两户送来的汛尺', need: { wood: 3, ore: 4, core: 3 }, days: 0.75, coins: 47, credit: 11, cooldown: 11,
    desc: '两户水位说法差了一截。修好尺脚，在同一股水里核准刻度，再请门房把开闸时辰分别送回。' },
  { id: 'gauge_weir_shields', office: 'inner', type: '狩猎', name: '给查暗堰的人换护甲', need: { hard_scale: 4, foundation_core: 2, ore: 3 }, coins: 72, credit: 16, cooldown: 13,
    desc: '有人下水时被礁石划开了甲。蒲根巨蜥和雪沟里的夹石雪蟹留下的厚甲片可换旧甲。' },
  { id: 'gauge_sinew_rope', office: 'inner', type: '狩猎·采集', name: '换掉垂进水里的旧绳', need: { battle_sinew: 5, hide: 4, wood: 4 }, coins: 62, credit: 15, cooldown: 12,
    desc: '山口旧绳长时间泡在水里。岩羊、石羚等野兽的坚韧兽筋适合搓一道新绳。' },
  { id: 'gauge_frog_inspection', office: 'inner', type: '实地查验', name: '回验青埂的新闸', needsQuest: 'zhao_gate_bounty',
    need: { ore: 6, core: 4, foundation_core: 3 }, days: 0.75, coins: 105, credit: 23, cooldown: 18,
    desc: '先帮省潮司查完青埂旧闸，再按查得的水势加一道新铁箍。只有看过现场的人才知道把箍打在哪儿。' },
  { id: 'gauge_relay_medicine', office: 'inner', type: '狩猎·救济', name: '给去对岸换班的人备补给',
    need: { foundation_meat: 6, reed: 10, foundation_core: 2 }, days: 0.5, coins: 80, credit: 18, cooldown: 14,
    desc: '对岸新设了值守岗，头一班要在那边待上几天。筑基妖兽的肉交给灶房，妖丹留给坐堂医调药。' },
  { id: 'gauge_deep_weir', office: 'elder', type: '狩猎·阵材', name: '压住深水段护阵',
    need: { gold_core: 2, black_iron: 4, core: 5 }, days: 0.75, coins: 126, credit: 23, cooldown: 13,
    desc: '深水里的阵钉被冲歪。金丹妖兽的丹才能压住这股水，暗金用来加箍，灵晶则给巡夜弟子作灯。' },
  { id: 'gauge_upper_revetment', office: 'elder', type: '狩猎·加固', name: '为入上游的行船加护板',
    need: { hard_scale: 8, battle_sinew: 6, gold_core: 2 }, coins: 138, credit: 25, cooldown: 15,
    desc: '过去护板只挡得住碎石，挡不住伏在水底的大妖。把完整的厚甲和筋带回来，先包住船头。' },
  { id: 'gauge_north_crop', office: 'elder', type: '多地物资', name: '接济守峡口的住户',
    need: { gold_meat: 8, millet_grain: 9, reed: 12 }, days: 1, coins: 105, credit: 23, cooldown: 12,
    desc: '守峡的人连日不能下山。灶房收金丹妖兽的肉和园里收的粟，坐堂医另留一份草药。' },
  { id: 'gauge_three_gauges', office: 'elder', type: '实地查验', name: '给三州换汛期的刻尺', needsQuest: 'zhao_joint_measure',
    need: { ore: 12, core: 12, gold_core: 3 }, days: 1.25, coins: 177, credit: 34, cooldown: 22,
    desc: '照原城已核过旧约才有统一的刻度。把新尺的铁脚和三州共用的灵晶备齐，按新阵的水位逐一核验。' },
  { id: 'gauge_warden_report', office: 'elder', type: '首领查验', name: '为湖底险段另备回水阵', needsDefeat: 'fault_warden',
    need: { gold_core: 4, battle_sinew: 6, black_iron: 8 }, days: 1, coins: 196, credit: 39, cooldown: 24,
    desc: '先得有人活着下过错水湖底、能举证那里究竟如何回水。再召人设阵，留足材料应付两次涨水。' },
  { id: 'gauge_deep_watch', office: 'elder', type: '高难狩猎', name: '替伏火坑的夜岗备三轮阵料',
    need: { gold_core: 6, hard_scale: 9, beast_eye: 5 }, days: 1.25, coins: 249, credit: 46, cooldown: 27,
    desc: '三处夜岗轮流换阵。妖目供探雾，甲片遮住阵脚，六颗金丹妖丹得各自成色完好。' },
];

const offer = (id, office, category, price, stock, interval = 0, unique = false) =>
  ({ id, office, category, price, stock, interval, unique });

const store = [
  offer('ration', 'outer', '口粮', 4, 12, 2),
  offer('meat_broth', 'outer', '口粮', 11, 4, 4),
  offer('salve', 'outer', '丹药', 8, 5, 3),
  offer('qi_powder', 'outer', '丹药', 9, 5, 3),
  offer('wood', 'outer', '常材', 5, 8, 3),
  offer('ore', 'outer', '常材', 12, 5, 4),
  offer('reed_arrow', 'outer', '弹药', 3, 12, 2),
  offer('iron_arrow', 'outer', '弹药', 5, 8, 3),
  offer('hide_shield', 'outer', '兵甲', 24, 1, 8),
  offer('reed_hat', 'outer', '兵甲', 28, 1, 8),
  offer('heal_pill', 'inner', '丹药', 24, 5, 4),
  offer('detox_pill', 'inner', '丹药', 18, 4, 4),
  offer('clear_qi_pill', 'inner', '丹药', 40, 3, 5),
  offer('herb_stew', 'inner', '口粮', 24, 3, 5),
  offer('core', 'inner', '常材', 16, 5, 4),
  offer('clear_needle', 'inner', '弹药', 7, 12, 3),
  offer('jade_pendant', 'inner', '兵甲', 93, 1, 12),
  offer('gauze_armor', 'inner', '兵甲', 136, 1, 14),
  offer('jade_pill', 'elder', '丹药', 54, 3, 6),
  offer('sense_powder', 'elder', '丹药', 82, 2, 7),
  offer('crystal_feast', 'elder', '口粮', 68, 2, 7),
  offer('cloud_arrow', 'elder', '弹药', 13, 8, 4),
  offer('black_iron', 'elder', '常材', 20, 5, 5),
  offer('gold_brow_guard', 'elder', '兵甲', 208, 1, 18),
  offer('measuring_tide_staff', 'elder', '兵甲', 289, 1, 0, true),
];

const exchange = [
  offer('iron_talisman', 'outer', '符箓', 4, 6, 3),
  offer('grain_pill', 'outer', '丹药', 5, 4, 3),
  offer('reed', 'outer', '常材', 3, 6, 3),
  offer('leather_knuckles', 'outer', '兵甲', 14, 1, 12),
  offer('measuring_ford_shoes', 'outer', '兵甲', 15, 1, 0, true),
  offer('leaf_pill', 'inner', '丹药', 7, 4, 4),
  offer('focus_pill', 'inner', '丹药', 7, 4, 4),
  offer('resin_pill', 'inner', '丹药', 10, 4, 5),
  offer('tide_talisman', 'inner', '符箓', 12, 3, 6),
  offer('formula_gold_salve', 'inner', '丹方', 29, 1, 0, true),
  offer('measuring_guard_cape', 'inner', '兵甲', 38, 1, 0, true),
  offer('measuring_water_breath_manual', 'inner', '功法', 36, 1, 0, true),
  offer('gold_salve', 'elder', '丹药', 15, 3, 5),
  offer('crystal_feast', 'elder', '口粮', 13, 4, 6),
  offer('return_breath_pill', 'elder', '丹药', 23, 2, 9),
  offer('fault_coat', 'elder', '兵甲', 45, 1, 0, true),
  offer('measuring_calm_peak_manual', 'elder', '功法', 72, 1, 0, true),
];

const actingHeadQuotes = {
  measuring_ford_shoes: { price: 90, source: '出门查堤可向器房领一双，工钱照实入账。' },
  formula_gold_salve: { price: 220, source: '请药房抄一份缓脉丹方，纸、墨和验药的工钱由领方人付。' },
  measuring_guard_cape: { price: 560, source: '查看上游暗堰要下水，器房留着一领旧制水甲。' },
  measuring_water_breath_manual: { price: 330, source: '书阁仍藏着当年内门讲解汛尺的竹简，可付工钱请人誊一份。' },
  measuring_calm_peak_manual: { price: 1250, source: '秦观澜闭关前把原册留在书阁。油绸纸昂贵，书吏按誊抄所用收钱。' },
};
const actingHeadStore = exchange.filter(({ id }) => actingHeadQuotes[id]).map(row => ({
  ...row, ...actingHeadQuotes[row.id], office: 'actingHead', sharesExchangeStock: true,
}));

const orders = [
  { id: 'dykePatrol', name: '派弟子巡青埂水路', fee: 26, days: 1.5,
    desc: '巡堤的人到水藻泥湾换班。青埂至没顶刻碑、没顶刻碑至水藻泥湾这两段路会少些拦人讨钱的。' },
  { id: 'settleGrain', name: '护送两村的运粮船', fee: 16, days: 4, proceeds: 32,
    desc: '派人协助青埂的船家过浅水。船家结给观里的酬金入门库，能补贴巡堤与修造。' },
  { id: 'fetchHerbs', name: '去上游收药', fee: 19, days: 2.5,
    desc: '让认草的人从水站带回新药材。交验后药柜会补回松脂膏与回气散，药圃扩过还能补高阶丹药。' },
  { id: 'ferrySupplies', name: '让器房给守堤弟子送箭', fee: 24, days: 3,
    desc: '拨一趟船送弦和箭。留下供人购补的包铁箭，器房扩过还能留下照水重矢和凝光箭。' },
];

const projects = [
  { id: 'garden', name: '药圃', desc: '药柜丹药补得更快，派人收药时能带回更好的药材。', steps: [
    { fee: 42, need: { wood: 8, reed: 10 }, days: 1 },
    { fee: 68, need: { core: 8, ore: 4, reed: 16 }, days: 2 },
  ] },
  { id: 'watch', name: '堤边哨棚', desc: '巡堤队停留更久，走两段堤路时遇匪的机会也更少。', steps: [
    { fee: 38, need: { wood: 12, ore: 6 }, days: 1 },
    { fee: 66, need: { ore: 10, black_iron: 6, core: 5 }, days: 1.75 },
  ] },
  { id: 'armory', name: '器房', desc: '器房扩建就能向弓手供更好的箭，派船时也可留下更多备用箭。', steps: [
    { fee: 45, need: { wood: 9, ore: 7 }, days: 1 },
    { fee: 76, need: { black_iron: 6, core: 8, battle_sinew: 5 }, days: 1.75 },
  ] },
];

const patrolRoads = ['green_dyke|old_marker', 'old_marker|scale_bog'];
const patrol = { roads: patrolRoads, days: [5, 7, 9], factor: [0.60, 0.46, 0.34] };
const treasury = { start: 96, capacity: 240, interval: 7, income: 18, donationMax: 60 };

export const measuringSectData = {
  id: sectId, region, name: '守尺观', master: '秦观澜', masterRealm: '元婴初期', governor: '石照川', governorRealm: '元婴初期',
  desc: '观里替沿河村镇管汛尺。弟子按名册轮值，雨急时连师长也会去堤边。',
  join: { need: { reed: 4, wood: 4 }, coins: 16 }, ranks: [],
  offices, jobs, store, exchange, actingHeadStore, orders, projects, patrol, treasury,
};

const equipment = [
  { id: 'measuring_cedar_ruler', name: '青松戒尺', desc: '外门夺魁所得。戒尺的边磨成圆弧，握柄留着一道护手的浅槽。',
    slot: 'weapon', weaponClass: 'staff', tier: 1, atk: 6, def: 1, perception: 2, durability: 41, repair: 9,
    trait: { kind: 'guard', intent: 'heavy', bonus: 2 },
    entry: '外门头名用过的青松戒尺。尺背顺着攻势一送，能卸去几分重击。' },
  { id: 'measuring_ford_shoes', name: '踏堤软靴', desc: '贡献堂用旧帆布改的软靴，鞋底着地时比一般硬鞋声音轻。',
    slot: 'boots', tier: 0, perception: 2, retreat: 0.04, durability: 29, repair: 6,
    trait: { kind: 'dodge', bonus: 0.035 },
    entry: '巡堤弟子常穿的软靴。沿碎石走不容易惊动旁人，交手时横挪也轻便。' },
  { id: 'measuring_guard_cape', name: '镇堰披甲', desc: '贡献堂收来的完整鳞片缝成一领短甲，薄肩留给持尺人伸手。',
    slot: 'armor', tier: 3, def: 6, hp: 9, qi: 4, durability: 55, repair: 18,
    trait: { kind: 'guard', intent: 'heavy', bonus: 4 },
    field: { gatherPadding: 1 },
    entry: '内门巡堰时穿的短甲。肋下双层鳞能分担重击，也挡得住石壁上的一点刮擦。' },
  { id: 'measuring_tide_staff', name: '沉潮衡杖', desc: '门内器房用久浸水里的硬木做杖芯。松手一寸，杖头水珠仍绕着铜环转。',
    slot: 'weapon', weaponClass: 'staff', tier: 6, hands: 2, atk: 8, def: 2, qi: 10, magicAtk: 7, spellQi: 28, spellPower: 25,
    durability: 77, repair: 32, entry: '金丹长老可购。铜环一响便可以真气催法，双手使杖时很难再腾手持副兵。' },
  { id: 'measuring_river_seal', name: '镇汛铜印', desc: '上任长老取急水里立得住的河石配铸了一枚印。璧中一点水痕多年未干。',
    slot: 'charm', tier: 8, hp: 7, qi: 11, perception: 5, physicalResist: 0.08, magicResist: 0.13,
    field: { fogTolerance: 0.9 }, durability: 81, repair: 36,
    entry: '长老考核的头名之物。佩上能分担兵刃和术法的余劲，在潮雾里也能多护一阵真气。' },
];

const manuals = [
  { id: 'measuring_water_breath_manual', name: '尺下听水诀', grade: '灵品', tier: 3,
    carried: '内门弟子记汛时用过的三尺竹简，边角有拿指尖按过的浅凹。',
    desc: '从尺上的细颤辨水势。同样的法子用到枪杖上，能较早察觉招势发到哪儿。',
    specialty: ['staff', 'spear'], ranks: [
      { base: { perception: 3, qi: 3 }, focus: { atk: 2 }, effect: '出手前能多辨出几分力道，拿枪杖更顺手。' },
      { tier: 4, cost: 48, days: 1.25, need: { reed: 9, core: 5, foundation_core: 2 },
        base: { perception: 5, qi: 5, heavyGuard: 1 }, focus: { atk: 3, guard: 1 }, effect: '重招袭来时也有余地卸力，枪杖架招更稳。' },
      { tier: 5, cost: 70, days: 2, need: { core: 7, foundation_core: 4, ore: 6 },
        base: { perception: 7, qi: 7, heavyGuard: 2, heavyGuardQi: 2 }, focus: { atk: 4, guard: 2 }, effect: '架住重招能顺势回一口真气，枪杖接招再从容些。' },
    ] },
  { id: 'measuring_calm_peak_manual', name: '停川经', grade: '玄品', tier: 6,
    carried: '长老的小册子用油绸包住。一张空白页上只勾了江水停在何处。',
    desc: '遇强风急雨也收得住气。使枪杖时能收住散到兵刃末端的力。',
    specialty: ['staff', 'spear'], ranks: [
      { base: { qi: 7, def: 1, magicAtk: 2, magicResist: 0.035 }, focus: { atk: 2 }, effect: '真气更足，术法冲来时能卸去一点余劲。' },
      { tier: 7, cost: 118, days: 2.75, need: { black_iron: 7, gold_core: 4, core: 8 },
        base: { qi: 10, def: 2, magicAtk: 3, magicResist: 0.055, heavyGuard: 2 }, focus: { atk: 3 }, effect: '护住内息的同时也能稳住重击，执枪杖时出手更有力。' },
      { tier: 8, cost: 184, days: 4, need: { black_iron: 12, gold_core: 8, battle_sinew: 5 },
        base: { qi: 13, def: 3, magicAtk: 5, magicResist: 0.08, heavyGuard: 3, fogTolerance: 0.65 },
        focus: { atk: 5, guard: 2 }, effect: '内息厚实，在潮雾中也能缓一缓，熟使枪杖时攻守都有余力。' },
    ] },
];

export const measuringSectContent = {
  items: [
    ...equipment.map(({ id, name, desc }) => ({ id, name, desc, kind: 'gear', price: 0, sell: 0, oneOfAKind: true })),
    ...manuals.map(({ id, name, carried }) => ({ id, name, desc: carried, kind: 'manual', price: 0, sell: 0, oneOfAKind: true, keepOnFall: true })),
  ],
  gear: equipment.map(({ name, desc, ...gear }) => gear),
  innerStyles: manuals.map(({ carried, ...manual }) => manual),
};

const emptyMember = () => ({ office: 'outer', credit: 0, earned: 0, jobs: {}, stock: {} });
const memberOf = state => state.world.memberships[sectId];
const joined = state => state.world.affiliation === sectId;
const accessible = (state, minimum) => standing(memberOf(state)?.office) >= standing(minimum);
const atDesk = state => !state.event && !state.combat && !state.roadTrip && !state.gathering && !state.victoryPending;
const deskClosed = '先处理眼前的事，再来找管事。';
const leaderOffice = member => member?.office === 'actingHead';
const amountReason = '填写可成交的整数件数。';
const rankReason = office => `${offices[office].name}才可经手。`;
const daysText = days => Math.ceil(days * 1000) / 1000;

export function measuringAffiliation(state) {
  if (!joined(state)) return null;
  const member = memberOf(state);
  const office = member?.office ?? 'outer';
  return { id: sectId, name: measuringSectData.name, office, disciple: offices[office], credit: member?.credit ?? 0 };
}

function emptyHall(day) {
  return { fund: treasury.start, accountedAt: day, projects: {}, order: null, patrolUntil: 0, patrolFactor: 1, completed: {}, lastReport: '' };
}

export function beginMeasuringManagement(state) {
  const member = memberOf(state);
  if (leaderOffice(member)) member.hall ??= emptyHall(state.day);
}

function projectedHall(state, member) {
  const hall = member?.hall ?? emptyHall(state.day);
  const cycles = Math.max(0, Math.floor((state.day - hall.accountedAt) / treasury.interval));
  return { ...hall, fund: Math.min(treasury.capacity, hall.fund + cycles * treasury.income),
    accountedAt: hall.accountedAt + cycles * treasury.interval };
}

function patrolSchedule(hall) {
  if (hall.order?.id !== 'dykePatrol') return null;
  const level = hall.order.watchLevel ?? hall.projects.watch ?? 0;
  return { startsAt: hall.order.doneAt, until: hall.order.doneAt + patrol.days[level], factor: patrol.factor[level] };
}

function currentPatrol(hall, day) {
  if (!hall) return null;
  const pending = patrolSchedule(hall);
  if (pending && day >= pending.startsAt && day < pending.until) return pending;
  return hall.patrolUntil > day ? { until: hall.patrolUntil, factor: hall.patrolFactor } : null;
}

export function measuringPatrolFactor(state, leg) {
  if (!patrolRoads.includes(leg.key)) return 1;
  return currentPatrol(memberOf(state)?.hall, state.day)?.factor ?? 1;
}

function taskReason(state, member, job, kit) {
  if (!joined(state)) return '还没加入守尺观。';
  if (leaderOffice(member)) return '代宗主在议事堂派差。';
  if (!atDesk(state)) return deskClosed;
  if (!accessible(state, job.office)) return rankReason(job.office);
  if (job.needsQuest && !state.completedQuests.includes(job.needsQuest)) return `先办妥「${kit.records.quests[job.needsQuest].name}」。`;
  if (job.needsDefeat && !state.defeated.includes(job.needsDefeat)) return '要有人亲历湖底险段、打退守住那里的对手，观里才肯按他带回的水势布阵。';
  const remaining = (member.jobs?.[job.id] ?? 0) - state.day;
  if (remaining > 0) return `这一批还在用，${daysText(remaining)} 日后再来。`;
  if (job.days > 0 && state.satiety <= 0) return '先吃些东西，再来办差。';
  return kit.homeRequirements(state, 0, job.need) ||
    (!kit.hasRoom(state, { [kit.currency]: job.coins }, kit.homeBagSpend(state, job.need)) ? '腾出一格来收赏钱。' : '');
}

const stockChannel = (row, channel) => row.sharesExchangeStock ? 'exchange' : channel;

function stockAt(state, member, row, channel) {
  const project = member?.hall?.projects;
  const reduction = channel === 'store' && row.category === '丹药' && project?.garden ? project.garden * 0.75
    : channel === 'store' && row.category === '弹药' && project?.armory ? project.armory * 0.5 : 0;
  const interval = row.interval > 0 ? Math.max(1, row.interval - reduction) : 0;
  const carried = member?.stock?.[stockChannel(row, channel)]?.[row.id] ?? { count: row.stock, nextAt: null };
  if (!interval) return { count: carried.count, interval, nextAt: null };
  if (carried.nextAt == null || state.day < carried.nextAt) return { ...carried, interval };
  const batches = 1 + Math.floor((state.day - carried.nextAt) / interval);
  const count = Math.min(row.stock, carried.count + batches);
  return { count, interval, nextAt: count >= row.stock ? null : carried.nextAt + batches * interval };
}

function purchaseReason(state, member, row, stock, channel, count, kit) {
  if (!joined(state)) return '先入门，再到宗门货柜取物。';
  if (!atDesk(state)) return deskClosed;
  if (!accessible(state, row.office)) return rankReason(row.office);
  if (!Number.isSafeInteger(count) || count < 1) return amountReason;
  if (count > stock.count) return stock.nextAt == null ? '这一批已经领完。' : `货柜还没补上，在 ${daysText(stock.nextAt - state.day)} 日后再来。`;
  const gear = Boolean(kit.records.gear[row.id]);
  if ((gear || row.unique) && (count !== 1 || kit.gearReserved(state, row.id))) return '同名物件已经在行囊、乾坤袋或仓里。';
  const price = count * row.price;
  const cash = channel === 'store';
  if ((cash ? state.coins : member.credit ?? 0) < price) return cash ? '带的灵钱不够。' : '手头的贡献不够。';
  if (!kit.hasRoom(state, { [row.id]: count }, cash ? { [kit.currency]: price } : {})) return '行囊装不下这些东西。';
  return '';
}

function catalog(state, member, sources, channel, kit) {
  return sources.map((row) => {
    const current = stockAt(state, member, row, channel);
    const cap = kit.records.gear[row.id] || row.unique ? 1 : current.count;
    const counts = Array.from({ length: Math.max(0, cap) }, (_, i) => i + 1).filter((count) =>
      !purchaseReason(state, member, row, current, channel, count, kit));
    const item = kit.records.items[row.id];
    return { ...row, name: item.name, desc: item.desc, minimum: offices[row.office].name, stock: current.count,
      nextAt: current.nextAt, interval: current.interval, counts, max: counts.at(-1) ?? 0, available: counts.length > 0,
      reason: counts.length ? '' : purchaseReason(state, member, row, current, channel, 1, kit) };
  });
}

function managementView(state, member, kit) {
  if (!leaderOffice(member)) return null;
  const hall = projectedHall(state, member);
  const onDuty = currentPatrol(hall, state.day);
  const active = hall.order && { ...hall.order, ready: hall.order.doneAt <= state.day };
  const tasks = orders.map(order => {
    const reason = !atDesk(state) ? deskClosed : active ? '先听完上一趟差事的回报。' :
      hall.fund < order.fee ? '门库的灵钱不够。' : '';
    return { ...order, available: !reason, reason, completed: hall.completed[order.id] ?? 0 };
  });
  const buildings = projects.map(project => {
    const level = hall.projects[project.id] ?? 0;
    const next = project.steps[level] ?? null;
    const reason = !next ? '' : !atDesk(state) ? deskClosed : hall.fund < next.fee ? '门库的灵钱不够。'
      : state.satiety <= 0 ? '吃些东西，再来核对施工。' : kit.homeRequirements(state, 0, next.need) || '';
    return { ...project, level, maxLevel: project.steps.length, next, available: Boolean(next && !reason), reason };
  });
  return { fund: hall.fund, capacity: treasury.capacity, income: treasury.income, nextIncome: hall.accountedAt + treasury.interval,
    active, orders: tasks, projects: buildings, patrolUntil: onDuty?.until ?? 0, patrolFactor: onDuty?.factor ?? 1, lastReport: hall.lastReport,
    patrolRoads, donationMax: Math.min(treasury.donationMax, treasury.capacity - hall.fund, state.coins) };
}

export function measuringSectView(state, kit) {
  if (state.region !== region) return null;
  const faction = kit.data.sects.find(({ id }) => id === sectId);
  const member = memberOf(state);
  const pledged = joined(state);
  const returning = Boolean(member && !pledged);
  const admission = returning ? { coins: 0, need: {} } : faction.join;
  const previousSect = kit.data.sects.find(({ id }) => id === state.world.affiliation);
  const joinReason = pledged ? '' : !atDesk(state) ? deskClosed : state.world.affiliation ? `先回${previousSect?.name ?? '原师门'}辞行，再来入册。`
    : kit.homeRequirements(state, admission.coins, admission.need) || '';
  const governance = leaderOffice(member) && pledged;
  const cancelled = state.tournament?.current || state.tournament?.handoverPending;
  return { id: sectId, name: faction.name, desc: faction.desc, disciple: null,
    ...measuringAffiliation(state), joined: pledged, credit: member?.credit ?? 0, earned: member?.earned ?? member?.credit ?? 0,
    join: { ...admission, returning, reason: joinReason, available: !pledged && !joinReason },
    canLeave: pledged && !cancelled && !governance, leaveReason: governance ? '代宗主仍在守观，不能辞行。'
      : cancelled ? '先结束本届大比，再来辞行。' : '',
    jobs: governance ? [] : jobs.map(job => {
      const reason = taskReason(state, member, job, kit);
      return { ...job, minimum: offices[job.office].name, reason, available: !reason,
        nextAt: member?.jobs?.[job.id] ?? 0 };
    }),
    ranks: [], store: catalog(state, member, governance ? [...store, ...actingHeadStore] : store, 'store', kit),
    exchange: governance && !member.credit ? [] : catalog(state, member, exchange, 'exchange', kit),
    management: governance ? managementView(state, member, kit) : null };
}

const actions = new Set(['sectJoin', 'sectLeave', 'sectWork', 'sectClaim', 'sectBuy', 'sectExchange',
  'sectFundHall', 'sectManageOrder', 'sectSettleOrder', 'sectUpgradeHall']);
const governingActions = new Set(['sectFundHall', 'sectManageOrder', 'sectSettleOrder', 'sectUpgradeHall']);

function receiveOrderStock(state, member, quantities) {
  const shop = ((member.stock ??= {}).store ??= {});
  const received = {};
  for (const [id, quantity] of Object.entries(quantities)) {
    const row = store.find(item => item.id === id);
    const current = stockAt(state, member, row, 'store');
    const count = Math.min(row.stock, current.count + quantity);
    shop[id] = { count, nextAt: count >= row.stock ? null : current.nextAt };
    if (count > current.count) received[id] = count - current.count;
  }
  return received;
}

function settleOrder(state, kit, member, hall) {
  const order = orders.find(item => item.id === hall.order?.id);
  if (!order) return kit.refuse('没有等着回报的差事。');
  const remaining = hall.order.doneAt - state.day;
  if (remaining > 0) return kit.refuse(`人在路上，要 ${daysText(remaining)} 日后才回来。`);
  const scheduled = patrolSchedule(hall);
  hall.order = null;
  hall.completed = { ...hall.completed, [order.id]: (hall.completed[order.id] ?? 0) + 1 };
  switch (order.id) {
    case 'dykePatrol': {
      if (scheduled.until > hall.patrolUntil) {
        hall.patrolUntil = scheduled.until;
        hall.patrolFactor = scheduled.factor;
      }
      hall.lastReport = scheduled.until > state.day
        ? `青埂、没顶刻碑和水藻泥湾一带已经换过哨。两段堤路有人巡看，直到第 ${daysText(scheduled.until)} 日。`
        : `这趟巡堤已在第 ${daysText(scheduled.until)} 日结束。两段堤路的弟子已经回观。`;
      break;
    }
    case 'settleGrain': {
      const income = Math.min(treasury.capacity - hall.fund, order.proceeds);
      hall.fund += income;
      hall.lastReport = `运粮船到了下游。船家送来酬钱，门库入账 ${income} 灵钱。`;
      break;
    }
    case 'fetchHerbs': {
      const level = hall.projects.garden ?? 0;
      const quantities = { salve: 3, qi_powder: 3, ...(level >= 1 ? { heal_pill: 2 } : {}), ...(level >= 2 ? { jade_pill: 2 } : {}) };
      const received = kit.goodsText(receiveOrderStock(state, member, quantities));
      hall.lastReport = received ? `药柜这回添了${received}。余下的送去坐堂医手里。` : '药柜货齐，药材全送去坐堂医手里。';
      break;
    }
    case 'ferrySupplies': {
      const level = hall.projects.armory ?? 0;
      const quantities = { iron_arrow: 5, ...(level >= 1 ? { clear_needle: 5 } : {}), ...(level >= 2 ? { cloud_arrow: 4 } : {}) };
      const received = kit.goodsText(receiveOrderStock(state, member, quantities));
      hall.lastReport = received ? `器房这回添了${received}。多出来的箭留给堤上的弓手。` : '器房货齐，这批箭全留给堤上的弓手。';
      break;
    }
  }
  member.hall = hall;
  return kit.say(state, hall.lastReport);
}

function govern(state, action, payload, kit, member) {
  if (!leaderOffice(member)) return kit.refuse('议事堂只向代宗主开放。');
  const { id, count = 1 } = payload;
  const hall = projectedHall(state, member);
  if (action === 'sectSettleOrder') return settleOrder(state, kit, member, hall);
  if (action === 'sectFundHall') {
    const limit = Math.min(treasury.donationMax, treasury.capacity - hall.fund, state.coins);
    if (!Number.isSafeInteger(count) || count < 1 || count > limit) return kit.refuse('此刻添不了这么多灵钱。');
    state.coins -= count;
    hall.fund += count;
    member.hall = hall;
    return kit.say(state, `你从行囊拨出 ${count} 灵钱，记进门库。`);
  }
  const view = managementView(state, member, kit);
  if (action === 'sectManageOrder') {
    const order = view.orders.find(item => item.id === id);
    if (!order?.available) return kit.refuse(order?.reason || '没有这件可派的差事。');
    hall.fund -= order.fee;
    hall.order = { id, name: order.name, desc: order.desc, doneAt: state.day + order.days };
    if (id === 'dykePatrol') hall.order.watchLevel = hall.projects.watch ?? 0;
    member.hall = hall;
    return kit.say(state, `弟子领了${order.fee}枚灵钱上路，${order.days}日后可回来问结果。`);
  }
  const project = view.projects.find(item => item.id === id);
  if (!project?.available) return kit.refuse(project?.reason || '这项修造已经办妥。');
  kit.spendHome(state, 0, project.next.need);
  kit.advance(state, project.next.days);
  hall.fund -= project.next.fee;
  hall.projects = { ...hall.projects, [id]: project.level + 1 };
  member.hall = hall;
  return kit.say(state, `${project.name}已经扩成。工匠点过材料，从门库领了${project.next.fee}灵钱。${project.desc}`);
}

export function measuringSectAction(state, action, payload, kit) {
  if (state.region !== region || !actions.has(action)) return null;
  const member = memberOf(state);
  if (!atDesk(state)) return kit.refuse(deskClosed);
  if (action === 'sectJoin' || action === 'sectLeave') {
    const view = measuringSectView(state, kit);
    if (action === 'sectJoin') {
      if (!view.join.available) return kit.refuse(view.join.reason || '你已经在名册上。');
      if (!view.join.returning) {
        kit.spendHome(state, view.join.coins, view.join.need);
        state.world.memberships[sectId] = emptyMember();
      }
      state.world.affiliation = sectId;
      return kit.say(state, view.join.returning ? '管事把旧名册翻出来。原有的身份、功劳与大比成绩都在。'
        : '管事收下入门所需的木料、药草和香火钱，在外门名册上写下你的名字。');
    }
    if (!view.joined) return kit.refuse('还没加入守尺观。');
    if (!view.canLeave) return kit.refuse(view.leaveReason);
    state.world.affiliation = null;
    return kit.say(state, '你向守尺观辞行。管事把你的名册合上，旧身份和应领的东西仍留在账上。');
  }
  if (!joined(state)) return kit.refuse('还没加入守尺观。');
  if (governingActions.has(action)) return govern(state, action, payload, kit, member);
  const { id, count = 1 } = payload;
  if (action === 'sectWork') {
    const job = jobs.find(item => item.id === id);
    if (!job) return kit.refuse('这里没有这桩差事。');
    const reason = taskReason(state, member, job, kit);
    if (reason) return kit.refuse(reason);
    kit.spendHome(state, 0, job.need);
    kit.addCoins(state, job.coins);
    member.earned = (member.earned ?? member.credit ?? 0) + job.credit;
    member.credit = (member.credit ?? 0) + job.credit;
    if (job.days) kit.advance(state, job.days);
    (member.jobs ??= {})[id] = state.day + job.cooldown;
    return kit.say(state, `管事验收了「${job.name}」。你领到 ${job.coins} 灵钱和 ${job.credit} 贡献。`);
  }
  if (action === 'sectClaim') return kit.refuse('守尺观的功劳可以去贡献堂兑换。');
  const channel = action === 'sectBuy' ? 'store' : 'exchange';
  const row = (channel === 'store' ? [...store, ...actingHeadStore] : exchange).find(item => item.id === id);
  if (!row) return kit.refuse('这个柜上没有那件东西。');
  const current = stockAt(state, member, row, channel);
  const reason = purchaseReason(state, member, row, current, channel, count, kit);
  if (reason) return kit.refuse(reason);
  const payment = row.price * count;
  if (channel === 'store') state.coins -= payment;
  else member.credit -= payment;
  const inventory = ((member.stock ??= {})[stockChannel(row, channel)] ??= {});
  inventory[id] = { count: current.count - count, nextAt: current.interval > 0 ? current.nextAt ?? state.day + current.interval : null };
  kit.addItems(state, { [id]: count });
  return kit.say(state, `取到${kit.goodsText({ [id]: count })}，付了 ${payment} ${channel === 'store' ? '灵钱' : '贡献'}。`);
}
