export const trainingData = [
  { id: 'seals', name: '符法', region: 'village', teacher: '莫船家', lead: 'lamp_sketch',
    desc: '灶门漏风。莫船家把符按在桌上，让你练着用一只手压稳，再用另一只手引出符里的火。',
    ranks: [
      { coins: 12, days: 1, need: { reed: 3, wood: 2 }, sealDamage: 2, sealGuard: 1, effect: '伤敌的符多造成 2 点原始伤害，护身的符多挡 1 点。' },
      { coins: 22, days: 2, need: { reed: 5, ore: 2 }, sealDamage: 3, sealGuard: 2, effect: '伤敌的符多造成 3 点原始伤害，护身的符多挡 2 点。' },
      { coins: 36, days: 3, need: { core: 3, qi_core: 2 }, sealDamage: 5, sealGuard: 3, effect: '伤敌的符多造成 5 点原始伤害，护身的符多挡 3 点。' },
    ] },
  { id: 'breath', name: '内息', region: 'willow_post', teacher: '驿医桑拙', lead: 'echo_method',
    desc: '桑拙把练内息的手稿摊在茶桌上。他敲两下桌面，让你按那两下的间隔慢慢吸气、吐气。',
    ranks: [
      { coins: 14, days: 1, need: { reed: 4, core: 1 }, qi: 3, restQi: 1, effect: '真气上限加 3，在歇脚处每次多恢复 1 点真气。' },
      { coins: 26, days: 2, need: { ore: 3, core: 2 }, qi: 6, restQi: 2, effect: '真气上限加 6，在歇脚处每次多恢复 2 点真气。' },
      { coins: 40, days: 3, need: { qi_core: 2, core: 4 }, qi: 9, restQi: 3, effect: '真气上限加 9，在歇脚处每次多恢复 3 点真气。' },
    ] },
  { id: 'body', name: '炼体', region: 'measuring_hall', teacher: '教尺法的傅澄', lead: 'body_breath_note',
    desc: '傅澄把两块压秤的大石头搬来。他让你先站稳，再一点点把重量接到自己手里。',
    ranks: [
      { coins: 16, days: 1, need: { hide: 2, wood: 3 }, hp: 4, def: 0, effect: '气血上限加 4。' },
      { coins: 28, days: 2, need: { ore: 4, hide: 4 }, hp: 8, def: 1, effect: '气血上限加 8，被打中时少受 1 点伤害。' },
      { coins: 44, days: 3, need: { black_iron: 3, hide: 6 }, hp: 12, def: 2, effect: '气血上限加 12，被打中时少受 2 点伤害。' },
    ] },
  { id: 'elements', name: '五行', region: 'mingsha_city', teacher: '阮杪', lead: 'cold_kiln_record',
    desc: '阮杪带着冷炉验火册来登记。她翻出一页，让你换几种材料试一试。同样的力用在石头和兽皮上，效果并不一样。',
    ranks: [
      { coins: 32, days: 2, need: { core: 4, ore: 4 }, element: 1, effect: '金有助于打穿石甲和鳞甲，木能卸去野兽扑咬的力，水能少失些真气，火对阴灵更有效，土能挡住石妖的重招。遇上对应情况时，加成是 1 点。' },
      { coins: 52, days: 3, need: { core: 6, black_iron: 4, foundation_core: 1 }, element: 2, effect: '遇上相应的敌人或招式时，五行加成提高到 2 点。' },
      { coins: 80, days: 4, need: { core: 9, black_iron: 7, foundation_core: 2 }, element: 3, effect: '遇上相应的敌人或招式时，五行加成提高到 3 点。' },
    ] },
  { id: 'spirit', name: '神识', region: 'zhao_city', teacher: '教看水势的杜椿', lead: 'phase_chart',
    desc: '水还没漫过铜板边缘，杜椿就让你闭眼听它涨上来。交手时，你也能用这个法子提前察觉对方的动作。',
    ranks: [
      { coins: 30, days: 2, need: { core: 3, qi_core: 2 }, senseMax: 2, senseGuard: 2, effect: '神识上限 2。花 1 点观这一招并少受 2 点伤害。对方还在等你先动时，只能护身。' },
      { coins: 48, days: 3, need: { core: 5, beast_eye: 1, foundation_core: 1 }, senseMax: 3, senseGuard: 3, effect: '神识上限 3。花 1 点观这一招并少受 3 点伤害。对方还在等你先动时，只能护身。' },
      { coins: 72, days: 4, need: { core: 8, beast_eye: 2, foundation_core: 2 }, senseMax: 4, senseGuard: 4, effect: '神识上限 4。花 1 点观这一招并少受 4 点伤害。对方还在等你先动时，只能护身。' },
    ] },
];

const tracks = new Map(trainingData.map((row) => [row.id, row]));
const trainedLevel = (state, id) => state.training?.levels?.[id] ?? 0;
const trainedRank = (state, id) => tracks.get(id).ranks[trainedLevel(state, id) - 1] ?? {};
const knowsTraining = (state, track) => state.knownItems.includes(track.lead);

