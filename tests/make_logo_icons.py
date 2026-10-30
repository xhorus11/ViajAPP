"""Genera los íconos de Viajapp a partir del logo (actual: 'logo Viajapp v2.png', perrito viajero).
Uso: python tests/make_logo_icons.py "logo Viajapp v2.png" icons
Si el logo viene con fondo blanco (sin transparencia), se quita el blanco que toca los bordes
(el blanco interior —letras, nubes, avión— se conserva porque está rodeado de contorno)."""
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops

src, out = sys.argv[1], sys.argv[2]
logo = Image.open(src).convert('RGBA')

def remove_white_bg(im, thr=232):
    rgb = im.convert('RGB')
    r, g, b = rgb.split()
    # casi blanco = los 3 canales sobre el umbral
    wmask = ImageChops.darker(ImageChops.darker(r.point(lambda v: 255 if v > thr else 0), g.point(lambda v: 255 if v > thr else 0)), b.point(lambda v: 255 if v > thr else 0))
    flood = wmask.copy()
    W, H = flood.size
    for xy in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (W // 2, 0), (W // 2, H - 1), (0, H // 2), (W - 1, H // 2)]:
        if flood.getpixel(xy) == 255:
            ImageDraw.floodfill(flood, xy, 128)
    bg = flood.point(lambda v: 255 if v == 128 else 0)          # fondo blanco conectado al borde
    bg = bg.filter(ImageFilter.MaxFilter(3))                     # come el halo blanco del borde
    alpha = ImageChops.invert(bg).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(ImageChops.darker(im.getchannel('A'), alpha))
    return im

if logo.getchannel('A').getextrema() == (255, 255):
    logo = remove_white_bg(logo)
logo = logo.crop(logo.getchannel('A').getbbox())                 # recorta el espacio vacío
logo.save(os.path.join(out, 'logo-full-transparente.png'), optimize=True) if '--debug' in sys.argv else None

# 1) Marca: perrito + globo, sin el texto, con desvanecido inferior (Inicio, PNG y PDF)
W0, H0 = logo.size
mark = logo.crop((0, 0, W0, int(H0 * .66)))                     # el texto empieza ~ al 68 % de la altura
w, h = mark.size
alpha = mark.getchannel('A')
fade = Image.new('L', (w, h), 255)
fd = ImageDraw.Draw(fade)
F0 = h - int(h * .14)                                            # inicio del desvanecido
for y in range(F0, h):
    v = int(255 * (1 - (y - F0) / (h - F0)) ** 1.6)
    fd.line([(0, y), (w, y)], fill=v)
mark.putalpha(Image.composite(alpha, Image.new('L', (w, h), 0), fade))
sq = Image.new('RGBA', (max(w, h), max(w, h)), (0, 0, 0, 0))
sq.alpha_composite(mark, ((sq.width - w) // 2, (sq.height - h) // 2))
sq.resize((320, 320), Image.LANCZOS).save(os.path.join(out, 'logo-mark-256.png'), optimize=True)

# 2) Logo completo (con el nombre) para exportaciones
full = Image.new('RGBA', (max(logo.size),) * 2, (0, 0, 0, 0))
full.alpha_composite(logo, ((full.width - W0) // 2, (full.height - H0) // 2))
full.resize((600, 600), Image.LANCZOS).save(os.path.join(out, 'logo-full-600.png'), optimize=True)

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
