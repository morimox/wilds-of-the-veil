const province = 'zhaoyuan';

const townStall = {
  type: '城池', inn: true,
  goods: { ration: { price: 4, start: 12, cap: 12, interval: 3 }, wood: { price: 5, start: 8, cap: 10, interval: 4 },
    salve: { price: 13, start: 5, cap: 6, interval: 4 }, ore: { price: 12, start: 6, cap: 8, interval: 4 },
    weir_knife: { price: 94, start: 1, cap: 1, interval: 18 } },
  buys: { reed: 2, ore: 5, core: 10, black_iron: 13, qi_core: 7, foundation_core: 21, gold_core: 37 },
  talk: { label: '问铁货商蒲霖柜上的旧秤', lead: 'market_scale_verse',
    outcome: '蒲霖把案上的寒铁挪开，拎出两枚验过的砣。「守尺观那架老秤要验两样。除了两头一样稳，右边两盘合起来也得六两。」他让你捎去压在秤脚下的票。' },
};
const hallStall = { type: '宗门', inn: true,
  goods: { ration: { price: 4, start: 8, cap: 10, interval: 4 }, heal_pill: { price: 27, start: 3, cap: 4, interval: 6 },
    leaf_pill: { price: 37, start: 2, cap: 3, interval: 7 }, clear_needle: { price: 4, start: 14, cap: 20, interval: 5 } },
  buys: { reed: 2, hide: 3, qi_core: 7, foundation_core: 21, gold_core: 37 } };

const landmarks = [
  ['zhao_city', '照原城', 13, 48, 0, 1.25, ['ford', 'green_dyke', 'flood_market', 'measuring_hall'], '城砖半边泛白，是上一回洪峰留下的痕。城门内有粥铺与省潮司。', { settlement: townStall, portal: true, array: true }],
  ['green_dyke', '青埂', 25, 29, 0, 0.75, ['frog_pond', 'old_marker', 'ring_isles'], '田埂上两列苇叶分迎上、下游，汛水只高过一侧。'],
  ['flood_market', '杨木水栈', 26, 62, 0, 0.75, ['crane_granary', 'zhao_pass', 'glass_bank'], '接船的案板浮在水线上。每一枚钉上挂着不同姓氏的货签。'],
  ['measuring_hall', '守尺观', 32, 45, 1, 1, ['old_marker', 'charcoal_ridge'], '乌瓦院门晾着测水绳，来客和弟子在同一间灶房用饭。', { settlement: hallStall, portal: true }],
  ['frog_pond', '蛙背塘', 36, 16, 0, 0.75, ['scale_bog'], '低草后有一排撮起泥土的响蛙，浮萍顺水可以走到塘的东边。'],
  ['old_marker', '没顶刻碑', 42, 28, 0, 1, ['zhao_hermit'], '半截石碑立在浅沟，水上能看见朝反方向刻的浪纹。'],
  ['zhao_hermit', '斜漏水驿', 51, 37, 1, 1, ['jade_mill'], '驿棚钉满别处借来的水尺，一支铁楔正压住桌角。', { portal: true }],
  ['ring_isles', '连环浅洲', 53, 14, 1, 1, ['beacon_reefs', 'glass_bank'], '碎洲只在浮草薄的时候露出石腰，步石间可以涉过去。'],
  ['scale_bog', '藻鳞泥浜', 54, 24, 2, 1.25, ['jade_mill', 'sunken_lab'], '细藻将泥中的铁砂裹住，有兽会从长满青膜的硬埂后窜出来。'],
  ['crane_granary', '白鹤粮仓', 31, 84, 0, 0.75, ['glass_bank'], '粮仓的木桩架得很高。漏下的谷壳被鸟衔走，枯木堆在后门。'],
  ['zhao_pass', '叠石驿关', 91, 62, 1, 1.25, ['rope_sands', 'mingsha_city'], '驿关背后是无树的长坂，领路人系着一串咬合的木牒。', { portal: true }],
  ['jade_mill', '缺轮磨台', 63, 36, 2, 1, ['sunken_lab', 'fault_lake'], '石磨只剩半只轮，磨眼靠着倒塌的浅渠。'],
  ['charcoal_ridge', '挂炭坳', 47, 50, 1, 1.25, ['night_pit', 'burnt_weir'], '炭袋在山坳晾潮。窑户掀开布角，越过那片焦红能看见很老的封窑。'],
  ['sunken_lab', '沉水量站', 66, 16, 4, 1.5, ['fault_lake'], '步阶分成朝水和朝岩的两列。水急时，新挂的导灯能指明哪条通向旧量槽。', { reveal: { item: 'lab_beacon' } }],
  ['night_pit', '烧黑的伏火坑', 57, 57, 5, 1.5, ['burnt_weir'], '炭坳后面连着横火道，湿帘能使空气不被暗火夺走。', { reveal: { item: 'fire_cloth' } }],
  ['glass_bank', '碎琉璃滩', 48, 72, 1, 1, ['beacon_reefs'], '琉璃多是浑色的，带刻度的那一片被人摆在晒网上。'],
  ['fault_lake', '错水湖底', 82, 27, 7, 1.75, ['burnt_weir'], '两线水分开绕过一枚石柱，柱底的剑痕比露在水面的深得多。', { reveal: { item: 'fault_route' } }],
  ['rope_sands', '拴绳沙洼', 77, 70, 2, 1.25, ['burnt_weir', 'beacon_reefs'], '探沙绳七步打一个结，绳的前端被沉在石坠里。'],
  ['burnt_weir', '断齿内堰', 74, 48, 3, 1.25, ['beacon_reefs'], '断齿排开的水道有窄有宽，灵晶在露水的堰齿间析出。'],
  ['beacon_reefs', '望船排礁', 72, 86, 1, 1.25, [], '远礁的灯将灭未灭，灯脚下拴着接货用的轻橹。'],
];

