const town = {
  name: '丹师安蒲',
  reveal: ['clinic_note', 'kiln_manual', 'foundation_ledger'],
  furnaceSketch: 'furnace_sketch',
  intro: '药案边晾着抄好的小方。安蒲用湿布裹着药炉，等它慢慢散热。',
  greeting: '安蒲把压在秤底的草图抽出来。「院里有背风的墙就能起炉。先用小火，闻见焦味便收。」',
  knownGreeting: '「炉子该收火时就收。若想学做哪味，先拿相应的丹方来。」',
  coreRemark: '安蒲指了指药案上分开的两只小罐。「妖丹按品级收。丹方用得到的可以留着，缺盘缠时拿到坊市也能换钱。」',
};

const offers = [
  { id: 'formula_qi', recipe: 'r_qi', name: '回气散丹方', price: 10,
    desc: '灵草磨得细，服下才容易化开。用来续气，外伤还得另敷。' },
  { id: 'formula_grain', recipe: 'r_grain', name: '暖谷丸丹方', price: 12,
    desc: '把谷粮煎收成小丸，给常在雾里来不及生火的人备着。' },
  { id: 'formula_focus', recipe: 'r_focus', name: '定息丹方', price: 19,
    desc: '舌底留一股苦味，急着出招之前可以先缓口气。' },
  { id: 'formula_resin', recipe: 'r_resin_pill', name: '温枝丸丹方', price: 28, reveal: 'kiln_manual',
    desc: '安蒲比了比你带回的火候牌。石谷的闷火法能把药温透，炼气中期才好服用。' },
];

const inquiry = [
  {
    id: 'read_foundation_ledger', label: '请安蒲辨认烧残的丹簿',
    text: '安蒲认得丹簿上的半道旧印。要找出接手的人，他得先垫钱遣人去查丹窑的送货账。',
    proof: 'foundation_ledger', tier: 2, price: 32, days: 0.5, reward: { foundation_letter: 1 },
    reply: '送货账最后一次落款在沉钟岭。安蒲盖好借卷帖。「去背钟试剑亭找守亭人。亭里的规矩由他亲口说。」',
    progress: '借卷帖指向沉钟岭的背钟试剑亭。',
  },
  {
    id: 'collate_spar_mark', label: '拿守亭人的签认对簿',
    text: '安蒲把签认压在旧印边，两个印角正好合上。要把旧丹窑打开，就得请窑工换掉破裂的火管，再付一趟脚钱。',
    proof: 'foundation_spar_mark', defeated: 'foundation_duelist', price: 51, days: 0.75,
    reward: { foundation_delivery: 1 },
    reply: '云炉石谷的管窑人收下修炉费，托脚夫回送移灰牌。「火管已经换好。木牌能开反烟口，上一炉的半枚旧印还卡在里头。」',
    progress: '移灰牌可以打开云炉石谷旧丹窑内壁的反烟口。',
  },
  {
    id: 'restore_kiln_seal', label: '带回炉封，请他接续残方',
    text: '两个印面的笔路相接，丹方最后一行却只剩雪印。安蒲打算租驮具、买燃料，让验药室的守人愿意重开门。',
    proof: 'foundation_kiln_seal', defeated: 'foundation_kiln_echo', price: 68, days: 1,
    reward: { foundation_snow_order: 1 },
    reply: '安蒲把租来的驮具交给山路上的脚夫，又在覆印约上写好行程。「从碎云雪关进封石验药室，室里有人守印。」',
    progress: '覆印约可带到碎云雪关的封石验药室。',
  },
  {
    id: 'finish_foundation_formula', label: '把验药印交给安蒲',
    text: '验药印的背面留着缺失的收火法。安蒲请你出钱置办一只无裂纹的封匣，再用他自己的炉试火，才能分出一引药种。',
    proof: 'foundation_warden_proof', defeated: 'foundation_warden', price: 86, days: 1.25,
    reward: { formula_foundation: 1, foundation_charge: 1 },
    reply: '安蒲交给你补全的筑基丹方和一剂封炉药引。「这一剂只够起一炉。自家炼丹炉稳得住两层火，才能启封下料。」',
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
