# Unimog UL1700L verification record

Status: separate appearance proposal for the owner's approval. No game files were edited, merged or published. All completed Hilux, GQ Patrol, LC79 and Perentie review artifacts retain their manifest checksums.

## Reference and scope

The target is the game's Australian Army UL1700L cargo truck, retaining its green paint, 41-108 plate, canvas cargo tilt, two spares and touring load.

[Australian Frontline Machinery's cargo-with-winch listing](https://asset.australianfrontlinemachinery.com.au/unimogs/ex-military-unimogs/unimog-cargo-w-winch/) identifies the UL1700L's flat deck, roof hatch, vents, pintle hitch, can holders and spare. [Unidan's ex-ADF UL1700L listing](https://www.unidan.com.au/For-Sale/exadf-u1700l-crane-truck-sold/) specifically records a roof hatch and ten-stud rims. Its crane body and later tyre specification are not treated as the specification for this cargo build. The [Australian War Memorial record](https://www.awm.gov.au/collection/200683) establishes the Australian Army U1700L context rather than the precise configuration of 41-108.

The study uses accessible reference information as authorised. Direct photographic matching was not completed because usable reference-image downloads are unavailable. Exact grille dimensions, hatch location/shape, lamp guards, canopy tailoring, spare carriers and other market/year-specific fittings remain approximations for review. The boards and second spare retain the game's touring character.

## Geometry changes and inspection

The bonnet now has taper and a crown, a front closure lip and aligned louvers. The grille has a three-point star and recessed horizontal slats. Lamps have fluted covers; guard wires meet complete perimeter rings and have mounting feet. Fairlead and recovery-pin mountings contact the bumper.

The cab has a painted roof and closed hatch, with hinge/latch details and a supported handle. The rear window is cut through the wall. Ten-stud wheel centres contain actual ventilation openings. The cargo canvas is a thin skin with rounded shoulders, slight sag, seams, hems, lashes and buckles over visible bows. Boards sit on supports and have closed straps. Hinges, steps, can straps, intake and spare-carrier mountings have connected fittings.

The first mesh audit found a folded intake elbow; the wider bend removes the inverted faces. Clearance checks found front tyres touching the chassis, cab mount and bonnet cheeks at full lock/bump. The front frame/mounts are narrowed, the cab floor and rear guards raised, bonnet undersides relieved and tray bearers limited inside the tyre envelope. The spare behind the cab initially clipped the headboard; its position and the tray's front station now provide clearance. The side carrier's upper rail now lands on the steel dropside and is connected to its lower rail by uprights.

The final 24 views cover four quarters, both sides, straight front/rear, top, underbody, both bumper ends, uncovered grille, lamp guards, cab hatch, canvas removed to show bows, roof gear, rear lamps/curtain, cabin, both full steering locks, side spare and rear compression. Original/proposal comparison images share camera and lighting. Review-only hiding can leave lamps visible while their bumper is hidden; the exported truck includes its complete bumper and fittings.

## Checks and limits

`geometry-audit.json` checks every proposed body/wheel attribute for finite values, nonzero normals, collapsed triangles and contrary face/normal directions. All failure counts are zero. Cleanup removes 264 collapsed primitive faces from the body while preserving remaining smooth normals, colours, material slots and dirt tags. It is not a watertight-manifold certification for the multipart truck.

`mesh-clearance-full.json` uses two bounding-volume hierarchies to check actual tyre/body triangle intersections. It covers 2,856 wheel states: both front wheels through ±33° at one-degree increments, and all four wheels through 200 mm of compression at 10 mm increments. No surface intersections remain.

`all-solid-clearance.json` separately checks 3,088 unique wheel vertices against nearby oriented/rounded solid boxes. No sampled penetration exceeds 0.5 mm. `spare-clearance.json` checks each spare against the fixed body, excluding only its own intended carrier. Both are clear.

These are sampled appearance checks, not a continuous-motion proof, a complete mechanical rig or gameplay collision validation. Tyre spin, extreme droop and all terrain articulation are not exhaustively checked. The preview moves wheels, axles and dampers. Gameplay tuning and collision boxes are unchanged.

`validation-v1.json` records model switching, all six cameras, independent bumper/guard/canvas/roof-equipment hiding, exact restoration, steering/compression, reset, export and GLB reload. The export made with Original selected, accessories hidden and wheels posed must be byte-identical to the complete parked export. Source and reloaded GLB both contain 132,554 triangles; assembly bounds are recorded there. Browser errors: zero.

The bundled HTML includes its JavaScript and is tested over local HTTP. Direct-file navigation is untested because the managed browser blocks it. Mobile layout, in-game frame rate, dirt/damage deformation and game integration remain untested.

TypeScript checking, production build, formatting and a clean dependency install/build in a separate copy pass. `baseline-check.ts` confirms every baseline position, normal, colour, UV, material slot and dirt tag exactly matches the untouched game. Accessory IDs are only review metadata.

The proposed body has 101,183 triangles versus 33,556 in the original, about three times as many. The wheel has 5,808 triangles. This is a review model; geometry reduction and a game performance target have not been validated.

`provenance.json` records clean source checkouts, source revisions, preservation of all prior studies and model/viewer hashes. The ZIP includes source, locked dependencies, GLB, viewer, renders, reports and SHA-256 checksums. Its CRC and every archived checksum are checked after packaging.