const regions = landmarks.map(([id, name, , , tier, travel, , desc, configuration = {}]) => ({
  id, name, tier, travel, desc, ...(configuration.reveal ? { reveal: configuration.reveal, secret: true } : {}),
}));
const regionDetails = Object.fromEntries(landmarks.map(([id, , x, y, , , links, , { reveal, ...features } = {}]) =>
  [id, { province, x, y, links, ...features }]));

const key = (id, name, desc) => ({ id, name, desc, kind: 'key', price: 0, sell: 0 });
const items = [
  key('return_tide_note', '倒行水痕拓样', '旧碑背面向西刻了退水时的波线。斜漏驿桌上同样的裂隙中压着一件铁物。'),
  key('zhao_sand_chit', '漏潮货签', '晒网客从秋季货簿摘下的签条。正面是叠石关柯伯的花押，尾端系着省潮司缺口。'),
  key('lab_beacon', '靠岩导灯', '量水司借出的小灯。挂低后，和旧站量标相同的一侧会反射两点光。'),
  key('fire_cloth', '浸炭湿帘', '炭户用草汁泡过的短帘。沿封窑旧钩铺下，可以割断贴地暗火。'),
  key('fault_route', '错水折尺', '尺上刻了坡边无风、潮面低回时的三处沉柱。入错水湖靠它辨水底。'),
  key('fault_receipt', '留水底印', '错水湖底的笺槽压着一页分水旧议。署名的不是主事修士，而是沿途三户撑船人。'),
  key('body_breath_note', '扶膝起身帖', '傅澄给访客的一页旧讲义。倒向地面时先稳住呼吸，起身用脚底与腰背一起发力。'),
  key('market_scale_verse', '铁货秤脚票', '蒲霖从照原城的货秤下取出的双盘验票。两端相平后，右边两只小盘合重须合六两。'),
];