export function initialTraining() {
  return { levels: {}, sense: 0 };
}

export function trainingStats(state) {
  const body = trainedRank(state, 'body');
  return { hp: body.hp ?? 0, def: body.def ?? 0, qi: trainedRank(state, 'breath').qi ?? 0 };
}

export function trainingPerks(state, enemy, intent) {
  const seal = trainedRank(state, 'seals');
  const element = trainedRank(state, 'elements').element ?? 0;
  const tags = enemy?.tags ?? [];
  const stone = tags.includes('stoneborn');
  const beast = tags.some((tag) => ['beast', 'furred', 'scaled'].includes(tag));
  const guardsElement = intent?.kind === 'drain' || (intent?.kind === 'attack' && beast) || (intent?.kind === 'heavy' && stone);
  return {
    sealDamage: seal.sealDamage ?? 0, sealGuard: seal.sealGuard ?? 0,
    damage: tags.includes('spirit') ? element : 0,
    pierce: stone || tags.includes('scaled') ? element : 0,
    guard: (guardsElement ? element : 0) + (state.combat?.spiritGuard ?? 0),
    restQi: trainedRank(state, 'breath').restQi ?? 0,
  };
}

export function restoreTrainingSense(state, amount = Infinity) {
  const maximum = trainedRank(state, 'spirit').senseMax ?? 0;
  const current = state.training?.sense ?? 0;
  const gained = Math.max(0, Math.min(amount, maximum - current));
  if (gained > 0) state.training.sense = current + gained;
  return gained;
}

export function needsSenseRest(state) {
  return (state.training?.sense ?? 0) < (trainedRank(state, 'spirit').senseMax ?? 0);
}

function studyBlocker(state, track, rank, kit) {
  if (!rank) return '这门技艺已经学完。';
  if (state.region !== track.region) return `得去${kit.records.regions[track.region].name}找${track.teacher}。`;
  if (state.combat || state.event || state.gathering) return '眼下得先处理手头的事。';
  return kit.homeRequirements(state, rank.coins, rank.need) ?? '';
}

function spiritView(state, kit) {
  const max = trainedRank(state, 'spirit').senseMax;
  if (!max) return null;
  const combat = state.combat;
  const current = state.training.sense;
  const enemy = combat && kit.records.enemies[combat.id];
  const readThisRound = combat && combat.spiritReadRound === combat.round;
  const intent = enemy && readThisRound && kit.readableIntent(state);
  return {
    current, max, canRead: Boolean(enemy && !readThisRound && current > 0),
    prediction: intent ? { name: intent.name, kind: intent.kind } : null,
  };
}

export function trainingView(state, kit) {
  const rows = trainingData.filter((track) => knowsTraining(state, track)).map((track) => {
    const { id, name, desc, teacher, region, ranks } = track;
    const level = trainedLevel(state, id);
    const next = ranks[level] ?? null;
    const blockedReason = studyBlocker(state, track, next, kit);
    return { id, name, desc, teacher, trainer: teacher, region, level, maxLevel: ranks.length,
      effect: ranks[level - 1]?.effect ?? '', next, available: !blockedReason, blockedReason };
  });
  return { rows, spiritSense: spiritView(state, kit) };
}

export function trainingAction(state, action, { id }, kit) {
  if (action !== 'trainStudy') return null;
  const track = tracks.get(id);
  if (!track || !knowsTraining(state, track)) return kit.refuse('你还没有碰到这门技艺的传承。');
  const level = trainedLevel(state, id);
  const rank = track.ranks[level];
  const blocker = studyBlocker(state, track, rank, kit);
  if (blocker) return kit.refuse(blocker);
  const before = trainedRank(state, id);
  kit.spendHome(state, rank.coins, rank.need);
  kit.advance(state, rank.days);
  (state.training ??= initialTraining()).levels[id] = level + 1;
  state.hp += (rank.hp ?? 0) - (before.hp ?? 0);
  state.qi += (rank.qi ?? 0) - (before.qi ?? 0);
  if (id === 'spirit') restoreTrainingSense(state);
  kit.normalize(state);
  return kit.say(state, `${track.teacher}看你亲手操练过一遍。${track.name}练到第 ${level + 1} 阶。`);
}

export function recordTrainingRead(state, kit) {
  const sense = spiritView(state, kit);
  if (!sense || !state.combat) return kit.refuse('学会神识后，可以在战斗中预看对手的招式。');
  if (!sense.canRead) return kit.refuse(sense.current ? '这回合已经用神识看过了。' : '神识已经耗尽，可以歇脚或用药养回来。');
  state.training.sense -= 1;
  state.combat.spiritReadRound = state.combat.round;
  state.combat.spiritGuard = trainedRank(state, 'spirit').senseGuard;
  const intent = kit.readableIntent(state);
  return kit.say(state, intent ? `你看见对方这一招是「${intent.name}」。` : '对方还在等你先动。你先凝神护住周身。');
}
