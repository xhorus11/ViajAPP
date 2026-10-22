/* Prueba de sincronización con 2 usuarios (A crea, B se une) + un intruso (C) contra el emulador de Firebase */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'out-sync');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const APP = process.argv[2];
const URL = process.argv[3] || 'http://127.0.0.1:8765/index.html';
const EMU = process.argv[4] !== 'real';
let fails = 0;
const ok = (cond, label) => { console.log((cond ? '✅ ' : '❌ ') + label); if (!cond) fails++; };

async function user(browser, name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (EMU) await page.evaluateOnNewDocument(() => { window.FIREBASE_EMULATOR = true; });
  page.errors = [];
  page.on('pageerror', e => page.errors.push(name + ' pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(name + ' console: ' + m.text()); });
  page.shot = async n => { await sleep(700); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  page.clk = async (sel, wait = 450) => {
    await page.waitForSelector(sel, { visible: true, timeout: 8000 });
    await page.$eval(sel, e => e.scrollIntoView({ block: 'center' }));
    await sleep(150);
    try { await page.click(sel); }
    catch (e) {
      const info = await page.$$eval(sel, els => els.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, n: document.querySelectorAll('#sheetBody').length, sheetH: document.getElementById('sheet').getBoundingClientRect().height }; }));
      await page.screenshot({ path: path.join(OUT, 'ERR-' + name + '.png') });
      console.log('CLICK FAIL', name, sel, JSON.stringify(info));
      throw e;
    }
    await sleep(wait);
  };
  page.typ = async (sel, txt) => {
    await page.waitForSelector(sel, { visible: true, timeout: 8000 });
    await page.$eval(sel, e => { e.focus(); e.value = ''; });
    await page.type(sel, txt);
  };
  page.st = () => page.evaluate(() => JSON.parse(JSON.stringify(Store.state)));
  page.until = async (fn, label, ms = 10000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) { ok(true, label); return true; } await sleep(250); }
    ok(false, label); return false;
  };
  return page;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const A = await user(browser, 'A'), B = await user(browser, 'B');

  // ---- A: datos locales y crea el viaje compartido
  await A.goto(URL, { waitUntil: 'networkidle0' });
  await A.clk('.icon-btn[data-act="trip"]');
  await A.typ('#tpName', 'Gira Pucón 2026'); await A.typ('#tpBudget', '300000');
  await A.clk('[data-act="saveTrip"]', 900);
  await A.evaluate(() => { Store.state.shop.sel['frutas|Kiwi|'] = { c: 'frutas', i: 'Kiwi', v: '', q: 2, done: false }; Store.save(); });
  await A.clk('[data-act="sync"]', 700);
  await A.typ('#syName', 'Ana');
  await A.shot('A1-sync-sheet');
  await A.clk('[data-act="syCreate"]', 3000);
  const tripId = await A.evaluate(() => Sync.tripId);
  ok(!!tripId, 'A creó el viaje compartido: ' + tripId);
  await A.shot('A2-invite');
  const link = await A.evaluate(() => Sync.inviteLink());
  await A.keyboard.press('Escape'); await sleep(500);

  // ---- B: tiene datos propios, abre el enlace e ingresa
  await B.goto(URL, { waitUntil: 'networkidle0' });
  await B.evaluate(() => { Store.state.trip.name = 'Viaje propio de B'; Store.save(); });
  await B.goto(link, { waitUntil: 'networkidle0' });
  await B.waitForSelector('#syCode', { visible: true, timeout: 8000 });
  ok((await B.$eval('#syCode', e => e.value)) === tripId, 'El enlace abre la hoja de invitación con el código');
  await B.typ('#syName', 'Pedro');
  await B.clk('[data-act="syJoin"]', 3000);
  await B.until(() => Store.state.trip.name === 'Gira Pucón 2026', 'B recibe el nombre del viaje');
  await B.until(() => !!Store.state.shop.sel['frutas|Kiwi|'], 'B recibe la lista del súper de A');
  await B.until(() => Store.state.trip.people.includes('Pedro') && Store.state.trip.people.includes('Ana'), 'Participantes: Ana y Pedro');
  await A.until(() => Sync.members.length === 2, 'A ve 2 integrantes');
  await B.shot('B1-joined');
  await B.keyboard.press('Escape'); await sleep(500);

  // ---- Tiempo real: B marca comprado → A lo ve
  await B.evaluate(() => { Store.state.shop.sel['frutas|Kiwi|'].done = true; Store.save(); });
  await A.until(() => Store.state.shop.sel['frutas|Kiwi|'] && Store.state.shop.sel['frutas|Kiwi|'].done === true, 'A ve el “comprado” de B');

  // ---- A agrega receta a la lista vía UI → B la ve
  await A.clk('.tab[data-tab="recipes"]', 800);
  await A.clk('[data-act="cook"][data-id="pastas"]', 700);
  await A.clk('[data-act="cookAdd"]', 900);
  await B.until(() => !!Store.state.shop.sel['despensa|Fideos|Spaghetti'], 'B recibe ingredientes de la receta de A');

  // ---- A registra gasto con foto → B recibe gasto y foto
  await A.clk('.tab[data-tab="money"]', 800);
  await A.clk('.fab', 700);
  await A.typ('#exAmount', '45990'); await A.typ('#exDesc', 'Cervezas en el bar');
  const fi = await A.$('input[data-change="photos"]');
  await fi.uploadFile(path.join(APP, 'icons', 'icon-512.png'));
  await sleep(1500);
  await A.clk('[data-act="saveExpense"]', 1500);
  await B.until(() => Store.state.expenses.some(e => e.desc === 'Cervezas en el bar'), 'B recibe el gasto de A');
  await B.until(async () => { const e = Store.state.expenses.find(x => x.desc === 'Cervezas en el bar'); return e && e.photos.length && !!(await Store.photos.get(e.photos[0])); }, 'B recibe la foto de la boleta', 15000);

  // ---- Receta propia creada por B → A la ve
  await B.evaluate(() => { Store.state.recipes.custom.u_test = { id: 'u_test', n: 'Receta de Pedro', e: '🍲', c: 'pastas', base: [], vars: [] }; Store.save(); });
  await A.until(() => Store.state.recipes.custom.u_test && Store.state.recipes.custom.u_test.n === 'Receta de Pedro', 'A recibe la receta propia de B');

  // ---- Agenda: A agenda, B edita
  await A.evaluate(() => { Store.state.events.push({ id: 'ev1', type: 'cena', title: 'Asado', date: Store.today(), time: '21:00', place: '', who: '', notes: '' }); Store.save(); });
  await B.until(() => Store.state.events.some(e => e.id === 'ev1'), 'B recibe el evento de A');
  await B.evaluate(() => { Store.state.events.find(e => e.id === 'ev1').who = 'Pedro'; Store.save(); });
  await A.until(() => (Store.state.events.find(e => e.id === 'ev1') || {}).who === 'Pedro', 'A ve la edición de B en la agenda');

  // ---- Despensa y dietas del grupo
  await A.evaluate(() => {
    Store.state.pantry.items['despensa|Arroz|Grado 1'] = { c: 'despensa', i: 'Arroz', v: 'Grado 1', a: { g: 1000 }, t: Date.now() };
    Store.state.trip.diets = { Pedro: { tags: ['celiaco'], note: 'sin gluten' } };
    Store.save();
  });
  await B.until(() => { const e = Store.state.pantry.items['despensa|Arroz|Grado 1']; return e && e.a.g === 1000; }, 'B recibe la despensa de A');
  await B.until(() => { const d = (Store.state.trip.diets || {}).Pedro; return d && d.tags[0] === 'celiaco'; }, 'B recibe las dietas del grupo');
  await B.evaluate(() => { Store.state.pantry.items['despensa|Arroz|Grado 1'].a.g = 600; Store.save(); });
  await A.until(() => Store.state.pantry.items['despensa|Arroz|Grado 1'].a.g === 600, 'A ve que B usó arroz (600 g)');

  // ---- Tu grupo: cosas, piezas y bitácora (con aviso en vivo)
  await B.evaluate(() => {
    Store.state.gear.items.g1 = { id: 'g1', name: 'Parlante', e: '🔊', owner: 'Pedro', qty: 1, brought: false, returned: false, note: '', t: Date.now() };
    Store.state.rooms = { list: [{ id: 'r1', name: 'Pieza 1', beds: [{ id: 'b1', type: 'double', who: ['Ana', 'Pedro'], lock: false }] }], together: [{ a: 'Ana', b: 'Pedro' }] };
    Store.state.log.push({ id: 'l1', t: Date.now(), who: 'Pedro', k: 'money', mk: null, n: 1, text: 'registró un gasto de $10.000 (Hielo)' });
    Store.save();
  });
  await A.until(() => Store.state.gear.items.g1 && Store.state.gear.items.g1.owner === 'Pedro', 'A recibe ¿Quién lleva qué? de B');
  await A.until(() => Store.state.rooms.list[0] && Store.state.rooms.list[0].beds[0].who.join() === 'Ana,Pedro' && Store.state.rooms.together.length === 1, 'A recibe las piezas y parejas de B');
  await A.until(() => [...document.querySelectorAll('.toast')].some(t => /Pedro registró un gasto/.test(t.textContent)), 'A ve el aviso en vivo "Pedro registró un gasto…"');

  // ---- Borrado: A borra el kiwi → B deja de verlo
  await A.evaluate(() => { delete Store.state.shop.sel['frutas|Kiwi|']; Store.save(); });
  await B.until(() => !Store.state.shop.sel['frutas|Kiwi|'], 'El borrado de A llega a B');

  // ---- La interfaz de B se actualiza sola
  await B.clk('.tab[data-tab="shop"]', 800);
  await B.clk('[data-act="shopMode"][data-m="list"]', 900);
  await A.evaluate(() => { Store.state.shop.sel['lacteos|Leche|Entera'] = { c: 'lacteos', i: 'Leche', v: 'Entera', q: 3, done: false }; Store.save(); });
  await B.until(() => [...document.querySelectorAll('.list-row .rn')].some(x => x.textContent === 'Leche'), 'La pantalla de B muestra lo que agregó A (sin recargar)');
  await B.shot('B2-live-list');

  // ---- Sin conexión: B marca leche offline, al volver A lo ve
  await B.setOfflineMode(true);
  await B.evaluate(() => { Store.state.shop.sel['lacteos|Leche|Entera'].done = true; Store.save(); });
  await sleep(2500);
  ok(!(await A.evaluate(() => Store.state.shop.sel['lacteos|Leche|Entera'].done)), 'Mientras B está offline, A aún no ve el cambio');
  await B.setOfflineMode(false);
  await A.until(() => Store.state.shop.sel['lacteos|Leche|Entera'].done === true, 'Al volver la señal, el cambio offline de B llega a A', 30000);

  // ---- Recarga: B sigue conectado y con datos
  await B.reload({ waitUntil: 'load' }); await sleep(1500);
  await B.until(() => Sync.active && Sync.tripId && Store.state.trip.name === 'Gira Pucón 2026', 'B sigue en el viaje tras recargar');
  await A.evaluate(() => { Store.state.shop.sel['frutas|Palta|Hass'] = { c: 'frutas', i: 'Palta', v: 'Hass', q: 1, done: false }; Store.save(); });
  await B.until(() => !!Store.state.shop.sel['frutas|Palta|Hass'], 'Tras recargar, B sigue recibiendo en tiempo real', 30000);

  // ---- Seguridad: un intruso C con el SDK no puede leer ni escribir
  const C = await user(browser, 'C');
  await C.goto(URL, { waitUntil: 'networkidle0' });
  const intr = await C.evaluate(async (id) => {
    for (const s of ['vendor/firebase-app-compat.js', 'vendor/firebase-auth-compat.js', 'vendor/firebase-firestore-compat.js']) {
      if (!window.firebase || (s.includes('auth') && !firebase.auth) || (s.includes('firestore') && !firebase.firestore)) await new Promise(r => { const e = document.createElement('script'); e.src = s; e.onload = r; document.head.appendChild(e); });
    }
    const app = firebase.initializeApp(window.FIREBASE_CONFIG, 'intruso');
    const db = app.firestore(), au = app.auth();
    if (window.FIREBASE_EMULATOR) { db.useEmulator('127.0.0.1', 8080); au.useEmulator('http://127.0.0.1:9099'); }
    await au.signInAnonymously();
    const r = {};
    const t = async (k, fn) => { try { await fn(); r[k] = 'PERMITIDO'; } catch (e) { r[k] = e.code; } };
    await t('leerLista', () => db.collection('trips').doc(id).collection('shop').get());
    await t('leerGastos', () => db.collection('trips').doc(id).collection('expenses').get());
    await t('editarViaje', () => db.collection('trips').doc(id).update({ 'trip.name': 'hackeado' }));
    await t('listarViajes', () => db.collection('trips').get());
    await t('escribirLista', () => db.collection('trips').doc(id).collection('shop').doc('x').set({ a: 1 }));
    await t('agregarAOtro', () => db.collection('trips').doc(id).update({ members: firebase.firestore.FieldValue.arrayUnion('otro-uid') }));
    await t('crearConOtros', () => db.collection('trips').doc().set({ members: ['otro', au.currentUser.uid] }));
    return r;
  }, tripId);
  console.log('INTRUSO', JSON.stringify(intr));
  ok(Object.values(intr).every(v => v === 'permission-denied'), 'Las reglas bloquean al intruso en todo');

  // ---- B sale: vuelve a sus datos propios
  await B.clk('.tab[data-tab="home"]', 800);
  await B.clk('.sync-pill', 700);
  await B.clk('[data-act="syLeave"]', 200);
  await B.clk('[data-act="syLeave"]', 2500);
  await B.until(() => !Sync.active && Store.state.trip.name === 'Viaje propio de B', 'B sale y recupera sus datos anteriores');
  await A.until(() => Sync.members.length === 1, 'A ve que B salió');
  await A.clk('.tab[data-tab="home"]', 1000);
  await A.shot('A3-home');

  // ---- Limpieza: A borra el viaje de prueba (todas las subcolecciones y el documento)
  const cleaned = await A.evaluate(async () => {
    const db = firebase.firestore(), ref = db.collection('trips').doc(Sync.tripId);
    let n = 0;
    for (const c of ['shop', 'expenses', 'events', 'meta', 'photos', 'pantry', 'gear', 'log']) {
      const snap = await ref.collection(c).get();
      for (const d of snap.docs) { await d.ref.delete(); n++; }
    }
    await Sync.leave();
    await ref.delete().catch(() => {});
    return n;
  }).catch(e => 'error: ' + e.message);
  console.log('LIMPIEZA documentos borrados:', cleaned);

  const errs = [...A.errors, ...B.errors, ...C.errors].filter(e => !/WebChannelConnection|net::ERR_INTERNET_DISCONNECTED|Could not reach Cloud Firestore|ERR_NAME|offline/i.test(e));
  console.log('ERRORES', errs.length ? '\n' + errs.join('\n') : 'ninguno');
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
