const cut = (name, mult = 1) => ({ kind: 'attack', name, mult });
const slam = (name, mult = 1.5) => ({ kind: 'heavy', name, mult });
const cover = (name, mult = 1.35) => ({ kind: 'guard', name, mult });
const shoot = (name, mult = 1) => ({ ...cut(name, mult), ranged: true });
const evade = (name) => ({ kind: 'dodge', name });

const roadEnemy = (id, name, tier, hp, atk, def, perception, strategy, desc, intents, escapeChance = 0.07) => ({
  id, name, tier, hp, atk, def, perception, strategy, tags: ['human'],
  insight: 0, loot: {}, desc, intents, escapeChance, medicine: null,
});

const commonEnemies = [
  roadEnemy('road_knife_runner', '灰帕短刀客', 0, 24, 7, 2, 11, 'duelist',
    '灰布沿刀柄缠了几圈。出刀时他先把脚收回来，见人没有追才会再试一步。',
    [cut('收脚平削'), cover('把短刀横在胸前'), slam('突然翻腕劈下', 1.4), evade('一个错步让开')], 0.1),
  roadEnemy('road_spear_taker', '磨杆短矛手', 1, 32, 9, 3, 13, 'predator',
    '矛杆有两处被手磨得发亮。他双手向后挪时，就要迎面刺过来。',
    [cut('短矛推向肩头'), slam('跨步直刺', 1.45), cover('拽回矛杆挡身')]),
  { ...roadEnemy('road_bow_robber', '绳肩劫弓手', 2, 38, 10, 3, 15, 'duelist',
    '弓把有一道用麻绳缠好的裂口。把箭搭在弓弦上时，他还望着你脚下的位置。',
    [shoot('朝脚边试一箭'), cover('退开半步，举弓护身'), { ...slam('搭硬箭射来', 1.45), ranged: true }, evade('贴着树身往侧面一闪')], 0.11),
    accuracy: 0.09 },
  roadEnemy('road_salt_cutter', '盐袋刀手', 3, 51, 12, 5, 19, 'duelist',
    '他把旧盐袋折厚垫在左肩，刀顺着衣摆拖，手上没有多余的动作。',
    [cut('平刀抵到臂侧'), cover('以厚肩偏开半步'), slam('反手提刀斩下')]),
  roadEnemy('road_piked_guard', '绳鞘钩枪客', 4, 61, 14, 5, 21, 'predator',
    '枪尖下有个收绳的钩，脚步很稳。枪从身后抬高时，横着也够得远。',
    [cut('贴杆扎向腰侧'), slam('倒握枪杆横扫', 1.5), cover('把枪身架在眼前')]),
  { ...roadEnemy('road_shield_broker', '旧甲劫货人', 5, 71, 15, 6, 24, 'bulwark',
    '成排的甲片有好几块是从别处补来的。每次换手，盾沿总朝着可能出招的那边。',
    [cut('沿盾边探刀'), cover('并手稳住盾面', 1.45), slam('提盾压肩后下刀', 1.47)], 0.05),
    medicine: { id: 'heal_pill', count: 1 } },
  { ...roadEnemy('road_wind_swordsman', '避风劫剑客', 6, 75, 18, 6, 27, 'duelist',
    '他将披风束在背后，剑已出鞘。剑尖一低，他便会从你让开的那一侧抢上一步。',
    [cut('递剑点向手肘'), cover('回剑守肋'), slam('贴身旋剑回斩', 1.54), evade('收剑错开一步')], 0.1),
    dodge: 0.14 },
  { ...roadEnemy('road_black_bowist', '冷弦夺货人', 7, 87, 20, 7, 30, 'schemer',
    '弩搁在肩窝，搭着一支短箭。见你靠近，他便向旁让半步，把弩抬平。',
    [shoot('抬弩射出短箭'), cover('躲到石后拉紧弩弦'), { ...slam('扣动扳机，射出一支重箭', 1.55), ranged: true }], 0.09),
    accuracy: 0.19, medicine: { id: 'tide_pill', count: 1 } },
  roadEnemy('road_sandal_halberd', '沉靴劫道客', 8, 104, 22, 9, 33, 'predator',
    '短靴裹了几层硬皮，一步踩下几乎没有声响。他把短戟立在身侧，尖刃只露出一截。',
    [cut('挑戟向膝下扫'), slam('沉肩挑起短戟', 1.62), cover('立戟压住地面', 1.5)]),
];

const den = 'bandit_slope_den';
const scout = 'bandit_den_scout';
const sentry = 'bandit_den_sentry';
const bodyguard = 'bandit_den_bodyguard';
const leader = 'bandit_den_leader';
const denResidents = [scout, sentry, bodyguard, leader];
const kingBlade = 'gully_king_blade';
const sleeve = 'road_sleeve_manual';
const roadsideCart = 'bandit_marsh_lamp';
const greyGully = 'grey_gully';
const redRopeDen = 'bandit_red_rope_den';
const redRopeWatch = 'bandit_red_rope_watch';
const redRopeKnife = 'bandit_red_rope_knife';
const redRopeChief = 'bandit_red_rope_chief';
const windDen = 'bandit_salt_cave_den';
const windWatch = 'bandit_salt_cave_watch';
const windBow = 'bandit_salt_cave_bow';
const windChief = 'bandit_salt_cave_chief';
const fordBell = 'bandit_ford_bell';
const saltBoots = 'bandit_salt_boots';
const netKeeper = 'bandit_net_keeper';
const saltCarrier = 'bandit_salt_carrier';

