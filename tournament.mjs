export const tournamentData = {
  id: 'waterline_trials', name: '守尺观大比', region: 'measuring_hall', site: 'zhao_terrace_arena',
  lead: 'body_breath_note', fee: 12, cooldown: 4, boutDays: 0.125,
  desc: '傅澄让外客也用同一张赛帖。过了当场的尺线才算一胜，三场之间可下台整备。',
  matches: [
    { name: '第一场 · 丈步', enemy: 'terrace_stride', note: '陆黍拿短尺封路，先用小步试你能否在朱线内转身。' },
    { name: '第二场 · 压线', enemy: 'terrace_crossbeam', note: '田素功擅长在横架后突然前移。中南两线的裁判同时举牌才开场。' },
    { name: '第三场 · 立尺', enemy: 'terrace_finalist', note: '卫箬时常教内院弟子稳住相背的水势，最难接的是她收尺后返出的一整股力。' },
  ],
  prizes: [
    { name: '未取胜的行粮', reward: { ration: 2 } },
    { name: '丈步回礼', reward: { salve: 2, iron_talisman: 1 } },
    { name: '压线回礼', reward: { heal_pill: 2, core: 3 } },
    { name: '立尺头名', reward: { tournament_citation: 1, jade_pill: 2 }, art: 'terrace_reversing_stance' },
  ],
};

const enemies = [
  { id: 'terrace_stride', name: '量步客陆黍', tier: 1, hp: 34, atk: 10, def: 3, tags: ['human'], sparring: true,
    insight: 3, loot: {}, desc: '擅长用小步挤人离尺线，蓄势时前脚会踩得格外深。',
    intents: [{ name: '短尺截步', kind: 'attack', mult: 1 }, { name: '前足压线', kind: 'heavy', mult: 1.5 }, { name: '转尺收步', kind: 'guard', mult: 1.28 }] },
  { id: 'terrace_crossbeam', name: '斜梁手田素功', tier: 3, hp: 57, atk: 14, def: 5, tags: ['human'], sparring: true,
    insight: 5, loot: {}, desc: '护势放得很宽，常趁对手动手时转身换边。',
    intents: [{ name: '横梁抱肘', kind: 'guard', mult: 1.52 }, { name: '侧移点肋', kind: 'attack', mult: 1.05 },
      { name: '回身梁压', kind: 'heavy', mult: 1.62 }, { name: '夹尺低进', kind: 'attack', mult: 1 }] },
  { id: 'terrace_finalist', name: '立尺教习卫箬', tier: 5, hp: 82, atk: 18, def: 6, tags: ['human'], sparring: true,
    insight: 8, loot: {}, desc: '让手之前先低头听气。见她收回长尺，准备好架住返出的重劲。',
    intents: [{ name: '垂尺听气', kind: 'drain', mult: 0.75 }, { name: '反手推尺', kind: 'attack', mult: 1.02 },
      { name: '顺潮抱尺', kind: 'guard', mult: 1.42 }, { name: '逆水返尺', kind: 'heavy', mult: 1.68 },
      { name: '点步短推', kind: 'attack', mult: 1.05 }] },
];

export const tournamentContent = {
  enemies,
  sites: [{ id: tournamentData.site, region: tournamentData.region, name: '观内朱线台', protectedArena: true,
    reveal: { item: tournamentData.lead } }],
  events: [{ id: tournamentData.site, name: '观内朱线台', text: '台上横着三道朱线，两边各有裁判坐着。有人把旧尺靠在题名榜前，候场客在长凳上绑紧护腕。',
    choices: [{ label: '向护场人问赛帖', days: 0.125,
      outcome: '护场人指着案上的赛帖。「报了名再按场次领对手。敲一下台边铜片就是认输，裁判会让双方收手。」' }] }],
  items: [{ id: 'tournament_citation', name: '朱线头名帖', kind: 'key', price: 0, sell: 0,
    desc: '三位裁判将三场赛尺各拓一道，最后请卫箬在朱线上落款。' }],
  arts: [{ id: 'terrace_reversing_stance', name: '反水立尺', tier: 3, cost: 5, power: 4, pierce: 3, guard: 6, break: 12,
    price: 0, weaponBased: false, prizeOnly: true, reveal: { item: 'tournament_citation' },
    desc: '卫箬把对手的力领过身侧，再用护住身形的短劲把他推回原位。看准重招出手效果最好。' }],
};

