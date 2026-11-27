const key = (id, name, desc) => ({ id, name, desc, kind: 'key', price: 0, sell: 0 });

const items = [
  key('zhao_cargo_agreement', '护货的半张船票', '照原城的池秋留了另一半。到碎琉璃滩认搁浅的货船，再沿礁灯找押货的人。票背记着十四枚灵钱的工具押金。'),
  key('zhao_cargo_receipt', '搁浅货船的收货条', '徐篙收下了前两批货。船板上总共刻了三笔，徐篙把最后一批的去向写在收货条背面。'),
  key('zhao_cargo_ledger', '押船人的发货账簿', '礁边油布里取出的一本发货账簿。夹页写着哪一户的米换成了沙袋。池秋在城里等这份簿子，好给各家按原账还货。'),
  key('zhao_sluice_agreement', '修水闸用的布牌', '谷惟给的布牌，绑在手上，连环浅洲的闸工就认识你。牌背写着做下水背带用的松枝和兽革。'),
  key('zhao_sluice_receipt', '浅洲水闸的试水回条', '樊娘试过水闸，在回条上按了指印。背面画着从蛙背塘沿岸到水藻泥湾，再顺石槽去缺轮磨台的路。'),
  key('zhao_sluice_witness', '磨坊的通水回条', '樊娘试过水才签了条。两道闸都通了，把回条交给照原城的谷惟，她就能安排给田里放水。'),
  { id: 'zhao_cargo_brace', name: '缠绳护腕', kind: 'gear', price: 0, sell: 25, keepOnFall: true, oneOfAKind: true,
    desc: '码头押货人用的厚护腕。皮环里缠着船索，用空着的那只手格挡也稳。' },
];

const gear = [
  { id: 'zhao_cargo_brace', slot: 'offhand', tier: 2, def: 1, brace: 4, durability: 36, repair: 10,
    entry: '押货用的厚护腕，须留一只手。船索缠在皮环内，架住对手蓄力后的重击时会卸去一股力。' },
];

const attack = (name, mult = 1) => ({ kind: 'attack', name, mult });
const heavy = (name, mult = 1.45) => ({ kind: 'heavy', name, mult });
const guard = (name, mult = 1.3) => ({ kind: 'guard', name, mult });
const drain = (name, mult = 1) => ({ kind: 'drain', name, mult });

const enemies = [
  { id: 'zhao_cargo_roper', name: '割绳的人', tier: 2, hp: 44, atk: 11, def: 4, tags: ['human'], insight: 3,
    intents: [attack('用绳梢抽向手腕'), heavy('甩出缠石的绳头'), guard('把麻绳在身前绕成一圈')], loot: {} },
  { id: 'zhao_cargo_archer', name: '滩上弩手', tier: 2, hp: 43, atk: 12, def: 3, tags: ['human'], insight: 3,
    intents: [guard('矮身躲在货箱后'), { ...heavy('从箱顶放出短箭', 1.34), ranged: true },
      { ...attack('搭箭向脚边射来'), ranged: true }], loot: {} },
  { id: 'zhao_cargo_shield', name: '礁脚持盾人', tier: 3, hp: 62, atk: 14, def: 6, tags: ['human'], insight: 4,
    intents: [guard('弯腰顶住木盾', 1.36), attack('从盾下出刀'), heavy('用盾沿撞向肩头'), attack('收刀反抹')], loot: {} },
  { id: 'zhao_cargo_hook', name: '礁边提钩人', tier: 3, hp: 58, atk: 16, def: 5, tags: ['human'], insight: 4,
    intents: [attack('从侧面递来铁钩'), heavy('拉直绳索横扫', 1.42), guard('垂钩护住手背')], loot: {} },
  { id: 'zhao_cargo_keeper', name: '押私船的马四', tier: 4, hp: 86, atk: 17, def: 6, tags: ['human'], insight: 7,
    intents: [attack('双手抬刀往下压'), guard('以刀背护身'), heavy('拖刀踏过船板', 1.54),
      attack('回手挑向肘下', 1.08), heavy('用肩顶住船钩劈来', 1.4)], loot: {} },
  { id: 'zhao_sluice_eel', name: '缠住闸柱的青鳗', tier: 2, hp: 46, atk: 11, def: 4, tags: ['beast', 'scaled'], insight: 3,
    intents: [attack('从浅水掠过咬脚'), heavy('绕住木桩用尾猛抽'), attack('贴着石面甩头', 1.05)],
    loot: { beast_meat: 2, qi_core: 1 } },
  { id: 'zhao_sluice_echo', name: '凝在碎板上的水影', tier: 2, hp: 46, atk: 12, def: 4, tags: ['spirit'], insight: 3,
    intents: [drain('从板缝引走真气'), attack('沿板边拍水'), heavy('把碎板夹进浪里扫来', 1.37)], loot: { qi_core: 1 } },
  { id: 'zhao_sluice_wash', name: '水槽里的石鱼', tier: 3, hp: 60, atk: 14, def: 6, tags: ['beast', 'scaled'], insight: 4,
    intents: [guard('背上的石鳞合拢'), drain('咬住槽沿吮气'), heavy('脱离石槽抡尾砸来'), attack('从槽底弹起咬腿')],
    loot: { beast_meat: 2, foundation_core: 1 } },
  { id: 'zhao_sluice_shade', name: '倒挂在水轮下的影子', tier: 3, hp: 65, atk: 15, def: 6, tags: ['spirit'], insight: 4,
    intents: [attack('沿磨槽倒着滚近'), { kind: 'heal', name: '贴在缺口处吸水聚气', mult: 0.35 },
      heavy('从槽里弹起半个磨轮', 1.43), drain('甩出一道冷水')], loot: { foundation_core: 1 } },
  { id: 'zhao_sluice_anchor', name: '堵住水道的石怪', tier: 4, hp: 78, atk: 17, def: 6, tags: ['spirit', 'stoneborn'], insight: 7,
    intents: [drain('从石缝往回抽气', 1.06), guard('贴住河底护住石背', 1.35), heavy('裹着水掀起整片石板', 1.5),
      attack('沿槽边翻身推水', 1.13), heavy('由低处顶起水柱', 1.44)], loot: { foundation_core: 2 } },
];