const crews = {
  [greyGully]: { name: '灰沟坡寨', members: [16, 12, 8, 5, 4, 2, 0, 0, 0], den,
    headquarters: { region: 'screen_slope', name: '灰沟坡寨' } },
  ferryHills: { name: '吊桥边的搬木帮', members: [16, 14, 10, 0, 0, 0, 0, 0, 0],
    headquarters: { region: 'pine_ridge', name: '断桥下的挡雨棚' }, recruit: { delay: 16, interval: 6 } },
  quarryTracks: { name: '旧矿道的散伙矿客', members: [2, 2, 3, 4, 5, 5, 10, 8, 5],
    headquarters: { region: 'black_mine', name: '废绞车后屋' } },
  ferryWood: { name: '浅水红绳帮', members: [10, 10, 7, 5, 4, 3, 2, 1, 0], den: redRopeDen,
    headquarters: { region: 'glass_bank', name: '芦湾棚船' } },
  reedBank: { name: '青埂芦窝的伙计', members: [13, 11, 8, 6, 3, 1, 0, 0, 0],
    headquarters: { region: 'green_dyke', name: '青埂北面的堆草房' } },
  weirReef: { name: '断堰捆船帮', members: [6, 7, 7, 7, 6, 5, 4, 3, 2],
    headquarters: { region: 'burnt_weir', name: '堰柱上的旧守水屋' } },
  windBridge: { name: '盐路背风帮', members: [10, 9, 9, 8, 6, 5, 3, 2, 1], den: windDen,
    headquarters: { region: 'dry_sound_bridge', name: '断磴盐窟' } },
  glassRidge: { name: '落琉洼的黑篷客', members: [0, 0, 0, 0, 0, 0, 6, 5, 3],
    headquarters: { region: 'glass_hail_sink', name: '暗晶壁下的黑篷' }, recruit: { delay: 26, interval: 11 } },
  tentDunes: { name: '断帐沟的过夜客', members: [19, 15, 10, 0, 0, 0, 0, 0, 0],
    headquarters: { region: 'silk_tent_road', name: '旧帐道的背风窝棚' } },
};

const crewRoads = {
  [greyGully]: [
    ['ridge', 'screen_slope', 0.16, '往晒盘坡的矿道收窄，矮石墙后常有人拦车。'],
    ['screen_slope', 'herb_basin', 0.17, '去药谷的坡道经过两处废棚。挑担人近来都绕着走。'],
    ['ridge', 'kiln_valley', 0.11, '矿车平日从老窑墙下走。有人搬了几块大石，把能过车的路收成了一道窄缝。'],
    ['kiln_valley', 'herb_basin', 0.16, '两间废窑后墙之间是条窄道，车夫说有人在那里查过粮袋。'],
    ['herb_basin', 'black_mine', 0.14, '废矿道绕过旧草棚。近来连卖草药的人都在棚外被截住过。'],
  ],
  ferryHills: [
    ['pine_ridge', 'kiln_valley', 0.050, '林脚这边松枝太密，从路上看不见坡底。'],
    ['kiln_valley', 'snow_pass', 0.055, '上雪关的石阶边有一处废木亭，常有人躲在背风一面。'],
  ],
  quarryTracks: [
    ['ridge', 'black_mine', 0.028, '废矿车正挡在矿脊便道的一处拐角。'],
    ['black_mine', 'snow_pass', 0.024, '越过裸岩后风大，背石的那侧有人走过的痕迹。'],
  ],
  ferryWood: [
    ['flood_market', 'glass_bank', 0.033, '碎琉璃滩外有一道简陋的横杆，水上看不清谁在守。'],
    ['flood_market', 'crane_granary', 0.023, '粮仓的后路绕过一排平日没人看的空高脚屋。'],
    ['crane_granary', 'glass_bank', 0.028, '枯芦把下岸的路挤成一条单行窄道。'],
  ],
  reedBank: [
    ['green_dyke', 'old_marker', 0.021, '堤下水浅，夹布的空篮卡在半截矮桩上。'],
    ['old_marker', 'scale_bog', 0.026, '石碑后的踏石藏在苇丛里，水线旁有磨断的船缆。'],
    ['frog_pond', 'scale_bog', 0.032, '苔堤狭长，沿线有几处能从泥滩绕到身后。'],
  ],
  weirReef: [
    ['charcoal_ridge', 'night_pit', 0.037, '伏火坑一侧没灯，低处的绳桩像是近来才打上去的。'],
    ['glass_bank', 'beacon_reefs', 0.032, '浅岸边的破船壳一直卡在两块礁中间。'],
    ['zhao_hermit', 'burnt_weir', 0.030, '驿墙外的缺口正对内堰。这几日有人搬了两条旧凳，在坡下候着。'],
    ['rope_sands', 'burnt_weir', 0.034, '沙路越过几根拴索的木桩，堰脚还有一排断柱。'],
    ['burnt_weir', 'beacon_reefs', 0.042, '内堰到外礁的岸坎下捆过货箱，沙里还埋着新断的绳。'],
  ],
  windBridge: [
    ['salt_ledger_barrows', 'stillwell_mouth', 0.027, '背阴的盐袋架旁有两道窄脚印。'],
    ['salt_ledger_barrows', 'chalk_hoof_trail', 0.025, '过山的白石道绕过一层风积沙，旁边有歇过脚的痕迹。'],
    ['stillwell_mouth', 'dry_sound_bridge', 0.027, '盐井外拴着运货绳，绳后有一面裂开的石墙。'],
    ['wind_slate', 'dry_sound_bridge', 0.033, '石板夹出的路一直通到桥肩，最窄处不好回身。'],
    ['dry_sound_bridge', 'cold_kiln', 0.046, '冷窑坡下那几个雨棚，近日有人重新补了草帘。'],
    ['wind_slate', 'hanging_vein', 0.024, '矿梁下低处背风，几块石板遮得住一个蹲着的人。'],
    ['stillwell_mouth', 'wind_slate', 0.024, '石壁下的背风处能看见几堆刚压灭的柴火。'],
  ],
  glassRidge: [
    ['cold_kiln', 'glass_hail_sink', 0.028, '窑道被砂流冲出几道浅岔口，地面没有新路牌。'],
    ['hanging_vein', 'glass_hail_sink', 0.031, '浅梁下的矿包曾有人打开过，麻绳留在石上。'],
  ],
  tentDunes: [
    ['guest_mill', 'camel_grass_dunes', 0.025, '石磨南面的沙坡有几堆没刮平的炭灰，入夜后还冒着一点烟。'],
    ['silk_tent_road', 'guest_mill', 0.028, '石磨上游的低沟能一直绕到路旁。'],
  ],
};

