export const sandboxQuestsWest = [
  {
    id: 'rainproof_fire', title: '背雨石渠的烟', site: 'old_fire',
    conclusion: '去白苇滩的背雨石渠。用瓦脚给芦苇旁的下口留一道窄缝，疏开炉后高孔，再点几根木屑试烟。',
    reason: '渡工把桨晾在露天，是因为旧炉的烟常贴地扑出来。炭屑从下口进、黑痕在高孔里收拢，这两个孔原本各有用。下口让一点风进来便够，炉后那丛枯根却得拔掉。',
    clues: [
      { id: 'rainproof_ferryman', name: '渡工留的旧炉瓦脚', site: 'reed_ferryman',
        desc: '旧炉的一块瓦背有一排小脚，搁在平面上，贴地仍留着一线缝。渡工用它遮芦苇那头的下口，火苗才不往鞋上扑。',
        action: { label: '捡起替渡工压船布的旧瓦', desc: '风掀起船布，渡工按住桨。他脚边有一片带脚的残瓦。', days: 0.125,
          outcome: '渡工接过瓦，翻面压住布。「它本来搁芦苇那头的小孔下。脚朝下，留这么一道缝。」他比了比小指，「后来火倒肯烧了，烟还是呛。我人一走，瓦也带走了。」' } },
      { id: 'rainproof_soot', name: '石炉上方的烟痕', site: 'old_fire',
        desc: '黑烟的痕迹一路进了炉后高孔。洞里从上面垂进一把枯根，只有底下那截蹭得焦黑。',
        action: { label: '用苇秆探一探黑痕的尽头', desc: '黑痕爬进石缝，炉顶看不见出口。', days: 0.125,
          outcome: '苇秆进了半截就被拦住。抽出来时，秆梢挂着一缕焦根，高处也掉下几片没烧透的草叶。' } },
    ],
    experiment: {
      desc: '炉脚旁有两粒能垫瓦的扁石。炉后高孔内有枯根，石渠的背墙仍挡着一摊雨水。先拿一点刨花试手。',
      controls: [
        { id: 'intake', label: '瓦放在哪里', options: [
          { id: 'reed_open', label: '挪开瓦，让芦苇侧矮口全敞开' },
          { id: 'reed_gap', label: '垫在芦苇侧矮口，留一指宽的缝' },
          { id: 'rear', label: '把瓦平盖在芦苇侧矮口上' },
        ] },
        { id: 'outlet', label: '高孔和背墙怎么处理', options: [
          { id: 'root', label: '拔掉高孔里的枯根' },
          { id: 'stone', label: '敲开背墙上泛湿的石缝' },
        ] },
      ],
      solution: { intake: 'reed_gap', outlet: 'root' },
      misses: { intake: {
        reed_open: '一股风扑过炉底，木屑火星往外扑，你赶紧用脚踩灭。',
        rear: '刨花刚露红就灭了。揭开平瓦，连一丝贴地的风都没有。',
      }, outlet: { stone: '石缝后面存着冷雨水，一敲就滴进炉灰里。枯根还堵在高孔里，烟没有出去。' } },
      days: 0.25, insight: 3, reward: { salve: 2, wood: 3 },
      outcome: '一缕烟越过高孔，从外侧石缝钻了出来。炉边也暖了。渡工来烤桨，提来一捆柴，留下够你带走的几枝，又从桨座下取了两包松脂膏给你。',
      afterText: '石炉下口垫着一片瓦，烟从炉后的高孔出去。渡工把方才烤干的桨搁在墙上，炉边腾出了烘鞋的位置。',
    },
  },
  {
    id: 'select_millet', title: '一瓢选谷', site: 'meadow_channel',
    conclusion: '到蒲湾圩田找姚六。在里沟用少量旧粟试水，剖开沉下去的一粒和浮起来的一粒。确认了两者的区别，再筛下一季的种。',
    reason: '挂在干苇上的谷壳里早空了。折水驿留种的一盆旧粟放平才分得出轻重。姚六要给退水后露出来的田留种，整袋旧粟若都打湿，就得马上播。',
    clues: [
      { id: 'millet_husk', name: '泥垄挂住的空谷壳', site: 'meadow_ruts',
        desc: '退水后苇尖挂着一圈谷壳，掰开几粒，里头都是空的。',
        action: { label: '捻开挂在苇梢上的谷壳', desc: '一圈浅黄的东西搭在苇叶上，低头才能看清是谷壳。', days: 0.125,
          outcome: '谷壳薄得透光，里头一粒米也没有。苇叶下还有水退走时留下的泥线。' } },
      { id: 'millet_basin', name: '门房留种的小碗', site: 'willow_yard',
        desc: '门房拿旧粟试过一小碗。试出来的饱粒沉底，留种用的整袋粟还拴在梁上。',
        action: { label: '帮门房端住窗沿上的陶碗', desc: '门房两手捧着漆凳，顾不上即将滑下来的碗。', days: 0.125,
          outcome: '你把碗放平，几片空皮顺着水面聚拢，饱粒留在碗底。门房先用指甲剥开一粒，又看了看窗外的雨。「我就试这一捏。其余的，等露出田泥再泡。」' } },
    ],
    experiment: {
      desc: '上一茬粟给水淹了。姚六掂着最后一袋留种，沟里还有半尺水。他肯拿两捏试手，没答应今天就把地播完。',
      controls: [
        { id: 'water', label: '盆放在哪一边', options: [
          { id: 'quiet', label: '在内沟边盛水，把盆放平' },
          { id: 'running', label: '端到外沟对着急水冲' },
        ] },
        { id: 'scoop', label: '留哪一层的粟', options: [
          { id: 'top', label: '单挑露在水面的一层留种' },
          { id: 'bottom', label: '掐开水面和盆底各取的一粒，再留底下的一层' },
        ] },
      ],
      solution: { water: 'quiet', scoop: 'bottom' },
      misses: {
        water: { running: '新水一冲，黄壳和粟粒在盆里直打转。姚六把盆端回田坎。' },
        scoop: { top: '姚六把刚捞的几粒倒进掌心，挨个掐开，只拣出了空壳。他把干种袋口重新拴紧。' },
      },
      days: 0.375, insight: 4, reward: { millet_seed: 4, millet_grain: 3 },
      outcome: '浮的那粒掐开只有壳，沉下的满满一芯。姚六把浸过的一小把撒进已退水的近处两垄。远田的种还干着，他从那袋匀了些种子和能下锅的粟给你。',
      afterText: '里沟边的瓢还是湿的，姚六把留种袋移到坡上的干处去了。试过的那把粟已撒下近处两垄。',
    },
  },
  {
    id: 'settling_clay', title: '洗坯坡的细白泥', site: 'clay_bank',
    conclusion: '到云炉石谷的白泥洗坯坡，把浅窝里的粗泥搅匀。等底下的砂石沉下去、盆里还泛白时，把浑白的水舀进旁边的平瓦盆。等白泥沉实了再倒掉清水。',
    reason: '老窑的废坯里，硬砂全坠在厚处底下。松沟的轮辙则有两层东西：水退慢的地方沉过一层细白泥，底下另有一层粗砂。耐火泥里的砂可以先沉一次，再接上层的泥水。',
    clues: [
      { id: 'clay_vessel', name: '老窑废坯的粗砂', site: 'abandoned_kiln',
        desc: '裂成两半的废坯底部很扎手，掰开见到粗砂全在底下。靠上的泥面细得多。',
        action: { label: '拿起一片裂开的湿坯看断口', desc: '屋檐伸得长，底下那半只没进窑的泥碗一直没被雨冲散。', days: 0.125,
          outcome: '你顺着裂纹掰开湿坯。上面细得像灰，粗砂却都沉在厚碗底，手指摸过去直发涩。' } },
      { id: 'clay_ruts', name: '松沟车辙里的白泥膜', site: 'pine_hollow',
        desc: '翻车边的低车辙存过浑水。水一退，平处结了层细白泥，深处另外沉着粗砂。',
        action: { label: '捻碎路边车辙里晒干的白泥', desc: '车辙一直拖到了外边的路旁，不用走到翻车跟前。水退后，辙底白了一截。', days: 0.125,
          outcome: '白膜在指腹间碎成细粉。抠到车辙最底下，才挑出来几颗硬砂。白泥和粗砂没有混在一起。' } },
    ],
    experiment: {
      desc: '坡脚有个能拦砂的深石窝，旁边搁着一只平瓦盆。搅动后可以马上舀，也可以等一等。水浑的时候能看出里面还浮着细泥。',
      controls: [
        { id: 'time', label: '什么时候舀出泥水', options: [
          { id: 'at_once', label: '趁着砂泥全在打转，马上舀' },
          { id: 'cloudy', label: '等粗砂沉下去，水还泛白时舀' },
          { id: 'clear', label: '等水彻底清了再舀' },
        ] },
      ],
      solution: { time: 'cloudy' },
      misses: { time: {
        at_once: '瓦盆一倾，粗砂在盆底刮得沙沙响。得等它先沉回深窝。',
        clear: '倒进瓦盆的几乎全是清水。你往石窝里一探，白泥已经跟着砂沉了下去。',
      } },
      days: 0.625, insight: 4, reward: { kiln_clay: 7 },
      outcome: '瓦盆底沉下一层细泥，没有一粒硬砂。你控去清水，用洗坯坡空着的竹筐垫好粗布，把炼炉用得上的耐火泥兜起来。',
    },
  },
  {
    id: 'air_the_leaves', title: '留得住银纹的药叶', site: 'mist_shelter',
    conclusion: '回篁泽药谷的垫高脚药棚，把沾过雨的药叶摊一层，放上面通风的阴竹席。不要叠叶，也别移到日头下。',
    reason: '银纹在背阴的叶片上仍亮，曝晒过的样本已经发褐。药贩的枯叶堆内层出了水珠，两张相贴就容易烂边。要让风穿过去，不能靠日头晒硬。',
    clues: [
      { id: 'silver_leaf', name: '叶背的银纹', site: 'herb_beds',
        desc: '同样采下来的老叶，留在田槛背阴处的银纹还亮，放在朝阳端的一片褐了边。',
        action: { label: '翻看田槛两头夹着的药叶', desc: '泽医怕弄混药苗，在同一根竹槛上夹了两片剪下的老叶。', days: 0.125,
          outcome: '朝阳那片卷成细条，叶背一整圈都发褐。竹槛背阴处那片已经干了，银纹却还清楚。' } },
      { id: 'wet_packed_leaf', name: '药篓夹层里的水珠', site: 'kiln_carter',
        desc: '篓顶摊开的一层叶子已经干了，篓里两个叶面相贴的地方还是湿的。',
        action: { label: '帮赶车人摊开卸下车的药叶', desc: '石檐下那只篓还装着货。他把篓盖支起，面上的叶已经发干，里头的颜色还深。', days: 0.125,
          outcome: '上头的叶子一掰就脆。下面两张贴得紧，刚揭开就滴了一滴水，贴住的边已经起黑点。' } },
    ],
    experiment: {
      desc: '棚里上层的竹席朝阴面，风穿得过去。朝阳的木板也空着。泽医另拎来一把半干的老叶，让你晾这一小把试试。',
      controls: [
        { id: 'place', label: '在哪儿晾', options: [
          { id: 'sun', label: '放到正对日头的木板上' },
          { id: 'shade', label: '放在上层背阴的竹席上' },
        ] },
        { id: 'layers', label: '药叶怎么放', options: [
          { id: 'single', label: '只摊一层，叶边也分开' },
          { id: 'stack', label: '把药叶叠成一小摞' },
        ] },
      ],
      solution: { place: 'shade', layers: 'single' },
      misses: {
        place: { sun: '木板被晒得发烫，几片试晾的薄叶立刻曲了边。泽医把它们拿去垫药筐。' },
        layers: { stack: '最上面的药叶干了。泽医把它揭开，底下两片还黏在一起。' },
      },
      days: 0.5, insight: 5, reward: { leaf_pill: 3 },
      outcome: '泽医翻过一片晾好的药叶，亮纹还在，叶边也干透了。「下一批药能供上了。」他从架底拿了三囊已经熬好的清脉饮给你。',
    },
  },
  {
    id: 'ore_bucket_counterweight', title: '矿棚外的运砂车', site: 'winch_house',
    conclusion: '到玄砂矿脉的转盘卡住的矿棚，从屋外那台小运砂车试起。垫块松木把低处的车轮楔牢，把废铁挂到绳的远端，再松开压在砂筐边的绳扣。',
    reason: '洗矿槽边那台旧车的划痕都朝坡下，靠轮轴本身停不住车。晒盘坡的井车图画着砂筐和吊铁分在绳的两头。要先固定车身，再让吊铁抬起砂筐。',
    clues: [
      { id: 'ore_cart_rut', name: '洗矿槽边的两道轮痕', site: 'mine_tailings',
        desc: '荒着的运砂车在坡脚来回滑过，地上只有一块车轮楔形的碎木留住了后轮。',
        action: { label: '看洗矿槽边的车轮刮痕', desc: '槽旁有道浅坡，湿砂上两条长痕一起往坡脚去。', days: 0.125,
          outcome: '车走到坡脚才停，轮下只有一块扁木头。它被后轮压得翘起一角，车往下却再推不动。' } },
      { id: 'ore_counterweight', name: '筛架柱脚的车绳图', site: 'slope_sieves',
        desc: '图中绳跨过车顶木轮。近端系砂筐，远端坠铁块。铁越沉，砂筐就越往上走。',
        action: { label: '拂开柱脚的砂，看看黑漆画了什么', desc: '筛架下面那根柱子画着两道手掌宽的黑线，几笔还分得出形。', days: 0.125,
          outcome: '黑线合在一起成了张旧车图。绳子从车顶绕过木轮，筐子在这头，铁坠在那头，旁边还各画了向上和向下的短箭头。' } },
    ],
    experiment: {
      desc: '矿棚外的小车另有一副吊绳，和矿棚里的收绳转盘不相连。车虽停着，轮边细砂已经往下滚。废铁和卡住的砂筐各有一只可套绳的环。',
      controls: [
        { id: 'wheel', label: '怎么固定车轮', options: [
          { id: 'chock', label: '用松木楔住朝坡脚滚的车轮' },
          { id: 'free', label: '用手扶着车把，叫矿工松绳扣' },
        ] },
        { id: 'iron', label: '废铁挂在哪儿', options: [
          { id: 'basket', label: '系在砂筐边的环上' },
          { id: 'opposite', label: '挂在离砂筐远的那一头' },
        ] },
      ],
      solution: { wheel: 'chock', iron: 'opposite' },
      misses: {
        wheel: { free: '绳刚一松，整辆车就往坡下滑了半尺。矿工一脚抵住车轮，拉回绳扣。' },
        iron: { basket: '矿工只松开半扣，砂筐就急着往下坠。「你把它压得更沉了。」他把扣子重新勒紧。' },
      },
      fieldNeed: { wood: 1 }, days: 0.5, insight: 5, reward: { black_iron: 3, ore: 4 },
      outcome: '废铁下坠，原来卡在车架下的砂筐升了起来。矿工先收回筐里的私货，再把筛过的寒铁和暗金匀给你。松木没钉在车上，你等车停稳才顺手拿回来。',
    },
  },
  {
    id: 'snow_frozen_jar', title: '药罐上的冰绳', site: 'snow_fire',
    conclusion: '回碎云雪关的护栈火棚。把冻住的药罐放进温水盆，水只没过罐底，别浸到布塞。等罐肩的冰绳化软，先拆绳再拔塞。',
    reason: '南沟的空罐刚架上火就裂了，药罐受不住这么急的暖。雪蜥径的送药人把布塞泡湿，水顺着布渗进罐里，坏了一罐药。要借温水慢慢化冰，塞子得在水面上。',
    clues: [
      { id: 'snow_jar_wet_plug', name: '雪蜥径的湿布塞', site: 'silk_bough',
        desc: '给火棚送药的人在冰水里摔过，罐塞湿透。冷水透过布，罐里的药丸全泡坏了。',
        action: { label: '帮冰沿下的送药人拣起湿布', desc: '他坐在岩壁底下拧一块厚布，脚边倒着一只药罐。', days: 0.125,
          outcome: '「这东西塞住罐口，连灰都挡得住，可一点不挡水。」送药人把布铺平，给你看上面洇开的药汁。' } },
      { id: 'snow_jar_charred_crack', name: '雪沟灰下的裂瓮', site: 'white_ravine',
        desc: '护绳内侧有个旧火窝。碎陶片底部的裂口熏黑，罐里还黏着一块没有化完的冰。',
        action: { label: '看看护绳边旧火窝里的裂瓮', desc: '灰里露出一块陶瓮的底，捧起时，口沿的雪没有化。', days: 0.125,
          outcome: '罐底熏黑，裂纹也从那儿往上走。罐里还残着冰，原先的人把冻瓮架上火，冰还没化，陶就裂了。' } },
    ],
    experiment: {
      desc: '入夜前又送来两只药罐，冻住的麻绳裹在罐肩上，拔不出布塞。守栈人备着空罐试手。旁边有一盆手能伸进去的温水，炉上还空着半边。',
      controls: [
        { id: 'heat', label: '怎么化冰', options: [
          { id: 'flame', label: '把罐子直接架到火上' },
          { id: 'bowl', label: '把罐子放进温水盆' },
        ] },
        { id: 'level', label: '罐口放多高', options: [
          { id: 'above', label: '布塞朝上，始终高出盆沿' },
          { id: 'low', label: '把罐子横放，让罐口也浸进去' },
        ] },
      ],
      solution: { heat: 'bowl', level: 'above' },
      misses: {
        heat: { flame: '空罐底啪地裂开，守栈人用火钳把它夹回门边，又找了只闲置的罐子。' },
        level: { low: '守栈人把空罐捞起来，布塞垂着往下滴水，里头的罐壁已经湿了。' },
      },
      days: 0.5, insight: 4, reward: { resin_pill: 2, grain_pill: 2 },
      outcome: '空罐没裂，布塞也是干的。守栈人照样化开两只药罐的冰绳，从罐里各取了些温枝丸和暖谷丸给你，余下的留到雪夜煮水送服。',
    },
  },
  {
    id: 'bai_shoal_shoes', title: '白宜穿鞋下矶', site: 'shoal_baskets',
    conclusion: '去灰鹭晒篮处找白宜。把她的试鞋底槽从脚掌划向鞋边，脚踝那道皮绳朝外打结。到有碎石的浅水里试两步，看看底下的湿砂能不能被冲走。',
    reason: '校潮亭石脚的横槽接到边沿，水一过，里头就没堆泥。系灯院墙外那双鞋的旧结勒在内踝，两鞋并脚便相互蹭。鞋底槽要接到边上，绳结则要朝外。',
    clues: [
      { id: 'shoal_ridges', name: '校潮亭不存泥的横槽', site: 'gauge_piles',
        desc: '几道浅槽从石面通向边沿。上涨的水带走槽里的泥，中间封死的小坑却还贴着泥。',
        action: { label: '拿水泼一下石阶上刻过的短槽', desc: '台阶上有几道摸得到的横纹，入水的一边几乎看不见淤泥。', days: 0.125,
          outcome: '水从通到边缘的细槽往下淌，缝里几粒砂跟着走了。石面封口的凹坑只晃了晃水，泥还在里头。' } },
      { id: 'shoal_ankle_knot', name: '巡夜人鞋口的磨痕', site: 'lantern_term',
        desc: '裴见把鞋结换到外踝。原本在内侧，两脚并紧便撞在一处，石阶上险些绊倒过。',
        action: { label: '问裴见为何拆掉鞋口的结', desc: '裴见踢掉鞋边的碎屑，把旧结移到另一边。', days: 0.125,
          outcome: '「老放里头，两脚一收就会撞结。」裴见把两脚并到一起，两只鞋的内侧各有一道被磨白的短痕。' } },
    ],
    experiment: {
      desc: '白宜拿来两双新试鞋。厚皮刚缝上去，鞋底还没开槽，脚踝的两根皮绳也垂着。岸边有块平石，够她扶着试走几步。',
      controls: [
        { id: 'sole', label: '鞋底的凹槽通向哪儿', options: [
          { id: 'edge', label: '把槽划到鞋底边缘' },
          { id: 'middle', label: '槽头留在鞋底中间，边沿不断开' },
        ] },
        { id: 'knot', label: '脚踝的绳结系在哪边', options: [
          { id: 'inner', label: '系在内踝那边' },
          { id: 'outer', label: '系在外踝那边' },
        ] },
      ],
      solution: { sole: 'edge', knot: 'outer' },
      misses: {
        sole: { middle: '白宜抬脚时，浅槽里压着两粒尖砂，连水也带不出去。她用指尖把砂拨掉。' },
        knot: { inner: '白宜刚并脚站稳，两边的皮结便碰上了。她解开湿绳重新拿好。' },
      },
      days: 0.5, insight: 5, reward: { wuliang_shoal_shoes: 1 },
      outcome: '白宜沿浅水走了几步，鞋底一抬，细砂便顺着水从槽口退了出去。她站稳并了并脚，两边的绳结也碰不着。她照样做好另一双，递给你。「下浅滩时穿这双。」',
    },
  },
  {
    id: 'dyke_fog_signal', title: '雾里也能换航道', site: 'zhao_dyke_bend',
    conclusion: '去照原州青埂的两面低埂，把旗绳末端的铜片换挂到迎水侧。看到试航小船过来，先敲一下，再隔一口气敲一下，让它走外河。',
    reason: '水尺房抄着雾里用的两种船讯，连续两声是可靠岸，一声、隔一口气再一声是走外河。余节的木台上靠河的一串铜片很响，挨着垂席的一串却被湿席吸了声。',
    clues: [
      { id: 'dyke_fog_signal_ledger', name: '水尺房的雾讯纸', site: 'zhao_flood_office',
        desc: '册边夹着给新船工的雾讯：连敲两声靠岸，两声之间隔一口气便走外河。',
        action: { label: '替杜椿找船户落下的那张窄纸', desc: '水尺房墙边有两张刚浆过的纸，船户返身时还在找其中一张。', days: 0.125,
          outcome: '杜椿从册缝抽出窄纸，顺手敲笔示范。两下紧接着是靠岸，敲一下停一口气才敲第二下，是外河还有路。' } },
      { id: 'dyke_fog_signal_mat', name: '被湿席捂住的铜片', site: 'zhao_float_goods',
        desc: '从河里来的客人听得清木台外沿的铜片。贴在湿席后面的另一片敲响也只闷闷一声。',
        action: { label: '扶住余节要挂回去的湿席', desc: '席后那片铜让木架碰了两回，声音都短。', days: 0.125,
          outcome: '余节照着席子两面试敲。外沿的声脆，贴回湿席就短了，偏坐河里的客人还问刚才敲没敲。' } },
    ],
    experiment: {
      desc: '青埂的旗绳末梢留有试讯用的铜片。老堤工叫熟船沿外河北上慢慢过一趟，岸这头也可把铜片挂到晒席后的铁环。',
      controls: [
        { id: 'hang', label: '铜片挂在哪边', options: [
          { id: 'mat', label: '挂到靠晒席的铁环上' },
          { id: 'river', label: '挂到河面一侧的旗绳上' },
        ] },
        { id: 'signal', label: '给船工怎样敲讯', options: [
          { id: 'pause', label: '敲一下，停一口气，再敲一下' },
          { id: 'quick', label: '紧接着敲两下' },
        ] },
      ],
      solution: { hang: 'river', signal: 'pause' },
      misses: {
        hang: { mat: '小船划到约好的位置，船工把手拢在耳边，什么也没听见。' },
        signal: { quick: '试航的小船摆向岸这头。老堤工连忙探出身，挥手告诉船工方才是在试铃。' },
      },
      days: 0.375, insight: 5, reward: { iron_talisman: 2, grain_pill: 2 },
      outcome: '试航的小船听完第二声，船头不靠岸，顺水转进外河。老堤工把铜片绑牢，拿出省潮司备给帮工的铁障符和暖谷丸。',
    },
  },
  {
    id: 'granary_first_sack', title: '分清仓后的两袋粟', site: 'zhao_grain_ladder',
    conclusion: '去白鹤粮仓的高脚粮仓。先扎紧三角木签那袋粟，让袋上的透气布朝上，把它抬到干板上等船来接。印鸟爪的袋继续留在檐下。',
    reason: '姜婶用三角木签认当天就能下锅的粟。何绢留给家禽的碎糠才印着鸟爪。下雨时干板下也会积潮，何绢都是把留有透气布的一面翻到上方，才往这儿堆生粮。',
    clues: [
      { id: 'granary_kitchen_tag', name: '粥铺锅边的三角签', site: 'zhao_porridge_shed',
        desc: '姜婶用三角木签和粗麻线认已经筛过、可以立刻下锅的粟。有一回纸条上落了水，她依旧凭木签认出了来粮。',
        action: { label: '帮姜婶收起锅边扎过的粮绳', desc: '她把空粮袋收好，手边留着几根还没断的粗麻线。', days: 0.125,
          outcome: '姜婶从粗线中捡出一枚三角木签。「这个是能马上下锅的，字给雨泡坏了也认得。」她把湿纸和木签分开放。' } },
      { id: 'granary_feed_tag', name: '晒席边的鸟爪旧签', site: 'zhao_grain_ladder',
        desc: '刻鸟爪的袋留给家禽。何绢把别的干谷挂上离地的晒板，袋上能透气的一面总朝上。',
        action: { label: '替何绢把后门的几只空袋摊开', desc: '袋子都倒在檐下，但有一类木签满是夹在刻痕里的细糠。', days: 0.125,
          outcome: '鸟爪签的袋都落出来一把细糠。何绢把它们塞到鸡栏旁，又把新晒的谷袋抬上木板，一只只翻到透气布朝上的一面。' } },
    ],
    experiment: {
      desc: '后檐有两只搬运袋，一个木签削成三角，另一个刻着鸟爪。晒板下的土还潮。袋子一面缝了段能透气的粗布，另一面是防水的油布。',
      controls: [
        { id: 'face', label: '哪一面朝上', options: [
          { id: 'oiled', label: '让油布面朝上' },
          { id: 'airy', label: '让透气布朝上' },
        ] },
        { id: 'send', label: '先把哪袋抬上干板', options: [
          { id: 'triangle', label: '抬三角木签这一袋' },
          { id: 'bird', label: '抬鸟爪木签这一袋' },
        ] },
      ],
      solution: { face: 'airy', send: 'triangle' },
      misses: {
        face: { oiled: '板底那股潮气正往上冒，透气布挨着板面，摸起来已经发湿。何绢叫你把袋翻过来。' },
        send: { bird: '何绢掀开袋口给你看，整个布面都是碎壳。「这一袋送去喂鸡。」' },
      },
      days: 0.25, insight: 4, reward: { crystal_feast: 2, millet_grain: 4 },
      outcome: '何绢拆看一小撮粟，没混进糠。她把待发的粮袋抬上干板，从屋里拿出两包前一船捎来的粟香封岩肉，又从自家留的粟里给你匀了一把。',
    },
  },
  {
    id: 'frog_training_float', title: '漂在蛙背塘的药罐', site: 'zhao_frog_shelf',
    conclusion: '去蛙背塘的浮萍边浅水窝。只沿外圈石头走，从上游把短竹竿斜伸进漂罐下，别伸手朝水心捞。让小股水把罐子送到杆边，再挑住罐柄收回来。',
    reason: '守尺观失罐的弟子说，罐子拴着松木浮子，竹竿从下面撑，比硬抓湿釉稳。浅水窝的浮萍过了外圈石才往水心一转，站在上游用杆拦在转弯前，罐子就会靠过来。',
    clues: [
      { id: 'frog_training_reed', name: '守尺观丢药罐的弟子', site: 'zhao_bamboo_duel',
        desc: '弟子在蛙背塘丢了个拴松木的药罐。罐面湿得打滑，短竹竿从下托，才能碰到下面的把手。',
        action: { label: '问墙边的弟子在缠什么罐绳', desc: '他只剩一截松木浮子，来回试了几种能拴住罐把的结。', days: 0.125,
          outcome: '「另一个药罐昨儿给浮萍带进塘了。沾水的釉面揪不住，靠竹竿托一下，底下露着的把手倒能挑起来。」弟子把余下的浮子重新扎住。' } },
      { id: 'frog_quiet_eddy', name: '浅水窝的浮萍圈', site: 'zhao_frog_shelf',
        desc: '外圈石上游一股水贴着石边走，到了低石缺口再折向水心。漂过水窝的东西都会先挨一遍外石。',
        action: { label: '站在岸上看浮萍绕低石漂过', desc: '浅水窝从岸边就能看清流向，不用靠近守在水里的兽。', days: 0.125,
          outcome: '一片浮萍擦过外圈两块低石，转到下游石缝才斜进塘心。靠岸上游的位置伸出竹竿，便能截到。' } },
    ],
    experiment: {
      desc: '拴了松木的小陶罐混在浮萍中，绕低石一遍遍打转。那个弟子正在远处沿塘找，短竹竿丢在这边的岸草里。沿外圈能找到落脚处，别往泥色发暗的水心凑。',
      controls: [
        { id: 'spot', label: '站到哪里', options: [
          { id: 'centre', label: '走到下游缺口边的那块石头' },
          { id: 'upstream', label: '踩外圈靠上游的石头' },
        ] },
        { id: 'grip', label: '怎么取罐', options: [
          { id: 'under', label: '用短竹竿从下面挑住罐把' },
          { id: 'surface', label: '伸手去抓湿罐身' },
        ] },
      ],
      solution: { spot: 'upstream', grip: 'under' },
      misses: {
        spot: { centre: '罐子在外石那边转了一回，水心这头只漂来一蓬碎草。你没再往深处走。' },
        grip: { surface: '你指尖刚碰到罐身，湿釉就滑了出去。木浮子带着罐子又转回去了。' },
      },
      days: 0.375, insight: 5, reward: { heart_pill: 2, sense_powder: 2 },
      outcome: '竹竿挑起罐把，松木浮子也跟着上岸。弟子顺着岸跑来，一眼认出他打的绳结。他把封好的养心丸和凝神散匀了一半给你，合上罐盖抱回观里。',
    },
  },
  {
    id: 'mill_dry_workbench', title: '磨台下的干门', site: 'zhao_old_wheel',
    conclusion: '去缺轮磨台的横卧半轮旁，从磨轮朝向岸的一侧找矮门。让木楔的宽面贴着门框底槽，再把松垮的门环往岸上抬，试试看能不能开门。',
    reason: '水栈的撤磨清册画了干工房的岸门，记着门环下断掉的宽木榫。磨台上的门缝和底槽都在朝岸那面，落下的门环只在这里磨出一条亮痕。木楔要横着垫，才托得住门环。',
    clues: [
      { id: 'mill_shipping_roll', name: '水栈撤磨的清册', site: 'zhao_float_goods',
        desc: '清册画了小工房的岸门。搬磨人从岸边抬工具，门环下的宽木榫裂了，最后一捆没来得及拿。',
        action: { label: '给余节的清册压住被风吹起的纸角', desc: '余节在核一份早年的领货册，纸上还画着磨房内外两道门。', days: 0.125,
          outcome: '余节点了点用炭笔画的小门。「磨工走的是岸上这扇。环下那块宽木榫断了，最后一趟没进门。闲那么久了，你要是能把门推开，里面用得上的旧料就带走。」' } },
      { id: 'mill_door_groove', name: '靠岸石脚下磨亮的槽', site: 'zhao_old_wheel',
        desc: '靠岸的石脚有一扇贴着砂色的矮门。松环垂下去碰到门框底部，只能沿着半掌宽的槽往外抬。',
        action: { label: '扫去靠岸石脚粘着的湿沙', desc: '半轮岸边伸出一点锈红的铁，沙盖住了它压着的地方。', days: 0.125,
          outcome: '铁环一拉就垂到门底。紧挨底框有个宽槽，让环从正中往上走，槽里短短两寸亮得发白。' } },
    ],
    experiment: {
      desc: '靠岸处是门缝，引水槽那面只露出长方的石口。矮门的环一直滑到地上。附近有翻磨轮留下的木楔，宽面刚好能托住环的底边。',
      controls: [
        { id: 'wedge', label: '木楔怎么放', options: [
          { id: 'point', label: '用木楔尖插进湿的引水口' },
          { id: 'flat', label: '把木楔宽面垫在岸门门框底下' },
        ] },
        { id: 'ring', label: '门环往哪里抬', options: [
          { id: 'land', label: '沿门缝往岸上抬，再向外拉' },
          { id: 'water', label: '往引水槽那头横着拽' },
        ] },
      ],
      solution: { wedge: 'flat', ring: 'land' },
      misses: {
        wedge: { point: '水口底下什么也没勾住。木楔刚探进去，水就推着它往外漂。' },
        ring: { water: '铁环斜着咬紧了石缝，你扶回原位才把环松开。' },
      },
      days: 0.5, insight: 5, reward: { zhao_mill_door_pin: 1 },
      outcome: '木楔顶起门环，矮门向岸上翻开，里面有段干石梯。门后原样拴着一截插门用的短木，你把它托住，往后能循这道矮门下去看旧磨工的干工房。',
      afterText: '半扇磨轮还是歪在屋脚。朝岸的矮门开了一人宽，门下露出几级干石梯。磨轮背后的木牌仍压在原处。',
    },
  },
];