const sites = [];
const events = [];

function scene(region, id, name, text, choices, config = {}) {
  sites.push({ id, region, name, ...config });
  events.push({ id, name, text, choices });
}

const fixed = (count) => ({ start: count, cap: count });
const fight = (label, desc, enemy, extra = {}) => ({ label, desc, enemy, days: 0.125, ...extra });

scene('zhao_city', 'zhao_public_scales', '码头的公秤房',
  '池秋往秤里倒了一把掺沙的米，谷惟提着泡烂的闸门背带。窗下的小舟等着接跑差的人。池秋说：「两桩事各缺个人。你若肯领一桩，另一桩我让码头的人去办。」', [
    { label: '押十四枚灵钱，接池秋的护货差事', desc: '池秋要你去碎琉璃滩帮徐篙守货。徐篙领用吊货的绳钩，你先押十四枚灵钱。等他收齐这趟货、把绳钩锁回箱里，拿他的收货条回这里领脚钱和押钱。',
      days: 0.125, coins: -14, loot: { zhao_cargo_agreement: 1, ration: 3, salve: 1 }, excludesChoices: [1], hideWhenExcluded: true, stay: true,
      outcome: '池秋数了押钱，从船票上撕下半张给你。「徐篙拿着绳钩，守着晒网上扎红布的那条船。」谷惟把烂背带卷起来，出门找值船的闸工去了。' },
    { label: '给谷惟松木和兽革，接下修闸差事', desc: '谷惟要两份松木搭缝架、一张兽革做下水背带。她备了干粮和丹药，要你跟樊娘查清哪儿堵了水。试完水，拿樊娘签的条子回来找她。',
      days: 0.125, need: { wood: 2, hide: 1 }, consume: true, loot: { zhao_sluice_agreement: 1, ration: 2, heal_pill: 2 }, excludesChoices: [0], hideWhenExcluded: true, stay: true,
      outcome: '谷惟把兽革摊在案上，量出两条长带。她把丹药和布牌交给你。「到连环浅洲认绑旧竹筏的浅水口，樊娘在那里。」池秋把护货的船票交给了等在窗外的脚夫。' },
  ], { once: [0, 1], localQuests: ['zhao_cargo_front_pay', 'zhao_cargo_deep_pay', 'zhao_sluice_front_pay', 'zhao_sluice_deep_pay'],
  afterQuestText: {
    zhao_cargo_front_pay: '池秋在第一张收货条上盖过印，又把押钱一栏划清。她翻到后面一页，第三批货另记在上面。',
    zhao_cargo_deep_pay: '池秋摊着第三批货的发货簿。旧账边夹了张新纸，写的是各家该补回的米。柜下还放着徐篙那趟货的账本。',
    zhao_sluice_front_pay: '谷惟收好了浅洲闸的试水条。窗下有几个拿着铁锹的田户，正等她指哪一条田沟先清。',
    zhao_sluice_deep_pay: '谷惟把磨坊回条压在新写的放水时辰旁，正给排队来认田的人念木牌。浅洲闸另有它的账，放在秤边。',
  }, afterOnceText: {
    0: '池秋将自己的半张船票夹在账本里。「徐篙到了岸上会认你这半张。回来的收货条，拿到这里给我。」',
    1: '谷惟给新缝的背带抹了油，裹起来托人送给樊娘。「她试过前闸就会签条子，你带回来给我看。」',
  } });

