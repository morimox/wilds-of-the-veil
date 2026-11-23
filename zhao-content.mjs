const province = 'zhaoyuan';

const townStall = {
  type: '城池', inn: true,
  goods: { ration: { price: 4, start: 12, cap: 12, interval: 3 }, wood: { price: 5, start: 8, cap: 10, interval: 4 },
    salve: { price: 13, start: 5, cap: 6, interval: 4 }, ore: { price: 12, start: 6, cap: 8, interval: 4 },
    weir_knife: { price: 94, start: 1, cap: 1, interval: 18 } },
  buys: { reed: 2, ore: 5, core: 10, black_iron: 13, qi_core: 7, foundation_core: 21, gold_core: 37 },
  talk: { label: '问铁货商蒲霖柜上的旧秤', lead: 'market_scale_verse',
    outcome: '蒲霖把寒铁往柜里推，拎出两枚砝码。「守尺观那架老秤得两头摆平。右边有两个小盘，那两盘合起来还得正好六两。」他抽出垫在秤脚下的验货单，请你捎过去。' },
};
const hallStall = { type: '宗门', inn: true,
  goods: { ration: { price: 4, start: 8, cap: 10, interval: 4 }, heal_pill: { price: 27, start: 3, cap: 4, interval: 6 },
    leaf_pill: { price: 37, start: 2, cap: 3, interval: 7 }, clear_needle: { price: 4, start: 14, cap: 20, interval: 5 } },
  buys: { reed: 2, hide: 3, qi_core: 7, foundation_core: 21, gold_core: 37 } };

