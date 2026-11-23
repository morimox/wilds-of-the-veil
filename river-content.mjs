const regions = [
  { id: 'reed_meadows', name: '蒲湾圩田', tier: 0, travel: 1, desc: '弯堤把浅水拦成几格圩田。佃户还在疏渠，田根有几片让野雁啄秃的泥地。' },
  { id: 'pale_shoal', name: '灰鹭矶', tier: 0, travel: 1.25, desc: '水脚全是细碎的白石。偶尔有挑药篓的人停下来补草鞋，谁也不肯把鞋晾在主流那边。' },
  { id: 'fish_ladder', name: '跃鱼旧渠', tier: 2, travel: 1.5, desc: '老木闸叠出三级落水口。旧水槽还收着石屑，钓客的磐石只够搁一张小凳。' },
  { id: 'willow_post', name: '折水驿', tier: 0, travel: 1.25, desc: '驿屋支在两股水之间，走脚人与摆渡人都在檐下换鞋。后院留着半座旧门。' },
  { id: 'gauge_tower', name: '校潮亭', tier: 1, travel: 1.5, desc: '亭外的水尺从岸上直立进深水，阶边的两块平石被轮值的人磨亮了。' },
  { id: 'screen_slope', name: '晒盘坡', tier: 2, travel: 1.5, desc: '山风穿过倒伏的木架。坡下晒着矿盘和草根，最上方的筛架还挂在一面断壁上。' },
  { id: 'lantern_court', name: '系灯院', tier: 1, travel: 1.5, desc: '院中有井、有灶，也有日落后去驮道挂灯的人。门下通行帖和来客的鞋排在同一张长凳上。' },
  { id: 'undertow_grotto', name: '回潮母洞', tier: 6, travel: 0.5, secret: true, reveal: { item: 'undertow_entry' }, desc: '薄岩两侧各走一股水，里面是水位涨落都淹不到的中脊。通道紧贴洞顶，比脚下泥床稳得多。' },
  { id: 'counter_bell', name: '反声钟窟', tier: 5, travel: 0.75, secret: true, reveal: { item: 'counter_bell_entry' }, desc: '倒钟以下是一道甬室。墙根有设在干处的信架，两侧的引声孔至今还和地表相通。' },
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
  { id: 'undertow_entry', name: '回潮洞引线', kind: 'key', price: 0, sell: 0, desc: '你在白苇滩石门的旧槽里固定了过水细绳。每遇逆涌，顺绳伸手就摸得到高处的石阶。' },
  { id: 'counter_bell_entry', name: '反声孔通路', kind: 'key', price: 0, sell: 0, desc: '鸣沙的铜簧在沉钟岭对上旧座，折角正能引出回声。斜槽背后的窟门沿阶可以返回地面。' },
  { id: 'river_field_stamp', name: '蒲湾渠契', kind: 'key', price: 0, sell: 0, desc: '佃户姚六以三横一折签了姓名。圩田和折水驿仍用这张契约分担木渠的维护。' },
  { id: 'river_gauge_copy', name: '校潮亭抄尺', kind: 'key', price: 0, sell: 0, desc: '一页细薄的竹纸，照着亭下三段水尺拓印。最低一段刻的是水回头的时辰。' },
  { id: 'river_trial_writ', name: '封乔的试杆签', kind: 'key', price: 0, sell: 0, desc: '护堤人封乔把系红布的木签递给你。折水驿的人认这道手印。' },
];

const stock = (label, start, cap, interval, growth, choice) => ({ label, start, cap, interval, growth, choices: [choice] });
const animal = (start, cap, interval, growth, curve) => ({ start, cap, interval, growth, ...(curve ? { curve } : {}) });

