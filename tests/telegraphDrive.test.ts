import { describe, expect, it } from 'vitest';
import { lc79Tuning } from '../src/data/lc79';
import { telegraphEpisode } from '../src/data/episodes/telegraph';
import { telegraphMap } from '../src/data/episodes/telegraphMap';
import { troopyTuning } from '../src/data/troopy';
import { vehicleTuning } from '../src/data/vehicle';
import { along, drivePath, episodeDay, type Path } from './helpers/pathDrive';
import { telegraphWorld } from './world';

/**
 * The Telegraph Track's obstacles driven (v1.96): each passes on the right line at a crawl,
 * in low range with both lockers, in the short 40 and the LC79 in the dry; each fails in
 * high range with open diffs on a just-reopened day; and the ones the engine can make fail
 * on the wrong line do. Careful drivers let the tyres down to 18 psi at the junction.
 */
const world = telegraphWorld();
const dry = episodeDay(telegraphEpisode, 'dry');
const reopened = episodeDay(telegraphEpisode, 'reopened');
const washout = telegraphMap.gullies[0];

const lines: Record<string, () => Path> = {
  palm: () => along(world, [['palm-creek', 0, 75]]),
  palmWest: () =>
    along(world, [
      ['palm-creek', 0, 40],
      ['palm-west-exit', 2, 60],
    ]),
  ducie: () => along(world, [['ducie-crossing', 0, 121]]),
  dulhunty: () =>
    along(world, [
      ['sand-dulhunty', 140, 160],
      ['dulhunty-ledges', 17.6, 0],
      ['dulhunty-crossing', 0, 42],
    ]),
  bertie: () => along(world, [['bertie-bed', 0, 121]]),
  chute: () => along(world, [['gunshot-chute', 0, 90]]),
  staircase: () =>
    along(world, [
      ['gunshot-staircase', 0, 60],
      ['gunshot-chute', 30, 90],
    ]),
  slot: () =>
    along(world, [
      ['gunshot-slot', 0, 40],
      ['gunshot-chute', 46, 90],
    ]),
};
const SLOW = 300_000;

describe('the Telegraph Track on the right line', () => {
  for (const [name, tuning] of [
    ['short 40', vehicleTuning],
    ['LC79', lc79Tuning],
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
        },
        SLOW,
      );

  it(
    'bridges the washout on the sand with the planks, and stops at it without them',
    async () => {
      const path = along(world, [['the-sand', 130, 175]]);
      expect((await drivePath(world, path, { psi: 18, day: dry, planks: washout })).done).toBe(true);
      expect((await drivePath(world, path, { psi: 18, day: dry })).done).toBe(false);
    },
    SLOW,
  );
});

