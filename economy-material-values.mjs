const resources = [
  ['wood', 'open', 'gather', null, 1, 1, '河滩、林地的散枝和木料。受看守的木料仍按通货结算。'],
  ['reed', 'open', 'gather', null, 2, 2, '白苇滩和各州露在地表的普通灵草。'],
  ['hide', 'open', 'gather', null, 3, 3, '可从常见猎物取得，雪关也能直接捡蜥蜕。'],
  ['ore', 'open', 'gather', null, 5, 3, '散落在矿口、浅滩等处的寒铁。矿道深处的同种寒铁仍按通货结算。'],
  ['core', 'open', 'gather', null, 5, 4, '浅滩和矿口的通用灵晶，有无需战斗的稳定来源。'],
  ['black_iron', 'open', 'gather', null, 7, 5, '旧矿槽和地表散砂能捡到，守兽后方同名矿石仍按通货结算。'],
  ['kiln_clay', 'open', 'gather', null, 3, 2, '云炉石谷有外露泥层。守窑兽后的同种泥料仍按通货结算。'],
  ['millet_seed', 'open', 'gather', null, 1, 1, '可以买种或随耕作留种，无战斗门槛。'],
  ['millet_grain', 'open', 'gather', null, 1, 1, '耕作收粮，瓦棚外也能拾到零散谷子。'],
  ['beast_meat', 'guarded', 'hunt', 0, 0, 1, '炼气期便能狩猎取得的普通兽肉，高阶妖兽也有这类肉。'],
  ['qi_core', 'guarded', 'hunt', 0, 7, 6, '炼气妖兽和精怪，常见每战一至数枚。'],
  ['beast_eye', 'guarded', 'hunt', 1, 0, 7, '少数妖兽的灵眼，最低从炼气中期一类妖兽取得。'],
  ['foundation_core', 'guarded', 'hunt', 3, 21, 48, '筑基妖兽的妖丹，数量与必掉概率依猎物而定。'],
  ['foundation_meat', 'guarded', 'hunt', 3, 0, 8, '能用来做较高阶料理的筑基兽肉。'],
  ['battle_sinew', 'guarded', 'hunt', 3, 0, 20, '石羚、斑獭类强韧兽筋的常规货源需狩猎。'],
  ['hard_scale', 'guarded', 'hunt', 3, 0, 13, '常规货源是筑基以上的有壳妖兽。干工房旧柜只有少量留存。'],
  ['gold_core', 'guarded', 'hunt', 6, 37, 200, '金丹妖兽和精怪的妖丹，强猎物一战能带回数枚。'],
  ['gold_meat', 'guarded', 'hunt', 6, 0, 42, '供高阶料理使用的金纹兽肉。'],
];