const sites = [
  { id: 'meadow_channel', region: 'reed_meadows', name: '姚六的弯渠', once: [2, 3],
    stocks: { reed: stock('田根灵草', 4, 7, 4, 2, 0), wood: stock('拦渠枯木', 4, 5, 4, 2, 1) },
    afterOnceText: { 2: '姚六把渠契誊了两份，留给他儿子的一份正在晒干。田根还分为两道浅沟，外渠总会拦住顺水漂来的枯木。', 3: '野雁已经飞离了田根。姚六在日落前放开外渠，让水冲走田泥。两道浅沟都已露出地面，渠口时常能拦住漂木。' } },
  { id: 'meadow_ruts', region: 'reed_meadows', name: '雁脚泥垄',
    creatures: { reed_fox: animal(2, 4, 4, 1, 'wild') },
    creatureText: { reed_fox: { present: '两道狐脚踩着雁迹伸进堤下暗窝。', absent: '泥垄上只剩叫日头烤干的旧足印。' } } },
  { id: 'shoal_baskets', region: 'pale_shoal', name: '灰鹭晒篮处', once: [2],
    stocks: { reed: stock('鹭草根', 3, 6, 4.5, 2, 0), core: stock('石缝灵晶', 2, 4, 5, 1, 1) },
    afterOnceText: { 2: '补鞋的白宜蹲在浅石上晾篮子。她把鞋口重新缠好了，篮底原有一处补布也换了新片。' } },
  { id: 'ladder_drop', region: 'fish_ladder', name: '第三级闸口',
    stocks: { wood: stock('闸梁缠木', 4, 7, 4, 2, 0), ore: stock('槽底寒铁', 4, 7, 5, 2, 2) },
    creatures: { river_gateback: animal(1, 2, 6, 1, 'wild') },
    creatureText: { river_gateback: { present: '水里那条横脊每次摆尾，最下一级的阶都被掩住。', absent: '水阶落出一截，能踩去有铁屑的水槽。' } } },
  { id: 'willow_yard', region: 'willow_post', name: '卸货后院', once: [0, 1],
    afterOnceText: { 1: '驿卒把修好的雨槽推到瓦檐下。挑担人靠着门柱等水开，没人再去搬那捆沉木。' } },
  { id: 'gauge_piles', region: 'gauge_tower', name: '刻尺水桩', once: [0, 1],
    stocks: { core: stock('尺桩晶砂', 2, 5, 6, 1, 2) } },
  { id: 'slope_sieves', region: 'screen_slope', name: '断壁筛架', once: [3],
    stocks: { ore: stock('下筛寒铁', 5, 8, 5, 2, 0), black_iron: stock('绳筛暗金', 2, 5, 7, 1, 2) },
    creatures: { stone_badger: animal(1, 3, 6, 1, 'wild') },
    creatureText: { stone_badger: { present: '筛架下有个滚圆的东西在磨石头，碎砂直落到外侧。', absent: '架下没有磨石声。从绳结处够得到旧筛。' } } },
  { id: 'lantern_term', region: 'lantern_court', name: '夜灯廊', once: [0, 1],
    afterOnceText: { 1: '挂灯人已把碎护皮换下。廊口的横凳留给巡夜回来的人，右侧还有一条访堂的石路。' } },
  { id: 'undertow_bed', region: 'undertow_grotto', name: '退水石脊', once: [1],
    stocks: { core: stock('侧腔灵晶', 5, 9, 7, 2, 2) },
    creatures: { undertow_moundback: animal(1, 1, 0, 0) },
    creatureText: { undertow_moundback: { present: '泥脊忽然抬起整整一尺。粗鳞下挂着河砂，露出的角挡住了泥床。', absent: '泥脊慢慢塌下去，床面留下三圈未被河潮搅散的黑泥。' } },
    afterOnceText: { 1: '采走两份伏潮息泥后，中央的坑积着清水。石脊还能绕去出晶的侧腔。' } },
  { id: 'counter_bell_score', region: 'counter_bell', name: '信架与钟枢', once: [1, 3],
    stocks: { black_iron: stock('钟座暗金', 4, 8, 7, 2, 2) },
    creatures: { river_copper_echo: animal(1, 1, 0, 0) },
    creatureText: { river_copper_echo: { present: '半身铜影随着钟声走到信架前，钟槌先横过它膝头。', absent: '铜影散去，已能拉开钟枢旁的信架。' } },
    afterOnceText: { 1: '信架底只剩给抄式人用的墨锭。钟座外圈是原来安引声片的暗金石壁。' } },
];

