const cut = (name, mult = 1) => ({ kind: 'attack', name, mult });
const slam = (name, mult = 1.5) => ({ kind: 'heavy', name, mult });
const cover = (name, mult = 1.35) => ({ kind: 'guard', name, mult });
const shoot = (name, mult = 1) => ({ ...cut(name, mult), ranged: true });
const evade = (name) => ({ kind: 'dodge', name });

const roadEnemy = (id, name, tier, hp, atk, def, perception, strategy, desc, intents, escapeChance = 0.07) => ({
  id, name, tier, hp, atk, def, perception, strategy, tags: ['human'],
  insight: 0, loot: {}, desc, intents, escapeChance,
});

const commonEnemies = [
  roadEnemy('road_knife_runner', '灰帕短刀客', 0, 24, 7, 2, 11, 'duelist',
    '灰布沿刀柄缠了几圈。出刀时他先把脚收回来，见人没有追才会再试一步。',
    [cut('收脚平削'), cover('把短刀横在胸前'), slam('突然翻腕劈下', 1.4), evade('一个错步让开')], 0.1),
  roadEnemy('road_spear_taker', '磨杆短矛手', 1, 32, 9, 3, 13, 'predator',
    '矛杆有两处握出来的光。把手挪到后头，就会迎面送出一矛。',
    [cut('短矛推向肩头'), slam('跨步直刺', 1.45), cover('拽回矛杆挡身')]),
  roadEnemy('road_bow_robber', '绳肩劫弓手', 2, 38, 10, 3, 15, 'duelist',
    '弓把有一道用麻绳缠好的裂口。指头压住弦扣时，他还望着你脚下的位置。',
    [shoot('朝脚边试一箭'), cover('退开捻弓弦'), { ...slam('搭硬箭射来', 1.45), ranged: true }, evade('贴着树身往侧面一闪')], 0.11),
  roadEnemy('road_salt_cutter', '盐袋刀手', 3, 51, 12, 5, 19, 'duelist',
    '他把旧盐袋折厚垫在左肩，刀顺着衣摆拖，手上没有多余的动作。',
    [cut('平刀抵到臂侧'), cover('以厚肩偏开半步'), slam('反手提刀斩下')]),
  roadEnemy('road_piked_guard', '绳鞘钩枪客', 4, 61, 14, 5, 21, 'predator',
    '枪尖下有个收绳的钩，脚步很稳。枪从身后抬高时，横着也够得远。',
    [cut('贴杆扎向腰侧'), slam('倒握枪杆横扫', 1.5), cover('把枪身架在眼前')]),
  roadEnemy('road_shield_broker', '旧甲劫货人', 5, 71, 15, 6, 24, 'bulwark',
    '成排的甲片有好几块是从别处补来的。每次换手，盾沿总朝着可能出招的那边。',
    [cut('沿盾边探刀'), cover('并手稳住盾面', 1.45), slam('提盾压肩后下刀', 1.47)], 0.05),
  roadEnemy('road_wind_swordsman', '避风劫剑客', 6, 79, 18, 7, 27, 'duelist',
    '他将披风束在背后，剑鞘空着。剑尖一低，他便能从你让开的那侧进步。',
    [cut('递剑点向手肘'), cover('回剑守肋'), slam('贴身旋剑回斩', 1.54), evade('收剑错开一步')], 0.1),
  roadEnemy('road_black_bowist', '冷弦夺货人', 7, 87, 20, 7, 30, 'schemer',
    '他的弩搁在肩窝，指腹只按着一枚短矢。看见你靠近，他会反向让开半步把弩抬平。',
    [shoot('抬弩放出短矢'), cover('借石影上弦'), { ...slam('扣弦压出一支硬矢', 1.55), ranged: true }], 0.09),
  roadEnemy('road_sandal_halberd', '沉靴劫道客', 8, 104, 22, 9, 33, 'predator',
    '短靴裹了几层硬皮，一步踩下几乎没有声响。他把短戟立在身侧，尖刃只露出一截。',
    [cut('挑戟向膝下扫'), slam('沉肩挑起短戟', 1.62), cover('立戟压住地面', 1.5)]),
];

