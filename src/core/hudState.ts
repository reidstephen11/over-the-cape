import type { ControllerType } from '../data/controllers';
import { glyphsFor } from '../data/controls';
import { defaultTouchDrive, type TouchDriveScheme } from '../data/touch';
import { floodTuning } from '../data/tools';
import type { Device } from '../sim/input/inputManager';
import type { VehicleTools } from '../sim/tools/tools';
import type { Vehicle } from '../sim/vehicle/vehicle';
import type { Trailer } from '../sim/trailer';
import type { CrawlCourseDef, CrawlTrailDef, PoiDef } from '../sim/world/mapTypes';
import type { TrackInfo } from '../sim/world/features';
import { trailProgress } from '../sim/world/crawlTrail';
import { headingOf } from '../sim/vehicle/math';
import type { CompassPoi, EpisodeHud, GateState, HudState, Prompt, TrailerHud } from '../ui/hud';
import type { RepairKind } from '../sim/tools/tools';
import type { GaugeState } from '../ui/crawlGauges';
import { penaltyPoints, type CrawlRun } from '../sim/crawlRuns';
import { rotate } from '../sim/vehicle/math';
import type { ToolMode } from './toolController';
import { isDamaged } from '../sim/vehicle/damage';

export interface HudInputs {
  vehicle: Vehicle;
  tools: VehicleTools;
  device: Device;
  controller?: ControllerType;
  touchDrive?: TouchDriveScheme;
  mode: ToolMode;
  cameraHeading: number;
  discovered: ReadonlySet<string>;
  pois: readonly PoiDef[];
  crawlCourses?: readonly CrawlCourseDef[];
  crawlTrails?: readonly CrawlTrailDef[];
  tracks?: readonly TrackInfo[];
  /** Is there a winch anchor in reach (checked a few times a second)? */
  anchorInReach: boolean;
  /** Scored crawl run in progress, if any. */
  run?: CrawlRun | null;
  /** Gate count on a map with a gate trail. */
  gates?: GateState | null;
  /** What a roadside repair could do now (null when nothing needs one or damage is off). */
  repair?: { kind: RepairKind; possible: boolean } | null;
  /** Pouring in a jerry can, when there's one to pour. */
  refuel?: { kind: RepairKind; possible: boolean } | null;
  /** The episode's mission and clock. */
  episode?: EpisodeHud | null;
  /** Something to load nearby (src/sim/finds.ts), and whether it is in reach. */
  find?: { name: string; inReach: boolean } | null;
  /** Show the fuel gauge and supplies (an episode is under way). */
  supplies?: boolean;
  /** A trailer to hitch or unhitch, and whether it can be done now. */
  hitch?: { kind: 'hitch' | 'unhitch'; possible: boolean } | null;
  /** The trailer on the back: its load, and whether it has come round against the car or tipped over. */
  trailer?:
    | (Pick<Trailer, 'jackknifed' | 'tipped' | 'drums' | 'mass' | 'load' | 'tuning'> &
        Partial<Pick<Trailer, 'strain' | 'tyres'>>)
    | null;
  /** Not towing: the nearest trailer standing unhitched, how far away (m) and whether it's over. */
  trailerLeft?: { distance: number; tipped: boolean } | null;
}

/** The HUD's trailer line: what's on the back and how it's going, or where it was left. */
export function trailerHud(towing: HudInputs['trailer'], left: HudInputs['trailerLeft']): TrailerHud | null {
  if (towing)
    return {
      name: towing.tuning.name,
      drums: towing.drums,
      kg: Math.round(towing.mass),
      limit: towing.tuning.mass + towing.tuning.payload,
      overloaded: towing.load.mass > towing.tuning.payload + 0.5,
      state: towing.tipped ? 'tipped' : towing.jackknifed ? 'jackknifed' : 'towing',
      distance: 0,
    };
  if (left)
    return {
      name: 'Trailer',
      drums: 0,
      kg: 0,
      limit: 0,
      overloaded: false,
      state: left.tipped ? 'tipped' : 'left',
      distance: left.distance,
    };
  return null;
}

