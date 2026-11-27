const guildId = 'water_gauge';
const currency = 'spirit_coin';
const resultNames = ['首场止步', '一胜', '两胜', '三胜', '四胜', '夺魁'];
const grades = ['初期', '中期', '后期', '中期天骄', '后期天骄'];
const handoverStory = '秦观澜把水门钥匙和观印一并放在案上。「我要闭关冲元婴中期。这几年旱涝交替，沿河的百姓认的是这方印。遇着事，你拿主意。」他让管事搬来粮仓、库房和各段水堤的账册，把守尺观暂交你照看。';

const rivals = [
  { id: 'terrace_stride', name: '陆黍', tier: 0, hp: 35, atk: 10, def: 3, perception: 14,
    desc: '短木尺握在掌根。他沿着红线迈小步，腕子比脚快半拍。',
    intents: [{ kind: 'attack', name: '低尺打向脚边' }, { kind: 'heavy', name: '踩住红线挥尺', mult: 1.46 }, { kind: 'guard', name: '退一步横尺', mult: 1.24 }] },
  { id: 'terrace_zheng', name: '郑浅', tier: 1, hp: 42, atk: 12, def: 4, dodge: 0.13, strategy: 'footwork',
    desc: '郑浅把宽袖在腕口挽紧。脚跟几乎没落过地，转到你一侧才抬手。',
    intents: [{ kind: 'dodge', name: '贴红线侧身让尺' }, { kind: 'attack', name: '从肋侧快点两下', accuracy: 0.16 },
      { kind: 'heavy', name: '俯身回尺击肩', mult: 1.5 }, { kind: 'attack', name: '拨开兵器抢一步', pierce: 1 }] },
  { id: 'terrace_meng', name: '孟循', tier: 2, hp: 49, atk: 14, def: 5, perception: 20, strategy: 'bulwark',
    desc: '一柄钝铁尺搭着左臂。练场木柱上有道很浅的痕，他每次收尺都正对着那处。',
    intents: [{ kind: 'guard', name: '钝尺架在胸前', mult: 1.65 }, { kind: 'attack', name: '靠铁尺挤进半步', pierce: 1 },
      { kind: 'heavy', name: '两手压尺击向肩头', mult: 1.52 }, { kind: 'attack', name: '尺尖平推', mult: 1.07 }] },
  { id: 'terrace_lu', name: '卢隐', tier: 1, hp: 56, atk: 16, def: 6, perception: 25, qi: 31, strategy: 'schemer',
    desc: '卢隐的白木尺上开着细槽。手腕一拧，槽里便有风声。',
    intents: [{ kind: 'drain', name: '从尺槽引走真气', mult: 0.88, damageType: 'magic', qiCost: 6 },
      { kind: 'attack', name: '贴手腕挑尺', mult: 1.05 }, { kind: 'heavy', name: '举尺压下一股风劲', mult: 1.48, damageType: 'magic', qiCost: 8 },
      { kind: 'guard', name: '横过掌中窄尺', mult: 1.35 }] },
  { id: 'terrace_ning', name: '宁衡', tier: 2, hp: 65, atk: 18, def: 6, perception: 26, manualGuard: 1, strategy: 'counter',
    desc: '宁衡不用护臂，双手之间留着一掌宽。尺柄往里一收，前脚便在板缝边钉住。',
    intents: [{ kind: 'attack', name: '尺尾碰开你的手腕', pierce: 1 }, { kind: 'focus', name: '收尺沉肩蓄力' },
      { kind: 'heavy', name: '两步进身压尺', mult: 1.57, pierce: 2 }, { kind: 'guard', name: '横尺接招', mult: 1.48 }] },

  { id: 'terrace_crossbeam', name: '田素功', tier: 3, hp: 62, atk: 16, def: 6, perception: 20, strategy: 'counter',
    desc: '田素功把铁尺横在胸前，身子仍侧着。你刚抬手，他就挪开了原本那只脚。',
    intents: [{ kind: 'guard', name: '两手横尺防守', mult: 1.55 }, { kind: 'attack', name: '从侧面打向肋下', mult: 1.06 },
      { kind: 'heavy', name: '转身抡下木尺', mult: 1.59 }, { kind: 'attack', name: '压低身子向前打', pierce: 1 }] },
  { id: 'terrace_yu', name: '郁栎', tier: 4, hp: 72, atk: 17, def: 7, perception: 23, dodge: 0.16, accuracy: 0.18, strategy: 'footwork',
    desc: '一支短尺只及郁栎小臂长。侧身时衣角先动，前脚落下时尺已追到身侧。',
    intents: [{ kind: 'dodge', name: '退进一道红线内' }, { kind: 'attack', name: '追上去点中肘弯', accuracy: 0.19, pierce: 1 },
      { kind: 'heavy', name: '换手下切尺锋', mult: 1.58 }, { kind: 'attack', name: '把短尺压向肩口', pierce: 1 }] },
  { id: 'terrace_finalist', name: '卫箬', tier: 5, hp: 83, atk: 19, def: 8, perception: 26, qi: 40, strategy: 'schemer',
    desc: '她动手前会低头听你的呼吸。长尺一收，接着便往外重重推出。',
    intents: [{ kind: 'drain', name: '把尺垂下，探你的气息', mult: 0.82, damageType: 'magic', qiCost: 6 },
      { kind: 'attack', name: '反手推尺', mult: 1.02 }, { kind: 'guard', name: '双手横尺挡住去路', mult: 1.5 },
      { kind: 'heavy', name: '回身挥尺打来', mult: 1.62 }, { kind: 'attack', name: '上前一步推尺', mult: 1.1 }] },
  { id: 'terrace_xie', name: '谢梅阶', tier: 4, hp: 96, atk: 22, def: 9, perception: 31, manualGuard: 2, strategy: 'counter',
    desc: '谢梅阶只拿一把缺角木尺。尺一横，空出的右手就撤到腰侧，等你先上前。',
    intents: [{ kind: 'guard', name: '尺横胸前，右手收在腰侧', mult: 1.82 },
      { kind: 'attack', name: '让开来尺，反点腰间', mult: 1.1, pierce: 2 },
      { kind: 'heavy', name: '跨步拧身回击', mult: 1.62, pierce: 1 },
      { kind: 'focus', name: '落脚收腰蓄力' }] },
  { id: 'terrace_han', name: '韩凛', tier: 5, hp: 118, atk: 26, def: 10, perception: 34, qi: 66, dodge: 0.12, strategy: 'schemer',
    desc: '韩凛手中的长尺染得发黑。尺尾划过地板时，红线上扬起一圈细粉。',
    intents: [{ kind: 'attack', name: '侧切两步追尺', mult: 1.06, accuracy: 0.14 },
      { kind: 'drain', name: '贴尺逆拨真气', mult: 0.9, damageType: 'magic', qiCost: 9 },
      { kind: 'dodge', name: '提尺擦身避让' },
      { kind: 'heavy', name: '在木板上掀起一股涌劲', mult: 1.63, damageType: 'magic', qiCost: 13, pierce: 3 },
      { kind: 'guard', name: '尺头斜架住来势', mult: 1.56 }] },

  { id: 'terrace_yao', name: '姚秉', tier: 6, hp: 113, atk: 24, def: 10, perception: 25,
    strategy: 'bulwark', physicalResist: 0.26, magicResist: 0.07,
    desc: '姚秉双手扶一柄厚尺，顶端磨出指宽的平面，刚好垫在掌下。',
    intents: [{ kind: 'guard', name: '厚尺在双掌之间立定', mult: 1.72 }, { kind: 'attack', name: '厚尺压手', pierce: 2 },
      { kind: 'heavy', name: '两手压尺向前', mult: 1.58 }, { kind: 'attack', name: '尺尾逼近脚边', mult: 1.1 }] },
  { id: 'terrace_wen', name: '温缜', tier: 7, hp: 124, atk: 26, def: 10, perception: 31, qi: 76,
    strategy: 'schemer', physicalResist: 0.08, magicResist: 0.32,
    desc: '温缜腋下夹着薄尺，一指顺尺脊来回移动，尺上几粒水珠始终不落。',
    intents: [{ kind: 'attack', name: '借水珠弹出一线劲', mult: 1.08, damageType: 'magic', qiCost: 7 },
      { kind: 'heal', name: '缓缓理顺胸中真气', mult: 0.69, qiCost: 12 },
      { kind: 'heavy', name: '带起水线斜削', mult: 1.55, damageType: 'magic', qiCost: 13, pierce: 3 },
      { kind: 'attack', name: '用尺背推向肩前', mult: 0.97 }] },
  { id: 'terrace_zhao', name: '赵屏', tier: 8, hp: 137, atk: 28, def: 12, perception: 34, manualGuard: 2,
    strategy: 'counter', accuracy: 0.14, physicalResist: 0.18, magicResist: 0.16,
    desc: '赵屏双手分持长短两尺。短尺挡到身前，背后那把长尺才有空挥开。',
    intents: [{ kind: 'attack', name: '短尺封手，长尺追上一寸', mult: 1.06, pierce: 2 },
      { kind: 'guard', name: '双尺叠起来架招', mult: 1.62 },
      { kind: 'heavy', name: '转肘拿长尺击肩', mult: 1.65, pierce: 3 },
      { kind: 'focus', name: '把长尺压向腰侧蓄力' }] },
  { id: 'terrace_liang', name: '梁季夷', tier: 7, hp: 150, atk: 29, def: 12, perception: 36, dodge: 0.24,
    strategy: 'footwork', physicalResist: 0.14, magicResist: 0.18, spiritSkill: 'turn_edge', spiritReserve: 2,
    desc: '梁季夷先拱手行礼。她往侧边一让，常有人从她身前挥过去，把自己带出红线。',
    intents: [{ kind: 'dodge', name: '脱开半步侧让' }, { kind: 'attack', name: '追尺点向腕口', mult: 1.14, accuracy: 0.21, pierce: 3 },
      { kind: 'guard', name: '尺身垂下来侧挡', mult: 1.48 },
      { kind: 'heavy', name: '踏近边线回尺', mult: 1.59, pierce: 2 }] },
  { id: 'terrace_gu', name: '顾照年', tier: 8, hp: 194, atk: 38, def: 15, perception: 39, qi: 93, manualGuard: 1,
    strategy: 'schemer', dodge: 0.10, accuracy: 0.13, physicalResist: 0.23, magicResist: 0.25, spiritSkill: 'split_stream', spiritReserve: 3,
    desc: '顾照年把一截断尺留在案上，只带新尺登台。前几场有人拿法杖上场，他低下尺，地上的细粉忽然朝两边分开。',
    intents: [{ kind: 'focus', name: '两手收尺，压住气息' },
      { kind: 'attack', name: '沿红线推出一道尺劲', mult: 1.08, damageType: 'magic', qiCost: 11, pierce: 3 },
      { kind: 'heavy', name: '合两股尺劲一并打来', mult: 1.58, damageType: 'magic', qiCost: 17, pierce: 4 },
      { kind: 'attack', name: '尺背换向急扫', mult: 1.15, pierce: 2 },
      { kind: 'guard', name: '压尺领开两道来气', mult: 1.48, magicWard: 12 }] },
];