const den = 'bandit_slope_den';
const scout = 'bandit_den_scout';
const sentry = 'bandit_den_sentry';
const carpenter = 'bandit_den_carpenter';
const leader = 'bandit_den_leader';
const sleeve = 'road_sleeve_manual';
const roadsideCart = 'bandit_marsh_lamp';
const greyGully = 'grey_gully';

const crews = {
  [greyGully]: { name: '灰沟坡寨', members: [16, 12, 8, 4, 3, 2, 1, 1, 0], den,
    headquarters: { region: 'screen_slope', name: '灰沟坡寨' } },
  ferryHills: { name: '桥索边的抬木帮', members: [15, 11, 7, 4, 2, 1, 0, 0, 0],
    headquarters: { region: 'pine_ridge', name: '断桥下的挡雨棚' } },
  quarryTracks: { name: '旧矿道的散伙矿客', members: [8, 8, 7, 6, 5, 4, 3, 2, 1],
    headquarters: { region: 'black_mine', name: '废绞车后屋' } },
  ferryWood: { name: '浅水红绳帮', members: [9, 10, 7, 5, 4, 3, 2, 1, 1],
    headquarters: { region: 'glass_bank', name: '晒网滩外的棚船' } },
  reedBank: { name: '青埂芦窝的伙计', members: [13, 11, 8, 5, 3, 1, 1, 0, 0],
    headquarters: { region: 'green_dyke', name: '青埂北面的堆草房' } },
  weirReef: { name: '断堰捆船帮', members: [6, 7, 7, 7, 6, 5, 4, 3, 2],
    headquarters: { region: 'burnt_weir', name: '堰柱上的旧守水屋' } },
  saltPath: { name: '盐路拾篓人', members: [12, 9, 8, 7, 5, 3, 2, 1, 0],
    headquarters: { region: 'salt_ledger_barrows', name: '担盐岗背坡的空盐仓' } },
  windBridge: { name: '空音桥背风帮', members: [6, 6, 8, 8, 7, 6, 5, 4, 3],
    headquarters: { region: 'dry_sound_bridge', name: '空音桥底的石屋' } },
  tentDunes: { name: '断帐沟的过夜客', members: [12, 9, 7, 6, 4, 3, 2, 1, 0],
    headquarters: { region: 'silk_tent_road', name: '旧帐道的背风窝棚' } },
};