const fighters = new Map(enemies.map((entry) => [entry.id, entry]));
const actions = new Set(['tournamentEnroll', 'tournamentFight', 'tournamentWithdraw', 'tournamentClaim']);
const canStaffHelp = (state) => state.region === tournamentData.region && state.knownItems.includes(tournamentData.lead);
const atRegistration = (state) => !state.combat && !state.gathering && (!state.event || state.event === tournamentData.site);

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
  return {
    ...score, name: tournamentData.name, desc: tournamentData.desc, fee: tournamentData.fee,
    cooldown: tournamentData.cooldown, matchCount: tournamentData.matches.length,
    status: inMatch ? 'combat' : score.enrolled ? 'ready' : score.result ? 'finished' : 'idle',
    match: next ? { name: next.name, note: next.note, opponent: fighters.get(next.enemy).name } : null,
    canEnroll: locationOpen && !score.enrolled && state.day >= score.until && state.coins >= tournamentData.fee,
    canFight: Boolean(next && locationOpen && state.satiety > 0),
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
    return '护场人替你撤下赛帖。';
  }
  const score = state.tournament;
  score.wins += 1;
  if (score.wins === tournamentData.matches.length) {
    concludeTournament(state, '三场全胜');
    return '末场记在榜上，三场全胜。可找裁判领取头名回礼。';
  }
  return '裁判在榜上记下一胜。你可以歇过脚，再等下一场点名。';
}

export function tournamentAction(state, action, kit) {
  if (!actions.has(action)) return null;
  if (!canStaffHelp(state)) return kit.refuse('裁判还没有见过你的练尺帖。');
  const inMatch = state.combat?.tournament === tournamentData.id;
  if (!atRegistration(state) && !(action === 'tournamentWithdraw' && inMatch)) return kit.refuse('先从眼下的事里抽身。');
  const score = state.tournament ??= initialTournament();
  if (action === 'tournamentEnroll') {
    if (score.enrolled) return kit.refuse('你的赛帖还在榜上。');
    if (state.day < score.until) return kit.refuse('上一届还在清榜，等四个游戏日的间隔满了再来。');
    if (state.coins < tournamentData.fee) return kit.refuse(`报名要付${tournamentData.fee}枚灵钱。`);
    state.coins -= tournamentData.fee;
    Object.assign(score, { enrolled: true, wins: 0, result: null });
    state.event = null;
    return kit.say(state, '傅澄收好场地钱，把赛帖钉在题名榜上。');
  }
  if (action === 'tournamentFight') {
    const match = score.enrolled && tournamentData.matches[score.wins];
    if (!match) return kit.refuse('你眼下没有在榜上等候的场次。');
    if (state.satiety <= 0) return kit.refuse('裁判见你空腹，先请你去吃些东西。');
    kit.advance(state, tournamentData.boutDays);
    state.event = null;
    kit.startCombat(state, match.enemy, tournamentData.site);
    state.combat.tournament = tournamentData.id;
    return kit.say(state, `${match.name}。${match.note}`);
  }
  if (action === 'tournamentWithdraw') {
    if (!score.enrolled) return kit.refuse('你眼下没有赛帖可撤。');
    if (inMatch) kit.advance(state, tournamentData.boutDays);
    state.combat = null;
    state.event = null;
    state.focus = 0;
    concludeTournament(state, '自行退赛');
    return kit.say(state, '你示意认输，护场人让双方收手。已经记在榜上的胜场仍有效。');
  }
  const prize = score.best > score.claimed && tournamentData.prizes[score.best];
  if (!prize) return kit.refuse('裁判手边没有你尚未领取的回礼。');
  if (!kit.hasRoom(state, prize.reward)) return kit.refuse('行囊已满，留空位再领。');
  score.claimed = score.best;
  kit.addItems(state, prize.reward);
  if (prize.art && !state.knownArts.includes(prize.art)) state.knownArts.push(prize.art);
  return kit.say(state, prize.art ? '卫箬交给你头名帖和回礼，又把反水立尺的起手拆开教给你。' : `裁判对过题名榜，把${prize.name}交给你。`);
}