/** What each roadside job says while it's under way, and as a prompt beforehand. */
const jobText: Record<RepairKind, [string, string]> = {
  field: ['Field repair', 'Field repair (tool menu)'],
  spare: ['Fitting a spare', 'Fit a spare (tool menu)'],
  plug: ['Plugging the tyre', 'Plug the tyre (tool menu)'],
  refuel: ['Pouring in a jerry can', 'Pour in a jerry can (tool menu)'],
  pump: ['Pumping the tyres up', 'Pump the tyres up (tool menu)'],
};

/** Build what the HUD shows this frame, including context prompts (SPEC §9). */
export function buildHudState(i: HudInputs): HudState {
  const g = glyphsFor(i.device, i.controller, i.touchDrive ?? defaultTouchDrive);
  const kb = i.device === 'keyboard';
  const touch = i.device === 'touch';
  const v = i.vehicle;
  const t = i.tools;
  const p = v.body.translation();
  const prompts: Prompt[] = [];
  const flood = v.condition.flood;
  const cond = v.condition;
  const wrecked = cond.engine <= 0;

  if (i.mode === 'plankPlace') {
    prompts.push(
      { keys: kb ? 'W / S' : touch ? 'Stick ↕' : 'L-stick ↕', text: 'Move planks' },
      { keys: kb ? 'A / D' : touch ? 'Stick ↔' : 'L-stick ↔', text: 'Turn planks' },
      { keys: g.confirm ?? 'E', text: 'Place planks' },
      { keys: g.back ?? 'Esc', text: 'Cancel' },
    );
  } else if (i.mode === 'winchTarget') {
    prompts.push(
      { keys: kb ? 'A / D' : touch ? 'Stick ↔' : 'D-pad ↔', text: 'Choose anchor' },
      { keys: g.confirm ?? 'E', text: 'Attach winch' },
      { keys: g.back ?? 'Esc', text: 'Cancel' },
    );
  } else {
    // Trying to drive off with the park brake on.
    if (v.parkBrake && v.throttle > 0.1)
      prompts.push({ keys: g.handbrake ?? 'Space', text: 'Release the handbrake' });
    if (t.jack.state === 'available')
      prompts.push({ keys: `Hold ${g.jack}`, text: 'Right vehicle', progress: t.jack.holdProgress });
    if (t.repair)
      prompts.push({
        keys: '…',
        text: jobText[t.repair.kind][0],
        progress: 1 - t.repair.remaining / t.repair.total,
      });
    else if (i.repair?.possible && Math.abs(v.speed) < 0.5)
      prompts.push({ keys: g.toolMenu ?? 'Q', text: jobText[i.repair.kind][1] });
    else if (cond.fuel <= 0 && i.refuel?.possible)
      prompts.push({ keys: g.toolMenu ?? 'Q', text: `Out of fuel — ${jobText.refuel[1].toLowerCase()}` });
    if (v.swept > 0)
      prompts.push({ keys: '!', text: 'The current is taking the car — get to shallow water' });
    else if (v.afloat > 0.25 && Math.hypot(v.current.x, v.current.z) > 0.3)
      prompts.push({ keys: '!', text: 'Deep, fast water — the current is lifting the car' });
    if (wrecked) prompts.push({ keys: '!', text: 'Engine wrecked' });
    else if (cond.fuel <= 0 && !t.repair) prompts.push({ keys: '!', text: 'Out of fuel' });
    else if (flood.stalled) {
      const wait = Math.ceil(floodTuning.restartDryTime - flood.dryTime);
      if (flood.submerged)
        prompts.push({ keys: '!', text: 'Engine flooded — get the air intake out of the water' });
      else if (wait > 0) prompts.push({ keys: '!', text: `Engine flooded — drying out (${wait} s)` });
      else prompts.push({ keys: g.accelerate ?? 'W', text: 'Restart engine' });
    } else if (flood.submerged)
      prompts.push({
        keys: '!',
        text: v.bowWave > 0.05 ? 'Bow wave at the air intake! Slow down' : 'Water at the air intake!',
      });
    else if (v.engineOff) prompts.push({ keys: g.accelerate ?? 'W', text: 'Start the engine' });
    if (i.find && !t.repair)
      prompts.push({
        keys: i.find.inReach ? 'Stop' : '!',
        text: i.find.inReach
          ? `Stop here to load the ${i.find.name.toLowerCase()}`
          : `${i.find.name} by the hut — pull up beside it`,
      });
    if (i.trailer?.tyres?.some((h) => h < 1))
      prompts.push({ keys: '!', text: 'Trailer tyre flat — stop and repair it in Tools' });
    if ((i.trailer?.strain ?? 0) >= 0.55)
      prompts.push({ keys: '!', text: 'Load straps loose — stop and tighten them in Tools' });
    if (i.trailer?.tipped) prompts.push({ keys: '!', text: 'The trailer has tipped over' });
    else if (i.trailer?.jackknifed)
      prompts.push({ keys: '!', text: 'Jackknifed — pull forward to straighten the trailer' });
    if (t.planks.inReach(v).length > 0) prompts.push({ keys: g.interact ?? 'E', text: 'Pick up planks' });
    else if (i.hitch?.kind === 'hitch')
      prompts.push(
        i.hitch.possible
          ? { keys: g.interact ?? 'E', text: 'Hitch the trailer' }
          : { keys: 'Stop', text: 'Stop to hitch the trailer' },
      );
    else if (t.winch.attached) {
      prompts.push({ keys: `${g.winchIn} / ${g.winchOut}`, text: 'Winch in / out' });
      prompts.push({ keys: g.winch ?? 'E', text: 'Detach winch' });
    } else if (i.anchorInReach && Math.abs(v.speed) < 1.5)
      prompts.push({ keys: g.winch ?? 'E', text: 'Attach winch' });
  }

  const pois: CompassPoi[] = [];
  for (const poi of i.pois) {
    if (!i.discovered.has(poi.id)) continue;
    const dx = poi.x - p.x;
    const dz = poi.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d > 400 || d < 8) continue;
    pois.push({ id: poi.id, kind: poi.kind, bearing: headingOf(dx, dz) });
  }

  let courseHint: HudState['courseHint'] = null;
  if (i.mode === 'drive')
    for (const course of i.crawlCourses ?? []) {
      const h = (course.headingDeg * Math.PI) / 180;
      const dx = p.x - course.x;
      const dz = p.z - course.z;
      const along = Math.sin(h) * dx - Math.cos(h) * dz;
      const across = Math.cos(h) * dx + Math.sin(h) * dz;
      const line = course.lines.find((line) => Math.abs(across - line.offset) < 2.5);
      if (!line || along < -6 || along > course.length + 4) continue;
      courseHint = {
        title: `${line.difficulty[0].toUpperCase()}${line.difficulty.slice(1)} · ${line.name}`,
        text: line.hint,
        controls:
          i.device === 'gamepad'
            ? `${g.range} low range · ${g.toolMenu} tools · ${g.toolMenu} + ${g.cameraReset} views`
            : touch
              ? 'LOW range · F / R LOCK · CRAWL · View'
              : `${g.range} low range · ${g.frontDiff} front · ${g.rearDiff} rear · ${g.precision} crawl · C views`,
      };
      break;
    }

  if (!courseHint && i.mode === 'drive') {
    // The nearest crawl trail, so where one obstacle ends and the next begins the hint
    // follows the one the car is on.
    const near = (i.crawlTrails ?? [])
      .flatMap((trail) =>
        (i.tracks ?? [])
          .filter((t) => t.def.id === trail.trackId || t.def.id === trail.bypassTrackId)
          .map((track) => ({ trail, track, ...trailProgress(track, p.x, p.z) })),
      )
      .sort((a, b) => a.distance - b.distance)[0];
    if (near && near.distance <= near.track.def.width / 2 + 1) {
      const trail = near.trail;
      const bypass = near.track.def.id === trail.bypassTrackId;
      const section = trail.sections.find((s) => near.along >= s.from && near.along <= s.to);
      courseHint = {
        title: bypass
          ? `Easy · ${trail.name} bypass`
          : `${trail.name} · ${section?.name ?? 'Technical trail'}`,
        text: bypass
          ? (trail.bypassHint ??
            'Follow the green markers for the wider gravel route between the trail exit and camp. Amber markers lead through the technical rocks.')
          : (section?.hint ?? 'Follow the amber markers. The green gravel bypass connects both ends.'),
        controls: kb
          ? 'L low range · P crawl · Z / X lockers · C views'
          : touch
            ? 'LOW range · CRAWL · F / R LOCK · View'
            : `${g.range} low range · ${g.toolMenu} tools · ${g.toolMenu} + ${g.cameraReset} views`,
      };
    }
  }

  if (!courseHint && i.mode === 'drive') {
    const link = (i.tracks ?? [])
      .filter((t) => t.def.routeHint)
      .map((track) => ({ track, ...trailProgress(track, p.x, p.z) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (link && link.distance < link.track.def.width / 2 + 1)
      courseHint = {
        title: link.track.def.name ?? '4WD Challenge Loop',
        text: link.track.def.routeHint!,
        controls: kb
          ? 'L low range · P crawl · C views'
          : touch
            ? 'LOW range · CRAWL · View'
            : `${g.range} low range · ${g.toolMenu} tools · ${g.toolMenu} + ${g.cameraReset} views`,
      };
  }

  return {
    gauges: gaugeState(v),
    episode: i.episode ?? null,
    trailer: trailerHud(i.trailer, i.trailerLeft),
    supplies: i.supplies
      ? {
          fuel: cond.fuel,
          tank: v.tuning.engine.fuel.tankLitres,
          jerryCans: cond.jerryCans,
          spares: cond.spares,
          plugs: cond.plugs,
          heat: cond.engineHeat ?? 0.5,
          lowPressure: !!cond.lowPressure,
          tyres: v.tuning.wheels.map((w, k) => ({
            inflation: cond.tyres[k],
            fault: cond.tyreFault[k],
            front: w.front,
            left: w.x < 0,
          })),
        }
      : null,
    gates: i.gates
      ? {
          next: i.gates.next,
          total: i.gates.total,
          passed: i.gates.passed,
          missed: i.gates.missed,
          flags: i.gates.flags,
        }
      : null,
    run: i.run ? { name: i.run.trail.name, seconds: i.run.seconds, points: penaltyPoints(i.run) } : null,
    heading: i.cameraHeading,
    pois,
    range: v.drivetrain.range,
    frontLocked: v.differentials.front,
    rearLocked: v.differentials.rear,
    precisionCrawl: v.precisionCrawl,
    parkBrake: v.parkBrake,
    lights: v.lights,
    courseHint,
    planksCarried: t.planks.carried,
    planksTotal: 2,
    winchAttached: t.winch.attached,
    engine: flood.stalled || wrecked ? 2 : flood.timer > 0 ? 1 : 0,
    damage: isDamaged(cond)
      ? {
          engine: cond.engine,
          corners: v.tuning.wheels.map((w, k) => ({
            health: Math.min(cond.tyres[k], cond.tyreTarget[k] < 1 ? 0.9 : 1, cond.suspension[k]),
            front: w.front,
            left: w.x < 0,
          })),
        }
      : null,
    prompts,
  };
}

/** Inclinometer, tyre loads and drivetrain readout for the crawl gauges. */
export function gaugeState(v: Vehicle): GaugeState {
  const q = v.body.rotation();
  const f = rotate(q, 0, 0, -1);
  const r = rotate(q, 1, 0, 0);
  const deg = 180 / Math.PI;
  const parked = (v.tuning.mass * 9.81) / 4;
  const d = v.drivetrain;
  return {
    pitch: Math.asin(Math.max(-1, Math.min(1, f.y))) * deg,
    roll: -Math.asin(Math.max(-1, Math.min(1, r.y))) * deg,
    speedKmh: Math.abs(v.speed) * 3.6,
    gear: d.gear < 0 ? 'R' : String(d.gear + 1),
    range: d.range,
    rpm: d.rpm,
    redline: v.tuning.engine.redlineRpm,
    wheels: v.wheels.map((w) => ({ load: w.load / parked, contact: w.contact, spin: w.spin })),
    frontLocked: v.differentials.front,
    rearLocked: v.differentials.rear,
    bodyContact: v.bodyContact.force > 0,
  };
}
