# Trailer capture on the Mac

1. Clone https://github.com/reidstephen11/over-the-cape (branch main) next to this folder, `npm ci`.
2. Expose the game object for the recorder (local only, never commit):
   in `src/core/testHook.ts`, inside `installHook`, add before `window.__game = {`:
   `(window as unknown as { __g: Game }).__g = g;`
3. `npx vite build` then `npx vite preview --port 4173` (leave running).
4. In this folder: `npm init -y && npm i playwright@1.56.1 && npx playwright install chromium`.
5. `node run3.cjs dry` (fast; writes dry-results.txt), then `node run3.cjs rec` (writes clips/ and rec-results.txt).
   The first line printed says which GPU the browser uses; it should be the Apple GPU, not SwiftShader.

## Editing

With Python 3 + numpy + Pillow and ffmpeg: copy `edit3.py`, `synth.py` and `make_trailer.py` next to the
`clips/` folder and run `python3 make_trailer.py`. It writes `over-the-cape-trailer.mp4`, a 960x540
`-phone.mp4` and `check_*.jpg` contact sheets (4 frames a second) to review the cut.

These files are a scratch branch for the trailer only; they are not part of the game.
