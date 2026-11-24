export const tournamentData = {
  id: 'waterline_trials', name: '守尺观大比', region: 'measuring_hall', site: 'zhao_terrace_arena',
  lead: 'body_breath_note', fee: 12, cooldown: 4, boutDays: 0.125,
  desc: '傅澄说，来观里做客的人也能报名。擂台上双方不得用药饮食。每场打完至少歇半日，气血够一半才再点名。',
  matches: [
    { name: '第一场 · 试步法', enemy: 'terrace_stride', note: '陆黍拿着一把短木尺。他会贴着你走，用小步把你逼到红线边。' },
    { name: '第二场 · 防侧击', enemy: 'terrace_crossbeam', note: '田素功会先把尺横在胸前。你刚抬手，他就可能绕到侧面。' },
    { name: '第三场 · 比尺法', enemy: 'terrace_finalist', note: '卫箬出手慢。看她把长尺往怀里一收，就得准备挡那记重打了。' },
  ],
  prizes: [
    { name: '参赛干粮', reward: { ration: 2 } },
    { name: '第一场胜利的奖品', reward: { salve: 2, iron_talisman: 1 } },
    { name: '第二场胜利的奖品', reward: { heal_pill: 2, core: 3 } },
    { name: '三场全胜的奖品', reward: { tournament_citation: 1, jade_pill: 2, terrace_counter_manual: 1 },
      delivery: '卫箬把头名帖和一册带批注的尺谱放在桌上。「第二场落脚太靠里。翻到折角那页，看看这半步该站在哪儿。」' },
  ],
};

const enemies = [
  { id: 'terrace_stride', name: '持短尺的陆黍', tier: 1, hp: 34, atk: 10, def: 3, tags: ['human'], sparring: true,
    insight: 3, loot: {}, desc: '他常迈着小步把对手逼近红线。蓄力时，前脚会踏得格外重。',
    intents: [{ name: '用短尺打向脚边', kind: 'attack', mult: 1 }, { name: '踩住红线挥尺', kind: 'heavy', mult: 1.5 }, { name: '退一步横尺防守', kind: 'guard', mult: 1.28 }] },
  { id: 'terrace_crossbeam', name: '擅长侧击的田素功', tier: 3, hp: 57, atk: 14, def: 5, tags: ['human'], sparring: true,
    insight: 5, loot: {}, desc: '他常把尺横在身前挡招。对手一动，他就转身换到另一侧。',
    intents: [{ name: '横尺防守', kind: 'guard', mult: 1.52 }, { name: '从侧面打向肋下', kind: 'attack', mult: 1.05 },
      { name: '转身抡下木尺', kind: 'heavy', mult: 1.62 }, { name: '压低身子向前打', kind: 'attack', mult: 1 }] },
  { id: 'terrace_finalist', name: '教尺法的卫箬', tier: 5, hp: 82, atk: 18, def: 6, tags: ['human'], sparring: true,
    insight: 8, loot: {}, desc: '她动手前会低头听你的呼吸。长尺一收，接着就会往外重重推出。',
    intents: [{ name: '把尺垂下，探你的气息', kind: 'drain', mult: 0.75 }, { name: '反手推尺', kind: 'attack', mult: 1.02 },
      { name: '双手横尺挡住去路', kind: 'guard', mult: 1.42 }, { name: '回身挥尺打来', kind: 'heavy', mult: 1.68 },
      { name: '上前一步推尺', kind: 'attack', mult: 1.05 }] },
];

export const tournamentContent = {
  enemies,
  sites: [{ id: tournamentData.site, region: tournamentData.region, name: '观内的红线擂台', protectedArena: true, regulatedBout: true,
    reveal: { item: tournamentData.lead } }],
    events: [{ id: tournamentData.site, name: '观内的红线擂台', text: '台上画着三道红线，两侧坐着裁判。候场的人把木尺靠在名单旁，坐到长凳上绑护腕。',
    choices: [{ label: '问裁判怎么报名', days: 0.125,
      outcome: '裁判指着桌上的名单。「药和口粮都留在台下。撑不住就敲一下台边的铜片，我们叫停。两场之间至少歇半日。」' }] }],
  items: [{ id: 'tournament_citation', name: '大比头名帖', kind: 'key', price: 0, sell: 0,
    desc: '三场全胜才会拿到的名帖，上面有三位裁判的印和卫箬的签名。' }],
};

const fighters = new Map(enemies.map((entry) => [entry.id, entry]));
const actions = new Set(['tournamentEnroll', 'tournamentFight', 'tournamentWithdraw', 'tournamentClaim']);
const canStaffHelp = (state) => state.region === tournamentData.region && state.knownItems.includes(tournamentData.lead);
const atRegistration = (state) => !state.combat && !state.gathering && (!state.event || state.event === tournamentData.site);
const occupied = '先结束眼前的事，再来找裁判。';

function enrollmentBlocker(state, score) {
  if (!atRegistration(state)) return occupied;
  if (score.enrolled) return '你已经报过名了。';
  if (state.day < score.until) return `本届结束后要等四个游戏日才能再报名，第${Math.ceil(score.until)}日可再来。`;
  if (state.coins < tournamentData.fee) return `报名要付${tournamentData.fee}枚灵钱。`;
  return '';
}

