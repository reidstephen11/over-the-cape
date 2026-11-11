"""FJ40 hardtop: step 1 (body shell) for Over the Cape.

Run:  blender --background --factory-startup --python fj40_body.py -- [--out DIR]
Builds the body from an empty scene, saves fj40_step1.blend and exports fj40_body.glb.
Frame (Blender, Z-up): +X right, +Y forward, origin at mid-wheelbase 0.12 m above the hubs,
ground at z = -0.50. glTF export converts to the game frame (Y-up, forward -Z).
All dimensions in metres. h(...) converts a height above ground into z.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = ARGS[ARGS.index('--out') + 1] if '--out' in ARGS else os.path.dirname(os.path.abspath(__file__))

GROUND = -0.50
def h(v): return GROUND + v

# ---------------------------------------------------------------- dimensions
WB = 2.285                  # wheelbase (Toyota)
FA, RA = WB / 2, -WB / 2    # axle stations (y)
HW_WING = 1.666 / 2         # over the guard lips (published width)
HW_TUB = 0.775              # slab sides of the tub
Y_GRILLE, Y_WING_FRONT, Y_TAIL = 1.67, 1.70, -1.89
Y_SCREEN = 0.33             # windscreen base / door front (A-pillar)
SILL, BELT, ROOF_EDGE, ROOF_TOP = 0.57, 1.35, 1.82, 1.95   # step 3: white cap deeper (photo)
WING_TOP = 0.99
ARCH_F = dict(y=FA, hc=0.38, r=0.48)   # step 4: lowered 7 cm (side-1977.jpg flare depth)
ARCH_R = dict(y=RA, hc=0.40, r=0.49, a=0.56, b=0.50, n=2.7)
DOOR_REAR = -0.45

# ---------------------------------------------------------------- helpers
def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, rough=0.4, metal=0.0, transmission=0.0, alpha=1.0, coat=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if transmission:
        b.inputs['Transmission Weight'].default_value = transmission
        b.inputs['IOR'].default_value = 1.5
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.05
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m

def make_obj(name, verts, faces, material=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([Vector(v) for v in verts], [], faces)
    me.validate(); me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if material: ob.data.materials.append(material)
    # make sure normals point outward
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    return ob

def loft(name, loops, material=None, cap_start=True, cap_end=True):
    """loops: list of closed point loops with identical counts -> closed solid."""
    n = len(loops[0]); verts = []; faces = []
    for L in loops: verts += L
    for i in range(len(loops) - 1):
        a, b = i * n, (i + 1) * n
        for j in range(n):
            k = (j + 1) % n
            faces.append((a + j, a + k, b + k, b + j))
    if cap_start: faces.append(tuple(reversed(range(n))))
    if cap_end: faces.append(tuple(range((len(loops) - 1) * n, len(loops) * n)))
    return make_obj(name, verts, faces, material)

def prism_x(name, poly_yz, x0, x1, material=None):
    """Side-profile polygon (y, height) extruded across x."""
    return loft(name, [[(x0, y, h(z)) for y, z in poly_yz], [(x1, y, h(z)) for y, z in poly_yz]], material)

def prism_y(name, poly_xz, y0, y1, material=None):
    return loft(name, [[(x, y0, h(z)) for x, z in poly_xz], [(x, y1, h(z)) for x, z in poly_xz]], material)

def box(name, x0, x1, y0, y1, z0, z1, material=None):
    """z given as heights above ground."""
    return prism_x(name, [(y0, z0), (y1, z0), (y1, z1), (y0, z1)], x0, x1, material)

def cyl_x(name, yc, zc, r, x0, x1, seg=48, material=None):
    pts = [(yc + r * math.cos(2 * math.pi * i / seg), zc + r * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    return prism_x(name, pts, x0, x1, material)

def cyl_y(name, xc, zc, r, y0, y1, seg=32, material=None):
    pts = [(xc + r * math.cos(2 * math.pi * i / seg), zc + r * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    return prism_y(name, pts, y0, y1, material)

def arc(yc, zc, r, a0, a1, n):
    return [(yc + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), zc + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

def prism_z(name, poly_xy, z0, z1, material=None):
    """Plan polygon (x, y) extruded between heights z0..z1 (above ground)."""
    return loft(name, [[(x, y, h(z0)) for x, y in poly_xy], [(x, y, h(z1)) for x, y in poly_xy]], material)

def sarch(yc, zc, a, b, n, t0, t1, N):
    """Superellipse arc (flatter, squarer than a circle for n > 2)."""
    pts = []
    for i in range(N + 1):
        t = t0 + (t1 - t0) * i / N
        c, sn = math.cos(t), math.sin(t)
        pts.append((yc + a * math.copysign(abs(c) ** (2 / n), c), zc + b * math.copysign(abs(sn) ** (2 / n), sn)))
    return pts

def sarch_t(zc, b, n, zb):
    """Parameter where a superellipse of half-height b crosses height zb."""
    d = (zb - zc) / b
    return math.asin(math.copysign(abs(d) ** (n / 2), d))

def dome_y(name, xc, zc, r, y0, sag, material=None, seg=32, rings=4, back=0.01):
    """Lens: flat back at y0-back, rim at y0, domed face reaching y0+sag."""
    R_ = (r * r + sag * sag) / (2 * sag)
    circ = lambda rr, yy: [(xc + rr * math.cos(2 * math.pi * i / seg), yy, h(zc) + rr * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    loops = [circ(r, y0 - back), circ(r, y0)]
    for k in range(1, rings + 1):
        rr = r * (1 - k / (rings + 1))
        loops.append(circ(rr, y0 + math.sqrt(R_ * R_ - rr * rr) - (R_ - sag)))
    return loft(name, loops, material)

def rrect(z, hw, yf, yr, rf, rr, seg=8):
    """Plan-view rounded rectangle at height z (absolute) -> loop CCW from top."""
    pts = []
    for (cx, cy, r, a0) in ((hw - rf, yf - rf, rf, 0), (-hw + rf, yf - rf, rf, 90),
                            (-hw + rr, yr + rr, rr, 180), (hw - rr, yr + rr, rr, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    return pts

def apply_all(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    old = ob.data; ob.modifiers.clear(); ob.data = me; me.name = ob.name
    bpy.data.meshes.remove(old)

def boolean(ob, cutter, op='DIFFERENCE', apply=True):
    m = ob.modifiers.new('bool', 'BOOLEAN')
    m.operation = op; m.solver = 'EXACT'
    if isinstance(cutter, bpy.types.Collection):
        m.operand_type = 'COLLECTION'; m.collection = cutter
    else:
        m.object = cutter
    m.material_mode = 'TRANSFER'
    if apply: apply_all(ob)
    return ob

def kill(*obs):
    for o in obs:
        me = o.data; bpy.data.objects.remove(o)
        if me and me.users == 0: bpy.data.meshes.remove(me)

def cutter_coll(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

def to_coll(ob, coll):
    for c in ob.users_collection: c.objects.unlink(ob)
    coll.objects.link(ob); return ob

def finish(ob, bevel=0.008, seg=2, angle=35):
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL')
        b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'
        b.angle_limit = math.radians(angle); b.use_clamp_overlap = True
        b.harden_normals = False
        apply_all(ob)
    ob.data.shade_smooth()
    ob.data.set_sharp_from_angle(angle=math.radians(angle))
    w = ob.modifiers.new('wn', 'WEIGHTED_NORMAL'); w.keep_sharp = True
    apply_all(ob)

def join(name, obs):
    base = obs[0]
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    mats = []
    for o in obs:
        me = o.data
        offset = len(mats)
        for m in me.materials:
            if m not in mats: mats.append(m)
        tmp = bmesh.new(); tmp.from_mesh(me)
        for f in tmp.faces:
            f.material_index = mats.index(me.materials[f.material_index]) if me.materials else 0
        tmp.transform(o.matrix_world)
        me2 = bpy.data.meshes.new('tmp'); tmp.to_mesh(me2); tmp.free()
        bm.from_mesh(me2); bpy.data.meshes.remove(me2)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    kill(*obs)
    return ob

# ---------------------------------------------------------------- materials
def materials():
    return dict(
        paint=mat('paint', (0.30, 0.018, 0.012), rough=0.32, coat=0.6),       # Freeborn Red-ish, recolourable
        roof=mat('paint_roof', (0.80, 0.79, 0.74), rough=0.35, coat=0.4),    # white hardtop roof
        glass=mat('glass', (0.6, 0.65, 0.65), rough=0.03, transmission=1.0),
        interior=mat('interior', (0.025, 0.025, 0.025), rough=0.8),
        black=mat('trim_black', (0.015, 0.015, 0.015), rough=0.55),
        chassis=mat('chassis_black', (0.03, 0.03, 0.03), rough=0.6, metal=0.3),
        vinyl=mat('interior_vinyl', (0.07, 0.06, 0.055), rough=0.7),
        white=mat('trim_white', (0.78, 0.78, 0.74), rough=0.35),
        chrome=mat('chrome', (0.92, 0.92, 0.92), rough=0.12, metal=1.0),
        bumper=mat('metal_bumper', (0.55, 0.56, 0.57), rough=0.32, metal=0.85),
        lens=mat('lamp_lens', (0.86, 0.87, 0.86), rough=0.14, metal=0.35, coat=1.0),
        tyre=mat('tyre_rubber', (0.025, 0.025, 0.025), rough=0.85),
        wheel=mat('wheel_white', (0.82, 0.81, 0.76), rough=0.35, coat=0.3),
        red=mat('lamp_red', (0.75, 0.02, 0.02), rough=0.15, transmission=0.4),
        amber=mat('lamp_amber', (1.0, 0.33, 0.0), rough=0.15, transmission=0.5),
    )

# ---------------------------------------------------------------- parts
def build_front(M):
    parts = []
    # Bonnet: crowned, slopes down to the front, rounded edges.
    hw, r = 0.53, 0.04
    loops = []
    # bonnet is a lid: full-depth sides back to the cowl, but only a thin lip over the front panel
    for i, y in enumerate([0.42, 0.9, 1.4, 1.575, 1.585, 1.64, 1.675, 1.69]):
        t = (y - 0.42) / (1.69 - 0.42)
        top = 1.28 - 0.10 * t
        drop = [0, 0, 0, 0, 0, 0.012, 0.03, 0.06][i]       # front edge rolls down over the grille
        inset = [0, 0, 0, 0, 0, 0.002, 0.008, 0.02][i]
        zbot = [0.95, 0.95, 0.95, 0.95, 1.10, 1.10, 1.10, 1.10][i]
        sec = []
        n = 10
        # from left-bottom up and over to right-bottom
        sec.append((-hw + inset, y, h(zbot)))
        for a in range(0, 7):
            ang = math.radians(180 - a * 15)
            sec.append((-hw + inset + r + r * math.cos(ang) - r, y, h(top - drop - r + r * math.sin(ang))))
        for k in range(1, n):
            x = -hw + r + (2 * (hw - r)) * k / n
            crown = 0.022 * (1 - (x / (hw - r)) ** 2)
            sec.append((x * (1 - inset), y, h(top - drop + crown)))
        for a in range(0, 7):
            ang = math.radians(90 - a * 15)
            sec.append((hw - inset - r + r * math.cos(ang), y, h(top - drop - r + r * math.sin(ang))))
        sec.append((hw - inset, y, h(zbot)))
        loops.append(sec)
    bon = loft('bonnet', loops, M['paint']); parts.append(bon)

    # Front panel with headlamp and grille recesses.
    fp = box('front_panel', -0.515, 0.515, 1.58, Y_GRILLE, 0.71, 1.13, M['paint'])
    cut = cutter_coll('fp_cut')
    for s in (-1, 1):
        to_coll(cyl_y('hl_cut', s * 0.335, 0.975, 0.10, Y_GRILLE - 0.05, Y_GRILLE + 0.1), cut)
    to_coll(box('grille_cut', -0.205, 0.205, Y_GRILLE - 0.035, Y_GRILLE + 0.1, 0.905, 1.045), cut)
    to_coll(box('vent_cut', -0.20, 0.20, Y_GRILLE - 0.02, Y_GRILLE + 0.1, 0.80, 0.835), cut)
    boolean(fp, cut)
    for o in list(cut.objects): kill(o)
    bpy.data.collections.remove(cut)
    # Black recess backs so the cut-outs read as openings.
    rec = box('trim_grille_back', -0.21, 0.21, Y_GRILLE - 0.05, Y_GRILLE - 0.03, 0.79, 1.05, M['black'])
    val = box('trim_valance', -0.60, 0.60, Y_GRILLE - 0.12, Y_GRILLE - 0.07, 0.56, 0.72, M['black'])
    parts.append(fp)

    # Front wings: side-profile polygon with the wheel arch and the flare sweeping to the step.
    A = ARCH_F; ro, ri = A['r'] + 0.11, A['r']
    th_o = math.degrees(math.atan2(WING_TOP - 0.30 - A['hc'] + 0.0, 0)) if False else None
    def ang(yy, zz): return math.degrees(math.atan2(zz - A['hc'], yy - A['y']))
    # outer circle from where it meets y=0.62 down to h=0.62
    a_start = ang(0.62, A['hc'] + math.sqrt(ro ** 2 - (0.62 - A['y']) ** 2))
    a_end = ang(A['y'] - math.sqrt(ro ** 2 - (0.62 - A['hc']) ** 2), 0.62)
    outer = arc(A['y'], A['hc'], ro, a_start, a_end, 6)
    zb = SILL - 0.005
    ib0 = ang(A['y'] - math.sqrt(ri ** 2 - (zb - A['hc']) ** 2), zb)
    ib1 = ang(A['y'] + math.sqrt(ri ** 2 - (0.78 - A['hc']) ** 2), 0.78)
    inner = arc(A['y'], A['hc'], ri, ib0, ib1, 28)
    front_top = arc(Y_WING_FRONT - 0.10, WING_TOP - 0.10, 0.10, 0, 90, 6)
    front_top = arc(Y_WING_FRONT - 0.10, WING_TOP + 0.04 - 0.10, 0.10, 0, 90, 6)
    prof = front_top + [(0.62, WING_TOP + 0.04)] + outer + [(0.34, 0.605), (0.34, zb)] + inner + [(Y_WING_FRONT, 0.78)]
    prof = list(reversed(prof))
    for s in (-1, 1):
        x0, x1 = (0.50, HW_WING) if s > 0 else (-HW_WING, -0.50)
        w = prism_x('wing_' + ('r' if s > 0 else 'l'), prof, x0, x1, M['paint'])
        rr = 0.16                                   # roll radius from the top into the flare
        xs = [(0.50, SILL - 0.1), (0.50, WING_TOP)]
        xs += [(HW_WING - rr + rr * math.cos(math.radians(a)), WING_TOP - rr + rr * math.sin(math.radians(a))) for a in range(90, -1, -10)]
        xs += [(HW_WING, SILL - 0.1)]
        xs = [(s * x, z) for x, z in xs]
        if s < 0: xs = list(reversed(xs))
        sec = prism_y('wing_sec', xs, 0.2, 1.9)
        boolean(w, sec, 'INTERSECT'); kill(sec)
        b = w.modifiers.new('bevel', 'BEVEL'); b.width = 0.025; b.segments = 3
        b.limit_method = 'ANGLE'; b.angle_limit = math.radians(40); b.use_clamp_overlap = True
        apply_all(w)
        parts.append(w)

    # Cowl / scuttle sides between the wing and the door.
    q = lambda t: ((1 - t) ** 2 * 0.66 + 2 * (1 - t) * t * 0.60 + t * t * 0.42,
                   (1 - t) ** 2 * WING_TOP + 2 * (1 - t) * t * 1.30 + t * t * 1.31)
    cowl_prof = [(0.30, SILL), (0.66, SILL)] + [q(i / 10) for i in range(11)] + [(0.30, BELT)]
    cowl = prism_x('cowl', cowl_prof, -HW_TUB, HW_TUB, M['paint'])
    boolean(cowl, cyl_x('arch_cut_f', A['y'], A['hc'], A['r'] + 0.005, -1, 1))
    kill(bpy.data.objects['arch_cut_f'])
    # louvre vent grooves on the cowl sides
    cut = cutter_coll('louvre')
    for s in (-1, 1):
        for k in range(5):
            zz = 0.93 + k * 0.022
            to_coll(box('lv', s * HW_TUB - 0.006, s * HW_TUB + 0.006, 0.40, 0.50, zz, zz + 0.008) if s > 0 else
                    box('lv', -HW_TUB - 0.006, -HW_TUB + 0.006, 0.40, 0.50, zz, zz + 0.008), cut)
    boolean(cowl, cut)
    for o in list(cut.objects): kill(o)
    bpy.data.collections.remove(cut)
    parts.append(cowl)
    for p in parts:
        if p.name.startswith('wing'):
            p.data.shade_smooth(); p.data.set_sharp_from_angle(angle=math.radians(40))
        elif p.name == 'cowl':
            finish(p, bevel=0.022, seg=3, angle=30)
        else:
            finish(p, bevel=0.006)
    finish(rec, bevel=0); finish(val, bevel=0.01)
    return join('body_front', parts), [rec, val]

def gh_params(z_abs):
    """Greenhouse cross-section at absolute height z."""
    t = (z_abs - h(BELT)) / (ROOF_EDGE - BELT)
    hw = HW_TUB - 0.028 * t
    yf = Y_SCREEN - 0.07 * t
    yr = Y_TAIL + 0.016 * t
    return hw, yf, yr

def greenhouse_loops(inset=0.0, z0=BELT, z1=ROOF_EDGE, n=6):
    loops = []
    for i in range(n + 1):
        z = h(z0 + (z1 - z0) * i / n)
        hw, yf, yr = gh_params(z)
        loops.append(rrect(z, hw - inset, yf - inset, yr + inset, max(0.04 - inset, 0.01), max(0.20 - inset, 0.02)))
    return loops

def build_sides(M):
    # Tub: slab sides from the cowl back to the tail.
    tub_loops = []
    for zz in (SILL, SILL + 0.02, BELT - 0.02, BELT):
        ins = 0.012 if zz in (SILL, ) else 0.0
        tub_loops.append(rrect(h(zz), HW_TUB - ins, Y_SCREEN + 0.0 - ins, Y_TAIL + ins, 0.02, 0.06))
    tub = loft('tub', tub_loops, M['paint'])
    tub.data.materials.append(M['interior'])
    cut = cutter_coll('tub_cut')
    to_coll(box('cabin_void', -0.735, 0.735, Y_TAIL + 0.04, Y_SCREEN - 0.03, 0.70, BELT + 0.2, M['interior']), cut)
    to_coll(prism_x('arch_cut_r', sarch(ARCH_R['y'], ARCH_R['hc'], ARCH_R['a'], ARCH_R['b'], ARCH_R['n'], 0, 2 * math.pi, 96)[:-1], -1, 1), cut)
    # door shut lines and rear barn-door seams (shallow grooves)
    for s in (-1, 1):
        for yy in (Y_SCREEN - 0.012, DOOR_REAR):
            to_coll(box('seam', s * HW_TUB - 0.006 * s if s > 0 else -HW_TUB - 0.05, HW_TUB + 0.05 if s > 0 else -HW_TUB + 0.006,
                        yy - 0.002, yy + 0.002, SILL + 0.03, BELT + 0.1), cut)
        # swage line along the tub at door-handle height
        to_coll(box('swage', HW_TUB - 0.004 if s > 0 else -HW_TUB - 0.05, HW_TUB + 0.05 if s > 0 else -HW_TUB + 0.004,
                    Y_TAIL + 0.1, Y_SCREEN + 0.02, 1.10, 1.107), cut)
    for xx in (0.0, -0.73, 0.73):
        to_coll(box('rseam', xx - 0.002, xx + 0.002, Y_TAIL - 0.05, Y_TAIL + 0.006, SILL + 0.06, BELT + 0.1), cut)
    to_coll(box('rseam_b', -0.73, 0.73, Y_TAIL - 0.05, Y_TAIL + 0.006, SILL + 0.058, SILL + 0.062), cut)
    boolean(tub, cut)
    for o in list(cut.objects): kill(o)
    bpy.data.collections.remove(cut)
    # top cap of the tub is hidden inside the cabin: dark interior
    for p in tub.data.polygons:
        if p.normal.z > 0.9 and p.center.z > h(BELT) - 0.001 and abs(p.center.x) < HW_TUB - 0.03:
            p.material_index = 1
    finish(tub, bevel=0.008)

    # Rear wheel-arch lip.
    A = ARCH_R
    zb = SILL + 0.005
    L = 0.055
    t0 = sarch_t(A['hc'], A['b'] + L, A['n'], zb); t1 = sarch_t(A['hc'], A['b'], A['n'], zb)
    outer = sarch(A['y'], A['hc'], A['a'] + L, A['b'] + L, A['n'], t0, math.pi - t0, 48)
    inner = sarch(A['y'], A['hc'], A['a'], A['b'], A['n'], math.pi - t1, t1, 48)
    lips = []
    for s in (-1, 1):
        x0, x1 = (HW_TUB - 0.01, HW_TUB + 0.022) if s > 0 else (-HW_TUB - 0.022, -HW_TUB + 0.01)
        lip = prism_x('lip', outer + inner, x0, x1, M['paint'])
        b = lip.modifiers.new('bevel', 'BEVEL'); b.width = 0.012; b.segments = 3
        b.limit_method = 'ANGLE'; b.angle_limit = math.radians(40); b.use_clamp_overlap = True
        apply_all(lip); lip.data.shade_smooth(); lip.data.set_sharp_from_angle(angle=math.radians(40))
        lips.append(lip)

    # Running-board step under each door: the front flare tail runs into it.
    for s_ in (-1, 1):
        x0, x1 = (HW_TUB - 0.03, HW_TUB + 0.045) if s_ > 0 else (-HW_TUB - 0.045, -HW_TUB + 0.03)
        st = prism_x('step', [(0.36, SILL - 0.02), (DOOR_REAR - 0.02, SILL - 0.02), (DOOR_REAR - 0.02, SILL + 0.01),
                              (DOOR_REAR - 0.05, SILL + 0.025), (0.36, SILL + 0.025)], x0, x1, M['paint'])
        finish(st, bevel=0.006)
        lips.append(st)

    # Greenhouse shell (painted sides), window and seam cuts.
    gh = loft('greenhouse', greenhouse_loops(0.0, BELT, ROOF_EDGE + 0.004), M['paint'])
    inner = loft('gh_inner', greenhouse_loops(0.04, BELT - 0.05, ROOF_EDGE + 0.05), M['interior'])
    boolean(gh, inner); kill(inner)
    gh.data.materials.append(M['interior']) if M['interior'].name not in gh.data.materials else None
    cut = cutter_coll('gh_cut')
    for c in window_cutters(): to_coll(c, cut)
    # rear door seams through the greenhouse (thin vertical slots near the outside only)
    for xx in (0.0, -0.73, 0.73):
        to_coll(box('rseam', xx - 0.002, xx + 0.002, Y_TAIL - 0.05, Y_TAIL + 0.03, BELT - 0.05, ROOF_EDGE - 0.03), cut)
    to_coll(box('rseam_t', -0.73, 0.73, Y_TAIL - 0.05, Y_TAIL + 0.03, ROOF_EDGE - 0.034, ROOF_EDGE - 0.03), cut)
    for s in (-1, 1):
        to_coll(box('dseam', 0.735 if s > 0 else -0.85, 0.85 if s > 0 else -0.735, DOOR_REAR - 0.002, DOOR_REAR + 0.002,
                    BELT - 0.05, ROOF_EDGE - 0.03), cut)
        to_coll(box('dseam_t', 0.735 if s > 0 else -0.85, 0.85 if s > 0 else -0.735, DOOR_REAR, Y_SCREEN - 0.02,
                    ROOF_EDGE - 0.034, ROOF_EDGE - 0.03), cut)
    boolean(gh, cut)
    for o in list(cut.objects): kill(o)
    bpy.data.collections.remove(cut)
    finish(gh, bevel=0.006)
    return tub, gh, lips

def rbox_x(name, x0, x1, y0, y1, z0, z1, r=0.05, seg=5):
    """Window cutter rounded in side view (y, z), extruded across x."""
    pts = []
    for (cy, cz, a0) in ((y1 - r, z1 - r, 0), (y0 + r, z1 - r, 90), (y0 + r, z0 + r, 180), (y1 - r, z0 + r, 270)):
        pts += [(cy + r * math.cos(math.radians(a0 + 90 * i / seg)), cz + r * math.sin(math.radians(a0 + 90 * i / seg))) for i in range(seg + 1)]
    return prism_x(name, pts, x0, x1)

def rbox_y(name, x0, x1, y0, y1, z0, z1, r=0.05, seg=5):
    pts = []
    for (cx, cz, a0) in ((x1 - r, z1 - r, 0), (x0 + r, z1 - r, 90), (x0 + r, z0 + r, 180), (x1 - r, z0 + r, 270)):
        pts += [(cx + r * math.cos(math.radians(a0 + 90 * i / seg)), cz + r * math.sin(math.radians(a0 + 90 * i / seg))) for i in range(seg + 1)]
    return prism_y(name, pts, y0, y1)

def window_cutters(g=0.0, seg=5):
    W = []
    z0, z1 = 1.40 - g, 1.765 + g   # step 3: window tops lowered 5 cm (photo)
    W.append(('windscreen', rbox_y('w_ws', -0.69 - g, 0.69 + g, 0.15, 0.50, 1.42 - g, 1.765 + g, r=0.04 + g, seg=seg)))
    for s, sn in ((1, 'r'), (-1, 'l')):
        xa, xb = (0.55, 0.95) if s > 0 else (-0.95, -0.55)
        W.append(('door_' + sn, rbox_x('w_d', xa, xb, DOOR_REAR + 0.06 - g, Y_SCREEN - 0.08 + g, z0, z1, r=0.05 + g, seg=seg)))
        W.append(('side_' + sn, rbox_x('w_s', xa, xb, -1.07 - g, DOOR_REAR - 0.07 + g, z0, z1, r=0.05 + g, seg=seg)))
        W.append(('quarter_' + sn, rbox_x('w_q', xa, xb, -1.38 - g, -1.14 + g, z0, z1, r=0.05 + g, seg=seg)))
        W.append(('corner_' + sn, rbox_x('w_c', 0.555 - g if s > 0 else -0.95, 0.95 if s > 0 else -0.555 + g, -2.1, -1.58 + g, z0, z1, r=0.05 + g, seg=seg)))
        W.append(('rear_' + sn, rbox_y('w_r', (0.08 - g) if s > 0 else (-0.475 - g), (0.475 + g) if s > 0 else (-0.08 + g), -2.1, -1.7, z0, z1, r=0.05 + g, seg=seg)))
    for name, ob in W: ob['wname'] = name
    return [ob for _, ob in W]

def build_glass(M):
    out = []
    for c in window_cutters():
        g = loft('glass_' + c['wname'], greenhouse_loops(0.017, BELT, ROOF_EDGE, n=1), M['glass'])
        gi = loft('gi', greenhouse_loops(0.022, BELT - 0.05, ROOF_EDGE + 0.05, n=1), M['glass'])
        boolean(g, gi); kill(gi)
        boolean(g, c, 'INTERSECT'); kill(c)
        g.data.shade_smooth(); g.data.set_sharp_from_angle(angle=math.radians(30))
        out.append(g)
    return out

HL_X, HL_Z, HL_R = 0.335, 0.975, 0.092

def text_mesh(name, body, size, x, y, z, material):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = 0.0015; cu.resolution_u = 3
    ob = bpy.data.objects.new(name + '_c', cu); bpy.context.scene.collection.objects.link(ob)
    ob.location = (x, y, h(z)); ob.rotation_euler = (math.radians(90), 0, math.radians(180))
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    m = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(m)
    m.matrix_world = ob.matrix_world.copy()
    bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
    me.materials.clear(); me.materials.append(material)
    return m

def build_front_details(M):
    """Grille surround, bars, badge, headlamp bezels and lamps, indicators, front bumper."""
    out = []
    yf = Y_GRILLE
    # White grille surround framing both headlamps and the grille opening.
    sur = rbox_y('trim_grille_surround', -0.475, 0.475, yf - 0.005, yf + 0.016, 0.862, 1.088, r=0.035, seg=4)
    sur.data.materials.append(M['white'])
    cut = cutter_coll('sur_cut')
    for s in (-1, 1):
        to_coll(cyl_y('c', s * HL_X, HL_Z, HL_R + 0.006, yf - 0.1, yf + 0.1, seg=40), cut)
    to_coll(rbox_y('c', -0.205, 0.205, yf - 0.1, yf + 0.1, 0.905, 1.045, r=0.012, seg=3), cut)
    boolean(sur, cut)
    for o in list(cut.objects): kill(o)
    bpy.data.collections.remove(cut)
    finish(sur, bevel=0.005, seg=2); out.append(sur)

    # Horizontal grille bars (badge plate sits across the middle).
    bars = []
    for z in (0.912, 0.934, 1.016, 1.038):
        b = box('bar', -0.203, 0.203, yf - 0.03, yf + 0.004, z - 0.005, z + 0.005, M['chrome'])
        finish(b, bevel=0.002, seg=1); bars.append(b)
    for x in (-0.205 + 0.137, 0.205 - 0.137):
        b = box('bar', x - 0.004, x + 0.004, yf - 0.03, yf - 0.002, 0.905, 1.045, M['chrome']); bars.append(b)
    out.append(join('trim_grille_bars', bars))

    # Badge: black plate with raised TOYOTA lettering (geometry, drawn here, not copied artwork).
    plate = rbox_y('badge_plate', -0.15, 0.15, yf - 0.012, yf + 0.006, 0.952, 0.998, r=0.008, seg=2)
    plate.data.materials.append(M['black']); finish(plate, bevel=0.002, seg=1)
    txt = text_mesh('badge_text', 'TOYOTA', 0.036, 0.0, yf + 0.0075, 0.975, M['chrome'])
    out.append(join('trim_badge', [plate, txt]))

    # Headlamps: chrome bezel ring, domed lens, chrome reflector behind.
    for s, sn in ((-1, 'l'), (1, 'r')):
        ring = cyl_y('bezel', s * HL_X, HL_Z, HL_R + 0.022, yf + 0.004, yf + 0.026, seg=40, material=M['chrome'])
        boolean(ring, cyl_y('rc', s * HL_X, HL_Z, HL_R - 0.004, yf - 0.1, yf + 0.1, seg=40)); kill(bpy.data.objects['rc'])
        b = ring.modifiers.new('bv', 'BEVEL'); b.width = 0.007; b.segments = 2; b.limit_method = 'ANGLE'
        apply_all(ring); ring.data.shade_smooth(); ring.data.set_sharp_from_angle(angle=math.radians(50))
        ring.name = 'trim_bezel_head_' + sn; out.append(ring)
        lens = dome_y('lens', s * HL_X, HL_Z, HL_R, yf - 0.01, 0.022, M['lens'], seg=32, rings=4)
        refl = cyl_y('refl', s * HL_X, HL_Z, HL_R + 0.004, yf - 0.05, yf - 0.035, seg=32, material=M['chrome'])
        lamp = join('lamp_head_' + sn, [lens, refl]); lamp.data.shade_smooth()
        lamp.data.set_sharp_from_angle(angle=math.radians(40)); out.append(lamp)

    # Front indicators: amber lenses on chrome housings at the top front of each wing.
    housings = []
    for s, sn in ((-1, 'fl'), (1, 'fr')):
        x0, x1 = sorted((s * 0.615, s * 0.765))
        hs = rbox_y('ind_h', x0 - 0.008, x1 + 0.008, Y_WING_FRONT - 0.03, Y_WING_FRONT + 0.012, 0.912, 0.992, r=0.014, seg=3)
        hs.data.materials.append(M['chrome']); finish(hs, bevel=0.003, seg=1); housings.append(hs)
        ln = rbox_y('lamp_indicator_' + sn, x0, x1, Y_WING_FRONT + 0.010, Y_WING_FRONT + 0.034, 0.920, 0.984, r=0.010, seg=3)
        ln.data.materials.append(M['amber']); finish(ln, bevel=0.004, seg=2); out.append(ln)
    out.append(join('trim_indicator_housing', housings))

    # Front bumper: pressed-steel channel, ends swept back, on two brackets.
    plan = [(-0.78, 1.86), (0.78, 1.86), (0.84, 1.81), (0.84, 1.775), (0.77, 1.765), (-0.77, 1.765), (-0.84, 1.775), (-0.84, 1.81)]
    bum = prism_z('trim_bumper_front', plan, 0.525, 0.675, M['bumper'])
    boolean(bum, box('bc', -0.77, 0.77, 1.852, 1.95, 0.55, 0.65)); kill(bpy.data.objects['bc'])
    finish(bum, bevel=0.006, seg=2); out.append(bum)
    br = [box('br', x - 0.035, x + 0.035, 1.56, 1.77, 0.56, 0.64, M['black']) for x in (-0.48, 0.48)]
    for b in br: finish(b, bevel=0.004, seg=1)
    out.append(join('trim_bumper_brackets', br))
    return out

def seg_box(name, p0, p1, w, t, material=None):
    """Box of width w, thickness t running from p0 to p1 (absolute coordinates)."""
    p0, p1 = Vector(p0), Vector(p1); d = (p1 - p0).normalized()
    up = Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((0, 1, 0))
    u = d.cross(up).normalized() * (w / 2); v = d.cross(u).normalized() * (t / 2)
    vs = [p + a * u + b * v for p in (p0, p1) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    return make_obj(name, vs, [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)], material)

def cyl_z(name, xc, yc, r, z0, z1, seg=12, material=None):
    return prism_z(name, [(xc + r * math.cos(2 * math.pi * i / seg), yc + r * math.sin(2 * math.pi * i / seg)) for i in range(seg)], z0, z1, material)

def shear_to_screen(ob, off=0.0):
    """Mesh built with y as an offset from the windscreen face; move it onto the raked face."""
    for v in ob.data.vertices:
        v.co.y = gh_params(v.co.z)[1] + off + v.co.y
    ob.data.update()

def build_windscreen(M):
    """Separate windscreen frame (body colour, proud of the cabin front) and two parked wipers."""
    out = []
    fr = rbox_y('trim_windscreen_frame', -0.762, 0.762, 0.0, 0.013, 1.37, 1.80, r=0.03, seg=4)
    fr.data.materials.append(M['paint'])
    boolean(fr, rbox_y('fh', -0.69, 0.69, -0.5, 0.5, 1.42, 1.765, r=0.04, seg=5)); kill(bpy.data.objects['fh'])
    shear_to_screen(fr); finish(fr, bevel=0.004, seg=2); out.append(fr)
    for sn, x0, x1 in (('l', -0.47, -0.08), ('r', 0.10, 0.50)):
        arm = seg_box('arm', (x0, 0, h(1.425)), (x0 + 0.33, 0, h(1.49)), 0.008, 0.006, M['black'])
        blade = seg_box('blade', (x0 + 0.02, 0, h(1.452)), (x1, 0, h(1.513)), 0.014, 0.012, M['black'])
        piv = cyl_y('piv', x0, 1.42, 0.012, -0.004, 0.012, seg=10, material=M['black'])
        for o in (arm, blade, piv): shear_to_screen(o, off=-0.006)
        wp = join('trim_wiper_' + sn, [arm, blade, piv]); out.append(wp)
    return out

def build_side_hardware(M):
    """Front-door hinges and handles, mirrors, roof drip rails."""
    out = []; hinges = []
    for s, sn in ((-1, 'l'), (1, 'r')):
        X = s * HW_TUB
        # exposed door hinges at the door's front edge
        for zc in (0.82, 1.22):
            hinges.append(box('hl', min(X, X + s * 0.008), max(X, X + s * 0.008), Y_SCREEN - 0.075, Y_SCREEN + 0.06, zc - 0.035, zc + 0.035, M['black']))
            hinges.append(cyl_z('hk', X + s * 0.012, Y_SCREEN - 0.012, 0.012, zc - 0.045, zc + 0.045, material=M['black']))
        # door handle: escutcheon + pull, at the rear of the door just above the swage line
        esc = box('esc', min(X, X + s * 0.006), max(X, X + s * 0.006), -0.385, -0.255, 1.118, 1.152, M['chrome'])
        pull = box('pull', min(X, X + s * 0.018), max(X, X + s * 0.018), -0.37, -0.27, 1.126, 1.142, M['chrome'])
        for o in (esc, pull): finish(o, bevel=0.003, seg=1)
        out.append(join('trim_handle_door_' + sn, [esc, pull]))
        # mirror on the door's front top corner: arm + rear-facing head
        base = (X, 0.235, h(1.39)); top = (s * 0.94, 0.25, h(1.51))
        arm = seg_box('marm', base, top, 0.016, 0.016, M['black'])
        x0, x1 = sorted((s * 0.885, s * 1.015))
        head = rbox_y('mhead', x0, x1, 0.24, 0.272, 1.50, 1.68, r=0.025, seg=3); head.data.materials.append(M['black'])
        glass = rbox_y('mglass', x0 + 0.008, x1 - 0.008, 0.235, 0.241, 1.508, 1.672, r=0.02, seg=3); glass.data.materials.append(M['chrome'])
        for o in (head, glass): finish(o, bevel=0.003, seg=1)
        out.append(join('trim_mirror_' + sn, [arm, head, glass]))
        # roof drip rail along each side, just under the white cap
        hw = gh_params(h(1.80))[0]
        xi, xo = sorted((s * (hw - 0.004), s * (hw + 0.016)))
        yfr = gh_params(h(1.80))[1] - 0.01
        dr = prism_x('drip', [(yfr, 1.792), (-1.62, 1.792), (-1.62, 1.808), (yfr, 1.808)], xi, xo, M['roof'])
        finish(dr, bevel=0.003, seg=1); out.append(dr)
    for o in hinges: finish(o, bevel=0.002, seg=1)
    out.append(join('trim_hinges_door', hinges))
    drips = [o for o in out if o.name.startswith('drip')]
    out = [o for o in out if not o.name.startswith('drip')] + [join('trim_drip_rail', drips)]
    return out

def build_rear_hardware(M):
    """Rear bumperettes, tail lamps, rear indicators, reflectors, barn-door hinges and handle."""
    out = []; hinges = []
    for s, sn in ((-1, 'l'), (1, 'r')):
        plan = [(0.48, -1.99), (0.80, -1.99), (0.84, -1.95), (0.84, -1.80), (0.795, -1.80), (0.795, -1.886), (0.48, -1.886)]
        b = prism_z('trim_bumper_rear_' + sn, [(s * x, y) for x, y in plan], 0.50, 0.63, M['bumper'])
        finish(b, bevel=0.006, seg=2); out.append(b)
        rf = cyl_y('trim_reflector_' + sn, s * 0.70, 0.565, 0.026, -2.0, -1.988, seg=20, material=M['red'])
        finish(rf, bevel=0.002, seg=1); out.append(rf)
        x0, x1 = sorted((s * 0.575, s * 0.705))
        hs = rbox_y('tail_h', x0 - 0.008, x1 + 0.008, Y_TAIL - 0.018, Y_TAIL + 0.004, 0.662, 0.808, r=0.012, seg=2)
        hs.data.materials.append(M['chrome']); finish(hs, bevel=0.002, seg=1)
        out.append(hs)
        lt = rbox_y('lamp_tail_' + sn, x0, x1, Y_TAIL - 0.026, Y_TAIL - 0.016, 0.738, 0.798, r=0.008, seg=2)
        lt.data.materials.append(M['red']); finish(lt, bevel=0.003, seg=1); out.append(lt)
        li = rbox_y('lamp_indicator_r' + sn, x0, x1, Y_TAIL - 0.026, Y_TAIL - 0.016, 0.672, 0.730, r=0.008, seg=2)
        li.data.materials.append(M['amber']); finish(li, bevel=0.003, seg=1); out.append(li)
        # barn doors hinge on their outer edges
        for zc in (0.80, 1.22):
            xa, xb = sorted((s * 0.625, s * 0.722))
            hinges.append(box('rh', xa, xb, Y_TAIL - 0.012, Y_TAIL + 0.002, zc - 0.03, zc + 0.03, M['black']))
            hinges.append(cyl_z('rk', s * 0.728, Y_TAIL - 0.012, 0.012, zc - 0.045, zc + 0.045, material=M['black']))
    for o in hinges: finish(o, bevel=0.002, seg=1)
    out.append(join('trim_hinges_rear', hinges))
    housings = [o for o in out if o.name.startswith('tail_h')]
    out = [o for o in out if not o.name.startswith('tail_h')] + [join('trim_tail_lamp_housing', housings)]
    # handle on the right-hand barn door, beside the centre seam
    esc = box('resc', 0.05, 0.17, Y_TAIL - 0.006, Y_TAIL + 0.002, 1.125, 1.175, M['chrome'])
    lev = box('rlev', 0.06, 0.20, Y_TAIL - 0.024, Y_TAIL - 0.006, 1.142, 1.158, M['chrome'])
    for o in (esc, lev): finish(o, bevel=0.003, seg=1)
    out.append(join('trim_handle_rear', [esc, lev]))
    return out

def build_chassis(M):
    """Ladder frame, engine/gearbox mass, tank, exhaust, prop shafts (static: chassis_frame) and the
    solid axles and leaf springs (chassis_axle_*, chassis_spring_*; the game draws its own moving ones)."""
    C = M['chassis']; parts = []
    for s in (-1, 1):
        x0, x1 = sorted((s * 0.39, s * 0.45))
        parts.append(box('rail', x0, x1, -1.86, 1.62, 0.40, 0.54, C))
    for yy in (1.56, 0.62, -0.35, -1.80):
        parts.append(box('xm', -0.40, 0.40, yy - 0.04, yy + 0.04, 0.42, 0.52, C))
    parts.append(box('engine', -0.26, 0.26, 0.62, 1.48, 0.46, 1.02, C))
    parts.append(box('sump', -0.18, 0.18, 0.80, 1.35, 0.38, 0.47, C))
    parts.append(box('gearbox', -0.16, 0.16, -0.20, 0.62, 0.38, 0.62, C))
    parts.append(box('tank', 0.08, 0.38, -0.95, -0.40, 0.36, 0.56, C))
    parts.append(seg_box('prop_f', (0.10, 0.05, h(0.42)), (0.12, FA - 0.12, h(HUB_H + 0.02)), 0.05, 0.05, C))
    parts.append(seg_box('prop_r', (0.0, -0.20, h(0.42)), (0.12, RA + 0.12, h(HUB_H + 0.02)), 0.055, 0.055, C))
    parts.append(cyl_y('exhaust', -0.30, 0.30, 0.024, Y_TAIL - 0.02, 0.55, seg=10, material=C))
    parts.append(cyl_y('muffler', -0.30, 0.31, 0.075, -1.15, -0.60, seg=14, material=C))
    for o in parts: finish(o, bevel=0.004, seg=1)
    out = [join('chassis_frame', parts)]
    for yy, ax in ((FA, 'f'), (RA, 'r')):
        tube = cyl_x('axle', yy, HUB_H, 0.042, -0.62, 0.62, seg=14, material=C)
        diff = cyl_x('diff', yy, HUB_H, 0.14, 0.04, 0.24, seg=18, material=C)
        for o in (tube, diff): finish(o, bevel=0.01, seg=2)
        out.append(join('chassis_axle_' + ax, [tube, diff]))
        for sgn, side in ((-1, 'l'), (1, 'r')):
            x = sgn * 0.42; pts = [(yy + 0.58, 0.425), (yy + 0.25, 0.345), (yy - 0.25, 0.345), (yy - 0.58, 0.425)]
            leaves = [seg_box('leaf', (x, a[0], h(a[1] - k * 0.012)), (x, b[0], h(b[1] - k * 0.012)), 0.06, 0.01, C)
                      for k in range(4) for a, b in zip(pts, pts[1:]) if k == 0 or abs(a[0] - yy) < 0.5 - k * 0.08]
            out.append(join(f'chassis_spring_{ax}{side}', leaves))
    return out

def build_interior(M):
    """Basic cabin seen through the glass: front buckets, rear side benches, dash, RHD wheel, levers."""
    V, D = M['vinyl'], M['interior']; parts = []
    for x in (-0.36, 0.36):
        parts.append(box('cush', x - 0.24, x + 0.24, -0.55, -0.10, 0.88, 0.98, V))
        parts.append(seg_box('back', (x, -0.55, h(0.98)), (x, -0.66, h(1.50)), 0.46, 0.09, V))
    for s in (-1, 1):
        x0, x1 = sorted((s * 0.40, s * 0.72))
        parts.append(box('bench', x0, x1, -1.80, -0.95, 0.88, 0.96, V))
        xb0, xb1 = sorted((s * 0.68, s * 0.73))
        parts.append(box('bench_back', xb0, xb1, -1.80, -0.95, 0.96, 1.30, V))
    parts.append(box('dash', -0.73, 0.73, 0.18, 0.30, 1.05, 1.36, D))
    parts.append(box('dash_top', -0.73, 0.73, 0.10, 0.30, 1.33, 1.37, V))
    parts.append(box('tunnel', -0.16, 0.16, -0.40, 0.25, 0.70, 0.86, V))
    for o in parts: finish(o, bevel=0.012, seg=2)
    # steering wheel on the right (the game's car is right-hand drive), column into the dash
    wc = Vector((0.36, 0.02, h(1.30)))
    col = seg_box('column', (0.36, 0.22, h(1.12)), tuple(wc), 0.04, 0.04, D)
    ring = []
    n = 20; tilt = math.radians(55); r = 0.19
    for i in range(n):
        a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        pa = wc + Vector((r * math.cos(a0), r * math.sin(a0) * math.cos(tilt), r * math.sin(a0) * math.sin(tilt)))
        pb = wc + Vector((r * math.cos(a1), r * math.sin(a1) * math.cos(tilt), r * math.sin(a1) * math.sin(tilt)))
        ring.append(seg_box('rim', tuple(pa), tuple(pb), 0.026, 0.026, D))
    spoke = seg_box('spoke', (0.36 - r, wc.y, wc.z), (0.36 + r, wc.y, wc.z), 0.03, 0.012, D)
    out = [join('interior_seats', parts), join('interior_steering', [col, spoke] + ring)]
    levers = [seg_box('lever', (x, -0.05, h(0.84)), (x + 0.01, -0.12, h(1.12)), 0.018, 0.018, D) for x in (0.0, -0.08)]
    out.append(join('interior_levers', levers))
    return out

def build_rubbers(M):
    """Black rubber window seals: a ring inside each opening, in front of the glass."""
    rings = []
    for c0, c1 in zip(window_cutters(0.0, seg=3), window_cutters(-0.022, seg=3)):
        r = loft('rub', greenhouse_loops(0.003, BELT, ROOF_EDGE, n=1), M['black'])
        ri = loft('rubi', greenhouse_loops(0.017, BELT - 0.05, ROOF_EDGE + 0.05, n=1), M['black'])
        boolean(r, ri); kill(ri)
        boolean(r, c0, 'INTERSECT'); boolean(r, c1); kill(c0, c1)
        rings.append(r)
    ob = join('trim_window_rubber', rings)
    finish(ob, bevel=0.003, seg=1)
    return ob

def build_roof(M):
    # White hardtop roof: overhangs the sides a touch (drip line), domed, rounded edge.
    loops = []
    hw, yf, yr = gh_params(h(ROOF_EDGE))
    ov = 0.018
    prof = [(0.0, 0.0), (0.0, 0.035), (0.008, 0.06), (0.022, 0.08), (0.045, 0.095)]
    zb = ROOF_EDGE - 0.01
    k = (ROOF_TOP - zb) / 0.112          # cap height scales so the roof top stays at ROOF_TOP
    for dx, dz in prof:
        loops.append(rrect(h(zb + dz * k), hw + ov - dx, yf + 0.045 - dx, yr - ov + dx, 0.05, 0.22 - dx * 0.5))
    # dome rings toward the centre
    for s, dz in ((0.8, 0.105), (0.55, 0.11), (0.3, 0.112)):
        loops.append([(x * s, (y - (yf + yr) / 2) * (0.3 + 0.7 * s) + (yf + yr) / 2, h(zb + dz * k)) for x, y, _ in loops[4]])
    roof = loft('body_roof', loops, M['roof'])
    # underside visible through windows: dark
    finish(roof, bevel=0)
    return roof

# ---------------------------------------------------------------- wheels (step 3)
# 7.50-16 tyre: 16 in rim (0.406 m), ~0.19 m section, ~0.79 m overall. Published track 1,400 mm.
TYRE_R, TYRE_W, HALF_TRACK = 0.392, 0.21, 0.70
HUB_H = TYRE_R                      # hub height above ground when parked (static deflection ignored)

def revolve(name, prof, angles, rmod=None, closed=True, material=None):
    """Revolve (x, r, tag) profile points about the X axis. rmod(tag, ring_index) -> radial offset."""
    n = len(prof); verts = []; faces = []
    for j, a in enumerate(angles):
        ca, sa = math.cos(a), math.sin(a)
        for (x, r, tag) in prof:
            rr = r + (rmod(tag, j) if rmod else 0.0)
            verts.append((x, rr * ca, rr * sa))
    m = len(angles)
    for j in range(m):
        j2 = (j + 1) % m
        for i in range(n if closed else n - 1):
            i2 = (i + 1) % n
            faces.append((j * n + i, j * n + i2, j2 * n + i2, j2 * n + i))
    return make_obj(name, verts, faces, material)

def tyre_mesh(M, blocks=24):
    T = TYRE_R; W = TYRE_W / 2
    prof = [(-W, T - 0.012, 'L'), (-W + 0.010, T - 0.002, 'L'), (-0.035, T, 'L'), (-0.031, T - 0.011, ''), (-0.021, T - 0.011, ''),
            (-0.017, T, 'C'), (0.017, T, 'C'), (0.021, T - 0.011, ''), (0.031, T - 0.011, ''), (0.035, T, 'R'),
            (W - 0.010, T - 0.002, 'R'), (W, T - 0.012, 'R'),
            (W + 0.007, T - 0.035, 'RS'), (W + 0.010, T - 0.08, ''), (W + 0.007, T - 0.13, ''), (W - 0.004, T - 0.168, ''),
            (W - 0.016, T - 0.184, ''), (W - 0.030, T - 0.190, ''),
            (-W + 0.030, T - 0.190, ''), (-W + 0.016, T - 0.184, ''), (-W + 0.004, T - 0.168, ''), (-W - 0.007, T - 0.13, ''),
            (-W - 0.010, T - 0.08, ''), (-W - 0.007, T - 0.035, 'LS')]
    # Lower-detail tread: each block is two rings; shoulder lugs alternate in depth, offset left/right.
    d = 2 * math.pi / blocks
    angles = []
    for k in range(blocks): angles += [k * d, k * d + 0.78 * d]
    def rmod(tag, j):
        k = j // 2
        if tag == 'L' and k % 2: return -0.011
        if tag == 'R' and not k % 2: return -0.011
        if tag == 'LS' and k % 2: return -0.006
        if tag == 'RS' and not k % 2: return -0.006
        return 0.0
    t = revolve('tyre', prof, angles, rmod, True, M['tyre'])
    t.data.shade_smooth(); t.data.set_sharp_from_angle(angle=math.radians(30))
    return t

def rim_parts(M, seg=40):
    angles = [2 * math.pi * i / seg for i in range(seg)]
    rp = [(-0.092, 0.192, ''), (-0.092, 0.212, ''), (-0.083, 0.214, ''), (-0.074, 0.198, ''), (0.072, 0.198, ''),
          (0.084, 0.213, ''), (0.095, 0.216, ''), (0.099, 0.207, ''), (0.091, 0.196, ''), (0.062, 0.190, ''),
          (0.050, 0.176, ''), (0.044, 0.140, ''), (0.047, 0.118, ''), (0.054, 0.108, ''), (0.054, 0.094, ''),
          (0.050, 0.082, ''), (0.050, 0.050, '')]
    rim = revolve('rim', rp, angles, None, False, M['wheel'])
    rim.data.shade_smooth(); rim.data.set_sharp_from_angle(angle=math.radians(40))
    cp = [(0.050, 0.054, ''), (0.060, 0.054, ''), (0.070, 0.047, ''), (0.078, 0.032, ''), (0.082, 0.015, ''), (0.083, 0.001, '')]
    cap = revolve('cap', cp, [2 * math.pi * i / 32 for i in range(32)], None, False, M['chrome'])
    cap.data.shade_smooth()
    lugs = []
    for k in range(6):                          # 6 studs on a 139.7 mm PCD
        a = math.radians(30 + 60 * k); cy, cz = 0.0699 * math.cos(a), 0.0699 * math.sin(a)
        hexp = [(cy + 0.0105 * math.cos(math.radians(60 * i)), cz + 0.0105 * math.sin(math.radians(60 * i))) for i in range(6)]
        lg = loft('lug', [[(0.050, y, z) for y, z in hexp], [(0.066, y, z) for y, z in hexp],
                          [(0.071, cy + (y - cy) * 0.6, cz + (z - cz) * 0.6) for y, z in hexp]], M['chrome'])
        lugs.append(lg)
    return [rim, cap] + lugs

def make_wheel(M, name, outer_sign, loc, rot_z=0.0):
    parts = [tyre_mesh(M)] + rim_parts(M)
    w = join(name, parts)
    if outer_sign < 0:                          # mirror so the dished face points outward on the left
        for v in w.data.vertices: v.co.x = -v.co.x
        w.data.flip_normals()
    w.location = loc; w.rotation_euler = (0, 0, rot_z)
    return w

def build_wheels(M):
    out = []
    for yy, ax in ((FA, 'f'), (RA, 'r')):
        for sgn, side in ((-1, 'l'), (1, 'r')):
            out.append(make_wheel(M, f'wheel_{ax}{side}', sgn, (sgn * HALF_TRACK, yy, h(HUB_H))))
    # Spare on the left rear door (as rear-34-left.jpg / rear-34-orange-1977.jpg), face to the rear.
    SP_X, SP_H = -0.375, 1.06
    sp_y = Y_TAIL - 0.035 - TYRE_W / 2
    out.append(make_wheel(M, 'spare', 1, (SP_X, sp_y, h(SP_H)), rot_z=math.radians(-90)))
    # Carrier: a plate on the door and a hub boss the wheel bolts to.
    pl = box('carrier_plate', SP_X - 0.16, SP_X + 0.16, Y_TAIL - 0.012, Y_TAIL + 0.004, SP_H - 0.08, SP_H + 0.08, M['black'])
    boss = cyl_y('carrier_boss', SP_X, SP_H, 0.05, sp_y + 0.04, Y_TAIL - 0.005, seg=24, material=M['black'])
    for o in (pl, boss): finish(o, bevel=0.004, seg=1)
    out.append(join('trim_spare_carrier', [pl, boss]))
    return out

def placeholders(M):
    """Wheels are real parts since step 3; nothing render-only left except the ground."""
    return []

def _old_placeholders(M):
    """Render-only stand-ins (wheels, headlamps). Not exported; real parts are later steps."""
    ph = []
    tyre = mat('ph_tyre', (0.02, 0.02, 0.02), rough=0.8)
    rim = mat('ph_rim', (0.75, 0.74, 0.70), rough=0.35, metal=0.3)
    lens = mat('ph_lens', (0.85, 0.85, 0.8), rough=0.1, metal=0.6)
    for yy in (FA, RA):
        for s in (-1, 1):
            x0 = s * 0.70
            t = cyl_x('ph_tyre', yy, 0.38, 0.38, x0 - 0.105, x0 + 0.105, seg=48, material=tyre)
            b = t.modifiers.new('bv', 'BEVEL'); b.width = 0.05; b.segments = 4; apply_all(t)
            t.data.shade_smooth(); t.data.set_sharp_from_angle(angle=math.radians(50))
            xr = x0 + s * 0.09
            r = cyl_x('ph_rim', yy, 0.38, 0.21, xr - 0.02, xr + 0.02, seg=40, material=rim)
            ph += [t, r]
    for o in ph: o['placeholder'] = True
    return ph

def split_rear(ob, name):
    """Faces at the tail facing backward become a separate object (BodyZone.Rear)."""
    bm = bmesh.new(); bm.from_mesh(ob.data)
    rear = [f for f in bm.faces if f.normal.y < -0.6 and f.calc_center_median().y < Y_TAIL + 0.08]
    if not rear: bm.free(); return None
    dup = bmesh.ops.duplicate(bm, geom=rear)
    bm2 = bmesh.new(); bm.free()
    bm = bmesh.new(); bm.from_mesh(ob.data)
    rear_idx = {f.index for f in bm.faces if f.normal.y < -0.6 and f.calc_center_median().y < Y_TAIL + 0.08}
    me_r = ob.data.copy(); rob = bpy.data.objects.new(name, me_r)
    bpy.context.scene.collection.objects.link(rob)
    bmr = bmesh.new(); bmr.from_mesh(me_r)
    bmesh.ops.delete(bmr, geom=[f for f in bmr.faces if f.index not in rear_idx], context='FACES')
    bmr.to_mesh(me_r); bmr.free()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index in rear_idx], context='FACES')
    bm.to_mesh(ob.data); bm.free(); bm2.free()
    return rob

def build():
    clean_scene()
    M = materials()
    front, front_trim = build_front(M)
    tub, gh, lips = build_sides(M)
    sides = join('body_sides', [tub, gh] + lips)
    rear = split_rear(sides, 'body_rear')
    roof = build_roof(M)
    glass = build_glass(M)
    rubber = build_rubbers(M)
    details = build_front_details(M)
    wheels = build_wheels(M)
    hw4 = build_windscreen(M) + build_side_hardware(M) + build_rear_hardware(M)
    hw4 += build_chassis(M) + build_interior(M)
    return M, dict(front=front, sides=sides, rear=rear, roof=roof, glass=glass, trim=front_trim + [rubber], details=details, wheels=wheels, hardware=hw4)

def tri_count(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)

def export(parts):
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    obs = [o for o in bpy.data.objects if o.type == 'MESH' and not o.get('placeholder')]
    for o in obs: o.select_set(True)
    path = os.path.join(OUT, 'fj40_body.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
                              export_apply=True, export_yup=True)
    return path

if __name__ == '__main__' and '--no-build' not in ARGS:
    M, P = build()
    blend = os.path.join(OUT, 'fj40_step1.blend')
    total = 0
    for o in bpy.data.objects:
        if o.type == 'MESH':
            t = tri_count(o); total += t
            print(f'  {o.name:28s} tris={t}')
    print('TOTAL TRIS', total)
    path = export(P)
    print('EXPORTED', path)
    if '--render' in ARGS:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import render_views
        render_views.render_all(OUT, placeholders, M, ARGS)
    bpy.ops.wm.save_as_mainfile(filepath=blend)