const attack = (name, mult = 1) => ({ kind: 'attack', name, mult });
const heavy = (name, mult = 1.55) => ({ kind: 'heavy', name, mult });
const enemies = [
  { id: 'dyke_marten', name: '黄沿水貂', tier: 0, hp: 22, atk: 7, def: 2, tags: ['furred'], insight: 2,
    intents: [attack('贴埂撕咬'), heavy('扑断脚步', 1.4)], loot: { beast_meat: 2, hide: 1, qi_core: 1 } },
  { id: 'glass_frog', name: '火斑大蛙', tier: 1, hp: 33, atk: 10, def: 3, tags: ['beast'], insight: 3,
    intents: [attack('扬舌甩泥'), attack('鼓腮撞顶', 1.1), heavy('缩腹后弹')], loot: { beast_meat: 3, beast_eye: 1, qi_core: 2 } },
  { id: 'mud_shrike', name: '泥鳞鬃犬', tier: 3, hp: 73, atk: 15, def: 7, tags: ['furred', 'beast'], insight: 4,
    intents: [attack('摆尾抽脚'), heavy('压低鬃毛'), { kind: 'guard', name: '尾巴卷作一环' }, attack('贴地扯咬', 1.12)],
    loot: { beast_meat: 5, hide: 3, foundation_core: 1 } },
  { id: 'lab_crawler', name: '槽背水魁', tier: 4, hp: 95, atk: 18, def: 8, tags: ['stoneborn'], insight: 8,
    intents: [attack('撑槽扬砂'), { kind: 'drain', name: '铜槽咕噜吐气', mult: 1.15 }, heavy('翻甲压水', 1.57), { kind: 'guard', name: '伏进两道石槽' }],
    loot: { beast_eye: 1, foundation_core: 3 } },
  { id: 'ember_yak', name: '伏灰炭魈', tier: 6, hp: 119, atk: 24, def: 10, tags: ['furred'], insight: 9,
    intents: [attack('踏碎灰层'), heavy('抱地窜起', 1.63), attack('甩尾卷火', 1.12), { kind: 'guard', name: '护住抱在胸前的灰团' }],
    loot: { beast_meat: 7, hide: 4, gold_core: 1 } },
  { id: 'fault_warden', name: '分柱水君', tier: 7, hp: 163, atk: 29, def: 13, tags: ['spirit'], insight: 16,
    intents: [attack('踏柱拍岸'), { kind: 'guard', name: '背过双肘令水归柱' }, heavy('收起两面水刃', 1.59),
      { kind: 'drain', name: '引一线水声摄气', mult: 1.17 }, attack('顺回潮斜劈', 1.1)], loot: { beast_eye: 2, gold_core: 4 } },
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
  { label: '问两本账的来历', days: 0.125, insight: 3, outcome: '杜椿说，落灯去年报过停航。他查了旧账，旧站的汛线竟比眼前低半杖。请你有空到斜漏水驿问问施荀。' },
  { label: '把盐炉副册给杜椿看', hidden: true, need: { cold_kiln_record: 1 }, days: 0.25, insight: 5,
    outcome: '杜椿看得很慢。「同一晚，雾梁涨、鸣沙退，照原下沉，账没错。施荀的量槽能把那晚缩成一碗水。」' },
], { once: [0, 1] });

scene('green_dyke', 'zhao_dyke_bend', '两面低埂', '晒席垂在靠水一面，低埂后有新鲜的抓土。老堤工把看涨水的石碑指出来，才发现碑已经歪了。', [
  gather('掐浅水白芽', '贴席的水不及鞋面。', 'reed', 4, 0.5, '从还没伸叶的老根上掐下了几束白芽。'),
  { label: '到抓痕处守一阵', desc: '泥土下面有厚实的碎蚌壳，咬一口的痕迹还新。', days: 0.125, enemy: 'dyke_marten' },
  { label: '扶堤工把晴雨旗拉起来', days: 0.5, insight: 3, coins: 8, outcome: '雨旗刚拉高，河工停下手头的活指向青埂北边。「那面碑刻过旧汛线，常有人来找。」他把埂工钱与你分了。' },
], { stocks: { reed: stock('白芽', 6, 9, 4, 3, 0) }, creatures: { dyke_marten: { start: 1, cap: 3, interval: 4, growth: 1, curve: 'wild' } }, once: [2] });

