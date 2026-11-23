const regions = [
  { id: 'reed_meadows', name: '蒲湾圩田', tier: 0, travel: 1, desc: '弯堤把浅水拦成几块田。田里还有人在清水沟，靠水的泥地被野雁啄秃了几片。' },
  { id: 'pale_shoal', name: '灰鹭矶', tier: 0, travel: 1.25, desc: '岸边尽是细碎的白石。挑药篓的人偶尔停下补草鞋，水急的一边没人敢搁东西。' },
  { id: 'fish_ladder', name: '跃鱼旧渠', tier: 2, travel: 1.5, desc: '木闸让水分三层落下。最下面的槽积着碎石，钓客脚下那块平石只够搁一张小凳。' },
  { id: 'willow_post', name: '折水驿', tier: 0, travel: 1.25, desc: '驿站夹在两股水之间，挑担人和船工都在檐下换鞋。后院留着半座旧门。' },
  { id: 'gauge_tower', name: '校潮亭', tier: 1, travel: 1.5, desc: '亭外立着一把量水位的长尺，尺脚伸进深水。人们上下台阶，把边上的平石踩得发亮。' },
  { id: 'screen_slope', name: '晒盘坡', tier: 2, travel: 1.5, desc: '山风穿过倒伏的木架。坡下晒着矿盘和草根，最上方的筛架还挂在一面断壁上。' },
  { id: 'lantern_court', name: '系灯院', tier: 1, travel: 1.5, desc: '院中有井有灶。日落后有人给运货的山路挂灯，通行帖就搁在院门的长凳上。' },
  { id: 'undertow_grotto', name: '回潮母洞', tier: 6, travel: 0.5, secret: true, reveal: { item: 'undertow_entry' }, desc: '薄薄的岩壁两侧各流过一股水。洞里隆起一道石脊，潮水淹不到。贴着洞顶的路比脚下的泥地稳。' },
  { id: 'counter_bell', name: '反声钟窟', tier: 5, travel: 0.75, secret: true, reveal: { item: 'counter_bell_entry' }, desc: '倒钟下是一条窄通道。墙边干燥的地方架着一排信，两侧的小孔还能听见地面传来的响声。' },
];

const regionDetails = {
  village: { province: 'wuliang', x: 14, y: 53, links: ['marsh', 'reed_meadows'], settlement: { type: '村庄' }, portal: true, array: true },
  marsh: { province: 'wuliang', x: 28, y: 68, links: ['village', 'ridge', 'reed_meadows', 'pale_shoal', 'undertow_grotto'] },
  ridge: { province: 'wuliang', x: 47, y: 60, links: ['marsh', 'ford', 'screen_slope', 'counter_bell'] },
  ford: { province: 'wuliang', x: 73, y: 74, links: ['ridge', 'hidden', 'pine_ridge', 'fish_ladder', 'willow_post', 'zhao_city'] },
  hidden: { province: 'wuliang', x: 91, y: 89, links: ['ford'] },
  pine_ridge: { province: 'wuliang', x: 66, y: 45, links: ['ford', 'kiln_valley', 'screen_slope', 'lantern_court'] },
  kiln_valley: { province: 'wuliang', x: 50, y: 35, links: ['pine_ridge', 'herb_basin'] },
  herb_basin: { province: 'wuliang', x: 35, y: 26, links: ['kiln_valley', 'black_mine', 'screen_slope'] },
  black_mine: { province: 'wuliang', x: 20, y: 16, links: ['herb_basin', 'snow_pass'] },
  snow_pass: { province: 'wuliang', x: 47, y: 12, links: ['black_mine', 'sky_terrace'] },
  sky_terrace: { province: 'wuliang', x: 72, y: 10, links: ['snow_pass'] },
  reed_meadows: { province: 'wuliang', x: 13, y: 77, links: ['village', 'marsh', 'gauge_tower'] },
  pale_shoal: { province: 'wuliang', x: 42, y: 89, links: ['marsh', 'gauge_tower', 'willow_post'] },
  fish_ladder: { province: 'wuliang', x: 87, y: 62, links: ['ford', 'lantern_court'] },
  willow_post: { province: 'wuliang', x: 66, y: 91, links: ['ford', 'pale_shoal'], portal: true,
    settlement: { type: '驿站', inn: 2, goods: { ration: { price: 5, start: 10, cap: 12, interval: 2 }, salve: { price: 9, start: 3, cap: 4, interval: 4 }, wood: { price: 4, start: 5, cap: 7, interval: 4 } }, buys: { hide: 4, qi_core: 6, beast_meat: 2 } } },
  gauge_tower: { province: 'wuliang', x: 25, y: 94, links: ['reed_meadows', 'pale_shoal'] },
  screen_slope: { province: 'wuliang', x: 32, y: 46, links: ['ridge', 'pine_ridge', 'herb_basin'] },
  lantern_court: { province: 'wuliang', x: 86, y: 34, links: ['pine_ridge', 'fish_ladder'], portal: true,
    settlement: { type: '宗门', inn: 2, goods: { ration: { price: 4, start: 12, cap: 14, interval: 2 }, iron_talisman: { price: 14, start: 2, cap: 4, interval: 7 }, iron_arrow: { price: 3, start: 10, cap: 15, interval: 5 } }, buys: { wood: 2, foundation_core: 20, ore: 3 } } },
  undertow_grotto: { province: 'wuliang', x: 53, y: 78, links: ['marsh'] },
  counter_bell: { province: 'wuliang', x: 52, y: 49, links: ['ridge'] },
};

