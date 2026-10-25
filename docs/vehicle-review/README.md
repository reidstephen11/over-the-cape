# Vehicle model proposals for review

These are the nine separate vehicle proposals previously kept outside the repository. They are now available to Claude and other reviewers as editable source, standalone viewers, GLB exports, inspection images and recorded checks. The game does not load these proposals.

| Vehicle | Model source | Standalone viewer | GLB | Inspection image |
| --- | --- | --- | --- | --- |
| Hilux, revision 3 | [hiluxProposal.ts](hilux-v3/src/render/hiluxProposal.ts) | [Hilux-review.html](hilux-v3/Hilux-review.html) | [Hilux](hilux-v3/hilux-proposal-v3.glb) | [Comparison](hilux-v3/Hilux-comparison.png) |
| GQ Patrol | [patrolProposal.ts](patrol-v1/src/render/patrolProposal.ts) | [Patrol-review.html](patrol-v1/Patrol-review.html) | [Patrol](patrol-v1/patrol-proposal-v1.glb) | [Comparison](patrol-v1/Patrol-comparison.png) |
| LC79 | [lc79Proposal.ts](lc79-v1/src/render/lc79Proposal.ts) | [LC79-review.html](lc79-v1/LC79-review.html) | [LC79](lc79-v1/lc79-proposal-v1.glb) | [Comparison](lc79-v1/LC79-comparison.png) |
| Bush Tucker Man Perentie, rolled canvas | [perentieProposal.ts](perentie-v1/src/render/perentieProposal.ts) | [Perentie-review.html](perentie-v1/Perentie-review.html) | [Perentie](perentie-v1/perentie-proposal-v1.glb) | [Comparison](perentie-v1/Perentie-comparison.png) |
| Unimog UL1700L | [unimogProposal.ts](unimog-v1/src/render/unimogProposal.ts) | [Unimog-review.html](unimog-v1/Unimog-review.html) | [Unimog](unimog-v1/unimog-proposal-v1.glb) | [Comparison](unimog-v1/Unimog-comparison.png) |
| HZJ75 Troopy | [troopyProposal.ts](troopy-v1/src/render/troopyProposal.ts) | [Troopy-review.html](troopy-v1/Troopy-review.html) | [Troopy](troopy-v1/troopy-proposal-v1.glb) | [Comparison](troopy-v1/Troopy-comparison.png) |
| FJ40 | [fj40Proposal.ts](fj40-v1/src/render/fj40Proposal.ts) | [FJ40-review.html](fj40-v1/FJ40-review.html) | [FJ40](fj40-v1/fj40-proposal-v1.glb) | [Comparison](fj40-v1/FJ40-comparison.png) |
| 1986 Camel Trophy Ninety | [camelProposal.ts](camel-v1/src/render/camelProposal.ts) | [Camel-review.html](camel-v1/Camel-review.html) | [Ninety](camel-v1/camel-proposal-v1.glb) | [Comparison](camel-v1/Camel-comparison.png) |
| Sooty MkII-inspired 80 Series, revision 1 | [sooty80Proposal.ts](sooty80-v1/src/render/sooty80Proposal.ts) | [Sooty80-review.html](sooty80-v1/Sooty80-review.html) | [80 Series](sooty80-v1/sooty80-proposal-v1.glb) | [Comparison](sooty80-v1/Sooty80-comparison.png) |

## Review guidance

Start with each folder's `README.md` and `VERIFICATION.md`. The proposal module builds the revised procedural body; the folder's other source modules provide wheels, materials, tuning, suspension and its comparison baseline. Each `inspection/` directory contains the rendered views, and each `Inspection-gallery.html` embeds its images for offline viewing.

The recorded geometry and clearance checks describe sampled mesh behaviour. They do not prove photographic accuracy or game integration. Real-car photo downloads were blocked during modelling; body shapes and equipment include interpretations based on written references and general vehicle knowledge. In particular, Sooty revision 1 has **not** been visually matched to actual Sooty MkII photographs, and its comparison shows the body study against the equipped model, not a real car.

[Sooty revision 2](sooty80-v2/) is an unfinished working copy. Its geometry is unchanged from revision 1, it has no revised GLB or finished viewer, and it still awaits actual photo inspection. Its original status files are preserved as received.

## Open and rebuild

GitHub displays the HTML source. After cloning and checking out this review branch, serve this directory to open the bundled viewers:

```sh
cd docs/vehicle-review
python3 -m http.server 8000
# Open http://localhost:8000/sooty80-v1/Sooty80-review.html
```

Each proposal is a separate Node project. For example:

```sh
cd docs/vehicle-review/sooty80-v1
npm ci
npm run build
```

See the individual README files for audit and browser commands. Some original baseline and packaging scripts refer to the former `/workspace/vehicle-review` folders and browser ports; configure their documented environment overrides or adapt those paths before rerunning them in another checkout. The original package metadata and reports describe the earlier environment, not a new run during publication.

## Transfer integrity

All copied files retain their original bytes. Every entry in all nine original `SHA256SUMS.txt` manifests was checked against the repository copy. Dependencies, build output, temporary previews, duplicate posed-export GLBs and ZIP archives are omitted; none is needed by the original checksum manifests. The complete parked GLB exports, editable source, lockfiles, standalone viewers, inspection images and verification reports are included.

To verify a proposal after cloning:

```sh
cd docs/vehicle-review/sooty80-v1
sha256sum -c SHA256SUMS.txt
```
