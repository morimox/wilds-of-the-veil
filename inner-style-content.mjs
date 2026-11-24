const manuals = [
  {
    id: 'reed_hand_manual', name: '苇岸抱拳谱', grade: '凡品', tier: 0,
    carried: '几张薄纸用苇叶包着。上面画的都是空手招式，每张纸的下角还画了握桨的样子。',
    desc: '白苇滩的渡工用这套手法护住手指和腕子。拳收得住，照样能推开贴身的对手。',
    specialty: ['fist'],
    ranks: [
      { base: { atk: 1 }, focus: { atk: 2 }, effect: '出手更稳，空手或戴指虎打拳时尤其有力。' },
      { tier: 0, cost: 8, days: 0.5, need: { reed: 2, hide: 1 },
        base: { atk: 1, hp: 2 }, focus: { atk: 3 }, effect: '下盘稳了些，能多挨一点伤。空手和指虎的拳头更重。' },
      { tier: 2, cost: 22, days: 1.25, need: { hide: 4, qi_core: 3 },
        base: { atk: 1, hp: 4 }, focus: { atk: 4, guard: 1 }, effect: '能多挨一点伤。以空手或指虎出拳时，收拳还能卸去来招的一点力。' },
    ],
  },
  {
    id: 'eaves_breath_manual', name: '檐下调息册', grade: '凡品', tier: 0,
    carried: '驿里用麻线缝起来的薄册。第一页有旧水渍，落款是桑拙。',
    desc: '折水驿医给冒雾挑重货的人编的册子。湿气贴着胸口时，照着册里说的慢慢换一口气。',
    specialty: [],
    ranks: [
      { base: { qi: 2, restQi: 1 }, effect: '能多存些真气，歇脚时也回得更快。' },
      { tier: 1, cost: 16, days: 0.75, need: { reed: 4, core: 1 },
        base: { qi: 3, restQi: 2, fogTolerance: 1 }, effect: '歇息更容易回气，入雾也能多撑一阵。' },
      { tier: 3, cost: 40, days: 2, need: { reed: 6, core: 4, foundation_core: 1 },
        base: { qi: 4, restQi: 3, fogTolerance: 2, retreat: 0.05 },
        effect: '最适合常进浓雾的人。歇脚回气更多，撤身时也能少挨一点追击。' },
    ],
  },
  {
    id: 'watchstring_manual', name: '听弦诀', grade: '凡品', tier: 0,
    carried: '旧箭囊里拆下来的几片缝纸。画里人的拇指搭着弦，眼睛却盯着草尖。',
    desc: '松场猎户守夜用的法子。开弓前按住呼吸，能听清弦下最细的一点响动。',
    specialty: ['bow', 'crossbow'],
    ranks: [
      { base: { perception: 2 }, focus: { atk: 1 }, effect: '容易察觉对手的起手。用弓弩时，箭落得更实。' },
      { tier: 1, cost: 13, days: 0.75, need: { wood: 3, hide: 2 },
        base: { perception: 3, atk: 1 }, focus: { atk: 2 }, effect: '更容易看出对手要做什么。弓弩的力道尤其有长进。' },
      { tier: 3, cost: 32, days: 1.5, need: { hide: 4, battle_sinew: 3, core: 2 },
        base: { perception: 5, atk: 1 }, focus: { atk: 3, pierce: 1 }, effect: '善于抢先看破对手。用弓弩时，连护甲缝里也更容易射进去。' },
    ],
  },
  {
    id: 'levee_pole_manual', name: '撑堤行气谱', grade: '灵品', tier: 1,
    carried: '竹尺庭里手抄的种本。每一式都有一张并排的小图，标的是脚跟、竹杆和堤沿的方向。',
    desc: '傅澄把堤工拿大杆抵住载货船的力道融进尺法。杆头受力时，让那股劲沿肩背落到脚跟。',
    specialty: ['spear', 'staff'],
    ranks: [
      { base: { def: 1 }, focus: { atk: 1, guard: 1 }, effect: '平常挨打轻些，执枪杖出招时也能顺势卸力。' },
      { tier: 2, cost: 22, days: 1, need: { wood: 4, ore: 2, qi_core: 2 },
        base: { def: 1, hp: 2 }, focus: { atk: 2, guard: 2 }, effect: '能多挨一点伤。枪杖打出去时，顺杆卸力比从前牢靠。' },
      { tier: 4, cost: 50, days: 2.25, need: { wood: 6, battle_sinew: 5, foundation_core: 2 },
        base: { def: 1, hp: 4, atk: 1 }, focus: { atk: 3, guard: 3 },
        effect: '持枪杖出招时能稳住身子，即使和对手同时出手也能防上一手。' },
    ],
  },
  {
    id: 'shallows_step_manual', name: '渡板轻身谱', grade: '灵品', tier: 2,
    carried: '余节把常用步法画在船账背面。绳边上的黑脚印又浅又短，最末一页倒贴了一小条涂了油的布。',
    desc: '掌船人余节年年换搭板。他把踩松板时的收步编成了几式，教人弯膝错身时顺便换一口气。',
    specialty: [],
    ranks: [
      { base: { dodge: 0.04, evadeQi: 1 }, effect: '被打时有机会错开来势。闪过一招，便能趁那一口空当回些真气。' },
      { tier: 3, cost: 25, days: 1, need: { reed: 4, hide: 3, qi_core: 3 },
        base: { dodge: 0.055, evadeQi: 1, retreat: 0.025 }, effect: '换脚更轻，也能少挨一点撤身时的追击。' },
      { tier: 5, cost: 47, days: 2, need: { core: 4, battle_sinew: 4, foundation_core: 2 },
        base: { dodge: 0.07, evadeQi: 2, retreat: 0.035 }, effect: '脚下更轻捷些，避开一招后也能回上更多真气。' },
      { tier: 7, cost: 71, days: 3, need: { black_iron: 4, beast_eye: 2, gold_core: 2 },
        base: { dodge: 0.08, evadeQi: 3, retreat: 0.045 }, effect: '翻身与换气接得更短。成功闪身时回气最多，身后有追手仍能先站稳。' },
    ],
  },
  {
    id: 'split_current_manual', name: '分水刀剑诀', grade: '灵品', tier: 3,
    carried: '用油绢裹住的旧册，折进去的那片纸上画着刀和剑，两条笔迹在水纹处会到一起。',
    desc: '断齿内堰旧巡守留下的刀剑法。一刃下去，薄甲、重甲在手上传回来的力道各不相同。',
    specialty: ['blade', 'sword'],
    ranks: [
      { base: { atk: 1 }, focus: { atk: 2, pierce: 1 }, effect: '用刀剑更利，刃口对准甲片的接缝时容易送进去。' },
      { tier: 4, cost: 34, days: 1.75, need: { ore: 4, hard_scale: 3, foundation_core: 2 },
        base: { atk: 2 }, focus: { atk: 2, pierce: 2 }, effect: '平常出手也更重。刀剑练熟后，更容易割开叠甲。' },
      { tier: 5, cost: 57, days: 2.75, need: { black_iron: 5, battle_sinew: 6, foundation_core: 3 },
        base: { atk: 2 }, focus: { atk: 3, pierce: 3 }, effect: '用刀剑斩重甲格外顺手。对手没有护甲时，仍能受益于练出来的力道。' },
      { tier: 7, cost: 78, days: 3.5, need: { black_iron: 8, hard_scale: 8, gold_core: 3 },
        base: { atk: 2 }, focus: { atk: 4, pierce: 4 }, effect: '专练破甲的刀剑法。面对厚甲时比一般兵刃更容易打实。' },
    ],
  },
  {
    id: 'forge_fist_manual', name: '沉炉拳经', grade: '灵品', tier: 3,
    carried: '叩石院拓下的拳谱。最厚一叠纸的边上烧了一个焦口，等入了门才会去翻那几页。',
    desc: '叩石院做石工的人练的拳法。把臂膀松开、让腰背先吃重，再从一处把力送出去。',
    specialty: ['fist'],
    ranks: [
      { base: { atk: 1, qi: 1 }, focus: { atk: 2, pierce: 1 }, effect: '空手或戴指虎出拳时，更容易打进硬甲的缝。' },
      { tier: 3, cost: 32, days: 1.5, need: { core: 3, battle_sinew: 3, foundation_core: 1 },
        base: { atk: 1, qi: 1 }, focus: { atk: 3, pierce: 1 },
        fistCharge: { name: '沉炉贯拳', power: 9, pierce: 5, qi: 4 },
        effect: '练成沉炉贯拳。用空手或指虎先蓄一回合，下一回合再贯出一拳。出拳耗真气，能打进硬甲。' },
      { tier: 5, cost: 54, days: 2.5, need: { black_iron: 5, core: 4, hard_scale: 4, foundation_core: 3 },
        base: { atk: 1, qi: 2 }, focus: { atk: 4, pierce: 1 },
        fistCharge: { name: '沉炉贯拳', power: 11, pierce: 6, qi: 4 },
        effect: '普通拳更重，沉炉贯拳也更能撼动厚甲。' },
      { tier: 7, cost: 78, days: 3.5, need: { hard_scale: 6, battle_sinew: 8, gold_core: 3 },
        base: { atk: 2, qi: 2 }, focus: { atk: 4, pierce: 2 },
        fistCharge: { name: '沉炉贯拳', power: 13, pierce: 7, qi: 5 },
        effect: '沉炉贯拳的劲更足，耗的真气也更多。惯用拳脚的人仍可随时打普通拳。' },
    ],
  },
  {
    id: 'stone_shoulder_manual', name: '石肩诀', grade: '玄品', tier: 5,
    carried: '极薄的册子用旧竹片作封。竹片背上划着深浅不同的两道手掌印。',
    desc: '岸边补箩老人所授。脚跟既已踏实，肩可以跟着杖头转，连短柄重锤都能借到这股力。',
    specialty: ['staff', 'hammer'],
    ranks: [
      { base: { hp: 2, perception: 2 }, focus: { atk: 2, guard: 1 },
        effect: '下盘多一分支撑，也更容易觉察对手。用长杖或重锤时能把力落到实处。' },
      { tier: 6, cost: 55, days: 2.25, need: { ore: 6, battle_sinew: 6, foundation_core: 3 },
        base: { hp: 4, perception: 3, atk: 1 }, focus: { atk: 3, guard: 2 },
        effect: '用长杖或重锤出手时，肩背能顺着兵器把来招引开一点。' },
      { tier: 7, cost: 81, days: 3.5, need: { black_iron: 7, hard_scale: 7, gold_core: 3 },
        base: { hp: 5, perception: 4, atk: 1 }, focus: { atk: 4, guard: 2 },
        effect: '不论手里拿着哪件兵器，身子都更耐打。用长杖或重锤时，力道也更盛。' },
      { tier: 8, cost: 108, days: 4.25, need: { black_iron: 10, battle_sinew: 10, gold_core: 5 },
        base: { hp: 6, perception: 4, atk: 2 }, focus: { atk: 5, guard: 2 },
        effect: '练到足以把长杖或重锤抡得又重又稳。只要已经把劲使出去，就有余力护住肩背。' },
    ],
  },
];

