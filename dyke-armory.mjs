const region = 'burnt_weir';
const floodYard = ['dyke_yard_otter', 'dyke_yard_croc', 'dyke_yard_boar', 'dyke_old_croc'];
const tailwaters = ['dyke_yard_otter', 'dyke_yard_croc', 'dyke_yard_boar'];
const resident = (count) => ({ start: count, cap: count, interval: 0, growth: 0 });
const wild = (start, cap, interval) => ({ start, cap, interval, growth: 1, curve: 'wild', fixedPopulation: true });
const attack = (name, mult = 1) => ({ kind: 'attack', name, mult });
const heavy = (name, mult = 1.55) => ({ kind: 'heavy', name, mult });
const guard = (name, mult = 1.4) => ({ kind: 'guard', name, mult });

const items = [
  { id: 'dyke_backstrap', name: '老鳄的背筋', kind: 'key', price: 0, sell: 0,
    desc: '从沉木滩的老鳄脊骨旁取下。两边粗细不等，一合一松，仿佛还在牵着背鳞转身。' },
  { id: 'dyke_jacket_pattern', name: '短褂的裁样', kind: 'key', price: 0, sell: 0,
    desc: '针匠蒋榛依老鳄的背筋画的纸样。两边的皮条错着下针，急转身体时肩口仍能松开。' },
  { id: 'dyke_slip_jacket', name: '避浪短褂', kind: 'gear', price: 0, sell: 0,
    desc: '衣肩叠得薄，皮条藏在腋下。急着摆身时衣摆跟得上，接重手还得自己架住。' },
];

const gear = [
  { id: 'dyke_slip_jacket', slot: 'armor', tier: 4, def: 5, hp: 8, qi: 3, retreat: 0.06, durability: 58, repair: 18,
    trait: { kind: 'dodge', intent: 'attack', bonus: 0.13 },
    entry: '筑基中期可穿的轻褂。肩腋跟得上摆身，遇到贴身的普通来招偶尔能干净躲开。' },
];

const recipes = [
  { id: 'r_dyke_slip_jacket', result: 'dyke_slip_jacket', tier: 4, count: 1, facility: 'forge', facilityLevel: 2,
    reveal: { item: 'dyke_jacket_pattern', need: { dyke_backstrap: 1 } },
    cost: 52, need: { battle_sinew: 12, hide: 6, core: 3, foundation_core: 4 }, days: 5,
    desc: '用老鳄的背筋比出肩口转动的余量，再把干过水的兽筋穿进皮条里。纸样和脊腱留着。' },
];

const sites = [
  { id: 'dyke_spillway_shed', region, name: '水尺旁的木架', once: [0, 1],
    afterOnceText: {
      0: '木尺夹回横杆上，后面的沉木滩从浅步道就能望见。',
      1: '水尺的下缘还是湿的。下游几块露头的石块连成一条岸路。',
    } },
  { id: 'dyke_sunken_yard', region, name: '沉木滩', afterChoices: ['dyke_spillway_shed:0'], once: [2],
    creatures: { dyke_yard_otter: resident(10), dyke_yard_croc: resident(6), dyke_yard_boar: resident(4), dyke_old_croc: resident(1) },
    creatureText: {
      dyke_yard_otter: { present: '水獭在几块泡烂的木头旁打转。', absent: '泡木旁只剩水上的一圈浮屑。' },
      dyke_yard_croc: { present: '几截灰脊沿桩边慢慢往深处退。', absent: '桩边再看不见贴水的鳞光。' },
      dyke_yard_boar: { present: '高些的泥岸被拱得一块硬、一块软。', absent: '泥已经沉实，岸上没有再翻出来的新土。' },
      dyke_old_croc: { present: '倒梁挨着水面的那头时不时被往上推一下。', absent: '放梁的凹处空下来，水还留着被鳄尾打散的泥。' },
    },
    afterOnceText: { 2: '护住木架的横梁提回了岸边，再抬水尺时不用挨着深水走。' } },
  { id: 'dyke_tailwaters', region, name: '下游的石槽', afterChoices: ['dyke_spillway_shed:1'],
    creatures: { dyke_yard_otter: wild(3, 5, 8), dyke_yard_croc: wild(3, 5, 10), dyke_yard_boar: wild(1, 3, 13) },
    creatureText: {
      dyke_yard_otter: { present: '浅石旁翻了几块刚咬过的蚌壳。', absent: '蚌壳边的水清了。' },
      dyke_yard_croc: { present: '齐水的桩脚有带弧的腹鳞擦痕。', absent: '桩脚的鳞印泡淡了，水纹里没有拖尾的痕。' },
      dyke_yard_boar: { present: '靠上的干草底下松了一团新土。', absent: '干草已经倒伏，再听不到拱土。' },
    } },
];

