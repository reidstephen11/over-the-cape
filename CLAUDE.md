# Working on this repo

## Shipping every update

The owner wants every finished update merged into `main` and published, without being asked each time. GitHub Actions deploys `main` to GitHub Pages.

For each update:

1. Add 0.01 to `GAME_VERSION` in `src/core/buildInfo.ts`, one step past the version on `main`.
2. Add a section for that version to `docs/DECISIONS.md` and update `README.md` (features, controls and the "What to test" checklist).
3. Run `npm run lint`, `npm test` and `npm run build`; all must pass. When the change touches the page or the HUD, also start `npm run test:e2e` in the background as soon as the code is final, but don't wait for it: the browser tests take about 45 minutes here.
4. Open a pull request into `main`, wait for its GitHub checks to pass, then merge it. If the browser tests are still running, merge anyway; if they then find a problem, fix it in a follow-up update.
5. Tell the owner the new version is live at https://reidstephen11.github.io/over-the-cape/ once the deploy run has finished.