const stageDefinitions = [
  { id: 'outer', name: '外门大比', realm: '炼气', fee: 12, cooldown: 4, promotes: 'inner',
    notes: ['陆黍常沿线抢近，尺快却短。', '郑浅喜欢侧身让过第一招。站稳后再追，她就不好反点你的肘。',
      '孟循横尺的时候，台边听得到尺背擦过护臂。', '卢隐的木尺开了气槽，运气时能抽走别人的真气。', '宁衡收尺蓄势时会定住前脚。台边木板上的凹痕都是他踩出来的。'],
    rewards: [
      { [currency]: 8, salve: 1 }, { [currency]: 12, salve: 1, ore: 2 },
      { [currency]: 18, salve: 1, ore: 3 }, { [currency]: 25, ore: 4, qi_powder: 2 },
      { [currency]: 37, ore: 4, qi_powder: 2, measuring_cedar_ruler: 1 },
    ] },
  { id: 'inner', name: '内门大比', realm: '筑基', fee: 24, cooldown: 5, promotes: 'elder',
    notes: ['田素功常先拿尺遮住胸口，后脚留着侧击的空当。', '郁栎不肯和人硬撞，借你的脚步找尺尖能进的地方。',
      '卫箬能用气劲扰乱吐纳。她听见呼吸变重，常会收尺准备下一击。', '谢梅阶喜欢等人先上前，木尺架稳才还手。',
      '韩凛近手使黑尺，也能隔着一段把气劲带上台面。两种打法来回换得很快。'],
    rewards: [
      { [currency]: 18, heal_pill: 1 }, { [currency]: 25, heal_pill: 1, ore: 3 },
      { [currency]: 35, heal_pill: 2, ore: 4 }, { [currency]: 48, ore: 4, jade_pill: 1 },
      { [currency]: 68, jade_pill: 2, tournament_citation: 1, terrace_counter_manual: 1 },
    ] },
  { id: 'elder', name: '长老考核', realm: '金丹', fee: 40, cooldown: 6, promotes: 'actingHead',
    notes: ['姚秉硬架得住刀枪，厚尺上可没什么挡水火的东西。', '温缜重在卸开术法。她会调息，倒没穿姚秉那等硬护具。',
      '赵屏一长一短两把尺相互照应，手上留着劲，人还能接下一招。', '梁季夷让开半步时也像是还在守，冲得太近容易伤到自己。',
      '顾照年收尺时多半留了后劲。他压着尺时，气劲容易顺着尺边溜掉。'],
    rewards: [
      { [currency]: 30, jade_pill: 1 }, { [currency]: 48, jade_pill: 1, black_iron: 3 },
      { [currency]: 64, jade_pill: 2, black_iron: 4 }, { [currency]: 85, black_iron: 5, clear_qi_pill: 2 },
      { [currency]: 125, black_iron: 6, clear_qi_pill: 2, measuring_river_seal: 1 },
    ] },
];