function boutBlocker(state, match, kit) {
  if (!atRegistration(state)) return occupied;
  if (!match) return '现在没有轮到你的比赛。';
  if (state.satiety <= 0) return '裁判见你空腹，先请你去吃些东西。';
  return kit.regulatedBoutBlocker(state);
}

export function initialTournament() {
  return { enrolled: false, wins: 0, best: -1, claimed: -1, until: 0, result: null };
}

export function tournamentView(state, kit) {
  if (!canStaffHelp(state)) return null;
  const score = state.tournament ?? initialTournament();
  const next = score.enrolled ? tournamentData.matches[score.wins] : null;
  const claim = score.best > score.claimed ? tournamentData.prizes[score.best] : null;
  const locationOpen = atRegistration(state);
  const inMatch = state.combat?.tournament === tournamentData.id;
  const canClaim = Boolean(claim && locationOpen);
  const claimFits = canClaim && kit.hasRoom(state, claim.reward);
  const enrollReason = score.enrolled ? '' : enrollmentBlocker(state, score);
  const fightReason = score.enrolled ? boutBlocker(state, next, kit) : '';
  return {
    ...score, name: tournamentData.name, desc: tournamentData.desc, fee: tournamentData.fee,
    cooldown: tournamentData.cooldown, matchCount: tournamentData.matches.length,
    status: inMatch ? 'combat' : score.enrolled ? 'ready' : score.result ? 'finished' : 'idle',
    match: next ? { name: next.name, note: next.note, opponent: fighters.get(next.enemy).name } : null,
    enrollReason, canEnroll: !score.enrolled && !enrollReason,
    fightReason, canFight: score.enrolled && !fightReason,
    canWithdraw: score.enrolled && (locationOpen || inMatch),
    canClaim: claimFits, claimName: claim?.name ?? '',
    claimBlocked: canClaim && !claimFits ? '行囊已满，留空位再领。' : '',
  };
}

function concludeTournament(state, result) {
  const score = state.tournament;
  score.enrolled = false;
  score.best = Math.max(score.best, score.wins);
  score.until = state.day + tournamentData.cooldown;
  score.result = result;
}

export function tournamentResolution(state, combat, won) {
  if (combat?.tournament !== tournamentData.id || !state.tournament?.enrolled) return '';
  if (!won) {
    concludeTournament(state, '本届止步');
    return '裁判叫停比试，扶你下场。';
  }
  const score = state.tournament;
  score.wins += 1;
  if (score.wins === tournamentData.matches.length) {
    concludeTournament(state, '三场全胜');
    return '裁判在你名下添了第三笔。三场全胜，可找他领头名奖品。';
  }
  return '裁判在榜上记下一胜。你可以歇过脚，再等下一场点名。';
}

export function tournamentAction(state, action, kit) {
  if (!actions.has(action)) return null;
  if (!canStaffHelp(state)) return kit.refuse('想参加守尺观大比，先到竹尺庭问问傅澄。');
  const inMatch = state.combat?.tournament === tournamentData.id;
  if (!atRegistration(state) && !(action === 'tournamentWithdraw' && inMatch)) return kit.refuse(occupied);
  const score = state.tournament ??= initialTournament();
  if (action === 'tournamentEnroll') {
    const reason = enrollmentBlocker(state, score);
    if (reason) return kit.refuse(reason);
    state.coins -= tournamentData.fee;
    Object.assign(score, { enrolled: true, wins: 0, result: null });
    state.event = null;
    return kit.say(state, '傅澄收了场地钱，把你的名字写上擂台边的木牌。');
  }
  if (action === 'tournamentFight') {
    const match = score.enrolled && tournamentData.matches[score.wins];
    const reason = boutBlocker(state, match, kit);
    if (reason) return kit.refuse(reason);
    kit.advance(state, tournamentData.boutDays);
    state.event = null;
    kit.startCombat(state, match.enemy, tournamentData.site);
    state.combat.tournament = tournamentData.id;
    return kit.say(state, `${match.name}。${match.note}`);
  }
  if (action === 'tournamentWithdraw') {
    if (!score.enrolled) return kit.refuse('你现在没有报名。');
    if (inMatch) {
      kit.advance(state, tournamentData.boutDays);
      kit.setRegulatedBoutRecovery(state);
    }
    state.combat = null;
    state.event = null;
    state.focus = 0;
    concludeTournament(state, '自行退赛');
    return kit.say(state, inMatch ? '你抬手认输，裁判让对手收招。前面赢过的场次仍算数。' : '你和裁判说了退赛。前面赢过的场次仍算数。');
  }
  const prize = score.best > score.claimed && tournamentData.prizes[score.best];
  if (!prize) return kit.refuse('目前没有可以领的奖品。');
  if (!kit.hasRoom(state, prize.reward)) return kit.refuse('行囊已满，留空位再领。');
  score.claimed = score.best;
  kit.addItems(state, prize.reward);
  return kit.say(state, prize.delivery ?? `裁判核对了名单，把${prize.name}交给你。`);
}
