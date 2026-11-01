/* Gastos solo entre algunos: formulario (Todos / chips), Cuentas claras, edición, Fondo común, Excel.
   Uso: node tests/test-among.js [URL] */
const puppeteer = require('puppeteer-core');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await p.evaluate(() => { Object.assign(Store.state.trip, { people: ['Ana', 'Pedro', 'Cami', 'Diego'], budget: 0 }); Store.state.expenses = []; Store.save(); location.hash = '#money'; });
  await sleep(700);

  async function newExpense(amount, desc, payer, among) {
    await p.click('.fab[data-act="newExpense"]'); await sleep(600);
    await p.type('#exAmount', String(amount)); await p.type('#exDesc', desc);
    await p.click(`[data-act="pick"][data-g="payer"][data-v="${payer}"]`); await sleep(200);
    for (const n of among || []) { await p.click(`[data-act="amongTog"][data-p="${n}"]`); await sleep(150); }
    await p.click('[data-act="saveExpense"]'); await sleep(800);
  }
  // el bloque muestra "Todos" por defecto y el monto por persona
  await p.click('.fab[data-act="newExpense"]'); await sleep(600);
  await p.type('#exAmount', '20000');
  await p.click('[data-act="pick"][data-g="payer"][data-v="Ana"]'); await sleep(200);
  let lab = await p.$eval('.among-n', e => e.textContent);
  ok(/Todos/.test(lab) && /5\.000/.test(lab), `Por defecto "Todos" con monto c/u (${lab})`);
  await p.click('[data-act="amongTog"][data-p="Ana"]'); await sleep(150);
  await p.click('[data-act="amongTog"][data-p="Pedro"]'); await sleep(150);
  lab = await p.$eval('.among-n', e => e.textContent);
  ok(/^2/.test(lab) && /10\.000/.test(lab), `Al elegir 2 personas: ${lab}`);
  await p.click('[data-act="pick"][data-g="payer"][data-v="Fondo común"]'); await sleep(200);
  ok(!(await p.$('[data-act="amongTog"]')), 'Con "Fondo común" la opción se oculta');
  await p.click('[data-act="pick"][data-g="payer"][data-v="Ana"]'); await sleep(200);
  ok(await p.$eval('[data-act="amongTog"][data-p="Pedro"]', e => e.classList.contains('active')), 'Al volver a una persona conserva la selección');
  await p.type('#exDesc', 'Cervezas');
  await p.click('[data-act="saveExpense"]'); await sleep(800);

  await newExpense(40000, 'Supermercado', 'Pedro');
  const st = await p.evaluate(() => Store.state.expenses.map(e => ({ d: e.desc, among: e.among })));
  ok(JSON.stringify(st[0].among) === '["Ana","Pedro"]' && st[1].among === undefined, `Se guarda among solo si es parcial (${JSON.stringify(st)})`);

  const card = await p.evaluate(() => [...document.querySelectorAll('.settle-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  console.log('   ', card.join(' | '));
  const tr = await p.evaluate(() => [...document.querySelectorAll('.transfer')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  console.log('   ', tr.join(' | '));
  ok(card.some(r => /Ana.*su parte \$20\.000/.test(r)) && card.some(r => /Cami.*su parte \$10\.000/.test(r)), 'Partes: Ana $20.000, Cami $10.000');
  ok(tr.length === 2 && tr.every(t => /Pedro.*\$10\.000/.test(t)) && tr.some(t => /Cami/.test(t)) && tr.some(t => /Diego/.test(t)), 'Cami y Diego le pasan $10.000 a Pedro; Ana queda a mano');
  ok(await p.evaluate(() => /entre 2/.test(document.querySelector('.exp-row').textContent + document.querySelectorAll('.exp-row')[1].textContent)), 'El movimiento muestra "entre 2"');

  // editar: marcar a todos vuelve a "Todos"
  await p.evaluate(() => { [...document.querySelectorAll('.exp-row')].find(r => /Cervezas/.test(r.textContent)).click(); });
  await sleep(600);
  ok(await p.$eval('[data-act="amongTog"][data-p="Pedro"]', e => e.classList.contains('active')), 'Al editar se ven los elegidos');
  await p.click('[data-act="amongTog"][data-p="Cami"]'); await sleep(150);
  await p.click('[data-act="amongTog"][data-p="Diego"]'); await sleep(150);
  ok(await p.$eval('[data-act="amongAll"]', e => e.classList.contains('active')), 'Marcar a todos = "Todos"');
  await p.click('[data-act="saveExpense"]'); await sleep(800);
  ok(await p.evaluate(() => Store.state.expenses.every(e => !e.among)), 'Guardado como gasto de todos');
  const tr2 = await p.evaluate(() => [...document.querySelectorAll('.transfer')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  ok(tr2.length === 3 && /\$15\.000 c\/u/.test(await p.evaluate(() => document.querySelector('.settle-row').parentElement.textContent)), `Sin parciales vuelve el cálculo en partes iguales (${tr2.join(' | ')})`);

  // Excel con la columna nueva
  await p.evaluate(() => { const e = Store.state.expenses[0]; e.among = ['Ana', 'Cami']; Store.save(); });
  const csv = await p.evaluate(() => new Promise(res => {
    const orig = URL.createObjectURL;
    URL.createObjectURL = b => { URL.createObjectURL = orig; b.text().then(res); return orig.call(URL, b); };
    Exporter.financeCSV(false);
    setTimeout(() => res(''), 4000);
  })).catch(() => '');
  ok(/Repartido entre/.test(csv) && /Ana, Cami/.test(csv), 'Excel incluye "Repartido entre"');

  ok(!errs.length, 'Errores: ' + (errs.join('; ') || 'ninguno'));
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
