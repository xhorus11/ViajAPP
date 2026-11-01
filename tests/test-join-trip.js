/* Datos del viaje entre dos celulares (nombre, fechas, participantes, dietas), usando la interfaz como el usuario.
   Escenarios: 1) A configura antes de que B se una  2) B ya está unido y A edita en vivo  3) B edita y A lo recibe
   Uso: node tests/test-join-trip.js [URL]   (contra el Firebase real; limpia al final) */
const puppeteer = require('puppeteer-core');
const URL = process.argv[2] || 'http://localhost:8765/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const mk = async name => {
    const ctx = await browser.createBrowserContext(); const p = await ctx.newPage();
    await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    p.on('pageerror', e => console.log(name, 'pageerror', e.message));
    p.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /Sync/.test(m.text()))) console.log(name, m.type(), m.text().slice(0, 200)); });
    return p;
  };
  const A = await mk('A'), B = await mk('B'), C = await mk('C');
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const T1 = day(1), T5 = day(5);

  // Llena la hoja "Tu viaje" como lo haría el usuario y guarda
  async function editTrip(P, f) {
    await P.evaluate(() => { location.hash = '#home'; });
    await sleep(500);
    await P.click('header [data-act="trip"]'); await sleep(700);
    await P.evaluate(f => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      if (f.name) set('tpName', f.name);
      if (f.start) set('tpStart', f.start);
      if (f.end) set('tpEnd', f.end);
      if (f.people) set('tpPeople', f.people);
    }, f);
    if (f.diet) {   // abre Dietas desde la hoja del viaje y marca la dieta
      await P.click('[data-act="diets"]'); await sleep(700);
      await P.click(`[data-act="dietTog"][data-p="${f.diet[0]}"][data-t="${f.diet[1]}"]`); await sleep(400);
      await P.click('[data-act="close"]').catch(() => {}); await sleep(600);
    } else { await P.click('[data-act="saveTrip"]'); await sleep(600); }
  }
  const tripOf = P => P.evaluate(() => { const t = Store.state.trip; return { n: t.name, s: t.start, e: t.end, p: t.people, d: t.diets || {} }; });
  const waitFor = async (P, fn, ms = 20000) => { let v; for (let i = 0; i < ms / 500; i++) { v = await tripOf(P); if (fn(v)) return v; await sleep(500); } return v; };
  const screenOf = P => P.evaluate(async () => {
    location.hash = '#home'; await new Promise(r => setTimeout(r, 400));
    const home = document.querySelector('.hero') ? document.querySelector('.hero').textContent.replace(/\s+/g, ' ') : '';
    location.hash = '#agenda'; await new Promise(r => setTimeout(r, 400));
    // días del viaje visibles en el mes mostrado (el viaje puede cruzar a otro mes)
    const t = Store.state.trip, vis = [...document.querySelectorAll('.cal-day')].filter(c => c.dataset.d >= t.start && c.dataset.d <= t.end);
    const tripDays = vis.length && vis.every(c => c.classList.contains('trip')) ? Math.round((new Date(t.end) - new Date(t.start)) / 864e5) + 1 : 0;
    location.hash = '#home';
    return { home, tripDays };
  });
  async function join(P, id, name) {
    await P.goto(URL.replace('index.html', `index.html?viaje=${id}`), { waitUntil: 'load' }); await sleep(2000);
    await P.evaluate(n => { document.getElementById('syName').value = n; }, name);
    await P.click('[data-act="syJoin"]');
    for (let i = 0; i < 60; i++) { await sleep(500); if (await P.evaluate(() => Sync.ready)) break; }
    await sleep(1500);
  }

  // A: viaje local "Temuco" + crear viaje compartido
  await A.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await editTrip(A, { name: 'Temuco', start: T1, end: T5, people: 'Ana, Pedro' });
  const id = await A.evaluate(() => Sync.create('Ana'));
  await sleep(2500);

  // 1) B se une
  await join(B, id, 'Pedro');
  let b = await waitFor(B, t => t.n === 'Temuco');
  ok(b.n === 'Temuco' && b.s === T1 && b.e === T5, `1) B recibe nombre y fechas (${b.n} ${b.s}→${b.e})`);
  ok(JSON.stringify(b.p) === '["Ana","Pedro"]', `1) B recibe participantes (${b.p})`);
  let sc = await screenOf(B);
  ok(/Temuco/.test(sc.home) && sc.tripDays >= 5, `1) Pantalla de B: hero con Temuco y ${sc.tripDays} días del viaje en el calendario`);

  // 2) Con B unido, A edita en vivo (participantes y dietas)
  await editTrip(A, { people: 'Ana, Pedro, Cami' });
  await editTrip(A, { diet: ['Cami', 'celiaco'] });
  b = await waitFor(B, t => t.p.length === 3 && t.d.Cami);
  ok(JSON.stringify(b.p) === '["Ana","Pedro","Cami"]', `2) B ve a Cami agregada en vivo (${b.p})`);
  ok(b.d.Cami && (b.d.Cami.tags || []).includes('celiaco'), '2) B ve la dieta de Cami (celíaca)');
  await editTrip(A, { name: 'Temuco 2026', end: day(6) });
  b = await waitFor(B, t => t.n === 'Temuco 2026');
  ok(b.n === 'Temuco 2026' && b.e === day(6), '2) B ve el cambio de nombre y fecha en vivo');
  sc = await screenOf(B);
  ok(/Temuco 2026/.test(sc.home) && sc.tripDays >= 6, `2) Pantalla de B actualizada (${sc.tripDays} días)`);

  // 3) B edita y A lo recibe; A no pierde nada
  await editTrip(B, { diet: ['Ana', 'vegano'] });
  let a = await waitFor(A, t => t.d.Ana);
  ok(a.d.Ana && a.d.Cami, '3) A recibe la dieta que puso B y conserva la de Cami');
  ok(a.n === 'Temuco 2026' && a.p.length === 3, '3) A conserva nombre y participantes');

  // 4) Un tercero (C) que tenía otro viaje local se une después
  await C.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await editTrip(C, { name: 'Mi viaje viejo', start: day(30), end: day(32), people: 'Zoe' });
  await join(C, id, 'Cami');
  const c = await waitFor(C, t => t.n === 'Temuco 2026');
  ok(c.n === 'Temuco 2026' && c.s === T1 && JSON.stringify(c.p) === '["Ana","Pedro","Cami"]' && c.d.Cami && c.d.Ana, `4) C (con datos propios) recibe todo el viaje: ${JSON.stringify(c)}`);
  await sleep(2500);
  a = await tripOf(A); b = await tripOf(B);
  ok(a.n === 'Temuco 2026' && b.n === 'Temuco 2026' && !a.p.includes('Zoe') && !b.p.includes('Zoe'), '4) El viaje viejo de C no pisa el del grupo');

  // 5) B recarga la app (modo resume) y sigue igual; A edita mientras tanto
  await editTrip(A, { people: 'Ana, Pedro, Cami, Lucho' });
  await B.reload({ waitUntil: 'load' });
  b = await waitFor(B, t => t.p.includes('Lucho'));
  ok(b.p.includes('Lucho') && b.n === 'Temuco 2026', '5) Tras recargar, B recibe lo editado mientras tanto');

  // 6) D ya está en SU PROPIO viaje compartido ("Yo, Raúl" → crea como Matías) y escanea el QR de Temuco
  const D = await mk('D');
  await D.goto(URL, { waitUntil: 'load' }); await sleep(1200);
  await editTrip(D, { people: 'Yo, Raúl' });
  const otherId = await D.evaluate(() => Sync.create('Matías'));
  ok(JSON.stringify((await tripOf(D)).p) === '["Matías","Raúl"]', '6) Al crear, "Yo" pasa a ser el nombre de quien crea');
  await sleep(2000);
  await D.goto(URL.replace('index.html', `index.html?viaje=${id}`), { waitUntil: 'load' });
  let box = false;
  for (let i = 0; i < 30 && !box; i++) { await sleep(500); box = await D.evaluate(() => !!document.querySelector('[data-act="sySwitch"]')); }
  ok(box, '6) Al abrir la invitación estando en otro viaje, se ofrece "Cambiarme al viaje nuevo"');
  await D.evaluate(() => { document.getElementById('syName').value = 'Nico'; });
  await D.click('[data-act="sySwitch"]');
  const dd = await waitFor(D, t => t.n === 'Temuco 2026' && t.d.Cami, 40000);
  ok(dd.n === 'Temuco 2026' && dd.s === T1 && dd.p.includes('Cami') && dd.p.includes('Nico') && dd.d.Cami, `6) D se cambia y ve Temuco con participantes y dietas (${dd.p})`);
  ok(await D.evaluate(i => Sync.tripId === i, id), '6) D queda conectado al viaje de Temuco');
  await sleep(2000);
  ok((await tripOf(A)).p.includes('Nico'), '6) A ve a Nico en los participantes');

  // limpieza (el viaje de D quedó sin miembros: no se puede borrar desde la app, se limpia con el token del CLI aparte)
  await A.evaluate(async () => {
    const ref = firebase.firestore().collection('trips').doc(Sync.tripId);
    for (const c of ['shop', 'expenses', 'events', 'meta', 'photos', 'pantry', 'gear', 'log']) { const s = await ref.collection(c).get(); for (const d of s.docs) await d.ref.delete(); }
    await ref.delete().catch(() => {});
  }).catch(e => console.log('limpieza', e.message));
  console.log('Viaje huérfano de D:', otherId);
  console.log(fails ? `FALLARON ${fails}` : 'TODO OK');
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
