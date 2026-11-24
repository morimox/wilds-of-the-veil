import { riverContent, extendSites, extendEvents } from './river-content.mjs';
import { zhaoContent } from './zhao-content.mjs';
import { sandContent } from './sand-content.mjs';
import { lateContent } from './late-content.mjs';
import { puzzleContent } from './puzzle-content.mjs';
import { tournamentContent, tournamentData } from './tournament.mjs';
import { ferryContent } from './ferry-content.mjs';
import { hazardContent } from './hazards.mjs';
import { caravanContent } from './caravan-content.mjs';
import { employersContent } from './employers-content.mjs';
import { borderContent } from './border-content.mjs';
import { innerStyleContent } from './inner-style-content.mjs';
import { banditContent } from './bandit-content.mjs';
import { banditTaleContent } from './bandit-tale-content.mjs';
import { huntMaterialContent } from './hunt-materials.mjs';
import { dykeArmoryContent } from './dyke-armory.mjs';
import { ridgeArmoryContent } from './ridge-armory.mjs';
import { explorerKitContent } from './explorer-kit.mjs';
import { encyclopediaContent } from './encyclopedia-content.mjs';

const realms = [
  { id: 0, name: '炼气初期', hp: 30, qi: 12, atk: 8, def: 2, perception: 10, insight: 0, cost: 0, need: {}, pressure: 1, days: 0 },
  { id: 1, name: '炼气中期', hp: 35, qi: 15, atk: 9, def: 3, perception: 12, insight: 14, practice: 5, cost: 18, need: { reed: 6, hide: 2, qi_core: 5 }, pressure: 0.97, days: 1.5 },
  { id: 2, name: '炼气后期', hp: 42, qi: 20, atk: 10, def: 4, perception: 14, insight: 36, practice: 9, cost: 36, need: { ore: 5, core: 3, reed: 6, qi_core: 12 }, pressure: 0.94, days: 2.5 },
  { id: 3, name: '筑基初期', hp: 50, qi: 26, atk: 11, def: 5, perception: 16, insight: 70, practice: 14, cost: 18,
    need: { foundation_pill: 1 }, pressure: 0.90, days: 4 },
];

const items = [
  { id: 'battle_sinew', name: '坚韧兽筋', kind: 'material', price: 0, sell: 0, desc: '从筋骨已经长足的妖兽身上取下。晒干后缠住柄、缝住护具，吃足力也不容易迸开。' },
  { id: 'ration', name: '干粮', kind: 'food', price: 3, sell: 1, desc: '用油纸分包的粮饼，饿了就拆一包吃。' },
  { id: 'wood', name: '松木', kind: 'material', price: 3, sell: 1, desc: '干透的松枝和松片。带脂的能引火，削去树皮后可做杆、柄和屋里的架子。' },
  { id: 'reed', name: '灵草', kind: 'material', price: 6, sell: 2, desc: '滩边采的白苇芯或内山长的银脉叶，拣紧实的留下。煎药、炼丹和育苗都用得上。' },
  { id: 'hide', name: '兽革', kind: 'material', price: 0, sell: 3, desc: '从妖兽身上取下的皮，也包括雪蜥换下的厚皮。能做护甲、皮绳和弓弦，也可以卖给收皮商。' },
  { id: 'beast_meat', name: '生兽肉', kind: 'material', price: 0, sell: 0, desc: '刚剖下来的兽肉。到能生火的灶边煮透，才能当行粮。' },
  { id: 'qi_core', name: '炼气期妖丹', kind: 'material', price: 0, sell: 7, desc: '从炼气妖兽或精怪身上取的丹核。散修借它冲开经脉，丹师也要用一批来稳住筑基丹的炉火。' },
  { id: 'foundation_core', name: '筑基期妖丹', kind: 'material', price: 0, sell: 21, desc: '从筑基妖物身上取的硬珠。稳固气脉、炼结丹散和铸高阶兵刃都用得上。' },
  { id: 'beast_eye', name: '妖目', kind: 'material', price: 0, sell: 0, desc: '妖兽的眼珠，离体后还有灵力。能入药，也能做成帮助稳住气息的饰物。' },
  { id: 'qiankun_pattern', name: '旧行商的袋样', kind: 'key', price: 0, sell: 0,
    desc: '一块照着旧乾坤袋裁下的样布。一边留了个朝里翻的袋角，可以拿给落灯村的皮匠看。' },
  { id: 'qiankun_fold_pattern', name: '鸣沙的叠缝样', kind: 'key', price: 0, sell: 0,
    desc: '两片样布缝在一处，两个袋口上下错开。落灯村的皮匠能照着缝出双层乾坤袋。' },
  { id: 'qiankun_inner_pattern', name: '旧布袋的底纹', kind: 'key', price: 0, sell: 0,
    desc: '铜轮下找到的旧布样。顺着底边的针脚捋一圈，能摸到埋在折缝里的线头。可拿给落灯村的皮匠看。' },
  { id: 'qiankun_bag', name: '乾坤袋', kind: 'container', price: 0, sell: 0, keepOnFall: true,
    desc: '一只系在行囊里的小布袋。解开细绳，能从另一边深处挪出装进去的东西。' },
  { id: 'qiankun_fold_bag', name: '双层乾坤袋', kind: 'container', price: 0, sell: 0, keepOnFall: true,
    desc: '小袋里两层布各自向深处叠开。布外看着薄，能装下比寻常乾坤袋更多的行李。' },
  { id: 'qiankun_deep_bag', name: '深底乾坤袋', kind: 'container', price: 0, sell: 0, keepOnFall: true,
    desc: '从袋底向上缝了两道线。把一整匣铁料送进去，袋面只轻轻往下坠一下。' },
  { id: 'meat_broth', name: '山炉肉汤', kind: 'food', price: 0, sell: 0, desc: '装在粗陶罐里的一碗浓汤，比干粮耐饿，还能缓一缓轻伤。' },
  { id: 'herb_stew', name: '灵草炖肉', kind: 'food', price: 0, sell: 0, desc: '用灵草慢煨到酥烂的兽肉，适合走一趟山路再吃。' },
  { id: 'crystal_feast', name: '禾香封肉', kind: 'food', price: 0, sell: 0, desc: '炖好的兽肉裹上熟粟封好。够顶远路的饥饿，也能补回一些气血。' },
  { id: 'ore', name: '寒铁', kind: 'material', price: 0, sell: 5, desc: '沉钟岭最常见的铁料，断面摸着冰凉。炉盖、铁具和兵刃都能用它。' },
  { id: 'core', name: '灵晶', kind: 'material', price: 14, sell: 5, desc: '有细亮纹的晶石。能从潮床或石缝里筛出细粒，硬些的可镶入兵刃。' },
  { id: 'seal', name: '镇渡印', kind: 'object', price: 0, sell: 0, keepOnFall: true, desc: '闭潮渡旧闸上的渡印，落灯村有人认得它。' },
  { id: 'lost_basket', name: '落水药篓', kind: 'object', price: 0, sell: 0, keepOnFall: true, desc: '篓把缠着一圈青绳，落灯村药房的篓子都有这个记号。篓口扣得很紧，里面还透着药香。' },
  { id: 'ridge_rubbing', name: '沉钟岭路图', kind: 'key', price: 0, sell: 0, desc: '画着白苇滩北面进山的路，循着路上的倒钟就能到沉钟岭。' },
  { id: 'ford_chart', name: '旧渡水图', kind: 'key', price: 0, sell: 0, desc: '上面画着废矿与旧渡之间的水路，尚可辨认。' },
  { id: 'echo_note', name: '茶棚木板上的掌谱', kind: 'key', price: 0, sell: 0, desc: '一块烤黑的薄木板。画里的人伸手撑住石壁，贴石的那只手露出指甲。手边还有一圈快被烟痕遮住的墨线。' },
  { id: 'tide_note', name: '闸工的潮牌', kind: 'key', price: 0, sell: 0, desc: '值守闸门时用的潮牌，边缘刻着涨水与落水的时刻。' },
  { id: 'kiln_shard', name: '反字残瓦', kind: 'key', price: 0, sell: 0, desc: '瓦上反着刻了「敲两下，停一停」。刻字的那面干净，没字的背面却被火熏黑了。瓦角还有一道像是被铃碰出来的弯痕。' },
  { id: 'bell_clapper', name: '带结的铃舌', kind: 'key', price: 0, sell: 0, desc: '铃肚里敲得响的小铁片，挂它的细绳打着船工常用的结。绳圈被弯钩磨过，里面还蹭着一层白盐。' },
  { id: 'backwash_mark', name: '倒潮刻样', kind: 'key', price: 0, sell: 0, desc: '从船底夹缝里取出的薄铜片。刻线朝上游拐，一边沾泥，另一边被水冲亮。发亮的一边留着几道并排的水痕。' },
  { id: 'secret_pass', name: '伏流路引', kind: 'key', price: 0, sell: 0, desc: '用三件旧物找出的水路。水里的灯影往上游漂时，循着它走可以到回灯埠。' },
  { id: 'reed_lines', name: '药僮的水线图', kind: 'key', price: 0, sell: 0, desc: '两张图都画了露出水的石头和第三根木桩。涨水时，水绕过石背流向水眼。退水时，那股水改朝出水口流。' },
  { id: 'oar_mark', name: '旧桨上的靠岸图', kind: 'key', price: 0, sell: 0, desc: '桨背刻着三处系船点。外滩和桩边的缆线绷直，绕到露石背后的那一条却松松搭着。断桅在第三处桩外。' },
  { id: 'eddy_note', name: '回汊图', kind: 'key', price: 0, sell: 0, desc: '涨水时的回流贴着石脚走。苇秆从主流绕进这股浅水，还会漂回原先的水眼。' },
  { id: 'stone_rubbing', name: '浅石洞的回声', kind: 'key', price: 0, sell: 0, desc: '破铃碰到洞口的石壁时先响了一声，片刻后石壁深处又响一声。第二声响过，才有石屑落下来。' },
  { id: 'echo_method', name: '返声行气稿', kind: 'key', price: 0, sell: 0, desc: '你在石洞练成的运气法。手掌贴住石壁，等两阵响声之间的那一口气。' },
  { id: 'lamp_sketch', name: '灯夫手势', kind: 'key', price: 0, sell: 0, reveal: { item: 'secret_pass' }, desc: '灯夫两手拢在灯火外，迎风的那只手往斜下方一撇，火苗便站稳了。' },
  { id: 'millet_seed', name: '早粟种', kind: 'material', price: 4, sell: 1, desc: '颗粒小，晒得干透，布袋底还沾着一点田泥。' },
  { id: 'millet_grain', name: '新收的谷子', kind: 'material', price: 0, sell: 1, desc: '外壳一捻就开，里面是浅黄的粟米。' },
  { id: 'kiln_clay', name: '耐火泥', kind: 'material', price: 0, sell: 3, desc: '云炉石谷里的灰白硬泥，干透以后不容易裂。' },
  { id: 'black_iron', name: '暗金', kind: 'material', price: 0, sell: 7, desc: '细密黑砂包着的深金色矿粒。淘净后能加固器件，也是炉火里罕见的引药料。' },
  { id: 'pine_pass', name: '松场驮道图', kind: 'key', price: 0, sell: 0, desc: '图上从落灯村北坡画出一条旧驮道，沿岭脚直通松场。断桥过后，三棵青松并排立着。' },
  { id: 'kiln_tracks', name: '窑车辙样', kind: 'key', price: 0, sell: 0, desc: '窑车走的窄道。图上两道车轮印在松树根旁一转，就出了山坳。' },
  { id: 'herb_tie', name: '篁泽的药篓绳', kind: 'key', price: 0, sell: 0, desc: '赶车人从旧药篓上解下的绑绳。绳结旁缝着一小块丝布，画着去药谷要过的竹桥。' },
  { id: 'mine_guide', name: '玄砂引矿签', kind: 'key', price: 0, sell: 0, desc: '药谷换来的窄木签。照着墨线，可以从药谷过石槽，也可以从沉钟岭走运矿的窄道。两条路都接到冷井的外梯。' },
  { id: 'snow_token', name: '翻雪关的栈牌', kind: 'key', price: 0, sell: 0, desc: '照着栈牌刻出的踏脚位，能从矿山背后的巡道避开雪崩沟。' },
  { id: 'sky_cord', name: '雪关的三结路绳', kind: 'key', price: 0, sell: 0, desc: '一根打了三个结的短绳。雪关的三条木梁各系着一段路标，绳上的结能和它们依次对上。' },
  { id: 'snow_escort_note', name: '画有木梯的栈道图', kind: 'key', price: 0, sell: 0, desc: '守栈人用红笔圈出矮墙后的一架木梯。火棚对面的栈道被雪堵住时，可从那架梯上山。' },
  { id: 'snow_escort_done', name: '铜栓拓印', kind: 'key', price: 0, sell: 0, desc: '薄纸上拓着高处第三根横梁上的铜扣。守栈人留下这张纸，好在棚里照着做一把新的。' },
  { id: 'pine_ledge_note', name: '松崖背阴旧址', kind: 'key', price: 0, sell: 0, desc: '木贩旧账单背面画了崖边的缺口。过松场后沿背阴石壁才认得出。' },
  { id: 'arrow_pattern', name: '包铁箭样', kind: 'key', price: 0, sell: 0, desc: '一根剖开的窄铁箭。箭头外沿的一点折角攒住了刺进甲缝的力。' },
  { id: 'kiln_manual', name: '窑匠火候牌', kind: 'key', price: 0, sell: 0, desc: '低火、闷火和开炉的时刻刻在同一块石牌上。灰线下还有落灯丹师安蒲的药印。' },
  { id: 'herb_press', name: '泽医捣药板', kind: 'key', price: 0, sell: 0, desc: '旧木板上两凹一凸，中间的药槽压得浅。贴背有张验药用的小札。' },
  { id: 'clinic_note', name: '药僮的验膏小札', kind: 'key', price: 0, sell: 0, desc: '前页画的是薄薄涂开药膏的样子。小札末尾留着丹师安蒲的药印，纸上还有药僮替你写下的问候。' },
  { id: 'ember_fold', name: '石炉沿的折纸样', kind: 'key', price: 0, sell: 0, desc: '炉边压了一张没有烧尽的纸。三层纸兜住薄亮的一线松枝灰。' },
  { id: 'vein_pattern', name: '两寸机臂铁样', kind: 'key', price: 0, sell: 0, desc: '玄砂矿工修收绳的转盘时用过的铁把手。短柄上的凸头能卡住重物，边上的刻度也能用来找长兵器的重心。' },
  { id: 'meridian_etching', name: '天衡石梁的刻圈', kind: 'key', price: 0, sell: 0, desc: '观星石梁上的拓痕。三道偏圈连成中线，一侧浅刻指明剑柄和刃口该如何配重。' },
  { id: 'axis_tuning', name: '落影调枢图', kind: 'key', price: 0, sell: 0, desc: '在石台上试出来的转轴尺寸图。按图能把弓上的弹片和护脉玉佩调稳。' },
  { id: 'blade_template', name: '厚脊剑坯样', kind: 'key', price: 0, sell: 0, desc: '旧矿工藏在沟里的半截剑身，还没打好。剑背上特意留下了两道高低不同的锤痕。' },
  { id: 'plate_lacing', name: '挑夫的叠片缝样', kind: 'key', price: 0, sell: 0, desc: '从货车护板上取下的接法样片。两股绳从背后绕过去，撞击便由两块板一起承受。' },
  { id: 'spear_joint', name: '闸把的分水榫', kind: 'key', price: 0, sell: 0, desc: '听潮人从旧枪头上取下的接头。窄的一端容易插紧，水猛一下冲过来，接头也不会松。' },
  { id: 'gate_buckles', name: '旧排的护甲扣', kind: 'key', price: 0, sell: 0, desc: '一排戴在拉潮工身上的带扣。受冲时两侧会卡进腰后的甲层。' },
  { id: 'bow_stave', name: '松架上的试弓木', kind: 'key', price: 0, sell: 0, desc: '微弯的松木条。上面刻着量弓弦长短的线，弓背还留了一道嵌皮条的槽。' },
  { id: 'resin_tamper', name: '守炉杖的样柄', kind: 'key', price: 0, sell: 0, desc: '窑匠留在墙边的木杖样品。松脂从底下灌进去，杖头专门刻了个能聚气的小缺口。' },
  { id: 'pass_seam', name: '护栈人的夹皮缝样', kind: 'key', price: 0, sell: 0, desc: '两层布里面夹着兽皮，缝线全藏在里侧。雪水浸进外层也碰不到内衬。' },
  { id: 'hook_iron', name: '断雪戟的回钩样', kind: 'key', price: 0, sell: 0, desc: '从栈道边捡来的半截铁钩。钩尖向内弯，来兵斜着砍过来时，能用弯处卡住。' },
  { id: 'loom_tack', name: '玉片披甲的接丝账', kind: 'key', price: 0, sell: 0, desc: '石台制工留下的木账片。画着软丝穿过两层护玉时，哪一段该拉紧。' },
  { id: 'cloud_tip', name: '晶镞轻重样', kind: 'key', price: 0, sell: 0, desc: '几枚灵晶做的箭头夹在旧木板上。旁边刻着箭头的轻重，说明了怎样配箭杆。' },
  { id: 'sky_seal', name: '镜门衡印', kind: 'key', price: 0, sell: 0, desc: '石台守灵握过的衡印。印面轻磨，可见一道两头接山脊的水线。' },
  { id: 'furnace_sketch', name: '丹炉风口图', kind: 'key', price: 0, sell: 0, desc: '安蒲在纸上画出三道进风口，最靠下的一道用斜口泥砖垫着。' },
  { id: 'formula_qi', name: '回气散丹方', kind: 'key', price: 0, sell: 0, desc: '灵草须焙干再碾，快火散掉生苦后立刻翻灰。' },
  { id: 'formula_grain', name: '暖谷丸丹方', kind: 'key', price: 0, sell: 0, desc: '干粮浸软之后分团，两边火口只留靠里的那一孔。' },
  { id: 'formula_focus', name: '定息丹方', kind: 'key', price: 0, sell: 0, desc: '草汁与微火要同时入盏。松木快烧完时从边上刮下结露。' },
  { id: 'formula_resin', name: '温枝丸丹方', kind: 'key', price: 0, sell: 0, desc: '只用松木最靠外的嫩脂。开炉前先用湿草熄主火。' },
  { id: 'formula_sense', name: '凝神散丹方', kind: 'key', price: 0, sell: 0, desc: '先筛去灵晶的硬粒。灵草焙干，拌进石粉后再过细筛。' },
  { id: 'formula_detox', name: '清露丸丹方', kind: 'key', price: 0, sell: 0, desc: '熟药过清叶，吹开浮灰，留下盏壁上一道没有药涩的露。' },
  { id: 'formula_heal', name: '合络丹丹方', kind: 'key', price: 0, sell: 0, desc: '药团放在新绷的兽革上收汁。每一次收边都要换掉浸透的皮。' },
  { id: 'formula_tide', name: '济潮丹丹方', kind: 'key', price: 0, sell: 0, desc: '捞洗潮床的灵晶，退水时下药。窄炉缝上升的白气可以判火候。' },
  { id: 'formula_leaf', name: '清脉饮丹方', kind: 'key', price: 0, sell: 0, desc: '篁泽药匣里的煎药札。药汁沸后要将长、短木槽依次架进火口。' },
  { id: 'formula_heart', name: '养心丸丹方', kind: 'key', price: 0, sell: 0, desc: '泽医照滴水图抄的方子。罐口各引一条细槽，两边药汁要滴得一样快。' },
  { id: 'formula_jade', name: '照心露丹方', kind: 'key', price: 0, sell: 0, desc: '温火焙灵晶，白露顺斜槽流入底盏。火心太大就没有露。' },
  { id: 'formula_foundation', name: '筑基丹方', kind: 'key', price: 0, sell: 0, desc: '安蒲重新排定的三篇合方。两次短火分开入料，第三道长火得靠封炉药引维持。' },
  { id: 'foundation_ledger', name: '焦痕丹窑账页', kind: 'key', price: 0, sell: 0, desc: '半页熏焦的取还账。镇上丹师安蒲的名字旁压着三枚缺了一角的印。' },
  { id: 'foundation_letter', name: '背钟亭借卷帖', kind: 'key', price: 0, sell: 0, desc: '安蒲盖了印的借书信。背面画着沉钟岭倒钟后面的试剑亭，也写了比剑前怎么行礼。' },
  { id: 'foundation_spar_mark', name: '守卷剑客的试剑印', kind: 'key', price: 0, sell: 0, desc: '守卷人在借卷帖旁按下墨印。缺印的一角能和旧账拼上。' },
  { id: 'foundation_delivery', name: '丹窑移灰牌', kind: 'key', price: 0, sell: 0, desc: '安蒲换来的木牌。拿它能打开云炉石谷后烟道的小门，进旧丹窑内部。' },
  { id: 'foundation_kiln_seal', name: '丹窑旧印半片', kind: 'key', price: 0, sell: 0, desc: '从旧丹窑挡板的浅槽里取出的半枚印。擦开灰，上面的花纹和账页上的第二枚残印对得上。' },
  { id: 'foundation_snow_order', name: '封石之约', kind: 'key', price: 0, sell: 0, desc: '安蒲用两枚旧印合成的信帖。带它去碎云雪关的短桥外，便能看见验药室的门缝。' },
  { id: 'foundation_warden_proof', name: '验药室的留火印', kind: 'key', price: 0, sell: 0, desc: '通过护炉人的考验后拿到的信物。印背上的线条能跟前两枚印接在一起。' },
  { id: 'foundation_charge', name: '封炉药引', kind: 'key', price: 0, sell: 0, desc: '安蒲依三印验出的唯一一剂引火料，在炉里会与其余材料一并耗尽。' },
  { id: 'foundation_pill', name: '筑基丹', kind: 'key', price: 0, sell: 0, breakthrough: true, desc: '三火合炼所得的一丸。闭关突破时服用，药力会随吐纳逐步散入经脉。' },
  { id: 'reed_arrow', name: '削苇箭', kind: 'ammo', price: 2, sell: 1, desc: '苇秆做的箭杆很轻。木箭头扎不穿厚甲。' },
  { id: 'iron_arrow', name: '包铁箭', kind: 'ammo', price: 0, sell: 2, desc: '箭头包着一层薄铁，容易扎进鳞片之间。' },
  { id: 'black_bolt', name: '暗金短矢', kind: 'ammo', price: 0, sell: 2, desc: '比寻常的箭短，重量多在箭头。只能用暗金机弩射出。' },
  { id: 'cloud_arrow', name: '凝光箭', kind: 'ammo', price: 0, sell: 5, desc: '灵晶做的箭头在阳光下略透亮，敲上石头有一声脆响。' },

  { id: 'cudgel', name: '枣木杖', kind: 'gear', price: 5, sell: 2, desc: '行路探泥和近身抵挡都用得上。' },
  { id: 'knife', name: '割苇短刀', kind: 'gear', price: 16, sell: 7, reveal: { item: 'reed' }, desc: '巡滩人的短刀，轻便，刃口薄。' },
  { id: 'split_axe', name: '劈柴小钺', kind: 'gear', price: 23, sell: 9, desc: '一把木工用的小斧。斧刃厚，磕坏了也不难磨好。' },
  { id: 'short_spear', name: '摊市短矛', kind: 'gear', price: 27, sell: 10, desc: '重心挨着手，矛尾可顺势架一下来招。' },
  { id: 'hook_blade', name: '渡口钩刃', kind: 'gear', price: 0, sell: 15, desc: '拦滩客从路上带回的备刃。刀脊微弯，握柄大小刚合手。' },
  { id: 'trail_cutter', name: '松场习刀', kind: 'gear', price: 0, sell: 11, desc: '松场守索人给胜者备的短砍刀。护手做成一整圈。' },
  { id: 'star_blade', name: '暗星刀', kind: 'gear', price: 0, sell: 29, desc: '照偏井护矿人留下的旧图打成。刃厚而短，寻常力道也能掌控。' },
  { id: 'star_blade_pattern', name: '暗星刀匣底图', kind: 'key', price: 0, sell: 0, desc: '偏井护矿人留下的锻打寸图。断刀的三处裂口旁注明了哪边该留厚。' },
  { id: 'hide_shield', name: '包革小盾', kind: 'gear', price: 0, sell: 9, desc: '用松木弯成的圆盾，外包两层兽革。' },
  { id: 'miner_pick', name: '短柄矿镐', kind: 'gear', price: 0, sell: 4, desc: '窄镐头能钩进矿缝，短柄在陡坡和低井里也抡得开。' },
  { id: 'coil_spear', name: '绕脊枪', kind: 'gear', price: 0, sell: 25, desc: '用配重翻过的长枪。刃近手心，长柄仍能顺畅回收。' },
  { id: 'reed_bow', name: '苇弦弓', kind: 'gear', price: 0, sell: 8, desc: '将削薄的苇片贴在韧木上制成的猎弓。' },
  { id: 'iron_sword', name: '寒铁剑', kind: 'gear', price: 33, sell: 14, desc: '用沉钟岭的铁打成，兼顾出手和耐用。' },
  { id: 'tide_spear', name: '分潮枪', kind: 'gear', price: 57, sell: 25, desc: '闭潮渡的旧式枪，适合在开阔地先发制人。' },
  { id: 'straw_cape', name: '蓑衣', kind: 'gear', price: 6, sell: 2, desc: '挡潮气，也能缓掉浅处的抓咬。' },
  { id: 'hide_coat', name: '泥蜕褂', kind: 'gear', price: 18, sell: 7, desc: '泥蜕内衬柔韧，适合滩地的持久战。' },
  { id: 'iron_coat', name: '叠铁袍', kind: 'gear', price: 33, sell: 14, desc: '用寒铁片缝出护心和护肩。' },
  { id: 'tide_coat', name: '定潮甲', kind: 'gear', price: 55, sell: 24, desc: '潜到深处才显本事的沉甲。' },
  { id: 'reed_charm', name: '苇哨结', kind: 'gear', price: 8, sell: 3, reveal: { item: 'oar_mark' }, desc: '编作腰佩，发急时能稳住气息。' },
  { id: 'path_charm', name: '认路钱', kind: 'gear', price: 15, sell: 6, desc: '半枚打过眼的渡钱，挂着它好找回头路。' },
  { id: 'bell_charm', name: '定声铃', kind: 'gear', price: 29, sell: 12, desc: '贴身佩戴的哑铃，可以收住散乱真气。' },
  { id: 'tide_charm', name: '避潮玉', kind: 'gear', price: 43, sell: 18, reveal: { item: 'core' }, desc: '潮高时会微微发烫，提醒佩戴者提早抽身。' },
  { id: 'jetty_charm', name: '回灯坠', kind: 'gear', price: 0, sell: 17, reveal: { item: 'lamp_sketch' }, desc: '照灯夫拢火的手势缚住斜棱灵晶。险中看着一线余光，仍能辨认来路。' },
  { id: 'pine_bow', name: '松筋长弓', kind: 'gear', price: 0, sell: 18, desc: '韧皮条和松木叠成的长弓，张弦时震声很低。' },
  { id: 'resin_staff', name: '藏火杖', kind: 'gear', price: 0, sell: 15, desc: '松脂灌过的硬木杖。手心扶着的时候会回暖。' },
  { id: 'black_crossbow', name: '暗金机弩', kind: 'gear', price: 0, sell: 27, desc: '短臂机弩，由暗金卡牢弩机。适合迎着坚甲打。' },
  { id: 'snow_halberd', name: '断雪戟', kind: 'gear', price: 0, sell: 33, desc: '戟刃两边都开窄口。正面重击之外还可反钩。' },
  { id: 'sky_sword', name: '归衡剑', kind: 'gear', price: 0, sell: 60, desc: '窄剑的握柄和剑身都做了配重。出手会自行归到中线。' },
  { id: 'sky_bow', name: '鸣岳弓', kind: 'gear', price: 0, sell: 57, desc: '弓面刻过石台的长光。弓臂厚，才能送出分量大的箭。' },
  { id: 'frost_robe', name: '锁温袍', kind: 'gear', price: 0, sell: 29, desc: '雪蜥韧皮做窄内衬，雪水沾上不透。' },
  { id: 'sky_cloak', name: '合纹披甲', kind: 'gear', price: 0, sell: 49, desc: '灵晶片和厚皮交错织着。护住两膊和腰侧。' },
  { id: 'jade_pendant', name: '照腕佩', kind: 'gear', price: 0, sell: 38, desc: '手腕贴着，里面的清光会跟着呼吸明暗。' },

  { id: 'salve', name: '松脂膏', kind: 'pill', price: 6, sell: 2, desc: '便宜的应急药，可恢复少量气血。' },
  { id: 'qi_powder', name: '回气散', kind: 'pill', price: 6, sell: 2, desc: '服下能补回一些真气。连着吃几包，丹毒也会积起来。' },
  { id: 'grain_pill', name: '暖谷丸', kind: 'pill', price: 7, sell: 3, desc: '返程时拿来顶一顿的压缩口粮。' },
  { id: 'heal_pill', name: '合络丹', kind: 'pill', price: 11, sell: 4, desc: '兼治气血亏空和伤势。' },
  { id: 'detox_pill', name: '清露丸', kind: 'pill', price: 9, sell: 3, desc: '减轻服药累积的丹毒。' },
  { id: 'focus_pill', name: '定息丹', kind: 'pill', price: 12, sell: 5, desc: '收拢散乱的气息，使下一次术法伤害增加3点。' },
  { id: 'tide_pill', name: '济潮丹', kind: 'pill', price: 19, sell: 8, desc: '气血与真气一并恢复，药力很重。' },
  { id: 'resin_pill', name: '温枝丸', kind: 'pill', price: 0, sell: 6, desc: '药丸入口先苦，随后才感到胸口热。适合远行后恢复气血。' },
  { id: 'sense_powder', name: '凝神散', kind: 'pill', price: 0, sell: 4, desc: '细粉含在舌下有股凉意。练过神识的人可以借它收拢心神，留出余力观招。' },
  { id: 'heart_pill', name: '养心丸', kind: 'pill', price: 0, sell: 6, desc: '泽医把两味药收进一丸，既能补些气血，也能缓一缓神识的疲乏。' },
  { id: 'leaf_pill', name: '清脉饮', kind: 'pill', price: 0, sell: 8, desc: '一小囊苦药汁。能卸去丹毒，再理顺紊乱的真气。' },
  { id: 'jade_pill', name: '照心露', kind: 'pill', price: 0, sell: 16, desc: '用温火从晶屑中引出的药露。恢复真气和气血，服多容易积毒。' },

  { id: 'ember_talisman', name: '燃枝符', kind: 'talisman', price: 7, sell: 3, desc: '捻断即燃，在硬拼之前可先破对方阵脚。' },
  { id: 'reed_talisman', name: '遮痕符', kind: 'talisman', price: 7, sell: 3, desc: '散开一阵苇雾，有利于脱身。' },
  { id: 'bank_talisman', name: '回汊符', kind: 'talisman', price: 0, sell: 4, reveal: { item: 'eddy_note' }, desc: '借回流挪开半步，便能离开对手出手的方向。' },
  { id: 'iron_talisman', name: '铁障符', kind: 'talisman', price: 12, sell: 5, desc: '在身前撑起一面短暂的铁障。' },
  { id: 'tide_talisman', name: '逆潮符', kind: 'talisman', price: 19, sell: 8, desc: '借碎灵晶的回劲攻敌，余势还能护身。' },
];

