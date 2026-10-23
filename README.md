# Over the Cape

A single-player 4WD adventure up Cape York, told in episodes, that runs in the browser. Each episode is a stage of the trip north, from the Daintree to the tip of Australia, with its own map, a core mission, the weather and time of day the story sets, and a starting load of fuel, spare wheels and tyre plugs, which side trips off the main line can add to. Run out of fuel, get stranded with a flat and nothing to fix it with, wreck the engine or miss the deadline, and the episode ends; you restart from the last camp you reached. History notes at the places you pass tell what happened there.

The story follows a grandparent's 1986 trip up the Cape through their diary, and the vehicles are being rebuilt with more accurate body shapes: see [SPEC.md](SPEC.md) for the game's direction.

It is built on the code of [4WD Simulator](https://github.com/reidstephen11/4wd-simulator) and keeps its look and driving: Three.js, Rapier physics and TypeScript, with everything (terrain, trees, leaf textures and sound) generated in code and no downloaded asset files.

## Play

**Online:** https://reidstephen11.github.io/over-the-cape/ (deployed from `main` by GitHub Actions).

**Locally** (Node 20 or newer):

```bash
npm install
npm run dev        # then open http://localhost:5173
```

| Script             | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run build`    | Type-checks and builds the static site into `dist/` |
| `npm run preview`  | Serves `dist/` at http://localhost:4173             |
| `npm run lint`     | ESLint and Prettier check                           |
| `npm test`         | Unit and headless physics tests (Vitest)            |
| `npm run test:e2e` | Browser tests (Playwright; builds first)            |

The game opens on the **welcome screen**: choose the episode, whether to continue a run from its last camp or start again, the vehicle and the difficulty, then press **Drive** (or Enter). While the map builds, the episode's **briefing** gives the story, the mission, the conditions and what's on board; press **Drive** again to start. **Pause menu → Main menu** comes back to the welcome screen, and your progress is kept.

The version number (for example v0.01) is on the loading screen and the pause menu, and goes up by 0.01 with every update merged into `main`. Hover over it to see the exact build.

## Episodes

They run south to north and unlock in order: finish one to open the next. A finished episode can be replayed, in the story's conditions or in your choice of time of day and weather.

| #   | Episode               | Route                                                | Status       |
| --- | --------------------- | ---------------------------------------------------- | ------------ |
| 1   | The CREB Track        | Daintree Village to the Lions Den Hotel              | Playable     |
| 2   | The Old Coach Road    | Maytown to Laura through the Palmer River goldfields | Playable     |
| 3   | Lakefield             | Laura to Musgrave through Lakefield National Park    | Playable     |
| 4   | The Frenchmans Track  | Across the Pascoe and Wenlock rivers                 | Coming later |
| 5   | Telegraph Track South | Bramwell Junction to Gunshot Creek                   | Coming later |
| 6   | Telegraph Track North | The waterfalls, the creeks and Nolans Brook          | Coming later |
| 7   | The Tip               | Over the Jardine to the northernmost point           | Coming later |

### Episode 1: The CREB Track

**Mission: reach the Lions Den Hotel before dark.** June, the track has just reopened after the wet, and it rained overnight. You leave Daintree Village at 12:30 pm; it's dark at 6:15 pm. Storms are forecast from 3 pm. On board: 50 L of fuel, one 20 L jerry can, one spare wheel and three tyre plugs.

The map is a long strip, 1.3 km wide and 6 km from south to north, with about 6.6 km of track up its length. The real trip is over 100 km, so the distances are shortened; the obstacles are full size.

1. **Daintree Village** (camp) to the **Daintree River crossing**: wide and over a metre deep in the middle. A gravel bar downstream keeps it about half that, but after the wet the bar is strewn with boulders and scoured into holes over a metre deep, right across the straight line over it: weave between them. The river is running fast after the rain: the current pushes the car downstream, and in the deep water it can carry it away. Crocodile country: you never leave the car.
2. Through the **Upper Daintree paddocks** on a fast gravel road to the foot of the range. It is pocked with potholes (signposted): at about 30 km/h they only rattle the car, but much faster they pinch the tyres. One deep bog lies in a hollow on the river flats.
3. **Big Red**: about 130 m of red clay at around 20°, greasy after the rain and scored with deep cross-ruts. High range won't get up it, nor low range with the diffs open: low range with both lockers will. The **Big Red bypass** leaves the paddock road just before, and winds up the west side at no more than about 15°.
4. Along the range through the rainforest (a signposted spur east leads to the **Old line camp**, with two tyre plugs), down into a saddle with a **deep bog** in it (or round it on the rough, leaning **chicken track** to the west), over a steep clay pinch that also needs low range and the lockers and a **washout** cut right across the track (signposted), which needs the planks in every vehicle but the Unimog, to **Roaring Meg camp**, then the fast ford over **Roaring Meg Creek** and up its slippery bank, with a short track to **Roaring Meg Falls**. The falls are just downstream of the ford. Above the gorge the track climbs a **rock ledge** about a metre high: crawl up it in low range with both lockers.
5. **Bob's Hill**: a steep, rutted pinch at about 21°. Like Big Red it needs low range and both lockers.
6. Along the range top, round a **sideling** that leans the car over towards the drop, and where a track signposted **Old line** follows a few leaning poles down the west flank to the **Linesman's hut** and a full jerry can; then the **range lookout**, then **the concrete**: a long switchback descent with concreted pinches at about 20°. Where it swings west, the **steep shortcut** runs straight down the spur over rock ledges: quicker, but crawl it in low range or the rock cuts your tyres.
7. **Donovan's Creek**, the **Bloomfield River** bridge at Wujal Wujal (camp), and a track west to **Wujal Wujal Falls**.
8. North on the gravel **Bloomfield Track**, across three fast **creeks** coming off the hills (one with a scour hole just below the ford), through **Rossville**, across the **Little Annan River**, to the **Lions Den Hotel**. The road fords the river where it is deepest; the longer **shallow crossing** goes downstream over a gravel bar at about half the depth.

After the wet the red clay tracks are slick, the gravel roads are bumpy and potholed, and the range tracks are washed out, with channels cut across them. The potholes and washouts deep enough to pinch a tyre at speed are dark, ringed with pale gravel. Each stretch has its own kind of trouble (above) rather than mud all the way: the mud lies where the ground holds water, in four deep bogs and two long boggy stretches of 25–45 m (on the ridge below Roaring Meg camp, and on the Bloomfield Track north of the bridge), full of brown water so you can't see how deep they are. Where a hole sits in a hollow the land drains into, it is a **deep bog**, 0.7 m of sticky black mud under the water: few vehicles get out without the winch, and a tree stands near either end to winch from. Off the tracks most of the flatter ground is wet **black soil**, dark beside the firm verge: drive onto it and you crawl at walking pace, and on any slope you stop. Drive fast and the car bounces off the swells and slides on the clay. The creeks run fast and deep: Donovan's Creek and the Little Annan push hard, and the Daintree's deep middle stops a car dead.

**The afternoon storm.** Showers come in at 3 pm (a note on screen tells you), build to heavy rain by 5 pm and ease at dusk. The sky darkens, the rain drums on the roof, and the clay gets greasier the longer it rains. The creeks rise and run faster: muddier, deeper and pushing harder. At 5 pm the Little Annan is about 15 cm up and anything gets across in low range; by 5:45 it is over 20 cm up, and the short-wheelbase 4WD crawling across is swept away: keep a steady 15 km/h through it, take the shallow crossing downstream, or get there earlier. The little creeks across the Bloomfield Track rise less. Restarting from a camp brings back the weather and the creeks as they were when you got there. Replays in conditions you choose keep the weather you picked.

The map is rainforest (canopy trees on buttress roots, fan palms and tree ferns) except for open eucalypt woodland round the village, the paddocks and the drier hills by the Lions Den. A fallen tree lies across the track on the range: winch it aside or squeeze past.

**Surprises.** The route isn't the same every run. After the wet, dead trees come down and the clay cuttings shed rocks: each run, two dead trees fall across the track somewhere along the way (in the timber at the top of the paddocks, through the rainforest on the range or on the Bloomfield Track), and rocks come off a cutting's bank onto the track somewhere on the range. You see the dead tree standing at the roadside, then as you come along it cracks and crashes down across the track 45–70 m ahead (further ahead the faster you're going, so there's room to stop): never onto the car. Hook its crown end and winch it round so it lies along one side, then squeeze past on the other. Rocks land on the bank's side of the track, two big ones and a scatter of small ones you can crawl over in low range: keep to the far side, or winch a big one aside. Where they happen changes with each new run; restarting from a camp brings the same ones back in the same places.

Beyond the map's edge the real country carries on to the horizon, brought in closer and lower in step with the map. East, between the range and the Coral Sea, stand Thornton Peak, Mt Pieter Botte, Mt Sorrow behind Cape Tribulation, and Mt Finnigan's granite tops, and the Daintree and the Bloomfield run out to the sea. West, rainforest ranges rise to the flat-topped tablelands of the Great Dividing Range. North of the Lions Den the country dries out to open woodland round the black boulder heaps of Black Mountain. South are the Daintree's cane and cattle flats and the ranges towards Mossman. Far land fades into the sky with distance, as it does on a humid day.

### Episode 2: The Old Coach Road

**Mission: through Maytown to Laura before dark.** August, the middle of the dry season: the rivers are down to shallow runs of water over wide beds of soft sand. You leave the Palmer River at 10:00 am; it's dark at 6:30 pm. On board: 50 L of fuel, one 20 L jerry can, one spare wheel and three tyre plugs. There is no fuel on the way.

The map is 1.3 km wide and 7.2 km from south to north, with about 7 km of road on the main line. The real trip is 70-odd km.

1. **Palmer River camp** to the **Palmer River**: a shallow channel across a wide bed of soft sand. Keep moving: stop in the sand and the wheels dig in.
2. The ruins of **Maytown** (camp), the goldfield's town from the 1870s: the baker's oven, two chimneys, the stone kerbing of Leslie Street, a rebuilt hut and the cemetery.
3. North on the **old coach road** through open woodland and termite mounds to the **North Palmer River**, where it divides: straight through the sand, or upstream over a bar of rock (signposted "Rocky crossing").
4. The **Conglomerate Range**, three ways up its face: the **middle line** goes straight up over bands of rock (low range and both lockers, and don't spin the wheels on the rock); the **old coach road** (signposted) slants up to the west in deep ruts; the **bypass** (signposted) winds round to the east, long but easy.
5. Along the range top past the **Hotel site** (camp) to the **big step**: a sandy gully and a metre of bare sandstone out of it, or the **eastern track** (signposted) round it.
6. The steep, rocky **descent** off the north face: low range, first gear, and let the engine hold you back.
7. North through two dry creek beds of sand, across the **Little Laura River**, into **Laura**.

The country is dry eucalypt woodland, straw-coloured grass and orange dirt, with termite mounds from knee height to taller than a person (they're solid: don't hit one). Beyond the map's edge, south are the goldfield's hills, the Conglomerate Range runs on east and west, and north round Laura stand the flat-topped sandstone escarpments of Quinkan country.

### Episode 3: Lakefield

**Mission: winch the stockman out of the bog, then get over Hann Crossing before the river covers the bar, and on to Musgrave.** The first episode told from the grandparent's diary: Friday 28 November 1986, the first storm of the wet came through Laura last night, and a stockman who set out north yesterday hasn't turned up. You leave Laura at 11:00 am. Storms come in from about 1 pm, and rain up in the ranges brings the North Kennedy River up over the bar at Hann Crossing by about 3 pm: that's the deadline. Once you're over it and at the camp on the north bank, there's no hurry. On board: 50 L of fuel, one 20 L jerry can, one spare wheel and three tyre plugs.

The map is 1.3 km wide and 7.2 km from south to north, with about 6.8 km of road. The real trip is about 200 km.

1. **Laura** (camp) north to the **Laura River**: sand on both banks and a shallow run of water.
2. **Old Laura homestead** (camp) above the river: the old station house, a shed and a tank.
3. North through open woodland and termite mounds, then out onto **the plains**: open grass with the odd tree, and off the road it's all **black soil**. Keep to the road. Its holes fill with water once it rains.
4. **Lakefield** (camp), the old homestead on the plains.
5. **The stockman**: his old Land Cruiser is down to its axles in black soil just off the road's east side, nose towards it. Stop on the road facing him, hook the winch to his bull bar (E) and winch in (R). Your brakes hold your car on the road while the winch does the work (light cars still get dragged a little towards him). Once he's out, his driver unhooks the line and has a word. The episode can't be finished without him.
6. **Hann Crossing** on the North Kennedy River: a bar across the river where the water runs about 40 cm deep in the morning. Either side of it the river is deep. It comes up once the rain sets in, and by 3 pm it's too deep to drive.
7. **Hann Crossing camp** on the north bank, then north through the woodland to **Musgrave**, the old telegraph station.

Beyond the map's edge the country stays flat, with the sandstone of Quinkan country behind Laura to the south and low ranges far off to the east.

## How an episode works

- **The mission and the clock** sit in the top left: what to do, the time of day and the deadline. The mission line moves on as you do each part (in Lakefield: the stockman, then the crossing, then Musgrave), and a deadline that only holds until a place (Hann Crossing) drops off the panel once you're there. The clock runs while you drive (eight game minutes a real minute on the CREB, 17 on the Old Coach Road, 14 in Lakefield) and stops while paused. The sun moves with it, through late afternoon to dusk, when the headlights come on by themselves.
- **Camps save the run.** Reaching a camp saves where you are, the clock, what's on board and whether you've pulled the stockman out. Pause menu → **Restart from last camp** goes back to it as things were then. A camp also mends the engine and suspension and patches punctures; it doesn't hand out fuel, spares or plugs. It keeps what you'd found by then: restart from it and anything picked up after it is back where it was. A tree or rocks that came down before the camp stay down; those still to come happen again the same way.
- **History notes** appear in the top right as you reach a place. Click one to close it.
- **The episode ends early** when, with the difficulty that allows it:
  - the tank is empty, you have no jerry cans left and the car has rolled to a stop (any difficulty);
  - the deadline passes (any difficulty);
  - the current lifts the car and carries it downstream (Mild and Realistic);
  - a tyre is flat and there's nothing left to fix it: no spare, and no plug that fits (Realistic);
  - the engine is wrecked (Realistic).

  The "Episode over" card says why and offers **Restart from camp** or **Main menu**.

- **Reaching the goal** shows the closing history and how the run went (time driven, arrival time, fuel and spares left), with **Next episode** (or Main menu) and **Keep driving**.

## Fuel, spares and plugs

- **Fuel** burns with the work the engine does: little at idle, far more climbing in low range or spinning the wheels. The map shortens the real distance, so it burns faster to match: the autopilot's clean run of the CREB uses about 54 L of petrol in the short-wheelbase 4WDs (more than the 50 L in the tank, so the jerry can goes in on the way), 37 L of diesel in the Land Rover, 40 L of petrol in the Hilux and 66 L of diesel in the Unimog (the jerry can goes in, with very little to spare), 49 L of diesel in the Troop Carrier, 42 L of diesel in the GQ Patrol and 63 L of diesel in the LC79 V8 (the jerry can goes in). On the Old Coach Road it is about 51 L in the short-wheelbase 4WDs (the jerry can again), 35 L in the Land Rover, 42 L in the Hilux, 46 L in the Troop Carrier, 40 L in the Patrol, 52 L in the LC79 (the jerry can) and 69 L in the Unimog (the jerry can, with under 2 L to spare). Through Lakefield it is about 56 L in the short-wheelbase 4WDs (the jerry can) and 39 L in the Land Rover. Rough roads, mud and clay cost fuel, and so does every time you get stuck. The gauge is above the status strip, in litres.
- **Jerry cans** hold 20 L. Tool menu → **Pour in a jerry can**, stopped, about 12 s. If the engine ran dry it restarts on the starter afterwards.
- **Tyres** can be hurt two ways with Realistic damage: a **puncture** leaks down over about 40 s and takes a **plug** from the kit (tool menu → Plug the tyre, about 10 s); a **torn sidewall** goes flat in a few seconds and needs a **spare** (tool menu → Fit a spare, about 8 s). A landing of about a metre onto rock punctures a tyre; about one and a half metres tears the sidewall. Spinning a wheel hard on rock for several seconds wears through the tread. Crawling in low range barely spins. Dropping into a pothole or washout at speed pinches the tyre (a puncture): a deep one from about 40 km/h, and the faster the likelier; from about 55 km/h it can bend that corner's suspension too. A tyre going down squashes flat at the bottom; flat, its corner sits low, it thumps once a turn at speed, it grips poorly in corners and drags, and a flat front tyre pulls the car hard towards its side.
- **Finds off the main line.** Two side tracks on the range lead to huts with something to load: two tyre plugs at the Old line camp (a short level spur off the ridge, signposted "Line camp") and a full 20 L jerry can at the Linesman's hut (about 110 m down the range top's west flank along the old poles, signposted "Old line", with a greasy climb back up). Drive up to the crate by the hut and stop: it goes on board and the counts go up. Each can be taken once. The trip costs daylight and a little fuel, a few minutes there and back; neither is needed on a clean run, but either can save a run that's gone wrong.
- The status strip shows the planks on board ("Planks 2/2"); the supplies panel counts jerry cans, spares and plugs.

## Difficulty

The welcome screen's **Difficulty** is the damage setting (also in pause menu → Settings → Damage). It decides what can hurt the car, and so which ways an episode can end.

| Setting   | Damage                                                                                     | Ends the episode                                                       |
| --------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Off       | None (the body still dents and gets dirty)                                                 | Empty tank, deadline                                                   |
| Mild      | Tyres go soft, corners bend, the engine loses power; tool menu → Field repair fixes it all | Empty tank, deadline, swept away                                       |
| Realistic | Punctures and torn sidewalls, bent corners, the engine can be wrecked                      | Empty tank, deadline, swept away, a flat with no fix, a wrecked engine |

## Vehicles

Pick one on the welcome screen. Pause menu → Vehicle changes it mid-episode, but the run restarts from your last camp in the new one. Each episode sets what you start with, and the Troop Carrier carries more on top: its 60 L sub-tank, full, and a second spare wheel. These come only at the start of an episode: changing vehicle at a camp carries what's on board across as it is, and fuel that won't fit the new vehicle's tank is left behind.

| Vehicle                 | Based on                                                      | Engine and gearbox                                                | Tank                     |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------ |
| Short-wheelbase 4WD     | 1970s Land Cruiser 40 Series                                  | 4.2 L petrol six, three-speed automatic                           | 70 L                     |
| Camel Trophy 4WD        | The short-wheelbase 4WD in Camel Trophy dress, with a snorkel | Same                                                              | 70 L                     |
| Land Rover 110 Perentie | The Australian Army's Land Rover 110                          | 3.9 L Isuzu four-cylinder diesel, LT95A four-speed with low range | 79 L                     |
| Hilux single cab        | 1979–83 Toyota Hilux 4WD with the styleside tub               | 2.0 L petrol four, four-speed manual with low range               | 65 L                     |
| Unimog UL1700L          | The Australian Army's Mercedes-Benz Unimog 4-tonne truck      | 5.7 L turbo-diesel six, four road gears and four field gears      | 160 L                    |
| Troop Carrier           | 1990s Toyota LandCruiser 75 Series Troop Carrier              | 4.2 L diesel six, five-speed manual with low range                | 90 L and a 60 L sub-tank |
| GQ Patrol               | Late 1980s–90s Nissan GQ Patrol wagon, set up for touring     | 4.2 L TD42 diesel six, five-speed manual with low range           | 95 L                     |
| LC79 V8                 | Current Toyota LandCruiser 79 single cab, built up hard       | 4.5 L twin-turbo diesel V8, tuned; five-speed with low range      | 130 L                    |

Since v0.21 every body is closer to the real vehicle: rounded panels where the real one has them, the right headlamps, grilles and mirrors, and bull bars of the right shape. The Perentie carries the Army's pick, shovel and axe on its bonnet.

The 1986 Camel Trophy started at Cooktown, and Army Perenties served across the north. The Camel Trophy 4WD drives like the short-wheelbase 4WD but breathes through its snorkel, so it wades much deeper water before it floods; the current can still take it. The heavier Land Rover holds its ground in a current a little longer. The red Hilux, the first Hilux with 4WD, is light and thrifty: its small petrol four uses about a third less fuel than the six, but it is slower and needs low range sooner, and its long wheelbase and tub hang out further behind the rear wheels. It carries its recovery boards on a ladder rack over the tub. The Army Unimog is the slow, heavy one: 6.4 t on 1.1 m tyres and portal axles, with the most ground clearance by far, a crawling low range, lockers that engage on the move up to 15 km/h, and a winch that pulls three times as hard as the Land Rover's. It tops out at about 68 km/h and takes much longer to get there, and it is thirsty. On a side slope it tips at about the Land Rover's angle. It wades water that would carry the others away, and breathes through a stack behind the cab. Its pintle hook is ready for trailers, which come in a later update. The white Troop Carrier, a common sight on Cape York trips, is the long-range choice: on the CREB it starts with 110 L of diesel and two spare wheels. It is the heaviest and tallest of the 4WDs (only the Unimog truck is bigger): slower to get going, it turns a wider circle, it rolls over in a full-lock turn at 50 km/h (the other 4WDs hold on to 60) and on a slightly gentler side slope than the others, and its long body hangs well out behind the rear wheels. Its weight also holds it on the riverbed: water that carries the smaller vehicles away only pushes it a few metres, and it takes deeper, faster water (about 1.5 m running at 2.5 m/s) to carry it off. It still floods once the water reaches its air intake, like the Land Rover's. Its second spare, a jerry can and the recovery boards ride on the roof rack. The GQ Patrol wagon, the other classic Cape tourer, came across from the 4WD Simulator: white over charcoal, with a bull bar carrying the winch and two driving lamps, a snorkel up the windscreen pillar and a full-length roof rack. At about 2.4 t it sits between the Land Rover and the Troop Carrier, and it has the longest wheelbase of the 4WDs (2.97 m), so mind its belly on crests. Its TD42 diesel six is slow and steady, with a knock you can hear, and the snorkel lets it wade water that would flood the Land Rover or the Troop Carrier, though the current can still take it. It starts with the episode's load, like the others. Its driving lamps come on with high beam. The LC79 V8 is the modern one: a current LandCruiser 79 single cab built up hard, with a 4 inch lift on coils, 37 inch mud tyres, a steel bar with a winch, driving lamps and a light bar, a snorkel up the right pillar, and an alloy tray with a black canopy, the recovery boards on its roof rack and the spare on a carrier off the back. Its tuned twin-turbo V8 diesel (about 200 kW and 750 Nm) makes it by far the quickest, about 4½ s to 60 km/h, and you can hear it: a deep V8 burble, the turbos whistling as they spool, and a whoosh when you lift off. It is thirsty, though: on the CREB it needs the jerry can. At 3 t on a 3.18 m wheelbase it is heavy and long, and the tray hangs out behind the rear wheels, but the wide track keeps it on its wheels in a full-lock turn at 50 km/h, and its snorkel head is the highest of the 4WDs.

## Controls

| Action                        | Keyboard                                              | Gamepad                                              |
| ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Accelerate                    | W / ↑                                                 | RT                                                   |
| Brake / reverse               | S / ↓ (hold when stopped to reverse)                  | LT                                                   |
| Steer                         | A D / ← →                                             | Left stick                                           |
| Handbrake on / off            | Space (press again to let it off)                     | X / Square                                           |
| Toggle high/low range         | L (below 20 km/h)                                     | Y / Triangle                                         |
| Front / rear diff lock        | Z / X (below 5 km/h to engage)                        | Hold LB → front / rear diff                          |
| Precision crawl               | P                                                     | Hold LB → precision crawl                            |
| Winch quick attach / detach   | E                                                     | RB                                                   |
| Winch in / out                | R / F                                                 | D-pad up / down                                      |
| Tool menu                     | Hold Q, point with the mouse, arrows or WASD, release | Hold LB, point with the left stick or d-pad, release |
| Interact (pick up planks)     | E (when prompted)                                     | A / Cross                                            |
| Right vehicle                 | Hold J (when prompted)                                | Hold B / Circle                                      |
| Orbit camera                  | Mouse drag (left or right button), or Num 4/6/8/2     | Right stick                                          |
| Camera distance               | Scroll                                                | D-pad left/right while driving                       |
| Recenter camera               | V or Num 5, or the Reset view button                  | Right stick click                                    |
| Cycle crawler / driver views  | C, or the View button                                 | Hold LB + click right stick                          |
| Crawl gauges: auto / on / off | I                                                     | Shown in low range                                   |
| Horn                          | H                                                     | Left stick click                                     |
| Headlights: off / low / high  | N                                                     | Hold LB → headlights                                 |
| Map                           | M (scroll to zoom, drag to move it)                   | View / Select                                        |
| Pause                         | Esc                                                   | Start / Options                                      |

The **tool menu** holds: Winch (or Detach winch), the front and rear diff locks, Place planks (or Recall planks), precision crawl, the headlights, the repair the car needs (Field repair, Plug the tyre or Fit a spare) and Pour in a jerry can. Finds load by themselves when you stop beside them. An option that can't be used now is greyed out; picking it says why ("Stop first", "No spares left"...).

Placing planks: choose **Place planks** in the tool menu, move them with W/S, turn them with A/D, place with E, cancel with Esc. Prompts switch between keyboard and gamepad glyphs depending on what you last touched.

### Phones and tablets

On a touch screen the game shows on-screen controls, held sideways or upright. The fuel and supplies and the mission panel sit under the status strip at the top left; held sideways the mission panel shows only the clock and deadline. On reaching a place, its history note stops the game and shows in the middle of the screen; tap it to carry on. LOW, CRAWL and the diff locks sit behind the 4WD button, which opens them in a row above it; while it's closed, its letters L, C, F and R light up for each one that's on. Held upright, the view widens so the car and the windscreen don't fill the screen, prompts such as "USE Attach winch" sit just above the buttons on the right, and the crawl gauges sit top right under the fuel.

| Action                                | Touch                                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| Steer                                 | Joystick, bottom left (push part way for part lock)            |
| Accelerate / brake and reverse        | GAS / BRAKE, bottom right (hold BRAKE when stopped to reverse) |
| Handbrake on / off                    | HAND                                                           |
| High / low range                      | 4WD, then LOW                                                  |
| Precision crawl, diff locks           | 4WD, then CRAWL, F LOCK, R LOCK (tap 4WD again to tuck away)   |
| Winch attach / detach, pick up planks | USE                                                            |
| Winch in / out                        | Hold IN / OUT (shown while the winch is attached)              |
| Right vehicle                         | Hold UPRIGHT (shown when needed)                               |
| Tool menu                             | TOOLS, then tap an option (tap the space around it to close)   |
| Orbit camera / camera distance        | Drag a finger on the view / pinch with two fingers             |
| Cycle views / recenter camera         | View and Reset view, top right                                 |
| Map / pause / full screen / lights    | MAP, II, ⛶ and LIGHTS, top left                                |

## Driving tips

- **Low range (L)** and **precision crawl (P)** for the climbs and descents: hold W for a steady walking pace, let go and it brakes to a stop. On Big Red and Bob's Hill lock both diffs (**Z**, **X**) below 5 km/h.
- The red clay is slick after rain: brake early, keep a steady throttle (spinning the wheels digs you in), and lock both diffs in low range before you start up any steep pinch, not halfway up it.
- Take the mud holes steadily, in a low gear, without stopping in them.
- At the **washout** stop short of the gap, square up, choose **Place planks** and slide them out until they bridge it under the front wheels, then crawl over in low range. Recall them from the tool menu once you are well past. The Unimog's big wheels climb straight through it.
- Crawl up the **rock ledge** in low range with both lockers. Spinning the wheels on the rock cuts the tyres.
- On the **sideling** crawl, keep to the high side and don't turn downhill: taken fast on the wet clay, the car slides towards the drop.
- Slow right down before the **creeks** on the Bloomfield Track and keep moving once you are in: stopped in the current, the car is pushed downstream into the scour hole below the middle one.
- **C** cycles the views; the front views look across the tyres to place a wheel, the driver's seat has working dials. **I** shows the crawl gauges (pitch, roll and the load on each tyre).
- In deep water watch the air intake: water at the intake stalls the engine (with Realistic damage it can wreck it). Cross the Daintree on the gravel bar in low range with both lockers, weaving between its boulders and the darker water of its holes, and keep moving, steering upstream against the current: stop on the bar and the current slowly pushes the car off it, and taken quickly in high range the short-wheelbase 4WD is pushed off it into the deep water. Stopped in deep running water, the car is lifted and carried off: "Deep, fast water" warns you, "The current is taking the car" means get to shallow water now.
- On the gravel roads about 30–40 km/h is a fair pace, and less on the clay. Faster, the swells bounce the car and the potholes and washouts (the dark ones ringed with pale gravel) pinch tyres.
- Stay on the track: the dark ground off it is black soil, and bogs you. Cutting a corner onto it costs minutes.
- **Winching someone else out:** stop on firm ground facing them, hook on and winch in. The brakes hold your car while you winch; if you're light and it's wet you'll slide a little towards them, so leave some room. Let go of the winch once they're out.
- The winch reaches any tree within about 30 m. Rainforest trees are everywhere on the range, and a tree stands near each end of every deep or long bog. Bogged in a deep one, hook up to the tree ahead (E), winch in (R) and drive gently with it.
- **Soft sand** (the pale ground in the dry riverbeds) drags the car and lets the wheels dig in. Take it steadily in a low gear and keep moving: stopped in it, the car has to climb out of its own ruts.
- On the Old Coach Road's **middle line** and at the **big step**, crawl in low range with both lockers and let the tyres climb the rock rather than spin on it. Going down the **descent**, low range and first gear hold the car back.
- **Termite mounds** are as hard as rock. Steer round them off the road.
- At a fork, the sign names the other line. The short line is the quicker one if you drive it well; the long way round is there for when it's going badly, or the river is up.
- A tree down across the track: stop well short of it, on the side its roots are, and pick **Fallen tree (crown end)** with the tool menu's Winch (E picks the nearest hook, which may not be the one you want). Winch in on the handbrake, holding the brake so the car doesn't creep towards the tree, and the crown swings round towards you; stop once it's round, or the winch drags the whole tree towards you; if it still lies across, back up a few metres and pull again. Then back off and drive past on the other side.
- Keep an eye on the clock once it rains: the creeks only get higher. In a risen creek, a steady pace in high range can get the short-wheelbase 4WD across where crawling lets the current take it.
- Got a flat? Stop and fix it: a flat tyre pulls the car off line and makes the corners treacherous.

## Debug mode

Add `?debug` to the address. You get an overlay (frame rate, draw calls, vehicle state, flooding, sound levels) and a panel with a free-fly camera (also the **backtick** key), collider wireframes, a button that moves the clock on 30 minutes (to try the storm and the dusk), a teleport button for every place on the map and live vehicle tuning sliders.

Add `?seed=7` (any number) to start a new run with that run's surprises, to see the same ones again, or `?surprises=off` to drive without them.

## What to test

- [ ] It loads from the Pages link in current Chrome, Firefox and Edge, and on a phone.
- [ ] **Welcome screen:** Episode 1 is open; Episodes 2 and 3 are listed but shut until the one before is finished; episodes 4–7 are listed as coming later. Pick a vehicle and a difficulty; Drive shows the briefing while the map builds, then Drive again starts at Daintree Village.
- [ ] **The CREB Track, start to finish:** cross the Daintree on the gravel bar, climb Big Red (or take the bypass), reach Roaring Meg camp, climb Bob's Hill, take the concrete down, cross Donovan's Creek and the Bloomfield bridge, and drive the Bloomfield Track to the Lions Den before dark. How long did it take, how much fuel was left, and did the clock feel fair?
- [ ] **v0.26 test fix:** the loading screen and pause menu show v0.26. Nothing else changed.
- [ ] **v0.25 backlog fixes:** the loading screen and pause menu show v0.25. Pick the Unimog, then the LC79: the follow camera should sit far enough back to see the whole vehicle and the track ahead. In Episode 2, the Maytown sign on Leslie Street should stand beside the road, not on it; in Episode 1, so should the two "Falls" signs. The status strip reads "Planks 2/2" instead of just "2/2". Look at the dirt roads where they run at an angle: are the edges smooth, with no zig-zag?
- [ ] **v0.24 test fix:** the loading screen and pause menu show v0.24. Nothing else changed: the welcome screen should still list episodes 4 to 7 as coming later.
- [ ] **v0.23 Episode 3, Lakefield:** the loading screen and pause menu show v0.23. Finish Episode 2 and press **Next episode**: the welcome screen should open on Episode 3. Does the briefing's diary entry read well, and does it make you want to find the stockman? Drive from Laura over the Laura River, past Old Laura homestead and out onto the plains. Do the plains look like open black soil country? Try driving off the road: does it bog you? At Lakefield read the note, then find the stockman: is his Land Cruiser easy to spot, and does it look properly bogged? Winch him out from the road: was it clear what to do, did your car slide towards him, and how long did it take? Read what he says. Then get to Hann Crossing: what time was it, and how deep was the water? Try arriving late (pause menu → Restart from last camp at Lakefield, and dawdle) to see the river come up and the deadline end the run. Once over, does the deadline leave the panel? Reach Musgrave and read the closing note. Was this goal more interesting than "get there before dark"?
- [ ] **v0.22 the LC79 V8:** the loading screen and pause menu show v0.22. On the welcome screen pick **LC79 V8** (the eight vehicle buttons should fit, on a phone too). Walk round it: round LED headlamps in a wide black mesh grille, the bonnet scoop, the bar with its winch, driving lamps and light bar, the snorkel up the right pillar, the flares over the big tyres, the tray with its canopy, and the spare hanging off the back. Look for anything floating or cutting through, especially round the rear wheels. Press C for the driver's seat: the dials working and not hidden by the wheel. Listen: does it sound like a V8 diesel, with the burble at idle and the turbo whistle when you floor it? Drive the CREB: does it feel powerful but heavy? Does the tray's tail catch on crests? Press N twice for high beam: the driving lamps and light bar should come on. Does the follow camera sit too close behind the canopy?
- [ ] **v0.21 more realistic vehicles:** the loading screen and pause menu show v0.21. Pick each vehicle in turn and walk round it (drag the view), front, sides, back and underneath. Does each look like the real one? Look for anything floating, cutting through the body or missing. The 40 Series: round headlamps in square chrome bezels, a flat bonnet above the guards, round mirrors on stalks. The Camel Trophy car: the decals sit on the doors and bonnet, and the snorkel runs up the left windscreen pillar without touching the mirror. The GQ: rounded front corners, the driving lamps under the bar's top rail. The Troop Carrier: a square front with rounded corners. The Hilux and the Perentie: the three-hoop bars. The Unimog: mudguards clear of the wheels, nothing hanging in the air at the back. The Perentie: the pick, shovel and axe on the bonnet. Drive at night and press N twice: do the headlight beams start at each lamp, and do the GQ's driving lamps light up?
- [ ] **v0.20 the game's direction:** nothing changes in the game. Read the new parts of SPEC.md (the story and goals in §2a, the more realistic look in §5a, the quieter HUD in §6): do they match what you want?
- [ ] **v0.17 Episode 2, the Old Coach Road:** finish Episode 1 and press **Next episode**: the welcome screen should open on Episode 2. Read the briefing, then drive from the Palmer River camp. Cross the Palmer's sand: does the soft sand feel different from dirt, and does stopping in it bog you? Look round the ruins of Maytown (baker's oven, chimneys, kerbing, hut, headstones). At the North Palmer, try both lines. At the range face, try the middle line in high range (on Realistic you should spin and cut tyres), then in low range with both lockers; try the old coach road and the bypass. Is each sign easy to see? Climb the big step or take the eastern track, crawl down the descent, cross the Little Laura and reach Laura. How long did it take, did you need the jerry can, and did you get in before dark? Do the termite mounds look right, and are there too many or too few? Does the woodland look like dry Cape York country?
- [ ] **v0.15 varied stretches:** drive the route and note how each stretch feels different. The paddock road: fast and potholed, with no mud but one deep bog early on; try it at 30 km/h, then faster (on Realistic you should pinch a tyre). The ridge: a washout across the track past the "Washout" sign; try to drive over it (you can't, except in the Unimog), then bridge it with the planks. The rock ledge above Roaring Meg: try it in high range (you should spin and cut a tyre on Realistic), then crawl up in low range with both lockers. The range-top sideling: does the lean feel scary but fair? Taken fast, the car slides towards the edge. The Bloomfield Track: three creek crossings; at the middle one, stop in the water and see what the current does. Is the route more interesting than before? Too hard anywhere? Did you miss the mud?
- [ ] **v0.12 side trips:** on the ridge after Big Red, take the "Line camp" spur and stop by the crate at the hut: the plug count goes up by two. On the range top after Bob's Hill, follow the "Old line" sign and the poles down to the Linesman's hut and stop by the crate: one more jerry can. Drive back up to the main track. Was each trip worth the time? Reach Bloomfield camp, go back to the hut (or restart from Roaring Meg camp): after a restart from a camp reached before a find, it's back at its hut.
- [ ] **v0.07 the long map:** open the map (M): it is a tall, narrow strip with the route up the middle and the rivers across it. Drive the route: about 6.6 km, 40% longer than before, with the clock running faster. Did you arrive before dark, and how close was it? Did you need the jerry can?
- [ ] **v0.07 the Daintree crossing:** from the south bank, look at the bar: boulders stand out of the water and two patches of darker water mark the holes. Drive straight across the bar and hit them; weave between them in low range with both lockers and get across. Is it tricky but fair?
- [ ] **v0.07 black soil:** drive off the track onto the dark ground beside it: the car slows to a crawl and stops on any slope. Does it keep you on the track? Is the firm verge beside the track clear enough?
- [ ] **v0.07 deep and long bogs:** on the paddock road (on the river flats, since v0.15), the ridge before Roaring Meg camp, by the Bloomfield bridge and just before the Lions Den, a mud hole sits in a hollow: drive in and you should get stuck, and need to winch out to the tree near its far end. Some mud holes are now long boggy stretches. Too hard, too easy, too many?
- [ ] **v0.07 holes you can see:** on the gravel roads, the potholes and washouts deep enough to pinch a tyre are dark, ringed with pale gravel. Can you spot them in time at 40 km/h?
- [ ] **v0.07 flat tyres:** on Realistic, get a puncture (or a torn sidewall) and let it go flat: the tyre squashes flat at the bottom and bulges, the corner sits low, and the car pulls hard towards it, thumps at speed and slides in corners. Fix it with a plug or the spare and it drives straight again.
- [ ] **v0.13 forks:** three places to pick a line, each with a sign and a split in the track on the map (M): the **chicken track** round the deep bog on the ridge before Roaring Meg camp, the **steep shortcut** down the spur where the concrete swings west, and the **shallow crossing** of the Little Annan before the Lions Den. Try both lines of each. Is the sign easy to see in time? Is the short line quicker when you drive it well, and does the long one feel safer? Rush the shortcut: the ledges should cut a tyre. Did you get stuck in the bog, and was the chicken track worth it?
- [ ] **v0.08 the horizon:** at the range lookout, look east: the Coral Sea beyond the forest, fading into the sky with no hard line. Look west: a long, flat-topped range on the horizon (the tablelands). From the Upper Daintree paddocks, look east: Thornton Peak stands over the trees. From the Lions Den, look north: Black Mountain, dark and rounded, through a gap in the hills. No sharp alpine peaks and no grey rock walls anywhere at the map's edges. Check on Low, Medium and High: the far land shows on all three. Any gaps or flicker where the map's edge meets the far land? Has the frame rate dropped?
- [ ] **v0.10 the Hilux:** on the welcome screen pick **Hilux single cab** (the four vehicle buttons should fit, on a phone too). Walk round it (drag the view): red paint, round headlamps in a full-width grille, the styleside tub flush with the cab, vertical tail lamps, the bull bar and winch, and the two boards on the rack over the tub. Press C for the driver's seat: a bench seat, a two-spoke wheel, the dials working. Listen to the engine: a buzzier four-cylinder than the six. Drive the CREB: Big Red and Bob's Hill need low range and both lockers. Did you need the jerry can? How did it compare with the others?
- [ ] **v0.11 the Unimog:** on the welcome screen pick **Unimog UL1700L** (the five vehicle buttons should fit, on a phone too). Walk round it: Army green, the short sloping bonnet and black grille, round headlamps low beside it behind guards, the square cab with its canvas roof, the spare wheel and air stack behind the cab, the canvas tilt over the tray, and the boards on the tilt roof. Press C for the driver's seat: high up behind a big upright screen, a big three-spoke wheel, the dials working. Listen: a deep, slow diesel six. Drive the CREB: does it feel slow but unstoppable? Bob's Hill should go in low range without the lockers; Big Red still needs them. Try the Daintree's deep middle. Did the fuel last (you'll likely need the jerry can)? Does the chase camera sit too close behind such a long truck?
- [ ] **v0.14 the Troop Carrier:** on the welcome screen pick **Troop Carrier** (the six vehicle buttons should fit, on a phone too). The briefing should say 110 L of fuel and 2 spare wheels, and the fuel gauge and status strip should show them once you drive. Walk round it: white, round headlamps either side of a slatted grille, a sliding window and a fixed one in each side, barn doors at the back with a spare on the wide one, the bull bar and winch, and the second spare, a jerry can and the boards on the roof rack. Press C for the driver's seat: two seats, a four-spoke wheel, the dials working and not hidden by the wheel. Listen to the engine: a deeper, smoother diesel than the Land Rover's. Drive the CREB: does it feel heavier and more top-heavy than the others? Does the long tail catch anywhere? Stop in the Daintree's deep water: it should hold its ground where the others are carried away. At Roaring Meg camp change to the Hilux: the fuel that won't fit its tank is left behind, and changing back to the Troop Carrier doesn't refill it.
- [ ] **v0.19 the GQ Patrol:** on the welcome screen pick **GQ Patrol** (the seven vehicle buttons should fit, on a phone too). Walk round it: white over a charcoal lower body, rectangular headlamps in a black grille, the bull bar with the winch and two driving lamps, the snorkel up the left windscreen pillar, the roof rack and the spare on the rear door. Press C for the driver's seat: the dials working and not hidden by the four-spoke wheel. Listen to the engine: a six-cylinder diesel knock, different from the Troop Carrier's. Press N twice for high beam: the driving lamps should come on. Drive the CREB: does it feel heavier than the Land Rover but less top-heavy than the Troop Carrier? Does the long wheelbase catch on any crests? Stop in the Daintree's deep water: the engine should keep running.
- [ ] **v0.16 the storm:** drive the CREB from the start. The briefing and the welcome screen mention storms from 3 pm. At 3 pm a note says rain is coming; the sky greys, rain falls and is heard (louder on the roof from the driver's seat), and from about 4:45 a note says the rain is heavy. Do the clay climbs and the corners get noticeably greasier? Do Donovan's Creek and the Little Annan look higher, browner and faster? Cross the Little Annan before 5 pm, then (with `?debug`, **Clock +30 min**) try it again later: is it clearly harder, but still fair? Late, is the shallow crossing the safer way? Restart from a camp: is the weather as it was when you got there? Replay with chosen conditions: does the weather stay as picked?
- [ ] **v0.18 surprises on the CREB:** start a new run and drive the route (the storm still comes at 3 pm: is a tree down in the rain still fair?). Twice a tree should crack and come down across the track ahead of you, and once rocks should come off a bank on the range, each with a crash and a message. Did it ever land on or right in front of the car, even driving fast? Winch the tree round by its crown end and squeeze past; pick a line past the rocks. Is it clear what to do, and does it take too long? Start again: they should happen in different places. Restart from a camp past one of them: the ones before the camp stay down, and the ones after happen again in the same places.
- [ ] **History notes:** each named place shows its note as you arrive. Do they read well, and is there enough time to read them while driving?
- [ ] **Camps:** reaching Roaring Meg camp shows "camp reached, progress saved". Pause → Restart from last camp puts you back there with the clock, fuel and spares as they were.
- [ ] **Running out:** let the fuel run low and pour in the jerry can from the tool menu; then run dry with no cans and check the episode ends with a restart offered.
- [ ] **Realistic damage:** drop off a ledge onto rock; check whether you get a puncture (plug it) or a torn sidewall (fit the spare); use up the spare and check a second torn sidewall ends the episode. Spin the wheels on Bob's Hill's rock for a while and check it can cut a tyre.
- [ ] **Dusk:** keep driving into the evening (or dawdle): the light should fade, the headlights come on at dusk, and the episode end at 6:15 pm if you haven't arrived.
- [ ] **Finish and replay:** on reaching the Lions Den the closing card shows; Keep driving lets you look around. Back at the welcome screen Episode 1 shows "finished", and Conditions lets you replay it at another time and in other weather, with no time limit.
- [ ] **Vehicles:** the Land Rover uses less fuel and still climbs Big Red and Bob's Hill; the Camel Trophy 4WD's engine keeps running in the deep part of the Daintree (but the current can still take it).
- [ ] **Looks:** the rainforest (canopy trees, fan palms, tree ferns), red clay tracks and cuttings, the two waterfalls, the Bloomfield bridge. Frame rate on Medium in `?debug` while driving through the rainforest.
- [ ] **v0.04 cuttings:** drive down the concrete descent and reverse back up through its bends in the Land Rover: the banks either side should be wide clay slopes, not walls, and the car shouldn't climb onto one and stick, or show a bank through its body. Check Big Red, the bypass, Bob's Hill and the range top for the same: no track should run between walls.
- [ ] **v0.05 running water:** at the Daintree the ripples and pale streaks on the water run downstream. Cross on the gravel bar: the current pushes the back of the car downstream and you steer into it. Try the straight line through the deep middle: the car swings round and is shoved downstream. Drive out into the deep river: "The current is taking the car" shows and, on Mild or Realistic, the episode ends ("The current took the vehicle"). With damage Off you drift instead. The creek crossings on the range push a little.
- [ ] **v0.05 rough roads:** the paddock road and the Bloomfield Track are bumpy and potholed (dark patches), the range tracks washed out (dark bands across them). At 30 km/h it's a rough ride; at 50 km/h and more the car bounces, and on Realistic a pothole or washout can puncture a tyre ("pinched in a hole at speed"). Does it feel harder but fair, and did the fuel last?
- [ ] **v0.06 harder CREB:** in the default conditions (wet), try Big Red and Bob's Hill in high range, then in low range with the diffs open: neither should get up. Low range with both lockers should. The pinch on the ridge before Roaring Meg camp is the same. The clay tracks slide under braking and cornering. Mud holes, most of them full of brown water, lie in the dips (since v0.15, only the deep and long ones). At the Daintree, stop on the bar and watch the car drift downstream; on the deep middle the car is lifted and stranded. The creek fords push hard, and Roaring Meg's far bank is slippery. Was it harder, and still fair? How long did it take, and how much fuel was left?
- [ ] **v0.05 out of fuel:** run the tank dry on mud or gravel and hold the accelerator: the wheels stay still (in v0.04 they spun in place).
- [ ] **v0.02 phone layout:** on a phone held upright, the fuel, then the mission panel sit under the status strip, and nothing covers anything else. Press 4WD: LOW, CRAWL, F LOCK and R LOCK open in a row above it; press LOW and the crawl gauges appear top right under the fuel, with the mission panel narrowed beside them. Tap 4WD again to close the row and check its letters show what's on. Stopped with the handbrake on, press GAS: "HAND Release the handbrake" shows just above the buttons on the right. View → Driver: the status strip stays a small box and View / ⟲ stay top right. Held sideways the mission panel shows just the clock, clear of the joystick.
- [ ] **v0.02 history notes on a phone:** at the start, and on reaching each place (Daintree River crossing, Big Red...), the game stops and the note shows in the middle of the screen with the buttons hidden. Tap it and the game carries on. With a keyboard the notes still show top right while you drive.
- [ ] **v0.02 changing vehicle:** drive away from Daintree Village, then Pause → Vehicle → Land Rover 110 Perentie. It restarts at the camp and drives off (in v0.01 it stayed stuck with the engine revving).

## Project layout

```
src/
  core/    game loop, game orchestration (episodes, camps, results), HUD state, test hook
  data/    tuning numbers and content: episodes (episodes.ts, episodes/ for each episode's map and story),
           palette, environment, vehicles, surfaces, tools, damage, camera, quality, audio
  sim/     headless simulation: world generation, physics, vehicle, tools, the episode run, saving
  render/  Three.js: terrain, vegetation (eucalypts, rainforest, palms, ferns), water, sky, the far land and sea
           round the map (horizon), vehicle, particles
  ui/      welcome screen, briefing, HUD, episode cards, compass, paper map, menus, tool menu
  audio/   Web Audio synthesis
  debug/   overlay, free camera, debug panel
scripts/   route-check (track grades, heights and creek levels), track-profile (one track's grade against the
           ground), creek-check (creeks standing above their banks) and map-preview (top-down PNG), each for a
           map id (creb, coach or lakefield); creb-drive, coach-drive and lakefield-drive (autopilot drive of
           each episode's whole route with fuel, winching and arrival time); rescue-lab (winch the stockman out
           of his bog in any vehicle); surprise-check (where
           runs' surprises land on the CREB) and surprise-drive (drive up to them and get past); studio (one vehicle on plain ground; studio-shots
           photographs it); and the labs from 4WD Simulator
tests/     Vitest unit and headless physics tests (tests/fixtures/maps holds 4WD Simulator's maps as test worlds)
e2e/       Playwright browser tests
docs/      DECISIONS.md (choices made along the way) and HISTORY.md (sources for the history in the game)
```

## Deployment

`.github/workflows/deploy.yml` runs lint, unit tests and the production build on every pull request and on every push to `main`. A push to `main` then deploys `dist/` to GitHub Pages (**Settings → Pages → Source: GitHub Actions**).
