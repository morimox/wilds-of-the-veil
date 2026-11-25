const province = 'zhaoyuan';

const townStall = {
  type: '城池', inn: true,
  repair: { name: '蒲霖的后炉', description: '蒲霖把护堤用的铁件靠墙码着，后炉接修过路人的兵器、衣甲和佩件。刃口和皮带都在这里补。', surcharge: 2 },
  goods: { ration: { price: 4, start: 12, cap: 12, interval: 3 }, wood: { price: 5, start: 8, cap: 10, interval: 4 },
    salve: { price: 13, start: 5, cap: 6, interval: 4 }, ore: { price: 12, start: 6, cap: 8, interval: 4 },
    weir_knife: { price: 118, start: 1, cap: 1, interval: 18 } },
  buys: { reed: 2, ore: 5, core: 10, black_iron: 13, qi_core: 7, foundation_core: 21, gold_core: 37 },
  talk: { label: '问铁货商蒲霖柜上的旧秤', lead: 'market_scale_verse',
    outcome: '蒲霖把寒铁往柜里推，拎出两枚砝码。「守尺观那架老秤得两头摆平。右边有两个小盘，那两盘合起来还得正好六两。」他抽出垫在秤脚下的验货单，请你捎过去。' },
};
const hallStall = { type: '宗门', inn: true,
  goods: { ration: { price: 4, start: 8, cap: 10, interval: 4 }, heal_pill: { price: 27, start: 3, cap: 4, interval: 6 },
    leaf_pill: { price: 37, start: 2, cap: 3, interval: 7 }, clear_needle: { price: 4, start: 14, cap: 20, interval: 5 } },
  buys: { reed: 2, hide: 3, qi_core: 7, foundation_core: 21, gold_core: 37 } };

const landmarks = [
  ['zhao_city', '照原城', 13, 48, 0, 1.25, ['ford', 'green_dyke', 'flood_market', 'measuring_hall'], '城砖半边泛白，是上一回洪峰留下的痕。粥铺挨着省潮司，铁货摊后传出磨刀声。', { settlement: townStall, portal: true, array: true }],
  ['green_dyke', '青埂', 25, 29, 0, 0.75, ['frog_pond', 'old_marker'], '田埂两侧都长着芦苇，只有一侧的苇叶被涨水淹过。'],
  ['flood_market', '杨木水栈', 26, 62, 0, 0.75, ['crane_granary', 'glass_bank'], '接船的木台漂在水上，钉子上挂着写有各家姓氏的货签。'],
  ['measuring_hall', '守尺观', 32, 45, 1, 1, ['old_marker', 'charcoal_ridge'], '乌瓦院门晾着测水绳，来客和弟子在同一间灶房用饭。', { settlement: hallStall, portal: true }],
  ['frog_pond', '蛙背塘', 36, 16, 0, 0.75, ['scale_bog'], '矮草后蛙声一片。顺着浮萍漂去的方向，能沿岸走到塘东。'],
  ['old_marker', '没顶刻碑', 42, 28, 0, 1, ['zhao_hermit'], '半截石碑立在浅沟，水上能看见朝反方向刻的浪纹。'],
  ['zhao_hermit', '斜漏水驿', 51, 37, 1, 1, ['jade_mill'], '驿棚钉满别处借来的水尺，一支铁楔正压住桌角。', { portal: true }],
  ['ring_isles', '连环浅洲', 53, 14, 1, 1, ['frog_pond'], '浮草稀的地方露着几块踏脚石，踩着它们能走到几座浅水小岛。'],
  ['scale_bog', '水藻泥湾', 54, 24, 2, 1.25, ['jade_mill', 'sunken_lab'], '水藻裹着泥里的铁砂。青苔长满窄堤，后头偶尔有东西窜过去。'],
  ['crane_granary', '白鹤粮仓', 31, 84, 0, 0.75, ['glass_bank'], '粮仓的木桩架得很高。漏下的谷壳被鸟衔走，枯木堆在后门。'],
  ['zhao_pass', '叠石驿关', 91, 62, 1, 1.25, ['rope_sands', 'mingsha_city'], '关后是一道没树的长坡。领路人腰间挂着一串能扣在一起的木通行牌。', { portal: true }],
  ['jade_mill', '缺轮磨台', 63, 36, 2, 1, ['sunken_lab', 'fault_lake'], '石磨只剩半只轮，中心的圆孔朝着一道塌掉的浅渠。'],
  ['charcoal_ridge', '挂炭坳', 47, 50, 1, 1.25, ['night_pit', 'burnt_weir'], '炭袋挂在山间低处晾干。窑工掀起布角，炉灰的红光后露出一座封了多年的窑。'],
  ['sunken_lab', '沉水量站', 66, 16, 4, 1.5, [], '一排台阶朝水，一排贴着岩壁。水一急，只能靠新挂的灯辨认哪条路通往旧水槽。', { reveal: { item: 'lab_beacon' } }],
  ['night_pit', '烧黑的伏火坑', 57, 57, 5, 1.5, ['burnt_weir'], '炭坑后是一条横着挖开的火道。用湿帘挡住贴地的暗火，里面才有余地换气。', { reveal: { item: 'fire_cloth' } }],
  ['glass_bank', '碎琉璃滩', 48, 72, 1, 1, ['beacon_reefs'], '琉璃多是浑色的，带刻度的那一片被人摆在晒网上。'],
  ['fault_lake', '错水湖底', 82, 27, 7, 1.75, ['burnt_weir'], '两线水分开绕过一枚石柱，柱底的剑痕比露在水面的深得多。', { reveal: { item: 'fault_route' } }],
  ['rope_sands', '拴绳沙洼', 77, 70, 2, 1.25, ['burnt_weir', 'beacon_reefs'], '探沙绳七步打一个结，绳的前端被沉在石坠里。'],
  ['burnt_weir', '断齿内堰', 74, 48, 3, 1.25, ['beacon_reefs'], '旧水坝的石柱像残缺的牙，把河水分成宽窄不一的几道。露在水外的石缝会结出灵晶。'],
  ['beacon_reefs', '望船排礁', 72, 86, 1, 1.25, [], '礁石上的灯快灭了，灯下拴着一支接货小船用的桨。'],
];

const regions = landmarks.map(([id, name, , , tier, travel, , desc, configuration = {}]) => ({
  id, name, tier, travel, desc, ...(configuration.reveal ? { reveal: configuration.reveal, secret: true } : {}),
}));
const regionDetails = Object.fromEntries(landmarks.map(([id, , x, y, , , links, , { reveal, ...features } = {}]) =>
  [id, { province, x, y, links, ...features }]));

