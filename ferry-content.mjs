export const ferryContent = {
  items: [
    { id: 'ferry_watch_tag', name: '夜船的换班木牌', kind: 'key', price: 0, sell: 0,
      desc: '木牌背面写着回灯埠几个字。闭潮渡今晚换班的船工请你亲手交给埠头守灯的人。' },
    { id: 'ferry_watch_reply', name: '守灯人签的回条', kind: 'key', price: 0, sell: 0,
      desc: '守灯人在纸角按了一点灯油，托你给闭潮渡的掌船人报个平安。' },
    { id: 'ferry_pole', name: '渡工的撑船杆', kind: 'gear', price: 0, sell: 8,
      desc: '渡工截短的撑船竹杆，杆头磨圆了。站在窄船上，横起竹杆也能挡住一击。' },
  ],
  gear: [
    { id: 'ferry_pole', slot: 'weapon', weaponClass: 'staff', tier: 1, atk: 4, def: 1, perception: 4, hp: 0, qi: 0, retreat: 0.1,
      durability: 36, repair: 6, entry: '炼气中期使得稳的撑船杆。握住靠后一段，横过杆身就能挡招。想脱身时也好借力后退。' },
  ],
  sites: [
    { id: 'ford_watch_lamp', region: 'ford', name: '渡口换班灯', reveal: { item: 'secret_pass' }, once: [0, 2],
      phaseText: { day: '两盏灯还没点，灯芯搭在栏杆上晾着。', night: '两盏灯都亮了，栏杆的影子在水里晃。' },
      choiceText: {
        0: { before: '两灯之间挂着换班牌。掌船人就守在木钩旁边。', after: '两盏灯中间的木钩已经空了。' },
        2: { after: '掌船人把收到的回条压在舱板下面。' },
      } },
    { id: 'wharf_lee_lamp', region: 'hidden', name: '背风灯台', reveal: { item: 'ferry_watch_tag' }, once: [0, 1],
      choiceText: {
        0: { before: '守灯人每隔一会儿就朝闭潮渡的方向望一眼。', after: '换班牌挂在背风的一侧，灯光照得到牌上的字。' },
        1: { before: '灯架靠墙的两只木脚都朽了。一晃灯罩，火苗就往边上窜。', after: '两截新木撑住灯架，火苗在灯罩中间直直立着。' },
      } },
  ],
  events: [
    { id: 'ford_watch_lamp', name: '渡口换班灯', text: '渡口有条木栏伸进水面，候船的人坐在石阶上。', choices: [
      { label: '接下今晚的换班木牌', phase: 'night', phaseReason: '要等天黑，两盏换班灯都亮了再去。', days: 0.125,
        loot: { ferry_watch_tag: 1 }, outcome: '掌船人借灯光看了一眼木牌，从钩上摘下来。「我这里走不开。你若去回灯埠，劳你把牌带给守灯的陈婆。」' },
      { label: '在栏边等一会儿', excludesChoices: [0], hideWhenExcluded: true, days: 0.25, stay: true,
        outcome: '你靠在栏边等了一阵，木桩底下不时有水拍过来。' },
      { label: '把陈婆的回条交给掌船人', hidden: true, need: { ferry_watch_reply: 1 }, consume: true, days: 0.125,
        coins: 4, loot: { ration: 3 }, outcome: '掌船人认出灯油印，弯腰把回条压好。他从船篓里匀出几张厚饼，连脚钱一并递给你。' },
    ] },
    { id: 'wharf_lee_lamp', name: '背风灯台', text: '一段石台藏在岩壁背后。陈婆坐在台边，雨披搁在膝上缝了一半。', choices: [
      { label: '把换班牌交给陈婆', need: { ferry_watch_tag: 1 }, consume: true, days: 0.125,
        loot: { ferry_watch_reply: 1 }, outcome: '陈婆把牌挂在灯下，取过一张纸给你。「告诉他灯照得见。九月送药那回，就是这点光把船引进来的。」' },
      { label: '用松木给灯台补两只脚', afterChoice: 0, need: { wood: 2 }, consume: true, days: 0.25,
        loot: { ferry_pole: 1 }, outcome: '灯架站稳了。陈婆拢了拢火苗，从岩壁下取来一根磨圆了头的竹杆。「小船换了长篙，这根我用不上了。你去水浅的地方，可以拿来探底。」' },
    ] },
  ],
};
