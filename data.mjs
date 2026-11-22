const realms = [
  { id: 0, name: '炼气', hp: 30, qi: 12, atk: 8, def: 2, insight: 0, cost: 0, need: {}, pressure: 1, days: 0 },
  { id: 1, name: '筑基', hp: 43, qi: 17, atk: 11, def: 4, insight: 10, cost: 18, need: { reed: 2 }, pressure: 0.76, days: 1 },
  { id: 2, name: '凝丹', hp: 58, qi: 23, atk: 15, def: 6, insight: 23, cost: 35, need: { ore: 2, core: 1 }, pressure: 0.74, days: 2 },
];

const items = [
  { id: 'ration', name: '干粮', kind: 'material', price: 3, sell: 1, desc: '用油纸分包的干粮，饿了就拆一包吃。' },
  { id: 'wood', name: '松枝', kind: 'material', price: 3, sell: 1, desc: '指头粗细的干松枝，折口渗出一点松油。' },
  { id: 'reed', name: '白苇芯', kind: 'material', price: 8, sell: 3, desc: '苇杆劈开，里面露出一条白芯，捻在指间有股青草气。' },
  { id: 'hide', name: '泥蜕', kind: 'material', price: 7, sell: 3, desc: '泥鳞兽腹下的软皮，晾干后还能弯折。' },
  { id: 'ore', name: '寒铁', kind: 'material', price: 13, sell: 5, desc: '沉钟岭矿石里的暗青铁块。刚破开的断面摸着冰凉。' },
  { id: 'core', name: '回声石心', kind: 'material', price: 0, sell: 9, desc: '在沉钟岭取到的灰石，放近耳边能听到断断续续的回响。' },
  { id: 'sand', name: '潮砂', kind: 'material', price: 14, sell: 6, desc: '闭潮渡退水后留下的细砂，晾干以后泛着淡淡的盐白。' },
  { id: 'seal', name: '镇渡印', kind: 'material', price: 0, sell: 0, keepOnFall: true, desc: '闭潮渡守潮灵遗落的渡印，落灯村有人认得它。' },
  { id: 'lost_basket', name: '落水药篓', kind: 'material', price: 0, sell: 0, keepOnFall: true, desc: '从木桩旁捞起的竹篓，箍带尚未松开。落灯村的药僮用这种篓子背药。' },
  { id: 'ridge_rubbing', name: '沉钟岭路图', kind: 'key', price: 0, sell: 0, desc: '画着白苇滩北面进山的路，循着路上的倒钟就能到沉钟岭。' },
  { id: 'ford_chart', name: '旧渡水图', kind: 'key', price: 0, sell: 0, desc: '上面画着废矿与旧渡之间的水路，尚可辨认。' },
  { id: 'echo_note', name: '茶棚木板上的掌谱', kind: 'key', price: 0, sell: 0, desc: '一块烤黑的薄木板。画中人屈肘撑住岩面，贴岩的那只手朝外露着指甲。手旁有一圈混在烟痕里的旧墨。' },
  { id: 'tide_note', name: '闸工的潮牌', kind: 'key', price: 0, sell: 0, desc: '值守闸门时用的潮牌，边缘刻着涨水与落水的时刻。' },
  { id: 'kiln_shard', name: '反字残瓦', kind: 'key', price: 0, sell: 0, desc: '瓦上反写着「两叩一停」。字槽没积烟，空白那面却燎黑了。瓦角留着圆弧形的凹痕，宽窄像敲过一只铃。' },
  { id: 'bell_clapper', name: '带结的铃舌', kind: 'key', price: 0, sell: 0, desc: '铃舌的棕绳打了靠缆常用的反手结。绳圈还留着短短的钩痕，里面蹭着灰白的盐霜。' },
  { id: 'backwash_mark', name: '倒潮刻样', kind: 'key', price: 0, sell: 0, desc: '薄铜片夹在船底深槽，凹纹转向上游。铜边一侧附着硬泥，一侧被水打磨得发亮。亮面留下几道并排的潮线。' },
  { id: 'secret_pass', name: '伏流路引', kind: 'key', price: 0, sell: 0, desc: '三处旧物留下的水路，须等岸边灯影逆流时循水行进。' },
  { id: 'reed_lines', name: '药僮的水线图', kind: 'key', price: 0, sell: 0, desc: '涨、退两页都画了露头石和第三根桩。涨水页的细纹绕过石背，线头朝水眼。退水页同一处却画向出水口。' },
  { id: 'oar_mark', name: '旧桨上的靠岸图', kind: 'key', price: 0, sell: 0, desc: '桨背刻着三处系船点。外滩和桩边的缆线绷直，绕到露石背后的那一条却松松搭着。断桅在第三处桩外。' },
  { id: 'eddy_note', name: '回汊图', kind: 'key', price: 0, sell: 0, desc: '涨水时试出的回流图。苇梗漂过露头石背，顺着浅水贴回水眼。' },
  { id: 'stone_rubbing', name: '石龛音痕', kind: 'key', price: 0, sell: 0, desc: '破铃撞上石龛后，先听到近处一声，过会儿岩腹又响了一阵。落屑的痕只留在第二阵。' },
  { id: 'echo_method', name: '返声行气稿', kind: 'key', price: 0, sell: 0, desc: '你在石龛练成的吐纳节拍。掌根贴岩时，两阵响声之间需要留一口气。' },
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
  { id: 'earth_echo', name: '抱地听钟', tier: 1, cost: 3, power: -3, pierce: 0, guard: 9, break: 0, price: 0, reveal: { item: 'echo_method' }, desc: '掌根当作听声的岩面，以返响收气固守，可接下较重一击。' },
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
  { id: 'r_hide_coat', result: 'hide_coat', count: 1, tier: 0, cost: 5, need: { hide: 2 }, requiresShownHide: true, days: 1 },
  { id: 'r_reed_bow', result: 'reed_bow', count: 1, tier: 0, cost: 4, need: { wood: 1, reed: 2 }, days: 1 },
  { id: 'r_iron_sword', result: 'iron_sword', count: 1, tier: 1, cost: 11, need: { ore: 2, wood: 1 }, days: 1 },
  { id: 'r_iron_coat', result: 'iron_coat', count: 1, tier: 1, cost: 12, need: { ore: 2, hide: 1 }, requiresShownHide: true, days: 1 },
  { id: 'r_tide_spear', result: 'tide_spear', count: 1, tier: 2, cost: 20, need: { ore: 2, sand: 2 }, days: 2 },
  { id: 'r_tide_coat', result: 'tide_coat', count: 1, tier: 2, cost: 19, need: { ore: 2, hide: 1, sand: 1 }, requiresShownHide: true, days: 2 },
  { id: 'r_jetty_charm', result: 'jetty_charm', count: 1, tier: 2, cost: 8, need: { dry_wick: 2, reed: 1 }, days: 1, reveal: { item: 'secret_pass' } },
];