const key = (id, name, desc) => ({ id, name, desc, kind: 'key', price: 0, sell: 0 });
const items = [
  key('return_tide_note', '旧碑上的退潮印纸', '从旧碑背面的刻痕印下来的纸，记的是一路向西退去的潮水。纸角写着「斜漏水驿，施荀收」。'),
  key('zhao_sand_chit', '漏潮货签', '余节从秋天的货账上取下的签条。叠石关的柯伯认得正面的签名，签尾另有省潮司留下的缺口。'),
  key('lab_beacon', '照岩壁的旧灯', '量水司借出的小灯。挂低些，通往旧量水站的那排岩壁上会反出两点光。'),
  key('fire_cloth', '泡过草汁的湿帘', '炭工用草汁泡过的短帘。在旧窑口找铁钩把帘挂下，就能挡住贴地窜来的暗火。'),
  key('fault_route', '错水湖的折尺', '把尺摊开，能看见三根沉在湖底的柱子和露出它们的水位。照着找能辨认错水湖里的路。'),
  key('fault_receipt', '湖底旧约', '错水湖底藏着一页旧时分水的约定。落款写了沿途三户撑船人家的姓名。'),
  key('body_breath_note', '扶膝起身帖', '傅澄给访客的一页旧讲义。倒向地面时先稳住呼吸，起身用脚底与腰背一起发力。'),
  key('market_scale_verse', '秤下的验货单', '蒲霖从旧秤下抽出的验货单。上面写着守尺观的规矩：秤的两头要平，右边两个小盘里砝码的总重还得是六两。'),
  key('zhao_porridge_order', '粥铺的领米条', '照原城粥铺的赊账条。昨日没来粮，姜婶托人拿它去白鹤粮仓问何绢。'),
  key('zhao_grain_reply', '何绢按印的回条', '何绢在回条上写了两袋干谷留给照原粥铺。空船要从白鹤粮仓取货，别捎两袋湿谷进城。'),
  key('zhao_gate_notice', '试水门悬赏', '省潮司盖印的告示。青埂旧水门连着几户水田，汛前得弄清是什么把门拽歪了。'),
  key('zhao_gate_shaving', '带咬痕的旧门闩', '青埂的门闩断在中间。裂口有齿印和湿茸毛，附近的拖痕向蛙背塘去。'),
  key('zhao_bank_receipt', '撤船的两枚竹签', '两名船户把自己的码头签交给你。他们已把空船挪去高岸，请省潮司给留在下游的人报平安。'),
  key('zhao_gate_receipt', '省潮司的试闸回条', '老堤工亲眼见撞闩的塘獭倒下。试过青埂旧闸和蛙背塘便门后，他在回条上按了拇指印。'),
];

const attack = (name, mult = 1) => ({ kind: 'attack', name, mult });
const heavy = (name, mult = 1.55) => ({ kind: 'heavy', name, mult });
const enemies = [
  { id: 'dyke_marten', name: '黄沿水貂', tier: 0, hp: 22, atk: 7, def: 2, tags: ['beast', 'furred'], insight: 2,
    intents: [attack('贴着堤边撕咬'), heavy('朝腿上猛扑', 1.4)], loot: { beast_meat: 2, hide: 1, qi_core: 1 } },
  { id: 'zhao_reed_duck', name: '灰苇灵鸭', tier: 0, hp: 19, atk: 6, def: 1, tags: ['beast'], insight: 2,
    intents: [attack('甩翅扑脸'), attack('伸颈啄手', 1.1), heavy('蹬水飞起连啄', 1.45)],
    desc: '常在蒲叶下拣螺。它先伸颈啄手，一双蹼掌踩住浅石时，才会振翅扑来。',
    loot: { beast_meat: 2, qi_core: 1 } },
  { id: 'glass_frog', name: '火斑大蛙', tier: 1, hp: 33, atk: 10, def: 3, tags: ['beast'], insight: 3,
    intents: [attack('伸舌甩来泥点'), attack('鼓起两腮顶撞', 1.1), heavy('收腹蹬腿猛跳')], loot: { beast_meat: 3, beast_eye: 1, qi_core: 2 } },
  { id: 'mud_shrike', name: '泥鳞鬃犬', tier: 3, hp: 73, atk: 15, def: 7, tags: ['furred', 'beast'], insight: 4,
    intents: [attack('摆尾抽脚'), heavy('压低鬃毛'), { kind: 'guard', name: '尾巴卷作一环' }, attack('贴地扯咬', 1.12)],
    loot: { beast_meat: 5, hide: 3, foundation_core: 2 } },
  { id: 'zhao_moss_turtle', name: '苔背泽鳖', tier: 2, hp: 54, atk: 13, def: 7, tags: ['beast', 'scaled'], insight: 4,
    intents: [{ kind: 'guard', name: '缩颈顶起背甲', mult: 1.35 }, attack('侧转咬向脚腕'), heavy('抬甲掀开脚下的泥')],
    desc: '远看像一截生了苔的浮石。它侧转探头时，肩边会露一道甲缝。甲缘那圈厚皮浸水也折不断，裁下来能给护具包边。',
    loot: { beast_meat: 3, hide: 4, qi_core: 2 } },
  { id: 'zhao_rush_eel', name: '缠藻泥鳗', tier: 1, hp: 36, atk: 11, def: 3, tags: ['beast', 'scaled'], insight: 3,
    intents: [attack('从藻下叼住鞋边'), attack('翻尾把人拖进浅沟', 1.12), heavy('缠住脚后猛拽', 1.48)],
    desc: '这鳗在水藻下贴泥而游。咬住东西就会把尾绕在石根上，借那一绕往回拖。',
    loot: { beast_meat: 3, qi_core: 1 } },
  { id: 'lab_crawler', name: '槽背水魁', tier: 4, hp: 95, atk: 18, def: 8, tags: ['stoneborn'], insight: 8,
    intents: [attack('撑着水槽扬起砂子'), { kind: 'drain', name: '从铜槽喷出冷气', mult: 1.15 }, heavy('翻身用背甲压起水浪', 1.57), { kind: 'guard', name: '伏进两道石槽' }],
    desc: '湿石甲下只有一只圆眼，亮得像灯芯。它一拱肩，水就从甲缝挤出来。',
    loot: { beast_eye: 1, foundation_core: 3 } },
  { id: 'ember_yak', name: '伏灰炭魈', tier: 6, hp: 119, atk: 24, def: 10, tags: ['beast', 'furred'], insight: 9,
    intents: [attack('踏碎灰层'), heavy('抱地窜起', 1.63), attack('甩尾卷火', 1.12), { kind: 'guard', name: '护住抱在胸前的灰团' }],
    loot: { beast_meat: 7, hide: 4, gold_core: 2 } },
  { id: 'fault_warden', name: '分柱水君', tier: 7, hp: 163, atk: 29, def: 13, tags: ['spirit'], insight: 16,
    desc: '他的身形由水聚拢，唯有一双白眼凝得像石子。剑尖轻转时，两根柱子间的浪也跟着转向。',
    intents: [attack('借水柱跃起拍向岸边'), { kind: 'guard', name: '退到两根水柱中间' }, heavy('双手挥下两道水刃', 1.59),
      { kind: 'drain', name: '引来水流抽走真气', mult: 1.17 }, attack('顺着回潮斜劈', 1.1)], loot: { beast_eye: 2, gold_core: 4 } },
  { id: 'zhao_spar', name: '教尺法的傅澄', tier: 5, hp: 103, atk: 20, def: 8, tags: ['human'], insight: 6, sparring: true, loot: {},
    intents: [attack('朝前一步点腕'), { kind: 'guard', name: '竖起竹尺' }, heavy('向后一翻竹尺', 1.4), attack('转身用竹尺横推')] },
  { id: 'zhao_gate_otter', name: '撞闩塘獭', tier: 2, hp: 47, atk: 12, def: 4, tags: ['beast', 'furred'], insight: 5,
    intents: [attack('扯着绳头撕咬'), { kind: 'guard', name: '伏身在门桩后', mult: 1.25 }, heavy('踩着门槛猛扑', 1.48)],
    desc: '胸前沾了一片木屑。它伏在门桩后，一旦两条后腿踩住门槛，就会贴着水面跳过来。',
    loot: { beast_meat: 3, hide: 2, qi_core: 2 } },
];

