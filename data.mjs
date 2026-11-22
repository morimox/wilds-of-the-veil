const realms = [
  { id: 0, name: '炼气', hp: 30, qi: 12, atk: 8, def: 2, insight: 0, cost: 0, need: {}, pressure: 1, days: 0 },
  { id: 1, name: '筑基', hp: 43, qi: 17, atk: 11, def: 4, insight: 10, cost: 18, need: { reed: 2 }, pressure: 0.76, days: 1 },
  { id: 2, name: '凝丹', hp: 58, qi: 23, atk: 15, def: 6, insight: 23, cost: 35, need: { ore: 2, core: 1 }, pressure: 0.74, days: 2 },
];

const items = [
  { id: 'ration', name: '干粮', kind: 'material', price: 3, sell: 1, desc: '上路和处理野外事务要用的口粮。' },
  { id: 'wood', name: '松枝', kind: 'material', price: 3, sell: 1, desc: '引火温药，也能充作绘符的符骨。' },
  { id: 'reed', name: '白苇芯', kind: 'material', price: 8, sell: 3, desc: '白苇滩浅水所得，可调药，也可用在筑基时。' },
  { id: 'hide', name: '泥蜕', kind: 'material', price: 7, sell: 3, desc: '从泥鳞兽身上取得的韧皮，可制护具。' },
  { id: 'ore', name: '寒铁', kind: 'material', price: 13, sell: 5, desc: '沉钟岭废矿中出产的寒铁，可制器，也可用于凝丹。' },
  { id: 'core', name: '回声石心', kind: 'material', price: 0, sell: 9, desc: '沉钟岭的咒音凝成的石心，可用于凝丹。' },
  { id: 'sand', name: '潮砂', kind: 'material', price: 14, sell: 6, desc: '闭潮渡退水后留下的细砂，入药或研作符墨。' },
  { id: 'seal', name: '镇渡印', kind: 'material', price: 0, sell: 0, desc: '闭潮渡守潮灵遗落的渡印，落灯村有人认得它。' },
  { id: 'ridge_rubbing', name: '钟纹拓片', kind: 'key', price: 0, sell: 0, desc: '苇滩渡工拓下旧钟的纹路，图边有一笔进山的记号。' },
  { id: 'ford_chart', name: '旧渡水图', kind: 'key', price: 0, sell: 0, desc: '上面画着废矿与旧渡之间的水路，尚可辨认。' },
  { id: 'echo_note', name: '听山手记', kind: 'key', price: 0, sell: 0, desc: '记录岩腹回音与行气的几页纸，边缘有余火燎过的痕迹。' },
  { id: 'tide_note', name: '闸边拓痕', kind: 'key', price: 0, sell: 0, desc: '拓下的洪痕随墨色深浅起伏，可以比照出潮来的节律。' },
  { id: 'kiln_shard', name: '反字残瓦', kind: 'key', price: 0, sell: 0, desc: '白苇滩旧柴窝的底瓦上反写着「两叩一停」。瓦角的凹弧像件破铃的沿。' },
  { id: 'bell_clapper', name: '带结的铃舌', kind: 'key', price: 0, sell: 0, desc: '石龛深处的铃舌，系着个渡工用的反手绳结。旧船的缆上多半还留着同样的结。' },
  { id: 'backwash_mark', name: '倒潮刻样', kind: 'key', price: 0, sell: 0, desc: '循船底旧槽印下的凹纹。凹纹与苇滩残瓦的反字相背，隔着火照时恰好拼拢。' },
  { id: 'secret_pass', name: '伏流路引', kind: 'key', price: 0, sell: 0, desc: '三处旧物留下的水路，须等岸边灯影逆流时循水行进。' },
  { id: 'reed_lines', name: '苇滩水线图', kind: 'key', price: 0, sell: 0, desc: '水位升降过几回，浮沫的位置不定。露头石后总有一弯绕回来的细水纹。' },
  { id: 'oar_mark', name: '渡工靠岸记', kind: 'key', price: 0, sell: 0, desc: '渡工换过三处系船桩。不同的水位下，石背内弯是唯一一处不必顶着水划的地方。' },
  { id: 'eddy_note', name: '回汊图', kind: 'key', price: 0, sell: 0, desc: '把水线和靠船的位置叠在一起画出的回流路线，可以据此制符。' },
  { id: 'stone_rubbing', name: '石龛音痕', kind: 'key', price: 0, sell: 0, desc: '记录一声轻叩后石屑落下的位置。第二声回音到了背面，暗缝才有松动。' },
  { id: 'echo_method', name: '返声行气稿', kind: 'key', price: 0, sell: 0, desc: '按石龛的两声回音画出的吐纳节拍，可拿它向懂行气的人请教。' },
  { id: 'backwash_theory', name: '照影水路图', kind: 'key', price: 0, sell: 0, desc: '沙盘上拼出的水路假说。从苇滩旧柴窝用炉火照读即可验明方向。' },
  { id: 'dry_wick', name: '无烟灯芯', kind: 'material', price: 0, sell: 8, reveal: { item: 'secret_pass' }, desc: '回灯埠所存的旧灯芯，浸了一夜也能燃。' },
  { id: 'lamp_sketch', name: '灯夫手势', kind: 'key', price: 0, sell: 0, reveal: { item: 'secret_pass' }, desc: '风口那名灯夫划出的两道弧，记录一式护灯的手势。' },

  { id: 'cudgel', name: '枣木杖', kind: 'gear', price: 5, sell: 2, desc: '行路探泥和近身抵挡都用得上。' },
  { id: 'knife', name: '割苇短刀', kind: 'gear', price: 16, sell: 7, reveal: { item: 'reed' }, desc: '巡滩人的短刀，轻便，刃口薄。' },
  { id: 'reed_bow', name: '苇弦弓', kind: 'gear', price: 0, sell: 8, desc: '将削薄的苇片贴在韧木上制成的猎弓。' },
  { id: 'iron_sword', name: '寒铁剑', kind: 'gear', price: 33, sell: 14, desc: '用沉钟岭的铁打成，兼顾出手和耐用。' },
  { id: 'tide_spear', name: '分潮枪', kind: 'gear', price: 57, sell: 25, desc: '闭潮渡的旧式枪，适合在开阔地先发制人。' },
  { id: 'straw_cape', name: '蓑衣', kind: 'gear', price: 6, sell: 2, desc: '挡潮气，也能缓掉浅处的抓咬。' },
  { id: 'hide_coat', name: '泥蜕褂', kind: 'gear', price: 18, sell: 7, desc: '泥蜕内衬柔韧，适合滩地的持久战。' },
  { id: 'iron_coat', name: '叠铁袍', kind: 'gear', price: 33, sell: 14, desc: '用寒铁片缝出护心和护肩。' },
  { id: 'tide_coat', name: '定潮甲', kind: 'gear', price: 55, sell: 24, desc: '潜到深处才显本事的沉甲。' },
  { id: 'reed_charm', name: '苇哨结', kind: 'gear', price: 8, sell: 3, reveal: { item: 'oar_mark' }, desc: '编作腰佩，发急时能稳住气息。' },
  { id: 'path_charm', name: '认路钱', kind: 'gear', price: 15, sell: 6, desc: '半枚打过眼的渡钱，挂着它好找回头路。' },
  { id: 'bell_charm', name: '定声铃', kind: 'gear', price: 29, sell: 12, desc: '贴身佩戴的哑铃，可以收住散乱真气。' },
  { id: 'tide_charm', name: '避潮玉', kind: 'gear', price: 43, sell: 18, reveal: { item: 'sand' }, desc: '潮高时会微微发烫，提醒佩戴者提早抽身。' },
  { id: 'jetty_charm', name: '回灯坠', kind: 'gear', price: 0, sell: 17, reveal: { item: 'secret_pass' }, desc: '以无烟灯芯束成的挂坠。险中看着一线灯影，仍能辨认来路。' },

  { id: 'salve', name: '松脂膏', kind: 'pill', price: 6, sell: 2, desc: '便宜的应急药，可恢复少量气血。' },
  { id: 'qi_powder', name: '回气散', kind: 'pill', price: 6, sell: 2, desc: '服下便觉气息渐复，留神积毒。' },
  { id: 'grain_pill', name: '暖谷丸', kind: 'pill', price: 7, sell: 3, desc: '返程时拿来顶一顿的压缩口粮。' },
  { id: 'heal_pill', name: '合络丹', kind: 'pill', price: 11, sell: 4, desc: '兼治气血亏空和伤势。' },
  { id: 'detox_pill', name: '清露丸', kind: 'pill', price: 9, sell: 3, desc: '减轻服药累积的丹毒。' },
  { id: 'focus_pill', name: '定息丹', kind: 'pill', price: 12, sell: 5, desc: '收拢散乱的气息，使下一次术法伤害增加3点。' },
  { id: 'tide_pill', name: '济潮丹', kind: 'pill', price: 19, sell: 8, desc: '气血与真气一并恢复，药力很重。' },

  { id: 'ember_talisman', name: '燃枝符', kind: 'talisman', price: 7, sell: 3, desc: '捻断即燃，在硬拼之前可先破对方阵脚。' },
  { id: 'reed_talisman', name: '遮痕符', kind: 'talisman', price: 7, sell: 3, desc: '散开一阵苇雾，有利于脱身。' },
  { id: 'bank_talisman', name: '回汊符', kind: 'talisman', price: 0, sell: 4, reveal: { item: 'eddy_note' }, desc: '借回流挪开半步，便能离开对手出手的方向。' },
  { id: 'iron_talisman', name: '铁障符', kind: 'talisman', price: 12, sell: 5, desc: '在身前撑起一面短暂的铁障。' },
  { id: 'tide_talisman', name: '逆潮符', kind: 'talisman', price: 19, sell: 8, desc: '借潮砂的回劲攻敌，余势还能护身。' },
];

