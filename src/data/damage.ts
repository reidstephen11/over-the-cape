/**
 * Mechanical damage (SPEC §11), chosen in the settings:
 * - off: no mechanical damage (the body still dents and gets dirty);
 * - mild: damage slows you down but never strands you;
 * - realistic: a tyre can go flat and the engine can fail.
 */
export type DamageMode = 'off' | 'mild' | 'realistic';

export const damageModes: readonly DamageMode[] = ['off', 'mild', 'realistic'];

export const damageLabels: Record<DamageMode, string> = {
  off: 'Off',
  mild: 'Mild',
  realistic: 'Realistic',
};

export const isDamageMode = (x: unknown): x is DamageMode => damageModes.includes(x as DamageMode);

/** Health ranges from 1 (as new) to 0 (flat tyre, collapsed corner, dead engine). */
export const damageTuning = {
  tyre: {
    /**
     * A tyre landing on rock with its corner of the body falling faster than this (m/s)
     * is cut and starts to go down: a drop of about a metre. Crawling up, over and down
     * the trails' rocks stays below it (at most 3.6 m/s, measured with both vehicles).
     */
    punctureSpeed: 4.4,
    /** Landing harder than this (m/s), about a 1.5 m drop, tears the sidewall instead. */
    sidewallSpeed: 5.4,
    /**
     * Seconds from a cut to fully down: mild damage's soft tyre, a realistic puncture's
     * slow leak, or a torn sidewall.
     */
    deflateSeconds: { mild: 14, puncture: 40, sidewall: 5 },
    /**
     * Spinning a wheel hard on rock wears through the tread: this many seconds of full
     * spin (less spin counts for less) punctures the tyre. Crawling in low range barely spins.
     */
    abrasionSeconds: 6,
    /** Spin (0..1) below this on rock does no harm. */
    abrasionSpin: 0.45,
    /**
     * A wheel dropping into a pothole or washout pinches the tyre (a puncture) when the
     * strike (the vehicle's speed in m/s times the hole's depth in m, give or take a
     * quarter) is over this. Hit squarely, a 25 cm pothole pinches from 42 km/h and a 30 cm
     * washout from 35; glancing, from 70 and 58.
     */
    strike: 3.6,
    /** How far down a cut tyre goes. */
    floor: { mild: 0.5, realistic: 0 },
    /** A flat tyre (health 0): its rolling radius drops this much (m), leaving the rim a few centimetres off the ground. */
    flatDrop: 0.12,
    /** ...rising and falling this much (m) once a turn as the folded tyre flaps round, which shakes the car at speed... */
    flatThump: 0.02,
    /** ...it drags: rolling resistance per newton of load... */
    flatDrag: 0.3,
    /** ...its sidewall folds under a sideways load, keeping only 1 − this of its cornering grip... */
    flatSideLoss: 0.6,
    /** ...and a flat front tyre drags the steering towards its side (degrees). */
    flatToeDeg: 1.5,
  },
  suspension: {
    /** Landing with a corner falling faster than this (m/s), about a 1.6 m drop, bends it. */
    bendSpeed: 5.6,
    /** Health lost per m/s above it. */
    perSpeed: 0.22,
    floor: { mild: 0.6, realistic: 0.15 },
    /** Hitting a hole harder still (a strike, as for tyres: 25 cm squarely at 55 km/h) bends that corner... */
    strike: 4.8,
    /** ...losing this much health. */
    strikeLoss: 0.15,
    /** A bent front corner pulls the steering towards its side (degrees at health 0). */
    toeDeg: 4,
  },
  engine: {
    /**
     * A chassis knock harder than this (impulse, N·s) cracks the sump or bends the steering
     * arms. Belly scrapes on the trails and park lines reach about 4400; a 50 km/h crash
     * into a wall about 20000.
     */
    knockImpulse: 8000,
    perImpulse: 0.00004,
    /** A crash: the body's speed changed by more than this in one step (m/s) on the nose. */
    crashSpeed: 6,
    perSpeed: 0.09,
    /** Running upside down starves the engine of oil: health lost per second. */
    invertedPerSecond: 0.06,
    /** In realistic mode, water drawn in through the intake bends a rod: health lost per flooding stall. */
    floodStall: 0.35,
    floor: { mild: 0.5, realistic: 0 },
  },
  /** Roadside jobs from the tool menu: seconds stopped while you work. */
  repair: { fieldSeconds: 6, spareSeconds: 8, plugSeconds: 10, refuelSeconds: 12 },
  /** Fuel in one jerry can (L). */
  jerryCanLitres: 20,
  /** Below this health a part counts as damaged on the HUD. */
  shown: 0.97,
};