const sites = [];
const events = [];

function scene(region, id, name, text, choices, field = {}, experiment) {
  sites.push({ id, region, name, ...field });
  events.push({ id, name, text, choices, ...(experiment ? { experiment } : {}) });
}

function gather(label, desc, item, count, days, outcome) {
  return { label, desc, loot: { [item]: count }, days, outcome, insight: 2 };
}

function stock(label, start, cap, interval, growth, ...choices) {
  return { label, start, cap, interval, growth, choices };
}

function offer(label, desc, need, loot, coins, outcome, options = {}) {
  return { label, desc, need, consume: true, loot, coins, days: 0.25, insight: 4, outcome, ...options };
}

scene('zhao_city', 'zhao_flood_office', '城门旁的水尺房', '一排尺杆挂在墙上。管水位的杜椿和外州船户核对水痕，手边搁着新、旧两册。', [
  { label: '问两本账的来历', days: 0.125, insight: 3, outcome: '杜椿用指头压着旧账上一行小字。「落灯去年停船。照这上头的水位，比眼下还低半尺，怎么就不能走了？」他翻了翻后一页，空的。「这一页是施荀量的。他如今在斜漏水驿，你若遇见，替我问一声。」' },
  { label: '把冷炉验火册给杜椿看', hidden: true, need: { cold_kiln_record: 1 }, days: 0.25, insight: 5,
    outcome: '杜椿看得很慢。「同一晚，雾梁涨了水，鸣沙退了水，照原的水却往地下渗。账没错。施荀那儿有只试水槽，能用一碗水试出那晚怎么回事。」' },
  { label: '取一张窗格下的悬赏告示', days: 0.125, loot: { zhao_gate_notice: 1 },
    outcome: '杜椿往你手上的告示点了一下。「青埂报了三夜的撞门响。先问堤工，再去河边看。是谁碰了闩，别只凭一枚妖丹回来报。」' },
], { once: [0, 1, 2], choiceText: { 2: { before: '窗格下压着几张新盖印的告示。', after: '窗格下还压着几张给过路人的告示。' } } });

scene('zhao_city', 'zhao_porridge_shed', '城墙根的粥铺', '姜婶用铁勺刮了刮铜锅底，又给端碗的人添了一瓢水。门框上夹着一张等船脚带走的领米条。', [
  { label: '替姜婶把领米条带去白鹤粮仓', days: 0.125, loot: { zhao_porridge_order: 1 },
    outcome: '姜婶把纸条折好塞进你手里。「船行说雨大，昨儿没捎来米。你找看高脚粮仓的何绢问问，有货给我留两袋，空船路过就带。」' },
], { once: [0], afterOnceText: { 0: '姜婶慢慢搅着火上的粥。沿墙有一排倒扣的青瓷碗，给刚下船的人用。' } });

scene('green_dyke', 'zhao_dyke_bend', '两面低埂', '晒席垂在靠水一面，水线贴着席子的下沿。老堤工站在低埂上，手边是一根挂晴雨旗的杆。', [
  gather('掐浅水白芽', '贴席的水不及鞋面。', 'reed', 4, 0.5, '从还没伸叶的老根上掐下了几束白芽。'),
  { label: '到抓痕处守一阵', desc: '泥土下面有厚实的碎蚌壳，咬一口的痕迹还新。', days: 0.125, enemy: 'dyke_marten' },
  { label: '扶堤工把晴雨旗拉起来', days: 0.5, insight: 3, coins: 8, outcome: '雨旗刚拉高，河工停下手头的活指向青埂北边。「那面碑刻过旧汛线，常有人来找。」他把埂工钱与你分了。' },
  { label: '绕到蒲叶外侧，等灰鸭游近', desc: '这里是浅湾，贴着晒席走就能避开。', days: 0.125, enemy: 'zhao_reed_duck',
    outcome: '一只灰鸭抛开刚叼起的泥螺，踏着水面朝你扑来。' },
], { stocks: { reed: stock('白芽', 6, 9, 4, 3, 0) },
  creatures: { dyke_marten: { start: 1, cap: 3, interval: 4, growth: 1, curve: 'wild' }, zhao_reed_duck: { start: 2, cap: 4, interval: 5, growth: 1, curve: 'wild' } },
  creatureText: {
    dyke_marten: { present: '低埂背后有两道新抓痕，旁边散着刚咬开的蚌壳。', absent: '低埂背后的抓痕已经晒干，没见新咬开的蚌壳。' },
    zhao_reed_duck: { present: '晒席外的蒲叶开了条缝，有灰鸭把脑袋埋进水里拣螺。', absent: '晒席外只浮着一片灰羽，蒲叶间没有拍水声。' },
  },
  choiceText: { 2: { after: '拉起的雨旗在杆顶卷了一下，顺着它指的方向能望见北边石碑。' } }, once: [2] });

scene('green_dyke', 'zhao_shutter_tracks', '往田里放水的旧闸', '旧闸抬起后给田里放水。老堤工蹲在闸边，拿竹片戳了戳积泥上的一道长印。歪着的闸板下卡着半截门闩。', [
  { label: '帮堤工从闸板下拔出断闩', days: 0.25, insight: 3, loot: { zhao_gate_shaving: 1 },
    outcome: '断闩是从下边给咬的，齿缝里还塞着茸毛。老堤工用竹片指着长印。「一头在这里，一头往蛙背塘。塘边总有人晾船，你过去叫他们往高一点的地方挪。」' },
], { reveal: { item: 'zhao_gate_notice' }, afterChoices: ['zhao_dyke_bend:2'], once: [0],
  afterOnceText: { 0: '断闩已从闸板下拔出。老堤工留在岸上拉住闸板，水底那道拖印朝蛙背塘去。' } });

