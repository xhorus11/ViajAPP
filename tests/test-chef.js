/* Sesión 23: Chef IA (Worker real con Gemini) + condiciones de salud en dietas y recetas.
   Uso: node tests/test-chef.js [URL] [carpeta capturas]   (necesita internet; gasta ~1 consulta del Chef IA) */
const puppeteer = require('puppeteer-core');
const path = require('path');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const OUT = process.argv[3] || path.join(__dirname, 'out-chef');
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
  const close = async () => { await p.keyboard.press('Escape'); await sleep(700); };
  // Abre una receta con el mismo camino que una tarjeta (botón con data-act="cook")
  const cook = async id => { await p.evaluate(id => { const b = document.createElement('button'); b.dataset.act = 'cook'; b.dataset.id = id; document.getElementById('view').appendChild(b); b.click(); b.remove(); }, id); await sleep(900); };
  await p.goto(URL, { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('viajapp-guide', 'off'); });
  await p.reload({ waitUntil: 'load' }); await sleep(1300);

  // ---------- Viaje con dietas, condiciones de salud y despensa ----------
  await p.evaluate(() => {
    const s = Store.state, t = s.trip;
    t.name = 'Cabaña en Pucón'; t.people = ['Ana', 'Cami', 'Luis', 'Pedro'];
    t.diets = { Cami: { tags: ['celiaco'], note: '' }, Luis: { tags: ['diabetes'], note: '' }, Pedro: { tags: ['hipertension'], note: 'no le gusta el cilantro' } };
    s.pantry = { items: {} };
    const add = (c, i, v, n, u) => { s.pantry.items[`${c}|${i}|${v}`] = { c, i, v, a: { [u]: n }, t: Date.now() }; };
    add('despensa', 'Fideos', 'Spaghetti', 1000, 'g'); add('despensa', 'Salsa de tomate', 'Pomarola', 2, 'un');
    add('carnes', 'Carne molida', '7% grasa', 800, 'g'); add('verduras', 'Cebolla', 'Blanca', 4, 'un');
    add('verduras', 'Papa', 'Blanca', 2000, 'g'); add('lacteos', 'Huevos', 'Bandeja 12', 12, 'un'); add('verduras', 'Zapallo italiano', '', 3, 'un');
    Store.save();
  });
  await p.evaluate(() => { location.hash = '#recipes'; }); await sleep(900);
  ok(!!(await p.$('.chef-btn')), 'Recetas tiene el botón Chef IA');

  // ---------- Hoja de dietas: condiciones de salud ----------
  await tap('[data-act="diets"]', 800);
  ok(/Condiciones de salud/.test(await txt('#sheetBody')), 'La hoja de dietas tiene la sección Condiciones de salud');
  const active = await p.$$eval('.chip.active[data-act="dietTog"]', x => x.map(e => e.dataset.p + ':' + e.dataset.t));
  ok(active.includes('Luis:diabetes') && active.includes('Pedro:hipertension'), `Diabetes e hipertensión marcadas (${active.join(', ')})`);
  ok(/médico/.test(await txt('#sheetBody')), 'Aviso de que son recomendaciones generales');
  await shot('dietas-salud');
  await close();

  // ---------- Recetas: azúcar → endulzante para Luis; aviso de sodio para Pedro ----------
  const ids = await p.evaluate(() => {
    const has = (r, f) => r.base.concat(...r.vars.map(v => v.ing)).some(f);
    const sweet = RECIPES.find(r => r.c === 'postres' && has(r, g => g.i === 'Azúcar'));
    const salty = RECIPES.find(r => r.base.some(g => g.i === 'Sopas' && g.v === 'Caldos en cubo'));
    return { sweet: sweet && sweet.id, salty: salty && salty.id };
  });
  await cook(ids.sweet);
  const sweetBox = await txt('.diet-box');
  ok(/Luis/.test(sweetBox) && /endulzante/i.test(sweetBox), `Postre (${ids.sweet}): azúcar → endulzante para Luis`);
  await close();
  await cook(ids.salty);
  const saltyBox = await txt('.diet-box');
  ok(/Pedro/.test(saltyBox) && /sodio/.test(saltyBox) && !!(await p.$('.db-line.care')), `Con caldo en cubo (${ids.salty}): aviso de sodio para Pedro`);
  await shot('receta-salud');
  await close();

  // ---------- Chef IA con el Worker real ----------
  await tap('.chef-btn', 900);
  ok(/7 productos/.test(await txt('.chef-info')) && /3 personas/.test(await txt('.chef-info')), `Aviso: usa la despensa y cuida a 3 personas (${await txt('.chef-info')})`);
  ok(/^\s*4\s*$/.test(await txt('.chef-row .stepper b')), 'Parte con las 4 personas del grupo');
  await tap('[data-act="chefMin"][data-m="60"]', 300);
  await p.evaluate(() => { document.getElementById('chefWish').value = 'algo calentito para la noche'; });
  await shot('chef-form');
  await tap('[data-act="chefGo"]', 300);
  ok(!!(await p.$('.bol-loading')), 'Muestra que el chef está pensando');
  await p.waitForSelector('.chef-card, .chef-idea, .chef-info.warn', { timeout: 90000 }).catch(() => {});
  const cards = await p.$$eval('.chef-card', x => x.length);
  ok(cards === 3, `El Chef IA propone 3 recetas (${cards}) ${cards ? '' : await txt('#sheetBody')}`);
  const res = await p.evaluate(() => {
    const t = document.getElementById('sheetBody').textContent;
    return { meta: [...document.querySelectorAll('.cc-meta')].map(e => e.textContent), cami: /Cami/.test(t) };
  });
  ok(res.meta.every(m => /min/.test(m) && /en la despensa/.test(m)), 'Cada propuesta tiene tiempo y cuánto usa de la despensa');
  ok(res.meta.some(m => !/^.*\b0 de/.test(m)), 'Al menos una propuesta usa productos de la despensa');
  ok(res.cami, 'Las propuestas mencionan la adaptación para Cami (celíaca)');
  await shot('chef-resultados');
  await tap('[data-act="chefOpen"][data-i="0"]', 500);
  const steps = await p.$$eval('.cc-steps li', x => x.length), ings = await p.$$eval('.cc-ing', x => x.length);
  ok(steps >= 3 && ings >= 3, `Se ven ingredientes (${ings}) y pasos (${steps})`);
  await shot('chef-detalle');

  // Lo que falta → lista
  const before = await p.evaluate(() => Object.keys(Store.state.shop.sel).length);
  const hasBuy = await p.$('[data-act="chefList"][data-i="0"]');
  if (hasBuy) {
    await tap('[data-act="chefList"][data-i="0"]', 600);
    const after = await p.evaluate(() => ({ n: Object.keys(Store.state.shop.sel).length, src: Object.values(Store.state.shop.sel).some(r => (r.src || []).some(x => /Chef IA/.test(x))) }));
    ok(after.n > before && after.src, `Lo que falta pasa a la lista con origen "Chef IA" (${before} → ${after.n})`);
  } else ok(/Tienen todo/.test(await txt('.chef-card')), 'La primera propuesta no necesita compras');

  // Guardar en Mías (con pasos)
  await tap('[data-act="chefSave"][data-i="0"]', 700);
  const saved = await p.evaluate(() => Object.values(Store.state.recipes.custom).find(r => r.chef));
  ok(saved && saved.steps.length >= 3 && saved.base.length >= 3, `Se guarda en Mías con ingredientes y pasos (${saved && saved.n})`);
  const cats = await p.evaluate(() => CATALOG.map(c => c.id));
  ok(saved && saved.base.every(g => cats.includes(g.c)), 'Los ingredientes quedan en categorías del catálogo');
  console.log('   ', saved.base.map(g => `${g.c}|${g.i}|${g.v} ${g.q || 'fijo'}${g.u || ''}`).join('; '));

  // Agendar
  await tap('[data-act="chefAgenda"][data-i="1"]', 900);
  const evTitle = await p.evaluate(() => (document.getElementById('evTitle') || {}).value || '');
  const evNotes = await p.evaluate(() => (document.getElementById('evNotes') || {}).value || '');
  ok(evTitle.length > 3 && /Preparación/.test(evNotes), `Agendar abre la comida con título y preparación (${evTitle})`);
  await close();

  // La receta guardada muestra la preparación al cocinar
  await cook(saved.id);
  ok(!!(await p.$('.steps-box')), 'La receta guardada muestra "Preparación" al cocinar');
  await close();

  // ---------- Sin internet: ideas del recetario ----------
  await p.setOfflineMode(true);
  await tap('.chef-btn', 800);
  await tap('[data-act="chefForm"]', 300).catch(() => {});
  await tap('[data-act="chefGo"]', 1200);
  const ideas = await p.$$eval('.chef-idea', x => x.length);
  ok(/Sin internet/.test(await txt('.chef-info.warn')) && ideas > 0, `Sin internet propone recetas del recetario con la despensa (${ideas})`);
  await shot('chef-sin-internet');
  await tap('.chef-idea', 900);
  ok(!!(await p.$('.diet-box, [data-act="cookAdd"]')), 'La idea abre la receta para cocinar');
  await p.setOfflineMode(false);

  ok(!errs.length, 'Sin errores en la consola' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
  console.log(fails ? `\n${fails} FALLAS` : '\nTODO OK');
  process.exit(fails ? 1 : 0);
})();
