# Sooty MkII-inspired modified Toyota 80 Series — review 01

A new, isolated model study inspired by Shaun Whale's light blue-grey Sooty MkII, as selected by the user. No vehicle has been added to the game. Both original game checkouts and all eight completed vehicle studies remain unchanged.

## Review

Open `Sooty80-review.html`, or run `python -m http.server 5261` in this folder and visit `http://localhost:5261/Sooty80-review.html`. The viewer bundles its own code and procedural geometry; it needs no CDN or downloaded assets. Local HTTP was verified in this environment. Direct file navigation is blocked by the managed browser policy and remains untested here.

The **Body only** button shows the same scratch-built shell, lift, tyres, cabin and chassis with plain bumpers. **Complete build** adds the external touring equipment. This is a new-model comparison, not an original-game or factory-stock comparison. Lighting and camera positions match between both views.

Orbit, zoom and use the six camera buttons. Hide the bullbar, roof equipment, rear carrier or roof to inspect fitting joins. Steering reaches ±34°. Compression ranges from the parked review stance through 110 mm; this is a geometric inspection range, not a measured travel specification for Sooty. Export GLB always gives the complete, parked proposal, independently of hidden parts, selected view and wheel pose.

- `sooty80-proposal-v1.glb`: complete assembly, including cabin, wheels, visible suspension and roof boards.
- `Sooty80-comparison.png`: matching body-study / complete-build views.
- `Inspection-gallery.html` and `Sooty80-inspection-sheet.png`: 28 inspection views.
- `VERIFICATION.md`, JSON reports and SHA256SUMS.txt: checks, limits and integrity evidence.

## Model

The body is built specifically for the 80 Series: nominal 2,850 mm wheelbase, a broad sloping bonnet, rounded wing shoulders and lower-door surfaces, circular wheel openings, a raked windscreen, tapered window pillars, a crowned roof, four doors, rear quarter glazing and a split tailgate. Glass sits in real openings; cargo quarter windows have lift-up-style frames, hinges and locks. The cabin is right-hand drive, with a front-row interior and a rear touring layout containing drawers, fridge and water storage.

The chosen MkII-inspired exterior uses light blue-grey matte paint, black custom-style bullbar/scrub rails/sliders/rear bar, a red winch housing, paired LED driving lamps, a stainless raised intake, a full-length slatted platform on backbone-style supports, a dual-row roof light bar, a passenger-side awning, camp lights, four stacked recovery boards and a rear swing-out spare. The six-stud beadlock-style wheels have open spoke windows, a connected barrel, an outer ring and 24 ring bolts per side.

Review geometry targets include a nominal 35-inch tyre diameter, 315 mm tyre width and 1,670 mm wheel-centre track. A parked axle offset 76 mm lower than the comparison convention represents the reported three-inch lift. Wheel openings, floor returns, frame kick-ups, spring seats, shock towers and radius-arm positions are checked against the chosen tyre/suspension envelope.

## Reference basis and approximations

The principal MkII source is Repco's 2025 build rundown:
https://www.repco.com.au/know-how/ex31-sooty-mkii-4wd-rig-rundown

It describes the blue-grey Raptor finish, black custom barwork, Runva 11xp Red Edition winch, stainless intake, three-inch lift, 35-inch tyres on Dirty Life beadlocks, backbone-supported platform, four roof recovery boards, side awning, lift-up cargo windows and revised rear storage. Raptor's own build page also identifies the finish and black barwork:
https://raptorcoatings.com/au/product/sooty-mkii/

Toyota's model history and catalogue supply the underlying 80 Series proportions and nominal wheelbase:
https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60013935/index.html
https://toyota.jp/ucar/catalog/brand-TOYOTA/car-LAND_CRUISER_80/199305/1007011/

This is a reference-informed interpretation. The tools supplied written information and image descriptions, but no inspectable real-car photograph. Exact owner paint formula, bar contours, wheel spoke design, carrier arrangement, board colour, lamp optics and accessory hardware are approximations. One rear spare is shown in this proposal; its carrier layout is not certified to the owner's current build. `80 MK2` is a study plate, not a reproduced registration. Decorative badges and accessory shapes are procedural approximations.

This package is a visual review model. Its isolated data uses a game vehicle ID as a preview adapter, with inherited drivetrain/mass values; it does not simulate Sooty's engine or performance. A dedicated game entry, vehicle physics, cockpit, damage/dirt behaviour, lamps/beams, water intake, sounds and an in-game performance pass remain integration work after approval. Geometry counts and sampled-clearance limits are documented in VERIFICATION.md.

## Reproduce

With Node 22+, Python 3, Pillow and Chromium: `npm ci`, `npm run build`, `python bundle_review.py`, `npm run audit`, `npm run baseline`. Serve the folder on port 5261, then run `npm run inspect`, `npm run verify` and `python package_review.py`. Browser checks use `/usr/bin/chromium` or `CHROMIUM_PATH`.

The model, viewer, build and geometry audits are self-contained. Packaging's original-repository and prior-study preservation checks require those external provenance folders. No game source baseline is claimed for this newly created vehicle.
