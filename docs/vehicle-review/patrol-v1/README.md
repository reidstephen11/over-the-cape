# GQ Patrol — separate model study

An unapproved refinement of Over the Cape's early GQ Series 1 touring wagon. The game and the Hilux review remain unchanged.

## Review

Open `Patrol-review.html` for an interactive original/proposal comparison. Both versions share the same lighting and camera. You can orbit, zoom, hide the bullbar, hide the roof equipment, and try steering through ±33° and suspension compression through 160 mm.

`patrol-proposal-v1.glb` contains the complete proposed vehicle in its parked stance. The viewer's Export GLB button exports that same complete stance even when accessories are hidden or the wheels are posed.

The comparison image, inspection sheet and `Inspection-gallery.html` provide static review views. `VERIFICATION.md` records the checks and remaining limitations.

If opening the HTML directly is unavailable, serve this folder:

```sh
python3 -m http.server 5191 --bind 127.0.0.1
```

Open <http://127.0.0.1:5191/Patrol-review.html>. This HTTP route is tested; direct-file navigation is blocked by the managed test browser.

## Changes

- A single swept bumper shape and continuous bent-tube hoops replace the overlapping bumper boxes and segmented tube joints. Driving lamps sit on connected pedestals; bumper indicators are placed on the visible faces.
- The bonnet has a continuous crown, the roof has a gentle crown with attached ribs, and the body sides have a subtle pressed curvature. The rectangular raised bonnet patch is removed.
- The Series 1 grille has readable Nissan lettering. Both plates read GQ-060. The existing round headlamps and two-tone touring identity are retained.
- Wheel openings, inner liners, front frame and floor cutouts clear the sampled steering/compression envelope. The rear cargo area has wheel covers and correctly sized cargo boxes. Rear-seat upholstery sits above the visible wheel opening.
- Inner wheel covers are recessed within the body. Recovery boards sit on crossbars with closed straps; the wind deflector clears their ends. The swag has curved strap bands, and the can has a rack strap.

## Source

The isolated source is in `src/`. The main proposal is `src/render/patrolProposal.ts`, with dedicated shape, surface, lettering and interior modules. `review.ts` builds the comparison. The copied baseline in `src/render/patrolBody.ts` has only a non-rendering accessory attribute added; its rendered attributes match the untouched game.

```sh
npm ci
npm run build
npm run audit
npm run dev
```

The browser scripts `inspect.mjs` and `verify-v1.mjs` target the HTTP server above and use Playwright plus Chromium; set `CHROMIUM_PATH` if needed. `npm run baseline` additionally requires the untouched game checkout, selected with `PATROL_GAME_SOURCE` when outside the recorded workspace location.

No game installation or publishing is included. Approve the appearance before any integration work.
