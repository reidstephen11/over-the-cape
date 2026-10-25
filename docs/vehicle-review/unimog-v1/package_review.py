from pathlib import Path
import base64
import hashlib
import html
import json
import subprocess
import zipfile
from PIL import Image, ImageOps, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
render = json.loads((root / 'inspection/render-log.json').read_text())
assert len(render['views']) == 24 and not render['browserErrors']
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 19)
comparison = Image.new('RGB', (1200, 1380), '#e8eae7')
draw = ImageDraw.Draw(comparison)
for x, label in [(0, 'ORIGINAL GAME MODEL'), (600, 'PROPOSED Unimog')]:
    draw.text((x + 24, 18), label, fill='#243e3d', font=font)
for row, view in enumerate(['hero', 'detail', 'rear']):
    for col, model in enumerate(['original', 'proposed']):
        picture = ImageOps.contain(Image.open(root / 'validation' / f'{model}-{view}.png').convert('RGB'), (600, 430))
        comparison.paste(picture, (col * 600, 50 + row * 440))
comparison.save(root / 'Unimog-comparison.png')

w, h, label = 400, 287, 28
sheet = Image.new('RGB', (w * 4, 6 * (h + label)), '#eef0ed')
draw = ImageDraw.Draw(sheet)
cards = []
for i, view in enumerate(render['views']):
    path = root / 'inspection' / f'{view}.png'
    picture = ImageOps.contain(Image.open(path).convert('RGB'), (w, h))
    x, y = (i % 4) * w, (i // 4) * (h + label)
    sheet.paste(picture, (x, y))
    title = view.replace('-', ' ').title()
    draw.text((x + 12, y + h + 6), title, fill='#233b3a')
    data = base64.b64encode(path.read_bytes()).decode()
    cards.append(f'<figure><img src="data:image/png;base64,{data}" alt="{html.escape(title)}"><figcaption>{html.escape(title)}</figcaption></figure>')
sheet.save(root / 'Unimog-inspection-sheet.png')
(root / 'Inspection-gallery.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Unimog inspection</title><style>body{margin:24px;background:#eef0ed;color:#233b3a;font:16px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:18px}figure{margin:0}img{width:100%}figcaption{padding:8px}a{color:inherit}</style><h1>Unimog review</h1><p>24 inspection views · Unapproved model study · <a href="Unimog-review.html">Interactive comparison</a></p><main>' + ''.join(cards) + '</main></html>')

repositories = []
for checkout in [Path('/workspace/4wd-simulator'), root.parent / 'over-the-cape-source']:
    revision = subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip()
    status = subprocess.check_output(['git', '-C', str(checkout), 'status', '--porcelain=v1', '--untracked-files=all'], text=True)
    assert not status, f'Checkout changed: {checkout}'
    repositories.append({'path': str(checkout), 'commit': revision, 'status': 'clean'})
hilux = root.parent / 'hilux-v3'
for line in (hilux / 'SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    assert hashlib.sha256((hilux / name).read_bytes()).hexdigest() == digest, f'Hilux artifact changed: {name}'
patrol = root.parent / 'patrol-v1'
for line in (patrol / 'SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    assert hashlib.sha256((patrol / name).read_bytes()).hexdigest() == digest, f'Patrol artifact changed: {name}'
lc79 = root.parent / 'lc79-v1'
for line in (lc79 / 'SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    assert hashlib.sha256((lc79 / name).read_bytes()).hexdigest() == digest, f'LC79 artifact changed: {name}'
perentie = root.parent / 'perentie-v1'
for line in (perentie / 'SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    assert hashlib.sha256((perentie / name).read_bytes()).hexdigest() == digest, f'Perentie artifact changed: {name}'
report = json.loads((root / 'validation-v1.json').read_text())
assert not report['browserErrors'] and report['sourceTriangles'] == report['exportTriangles']
audit = json.loads((root / 'geometry-audit.json').read_text())
for mesh in [audit['body'], audit['wheel']]:
    assert all(mesh[k] == 0 for k in ['nonfinite','zeroNormals','degenerateTriangles','contraryNormals'])
assert json.loads((root / 'build-verification.json').read_text())['independentBuildBundleIdentical']
assert not json.loads((root / 'all-solid-clearance.json').read_text())['hits']
assert not json.loads((root / 'mesh-clearance-full.json').read_text())['intersections']
assert not json.loads((root / 'spare-clearance.json').read_text())['intersections']
assert (root / 'unimog-proposal-v1.glb').read_bytes() == (root / 'validation/export-from-hidden-posed.glb').read_bytes()
provenance = {'source': 'https://github.com/reidstephen11/over-the-cape', 'checkouts': repositories, 'hiluxReview': 'all original manifest checksums preserved', 'patrolReview': 'all original manifest checksums preserved', 'lc79Review': 'all original manifest checksums preserved', 'perentieReview': 'all original manifest checksums preserved', 'cleanInstallAndBuild': 'passed in a separate copy', 'gameIntegration': 'none; pending user approval', 'modelSHA256': hashlib.sha256((root / 'unimog-proposal-v1.glb').read_bytes()).hexdigest(), 'viewerSHA256': hashlib.sha256((root / 'Unimog-review.html').read_bytes()).hexdigest()}
(root / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')

names = ['README.md', 'VERIFICATION.md', 'provenance.json', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'review.ts', 'audit.ts', 'all-solid-check.ts', 'mesh-clearance.ts', 'spare-clearance.ts', 'baseline-check.ts', 'inspect.mjs', 'verify-v1.mjs', 'Unimog-review.html', 'Inspection-gallery.html', 'Unimog-comparison.png', 'Unimog-inspection-sheet.png', 'unimog-proposal-v1.glb', 'geometry-audit.json', 'all-solid-clearance.json', 'mesh-clearance-full.json', 'spare-clearance.json', 'validation-v1.json', 'build-verification.json', 'package_review.py']
files = [root / name for name in names]
for folder in ['src', 'inspection']:
    files.extend(sorted(path for path in (root / folder).rglob('*') if path.is_file()))
files.extend(sorted((root / 'validation').glob('*.png')))
assert all(path.is_file() for path in files)
manifest = root / 'SHA256SUMS.txt'
manifest.write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.relative_to(root)}\n' for path in files))
files.append(manifest)
archive = root.parent / 'Unimog-review-v1.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for path in files:
        package.write(path, Path('Unimog-review-v1') / path.relative_to(root))
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    for line in manifest.read_text().splitlines():
        digest, name = line.split('  ', 1)
        assert hashlib.sha256(package.read(f'Unimog-review-v1/{name}')).hexdigest() == digest
print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'files': len(files), 'zipAndChecksums': 'passed', 'gamesAndPriorStudies': 'unchanged'}))
