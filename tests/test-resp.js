const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'out-resp'), DL = path.join(OUT, 'dl');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const cdp = await page.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  const click = async (s, w = 400) => { await page.waitForSelector(s, { visible: true }); await page.$eval(s, e => e.scrollIntoView({ block: 'center' })); await sleep(120); await page.click(s); await sleep(w); };
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });

  // Migración: viaje antiguo con un solo responsable
  await page.evaluate(() => { const t = Store.state.trip; t.responsible = 'Responsable Antiguo'; t.rut = '11.111.111-1'; t.responsibles = []; Store.save(); });
  await click('.icon-btn[data-act="trip"]', 700);
  const legacy = await page.$$eval('.rp-name', els => els.map(e => e.value));
  console.log('Migración muestra:', JSON.stringify(legacy));

  // Tres responsables
  const setRow = async (i, n, r) => page.evaluate((i, n, r) => { const row = document.querySelectorAll('.resp-row')[i]; row.querySelector('.rp-name').value = n; row.querySelector('.rp-rut').value = r; }, i, n, r);
  await setRow(0, 'Ana Pérez Soto', '12.345.678-9');
  await click('[data-act="rpAdd"]'); await setRow(1, 'Pedro González', '13.456.789-0');
  await click('[data-act="rpAdd"]'); await setRow(2, 'Camila Rojas', '14.567.890-1');
  await click('[data-act="rpAdd"]');                                   // fila vacía: debe ignorarse
  await page.evaluate(() => { document.getElementById('tpEntity').value = 'Universidad Tecnológica Metropolitana'; document.getElementById('tpName').value = 'Gira Pucón 2026'; document.getElementById('tpBudget').value = '500000'; });
  await page.$eval('.resp-row', e => e.scrollIntoView({ block: 'center' })); await sleep(300);
  await page.screenshot({ path: path.join(OUT, 'resp-sheet.png') });
  await click('[data-act="saveTrip"]', 900);
  const saved = await page.evaluate(() => Store.state.trip.responsibles);
  console.log('Guardados:', JSON.stringify(saved));
  await click('.icon-btn[data-act="trip"]', 700);
  console.log('Al reabrir, filas:', await page.$$eval('.rp-name', els => els.map(e => e.value).join(' | ')));
  await page.keyboard.press('Escape'); await sleep(400);

  await page.evaluate(() => { Store.state.expenses.push({ id: 'x1', amount: 45990, cat: 'super', desc: 'Compra Unimarc', date: Store.today(), payer: 'Fondo común', method: 'Débito', docType: 'Boleta', docNum: '1234', photos: [], notes: '', created: Date.now() }); Store.save(); });
  await page.evaluate(() => location.hash = 'money'); await sleep(900);
  await click('[data-act="exp"][data-k="financePDF"]', 3000);
  console.log('Descargas:', fs.readdirSync(DL).join(', '));
  console.log('Errores:', errs.length ? errs.join(' / ') : 'ninguno');
  await browser.close();
})();
