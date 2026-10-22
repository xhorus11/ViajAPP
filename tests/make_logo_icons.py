"""Genera los íconos de Viajapp a partir de 'logo Viajapp.png'."""
import sys, os
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
logo = Image.open(src).convert('RGBA')

# 1) Marca: león + globo, sin el texto, con desvanecido inferior
mark = logo.crop((150, 40, 1110, 885))            # 960 x 845
w, h = mark.size
alpha = mark.getchannel('A')
fade = Image.new('L', (w, h), 255)
fd = ImageDraw.Draw(fade)
F0 = h - 95                                        # inicio del desvanecido
for y in range(F0, h):
    v = int(255 * (1 - (y - F0) / (h - F0)) ** 1.6)
    fd.line([(0, y), (w, y)], fill=v)
mark.putalpha(Image.composite(alpha, Image.new('L', (w, h), 0), fade))
sq = Image.new('RGBA', (max(w, h), max(w, h)), (0, 0, 0, 0))
sq.alpha_composite(mark, ((sq.width - w) // 2, (sq.height - h) // 2))
sq.resize((320, 320), Image.LANCZOS).save(os.path.join(out, 'logo-mark-256.png'), optimize=True)

# 2) Logo completo para exportaciones
logo.resize((600, 600), Image.LANCZOS).save(os.path.join(out, 'logo-full-600.png'), optimize=True)

def background(size, rounded):
    """Fondo violeta oscuro con brillo rosado/cian (colores de la app)."""
    bg = Image.new('RGBA', (size, size), (20, 12, 51, 255))
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse([-size * .25, -size * .3, size * .75, size * .6], fill=(139, 92, 246, 150))
    g.ellipse([size * .35, size * .45, size * 1.3, size * 1.35], fill=(255, 61, 139, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(size * .18))
    bg.alpha_composite(glow)
    if rounded:
        m = Image.new('L', (size, size), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * .22), fill=255)
        bg.putalpha(m)
    return bg

def icon(size, scale, rounded, name):
    bg = background(size, rounded)
    s = int(size * scale)
    mk = sq.resize((s, s), Image.LANCZOS)
    bg.alpha_composite(mk, ((size - s) // 2, int((size - s) * .55)))
    bg.save(os.path.join(out, name), optimize=True)

icon(192, .9, True, 'icon-192.png')
icon(512, .9, True, 'icon-512.png')
icon(512, .72, False, 'icon-maskable-512.png')
icon(180, .86, False, 'apple-touch-icon.png')
icon(64, .95, True, 'favicon-64.png')
print('ok')
