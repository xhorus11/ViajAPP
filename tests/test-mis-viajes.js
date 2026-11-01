/* Mis viajes + plantillas + cuentas (correo y Google), con 3 equipos. Usa el EMULADOR de Firebase (no toca datos reales).
   Antes: en tests/ → firebase emulators:start --only "firestore,auth" --project viajapp-e589e --config firebase.json
   Uso: node tests/test-mis-viajes.js [URL]   (por defecto http://127.0.0.1:8765/index.html) */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const OUT = path.join(__dirname, 'out-mis-viajes');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  // Emulador limpio (cuentas y viajes de corridas anteriores)
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/viajapp-e589e/accounts', { method: 'DELETE' });
  await fetch('http://127.0.0.1:8080/emulator/v1/projects/viajapp-e589e/databases/(default)/documents', { method: 'DELETE' });
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const errs = [];
  const mk = async name => {
    const ctx = await browser.createBrowserContext(); const p = await ctx.newPage();
    await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.evaluateOnNewDocument(() => { window.FIREBASE_EMULATOR = true; });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') console.log('   ', name, 'console:', m.text().slice(0, 160)); });
    p.ctx = ctx; p.nm = name;
    return p;
  };
  const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png') });
  const idx = p => p.evaluate(() => JSON.parse(localStorage.getItem('viajapp-trips') || 'null'));
  const st = p => p.evaluate(() => ({ name: Store.state.trip.name, people: Store.state.trip.people, start: Store.state.trip.start, end: Store.state.trip.end,
    sel: Object.values(Store.state.shop.sel), events: Store.state.events, exp: Store.state.expenses.length, gear: Object.values(Store.state.gear.items) }));
  const click = async (p, sel, w = 700) => { await p.waitForSelector(sel, { visible: true, timeout: 10000 }); await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); await sleep(150); await p.click(sel); await sleep(w); };
  const waitFor = async (p, fn, arg, ms = 30000) => { for (let i = 0; i < ms / 500; i++) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await sleep(500); } return false; };
  const openTrips = async p => { if (await p.evaluate(() => !document.getElementById('sheetWrap').hidden)) { await p.keyboard.press('Escape'); await sleep(600); } await p.evaluate(() => { location.hash = '#home'; }); await sleep(400); await click(p, '.hero .trips-btn', 900); };
  const openByName = async (p, name) => {
    const id = await p.evaluate(n => { const i = JSON.parse(localStorage.getItem('viajapp-trips')); return (i.list.find(e => e.name === n) || {}).id; }, name);
    await click(p, `[data-act="tripOpen"][data-id="${id}"]`, 1500);
  };
  const today = new Date(), d = n => { const x = new Date(today); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

  /* ============ Equipo A ============ */
  const A = await mk('A');
  await A.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await A.evaluate((s, e) => {
    localStorage.setItem('viajapp-guide', 'off');
    Object.assign(Store.state.trip, { name: 'Pucón 2025', start: s, end: e, people: ['Ana', 'Pedro', 'Cami'], entity: 'UTEM', budget: 500000 });
    Store.state.shop.sel = { 'frutas|Palta|Hass': { c: 'frutas', i: 'Palta', v: 'Hass', q: 4, done: true, pa: { un: 4 } }, 'despensa|Fideos|Spaghetti': { c: 'despensa', i: 'Fideos', v: 'Spaghetti', q: 2, done: false } };
    Store.state.events = [{ id: 'ev1', type: 'cena', title: 'Asado', date: s, time: '20:00', place: 'Cabaña', who: 'Pedro', notes: '', cooked: true, cookLog: [] }];
    Store.state.expenses = [{ id: 'ex1', amount: 45990, cat: 'super', desc: 'Súper', date: s, payer: 'Fondo común', method: 'Débito', docType: 'Boleta', docNum: '1', photos: [], notes: '', created: Date.now() }];
    Store.state.gear.items = { g1: { id: 'g1', name: 'Parrilla', e: '🔥', owner: 'Pedro', qty: 1, brought: true, returned: true, note: '', t: 1 } };
    Store.save();
  }, d(-400), d(-396));
  await A.reload({ waitUntil: 'load' }); await sleep(1500);
  ok(!!(await A.$('.hero .trips-btn')), 'Inicio: la tarjeta del viaje tiene el botón "Mis viajes"');
  await openTrips(A);
  let I = await idx(A);
  ok(I && I.list.length === 1 && I.list[0].name === 'Pucón 2025', 'El viaje que ya existía queda como el primero de Mis viajes (sin perder nada)');
  ok(/Solo en este equipo/.test(await A.$eval('.trip-list', e => e.textContent)) && !!(await A.$('[data-act="acctGoogle"]')) && !!(await A.$('[data-act="acctEmail"]')), 'Mis viajes: "Solo en este equipo" + Continuar con Google / Usar mi correo');
  await shot(A, '01-mis-viajes');

  // Nuevo viaje
  await click(A, '[data-act="tripNew"]', 1500);
  ok(await A.evaluate(() => !!document.getElementById('tpName')), 'Nuevo viaje: se abre la hoja para ponerle nombre y fechas');
  await A.evaluate(() => { document.getElementById('tpName').value = 'Cumpleaños Cami'; }); await click(A, '[data-act="saveTrip"]', 900);
  let s = await st(A);
  ok(s.name === 'Cumpleaños Cami' && s.exp === 0 && !s.sel.length, 'El viaje nuevo parte vacío');
  I = await idx(A);
  ok(I.list.length === 2, 'Mis viajes tiene 2 viajes');

  // Volver al primero
  await openTrips(A); await openByName(A, 'Pucón 2025');
  s = await st(A);
  ok(s.name === 'Pucón 2025' && s.exp === 1 && s.sel.length === 2 && s.events.length === 1, 'Al volver a "Pucón 2025" está todo: gastos, lista y agenda');

  // Plantilla
  await openTrips(A);
  const pid = (await idx(A)).list.find(e => e.name === 'Pucón 2025').id;
  await click(A, `[data-act="tripTpl"][data-id="${pid}"]`, 900);
  await shot(A, '02-plantilla');
  await A.evaluate(v => { document.getElementById('tplName').value = 'Pucón 2026'; document.getElementById('tplStart').value = v; }, d(10));
  await click(A, '[data-act="tplGo"]', 1800);
  s = await st(A);
  ok(s.name === 'Pucón 2026' && s.start === d(10) && s.end === d(14), `Plantilla: nombre y fechas nuevas con la misma duración (${s.start} → ${s.end})`);
  ok(JSON.stringify(s.people) === '["Ana","Pedro","Cami"]', 'Plantilla: copia los participantes');
  ok(s.sel.length === 2 && s.sel.every(r => !r.done && !r.pa), 'Plantilla: copia la lista del súper sin marcar');
  ok(s.events.length === 1 && s.events[0].date === d(10) && !s.events[0].cooked, 'Plantilla: la agenda se corre a las nuevas fechas');
  ok(s.exp === 0, 'Plantilla: no copia los gastos');
  ok(s.gear.length === 1 && !s.gear[0].brought && !s.gear[0].returned, 'Plantilla: Quién lleva qué sin marcar');
  ok((await idx(A)).list.length === 3, 'Mis viajes tiene 3 viajes');

  // Compartir el viaje nuevo
  const tripId = await A.evaluate(() => Sync.create('Ana'));
  await sleep(2500);
  ok((await idx(A)).list.find(e => e.name === 'Pucón 2026').cloud === tripId, 'Al compartir "Pucón 2026" queda marcado como compartido en Mis viajes');

  /* ============ Equipo B: tiene su propio viaje y se une con la invitación ============ */
  const B = await mk('B');
  await B.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await B.evaluate(() => { localStorage.setItem('viajapp-guide', 'off'); Object.assign(Store.state.trip, { name: 'Viaje de Pedro', people: ['Pedro'] }); Store.state.expenses = [{ id: 'xb', amount: 1000, cat: 'otros', desc: 'b', date: Store.today(), payer: 'Pedro', photos: [], created: 1 }]; Store.save(); });
  await B.goto(URL.replace('index.html', 'index.html?viaje=' + tripId), { waitUntil: 'load' }); await sleep(2500);
  ok(/Mis viajes/.test(await B.$eval('#sheetBody', e => e.textContent).catch(() => '')), 'Invitación: dice que el viaje actual queda guardado en Mis viajes');
  await B.evaluate(() => { document.getElementById('syName').value = 'Pedro'; });
  await click(B, '[data-act="syJoin"]', 500);
  ok(await waitFor(B, () => Sync.ready && Store.state.trip.name === 'Pucón 2026'), 'B se une y ve "Pucón 2026"');
  I = await idx(B);
  ok(I.list.length === 2 && I.list.some(e => e.name === 'Viaje de Pedro'), 'B conserva su propio viaje en Mis viajes');
  // B vuelve a su viaje; mientras, A agrega algo al compartido; B vuelve y lo recibe
  await B.keyboard.press('Escape'); await sleep(500);
  await openTrips(B); await openByName(B, 'Viaje de Pedro');
  s = await st(B);
  ok(s.name === 'Viaje de Pedro' && s.exp === 1 && !(await B.evaluate(() => Sync.active)), 'B cambia a su viaje: datos intactos y el compartido queda en pausa (sin salir)');
  await A.evaluate(() => { Store.state.shop.sel['frutas|Plátano|Maduro'] = { c: 'frutas', i: 'Plátano', v: 'Maduro', q: 6, done: false }; Store.save(); });
  await sleep(1500);
  ok(await A.evaluate(id => Sync.members.length === 2, tripId), 'B sigue siendo integrante del viaje compartido');
  await openTrips(B); await openByName(B, 'Pucón 2026');
  ok(await waitFor(B, () => Sync.ready && !!Store.state.shop.sel['frutas|Plátano|Maduro']), 'B vuelve al compartido y recibe lo que A agregó mientras tanto');

  /* ============ Cuenta con correo en A (vincula la sesión anónima) ============ */
  const uidBefore = await A.evaluate(() => Sync.uid);
  await openTrips(A);
  await click(A, '[data-act="acctEmail"]', 800);
  await A.evaluate(() => { document.getElementById('acEmail').value = 'ana@test.cl'; document.getElementById('acPass').value = 'secreta123'; });
  await shot(A, '03-cuenta-correo');
  await click(A, '[data-act="acctCreate"]', 500);
  ok(await waitFor(A, () => Sync.user() && Sync.user().email === 'ana@test.cl' && JSON.parse(localStorage.getItem('viajapp-trips')).list.every(e => e.cloud)), 'Crear cuenta con correo: los 3 viajes quedan guardados en la cuenta');
  ok(await A.evaluate(u => Sync.uid === u, uidBefore), 'La sesión se vincula (mismo usuario): no se pierde nada');
  ok(await waitFor(A, () => !!document.querySelector('.acct.on')), 'Mis viajes muestra la cuenta y "Cerrar sesión"');
  ok(await A.evaluate(() => Sync.active && Store.state.trip.name === 'Pucón 2026' && Sync.members.length === 2), 'El viaje compartido sigue conectado y con B');
  await shot(A, '04-con-cuenta');
  /* ============ Equipo C: entra a la cuenta de A ============ */
  const C = await mk('C');
  await C.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await C.evaluate(() => { localStorage.setItem('viajapp-guide', 'off'); Object.assign(Store.state.trip, { name: 'Notas del computador', people: ['Ana'] }); Store.save(); });
  await openTrips(C); await click(C, '[data-act="acctEmail"]', 800);
  await C.evaluate(() => { document.getElementById('acEmail').value = 'ana@test.cl'; document.getElementById('acPass').value = 'mala'; });
  await click(C, '[data-act="acctLogin"]', 2500);
  ok(/incorrect/i.test(await C.$eval('#toasts', e => e.textContent).catch(() => '')) || await C.evaluate(() => !Sync.user()), 'Contraseña incorrecta: avisa y no entra');
  await C.evaluate(() => { document.getElementById('acEmail').value = 'ana@test.cl'; document.getElementById('acPass').value = 'secreta123'; });
  await click(C, '[data-act="acctCreate"]', 2500);
  ok(await C.evaluate(() => !Sync.user()), 'Crear una cuenta con un correo que ya existe: no entra (pide "Ya tengo cuenta")');
  await click(C, '[data-act="acctLogin"]', 500);
  ok(await waitFor(C, () => Sync.user() && JSON.parse(localStorage.getItem('viajapp-trips')).list.length === 4), 'En el computador (C) aparecen los 3 viajes de la cuenta + el suyo');
  I = await idx(C);
  ok(I.list.filter(e => e.remote).length === 3 && I.list.find(e => e.name === 'Notas del computador').cloud, 'Los de la cuenta quedan "para abrir" y el del computador se sube a la cuenta');
  await shot(C, '05-otro-equipo');
  await openTrips(C); await openByName(C, 'Pucón 2025');
  ok(await waitFor(C, () => Sync.ready && Store.state.trip.name === 'Pucón 2025' && Store.state.expenses.length === 1 && Object.keys(Store.state.shop.sel).length === 2), 'C abre "Pucón 2025" de la cuenta y llegan sus gastos y su lista');

  // A ve el viaje creado en C (al abrir Mis viajes)
  await openTrips(A);
  ok(await waitFor(A, () => JSON.parse(localStorage.getItem('viajapp-trips')).list.some(e => e.name === 'Notas del computador')), 'A ve en Mis viajes el viaje creado en el computador');

  /* ============ Quitar un viaje de la cuenta (único miembro → se borra) ============ */
  await A.keyboard.press('Escape'); await sleep(500);
  await openTrips(A);
  const cumple = (await idx(A)).list.find(e => e.name === 'Cumpleaños Cami');
  await click(A, `[data-act="tripDel"][data-id="${cumple.id}"]`, 300); await click(A, `[data-act="tripDel"][data-id="${cumple.id}"]`, 2500);
  ok(!(await idx(A)).list.some(e => e.name === 'Cumpleaños Cami'), 'Quitar: el viaje sale de Mis viajes');
  ok(await A.evaluate(async id => { const s = await firebase.firestore().collection('trips').doc(id).get(); return !s.exists; }, cumple.cloud), 'Quitar: como solo era de la cuenta, se borra de la nube');

  /* ============ B sale del viaje compartido → vuelve a su viaje ============ */
  await B.keyboard.press('Escape'); await sleep(400);
  await B.evaluate(() => Sync.leave()); await sleep(1500);
  s = await st(B); I = await idx(B);
  ok(s.name === 'Viaje de Pedro' && s.exp === 1 && I.list.length === 1, 'B sale del compartido: se quita de su lista y vuelve a su viaje');

  /* ============ Cerrar sesión en C ============ */
  await openTrips(C);
  await click(C, '[data-act="acctOut"]', 300); await click(C, '[data-act="acctOut"]', 2500);
  I = await idx(C);
  ok(await C.evaluate(() => !Sync.user()) && I.list.length === 1 && !I.list[0].cloud, 'Cerrar sesión: los viajes de la cuenta salen del equipo y queda uno en blanco');

  /* ============ Google (emulador): vincular en un equipo nuevo ============ */
  const D = await mk('D');
  await D.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await D.evaluate(() => { localStorage.setItem('viajapp-guide', 'off'); Object.assign(Store.state.trip, { name: 'Viaje con Google' }); Store.save(); });
  await openTrips(D);
  const popP = new Promise(r => D.ctx.once('targetcreated', t => r(t.page())));
  await click(D, '[data-act="acctGoogle"]', 300);
  const pop = await Promise.race([popP, sleep(15000).then(() => null)]);
  if (pop) {
    try {
      await pop.waitForSelector('#add-account-button, button', { timeout: 10000 }); await sleep(800);
      await pop.evaluate(() => { const b = document.querySelector('#add-account-button') || [...document.querySelectorAll('button')].find(x => /add new account/i.test(x.textContent)); b && b.click(); });
      await sleep(800);
      await pop.evaluate(() => {
        const set = (sel, v) => { const i = document.querySelector(sel); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } };
        set('#email-input', 'dani@gmail.com'); set('#display-name-input', 'Dani'); set('#screen-name-input', 'dani');
      });
      await sleep(400);
      await pop.evaluate(() => { const b = document.querySelector('#sign-in') || [...document.querySelectorAll('button')].find(x => /sign in/i.test(x.textContent)); b && b.click(); });
    } catch (e) { console.log('   popup:', e.message); }
  }
  ok(await waitFor(D, () => Sync.user() && Sync.user().google && JSON.parse(localStorage.getItem('viajapp-trips')).list.every(e => e.cloud), null, 30000), 'Continuar con Google: vincula la cuenta y guarda el viaje en ella');
  await shot(D, '06-google');

  ok(!errs.length, 'Errores: ' + (errs.join(' | ') || 'ninguno'));
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
