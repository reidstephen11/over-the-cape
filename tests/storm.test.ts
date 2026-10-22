import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { perentieTuning } from '../src/data/perentie';
import { surfaceGrip, SurfaceId } from '../src/data/surfaces';
import { vehicleTuning, type VehicleTuning } from '../src/data/vehicle';
import { episodeWeatherAt, weatherAt } from '../src/data/weatherTimeline';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { spreadCreekBanks } from '../src/sim/world/flood';
import { addPuddles } from '../src/sim/world/puddles';
import { NO_WATER } from '../src/sim/world/terrain';
import { buildWorld } from '../src/sim/world/world';
import { DT } from './helpers/drive';

const storm = crebEpisode.storm!;
const world = buildWorld(crebMap);
const start = episodeWeatherAt(crebEpisode.startHour, crebEpisode.weather, storm);
addPuddles(world, start.env);
// Water depth before the banks are spread, to check that spreading them changes nothing.
const depths = Array.from({ length: 4000 }, (_, k) => {
  const x = ((k * 37) % 1200) - 600 + 0.37;
  const z = ((k * 1201) % 6000) - 3000 + 0.61;
  return { x, z, depth: world.terrain.waterDepthAt(x, z, start.env.waterLevelOffset) };
});
const spread = spreadCreekBanks(world, storm.creeks.maxRise);

/** 3 pm, 4 pm, 5 pm (the autopilot's clean run reaches the Little Annan about then) and 5:45 pm. */
const at = (hour: number) => episodeWeatherAt(hour, crebEpisode.weather, storm);

/**
 * Drive across a crossing at a clock time: from 22 m before it to 40 m past, crawling in
 * low range with both lockers ('crawl') or at a steady 16 km/h in high range ('steady').
 */
