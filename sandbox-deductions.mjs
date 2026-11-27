import { sandboxQuestsEast, sandboxQuestsEastExtras } from './sandbox-quests-east.mjs';
import { sandboxQuestsWest, sandboxQuestsWestExtras } from './sandbox-quests-west.mjs';

const sandboxQuests = [...sandboxQuestsWest, ...sandboxQuestsEast];
export const sandboxQuestExtras = [sandboxQuestsWestExtras, sandboxQuestsEastExtras];

export const sandboxDeductions = {
  find_eddy: {
    conclusion: '去白苇滩断船桅旁的高岸，找第三根船桩外那块露出水面的石头。等水刚上涨，从石头背后放下一根苇秆，看它会不会贴着石脚往里漂。',
    reason: '旧桨的靠岸图上，只有绕过露石的缆绳没绷紧。药僮的水线图画的是同一块石头。涨水时，绕过石背的水会往水眼流。退水时它改朝出水口，苇秆也会跟着漂走。',
  },
  read_echo: {
    conclusion: '去沉钟岭的回声石洞，用洞口的碎石敲破铃。掌心贴住岩面，等第二声从洞里传回来，再把气往下沉。',
    reason: '茶棚的掌谱上，画中人指甲朝外，贴着岩石的是掌心。第一声只响在铃边，第二声从里面回来，震得石屑掉下。等掌心感觉到这一震，再照掌谱沉气。',
  },
  trace_backwash: {
    conclusion: '去闭潮渡那艘没篷的渡舟。让瓦上刻字的一面背对灯火，把铃舌挂上船外的弯钩，再把铜片插进靠水面的窄缝。看灯影在船外照出哪块石头。',
    reason: '残瓦无字的一面被火熏黑，原先是那面靠灯。带结的铃舌绳圈有弯钩磨痕，还沾着白盐，正合船外的钩。铜片被水冲亮的那边留着水痕，和靠水的窄缝对得上。',
  },
  align_axis: {
    conclusion: '上天衡石台，到偏影观星梁背面，把旧镜的镜脚插进内侧浅孔。等梁影缩成一条细线，再转动镜子，看看三道反光能否合在一点。',
    reason: '矿工的铁样插到底会被横铁卡住。旧镜的脚也有一道凸头，插进深孔会碰到横挡，转不开。拓纸上的三个圈共用一条细线，等梁影收窄，就能沿这条线对准反光。',
  },
  gold_assay: {
    conclusion: '去照原的斜漏水驿，在用陶罐试水的旧槽找施荀。带上验火册、滴水图、黑泥和井盐。先让两边均匀滴水，再趁陶罐还温热时放入井盐。',
    reason: '铜板上两排水滴逐个对齐。回潮洞的黑泥在没有水纹的地方才沉得平，一边滴快就会把它卷起来。冷炉验火册在熄火那行画的是一圈细盐，隔夜那行只剩盐块。两边水量稳了，趁罐里还有余温才能验出那道盐圈。',
  },
};

for (const { id, conclusion, reason } of sandboxQuests) sandboxDeductions[id] = { conclusion, reason };

export function addSandboxQuests({ items, sites, events, deductions }) {
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const eventById = new Map(events.map((event) => [event.id, event]));
  for (const quest of sandboxQuests) {
    const target = eventById.get(quest.site);
    if (!target || target.experiment) throw new Error(`Invalid verification site for ${quest.id}: ${quest.site}`);
    for (const { id, name, desc, site, action } of quest.clues) {
      items.push({ id, name, desc, kind: 'key', price: 0, sell: 0 });
      const source = eventById.get(site);
      const local = siteById.get(site);
      if (!source || !local) throw new Error(`Unknown clue site for ${id}: ${site}`);
      (local.once ??= []).push(source.choices.length);
      source.choices.push({ stay: true, ...action, loot: { [id]: 1 } });
    }
    deductions.push({ id: quest.id, name: quest.title, tier: 0, desc: quest.experiment.desc });
    const needs = Object.fromEntries(quest.clues.map(({ id }) => [id, 1]));
    target.experiment = { ...quest.experiment, id: quest.id, need: needs };
  }
}
