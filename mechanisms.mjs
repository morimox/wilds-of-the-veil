export function initialMechanisms() {
  return {};
}

function mechanismAt(state, kit) {
  return state.event ? kit.data.mechanisms?.find(({ site }) => site === state.event) : null;
}

function initialSetting(mechanism) {
  return mechanism.mode === 'sequence' ? [] : mechanism.dials.map(({ initial }) => initial);
}

function equalSetting(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function obstruction(state, mechanism, progress, kit) {
  if (progress?.complete) return '机关已经打开。';
  if (state.combat) return '先处理眼前的对手。';
  if (state.gathering) return '这次采集还没结束。';
  if (mechanism.lead && !kit.owns(state, mechanism.lead.item)) return mechanism.lead.blockedText ?? '机关还缺一件能对上旧槽的东西。';
  if (state.satiety === 0) return '腹中空空，先吃些东西。';
  return '';
}

export function mechanismView(state, kit) {
  const mechanism = mechanismAt(state, kit);
  if (!mechanism || state.combat) return null;
  const progress = state.mechanisms[mechanism.id];
  const complete = progress?.complete ?? false;
  const original = initialSetting(mechanism);
  const setting = progress?.setting ?? original;
  const blocked = obstruction(state, mechanism, progress, kit);
  const inSequence = mechanism.mode === 'sequence';
  const maxLength = inSequence ? mechanism.maxLength ?? 8 : null;
  const full = inSequence && setting.length >= maxLength;
  const moves = mechanism.moves.map(({ id, label }) => ({ id, label }));
  const leadText = mechanism.lead && kit.owns(state, mechanism.lead.item) ? mechanism.lead.text : '';
  return {
    id: mechanism.id,
    title: mechanism.title,
    desc: mechanism.desc,
    tryLabel: mechanism.tryLabel ?? '试试机关',
    mode: mechanism.mode,
    complete,
    text: complete ? mechanism.completeText ?? mechanism.success : '',
    leadText,
    moves,
    readout: inSequence ? [] : mechanism.dials.map(({ id, name, states }, index) => ({ id, name, value: states[setting[index]] })),
    sequence: inSequence ? setting.map((id) => moves.find((move) => move.id === id)) : [],
    maxLength,
    canMove: !blocked && !full,
    canReset: !blocked && !equalSetting(setting, original),
    canTry: !blocked,
    reason: complete ? '' : blocked || (full ? '机关上的记号都用完了。可试机关，或复位再来。' : ''),
  };
}

const actions = new Set(['mechanismMove', 'mechanismReset', 'mechanismTry']);

export function mechanismAction(state, action, { id }, kit) {
  if (!actions.has(action)) return null;
  const mechanism = mechanismAt(state, kit);
  if (!mechanism) return kit.refuse('这里没有可摆弄的机关。');
  const progress = state.mechanisms[mechanism.id];
  const blocked = obstruction(state, mechanism, progress, kit);
  if (blocked) return kit.refuse(blocked);
  const original = initialSetting(mechanism);
  const setting = progress?.setting ?? original;

  if (action === 'mechanismMove') {
    const move = mechanism.moves.find((entry) => entry.id === id);
    if (!move) return kit.refuse('眼前没有那个操作件。');
    const inSequence = mechanism.mode === 'sequence';
    if (inSequence && setting.length >= (mechanism.maxLength ?? 8)) return kit.refuse('机关上的记号都用完了。');
    const next = inSequence ? [...setting, move.id] : mechanism.dials.map(({ states }, index) => {
      const shifted = (setting[index] + (move.shift?.[index] ?? 0)) % states.length;
      return (shifted + states.length) % states.length;
    });
    kit.advance(state, mechanism.moveDays ?? 0.125);
    state.mechanisms[mechanism.id] = { setting: next, complete: false };
    return kit.say(state, move.outcome ?? '机关动了一格。');
  }

  if (action === 'mechanismReset') {
    if (equalSetting(setting, original)) return kit.refuse('机关已经在原位。');
    kit.advance(state, mechanism.resetDays ?? 0.125);
    state.mechanisms[mechanism.id] = { setting: original, complete: false };
    return kit.say(state, '松开卡扣，机关回到了原位。');
  }

  kit.advance(state, mechanism.tryDays ?? 0.25);
  if (!equalSetting(setting, mechanism.solution)) {
    const result = kit.mechanismFailure(state, mechanism.failure ?? {}, mechanism.miss);
    if (result.fell) state.mechanisms[mechanism.id] = { setting: original, complete: false };
    return result;
  }
  state.mechanisms[mechanism.id] = { setting, complete: true };
  state.insight += mechanism.insight ?? 0;
  kit.leaveOnGround(state, mechanism.reward ?? {});
  return kit.say(state, mechanism.success);
}
