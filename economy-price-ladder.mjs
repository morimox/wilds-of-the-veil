const equipmentPrices = {
  cudgel: 5,
  straw_cape: 6,
  knife: 16,
  iron_sword: 33,
  hide_shield: 40,
  split_axe: 48,
  short_spear: 66,
  reed_hat: 68,
  iron_coat: 88,
  tide_spear: 104,
  weir_knife: 135,
  snow_halberd: 160,
  jade_pendant: 390,
  sky_cloak: 520,
  gauze_armor: 620,
  sky_sword: 620,
  coil_pole: 760,
  foil_sword: 980,
  gold_iron_blade: 4350,
  measuring_tide_staff: 6300,
  fault_coat: 6800,
  gold_tide_staff: 9250,
};

const supplyPrices = {
  meat_broth: 12,
  herb_stew: 60,
  crystal_feast: 145,
  heal_pill: 18,
  leaf_pill: 42,
  clear_qi_pill: 110,
  jade_pill: 165,
  sense_powder: 290,
  clear_needle: 12,
  cloud_arrow: 20,
};

const shelf = (interval, source, start = 1, cap = start) => ({ interval, source, start, cap });
const received = (interval, source, markup, cap = 1) => ({
  ...shelf(interval, source, 1, cap), imported: true, markup,
});

const regionalShops = {
  willow_post: [
    ['兵器铺', '柳桩铁柜', {
      knife: shelf(9, '船工托掌柜挂了几把割苇过绳的刀。'),
      tide_spear: shelf(16, '沿渡上岸的铁工托驿站代卖这柄分潮枪。'),
    }],
    ['护具铺', '堤边甲棚', {
      iron_coat: shelf(12, '修闸船的铁工按水手常用的衣式做出一件。'),
    }],
    ['丹药铺', '柳驿药柜', {
      salve: shelf(4, '从后院药工手里按斤收来，分包给走水路的人。', 3, 4),
      heal_pill: shelf(7, '照原来的药船沿水栈送货，驿站也留一匣。', 2, 3),
    }],
  ],
  lantern_court: [
    ['兵器铺', '灯院执事柜', {
      short_spear: shelf(12, '值夜的人换过枪杆，多备了一柄给沿河行商。'),
      tide_spear: received(25, '折水驿来上香的人捎来一柄分潮枪，等他下次来才能补货。', 0.20),
    }],
    ['丹药铺', '灯院药案', {
      qi_powder: shelf(5, '司灯弟子要走夜路，院医每隔几日配一小锅。', 3, 5),
      leaf_pill: received(11, '照原的药船带了清脉饮，院医只领到几囊。', 0.25, 2),
    }],
  ],
  zhao_city: [
    ['兵器铺', '蒲霖铁货铺', {
      knife: shelf(10, '城门下编苇席的人常来补刀，蒲霖也给他们留了一把。'),
      weir_knife: shelf(18, '看水闸的人常过来换刀，后炉留一柄应急。'),
      tide_spear: received(25, '折水驿的铁工凑齐船脚才送一柄分潮枪进城。', 0.35),
      snow_halberd: received(31, '鸣沙的商队将断雪戟缚在驼背上，过一趟关才有一件。', 0.30),
      sky_sword: shelf(20, '蒲霖的后炉按城中护堤人的用剑打成一把。'),
    }],
    ['护具铺', '南水门甲坊', {
      iron_coat: shelf(13, '水门换铆钉时，甲匠照船工的旧衣修出一件。'),
      sky_cloak: shelf(19, '蒲霖从沿堤的铁工那里订来一件合纹披甲。'),
    }],
    ['丹药铺', '河灯药行', {
      salve: shelf(4, '沿堤几家药户把膏烧好，进城再分装。', 5, 6),
      heal_pill: shelf(5, '靠泊水门的药船留一匣给常进矿的人。', 4, 6),
      leaf_pill: shelf(7, '药师等上游送齐草药和陶罐才熬一炉。', 3, 4),
      jade_pill: received(12, '守尺观把多的一瓶照心露托药船送进城，来货很少。', 0.30, 2),
    }],
  ],
  measuring_hall: [
    ['丹药铺', '观门药案', {
      heal_pill: shelf(6, '院医替巡堤弟子炼合络丹，药案留几颗给访客。', 3, 4),
      leaf_pill: shelf(7, '弟子到上游查水时捎草药，回来才重配。', 2, 3),
    }],
    ['箭符铺', '观门箭棚', {
      clear_needle: shelf(5, '器房试好新箭后，剩下的在廊下按捆卖。', 14, 20),
    }],
  ],
  mingsha_city: [
    ['兵器铺', '顾家器行', {
      coil_pole: shelf(24, '去高原烧窑的匠人带来回烟长杖，寄在城里的器柜。'),
      foil_sword: received(40, '这批霜缝剑由炭篷驿驻脚的商队转送进城。', 0.25),
      gold_iron_blade: received(38, '守尺观的货车经过盐道时，偶尔押一把厚背寒铁刀到这里。', 0.35),
      gold_tide_staff: shelf(44, '运盐的商队偶尔带一柄引潮杖入城，交器行寄卖。'),
    }],
    ['丹药铺', '避砂药堂', {
      salve: shelf(4, '当地药农先备洗伤用的膏，余下的送进城。', 2, 4),
      heal_pill: received(9, '从照原来的药船先过水栈，再由驮车带进城。', 0.25, 2),
      leaf_pill: shelf(6, '城里管井的药户清晨去盐坡以北收草。', 3, 5),
      jade_pill: shelf(8, '学过看火的药师拿驿口的灵晶煨药，每次只留几瓶。', 2, 3),
      clear_qi_pill: shelf(9, '进盐井前常要备归气丸，药堂用窑里烧成的罐子按日收存。', 2, 3),
    }],
  ],
  cinder_inn: [
    ['兵器铺', '炭篷寄卖柜', {
      foil_sword: shelf(28, '雪关商队来时会带一把霜缝剑，托脚店掌柜代卖。'),
    }],
    ['丹药铺', '炭篷药柜', {
      salve: shelf(5, '伤口里的砂要先洗干净，脚店后院平日就备着几包。', 2, 4),
      heal_pill: received(10, '药堂的驮车给脚店补货时才会多留两颗合络丹。', 0.30, 2),
    }],
  ],
  sand_bell_cloister: [
    ['兵器铺', '梁弦外院柜', {
      snow_halberd: shelf(18, '院外修具台替巡山的客人留一把修好的断雪戟。'),
    }],
    ['护具铺', '外院缝甲棚', {
      fault_coat: shelf(32, '走雾路的脚夫把一件横渊雨衣寄在叩石院。'),
    }],
    ['丹药铺', '石房药案', {
      qi_powder: shelf(5, '外院弟子按夜班人数留回气散，剩下的摆在石房。', 2, 4),
      jade_pill: received(15, '鸣沙城药堂出货后，值事弟子偶尔能领到一瓶。', 0.35),
    }],
  ],
};

