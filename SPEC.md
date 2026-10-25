# Over the Cape — Build Spec

A single-player 4WD adventure up Cape York for the browser, told in episodes like an Australian 4WD travel show: each episode a stage of the trip north with a core mission. Same graphics and mechanics as [4WD Simulator](https://github.com/reidstephen11/4wd-simulator) (v0.18), which this code started from; its spec and decisions still describe the engine (see docs/DECISIONS.md).

Its feel is inspired by Over The Hill: simple but good-looking graphics, and a trip you can take slowly to enjoy the scenery. Its purpose is to tell the history of the places on the route.

## 1. Decisions at a glance

| Area | Decision |
|---|---|
| Players | Single player. The story may place other vehicles and people, kept simple: a parked or bogged vehicle to winch or tow, a person at a camp spoken to through on-screen text. No traffic on the tracks. |
| Story | You retrace your grandparent's 1986 trip up the Cape from their diary (§2a). Told through on-screen text: a briefing and diary entry before each episode, history notes at places, a closing note. History is kept to what sources say (docs/HISTORY.md); only the diary and its people are invented. No real TV shows or presenters are named. |
| Episodes | Seven, south to north, one map each. They unlock in order; finished ones can be replayed. |
| Maps | Long, narrow strips (the CREB 1.3 × 6 km, the Old Coach Road 1.3 × 7.2 km), with the real route's landmarks in their real order and obstacles at full size; the distances between are shortened. |
| Goals | Each episode's goal is a different kind of remote-travel job (§2a), not only reaching a place: deliver supplies, tow someone out of a bog before the river rises, cross before a storm closes a crossing. Every deadline has a reason in the story. |
| Stakes | An episode ends on an empty tank with no jerry cans, a missed deadline, being swept away by a river, a flat tyre with nothing left to fix it, or a wrecked engine. The damage setting decides which apply (§4). |
| Restart | From the last camp reached. Camps save the run: position, clock, what's on board and which finds were taken. |
| Supplies | Each episode starts with a load set by the story: fuel, 20 L jerry cans, spare wheels, tyre plugs. A vehicle can carry extras on top (from v0.14, the Troop Carrier's full sub-tank and second spare). Finds on the map, at the end of side tracks off the main line, can add to it, each once. Nothing carries over between episodes. |
| Conditions | The story sets the time of day and weather; the clock runs and the sun moves. A finished episode can be replayed in conditions you choose, with the clock stopped and no deadline. |
| Vehicles | The three from 4WD Simulator: the short-wheelbase 4WD (40 Series style), the Camel Trophy 4WD and the Army Land Rover 110 Perentie; from v0.10 the 1979–83 Hilux single cab; from v0.11 the Army Unimog UL1700L truck; from v0.14 the 1990s LandCruiser 75 Series Troop Carrier; and from v0.19 the GQ Patrol. A modern 4WD comes later. |
| Releases | v0.01: the episode system, fuel and spares, and Episode 1. v0.05: running water and rough tracks. v0.10: the Hilux. v0.11: the Unimog. v0.14: the Troop Carrier. v0.17: Episode 2, the Old Coach Road. v0.22: the LC79 V8. v0.23: Episode 3, Lakefield (winching someone else out, a deadline that holds until a crossing). Then trailers and towing (delivering another vehicle or fuel drums) for later episodes, each update bringing the mechanics it needs. |
| Look | The game's current look, made more realistic (§5a). Not photo-real or highly detailed; vehicle bodies with accurate shapes come first. |
| Platform | Browser, desktop and touch. Three.js, Rapier, TypeScript, Vite; everything generated in code. |

## 2. Episodes

| # | Episode | Route | Core mission (planned) |
|---|---|---|---|
| 1 | The CREB Track | Daintree Village → Daintree River → the range (Big Red, Roaring Meg, Bob's Hill, the concrete) → Wujal Wujal → Bloomfield Track → Lions Den Hotel | Reach the Lions Den before dark |
| 2 | The Old Coach Road | Palmer River → Maytown's ruins → North Palmer River → Conglomerate Range (three lines up, the big step, the descent) → Little Laura River → Laura | Through Maytown to Laura before dark |
| 3 | Lakefield | Laura → Laura River and Old Laura homestead → the black soil plains → Lakefield → a stockman bogged off the road → Hann Crossing on the North Kennedy → Musgrave | Winch the stockman out, then over Hann Crossing before the river covers the bar (built in v0.23; Port Stewart, first planned here, may come later as a side episode) |
| 4 | The Frenchmans Track | The Pascoe and Wenlock rivers | Get across both (river current) |
| 5 | Telegraph Track South | Bramwell Junction, Palm Creek, the Ducie, Gunshot Creek | Get past Gunshot, by the drop or the bypass |
| 6 | Telegraph Track North | Fruit Bat, Eliot and Twin Falls, Cypress Creek's log bridge, Nolans Brook | Cross Nolans without drowning the engine |
| 7 | The Tip | The Jardine ferry, the Ussher Point track and a WWII aircraft wreck, the northernmost point | Stand at the Tip |

## 2a. The story and the goals

The player retraces a trip their grandparent made up Cape York in 1986, using the grandparent's diary. In 1986 the Bloomfield Track was newly built (1983–84) and the Telegraph Line was still in use (closing date to be checked before the game states it). Each episode opens with a diary entry; each camp reached can open the next one. The diary points the player to the history along the way and gives each deadline its reason. The diary may name the grandparent's own vehicle; the player still drives any vehicle.

Goals vary from episode to episode and carry the feel of remote travel, with the deadline coming from the story or the weather rather than only the clock:

- Deliver supplies (fuel, a part, food) to someone waiting at a camp.
- Tow or winch someone out of a bog before the river rises.
- Cross a river before an incoming storm makes the crossing impossible.

The planned missions in the table above will be rewritten in this frame as each episode is built or revisited. Episode 3 is the first built in it: its briefing opens with the diary entry, its goal is a rescue, and its deadline comes from a river rising in the rain.

An episode can also have someone to rescue (`rescue`, src/sim/stuckVehicle.ts): a vehicle bogged off the route that the player winches out before the goal counts, with what its driver says once free. A deadline can hold only until a place is reached (`deadline.until`), with its own mission line until then; the HUD's mission line moves on from the rescue to the deadline to the last leg (`lastLeg`).

Each episode defines (src/data/episodes.ts): its map, the mission line and goal (a camp POI), start time and weather, any storm that comes through (`storm`, src/data/weatherTimeline.ts), the deadline, the clock rate (game seconds per real second), the fuel scale (fuel burnt per litre the engine really uses, because the map shortens the distance), the load, the briefing, history notes by POI, the closing paragraphs and a sentence for each way it can end.

## 3. Systems

- **Clock and light.** `EpisodeRun` keeps the hour; it advances by `clockRate` while the game runs. `environmentAt(hour, weather)` blends the clear-sky presets pinned to 7:45, 12:30, 4:30, 5:54 and 7 pm, then applies the weather. The renderer's light is updated every three game minutes; from 5:30 pm the headlights light the ground and come on by themselves.
- **Weather that changes.** An episode's storm sets how hard it rains through the day. The ground's wetness (the tyres' grip) and the creeks' rise and current are worked out from it minute by minute, so they follow from the clock alone and a camp's checkpoint brings them back. Replays keep the weather chosen.
- **Fuel.** The drivetrain's combustion torque × engine speed is the power the fuel provides; burn = power ÷ (efficiency × energy per litre): petrol 0.30 × 34.2 MJ/L, diesel 0.38 × 38.6 MJ/L. The simulation multiplies by the episode's fuel scale. An empty tank stops the engine; it cranks but won't run. Tanks: 70 L petrol six, 79 L diesel.
- **Tyres.** A landing on rock faster than 4.4 m/s (about a 1 m drop) punctures a tyre; faster than 5.4 m/s (about 1.5 m) tears the sidewall. Hard wheelspin on rock wears through: 6 s at full spin. Realistic: a puncture goes down over 40 s and takes a plug (10 s); a torn sidewall goes down in 5 s and takes a spare (8 s). Mild: tyres go soft and a field repair fixes everything.
- **Running water.** Each creek's water runs from its first point to its last at its `flow` speed (m/s), fastest mid-channel and half that at the edges. The water's drag on the vehicle is worked out against the moving water (2.2 times as strong side-on), so the current pushes it. Deep water lifts the body by 30% of the water its parts displace and the sealed tyres by all of theirs, taking load (and grip) off the tyres; in running water over the hubs the tyres also creep sideways, so the vehicle drifts downstream until it is steered against the current. Lifted by 45% of its weight and moving downstream faster than 0.5 m/s for 4 s, it has been swept away.
- **Rough tracks.** A track's `rough` adds bumps (about 3 m apart), swells (about 10 m apart), potholes in the wheel lines and washouts (channels cut across the track at 15–50°) to the graded 1 m ground. A wheel dropping into a pothole or washout makes a strike: speed × the hole's depth, give or take a quarter. A strike over 3.6 pinches the tyre (a puncture); over 4.8 it also bends that corner.
- **Camps.** On arriving: the engine and suspension are mended and punctures patched (a torn sidewall stays torn), then the checkpoint is saved. Restarting restores the checkpoint's clock, fuel, cans, spares, plugs and tyres, and puts back any find taken since.
- **Finds.** A map's `finds` are things to load (a jerry can, tyre plugs, a spare), each at the end of a side track. Stopped (under 0.6 m/s) within a find's reach, it goes on board, once; the HUD prompts from a little further out. A side trip should cost about what it gives back: daylight and some fuel for insurance a clean run doesn't need.
- **Surprises.** An episode can list stretches of its route where one-off events happen: a dead tree falling across the track, rocks coming off a bank. Each run picks where from its seed, kept in camp checkpoints with those that have happened, so a restart from camp sees the same ones. An event starts as the car comes along the track towards it, far enough ahead to stop, comes down on a scripted path that passes through the car, and is then a movable object to winch or push aside.
- **Ending.** Checked every physics step: the goal POI's radius completes the episode; otherwise the rules in §4. The game pauses behind the result card.

## 4. Difficulty (the damage setting)

| Setting | Can end the episode |
|---|---|
| Off | Empty tank (no cans, stopped), deadline |
| Mild | Empty tank, deadline, swept away |
| Realistic | Empty tank, deadline, swept away, a flat tyre with no spare and no plug that fits, a wrecked engine |

## 5. World engine additions over 4WD Simulator

- Several creeks and rivers per map, each with its own carved valley width (`valley`), and shallow bars (`bars`) inside a river for the line to take.
- Tropical flora: rainforest canopy trees on buttress roots, fan palms and tree ferns (more by the creeks), with open eucalypt woodland in marked areas. One leaf texture holds eucalyptus sprays, broad leaves, fan-palm leaves and fern fronds.
- Per-map colours (red clay, greener grass) and clay track cuttings.
- Track pins that follow the ground between fixed heights (`pinMode: 'follow'`) and rounded grade changes (`pinSmooth`); concrete track surface.
- Rough tracks (`rough`: bumps, swells, potholes, washouts and mud holes that fill with water after rain) and running water (`flow` on a creek or a creek point).
- A red clay track surface (`clay`) that grips like dirt when dry and loses over half its grip when wet.
- Soft sand (`SurfaceId.Sand`): a dry-season surface that drags and lets the wheels dig in, the same wet or dry. Laid as a creek's sand bed and dry banks (`bed: 'sand'`, `sandBank`), a track's surface, or stretches along a track (`sand`).
- Boulders along any track (`stones`), beside it or across it, from the crawl trails' stone placer.
- Termite mounds (`termiteMounds` per hectare in a map's vegetation): solid earth spires on open grassland.
- Ruin props: a baker's oven, chimneys, headstones and stone kerbing.
- Long maps of up to about 1.3 × 7.2 km, sampled every metre.

## 5a. Look

Keep the game's current look and lighting, made more realistic rather than stylised. A mock-up in Over The Hill's folded-paper style was tried and turned down. Not photo-real and not highly detailed. In practice:

- Vehicle bodies come first: accurate shapes and proportions, and the details that make each one recognisable (bull bar, snorkel, roof rack, wheel arches, mudguards over the wheels, lamps). The 40 Series shorty is the first, from a mock-up the owner signs off before it goes into the game. Photographs, licences and published dimensions for every modelled vehicle are in `reference/vehicles/`. Read `reference/vehicles/README.md` before changing a body.
- Ground, trees and lighting stay as they are for now.

## 6. Interface

- Welcome screen: episode list (later episodes listed as coming), Continue / Start again, vehicle, difficulty, and for finished episodes the conditions.
- Loading screen: the briefing, then Drive.
- HUD: kept quiet so the scenery comes first (planned). Every icon has a short word label, and supplies (recovery boards, spares, plugs, jerry cans) show only when they change or when the tool menu is open. Mission panel top left (episode, mission, clock and deadline); fuel gauge and supplies above the status strip; history notes top right; result card centred. On a touch screen the fuel and the mission sit under the status strip (sideways, the clock only), and a history note stops the game and shows centred until tapped.
- Pause menu: Resume, Map, Restart from last camp, Vehicle (restarts from the camp), Settings, Controls, Main menu.
- Tool menu: Winch / Detach winch, the diff locks, planks, precision crawl, headlights, the repair needed, Pour in a jerry can.

## 7. Testing

- Unit tests (Vitest): the episode rules, fuel burn, tyre faults, saves, the moving sun, the river current and rough tracks, and the CREB map (connected legs at matching heights, creeks below their banks, camps level) with autopilot drives of its hard sections in the wet in both the short-wheelbase 4WD and the Land Rover. 4WD Simulator's maps are kept as test worlds for its physics tests.
- Finds: the side tracks driven out and back in the wet in both vehicles; a find loads once, only when stopped, and checkpoints and saves keep which were taken.
- The Old Coach Road map in the same way, with sand at each river crossing, termite mounds clear of the road, Maytown's ruins, the range face's three lines steepest to gentlest, and the middle line driven on Realistic: stopped in high range and with the diffs open, climbed with both lockers.
- The Lakefield map in the same way: its rivers below their banks, black soil off the road and not on it, the shallow bar at Hann Crossing and the river over it by the deadline; the stockman bogged off the road within a winch's reach, held against a light pull, and winched out from the road in the rain with the car's brakes holding it on the road; the goal counting only once he's out, the deadline holding only until the north bank, and camps and saves keeping him out.
- `scripts/creb-drive.ts`, `scripts/coach-drive.ts` and `scripts/lakefield-drive.ts` drive each whole route and report fuel used and arrival time, for tuning the load and the clock.
- Browser tests (Playwright): the welcome and briefing flow, camps and restarts, each way of ending, finishing and replaying, plus driving, tools, interface, audio, night, vehicles, camera, damage, touch and the phone layout. They run on a software renderer that takes seconds per frame, so they run a fixed 24 physics steps per frame.
