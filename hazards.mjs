export const hazardData = Object.freeze({
  id: 'saltwater_drive',
  title: '炭篷驿兽潮',
  inn: 'cinder_inn',
  dunes: 'camel_grass_dunes',
  rill: 'bone_dry_rill',
  trace: 'sand_saltwater_reed',
  site: 'sand_saltwater_tracks',
  enemy: 'sand_saltwater_jackal',
  warningDays: 2.5,
  surgeDays: 3.5,
  jobs: {
    report: { days: 0.125 },
    brace: { days: 0.375, need: { wood: 2, ore: 1 }, reward: 9 },
    move: { days: 0.5, reward: 3 },
    look: { days: 0.25 },
    divert: { days: 0.375, reward: 7 },
    fight: { days: 0.125, reward: 6 },
    repair: { days: 0.5, need: { wood: 1 }, reward: 4 },
    settle: { days: 0.125 },
  },
});

const { inn, dunes, rill, trace, site, enemy, jobs } = hazardData;

export const hazardContent = {
  items: [{
    id: trace, name: '结着盐壳的苇梗', kind: 'key', price: 0, sell: 0,
    desc: '苇梗卡在草丘的石缝里，湿的一头还带着井泥。炭篷驿的杨芹常在这一带饮马。',
  }],
  sites: [{ id: site, region: dunes, name: '沙坡下的兽迹', once: [0],
    choiceText: { 0: {
      before: '旁边石缝里卡着一截苇梗，露在外头的一端结着白壳。',
      after: '取过苇梗的石缝里，仍有一条浅浅的盐渍。',
    } },
  }],
  events: [{
    id: site, name: '沙坡下的兽迹',
    text: '沙脊背面踩出一片新蹄印。印子全往炭篷驿那边去，边上还有股咸水味。',
    choices: [{
      label: '取出石缝里卡着的苇梗', days: 0.125, loot: { [trace]: 1 },
      outcome: '苇梗朝上的一头裹着白盐，卡在底下的一头却还带着湿泥。湿土里还有几枚新踩进去的蹄印。',
    }],
  }],
  enemies: [{
    id: enemy, name: '盐泥豺', tags: ['beast', 'furred'], tier: 2, hp: 43, atk: 9, def: 3, insight: 4,
    desc: '后腿沾了一层干盐泥，落地时不大使力。它先压低肩脊，接着才从低处猛扑。',
    intents: [
      { name: '贴着沙地咬过来', kind: 'attack', mult: 1 },
      { name: '缩头护住伤腿', kind: 'guard', mult: 1.4 },
      { name: '低下肩头扑过来', kind: 'heavy', mult: 1.7 },
    ],
    loot: { beast_meat: 2, hide: 2, qi_core: 2 },
  }],
};

function eventPhase(state, incident) {
  if (incident.divert) return 'aftermath';
  if (state.day < incident.starts) return 'warning';
  if (state.day < incident.ends) return 'surge';
  return 'aftermath';
}

function reportReady(state, kit) {
  return state.region === inn && kit.owns(state, trace) > 0;
}

function payout(incident) {
  return ['brace', 'move', 'divert', 'fight', 'repair']
    .reduce((coins, job) => coins + (incident[job] ? jobs[job].reward : 0), 0);
}

function actionsAt(state, kit, incident, phase) {
  const here = state.region;
  const hunger = state.satiety === 0 ? '腹中空空，先吃些东西。' : '';
  const option = (id, label) => ({
    id, label,
    reason: hunger || (incident && phase !== 'aftermath' && id !== 'fight' && state.day + jobs[id].days > incident.ends
      ? '兽群已经过了这道坡，来不及在此处动手了。' : kit.homeRequirements(state, 0, jobs[id].need)),
  });
  if (!incident) return [option('report', '把苇梗给杨芹看')];
  if (phase === 'aftermath') {
    if (here !== inn || incident.settle) return [];
    const entries = !incident.divert && !incident.brace && !incident.repair
      ? [option('repair', '拿一块松木修驿后的栏杆')]
      : [];
    if (payout(incident)) entries.push(option('settle', '找杨芹领做过那份活的工钱'));
    return entries;
  }
  if (here === inn) {
    return [
      ...(!incident.move ? [option('move', '陪驿童把驮兽赶进石院')] : []),
      ...(!incident.brace ? [option('brace', '用两块松木和一块寒铁加固驿后栏杆')] : []),
    ];
  }
  if (here === dunes) {
    return [
      ...(!incident.look ? [option('look', '顺着湿蹄印找水源')] : []),
      ...(phase === 'surge' && !incident.fight ? [option('fight', '到高处截住追向驿站的盐泥豺')] : []),
    ];
  }
  return incident.look && !incident.divert ? [option('divert', '拔掉旧槽里的石楔，让水流回沟里')] : [];
}

