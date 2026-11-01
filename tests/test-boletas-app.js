/* Analizador de boletas en la app: foto → IA (Worker real) → "Revisa tu boleta" → editar → usar → guardar → planillas.
   Uso: node tests/test-boletas-app.js <carpeta con 9.jpg> [URL] [carpeta descargas]   (usa el Worker publicado) */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const DIR = process.argv[2];
const URL = process.argv[3] || 'http://127.0.0.1:8765/index.html';
const OUT = process.argv[4] || path.join(__dirname, 'out-boletas');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.readdirSync(OUT).forEach(f => fs.unlinkSync(path.join(OUT, f)));
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await p.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await p.goto(URL, { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' }); await sleep(1200);
  await p.evaluate(() => { Object.assign(Store.state.trip, { name: 'Congreso Pucón', entity: 'UTEM', people: ['Ana', 'Pedro', 'Cami'], budget: 800000 }); Store.state.expenses = []; Store.save(); localStorage.setItem('viajapp-guide', 'off'); location.hash = '#money'; });
  await sleep(900);

  // Gasto nuevo: sin foto aparece "Foto y leer boleta con IA"
  await p.click('.fab[data-act="newExpense"]'); await sleep(700);
  ok(!!(await p.$('#bolBox input[data-change="bolPhoto"]')), 'En el gasto aparece "Foto y leer boleta con IA"');
  await p.type('#exDesc', '');
  const input = await p.$('#bolBox input[data-change="bolPhoto"]');
  await input.uploadFile(path.join(DIR, '9.jpg'));
  await sleep(1500);
  ok(/Leyendo/.test(await p.$eval('#sheetBody', e => e.textContent)), 'Muestra "Leyendo tu boleta…"');
  await shot('01-leyendo');
  for (let i = 0; i < 60 && !(await p.$('#bolRows')); i++) await sleep(1000);
  ok(!!(await p.$('#bolRows')), 'Llega la hoja "Revisa tu boleta"');
  const n = await p.$$eval('.bol-row', r => r.length);
  ok(n === 18, `18 productos en la tabla (${n})`);
  ok(/cuadra/.test(await p.$eval('#bolCheck', e => e.textContent)), 'Aviso: la suma cuadra con el total');
  await shot('02-revisa');
  await p.evaluate(() => { document.getElementById('bolRows').scrollIntoView(); });
  await shot('03-tabla');

  // Editar: nombre y precio de la primera fila → el aviso cambia a diferencia
  const first = await p.$('.bol-row[data-i="0"] .bi-n');
  await first.click({ clickCount: 3 }); await first.type('Hallullas');
  const price = await p.$('.bol-row[data-i="0"] .bi-t');
  await price.click({ clickCount: 3 }); await price.type('2.000');
  ok(/diferencia \$134/.test(await p.$eval('#bolCheck', e => e.textContent)), 'Al cambiar un precio avisa la diferencia ($134)');
  await price.click({ clickCount: 3 }); await price.type('1866');
  ok(/cuadra/.test(await p.$eval('#bolCheck', e => e.textContent)), 'Al corregirlo vuelve a cuadrar');
  // Cantidad con precio unitario: champiñones 3 → 2 recalcula
  const ch = await p.evaluate(() => [...document.querySelectorAll('.bol-row')].findIndex(r => /Champi/i.test(r.querySelector('.bi-n').value)));
  if (ch >= 0) {
    const q = await p.$(`.bol-row[data-i="${ch}"] .bi-q`);
    await q.click({ clickCount: 3 }); await q.type('2');
    ok((await p.$eval(`.bol-row[data-i="${ch}"] .bi-t`, e => e.value)) === '3.180', 'Cambiar cantidad recalcula el precio (2 × $1.590)');
    await q.click({ clickCount: 3 }); await q.type('3');
  }
  // Agregar y quitar fila
  await p.click('[data-act="bolAdd"]'); await sleep(300);
  ok(await p.$$eval('.bol-row', r => r.length) === 19, 'Agregar producto');
  await p.click('.bol-row[data-i="18"] [data-act="bolDel"]'); await sleep(300);
  ok(await p.$$eval('.bol-row', r => r.length) === 18, 'Quitar producto');

  // Usar estos datos → completa el gasto
  await p.click('[data-act="bolUse"]'); await sleep(900);
  const f = await p.evaluate(() => ({ a: document.getElementById('exAmount').value, d: document.getElementById('exDate').value, n: document.getElementById('exDocNum').value, desc: document.getElementById('exDesc').value }));
  ok(f.a === '54884' && f.d === '2025-10-24' && f.n === '2202019811', `Completa monto, fecha y N° (${JSON.stringify(f)})`);
  ok(/Unimarc/i.test(f.desc), 'Propone la descripción con el local');
  ok(/18 productos/.test(await p.$eval('#bolBox', e => e.textContent)), 'Muestra "Boleta leída: 18 productos"');
  ok(await p.$$eval('#exPhotos img', i => i.length) === 1, 'La foto queda como comprobante del gasto');
  await shot('04-gasto-completo');
  await p.click('[data-act="saveExpense"]'); await sleep(900);
  const ex = await p.evaluate(() => Store.state.expenses[0]);
  ok(ex && ex.amount === 54884 && ex.receipt && ex.receipt.items.length === 18 && ex.receipt.items[0].nombre === 'Hallullas', 'Gasto guardado con sus productos (y la edición)');
  ok(!ex.among && ex.payer, 'No cambia el reparto ni el pagador (funciones existentes intactas)');

  // Volver a editar desde el gasto guardado
  await p.$eval(`.exp-row[data-id="${ex.id}"]`, e => e.scrollIntoView({ block: 'center' })); await sleep(300);
  await p.click(`.exp-row[data-id="${ex.id}"]`); await sleep(800);
  await p.click('[data-act="bolEdit"]'); await sleep(600);
  ok(await p.$$eval('.bol-row', r => r.length) === 18, '"Ver y editar" reabre la tabla guardada');
  await p.click('[data-act="bolBack"]'); await sleep(400);
  await p.click('[data-act="close"]').catch(() => {}); await p.keyboard.press('Escape'); await sleep(600);

  // Gasto sin boleta + planillas
  await p.evaluate(() => { Store.state.expenses.push({ id: 'x2', amount: 69000, cat: 'bar', desc: 'Cena final / Pizza', date: '2025-10-26', payer: 'Fondo común', method: 'Débito', docType: 'Sin comprobante', docNum: '', photos: [], notes: '', created: Date.now() }); Store.save(); location.hash = '#home'; });
  await sleep(300); await p.evaluate(() => { location.hash = '#money'; }); await sleep(900);
  ok(!!(await p.$('[data-act="planilla"]')), 'En Dinero aparece "Planilla de gastos (Excel o Word)"');
  await p.click('[data-act="planilla"]'); await sleep(700);
  await shot('05-planilla');
  await p.click('[data-act="planillaGo"][data-k="xlsx"]'); await sleep(4000);
  await p.click('[data-act="planilla"]'); await sleep(700);
  await p.click('[data-act="planillaGo"][data-k="docx"]'); await sleep(4000);
  const files = fs.readdirSync(OUT);
  ok(files.some(x => /^planilla-gastos-congreso-pucon\.xlsx$/.test(x)), 'Descarga Excel (.xlsx)');
  ok(files.some(x => /^planilla-gastos-congreso-pucon\.docx$/.test(x)), 'Descarga Word (.docx)');
  ok(!errs.length, 'Errores: ' + (errs.join('; ') || 'ninguno'));
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