const stages = stageDefinitions.map(({ notes, rewards, ...stage }, stageIndex) => {
  const subtotal = {};
  const matches = rivals.slice(stageIndex * grades.length, (stageIndex + 1) * grades.length).map(({ id }, index) => ({
    name: `第${['一', '二', '三', '四', '五'][index]}场`,
    grade: `${stage.realm}${grades[index]}`, enemy: id, note: notes[index],
  }));
  const prizes = [{ name: resultNames[0], reward: {} }, ...rewards.map((reward, index) => {
    for (const [id, count] of Object.entries(reward)) subtotal[id] = (subtotal[id] ?? 0) + count;
    return { name: resultNames[index + 1], reward: { ...subtotal }, increment: reward };
  })];
  return { ...stage, matches, prizes };
});

export const tournamentData = {
  id: 'waterline_trials', name: '守尺观擂台', sect: guildId, region: 'measuring_hall',
  site: 'zhao_terrace_arena', lead: 'body_breath_note', boutDays: 0.125,
  desc: '名册只收本门弟子。登台前把药和口粮留在场下。两场之间至少歇半日，气血不到一半，裁判会等你缓过来再点名。擂台点到为止。',
  stages,
  matches: stages.flatMap(({ matches }) => matches),
  prizes: stages.flatMap(({ prizes }) => prizes.slice(1)),
};