scene('flood_market', 'zhao_float_goods', '三姓木码头', '船腹贴着木台，案板上压着写有各家姓氏的货签。余节扶着半边晒网架，另一头已经垂到了船里。', [
  offer('帮余节换掉撑渔网的断木', '撑木一断，晒到一半的网又搭回湿船板。余节拎起网角，水还顺着手肘往下淌。', { wood: 5 }, { zhao_sand_chit: 1 }, 0,
    '余节递来货签。「过叠石关给柯伯看这个。他认得我的印。」他收起架上的一卷干网，往腰间巴掌大的布袋里一塞。'),
  gather('捡码头木台下的松枝', '撞断的枝条在台下随水摇晃。', 'wood', 4, 0.5, '你抽出还能用的松枝，掰掉泡烂的皮。'),
  { label: '问余节那只布袋怎么装得下渔网', afterChoice: 0, days: 0.125, loot: { qiankun_pattern: 1 },
    outcome: '余节解开袋口，翻出一截里衬。「这叫乾坤袋。我上一只给鱼钩划烂了，袋底还在。你带去给会缝皮子的人看看。」他从木箱里取出那块旧袋底递给你。' },
  { label: '问晒网上的晶砂从哪来', desc: '摊开的湿网里嵌着几粒透亮的砂。', days: 0.125, stay: true,
    outcome: '余节拈出一粒放到掌心。「往南过粮仓，就是碎琉璃滩。我妹妹常去，两三筛便够磨刀用。若是要暗金，往关前走，认拴着绳的沙洼。踩在绳外就能筛。」' },
], { once: [0, 2, 3], stocks: { wood: stock('晒台松枝', 5, 9, 4, 3, 1) },
  afterOnceText: { 0: '新木撑稳了晒架。余节正收另一张齐肩高的干网，往腰间的布袋里一送，网全进去了。那袋才一掌宽，仍旧瘪着。', 2: '余节束起布袋口，拍掉新木撑上的木屑。木台下有两根横梁，上游的漂枝常卡在缝里。' } });

scene('measuring_hall', 'zhao_bamboo_duel', '竹尺庭', '砖圈外的弟子喊了声「傅师父」。那人双脚没挪，竹尺一挑，滚到背后的石珠便落进他左手。他把珠子搁回窗台，示意你进来说话。', [
  { label: '问傅师父练尺时怎么站稳', days: 0.125, insight: 3, loot: { body_breath_note: 1 },
    outcome: '他把竹尺靠回台沿。「刚来的人先稳脚。」他教你从低木凳扶膝起身，再把沾了汗渍的讲义给你。「想学站得稳的法子，得先给庭里添一袋压脚石。」' },
  { label: '进砖圈切磋', desc: '圈外执裁的弟子指了指长凳。「药和口粮留在场下。谁站不稳就叫停，下场至少歇半日，气血不到一半不再开打。」', days: 0.125, enemy: 'zhao_spar', outcome: '弟子把身后的木门合上。傅澄换了根没钉铜片的竹尺。' },
], { once: [0], protectedArena: true, regulatedBout: true, creatures: { zhao_spar: { start: 1, cap: 1, interval: 6, growth: 1 } },
  creatureText: { zhao_spar: { present: '砖圈旁立着几根待客的竹尺。', absent: '砖圈已经扫净，竹尺收回架上。傅澄坐在廊下歇手。' } } });

scene('frog_pond', 'zhao_frog_shelf', '浮萍边的浅水窝', '塘边的低石围出一口浅窝。沿外圈的踏脚石走，伸手便能碰到水边。', [
  { label: '踩上低石，看看水下的动静', desc: '齐脚深的水里，有一团红斑贴着石壁挪。', days: 0.125, enemy: 'glass_frog',
    outcome: '两只鼓胀的腮帮先冒出水。你还没看清，红斑便跃上了石头。' },
  gather('采池边的灵草', '几块踏脚石之间挤着几丛新芽。', 'reed', 5, 0.75, '把根上的泥抖进水里，叶片在风里晾了一会儿。'),
], { stocks: { reed: stock('外圈灵草', 7, 11, 5, 3, 1) }, creatures: { glass_frog: { start: 2, cap: 4, interval: 4.5, growth: 1, curve: 'wild' } },
  creatureText: { glass_frog: { present: '石窝里接连冒出几串大气泡。', absent: '浅窝里只漂着薄薄一层浮萍。' } } });

scene('frog_pond', 'zhao_pond_shutter', '塘背的旧便门', '浮木挤在旧便门上方，水里拖着半截青埂的门闩。岸边有条沿高石走的路。', [
  { label: '沿高石喊船户解绳，把空船挪上去', days: 0.375, loot: { zhao_bank_receipt: 1 },
    outcome: '你在高石边接住船头绳。两户避开浮木，把船一前一后拉到岸上。他们把写了名字的竹签交给你，托你给省潮司报个平安。' },
  { label: '等船让开水面，踩上门桩引开塘獭', desc: '门闩又撞了一下。水上冒出一绺毛，嘴里咬着缠上门闩的麻绳。', afterChoice: 0, days: 0.125, enemy: 'zhao_gate_otter',
    outcome: '塘獭撒开绳头，四爪拨水朝门桩来。高石仍能踏回去。' },
  { label: '扶正小水门，请堤工当场验一遭', afterFight: 'zhao_gate_otter', days: 0.375, loot: { zhao_gate_receipt: 1 },
    outcome: '老堤工扶着便门一头。「上游旧闸我已扶正，等这头回槽就能试水。」两人抬了抬闸板，水顺石渠流到田里。他在回条上按下拇指印，托你带回照原城。' },
], { reveal: { item: 'zhao_gate_shaving' }, once: [0, 2], creatures: { zhao_gate_otter: { start: 1, cap: 1 } },
  afterWinText: { zhao_gate_otter: '塘獭伏在泥里没了动静。老堤工从高石上攀下来，蹲下去察看槽里歪着的闸板。' },
  afterOnceText: { 2: '便门已经扶正。水贴着石渠流进田里。' },
  choiceText: { 0: { before: '两条空船拴在旧便门边，船尾的绳结在水面一沉一浮。', after: '塘边原先停着船的地方只剩一圈湿痕，两条空船都上了高岸。' } } });

