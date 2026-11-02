// Dibuja cada diapositiva del video (1920×1080 a 2x) como PNG.
// Uso: node render.js <slides.json> <carpeta de salida> <raíz del proyecto>
const fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');
const [, , jsonPath, outDir, root] = process.argv;
const BROWSER = process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const slides = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const url = p => 'file:///' + path.resolve(root, p).replace(/\\/g, '/');

const GRAD = {
  sky: ['#7dd3fc', '#0ea5e9'], teal: ['#5eead4', '#0d9488'], peach: ['#fdba74', '#f97316'],
  indigo: ['#a5b4fc', '#4f46e5'], lilac: ['#d8b4fe', '#7c3aed'], rose: ['#fda4af', '#e11d48']
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden}
body{font-family:Inter,sans-serif;color:#0f2742;background:linear-gradient(160deg,#f7fbff 0%,#e6f2fc 100%);position:relative}
.blob{position:absolute;border-radius:50%;opacity:.16}
.top{position:absolute;left:110px;top:64px;display:flex;align-items:center;gap:18px;font-weight:600;color:#5d7894;font-size:24px}
.top img{width:64px;height:64px}
.left{position:absolute;left:110px;top:200px;width:940px}
.kick{display:inline-block;padding:12px 26px;border-radius:999px;color:#fff;font-weight:700;font-size:24px;letter-spacing:.12em;text-transform:uppercase}
h1{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:84px;line-height:1.04;letter-spacing:-.02em;margin:30px 0 44px}
ul{list-style:none}
li{display:flex;align-items:center;gap:22px;font-size:36px;font-weight:500;margin-bottom:26px;color:#1d3a5a}
li i{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center}
li i svg{width:26px;height:26px}
.prog{position:absolute;left:110px;top:842px;display:flex;gap:10px}
.prog b{width:34px;height:8px;border-radius:9px;background:#cfe0f0}
.prog b.on{width:64px}
.phone{position:absolute;right:190px;top:52px;width:392px;height:820px;border-radius:58px;background:#0f2742;padding:13px;
  box-shadow:0 40px 80px -30px rgba(15,39,66,.55)}
.phone img{width:100%;height:100%;border-radius:46px;object-fit:cover;object-position:top;display:block}
.glow{position:absolute;right:120px;top:120px;width:540px;height:700px;border-radius:50%;opacity:.35;filter:blur(70px)}
.paper{position:absolute;right:150px;top:56px;width:560px;height:792px;background:#fff;border-radius:10px;overflow:hidden;
  box-shadow:0 40px 80px -30px rgba(15,39,66,.5);transform:rotate(1.5deg)}
.paper img{width:100%;display:block}
.cover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-bottom:150px}
.cover .logo{width:300px;height:300px;border-radius:50%;background:#fff;box-shadow:0 30px 70px -30px rgba(15,39,66,.5)}
.cover h1{font-size:120px;margin:34px 0 30px}
.chips{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}
.chips span{padding:14px 30px;border-radius:999px;background:#fff;font-size:32px;font-weight:600;color:#1d3a5a;box-shadow:0 10px 30px -18px rgba(15,39,66,.5)}
.dog{position:absolute;right:120px;top:80px;width:320px}
`;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function html(s, i) {
  const [a, b] = GRAD[s.c] || GRAD.sky, g = `linear-gradient(135deg,${a},${b})`;
  const blobs = `<div class="blob" style="width:900px;height:900px;left:-320px;top:-420px;background:${b}"></div>
    <div class="blob" style="width:700px;height:700px;right:-260px;bottom:-380px;background:${a}"></div>`;
  let body;
  if (s.cover) {
    body = `<div class="cover"><img class="logo" src="${url('icons/logo-badge.png')}">
      <h1>${esc(s.t)}</h1><div class="chips">${s.pts.map(p => `<span>${esc(p)}</span>`).join('')}</div></div>
      <img class="dog" src="${url('icons/perro-guino.webp')}">`;
  } else {
    const shot = /^export/.test(s.img)
      ? `<div class="paper"><img src="${url('manual/img/' + s.img + '.webp')}"></div>`
      : `<div class="glow" style="background:${b}"></div><div class="phone"><img src="${url('manual/img/' + s.img + '.webp')}"></div>`;
    const total = slides.filter(x => !x.cover).length, n = slides.slice(0, i + 1).filter(x => !x.cover).length;
    // Barra de avance: un segmento por cada 4 diapositivas
    const segs = Math.ceil(total / 4), on = Math.ceil(n / 4);
    body = `<div class="top"><img src="${url('icons/logo-badge.png')}">Manual de uso · Viajapp</div>
      <div class="left"><span class="kick" style="background:${g}">${esc(s.k)}</span><h1>${esc(s.t)}</h1>
        <ul>${s.pts.map(p => `<li><i style="background:${g}">${CHECK}</i>${esc(p)}</li>`).join('')}</ul></div>
      <div class="prog">${Array.from({ length: segs }, (_, k) => `<b class="${k < on ? 'on' : ''}" style="${k < on ? 'background:' + b : ''}"></b>`).join('')}</div>
      ${shot}`;
  }
  return `<!doctype html><html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
    <style>${CSS}</style></head><body>${blobs}${body}</body></html>`;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < slides.length; i++) {
    const tmp = path.join(outDir, 'slide.html');
    fs.writeFileSync(tmp, html(slides[i], i));
    await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))));
    await page.screenshot({ path: path.join(outDir, `s${String(i).padStart(2, '0')}.png`) });
    process.stdout.write('.');
  }
  await browser.close();
  console.log(' ' + slides.length + ' diapositivas');
})();
