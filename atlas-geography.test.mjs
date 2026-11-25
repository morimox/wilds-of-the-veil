import assert from 'node:assert/strict';
import test from 'node:test';
import { atlasBorderRoad, atlasGeography, atlasLocation } from './atlas-geography.mjs';
import { data } from './data.mjs';
import { createGame, view } from './engine.mjs';
import { roadGraph, transportRules } from './world.mjs';

const maps = roadGraph(data);
const province = (id) => data.regionDetails[id].province;
const cross = ([x, y], [u, v], [q, r]) => (u - x) * (r - y) - (v - y) * (q - x);
const segments = ({ survey }) => survey.slice(1).map((point, index) => [survey[index], point]);
const distance = ([x, y], [u, v]) => Math.hypot(u - x, v - y);

function distanceToSegment([x, y], [[a, b], [c, d]]) {
  const dx = c - a;
  const dy = d - b;
  const ratio = Math.max(0, Math.min(1, ((x - a) * dx + (y - b) * dy) / (dx * dx + dy * dy)));
  return distance([x, y], [a + dx * ratio, b + dy * ratio]);
}

function longestCloseStretch(road, otherRoad, junction) {
  const laneWidth = 8;
  // Two roads necessarily converge inside their own intersection. Compare the stretches beyond it.
  const junctionRadius = 13;
  const parallelWithin = Math.sin(30 * Math.PI / 180);
  let stretch = 0;
  let longest = 0;
  for (const [a, b] of segments(road)) {
    const length = distance(a, b);
    const beside = segments(otherRoad).filter(([c, d]) =>
      Math.abs(cross(a, b, d) - cross(a, b, c)) < parallelWithin * length * distance(c, d));
    const samples = Math.ceil(length);
    for (let i = 0; i < samples; i++) {
      const t = (i + 0.5) / samples;
      const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const close = (!junction || distance(point, junction) >= junctionRadius) &&
        beside.some(segment => distanceToSegment(point, segment) < laneWidth);
      stretch = close ? stretch + length / samples : 0;
      longest = Math.max(longest, stretch);
    }
  }
  return longest;
}

test('points, roads and mileage are measured from a single planar survey', () => {
  const points = data.regions.map(({ id }) => atlasLocation(id));
  assert.equal(points.length, 60);
  assert.equal(new Set(points.map(String)).size, 60);
  for (const [index, road] of maps.entries()) {
    assert.deepEqual(road.survey[0], atlasLocation(road.from));
    assert.deepEqual(road.survey.at(-1), atlasLocation(road.to));
    const length = segments(road).reduce((sum, [[x, y], [u, v]]) => sum + Math.hypot(u - x, v - y), 0);
    assert.ok(Math.abs(length / atlasGeography.step - road.units) <= 0.5, `${road.key}: survey disagrees with mileage`);
    assert.equal(road.days, road.units * transportRules.roadUnitDays);
    for (const other of maps.slice(index + 1)) {
      const intersection = segments(road).some(([a, b]) => segments(other).some(([c, d]) =>
        cross(a, b, c) * cross(a, b, d) < -1e-8 && cross(c, d, a) * cross(c, d, b) < -1e-8));
      assert.equal(intersection, false, `${road.key} and ${other.key} cross away from a shared junction`);
    }
  }
  assert.deepEqual(view(createGame(5)).world.points.map(({ id }) => id), ['village', 'marsh']);
});

test('both ends of each cross-province path point to the same real border crossing', () => {
  const pairs = new Map();
  for (const { from, to, survey, key, cross: border, days } of maps.filter((edge) => edge.cross)) {
    const a = atlasBorderRoad(survey, province(from)).at(-1);
    const b = atlasBorderRoad([...survey].reverse(), province(to)).at(-1);
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-7, `${key}: two different border stations`);
    const pair = [province(from), province(to)].sort().join('|');
    const entries = pairs.get(pair) ?? [];
    entries.push({ days, guarded: Boolean(border.guarded) });
    pairs.set(pair, entries);
  }
  for (const entries of pairs.values()) {
    assert.equal(entries.length, 2);
    entries.sort((a, b) => a.days - b.days);
    assert.ok(entries[0].guarded && !entries[1].guarded);
    assert.ok(entries[0].days < entries[1].days);
  }
});

