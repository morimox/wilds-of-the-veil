const wild = (start, cap, interval) => ({ start, cap, interval, growth: 1, curve: 'wild', fixedPopulation: true });
const resident = (count) => ({ start: count, cap: count, interval: 0, growth: 0 });
const attack = (name, mult = 1) => ({ name, kind: 'attack', mult });
const heavy = (name, mult) => ({ name, kind: 'heavy', mult });
const guard = (name, mult) => ({ name, kind: 'guard', mult });
const drain = (name, mult) => ({ name, kind: 'drain', mult });
const quarryPack = ['sand_quarry_skink', 'sand_quarry_guard', 'sand_quarry_matriarch'];

const sites = [
  { id: 'snow_hunt_scree', region: 'snow_pass', name: '雪线下的暖涧',
    creatures: { snow_gully_otter: wild(3, 4, 5.5), snow_rime_antelope: wild(2, 3, 7.5) },
    creatureText: {
      snow_gully_otter: { present: '涧边的碎冰下有细小的气泡。上岸的脚印一排浅、一排深。', absent: '碎冰旁的水已经清了，裸石上没有新印。' },
      snow_rime_antelope: { present: '坡顶有一对角时隐时现。那边的石屑偶尔会滚进热水里。', absent: '高处只剩被踩开的苔和一层旧雪。' },
    } },
  { id: 'sky_hunt_spillway', region: 'sky_terrace', name: '石台背面的分水槽', reveal: { item: 'fault_receipt' },
    creatures: { sky_spillway_lizard: wild(2, 3, 10) },
    creatureText: {
      sky_spillway_lizard: { present: '水面高低错开两寸。两道贴槽游动的黑脊会在最窄处重叠。', absent: '两道水槽都能看到底。矮沿后传来流水落在石洞里的空声。' },
    } },
  { id: 'sand_hunt_anchors', region: 'hanging_vein', name: '旧矿索下的岩沟', once: [1],
    creatures: { sand_anchor_scorpion: wild(2, 3, 11) },
    choiceText: { 1: { after: '被扳松的断梁倒在石阶旁。从缺口可以看到底下的露天石场。' } },
    creatureText: {
      sand_anchor_scorpion: { present: '沟底的浮砂被往两边推开。旧矿索一沉一抬，石阶边冒出一只几乎与岩面同色的大钳。', absent: '矿索平垂在沟底。风把石阶边的擦痕慢慢填平。' },
    } },
  { id: 'sand_hunt_colony', region: 'hanging_vein', name: '梁后的露天石场', afterChoices: ['sand_hunt_anchors:1'],
    creatures: { sand_quarry_skink: resident(72), sand_quarry_guard: resident(8), sand_quarry_matriarch: resident(1) },
    creatureText: {
      sand_quarry_skink: { present: '黑背砂蜥挤在矮石之间，听见碎砂响就从几个方向一起抬头。', absent: '矮石之间只剩散沙，小些的黑背蜥已经不见了。' },
      sand_quarry_guard: { present: '柱子背后不时闪过一抹暗红，有粗尾擦着柱根绕过来。', absent: '柱根下的长尾印越来越浅，再没有红脊护着缝口。' },
      sand_quarry_matriarch: { present: '背阴的旧石垒底下有一双白额巨蜥的眼睛，石垒随着它呼吸一抖一抖。', absent: '背阴石垒塌了一角，白额老蜥再没探出头。' },
    },
    emptyText: '倒石柱下已经听不见尾巴刮砂的声音。岩缝里只剩薄薄的干沙，出去的窄道仍照得见日光。' },
];

