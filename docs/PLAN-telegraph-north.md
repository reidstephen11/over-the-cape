# Plan: the Telegraph Track North (the Bamaga Road turn-off to Nolans Brook)

The owner asked to continue building new tracks (November 2026). This is the northern half of the Old Telegraph Track, Episode 6 in SPEC.md §2, built as the game's third episode. The design was written in the session that built stage 1 (v2.17), from Hema Maps' guide to the northern track (`docs/HISTORY.md`). Where the design and the engine disagree, the engine wins: the nearest thing the engine can do is built, and the difference is recorded under **Differences from the design** below and in the version's notes in `docs/DECISIONS.md`. Numbers are targets to tune by driving, not fixed values.

## Status

- **Stage 1 (v2.17): built without a play test.** The episode, map, route with six creeks, the log bridge, the long drive, Nolans Brook rising with the rain, the camp, mission, briefing, notes with sourced history, and tests (`tests/telegraphNorth.test.ts`, `tests/telegraphNorthDrive.test.ts`).
- **Play test (v2.19).** Codex drove v2.18 in the FJ40 on Mild as far as Canal Creek (a rollover, several winch pulls, the flooding warning on the way in). Acted on: the shelf could not be read from the cab (two marker rocks, an aiming sign, darker water beside the shelf); low range was never taught (a prompt before the first water). Not reached, so still open: whether the long drive's bog and the shoal at Nolans Brook can be seen in time.
- **Stage 2: not started.** The side trips to Fruit Bat Falls and to Eliot and Twin Falls; a traveller drowned in Nolans Brook to winch out; a 4WD coming the other way; a dead tree down across the long drive; a soft bed under water (an engine change, see below).
- **Stage 3: not started.** Polish from the owner's play test.

## The design

The southern episode is steep banks. This one is water. The plain is the same sandy heath and woodland, and the creeks are shallower cut, but three of the crossings punish the wrong line with water rather than with a climb, and the last one gets deeper as the afternoon goes on.

- Episode id `telegraphNorth`, map id `telegraphNorth`, number 3, title "The Telegraph Track North", route "The Bamaga Road turn-off to Nolans Brook".
- Mission: "Cross Nolans Brook before the rain lifts it". Goal POI: the camp on Nolans Brook's north bank.
- Available from the start, with no unlock.

### What makes it different from the southern episode