const gear = [
  { id: 'cudgel', slot: 'weapon', tier: 0, atk: 1, def: 0, hp: 0, qi: 0, retreat: 0, durability: 26, repair: 3, entry: '寻常行杖。出手稳当，力道偏轻，适合刚出门的散修。' },
  { id: 'knife', slot: 'weapon', tier: 0, atk: 3, def: 0, hp: 0, qi: 0, retreat: 0, durability: 30, repair: 5, entry: '利落的凡制短刃。薄刃能从鳞缝里切进去，打披鳞的敌人时容易破防。', trait: { kind: 'pierce', enemyTag: 'scaled', bonus: 2 } },
  { id: 'reed_bow', slot: 'weapon', tier: 0, atk: 2, def: 0, hp: 0, qi: 0, retreat: 0, durability: 28, repair: 4, entry: '寻常猎弓，弓力温和。射入厚毛的箭不易滑脱，出手时对带皮毛的野兽格外有效。', trait: { kind: 'damage', enemyTag: 'furred', bonus: 4 } },
  { id: 'iron_sword', slot: 'weapon', tier: 1, atk: 5, def: 1, hp: 0, qi: 0, retreat: 0, durability: 38, repair: 8, entry: '筑基修士使得稳的实用剑。剑身厚实，斩击沉稳，架住来招也可靠。' },
  { id: 'tide_spear', slot: 'weapon', tier: 2, atk: 8, def: 0, hp: 0, qi: 1, retreat: 0, durability: 46, repair: 12, entry: '凝丹之后才使得开的长枪。出手凌厉，握柄时还容得下些许真气。' },
  { id: 'straw_cape', slot: 'armor', tier: 0, atk: 0, def: 1, hp: 3, qi: 0, retreat: 0, durability: 24, repair: 3, entry: '渔人常穿的轻护具。能缓掉些寻常抓咬，遇到沉重来招仍须躲闪。' },
  { id: 'hide_coat', slot: 'armor', tier: 0, atk: 0, def: 2, hp: 5, qi: 0, retreat: 0, durability: 29, repair: 5, entry: '结实的凡制软甲。泥蜕织面咬不住，能额外卸掉野兽来招的力道。', trait: { kind: 'guard', enemyTag: 'beast', bonus: 2 } },
  { id: 'iron_coat', slot: 'armor', tier: 1, atk: 0, def: 3, hp: 7, qi: 0, retreat: 0, durability: 38, repair: 8, entry: '筑基修士穿得动的重护具。叠铁护心能分散重击，接蓄势之后的重招更稳。', trait: { kind: 'guard', intent: 'heavy', bonus: 2 } },
  { id: 'tide_coat', slot: 'armor', tier: 2, atk: 0, def: 5, hp: 10, qi: -1, retreat: 0, durability: 46, repair: 12, entry: '凝丹重甲，护身厚实。甲下气息走得窄，穿着时体内少容些真气。' },
  { id: 'reed_charm', slot: 'charm', tier: 0, atk: 0, def: 0, hp: 0, qi: 2, retreat: 0.05, durability: 25, repair: 3, entry: '小巧的凡制护符。苇声能帮助稳住真气，脱身时也能少挨些追击。' },
  { id: 'path_charm', slot: 'charm', tier: 0, atk: 0, def: 0, hp: 2, qi: 0, retreat: 0.17, durability: 28, repair: 5, entry: '旧渡工用的护身钱。擅长在混乱中辨来路，撤出战斗时能少受追击。' },
  { id: 'bell_charm', slot: 'charm', tier: 1, atk: 0, def: 1, hp: 0, qi: 4, retreat: 0.05, durability: 38, repair: 8, entry: '适合筑基修士的哑铃。能收住散乱真气，佩着有些许护身与脱身之助。' },
  { id: 'tide_charm', slot: 'charm', tier: 2, atk: 0, def: 1, hp: 4, qi: 3, retreat: 0.20, durability: 46, repair: 12, entry: '凝丹修士方能温养的玉佩。能护身存气，也擅长在抽身时卸掉身后的追击。' },
  { id: 'jetty_charm', slot: 'charm', tier: 2, atk: 0, def: 0, hp: 0, qi: 5, retreat: 0.30, durability: 38, repair: 9, entry: '凝丹修士佩着才显灵的旧埠灯坠。长于蓄气，也特别适合在凶险处脱身。' },
];