const crewRoads = {
  [greyGully]: [
    ['marsh', 'ridge', 0.055, '倒钟前的山道有几处能藏人的矮石墙。'],
    ['ridge', 'ford', 0.06, '旧商道只须过一道山口，两侧却都有荒屋。'],
    ['ridge', 'screen_slope', 0.09, '晒盘后侧的石径狭窄，路旁矮石墙边常见新脚印。'],
    ['pine_ridge', 'screen_slope', 0.06, '枯松遮住了筛盘背后的一段坡路。'],
    ['screen_slope', 'herb_basin', 0.055, '药谷外的黄草遮到膝头，枝干上勾着一段新布。'],
  ],
  ferryHills: [
    ['marsh', 'ford', 0.05, '旧渡的下坡贴着一道看不清底的土沟。'],
    ['ford', 'pine_ridge', 0.045, '桥索外头还有一片旧车辙，最近被人踩乱了。'],
    ['pine_ridge', 'kiln_valley', 0.055, '林脚这边松枝太密，从路上看不见坡底。'],
    ['kiln_valley', 'herb_basin', 0.05, '两间废窑的后墙之间只容一人穿过。'],
  ],
  quarryTracks: [
    ['ridge', 'black_mine', 0.055, '废矿车正挡在矿脊便道的一处拐角。'],
    ['herb_basin', 'black_mine', 0.055, '废掉的矿道窄，沿路几个旧窝棚近日有火星。'],
    ['black_mine', 'snow_pass', 0.05, '越过裸岩后风大，背石的那侧有人走过的痕迹。'],
  ],
  ferryWood: [
    ['flood_market', 'glass_bank', 0.065, '碎琉璃滩外有一道简陋的横杆，水上看不清谁在守。'],
    ['flood_market', 'crane_granary', 0.045, '粮仓的后路绕过一排平日没人看的空高脚屋。'],
    ['crane_granary', 'glass_bank', 0.055, '枯芦把下岸的路挤成一条单行窄道。'],
    ['ring_isles', 'glass_bank', 0.055, '白石和晒网之间有几条人走出来的岔。'],
  ],
  reedBank: [
    ['green_dyke', 'old_marker', 0.04, '堤下水浅，夹布的空篮卡在半截矮桩上。'],
    ['green_dyke', 'ring_isles', 0.05, '一连串踏石中间有两处看不见对岸。'],
    ['frog_pond', 'scale_bog', 0.065, '苔堤狭长，沿线有几处能从泥滩绕到身后。'],
  ],
  weirReef: [
    ['ring_isles', 'beacon_reefs', 0.045, '离岗灯还有一段下坡，低处的礁缝能避风。'],
    ['glass_bank', 'beacon_reefs', 0.065, '浅岸边的破船壳一直卡在两块礁中间。'],
    ['charcoal_ridge', 'burnt_weir', 0.06, '挂炭袋的树一直排到堰边。最远两只背后有窄坎。'],
    ['rope_sands', 'burnt_weir', 0.07, '沙路越过几根拴索的木桩，堰脚还有一排断柱。'],
    ['burnt_weir', 'beacon_reefs', 0.085, '内堰到外礁的岸坎下捆过货箱，沙里还埋着新断的绳。'],
  ],
  saltPath: [
    ['salt_ledger_barrows', 'stillwell_mouth', 0.055, '背阴的盐袋架旁有两道窄脚印。'],
    ['salt_ledger_barrows', 'chalk_hoof_trail', 0.05, '过山的白石道绕过一层风积沙，旁边有歇过脚的痕迹。'],
    ['stillwell_mouth', 'dry_sound_bridge', 0.055, '盐井外拴着运货绳，绳后有一面裂开的石墙。'],
  ],
  windBridge: [
    ['wind_slate', 'dry_sound_bridge', 0.065, '石板夹出的路一直通到桥肩，最窄处不好回身。'],
    ['dry_sound_bridge', 'cold_kiln', 0.095, '冷窑坡下那几个雨棚，近日有人重新补了草帘。'],
    ['wind_slate', 'cold_kiln', 0.06, '石板背风的一排小孔边积着新鞋印。'],
    ['cold_kiln', 'glass_hail_sink', 0.055, '窑道被砂流冲出几道浅岔口，地面没有新路牌。'],
    ['hanging_vein', 'glass_hail_sink', 0.06, '浅梁下的矿包曾有人打开过，麻绳留在石上。'],
  ],
  tentDunes: [
    ['silk_tent_road', 'camel_grass_dunes', 0.05, '沿途有松垮的旧帐布，看不清矮丘背面。'],
    ['silk_tent_road', 'guest_mill', 0.055, '石磨上游的低沟能一直绕到路旁。'],
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
    '他把左脚踩在板车侧沿，右手提一把削薄的刀。左臂绕着肉眼可见的血布。',
    [cut('用右手带刀横削'), cover('将刀收到伤臂旁边'), slam('借车沿蹬出一刀', 1.43), evade('挨着车辕退开')], 0.05),
  roadEnemy('road_ferry_tollman', '系红绳的篙手', 3, 55, 12, 4, 20, 'predator',
    '草鞋浸透了水，手上仍稳。等篙脚一松，他就有地方从横杆旁扎出一篙。',
    [cut('傍石斜刺一篙'), slam('抬高篙尾扫下来', 1.55), cover('退守横杆背面')], 0.06),
  roadEnemy('road_wind_cutman', '拨桥扣的刀客', 5, 73, 16, 7, 25, 'schemer',
    '正面看去只露出一段刀柄。等桥扣晃响，他会借着响动从遮风石旁露刀。',
    [cut('趁铜扣响时出刀'), cover('闪回石板阴影'), slam('退半步扬腕劈下', 1.58), evade('沿风板迅速让开')], 0.1),
  roadEnemy(scout, '坡寨放哨人', 1, 33, 9, 3, 13, 'predator',
    '短矛靠在哨绳旁。出手前他总会看向沟口，像在等谁来接班。',
    [cut('矛尖挑向鞋头'), slam('借高坎扎出一矛', 1.45), cover('把矛柄竖在胸前')]),
  roadEnemy(sentry, '守棚的箍刀手', 2, 43, 11, 4, 16, 'bulwark',
    '他握刀那只袖子缝了铁箍。把刀压低时，铁箍也会迎着对手的手腕。',
    [cut('抬铁箍压向前腕'), cover('举袖护住半身'), slam('架开来手后重劈', 1.57)]),
  roadEnemy(carpenter, '货廊的抬木手', 3, 54, 12, 5, 18, 'duelist',
    '他从货架后的窄道挤出来，手里提着一根削平的扁担。手一换，扁担两头都能打人。',
    [cut('扁担低头扫腿'), cover('扁担横过胸口'), slam('抬扁担纵劈', 1.54)]),
  { ...roadEnemy(leader, '灰沟贼王许涧', 3, 76, 14, 6, 22, 'schemer',
    '许涧平时隔着长桌点货，出刀也紧贴桌角。见他将空凳拨到身前，先留心凳脚后扬起的刀。',
    [cut('贴着桌沿递刀'), cover('贴住桌角，以刀护身'),
      { kind: 'focus', name: '把空凳拨到身前，藏刀攒劲' },
      slam('踢开木凳，跟着一刀斩下', 1.56), cut('绕过桌角横扫腰侧', 1.1)]),
    accuracy: 0.07 },
];