export const tournamentContent = {
  enemies: rivals.map((enemy, index) => ({
    ...enemy, tags: ['human'], sparring: true, insight: 1 + Math.floor(index / 5) * 2 + (index % 5), loot: {},
  })),
  sites: [{ id: tournamentData.site, region: tournamentData.region, name: '观内的红线擂台',
    protectedArena: true, regulatedBout: true, reveal: { item: tournamentData.lead }, revealOffice: guildId }],
  events: [{ id: tournamentData.site, name: '观内的红线擂台',
    text: '台上画着三道红线。名册放在裁判手边，候场的弟子坐在长凳上绑护腕。',
    choices: [{ label: '问裁判规矩', stay: true, days: 0.125,
      outcome: '裁判翻开名册。「外门、内门、长老各有五场。打到哪儿，名次就记到哪儿，拿过的奖不会再发。撑不住就敲台边的铜片，我来叫停。」' }] }],
  items: [{ id: 'tournament_citation', name: '内门大比头名帖', kind: 'key', price: 0, sell: 0, oneOfAKind: true,
    desc: '守尺观内门大比五场全胜的凭证。五名对手都已在帖上落款。' }],
};

const fighters = new Map(rivals.map((entry) => [entry.id, entry]));
const stageById = new Map(stages.map((stage) => [stage.id, stage]));
const actions = new Set(['tournamentEnroll', 'tournamentFight', 'tournamentWithdraw', 'tournamentClaim', 'tournamentHandover']);
const belongs = (state) => state.world.affiliation === guildId && Boolean(state.world.memberships[guildId]);
const atHall = (state) => state.region === tournamentData.region;
const atRegistration = (state) => !state.combat && !state.gathering && (!state.event || state.event === tournamentData.site);
const inTournament = (state) => state.combat?.tournament === tournamentData.id;
const occupied = '先结束眼前的事，再来找裁判。';
const newStanding = () => ({ wins: 0, best: 0, claimed: 0, until: 0, result: null });

