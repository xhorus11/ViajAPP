/* E2E: Dietas y alergias + Despensa.  Uso: node tests/test-diet-pantry.js [URL] */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'out-dp');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const shot = async n => { await sleep(700); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const click = async (s, w = 450) => { await page.waitForSelector(s, { visible: true, timeout: 8000 }); await page.$eval(s, e => e.scrollIntoView({ block: 'center' })); await sleep(120); await page.click(s); await sleep(w); };
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(Store.state)));
  const K = (c, i, v) => `${c}|${i}|${v}`;

  await page.goto(URL, { waitUntil: 'networkidle0' });
  // Participantes
  await click('.icon-btn[data-act="trip"]', 700);
  await page.$eval('#tpPeople', e => { e.value = 'Ana, Pedro, Cami, Diego'; });
  // Abrir dietas desde la hoja del viaje (debe guardar los participantes antes)
  await click('[data-act="diets"]', 700);
  ok((await page.$$('.diet-person')).length === 4, 'La hoja de dietas muestra a los 4 participantes');
  await click('[data-act="dietTog"][data-p="Cami"][data-t="celiaco"]', 300);
  await click('[data-act="dietTog"][data-p="Diego"][data-t="vegetariano"]', 300);
  await page.type('.diet-note[data-p="Diego"]', 'No le gusta el cilantro'); await sleep(300);
  await shot('01-dietas');
  let s = await st();
  ok(JSON.stringify(s.trip.diets.Cami.tags) === '["celiaco"]' && s.trip.diets.Diego.tags[0] === 'vegetariano' && /cilantro/.test(s.trip.diets.Diego.note), 'Dietas y nota guardadas');
  await page.keyboard.press('Escape'); await sleep(400);

  // Recetario
  await click('.tab[data-tab="recipes"]', 900);
  ok(/Cami \(celíaco/.test(await page.$eval('.diet-banner small', e => e.textContent)), 'Banner con las dietas del grupo');
  ok(!!(await page.$('[data-act="rcat"][data-c="apt"]')), 'Existe el filtro "Aptas para el grupo"');
  const badge = id => page.$eval(`[data-act="cook"][data-id="${id}"] .db`, e => e.textContent.trim()).catch(() => '');
  ok(/Se adapta/.test(await badge('pastas')), 'Pastas: "Se adapta" (fideos sin gluten)');
  ok(/No apta: Diego/.test(await badge('asado')), 'Asado: "No apta: Diego"');
  await shot('02-recetas');
  await click('[data-act="rcat"][data-c="apt"]', 700);
  ok(!(await page.$('[data-act="cook"][data-id="asado"]')) && !!(await page.$('[data-act="cook"][data-id="pastas"]')), 'El filtro deja pastas y saca el asado');
  await click('[data-act="rcat"][data-c="all"]', 500);

  // Cocinar pastas al pesto para 4
  await click('[data-act="cook"][data-id="pastas"]', 800);
  await click('[data-act="cookVar"][data-i="1"]', 400);
  const rows = () => page.$$eval('.variant-row', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  let r = await rows();
  ok(r.some(x => /Fideos · Spaghetti.*330 g/.test(x)) && r.some(x => /Fideos · Sin gluten.*para Cami.*110 g/.test(x)), 'Porción aparte: 330 g normales + 110 g sin gluten para Cami');
  ok(/Cami.*Fideos spaghetti.*Fideos sin gluten/.test(await page.$eval('.diet-box', e => e.textContent)), 'Caja de dietas explica el reemplazo');
  await shot('03-cocinar-adaptado');
  await click('[data-act="cookMode"][data-m="all"]', 400);
  r = await rows();
  ok(!r.some(x => /Spaghetti/.test(x)) && r.some(x => /Sin gluten.*440 g/.test(x)), 'Todo el plato apto: 440 g sin gluten');
  await click('[data-act="cookMode"][data-m="portion"]', 400);
  await click('[data-act="cookAdd"]', 900);
  s = await st();
  ok(s.shop.sel[K('despensa', 'Fideos', 'Sin gluten')] && /para Cami/.test(s.shop.sel[K('despensa', 'Fideos', 'Sin gluten')].src.join()), 'Lista: fideos sin gluten "para Cami"');

  // Lista: aviso de dieta y comprado → despensa
  await click('.tab[data-tab="shop"]', 700);
  await click('[data-act="shopMode"][data-m="list"]', 900);
  const warn = await page.$$eval('.list-row', els => els.map(e => e.textContent.replace(/\s+/g, ' ')));
  ok(warn.some(x => /Spaghetti.*No apto para Cami \(gluten\)/.test(x)) && !warn.some(x => /Sin gluten.*No apto/.test(x)), 'Aviso "No apto para Cami" solo en los fideos normales');
  await shot('04-lista-avisos');
  const kSp = K('despensa', 'Fideos', 'Spaghetti');
  await click(`.check[data-k="${kSp}"]`, 600);
  s = await st();
  ok(s.pantry.items[kSp] && s.pantry.items[kSp].a.g === 330, 'Comprado → despensa: 330 g de spaghetti');
  await click(`.check[data-k="${kSp}"]`, 600);
  s = await st();
  ok(!s.pantry.items[kSp], 'Desmarcar devuelve: ya no está en la despensa');
  await click(`.check[data-k="${kSp}"]`, 600);

  // Receta otra vez: lo que hay en la despensa se descuenta
  await click('.tab[data-tab="recipes"]', 800);
  await click('[data-act="cook"][data-id="pastas"]', 800);
  await click('[data-act="cookVar"][data-i="1"]', 400);
  r = await page.$$eval('.variant-row', els => els.map(e => ({ t: e.textContent.replace(/\s+/g, ' '), on: e.classList.contains('on') })));
  const sp = r.find(x => /Spaghetti/.test(x.t));
  ok(sp && /en despensa/.test(sp.t) && !sp.on, 'Cocinar: spaghetti "en despensa" y desmarcado solo');
  await shot('05-cocinar-despensa');
  // Agendar y marcar como cocinado
  await click('[data-act="cookAgenda"]', 800);
  await click('[data-act="saveEvent"]', 900);
  await click('.tab[data-tab="agenda"]', 900);
  await click('.ev', 900);
  await click('[data-act="evCooked"]', 900);
  s = await st();
  ok(!s.pantry.items[kSp] && s.events[0].cooked, 'Cocinado: se descontaron los 330 g de la despensa');
  await shot('06-evento-cocinado');
  await click('[data-act="evUncook"]', 900);
  s = await st();
  ok(s.pantry.items[kSp] && s.pantry.items[kSp].a.g === 330 && !s.events[0].cooked, 'Deshacer: vuelven a la despensa');
  await page.keyboard.press('Escape'); await sleep(400);

  // Despensa: agregar, ajustar, se acabó
  await click('.tab[data-tab="shop"]', 700);
  await click('[data-act="shopMode"][data-m="pantry"]', 900);
  await page.type('#paName', 'Arroz · Grado 1'); await page.$eval('#paQty', e => { e.value = '1000'; }); await page.select('#paUnit', 'g');
  await click('[data-act="pAdd"]', 700);
  const kA = K('despensa', 'Arroz', 'Grado 1');
  await click(`[data-act="pStep"][data-k="${kA}"][data-d="1"]`, 500);
  s = await st();
  ok(s.pantry.items[kA] && s.pantry.items[kA].a.g === 1100, 'Despensa: arroz 1000 g + 100 g = 1100 g');
  await shot('07-despensa');
  await click(`[data-act="pToList"][data-k="${kA}"]`, 700);
  s = await st();
  ok(!s.pantry.items[kA] && s.shop.sel[kA] && !s.shop.sel[kA].done, 'Se acabó → pasa a la lista');

  console.log('Errores:', errs.length ? errs.join(' / ') : 'ninguno');
  if (errs.length) fails++;
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
