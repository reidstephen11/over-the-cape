# Plan: the Telegraph Track North (the Bamaga Road turn-off to Nolans Brook)

The owner asked to continue building new tracks (November 2026). This is the northern half of the Old Telegraph Track, Episode 6 in SPEC.md §2, built as the game's third episode. The design was written in the session that built stage 1 (v2.17), from Hema Maps' guide to the northern track (`docs/HISTORY.md`). Where the design and the engine disagree, the engine wins: the nearest thing the engine can do is built, and the difference is recorded under **Differences from the design** below and in the version's notes in `docs/DECISIONS.md`. Numbers are targets to tune by driving, not fixed values.

## Status

- **Stage 1 (v2.17): built without a play test.** The episode, map, route with six creeks, the log bridge, the long drive, Nolans Brook rising with the rain, the camp, mission, briefing, notes with sourced history, and tests (`tests/telegraphNorth.test.ts`, `tests/telegraphNorthDrive.test.ts`).
- **Play test (v2.19).** Codex drove v2.18 in the FJ40 on Mild as far as Canal Creek (a rollover, several winch pulls, the flooding warning on the way in). Acted on: the shelf could not be read from the cab (two marker rocks, an aiming sign, darker water beside the shelf); low range was never taught (a prompt before the first water). Not reached: the long drive's bog and Nolans Brook.
- **The two checks it did not reach (v2.20),** made in the game in a browser. The bog can be seen in time, but had nothing to winch to: two marked rocks added. The shoal at Nolans Brook could not be told from the deep: a rock and a sign on the near bank and a sign on the far bank now mark the line. Still for the owner's play test: whether the rise at Nolans Brook is too fast or too slow.
- **Stage 2 (v2.21 and v2.22): built without a play test.** The side trips to Fruit Bat Falls and to Eliot and Twin Falls; a traveller drowned in Nolans Brook to winch out; a 4WD coming the other way; a dead tree down across the long drive (v2.21). A soft bed under Nolans Brook, firm on the shoal (v2.22).
- **Second play test (v2.23).** Codex spot-tested v2.22 in the FJ40 on Mild as far as Nolans Brook's bank, without clearing the bog, crossing the brook or recovering the HiLux. Acted on: the run started with the CREB's load, not the episode's (the load is now kept per episode); it turned right before the water at Nolans Brook (the HUD now says to drive in first, and the marker rock is 1.3 m in radius, from 0.7 m); the falls' cost was only in the journal (now a hint on the first stretch).
- **Third play test (v2.24).** Codex tested v2.23 with targeted drives and recoveries: the right line at Nolans Brook finished undamaged, the straight line flooded the engine, the HiLux recovery paid its jerry can and dragged the car 6 m off the shoal, and the bog's forward boulder pulled the car onto the firm edge. Its verdict was to keep the difficulty and make recovery easier to read. Acted on: the history note makes way for a warning or the winch; after a recovery the HUD says where the line is; the bog's boulders are named. Still not done by anyone: one uninterrupted run, a physical phone, a controller.
- **Reading the terrain (v2.25).** The owner's next priority (`docs/ROADMAP.md`). Canal Creek first: clear water that shows the pale shelf and breaks over it, dark water where it is deep, worn wheel lines down to the water and up the winding exit, and a hint and note that say how to read the creek. To test: a new player, uncoached, explains their line before the water.
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
- Since stage 2 (v2.21): two side tracks to the falls before Canal Creek, which cost time; a 4WD coming the other way; a drowned traveller in Nolans Brook to winch out; a dead tree down on the long drive.

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

## As built (v2.20, the bog and Nolans Brook checked from the seat)

- **The bog's winch rocks.** Two marked rocks 17 m before and 17 m past the bog's middle (233 m and 267 m along the long drive), 3.6 m left of the centreline. Before v2.20 nothing was within the cable's 29 m of the bog but one tree, 28 m from one end.
- **Nolans Brook's marks.** A rock 0.7 m in radius (1.3 m since v2.23) on the near bank at the water's edge at (18, −849.2), 0.3 m above the day's own level, with a sign above it at (19.2, −847.4) facing west: "Turn across here". A sign on the far bank at (20.8, −898.5), 2.8 m right of the way out: "Aim here from the rock". The marked line: in, right along the bank about 7 m out from the water's edge to x = 18, then straight across. It is 0.55 m deep all the way, like the track's own curved line.
- The scripted drives: 30 (`tests/telegraphNorthDrive.test.ts`), with the marked line at Nolans Brook added.

## As built (v2.21, stage 2)