scene('flood_market', 'zhao_float_goods', '三姓木码头', '船腹贴着木台，案板上压着断开的账签。管晒网的余节翻着旧簿找去鸣沙的号码。', [
  offer('帮余节补一副晒网撑', '旧撑断了一根，晒到一半的网粘在船头。', { wood: 5 }, { zhao_sand_chit: 1 }, 0,
    '余节把晒网支好，挑出一条足斤足两的整鱼送去鱼档。「过叠石关就递我的签，那里识得这个印。」'),
  gather('收起挂货签的松桩枝', '浮木撞断的枝条在台下晃。', 'wood', 4, 0.5, '抽回台下干松枝，掰掉泡烂的皮。'),
], { once: [0], stocks: { wood: stock('晒台松枝', 5, 9, 4, 3, 1) } });

scene('measuring_hall', 'zhao_bamboo_duel', '竹尺庭', '傅澄闭眼用竹尺轻拨石珠。无门籍的访客也能在碎砖圈里举木棍试招，圈外有人持尺扶人。', [
  { label: '请傅澄讲练尺的事', days: 0.125, insight: 3, loot: { body_breath_note: 1 },
    outcome: '他把竹尺靠回台沿。「刚来的人先稳脚。」他教你从低木凳扶膝起身，再把沾了汗渍的讲义给你。「想学站得稳的法子，得先给庭里添一袋压脚石。」' },
  { label: '进碎砖圈试手', desc: '只要腿弯沾了地，外侧弟子就会上前拦下竹尺。', days: 0.125, enemy: 'zhao_spar', outcome: '弟子把回身的木门合上，傅澄换了一根没钉铜片的竹尺。' },
], { once: [0], protectedArena: true, creatures: { zhao_spar: { start: 1, cap: 1, interval: 6, growth: 1 } } });

scene('frog_pond', 'zhao_frog_shelf', '斜萍石窝', '塘边低石凹成半面锅，火斑蛙喜欢离浅水不远的那一坑。外圈几条水藻缠着细枝。', [
  { label: '上低石看蛙', desc: '水面有格外宽的气泡。', days: 0.125, enemy: 'glass_frog' },
  gather('从外圈提灵草', '过水石拢住了几丛新芽。', 'reed', 5, 0.75, '把根上的泥抖进水里，叶片在风里晾了一会儿。'),
], { stocks: { reed: stock('外圈灵草', 7, 11, 5, 3, 1) }, creatures: { glass_frog: { start: 2, cap: 4, interval: 4.5, growth: 1, curve: 'wild' } } });

scene('old_marker', 'zhao_retreat_marks', '倒行刻碑', '碑上正面向河，刻的一律是涨水，背面朝着另一头，斜刀口里有水从低往高爬的线。', [
  { label: '揭开碑背垫着的湿纸', days: 0.5, loot: { return_tide_note: 1 }, insight: 4,
    outcome: '碑角钉着施荀的名字，纸上的折线从照原一直退回白苇。你把递给他的那份取了下来。' },
  gather('淘洗碑脚水下的铁粒', '打坯人淘过石底，细铁砂从阶缝聚到泥眼里。', 'ore', 4, 0.75, '把细砂搓掉，光铁像稻粒一样粘在掌心。'),
], { once: [0], stocks: { ore: stock('碑脚寒铁砂', 7, 11, 5, 3, 1) } });

scene('zhao_hermit', 'zhao_leak_bench', '斜漏驿棚', '施荀把两只漏斗放在桌上试着接水。左边铁楔勾住斗足，风实在很大。', [
  offer('出示碑的背拓，给施荀换块楔台', '他一手压着漏斗，木台的裂指已经够塞进两指。',
    { return_tide_note: 1, wood: 6, ore: 3 }, { undertow_wedge: 1 }, 0,
    '施荀把磨铁楔放在掌上比给你看，你替他把捆来的木铁顶到漏斗下。他把拓稿卷好收进驿册。「退潮时门向里开。楔的凹筋朝外，回白苇看石缝里的楔眼。」'),
  { label: '听他讲并排的两股水', days: 0.125, insight: 3, outcome: '施荀松开捏着的管，桌边的水滴就能一颗一颗落下。「两股水看着同样快，可得一滴追一滴才行。老量站原本留了铜样。」' },
], { once: [0, 1] });