const items = [
  { id: 'undertow_entry', name: '回潮洞引线', kind: 'key', price: 0, sell: 0, desc: '你在白苇滩的石门旁固定了一根引路绳。潮水倒流时，顺着绳就能摸到高处的石阶。' },
  { id: 'counter_bell_entry', name: '反声孔通路', kind: 'key', price: 0, sell: 0, desc: '从鸣沙带来的铜片卡住石孔，钟声便落向地下。石孔后有楼梯，进洞后也能沿原路返回。' },
  { id: 'river_field_stamp', name: '蒲湾渠契', kind: 'key', price: 0, sell: 0, desc: '姚六签了名的修渠凭据。田户和折水驿照着它分摊修水渠的木料。' },
  { id: 'river_gauge_copy', name: '校潮亭抄尺', kind: 'key', price: 0, sell: 0, desc: '竹纸上印着亭下三段水尺的刻痕。最下面一段记的是潮水倒流的时辰。' },
  { id: 'river_trial_writ', name: '封乔的试杆签', kind: 'key', price: 0, sell: 0, desc: '护堤人封乔把系红布的木签递给你。折水驿的人认这道手印。' },
];

const stock = (label, start, cap, interval, growth, choice) => ({ label, start, cap, interval, growth, choices: [choice] });
const animal = (start, cap, interval, growth, curve) => ({ start, cap, interval, growth, ...(curve ? { curve } : {}) });

