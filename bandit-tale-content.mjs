const shed = 'zhao_loan_grain_shed';
const papers = 'zhao_loan_grain_papers';
const counter = 'zhao_loan_grain_counter';
const sackTag = 'zhao_grain_family_tag';
const handover = 'zhao_grain_handover_note';
const receipt = 'zhao_grain_duplicate_receipt';
const manual = 'zhao_grain_shoulder_manual';

const key = (id, name, desc) => ({ id, name, desc, kind: 'key', price: 0, sell: 0, keepOnFall: true });

const items = [
  key(sackTag, '旧粮袋签', '木签上刻着三家寄粮人的姓氏。仓里替人保管的种粮袋都用青线封口，这三枚签就系在封口外。'),
  key(handover, '柳荷的粮袋字据', '柳荷照袋签逐一写下粮重，并承认是自己把侧门钥匙交给了苏苇。她只认这三袋。'),
  key(receipt, '同号的两张粮单', '两张单子背面是同一个货号，指的都是这三袋粮。一张写的是三家寄存，另一张却写成了石茂自己要卖的粮。'),
  { id: manual, name: '过堤换肩法', kind: 'manual', price: 0, sell: 0, keepOnFall: true, oneOfAKind: true,
    desc: '苏苇给挑粮人画的几张图。扁担压在一侧时，脚下先挪半步，再慢慢换肩。' },
];

const sites = [
  { id: shed, region: 'crane_granary', name: '斜柳晒席', afterBandit: true, once: [0, 1],
    afterOnceText: {
      0: '苏苇把木签放回席上。袋口还封着，柳荷蹲在一边把小秤的秤砣擦干。',
      1: '晒席已经卷起。柳荷把粮袋送去何绢管的后廊，只把坏扁担留在树下。',
    } },
  { id: papers, region: 'glass_bank', name: '晒网旁的旧账单', afterChoices: [`${shed}:1`], once: [0],
    afterOnceText: { 0: '章老把空油纸袋晾到网上。压纸的石板翻了个面，底下晒出一方干地。' } },
  { id: counter, region: 'crane_granary', name: '后廊的粮秤', afterChoices: [`${shed}:1`], once: [0, 1, 2],
    afterOnceText: {
      0: '何绢把三袋粮隔开平码在秤旁。侧门通往领粮的小埂，正门外钉着一块给各家对账的木板。',
      1: '粮袋已经从侧门分出去了。秤下摊着一张空席，门边还有人来借秤掂东西。',
      2: '正门贴着刚换的寄粮单，石茂的旧印挂在木板下。来领粮的人按自家的木签过秤。',
    } },
];

