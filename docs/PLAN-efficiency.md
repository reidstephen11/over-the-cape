# Plan: improvements and efficiencies (from v1.43)

Written 4 Nov 2026 from a read of the code and two reviews (runtime performance; code health and workflow). Lint, build and the unit tests were run (all pass: lint about 53 s, build about 29 s, tests 602 s on a 4-core container). Nothing in the game was changed.

This plan is for an agent to action, one phase per update, following CLAUDE.md: bump `GAME_VERSION` by 0.01, add a `docs/DECISIONS.md` section, update `README.md`, lint and build, open a PR into `main` and merge it. Phases are ordered by payoff per effort. Each is independent unless noted.

**Measure before and after.** The game already has the tools: `?debug` shows fps, frame ms, draw calls, triangles, sim ms and render ms; `?bench` parks in the Bloomfield forest and times eight render modes; `window.__game.stats()` and `window.__game.breakdown()` (in `src/core/testHook.ts`) give per-scene-child GPU time and draw calls from the console. Record the numbers in the DECISIONS section for each phase.

## What was found

Headline numbers:

| Measure                           | Value                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Game chunk                        | 5.7 MB (2.05 MB gzipped), of which 4.1 MB is Rapier's WASM as base64                                          |
| Download starts                   | only after the player presses Drive (`src/main.ts:57`)                                                        |
| Repository pack                   | 314 MB, 313 MB of it reference photographs; CI checks it out twice per run                                    |
| `prettier --check .`              | 23 s, about 8 s of it on 18 small files under `reference/` and `research/`                                    |
| `tsc --noEmit` in `npm run build` | checks 1,196 files including tests, e2e and scripts                                                           |
| Unit tests                        | 745 tests in 602 s here (4 cores, 3 workers); `tests/creb.test.ts` alone takes 467 s, so it is the whole tail |
| `docs/DECISIONS.md`               | 474 KB, 2,316 lines, too big for an agent to read whole                                                       |
| README "What to test"             | 160 unchecked boxes back to v0.0x                                                                             |

Two things the roadmap gets wrong, corrected here so nobody deletes the wrong code:

- **Trailers are not test-mode only.** The Army supply run (v1.06, a Start option in `src/ui/welcome.ts:321`) hitches a trailer and unlocks the Perentie. Trailer code stays unless the owner drops the supply run.
- **`rescue`, `delivery` and `lastLeg` on `EpisodeDef` are dead.** The CREB episode sets none of them, and the "not without the stockman" nag in `src/core/game.ts:1648-1664` can never fire.

---

## Phase 1: free wins in the workflow (one update, about an hour)

No game change. Version bump still applies because CI and docs change.

1. **Prettier scope.** Add `reference/`, `research/` and `batocera/` to `.prettierignore`. Expect `npm run lint` to drop by about 8 s.
2. **Build type-check scope.** Add `tsconfig.app.json` that extends `tsconfig.json` and includes only `src` and `vite.config.ts`. Change `"build"` to `tsc --noEmit -p tsconfig.app.json && vite build`. Keep the full check by adding `"typecheck": "tsc --noEmit"` and running it in the CI `checks` job after lint. Add `"incremental": true, "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo"` to `tsconfig.json`.
3. **CI checkout.** In `.github/workflows/deploy.yml`, give both `actions/checkout@v5` steps `sparse-checkout` listing `src tests e2e scripts public docs index.html` plus the root config files, and `sparse-checkout-cone-mode: true`. The build never reads `reference/`. This saves pulling 300 MB twice per run.
4. **Playwright web server.** In `playwright.config.ts` change `webServer.command` to `npx vite build && npm run preview`, so an e2e run does not type-check 1,196 files first.
5. **Docs that contradict the code.** `docs/ROADMAP.md` item 1 and the Episode 4 paragraph: say the supply run uses the trailer. `README.md:432-433`: drop the `NEXT.md` line. `SPEC.md` §1 and §2: mark Episodes 2–4 removed in v0.73.

Acceptance: `npm run lint`, `npm run build`, `npm run typecheck` all pass; CI run time for the `build` job falls.

## Phase 2: faster unit tests (one update, 2–3 hours)

Measured: 602 s in all, and `creb.test.ts` runs for 467 s on one worker while the other two sit idle after about 170 s. Splitting that file and shortening its negative-result drives is worth more than anything else here.