const fixed = [
  {
    id: 'road_slate_peg', a: 'marsh', b: 'ridge', crew: greyGully, forceAt: 3,
    enemy: 'road_slate_boss', chance: 0.6, fee: 5,
    intro: '板车歪在道上，只留下车辕边一线窄路。一个灰褂人握着短刀，左臂上裹了层透红的布。他叫你丢五枚钱到车板上。',
    nonThreatIntro: '板车歪在道上。灰褂人打量一眼你的兵器，把短刀连鞘搁在车板上。他用右手托着车辕，左袖的布透着血。「劳驾扶一下，别让车再倒过来。」',
    nonThreatActions: [{ id: 'ask_cart_road', label: '帮他扶住车辕，问他从哪儿下来',
      desc: '他一个人扶不住板车。车底夹着半张送货图。', revealSite: den,
      outcome: '车身一正，灰褂人从底下抽出货图。「我是从晒盘坡逃下来的。筛盘后头有条灰沟，矮栅脚下扣着木盆，往里就是那伙人的寨子。」说完他把板车推到路边。' }],
    actions: [{ id: 'bind_road_arm', label: '拿出药膏，替灰褂人裹住左臂',
      desc: '那只手抬不稳，布一动就往下滴血，原先打的结也松了。', need: { salve: 1 },
      loot: { [sleeve]: 1 }, revealSite: den,
      outcome: '你给他上了药。灰褂人用右手扶着车，替你腾开窄路。「这伤是晒盘坡背后的寨里留的。走筛盘旁的灰沟，认倒扣的木盆。」他让你从车板下抽本薄册。「原先护车时拿它保命。下回看清谁先出手，再伸手。」' }],
    afterPay: { revealSite: den,
      outcome: '车辕挪开时落出一张旧货图。图上的山路从晒盘坡筛盘拐进灰沟。沟尽头画着矮栅，栅脚倒扣着一只木盆。' },
    afterWin: {
      intro: '短刀掉进车底。灰褂人靠住车轮，右手抓紧渗血的左袖。「我本是替寨里赶车的。上回他们叫我把押货的小孩捆进棚，我没下手，回头就挨了这一刀。拦你是想凑点看伤的钱。放我一回，我往山下走，再不上这条道。」',
      actions: [
        { id: 'spare_slate_robber', label: '拨开他脚边的短刀，放他下山',
          desc: '他把空着的右手摊在车板上，等你让路。', revealSite: den,
          outcome: '灰褂人扶车站起来，从车槽抽出半张送货图。「晒盘坡旧筛盘后面有条灰沟。沟尽头的矮栅脚下扣着木盆，从那儿进去。」他把短刀留在车下，按着伤口走下坡。' },
        { id: 'kill_slate_robber', label: '了结灰褂人',
          desc: '他已经够不着车下的短刀，只能扶着车轮。', loot: { ration: 1 }, revealSite: den,
          outcome: '灰褂人倒在车轮旁。车槽里压着一包干粮和半张被轮轴碾破的送货图。图上从晒盘坡一架旧筛盘画到灰沟尽头，矮栅旁标着一只倒扣的木盆。' },
      ],
    },
  },
  {
    id: 'road_reed_tariff', a: 'flood_market', b: 'glass_bank', enemy: 'road_ferry_tollman', chance: 0.52, fee: 8,
    intro: '拦水的横杆浮过来，后头接着一根泡裂的浮木。一个脚踝系红绳的篙手立在浅石上，说过杆交八枚钱。杆后有两艘等着靠岸的船。',
    actions: [{ id: 'repair_raft_bar', label: '给两截松木，帮他接住脱开的浮杆',
      desc: '横杆是旧榫，用两截结实的木头平撑住，船就不必一直停在急水边。', need: { wood: 2 },
      loot: { ration: 1 }, outcome: '篙手把旧榫从水里勾起，接住你递下的松木。两边的船终于能靠紧。他朝船主招手。「先拢船。今天这趟不用给钱了。」等船的人塞给你一包干粮。' }],
    afterPay: { outcome: '篙手把横杆朝旧桩一挂，招呼等着的两条船往浅处并拢，一起补上榫头。' },
    afterWin: { loot: { ration: 1, wood: 1 },
      outcome: '篙手松开红绳，从侧边浅滩游开。船客剪去横杆上的私绳，把两条船靠到同一侧。一位船客让你带包干粮，另一位从舱里抽了一截干松木。' },
  },
  {
    id: 'road_coil_rope', a: 'wind_slate', b: 'dry_sound_bridge', enemy: 'road_wind_cutman', chance: 0.48,
    intro: '桥肩的半扇栏动了一下。一人背靠石板握着刀，脚边摆着一只松脱的铜扣。他一只肩朝着桥中，鞋底沿着石缝蹭来蹭去。',
    actions: [{ id: 'pass_spare_tie', label: '递给他两份坚韧兽筋，帮他系回栏扣',
      desc: '他压低刀柄，「那根旧绳已经磨进铜眼。我只要两根新绳，叫它今晚别掉下去。」', need: { battle_sinew: 2 },
      loot: { ore: 1 }, outcome: '绳在铜眼里穿了两圈，他往后拉紧，晃动的半扇栏攀住石肩。那人把拆掉的寒铁补片塞给你，转身去把桥那头的人叫来。' }],
    afterWin: { loot: { ore: 1, salve: 1 },
      outcome: '他弃下松扣，沿桥肩的石梯下去。扣边那捆旧垫片解开后还有一截好铁，布里裹着一罐补手的药膏。' },
  },
];

