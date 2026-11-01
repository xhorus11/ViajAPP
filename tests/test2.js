const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'out2');
const DL = path.join(OUT, 'downloads');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(DL, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  const cdp = await page.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  const shot = async n => { await sleep(800); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const click = async (sel, wait = 450) => { await page.waitForSelector(sel, { visible: true, timeout: 5000 }); await page.click(sel); await sleep(wait); };
  const type = async (sel, txt) => { await page.click(sel, { clickCount: 3 }); await page.type(sel, txt); };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(Store.state)));

  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });

  // Viaje con 3 personas y fondos
  await click('.icon-btn[data-act="trip"]');
  await type('#tpName', 'Gira Pucón 2026');
  await type('#tpPeople', 'Ana, Pedro, Cami');
  await type('#tpBudget', '300000');
  await click('[data-act="saveTrip"]', 900);

  // Recetas
  await click('.tab[data-tab="recipes"]', 900);
  await shot('01-recipes');
  await click('[data-act="cook"][data-id="pastas"]', 700);
  await click('[data-act="cookVar"][data-i="1"]');        // Pesto
  await click('[data-act="cookP"][data-d="1"]');          // 4 personas
  await click('.variant-row[data-k="aceites|Aceite|Oliva extra virgen"]'); // ya lo tengo
  await shot('02-cook-pesto');
  await click('[data-act="cookAdd"]', 900);

  await click('[data-act="rcat"][data-c="carnes"]', 600);
  await click('[data-act="cook"][data-id="asado"]', 700);
  await click('[data-act="cookVar"][data-i="3"]');        // Mixto
  await click('[data-act="cookAgenda"]', 700);
  await type('#evPlace', 'Cabaña');
  await click('[data-act="saveEvent"]', 900);

  // Receta propia
  await click('.fab[data-act="newRecipe"]', 700);
  await type('#rcName', 'fideos de la abuela');
  await type('.ing-row[data-s="b"][data-ri="0"] .ing-t', 'Fideos · Tallarines');
  await type('.ing-row[data-s="b"][data-ri="0"] .ing-q', '100');
  await click('[data-act="rcAddRow"][data-s="b"]', 300);
  await type('.ing-row[data-s="b"][data-ri="1"] .ing-t', 'Salsa secreta');
  await type('.ing-row[data-s="b"][data-ri="1"] .ing-q', '0.5');
  await page.select('.ing-row[data-s="b"][data-ri="1"] .ing-u', 'fr');
  await click('[data-act="rcAddVar"]', 300);
  await type('.rc-vname[data-vi="0"]', 'Picante');
  await type('.ing-row[data-s="0"][data-ri="0"] .ing-t', 'Ají · Cacho de cabra');
  await page.select('.ing-row[data-s="0"][data-ri="0"] .ing-u', 'fijo');
  await shot('03-editor');
  await click('[data-act="rcSave"]', 900);
  await click('[data-act="rcat"][data-c="mine"]', 600);
  await shot('04-mine');
  const mine = await page.$('#recGrid [data-act="cook"]');
  await mine.click(); await sleep(700);
  await click('[data-act="cookAdd"]', 900);

  // Editar una receta base y restaurarla
  await click('[data-act="rcat"][data-c="all"]', 500);
  await click('[data-act="cook"][data-id="lasana"]', 700);
  await click('[data-act="editRecipe"]', 700);
  await type('#rcName', 'Lasaña de la casa');
  await click('[data-act="rcSave"]', 900);
  let s = await state();
  console.log('OVERRIDE', s.recipes.custom.lasana && s.recipes.custom.lasana.n);
  await click('[data-act="cook"][data-id="lasana"]', 700);
  await click('[data-act="editRecipe"]', 700);
  await click('[data-act="rcRestore"]', 900);
  s = await state();
  console.log('RESTORED', !s.recipes.custom.lasana);

  // Lista con cantidades
  await click('.tab[data-tab="shop"]', 900);
  await click('[data-act="shopMode"][data-m="list"]', 900);
  await shot('05-list-amounts');
  await click('[data-act="exp"][data-k="listPNG"]', 4000);
  await click('[data-act="exp"][data-k="listPDF"]', 2500);

  // Agenda con receta vinculada
  await click('.tab[data-tab="agenda"]', 900);
  await click('.ev', 700);
  await shot('06-event-recipe');
  await click('[data-act="evToList"]', 600);
  await click('[data-act="close"]', 300).catch(() => {});
  await page.keyboard.press('Escape'); await sleep(500);

  // Gastos de distintas personas → cuentas claras
  await click('.tab[data-tab="money"]', 900);
  const addExp = async (amount, desc, payer) => {
    await click('.fab', 700);
    await type('#exAmount', amount); await type('#exDesc', desc);
    await click(`[data-act="pick"][data-g="payer"][data-v="${payer}"]`, 150);
    await click('[data-act="saveExpense"]', 1100);
  };
  await addExp('60000', 'Súper Unimarc', 'Ana');
  await addExp('30000', 'Bar del puerto', 'Pedro');
  await addExp('100000', 'Arriendo cabaña', 'Fondo común');
  await page.evaluate(() => { const h = [...document.querySelectorAll('h2')].find(x => x.textContent.includes('Cuentas claras')); h && h.scrollIntoView(); });
  await shot('07-settle');
  s = await state();
  console.log('PAYERS', s.expenses.map(e => e.payer + ':' + e.amount).join(', '));
  await click('[data-act="exp"][data-k="financePDF"]', 3000);

  await click('.tab[data-tab="home"]', 1000);
  await shot('08-home');

  console.log('LIST', Object.values(s.shop.sel).map(r => `${r.i}${r.v ? '/' + r.v : ''}${r.u ? ' ' + r.n + r.u : ''}`).join(' | '));
  await sleep(1000);
  console.log('DOWNLOADS', fs.readdirSync(DL).join(' | '));
  console.log('ERRORS', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
