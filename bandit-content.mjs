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
  { ...roadEnemy('road_knife_runner', '灰帕短刀客', 0, 24, 7, 2, 11, 'duelist',
    '灰布沿刀柄缠了几圈。出刀时他先把脚收回来，见人没有追才会再试一步。',
    [cut('收脚平削'), cover('把短刀横在胸前'), slam('突然翻腕劈下', 1.4), evade('一个错步让开')], 0.1),
    roadIntro: '前面那人系紧刀柄上的灰布，往路当中一站。「留几枚钱，我让你过去。」' },
  { ...roadEnemy('road_spear_taker', '磨杆短矛手', 1, 32, 9, 3, 13, 'predator',
    '矛杆有两处被手磨得发亮。他双手向后挪时，就要迎面刺过来。',
    [cut('短矛推向肩头'), slam('跨步直刺', 1.45), cover('拽回矛杆挡身')]),
    roadIntro: '右边伸出一根短矛，矛尖离你还有半步。握矛的人用杆尾敲了敲地。「钱放脚边。」' },
  { ...roadEnemy('road_bow_robber', '绳肩劫弓手', 2, 38, 10, 3, 15, 'duelist',
    '弓把有一道用麻绳缠好的裂口。把箭搭在弓弦上时，他还望着你脚下的位置。',
    [shoot('朝脚边试一箭'), cover('退开半步，举弓护身'), { ...slam('搭硬箭射来', 1.45), ranged: true }, evade('贴着树身往侧面一闪')], 0.11),
    accuracy: 0.09,
    roadIntro: '路旁传来一声轻响，那人已经把箭搭上弦。「站住。要过路，先掏钱。」' },
  { ...roadEnemy('road_salt_cutter', '盐袋刀手', 3, 51, 12, 5, 19, 'duelist',
    '他把旧盐袋折厚垫在左肩，刀顺着衣摆拖，手上没有多余的动作。',
    [cut('平刀抵到臂侧'), cover('以厚肩偏开半步'), slam('反手提刀斩下')]),
    roadIntro: '垫着旧盐袋的人拦到面前。他右手拖刀，左手把一个空布袋抖开，示意你把钱丢进去。' },
  { ...roadEnemy('road_piked_guard', '绳鞘钩枪客', 4, 61, 14, 5, 21, 'predator',
    '枪尖下有个收绳的钩，脚步很稳。枪从身后抬高时，横着也够得远。',
    [cut('贴杆扎向腰侧'), slam('倒握枪杆横扫', 1.5), cover('把枪身架在眼前')]),
    roadIntro: '有人提着钩枪转到路上，把枪横了过来。「给几枚钱，我也好把这杆枪放下。」' },
  { ...roadEnemy('road_shield_broker', '旧甲劫货人', 5, 71, 15, 6, 24, 'bulwark',
    '成排的甲片有好几块是从别处补来的。每次换手，盾沿总朝着可能出招的那边。',
    [cut('沿盾边探刀'), cover('并手稳住盾面', 1.45), slam('提盾压肩后下刀', 1.47)], 0.05),
    medicine: { id: 'heal_pill', count: 1 },
    roadIntro: '路边那人站直，身上的几处补甲撞得一响。他把盾往脚边一立。「走这里得交钱。」' },
  { ...roadEnemy('road_wind_swordsman', '避风劫剑客', 6, 75, 18, 6, 27, 'duelist',
    '他将披风束在背后，剑已出鞘。剑尖一低，他便会从你让开的那一侧抢上一步。',
    [cut('递剑点向手肘'), cover('回剑守肋'), slam('贴身旋剑回斩', 1.54), evade('收剑错开一步')], 0.1),
    dodge: 0.14,
    roadIntro: '披风拢在剑客背后。他踏过来占住路心，剑尖虚悬，连靴底都没拖一下。「留钱。」' },
  { ...roadEnemy('road_black_bowist', '冷弦夺货人', 7, 87, 20, 7, 30, 'schemer',
    '弩搁在肩窝，搭着一支短箭。见你靠近，他便向旁让半步，把弩抬平。',
    [shoot('抬弩射出短箭'), cover('躲到石后拉紧弩弦'), { ...slam('扣动扳机，射出一支重箭', 1.55), ranged: true }], 0.09),
    accuracy: 0.19, medicine: { id: 'tide_pill', count: 1 },
    roadIntro: '你先望见一截箭尖，才看清旁边埋伏的人。他把弩托稳。「现钱搁下，不必往前走了。」' },
  { ...roadEnemy('road_sandal_halberd', '沉靴劫道客', 8, 104, 22, 9, 33, 'predator',
    '短靴裹了几层硬皮，一步踩下几乎没有声响。他把短戟立在身侧，尖刃只露出一截。',
    [cut('挑戟向膝下扫'), slam('沉肩挑起短戟', 1.62), cover('立戟压住地面', 1.5)]),
    roadIntro: '你没听到脚步，短戟已拦在路上。那人指了指你的行囊。「嫌耽搁，就把钱留下。」' },
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
    headquarters: { region: 'dry_sound_bridge', name: '断阶盐洞' } },
  glassRidge: { name: '落琉洼的黑篷客', members: [0, 0, 0, 0, 0, 0, 6, 5, 3],
    headquarters: { region: 'glass_hail_sink', name: '暗晶壁下的黑篷' }, recruit: { delay: 26, interval: 11 } },
  tentDunes: { name: '断帐沟的过夜客', members: [19, 15, 10, 0, 0, 0, 0, 0, 0],
    headquarters: { region: 'silk_tent_road', name: '旧帐道的背风窝棚' } },
};

