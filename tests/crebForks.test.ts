import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebForks } from '../src/data/episodes/crebForks';
import { crebMap } from '../src/data/episodes/crebMap';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { addPuddles } from '../src/sim/world/puddles';
import { buildWorld } from '../src/sim/world/world';
import { driveFork, driver, forkPaths } from './helpers/drive';

const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
// After the overnight rain, as in the game.
addPuddles(world, wet);
const { trackOf } = driver(world, wet);

describe('Episode 1: the forks on the CREB', () => {
  it('leaves and rejoins the main route level with it, at a sign, with a note on the map', () => {
    const t = world.terrain;
    for (const fork of crebForks) {
      const main = trackOf(fork.main);
      const alt = trackOf(fork.alt);
      const { from, to } = forkPaths(world, fork);
      for (const [s, end] of [
        [0, from],
        [alt.poly.length, to],
      ]) {
        const a = trailPoint(alt, s);
        const m = trailPoint(main, end);
        expect(Math.hypot(a.x - m.x, a.z - m.z), fork.id).toBeLessThan(0.5);
        expect(Math.abs(t.heightAt(a.x, a.z) - t.heightAt(m.x, m.z)), fork.id).toBeLessThan(0.3);
      }
      // One line is a good deal longer than the other.
      const [short, long] =
        fork.short === 'main' ? [to - from, alt.poly.length] : [alt.poly.length, to - from];
      expect(long, fork.id).toBeGreaterThan(short * 1.2);
      // A sign stands within sight of the fork, clear of both lines.
      const start = trailPoint(main, from);
      const sign = crebMap.props.find(
        (p) => p.kind === 'signpost' && Math.hypot(p.x - start.x, p.z - start.z) < 16,
      );
      expect(sign, fork.id).toBeDefined();
      for (const track of [main, alt])
        expect(trailProgress(track, sign!.x, sign!.z).distance, `${fork.id} sign`).toBeGreaterThan(
          track.def.width / 2 + 1,
        );
    }
    // Each is a place on the map, with a note on the choice.
    for (const id of ['ridge-bog', 'steep-shortcut', 'little-annan']) {
      expect(
        world.pois.some((p) => p.id === id),
        id,
      ).toBe(true);
      expect(crebEpisode.notes[id], id).toBeDefined();
    }
  });

  it('puts a deep bog on the main line past the saddle, and none on the chicken track', () => {
    const fork = crebForks.find((f) => f.id === 'chicken-track')!;
    const { from, to } = forkPaths(world, fork);
    const main = trackOf(fork.main);
    const deep = world.features.mudHoles.filter((b) => b.deep && b.id.startsWith(`${fork.main}-mud`));
    expect(
      deep.some((b) => {
        const s = trailProgress(main, b.x, b.z).along;
        return s > from && s < to;
      }),
    ).toBe(true);
    expect(world.features.mudHoles.filter((b) => b.id.startsWith('chicken-track'))).toEqual([]);
  });

  it('crosses the Little Annan on its bar at half the depth of the ford', () => {
    const t = world.terrain;
    const deepest = (id: string, from = 0, to = Infinity) => {
      const track = trackOf(id);
      let d = 0;
      for (let s = from; s <= Math.min(to, track.poly.length); s += 0.5) {
        const p = trailPoint(track, s);
        // Only the river, not the puddles in the mud holes.
        if (world.features.creekDistance[t.index(p.x, p.z)] < 12) d = Math.max(d, t.waterDepthAt(p.x, p.z));
      }
      return d;
    };
    const { from, to } = forkPaths(
      world,
      crebForks.find((f) => f.id === 'shallow-crossing')!,
    );
    const ford = deepest('bloomfield-track', from, to);
    const bar = deepest('shallow-crossing');
    expect(ford).toBeGreaterThan(0.5);
    expect(bar).toBeGreaterThan(0.15);
    expect(bar).toBeLessThan(ford * 0.65);
  });

  for (const fork of crebForks)
    for (const tuning of [vehicleTuning, perentieTuning])
      it(`drives both lines of the ${fork.id} fork in the wet in the ${tuning.name}`, async () => {
        const paths = forkPaths(world, fork);
        const main = await driveFork(world, wet, paths.main, tuning);
        const alt = await driveFork(world, wet, paths.alt, tuning);
        for (const [line, r] of [
          ['main', main],
          ['alt', alt],
        ] as const) {
          expect(r.done, `${line} stopped ${r.remaining.toFixed(0)} m short`).toBe(true);
          // Wet clay churned up under the wheels (v0.70) can slide a tyre onto a rock, once.
          expect(r.cuts, line).toBeLessThanOrEqual(1);
          expect(r.stalled, line).toBe(false);
        }
        const [short, long] = fork.short === 'main' ? [main, alt] : [alt, main];
        // The long way round needs the winch once at most, where the wet clay has churned up (v0.70)...
        expect(long.winched).toBeLessThanOrEqual(1);
        // ...but driven well, the short line is the quicker one.
        expect(short.time).toBeLessThan(long.time);
      }, 300_000);
});
