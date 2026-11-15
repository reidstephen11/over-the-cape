# Plan: the Telegraph Track (Bramwell Junction to Gunshot Creek)

The owner asked for a new level, "shorter but more challenging" than the CREB Track. This is the design handed over from another session (saved here in v1.96), kept current as decisions differ from it. Where the design and the engine disagree, the engine wins: the nearest thing the engine can do is built, and the difference is recorded under **Differences from the design** below and in the version's notes in `docs/DECISIONS.md`. Numbers are targets to tune by driving, not fixed values.

## Status

- **Stage 1 (v1.96): built.** The episode, map, route with all five obstacles, Gunshot's Chute and the bypass, the camp, mission, briefing, notes with sourced history, and tests (`tests/telegraph.test.ts`, `tests/telegraphDrive.test.ts`).
- **Stage 2 (v1.99): built.** The Staircase and the Slot at Gunshot, an oncoming Troopy, a stranded HiLux paying one plug, and a dead tree down across the track by Ducie or Bertie. The three engine limits (Bertie's holes, Palm Creek's rut, the Chute taken crooked) are still open: see below.
- **Stage 3: after the owner's play test.** Polish (including the three engine limits, the gallery forest's density and Bertie's holes from the seat), and the side trip to the old water gauging station at the Dulhunty.

## The design

The southern Old Telegraph Track on Cape York: a sandy track following the old telegraph line across nearly flat heath and woodland, where the difficulty is the creeks. Each creek has cut its bed several metres below the plain, so every crossing is a steep way in, water, and a steep way out. This is Episode 5 in SPEC.md §2; it is built as the game's second episode.

- Episode id `telegraph`, map id `telegraph`, number 2, title "The Telegraph Track", route "Bramwell Junction to Gunshot Creek".
- Mission: "Get across Gunshot Creek before dark". Goal POI: the camp on Gunshot's north bank.
- Available from the start beside the CREB, with no unlock.

### Why it is shorter and harder

- Route about 2.2 km (the CREB is about 6.6 km), on a map about 1024 × 2048 m, running south to north. A clean run of 12 to 15 minutes.
- No orientation stretch and no teaching signs. The first obstacle is 300 m from the start.
- Five obstacles, each harder than its CREB counterpart, with short stretches between. Nothing on the route is filler.
- A lean load: enough fuel for a clean run plus about a quarter, no jerry cans, one spare, two plugs. One camp only (the Dulhunty, about 60% along).
- Every obstacle must fail in high range with open diffs, and must fail on the wrong line even in low range with both lockers. It must be passable on the right line, at a crawl, without the winch, by a careful driver in the short-wheelbase 40 and the LC79 in dry conditions. In the wet roll, expect the winch at Palm Creek's exit and Gunshot's exit.

### Country and look

- Nearly flat sandy plain, creeks carved 3 to 6 m below it with steep banks.
- Open eucalypt woodland over the whole map except a strip of gallery forest along each creek. Low tree density and termite mounds.
- Pale sand track, white sand in the creek beds, pale grey clay on the creek banks, red dirt at Bramwell Junction.
- A few surviving telegraph poles, leaning, no wire, in a straight line that the track wanders either side of.

### The route, south to north (metres along the route)

