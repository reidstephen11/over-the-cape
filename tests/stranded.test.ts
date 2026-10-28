import { describe, expect, it } from 'vitest';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { strandedPose } from '../src/sim/stranded';
import { buildWorld } from '../src/sim/world/world';

describe('stranded drivers', () => {
  it('sits beside its track, the side asked, nose to it', () => {
    const north: [number, number][] = [
      [0, 0],
      [0, -100],
    ];
    const base = { id: 'a', name: 'A', sink: 0.3, freeAfter: 5, breakout: 1, drag: 1, reward: {} };
    const right = strandedPose({ ...base, track: 't', at: 0.5, side: 'right', off: 8 }, north);
    expect(right.x).toBeCloseTo(8);
    expect(right.z).toBeCloseTo(-50);
    // East of a northbound track, it faces west back to it.
    expect(right.headingDeg).toBeCloseTo(-90);
    const left = strandedPose({ ...base, track: 't', at: 0.5, side: 'left', off: 8 }, north);
    expect(left.x).toBeCloseTo(-8);
    expect(left.headingDeg).toBeCloseTo(90);
  });

  it('puts the CREB’s stranded drivers within winch reach of the track, not down a drop', () => {
    const world = buildWorld(crebMap);
    for (const d of crebEpisode.stranded ?? []) {
      const track = crebMap.tracks.find((t) => t.id === d.track)!;
      const points = track.points.map(([x, z]) => [x, z] as const);
      const p = strandedPose(d, points);
      const onTrack = strandedPose({ ...d, off: 0 }, points);
      const drop = world.terrain.heightAt(onTrack.x, onTrack.z) - world.terrain.heightAt(p.x, p.z);
      expect(Math.abs(drop)).toBeLessThan(2.5);
    }
  });
});
