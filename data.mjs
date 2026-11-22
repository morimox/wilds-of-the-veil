const realms = [
  { id: 0, name: '炼气', hp: 30, qi: 12, atk: 8, def: 2, insight: 0, cost: 0, need: {}, pressure: 1, days: 0 },
  { id: 1, name: '筑基', hp: 43, qi: 17, atk: 11, def: 4, insight: 10, cost: 18, need: { reed: 2 }, pressure: 0.76, days: 1 },
  { id: 2, name: '凝丹', hp: 58, qi: 23, atk: 15, def: 6, insight: 23, cost: 35, need: { ore: 2, core: 1 }, pressure: 0.74, days: 2 },
];

const items = [
  { id: 'ration', name: '干粮', kind: 'material', price: 3, sell: 1, desc: '用油纸分包的干粮，饿了就拆一包吃。' },
  { id: 'wood', name: '松枝', kind: 'material', price: 3, sell: 1, desc: '引火温药，也能充作绘符的符骨。' },
  { id: 'reed', name: '白苇芯', kind: 'material', price: 8, sell: 3, desc: '村里的药僮收它熬伤药。' },
  { id: 'hide', name: '泥蜕', kind: 'material', price: 7, sell: 3, desc: '从泥鳞兽身上取得的韧皮，可制护具。' },
  { id: 'ore', name: '寒铁', kind: 'material', price: 13, sell: 5, desc: '沉钟岭废矿中出产的寒铁，可制器，也可用于凝丹。' },
  { id: 'core', name: '回声石心', kind: 'material', price: 0, sell: 9, desc: '沉钟岭的咒音凝成的石心，可用于凝丹。' },
  { id: 'sand', name: '潮砂', kind: 'material', price: 14, sell: 6, desc: '闭潮渡退水后留下的细砂，入药或研作符墨。' },
  { id: 'seal', name: '镇渡印', kind: 'material', price: 0, sell: 0, keepOnFall: true, desc: '闭潮渡守潮灵遗落的渡印，落灯村有人认得它。' },
  { id: 'lost_basket', name: '落水药篓', kind: 'material', price: 0, sell: 0, keepOnFall: true, desc: '从木桩旁捞起的竹篓，箍带尚未松开。落灯村的药僮用这种篓子背药。' },
  { id: 'ridge_rubbing', name: '沉钟岭路图', kind: 'key', price: 0, sell: 0, desc: '画着白苇滩北面进山的路，循着路上的倒钟就能到沉钟岭。' },
  { id: 'ford_chart', name: '旧渡水图', kind: 'key', price: 0, sell: 0, desc: '上面画着废矿与旧渡之间的水路，尚可辨认。' },
  { id: 'echo_note', name: '茶棚墙上的掌谱', kind: 'key', price: 0, sell: 0, desc: '一块烤黑的薄木板。板上一人贴耳听岩，另一手掌心向下。' },
  { id: 'tide_note', name: '闸工的潮牌', kind: 'key', price: 0, sell: 0, desc: '值守闸门时用的潮牌，边缘刻着涨水与落水的时刻。' },
  { id: 'kiln_shard', name: '反字残瓦', kind: 'key', price: 0, sell: 0, desc: '白苇滩旧柴窝的底瓦上反写着「两叩一停」。瓦角的凹弧像件破铃的沿。' },
  { id: 'bell_clapper', name: '带结的铃舌', kind: 'key', price: 0, sell: 0, desc: '石龛深处的铃舌，系着个渡工用的反手绳结。旧船的缆上多半还留着同样的结。' },
  { id: 'backwash_mark', name: '倒潮刻样', kind: 'key', price: 0, sell: 0, desc: '石槽夹着的一块薄铜片，上头的凹纹顺着槽口朝逆流弯去。' },
  { id: 'secret_pass', name: '伏流路引', kind: 'key', price: 0, sell: 0, desc: '三处旧物留下的水路，须等岸边灯影逆流时循水行进。' },
  { id: 'reed_lines', name: '药僮的水线图', kind: 'key', price: 0, sell: 0, desc: '药僮平日拿它找水边的药草。浮沫的位置随水位而变，露头石后却总有一弯细水纹。' },
  { id: 'oar_mark', name: '旧桨上的靠岸图', kind: 'key', price: 0, sell: 0, desc: '渡工在旧桨上画了换过的三处船桩。石背的内弯不必顶着水划。' },
  { id: 'eddy_note', name: '回汊图', kind: 'key', price: 0, sell: 0, desc: '把水线和靠船的位置叠在一起画出的回流路线，可以据此制符。' },
  { id: 'stone_rubbing', name: '石龛音痕', kind: 'key', price: 0, sell: 0, desc: '一声轻叩之后，直到第二声回音到了石背，才有石屑从暗缝里落下。' },
  { id: 'echo_method', name: '返声行气稿', kind: 'key', price: 0, sell: 0, desc: '按石龛的两声回音画出的吐纳节拍，可拿它向懂行气的人请教。' },
  { id: 'backwash_theory', name: '照影水路图', kind: 'key', price: 0, sell: 0, desc: '沙盘上拼出的水路假说。从苇滩旧柴窝用炉火照读即可验明方向。' },
  { id: 'dry_wick', name: '无烟灯芯', kind: 'material', price: 0, sell: 8, reveal: { item: 'secret_pass' }, desc: '回灯埠所存的旧灯芯，浸了一夜也能燃。' },
  { id: 'lamp_sketch', name: '灯夫手势', kind: 'key', price: 0, sell: 0, reveal: { item: 'secret_pass' }, desc: '灯夫两手拢在灯火外，迎风的那只手往斜下方一撇，火苗便站稳了。' },

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
  { id: 'village', name: '落灯村', tier: 0, travel: 1, desc: '旧渡停了之后，村人每晚仍点一盏灯。这里可问路、休整、补给。' },
  { id: 'marsh', name: '白苇滩', tier: 0, travel: 1, desc: '岸上望得见浅水中的一片白苇。' },
  { id: 'ridge', name: '沉钟岭', tier: 1, travel: 2, reveal: { item: 'ridge_rubbing' }, hint: '苇滩渡工常循旧道往山里去。', desc: '旧钟倒在废矿外，回音仍在山腹打转。岩壁上有这里曾经通水的痕迹。' },
  { id: 'ford', name: '闭潮渡', tier: 2, travel: 2, reveal: { item: 'ford_chart' }, hint: '山上的旧石龛留着刻痕。村里老匠人也记得这里的水路。', desc: '旧渡的闸门还在自行开合。沿废船与潮痕寻找挂锁的闸槽。' },
  { id: 'hidden', name: '回灯埠', tier: 2, travel: 2, secret: true, reveal: { item: 'secret_pass' }, desc: '夹在上下两道水流之间的避风埠，渡工过去在此换灯、卸客。' },
];

