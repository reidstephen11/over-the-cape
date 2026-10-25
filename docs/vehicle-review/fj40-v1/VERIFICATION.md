# Verification — FJ40 review 01

The proposal is an isolated review copy. Both game checkouts remain clean at their original commits; no game integration or approval is implied.

- TypeScript check and production build pass. A separate copy installs from the lockfile and produces a byte-identical JavaScript bundle and HTML entry point; see `build-verification.json`.
- The comparison baseline's positions, normals, colours, UVs, material IDs and damage-zone tags exactly match the source game's body. Only a non-rendering review-selection attribute was added in this review copy; `npm run baseline` verifies equality.
- Final body: 71,278 triangles, versus 56,388 in the original. Each new wheel: 4,828 triangles. Full exported assembly: 95,613 triangles. The proposal is higher detail; in-game performance remains to be evaluated after approval.
- Mesh audit checks every attribute for finite values, normal lengths, collapsed triangles and contrary face normals. The final body and wheel have zero failures. Collapsed faces from procedural primitive seams were removed while preserving vertex normals and material/zone IDs.
- Wheel clearance covers 1,960 sampled wheel poses: both front wheels at each whole degree from −34° to +34°, every 10 mm from parked to 130 mm compression; both rear wheels at the same 14 compression levels. Triangle BVH checks and solid-volume checks both report zero intersections. The latter checks 2,608 unique wheel vertices against 383 rounded/rotated solid blocks, with a 0.5 mm penetration tolerance. These are sampled geometric checks, not continuous collision certification.
- Both spare wheels are checked against all other body surfaces, excluding only each spare's own mounting hardware. Rear-door and bonnet spares have zero triangle intersections with the remaining model.
- 24 rendered views cover front, rear, both sides, roof, underside, front bar joins, grille with bar hidden, uncovered bonnet/roof, rack feet and cargo, rear lamps and doors, cabin, full-lock front wheels and full-bump rear wheel.
- Browser checks exercise actual selector, six camera, hide/restore, stance and export controls; the bar can be hidden without removing headlamps, and accessory restoration returns exact index arrays. Steering and compression update both wheels and visible suspension.
- Export is reloaded with GLTFLoader, checked for finite coordinates and matching triangle counts. Export from an original-selected, fully posed, accessories-hidden review is byte-identical to export from the complete parked view. The live inspection pose remains intact after export.
- No browser JavaScript errors. Standalone viewer passes over local HTTP with bundled local code. Direct file navigation is blocked by this environment's browser policy and was not certified here.
- Packaging validates every manifest entry from the Hilux, Patrol, LC79, Perentie, Unimog and Troopy studies, and verifies both game repositories are clean. ZIP CRC and all archived file SHA-256 checksums are verified.

Inspect `geometry-audit.json`, `all-solid-clearance.json`, `mesh-clearance-full.json`, `spare-clearance.json`, `validation-v1.json`, `build-verification.json` and `provenance.json` for machine-readable results. Reference assumptions and remaining visual/gameplay limits are documented in README.md. The final model remains subject to the user's visual approval.
