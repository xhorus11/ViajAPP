/* Boleta electrónica en PDF + logo propio en los documentos + "Dinero del viaje".
   - Sube tests/fixtures/boleta-electronica.pdf con "Boleta electrónica (PDF o captura)" → se guarda como imagen y la IA la lee (Worker real)
   - ⚙️ Viaje → Logo: Mi logo (tests/fixtures/logo-institucion.png) / Sin logo / Viajapp → carta PDF, PNG y Word
   Uso: node tests/test-marca-pdf.js [URL] [carpeta descargas] */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const OUT = process.argv[3] || path.join(__dirname, 'out-marca');
const FIX = path.join(__dirname, 'fixtures');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await p.target().createCDPSession();
  const dl = async sub => { const d = path.join(OUT, sub); fs.mkdirSync(d, { recursive: true }); await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: d }); return d; };
  const sent = []; p.on('request', r => { if (/workers\.dev\/leer/.test(r.url()) && r.method() === 'POST') { try { sent.push(JSON.parse(r.postData()).mime); } catch (e) {} } });
  await p.goto(URL, { waitUntil: 'load' });
  await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'load' }); await sleep(1200);
  await p.evaluate(() => {
    Object.assign(Store.state.trip, { name: 'Congreso Valdivia', entity: 'Instituto Universitario Demo', people: ['Ana', 'Pedro'], budget: 300000,
      responsibles: [{ name: 'Ana Pérez', rut: '12.345.678-9' }] });
    Store.state.expenses = [{ id: 'e1', amount: 45990, cat: 'bar', desc: 'Cena de bienvenida', date: Store.today(), payer: 'Fondo común', method: 'Débito', docType: 'Boleta', docNum: '771', photos: [], notes: '', created: Date.now() }];
    Store.state.shop.sel = { 'frutas|Palta|Hass': { c: 'frutas', i: 'Palta', v: 'Hass', q: 2, done: false } };
    Store.save(); localStorage.setItem('viajapp-guide', 'off'); location.hash = '#money';
  });
  await sleep(900);
  ok(/Dinero del viaje/.test(await p.$eval('.page', e => e.textContent)) && !/Plata del viaje/.test(await p.$eval('.page', e => e.textContent)), 'Dinero: el título dice "Dinero del viaje"');

  // ---- Boleta electrónica en PDF ----
  await p.click('.fab[data-act="newExpense"]'); await sleep(700);
  const edoc = await p.$('#bolBox .bol-edoc input[data-change="bolPhoto"]');
  ok(!!edoc && /application\/pdf/.test(await p.evaluate(e => e.accept, edoc)), 'En el gasto aparece "Boleta electrónica (PDF o captura)" que acepta PDF');
  ok(/pdf/.test(await p.$eval('#exPhotos input[data-change="photos"]', e => e.accept)), '"Foto o PDF" en los comprobantes acepta PDF');
  await edoc.uploadFile(path.join(FIX, 'boleta-electronica.pdf'));
  for (let i = 0; i < 60 && !(await p.$('#bolRows')) && !(await p.$('.bol-check.warn')); i++) await sleep(1000);
  ok(sent[0] === 'image/jpeg', `El PDF se convierte en imagen antes de enviarlo (${sent[0]})`);
  ok(!!(await p.$('#bolRows')), 'La IA lee la boleta electrónica (hoja "Revisa tu boleta")');
  const tot = await p.$eval('#bolTotal', e => e.value).catch(() => '');
  ok(tot === '12.150', `Total leído del PDF: ${tot}`);
  await p.click('[data-act="bolUse"]').catch(() => {}); await sleep(800);
  const ph = await p.evaluate(async () => { const d = window.__draft || null; const id = document.querySelector('#exPhotos img[data-photo]'); return id ? (await Store.photos.get(id.dataset.photo) || '').slice(0, 23) : ''; });
  ok(ph === 'data:image/jpeg;base64,', 'El PDF queda guardado como comprobante (imagen) del gasto');
  await p.click('[data-act="saveExpense"]'); await sleep(900);
  await p.screenshot({ path: path.join(OUT, '01-gasto-pdf.png') });

  // ---- Logo propio ----
  await p.click('.icon-btn[data-act="trip"]'); await sleep(800);
  ok(!!(await p.$('[data-act="brandMode"][data-v="custom"]')), 'En ⚙️ Viaje aparece "Logo en la carta financiera y los documentos"');
  await p.$eval('[data-act="brandMode"][data-v="custom"]', e => e.scrollIntoView({ block: 'center' })); await sleep(200);
  await p.click('[data-act="brandMode"][data-v="custom"]'); await sleep(500);
  const up = await p.$('input[data-change="brandLogo"]');
  await up.uploadFile(path.join(FIX, 'logo-institucion.png')); await sleep(1500);
  const b = await p.evaluate(() => Store.state.trip.brand || {});
  ok(b.mode === 'custom' && /^data:image\/png/.test(b.logo || ''), 'Se guarda el logo de la institución en el viaje (PNG)');
  ok(!!(await p.$('.brand-box img')), 'Muestra la vista previa del logo');
  await p.$eval('.brand-box', e => e.scrollIntoView({ block: 'center' })); await sleep(300);
  await p.screenshot({ path: path.join(OUT, '02-logo-propio.png') });
  await p.keyboard.press('Escape'); await sleep(600);

  const exportAll = async sub => {
    const d = await dl(sub);
    await p.evaluate(() => Exporter.financePDF()); await sleep(2500);
    await p.evaluate(() => Exporter.listPNG()); await sleep(2500);
    await p.evaluate(() => { location.hash = '#money'; }); await sleep(600);
    await p.click('[data-act="planilla"]'); await sleep(700);
    await p.click('[data-act="planillaGo"][data-k="docx"]'); await sleep(3000);
    return fs.readdirSync(d).map(f => path.join(d, f));
  };
  let files = await exportAll('custom');
  ok(files.length === 3, 'Con mi logo: carta PDF, PNG y Word descargados');
  const pdfTxt = f => fs.readFileSync(f, 'latin1');
  const pdf = files.find(f => f.endsWith('.pdf'));
  ok(pdf && /\/Subtype\s*\/Image/.test(pdfTxt(pdf)) && !/Viajapp/.test(pdfTxt(pdf)), 'Carta PDF con el logo propio y sin la marca Viajapp');
  const docx = files.find(f => f.endsWith('.docx'));
  ok(docx && /word\/media\/logo\.png/.test(fs.readFileSync(docx, 'latin1')), 'La planilla Word lleva el logo propio');

  await p.evaluate(() => { Store.state.trip.brand = Object.assign({}, Store.state.trip.brand, { mode: 'none' }); Store.save(); });
  files = await exportAll('none');
  const pdf2 = files.find(f => f.endsWith('.pdf'));
  const imgs = f => (pdfTxt(f).match(/\/Subtype\s*\/Image/g) || []).length;
  ok(pdf2 && !/Viajapp/.test(pdfTxt(pdf2)) && imgs(pdf2) === 1 && imgs(pdf) > 1, `Sin logo: carta PDF sin logo ni marca Viajapp (imágenes: ${imgs(pdf2)} = solo la boleta del anexo)`);
  ok(!(fs.readFileSync(files.find(f => f.endsWith('.docx')), 'latin1')).includes('word/media/'), 'Sin logo: Word sin imagen');

  await p.evaluate(() => { Store.state.trip.brand.mode = 'viajapp'; Store.save(); });
  files = await exportAll('viajapp');
  const pdf3 = files.find(f => f.endsWith('.pdf'));
  ok(pdf3 && /Viajapp/.test(pdfTxt(pdf3)) && /\/Subtype\s*\/Image/.test(pdfTxt(pdf3)), 'Viajapp (por defecto): carta con el logo y la marca Viajapp');

  ok(!errs.length, 'Errores: ' + (errs.join('; ') || 'ninguno'));
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