const localLines = Object.fromEntries(Object.entries(regionalShops).map(([region, shops]) => [region,
  Object.fromEntries(shops.flatMap(([department, merchant, offers]) =>
    Object.entries(offers).map(([id, offer]) => [id, { ...offer, department, merchant }]))),
]));

const guildLine = { from: 'gold_brow_guard', to: 'gold_iron_blade', interval: 24 };
const guildOrders = [
  { id: 'tide_spear', office: 'outer', interval: 16, source: '折水驿给巡堤人补长兵时，器房多订了一把。' },
  { id: 'snow_halberd', office: 'outer', interval: 29, imported: true, markup: 0.25,
    source: '叩石院把修好的断雪戟随驮队捎来，每次至多一件。' },
  { id: 'foil_sword', office: 'inner', interval: 45, imported: true, markup: 0.30,
    source: '等炭篷驿的脚夫越过州界，才能往器柜补一把霜缝剑。' },
  { id: 'gold_tide_staff', office: 'elder', interval: 68, imported: true, markup: 0.35,
    source: '鸣沙给观里送阵用的盐，一同捎来一柄引潮杖。' },
];
const resaleFactor = [1, 1.65, 3];
const maximumResaleShare = 0.30;

export const marketPricePolicy = {
  equipmentPrices, supplyPrices, localLines, guildLine, guildOrders, resaleFactor, maximumResaleShare,
};

const postedPrice = (quote, offer) => Math.round(quote * (1 + (offer.markup ?? 0)));

export function applyMarketPriceLadder({ items, gear, market, regionDetails, measuringSect }) {
  const byId = new Map(items.map(item => [item.id, item]));
  const gearById = new Map(gear.map(item => [item.id, item]));
  const quotes = { ...equipmentPrices, ...supplyPrices };
  const replacement = measuringSect.store.find(offer => offer.id === guildLine.from);
  if (replacement) {
    replacement.id = guildLine.to;
    replacement.interval = guildLine.interval;
  }
  for (const [region, lines] of Object.entries(localLines)) {
    const goods = regionDetails[region].settlement.goods ??= {};
    for (const [id, line] of Object.entries(lines)) {
      const base = quotes[id] ?? goods[id]?.price ?? byId.get(id).price;
      goods[id] = { ...line, price: postedPrice(base, line) };
    }
  }
  for (const { offers } of market.stalls) {
    for (const { id } of offers) {
      if (quotes[id] !== undefined) byId.get(id).price = quotes[id];
    }
  }
  for (const { settlement } of Object.values(regionDetails)) {
    if (!settlement) continue;
    for (const [id, offer] of Object.entries(settlement.goods ?? {})) {
      if (quotes[id] !== undefined) offer.price = postedPrice(quotes[id], offer);
    }
  }
  for (const order of guildOrders) {
    if (!measuringSect.store.some(offer => offer.id === order.id)) {
      measuringSect.store.push({ ...order, category: '兵甲', stock: 1 });
    }
  }
  for (const offer of measuringSect.store) {
    if (quotes[offer.id] !== undefined) offer.price = postedPrice(quotes[offer.id], offer);
  }

  // A damaged or used piece stays useful as equipment, rather than financing the next one.
  for (const item of items) {
    const equipment = gearById.get(item.id);
    const buyingPrice = equipmentPrices[item.id];
    if (equipment && item.sell > 0) {
      const realm = Math.min(2, Math.floor(equipment.tier / 3));
      const usedPrice = Math.floor(item.sell * resaleFactor[realm]);
      item.sell = buyingPrice ? Math.min(usedPrice, Math.max(1, Math.round(buyingPrice * maximumResaleShare))) : usedPrice;
    }
    // Off-site goods retain a real retail value for item collateral, without being added to the home stalls.
    if (buyingPrice !== undefined) item.price = buyingPrice;
  }
}