const pills = [
  { id: 'salve', tier: 0, hp: 10, qi: 0, food: 0, toxin: 8, wound: 0, focus: 0 },
  { id: 'qi_powder', tier: 0, hp: 0, qi: 7, food: 0, toxin: 8, wound: 0, focus: 0 },
  { id: 'grain_pill', tier: 0, hp: 0, qi: 0, food: 3, toxin: 4, wound: 0, focus: 0 },
  { id: 'heal_pill', tier: 1, hp: 16, qi: 0, food: 0, toxin: 12, wound: 1, focus: 0 },
  { id: 'detox_pill', tier: 0, hp: 0, qi: 0, food: 0, toxin: -22, wound: 0, focus: 0 },
  { id: 'focus_pill', tier: 0, hp: 0, qi: 0, food: 0, toxin: 6, wound: 0, focus: 1 },
  { id: 'tide_pill', tier: 2, hp: 24, qi: 10, food: 0, toxin: 18, wound: 1, focus: 0 },
];

const talismans = [
  { id: 'ember_talisman', tier: 0, damage: 10, guard: 0, retreat: 0 },
  { id: 'reed_talisman', tier: 0, damage: 0, guard: 3, retreat: 0.38 },
  { id: 'bank_talisman', tier: 0, damage: 0, guard: 2, retreat: 0.56 },
  { id: 'iron_talisman', tier: 1, damage: 0, guard: 10, retreat: 0 },
  { id: 'tide_talisman', tier: 2, damage: 19, guard: 4, retreat: 0 },
];

const arts = [
  { id: 'reed_cleave', name: '分苇诀', tier: 0, cost: 2, power: 3, pierce: 1, guard: 0, break: 0, price: 6, desc: '用少量真气补强一次出手，适合对付薄甲。' },
  { id: 'stone_brace', name: '压石诀', tier: 0, cost: 2, power: -3, pierce: 0, guard: 5, break: 0, price: 8, desc: '沉桩护身，兼有一记轻击。' },
  { id: 'hook_current', name: '钩水手', tier: 0, cost: 3, power: 0, pierce: 1, guard: 1, break: 7, price: 12, reveal: { item: 'oar_mark' }, desc: '用巧劲削弱对方重招，适合看准了再用。' },
  { id: 'bell_strike', name: '敲山劲', tier: 1, cost: 4, power: 6, pierce: 3, guard: 0, break: 0, price: 19, reveal: { item: 'ore' }, desc: '集中力量打穿厚甲，耗气较重。' },
  { id: 'earth_echo', name: '抱地听钟', tier: 1, cost: 3, power: -3, pierce: 0, guard: 9, break: 0, price: 18, reveal: { item: 'echo_method' }, desc: '在第二声回音到来时收气固守，可接下较重一击。' },
  { id: 'cliff_cut', name: '截崖步', tier: 1, cost: 4, power: 1, pierce: 1, guard: 3, break: 11, price: 22, reveal: { item: 'echo_note' }, desc: '移步切入攻势，削弱重招时也护住自身。' },
  { id: 'tide_part', name: '破潮指', tier: 2, cost: 5, power: 10, pierce: 5, guard: 0, break: 0, price: 31, reveal: { item: 'sand' }, desc: '用一瞬间的爆发击穿坚甲。' },
  { id: 'tide_return', name: '回澜式', tier: 2, cost: 4, power: -3, pierce: 1, guard: 13, break: 0, price: 27, reveal: { item: 'tide_note' }, desc: '以退借势，留力应对沉重的反扑。' },
  { id: 'cross_weir', name: '截流式', tier: 2, cost: 5, power: 3, pierce: 2, guard: 4, break: 15, price: 32, reveal: { item: 'tide_note' }, desc: '截住对手蓄势的时机，逼对方改走别处。' },
  { id: 'lamp_still', name: '护灯式', tier: 2, cost: 3, power: -4, pierce: 0, guard: 9, break: 4, price: 14, reveal: { item: 'lamp_sketch' }, desc: '仿着暗埠人守风口灯火的手势，省气护身。' },
];