- **Fruit Bat Falls** (`fruit-bat-track`): a fork to the right 56 m from the turn-off, 210 m east over the heath to a stop on the bank above the pool, at (222, 894). The creek (`fruit-bat-creek`) comes in from the south, east of the track, drops 2.2 m in 5.5 m over a lip 24 m wide into a pool 26 m wide and 1.5 m deep, and leaves the map to the east. It never crosses the track. The falls are about 30 m from the stop, to the right.
- **Eliot and Twin Falls** (`eliot-track`): a turn-off to the right 277 m along, 17 m before the top of Canal Creek’s ramp, about 165 m east along the creek's south bank to a camping area at (164, 650): a fire ring and two log seats. Canal Creek drops 1.1 m in 4 m at x = 193 to 189 (Eliot Falls) and 1.15 m in 4 m at x = 146 to 142 (Twin Falls), with a pool between; the camp is between them, 35 to 40 m from each. The creek's level, the shelf and the holes at the crossing are unchanged, and the scripted drives of Canal Creek pass as before.
- **The side trip** ("The falls", in the journal): stop for three seconds at each, in either order, for one tyre plug. Driven out and back by the autopilot in high range: 147 s for Fruit Bat and 113 s for Eliot and Twin. The whole route with both took 25.6 minutes against 17.3 (8.3 minutes more, about an hour on the game's clock) and burnt 13.8 L of the 16 L against 11.1. At that pace a run that does both reaches Nolans Brook at about 4:20 pm: still a wade on the commonest day, and past the Hilux's limit on the wettest.
- **Traffic:** a Patrol south along `sam-mistake` (190 m of sand between Sam Creek and Mistake Creek) the first time either end is reached.
- **The drowned HiLux** (`nolans-drowned`): in Nolans Brook's old straight line at (−0.2, −864.2), 9 m left of the track's line, nose towards the shoal, in 1.26 m of water at the start of the commonest day (0.9 m at its nose). It is within 20 m of the shoal's start and of the near bank. Pulled 6 m it is free and standing in under 0.75 m. It pays one jerry can. It also marks the wrong line: a car going straight across meets it.
- **The dead tree:** one a run, on the long drive between 50 and 205 m along (two stretches; the run's seed picks one and the spot), at least 24 m from the bog.
- **The low-range prompt** does not show at a side trip's stop: the pool at Fruit Bat Falls is water ahead, and not a crossing.
- The scripted drives: 33 (`tests/telegraphNorthDrive.test.ts`); stage 2's facts are in `tests/telegraphNorthStage2.test.ts`.

## As built (v2.22, the soft bed)

- **Nolans Brook's bed is soft sand** under water (`softBed`), except on the shoal's two bars and along the track's line, which are firm. Soft bed: grip 0.42, rolling resistance 1.4, 0.2 m of sink; low tyre pressures help as on dry sand.
- **Driven:** off the shoal in 1.35 m, the LC79 with both lockers at 18 psi crawls 25 m of soft bed in about 78 s (0.32 m/s; 0.7 m/s on the shoal), and at 36 psi is not across in 250 s. The short 40 on the straight line stops in the middle, short of the holes. Both right lines are on firm bed and drive as before.
- The scripted drives: 34.

## As built (v2.25, Canal Creek read from the ramp)

- **Clear water** on Canal Creek (`clear`): up to 0.65 m deep the bed shows through and the surface breaks where the creek runs, fading out by 1 m; the colour is darkest from 1.1 m. The shelf's bed is pale gravel. The shelf (0.6 m) is a pale, broken strip; the creek's 1.1 m and the 1.7 m holes are dark and smooth. The cue fades as the rain muddies the creek.
- **Worn wheel lines** on the `canal-creek` track, on dry ground: from the top of the ramp to the water, and from the far water's edge along the foot of the bank and up the winding exit. None on `canal-old-exit`.
- **The hint:** "Read the water: pale and broken is the shelf, dark is deep. Wheel lines show the way out". The marker rocks and the two signs are unchanged, and so is everything a wheel meets.

## Differences from the design

- **Episode number.** SPEC.md §2 calls this Episode 6; it is built as the game's third episode, number 3.
- **The shoal is shallower and, since v2.22, firmer.** Until v2.22 the engine had one surface for every creek bed under water, so only depth, the current and the two dug-out holes made the straight line fail. A soft bed is now a setting a creek asks for (above). It slows a car to a creep, and does not stop it dead: rolling resistance in the engine sets a speed, and a half-floating car's wheels carry little load.
- **The Unimog wades the straight line.** The short 40 drowns and the LC79 stops in the holes, but the Unimog (intake 2.3 m, 6 t) drives straight through, even on the wet day, and still does over the soft bed (144 s for the scripted run). Not changed: making the holes deeper again would be for one vehicle.
- **Mistake Creek's way in does not punish speed.** Taken in high range at 3 to 5 m/s on the line, the 40 gets down (it pitches 42 to 44°). The wrong line (right wheels in the washed-out hole) hangs the car at 60° and more. A descent that damages a car taken fast would need the damage model to count a hard landing, which it does only for tyres and suspension over rocks.
- **The log bridge is the engine's timber bridge.** It is drawn as sawn boards on posts, not round logs.
- **The shoal cannot be seen from the driver's seat.** The water is a little paler over it and darker over the holes, in 1 m cells, which shows from above and not from the bank. Since v2.20 a rock and two signs mark the line instead (above).
- **The bog's winch rocks.** The design gave the bog a tree at either end. The engine plants winch trees only at the mud holes it makes itself, not at a hand-laid bog, so none grew. Since v2.20 two marked rocks stand in their place (above), as beside the CREB's hand-laid bogs.
- **Rain in the dry season.** The southern episode has no rain. This one has an afternoon of it on every roll, because the mission needs the brook to rise; the briefing calls it showers forecast from mid-afternoon.
- **The falls are low and plain.** A creek's drop is drawn as a step in the bed with the water running over it and white water where it is fast; there is no falling sheet of water or spray. Fruit Bat Falls read as a wide pale step into a dark pool; Eliot and Twin Falls as two short rapids.
- **Which creeks the falls are on is the game's choice** (Hema names none): see `docs/HISTORY.md`.
- **The camping area at Eliot and Twin Falls is not a camp.** The run cannot be saved there: the episode still has one camp, at Cannibal Creek.
- **The dead tree can be driven round.** On the southern episode the tree falls in gallery forest, where the winch is the only way past. The long drive is open heath, so a car can leave the track and pass it; the winch is the tidy way.
- **The drowned car does not go under as the brook rises,** and is not carried by the current: a stranded vehicle stands on the bed where it is put.
- **Telegraph poles and winch rocks** are as on the southern map: the leaning power pole prop, and marked rocks rather than trees.