scene('glass_bank', 'zhao_cargo_pole', '晒网外的搁浅货船',
  '红布系在高桩上。徐篙站在卸货架下，手里捏着池秋借的绳钩。货船斜靠在架外，短船桅把河风劈成两股。', [
    fight('从桅根截住割缆的人', '桅根阴影里有人拿刀割缆，打着节的粗绳垂到脚边。', 'zhao_cargo_roper'),
    fight('贴着晒架逼近箱后弩手', '外沿的空箱后伸出弩尖。晒架上挂着东西，能遮住走过去的人。', 'zhao_cargo_archer'),
    { label: '用绳钩把剩下的货搬给徐篙', desc: '徐篙守着卸货架。通到搁浅船身的两条木板都得空出来，才抬得动货。',
      guardedBy: ['zhao_cargo_roper', 'zhao_cargo_archer'], days: 0.375, loot: { zhao_cargo_receipt: 1 }, stay: true,
      outcome: '徐篙接了米袋，把绳钩锁回箱里，给你开了收货条。「船板上刻了三笔，这才两批。第三批的麻绳缠着蓝布。想追就往望船排礁找，礁灯下能望见搭板。」' },
  ], { reveal: { item: 'zhao_cargo_agreement' }, once: [2], afterOnceText: {
    2: '徐篙已经将两批米袋抬回卸货架下。绳钩锁在船箱里，他等回城的船来接货。第三批去向写在他的收货条背面。',
  }, creatureText: {
    zhao_cargo_roper: { present: '有鞋底踩上桅根旁的横木，割缆的人还在。', absent: '桅根下落了一把折口的刀，割缆的人已经退走。' },
    zhao_cargo_archer: { present: '外沿空箱后传出弩绳勒槽的响声。', absent: '空箱侧翻，箱后再没有站着的人。' },
  }, creatures: { zhao_cargo_roper: fixed(2), zhao_cargo_archer: fixed(2) } });

scene('beacon_reefs', 'zhao_cargo_blue_reef', '礁灯下的搭板',
  '一缕蓝布贴在湿麻绳上，绳沿着两段搭板垂到礁下。靠岸这一段用空箱立了道矮挡墙，另一段通往贴礁的私船。', [
    fight('沿矮墙侧边逼开持盾的人', '两块盾没能盖住矮墙的侧沿，湿木给掌心留了一道把手。', 'zhao_cargo_shield'),
    fight('从礁背侧踏进去，挡住提钩的人', '搭板尽头的人提起钩袋。矮墙外的礁背还有一处干石能下脚。', 'zhao_cargo_hook'),
    { label: '踩到外段搭板，扯开挂帘', desc: '门帘是用米袋缝的，蓝布绳头从底下传进去。通船的搭板仍有人守着。',
      guardedBy: ['zhao_cargo_shield', 'zhao_cargo_hook'], days: 0.125, stay: true,
      outcome: '搭板晃了两下。帘后有人正把秤砣塞进空米袋，他扣住手边长刀，伙计喊了一声「马四」。发货账簿压在船头油布下面。' },
    fight('登船拦住马四', '马四守在油布前，长刀能越过半条船板。下到礁背的搭板仍在身后。', 'zhao_cargo_keeper',
      { afterChoice: 2, hideAfterFight: 'zhao_cargo_keeper' }),
    { label: '把货搬上接船人的船，带走发货账簿', desc: '蓝布绳扣住第三批米袋。船头油布底下还干着，簿子压在边角。', afterFight: 'zhao_cargo_keeper',
      days: 0.375, stay: true, loot: { zhao_cargo_ledger: 1 },
      outcome: '徐篙的接船人从礁背探过篙，把三根缆接到自己船上。你掀开油布取出发货账簿，他将米袋逐一搬过去，要你把簿子带回照原城给池秋。' },
  ], { afterChoices: ['zhao_cargo_pole:2'], once: [2, 4], afterOnceText: {
    2: '油布后拴着等接的米袋，袋口的蓝布和礁灯下那缕同色。礁旁空着一处足够让接船人撑进来的水面。',
    4: '接船人已经带走第三批货。礁灯下剩一段发白的绳头，湿搭板仍连着岸。',
  }, creatureText: {
    zhao_cargo_shield: { present: '矮墙后还有插到木板缝里的方盾。', absent: '方盾倒在墙外，靠墙走的路空出来了。' },
    zhao_cargo_hook: { present: '有人在搭板尽头拖过铁钩。', absent: '铁钩搭在礁背，干石外再无拖钩的人。' },
  }, creatures: { zhao_cargo_shield: fixed(2), zhao_cargo_hook: fixed(1), zhao_cargo_keeper: fixed(1) } });

