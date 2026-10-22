# Over the Cape

A single-player 4WD adventure up Cape York, told in episodes, that runs in the browser. Each episode is a stage of the trip north, from the Daintree to the tip of Australia, with its own map, a core mission, the weather and time of day the story sets, and a starting load of fuel, spare wheels and tyre plugs, which side trips off the main line can add to. Run out of fuel, get stranded with a flat and nothing to fix it with, wreck the engine or miss the deadline, and the episode ends; you restart from the last camp you reached. History notes at the places you pass tell what happened there.

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
| 2   | The Old Coach Road    | Maytown to Laura through the Palmer River goldfields | Coming later |
| 3   | Port Stewart          | Musgrave east through the swamps to the coast        | Coming later |
| 4   | The Frenchmans Track  | Across the Pascoe and Wenlock rivers                 | Coming later |
| 5   | Telegraph Track South | Bramwell Junction to Gunshot Creek                   | Coming later |
| 6   | Telegraph Track North | The waterfalls, the creeks and Nolans Brook          | Coming later |
| 7   | The Tip               | Over the Jardine to the northernmost point           | Coming later |

### Episode 1: The CREB Track

**Mission: reach the Lions Den Hotel before dark.** June, the track has just reopened after the wet, and it rained overnight. You leave Daintree Village at 12:30 pm; it's dark at 6:15 pm. On board: 50 L of fuel, one 20 L jerry can, one spare wheel and three tyre plugs.

The map is a long strip, 1.3 km wide and 6 km from south to north, with about 6.6 km of track up its length. The real trip is over 100 km, so the distances are shortened; the obstacles are full size.

1. **Daintree Village** (camp) to the **Daintree River crossing**: wide and over a metre deep in the middle. A gravel bar downstream keeps it about half that, but after the wet the bar is strewn with boulders and scoured into holes over a metre deep, right across the straight line over it: weave between them. The river is running fast after the rain: the current pushes the car downstream, and in the deep water it can carry it away. Crocodile country: you never leave the car.
2. Through the **Upper Daintree paddocks** on a fast gravel road to the foot of the range. It is pocked with potholes (signposted): at about 30 km/h they only rattle the car, but much faster they pinch the tyres. One deep bog lies in a hollow on the river flats.
3. **Big Red**: about 130 m of red clay at around 20°, greasy after the rain and scored with deep cross-ruts. High range won't get up it, nor low range with the diffs open: low range with both lockers will. The **Big Red bypass** leaves the paddock road just before, and winds up the west side at no more than about 15°.
4. Along the range through the rainforest (a signposted spur east leads to the **Old line camp**, with two tyre plugs), over a steep clay pinch that also needs low range and the lockers and a **washout** cut right across the track (signposted), which needs the planks, to **Roaring Meg camp**, then the fast ford over **Roaring Meg Creek** and up its slippery bank, with a short track to **Roaring Meg Falls**. The falls are just downstream of the ford. Above the gorge the track climbs a **rock ledge** about a metre high: crawl up it in low range with both lockers.
5. **Bob's Hill**: a steep, rutted pinch at about 21°. Like Big Red it needs low range and both lockers.
6. Along the range top, round a **sideling** that leans the car over towards the drop, and where a track signposted **Old line** follows a few leaning poles down the west flank to the **Linesman's hut** and a full jerry can; then the **range lookout**, then **the concrete**: a long switchback descent with concreted pinches at about 20°.
7. **Donovan's Creek**, the **Bloomfield River** bridge at Wujal Wujal (camp), and a track west to **Wujal Wujal Falls**.
8. North on the gravel **Bloomfield Track**, across three fast **creeks** coming off the hills (one with a scour hole just below the ford), through **Rossville**, across the **Little Annan River**, to the **Lions Den Hotel**.

