import { describe, expect, it } from 'vitest';
import { crebStorm } from '../src/data/episodes/crebWeather';
import { crebMap } from '../src/data/episodes/crebMap';
import {
  conditionById,
  mapForCondition,
  rollTrackCondition,
  stormFor,
  trackConditions,
  type TrackConditionId,
} from '../src/data/trackConditions';
import { weatherAt } from '../src/data/weatherTimeline';

describe('track conditions', () => {
  it('rolls the same day from the same seed, and all three come up', () => {
    for (const seed of [1, 7, 42, 1234, 99999])
      expect(rollTrackCondition(seed).id).toBe(rollTrackCondition(seed).id);
    const seen = new Set<TrackConditionId>();
    for (let seed = 1; seed <= 400; seed++) seen.add(rollTrackCondition(seed).id);
    expect([...seen].sort()).toEqual(['dry', 'reopened', 'wet']);
  });

  it('rolls each condition about as often as its weight says', () => {
    const counts: Record<string, number> = { dry: 0, reopened: 0, wet: 0 };
    const runs = 6000;
    for (let seed = 1; seed <= runs; seed++) counts[rollTrackCondition(seed).id]++;
    const total = trackConditions.reduce((t, c) => t + c.weight, 0);
    for (const c of trackConditions) expect(counts[c.id] / runs, c.id).toBeCloseTo(c.weight / total, 1);
  });

  it('leaves a just-reopened track exactly as the game had it before', () => {
    // v1.32's numbers are this condition's, so that roll must change nothing at all.
    const reopened = conditionById('reopened');
    expect(stormFor(crebStorm, reopened)).toEqual(crebStorm);
    expect(mapForCondition(crebMap, reopened)).toBe(crebMap);
  });

  it('scales the storm: drier rains less and wetter rains harder, and the rain is still capped', () => {
    const dry = stormFor(crebStorm, conditionById('dry'));
    const wet = stormFor(crebStorm, conditionById('wet'));
    const peak = (t: typeof crebStorm) => Math.max(...t.rain.map(([, a]) => a));
    expect(peak(dry)).toBeLessThan(peak(crebStorm));
    expect(peak(wet)).toBeLessThanOrEqual(1);
    expect(dry.ground.before).toBeLessThan(crebStorm.ground.before);
    expect(wet.ground.before).toBeGreaterThan(crebStorm.ground.before);
    expect(dry.creeks.maxRise).toBeLessThan(crebStorm.creeks.maxRise);
    expect(wet.creeks.maxRise).toBeGreaterThan(crebStorm.creeks.maxRise);
    // The shape of the afternoon is untouched: the storm still arrives at the same times.
    expect(wet.rain.map(([h]) => h)).toEqual(crebStorm.rain.map(([h]) => h));
    expect(wet.notes).toEqual(crebStorm.notes);
  });

  it('starts a wet track with its creeks already up and running, before a drop falls', () => {
    const wet = stormFor(crebStorm, conditionById('wet'));
    // 12:30 pm, the start, is well before the 3 pm rain.
    const before = weatherAt(wet, 12.5);
    expect(before.rain).toBe(0);
    expect(before.creekRise).toBeCloseTo(conditionById('wet').creekRise, 5);
    expect(before.flowScale).toBeGreaterThan(1);
    const dryStart = weatherAt(stormFor(crebStorm, conditionById('dry')), 12.5);
    expect(dryStart.creekRise).toBe(0);
    expect(dryStart.flowScale).toBe(1);
  });

  it('greases the clay in order: dry grips best, wet least, at the start and in the storm', () => {
    for (const hour of [12.5, 17]) {
      const wetness = (id: TrackConditionId) =>
        weatherAt(stormFor(crebStorm, conditionById(id)), hour).wetness;
      expect(wetness('dry'), `dry at ${hour}`).toBeLessThan(wetness('reopened'));
      expect(wetness('reopened'), `reopened at ${hour}`).toBeLessThan(wetness('wet'));
    }
  });

  it('digs the bogs deeper or shallower in the same places, and moves nothing else', () => {
    const bogged = (map: typeof crebMap) =>
      map.tracks.filter((t) => t.rough?.bogDepth !== undefined).map((t) => t.rough!.bogDepth!);
    const dry = mapForCondition(crebMap, conditionById('dry'));
    const wet = mapForCondition(crebMap, conditionById('wet'));
    expect(bogged(crebMap).length).toBeGreaterThan(0);
    expect(bogged(dry).length).toBe(bogged(crebMap).length);
    for (let i = 0; i < bogged(crebMap).length; i++) {
      expect(bogged(dry)[i]).toBeLessThan(bogged(crebMap)[i]);
      expect(bogged(wet)[i]).toBeGreaterThan(bogged(crebMap)[i]);
    }
    // The track itself is where it was: same ids, same points, same creeks.
    expect(dry.tracks.map((t) => t.id)).toEqual(crebMap.tracks.map((t) => t.id));
    expect(dry.tracks.map((t) => t.points.length)).toEqual(crebMap.tracks.map((t) => t.points.length));
    expect(dry.creeks).toBe(crebMap.creeks);
    // The other roughness of each track is untouched.
    for (let i = 0; i < crebMap.tracks.length; i++)
      expect({ ...dry.tracks[i].rough, bogDepth: 0, sumpDepth: 0 }).toEqual({
        ...crebMap.tracks[i].rough,
        bogDepth: 0,
        sumpDepth: 0,
      });
  });
});