scene('ring_isles', 'zhao_sluice_outer_isle', '竹筏下的浅洲闸',
  '旧竹筏只拴在岸上。樊娘倚着木桩扣紧背带，另一手试着扳一根伸出水面的横柄。闸板下面咯了一声，浅水里涌过一泡泥浆。', [
    fight('踩上木桩，截住缠在闸柱上的青鳗', '青影在木桩下绕过，尾巴一抽，横柄就在樊娘手里晃。', 'zhao_sluice_eel'),
    fight('扶住筏头，冲散贴板的水影', '两块坏木板浮在筏边，一团贴着板缝摆动的水始终没流走。', 'zhao_sluice_echo'),
    { label: '按住横柄，让樊娘试着开闸', desc: '樊娘试过新背带。得先把闸板和撑脚的竹筏都空出来，她才能伸手清闸槽。',
      guardedBy: ['zhao_sluice_eel', 'zhao_sluice_echo'], days: 0.375, stay: true, loot: { zhao_sluice_receipt: 1 },
      outcome: '樊娘从槽里摸出一片缺了角的青石，闸板终于能动。「缺轮磨台的石头就是这个色，当心上头也堵了。」她在回条背面画了两笔。「出了浅洲回蛙背塘，贴岸走到水藻泥湾。瞧见砖槽，顺着它就到磨台。我去木梯边等你。」' },
  ], { reveal: { item: 'zhao_sluice_agreement' }, once: [2], afterOnceText: {
    2: '浅洲闸已经能开半扇，来接班的闸工坐在竹筏边等水位降下去。樊娘带着新背带和一把锤子去缺轮磨台了。',
  }, creatureText: {
    zhao_sluice_eel: { present: '木桩脚还冒着青鳗游动带起的小泡。', absent: '木桩脚的水逐渐清了，泥浆沉在下面。' },
    zhao_sluice_echo: { present: '有碎板在无风处敲着筏边。', absent: '旧碎板顺着浅流漂开，筏边静下来。' },
  }, creatures: { zhao_sluice_eel: fixed(2), zhao_sluice_echo: fixed(2) } });

