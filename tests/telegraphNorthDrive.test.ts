import { describe, expect, it } from 'vitest';
import { hiluxTuning } from '../src/data/hilux';
import { lc79Tuning } from '../src/data/lc79';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import {
  CYPRESS_HOLES,
  CYPRESS_SPAN,
  NOLANS_MARKER,
  canalFarEdge,
} from '../src/data/episodes/telegraphNorthRoute';
import { troopyTuning } from '../src/data/troopy';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { along, drivePath, episodeDay, type Path } from './helpers/pathDrive';
import { telegraphNorthWorld } from './world';

/**
 * The northern Telegraph Track's obstacles driven (v2.17): each passes on the right line at
 * a crawl, in low range with both lockers, at 18 psi; each wrong line fails in its own way;
 * and Nolans Brook, which rises with the afternoon's rain, drowns an engine with no snorkel
 * once it is late.
 */
const world = telegraphNorthWorld();
const ep = telegraphNorthEpisode;
const dry = episodeDay(ep, 'dry');
const reopened = episodeDay(ep, 'reopened');
const wet = episodeDay(ep, 'wet');
const [b0] = CYPRESS_SPAN;
const H = CYPRESS_HOLES;

/** The bridge: left of the first hole, right of the second, then down the middle. */
const bridgeLine = (): Path =>
  along(world, [
    ['cypress-bridge', 0, b0 - 9],
    ['cypress-bridge', b0 - 5.5, b0 + H[0][1] + 3.5, -0.75],
    ['cypress-bridge', b0 + H[1][0] - 1, b0 + H[1][1] + 3, 0.3],
    ['cypress-bridge', b0 + H[2][0] - 1, 1e9],
  ]);
/** The long drive, keeping left of the bog. */
const longDriveLine = (): Path =>
  along(world, [
    ['long-drive', 0, 225],
    ['long-drive', 230, 270, -0.9],
    ['long-drive', 275, 1e9],
  ]);

const lines: Record<string, () => Path> = {
  canal: () => along(world, [['canal-creek', 0, 1e9]]),
  sam: () => along(world, [['sam-crossing', 0, 1e9]]),
  mistake: () => along(world, [['mistake-creek', 0, 1e9]]),
  cannibal: () => along(world, [['cannibal-crossing', 0, 1e9]]),
  cypress: bridgeLine,
  nolans: () => along(world, [['nolans-brook', 0, 1e9]]),
};
/** Straight across Nolans Brook, through the deep middle, and round to the way out. */
const nolansStraight = (): Path =>
  Array.from({ length: 201 }, (_, k) => [k < 150 ? 0 : (k - 150) * 0.35, -822 - k * 0.5] as [number, number]);
/**
 * Nolans Brook by its marks (v2.20): in, along the near bank in the shallows until level
 * with the rock, then straight across at the sign and out.
 */
const nolansByTheMarks = (): Path => {
  const x1 = NOLANS_MARKER[0];
  const corners: [number, number][] = [
    [0, -822],
    [0, -850],
    [3.5, -855.5],
    [x1 - 5, -857.5],
    [x1, -862.5],
    [x1, -891],
    [x1, -897.4],
    [17, -905],
    [13.5, -918],
    [10, -940],
  ];
  const path: [number, number][] = [];
  for (let k = 0; k + 1 < corners.length; k++) {
    const [ax, az] = corners[k];
    const [bx, bz] = corners[k + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5);
    for (let j = 0; j < n; j++) path.push([ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n]);
  }
  path.push(corners[corners.length - 1]);
  return path;
};
const SLOW = 300_000;