scene('ring_isles', 'zhao_isle_reeds', '浮洲松根', '打弯的浅水只冲倒过松的一边，另一侧的沉根压着几团水晶。', [
  gather('割松根上的干片', '古根裸露在水外，指尖能扣住松动的片。', 'wood', 5, 0.75, '把贴着根的干片横扭下来。'),
  gather('掏水下亮晶', '踩稳裸根，泥泡下面还粘着一些晶粒。', 'core', 4, 1, '把沾泥的晶粒冲到粗布上去。'),
], { stocks: { wood: stock('洲上老松', 7, 11, 5, 3, 0), core: stock('沉根灵晶', 5, 8, 6, 3, 1) } });

scene('scale_bog', 'zhao_scales', '青膜硬埂', '硬埂上的毛在绿水外一绺一绺。泥砂顺两边都往低处聚，旁边有一条小浅湾。', [
  { label: '踏硬埂寻鬃犬', desc: '那条埂不晃，但兽会从低藻下面窜出来。', days: 0.25, enemy: 'mud_shrike' },
  { ...gather('挖浅湾的铁砂', '靠脚尖可以伸到岸旁。', 'ore', 6, 1, '淘到许多被藻絮裹住的寒铁。'),
    ambush: { enemy: 'mud_shrike', chance: 0.3, outcome: '绿膜下蓦地撞起一脸泥，一只鬃犬跳到浅湾边堵住了你的手。' } },
], { stocks: { ore: stock('藻下铁砂', 8, 12, 5, 4, 1) }, creatures: { mud_shrike: { start: 1, cap: 3, interval: 7, growth: 1, curve: 'wild' } } });

scene('crane_granary', 'zhao_grain_ladder', '高脚粮仓', '木梯一脚开裂。何绢只好坐在谷壳里等补梯人，旁堆晒干的短木是不能打榫的料。', [
  offer('替何绢包紧梯脚', '她抬起一块烂底，问有没有兽皮能缠住梯端。', { hide: 2, wood: 2 }, { ration: 6 }, 12,
    '绑牢后，何绢自己提米上梯。下来说每年水涨，仓里总得腾几格给湿粮，如今可先包走几枚旧粮饼。'),
  gather('收后门碎松木', '碰散的木草已经晒干。', 'wood', 5, 0.75, '把薄片拢进臂弯。仓役在檐下耙开下一堆簸剩的榫头。'),
], { once: [0], stocks: { wood: stock('粮仓碎松', 8, 12, 6, 4, 1) } });

scene('zhao_pass', 'zhao_ridge_permit', '青瓦验牒房', '柯伯把大牒拨转看看，雨刚过，前队有两副绳架需要换。牒房的铃在鸣沙一侧也能听到。', [
  offer('把余节的签给柯伯，补一截绳架', '他从檐下指出两条起毛的绳。', { zhao_sand_chit: 1, hide: 3, wood: 4 },
    { sand_writ: 1 }, -11, '柯伯从四根小柱上换下绳架，把两州都认得的小牒交给你。「远路过了浅石滩就少水。跟住下一趟带铃的骡车。」'),
  { label: '隔关听骡铃', days: 0.125, insight: 2, outcome: '一声铃从石隙深处转出来。柯伯说鸣沙城把新绳价写在城门，冲坏的井也还等人修。' },
], { once: [0, 1] });

scene('jade_mill', 'zhao_old_wheel', '横卧的半边磨轮', '磨眼横着，底下有一条水流不过去的弯。老浮石挤在屋脚，两枚硬晶夹在石缝。', [
  gather('把石脚的灵晶抠出来', '街外磨台已经没人轮值，脚下的水也很慢。', 'core', 5, 1,
    '你撬裂了两块浮石，夹在其中的灵晶正好随水滚下来。'),
  { label: '查看磨轮背后的牌', days: 0.25, insight: 3, outcome: '牌上说导灯挂在磨轮下面时会在靠岩一侧照出两点。箩筐商把它同破器一起带去了琉璃滩的晒网。' },
], { once: [1], stocks: { core: stock('磨轮灵晶', 8, 12, 6, 4, 0) } });

