/* Chef IA (módulo aparte, solo AGREGA a la app).
   - En Recetas: botón "Chef IA" → hoja con personas, tiempo y antojo (escrito o dictado) → el Worker (Gemini) propone
     3 recetas con lo que hay en la despensa, respetando dietas, alergias y condiciones de salud del grupo.
   - Cada propuesta: lo que falta → lista del súper, agendar, guardar en Mis recetas (con pasos) o abrir la del recetario.
   - Sin internet (o si la IA no responde): ideas del recetario según lo que hay en la despensa.
   app.js le pasa sus herramientas y recibe { ACT }. */
function ChefModule(A) {
  const { S, esc, ic, toast, buzz, confetti, openSheet, refreshSheet, $, norm, cap, key, setDraft, releaseDraft, log,
    groupSize, dietPeople, allRecipes, getRecipe, recipeStatus, recipeIngs, P_, pantryText, ensureCatalogItem, updateBadge,
    openCook, openEvent, RECIPE_MEAL, R_, U, render } = A;
  const WORKER = window.BOLETAS_URL || 'https://viajapp-boletas.viajapp.workers.dev';
  const TIMES = [[0, 'Sin apuro'], [15, '15 min'], [30, '30 min'], [60, '1 hora']];
  // Estado de la hoja (se conserva mientras la app está abierta: al volver se ven las últimas propuestas)
  const st = { p: 0, min: 0, wish: '', view: 'form', res: null, err: '', ideas: null, open: {} };

  /* ---------- Datos que se envían (sin datos personales más allá del nombre de pila que ya está en el viaje) ---------- */
  const pantryList = () => Object.values(P_().items).filter(e => Object.keys(e.a || {}).length)
    .map((e, n) => ({ id: 'p' + (n + 1), e, n: e.i + (e.v ? ' ' + e.v.toLowerCase() : ''), cant: pantryText(e) }));
  const pendingList = () => Object.values(S().shop.sel).filter(r => !r.done).slice(0, 80).map(r => r.i + (r.v ? ' ' + r.v.toLowerCase() : ''));
  function restrictions() {
    const out = dietPeople().map(p => ({
      quien: p.name, dietas: p.tags.filter(t => !Diet.isCond(t)).map(Diet.dietName), salud: p.tags.filter(Diet.isCond).map(Diet.dietName), nota: p.note || ''
    }));
    // Notas de quienes no tienen dieta marcada (ej. "no le gusta el cilantro")
    const d = S().trip.diets || {};
    S().trip.people.forEach(n => { if (d[n] && d[n].note && !out.some(x => x.quien === n)) out.push({ quien: n, dietas: [], salud: [], nota: d[n].note }); });
    return out;
  }

  /* ---------- Llamada al intermediario ---------- */
  async function ask() {
    if (!navigator.onLine) throw Object.assign(new Error('Sin internet'), { offline: true });
    const pl = pantryList();
    const body = {
      personas: st.p, minutos: st.min, antojo: st.wish.trim(),
      despensa: pl.map(x => ({ id: x.id, n: x.n, cant: x.cant })), lista: pendingList(), restricciones: restrictions(),
      recetario: allRecipes().map(r => ({ id: r.id, n: r.n }))
    };
    const token = await Sync.idToken();
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 90000);
    try {
      const r = await fetch(WORKER + '/chef', {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(body)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'El Chef IA no pudo responder');
      j.data.pantry = pl;          // para saber qué ingrediente salió de la despensa
      j.data.p = st.p;
      return j.data;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('El Chef IA tardó demasiado. Intenta de nuevo.');
      throw e;
    } finally { clearTimeout(t); }
  }

  /* ---------- Ingrediente de la IA → producto del catálogo ---------- */
  const stem = w => w.length > 4 ? w.replace(/(es|s)$/, '') : w;
  const words = s => norm(s).replace(/[^a-z0-9ñ% ]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !['de', 'del', 'la', 'el', 'en', 'con', 'para', 'al', 'y'].includes(w)).map(stem);
  let IDX = null;
  function index() {
    if (IDX) return IDX;
    IDX = [];
    CATALOG.forEach(cat => cat.items.forEach(([n, , vs]) => IDX.push({
      c: cat.id, i: n, names: n.split(' / ').map(words), vs: (vs || []).map(v => ({ v, w: words(v) }))
    })));
    return IDX;
  }
  function matchProduct(name) {
    const w = new Set(words(name));
    let best = null;
    index().forEach(it => {
      const nameHit = it.names.some(ws => ws.length && ws.every(x => w.has(x)));
      let vBest = null;
      it.vs.forEach(v => { if (v.w.length && v.w.every(x => w.has(x)) && (!vBest || v.w.length > vBest.w.length)) vBest = v; });
      if (!nameHit && !(vBest && vBest.v.length > 4)) return;
      const score = (nameHit ? 10 : 0) + (vBest ? 5 * vBest.w.length : 0);
      if (!best || score > best.score) best = { c: it.c, i: it.i, v: vBest ? vBest.v : '', score };
    });
    return best && { c: best.c, i: best.i, v: best.v };
  }
  /* Cantidad de la IA → unidades de la app (g, ml, un); el resto queda "fijo" */
  function amountOf(g) {
    if (!(g.cant > 0)) return null;
    if (g.unidad === 'kg') return { n: g.cant * 1000, u: 'g' };
    if (g.unidad === 'l') return { n: g.cant * 1000, u: 'ml' };
    if (['g', 'ml', 'un'].includes(g.unidad)) return { n: g.cant, u: g.unidad };
    return null;
  }
  /* ¿De dónde sale cada ingrediente? despensa (por id o porque el producto ya está) o hay que comprarlo */
  function sourceOf(g, data) {
    const pe = g.despensa && data.pantry.find(x => x.id === g.despensa);
    if (pe) return { have: true, ref: { c: pe.e.c, i: pe.e.i, v: pe.e.v } };
    const ref = matchProduct(g.nombre);
    const inPantry = ref && Object.values(P_().items).some(e => e.c === ref.c && e.i === ref.i && (!ref.v || !e.v || e.v === ref.v));
    return { have: !!inPantry, ref };
  }
  const amtText = g => g.unidad === 'al gusto' ? 'al gusto' : g.unidad === 'pizca' ? 'una pizca'
    : amountOf(g) ? U.amt(amountOf(g).n, amountOf(g).u) : `${String(g.cant).replace('.', ',')} ${g.unidad}`;

  /* ---------- Ideas sin IA: recetas del recetario según lo que hay en la despensa ---------- */
  function localIdeas() {
    const items = Object.values(P_().items);
    const has = g => items.some(e => e.c === g.c && e.i === g.i);
    const want = words(st.wish);
    return allRecipes().filter(r => r.c !== 'tragos').map(r => {
      let best = null;
      (r.vars.length ? r.vars.map((_, i) => i) : [-1]).forEach(vi => {
        const ings = recipeIngs(r, vi).filter(g => g.q), hit = ings.filter(has).length;
        const sc = ings.length ? hit / ings.length : 0;
        if (!best || sc > best.sc) best = { vi, sc, hit, tot: ings.length };
      });
      const s = recipeStatus(r), bonus = want.some(w => words(r.n).includes(w)) ? 0.5 : 0;
      return Object.assign({ r, s }, best, { sc: best.sc + bonus });
    }).filter(x => x.hit > 0 && (!x.s || x.s.s !== 'no')).sort((a, b) => b.sc - a.sc || b.hit - a.hit).slice(0, 4);
  }

  /* ---------- Vistas ---------- */
  function head(sub) {
    return `<div class="sheet-title"><span class="st-ico" style="background:var(--g-peach)">${ic('sparkle')}</span>
      <div><h2>Chef IA</h2><p>${sub}</p></div></div>`;
  }
  function infoBox() {
    const n = pantryList().length, r = restrictions().filter(x => x.dietas.length || x.salud.length).length;
    const txt = n ? `Usaré lo que hay en la despensa (${n} ${n === 1 ? 'producto' : 'productos'})` : 'La despensa está vacía: te propondré recetas fáciles de comprar';
    return `<div class="chef-info">${ic('check')}<span>${txt}${r ? ` y cuidaré las dietas y la salud de ${r} ${r === 1 ? 'persona' : 'personas'}` : ''}.</span></div>`;
  }
  const canDictate = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  function formHTML() {
    return `${head('Te propongo recetas con lo que tienen, respetando las dietas y la salud del grupo')}
      ${infoBox()}
      <div class="chef-row"><span>Personas</span>
        <div class="stepper" style="padding:4px"><button data-act="chefP" data-d="-1" aria-label="Una persona menos">−</button><b style="min-width:44px;font-size:22px">${st.p}</b><button data-act="chefP" data-d="1" aria-label="Una persona más">+</button></div></div>
      <div class="field"><span>Tiempo</span><div class="chips wrap">${TIMES.map(([m, l]) =>
        `<button class="chip ${st.min === m ? 'active' : ''}" style="--c:var(--orange)" data-act="chefMin" data-m="${m}">${l}</button>`).join('')}</div></div>
      <label class="field"><span>¿Qué se te antoja? <small style="color:var(--muted);font-weight:500">(opcional)</small></span>
        <input id="chefWish" value="${esc(st.wish)}" placeholder="Ej: algo calentito, sin horno, para el asado…" autocomplete="off" maxlength="200"></label>
      ${canDictate() ? `<button class="btn block" style="margin:-4px 0 12px" data-act="chefDictate" id="chefMic">${ic('mic')} Dictar</button>` : ''}
      <button class="btn primary block shine" data-act="chefGo">${ic('sparkle')} Proponer recetas</button>
      ${st.res ? `<button class="btn block" style="margin-top:10px" data-act="chefBack">Ver las últimas propuestas</button>` : ''}
      <p class="hint" style="margin-top:12px">Las sugerencias de salud son generales y no reemplazan la indicación de un médico o nutricionista.</p>`;
  }
  function loadingHTML() {
    return `${head('Buscando ideas para ' + st.p + ' personas')}
      <div class="bol-loading"><span class="bol-spin"></span><p>El chef está revisando la despensa y las dietas del grupo…</p></div>`;
  }
  function recipeCard(r, i, data) {
    const src = r.ingredientes.map(g => Object.assign({ g }, sourceOf(g, data)));
    const fromPantry = src.filter(x => x.have).length, buy = src.length - fromPantry;
    const base = r.base && getRecipe(r.base), open = st.open[i];
    return `<div class="chef-card">
      <div class="cc-head"><span class="cc-e">${esc(r.emoji)}</span><div><b>${esc(r.nombre)}</b>
        <div class="cc-meta"><span>${ic('clock')} ${r.minutos} min</span><span>${esc(r.dificultad)}</span><span>${fromPantry} de ${src.length} en la despensa</span></div></div></div>
      ${r.porQue ? `<p class="cc-why">${esc(r.porQue)}</p>` : ''}
      ${r.adaptaciones.map(a => `<div class="cc-line">${ic('leaf')}<span>${esc(a)}</span></div>`).join('')}
      ${r.salud ? `<div class="cc-line care">${ic('heart')}<span>${esc(r.salud)}</span></div>` : ''}
      <button class="cc-toggle" data-act="chefOpen" data-i="${i}">${open ? 'Ocultar' : 'Ver'} ingredientes y preparación</button>
      ${open ? `<div class="cc-ings">${src.map(x => `<div class="cc-ing ${x.have ? 'have' : ''}"><span>${esc(x.g.nombre)}</span><small>${esc(amtText(x.g))}</small><i>${x.have ? 'en despensa' : 'comprar'}</i></div>`).join('')}</div>
        <ol class="cc-steps">${r.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>` : ''}
      ${r.tip ? `<div class="cc-tip">${ic('sparkle')}<span>${esc(r.tip)}</span></div>` : ''}
      <div class="cc-actions">
        ${buy ? `<button class="btn sm primary" data-act="chefList" data-i="${i}">${ic('cart')} Lo que falta a la lista (${buy})</button>` : `<span class="cc-ok">${ic('check')} Tienen todo</span>`}
        <button class="btn sm" data-act="chefAgenda" data-i="${i}">${ic('calendar')} Agendar</button>
        <button class="btn sm" data-act="chefSave" data-i="${i}">${ic('star')} Guardar en Mías</button>
        ${base ? `<button class="btn sm" data-act="chefBase" data-i="${i}">${ic('book')} Ver “${esc(base.n)}”</button>` : ''}
      </div>
    </div>`;
  }
  function resultsHTML() {
    const d = st.res;
    return `${head(`Propuestas para ${d.p} ${d.p === 1 ? 'persona' : 'personas'}`)}
      ${d.intro ? `<p class="chef-intro">${esc(d.intro)}</p>` : ''}
      ${d.recetas.map((r, i) => recipeCard(r, i, d)).join('')}
      <div class="btn-row" style="margin-top:6px">
        <button class="btn" data-act="chefGo">${ic('sparkle')} Otras ideas</button>
        <button class="btn" data-act="chefForm">${ic('edit')} Cambiar</button>
      </div>
      <p class="hint" style="margin-top:10px">Propuestas generadas con IA: revisa los ingredientes antes de cocinar, sobre todo si hay alergias.</p>`;
  }
  function ideasHTML() {
    const list = st.ideas || [];
    return `${head('Ideas del recetario con lo que tienen')}
      <div class="chef-info warn">${ic('alert')}<span>${esc(st.err || 'Sin conexión')}. Mientras tanto, estas recetas del recetario aprovechan tu despensa${dietPeople().length ? ' y son aptas para el grupo' : ''}.</span></div>
      ${list.length ? list.map(x => `<button class="chef-idea" data-act="chefIdea" data-id="${esc(x.r.id)}" data-vi="${x.vi}">
          <span class="cc-e">${x.r.e}</span><span><b>${esc(x.r.n)}${x.vi >= 0 ? ' · ' + esc(x.r.vars[x.vi].n) : ''}</b><small>Usa ${x.hit} de ${x.tot} ingredientes de tu despensa</small></span>${ic('arrow')}</button>`).join('')
        : `<p class="hint">Agrega productos a la despensa (Súper → Despensa) para recibir ideas sin internet.</p>`}
      <button class="btn block" style="margin-top:12px" data-act="chefForm">Volver</button>`;
  }
  function html() {
    return st.view === 'loading' ? loadingHTML() : st.view === 'res' && st.res ? resultsHTML() : st.view === 'ideas' ? ideasHTML() : formHTML();
  }

  /* ---------- Acciones ---------- */
  const keepWish = () => { const el = $('#chefWish'); if (el) st.wish = el.value; };
  let rec = null;
  async function go() {
    keepWish();
    st.view = 'loading'; st.open = {}; refreshSheet();
    try {
      const data = await ask();
      if (st.view !== 'loading') return;            // el usuario cerró o volvió
      st.res = data; st.view = 'res';
      buzz([10, 30, 10]);
      log('recipes', `le pidió ideas al Chef IA para ${st.p} personas`, 'chef');
    } catch (e) {
      if (st.view !== 'loading') return;
      st.err = e.offline ? 'Sin internet' : e.message;
      st.ideas = localIdeas(); st.view = 'ideas';
    }
    refreshSheet();
  }
  const cur = el => st.res && st.res.recetas[+el.dataset.i];
  const label = r => 'Chef IA · ' + r.nombre;

  function addMissing(r) {
    const sel = S().shop.sel;
    let n = 0;
    r.ingredientes.forEach(g => {
      const s = sourceOf(g, st.res);
      if (s.have) return;
      const ref = s.ref || { c: 'despensa', i: cap(g.nombre.trim()), v: '' };
      const c = ensureCatalogItem(ref.c, ref.i, ref.v), k = key(c, ref.i, ref.v);
      let e = sel[k];
      if (!e || e.done) e = sel[k] = { c, i: ref.i, v: ref.v, q: 1, done: false };
      const a = amountOf(g);
      if (a) { if (e.u === a.u) e.n = (e.n || 0) + a.n; else if (!e.u) { e.n = a.n; e.u = a.u; } }
      e.src = [...new Set((e.src || []).concat(label(r)))];
      n++;
    });
    return n;
  }
  /* Guarda la propuesta como receta propia: cantidades por persona y los pasos */
  function saveRecipe(r) {
    const p = st.res.p || 1;
    const base = r.ingredientes.map(g => {
      const s = sourceOf(g, st.res), ref = s.ref || { c: 'despensa', i: cap(g.nombre.trim()), v: '' }, a = amountOf(g);
      const c = ensureCatalogItem(ref.c, ref.i, ref.v);
      return a ? { c, i: ref.i, v: ref.v, q: Math.round(a.n / p * 10) / 10 || 0.1, u: a.u } : { c, i: ref.i, v: ref.v, q: 0, u: '' };
    });
    const id = 'u_' + Store.uid();
    R_().custom[id] = { id, n: cap(r.nombre), e: r.emoji || '🍽️', c: r.categoria || 'chilena', big: p >= 15, base, vars: [], steps: r.pasos.slice(), chef: true };
    return id;
  }

  const ACT = {
    chef: () => {
      const gs = groupSize();
      if (!st.p) st.p = gs.all > 1 ? gs.all : 4;
      if (st.view === 'loading') st.view = 'form';
      const mine = { _kind: 'chef' }; setDraft(mine);
      buzz(8); openSheet(html, releaseDraft(mine));
    },
    chefP: el => { keepWish(); st.p = Math.max(1, Math.min(200, st.p + +el.dataset.d)); buzz(6); refreshSheet(); },
    chefMin: el => { keepWish(); st.min = +el.dataset.m; buzz(6); refreshSheet(); },
    chefGo: () => go(),
    chefForm: () => { st.view = 'form'; refreshSheet(); },
    chefBack: () => { keepWish(); st.view = 'res'; refreshSheet(); },
    chefOpen: el => { st.open[el.dataset.i] = !st.open[el.dataset.i]; buzz(6); refreshSheet(); },
    chefDictate: () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      if (rec) { rec.stop(); return; }
      keepWish();
      rec = new SR(); rec.lang = 'es-CL'; rec.interimResults = false; rec.maxAlternatives = 1;
      const btn = $('#chefMic'); if (btn) { btn.classList.add('rec'); btn.innerHTML = `${ic('mic')} Escuchando… toca para terminar`; }
      rec.onresult = e => { const t = e.results[0][0].transcript; st.wish = (st.wish ? st.wish.trim() + ' ' : '') + t; };
      rec.onerror = e => { if (e.error === 'not-allowed') toast('Permite el micrófono para dictar'); };
      rec.onend = () => { rec = null; refreshSheet(); };
      rec.start();
    },
    chefList: el => {
      const r = cur(el); if (!r) return;
      const n = addMissing(r);
      log('shop', `agregó a la lista lo que falta para “${r.nombre}” (Chef IA)`, 'listAdd');
      Store.save(); updateBadge(); buzz([10, 30, 10]);
      toast(n ? `${n} ${n === 1 ? 'ingrediente' : 'ingredientes'} en tu lista` : 'Ya tienen todo');
    },
    chefAgenda: el => {
      const r = cur(el); if (!r) return;
      const base = r.base && getRecipe(r.base);
      const notes = `${r.porQue}\n\nIngredientes (${st.res.p} personas):\n${r.ingredientes.map(g => `- ${g.nombre}: ${amtText(g)}`).join('\n')}\n\nPreparación:\n${r.pasos.map((p, i) => `${i + 1}. ${p}`).join('\n')}${r.adaptaciones.length ? '\n\nAdaptaciones:\n' + r.adaptaciones.map(a => '- ' + a).join('\n') : ''}`;
      openEvent(null, RECIPE_MEAL[r.categoria] || 'almuerzo', Object.assign({ title: r.nombre, notes: notes.slice(0, 2000) },
        base ? { recipe: { id: base.id, vi: 0, p: st.res.p, mode: 'portion' } } : {}));
    },
    chefSave: el => {
      const r = cur(el); if (!r) return;
      saveRecipe(r);
      log('recipes', `guardó la receta “${cap(r.nombre)}” del Chef IA`);
      Store.save(); render(false); buzz([10, 30, 10]); confetti(innerWidth / 2, innerHeight / 3, 40, 1);
      toast('Guardada en Mías, con sus pasos');
    },
    chefBase: el => { const r = cur(el); if (r && r.base) openCook(r.base, 0, st.res.p); },
    chefIdea: el => openCook(el.dataset.id, Math.max(0, +el.dataset.vi), st.p)
  };
  return { ACT };
}