async function cross(
  trackId: string,
  x: number,
  z: number,
  hour: number,
  tuning: VehicleTuning,
  how: 'crawl' | 'steady',
) {
  const w = at(hour);
  const sim = new Simulation(await loadRapier(), world, { ...w.env });
  sim.setWeather(w.env, w.creekRise, w.flowScale);
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  const mid = trailProgress(track, x, z).along;
  const path: [number, number][] = [];
  for (let s = mid - 22; s <= Math.min(track.poly.length, mid + 40); s += 0.5) {
    const p = trailPoint(track, s);
    path.push([p.x, p.z]);
  }
  const p0 = trailPoint(track, mid - 22);
  const v = sim.addVehicle('p', sim.poseAt(p0.x, p0.z, p0.headingDeg, tuning.wheelRadius), tuning);
  const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
  for (let i = 0; i < 90; i++) sim.step(inputs, DT);
  const crawl = how === 'crawl';
  if (crawl) {
    v.toggleRange();
    v.precisionCrawl = true;
  }
  const pilot = new Autopilot(path, crawl ? 1.2 : 4.5);
  pilot.lowRange = crawl;
  let swept = 0;
  let water = 0;
  try {
    for (let t = 0; t < 90 && !pilot.done && v.swept < 4; t += DT) {
      const cmd = pilot.input(v, DT);
      if (pilot.done) break;
      if (crawl) {
        cmd.throttle = 1;
        cmd.brake = 0;
        for (const axle of ['front', 'rear'] as const)
          if (!v.differentials[axle] && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
      }
      inputs.set('p', cmd);
      sim.step(inputs, DT);
      swept = Math.max(swept, v.swept);
      for (const wheel of v.wheels) water = Math.max(water, wheel.water);
    }
    return { across: pilot.done, swept, water, rise: w.creekRise };
  } finally {
    sim.physics.free();
  }
}

describe('the CREB storm', () => {
  it('starts dry, rains from 3 pm, heavily by 5 pm, and eases at dusk', () => {
    expect(weatherAt(storm, 14.9).rain).toBe(0);
    expect(weatherAt(storm, 15.5).rain).toBeGreaterThan(0.5);
    expect(weatherAt(storm, 17.25).rain).toBe(1);
    expect(weatherAt(storm, 18.5).rain).toBeLessThan(0.3);
    expect(weatherAt(storm, 19).rain).toBe(0);
    // The briefing warns of it and the HUD notes the first drops.
    expect(crebEpisode.briefing.join(' ')).toContain('Storms are forecast');
    expect(storm.notes[0].hour).toBe(15);
  });

  it('soaks the clay and raises the creeks the longer it rains', () => {
    const clay = (h: number) => surfaceGrip(SurfaceId.Clay, at(h).env.wetness);
    expect(at(crebEpisode.startHour).env.wetness).toBeCloseTo(0.7, 5);
    expect(clay(16.5)).toBeLessThan(clay(14.5) * 0.85);
    expect(clay(17.5)).toBeCloseTo(surfaceGrip(SurfaceId.Clay, 1), 1);
    expect(at(14.9).creekRise).toBe(0);
    let last = 0;
    for (let h = 15.25; h <= 18; h += 0.25) {
      const r = at(h).creekRise;
      expect(r, `at ${h}`).toBeGreaterThan(last);
      last = r;
    }
    expect(at(16).creekRise).toBeLessThan(0.1);
    expect(at(17).creekRise).toBeGreaterThan(0.12);
    expect(at(17).creekRise).toBeLessThan(0.18);
    expect(at(17.75).creekRise).toBeGreaterThan(0.2);
    expect(at(17.75).flowScale).toBeGreaterThan(1.4);
    // The sky and the rain follow it.
    expect(at(14.5).env.rain).toBe(0);
    expect(at(17.25).env.rain).toBe(1);
    expect(at(17.25).env.sun.intensity).toBeLessThan(environmentAt(17.25, 'wet').sun.intensity);
    // The puddles were laid for the after-rain creek offset, which stays.
    expect(at(17.25).env.waterLevelOffset).toBe(start.env.waterLevelOffset);
  });

  it('spreads the creeks over their low banks without wetting anything until they rise', () => {
    expect(spread).toBeGreaterThan(1000);
    for (const d of depths)
      expect(world.terrain.waterDepthAt(d.x, d.z, start.env.waterLevelOffset), `${d.x}, ${d.z}`).toBeCloseTo(
        d.depth,
        5,
      );
    // A risen creek's water stands only on creek cells: the mud holes keep their level.
    const t = world.terrain;
    const hole = world.features.mudHoles.find((b) => t.water[t.index(b.x, b.z)] > NO_WATER)!;
    expect(world.features.creekDistance[t.index(hole.x, hole.z)]).toBeGreaterThan(4);
  });

  for (const tuning of [vehicleTuning, perentieTuning]) {
    it(`the ${tuning.name} crawls over the Little Annan early and on schedule, and over Donovan's on schedule`, async () => {
      for (const hour of [15, 17]) {
        const r = await cross('bloomfield-track', 40, -2458, hour, tuning, 'crawl');
        expect(r.across, `at ${hour}: ${JSON.stringify(r)}`).toBe(true);
        expect(r.swept).toBeLessThan(1);
      }
      const d = await cross('donovans-creek', 64, -613, 16.1, tuning, 'crawl');
      expect(d.across, JSON.stringify(d)).toBe(true);
    }, 240_000);
  }

  it('makes the Little Annan harder late: at 5:45 pm the short-wheelbase 4WD crawling is swept away, but driven steadily it crosses', async () => {
    const early = await cross('bloomfield-track', 40, -2458, 15, vehicleTuning, 'crawl');
    const late = await cross('bloomfield-track', 40, -2458, 17.75, vehicleTuning, 'crawl');
    expect(late.water).toBeGreaterThan(early.water + 0.15);
    expect(late.across).toBe(false);
    expect(late.swept).toBeGreaterThanOrEqual(4);
    const steady = await cross('bloomfield-track', 40, -2458, 17.75, vehicleTuning, 'steady');
    expect(steady.across, JSON.stringify(steady)).toBe(true);
  }, 240_000);

  it('lets the heavier Land Rover crawl over the Little Annan late, in deeper water', async () => {
    const early = await cross('bloomfield-track', 40, -2458, 15, perentieTuning, 'crawl');
    const late = await cross('bloomfield-track', 40, -2458, 17.75, perentieTuning, 'crawl');
    expect(late.across, JSON.stringify(late)).toBe(true);
    expect(late.water).toBeGreaterThan(early.water + 0.15);
  }, 240_000);
});
