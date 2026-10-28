# Working on this repo

The game is the CREB Track alone (Episodes 2–4 removed in v0.73). Follow-up work is recorded in `docs/ROADMAP.md`.

## Modelling a vehicle

Read `reference/vehicles/README.md` before changing a body, then that vehicle's `SOURCES.md`. Open the photographs and compare the model with them before the change and again after it, using the studio page. Match the silhouette to the published dimensions at 1 unit = 1 metre. Do not reshape a body from memory. The photographs are reference only: the game still draws every vehicle in code, and these files are not textures.

## Shipping every update

The owner wants every finished update merged into `main` and published, without being asked each time. GitHub Actions deploys `main` to GitHub Pages.

For each update:

1. Add 0.01 to `GAME_VERSION` in `src/core/buildInfo.ts`, one step past the version on `main`.
2. Add a section for that version to `docs/DECISIONS.md` and update `README.md` (features, controls and the "What to test" checklist).
3. Publish first, fix later: the owner is the only player and wants to test each update as soon as it is ready. Run `npm run lint` and `npm run build` (both must pass, because the deploy needs the build), then go straight to step 4. Start `npm test`, and `npm run test:e2e` when the change touches the page or the HUD, in the background, and don't wait for them.
4. Open a pull request into `main` and merge it straight away, without waiting for its GitHub checks or the tests. Check the tests once they finish; if they find a problem, fix it in a follow-up update.
5. Tell the owner the new version is live at https://reidstephen11.github.io/over-the-cape/ once the deploy run has finished.