const earlyKnuckles = 'leather_knuckles';
const lateKnuckles = 'echo_knuckles';
const forgeBench = 'forge_fist_bench';
const forgeSample = 'forge_knuckle_sample';
const gearItems = [
  { id: earlyKnuckles, name: '缠皮指虎', kind: 'gear', price: 0, sell: 2,
    desc: '几枚小铁环缝进厚皮，舒展手掌也不会滑脱。握紧拳时，铁角刚好覆住指节。' },
  { id: lateKnuckles, name: '叩石指虎', kind: 'gear', price: 0, sell: 9,
    desc: '暗金环外嵌一块薄甲。手指弯拢，甲缘便从指虎上探出一线。' },
];

const gear = [
  { id: earlyKnuckles, slot: 'weapon', tier: 0, weaponClass: 'fist', atk: 2, durability: 32, repair: 4,
    entry: '渡工用的缠皮指虎。戴着照样能使拳法，既比赤手结实，也能省着些修兵器的钱。' },
  { id: lateKnuckles, slot: 'weapon', tier: 4, weaponClass: 'fist', atk: 6, perception: 2, durability: 50, repair: 15,
    trait: { kind: 'pierce', intent: 'guard', bonus: 2 },
    entry: '筑基中期可用。专为打拳的人做。对手缩紧时，翘起的甲缘能挑开他护身的一线缝。' },
];