const recipes = [
  { id: 'r_salve', result: 'salve', count: 2, tier: 0, cost: 2, need: { wood: 1 }, days: 1 },
  { id: 'r_qi', result: 'qi_powder', count: 2, tier: 0, cost: 2, need: { reed: 1 }, days: 1 },
  { id: 'r_grain', result: 'grain_pill', count: 2, tier: 0, cost: 2, need: { ration: 2, wood: 1 }, days: 1 },
  { id: 'r_detox', result: 'detox_pill', count: 2, tier: 0, cost: 3, need: { reed: 1, wood: 1 }, days: 1 },
  { id: 'r_focus', result: 'focus_pill', count: 1, tier: 0, cost: 3, need: { reed: 1, wood: 1 }, days: 1 },
  { id: 'r_heal', result: 'heal_pill', count: 2, tier: 1, cost: 4, need: { reed: 1, hide: 1 }, days: 1 },
  { id: 'r_tide', result: 'tide_pill', count: 2, tier: 2, cost: 7, need: { reed: 1, sand: 1 }, days: 1 },
  { id: 'r_ember', result: 'ember_talisman', count: 2, tier: 0, cost: 3, need: { wood: 1, reed: 1 }, days: 1 },
  { id: 'r_reed', result: 'reed_talisman', count: 2, tier: 0, cost: 2, need: { reed: 1, wood: 1 }, days: 1 },
  { id: 'r_bank_talisman', result: 'bank_talisman', count: 2, tier: 0, cost: 3, need: { reed: 1, wood: 2 }, days: 1, reveal: { item: 'eddy_note' } },
  { id: 'r_iron', result: 'iron_talisman', count: 2, tier: 1, cost: 4, need: { ore: 1, wood: 1 }, days: 1 },
  { id: 'r_tide_talisman', result: 'tide_talisman', count: 2, tier: 2, cost: 6, need: { sand: 1, wood: 1 }, days: 1, reveal: { item: 'tide_note' } },
  { id: 'r_hide_coat', result: 'hide_coat', count: 1, tier: 0, cost: 5, need: { hide: 2 }, days: 1 },
  { id: 'r_reed_bow', result: 'reed_bow', count: 1, tier: 0, cost: 4, need: { wood: 1, reed: 2 }, days: 1 },
  { id: 'r_iron_sword', result: 'iron_sword', count: 1, tier: 1, cost: 11, need: { ore: 2, wood: 1 }, days: 1 },
  { id: 'r_iron_coat', result: 'iron_coat', count: 1, tier: 1, cost: 12, need: { ore: 2, hide: 1 }, days: 1 },
  { id: 'r_tide_spear', result: 'tide_spear', count: 1, tier: 2, cost: 20, need: { ore: 2, sand: 2 }, days: 2 },
  { id: 'r_tide_coat', result: 'tide_coat', count: 1, tier: 2, cost: 19, need: { ore: 2, hide: 1, sand: 1 }, days: 2 },
  { id: 'r_jetty_charm', result: 'jetty_charm', count: 1, tier: 2, cost: 8, need: { dry_wick: 2, reed: 1 }, days: 1, reveal: { item: 'secret_pass' } },
];

const regions = [
  { id: 'village', name: '落灯村', tier: 0, travel: 1, food: 1, draws: [], desc: '旧渡停了之后，村人每晚仍点一盏灯。这里可问路、休整、补给。' },
  { id: 'marsh', name: '白苇滩', tier: 0, travel: 1, food: 1, draws: [{ event: 'reed_banks', weight: 4 }, { event: 'sunk_pack', weight: 3 }, { event: 'mud_track', weight: 3 }, { event: 'old_fire', weight: 2 }, { event: 'reed_ferryman', weight: 2 }, { event: 'drowned_mast', weight: 1 }], desc: '浅水下有白苇芯，泥面有兽足印。老渡工认得更往里的路。' },
  { id: 'ridge', name: '沉钟岭', tier: 1, travel: 2, food: 2, reveal: { item: 'ridge_rubbing', quest: 'reed_salve' }, hint: '问问苇滩渡工，或替村中药僮采一份白苇芯。', draws: [{ event: 'ore_rain', weight: 4 }, { event: 'empty_oven', weight: 3 }, { event: 'miner_echo', weight: 4 }, { event: 'rope_run', weight: 2 }, { event: 'stone_niche', weight: 2 }, { event: 'cracked_bell', weight: 1 }], desc: '旧钟倒在废矿外，回音仍在山腹打转。岩壁上有这里曾经通水的痕迹。' },
  { id: 'ford', name: '闭潮渡', tier: 2, travel: 2, food: 2, reveal: { item: 'ford_chart', quest: 'sell_forging' }, hint: '山上的旧石龛留着刻痕。村里老匠人也记得这里的水路。', draws: [{ event: 'low_tide', weight: 3 }, { event: 'boat_shade', weight: 3 }, { event: 'tide_keeper', weight: 6 }, { event: 'flood_lines', weight: 2 }, { event: 'lock_deck', weight: 2 }], desc: '旧渡的闸门还在自行开合。沿废船与潮痕寻找挂锁的闸槽。' },
  { id: 'hidden', name: '回灯埠', tier: 2, travel: 2, food: 2, secret: true, reveal: { item: 'secret_pass' }, draws: [{ event: 'upstream_lights', weight: 4 }, { event: 'sunken_mooring', weight: 3 }, { event: 'still_pole', weight: 3 }], desc: '夹在上下两道水流之间的避风埠，渡工过去在此换灯、卸客。' },
];

