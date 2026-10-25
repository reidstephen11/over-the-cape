# 1986 Camel Trophy Land Rover Ninety — review 01

An isolated, unapproved replacement model for the game's Camel Trophy vehicle. At the user's request this proposal rebuilds it as the 1986 Australian-event Land Rover Ninety. The original FJ40-based Camel car remains available in the comparison. Neither game checkout nor any completed vehicle study has been modified.

## Review

Open `Camel-review.html`, or serve this folder with `python -m http.server 5251` and visit `http://localhost:5251/Camel-review.html`. All viewer code and geometry are bundled locally. No CDN or remote assets are needed. This environment's managed browser blocks direct file navigation; the standalone viewer was verified over local HTTP.

Switch Original / Proposed, orbit and zoom, use the six camera buttons, hide accessories or the roof, and inspect steering at ±34° with compression from parked to 130 mm. Original and proposal share lighting and camera positions. Each rests on the same ground plane using its own tyre radius. Export GLB produces the complete proposal in its parked stance regardless of review controls.

- `camel-proposal-v1.glb`: complete parked assembly, including wheels, coil suspension, cabin and equipment.
- `Camel-comparison.png`: three matching before/after views.
- `Inspection-gallery.html` and `Camel-inspection-sheet.png`: 28 views, including intake, lamp mounts, cage junctions and sand ladders.
- `VERIFICATION.md` and the JSON reports: checks and practical limits.

## What changed

The Toyota shell is replaced with a short-wheelbase Land Rover body: flat wing tops, rolled bonnet, black civilian front lamp panels, slatted grille, vent flaps, one-piece windscreen, full metal doors and wind-up front panes, station-wagon rear glass, a single rear door and Alpine roof windows with real apertures. The front and rear overhangs are shortened. Nominal wheelbase is 2,360 mm, track 1,486 mm, and width across the arch flares about 1,780 mm. These are geometry targets, not a dimensional certification.

The proposal has a left-hand-drive cabin, brown cloth seat approximation, one forward-facing rear passenger seat, dog guard and visible coils. Narrow 7.50R16-style cross-country tyres use five-stud steel rims with actual vent holes. Body skins, floors and wheel boxes clear the sampled wheel envelope. The review also has revised spring/damper and radius-arm positions, explicit mounting seats/towers, kicked-up chassis rails and a raised rear load floor to clear the moving suspension.

Period equipment is reconstructed from accessible descriptions: a front/bulkhead cage and B hoop; an open, gutter-mounted Brownchurch-style basket deepening at the front; upright roof jerry cans; perforated metal sand ladders carried on its sides; four rectangular roof work lamps and two A-post swivel lamps; a raised left-side air intake entering the front wing; bonnet and rear-door spares; wing and rear-header tools; a tall 8274-style winch with a pierced hawse fairlead; and blue-and-yellow event plaques. The bars use continuous bent tubes and explicit mounting plates. Rack cargo rests on crossbars and uses closed retaining loops.

## Reference and interpretation

- Camel Trophy Club, Australia 1986: https://www.cameltrophyvehicles.com/history/australia-1986
- David Hatherill / Camel Trophy Owners Club, Ninety 2.5 N/A equipment account, mirrored with attribution: https://www.cameltrophyportugal.com/mirrors/www.cameltrophy.es/cameltrophy_LandRover90_110.html
- Rimmer Bros, early 90/110 dimensions and applications: https://rimmerbros.com/images/PDFs/Defender.pdf
- Land Rover technical dimensions (later classic 90, used to cross-check the 2,360 mm wheelbase): https://topix.landrover.jlrext.com/topix/service/archive/65727/technical%20specifications.pdf

The equipment account identifies LHD County station wagons, the early cage/rack layout, work lamps, two spare positions and the 1986 blue/yellow markings. This proposal does not represent a particular national team's chassis or registration. `CT-86` plates are study labels. Plaques are procedural interpretations; the fabric, intake head, tools, mounts and equipment dimensions are approximations. No real-car photograph was available for visual inspection through these tools, so photographic matching is not claimed.

The review uses isolated wheel-layout and cabin data plus coil suspension for the new model. Other drivetrain, mass and physics values are inherited placeholders for the static viewer; this does not simulate a 2.5-litre diesel Ninety. In-game controls, cockpit, lamps/beams, water intake, collisions, damage, dirt, sounds and performance require a separate integration pass after approval. Higher geometry counts are documented in VERIFICATION.md.

## Reproduce

With Node 22+, Python 3, Pillow and Chromium: `npm ci`, `npm run build`, `python bundle_review.py`, `npm run audit`, `npm run baseline`. Start the HTTP server on 5251, then `npm run inspect`, `npm run verify`, and `python package_review.py`. Browser checks use `/usr/bin/chromium` or `CHROMIUM_PATH`.

The baseline check reads the original checkout from `CAMEL_GAME_SOURCE`, defaulting to the workspace source directory. Packaging also checks the original repositories and prior study manifests, which require those provenance folders. Rendering, exporting, building and geometry audits are self-contained.