1. **Bramwell Junction (0).** Spawn camp. 250 m of corrugated red dirt turning to sand, with swells that pitch a fast car.
2. **Palm Creek (about 300).** Bed 4 to 5 m below the plain. Way in: a chute between clay walls, 30 to 35° for about 12 m, with an erosion rut that wanders across it. Bed: about 0.5 m of water over soft sand. Way out: 28 to 30° of wet clay for about 15 m with a rock step at the lip and a marked winch tree at the top. A second exit to the left: less steep, but off-camber about 18° on clay. Timed section.
3. **Ducie Creek (about 700).** About 30 m wide. The straight line is over a metre deep with current. The line is a submerged bar (about 0.6 m) that hugs the left bank, then turns back across to the exit, with holes either side. Nothing marked in the water; the note describes the line.
4. **The sand (about 850 to 1150).** 300 m of soft white sand with whoops, where 18 psi matters and high pressures bog. One washout too wide to drive, crossed on the planks.
5. **The Dulhunty River (about 1300).** The only camp, on the south bank. Crossing over a rock shelf at the head of shallow falls: three ledges of 0.4 to 0.5 m on wet rock, with the current pushing towards the lip of the falls; drift off the line and a wheel drops off a 1 m ledge. Way out: pale grey clay at about 25°, greasy in every roll.
6. **Bertie Creek (about 1650).** The track runs 70 m up the creek's rock bed, then doglegs out. Holes 0.8 to 1.2 m deep, 1.5 to 2.5 m across, under 0.3 m of water. A wheel in one hangs the car on its belly. The line weaves and at one point puts a hole between the wheels. Holes visible from the driver's seat as darker water.
7. **The Gunshot fork (about 1850).** A signpost. Right: the bypass, about 500 m of easy sand round to the north bank, costing a large fixed part of the score. Straight on: Gunshot.
8. **Gunshot Creek (about 2000).** A 4 m bank of pale clay. The Chute (stage 1): a short run to a lip, a near-vertical drop of about 3 m into a mud hole with about 0.5 m of water; survivable at a crawl with the wheels straight, rolls or damages the car fast or crooked. The Staircase and the Slot follow in stage 2. Below all three: 20 m of bog along the bed, then a 25° clay climb out with winch trees. Timed section. Goal camp on the north bank.

### Mission and conditions

- Start mid-afternoon with dark as the deadline and a grace period; a clean run uses about half the daylight.
- The per-run track conditions roll changes the creek depths and currents and the clay.
- Ghost car, section times, best score and best time per episode. The Army supply run stays on the CREB.
- Briefing: four short paragraphs at most.

### History

State only what a source says, with each claim and source in `docs/HISTORY.md`. The player drives today, retracing a 1986 trip, so the line is gone and the poles are survivors. Not yet sourced well enough to state: the height of Gunshot's drop, and the custom of leaving number plates on a tree there.

## As built (v1.96)

Measured on the generated map and in the scripted drives (`tests/telegraphDrive.test.ts`).

- **Route:** 2,066 m from Bramwell Junction to Gunshot camp; the bypass adds about 470 m from the fork. First obstacle at 300 m (`bramwell-road` is 300 m long).
- **Palm Creek:** water 5.2 m below the plain, 0.5 m deep over sand. In: about 31° for 10 m. Out: about 27–30° for 11 m, a 0.38 m rock step at the lip, two marked rocks above. West exit: 12–15° climbing with about 16° of lean towards the creek.
- **Ducie:** 30 m wide, 1.25 m deep in the middle with a 1.1 m/s current. The line is 0.4–0.6 m deep: in, left along the near bank, round a 6.5 m arc and back across a bar to a 22° soft sand bank out.
- **The sand:** 300 m with swells of up to 0.38 m; the washout is a gully with a 1.3 m gap.
- **Dulhunty:** three 0.42 m rock ledges down from the camp side to a shelf 0.3 m under the water, holes up to 1 m deeper just downstream, the falls (a 1.2 m drop in the water) 15 m downstream, a 0.42 m ledge up out of the water and a clay bank of 25–30°.
- **Bertie:** 3 m in, 70 m up the bed (0.3 m of water), ten holes 1.6–2.5 m across and 0.9–1.2 m deep either side of a weaving line, one 0.9 m hole between the wheels, and a dogleg out at about 24° over a 0.5 m step.
- **Gunshot:** the plain to the creek bed is 4 m; the ground falls about 1.9 m in 3 m below the lip under a 0.55 m band of rock (a face of about 2.4 m), into 0.45–0.6 m of water; 20 m along a muddy bed; out at 21–28°.
- **Load and clock:** 16 L of fuel, no jerry cans, one spare, two plugs, `fuelScale` 12 (a scripted clean run burns about 12 L). 3 pm start, dark at 6:15 pm, one hour's grace, `clockRate` 7: 13 minutes of driving uses 1.5 of the 3.25 hours of light.

## As built (v1.99, stage 2)