const gear = [
  { id: 'cudgel', slot: 'weapon', weaponClass: 'staff', tier: 0, atk: 1, def: 0, perception: 1, hp: 0, qi: 0, retreat: 0, durability: 26, repair: 3, entry: '寻常行杖。出手稳当，力道偏轻，适合刚出门的散修。' },
  { id: 'knife', slot: 'weapon', weaponClass: 'blade', tier: 0, atk: 3, def: 0, perception: 3, hp: 0, qi: 0, retreat: 0, durability: 30, repair: 5, entry: '利落的凡制短刃。薄刃能从鳞缝里切进去，打披鳞的敌人时容易破防。', trait: { kind: 'pierce', enemyTag: 'scaled', bonus: 2 } },
  { id: 'split_axe', slot: 'weapon', weaponClass: 'blade', tier: 0, atk: 4, def: 0, perception: 0, hp: 0, qi: 0, retreat: 0, durability: 38, repair: 4, entry: '下手有分量的厚刃，在常年劈柴的木户手里也经用。' },
  { id: 'short_spear', slot: 'weapon', weaponClass: 'spear', tier: 0, atk: 4, def: 1, perception: 3, hp: 0, qi: 0, retreat: 0, durability: 27, repair: 7, entry: '村口巡守平日练的短矛。柄尾能架住近处来招，矛尖却薄，得时常修。' },
  { id: 'hook_blade', slot: 'weapon', weaponClass: 'blade', tier: 0, atk: 5, def: 0, perception: 1, hp: 0, qi: 0, retreat: 0, durability: 31, repair: 6, entry: '拦滩客的备刀。分量略沉，寻常人也能劈得稳。' },
  { id: 'trail_cutter', slot: 'weapon', weaponClass: 'blade', tier: 0, atk: 4, def: 1, perception: 4, hp: 0, qi: 0, retreat: 0, durability: 33, repair: 5, entry: '索棚比手的奖刀。宽护手能贴住对手的兵器，他一撤腕，你就容易察觉。' },
  { id: 'star_blade', slot: 'weapon', weaponClass: 'blade', tier: 0, atk: 6, def: 0, perception: 1, hp: 0, qi: 0, retreat: 0, durability: 37, repair: 11, entry: '照护矿人的旧式锻成，刀背厚，劈硬物时刃口容易吃住石缝。养气浅些也能握得稳。', trait: { kind: 'pierce', enemyTag: 'stoneborn', bonus: 2 } },
  { id: 'hide_shield', slot: 'offhand', tier: 0, atk: 0, def: 0, brace: 3, durability: 28, repair: 5, entry: '空出一只手便能用。防住蓄力后砸来的重招时，盾面能卸开一股力。' },
  { id: 'miner_pick', slot: 'offhand', tier: 0, durability: 18, repair: 4, entry: '拿在副手。沉钟岭冲沟可以站稳后撬坡矿，玄砂偏井里也可少花些工夫。镐头要磨，腾不出手持盾。' },
  { id: 'coil_spear', slot: 'weapon', weaponClass: 'spear', tier: 0, atk: 6, def: 0, perception: 2, hp: 0, qi: 0, retreat: 0, durability: 45, repair: 10, entry: '练得不深也能贯穿整段枪势的重兵。枪杆经用，锻造却要吃掉一匣硬料。' },
  { id: 'reed_bow', slot: 'weapon', weaponClass: 'bow', ammo: ['reed_arrow', 'iron_arrow'], tier: 0, atk: 3, def: 0, perception: 4, hp: 0, qi: 0, retreat: 0, durability: 28, repair: 4, entry: '寻常猎弓，弓力温和。可用削苇箭或包铁箭，射入厚毛不易滑脱。', trait: { kind: 'damage', enemyTag: 'furred', bonus: 2 } },
  { id: 'iron_sword', slot: 'weapon', weaponClass: 'sword', tier: 0, atk: 5, def: 0, perception: 3, hp: 0, qi: 0, retreat: 0, durability: 38, repair: 8, entry: '不挑修为的实用剑。厚脊让劈刺都稳，常年巡矿也不用总补剑身。' },
  { id: 'tide_spear', slot: 'weapon', weaponClass: 'spear', tier: 1, atk: 5, def: 0, perception: 5, hp: 0, qi: 1, retreat: 0, durability: 45, repair: 10, entry: '炼气中期能端稳的长枪。枪身压得稳，对手沉肩蓄力时容易看清。顺着这一空当刺过去，常能穿薄些的护甲。', trait: { kind: 'pierce', intent: 'heavy', bonus: 2 } },
  { id: 'straw_cape', slot: 'armor', tier: 0, atk: 0, def: 1, hp: 3, qi: 0, retreat: 0, durability: 24, repair: 3, entry: '渔人常穿的轻护具。能缓掉些寻常抓咬，遇到沉重来招仍须躲闪。' },
  { id: 'hide_coat', slot: 'armor', tier: 0, atk: 0, def: 2, hp: 5, qi: 0, retreat: 0, durability: 29, repair: 5, entry: '结实的凡制软甲。泥蜕织面咬不住，能额外卸掉野兽来招的力道。', trait: { kind: 'guard', enemyTag: 'beast', bonus: 2 } },
  { id: 'iron_coat', slot: 'armor', tier: 1, atk: 0, def: 3, hp: 7, qi: 0, retreat: 0, durability: 38, repair: 8, entry: '炼气中期用的重护具。叠铁护心能分散重击，接蓄势之后的重招更稳。', trait: { kind: 'guard', intent: 'heavy', bonus: 2 } },
  { id: 'tide_coat', slot: 'armor', tier: 2, atk: 0, def: 5, hp: 9, qi: -1, retreat: 0, durability: 46, repair: 12,
    entry: '炼气后期用的厚甲。甲下气息走得窄，穿着时体内少容些真气。挨了贴身的重招而受伤，甲片会反震伤敌。',
    trait: { kind: 'reflect', intent: 'heavy', bonus: 2 } },
  { id: 'reed_charm', slot: 'charm', tier: 0, atk: 0, def: 0, hp: 0, qi: 2, retreat: 0.05, durability: 25, repair: 3, entry: '小巧的凡制护符。苇声能帮助稳住真气，抓准空当时也更容易脱身。' },
  { id: 'path_charm', slot: 'charm', tier: 0, atk: 0, def: 0, hp: 2, qi: 0, retreat: 0.17, durability: 28, repair: 5,
    entry: '旧渡工用的护身钱。抓准空当更容易抽身，对方寻常的贴身一击袭来，也有时能闪开。',
    trait: { kind: 'dodge', bonus: 0.1, intent: 'attack' } },
  { id: 'bell_charm', slot: 'charm', tier: 1, atk: 0, def: 1, hp: 0, qi: 4, retreat: 0.05, durability: 38, repair: 8, entry: '炼气中期可佩的无声小铃。能多存些真气，受击和撤退时也有一点保护。' },
  { id: 'tide_charm', slot: 'charm', tier: 2, atk: 0, def: 1, hp: 4, qi: 3, retreat: 0.20, durability: 46, repair: 12, entry: '炼气后期可佩的玉坠。能护身、储存真气，趁人收招时也好抽身。' },
  { id: 'jetty_charm', slot: 'charm', tier: 2, atk: 0, def: 0, hp: 0, qi: 5, retreat: 0.30, durability: 38, repair: 9, entry: '炼气后期可佩的旧渡口灯坠。能多存些真气，察觉空当时尤其容易抽身。' },
  { id: 'pine_bow', slot: 'weapon', weaponClass: 'bow', ammo: ['reed_arrow', 'iron_arrow'], tier: 0, atk: 5, def: 0, perception: 5, hp: 0, qi: 0, retreat: 0, durability: 38, repair: 7, entry: '耐雨长弓。拉得稳，瞄住猎物时有余裕看它哪只脚先动。削苇箭和包铁箭都合弦。' },
  { id: 'resin_staff', slot: 'weapon', weaponClass: 'staff', tier: 1, atk: 4, def: 2, perception: 3, hp: 0, qi: 2, retreat: 0, durability: 40, repair: 7, entry: '炉户用的厚杖。能架住来势，杖芯温热，持久行气时也趁手。' },
  { id: 'black_crossbow', slot: 'weapon', weaponClass: 'crossbow', ammo: ['black_bolt'], tier: 2, atk: 6, def: 0, perception: 2, hp: 0, qi: 0, retreat: 0, durability: 36, repair: 12, entry: '炼气后期才能拉开的弩。只能用暗金短矢，对付长着石甲的敌人尤其容易射穿。', trait: { kind: 'pierce', enemyTag: 'stoneborn', bonus: 2 } },
  { id: 'snow_halberd', slot: 'weapon', weaponClass: 'spear', tier: 2, atk: 6, def: 1, perception: 4, hp: 0, qi: 0, retreat: 0.06, durability: 42, repair: 12, entry: '炼气后期常使的长戟。重招来时能挑住外缘，再反钩卸去一股冲力。', trait: { kind: 'guard', intent: 'heavy', bonus: 2 } },
  { id: 'sky_sword', slot: 'weapon', weaponClass: 'sword', tier: 3, atk: 6, def: 1, perception: 8, hp: 0, qi: 2, retreat: 0.04, durability: 48, repair: 15, entry: '筑基修士温养的衡剑。敌手腕上刚一吃劲，剑尖就有回响。敌手收势防守时，剑会顺着中线钻进护身的缝。', trait: { kind: 'pierce', intent: 'guard', bonus: 3 } },
  { id: 'sky_bow', slot: 'weapon', weaponClass: 'bow', ammo: ['iron_arrow', 'cloud_arrow'], tier: 3, atk: 7, def: 0, perception: 6, hp: 0, qi: 1, retreat: 0, durability: 44, repair: 15, entry: '筑基修士才能拉满的弓，按重箭的分量做成。只能用包铁箭或凝光箭。' },
  { id: 'frost_robe', slot: 'armor', tier: 2, atk: 0, def: 4, hp: 7, qi: 2, retreat: 0.10, durability: 43, repair: 13,
    entry: '炼气后期穿的轻袍，能抵挡抽走真气的招式，也便于脱身。普通贴身招打来时，有时能及时转身闪开。',
    trait: { kind: 'guard', intent: 'drain', bonus: 5 }, traits: [{ kind: 'dodge', bonus: 0.16, intent: 'attack' }] },
  { id: 'sky_cloak', slot: 'armor', tier: 3, atk: 0, def: 6, hp: 11, qi: 0, retreat: 0.04, durability: 54, repair: 16, entry: '筑基修士可穿的厚甲。皮条和厚晶片分担冲力，最能挡住蓄力后的重击。', trait: { kind: 'guard', intent: 'heavy', bonus: 3 } },
  { id: 'jade_pendant', slot: 'charm', tier: 3, atk: 0, def: 1, hp: 3, qi: 7, retreat: 0.14, durability: 51, repair: 16, entry: '筑基修士养气所用。手腕的浮光略闪，散掉的气便向内收。' },
];

const ammunition = [
  { id: 'reed_arrow', atk: 0, pierce: 0 },
  { id: 'iron_arrow', atk: 1, pierce: 1 },
  { id: 'black_bolt', atk: 1, pierce: 2 },
  { id: 'cloud_arrow', atk: 1, pierce: 2, trait: { kind: 'damage', enemyTag: 'spirit', bonus: 2 } },
];

const foods = [
  { id: 'ration', grade: 0, satiety: 32, hp: 2 },
  { id: 'meat_broth', grade: 1, satiety: 44, hp: 3 },
  { id: 'herb_stew', grade: 2, satiety: 56, hp: 5 },
  { id: 'crystal_feast', grade: 3, satiety: 72, hp: 8 },
];

const pills = [
  { id: 'salve', tier: 0, hp: 10, qi: 0, toxin: 8, wound: 0, focus: 0 },
  { id: 'qi_powder', tier: 0, hp: 0, qi: 7, toxin: 8, wound: 0, focus: 0 },
  { id: 'grain_pill', tier: 0, hp: 0, qi: 0, satiety: 88, toxin: 4, wound: 0, focus: 0 },
  { id: 'heal_pill', tier: 1, hp: 16, qi: 0, toxin: 12, wound: 1, focus: 0 },
  { id: 'detox_pill', tier: 0, hp: 0, qi: 0, toxin: -22, wound: 0, focus: 0 },
  { id: 'focus_pill', tier: 0, hp: 0, qi: 0, toxin: 6, wound: 0, focus: 1 },
  { id: 'tide_pill', tier: 2, hp: 24, qi: 10, toxin: 18, wound: 1, focus: 0 },
  { id: 'resin_pill', tier: 1, hp: 15, qi: 4, toxin: 9, wound: 0, focus: 0 },
  { id: 'sense_powder', tier: 1, hp: 0, qi: 0, sense: 2, toxin: 6, wound: 0, focus: 0 },
  { id: 'heart_pill', tier: 2, hp: 14, qi: 0, sense: 1, toxin: 10, wound: 0, focus: 0 },
  { id: 'leaf_pill', tier: 2, hp: 4, qi: 8, toxin: -28, wound: 0, focus: 0 },
  { id: 'jade_pill', tier: 3, hp: 30, qi: 15, toxin: 16, wound: 1, focus: 1 },
];

const talismans = [
  { id: 'ember_talisman', tier: 0, damage: 10, guard: 0, retreat: 0 },
  { id: 'reed_talisman', tier: 0, damage: 0, guard: 3, retreat: 0.38 },
  { id: 'bank_talisman', tier: 0, damage: 0, guard: 2, retreat: 0.56 },
  { id: 'iron_talisman', tier: 1, damage: 0, guard: 10, retreat: 0 },
  { id: 'tide_talisman', tier: 2, damage: 19, guard: 4, retreat: 0 },
];

const arts = [
  { id: 'reed_cleave', name: '分苇诀', tier: 0, cost: 2, power: 3, pierce: 1, guard: 0, break: 0, price: 6, desc: '用少量真气补强一次出手，适合对付薄甲。' },
  { id: 'stone_brace', name: '压石诀', tier: 0, cost: 2, power: -3, pierce: 0, guard: 5, break: 0, price: 8, desc: '先压低身子护住胸腹，顺势轻击一下。' },
  { id: 'hook_current', name: '钩水手', tier: 0, cost: 3, power: 0, pierce: 1, guard: 1, break: 7, price: 12, reveal: { item: 'oar_mark' }, desc: '用巧劲削弱对方重招，适合看准了再用。' },
  { id: 'bell_strike', name: '敲山劲', tier: 1, cost: 4, power: 6, pierce: 3, guard: 0, break: 0, price: 19, reveal: { item: 'stone_rubbing' }, desc: '照岩腹震开石壳的节拍集中力量，适合打穿厚甲。' },
  { id: 'earth_echo', name: '抱地听钟', tier: 1, cost: 3, power: -3, pierce: 0, guard: 9, break: 0, price: 0, reveal: { item: 'echo_method' }, desc: '掌根当作听声的岩面，以返响收气固守，可接下较重一击。' },
  { id: 'cliff_cut', name: '截崖步', tier: 1, cost: 4, power: 1, pierce: 1, guard: 3, break: 11, price: 22, reveal: { item: 'echo_note' }, desc: '移步切入攻势，削弱重招时也护住自身。' },
  { id: 'tide_part', name: '破潮指', tier: 2, cost: 5, power: 10, pierce: 5, guard: 0, break: 0, price: 31, weaponBased: false, reveal: { item: 'tide_note' }, desc: '据潮牌推算闸下退水最猛的一刻，借一瞬气劲击穿坚甲。' },
  { id: 'tide_return', name: '回澜式', tier: 2, cost: 4, power: -3, pierce: 1, guard: 13, break: 0, price: 27, reveal: { item: 'tide_note' }, desc: '以退借势，留力应对沉重的反扑。' },
  { id: 'cross_weir', name: '截流式', tier: 2, cost: 5, power: 3, pierce: 2, guard: 4, break: 15, price: 32, reveal: { item: 'tide_note' }, desc: '截住对手蓄势的时机，逼对方改走别处。' },
  { id: 'lamp_still', name: '护灯式', tier: 2, cost: 3, power: -4, pierce: 0, guard: 9, break: 4, price: 14, reveal: { item: 'lamp_sketch' }, desc: '仿着暗埠人守风口灯火的手势，省气护身。' },
  { id: 'mist_press', name: '压雾掌', tier: 2, cost: 4, power: 5, pierce: 1, guard: 6, break: 4, price: 28, weaponBased: false, reveal: { item: 'herb_press' }, desc: '沿药槽的高低推气。即使手边的兵刃已损，也能护住近身。' },
  { id: 'sky_axis', name: '归衡式', tier: 3, cost: 7, power: 12, pierce: 5, guard: 4, break: 10, price: 52, reveal: { item: 'meridian_etching' }, desc: '沿敌手用力的中线切入。打断蓄势的时候，余气还能护住肘腕。' },
  { id: 'jade_breath', name: '照脉诀', tier: 3, cost: 5, power: 4, pierce: 2, guard: 13, break: 8, price: 46, weaponBased: false, reveal: { item: 'meridian_etching' }, desc: '用一道内息抵过来招。手边没箭，也可以借地势运气回应。' },
];