- **The deadline is in the water.** The run starts fine at 1:30 pm. Showers come from 3 pm and steady rain from 4 pm, and Nolans Brook rises with it. A run on time crosses a wade; a slow run finds the shoal too deep for an engine with no snorkel. Dark (6:15 pm, with an hour's grace) is still the last deadline.
- **The vehicle matters.** Eight of the fifteen vehicles breathe at about 0.9 m and six have a snorkel. A snorkel buys time at Nolans Brook, not safety: late on the wettest day the current takes even those.
- **Every wrong line fails in its own way:** a wheel held in a gully (Canal Creek's old exit), a wheel hung in a washed-out hole (Mistake Creek), a wheel through the deck (the log bridge), a bog (the long drive), a drowned engine or a car carried off (Nolans Brook).
- Route about 1.9 km on a map 1024 × 2048 m, south to north. One camp (Cannibal Creek, a little past halfway). A lean load, as in the south.

### The route, south to north (metres along the route)

1. **The Bamaga Road turn-off (0).** Spawn camp. 290 m of corrugated sand, nearly straight.
2. **Canal Creek (about 300).** A ramp down into deep, clear water; across on a shelf 0.6 m under; then two ways out. The old exit, to the right: straight up the clay, with two gullies washed out across it that hold a wheel. The winding exit, to the left: along the foot of the far bank in the shallows and up it in an S. Timed section.
3. **Sam Creek (about 615).** An easy crossing, with swimming holes downstream.
4. **Mistake Creek (about 850).** A steep, eroded way in: about 30° of clay, rutted, leaning one way then the other, with a ledge of rock half-way down and the bank washed away into a hole on the right. Easy from the bottom.
5. **Cannibal Creek (about 1100).** An easy crossing. The only camp, on its north bank.
6. **Cypress Creek (about 1390).** A log bridge 26 m long and 4 m wide with no kerb and logs missing: a hole on the right, one on the left, one down the middle to straddle. The creek under it cannot be forded.
7. **The long drive (about 1430 to 1800).** 370 m of soft sand with whoops (18 psi), and a bog across the right of the track two thirds along, with firm ground along its left edge.
8. **Nolans Brook (about 1830).** 40 m wide, about 1.4 m deep in the middle and deeper where wheels have dug it out. The line: in, hard right (upstream) onto a shoal 0.55 m under, straight across on it, out at its upstream end. The current pushes the car off the shoal towards the deep. Timed section. Goal camp on the north bank.

### Mission and conditions

- 1:30 pm start. Showers from 3 pm, steady rain from 4 pm to past dark. Nolans Brook takes the whole rise; the five creeks before it take about a third.
- The per-run track conditions roll sets where the creeks start: 0.1 m down on a dry day, 0.15 m up on a wet one, and the rain's rise is smaller on the dry day and larger on the wet one.
- Ghost car, section times, best score and best time per episode, as on the other episodes.

### History

State only what a source says, with each claim and source in `docs/HISTORY.md`. Stage 1's source is Hema Maps' guide to the northern track. Not stated: who the creeks are named after; anything about Fruit Bat, Eliot and Twin Falls beyond what Hema says (stage 2 will need them).

## As built (v2.17)

Measured on the generated map and in the scripted drives (`tests/telegraphNorthDrive.test.ts`).

- **Route:** 1,929 m from the turn-off to Nolans Brook camp. First obstacle at 294 m. The camp is 59% of the way along.
- **Canal Creek:** water 3.4 m below the plain. In: about 13° for 14 m. The shelf: 0.6 m deep; over 1 m either side of it. The winding exit: 12 m along the foot of the bank, then 3 m up in about 25 m with a pinch of about 15° on the first bend, leaning 7° towards the creek. The old exit: 3 m up in 8 m with two gullies 0.9 and 0.95 m deep right across it.
- **Sam and Cannibal Creeks:** 0.3 m deep, banks of 10 to 14°.
- **Mistake Creek:** water 4.4 m below the plain. In: 4 m down in 7 m (27 to 38°), a 0.45 m rut under the left wheels, a 0.35 m ledge, 7° of lean one way then 8° the other, and a hole 0.95 m deep and 1.3 m across on the right. Out: 15 to 17°.
- **The log bridge:** 26 m of deck 4 m wide, 3.6 m above the creek's water (1.1 m deep). Holes: on the right from 0.45 m off the middle to the edge, 3 to 5.5 m along (2.45 m of deck left); on the left from 0.9 m off the middle to the edge, 13 to 15.5 m along (2.9 m left); down the middle 0.64 m wide, 21 to 23 m along.
- **The long drive:** 372 m with swells of up to 0.34 m; the bog is 20 m long, 4 m wide and 0.6 m deep on black soil, its middle 1.5 m right of the centreline.
- **Nolans Brook:** 40 m wide, 2 m below the plain. The shoal: 0.55 m deep, 14 m wide. The middle: 1.4 m, and 2.3 to 2.4 m in two holes on the straight line. Current 1.4 m/s mid-stream. Out: 12 to 19° of sand.
- **The rise at Nolans Brook** (metres above the day's own level):

  | Day           | Start | 4 pm  | 5 pm | 6 pm | Dark (6:15) |
  | ------------- | ----- | ----- | ---- | ---- | ----------- |
  | Dry           | −0.10 | −0.06 | 0.02 | 0.08 | 0.09        |
  | Just reopened | 0     | 0.10  | 0.26 | 0.40 | 0.42        |
  | Wet           | 0.15  | 0.32  | 0.54 | 0.70 | 0.73        |

- **What that does, driven on the shoal at a crawl:** the Hilux (the lowest intake, 0.85 m) floods from a rise of about 0.25 m: from about 5 pm on the just-reopened day (30 minutes of play) and from about 3:45 pm on the wet day (19 minutes); never on the dry day. The 40 and the Troop Carrier still cross at 0.26 m. The LC79 (snorkel) crosses at 0.63 m and is carried off the shoal at 0.70 m: at 6 pm on the wet day only.
- **Load and clock:** 16 L of fuel, no jerry cans, one spare, two plugs, `fuelScale` 12 (the scripted clean run burns 11.1 L). 1:30 pm start, dark at 6:15 pm, one hour's grace, `clockRate` 7: the scripted run takes 17.3 minutes at the autopilot's crawl through each obstacle and reaches Nolans Brook at about 3:20 pm.

## As built (v2.19, after the first play test)

- **Canal Creek's shelf, marked.** Two rocks 0.55 m in radius at the near water's edge, at x −3.3 and 2.3 (the shelf's middle is at −0.5), 5.6 m apart: drive in between them. A sign on the far bank at (−1.6, 596.6), straight across the shelf and between the two exits: "Aim here — then exit left". The holes either side now start at the shelf's edges (centres 6.4 m east and 7.6 m west, 4.2 m in radius, 0.6 m deeper), so the water is 1.7 m deep right beside the shelf's 0.6 m and shows darker. The shelf is as deep and as wide as before; off it is deeper than before (it was 1.1 m for the first few metres).
- **Low range, taught once.** With water 0.2 m or deeper within 30 m ahead of the car, in high range, a prompt says to stop and take low range. It does not show again on a run once low range has been used.
- The scripted drives are unchanged (`tests/telegraphNorthDrive.test.ts`, 29 tests).

## Differences from the design

- **Episode number.** SPEC.md §2 calls this Episode 6; it is built as the game's third episode, number 3.
- **The shoal is shallower, not firmer.** Hema says the hard right line is usually shallower with a firmer bottom. The engine has one surface for every creek bed under water, whatever the creek's `bed` (which only sets its colour and its dry banks), so the sand in the middle of Nolans Brook is no softer than the shoal. Depth, the current and the two dug-out holes make the straight line fail. A soft bed under water is an engine change, listed for stage 2.
- **The Unimog wades the straight line.** The short 40 drowns and the LC79 stops in the holes, but the Unimog (intake 2.3 m, 6 t) drives straight through, even on the wet day. Not changed: making the holes deeper again would be for one vehicle.
- **Mistake Creek's way in does not punish speed.** Taken in high range at 3 to 5 m/s on the line, the 40 gets down (it pitches 42 to 44°). The wrong line (right wheels in the washed-out hole) hangs the car at 60° and more. A descent that damages a car taken fast would need the damage model to count a hard landing, which it does only for tyres and suspension over rocks.
- **The log bridge is the engine's timber bridge.** It is drawn as sawn boards on posts, not round logs.
- **The shoal is hard to see from the driver's seat.** The water is a little paler over it and darker over the holes, in 1 m cells. The sign and the note say "hard right". Check in the play test.
- **The bog's winch trees.** The bog asks for a tree at either end (`winchTrees`), but none shows in the screenshot from the track: check in the play test whether there is something to winch to.
- **Rain in the dry season.** The southern episode has no rain. This one has an afternoon of it on every roll, because the mission needs the brook to rise; the briefing calls it showers forecast from mid-afternoon.
- **Fruit Bat, Eliot and Twin Falls are not on the map yet** (SPEC.md's route for this episode names them). They are stage 2's side trips.
- **Telegraph poles and winch rocks** are as on the southern map: the leaning power pole prop, and marked rocks rather than trees.