const roads = Object.entries(crewRoads).flatMap(([crew, routes]) =>
  routes.map(([a, b, chance, riskText]) => ({ a, b, crew, chance, riskText })));

const gearRolls = (entries) => entries.map(([id, weight]) => ({ id, weight }));
const pool = (tier, index, fee, cash, richChance, richCash, gear, richGear) => ({
  tier, enemy: commonEnemies[index].id, fee, cash, richChance, richCash,
  gear: gearRolls(gear), richGear: gearRolls(richGear),
});

const pools = [
  pool(0, 0, [2, 4], [0, 3], 0.045, [4, 7],
    [['knife', 4], ['straw_cape', 3], ['reed_hat', 2], ['leather_knuckles', 1]],
    [['hide_shield', 3], ['short_spear', 1]]),
  pool(1, 1, [4, 6], [1, 4], 0.05, [5, 9],
    [['short_spear', 4], ['hide_coat', 3], ['reed_boots', 2], ['hide_shield', 1]],
    [['iron_coat', 3], ['resin_staff', 1]]),
  pool(2, 2, [6, 8], [2, 5], 0.055, [6, 11],
    [['reed_bow', 4], ['hide_coat', 3], ['breath_belt', 2], ['side_hook', 1]],
    [['pine_bow', 3], ['frost_robe', 2], ['black_crossbow', 1]]),
  pool(3, 3, [9, 11], [3, 7], 0.055, [9, 14],
    [['iron_sword', 4], ['iron_coat', 3], ['tide_charm', 2], ['resin_staff', 1]],
    [['weir_knife', 3], ['sky_cloak', 2], ['sky_sword', 1]]),
  pool(4, 4, [11, 13], [4, 9], 0.06, [11, 17],
    [['tide_spear', 4], ['tide_coat', 3], ['side_hook', 2], ['breath_belt', 1]],
    [['coil_pole', 3], ['gauze_armor', 2], ['echo_knuckles', 1]]),
  pool(5, 5, [13, 15], [5, 11], 0.065, [13, 20],
    [['hide_shield', 4], ['iron_coat', 3], ['tide_coat', 2], ['iron_sword', 1]],
    [['gauze_armor', 3], ['coal_tassel', 2], ['foil_sword', 1]]),
  pool(6, 6, [16, 18], [6, 13], 0.065, [17, 23],
    [['iron_sword', 4], ['frost_robe', 3], ['tide_charm', 2], ['sky_sword', 1]],
    [['foil_sword', 3], ['coal_tassel', 2], ['fault_coat', 1]]),
  pool(7, 7, [18, 21], [7, 15], 0.07, [19, 27],
    [['black_crossbow', 4], ['breath_belt', 3], ['frost_robe', 2], ['pine_bow', 1]],
    [['lake_bow', 3], ['jade_pendant', 2], ['fault_coat', 1]]),
  pool(8, 8, [21, 24], [8, 17], 0.075, [20, 30],
    [['snow_halberd', 4], ['coil_pole', 3], ['tide_coat', 2], ['sky_cloak', 1]],
    [['foil_sword', 3], ['gauze_armor', 2], ['fault_coat', 1]]),
];

