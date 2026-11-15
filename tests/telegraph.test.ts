import { describe, expect, it } from 'vitest';
import { episodes } from '../src/data/episodes';
import { telegraphEpisode } from '../src/data/episodes/telegraph';
import { telegraphMap } from '../src/data/episodes/telegraphMap';
import { bertiePits } from '../src/data/episodes/telegraphRoute';
import { maps } from '../src/data/maps';
import { conditionById, conditionFor } from '../src/data/trackConditions';
import { weatherAt } from '../src/data/weatherTimeline';
import { scoreRun } from '../src/sim/runScore';
import { createCondition } from '../src/sim/vehicle/condition';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { steepest } from './helpers/drive';
import { planSurprises } from '../src/sim/world/surprisePlan';
import { segmentDistance } from '../src/sim/world/polyline';
import { telegraphWorld } from './world';

/** Episode 2, the Telegraph Track (v1.96): the map's layout and the episode's facts. */
const world = telegraphWorld();
const t = world.terrain;
const track = (id: string) => world.features.tracks.find((x) => x.def.id === id)!;

/** The main route, south to north, with each piece's direction along its points. */
const ROUTE: readonly (readonly [string, 1 | -1])[] = [
  ['bramwell-road', 1],
  ['palm-creek', 1],
  ['palm-ducie', 1],
  ['ducie-crossing', 1],
  ['ducie-sand', 1],
  ['the-sand', 1],
  ['sand-dulhunty', 1],
  ['dulhunty-ledges', -1],
  ['dulhunty-crossing', 1],
  ['dulhunty-bertie', 1],
  ['bertie-bed', 1],
  ['bertie-fork', 1],
  ['gunshot-approach', 1],
  ['gunshot-chute', 1],
];

