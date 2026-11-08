# Roadmap: make the CREB the whole game

The owner finds Episodes 2–4 boring and easy and wants the game to focus on Episode 1, the CREB Track. v0.64 added a scored finish (medal, score out of 1000, best score and time). Build the rest one update at a time, in this order. Wildlife was considered and turned down.

1. ~~**Remove Episodes 2–4.**~~ Done in v0.73. The trailer code stays: the Army supply run (v1.06, a Start option on the welcome screen) tows one and unlocks the Perentie, and test mode can hitch one.
2. ~~**Section times.**~~ Done in v0.65.
3. ~~**Ghost car.**~~ Done in v1.00 (`src/sim/ghost.ts`): the quickest finish follows you as a pale car; the pause menu shows the gap. Still open: a live gap on the driving HUD and a setting to hide it.
4. ~~**Changing track conditions.**~~ Done: each run rolls dry, wet or just-reopened from the seed; bogs, creeks, current and grip scale with it, the briefing names it, and a camp restart keeps the roll. Clay churn and its visible ruts are also implemented.
5. ~~**Engine strain.**~~ Heat done in v0.67; the bow wave in deep crossings taken too fast in v0.70.
6. ~~**Tyre pressures.**~~ Done in v0.67; the timed compressor in v0.70.
7. **Other traffic.** ~~Oncoming 4WDs on narrow sections that you pull over for~~ (done in v0.69, `src/sim/traffic.ts`). Stranded drivers to winch out for fuel or plugs done in v0.71 (`src/sim/stranded.ts`).
8. ~~**Night finish.**~~ Done in v0.66.

# Sim-audience follow-ups

For players who like 4WD challenges and realistic driving. v1.35 added the manual gearbox (controller only). Its "Manual with clutch" option (○/B as the clutch) was shelved in v1.37, because a controller button is a poor clutch. The owner has permanently ruled out steering-wheel and pedal support; do not put it back on the roadmap or plan to restore the clutch option. Next, one update at a time:

1. ~~**Transfer case.**~~ Done in v1.63: part-time 2H/4H/4L, manual/automatic hubs, full-time centre lock, wind-up, HUD and touch status, and camp persistence. Starts in 4H with hubs and centre locked, retaining the existing route tuning. Next: scored gate courses.
2. **Scored gate courses on the CREB**, using the existing `crawlCourse` and `gateCount` system (gates, touches and a score for the hard climbs).
3. ~~**Tyre pressure in psi and more recovery gear.**~~ Done in v1.67: 18/24/36 psi settings, timed deflation/inflation, per-wheel readings and camp persistence; double-line winching through a snatch block; automatic tree protectors; rear recovery points on stranded vehicles; a timed shovel job with local relief that wheelspin wears away.
4. **Rendered mirrors and head motion** in the driver's seat.
5. **Shift buttons on phones**, so the manual gearbox works with touch.
6. **Solid-axle articulation.** First stage in v1.65: fixed-length axle geometry, shared tyre camber and moving spring/link attachments. The existing massless raycast suspension and low-range flex tuning remain; separate unsprung axle bodies and their suspension/handling retune are still open.

# Performance follow-ups

Left open by `docs/PLAN-efficiency.md` (Phases 1–7, v1.44–v1.59). Measure each first, with `?bench`, `?debug` and `window.__game.breakdown()` on the owner's phone and desktop, and ship it only if the numbers improve.

- **Tree tiles copy all 42 tree geometries each** (`src/render/vegetation.ts`); sharing them would save memory and upload time.
- **Nine footprint rays per wheel** (`src/sim/vehicle/wheelContacts.ts`); fewer may hold the same contact.
- **A traffic car's `VehicleModel` is built inside the physics step** (now in `src/core/trafficCars.ts`); building it ahead, or off the step, would remove a hitch when one appears.
- **Terrain generation in a Worker**, which is most of the 20 s between Drive and Ready on a 4-core machine.
- **The props mesh stays one mesh** (v1.49 measured at most about 2% of the triangles to gain for 5–15 more draw calls a pass); revisit only if a GPU trace says otherwise.
- **One shader program still compiles after Ready** (v1.46), made by something drawn only once driving starts; finding it needs a GPU trace. Dawn and a vehicle swap still recompile, where dusk no longer does.
- **Unit-test shards are uneven** (about 545, 600 and 225 s of test time, v1.45), because Vitest shards by a hash of the path; a sequencer balanced by duration would need timings kept between CI runs.

# Other follow-up work

- **More side quests and interesting discoveries off the beaten track on the CREB.** First set in v1.66: the lost-logbook delivery, the last-pole survey with a new clearing beyond the linesman’s hut, and a three-stop falls/lookout scrapbook. Pause → Trip journal tracks directions, observations and camp-saved progress. Still open: more optional recoveries, hidden camps and abandoned equipment, with distinct tasks and worthwhile rewards.