const events = [
  { id: 'dyke_spillway_shed', name: '水尺旁的木架',
    text: '这根水尺只在退水时用。量水人郁稷扶着架脚，等两根细绳都不绷了才把尺抽出来。墙后翻倒半截横木，从石缝能看见水在往下走。',
    choices: [
      { label: '帮郁稷把水尺夹回横杆上', days: 0.25, insight: 2, stay: true,
        outcome: '郁稷往石缝后指了指。「沉木滩从这里能下去。老鳄一翻身，连压水的梁也会动。有个蒋针匠从前就盯着它的背，真要拿到脊腱，回城去找她。」' },
      { label: '沿水尺底下的水声查看下游', days: 0.25, insight: 1, stay: true,
        outcome: '水尺底下的水贴着石槽向东去。你用枯枝拨开浮草，看清露出水面的几块石头可以踏。' },
    ] },
  { id: 'dyke_sunken_yard', name: '沉木滩',
    text: '堰墙后搁着一长排沉木，一半搭岸，一半探到水上。量水时要用的旧梁倒在另一头。踩过近处的短木能到滩口，沿断桩外缘绕过去则能从干地看到水面。',
    choices: [
      { label: '踩着木板走到滩口找猎物', desc: '近一截。隔着木排要走到边上，才能看清动静从哪来。', days: 0.25, encounter: floodYard,
        outcome: '木排往下一沉，水拍过靴边。湿亮的背影从梁下抢了出来。' },
      { label: '绕断桩外缘，在干地等水里有动静', desc: '路长些。隔一片浅水，哪边有东西冲过来都能看见。', days: 0.5,
        encounter: floodYard, openingRange: true, outcome: '水线另一侧溅起一串泥点。那东西正越过两块泡木，离你还有一段。' },
      { label: '把滩尾的旧梁垫起，请郁稷收回木架', desc: '旧梁仍压在水里。留两根松木垫住，郁稷才够得着梁下的绳。', days: 0.5,
        guardedBy: floodYard, need: { wood: 2 }, consume: true, loot: { ore: 3 }, stay: true,
        outcome: '郁稷抽回梁下的绳，把旧梁往岸这头拖。几截拆下的寒铁钉留给了你，他抱着木架从浅水走回去。' },
    ] },
  { id: 'dyke_tailwaters', name: '下游的石槽',
    text: '水流穿过几堆夹泥的石块，水到半尺高就漫进河里。近岸露着压蚌的小台，槽中间的几根桩没叫水冲走。',
    choices: [
      { label: '在两股水碰头的浅滩找猎物', days: 0.25, encounter: tailwaters,
        outcome: '水从两侧涌到脚前。河岸上的影子往你这边动了。' },
      { label: '沿鳞片留下的擦痕走到木桩边', desc: '桩脚的水向上翻，能站稳的一边在外侧。', days: 0.375,
        enemy: 'dyke_yard_croc', outcome: '撞着桩身的是一截鳞背。鳄头顶过木桩，直朝你扭来。' },
      { label: '翻过槽岸，沿刚拱开的土找过去', desc: '拱过的地方踩上去还有些软，尽头有一线干草。', days: 0.5,
        enemy: 'dyke_yard_boar', outcome: '草尖猛地一晃，一头白脚猪从草下抬头，獠牙上带着泥。' },
    ] },
];