function incidentDescription(state, incident, phase) {
  const here = state.region;
  if (!incident) return '杨芹拿起你带来的苇梗捻了捻，拇指上落了一圈湿盐。';
  if (phase === 'warning') {
    if (here === inn) {
      const fence = incident.brace ? '栏脚添了新木和铁扣。' : '驿后栏杆已给前夜的大风吹歪了。';
      const herd = incident.move ? '驮兽已经赶进石院。' : '驿童腾出石院，正找人把不肯挪窝的驮兽赶进去。';
      return `杨芹在门上挂了盏旧灯作警记。她估摸到第${Math.floor(incident.starts)}日${incident.starts % 1 < 0.5 ? '白天' : '夜里'}，草丘那边的兽群就会追着水流下来。${fence}${herd}`;
    }
    if (here === dunes) return incident.look ? '浅沟里已经能看见水，湿印一路通往砾盘浅沟。' : '蹄印旁渗出细细一股咸水。水上漂着两片苇叶，都来自高处。';
  }
  if (phase === 'surge') {
    if (here === inn) return incident.move ? '石院里传出驮兽踩地的声响，旧栏外的兽群还在找水。' : '驮兽急着往外挤。杨芹把门闩又推紧了一寸，冲驿童喊着让他从后巷进石院。';
    if (here === dunes) {
      const tracks = incident.fight ? '盐泥豺的脚印断在沙脊下。小兽贴着低处来喝水。' : '一群小兽挤在沙沟里舔水。落在最后的盐泥豺跟着驮兽叫声往驿上去，从沙脊高处可以迎到它前头。';
      return incident.look ? tracks + '沿湿蹄印往上便是砾盘浅沟的旧槽。' : tracks;
    }
  }
  if (phase === 'aftermath') {
    if (here === rill) return incident.divert ? '石楔还搁在沟边，水正顺旧槽往低处流。' : '石槽已经不再溢水，露出来的一段槽沿结着细盐。';
    if (here === dunes) return incident.divert ? '喝过水的兽群沿旧槽回了低地，草丘上只剩几行蹄印。' : '沙沟里的水已经退尽，成群的蹄印被风吹得淡了。';
    const fence = incident.brace || incident.divert ? '栏杆还立着。' : incident.repair ? '新木撑起了兽群挤倒的栏杆。' : '兽群挤坏了驿后的一截栏杆。';
    const herd = incident.move ? '赶进石院的驮兽一头没少。' : '杨芹绕着院子清点赶回的驮兽。';
    return `门上的旧灯已经摘了。${fence}${herd}${incident.settle ? '这一回的工钱也已结清。' : ''}`;
  }
  return '上游废弃的盐水槽淤着，有水越过横着的石楔，往驿后的矮地流去。拔开石楔就能让水回到原沟。';
}

export function hazardView(state, kit) {
  if (state.event || state.combat || state.victoryPending || ![inn, dunes, rill].includes(state.region)) return null;
  const incident = state.hazards?.[hazardData.id];
  if (!incident && !reportReady(state, kit)) return null;
  if (state.region === rill && !incident?.look) return null;
  const phase = incident ? eventPhase(state, incident) : 'report';
  return {
    title: phase === 'report' ? '炭篷边的旧灯' : hazardData.title,
    phase,
    desc: incidentDescription(state, incident, phase),
    actions: actionsAt(state, kit, incident, phase),
  };
}

export function hazardAction(state, action, { id } = {}, kit) {
  if (action !== 'hazard') return null;
  const offer = hazardView(state, kit)?.actions.find(entry => entry.id === id);
  if (!offer || offer.reason) return kit.refuse(offer?.reason || '眼下没有这桩活。');

  const job = jobs[id];
  if (job.need) kit.spendHome(state, 0, job.need);
  kit.advance(state, job.days);
  const incidents = (state.hazards ??= {});
  if (id === 'report') {
    const starts = state.day + hazardData.warningDays;
    incidents[hazardData.id] = { starts, ends: starts + hazardData.surgeDays };
    return kit.say(state, '杨芹把苇梗折开，闻了闻里头的泥。「盐水跑到草丘上了。兽群认得水味，一旦跟下来，就到咱们后栏。」她把那盏旧灯挂上驿门。');
  }
  if (id === 'fight') {
    kit.startCombat(state, enemy, site);
    return kit.say(state, '你绕到沙脊高处。盐泥豺离开挤水的小兽，转过头朝你扑来。');
  }

  const incident = incidents[hazardData.id];
  incident[id] = true;
  if (id === 'settle') {
    const coins = payout(incident);
    state.coins += coins;
    return kit.say(state, `旧灯已经靠在窗下。杨芹把${coins}枚灵钱交给你。「你做的那几件活，都有人看着。」`);
  }
  const replies = {
    brace: '你压住歪栏，驿童把铁扣敲进新木。两人再推，栏脚没往外滑。',
    move: '驿童牵长绳，你从尾上把乱挤的牲口隔开。石院收进了最后一头驮兽。',
    look: '你在高处瞧见水从砾盘浅沟漫出旧槽，才沿低地折向驿后。',
    divert: '石楔挪开，咸水哗一声改了道，沿旧槽流回低处。兽群抬起头，陆续寻着水声走了。',
    repair: '歪倒的栏杆重新立住，驿童过来把脱了的缰环拴回新木上。',
  };
  return kit.say(state, replies[id]);
}

export function hazardVictory(state, enemyId, siteId) {
  const incident = state.hazards?.[hazardData.id];
  if (!incident || siteId !== site || enemyId !== enemy || incident.fight) return '';
  incident.fight = true;
  return '追向驿站的豺停在了沙脊下，兽群各自散开找水。';
}
