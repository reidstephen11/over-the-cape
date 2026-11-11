"""Reopen fj40_body.glb in an empty scene and report what was actually written."""
import bpy, sys, os
from mathutils import Vector
path = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)
tot = 0; lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for o in sorted(bpy.data.objects, key=lambda o: o.name):
    if o.type != 'MESH': continue
    o.data.calc_loop_triangles(); t = len(o.data.loop_triangles); tot += t
    for v in o.data.vertices:
        w = o.matrix_world @ v.co
        lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    print(f'  {o.name:24s} tris={t:6d} mats={[m.name for m in o.data.materials]}')
print('TOTAL TRIS', tot)
print('BBOX (Blender Z-up after import) min', tuple(round(c, 3) for c in lo), 'max', tuple(round(c, 3) for c in hi))
print('SIZE x(width)=%.3f y(length)=%.3f z(height)=%.3f' % tuple(hi - lo))
print('MATERIALS', [m.name for m in bpy.data.materials]); print('IMAGES/TEXTURES', [i.name for i in bpy.data.images])
