/* Cuentas separadas: abrir desde Dinero, leer boleta (respuesta fija), asignar productos, separar unidades,
   editar nombre y precio, propina (sin / 10% / otro), quién pagó, guardar como gasto, Cuentas claras,
   volver a editar desde el gasto y comprobar que los gastos normales se reparten igual que antes.
   Uso: node tests/test-cuentas.js <foto.jpg> [URL] */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const PHOTO = process.argv[2];
const URL = process.argv[3] || 'http://127.0.0.1:8765/index.html';
const OUT = path.join(__dirname, 'out-cuentas');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

const BAR = { proveedor: 'Bar La Terraza', razonSocial: '', rut: '', fecha: '2026-10-20', nDoc: '5521', tipoDoc: 'Boleta', medioPago: 'Crédito', categoria: 'bar', detalle: 'Pizza y tragos',
  items: [
    { orig: 'PIZZA FAMILIAR', nombre: 'Pizza familiar', cant: 1, unidad: 'un', pUnit: 12000, total: 12000 },
    { orig: '3 SCHOP', nombre: 'Cerveza schop', cant: 3, unidad: 'un', pUnit: 3000, total: 9000 },
    { orig: 'MOJITO', nombre: 'Mojito', cant: 1, unidad: 'un', pUnit: 5000, total: 5000 },
    { orig: 'JUGO NAT', nombre: 'Jugo natural', cant: 1, unidad: 'un', pUnit: 2500, total: 2500 }],
  neto: 23950, iva: 4550, propina: 0, total: 28500, legible: true, avisos: [] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('STACK', String(e.stack || '').split(String.fromCharCode(10)).slice(0, 3).join(' | ')); });
  await p.setRequestInterception(true);
  p.on('request', r => {
    if (/workers\.dev\/leer/.test(r.url())) {
      const h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'content-type': 'application/json' };
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: h });
      return r.respond({ status: 200, headers: h, body: JSON.stringify({ ok: true, model: 'demo', data: BAR, check: { sum: 28500, diff: 0 } }) });
    }
    r.continue();
  });
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  const res = () => p.$$eval('.sep-res-row', rs => Object.fromEntries(rs.map(r => [r.querySelector('b').textContent, r.querySelector(':scope > b').textContent])));
  const clickAct = async (sel) => { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await p.click(sel); await sleep(350); };

  await p.goto(URL, { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' }); await sleep(1200);
  await p.evaluate(() => {
    Sync.idToken = async () => 'demo';
    Object.assign(Store.state.trip, { name: 'Prueba bar', people: ['Ana', 'Pedro', 'Cami'], budget: 0 });
    Store.state.expenses = []; Store.save(); localStorage.setItem('viajapp-guide', 'off'); location.hash = '#money';
  });
  await sleep(900);

  ok(!!(await p.$('.sep-link[data-act="sepOpen"]')), 'En Dinero aparece el botón "Cuentas separadas"');
  await clickAct('.sep-link');
  ok(/Cuentas separadas/.test(await p.$eval('.sheet-title h2', e => e.textContent)), 'Se abre la hoja Cuentas separadas');
  const inp = await p.$('input[data-change="sepPhoto"]');
  await inp.uploadFile(PHOTO);
  for (let i = 0; i < 30 && !(await p.$('.sep-item')); i++) await sleep(300);
  ok(await p.$$eval('.sep-item', r => r.length) === 4, 'Lee la boleta: 4 productos');
  ok(!!(await p.$('.sep-photo')), 'Muestra la boleta de respaldo');
  ok(await p.$$eval('[data-act="sepPerson"].active', r => r.length) === 3, 'Por defecto estaban los 3 participantes');
  await shot('01-leida');

  // Asignar: pizza para todos; cervezas separadas en 3 (una c/u); mojito Ana; jugo Cami
  await clickAct('[data-act="sepAll"][data-i="0"]');
  await clickAct('[data-act="sepUnits"][data-i="1"]');
  ok(await p.$$eval('.sep-item', r => r.length) === 6, '"Separar en 3" deja 3 cervezas de $3.000');
  await clickAct('[data-act="sepWho"][data-i="1"][data-p="Ana"]');
  await clickAct('[data-act="sepWho"][data-i="2"][data-p="Pedro"]');
  await clickAct('[data-act="sepWho"][data-i="3"][data-p="Cami"]');
  ok(/sin asignar/.test(await p.$eval('#sepRes', e => e.textContent)), 'Avisa lo que falta asignar');
  await clickAct('[data-act="sepWho"][data-i="4"][data-p="Ana"]');
  await clickAct('[data-act="sepWho"][data-i="5"][data-p="Cami"]');
  let r = await res();
  ok(r.Ana === '$13.200' && r.Pedro === '$7.700' && r.Cami === '$10.450', `Con propina 10%: Ana $13.200, Pedro $7.700, Cami $10.450 (${JSON.stringify(r)})`);
  ok(/\$31\.350/.test(await p.$eval('.sep-tot', e => e.textContent)), 'Total con propina $31.350');
  await shot('02-asignada');

  // Editar precio y nombre
  const pr = await p.$('.sep-item[data-i="5"] .si-p'); await pr.click({ clickCount: 3 }); await pr.type('3000');
  const nm = await p.$('.sep-item[data-i="5"] .si-n'); await nm.click({ clickCount: 3 }); await nm.type('Jugo de frambuesa');
  r = await res();
  ok(r.Cami === '$11.000', `Editar el precio recalcula al instante (Cami $11.000: ${r.Cami})`);
  // Propina
  await clickAct('[data-act="sepTip"][data-v="0"]');
  r = await res(); ok(r.Ana === '$12.000' && r.Cami === '$10.000', 'Sin propina: cada uno su consumo');
  const o = await p.$('#sepTipO'); await o.click(); await o.type('20');
  r = await res(); ok(r.Pedro === '$8.400', `Propina "Otro" 20% (Pedro $8.400: ${r.Pedro})`);
  await o.click({ clickCount: 3 }); await o.press('Backspace');
  await clickAct('[data-act="sepTip"][data-v="10"]');
  // Persona extra y quién pagó
  await p.type('#sepNewP', 'Lucho'); await clickAct('[data-act="sepAddP"]');
  ok(!!(await p.$('[data-act="sepWho"][data-p="Lucho"]')), 'Se puede agregar otra persona');
  await clickAct('[data-act="sepPerson"][data-p="Lucho"]').catch(() => {});
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="sepPerson"]')]; return b.length; });
  await clickAct('[data-act="sepPayer"][data-v="Pedro"]');
  const debts = await p.$$eval('.sep-debts .transfer', t => t.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  ok(debts.length === 2 && debts.some(t => /Ana.*Pedro.*\$13\.200/.test(t)) && debts.some(t => /Cami.*Pedro.*\$11\.000/.test(t)), `Le devuelven a Pedro: ${debts.join(' | ')}`);
  await shot('03-pago');

  // Guardar como gasto
  await clickAct('[data-act="sepSave"]'); await sleep(900);
  const ex = await p.evaluate(() => Store.state.expenses[0]);
  ok(ex && ex.amount === 31900 && ex.payer === 'Pedro' && ex.split && ex.split.items.length === 6 && ex.split.tip === 10, `Gasto guardado: $31.900, pagó Pedro, 6 productos, propina 10% (${ex && ex.amount})`);
  ok(ex.photos.length === 1 && ex.receipt && ex.desc === 'Bar La Terraza' && ex.cat === 'bar' && ex.docNum === '5521', 'Con la boleta de respaldo, local, categoría y N°');
  ok(/cuentas separadas/.test(await p.$eval(`.exp-row[data-id="${ex.id}"]`, e => e.textContent)), 'En Movimientos dice "cuentas separadas"');
  const cc = await p.evaluate(() => [...document.querySelectorAll('.transfer')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  ok(cc.some(t => /Ana.*Pedro.*\$13\.200/.test(t)) && cc.some(t => /Cami.*Pedro.*\$11\.000/.test(t)) && cc.length === 2, `Cuentas claras cobra a cada uno lo suyo: ${cc.join(' | ')}`);
  await p.evaluate(() => { const h = [...document.querySelectorAll('.section-title h2')].find(x => /Cuentas claras/.test(x.textContent)); h.scrollIntoView(); });
  await shot('04-cuentas-claras');

  // Gasto normal: se sigue repartiendo igual que antes
  await p.evaluate(() => { Store.state.expenses.push({ id: 'n1', amount: 30000, cat: 'super', desc: 'Súper', date: '2026-10-21', payer: 'Ana', method: 'Débito', docType: 'Boleta', docNum: '', photos: [], notes: '', created: Date.now() }); Store.save(); location.hash = '#home'; });
  await sleep(300); await p.evaluate(() => { location.hash = '#money'; }); await sleep(900);
  const cc2 = await p.evaluate(() => [...document.querySelectorAll('.transfer')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  // Ana: -13200 + 30000 - 10000 = +6800 ; Pedro: +31900 - 7700 - 10000 = +14200 ; Cami: -11000 - 10000 = -21000
  ok(cc2.length === 2 && cc2.some(t => /Cami.*Pedro.*\$14\.200/.test(t)) && cc2.some(t => /Cami.*Ana.*\$6\.800/.test(t)), `Gasto normal + separadas: ${cc2.join(' | ')}`);

  // Volver a editar desde el gasto
  await clickAct(`.exp-row[data-id="${ex.id}"]`); await sleep(500);
  ok(/ver y editar/.test(await p.$eval('[data-act="sepFromExpense"]', e => e.textContent)), 'El gasto muestra "Cuentas separadas · ver y editar"');
  await clickAct('[data-act="sepFromExpense"]');
  ok(await p.$$eval('.sep-item', r => r.length) === 6 && (await res()).Ana === '$13.200', 'Reabre el reparto guardado');
  await clickAct('[data-act="sepBack"]');
  ok(!!(await p.$('#exAmount')), '"Volver sin cambios" regresa al gasto');

  ok(!errs.length, 'Errores: ' + (errs.join('; ') || 'ninguno'));
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
