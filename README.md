# Over the Cape

A single-player 4WD adventure up Cape York, told in episodes, that runs in the browser. Each episode is a stage of the trip north, from the Daintree to the tip of Australia, with its own map, a core mission, the weather and time of day the story sets, and a fixed load of fuel, spare wheels and tyre plugs. Run out of fuel, get stranded with a flat and nothing to fix it with, wreck the engine or miss the deadline, and the episode ends; you restart from the last camp you reached. History notes at the places you pass tell what happened there.

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

The map is 3 km square with about 5 km of track. The real trip is over 100 km, so the distances are shortened; the obstacles are full size.

1. **Daintree Village** (camp) to the **Daintree River crossing**: wide and over a metre deep in the middle. A gravel bar curves downstream and keeps it about half that, so take the curve, not the straight line. The river is running fast after the rain: the current pushes the car downstream, and in the deep water it can carry it away. Crocodile country: you never leave the car.
2. Through the **Upper Daintree paddocks** on a gravel road to the foot of the range.
3. **Big Red**: about 130 m of red clay at around 20°, slippery after the rain. Low range and both lockers get up it. The **Big Red bypass** leaves the paddock road just before, and winds up the west side at no more than about 15°.
4. Along the range through the rainforest to **Roaring Meg camp**, then **Roaring Meg Creek**, with a short track to **Roaring Meg Falls**.
5. **Bob's Hill**: a steep, rocky pinch at about 21°. Spinning the wheels on rock can cut a tyre.
6. The **range lookout**, then **the concrete**: a long switchback descent with concreted pinches at about 20°.
7. **Donovan's Creek**, the **Bloomfield River** bridge at Wujal Wujal (camp), and a track west to **Wujal Wujal Falls**.
8. North on the gravel **Bloomfield Track** through **Rossville**, across the **Little Annan River**, to the **Lions Den Hotel**.

After the wet the gravel roads are bumpy and potholed and the range tracks are washed out, with channels cut across them. Drive them fast and the car bounces off the swells, and a pothole or washout hit at speed can pinch a tyre.

The map is rainforest (canopy trees on buttress roots, fan palms and tree ferns) except for open eucalypt woodland round the village, the paddocks and the drier hills by the Lions Den. A fallen tree lies across the track on the range: winch it aside or squeeze past.

## How an episode works

- **The mission and the clock** sit in the top left: what to do, the time of day and the deadline. The clock runs while you drive (about six game minutes a real minute on the CREB) and stops while paused. The sun moves with it, through late afternoon to dusk, when the headlights come on by themselves.
- **Camps save the run.** Reaching a camp saves where you are, the clock and what's on board. Pause menu → **Restart from last camp** goes back to it as things were then. A camp also mends the engine and suspension and patches punctures; it doesn't hand out fuel, spares or plugs.
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

- **Fuel** burns with the work the engine does: little at idle, far more climbing in low range or spinning the wheels. The map shortens the real distance, so it burns faster to match: the autopilot's clean run of the CREB uses about 46 L of petrol in the short-wheelbase 4WDs and 31 L of diesel in the Land Rover. The rough roads cost fuel: every bump takes work. The gauge is above the status strip, in litres.
- **Jerry cans** hold 20 L. Tool menu → **Pour in a jerry can**, stopped, about 12 s. If the engine ran dry it restarts on the starter afterwards.
- **Tyres** can be hurt two ways with Realistic damage: a **puncture** leaks down over about 40 s and takes a **plug** from the kit (tool menu → Plug the tyre, about 10 s); a **torn sidewall** goes flat in a few seconds and needs a **spare** (tool menu → Fit a spare, about 8 s). A landing of about a metre onto rock punctures a tyre; about one and a half metres tears the sidewall. Spinning a wheel hard on rock for several seconds wears through the tread. Crawling in low range barely spins. Dropping into a pothole or washout at speed pinches the tyre (a puncture): a deep one from about 40 km/h, and the faster the likelier; from about 55 km/h it can bend that corner's suspension too.
- The status strip's counts show jerry cans, spares and plugs left.

## Difficulty

The welcome screen's **Difficulty** is the damage setting (also in pause menu → Settings → Damage). It decides what can hurt the car, and so which ways an episode can end.

| Setting   | Damage                                                                                     | Ends the episode                                                       |
| --------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Off       | None (the body still dents and gets dirty)                                                 | Empty tank, deadline                                                   |
| Mild      | Tyres go soft, corners bend, the engine loses power; tool menu → Field repair fixes it all | Empty tank, deadline, swept away                                       |
| Realistic | Punctures and torn sidewalls, bent corners, the engine can be wrecked                      | Empty tank, deadline, swept away, a flat with no fix, a wrecked engine |

## Vehicles

Pick one on the welcome screen. Pause menu → Vehicle changes it mid-episode, but the run restarts from your last camp in the new one.

| Vehicle                 | Based on                                                      | Engine and gearbox                                                | Tank |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ---- |
| Short-wheelbase 4WD     | 1970s Land Cruiser 40 Series                                  | 4.2 L petrol six, three-speed automatic                           | 70 L |
| Camel Trophy 4WD        | The short-wheelbase 4WD in Camel Trophy dress, with a snorkel | Same                                                              | 70 L |
| Land Rover 110 Perentie | The Australian Army's Land Rover 110                          | 3.9 L Isuzu four-cylinder diesel, LT95A four-speed with low range | 79 L |

The 1986 Camel Trophy started at Cooktown, and Army Perenties served across the north. The Camel Trophy 4WD drives like the short-wheelbase 4WD but breathes through its snorkel, so it wades much deeper water before it floods; the current can still take it. The heavier Land Rover holds its ground in a current a little longer. A modern 4WD is planned for a later update.

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

