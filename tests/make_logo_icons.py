"""Genera los íconos de Viajapp a partir del logo (actual: 'logo Viajapp v2.png', perrito viajero).
Uso: python tests/make_logo_icons.py "logo Viajapp v2.png" icons
El logo completo (perrito, globo y el nombre "Viajapp") va dentro de una insignia circular blanca,
como los íconos redondos del celular. Nada se recorta ni se desvanece."""
import sys, os, math
from PIL import Image, ImageDraw, ImageFilter, ImageChops

src, out = sys.argv[1], sys.argv[2]
logo = Image.open(src).convert('RGBA')

def remove_white_bg(im, thr=232):
    """Quita el blanco que toca los bordes (el blanco interior —letras, nubes, avión— se conserva)."""
    rgb = im.convert('RGB')
    r, g, b = rgb.split()
    wmask = ImageChops.darker(ImageChops.darker(r.point(lambda v: 255 if v > thr else 0), g.point(lambda v: 255 if v > thr else 0)), b.point(lambda v: 255 if v > thr else 0))
    flood = wmask.copy()
    W, H = flood.size
    for xy in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (W // 2, 0), (W // 2, H - 1), (0, H // 2), (W - 1, H // 2)]:
        if flood.getpixel(xy) == 255:
            ImageDraw.floodfill(flood, xy, 128)
    bg = flood.point(lambda v: 255 if v == 128 else 0)
    bg = bg.filter(ImageFilter.MaxFilter(3))
    alpha = ImageChops.invert(bg).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(ImageChops.darker(im.getchannel('A'), alpha))
    return im

if logo.getchannel('A').getextrema() == (255, 255):
    logo = remove_white_bg(logo)
logo = logo.crop(logo.getchannel('A').getbbox())
W0, H0 = logo.size

# Radio mínimo (desde el centro del logo) que contiene todo el dibujo
a = logo.getchannel('A').resize((W0 // 4, H0 // 4))
cx, cy = W0 / 2, H0 / 2
R = max(math.hypot(x * 4 - cx, y * 4 - cy) for y in range(a.height) for x in range(a.width) if a.getpixel((x, y)) > 60) * 1.04

# Insignia: círculo blanco de diámetro 2R con el logo centrado (lienzo cuadrado transparente)
D = int(2 * R)
badge = Image.new('RGBA', (D, D), (0, 0, 0, 0))
m = Image.new('L', (D * 4, D * 4), 0)
ImageDraw.Draw(m).ellipse([0, 0, D * 4 - 1, D * 4 - 1], fill=255)
badge.paste((255, 255, 255, 255), (0, 0), m.resize((D, D), Image.LANCZOS))
badge.alpha_composite(logo, (int(R - cx), int(R - cy)))

def save(im, size, name):
    im.resize((size, size), Image.LANCZOS).save(os.path.join(out, name), optimize=True)

save(badge, 320, 'logo-badge.png')          # Inicio, PNG de la lista y PDF
save(badge, 512, 'icon-512.png')
save(badge, 192, 'icon-192.png')
save(badge, 64, 'favicon-64.png')

def full_bleed(size, circle):
    """Fondo blanco completo con la insignia dentro de la zona segura (Android recorta en círculo)."""
    bg = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    s = int(size * circle)
    bg.alpha_composite(badge.resize((s, s), Image.LANCZOS), ((size - s) // 2, (size - s) // 2))
    return bg

full_bleed(512, .80).save(os.path.join(out, 'icon-maskable-512.png'), optimize=True)
full_bleed(180, .94).convert('RGB').save(os.path.join(out, 'apple-touch-icon.png'), optimize=True)

# Logo completo con transparencia (por si se necesita en otro lugar)
full = Image.new('RGBA', (max(W0, H0),) * 2, (0, 0, 0, 0))
full.alpha_composite(logo, ((full.width - W0) // 2, (full.height - H0) // 2))
full.resize((600, 600), Image.LANCZOS).save(os.path.join(out, 'logo-full-600.png'), optimize=True)
print('ok', D, W0, H0)
