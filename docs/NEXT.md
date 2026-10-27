# Next job: trailers and towing

Handover notes for the next agent, written on 2026-10-23 at v0.27. Delete this file, and the pointer to it in CLAUDE.md, in the update that ships the first towing mission.

## What the owner asked

In the session that built the Hilux and Episode 2, the owner wrote:

> i would like at some stage and probably multiple times, a story where i have to tow something that needs delivering such as another vehicle or fuel barrels or the like. it would require a trailer.

They chose the order: the Hilux, then Episode 2, then towing. The Hilux shipped as v0.10 and Episode 2 as v0.17. Towing hasn't been started. On 2026-10-23 the owner confirmed they want it built next.

## What the game has now

- **Tow points.** Every vehicle's tuning has a `towPoint` (`src/data/vehicle.ts`, and each vehicle's own file such as `src/data/hilux.ts`). Today it's used only as an anchor for a winch or strap from another vehicle (the anchor list in `src/sim/sim.ts`, near the `veh:` ids).
- **Hitches are already drawn.** A towbar tongue and ball (`src/render/vehicleEquipment.ts`). Pintle hooks and trailer sockets on the Perentie (for the Army's No. 5 trailer) and the Unimog (`src/render/perentieBody.ts`, `src/render/unimogBody.ts`).
- **The Unimog's tray is empty on purpose.** DECISIONS v0.11: "Loads come with the trailers."
- **Vehicle physics.** Each vehicle is a Rapier dynamic body with a `DynamicRayCastVehicleController` (`src/sim/vehicle/vehicle.ts`, ground contacts in `src/sim/vehicle/wheelContacts.ts`). There are no trailers and no joints between vehicles yet.
- **Someone else's vehicle.** `src/sim/stuckVehicle.ts` (Episode 3's stockman) doesn't roll on its own wheels. It moves only along a winch line until it's free. A vehicle towed behind the player's will need more than this.
- **Episodes.** `EpisodeDef` in `src/data/episodes.ts` has the mission, goal POI, deadline (with `deadline.until`), `rescue`, `lastLeg` and loadout. There is no delivery goal yet.
- **The plan already allows for it.** SPEC.md §2a lists "Deliver supplies (fuel, a part, food) to someone waiting at a camp" as a goal, with the grandparent's 1986 diary giving each deadline its reason. SPEC.md §1 says trailers and towing come in later episodes, with each update bringing the mechanics it needs.

## The owner's answers (2026-10-26)

Asked when they said "build out next episode":

1. **Episode 4, the Frenchmans Track, is the towing episode**, with fuel drums on a trailer delivered to someone at a camp.
2. **Both trailers:** the 6×4 box trailer for the civilian vehicles and the Army's No. 5 for the Perentie and Unimog.
3. **The player can unhitch.**
4. **Everything can go wrong:** tipping on a side slope, a trailer tyre cut on Realistic, drums coming loose on rough ground, and jackknifing in reverse.

## Progress

- **v0.46, step 1 done:** trailer physics, hitching and unhitching, tipping and jackknifing, the box trailer in test mode (DECISIONS v0.46).
- **v0.48, step 2a done:** the HUD line for the trailer and its load, and the trailer's sound (DECISIONS v0.48).
- **v0.49, step 2b done:** the box trailer redrawn from a Commons photograph, and the Army No. 5 built from published figures and the owner's photographs, with its lunette ring on the pintle hook (DECISIONS v0.49). The No. 5 has no photograph that can be kept in the repo; `reference/vehicles/army-no5-trailer/SOURCES.md` lists what still disagrees. The box trailer's Commons photograph still needs downloading into its folder (Wikimedia rate-limited the v0.49 session).
- **Next, step 3:** Episode 4 itself: the map, the delivery goal, water for the trailer (buoyancy and drag; drums float), a trailer tyre cut on Realistic, drums coming loose, and camps saving the trailer and its load.

## The questions that were asked

One question at a time, each with a recommended option (the owner's preference).

1. **Which job comes first?** Recommended: fuel drums on a small box trailer, delivered to someone at a camp. Towing another vehicle (on an A-frame, a car trailer or a rigid tow bar) can come in a later update.
2. **Where?** A new episode (Episode 4, the Frenchmans Track, is next in SPEC.md §2) or a second job on a map that exists. One of Episode 2's sources is a trip report titled "Laura to Maytown on Old Coach Road, alone with a trailer" (docs/HISTORY.md).
3. **Which trailers?** A 1980s 6x4 box trailer for the civilian vehicles. The Army's No. 5 trailer for the Perentie and Unimog, which already have the pintle drawn.
4. **Can the player unhitch?** Recommended: yes, so they can leave the trailer, drive or winch a hard section, then come back for it.
5. **What can go wrong?** Choose from: the trailer tipping on a side slope, a trailer tyre cut on Realistic, drums coming loose on rough ground, and jackknifing when reversing.

## Suggested build plan

Ship each step as its own update, following CLAUDE.md.

1. **Trailer physics and hitching, tested headless first.** The trailer is a Rapier dynamic body with its own ray-cast wheels (no drive, no steering), joined to the vehicle by a spherical joint at `towPoint`. Hitching and unhitching go on the existing interact key (E / RB) when the vehicle is backed up close. The load adds mass and moves the trailer's centre of mass. Tests: tow on the flat, up a climb, through a creek and in reverse. The trailer follows, the joint holds and the trailer unhitches cleanly. Try it in the studio scene (`scripts/studio`) too.
2. **Look and feel.** The trailer models, a follow camera that sits far enough back, a HUD line for the trailer and its load, and sound.
3. **The delivery job.** A goal type, for example `delivery: { trailer, cargo, to: poiId }`, that counts once the trailer is parked at that place with its load. Camps save the trailer and its load. The briefing gives the diary's reason. Drive the route with the autopilot (as `scripts/coach-drive.ts` does) towing behind every vehicle: fuel used, arrival time, and which lines a trailer can't take.
4. **Later:** towing another vehicle to deliver it, as its own update.

## Rules to keep

- CLAUDE.md's shipping steps, with each update one version step past `main`.
- History in docs/HISTORY.md held to sources, with disputed details left out. No real people as characters.
- Trailers suited to the 1980s, like the vehicles.

## A smaller leftover

Episode 2 has no side trips with something to find; Episode 1 does (`src/data/episodes/crebFinds.ts`). This was suggested in that session but not asked for, so ask the owner before adding it.