scene('old_marker', 'zhao_retreat_marks', '刻着退潮水纹的石碑', '碑上正面向河，刻的一律是涨水，背面朝着另一头，斜刀口里有水从低往高爬的线。', [
  { label: '揭开碑背垫着的湿纸', days: 0.5, loot: { return_tide_note: 1 }, insight: 4,
    outcome: '纸上的折线从照原一路往白苇退去，纸角写着「斜漏水驿，施荀收」。你把湿纸平平揭了下来。' },
  gather('从碑脚的泥里淘寒铁', '细铁砂从台阶缝落下来，积在碑脚的泥坑里。', 'ore', 4, 0.75, '把细砂搓掉，铁粒像米一样粘在掌心。'),
], { once: [0], stocks: { ore: stock('碑脚寒铁砂', 7, 11, 5, 3, 1) } });

scene('zhao_hermit', 'zhao_leak_bench', '斜漏驿棚', '施荀把两只漏斗放在桌上试水。风一大，他就用手压住漏斗，底下还垫着一块斜铁。', [
  offer('把旧碑的印纸给施荀看，帮他修漏斗架', '木架裂了一道缝，宽得能塞进两根手指。他需要松木和寒铁把架子撑牢。',
    { return_tide_note: 1, wood: 6, ore: 3 }, { undertow_wedge: 1 }, 0,
    '你用捆来的松木和寒铁撑好漏斗架。施荀收起印纸，把剩下的斜铁递给你。「白苇滩那扇石门退潮时往里开。找到门边的槽，把铁上三道凹痕朝外卡进去。」'),
  { label: '听施荀讲两股水怎么落', days: 0.125, insight: 3, outcome: '施荀松手，右边水管一下滴了好几滴。他拿指腹堵住管口，水声才又匀了。「老站的人把这事刻在铜板上。那块铜板没给洪水冲走的话，还在站里。」' },
], { once: [0, 1], afterOnceText: { 0: '两根松木斜撑住漏斗架。风掀了掀棚布，桌上的漏斗没动。架脚原先垫斜铁的地方已经空了。' } });

scene('ring_isles', 'zhao_isle_reeds', '浮洲松根', '打弯的浅水只冲倒过松的一边，另一侧的沉根压着几团水晶。', [
  gather('割松根上的干片', '古根裸露在水外，指尖能扣住松动的片。', 'wood', 5, 0.75, '把贴着根的干片横扭下来。'),
  gather('掏水下亮晶', '踩稳裸根，泥泡下面还粘着一些晶粒。', 'core', 4, 1, '把沾泥的晶粒冲到粗布上去。'),
], { stocks: { wood: stock('洲上老松', 7, 11, 5, 3, 0), core: stock('沉根灵晶', 5, 8, 6, 3, 1) } });

scene('scale_bog', 'zhao_scales', '水藻旁的土堤', '一条硬埂把浅水和泥坑隔开。埂顶朝北接蛙背塘，朝水那边分出一道藻沟，铁砂大半埋在沟口。贴另一侧水湾的露石走也能站稳。', [
  { label: '踩上土堤，循爪印往前找', desc: '两行带蹼的足印进了水藻，再往外就断了。', days: 0.25, enemy: 'mud_shrike' },
  { ...gather('挖浅水边的铁砂', '站在岸边，弯腰就够得着泥。', 'ore', 6, 1, '你淘出不少裹在水藻里的寒铁。'),
    ambush: { enemy: 'mud_shrike', chance: 0.3, outcome: '水藻下面突然溅起一脸泥。一只鬃犬跳上浅岸，挡了过来。' } },
  { label: '沿水湾的露石去看浮起的背甲', desc: '生苔的背甲往深处沉了一寸，又抬起来。甲缘有一圈厚皮，擦过露石也没见破。', days: 0.25, enemy: 'zhao_moss_turtle',
    outcome: '背甲转了半圈，苔底先露出一双眼。泽鳖贴着脚下的泥扑了过来。' },
  { label: '到北边浅滩寻火斑大蛙', desc: '蛙背塘流来的水刚没过碎石，踩在水里也看得到腿边。', days: 0.125, enemy: 'glass_frog',
    outcome: '一团红斑从齐脚深的水里跃出来，两腮一鼓，就跳到了石脊上。' },
  { label: '扒开沟边水藻找泥鳗', desc: '沟里的水混得看不到底，几片沉叶正被拖过沟口。', days: 0.125, enemy: 'zhao_rush_eel',
    outcome: '一道细背紧贴着沟底拐弯，泥鳗嘴里的藻根刚松，就朝你脚边窜。' },
], { stocks: { ore: stock('藻下铁砂', 8, 12, 5, 4, 1) },
  creatures: {
    mud_shrike: { start: 1, cap: 3, interval: 7, growth: 1, curve: 'wild' },
    zhao_moss_turtle: { start: 2, cap: 4, interval: 8, growth: 1, curve: 'wild' },
    glass_frog: { start: 4, cap: 8, interval: 5, growth: 2, curve: 'wild' },
    zhao_rush_eel: { start: 5, cap: 9, interval: 5, growth: 2, curve: 'wild' },
  },
  creatureText: {
    mud_shrike: { present: '埂上的芦梗勾着一绺湿毛，泥上还有新鲜的爪印。', absent: '埂顶的旧足印已经晒硬，泥坑也没有新爪痕。' },
    zhao_moss_turtle: { present: '水湾边的苔背浮上来透气，水草随着它往两边倒。', absent: '水湾上的水草浮平了，原先露甲的几处只见水纹。' },
    glass_frog: { present: '北边浅滩传来蛙叫，碎石间偶尔闪过一片红斑。', absent: '北边的碎石只听得见流水，蛙声已经退到塘那边。' },
    zhao_rush_eel: { present: '藻沟里几缕沉叶向下游抖着，底下有细背贴泥摆动。', absent: '藻沟里的沉叶被水滞在石边，沟底没东西搅水。' },
  } });

scene('crane_granary', 'zhao_grain_ladder', '高脚粮仓', '木梯有一只脚开裂了。何绢坐在谷壳里等人修，旁边晒着一堆短木，短得做不了接头。', [
  offer('给何绢松木和兽革，修好梯脚', '何绢抬起梯脚给你看，裂缝进了两节指头。「头两级还能踩，背袋米上去就难说了。」', { hide: 2, wood: 2 }, { ration: 6 }, 12,
    '何绢自己提了袋米上梯，落脚时梯子没再晃。她从仓里包了粮饼下来。「水一涨，总有人背着湿谷来求地方。你帮我腾出这几格，饼就劳你吃了吧。」'),
  gather('捡粮仓后门的碎松木', '掉在门外的碎木片已经晒干。', 'wood', 5, 0.75, '你把松木拢进臂弯，粮仓的人又把一堆削下来的短木耙到檐下。'),
  offer('把粥铺的领米条交给何绢', '何绢在低檐下晾清点粮袋的小竹牌，手边的干谷还够拨两袋。', { zhao_porridge_order: 1 }, { zhao_grain_reply: 1 }, 0,
    '她对了对纸条末尾的花押，把门边两袋干谷用麻绳系在一起。「挪旁边的湿谷还得晾。等空船过来，先装这两袋。」她把按印的回条交给你。',
    { hidden: true, insight: 0 }),
], { once: [0, 2], stocks: { wood: stock('粮仓碎松', 8, 12, 6, 4, 1) },
  choiceText: { 2: { after: '门里两袋干谷用同一根麻绳扎着，留给照原城的粥铺。' } },
  afterOnceText: { 0: '梯脚两边新加了木撑，何绢踩着梯子去收上层的粮袋。仓门后仍是削木的地方，檐下一坐就能看见。' } });