const events = [
  { id: 'meadow_channel', name: '姚六的弯渠', text: '近处水刚放浅，田根冒着鲜嫩的细茎。外渠口堆着几根拦水枯木。姚六从上游扛着泥耙回来，手里还攥着一张湿纸。', choices: [
    { label: '沿田根收细茎', days: 0.5, insight: 1, loot: { reed: 3 }, outcome: '姚六点点靠外渠的水根。你贴着他指的地方收拢几束。' },
    { label: '清出拦渠的枯木', days: 0.5, insight: 1, loot: { wood: 2 }, outcome: '枯木挪开，堵住的浑水沿外渠慢慢泄下去。' },
    { label: '搭手修好分水木槽', desc: '姚六：「拿两片直木顶住，两户田才都过得了水。驿里也该知道今年是谁修的。」', need: { wood: 2 }, consume: true, days: 0.5, coins: 7, insight: 2, loot: { river_field_stamp: 1 }, outcome: '修妥木槽，姚六从袖里数了几枚钱，又把自己的名字和驿站的方向写在渠契背面。' },
    { label: '将倒在堤上的野雁扶出浅水', desc: '一片芦叶下面有只湿透的雁，它只用得上一只脚。', days: 0.25, insight: 1, loot: {}, outcome: '野雁在泥边晃了两步才飞远。姚六把外渠放低半尺，好让它过堤的时候少踩一步深水。' },
  ] },
  { id: 'meadow_ruts', name: '雁脚泥垄', text: '封过的水口长出一片干泥，燕雀落时能啄开晒过的皮。再往里是一道廊一样的土窝。', choices: [
    { label: '沿土窝外面走一圈', days: 0.375, enemy: 'reed_fox', outcome: '狐从边上的草洞绕到堤背，对着鞋跟一口咬来。' },
    { label: '从矮堤看去往校潮亭的水堤', days: 0.125, insight: 1, outcome: '留守人把红布缠在木尺顶端，下一座转水亭就在那面红布旁。' },
  ] },
  { id: 'shoal_baskets', name: '灰鹭晒篮处', text: '成排的鹭草先露出细根。下游石缝接着浅滩，水有时能把晶砂冲上来。补鞋的白宜坐在两者之间，正在给旧布重新打眼。', choices: [
    { label: '收沿矶的鹭草根', days: 0.5, insight: 1, loot: { reed: 2 }, outcome: '顺着露头的草叶轻拽，根上的白泥成团落回矶脚。' },
    { label: '拨开浅石捡晶砂', days: 0.625, insight: 2, loot: { core: 1 }, outcome: '阳光照进浅滩，洗过的砂里有些灵晶能捡。' },
    { label: '问白宜为何把鞋朝岸上摆', days: 0.25, insight: 1, loot: {}, outcome: '白宜说旧渡还在用一艘商船来送补料。她年轻时进白苇滩一道缝，兜一圈鞋尖还冲着原岸。「照原的量水人来过，说那不是洞窟弯，是水又长回来。」' },
  ] },
  { id: 'ladder_drop', name: '第三级闸口', text: '最上一道木梁缠着滚来的枝条。下一阶只到膝头，最下一级才接排矿渣的水槽。钓客岑响把脚缩到了石凳上。', choices: [
    { label: '从上闸梁解下枯枝', days: 0.75, insight: 1, loot: { wood: 3 }, outcome: '细枝脱开，木梁露出服过水的深色老纹。' },
    { label: '踩中段水阶引开横脊', days: 0.375, enemy: 'river_gateback', outcome: '岑响抄起鱼篓往上让。横脊兽的倒鳍先重重扫过闸梁。' },
    { label: '下到水槽筛铁粒', guardedBy: 'river_gateback', days: 0.875, insight: 3, loot: { ore: 3 }, outcome: '旧石缝里流出沉重的粒子，倒在袖口上就能拣去浮砂。' },
    { label: '问岑响为什么还守着空水阶', days: 0.125, insight: 1, outcome: '岑响把积泥从篓脚抖出去。「旧闸坏，近岸的鱼走不上来。等别处给它看看，能回来的还是会回来。」' },
  ] },
  { id: 'willow_yard', name: '卸货后院', text: '门房把近岸见过的人分开记在两片木牌上。檐下的雨槽倾着，水冲进原本用来搁行李的石板地。', choices: [
    { label: '看门房搁在横木上的两张字牌', days: 0.125, insight: 1, loot: {}, outcome: '一张是系灯院轮值人，另一张写「封乔，白苇滩侧桩」。他替人试杆，赢了以后签个名字，往来的脚夫才敢约你过夜路。' },
    { label: '替门房补一截雨槽', desc: '门房瞧了一眼天色。「手头若有三片木，我出八钱。瓦沿漏下来还得砸醒两路来客。」', days: 0.5, need: { wood: 3 }, consume: true, coins: 8, insight: 1, loot: {}, outcome: '木槽接住檐下的水。门房用麻绳固定好，才从茶桌底下取出约定的钱。' },
  ] },
  { id: 'gauge_piles', name: '刻尺水桩', text: '水桩上方挂着一块红布。轮值人胥婉把湿纸托得很平，下方有格外深的第三截尺。水浪把晶屑推到外侧一只废铁盘上。', choices: [
    { label: '替胥婉按住湿纸的两角', days: 0.375, insight: 2, loot: { river_gauge_copy: 1 }, outcome: '你扶稳纸角。胥婉用细炭走遍刻纹，将晾干的头一份交给你。「这段等的不是涨水，是回水。旧县那边也有一份长尺。」' },
    { label: '指着末尾的凹纹问来处', desc: '最低一截的凹纹比普通水位记号更深，压得纸边有些翘。', days: 0.125, insight: 1, outcome: '胥婉把短尺掉个头给你看。那对凹纹是反潮石门接绳的座子，以前东边来人持楔校过，楔子早随测工过了渡。' },
    { label: '筛废铁盘外沿的晶砂', days: 0.625, insight: 1, loot: { core: 2 }, outcome: '细筛晃过几下，晶砂留在旧铁盘的外沿。' },
  ] },
  { id: 'slope_sieves', name: '断壁筛架', text: '坡下是矿盘，浅些的铁粒滚到筛口。石架往上一层只悬着条工作绳，绳头结里嵌着较深色的碎石。', choices: [
    { label: '推一下下层矿盘筛铁', days: 0.75, insight: 2, loot: { ore: 3 }, outcome: '铁粒滚进下筛的凹面，随手一拢，再拨掉上面一层石粉。' },
    { label: '走到上坡绳架的两根脚柱之间', days: 0.5, enemy: 'stone_badger', outcome: '石甲獾从第一根脚柱后挤出来，打了转就向你的脚踝顶。' },
    { label: '攥住工作绳筛深色碎石', guardedBy: 'stone_badger', days: 1, insight: 2, loot: { black_iron: 2 }, outcome: '剩下的深色颗粒颗颗沉手，矿工挂在筛底的布口袋刚好够接。' },
    { label: '翻看矿盘后盖的两个孔距', days: 0.25, insight: 1, loot: {}, outcome: '两个孔都量得很规矩，隔得却一宽一窄。旧矿工用这套孔距标记能折回的暗槽，和沉钟岭那堵拦路石墙上的一样。' },
  ] },
  { id: 'lantern_term', name: '夜灯廊', text: '弟子裴见抬着一条还没上油的护索。他身旁串着照夜的灯，门槛外有给过路人用的座凳。', choices: [
    { label: '问裴见这几盏灯分别给谁挂', days: 0.125, insight: 1, loot: {}, outcome: '裴见把灯逐盏翻过来。各备一盏给去旧渠的药客、沿松场的窑车和赶西岸的抬担人，再晚也有人认得自己的那盏。' },
    { label: '留两块厚兽革给护索换皮', desc: '裴见把索头伸出来，原来垫在下方的革已经磨破。', need: { hide: 2 }, consume: true, days: 0.5, insight: 1, loot: { iron_talisman: 1, ration: 2 }, outcome: '裴见换完护皮，把留给第一位搭手者的符和两份热干粮一起交到了你手上。' },
  ] },
  { id: 'undertow_bed', name: '退水石脊', text: '两股潮水渡不过中脊。你从固定引线的高处下来，能望见前方平坦的泥床和床外一腔贴着岩壁的晶砂。', choices: [
    { label: '踩过石脊接近泥床', days: 0.5, enemy: 'undertow_moundback', outcome: '沉在水下的负丘虺拱起整片泥床，侧身把你逼到石脊一端。' },
    { label: '刮下泥床正中层层结出的黑泥', afterFight: 'undertow_moundback', days: 0.625, insight: 6, loot: { heart_silt: 2 }, outcome: '最内的泥层没被退水翻动。你沿着软硬交界铲下两份伏潮息泥，分成两包封好。一包够留给验火，另一包还能别处用。' },
    { label: '绕石脊去挖侧腔灵晶', guardedBy: 'undertow_moundback', days: 1, insight: 3, loot: { core: 4 }, outcome: '夹在岩壁的晶砂一捧一捧漏进筛底。石脊旁的水来得慢，从侧腔又能一路回到高处。' },
  ] },
  { id: 'counter_bell_score', name: '信架与钟枢', text: '钟内的回声比脚步慢一拍。角落里的信架向外歪，里面夹着一叠没烂掉的厚纸。钟座外环嵌着还未磨尽的暗金断片。', choices: [
    { label: '循着槌头擦过的石面去看钟枢', days: 0.375, enemy: 'river_copper_echo', outcome: '铜影先在墙边抬臂，身子随后穿过窄槽，抡槌朝甬道正中砸来。' },
    { label: '展开信架底压着的门符抄式', afterFight: 'river_copper_echo', days: 0.375, insight: 5, loot: { gate_scroll_formula: 1 }, outcome: '纸上留着烘符交件的墨印。抄式用的是寻常木纸、草浆和少量灵晶砂，画法却只认已经走到过的阵门。' },
    { label: '挪开挂片筛钟座下积的暗金', guardedBy: 'river_copper_echo', days: 0.875, insight: 2, loot: { black_iron: 3 }, outcome: '钟脚压住的大块动不了。细些的碎片从座下落进敞开的布中。' },
    { label: '比对信架上各地驮帖的门号', days: 0.25, insight: 1, loot: {}, outcome: '折水驿、系灯院和落灯村的门号并排出现。旧信手才在各地先走一次，后面的脚力账才逐月少下去。' },
  ] },
];

