const goldEnemyResistance = {
  river_spar_captain: { physicalResist: 0.23, magicResist: 0.10 },
  undertow_moundback: { physicalResist: 0.27, magicResist: 0.08 },
  ember_yak: { physicalResist: 0.15, magicResist: 0.23 },
  fault_warden: { physicalResist: 0.09, magicResist: 0.42 },
  sand_glass_lynx: { physicalResist: 0.07, magicResist: 0.22 },
  sand_inverted_keeper: { physicalResist: 0.27, magicResist: 0.09 },
  sand_basket_mender: { physicalResist: 0.15, magicResist: 0.17 },
  sand_sundial_master: { physicalResist: 0.17, magicResist: 0.34 },
  sky_spillway_lizard: { physicalResist: 0.22, magicResist: 0.08 },
  sand_anchor_scorpion: { physicalResist: 0.34, magicResist: 0.06 },
  sand_spine_lizard: { physicalResist: 0.29, magicResist: 0.11 },
  sand_riven_scorpion: { physicalResist: 0.36, magicResist: 0.06 },
  sand_quarry_guard: { physicalResist: 0.24, magicResist: 0.09 },
  sand_quarry_matriarch: { physicalResist: 0.29, magicResist: 0.18 },
  ridge_armory_lynx: { physicalResist: 0.06, magicResist: 0.20 },
  ridge_armory_ram: { physicalResist: 0.25, magicResist: 0.16 },
  road_wind_swordsman: { physicalResist: 0.16, magicResist: 0.13 },
  road_black_bowist: { physicalResist: 0.09, magicResist: 0.18 },
  road_sandal_halberd: { physicalResist: 0.25, magicResist: 0.10 },
  bandit_salt_cave_chief: { physicalResist: 0.20, magicResist: 0.19 },
};

const enemySpells = {
  marsh_ghost: { qi: 8, costs: { 借雾扑面: 4 } },
  bell_wraith: { qi: 18, costs: { 聚响压顶: 6, 崩响回荡: 4 } },
  tide_spirit: { qi: 24, costs: { 返潮扫岸: 5, 闭闸合潮: 8 } },
  wick_husk: { qi: 16, costs: { 借火贴身: 6 } },
  foundation_kiln_echo: { qi: 16, costs: { 翻灰试火: 4 } },
  herb_den_sawfish: { qi: 8, costs: { 翻鳃带走水气: 4 } },
  vine_stag: { qi: 14, costs: { 角上引湿: 5 } },
  foundation_warden: { qi: 21, costs: { 藏炉吸气: 5 } },
  herb_den_lizard: { qi: 20, costs: { 衔水抽气: 5 } },
  snow_warden: { qi: 22, costs: { 卷冷风: 5 } },
  snow_rail_matron: { qi: 20, costs: { 贴板喷寒: 5 } },
  snow_gully_otter: { qi: 18, costs: { 团水纳息: 5 } },
  mirror_warden: { qi: 28, costs: { 梁影横压: 8, 抽气归镜: 6 } },
  river_copper_echo: { qi: 24, costs: { 踩着回声迫近: 6 } },
  ford_lower_spirit: { qi: 25, costs: { 压暗灯罩: 6 } },
  lab_crawler: { qi: 26, costs: { 从铜槽喷出冷气: 7 } },
  zhao_sluice_echo: { qi: 17, costs: { 从板缝引走真气: 5 } },
  zhao_sluice_wash: { qi: 18, costs: { 咬住槽沿吮气: 5 } },
  zhao_sluice_shade: { qi: 20, costs: { 甩出一道冷水: 6 } },
  zhao_sluice_anchor: { qi: 29, costs: { 从石缝往回抽气: 6, 由低处顶起水柱: 8 } },
  sand_well_basilisk: { qi: 28, costs: { 喷出带寒气的白沫: 7 } },
  terrace_finalist: { qi: 30, costs: { '把尺垂下，探你的气息': 6 } },
  border_silo_roof: { qi: 28, costs: { 贴窗引气: 6, 回身再抽真气: 7 } },
  border_silo_leader: { qi: 31, costs: { 折刀牵气: 7 } },
  ridge_armory_lizard: { qi: 28, costs: { 贴砂引气: 6 } },

  undertow_moundback: { qi: 35, costs: { 掀来倒流的潮水: 8 } },
  ember_yak: { qi: 36, costs: { 甩尾卷火: 8 } },
  fault_warden: {
    qi: 56,
    costs: { 借水柱跃起拍向岸边: 7, 双手挥下两道水刃: 12, 引来水流抽走真气: 9, 顺着回潮斜劈: 8 },
    recover: { kind: 'recoverQi', name: '合手引回柱旁的水气', recover: 13 },
  },
  sand_glass_lynx: { qi: 29, costs: { 扬起呛人的晶尘: 7 } },
  sand_inverted_keeper: { qi: 35, costs: { 收紧锁链护身: 7 } },
  sand_sundial_master: { qi: 48, costs: { 连拖三步: 8, 借石光从下往上挑刀: 11 } },
  sky_spillway_lizard: { qi: 30, costs: { 两脊拨水闭息: 7 } },
  sand_spine_lizard: { qi: 30, costs: { 张鳞卷砂: 7 } },
  sand_quarry_guard: { qi: 31, costs: { 张喉卷走石尘: 8 } },
  sand_quarry_matriarch: { qi: 40, costs: { 张口吸进冷砂: 9 } },
  ridge_armory_lynx: { qi: 28, costs: { 埋耳借风: 7 } },
  ridge_armory_ram: { qi: 39, costs: { 扬头牵走风气: 9 } },
};