const recipes = [
  { id: 'r_leather_knuckles', result: earlyKnuckles, count: 1, tier: 0, reveal: { item: 'reed_hand_manual' },
    cost: 5, days: 0.75, need: { hide: 2, reed: 1, ore: 1 },
    desc: '按渡工拳谱封底打好铁环，用苇纤把铁环和兽革一起缝牢。' },
  { id: 'r_echo_knuckles', result: lateKnuckles, count: 1, tier: 4, facility: 'forge', facilityLevel: 2,
    reveal: { item: forgeSample }, cost: 38, days: 3, need: { black_iron: 6, hard_scale: 5, battle_sinew: 5, foundation_core: 2 },
    desc: '按叩石院留下的铁样打出暗金环，再换上韧筋和厚甲片。铁样留着做比较。' },
];

const sites = [
  { id: forgeBench, name: '挡风墙下的石墩', region: 'sand_bell_cloister', afterChoices: ['sand_cloister_trial:0'],
    once: [0, 1, 2],
    afterOnceText: {
      0: '第一只石墩端正搁在托木上。柯醒伸指弹去拳垫上的石灰，示意你把手伸过去。',
      1: '拳垫上留下浅浅一个凹印。柯醒擦去垫边石粉，翻过磨破一角的搬石护手。',
      2: '两只石墩都落回托木上。柯醒把要送去试脚力的石墩用麻布裹好，拳垫仍靠墙立着。',
    } },
];