const sites = [
  { id: 'meadow_channel', region: 'reed_meadows', name: '姚六的弯渠', once: [2, 3],
    stocks: { reed: stock('田边灵草', 4, 7, 4, 2, 0), wood: stock('沟口漂木', 4, 5, 4, 2, 1) },
    stockText: {
      reed: { present: '内沟边有一茬灵草。', absent: '内沟边的灵草只剩没长成的嫩芽。' },
      wood: { present: '外沟的窄口卡着漂木。', absent: '外沟口的漂木已清开，水能流出去。' },
    },
    choiceText: {
      2: { before: '两户田之间的槽板向外翘着。', after: '新换的槽板撑稳了，两户的田都能过水。' },
      3: { after: '先前放走野雁的岸边，还留着几枚浅脚印。' },
    } },
  { id: 'meadow_ruts', region: 'reed_meadows', name: '雁脚泥垄',
    creatures: { reed_fox: animal(2, 4, 4, 1, 'wild') },
    creatureText: { reed_fox: { present: '狐狸顺着雁的脚印钻进堤下，留了两行新脚印。', absent: '泥垄上只剩让日头晒干的旧脚印。' } } },
  { id: 'shoal_baskets', region: 'pale_shoal', name: '灰鹭晒篮处', once: [2],
    stocks: { reed: stock('鹭草根', 3, 6, 4.5, 2, 0), core: stock('石缝灵晶', 2, 4, 5, 1, 1) },
    afterOnceText: { 2: '白宜缝好了鞋，把篮子倒扣在石上晾。浅石边是鹭草扎根的地方，往下游几步还有一排容易积砂的石缝。' } },
  { id: 'ladder_drop', region: 'fish_ladder', name: '第三级闸口',
    stocks: { wood: stock('闸梁上的枯枝', 4, 7, 4, 2, 0), ore: stock('槽底寒铁', 4, 7, 5, 2, 2) },
    creatures: { river_gateback: animal(1, 2, 6, 1, 'wild') },
    creatureText: { river_gateback: { present: '水里那条横脊每次摆尾，最下一级的阶都被掩住。', absent: '水阶落出一截，能踩去有铁屑的水槽。' } } },
  { id: 'willow_yard', region: 'willow_post', name: '卸货后院', once: [0, 1],
    choiceText: {
      0: { before: '门房从钩上摘下两块名牌，一块写着系灯院，一块写着白苇滩。', after: '写着系灯院的木牌挂回了钩上，封乔的那一块压着门房手边的货单。' },
      1: { before: '檐下的雨槽歪向院里，水顺着石板流到行李旁。', after: '雨水顺着新木槽淌到院外，檐下的行李没再淋湿。' },
    } },
  { id: 'gauge_piles', region: 'gauge_tower', name: '刻尺水桩', once: [0, 1],
    stocks: { core: stock('水尺旁的灵晶', 2, 5, 6, 1, 2) } },
  { id: 'slope_sieves', region: 'screen_slope', name: '断壁筛架', once: [3],
    stocks: { ore: stock('坡下筛盘的寒铁', 5, 8, 5, 2, 0), black_iron: stock('高处筛盘的暗金', 2, 5, 7, 1, 2) },
    creatures: { stone_badger: animal(1, 3, 6, 1, 'wild') },
    creatureText: { stone_badger: { present: '筛架下有个滚圆的东西在磨石头，碎砂直落到外侧。', absent: '架下没有磨石声。从绳结处够得到旧筛。' } } },
  { id: 'lantern_term', region: 'lantern_court', name: '夜灯廊', once: [0, 1],
    afterOnceText: { 1: '挂灯人已把碎护皮换下。廊口的横凳留给巡夜回来的人，右侧还有一条访堂的石路。' } },
  { id: 'undertow_bed', region: 'undertow_grotto', name: '退水石脊', once: [1],
    stocks: { core: stock('侧洞灵晶', 5, 9, 7, 2, 2) },
    creatures: { undertow_moundback: animal(1, 1, 0, 0) },
    creatureText: { undertow_moundback: { present: '泥脊忽然抬起一截。河砂从一排粗鳞上掉下来，一对角堵住了去侧洞的路。', absent: '' } },
    afterWinText: { undertow_moundback: '泥脊塌下去，床面留下三圈未被潮水搅散的黑泥。角原来挡着的那条路能通到侧洞。' },
    afterOnceText: { 1: '中央多了个积着清水的坑。侧洞的石壁上还挂着几道晶砂留下的细痕。' } },
  { id: 'counter_bell_score', region: 'counter_bell', name: '信架与钟枢', once: [1, 3],
    stocks: { black_iron: stock('钟座暗金', 4, 8, 7, 2, 2) },
    creatures: { river_copper_echo: animal(1, 1, 0, 0) },
    creatureText: { river_copper_echo: { present: '钟声一响，铜影便挡在信架前，把钟槌横在膝前。', absent: '铜影散去了，古钟旁的信架没人守。' } },
    afterOnceText: { 1: '信架底只剩抄图时用过的一块墨。钟脚外沿还嵌着几片暗金。' } },
];