const specialEnemies = [
  roadEnemy('road_slate_boss', '灰褂拦路人', 1, 35, 9, 3, 14, 'duelist',
    '他左脚踩着板车边沿，右手提一把薄刃刀。左臂缠着一圈布，血已经渗了出来。',
    [cut('用右手带刀横削'), cover('将刀收到伤臂旁边'), slam('借车沿蹬出一刀', 1.43), evade('贴着车侧让开')], 0.05),
  roadEnemy('road_ferry_tollman', '系红绳的篙手', 3, 55, 12, 4, 20, 'predator',
    '草鞋浸透了水，手上仍稳。等篙脚一松，他就有地方从横杆旁扎出一篙。',
    [cut('傍石斜刺一篙'), slam('抬高篙尾扫下来', 1.55), cover('退守横杆背面')], 0.06),
  roadEnemy('road_wind_cutman', '拨桥扣的刀客', 5, 73, 16, 7, 25, 'schemer',
    '正面看去只露出一段刀柄。等桥扣晃响，他会借着响动从遮风石旁露刀。',
    [cut('趁铜扣响时出刀'), cover('闪回石板阴影'), slam('退半步扬腕劈下', 1.58), evade('沿风板迅速让开')], 0.1),
  { ...roadEnemy(scout, '外寨哨兵', 1, 33, 9, 3, 13, 'predator',
    '短矛靠在哨绳旁。他出手前总看向沟口，像在等接班的人。腰绳上有个装饼的油纸袋。',
    [cut('矛尖挑向鞋头'), slam('借高坎扎出一矛', 1.45), cover('把矛柄竖在胸前')]),
    chanceLoot: { ration: { count: 1, chance: 0.34 } } },
  { ...roadEnemy(sentry, '巡寨刀客', 2, 43, 11, 4, 16, 'bulwark',
    '他握刀的那只手戴着铁护腕，另一边挂着个沾了松脂的布袋。刀一压低，铁护腕便迎向你的手腕。',
    [cut('抬起铁护腕，撞向你的手腕'), cover('举袖护住半身'), slam('架开来手后重劈', 1.57)]),
    chanceLoot: { salve: { count: 1, chance: 0.23 } } },
  { ...roadEnemy(bodyguard, '黑巾近卫', 3, 54, 12, 5, 18, 'duelist',
    '这一队都在左臂系黑巾，平日替许涧看里屋。他用带裂口的厚刀从货架之间逼近。腰袋上露着一截留来补刀的寒铁。',
    [cut('压低刀刃扫向膝下'), cover('横刀护住胸腹'), slam('踩近一步，扬刀重劈', 1.54)]),
    chanceLoot: { ore: { count: 1, chance: 0.28 } } },
  { ...roadEnemy(leader, '灰沟贼王许涧', 3, 76, 14, 6, 22, 'schemer',
    '许涧平时隔着长桌点货，出刀也紧贴桌角。见他将空凳拨到身前，先留心凳脚后扬起的刀。',
    [cut('贴着桌沿递刀'), cover('贴住桌角，以刀护身'),
      { kind: 'focus', name: '把空凳拨到身前，藏刀攒劲' },
      slam('踢开木凳，跟着一刀斩下', 1.56), cut('绕过桌角横扫腰侧', 1.1)]),
    accuracy: 0.07, medicine: { id: 'heal_pill', count: 1 } },
  roadEnemy(redRopeWatch, '芦湾放哨人', 2, 41, 10, 3, 16, 'predator',
    '他坐在篙头旁，手里还拎着没点着的灯。见船板一晃，就抓起身边的短矛。',
    [cut('贴船板出矛'), cover('收矛护住胸口'), slam('踏稳船板直刺', 1.45)]),
  { ...roadEnemy(redRopeKnife, '红绳把头', 3, 53, 12, 4, 20, 'duelist',
    '两根红绳系在肘后。他先用刀背拨开垂网，给自己腾出半边身子。',
    [cut('贴着网边削腕'), cover('横刀退到篷柱边'), evade('贴柱错身'), slam('顺柱跨一步劈下', 1.5)]), dodge: 0.11 },
  { ...roadEnemy(redRopeChief, '芦湾船主邵苹', 4, 79, 15, 6, 24, 'bulwark',
    '棚里的人先看向掌舵处。那里站着个穿厚油衣的女人，刀柄贴住前臂，袖里缝着一只窄药袋。',
    [cut('沿船舷斜削'), cover('借立柱护住手臂', 1.48), slam('抵住舱沿猛劈', 1.59), evade('侧身退到舱口')], 0.06),
    medicine: { id: 'heal_pill', count: 1 } },
  roadEnemy(windWatch, '盐窟守门刀客', 4, 63, 14, 5, 22, 'duelist',
    '刀鞘挂在窟壁上。他弯腰从盐袋间挤出来，刀一直压在腰下。',
    [cut('低刀扫向脚踝'), cover('贴墙护住一侧'), slam('近身抬刀斩下', 1.55), evade('闪到旧盐袋后')]),
  { ...roadEnemy(windBow, '盐道灰翎弓手', 5, 64, 15, 4, 25, 'schemer',
    '矮墙上排着两盏灭了的灯。弓手屈膝躲在暗处，箭羽几乎贴着砖沿。',
    [shoot('从矮墙后放箭'), cover('蹲回墙后'), { ...slam('踩上砖沿射出重箭'), ranged: true }, evade('退进侧洞')]),
    accuracy: 0.15 },
  { ...roadEnemy(windChief, '盐窟魁首封霁', 6, 92, 18, 7, 29, 'schemer',
    '石凳上摆着一双厚软底靴。封霁站在另一头，剑还藏在披风下，先将一枚药丸扣在腰间布囊里。',
    [cut('贴身递剑'), cover('以披风遮住手臂'), { kind: 'focus', name: '收剑到披风后蓄力' },
      slam('从披风后斜挑一剑', 1.6), evade('错步退进石隙')], 0.06),
    medicine: { id: 'tide_pill', count: 1 }, accuracy: 0.08 },
];

