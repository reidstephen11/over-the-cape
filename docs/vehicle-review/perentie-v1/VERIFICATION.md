# Bush Tucker Man Perentie verification record

Status: isolated appearance proposal for the owner's review. No game files were edited, merged or published. The completed Hilux, GQ Patrol and LC79 studies retain their original manifest checksums.

## Target and references

The owner identified this vehicle as the Bush Tucker Man's Land Rover. The game's 48-001 plate identifies the first-series green General Service Perentie as the intended target. [REMLR's Bush Tucker Man vehicle record](https://remlr.com/btm-vehicles.html) distinguishes that vehicle from the second-series NT-registered 254 and the later white hardtop. It also records the first-series No.5 trailer; this study covers the towing vehicle only.

The [Army registration record](https://www.remlr.com/ARN/ARNs_perentie_37-48.php) identifies 48-001 as the first Initial Production Vehicle, a GS with winch, used in the films. The study keeps that identity and registration.

The [Australian Army's Project Perentie brochure, EDE 2/90](https://www.remlr.com/photos/IPV/EDE2_90.pdf) provides the general GS context. [REMLR's GS description](https://remlr.com/perentie-gs.html) describes two front occupants and the rear troop/cargo area. [Allisons' Perentie description](https://www.allisons.org/ll/4/LandRover/Perentie/) describes the extended galvanised chassis, underslung spare, rear cans and bonnet tool brackets. These establish the configuration rather than every filming-day accessory position.

The work uses accessible reference information, as authorised. The environment does not provide usable direct reference-photo downloads; pixel-by-pixel photographic matching was not completed. The precise brushguard bends, grille spacing, canvas rolls, tool arrangement and filming-day load remain approximations for approval. The wooden boards, cans, swag and box retain the game's touring character.

## Visual inspection and corrections

Twenty-four final views cover the four quarters, both sides, straight front/rear, top, underbody, both brushguard joins, uncovered grille/bonnet, support bows with canvas hidden, roof cargo, rear lamps/load opening, cabin, both front steering locks, rear compression, canvas side rolls and bonnet tools. Original/proposal comparison images share lighting and camera positions.

The new roof has rounded shoulders and slight sag between bows. Side and rear curtains are rolled and strapped up; the tub remains open. A short valance contacts the windscreen rail. Recovery boards sit on external supports and have closed straps around aligned crossbars.

The extra bonnet spare is removed, leaving the rear underslung spare. Shovel, pick and axe sit on bonnet brackets. The extra centre front seat is removed; the two front seats and rear benches have supporting structure. The grille, round lamps and continuous brushguard have more defined geometry.

The first renders exposed wheelhouse roof edges coplanar with the outer skins. Those roofs were recessed to remove the visible dark slivers. The underfloor spare check found the tyre intersecting the rear rails and lower tailgate. The rear rails now spread around the spare, the cradle sits slightly forward, and transverse cradle supports contact the frame.

## Geometry and clearance

`geometry-audit.json` checks every proposed body/wheel attribute for finite values, nonzero normals, collapsed triangles and contrary face/normal directions. All failure counts are zero. Cleanup removes 240 collapsed body faces and 384 collapsed wheel faces while retaining colours, material slots, dirt tags and remaining smooth normals. This is not a watertight-manifold certification for the multipart model.

`mesh-clearance-full.json` tests actual tyre/body triangle surfaces using two bounding-volume hierarchies. It covers 2,048 wheel states: both front wheels at one-degree steering steps through ±31°, and all four wheels at 10 mm compression steps through 150 mm. No surface intersections were found.

`all-solid-clearance.json` separately tests 3,034 unique wheel vertices against nearby oriented/rounded solid boxes captured from the builder. No penetration exceeds the 0.5 mm threshold. This complements the surface check by detecting sampled vertices contained within solid boxes.

`spare-clearance.json` tests the underslung spare's triangle surfaces against the remaining fixed body. Its intended cradle/support geometry is excluded from this free-space check. No intersections remain with the chassis, floor or tailgate.

These are sampled visual-geometry checks, not a continuous-motion proof or a gameplay collision test. Tyre spin, extreme droop and every terrain articulation are not exhaustively checked. The preview moves the wheels, axles and dampers; it does not constitute a fully articulated mechanical rig. Frame changes are visual geometry; game tuning and physical collision boxes remain unchanged.

## Viewer, export and build

`validation-v1.json` records original/proposal switching, accessory hiding, exact restoration, all six camera presets, steering/compression sliders, reset, export and GLB reload. Hiding the brushguard preserves the headlamps. Bonnet gear and canvas can be hidden independently. Browser errors: zero.

An export made with Original selected, all review accessories hidden and wheels at full steering/compression is byte-identical to the complete parked GLB. Export preserves the live pose. Source and reimported GLB both contain 117,039 triangles; assembly dimensions are recorded in the report.

The bundled HTML includes its JavaScript and is tested over local HTTP. Direct-file navigation is untested because the managed browser blocks it. The controls are exercised in desktop Chromium; mobile layout and frame rate are untested.

TypeScript checking, production build, formatting checks and a clean dependency install/build in a separate copy pass. `baseline-check.ts` compares every baseline position, normal, colour, UV, material slot and dirt tag with the untouched game. All match. Additional baseline accessory IDs are used only by the review controls.

The proposed body has 87,004 triangles versus 47,064 in the original, about 85% more. This is a review model; no in-game performance target has been validated. Game lighting, damage/dirt deformation and integration remain untested.

`provenance.json` records source revisions, clean checkout status, model/viewer hashes and preservation of the prior studies. The ZIP contains source, locked dependencies, GLB, viewer, inspection images, reports and SHA-256 checksums. The archive CRC and every archived checksum are verified after packaging.
