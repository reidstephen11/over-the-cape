# LC79 — separate model study

An unapproved refinement of Over the Cape's lifted V8 single-cab LandCruiser with alloy tray and black canopy. The game, Hilux study and GQ Patrol study remain unchanged.

## Review

`LC79-review.html` compares the original and proposed models under identical lighting and cameras. Drag to orbit, scroll to zoom, hide the bullbar or roof equipment, and test steering through ±31° and suspension compression through 200 mm.

Serve this folder locally:

```sh
python3 -m http.server 5201 --bind 127.0.0.1
```

Open <http://127.0.0.1:5201/LC79-review.html>. This HTTP route is tested. Direct-file navigation is blocked by the managed test browser, so that route is untested.

`lc79-proposal-v1.glb` contains the complete proposed vehicle in its parked stance. The viewer exports the same complete stance even with accessories hidden, wheels posed, or Original selected. `LC79-comparison.png`, `LC79-inspection-sheet.png` and `Inspection-gallery.html` provide static views. Read `VERIFICATION.md` for checks and limits.

## Changes

- Modern 70 Series front: hexagonal grille ribs, readable TOYOTA lettering, round projector/running-ring lamps behind clear covers, projecting indicator pods, three lower cooling slots and a narrow upper vent.
- A hollow bonnet scoop with a recessed throat, slight bonnet crown, crowned cab roof and conforming ribs. Flat extrusion caps use stable planar normals while retaining their bevels.
- A single swept bullbar pan and continuous bent hoops, with connected feet and light mounts. The snorkel uses a continuous sweep.
- Chamfered canopy shoulders, distinct gullwing hatch skins and gaskets, exposed hinge knuckles, latch surrounds, louvres and a rear hatch perimeter. Rack feet contact the narrower roof; board straps return beneath actual crossbars.
- Raised rear mudguards and shaped tray side rails clear the lifted ute's tyre envelope. The front frame neck and inner liners clear full steering/compression.

## Source and reproduction

The main proposal is `src/render/lc79Proposal.ts`, with dedicated `lc79Shapes.ts` and `lc79Refinement.ts`. `review.ts` constructs the comparison. The copied baseline `lc79Body.ts` has only a non-rendering accessory-ID attribute added; all baseline rendered attributes match the untouched game.

```sh
npm ci
npm run build
npm run audit
npm run dev
```

The browser checks `inspect.mjs` and `verify-v1.mjs` target the HTTP server above and require Playwright with Chromium. Set `CHROMIUM_PATH` if needed. `npm run baseline` additionally requires the original game checkout, selected with `LC79_GAME_SOURCE` outside this workspace.

This is an appearance proposal for review. No installation, publishing or game integration is included.