scene('jade_mill', 'zhao_sluice_mill_intake', '石磨后面的引水口',
  '石磨背面露出旧砖槽。槽边有条踩得泛白的浅沿，木梯搭进槽底，梯下的水被一排大石堵住。樊娘在上方的木梯旁等你。', [
    fight('沿石槽边走，迎上水里的大鱼', '大鱼的背鳞和周围石块一个颜色，动了才看得见。', 'zhao_sluice_wash'),
    fight('等水轮转过来，迎上水里的影子', '水轮缺了一角。一片影子沿着砖槽逆水翻滚。', 'zhao_sluice_shade'),
    { label: '扶好木梯，下去查看堵水的石板', desc: '木梯只搭到槽里。梯脚四周的水得安静些才站得住。',
      guardedBy: ['zhao_sluice_wash', 'zhao_sluice_shade'], days: 0.125, stay: true,
      outcome: '一片大石从梯下拱起来，几道裂缝合拢，截住流往槽底的水。樊娘抓牢梯顶。「这块自己能动。空出石缝之后，还要一块寒铁卡住它挤歪的支脚。」' },
    fight('站上梯下的槽沿，把活石从水口引开', '石上的裂缝一开一合，水向里倒流。木梯能原样爬上去。', 'zhao_sluice_anchor',
      { afterChoice: 2, hideAfterFight: 'zhao_sluice_anchor' }),
    { label: '用寒铁把偏掉的支脚卡回槽里', desc: '活石退到梯外，歪掉的支脚还没受力。樊娘把小锤从木梯上递下来。', afterFight: 'zhao_sluice_anchor',
      days: 0.375, need: { ore: 1 }, consume: true, stay: true, loot: { zhao_sluice_witness: 1 },
      outcome: '你塞进寒铁，樊娘用锤背敲了三次，支脚和槽口终于贴齐。她下梯摸了摸穿过石缝的水，湿手指在通水回条上按印，请你回照原找谷惟结账。' },
  ], { afterChoices: ['zhao_sluice_outer_isle:2'], once: [2, 4], afterOnceText: {
    2: '樊娘扶住木梯，梯脚搭到槽沿。歪掉的支脚还露着半截，槽里积起的水越过了最低一层砖沿。',
    4: '木梯横放在干地上，修好的支脚稳稳卡着砖槽，水从底下流去浅洲。樊娘提着锤子往下游验水去了。',
  }, creatureText: {
    zhao_sluice_wash: { present: '泛白的石沿下，有条黑鳞大鱼在慢慢游动。', absent: '泛白的石沿旁只剩水草在摆，已经看不见那条大鱼。' },
    zhao_sluice_shade: { present: '砖槽对岸还响着磨轮擦石的声音。', absent: '砖槽里不再有倒着滚动的声音。' },
  }, creatures: { zhao_sluice_wash: fixed(2), zhao_sluice_shade: fixed(1), zhao_sluice_anchor: fixed(1) } });

const quests = [
  { id: 'zhao_cargo_front_pay', region: 'zhao_city', name: '给池秋交搁浅货船的收货条', reveal: { item: 'zhao_cargo_receipt' },
    desc: '徐篙收了前两批米，绳钩也锁回船箱。池秋凭他签的收货条付这段脚钱，退回工具押金。第三批另账，愿意追再去望船排礁。',
    need: { zhao_cargo_receipt: 1 }, reward: { ration: 2 }, coins: 43, insight: 3,
    outcome: '池秋照徐篙签的条子核完货，先退了十四枚押钱，再付你二十九枚脚钱。她把货名抄给岸上的脚夫。「这两批有了准信，先让出这条卸货道。」' },
  { id: 'zhao_cargo_deep_pay', region: 'zhao_city', name: '把礁下的发货账簿交给池秋', reveal: { item: 'zhao_cargo_ledger' },
    desc: '第三批货已由接船人押回。池秋要拿发货账簿辨认各家袋里的实货，照原账赔回缺掉的东西。',
    need: { zhao_cargo_ledger: 1 }, reward: { zhao_cargo_brace: 1, salve: 2 }, coins: 68, insight: 6,
    outcome: '池秋摊开簿子，找出货被换成沙袋的几户，叫人拿仓里的米给他们补上。她结了尾钱，把押货人用的护腕递给你。「搭板上能空出一只手，用这个接重招。」' },
  { id: 'zhao_sluice_front_pay', region: 'zhao_city', name: '给谷惟看浅洲水闸的试水回条', reveal: { item: 'zhao_sluice_receipt' },
    desc: '谷惟等浅洲闸试通的消息。把樊娘的条子给她，前闸先结。想帮樊娘清源头，从缺轮磨台的背水面去。',
    need: { zhao_sluice_receipt: 1 }, reward: { heal_pill: 1, ration: 2 }, coins: 34, insight: 3,
    outcome: '谷惟验过樊娘按的印，招呼两个等灌水的田户先去整理分水沟。她付了前闸的脚钱，顺手把歇脚的吃食和一颗丹药包了给你。' },
  { id: 'zhao_sluice_deep_pay', region: 'zhao_city', name: '给谷惟交磨坊的通水回条', reveal: { item: 'zhao_sluice_witness' },
    desc: '引水口重新通了，樊娘把水流的准信交给你。谷惟等这张回条给田户排下一轮放水。',
    need: { zhao_sluice_witness: 1 }, reward: { leaf_pill: 2 }, coins: 58, insight: 6,
    outcome: '谷惟把闸口新定的水时写在木牌上，喊田户依次来摁印。末了，她把工钱结给你，回身将牌子挂在闸房外。' },
];

export const employersContent = { items, gear, sites, events, enemies, quests };