describe('the Telegraph Track map', () => {
  it('is a 1 × 2 km strip in multiples of 256 m, with the camps inside the wall', () => {
    expect(telegraphMap.width).toBe(1024);
    expect(telegraphMap.length).toBe(2048);
    expect(maps.telegraph.def).toBe(telegraphMap);
    for (const p of telegraphMap.pois) {
      expect(Math.abs(p.x), p.id).toBeLessThan(telegraphMap.wall[0]);
      expect(Math.abs(p.z), p.id).toBeLessThan(telegraphMap.wall[1]);
    }
  });

  it('joins the route end to end, about 2 km from Bramwell Junction to Gunshot camp', () => {
    let length = 0;
    for (let k = 0; k < ROUTE.length; k++) {
      const [id, dir] = ROUTE[k];
      const a = track(id);
      length += a.poly.length;
      if (k === 0) continue;
      const [prevId, prevDir] = ROUTE[k - 1];
      const prev = track(prevId);
      const end = trailPoint(prev, prevDir > 0 ? prev.poly.length : 0);
      const start = trailPoint(a, dir > 0 ? 0 : a.poly.length);
      expect(Math.hypot(end.x - start.x, end.z - start.z), `${prevId} → ${id}`).toBeLessThan(0.5);
      // Level with each other where they meet.
      expect(
        Math.abs(t.heightAt(end.x, end.z) - t.heightAt(start.x, start.z)),
        `${prevId} → ${id}`,
      ).toBeLessThan(0.3);
    }
    expect(length).toBeGreaterThan(1900);
    expect(length).toBeLessThan(2400);
    const spawn = telegraphMap.pois.find((p) => p.id === telegraphMap.spawnCampsite)!;
    const goal = telegraphMap.pois.find((p) => p.id === telegraphEpisode.goal)!;
    const first = trailPoint(track('bramwell-road'), 0);
    const chute = track('gunshot-chute');
    const last = trailPoint(chute, chute.poly.length);
    expect(Math.hypot(first.x - spawn.x, first.z - spawn.z)).toBeLessThan(spawn.radius);
    expect(Math.hypot(last.x - goal.x, last.z - goal.z)).toBeLessThan(goal.radius);
  });

  it('puts the first obstacle about 300 m from the start and the one camp about 60% along', () => {
    expect(track('bramwell-road').poly.length).toBeGreaterThan(270);
    expect(track('bramwell-road').poly.length).toBeLessThan(330);
    const camps = telegraphMap.pois.filter((p) => p.kind === 'campsite').map((p) => p.id);
    expect(camps).toEqual(['bramwell-junction', 'dulhunty-camp', 'gunshot-camp']);
  });

  it('cuts every creek several metres below the plain, with steep banks at Palm Creek and Gunshot', () => {
    const plain = 40;
    for (const c of telegraphMap.creeks) {
      const mid = c.points.reduce((a, p) => (Math.abs(p.x) < Math.abs(a.x) ? p : a));
      expect(plain - (mid.water - mid.depth), c.id).toBeGreaterThan(2.5);
    }
    expect(steepest(track('palm-creek'), 8)).toBeGreaterThan(28);
    // The Chute: the ground falls more than 1.5 m in 3 m below the lip, under a band of rock.
    const chute = track('gunshot-chute');
    let fall = 0;
    for (let s = 0; s + 3 < 30; s += 0.5) {
      const a = trailPoint(chute, s),
        b = trailPoint(chute, s + 3);
      fall = Math.max(fall, t.heightAt(a.x, a.z) - t.heightAt(b.x, b.z));
    }
    expect(fall).toBeGreaterThan(1.5);
    expect(chute.def.stones?.some((st) => st.shape === 'ridge' && st.height >= 0.5)).toBe(true);
    // Out of Gunshot: a climb of 20° or more over 8 m.
    expect(steepest(chute, 8)).toBeGreaterThan(20);
  });

  it('keeps the line across Ducie shallow and the straight line deep', () => {
    const line = track('ducie-crossing');
    let deepest = 0;
    for (let s = 0; s < line.poly.length; s += 0.5) {
      const p = trailPoint(line, s);
      deepest = Math.max(deepest, t.waterDepthAt(p.x, p.z));
    }
    expect(deepest).toBeLessThan(0.75);
    expect(t.waterDepthAt(4, 255)).toBeGreaterThan(1);
  });

  it('digs Bertie’s holes beside the line, one between the wheels, and shows each as deeper water', () => {
    const bed = track('bertie-bed');
    expect(bed.def.erosion).toBe(bertiePits);
    const between = bertiePits.filter((p) => p.path[0][1] === 0);
    expect(between).toHaveLength(1);
    expect(between[0].width / 2).toBeLessThan(0.55);
    for (const pit of bertiePits.filter((p) => p.path[0][1] !== 0)) {
      // The hole's edge clears a wheel on the line (at 0.8 m, its tyre 0.15 m wide) by 0.3 m.
      expect(Math.abs(pit.path[0][1]) - pit.width / 2).toBeGreaterThanOrEqual(1.25);
      expect(pit.depth).toBeGreaterThanOrEqual(0.8);
      const at = (pit.path[0][0] + pit.path[1][0]) / 2;
      const p = trailPoint(bed, at, pit.path[0][1]);
      const q = trailPoint(bed, at, 0);
      expect(t.waterDepthAt(p.x, p.z) - t.waterDepthAt(q.x, q.z), `hole at ${at}`).toBeGreaterThan(0.15);
    }
  });

  it('crosses the sand washout with a gully, and offers a signed bypass round Gunshot', () => {
    const g = telegraphMap.gullies[0];
    const near = trailProgress(track('the-sand'), g.x, g.z);
    expect(near.distance).toBeLessThan(0.5);
    const bypass = track('gunshot-bypass');
    const fork = trailPoint(track('bertie-fork'), track('bertie-fork').poly.length);
    const a = trailPoint(bypass, 0);
    expect(Math.hypot(a.x - fork.x, a.z - fork.z)).toBeLessThan(0.5);
    const goal = telegraphMap.pois.find((p) => p.id === 'gunshot-camp')!;
    const b = trailPoint(bypass, bypass.poly.length);
    expect(Math.hypot(b.x - goal.x, b.z - goal.z)).toBeLessThan(goal.radius);
    expect(bypass.poly.length).toBeGreaterThan(400);
    expect(telegraphMap.props.some((p) => p.kind === 'signpost' && /bypass/.test(p.text ?? ''))).toBe(true);
  });

  it('stands a line of surviving telegraph poles, leaning and off the track', () => {
    const poles = telegraphMap.props.filter((p) => p.kind === 'powerPole');
    expect(poles.length).toBeGreaterThanOrEqual(8);
    for (const p of poles) expect(p.lean).toBeGreaterThan(0);
  });
});

