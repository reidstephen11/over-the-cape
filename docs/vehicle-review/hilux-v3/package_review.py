from pathlib import Path
import base64
import hashlib
import html
import json
import subprocess
import zipfile
from PIL import Image, ImageOps, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
views = json.loads((root / 'inspection/render-log.json').read_text())['views']
assert len(views) == 18
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 19)
sheet = Image.new('RGB', (1200, 940), '#e8eae7')
draw = ImageDraw.Draw(sheet)
for x, label in [(0, 'ORIGINAL GAME MODEL'), (600, 'PROPOSED HILUX — REVISION 03')]:
    draw.text((x + 24, 18), label, fill='#243e3d', font=font)
for row, view in enumerate(['hero', 'detail']):
    for col, model in enumerate(['original', 'proposed']):
        picture = ImageOps.contain(Image.open(root / 'validation' / f'{model}-{view}.png').convert('RGB'), (600, 430))
        sheet.paste(picture, (col * 600, 50 + row * 440))
sheet.save(root / 'Hilux-comparison.png')

w, h, label = 480, 344, 28
sheet = Image.new('RGB', (w * 3, 6 * (h + label)), '#eef0ed')
draw = ImageDraw.Draw(sheet)
cards = []
for i, view in enumerate(views):
    path = root / 'inspection' / f'{view}.png'
    picture = ImageOps.contain(Image.open(path).convert('RGB'), (w, h))
    x, y = (i % 3) * w, (i // 3) * (h + label)
    sheet.paste(picture, (x, y))
    title = view.replace('-', ' ').title()
    draw.text((x + 12, y + h + 6), title, fill='#233b3a')
    data = base64.b64encode(path.read_bytes()).decode()
    cards.append(f'<figure><img src="data:image/png;base64,{data}" alt="{html.escape(title)}"><figcaption>{html.escape(title)}</figcaption></figure>')
sheet.save(root / 'Hilux-inspection-sheet.png')
(root / 'Inspection-gallery.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hilux revision 03 inspection</title><style>body{margin:24px;background:#eef0ed;color:#233b3a;font:16px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:18px}figure{margin:0}img{width:100%}figcaption{padding:8px}a{color:inherit}</style><h1>Hilux revision 03</h1><p>18 inspection views · Unapproved model study · <a href="Hilux-review.html">Interactive comparison</a></p><main>' + ''.join(cards) + '</main></html>')

repositories = []
for checkout in [Path('/workspace/4wd-simulator'), root.parent / 'over-the-cape-source']:
    revision = subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip()
    status = subprocess.check_output(['git', '-C', str(checkout), 'status', '--porcelain=v1', '--untracked-files=all'], text=True)
    assert not status, f'Checkout changed: {checkout}'
    repositories.append({'path': str(checkout), 'commit': revision, 'status': 'clean; tracked and untracked files unchanged'})
report = json.loads((root / 'validation-v3.json').read_text())
assert report['browserErrors'] == []
assert report['sourceTriangles'] == report['exportTriangles']
assert not json.loads((root / 'all-solid-clearance.json').read_text())['hits']
provenance = {'source': 'https://github.com/reidstephen11/over-the-cape', 'checkouts': repositories, 'recoveredRevision2BodyTriangles': 63768, 'currentBodyTriangles': json.loads((root / 'geometry-audit.json').read_text())['triangles'], 'cleanInstallAndBuild': 'passed in a separate copy; production bundle hash matched', 'gameIntegration': 'none; pending user approval', 'referencePhotoComparison': 'incomplete; download blocked by network policy'}
(root / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')

names = ['README.md', 'VERIFICATION.md', 'provenance.json', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'review.ts', 'audit.ts', 'all-solid-check.ts', 'baseline-check.ts', 'inspect.mjs', 'verify-v3.mjs', 'package_review.py', 'Hilux-review.html', 'Inspection-gallery.html', 'Hilux-comparison.png', 'Hilux-inspection-sheet.png', 'hilux-proposal-v3.glb', 'geometry-audit.json', 'all-solid-clearance.json', 'clearance-before.json', 'validation-v3.json']
files = [root / name for name in names]
for folder in ['src', 'inspection']:
    files.extend(sorted(path for path in (root / folder).rglob('*') if path.is_file()))
files.extend(sorted((root / 'validation').glob('*.png')))
assert all(path.is_file() for path in files)
manifest = root / 'SHA256SUMS.txt'
manifest.write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.relative_to(root)}\n' for path in files))
files.append(manifest)
archive = root.parent / 'Hilux-review-v3.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for path in files:
        package.write(path, Path('Hilux-review-v3') / path.relative_to(root))
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    for line in manifest.read_text().splitlines():
        digest, name = line.split('  ', 1)
        assert hashlib.sha256(package.read(f'Hilux-review-v3/{name}')).hexdigest() == digest
print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'files': len(files), 'zipAndChecksums': 'passed'}))