const events = [
  { id: 'reed_banks', name: '倒伏的白苇', text: '风把苇叶往一边压，浅水里露出成丛的白苇芯。越往里，泥越能拽住脚。', choices: [
    { label: '挖浅处的苇芯', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { reed: 2, reed_lines: 1 }, enemy: null, desc: '只踩看得见的石头，收起苇芯后记下回弯的水线。' },
    { label: '摸到深处连根起', days: 1, food: 1, coins: 0, hp: -4, qi: 0, insight: 3, loot: { reed: 3, reed_lines: 1 }, enemy: null, desc: '多挖一份，拔脚时吃了一记暗划。起身后把哪里的水往回绕也记下来。' },
    { label: '记下水线', days: 0, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { reed_lines: 1 }, enemy: null, desc: '水位变了，绕过石背的水纹仍然在。随手画下一段。' },
  ] },
  { id: 'sunk_pack', name: '翻倒的药篓', text: '烂木桩下卡着一个药篓，几包药还扎在篓边，有火燎过的痕迹。', choices: [
    { label: '把篓拉回来', days: 1, food: 1, coins: 3, hp: 0, qi: 0, insight: 1, loot: { wood: 1, salve: 1 }, enemy: null, desc: '慢慢解开缠绳，捡得一些用得上的东西。' },
    { label: '点灯把失主叫来', days: 1, food: 1, coins: 7, hp: 0, qi: 0, insight: 2, loot: { ration: 2 }, enemy: null, desc: '失主分一袋干粮付谢礼，也指了水面下的石坎。' },
  ] },
  { id: 'mud_track', name: '泥下冒泡', text: '水泡沿一条直线过来。泥鳞兽伏得很深，只有背上的硬鳞隔一阵浮起来。干地另有一串小足印，芦梗上挂着几缕短毛。', choices: [
    { label: '上石滩迎战', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mud_beast', desc: '先把脚底站稳。它收身低伏时，多半是在攒力扑咬。' },
    { label: '沿另一侧绕行', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 2 }, enemy: null, desc: '让它守着水眼，在干地捡些枯枝。' },
    { label: '跟着小足迹去看看', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'reed_fox', desc: '一尾蓬松的苇狐挡在干埂上。' },
  ] },
  { id: 'old_fire', name: '干透的柴窝', revisit: true, text: '半截石渠挡了雨，里面还有旧日烤苇火留下的黑灰。渠底铺着几片手掌大的破瓦。', choices: [
    { label: '添柴歇脚', days: 1, food: 1, coins: 0, hp: 6, qi: 4, insight: 0, loot: { wood: 1 }, enemy: null, desc: '暖过手脚再走，顺便拿几截干柴。' },
    { label: '只捆柴枝', days: 1, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 3 }, enemy: null, desc: '趁天还亮多捆一把。' },
    { label: '翻看石渠底下的破瓦', days: 0, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { kiln_shard: 1 }, enemy: null, desc: '一片瓦背面刻着左右颠倒的字。擦去黑灰，认得出「两叩一停」。' },
    { label: '用炉火照透瓦片夹缝', hidden: true, need: { kiln_shard: 1, bell_clapper: 1, backwash_mark: 1, backwash_theory: 1 }, days: 1, food: 0, coins: 0, hp: 0, qi: 0, insight: 3, loot: { secret_pass: 1 }, enemy: null, desc: '照推演的摆法，用铃舌的影子定住刻样。瓦与刻样拼出逆水的路线。火一低，石渠外的灯影果然改了方向。' },
  ] },
  { id: 'reed_ferryman', name: '修桨的人', text: '一名老渡工坐在水边削桨。他知道哪里能抄近路，也知道哪条路表面平整却会陷脚。', choices: [
    { label: '帮忙补桨，问两条回路', days: 1, food: 0, coins: 6, hp: 0, qi: 0, insight: 3, loot: { ration: 1, ridge_rubbing: 1, oar_mark: 1 }, enemy: null, desc: '渡工在桨上比画了几处靠岸的旧记号，又拿来一张标着山路的拓片。' },
    { label: '替他赶走巡岸的水鬼', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'marsh_ghost', desc: '水鬼常把手臂抱成一团，等对方先出招。' },
  ] },
  { id: 'drowned_mast', name: '苇海沉桅', text: '苇浪全往一根桅杆倒去。桅下的兽已经能行真气，有筑基修士的本事。它咬着半枚旧渡钱，未追出水来。', choices: [
    { label: '到桅边夺回渡钱', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mast_beast', desc: '桅影有遮挡。它张开头侧两道水鳍时，赶紧稳住脚。' },
    { label: '退上高埂避开它', days: 0, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, desc: '记下兽头能伸到的地方，再沿干地走。' },
  ] },
  { id: 'ore_rain', name: '雨后落矿', text: '山雨把细土洗进沟里，松动的矿块露在碎石之间。坡上还有滑落的新痕。', choices: [
    { label: '在沟边拾铁', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ore: 2 }, enemy: null, desc: '取两份露出来的寒铁便回头。' },
    { label: '上陡坡找大块', days: 1, food: 1, coins: 0, hp: -6, qi: 0, insight: 3, loot: { ore: 3 }, enemy: null, desc: '多采一份，落石也会来得更快。' },
  ] },
  { id: 'empty_oven', name: '歇炉的茶棚', text: '棚脚的木牌写着余火可借，旁边记了几笔欠账。炉后的石桌画着听山辨险的手势。', choices: [
    { label: '开炉歇息，照石桌行气', days: 1, food: 1, coins: 0, hp: 9, qi: 6, insight: 1, loot: { wood: 1 }, enemy: null, desc: '对着余火走一遍手势，能把气息收顺。' },
    { label: '抄下手势，挑些干柴', days: 1, food: 0, coins: 0, hp: 0, qi: 1, insight: 3, loot: { wood: 2, echo_note: 1 }, enemy: null, desc: '抄下辨险手势与行气口诀，带回去琢磨。' },
  ] },
  { id: 'miner_echo', name: '矿道里敲门', text: '矿道深处有敲两停一的回音，一团握着石锤的影子看守着发声的石心。', choices: [
    { label: '进矿道取石心', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'ore_wight', desc: '近身抢取石心。锤影高举时适合截断攻势。' },
    { label: '还它两声，从旁孔取碎矿', days: 1, food: 1, coins: 0, hp: 0, qi: -2, insight: 3, loot: { ore: 2 }, enemy: null, desc: '以回音牵住锤影片刻，够你拿几块寒铁走。' },
  ] },
  { id: 'rope_run', name: '断绳坡', text: '老挑夫把小半车货落在坡下，铜铃吊在断绳一端。碎石后藏着团长爪的影子。', choices: [
    { label: '从侧坡兜过去捞货', days: 1, food: 1, coins: 10, hp: 0, qi: 0, insight: 2, loot: { ration: 2 }, enemy: null, desc: '绕远些能安稳交货，让挑夫补你干粮。' },
    { label: '守着货车，等石獾露头', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'stone_badger', desc: '它伏在货车旁，正面对付须留神护体硬甲。' },
  ] },
  { id: 'stone_niche', name: '回声石龛', revisit: true, text: '矿工把破铃沉进石龛避邪。有人留下撬过的痕，龛底还压着完整的矿壳。', choices: [
    { label: '记下响声，慢慢剥壳', days: 2, food: 1, coins: 0, hp: 0, qi: -3, insight: 3, loot: { core: 1, ford_chart: 1, stone_rubbing: 1 }, enemy: null, desc: '取出石心，标记暗缝松动的时刻。龛底石版刻着旧年的水路。' },
    { label: '拾铃离开', days: 1, food: 0, coins: 5, hp: 0, qi: 0, insight: 1, loot: { ore: 1, stone_rubbing: 1 }, enemy: null, desc: '提铃误碰石龛，第二声回音才震落石屑。记下位置，再拾一块寒铁走。' },
    { label: '拿反字瓦在空铃沿上叩两声', hidden: true, need: { kiln_shard: 1 }, days: 0, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { bell_clapper: 1 }, enemy: null, desc: '依着瓦上的字停住第三下。两声回音过后，有件系着细缆的铃舌从铃腹滑出来。' },
  ] },
  { id: 'cracked_bell', name: '裂钟又响', text: '旧钟裂成两瓣，今夜却有一瓣在响。凝丹境的钟魄伏在钟腹，正把破片向身上吸。', choices: [
    { label: '趁钟片未合，进前取铃', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bell_wraith', desc: '它鸣响蓄势时不难辨认，手头最好留着一式断招。' },
    { label: '离开钟声能传到的地方', days: 0, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, desc: '回到山脊前还能听见低鸣，把这处险记到地图背面。' },
  ] },
  { id: 'low_tide', name: '闸外退水', text: '石阶上一道道淤痕见了光，潮砂落在阶角。蹚过最后一阶就得留心水下的影子。', choices: [
    { label: '扫取浅阶的潮砂', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { sand: 2 }, enemy: null, desc: '慢一点也能把细砂拢进袋里。' },
    { label: '到下游截住缠舟兽', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'rope_eel', desc: '等水线浅时先布好站位，缠舟兽蓄势时可断招。' },
  ] },
  { id: 'boat_shade', name: '没篷的渡舟', revisit: true, text: '老船抵在闸槽里，只剩板凳没有泡湿。船帮的绳结朝着往年的靠岸方向。', choices: [
    { label: '坐船凳背风歇脚', days: 1, food: 1, coins: 0, hp: 13, qi: 8, insight: 1, loot: {}, enemy: null, desc: '捱过一阵潮头再走。' },
    { label: '打捞船底的钱柜', days: 1, food: 1, coins: 15, hp: -4, qi: -2, insight: 2, loot: { sand: 1 }, enemy: null, desc: '钱柜积着潮砂，摸出来要下半身水。' },
    { label: '把带结的铃舌系在船沿，等潮转向', hidden: true, need: { bell_clapper: 1 }, days: 0.5, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { backwash_mark: 1 }, enemy: null, desc: '铃舌随船摆向下游，船底却露出一道相反走向的深槽。找一页船纸压下湿墨，把槽痕留住。' },
  ] },
  { id: 'tide_keeper', name: '旧闸后的守潮灵', text: '两扇门之间立着一个背着重锁的影子。水退三寸，它就把锁往下一沉。锁眼里映着镇渡印。', choices: [
    { label: '等潮落，入闸争印', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'tide_spirit', desc: '守潮灵会用重锁招架。听到锁链绷响时，准备护身或断招。' },
    { label: '退出闸槽，记下锁链节律', days: 1, food: 0, coins: 0, hp: 0, qi: 1, insight: 3, loot: {}, enemy: null, desc: '守潮灵在退水后仍会回到闸槽，可整备后再来。' },
  ] },
  { id: 'flood_lines', name: '石壁上的洪痕', text: '石壁逐年升高的刻痕下面，最新一行落款是落灯村。刻痕之间塞着润过的旧符。', choices: [
    { label: '重刻模糊的水位线', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 4, loot: { tide_talisman: 1, tide_note: 1 }, enemy: null, desc: '拓下水位痕迹，再从石缝里清出一张仍可用的符。' },
    { label: '沿壁根摸寻潮砂', days: 1, food: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { sand: 1 }, enemy: null, desc: '潮水未到鞋面，赶在涨水前离开。' },
  ] },
  { id: 'lock_deck', name: '悬锁的木排', text: '闸门配重吊着一片木排，一面搁浅、一面还在滴水。木排上拴着密封的渡工饭盒。', choices: [
    { label: '解下饭盒，歇一口气', days: 1, food: 0, coins: 0, hp: 3, qi: 0, insight: 1, loot: { ration: 3 }, enemy: null, desc: '饭盒里是村里早几年用的耐存口粮。' },
    { label: '抬配重挪开木排', days: 1, food: 1, coins: 7, hp: 0, qi: -3, insight: 3, loot: { sand: 2 }, enemy: null, desc: '看清力臂再做，得到木排下的遗钱和潮砂。' },
  ] },
  { id: 'upstream_lights', name: '逆水的灯龛', text: '埠里成排的旧灯都朝上游开口。灯座有空着的引火槽，最外的一格还在淌水。', choices: [
    { label: '用松枝把引火槽重新点通', need: { wood: 1 }, consume: true, days: 1, food: 0, coins: 0, hp: 0, qi: 4, insight: 2, loot: { dry_wick: 2 }, enemy: null, desc: '火一路传进灯腹。挑掉烧坏的芯，下面还埋着两枚浸水也不坏的。' },
    { label: '避着风坐一阵', days: 1, food: 1, coins: 0, hp: 14, qi: 7, insight: 1, loot: {}, enemy: null, desc: '埠里少有潮声，听惯了才发现风也是绕开这里走的。' },
  ] },
  { id: 'sunken_mooring', name: '淹到手心的绳头', text: '浮在水面的旧绳自己在打结。湿蓑衣下面有一只把灯芯攥得很紧的手。', choices: [
    { label: '下埠拨开湿蓑衣', days: 1, food: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'wick_husk', desc: '它摸出火时会抬起空着的一手，提防借火扑来的劲头。' },
    { label: '原地松开浮绳', days: 0, food: 0, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ration: 1 }, enemy: null, desc: '绳套松开后，旁边困着的干粮匣也漂了回来。' },
  ] },
  { id: 'still_pole', name: '站在风口的灯夫', text: '老人提着灯站在风口。整段路上只有他的火苗总朝斜下方弯，弯过来又自己站直。', choices: [
    { label: '请教他拢灯的手势', days: 0.5, food: 0, coins: 0, hp: 0, qi: 0, insight: 3, loot: { lamp_sketch: 1 }, enemy: null, desc: '老人说这只是个护火的手势，随手在码头木屑上划了两道弧。' },
    { label: '听他说过去换过几回渡', days: 0.5, food: 0, coins: 0, hp: 3, qi: 0, insight: 2, loot: {}, enemy: null, desc: '他指着埠外，说那三处旧物是留给失散渡工的，怕人在涨潮时走投无路。' },
  ] },
];

