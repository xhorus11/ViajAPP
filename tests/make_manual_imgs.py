import sys, os, glob
import fitz
from PIL import Image
shots, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
total = 0
for f in sorted(glob.glob(os.path.join(shots, '*.png'))):
    im = Image.open(f).convert('RGB')          # 800 x 1720 (2x)
    dst = os.path.join(out, os.path.basename(f)[:-4] + '.webp')
    im.save(dst, 'WEBP', quality=80, method=6); total += os.path.getsize(dst)
dl = os.path.join(shots, 'dl')
png = glob.glob(os.path.join(dl, '*.png'))[0]
im = Image.open(png).convert('RGB'); im.thumbnail((1080, 2000))
im.save(os.path.join(out, 'export-lista.webp'), 'WEBP', quality=82, method=6)
pdf = fitz.open(glob.glob(os.path.join(dl, '*.pdf'))[0])
for i, p in enumerate(pdf):
    pix = p.get_pixmap(dpi=110)
    Image.frombytes('RGB', (pix.width, pix.height), pix.samples).save(os.path.join(out, f'export-carta-{i + 1}.webp'), 'WEBP', quality=82, method=6)
print('pdf páginas', len(pdf), '| total KB', sum(os.path.getsize(x) for x in glob.glob(os.path.join(out, '*.webp'))) // 1024)