const events = [
  { id: 'meadow_channel', name: '姚六的弯渠', text: '田坎边并排两道浅沟。姚六扛着耙子在田边歇脚。', choices: [
    { label: '采田边的灵草', days: 0.5, insight: 1, loot: { reed: 3 }, outcome: '姚六指了指内沟边的嫩草，你顺着他指的地方采了几束。' },
    { label: '搬开沟口卡住的枯木', days: 0.5, insight: 1, loot: { wood: 2 }, outcome: '枯木挪开后，浑水沿外沟慢慢流了下去。' },
    { label: '拿松木帮姚六修水槽', desc: '水槽边的木板向外翘着。姚六说：「拿两片直木把这个口子撑住，两户田都能过水。修完去驿站报个名。」', need: { wood: 2 }, consume: true, days: 0.5, coins: 7, insight: 2, loot: { river_field_stamp: 1 }, outcome: '水槽修好后，姚六从袖里数出几枚钱，又在修渠凭据背面写上名字，画了去驿站的路。' },
    { label: '把困在水里的野雁托上岸', desc: '芦叶下面有只湿透的雁，只剩一只脚能站稳。', days: 0.25, insight: 1, loot: {}, outcome: '野雁在泥边晃了两步才飞走。姚六把外沟的水放浅一些，免得再有鸟陷进去。' },
  ] },
  { id: 'meadow_ruts', name: '雁脚泥垄', text: '水口封住后，泥地晒出一层硬壳，雀儿落下来一啄就碎。深处有个长条形的土坑。', choices: [
    { label: '沿土窝外面走一圈', days: 0.375, enemy: 'reed_fox', outcome: '狐从边上的草洞绕到堤背，对着鞋跟一口咬来。' },
    { label: '站上矮堤，找校潮亭的方向', days: 0.125, insight: 1, outcome: '远处有人把红布缠上水尺顶端。红布旁就是下一座管着水渠的亭子。' },
  ] },
  { id: 'shoal_baskets', name: '灰鹭晒篮处', text: '岸边水浅，鹭草露着细根。下游的石缝里常积些水冲上来的灵晶。白宜坐在两处中间，拿针给旧鞋补眼。', choices: [
    { label: '拔岸边露根的鹭草', days: 0.5, insight: 1, loot: { reed: 2 }, outcome: '抓住露头的草叶轻轻一拽，草根上成团的白泥落回水边。' },
    { label: '拨开浅石捡晶砂', days: 0.625, insight: 2, loot: { core: 1 }, outcome: '阳光照进浅滩，洗过的砂里有些灵晶能捡。' },
    { label: '问白宜哪边的滩好走', days: 0.25, insight: 1, loot: {}, outcome: '白宜把鞋上的线咬断。「沿干石走。白苇后有人高的石缝，我年轻时进去过，潮一转，人又被挤回原岸。照原有个管水的也去看过。」她指了指旧渡，说那边还有给人送木料的商船。' },
  ] },
  { id: 'ladder_drop', name: '第三级闸口', text: '上头的木梁低，涨水时漂来的枝条容易挂在上面。第二级阶没在及膝的水里，再往下才是排矿渣的槽。钓客岑响坐在水边的石凳上。', choices: [
    { label: '取上层木梁上的枯枝', days: 0.75, insight: 1, loot: { wood: 3 }, outcome: '枝条一松，露出木梁被水泡深的纹路。' },
    { label: '走到中间的台阶，引开水里的兽', days: 0.375, enemy: 'river_gateback', outcome: '岑响抄起鱼篓往上退。横脊闸兽甩动背鳍，重重打在闸梁上。' },
    { label: '到最下面的水槽筛寒铁', guardedBy: 'river_gateback', days: 0.875, insight: 3, loot: { ore: 3 }, outcome: '筛掉浮砂，较沉的铁粒留在布里。' },
    { label: '问岑响为何守着坏掉的水闸', days: 0.125, insight: 1, outcome: '岑响抖了抖鱼篓底的泥。「闸坏了，岸边的鱼游不上来。等找人修好了，总还会回来。」' },
  ] },
  { id: 'willow_yard', name: '卸货后院', text: '货柜靠墙排成一列，旅人的包袱都暂堆在檐下。', choices: [
    { label: '问门房这两块名牌是谁的', days: 0.125, insight: 1, loot: {}, outcome: '门房把系灯院的牌子挂回钩上，留下写着「白苇滩，封乔」的那块。「咱们夜里只托熟人送货。你若在木台上赢过封乔，他给你木签，我这儿就认得你了。」' },
    { label: '替门房补好接雨水的木槽', desc: '门房瞧了一眼天色。「手头若有三片木，我出八钱。再漏一晚，来歇脚的人都睡不好。」', days: 0.5, need: { wood: 3 }, consume: true, coins: 8, insight: 1, loot: {}, outcome: '木槽接住檐下的水。门房用麻绳固定好，从茶桌下取出约定的钱。' },
  ] },
  { id: 'gauge_piles', name: '刻尺水桩', text: '水桩上方挂着一块红布。轮值人胥婉把湿纸托得很平，下方有格外深的第三截尺。水浪把晶屑推到外侧一只废铁盘上。', choices: [
    { label: '替胥婉按住纸，印下水尺刻痕', days: 0.375, insight: 2, loot: { river_gauge_copy: 1 }, outcome: '胥婉拿炭条擦过纸面，尺上的刻痕便印了下来。她把第一份晾好交给你。「最下面记的是潮水倒流的时辰。东边旧县也有一把长尺。」' },
    { label: '问最下面那两道深刻痕', desc: '尺脚有两道格外深的痕，湿纸压上去，边沿都翘了起来。', days: 0.125, insight: 1, outcome: '胥婉把短尺翻给你看。那两道痕照的是反潮石门上固定绳子的槽。东边的测水人来试过槽里的铁楔，走时把铁楔也带过了渡。' },
    { label: '筛废铁盘外沿的晶砂', days: 0.625, insight: 1, loot: { core: 2 }, outcome: '细筛晃过几下，晶砂留在旧铁盘的外沿。' },
  ] },
  { id: 'slope_sieves', name: '断壁筛架', text: '坡下摆着筛寒铁的旧盘，盘沿能翻过来看。坡上的筛架靠两根木柱撑着，攀上去得抓住柱间垂下来的绳。', choices: [
    { label: '用坡下的筛盘筛寒铁', days: 0.75, insight: 2, loot: { ore: 3 }, outcome: '铁粒滚到筛盘底部，你拨开盖在上面的石粉。' },
    { label: '走近上坡那两根木柱', days: 0.5, enemy: 'stone_badger', outcome: '石甲獾从第一根木柱后挤出来，转身直顶你的脚踝。' },
    { label: '抓着绳子，到高处筛暗金', guardedBy: 'stone_badger', days: 1, insight: 2, loot: { black_iron: 2 }, outcome: '深色颗粒很沉，顺着筛底落进矿工挂的布袋。' },
    { label: '翻看筛盘背面', days: 0.25, insight: 1, loot: {}, outcome: '筛盘背面留了一宽一窄两个孔，旁边刻着几级向上的台阶。有人拿炭笔写了个「回」字，笔画快给手磨平了。' },
  ] },
  { id: 'lantern_term', name: '夜灯廊', text: '弟子裴见抱着一条用来护住过路人的粗绳。身旁串着几盏灯，门外长凳上还留着给行人歇脚的位置。', choices: [
    { label: '问裴见这几盏灯是给谁的', days: 0.125, insight: 1, loot: {}, outcome: '裴见一盏盏翻给你看。采药人去旧渠，拉货的车去松场，也有人挑担去西岸。各人都认得自己的那盏，走到多晚也能认路。' },
    { label: '给裴见兽革，补好安全绳', desc: '裴见拉过绳头。擦着山石的地方本来包了皮，如今连里面的麻丝都磨出来了。', need: { hide: 2 }, consume: true, days: 0.5, insight: 1, loot: { iron_talisman: 1, ration: 2 }, outcome: '裴见缝好皮，自己先拽了两把。「这样才敢叫别人抓。」他顺手把一张符夹进两包干粮，趁热递给你。' },
  ] },
  { id: 'undertow_bed', name: '退水石脊', text: '两股潮水都漫不过中间的石脊。顺绳下来，前面是一片平泥地。再往外，侧洞的石壁上闪着灵晶。', choices: [
    { label: '沿石脊走近那片泥地', days: 0.5, enemy: 'undertow_moundback', outcome: '负丘虺从水里顶起整片泥地，侧身把你逼到石脊尽头。' },
    { label: '挖泥地正中的黑泥', afterFight: 'undertow_moundback', days: 0.625, insight: 6, loot: { heart_silt: 2 }, outcome: '潮水还在石脊两边响，泥心却不起一丝水纹。你挖出两份伏潮息泥，包好时指尖还凉着。' },
    { label: '沿石脊绕去侧洞，采灵晶', guardedBy: 'undertow_moundback', days: 1, insight: 3, loot: { core: 4 }, outcome: '晶砂从岩壁落进筛里。侧洞的水来得慢，你还能循这条路回到高处。' },
  ] },
  { id: 'counter_bell_score', name: '信架与钟枢', text: '你停下了，脚步声还从钟里多回来一下。墙上擦痕高过肩头，一直伸到古钟后面。角落的信架歪着，底下压了几页厚纸，旁边钟座上露出暗金。', choices: [
    { label: '顺着钟槌留下的擦痕去看古钟', days: 0.375, enemy: 'river_copper_echo', outcome: '铜影从墙边抬起手臂，挤进窄缝，一槌砸向通道正中。' },
    { label: '取出信架下的传送卷轴图纸', afterFight: 'river_copper_echo', days: 0.375, insight: 5, loot: { gate_scroll_formula: 1 }, outcome: '图上写着怎样做传送卷轴，用的是薄木、草浆和少量灵晶砂。卷轴只通向自己认过的门。' },
    { label: '移开挂片，筛钟座下的暗金', guardedBy: 'river_copper_echo', days: 0.875, insight: 2, loot: { black_iron: 3 }, outcome: '大块暗金压在钟脚下。你挑松动的小片筛进布里。' },
    { label: '看看旧送信人走过哪些门', days: 0.25, insight: 1, loot: {}, outcome: '折水驿、系灯院和落灯村的门写在同一页。送信人先徒步去认过这些门，往后的账上就很少再报脚钱。' },
  ] },
];

