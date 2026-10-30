/* Capturas para el manual de Viajapp (datos de ejemplo, sin tocar Firebase) */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots'), DL = path.join(OUT, 'dl');
const THEME = process.env.SHOTS_THEME || 'day';   // tema de las capturas (day | night)
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(DL, { recursive: true });
const URL = process.argv[2] || 'https://viajapp-trip.web.app/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const cdp = await page.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  const shot = async (n, wait = 1300) => { await sleep(wait); await page.screenshot({ path: path.join(OUT, n + '.png') }); console.log('📸', n); };
  const click = async (s, w = 500) => { await page.waitForSelector(s, { visible: true, timeout: 8000 }); await page.$eval(s, e => e.scrollIntoView({ block: 'center' })); await sleep(150); await page.click(s); await sleep(w); };
  const tab = async t => { await click(`.tab[data-tab="${t}"]`, 300); await page.evaluate(() => scrollTo(0, 0)); };
  const esc = async () => { await page.keyboard.press('Escape'); await sleep(450); };
  const scrollTo = async sel => { await page.$eval(sel, e => e.scrollIntoView({ block: 'start' })); await page.evaluate(() => scrollBy(0, -20)); };

  // Lector de boletas: respuesta fija (no gasta cuota de IA), igual a la boleta de ejemplo dibujada abajo
  const ayer = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; })();
  const BOL = { proveedor: 'Supermercado Sur', razonSocial: '', rut: '', fecha: ayer, nDoc: '4512', tipoDoc: 'Boleta', medioPago: 'Débito', categoria: 'super', detalle: 'Víveres para el asado',
    items: [['Fideos spaghetti', 'Fideos spaghetti x4', 4, 1490, 5960], ['Salsa pesto', 'Salsa pesto x2', 2, 3990, 7980], ['Queso parmesano', 'Queso parmesano', 1, 6490, 6490], ['Asado de tira', 'Asado de tira 1,5kg', 1.5, 15933, 23900], ['Chorizo', 'Chorizo x8', 8, 950, 7600], ['Pan marraqueta', 'Pan marraqueta 2kg', 2, 2100, 4200], ['Bebida 3 L', 'Bebidas 3L x4', 4, 2990, 11960], ['Carbón 5 kg', 'Carbón 5kg', 1, 6990, 6990], ['Tomate y cebolla', 'Tomate / cebolla', 1, 4270, 4270], ['Hielo 2 kg', 'Hielo 2kg', 1, 3000, 3000]]
      .map(([nombre, orig, cant, pUnit, total]) => ({ nombre, orig, cant, unidad: /kg/.test(orig) && cant % 1 ? 'kg' : 'un', pUnit, total })),
    neto: 69202, iva: 13148, propina: 0, total: 82350, legible: true, avisos: [] };
  await page.setRequestInterception(true);
  page.on('request', r => {
    if (/viajapp-boletas\..*workers\.dev\/leer/.test(r.url())) {
      const h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'content-type': 'application/json' };
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: h });
      return setTimeout(() => r.respond({ status: 200, headers: h, body: JSON.stringify({ ok: true, model: 'demo', data: BOL, check: { sum: 82350, diff: 0 } }) }), 1500);
    }
    r.continue();
  });
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  await page.evaluate(() => { Sync.idToken = async () => 'demo'; });

  // ---------- Datos de ejemplo ----------
  await page.evaluate(t => localStorage.setItem('viajapp-theme', t), THEME);
  await page.evaluate(async () => {
    const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    // Boleta de ejemplo dibujada
    const c = document.createElement('canvas'); c.width = 600; c.height = 900; const g = c.getContext('2d');
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 600, 900); g.fillStyle = '#222'; g.textAlign = 'center';
    g.font = 'bold 34px monospace'; g.fillText('SUPERMERCADO SUR', 300, 80);
    g.font = '22px monospace'; g.fillText('BOLETA ELECTRÓNICA N° 004512', 300, 125); g.fillText('Pucón · ' + d(-1), 300, 160);
    g.textAlign = 'left'; g.font = '24px monospace';
    [['Fideos spaghetti x4', '5.960'], ['Salsa pesto x2', '7.980'], ['Queso parmesano', '6.490'], ['Asado de tira 1,5kg', '23.900'], ['Chorizo x8', '7.600'], ['Pan marraqueta 2kg', '4.200'], ['Bebidas 3L x4', '11.960'], ['Carbón 5kg', '6.990'], ['Tomate / cebolla', '4.270'], ['Hielo 2kg', '3.000']]
      .forEach(([a, b], i) => { g.fillText(a, 40, 240 + i * 46); g.textAlign = 'right'; g.fillText(b, 560, 240 + i * 46); g.textAlign = 'left'; });
    g.fillRect(40, 720, 520, 3); g.font = 'bold 32px monospace'; g.fillText('TOTAL', 40, 780); g.textAlign = 'right'; g.fillText('$82.350', 560, 780);
    await Store.photos.put('ph_demo', c.toDataURL('image/jpeg', .85));

    const S = Store.state;
    Object.assign(S.trip, {
      name: 'Gira de estudios Pucón', start: d(-2), end: d(4), people: ['Ana', 'Pedro', 'Cami', 'Diego'], budget: 600000, currency: 'CLP',
      entity: 'Universidad Tecnológica Metropolitana',
      responsibles: [{ name: 'Ana Pérez Soto', rut: '12.345.678-9' }, { name: 'Pedro González Mora', rut: '13.456.789-0' }],
      responsible: 'Ana Pérez Soto, Pedro González Mora', rut: '12.345.678-9'
    });
    const sel = {}, add = (c, i, v, extra) => { sel[`${c}|${i}|${v}`] = Object.assign({ c, i, v, q: 1, done: false }, extra || {}); };
    add('despensa', 'Fideos', 'Spaghetti', { n: 440, u: 'g', src: ['Pastas · Pesto'] });
    add('despensa', 'Salsas para pasta', 'Pesto', { n: 1, u: 'un', src: ['Pastas · Pesto'] });
    add('lacteos', 'Queso', 'Parmesano', { n: 80, u: 'g', src: ['Pastas · Pesto'], done: true });
    add('carnes', 'Vacuno', 'Asado de tira', { n: 600, u: 'g', src: ['Asado · Mixto'] });
    add('carnes', 'Embutidos', 'Chorizo', { n: 4, u: 'un', src: ['Asado · Mixto'], done: true });
    add('aceites', 'Aceite', 'Maravilla', { q: 2 });
    add('aceites', 'Aceite', 'Oliva extra virgen');
    add('frutas', 'Palta', 'Hass', { q: 4, done: true });
    add('frutas', 'Plátano', 'Maduro', { q: 6 });
    add('bebestibles', 'Agua', 'Sin gas', { q: 6 });
    add('bebestibles', 'Bebida', 'Coca-Cola', { q: 3, done: true });
    add('alcohol', 'Cerveza', 'Lata', { q: 12 });
    add('limpieza', 'Lavaloza', 'Líquido');
    add('desayuno', 'Café', 'Instantáneo');
    S.shop.sel = sel;
    const now = Date.now();
    S.expenses = [
      { id: 'e1', amount: 240000, cat: 'alojamiento', desc: 'Cabaña 3 noches', date: d(-2), payer: 'Fondo común', method: 'Transferencia', docType: 'Factura', docNum: '2231', photos: [], notes: '', created: now - 9e6 },
      { id: 'e2', amount: 82350, cat: 'super', desc: 'Supermercado Sur', date: d(-1), payer: 'Fondo común', method: 'Débito', docType: 'Boleta', docNum: '004512', photos: ['ph_demo'], notes: '', created: now - 8e6 },
      { id: 'e3', amount: 45990, cat: 'bar', desc: 'Cervezas y papas en el bar', date: d(-1), payer: 'Pedro', among: ['Pedro', 'Diego', 'Ana'], method: 'Crédito', docType: 'Boleta', docNum: '88712', photos: [], notes: '', created: now - 7e6 },
      { id: 'e4', amount: 18000, cat: 'transporte', desc: 'Taxi al volcán', date: d(0), payer: 'Ana', method: 'Efectivo', docType: 'Sin comprobante', docNum: '', photos: [], notes: '', created: now - 6e6 },
      { id: 'e5', amount: 36000, cat: 'actividades', desc: 'Entradas termas', date: d(0), payer: 'Cami', method: 'Débito', docType: 'Ticket / Voucher', docNum: '5512', photos: [], notes: '', created: now - 5e6 },
      { id: 'e6', amount: 12500, cat: 'comida', desc: 'Sopaipillas y café', date: d(0), payer: 'Diego', method: 'Efectivo', docType: 'Boleta', docNum: '771', photos: [], notes: '', created: now - 4e6 }
    ];
    S.events = [
      { id: 'v1', type: 'desayuno', title: 'Huevos revueltos con palta', date: d(0), time: '09:00', place: 'Cabaña', who: 'Cami', notes: '' },
      { id: 'v2', type: 'almuerzo', title: 'Asado · Mixto', date: d(0), time: '14:00', place: 'Quincho de la cabaña', who: 'Pedro y Diego', notes: '', recipe: { id: 'asado', vi: 3, p: 4 } },
      { id: 'v3', type: 'once', title: 'Once con sopaipillas', date: d(0), time: '18:30', place: 'Cabaña', who: 'Ana', notes: '' },
      { id: 'v4', type: 'cena', title: 'Pastas · Pesto', date: d(0), time: '21:00', place: 'Cabaña', who: 'Ana y Cami', notes: '', recipe: { id: 'pastas', vi: 1, p: 4 } },
      { id: 'v5', type: 'actividad', title: 'Trekking al volcán', date: d(1), time: '08:00', place: 'Volcán Villarrica', who: 'Todos', notes: '' },
      { id: 'v6', type: 'cena', title: 'Pizza casera · Margarita', date: d(1), time: '21:00', place: 'Cabaña', who: 'Diego', notes: '' },
      { id: 'v7', type: 'almuerzo', title: 'Cazuela · De ave', date: d(2), time: '14:00', place: 'Cabaña', who: 'Pedro', notes: '' },
      { id: 'v8', type: 'snack', title: 'Tabla de picoteo', date: d(-1), time: '19:00', place: 'Terraza', who: 'Cami', notes: '' }
    ];
    S.trip.diets = { Cami: { tags: ['celiaco'], note: '' }, Diego: { tags: ['vegetariano'], note: 'No le gusta el cilantro' } };
    const pi = {}, pa = (c, i, v, a) => { pi[`${c}|${i}|${v}`] = { c, i, v, a, t: now }; };
    pa('lacteos', 'Queso', 'Parmesano', { g: 80 });
    pa('carnes', 'Embutidos', 'Chorizo', { un: 4 });
    pa('frutas', 'Palta', 'Hass', { un: 4 });
    pa('bebestibles', 'Bebida', 'Coca-Cola', { un: 3 });
    pa('despensa', 'Arroz', 'Grado 1', { g: 1000 });
    pa('despensa', 'Sal', 'Fina', { un: 1 });
    pa('aceites', 'Aceite', 'Maravilla', { un: 1 });
    pa('desayuno', 'Café', 'Instantáneo', { un: 1 });
    pa('despensa', 'Fideos', 'Tallarines', { g: 400 });
    S.pantry = { items: pi };
    // Tu grupo: cosas, piezas y bitácora
    const gi = {}, gadd = (name, e, owner, extra) => { const id = 'g' + Object.keys(gi).length; gi[id] = Object.assign({ id, name, e, owner, qty: 1, brought: false, returned: false, note: '', t: now + Object.keys(gi).length }, extra || {}); };
    gadd('Parlante', '🔊', 'Pedro', { brought: true, note: 'el Bluetooth grande' });
    gadd('Cooler', '🧊', 'Diego', { qty: 2, brought: true });
    gadd('Parrilla', '♨️', 'Pedro');
    gadd('Juegos de mesa', '🎲', 'Cami', { brought: true });
    gadd('Botiquín', '🩹', 'Ana', { brought: true });
    gadd('Alargador', '🔌', 'Ana');
    gadd('Proyector', '📽️', '');
    gadd('Termo y mate', '🧉', '');
    S.gear = { items: gi };
    const bid = () => 'b' + Math.random().toString(36).slice(2, 7);
    S.rooms = {
      list: [
        { id: 'r1', name: 'Pieza principal', beds: [{ id: bid(), type: 'double', who: ['Ana', 'Pedro'], lock: false }] },
        { id: 'r2', name: 'Pieza 2', beds: [{ id: bid(), type: 'single', who: ['Cami'], lock: false }, { id: bid(), type: 'single', who: [], lock: false }] },
        { id: 'r3', name: 'Pieza 3', beds: [{ id: bid(), type: 'bunk_down', who: ['Diego'], lock: true }, { id: bid(), type: 'bunk_up', who: [], lock: false }] },
        { id: 'r4', name: 'Living', beds: [{ id: bid(), type: 'sofa', who: [], lock: false }] }
      ],
      together: [{ a: 'Ana', b: 'Pedro' }]
    };
    const L = (min, who, k, text) => ({ id: 'l' + min, t: now - min * 60e3, who, k, mk: null, n: 1, text });
    S.log = [
      L(2, 'Pedro', 'money', 'registró un gasto de $45.990 (Cervezas y papas en el bar)'),
      L(8, 'Cami', 'shop', 'marcó 6 productos como comprados'),
      L(15, 'Ana', 'group', 'sorteó las camas'),
      L(22, 'Diego', 'group', 'se ofreció a llevar Cooler'),
      L(35, 'Ana', 'agenda', 'agendó cena: “Pastas · Pesto” (11-10 21:00)'),
      L(48, 'Cami', 'recipes', 'agregó 6 ingredientes de “Pastas · Pesto” a la lista'),
      L(70, 'Pedro', 'shop', 'agregó Arroz a la despensa'),
      L(95, 'Ana', 'trip', 'actualizó las dietas del grupo'),
      L(1500, 'Diego', 'money', 'registró un gasto de $240.000 (Cabaña 3 noches)')
    ];
    localStorage.setItem('viajapp-name', '"Ana"');
    localStorage.setItem('viajapp-guide', 'off');   // la guía se fotografía aparte (33)
    Store.save();
  });
  await page.reload({ waitUntil: 'load' }); await sleep(1800);

  // ---------- Inicio ----------
  await shot('01-inicio', 1800);
  await scrollTo('.quick'); await shot('02-inicio-accesos', 900);
  await page.evaluate(() => { const g = document.querySelector('.group-tiles'); g.previousElementSibling.scrollIntoView({ block: 'start' }); scrollBy(0, -20); });
  await shot('26-grupo-inicio', 900);
  await click('.g-tile[data-m="gear"]', 1200); await page.evaluate(() => scrollTo(0, 0)); await shot('27-grupo-cosas');
  await click('[data-act="gMode"][data-m="rooms"]', 1100); await page.evaluate(() => scrollTo(0, 0)); await shot('28-grupo-piezas');
  await page.evaluate(() => { const r = document.querySelectorAll('.room-card')[1]; if (r) r.scrollIntoView({ block: 'start' }); scrollBy(0, -20); }); await shot('29-grupo-piezas-plano', 700);
  await click('.bed.taken', 900); await shot('30-grupo-cama', 700); await esc();
  await click('[data-act="gMode"][data-m="log"]', 1100); await page.evaluate(() => scrollTo(0, 0)); await shot('31-grupo-bitacora');
  await click('.tab[data-tab="home"]', 900);
  // Ayuda simple: guía de próximo paso, botón ? y letra grande
  await page.evaluate(() => { localStorage.setItem('viajapp-guide', ''); location.hash = '#agenda'; });
  await sleep(400); await page.evaluate(() => { location.hash = '#home'; }); await sleep(1200);
  await page.evaluate(() => { const g = document.querySelector('.guide'); g.scrollIntoView({ block: 'center' }); });
  await shot('33-guia-inicio', 800);
  await page.evaluate(() => { localStorage.setItem('viajapp-guide', 'off'); scrollTo(0, 0); location.hash = '#agenda'; });
  await sleep(400); await page.evaluate(() => { location.hash = '#home'; }); await sleep(900);
  await click('.help-btn[data-s="home"]', 900); await shot('34-ayuda', 700);
  await click('[data-act="fontSize"][data-v="1.3"]', 500); await esc();
  await page.evaluate(() => scrollTo(0, 0)); await shot('35-letra-grande', 900);
  await page.evaluate(() => { localStorage.setItem('viajapp-font', '1'); document.documentElement.style.zoom = '1'; });
  await sleep(400);

  // ---------- Súper ----------
  await tab('super'.replace('super', 'shop'));
  await click('[data-act="shopMode"][data-m="catalog"]', 700).catch(() => {});
  await page.evaluate(() => scrollTo(0, 0)); await shot('03-super-catalogo');
  await click('[data-card="aceites|Aceite"]', 900); await shot('04-super-variantes', 700); await esc();
  await click('#cta', 1200); await page.evaluate(() => scrollTo(0, 0)); await shot('05-super-lista');
  await click('[data-act="exp"][data-k="listPNG"]', 4500);
  await click('[data-act="shopMode"][data-m="pantry"]', 1200); await page.evaluate(() => scrollTo(0, 0)); await shot('24-despensa');

  // ---------- Recetas ----------
  await tab('recipes'); await shot('06-recetas');
  await click('[data-act="cook"][data-id="pastas"]', 800);
  await click('[data-act="cookVar"][data-i="1"]', 400);
  await shot('07-receta-cocinar', 700); await esc();
  await click('[data-act="cook"][data-id="asado"]', 800);
  await click('[data-act="cookVar"][data-i="3"]', 400);
  await page.evaluate(() => { const b = document.querySelector('.diet-box'); if (b) b.scrollIntoView({ block: 'start' }); document.getElementById('sheetBody').scrollTop -= 120; });
  await shot('25-receta-adaptada', 700); await esc();
  await click('.fab[data-act="newRecipe"]', 800);
  await page.evaluate(() => {
    document.getElementById('rcName').value = 'Pastas de la abuela';
    const r = document.querySelector('.ing-row[data-s="b"][data-ri="0"]');
    r.querySelector('.ing-t').value = 'Fideos · Tallarines'; r.querySelector('.ing-q').value = '120';
  });
  await click('[data-act="rcAddRow"][data-s="b"]', 300);
  await page.evaluate(() => { const r = document.querySelector('.ing-row[data-s="b"][data-ri="1"]'); r.querySelector('.ing-t').value = 'Salsa de tomate · Pomarola'; r.querySelector('.ing-q').value = '0.3'; r.querySelector('.ing-u').value = 'un'; });
  await click('[data-act="rcAddVar"]', 300);
  await page.evaluate(() => { document.querySelector('.rc-vname').value = 'Con albóndigas'; const r = document.querySelector('.ing-row[data-s="0"][data-ri="0"]'); r.querySelector('.ing-t').value = 'Carne molida · Mixta'; r.querySelector('.ing-q').value = '120'; });
  await page.evaluate(() => { document.getElementById('sheetBody').scrollTop = 0; });
  await shot('08-receta-editor', 600); await esc();

  // ---------- Dinero ----------
  await tab('money'); await shot('09-dinero', 1900);
  await scrollTo('.bars'); await shot('10-dinero-categorias', 1000);
  await page.evaluate(() => { const h = [...document.querySelectorAll('.section-title h2')].find(x => x.textContent.includes('Cuentas claras')); h.scrollIntoView({ block: 'start' }); scrollBy(0, -20); });
  await shot('11-cuentas-claras', 900);
  await page.evaluate(() => scrollTo(0, 0));
  await click('.exp-row[data-id="e2"]', 1000); await page.evaluate(() => { document.getElementById('sheetBody').scrollTop = 0; }); await shot('12-gasto', 800);
  await page.evaluate(() => { const p = document.getElementById('exPhotos'); p.scrollIntoView({ block: 'center' }); }); await shot('13-gasto-foto', 800); await esc();
  // Analizador de boletas
  await click('.exp-row[data-id="e2"]', 1000);
  await page.evaluate(() => { document.getElementById('bolBox').scrollIntoView({ block: 'center' }); }); await shot('36-boleta-boton', 700);
  await click('[data-act="bolRead"]', 600); await shot('37-boleta-leyendo', 200);
  await page.waitForSelector('#bolRows', { timeout: 15000 }); await page.evaluate(() => { document.getElementById('sheetBody').scrollTop = 0; });
  await shot('38-boleta-revisa', 700);
  await page.evaluate(() => { const b = document.getElementById('sheetBody'); b.scrollTop = b.scrollHeight; }); await shot('39-boleta-usar', 600);
  await click('[data-act="bolUse"]', 900); await page.evaluate(() => { document.getElementById('bolBox').scrollIntoView({ block: 'center' }); }); await shot('40-boleta-lista', 900);
  await click('[data-act="saveExpense"]', 1000);
  await page.evaluate(() => scrollTo(0, 0));
  await click('[data-act="planilla"]', 900); await shot('41-planilla', 600);
  await click('[data-act="planillaGo"][data-k="xlsx"]', 3500);
  await click('[data-act="planilla"]', 900); await click('[data-act="planillaGo"][data-k="docx"]', 3500);
  // Cuentas separadas (desde el gasto con la boleta leída)
  await click('.exp-row[data-id="e2"]', 1000);
  await click('[data-act="sepFromExpense"]', 900);
  for (const [s, w] of [['[data-act="sepAll"][data-i="0"]'], ['[data-act="sepAll"][data-i="3"]'], ['[data-act="sepWho"][data-i="1"][data-p="Ana"]'], ['[data-act="sepWho"][data-i="1"][data-p="Cami"]'],
    ['[data-act="sepWho"][data-i="2"][data-p="Pedro"]'], ['[data-act="sepWho"][data-i="4"][data-p="Diego"]'], ['[data-act="sepAll"][data-i="5"]'], ['[data-act="sepAll"][data-i="6"]'], ['[data-act="sepWho"][data-i="7"][data-p="Pedro"]'],
    ['[data-act="sepAll"][data-i="8"]'], ['[data-act="sepAll"][data-i="9"]'], ['[data-act="sepPayer"][data-v="Pedro"]']]) await click(s, 250);
  await page.evaluate(() => { document.getElementById('sheetBody').scrollTop = 0; }); await shot('42-separadas', 700);
  await page.evaluate(() => { document.getElementById('sepRes').scrollIntoView({ block: 'start' }); document.getElementById('sheetBody').scrollTop -= 60; }); await shot('43-separadas-resultado', 700);
  await esc();
  await click('.exp-row[data-id="e3"]', 1000); await page.evaluate(() => { document.getElementById('exAmong').scrollIntoView({ block: 'center' }); }); await shot('32-gasto-entre-algunos', 800); await esc();
  await click('.act[data-act="split"]', 800);
  await page.type('#spTotal', '68000'); await click('[data-act="pick"][data-g="tip"][data-v="10"]', 300);
  await shot('14-dividir', 600); await esc();
  await click('.act[data-act="exp"][data-k="financePDF"]', 4000);

  // ---------- Agenda ----------
  await tab('agenda'); await shot('15-agenda', 1500);
  await scrollTo('#dayBox'); await shot('16-agenda-dia', 900);
  await click('.ev[data-id="v2"]', 900); await shot('17-evento-receta', 700); await esc();

  // ---------- Viaje y compartir ----------
  await tab('home');
  await click('.icon-btn[data-act="trip"]', 900); await shot('18-viaje', 700);
  await page.evaluate(() => { document.querySelector('#rpList').scrollIntoView({ block: 'center' }); }); await shot('19-responsables', 700);
  await click('[data-act="diets"]', 900);
  await page.evaluate(() => { const p = document.querySelectorAll('.diet-person')[2]; if (p) p.scrollIntoView({ block: 'start' }); document.getElementById('sheetBody').scrollTop -= 10; });
  await shot('23-dietas', 700); await esc();
  await click('.share-cta', 900); await shot('20-compartir-crear', 700); await esc();
  await page.evaluate(() => {
    Object.assign(Sync, { active: true, ready: true, tripId: 'Kq3vT8wXr2LmP9sZbN4e', uid: 'u1', status: 'online', members: ['u1', 'u2', 'u3', 'u4'], names: { u1: 'Ana', u2: 'Pedro', u3: 'Cami', u4: 'Diego' } });
    Sync.push = () => {}; Sync.flush = () => {};
  });
  await page.evaluate(() => location.hash = 'agenda'); await sleep(400); await page.evaluate(() => location.hash = 'home'); await sleep(1600);
  await shot('21-inicio-compartido', 300);
  await click('.sync-pill', 900); await shot('22-compartir-qr', 900);
  await esc();
  // Tema Noche (las demás capturas usan el tema de SHOTS_THEME)
  await page.evaluate(() => { localStorage.setItem('viajapp-theme', 'night'); document.documentElement.dataset.theme = 'night'; location.hash = '#agenda'; });
  await sleep(300); await page.evaluate(() => { location.hash = '#home'; scrollTo(0, 0); }); await sleep(900);
  await shot('44-tema-noche', 900);
  await page.evaluate(t => { localStorage.setItem('viajapp-theme', t); document.documentElement.dataset.theme = t; }, THEME);

  await sleep(1000);
  console.log('Descargas:', fs.readdirSync(DL).join(', '));
  console.log('Errores:', errs.length ? errs.join(' / ') : 'ninguno');
  await browser.close();
})();