export const extendSites = [
  { id: 'undertow_door', region: 'marsh', name: '反潮石门', once: [1, 2],
    afterOnceText: { 1: '旧槽里卡着新的连环楔，固定绳直通高处石阶。外侧水涌仍旧折回来，穿过洞口时能伸手扶住引线。' } },
  { id: 'marsh_pole_lesson', region: 'marsh', name: '封乔的护堤木台', once: [0, 2], protectedArena: true,
    creatures: { river_spar_captain: animal(1, 1, 5, 1) },
    creatureText: { river_spar_captain: { present: '封乔正拿杆尖朝练手台上点，不时让渔人过桥，手和眼睛都没乱。', absent: '封乔退到了灯影下。他把红布搁到台边，让手腕缓一缓再陪来客切磋。' } },
    afterOnceText: { 2: '领过试杆签，封乔把另一支短杆扶直，台角还有供照看的安全绳。' } },
  { id: 'counter_bell_door', region: 'ridge', name: '倒钟后的反声门', once: [1],
    afterOnceText: { 1: '铜簧斜抵在一宽一窄的两孔之间。石阶的第一层已经落下来，敲石声可以沿内凹的阶棱传入地下。' } },
  { id: 'ford_packet_boat', region: 'ford', name: '外桩商船', once: [0],
    afterOnceText: { 0: '船家把补好的浅船泊回外桩，舷上按乘客名单压着货票。他留了一处座板，从外港可驶去照原城。' } },
  { id: 'ford_below_steps', region: 'ford', name: '闸下无灯梯', once: [0, 2],
    creatures: { ford_lower_spirit: animal(1, 2, 11, 1) },
    creatureText: { ford_lower_spirit: { present: '下面的灯架没亮，但什么东西踢到了第二根石栏，撞得空响。', absent: '第二根石栏下面只剩脱落的湿泥，水面也安静了。' } },
  },
];