const enemies = [
  { id: 'dyke_yard_otter', name: '肩上沾泥的獭', tier: 3, hp: 62, atk: 13, def: 4, tags: ['beast', 'furred'], insight: 5,
    intents: [attack('掠过湿木咬来'), heavy('推开浮木扑向肩头', 1.54), attack('用尾巴扫腕', 1.05)],
    desc: '肩头那圈毛常粘着泥。出水后它喜欢贴着湿木走，能把两根浮木推成一条斜线。',
    loot: { beast_meat: 2, hide: 1, battle_sinew: 1 }, chanceLoot: { foundation_core: { count: 1, chance: 0.64 } } },
  { id: 'dyke_yard_croc', name: '木桩旁的鳞鳄', tier: 3, hp: 76, atk: 15, def: 7, tags: ['beast', 'scaled'], insight: 7,
    intents: [guard('把背鳞顶紧木桩'), attack('回头去咬落脚处'), heavy('脱桩挥尾', 1.58)],
    desc: '背鳞磨得和木桩一般灰。尾巴离了桩，就有足够地方扫过近岸。',
    loot: { beast_meat: 3, hard_scale: 1, battle_sinew: 1, foundation_core: 1 },
    chanceLoot: { foundation_core: { count: 1, chance: 0.58 } } },
  { id: 'dyke_yard_boar', name: '白脚野猪', tier: 4, hp: 93, atk: 17, def: 7, tags: ['beast', 'furred'], insight: 9,
    intents: [attack('侧着肩把人往水边挤'), heavy('后蹄刨地挑牙', 1.62), guard('在干草前收紧肩背'), attack('沿槽岸顶来', 1.1)],
    desc: '前蹄一圈白毛都湿透了，向直处顶不动就拐到岸边来挤。它停下刨后蹄时，左边那支牙往往先抬。',
    loot: { beast_meat: 5, hide: 2, battle_sinew: 2, foundation_core: 1 },
    chanceLoot: { foundation_core: { count: 2, chance: 0.62 } } },
  { id: 'dyke_old_croc', name: '沉木滩的老鳄', tier: 5, hp: 117, atk: 20, def: 9, tags: ['beast', 'scaled'], insight: 13,
    perception: 23, strategy: 'bulwark',
    intents: [attack('推起横梁抢到岸边'), guard('斜过鳞脊护住颈下', 1.48), heavy('借浮梁卷尾砸下', 1.65),
      { kind: 'heal', name: '沉入静水缓气', mult: 0.39 }, attack('贴着桩根摆身', 1.1)],
    desc: '粗梁压过它的后背，却看不出曾受过伤。翻身时背鳞从颈后依次错开，贴水过去轻得没有声。',
    loot: { beast_meat: 5, hide: 3, hard_scale: 3, battle_sinew: 4, foundation_core: 3, dyke_backstrap: 1 },
    chanceLoot: { foundation_core: { count: 2, chance: 0.6 } } },
];

const quests = [
  { id: 'dyke_tailor_handoff', region: 'zhao_city', name: '拿泡过水的兽筋给蒋榛试剪', tier: 3,
    reveal: { item: 'dyke_backstrap', need: { dyke_backstrap: 1 } }, need: { battle_sinew: 5 },
    desc: '针匠蒋榛在水尺档旁晾袖口。她用指腹比了比老鳄的背筋上那道细弧，想拿几根寻常湿兽筋先试一张纸样。',
    reward: { dyke_jacket_pattern: 1 }, coins: 0, insight: 5,
    outcome: '蒋榛用湿筋在两片废皮上试着收肩。她拆下第三次错扣的皮条，将合适的下针位置画进纸样，又把老鳄的背筋还给你。',
  },
];

export const dykeArmoryContent = { items, gear, recipes, sites, events, enemies, quests };
