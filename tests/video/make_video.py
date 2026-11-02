"""Genera el video tutorial de Viajapp (MP4 1080p con voz y subtítulos).

Uso:  python tests/video/make_video.py <carpeta de trabajo>
Requiere: pip install edge-tts imageio-ffmpeg; node con puppeteer-core (NODE_PATH) y Edge o Chrome (VIAJAPP_BROWSER).
Salida: manual/Video-Viajapp.mp4 y manual/Video-Viajapp.srt
"""
import asyncio, hashlib, json, os, re, shutil, subprocess, sys, wave

import edge_tts
import imageio_ffmpeg

sys.path.insert(0, os.path.dirname(__file__))
from guion import SLIDES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WORK = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tests', 'video', 'work'))
FF = imageio_ffmpeg.get_ffmpeg_exe()
VOICE, RATE = 'es-MX-DaliaNeural', '-3%'
SR, FPS, T = 24000, 25, 0.6            # muestreo del audio, cuadros por segundo, duración del fundido
GAP, PRE, POST = 0.35, 0.6, 0.7          # silencios entre frases, al inicio y al final de cada diapositiva
# Cómo se pronuncia (solo para la voz; el subtítulo queda como está escrito)
SAY = {'viajapp-trip.web.app': 'viajap trip, punto web, punto app', 'Viajapp': 'Viajap', 'Gemini': 'Yémini', 'WhatsApp': 'Guatsap'}


def ff(*args, cwd=None):
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True, cwd=cwd)


async def tts(text, out):
    for k, v in SAY.items():
        text = text.replace(k, v)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(out)


def voice(text):
    """Devuelve las muestras PCM de una frase (con caché por texto)."""
    h = hashlib.md5(f'{VOICE}|{RATE}|{json.dumps(SAY)}|{text}'.encode()).hexdigest()[:16]
    mp3, wav = os.path.join(WORK, 'tts', h + '.mp3'), os.path.join(WORK, 'tts', h + '.wav')
    if not os.path.exists(wav):
        for intento in range(3):
            try:
                asyncio.run(tts(text, mp3)); break
            except Exception:
                if intento == 2: raise
        ff('-i', mp3, '-ar', str(SR), '-ac', '1', '-sample_fmt', 's16', wav)
    with wave.open(wav) as w:
        return w.readframes(w.getnframes())


def chunks(s, maxc=95):
    """Parte una frase larga en trozos legibles (en comas o, si no hay, a mitad de palabras)."""
    if len(s) <= maxc:
        return [s]
    parts = re.split(r'(?<=[,;:])\s+', s)
    out = []
    for p in parts:
        if out and len(out[-1]) + 1 + len(p) <= maxc:
            out[-1] += ' ' + p
        else:
            out.append(p)
    res = []
    for p in out:
        while len(p) > maxc:
            words, cut = p.split(' '), ''
            half = len(p) / 2 if len(p) < maxc * 2 else maxc
            i = 0
            while i < len(words) and len(cut) + len(words[i]) < half:
                cut += ('' if not cut else ' ') + words[i]; i += 1
            res.append(cut); p = ' '.join(words[i:])
        res.append(p)
    return res