1. **Give-up on stalled drives.** In `tests/helpers/drive.ts:267`, `runLeg` loops until `limit` and exits early only on `pilot.done`. Add an optional `giveUpAfter` (seconds below 0.2 m/s with no progress along the track; `WinchRecovery` in the same file already tracks stuck time). Pass it only where a test expects `done === false`: `tests/creb.test.ts:600-619` (24 drives × 150 s), `creb.test.ts:647-660`, `tests/crebStretches.test.ts:150-173`, `:175-185`, `:203-226`. Check each still fails for the right reason (the car stops, not the clock).
2. **One CREB world per file.** `creb.test.ts:380` builds a second full world; reuse the module-level one (`addPuddles` mutates, so clone or run it last). Add `crebWorld()` to `tests/world.ts` beside `testWorld()`.
3. **Split the long files.** `creb.test.ts` and `crebStretches.test.ts` into two or three files each so one file is not the tail with three workers.
4. **Shard in CI.** Matrix the `checks` job's test step over `vitest run --shard=${{ matrix.shard }}/3`, and move lint to its own job so it does not run before the tests.

Acceptance: `npm test` green; CI `checks` wall time measured before and after and recorded in DECISIONS.

## Phase 3: load faster (one update, 2–4 hours)

1. **Start the download on the title screen.** In `src/main.ts`, kick off `import('./core/game')` in `requestIdleCallback` (fallback `setTimeout`) as soon as the title is shown, keep the promise, and await it in `play()`. The 2 MB gzip then arrives while the player reads the briefing.
2. **Ship Rapier's WASM as a file.** Replace `@dimforge/rapier3d-compat` with `@dimforge/rapier3d` (same 0.21.0) plus `vite-plugin-wasm` and `vite-plugin-top-level-await`, and change `src/sim/physics.ts` and `loadRapier` accordingly. The `.wasm` is then 3 MB binary not 4.1 MB base64, streams and compiles while downloading, and is cached by the service worker on its own (add `wasm` to `globPatterns` in `vite.config.ts`; check `maximumFileSizeToCacheInBytes` still covers it). Verify in `dist/` that the game chunk shrinks by about 4 MB, and that the PWA still installs and updates (`e2e/pwa.spec.ts`).
3. **Precompile shaders.** Before `loading.set(1, 'Ready')` call `await view.renderer.compileAsync(view.scene, view.camera)`. Removes the first-frame stutter.
4. **Headlights without a rebuild.** `src/core/game.ts:1364-1369` disposes and rebuilds the whole `VehicleModel` when dusk turns the beams on. Add the two spotlights to the existing model and toggle them, and warm the programs with `compileAsync` once before dusk so every lit material does not recompile mid-drive.

Acceptance: time from pressing Drive to "Ready" on a throttled connection (DevTools Fast 3G) before and after; no first-frame hitch in `?debug`.

## Phase 4: steadier frame rate (one or two updates, 3–6 hours)

Measure each with `?bench` and `window.__game.breakdown()` on the owner's phone and desktop. Ship each only if the numbers improve.

1. **Cap rendering at the physics rate.** `src/core/loop.ts:50-73` renders on every `requestAnimationFrame`. On a 120 Hz phone that is two full renders per physics step. Skip the render when no step ran and under about 15 ms has passed since the last draw. `src/render/renderScale.ts:34-36` assumes 60 Hz frames, so it never lowers resolution on a 120 Hz screen; the cap fixes that too. Add a "Frame rate: 60 / screen" setting if the owner wants the option.
2. **Cull ground cover the fast way.** `src/render/vegetation.ts:629-636` leaves the cover BatchedMesh (10.8k instances on Medium, 23k on High) on three's per-instance culling, which `src/render/treeCulling.ts:20-24` already documents as about 3 ms a frame for trees. Build a sphere array in `fillTile` (`vegetation.ts:753-763`) and call the existing `cullTreesBySphere`.
3. **Split the props mesh.** `src/render/worldProps.ts:478-633` merges every marker post, ledge, washout wall, stone and bridge timber across the 6 km map into one mesh whose bounding sphere never leaves the frustum, so it is drawn whole in the colour pass and the shadow pass every frame. Build one mesh per 256 m cell, the grid `src/sim/sim.ts:206` already uses for physics.
4. **Meadow uploads.** `src/render/meadow.ts:61-106` re-uploads the whole 10,000-instance buffer and calls `computeBoundingSphere()` each time the camera crosses an 8 m cell. Use `instanceMatrix.addUpdateRange(0, count * 16)`, hoist the temporary Matrix4/Vector3/Quaternion, and set the bounding sphere from the cell centre.
5. **Course hint scan.** `src/core/hudState.ts:276-279` runs `trailProgress` over every route-hint track's 1 m polyline every frame, allocating per segment. Throttle to 5 Hz, early-out using `features.trackDistance`, and make `segmentDistance` write into a scratch object.
6. **Smaller allocation cleanups**, batched into the same update: `TerrainMesh.update` closures and the double `evict` filter (`src/render/terrainMesh.ts:323-381`); HUD text writes without a compare (`src/ui/hud.ts:408-441`); particle full-buffer uploads and per-kill closures (`src/render/particles.ts:115-180`); per-frame `Vector3` in `src/render/lighting.ts:63-67` and `src/render/chaseCamera.ts:216,227`.