const sites = [
  { id: 'reed_banks', region: 'marsh', name: '浅水苇丛',
    afterChoicesByChoice: { 1: ['reed_banks:0'] },
    stocks: { reed: { start: 5, cap: 8, interval: 4, growth: 2, choices: [0, 1] } },
    emptyText: '脚边都是翻开的泥。能拔的苇芯已经采完了。' },
  { id: 'sunk_pack', region: 'marsh', name: '烂木桩浅汊', afterChoices: ['reed_banks:1'], reveal: { quest: 'reed_salve' }, once: [0],
    afterOnceText: { 0: '桩脚只剩几丝篓绳，泥面有拖过竹篓的浅槽。' } },
  { id: 'mud_track', region: 'marsh', name: '碎石水眼', afterChoices: ['reed_banks:1'], reveal: { quest: 'reed_salve' },
    stocks: { wood: { start: 4, cap: 6, interval: 2.5, growth: 2, choices: [1] } },
    creatures: {
      mud_beast: { start: 1, cap: 3, interval: 4, growth: 1 },
      reed_fox: { start: 2, cap: 4, interval: 4, growth: 1 },
    },
    creatureText: {
      mud_beast: { present: '水泡排成一线，几片硬鳞时隐时现。', absent: '水面平静，没有鳞片浮出来。' },
      reed_fox: { present: '干地有新足印，芦梗上挂着短毛和碎油纸。', absent: '干埂只剩被风磨浅的旧足印。' },
    },
    emptyText: '水眼没有动静，干埂的旧足印已被风磨浅，堆在石间的松枝也拾尽了。' },
  { id: 'old_fire', region: 'marsh', name: '背雨石渠', after: ['mud_track', 'sunk_pack'],
    stocks: { wood: { start: 6, cap: 6, interval: 0, growth: 0, choices: [1] } }, once: [2, 3],
    afterOnceText: { 2: '半截石渠挡着雨。渠底那片反字瓦已经被带走，灰里还印着瓦角。' } },
  { id: 'reed_ferryman', region: 'marsh', name: '渡工的刨木滩', after: ['old_fire'], reveal: { item: 'lost_basket' }, once: [0, 2],
    creatures: { marsh_ghost: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { marsh_ghost: { present: '对岸有团影子贴着滩脚走。', absent: '滩脚只有芦苇被风吹动。' } },
    emptyText: '老渡工把刨好的桨平码在石头上。今日岸边没有游影。' },
  { id: 'bank_watch', region: 'marsh', name: '矮石堤', after: ['mud_track', 'old_fire'],
    creatures: { bank_runner: { start: 1, cap: 1, interval: 0, growth: 0 } },
    emptyText: '拦滩客已经让路，矮石堤上只剩被踩松的石块。' },
  { id: 'drowned_mast', region: 'marsh', name: '沉桅高埂', after: ['mud_track', 'sunk_pack'],
    creatures: { mast_beast: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { mast_beast: { present: '桅下有头会行真气的水兽，齿间卡着半枚旧渡钱。', absent: '桅根上还挂着断下的水草，再没有伏兽。' } },
    emptyText: '断桅斜插在苇海里。桅根上还挂着断下的水草，再没有伏兽。' },

  { id: 'ore_rain', region: 'ridge', name: '落矿的冲沟',
    stocks: { ore: { start: 5, cap: 7, interval: 3.5, growth: 2, choices: [0, 1] } },
    emptyText: '沟底已翻过一遍，露着带铁色的石壁。此时没有松动的矿块。' },
  { id: 'empty_oven', region: 'ridge', name: '歇炉的茶棚', once: [1],
    afterOnceText: { 1: '空灶还能挡风，木板原先靠过的地方留了一道浅痕。' } },
  { id: 'miner_echo', region: 'ridge', name: '有回声的矿道', after: ['ore_rain'],
    stocks: { ore: { start: 2, cap: 4, interval: 3, growth: 2, choices: [1] } },
    creatures: { ore_wight: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { ore_wight: { present: '握锤的影子在主道里缓慢巡行。', absent: '主道再无锤声，只剩旁孔透风。' } },
    emptyText: '矿道里没有锤声，旁孔也已翻过。再深处的路被塌石堵死了。' },
  { id: 'rope_run', region: 'ridge', name: '断绳坡', after: ['empty_oven', 'miner_echo'], once: [0],
    creatures: { stone_badger: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { stone_badger: { present: '碎石后传来爪尖蹭岩的声响。', absent: '碎石后空空荡荡。' } },
    afterOnceText: { 0: '挑夫已经把车推回山路。坡下还留着两道压进泥里的车辙。' } },
  { id: 'stone_niche', region: 'ridge', name: '回声石龛', after: ['ore_rain', 'rope_run'], once: [0, 1, 2],
    afterOnceText: { 0: '矿壳下的水图已经取走。破铃还卧在石龛里，岩面会回声。' } },
  { id: 'cracked_bell', region: 'ridge', name: '裂钟背面', after: ['stone_niche'],
    creatures: { bell_wraith: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { bell_wraith: { present: '凝丹境的钟魄伏在钟腹，碎片在它身边打转。', absent: '钟腹已空，碎片散落在钟座周围。' } },
    emptyText: '破钟靠着山石，钟魄已散。风灌进裂口，像一声拉长的喘息。' },

  { id: 'low_tide', region: 'ford', name: '闸外浅阶',
    stocks: { sand: { start: 4, cap: 6, interval: 2, growth: 2, choices: [0] } },
    creatures: { rope_eel: { start: 1, cap: 3, interval: 2.5, growth: 1 } },
    creatureText: { rope_eel: { present: '下游船绳被水里什么东西拖得发紧。', absent: '下游船绳浮在水上，无物牵动。' } },
    emptyText: '浅阶已经扫净，下游的船绳浮着不动。只有浪沫漫过石缝。' },
  { id: 'boat_shade', region: 'ford', name: '没篷的渡舟', once: [1, 2],
    afterOnceText: { 1: '柜子已经离开船底，铁箍旁见得到一道擦痕。船凳仍可歇脚。' } },
  { id: 'flood_lines', region: 'ford', name: '刻洪痕的石壁', once: [0],
    stocks: { sand: { start: 3, cap: 4, interval: 2, growth: 1, choices: [1] } },
    afterOnceText: { 0: '石缝里的布包已经取走。村人留在石壁上的洪痕还辨得出来。' } },
  { id: 'lock_deck', region: 'ford', name: '悬锁木排', after: ['flood_lines'], once: [0, 1],
    afterOnceText: { 1: '挪开的木排歪倚在石上，底下再没有遮住的水洼。' } },
  { id: 'tide_keeper', region: 'ford', name: '旧闸深槽', after: ['low_tide', 'lock_deck'],
    creatures: { tide_spirit: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { tide_spirit: { present: '水退下去，一道人影把重锁往下沉，锁眼里映着镇渡印。', absent: '重锁已经松落，闸间没有守潮灵的影子。' } },
    emptyText: '重锁已经松落。闸间空荡，薄水正从两扇门之间流出去。' },

  { id: 'upstream_lights', region: 'hidden', name: '逆水灯龛', once: [0],
    afterOnceText: { 0: '引火槽里积着新灰，能取走的灯芯已经带走。灯龛背面仍能挡风。' } },
  { id: 'sunken_mooring', region: 'hidden', name: '低水船桩', after: ['upstream_lights'], once: [1],
    creatures: { wick_husk: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { wick_husk: { present: '湿蓑衣下面，一只手攥着微亮的灯芯。', absent: '蓑衣空了，顺水漂过船脚。' } },
    emptyText: '船桩旁再没有灯光。低水时能踩着桩底的石边折返。' },
  { id: 'still_pole', region: 'hidden', name: '风口灯杆', once: [0] },
];

const events = [
  { id: 'reed_banks', name: '浅水苇丛', text: '石头边长着白苇，伸手就够得着。', choices: [
    { label: '挖浅处的苇芯', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 2, loot: { reed: 2 }, enemy: null, outcome: '你挖出几根白苇芯。' },
    { label: '蹚过去挖密处的苇芯', desc: '前头的苇丛长得更密。', days: 0.5, coins: 0, hp: -4, qi: 0, insight: 3, loot: { reed: 3 }, enemy: null, outcome: '你拔起一整丛白苇。', injury: '拔脚时，泥里一片碎蚌壳划破了小腿。' },
  ] },
  { id: 'sunk_pack', name: '烂木桩浅汊', text: '木桩旁卡着个竹篓。水一涨，背带便往桩上缠紧。篓口还扣着。', choices: [
    { label: '把药篓拉上岸', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 1, loot: { lost_basket: 1 }, enemy: null, outcome: '你踩住背带，把整个篓子拖上岸。扣结还紧着，先照原样带走也行。' },
    { label: '沿岸看看搁浅的水路', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '桩内侧有一排老石头，踩着它们就能走回浅滩。' },
  ] },
  { id: 'mud_track', name: '碎石水眼', text: '浅滩在这里分成两股，一股绕过水眼，一股贴着铺了碎石的干埂。', choices: [
    { label: '去石滩猎泥鳞兽', desc: '泥蜕可以做护具。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mud_beast', outcome: '硬鳞破水，泥鳞兽扑上了石滩。' },
    { label: '沿干地绕行，拾漂到埂上的松枝', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 2 }, enemy: null, outcome: '你从干埂绕过水眼，拾走晒透的松枝。' },
    { label: '循足印找粮包', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'reed_fox', outcome: '粮包卡在苇梗上，一只苇尾狐龇着牙守在旁边。' },
  ] },
  { id: 'old_fire', name: '干透的柴窝', revisit: true, text: '半截石渠挡了雨，里面还有旧日烤苇火留下的黑灰。渠底铺着几片手掌大的破瓦。', choices: [
    { label: '添柴歇脚', need: { wood: 1 }, consume: true, days: 0.5, coins: 0, hp: 6, qi: 4, insight: 0, loot: {}, enemy: null, outcome: '火把石壁烘热，湿鞋上慢慢蒸出白气。' },
    { label: '捆些干柴', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 3 }, enemy: null, outcome: '压在石渠里的松枝还干着。捆绳上缠过一角字条，盖的是村里木作铺的印。' },
    { label: '掀开渠底的破瓦', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { kiln_shard: 1 }, enemy: null, outcome: '一片瓦背面刻着反字。用手擦去灰黑，才辨出「两叩一停」。' },
    { label: '把瓦片和刻样架到炉火前', hidden: true, need: { kiln_shard: 1, bell_clapper: 1, backwash_mark: 1, backwash_theory: 1 }, days: 1, coins: 0, hp: 0, qi: 0, insight: 3, loot: { secret_pass: 1 }, enemy: null, outcome: '火一低，铃舌的影子便与两条断纹接上了。渠外灯影逆水而去，那里有条窄路。' },
  ] },
  { id: 'reed_ferryman', name: '修桨的人', text: '老渡工把裂桨架在石头上。「两份苇芯、一根松枝，补桨用。我拿一张进山的路图跟你换。」', choices: [
    { label: '把补桨的料递给渡工', need: { reed: 2, wood: 1 }, consume: true, days: 0.25, coins: 0, hp: 0, qi: 0, insight: 3, loot: { ration: 1, ridge_rubbing: 1, oar_mark: 1 }, enemy: null, outcome: '渡工收了料，从斗笠夹层里取出沉钟岭的路图，又指给你看桨背上的靠岸记号。' },
    { label: '替他赶走巡岸的水鬼', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'marsh_ghost', outcome: '水鬼横在岸边，抱住两臂等人上前。' },
    { label: '帮他把旧桨翻过来', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 1, loot: { oar_mark: 1 }, enemy: null, outcome: '渡工擦掉桨背的泥，指给你看他画下的三处靠岸位置。' },
  ] },
  { id: 'bank_watch', name: '矮石堤', text: '有人靠在堤上歇脚，腰间别着一张折图。你问进山怎么走，他把手搭上木杖。「想借图？跟我过两招。」', choices: [
    { label: '跟拦滩客过招', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bank_runner', outcome: '拦滩客把图塞回腰间，横着木杖站稳。' },
    { label: '下堤另找渡工', days: 0, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '你从较低的石阶下了堤。' },
  ] },
  { id: 'drowned_mast', name: '苇海沉桅', text: '乱苇朝一根断桅倒去。高埂很窄，只容一人站稳。', choices: [
    { label: '到桅边夺渡钱', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mast_beast', outcome: '你刚踩上桅杆，它便张开头侧两道水鳍。' },
    { label: '站在高埂上看水势', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, outcome: '从高处看，水流到了断桅跟前便分作两股。你试着顺着水势慢慢吐气。' },
  ] },
  { id: 'ore_rain', name: '雨后落矿', text: '山雨把细土洗进沟里，松动的矿块露在碎石之间。坡上还有滑落的新痕。', choices: [
    { label: '在沟边拾铁', days: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ore: 2 }, enemy: null, outcome: '洗掉浮泥，底下是寒铁。' },
    { label: '爬上坡去撬矿块', days: 1, coins: 0, hp: -6, qi: 0, insight: 3, loot: { ore: 3 }, enemy: null, outcome: '坡上有大块寒铁，连着石皮撬了下来。', injury: '下坡时一块松石滚下来，撞在膝上。' },
  ] },
  { id: 'empty_oven', name: '歇炉的茶棚', text: '棚内的石灶还可挡风，柴堆旁靠着一块薄木板。', choices: [
    { label: '在石灶里添柴，烤衣歇脚', need: { wood: 1 }, consume: true, days: 0.5, coins: 0, hp: 9, qi: 6, insight: 1, loot: {}, enemy: null, outcome: '湿衣蒸出了白气，烤过火才慢慢暖透。' },
    { label: '掀开木板取些柴', days: 1, coins: 0, hp: 0, qi: 1, insight: 3, loot: { wood: 2, echo_note: 1 }, enemy: null, outcome: '木板反面画着个侧耳贴石的人，掌下还刻有几道难认的线。' },
  ] },
  { id: 'miner_echo', name: '有回声的矿道', text: '矿道深处有两条岔口。旁孔窄，风贴着岩壁往外钻。', choices: [
    { label: '进矿道取石心', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'ore_wight', outcome: '影子一转身，握紧石锤挡住了矿道。' },
    { label: '敲响岩壁，从旁孔去找矿', days: 1, coins: 0, hp: 0, qi: -2, insight: 3, loot: { ore: 2 }, enemy: null, outcome: '回音传到矿道深处。你从旁孔侧身挤进去，捡起松动的碎矿。' },
  ] },
  { id: 'rope_run', name: '断绳坡', text: '老挑夫的货车滑到坡下。断了一半的牵绳还吊在石梁上。', choices: [
    { label: '从侧坡绕下去帮挑夫', days: 1, coins: 10, hp: 0, qi: 0, insight: 2, loot: { ration: 2 }, enemy: null, outcome: '挑夫把失而复得的货捆紧，分你干粮，又给了些灵钱。' },
    { label: '守在车辙旁等它出来', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'stone_badger', outcome: '石甲獾钻出碎石，四爪抓住了坡面。' },
  ] },
  { id: 'stone_niche', name: '回声石龛', revisit: true, text: '矿工把破铃沉进石龛避邪。有人留下撬过的痕，龛底还压着完整的矿壳。', choices: [
    { label: '沿暗缝剥开矿壳', days: 2, coins: 0, hp: 0, qi: -3, insight: 3, loot: { core: 1, ford_chart: 1 }, enemy: null, outcome: '回音到第二声，暗缝里的石屑才脱落。石心下面压着一张折起的旧水图。' },
    { label: '提起石龛里的破铃', days: 1, coins: 5, hp: 0, qi: 0, insight: 1, loot: { ore: 1, stone_rubbing: 1 }, enemy: null, outcome: '铃沿磕上石龛，第二声回音才震松石缝，露出一片寒铁。你听清了哪一声能牵动岩面。' },
    { label: '拿反字瓦叩两下空铃', hidden: true, need: { kiln_shard: 1 }, days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { bell_clapper: 1 }, enemy: null, outcome: '两声回音过后，系着细缆的铃舌从铃腹滑出来。' },
  ] },
  { id: 'cracked_bell', name: '裂钟又响', text: '旧钟裂成了两瓣，钟座几乎压进坡里。', choices: [
    { label: '趁钟片未合，上前取铃', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bell_wraith', outcome: '钟魄猛地抬起头，破片一齐响了。' },
    { label: '退回山脊', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, outcome: '退过山脊，背后的钟声才听不见。' },
  ] },
  { id: 'low_tide', name: '闸外退水', text: '石阶上一道道淤痕见了光。浅阶能落脚，下游却只见船绳。', choices: [
    { label: '把浅阶的潮砂扫入袋中', days: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { sand: 2 }, enemy: null, outcome: '潮水还没回来，阶角的细砂都扫进了袋。' },
    { label: '到下游拦水里的影子', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'rope_eel', outcome: '水里的影子卷过船绳，是一条缠舟兽。' },
  ] },
  { id: 'boat_shade', name: '没篷的渡舟', revisit: true, text: '老船抵在闸槽里，只剩板凳没有泡湿。船帮的绳结朝着往年的靠岸方向。', choices: [
    { label: '到船凳上背风歇脚', days: 1, coins: 0, hp: 13, qi: 8, insight: 1, loot: {}, enemy: null, outcome: '船帮挡住了风。坐到潮势走缓，手脚才不再发冷。' },
    { label: '捞起船底的柜子', days: 1, coins: 15, hp: -4, qi: -2, insight: 2, loot: { sand: 1 }, enemy: null, desc: '水下还能看清柜脚。', outcome: '柜门里积着潮砂，摸到底还有几枚灵钱。', injury: '抬柜时水一顶，胳膊撞上了船底的铁箍。' },
    { label: '把带结的铃舌系在船沿等潮', hidden: true, need: { bell_clapper: 1 }, days: 0.5, coins: 0, hp: 0, qi: 0, insight: 1, loot: { backwash_mark: 1 }, enemy: null, outcome: '船带着铃舌摆向下游，船底显出反朝上游开的深槽。槽口夹着一块刻了花纹的薄铜片。' },
  ] },
  { id: 'tide_keeper', name: '旧闸深槽', text: '两扇旧闸门悬在石槽之上，水从缝隙往外涌。', choices: [
    { label: '等潮落了入闸取印', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'tide_spirit', outcome: '两扇门之间锁链一绷，守潮灵转过了身。' },
    { label: '退回石阶听潮', days: 1, coins: 0, hp: 0, qi: 1, insight: 3, loot: {}, enemy: null, outcome: '你退回高些的石阶，听清今夜哪一阵浪会碰到闸梁。' },
  ] },
  { id: 'flood_lines', name: '石壁上的洪痕', text: '洪痕深浅不一，最上头的一行是落灯村留下的。刻痕之间露出布角，石壁根积着一层细砂。', choices: [
    { label: '从石缝里拽出布包', days: 1, coins: 0, hp: 0, qi: 0, insight: 4, loot: { tide_talisman: 1, tide_note: 1 }, enemy: null, outcome: '布包里有旧符和闸工的潮牌。牌背刻了涨水、落水的时刻。' },
    { label: '沿壁根摸寻潮砂', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { sand: 1 }, enemy: null, outcome: '把潮砂攥进袋时，水还没漫过鞋面。' },
  ] },
  { id: 'lock_deck', name: '悬锁的木排', text: '闸门配重吊着一片木排，一头搁浅，一头还在滴水，露出几只栓东西的铁环。', choices: [
    { label: '解下饭盒歇脚', days: 1, coins: 0, hp: 3, qi: 0, insight: 1, loot: { ration: 3 }, enemy: null, outcome: '饭盒的封口没坏，里头是一包还能吃的干粮。' },
    { label: '抬配重挪开木排', days: 1, coins: 7, hp: 0, qi: -3, insight: 3, loot: { sand: 2 }, enemy: null, outcome: '木排抬起来，底下洒着潮砂和几枚灵钱。' },
  ] },
  { id: 'upstream_lights', name: '逆水的灯龛', text: '埠里成排的旧灯都朝上游开口。灯座有空着的引火槽，最外的一格还在淌水。', choices: [
    { label: '用松枝点起槽里的火', need: { wood: 1 }, consume: true, days: 1, coins: 0, hp: 0, qi: 4, insight: 2, loot: { dry_wick: 2 }, enemy: null, outcome: '火一路传进灯腹。挑掉烧坏的芯，底下还埋着两枚没被浸坏的。' },
    { label: '在灯座背风处坐一阵', days: 1, coins: 0, hp: 14, qi: 7, insight: 1, loot: {}, enemy: null, outcome: '埠里少有潮声，连风也是绕开这里走的。' },
  ] },
  { id: 'sunken_mooring', name: '淹到手心的绳头', text: '船桩低得几乎碰水，一段湿绳绊在桩底。', choices: [
    { label: '下埠拨开湿蓑衣', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'wick_husk', outcome: '蓑衣下那只手一翻，灯芯升起一线火。' },
    { label: '站在岸上松开浮绳', days: 0, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ration: 1 }, enemy: null, outcome: '绳套松开，缠在旁边的一只粮匣漂了回来。' },
  ] },
  { id: 'still_pole', name: '站在风口的灯夫', text: '老人提着灯站在风口。整段路上只有他的火苗总朝斜下方弯，弯过来又自己站直。', choices: [
    { label: '问他风里怎么护灯', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 3, loot: { lamp_sketch: 1 }, enemy: null, outcome: '「看手。」老人把灯转向风里，迎风的那只手一撇，火苗便直了。' },
    { label: '和他聊聊旧渡', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 2, loot: {}, enemy: null, outcome: '老人指着埠外。「东西放在三处。我要是跟船散了，涨潮也能摸回来。」' },
  ] },
];

const enemies = [
  { id: 'mud_beast', name: '泥鳞兽', tags: ['beast', 'scaled'], tier: 0, hp: 25, atk: 7, def: 2, intents: [{ name: '偏头啃咬', kind: 'attack', mult: 1 }, { name: '伏身猛扑', kind: 'heavy', mult: 1.7 }, { name: '蜷尾守鳞', kind: 'guard', mult: 1.35 }, { name: '掀尾扫腿', kind: 'attack', mult: 1 }], coins: 8, insight: 3, loot: { hide: 2, ration: 1 }, desc: '伏身后会扑向脚下，硬鳞收拢时适合恢复真气或蓄势。' },
  { id: 'reed_fox', name: '苇尾狐', tags: ['beast', 'furred'], tier: 0, hp: 24, atk: 6, def: 1, intents: [{ name: '斜掠扑咬', kind: 'attack', mult: 1 }, { name: '团尾护腹', kind: 'guard', mult: 1.4 }, { name: '伏脊跳扑', kind: 'heavy', mult: 1.5 }], coins: 4, insight: 2, loot: { wood: 1, ration: 1 }, desc: '尾上的厚毛扫起了枯苇。它会先绕着干埂寻找扑咬的空当。' },
  { id: 'marsh_ghost', name: '巡岸水鬼', tags: ['spirit'], tier: 0, hp: 28, atk: 8, def: 2, intents: [{ name: '抱臂裹雾', kind: 'guard', mult: 1.4 }, { name: '伸指拖拽', kind: 'attack', mult: 1 }, { name: '借雾扑面', kind: 'heavy', mult: 1.6 }], coins: 10, insight: 4, loot: { reed: 2, reed_talisman: 1 }, desc: '开场先抱臂结雾，准备好再把它拖出水边。' },
  { id: 'bank_runner', name: '拦滩客', tags: ['human'], tier: 0, hp: 28, atk: 8, def: 2, intents: [{ name: '用杖头试探', kind: 'attack', mult: 1 }, { name: '抡杖砸下', kind: 'heavy', mult: 1.5 }, { name: '横杖护身', kind: 'guard', mult: 1.3 }], coins: 6, insight: 3, loot: { ridge_rubbing: 1 }, desc: '这人走惯了滩北的山道，腰间那张正是进山的路图。见他抡起木杖，可以先架住重招。' },
  { id: 'mast_beast', name: '沉桅虺', tags: ['beast', 'scaled'], tier: 1, hp: 34, atk: 10, def: 3, intents: [{ name: '借桅缠身', kind: 'attack', mult: 1 }, { name: '开鳍扑水', kind: 'heavy', mult: 1.65 }, { name: '绕桅遮身', kind: 'guard', mult: 1.2 }, { name: '甩尾扫水', kind: 'attack', mult: 1 }], coins: 19, insight: 5, loot: { path_charm: 1, reed: 2 }, desc: '筑基境的伏水兽。带上破招术和撤退用的符，可留一条回路。' },
  { id: 'ore_wight', name: '持锤矿煞', tags: ['spirit'], tier: 1, hp: 40, atk: 12, def: 4, intents: [{ name: '平锤试探', kind: 'attack', mult: 1 }, { name: '举锤砸顶', kind: 'heavy', mult: 1.72 }, { name: '横锤护臂', kind: 'guard', mult: 1.45 }, { name: '甩锤碰撞', kind: 'attack', mult: 1.1 }], coins: 14, insight: 5, loot: { core: 1, ore: 2 }, desc: '它击打沉重且规律。越阶挑战时先做好撑过重锤的准备。' },
  { id: 'stone_badger', name: '石甲獾', tags: ['beast', 'furred'], tier: 1, hp: 43, atk: 11, def: 6, intents: [{ name: '缩头挡路', kind: 'guard', mult: 1.38 }, { name: '沿坡顶撞', kind: 'attack', mult: 1 }, { name: '转身重掀', kind: 'heavy', mult: 1.62 }], coins: 15, insight: 5, loot: { hide: 2, ore: 1, salve: 1 }, desc: '皮毛粗厚，脊甲又硬。找它转身露侧肋时出手。' },
  { id: 'bell_wraith', name: '裂钟魄', tags: ['spirit'], tier: 2, hp: 54, atk: 14, def: 5, intents: [{ name: '叩钟抖尘', kind: 'attack', mult: 1 }, { name: '聚响压顶', kind: 'heavy', mult: 1.72 }, { name: '并片挡锋', kind: 'guard', mult: 1.38 }, { name: '崩响回荡', kind: 'attack', mult: 1.1 }], coins: 25, insight: 6, loot: { bell_charm: 1, core: 1 }, desc: '钟魄鸣响时正在蓄势，可先护住周身，再截住最重一声。' },
  { id: 'rope_eel', name: '缠舟兽', tags: ['beast'], tier: 2, hp: 50, atk: 15, def: 5, intents: [{ name: '卷尾扫舟', kind: 'attack', mult: 1 }, { name: '扯绳压顶', kind: 'heavy', mult: 1.7 }, { name: '团身潜浮', kind: 'guard', mult: 1.38 }], coins: 20, insight: 6, loot: { sand: 2, ration: 2 }, desc: '动作快，扯紧船绳后会随浪发动重击。' },
  { id: 'tide_spirit', name: '守潮灵', tags: ['spirit'], tier: 2, hp: 72, atk: 17, def: 7, intents: [{ name: '铁索探身', kind: 'attack', mult: 1 }, { name: '沉锁打浪', kind: 'heavy', mult: 1.82 }, { name: '横锁固闸', kind: 'guard', mult: 1.46 }, { name: '返潮扫岸', kind: 'attack', mult: 1.12 }, { name: '闭闸合潮', kind: 'heavy', mult: 1.87 }], coins: 28, insight: 8, loot: { seal: 1, sand: 3 }, desc: '带印回村便可复开旧渡。它的两次重招隔得很近，重进闸前先确认药符够用。' },
  { id: 'wick_husk', name: '湿蓑灯蜕', tags: ['spirit'], tier: 2, hp: 64, atk: 16, def: 6, intents: [{ name: '压帽护火', kind: 'guard', mult: 1.35 }, { name: '引灯掠手', kind: 'attack', mult: 1.1 }, { name: '借火贴身', kind: 'heavy', mult: 1.9 }, { name: '吮焰回息', kind: 'heal', mult: 0.42 }], coins: 23, insight: 7, loot: { dry_wick: 2, tide_pill: 1 }, desc: '会在风回过来时从灯芯汲力。拖久了，它能补回缺损。' },
];

const quests = [
  { id: 'patch_ferry', name: '把旧灯支起来', desc: '村人请你带松枝，把渡口那盏灯支稳。', need: { wood: 2 }, reward: { ration: 3, salve: 1 }, coins: 9, insight: 2, outcome: '村人往灯座下垫进松枝，松开手，灯没再倒。' },
  { id: 'lost_basket_return', name: '把药篓还给药僮', desc: '药僮一看见篓把上的青绳就站起来了。「是我在浅汊落下的，药没散吧？」', need: { lost_basket: 1 }, reward: { salve: 1, ration: 2 }, coins: 8, insight: 2, outcome: '药僮接过药篓，把背带挪回篓口。「扣还紧着，药都在。多谢你原样捞回来。」他分了一包松脂膏给你。' },
  { id: 'reed_salve', name: '拿苇芯换伤药', desc: '药僮朝药锅一指。「给我一份苇芯，换一包伤药。」', need: { reed: 1 }, reward: { salve: 1 }, coins: 4, insight: 2, outcome: '药僮收下苇芯，包好一份松脂膏。「擦在伤口上就行。」' },
  { id: 'apprentice_waterline', name: '问药僮怎么看水线', afterQuest: 'reed_salve', reveal: { item: 'oar_mark' }, desc: '「这不是渡工画的靠岸图吗？再给我一份苇芯，我把采药用的水线图找给你。」', need: { reed: 1 }, reward: { reed_lines: 1 }, coins: 0, insight: 2, outcome: '药僮把两张图并排放在锅台上。「涨水时别认浮沫，看石背的回水。」他把水线图递给你。' },
  { id: 'coat_mend', name: '补蓑衣的里衬', desc: '渡工捏着蓑衣上的破洞，想换一块整泥蜕。', need: { hide: 1 }, reward: { salve: 2, ration: 1 }, coins: 10, insight: 2, outcome: '渡工把泥蜕比在裂口上，拣了两包自己用惯的止血膏给你。' },
  { id: 'sell_forging', name: '拿寒铁换旧渡水图', reveal: { item: 'ridge_rubbing' }, desc: '老匠人从抽屉里抽出一张折旧的水图。「给我一块寒铁试打闸栓，这图你拿去。」', need: { ore: 1 }, reward: { iron_talisman: 1, ration: 3, ford_chart: 1 }, coins: 17, insight: 3, outcome: '老匠人掂了掂寒铁，把通往闭潮渡的水图交给你。' },
  { id: 'last_lantern', name: '把旧渡的印带回来', reveal: { item: 'ford_chart' }, desc: '落灯村留着引水的最后一段闸书。村老请你带回镇渡印。', need: { seal: 1 }, reward: { ration: 6, tide_pill: 1 }, coins: 30, insight: 6, outcome: '村老接过镇渡印，在闸书上压稳，带人去开旧闸。' },
];

const services = [
  { id: 'quests', name: '委托', items: ['reed', 'lost_basket'], choices: ['reed_ferryman:0'] },
  { id: 'market', name: '坊市', choices: ['old_fire:1', 'reed_ferryman:0'] },
  { id: 'workshop', name: '工坊', items: ['hide'], choices: ['old_fire:0', 'old_fire:1', 'mud_track:1'] },
  { id: 'cultivate', name: '修行', items: ['ridge_rubbing', 'reed_lines'], choices: ['drowned_mast:1'] },
];

const deductions = [
  {
    id: 'find_eddy', name: '苇滩哪里能脱身', tier: 0, reveal: { item: 'reed_lines' },
    desc: '药僮走浅水，渡工得划船。把两张图摊到一起，看看水涨了还有哪里能过。',
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
    desc: '茶棚木板上那人把掌心朝下。对着石龛的回声想想，哪一声响时该他落掌？',
    evidence: { echo_note: 1, stone_rubbing: 1 },
    hypotheses: [
      { id: 'first_beat', label: '手叩石面的一刹那沉掌，以冲撞催力' },
      { id: 'no_sound', label: '等到回音全消再沉掌，免得杂音打乱气息' },
      { id: 'return_beat', label: '等第二声回音触及石背，在岩腹应声时沉掌' },
    ],
    answer: 'return_beat', reward: { echo_method: 1 }, days: 0.5, insight: 2,
    success: '石屑随第二声落下。木板上那人等的就是这一拍。照着试过，才摸到抱地听钟借力的时机。',
    miss: '按这个时点落掌，石屑在你沉掌前后便已落开。查查石面真正应声的是哪一拍。',
  },
  {
    id: 'trace_backwash', name: '旧物为何都刻反了', tier: 0, reveal: { item: 'backwash_mark' },
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
  inventory: { ration: 3 },
  gear: { weapon: 'cudgel', armor: 'straw_cape', charm: null },
  arts: [],
  coins: 20,
  satiety: 68,
};
const basket = {
  item: 'lost_basket',
  inspect: '篓柄缠着落灯村药房用的青绳。扣结里还留着干药香，里头的药包没散。掀开篓口取东西就不能照原样归还了。',
  unpack: {
    loot: { wood: 1, salve: 1 },
    outcome: '你解开扣结，把还没泡坏的松脂膏和垫在篓底的松枝取出来。竹编篓口散了，已经不能原样交还。',
  },
};
const victoryQuest = 'last_lantern';
const data = { realms, items, gear, pills, talismans, arts, recipes, regions, sites, events, enemies, quests, services, deductions, rules: {}, starting, basket, victoryQuest };

export { data, realms, items, gear, pills, talismans, arts, recipes, regions, sites, events, enemies, quests, services, deductions, starting, basket, victoryQuest };
export default data;
