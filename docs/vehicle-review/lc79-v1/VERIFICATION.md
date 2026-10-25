# LC79 verification record

Status: an isolated appearance proposal for the owner's approval. No game files were edited, merged or published. The Hilux and GQ Patrol review artifacts retain their original checksums.

## Visual scope and reference

The starting vehicle is the game's lifted V8 LC79 single cab: oversized mud tyres, alloy tray, custom canopy, bullbar, snorkel and touring rack. Those custom features are retained. This is not a factory-standard chassis or accessory specification.

[Toyota Australia's description of the upgraded 70 Series](https://www.toyota.com.au/discover/news/legendary-toyota-landcruiser-70-series-range-upgraded) identifies round LED headlamps, projecting indicators, a black mesh grille with TOYOTA lettering, three lower cooling slots and a small upper hood vent. Those features guide the new front panel. Toyota offered the V8 manual single cab at that update, so the combination of V8 and updated front is plausible.

The work uses accessible reference information as requested. Direct photographic matching was not completed because reference image downloads are blocked. Exact light internals, grille cell dimensions, bonnet/scoop proportions, market trim and accessory fabrication remain approximations for visual review.

The scoop has separate crown/cheeks and a recessed throat. The bonnet and cab roof have gentle crowns. Flat extrusion cap normals are constrained to their planes while retaining bevel transitions. A single swept bumper pan and continuous bent hoops replace the separate wing blocks and cylinder/ball joints. Canopy shoulders are chamfered; side and rear hatch skins, gaskets, hinge knuckles, latch surrounds and louvres have visible depth. Rack feet sit on the canopy roof and board straps return beneath aligned crossbars.

## Visual inspection

The 22 final views cover both front/rear quarters and sides, straight front/rear, roof and underbody, both bar joins, grille/bonnet without the bar, roof without cargo, roof cargo, rear lamps/hatch, cabin, both front steering locks and rear suspension compression. Original/proposal comparison images share their lighting and camera positions.

The initial renders exposed reversed lettering, which was corrected. Clearance checks found rear tyres entering the original low mudguard roofs and tray side rails near full compression; the revised guard roofs and shaped rail lower edges resolve those contacts. The front frame neck and wheelhouse inner liners also provide room at full lock. Frame narrowing is visual geometry only: the vehicle tuning and gameplay physics are unchanged.

## Geometry and clearance

`geometry-audit.json` checks every proposed body/wheel attribute for finite values, nonzero normals, collapsed triangles and contrary face/normal directions. All failure counts are zero. The body cleanup removes 1,248 collapsed primitive faces while retaining the remaining colours, material slots, dirt tags and smooth normals. This is not a watertight-manifold certification for a multipart vehicle.

`mesh-clearance-full.json` tests actual tyre/body triangle surfaces using two bounding-volume hierarchies. It covers 2,688 wheel states: both front wheels at one-degree steps through ±31°, plus all four wheels at 10 mm compression steps through 200 mm. No surface intersections were found.

`all-solid-clearance.json` separately tests 3,718 unique wheel vertices against nearby oriented/rounded solid boxes captured from the builder. No penetration exceeds the 0.5 mm threshold. This complements the surface check by detecting sampled points contained within solid boxes.

These are sampled visual-geometry tests, not a continuous-motion proof or a gameplay collision test. Tyre spin, axle articulation, maximum droop and every possible road pose are not exhaustively tested. The suspension preview moves the wheels, axles and dampers; the inherited driveline is not a complete articulated mechanical rig.

## Viewer and export

`validation-v1.json` records original/proposal switching, bullbar hiding with headlamps preserved, roof-equipment hiding, exact accessory restoration, all six camera presets, steering/compression sliders, reset, the export button and GLB reload. Browser errors: zero.

The complete parked GLB is byte-identical to an export made with Original selected, the proposed bar/rack hidden and its wheels at full steering/compression. Export restores the live pose. Source and reimported GLB both contain 125,064 triangles, with matching exported assembly dimensions.

The bundled HTML is tested over local HTTP. Direct-file navigation is untested because the managed browser blocks it. The viewer includes its JavaScript and does not require a CDN. Mobile layout and frame rate are not validated.

## Build, isolation and package

TypeScript checking, production build, formatting checks and a clean dependency install/build in a separate copy pass. `baseline-check.ts` verifies that every baseline position, normal, colour, UV, material slot and dirt tag matches the untouched game. The accessory-ID attribute is used only by the review controls.

The proposed body has 90,453 triangles versus 59,280 in the original, about 53% more. The full exported assembly has 125,064 triangles. This additional geometry has not been measured against an in-game performance target. Game lighting, collision shapes, damage/dirt deformation and game integration remain untested.

`provenance.json` records the source checkout revision and clean status, model/viewer hashes and preservation of both prior model studies. The ZIP contains source, locked dependencies, GLB, standalone viewer, inspection images, reports and SHA-256 checksums. The archive CRC and every archived checksum are verified after packaging.