const guardedDeposits = [
  {
    id: 'silver_leaf_heart', name: '银脉草心', sell: 52, tier: 2, site: 'vine_pond',
    guards: ['vine_king', 'vine_stag'], victory: 'vine_king',
    count: 1, days: 0.625, interval: 15,
    label: '到坝根剪一枚银脉草心',
    cue: '坝根那撮嫩叶长在斜石背后。得踩过鹿群常走的窄滩，才够得着。',
    outcome: '你剪下嫩尖，留下沾泥的根。切口渗出一滴清汁。',
    desc: '坝根背水处的嫩尖，叶脉密，切口有清汁。篁泽药谷的泽医用这股汁配缓脉丹。',
    note: '白藤塘坝根。须胜白纹鹿王并清走近旁藤鹿。每次最多一枚，重新生长要十五日。藤鹿回来后须重新清路。可带到篁泽药谷请泽医配两枚缓脉丹。',
  },
  {
    id: 'bell_crystal_sand', name: '鸣纹晶砂', sell: 76, tier: 5, site: 'counter_bell_score',
    guards: ['river_copper_echo'], victory: 'river_copper_echo',
    count: 2, days: 0.875, interval: 0,
    label: '筛古钟背后凹槽里的细砂',
    cue: '墙缝里的细砂贴在钟背上，顺着钟纹叠了薄薄两层。',
    outcome: '细砂落进布上，拨动时像有极轻的铃声。凹槽已经见底。',
    desc: '古钟背后筛下来的细砂，摇起来轻轻作响。叩石院的梁弦用它磨能穿水的重矢。',
    note: '反声钟窟，打散屈膝铜影后从钟背筛出。仅有两份，挖尽后不会再结砂。叩石院可加工成照水重矢。',
  },
  {
    id: 'coldvein_herb', name: '寒脉草', sell: 152, tier: 6, site: 'undertow_bed',
    guards: ['undertow_moundback'], victory: 'undertow_moundback',
    count: 2, days: 0.75, interval: 0,
    label: '俯身掘出石背的白根',
    cue: '黑泥旁有两条细白根探出石背。水往侧洞流，石背这一点仍露着。',
    outcome: '你从石背掘出两条白根，根头摸着比流水还凉。石缝里剩下的是枯须。',
    desc: '生在回潮洞石背的白根，离水后仍冰凉。斜漏水驿的施荀拿它给归元丹清炉。',
    note: '回潮洞侧洞口，须击败挡路的驮泥大蛇。白根只有两条，原地不会重新长出。可请斜漏水驿的施荀代炼归元丹。',
  },
  {
    id: 'ember_ore_pith', name: '赤纹石髓', sell: 145, tier: 6, site: 'zhao_bank_fire',
    guards: ['ember_yak'],
    count: 2, days: 1.125, interval: 22,
    label: '撬开湿帘后带红纹的石层',
    cue: '帘脚暗金下面还有一块红纹石。贴着出风的石边能下撬子。',
    outcome: '表面的一层石皮落了下来。红纹集中在里头两块石髓上，冷透后仍浅浅发亮。',
    desc: '赤泥横穴火道旁的石髓。切开才见细红纹，能炼进凝神用的护佩。',
    note: '伏火坑赤泥横穴。须清走伏灰炭魈，每二十二日最多两份。炭魈先于矿髓重新出现。',
  },
];

const guardedWork = [
  ['mist_shelter', '请泽医用银脉草心配缓脉丹', { silver_leaf_heart: 1, reed: 1 }, 8, 0.625, { gold_salve: 2 },
    '泽医用一片普通灵草托住嫩芽，把清汁滴进温罐。等药汁收成两丸，他将丹药包好递给你。'],
  ['sand_ring_maker', '请梁弦用鸣纹晶砂磨一捆照水重矢', { bell_crystal_sand: 1, ore: 3 }, 5, 0.625, { clear_needle: 16 },
    '梁弦把细砂铺在磨石上，一根根磨净箭头两侧。他往水盆里试过一箭，才把半干的箭一齐束好交给你。'],
  ['zhao_leak_bench', '请施荀用寒脉草代炼归元丹', { coldvein_herb: 1, black_iron: 5, qi_powder: 2 }, 24, 1.25, { return_breath_pill: 3 },
    '施荀在里屋支起小炉，关上挡雾的木门，把白根须截进炉脚的水碗。水凉了两回，丹药才收干。他开炉验过成色，将三枚归元丹装进布袋。',
    '施荀请你进里屋一同看炉。屋里门板厚，河雾进不来。'],
];

const rareTrophies = [
  {
    id: 'dyke_gill_scale', name: '老鳄喉鳞', enemy: 'dyke_old_croc', tier: 5, sell: 100,
    desc: '老鳄喉下最厚的一片鳞。边缘有水磨出的圆口，内侧还能摸到硬骨。',
    note: '沉木滩老鳄战后取得的一片完整喉鳞，可交商贩。炼器所用的老鳄背筋另有用途。',
  },
  {
    id: 'white_lizard_tail_spur', name: '白蜥尾棘', enemy: 'sand_quarry_matriarch', tier: 7, sell: 440,
    desc: '白额老蜥尾尖的一枚骨棘。棘尖磨得发白，根部还带着一片暗色硬鳞。',
    note: '击败露天石场的白额老蜥后可得一枚，可交商贩。背上的硬刺仍能留下作炼器样板。',
  },
];

