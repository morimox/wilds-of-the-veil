const bench = 'ridge_armory_bench';
const refuge = 'ridge_armory_refuge';
const leader = 'ridge_armory_ram';
const horn = 'ridge_ramhorn';
const pattern = 'ridge_bracer_pattern';
const bracer = 'ridge_bracer';
const commission = 'ridge_bracer_commission';
const animals = ['ridge_armory_goat', 'ridge_armory_lizard', 'ridge_armory_lynx', leader];

const fixed = (count) => ({ start: count, cap: count, interval: 0, growth: 0 });
const strike = (name, kind, mult = 1) => ({ name, kind, mult });
const item = (id, name, kind, desc) => ({ id, name, kind, price: 0, sell: 0, desc });

export const ridgeArmoryContent = {
  items: [
    { ...item(horn, '岩羚的弯角', 'key', '角根嵌着一截折断的弦钩。双手掰一掰，松手时薄的一侧会弹回原处。梁弦在找这样的弧度。'), physical: true },
    item(pattern, '回力护腕图', 'key', '梁弦把护腕的两根横筋画在角弧里，又补了一笔掌侧的松扣。图旁压着一句：让入臂的劲循原路退回去。'),
    item(bracer, '回力护腕', 'gear', '暗金片底下绷着几根短筋，贴身重击落在护腕上时，有一股力会沿弯角弹回来。'),
  ],
  gear: [
    { id: bracer, slot: 'offhand', tier: 6, def: 1, qi: 3, brace: 4, durability: 63, repair: 22,
      trait: { kind: 'reflect', intent: 'heavy', bonus: 4 },
      entry: '金丹初期可用，占一只手。能卸开些近身重击。挡不尽而仍受伤时，短筋回弹，也会打疼对手。' },
  ],
  recipes: [
    { id: 'r_ridge_bracer', result: bracer, count: 1, tier: 6, facility: 'forge', facilityLevel: 3,
      reveal: { item: pattern, need: { [horn]: 1 } }, cost: 62, days: 6,
      need: { battle_sinew: 12, black_iron: 9, hard_scale: 6, gold_core: 4 },
      desc: '照手里的弯角把暗金压好，再用坚韧兽筋绷紧，护腕内侧垫厚甲片。原角留着比形。' },
  ],
  sites: [
    { id: bench, region: 'sand_bell_cloister', name: '梁师傅的旧弓架', once: [0], localQuests: [commission],
      afterOnceText: { 0: '学徒已把断绳换下，梁弦正用木尺量仍完好的弦。院墙外能看见架风板顶上露出来的石梁。' },
      afterQuestText: { [commission]: '学徒用包了皮的双手拉开旧弓。弦稳稳地绷在新钩上，梁弦转过木尺，在钩边添了一道记号。' } },
    { id: refuge, region: 'wind_slate', name: '挡风板后的旧弓弦库', afterChoices: [`${bench}:0`],
      creatures: {
        ridge_armory_goat: fixed(16), ridge_armory_lizard: fixed(8), ridge_armory_lynx: fixed(5), [leader]: fixed(1),
      },
      creatureText: {
        ridge_armory_goat: { present: '库墙拐角的绳头还在颤，矮门洞里露出几对岩羊蹄子。', absent: '羊蹄印已经蒙了砂。' },
        ridge_armory_lizard: { present: '两块旧簧片碰了一下，一条淡黄尾巴从底下掠过。', absent: '压簧片的旧石下只剩脱落的鳞屑。' },
        ridge_armory_lynx: { present: '外墙角勾着赤毛，石梁上的软沙被踩出了几处深印。', absent: '落砂盖住了石梁上的爪印。' },
        [leader]: { present: '往北看，立着的风板让一根大角蹭得歪了一寸。', absent: '北面的风板靠在墙上，再也没有大角来顶。' },
      } },
  ],
  events: [
    { id: bench, name: '梁师傅的旧弓架',
      text: '学徒踩着凳子试拉架上的旧弓，弦刚绷紧就脱了钩，掀开他的手。梁弦拿木尺指了指挂钩缺了一块的地方。',
      choices: [
        { label: '问梁弦缺的是哪一截', days: 0.125, stay: true,
          outcome: '「旧件全在架风板底下。沿板边找断绳，进石门，碰上妖物就从矮墙退。」他指指折钩上的一缕毛。「一只大角羚顶歪了梁。我想看看它角根的弧度，断了的钩就是顺这个道理做的。」' },
      ] },
    { id: refuge, name: '挡风板后的旧弓弦库',
      text: '断绳从风板底下伸进石门。贴矮墙能直接进库，一边仍有出去的坡道。沿外石梁绕过去，能站在库门对面，隔空看见里面的出脚处。',
      choices: [
        { label: '贴矮墙进库', desc: '这里近，转身就是回去的缓坡。', days: 0.25, encounter: animals,
          outcome: '刚过矮墙，有什么从宽石边翻了过来。' },
        { label: '沿外侧的石梁绕到仓门对面', desc: '得多走一段。这里隔着开阔的砂地，能先看见出库的东西。', days: 0.5,
          encounter: animals, openingRange: true, outcome: '你站上斜梁，库门里的影子踏出石门，踩进两边之间的砂地。' },
      ] },
  ],
  enemies: [
    { id: 'ridge_armory_goat', name: '咬绳子的岩羊', tier: 4, hp: 69, atk: 16, def: 5, tags: ['beast', 'furred'], insight: 6,
      intents: [strike('侧头顶开绳架', 'attack'), strike('屈腿护住颈侧', 'guard', 1.32), strike('踩梁蹬出', 'heavy', 1.53)],
      desc: '颈毛里还缠着几根旧麻丝，蹄子却在木架上踩得稳。',
      loot: { beast_meat: 3, hide: 1, battle_sinew: 1 }, chanceLoot: { foundation_core: { count: 1, chance: 0.58 } } },
    { id: 'ridge_armory_lizard', name: '沙地石蜥', tier: 5, hp: 91, atk: 18, def: 8, tags: ['beast', 'scaled'], insight: 8,
      intents: [strike('扣腹贴地', 'guard', 1.46), strike('扫尾带起细砂', 'attack'), strike('甩背击梁', 'heavy', 1.58), strike('贴砂引气', 'drain', 0.72)],
      desc: '背鳞沿砂棱排成一列。贴地伏着时几乎看不到，甩尾时却会把整片鳞都立起来。',
      loot: { hard_scale: 2, battle_sinew: 1, beast_meat: 2 }, chanceLoot: { foundation_core: { count: 2, chance: 0.65 } } },
    { id: 'ridge_armory_lynx', name: '崖边的红猞猁', tier: 6, hp: 113, atk: 22, def: 7, tags: ['beast', 'furred'], insight: 10,
      intents: [strike('顺梁横掠', 'attack'), strike('埋耳借风', 'drain', 0.82), strike('蹬墙探爪', 'heavy', 1.58), strike('翻身扫腿', 'attack', 1.07)],
      desc: '背上的毛被风梳成两股。两只耳朵一齐伏下时，它就要借墙腾起。',
      loot: { gold_core: 1, beast_meat: 3, hide: 2, battle_sinew: 2 },
      chanceLoot: { gold_core: { count: 2, chance: 0.55 }, beast_eye: { count: 1, chance: 0.4 } } },
    { id: leader, name: '弯角岩羚', tier: 7, hp: 148, atk: 26, def: 10, perception: 30, strategy: 'predator',
      tags: ['beast', 'furred'], insight: 14,
      intents: [strike('昂角横扫', 'attack'), strike('踏塌绳架猛顶', 'heavy', 1.6), strike('两角拢住肩颈', 'guard', 1.5),
        strike('踏石返撞', 'attack', 1.1), strike('扬头牵走风气', 'drain', 0.84)],
      desc: '一根角顶进石梁下的活扣，另一根顺势削过矮墙。弦钩在角根嵌得很深。',
      loot: { [horn]: 1, battle_sinew: 3, gold_core: 3, beast_meat: 5, hide: 3 },
      chanceLoot: { gold_core: { count: 3, chance: 0.59 } } },
  ],
  quests: [
    { id: commission, region: 'sand_bell_cloister', name: '把弯角给梁弦，请他试弓',
      reveal: { item: horn, need: { [horn]: 1 } }, need: { battle_sinew: 4, hide: 2 }, reward: { [pattern]: 1 },
      desc: '梁弦拿弯角对着缺钩比了比。「角只借来看。还得给学徒换两层包手皮、四根短筋，才能放手试这股弹劲。」',
      outcome: '梁弦绷上新筋，把弯角还给你。学徒再拉旧架时手没有被掀起来，他便把护腕的做法画给你。' },
  ],
};