export const extendSites = [
  { id: 'undertow_door', region: 'marsh', name: '反潮石门', once: [1, 2],
    afterOnceText: { 1: '新铁楔卡在旧槽里，绳子通向高处的石阶。外侧的潮水还会倒流，过洞口时可以抓住绳子。' } },
  { id: 'marsh_pole_lesson', region: 'marsh', name: '封乔的护堤木台', once: [0, 2], protectedArena: true,
    creatures: { river_spar_captain: animal(1, 1, 5, 1) },
    creatureText: { river_spar_captain: { present: '封乔正拿杆尖朝练手台上点，不时让渔人过桥，手和眼睛都没乱。', absent: '封乔退到了灯影下。他把红布搁到台边，让手腕缓一缓再陪来客切磋。' } },
    afterOnceText: { 2: '领过试杆签，封乔把另一支短杆扶直，台角还有供照看的安全绳。' } },
  { id: 'counter_bell_door', region: 'ridge', name: '倒钟后的反声门', once: [1],
    afterOnceText: { 1: '铜片斜卡在一宽一窄两个孔之间。第一层台阶已经落下，脚步声顺着台阶传进地下。' } },
  { id: 'ford_packet_boat', region: 'ford', name: '外桩商船', once: [0],
    afterOnceText: { 0: '夏狄把补好的窄船拴回外桩，在船边压着乘客名单。她给你留了个座，从外港能去照原城。' } },
  { id: 'ford_below_steps', region: 'ford', name: '闸下无灯梯', once: [0, 2],
    creatures: { ford_lower_spirit: animal(1, 2, 11, 1) },
    creatureText: { ford_lower_spirit: { present: '下面的灯架没亮，但什么东西踢到了第二根石栏，撞得空响。', absent: '第二根石栏下面只剩脱落的湿泥，水面也安静了。' } },
  },
];

