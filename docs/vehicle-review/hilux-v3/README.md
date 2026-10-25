# Hilux review — revision 03

An unapproved appearance study for Over the Cape's early round-headlamp Hilux. The game has not been changed or published.

## Review the model

- `Hilux-review.html` is the self-contained interactive comparison. It includes the original game model and the proposal with identical lighting and camera positions. Drag to orbit, scroll to zoom, switch models, hide the bullbar, and try steering and suspension compression.
- `hilux-proposal-v3.glb` is the complete proposed model at its parked stance, suitable for inspection in Blender or another glTF viewer. Export GLB in the comparison produces that complete stance even if accessories are hidden or the wheels are posed.
- `Hilux-comparison.png` compares the original and proposal. `Hilux-inspection-sheet.png` and `Inspection-gallery.html` contain the inspection views.
- `VERIFICATION.md` describes the checks and their limits.

If your browser does not open the HTML directly, serve this folder:

```sh
python3 -m http.server 5185 --bind 127.0.0.1
```

Then open <http://127.0.0.1:5185/Hilux-review.html>. This HTTP route was tested. The managed test browser blocks `file:` URLs, so direct-file loading could not be verified here.

## Changes

The recovered revision 02 supplies the continuous bullbar hoops, revised grille and lenses, crowned bonnet, curved panel skins, tapered cab and corrected rack connections. Revision 03 corrects additional tyre intersections with the front frame, fuel tank, wheel-well ceilings and rear tub floor. Rear wheel housings are now hollow covers, with floor openings beneath them. The bar mounts follow the narrower front frame.

This revision also adjusts the roof crown and tub inner width using Toyota's published dimensions, attaches the waist crease to the panel skins, adds bench-seat head restraints and a tank shield, and adds review controls for wheel pose. Factory photographic matching remains incomplete; see the verification record before approving.

## Source and reproduction

The copied game modules are in `src/`. The proposal is built by `src/render/hiluxProposal.ts` and `src/render/hiluxBullbar.ts`; `review.ts` constructs the isolated viewer. The comparison baseline remains in `src/render/hiluxBody.ts`. Its rendered attributes match the original checkout; an extra attribute only identifies accessories for the viewer.

```sh
npm ci
npm run build
npm run audit
npm run dev
```

`npm run baseline` additionally requires an untouched Over the Cape checkout. Set `HILUX_GAME_SOURCE` to its absolute directory if it is not at the recorded workspace location. No baseline command writes to that checkout.

Browser checks use `verify-v3.mjs` and `inspect.mjs`, Playwright, and Chromium. The verification script accepts `CHROMIUM_PATH`; the recorded runs used `/usr/bin/chromium` with SwiftShader. They target the HTTP server above. The exported model is a review asset; game integration, collision tuning and mobile performance have not been tested.