After the wet the red clay tracks are slick, the gravel roads are bumpy and potholed, and the range tracks are washed out, with channels cut across them. The potholes and washouts deep enough to pinch a tyre at speed are dark, ringed with pale gravel. Each stretch has its own kind of trouble (above) rather than mud all the way: the mud lies where the ground holds water, in four deep bogs and two long boggy stretches of 25–45 m (on the ridge below Roaring Meg camp, and on the Bloomfield Track north of the bridge), full of brown water so you can't see how deep they are. Where a hole sits in a hollow the land drains into, it is a **deep bog**, 0.7 m of sticky black mud under the water: few vehicles get out without the winch, and a tree stands near either end to winch from. Off the tracks most of the flatter ground is wet **black soil**, dark beside the firm verge: drive onto it and you crawl at walking pace, and on any slope you stop. Drive fast and the car bounces off the swells and slides on the clay. The creeks run fast and deep: Donovan's Creek and the Little Annan push hard, and the Daintree's deep middle stops a car dead.

The map is rainforest (canopy trees on buttress roots, fan palms and tree ferns) except for open eucalypt woodland round the village, the paddocks and the drier hills by the Lions Den. A fallen tree lies across the track on the range: winch it aside or squeeze past.

Beyond the map's edge the real country carries on to the horizon, brought in closer and lower in step with the map. East, between the range and the Coral Sea, stand Thornton Peak, Mt Pieter Botte, Mt Sorrow behind Cape Tribulation, and Mt Finnigan's granite tops, and the Daintree and the Bloomfield run out to the sea. West, rainforest ranges rise to the flat-topped tablelands of the Great Dividing Range. North of the Lions Den the country dries out to open woodland round the black boulder heaps of Black Mountain. South are the Daintree's cane and cattle flats and the ranges towards Mossman. Far land fades into the sky with distance, as it does on a humid day.

## How an episode works

- **The mission and the clock** sit in the top left: what to do, the time of day and the deadline. The clock runs while you drive (eight game minutes a real minute on the CREB) and stops while paused. The sun moves with it, through late afternoon to dusk, when the headlights come on by themselves.
- **Camps save the run.** Reaching a camp saves where you are, the clock and what's on board. Pause menu → **Restart from last camp** goes back to it as things were then. A camp also mends the engine and suspension and patches punctures; it doesn't hand out fuel, spares or plugs. It keeps what you'd found by then: restart from it and anything picked up after it is back where it was.
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

- **Fuel** burns with the work the engine does: little at idle, far more climbing in low range or spinning the wheels. The map shortens the real distance, so it burns faster to match: the autopilot's clean run of the CREB uses about 54 L of petrol in the short-wheelbase 4WDs (more than the 50 L in the tank, so the jerry can goes in on the way), 37 L of diesel in the Land Rover, 42 L of petrol in the Hilux and 67 L of diesel in the Unimog (the jerry can goes in, with very little to spare). Rough roads, mud and clay cost fuel, and so does every time you get stuck. The gauge is above the status strip, in litres.
- **Jerry cans** hold 20 L. Tool menu → **Pour in a jerry can**, stopped, about 12 s. If the engine ran dry it restarts on the starter afterwards.
- **Tyres** can be hurt two ways with Realistic damage: a **puncture** leaks down over about 40 s and takes a **plug** from the kit (tool menu → Plug the tyre, about 10 s); a **torn sidewall** goes flat in a few seconds and needs a **spare** (tool menu → Fit a spare, about 8 s). A landing of about a metre onto rock punctures a tyre; about one and a half metres tears the sidewall. Spinning a wheel hard on rock for several seconds wears through the tread. Crawling in low range barely spins. Dropping into a pothole or washout at speed pinches the tyre (a puncture): a deep one from about 40 km/h, and the faster the likelier; from about 55 km/h it can bend that corner's suspension too. A tyre going down squashes flat at the bottom; flat, its corner sits low, it thumps once a turn at speed, it grips poorly in corners and drags, and a flat front tyre pulls the car hard towards its side.
- **Finds off the main line.** Two side tracks on the range lead to huts with something to load: two tyre plugs at the Old line camp (a short level spur off the ridge, signposted "Line camp") and a full 20 L jerry can at the Linesman's hut (about 110 m down the range top's west flank along the old poles, signposted "Old line", with a greasy climb back up). Drive up to the crate by the hut and stop: it goes on board and the counts go up. Each can be taken once. The trip costs daylight and a little fuel, a few minutes there and back; neither is needed on a clean run, but either can save a run that's gone wrong.
- The status strip's counts show jerry cans, spares and plugs on board.