describe('the northern Telegraph Track on the right line', () => {
  for (const [name, tuning] of [
    ['short 40', vehicleTuning],
    ['LC79', lc79Tuning],
    ['Hilux', hiluxTuning],
  ] as const)
    for (const id of Object.keys(lines))
      it(
        `crawls ${id} in the ${name}`,
        async () => {
          const r = await drivePath(world, lines[id](), { tuning, day: dry, psi: 18 });
          expect(
            r.done,
            `stopped ${r.remaining.toFixed(1)} m short at ${r.at.map((v) => v.toFixed(0))}`,
          ).toBe(true);
          expect(r.rolled).toBe(false);
          expect(r.flooded).toBe(false);
          expect(r.engineLost).toBe(0);
        },
        SLOW,
      );

  it(
    'takes the Troop Carrier and the Unimog over the log bridge',
    async () => {
      for (const tuning of [troopyTuning, unimogTuning]) {
        const r = await drivePath(world, bridgeLine(), { tuning, day: dry, psi: 18 });
        expect(r.done, tuning.name).toBe(true);
      }
    },
    SLOW,
  );

  it(
    'crosses Nolans Brook on time on every day, even with the lowest intake (the Hilux)',
    async () => {
      for (const day of [dry, reopened, wet]) {
        const r = await drivePath(world, lines.nolans(), { tuning: hiluxTuning, day, psi: 18 });
        expect(r.done, `rise ${day.creekRise}`).toBe(true);
        expect(r.flooded).toBe(false);
        // The current never has the car on the line (the game ends a run at 4 s).
        expect(r.swept).toBeLessThan(2);
      }
    },
    SLOW,
  );

  it(
    'crosses Nolans Brook by its marks: along the bank to the rock, then straight at the sign',
    async () => {
      for (const [tuning, day] of [
        [vehicleTuning, reopened],
        [hiluxTuning, wet],
      ] as const) {
        const r = await drivePath(world, nolansByTheMarks(), { tuning, day, psi: 18 });
        expect(r.done, `${tuning.name}: stopped at ${r.at.map((v) => v.toFixed(0))}`).toBe(true);
        expect(r.flooded).toBe(false);
        expect(r.swept).toBeLessThan(2);
      }
    },
    SLOW,
  );

  it(
    'gets through the long drive’s sand at 18 psi, left of the bog, and not at road pressures',
    async () => {
      const soft = await drivePath(world, longDriveLine(), { mode: 'high', speed: 6, psi: 18, day: dry });
      expect(soft.done).toBe(true);
      const hard = await drivePath(world, longDriveLine(), {
        mode: 'high',
        speed: 6,
        psi: 36,
        day: dry,
        limit: 120,
      });
      expect(hard.done).toBe(false);
    },
    SLOW,
  );
});

