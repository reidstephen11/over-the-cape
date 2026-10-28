import { SurfaceId } from '../../data/surfaces';

/**
 * Churned-up track (the CREB's clay after a few cars, or yours spinning in it). Wet clay and
 * mud cut up under spinning wheels, and a little under rolling ones, and churned ground grips
 * less, so a climb you've spun on gets harder for the next attempt. Kept per 2 m square for
 * the rest of the run.
 */
const CELL = 2;
/** Grip lost on fully churned ground. */
const LOSS = 0.3;
/** Churn added per second by a fully spinning wheel on fully wet ground. */
const SPIN_RATE = 0.12;
/** Churn added per metre a rolling wheel travels on fully wet ground. */
const ROLL_RATE = 0.004;
/** Dry ground churns this fraction as fast as soaked ground. */
const DRY_SHARE = 0.25;

const churns = (s: SurfaceId) => s === SurfaceId.Clay || s === SurfaceId.Mud;

export class ChurnMap {
  private readonly cells = new Map<number, number>();
  /** The most churned square so far (0..1). */
  peak = 0;

  private key(x: number, z: number): number {
    return (Math.floor(x / CELL) + 32768) * 65536 + (Math.floor(z / CELL) + 32768);
  }

  /** How churned the ground is at (x, z), 0..1. */
  at(x: number, z: number): number {
    return this.cells.get(this.key(x, z)) ?? 0;
  }

  /** Grip multiplier for a wheel on `surface` at (x, z). */
  grip(x: number, z: number, surface: SurfaceId): number {
    return churns(surface) ? 1 - LOSS * this.at(x, z) : 1;
  }

  /** A wheel on the ground for `dt` s, spinning `spin` (0..1) and rolling at `speed` m/s. */
  work(
    x: number,
    z: number,
    surface: SurfaceId,
    spin: number,
    speed: number,
    wetness: number,
    dt: number,
  ): void {
    if (!churns(surface)) return;
    const wet = DRY_SHARE + (1 - DRY_SHARE) * Math.min(1, Math.max(0, wetness));
    const add = wet * (spin * SPIN_RATE * dt + Math.abs(speed) * dt * ROLL_RATE);
    if (add <= 0) return;
    const k = this.key(x, z);
    const v = Math.min(1, (this.cells.get(k) ?? 0) + add);
    this.cells.set(k, v);
    this.peak = Math.max(this.peak, v);
  }
}