export function initialTournament() {
  return { current: null, handoverPending: false, handoverDone: false,
    stages: Object.fromEntries(stages.map(({ id }) => [id, newStanding()])) };
}

const scores = (state) => state.tournament?.stages ? state.tournament : initialTournament();
const rank = (state) => state.world.memberships[guildId]?.office ?? 'outer';

function enrollmentBlocker(state, progress, stage, standing) {
  if (!belongs(state)) return '名册只收守尺观弟子。先到管事处投帖。';
  if (!atRegistration(state)) return occupied;
  if (progress.current) return '你已经报过名了。';
  if (progress.handoverPending) return '宗主请你来接印。';
  if (!stage) return '三档比试都已经夺魁。';
  if (state.day < standing.until) {
    const remaining = Number((standing.until - state.day).toFixed(3));
    return `再歇 ${remaining} 日，名册就会重新开放。`;
  }
  if (state.coins < stage.fee) return `报名要付${stage.fee}枚灵钱。`;
  return '';
}

function boutBlocker(state, match, kit) {
  if (!atRegistration(state)) return occupied;
  if (!match) return '现在没有轮到你的比赛。';
  if (state.satiety <= 0) return '裁判见你空腹，先请你去吃些东西。';
  return kit.regulatedBoutBlocker(state);
}

function pendingPrizes(state, progress, kit) {
  return stages.flatMap((stage) => {
    const { best, claimed } = progress.stages[stage.id];
    if (best <= claimed) return [];
    const before = stage.prizes[claimed].reward;
    const reward = Object.fromEntries(Object.entries(stage.prizes[best].reward).flatMap(([id, total]) => {
      const pending = total - (before[id] ?? 0);
      return pending > 0 ? [[id, pending]] : [];
    }));
    const reason = !belongs(state) ? '回到守尺观门下即可领取旧奖。' : !atRegistration(state) ? occupied :
      !kit.hasRoom(state, reward) ? '行囊装不下这份奖品，腾出位置再领。' : '';
    return [{ id: stage.id, name: stage.name + stage.prizes[best].name + '奖品', reward, available: !reason, reason, best, claimed }];
  });
}

export function tournamentView(state, kit) {
  if (!atHall(state)) return null;
  const progress = scores(state);
  const office = rank(state);
  const active = stageById.get(office);
  const stage = stageById.get(progress.current) ?? active;
  const standing = progress.stages[stage?.id] ?? newStanding();
  const enrolled = Boolean(progress.current);
  const next = enrolled && stage.matches[standing.wins];
  const enrollReason = enrolled ? '' : enrollmentBlocker(state, progress, active, standing);
  const fightReason = enrolled ? boutBlocker(state, next, kit) : '';
  const claims = pendingPrizes(state, progress, kit);
  const claim = claims[0];
  const handover = progress.handoverPending || progress.handoverDone
    ? { available: progress.handoverPending && belongs(state) && atRegistration(state), reason: atRegistration(state) ? '' : occupied,
      text: progress.handoverDone ? handoverStory : '秦观澜传话，让你到案前接守尺观的印。', done: progress.handoverDone }
    : null;
  return {
    ...standing, enlisted: belongs(state), enrolled, stageId: stage?.id ?? null,
    name: stage?.name ?? tournamentData.name, desc: tournamentData.desc, fee: stage?.fee ?? 0,
    cooldown: stage?.cooldown ?? 0, matchCount: stage?.matches.length ?? 0,
    status: inTournament(state) ? 'combat' : enrolled ? 'ready' : standing.result ? 'finished' : 'idle',
    match: next ? { name: next.name, note: next.note, opponent: fighters.get(next.enemy).name, grade: next.grade } : null,
    stages: stages.map(({ id, name, realm }) => ({ id, name, realm, ...progress.stages[id],
      active: office === id, completed: progress.stages[id].best === grades.length })),
    enrollReason, canEnroll: !enrolled && !enrollReason,
    fightReason, canFight: enrolled && !fightReason, canWithdraw: enrolled && (atRegistration(state) || inTournament(state)),
    claims, canClaim: claim?.available ?? false, claimName: claim?.name ?? '',
    claimReward: claim?.reward ?? null, claimBlocked: claim?.reason ?? '', handover,
  };
}

