const fs = require('fs');
// s: { hot, back, fwd, speed, veh, low, wx, pre }
module.exports = async function dry(p, s, secs) {
  await p.evaluate(fs.readFileSync(__dirname + '/route.js', 'utf8'));
  await p.evaluate((s) => {
    const g = window.__game, G = window.__g;
    if (!window.__AP) { g.autopilot('daintree-village', 20, 5); window.__AP = G.autopilot.constructor; }
    g.useChaseCamera();
    document.querySelector(`.dev-panel button[data-preset="${s.wx ?? 0}"]`)?.click();
    if (g.vehicleId() !== s.veh) g.setVehicle(s.veh);
  }, s);
  await p.evaluate(() => window.__step(33, false));
  return p.evaluate(([s, secs]) => {
    const g = window.__game, G = window.__g;
    if (g.vehicle().engineOff) g.startEngine();
    const path = window.__route(s.hot, s.back ?? 60, s.fwd ?? 300);
    window.__drive(path, s.speed, s.low);
    const hot = g.pois().find((q) => q.id === s.hot);
    const v0 = [], d0 = [];
    const steps = Math.round((secs + (s.pre ?? 0)) * 60);
    for (let i = 0; i < steps; i++) {
      G.step(1 / 60);
      if (i % 15 === 14) { const v = g.vehicle(); v0.push(+v.speed.toFixed(1)); d0.push(Math.round(Math.hypot(v.x - hot.x, v.z - hot.z))); }
    }
    const n = Math.round((s.pre ?? 0) * 4);
    const v = v0.slice(n), d = d0.slice(n);
    return `minV ${Math.min(...v)} d ${d[0]}→${Math.min(...d)}→${d.at(-1)} len ${path.length} | v ${v.join(' ')}`;
  }, [s, secs]);
};