const recipes = [
  { id: 'r_salve', result: 'salve', count: 2, tier: 0, cost: 2, need: { wood: 1 }, days: 1 },
  { id: 'r_qi', result: 'qi_powder', count: 3, tier: 0, facility: 'furnace', formula: 'formula_qi', cost: 3, need: { reed: 2, wood: 1 }, days: 1 },
  { id: 'r_grain', result: 'grain_pill', count: 1, tier: 0, facility: 'furnace', formula: 'formula_grain', cost: 2, need: { ration: 3, wood: 1 }, days: 1 },
  { id: 'r_detox', result: 'detox_pill', count: 2, tier: 0, facility: 'furnace', formula: 'formula_detox', cost: 3, need: { reed: 2, wood: 1 }, days: 1 },
  { id: 'r_focus', result: 'focus_pill', count: 2, tier: 0, facility: 'furnace', formula: 'formula_focus', cost: 4, need: { reed: 2, wood: 1, qi_core: 1 }, days: 1.5 },
  { id: 'r_heal', result: 'heal_pill', count: 2, tier: 1, facility: 'furnace', formula: 'formula_heal', cost: 4, need: { reed: 3, hide: 1 }, days: 1.5 },
  { id: 'r_tide', result: 'tide_pill', count: 2, tier: 2, facility: 'furnace', facilityLevel: 2, formula: 'formula_tide', cost: 7, need: { reed: 3, core: 1, qi_core: 2 }, days: 2 },
  { id: 'r_ember', result: 'ember_talisman', count: 2, tier: 0, cost: 3, need: { wood: 1, reed: 1 }, days: 1, reveal: { item: 'ember_fold' } },
  { id: 'r_reed', result: 'reed_talisman', count: 2, tier: 0, cost: 2, need: { reed: 1, wood: 1 }, days: 1, reveal: { item: 'reed_talisman' } },
  { id: 'r_bank_talisman', result: 'bank_talisman', count: 2, tier: 0, cost: 3, need: { reed: 1, wood: 2 }, days: 1, reveal: { item: 'eddy_note' } },
  { id: 'r_iron', result: 'iron_talisman', count: 2, tier: 1, cost: 4, need: { ore: 1, wood: 1 }, days: 1, reveal: { item: 'iron_talisman' } },
  { id: 'r_tide_talisman', result: 'tide_talisman', count: 2, tier: 2, cost: 6, need: { core: 1, wood: 1 }, days: 1, reveal: { item: 'tide_note' } },
  { id: 'r_hide_coat', result: 'hide_coat', count: 1, tier: 0, cost: 5, need: { hide: 2 }, requiresShownHide: true, days: 1 },
  { id: 'r_reed_bow', result: 'reed_bow', count: 1, tier: 0, cost: 4, need: { wood: 1, reed: 2 }, days: 1 },
  { id: 'r_split_axe', result: 'split_axe', count: 1, tier: 0, facility: 'forge', cost: 7, need: { ore: 3, wood: 3 }, days: 1, reveal: { item: 'ore' } },
  { id: 'r_short_spear', result: 'short_spear', count: 1, tier: 0, facility: 'forge', cost: 9, need: { ore: 2, wood: 4 }, days: 1.5, reveal: { item: 'ore' } },
  { id: 'r_iron_sword', result: 'iron_sword', count: 1, tier: 0, facility: 'forge', cost: 12, need: { ore: 6, wood: 3 }, days: 2, reveal: { item: 'blade_template' } },
  { id: 'r_iron_coat', result: 'iron_coat', count: 1, tier: 1, facility: 'forge', cost: 16, need: { ore: 8, hide: 3 }, requiresShownHide: true, days: 2, reveal: { item: 'plate_lacing' } },
  { id: 'r_tide_spear', result: 'tide_spear', count: 1, tier: 1, facility: 'forge', cost: 17, need: { ore: 5, core: 2, qi_core: 4 }, days: 2.5, reveal: { item: 'spear_joint' } },
  { id: 'r_tide_coat', result: 'tide_coat', count: 1, tier: 2, facility: 'forge', cost: 19, need: { ore: 5, hide: 3, core: 2, qi_core: 3 }, requiresShownHide: true, days: 3, reveal: { item: 'gate_buckles' } },
  { id: 'r_reed_charm', result: 'reed_charm', count: 1, tier: 0, cost: 3, need: { reed: 2, wood: 1 }, days: 0.5, reveal: { item: 'oar_mark' } },
  { id: 'r_tide_charm', result: 'tide_charm', count: 1, tier: 2, facility: 'forge', cost: 11, need: { core: 2, hide: 1, beast_eye: 1 }, days: 1.5, reveal: { item: 'tide_note' } },
  { id: 'r_jetty_charm', result: 'jetty_charm', count: 1, tier: 2, cost: 8, need: { wood: 2, reed: 1, core: 1 }, days: 1, reveal: { item: 'lamp_sketch' } },
  { id: 'r_reed_arrow', result: 'reed_arrow', count: 8, tier: 0, cost: 1, need: { wood: 2, reed: 1 }, days: 0.5 },
  { id: 'r_iron_arrow', result: 'iron_arrow', count: 6, tier: 1, facility: 'forge', cost: 3, need: { ore: 2, reed: 2 }, days: 1, reveal: { item: 'arrow_pattern' } },
  { id: 'r_black_bolt', result: 'black_bolt', count: 8, tier: 2, facility: 'forge', facilityLevel: 2, cost: 4, need: { black_iron: 2, wood: 2 }, days: 1, reveal: { item: 'vein_pattern' } },
  { id: 'r_cloud_arrow', result: 'cloud_arrow', count: 8, tier: 3, facility: 'forge', facilityLevel: 2, cost: 6, need: { core: 1, hide: 1, wood: 2, qi_core: 1 }, days: 1.5, reveal: { item: 'cloud_tip' } },
  { id: 'r_pine_bow', result: 'pine_bow', count: 1, tier: 0, facility: 'forge', cost: 14, need: { wood: 7, hide: 3 }, days: 2, reveal: { item: 'bow_stave' } },
  { id: 'r_resin_staff', result: 'resin_staff', count: 1, tier: 1, facility: 'forge', cost: 13, need: { wood: 6, ore: 3 }, days: 2, reveal: { item: 'resin_tamper' } },
  { id: 'r_black_crossbow', result: 'black_crossbow', count: 1, tier: 2, facility: 'forge', facilityLevel: 2, cost: 30, need: { black_iron: 5, wood: 4, hide: 2, qi_core: 6 }, days: 3, reveal: { item: 'vein_pattern' } },
  { id: 'r_coil_spear', result: 'coil_spear', count: 1, tier: 0, facility: 'forge', facilityLevel: 2, cost: 28, need: { black_iron: 5, wood: 4, core: 3 }, days: 3, reveal: { item: 'vein_pattern' } },
  { id: 'r_snow_halberd', result: 'snow_halberd', count: 1, tier: 2, facility: 'forge', facilityLevel: 2, cost: 28, need: { black_iron: 6, wood: 4, hide: 3 }, days: 3, reveal: { item: 'hook_iron' } },
  { id: 'r_frost_robe', result: 'frost_robe', count: 1, tier: 2, facility: 'forge', facilityLevel: 2, cost: 24, need: { hide: 8, wood: 3 }, days: 3, reveal: { item: 'pass_seam' } },
  { id: 'r_sky_sword', result: 'sky_sword', count: 1, tier: 3, facility: 'forge', facilityLevel: 3, cost: 42, need: { black_iron: 7, core: 4, hide: 3, foundation_core: 4 }, days: 4, reveal: { item: 'meridian_etching' } },
  { id: 'r_sky_bow', result: 'sky_bow', count: 1, tier: 3, facility: 'forge', facilityLevel: 3, cost: 39, need: { wood: 8, core: 4, hide: 6, foundation_core: 3 }, days: 4, reveal: { item: 'axis_tuning' } },
  { id: 'r_sky_cloak', result: 'sky_cloak', count: 1, tier: 3, facility: 'forge', facilityLevel: 3, cost: 36, need: { hide: 8, core: 5 }, days: 4, reveal: { item: 'loom_tack' } },
  { id: 'r_jade_pendant', result: 'jade_pendant', count: 1, tier: 3, facility: 'forge', facilityLevel: 2, cost: 26, need: { core: 5, hide: 3, beast_eye: 1 }, days: 3, reveal: { item: 'axis_tuning' } },
  { id: 'r_star_blade', result: 'star_blade', count: 1, tier: 2, facility: 'forge', facilityLevel: 2, cost: 35, need: { black_iron: 9, ore: 5, core: 4, wood: 3 }, days: 4, reveal: { item: 'star_blade_pattern' } },
  { id: 'r_hide_shield', result: 'hide_shield', count: 1, tier: 0, facility: 'forge', cost: 8, need: { wood: 4, hide: 3 }, days: 1.25, requiresShownHide: true },
  { id: 'r_miner_pick', result: 'miner_pick', count: 1, tier: 0, facility: 'forge', cost: 8, need: { ore: 4, wood: 2 }, days: 1.5, reveal: { item: 'blade_template' } },
  { id: 'r_resin_pill', result: 'resin_pill', count: 3, tier: 1, facility: 'furnace', formula: 'formula_resin', cost: 6, need: { wood: 2, reed: 3, qi_core: 2 }, days: 2 },
  { id: 'r_sense_powder', result: 'sense_powder', count: 2, tier: 1, facility: 'furnace', formula: 'formula_sense', cost: 4, need: { reed: 2, core: 1 }, days: 1.25 },
  { id: 'r_heart_pill', result: 'heart_pill', count: 2, tier: 2, facility: 'furnace', facilityLevel: 2, formula: 'formula_heart', cost: 6, need: { reed: 3, hide: 1, qi_core: 1 }, days: 2 },
  { id: 'r_leaf_pill', result: 'leaf_pill', count: 3, tier: 2, facility: 'furnace', facilityLevel: 2, formula: 'formula_leaf', cost: 10, need: { reed: 4, kiln_clay: 1, wood: 2, qi_core: 3 }, days: 3 },
  { id: 'r_jade_pill', result: 'jade_pill', count: 3, tier: 3, facility: 'furnace', facilityLevel: 3, formula: 'formula_jade', cost: 16, need: { reed: 4, core: 2, wood: 1, foundation_core: 2, beast_eye: 1 }, days: 4 },
  { id: 'r_foundation', result: 'foundation_pill', count: 1, tier: 2, facility: 'furnace', facilityLevel: 2, formula: 'formula_foundation', cost: 45, need: { foundation_charge: 1, reed: 6, core: 5, black_iron: 4, qi_core: 24 }, days: 4 },
];

const regions = [
  { id: 'village', name: '落灯村', tier: 0, travel: 1, desc: '旧渡停了之后，村人每晚仍点一盏灯。这里可问路、休整、补给。' },
  { id: 'marsh', name: '白苇滩', tier: 0, travel: 1, desc: '白苇贴着浅岸长。碎石间冒着水泡，再远一点的河岔里竖着几根木桩。干地上还有一道矮石堤。' },
  { id: 'ridge', name: '沉钟岭', tier: 1, travel: 2, reveal: { item: 'ridge_rubbing' }, desc: '旧矿口朝着山路，茶棚、冲沟和断绳坡都在坡面上。岩壁还留着这里曾经通水的痕迹。' },
  { id: 'ford', name: '闭潮渡', tier: 2, travel: 2, reveal: { item: 'ford_chart' }, desc: '旧闸还随潮开合。浅阶从刻着水痕的石壁下伸入渡口，前头搁着渡舟与吊着铁环的木排。' },
  { id: 'hidden', name: '回灯埠', tier: 2, travel: 2, secret: true, reveal: { item: 'secret_pass' }, desc: '夹在两道水流间的避风小码头，渡工从前在这里换灯，让乘客下船。' },
  { id: 'pine_ridge', name: '青崖松场', tier: 1, travel: 2, reveal: { item: 'pine_pass' }, desc: '山路从收松脂的木架旁下到一座摇晃的桥。窑车倒在背坡，桥头棚子外铺着几张练武的草垫。' },
  { id: 'kiln_valley', name: '云炉石谷', tier: 2, travel: 2, reveal: { item: 'kiln_tracks' }, desc: '石谷口是淘白泥的斜坡。车棚靠着坡脚，檐下叠着药篓。背后的老窑没有冒烟。' },
  { id: 'herb_basin', name: '篁泽药谷', tier: 2, travel: 2.25, reveal: { item: 'herb_tie' }, desc: '竹梁到头是半片药田。茅棚外堆着药篓，踩进田边的水里能望见伏着藤影的石塘。' },
  { id: 'black_mine', name: '玄砂矿脉', tier: 2, travel: 2.5, reveal: { item: 'mine_guide' }, desc: '沿签上画的石槽进山，飞砂一阵阵贴着矿架吹。绞车和矿渣都留在井口，深处偶有钝响。' },
  { id: 'snow_pass', name: '碎云雪关', tier: 2, travel: 2.75, reveal: { item: 'snow_token' }, desc: '踏出旧栈道便看见山雪。山火棚仍有人看守，棚旁的蜥道和南沟隔着两道短栈。' },
  { id: 'sky_terrace', name: '天衡石台', tier: 3, travel: 3, reveal: { item: 'sky_cord' }, desc: '走过最后一条带扶绳的木梁，脚下便是宽阔的山脊。晶石在坡上闪着光。雾薄的时候，能望见西边架着一条观星用的石梁。' },
];

const herbDenPack = ['herb_den_toad', 'herb_den_sawfish', 'herb_den_lizard', 'herb_den_elder'];

