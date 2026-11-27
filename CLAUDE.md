# Working on this repo

The game is three episodes: the CREB Track (Episodes 2–4 of the old story were removed in v0.73); since v1.96, the Telegraph Track, built in stages from `docs/PLAN-telegraph.md`; and since v2.17, the Telegraph Track North, built in stages from `docs/PLAN-telegraph-north.md` (keep both plans current). Follow-up work is recorded in `docs/ROADMAP.md`. The owner never wants steering-wheel or pedal support, or manual shift buttons on phones. Do not implement or propose either feature, or add them back to the roadmap; the shelved manual-clutch option is not planned to return.

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

## Agent skills

Matt Pocock's skills (https://github.com/mattpocock/skills) are in `.claude/skills`, copied unchanged; `/ask-matt` says which one fits a situation. The usual path for an idea is `/grill-with-docs`, then `/to-spec`, `/to-tickets`, `/implement` for each ticket, and `/retro`.

### Issue tracker

Specs and tickets are GitHub issues on `reidstephen11/over-the-cape`; `docs/ROADMAP.md` stays the list of ideas not yet started. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the repo root, written as terms are settled, and decisions in `docs/DECISIONS.md`. See `docs/agents/domain.md`.

### Where this repo's rules come first

- **Grilling:** the owner wants one question at a time, each with a recommended answer that "yes" accepts. Do not ask a whole round at once.
- **Shipping:** a ticket that changes the game is one update and ships by "Shipping every update" above (publish first, tests in the background). `/implement`'s full test run and `/code-review` do not hold up the merge: run the review on the diff before the pull request when it is quick, and otherwise act on it in a follow-up update.
- **Vehicles:** "Modelling a vehicle" above applies to any ticket that touches a body.
- **Docs-only changes** (specs, glossary, these settings) need no version number.
