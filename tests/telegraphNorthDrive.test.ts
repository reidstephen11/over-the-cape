import { describe, expect, it } from 'vitest';
import { hiluxTuning } from '../src/data/hilux';
import { lc79Tuning } from '../src/data/lc79';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import {
  CYPRESS_HOLES,
  CYPRESS_SPAN,
  ELIOT_STOP,
  ELIOT_TURNOFF,
  FRUIT_BAT_FORK,
  FRUIT_BAT_STOP,
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
/** Points every half metre along straight legs between corners. */
const legs = (corners: readonly (readonly [number, number])[]): [number, number][] => {
  const path: [number, number][] = [];
  for (let k = 0; k + 1 < corners.length; k++) {
    const [ax, az] = corners[k];
    const [bx, bz] = corners[k + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5);
    for (let j = 0; j < n; j++) path.push([ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n]);
  }
  path.push([...corners[corners.length - 1]] as [number, number]);
  return path;
};
/**
 * Out along a side track to its stop, round in a half circle 6 m in radius to the north of
 * it, and back along the track (stage 2, v2.21).
 */
const outAndBack = (id: string, [ex, ez]: readonly [number, number], backTo = 0): Path => {
  const length = world.features.tracks.find((x) => x.def.id === id)!.poly.length;
  const turn: [number, number][] = [];
  for (let a = 0; a <= 180; a += 5) {
    const r = (a * Math.PI) / 180;
    turn.push([ex + 6 * Math.sin(r), ez - 6 + 6 * Math.cos(r)]);
  }
  const back = along(world, [[id, length - 26, backTo]]);
  // The autopilot is done within 2.5 m of the path's last point, wherever it is on the way:
  // a path that stops short of the fork ends 6 m off the track, where the way out never goes.
  const end = backTo > 0 ? along(world, [[id, backTo - 8, backTo - 8, 6]]) : [];
  return [
    ...along(world, [[id, 0, length]]),
    ...turn,
    ...legs([turn[turn.length - 1], back[0]]),
    ...back,
    ...(end.length ? legs([back[back.length - 1], end[0]]) : []),
  ];
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
    'slows a snorkelled car to a crawl of a crawl on the soft bed beside the shoal, and nearly stops it at road pressures (v2.22)',
    async () => {
      // In, then straight across 9 m downstream of the right line: off the shoal from 15 m out,
      // in 1.35 m of water an LC79 can breathe in, over the soft bed all the way.
      const offShoal: Path = Array.from(
        { length: 160 },
        (_, k) => [k < 56 ? 0 : Math.min(7, (k - 56) * 0.5), -822 - k * 0.5] as [number, number],
      );
      const right = await drivePath(world, lines.nolans(), {
        tuning: lc79Tuning,
        day: dry,
        psi: 18,
        limit: 400,
      });
      expect(right.done).toBe(true);
      const aired = await drivePath(world, offShoal, { tuning: lc79Tuning, day: dry, psi: 18, limit: 400 });
      expect(aired.done).toBe(true);
      expect(aired.flooded).toBe(false);
      // 80 m of path against the right line's 118 m, and it takes over half as long again.
      expect(aired.time).toBeGreaterThan(right.time * 1.5);
      // At road pressures the same line is not finished in 250 s (25 m of soft bed).
      const hard = await drivePath(world, offShoal, { tuning: lc79Tuning, day: dry, psi: 36, limit: 250 });
      expect(hard.done).toBe(false);
      expect(hard.water).toBeGreaterThan(1.2);
    },
    SLOW,
  );

  it(
    'drowns or strands a car straight across Nolans Brook, snorkel or not',
    async () => {
      const stock = await drivePath(world, nolansStraight(), { day: dry, psi: 18 });
      expect(stock.done).toBe(false);
      // It stops in the middle's 1.35 m and more (since v2.22 the soft bed holds it short of the holes).
      expect(stock.water).toBeGreaterThan(1.3);
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

describe('the falls side tracks (stage 2)', () => {
  for (const [id, stop] of [
    ['fruit-bat-track', FRUIT_BAT_STOP],
    ['eliot-track', ELIOT_STOP],
  ] as const)
    it(
      `drives ${id} out to its stop and back in high range`,
      async () => {
        const r = await drivePath(world, outAndBack(id, stop, 40), {
          mode: 'high',
          speed: 8,
          psi: 18,
          limit: 400,
          day: reopened,
          crawlNear: [[stop[0], stop[1] - 6, 9]],
        });
        console.log(`${id}: out and back in ${r.time.toFixed(0)} s`);
        expect(r.done, `stopped at ${r.at.map((v) => v.toFixed(0))}`).toBe(true);
        // Not done on the spot: it went out and came back.
        expect(r.time).toBeGreaterThan(40);
        expect(r.time).toBeLessThan(240);
        expect(r.rolled).toBe(false);
        expect(r.flooded).toBe(false);
        expect(r.water).toBeLessThan(0.05);
      },
      SLOW,
    );
});

describe('a clean run of the whole northern Telegraph Track', () => {
  it('still fits both falls into the fuel it carries', async () => {
    const r = await drivePath(
      world,
      [
        ...along(world, [['turnoff-road', 0, FRUIT_BAT_FORK]]),
        ...outAndBack('fruit-bat-track', FRUIT_BAT_STOP),
        ...along(world, [['turnoff-road', FRUIT_BAT_FORK, ELIOT_TURNOFF]]),
        ...outAndBack('eliot-track', ELIOT_STOP),
        ...along(world, [
          ['turnoff-road', ELIOT_TURNOFF, 1e9],
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
      ],
      {
        mode: 'high',
        speed: 9,
        psi: 18,
        limit: 2000,
        giveUpAfter: 40,
        fuelScale: ep.fuelScale,
        day: reopened,
        crawlNear: [
          [FRUIT_BAT_STOP[0], FRUIT_BAT_STOP[1] - 6, 9],
          [ELIOT_STOP[0], ELIOT_STOP[1] - 6, 9],
          [0, 612, 34],
          [0, 100, 24],
          [0, -420, 34],
          [-10, -700, 16],
          [10, -868, 36],
        ],
      },
    );
    expect(r.done, `stopped at ${r.at.map((v) => v.toFixed(0))}`).toBe(true);
    expect(r.flooded).toBe(false);
    const used = vehicleTuning.engine.fuel.tankLitres - r.fuel;
    console.log(`with both falls: ${used.toFixed(1)} L in ${(r.time / 60).toFixed(1)} min`);
    // Both falls and the route fit in the 16 L, with less to spare than a straight run.
    expect(used).toBeLessThan(ep.loadout.fuel * 0.97);
    expect(used).toBeGreaterThan(ep.loadout.fuel * 0.7);
  }, 2_000_000);

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
