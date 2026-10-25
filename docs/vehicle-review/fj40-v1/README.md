# FJ40 / shortie review 01

A separate, unapproved model study for the game's short-wheelbase 40 Series LandCruiser. No game integration has been performed. The proposed appearance uses the 1979–84 rectangular grille-surround style and retains the game's cream touring vehicle, two spares, recovery boards, roof luggage and RHD cabin.

## Review

Open `FJ40-review.html`. If your browser requires HTTP, run `python -m http.server 5241` from this folder, then visit `http://localhost:5241/FJ40-review.html`. All viewer code is bundled locally; no CDN or online assets are required. This environment's managed browser blocks file navigation, so the standalone viewer was verified over local HTTP.

Switch Original / Proposed, orbit and zoom, use the camera buttons, and hide the bar, roof equipment, bonnet spare or roof to inspect the model. Steering reaches ±34° and compression reaches 130 mm, using the unchanged game's wheel and suspension dimensions. Export GLB always exports the complete, parked proposal regardless of review controls.

`fj40-proposal-v1.glb` is the complete parked assembly. `FJ40-comparison.png` shows matching before/after views. `Inspection-gallery.html` contains 24 embedded close-ups. The source, validation results, checksum manifest and reproduction scripts are included.

## Changes

- One continuous rectangular front bezel around two round headlamps and a recessed dark mesh grille, with a readable TOYOTA emblem. Replaced the separate lamp surrounds and coarse cream checker grille.
- A single swept steel winch pan, continuous bent centre and side hoops, actual coincident tube junctions, matching foot plates and brackets, and a legible FJ-40 plate mounted beyond the pan.
- Rounded bonnet edges, seam and catches; gently crowned hardtop retaining its rounded rear quarter windows and gutters.
- Rack feet that reach the roof, gutter braces and clamps, supported toolbox handle, closed luggage straps, and recovery boards resting on the rack with straps returning around real crossbars.
- Six-stud dished steel rims with actual vent openings; spare carriers moved/supported to clear the body, with a bonnet clamp touching the spare hub and a closed jerry-can retaining band.
- Narrowed front engine lining and chassis rails to clear steered tyres; recessed rear wheelhouses and interrupted floors around the rear wheel envelope.

## Reference basis and limits

The source identifies this body as a 40 Series. This study interprets its late square-bezel intent as a 1979–84 style FJ40; the game does not specify a single model year or a particular restored vehicle. The original 2.3 m wheelbase, 1.664 m nominal body width and wheel/suspension tuning are retained. Touring accessories are an interpretation, not a claim of factory equipment.

Accessible reference information:

- Toyota, vehicle lineage: https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60012611/index.html
- Toyota UK, 40 Series history: https://mag.toyota.co.uk/history-of-the-toyota-land-cruiser-heavy-and-light-duty-models-2/
- Genuine Toyota 1979+ headlamp/grille bezel, part 53111-90301: https://shop.cruiserparts.net/index.php?main_page=product_info&products_id=243
- OEM 1979–84 rectangular-bezel emblem application: https://www.cityracerllc.com/products/grille-emblem-for-79-to-84-land-cruiser-fj40

Real-car photo downloads remain unavailable in this environment. This is a verified geometry proposal informed by accessible descriptions and parts applications, not a dimensionally certified or photographic replica. It has not been tested in game for performance, damage, dirt or physics collision changes. Approval and a later integration/performance pass are still required.

## Reproduce

With Node 22+, Python 3 and Pillow: `npm ci`, `npm run build`, `python bundle_review.py`, `npm run audit`, `npm run baseline`. Start the local HTTP server on 5241, then run `npm run inspect`, `npm run verify` and `python package_review.py`. Browser checks use Chromium at `/usr/bin/chromium` or `CHROMIUM_PATH`. The baseline check reads the original checkout from `FJ40_GAME_SOURCE`, defaulting to the workspace source checkout; packaging also verifies the prior review manifests and the original checkout revisions. These external provenance checks require those original folders. Rendering, exporting, building and geometry audits are self-contained.