export const extendEvents = [
  { id: 'undertow_door', name: '反潮石门', text: '架在水外的石级还够落脚。苇后有堵与山一样厚的石门，门面却掉了一半，露着空槽和几股方向不同的水。', choices: [
    { label: '从外级顺水绕一圈', desc: '水外的石级一直连回岸脚，另一侧也露出水面。', days: 0.25, insight: 1, outcome: '你扶着外级走，水流把你慢慢送回原先的苇丛。第二次来水时，两股流又从石门两边换了方向。旧槽里少了扣住渡绳的物件。' },
    { label: '把倒浪楔扣进引绳槽', desc: '把施荀给的楔子对上石槽，能在逆涌时用绳找脚下的高阶。', hidden: true, need: { undertow_wedge: 1 }, days: 0.5, insight: 3, loot: { undertow_entry: 1 }, outcome: '楔子遇第二股水才扣死。你顺着绳摸到上面那截真实的石阶，发现了回潮母洞的通路。' },
    { label: '用校潮亭的抄尺比照回水', desc: '槽边几条浅痕迎着反过来的潮水，走向和抄尺最下面一截相同。', hidden: true, need: { river_gauge_copy: 1 }, days: 0.25, insight: 2, outcome: '抄尺贴到槽沿时，最末两道线只湿了内侧。这是故意留给细绳变换方向的位置，原来得用从内外两头都能扣住的楔子。' },
  ] },
  { id: 'marsh_pole_lesson', name: '封乔的护堤木台', text: '护堤人封乔常年领村里的河工。他把湿麻绳拴在矮台外，留下近处一截给练手的人扶。台边立着长杆和软头杆。', choices: [
    { label: '问封乔河里出了什么事', days: 0.125, insight: 1, outcome: '封乔指着台下被卷碎的苇筏。「大水下面有深鳞，越靠薄石门越好卧身。它不来浅岸。我守的是河工，你也别去顺深流追它。」' },
    { label: '取软头杆，请封乔试一趟手', desc: '他把麻绳放松一截。「站不稳就叫停，别把身子搭进水里。」', days: 0.25, enemy: 'river_spar_captain', outcome: '台沿仍有救人的河工。封乔换上短杆，以杆尾对着你，让了三尺。' },
    { label: '接过封乔的试杆签', desc: '封乔放下短杆，取了一支先前用红布系好的木签。', afterFight: 'river_spar_captain', days: 0.125, insight: 4, loot: { river_trial_writ: 1 }, outcome: '封乔按下手印。「折水驿认我。这签你收着，愿带急信时交他们看。」' },
  ] },
  { id: 'counter_bell_door', name: '倒钟后的反声门', text: '倒钟最矮处留着一枚没有字的石阶。石阶后有两个不同宽窄的孔，一长声一短声从里面撞回来。', choices: [
    { label: '贴着石壁敲三下', days: 0.125, insight: 1, outcome: '前两下都顺阶转回来，第三下却从宽孔里落向深处。没有东西支住这一对孔，踏上去只能绕回原阶。' },
    { label: '用听矿铜簧循孔校声', desc: '铜簧宽的一端抵在外孔，窄的一端缺了一角，斜着刚好能卡进另一道凹刻。', hidden: true, need: { echo_tuning_key: 1 }, days: 0.5, insight: 3, loot: { counter_bell_entry: 1 }, outcome: '窄孔收起第三声，宽孔先让下方石阶落稳。回声从左边变为在脚底响，通向反声钟窟。' },
  ] },
  { id: 'ford_packet_boat', name: '外桩商船', text: '闸外另有条窄船，用浮绳拴在水流之外。船家夏狄把碎木板翻个面，指给船工看舷边的缺口。', choices: [
    { label: '把补料和一程押船钱交给夏狄', desc: '夏狄说她能认外港水路。给四份木、两份寒铁补舷和船钉，再付七钱押船费，就能签收一张照原城的客票。', need: { wood: 4, ore: 2 }, consume: true, coins: -7, days: 0.75, insight: 3, loot: { ferry_manifest: 1 }, outcome: '船家换掉磨薄的舷板，拿新钉压实补木。「正渡还没开也能认外港。上了船坐里手，看见照原的三根高尺就到头了。」她签了你的船票。' },
    { label: '问船家通常从哪一道水出港', days: 0.125, insight: 1, outcome: '夏狄指着闸外靠大石的水道。主渡若开，自有官船送客。只有隔着桩圈的浅船配旧外港，不便载整批货。' },
  ] },
  { id: 'ford_below_steps', name: '闸下无灯梯', text: '一截灯梯从木排外沿伸到闸下，铁栏有两处折痕。第一根栏杆绑了小旗，准人换上短绳再往深处走。', choices: [
    { label: '从上层看灯梯到底是谁在用', days: 0.125, insight: 1, outcome: '小旗在暗处也能摸到。木牌上写着照原城曾来修拦疏口，改过水尺以后，巡闸人便很少下到第三步。' },
    { label: '沿短绳下到第二根栏杆', desc: '石阶刚够转身，一手仍能攥住绳尾。', days: 0.5, enemy: 'ford_lower_spirit', outcome: '薄灯下有道皱着的长影，听见绳扣响，猛地甩开下面两层灯架。' },
    { label: '翻看让灯影踩松的闸工号牌', afterFight: 'ford_lower_spirit', days: 0.25, insight: 3, outcome: '旧号牌背面刻着照原量水司和实际修闸的三个工名。牌还拴在栏上，退回外桩正好再踏第三步。' },
  ] },
];

