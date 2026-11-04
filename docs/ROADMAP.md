# Roadmap: make the CREB the whole game

The owner finds Episodes 2–4 boring and easy and wants the game to focus on Episode 1, the CREB Track. v0.64 added a scored finish (medal, score out of 1000, best score and time). Build the rest one update at a time, in this order. Wildlife was considered and turned down.

1. ~~**Remove Episodes 2–4.**~~ Done in v0.73. The trailer code stays: the Army supply run (v1.06, a Start option on the welcome screen) tows one and unlocks the Perentie, and test mode can hitch one.
2. ~~**Section times.**~~ Done in v0.65.
3. ~~**Ghost car.**~~ Done in v1.00 (`src/sim/ghost.ts`): the quickest finish follows you as a pale car; the pause menu shows the gap. Still open: a live gap on the driving HUD and a setting to hide it.
4. **Changing track conditions.** Clay churned up by wheelspin done in v0.70 (`src/sim/world/churn.ts`), drawn as ruts in v0.71. Still to do: each new run rolls dry, wet or just-reopened from the run seed. Scale bog depth, creek depth and current, and clay grip with it, and say which in the briefing. Restarting from a camp keeps the same roll.
5. ~~**Engine strain.**~~ Heat done in v0.67; the bow wave in deep crossings taken too fast in v0.70.
6. ~~**Tyre pressures.**~~ Done in v0.67; the timed compressor in v0.70.
7. **Other traffic.** ~~Oncoming 4WDs on narrow sections that you pull over for~~ (done in v0.69, `src/sim/traffic.ts`). Stranded drivers to winch out for fuel or plugs done in v0.71 (`src/sim/stranded.ts`).
8. ~~**Night finish.**~~ Done in v0.66.

# Sim-audience follow-ups

For players who like 4WD challenges and realistic driving. v1.35 added the manual gearbox (controller only). Its "Manual with clutch" option (○/B as the clutch) was shelved in v1.37, because a controller button is a poor clutch; it returns once steering-wheel and pedal support (item 3) gives it a real pedal. Next, one update at a time:

1. **Transfer case.** Per vehicle `transfer: 'partTime' | 'fullTime'`: part-time with 2H/4H/4L and free-wheeling hubs (40, 60, Hilux, Troopy, Patrol, LC79); full-time with a centre diff lock (80 Series, Perentie and Camel; the Unimog full-time). L cycles 2H → 4H (on the move, hubs locked) → 4L (stopped). Hubs lock from the tool menu, stopped, about 20 s; auto hubs on the LC79. 2H: no front drive (the per-axle split goes to the rear only), slightly lower rolling drag and fuel, tail-happy on gravel. Part-time 4H/4L or the centre lock on rock or concrete winds the driveline up: steering effort and tyre scrub in tight turns, a creak, tyre wear; a 2H/4H/4L HUD lamp. The autopilot and the tests default to 4H with the hubs locked so nothing tuned moves.
2. **Scored gate courses on the CREB**, using the existing `crawlCourse` and `gateCount` system (gates, touches and a score for the hard climbs).
3. **Steering-wheel and pedal mapping**, with rumble, a clutch pedal (bringing back "Manual with clutch"), and field-of-view and sensitivity settings.
4. **Tyre pressure in psi and more recovery gear:** a snatch block, a tree protector, a rear recovery point and a shovel.
5. **Rendered mirrors and head motion** in the driver's seat.
6. **Shift buttons on phones**, so the manual gearbox works with touch.
7. **Solid-axle articulation** (high risk: it touches the suspension the whole game is tuned on).

# Other follow-up work

- Episodes 5–7: Telegraph Track South, Telegraph Track North and The Tip (SPEC.md §2).
- A later delivery mission towing another vehicle.
- The 80 Series stays a Sooty MkII-inspired draft, and **correcting it against the real car is blocked on licensing, not effort**: no photograph of Sooty exists under a licence that allows redistribution here (searched again November 2026 — it appears only in 4WD 24/7 videos, magazine features and retailer pages). v1.41 took what could be taken without pictures: MY4X4's written specification is now in `SOURCES.md`, with the three places the game's car disagrees with it (both diff locks, the snorkel, the rear bar and swing-away spare). The factory body underneath was re-checked against the black VX photographs at the calibrated side camera and matches within the deviations already recorded. To go further the owner would have to supply photographs he has the right to commit, or decide to drop the Sooty framing and call it a built-up 80.
- Resolve the Army No. 5's documented width discrepancy and the estimated floor, prop-leg and spare-wheel details (`reference/vehicles/army-no5-trailer/SOURCES.md`).
- Download the original box-trailer reference photograph; the model was matched to the Commons preview (`reference/vehicles/box-trailer-6x4/SOURCES.md`).
- Vehicle triangle counts: done in v1.24 and v1.29 (every vehicle under 80,000; `npx vite-node scripts/tri-count.ts` prints the table). Still open if ever needed: fewer, larger blocks for the TOYOTA and NISSAN lettering, and the HJ60's script as one block a word.
- The browser tests (`npm run test:e2e`) have eight long-standing failures, found in v1.39 on the first run of the suite in a cloud container (v1.33 made it runnable there at all). They fail the same way on v1.32, so they predate this work and none is a regression: `devMode:4` (the car moves 2 m of the 8 m the test wants at half throttle, the same figure to five decimals on both versions), `episode:15`, `launch:40` (was `launch:37`), `launch:147` (was `launch:144`), `m5-ui:35`, `night:4`, `touch:234` and `touch:280`. `episode:103` fails on v1.32 and passes on v1.39 after a 20-minute run, so it is flaky. `devMode:4` and `m5-ui:35` passed on the v1.46 run. `m4-tools:15` ("the car never stalls at the Daintree crossing") also fails, on v1.45 as well, so it predates the efficiency work. CI runs lint, the unit tests and the build, not these, which is why they went unnoticed. Work out for each whether the game or the test is wrong.
- Real-device checks in README.md. An unchecked box records an unverified check, rather than a known game fault.
- Optional, not requested: Episode 2 supply side trips and diary entries for Episodes 1–2.
- CREB follow-up, shared code: append `map.bogs` to `features.mudHoles` so authored bogs get winch trees and puddles without a hand-placed boulder. A per-track crown rut would save episodes from authoring erosion coordinates by hand.

Episode 4 (the Frenchmans diesel delivery with a trailer) was removed in v0.73. The trailers, hitching, HUD, sound, delivery goal, water forces, spilled drums, trailer punctures and cargo checkpoint state remain in the code, used by the Army supply run (v1.06) and by test mode.

- Roll torque with the true steered axle: `addRollTorque` still uses the mirrored axle direction for steered wheels (about half the physical roll torque at full lock) because `rollTorqueScale` and the §6.2 roll checks were tuned with it; switching to `steeredAxle` rolled the car in a full-lock turn while towing (v1.25). Retune the roll per vehicle with the true axle, then re-check the trailer tests.
- Pothole pinching on the paddock road: since the footprint rays sample along the wheel's true rolling direction (v1.19) neither vehicle cuts a tyre at 47 km/h over the clear stretches, and the "pinches tyres on the paddock road taken fast" test fails. Decide from a play test whether the potholes should pinch more often, then tune `damageTuning.tyre` and the test together.
