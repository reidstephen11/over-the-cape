import * as THREE from 'three';
import { GroundTint, NO_TRACK_EDGE, TrackPaintKind, trackTint, type Terrain } from '../sim/world/terrain';
import { DETAIL_SUB, patchStride, patchTriangles, type DetailPatch } from '../sim/world/detail';
import { smoothstep } from '../sim/world/noise';
import { pal } from './colors';
import { createGroundMaterial } from './groundMaterial';

/** Quadtree levels: node size (m) and grid step (m). Level 0 matches the physics triangles. */
const LEVELS = [
  { size: 64, step: 1 },
  { size: 64, step: 2 },
  { size: 128, step: 4 },
  { size: 256, step: 8 },
] as const;
const ROOT = 3;
const TINT_SAMPLES = [
  [0, 0, 0.6],
  [-1, 0, 0.1],
  [1, 0, 0.1],
  [0, -1, 0.1],
  [0, 1, 0.1],
] as const;
/**
 * Where track paint ends (m out from the track's edge) and how wide the blend into the
 * ground beside it is; and the same for the darker edge band inside a graded track.
 */
const PAINT_EDGE = 0.8,
  FAINT_EDGE = 0.3,
  PAINT_BLEND = 0.45,
  EDGE_BAND = 0.4,
  CONCRETE_BAND = 0.3,
  BAND_BLEND = 0.2;
/** Edge distance (m) given to samples with no track paint beside a painted one. */
const OUTSIDE_PAINT = 2.5;
/**
 * Shading values per vertex: the ground's colour (r, g, b), rockiness and wetness; the
 * colour of a track there (r, g, b); and the distance (m) out from the track's edge, where
 * its paint ends, the width of its darker edge band (0: none) and the rut tone (below 0
 * darker, above 0 paler).
 */
const SHADE = 12;

