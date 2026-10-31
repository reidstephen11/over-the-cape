// node run3.cjs dry  [shot names...]   test-drive shots without drawing, print speeds
// node run3.cjs rec  [shot names...]   record shots to clips/<name>/ and encode clips/<name>.mp4
const fs = require('fs');
const { execSync } = require('child_process');
const L = require('./lib3.cjs');
const rec = require('./rec3.cjs');
const SHOTS = require('./shots3.cjs');
(async () => {
  const [mode, ...names0] = process.argv.slice(2);
  const names = names0.length ? names0 : Object.keys(SHOTS).filter((n) => !/^(test|tyre_v1|aerial$|splash$|bobs|bridge|finale)/.test(n));
  const { b, p } = await L.launch({ quality: process.env.QUALITY || 'high', headless: process.env.HEADED ? false : true });
  await L.start(p);
  const out = [];
  for (const n of names) {
    const s = { name: n, ...SHOTS[n] };
    const t = Date.now();
    try {
      if (mode === 'dry') {
        const dry = require('./dry3.cjs');
        const r = await dry(p, { ...s, pre: 0 }, s.secs + 4);
        out.push(`${n}: ${typeof r === 'string' ? r : JSON.stringify(r)}`);
      } else {
        const r = await rec(p, s);
        let enc = '';
        try {
          execSync(`ffmpeg -loglevel error -y -framerate 30 -i clips/${n}/%05d.jpg -c:v libx264 -crf 14 -pix_fmt yuv420p clips/${n}.mp4`);
          enc = ' -> mp4';
        } catch { enc = ' (no ffmpeg, frames kept)'; }
        out.push(`${r} ${Math.round((Date.now() - t) / 1000)}s${enc}`);
      }
    } catch (e) { out.push(`${n}: ERROR ${e.message}`); }
    console.log(out.at(-1));
    fs.writeFileSync(`${mode}-results.txt`, out.join('\n') + '\n');
  }
  await b.close();
})();