function conclude(state, progress, stage, result) {
  const standing = progress.stages[stage.id];
  standing.best = Math.max(standing.best, standing.wins);
  standing.until = state.day + stage.cooldown;
  standing.result = result;
  progress.current = null;
  if (standing.wins !== stage.matches.length) return '';
  if (stage.promotes === 'actingHead') {
    progress.handoverPending = true;
    return '秦观澜合上名册，请你去案前说话。';
  }
  state.world.memberships[guildId].office = stage.promotes;
  return stage.promotes === 'inner' ? '管事把你的名字从外门册移入内门册。' : '秦观澜收起内门名册，请你落座长老席。';
}

export function tournamentResolution(state, combat, won) {
  if (combat?.tournament !== tournamentData.id || !belongs(state)) return '';
  const progress = scores(state);
  const stage = stageById.get(progress.current);
  if (!stage || combat.tournamentStage !== stage.id) return '';
  const standing = progress.stages[stage.id];
  if (stage.matches[standing.wins]?.enemy !== combat.id) return '';
  if (!won) {
    conclude(state, progress, stage, resultNames[standing.wins]);
    return '裁判叫停比试，扶你下场。';
  }
  standing.wins += 1;
  if (standing.wins < stage.matches.length) return '裁判在榜上记下一胜。你歇过脚，再等下一场点名。';
  const promotion = conclude(state, progress, stage, '五场全胜');
  return `裁判在你名下添了最后一笔。${stage.name}五场全胜，可以到名册旁领头名奖品。${promotion}`;
}

export function tournamentAction(state, action, kit, payload = {}) {
  if (!actions.has(action)) return null;
  if (!atHall(state)) return kit.refuse('到守尺观的红线擂台来办。');
  if (!belongs(state)) return kit.refuse('名册只收守尺观弟子。先到管事处投帖。');
  const inMatch = inTournament(state);
  if (!atRegistration(state) && !(action === 'tournamentWithdraw' && inMatch)) return kit.refuse(occupied);
  const progress = scores(state);
  const active = stageById.get(rank(state));
  if (action === 'tournamentEnroll') {
    if (payload.id && payload.id !== active?.id) return kit.refuse('只能报名本门身份对应的比试。');
    const reason = enrollmentBlocker(state, progress, active, progress.stages[active?.id]);
    if (reason) return kit.refuse(reason);
    state.coins -= active.fee;
    state.tournament = progress;
    progress.current = active.id;
    Object.assign(progress.stages[active.id], { wins: 0, result: null });
    return kit.say(state, `裁判收了${active.fee}枚灵钱，把你的名字写进${active.name}的名册。`);
  }
  const stage = stageById.get(progress.current);
  if (action === 'tournamentFight') {
    if (!stage || stage.id !== active?.id) return kit.refuse('先报本门身份对应的比试。');
    const match = stage.matches[progress.stages[stage.id].wins];
    const reason = boutBlocker(state, match, kit);
    if (reason) return kit.refuse(reason);
    kit.advance(state, tournamentData.boutDays);
    state.event = null;
    kit.startCombat(state, match.enemy, tournamentData.site);
    state.combat.tournament = tournamentData.id;
    state.combat.tournamentStage = stage.id;
    return kit.say(state, `${stage.name}${match.name}。${match.note}`);
  }
  if (action === 'tournamentWithdraw') {
    if (!stage) return kit.refuse('你现在没有报名。');
    if (inMatch) kit.setRegulatedBoutRecovery(state);
    state.combat = null;
    state.event = null;
    state.focus = 0;
    conclude(state, progress, stage, '自行退赛');
    return kit.say(state, inMatch ? '你抬手认输，裁判让对手收招。前面赢过的场次仍算数。' :
      '你向裁判辞了本届的下一场。前面赢过的场次仍算数。');
  }
  if (action === 'tournamentHandover') {
    if (!progress.handoverPending || rank(state) !== 'elder') return kit.refuse('眼下没有待接的观印。');
    progress.handoverPending = false;
    progress.handoverDone = true;
    state.world.memberships[guildId].office = 'actingHead';
    kit.beginMeasuringManagement?.(state);
    return kit.say(state, handoverStory);
  }
  const claims = pendingPrizes(state, progress, kit);
  const prize = payload.id ? claims.find(({ id }) => id === payload.id) : claims[0];
  if (!prize?.available) return kit.refuse(prize?.reason || '目前没有可以领的奖品。');
  progress.stages[prize.id].claimed = prize.best;
  kit.addItems(state, prize.reward);
  return kit.say(state, `裁判在旧账上对过一遍，把尚未发过的${kit.goodsText(prize.reward)}交给你。`);
}