const landmarks = [
  ['zhao_city', '照原城', 13, 48, 0, 1.25, ['ford', 'green_dyke', 'flood_market', 'measuring_hall'], '城砖半边泛白，是上一回洪峰留下的痕。城门内有粥铺与省潮司。', { settlement: townStall, portal: true, array: true }],
  ['green_dyke', '青埂', 25, 29, 0, 0.75, ['frog_pond', 'old_marker', 'ring_isles'], '田埂两侧都长着芦苇，只有一侧的苇叶被涨水淹过。'],
  ['flood_market', '杨木水栈', 26, 62, 0, 0.75, ['crane_granary', 'zhao_pass', 'glass_bank'], '接船的木台漂在水上，钉子上挂着写有各家姓氏的货签。'],
  ['measuring_hall', '守尺观', 32, 45, 1, 1, ['old_marker', 'charcoal_ridge'], '乌瓦院门晾着测水绳，来客和弟子在同一间灶房用饭。', { settlement: hallStall, portal: true }],
  ['frog_pond', '蛙背塘', 36, 16, 0, 0.75, ['scale_bog'], '矮草后蛙声一片。顺着浮萍漂去的方向，能沿岸走到塘东。'],
  ['old_marker', '没顶刻碑', 42, 28, 0, 1, ['zhao_hermit'], '半截石碑立在浅沟，水上能看见朝反方向刻的浪纹。'],
  ['zhao_hermit', '斜漏水驿', 51, 37, 1, 1, ['jade_mill'], '驿棚钉满别处借来的水尺，一支铁楔正压住桌角。', { portal: true }],
  ['ring_isles', '连环浅洲', 53, 14, 1, 1, ['beacon_reefs', 'glass_bank'], '浮草稀的地方露着几块踏脚石，踩着它们能走到几座浅水小岛。'],
  ['scale_bog', '藻鳞泥浜', 54, 24, 2, 1.25, ['jade_mill', 'sunken_lab'], '水藻裹着泥里的铁砂。青苔长满窄堤，后头偶尔有东西窜过去。'],
  ['crane_granary', '白鹤粮仓', 31, 84, 0, 0.75, ['glass_bank'], '粮仓的木桩架得很高。漏下的谷壳被鸟衔走，枯木堆在后门。'],
  ['zhao_pass', '叠石驿关', 91, 62, 1, 1.25, ['rope_sands', 'mingsha_city'], '关后是一道没树的长坡。领路人腰间挂着一串能扣在一起的木通行牌。', { portal: true }],
  ['jade_mill', '缺轮磨台', 63, 36, 2, 1, ['sunken_lab', 'fault_lake'], '石磨只剩半只轮，中心的圆孔朝着一道塌掉的浅渠。'],
  ['charcoal_ridge', '挂炭坳', 47, 50, 1, 1.25, ['night_pit', 'burnt_weir'], '炭袋挂在山间低处晾干。窑工掀起布角，炉灰的红光后露出一座封了多年的窑。'],
  ['sunken_lab', '沉水量站', 66, 16, 4, 1.5, ['fault_lake'], '一排台阶朝水，一排贴着岩壁。水一急，只能靠新挂的灯辨认哪条路通往旧水槽。', { reveal: { item: 'lab_beacon' } }],
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
  key('return_tide_note', '倒行水痕拓样', '从旧碑背面印下来的水纹，记的是往西退的潮。斜漏水驿的桌角也有一道相似的裂缝，里头压着块铁。'),
  key('zhao_sand_chit', '漏潮货签', '余节从秋天的货账上取下的签条。叠石关的柯伯认得正面的签名，签尾另有省潮司留下的缺口。'),
  key('lab_beacon', '靠岩导灯', '量水司借出的小灯。挂低些，通往旧量水站的那排岩壁上会反出两点光。'),
  key('fire_cloth', '浸炭湿帘', '炭工用草汁泡过的短帘。在旧窑口找铁钩把帘挂下，就能挡住贴地窜来的暗火。'),
  key('fault_route', '错水折尺', '把尺摊开，能看见三根沉在湖底的柱子和露出它们的水位。照着找能辨认错水湖里的路。'),
  key('fault_receipt', '留水底印', '错水湖底藏着一页旧时分水的约定。落款写了沿途三户撑船人家的姓名。'),
  key('body_breath_note', '扶膝起身帖', '傅澄给访客的一页旧讲义。倒向地面时先稳住呼吸，起身用脚底与腰背一起发力。'),
  key('market_scale_verse', '秤下的验货单', '蒲霖从旧秤下抽出的验货单。上面写着守尺观的规矩：秤的两头要平，右边两个小盘里砝码的总重还得是六两。'),
];