scene('zhao_pass', 'zhao_ridge_permit', '青瓦下的验牌房', '柯伯翻看手里的通行木牌。雨刚停，上一队人弄坏了两副绳架。验牌房的铃响起来，鸣沙那头也听得见。', [
  offer('给柯伯货签和材料，修好绳架换通行牌', '柯伯指着檐下磨起毛的绳和散开的木架。水栈的货签、三份兽革和四份松木都得交，灵钱用来付新绳和验牌。', { zhao_sand_chit: 1, hide: 3, wood: 4 },
    { sand_writ: 1 }, -11, '柯伯换好绳架，把两州都认的通行牌交给你。「过了浅石滩就没多少水了。跟紧下一趟带铃的骡车。」'),
  { label: '隔关听骡铃', days: 0.125, insight: 2, outcome: '一声铃从石隙深处转出来。柯伯掸了掸运粮的麻袋。「往后几天只在背风坡停歇。到了鸣沙先找炭篷驿，杨芹灶上常留着热汤。」' },
  { label: '问柯伯用哪家的货签验牌', days: 0.125, outcome: '柯伯扣了扣腰间的牌。「杨木水栈余节的货签就行，落款我认得。水路来的客人多，得凭本地货签把名字写进过关册。」' },
], { once: [0, 1, 2], afterOnceText: { 0: '两副绳架已靠回檐下，破绳卷在门边。柯伯给牵骡的人让开路，关那头不时传来铃声。' } });

scene('jade_mill', 'zhao_old_wheel', '横卧的半边磨轮', '半只磨轮躺在屋脚。水进不了底下的转弯，那里堆着被水推来的浮石。磨轮背后压着一块木牌。', [
  gather('把石脚的灵晶抠出来', '街外磨台已经没人轮值，脚下的水也很慢。', 'core', 5, 1,
    '你撬裂了两块浮石，夹在其中的灵晶正好随水滚下来。'),
  { label: '看看磨轮背后写了什么', days: 0.25, insight: 3, outcome: '牌上写着，把灯挂在磨轮下面，靠岩壁的一边会反出两点光。卖竹筐的人把灯连同坏器具带去了碎琉璃滩，搁在晒网上。' },
], { once: [1], stocks: { core: stock('磨轮灵晶', 8, 12, 6, 4, 0) } });

scene('charcoal_ridge', 'zhao_firedoor', '挂湿帘的窑棚', '窑主马荻在洞口挂湿帘。余火会贴地窜出来，先有浸过草汁的湿帘护身，才能靠近窑口。', [
  offer('给马荻材料，换一面湿帘', '帘绳断了，帘下的接缝被烤得发红。马荻要补泥、皮料和灵草。', { kiln_clay: 5, hide: 3, reed: 5 }, { fire_cloth: 1 }, -8,
    '马荻抹泥封住侧面的缝，抛给你另一面湿帘。「里面那东西受惊就踩着炭堆扑。真要进去，先看看哪边能退出去。」'),
  gather('捡晾棚的松枝头', '被雨打湿的整炭仍在袋里，棚外松尖晾得干。', 'wood', 5, 0.75, '轻推棚角，掉下来一些没熏透的松尖。'),
], { once: [0], stocks: { wood: stock('炭棚松枝', 7, 12, 5, 4, 1) },
  afterOnceText: { 0: '马荻挂稳了湿帘，窑口的火苗没再贴地蹿出来。外头的晾棚晒着炭，棚角散着窑工削下的枝头。' } });

scene('sunken_lab', 'zhao_submerged_table', '铜槽旁', '低挂的灯在岩壁上照出两点光。铜水槽一头还在溅水，另一头有东西用肩抵住出水孔。侧边钉着刻了图的铜板，入口附近还有一块够不到水的台子。', [
  { label: '提灯沿水槽走到深处', days: 0.25, enemy: 'lab_crawler',
    outcome: '灯一晃，湿漉漉的石甲从槽里拱起来。堵在出水孔里的东西侧过身，水打湿了你半条裤腿。' },
  { label: '拔掉铜板的插销，印下刻图', afterFight: 'lab_crawler', days: 0.75, loot: { phase_chart: 1 }, insight: 6,
    outcome: '压住槽沿的石甲已经裂开，水槽另一头终于能抬起来。铜板背面刻着水滴该隔多久落下。你把图印到纸上，原板留在旧站。' },
  gather('在外围收晶屑', '灯旁有一块高台，槽里的水挤不到这边。', 'core', 7, 1.25, '干台的一层短晶透过水汽露出了棱。'),
], { once: [1], stocks: { core: stock('量槽外晶屑', 9, 15, 8, 4, 2) }, creatures: { lab_crawler: { start: 1, cap: 1, interval: 0, growth: 0 } },
  afterWinText: { lab_crawler: '水魁撞上槽沿，石甲碎开，出水口随即露出。铜板侧面的插销也露在外面，入口边仍有块干台。' },
  afterOnceText: { 1: '铜板已经印过，插销被你搁回槽边。水顺出水口落下，靠入口的台子还干着。' } });

scene('night_pit', 'zhao_bank_fire', '赤泥横穴', '湿帘贴住地面，帘脚下有一小堆发亮的黑砂。往里两步，左壁并排开着两个透风孔。', [
  { label: '越过湿帘，向灰里投一颗石子', days: 0.25, enemy: 'ember_yak' },
  { ...gather('沿帘脚扫出暗金', '靠近时能看到黑砂发亮，别碰帘后舔木的暗火。', 'black_iron', 6, 1.25, '刮起不烧手的一层重砂，余炭重新盖过坑沿。'),
    guardedBy: 'ember_yak' },
  { label: '看看没冒烟的两个风孔', days: 0.25, insight: 5, outcome: '有人曾把测温的纸签挂在这里。一大一小两个孔离得很近，同时举起挡板，风会把贴地的火引回炉嘴。孔边两支挡板都够得着。' },
  { label: '站在帘外同时开风孔，扫出重砂', afterChoice: 2, desc: '热气贴着脚面走。两支挡板翻进槽里就能卡稳，帘外的砂不用踩进火道就够得着。', days: 0.375, loot: { black_iron: 2 },
    outcome: '风贴着石壁往上卷，帘根不再冒火。原先烫手的两撮重砂现在能捡了。' },
], { once: [2, 3], stocks: { black_iron: stock('帘内暗金', 9, 14, 10, 4, 1), vent_sand: { item: 'black_iron', ...stock('帘外重砂', 2, 2, 0, 0, 3) } },
  creatures: { ember_yak: { start: 1, cap: 1, interval: 19, growth: 1 } },
  afterOnceText: { 3: '两个挡板仍卡在风孔上。火光缩回炉嘴，帘脚能站人了。帘后通往暗金最多的那片坑沿。' },
  creatureText: { ember_yak: { present: '挨着窑脚传来踏炭声，灰堆上偶尔扫过一道尾影。', absent: '窑脚只有踩散的灰垄，里面没有脚步声。' } } });

