const town = {
  name: '丹师安蒲',
  reveal: ['clinic_note', 'kiln_manual', 'foundation_ledger'],
  furnaceSketch: 'furnace_sketch',
  intro: '桌边晾着几张抄好的丹方。安蒲用湿布裹住药炉，等它凉下来。',
  greeting: '安蒲抽出压在秤底的图。「院里找面背风的墙，就能搭炉。先用小火，闻到焦味就停。」',
  knownGreeting: '「想炼哪种药，先找那一味的丹方。炉子也得经得住那个火候。」',
  coreRemark: '安蒲指了指药案上分开的两只小罐。「妖丹按品级收。丹方用得到的可以留着，缺盘缠时拿到坊市也能换钱。」',
};

const offers = [
  { id: 'formula_qi', recipe: 'r_qi', name: '回气散丹方', price: 10,
    desc: '「真气快用完了，可以吃一包回气散。伤口得另抹药。」安蒲把磨药的石碗推近。「看，灵草磨到这么细才成。」' },
  { id: 'formula_grain', recipe: 'r_grain', name: '暖谷丸丹方', price: 12,
    desc: '把煮过的粮磨细，熬稠了搓成小丸。常在雾里赶路的人吃它顶饿。' },
  { id: 'formula_focus', recipe: 'r_focus', name: '定息丹方', price: 19,
    desc: '「这丹入口苦，你若接着用术法，打出去就更有劲。」' },
  { id: 'formula_resin', recipe: 'r_resin_pill', name: '温枝丸丹方', price: 28, reveal: 'kiln_manual',
    desc: '安蒲比了比你带回的火候牌。石谷人会把炉口盖住，让小火慢慢把药温透。到炼气中期才能服用。' },
];

const inquiry = [
  {
    id: 'read_foundation_ledger', label: '请安蒲看看烧焦的账页',
    text: '安蒲用指腹一抹，半枚红印从灰底下露出来。「这是旧丹窑的印。收药的人写在另一本账上，得花些盘缠，请人去查。」',
    proof: 'foundation_ledger', tier: 2, price: 32, days: 0.5, reward: { foundation_letter: 1 },
    reply: '送货账最后写的是沉钟岭。安蒲在借书信上盖了印。「拿这封借卷帖去背钟试剑亭。想借书，得听那里的守书人怎么说。」',
    progress: '拿着借卷帖去沉钟岭的背钟试剑亭，找守书人。',
  },
  {
    id: 'collate_spar_mark', label: '让安蒲对照守书人盖的印',
    text: '安蒲把试剑印放在旧印边，两道花纹正好接上。想打开旧丹窑，得先出钱请人换掉破裂的火管，再让送信人跑一趟。',
    proof: 'foundation_spar_mark', defeated: 'foundation_duelist', price: 51, days: 0.75,
    reward: { foundation_delivery: 1 },
    reply: '云炉石谷的管窑人收了修炉钱，托人送来一块移灰牌。「火管换好了。木牌能开后烟道的小门，半枚旧印还卡在里头。」',
    progress: '带移灰牌到云炉石谷，从后烟道入口进旧丹窑。',
  },
  {
    id: 'restore_kiln_seal', label: '把旧窑的半枚印交给安蒲',
    text: '两枚印上的花纹接上了，丹方最后一行却只剩雪关的印。安蒲得雇人把柴送上山，请护炉人重开验药室。',
    proof: 'foundation_kiln_seal', defeated: 'foundation_kiln_echo', price: 68, days: 1,
    reward: { foundation_snow_order: 1 },
    reply: '安蒲雇好了上山的人，把写着路线的信帖递给你。「这封叫封石之约。你拿着它从碎云雪关进封石验药室，护炉人认得上面的印。」',
    progress: '带封石之约到碎云雪关的封石验药室。',
  },
  {
    id: 'finish_foundation_formula', label: '把验药印交给安蒲',
    text: '验药印背面刻着熄火的时机，正好补上丹方缺的一段。安蒲得买一只没开裂的密封药盒，再用自己的炉试一遍，才能备好那份药引。',
    proof: 'foundation_warden_proof', defeated: 'foundation_warden', price: 86, days: 1.25,
    reward: { formula_foundation: 1, foundation_charge: 1 },
    reply: '安蒲交给你补全的筑基丹方和一剂封炉药引。「只够炼一炉。等家里的炼丹炉升到二级，再开封下料。」',
    progress: '筑基丹方已经补全。封炉药引只够用一次。',
  },
];

