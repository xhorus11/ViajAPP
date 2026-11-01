/* E2E: Tu grupo (¿Quién lleva qué?, Habitaciones y camas, Bitácora).  Uso: node tests/test-group.js [URL] */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'out-group');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const shot = async n => { await sleep(700); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const click = async (s, w = 450) => { await page.waitForSelector(s, { visible: true, timeout: 8000 }); await page.$eval(s, e => e.scrollIntoView({ block: 'center' })); await sleep(120); await page.click(s); await sleep(w); };
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(Store.state)));

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.setItem('viajapp-name', '"Ana"'); Store.state.trip.people = ['Ana', 'Pedro', 'Cami', 'Diego', 'Sofía']; Store.save(); });
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(800);

  // Inicio → tarjeta "Tu grupo"
  ok((await page.$$('.g-tile')).length === 3, 'Inicio muestra las 3 tarjetas de "Tu grupo"');
  await click('.g-tile[data-m="gear"]', 900);
  ok((await page.evaluate(() => location.hash)) === '#group', 'Abre la pantalla Tu grupo');
  ok(await page.$eval('.tab.active', e => e.dataset.tab) === 'home', 'La barra marca Inicio (sin pestaña nueva)');

  // ¿Quién lleva qué?
  await click('[data-act="gSug"][data-n="Parlante"]');
  await click('[data-act="gSug"][data-n="Cooler"]');
  await page.type('#gName', 'proyector'); await page.keyboard.press('Enter'); await sleep(500);
  let s = await st();
  const byName = n => Object.values(s.gear.items).find(x => x.name === n);
  ok(byName('Parlante') && byName('Cooler') && byName('Proyector'), 'Se agregan cosas por sugerencia y escribiendo (Enter)');
  await page.type('#gName', 'Parlante'); await click('[data-act="gAdd"]', 500);
  s = await st();
  ok(Object.values(s.gear.items).filter(x => x.name === 'Parlante').length === 1, 'No duplica cosas');
  await click(`[data-act="gMine"][data-id="${byName('Parlante').id}"]`, 500);
  await click(`[data-act="gEdit"][data-id="${byName('Cooler').id}"]`, 700);
  await click('[data-act="gOwnerPick"][data-v="Pedro"]', 200);
  await page.$eval('#geQty', e => { e.value = '2'; });
  await click('[data-act="gSave"]', 700);
  s = await st();
  ok(byName('Parlante').owner === 'Ana' && byName('Cooler').owner === 'Pedro' && byName('Cooler').qty === 2, 'Lo llevo yo (Ana) y asignar a Pedro x2');
  await click(`[data-act="gCheck"][data-id="${byName('Parlante').id}"]`, 500);
  s = await st();
  ok(byName('Parlante').brought, 'Marcar como llevado');
  await shot('01-cosas');
  await click('[data-act="gPhase"][data-p="vuelta"]', 600);
  ok(!(await page.$(`[data-act="gCheck"][data-id="${byName('Proyector').id}"]`)), 'Al volver solo aparecen cosas con dueño');
  await click(`[data-act="gCheck"][data-id="${byName('Cooler').id}"]`, 500);
  s = await st();
  ok(byName('Cooler').returned, 'Marcar como devuelto a su dueño');
  await click('[data-act="gPhase"][data-p="ida"]', 400);

  // Habitaciones
  await click('[data-act="gMode"][data-m="rooms"]', 900);
  await click('[data-act="gRoomExample"]', 700);
  s = await st();
  ok(s.rooms.list.length === 4, 'Ejemplo crea 4 piezas');
  await click('[data-act="gPrefs"]', 700);
  await page.select('#pA', 'Ana'); await page.select('#pB', 'Pedro');
  await click('[data-act="gPairAdd"]', 400);
  await click('[data-act="close"]', 500);
  await click('[data-act="gRaffle"]', 3200);
  s = await st();
  const bedOf = (st, p) => { for (const r of st.rooms.list) for (const b of r.beds) if (b.who.includes(p)) return { r, b }; return null; };
  ok(['Ana', 'Pedro', 'Cami', 'Diego', 'Sofía'].every(p => bedOf(s, p)), 'El sorteo le da cama a las 5 personas');
  const a = bedOf(s, 'Ana'), p = bedOf(s, 'Pedro');
  ok(a && p && a.r.id === p.r.id, 'Ana y Pedro (juntos) quedan en la misma pieza');
  ok(a && a.b.type === 'double' && a.b.who.includes('Pedro'), 'Ana y Pedro comparten la cama 2 plazas');
  await shot('02-piezas-sorteo');
  // Asignar a mano y fijar
  const living = s.rooms.list.find(r => r.name === 'Living'), sofa = living.beds[0];
  await click(`[data-act="gBed"][data-b="${sofa.id}"]`, 700);
  if (!sofa.who.includes('Sofía')) await click('[data-act="gBedWho"][data-p="Sofía"]', 400);   // el sorteo pudo dejarla ahí
  await click('[data-act="gBedLock"]', 400);
  await click('[data-act="close"]', 500);
  s = await st();
  ok(bedOf(s, 'Sofía').b.id === sofa.id && s.rooms.list.flatMap(r => r.beds).filter(b => b.who.includes('Sofía')).length === 1, 'Asignar a mano mueve a Sofía al sofá (una sola cama)');
  for (let k = 0; k < 3; k++) { await click('[data-act="gRaffle"]', 3200); }
  s = await st();
  ok(bedOf(s, 'Sofía').b.id === sofa.id, 'La cama fijada no cambia en nuevos sorteos');
  // Editar pieza: agregar cama
  await click(`[data-act="gRoomEdit"][data-r="${living.id}"]`, 700);
  await click('[data-act="gBedAdd"][data-t="mattress"]', 400);
  await click('[data-act="gRoomSave"]', 500);
  s = await st();
  ok(s.rooms.list.find(r => r.id === living.id).beds.length === 2, 'Agregar una cama (colchón) a una pieza');

  // Bitácora (con fusión de acciones repetidas)
  await page.evaluate(() => {
    ['Manzana', 'Pera', 'Kiwi'].forEach(i => { Store.state.shop.sel[`frutas|${i}|`] = { c: 'frutas', i, v: '', q: 1, done: false }; });
    Store.save();
  });
  await click('.tab[data-tab="shop"]', 700);
  await click('[data-act="shopMode"][data-m="list"]', 900);
  for (const i of ['Manzana', 'Pera', 'Kiwi']) await click(`.check[data-k="frutas|${i}|"]`, 300);
  await click('.tab[data-tab="home"]', 800);
  await click('.g-tile[data-m="log"]', 900);
  s = await st();
  const texts = s.log.map(e => `${e.who} ${e.text}`);
  ok(texts.some(t => /Ana se ofreció a llevar Parlante/.test(t)), 'Bitácora: "Ana se ofreció a llevar Parlante"');
  ok(texts.some(t => /asignó Cooler a Pedro/.test(t)), 'Bitácora: asignación de cosas');
  ok(texts.some(t => /sorteó las camas/.test(t)), 'Bitácora: sorteo de camas');
  ok(texts.some(t => /marcó 3 productos como comprados/.test(t)), 'Bitácora junta acciones seguidas ("marcó 3 productos como comprados")');
  ok((await page.$$('.log-row')).length >= 5, 'La bitácora muestra los movimientos');
  await shot('03-bitacora');
  await click('[data-act="gLogK"][data-k="shop"]', 500);
  ok((await page.$$eval('.log-row', els => els.every(e => /Súper/.test(e.textContent)))), 'Filtro por módulo (Súper)');

  console.log('Errores:', errs.length ? errs.join(' / ') : 'ninguno');
  if (errs.length) fails++;
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