scene('charcoal_ridge', 'zhao_firedoor', '斜封窑棚', '窑主马荻在洞口铺湿帘。山坳的余火可贴地窜出，入里先要领草汁帘，再把封口松下来。', [
  offer('给马荻一包湖泥和兽革', '帘绳断了，帘下的接缝烤得发红。', { kiln_clay: 5, hide: 3, reed: 5 }, { fire_cloth: 1 }, -8,
    '马荻抹泥封住侧缝，扔给你另一面湿帘。「里面那只会把炭抱在身下起跳。你要真敢去，别挡它靠洞口那边。」'),
  gather('捡晾棚的松枝头', '被雨打湿的整炭仍在袋里，棚外松尖晾得干。', 'wood', 5, 0.75, '轻推棚角，掉下来一些没熏透的松尖。'),
], { once: [0], stocks: { wood: stock('炭棚松枝', 7, 12, 5, 4, 1) } });

scene('sunken_lab', 'zhao_submerged_table', '占着量槽的石背', '低挂的导灯亮起两点。铜槽一边溅水，一边有东西用肩顶住出水眼，侧边旧样仍固定在槽里。', [
  { label: '沿照亮的石槽接近水魁', days: 0.25, enemy: 'lab_crawler' },
  { label: '松开槽中铜样的旧销', afterFight: 'lab_crawler', days: 0.75, loot: { phase_chart: 1 }, insight: 6,
    outcome: '水魁退向山裂，另一端终于抬高。铜样背面标着水滴间隔。你拓完，把已经脱出的铜版留还在量站。' },
  gather('在外围收晶屑', '灯旁有一块高台，槽里的水挤不到这边。', 'core', 7, 1.25, '干台的一层短晶透过水汽露出了棱。'),
], { once: [1], stocks: { core: stock('量槽外晶屑', 9, 15, 8, 4, 2) }, creatures: { lab_crawler: { start: 1, cap: 1, interval: 0, growth: 0 } },
  afterWinText: { lab_crawler: '低挂的导灯亮起两点。传水的槽终于能抬起铜边，水魁已经退进再深些的岩裂。' } });

scene('night_pit', 'zhao_bank_fire', '赤泥横穴', '湿帘从洞边垂下，贴地黑火退到帘底。深处有什么踩着暗炭来回蹚，外缘凹坑里磨着黑砂。', [
  { label: '越过湿帘，向灰里投一颗石子', days: 0.25, enemy: 'ember_yak' },
  { ...gather('沿帘脚扫出暗金', '靠近时能看到黑砂发亮，别碰帘后舔木的暗火。', 'black_iron', 6, 1.25, '刮起不烧手的一层重砂，余炭重新盖过坑沿。'),
    guardedBy: 'ember_yak' },
  { label: '看看无烟的一面火孔', days: 0.25, insight: 5, outcome: '有人曾在冷火口挂签测温。粗孔与细孔隔着半掌，同时敞开时，反而可以停住下面的暗焰。' },
], { once: [2], stocks: { black_iron: stock('帘脚的暗金', 9, 14, 10, 4, 1) }, creatures: { ember_yak: { start: 1, cap: 1, interval: 19, growth: 1 } },
  creatureText: { ember_yak: { present: '挨着窑脚传来踏炭声。', absent: '窑脚只有被扒短的灰垄。' } } });

scene('glass_bank', 'zhao_glass_net', '六角晒网', '有刻度的琉璃和一只水底不灭的旧灯排在网上。絮滩人章老一直用破琉璃校看风。', [
  offer('修灯座，向章老借量水灯', '灯座粘在网上，开裂的灯梁需要补一把。', { ore: 5, wood: 5, core: 2 }, { lab_beacon: 1 }, -16,
    '章老用磨掉的网梃试了支座。「大图西边那个磨轮。过了磨轮立到挨岩的一列，两点光会把你领去沉水量站。」'),
  gather('拣崩落的无刻琉璃', '晒网旁的碎琉璃里也有清澈的灵晶。', 'core', 4, 0.75, '一片片挑出来，拿细水把残盐洗掉。'),
], { once: [0], stocks: { core: stock('滩中灵晶', 6, 10, 6, 3, 1) } });

