from pathlib import Path
import re
root=Path(__file__).resolve().parent
source=(root/'dist/index.html').read_text()
script=next((root/'dist/assets').glob('*.js')).read_text().replace('</script','<\\/script')
pattern=r'<script type="module" crossorigin src="[^"]+"></script>'
assert len(re.findall(pattern,source))==1
(root/'Troopy-review.html').write_text(re.sub(pattern,lambda match:'<script type="module">'+script+'</script>',source))