const events = [
  { id: 'snow_hunt_scree', name: '雪线下的暖涧',
    text: '涧水从雪下冒出来，浅处有不冻的水洼。矮桥旁绑着护栈人系的布条，沿着往上走几步就能回火棚。高坡的一行蹄印踩穿了雪壳，沉进水里的脚印却细了许多。',
    choices: [
      { label: '沿浅涧的爪印找斑獭', desc: '冰沿下露出一抹湿毛，附近的木桩上有两道刨到芯里的爪印。岸上有能站稳的干石。', days: 0.25, enemy: 'snow_gully_otter',
        outcome: '斑獭蓦地钻出冰边。它一摆身，绷在胡须上的水珠甩过半条浅涧。' },
      { label: '踩露出的山石上坡，接近石羚', desc: '蹄印深到能蓄一指水，坡顶还插着半截断矛。石羚俯身时，尖角比肩还低。', days: 0.375, enemy: 'snow_rime_antelope',
        outcome: '石羚从高处退了半步，两只前蹄同时把雪壳碾碎。' },
    ] },
  { id: 'sky_hunt_spillway', name: '石台背面的分水槽',
    text: '对照湖底旧约上的水位记号，才认出石台背面两排浅刻。刻痕往下接着被雾挡住的旧分水槽。槽边有道干燥的矮沿，低头便能望见清水下的两道脊鳍。',
    choices: [
      { label: '扶矮沿接近水槽里露脊鳍的东西', desc: '这段槽只有两步宽。两道水流往相反的方向弯过去。', days: 0.375, enemy: 'sky_spillway_lizard',
        outcome: '两道脊鳍突然并在一起。水蜥贴着回上来的水露出头，泥水溅到了矮沿上。' },
    ] },
  { id: 'sand_hunt_anchors', name: '旧矿索下的岩沟',
    text: '矿架的几股旧绳往下垂到沟里，石阶只从靠壁那侧经过。旧绳一动，两只固定矿索的粗铁钩就撞上梁木。靠上面的石阶还有半截断梁向外支着，后面漏进一线日光。回叩石院的石路仍从支木外侧走。',
    choices: [
      { label: '沿石阶下沟，在矿索旁迎石甲蝎', desc: '大钳擦过岩壁，尖端应声刮下一块薄石。钳外侧没有能插进刀刃的缝。', days: 0.375, enemy: 'sand_anchor_scorpion',
        outcome: '浮砂沿绳洒落。石甲蝎慢慢举起双钳，把碎石挤得咯吱响。' },
      { label: '扳开上一级石阶旁的断梁', desc: '横梁受力的一头早已折断。人留在石阶上，就够得着另一端。', days: 0.25, stay: true,
        outcome: '干梁一声脆响倒向墙边。后面是一片露天石场，地上的爪印有短有长，最宽的那道拖过好几块石柱基。' },
    ] },
  { id: 'sand_hunt_colony', name: '梁后的露天石场',
    text: '旧石场有几排没立稳的柱子，柱脚外全是蜥洞。矮石会挡住视线，听见爪响也分不清是哪条蜥先靠过来。入口的日光就在身后。',
    choices: [
      { label: '越过倒柱，在蜥群边找落脚处', desc: '越过倒柱便有石地可打。前面两道缝离得很近，走哪一边都可能遇上守巢的大蜥。', days: 0.25, encounter: quarryPack,
        outcome: '你刚在石地站稳，前面便窜出一道影子，石片擦着靴面翻了过去。' },
    ] },
];