const forgedGear = [
  {
    item: { id: 'gold_scale_coat', name: '藏鳞甲', kind: 'gear', price: 0, sell: 50,
      desc: '深色鳞片一层盖一层，缝好后扳不动最外一片。' },
    gear: { slot: 'armor', tier: 6, def: 10, hp: 15, durability: 78, repair: 32,
      physicalResist: 0.23, magicResist: 0.05,
      entry: '金丹初期可穿。厚鳞顺着来劲滑开刀锋和兽爪，也能稍挡术法。' },
    recipe: { tier: 6, reveal: { item: 'quarry_back_spine', need: { quarry_back_spine: 1 } }, cost: 76, days: 7,
      need: { hard_scale: 18, hide: 8, ore: 12, black_iron: 10, gold_core: 5 },
      desc: '照得来的硬刺磨出叠鳞的弧度。用兽革收边，硬刺留作样子。' },
  },
  {
    item: { id: 'gold_brow_guard', name: '寒铁护额', kind: 'gear', price: 0, sell: 34,
      desc: '一圈打薄的寒铁从眉上绕到两侧鬓角，额心压着细小的晶粒。' },
    gear: { slot: 'head', tier: 7, def: 1, hp: 4, qi: 4, perception: 3, durability: 53, repair: 19,
      physicalResist: 0.06, magicResist: 0.07,
      entry: '金丹中期可戴。薄铁能隔开擦过额角的兵刃，晶粒也能卸去些贴近的术法。' },
    recipe: { tier: 7, reveal: { item: 'phase_chart' }, cost: 54, days: 5,
      need: { ore: 11, black_iron: 5, core: 6, hide: 3, gold_core: 3 },
      desc: '铜板的两排刻线能对照晶粒的位置。让箍的两端受力一样，再用兽革包住贴头的一面。' },
  },
  {
    item: { id: 'gold_spirit_pendant', name: '静水护心佩', kind: 'gear', price: 0, sell: 45,
      desc: '水纹从佩心往外刻，直到一圈没有接缝的暗金边。' },
    gear: { slot: 'charm', tier: 8, def: 1, hp: 4, qi: 10, durability: 61, repair: 24,
      physicalResist: 0.04, magicResist: 0.15,
      entry: '金丹后期可佩，能多存些真气。术法打来时，水纹一圈接一圈分开冲劲，也能挡去一点兵刃力道。' },
    recipe: { tier: 8, reveal: { item: 'fault_receipt' }, cost: 72, days: 6,
      need: { core: 10, black_iron: 8, ore: 5, gold_core: 5 },
      desc: '旧约记着先向哪边放水。护心佩照这个次序刻开水纹，让打来的气劲沿浅槽分散。' },
  },
  {
    item: { id: 'gold_iron_blade', name: '厚背寒铁刀', kind: 'gear', price: 0, sell: 50,
      desc: '刀背留得很厚，愈到刀尖愈薄，刃口只比兽鳞的接缝稍宽。' },
    gear: { slot: 'weapon', weaponClass: 'blade', hands: 1, tier: 6, atk: 11, def: 1, perception: 3,
      durability: 70, repair: 27, trait: { kind: 'pierce', enemyTag: 'scaled', bonus: 2 },
      entry: '金丹初期可用的单手刀。刃口容易切进兽鳞的接缝，连着用刀也不耗真气。' },
    recipe: { tier: 6, reveal: { item: 'cold_kiln_record' }, cost: 73, days: 6,
      need: { ore: 16, black_iron: 11, hide: 4, core: 6, gold_core: 5 },
      desc: '照冷炉册的火候淬薄刃，刀背在炉外慢慢放凉。' },
  },
  {
    item: { id: 'gold_tide_staff', name: '引潮杖', kind: 'gear', price: 0, sell: 53,
      desc: '杖头装着两块对合的灵晶。从侧面看，中间留了道细缝。' },
    gear: { slot: 'weapon', weaponClass: 'staff', hands: 2, tier: 7, atk: 8, magicAtk: 4, def: 1, perception: 4, qi: 8,
      durability: 66, repair: 27,
      entry: '金丹中期可持的双手杖。杖头将放出的真气拢在一线，施展伤人的术法更有力。拿它直接打人时是普通杖击。' },
    recipe: { tier: 7, reveal: { item: 'phase_chart' }, cost: 77, days: 6,
      need: { wood: 10, ore: 6, core: 12, black_iron: 7, gold_core: 5 },
      desc: '两块灵晶照铜板上的滴水间距排开，中间的小缝给真气留路。' },
  },
];