export const materialEconomy = [
  ...resources.map(([id, access, source, tier, formerSell, sell, note]) => ({ id, access, source, tier, formerSell, sell, note })),
  ...guardedDeposits.map(({ id, tier, sell, note, site, guards }) => ({
    id, access: 'guarded', source: 'protectedGather', tier, formerSell: 0, sell, note, site, guards,
  })),
  ...rareTrophies.map(({ id, tier, sell, note, enemy }) => ({
    id, access: 'guarded', source: 'hunt', tier, formerSell: 0, sell, note, enemy,
  })),
];

const values = new Map(materialEconomy.map(row => [row.id, row]));

export const materialDemandRules = {
  black_iron: { capacity: 10, replenished: 4, days: 5, reserveRate: 0.7 },
  qi_core: { capacity: 18, replenished: 10, days: 4, reserveRate: 0.83 },
  foundation_core: { capacity: 14, replenished: 7, days: 5, reserveRate: 0.84 },
  gold_core: { capacity: 16, replenished: 9, days: 5, reserveRate: 0.86 },
};

// Preserve each shop's preexisting premium or preference at the new scale.
export function materialBuyback(id, legacyPrice, fallback) {
  const row = values.get(id);
  if (!row || legacyPrice == null) return legacyPrice ?? fallback;
  if (legacyPrice <= 0) return legacyPrice;
  if (row.access === 'open') {
    const localPreference = Math.max(-1, Math.min(1, legacyPrice - row.formerSell));
    return Math.max(1, Math.min(5, row.sell + localPreference));
  }
  if (!row.formerSell) return row.sell + Math.max(0, Math.min(1, legacyPrice - row.sell));
  const ratio = legacyPrice / row.formerSell;
  return Math.max(1, Math.round(row.sell * Math.min(1.2, Math.max(0.85, ratio))));
}

export function applyMaterialEconomy({ items, sites, events, enemies }) {
  for (const deposit of guardedDeposits) {
    const { id, name, desc, site: siteId, label, cue, outcome, count, days, interval, guards, victory } = deposit;
    const site = sites.find(entry => entry.id === siteId);
    const event = events.find(entry => entry.id === siteId);
    site.stocks ??= {};
    if (site.stocks[id]) continue;
    const index = event.choices.length;
    site.stocks[id] = { label: name, start: count, cap: count, interval, growth: interval ? count : 0, choices: [index] };
    event.choices.push({ label, desc: cue, days, guardedBy: guards, ...(victory ? { afterFight: victory } : {}),
      loot: { [id]: count }, outcome });
    items.push({ id, name, kind: 'material', price: 0, sell: 0, desc,
      ...(!interval ? { finiteSource: count } : {}) });
  }
  for (const [site, label, need, cost, days, loot, outcome, shelteredWork] of guardedWork) {
    const event = events.find(entry => entry.id === site);
    if (!event.choices.some(choice => choice.label === label)) {
      const shelter = shelteredWork ? { desc: shelteredWork, fogShelter: true } : {};
      event.choices.push({ label, need, coins: -cost, days, loot, outcome, consume: true, hidden: true, stay: true, ...shelter });
    }
  }
  for (const { id, name, enemy, desc } of rareTrophies) {
    const record = enemies.find(entry => entry.id === enemy);
    (record.loot ??= {})[id] = 1;
    if (!items.some(item => item.id === id)) items.push({ id, name, kind: 'material', price: 0, sell: 0, desc, finiteSource: 1 });
  }
  for (const item of items) {
    const row = values.get(item.id);
    if (!row) continue;
    item.sell = row.sell;
  }
}
