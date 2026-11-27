const shed = 'zhao_loan_grain_shed';
const papers = 'zhao_loan_grain_papers';
const counter = 'zhao_loan_grain_counter';
const sackTag = 'zhao_grain_family_tag';
const handover = 'zhao_grain_handover_note';
const receipt = 'zhao_grain_duplicate_receipt';
const manual = 'zhao_grain_shoulder_manual';

const key = (id, name, desc) => ({ id, name, desc, kind: 'key', price: 0, sell: 0, keepOnFall: true });

const items = [
  key(sackTag, '三家粮袋的木签拓样', '三张薄纸拓下了杜、黄、顾家的袋签。右下都刻着同一个货号。取样时只翻动木签，没拆袋上的青线。'),
  key(handover, '柳荷的粮袋字据', '柳荷照袋签逐一写下粮重，并承认是自己把侧门钥匙交给了苏苇。她只认这三袋。'),
  key(receipt, '同号的两张粮单', '两张单子背面是同一个货号，指的都是这三袋粮。一张写的是三家寄存，另一张却写成了石茂自己要卖的粮。'),
  { id: manual, name: '过堤换肩法', kind: 'manual', price: 0, sell: 0, keepOnFall: true, oneOfAKind: true,
    desc: '苏苇给挑粮人画的几张图。扁担压在一侧时，脚下先挪半步，再慢慢换肩。' },
];

const sites = [
  { id: shed, region: 'crane_granary', name: '斜柳晒席', afterBandit: true, once: [0, 1],
    afterOnceText: {
      0: '三枚木签仍穿在原来的封绳上。柳荷蹲在一边，把小秤的秤砣擦干。',
      1: '晒席已经卷起，粮袋都送去何绢管的后廊。树下还摆着一只旧秤筐。',
    } },
  { id: papers, region: 'glass_bank', name: '晒网旁的旧账单', afterChoices: [`${shed}:1`], once: [0],
    afterOnceText: { 0: '章老把空油纸袋晾到网上。压纸的石板翻了个面，底下晒出一方干地。' } },
  { id: counter, region: 'crane_granary', name: '后廊的粮秤', afterChoices: [`${shed}:1`], once: [0, 1, 2, 3],
    afterOnceText: {
      0: '何绢把三袋粮隔开平码在秤旁。侧门通往领粮的小埂，正门外钉着一块给各家对账的木板。',
      1: '粮袋已经从侧门分出去了。秤下摊着一张空席，门边还有人来借秤掂东西。',
      2: '正门贴着刚换的寄粮单，石茂的旧印挂在木板下。来领粮的人按自家的木签过秤。',
      3: '苏苇已经背着空扁担回去了。后埂上留下两行走得不紧不慢的脚印。',
    } },
];