scene('glass_bank', 'zhao_glass_net', '六角晒网', '网上晾着带刻度的碎琉璃和一盏浸水也不灭的旧灯。章老把几块轻的碎片摆在外头，看风往哪边吹。', [
  offer('修好灯座，向章老借灯', '灯座搁在网上，撑灯的横木已经开裂。', { ore: 5, wood: 5, core: 2 }, { lab_beacon: 1 }, -16,
    '章老拿撑渔网的杆子压了压新灯座。「去缺轮磨台，过了磨轮后站到岩壁边。哪条路反出两点光，就沿哪条去沉水量站。」'),
  gather('从碎琉璃中挑灵晶', '晒网旁的碎片里也有清澈的灵晶。', 'core', 4, 0.75, '你一片片挑出来，把表面的盐洗掉。'),
], { once: [0], stocks: { core: stock('滩中灵晶', 6, 10, 6, 3, 1) },
  afterOnceText: { 0: '晒网边原先搁灯的地方空了。章老在翻晾带刻度的碎琉璃。' },
  stockText: { core: { present: '篮子旁还有没挑出来的灵晶。', absent: '篮子旁的灵晶已经挑完了。' } } });

scene('fault_lake', 'zhao_deep_pillars', '分水三柱', '三根石柱并排露在水上。中间有人用剑尖挑起水流，两边的浪跟着拐了个弯。最外头那根柱已经断成两半，裂口泛白。', [
  { label: '踏过断柱，往对面的石台去', desc: '你刚把脚搭上断柱，那人就横过了剑。退回岸上的路还在。', days: 0.25, enemy: 'fault_warden',
    outcome: '他在水上让开半步，一道浪却贴着他的剑锋扫到石台边。' },
  { label: '掀开石台上的槽盖', afterFight: 'fault_warden', days: 0.75, loot: { fault_receipt: 1 }, insight: 7,
    outcome: '你抬起暗槽一侧还能活动的盖，里头压着一份旧约。纸上除了三州的水位，还记着田地淹过以后，三户船家分头把船送到了哪儿。' },
], { once: [1], creatures: { fault_warden: { start: 1, cap: 1, interval: 0, growth: 0 } },
  afterWinText: { fault_warden: '水君的身形散了。浪流进湖底的石缝，石台渐渐露出来。台上有道窄槽，槽盖只有一头还被钉着。' },
  afterOnceText: { 1: '石台上的窄槽空了，一边盖子斜敞着。水绕开半沉的断柱，缓缓流向远处。' } });

scene('rope_sands', 'zhao_rope_sound', '拴着石坠的探路绳', '石坠沉在几处沙坑里，探绳从坑口伸出来。晒得干的两根颜色浅，背阴那根摸起来还湿。', [
  gather('拉出背阴的湿绳，筛绳结里的暗金', '挑那根还裹着水迹的，黑粒挂得密。', 'black_iron', 4, 1, '你把湿绳拉到干地，从绳结和毛边筛下暗金。'),
  { label: '顺足印去背阴处', days: 0.125, enemy: 'dyke_marten' },
], { stocks: { black_iron: stock('绳结里的暗金', 6, 11, 7, 3, 0) }, creatures: { dyke_marten: { start: 1, cap: 3, interval: 5, growth: 1, curve: 'wild' } },
  creatureText: { dyke_marten: { present: '有几撮细根被翻到地面，足印一直伸到背阴处。', absent: '翻开的细根晒在地上，旧脚印给风填去大半。' } } });

scene('burnt_weir', 'zhao_broken_rake', '露出水面的三根断柱', '三根断石柱露在水面外。管水坝的楚棱扶着两根水尺，一边的水退到柱脚，他就抬尺读数。', [
  gather('从外侧石柱旁铲灵晶', '通向里面的路断了，外侧石柱边的白晶还够得着。', 'core', 6, 1.25, '铲下的灵晶沿水坝滑到浅滩，薄片之间还滴着水。'),
  { label: '把铜板上的滴水图给楚棱看', hidden: true, need: { phase_chart: 1 }, days: 0.5, loot: { fault_route: 1 }, insight: 5,
    outcome: '楚棱认出旧水槽的退水记号，把尺从布套里取出摊开。「湖底有三根柱子，一位修士守着残台。去过的人多半给赶回来了。下水前先看看从哪儿退。」' },
], { once: [1], stocks: { core: stock('断齿灵晶', 8, 14, 7, 4, 0) } });

scene('beacon_reefs', 'zhao_ferry_hook', '礁石上的灯座', '清点货物的人往灯里添油，搁在灯下的船桨还粘着雾梁州的泥。礁石后常积着水冲来的沉木。', [
  gather('拖一捆靠浅礁的沉木', '灯座外那片石面能落脚，泥不及膝。', 'wood', 6, 1,
    '把木节拖到石条上晒了一会儿，滴水的部分留给后到的船。'),
  { label: '问什么货最等不得开渡', days: 0.125, insight: 3, outcome: '点货人把返潮的盐罐挪到一边。「湿谷多放一天就多坏几袋。先找好船工，哪条路能走，也给后来的船留句话。」' },
], { once: [1], stocks: { wood: stock('灯礁松木', 8, 13, 6, 4, 0) } });