const attack = (name, mult = 1) => ({ kind: 'attack', name, mult });
const heavy = (name, mult = 1.55) => ({ kind: 'heavy', name, mult });
const enemies = [
  { id: 'dyke_marten', name: '黄沿水貂', tier: 0, hp: 22, atk: 7, def: 2, tags: ['furred'], insight: 2,
    intents: [attack('贴着堤边撕咬'), heavy('朝腿上猛扑', 1.4)], loot: { beast_meat: 2, hide: 1, qi_core: 1 } },
  { id: 'glass_frog', name: '火斑大蛙', tier: 1, hp: 33, atk: 10, def: 3, tags: ['beast'], insight: 3,
    intents: [attack('伸舌甩来泥点'), attack('鼓起两腮顶撞', 1.1), heavy('收腹蹬腿猛跳')], loot: { beast_meat: 3, beast_eye: 1, qi_core: 2 } },
  { id: 'mud_shrike', name: '泥鳞鬃犬', tier: 3, hp: 73, atk: 15, def: 7, tags: ['furred', 'beast'], insight: 4,
    intents: [attack('摆尾抽脚'), heavy('压低鬃毛'), { kind: 'guard', name: '尾巴卷作一环' }, attack('贴地扯咬', 1.12)],
    loot: { beast_meat: 5, hide: 3, foundation_core: 1 } },
  { id: 'lab_crawler', name: '槽背水魁', tier: 4, hp: 95, atk: 18, def: 8, tags: ['stoneborn'], insight: 8,
    intents: [attack('撑着水槽扬起砂子'), { kind: 'drain', name: '从铜槽喷出冷气', mult: 1.15 }, heavy('翻身用背甲压起水浪', 1.57), { kind: 'guard', name: '伏进两道石槽' }],
    loot: { beast_eye: 1, foundation_core: 3 } },
  { id: 'ember_yak', name: '伏灰炭魈', tier: 6, hp: 119, atk: 24, def: 10, tags: ['furred'], insight: 9,
    intents: [attack('踏碎灰层'), heavy('抱地窜起', 1.63), attack('甩尾卷火', 1.12), { kind: 'guard', name: '护住抱在胸前的灰团' }],
    loot: { beast_meat: 7, hide: 4, gold_core: 1 } },
  { id: 'fault_warden', name: '分柱水君', tier: 7, hp: 163, atk: 29, def: 13, tags: ['spirit'], insight: 16,
    intents: [attack('借水柱跃起拍向岸边'), { kind: 'guard', name: '退到两根水柱中间' }, heavy('双手挥下两道水刃', 1.59),
      { kind: 'drain', name: '引来水流抽走真气', mult: 1.17 }, attack('顺着回潮斜劈', 1.1)], loot: { beast_eye: 2, gold_core: 4 } },
  { id: 'zhao_spar', name: '掌尺人傅澄', tier: 5, hp: 103, atk: 20, def: 8, tags: ['human'], insight: 6, sparring: true, loot: {},
    intents: [attack('朝前一步点腕'), { kind: 'guard', name: '竖起竹尺' }, heavy('向后一翻竹尺', 1.4), attack('转门横推')] },
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

scene('zhao_city', 'zhao_flood_office', '城门水尺档', '一排尺杆挂在墙上。司水的杜椿和外州船户核对水痕，手边搁着新、旧两册。', [
  { label: '问两本账的来历', days: 0.125, insight: 3, outcome: '杜椿用指头压着旧账上一行小字。「落灯去年停船。照这上头的水位，比眼下还低半尺，怎么就不能走了？」他翻了翻后一页，空的。「这一页是施荀量的。他如今在斜漏水驿，你若遇见，替我问一声。」' },
  { label: '把冷炉验火册给杜椿看', hidden: true, need: { cold_kiln_record: 1 }, days: 0.25, insight: 5,
    outcome: '杜椿看得很慢。「同一晚，雾梁涨了水，鸣沙退了水，照原的水却往地下渗。账没错。施荀那儿有只试水槽，能用一碗水试出那晚怎么回事。」' },
], { once: [0, 1] });

scene('green_dyke', 'zhao_dyke_bend', '两面低埂', '晒席垂在靠水一面，低埂后有新鲜的抓土。老堤工把看涨水的石碑指出来，才发现碑已经歪了。', [
  gather('掐浅水白芽', '贴席的水不及鞋面。', 'reed', 4, 0.5, '从还没伸叶的老根上掐下了几束白芽。'),
  { label: '到抓痕处守一阵', desc: '泥土下面有厚实的碎蚌壳，咬一口的痕迹还新。', days: 0.125, enemy: 'dyke_marten' },
  { label: '扶堤工把晴雨旗拉起来', days: 0.5, insight: 3, coins: 8, outcome: '雨旗刚拉高，河工停下手头的活指向青埂北边。「那面碑刻过旧汛线，常有人来找。」他把埂工钱与你分了。' },
], { stocks: { reed: stock('白芽', 6, 9, 4, 3, 0) }, creatures: { dyke_marten: { start: 1, cap: 3, interval: 4, growth: 1, curve: 'wild' } }, once: [2] });

scene('flood_market', 'zhao_float_goods', '三姓木码头', '船腹贴着木台，案板上压着断开的账签。管晒网的余节翻着旧簿找去鸣沙的号码。', [
  offer('帮余节换掉撑渔网的断木', '撑木一断，晒到一半的网又搭回湿船板。余节拎起网角，水还顺着手肘往下淌。', { wood: 5 }, { zhao_sand_chit: 1 }, 0,
    '余节把网重新支起来，见你往关口的方向望，便解下腰间的货签。「过叠石关给柯伯看这个。我替他捎了几年鱼，他认得我的印。」'),
  gather('捡码头木台下的松枝', '撞断的枝条在台下随水摇晃。', 'wood', 4, 0.5, '你抽出还能用的松枝，掰掉泡烂的皮。'),
], { once: [0], stocks: { wood: stock('晒台松枝', 5, 9, 4, 3, 1) } });

scene('measuring_hall', 'zhao_bamboo_duel', '竹尺庭', '傅澄闭眼用竹尺轻拨一粒石珠。外来的访客也能拿木棍进砖圈切磋，圈外有弟子看着。', [
  { label: '请傅澄讲练尺的事', days: 0.125, insight: 3, loot: { body_breath_note: 1 },
    outcome: '他把竹尺靠回台沿。「刚来的人先稳脚。」他教你从低木凳扶膝起身，再把沾了汗渍的讲义给你。「想学站得稳的法子，得先给庭里添一袋压脚石。」' },
  { label: '进砖圈和傅澄切磋', desc: '只要有人跪倒，圈外的弟子就会上前叫停。', days: 0.125, enemy: 'zhao_spar', outcome: '弟子把身后的木门合上。傅澄换了根没钉铜片的竹尺。' },
], { once: [0], protectedArena: true, creatures: { zhao_spar: { start: 1, cap: 1, interval: 6, growth: 1 } } });

scene('frog_pond', 'zhao_frog_shelf', '斜萍石窝', '塘边低石凹成半面锅，火斑蛙喜欢离浅水不远的那一坑。外圈几条水藻缠着细枝。', [
  { label: '踩上低石，看看水里的蛙', desc: '水面冒着比平常大得多的气泡。', days: 0.125, enemy: 'glass_frog' },
  gather('采池边的灵草', '几块踏脚石之间挤着几丛新芽。', 'reed', 5, 0.75, '把根上的泥抖进水里，叶片在风里晾了一会儿。'),
], { stocks: { reed: stock('外圈灵草', 7, 11, 5, 3, 1) }, creatures: { glass_frog: { start: 2, cap: 4, interval: 4.5, growth: 1, curve: 'wild' } } });

scene('old_marker', 'zhao_retreat_marks', '倒行刻碑', '碑上正面向河，刻的一律是涨水，背面朝着另一头，斜刀口里有水从低往高爬的线。', [
  { label: '揭开碑背垫着的湿纸', days: 0.5, loot: { return_tide_note: 1 }, insight: 4,
    outcome: '碑角钉着施荀的名字，纸上的折线从照原一直退回白苇。你把递给他的那份取了下来。' },
  gather('从碑脚的泥里淘寒铁', '细铁砂从台阶缝落下来，积在碑脚的泥坑里。', 'ore', 4, 0.75, '把细砂搓掉，铁粒像米一样粘在掌心。'),
], { once: [0], stocks: { ore: stock('碑脚寒铁砂', 7, 11, 5, 3, 1) } });

scene('zhao_hermit', 'zhao_leak_bench', '斜漏驿棚', '施荀把两只漏斗放在桌上试水。风一大，他就用手压住漏斗，底下还垫着一块斜铁。', [
  offer('把旧碑的印纸给施荀看，帮他修漏斗架', '木架裂了一道缝，宽得能塞进两根手指。他需要松木和寒铁把架子撑牢。',
    { return_tide_note: 1, wood: 6, ore: 3 }, { undertow_wedge: 1 }, 0,
    '你用捆来的松木和寒铁撑好漏斗架。施荀收起印纸，把剩下的斜铁递给你。「白苇滩那扇石门退潮时往里开。找到门边的槽，把铁上三道凹痕朝外卡进去。」'),
  { label: '听施荀讲两股水怎么落', days: 0.125, insight: 3, outcome: '施荀松手，右边水管一下滴了好几滴。他拿指腹堵住管口，水声才又匀了。「老站的人把这事刻在铜板上。那块铜板没给洪水冲走的话，还在站里。」' },
], { once: [0, 1] });

scene('ring_isles', 'zhao_isle_reeds', '浮洲松根', '打弯的浅水只冲倒过松的一边，另一侧的沉根压着几团水晶。', [
  gather('割松根上的干片', '古根裸露在水外，指尖能扣住松动的片。', 'wood', 5, 0.75, '把贴着根的干片横扭下来。'),
  gather('掏水下亮晶', '踩稳裸根，泥泡下面还粘着一些晶粒。', 'core', 4, 1, '把沾泥的晶粒冲到粗布上去。'),
], { stocks: { wood: stock('洲上老松', 7, 11, 5, 3, 0), core: stock('沉根灵晶', 5, 8, 6, 3, 1) } });

scene('scale_bog', 'zhao_scales', '青膜硬埂', '硬埂上的毛在绿水外一绺一绺。泥砂顺两边都往低处聚，旁边有一条小浅湾。', [
  { label: '踩着硬土堤找鬃犬', desc: '脚下稳得住，土堤下的水藻却有东西窜过。', days: 0.25, enemy: 'mud_shrike' },
  { ...gather('挖浅水边的铁砂', '站在岸边，弯腰就够得着泥。', 'ore', 6, 1, '你淘出不少裹在水藻里的寒铁。'),
    ambush: { enemy: 'mud_shrike', chance: 0.3, outcome: '水藻下面突然溅起一脸泥。一只鬃犬跳上浅岸，挡了过来。' } },
], { stocks: { ore: stock('藻下铁砂', 8, 12, 5, 4, 1) }, creatures: { mud_shrike: { start: 1, cap: 3, interval: 7, growth: 1, curve: 'wild' } } });

scene('crane_granary', 'zhao_grain_ladder', '高脚粮仓', '木梯有一只脚开裂了。何绢坐在谷壳里等人修，旁边晒着一堆短木，短得做不了接头。', [
  offer('给何绢松木和兽革，修好梯脚', '何绢抬起梯脚给你看，裂缝进了两节指头。「头两级还能踩，背袋米上去就难说了。」', { hide: 2, wood: 2 }, { ration: 6 }, 12,
    '何绢自己提了袋米上梯，落脚时梯子没再晃。她从仓里包了粮饼下来。「水一涨，总有人背着湿谷来求地方。你帮我腾出这几格，饼就劳你吃了吧。」'),
  gather('捡粮仓后门的碎松木', '掉在门外的碎木片已经晒干。', 'wood', 5, 0.75, '你把松木拢进臂弯，粮仓的人又把一堆削下来的短木耙到檐下。'),
], { once: [0], stocks: { wood: stock('粮仓碎松', 8, 12, 6, 4, 1) } });

scene('zhao_pass', 'zhao_ridge_permit', '青瓦验牒房', '柯伯翻看手里的通行木牌。雨刚停，上一队人弄坏了两副绳架。验牌房的铃响起来，鸣沙那头也听得见。', [
  offer('出示余节的货签，替柯伯补绳架', '柯伯指着檐下两条磨起毛的绳，说木架也得补。', { zhao_sand_chit: 1, hide: 3, wood: 4 },
    { sand_writ: 1 }, -11, '柯伯换好绳架，把两州都认的通行牌交给你。「过了浅石滩就没多少水了。跟紧下一趟带铃的骡车。」'),
  { label: '隔关听骡铃', days: 0.125, insight: 2, outcome: '一声铃从石隙深处转出来。柯伯说鸣沙城把新绳价写在城门，冲坏的井也还等人修。' },
], { once: [0, 1] });

scene('jade_mill', 'zhao_old_wheel', '横卧的半边磨轮', '磨眼横着，底下有一条水流不过去的弯。老浮石挤在屋脚，两枚硬晶夹在石缝。', [
  gather('把石脚的灵晶抠出来', '街外磨台已经没人轮值，脚下的水也很慢。', 'core', 5, 1,
    '你撬裂了两块浮石，夹在其中的灵晶正好随水滚下来。'),
  { label: '看看磨轮背后写了什么', days: 0.25, insight: 3, outcome: '牌上写着，把灯挂在磨轮下面，靠岩壁的一边会反出两点光。卖竹筐的人把灯连同坏器具带去了碎琉璃滩，搁在晒网上。' },
], { once: [1], stocks: { core: stock('磨轮灵晶', 8, 12, 6, 4, 0) } });

scene('charcoal_ridge', 'zhao_firedoor', '斜封窑棚', '窑主马荻在洞口挂湿帘。余火会贴地窜出来，先有浸过草汁的湿帘护身，才能靠近窑口。', [
  offer('给马荻材料，换一面湿帘', '帘绳断了，帘下的接缝被烤得发红。马荻要补泥、皮料和灵草。', { kiln_clay: 5, hide: 3, reed: 5 }, { fire_cloth: 1 }, -8,
    '马荻抹泥封住侧面的缝，抛给你另一面湿帘。「里面那只会抓着炭往上一窜。真要进去，别站在它和洞口之间。」'),
  gather('捡晾棚的松枝头', '被雨打湿的整炭仍在袋里，棚外松尖晾得干。', 'wood', 5, 0.75, '轻推棚角，掉下来一些没熏透的松尖。'),
], { once: [0], stocks: { wood: stock('炭棚松枝', 7, 12, 5, 4, 1) } });

scene('sunken_lab', 'zhao_submerged_table', '占着量槽的石背', '低挂的灯在岩壁上照出两点光。铜水槽一头溅水，另一头有东西用肩顶住出水孔。侧边还固定着一块刻图的铜板。', [
  { label: '沿灯照亮的石槽走近水魁', days: 0.25, enemy: 'lab_crawler' },
  { label: '拔掉铜板的插销，印下刻图', afterFight: 'lab_crawler', days: 0.75, loot: { phase_chart: 1 }, insight: 6,
    outcome: '水魁退进岩缝，水槽另一头终于能抬起来。铜板背面刻着水滴该隔多久落下。你把图印到纸上，原板留在旧站。' },
  gather('在外围收晶屑', '灯旁有一块高台，槽里的水挤不到这边。', 'core', 7, 1.25, '干台的一层短晶透过水汽露出了棱。'),
], { once: [1], stocks: { core: stock('量槽外晶屑', 9, 15, 8, 4, 2) }, creatures: { lab_crawler: { start: 1, cap: 1, interval: 0, growth: 0 } },
  afterWinText: { lab_crawler: '低挂的导灯亮起两点。传水的槽终于能抬起铜边，水魁已经退进再深些的岩裂。' } });

scene('night_pit', 'zhao_bank_fire', '赤泥横穴', '湿帘从洞边垂下，贴地黑火退到帘底。深处有什么踩着暗炭来回蹚，外缘凹坑里磨着黑砂。', [
  { label: '越过湿帘，向灰里投一颗石子', days: 0.25, enemy: 'ember_yak' },
  { ...gather('沿帘脚扫出暗金', '靠近时能看到黑砂发亮，别碰帘后舔木的暗火。', 'black_iron', 6, 1.25, '刮起不烧手的一层重砂，余炭重新盖过坑沿。'),
    guardedBy: 'ember_yak' },
  { label: '看看没冒烟的两个风孔', days: 0.25, insight: 5, outcome: '有人曾把测温的纸签挂在这里。一大一小两个孔离得很近，同时打开，下面的暗火就会停住。' },
], { once: [2], stocks: { black_iron: stock('帘脚的暗金', 9, 14, 10, 4, 1) }, creatures: { ember_yak: { start: 1, cap: 1, interval: 19, growth: 1 } },
  creatureText: { ember_yak: { present: '挨着窑脚传来踏炭声。', absent: '窑脚只有被扒短的灰垄。' } } });

scene('glass_bank', 'zhao_glass_net', '六角晒网', '网上晾着带刻度的碎琉璃和一盏浸水也不灭的旧灯。章老把几块轻的碎片摆在外头，看风往哪边吹。', [
  offer('修好灯座，向章老借灯', '灯座搁在网上，撑灯的横木已经开裂。', { ore: 5, wood: 5, core: 2 }, { lab_beacon: 1 }, -16,
    '章老拿撑渔网的杆子压了压新灯座。「去缺轮磨台，过了磨轮后站到岩壁边。哪条路反出两点光，就沿哪条去沉水量站。」'),
  gather('从碎琉璃中挑灵晶', '晒网旁的碎片里也有清澈的灵晶。', 'core', 4, 0.75, '你一片片挑出来，把表面的盐洗掉。'),
], { once: [0], stocks: { core: stock('滩中灵晶', 6, 10, 6, 3, 1) } });

scene('fault_lake', 'zhao_deep_pillars', '分水三柱', '水下石柱露出半截，第三柱的剑痕贴住石缝。有人反复在中柱掀起波，试图让两线水重新走到一起。', [
  { label: '从分水柱跳上残台', desc: '剑痕将石柱劈成两片，裂面是新的。', days: 0.25, enemy: 'fault_warden' },
  { label: '打开石台上的暗槽，取出旧文书', afterFight: 'fault_warden', days: 0.75, loot: { fault_receipt: 1 }, insight: 7,
    outcome: '水君退进湖底的石缝，水面安静下来。纸上记了三州的水位，也记了被淹过田的人家第二年怎么通船。' },
], { once: [1], creatures: { fault_warden: { start: 1, cap: 1, interval: 0, growth: 0 } },
  afterWinText: { fault_warden: '断裂的柱子渐渐沉下去，石台露了出来。台上有道夹文书的暗槽，一侧的盖子还钉着。' } });

scene('rope_sands', 'zhao_rope_sound', '沙坠顺风线', '有深有浅的石坠摆在沙洼外，每根探绳向下能拧出黑砂。一只水貂在背阴处翻刨细根。', [
  gather('牵出旧绳上的重砂', '挑那根还裹着水迹的，黑粒挂得密。', 'black_iron', 4, 1, '你把两段绳搓干，重砂从毛边筛了下来。'),
  { label: '顺足印去背阴处', days: 0.125, enemy: 'dyke_marten' },
], { stocks: { black_iron: stock('绳结里的暗金', 6, 11, 7, 3, 0) }, creatures: { dyke_marten: { start: 1, cap: 3, interval: 5, growth: 1, curve: 'wild' } } });

scene('burnt_weir', 'zhao_broken_rake', '三口相背的堰齿', '三根断石柱露在水面外。管水坝的楚棱扶着两根水尺，一边的水退到柱脚，他就抬尺读数。', [
  gather('从外侧石柱旁铲灵晶', '通向里面的路断了，外侧石柱边的白晶还够得着。', 'core', 6, 1.25, '铲下的灵晶沿水坝滑到浅滩，薄片之间还滴着水。'),
  { label: '把铜板上印下的水图给楚棱看', hidden: true, need: { phase_chart: 1 }, days: 0.5, loot: { fault_route: 1 }, insight: 5,
    outcome: '楚棱认出旧水槽的退水记号，把尺从布套里取出摊开。「湖底有三根柱子，一位修士守着残台。去过的人多半给赶回来了。下水前先看看从哪儿退。」' },
], { once: [1], stocks: { core: stock('断齿灵晶', 8, 14, 7, 4, 0) } });

scene('beacon_reefs', 'zhao_ferry_hook', '长礁灯脚', '清点货物的人往灯里添油，搁在灯下的船桨还粘着雾梁州的泥。礁石后常积着水冲来的沉木。', [
  gather('拖一捆靠浅礁的沉木', '灯脚的边缘能踩着，泥不及膝。', 'wood', 6, 1,
    '把木节拖到石条上晒了一会儿，滴水的部分留给后到的船。'),
  { label: '问什么货最等不得开渡', days: 0.125, insight: 3, outcome: '点货人把返潮的盐罐挪到一边。「湿谷多放一天就多坏几袋。先找好船工，哪条路能走，也给后来的船留句话。」' },
], { once: [1], stocks: { wood: stock('灯礁松木', 8, 13, 6, 4, 0) } });

scene('zhao_hermit', 'zhao_assay_tubs', '回水试槽', '两根管子往浅槽里滴水。一边有让水漫出去的矮口，另一边放着滤泥的罐。施荀把调水的木柄交给你，小陶罐还倒扣在桌上。', [
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
  desc: '守尺观替沿河人量水位。入门后做差事得功劳，功劳够了能领腰牌。访客也能歇脚切磋。', join: { need: { reed: 4, wood: 4 }, coins: 16 },
  jobs: [
    { id: 'gauge_posts', name: '换掉量水绳的断桩', desc: '去量水的人踩断了两根木桩。换好木桩和铁扣，才能重新拉绳量水。', need: { wood: 6, ore: 2 }, credit: 4, coins: 14, cooldown: 6 },
    { id: 'gauge_pillbox', name: '修好外出用的药箱', desc: '弟子从暴雨里捞回药箱，得用兽革重新包好，再补些灵草。', need: { reed: 7, hide: 3 }, credit: 6, coins: 22, cooldown: 9 },
    { id: 'gauge_silt', name: '备齐试水槽的灵晶和妖丹', desc: '傅澄想试试妖丹能不能稳住漏水处的阵法。他每天都要把浸水的材料取出来看看。', need: { core: 5, foundation_core: 1 }, credit: 10, coins: 29, cooldown: 12 },
  ],
  ranks: [
    { credit: 4, name: '替尺行走', reward: { ration: 5 }, art: 'level_hand' },
    { credit: 16, name: '河记执事', reward: { formula_gold_salve: 1, gold_salve: 2 }, art: 'lake_split' },
  ],
}];

const quests = [
  { id: 'zhao_sealed_load', region: 'zhao_city', name: '修好省潮司的水位尺', desc: '杜椿要固定秋天防涨水的那根高尺。两道寒铁箍和三个松木支脚都得换。',
    need: { wood: 6, ore: 4 }, reward: { ration: 4, salve: 2 }, coins: 23, insight: 5, requiresKnownMaterials: false,
    outcome: '你将支脚卸在城门尺档。杜椿说这一次先歇口气，真大水来，三个州的刻度迟早要一起结账。' },
  { id: 'zhao_joint_measure', region: 'zhao_city', name: '校准三州的水尺', reveal: { item: 'fault_receipt' },
    desc: '杜椿在等那份给三州分水的旧约。施荀要做三副铜夹，用同一股水把各州的刻度对齐。',
    need: { fault_receipt: 1, core: 10, ore: 12, wood: 8 }, reward: { gold_salve: 4 }, coins: 81, insight: 14,
    outcome: '三把尺并排浸进水槽，水痕终于挨成一条线。来借尺的货郎问杜椿：「按这把量，下游庄子哪天能收粮？我好把船给他们留一趟。」' },
];

export const zhaoContent = { regions, regionDetails, items, sites, events, enemies, sects, quests };