const fixed = [
  {
    id: 'road_slate_peg', a: 'ridge', b: 'screen_slope', crew: greyGully, forceAt: 3,
    enemy: 'road_slate_boss', chance: 0.6, fee: 5,
    intro: '一辆板车横在碎石路上。灰褂人踢紧轮下的木楔，左臂缠的布已洇红。他横过短刀，刀背敲了敲车板。「五枚。搁这儿。」',
    nonThreatIntro: '一辆板车横在碎石路上。灰褂人抬眼看你，拇指已经顶开刀鞘，停了一停，又将刀按了回去。「借过。车轮卡了。」他试着抬车，缠布的左手使不上力。',
    nonThreatActions: [{ id: 'ask_cart_road', label: '扶起车头，问他这车要往哪儿送',
      desc: '车底压住了一块货牌，半边露着朱印。', revealSite: den,
      outcome: '你扶住车。他拔出轮下的木楔，把车推到路边，拾起货牌攥在手里。「我等人来交车，人没来。你若上晒盘坡，别跟车辙走。」见你还在看那枚印，他拿鞋尖在砂里划了两道。「旧筛子后面是灰沟。过了扣木盆的矮栅，就是截货那伙人的寨子。」' }],
    afterPay: { revealSite: den,
      outcome: '他扣紧车槽里的小匣，俯身抽出压轮的木楔。车挪开时，你看清车尾挂着一块送货牌，上面烙着「晒盘坡，旧筛后灰沟」。他顺着你的目光看了一眼。「见了倒扣的木盆就回头，那是里头的哨。」' },
    afterWin: {
      intro: '短刀落在前轮外侧。他扶着轮辐想去捡，左臂一软，人又坐了下去。车篷也在交手时扯开，底下叠着几块有姓名的货牌。灰褂人看见你望过去，低声道：「我只管车。等他们来取钱，咱俩都走不了。」',
      actions: [
        { id: 'spare_slate_robber', label: '踢开短刀，问清谁来收钱，再放他走',
          desc: '他看了一眼来路，把右手从刀旁收了回来。', revealSite: den,
          outcome: '你把刀踢到路旁。他从货牌里挑出一块刻着许字的，搁在前轮边。「许涧叫我守到天黑。数目差了一单，他就拿车棍补在我身上。」他用指甲刮开牌上干泥，露出一行小字。「晒盘坡，旧筛子后头那条灰沟。木盆倒扣的地方进去。」车还横着，他没去扶，按着左臂下了坡。' },
        { id: 'kill_slate_robber', label: '了结灰褂人',
          desc: '他的手停在前轮旁，短刀还差半臂远。', loot: { ration: 1 }, revealSite: den,
          outcome: '灰褂人倒在前轮旁。你从篷下翻出一包干粮、一张抄过数目的送货图。图上标着晒盘坡旧筛盘、灰沟和倒扣的木盆，旁边押着一个许字。两张别家的货牌还背面朝上，等着记账。' },
      ],
    },
  },
  {
    id: 'road_reed_tariff', a: 'flood_market', b: 'glass_bank', crew: 'ferryWood', enemy: 'road_ferry_tollman', chance: 0.52, fee: 8,
    intro: '拦水的横杆浮过来，后头接着一根泡裂的浮木。一个脚踝系红绳的篙手立在浅石上，说过杆交八枚钱。杆后有两艘等着靠岸的船。',
    actions: [{ id: 'repair_raft_bar', label: '给两截松木，帮他接住脱开的浮杆',
      desc: '横杆是旧榫，用两截结实的木头平撑住，船就不必一直停在急水边。', need: { wood: 2 },
      loot: { ration: 1 }, revealSite: redRopeDen, outcome: '篙手接住你递下的松木，赶紧去拢船。等船的人塞给你一包干粮，低声道：「真正扣我货的船藏在碎琉璃滩。沿晒网往下走，芦苇里吊着一盏白壳灯。」' }],
    afterPay: { revealSite: redRopeDen, outcome: '篙手把横杆朝旧桩一挂。你从两条并拢的船旁走过，船客压低声说：「我家的货被扣在碎琉璃滩的芦湾，认晒网下头那盏白壳灯。」' },
    afterWin: { loot: { ration: 1, wood: 1 }, revealSite: redRopeDen,
      outcome: '篙手松开红绳，从侧边浅滩游开。船客解开两条船，又把压在舱底的托货单递给你。背面的兑货地写着：碎琉璃滩，晒网下走三十步，认白壳灯。' },
  },
  {
    id: 'road_coil_rope', a: 'wind_slate', b: 'dry_sound_bridge', crew: 'windBridge', enemy: 'road_wind_cutman', chance: 0.48,
    intro: '桥肩的半扇栏动了一下。一人背靠石板握着刀，脚边摆着一只松脱的铜扣。他一只肩朝着桥中，鞋底沿着石缝蹭来蹭去。',
    actions: [{ id: 'pass_spare_tie', label: '递给他两份坚韧兽筋，帮他系回栏扣',
      desc: '他压低刀柄，「那根旧绳已经磨进铜眼。我只要两根新绳，叫它今晚别掉下去。」', need: { battle_sinew: 2 },
      loot: { ore: 1 }, revealSite: windDen, outcome: '栏杆终于不晃了。他递来拆下的寒铁补片，又朝桥下努嘴。「抢盐的傍晚就顺这道石梯回去。走到断处，右手有块竖起的白石，后头是他们藏货的门。」' }],
    afterWin: { loot: { ore: 1, salve: 1 }, revealSite: windDen,
      outcome: '他弃下松扣，沿桥肩的石梯下去。你望见他走到断阶，绕进一块竖白石后。石缝里透出灯光，远远传来数盐袋的声音。扣边另有一截好铁和一罐补手药膏。' },
  },
];