- Episodes 5–7: Telegraph Track South, Telegraph Track North and The Tip (SPEC.md §2).
- A later delivery mission towing another vehicle.
- The 80 Series stays a Sooty MkII-inspired draft, and **correcting it against the real car is blocked on licensing, not effort**: no photograph of Sooty exists under a licence that allows redistribution here (searched again November 2026 — it appears only in 4WD 24/7 videos, magazine features and retailer pages). v1.41 took what could be taken without pictures: MY4X4's written specification is now in `SOURCES.md`, with the three places the game's car disagrees with it (both diff locks, the snorkel, the rear bar and swing-away spare). The factory body underneath was re-checked against the black VX photographs at the calibrated side camera and matches within the deviations already recorded. To go further the owner would have to supply photographs he has the right to commit, or decide to drop the Sooty framing and call it a built-up 80.
- Resolve the Army No. 5's documented width discrepancy and the estimated floor, prop-leg and spare-wheel details (`reference/vehicles/army-no5-trailer/SOURCES.md`).
- Download the original box-trailer reference photograph; the model was matched to the Commons preview (`reference/vehicles/box-trailer-6x4/SOURCES.md`).
- Vehicle triangle counts: done in v1.24 and v1.29 (every vehicle under 80,000; `npx vite-node scripts/tri-count.ts` prints the table). Still open if ever needed: fewer, larger blocks for the TOYOTA and NISSAN lettering, and the HJ60's script as one block a word.
- The browser tests (`npm run test:e2e`) have eight long-standing failures, found in v1.39 on the first run of the suite in a cloud container (v1.33 made it runnable there at all). They fail the same way on v1.32, so they predate this work and none is a regression: `devMode:4` (the car moves 2 m of the 8 m the test wants at half throttle, the same figure to five decimals on both versions), `episode:15`, `launch:40` (was `launch:37`), `launch:147` (was `launch:144`), `m5-ui:35`, `night:4`, `touch:234` and `touch:280`. `episode:103` fails on v1.32 and passes on v1.39 after a 20-minute run, so it is flaky. `devMode:4` and `m5-ui:35` passed on the v1.46 run. `m4-tools:15` ("the car never stalls at the Daintree crossing") also fails, on v1.45 as well, so it predates the efficiency work. `vehicles:13` (changing to the Land Rover from the pause menu) is flaky: on the v1.52 full run, and alone on v1.51, it timed out waiting for the engine to catch after the swap, and alone on v1.52 it passed. A likely cause is a race in the test: `waitEngine` starts the engine as soon as the vehicle id changes, and `restartFromCamp` switches it off again when its fade ends. `m5-ui:35` passed on the v1.52 run. CI runs lint, the unit tests and the build, not these, which is why they went unnoticed. Work out for each whether the game or the test is wrong.
- Real-device checks in README.md ("What to test", the last ten versions) and docs/TESTED.md (older ones). An unchecked box records an unverified check, rather than a known game fault.
- Optional, not requested: Episode 2 supply side trips and diary entries for Episodes 1–2.
- CREB follow-up, shared code: append `map.bogs` to `features.mudHoles` so authored bogs get winch trees and puddles without a hand-placed boulder. A per-track crown rut would save episodes from authoring erosion coordinates by hand.

Episode 4 (the Frenchmans diesel delivery with a trailer) was removed in v0.73. The trailers, hitching, HUD, sound, the arrival check (`src/sim/supplyRun.ts`, v1.51), water forces, spilled drums, trailer punctures and cargo checkpoint state remain in the code, used by the Army supply run (v1.06) and by test mode. The `delivery` episode field went in v1.51.

- Roll torque with the true steered axle: `addRollTorque` still uses the mirrored axle direction for steered wheels (about half the physical roll torque at full lock) because `rollTorqueScale` and the §6.2 roll checks were tuned with it; switching to `steeredAxle` rolled the car in a full-lock turn while towing (v1.25). Retune the roll per vehicle with the true axle, then re-check the trailer tests.
- Pothole pinching on the paddock road: since the footprint rays sample along the wheel's true rolling direction (v1.19) neither vehicle cuts a tyre at 47 km/h over the clear stretches, and the "pinches tyres on the paddock road taken fast" test fails. Decide from a play test whether the potholes should pinch more often, then tune `damageTuning.tyre` and the test together.

- **Body clearance through full suspension travel.** v1.65 removes the ute crossmember, MQ inner trim and Range Rover load-floor/seat intersections at moderate articulation, with tyre-volume regression checks. Before adding unsprung axle bodies, check every vehicle’s full-bump and full-steering envelope and tune body clearance and travel together; shortening the ute’s travel alone stopped its knoll rock climb.