describe('Gunshot’s three lines (v1.99)', () => {
  it('branches the Chute, the Staircase and the Slot from the top of the approach, all to the bed below', () => {
    const top = trailPoint(track('gunshot-approach'), track('gunshot-approach').poly.length);
    const chute = track('gunshot-chute');
    for (const id of ['gunshot-staircase', 'gunshot-slot']) {
      const line = track(id);
      const a = trailPoint(line, 0);
      expect(Math.hypot(a.x - top.x, a.z - top.z), id).toBeLessThan(0.5);
      // It ends on the bed run below the Chute, level with it.
      const b = trailPoint(line, line.poly.length);
      const on = trailProgress(chute, b.x, b.z);
      expect(on.distance, id).toBeLessThan(0.6);
      const q = trailPoint(chute, on.along);
      expect(Math.abs(t.heightAt(b.x, b.z) - t.heightAt(q.x, q.z)), id).toBeLessThan(0.3);
      // Down the 4 m bank steeply.
      expect(steepest(line, 4), id).toBeGreaterThan(30);
    }
    const stair = track('gunshot-staircase');
    expect(stair.def.stones?.filter((st) => st.shape === 'ridge')).toHaveLength(2);
    expect(stair.def.cant?.some(([, deg]) => Math.abs(deg) >= 6)).toBe(true);
    const slot = track('gunshot-slot');
    expect(slot.def.width).toBeLessThan(3);
    const ruts = slot.def.erosion ?? [];
    expect(ruts.some((e) => e.depth > 0 && e.path[0][1] < 0)).toBe(true);
    expect(ruts.some((e) => e.depth < 0 && e.path[0][1] > 0)).toBe(true);
  });
});

describe('the old gauging station side trip (v2.00)', () => {
  it('runs off the main line above the Dulhunty to a hut with a jerry can at its end', () => {
    const side = track('gauging-track');
    const a = trailPoint(side, 0);
    const main = trailProgress(track('sand-dulhunty'), a.x, a.z);
    expect(main.distance).toBeLessThan(0.5);
    const find = telegraphMap.finds?.find((f) => f.id === 'gauging-can');
    expect(find?.gives).toEqual({ jerryCans: 1 });
    const end = trailPoint(side, side.poly.length);
    expect(Math.hypot(end.x - find!.x, end.z - find!.z)).toBeLessThan(find!.radius);
    expect(telegraphEpisode.notes['gauging-station']).toBeDefined();
    expect(side.def.stones?.filter((st) => st.shape === 'ridge').length).toBeGreaterThanOrEqual(2);
    expect(telegraphMap.props.some((p) => p.kind === 'signpost' && /Gauging/.test(p.text ?? ''))).toBe(true);
  });

  it('keeps a thicker gallery forest along the creeks than the woodland away from them', () => {
    let near = 0,
      far = 0;
    for (const tree of world.scatter.trees) {
      const i =
        Math.round(tree.z + telegraphMap.length / 2) * (telegraphMap.width + 1) +
        Math.round(tree.x + telegraphMap.width / 2);
      const d = world.features.creekDistance[i];
      if (d < 25) near++;
      else if (d > 80 && d < 200) far++;
    }
    // Per unit of area: the strip within 25 m of the water against the band 80–200 m out.
    expect(near / 25).toBeGreaterThan((far / 120) * 1.5);
  });
});