const crewRoads = {
  [greyGully]: [
    ['ridge', 'screen_slope', 0.115, '往晒盘坡的矿道收窄，矮石墙后常有人拦车。'],
    ['screen_slope', 'herb_basin', 0.17, '去药谷的坡道经过两处废棚。挑担人近来都绕着走。'],
    ['ridge', 'kiln_valley', 0.075, '矿车平日从老窑墙下走。有人搬了几块大石，把能过车的路收成了一道窄缝。'],
    ['kiln_valley', 'herb_basin', 0.16, '两间废窑后墙之间是条窄道，车夫说有人在那里查过粮袋。'],
    ['herb_basin', 'black_mine', 0.14, '废矿道绕过旧草棚。近来连卖草药的人都在棚外被截住过。'],
  ],
  ferryHills: [
    ['pine_ridge', 'kiln_valley', 0.050, '林脚这边松枝太密，从路上看不见坡底。'],
    ['kiln_valley', 'snow_pass', 0.055, '上雪关的石阶边有一处废木亭，常有人躲在背风一面。'],
  ],
  quarryTracks: [
    ['ridge', 'black_mine', 0.028, '矿脊拐角搁着一辆废矿车，车后藏得住人。'],
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
  pool(3, 3, [13, 19], [8, 15], 0.055, [26, 42],
    [['iron_sword', 4], ['iron_coat', 3], ['tide_charm', 2], ['resin_staff', 1]],
    [['weir_knife', 3], ['sky_cloak', 2], ['sky_sword', 1]]),
  pool(4, 4, [18, 26], [12, 22], 0.06, [37, 58],
    [['tide_spear', 4], ['tide_coat', 3], ['side_hook', 2], ['breath_belt', 1]],
    [['coil_pole', 3], ['gauze_armor', 2], ['echo_knuckles', 1]]),
  pool(5, 5, [24, 34], [18, 30], 0.065, [49, 76],
    [['hide_shield', 4], ['iron_coat', 3], ['tide_coat', 2], ['iron_sword', 1]],
    [['gauze_armor', 3], ['coal_tassel', 2], ['foil_sword', 1]]),
  pool(6, 6, [35, 51], [27, 53], 0.065, [73, 118],
    [['iron_sword', 4], ['frost_robe', 3], ['tide_charm', 2], ['sky_sword', 1]],
    [['foil_sword', 3], ['coal_tassel', 2], ['fault_coat', 1]]),
  pool(7, 7, [47, 67], [37, 68], 0.07, [100, 162],
    [['black_crossbow', 4], ['breath_belt', 3], ['frost_robe', 2], ['pine_bow', 1]],
    [['lake_bow', 3], ['jade_pendant', 2], ['fault_coat', 1]]),
  pool(8, 8, [61, 85], [50, 88], 0.075, [136, 214],
    [['snow_halberd', 4], ['coil_pole', 3], ['tide_coat', 2], ['sky_cloak', 1]],
    [['foil_sword', 3], ['gauze_armor', 2], ['fault_coat', 1]]),
];

const specialEnemies = [
  roadEnemy('road_slate_boss', '灰褂拦路人', 1, 35, 9, 3, 14, 'duelist',
    '他左脚踩着板车边沿，右手提一把薄刃刀。左臂缠着一圈布，血已经渗了出来。',
    [cut('右手横刀削来'), cover('收刀护住左臂'), slam('蹬着车沿斜劈下来', 1.43), evade('贴着车侧让开')], 0.05),
  roadEnemy('road_ferry_tollman', '系红绳的篙手', 3, 55, 12, 4, 20, 'predator',
    '草鞋浸透了水，手上仍稳。等篙脚一松，他就有地方从横杆旁扎出一篙。',
    [cut('傍石斜刺一篙'), slam('抬高篙尾扫下来', 1.55), cover('退守横杆背面')], 0.06),
  roadEnemy('road_wind_cutman', '守桥的刀客', 5, 73, 16, 7, 25, 'schemer',
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
  roadEnemy(windWatch, '盐洞守门刀客', 4, 63, 14, 5, 22, 'duelist',
    '刀鞘挂在洞壁上。他弯腰从盐袋间挤出来，刀一直压在腰下。',
    [cut('低刀扫向脚踝'), cover('贴墙护住一侧'), slam('近身抬刀斩下', 1.55), evade('闪到旧盐袋后')]),
  { ...roadEnemy(windBow, '盐道灰翎弓手', 5, 64, 15, 4, 25, 'schemer',
    '矮墙上排着两盏灭了的灯。弓手屈膝躲在暗处，箭羽几乎贴着砖沿。',
    [shoot('从矮墙后放箭'), cover('蹲回墙后'), { ...slam('踩上砖沿射出重箭'), ranged: true }, evade('退进侧洞')]),
    accuracy: 0.15 },
  { ...roadEnemy(windChief, '盐洞首领封霁', 6, 92, 18, 7, 29, 'schemer',
    '封霁穿一双厚软底靴，落脚踏过一层盐壳，也听不见响。剑还藏在披风下，他先将一枚药丸扣在腰间布囊里。',
    [cut('贴身递剑'), cover('以披风遮住手臂'), { kind: 'focus', name: '收剑到披风后蓄力' },
      slam('从披风后斜挑一剑', 1.6), evade('错步退进石隙')], 0.06),
    medicine: { id: 'tide_pill', count: 1 }, accuracy: 0.08 },
];

const fixed = [
  {
    id: 'road_slate_peg', a: 'ridge', b: 'screen_slope', crew: greyGully, forceAt: 3,
    enemy: 'road_slate_boss', chance: 0.6, fee: 5,
    intro: '一辆板车横在碎石路上。灰褂人踢紧轮下的木楔，左臂缠的布已洇红。他横过短刀，刀背敲了敲车板。「五枚。搁这儿。」',
    crewIntro: '路窄处横着一辆板车。灰褂人左臂的布透了血，他用右手拔刀，刀背敲在车板上。「过去五枚。」',
    nonThreatIntro: '一辆板车斜卡在路上。灰褂人把短刀推出鞘半寸，抬眼见了你，又按了回去。「车轮卡住了。你沿车尾过吧。」他抬了一下车辕，伤臂没使上力。',
    nonThreatActions: [{ id: 'ask_cart_road', label: '扶起车头，问他这车要往哪儿送',
      desc: '车底压住了一块货牌，半边露着朱印。', revealSite: den,
      outcome: '你抬起车头。他拔掉木楔，把车推离车辙，俯身拾回货牌。「原先寄车在石桥边。许涧今早把人叫进寨，车也得送去。」他见你看那枚印，便用鞋尖在砂里划了一道弯。「晒盘坡，旧筛子背后有道灰沟。倒扣着木盆的矮栅就是寨门。离远点，他这几天什么车都截。」' }],
    afterPay: { revealSite: den,
      outcome: '他扣紧车槽里的小匣，俯身抽出压轮的木楔。车挪开时，你看清车尾挂着一块送货牌，上面烙着「晒盘坡，旧筛后灰沟」。他顺着你的目光看了一眼。「见了倒扣的木盆就回头，那是里头的哨。」' },
    afterWin: {
      intro: '短刀滚到前轮底下。灰褂人扶着轮辐，左臂一软，又坐了下去。扯开的车篷里露出几块货牌，上面都有姓名。他见你望过去，朝最后一块偏了偏头。「我认得截车的人。你要找他们，我开口。让我下山。」',
      actions: [
        { id: 'spare_slate_robber', label: '拨开短刀，问清寨门的位置后放他下山',
          desc: '他慢慢把右手从轮辐旁收了回来。', revealSite: den,
          outcome: '他从货牌里翻出一块盖了许字印的。「许涧叫我留在这里。晚饭前会有人来碰头，少了钱他就打断我这条胳膊。」他刮开牌上干泥，露出一行小字。「晒盘坡，旧筛子背后的灰沟。看到倒扣的木盆，矮栅就是寨门。」你掀开车轮下的木楔，把车挪到路边。他捂住伤臂，下了坡。' },
        { id: 'kill_slate_robber', label: '杀了拦路人，查看车上的货牌',
          desc: '车篷底下还有一张纸，边角压在货牌下面。', loot: { ration: 1 }, revealSite: den,
          outcome: '灰褂人倒在前轮旁。车篷下压着一包干粮和一张送货图。图上从晒盘坡的旧筛盘画到灰沟，矮栅旁画了一只倒扣的木盆。落款押着一个许字。你踢开垫轮的木楔，把车推到路边。' },
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
    intro: '桥头只余半扇栏杆。一人踩住旁边落地的铜扣，横刀挡在桥面上。「有趁手的兽筋就给两截。栏没系回去，谁也别从这儿过。」',
    actions: [{ id: 'pass_spare_tie', label: '递给他两份坚韧兽筋，帮他系回栏扣',
      desc: '他压低刀柄，「那根旧绳已经磨进铜眼。我只要两根新绳，叫它今晚别掉下去。」', need: { battle_sinew: 2 },
      loot: { ore: 1 }, revealSite: windDen, outcome: '你扶住栏杆。他把兽筋绕着铜扣打结，拔下不能再用的铁片递给你，又朝桥下指了指。「抢盐的人傍晚从那儿回去。下到断阶，看右手立着的白石，藏货的洞口就在石头后边。」' }],
    afterWin: { loot: { ore: 1, salve: 1 }, revealSite: windDen,
      outcome: '他弃刀下了桥边的石梯。你望见他走到断阶，绕过右手立着的白石。石后透出灯光，远远传来数盐袋的声音。你跨过歪斜的栏杆，在铜扣旁拣出一片寒铁和一罐药膏。' },
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
      [bodyguard]: { present: '系黑巾的人拎着厚刀，在货廊的正门和前棚之间走动。', absent: '廊前没有系黑巾的人，只剩门边一道豁进去的刀痕。' },
      [leader]: { present: '有人在长桌前清点货牌。棚里时不时有人喊「许爷」。' },
    },
    afterWinText: {
      [leader]: '许涧倒在长桌边，桌前横着半条折断的凳腿。寨里剩下的人聚到前棚。巡山人从背坡来，在后窗下搭了块过沟的木板。过板就到后柜，和前棚还隔着一堵墙。',
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
    afterWinText: { [redRopeChief]: '邵苹倒下后，带红绳的人退进前棚。岸边一条小船朝后舱靠过来。门敞着，桌上还有一只铜匣。' },
    afterOnceText: { 1: '船家已把匣子带到岸上核账。后舱桌上还剩几捆旧网，各压着一张写了姓名的货签。' } },
  { id: saltCarrier, name: '桥头的盐车', region: 'dry_sound_bridge', once: [0],
    afterOnceText: { 0: '桥栏下还挂着一截拴车的草绳。车夫已经把盐车牵到桥下，约在洞外的白石旁等你。' } },
  { id: windDen, name: '断阶盐洞', region: 'dry_sound_bridge', afterBandit: windDen,
    afterChoices: [`${saltCarrier}:0`], once: [1],
    creatures: { [windWatch]: resident(10, 32), [windBow]: resident(9, 36), [windChief]: resident(1) },
    afterWinText: { [windChief]: '封霁倒下了，守门人退往外洞。靠近白石的一道侧缝直通货室，墙上还亮着小灯。石外有个车夫往洞里张望，手里攥着一卷货单。' },
    afterOnceText: { 1: '车夫沿侧缝领走了带货号的盐袋。屋里剩些空袋和封霁的石凳。外洞偶尔还有脚步声。' } },
];

const events = [
  { id: roadsideCart, name: '矿道歇车处',
    text: '去晒盘坡的旧矿道在这儿分出去。木车停在弯里，车夫正用旧布缠刀鞘，生怕那块铜包角露出来。',
    choices: [
      { label: '问他为何把刀鞘缠起来', days: 0, stay: true,
        outcome: '车夫把布结塞进腰带。「有一回走晒盘坡，拦我的人先打量刀鞘，见是把旧刀，收两截松木就放我走了。前头那辆车挂了口好刀，倒引来了他那拿枪的同伴。」他拍了拍刀鞘。「后来上哪条山道，我都拿布遮一遮。往渡口有人巡，那一段我走得踏实。」' },
    ],
  },
  { id: den, name: '灰沟坡寨', text: '旧筛盘后的灰沟绕到半人高的外栅，栅脚倒扣着一只木盆。棚门和货架都朝着中间的空地，寨里的人来回从这儿过。',
    choices: [
      { label: '翻过外栅，走进寨里的空地', desc: '站在外栅只能看见棚顶和货架，看不清是谁先走出来。', days: 0.25,
        encounter: denResidents, encounterText: {
          [scout]: '哨绳在矮栅上绷紧。石坎上那人去够脚边的短矛，矛尖随着他的目光垂了下来。',
          [sentry]: '棚门一响，戴铁护腕的人侧身挤了出来。他用手肘推合棚门，另一手已经拔了刀。',
          [bodyguard]: '货架间露出一截黑巾。厚刀贴着架边递来，挑得木屑飞起。',
          [leader]: '货牌还摊在长桌上。许涧抬眼，用靴尖把空凳拨到桌角，手往凳后落去。',
        }, outcome: '你踩进矮栅，空地上有人转过身来。' },
      { label: '从背坡拖出货柜，清点许涧留下的东西', afterFight: leader, days: 0.375, stay: true, coins: 280,
        desc: '巡山人先用绳拴住柜脚，才敢沿宽板挪它。柜上摆着许涧的宽背刀，夹层里压着一只铁匣。',
        loot: { ration: 4, ore: 6, core: 3, hide: 2, [kingBlade]: 1, [sleeve]: 1 },
        outcome: '巡山人翻过货牌，让矿户各领自家的货。他又和领货的人对了一遍账，分给你二百八十枚灵钱，柜里剩下的干粮、料件和许涧的宽背刀也一并给你。柜脚那本护车谱，车夫认出是山路上互相传抄的，也递给了你。' },
      { label: '给伤号留一包干粮，叫他们下坡见巡山人', afterFight: leader, days: 0.25, stay: true,
        need: { ration: 1 }, consume: true,
        desc: '两个人扶着背坡的墙，没往前棚走。巡山人肯从外头接他们。',
        outcome: '伤号交出换哨的细绳，拿着干粮沿背坡下去。巡山人在宽板外接住他们。' },
      { label: '查看外栅边的粮袋', desc: '有人把敞口粮袋放在外栅旁的石墩上，伸手就够。', days: 0.125, stay: true,
        loot: { ration: 3 }, outcome: '你把粮袋提到石墩背面，取出三包没启封的干粮。' },
      { label: '把棚门边的药匣拎出来', afterFight: sentry,
        desc: '刚才交手撞松了棚门，门缝里露出一只小木匣，匣盖上还粘着块干药渣。', days: 0.125, stay: true,
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
      { label: '踩上木板，迎住船上的人', desc: '木板一晃，前棚的人就看向这头。垂网下面露着几段兵器。', days: 0.25,
        encounter: [redRopeWatch, redRopeKnife, redRopeChief], encounterText: {
          [redRopeWatch]: '木板刚擦到船舷，坐在篙头的人就搁下没点的灯，提短矛踩上了船板。',
          [redRopeKnife]: '有人用刀背把湿网推向一边。网眼漏下的水打在他肘边的红绳上，他等你站稳才出刀。',
          [redRopeChief]: '掌舵处有人喊了声邵船主。邵苹把舵交下手，从后舱走来，刀柄贴着前臂。',
        }, outcome: '木板擦过船舷，垂网跟着一晃。' },
      { label: '叫船家上后舱，清点铜匣', afterFight: redRopeChief, days: 0.25, stay: true, coins: 490,
        desc: '岸边的船家看见后舱门开了，牵着小船靠过来。案上的包布铜铃压住了他的货单。',
        loot: { ore: 4, hide: 3, [fordBell]: 1 },
        outcome: '船家照单搬走几捆网和几包铜扣，又用舱里的钱退了各船交的过杆费。账清了，他数出四百九十枚灵钱给你，解下邵苹原先挂在舵边的铜铃朝你一递。' },
    ] },
  { id: saltCarrier, name: '桥头的盐车',
    text: '盐车在桥栏边歇着，半边车板空了。车夫拿着一根割断的系货绳。',
    choices: [{ label: '问车夫盐货丢在了哪里', desc: '车夫一直往桥下的断石梯看。',
      days: 0.125, stay: true,
      outcome: '「他们把货拖到桥底，走的是断阶。右手立着白石，他们就在那儿喊开门。」车夫把绳搭回车板。「我的车下不去。我把它挪下桥，你真找到货便朝白石外喊一声，我在那儿等。」' }] },
  { id: windDen, name: '断阶盐洞',
    text: '桥下的石阶断在一块立着的白石旁。风把洞口的空盐袋吹得到处都是，白石后有道得弯腰才能进去的口子。',
    choices: [
      { label: '绕过白石，迎战外洞的人', desc: '鞋一踩上盐粒就会响。半人高的矮墙后有人守着，往里还有一扇石门。',
        days: 0.25, encounter: [windWatch, windBow, windChief], encounterText: {
          [windWatch]: '盐壳在你脚下碎开。门边的人借着这点响动挤过盐袋，低着刀拦了上来。',
          [windBow]: '矮墙后传来一声弦响。一支灰羽箭钉进盐袋，沙沙漏下一线白盐。',
          [windChief]: '里头的石门开了一条缝。有个披斗篷的人把记了一半的盐账压在石凳上，提剑走了出来。',
        }, outcome: '你踩碎了脚下的盐壳。矮墙后有人应声转身。' },
      { label: '招呼车夫，从侧边进去清点盐货', afterFight: windChief, days: 0.375, stay: true, coins: 1750,
        desc: '从白石旁的侧缝能绕过外洞。货柜底还压着一只箱子，箱锁上沾着盐粉。',
        loot: { black_iron: 3, core: 5 },
        outcome: '车夫带着货号册钻进侧缝，叫人照号搬盐。柜底的箱子装着几趟私运的盐款。他和认得货号的客商对清账，一起拨出一千七百五十枚灵钱作谢礼。没记号的暗金与灵晶也留给了你。' },
    ] },
];

const items = [
  { id: sleeve, name: '护车刀谱', kind: 'manual', price: 0, sell: 0, keepOnFall: true, oneOfAKind: true,
    desc: '走山路的人互相传抄的护车薄册。封面抹了层油，翻开能看见几笔怎样在车与崖壁之间收刀的画。' },
  { id: kingBlade, name: '许涧的宽背刀', kind: 'gear', price: 0, sell: 33, keepOnFall: true, oneOfAKind: true,
    desc: '刀背厚，刀尖收得窄。前半截磨得雪亮，靠护手那段却全是长年蹭在木头上的细痕。' },
  { id: fordBell, name: '裹布铜铃', kind: 'gear', price: 0, sell: 26, keepOnFall: true, oneOfAKind: true,
    desc: '邵苹挂在舵边的铜铃，裹着两层厚布，听得清近处脚步。' },
  { id: saltBoots, name: '厚底踏砂靴', kind: 'gear', price: 0, sell: 185, keepOnFall: true, oneOfAKind: true,
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
    id: sleeve, name: '护车刀谱', grade: '凡品', tier: 0, specialty: ['blade'],
    desc: '走车的人在窄路上护身的法子。刀不离肘，脚先给车辕让出半步。真遇上难缠的，也能收刀从车尾抽身。',
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