/** The shading values as the ground material's attributes. */
function setShadeAttributes(geo: THREE.BufferGeometry, shade: Float32Array): void {
  const buffer = new THREE.InterleavedBuffer(shade, SHADE);
  geo.setAttribute('color', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  geo.setAttribute('ground', new THREE.InterleavedBufferAttribute(buffer, 2, 3));
  geo.setAttribute('trackColor', new THREE.InterleavedBufferAttribute(buffer, 3, 5));
  geo.setAttribute('trackEdge', new THREE.InterleavedBufferAttribute(buffer, 4, 8));
}
const isRock = (tint: number) =>
  tint === GroundTint.Rock || tint === GroundTint.Scree || tint === GroundTint.Gravel;
const isWet = (tint: number) =>
  tint === GroundTint.Mud ||
  tint === GroundTint.CreekBed ||
  tint === GroundTint.BlackSoil ||
  tint === GroundTint.Pothole;

/** Linear colour per ground tint. */
function tintColors(): THREE.Color[] {
  const out: THREE.Color[] = [];
  out[GroundTint.GrassDry] = pal('grassDry');
  out[GroundTint.GrassSage] = pal('grassSage');
  out[GroundTint.DirtTrack] = pal('dirtTrack');
  out[GroundTint.DirtEdge] = pal('dirtDark');
  out[GroundTint.Rock] = pal('rock');
  out[GroundTint.Scree] = pal('rockDark').clone().lerp(pal('rock'), 0.3);
  out[GroundTint.Mud] = pal('mud');
  out[GroundTint.Gravel] = pal('rock').clone().lerp(pal('dirtTrack'), 0.45);
  out[GroundTint.CreekBed] = pal('rockDark').clone().lerp(pal('mud'), 0.4);
  out[GroundTint.ForestFloor] = pal('grassSage').clone().lerp(pal('foliageDark'), 0.5);
  out[GroundTint.FaintTrack] = pal('grassDry').clone().lerp(pal('dirtTrack'), 0.55);
  out[GroundTint.Concrete] = pal('barkPale').clone().lerp(pal('rock'), 0.55);
  // Wet black soil under thin grass: dark and sodden.
  out[GroundTint.BlackSoil] = pal('grassSage').clone().lerp(new THREE.Color('#2A241C'), 0.72);
  out[GroundTint.Pothole] = pal('mud').clone().lerp(new THREE.Color('#1C130D'), 0.55);
  out[GroundTint.Sand] = pal('sand');
  return out;
}

interface Node {
  key: string;
  level: number;
  /** Sample index of the node's min corner. */
  ix: number;
  iz: number;
  cx: number;
  cz: number;
  minY: number;
  maxY: number;
  mesh: THREE.Mesh | null;
  lastUsed: number;
}

/**
 * Terrain mesh as a fixed-depth quadtree (SPEC §5): 256 m blocks far away, down to
 * 64 m chunks at 1 m resolution near the eye. Far levels are built up front; near
 * levels are built on demand (a few per frame) and cached. A node only splits once
 * all its children are built, so there are never holes. Skirts hide level cracks.
 */
export class TerrainMesh {
  readonly group = new THREE.Group();
  readonly material: THREE.MeshStandardMaterial;
  private readonly colors = tintColors();
  /** Rut floors darken towards this and hump crests pale towards this. */
  private readonly rutDark = pal('dirtDark').clone().lerp(pal('mud'), 0.35);
  private readonly crestPale = pal('dirtTrack').clone().lerp(pal('grassDry'), 0.25);
  private readonly nodes = new Map<string, Node>();
  private readonly roots: Node[] = [];
  private lodDistances: readonly number[] = [96, 230, 520];
  private frame = 0;
  private readonly visible = new Set<Node>();
  /** Max on-demand node builds per frame. */
  buildBudget = 3;
  private readonly cacheLimit = [48, 160];

  constructor(
    private readonly terrain: Terrain,
    _seed: number,
  ) {
    this.material = createGroundMaterial({
      paintBlend: PAINT_BLEND,
      bandBlend: BAND_BLEND,
      band: this.colors[GroundTint.DirtEdge],
      rut: this.rutDark,
      crest: this.crestPale,
    });
    this.group.name = 'terrain';
    const rootSize = LEVELS[ROOT].size;
    for (let z = 0; z < terrain.sizeZ / rootSize; z++)
      for (let x = 0; x < terrain.sizeX / rootSize; x++)
        this.roots.push(this.node(ROOT, x * rootSize, z * rootSize));
    // Pre-build the two coarse levels.
    for (const r of this.roots) {
      this.build(r);
      for (const c of this.children(r)) this.build(c);
    }
    for (const patch of terrain.detail) {
      const mesh = new THREE.Mesh(this.buildDetail(patch), this.material);
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.name = 'terrain-detail';
      this.group.add(mesh);
    }
  }

  /**
   * Fine ruts and humps over the cells they replace: the same tints and ground
   * shading, with rut floors darker and damper and hump crests worn paler.
   */
  private buildDetail(p: DetailPatch): THREE.BufferGeometry {
    const t = this.terrain;
    const w = patchStride(p),
      rows = p.nz * DETAIL_SUB + 1;
    const n = w * rows;
    const pos = new Float32Array(n * 3),
      nrm = new Float32Array(n * 3),
      shade = new Float32Array(n * SHADE);
    const h = (i: number, j: number) =>
      p.heights[Math.min(rows - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))];
    // Shading at each 1 m vertex of the patch, as the 1 m mesh has it.
    const cw = p.nx + 1;
    const corners = new Float32Array(cw * (p.nz + 1) * SHADE);
    for (let cz = 0; cz <= p.nz; cz++)
      for (let cx = 0; cx <= p.nx; cx++) {
        corners.set(this.sampleShade(p.ix0 + cx, p.iz0 + cz), (cz * cw + cx) * SHADE);
      }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        const x = p.ix0 + i / DETAIL_SUB,
          z = p.iz0 + j / DETAIL_SUB;
        pos.set([x - t.halfX, p.heights[k], z - t.halfZ], k * 3);
        const dx = (h(i - 1, j) - h(i + 1, j)) * DETAIL_SUB,
          dz = (h(i, j - 1) - h(i, j + 1)) * DETAIL_SUB;
        const length = Math.hypot(dx, 2, dz);
        nrm.set([dx / length, 2 / length, dz / length], k * 3);
        // Blend the 1 m vertex shading across the cell, as the 1 m mesh does.
        const cx = Math.min(p.nx - 1, Math.floor(i / DETAIL_SUB)),
          cz = Math.min(p.nz - 1, Math.floor(j / DETAIL_SUB));
        const tx = i / DETAIL_SUB - cx,
          tz = j / DETAIL_SUB - cz;
        for (const [corner, weight] of [
          [cz * cw + cx, (1 - tx) * (1 - tz)],
          [cz * cw + cx + 1, tx * (1 - tz)],
          [(cz + 1) * cw + cx, (1 - tx) * tz],
          [(cz + 1) * cw + cx + 1, tx * tz],
        ])
          for (let c = 0; c < SHADE; c++) shade[k * SHADE + c] += corners[corner * SHADE + c] * weight;
        // The shader darkens rut floors and pales hump crests after the edge blend.
        const o = p.offset[k];
        if (o < 0) {
          const k2 = Math.min(1, -o / 0.45);
          shade[k * SHADE + 4] = Math.max(shade[k * SHADE + 4], k2 * 0.6);
          shade[k * SHADE + SHADE - 1] = -k2;
        } else shade[k * SHADE + SHADE - 1] = Math.min(1, o / 0.6);
      }
    const indices: number[] = [];
    patchTriangles(p, (i, j) => indices.push(j * w + i));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    setShadeAttributes(geo, shade);
    geo.setIndex(indices);
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    return geo;
  }

  setLodDistances(d: readonly number[]): void {
    this.lodDistances = d;
  }

  private node(level: number, ix: number, iz: number): Node {
    const key = `${level}:${ix}:${iz}`;
    let n = this.nodes.get(key);
    if (n) return n;
    const size = LEVELS[level].size;
    const t = this.terrain;
    let minY = Infinity;
    let maxY = -Infinity;
    const st = Math.max(1, size / 16);
    for (let z = iz; z <= iz + size; z += st)
      for (let x = ix; x <= ix + size; x += st) {
        const h = t.sample(x, z);
        if (h < minY) minY = h;
        if (h > maxY) maxY = h;
      }
    n = {
      key,
      level,
      ix,
      iz,
      cx: ix + size / 2 - t.halfX,
      cz: iz + size / 2 - t.halfZ,
      minY,
      maxY,
      mesh: null,
      lastUsed: 0,
    };
    this.nodes.set(key, n);
    return n;
  }

  private children(n: Node): Node[] {
    if (n.level === 0) return [];
    const childLevel = n.level - 1;
    const cs = LEVELS[childLevel].size;
    const size = LEVELS[n.level].size;
    if (cs === size) return [this.node(childLevel, n.ix, n.iz)];
    return [
      this.node(childLevel, n.ix, n.iz),
      this.node(childLevel, n.ix + cs, n.iz),
      this.node(childLevel, n.ix, n.iz + cs),
      this.node(childLevel, n.ix + cs, n.iz + cs),
    ];
  }

  private distance(n: Node, eye: THREE.Vector3): number {
    const hs = LEVELS[n.level].size / 2;
    const dx = Math.max(0, Math.abs(eye.x - n.cx) - hs);
    const dz = Math.max(0, Math.abs(eye.z - n.cz) - hs);
    const dy = eye.y > n.maxY ? eye.y - n.maxY : eye.y < n.minY ? n.minY - eye.y : 0;
    return Math.sqrt(dx * dx + dz * dz + dy * dy);
  }

  private build(n: Node): void {
    const geo = this.buildGeometry(n.ix, n.iz, LEVELS[n.level].size, LEVELS[n.level].step);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.receiveShadow = true;
    // Terrain doesn't cast: at a low sun its long shadows get clipped at the edge of the
    // shadow area around the car. Smooth terrain normals show the relief.
    mesh.castShadow = false;
    mesh.matrixAutoUpdate = false;
    mesh.visible = false;
    mesh.name = `terrain-${n.key}`;
    this.group.add(mesh);
    n.mesh = mesh;
  }

  /** Update which nodes are drawn for an eye position. `all` builds everything needed now. */
  update(eye: THREE.Vector3, all = false): void {
    this.frame++;
    let budget = all ? Infinity : this.buildBudget;
    const want: Node[] = [];
    const requests: { n: Node; d: number }[] = [];
    const visit = (n: Node) => {
      // Mark every node on the way down as used, not only the drawn ones, so the parents
      // of the detailed chunks around the eye are never evicted (that made them thrash).
      n.lastUsed = this.frame;
      const d = this.distance(n, eye);
      if (n.level > 0 && d < this.lodDistances[n.level - 1]) {
        const kids = this.children(n);
        const missing = kids.filter((k) => !k.mesh);
        if (missing.length === 0) {
          for (const k of kids) visit(k);
          return;
        }
        for (const k of missing) requests.push({ n: k, d });
      }
      want.push(n);
    };
    for (const r of this.roots) visit(r);
    requests.sort((a, b) => a.d - b.d);
    for (const r of requests) {
      if (budget <= 0) break;
      if (!r.n.mesh) {
        this.build(r.n);
        budget--;
      }
    }
    if (all && requests.length > 0) {
      this.update(eye, true);
      return;
    }
    for (const n of this.visible) if (n.mesh) n.mesh.visible = false;
    this.visible.clear();
    for (const n of want) {
      if (!n.mesh) continue;
      n.mesh.visible = true;
      n.lastUsed = this.frame;
      this.visible.add(n);
    }
    this.evict();
  }

  private evict(): void {
    for (let level = 0; level <= 1; level++) {
      const built = [...this.nodes.values()].filter((n) => n.level === level && n.mesh);
      if (built.length <= this.cacheLimit[level]) continue;
      built.sort((a, b) => a.lastUsed - b.lastUsed);
      for (const n of built.slice(0, built.length - this.cacheLimit[level])) {
        if (this.visible.has(n) || n.lastUsed === this.frame || !n.mesh) continue;
        this.group.remove(n.mesh);
        n.mesh.geometry.dispose();
        n.mesh = null;
      }
    }
  }

  /** Number of drawn nodes per level (debug). */
  lodCounts(): number[] {
    const counts = [0, 0, 0, 0];
    for (const n of this.visible) counts[n.level]++;
    return counts;
  }

  private readonly shade = new Array<number>(SHADE).fill(0);

  /**
   * Shading at a 1 m sample: the colour of the ground beside any track, rockiness and
   * wetness, and near a track's edge the track's own colour with the distance to the edge.
   * The ground shader blends the two from that distance per pixel, so the edge follows the
   * real line of the track instead of the triangles. Elsewhere both colours are the same
   * narrow blend of the neighbouring tints, which softens the grid.
   */
  private sampleShade(ix: number, iz: number): number[] {
    const t = this.terrain;
    const out = this.shade;
    out.fill(0);
    const i = iz * t.resX + ix;
    const paint = t.trackPaint;
    const p = paint?.paint[i] ?? 0;
    if (paint && p) {
      const kind = p & 7,
        under = p >> 3;
      const e = paint.edge[i] / 10;
      const faint = kind === TrackPaintKind.Faint;
      const end = faint ? FAINT_EDGE : PAINT_EDGE;
      const band = faint ? 0 : kind === TrackPaintKind.Concrete ? CONCRETE_BAND : EDGE_BAND;
      const centre = trackTint(kind);
      // Rock and wetness don't need a sharp edge, so they are still blended per sample.
      const inner = band ? smoothstep(-band + BAND_BLEND, -band - BAND_BLEND, e) : 1;
      const cover = smoothstep(end + PAINT_BLEND, end - PAINT_BLEND, e);
      for (const [tint, weight] of [
        [under, 1 - cover],
        [GroundTint.DirtEdge, cover * (1 - inner)],
        [centre, cover * inner],
      ] as const)
        this.addTint(tint, weight);
      const u = this.colors[under] ?? this.colors[0];
      const c = this.colors[centre] ?? this.colors[0];
      out.splice(0, 3, u.r, u.g, u.b);
      out.splice(5, 6, c.r, c.g, c.b, e, end, band);
      return out;
    }
    for (const [ox, oz, weight] of TINT_SAMPLES) {
      const x = Math.max(0, Math.min(t.sizeX, ix + ox));
      const z = Math.max(0, Math.min(t.sizeZ, iz + oz));
      this.addTint(t.tint[z * t.resX + x], weight);
    }
    // No track colour of its own. Where something was painted over a track, keep the
    // distance to its edge so the blend from a painted neighbour stays true.
    const e = paint?.edge[i] ?? NO_TRACK_EDGE;
    out.splice(5, 6, out[0], out[1], out[2], e === NO_TRACK_EDGE ? OUTSIDE_PAINT : e / 10, PAINT_EDGE, 0);
    return out;
  }

  private addTint(tint: number, weight: number): void {
    const base = this.colors[tint] ?? this.colors[0];
    const out = this.shade;
    out[0] += base.r * weight;
    out[1] += base.g * weight;
    out[2] += base.b * weight;
    if (isRock(tint)) out[3] += weight;
    if (isWet(tint)) out[4] += weight;
  }

  buildGeometry(ix0: number, iz0: number, size: number, step: number): THREE.BufferGeometry {
    const t = this.terrain;
    const cells = size / step;
    const count = (cells * cells * 2 + cells * 16) * 3;
    const pos = new Float32Array(count * 3);
    const nrm = new Float32Array(count * 3);
    const shade = new Float32Array(count * SHADE);
    let v = 0;
    const vertex = (sx: number, sz: number, drop = 0) => {
      const ix = Math.max(0, Math.min(t.sizeX, sx));
      const iz = Math.max(0, Math.min(t.sizeZ, sz));
      pos.set([sx - t.halfX, t.solidSample(ix, iz) - drop, sz - t.halfZ], v * 3);
      // The same central-difference normal at every shared vertex, including LOD seams.
      const dx = t.sample(ix - 1, iz) - t.sample(ix + 1, iz);
      const dz = t.sample(ix, iz - 1) - t.sample(ix, iz + 1);
      const length = Math.hypot(dx, 2, dz);
      nrm.set([dx / length, 2 / length, dz / length], v * 3);
      shade.set(this.sampleShade(ix, iz), v * SHADE);
      v++;
    };
    for (let j = 0; j < cells; j++) {
      for (let i = 0; i < cells; i++) {
        const x = ix0 + i * step,
          z = iz0 + j * step;
        // Keep the exact Rapier diagonal and heights; only shading changes.
        vertex(x, z);
        vertex(x, z + step);
        vertex(x + step, z);
        vertex(x + step, z);
        vertex(x, z + step);
        vertex(x + step, z + step);
      }
    }
    const skirt = 1.5 * step + 1;
    const edge = (ax: number, az: number, bx: number, bz: number) => {
      vertex(ax, az);
      vertex(bx, bz, skirt);
      vertex(bx, bz);
      vertex(ax, az);
      vertex(ax, az, skirt);
      vertex(bx, bz, skirt);
      vertex(ax, az);
      vertex(bx, bz);
      vertex(bx, bz, skirt);
      vertex(ax, az);
      vertex(bx, bz, skirt);
      vertex(ax, az, skirt);
    };
    for (let i = 0; i < cells; i++) {
      const a = i * step;
      edge(ix0 + a, iz0, ix0 + a + step, iz0);
      edge(ix0 + a, iz0 + size, ix0 + a + step, iz0 + size);
      edge(ix0, iz0 + a, ix0, iz0 + a + step);
      edge(ix0 + size, iz0 + a, ix0 + size, iz0 + a + step);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    setShadeAttributes(geo, shade);
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    return geo;
  }

  dispose(): void {
    for (const n of this.nodes.values()) n.mesh?.geometry.dispose();
    for (const m of this.group.children)
      if (m instanceof THREE.Mesh && m.name === 'terrain-detail') m.geometry.dispose();
    this.material.dispose();
  }
}