export const alchemyData = { town, offers, inquiry };

export function initialAlchemyState() {
  return { inquiryIndex: 0 };
}

function knowsAlchemist(state) {
  return town.reveal.some((id) => state.knownItems.includes(id));
}

function currentInquiry(state) {
  const index = state.alchemy?.inquiryIndex ?? 0;
  if (!index && !state.knownItems.includes(inquiry[0].proof)) return null;
  return inquiry[index] ?? null;
}

function hasInquiryProof(state, step, kit) {
  return kit.owns(state, step.proof) > 0 && (!step.defeated || state.defeated.includes(step.defeated));
}

function inquiryBlocker(state, step, kit) {
  if ((step.tier ?? 0) > state.realm) return '安蒲搭了搭脉，等你到了炼气后期，再谈试药。';
  if (!hasInquiryProof(state, step, kit)) return `等你带回${kit.nameOf(step.proof)}。`;
  return kit.homeRequirements(state, step.price, {}) || '';
}

function knowsOffer(state, offer) {
  return !offer.reveal || state.knownItems.includes(offer.reveal);
}

function offerBlocker(state, offer, kit) {
  if (state.knownItems.includes(offer.id)) return '已学这份丹方。';
  return kit.homeRequirements(state, offer.price, {}) || '';
}

export function alchemyView(state, kit) {
  if (!kit.atHome(state) || !knowsAlchemist(state)) return null;
  const index = state.alchemy?.inquiryIndex ?? 0;
  const step = currentInquiry(state);
  return {
    name: town.name,
    intro: state.knownItems.some((id) => id === 'qi_core' || id === 'foundation_core')
      ? `${town.intro}${town.coreRemark}` : town.intro,
    offers: offers.filter((offer) => knowsOffer(state, offer)).map((offer) => ({
      ...offer, known: state.knownItems.includes(offer.id), reason: offerBlocker(state, offer, kit),
    })),
    inquiry: step && hasInquiryProof(state, step, kit) ? {
      id: step.id, label: step.label, text: step.text, price: step.price,
      need: { [step.proof]: 1 }, reason: inquiryBlocker(state, step, kit),
    } : null,
    progressText: index ? inquiry[index - 1].progress : '',
  };
}

function buyFormula(state, id, kit) {
  const offer = offers.find((row) => row.id === id && knowsOffer(state, row));
  if (!offer) return kit.refuse('安蒲的案上没有这一方。');
  const reason = offerBlocker(state, offer, kit);
  if (reason) return kit.refuse(reason);
  kit.spendHome(state, offer.price, {});
  kit.addItems(state, { [id]: 1 });
  return kit.say(state, `安蒲递过${offer.name}。${offer.desc}`);
}

function advanceInquiry(state, id, kit) {
  const step = currentInquiry(state);
  if (!step || step.id !== id) return kit.refuse('这桩事还没有做到这一步。');
  const reason = inquiryBlocker(state, step, kit);
  if (reason) return kit.refuse(reason);
  kit.spendHome(state, step.price, {});
  kit.advance(state, step.days);
  (state.alchemy ??= initialAlchemyState()).inquiryIndex += 1;
  kit.addItems(state, step.reward);
  return kit.say(state, step.reply);
}

export function alchemyAction(state, action, { id }, kit) {
  if (!['alchemyTalk', 'alchemyBuyFormula', 'alchemyAdvance'].includes(action)) return null;
  if (!kit.atHome(state)) return kit.refuse('回落灯村再去找安蒲。');
  if (!knowsAlchemist(state)) return kit.refuse('你还没有人引见。');
  if (action === 'alchemyBuyFormula') return buyFormula(state, id, kit);
  if (action === 'alchemyAdvance') return advanceInquiry(state, id, kit);
  if (state.knownItems.includes(town.furnaceSketch)) return kit.say(state, town.knownGreeting);
  kit.addItems(state, { [town.furnaceSketch]: 1 });
  return kit.say(state, town.greeting);
}
