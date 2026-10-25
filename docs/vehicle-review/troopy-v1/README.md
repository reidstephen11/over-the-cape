# HZJ75 Troop Carrier — separate model study

An unapproved refinement of the game's white 75 Series Troopy, using an early-1990s HZJ75 touring configuration. The game and completed Hilux, GQ Patrol, LC79, Perentie and Unimog studies remain unchanged.

## Review

`Troopy-review.html` compares the original and proposed vehicle under identical lighting and cameras. Drag to orbit and scroll to zoom. Independently hide the bullbar, roof gear, rear spare cover or roof. Steering spans ±30° and suspension compression spans 120 mm.

Serve this folder locally:

```sh
python3 -m http.server 5231 --bind 127.0.0.1
```

Open <http://127.0.0.1:5231/Troopy-review.html>. This HTTP route is tested. Direct-file loading is untested because the managed test browser blocks file navigation.

`troopy-proposal-v1.glb` contains the complete proposed vehicle in its parked stance. The viewer exports that same complete stance even when parts are hidden, wheels posed or Original selected. Static comparisons, 24 inspection views and an inspection gallery are included. `VERIFICATION.md` records the checks, references and limitations.

## Changes

- Correct unequal rear doors: the large door and covered spare are on the right; the small door and plate are on the left. The cover has shaped shoulders and a seam; hinges have visible pins.
- A continuous bonnet crown replaces the raised rectangular patch. The roof has a slight crown and conforming ribs; lower side skins have subtle pressed curvature.
- An early-style grey grille has two horizontal rails, recessed fins and TOYOTA lettering. Square lamp surrounds and wraparound amber/clear corner lenses have clearer definition.
- One swept bullbar pan and continuous bent hoops replace separate bumper wings and cylinder/ball joints. The number plate sits on a backing bracket outside the pan face.
- Rack feet connect to gutter clamps and rails. Boards, can and roof spare sit on supports; straps close around the load and aligned crossbars. The roof spare has a cradle that clears the roof and deck.
- Six-lug steel wheel centres have open ventilation holes. The tyre envelope is retained.
- Wheel openings, liners, front frame and segmented floors clear steering/compression. Interior wheel boxes and supported benches replace solid supports crossing the tyre space. Vehicle tuning and game collision boxes are unchanged.

The exact grille pattern, trim and accessory dimensions remain interpretations for approval, rather than a scanned factory reconstruction.

## Source and reproduction

The main proposal is `src/render/troopyProposal.ts`, supported by dedicated `troopyShapes.ts`, `troopyRefinement.ts` and `troopyReviewInterior.ts`. `review.ts` constructs the comparison. The baseline `troopyBody.ts` only adds non-rendering accessory IDs; its rendered attributes match the untouched game.

```sh
npm ci
npm run build
python3 bundle_review.py
npm run audit
npm run dev
```

The browser checks `inspect.mjs` and `verify-v1.mjs` require Playwright with Chromium and use the HTTP server above. Set `CHROMIUM_PATH` if needed. `npm run baseline` additionally requires the original game checkout, selected with `TROOPY_GAME_SOURCE` outside this workspace.

No installation, publishing or game integration is included.