def ts(t, ass=False):
    h, m, s = int(t // 3600), int(t % 3600 // 60), t % 60
    return f'{h}:{m:02d}:{s:05.2f}' if ass else f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.', ',')


def main():
    os.makedirs(os.path.join(WORK, 'tts'), exist_ok=True)
    os.makedirs(os.path.join(WORK, 'fonts'), exist_ok=True)

    # 1) Voz y línea de tiempo
    pcm, cues, starts, durs, t = bytearray(), [], [], [], 0.0
    sil = lambda sec: b'\0\0' * int(round(sec * SR))
    for i, s in enumerate(SLIDES):
        starts.append(t)
        pre = 1.0 if i == 0 else PRE
        pcm += sil(pre); t += pre
        for j, frase in enumerate(s['say']):
            a = voice(frase); d = len(a) / 2 / SR
            # Subtítulo: cada trozo dura según su largo
            parts, at = chunks(frase), t
            tot = sum(len(p) for p in parts)
            for p in parts:
                dd = d * len(p) / tot
                cues.append([at, at + dd, p]); at += dd
            pcm += a; t += d
            if j < len(s['say']) - 1:
                pcm += sil(GAP); t += GAP
        pcm += sil(POST); t += POST
        durs.append(t - starts[-1])
        print(f'  {i:02d} {s["t"]:<30} {durs[-1]:5.1f} s')
    total = t
    # Los subtítulos quedan un poco más en pantalla si hay silencio después
    for k, c in enumerate(cues):
        nxt = cues[k + 1][0] if k + 1 < len(cues) else total
        c[1] = min(c[1] + 0.25, nxt - 0.02)
    with wave.open(os.path.join(WORK, 'voz.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(pcm))
    print(f'Duración total: {int(total // 60)}:{int(total % 60):02d}')

    # 2) Subtítulos (SRT para entregar, ASS para quemarlos con estilo)
    srt = '\n'.join(f'{n + 1}\n{ts(a)} --> {ts(b)}\n{x}\n' for n, (a, b, x) in enumerate(cues))
    with open(os.path.join(ROOT, 'manual', 'Video-Viajapp.srt'), 'w', encoding='utf-8') as f:
        f.write(srt)
    ass = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Segoe UI Semibold,46,&H00FFFFFF,&H00FFFFFF,&H2042270F,&H00000000,0,0,0,0,100,100,0,0,3,14,0,2,240,240,52,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + ''.join(f'Dialogue: 0,{ts(a, 1)},{ts(b, 1)},Sub,,0,0,0,,{x}\n' for a, b, x in cues)
    with open(os.path.join(WORK, 'subs.ass'), 'w', encoding='utf-8') as f:
        f.write(ass)
    for fnt in ('seguisb.ttf', 'segoeuib.ttf'):
        shutil.copy(os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts', fnt), os.path.join(WORK, 'fonts', fnt))

    # 3) Diapositivas
    with open(os.path.join(WORK, 'slides.json'), 'w', encoding='utf-8') as f:
        json.dump(SLIDES, f, ensure_ascii=False)
    subprocess.run(['node', os.path.join(ROOT, 'tests', 'video', 'render.js'), os.path.join(WORK, 'slides.json'),
                    os.path.join(WORK, 'png'), ROOT], check=True)

    # 4) Video: zoom lento en cada diapositiva + fundido entre ellas + subtítulos
    n, inputs, fg = len(SLIDES), [], []
    for i in range(n):
        inputs += ['-i', os.path.join('png', f's{i:02d}.png')]
        frames = round((durs[i] + (T if i < n - 1 else 0)) * FPS)
        z = f"1+0.02*on/{frames}" if i % 2 == 0 else f"1.02-0.02*on/{frames}"
        fg.append(f"[{i}:v]zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps={FPS},setsar=1[v{i}]")
    last = 'v0'
    for i in range(1, n):
        fg.append(f'[{last}][v{i}]xfade=transition=fade:duration={T}:offset={starts[i]:.3f}[x{i}]')
        last = f'x{i}'
    fg.append(f"[{last}]fade=t=in:st=0:d=0.6,fade=t=out:st={total - 0.8:.3f}:d=0.8,ass=subs.ass:fontsdir=fonts,format=yuv420p[out]")
    fg.append(f"[{n}:a]afade=t=out:st={total - 0.8:.3f}:d=0.8,aresample=48000[aout]")
    with open(os.path.join(WORK, 'graph.txt'), 'w', encoding='utf-8') as f:
        f.write(';\n'.join(fg))
    out = os.path.join(ROOT, 'manual', 'Video-Viajapp.mp4')
    ff(*inputs, '-i', 'voz.wav', '-filter_complex_script', 'graph.txt', '-map', '[out]', '-map', '[aout]',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-tune', 'stillimage', '-r', str(FPS), '-c:a', 'aac', '-b:a', '128k',
       '-metadata', 'title=Viajapp · Manual de uso', '-metadata:s:a:0', 'language=spa',
       '-movflags', '+faststart', '-t', f'{total:.3f}', out, cwd=WORK)
    print('Listo:', out, f'{os.path.getsize(out) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
