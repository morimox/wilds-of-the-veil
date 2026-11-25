const items = [
  { id: 'border_warehouse_ledger', name: '劫货人的分账簿', kind: 'key', price: 0, sell: 0,
    desc: '一本夹着驿站封绳的薄簿。几笔盐包和粮袋的去向还圈在纸上。鸣沙城的宋禾正在清点这些货。' },
  { id: 'border_watch_charm', name: '挡沙铜腕扣', kind: 'gear', price: 0, sell: 39, keepOnFall: true, oneOfAKind: true,
    desc: '驿差绑在腕上的厚铜扣。抬臂能垫住重招，内侧镶着一小块摸起来温热的铜。' },
];

const gear = [
  { id: 'border_watch_charm', slot: 'charm', tier: 3, atk: 0, def: 1, hp: 2, qi: 1, retreat: 0.12,
    durability: 45, repair: 12, trait: { kind: 'guard', intent: 'heavy', bonus: 2 },
    field: { fogTolerance: 1 },
    entry: '鸣沙驿差压住宽袖用的铜扣，筑基后才能稳稳运气。抬臂挡重招或抽身后退时能少挨些打。遇雾时铜扣发热，雾压升得慢一些。' },
];

const patrols = [
  {
    id: 'border_hoof_patrol', region: 'chalk_hoof_trail', name: '断蹄石', enemy: 'border_ridge_runner', interval: 7,
    text: '道边的白蹄石断了一半。班婆赶着换驮绳，把城里盖过印的雇单塞进石缝，跟她出来的骡子拴在背风处。',
    present: '白石对面有人拿刀敲马鞭，往骡子腿上瞧。', absent: '前面的岔路安静下来，班婆牵骡试着走了两步。',
    challenge: '绕过白石，迎上持刀的人', challengeText: '那人站得偏，提刀就往你牵绳那只手上削。',
    pay: '找班婆领看路的钱', coins: 16, loot: { ration: 2 },
    outcome: '班婆沿白石看了一圈，才解下装工钱的小布袋。她给你分了两包骡队的粮饼。那人腰上缠的红麻绳是架风板才有的，她见过拿红绳引路的人从石板底钻出去。',
  },
  {
    id: 'border_cart_patrol', region: 'silk_tent_road', name: '窄口修车摊', enemy: 'border_axle_poleman', interval: 8,
    text: '骡车的轮子架在木墩上。车匠闻陇伸手一摸，轮轴上齐齐少了一截。给他看摊的两个人都留在布棚里。',
    present: '窄口外有个拄枪的，把几截卸下来的铁箍拎在手上。', absent: '窄口腾开了，闻陇喊人过来放车轮。',
    challenge: '走到窄口，叫拄枪的人放下铁箍', challengeText: '那人把铁箍往墙根一扔，扎低了脚步。',
    pay: '找闻陇结护车钱', coins: 20, loot: { ore: 1, wood: 2 },
    outcome: '闻陇试过车轮，从车主留的荷包里数出工钱，又从架下抽出补轮剩的铁片和松木。刚才对面那人抛出去招同伴的红绳，往常挂在架风板脚下。',
  },
  {
    id: 'border_salt_patrol', region: 'salt_ledger_barrows', name: '斜放的盐车', enemy: 'border_ledger_cutter', interval: 10,
    text: '车辕斜顶在路沿，戚盈抱着盐袋验封口。担盐人把空筐摆在车旁，手里的秤一直没放下来。',
    present: '一颗秤砣滚进门洞。有人堵在洞口，把刀根抵在下一袋盐上。', absent: '门洞前空了，戚盈把秤砣捡回车底，刚才挤在坡下的两辆车也敢过了。',
    challenge: '从盐车边过去，夺回门洞', challengeText: '堵门的人松开盐袋，把刀沿石门往上一带。',
    pay: '找戚盈领过岗的工钱', coins: 24, loot: { salve: 1 },
    outcome: '戚盈收好盐袋，从过岗的人凑下的钱里给你数了一份，又把装药的小盒推过来。门洞里那人先前朝架风板的人招手，手里攥着一截红麻绳。',
  },
];