const regions = [
  { id: 'village', name: '落灯村', tier: 0, travel: 1, desc: '旧渡停了之后，村人每晚仍点一盏灯。这里可问路、休整、补给。' },
  { id: 'marsh', name: '白苇滩', tier: 0, travel: 1, desc: '白苇贴着浅岸长，水眼和钉满木桩的浅汊都看得见。矮石堤横在远一点的干地上。' },
  { id: 'ridge', name: '沉钟岭', tier: 1, travel: 2, reveal: { item: 'ridge_rubbing' }, desc: '旧矿口朝着山路，茶棚、冲沟和断绳坡都在坡面上。岩壁还留着这里曾经通水的痕迹。' },
  { id: 'ford', name: '闭潮渡', tier: 2, travel: 2, reveal: { item: 'ford_chart' }, desc: '旧闸还随潮开合。浅阶从刻着水痕的石壁下伸入渡口，前头搁着渡舟与吊着铁环的木排。' },
  { id: 'hidden', name: '回灯埠', tier: 2, travel: 2, secret: true, reveal: { item: 'secret_pass' }, desc: '夹在上下两道水流之间的避风埠，渡工过去在此换灯、卸客。' },
];

const sites = [
  { id: 'reed_banks', region: 'marsh', name: '浅水苇丛',
    stocks: { reed: { start: 5, cap: 8, interval: 4, growth: 2, choices: [0, 1] } },
    emptyText: '脚边都是翻开的泥。能拔的苇芯已经采完了。' },
  { id: 'sunk_pack', region: 'marsh', name: '烂木桩浅汊', once: [0, 1],
    afterOnceText: { 0: '桩脚只剩几丝篓绳。木桩内侧那排石头沿水伸进转弯处，水面漂着几片新刨花。' } },
  { id: 'mud_track', region: 'marsh', name: '碎石水眼', once: [3],
    stocks: { wood: { start: 4, cap: 6, interval: 2.5, growth: 2, choices: [1] } },
    creatures: {
      mud_beast: { start: 1, cap: 3, interval: 4, growth: 1 },
      reed_fox: { start: 2, cap: 4, interval: 4, growth: 1 },
    },
    creatureText: {
      mud_beast: { present: '近岸冒一溜水泡，几片硬鳞擦过露出水面的石头。', absent: '近岸平静，水面看不到鳞片。' },
      reed_fox: { present: '干埂有新兽印，往苇丛去，苇梗上挂着短毛和一角油纸。', absent: '干埂只剩几道磨浅的旧兽印。' },
    },
    emptyText: '水眼没有动静，干埂只剩浅兽印和拾空的碎枝。另一头仍有几块排齐的石头伸进芦苇。' },
  { id: 'old_fire', region: 'marsh', name: '背雨石渠', afterChoices: ['mud_track:3'],
    stocks: { wood: { start: 6, cap: 6, interval: 0, growth: 0, choices: [1] } }, once: [2],
    afterOnceText: { 2: '灰里还印着被拿走的瓦角。渠脚背风，石炉通着气，底下的柴有人用石板遮着。' } },
  { id: 'reed_ferryman', region: 'marsh', name: '渡工的刨木滩', afterChoices: ['sunk_pack:1', 'bank_watch:1'], once: [0, 2],
    creatures: { marsh_ghost: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { marsh_ghost: { present: '对岸的影子贴着滩脚走，渡工停了刀，盯着它看。', absent: '滩脚只有芦苇被风吹动。' } },
    afterOnceText: { 0: '渡工把接上新柄的桨平码在石头上。他脚边另有把翻到背面的旧桨。' } },
  { id: 'bank_watch', region: 'marsh', name: '矮石堤', once: [1],
    creatures: { bank_runner: { start: 1, cap: 1, interval: 0, growth: 0 } },
    emptyText: '拦滩客拄着杖退在一边。你过堤时，他还望着木桩浅汊那头的河弯。' },
  { id: 'drowned_mast', region: 'marsh', name: '沉桅高埂', reveal: { item: 'oar_mark' }, once: [1],
    creatures: { mast_beast: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { mast_beast: { present: '桅下伏着一条有鳍的水兽，齿间有片铜光。', absent: '桅根只挂着断下的水草。' } },
    emptyText: '断桅下没有了伏兽，桅根挂着断草。水还是从高埂下那块露头石的两侧分开。' },

  { id: 'ore_rain', region: 'ridge', name: '落矿的冲沟',
    stocks: { ore: { start: 5, cap: 7, interval: 3.5, growth: 2, choices: [0, 1] } },
    emptyText: '沟底已翻过一遍，露着带铁色的石壁。此时没有松动的矿块。' },
  { id: 'empty_oven', region: 'ridge', name: '歇炉的茶棚', once: [1],
    afterOnceText: { 1: '木板搬走后露出一条烟痕。棚顶还完整，石灶里的火眼没有堵，没人拦着借火歇脚。' } },
  { id: 'miner_echo', region: 'ridge', name: '有回声的矿道', once: [2],
    stocks: { ore: { start: 2, cap: 4, interval: 3, growth: 2, choices: [1] } },
    creatures: { ore_wight: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { ore_wight: { present: '握锤的影子在主道里缓慢巡行。', absent: '主道再无锤声，只剩旁孔透风。' } },
    emptyText: '主道里没有锤声，旁孔也已经翻过。更高一点的石缝还透着外头的天光。' },
  { id: 'rope_run', region: 'ridge', name: '断绳坡', once: [0],
    creatures: { stone_badger: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { stone_badger: { present: '碎石后传来爪尖蹭岩的声响。', absent: '碎石后空空荡荡。' } },
    afterOnceText: { 0: '挑夫把车推回了山路。坡下两道车辙经过一堆松碎石，岩下有口能藏小兽的窄洞。' } },
  { id: 'stone_niche', region: 'ridge', name: '回声石龛', afterChoices: ['miner_echo:2', 'rope_run:0'], once: [0, 1, 2],
    afterOnceText: { 0: '矿壳里只剩空槽。破铃仍搁在龛沿，两侧岩面留着许多用手摸出来的浅印。' } },
  { id: 'cracked_bell', region: 'ridge', name: '裂钟背面', afterChoices: ['stone_niche:1'],
    creatures: { bell_wraith: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { bell_wraith: { present: '钟腹里伏着一团灰影，碎片正沿它身边打转。', absent: '钟腹已空，碎片散落在钟座周围。' } },
    emptyText: '钟腹已经空了，碎片落了满地。背后的窄石脊还能绕回山坡。' },

  { id: 'low_tide', region: 'ford', name: '闸外浅阶',
    stocks: { sand: { start: 4, cap: 6, interval: 2, growth: 2, choices: [0] } },
    creatures: { rope_eel: { start: 1, cap: 3, interval: 2.5, growth: 1 } },
    creatureText: { rope_eel: { present: '下游船绳被水里什么东西拖得发紧。', absent: '下游船绳浮在水上，无物牵动。' } },
    emptyText: '浅阶已经扫净，下游的船绳浮着不动。只有浪沫漫过石缝。' },
  { id: 'boat_shade', region: 'ford', name: '没篷的渡舟', once: [1, 2],
    afterOnceText: { 1: '柜子移走了，船底铁箍旁留着一道擦痕。船凳还干，旧缆仍挂在朝水的钩上。船头灯架上留着旧烟。' } },
  { id: 'flood_lines', region: 'ford', name: '刻洪痕的石壁', once: [0],
    stocks: { sand: { start: 3, cap: 4, interval: 2, growth: 1, choices: [1] } },
    afterOnceText: { 0: '石缝里只剩一道压痕。洪水在壁根留了薄薄的沙，水还够不到这里。' } },
  { id: 'lock_deck', region: 'ford', name: '悬锁木排', once: [0, 1],
    afterOnceText: { 0: '饭盒的提绳在铁环上游来荡去。配重还牵着木排，排底露出半级石阶。', 1: '挪开的木排歪倚在石上，石阶已露出。排边的铁环仍伸手就够得着。' } },
  { id: 'tide_keeper', region: 'ford', name: '旧闸深槽', afterChoices: ['lock_deck:1'],
    creatures: { tide_spirit: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { tide_spirit: { present: '水退下去时，一道人影扯紧锁链，锁旁露出一个方形印钮。', absent: '重锁已经松落，闸间没有人影。' } },
    emptyText: '重锁已经松落，薄水从门缝向外淌。高处还有几级干石阶，可以退过去看涨落。' },

  { id: 'upstream_lights', region: 'hidden', name: '逆水灯龛', once: [0],
    afterOnceText: { 0: '引火槽里积着新灰，能取走的灯芯已经带走。灯龛背面仍能挡风。' } },
  { id: 'sunken_mooring', region: 'hidden', name: '低水船桩', once: [1],
    creatures: { wick_husk: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { wick_husk: { present: '湿蓑衣下面，一只手攥着微亮的灯芯。', absent: '蓑衣空了，顺水漂过船脚。' } },
    emptyText: '船桩旁再没有灯光了，岸边那段湿绳伸手就够得着，尾梢在水里绕成一圈。' },
  { id: 'still_pole', region: 'hidden', name: '风口灯杆', once: [0] },
];

const events = [
  { id: 'reed_banks', name: '浅水苇丛', text: '石头边长着白苇，伸手就够得着。水再深一些，白苇密得挨在一起。', choices: [
    { label: '挖浅处的苇芯', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 2, loot: { reed: 2 }, enemy: null, outcome: '你挖出几根白苇芯。' },
    { label: '蹚过去挖密处的苇芯', days: 0.5, coins: 0, hp: -4, qi: 0, insight: 3, loot: { reed: 3 }, enemy: null, outcome: '你拔起一整丛白苇。', injury: '拔脚时，泥里一片碎蚌壳划破了小腿。' },
  ] },
  { id: 'sunk_pack', name: '烂木桩浅汊', text: '几根歪桩伸出水面。桩内侧的人字石路一直铺到转弯处。', choices: [
    { label: '把竹篓拉上岸', desc: '最外头的木桩卡着竹篓，背带在水面上，篓口的扣还没松。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 1, loot: { lost_basket: 1 }, enemy: null, outcome: '你踩住背带，把整个篓子拖上岸。篓口没散，透出一点药香。' },
    { label: '踩着木桩内侧的石头往前看', desc: '几片蜷起的刨花顺石路旁的水流漂出来。', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '老石路一直铺到弯后。一名老渡工坐在沙滩上刨桨，脚边堆着卷起来的木屑。' },
  ] },
  { id: 'mud_track', name: '碎石水眼', text: '水眼一边是贴着水面的石滩，另一边是绕进芦苇的干埂。', choices: [
    { label: '靠近水边的石滩', desc: '石滩能站稳，从那儿看得见水眼深处。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mud_beast', outcome: '鞋底刚踩实，硬鳞便破了水。一头泥鳞兽扑上石滩。' },
    { label: '绕干埂拾松枝', desc: '石垒横在水边，漂来的枝条会卡在这一侧。', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 2 }, enemy: null, outcome: '你从干埂绕过水眼，拾走卡在碎石间的松枝。' },
    { label: '沿干埂的脚印看看', desc: '脚印进了苇丛，那里有一角裹吃食的油纸。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'reed_fox', outcome: '苇里有个被拖走的干粮包，一只苇尾狐龇着牙守在旁边。' },
    { label: '踩着石头往苇后探', desc: '水眼背后有几块石头排成一线，像是有人铺过。', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '拨开最后一丛苇，露出背雨的半截石渠，里面有旧柴火的焦痕。' },
  ] },
  { id: 'old_fire', name: '背雨石渠', text: '半截石渠能挡雨。砌进渠脚的小石炉朝水开口，炉沿散着几片用来挡风的旧瓦。', choices: [
    { label: '添柴歇脚', desc: '石炉还通风，挨着背风一侧便能烤火。', need: { wood: 1 }, consume: true, days: 0.5, coins: 0, hp: 6, qi: 4, insight: 0, loot: {}, enemy: null, outcome: '火把石壁烘热，湿鞋上慢慢蒸出白气。' },
    { label: '捆些干柴', desc: '有人把松枝藏在渠边石板下，风吹不着。', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 3 }, enemy: null, outcome: '压在石渠里的松枝还干着，折一下便响。' },
    { label: '掀开渠底的破瓦', desc: '灰里露着瓦沿，边上像有划痕。', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { kiln_shard: 1 }, enemy: null, outcome: '瓦上刻的是反字。抹掉一层灰，才辨出「两叩一停」。' },
  ] },
  { id: 'reed_ferryman', name: '渡工的刨木滩', text: '渡工把一柄裂桨架在石头上。脚下还有把旧桨，桨背露出几道刻线。', choices: [
    { label: '把补桨的料递给渡工', desc: '「两份苇芯塞进裂口，用松枝楔住。我拿一张进山的路图跟你换。」', need: { reed: 2, wood: 1 }, consume: true, days: 0.25, coins: 0, hp: 0, qi: 0, insight: 3, loot: { ration: 1, ridge_rubbing: 1, oar_mark: 1 }, enemy: null, outcome: '渡工从斗笠夹层取出沉钟岭的路图。接好桨时，他拿脚边那把旧桨比了比，敲敲桨背上的画。你这才认出第三根桩外的断桅。' },
    { label: '到对岸查看动静', desc: '渡工把刨桨的小刀放回膝头。「那边来来回回，我没看清是谁。」', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'marsh_ghost', outcome: '凑近才看出那东西没有脚。水鬼横在岸边，抱住两臂等人上前。' },
    { label: '帮他把旧桨翻过来', desc: '泥盖住了半截刻线，渡工用拇指擦了几下。', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 1, loot: { oar_mark: 1 }, enemy: null, outcome: '渡工擦去桨背的泥，给你看三根画得歪斜的船桩。「认准第三根，往断桅那头走，有道高埂。」' },
  ] },
  { id: 'bank_watch', name: '矮石堤', text: '有人靠在堤上歇脚，腰间别着一张折图。你问进山怎么走，他把手搭上木杖。「想借图？跟我过两招。」', choices: [
    { label: '跟拦滩客过招', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bank_runner', outcome: '拦滩客把图塞回腰间，横着木杖站稳。' },
    { label: '问他渡工在哪儿', desc: '他顺口提起那张图是河弯的渡工画的。', days: 0, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '他朝木桩浅汊那头一抬下巴。「拐过弯就是刨木滩。他给断桨接新柄呢。」' },
  ] },
  { id: 'drowned_mast', name: '沉桅高埂', text: '断桅斜在桩外。从高埂上往下看，露出水面的石背把浅水分成两股。', choices: [
    { label: '踏上断桅近看', desc: '桅木从高埂斜伸到水面，走到上头能俯看桅根。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mast_beast', outcome: '你刚踩上桅杆，水兽便张开头侧两道鳍。它齿间咬着半枚旧铜钱。' },
    { label: '站在高埂上看水势', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, outcome: '水流到了断桅前便分作两股。你顺着一涨一落试着吐纳，那口闷气慢慢散了。回村找个清静地方，还可以照着练。' },
  ], experiment: {
    id: 'find_eddy',
    desc: '从高埂上能把芦苇梗拨到滩面、桩旁或石背，松手后便能看见它往哪边走。岸脚的水痕在涨潮和退水时都会变。',
    need: { oar_mark: 1, reed_lines: 1 },
    controls: [
      { id: 'release', label: '放苇梗的位置', options: [{ id: 'open_bank', label: '外滩边' }, { id: 'pole', label: '船桩旁' }, { id: 'stone_back', label: '露头石背后' }] },
      { id: 'water', label: '等到什么时候放', options: [{ id: 'rising', label: '水开始上涨' }, { id: 'still', label: '水位停住' }, { id: 'falling', label: '水开始退落' }] },
    ],
    solution: { release: 'stone_back', water: 'rising' }, days: 0.5, insight: 2, reward: { eddy_note: 1 },
    misses: {
      release: { open_bank: '苇梗刚离手就顺着外滩漂进主流，没有折回。', pole: '苇梗绕着船桩打了两个转，挂在露出来的桩刺上。' },
      water: { still: '苇梗贴着石头停住，水面几乎没有动。', falling: '苇梗沿石背滑出水口，跟着退水往下去了。' },
    },
    outcome: '涨水的推力绕到石背，苇梗反朝水眼漂回半尺。你伸手试了试，顺着这一折，身子往侧边一让便避开了迎面来的水。',
  } },
  { id: 'ore_rain', name: '落矿的冲沟', text: '山雨洗走了细土。沟边的碎石泛着铁色，坡壁半腰另嵌着几块还连在石皮上的矿。', choices: [
    { label: '在沟边拾铁', days: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ore: 2 }, enemy: null, outcome: '洗掉浮泥，底下是寒铁。' },
    { label: '爬上坡去撬矿块', days: 1, coins: 0, hp: -6, qi: 0, insight: 3, loot: { ore: 3 }, enemy: null, outcome: '坡上有大块寒铁，连着石皮撬了下来。', injury: '下坡时一块松石滚下来，撞在膝上。' },
  ] },
  { id: 'empty_oven', name: '歇炉的茶棚', text: '棚檐还能挡雨。石灶留着烧过的痕，旁边一块薄板挡着没淋湿的柴。', choices: [
    { label: '在石灶里添柴，烤衣歇脚', need: { wood: 1 }, consume: true, days: 0.5, coins: 0, hp: 9, qi: 6, insight: 1, loot: {}, enemy: null, outcome: '湿衣蒸出了白气，烤过火才慢慢暖透。' },
    { label: '掀开木板取些柴', days: 1, coins: 0, hp: 0, qi: 1, insight: 3, loot: { wood: 2, echo_note: 1 }, enemy: null, outcome: '木板反面画着个侧耳贴石的人，掌下还刻有几道难认的线。' },
  ] },
  { id: 'miner_echo', name: '有回声的矿道', text: '矿道深处有两条岔口。旁孔窄，风贴着岩壁往外钻。再高些还有道透光的石缝。', choices: [
    { label: '沿主道往里走', desc: '主道一直往下，尽头一带的岩层颜色比旁孔深。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'ore_wight', outcome: '持锤的影子正守着石心。它一转身，握紧石锤挡住了矿道。' },
    { label: '侧身钻进旁孔', desc: '旁孔出来的风夹着干粉，脚边碎石有铁色。', days: 1, coins: 0, hp: 0, qi: -2, insight: 3, loot: { ore: 2 }, enemy: null, outcome: '你的杖端磕响了岩壁。趁那边的锤声一停，你侧身挤进旁孔，摸到几块松动的碎矿。' },
    { label: '贴着透光的石缝往外看', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '石缝对面是回声石龛，龛口朝山背。矿口外有道窄坡，从那儿能绕过去。' },
  ] },
  { id: 'rope_run', name: '断绳坡', text: '老挑夫的货车滑到坡下。断了一半的牵绳还吊在石梁上。', choices: [
    { label: '从侧坡绕下去帮挑夫', days: 1, coins: 10, hp: 0, qi: 0, insight: 2, loot: { ration: 2 }, enemy: null, outcome: '挑夫捆好货，分你干粮和灵钱。他指向矿口旁的窄坡：「绕到山背就是回声石龛。旧矿工到那儿躲过风。」' },
    { label: '在车辙旁守一会儿', desc: '车辙截断了一串爪印，能看清它在哪堆碎石里断的。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'stone_badger', outcome: '石甲獾钻出碎石，四爪抓住了坡面。' },
  ] },
  { id: 'stone_niche', name: '回声石龛', revisit: true, text: '一只边沿开裂的铃倒扣在龛口。底下的矿壳有道细缝，深处塞着一角发白的纸。', choices: [
    { label: '沿暗缝剥开矿壳', days: 2, coins: 0, hp: 0, qi: -3, insight: 3, loot: { core: 1, ford_chart: 1 }, enemy: null, outcome: '暗缝里的石屑松了。撬出石心才看见，底下的纸是张叠起来的旧水图。' },
    { label: '提起石龛里的破铃', desc: '铃边擦着岩面，一角后头还有空隙。', days: 1, coins: 5, hp: 0, qi: 0, insight: 1, loot: { ore: 1, stone_rubbing: 1 }, enemy: null, outcome: '铃磕上石龛，岩腹的第二阵回音才震下一片寒铁。顺着震开的石缝望去，几级旧阶贴着裂钟绕向背后。' },
    { label: '拿瓦角比对铃沿', desc: '两处凹弧的宽窄正好能接上。', hidden: true, need: { kiln_shard: 1 }, days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { bell_clapper: 1 }, enemy: null, outcome: '照瓦上的旧字叩完，铃腹发出很短的一声。系着细缆的铃舌从裂口滑了出来。' },
  ], experiment: {
    id: 'read_echo',
    desc: '能用杖头叩响龛口的破铃。旁边一块岩面齐腰，刚好够伸手撑住。近处的一声过去后，岩腹还会回一阵。',
    need: { echo_note: 1, stone_rubbing: 1 },
    controls: [
      { id: 'hand', label: '手怎么放', options: [{ id: 'back', label: '用手背贴住岩面' }, { id: 'hover', label: '手悬在岩面前' }, { id: 'palm', label: '用掌心贴住岩面' }] },
      { id: 'beat', label: '什么时候沉气', options: [{ id: 'first', label: '听见第一阵响' }, { id: 'second', label: '听见第二阵响' }, { id: 'quiet', label: '响声散尽以后' }] },
    ],
    solution: { hand: 'palm', beat: 'second' }, days: 0.5, insight: 2, reward: { echo_method: 1 }, learnArts: ['earth_echo'],
    misses: {
      hand: { back: '石面轻震，手背一麻。那股震动到腕骨前就散了。', hover: '你听见铃响，却只觉得手前有阵冷风。' },
      beat: { first: '你先沉了气，岩腹那一响赶上来时，掌根已经卸了力。', quiet: '这一口气落下去，岩里只剩细细的摩擦声，掌下没借到劲。' },
    },
    outcome: '第二阵响撞在掌根，你的胳膊没有被震开，脚下反而站得更稳。离石又试一回，那股劲还能收进肘里。石上这招被你练成了，叫抱地听钟。',
  } },
  { id: 'cracked_bell', name: '裂钟背面', text: '旧钟裂成了两瓣，钟座几乎压进坡里。背后的窄脊还通着山路。', choices: [
    { label: '从裂片间靠近钟座', desc: '裂口时宽时窄，破片下面透出一线灰光。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bell_wraith', outcome: '钟魄猛地抬起头，破片一齐响了。' },
    { label: '退回山脊', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, outcome: '退过山脊，背后的钟声才听不见。' },
  ] },
  { id: 'low_tide', name: '闸外浅阶', text: '退水露出几级能落脚的石阶。阶角堆着潮水留下的细砂，下游一根旧船绳浮在水面。', choices: [
    { label: '把浅阶的潮砂扫入袋中', days: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { sand: 2 }, enemy: null, outcome: '潮水还没回来，阶角的细砂都扫进了袋。' },
    { label: '走到下游船绳边', desc: '船绳能当扶手，水下轮廓得靠近些才认得出。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'rope_eel', outcome: '水里一团长影卷过船绳，是一条缠舟兽。' },
  ] },
  { id: 'boat_shade', name: '没篷的渡舟', revisit: true, text: '老船抵在闸槽里，船帮挡得住风。旧缆挂在船沿外侧，绳套上有一圈盐霜。船头灯架被熏黑了一半。', choices: [
    { label: '到船凳上背风歇脚', days: 1, coins: 0, hp: 13, qi: 8, insight: 1, loot: {}, enemy: null, outcome: '船帮挡住了风。坐到潮势走缓，手脚才不再发冷。' },
    { label: '捞起船底的木柜', days: 1, coins: 15, hp: -4, qi: -2, insight: 2, loot: { sand: 1 }, enemy: null, desc: '船沿下有两只木柜脚。门板被水压着，还没漂开。', outcome: '柜门里积着潮砂，摸到底还有几枚灵钱。', injury: '抬柜时水一顶，胳膊撞上了船底的铁箍。' },
    { label: '拿铃绳比一比旧缆', desc: '两根绳上的结都从反手收紧，绳圈磨损在同一侧。', hidden: true, need: { bell_clapper: 1 }, days: 0.5, coins: 0, hp: 0, qi: 0, insight: 1, loot: { backwash_mark: 1 }, enemy: null, outcome: '把绳圈并排挂起，旧缆松开一段，船身随即摆开半尺。船底露出一道朝上游的槽，槽口夹着块薄铜片。' },
  ], experiment: {
    id: 'trace_backwash',
    desc: '灯架头上能斜立一片瓦，底下还有半截灯芯。两面各有挂钩，靠船心的是短钩，朝水的弯钩结了盐霜。架脚两道铜片宽的扁缝，一道积干灰，一道留着潮线。',
    need: { kiln_shard: 1, bell_clapper: 1, backwash_mark: 1 },
    controls: [
      { id: 'tile', label: '瓦上字的方向', options: [{ id: 'fire', label: '朝向灯火' }, { id: 'away', label: '背向灯火' }] },
      { id: 'hanger', label: '铃舌挂在哪里', options: [{ id: 'inner', label: '舱里短钩' }, { id: 'outer', label: '舷外弯钩' }] },
      { id: 'plate', label: '铜片插进哪道扁缝', options: [{ id: 'wall', label: '朝船心一侧' }, { id: 'water', label: '朝水一侧' }] },
    ],
    solution: { tile: 'away', hanger: 'outer', plate: 'water' }, days: 0.75, insight: 3, reward: { secret_pass: 1 },
    misses: {
      tile: { fire: '热烟很快钻满了字槽，瓦上只剩一块黑影，辨不出纹路。' },
      hanger: { inner: '短钩离灯太近。铃舌摆了几下，投出来的影子都被船帮截住。' },
      plate: { wall: '铜片上只照亮半道刻纹，船外的水面还是黑的。' },
    },
    outcome: '灯照过瓦背，铜上的潮纹和铃影接到一处。你沿着影子摸到舷外第一处落脚石，后面一串石凹逆着水伸到拐角。从船头能看见低檐下发红的旧灯，那是回灯埠。',
  } },
  { id: 'tide_keeper', name: '旧闸深槽', text: '两扇旧闸门悬在石槽之上，水从缝隙往外涌。', choices: [
    { label: '等水低了跨进闸间', desc: '闸门下有排低石阶。水落一些，脚就能踩实。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'tide_spirit', outcome: '两扇门之间锁链一绷，守潮灵转过了身，印从它攥着的重锁下显出来。' },
    { label: '退回石阶听潮', days: 1, coins: 0, hp: 0, qi: 1, insight: 3, loot: {}, enemy: null, outcome: '你退回高些的石阶，听清今夜哪一阵浪会碰到闸梁。' },
  ] },
  { id: 'flood_lines', name: '刻洪痕的石壁', text: '洪痕深浅不一，最上头一行留了个「灯」字。壁根积着一层细砂，石缝里露出一点泡软的布角。', choices: [
    { label: '从石缝里拽出布包', days: 1, coins: 0, hp: 0, qi: 0, insight: 4, loot: { tide_talisman: 1, tide_note: 1 }, enemy: null, outcome: '布包里有旧符和闸工的潮牌。牌背刻了涨水、落水的时刻。' },
    { label: '沿壁根摸寻潮砂', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { sand: 1 }, enemy: null, outcome: '把潮砂攥进袋时，水还没漫过鞋面。' },
  ] },
  { id: 'lock_deck', name: '悬锁木排', text: '闸门配重吊着一片木排，一头搁浅，一头滴着水。木排下隐约露出一角石阶。', choices: [
    { label: '解下铁环上的漆盒', desc: '盒扣用布裹住，提绳在比水面高半尺的铁环上。', days: 1, coins: 0, hp: 3, qi: 0, insight: 1, loot: { ration: 3 }, enemy: null, outcome: '木排搁浅的一端能坐。你坐下解开盒扣，里面是没泡水的干粮。' },
    { label: '抬配重挪开木排', days: 1, coins: 7, hp: 0, qi: -3, insight: 3, loot: { sand: 2 }, enemy: null, outcome: '木排挪开，底下除了潮砂和几枚灵钱，还有一列旧石阶，沿着闸脚下到深槽。' },
  ] },
  { id: 'upstream_lights', name: '逆水灯龛', text: '成排旧灯都朝上游开口，灯座外淌着水，引火线却能从干处续进槽里。灯龛的背面避风。', choices: [
    { label: '用松枝点起槽里的火', need: { wood: 1 }, consume: true, days: 1, coins: 0, hp: 0, qi: 4, insight: 2, loot: { dry_wick: 2 }, enemy: null, outcome: '火一路传进灯腹。挑掉烧坏的芯，底下还埋着两枚没被浸坏的。' },
    { label: '在灯座背风处坐一阵', days: 1, coins: 0, hp: 14, qi: 7, insight: 1, loot: {}, enemy: null, outcome: '埠里少有潮声，连风也是绕开这里走的。' },
  ] },
  { id: 'sunken_mooring', name: '低水船桩', text: '船桩低得几乎碰水。一件湿蓑衣搭在桩边，旁边一截绳结贴水浮着，绳头牵进苇丛。', choices: [
    { label: '下埠拨开湿蓑衣', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'wick_husk', outcome: '蓑衣下那只手一翻，灯芯升起一线火。' },
    { label: '站在岸上松开浮绳', days: 0, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ration: 1 }, enemy: null, outcome: '绳套松开，缠在旁边的一只粮匣漂了回来。' },
  ] },
  { id: 'still_pole', name: '风口灯杆', text: '老人提着灯站在风口，火苗弯过来又自己站直。脚下灯杆缠过几圈旧缆，杆上还能认出旧渡的烙印。', choices: [
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
  { id: 'reed_salve', name: '给药僮一份白苇芯', desc: '药僮搅着锅里的松脂。「还差一份白苇芯。你要有，匀我一份，这锅熬好也包你一份。」', need: { reed: 1 }, requiresKnownMaterials: false, reward: { salve: 1 }, coins: 4, insight: 2, outcome: '药僮收下苇芯，包好一份松脂膏。「擦在伤口上就行。」' },
  { id: 'apprentice_waterline', name: '问药僮怎么看水线', reveal: { item: 'oar_mark' }, desc: '药僮瞥见桨背的画。「渡工画的是桩。我找药草，不同水位都得去一趟。帮我匀一份白苇芯，我把水线图给你。」', need: { reed: 1 }, requiresKnownMaterials: false, reward: { reed_lines: 1 }, coins: 0, insight: 2, outcome: '药僮从灶台下抽出叠在一起的两页。「这不是一回画的。水刚涨时去一趟，退了又走一趟。有几道线两次可不一样。」' },
  { id: 'coat_mend', name: '补蓑衣的里衬', desc: '渡工捏着蓑衣上的破洞，想换一块整泥蜕。', need: { hide: 1 }, reward: { salve: 2, ration: 1 }, coins: 10, insight: 2, outcome: '渡工把泥蜕比在裂口上，拣了两包自己用惯的止血膏给你。' },
  { id: 'sell_forging', name: '拿寒铁换旧渡水图', reveal: { item: 'ridge_rubbing' }, desc: '老匠人从抽屉里抽出一张折旧的水图。「给我一块寒铁试打闸栓，这图你拿去。」', need: { ore: 1 }, reward: { iron_talisman: 1, ration: 3, ford_chart: 1 }, coins: 17, insight: 3, outcome: '老匠人掂了掂寒铁，把通往闭潮渡的水图交给你。' },
  { id: 'last_lantern', name: '把旧渡的印带回来', reveal: { item: 'ford_chart' }, desc: '落灯村留着引水的最后一段闸书。村老请你带回镇渡印。', need: { seal: 1 }, reward: { ration: 6, tide_pill: 1 }, coins: 30, insight: 6, outcome: '村老接过镇渡印，在闸书上压稳，带人去开旧闸。' },
];

const services = [
  { id: 'quests', name: '委托', public: true },
  { id: 'market', name: '坊市', public: true },
  { id: 'workshop', name: '工坊', public: true },
  { id: 'cultivate', name: '修行', choices: ['drowned_mast:1'] },
];

const deductions = [
  {
    id: 'find_eddy', name: '松着的缆绳', tier: 0, reveal: { item: 'oar_mark' },
    desc: '同一段滩，为什么有的缆绷紧了，有的没有？',
  },
  {
    id: 'read_echo', name: '那只贴岩的手', tier: 0, reveal: { item: 'echo_note' },
    desc: '茶棚那幅旧画只画了一个人。他撑着石面，为什么还凑近了去听？',
  },
  {
    id: 'trace_backwash', name: '瓦上反字', tier: 0, reveal: { item: 'kiln_shard' },
    desc: '字刻反了，却不止一笔。是谁给这片瓦留下的字，它原先摆在哪里？',
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
