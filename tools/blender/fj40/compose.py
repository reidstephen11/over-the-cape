"""Side-by-side composite: reference photo left, Blender render right. Uses system Python + Pillow."""
import sys, os
from PIL import Image, ImageDraw
ref_path, render_path, out_path, label = sys.argv[1:5]
H = 700
r = Image.open(ref_path).convert('RGB'); r = r.resize((int(r.width * H / r.height), H))
m = Image.open(render_path).convert('RGB'); m = m.resize((int(m.width * H / m.height), H))
c = Image.new('RGB', (r.width + m.width + 10, H + 34), (20, 20, 20))
c.paste(r, (0, 34)); c.paste(m, (r.width + 10, 34))
d = ImageDraw.Draw(c)
d.text((8, 10), 'REFERENCE: ' + os.path.basename(ref_path), fill=(255, 255, 255))
d.text((r.width + 18, 10), 'BLENDER: ' + label, fill=(255, 255, 255))
c.save(out_path)