## Difficulty

The welcome screen's **Difficulty** is the damage setting (also in pause menu → Settings → Damage). It decides what can hurt the car, and so which ways an episode can end.

| Setting   | Damage                                                                                     | Ends the episode                                                       |
| --------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Off       | None (the body still dents and gets dirty)                                                 | Empty tank, deadline                                                   |
| Mild      | Tyres go soft, corners bend, the engine loses power; tool menu → Field repair fixes it all | Empty tank, deadline, swept away                                       |
| Realistic | Punctures and torn sidewalls, bent corners, the engine can be wrecked                      | Empty tank, deadline, swept away, a flat with no fix, a wrecked engine |

## Vehicles

Pick one on the welcome screen. Pause menu → Vehicle changes it mid-episode, but the run restarts from your last camp in the new one.

| Vehicle                 | Based on                                                      | Engine and gearbox                                                | Tank  |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ----- |
| Short-wheelbase 4WD     | 1970s Land Cruiser 40 Series                                  | 4.2 L petrol six, three-speed automatic                           | 70 L  |
| Camel Trophy 4WD        | The short-wheelbase 4WD in Camel Trophy dress, with a snorkel | Same                                                              | 70 L  |
| Land Rover 110 Perentie | The Australian Army's Land Rover 110                          | 3.9 L Isuzu four-cylinder diesel, LT95A four-speed with low range | 79 L  |
| Hilux single cab        | 1979–83 Toyota Hilux 4WD with the styleside tub               | 2.0 L petrol four, four-speed manual with low range               | 65 L  |
| Unimog UL1700L          | The Australian Army's Mercedes-Benz Unimog 4-tonne truck      | 5.7 L turbo-diesel six, four road gears and four field gears      | 160 L |

The 1986 Camel Trophy started at Cooktown, and Army Perenties served across the north. The Camel Trophy 4WD drives like the short-wheelbase 4WD but breathes through its snorkel, so it wades much deeper water before it floods; the current can still take it. The heavier Land Rover holds its ground in a current a little longer. The red Hilux, the first Hilux with 4WD, is light and thrifty: its small petrol four uses about a third less fuel than the six, but it is slower and needs low range sooner, and its long wheelbase and tub hang out further behind the rear wheels. It carries its recovery boards on a ladder rack over the tub. The Army Unimog is the slow, heavy one: 6.4 t on 1.1 m tyres and portal axles, with the most ground clearance by far, a crawling low range, lockers that engage on the move up to 15 km/h, and a winch that pulls three times as hard as the Land Rover's. It tops out at about 68 km/h and takes much longer to get there, and it is thirsty. On a side slope it tips at about the Land Rover's angle. It wades water that would carry the others away, and breathes through a stack behind the cab. Its pintle hook is ready for trailers, which come in a later update. A modern 4WD is planned for a later update.

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
- At the **washout** stop short of the gap, square up, choose **Place planks** and slide them out until they bridge it under the front wheels, then crawl over in low range. Recall them from the tool menu once you are well past.
- Crawl up the **rock ledge** in low range with both lockers. Spinning the wheels on the rock cuts the tyres.
- On the **sideling** crawl, keep to the high side and don't turn downhill: taken fast on the wet clay, the car slides towards the drop.
- Slow right down before the **creeks** on the Bloomfield Track and keep moving once you are in: stopped in the current, the car is pushed downstream into the scour hole below the middle one.
- **C** cycles the views; the front views look across the tyres to place a wheel, the driver's seat has working dials. **I** shows the crawl gauges (pitch, roll and the load on each tyre).
- In deep water watch the air intake: water at the intake stalls the engine (with Realistic damage it can wreck it). Cross the Daintree on the gravel bar in low range with both lockers, weaving between its boulders and the darker water of its holes, and keep moving, steering upstream against the current: stop on the bar and the current slowly pushes the car off it, and taken quickly in high range the short-wheelbase 4WD is pushed off it into the deep water. Stopped in deep running water, the car is lifted and carried off: "Deep, fast water" warns you, "The current is taking the car" means get to shallow water now.
- On the gravel roads about 30–40 km/h is a fair pace, and less on the clay. Faster, the swells bounce the car and the potholes and washouts (the dark ones ringed with pale gravel) pinch tyres.
- Stay on the track: the dark ground off it is black soil, and bogs you. Cutting a corner onto it costs minutes.
- The winch reaches any tree within about 30 m. Rainforest trees are everywhere on the range, and a tree stands near each end of every deep or long bog. Bogged in a deep one, hook up to the tree ahead (E), winch in (R) and drive gently with it.
- Got a flat? Stop and fix it: a flat tyre pulls the car off line and makes the corners treacherous.