const resident = (start) => ({ start, cap: start, interval: 0, growth: 0, fixedPopulation: true });
const sites = [
  { id: roadsideCart, name: '北堤歇车处', region: 'marsh' },
  { id: den, name: '灰沟坡寨', region: 'screen_slope', afterBandit: den, once: [4, 5, 6, 7],
    creatures: { [scout]: resident(8), [sentry]: resident(8), [carpenter]: resident(6), [leader]: resident(1) },
    creatureText: {
      [scout]: { present: '外栅的哨绳不时抖动，灰沟深处也有人应声。', absent: '栅外哨绳垂回地面，站在灰沟能看见棚门。' },
      [sentry]: { present: '棚里有几道火光，门前的平石被铁箍磕出新痕。', absent: '棚门已经推开，露出后头搭了木架的货廊。' },
      [carpenter]: { present: '长货廊的木架间有乱脚步。有人把扁担竖靠在货箱旁，正往里传话。', absent: '没人再从木架间出来，贴着两侧货箱就能去掌账的里屋。' },
      [leader]: { present: '挂货签的里间还有人翻账。方才有人隔门喊过一声「许爷」，里头只响了一下刀鞘。', absent: '里间已经静下来，桌上的断凳腿横在地上。' },
    },
    afterOnceText: { 4: '货柜已拖到棚外。外栅拆了一半，从坡路上就能看见棚顶。', 5: '棚门敞开。肯下山交代的人已经离开，灰沟再没有换哨的声响。' },
  },
];

