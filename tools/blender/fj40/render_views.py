"""Render comparison views of the FJ40 body and build side-by-side composites.
Called from fj40_body.py with --render. Cycles on CPU."""
import bpy, math, os
from mathutils import Vector

REF = '/workspace/otc-blender/repo/reference/vehicles/landcruiser-fj40/'
# view name -> (reference photo, camera location, look-at target, focal mm, sensor width)
VIEWS = {
    'front34': ('front-34-right-1982.jpg', (3.15, 3.3, 0.72), (0.3, 0.2, 0.32), 28),
    'side_rear34': ('rear-34-left.jpg', (-3.55, -3.2, 0.45), (-0.05, -0.2, 0.4), 30),
    'front': ('front-white.jpg', (-0.95, 4.6, 0.95), (-0.1, 0.2, 0.42), 30),
    'ortho_side': (None, (12, 0, 0.5), (0, 0, 0.5), 50),
    'ortho_front': (None, (0, 12, 0.5), (0, 0, 0.5), 50),
    'rear34': ('front-34-hardtop.jpg', (2.3, -3.85, 0.6), (0.05, -0.45, 0.45), 30),
}

def setup_scene(res=(1050, 700), samples=48):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.view_settings.view_transform = 'AgX'
    sc.render.threads_mode = 'AUTO'
    # world: soft sky
    w = bpy.data.worlds.new('sky'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes['Background']
    bg.inputs['Color'].default_value = (0.55, 0.65, 0.85, 1)
    bg.inputs['Strength'].default_value = 0.5
    # sun
    sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = 2.6; sd.angle = math.radians(3)
    so = bpy.data.objects.new('sun', sd); sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(45), 0, math.radians(150))
    # ground
    me = bpy.data.meshes.new('ground')
    s = 40
    me.from_pydata([(-s, -s, -0.5), (s, -s, -0.5), (s, s, -0.5), (-s, s, -0.5)], [], [(0, 1, 2, 3)])
    g = bpy.data.objects.new('ground', me); sc.collection.objects.link(g)
    gm = bpy.data.materials.new('ground'); gm.use_nodes = True
    gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.32, 0.31, 0.29, 1)
    gm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
    me.materials.append(gm); g['placeholder'] = True
    cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co); sc.camera = co
    return co

def aim(co, loc, target, focal):
    co.location = loc
    d = Vector(target) - Vector(loc)
    co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    co.data.lens = focal; co.data.sensor_width = 36

def composite(ref_path, render_path, out_path, label):
    from PIL import Image, ImageDraw
    import subprocess
    H = 700
    r = Image.open(ref_path).convert('RGB'); r = r.resize((int(r.width * H / r.height), H))
    m = Image.open(render_path).convert('RGB'); m = m.resize((int(m.width * H / m.height), H))
    c = Image.new('RGB', (r.width + m.width + 10, H + 34), (20, 20, 20))
    c.paste(r, (0, 34)); c.paste(m, (r.width + 10, 34))
    d = ImageDraw.Draw(c)
    d.text((8, 10), 'REFERENCE: ' + os.path.basename(ref_path), fill=(255, 255, 255))
    d.text((r.width + 18, 10), 'BLENDER: ' + label, fill=(255, 255, 255))
    c.save(out_path)

def render_all(out, placeholders_fn, M, args):
    tag = args[args.index('--tag') + 1] if '--tag' in args else 'iter'
    views = args[args.index('--views') + 1].split(',') if '--views' in args else list(VIEWS)
    samples = int(args[args.index('--samples') + 1]) if '--samples' in args else 48
    placeholders_fn(M)
    co = setup_scene(samples=samples)
    rd = os.path.join(out, 'renders'); cd = os.path.join(out, 'composites')
    os.makedirs(rd, exist_ok=True); os.makedirs(cd, exist_ok=True)
    for v in views:
        ref, loc, tgt, f = VIEWS[v]
        aim(co, loc, tgt, f)
        co.data.type = 'PERSP'
        if ref is None:
            co.data.type = 'ORTHO'; co.data.ortho_scale = 4.6
        p = os.path.join(rd, f'{tag}-{v}.png')
        bpy.context.scene.render.filepath = p
        bpy.ops.render.render(write_still=True)
        if ref is None:
            print('RENDERED', p); continue
        import subprocess
        subprocess.run(['/usr/bin/python3', os.path.join(out, 'compose.py'), REF + ref, p,
                        os.path.join(cd, f'{tag}-{v}.png'), f'{tag} {v}'], check=False, env={'PATH': '/usr/bin:/bin'})
        print('RENDERED', p)