scene('fault_lake', 'zhao_deep_pillars', '分水三柱', '水下石柱露出半截，第三柱的剑痕贴住石缝。有人反复在中柱掀起波，试图让两线水重新走到一起。', [
  { label: '从分水柱跳上残台', desc: '剑痕将石柱劈成两片，裂面是新的。', days: 0.25, enemy: 'fault_warden' },
  { label: '从晒水台打开旧议笺槽', afterFight: 'fault_warden', days: 0.75, loot: { fault_receipt: 1 }, insight: 7,
    outcome: '水君退进湖缝后，柱影没再砸向滩头。你拿起那页旧议，见记录的不只是三州水刻，还写着失过田的人来年怎样通船。' },
], { once: [1], creatures: { fault_warden: { start: 1, cap: 1, interval: 0, growth: 0 } },
  afterWinText: { fault_warden: '石柱裂口逐渐沉到水下。晒水台露出来，风从笺槽钉死的那一面吹过。' } });

scene('rope_sands', 'zhao_rope_sound', '沙坠顺风线', '有深有浅的石坠摆在沙洼外，每根探绳向下能拧出黑砂。一只水貂在背阴处翻刨细根。', [
  gather('牵出旧绳上的重砂', '挑那根还裹着水迹的，黑粒挂得密。', 'black_iron', 4, 1, '你把两段绳搓干，重砂从毛边筛了下来。'),
  { label: '顺足印去背阴处', days: 0.125, enemy: 'dyke_marten' },
], { stocks: { black_iron: stock('绳结里的暗金', 6, 11, 7, 3, 0) }, creatures: { dyke_marten: { start: 1, cap: 3, interval: 5, growth: 1, curve: 'wild' } } });

scene('burnt_weir', 'zhao_broken_rake', '三口相背的堰齿', '三道断齿露在水外。老堰工楚棱挽着两侧水尺，每次抬尺只等其中一面水落到柱脚。', [
  gather('从堰齿旁铲晶壳', '路是断开的，外齿边的白壳仍能铲到。', 'core', 6, 1.25, '折断的晶壳顺堰滑到浅滩，层间还留一股清潮。'),
  { label: '把量槽的铜样给楚棱辨认', hidden: true, need: { phase_chart: 1 }, days: 0.5, loot: { fault_route: 1 }, insight: 5,
    outcome: '楚棱认出旧槽的退水刻痕，把藏在套里的折尺摊开。「湖底有三根柱子，一位修士守着残台。过去的人多半是被他赶走的。进的时候先认退路。」' },
], { once: [1], stocks: { core: stock('断齿灵晶', 8, 14, 7, 4, 0) } });

scene('beacon_reefs', 'zhao_ferry_hook', '长礁灯脚', '点货人往灯脚续油，轻橹上还粘着雾梁州的泥。灯外的礁窝长期浮着沉木。', [
  gather('拖一捆靠浅礁的沉木', '灯脚的边缘能踩着，泥不及膝。', 'wood', 6, 1,
    '把木节拖到石条上晒了一会儿，滴水的部分留给后到的船。'),
  { label: '问什么货最怕关渡', days: 0.125, insight: 3, outcome: '点货人把带水气的盐罐挪到一边。「湿谷等不起。先过来找好攒绳的人，再把能通的路留给后面的船。」' },
], { once: [1], stocks: { wood: stock('灯礁松木', 8, 13, 6, 4, 0) } });