export const extendEvents = [
  { id: 'undertow_door', name: '反潮石门', text: '芦苇后露出半扇厚重的石门，门边有道空槽。水从石门两侧往不同方向流，外侧的台阶还露在水面上。', choices: [
    { label: '沿外侧石阶绕一圈', desc: '墙外还有一排露出水面的石阶，一直连回岸边。', days: 0.25, insight: 1, outcome: '你扶着石阶走，水流把你慢慢送回原先的苇丛。再来一股潮，门两边的水都换了方向。水势一变，只有靠里的高阶还露在外头。' },
    { label: '把倒浪楔卡进石槽，固定绳子', desc: '施荀给的铁楔刚好对得上石槽。潮水倒流时，可以抓着绳子找高处的台阶。', hidden: true, need: { undertow_wedge: 1 }, days: 0.5, insight: 3, loot: { undertow_entry: 1 }, outcome: '第二股潮水打过来，铁楔才牢牢卡住。你沿绳摸到上方的石阶，找到了去回潮母洞的路。' },
    { label: '用校潮亭的印纸对照潮水方向', desc: '石槽边的浅痕正对着倒流的潮水，和印纸最下面几道痕同向。', hidden: true, need: { river_gauge_copy: 1 }, days: 0.25, insight: 2, outcome: '印纸贴在槽边，最后两道线只从内侧湿起。绳子会随水换方向，固定它的铁件得同时卡住槽的两头。' },
  ] },
  { id: 'marsh_pole_lesson', name: '封乔的护堤木台', text: '护堤人封乔常年领村里的河工。他把湿麻绳拴在矮台外，留下近处一截给练手的人扶。台边立着长杆和软头杆。', choices: [
    { label: '问封乔河里出了什么事', days: 0.125, insight: 1, outcome: '封乔指着台下被卷碎的苇筏。「深水里有条大兽，爱伏在石门旁。它不来浅岸。我守的是河工，你别顺深水去追。」' },
    { label: '拿练习杆，和封乔切磋', desc: '他把麻绳放松一截。「站不稳就叫停，别跌进水里。」', days: 0.25, enemy: 'river_spar_captain', outcome: '河工守在台边。封乔换了根软头短杆，朝你让出几步。' },
    { label: '接过封乔的试杆签', desc: '封乔放下短杆，取了一支先前用红布系好的木签。', afterFight: 'river_spar_captain', days: 0.125, insight: 4, loot: { river_trial_writ: 1 }, outcome: '封乔在木签上按了手印。「夜里水响，赶路靠脚稳。折水驿要托人带急信，你肯帮忙，就拿这个给他们看。」' },
  ] },
  { id: 'counter_bell_door', name: '倒钟后的反声门', text: '倒钟最矮处留着一枚没有字的石阶。石阶后有两个不同宽窄的孔，一长声一短声从里面撞回来。', choices: [
    { label: '贴着石壁敲三下', days: 0.125, insight: 1, outcome: '前两声沿石阶传回来，第三声却顺宽孔往下传。弯下腰细听，石阶底下还有一处空腔。' },
    { label: '把听矿铜簧斜卡进两个石孔', desc: '那块铜片宽端抵住外面的孔，缺角的一端斜着能卡进里面的凹口。', hidden: true, need: { echo_tuning_key: 1 }, days: 0.5, insight: 3, loot: { counter_bell_entry: 1 }, outcome: '第三声在窄孔里没了回音。下方石阶却落稳了，宽孔的回声从脚底传来。那是通往反声钟窟的路。' },
  ] },
  { id: 'ford_packet_boat', name: '外桩商船', text: '闸外有条窄船拴在缓水里。船家夏狄翻起一块裂开的木板，指给船工看船侧的缺口。', choices: [
    { label: '给夏狄修船料，领去照原的货单', desc: '夏狄认得外港的水路。船边要用四份松木、两份寒铁修补，添上七钱船费，她就把你写进货单。', need: { wood: 4, ore: 2 }, consume: true, coins: -7, days: 0.75, insight: 3, loot: { ferry_manifest: 1 }, outcome: '夏狄换掉磨薄的船板，把新木钉牢。「大渡口关着也能从外港走。坐船里侧，看见照原那三把高水尺就到了。」她在商船货单背面写下你的名字。' },
    { label: '问夏狄的船从哪条水路出港', days: 0.125, insight: 1, outcome: '夏狄指着水闸外的大石。「大渡口开了就有官船。外港水浅，只走这种小船，带不了整批货。」' },
  ] },
  { id: 'ford_below_steps', name: '闸下无灯梯', text: '一截铁梯从木排外沿伸进水闸下面，铁栏折了两处。第一根栏杆上绑着小旗，短绳就系在旗旁，供人扶着下梯。', choices: [
    { label: '留在上层，看看梯边的木牌', days: 0.125, insight: 1, outcome: '小旗在暗处也摸得到。旁边的木牌写着，照原城的人来修过排水口。换了水尺后，巡闸人就很少再下到第三级。' },
    { label: '沿短绳下到第二根栏杆', desc: '石阶刚够转身，一手仍能攥住绳尾。', days: 0.5, enemy: 'ford_lower_spirit', outcome: '薄灯下有道皱着的长影，听见绳扣响，猛地甩开下面两层灯架。' },
    { label: '翻看松动的修闸名牌', afterFight: 'ford_lower_spirit', days: 0.25, insight: 3, outcome: '牌背刻着照原量水司和三名工人的名字。你把木牌留在栏上，扶绳回到外桩。' },
  ] },
];