const resident = (start, interval = 0) => ({ start, cap: start, interval, growth: interval > 0 ? 1 : 0,
  fixedPopulation: true, ...(interval > 0 ? { depletedFactor: 1 } : {}) });
const sites = [
  { id: roadsideCart, name: '矿道歇车处', region: 'ridge' },
  { id: den, name: '灰沟坡寨', region: 'screen_slope', afterBandit: den, once: [1, 2, 3, 4],
    creatures: { [scout]: resident(8, 28), [sentry]: resident(8, 32), [bodyguard]: resident(6, 36), [leader]: resident(1) },
    creatureText: {
      [scout]: { present: '外栅的哨绳轻轻抖动，灰沟深处传来短矛碰石的声音。', absent: '栅外哨绳垂在地上，站在灰沟能看见棚门。' },
      [sentry]: { present: '棚里有几道火光，门前的平石上有护腕撞过的新痕。', absent: '棚门已经推开，露出后头搭了木架的货廊。' },
      [bodyguard]: { present: '从里屋出来的人左臂都系着黑巾。两名巡寨的刀客一见他们就往墙边让。', absent: '里屋外的黑巾近卫已经退开，门边剩下一道新刀痕。' },
      [leader]: { present: '长桌旁有只空凳常被踢开。棚里时不时有人高声喊「许爷」。', absent: '桌前横着一条断凳腿，棚里再没人喊许爷。' },
    },
    afterWinText: {
      [leader]: '许涧倒下后，没散的人退到前棚。巡山人绕至货廊背坡，把一块宽木板搭在沟上。从那块板能直接接到柜边，和前棚隔着一堵墙。',
    },
    afterOnceText: {
      1: '外栅边那只倒扣的木盆还在。绕到背坡，还能看见巡山人搭过木板的两道压痕。',
      2: '先前跟巡山人下去的伤号已经离开。墙根还压着他们解下的旧哨绳。',
    },
    choiceText: { 1: { after: '货柜和钱匣早已搬下山。廊下那几块方方的柜脚印里落了新砂。' } },
  },
  { id: netKeeper, name: '收晒网的船家', region: 'glass_bank', once: [0],
    afterOnceText: { 0: '船家把好网收在肩上。空竹杆仍斜指下游的芦湾。' } },
  { id: redRopeDen, name: '芦湾棚船', region: 'glass_bank', afterBandit: redRopeDen,
    afterChoices: [`${netKeeper}:0`], once: [1],
    creatures: { [redRopeWatch]: resident(9, 28), [redRopeKnife]: resident(8, 32), [redRopeChief]: resident(1) },
    afterWinText: { [redRopeChief]: '带红绳的人从晒网后散开。邵苹身后的主舱已空出通道，案上压着收钱的铜匣。' },
    choiceText: { 1: { after: '主舱的匣子已经拿去验过，桌上只留着几捆写了主人的旧网。' } } },
  { id: saltCarrier, name: '桥头的盐车', region: 'dry_sound_bridge', once: [0],
    afterOnceText: { 0: '盐车已经走了，桥栏下还挂着一小段拴车的草绳。' } },
  { id: windDen, name: '断磴盐窟', region: 'dry_sound_bridge', afterBandit: windDen,
    afterChoices: [`${saltCarrier}:0`], once: [1],
    creatures: { [windWatch]: resident(10, 32), [windBow]: resident(9, 36), [windChief]: resident(1) },
    afterWinText: { [windChief]: '封霁倒下后，外洞的人拖走灯架。最深的货室里还有一盏小油灯亮着。' },
    choiceText: { 1: { after: '盐商领走了标过记号的货。货室里堆着空袋，封霁的石凳还在原处。' } } },
];

