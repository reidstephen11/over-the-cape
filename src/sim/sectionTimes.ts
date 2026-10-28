/**
 * Times the named climbs and descents of an episode (Big Red, Bob's Hill, the concrete).
 * A section runs between the two ends of its track: the clock starts on leaving one end
 * and stops on reaching the other, whichever way it's driven. Coming back to the end it
 * started from, wandering well away from the far end, or taking longer than `maxSeconds`
 * abandons the attempt.
 */
export interface TimedSection {
  id: string;
  name: string;
  a: { x: number; z: number };
  b: { x: number; z: number };
}

export interface SectionTime {
  id: string;
  name: string;
  seconds: number;
  /** Previous best, or null if this was the first. */
  best: number | null;
}

const RADIUS = 10;
const maxSeconds = 900;

export class SectionTimes {
  /** Best seconds per section id. */
  readonly bests: Record<string, number>;
  /** This run's times, in the order they were driven. */
  readonly times: SectionTime[] = [];
  private active: { section: TimedSection; from: 'a' | 'b'; seconds: number; left: boolean } | null = null;

  constructor(
    private readonly sections: readonly TimedSection[],
    bests: Record<string, number>,
  ) {
    this.bests = { ...bests };
  }

  /** Call every frame; returns a finished time when a section is completed. */
  update(x: number, z: number, dt: number): SectionTime | null {
    const near = (p: { x: number; z: number }) => Math.hypot(x - p.x, z - p.z) <= RADIUS;
    const run = this.active;
    if (run) {
      run.seconds += dt;
      const start = run.section[run.from];
      const end = run.section[run.from === 'a' ? 'b' : 'a'];
      if (!near(start)) run.left = true;
      // The clock starts on leaving the end, not on arriving at it.
      if (!run.left) run.seconds = 0;
      if (near(end)) {
        this.active = null;
        const best = this.bests[run.section.id] ?? null;
        const result = { id: run.section.id, name: run.section.name, seconds: run.seconds, best };
        if (best === null || run.seconds < best) this.bests[run.section.id] = run.seconds;
        this.times.push(result);
        return result;
      }
      // Heading away from the far end (driving on past a section just finished, say) drops it.
      const span = Math.hypot(end.x - start.x, end.z - start.z);
      const away = Math.hypot(x - end.x, z - end.z) > Math.max(span * 1.5, span + 40);
      if ((run.left && near(start)) || away || run.seconds > maxSeconds) this.active = null;
      else return null;
    }
    for (const section of this.sections) {
      if (near(section.a)) this.active = { section, from: 'a', seconds: 0, left: false };
      else if (near(section.b)) this.active = { section, from: 'b', seconds: 0, left: false };
      if (this.active) break;
    }
    return null;
  }
}
