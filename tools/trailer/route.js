window.__route = function (hotId, backM, fwdM) {
  const G = window.__g, g = window.__game;
  const tracks = G.world.features.tracks;
  const hot = typeof hotId === 'string' ? g.pois().find((q) => q.id === hotId) : hotId;
  let best = null;
  for (const t of tracks) for (let k = 0; k < t.poly.count; k++) {
    const d = Math.hypot(t.poly.xs[k] - hot.x, t.poly.zs[k] - hot.z);
    if (!best || d < best.d) best = { t, k, d };
  }
  const P = (t, k) => [t.poly.xs[k], t.poly.zs[k]];
  function walk(t, k, dir, len, exclude) {
    const pts = []; let acc = 0; let prev = P(t, k); const used = new Set([t]);
    for (let guard = 0; guard < 20000 && acc < len; guard++) {
      const nk = k + dir;
      if (nk < 0 || nk >= t.poly.count) {
        // hop onto another track near here that keeps heading the same way
        const hd = pts.length > 3 ? [prev[0] - pts[pts.length - 4][0], prev[1] - pts[pts.length - 4][1]] : null;
        let hop = null;
        for (const u of tracks) { if (used.has(u)) continue;
          for (let j = 0; j < u.poly.count; j++) {
            const d = Math.hypot(u.poly.xs[j] - prev[0], u.poly.zs[j] - prev[1]);
            if (d > 8) continue;
            for (const nd of [1, -1]) {
              const j2 = j + nd * 5; if (j2 < 0 || j2 >= u.poly.count) continue;
              const v = [u.poly.xs[j2] - u.poly.xs[j], u.poly.zs[j2] - u.poly.zs[j]];
              const dot = hd ? (v[0] * hd[0] + v[1] * hd[1]) / (Math.hypot(...v) * Math.hypot(...hd) + 1e-6) : 1;
              const score = d - dot * 4;
              if (dot > 0.3 && (!hop || score < hop.score)) hop = { u, j, nd, score };
            }
          }
        }
        if (!hop) break;
        t = hop.u; k = hop.j; dir = hop.nd; used.add(t); continue;
      }
      k = nk; const p = P(t, k);
      acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; pts.push(p);
    }
    return pts;
  }
  // forward = the direction that heads south (lower z), as the CREB runs.
  const t = best.t, k = best.k;
  const kz = Math.min(t.poly.count - 1, k + 10), kz2 = Math.max(0, k - 10);
  const fdir = t.poly.zs[kz] - t.poly.zs[kz2] < 0 ? 1 : -1;
  const back = walk(t, k, -fdir, backM).reverse();
  const fwd = walk(t, k, fdir, fwdM);
  return [...back, P(t, k), ...fwd];
};
window.__drive = function (path, speed, low, look) {
  const G = window.__g, g = window.__game;
  const a = path[0], b = path[Math.min(4, path.length - 1)];
  const h = ((Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI + 360) % 360;
  g.autopilot(null);
  g.teleport(a[0], a[1], h);
  const Ctor = window.__AP;
  G.autopilot = new Ctor(path, speed);
  if (low) { G.autopilot.lowRange = true; G.autopilot.holdLowOnClimbs = true; }
  if (look) G.autopilot.lookAhead = look;
};