const events = [
  { id: roadsideCart, name: '北堤歇车处',
    text: '北堤分出一条上山的石路。赶木车的人歇在路口，扯下一截旧布，把腰间刀鞘上的铜包角缠住。',
    choices: [
      { label: '问他为何把刀鞘缠起来', days: 0, stay: true,
        outcome: '「过了北堤，有人专在山道上等。先看你穿的甲，再看腰里挂的刀。披亮甲的，出来讨钱的往往也更不好惹。村口和驿站有人巡，他们少往那边凑。我上山总留几枚散钱，包里也放点救急的料。上回给了两截松木，那人就挪开了绳。」' },
    ],
  },
  { id: den, name: '灰沟坡寨', text: '旧筛盘后的灰沟一路窄下去，绕到半人高的外栅。倒扣的木盆就在栅脚。栅内是排开数间的换哨棚，后头一溜货廊尽头才是掌账的里屋。',
    choices: [
      { label: '翻过外栅，截住换哨人', desc: '外栅这头落脚平稳，另一头是两道刚绑好的哨绳。', days: 0.25, enemy: scout,
        outcome: '灰沟里的细铁响了一声，放哨人提着短矛翻过栅脚。' },
      { label: '沿棚门的平石进去', guardedBy: scout, days: 0.25, enemy: sentry,
        outcome: '火盆就在门内，带铁箍的袖子伸过火光，将你往门外逼。' },
      { label: '贴着货架穿过长廊', desc: '廊两边堆了没解绳的货箱，中间只够一人过。', guardedBy: [scout, sentry], days: 0.25, enemy: carpenter,
        outcome: '木架背后挤出一个抬货人。他抄起扁担，逼你退回廊口。' },
      { label: '推开挂货签的里屋门', guardedBy: [scout, sentry, carpenter], days: 0.25, enemy: leader,
        outcome: '许涧把门边插着的货签折断，又用脚把空凳拨到桌前。「叫我许涧的多，叫我贼王的也有。货在廊下，想搬，得先过这张桌。」他才把长刀从桌底抽出来。' },
      { label: '把藏赃的货柜拖出棚门', afterFight: leader, days: 0.375, stay: true, coins: 18,
        loot: { ration: 4, ore: 6, core: 3, hide: 2 },
        outcome: '晒盘坡的矿户认出柜上的货签，帮你把有主的货分好。领货的人凑了十八枚灵钱答谢，又分给你几包行粮、寒铁、灵晶和兽革。' },
      { label: '给伤号留一包干粮，叫他们下坡见巡山人', afterFight: leader, days: 0.25, stay: true,
        need: { ration: 1 }, consume: true,
        outcome: '几个躲在棚后的伤号拿走干粮，交出换哨的细绳。坡脚的人挨个领他们下山，守路的人把回仓的货先搬到路边。' },
      { label: '查看哨位旁的粮袋', desc: '矮凳下有一个敞口粮袋，看样子是给换哨的人备的。', guardedBy: scout, days: 0.125, stay: true,
        loot: { ration: 3 }, outcome: '粮袋里还留着三包没启封的干粮。' },
      { label: '把棚门内的药匣拎出来', desc: '几团用过的布旁有只小木匣，匣盖上压着一片干药渣。', guardedBy: [scout, sentry], days: 0.125, stay: true,
        loot: { salve: 2 }, outcome: '你把里头干净的两包松脂膏拣出来。' },
    ],
  },
];

const items = [
  { id: sleeve, name: '守车短袖诀', kind: 'manual', price: 0, sell: 0, keepOnFall: true,
    desc: '灰褂人的护车薄册，封面抹过一层油。纸角压得很平，翻开就看见几笔将刀拢在半臂之内的画。' },
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
  items, sites, events, enemies: [...commonEnemies, ...specialEnemies], innerStyles,
  roadBandits: { roads, pools, fixed, crews, dens: { [den]: { heads: 23, minFactor: 0.13 } } },
};
