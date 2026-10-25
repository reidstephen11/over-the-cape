# Hilux revision 03 — verification

Status: prepared for visual approval as a separate model study. No game installation, merge or deployment has occurred. Exact factory appearance is not certified.

## Recovery and baseline

Revision 02 was reconstructed from the saved model-building commands in the earlier chat. Its body reproduces the reported 63,768 triangles and its geometry audit results. The baseline check compares every position, normal, colour, UV, material slot and dirt tag with the untouched Over the Cape Hilux. All match.

The reconstruction and revision 03 live outside both game checkouts. `provenance.json` records the source revision and clean-checkout evidence.

## Problems found beyond the previous audit

The earlier audit checked an outer-panel envelope and the inner liner walls. A broader scan exposed intersections with the front chassis rails, liner ceilings, solid rear wheel housings, bed floor and fuel tank. Applying the broader scan to recovered revision 02 produces 406 failing combinations of wheel pose and nearby part; these are recorded in `clearance-before.json`.

Revision 03 narrows the drawn front frame, adjusts the bar mounts, moves the tank inside the frame, raises the liner ceilings and uses hollow rear housings over floor cutouts. It also reduces the roof crown, adjusts the tub's inner walls and places the waist crease against the panel skins.

## Geometry evidence

- `geometry-audit.json`: the proposed body has zero non-finite coordinates/normals, zero zero-length normals, zero collapsed triangles and zero contrary face/normal directions under the recorded check. The bonnet shell has no boundary, non-manifold or inconsistently wound edges.
- The panel, liner-wall and named structural-box checks pass 1,536 sampled wheel poses: front steering at one-degree steps through ±31°, with compression at 10 mm steps through 110 mm; rear wheels are tested through the same compression range.
- `all-solid-clearance.json`: 2,766 unique wheel vertices are sampled against the nearby solid boxes from 300 recorded box primitives across those poses. No penetrations exceed the 0.5 mm test threshold. Broad-phase selection uses transformed bounding boxes. The separately drawn frame profile is covered by the named structural-box check.
- Top-down ray samples find the expected bonnet and wing surfaces, with intentional seams excluded.

These are sampled visual-geometry checks, not a continuous swept-volume proof or a physics/collision certification. They do not establish that the whole multipart vehicle is watertight.

## Viewer, export and visual inspection

`validation-v3.json` records the final browser results: model switching, accessory hiding with headlamps preserved, exact index restoration, six camera controls, wheel/suspension pose controls, reset, export and GLB reload. The export made while viewing the original, with the proposal's bar hidden and wheels compressed at full lock, must be byte-identical to the complete parked export.

The standalone HTML is tested over local HTTP. Direct `file:` navigation is blocked by the managed browser's administrator policy; it is recorded as untested, not passed.

The 18 images in `inspection/` cover both front quarters and sides, both rear quarters, straight front and rear, top, underbody, both bar joins, roof seams, rear lamps, tub, cabin, bonnet without the bar, and a compressed front wheel at steering lock. They were inspected for detached trim, visible gaps, tube connections, reversed text, panel shading, accessory connections and visible tyre penetration.

TypeScript checking and the isolated viewer's production build pass. Formatting checks cover the edited model, viewer and audit files. The game's physics and browser suites were not rerun because no game files changed.

## Real-car references and limits

[Toyota UK's 1979 Hilux 4WD brochure article](https://mag.toyota.co.uk/in-focus-1979-toyota-hilux-4wd/) supplies a 2,800 mm wheelbase, 1,690 mm width, 1,775 mm height and 1,430 mm deck width, plus bench head restraints and a protected tank inside the chassis. These informed the roof, tub and tank changes. UK specifications do not establish every Australian-market detail.

[Toyota's vehicle history](https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60015540/) establishes the third-generation context and 1979 4WD introduction.

Reference text and image-search descriptions were accessible, but downloading the reference photographs was denied by the environment network policy. I could inspect the rendered model directly; I could not complete a direct photographic comparison. Grille slat details, regional lamp arrangements, exact bed length/overhang proportions, mirrors, frame construction and trim remain interpretation or inherited approximations. The rack, bullbar and recovery equipment are touring additions.

The proposal is an improvement study with verified local geometry and viewer behaviour. It is not a factory-exact RN36/RN46 reconstruction. Performance on a phone, damage deformation, game lighting, animation and collision integration remain untested.