const enemies = [
  { id: 'river_spar_captain', name: '护堤人封乔', tags: ['human'], tier: 6, hp: 128, atk: 25, def: 10, sparring: true,
    intents: [{ name: '软杆点踝', kind: 'attack', mult: 0.95 }, { name: '横杆拉住退处', kind: 'heavy', mult: 1.52 }, { name: '杆尾触台', kind: 'guard', mult: 1.35 }, { name: '换握压袖', kind: 'attack', mult: 1.1 }],
    insight: 8, loot: {}, desc: '他拿的是裹了软布的杆子，台边有人照看。看他双手握近杆头，就要下重手了。' },
  { id: 'river_gateback', name: '横脊闸兽', tags: ['beast', 'scaled'], tier: 2, hp: 60, atk: 13, def: 5,
    intents: [{ name: '顺水甩鳍', kind: 'attack', mult: 1.0 }, { name: '压低脊鳍', kind: 'guard', mult: 1.4 }, { name: '沿闸梁冲横', kind: 'heavy', mult: 1.55 }, { name: '贴闸游回', kind: 'attack', mult: 1.09 }],
    insight: 5, loot: { beast_meat: 3, hide: 2, qi_core: 2 }, desc: '游在最小的宽面上。后脊一倒下，尾巴便会顺闸向外冲扫。' },
  { id: 'undertow_moundback', name: '负丘虺', tags: ['beast', 'scaled'], tier: 6, hp: 115, atk: 23, def: 9,
    intents: [{ name: '抖落泥团', kind: 'attack', mult: 1.0 }, { name: '低头用角护身', kind: 'guard', mult: 1.45 }, { name: '顶起泥浪冲上石脊', kind: 'heavy', mult: 1.62 }, { name: '掀来倒流的潮水', kind: 'drain', mult: 0.55 }, { name: '用尖角扫向膝盖', kind: 'attack', mult: 1.05 }],
    insight: 18, loot: { beast_meat: 6, hide: 4, beast_eye: 1, gold_core: 1 }, desc: '它在石门里翻泥为窝，外潮能把它送到高脊。负起整层泥之前，两角会先收成一线。' },
  { id: 'river_copper_echo', name: '屈膝铜影', tags: ['spirit', 'stoneborn'], tier: 5, hp: 100, atk: 21, def: 9,
    intents: [{ name: '拖着铜槌上前试探', kind: 'attack', mult: 1.0 }, { name: '背靠石钟护住身子', kind: 'guard', mult: 1.5 }, { name: '借钟的回声挥出重槌', kind: 'heavy', mult: 1.58 }, { name: '踩着回声迫近', kind: 'attack', mult: 1.1 }],
    insight: 13, loot: { foundation_core: 3 }, desc: '旧守门人的半副铜影。槌头顶上钟背时会借第二响落重手。' },
  { id: 'ford_lower_spirit', name: '悬梯堰影', tags: ['spirit'], tier: 4, hp: 83, atk: 18, def: 7,
    intents: [{ name: '扯旗杆试重', kind: 'attack', mult: 1.0 }, { name: '携梯翻水', kind: 'heavy', mult: 1.62 }, { name: '借堰石掩身', kind: 'guard', mult: 1.4 }, { name: '压暗灯罩', kind: 'drain', mult: 0.58 }],
    insight: 10, loot: { foundation_core: 2 }, desc: '旧堰和暗灯之间来回游。它先绷住铁栏，再甩开贴门的深水。' },
];

