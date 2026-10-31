const fs = require('fs');
// Record one shot from the already-running page. s: { name, hot, veh, speed, back, start, secs, wx, hour, lights, cam, slow, low }
module.exports = async function rec(p, s, dirRoot = 'clips') {
  await p.evaluate(fs.readFileSync(__dirname + '/route.js', 'utf8'));
  await p.evaluate((s) => {
    window.__manual(true);
    const g = window.__game, G = window.__g;
    if (!window.__AP) { g.autopilot('daintree-village', 20, 5); window.__AP = G.autopilot.constructor; }
    window.__manual(true);
    G.loop.paused = false;
    g.useChaseCamera();
    document.querySelector(`.dev-panel button[data-preset="${s.wx ?? 0}"]`)?.click();
    if (g.vehicleId() !== s.veh) g.setVehicle(s.veh);
  }, s);
  await p.evaluate(() => window.__step(42, false));
  const info = await p.evaluate((s) => {
    const g = window.__game, G = window.__g;
    if (g.vehicle().engineOff) g.startEngine();
    document.querySelector('.history-card.reading')?.click();
    g.setHour(s.hour ?? 10);
    const path = window.__route(s.hot, s.back ?? 60, s.fwd ?? 200);
    window.__path = path;
    window.__drive(path, s.speed, s.low, s.look);
    g.setLights(s.lights ?? 'off');
    const hot = g.pois().find((q) => q.id === s.hot);
    // Pre-roll without drawing until the car is `start` m from the hot spot.
    let t = 0, d = 1e9;
    for (; t < 40 * 60; t++) {
      G.step(1 / 60);
      const v = g.vehicle();
      d = Math.hypot(v.x - hot.x, v.z - hot.z);
      if (t > 90 && d <= s.start) break;
    }
    g.setHour(s.hour ?? 10);
    G.chase.reset?.();
    g.cameraPreset(s.cam.preset ?? 'follow');
    G.view.snap?.();
    // Fixed camera: a point on the route `along` m from the hot spot, `side` m to the right, `h` up.
    if (s.cam.fixed) {
      let bi = 0, bd = 1e9;
      path.forEach((q, i) => { const dd = Math.hypot(q[0] - hot.x, q[1] - hot.z); if (dd < bd) { bd = dd; bi = i; } });
      let i = bi, acc = 0;
      const step = s.cam.fixed.along >= 0 ? 1 : -1;
      while (acc < Math.abs(s.cam.fixed.along) && i + step >= 0 && i + step < path.length) { acc += Math.hypot(path[i + step][0] - path[i][0], path[i + step][1] - path[i][1]); i += step; }
      const a = path[Math.max(0, i - 2)], b = path[Math.min(path.length - 1, i + 2)];
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
      const rx = -dz / L, rz = dx / L; // right of travel (x right when heading -z? sign checked by eye)
      const x = path[i][0] + rx * s.cam.fixed.side, z = path[i][1] + rz * s.cam.fixed.side;
      window.__fixedCam = [x, g.heightAt(x, z) + s.cam.fixed.h, z];
    } else window.__fixedCam = null;
    window.__camS = null;
    return { preroll: +(t / 60).toFixed(1), d: Math.round(d) };
  }, s);
  const dir = `${dirRoot}/${s.name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const FPS = 30;
  const total = Math.round(s.secs * FPS);
  const slow = s.slow ?? 1;
  const log = [];
  for (let i = -6; i < total; i++) {
    const steps = i < 0 ? 0 : Math.round(2 * slow);
    const res = await p.evaluate(([s, i, total, steps]) => {
      const g = window.__game, G = window.__g, v = g.vehicle();
      const cam = s.cam;
      const setCam = (pos, tgt) => {
        // Smooth after the first frame so a rig does not shake with every bump.
        const k = window.__camS && i > 0 ? (cam.smooth ?? 0.25) : 1;
        const S = window.__camS ?? [...pos, ...tgt];
        for (let j = 0; j < 3; j++) { S[j] += (pos[j] - S[j]) * k; S[3 + j] += (tgt[j] - S[3 + j]) * k; }
        window.__camS = S;
        g.setCamera(S[0], S[1], S[2], S[3], S[4], S[5]);
      };
      const h = (v.heading * Math.PI) / 180, fx = Math.sin(h), fz = -Math.cos(h), rx = -fz, rz = fx;
      if (window.__fixedCam) {
        const c = window.__fixedCam;
        setCam(c, [v.x, v.y + (cam.lookUp ?? 0.8), v.z]);
      } else if (cam.rig) {
        const f = Math.max(0, i) / total, e = f * f * (3 - 2 * f);
        const r = cam.rig, lerp = (a, b) => (Array.isArray(a) ? a[0] + (a[1] - a[0]) * e : a);
        const fw = lerp(r.fwd), sd = lerp(r.side), up = lerp(r.up), lf = lerp(r.lookFwd ?? 0);
        const x = v.x + fx * fw + rx * sd, z = v.z + fz * fw + rz * sd;
        const y = Math.max(v.y + up, g.heightAt(x, z) + 0.6);
        setCam([x, y, z], [v.x + fx * lf, v.y + (r.lookUp ?? 0.8), v.z + fz * lf]);
      }
      G.loop.paused = steps === 0;
      G.loop.fixedSteps = Math.max(1, steps);
      const url = window.__step(1000 / 30, i >= 0);
      const w = g.vehicle();
      return { url, sp: +w.speed.toFixed(2), thr: +w.throttle.toFixed(2), rpm: Math.round(G.vehicle.drivetrain.rpm), y: +w.y.toFixed(2), x: +w.x.toFixed(1), z: +w.z.toFixed(1) };
    }, [s, i, total, steps]);
    if (i >= 0) {
      fs.writeFileSync(`${dir}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(res.url.split(',')[1], 'base64'));
      delete res.url; log.push(res);
    }
  }
  await p.evaluate(() => { window.__g.loop.paused = false; });
  fs.writeFileSync(`${dir}.json`, JSON.stringify({ shot: s, info, slow, log }));
  const sp = log.map((l) => l.sp);
  return `${s.name}: preroll ${info.preroll}s d ${info.d} | speed min ${Math.min(...sp).toFixed(1)} max ${Math.max(...sp).toFixed(1)} end ${sp.at(-1).toFixed(1)}`;
};