const events = [
  {
    id: forgeBench, name: '挡风墙下的石墩',
    text: '挡风墙下有两只炼脚劲的石墩。一只翻倒时把垫脚的木块压劈了。石工柯醒用裹布的手扶着石墩，脚尖却腾不出来去踩托木。墙上挂着一块让人试拳的软垫。',
    choices: [
      { label: '帮柯醒把托木移到石墩底下', days: 0.25, stay: true,
        outcome: '你把托木送进石墩底下，柯醒慢慢松手。石墩坐稳了。他把裹手的布解开一层，指腹全是灰。「愿意学的话，去那垫子上打一拳，我看看你的手腕。」' },
      { label: '在软垫上打一拳给柯醒看', afterChoice: 0, days: 0.25, stay: true, loot: { forge_fist_manual: 1 },
        outcome: '柯醒拿虎口在你的腕后托了一下，再让你打。垫里的砂从上到下响了一遍。他从石墩底下取出一叠拓纸。「前几页就够你练一阵。合上了腕，再去看留在后头的那一拳。」' },
      { label: '给柯醒厚甲片和坚韧兽筋，修好他的搬石护手', afterChoice: 1,
        desc: '他抬起护手，指尖那块甲片已经磕出缺口，穿甲的旧筋一拉便散。',
        days: 0.5, stay: true, need: { hard_scale: 1, battle_sinew: 1 }, consume: true, loot: { [forgeSample]: 1 },
        outcome: '柯醒用兽筋缝紧甲片，戴着修好的护手接住你递来的石墩。在你临走时，他递来一对留着钳口的铁环。「这是打拳护手的铁样。你回去找个锻铁的，叫他照打时把内缘磨圆。」' },
    ],
  },
];