function localEnemy(id, name, tier, hp, atk, def, insight, desc, intents) {
  return { id, name, tags: ['human'], tier, hp, atk, def, insight, desc,
    intents: intents.map(([name, kind, mult = 1, ranged]) => ({ name, kind, mult, ...(ranged ? { ranged: true } : {}) })),
  };
}

const enemies = [
  localEnemy('border_ridge_runner', '断蹄石拦路人', 2, 63, 13, 5, 5, '他专找牵绳那侧出刀。收刀偏过身子时，有工夫换气。',
    [['挑刀削手', 'attack'], ['转肩护肋', 'guard', 1.42], ['抢前一步横斩', 'heavy', 1.55], ['回身拖刀', 'attack']]),
  localEnemy('border_axle_poleman', '拦车的枪手', 2, 73, 15, 5, 6, '窄路挡住了枪尾。他会先攒够力，挑向你站着的那一边。',
    [['低枪急挑', 'heavy', 1.58], ['递枪探步', 'attack'], ['收枪架肘', 'guard', 1.43], ['撑墙回枪', 'attack']]),
  localEnemy('border_ledger_cutter', '门洞劫盐人', 3, 82, 16, 6, 7, '刀上的盐渍一靠近，身上的真气就往外走。他贴在门沿时，可先架住刀。',
    [['贴门探刀', 'attack'], ['反手蹭过护腕', 'drain', 0.9], ['缩回门后', 'guard', 1.48], ['踏过盐袋砍来', 'heavy', 1.6]]),
  localEnemy('border_wind_ambusher', '风板下的弩手', 3, 76, 16, 6, 7, '他先放短箭再拽弦。上箭时须把弩头压低，肩颈会露出来。',
    [['隔着石板抬弩', 'heavy', 1.53, true], ['抽匕顶来', 'attack'], ['侧身上箭', 'guard', 1.36],
      ['踏石放箭', 'heavy', 1.65, true], ['拨开近身的兵刃', 'attack']]),
  localEnemy('border_rope_warden', '守绳的斧手', 3, 86, 17, 7, 8, '脚边的绳子通向坡下。他把斧柄夹在肘下时，会趁机调息再举斧。',
    [['斧背压臂', 'attack'], ['蹲下守桩', 'guard', 1.43], ['抱柄调息', 'heal', 0.63], ['拔斧砸肩', 'heavy', 1.68], ['提柄封路', 'attack']]),
  localEnemy('border_kiln_shield', '卸货窑的铁盾手', 4, 94, 17, 9, 9, '窑门只容一人宽，他能用盾盖住大半。盾沿撞过来以后，肩会露在门外。',
    [['把盾压进门框', 'guard', 1.65], ['贴着盾送短刃', 'attack'], ['双手推盾冲出', 'heavy', 1.56], ['退一步把盾架住', 'guard', 1.58], ['交叉踏步递刃', 'attack']]),
  localEnemy('border_kiln_brazier', '挑炭的账房伙计', 4, 90, 19, 7, 9, '炭火里夹着能黏住真气的细灰。火旺时先护住口鼻，他添炭以后会停一下。',
    [['扬灰遮眼', 'drain', 1.02], ['旋过火钳打手', 'attack'], ['添炭拨灰', 'heal', 0.55], ['连火盆掼来', 'heavy', 1.55], ['以钳格挡', 'guard', 1.39]]),
  localEnemy('border_silo_chain', '门边持铁链的人', 4, 98, 18, 8, 9, '他把铁链绕过门边的凹槽。脚下的铁链刚绷直，他就抡起来扫人。',
    [['抽紧腿边铁链', 'heavy', 1.71], ['按住铁链拦路', 'guard', 1.48], ['裂地扫脚', 'attack', 1.12], ['绕柱甩链', 'heavy', 1.59], ['踢链碰踝', 'attack']]),
  localEnemy('border_silo_roof', '守小窗的人', 4, 91, 19, 7, 9, '他身上的灰布会把真气往窗口引。每次回身扶墙时，脚步总要顿一下。',
    [['贴窗引气', 'drain', 1.05], ['腾身斜砍', 'attack', 1.14], ['一手摸墙站稳', 'guard', 1.43], ['借窗沿翻身下劈', 'heavy', 1.6], ['回身再抽真气', 'drain', 0.86]]),
  localEnemy('border_silo_leader', '劫货头领阮隼', 5, 122, 22, 9, 13, '他扣下商队的货后，便轮着守粮仓的两扇门。见他收刀退步，多半是在调息。他双手推刀时，得避开正面。',
    [['刀尖点过麻绳', 'attack'], ['右手推刀', 'heavy', 1.62], ['横刀近身', 'guard', 1.54], ['按刃回气', 'heal', 0.67], ['左手扣住刀背猛推', 'heavy', 1.72], ['折刀牵气', 'drain', 0.87]]),
];

