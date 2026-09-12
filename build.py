"""Build a single-file GitHub Pages app. Python standard library only."""
from pathlib import Path
import base64
import zipfile

ROOT = Path(__file__).resolve().parent
def asset(name):
    return 'data:image/webp;base64,' + base64.b64encode((ROOT / 'assets' / name).read_bytes()).decode()

css = (ROOT / 'src/styles.css').read_text()
css += '\n#life-atlas{--heart-art:url("' + asset('heart.webp') + '");--atlas-art:url("' + asset('domains.webp') + '")}\n'
document = (ROOT / 'src/shell.html').read_text()
for key, value in {'STYLES': css, 'ENGINE': (ROOT / 'src/engine.js').read_text(), 'APP': (ROOT / 'src/app.js').read_text()}.items():
    document = document.replace('/*__' + key + '__*/', value)
(ROOT / 'index.html').write_text(document)
with zipfile.ZipFile(ROOT.parent / 'life-atlas-github.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in ['index.html', 'README.md', 'build.py', 'src/shell.html', 'src/styles.css', 'src/engine.js', 'src/app.js', 'assets/heart.webp', 'assets/domains.webp', 'tests/engine.test.cjs', 'tests/app-smoke.test.cjs']:
        path = ROOT / name
        if path.exists():
            archive.write(path, name)
print('Built index.html:', (ROOT / 'index.html').stat().st_size, 'bytes')
print('Packaged:', ROOT.parent / 'life-atlas-github.zip')
