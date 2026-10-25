# Unimog UL1700L — separate model study

An unapproved refinement of the game's Australian Army Unimog cargo truck. The game and completed Hilux, GQ Patrol, LC79 and Bush Tucker Man Perentie studies remain unchanged.

## Review

`Unimog-review.html` compares the original and proposed models under identical lighting and cameras. Drag to orbit and scroll to zoom. Independently hide the bumper, lamp guards, roof equipment or cargo canvas. Steering spans ±33° and suspension compression spans 200 mm.

Serve this folder locally:

```sh
python3 -m http.server 5221 --bind 127.0.0.1
```

Open <http://127.0.0.1:5221/Unimog-review.html>. This HTTP route is tested. Direct-file loading remains untested because the managed test browser blocks file navigation.

`unimog-proposal-v1.glb` contains the complete proposed truck in its parked stance. Export GLB produces that complete stance even when review parts are hidden, wheels posed or Original selected. Static comparisons, 24 inspection views and `Inspection-gallery.html` are included. `VERIFICATION.md` records the checks, references and remaining limits.

## Changes

- A tapered, crowned bonnet with a closed front lip, aligned side louvers and hinge/latch details. The recessed grille has a three-point star badge.
- Fluted round lamps have complete wire-guard frames, connected bars and mounting feet. The fairlead has a backplate attached to the bumper; towing pins contact their mountings.
- A painted cab roof replaces the canvas slab. Its closed access hatch has hinges, latch and a handle on feet. The rear cab window has a real opening in the wall.
- Ten-stud pressed-steel wheel centres have open ventilation holes. Tyre size and tread envelope are retained.
- The cargo tilt has rounded shoulders, slight sag between bows, seams, hems, lashes and buckles. Recovery boards sit on external supports with closed straps around aligned crossbars.
- Dropside/tailgate hinge fittings, joined step rails, a continuous intake elbow and complete can straps improve the fittings. The side spare carrier mounts to the steel dropside with connected uprights.
- A narrowed front frame, raised cab floor/mounts, relieved bonnet cheeks and revised mudguard clearances accommodate steering/compression. The tray headboard moves rearward slightly to clear the spare behind the cab. These are visual changes; vehicle tuning and gameplay collision boxes are unchanged.

The green Army finish, 41-108 plate and touring accessories are retained. Exact year-specific fittings remain an interpretation for visual approval.

## Source and reproduction

The main proposal is `src/render/unimogProposal.ts`, with dedicated `unimogCanvas.ts`, `unimogSurface.ts`, `unimogShapes.ts`, `unimogRefinement.ts` and `unimogReviewInterior.ts`. `review.ts` constructs the comparison. The copied baseline `unimogBody.ts` has only non-rendering accessory IDs added; its rendered attributes exactly match the untouched game.

```sh
npm ci
npm run build
npm run audit
npm run dev
```

The browser checks `inspect.mjs` and `verify-v1.mjs` target the HTTP server above and require Playwright plus Chromium. Set `CHROMIUM_PATH` if needed. `npm run baseline` additionally requires the original game checkout, selected with `UNIMOG_GAME_SOURCE` outside this workspace.

No installation, publishing or game integration is included.