## Debug mode

Add `?debug` to the address. You get an overlay (frame rate, draw calls, vehicle state, flooding, sound levels) and a panel with a free-fly camera (also the **backtick** key), collider wireframes, a teleport button for every place on the map and live vehicle tuning sliders.

## What to test

- [ ] It loads from the Pages link in current Chrome, Firefox and Edge, and on a phone.
- [ ] **Welcome screen:** Episode 1 is open, episodes 2–7 are listed as coming later. Pick a vehicle and a difficulty; Drive shows the briefing while the map builds, then Drive again starts at Daintree Village.
- [ ] **The CREB Track, start to finish:** cross the Daintree on the gravel bar, climb Big Red (or take the bypass), reach Roaring Meg camp, climb Bob's Hill, take the concrete down, cross Donovan's Creek and the Bloomfield bridge, and drive the Bloomfield Track to the Lions Den before dark. How long did it take, how much fuel was left, and did the clock feel fair?
- [ ] **v0.13 varied stretches:** drive the route and note how each stretch feels different. The paddock road: fast and potholed, with no mud but one deep bog early on; try it at 30 km/h, then faster (on Realistic you should pinch a tyre). The ridge: a washout across the track past the "Washout" sign; try to drive over it (you can't), then bridge it with the planks. The rock ledge above Roaring Meg: try it in high range (you should spin and cut a tyre on Realistic), then crawl up in low range with both lockers. The range-top sideling: does the lean feel scary but fair? Taken fast, the car slides towards the edge. The Bloomfield Track: three creek crossings; at the middle one, stop in the water and see what the current does. Is the route more interesting than before? Too hard anywhere? Did you miss the mud?
- [ ] **v0.12 side trips:** on the ridge after Big Red, take the "Line camp" spur and stop by the crate at the hut: the plug count goes up by two. On the range top after Bob's Hill, follow the "Old line" sign and the poles down to the Linesman's hut and stop by the crate: one more jerry can. Drive back up to the main track. Was each trip worth the time? Reach Bloomfield camp, go back to the hut (or restart from Roaring Meg camp): after a restart from a camp reached before a find, it's back at its hut.
- [ ] **v0.07 the long map:** open the map (M): it is a tall, narrow strip with the route up the middle and the rivers across it. Drive the route: about 6.6 km, 40% longer than before, with the clock running faster. Did you arrive before dark, and how close was it? Did you need the jerry can?
- [ ] **v0.07 the Daintree crossing:** from the south bank, look at the bar: boulders stand out of the water and two patches of darker water mark the holes. Drive straight across the bar and hit them; weave between them in low range with both lockers and get across. Is it tricky but fair?
- [ ] **v0.07 black soil:** drive off the track onto the dark ground beside it: the car slows to a crawl and stops on any slope. Does it keep you on the track? Is the firm verge beside the track clear enough?
- [ ] **v0.07 deep and long bogs:** on the paddock road (on the river flats, since v0.13), the ridge before Roaring Meg camp, by the Bloomfield bridge and just before the Lions Den, a mud hole sits in a hollow: drive in and you should get stuck, and need to winch out to the tree near its far end. Some mud holes are now long boggy stretches. Too hard, too easy, too many?
- [ ] **v0.07 holes you can see:** on the gravel roads, the potholes and washouts deep enough to pinch a tyre are dark, ringed with pale gravel. Can you spot them in time at 40 km/h?
- [ ] **v0.07 flat tyres:** on Realistic, get a puncture (or a torn sidewall) and let it go flat: the tyre squashes flat at the bottom and bulges, the corner sits low, and the car pulls hard towards it, thumps at speed and slides in corners. Fix it with a plug or the spare and it drives straight again.
- [ ] **v0.08 the horizon:** at the range lookout, look east: the Coral Sea beyond the forest, fading into the sky with no hard line. Look west: a long, flat-topped range on the horizon (the tablelands). From the Upper Daintree paddocks, look east: Thornton Peak stands over the trees. From the Lions Den, look north: Black Mountain, dark and rounded, through a gap in the hills. No sharp alpine peaks and no grey rock walls anywhere at the map's edges. Check on Low, Medium and High: the far land shows on all three. Any gaps or flicker where the map's edge meets the far land? Has the frame rate dropped?
- [ ] **v0.10 the Hilux:** on the welcome screen pick **Hilux single cab** (the four vehicle buttons should fit, on a phone too). Walk round it (drag the view): red paint, round headlamps in a full-width grille, the styleside tub flush with the cab, vertical tail lamps, the bull bar and winch, and the two boards on the rack over the tub. Press C for the driver's seat: a bench seat, a two-spoke wheel, the dials working. Listen to the engine: a buzzier four-cylinder than the six. Drive the CREB: Big Red and Bob's Hill need low range and both lockers. Did you need the jerry can? How did it compare with the others?
- [ ] **v0.11 the Unimog:** on the welcome screen pick **Unimog UL1700L** (the five vehicle buttons should fit, on a phone too). Walk round it: Army green, the short sloping bonnet and black grille, round headlamps low beside it behind guards, the square cab with its canvas roof, the spare wheel and air stack behind the cab, the canvas tilt over the tray, and the boards on the tilt roof. Press C for the driver's seat: high up behind a big upright screen, a big three-spoke wheel, the dials working. Listen: a deep, slow diesel six. Drive the CREB: does it feel slow but unstoppable? Bob's Hill should go in low range without the lockers; Big Red still needs them. Try the Daintree's deep middle. Did the fuel last (you'll likely need the jerry can)? Does the chase camera sit too close behind such a long truck?
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
- [ ] **v0.06 harder CREB:** in the default conditions (wet), try Big Red and Bob's Hill in high range, then in low range with the diffs open: neither should get up. Low range with both lockers should. The pinch on the ridge before Roaring Meg camp is the same. The clay tracks slide under braking and cornering. Mud holes, most of them full of brown water, lie in the dips (since v0.13, only the deep and long ones). At the Daintree, stop on the bar and watch the car drift downstream; on the deep middle the car is lifted and stranded. The creek fords push hard, and Roaring Meg's far bank is slippery. Was it harder, and still fair? How long did it take, and how much fuel was left?
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
           ground), creek-check (creeks standing above their banks), creb-drive (autopilot drive of the whole
           route with fuel, winching and arrival time), map-preview (top-down PNG), studio (one vehicle on plain
           ground; studio-shots photographs it), and the labs from 4WD Simulator
tests/     Vitest unit and headless physics tests (tests/fixtures/maps holds 4WD Simulator's maps as test worlds)
e2e/       Playwright browser tests
docs/      DECISIONS.md (choices made along the way) and HISTORY.md (sources for the history in the game)
```

## Deployment

`.github/workflows/deploy.yml` runs lint, unit tests and the production build on every pull request and on every push to `main`. A push to `main` then deploys `dist/` to GitHub Pages (**Settings → Pages → Source: GitHub Actions**).
