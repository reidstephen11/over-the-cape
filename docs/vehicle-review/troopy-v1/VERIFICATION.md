# HZJ75 Troop Carrier verification record

Status: isolated appearance proposal for the owner's approval. No game files were edited, merged or published. All completed Hilux, GQ Patrol, LC79, Perentie and Unimog study files retain their manifest checksums.

## Target and reference

The target is the game's white 75 Series Troop Carrier, using an early-1990s HZJ75 touring configuration with round lamps, a grey grille, aftermarket bar, rack, boards, can and two spares. The HZJ-75 plates and simulation tuning are retained.

[Toyota's 70 Series history](https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60012612/index.html) provides the model-family context and records the 1999 front-suspension change. It is not used as a detailed specification for this particular Australian trim.

The [1990–95 dark-silver OEM grille listing](https://www.myautoparts.com.au/collections/toyota-landcruiser/products/dark-silver-grille-oem-suits-toyota-landcruiser-70-75-series-1-1990-to-1-1995) guides the early-style front treatment. The [right large barn-door listing](https://cruiserutesandparts.com.au/product/toyota-landcruiser-75-78-series-troop-carrier-glass-rubber-right-hand-barn-door-large-door-side-used/) and [left small barn-door listing](https://cruiserutesandparts.com.au/product/toyota-landcruiser-75-78-series-troop-carrier-left-hand-barn-door-small-door-side-13288-reco/) provide direct evidence for correcting the reversed doors and rear loadout.

The work uses accessible reference information as authorised. Direct photographic matching was not completed because usable reference-image downloads are unavailable. Exact grille fins/lettering, corner lenses, roof pressings, bar fabrication, interior trim and accessory dimensions remain approximations for review. This is not a certified factory reconstruction.

## Appearance changes and inspection

The large rear door, spare and carrier are on the right, with the small door and plate on the left. Window widths, split, handle and hinges follow that arrangement. The cover has shaped shoulders and a perimeter seam and can be hidden for inspection.

The bonnet has a continuous crown, replacing the raised rectangular patch. The roof has a slight crown with conforming ribs; lower body skins have subtle curvature. Normal transformations follow those surface changes. The early-style grille and headlamp surrounds have more definition and readable lettering; the corner lenses wrap onto the body.

The front bar is a single swept pan with continuous bent hoops and connected foot plates. The number plate was initially buried in the pan's front bevel; it now sits on a backing bracket outside that face. The rack feet meet gutter clamps and rails. Boards, can and roof spare have supports and complete straps; the spare's webbing follows its shoulders rather than forming rectangular hoops above it. The wind deflector contacts its supporting rails.

Wheel-opening clearances, liners, frame and floors were adjusted around the tyre envelope. A rear liner initially touched the projecting hub; moving it inward resolves that contact. Rear wheel boxes are closed, bench supports clear the tyres and the floor is split around the wheel space. The rear underfloor tank is shortened and moved clear of the tyre. These are visual changes; game tuning and physical collision boxes are unchanged.

The 24 final views cover all quarters/sides, front/rear, top, underbody, both bar joins, uncovered grille/bonnet, roof removed, roof cargo/feet, rear lamps, barn doors, uncovered rear spare, cabin, both steering locks and rear compression. Original/proposal comparison images share lighting and camera positions.

## Geometry and clearance

`geometry-audit.json` checks every proposed body/wheel attribute for finite values, nonzero normals, collapsed triangles and contrary face/normal directions. All failure counts are zero. Cleanup removes 1,056 collapsed body faces and four wheel faces while preserving remaining normals, colours, material slots and dirt tags. This is not a watertight-manifold certification for the multipart model.

`mesh-clearance-full.json` tests actual tyre/body triangle intersections using two bounding-volume hierarchies. It covers 1,612 wheel states: both front wheels through ±30° at one-degree increments, and all wheels through 120 mm compression at 10 mm increments. No intersections remain.

`all-solid-clearance.json` independently tests 2,608 unique wheel vertices against nearby oriented/rounded boxes. No sampled penetration exceeds 0.5 mm. `spare-clearance.json` tests both spares against the fixed body, excluding each spare's own intended cover/carrier/straps. Both are clear. Nested accessory IDs keep these checks independent of the viewer's roof-gear controls.

These are sampled appearance checks, not a continuous-motion proof or gameplay collision validation. Tyre spin, extreme droop and every terrain articulation are not exhaustively checked. The preview moves wheels, axles and suspension components; it is not a complete mechanical rig.

## Viewer, export and package

`validation-v1.json` records model switching, all six cameras, independent accessory hiding, exact restoration, steering/compression, reset, export and GLB reload. Hiding the bar preserves the lamps. Hiding the proposed roof also hides its headlining for interior inspection.

An export made with Original selected, review parts hidden and wheels posed is byte-identical to the complete parked GLB. Export preserves the live pose. Source and reimported GLB both contain 102,905 triangles; assembly bounds are recorded in the report. Browser errors: zero.

The bundled HTML includes its JavaScript and is tested over local HTTP. Direct-file navigation is untested because the managed browser blocks it. Mobile layout, in-game frame rate, dirt/damage deformation and integration remain untested.

TypeScript checking, production build, formatting and a clean dependency install/build in a separate copy pass. `baseline-check.ts` confirms every baseline position, normal, colour, UV, material slot and dirt tag exactly matches the original game. Additional accessory IDs only support the review controls.

The body has 78,470 triangles versus 52,460 originally, about 50% more. The wheel has 4,828 triangles. No game performance target has been validated for this review geometry.

`provenance.json` records source revisions, clean checkouts, preservation of all prior studies and artifact hashes. The ZIP contains source, locked dependencies, GLB, viewer, renders, reports and SHA-256 checksums. Archive CRC and all archived checksums are verified after packaging.