describe('the Telegraph Track episode', () => {
  it('is episode 2 on its own map, open from the start, with a lean load and one camp', () => {
    expect(episodes.telegraph).toBe(telegraphEpisode);
    expect(telegraphEpisode.number).toBe(2);
    expect(telegraphEpisode.mapId).toBe('telegraph');
    expect(telegraphEpisode.loadout.jerryCans).toBe(0);
    expect(telegraphEpisode.loadout.spares).toBe(1);
    expect(telegraphEpisode.loadout.plugs).toBe(2);
    expect(telegraphEpisode.briefing.length).toBeLessThanOrEqual(4);
    // A note for every place on the map.
    for (const p of telegraphMap.pois)
      if (p.id !== 'gunshot-camp') expect(telegraphEpisode.notes[p.id], p.id).toBeDefined();
  });

  it('starts mid-afternoon with dark as the deadline, and a clean run uses about half the light', () => {
    const d = telegraphEpisode.deadline!;
    expect(telegraphEpisode.startHour).toBeGreaterThanOrEqual(14.5);
    // 13 real minutes of driving.
    const used = (13 * 60 * telegraphEpisode.clockRate) / 3600;
    const light = d.hour - telegraphEpisode.startHour;
    expect(used / light).toBeGreaterThan(0.4);
    expect(used / light).toBeLessThan(0.6);
  });

  it('sets its creeks by the rolled day: lower in the dry, higher and faster in the wet', () => {
    const storm = telegraphEpisode.storm!;
    const at = (id: 'dry' | 'reopened' | 'wet') => {
      const c = conditionFor(conditionById(id), telegraphEpisode.conditions);
      return weatherAt({ ...storm, creeks: { ...storm.creeks, standing: c.creekRise } }, 16);
    };
    const [dry, reopened, wet] = [at('dry'), at('reopened'), at('wet')];
    for (const w of [dry, reopened, wet]) {
      expect(Number.isFinite(w.creekRise)).toBe(true);
      expect(Number.isFinite(w.flowScale)).toBe(true);
      expect(w.rain).toBe(0);
    }
    expect(dry.creekRise).toBeLessThan(reopened.creekRise);
    expect(wet.creekRise).toBeGreaterThan(reopened.creekRise);
    expect(wet.flowScale).toBeGreaterThan(reopened.flowScale);
    expect(conditionFor(conditionById('wet'), telegraphEpisode.conditions).briefing).toMatch(/Ducie/);
  });

  it('sends a 4WD the other way, strands a driver for a small reward and drops a tree in the creek forest (v1.99)', () => {
    expect(telegraphEpisode.traffic?.map((x) => x.track)).toEqual(['palm-ducie']);
    const stranded = telegraphEpisode.stranded ?? [];
    expect(stranded).toHaveLength(1);
    const reward = stranded[0].reward;
    expect((reward.jerryCans ?? 0) + (reward.spares ?? 0)).toBe(0);
    expect(reward.plugs).toBe(1);
    for (let seed = 1; seed <= 8; seed++) {
      const plan = planSurprises(world, telegraphEpisode.surprises!, seed);
      expect(plan, `seed ${seed}`).toHaveLength(1);
      expect(plan[0].kind).toBe('treefall');
      // In the gallery forest by a creek: 22 m (the planner's clearance) to 60 m from its water.
      const near = telegraphMap.creeks.some((c) =>
        c.points.some((p, i) => {
          const q = c.points[i + 1];
          return q && segmentDistance(plan[0].x, plan[0].z, p.x, p.z, q.x, q.z).d < p.halfWidth + 60;
        }),
      );
      expect(near).toBe(true);
      expect(t.waterDepthAt(plan[0].x, plan[0].z)).toBe(0);
    }
  });

  it('takes a fixed share of the score for the bypass', () => {
    const base = {
      condition: createCondition(16),
      packed: telegraphEpisode.loadout,
      minutes: 13,
      hoursSpare: 1.5,
      targetMinutes: 30,
    };
    const clean = scoreRun(base);
    const bypass = telegraphEpisode.bypass!;
    const round = scoreRun({ ...base, penalties: [{ label: bypass.label, points: bypass.penalty }] });
    expect(clean.points - round.points).toBe(bypass.penalty);
    expect(round.medal).not.toBe('gold');
    expect(telegraphMap.pois.some((p) => p.id === bypass.poi)).toBe(true);
  });
});