export const sandboxQuestsWestExtras = {
  items: [
    { id: 'wuliang_shoal_shoes', name: '护脚皮履', kind: 'gear', price: 0, sell: 5, oneOfAKind: true,
      desc: '白宜在草鞋外缝了一圈厚皮。鞋底从正中开槽通向边沿，脚踝的皮绳扎在外边。' },
    { id: 'zhao_mill_door_pin', name: '干工房的门插', kind: 'key', price: 0, sell: 0,
      desc: '缺轮磨台岸门后拴着的短木，插上能撑住门，不会让厚门板压回石梯。' },
  ],
  gear: [
    { id: 'wuliang_shoal_shoes', slot: 'boots', tier: 0, durability: 30, repair: 5, field: { gatherPadding: 2 },
      entry: '白宜编的厚底皮履。采东西时滑倒或碰上尖石，厚底和护脚皮能挡下些擦伤。' },
  ],
  enemies: [
    { id: 'zhao_mill_stone_rat', name: '磨房石鼠', tier: 2, hp: 44, atk: 12, def: 3, insight: 3,
      tags: ['beast', 'furred'], dodge: 0.08,
      desc: '这石鼠长得有小狗大。脚爪抓得住石壁，会沿墙躲开正面的打击。尾巴一收，两只后腿踩紧墙边，就要蹬过来咬人。',
      intents: [
        { name: '贴墙扑咬小腿', kind: 'attack', mult: 1 },
        { name: '沿碎石墙蹿开', kind: 'dodge' },
        { name: '后脚蹬墙，猛扑下来', kind: 'heavy', mult: 1.48 },
      ],
      loot: { beast_meat: 2, qi_core: 1 },
      chanceLoot: { hide: { count: 1, chance: 0.6 } },
    },
  ],
  sites: [
    { id: 'zhao_mill_dry_workroom', region: 'jade_mill', name: '岸门下的干工房',
      reveal: { item: 'zhao_mill_door_pin' }, once: [0],
      afterOnceText: { 0: '石柜的隔板已经掀起，上头搁着拆下来的麻绳。灰雾从柜后的窄缝飘进屋，隔着石壁，水声听来很轻。' },
      creatures: { zhao_mill_stone_rat: { start: 1, cap: 1, interval: 8, growth: 1, fixedPopulation: true } },
      creatureText: { zhao_mill_stone_rat: {
        present: '地上滚着几粒新咬开的松子，墙上足印绕到工作台背后。',
        absent: '工作台背后没有动静，旧爪印上已经落了一层灰。',
      } },
    },
  ],
  events: [
    { id: 'zhao_mill_dry_workroom', name: '岸门下的干工房',
      text: '短门插撑着头顶的石门，七级石梯下去，是间没被水淹过的小屋。工作台上画着卸磨轮的办法，门边的石柜里还有一包油布裹好的工具，柜后窄缝飘进一线灰雾。',
      choices: [
        { label: '打开石柜，看那包旧工具', desc: '粗麻绳上的半枚封印同余节那张撤磨册落下的印一样。', days: 0.25, stay: true,
          loot: { ore: 6, hard_scale: 3 },
          outcome: '旧木柄糟得提不起来。油布里的几片磨面厚甲和没生锈的寒铁却还能用，你把好料从腐断的绳里挑出来。' },
        { label: '绕到工作台背后，找咬开松子的东西', desc: '墙缝里的动静在工作台那头。只开石柜，从门边伸手就够得着。',
          days: 0.125, enemy: 'zhao_mill_stone_rat',
          outcome: '你刚绕到工作台背面，一只石鼠便沿墙蹿来。它撑住前爪，转头贴近你的脚边。' },
      ] },
  ],
};