const sites = [
  { id: 'reed_banks', region: 'marsh', name: '浅水苇丛', once: [2],
    stocks: {
      reed: { label: '浅处苇芯', start: 2, cap: 3, interval: 5, growth: 1, depletedFactor: 1.5, choices: [0] },
      reed_deep: { item: 'reed', label: '深处苇芯', start: 3, cap: 5, interval: 5, growth: 1, depletedFactor: 1.5, choices: [1] },
    },
    stockText: {
      reed: { present: '几株能挖芯的白苇贴着踏石长。', absent: '踏石边翻过的泥里只剩还没长开的嫩芽。' },
      reed_deep: { present: '回水湾里还有长实的苇芯。', absent: '回水湾那丛采过了，断茎贴着水面。' },
    } },
  { id: 'sunk_pack', region: 'marsh', name: '木桩旁的浅水道', once: [0, 1],
    afterOnceText: { 0: '木桩上还挂着一小截篓绳。桩内侧的石路绕向河弯，几片新削的木屑从那头漂过来。' } },
  { id: 'mud_track', region: 'marsh', name: '碎石水眼', once: [3, 4],
    stocks: { wood: { start: 4, cap: 6, interval: 3, growth: 2, depletedFactor: 1.5, choices: [1] } },
    creatures: {
      mud_beast: { start: 1, cap: 3, interval: 4, growth: 1, curve: 'wild' },
      reed_fox: { start: 2, cap: 4, interval: 4, growth: 1, curve: 'wild' },
      reed_hare: { start: 2, cap: 5, interval: 3.25, growth: 1, curve: 'wild' },
    },
    creatureText: {
      mud_beast: { present: '近岸冒一溜水泡，几片硬鳞擦过露出水面的石头。', absent: '近岸平静，水面看不到鳞片。' },
      reed_fox: { present: '干埂有新兽印，苇梗上还挂着短毛。', absent: '干埂只剩几道磨浅的旧兽印。' },
      reed_hare: { present: '背水坡的矮苇一簇簇晃动。有几对白耳贴着地面，从苇根间挪过去。', absent: '背水坡的苇根还留着浅浅的啃痕。' },
    },
    emptyText: '水眼没有动静，干埂只剩浅兽印和拾空的碎枝。另一头仍有几块排齐的石头伸进芦苇。' },
  { id: 'old_fire', region: 'marsh', name: '背雨石渠', afterChoices: ['mud_track:3'],
    stocks: { wood: { start: 6, cap: 6, interval: 0, growth: 0, choices: [1] } }, once: [2, 3],
    stockText: { wood: { present: '渠边石板下露出几截干柴。', absent: '遮柴的石板底下已经空了。' } },
    choiceText: {
      2: { before: '炉边的灰里露着一角破瓦。', after: '拿掉瓦角的地方还留着个浅印。' },
      3: { before: '炉沿的缝里夹着一点纸边。', after: '抽走折纸的砖缝里留下一缕松灰。' },
    } },
  { id: 'reed_ferryman', region: 'marsh', name: '渡工的刨木滩', afterChoices: ['reed_banks:2', 'sunk_pack:1', 'bank_watch:1'], once: [0, 2],
    stocks: { reed: { start: 3, cap: 5, interval: 5, growth: 2, choices: [3] } },
    creatures: { marsh_ghost: { start: 1, cap: 2, interval: 5, growth: 1 } },
    creatureText: { marsh_ghost: { present: '对岸的影子贴着白苇的浅滩来回走，把过水的石路挡住了。渡工停了刀，往对岸看。', absent: '对岸的石路空下来。水从白苇间流走。' } },
    afterOnceText: { 0: '渡工把接上新柄的桨平码在石头上。他脚边另有把翻到背面的旧桨。对岸浅石围着一丛白苇。' } },
  { id: 'bank_watch', region: 'marsh', name: '矮石堤', once: [1, 2], protectedArena: true,
    creatures: { bank_runner: { start: 1, cap: 1, interval: 0, growth: 0 } },
    afterWinText: { bank_runner: '拦滩客把木杖靠在堤边，解开了系住折图的细绳。备刀还搁在石面上。' },
    afterOnceText: { 2: '拦滩客靠在堤上揉手腕，放折图和钩刃的石面空了。' } },
  { id: 'drowned_mast', region: 'marsh', name: '断船桅旁的高岸', reveal: { item: 'oar_mark' }, once: [1, 2],
    creatures: { mast_beast: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { mast_beast: { present: '桅下伏着一条有鳍的水兽，尾巴绕着桅根，木缝里透出一点铜色。', absent: '桅根只挂着断下的水草。' } },
    afterOnceText: { 2: '桅木底下露出一道空缝。水仍从高埂下那块露头石的两侧分开。' } },

  { id: 'ore_rain', region: 'ridge', name: '落矿的冲沟', once: [2],
    stocks: {
      ore: { label: '沟边寒铁', start: 3, cap: 4, interval: 3.5, growth: 1, choices: [0] },
      ore_slope: { item: 'ore', label: '坡壁寒铁', start: 4, cap: 6, interval: 3.5, growth: 2, choices: [1, 4] },
      core: { label: '砂槽灵晶', start: 2, cap: 4, interval: 5, growth: 1, choices: [3] },
    },
    emptyText: '沟底已翻过一遍，没有松动的矿块了。护篷下还坐着一位验矿的老人。' },
  { id: 'ledge_mine', region: 'ridge', name: '旧扣旁的窄矿槽', afterChoices: ['ore_rain:2'],
    creatures: { ore_wight: { start: 1, cap: 1, interval: 7, growth: 1, fixedPopulation: true } },
    creatureText: { ore_wight: {
      present: '铁扣一晃一晃。底下有个人形东西举锤等着，石缝里露出夹着灵晶的寒铁。',
      absent: '铁扣垂了下来，验矿人能顺着绳把矿篮放到石台。' } },
    stocks: {
      ore: { label: '矿槽寒铁', start: 8, cap: 8, interval: 7, growth: 4, choices: [1] },
      core: { label: '矿槽灵晶', start: 4, cap: 4, interval: 7, growth: 2, choices: [1] },
    } },
  { id: 'empty_oven', region: 'ridge', name: '歇炉的茶棚', once: [1],
    afterOnceText: { 1: '木板搬走后露出一条烟痕。棚顶还完整，石灶里的火眼没有堵，没人拦着借火歇脚。' } },
  { id: 'miner_echo', region: 'ridge', name: '有回声的矿道', once: [2],
    stocks: { ore: { label: '旁孔寒铁', start: 1, cap: 2, interval: 3, growth: 1, choices: [1] },
      ore_wall: { item: 'ore', label: '主道寒铁', start: 2, cap: 4, interval: 3, growth: 1, choices: [3] },
      core: { start: 2, cap: 4, interval: 5, growth: 1, choices: [3] } },
    creatures: { ore_wight: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { ore_wight: { present: '握锤的影子在主道上巡行，一点冷光随它胸口移动。它身后的矿壁另有两条亮脉。', absent: '主道听不到锤声了，锤痕一路通到夹着亮晶的矿壁。' } },
    emptyText: '主道里没有锤声，旁孔也已经翻过。更高一点的石缝还透着外头的天光。' },
  { id: 'rope_run', region: 'ridge', name: '断绳坡', once: [0],
    creatures: { stone_badger: { start: 1, cap: 2, interval: 3, growth: 1 } },
    creatureText: { stone_badger: { present: '碎石后传来爪尖蹭岩的声响。', absent: '碎石后空空荡荡。' } },
    afterOnceText: { 0: '挑夫把车推回了山路。坡下两道车辙经过一堆松碎石，岩下有口能藏小兽的窄洞。' } },
  { id: 'stone_niche', region: 'ridge', name: '回声石洞', afterChoices: ['miner_echo:2', 'rope_run:0'], once: [0, 1, 2],
    choiceText: {
      0: { before: '铃底的岩石有道细缝，露出一角发白的纸。', after: '水图原先压着的石缝空了，撬松的石头搁在旁边。' },
      1: { before: '一只破铃倒扣在石壁旁。', after: '提过的破铃靠在岩壁边。再往上是通到裂钟背后的石阶。' },
      2: { after: '扣住铃舌的裂口只剩一圈擦痕。' },
    } },
  { id: 'cracked_bell', region: 'ridge', name: '裂钟背面', afterChoices: ['stone_niche:1'], once: [2],
    creatures: { bell_wraith: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { bell_wraith: { present: '钟腹里伏着一团灰影。它一缩身，脚下的窄脊就跟着颤。', absent: '钟腹已空，碎片散落在钟座周围。' } },
    afterOnceText: { 2: '石架上的铜钩空着。旧钟裂成的两瓣斜在坡上，背后的窄石脊还能绕回山坡。' } },

  { id: 'low_tide', region: 'ford', name: '闸外浅阶',
    stocks: { core: { label: '浅阶灵晶', start: 2, cap: 3, interval: 2, growth: 1, choices: [0] },
      core_silt: { item: 'core', label: '槽底灵晶', start: 2, cap: 3, interval: 2, growth: 1, choices: [2, 6] } },
    ebbText: { low: '水退过了外侧的石脊，背后那块能站人的石板露出水面。', high: '外侧石脊只露出细细一线，背后的石板还淹着。' },
    creatures: {
      rope_eel: { start: 1, cap: 3, interval: 2.5, growth: 1, curve: 'wild' },
      ford_silver_dace: { start: 3, cap: 5, interval: 3.25, growth: 1, curve: 'wild' },
      ford_shale_crab: { start: 2, cap: 4, interval: 5, growth: 1, curve: 'wild' },
      mud_beast: { start: 1, cap: 3, interval: 6, growth: 1, curve: 'wild' },
    },
    creatureText: {
      rope_eel: { present: '下游船绳时松时紧，深槽外的水不时打旋。', absent: '下游船绳浮在水上，无物牵动。' },
      ford_silver_dace: { present: '东边浅湾银光一闪，几条鱼贴着水面转了个弯。', absent: '东边湾底的沙已经澄清，水面没有鱼影。' },
      ford_shale_crab: { present: '裸露的闸墩挂着几枚灰壳，石缝里又伸出一只带黑纹的钳。', absent: '闸墩的石缝里只挂着几枚旧灰壳。' },
      mud_beast: { present: '外滩泥地有几道腹鳞拖出的长印，直没入芦根。', absent: '外滩的长印已经被水冲淡。' },
    },
    emptyText: '浅阶已经扫净，下游的船绳浮着不动。只有浪沫漫过石缝。' },
  { id: 'boat_shade', region: 'ford', name: '没篷的渡舟', once: [1, 2],
    afterOnceText: { 1: '柜子移走了，船底的铁带留下一道擦痕。船里的凳子还干，旧船绳挂在朝水的钩上。灯架熏黑了一半。' } },
  { id: 'flood_lines', region: 'ford', name: '刻洪痕的石壁', once: [0],
    stocks: { core: { start: 3, cap: 4, interval: 2, growth: 1, choices: [1] } },
    afterOnceText: { 0: '石缝里只剩一道压痕。洪水在壁根留了薄薄的沙，水还够不到这里。' } },
  { id: 'lock_deck', region: 'ford', name: '悬锁木排', once: [0, 1],
    afterOnceText: { 0: '铁环上只剩一圈湿绳痕。木排仍压着大半石阶，水从排边滴下去。', 1: '挪开的木排歪倚在石上，石阶已露出。排边套着铁环，伸手就够得着。' } },
  { id: 'tide_keeper', region: 'ford', name: '旧闸深槽', afterChoices: ['lock_deck:1'], once: [1, 2],
    creatures: { tide_spirit: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { tide_spirit: { present: '水退下去时，一道人影扯紧锁链，锁旁露出一个方形印钮。', absent: '重锁已经松落，闸间没有人影。' } },
    afterOnceText: { 2: '取过印的方槽露在外头，薄水从门缝向外淌。高处还有几级干石阶，可以退过去看涨落。' } },
  { id: 'ford_relay', region: 'ford', name: '旧闸外的驮棚', afterChoices: ['lock_deck:1'], once: [0],
    afterOnceText: { 0: '新添的木柱撑住了棚檐。老船工把口粮收在柱旁，棚里还有一处干地可坐。' } },

  { id: 'upstream_lights', region: 'hidden', name: '朝上游的灯架', once: [0],
    afterOnceText: { 0: '干槽里留着点灯后的灰，灯芯缩短了一截。灯壳朝上游开口，灯座背面避风。' } },
  { id: 'sunken_mooring', region: 'hidden', name: '低水船桩', once: [1, 2],
    creatures: { wick_husk: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { wick_husk: { present: '湿蓑衣下面，一只手攥着微亮的灯芯。', absent: '蓑衣空了，顺水漂过船脚。' } },
    afterOnceText: { 1: '粮匣已经解开，湿绳尾梢在水里绕成一圈。桩灯的铜罩伏在木沿上。',
      2: '桩灯的铜罩已经盖好，留下一圈熏痕。旁边的湿绳仍贴着岸。' } },
  { id: 'still_pole', region: 'hidden', name: '风口灯杆', once: [0] },

  { id: 'pine_stand', region: 'pine_ridge', name: '刮脂松架', once: [2],
    stocks: {
      wood: { label: '架下松片', start: 5, cap: 8, interval: 4, growth: 2, depletedFactor: 1.5, choices: [0] },
      wood_branches: { item: 'wood', label: '树上枯枝', start: 5, cap: 7, interval: 4, growth: 1, depletedFactor: 1.5, choices: [1] },
    },
    emptyText: '松皮上的脂已经刮净，架下也没有可拣的枯枝。架头有一道细长的弧槽，正好压过箩筐口。' },
  { id: 'timber_bridge', region: 'pine_ridge', name: '缺板的驮桥', once: [0],
    afterOnceText: { 0: '驮夫打好最后一只楔子。桥板不再晃，石墩仍可坐人。' } },
  { id: 'pine_hollow', region: 'pine_ridge', name: '翻车的松沟', once: [2],
    creatures: { pitch_bear: { start: 1, cap: 2, interval: 7, growth: 1, depletedFactor: 1.5 } },
    creatureText: { pitch_bear: { present: '空车一侧拱动，车轴底还拴着几缕毛。', absent: '车底已经空了。泥面只剩拖着爪走过的深痕。' } },
    afterWinText: { pitch_bear: '车轴被撞得斜出树沟。麻绳断了，木签落在外侧的小路边。' },
    afterOnceText: { 2: '车轴边只剩裁下来的麻绳。沟沿那条小路还能绕回松架。' } },
  { id: 'pine_ledges', region: 'pine_ridge', name: '背阴的断肩崖', reveal: { item: 'pine_ledge_note' },
    stocks: { wood: { start: 4, cap: 6, interval: 8, growth: 2, depletedFactor: 1.5, choices: [0] } },
    emptyText: '靠里的几道脂槽见底了。石面还有旧挖凿的横痕。' },
  { id: 'pine_spar', region: 'pine_ridge', name: '索棚拳场', protectedArena: true,
    creatures: { road_sparrer: { start: 1, cap: 1, interval: 8, growth: 1 } },
    creatureText: { road_sparrer: { present: '守索人站在草垫边，把一把要奖给胜者的练武刀摆在架上。', absent: '这班守索人把钝刀插回门边，等下一班人来。' } } },

  { id: 'clay_bank', region: 'kiln_valley', name: '白泥洗坯坡',
    stocks: {
      kiln_clay: { label: '坡根耐火泥', start: 3, cap: 4, interval: 6, growth: 1, depletedFactor: 1.5, choices: [0] },
      clay_slope: { item: 'kiln_clay', label: '干泥带耐火泥', start: 4, cap: 6, interval: 6, growth: 1, depletedFactor: 1.5, choices: [1] },
    },
    emptyText: '坡根的白泥已经铲尽，拐弯处只剩风干的灰壳。' },
  { id: 'abandoned_kiln', region: 'kiln_valley', name: '冷下来的老窑', once: [0, 2],
    afterOnceText: { 0: '铁圈下的石牌已经取出来了。灰线后的平石仍能挡风，墙边斜靠着一段烧焦的木柄。', 2: '墙边落着擦下来的焦灰。风还往窑门的铁圈底下钻，灰线后有石头能挡风。' } },
  { id: 'kiln_carter', region: 'kiln_valley', name: '药篓车棚', once: [0, 1],
    afterOnceText: { 0: '车帮已经封好，赶车人把最后一个药篓提到石檐下。车底有一面挡泥的旧篷。', 1: '旧篷卷到车轮边，石檐下叠着几只空药篓。赶车人蹲在车帮旁。' } },
  { id: 'kiln_flue', region: 'kiln_valley', name: '废窑烟道', afterChoices: ['abandoned_kiln:0'], once: [2],
    stocks: { black_iron: { start: 2, cap: 3, interval: 7, growth: 1, depletedFactor: 1.5, choices: [3] },
      kiln_clay: { start: 3, cap: 3, interval: 0, growth: 0, choices: [4] } },
    afterOnceText: { 2: '墙缝里只剩黄釉上的半片纸痕。靠外窑砖积灰，内壁石柜半开。坡下温水从后崖渗进窑沟。' },
    creatures: { cinder_hound: { start: 1, cap: 2, interval: 8, growth: 1, depletedFactor: 1.5 } },
    creatureText: { cinder_hound: { present: '鱼鳞似的窑砖抖动了几下，一团带着暗红的细灰在石柜前打转。', absent: '窑砖已经稳下来，通往石柜的过道空了。' } } },

  { id: 'herb_beds', region: 'herb_basin', name: '银纹药田',
    stocks: { reed: { start: 8, cap: 12, interval: 6, growth: 2, depletedFactor: 1.5, choices: [0] } },
    emptyText: '药田里的老叶已经剪尽。细芽还贴着湿泥，只等抽出来。' },
  { id: 'mist_shelter', region: 'herb_basin', name: '垫高脚的药棚', once: [0, 1, 2],
    afterOnceText: { 0: '泽医把通矿队的木匣系好，膝边的木板还压着张验药小札。', 1: '席上的捣药板已经腾出来了。给矿队装药的篓旁，并着两只滴药的小罐。',
      2: '两只小药罐分立在木槽两端。泽医垫在罐脚下的竹片还在，落进碗里的两股药汁滴得一样快。' } },
  { id: 'herb_den', region: 'herb_basin', name: '蒲根下的水洞', afterChoices: ['mist_shelter:1'], once: [1, 4],
    stocks: { reed_water: { item: 'reed', label: '引水槽边的灵草', start: 3, cap: 6, interval: 5, growth: 2, choices: [5] } },
    choiceText: { 1: { after: '靠棚的板沿有块干石。从那里扶着粗蒲根，可以沿洞壁绕向里面。' } },
    afterOnceText: { 4: '取水槽接好了。水越过蒲根，淌进药棚边原先干着的一排药草。高处的旧灶还能添柴。' },
    creatures: {
      herb_den_toad: { start: 24, cap: 24, interval: 0, growth: 0 },
      herb_den_sawfish: { start: 8, cap: 8, interval: 0, growth: 0 },
      herb_den_lizard: { start: 6, cap: 6, interval: 0, growth: 0 },
      herb_den_elder: { start: 1, cap: 1, interval: 0, growth: 0 },
    },
    creatureText: {
      herb_den_toad: { present: '细碎的脚印盖过了大半泥岸。水里一阵挨一阵地鼓泡。', absent: '浅水的泡沫早已散完。' },
      herb_den_sawfish: { present: '近岸的泥里有几道直沟，沟前露着尖尖的背鳍。', absent: '近岸的泥落平了，没再划出直沟。' },
      herb_den_lizard: { present: '贴根的宽尾印往几道深缝里收。', absent: '深缝里漏下的水散成细滴，再没有宽尾掠过去。' },
      herb_den_elder: { present: '最深处的木桩上有两道深齿印，水面偶尔露出一角青灰色的颈甲。', absent: '被啃裂的木桩倒了，水从桩顶漫过去。' },
    } },
  { id: 'vine_pond', region: 'herb_basin', name: '白藤塘',
    stocks: { reed: { label: '塘边银脉叶', start: 4, cap: 8, interval: 7, growth: 2, depletedFactor: 1.5, choices: [2] },
      reed_upper: { item: 'reed', label: '上游银脉叶', start: 5, cap: 6, interval: 10, growth: 2, choices: [4] } },
    creatures: { vine_stag: { start: 1, cap: 4, interval: 8, growth: 1, depletedFactor: 1.5, curve: 'wild' },
      vine_king: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: {
      vine_stag: { present: '藤下偶尔晃过白角，湿泥从踏石边滑进水里。', absent: '藤垂着不动，浅水上也没有动静。' },
      vine_king: { present: '上游一根粗藤擦掉了树皮，旁边的蹄印比塘边的大得多。', absent: '坝根的倒藤已经伏下，可以顺着水脚上去。' },
    },
    afterWinText: { vine_king: '倒藤被顶离了老树，背水坡上露出另一片银脉叶。岸外那块斜石还在。' },
    emptyText: '塘里只剩尚未长开的嫩茎。去浅水的踏石没人挡着，岸外仍有块斜石可绕。' },

  { id: 'mine_tailings', region: 'black_mine', name: '黑砂洗矿槽',
    stocks: {
      black_iron: { label: '槽沿暗金', start: 4, cap: 5, interval: 7, growth: 1, depletedFactor: 1.5, choices: [0] },
      black_iron_inner: { item: 'black_iron', label: '槽底暗金', start: 4, cap: 7, interval: 7, growth: 1, depletedFactor: 1.5, choices: [1] },
    },
    emptyText: '石槽里只剩碎砂。激流过后，有颜色的石块才会再卡进来。' },
  { id: 'winch_house', region: 'black_mine', name: '转盘卡住的矿棚', once: [0, 1],
    afterOnceText: { 0: '转盘已经能用长绳提起矿筐。矿工把筛出的灵晶装进布袋，手边的风炉等着添柴。', 1: '矿工把量尺寸的铁零件给了你。架外的石阶顺坡而下。' } },
  { id: 'deep_vein', region: 'black_mine', name: '横肩偏井', once: [2],
    stocks: { black_iron: { start: 4, cap: 6, interval: 8, growth: 2, choices: [3, 4] },
      core: { start: 1, cap: 3, interval: 8, growth: 1, choices: [3, 4] } },
    creatures: { vein_sentinel: { start: 1, cap: 2, interval: 9, growth: 1, depletedFactor: 1.7 } },
    creatureText: { vein_sentinel: { present: '井口两面黑岩像肩骨似地拢到一起，车轮被挤得裂了一道缝。每次岩肩移动，石身中间就会闪一下。', absent: '井口只剩几块倒下的黑纹石，往碎车槽的路空出来了。' } },
    afterWinText: { vein_sentinel: '旧工具柜被撞上了井外的窄台。碎车槽内侧仍是一道露在石壁上的矿脉。' },
    afterOnceText: { 2: '井外的旧柜敞着，托刀的木格已经空了。井底露出的矿脉沿碎车槽延伸，右手还可绕回地面。' } },

  { id: 'silk_bough', region: 'snow_pass', name: '背风雪蜥径',
    stocks: {
      hide: { label: '石窝雪蜥蜕', start: 3, cap: 4, interval: 8, growth: 1, depletedFactor: 1.8, choices: [0] },
      hide_ice: { item: 'hide', label: '冰沿雪蜥蜕', start: 4, cap: 7, interval: 8, growth: 1, depletedFactor: 1.8, choices: [1] },
    },
    emptyText: '老石窝的蜥蜕拾净了。雪蜥咬出的几道浅窝还露在外头，低处绑着避冰口的石绳。' },
  { id: 'snow_fire', region: 'snow_pass', name: '护栈火棚', once: [0, 2, 3, 4, 5, 6],
    afterOnceText: {
      0: '守栈人收起换下的扶绳。火盆里还有红炭，他手边搁着一只缝到一半的护绳套。',
      3: '伤手的守栈人给自己缠上布带。另一人提着木槌，在棚口等上山的消息。',
      4: '守栈人把拓纸摊在火边，照着纸上的形状挑拣铜料。棚外那条老栈道已经挂上了新绳。',
      5: '守栈人把拓纸摊在火边，照着纸上的形状挑拣铜料。棚外那条老栈道已经挂上了新绳。' } },
  { id: 'snow_ladder', region: 'snow_pass', name: '石墙后的木梯', reveal: { item: 'snow_escort_note' }, once: [2],
    creatures: {
      snow_rail_lynx: { start: 2, cap: 2, interval: 0, growth: 0 },
      snow_rail_hawk: { start: 1, cap: 1, interval: 0, growth: 0 },
    },
    creatureText: {
      snow_rail_lynx: { present: '山猞把落在梯脚的兽骨咬得咯嘣响。', absent: '梯脚的兽骨散在雪里，底下露出两级踏板。' },
      snow_rail_hawk: { present: '一只灰翅鹰在梯沿盘旋，影子几次掠过扶手。', absent: '风把梯顶的落羽卷到峭壁外。' },
    },
    afterOnceText: { 2: '新系的布条沿梯身往上，指向第三根横梁。' } },
  { id: 'snow_beam', region: 'snow_pass', name: '第三根横梁', afterChoices: ['snow_ladder:2'], once: [2],
    creatures: {
      snow_rail_shell: { start: 1, cap: 1, interval: 0, growth: 0 },
      snow_rail_matron: { start: 1, cap: 1, interval: 0, growth: 0 },
    },
    creatureText: {
      snow_rail_shell: { present: '冰蜥伏在靠墙的横板上，硬尾时不时扫过栈道。', absent: '靠墙的横板空出了一段落脚处。' },
      snow_rail_matron: { present: '铜栓下伏着一只长角冰蜥。它一转身，前爪便扣进旧木。', absent: '铜栓下只剩几道深爪痕。' },
    },
    afterOnceText: { 2: '换过的扶绳缠在铜栓上，横梁外侧多了一道打紧的绳结。' } },
  { id: 'white_ravine', region: 'snow_pass', name: '露背的雪沟', once: [2],
    creatures: { snow_warden: { start: 1, cap: 1, interval: 18, growth: 1 } },
    creatureText: { snow_warden: { present: '雪地有一道新犁痕。远处伏着高背，呼吸声把雪粉一层层掀开。', absent: '风快把犁痕吹平了。沟里没有新脚印。' } },
    afterOnceText: { 2: '短栈护绳旁剩下一块横铁印。风沿雪沟灌上来，沿绳还能退到避风处。' } },

  { id: 'cloud_scree', region: 'sky_terrace', name: '浮光晶坡', once: [2, 3],
    stocks: {
      core: { label: '坡边灵晶', start: 3, cap: 5, interval: 8, growth: 1, depletedFactor: 1.5, choices: [0] },
      core_ridge: { item: 'core', label: '岩脊灵晶', start: 5, cap: 7, interval: 8, growth: 1, depletedFactor: 1.5, choices: [1] },
    },
    emptyText: '晶屑已拾净。高岩后有旧工台和嵌在石边的火盏架，雾从几道浅槽间吹过来。' },
  { id: 'old_observatory', region: 'sky_terrace', name: '偏影观星梁', once: [0, 2],
    afterOnceText: { 0: '星刻已拓下来了。梁背小槽里的木账片还在，反照石门的影子仍落在半尺之外。', 2: '梁背的小槽空了，边角只剩几道浅刮痕。雾散时，三道刻圈的影子还是偏着落下。' } },
  { id: 'mirror_gate', region: 'sky_terrace', name: '反峰镜门', afterChoices: ['old_observatory:0'], once: [2],
    creatures: { mirror_warden: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { mirror_warden: { present: '镜里有道握印的影子。梁影掠过时，它的右肩跟着沉了半寸。', absent: '镜里握印的身影已经散开。反照的远峰一时异常清楚。' } },
    afterOnceText: { 2: '空印座上还留着浅浅的手痕。镜外侧的路沿梁影往回。' } },
  { id: 'foundation_duel', region: 'ridge', name: '背钟试剑亭', reveal: { item: 'foundation_letter' }, once: [2],
    creatures: { foundation_duelist: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { foundation_duelist: { present: '守书人把长剑靠在柱边。桌角摆着一枚缺了一角的印章。', absent: '守书人收起长剑，伸手取桌角的印章。' } },
    afterOnceText: { 2: '桌上的墨迹还没干。守书人走到亭边，把刚才挪开的草垫铺回原处。' } },
  { id: 'foundation_kiln', region: 'kiln_valley', name: '旧丹窑内壁', reveal: { item: 'foundation_delivery' }, once: [2],
    creatures: { foundation_kiln_echo: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { foundation_kiln_echo: { present: '炉影每次掠过挡板，便用手遮住立板后那道缺半的金光。', absent: '窑影已经散了。灰不再贴着窑口倒吹。' } },
    afterOnceText: { 2: '立板的浅槽空了，只留下一圈旧印压过的黑边。' } },
  { id: 'foundation_court', region: 'snow_pass', name: '封石验药室', reveal: { item: 'foundation_snow_order' }, once: [2],
    creatures: { foundation_warden: { start: 1, cap: 1, interval: 0, growth: 0 } },
    creatureText: { foundation_warden: { present: '矮墙后炉火烧得很稳。护炉人示意你把封石之约压在灯盏下。', absent: '护炉人走到桌边，伸手抬起灯盏。' } },
    afterOnceText: { 2: '文案上压着冷掉的温盏，护炉人已经去换火口。' } },
];

const events = [
  { id: 'reed_banks', name: '浅水苇丛', text: '岸边铺着几块踏石。往深处是个回水湾。沿岸绕开深水，能望见一座旧船棚，那里不时传来刨木声。', choices: [
    { label: '挖浅处的苇芯', desc: '站在踏石上，手能伸到近岸的泥边。', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 2, loot: { reed: 2 }, enemy: null, outcome: '你从踏石边的泥里挑出长实的白苇芯。' },
    { label: '蹚过去挖深处的苇芯', desc: '露水沾在水湾那丛苇叶上。', days: 0.5, coins: 0, hp: -4, qi: 0, insight: 3, loot: { reed: 3 }, enemy: null, outcome: '你蹚到水湾，抽出底下发白的嫩芯。', injury: '泥里埋着碎蚌壳，拔脚时划破了小腿。' },
    { label: '沿岸去看看谁在刨木', days: 0.125, stay: true, outcome: '一个老渡工把裂桨架在石头上。「真会挑苇芯？匀些给我补桨，我手头有张旧山路图。」沿岸走过船棚，就到他的刨木滩。' },
  ] },
  { id: 'sunk_pack', name: '木桩旁的浅水道', text: '河边岔出一条浅水道，几根歪木桩从水里探出来。最外头那根卡着一只竹篓，桩内侧有条石路，沿着河弯往前。', choices: [
    { label: '把竹篓拉上岸', desc: '篓子的背带露在水面上，伸手够得着。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 1, loot: { lost_basket: 1 }, enemy: null, outcome: '你攥住背带，把竹篓从木桩旁拉起来。水顺着竹条滴下，篓口的扣还紧着。' },
    { label: '沿木桩内侧的石路往前看', desc: '几片卷起的木屑从河弯后漂出来。', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '石路绕过河弯。一个老渡工坐在沙滩上削船桨，脚边全是卷起来的木屑。' },
  ] },
  { id: 'mud_track', name: '碎石水眼', text: '碎石间冒着水泡，当地人管这儿叫水眼。一边是贴着水面的石滩，另一边是绕进芦苇的干土路。', choices: [
    { label: '靠近水边的石滩', desc: '石滩能站稳，从那儿看得见水眼深处。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mud_beast', outcome: '鞋底刚踩实，硬鳞便破了水。一头泥鳞兽扑上石滩。' },
    { label: '去干土路边捡松枝', desc: '碎石堆横在水边，漂来的枝条都卡在这里。', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 2 }, enemy: null, outcome: '你沿干土路绕过水眼，捡走卡在碎石间的松枝。' },
    { label: '沿土路上的脚印看看', desc: '脚印从苇丛里出来，要绕过一段光秃的干土。', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'reed_fox', openingRange: true, outcome: '一只苇尾狐从对面的苇丛里蹿出来，隔着一段干地朝你扑来。' },
    { label: '踩着石头往苇后探', desc: '水眼背后有几块石头排成一线，像是有人铺过。', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '拨开最后一丛苇，露出背雨的半截石渠，里面有旧柴火的焦痕。' },
    { label: '捡起土路边的油纸包', desc: '狐狸倒下时撞断了几根苇秆，油纸包从低处滚到了土路边。', afterFight: 'reed_fox', days: 0, loot: { ration: 1 }, outcome: '油纸里有过路人落下的一份干粮，系绳还好好的。' },
    { label: '到背水坡猎白耳兔', days: 0.25, enemy: 'reed_hare', openingRange: true, outcome: '一对白耳从坡下的短苇里抬起。野兔沿着没有遮挡的斜坡猛蹬过来。' },
  ] },
  { id: 'old_fire', name: '背雨石渠', text: '半截石渠能挡雨。小石炉砌在背风处，炉边搁着一口陶锅，锅沿的缺口高过水线。', choices: [
    { label: '添柴歇脚', desc: '石炉还通风，挨着背风一侧便能烤火。', need: { wood: 1 }, consume: true, days: 0.5, coins: 0, hp: 6, qi: 4, insight: 0, loot: {}, enemy: null, outcome: '火把石壁烘热，湿鞋上慢慢蒸出白气。' },
    { label: '捆些干柴', desc: '有人把松枝藏在渠边石板下，风吹不着。', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { wood: 3 }, enemy: null, outcome: '压在石渠里的松枝还干着，折一下便响。' },
    { label: '掀开渠底的破瓦', desc: '灰里露着瓦沿，边上像有划痕。', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { kiln_shard: 1 }, enemy: null, outcome: '瓦上的字是反着刻的。抹掉一层灰，才辨出「敲两下，停一停」。' },
    { label: '从冷炉边取下残纸', desc: '炉沿的砖缝夹着一点纸边。', days: 0.25, insight: 1, loot: { ember_fold: 1 }, outcome: '残纸还存着三道折痕。最里一层的松灰没散开，纸边却烧穿了。' },
    { label: '借石炉把猎物煮熟', desc: '锅还能用。烧一根干松枝，能把两份兽肉煮成两罐路上吃的浓汤。', need: { beast_meat: 2, wood: 1 },
      consume: true, stay: true, days: 0.75, loot: { meat_broth: 2 }, outcome: '你用清水刷了锅，把兽肉煮透，连汤撇进两只空陶罐。灶火灭了，只剩干松枝的香味。' },
  ] },
  { id: 'reed_ferryman', name: '渡工的刨木滩', text: '渡工把一柄裂桨架在石头上。脚下还有把旧桨，桨背露出几道刻线。对岸浅石围着一丛白苇。', choices: [
    { label: '把补桨的料递给渡工', desc: '「两份苇芯塞进裂口，再削一根松枝卡紧。我拿进山的路图跟你换。」', need: { reed: 2, wood: 1 }, consume: true, days: 0.25, coins: 0, hp: 0, qi: 0, insight: 3, loot: { ration: 1, ridge_rubbing: 1 }, enemy: null, outcome: '渡工从斗笠夹层取出沉钟岭的路图。新桨接牢后，他拿脚边那把旧桨比了比，又瞧了眼桨背上的刻线。' },
    { label: '往对岸的白苇走去', desc: '渡工把刨桨的小刀放回膝头。「那边有什么一直来回，我没看清。」', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'marsh_ghost', outcome: '脚下的浅石刚露头，一道没有脚的影子就横在白苇前。水鬼抱住两臂，挡着去路。' },
    { label: '帮他把旧桨翻过来', desc: '泥盖住了半截刻线，渡工用拇指擦了几下。', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 1, loot: { oar_mark: 1 }, enemy: null, outcome: '渡工擦去桨背的泥，给你看三根画得歪斜的船桩。「认准第三根，往断桅那头走，有道高埂。」' },
    { label: '采下对岸的熟苇芯', desc: '白苇就长在水边的浅石间，叶尖已经黄了。', guardedBy: 'marsh_ghost', days: 0.5, insight: 2, loot: { reed: 3 }, outcome: '踩过空下来的石路，你伸手从齐腰的白苇中抽出熟芯。' },
  ] },
  { id: 'bank_watch', name: '矮石堤', text: '有人在堤边歇脚，腰间别着一张折图，身边的石面上搁着一把钩刃。', choices: [
    { label: '跟拦滩客过招', desc: '「想借图？跟我过两招，赢了连这把备刀也拿去。撑不住就抬手，我收杖。」', days: 0.25, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bank_runner', outcome: '拦滩客把备刀留在石上，紧了紧腰带，横着木杖站稳。' },
    { label: '问有没有别的进山办法', desc: '那张折图上的船桨印像个记号，也许是渡工画的。', days: 0, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '他朝那几根歪木桩一抬下巴。「不必非跟我打。刨木滩的老渡工总往沉钟岭捎信。他正缺补桨的料，说不准肯跟你换张图。」' },
    { label: '等拦滩客兑现交手的约定', desc: '他解开腰间缚住折图的细绳，招手让你过去。', afterFight: 'bank_runner', days: 0, loot: { ridge_rubbing: 1, hook_blade: 1 }, outcome: '拦滩客把折图和备刀一起推过来。「说过的算数。走到北边倒钟下，细看图上那道岔。」' },
  ] },
  { id: 'drowned_mast', name: '断船桅旁的高岸', text: '一根折断的船桅斜插在木桩外。从高岸往下看，露出水面的石头把浅水分成两股。', choices: [
    { label: '踩上断桅杆，看看水下', desc: '断桅杆从高岸斜伸到水面，能沿着它往下看。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'mast_beast', outcome: '你刚踩上桅杆，缠在水底那头的水兽便张开头侧两道鳍。' },
    { label: '站在高岸上看水怎么流', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, outcome: '水流到断桅杆前便分成两股。你照水的一涨一落调了几次呼吸，那口闷气慢慢散了。回村找个清静地方，还可以照着练。' },
    { label: '拨开桅杆旁边的草', desc: '木缝里还有一点铜色，拨开水草就够得着。', afterFight: 'mast_beast', days: 0, loot: { path_charm: 1 }, outcome: '草里卡着半枚带孔的旧渡钱，钱上的记号还没被水磨尽。' },
  ], experiment: {
    id: 'find_eddy',
    desc: '站在高岸上，把一根苇秆放到水面，就能看出水往哪里流。涨水和退水时，岸边留下的水痕也不一样。',
    need: { oar_mark: 1, reed_lines: 1 },
    controls: [
      { id: 'release', label: '在哪里放下苇秆', options: [{ id: 'open_bank', label: '外滩边' }, { id: 'pole', label: '船桩旁' }, { id: 'stone_back', label: '露出水面的石头背后' }] },
      { id: 'water', label: '什么时候放', options: [{ id: 'rising', label: '水刚上涨时' }, { id: 'still', label: '水位不变时' }, { id: 'falling', label: '水刚退下时' }] },
    ],
    solution: { release: 'stone_back', water: 'rising' }, days: 0.5, insight: 2, reward: { eddy_note: 1 },
    misses: {
      release: { open_bank: '苇秆刚离手就被卷进外滩的主流，一直往下漂。', pole: '苇秆绕着船桩打了两个转，挂在木刺上。' },
      water: { still: '苇秆贴着石头停住，水面几乎没有动。', falling: '苇秆绕过石头，跟着退去的水漂向出水口。' },
    },
    outcome: '涨水绕过石头，苇秆反倒贴着石脚往回漂。你顺着它踏了两步，才发现外头的水虽急，石脚这一绺却推着人往里走。',
  } },
  { id: 'ore_rain', name: '落矿的冲沟', text: '泥水顺坡洗进冲沟，地上有一条碎石带。坡壁半腰是露出岩层的断口，沟底留着一道冲低的砂槽。沟边护篷下坐着个验矿人。', choices: [
    { label: '在沟边拾铁', days: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ore: 2 }, enemy: null, outcome: '洗掉浮泥，底下是寒铁。' },
    { label: '爬上坡去撬矿块', days: 1, coins: 0, hp: -6, qi: 0, insight: 3, loot: { ore: 3 }, enemy: null, outcome: '坡上有大块寒铁，连着石皮撬了下来。', injury: '下坡时一块松石滚下来，撞在膝上。' },
    { label: '问护篷下敲的是什么坯', desc: '验矿人在护篷里敲打半块旧剑坯，椅背上挂着一把磨窄了头的矿镐。', days: 0.5, insight: 2, loot: { blade_template: 1 }, outcome: '验矿人指给你看旧坯上的锤痕。「剑要留厚背。镐倒要打窄，站在坡脚的石沿上，一伸手正好够到矿缝。」他把断坯翻过来，给你看背面拓下的矿镐样子。他又指了指坡外。「旧铁扣下还有一条矿槽，锤影堵了矿篮。你能替我把路让开，我这儿备了工钱。」' },
    { label: '捞洗砂槽里反光的碎石', days: 0.75, insight: 1, loot: { core: 2 }, outcome: '泥砂漏下手掌，只有几块透着光的灵晶沉在筛底。' },
    { label: '站在石沿上，用矿镐撬坡矿', afterChoice: 2, fieldTool: 'miner_pick', days: 0.75, loot: { ore: 4 }, outcome: '镐头钩住岩缝，寒铁连一小层石皮落到脚边。你站在石沿上，避开了滚石的道。' },
  ] },
  { id: 'ledge_mine', name: '旧扣旁的窄矿槽', text: '窄槽拐过石沿就能看见。旧铁扣上还吊着矿篮的绳。压在槽前的石板有新锤痕，离外头的干石不算远。验矿人沿坡拎来了另一只篮。', choices: [
    { label: '顺着篮绳下到干石，拦住锤影', desc: '石沿到干石只有几步，锤影搬不动扣住篮绳的铁桩。退上来还踩刚才的沿。', days: 0.375,
      enemy: 'ore_wight', outcome: '锤尖在石板上磨出一道白线。你刚从篮绳旁松开手，锤影便踏过来。' },
    { label: '从篮绳旁撬下露出的矿层', desc: '挨着铁扣的石缝，一层寒铁和灵晶夹在一起。', days: 0.625, guardedBy: 'ore_wight',
      loot: { ore: 4, core: 2 }, outcome: '你顺着松开的石缝取了一批，放在干石上。' },
    { label: '替验矿人把悬着的矿篮提到干石上', desc: '「半篮是前些天落在这儿的。你打退了锤影，帮我提到干石上，我就能自己收绳。」',
      days: 0.125, afterFight: 'ore_wight', perWin: true, coins: 8, loot: { ration: 1 }, stay: true,
      outcome: '验矿人接住篮子，从篮底倒出自己留下的矿屑。他数好工钱，把带来的另一包干粮分给你。' },
  ] },
  { id: 'empty_oven', name: '歇炉的茶棚', text: '棚檐还能挡雨。石灶留着烧过的痕，旁边一块薄板挡着没淋湿的柴。', choices: [
    { label: '在石灶里添柴，烤衣歇脚', need: { wood: 1 }, consume: true, days: 0.5, coins: 0, hp: 9, qi: 6, insight: 1, loot: {}, enemy: null, outcome: '湿衣蒸出了白气，烤过火才慢慢暖透。' },
    { label: '掀开木板取些柴', days: 1, coins: 0, hp: 0, qi: 1, insight: 3, loot: { wood: 2, echo_note: 1 }, enemy: null, outcome: '木板反面画着个侧耳贴石的人，掌下还刻有几道难认的线。' },
  ] },
  { id: 'miner_echo', name: '有回声的矿道', text: '矿道深处有两条岔口。旁孔窄，风贴着岩壁往外钻。再高些还有道透光的石缝。', choices: [
    { label: '沿主道往里走', desc: '主道一直往下，尽头两条矿脉泛着亮光。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'ore_wight', outcome: '持锤的影子一转身，握紧石锤挡住了矿壁。' },
    { label: '侧身钻进旁孔', desc: '旁孔拐在主道外侧，风夹着干粉。脚边的碎石有铁色。', days: 1, coins: 0, hp: 0, qi: -2, insight: 3, loot: { ore: 2 }, enemy: null, outcome: '你侧身绕过岩角。那边的锤声透不过厚岩，脚下有些松动的寒铁。' },
    { label: '贴着透光的石缝往外看', days: 0.125, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: null, outcome: '石缝对面有个浅石洞，就是回声石洞。洞口朝着山背，顺矿口外的窄坡可以绕过去。' },
    { label: '去主道的矿壁撬松矿脉', desc: '有人沿石壁凿了几道槽，寒铁和灵晶从槽头露出来。', guardedBy: 'ore_wight', days: 1, insight: 2, loot: { ore: 3, core: 2 }, outcome: '你沿先前留下的锤槽撬石，分开寒铁矿片和有光的灵晶。' },
  ] },
  { id: 'rope_run', name: '断绳坡', text: '货车滑到坡下，老挑夫还在往上拖。断了一半的牵绳吊在石梁上，车辙边散着松碎石。', choices: [
    { label: '从侧坡绕下去帮挑夫', days: 1, coins: 10, hp: 0, qi: 0, insight: 2, loot: { ration: 2, plate_lacing: 1 }, enemy: null, outcome: '挑夫捆好货，分了口粮和盘缠，又从裂开的护板上拆下一片给你。他指向矿口旁的窄坡：「绕到山背就是回声石洞。旧矿工到那儿躲过风。」' },
    { label: '在车辙旁守一会儿', desc: '车辙截断了一串爪印，能看清它在哪堆碎石里断的。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'stone_badger', outcome: '石甲獾钻出碎石，四爪抓住了坡面。' },
  ] },
  { id: 'stone_niche', name: '回声石洞', revisit: true, text: '浅石洞朝着山背。伸手摸过洞口，两侧岩面让过路人摸得发亮。', choices: [
    { label: '撬开石缝，取里面的纸', days: 2, coins: 0, hp: 0, qi: -3, insight: 3, loot: { core: 1, ford_chart: 1 }, enemy: null, outcome: '石缝里压着一张旧水图。正面画的是闭潮渡，背面另有一条去村口灯座的渠，渠口的三根桩里有一根折过。' },
    { label: '提起洞口的破铃', desc: '铃边贴着石壁，一角后面还留着空隙。', days: 1, coins: 5, hp: 0, qi: 0, insight: 1, loot: { ore: 1, stone_rubbing: 1 }, enemy: null, outcome: '破铃碰到石壁，先响一声。等第二阵回声传来，才震下一片寒铁。铃下还压着几枚旧灵钱。沿石缝望去，几级石阶绕到了裂钟背后。' },
    { label: '拿瓦角比对铃沿', desc: '两处凹弧的宽窄正好能接上。', hidden: true, need: { kiln_shard: 1 }, days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: { bell_clapper: 1 }, enemy: null, outcome: '照瓦上的旧字叩完，铃腹发出很短的一声。系着细缆的铃舌从裂口滑了出来。' },
  ], experiment: {
    id: 'read_echo',
    desc: '用杖头可以敲响洞口的破铃。旁边的岩石有齐腰高，刚好够伸手撑住。近处的一声过去后，洞里还会传出一声回响。',
    need: { echo_note: 1, stone_rubbing: 1 },
    controls: [
      { id: 'hand', label: '手怎么放', options: [{ id: 'back', label: '用手背贴住岩面' }, { id: 'hover', label: '手悬在岩面前' }, { id: 'palm', label: '用掌心贴住岩面' }] },
      { id: 'beat', label: '什么时候把气往下沉', options: [{ id: 'first', label: '刚听见铃响时' }, { id: 'second', label: '听见第二声回响时' }, { id: 'quiet', label: '两声都消失以后' }] },
    ],
    solution: { hand: 'palm', beat: 'second' }, days: 0.5, insight: 2, reward: { echo_method: 1 }, learnArts: ['earth_echo'],
    misses: {
      hand: { back: '石面轻震，手背一麻。那股震动到腕骨前就散了。', hover: '你听见铃响，却只觉得手前有阵冷风。' },
      beat: { first: '你先沉了气。等洞里那一声传来，手掌已经松了力。', quiet: '你再把气沉下去，洞里只剩细细的摩擦声，手掌一点震动也没摸到。' },
    },
    outcome: '第二声回响震到手掌，你的胳膊没有弹开，脚下倒站得更稳了。离开石壁再试，那股劲还能收进胳膊。你练成了抱地听钟。',
  } },
  { id: 'cracked_bell', name: '裂钟背面', text: '旧钟裂成了两瓣，底座几乎压进坡里。钟后墙上的小凹洞里有只铜挂钩。山背还有一条窄路能走。', choices: [
    { label: '从裂片间靠近钟座', desc: '裂口时宽时窄，破片下面透出一线灰光。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'bell_wraith', outcome: '钟魄猛地抬起头，破片一齐响了。' },
    { label: '退回山脊', days: 0, coins: 0, hp: 0, qi: 0, insight: 1, loot: {}, enemy: null, outcome: '退过山脊，背后的钟声才听不见。' },
    { label: '取下铜钩上的小铃', desc: '铜钩紧挨裂开的大钟，钩上小铃倒是完好。', afterFight: 'bell_wraith', days: 0, loot: { bell_charm: 1 }, outcome: '你绕过钟座，从铜钩上解下定声铃。晃了一下，铃里的铁片没有动。' },
  ] },
  { id: 'low_tide', name: '闸外浅阶', text: '退水露出几级能落脚的石阶，阶角有一道积砂的凹处。再往下隔着一道破坎，旧船绳斜伸进深槽。', choices: [
    { label: '扫起浅阶上的亮晶粒', days: 1, coins: 0, hp: 0, qi: 0, insight: 2, loot: { core: 2 }, enemy: null, outcome: '趁潮水未回，把阶角的细砂淘掉，捡出还透着光的灵晶。' },
    { label: '走到下游船绳边', desc: '船绳能当扶手，水下轮廓得靠近些才认得出。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'rope_eel', outcome: '水里一团长影卷过船绳，是一条缠舟兽。' },
    { label: '握着船绳扫出槽底的灵晶', desc: '槽底粗晶沉得深，握紧船绳才够得着。',
      ambush: { enemy: 'rope_eel', chance: 0.3, outcome: '船绳猛地一绷，缠舟兽从水槽里翻了上来。' },
      days: 1, insight: 2, loot: { core: 3 }, outcome: '你扶稳船绳，顺水扫开碎砂。亮晶咔嗒碰在石坎底下。' },
    { label: '去东边浅湾捉银背鱼', days: 0.375, enemy: 'ford_silver_dace', outcome: '你截在回水边。银背鱼跳出水面，背鳍朝掌心刮过来。' },
    { label: '从闸墩石缝引出黑纹蟹', days: 0.5, enemy: 'ford_shale_crab', outcome: '石缝里伸出一对黑钳，蟹拖着满身湿砂横挤出来。' },
    { label: '沿外滩拖印找泥鳞兽', desc: '外滩开阔，拖印从干砂一直延伸到水边。', days: 0.5, enemy: 'mud_beast', openingRange: true, outcome: '远处的芦苇向外一倒，泥鳞兽越出水边，贴着干砂冲过来。' },
    { label: '趁退水绕过石脊，从背面淘灵晶', desc: '绕到船绳对岸，站上那块平石，也能够到同一道槽底。', ebbOnly: true, days: 0.375, loot: { core: 2 },
      outcome: '你从外侧的平石上伸筛去淘槽底，船绳那头的水声隔着整道石脊。' },
  ] },
  { id: 'boat_shade', name: '没篷的渡舟', revisit: true, text: '老船卡在闸边，船舷正好挡着风。旧船绳挂在外侧，绳圈上结了一层白盐。船头的灯架熏黑了一半。', choices: [
    { label: '坐上船里的凳子歇脚', days: 1, coins: 0, hp: 13, qi: 8, insight: 1, loot: {}, enemy: null, outcome: '船舷挡住了风。你坐到水势变缓，手脚才不再发冷。' },
    { label: '捞起船底的木柜', days: 1, coins: 15, hp: -4, qi: -2, insight: 2, loot: { core: 1 }, enemy: null, desc: '船沿下有两只木柜脚。门板被水压着，还没漂开。', outcome: '柜门里积着碎灵晶，摸到底还有几枚灵钱。', injury: '抬柜时水一顶，胳膊撞上了船底的一圈铁带。' },
    { label: '比一比铃上的绳子和旧船绳', desc: '两根绳子的结都朝同一边收紧，绳圈也磨在同一边。', hidden: true, need: { bell_clapper: 1 }, days: 0.5, coins: 0, hp: 0, qi: 0, insight: 1, loot: { backwash_mark: 1 }, enemy: null, outcome: '把两个绳圈并排挂起来，旧船绳就松开了一截。船身摆开半尺，露出一道朝上游的槽，槽口夹着块薄铜片。' },
  ], experiment: {
    id: 'trace_backwash',
    desc: '瓦能斜靠在灯架上，下面还有半截灯芯。船里有个短钩，船外的弯钩上结了白盐。灯架脚下还有两条能插进铜片的窄缝，一条积着干灰，一条留着水痕。',
    need: { kiln_shard: 1, bell_clapper: 1, backwash_mark: 1 },
    controls: [
      { id: 'tile', label: '瓦上有字的一面朝哪儿', options: [{ id: 'fire', label: '朝着灯火' }, { id: 'away', label: '背对灯火' }] },
      { id: 'hanger', label: '把铃里的铁片挂在哪儿', options: [{ id: 'inner', label: '船里的短钩' }, { id: 'outer', label: '船外的弯钩' }] },
      { id: 'plate', label: '铜片插到哪一边', options: [{ id: 'wall', label: '靠船里的窄缝' }, { id: 'water', label: '靠水面的窄缝' }] },
    ],
    solution: { tile: 'away', hanger: 'outer', plate: 'water' }, days: 0.75, insight: 3, reward: { secret_pass: 1 },
    misses: {
      tile: { fire: '烟很快熏黑了刻字的一面，瓦上的纹路都看不清了。' },
      hanger: { inner: '短钩离灯太近。铃里的铁片摆了几下，投出来的影子都被船舷挡住。' },
      plate: { wall: '铜片上只照亮半道刻纹，船外的水面还是黑的。' },
    },
    outcome: '灯照过瓦背，铜片上的水纹和铁片的影子接在一起。顺着影子，你摸到了船外第一块能踩的石头。更多石头逆着水一直排到拐角。那儿屋檐下亮着盏旧红灯，是回灯埠。',
  } },
  { id: 'tide_keeper', name: '旧闸深槽', text: '两扇旧闸门悬在石槽之上，水从缝隙往外涌。岸边的高阶上有人拿旧枪头当扶杖。', choices: [
    { label: '等水低了跨进闸间', desc: '闸门下有排低石阶。水落一些，脚就能踩实。', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'tide_spirit', outcome: '两扇门之间锁链一绷，守潮灵转过了身。重锁压在闸边的方槽上，印钮在锁链下露出来。' },
    { label: '去高处看看旧枪的接头', days: 1, coins: 0, hp: 0, qi: 1, insight: 3, loot: { spear_joint: 1 }, enemy: null, outcome: '听潮人用旧枪头指了指浪线，取下一块松动的接头给你。' },
    { label: '取出闸边石槽里的镇渡印', desc: '重锁松脱，原先被压住的印钮可以伸手提起来。', afterFight: 'tide_spirit', days: 0, loot: { seal: 1 }, outcome: '你把镇渡印提离石槽，印底还带着同一层湿泥。' },
  ] },
  { id: 'flood_lines', name: '刻洪痕的石壁', text: '洪痕深浅不一，最上头一行留了个「灯」字。壁根积着一层细砂，石缝里露出一点泡软的布角。', choices: [
    { label: '从石缝里拽出布包', days: 1, coins: 0, hp: 0, qi: 0, insight: 4, loot: { tide_talisman: 1, tide_note: 1, formula_tide: 1 }, enemy: null, outcome: '布包里有旧符和闸工的潮牌。牌背写着涨落时刻，翻开还夹着一页蜡封的济潮丹方。' },
    { label: '沿壁根摸寻碎灵晶', days: 1, coins: 0, hp: 0, qi: 0, insight: 1, loot: { core: 1 }, enemy: null, outcome: '石缝一松，碎灵晶露了出来。水还没漫过鞋面。' },
  ] },
  { id: 'lock_deck', name: '悬锁木排', text: '闸门的绳子一边吊着沉铁块，另一边牵着木排。木排搁浅的一头挂了个漆盒，滴水的那头盖着几级石阶。', choices: [
    { label: '解下铁环上的漆盒', desc: '盒扣用布裹住，提绳在比水面高半尺的铁环上。', days: 1, coins: 0, hp: 3, qi: 0, insight: 1, loot: { ration: 3 }, enemy: null, outcome: '木排搁浅的一端能坐。你坐下解开盒扣，里面是没泡水的干粮。' },
    { label: '抬起铁块，挪开木排', days: 1, coins: 7, hp: 0, qi: -3, insight: 3, loot: { core: 2, gate_buckles: 1 }, enemy: null, outcome: '木排一挪开，石缝里露出碎灵晶、几枚灵钱和一串旧护甲扣。底下的石阶通往深槽，侧边有条窄路通向船工的棚子。' },
  ] },
  { id: 'ford_relay', name: '旧闸外的驮棚', text: '窄铺道到头挂着油布。老船工在量棚柱，柱脚已经进了水。墙上钉着他以前从松场走过的路图。', choices: [
    { label: '给船工送来支柱和口粮', desc: '「我得在这里守到雨住。松场的路图你要有用，拿一张去。」', need: { wood: 4, ration: 3 }, consume: true, days: 0.5, coins: 0, hp: 0, qi: 0, insight: 2, loot: { pine_pass: 1 }, enemy: null, outcome: '老船工支稳棚柱，指着图上断桥后的几棵松树告诉你哪一边尚能过去。' },
    { label: '坐在棚里等雨歇', days: 0.5, coins: 0, hp: 5, qi: 3, insight: 0, loot: {}, enemy: null, outcome: '风把雨推到驮棚另一面，你往里让了半步。' },
  ] },
  { id: 'upstream_lights', name: '朝上游的灯架', text: '成排旧灯都朝上游开口，灯座外淌着水，引火线却能从干处续进槽里。灯架背后正好避风。', choices: [
    { label: '用松枝点起槽里的火', need: { wood: 1 }, consume: true, days: 1, coins: 0, hp: 0, qi: 4, insight: 2, loot: {}, enemy: null, outcome: '火沿干槽传进灯腹，半寸旧灯芯缩了一下便亮了。迎着这点火光坐了一阵，水汽也从袖口散开。' },
    { label: '在灯座背风处坐一阵', days: 1, coins: 0, hp: 14, qi: 7, insight: 1, loot: {}, enemy: null, outcome: '埠里少有潮声，连风也是绕开这里走的。' },
  ] },
  { id: 'sunken_mooring', name: '低水船桩', text: '船桩低得几乎碰水。一件湿蓑衣搭在桩边，桩顶是一盏有铜罩的旧灯。一截绳结贴水浮着，绳头牵进苇丛。', choices: [
    { label: '下埠拨开湿蓑衣', days: 1, coins: 0, hp: 0, qi: 0, insight: 0, loot: {}, enemy: 'wick_husk', outcome: '蓑衣下那只手一翻，灯芯升起一线火。' },
    { label: '站在岸上松开浮绳', days: 0, coins: 0, hp: 0, qi: 0, insight: 2, loot: { ration: 1 }, enemy: null, outcome: '绳套松开，缠在旁边的一只粮匣漂了回来。' },
    { label: '用松枝点亮桩灯', desc: '灯芯卷在铜罩里，没被雨打湿。', afterFight: 'wick_husk', need: { wood: 1 }, consume: true, days: 0.25, qi: 4, insight: 2, loot: {}, outcome: '你借松枝点起桩灯，盖回挡雨的铜罩。靠桩坐了一会儿，胸口的沉滞才松开。' },
  ] },
  { id: 'still_pole', name: '风口灯杆', text: '老人提着灯站在风口，火苗弯过来又自己站直。脚下灯杆缠过几圈旧缆，杆上还能认出旧渡的烙印。', choices: [
    { label: '问他风里怎么护灯', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 3, loot: { lamp_sketch: 1 }, enemy: null, outcome: '「看手。」老人把灯转向风里，迎风的那只手一撇，火苗便直了。' },
    { label: '和他聊聊旧渡', days: 0.5, coins: 0, hp: 0, qi: 0, insight: 2, loot: {}, enemy: null, outcome: '老人指着埠外。「东西放在三处。我要是跟船散了，涨潮也能摸回来。」' },
  ] },

  { id: 'pine_stand', name: '刮脂松架', text: '箩筐搁在刮脂架上，架脚有一圈旧松脂。另一边是几棵矮松，横枝贴着树干往下垂。', choices: [
    { label: '收架下积脂的松木片', days: 1, qi: 0, insight: 2, loot: { wood: 4 }, outcome: '松脂把几片干松木粘在一起。捡走厚片，树皮浅槽还能继续滴脂。' },
    { label: '解下挂住的枯枝', days: 0.75, insight: 1, loot: { wood: 3 }, outcome: '枯枝一扳就下来。将细枝折齐，比拖回去轻省。' },
    { label: '翻看架头的弯松条', desc: '一截弯松条刚好嵌进箩筐上面的弧槽。', days: 0.25, insight: 2, loot: { bow_stave: 1 }, outcome: '松条底下有量弦的刻线。这是猎人拿来试韧皮条受力的弓样。' },
  ] },
  { id: 'timber_bridge', name: '缺板的驮桥', text: '赶车人用一块尖木塞在车轮底下，车停在断开的桥板前。他扶着车，手里是一张画着车轮印的旧图。石墩背后还算避风。', choices: [
    { label: '给赶车人松木补桥', desc: '赶车人用胳膊顶住车轮。「厚木补缺口，薄木带松脂的烤软了填缝。桥能走了，我就把窑车的路图给你。」',
      need: { wood: 5 }, consume: true, days: 1, insight: 3, loot: { kiln_tracks: 1, ration: 3 }, outcome: '赶车人指给你看松树根边的两道车轮印。桥补好了，沿着车轮印绕山便能进窑谷。' },
    { label: '在石墩背后歇脚', days: 0.5, hp: 6, qi: 4, insight: 0, loot: {}, outcome: '石墩挡掉了山口横风，你把肩上的箩筐靠到石面。' },
  ] },
  { id: 'pine_hollow', name: '翻车的松沟', text: '旧窑车翻在树沟。车轴上绑着看不清的木签，车边踩出来的爪印很深。', choices: [
    { label: '靠近树沟里翻倒的窑车', days: 0.75, enemy: 'pitch_bear', outcome: '一只灰脊松熊从车后滚下来，先把车轴压进湿土。' },
    { label: '沿斜沟绕回松架', days: 0.125, insight: 1, loot: {}, outcome: '你沿沟边走稳脚。转过土脊，回头已看不见窑车。' },
    { label: '拾起小路边的木签', desc: '松熊倒下时撞歪了车轴，绳上的木签掉到沟外。', afterFight: 'pitch_bear', days: 0, loot: { kiln_tracks: 1 }, outcome: '车签背后刻着窑车出入的双车辙。老道在贴着松根的那一边转向窑谷。' },
  ] },
  { id: 'pine_ledges', name: '背阴的断肩崖', text: '风折的松杈落到旧凿痕里，背阴处的松脂凝在木皮上。崖口朝外的一边常被风吹空。', choices: [
    { label: '从松枝之间拣厚木片', days: 1, insight: 2, loot: { wood: 4 }, outcome: '背阴处不晒，松木上的厚脂还粘手，几片能带回去做活。' },
  ] },
  { id: 'pine_spar', name: '索棚拳场', text: '看守绳桥的棚子外有块空地，铺着摔倒时能垫住人的草垫。看桥人换班前，偶尔在这里跟过路人切磋。', choices: [
    { label: '接下守索人的试刀礼', days: 0.5, enemy: 'road_sparrer', outcome: '守索人把礼刀放回架上，自己抄起一把钝练刀。「接得住几招，这把新刀就归你。」' },
    { label: '替看桥人把草垫收好', days: 0.25, insight: 1, loot: {}, outcome: '你把沾泥的一面朝外叠好。棚边腾出的路能直接走回木架。' },
    { label: '向轮值的守索人领试刀礼', desc: '守索人把架上那把习刀转过来，柄朝着你。', afterFight: 'road_sparrer', perWin: true, days: 0, loot: { trail_cutter: 1 }, outcome: '守索人把架上那把习刀递过来。「算你这次赢。刀归你，我还得去换班巡索。」' },
  ] },

  { id: 'clay_bank', name: '白泥洗坯坡', text: '坡根是水冲出来的几个窝。绕过一片灰壳，坡腰的干泥带压在砂层上。', choices: [
    { label: '蹲在坡根铲白泥', days: 1, insight: 2, loot: { kiln_clay: 4 }, outcome: '白泥能捏成团，搬到筐底也没有散开。' },
    { label: '顺着干泥带挖一筐', days: 1.25, hp: -5, insight: 2, loot: { kiln_clay: 6 }, outcome: '干壳底下罩着很厚一层白泥。', injury: '砂层松了，你滑下来时被坡根的硬泥擦伤。' },
  ] },
  { id: 'abandoned_kiln', name: '冷下来的老窑', text: '窑门积着灰，固定石牌的铁圈有被撬过的痕迹。灰被风吹出几道波纹，墙边还靠着一段烧焦的木柄。', choices: [
    { label: '从铁圈下取出石牌', days: 0.5, insight: 3, loot: { kiln_manual: 1 }, outcome: '石牌刻着怎么掌火，还有落灯村丹师安蒲的印。铁圈一松，灰从缝里吹向窑后一道低门。那扇门通往烟道。' },
    { label: '靠灰线后的平石歇脚', days: 0.5, hp: 6, qi: 5, insight: 0, loot: {}, outcome: '平石替你挡住了穿窑风，灰没有吹到衣领里。' },
    { label: '擦去木柄末端的焦灰', days: 0.25, insight: 2, loot: { resin_tamper: 1 }, outcome: '木柄裂开，露出灌松脂的小孔。尾端还刻着守炉人用来聚气的手势。' },
  ] },
  { id: 'kiln_carter', name: '药篓车棚', text: '赶车人扶着裂开的车板，脚边竖着空药篓。篓绳的结和村里的打法不一样，车底还压着一团旧布。', choices: [
    { label: '给赶车人材料补车板', desc: '他晃了晃装药篓的隔板。「拿硬泥填，再用松脂封上。你若想去篁泽，我这儿有张过竹桥的图。」',
      need: { kiln_clay: 6, wood: 3 }, consume: true, days: 1, insight: 4, loot: { herb_tie: 1, ration: 3 }, outcome: '赶车人补好车板，解下一截旧药篓上的绑绳递给你。绳边缝的一小块丝布画着通往篁泽的竹桥。' },
    { label: '掀起车底的旧篷', desc: '车轮下垂着一角篷布，底下压着两团没淋湿的泥。', days: 0.5, insight: 1, loot: { kiln_clay: 2 }, outcome: '旧篷下还有两团耐火泥。赶车人用不着这么多，便匀给你。' },
  ] },
  { id: 'kiln_flue', name: '废窑烟道', text: '墙上的烟痕一直伸到沟外。半张烧焦的纸压在碎砖间，坡下有温水渗进来，沟底沉着黑亮的砂。墙边的旧石柜半开着。', choices: [
    { label: '掰开靠外的窑砖看一眼', days: 0.75, enemy: 'cinder_hound', outcome: '窑砖一掀，有团炉灰抖成犬形扑出。' },
    { label: '退到有风的地方拍灰', days: 0.125, insight: 1, loot: {}, outcome: '窑口风大，袖上沾着的灰一拍便沿墙散开。' },
    { label: '揭下碎砖间的焦纸', days: 0.5, insight: 3, loot: { foundation_ledger: 1 }, outcome: '纸上留了三枚缺角的旧印。末尾还写着一句话。「想凑齐这炉的丹方，找落灯村的安蒲对印。」' },
    { label: '用碎瓦淘窑沟里沉下的亮砂', days: 0.75, insight: 1, loot: { black_iron: 2 }, outcome: '温水把细灰带走，碎瓦内只剩几粒能在火里立住形的暗金。' },
    { label: '取石柜底未烧过的耐火泥', desc: '柜子避雨，底下有一方还裹着布的原泥。', guardedBy: 'cinder_hound', days: 0.5, insight: 1, loot: { kiln_clay: 3 }, outcome: '穿过堆砖，把柜底的泥料提出来。裹泥的厚布隔开了窑灰。' },
  ] },

  { id: 'herb_beds', name: '银纹药田', text: '药田低处积水，叶背有银纹。最低处的叶柄柔软，泽医把那几排留作育种。', choices: [
    { label: '把上排的老叶剪下来', days: 1, insight: 2, loot: { reed: 4 }, outcome: '你只剪摸得着的粗柄，水下的细芽没有受伤。' },
  ] },
  { id: 'mist_shelter', name: '垫高脚的药棚', text: '泽医在垫高脚的竹席上扎药包。窗外的水线已经接近台阶，席上放了块压出药槽的木板。', choices: [
    { label: '给泽医交叶和烘干用的枝条', desc: '「阴雨浸坏了这一批，我得给矿队重扎几包药。你若进矿脉，带我的引矿签过去。」',
      need: { reed: 8, wood: 4 }, consume: true, days: 1, insight: 4, loot: { mine_guide: 1, ration: 3 }, outcome: '泽医把木片从药匣上拆下，指给你看哪边的石槽连着玄砂矿脉。' },
    { label: '问泽医板上的凹槽怎么用', desc: '木板上刻了几道不同深浅的槽，中间压着一张试药的便条。', days: 0.5, insight: 2, loot: { herb_press: 1, formula_leaf: 1 }, outcome: '泽医递来一页清脉饮丹方，又指着板上新刻的那道。「原本从蒲根底下取水，最近底下成了窝。蒲根旁还搭着两块旧木板，你过去当心。」' },
    { label: '拿滴水图和泽医对一对药槽', afterChoice: 1, hidden: true, need: { phase_chart: 1 }, days: 0.25, stay: true,
      desc: '眼前的两只药罐都接着细槽。泽医拿起碗尝了一点，又搁回去。「一边补血，一边定神。补血这罐滴得太快，两味配不匀。」',
      loot: { formula_heart: 1, heart_pill: 1 },
      outcome: '泽医照着图挪了挪罐脚下的竹片。等两股药汁一起滴进碗里，他才把碗移到小炉边。「这回两味能收到一丸里了。」他包好一枚养心丸，又将抄下的方子递给你。' },
  ] },
  { id: 'herb_den', name: '蒲根下的水洞', text: '两块旧木板搭着泥岸，一头挨药棚，一头伸到蒲根下面。取水槽斜卡在洞口，槽尾接着一排药草。板头旁有灶眼，沿干岸几步就能回到药棚。', choices: [
    { label: '踏上木板，朝水洞里探', desc: '走板面中间最省脚力。底下的石缝都通着，水一搅就看不清来的是谁。', days: 0.125,
      encounter: herbDenPack, outcome: '里头的水一下越过板面，你脚边窜出一道影子。' },
    { label: '蹲在板头，看看蒲根在水下往哪伸', days: 0.25, stay: true,
      outcome: '绕过横根有一小片干岸，从那儿能望见对面浅水。泽医在板头比了比手腕。「我见过有人照老蜥的颈甲打护臂。颈甲就拿来做个样子，真入炉还是得攒一批厚甲片。」' },
    { label: '踩干石绕到洞边的干岸', desc: '要绕过横根。站上干岸，能隔着一段浅水看见石缝的动静。', afterChoice: 1, days: 0.375,
      encounter: herbDenPack, openingRange: true,
      outcome: '你踩上干岸。对面的浅水猛地拱起，一道影子在石缝外露了头。' },
    { label: '给板头的石灶添柴，缓一缓', desc: '在靠药棚的高地上生火，湿衣能烤干。灶眼下次还得等余火熄透。', days: 0.5, stay: true,
      need: { wood: 1 }, consume: true, cooldown: 2.25, cooldownText: '旧灶底下还有闷火，得等它凉透。', hp: 10, qi: 8,
      outcome: '灶眼冒出一缕烟。你把湿袖烤暖，调匀气息，再听水洞里的响动。' },
    { label: '把歪斜的取水槽搭回原位', desc: '槽口搁在外面，里端却伸到洞里。得等那些石缝都静下来才能挪。', days: 0.25, stay: true,
      guardedBy: herbDenPack, outcome: '槽里终于过了水。泽医提着竹篮过来，拨开药田里的枯叶。「根还活着，外圈有几茎已经能剪。嫩的先留着，这水够它们长。」' },
    { label: '采下引水槽旁长齐的灵草', desc: '靠外一排已经有几茎老叶，叶背的银纹长全了。', afterChoice: 4, days: 0.75,
      loot: { reed: 3 }, outcome: '你顺着药田边剪叶，留了还嫩的草心。' },
  ] },
  { id: 'vine_pond', name: '白藤塘', text: '白藤沿塘边翻卷，几块踏石伸进凹水里。岸外有块斜石，向上能看到坝根。', choices: [
    { label: '沿浅滩的蹄印找藤鹿', desc: '站在岸边能望见对岸，蹄印横穿一片浅水。', days: 0.75, enemy: 'vine_stag', openingRange: true, outcome: '白角从对岸的藤下挑起来，藤鹿踩开浅水，朝这边赶来。' },
    { label: '沿斜石绕到岸外听一会儿', days: 0.125, qi: 3, insight: 1, loot: {}, outcome: '藤影在另一边摇动。留在斜石上时，呼吸渐渐平匀。' },
    { label: '踩过浅水去剪银脉叶', desc: '药叶长在凹水里，从踏石上俯身正好够得到。',
      ambush: { enemy: 'vine_stag', chance: 0.35, outcome: '踏石边溅起泥水，一只白角藤鹿从藤后急冲过来。' },
      days: 0.75, insight: 2, loot: { reed: 4 }, outcome: '你在踏石上掐下熟叶，细根还扎在泥里。' },
    { label: '顺着上游的大蹄印走', desc: '大蹄印沿水往上，没入一架粗藤后面。', days: 0.75, enemy: 'vine_king', outcome: '粗藤往两边一分，一只老鹿压低交错的白角，堵在坝根。' },
    { label: '到背水坡剪上游的银脉叶', desc: '倒藤外侧能踩稳脚。坡上的叶已长开。', afterFight: 'vine_king', guardedBy: 'vine_king',
      days: 1, insight: 3, loot: { reed: 4 }, outcome: '你站在背水坡把熟叶剪下来，水从旧鹿槽绕过去。' },
  ] },

  { id: 'mine_tailings', name: '黑砂洗矿槽', text: '长石槽把水往低处引。槽沿的铁钉拦着黑砂，槽内水更深，底下是碎岩会卡住的背水缝。', choices: [
    { label: '在外沿筛去浮砂', days: 1, insight: 3, loot: { black_iron: 4 }, outcome: '你慢慢筛走细砂，筛里剩下颗粒粗的暗金。' },
    { label: '下到槽内撬重石', days: 1.25, qi: -2, hp: -5, insight: 3, loot: { black_iron: 6 }, outcome: '铁镞深入石缝以后，黑石顺水松了。', injury: '槽底的砂扫住了鞋，你抽身时被来水推撞了膝头。' },
  ] },
  { id: 'winch_house', name: '转盘卡住的矿棚', text: '收绳的转盘卡住了，断掉的木接头掉在煤灰上。矿工拿一截铁零件贴在转盘另一边量尺寸。', choices: [
    { label: '给矿工材料修转盘', desc: '「盘转得起来，才够得着外头的梯子。给我点好铁和硬泥，我把翻雪关用的木牌给你。」',
      need: { black_iron: 6, kiln_clay: 4 }, consume: true, days: 1.25, insight: 4, loot: { snow_token: 1, ration: 4 }, outcome: '转盘动了一圈。矿工爬到外梯旁，从石架上取下翻雪关的木牌递给你。' },
    { label: '翻过铁零件看看接头', days: 0.5, insight: 3, loot: { vein_pattern: 1, arrow_pattern: 1 }, outcome: '矿工让你带走那块短铁样，又把从矿壁拔下的一根包铁箭递给你比对。' },
    { label: '替矿工烧炉、换一袋灵晶', afterChoice: 0, stay: true, cooldown: 4,
      desc: '「提矿筐的转盘能用了，一趟能多筛出四枚灵晶。给夜里的弟兄带两罐肉汤，再添根干柴、留五钱，我们换着拿。」',
      days: 0.5, need: { meat_broth: 2, wood: 1 }, coins: -5, consume: true, loot: { core: 4 },
      outcome: '矿工把肉汤放到炉边温着，从刚提上来的湿布里倒出四枚筛净的灵晶。' },
  ] },
  { id: 'deep_vein', name: '横肩偏井', text: '井边挤着两道肩形黑岩，遮住一只倒扣的旧工具柜。碎车槽尽头有裸露的矿脉，窄槽从右边还能绕到石井外。', choices: [
    { label: '进偏井敲开卡住的车槽', days: 1, enemy: 'vein_sentinel', outcome: '一声钝响落地。两片黑岩并成一道石身，挡住了车眼。' },
    { label: '沿旧窄槽绕回路面', days: 0.125, insight: 1, loot: {}, outcome: '鞋底踏出了湿亮的车痕，你绕回宽一些的路。' },
    { label: '翻开井外的旧工具柜', desc: '败退的矿傀撞开了柜架，柜子滑到了井外，盖子裂出一道缝。', afterFight: 'vein_sentinel', days: 0, loot: { star_blade_pattern: 1 }, outcome: '木托里是一把断成三截的矿刀，刀身已经锈穿。油布倒还护着锻打图，连断口两边该锻多厚都标了。' },
    { label: '顺碎车槽去剔松矿脉', desc: '碎车槽内侧是一条暗金细脉，旁边挨着夹在石里的亮晶。', guardedBy: 'vein_sentinel', days: 1, insight: 2, loot: { black_iron: 4, core: 1 }, outcome: '你清开碎车边的松屑，从石壁剔下暗金和独立成片的灵晶。' },
    { label: '从车辙边用矿镐剔矿', desc: '碎车原先贴着石壁走，轮子在矿脉边留下了一道可落镐的缺口。', guardedBy: 'vein_sentinel',
      fieldTool: 'miner_pick', days: 0.625, loot: { black_iron: 4, core: 1 }, outcome: '镐头顺着车辙进去，暗金和亮晶朝槽外松下来。' },
  ] },

  { id: 'silk_bough', name: '背风雪蜥径', text: '石绳沿着矮石窝一路牵过去，雪蜥常在背风的石隙换皮。更上面横出一道冰沿，挡住了吹来的雪沫。', choices: [
    { label: '扶石绳拾低处的雪蜥蜕', days: 1.25, insight: 3, loot: { hide: 4 }, outcome: '你提起石窝的旧蜕，阴冷处长出的韧皮冻过也能弯。' },
    { label: '爬上冰沿取挂住的整蜕', days: 1.5, hp: -7, insight: 3, loot: { hide: 6 }, outcome: '石缝里一直干着，留了几张厚实的雪蜥蜕。', injury: '你撤手时冰皮断了，硬边划过小臂。' },
  ] },
  { id: 'snow_fire', name: '护栈火棚', text: '棚外是过山的木栈道，边上的扶绳磨破了皮套。守栈人坐在火盆旁缝新套，拽两下线，就得揉一揉手腕。旁边的年轻人背着一捆新绳，正往雪盖住的矮墙后张望。', choices: [
    { label: '把兽革和灵草交给守栈人', desc: '「兽革缝个新套，灵草敷敷手。你若要上天衡石台，我教你怎么看岔路上的绳结。」',
      excludesChoices: [4], excludedReason: '守栈人已把看岔路的绳结教给你了。', need: { hide: 6, reed: 5 }, consume: true, days: 1, insight: 5, loot: { sky_cord: 1, ration: 4 }, outcome: '他在短绳上打了三个不同的结。「每遇一道岔路，挑绳结跟这个对得上的梁走。走过第三条，便是天衡石台。」' },
    { label: '添干枝借火烘衣', need: { wood: 1 }, consume: true, days: 0.5, hp: 12, qi: 6, insight: 0, loot: {}, outcome: '你拨开灰，把干枝贴到火星上。火烧起来时，湿衣的下摆慢慢暖了。' },
    { label: '问他皮套怎么缝才挡雪', desc: '守栈人摊开缝到一半的皮套，两层粗布之间夹着一片兽皮。', days: 0.5, insight: 2, loot: { pass_seam: 1 }, outcome: '他让你摸里面的缝线。「线藏进来，外头下雪也浸不透。」说完递来一片缝好的样子。' },
    { label: '问背绳的人打算从哪上山', desc: '年轻人把新绳换到另一边肩头，朝雪下的矮墙看了两次。', days: 0.25, loot: { snow_escort_note: 1 },
      outcome: '「老栈最上边断了绳。我能爬上去换，墙后那架梯却给两窝兽占了。若有人先帮我探过去，第三根梁上见。累了就回棚烤火，还有三包多带的粮饼。」他把木梯和横梁圈在纸上。' },
    { label: '把铜栓拓印递给守栈人', hidden: true, need: { snow_escort_done: 1 }, consume: true, excludesChoices: [0],
      hideWhenExcluded: true, days: 0.25, insight: 5, loot: { sky_cord: 1, ration: 4 },
      outcome: '守栈人把拓纸铺在铜片边，又示范了三个绳结。「外头几条岔路都系着这样的结，对着走就能上天衡石台。」' },
    { label: '把铜栓拓印递给守栈人', hidden: true, need: { snow_escort_done: 1 }, consume: true, afterChoice: 0,
      days: 0.25, insight: 3, outcome: '守栈人按住拓纸拿炭笔描边。「铜头磨成这样，难怪新绳一天就松。我照这个重新配一个。」' },
    { label: '付九枚灵钱，拿三包粮饼', afterChoice: 3, days: 0.125, coins: -9, loot: { ration: 3 }, stay: true,
      desc: '火棚的人两两换班。守栈人把多带的三包粮饼从梁上摘下来，自己那一捆还吊在绳上。',
      outcome: '守栈人收下灵钱，把三包粮饼拢到一起。整条山道上也就这棚里有火。' },
  ] },
  { id: 'snow_ladder', name: '石墙后的木梯', text: '绕过矮墙，木梯就搁在背阴的石槽里。梯顶立着一根短桩，可以给棚里的人系布作记号。', choices: [
    { label: '去梯脚挡开啃骨的山猞', enemy: 'snow_rail_lynx', days: 0.25, outcome: '山猞丢下兽骨，身子压得和梯脚一样低。' },
    { label: '站到石槽边，迎住盘旋的灰翅鹰', desc: '石槽边能看见灰翅鹰绕着梯顶兜圈。', enemy: 'snow_rail_hawk', openingRange: true, days: 0.25, outcome: '灰翅鹰从梯顶上方收拢翅尖，隔着半架梯子俯冲下来。' },
    { label: '攀到梯顶，在木桩上系布条', guardedBy: ['snow_rail_lynx', 'snow_rail_hawk'], days: 0.25,
      outcome: '布条在木桩上绷直。往里能看见半截没系扶绳的横梁，有一枚铜栓被风擦得发亮。' },
  ] },
  { id: 'snow_beam', name: '第三根横梁', text: '新绳换在伸出悬崖的这根横梁上。木板靠石壁的一侧较宽，铜栓在前面，旧绳就从那里断开。', choices: [
    { label: '从靠墙的木板驱开冰蜥', enemy: 'snow_rail_shell', days: 0.25, outcome: '冰蜥把尾巴往身侧一卷，挪到板子正中。' },
    { label: '贴墙走到铜栓前，迎住长角冰蜥', enemy: 'snow_rail_matron', guardedBy: 'snow_rail_shell', days: 0.25,
      outcome: '长角从铜栓下刮过，留下几缕木屑。它抬头向你压过来。' },
    { label: '招手让背绳的人上来换绳', guardedBy: ['snow_rail_shell', 'snow_rail_matron'], days: 0.5, coins: 30,
      loot: { snow_escort_done: 1, salve: 2 }, outcome: '那人循布条爬上来，换好新绳，把旧铜栓的形状拓在纸上交给你。他结清工钱，又从护腕里腾出两盒防冻的松脂膏。' },
  ] },
  { id: 'white_ravine', name: '露背的雪沟', text: '南边的雪沟又长又窄。迎风口吊着旧锣，几道护绳绕过一截横铁，沿短栈道可以退回火棚。', choices: [
    { label: '在迎风处敲响谷口的旧锣', days: 1, enemy: 'snow_warden', outcome: '山沟里的白背抖落积雪。雪脊兽昂头，把厚颈露在风里。' },
    { label: '贴着短栈道回避风处', days: 0.25, insight: 1, loot: {}, outcome: '沿护绳走到短栈尽头，背坡挡住了风，能望见火棚门口。' },
    { label: '拨开栈道边的雪，看看铁钩', desc: '扶绳底下露着一点弯铁，余下部分埋在雪里。', days: 0.25, insight: 2, loot: { hook_iron: 1 }, outcome: '你翻过半截铁钩，才看见钩尖是向内弯的。铁上留着一道旧砍痕。' },
  ] },

  { id: 'cloud_scree', name: '浮光晶坡', text: '顺绳落到坡边，白痕贴着石面一路伸向岩脊。岩脊旁搁着刻有小槽的工台，嵌石架上托着一只旧火盏。', choices: [
    { label: '拾起雾边露出的晶片', days: 1.25, insight: 4, loot: { core: 4 }, outcome: '雾薄了一层，露在坡边的晶片亮起来。' },
    { label: '攀岩脊撬开晶层', days: 1.5, hp: -8, qi: -3, insight: 4, loot: { core: 6 }, outcome: '撬开的断口发出一阵脆声，光从更深处亮起来。', injury: '薄岩有一处塌下，你被晶片划伤了手背。' },
    { label: '查看工台旁的浅槽', days: 0.25, insight: 2, loot: { cloud_tip: 1 }, outcome: '浅槽里躺着几只拆下的箭头。背后的板上有用于配重的刻线。' },
    { label: '托住火盏拨开封泥', desc: '火盏的口被干泥封住，盏身夹在架里。', days: 0.5, insight: 3, loot: { formula_jade: 1 }, outcome: '盏内干燥，盏沿夹了一卷照心露丹方。卷首画的火盏就嵌在这同一处石架上。' },
  ] },
  { id: 'old_observatory', name: '偏影观星梁', revisit: true, text: '三道刻圈沿石梁排开，雾散时它们的边缘完整地落在石上。梁后的小槽还压着一片工匠木账。', choices: [
    { label: '趁雾散拓下石梁里的刻圈', days: 1, insight: 5, loot: { meridian_etching: 1 }, outcome: '拓完抬头，最靠外的刻圈反光照到梁背。沿光走，尽头有扇反照远峰的镜门。' },
    { label: '在石梁旁向阳的地方歇一会儿', days: 0.5, hp: 8, qi: 7, insight: 1, loot: {}, outcome: '你坐在石梁背风的一侧。石头晒得暖和，远处扶绳拍打木梁的响声也轻了。' },
    { label: '从梁后取那块木账片看看', days: 0.25, insight: 2, loot: { loom_tack: 1 }, outcome: '账片记的是披甲。工匠在每次收紧软丝的地方都压了一道线。' },
  ], experiment: {
    id: 'align_axis', desc: '石梁背后有个能转动的底座，上面开了两个插孔，旁边搁着一面旧镜。可以把镜脚换个插孔，也可以等石梁的影子移过去。',
    need: { meridian_etching: 1, vein_pattern: 1 },
    controls: [
      { id: 'notch', label: '把镜脚插到哪边', options: [{ id: 'outer', label: '外侧的深孔' }, { id: 'inner', label: '内侧的浅孔' }] },
      { id: 'shadow', label: '等影子移到哪里', options: [{ id: 'north', label: '影子遮住石梁底部时' }, { id: 'center', label: '影子缩成一条细线时' }, { id: 'east', label: '影子越过第三个圈时' }] },
    ], solution: { notch: 'inner', shadow: 'center' }, days: 0.75, insight: 4, reward: { axis_tuning: 1 },
    misses: { notch: { outer: '镜脚插得太深，底座一转就卡住了。' },
      shadow: { north: '反光还差一段才接触到圈心。', east: '亮斑从梁脚外滚过，三道刻圈仍各在一边。' } },
    outcome: '镜脚插在浅孔里，镜面可以转到中间。雾薄时，三道反光落在同一点。你量下底座的位置和镜面的角度。'
  } },
  { id: 'mirror_gate', name: '反峰镜门', text: '石门镜面上反照着来路的三座峰。门槛没有门闩，内侧独留一个夹着半道旧印的凹处。', choices: [
    { label: '跨过观星梁的投影查验印座', days: 1, enemy: 'mirror_warden', outcome: '你移到梁影之外，镜里的手伸出来，按住了卡在凹处的衡印。石台的守灵踩着另一道投影走出来。' },
    { label: '沿镜面外侧绕回石梁', days: 0.25, insight: 1, loot: {}, outcome: '镜峰偏了半寸。你循着光退回观星梁旁。' },
    { label: '扶稳印座，取出衡印', desc: '镜影散开后，卡住印的石槽完整露了出来。', afterFight: 'mirror_warden', days: 0, loot: { sky_seal: 1 }, outcome: '你托住石座，把衡印向外抬出来。石槽深处依稀还有印台的正线。' },
  ] },
  { id: 'foundation_duel', name: '背钟试剑亭', text: '亭子在倒挂的旧钟后头。守书人看见你手里的帖子，提起靠在柱边的长剑。「借书得先试剑。你若回去练好了再来，我也在这里等。」', choices: [
    { label: '出示借卷帖，接守书人的剑', days: 0.75, enemy: 'foundation_duelist', outcome: '守书人看过帖子，一脚拨开木凳。「你赢了，我就给你盖印。接招时留神，我可不会收着剑。」' },
    { label: '沿倒钟侧道出去', days: 0.25, loot: {}, outcome: '钟背的石阶能通到矿坡，方向渐渐辨得清了。' },
    { label: '请守书人在借卷帖上盖印', desc: '守书人收起剑，在木桌上试了试印章。', afterFight: 'foundation_duelist', days: 0, loot: { foundation_spar_mark: 1 }, outcome: '他在借卷帖上盖了个缺一角的印，再把帖子还给你。' },
  ] },
  { id: 'foundation_kiln', name: '旧丹窑内壁', text: '移灰牌卡进后烟道入口，里面的门打开了。几块竖挡板挡住风，板缝里透出旧印的光。', choices: [
    { label: '扶住挡板，朝窑影走过去', days: 0.75, enemy: 'foundation_kiln_echo', outcome: '被风吹回的灰聚成人形。它一手拍在挡板上，遮住那点金光。' },
    { label: '顺着风退回后烟道', days: 0.25, loot: {}, outcome: '一绕出挡板，炉风就不再吹眼睛了。' },
    { label: '擦掉挡板上的灰，取出旧印', desc: '挡板的浅槽里露出半枚旧印，边上积着灰。', afterFight: 'foundation_kiln_echo', days: 0, loot: { foundation_kiln_seal: 1 }, outcome: '你擦掉薄灰，从挡板的浅槽里取下半枚旧印。' },
  ] },
  { id: 'foundation_court', name: '封石验药室', text: '封石之约上的印和门上缺去的花纹对上了。护炉人打开门，让出一片空地。远处的桌上刚点起一盏灯。', choices: [
    { label: '进场接受护炉人的考验', days: 1, enemy: 'foundation_warden', outcome: '护炉人把旧印放到灯盏后。「守得住这道火，我就在你的信帖上盖最后一道印。」' },
    { label: '扶着石门退到背风处', days: 0.25, loot: {}, outcome: '石门沉着，没有随风再开。炉火在门缝里剩下一线亮。' },
    { label: '请护炉人补上最后一道印', desc: '护炉人移开灯盏，第三枚印章就放在旁边。', afterFight: 'foundation_warden', days: 0, loot: { foundation_warden_proof: 1 }, outcome: '护炉人在信帖上盖了最后一道印，再把验药室的留火印交到你手上。' },
  ] },
];

const enemies = [
  { id: 'reed_hare', name: '白耳兔', tags: ['beast', 'furred'], tier: 0, hp: 18, atk: 5, def: 0,
    intents: [{ name: '蹬土扑来', kind: 'attack', mult: 1 }, { name: '缩身伏地', kind: 'guard', mult: 1.2 }, { name: '蹬坡撞腿', kind: 'heavy', mult: 1.45 }],
    insight: 1, loot: { beast_meat: 2, qi_core: 1 }, desc: '白耳几乎和枯苇一个颜色。腿劲不小，这种小兽的肉炖汤很合适。' },
  { id: 'ford_silver_dace', name: '银背鱼', tags: ['beast', 'scaled'], tier: 0, hp: 20, atk: 6, def: 1,
    intents: [{ name: '跃水划鳍', kind: 'attack', mult: 1 }, { name: '伏水蹿撞', kind: 'heavy', mult: 1.45 }],
    insight: 1, loot: { beast_meat: 2, qi_core: 1 }, desc: '浅水里游得急，跃出水面时背鳍最锋利。' },
  { id: 'ford_shale_crab', name: '黑纹蟹', tags: ['beast', 'scaled'], tier: 1, hp: 35, atk: 8, def: 5,
    intents: [{ name: '合钳挡脸', kind: 'guard', mult: 1.55 }, { name: '侧身扫钳', kind: 'attack', mult: 1 }, { name: '举钳砸石', kind: 'heavy', mult: 1.55 }],
    insight: 3, loot: { beast_meat: 1, hide: 2, qi_core: 2 }, desc: '壳上的黑纹压着钳根，双钳高抬时会露出接缝。硬壳打磨后能补护具。' },
  { id: 'mud_beast', name: '泥鳞兽', tags: ['beast', 'scaled'], tier: 0, hp: 25, atk: 7, def: 2, intents: [{ name: '偏头啃咬', kind: 'attack', mult: 1 }, { name: '伏身猛扑', kind: 'heavy', mult: 1.7 }, { name: '蜷尾守鳞', kind: 'guard', mult: 1.35 }, { name: '掀尾扫腿', kind: 'attack', mult: 1 }], insight: 3, loot: { beast_meat: 2, hide: 2, qi_core: 1 }, desc: '伏身后会扑向脚下，硬鳞收拢时适合恢复真气或蓄势。' },
  { id: 'reed_fox', name: '苇尾狐', tags: ['beast', 'furred'], tier: 0, hp: 24, atk: 6, def: 1, intents: [{ name: '斜掠扑咬', kind: 'attack', mult: 1 }, { name: '团尾护腹', kind: 'guard', mult: 1.4 }, { name: '伏脊跳扑', kind: 'heavy', mult: 1.5 }], insight: 2, loot: { beast_meat: 1, hide: 1, qi_core: 1 }, desc: '尾上的厚毛扫起了枯苇。它会先绕着干埂寻找扑咬的空当。' },
  { id: 'marsh_ghost', name: '巡岸水鬼', tags: ['spirit'], tier: 0, hp: 28, atk: 8, def: 2, intents: [{ name: '抱臂裹雾', kind: 'guard', mult: 1.4 }, { name: '伸指拖拽', kind: 'attack', mult: 1 }, { name: '借雾扑面', kind: 'heavy', mult: 1.6 }], insight: 4, loot: { qi_core: 1 }, desc: '开场先抱臂结雾，准备好再把它拖出水边。' },
  { id: 'bank_runner', name: '拦滩客', tags: ['human'], tier: 0, hp: 28, atk: 8, def: 2, intents: [{ name: '用杖头试探', kind: 'attack', mult: 1 }, { name: '抡杖砸下', kind: 'heavy', mult: 1.5 }, { name: '横杖护身', kind: 'guard', mult: 1.3 }], insight: 3, loot: {}, sparring: true, desc: '这人走惯了滩北的山道，腰间那张正是进山的路图。见他抡起木杖，可以先架住重招。' },
  { id: 'mast_beast', name: '沉桅虺', tags: ['beast', 'scaled'], tier: 1, hp: 34, atk: 10, def: 3, intents: [{ name: '借桅缠身', kind: 'attack', mult: 1 }, { name: '开鳍扑水', kind: 'heavy', mult: 1.65 }, { name: '绕桅遮身', kind: 'guard', mult: 1.2 }, { name: '甩尾扫水', kind: 'attack', mult: 1 }], insight: 5, loot: { beast_meat: 2, hide: 2, beast_eye: 1, qi_core: 2 }, desc: '有些气候的伏水兽。带上破招术和撤退用的符，可留一条回路。' },
  { id: 'ore_wight', name: '持锤矿煞', tags: ['spirit'], tier: 1, hp: 38, atk: 11, def: 4, intents: [{ name: '平锤试探', kind: 'attack', mult: 1 }, { name: '举锤砸顶', kind: 'heavy', mult: 1.72 }, { name: '横锤护臂', kind: 'guard', mult: 1.45 }, { name: '甩锤碰撞', kind: 'attack', mult: 1.1 }], insight: 5, loot: { qi_core: 2 }, desc: '它击打沉重且规律。越阶挑战时先做好撑过重锤的准备。' },
  { id: 'stone_badger', name: '石甲獾', tags: ['beast', 'furred'], tier: 1, hp: 41, atk: 10, def: 5, intents: [{ name: '缩头挡路', kind: 'guard', mult: 1.38 }, { name: '沿坡顶撞', kind: 'attack', mult: 1 }, { name: '转身重掀', kind: 'heavy', mult: 1.62 }], insight: 5, loot: { beast_meat: 2, hide: 2, qi_core: 2 }, desc: '皮毛粗厚，脊甲又硬。找它转身露侧肋时出手。' },
  { id: 'bell_wraith', name: '裂钟魄', tags: ['spirit'], tier: 2, hp: 46, atk: 12, def: 5, intents: [{ name: '叩钟抖尘', kind: 'attack', mult: 1 }, { name: '聚响压顶', kind: 'heavy', mult: 1.63 }, { name: '并片挡锋', kind: 'guard', mult: 1.38 }, { name: '崩响回荡', kind: 'attack', mult: 1.1 }], insight: 6, loot: { qi_core: 3 }, desc: '钟魄鸣响时正在蓄势，可先护住周身，再截住最重一声。' },
  { id: 'rope_eel', name: '缠舟兽', tags: ['beast'], tier: 2, hp: 44, atk: 12, def: 5, intents: [{ name: '卷尾扫舟', kind: 'attack', mult: 1 }, { name: '扯绳压顶', kind: 'heavy', mult: 1.6 }, { name: '团身潜浮', kind: 'guard', mult: 1.38 }], insight: 6, loot: { beast_meat: 3, beast_eye: 1, qi_core: 3 }, desc: '动作快，扯紧船绳后会随浪发动重击。' },
  { id: 'tide_spirit', name: '守潮灵', tags: ['spirit'], tier: 2, hp: 67, atk: 14, def: 6, intents: [{ name: '铁索探身', kind: 'attack', mult: 1 }, { name: '沉锁打浪', kind: 'heavy', mult: 1.7 }, { name: '横锁固闸', kind: 'guard', mult: 1.46 }, { name: '返潮扫岸', kind: 'attack', mult: 1.12 }, { name: '闭闸合潮', kind: 'heavy', mult: 1.78 }], insight: 8, loot: { qi_core: 4 }, desc: '带印回村便可复开旧渡。它的两次重招隔得很近，重进闸前先确认药符够用。' },
  { id: 'wick_husk', name: '湿蓑灯蜕', tags: ['spirit'], tier: 2, hp: 57, atk: 14, def: 5, intents: [{ name: '压帽护火', kind: 'guard', mult: 1.35 }, { name: '引灯掠手', kind: 'attack', mult: 1.1 }, { name: '借火贴身', kind: 'heavy', mult: 1.62 }, { name: '吮焰回息', kind: 'heal', mult: 0.42 }], insight: 7, loot: { qi_core: 3 }, desc: '会在风回过来时从灯芯汲力。拖久了，它能补回缺损。' },
  { id: 'pitch_bear', name: '灰脊松熊', tags: ['beast', 'furred'], tier: 1, hp: 44, atk: 10, def: 4,
    intents: [{ name: '压掌踏泥', kind: 'attack', mult: 1 }, { name: '翻车撞肩', kind: 'heavy', mult: 1.58 }, { name: '斜身护腹', kind: 'guard', mult: 1.4 }],
    insight: 5, loot: { beast_meat: 4, hide: 2, qi_core: 2 }, desc: '厚毛挡得住浅刃。它用背压低窑车时，接下来会往外猛撞。' },
  { id: 'cinder_hound', name: '炉渣犬', tags: ['spirit', 'stoneborn'], tier: 2, hp: 52, atk: 12, def: 5,
    intents: [{ name: '扫炉渣', kind: 'attack', mult: 1.05 }, { name: '裹灰守首', kind: 'guard', mult: 1.42 }, { name: '冲开烟口', kind: 'heavy', mult: 1.62 }, { name: '舔灰续形', kind: 'heal', mult: 0.34 }],
    insight: 6, loot: { qi_core: 3 }, desc: '身上的炉渣容易结成硬壳。回身舔灰时会把散开的地方补起来。' },
  { id: 'vine_stag', name: '白角藤鹿', tags: ['beast', 'furred'], tier: 2, hp: 60, atk: 14, def: 5,
    intents: [{ name: '探蹄拨藤', kind: 'attack', mult: 1.08 }, { name: '角上引湿', kind: 'drain', mult: 0.52 }, { name: '低眉突刺', kind: 'heavy', mult: 1.62 }, { name: '转背护颈', kind: 'guard', mult: 1.35 }],
    insight: 6, loot: { beast_meat: 3, hide: 2, beast_eye: 1, qi_core: 3 }, desc: '它能借湿藤牵走气息。白角还没压低之前，脚下总会先拨藤。' },
  { id: 'herb_den_toad', name: '蒲窝青蟾', tags: ['beast'], tier: 1, hp: 31, atk: 9, def: 3,
    intents: [{ name: '贴地探爪', kind: 'attack', mult: 1 }, { name: '撑板扑膝', kind: 'heavy', mult: 1.52 }],
    insight: 3, loot: { beast_meat: 2 }, chanceLoot: { qi_core: { count: 1, chance: 0.56 } },
    desc: '小蟾藏在蒲根下，有东西踩湿木板才会扑上来。' },
  { id: 'herb_den_sawfish', name: '锯鳍鲶', tags: ['beast'], tier: 1, hp: 29, atk: 8, def: 2,
    intents: [{ name: '沉入浅泥护身', kind: 'guard', mult: 1.38 }, { name: '摆尾撩脚', kind: 'attack', mult: 1.12 },
      { name: '竖起背鳍冲过浅滩', kind: 'heavy', mult: 1.4 }, { name: '翻鳃带走水气', kind: 'drain', mult: 0.5 }],
    insight: 3, loot: { beast_meat: 2 }, chanceLoot: { qi_core: { count: 1, chance: 0.56 } },
    desc: '背鳍边缘长着一排软刺。刚逼近时会伏进浅泥，出了泥再拿尾巴撩脚。' },
  { id: 'herb_den_lizard', name: '蒲根巨蜥', tags: ['beast', 'scaled'], tier: 3, hp: 66, atk: 14, def: 5,
    intents: [{ name: '踩根掠足', kind: 'attack', mult: 1 }, { name: '衔水抽气', kind: 'drain', mult: 0.64 },
      { name: '蹬板压尾', kind: 'heavy', mult: 1.61 }],
    insight: 7, loot: { beast_meat: 3, hide: 2, hard_scale: 2 }, chanceLoot: { foundation_core: { count: 3, chance: 0.64 }, beast_eye: { count: 1, chance: 0.33 } },
    desc: '沉进黑蒲根时，它能贴木板吸走护身真气。抬起前爪后才挥尾砸板。' },
  { id: 'herb_den_elder', name: '断桩老蜥', tags: ['beast', 'scaled'], tier: 4, hp: 88, atk: 16, def: 6,
    intents: [{ name: '推木撞肩', kind: 'attack', mult: 1.02 }, { name: '贴桩护首', kind: 'guard', mult: 1.45 },
      { name: '咬桩抡水', kind: 'heavy', mult: 1.68 }, { name: '吸水回气', kind: 'heal', mult: 0.36 }],
    insight: 11, loot: { beast_meat: 5, hide: 5, foundation_core: 3, hard_scale: 3, den_neck_plate: 1 },
    chanceLoot: { foundation_core: { count: 4, chance: 0.62 }, beast_eye: { count: 1, chance: 0.65 } },
    desc: '它的下颚几乎齐木桩高，颈下的厚甲能分片合拢。它咬住旧木准备卷起一层水时，把脚从板沿收回来。' },
  { id: 'vine_king', name: '白纹鹿王', tags: ['beast', 'furred'], tier: 2, hp: 79, atk: 15, def: 6,
    intents: [{ name: '昂角探石', kind: 'attack', mult: 1 }, { name: '低角顶坝', kind: 'heavy', mult: 1.7 },
      { name: '贴藤守颈', kind: 'guard', mult: 1.42 }, { name: '转身摔角', kind: 'attack', mult: 1.1 }],
    insight: 9, loot: { beast_meat: 5, hide: 3, beast_eye: 1, qi_core: 4 }, desc: '它的角在老树上蹭出两道白痕。压角低头时，会沿着旧蹄印直撞过来。' },
  { id: 'vein_sentinel', name: '横肩矿傀', tags: ['stoneborn', 'scaled'], tier: 2, hp: 64, atk: 14, def: 6,
    intents: [{ name: '横臂合甲', kind: 'guard', mult: 1.5 }, { name: '左肩撞壁', kind: 'attack', mult: 1.05 }, { name: '抱石砸槽', kind: 'heavy', mult: 1.62 }, { name: '错步碰肩', kind: 'attack', mult: 1.13 }],
    insight: 7, loot: { qi_core: 3 }, desc: '两肩石片相合时很难砍进去。窄矢或穿甲的兵刃能省不少力。' },
  { id: 'snow_warden', name: '雪脊兽', tags: ['beast', 'scaled'], tier: 3, hp: 81, atk: 15, def: 6,
    intents: [{ name: '甩雪探路', kind: 'attack', mult: 1.02 }, { name: '伏背撞沟', kind: 'heavy', mult: 1.7 }, { name: '蜷鳞藏气', kind: 'guard', mult: 1.4 }, { name: '卷冷风', kind: 'drain', mult: 0.66 }, { name: '翻颈扫石', kind: 'attack', mult: 1.1 }],
    insight: 10, loot: { beast_meat: 5, hide: 4, beast_eye: 1, foundation_core: 3 }, desc: '雪脊鳞叠得厚，压背后会沿沟猛撞。趁它还没贴近时服药或换术。' },
  { id: 'snow_rail_lynx', name: '雪耳山猞', tags: ['beast', 'furred'], tier: 1, hp: 33, atk: 11, def: 3,
    intents: [{ name: '矮身抄足', kind: 'attack', mult: 1 }, { name: '蹬梯扑脸', kind: 'heavy', mult: 1.55 }],
    insight: 3, loot: { beast_meat: 2, hide: 1, qi_core: 1 }, desc: '前足碰到梯脚时，会借梯身猛扑。' },
  { id: 'snow_rail_hawk', name: '灰翅雪鹰', tags: ['beast'], tier: 2, hp: 38, atk: 12, def: 4,
    intents: [{ name: '掠梯啄手', kind: 'attack', mult: 1 }, { name: '折翅骤降', kind: 'heavy', mult: 1.63 }, { name: '振翼挡锋', kind: 'guard', mult: 1.32 }],
    insight: 5, loot: { beast_meat: 2, beast_eye: 1, qi_core: 2 }, desc: '灰翅忽然收紧时，很快就会沿梯面俯冲。' },
  { id: 'snow_rail_shell', name: '横尾冰蜥', tags: ['beast', 'scaled'], tier: 2, hp: 46, atk: 12, def: 5,
    intents: [{ name: '盘尾护腹', kind: 'guard', mult: 1.35 }, { name: '扫板拖步', kind: 'attack', mult: 1 }, { name: '卷尾击梁', kind: 'heavy', mult: 1.58 }],
    insight: 6, loot: { beast_meat: 2, hide: 1, qi_core: 2 }, desc: '先用尾巴护住柔软的腹部，再将长尾横扫过来。' },
  { id: 'snow_rail_matron', name: '铜角冰蜥', tags: ['beast', 'scaled'], tier: 3, hp: 62, atk: 14, def: 5,
    intents: [{ name: '横颈擦肩', kind: 'attack', mult: 1 }, { name: '按梁撞角', kind: 'heavy', mult: 1.68 }, { name: '退半步团身', kind: 'guard', mult: 1.38 }, { name: '贴板喷寒', kind: 'drain', mult: 0.57 }],
    insight: 9, loot: { beast_meat: 4, hide: 2, beast_eye: 1, foundation_core: 1 }, desc: '长角会刮过横梁。它前爪压进旧木时，才要低头撞过来。' },
  { id: 'mirror_warden', name: '持衡镜灵', tags: ['spirit', 'stoneborn'], tier: 3, hp: 92, atk: 18, def: 7,
    intents: [{ name: '抬印收影', kind: 'guard', mult: 1.45 }, { name: '左影探腕', kind: 'attack', mult: 1.08 }, { name: '梁影横压', kind: 'heavy', mult: 1.65 }, { name: '抽气归镜', kind: 'drain', mult: 0.62 }, { name: '借右影回手', kind: 'attack', mult: 1.14 }],
    insight: 14, loot: { foundation_core: 2 }, desc: '它守印的时候两道影子贴在一起。影子分开以后先试探，再借梁影出重招。' },
  { id: 'road_sparrer', name: '松场巡索人', tags: ['human'], tier: 1, hp: 40, atk: 10, def: 4, sparring: true,
    intents: [{ name: '轻砍试手', kind: 'attack', mult: 1 }, { name: '反腕遮刀', kind: 'guard', mult: 1.3 }, { name: '扣索猛拉', kind: 'heavy', mult: 1.55 }],
    insight: 4, loot: {},
    desc: '在索棚与行人切磋，也得换班巡绳。收住刀锋后还会抄袖内的短索向前猛拉。' },
  { id: 'foundation_duelist', name: '守卷剑客何鹿', tags: ['human'], tier: 1, hp: 45, atk: 11, def: 4,
    intents: [{ name: '平举剑锋刺来', kind: 'attack', mult: 1 }, { name: '收剑挡在身前', kind: 'guard', mult: 1.35 }, { name: '沉腕准备上挑', kind: 'heavy', mult: 1.58 }, { name: '横剑扫向身侧', kind: 'attack', mult: 1.08 }],
    insight: 5, loot: {}, desc: '何鹿的剑一压低，下一招就会从下往上挑。' },
  { id: 'foundation_kiln_echo', name: '护印窑影', tags: ['spirit', 'stoneborn'], tier: 2, hp: 58, atk: 14, def: 5,
    intents: [{ name: '翻灰试火', kind: 'attack', mult: 1 }, { name: '堵眼养灰', kind: 'guard', mult: 1.42 }, { name: '借风撞板', kind: 'heavy', mult: 1.68 }, { name: '裹灰续形', kind: 'heal', mult: 0.38 }],
    insight: 6, loot: { qi_core: 3 }, desc: '火口变窄时会撞动立板，风被堵回的时候它也能用灰补身。' },
  { id: 'foundation_warden', name: '封石护炉人', tags: ['human'], tier: 2, hp: 72, atk: 16, def: 6,
    intents: [{ name: '捧盏试势', kind: 'guard', mult: 1.35 }, { name: '贴盏拂腕', kind: 'attack', mult: 1.05 }, { name: '压手推门', kind: 'heavy', mult: 1.65 }, { name: '藏炉吸气', kind: 'drain', mult: 0.56 }, { name: '反腕试火', kind: 'attack', mult: 1.08 }],
    insight: 8, loot: {}, desc: '他先自己稳住火，过招时连番去碰你的手腕。别让抽气和重招挤在一处。' },
];

const quests = [
  { id: 'patch_ferry', name: '把旧灯支起来', desc: '渡口的灯照不稳，送货的船不敢靠岸。村人把告示钉在村口，找人送两根松枝垫牢灯座。', need: { wood: 2 }, requiresKnownMaterials: false, reward: { ration: 3, salve: 1 }, coins: 9, insight: 2, outcome: '村人往灯座下垫进松枝，松开手，灯没再倒。一艘小舟循灯靠岸，莫船家从舱里抱出一匣遮痕符，支起自己的符摊。' },
  { id: 'lost_basket_return', name: '把药篓还给药僮', reveal: { item: 'lost_basket' }, desc: '药僮认出了篓把上的青绳，忙放下手里的药碗。「是我在河岔里掉的那只。药包还在么？」', need: { lost_basket: 1 }, reward: { salve: 1, ration: 2 }, coins: 8, insight: 2, outcome: '药僮摸摸篓口的扣，松了口气。「药没散。怕你下水磕着，来，拿包松脂膏。」' },
  { id: 'reed_salve', name: '给药僮一份灵草', desc: '药僮搅着锅里的松脂。「还差一份灵草，附近好找的是白苇芯。你若有，匀我一份，这锅熬好也包你一份。」', need: { reed: 1 }, requiresKnownMaterials: false, reward: { salve: 1, clinic_note: 1, formula_detox: 1 }, coins: 4, insight: 2, outcome: '药僮包好松脂膏，又取出一张清露丸丹方。「丹药吃多了会积毒，这丸能解些药毒。药巷拐进去，把这张有师父印章的便条给安蒲看。」' },
  { id: 'apprentice_waterline', name: '问药僮怎么看水线', reveal: { item: 'oar_mark' }, desc: '药僮瞥见桨背的画。「渡工画的是桩。我找药草，不同水位都得去一趟。帮我匀一份灵草，我把水线图给你。」', need: { reed: 1 }, requiresKnownMaterials: false, reward: { reed_lines: 1 }, coins: 0, insight: 2, outcome: '药僮从灶台下抽出叠在一起的两页。「水刚涨时去一趟，退了又走一趟。有几道线两次可不一样。」' },
  { id: 'coat_mend', name: '补蓑衣的里衬', reveal: { item: 'oar_mark' }, desc: '常来村里补桨的渡工给村口留了话，说他那件蓑衣穿出破洞，要换一块整泥蜕。', need: { hide: 1 }, reward: { salve: 2, ration: 1 }, coins: 10, insight: 2, outcome: '渡工把泥蜕比在裂口上，拣了两包自己用惯的止血膏给你。' },
  { id: 'sell_forging', name: '拿寒铁换旧渡水图', reveal: { item: 'ridge_rubbing' }, desc: '老匠人认出你带的沉钟岭路图，抽出一张折旧的水图。「山里有寒铁。若给我一块试打闸栓，验得出山货，水图就给你。」', need: { ore: 1 }, requiresKnownMaterials: false, reward: { iron_talisman: 1, ration: 3, ford_chart: 1 }, coins: 17, insight: 3, outcome: '迟师傅敲过你带回的铁，认出哪道山沟还能进货。他让脚夫循路接上矿场，把仓里原本要留作自用的寒铁剑摆出一把，另把通往闭潮渡的水图交给你。' },
  { id: 'last_lantern', name: '把旧渡的印带回来', reveal: { item: 'ford_chart' }, desc: '村老还留着旧闸的开门文书。只差镇渡印，他请你去把印带回来。', need: { seal: 1 }, reward: { ration: 6, tide_pill: 1, pine_pass: 1, formula_heal: 1 }, coins: 30, insight: 6, outcome: '村老在文书上盖了镇渡印，带人去开闸。苏家药船靠岸摆出了合络丹，伙计还给了你一份丹方。采晶人晏采也随船来卖刚筛好的灵晶。老船家给你画了通往松场的路。' },
  { id: 'sky_treaty', name: '沿新路把衡印带回村', reveal: { item: 'sky_seal' },
    requireQuest: 'last_lantern', waitForQuest: '村老摸了摸衡印。「印有了。旧渡还关着，得先把镇渡印带回来，船才能送通行契去各处驿站。」',
    desc: '村里想把新路告诉各处驿站。带回衡印，就能在通行文书上盖章。', need: { sky_seal: 1 },
    reward: { ration: 6, jade_pill: 2 }, coins: 60, insight: 10, outcome: '村老接过衡印，盖好了通行文书。送信的人从渡口灯下启程，把沿山到石台的路图送往各处驿站。' },
];

const services = [
  { id: 'quests', name: '委托', public: true },
  { id: 'market', name: '坊市', public: true },
  { id: 'workshop', name: '工坊', public: true },
  { id: 'cultivate', name: '修行', items: ['stone_rubbing'], choices: ['drowned_mast:1'] },
];

const market = {
  stalls: [
    { id: 'rice_vendor', name: '陶嫂·干粮摊', desc: '陶嫂把新烙的粮饼分成一份份。她说阴雨天也能带半路。',
      offers: [{ id: 'ration', stock: { cap: 14, interval: 2.5, growth: 5 } }] },
    { id: 'wood_vendor', name: '阿汀·松枝摊', desc: '木贩阿汀专挑折口会渗松油的干枝。湿枝他留给自家守火。',
      offers: [{ id: 'wood', stock: { cap: 10, interval: 4, growth: 3 } }] },
    { id: 'reed_vendor', name: '鹭娘·苇芯篮', desc: '鹭娘把散芯拢成小束。她说芯白又软的才留下来。',
      offers: [{ id: 'reed', stock: { cap: 8, interval: 6, growth: 2 } }] },
    { id: 'staff_vendor', name: '裴杖匠·行杖摊', desc: '裴匠拿一根去探摊前的泥，收回来把杖节上的水擦干。',
      offers: [{ id: 'cudgel', stock: { cap: 1, interval: 10, growth: 1 } }] },
    { id: 'blade_vendor', name: '卢打铁·短刀摊', desc: '卢打铁敲了敲薄刃，说苇滩上的鳞要从缝里顺过去。',
      offers: [{ id: 'knife', stock: { cap: 1, interval: 12, growth: 1 } }] },
    { id: 'axe_vendor', name: '卢五·小斧摊', desc: '卢五往新柄上装斧头。「我们叫它小钺。劈柴就该用厚刃，磕卷了也磨得回来。」',
      offers: [{ id: 'split_axe', stock: { cap: 1, interval: 7, growth: 1 }, restockText: '卢五从木棚拿来新斧柄，量过粗细才把斧头装上。' }] },
    { id: 'spear_vendor', name: '绳叔·短矛摊', desc: '绳叔握着矛杆比了比。「手上稳住，矛尖能刺，别人的刀砍过来，也能拿矛杆尾端一挡。」',
      offers: [{ id: 'short_spear', stock: { cap: 1, interval: 9, growth: 1 }, restockText: '绳叔把新削的矛杆压在檐下，得晾直才安尖。' }] },
    { id: 'blacksmith_vendor', name: '迟师傅·巡矿剑摊', desc: '沉钟岭的脚夫照旧路运铁，迟师傅这才按巡矿人的式样打厚脊剑。',
      offers: [{ id: 'iron_sword', afterQuest: 'sell_forging', stock: { cap: 1, interval: 12, growth: 1 }, restockText: '迟师傅等驮铁上门，炉里还留着下一把剑的火。' }] },
    { id: 'cape_vendor', name: '任蓑匠·雨衣摊', desc: '任匠把衣领撑开给你看。编得密的地方都朝着外面。',
      offers: [{ id: 'straw_cape', stock: { cap: 1, interval: 10, growth: 1 } }] },
    { id: 'herb_vendor', name: '夏婆·伤药摊', desc: '夏婆把松脂膏栓成小包，嘱咐泥洗净了再往伤口上抹。',
      offers: [{ id: 'salve', stock: { cap: 5, interval: 5, growth: 2 } }] },
    { id: 'breath_vendor', name: '石浣·散药摊', desc: '石浣用小纸折起回气散。他说一口气都顺了，别硬往下续第二包。',
      offers: [{ id: 'qi_powder', stock: { cap: 4, interval: 5, growth: 1 } }] },
    { id: 'fletcher', name: '冯翎·箭摊', desc: '冯翎把削苇箭放在掌沿滚过一圈，弯了的捡回去再修。',
      offers: [{ id: 'reed_arrow', stock: { cap: 16, interval: 4, growth: 5 } }] },
    { id: 'farmer', name: '常圃农·种子摊', desc: '常圃农端着簸箕抖了两下，轻飘飘的空壳落到地上。他把饱满的粟种装进布袋。',
      offers: [{ id: 'millet_seed', stock: { cap: 5, interval: 6, growth: 2 } }] },
    { id: 'seal_vendor', name: '莫船家·符匣', desc: '船家把薄符放在最干的一层纸里。遇雾时再取出来，容易留条退路。',
      offers: [{ id: 'reed_talisman', afterQuest: 'patch_ferry', stock: { cap: 4, interval: 6, growth: 1 } }] },
    { id: 'apothecary', name: '苏药船·丹盒', desc: '药船伙计捆好合络丹的瓶口。他说气脉扎稳之后才能承下这味药。',
      offers: [{ id: 'heal_pill', afterQuest: 'last_lantern', stock: { cap: 3, interval: 8, growth: 1 } }] },
    { id: 'crystal_vendor', name: '晏采·晶石篮', desc: '晏采把湿晶摊到石盘上。旧闸通船后，他能从潮床装上整篮碎晶。',
      offers: [{ id: 'core', afterQuest: 'last_lantern', stock: { cap: 6, interval: 7, growth: 2 }, restockText: '晏采空盘倒扣着，要等岸边退水，再去筛一筐晶。' }] },
  ],
};

const deductions = [
  {
    id: 'find_eddy', name: '松着的缆绳', tier: 0, reveal: { item: 'oar_mark' },
    desc: '同一段滩，为什么有的缆绷紧了，有的没有？',
  },
  {
    id: 'read_echo', name: '那只贴岩的手', tier: 0, reveal: { item: 'echo_note' },
    desc: '茶棚那幅旧画只画了一个人。他撑着石面，为什么还凑近了去听？',
  },
  {
    id: 'trace_backwash', name: '瓦上反字', tier: 0, reveal: { item: 'kiln_shard' },
    desc: '字刻反了，却不止一笔。是谁给这片瓦留下的字，它原先摆在哪里？',
  },
  {
    id: 'align_axis', name: '三圈偏影', tier: 0, reveal: { item: 'meridian_etching' },
    desc: '同一根梁上刻了三个圈，为什么从山下看总是各偏一截？',
  },
];

const starting = {
  inventory: { ration: 3 },
  gear: { weapon: 'cudgel', armor: 'straw_cape', charm: null },
  arts: [],
  coins: 20,
  satiety: 68,
};
const basket = {
  item: 'lost_basket',
  inspect: '篓把上的青绳是落灯村药房的记号。竹扣还紧着，药香从竹条缝里透出来。拆开竹扣取药，便没法把药篓原样还回去了。',
  unpack: {
    loot: { wood: 1, salve: 1 },
    outcome: '你解开扣结，把还没泡坏的松脂膏和垫在篓底的松枝取出来。竹编篓口散了，已经不能原样交还。',
  },
};
const victoryQuest = 'last_lantern';
const finalQuest = 'sky_treaty';
const provinces = [
  { id: 'wuliang', name: '雾梁州', arrival: '芦滩和旧矿岭隔水相望，沿途多渔猎与木工。' },
  { id: 'zhaoyuan', name: '照原州', arrival: '低堤绕着农田和水市，各家共用一套汛尺。' },
  { id: 'mingsha', name: '鸣沙州', arrival: '驿道串起盐井和石炉，迎风的山壁会回响。' },
];
const regionDetails = { ...riverContent.regionDetails, ...zhaoContent.regionDetails, ...sandContent.regionDetails };
const sects = [riverContent, zhaoContent, sandContent].flatMap((content) => content.sects ?? []);
const mechanisms = puzzleContent.mechanisms;
const { enemyInnerStyles } = innerStyleContent;
const innerStyles = [...innerStyleContent.innerStyles, ...banditContent.innerStyles, ...banditTaleContent.innerStyles];
const roadBandits = { ...banditContent.roadBandits, fixed: [...banditContent.roadBandits.fixed, ...banditTaleContent.fixed] };

for (const content of [riverContent, zhaoContent, sandContent, lateContent, puzzleContent, tournamentContent,
  ferryContent, hazardContent, caravanContent, employersContent, borderContent, huntMaterialContent,
  dykeArmoryContent, ridgeArmoryContent, explorerKitContent, innerStyleContent, banditContent, banditTaleContent, encyclopediaContent]) {
  for (const [key, entries] of Object.entries({ realms, items, gear, ammunition, foods, pills, talismans, arts, recipes,
    regions, sites, events, enemies, quests, deductions })) {
    entries.push(...(content[key] ?? []));
  }
}
sites.push(...extendSites);
events.push(...extendEvents);
innerStyleContent.extendScenes(sites, events, gear, enemies);
const roadsideEnemyIds = new Set([...roadBandits.pools, ...roadBandits.fixed].map(({ enemy }) => enemy));
for (const enemy of banditContent.enemies) {
  enemy.tags.push('bandit');
  if (roadsideEnemyIds.has(enemy.id)) enemy.name = `强盗 · ${realms[enemy.tier].name}`;
}

const solitaryTerritories = new Set(['river_cliff_kite', 'snow_warden', 'ember_yak']);
const twoHandedClasses = new Set(['bow', 'crossbow', 'spear', 'staff']);
const oneHandedWeapons = new Set(['cudgel', 'short_spear', 'ferry_pole', 'quarry_spear']);
for (const item of gear) {
  if (item.slot === 'weapon') item.hands = twoHandedClasses.has(item.weaponClass) && !oneHandedWeapons.has(item.id) ? 2 : 1;
}
const eventsBySite = new Map(events.map((event) => [event.id, event]));
const enemyCombatProfiles = {
  // 雾梁。壳硬的敌手容易看穿，轻巧的伏兽与看得准的猎手各有用力处。
  reed_hare: { perception: 4 },
  ford_silver_dace: { perception: 3 },
  ford_shale_crab: { perception: 4 },
  stone_badger: { perception: 5 },
  bank_runner: { perception: 12, strategy: 'predator' },
  caravan_lookout: { perception: 11 },
  caravan_guard_hound: { dodge: 0.08 },
  caravan_hook_guard: { accuracy: 0.08 },
  caravan_broker: { strategy: 'schemer' },
  herb_den_toad: { perception: 5 },
  herb_den_sawfish: { perception: 6, dodge: 0.09 },
  herb_den_elder: { perception: 21, strategy: 'bulwark' },
  vine_stag: { dodge: 0.07 },
  vine_king: { perception: 17, strategy: 'predator' },
  tide_spirit: { strategy: 'bulwark' },
  vein_sentinel: { perception: 8 },
  snow_rail_lynx: { perception: 7, dodge: 0.14 },
  snow_rail_hawk: { perception: 11, accuracy: 0.18 },
  snow_rail_shell: { perception: 6 },
  snow_rail_matron: { accuracy: 0.07 },
  snow_gully_otter: { dodge: 0.12 },
  snow_seam_crab: { perception: 9 },
  foundation_duelist: { perception: 18, accuracy: 0.07 },
  foundation_warden: { perception: 17, strategy: 'bulwark' },
  mirror_warden: { perception: 25, strategy: 'schemer' },
  river_spar_captain: { perception: 27, strategy: 'bulwark' },
  undertow_moundback: { perception: 22, strategy: 'predator' },

  // 照原。滑水的猎物、岸上的弩手、守着狭处的重甲各有不同的破法。
  zhao_reed_duck: { perception: 5 },
  zhao_moss_turtle: { perception: 5 },
  zhao_cargo_archer: { perception: 17, accuracy: 0.17 },
  zhao_cargo_shield: { perception: 16, strategy: 'bulwark' },
  zhao_cargo_hook: { perception: 18, dodge: 0.11 },
  zhao_cargo_keeper: { strategy: 'schemer', medicine: { id: 'heal_pill', count: 1 } },
  dyke_yard_otter: { perception: 10, dodge: 0.16 },
  dyke_yard_croc: { accuracy: 0.09 },
  dyke_yard_boar: { perception: 10 },
  dyke_old_croc: { accuracy: 0.08 },
  zhao_spar: { perception: 27 },
  fault_warden: { perception: 32, strategy: 'schemer' },
  ember_yak: { strategy: 'predator' },

  // 鸣沙。崖间的猞猁善闪，桥蝰与弩手善追招，真正会读招的对手另有出处。
  sand_salt_fox: { dodge: 0.10 },
  sand_rattle_viper: { accuracy: 0.12 },
  sand_silo_marten: { dodge: 0.06 },
  sand_iron_skink: { perception: 6 },
  sand_well_basilisk: { perception: 22, accuracy: 0.16, strategy: 'predator' },
  sand_glass_lynx: { perception: 23, dodge: 0.22, strategy: 'predator' },
  sand_anchor_scorpion: { perception: 12 },
  sand_riven_scorpion: { perception: 21, strategy: 'bulwark' },
  sand_quarry_skink: { dodge: 0.12 },
  sand_quarry_rockscorpion: { perception: 10 },
  sand_quarry_matriarch: { perception: 29, strategy: 'schemer' },
  ridge_armory_lynx: { dodge: 0.19 },
  ridge_armory_ram: { accuracy: 0.075 },
  sand_basket_mender: { perception: 33, strategy: 'duelist', medicine: { id: 'tide_pill', count: 1 } },
  sand_sundial_master: { perception: 35, strategy: 'schemer', medicine: { id: 'jade_pill', count: 3 } },
  border_axle_poleman: { perception: 14, strategy: 'predator' },
  border_wind_ambusher: { accuracy: 0.17, strategy: 'schemer' },
  border_kiln_shield: { perception: 18, strategy: 'bulwark' },
  border_silo_leader: { perception: 27, strategy: 'schemer' },
};
for (const enemy of enemies) {
  const human = enemy.tags.includes('human');
  const baseline = human ? 14 : enemy.tags.includes('beast') ? 6 : 9;
  const profile = enemyCombatProfiles[enemy.id] ?? {};
  const tier = enemy.tier ?? 0;
  enemy.perception = profile.perception ?? enemy.perception ?? baseline + 2 * tier;
  enemy.strategy = profile.strategy ?? enemy.strategy ?? (human ? 'duelist' : 'instinct');
  if (profile.dodge !== undefined) enemy.dodge = profile.dodge;
  if (profile.accuracy !== undefined) enemy.accuracy = profile.accuracy;
  if (profile.medicine) enemy.medicine = profile.medicine;
  const practice = enemyInnerStyles[enemy.id];
  if (practice) {
    const manual = innerStyles.find(({ id }) => id === practice.id);
    const rank = manual.ranks[practice.rank - 1];
    const focus = manual.specialty.includes(practice.weaponClass) ? rank.focus : null;
    enemy.innerStyleName = manual.name;
    enemy.hp += rank.base.hp ?? 0;
    enemy.atk += (rank.base.atk ?? 0) + (focus?.atk ?? 0);
    enemy.def += rank.base.def ?? 0;
    enemy.perception += rank.base.perception ?? 0;
    enemy.manualGuard = focus?.guard ?? 0;
    enemy.manualPierce = focus?.pierce ?? 0;
  }
}
const sparringEnemies = new Set(enemies.filter((enemy) => enemy.sparring).map((enemy) => enemy.id));
for (const site of sites) {
  if (!site.creatures || site.protectedArena) continue;
  const guards = new Set(eventsBySite.get(site.id)?.choices.flatMap((choice) => choice.guardedBy ?? []));
  for (const [id, pool] of Object.entries(site.creatures)) {
    if (!pool.interval || !pool.growth || pool.fixedPopulation || sparringEnemies.has(id) || solitaryTerritories.has(id)) continue;
    site.creatures[id] = {
      ...pool,
      start: pool.start > 0 ? pool.start + 1 : 0,
      cap: pool.cap + (guards.has(id) ? 1 : 2),
    };
  }
}

const equipmentSlots = { weapon: '主武器', offhand: '副手', armor: '盔甲', head: '头部', boots: '鞋子', belt: '饰品', charm: '法器' };

const data = { realms, items, gear, equipmentSlots, ammunition, foods, pills, talismans, arts, recipes, regions, sites, events, enemies, quests,
  services, market, deductions, rules: {}, starting, basket, victoryQuest, finalQuest, provinces, regionDetails, sects, mechanisms,
  innerStyles, enemyInnerStyles, roadBandits, tournament: tournamentData };

export { data, realms, items, gear, ammunition, foods, pills, talismans, arts, recipes, regions, sites, events, enemies, quests,
  services, market, deductions, starting, basket, victoryQuest, finalQuest, provinces, regionDetails, sects, mechanisms };
export default data;