const quests = [
  { id: 'willow_check_dike', region: 'willow_post', name: '核对蒲湾的木渠', reveal: { item: 'river_field_stamp' },
    desc: '门房把蒲湾的两张旧账摊开。「同一条渠，两户出过多少木头，抄得不一样。你把原凭据带来，再添三块松木。明年下雨前，手边总得有料可换。」',
    need: { river_field_stamp: 1, wood: 3 }, reward: { ration: 4, salve: 1 }, coins: 14, insight: 3,
    outcome: '驿站的人把两户的份额记到木牌背面，收好备用的木料，结了钱和路上的口粮。' },
  { id: 'willow_night_packet', region: 'willow_post', name: '给走夜路的送货人备兽革', reveal: { item: 'river_trial_writ' },
    desc: '门房认出封乔的木签，从后院叫来个正绑货的脚夫。脚夫掀开背篓让你看。「明早上坡修水槽，绳子总在石沿磨断。还差三张整皮包住绳头。」',
    need: { river_trial_writ: 1, hide: 3 }, reward: { iron_talisman: 2, ration: 5 }, coins: 24, insight: 4,
    outcome: '驿站把兽革扎好留给送货人，挂起封乔的木签，又从巡夜人的符袋里拿出两张符，和工钱一起递给你。' },
];

const sects = [
  { id: 'lantern_tenders', region: 'lantern_court', name: '系灯院',
    desc: '系灯院沿山路挂灯，给夜里送货的人照路。裴见会带新人巡路，也请过路人帮忙检查磨破的绳。',
    join: { need: { wood: 5, hide: 2 }, coins: 16, text: '裴见用你带来的木和护革又做两盏灯。你在一段夜路的名簿上写下自己的名字。' },
    jobs: [
      { id: 'lantern_shift', name: '交明夜要用的干灯芯', desc: '晒架下只够挂几束干灯芯，等上一班的筐空下来才接新的。', need: { reed: 6, wood: 2 }, credit: 3, coins: 10, cooldown: 7, reward: { ration: 3 }, text: '裴见擦干六束草芯，把新木夹和灯一起发下去。' },
      { id: 'lantern_heel', name: '给山路的安全绳换皮和铁扣', desc: '绳子常磨到山石，旧皮遇雨一软就更不耐用。巡灯人还得一并换下磨坏的铁扣。', need: { hide: 4, ore: 3 }, credit: 5, coins: 18, cooldown: 11, reward: { salve: 1 }, text: '裴见把旧铁扣送修，让人带上新皮和铁扣去换安全绳上的两处磨损。' },
    ],
    ranks: [
      { id: 'lantern_watch', credit: 0, name: '候灯人' },
      { id: 'lantern_patrol', credit: 8, name: '巡灯人', reward: { iron_talisman: 2, ration: 6 }, text: '两段驮道终于都有稳灯。裴见把旧符和一袋耐放的粮给你。' },
      { id: 'lantern_keeper', credit: 18, name: '掌灯人', reward: { jade_pill: 1, core: 4 }, art: 'stone_brace', text: '裴见把守灯人的脚架教给你，也留了上一趟多带回的方晶和一丸稳气丹。' },
    ],
    sparSite: 'marsh_pole_lesson',
  },
];

export const riverContent = { regions, regionDetails, sites, events, items, enemies, quests, sects };
