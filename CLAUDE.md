# Working on this repo

The game is the CREB Track alone (Episodes 2–4 removed in v0.73). Follow-up work is recorded in `docs/ROADMAP.md`. The owner never wants steering-wheel or pedal support. Do not implement it, propose it, or add it back to the roadmap; the shelved manual-clutch option is not planned to return.

## Modelling a vehicle

Read `reference/vehicles/README.md` before changing a body, then that vehicle's `SOURCES.md`. Open the photographs and compare the model with them before the change and again after it, using the studio page. Match the silhouette to the published dimensions at 1 unit = 1 metre. Do not reshape a body from memory. The photographs are reference only: the game still draws every vehicle in code, and these files are not textures.

**Look at every part you add or move.** After any build or change to a vehicle, render the standard studio set (`scripts/studio-shots.ts`) and close-ups of every part added or moved (spares, racks, bars, snorkel, tray, carriers), from behind, from the side and from low down (the camera recipes are in `reference/vehicles/README.md`, "After changing it, compare again"). Read every render. In the version's notes, write for each such part where it is attached and which way it faces. Place every spare wheel with `mountSpare()` in `src/render/spares.ts`, never by turning the wheel geometry by hand; `tests/spares.test.ts` then checks each spare's axle, that nothing of the body is inside it or within 3 mm of its inner face, and that it is well off the ground. Do not loosen that test to pass: move the part.

**When the owner reports a defect,** render that exact part close up and look at it before replying.

**A second look, required for vehicle work.** Before shipping a vehicle change, render the full studio set for every vehicle touched plus the close-ups, then spawn a reviewer subagent (the Agent tool, `subagent_type: "general-purpose"`) and give it only the render file paths: not the code, not what you changed, not your conclusions. Brief it with these words: "These are renders of vehicles in a game, drawn in code, 1 unit = 1 metre. Open every image. List everything that looks wrong or physically impossible: parts floating with nothing holding them, parts passing through panels or through each other, wheels or spares facing the wrong way or edge-on, gaps where panels should meet, parts touching or below the ground, anything that would fall off or could not be fitted on a real vehicle. For each, give the image file and where in it. Do not guess at causes; describe what you see. Say “nothing found” only if you looked at every image." Act on real findings (render again and look), and record in the version's notes what the reviewer found and what you did about it. If the reviewer cannot be spawned (a subagent cannot start another), say so in the notes and in your report, and hand the render paths back so the session that can spawn one does.

## Shipping every update

The owner wants every finished update merged into `main` and published, without being asked each time. GitHub Actions deploys `main` to GitHub Pages.

For each update:

1. Add 0.01 to `GAME_VERSION` in `src/core/buildInfo.ts`, one step past the version on `main`.
2. Add a section for that version at the end of `docs/DECISIONS.md` (pre-v1.00 history is in `docs/decisions/v0.md`) and update `README.md` (features, controls and the "What to test" checklist, which keeps the last ten versions; move older entries to the top of `docs/TESTED.md`).
3. Publish first, fix later: the owner is the only player and wants to test each update as soon as it is ready. Run `npm run lint` and `npm run build` (both must pass, because the deploy needs the build), then go straight to step 4. Start `npm test`, and `npm run test:e2e` when the change touches the page or the HUD, in the background, and don't wait for them.
4. Open a pull request into `main` and merge it straight away, without waiting for its GitHub checks or the tests. Check the tests once they finish; if they find a problem, fix it in a follow-up update.
5. Tell the owner the new version is live at https://reidstephen11.github.io/over-the-cape/ once the deploy run has finished.