const sites = [
  { id: 'border_watch_desk', region: 'mingsha_city', name: '城门内的驿货簿', once: [0],
    afterOnceText: { 0: '宋禾把找货的雇单分给三处，给晚归的骡队留了半张桌子。' } },
  ...patrols.map(({ id, region, name, enemy, interval, present, absent }) => ({
    id, region, name, afterChoices: ['border_watch_desk:0'],
    creatures: { [enemy]: { start: 1, cap: 1, interval, growth: 1, fixedPopulation: true } },
    creatureText: { [enemy]: { present, absent } },
  })),
  { id: 'border_wind_track', region: 'wind_slate', name: '系着红绳的石板边', once: [2, 3],
    afterChoices: patrols.map(({ id }) => `${id}:1`),
    creatures: { border_wind_ambusher: { start: 1, cap: 1 }, border_rope_warden: { start: 1, cap: 1 } },
    creatureText: {
      border_wind_ambusher: { present: '板脚有光一闪，弩头从一道低缝伸出来了。', absent: '断了弦的短弩扔在石板脚下，石阶露出第一段。' },
    },
    afterWinText: {
      border_rope_warden: '斧手松了手，红绳却还绷在桩上。绳下绑着一只盖城印的木匣。',
      border_wind_ambusher: '越过石阶是半截高坡。桩上那根红绳一直伸到坡下，有人拎着斧子靠住绳桩。',
    },
    afterOnceText: { 3: '压绳的桩被放倒了，冷炉院旧窑的卸货口正对着坡下的绳头。' },
  },
  { id: 'border_kiln_depot', region: 'cold_kiln', name: '坡下的卸货窑', once: [1, 3],
    afterChoices: ['border_wind_track:3'],
    creatures: { border_kiln_shield: { start: 1, cap: 1 }, border_kiln_brazier: { start: 1, cap: 1 } },
    creatureText: {
      border_kiln_shield: { present: '窑门的人把一面铁盾挪进了门框，盾后还夹着一把短刃。', absent: '铁盾斜靠在墙上。窑口有座小灶，灶边的人正抱着水瓮躲风。' },
    },
    afterOnceText: {
      1: '灶边的窦芸往里指了指。火盆就在里头，石面留着两行往里面滚的车轮印。',
      3: '窦芸把退回的药留在门边。火盆已冷，车轮印绕过落琉洼外沿，往空粮仓去了。',
    },
  },
  { id: 'border_silo_den', region: 'hollow_silo', name: '粮仓下的侧门', once: [0, 3, 5],
    afterChoices: ['border_kiln_depot:3'],
    creatures: {
      border_silo_chain: { start: 1, cap: 1 }, border_silo_roof: { start: 1, cap: 1 }, border_silo_leader: { start: 1, cap: 1 },
    },
    creatureText: {
      border_silo_chain: { present: '地面那道窄槽喀啦响了一下，一截铁链擦着石沿过去。', absent: '铁链从里门的门槽滑了下来。' },
      border_silo_roof: { present: '递粮的小窗内露出一只靴子，有人跨窗盯着仓门。', absent: '递粮的小窗内只剩半扇歪窗，没人再从上面探身。' },
    },
    afterWinText: { border_silo_leader: '阮隼松了手，刀落在粮堆边。窦芸带着两名驿差从侧窗进来，绕到货架上掀开油布。' },
    afterOnceText: { 5: '失货挪到了卷帘下，窦芸在等城里来套车。阮隼的分账簿已经交给你。' },
  },
];