const events = [
  { id: roadsideCart, name: '矿道歇车处',
    text: '去晒盘坡的旧矿道在这儿分出去。木车停在弯里，车夫正用旧布缠刀鞘，生怕那块铜包角露出来。',
    choices: [
      { label: '问他为何把刀鞘缠起来', days: 0, stay: true,
        outcome: '车夫把布结塞进腰带。「往晒盘坡的路上，有人见你甲好、刀好，就去叫能压得住你的来。上回我只带这口旧刀，给两截好松木，也就过去了。」他伸手指了指山下。「往渡口还有人巡。要走山里，先想好回来走哪条。」' },
    ],
  },
  { id: den, name: '灰沟坡寨', text: '旧筛盘后的灰沟绕到半人高的外栅，栅脚倒扣着一只木盆。棚门和货架都朝着中间的空地，寨里的人来回从这儿过。',
    choices: [
      { label: '翻过外栅，走进寨里的空地', desc: '站在外栅只能看见棚顶和货架，看不清是谁先走出来。', days: 0.25,
        encounter: denResidents, outcome: '你踩到栅内的平地。有人回身抄起兵器，迎上来堵住去路。' },
      { label: '从背坡拖出货柜，清点许涧留下的东西', afterFight: leader, days: 0.375, stay: true, coins: 180,
        desc: '巡山人先用绳拴住柜脚，才敢沿宽板挪它。柜上摆着许涧的宽背刀，夹层里压着一只铁匣。',
        loot: { ration: 4, ore: 6, core: 3, hide: 2, [kingBlade]: 1, [sleeve]: 1 },
        outcome: '巡山人取柜上的货牌，让矿户各自领回自家的东西。余下的一百八十枚灵钱、干粮、料件和许涧的宽背刀都交给你。柜脚还垫着一本发黄的护车谱，来领货的车夫认出是走山路的人互相传抄的，也递给了你。' },
      { label: '给伤号留一包干粮，叫他们下坡见巡山人', afterFight: leader, days: 0.25, stay: true,
        need: { ration: 1 }, consume: true,
        desc: '两个人扶着背坡的墙，没往前棚走。巡山人肯从外头接他们。',
        outcome: '伤号交出换哨的细绳，拿着干粮沿背坡下去。巡山人在宽板外接住他们。' },
      { label: '查看外栅边的粮袋', desc: '有人把敞口粮袋放在外栅旁的石墩上，伸手就够。', days: 0.125, stay: true,
        loot: { ration: 3 }, outcome: '你把粮袋提到石墩背面，取出三包没启封的干粮。' },
      { label: '把棚门边的药匣拎出来', afterFight: sentry,
        desc: '方才退进棚的刀手撞开门扇，门边露出一只小木匣，匣盖上还压着片干药渣。', days: 0.125, stay: true,
        loot: { salve: 2 }, outcome: '门边没人伸手。你用脚把药匣勾出来，拣了两包干净的松脂膏。' },
    ],
  },
  { id: netKeeper, name: '收晒网的船家',
    text: '船家从晒到一半的网上抻出一截红绳，几处断口齐得像是用刀割的。',
    choices: [{ label: '问船家网是在哪儿割破的', desc: '他刚往下水的竹杆上晾好一张新网。',
      days: 0.125, stay: true,
      outcome: '「下游一盏白壳灯过去，那条棚船就拴在芦里。他们砍我的网堵水，我记得板缝怎么走。」他拿空竹杆朝芦湾指了一遍。' }] },
  { id: redRopeDen, name: '芦湾棚船',
    text: '芦苇里的白壳灯照着两条并在一起的棚船。中间搭了块木板，前棚挂网，后舱紧靠掌舵的地方。',
    choices: [
      { label: '踩上木板，进前棚', desc: '木板会晃，棚里听得见人说话。', days: 0.25,
        encounter: [redRopeWatch, redRopeKnife, redRopeChief], outcome: '板子擦过船舷。前棚的网掀起来，有人拦在你面前。' },
      { label: '进后舱清点铜匣', afterFight: redRopeChief, days: 0.25, stay: true, coins: 145,
        desc: '邵苹放钱的铜匣还开着，旁边一枚包布铜铃压住了船家的货单。',
        loot: { ore: 4, hide: 3, [fordBell]: 1 },
        outcome: '按货单交还鱼网和铜扣后，船家留下匣中找不到主人的灵钱。他把邵苹常挂在舵边的包布铃递给你。' },
    ] },
  { id: saltCarrier, name: '桥头的盐车',
    text: '盐车在桥栏边歇着，半边车板空了。车夫拿着一根割断的系货绳。',
    choices: [{ label: '问车夫盐货丢在了哪里', desc: '车夫一直往桥下的断石梯看。',
      days: 0.125, stay: true,
      outcome: '「他们把货拖到了桥底，走断石梯。阶断的那儿右手立着白石。我的车下不去，就听见石后头有人叫开门。」' }] },
  { id: windDen, name: '断磴盐窟',
    text: '桥下的石阶断在一块竖起的白石旁。躬身能从后头钻进去，洞口堆着把风吹开的空盐袋。',
    choices: [
      { label: '钻过白石，往盐袋后走', desc: '鞋一踩上盐粒就会响，外洞有一道半人高的矮墙。',
        days: 0.25, encounter: [windWatch, windBow, windChief], outcome: '你踩碎脚下的盐壳。矮墙后有人应声拿起兵器。' },
      { label: '去亮着灯的货室开柜', afterFight: windChief, days: 0.375, stay: true, coins: 240,
        desc: '货柜底层有一只钱袋，封霁的靴子还放在石凳边。',
        loot: { black_iron: 3, core: 5, [saltBoots]: 1 },
        outcome: '照车板上的货号分还盐包后，车夫把余钱和石凳边的靴子给你。没记号的几块料也留在柜里。' },
    ] },
];