const enemies = [
  { id: 'mud_beast', name: '泥鳞兽', tags: ['beast', 'scaled'], tier: 0, hp: 25, atk: 7, def: 2, intents: [{ name: '偏头啃咬', kind: 'attack', mult: 1 }, { name: '伏身猛扑', kind: 'heavy', mult: 1.7 }, { name: '蜷尾守鳞', kind: 'guard', mult: 1.35 }, { name: '掀尾扫腿', kind: 'attack', mult: 1 }], coins: 8, insight: 3, loot: { hide: 2, ration: 1 }, desc: '伏身后会扑向脚下，硬鳞收拢时适合恢复真气或蓄势。' },
  { id: 'reed_fox', name: '苇尾狐', tags: ['beast', 'furred'], tier: 0, hp: 24, atk: 6, def: 1, intents: [{ name: '斜掠扑咬', kind: 'attack', mult: 1 }, { name: '团尾护腹', kind: 'guard', mult: 1.4 }, { name: '伏脊跳扑', kind: 'heavy', mult: 1.5 }], coins: 4, insight: 2, loot: { wood: 1, ration: 1 }, desc: '尾上的厚毛扫起了枯苇。它会先绕着干埂寻找扑咬的空当。' },
  { id: 'marsh_ghost', name: '巡岸水鬼', tags: ['spirit'], tier: 0, hp: 28, atk: 8, def: 2, intents: [{ name: '抱臂裹雾', kind: 'guard', mult: 1.4 }, { name: '伸指拖拽', kind: 'attack', mult: 1 }, { name: '借雾扑面', kind: 'heavy', mult: 1.6 }], coins: 10, insight: 4, loot: { reed: 2, reed_talisman: 1 }, desc: '开场先抱臂结雾，准备好再把它拖出水边。' },
  { id: 'mast_beast', name: '沉桅虺', tags: ['beast', 'scaled'], tier: 1, hp: 34, atk: 10, def: 3, intents: [{ name: '借桅缠身', kind: 'attack', mult: 1 }, { name: '开鳍扑水', kind: 'heavy', mult: 1.65 }, { name: '绕桅遮身', kind: 'guard', mult: 1.2 }, { name: '甩尾扫水', kind: 'attack', mult: 1 }], coins: 19, insight: 5, loot: { path_charm: 1, reed: 2 }, desc: '筑基境的伏水兽。带上破招术和撤退用的符，可留一条回路。' },
  { id: 'ore_wight', name: '持锤矿煞', tags: ['spirit'], tier: 1, hp: 40, atk: 12, def: 4, intents: [{ name: '平锤试探', kind: 'attack', mult: 1 }, { name: '举锤砸顶', kind: 'heavy', mult: 1.72 }, { name: '横锤护臂', kind: 'guard', mult: 1.45 }, { name: '甩锤碰撞', kind: 'attack', mult: 1.1 }], coins: 14, insight: 5, loot: { core: 1, ore: 2 }, desc: '它击打沉重且规律。越阶挑战时先做好撑过重锤的准备。' },
  { id: 'stone_badger', name: '石甲獾', tags: ['beast', 'furred'], tier: 1, hp: 43, atk: 11, def: 6, intents: [{ name: '缩头挡路', kind: 'guard', mult: 1.38 }, { name: '沿坡顶撞', kind: 'attack', mult: 1 }, { name: '转身重掀', kind: 'heavy', mult: 1.62 }], coins: 15, insight: 5, loot: { hide: 2, ore: 1, salve: 1 }, desc: '皮毛粗厚，脊甲又硬。找它转身露侧肋时出手。' },
  { id: 'bell_wraith', name: '裂钟魄', tags: ['spirit'], tier: 2, hp: 54, atk: 14, def: 5, intents: [{ name: '叩钟抖尘', kind: 'attack', mult: 1 }, { name: '聚响压顶', kind: 'heavy', mult: 1.72 }, { name: '并片挡锋', kind: 'guard', mult: 1.38 }, { name: '崩响回荡', kind: 'attack', mult: 1.1 }], coins: 25, insight: 6, loot: { bell_charm: 1, core: 1 }, desc: '钟魄鸣响时正在蓄势，可先护住周身，再截住最重一声。' },
  { id: 'rope_eel', name: '缠舟兽', tags: ['beast'], tier: 2, hp: 50, atk: 15, def: 5, intents: [{ name: '卷尾扫舟', kind: 'attack', mult: 1 }, { name: '扯绳压顶', kind: 'heavy', mult: 1.7 }, { name: '团身潜浮', kind: 'guard', mult: 1.38 }], coins: 20, insight: 6, loot: { sand: 2, ration: 2 }, desc: '动作快，扯紧船绳后会随浪发动重击。' },
  { id: 'tide_spirit', name: '守潮灵', tags: ['spirit'], tier: 2, hp: 72, atk: 17, def: 7, intents: [{ name: '铁索探身', kind: 'attack', mult: 1 }, { name: '沉锁打浪', kind: 'heavy', mult: 1.82 }, { name: '横锁固闸', kind: 'guard', mult: 1.46 }, { name: '返潮扫岸', kind: 'attack', mult: 1.12 }, { name: '闭闸合潮', kind: 'heavy', mult: 1.87 }], coins: 28, insight: 8, loot: { seal: 1, sand: 3 }, desc: '带印回村便可复开旧渡。它的两次重招隔得很近，重进闸前先确认药符够用。' },
  { id: 'wick_husk', name: '湿蓑灯蜕', tags: ['spirit'], tier: 2, hp: 64, atk: 16, def: 6, intents: [{ name: '压帽护火', kind: 'guard', mult: 1.35 }, { name: '引灯掠手', kind: 'attack', mult: 1.1 }, { name: '借火贴身', kind: 'heavy', mult: 1.9 }, { name: '吮焰回息', kind: 'heal', mult: 0.42 }], coins: 23, insight: 7, loot: { dry_wick: 2, tide_pill: 1 }, desc: '会在风回过来时从灯芯汲力。拖久了，它能补回缺损。' },
];

