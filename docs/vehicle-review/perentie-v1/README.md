# Bush Tucker Man Perentie — separate model study

An unapproved refinement of the game's Land Rover 110 Perentie, using Les Hiddins' first-series green General Service vehicle, Army registration **48-001**, as the target. The game and completed Hilux, GQ Patrol and LC79 studies remain unchanged.

## Review

`Perentie-review.html` compares the original and proposed vehicle under identical lighting and camera positions. Drag to orbit and scroll to zoom. Controls hide the brushguard, roof equipment, bonnet gear or canvas independently. Steering runs through ±31° and suspension compression through 150 mm.

Serve this folder locally:

```sh
python3 -m http.server 5211 --bind 127.0.0.1
```

Open <http://127.0.0.1:5211/Perentie-review.html>. This HTTP route is tested. Direct-file navigation is blocked by the managed test browser and remains untested.

`perentie-proposal-v1.glb` is the complete proposed vehicle in its parked stance, with the rear canvas rolled up. The viewer exports the same complete stance even when accessories are hidden, wheels posed or Original selected. Static comparisons, an inspection sheet and `Inspection-gallery.html` are included. `VERIFICATION.md` records the checks, references and limits.

## Changes

- Shaped fabric roof with rounded shoulders, slight sag between bows, seams and a windscreen valance. Rolled side/rear curtains have wrap bands, buckles and visible support bows.
- Pioneer tools occupy the bonnet on connected brackets. The extra bonnet spare is removed; the underslung rear spare remains. The Army plate still reads 48-001.
- Fluted sealed-beam headlamps, round indicator/parking lamps, recessed horizontal grille louvers and a small two-line LAND ROVER badge replace the generic lights/grille.
- A single swept brushguard beam and continuous bent hoops replace the disconnected wing blocks and cylinder/ball joins.
- Slim external supports carry the recovery boards above the fabric. Their straps close beneath the actual crossbars. Two front seats, supported rear benches, the swag and tucker box remain visible through the open tub.
- Wheelhouse roofs are recessed inside the painted skins. Front liners/frame clear the steering envelope. The rear frame and spare cradle have room for the underslung tyre without clipping the rails or tailgate.

The exact filming-day configuration and accessory dimensions remain an interpretation. The review retains the game's touring load and does not add its No.5 trailer or change vehicle tuning.

## Source and reproduction

The proposal is `src/render/perentieProposal.ts`. Its dedicated modules are `perentieCanvas.ts`, `perentieRefinement.ts`, `perentieShapes.ts` and `perentieReviewInterior.ts`. `review.ts` constructs the comparison. The copied baseline `perentieBody.ts` has only non-rendering accessory IDs added; its rendered attributes match the original game.

```sh
npm ci
npm run build
npm run audit
npm run dev
```

The browser checks `inspect.mjs` and `verify-v1.mjs` use the HTTP server above and require Playwright with Chromium. Set `CHROMIUM_PATH` if needed. `npm run baseline` also requires the untouched original game checkout, selected with `PERENTIE_GAME_SOURCE` outside this workspace.

No installation, publishing or game integration is included. This model is ready for appearance review and approval.