- **The Staircase** (`gunshot-staircase`), east of the Chute: from the top of the approach round to the bank, then 4 m down in about 7 m (about 30° on average, past 40° at the foot) over two 0.45 m rock ledges with their risers on the creek side, leaning 8° towards the creek, with a rut down the right wheel line. It crosses the creek to the bed below the Chute.
- **The Slot** (`gunshot-slot`), west of the Chute: 2.8 m wide between clay walls (batter 2.4), twisting 4 m down in about 7 m, with a 0.45 m hole under the left wheels and a 0.35 m hump under the right at the same spot, so a front wheel and the opposite rear lift in turn. It crosses to the bed run.
- **Driven:** both at a crawl with both lockers in the short 40, the LC79 and the Troop Carrier on the dry day; both stop in high range on a just-reopened day.
- **Traffic:** a Troopy along `palm-ducie`. **Stranded:** a HiLux 8 m off `dulhunty-bertie`, paying one plug. **Surprise:** one dead tree a run, on the Ducie or Bertie end of the sand track (`planSurprises` keeps falls 22 m clear of water). No rockfalls: the plain has no cutting banks for rocks to come off.

## Differences from the design

- **Episode number.** SPEC.md §2 calls the southern Telegraph Track Episode 5; the design builds it as the game's second episode, number 2.
- **Bertie's holes do not hang the car.** The wheels are raycast springs: a wheel that drops into a hole is lifted out by the next ray hitting the far rim, so a car crawling straight up the bed tips (a wheel goes 1 m deep, the car leans about 25°) but drives on. The 1 m ground grid could not hold a 2 m hole at all, so the holes are pits in the fine ground detail (0.25 m) for the wheels and deeper bowls in the 1 m ground for the water's colour. The wrong line fails only by tipping; stage 2 should find a way to hold a wheel (an `it.todo` in the tests).
- **Palm Creek's rut does not stop a crooked car.** Same cause: a wheel in the 0.5 m rut climbs out at a crawl. The wrong-line test there is an `it.todo`.
- **The Chute taken crooked lands safely at a crawl.** Taken fast it fails (it went over end on end with a 0.9 m lip; with the 0.55 m lip it pitches past 50° and stops short). The lip is lower and shorter than the CREB knoll's because the LC79 and Troopy grounded their bellies on a 0.7–0.9 m band as their front wheels dropped. With 0.55 m the LC79 gets down; **the Troopy cannot do the Chute** (it grounds on the lip). Not yet tested: the other vehicles.
- **High range at Ducie and the Dulhunty fails on a just-reopened day, not every day.** On the dry roll high range gets over the Dulhunty's shelf and clay. The high-range tests use the just-reopened day (the commonest roll); the crawl tests use the dry day, as the design asks.
- **Tyre pressure in sand is new to the game.** Sand's sink and drag did not depend on pressure. Since v1.96 they do (`sandPressure` in `src/sim/vehicle/tyrePressure.ts`): at 36 psi the sand sinks the tyre 1.5 times and drags 1.6 times as much, at 18 psi 0.7 times. The CREB has no sand, so it is unchanged. Ducie's exit bank is soft sand too, so air down before Ducie.
- **Colours.** The game draws dirt and clay tracks in one colour, so the clay banks and the road from Bramwell Junction are both pale grey; the junction's red dirt is not shown. The creek beds' white sand and the sand track share the pale sand colour.
- **Telegraph poles** are the game's leaning power pole prop, which carries a cross-arm the single-wire telegraph poles did not have.
- **Winch trees** are marked rocks, as on the CREB (the game has no single marked tree to place).
- **The Dulhunty's ledges** are three steps down from the camp side to the water and one up out of it, rather than three each way.
- **The falls** are a drop in the river's water level (1.2 m over about 12 m) downstream of the shelf; there is no falling-water effect.
- **Bertie's holes from the driver's seat** show as darker water through a darker deep-water colour for this map, but they are blocky (1 m cells) and faint at a low angle. Check in the play test.
- **The bypass** costs 250 points, a fixed deduction in `scoreRun` (the simpler of the two choices): the other parts sum to 1000, so a bypass run scores 750 at most and cannot reach gold (800).
- **The Staircase and the Slot are gentler than the design's 45° and 40°** on average (about 30° each over the 4 m bank), because the 1 m ground grid rounds a 4 m drop over 4 m into a slope over about 7 m; their steepest metres are past 40°. The design's "off-camber" Staircase leans 8°.
- **The fallen tree can be driven round.** The design wants surprises that make the track harder. The gallery forest by the creeks renders as open woodland in the game, so a car can leave the track and go round the tree: it costs time, not a winch. Thicker forest along the creeks is for stage 3.
- **History left out:** Gunshot's drop height and the number plates tree (not sourced).
