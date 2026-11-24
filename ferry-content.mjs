export const ferryContent = {
  items: [
    { id: 'ferry_watch_tag', name: '夜船的换班木牌', kind: 'key', price: 0, sell: 0,
      desc: '木牌背面写着回灯埠几个字。闭潮渡今晚换班的船工请你亲手交给埠头守灯的人。' },
    { id: 'ferry_watch_reply', name: '守灯人签的回条', kind: 'key', price: 0, sell: 0,
      desc: '守灯人在纸角按了一点灯油，托你给闭潮渡的掌船人报个平安。' },
    { id: 'ferry_pole', name: '渡工的撑船杆', kind: 'gear', price: 0, sell: 8,
      desc: '渡工截短的撑船竹杆，杆头磨圆了。站在窄船上，也能横过来挡住来招。' },
  ],
  gear: [
    { id: 'ferry_pole', slot: 'weapon', weaponClass: 'staff', tier: 1, atk: 4, def: 1, perception: 4, hp: 0, qi: 0, retreat: 0.1,
      durability: 36, repair: 6, entry: '炼气中期使得稳的撑船杆。握得靠后能横架，想离开交手时也好借力退一步。' },
  ],
  sites: [
    { id: 'ford_watch_lamp', region: 'ford', name: '渡口换班灯', reveal: { item: 'secret_pass' }, once: [0, 2],
      choiceText: {
        0: { before: '栏边架着两盏灯，白日只用来晾灯芯。船工说，夜里两盏都亮，才轮到他送换班牌。', after: '两盏灯中间的木钩已经空了。' },
        2: { after: '掌船人把收到的回条压在舱板下面。' },
      } },
    { id: 'wharf_lee_lamp', region: 'hidden', name: '背风灯台', reveal: { item: 'ferry_watch_tag' }, once: [0, 1],
      choiceText: {
        0: { before: '守灯人每隔一会儿就朝闭潮渡的方向望一眼。', after: '换班牌挂在背风的一侧，灯光照得到牌上的字。' },
        1: { before: '灯架底下少了个木脚，灯罩一晃，火就要挨到边上。', after: '两截新木撑住灯架，火苗在灯罩中间直直立着。' },
      } },
  ],
  events: [
    { id: 'ford_watch_lamp', name: '渡口换班灯', text: '渡口有条木栏伸进水面，候船的人坐在石阶上。', choices: [
      { label: '接下今晚的换班木牌', phase: 'night', phaseReason: '要等天黑，两盏换班灯都亮了再去。', days: 0.125,
        loot: { ferry_watch_tag: 1 }, outcome: '两盏灯一齐亮起来。掌船人从钩上摘下木牌。「我这里还要留人。你既认得回灯埠，劳你给守灯的陈婆送一趟。」' },
      { label: '靠着木栏再等一会儿', days: 0.25, stay: true,
        outcome: '你靠在栏边，听木桩底下的水声换了几回。' },
      { label: '把陈婆的回条交给掌船人', hidden: true, need: { ferry_watch_reply: 1 }, consume: true, days: 0.125,
        coins: 4, loot: { ration: 3 }, outcome: '掌船人认出灯油印，弯腰把回条压好。他从船篓里匀出几张厚饼，连脚钱一并递给你。' },
    ] },
    { id: 'wharf_lee_lamp', name: '背风灯台', text: '一段石台藏在岩壁背后。陈婆坐在台边，雨披搁在膝上缝了一半。', choices: [
      { label: '把换班牌交给陈婆', need: { ferry_watch_tag: 1 }, consume: true, days: 0.125,
        loot: { ferry_watch_reply: 1 }, outcome: '陈婆把牌挂在灯下，取过一张纸给你。「告诉他灯照得见。九月送药那回，就是这点光把船引进来的。」' },
      { label: '用松木给灯台补两只脚', afterChoice: 0, need: { wood: 2 }, consume: true, days: 0.25,
        loot: { ferry_pole: 1 }, outcome: '灯架站稳了。陈婆往里移了半步试风，从舱顶取下那根截短的撑船杆。「我如今用不着。你拿去，走窄处还撑得住。」' },
    ] },
  ],
};
