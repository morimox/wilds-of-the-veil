import assert from 'node:assert/strict';
import test from 'node:test';
import { data } from './data.mjs';
import { foePurseReward, foePurseRows } from './economy-foe-payout.mjs';

test('personal purses are separate, one-time rewards confined to the named human and its own site', () => {
  for (const row of foePurseRows) {
    const { enemy: id, site, text } = row;
    const enemy = data.enemies.find(enemy => enemy.id === id);
    assert.ok(enemy && enemy.tags.includes('human') && !enemy.sparring);
    assert.equal(data.sites.find(entry => entry.id === site).creatures[id].cap, 1);
    assert.ok(data.events.find(entry => entry.id === site).choices.some(
      choice => choice.enemy === id || choice.encounter?.includes(id)));
    const result = foePurseReward(enemy, { siteId: site, first: true, protectedBout: false });
    assert.deepEqual(result, row);
    assert.equal(foePurseReward(enemy, { siteId: site, first: false, protectedBout: false }), null);
    assert.equal(foePurseReward(enemy, { siteId: site, first: true, protectedBout: true }), null);
    assert.equal(foePurseReward(enemy, { siteId: 'village', first: true, protectedBout: false }), null);
    assert.match(text, /钱袋/);
  }
  assert.equal(foePurseReward(data.enemies.find(enemy => enemy.id === 'road_bow_robber'),
    { first: true, protectedBout: false }), null);
});

test('road bandits are low-liquidity opponents even when a rich purse is drawn', () => {
  const mean = ([min, max]) => (min + max) / 2;
  const pools = data.roadBandits.pools;
  const plannedEquipment = [65, 650, 6500];
  const prices = pools.map(({ tier, cash, richCash, richChance }) => {
    const expected = mean(cash) * (1 - richChance) + mean(richCash) * richChance;
    assert.ok(expected < plannedEquipment[Math.floor(tier / 3)] * 0.1);
    return expected;
  });
  assert.ok(prices.every((expected, index) => index === 0 || expected > prices[index - 1]));
  assert.ok(pools.every(({ fee }, index) => index === 0 || fee[0] > pools[index - 1].fee[0]));
});