const enemies = [
  { id: 'river_spar_captain', name: '护堤人封乔', tags: ['human'], tier: 6, hp: 128, atk: 25, def: 10, sparring: true,
    intents: [{ name: '软杆点踝', kind: 'attack', mult: 0.95 }, { name: '横杆拉住退处', kind: 'heavy', mult: 1.52 }, { name: '杆尾触台', kind: 'guard', mult: 1.35 }, { name: '换握压袖', kind: 'attack', mult: 1.1 }],
    insight: 8, loot: {}, desc: '他用的是软头杆，台边有人照看。握到杆子最内侧，是他要把这架势压实的时候。' },
  { id: 'river_gateback', name: '横脊闸兽', tags: ['beast', 'scaled'], tier: 2, hp: 60, atk: 13, def: 5,
    intents: [{ name: '顺水甩鳍', kind: 'attack', mult: 1.0 }, { name: '压低脊鳍', kind: 'guard', mult: 1.4 }, { name: '沿闸梁冲横', kind: 'heavy', mult: 1.55 }, { name: '贴闸游回', kind: 'attack', mult: 1.09 }],
    insight: 5, loot: { beast_meat: 3, hide: 2, qi_core: 2 }, desc: '游在最小的宽面上。后脊一倒下，尾巴便会顺闸向外冲扫。' },
  { id: 'undertow_moundback', name: '负丘虺', tags: ['beast', 'scaled'], tier: 6, hp: 115, atk: 23, def: 9,
    intents: [{ name: '抖落泥团', kind: 'attack', mult: 1.0 }, { name: '两角向内收', kind: 'guard', mult: 1.45 }, { name: '负泥冲脊', kind: 'heavy', mult: 1.62 }, { name: '掀来逆水', kind: 'drain', mult: 0.55 }, { name: '角刃扫膝', kind: 'attack', mult: 1.05 }],
    insight: 18, loot: { beast_meat: 6, hide: 4, beast_eye: 1, gold_core: 1 }, desc: '它在石门里翻泥为窝，外潮能把它送到高脊。负起整层泥之前，两角会先收成一线。' },
  { id: 'river_copper_echo', name: '屈膝铜影', tags: ['spirit', 'stoneborn'], tier: 5, hp: 100, atk: 21, def: 9,
    intents: [{ name: '槌尾贴地探步', kind: 'attack', mult: 1.0 }, { name: '半身背向钟', kind: 'guard', mult: 1.5 }, { name: '借钟背叩槌', kind: 'heavy', mult: 1.58 }, { name: '随回声踏前', kind: 'attack', mult: 1.1 }],
    insight: 13, loot: { foundation_core: 3 }, desc: '旧守门人的半副铜影。槌头顶上钟背时会借第二响落重手。' },
  { id: 'ford_lower_spirit', name: '悬梯堰影', tags: ['spirit'], tier: 4, hp: 83, atk: 18, def: 7,
    intents: [{ name: '扯旗杆试重', kind: 'attack', mult: 1.0 }, { name: '携梯翻水', kind: 'heavy', mult: 1.62 }, { name: '借堰石掩身', kind: 'guard', mult: 1.4 }, { name: '压暗灯罩', kind: 'drain', mult: 0.58 }],
    insight: 10, loot: { foundation_core: 2 }, desc: '旧堰和暗灯之间来回游。它先绷住铁栏，再甩开贴门的深水。' },
];

