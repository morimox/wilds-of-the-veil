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

test('starter supply roads are protected but Gray Gully patrols a real outer ring', () => {
  const { roads } = data.roadBandits;
  const risk = new Map(roads.map(({ a, b, chance }) => [[a, b].sort().join('|'), chance]));
  for (const road of maps.filter(({ from, to, cross: border }) => border?.guarded ||
    [from, to].some((id) => ['village', 'marsh', 'reed_meadows', 'zhao_city', 'mingsha_city'].includes(id)))) {
    assert.equal(risk.get(road.key) ?? 0, 0, `${road.key} risks a starter route or guarded street`);
  }
  const gray = roads.filter(({ crew }) => crew === 'grey_gully');
  assert.ok(gray.length >= 7);
  const approaches = gray.map(({ a, b, chance }) => {
    const { units } = maps.find(({ key }) => [a, b].sort().join('|') === key);
    return { mean: units * chance, oneOrMore: 1 - (1 - chance) ** units };
  });
  assert.ok(approaches.filter(({ oneOrMore }) => oneOrMore > 0.5).length >= 3);
  assert.ok(approaches.every(({ mean }) => mean < 2));
});