const events = [
  { id: shed, name: '斜柳晒席', text: '白布缠在斜出的柳枝上。柳荷提着秤，拿脚抵住歪倒的粮袋。「苏苇，扶一把。」苏苇把裂扁担搁到树根，扶正粮袋，才认出你来。',
    choices: [
      { label: '请苏苇翻给你看粮袋上的木签', days: 0.125, stay: true, loot: { [sackTag]: 1 },
        desc: '木签系在封口外。苏苇掀开蒲席，露出三袋粮。',
        outcome: '你翻到最后一块木签，苏苇才松开按住粮袋的手。「杜、黄、顾三家，各一袋。石茂自己卖的粮用麻绳，青线是人家留来下种的。」他借你一片炭，等你照三枚木签拓好，又亲手把每一枚转回原处。' },
      { label: '请提秤的柳荷说说侧门那一晚', afterChoice: 0, days: 0.125, stay: true, loot: { [handover]: 1 },
        desc: '柳荷把小秤挂回腰上，秤盘里留着三张草记。',
        outcome: '柳荷把三张草记和袋签拓样排到一处，认出货号才肯用笔。「是我开的侧门。三袋都从我手上过秤。」她写完斤两按了手印，又道，「石茂的单我还不敢认。河船上留过一张底单，问碎琉璃滩晒网的章老。」' },
    ] },
  { id: papers, name: '晒网旁的旧账单', text: '晒网的影子在石面上摇。章老在补最后一个破网眼，听见粮仓两个字才指了指压在脚边的油纸包。',
    choices: [
      { label: '请章老对一对背面的记号', days: 0.125, stay: true, loot: { [receipt]: 1 },
        desc: '章老替三家运过种粮，留着入仓时那张旧单。这几天石茂又托他运同一批粮，给的是卖单。',
        outcome: '章老把两张纸从油纸包里取出来，翻到背面。「两个二十七。货号是我写的，只用在那三袋上。」旧单写着三家寄存，新单只盖了石茂的印。「拿去。何绢要细问，叫人来喊我。」' },
    ] },
  { id: counter, name: '后廊的粮秤', text: '何绢把手伸到秤梁下，等柳荷放稳第一袋。秤旁有扇窄门，迈出去就是粮仓后的小埂。',
    choices: [
      { label: '把木签拓样和柳荷的字据递给何绢', days: 0.125, stay: true, need: { [sackTag]: 1, [handover]: 1 },
        outcome: '何绢对过重量，拿笔把三家名字写在空纸上。「照原样领种粮，可以走后边。要从账上撤掉石茂的卖单，就得把他盖印的那张和原单摆在一块。柳荷，你肯不肯到门前说？」柳荷点头，仍用手按着裙边。' },
      { label: '从侧门把粮按木签还给三家', afterChoice: 0, excludesChoices: [2], hideWhenExcluded: true,
        days: 0.375, stay: true, loot: { [manual]: 1 },
        desc: '从小埂搬回家只要走两趟。让主人来认原封，柳荷就能把字据留在仓里。',
        outcome: '三家依木签领了原袋春种。何绢在内账结清了寄存，石茂的卖单还挂着，仓里已经没有他能交给买家的粮。柳荷从侧门归家。苏苇帮最后一家把粮抬过小埂，回来把压在扁担下的《过堤换肩法》交给你。' },
      { label: '请何绢当众核对两张单子', afterChoice: 0, excludesChoices: [1], hideWhenExcluded: true,
        hidden: true, need: { [receipt]: 1 }, days: 0.5, stay: true, coins: 14, loot: { ration: 2, salve: 1 },
        desc: '章老愿意指认留底的账单，柳荷也认自己的字据。到正门对账，来领粮的人都会知道是谁开了侧门。',
        outcome: '何绢请渡船带来章老。他一对货号，买家便揭了石茂的卖单，拿着收据向石茂讨订钱。柳荷原先只肯念斤两，等杜家拿来留存的账根，她也当众认了侧门的事。三家按新过的秤领回种粮。何绢划去卖单，留了跑腿钱、干粮和一罐药给你。' },
      { label: '送苏苇走过后埂', afterChoice: 2, days: 0.25, stay: true, loot: { [manual]: 1 },
        desc: '围着账板的人还没散。苏苇提着那根裂扁担，在后门等你。',
        outcome: '到了埂上，苏苇把扁担横过来，拿给你看肩头磨亮的那一段。「这几步是我自己琢磨出来的。下回你挑东西过窄处，用得上。」他从旧布里抽出几张纸，纸上画着落脚和换肩的法子。' },
    ] },
];

const fixed = [{
  id: 'road_borrowed_grain', a: 'crane_granary', b: 'glass_bank',
  name: '扶粮车的人', chance: 0.12, allowFight: false,
  intro: '枯芦刮着一辆窄车的轮辐。一个人蹲在车边给裂扁担缠麻线，脚边搁着一枚拴过青线的木签。车已经靠到一边。',
  passOutcome: '那人把伸到路上的扁担收回膝上，你贴着车边走了过去。',
  actions: [{ id: 'hear_grain_oath', label: '捡起木签，问这车送的是什么',
    desc: '木签背面刻了个「杜」字。那人伸手接时，先望了一眼芦根后的小路。', revealSite: shed,
    outcome: '他把木签接过去，拂掉青线上的沙，才道：「你若要去粮仓，替我看看正门上还挂不挂石茂的卖单。」他扯紧扁担头的麻线。「你去过了，自管来问我。我们在粮仓后头，见白布缠的歪柳便拐。」' }],
}];

const innerStyles = [{ id: manual, name: '过堤换肩法', grade: '凡品', tier: 1, specialty: ['staff'],
  desc: '苏苇挑粮过窄埂时练出的步子。肩上的力送到脚掌，脚下一稳，再把扁担挪过去。',
  ranks: [
    { base: { def: 1 }, focus: { guard: 1 }, effect: '站得更稳，挨打会轻些。持棍杖出手时，也能顺势卸开来力。' },
    { tier: 2, cost: 18, days: 1, need: { wood: 3, hide: 2 }, base: { def: 1, retreat: 0.04 },
      focus: { guard: 2 }, effect: '脚下更稳，能趁对手收招闪到一旁。用棍杖时，也更容易拨开迎面的兵刃。' },
  ],
}];

export const banditTaleContent = { items, sites, events, innerStyles, fixed };