const goldArts = [
  { id: 'gold_ember_point', name: '伏火指', tier: 6, cost: 11, power: 17, pierce: 4, guard: 0, break: 0,
    price: 61, weaponBased: false, damageType: 'magic', reveal: { item: 'cold_kiln_record' },
    desc: '照冷炉册的熄火时机收住一口气，再从指尖送出。力道集中，适合打穿硬壳。' },
  { id: 'gold_push_tide', name: '推潮掌', tier: 8, cost: 14, power: 24, pierce: 4, guard: 2, break: 0,
    price: 86, weaponBased: false, damageType: 'magic', reveal: { item: 'fault_receipt' },
    desc: '按湖底的分水法把气送入两掌，合掌时一并推出。出手很重，也要费不少真气。' },
];

export function tuneCombatData({ enemies, gear, items, recipes, arts }) {
  for (const enemy of enemies) {
    Object.assign(enemy, goldEnemyResistance[enemy.id]);
    const spells = enemySpells[enemy.id];
    if (!spells) continue;
    enemy.qi = spells.qi;
    enemy.intents = enemy.intents.map((intent) => {
      const qiCost = spells.costs[intent.name];
      return qiCost ? { ...intent, damageType: 'magic', qiCost } : intent;
    });
    if (spells.recover) enemy.intents.push(spells.recover);
  }

  for (const piece of gear) {
    if (piece.id === 'fault_coat') {
      Object.assign(piece, { physicalResist: 0.08, magicResist: 0.22 });
      piece.entry += '夹层也能散掉不少打来的术法。';
    } else if (piece.id === 'ridge_bracer') {
      Object.assign(piece, { physicalResist: 0.12, magicResist: 0.03 });
      piece.entry += '厚片贴臂，也能卸去一些平常的拳脚和兵刃力道。';
    }
  }
  for (const { item, gear: profile, recipe } of forgedGear) {
    items.push(item);
    gear.push({ id: item.id, ...profile });
    recipes.push({ id: `r_${item.id}`, result: item.id, count: 1, facility: 'forge', facilityLevel: 3, ...recipe });
  }

  const doubleFlow = arts.find(({ id }) => id === 'core_spindle');
  if (doubleFlow) {
    Object.assign(doubleFlow, { cost: 12, power: 16, pierce: 3, guard: 3, break: 6 });
  }
  arts.push(...goldArts);
}
