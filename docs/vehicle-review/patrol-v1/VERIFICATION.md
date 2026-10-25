# GQ Patrol verification record

Status: separate appearance prototype prepared for the owner's review. No game files were changed, merged or published, and the Hilux review was not edited.

## Visual scope

The chosen vehicle is the existing early GQ Series 1 touring wagon. The work changes the front bar, bonnet/roof surfaces, panel curvature, grille lettering, number plates, wheel clearances and accessory connections. It preserves the vehicle's white/charcoal finish, round headlamps, black flares, snorkel, rack and touring equipment.

Close-up inspection found a cargo wheel-cover edge protruding through a rear quarter, a wind deflector crossing the board tips and square strap blocks protruding beyond the rolled swag. These were corrected before the final package.

## Geometry and clearance

`geometry-audit.json` checks the proposed body and wheel meshes for finite attributes, nonzero normals, collapsed triangles and contrary face/normal directions. All failure counts are zero. Cleanup removes inherited collapsed primitive faces while retaining the remaining attributes and smooth normals.

`mesh-clearance-full.json` uses two bounding-volume hierarchies to test actual tyre/body triangle-surface intersections. It covers 2,312 wheel states: both front wheels at one-degree steering steps through ±33°, and all wheels at 10 mm compression steps through 160 mm. No intersections were found.

`all-solid-clearance.json` separately samples 3,214 unique wheel vertices against nearby oriented/rounded boxes captured from the model builder. This catches a wheel point contained within a solid even when surface intersections alone would be insufficient. No penetrations exceed the 0.5 mm threshold in the recorded poses.

These tests sample visual geometry. They are not a continuous-motion proof, a factory chassis specification or a gameplay collision test. The steering/suspension preview moves the wheels, axles and dampers; the inherited driveline is not a complete articulated mechanical rig.

## Viewer and export

`validation-v1.json` records model switching, bar hiding with headlamps preserved, roof-gear hiding, exact geometry restoration, six camera presets, steering/compression controls, reset, the export button and GLB reload.

The GLB exported with the original selected, the proposal's bar and rack hidden, and its wheels posed at full lock/compression must be byte-identical to the complete parked export. Source and reimported GLB triangle counts match.

The standalone HTML is tested over local HTTP. Direct-file loading is untested because the managed browser blocks file navigation.

The 22 inspection images cover both front/rear quarters and sides, straight front/rear, top and underbody, both front joins, grille/bonnet without the bar, roof without equipment, roof cargo, rear lamps/doors, cabin, both steering locks and rear compression. The comparison images use identical lighting and cameras for the original and proposal.

## Reproduction and isolation

TypeScript checking, the production build, formatting checks and a clean dependency install/build pass. `baseline-check.ts` compares every baseline position, normal, colour, UV, material slot and dirt tag with the untouched game. All match. The extra baseline attribute is only an accessory ID used by the review viewer.

`provenance.json` records the original checkout revision and clean status. The package includes source, GLB, standalone viewer, inspection images, reports and SHA-256 checksums. The ZIP and its checksum manifest are verified after packaging.

The proposed body has 83,229 triangles versus 57,420 in the original, about 45% more. The complete exported assembly has 113,828 triangles. No phone or in-game frame-rate target has been tested. Game lighting, collision shapes, dirt/damage deformation and integration remain untested.

## Real-car reference

[Nissan's 1991 standard-roof Patrol/Safari heritage entry](https://www.nissan-global.com/EN/HERITAGE_COLLECTION/501_patrol_granroad.html) establishes the Y60 context, 2,970 mm wheelbase, coil-sprung layout and 31×10.50R15 tyre specification. Its particular Granroad trim is not treated as a complete specification for every Australian GQ variant.

The work uses accessible reference information, as requested. Direct photographic matching was not completed because reference image downloads are blocked. Exact market/year trim, grille details and body proportions remain an interpretation of the early GQ rather than a certified factory reconstruction. The bar and roof equipment are touring additions.