function appendChoice(sites, events, id, choice, descriptionAfter) {
  const site = sites.find((entry) => entry.id === id);
  const event = events.find((entry) => entry.id === id);
  const index = event.choices.push(choice) - 1;
  (site.once ??= []).push(index);
  if (descriptionAfter) (site.choiceText ??= {})[index] = { after: descriptionAfter };
}

function extendScenes(sites, events, allGear, enemies) {
  appendChoice(sites, events, 'reed_ferryman', {
    label: '问渡工手腕上的旧伤', desc: '他拿桨时总用掌根托住桨柄，握拳时虎口还有两道白痕。', days: 0.125,
    stay: true, loot: { reed_hand_manual: 1 },
    outcome: '「船急靠岸，桨夹过手。」渡工把掌根在旧木头上轻轻一抵，手腕一点也没折。「野外碰上东西，空着手也能先护住自己。」他解下桨套内的苇叶包，给你一本薄拳谱。「封底画了指虎，找几根皮带照着打就成。」',
  }, '渡工仍用掌根托着桨。空下来的桨套翻搁在石上。');

  appendChoice(sites, events, 'willow_yard', {
    label: '请桑拙说说是怎么换气的', afterVisitChoice: 1,
    desc: '驿医扶着新木槽把背上的药箱卸下。一路走在雾里，他坐下时呼吸还是匀的。', days: 0.125,
    stay: true, loot: { eaves_breath_manual: 1 },
    outcome: '桑拙把木槽边的凳子让给你，伸手放低你紧绷的肩。「气沉到胸口下面。能站着换得过来，进雾才不至于一张嘴就乱喘。」他从空药箱里翻出手缝的小册子，递了你一份。',
  });

  appendChoice(sites, events, 'pine_stand', {
    label: '问架后的老人为何试弓时盯着草尖', afterVisitChoice: 2,
    desc: '架后有人把试弓搭在膝上，手里拈着一根已经磨破的旧弦。她想用一片兽革接住勒弦的地方。',
    days: 0.25, need: { hide: 1 }, consume: true, stay: true, loot: { watchstring_manual: 1 },
    outcome: '卓缨拿兽革绕住磨弦处，拉了两次，弦头再没响过。她让你看清草根哪里刚动过，又从旧箭囊里抽出一摞小纸片。「听清这点细响，再放手。」',
  }, '卓缨把接好的试弓搁在架背。弦下垫着一片新兽革。');

  appendChoice(sites, events, 'zhao_bamboo_duel', {
    label: '给砖圈补两根练杆，请傅澄讲撑杆的法子', afterVisitChoice: 0,
    desc: '砖圈边还剩一根短竹尺。两只练杆的套头搁在廊柱下，换上两截松木，再镶一道铁箍就能接牢。',
    days: 0.375, need: { wood: 2, ore: 1 }, consume: true, stay: true, loot: { levee_pole_manual: 1 },
    outcome: '傅澄拿修好的杆抵过你两次。第一次劲都压在两手，第二次却像从肩背滑到了脚下。「沿堤救船就靠这一手。」他让弟子去廊下取来一摞抄本。',
  }, '两根练杆都靠回砖圈外。新箍上还沾着一些铁屑。');

  appendChoice(sites, events, 'zhao_float_goods', {
    label: '问余节怎么躲过翻起的搭板', afterVisitChoice: 0,
    desc: '新晒架后，一串浪推歪了搭板。余节只往旁边让了半步，连手里的网坠都没丢。',
    days: 0.25, stay: true, loot: { shallows_step_manual: 1 },
    outcome: '余节叫你把膝盖松一松，等木边抬起再往旁边让。「脚悬着也能倒口气。来，你再踩一遍，我在这头看着。」他从网柜里拿出几张画着脚印的旧账纸。',
  }, '搭板随浪抬了一下。余节踩到另一头，把几枚网坠码回木柜。');

  appendChoice(sites, events, 'dyke_sunken_yard', {
    label: '和郁稷拆下旧梁上的铁槽', afterVisitChoice: 2,
    desc: '旧梁已经拖上岸。郁稷指着梁头一道裹着油绢的裂口，想先把压住它的铁槽松开。',
    days: 0.375, stay: true, loot: { split_current_manual: 1 },
    outcome: '铁槽里果然塞着一小包油绢。郁稷翻到画着刀和剑的那页。「巡堰人以前把刀竖着挂在这儿。这册子是他们换班学招用的。」他抖干绢上的水，请你把散开的纸好好收住。',
  }, '旧梁上的铁槽已经卸开，裂口内只剩一圈干了的油痕。');

  appendChoice(sites, events, 'sand_basket_shed', {
    label: '请老人教那一步怎么站稳', afterVisitChoice: 4,
    desc: '老人摸了摸竹杖上两道长年磨出来的掌印，拿杖尖把圈里的碎石拨到一边。',
    days: 0.5, stay: true, loot: { stone_shoulder_manual: 1 },
    outcome: '他让你往圈里挪半步，再用杖贴住你的肩，你终于没往后栽。老人掀开箩筐底，拿两片旧竹夹住薄册。「早些年打石头，也用的是这个站法。学会了再去打石，别拿肩去撞。」',
  }, '圈里的碎石拨成一堆，老人已经把竹杖靠回凳后。');

  const trial = events.find((event) => event.id === 'sand_cloister_trial');
  trial.choices[0].outcome += '他又指了指挡风墙，石工柯醒正在那儿招手，等人帮忙扶石墩。';

  const cutter = allGear.find((item) => item.id === 'trail_cutter');
  (cutter.traits ??= []).push({ kind: 'accuracy', bonus: 0.09 });
  cutter.entry += '护手宽，手腕顺着对手的撤步微转，刀尖也比较容易跟上。';
  const crossbow = allGear.find((item) => item.id === 'black_crossbow');
  (crossbow.traits ??= []).push({ kind: 'accuracy', bonus: 0.12 });
  crossbow.entry += '弩臂压得稳，对手偏开半步时也容易把准头拨回来。';

  const eel = enemies.find((enemy) => enemy.id === 'zhao_rush_eel');
  eel.dodge = 0.12;
  eel.desc += '出手落向泥沟时，它会扭着身子从旁边滑开。';
  const elder = enemies.find((enemy) => enemy.id === 'sand_basket_mender');
  elder.accuracy = 0.08;
  elder.dodge = 0.08;
  elder.desc += '他让开棍梢只用半步，自己的竹杖倒常能点到动着的手腕。';
  const tuner = enemies.find((enemy) => enemy.id === 'sand_tuner');
  tuner.accuracy = 0.06;
  tuner.desc += '钝剑总跟着脚步走，光退半步有时仍会挨上一记。';
}

export const innerStyleContent = {
  items: [
    ...manuals.map(({ id, name, carried }) => ({
      id, name, kind: 'manual', price: 0, sell: 0, keepOnFall: true, desc: carried,
    })),
    ...gearItems,
    { id: forgeSample, name: '叩石指虎铁样', kind: 'key', price: 0, sell: 0,
      desc: '柯醒留给匠人的铁样。铁环内沿的毛边还在，旁边的钳印指明了应该从哪边收口。' },
  ],
  gear,
  recipes,
  sites,
  events,
  innerStyles: manuals.map(({ carried, ...manual }) => manual),
  enemyInnerStyles: {
    zhao_spar: { id: 'levee_pole_manual', rank: 2, weaponClass: 'staff' },
    sand_basket_mender: { id: 'stone_shoulder_manual', rank: 2, weaponClass: 'staff' },
  },
  extendScenes,
};
