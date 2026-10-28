# Roadmap: make the CREB the whole game

The owner finds Episodes 2–4 boring and easy and wants the game to focus on Episode 1, the CREB Track. v0.64 added a scored finish (medal, score out of 1000, best score and time). Build the rest one update at a time, in this order. Wildlife was considered and turned down.

1. **Remove Episodes 2–4.** Set `episodeOrder` in `src/data/episodes.ts` to `['creb']`, empty `upcomingEpisodes` and drop the "Further north" list in `src/ui/welcome.ts`. In `src/sim/save/save.ts`, send a save whose `episode` is no longer offered back to the CREB. Delete `e2e/coach.spec.ts`, `e2e/frenchmans.spec.ts` and the Lakefield/coach parts of other specs (`e2e/launch.spec.ts` clicks the coach episode). Once nothing imports them, delete `src/data/episodes/coach*`, `lakefield*`, `frenchmans*`, their maps in `src/data/maps.ts`, and the trailer code only they use (keep `src/sim/stuckVehicle.ts` for step 7). Update README.md's episode table and sections.
2. **Section times.** Split times for Big Red, Bob's Hill and the concrete descent, using a start and end point on the track for each (the crawl-run code in `CrawlRuns` already times trails). Save the best per section and show them on the finish screen.
3. **Ghost car.** Record the car's position and heading every 0.25 s on each run; save the best run's trace; on later runs draw a faded copy of the car following it (no physics).
4. **Changing track conditions.** Each new run rolls dry, wet or just-reopened from the run seed. Scale bog depth, creek depth and current, and clay grip with it, and say which in the briefing. Restarting from a camp keeps the same roll.
5. **Engine strain.** Engine temperature that rises with high revs in low range and load, and falls when easing off; a gauge on the HUD; overheating damages the engine (the existing `engine` failure). Water entering the engine in deep crossings taken too fast.
6. **Tyre pressures.** A tool to let tyres down (more grip on clay and sand, more puncture risk on rock, slower on gravel) and a compressor to pump them back up, which takes time.
7. **Other traffic.** Oncoming 4WDs on narrow sections that you pull over for, and now and then a stranded driver to winch out for fuel or plugs. Reuse the stuck-vehicle code in `src/sim/stuckVehicle.ts`.
8. **Night finish.** Instead of failing at 6:15 pm, let the run go on in the dark on headlights, with a lower time score, and fail later (for example 8 pm).

# Other follow-up work

- Episodes 5–7: Telegraph Track South, Telegraph Track North and The Tip (SPEC.md §2).
- A later delivery mission towing another vehicle.
- Compare and correct the 80 Series against real Sooty MkII photographs; the current model remains a MkII-inspired draft.
- Resolve the Army No. 5's documented width discrepancy and the estimated floor, prop-leg and spare-wheel details (`reference/vehicles/army-no5-trailer/SOURCES.md`).
- Download the original box-trailer reference photograph; the model was matched to the Commons preview (`reference/vehicles/box-trailer-6x4/SOURCES.md`).
- Real-device checks in README.md. An unchecked box records an unverified check, rather than a known game fault.
- Optional, not requested: Episode 2 supply side trips and diary entries for Episodes 1–2.
- CREB follow-up, shared code: append `map.bogs` to `features.mudHoles` so authored bogs get winch trees and puddles without a hand-placed boulder. A per-track crown rut would save episodes from authoring erosion coordinates by hand.

Episode 4 delivers two diesel drums across the Wenlock and Pascoe rivers. The trailers, hitching, HUD, sound, delivery goal, water forces, spilled drums, trailer punctures and cargo checkpoint state are implemented. The old three-step towing handover was retired with that release; its decisions remain in docs/DECISIONS.md.
