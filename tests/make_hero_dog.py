"""Perrito de la tarjeta del viaje (Inicio): recorta al personaje del banner sin el fondo.
Uso: python tests/make_hero_dog.py "Viajapp_ perro viajero sobre mapa mundial.png" icons
Necesita: pip install "rembg[cpu]" (modelo isnet-general-use, se descarga la 1.ª vez)."""
import sys, os
from PIL import Image
from rembg import remove, new_session

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
W, H = im.size
crop = im.crop((int(W * .018), int(H * .04), int(W * .46), H))   # perrito (el nombre queda fuera)
flat = Image.new('RGBA', crop.size, (255, 255, 255, 255)); flat.alpha_composite(crop)
dog = remove(flat.convert('RGB'), session=new_session('isnet-general-use'))
dog = dog.crop(dog.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
dog = dog.resize((440, round(dog.height * 440 / dog.width)), Image.LANCZOS)
dog.save(os.path.join(out, 'perro-guino.webp'), quality=88, method=6)
print('ok', dog.size)