Left for later, with measurement first: tree tiles copying all 42 tree geometries each (`vegetation.ts:487-516`); 9 footprint rays per wheel (`src/sim/vehicle/wheelContacts.ts`); building a traffic car's VehicleModel inside the physics step (`game.ts:1750-1755`); terrain generation in a Worker.

## Phase 5: dead code and docs that have outgrown themselves (one update, 2–3 hours)

1. **Remove `rescue`, `delivery` and `lastLeg`** from `EpisodeDef` (`src/data/episodes.ts:87-91`), the branches in `src/core/game.ts` (`:327-342`, `:500-505`, `:702`, `:1446-1451` next-episode logic, `:1648-1664` nag), `src/sim/episode.ts` (`:91`, `:108-110`, `:135-139`, `:157`, `:207`) and `checkpoint.rescued` in `src/sim/save/save.ts:195`. Keep the save parser tolerant of old fields. Keep `StuckVehicle`: the stranded drivers use it. `tests/delivery.test.ts` tests the delivery episode path: rewrite it against the supply run, which nothing currently tests.
2. **Split `docs/DECISIONS.md`.** Move everything before v1.00 to `docs/decisions/v0.md` with a one-line index at the top of `DECISIONS.md`. Add to CLAUDE.md that a new section goes in the current file.
3. **Trim the README checklist.** Keep the last ten versions under "What to test" and move the rest to `docs/TESTED.md`. Drop superseded items (v1.35's clutch option, shelved in v1.37) and no-ops (v1.41).
4. **Scripts.** Delete or document `scripts/tree-lab.ts` and `scripts/vehicle-shots.ts` (referenced nowhere).

## Phase 6: `game.ts` extractions (one update each, low risk first)

`src/core/game.ts` is 2,091 lines. Extract in this order, each a pure move with no behaviour change, run the full unit suite after each:

1. Sim-event to toast and sound wiring (constructor lines 471-584) to `src/core/simFeedback.ts`.
2. Oncoming traffic cars (1747-1777, 1588, 1684-1685, 1951, fields 217-219, `clearTraffic`) to a `TrafficCars` class.
3. Anchor picking (1526-1557, pointer listeners 603-614, throttle 1939-1944) to an `AnchorPicker` class.
4. Trailer and drum views plus the supply run (326-333, 1078-1142, 1639-1643) to a `DeliveryViews` class. This also isolates the removal if the owner ever drops the supply run.
5. The episode block of the HUD state (2043-2059) into `hudState.ts`.

## Phase 7: vehicle body duplication (one update, 2–4 hours, studio check required)

Create `src/render/bodyKit.ts` with one `GLYPHS` table and `strokeText`, `numberPlate` and `jerryCan`. Replace the four `GLYPHS` copies (`perentieBody.ts:130`, `lc79Body.ts:611`, `hiluxBody.ts:152`, `troopyBody.ts:411`), the three identical `plate()` functions (`hiluxBody.ts:188`, `lc79Body.ts:643`, `troopyBody.ts:441`), the two TOYOTA badge loops (`lc79Body.ts:448`, `troopyBody.ts:515`) and the near-identical jerry cans (`hiluxBody.ts:756`, `perentieBody.ts:639`). About 250–350 lines go. Per CLAUDE.md, compare each vehicle in the studio page against its photographs before and after; `npx vite-node scripts/tri-count.ts` must print the same triangle counts.

## Gameplay options (not scheduled; the owner picks)

From `docs/ROADMAP.md`, in rough order of effort:

- Live ghost gap on the driving HUD with a setting to hide it (small; the gap is already computed in `ghostGap`).
- Scored gate courses on the CREB using the existing `crawlCourse` and `gateCount` system.
- Transfer case (2H/4H/4L, hubs, driveline wind-up) as specified in the roadmap.
- Shift buttons on phones so the manual gearbox works with touch.
- Steering-wheel and pedal mapping, which also brings back "Manual with clutch".
- Fix or rewrite the eight long-standing e2e failures listed in the roadmap, starting with `devMode:4` (the car covers 2 m where the test wants 8 m, the same figure on v1.32).
