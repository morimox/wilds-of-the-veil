export const progressionReissues = [
  { item: 'seal', site: 'tide_keeper', beforeQuest: 'last_lantern',
    label: '请听潮人照石槽里的印样补铸一枚', need: { ore: 2, wood: 2 }, days: 0.75,
    outcome: '听潮人拿松木封好石槽边沿，再把烧软的寒铁压进印样。「内槽有初铸时留下的凹纹。拿这枚补印去村里，文书上盖出来是一样的。」' },
  { item: 'sky_seal', site: 'mirror_gate', beforeQuest: 'sky_treaty',
    label: '照印座的反纹重制一枚衡印', need: { ore: 2, core: 1 }, days: 0.75,
    outcome: '印座最深处还留着完整的反纹。你用灵晶照清边线，压好一枚寒铁补印，每一条水线都能对上原位。' },
  { item: 'foundation_ledger', site: 'kiln_flue', beforeItem: 'foundation_letter',
    label: '再拓一份碎砖上的收药账', need: { reed: 1 }, days: 0.375,
    outcome: '移开粘在石砖上的焦纸碎角，下边还能印出缺角的三枚旧印。你用苇纸拓下一份。' },
  { item: 'foundation_spar_mark', site: 'foundation_duel', beforeItem: 'foundation_delivery',
    label: '请守书人补盖试剑印', need: { reed: 1 }, days: 0.25,
    outcome: '守书人翻开夹着借卷帖的册子，翻到你的页签。「这场早记过了。」他取印补盖一张。' },
  { item: 'foundation_kiln_seal', site: 'foundation_kiln', beforeItem: 'foundation_snow_order',
    label: '用挡板浅槽里的印痕重铸半枚旧印', need: { ore: 1, kiln_clay: 1 }, days: 0.5,
    outcome: '你用耐火泥从浅槽取样，再用寒铁压出同样的半印。原先缺去的那一角仍和安蒲手上的纹能接拢。' },
  { item: 'foundation_warden_proof', site: 'foundation_court', beforeItem: 'formula_foundation',
    label: '请护炉人补一枚留火印', need: { ore: 1 }, days: 0.375,
    outcome: '护炉人从灯脚下取出母印，顺着熄火的刻线压出一枚补印。「你早过了试验，这枚拿稳些。」' },
  { item: 'ferry_manifest', site: 'ford_packet_boat', beforeQuest: 'last_lantern',
    label: '请夏狄给货单再抄一份', need: { reed: 1 }, days: 0.25,
    outcome: '夏狄从船案的留底上抄了一份，照旧写上你的名字，再沿签名盖印。' },
  { item: 'zhao_sand_chit', site: 'zhao_float_goods', beforeItem: 'sand_writ',
    label: '请余节照留底再刻一张货签', need: { wood: 1 }, days: 0.25,
    outcome: '余节翻到秋天的货账，照原号刻好木签，在背面补上柯伯认得的署名。' },
  { item: 'sand_writ', site: 'zhao_ridge_permit',
    label: '请柯伯照关册补验通行牌', need: { wood: 1 }, days: 0.25,
    outcome: '柯伯翻到原先登记的那一页，换了块木牌，两头各补盖一枚关印。' },
  { item: 'return_tide_note', site: 'zhao_retreat_marks', beforeItem: 'undertow_wedge',
    label: '在碑背重拓退潮印纸', need: { reed: 1 }, days: 0.375,
    outcome: '你照着退向白苇滩的刻纹重新拓了一遍，沿原纸的折角写上施荀的名字。' },
  { item: 'undertow_wedge', site: 'zhao_leak_bench', beforeItem: 'undertow_entry',
    label: '请施荀照原样削一枚铁楔', need: { ore: 2, wood: 1 }, days: 0.5,
    outcome: '施荀把记凹槽的旧尺贴在寒铁上，留出三道一样宽的槽。你拆下木模，新的铁楔便能带走。' },
  { item: 'sand_watch_register', site: 'sand_city_registry', beforeItem: 'sand_well_chit',
    label: '请鲁勤再抄一份盐井换班册', need: { reed: 1 }, days: 0.25,
    outcome: '鲁勤从原册里核对当值的三人，将换班页抄好，再盖一次原来的印。' },
  { item: 'sand_well_chit', site: 'sand_salt_ledger', beforeItem: 'cold_kiln_record',
    label: '请邢茧照旧存联补一张井票', need: { reed: 1 }, days: 0.25,
    outcome: '邢茧展开上次验过的存联，在新票上斜盖两道印。「拿去给闻銮看，他那头也留着票根。」' },
  { item: 'cold_kiln_record', site: 'sand_cold_kiln_house',
    label: '请阮杪重新誊抄冷炉验火册', need: { reed: 2, wood: 1 }, days: 0.75,
    outcome: '阮杪解开压住墙上原件的井绳，重新抄下火候和三枚印，压进两片木板之间。' },
  { item: 'phase_chart', site: 'zhao_submerged_table',
    label: '在留下的铜板上重新印滴水图', need: { reed: 1 }, days: 0.375,
    outcome: '铜板上的插销还松着。你翻出背面，把两排滴水记号重新印在纸上。' },
];

export function addProgressionRecovery(items, events) {
  const itemRecords = new Map(items.map((item) => [item.id, item]));
  const eventRecords = new Map(events.map((event) => [event.id, event]));
  for (const { site, item, beforeQuest, beforeItem, ...choice } of progressionReissues) {
    itemRecords.get(item).discardable = true;
    const materials = Object.entries(choice.need).map(([id, count]) => `${itemRecords.get(id).name}×${count}`).join('、');
    eventRecords.get(site).choices.push({
      ...choice, desc: `补制需要${materials}。`, consume: true, loot: { [item]: 1 },
      reissue: { item, beforeQuest, beforeItem },
    });
  }
}