const quests = [
  { id: 'patch_ferry', name: '把旧灯支起来', desc: '村人请你带两截松枝，把渡口那盏灯支稳。', need: { wood: 2 }, reward: { ration: 3, salve: 1 }, coins: 9, insight: 2, requiresKnownMaterials: false },
  { id: 'reed_salve', name: '拣出一份好苇', desc: '药僮要用白苇芯熬膏，认得老渡工以前送药时留下的路标和靠岸记。', need: { reed: 1 }, reward: { ration: 2, reed_talisman: 1, ridge_rubbing: 1, oar_mark: 1 }, coins: 10, insight: 2 },
  { id: 'coat_mend', name: '补蓑衣的里衬', desc: '渡工愿用几包止血药换一块整泥蜕。', need: { hide: 1 }, reward: { salve: 2, ration: 1 }, coins: 10, insight: 2 },
  { id: 'sell_forging', name: '先打一截闸栓', tier: 1, reveal: { item: 'ridge_rubbing' }, desc: '老匠人要一份寒铁做样。他的工具箱里有旧年修渡留下的几张图。', need: { ore: 1 }, reward: { iron_talisman: 1, ration: 3, ford_chart: 1 }, coins: 17, insight: 3 },
  { id: 'last_lantern', name: '把旧渡的印带回来', tier: 2, reveal: { item: 'ford_chart' }, desc: '落灯村留着引水的最后一段闸书。拿回镇渡印便能重开旧渡。', need: { seal: 1 }, reward: { ration: 6, tide_pill: 1 }, coins: 30, insight: 6 },
];