The **tool menu** holds: Winch (or Detach winch), the front and rear diff locks, Place planks (or Recall planks), precision crawl, the headlights, the repair the car needs (Field repair, Plug the tyre or Fit a spare) and Pour in a jerry can. An option that can't be used now is greyed out; picking it says why ("Stop first", "No spares left"...).

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
- On wet clay keep a steady throttle; spinning the wheels digs you in, and on rock it can cut a tyre.
- **C** cycles the views; the front views look across the tyres to place a wheel, the driver's seat has working dials. **I** shows the crawl gauges (pitch, roll and the load on each tyre).
- In deep water watch the air intake: water at the intake stalls the engine (with Realistic damage it can wreck it). Cross the Daintree on the gravel bar and keep moving, steering upstream against the current. Stopped in deep running water, the car is lifted and carried off: "Deep, fast water" warns you, "The current is taking the car" means get to shallow water now.
- On the rough roads about 30–40 km/h is a fair pace. Faster, the swells bounce the car and the potholes and washouts pinch tyres.
- The winch reaches any tree within about 30 m. Rainforest trees are everywhere on the range.

## Debug mode

Add `?debug` to the address. You get an overlay (frame rate, draw calls, vehicle state, flooding, sound levels) and a panel with a free-fly camera (also the **backtick** key), collider wireframes, a teleport button for every place on the map and live vehicle tuning sliders.

## What to test

- [ ] It loads from the Pages link in current Chrome, Firefox and Edge, and on a phone.
- [ ] **Welcome screen:** Episode 1 is open, episodes 2–7 are listed as coming later. Pick a vehicle and a difficulty; Drive shows the briefing while the map builds, then Drive again starts at Daintree Village.
- [ ] **The CREB Track, start to finish:** cross the Daintree on the gravel bar, climb Big Red (or take the bypass), reach Roaring Meg camp, climb Bob's Hill, take the concrete down, cross Donovan's Creek and the Bloomfield bridge, and drive the Bloomfield Track to the Lions Den before dark. How long did it take, how much fuel was left, and did the clock feel fair?
- [ ] **History notes:** each named place shows its note as you arrive. Do they read well, and is there enough time to read them while driving?
- [ ] **Camps:** reaching Roaring Meg camp shows "camp reached, progress saved". Pause → Restart from last camp puts you back there with the clock, fuel and spares as they were.
- [ ] **Running out:** let the fuel run low and pour in the jerry can from the tool menu; then run dry with no cans and check the episode ends with a restart offered.
- [ ] **Realistic damage:** drop off a ledge onto rock; check whether you get a puncture (plug it) or a torn sidewall (fit the spare); use up the spare and check a second torn sidewall ends the episode. Spin the wheels on Bob's Hill's rock for a while and check it can cut a tyre.
- [ ] **Dusk:** keep driving into the evening (or dawdle): the light should fade, the headlights come on at dusk, and the episode end at 6:15 pm if you haven't arrived.
- [ ] **Finish and replay:** on reaching the Lions Den the closing card shows; Keep driving lets you look around. Back at the welcome screen Episode 1 shows "finished", and Conditions lets you replay it at another time and in other weather, with no time limit.
- [ ] **Vehicles:** the Land Rover uses less fuel and still climbs Big Red and Bob's Hill; the Camel Trophy 4WD's engine keeps running in the deep part of the Daintree (but the current can still take it).
- [ ] **Looks:** the rainforest (canopy trees, fan palms, tree ferns), red clay tracks and cuttings, the two waterfalls, the Bloomfield bridge. Frame rate on Medium in `?debug` while driving through the rainforest.
- [ ] **v0.04 running water:** at the Daintree the ripples and pale streaks on the water run downstream. Cross on the gravel bar: the current pushes the back of the car downstream and you steer into it. Try the straight line through the deep middle: the car swings round and is shoved downstream. Drive out into the deep river: "The current is taking the car" shows and, on Mild or Realistic, the episode ends ("The current took the vehicle"). With damage Off you drift instead. The creek crossings on the range push a little.
- [ ] **v0.04 rough roads:** the paddock road and the Bloomfield Track are bumpy and potholed (dark patches), the range tracks washed out (dark bands across them). At 30 km/h it's a rough ride; at 50 km/h and more the car bounces, and on Realistic a pothole or washout can puncture a tyre ("pinched in a hole at speed"). Does it feel harder but fair, and did the fuel last?
- [ ] **v0.04 out of fuel:** run the tank dry on mud or gravel and hold the accelerator: the wheels stay still (in v0.03 they spun in place).
- [ ] **Skyline (v0.03):** a few hundred metres up the road from Daintree Village, look east and west: grey sky and distant blue-green hills above the trees, with no dark green wall filling the sky. Near the start the south and west map edges rise as grassy hills, which is expected.
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
  render/  Three.js: terrain, vegetation (eucalypts, rainforest, palms, ferns), water, sky, vehicle, particles
  ui/      welcome screen, briefing, HUD, episode cards, compass, paper map, menus, tool menu
  audio/   Web Audio synthesis
  debug/   overlay, free camera, debug panel
scripts/   route-check (track grades, heights and creek levels), creb-drive (autopilot drive of the whole
           route with fuel and arrival time), map-preview (top-down PNG), and the labs from 4WD Simulator
tests/     Vitest unit and headless physics tests (tests/fixtures/maps holds 4WD Simulator's maps as test worlds)
e2e/       Playwright browser tests
docs/      DECISIONS.md (choices made along the way) and HISTORY.md (sources for the history in the game)
```

## Deployment

`.github/workflows/deploy.yml` runs lint, unit tests and the production build on every pull request and on every push to `main`. A push to `main` then deploys `dist/` to GitHub Pages (**Settings → Pages → Source: GitHub Actions**).
