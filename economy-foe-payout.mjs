export const foePurseRows = [
  { enemy: 'caravan_broker', site: 'caravan_granary', coins: 24,
    text: '灰衣人从后梯退走，椅脚旁落着他随身的短绳钱袋。' },
  { enemy: 'bandit_den_leader', site: 'bandit_slope_den', coins: 28,
    text: '许涧腰间的钱袋被凳脚扯脱，落在长桌下。' },
  { enemy: 'bandit_red_rope_chief', site: 'bandit_red_rope_den', coins: 66,
    text: '邵苹随身的皮钱袋从衣襟滑落，卡在两块船板中间。' },
  { enemy: 'zhao_cargo_keeper', site: 'zhao_cargo_blue_reef', coins: 56,
    text: '马四落在船板上的小钱袋，系的是他自己腰间那条蓝绳。' },
  { enemy: 'border_silo_leader', site: 'border_silo_den', coins: 112,
    text: '阮隼贴身的布钱袋落在秤梁边，和货架上待点验的货分在两处。' },
  { enemy: 'bandit_salt_cave_chief', site: 'bandit_salt_cave_den', coins: 210, equipment: 'bandit_salt_boots', wear: 0.8,
    text: '封霁披风里那只沉甸甸的钱袋落在石凳旁。' },
];

const purses = new Map(foePurseRows.map(row => [row.enemy, row]));

export function foePurseReward(enemy, { siteId, first, protectedBout }) {
  if (!first || protectedBout || !enemy?.tags?.includes('human') || enemy.sparring) return null;
  const purse = purses.get(enemy.id);
  return purse && purse.site === siteId ? purse : null;
}