const items = [
  { id: sleeve, name: '守车短袖诀', kind: 'manual', price: 0, sell: 0, keepOnFall: true, oneOfAKind: true,
    desc: '走山路的人互相传抄的护车薄册。封面抹了层油，翻开能看见几笔怎样在车与崖壁之间收刀的画。' },
  { id: kingBlade, name: '许涧的宽背刀', kind: 'gear', price: 0, sell: 33, keepOnFall: true, oneOfAKind: true,
    desc: '刀背厚，刀尖收得窄。前半截磨得雪亮，靠护手那段却全是长年蹭在木头上的细痕。' },
  { id: fordBell, name: '裹布铜铃', kind: 'gear', price: 0, sell: 26, keepOnFall: true, oneOfAKind: true,
    desc: '邵苹挂在舵边的铜铃，裹着两层厚布，听得清近处脚步。' },
  { id: saltBoots, name: '厚底踏砂靴', kind: 'gear', price: 0, sell: 44, keepOnFall: true, oneOfAKind: true,
    desc: '封霁常穿的软底靴，靴筒扎得紧，踩过薄盐壳也很少响。' },
];

const gear = [
  { id: kingBlade, slot: 'weapon', weaponClass: 'blade', tier: 3, atk: 7, perception: 3, retreat: 0.10, durability: 52, repair: 12,
    trait: { kind: 'accuracy', bonus: 0.12 }, traits: [{ kind: 'pierce', intent: 'guard', bonus: 2 }],
    entry: '筑基初期可用的宽背刀。对手侧步，刀尖跟得上。对手收招防守，刀也能顺隙刺入。看准空当，收刀脱身也利索。' },
  { id: fordBell, slot: 'charm', tier: 3, def: 2, qi: 3, perception: 4, durability: 48, repair: 12,
    entry: '筑基初期可佩。铃穗能随风和脚步声轻颤，交手时更容易看准对手的动作，也能稍稍护身。' },
  { id: saltBoots, slot: 'boots', tier: 5, def: 1, retreat: 0.10, durability: 58, repair: 17,
    trait: { kind: 'dodge', bonus: 0.12 },
    entry: '筑基后期可穿。进退时脚下更轻，既便于闪身，也能让赶路的动静小一些。' },
];

const innerStyles = [
  {
    id: sleeve, name: '守车短袖诀', grade: '凡品', tier: 0, specialty: ['blade'],
    desc: '早年走车的人在窄路上护身的法子。先用半边袖口收住手腕，免得交手时挡了自己的退路。',
    ranks: [
      { base: { retreat: 0.05 }, focus: { atk: 1, guard: 1 }, effect: '趁对手收招时更容易抽身，出刀还能顺势护住手臂。' },
      { tier: 1, cost: 12, days: 0.75, need: { hide: 2, reed: 2 },
        base: { retreat: 0.075, perception: 1 }, focus: { atk: 1, guard: 2 },
        effect: '能稍早觉出对手起手，等他露出空当时更能把握抽身机会。用刀时也更能护住手臂。' },
      { tier: 3, cost: 30, days: 1.5, need: { ore: 3, hide: 4, battle_sinew: 2 },
        base: { retreat: 0.11, perception: 2 }, focus: { atk: 2, guard: 2 },
        effect: '近身出刀更有力。看准对手收招的空当，抽身也更有把握。' },
    ],
  },
];

export const banditContent = {
  items, gear, sites, events, enemies: [...commonEnemies, ...specialEnemies], innerStyles,
  roadBandits: { roads, pools, fixed, crews, dens: {
    [den]: { heads: 23, minFactor: 0.13, boss: leader },
    [redRopeDen]: { heads: 18, minFactor: 0.18, boss: redRopeChief },
    [windDen]: { heads: 20, minFactor: 0.16, boss: windChief },
  } },
};