scene('zhao_hermit', 'zhao_assay_tubs', '用陶罐试水的旧槽', '两根管子正往浅槽里滴水。一边有道低缺口，水满了能漫出去。施荀手边搁着调水的木柄，两只小陶罐倒扣在桌上。', [
  { label: '看看桌边陶罐上的盐痕', days: 0.125, insight: 3, outcome: '两个罐底各留了一撮盐。施荀轻叩左边，盐早沿底边结成细圈，再一碰右边，整团滚了出来。「同样的盐，两个罐一个刚温过，一个放了一夜。要验那张方，我还得见见三州留下的东西。」' },
], { once: [0] }, {
  id: 'gold_assay', desc: '你把带来的泥、盐和旧册放在槽边。施荀递来一根调水的小杆，坐到一旁铺纸等结果。',
  need: { cold_kiln_record: 1, phase_chart: 1, heart_silt: 1, stillwell_salt: 1 }, days: 1.25, insight: 13,
  controls: [
    { id: 'fall', label: '调两边滴水的速度', options: [{ id: 'pulse', label: '让一边滴得快些' }, { id: 'even', label: '让两边均匀滴水' }] },
    { id: 'salt', label: '什么时候放井盐', options: [{ id: 'cool', label: '等陶罐凉透再放' }, { id: 'warm', label: '趁陶罐还温热时放' }] },
  ],
  solution: { fall: 'even', salt: 'warm' },
  misses: { fall: { pulse: '来得急的水漫进第二道槽，把沉泥卷起来。两边的清水和泥水混到了一起。' },
    salt: { cool: '水滴已经稳了。井盐碰到冷罐底却结成一小团，水面没能凝出盐圈。' } },
  reward: { gold_formula: 1 },
  outcome: '泥在罐里慢慢沉底，温热的陶罐底沿凝出一道盐圈。施荀写下刚才的温度、用料和水量，把验好的方子和剩下的料都交给你。',
});

const sects = [{ id: 'water_gauge', region: 'measuring_hall', name: '守尺观',
  desc: '守尺观替沿河人量水位。傅澄教弟子用尺，也会请来歇脚的访客到庭里切磋。', join: { need: { reed: 4, wood: 4 }, coins: 16 },
  entryRole: '在观里备量水用的木桩、绳和药箱，也能跟傅师父学用尺。',
  jobs: [
    { id: 'gauge_posts', name: '换掉量水绳的断桩', desc: '去量水的人踩断了两根木桩。换好木桩和铁扣，才能重新拉绳量水。', need: { wood: 6, ore: 2 }, credit: 4, coins: 14, cooldown: 6 },
    { id: 'gauge_pillbox', name: '修好外出用的药箱', desc: '弟子从暴雨里捞回药箱，得用兽革重新包好，再补些灵草。', need: { reed: 7, hide: 3 }, credit: 6, coins: 22, cooldown: 9 },
    { id: 'gauge_silt', name: '备齐试水槽的灵晶和妖丹', desc: '傅澄想试试妖丹能不能稳住漏水处的阵法。他每天都要把浸水的材料取出来看看。',
      minCredit: 4, rankReason: '傅澄把开着的试水阵交给值守的内门弟子。',
      need: { core: 5, foundation_core: 1 }, credit: 10, coins: 29, cooldown: 12 },
    { id: 'gauge_flood_check', name: '查两户人家报上来的汛期水位', desc: '两只木匣同时送到，里头的水位纸差了一截。傅澄请人用院里的水槽校准两家的尺，再回信给各户。',
      minCredit: 16, rankReason: '回信要盖观里的印。两户的水位由执事弟子核过，才会照信开闸。',
      days: 0.75, need: { wood: 2, ore: 3, core: 2 }, credit: 5, coins: 28, cooldown: 11, reward: { heal_pill: 1 },
      text: '一户的尺脚磨短了。你箍紧新木脚，把两把尺浸进同一股水。守门弟子照你核准的水位回信，叫两户各照信上写的时辰开闸。' },
  ],
  ranks: [
    { credit: 4, name: '替尺行走', disciple: '内门弟子', role: '替观里试水槽，帮傅澄照看小阵，跟着学怎么读水尺。',
      reward: { ration: 5 } },
    { credit: 16, name: '河记执事', disciple: '执事弟子', role: '核对各户送来的水位，用观里的印回信，告诉他们照哪个水位开闸。',
      reward: { formula_gold_salve: 1, gold_salve: 2 } },
  ],
}];

const quests = [
  { id: 'zhao_sealed_load', region: 'zhao_city', name: '修好省潮司的水位尺', desc: '城门旁水尺的支脚已泡烂。杜椿想在秋汛前换上松木支脚，用寒铁把尺身重新箍紧。',
    need: { wood: 6, ore: 4 }, reward: { ration: 4, salve: 2 }, coins: 23, insight: 5, requiresKnownMaterials: false,
    outcome: '杜椿扶住尺身，等工匠把铁箍敲紧，才试着松手。「这根倒不了。水真涨起来，也得看看上游那把尺怎么量。」' },
  { id: 'zhao_joint_measure', region: 'zhao_city', name: '校准三州的水尺', reveal: { item: 'fault_receipt' },
    desc: '杜椿在等那份给三州分水的旧约。施荀要做三副铜夹，用同一股水把各州的刻度对齐。',
    need: { fault_receipt: 1, core: 10, ore: 12, wood: 8 }, reward: { gold_salve: 4 }, coins: 81, insight: 14,
    outcome: '三把尺并排浸进水槽，水痕终于挨成一条线。来借尺的货郎问杜椿：「按这把量，下游庄子哪天能收粮？我好把船给他们留一趟。」' },
  { id: 'zhao_porridge_reply', region: 'zhao_city', name: '给粥铺回个准话', reveal: { item: 'zhao_porridge_order' },
    desc: '姜婶给船工留着下午的一锅粥。去白鹤粮仓找何绢问清有没有干谷，把她的回条带回照原。',
    need: { zhao_grain_reply: 1 }, reward: { ration: 3 }, insight: 2, requiresKnownMaterials: false,
    outcome: '姜婶看清回条上「干谷」两个字，转身去叫喝粥的船工。她把刚出笼的三块米饼包了给你。「明早这锅能熬稠些了。」' },
  { id: 'zhao_bank_rescue', region: 'zhao_city', name: '给两户船家报平安', reveal: { item: 'zhao_bank_receipt' },
    desc: '青埂下游还有人在等两户船家的消息。拿他们的竹签给杜椿，省得有人下水逐处去找。',
    need: { zhao_bank_receipt: 1 }, reward: { ration: 2 }, coins: 9, insight: 3, requiresKnownMaterials: false,
    outcome: '杜椿照着竹签上的名字勾了两笔，又让送信人顺道通知下游。他按码头出工的例给了你两份干粮和脚钱。' },
  { id: 'zhao_gate_bounty', region: 'zhao_city', name: '照原悬赏 · 查验青埂旧闸', reveal: { item: 'zhao_gate_notice' },
    desc: '省潮司要断闩和试闸回条。沿青埂闸下的拖痕去蛙背塘，等船离水再查撞门的东西。事后得让堤工亲手试一次闸。',
    need: { zhao_gate_shaving: 1, zhao_gate_receipt: 1 }, reward: { salve: 2 }, coins: 31, insight: 7, requiresKnownMaterials: false,
    outcome: '杜椿把断闩拿去和先前的齿印比对，再照回条给各家的引水册补上一页。他拆下已验的告示，依悬赏所写给你灵钱和药膏。' },
];

export const zhaoContent = { regions, regionDetails, items, sites, events, enemies, sects, quests };