const enemies = [
  { id: 'snow_gully_otter', name: '雪涧斑獭', tier: 3, hp: 61, atk: 13, def: 4, tags: ['beast', 'furred'], insight: 6,
    intents: [attack('贴冰掠爪'), drain('团水纳息', 0.65), heavy('卷水跃岸', 1.55), attack('转尾打腕', 1.08)],
    desc: '皮毛湿透仍能困住暖气。它会借涧水牵走真气，尾尖离水就要跃上冰沿。',
    loot: { foundation_core: 2, beast_meat: 3, hide: 2 },
    chanceLoot: { beast_eye: { count: 1, chance: 0.55 } } },
  { id: 'snow_rime_antelope', name: '覆雪石羚', tier: 3, hp: 77, atk: 14, def: 6, tags: ['beast', 'furred'], insight: 8,
    intents: [attack('侧肩撞开薄冰'), guard('收膝护颈', 1.42), heavy('蹬岩下撞', 1.67), attack('踏碎雪壳', 1.1)],
    desc: '蹄缘像磨钝的铁。它缩起前膝时能用角护颈，接着会从坡上踏碎一层雪。',
    loot: { foundation_core: 3, beast_meat: 5, hide: 3 } },
  { id: 'sky_spillway_lizard', name: '双脊浮水蜥', tier: 6, hp: 112, atk: 22, def: 7, tags: ['beast', 'scaled'], insight: 10,
    intents: [attack('沿矮沿扑咬'), drain('两脊拨水闭息', 0.85), heavy('贴岸撩尾', 1.57), attack('回身探爪', 1.06)],
    desc: '平时顺流走，翻起两道脊鳍时能把流向拨转，连人的真气也会被水挟走。',
    loot: { gold_core: 3, beast_meat: 5, hide: 2 },
    chanceLoot: { beast_eye: { count: 1, chance: 0.60 } } },
  { id: 'sand_anchor_scorpion', name: '盘绳石甲蝎', tier: 6, hp: 103, atk: 22, def: 10, tags: ['beast', 'scaled', 'stoneborn'], insight: 11,
    intents: [guard('合钳挡住颈下', 1.48), attack('探钳夹腕'), heavy('钩住岩缝挥尾', 1.59), attack('横钳脱石', 1.12)],
    desc: '双钳合得紧，甲缝在出钳时才露出来。它把尾钩抵进岩缝以后，整条尾巴都能甩过来。',
    loot: { beast_meat: 2, hide: 2 },
    chanceLoot: { gold_core: { count: 4, chance: 0.75 } } },
  { id: 'sand_quarry_skink', name: '黑背砂蜥', tier: 4, hp: 64, atk: 15, def: 5, tags: ['beast', 'scaled'], insight: 5,
    intents: [attack('绕石咬脚'), guard('缩腹贴石', 1.32), heavy('侧身甩尾', 1.54)],
    desc: '黑背鳞和砂石颜色相近，露出浅色腹侧时就能看见它整条尾巴往回弓。',
    loot: { beast_meat: 2, hide: 1 },
    chanceLoot: { foundation_core: { count: 1, chance: 0.52 } } },
  { id: 'sand_quarry_guard', name: '赤脊护巢蜥', tier: 6, hp: 117, atk: 23, def: 8, tags: ['beast', 'scaled'], insight: 11,
    intents: [attack('贴柱探爪'), drain('张喉卷走石尘', 0.8), heavy('横压柱脚', 1.65), attack('摆尾截路', 1.1)],
    desc: '颈鳞磨得发红。喉间发鼓时会把石尘卷到眼前，紧跟着从靠岩的一边压过来。',
    loot: { beast_meat: 4, hide: 2 },
    chanceLoot: { gold_core: { count: 3, chance: 0.62 }, beast_eye: { count: 1, chance: 0.35 } } },
  { id: 'sand_quarry_matriarch', name: '白额老蜥', tier: 7, hp: 155, atk: 27, def: 11, tags: ['beast', 'scaled'], insight: 16,
    intents: [attack('昂首拨倒立石'), guard('伏进石垒', 1.46), heavy('拖尾扫过石垒', 1.68), drain('张口吸进冷砂', 0.95), attack('低身攀咬', 1.12)],
    desc: '白额上一道旧伤已经长进鳞下。它白天卧在石垒背阴处，有人接近才会推倒前面的立石。',
    loot: { gold_core: 3, beast_meat: 6, hide: 4 },
    chanceLoot: { gold_core: { count: 5, chance: 0.65 }, beast_eye: { count: 1, chance: 0.75 } } },
];

export const huntMaterialContent = { sites, events, enemies };