const events = [
  { id: 'border_watch_desk', name: '城门内的驿货簿',
    text: '炉灰还挂在空车底。宋禾拿煤条算了两遍缺了几包盐，才抬眼望向城门外等话的人。',
    choices: [
      { label: '问宋禾缺的是哪几车货', days: 0.125, insight: 2,
        outcome: '「白蹄旧道有人拦驮队，断帐旧道有人拆铁箍，担盐岗连封袋都有人抢。」宋禾用煤条圈了三个地方。「各处都留了雇人钱，到了找班婆、闻陇和戚盈。挑一个顺路的先去。」' },
    ],
  },
  ...patrols.map(({ id, name, enemy, text, challenge, challengeText, pay, coins, loot, outcome }) => ({
    id, name, text,
    choices: [
      { label: challenge, desc: challengeText, days: 0.125, enemy },
      { label: pay, days: 0.125, afterFight: enemy, perWin: true, coins, loot, outcome, stay: true },
    ],
  })),
  { id: 'border_wind_track', name: '系着红绳的石板边',
    text: '废石板的背面扎着一段红麻绳。日头斜照进来，石板后的石阶一直落到看不见的地方。',
    choices: [
      { label: '贴着石板绕向弩手身侧', days: 0.125, enemy: 'border_wind_ambusher',
        outcome: '石角碎了一片，弩箭插在你刚才站的地方。' },
      { label: '上坡迎住拎斧的人', afterFight: 'border_wind_ambusher', days: 0.125, enemy: 'border_rope_warden',
        outcome: '斧手用脚把红绳踩进砂里，提斧抢上来。' },
      { label: '到石头背后的避风处喝口水', afterFight: 'border_wind_ambusher', days: 0.25, hp: 10, qi: 8, stay: true,
        desc: '石凹里有个盖紧的公用水瓮。坡上的人看不见这侧。', outcome: '你把皮帘放下，在背风处喝水歇了一会。' },
      { label: '放倒拴绳的木桩，去坡下看看在哪卸货', afterFight: 'border_rope_warden', days: 0.25, insight: 4, coins: 26, stay: true,
        desc: '桩边拴着一只盖城印的工钱匣，红绳伸向冷炉院。', outcome: '绳上夹着运货人绑的木签。冷炉院的窦芸顺绳回来，从工钱匣给你付了一段路的工钱，指着废窑让你去认门。' },
    ],
  },
  { id: 'border_kiln_depot', name: '坡下的卸货窑',
    text: '红绳从石板坡拉到了旧窑后门。磨亮的两道铁轨直对窑口，半卸下来的车停在旁边。',
    choices: [
      { label: '从车侧挤过去，迎上窑门的铁盾', days: 0.125, enemy: 'border_kiln_shield',
        outcome: '铁盾擦掉了门框半截砖角，那人把鞋跟卡在门坎里。' },
      { label: '在窦芸的小灶边歇一会', afterFight: 'border_kiln_shield', days: 0.25, hp: 15, qi: 12, stay: true,
        loot: { ration: 2 }, outcome: '窦芸帮你取水，让出灶边，又从自家口粮里匀了两包。你坐下缓了一会，才听清窑里刮灰的声音。' },
      { label: '绕过车轨，拦住往火盆添炭的人', afterFight: 'border_kiln_shield', days: 0.125, enemy: 'border_kiln_brazier',
        desc: '前面的灰落得很快，有人提着火钳挡住卸货道。', outcome: '你踩上空车架。火钳敲在车辕上，灰土一下扬了起来。' },
      { label: '从旧货单上找下一处卸车的地方', afterFight: 'border_kiln_brazier', days: 0.25, coins: 38, insight: 5, stay: true,
        loot: { salve: 2, core: 2 },
        desc: '车后还有未烧尽的货单。柜边一捆包好的货盖着驿站的印。',
        outcome: '窦芸读出「空粮仓」三个字，点了点货单上的押车路。「轮印从落琉洼外沿过去。贴白石路走，别下洼底。」她拉回还没出窑的驿货，照单结了工钱，给你两盒药和两枚灵晶。' },
    ],
  },
  { id: 'border_silo_den', name: '粮仓下的侧门',
    text: '外面看着空的旧仓还有一道运粮用的侧门。门边有窄槽，左边敞着一扇高窗。往里看，铺在货架上的油布被风掀起了一角。',
    choices: [
      { label: '站到矮墙边，看清运粮用的侧门和递粮的小窗', days: 0.125, insight: 3, stay: true,
        outcome: '门槽有人撑着链子；高窗里也有人守。窦芸比了比两处的位置，说可以从两边的矮墙后靠近。她愿等两边都腾开，再带人跟进去。' },
      { label: '沿右边的矮墙绕到拉铁链的人背后', afterChoice: 0, days: 0.125, enemy: 'border_silo_chain',
        outcome: '你一脚踩到墙影外，门槽里的链子猛地一紧。' },
      { label: '沿左墙爬上石坎，靠近递粮的小窗', afterChoice: 0, days: 0.125, enemy: 'border_silo_roof',
        outcome: '守窗人踢开东倒西歪的几个粮筐，翻到低处找你。' },
      { label: '退到矮墙后喝水歇息', afterChoice: 0, afterFight: 'border_silo_roof',
        guardedBy: ['border_silo_chain', 'border_silo_roof'], days: 0.375, hp: 22, qi: 16, stay: true,
        desc: '矮墙外有窦芸搁着的水囊。这一侧离仓门还有些距离。',
        outcome: '窦芸守着窗下。你背靠矮墙喝了几口，在墙后缓了两阵气。' },
      { label: '和窦芸从矮墙后进仓', afterChoice: 0, guardedBy: ['border_silo_chain', 'border_silo_roof'],
        days: 0.125, enemy: 'border_silo_leader',
        desc: '再往里，货架边的人已经抽出刀，刀背宽得可以托住那根秤梁。',
        outcome: '窦芸带驿差守在外边。阮隼把秤梁踢倒，自己拖刀走到货架前。' },
      { label: '掀开油布，把货和分账簿一起点清', afterFight: 'border_silo_leader',
        days: 0.25, coins: 54, insight: 8, stay: true,
        loot: { ore: 4, black_iron: 3, core: 3, border_warehouse_ledger: 1 },
        outcome: '库里平码的盐包还没割去原封。驿差领走驮队的货，窦芸把事前约好的赏钱和核过账的三包矿料留给你。她把薄账簿也递过来，让你带给宋禾。',
      },
    ],
  },
];

const quests = [
  { id: 'border_close_account', region: 'mingsha_city', name: '把分账簿交给宋禾',
    desc: '盐袋、粮包和货主的名字都圈在从旧仓带回的账上。宋禾摊开那张缺车的单子，请你把分账簿放在旁边。',
    reveal: { item: 'border_warehouse_ledger' }, need: { border_warehouse_ledger: 1 },
    reward: { border_watch_charm: 1 }, coins: 28, insight: 6,
    outcome: '宋禾按姓氏把货点清，又从驿货箱里翻出一只铜腕扣。「扣在腕上，遇着横刀能垫一下。雾厚的时候里面那小片铜还会发热。」',
  },
];

export const borderContent = { items, gear, sites, events, enemies, quests };