const services = [
  { id: 'quests', name: '委托', items: ['reed'], choices: ['sunk_pack:1', 'reed_ferryman:0'] },
  { id: 'market', name: '坊市', choices: ['sunk_pack:1', 'old_fire:1', 'reed_ferryman:0'] },
  { id: 'workshop', name: '工坊', items: ['hide'], choices: ['sunk_pack:0', 'old_fire:0', 'mud_track:1'] },
  { id: 'cultivate', name: '修行', items: ['reed_lines'], choices: ['drowned_mast:1', 'reed_ferryman:0'] },
];

const deductions = [
  {
    id: 'find_eddy', name: '苇滩哪里能脱身', tier: 0, reveal: { item: 'reed_lines' },
    desc: '把水纹画到沙里，再摆出渡工几次靠岸的位置。找一处水位变了也能借力的地方。',
    evidence: { reed_lines: 1, oar_mark: 1 },
    hypotheses: [
      { id: 'follow_foam', label: '看浮沫在哪一侧堆积，便往那一侧退' },
      { id: 'behind_stone', label: '贴露头石的背面，借内弯的回流脱身' },
      { id: 'deep_center', label: '离岸远的水流更均匀，可以横穿河心脱身' },
    ],
    answer: 'behind_stone', reward: { eddy_note: 1 }, days: 0.5, insight: 2,
    success: '水纹的回弯和渡工的靠岸点都落在石背。沿这道弯画符，可以借一股回流让开敌手。',
    miss: '把水位移高一截后，这条路线对不上另一次靠岸的位置。再找找几次都存在的地形特征。',
  },
  {
    id: 'read_echo', name: '何时借得到山力', tier: 1, reveal: { item: 'echo_note' },
    desc: '茶棚手势有一次沉掌，落在哪一拍却没写。用石龛的音痕检验这一步。',
    evidence: { echo_note: 1, stone_rubbing: 1 },
    hypotheses: [
      { id: 'first_beat', label: '手叩石面的一刹那沉掌，以冲撞催力' },
      { id: 'no_sound', label: '等到回音全消再沉掌，免得杂音打乱气息' },
      { id: 'return_beat', label: '等第二声回音触及石背，在岩腹应声时沉掌' },
    ],
    answer: 'return_beat', reward: { echo_method: 1 }, days: 0.5, insight: 2,
    success: '沉掌赶在石屑落下的一拍，正应了手记上收气的时点。可以据此去学抱地听钟。',
    miss: '按这个时点落掌，石屑在你沉掌前后便已落开。查查石面真正应声的是哪一拍。',
  },
  {
    id: 'trace_backwash', name: '旧物为何都刻反了', tier: 2, reveal: { item: 'backwash_mark' },
    desc: '反字、绳结和倒潮刻样都能标方向，放在一处时却对不上。把它们摆进同一段水路里。',
    evidence: { kiln_shard: 1, bell_clapper: 1, backwash_mark: 1 },
    hypotheses: [
      { id: 'lamplit_reverse', label: '让炉火从瓦背照出刻样，用铃影定方向，再看水中灯影' },
      { id: 'follow_mooring', label: '按铃舌被船拖动的方向，把三处记号都读作下游' },
      { id: 'tide_record', label: '把瓦和刻样当作两次洪水的记录，绳结只标曾用的泊位' },
    ],
    answer: 'lamplit_reverse', reward: { backwash_theory: 1 }, days: 0.5, insight: 3,
    success: '反字瓦背向刻样，两条断纹便能相接。纸上推得出方向，得回第一件旧物所在处用真火验。',
    miss: '这样摆，铃舌能对上旧船，瓦与刻样的凹纹却彼此错开。试想这几件旧物会不会要隔着光读。',
  },
];

const starting = {
  inventory: { ration: 10 },
  gear: { weapon: 'cudgel', armor: 'straw_cape', charm: null },
  arts: [],
  coins: 20,
};
const victoryQuest = 'last_lantern';
const data = { realms, items, gear, pills, talismans, arts, recipes, regions, events, enemies, quests, services, deductions, rules: {}, starting, victoryQuest };

export { data, realms, items, gear, pills, talismans, arts, recipes, regions, events, enemies, quests, services, deductions, starting, victoryQuest };
export default data;
