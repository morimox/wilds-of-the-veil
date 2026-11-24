const request = 'encyclopedia_clerk_note';
const weirLeaf = 'encyclopedia_weir_leaf';
const kilnProof = 'encyclopedia_kiln_proof';
const snake = 'encyclopedia_weir_snake';
const desk = 'encyclopedia_copy_desk';
const beam = 'encyclopedia_weir_beam';
const shed = 'encyclopedia_paper_shed';
const lead = { item: request };

export const encyclopediaContent = {
  items: [
    { id: request, name: '周简的字条', kind: 'key', price: 0, sell: 0,
      desc: '周简列了两件事。断齿内堰的第三根断柱下，找一只裹油布的匣子。再到冷炉院找阮杪，看看关于鸣沙的校样。' },
    { id: weirLeaf, name: '内堰旧路图', kind: 'key', price: 0, sell: 0,
      desc: '匣中有一张折得发白的路图。洪水淹过的旧道旁添了一行小字，签名正是周简说的那位巡堤人。' },
    { id: kilnProof, name: '鸣沙校样', kind: 'key', price: 0, sell: 0,
      desc: '晾好的纸上有阮杪校过的批注。几味药草和盐井的去向各占一栏，最左边也印着往来三州的路。' },
    { id: 'encyclopedia', name: '百科全书', kind: 'reference', price: 0, sell: 0, keepOnFall: true,
      desc: '守尺观校订的随身查阅本。扉页有索引，按条目可以翻到里面相应的记载。' },
  ],
  sites: [
    { id: desk, region: 'measuring_hall', name: '西廊书案', once: [0, 1],
      afterOnceText: {
        0: '周简把写着两处地址的纸搁在案边，抬手去压险些被风吹走的旧图。',
        1: '周简把案角擦出一块空处，用砚台压住旧稿。廊下还有一串洗净的木夹，等着夹带回来的纸。',
      } },
    { id: beam, region: 'burnt_weir', name: '断柱下的横梁', reveal: lead, once: [1],
      creatures: { [snake]: { start: 1, cap: 1, interval: 0, growth: 0 } },
      creatureText: { [snake]: {
        present: '油布包卡在梁下，一条灰背水蟒盘在离它最近的石槽里。',
        absent: '石槽空了。横梁下面还夹着半角油布。',
      } },
      afterOnceText: { 1: '匣子取走了。水从横梁下面穿过去，石槽里只剩一截烂麻绳。' } },
    { id: shed, region: 'cold_kiln', name: '档房外的晒纸棚', reveal: lead, once: [0],
      afterOnceText: { 0: '新木撑稳了纸架。跟着阮杪做事的两个孩子压好纸角，再把悬空那头的绳结收紧。' } },
  ],
  events: [
    { id: desk, name: '西廊书案',
      text: '两幅路图压在砚台下，都写着往断齿内堰，岔路却拐向两边。周简把其中一幅抽了出来。桌角几册散开的旧稿间，还夹着草药和飞兽的图样。',
      choices: [
        { label: '问周简哪一幅路图出了错', days: 0.125,
          outcome: '周简指着图上一排断柱。「下过大水，两幅都未必对。巡堤人的新图用油布裹着，要是没冲远，多半卡在内堰。阮杪那头还有一份校样。你若愿意替我跑一趟，这儿有两处地址。」' },
        { label: '接过字条，答应跑一趟', desc: '周简把纸放在案边，等你拿主意。', afterChoice: 0,
          days: 0.125, loot: { [request]: 1 }, outcome: '你收下字条。周简在堰图上点了点第三根断柱，又叮嘱你去冷炉院找阮杪。' },
      ] },
    { id: beam, name: '断柱下的横梁',
      text: '第三根断柱边斜着一根横梁，石槽紧挨梁脚。水一退，踩着断柱就能够到那根梁。',
      choices: [
        { label: '上梁去够油布包', desc: '横梁离水不高，一只手得始终扶着断柱。', days: 0.25, enemy: snake,
          outcome: '你才踏上横梁，水蟒已从石槽抬起半身，顺着梁面扑来。' },
        { label: '从梁下抽出油布匣', desc: '油布角还挂在两块木头之间，顺着缝能一点点抽出来。', afterFight: snake, days: 0.25,
          loot: { [weirLeaf]: 1 }, outcome: '油布里是一个窄木匣。匣底有巡堤人签过字的路图，折角上还沾着干透的河泥。' },
      ] },
    { id: shed, name: '档房外的晒纸棚',
      text: '阮杪用两块平砖压住刚揭下的湿纸。晒架被风吹歪了，内侧的绳一碰就散，湿纸差点翻进灰土里。',
      choices: [
        { label: '帮阮杪撑好纸架，等校样晾干', desc: '她要四份松木作撑脚、三份兽革包住磨纸的木角，再用两份坚韧兽筋绑牢架子。',
          need: { wood: 4, hide: 3, battle_sinew: 2 }, consume: true, days: 0.75, loot: { [kilnProof]: 1 },
          outcome: '新架在风里晃了几下，纸角没有再卷起来。阮杪把校样揭下，用一片薄板夹好。「批过的给周简。我留张没印好的，回去重排。」' },
      ] },
  ],
  enemies: [
    { id: snake, name: '灰背水蟒', tags: ['beast', 'scaled'], tier: 4, hp: 87, atk: 17, def: 6, perception: 19, accuracy: 0.11,
      strategy: 'predator', insight: 5,
      intents: [
        { name: '探头咬向梁上的脚', kind: 'attack', mult: 1 },
        { name: '盘住横梁，甩尾扫来', kind: 'heavy', mult: 1.56 },
        { name: '顺石槽回身再咬', kind: 'attack', mult: 1.07 },
        { name: '缩回梁柱后护住颈子', kind: 'guard', mult: 1.35 },
      ],
      loot: { beast_meat: 3, foundation_core: 2, hard_scale: 1, battle_sinew: 1 },
      desc: '伏在旧木梁下的灰蟒。它抬头时嘴尖已经越过梁边，尾巴在石槽里拨一下，整根梁都跟着颤。' },
  ],
  quests: [
    { id: 'encyclopedia_compile', region: 'measuring_hall', name: '替周简核对旧档', reveal: lead, recommendedTier: 4,
      desc: '把断齿内堰的旧路图和冷炉院的校样一起带回守尺观。周简等这两份纸来改西廊书案上的旧稿。',
      need: { [weirLeaf]: 1, [kilnProof]: 1 }, reward: { encyclopedia: 1 },
      outcome: '周简对着两份纸涂掉一条废路，又在盐井旁补了记号。几册零散的图稿已订在一起。他从案下取出另一本，推到你手边。「我多订了一部。一个人走远路，忘了什么就翻一翻。」你翻开扉页，上面题着「百科全书」。',
    },
  ],
};