describe('the Telegraph Track the wrong way', () => {
  for (const id of ['palm', 'ducie', 'dulhunty', 'bertie', 'staircase', 'slot'])
    it(
      `stops ${id} in high range with open diffs`,
      async () => {
        const r = await drivePath(world, lines[id](), { mode: 'high', speed: 3, day: reopened });
        expect(r.done).toBe(false);
      },
      SLOW,
    );

  it(
    'turns the car over off the Chute taken fast, or leaves it short of the far bank',
    async () => {
      const r = await drivePath(world, lines.chute(), { mode: 'high', speed: 5, day: reopened });
      expect(r.done).toBe(false);
      expect(r.pitch).toBeGreaterThan(50);
    },
    SLOW,
  );

  it(
    'floods the engine straight across Ducie',
    async () => {
      const path: [number, number][] = Array.from({ length: 149 }, (_, k) => [4, 290 - k * 0.5]);
      const r = await drivePath(world, path, { psi: 18, day: dry });
      expect(r.done).toBe(false);
      expect(r.water).toBeGreaterThan(1);
    },
    SLOW,
  );

  it(
    'tips the car off the Dulhunty’s shelf when it drifts towards the falls',
    async () => {
      const path = along(world, [
        ['sand-dulhunty', 140, 160],
        ['dulhunty-ledges', 17.6, 0],
        ['dulhunty-crossing', 0, 6],
        ['dulhunty-crossing', 6, 42, -2.2],
      ]);
      const r = await drivePath(world, path, { psi: 18, day: dry });
      expect(r.done).toBe(false);
      expect(r.tilt).toBeGreaterThan(45);
    },
    SLOW,
  );

  it(
    'drops a wheel into one of Bertie’s holes straight up the middle',
    async () => {
      const path: [number, number][] = [
        ...along(world, [['bertie-bed', 0, 18]]),
        ...Array.from({ length: 140 }, (_, k) => [0, -660 - k * 0.5] as [number, number]),
        ...along(world, [['bertie-bed', 92, 121]]),
      ];
      const r = await drivePath(world, path, { psi: 18, day: dry });
      // The wheel goes deeper than any on the line (0.6 m). The engine lifts it out again:
      // the hole does not yet hang the car on its belly (docs/PLAN-telegraph.md).
      expect(r.water).toBeGreaterThan(0.9);
    },
    SLOW,
  );

  // Open for stage 2 (docs/PLAN-telegraph.md): the raycast wheels climb out of a hole or a
  // rut, and a car crawling off the Chute crooked lands safely, where the plan wants each to fail.
  it.todo('stops the car taken crooked down Palm Creek’s chute, a wheel in the rut');
  it.todo('hangs the car on its belly with a wheel in one of Bertie’s holes');
  it.todo('rolls or damages the car taken crooked off the Chute');

  it(
    'bogs the sand at road pressures where 18 psi gets through',
    async () => {
      const path = along(world, [['the-sand', 0, 140]]);
      const soft = await drivePath(world, path, { mode: 'high', speed: 6, psi: 18, day: dry, limit: 90 });
      const hard = await drivePath(world, path, { mode: 'high', speed: 6, psi: 36, day: dry, limit: 90 });
      expect(soft.done).toBe(true);
      expect(hard.done).toBe(false);
    },
    SLOW,
  );

  it(
    'takes the Troopy down the Staircase and the Slot, its ways across Gunshot (v1.99)',
    async () => {
      for (const id of ['staircase', 'slot']) {
        const r = await drivePath(world, lines[id](), { tuning: troopyTuning, day: dry, psi: 18 });
        expect(r.done, id).toBe(true);
      }
    },
    SLOW,
  );

  it(
    'grounds the Troopy’s long wheelbase on the Chute’s lip (it cannot do the Chute)',
    async () => {
      const r = await drivePath(world, lines.chute(), { tuning: troopyTuning, day: dry, psi: 18 });
      expect(r.done).toBe(false);
    },
    SLOW,
  );
});

describe('a clean run of the whole Telegraph Track', () => {
  it('drives from Bramwell Junction to Gunshot camp in the short 40 on the fuel it carries', async () => {
    const route = along(world, [
      ['bramwell-road', 0, 1e9],
      ['palm-creek', 0, 1e9],
      ['palm-ducie', 0, 1e9],
      ['ducie-crossing', 0, 1e9],
      ['ducie-sand', 0, 1e9],
      ['the-sand', 0, 1e9],
      ['sand-dulhunty', 0, 1e9],
      ['dulhunty-ledges', 1e9, 0],
      ['dulhunty-crossing', 0, 1e9],
      ['dulhunty-bertie', 0, 1e9],
      ['bertie-bed', 0, 1e9],
      ['bertie-fork', 0, 1e9],
      ['gunshot-approach', 0, 1e9],
      ['gunshot-chute', 0, 1e9],
    ]);
    const fuel = telegraphEpisode.loadout.fuel;
    const r = await drivePath(world, route, {
      mode: 'high',
      speed: 9,
      psi: 18,
      limit: 1500,
      giveUpAfter: 40,
      fuelScale: telegraphEpisode.fuelScale,
      planks: washout,
      day: dry,
      crawlNear: [
        [0, 615, 30],
        [-8, 255, 38],
        [washout.x, washout.z, 14],
        [3, -325, 30],
        [-2, -695, 60],
        [-10, -925, 40],
      ],
    });
    expect(r.done, `stopped at ${r.at.map((v) => v.toFixed(0))}`).toBe(true);
    expect(r.winched).toBe(0);
    const used = vehicleTuning.engine.fuel.tankLitres - r.fuel;
    // The load is a clean run and a margin.
    expect(used).toBeLessThan(fuel * 0.85);
    expect(used).toBeGreaterThan(fuel * 0.5);
  }, 1_500_000);
});