scene('zhao_hermit', 'zhao_assay_tubs', '回水试槽', '两道旧漏口架在小槽上，一边有低溢口，一边有筛罐。施荀让出了手边的扳板，瓦胆还扣在桌上。', [
  { label: '看斜漏台上的冷釉', days: 0.125, insight: 3, outcome: '旁边碎罐裂了半面，细盐刚贴上温釉就先圈住底边，等凉透再放盐便散不开。他说验方的人得把三地的实物一同带来。' },
], { once: [0] }, {
  id: 'gold_assay', desc: '你把带来的泥、盐和旧簿放在槽边。施荀递给你一根拨针，去边案磨笔等结果。',
  need: { cold_kiln_record: 1, phase_chart: 1, heart_silt: 1, stillwell_salt: 1 }, days: 1.25, insight: 13,
  controls: [
    { id: 'fall', label: '调落水', options: [{ id: 'pulse', label: '一股推得急些' }, { id: 'even', label: '两侧匀着滴' }] },
    { id: 'salt', label: '何时下井盐', options: [{ id: 'cool', label: '瓦胆凉透再下' }, { id: 'warm', label: '趁瓦胆还温便下' }] },
  ],
  solution: { fall: 'even', salt: 'warm' },
  misses: { fall: { pulse: '急水从溢口抽进第二道槽，把石泥卷起来。原本要分开的两道浊、清水反而混了。' },
    salt: { cool: '水已经稳了。碰上凉透的瓦胆，井盐只剩一坨小晶，接触到的那一圈水没能凝住。' } },
  reward: { gold_formula: 1 },
  outcome: '筛罐沉下泥浆，温釉咬住一道盐圈。施荀把刚才的温度、用料与水量写进方页，又让你把可留作正炉用的东西小心收好。',
});

const sects = [{ id: 'water_gauge', region: 'measuring_hall', name: '守尺观',
  desc: '守尺观替沿河人测水，腰牌按出力领。访客也能歇脚试招。', join: { need: { reed: 4, wood: 4 }, coins: 16 },
  jobs: [
    { id: 'gauge_posts', name: '补汛绳桩', desc: '山门送尺的人折了两个桩脚，先换湿木，再补测水线。', need: { wood: 6, ore: 2 }, credit: 4, coins: 14, cooldown: 6 },
    { id: 'gauge_pillbox', name: '重封行药匣', desc: '暴雨里乱跑的弟子捞回药匣，行走的灵草和兽革得重新缝起。', need: { reed: 7, hide: 3 }, credit: 6, coins: 22, cooldown: 9 },
    { id: 'gauge_silt', name: '给旧槽备试件', desc: '傅澄想看看妖丹在渗漏处能稳住几分阵脚，须按日把试件从水取出。', need: { core: 5, foundation_core: 1 }, credit: 10, coins: 29, cooldown: 12 },
  ],
  ranks: [
    { credit: 4, name: '替尺行走', reward: { ration: 5 }, art: 'level_hand' },
    { credit: 16, name: '河记执事', reward: { formula_gold_salve: 1, gold_salve: 2 }, art: 'lake_split' },
  ],
}];

const quests = [
  { id: 'zhao_sealed_load', region: 'zhao_city', name: '给省潮司补桩箍', desc: '杜椿要固定秋汛尺。尺桩长得高，坏的是两道寒铁箍和三个松木支脚。',
    need: { wood: 6, ore: 4 }, reward: { ration: 4, salve: 2 }, coins: 23, insight: 5, requiresKnownMaterials: false,
    outcome: '你将支脚卸在城门尺档。杜椿说这一次先歇口气，真大水来，三个州的刻度迟早要一起结账。' },
  { id: 'zhao_joint_measure', region: 'zhao_city', name: '把三州的水尺归到同一刻', reveal: { item: 'fault_receipt' },
    desc: '杜椿在等失水田的旧议。施荀要做三副铜夹，照着同一滴水校准各州更次。',
    need: { fault_receipt: 1, core: 10, ore: 12, wood: 8 }, reward: { gold_salve: 4 }, coins: 81, insight: 14,
    outcome: '省潮司把三副刻尺摆到同一道檐下。点货人来借尺时，先问的不是自己能装多少，而是下一村今年哪天收粮。' },
];

export const zhaoContent = { regions, regionDetails, items, sites, events, enemies, sects, quests };
