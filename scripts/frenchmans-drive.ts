/** Drive Episode 4 with its real starting load, cargo, weather and fuel. Usage: npx vite-node scripts/frenchmans-drive.ts [vehicle|all] */
import { frenchmansEpisode as E } from '../src/data/episodes/frenchmans';
import { frenchmansMap } from '../src/data/episodes/frenchmansMap';
import { frenchmansLegs } from '../src/data/episodes/frenchmansRoute';
import { trailers } from '../src/data/trailers';
import { vehicleOrder, vehicles, isVehicleId } from '../src/data/vehicles';
import { episodeWeatherAt } from '../src/data/weatherTimeline';
import { applyCheckpoint, EpisodeRun, startCheckpoint } from '../src/sim/episode';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { prepareFlood } from '../src/sim/world/flood';
import { buildWorld } from '../src/sim/world/world';
import { pathFor, WinchRecovery } from '../tests/helpers/drive';
import { clockTime } from '../src/data/episodes';
import { headingOf } from '../src/sim/vehicle/math';
import { trailProgress } from '../src/sim/world/crawlTrail';

const choice = process.argv[2] ?? 'shortie';
const reckless = process.argv.includes('reckless');
const onlyLeg = process.argv.find((arg) => arg.startsWith('--leg='))?.slice(6);
const legs = frenchmansLegs.filter(([id]) => !onlyLeg || id === onlyLeg);
if (!legs.length) throw new Error(`Unknown leg ${onlyLeg}`);
const ids = choice === 'all' ? vehicleOrder : isVehicleId(choice) ? [choice] : [];
if (!ids.length) throw new Error(`Unknown vehicle ${choice}`);
const world = buildWorld(frenchmansMap);
prepareFlood(world, E.storm!);
const R = await loadRapier();
const DT = 1 / 60;
let failed = false;
for (const id of ids) {
  const tuning = vehicles[id].tuning;
  const sim = new Simulation(R, world, episodeWeatherAt(E.startHour, E.weather, E.storm).env);
  const first = world.features.tracks.find((t) => t.def.id === legs[0][0])!;
  const path = pathFor(first);
  const pose = onlyLeg
    ? sim.poseAt(
        path[0][0],
        path[0][1],
        headingOf(path[1][0] - path[0][0], path[1][1] - path[0][1]),
        tuning.wheelRadius,
      )
    : sim.campsitePose(frenchmansMap.spawnCampsite, tuning.wheelRadius);
  const v = sim.addVehicle('p', pose, tuning);
  sim.setDamage('mild');
  sim.fuelScale = E.fuelScale;
  const cp = startCheckpoint(E, frenchmansMap.spawnCampsite, id, 1);
  applyCheckpoint(v, cp);
  const run = new EpisodeRun(E, cp, !onlyLeg);
  const t = sim.addTrailer('delivery', trailers[tuning.hitch ? 'no5' : 'box6x4'], 'p');
  t.loadDrums(2);
  const inputs = new Map([['p', { ...emptyInput(), handbrake: true }]]);
  let steps = 0;
  let maxTilt = 0;
  let maxStrain = 0;
  let maxWater = 0;
  let burned = 0;
  let lastFuel = v.condition.fuel;
  const step = () => {
    sim.step(inputs, DT);
    run.tick(DT);
    burned += Math.max(0, lastFuel - v.condition.fuel);
    lastFuel = v.condition.fuel;
    if (process.env.EP4_TRACE && Math.floor(t.tiltDeg() / 10) > Math.floor(maxTilt / 10)) {
      console.log(
        'TILT',
        t.tiltDeg().toFixed(1),
        'car',
        v.body.translation(),
        'trailer',
        t.body.translation(),
        'speed',
        v.speed,
        'wheels',
        t.wheels.map((w) => ({
          contact: w.contact,
          load: w.load,
          point: w.contactPoint,
          suspension: w.suspension,
        })),
        'angle',
        t.hitchAngleDeg(),
      );
    }
    maxTilt = Math.max(maxTilt, t.tiltDeg());
    maxStrain = Math.max(maxStrain, t.strain);
    maxWater = Math.max(maxWater, ...v.wheels.map((w) => w.water));
    if (++steps % 120 === 0) {
      const w = episodeWeatherAt(run.hour, E.weather, E.storm);
      sim.setWeather(w.env, w.creekRise, w.flowScale);
    }
  };
  for (let i = 0; i < 120; i++) step();
  let finished = true;
  for (const [trackId, speed] of legs) {
    const track = world.features.tracks.find((x) => x.def.id === trackId)!;
    const path = pathFor(track).map((p, i, points): [number, number] => {
      if (trackId !== 'heath-ridge' || reckless || process.argv.includes('--centre')) return p;
      const s = i * 0.5;
      const offset = 0.65 * Math.max(0, Math.min(1, (s - 50) / 25, (230 - s) / 25));
      const next = points[Math.min(i + 1, points.length - 1)];
      const dx = next[0] - p[0],
        dz = next[1] - p[1];
      const length = Math.hypot(dx, dz) || 1;
      return [p[0] - (dz * offset) / length, p[1] + (dx * offset) / length];
    });
    const pilot = new Autopilot(
      path,
      reckless ? 9 : tuning.hitch ? Math.min(speed, id === 'unimog' ? 2.5 : 3.5) : speed,
    );
    pilot.lowRange = !reckless && speed <= 2.8;
    v.precisionCrawl = false;
    pilot.holdLowOnClimbs = true;
    const needsLockers = ['heath-ridge', 'heath-gullies', 'wenlock-crossing', 'pascoe-crossing'].includes(
      trackId,
    );
    if (!needsLockers) {
      for (const axle of ['front', 'rear'] as const) if (v.differentials[axle]) v.toggleDiff(axle);
    }
    const recovery = new WinchRecovery(sim, v, path);
    let stalled = 0;
    let lastPosition = { ...v.position };
    for (let i = 0; i < 60 * 1200 && !pilot.done; i++) {
      if (!reckless && (trackId === 'heath-ridge' || trackId === 'heath-sideling')) {
        const along = trailProgress(track, v.position.x, v.position.z).along;
        const crawl = along > 65 && along < (trackId === 'heath-ridge' ? 225 : 190);
        v.precisionCrawl = crawl;
        pilot.targetSpeed = crawl ? speed : 3;
      }
      if (v.condition.fuel < 10 && sim.startRepair('p', true)) {
        inputs.set('p', { ...emptyInput(), brake: 1 });
        while (sim.toolsOf('p').repair) step();
        lastFuel = v.condition.fuel;
      }
      const cmd = pilot.input(v, DT);
      if (stalled > 2 || sim.toolsOf('p').winch.attached) cmd.winchIn = recovery.update(DT);
      if (pilot.lowRange && needsLockers && Math.abs(v.speed) < 1.3) {
        if (!v.differentials.front) v.toggleDiff('front');
        if (!v.differentials.rear) v.toggleDiff('rear');
      }
      inputs.set('p', cmd);
      step();
      if (i % 120 === 0) {
        stalled =
          Math.hypot(v.position.x - lastPosition.x, v.position.z - lastPosition.z) < 0.6 ? stalled + 2 : 0;
        lastPosition = { ...v.position };
      }
      if (stalled > 35 || v.swept > 5 || v.condition.fuel <= 0 || t.drums < 2 || run.hoursLeft() <= 0) break;
    }
    console.log(
      `${id} ${trackId}: ${pilot.done ? 'done' : 'STUCK'} ${clockTime(run.hour)} fuel=${v.condition.fuel.toFixed(1)} drums=${t.drums} tilt=${maxTilt.toFixed(1)} strain=${maxStrain.toFixed(2)} position=${v.position.x.toFixed(1)},${v.position.z.toFixed(1)} remaining=${pilot.remaining(v).toFixed(1)}`,
    );
    if (!pilot.done) {
      finished = false;
      break;
    }
  }
  const goal = world.pois.find((p) => p.id === E.goal)!;
  inputs.set('p', { ...emptyInput(), handbrake: true });
  for (let i = 0; i < 720; i++) {
    step();
    if (!onlyLeg && run.check(v, sim.damage, goal, sim.trailers.values()) === 'complete') break;
  }
  const status = run.status;
  console.log(
    JSON.stringify({
      vehicle: id,
      complete: finished && (onlyLeg ? t.drums === 2 && t.tiltDeg() < 25 : status === 'complete'),
      minutes: +(run.elapsed / 60).toFixed(1),
      arrival: clockTime(run.hour),
      fuelUsed: +burned.toFixed(1),
      drums: t.drums,
      maxTilt: +maxTilt.toFixed(1),
      maxWater: +maxWater.toFixed(2),
      maxStrain: +maxStrain.toFixed(2),
      parkedTilt: +t.tiltDeg().toFixed(1),
      parkedSpeed: +v.speed.toFixed(2),
      trailerSpeed: +Math.hypot(t.body.linvel().x, t.body.linvel().y, t.body.linvel().z).toFixed(2),
    }),
  );
  failed ||= !finished || (onlyLeg ? t.drums !== 2 || t.tiltDeg() >= 25 : status !== 'complete');
  sim.physics.free();
}
if (failed) process.exitCode = 1;
