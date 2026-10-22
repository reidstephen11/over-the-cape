import { NO_WATER } from './terrain';
import type { World } from './world';

/**
 * Creeks rising in a storm. The water grid only covers a creek's channel, so a creek
 * that rises over its banks would end in a wall at the channel's edge. Before the
 * physics and the meshes are built, the channel's water level is spread over the low
 * banks beside it, under the ground there until the creek rises over them. Only maps
 * with a storm do this; it changes nothing until the creeks rise.
 *
 * Cells this close to a creek's edge (m, `creekDistance`) are creek water; puddles and
 * rain-filled mud holes always lie further off (puddles 8 m, mud holes 15 m).
 */
export const CREEK_MARGIN = 4;

/** Spread the creeks' water over banks lower than `maxRise` above it. Returns the cells added. */
export function spreadCreekBanks(world: World, maxRise: number): number {
  const t = world.terrain;
  const near = world.features.creekDistance;
  let added = 0;
  // A ring of cells at a time, out to the margin, each taking its highest wet neighbour's level.
  for (let ring = 0; ring < CREEK_MARGIN; ring++) {
    const next: Array<[number, number]> = [];
    for (let iz = 1; iz < t.resZ - 1; iz++)
      for (let ix = 1; ix < t.resX - 1; ix++) {
        const i = iz * t.resX + ix;
        if (near[i] > CREEK_MARGIN || t.water[i] > NO_WATER) continue;
        let level = NO_WATER;
        for (const j of [i - 1, i + 1, i - t.resX, i + t.resX])
          if (near[j] <= CREEK_MARGIN && t.water[j] > level) level = t.water[j];
        // Only dry bank above the water: never ground below it (beside a fall), which would flood now.
        if (level > NO_WATER && t.heights[i] >= level && t.heights[i] < level + maxRise)
          next.push([i, level]);
      }
    for (const [i, level] of next) t.water[i] = level;
    added += next.length;
  }
  return added;
}

/** Whether a sample (index into the terrain grid) is creek water rather than a puddle. */
export function isCreekCell(world: World, i: number): boolean {
  return world.features.creekDistance[i] <= CREEK_MARGIN;
}
