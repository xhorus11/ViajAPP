/* Ayuda simple: botón ? en cada pantalla, guía "Tu próximo paso" en Inicio, tamaño de letra.
   Uso: node tests/test-help.js [URL] [carpeta capturas]  */
const puppeteer = require('puppeteer-core');
const path = require('path');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const OUT = process.argv[3] || path.join(__dirname, 'out-help');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await p.goto(URL, { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' }); await sleep(1500);
  const guideText = () => p.evaluate(() => { const g = document.querySelector('.guide'); return g ? g.textContent.replace(/\s+/g, ' ').trim() : ''; });

  let g = await guideText();
  ok(/1 de 6/.test(g) && /nombre y fechas/.test(g), `Celular nuevo: guía en el paso 1 (${g.slice(0, 60)}…)`);
  ok(!(await p.$('.share-cta')), 'Con la guía visible no se repite el botón "Compartir con mi grupo"');
  ok(!!(await p.$('.guide .g-join[data-act="sync"]')), 'Quien fue invitado ve "¿Te invitaron a un viaje? Únete aquí"');
  await shot('guia-paso1');

  // Paso 1 → hoja del viaje
  await p.click('.guide .btn.primary'); await sleep(700);
  ok(!!(await p.$('#tpName')), 'El botón del paso abre la hoja del viaje');
  await p.evaluate(() => { document.getElementById('tpName').value = 'Cabaña en Pucón'; });
  await p.click('[data-act="saveTrip"]'); await sleep(900);
  g = await guideText();
  ok(/2 de 6/.test(g) && /quiénes van/.test(g), 'Al guardar el nombre avanza solo al paso 2');
  await p.evaluate(() => { Store.state.trip.people = ['Ana', 'Pedro']; Store.state.shop.sel['frutas|Manzana|'] = { c: 'frutas', i: 'Manzana', v: '', q: 1, done: false }; Store.save(); location.hash = '#agenda'; });
  await sleep(500); await p.evaluate(() => { location.hash = '#home'; }); await sleep(800);
  g = await guideText();
  ok(/3 de 6/.test(g) && /Invita/.test(g), 'Salta lo ya hecho: paso 3 invitar');

  // Ocultar y volver a mostrar desde la ayuda
  await p.click('[data-act="guideHide"]'); await sleep(700);
  ok(!(await p.$('.guide')) && !!(await p.$('.share-cta')), 'Ocultar la guía (vuelve el botón de compartir)');
  await p.reload({ waitUntil: 'load' }); await sleep(1300);
  ok(!(await p.$('.guide')), 'La guía oculta sigue oculta al volver a abrir');
  await p.click('.help-btn[data-s="home"]'); await sleep(700);
  ok(await p.$$eval('.help-steps li', l => l.length) === 3, 'Ayuda de Inicio: 3 pasos');
  ok(!!(await p.$('[data-act="guideShow"]')), 'La ayuda de Inicio ofrece "Mostrar otra vez la guía"');
  await shot('ayuda-inicio');
  await p.click('[data-act="guideShow"]'); await sleep(900);
  ok(!!(await p.$('.guide')), 'La guía vuelve a aparecer');

  // Botón ? en cada pantalla
  for (const [tab, word] of [['shop', 'Súper'], ['recipes', 'Recetas'], ['money', 'Dinero'], ['agenda', 'Agenda']]) {
    await p.evaluate(t => { location.hash = '#' + t; }, tab); await sleep(900);
    await p.click(`.help-btn[data-s="${tab}"]`); await sleep(700);
    const t = await p.$eval('.sheet-title h2', e => e.textContent);
    const n = await p.$$eval('.help-steps li', l => l.length);
    const href = await p.$eval('.sheet .help-link', e => e.getAttribute('href'));
    ok(t.includes(word) && n === 3 && /manual\/#/.test(href), `? en ${word}: "${t}" (${href})`);
    if (tab === 'money') await shot('ayuda-dinero');
    await p.click('[data-act="close"]'); await sleep(500);
  }
  await p.evaluate(() => { location.hash = '#group'; }); await sleep(900);
  await p.click('.help-btn[data-s="group"]'); await sleep(700);
  ok(/Tu grupo/.test(await p.$eval('.sheet-title h2', e => e.textContent)), '? en Tu grupo');
  await p.click('[data-act="close"]'); await sleep(400);

  // Tamaño de letra
  await p.evaluate(() => { location.hash = '#home'; }); await sleep(700);
  await p.click('.help-btn[data-s="home"]'); await sleep(700);
  await p.click('[data-act="fontSize"][data-v="1.3"]'); await sleep(400);
  ok(await p.evaluate(() => document.documentElement.style.zoom === '1.3'), 'Letra "Muy grande" se aplica al instante');
  await p.click('[data-act="close"]'); await sleep(500);
  await p.reload({ waitUntil: 'load' }); await sleep(1300);
  ok(await p.evaluate(() => document.documentElement.style.zoom === '1.3'), 'El tamaño de letra se recuerda en este celular');
  await shot('letra-muy-grande');
  const fits = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  ok(fits, 'Con letra muy grande no aparece scroll horizontal');
  await p.evaluate(() => { location.hash = '#money'; }); await sleep(900); await shot('letra-muy-grande-dinero');
  await p.click('.icon-btn[data-act="trip"]'); await sleep(800);
  ok(!!(await p.$('.sheet [data-act="fontSize"]')), 'También está en ⚙️ Viaje');
  await p.click('.sheet [data-act="fontSize"][data-v="1"]'); await sleep(300);
  ok(await p.evaluate(() => document.documentElement.style.zoom === '1'), 'Volver a Normal');

  ok(!errs.length, 'Errores: ' + (errs.join('; ') || 'ninguno'));
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
