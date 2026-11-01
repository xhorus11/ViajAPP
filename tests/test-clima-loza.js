/* Sesión 21: ruleta de tareas (¿quién lava la loza?), clima del destino, personas extra y recetas nuevas.
   El clima usa Open-Meteo de verdad (necesita internet).
   Uso: node tests/test-clima-loza.js [URL] [carpeta capturas]  */
const puppeteer = require('puppeteer-core');
const path = require('path');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const OUT = process.argv[3] || path.join(__dirname, 'out-clima');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.VIAJAPP_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  const txt = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }, sel);
  const tap = async (sel, ms = 600) => { await p.evaluate(s => document.querySelector(s).click(), sel); await sleep(ms); };
  await p.goto(URL, { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('viajapp-guide', 'off'); });
  await p.reload({ waitUntil: 'load' }); await sleep(1300);

  // ---------- Hoja del viaje: destino y personas extra ----------
  await tap('[data-act="trip"]', 800);
  const today = await p.evaluate(() => Store.today());
  await p.evaluate(t => {
    document.getElementById('tpName').value = 'Cabaña en Pucón';
    document.getElementById('tpStart').value = t;
    const e = new Date(); e.setDate(e.getDate() + 3);
    document.getElementById('tpEnd').value = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}-${String(e.getDate()).padStart(2, '0')}`;
    document.getElementById('tpPeople').value = 'Ana, Pedro, Cami, Nico, Sofi, Tomás, Vale, Benja';
    document.getElementById('tpPlace').value = 'Pucón';
    document.getElementById('tpGuests').value = '3';
  }, today);
  await tap('[data-act="saveTrip"]', 900);
  const trip = await p.evaluate(() => Store.state.trip);
  ok(trip.place === 'Pucón' && trip.guests === 3, `Se guardan destino y personas extra (${trip.place}, ${trip.guests})`);
  ok(/8 \+3/.test(await txt('.hero .trip-meta')), 'La tarjeta del viaje muestra "8 +3"');

  // ---------- Clima ----------
  ok(!!(await p.$('#wxPill')), 'La tarjeta del viaje tiene el botón del clima');
  await p.waitForFunction(() => /Hoy/.test((document.getElementById('wxPill') || {}).textContent || ''), { timeout: 20000 }).catch(() => {});
  const pill = await txt('#wxPill');
  ok(/Hoy\s*-?\d+°\s*\/\s*-?\d+°/.test(pill), `El botón muestra la temperatura de hoy (${pill})`);
  await tap('#wxPill', 1200);
  await p.waitForSelector('.wx-day', { timeout: 20000 }).catch(() => {});
  const nDays = await p.$$eval('.wx-day', x => x.length);
  ok(nDays === 4, `Pronóstico para los 4 días del viaje (${nDays})`);
  ok(/Pucón/.test(await txt('.sheet-title h2')) && /Chile/.test(await txt('.sheet-title p')), `Encuentra el destino en Chile (${await txt('.sheet-title p')})`);
  ok(/Open-Meteo/.test(await txt('.wx-src')), 'Cita la fuente de los datos');
  await shot('clima');
  // Viaje lejano: el año pasado
  await p.evaluate(() => { document.getElementById('wxPlace').value = 'Temuco'; });
  await p.evaluate(() => { const t = Store.state.trip, d = new Date(); d.setDate(d.getDate() + 60); const s = d.toISOString().slice(0, 10); d.setDate(d.getDate() + 2); t.start = s; t.end = d.toISOString().slice(0, 10); });
  await tap('[data-act="wxSet"]', 500);
  await p.waitForFunction(() => /año pasado/.test(document.getElementById('sheetBody').textContent) && document.querySelectorAll('.wx-day').length, { timeout: 20000 }).catch(() => {});
  ok(/año pasado/.test(await txt('#sheetBody')) && (await p.$$eval('.wx-day', x => x.length)) === 3, 'Viaje en 2 meses: muestra el clima de esas fechas el año pasado (3 días)');
  ok((await p.evaluate(() => Store.state.trip.place)) === 'Temuco', 'Cambiar el destino desde la hoja lo guarda en el viaje');
  await shot('clima-ano-pasado');
  // Lugar inexistente
  await p.evaluate(() => { document.getElementById('wxPlace').value = 'Zzqxwy Inexistente'; });
  await tap('[data-act="wxSet"]', 500);
  await p.waitForSelector('.wx-err', { timeout: 15000 }).catch(() => {});
  ok(/No encontramos/.test(await txt('.wx-err')), 'Lugar que no existe: aviso claro');
  await p.evaluate(() => { document.getElementById('wxPlace').value = 'Pucón'; });
  await tap('[data-act="wxSet"]', 300);
  await p.evaluate(t => { Object.assign(Store.state.trip, { start: t, end: t }); Store.save(); }, today);
  await p.keyboard.press('Escape'); await sleep(600);

  // ---------- Ruleta de tareas ----------
  await p.evaluate(() => { location.hash = '#agenda'; }); await sleep(300); await p.evaluate(() => { location.hash = '#home'; }); await sleep(800);
  ok(/Quién lava la loza/.test(await txt('[data-act="gChore"]')), 'Tu grupo tiene el mosaico "¿Quién lava la loza?"');
  await tap('[data-act="gChore"]', 700);
  ok((await p.$$eval('[data-act="gChoreWho"].active', x => x.length)) === 8, 'Participan los 8 de la lista por defecto');
  await tap('[data-act="gChoreWho"][data-p="Benja"]', 300);
  ok((await p.$$eval('[data-act="gChoreWho"].active', x => x.length)) === 7, 'Se puede sacar a alguien del sorteo');
  await tap('[data-act="gChoreSpin"]', 300);
  await shot('ruleta-girando');
  await p.waitForSelector('.chore-win', { timeout: 8000 });
  const win1 = await txt('.chore-win b');
  ok(!!win1 && win1 !== 'Benja', `Sale elegido alguien (${win1})`);
  await shot('ruleta-resultado');
  // Por turnos: 7 giros seguidos = cada uno una vez
  const wins = [win1];
  for (let i = 0; i < 6; i++) {
    await p.waitForFunction(() => !document.querySelector('.roulette'), { timeout: 8000 });
    await tap('[data-act="gChoreSpin"]', 200);
    await p.waitForFunction(n => document.querySelectorAll('.list-row .rn').length >= Math.min(5, n), { timeout: 8000 }, i + 2);
    await p.waitForFunction(() => !document.querySelector('.roulette'), { timeout: 8000 });
    wins.push(await txt('.chore-win b'));
  }
  ok(new Set(wins).size === 7, `Por turnos: en 7 giros le tocó a los 7 una vez (${wins.join(', ')})`);
  const log = await p.evaluate(() => Store.state.log.filter(e => e.x).length);
  ok(log === 7, `Cada sorteo queda en la bitácora (${log})`);
  await tap('[data-act="gChoreTask"][data-t="basura"]', 300);
  ok(/Sacar la basura/.test(await txt('[data-act="gChoreTask"].active')), 'Se puede sortear otra tarea (sacar la basura)');
  await p.keyboard.press('Escape'); await sleep(700);
  ok(/Hoy:/.test(await txt('[data-act="gChore"]')), `El mosaico muestra a quién le tocó hoy (${await txt('[data-act="gChore"] small')})`);

  // ---------- Recetas ----------
  await p.evaluate(() => { location.hash = '#recipes'; }); await sleep(900);
  const total = await p.evaluate(() => RECIPES.length);
  ok(total >= 146, `Recetario con ${total} recetas`);
  await tap('[data-act="rcat"][data-c="big"]', 700);
  const big = await p.$$eval('#recGrid .item-card[data-act="cook"]', x => x.length);
  ok(big >= 60, `Filtro "Para grupos grandes" (${big} recetas)`);
  await shot('recetas-grupos');
  await tap('[data-act="rcat"][data-c="vegan"]', 700);
  const vegan = await p.$$eval('#recGrid .item-card[data-act="cook"]', x => x.map(e => e.textContent));
  ok(vegan.length >= 25 && !vegan.some(t => /Piscola|Mojito/.test(t)), `Filtro "Veganas" (${vegan.length}, sin tragos)`);
  ok(vegan.some(t => /Vegana: Veganas de champiñón/.test(t)), 'La tarjeta dice cuál variante es vegana (empanadas)');
  await tap('#recGrid .item-card[data-id="empanadas"]', 900);
  ok(/Veganas de champiñón/.test(await txt('[data-act="cookVar"].active')), 'Al abrirla queda elegida la variante vegana');
  await p.keyboard.press('Escape'); await sleep(600);
  await tap('[data-act="rcat"][data-c="veg"]', 700);
  ok((await p.$$eval('#recGrid .item-card[data-act="cook"]', x => x.length)) > vegan.length, 'Filtro "Vegetarianas" (más que veganas)');

  // ---------- Hoja cocinar: grupo + extra y escala para grupos grandes ----------
  await p.evaluate(() => document.querySelector('[data-act="rcat"][data-c="all"]').click()); await sleep(500);
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'cook'; b.dataset.id = 'arrozpollo'; document.body.appendChild(b); b.click(); b.remove(); }); await sleep(900);
  ok((await txt('.stepper b')) === '11', 'Para cuántas personas: 8 de la lista + 3 extra = 11');
  ok(/8 en la lista/.test(await txt('.cook-group')) && /extra/.test(await txt('.cook-group')), 'La hoja muestra el grupo y las personas extra');
  await tap('[data-act="cookGuest"][data-d="1"]', 400); await tap('[data-act="cookGuest"][data-d="1"]', 400);
  await tap('[data-act="cookGuest"][data-d="1"]', 400); await tap('[data-act="cookGuest"][data-d="1"]', 400);
  ok((await txt('.stepper b')) === '15' && (await p.evaluate(() => Store.state.trip.guests)) === 7, 'Sumar extra desde la hoja sube las personas y se guarda en el viaje (15)');
  const rows = await p.$$eval('.variant-row', x => x.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  const salt = rows.find(t => /Caldos/.test(t)) || '';
  ok(/x2$/.test(salt), `Lo que se compra una vez se multiplica para 15 personas (${salt})`);
  ok(/1 por cada 10/.test(await txt('#sheetBody')), 'Aviso: para grupos grandes los condimentos se calculan 1 por cada 10');
  ok(/rinde para grupos grandes/.test(await txt('.sheet-title p')), 'La receta dice que rinde para grupos grandes');
  await shot('cocinar-grupo');
  await tap('[data-act="cookAdd"]', 900);
  const caldo = await p.evaluate(() => Object.values(Store.state.shop.sel).find(r => r.i === 'Sopas'));
  ok(caldo && caldo.q === 2, `En la lista: caldos x2 (${caldo && caldo.q})`);
  const arroz = await p.evaluate(() => Object.values(Store.state.shop.sel).find(r => r.i === 'Arroz'));
  ok(arroz && Math.round(arroz.n) === 1350 && arroz.u === 'g', `Arroz para 15: 1.350 g (${arroz && arroz.n} ${arroz && arroz.u})`);

  // ---------- Plantilla copia destino y extra ----------
  const tpl = await p.evaluate(() => { const t = Store.state.trip; return { place: t.place, guests: t.guests }; });
  ok(tpl.place === 'Pucón' && tpl.guests === 7, 'Destino y extra quedan en el viaje para las plantillas');

  ok(!errs.length, 'Sin errores en la consola' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
  console.log(fails ? `\n${fails} FALLAS` : '\nTODO OK');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