describe('the northern Telegraph Track the wrong way', () => {
  it(
    'holds a wheel in the gullies across Canal Creek’s old exit',
    async () => {
      const path = along(world, [
        ['canal-creek', 0, canalFarEdge],
        ['canal-old-exit', 0, 1e9],
      ]);
      for (const tuning of [vehicleTuning, lc79Tuning]) {
        const r = await drivePath(world, path, { tuning, day: dry, psi: 18 });
        expect(r.done, tuning.name).toBe(false);
        // Stopped on the washed-out climb, short of the top.
        expect(r.at[1], tuning.name).toBeGreaterThan(593);
      }
    },
    SLOW,
  );

  it(
    'hangs the car in the washed-out hole on the right of Mistake Creek’s way in',
    async () => {
      const path = along(world, [
        ['mistake-creek', 0, 8],
        ['mistake-creek', 8, 30, 1.3],
        ['mistake-creek', 30, 1e9],
      ]);
      for (const tuning of [vehicleTuning, lc79Tuning]) {
        const r = await drivePath(world, path, { tuning, day: dry, psi: 18 });
        expect(r.done, tuning.name).toBe(false);
        expect(r.tilt, tuning.name).toBeGreaterThan(45);
      }
    },
    SLOW,
  );

  it(
    'drops a wheel through the log bridge down the middle, and held to the left past the first hole',
    async () => {
      const middle = along(world, [['cypress-bridge', 0, 1e9]]);
      const left = along(world, [
        ['cypress-bridge', 0, b0 - 9],
        ['cypress-bridge', b0 - 5.5, 1e9, -0.75],
      ]);
      for (const tuning of [vehicleTuning, unimogTuning]) {
        const r = await drivePath(world, middle, { tuning, day: dry, psi: 18 });
        expect(r.done, tuning.name).toBe(false);
      }
      const r = await drivePath(world, left, { day: dry, psi: 18 });
      expect(r.done).toBe(false);
      // Past the first hole, stopped at the second.
      expect(r.at[1]).toBeLessThan(-420);
    },
    SLOW,
  );

  it(
    'bogs in the middle of the long drive’s bog in high range',
    async () => {
      const path = along(world, [['long-drive', 200, 300]]);
      for (const tuning of [vehicleTuning, lc79Tuning]) {
        const r = await drivePath(world, path, { tuning, mode: 'high', speed: 6, day: reopened, psi: 18 });
        expect(r.done, tuning.name).toBe(false);
      }
    },
    SLOW,
  );

  it(
    'drowns or strands a car straight across Nolans Brook, snorkel or not',
    async () => {
      const stock = await drivePath(world, nolansStraight(), { day: dry, psi: 18 });
      expect(stock.done).toBe(false);
      expect(stock.water).toBeGreaterThan(1.4);
      const snorkel = await drivePath(world, nolansStraight(), { tuning: lc79Tuning, day: dry, psi: 18 });
      expect(snorkel.done).toBe(false);
      expect(snorkel.water).toBeGreaterThan(2);
    },
    SLOW,
  );

  it(
    'drowns an engine with no snorkel on the shoal once the brook has risen, where a snorkel still crosses',
    async () => {
      // A slow run on the commonest day reaches Nolans Brook at 5:30 pm.
      const late = episodeDay(ep, 'reopened', 17.5);
      expect(late.creekRise).toBeGreaterThan(0.3);
      const stock = await drivePath(world, lines.nolans(), { tuning: hiluxTuning, day: late, psi: 18 });
      expect(stock.done).toBe(false);
      expect(stock.flooded).toBe(true);
      const snorkel = await drivePath(world, lines.nolans(), { tuning: lc79Tuning, day: late, psi: 18 });
      expect(snorkel.done).toBe(true);
      expect(snorkel.flooded).toBe(false);
    },
    SLOW,
  );

  it(
    'takes even a snorkelled car off the shoal at dark on the wettest day',
    async () => {
      const dark = episodeDay(ep, 'wet', 18.25);
      const r = await drivePath(world, lines.nolans(), { tuning: lc79Tuning, day: dark, psi: 18 });
      expect(r.done).toBe(false);
    },
    SLOW,
  );
});

describe('a clean run of the whole northern Telegraph Track', () => {
  it('drives from the turn-off to Nolans Brook camp in the short 40 on the fuel it carries', async () => {
    const route: Path = [
      ...along(world, [
        ['turnoff-road', 0, 1e9],
        ['canal-creek', 0, 1e9],
        ['canal-sam', 0, 1e9],
        ['sam-crossing', 0, 1e9],
        ['sam-mistake', 0, 1e9],
        ['mistake-creek', 0, 1e9],
        ['mistake-cannibal', 0, 1e9],
        ['cannibal-crossing', 0, 1e9],
        ['cannibal-cypress', 0, 1e9],
      ]),
      ...bridgeLine(),
      ...longDriveLine(),
      ...along(world, [['nolans-brook', 0, 1e9]]),
    ];
    const r = await drivePath(world, route, {
      mode: 'high',
      speed: 9,
      psi: 18,
      limit: 1500,
      giveUpAfter: 40,
      fuelScale: ep.fuelScale,
      day: reopened,
      crawlNear: [
        [0, 612, 34],
        [0, 100, 24],
        [0, -420, 34],
        [-10, -700, 16],
        [10, -868, 36],
      ],
    });
    expect(r.done, `stopped at ${r.at.map((v) => v.toFixed(0))}`).toBe(true);
    expect(r.flooded).toBe(false);
    const used = vehicleTuning.engine.fuel.tankLitres - r.fuel;
    // The load is a clean run and a margin.
    expect(used).toBeLessThan(ep.loadout.fuel * 0.85);
    expect(used).toBeGreaterThan(ep.loadout.fuel * 0.5);
  }, 1_500_000);
});