const quests = [
  { id: 'willow_check_dike', region: 'willow_post', name: '核对蒲湾的木渠', reveal: { item: 'river_field_stamp' },
    desc: '驿卒拿湿纸骨扇吹开折角，问新渠的试木是不是出自圩田。修木料要按渠契登记，明年才有人从两户地里各出一成。',
    need: { river_field_stamp: 1, wood: 3 }, reward: { ration: 4, salve: 1 }, coins: 14, insight: 3,
    outcome: '两道水一起记在白牌后。驿卒收下要留用的换渠木，从账里发了钱和出门的饭。' },
  { id: 'willow_night_packet', region: 'willow_post', name: '给走夜路的驿脚备货', reveal: { item: 'river_trial_writ' },
    desc: '驿卒摸到木签背面的红绳。正等次日上坡的人去送水槽护革，再给他三张整革押进货布，他可以把这笔运费结给你。',
    need: { river_trial_writ: 1, hide: 3 }, reward: { iron_talisman: 2, ration: 5 }, coins: 24, insight: 4,
    outcome: '木签挂在白牌前，三块厚革随第一人发走。驿卒从夜跑的货钱里拨出这笔，也从巡夜人的符袋取了两张。' },
];

const sects = [
  { id: 'lantern_tenders', region: 'lantern_court', name: '系灯院',
    desc: '守灯人认各段驮道的夜灯。裴见教新人照路，也请外人替他查破绳，院里另有轮值的歇处。',
    join: { need: { wood: 5, hide: 2 }, coins: 16, text: '裴见用你带来的木和护革又做两盏灯。你在一段夜路的名簿上写下自己的名字。' },
    jobs: [
      { id: 'lantern_shift', name: '交明夜要用的干灯芯', desc: '晒架下只够挂几束干灯芯，等上一班的筐空下来才接新的。', need: { reed: 6, wood: 2 }, credit: 3, coins: 10, cooldown: 7, reward: { ration: 3 }, text: '裴见擦干六束草芯，把新木夹和灯一起发下去。' },
      { id: 'lantern_heel', name: '给驮道两边换耐磨护皮', desc: '旧护皮遇雨松软，巡灯人得把脚下的扣子换一次。', need: { hide: 4, ore: 3 }, credit: 5, coins: 18, cooldown: 11, reward: { salve: 1 }, text: '旧扣交下修，新铁连着护革拿去护长绳。这班的人照收贡献。' },
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