test('roads that share a junction visibly separate, and the ferry reach follows the old channel', () => {
  for (const { id } of data.regions) {
    const origin = atlasLocation(id);
    const outgoing = maps.filter(({ from, to }) => from === id || to === id)
      .map((edge) => ({ key: edge.key, tip: edge.from === id ? edge.survey[1] : edge.survey.at(-2) }));
    for (const [index, { key, tip }] of outgoing.entries()) {
      const [dx, dy] = [tip[0] - origin[0], tip[1] - origin[1]];
      for (const other of outgoing.slice(index + 1)) {
        const [ux, uy] = [other.tip[0] - origin[0], other.tip[1] - origin[1]];
        const cosine = (dx * ux + dy * uy) / (Math.hypot(dx, dy) * Math.hypot(ux, uy));
        assert.ok(cosine < Math.cos(22 * Math.PI / 180), `${key} and ${other.key} nearly trace the same road`);
      }
    }
  }
  assert.ok(!maps.some(({ key }) => key === 'ford|willow_post'));
  const state = createGame(5);
  state.region = 'ford';
  state.discovered.push('ford', 'pine_ridge', 'lantern_court', 'fish_ladder', 'willow_post');
  const journey = view(state).world.journeys.find(({ id }) => id === 'willow_post');
  assert.deepEqual(journey.path, ['ford', 'pine_ridge', 'lantern_court', 'fish_ladder', 'willow_post']);
});

test('roads do not trace the same corridor beyond a shared junction in any province', () => {
  for (const [index, road] of maps.entries()) {
    for (const other of maps.slice(index + 1)) {
      const shared = [road.from, road.to].find(id => id === other.from || id === other.to);
      const junction = shared ? atlasLocation(shared) : null;
      assert.ok(Math.max(longestCloseStretch(road, other, junction), longestCloseStretch(other, road, junction)) < 8,
        `${road.key} and ${other.key} follow the same corridor`);
    }
  }
});

test('shared trails go through actual stops in each province', () => {
  const routes = [
    ['marsh', 'ridge', 'ford'],
    ['kiln_valley', 'herb_basin', 'screen_slope'],
    ['charcoal_ridge', 'zhao_hermit', 'burnt_weir'],
    ['glass_bank', 'beacon_reefs', 'burnt_weir'],
    ['sand_bell_cloister', 'chalk_hoof_trail', 'salt_ledger_barrows'],
    ['wind_slate', 'dry_sound_bridge', 'cold_kiln'],
    ['silk_tent_road', 'guest_mill', 'camel_grass_dunes'],
  ];
  for (const [from, via, to] of routes) {
    const state = createGame(5);
    state.region = from;
    state.discovered.push(from, via, to);
    state.inventory.ration = 8;
    const journey = view(state).world.journeys.find(({ id }) => id === to);
    assert.deepEqual(journey?.path, [from, via, to], `${from} must run through ${via}`);
    assert.ok(journey.available);
  }
});

test('starter supply roads are protected but Gray Gully patrols a real outer ring', () => {
  const { roads } = data.roadBandits;
  const risk = new Map(roads.map(({ a, b, chance }) => [[a, b].sort().join('|'), chance]));
  for (const road of maps.filter(({ from, to, cross: border }) => border?.guarded ||
    [from, to].some((id) => ['village', 'marsh', 'reed_meadows', 'zhao_city', 'mingsha_city'].includes(id)))) {
    assert.equal(risk.get(road.key) ?? 0, 0, `${road.key} risks a starter route or guarded street`);
  }
  const gray = roads.filter(({ crew }) => crew === 'grey_gully');
  assert.ok(gray.length >= 5);
  assert.ok(new Set(gray.flatMap(({ a, b }) => [a, b])).size >= 5);
  const approaches = gray.map(({ a, b, chance }) => {
    const { units } = maps.find(({ key }) => [a, b].sort().join('|') === key);
    return { mean: units * chance, oneOrMore: 1 - (1 - chance) ** units };
  });
  assert.ok(approaches.filter(({ oneOrMore }) => oneOrMore > 0.5).length >= 3);
  assert.ok(approaches.every(({ mean }) => mean < 2));
});
