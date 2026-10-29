# Roadmap: make the CREB the whole game

The owner finds Episodes 2–4 boring and easy and wants the game to focus on Episode 1, the CREB Track. v0.64 added a scored finish (medal, score out of 1000, best score and time). Build the rest one update at a time, in this order. Wildlife was considered and turned down.

1. ~~**Remove Episodes 2–4.**~~ Done in v0.73. Trailers stay in test mode only; removing their code is the owner's call.
2. ~~**Section times.**~~ Done in v0.65.
3. ~~**Ghost car.**~~ Done in v1.00 (`src/sim/ghost.ts`): the quickest finish follows you as a pale car; the pause menu shows the gap. Still open: a live gap on the driving HUD and a setting to hide it.
4. **Changing track conditions.** Clay churned up by wheelspin done in v0.70 (`src/sim/world/churn.ts`), drawn as ruts in v0.71. Still to do: each new run rolls dry, wet or just-reopened from the run seed. Scale bog depth, creek depth and current, and clay grip with it, and say which in the briefing. Restarting from a camp keeps the same roll.
5. ~~**Engine strain.**~~ Heat done in v0.67; the bow wave in deep crossings taken too fast in v0.70.
6. ~~**Tyre pressures.**~~ Done in v0.67; the timed compressor in v0.70.
7. **Other traffic.** ~~Oncoming 4WDs on narrow sections that you pull over for~~ (done in v0.69, `src/sim/traffic.ts`). Stranded drivers to winch out for fuel or plugs done in v0.71 (`src/sim/stranded.ts`).
8. ~~**Night finish.**~~ Done in v0.66.

# Other follow-up work

- Episodes 5–7: Telegraph Track South, Telegraph Track North and The Tip (SPEC.md §2).
- A later delivery mission towing another vehicle.
- Compare and correct the 80 Series against real Sooty MkII photographs; the current model remains a MkII-inspired draft.
- Resolve the Army No. 5's documented width discrepancy and the estimated floor, prop-leg and spare-wheel details (`reference/vehicles/army-no5-trailer/SOURCES.md`).
- Download the original box-trailer reference photograph; the model was matched to the Commons preview (`reference/vehicles/box-trailer-6x4/SOURCES.md`).
- Real-device checks in README.md. An unchecked box records an unverified check, rather than a known game fault.
- Optional, not requested: Episode 2 supply side trips and diary entries for Episodes 1–2.
- CREB follow-up, shared code: append `map.bogs` to `features.mudHoles` so authored bogs get winch trees and puddles without a hand-placed boulder. A per-track crown rut would save episodes from authoring erosion coordinates by hand.

Episode 4 (the Frenchmans diesel delivery with a trailer) was removed in v0.73. The trailers, hitching, HUD, sound, delivery goal, water forces, spilled drums, trailer punctures and cargo checkpoint state remain in the code and in test mode.