const events = [
  { id: shed, name: '斜柳晒席', text: '歪柳枝上缠着白布。蒲席底下鼓起三块，粮袋都靠在干地上。苏苇膝头横着根裂开的扁担，树影里站着提秤的柳荷。',
    choices: [
      { label: '请苏苇翻给你看粮袋上的木签', days: 0.125, stay: true, loot: { [sackTag]: 1 },
        desc: '木签系在封口外。苏苇掀开蒲席，露出三袋粮。',
        outcome: '「仓里替各家存的种粮都用青线封口，自家要卖的用麻绳。你看，杜、黄、顾三家。石茂拿张新单子便说粮是他的。我挪出来时答应过不拆袋，也不取一把。」苏苇解下三枚木签，托你带给管仓的何绢。' },
      { label: '请提秤的柳荷说说侧门那一晚', afterChoice: 0, days: 0.125, stay: true, loot: { [handover]: 1 },
        desc: '柳荷把小秤挂回腰上。她刚才替苏苇背出了最后一袋，知道每袋有多重。',
        outcome: '「是我开的侧门。上秤时我就在旁边，单上是谁改的我也见了。」柳荷在字据上按了指印。「粮带给何绢。章老管过运粮的船，手上还留着旧单。去碎琉璃滩，找他晒网旁那块压纸的石头。」她提起扁担，把粮往粮仓后廊送。' },
    ] },
  { id: papers, name: '晒网旁的旧账单', text: '晒网的影子在石面上摇。章老挪开压纸的石头，从油纸包里抽出一张旧单。',
    choices: [
      { label: '请章老对一对背面的记号', days: 0.125, stay: true, loot: { [receipt]: 1 },
        desc: '油纸里夹着一张寄存单。一张卖粮单也挂到了送货的网绳上。',
        outcome: '章老把两张纸翻过来。「看，都写着二十七，这号只给过那三袋粮。」旧单写着三家寄存，新单只剩石茂的印。他解下新单。「你两张都带去。有人问，我也能去认。」' },
    ] },
  { id: counter, name: '后廊的粮秤', text: '何绢把手伸到秤梁下，等柳荷放稳第一袋。秤旁有扇窄门，迈出去就是粮仓后的小埂。',
    choices: [
      { label: '把木签和柳荷的字据递给何绢', days: 0.125, stay: true, need: { [sackTag]: 1, [handover]: 1 },
        outcome: '何绢对过重量，拿笔把三家名字写在空纸上。「照原样领种粮，可以走后边。要从账上撤掉石茂的卖单，就得把他盖印的那张和原单摆在一块。柳荷，你肯不肯到门前说？」柳荷点头，仍用手按着裙边。' },
      { label: '从侧门把粮按木签还给三家', afterChoice: 0, excludesChoices: [2], hideWhenExcluded: true,
        days: 0.375, stay: true, loot: { [manual]: 1 },
        desc: '从小埂搬回家只要走两趟。让主人来认原封，柳荷就能把字据留在仓里。',
        outcome: '三家依木签领了原袋春种。何绢在内账结清了寄存，石茂的卖单还挂着，仓里已经没有他能交给买家的粮。柳荷从侧门归家。苏苇帮最后一家把粮抬过小埂，回来把压在扁担下的《过堤换肩法》交给你。' },
      { label: '请何绢当众核对两张单子', afterChoice: 0, excludesChoices: [1], hideWhenExcluded: true,
        hidden: true, need: { [receipt]: 1 }, days: 0.5, stay: true, coins: 14, loot: { ration: 2, salve: 1 },
        desc: '章老肯来指认留底，柳荷也愿认字据。贴出旧单后，来领粮的人都能看见两人的名字。',
        outcome: '何绢叫三家站到秤前，两张单挨着钉在木板上。章老念出背面的记号，柳荷说出那晚开门的来由。石茂撕了自己的卖粮纸，把买家给的订钱一一退回。三家认了木签，各自把粮领走。何绢给你跑腿钱和两包干粮，章老又塞来一罐擦肩的药。' },
    ] },
];

const fixed = [{
  id: 'road_borrowed_grain', a: 'crane_granary', b: 'glass_bank',
  name: '扶粮车的人', chance: 0.66, allowFight: false,
  intro: '枯芦刮着一辆窄车的轮辐。一个人蹲在车边给裂扁担缠麻线，脚边搁着一枚拴过青线的木签。车已经靠到一边。',
  passOutcome: '那人把伸到路上的扁担收回膝上，你贴着车边走了过去。',
  actions: [{ id: 'hear_grain_oath', label: '捡起木签，问这车送的是什么',
    desc: '木签背面刻了个「杜」字。那人伸手接时，先望了一眼芦根后的小路。', revealSite: shed,
    outcome: '「我叫苏苇。早几年在米铺偷过粮，那回是往我自己袋里装。这回三家的春种都还封着，哪家的都能认。」他把木签塞回怀里。「往粮仓后面走，见缠白布的歪柳就拐。蒲席下面便是粮，柳荷还在那儿等我。」' }],
}];

const innerStyles = [{ id: manual, name: '过堤换肩法', grade: '凡品', tier: 1, specialty: ['staff'],
  desc: '苏苇挑粮过窄埂时练出的步子。肩上的力送到脚掌，脚下一稳，再把扁担挪过去。',
  ranks: [
    { base: { def: 1 }, focus: { guard: 1 }, effect: '站得更稳，挨打会轻些。持棍杖出手时，也能顺势卸开来力。' },
    { tier: 2, cost: 18, days: 1, need: { wood: 3, hide: 2 }, base: { def: 1, retreat: 0.04 },
      focus: { guard: 2 }, effect: '脚下更稳，能趁对手收手挪开。用棍杖拨开来招也更容易。' },
  ],
}];

export const banditTaleContent = { items, sites, events, innerStyles, fixed };
