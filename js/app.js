/* Viajapp · lógica de interfaz */
(function () {
  'use strict';
  const S = () => Store.state;
  const esc = U.esc, money = U.money;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = $('#view');
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p || 12); } catch (e) { /* sin vibración */ } };
  const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  /* Íconos de línea (estilo Lucide): la interfaz usa SVG; los emojis quedan solo como contenido (productos, recetas, categorías) */
  const ICONS = {
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.4"/><circle cx="17" cy="20.5" r="1.4"/>',
    wallet: '<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19"/><circle cx="16.5" cy="14.5" r="1.4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    pot: '<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 11h20M9 7.5c0-1.2 1.2-1.6 0-3.5M13 7.5c0-1.2 1.2-1.6 0-3.5M17 7.5c0-1.2 1.2-1.6 0-3.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h8"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    edit: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
    help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.9-2.6 2.3-2.6 4"/><path d="M12 17.4v.1"/>',
    text: '<path d="M4 7V5h11v2M9.5 5v14M7 19h5M14 12v-1.5h7V12M17.5 10.5V19M16 19h3"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };
  const ic = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  const bounce = el => el && el.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 380, easing: SPRING });

  const ui = { tab: 'home', shopMode: 'catalog', shopCat: 'all', q: '', recCat: 'all', recQ: '', selDate: Store.today(), calMonth: null, installEvt: null };
  const FUND = 'Fondo común';
  { const d = U.parseDate(ui.selDate); ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1); }
  let draft = null;
  /* Al cerrar una hoja solo se libera su propio borrador (otra hoja pudo haberlo reemplazado) */
  const releaseDraft = mine => () => { if (draft === mine) draft = null; };
  const photoCache = {};

  /* ================= Toast ================= */
  function toast(msg, ms) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms || 2200);
  }

  /* ================= Confeti ================= */
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], raf = 0;
  const COLORS = ['#7dd3fc', '#0ea5e9', '#2dd4bf', '#a5b4fc', '#6366f1', '#fdba74', '#ffffff'];   // confeti (lienzo: colores reales)
  function sizeCv() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  sizeCv(); addEventListener('resize', sizeCv);
  function confetti(x, y, n, spread) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = devicePixelRatio; spread = spread || 1;
    x = x == null ? innerWidth / 2 : x; y = y == null ? innerHeight / 3 : y;
    for (let i = 0; i < (n || 40); i++) {
      const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 6) * spread;
      parts.push({ x: x * r, y: y * r, vx: Math.cos(a) * v * r, vy: (Math.sin(a) * v - 4 * spread) * r, g: .22 * r,
        s: (4 + Math.random() * 6) * r, c: COLORS[i % COLORS.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
        life: 60 + Math.random() * 50, sq: Math.random() < .55 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life-- > 0 && p.y < cv.height + 60);
    for (const p of parts) {
      p.vy += p.g; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.min(1, p.life / 30); cx.fillStyle = p.c;
      if (p.sq) cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); else { cx.beginPath(); cx.arc(0, 0, p.s / 2.4, 0, 7); cx.fill(); }
      cx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(tick); else { cx.clearRect(0, 0, cv.width, cv.height); raf = 0; }
  }

  /* ================= Hoja inferior ================= */
  const sheet = { open: false, render: null, onClose: null };
  function openSheet(render, onClose) {
    if (sheet.open && sheet.onClose) { const f = sheet.onClose; sheet.onClose = null; f(); }
    sheet.render = render; sheet.onClose = onClose || null;
    const body = $('#sheetBody');
    body.innerHTML = render(); body.scrollTop = 0;
    const w = $('#sheetWrap'); w.classList.remove('closing'); w.hidden = false;
    if (!sheet.open) history.pushState({ sheet: true }, '');
    sheet.open = true;
    document.body.style.overflow = 'hidden';
    loadThumbs();
  }
  function refreshSheet() {
    if (!sheet.open) return;
    const b = $('#sheetBody'), st = b.scrollTop;
    b.innerHTML = sheet.render(); b.scrollTop = st;
    loadThumbs();
  }
  function closeSheet(fromPop) {
    if (!sheet.open) return;
    sheet.open = false;
    const w = $('#sheetWrap'); w.classList.add('closing');
    document.body.style.overflow = '';
    setTimeout(() => { if (!sheet.open) { w.hidden = true; w.classList.remove('closing'); $('#sheetBody').innerHTML = ''; } }, 290);
    const f = sheet.onClose; sheet.onClose = null; if (f) f();
    if (!fromPop && history.state && history.state.sheet) history.back();
  }
  addEventListener('popstate', () => { if (sheet.open) closeSheet(true); });
  $('#sheetBackdrop').addEventListener('click', () => closeSheet());

  function loadThumbs() {
    $$('img[data-photo]').forEach(img => {
      const id = img.dataset.photo;
      if (photoCache[id]) { img.src = photoCache[id]; return; }
      Store.photos.get(id).then(url => { if (url) { photoCache[id] = url; img.src = url; } });
    });
  }

  /* Botón de confirmación en dos toques (los diálogos nativos no siempre están disponibles) */
  function confirmTap(el, msg) {
    if (el.dataset.armed) return true;
    el.dataset.armed = '1';
    const old = el.innerHTML;
    el.innerHTML = msg || '¿Seguro? Toca de nuevo';
    buzz(25);
    setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = old; } }, 3000);
    return false;
  }

  function parseAmount(s) {
    s = String(s == null ? '' : s).replace(/[^\d.,-]/g, '');
    if (!s) return 0;
    const zeroDec = ['CLP', 'ARS', 'COP', 'PYG'].includes(S().trip.currency);
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (zeroDec || (s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
    const n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  /* ================= Navegación ================= */
  const TAB_GRAD = { home: 'var(--g-sky)', shop: 'var(--g-teal)', recipes: 'var(--g-peach)', money: 'var(--g-indigo)', agenda: 'var(--g-lilac)' };   // un color por módulo
  const TAB_OF = { group: 'home' };   // pantallas sin pestaña propia: se marca la pestaña de la que dependen
  function moveIndicator() {
    const tab = TAB_OF[ui.tab] || ui.tab;
    const t = $(`.tab[data-tab="${tab}"]`), ind = $('#tabIndicator');
    ind.style.left = t.offsetLeft + 'px'; ind.style.width = t.offsetWidth + 'px'; ind.style.background = TAB_GRAD[tab];
    $$('.tab').forEach(b => b.classList.toggle('active', b === t));
  }
  function go(tab) {
    if (!RENDER[tab]) tab = 'home';
    if (location.hash.slice(1) !== tab) { location.hash = tab; return; }
    ui.tab = tab; moveIndicator(); render(true); scrollTo(0, 0);
  }
  addEventListener('hashchange', () => { if (sheet.open) closeSheet(true); go(location.hash.slice(1) || 'home'); });
  addEventListener('resize', () => { moveIndicator(); placeSeg(); });
  $$('.tab').forEach(b => b.addEventListener('click', () => { buzz(8); go(b.dataset.tab); }));

  function render(anim) {
    view.innerHTML = RENDER[ui.tab]();
    if (anim) {
      view.classList.remove('animate'); void view.offsetWidth; view.classList.add('animate');
      clearTimeout(render.t); render.t = setTimeout(() => view.classList.remove('animate'), 1400);
    }
    after(anim);
    updateBadge();
  }
  function after(anim) {
    const fill = () => {
      $$('[data-w]', view).forEach(el => { el.style.width = el.dataset.w; });
      $$('[data-off]', view).forEach(el => { el.style.strokeDashoffset = el.dataset.off; });
    };
    if (anim) requestAnimationFrame(() => requestAnimationFrame(fill)); else fill();
    $$('[data-count]', view).forEach(el => { const to = +el.dataset.count; if (anim) countUp(el, to); else el.textContent = money(to); });
    placeSeg();
    loadThumbs();
  }
  function countUp(el, to, dur) {
    const t0 = performance.now(); dur = dur || 1000;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = money(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function updateBadge() {
    const n = Object.values(S().shop.sel).filter(r => !r.done).length;
    const b = $('#shopBadge'); b.hidden = !n; b.textContent = n;
  }
  function placeSeg() {
    $$('.seg', view).forEach(seg => {
      const a = seg.querySelector('button.active'), ind = seg.querySelector('.seg-ind');
      if (a && ind) { ind.style.left = a.offsetLeft + 'px'; ind.style.width = a.offsetWidth + 'px'; }
    });
  }
  /* Nombre de quien usa este celular (para la bitácora) */
  function myName() {
    if (Sync.active && Sync.names[Sync.uid]) return Sync.names[Sync.uid];
    const p0 = S().trip.people[0];
    return Sync.savedName() || (p0 && p0 !== 'Yo' ? p0 : 'Tú');
  }
  const helpBtn = s => `<button class="icon-btn help-btn" data-act="help" data-s="${s}" aria-label="Ayuda: ¿cómo se usa?" style="--i:3">${ic('help')}</button>`;
  const header = (eyebrow, title, btn) => `
    <header class="top stagger">
      <div class="grow" style="--i:0"><div class="eyebrow">${eyebrow}</div><h1 class="title">${title}</h1></div>
      ${btn || ''}${helpBtn(ui.tab)}
    </header>`;

  /* ================= AYUDA SIMPLE (para todas las edades) =================
     Un botón "?" por pantalla con 3 pasos cortos, una guía de "próximo paso" en Inicio
     y tamaño de letra por celular. Nada aparece si no se pide (salvo la guía, que se va sola). */
  const HELP = {
    home: { t: 'Inicio', m: 'inicio', s: [
      ['settings', 'Toca el <b>engranaje</b> para poner el nombre del viaje, las fechas y quiénes van.'],
      ['users', 'Con <b>Compartir con mi grupo</b> todos ven lo mismo en su celular.'],
      ['list', 'Abajo tienes las pestañas: <b>Súper, Recetas, Dinero y Agenda</b>.']] },
    shop: { t: 'Súper', m: 'super', s: [
      ['cart', 'En <b>Catálogo</b> toca lo que hay que comprar. Si tiene tipos (marca, tamaño), eliges uno.'],
      ['check', 'En <b>Mi lista</b> marca con el visto lo que ya compraste.'],
      ['pot', 'En <b>Despensa</b> queda lo que ya tienen en la cabaña.']] },
    recipes: { t: 'Recetas', m: 'recetas', s: [
      ['search', 'Busca un plato o elige una categoría.'],
      ['users', 'Toca la receta y elige <b>para cuántas personas</b>.'],
      ['cart', 'Toca <b>Agregar a la lista</b> y los ingredientes pasan al súper.']] },
    money: { t: 'Dinero', m: 'dinero', s: [
      ['plus', 'Toca el botón <b>+</b> para anotar un gasto: cuánto, en qué y quién pagó.'],
      ['camera', 'Puedes sacarle una <b>foto a la boleta</b> para no perderla.'],
      ['wallet', 'En <b>Cuentas claras</b> la app dice quién le debe a quién.']] },
    agenda: { t: 'Agenda', m: 'agenda', s: [
      ['calendar', 'Toca un <b>día</b> del calendario.'],
      ['plus', 'Toca <b>+</b> y elige: desayuno, almuerzo, once, cena o actividad.'],
      ['book', 'Si eliges una receta, sus ingredientes pueden ir directo al súper.']] },
    group: { t: 'Tu grupo', m: 'grupo', s: [
      ['list', '<b>Cosas</b>: anoten quién lleva el parlante, la parrilla, el cargador…'],
      ['users', '<b>Piezas</b>: repartan las camas a mano o con un sorteo.'],
      ['book', '<b>Bitácora</b>: aquí se ve lo que hizo cada uno.']] }
  };
  const LS = { get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* bloqueado */ } } };
  const FONT = [['1', 'Normal'], ['1.15', 'Grande'], ['1.3', 'Muy grande']];
  const applyFont = () => { document.documentElement.style.zoom = LS.get('viajapp-font', '1'); };
  applyFont();
  /* Apariencia: Día (claro celeste), Noche (azul profundo) o Automático (según el equipo). Se guarda por equipo. */
  const THEMES = [['auto', 'Automático', 'auto'], ['day', 'Día', 'sun'], ['night', 'Noche', 'moon']];
  const mqDark = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const v = LS.get('viajapp-theme', 'auto'), t = v === 'auto' ? (mqDark.matches ? 'night' : 'day') : v;
    document.documentElement.dataset.theme = t;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'day' ? '#f2f8fd' : '#0a1628';
  }
  applyTheme();
  if (mqDark.addEventListener) mqDark.addEventListener('change', () => { if (LS.get('viajapp-theme', 'auto') === 'auto') applyTheme(); });
  const themeHTML = () => `<div class="field"><span>${ic('sun')} Apariencia en este equipo</span><div class="chips wrap theme-row">${THEMES.map(([v, n, i]) =>
    `<button class="chip ${LS.get('viajapp-theme', 'auto') === v ? 'active' : ''}" style="--c:var(--pink)" data-act="setTheme" data-v="${v}">${ic(i)} ${n}</button>`).join('')}</div></div>`;
  const fontHTML = () => `${themeHTML()}<div class="field"><span>${ic('text')} Tamaño de letra en este celular</span><div class="chips wrap">${FONT.map(([v, n], i) =>
    `<button class="chip ${LS.get('viajapp-font', '1') === v ? 'active' : ''}" style="--c:var(--cyan);font-size:${14 + i * 2}px" data-act="fontSize" data-v="${v}">${n}</button>`).join('')}</div></div>`;
  function helpHTML() {
    const h = HELP[draft.s] || HELP.home;
    return `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-sea)">${ic('help')}</span><div><h2>¿Cómo se usa ${esc(h.t)}?</h2><p>En 3 pasos</p></div></div>
      <ol class="help-steps">${h.s.map(([i, txt], n) => `<li><span class="hs-n">${n + 1}</span><span class="hs-ic">${ic(i)}</span><span>${txt}</span></li>`).join('')}</ol>
      ${fontHTML()}
      ${draft.s === 'home' && guideOff() ? `<button class="btn block" data-act="guideShow">${ic('arrow')} Mostrar otra vez la guía de inicio</button>` : ''}
      <a class="btn block help-link" href="manual/#${h.m}" target="_blank" rel="noopener">${ic('book')} Ver más en el manual</a>
      <button class="btn primary block" style="margin-top:10px" data-act="close">Entendido</button>`;
  }
  /* Guía de inicio: un solo paso a la vez, se marca solo al hacerlo */
  const guideOff = () => LS.get('viajapp-guide', '') === 'off';
  function guideSteps() {
    const s = S(), t = s.trip;
    return [
      { ic: 'edit', t: 'Ponle nombre y fechas a tu viaje', b: 'Escribir', a: 'data-act="trip"', ok: t.name && t.name !== 'Mi viaje' },
      { ic: 'users', t: 'Anota quiénes van al viaje', b: 'Agregar personas', a: 'data-act="trip"', ok: t.people.length > 1 },
      { ic: 'share', t: 'Invita a tu grupo para ver todo juntos', b: 'Invitar', a: 'data-act="sync"', ok: Sync.active },
      { ic: 'cart', t: 'Elige lo que hay que comprar', b: 'Ir al súper', a: 'data-act="go" data-to="shop"', ok: Object.keys(s.shop.sel).length > 0 || Object.keys(P_().items).length > 0 },
      { ic: 'calendar', t: 'Planea la primera comida', b: 'Planear', a: 'data-act="newEvent" data-type="almuerzo"', ok: s.events.length > 0 },
      { ic: 'wallet', t: 'Anota el primer gasto', b: 'Anotar gasto', a: 'data-act="newExpense"', ok: s.expenses.length > 0 }
    ];
  }
  function guideHTML() {
    if (guideOff()) return '';
    const st = guideSteps(), i = st.findIndex(x => !x.ok);
    if (i < 0) return '';
    const x = st[i];
    return `<section class="guide card" style="--i:2">
      <div class="g-top"><span class="eyebrow">Tu próximo paso · ${i + 1} de ${st.length}</span>
        <span class="g-dots">${st.map(s => `<i class="${s.ok ? 'on' : ''}"></i>`).join('')}</span></div>
      <div class="g-main"><span class="g-ic">${ic(x.ic)}</span><b>${x.t}</b></div>
      <button class="btn primary block shine" ${x.a}>${x.b}</button>
      ${!Sync.active && i < 2 ? `<button class="link g-join" data-act="sync">${ic('users')} ¿Te invitaron a un viaje? Únete aquí</button>` : ''}
      <button class="link g-hide" data-act="guideHide">Ya sé usarla, ocultar guía</button>
    </section>`;
  }

  /* ================= Cálculos ================= */
  const spentTotal = () => S().expenses.reduce((s, e) => s + (+e.amount || 0), 0);
  const typeOf = id => EVENT_TYPES.find(t => t.id === id) || EVENT_TYPES[0];
  const catOf = id => EXPENSE_CATS.find(c => c.id === id) || EXPENSE_CATS[EXPENSE_CATS.length - 1];
  function nextEvent() {
    const d = new Date();
    const now = `${Store.today()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return S().events.filter(e => `${e.date} ${e.time || '23:59'}` >= now).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  }
  function tripStatus() {
    const t = S().trip, day = 864e5;
    const today = U.parseDate(Store.today()), s = U.parseDate(t.start), e = U.parseDate(t.end);
    if (today < s) { const n = Math.round((s - today) / day); return `Faltan <b>${n}</b> ${n === 1 ? 'día' : 'días'}`; }
    if (today <= e) { const n = Math.round((today - s) / day) + 1, tot = Math.round((e - s) / day) + 1; return `Día <b>${n}</b> de ${tot}`; }
    return '<b>Viaje terminado</b>';
  }
  const fmtDay = ds => U.parseDate(ds).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* Aviso en la agenda si la receta del plan tiene algo que alguien no puede comer y no tiene reemplazo */
  function evDietWarn(e) {
    const r = e.recipe && getRecipe(e.recipe.id);
    if (!r || !dietPeople().length) return '';
    const pl = cookPlan(r, e.recipe.vi, e.recipe.p, e.recipe.mode || 'portion');
    if (!pl.issues.length) return '';
    return ` · <span class="dw-inline">${ic('alert')} no apta: ${esc([...new Set(pl.issues.flatMap(x => x.who.map(w => w.p.name)))].join(', '))}</span>`;
  }
  function evCard(e, i) {
    const t = typeOf(e.type);
    const past = `${e.date} ${e.time || '23:59'}` < `${Store.today()} ${new Date().toTimeString().slice(0, 5)}`;
    return `<button class="ev ${past ? 'past' : ''}" style="--c:${t.color};--i:${Math.min(i, 10)}" data-act="editEvent" data-id="${e.id}">
      <span class="et">${esc(e.time || '--:--')}</span><span class="ee">${t.emoji}</span>
      <span class="em"><span class="en">${esc(e.title || t.name)}</span>
      <span class="es">${e.recipe ? ic('book') + ' ' : ''}${esc(t.name)}${e.place ? ' · ' + esc(e.place) : ''}${e.who ? ' · ' + esc(e.who) : ''}${e.cooked ? ' · cocinado' : ''}${evDietWarn(e)}</span></span>
    </button>`;
  }

  /* ================= INICIO ================= */
  function renderHome() {
    const t = S().trip;
    const h = new Date().getHours();
    const greet = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    const sel = Object.values(S().shop.sel), done = sel.filter(r => r.done).length;
    const spent = spentTotal(), budget = +t.budget || 0;
    const nx = nextEvent();
    const todays = S().events.filter(e => e.date === Store.today()).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const tiles = [
      ['cart', 'Lista súper', 'go', 'data-to="shop"', 'var(--g-teal)'],
      ['wallet', 'Nuevo gasto', 'newExpense', '', 'var(--g-indigo)'],
      ['calendar', 'Planear comida', 'newEvent', 'data-type="almuerzo"', 'var(--g-lilac)'],
      ['calculator', 'Dividir cuenta', 'split', '', 'var(--grad-sea)'],
      ['file', 'Carta financiera', 'exp', 'data-k="financePDF"', 'var(--g-sky)'],
      ['pot', 'Recetas', 'go', 'data-to="recipes"', 'var(--g-peach)']
    ];
    const p0 = t.people[0], who = Sync.savedName() || (p0 && p0 !== 'Yo' ? p0 : '');
    const guide = guideHTML();   // si la guía está visible, ella misma invita a compartir
    return `<div class="page">
      <header class="top stagger home-top">
        <img class="brand-mark" src="icons/logo-badge.png" alt="Viajapp" style="--i:0">
        <div class="grow" style="--i:1"><div class="eyebrow">${esc(cap(fmtDay(Store.today())))}</div><h1 class="title">${greet}${who ? ', ' + esc(who) : ''}</h1></div>
        <button class="icon-btn" data-act="trip" aria-label="Configurar viaje" style="--i:2">${ic('settings')}</button>
        ${helpBtn('home')}
      </header>
      <div class="stagger">
        <section class="hero" style="--i:1" data-act="trip">
          <img class="hero-dog" src="icons/perro-guino.webp" alt="">
          ${TR.homeButton()}
          <div class="eyebrow" style="color:#fff;opacity:.9">Tu viaje</div>
          <div class="trip-name">${esc(t.name)}</div>
          <div class="trip-meta"><span class="nw">${ic('calendar')} ${U.dmy(t.start)} →</span> <span class="nw">${U.dmy(t.end)}</span>${t.people.length ? ` <span class="nw">· ${ic('users')} ${t.people.length}</span>` : ''}</div>
          <div class="countdown">${tripStatus()}</div>
          ${Sync.active ? `<button class="sync-pill" data-act="sync">${syncDot()} Compartido · ${Sync.members.length} ${Sync.members.length === 1 ? 'persona' : 'personas'}</button>` : ''}
        </section>
        ${guide}
        <div class="stats" style="--i:2">
          <div class="stat" data-act="go" data-to="shop" role="button">
            <i class="s-glow" style="background:var(--lime)"></i><div class="s-ico">${ic('cart')}</div>
            <div class="s-val">${done}/${sel.length}</div><div class="s-lbl">productos comprados</div>
          </div>
          <div class="stat" data-act="go" data-to="money" role="button">
            <i class="s-glow" style="background:var(--orange)"></i><div class="s-ico">${ic('wallet')}</div>
            <div class="s-val" data-count="${spent}">${money(spent)}</div>
            <div class="s-lbl">${budget ? `gastado de ${money(budget)}` : 'gastado en total'}</div>
          </div>
          <div class="stat wide" data-act="go" data-to="agenda" role="button">
            <i class="s-glow" style="background:var(--violet)"></i>
            <div class="s-lbl">Próximo plan</div>
            ${nx ? `<div class="s-val">${esc(nx.title || typeOf(nx.type).name)}</div>
              <div class="s-lbl">${nx.date === Store.today() ? 'Hoy' : esc(fmtDay(nx.date))} · ${esc(nx.time || '')}${nx.place ? ' · ' + esc(nx.place) : ''}</div>`
              : `<div class="s-val">Nada agendado</div><div class="s-lbl">Toca para planificar comidas</div>`}
          </div>
        </div>
      </div>
      ${ui.installEvt ? `<button class="btn sea block shine" style="margin-top:14px" data-act="install">${ic('phone')} Instalar Viajapp en este celular</button>` : ''}
      ${(!Sync.active || Sync.members.length < 2) && !guide ? `<button class="btn block share-cta" style="margin-top:14px" data-act="sync"><span>${ic('users')} Compartir con mi grupo</span><small>En vivo</small></button>` : ''}
      ${G.homeCard()}
      <div class="section-title"><h2>Accesos rápidos</h2></div>
      <div class="quick stagger">
        ${tiles.map((x, i) => `<button class="quick-tile" style="background:${x[4]};--i:${i}" data-act="${x[2]}" ${x[3]}><span>${ic(x[0])}</span>${x[1]}</button>`).join('')}
      </div>
      <div class="section-title"><h2>Hoy</h2><button class="link" data-act="go" data-to="agenda">Ver agenda →</button></div>
      ${todays.length ? `<div class="timeline">${todays.map(evCard).join('')}</div>`
        : `<div class="card empty"><span class="ee">${ic('calendar')}</span><b>Nada planeado para hoy</b>Organiza el desayuno, almuerzo o cena.<br><br>
           <button class="btn primary" data-act="newEvent" data-type="almuerzo">${ic('plus')} Agregar plan</button></div>`}
    </div>`;
  }

  /* ================= SÚPER ================= */
  const key = (c, i, v) => `${c}|${i}|${v}`;
  function itemsOf(cat) {
    const extra = S().shop.extraVar || {};
    const base = cat.items.map(([n, e, v]) => ({ n, e, v: v.concat(extra[cat.id + '|' + n] || []), custom: false }));
    const cust = (S().shop.custom[cat.id] || []).map(x => ({ n: x.n, e: x.e || cat.emoji, v: (x.v || []).concat(extra[cat.id + '|' + x.n] || []), custom: true }));
    return base.concat(cust);
  }
  const selOf = (c, i) => Object.values(S().shop.sel).filter(r => r.c === c && r.i === i);
  function toggleSel(c, i, v) {
    const k = key(c, i, v), sel = S().shop.sel;
    if (sel[k]) delete sel[k]; else sel[k] = { c, i, v, q: 1, done: false };
    if (sel[k]) log('shop', n => n === 1 ? `agregó ${i}${v ? ' ' + v.toLowerCase() : ''} a la lista` : `agregó ${n} productos a la lista`, 'listAdd');
    Store.save();
    return !!sel[k];
  }

  function itemCard(cat, it) {
    const s = selOf(cat.id, it.n), on = s.length > 0, qty = s.reduce((a, r) => a + r.q, 0);
    const inPantry = !on && Object.values(P_().items).some(e => e.c === cat.id && e.i === it.n);
    const sub = on ? s.map(r => r.v || 'Sin especificar').join(', ') : inPantry ? 'En la despensa' : (it.v.length ? `${it.v.length} variantes` : 'Toca para agregar');
    return `<button class="item-card ${on ? 'on' : ''}" style="--c:${cat.color}" data-act="item" data-c="${cat.id}" data-i="${esc(it.n)}" data-card="${esc(cat.id + '|' + it.n)}">
      <span class="ie">${it.e}</span>
      <span><span class="in">${esc(it.n)}</span><br><span class="iv">${esc(sub)}</span></span>
      ${on ? `<b class="ib">${qty}</b>` : ''}
    </button>`;
  }
  function shopChips() {
    const cnt = c => Object.values(S().shop.sel).filter(r => r.c === c).length;
    return `<div class="chips" id="shopChips">
      <button class="chip ${ui.shopCat === 'all' ? 'active' : ''}" data-act="cat" data-c="all" style="--c:var(--pink)">Todas</button>
      ${CATALOG.map(c => { const n = cnt(c.id); return `<button class="chip ${ui.shopCat === c.id ? 'active' : ''}" data-act="cat" data-c="${c.id}" style="--c:${c.color}">${c.emoji} ${esc(c.name)}${n ? ` <b>· ${n}</b>` : ''}</button>`; }).join('')}
    </div>`;
  }
  function shopSections() {
    const q = norm(ui.q);
    const cats = ui.shopCat === 'all' ? CATALOG : CATALOG.filter(c => c.id === ui.shopCat);
    let html = '';
    for (const cat of cats) {
      let items = itemsOf(cat);
      if (q) items = items.filter(it => norm(it.n).includes(q) || it.v.some(v => norm(v).includes(q)) || norm(cat.name).includes(q));
      if (!items.length && q) continue;
      html += `<section class="cat-section" style="--c:${cat.color}">
        <div class="cat-head"><span class="cat-ico">${cat.emoji}</span><h3>${esc(cat.name)}</h3><span class="cat-n">${items.length} productos</span></div>
        <div class="grid-items">${items.map(it => itemCard(cat, it)).join('')}
          ${q ? '' : `<button class="item-card add" data-act="addItem" data-c="${cat.id}"><span class="ie add-ic">${ic('plus')}</span><span class="in">Agregar producto</span></button>`}
        </div></section>`;
    }
    if (!html) {
      html = `<div class="empty"><span class="ee">${ic('search')}</span><b>Sin resultados</b>No encontramos “${esc(ui.q)}”.<br><br>
        <button class="btn primary" data-act="addItem" data-c="${ui.shopCat === 'all' ? 'despensa' : ui.shopCat}" data-name="${esc(ui.q)}">${ic('plus')} Agregar “${esc(ui.q)}”</button></div>`;
    }
    return html;
  }
  const ctaHTML = n => `<button class="cta-float" id="cta" data-act="shopMode" data-m="list">${ic('list')} Ver mi lista <span class="n">${n}</span></button>`;

  function shopList() {
    const groups = Exporter.groupedList();
    const all = Object.values(S().shop.sel), done = all.filter(r => r.done).length;
    if (!all.length) {
      return `<div class="card empty"><span class="ee">${ic('cart')}</span><b>Tu lista está vacía</b>Ve al catálogo y toca los productos que necesitas.<br><br>
        <button class="btn primary" data-act="shopMode" data-m="catalog">Ir al catálogo</button></div>`;
    }
    return `
      <div class="card">
        <div class="list-summary"><div><div class="eyebrow">Progreso</div><span class="big" id="lsDone">${done}</span> / ${all.length} comprados</div><span class="sum-ic">${ic('cart')}</span></div>
        <div class="progress"><i id="lsBar" data-w="${all.length ? done / all.length * 100 : 0}%"></i></div>
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn sea sm" data-act="exp" data-k="listPNG">${ic('image')} PNG</button>
        <button class="btn primary sm" data-act="exp" data-k="listPDF">${ic('file')} PDF</button>
        <button class="btn sm" data-act="exp" data-k="listPNG" data-share="1">${ic('share')} Compartir</button>
      </div>
      ${groups.map(g => `
        <div class="list-group" style="--c:${g.cat.color}">
          <div class="list-group-h">${g.cat.emoji} ${esc(g.cat.name)} <span style="color:var(--dim)">(${g.rows.length})</span></div>
          ${g.rows.map(r => { const k = key(r.c, r.i, r.v); return `
            <div class="list-row ${r.done ? 'done' : ''}">
              <button class="check ${r.done ? 'on' : ''}" data-act="done" data-k="${esc(k)}" aria-label="Marcar comprado">${CHECK}</button>
              <div class="rm"><div class="rn">${esc(r.i)}</div><div class="rv">${esc(r.v || 'Sin especificar')}${r.u ? ` · <b style="color:var(--strong)">${esc(U.amt(r.n, r.u))}</b>` : ''}</div>
                ${(r.src || []).length ? `<div class="rs">${ic('pot')} ${esc(r.src.join(', '))}</div>` : ''}${dietWarnHTML(r)}</div>
              <div class="stepper"><button data-act="qty" data-k="${esc(k)}" data-d="-1">−</button><b>${r.q}</b><button data-act="qty" data-k="${esc(k)}" data-d="1">+</button></div>
              <button class="del" data-act="delRow" data-k="${esc(k)}" aria-label="Quitar">✕</button>
            </div>`; }).join('')}
        </div>`).join('')}
      <div class="btn-row" style="margin-top:18px">
        <button class="btn lime" data-act="newExpense" data-cat="super">${ic('wallet')} Registrar gasto</button>
        <button class="btn danger" data-act="clearList">${ic('trash')} Vaciar lista</button>
      </div>`;
  }

  function renderShop() {
    const n = Object.keys(S().shop.sel).length, m = ui.shopMode, cat = m === 'catalog';
    const np = Object.keys(P_().items).length;
    const TITLES = { catalog: '¿Qué compramos?', list: 'Mi lista', pantry: 'Despensa' };
    return `<div class="page">
      ${header('Supermercado', TITLES[m] || TITLES.catalog)}
      <div class="seg seg3" id="shopSeg"><span class="seg-ind"></span>
        <button class="${cat ? 'active' : ''}" data-act="shopMode" data-m="catalog">Catálogo</button>
        <button class="${m === 'list' ? 'active' : ''}" data-act="shopMode" data-m="list">Mi lista${n ? ` (${n})` : ''}</button>
        <button class="${m === 'pantry' ? 'active' : ''}" data-act="shopMode" data-m="pantry">Despensa${np ? ` (${np})` : ''}</button>
      </div>
      <div id="shopBody">
        ${cat ? `<label class="search"><input type="search" id="shopSearch" placeholder="Buscar: aceite, pollo, cerveza..." value="${esc(ui.q)}" autocomplete="off"></label>
          <div class="sticky-chips">${shopChips()}</div>
          <div id="shopSections">${shopSections()}</div>` : m === 'pantry' ? pantryView() : shopList()}
      </div>
    </div>${cat && n ? ctaHTML(n) : ''}`;
  }

  /* ================= DESPENSA ================= */
  /* items: { "c|i|v": { c, i, v, a: { unidad: cantidad }, t } } — una entrada puede tener varias unidades (ej. 440 g + 1 un) */
  const P_ = () => { const s = S(); s.pantry = s.pantry || { items: {} }; s.pantry.items = s.pantry.items || {}; return s.pantry; };
  const STEP = { g: 100, ml: 100 };
  function pantryAdd(c, i, v, n, u) {
    if (!(n > 0)) return;
    const k = key(c, i, v), it = P_().items;
    const e = it[k] || (it[k] = { c, i, v, a: {} });
    e.a[u] = Math.round(((e.a[u] || 0) + n) * 100) / 100; e.t = Date.now();
  }
  /* Saca hasta n unidades u; devuelve lo que realmente sacó (para poder deshacer) */
  function pantryTake(c, i, v, n, u) {
    const k = key(c, i, v), e = P_().items[k];
    if (!e || !e.a[u]) return 0;
    const took = Math.min(e.a[u], n);
    e.a[u] = Math.round((e.a[u] - took) * 100) / 100;
    if (e.a[u] <= 0.001) delete e.a[u];
    if (!Object.keys(e.a).length) delete P_().items[k];
    return took;
  }
  const pantryOf = (c, i, v) => P_().items[key(c, i, v)];
  const pantryText = e => Object.entries(e.a).map(([u, n]) => U.amt(n, u)).join(' + ');
  /* Lo que entra a la despensa al marcar un producto de la lista como comprado */
  const boughtAmount = r => r.u ? { n: (r.n || 0) * (r.q || 1), u: r.u } : { n: r.q || 1, u: 'un' };

  function pantryView() {
    const items = Object.values(P_().items);
    if (!ingIndex) buildIngIndex();
    const groups = CATALOG.map(c => ({ c, rows: items.filter(e => e.c === c.id) })).filter(g => g.rows.length);
    const others = items.filter(e => !CATALOG.some(c => c.id === e.c));
    if (others.length) groups.push({ c: { id: 'otros', name: 'Otros', emoji: '', color: 'var(--slate)' }, rows: others });
    return `
      <div class="card pantry-intro">
        <div class="list-summary"><div><div class="eyebrow">En la cabaña</div><span class="big">${items.length}</span> ${items.length === 1 ? 'producto' : 'productos'}</div><span class="sum-ic">${ic('box')}</span></div>
        <p class="hint" style="margin:0">Lo que marcas como <b>comprado</b> entra solo aquí. Al marcar un plan de la agenda como <b>cocinado</b>, se descuentan sus ingredientes. Y al agregar una receta a la lista, solo se pide lo que falta.</p>
      </div>
      <div class="pantry-add">
        <input id="paName" list="ingList" placeholder="Agregar: ej. Arroz · Grado 1" autocomplete="off">
        <input id="paQty" inputmode="decimal" placeholder="Cant.">
        <select id="paUnit">${UNITS_ED.filter(x => x[0] !== 'fijo').map(([v, l]) => `<option value="${v}" ${v === 'un' ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn sea" data-act="pAdd" aria-label="Agregar a la despensa">${ic('plus')}</button>
      </div>
      ${ingIndex.html}
      ${groups.length ? groups.map(g => `
        <div class="list-group" style="--c:${g.c.color}">
          <div class="list-group-h">${g.c.emoji} ${esc(g.c.name)} <span style="color:var(--dim)">(${g.rows.length})</span></div>
          ${g.rows.sort((a, b) => a.i.localeCompare(b.i, 'es')).map(e => { const k = key(e.c, e.i, e.v), u = Object.keys(e.a)[0]; return `
            <div class="list-row pantry-row">
              <div class="rm"><div class="rn">${esc(e.i)}</div><div class="rv">${esc(e.v || 'Sin especificar')} · <b style="color:var(--strong)">${esc(pantryText(e))}</b></div>${dietWarnHTML(e)}</div>
              <div class="stepper"><button data-act="pStep" data-k="${esc(k)}" data-u="${u}" data-d="-1" aria-label="Menos">−</button><button data-act="pStep" data-k="${esc(k)}" data-u="${u}" data-d="1" aria-label="Más">+</button></div>
              <button class="del" data-act="pToList" data-k="${esc(k)}" aria-label="Se acabó: pasar a la lista">${ic('cart')}</button>
              <button class="del" data-act="pDel" data-k="${esc(k)}" aria-label="Quitar de la despensa">✕</button>
            </div>`; }).join('')}
        </div>`).join('')
        : `<div class="card empty" style="margin-top:14px"><span class="ee">${ic('box')}</span><b>La despensa está vacía</b>Marca productos como comprados en Mi lista o agrégalos arriba.</div>`}
      ${items.length ? `<div class="btn-row" style="margin-top:18px">
        <button class="btn sm" data-act="pCopy">${ic('copy')} Copiar sobrantes</button>
        <button class="btn sm danger" data-act="pClear">${ic('trash')} Vaciar despensa</button>
      </div>` : ''}`;
  }

  /* ================= DIETAS Y ALERGIAS ================= */
  /* trip.diets = { "Nombre": { tags: ["celiaco", ...], note } } */
  const diets = () => { const t = S().trip; t.diets = t.diets || {}; return t.diets; };
  function dietPeople() {
    return S().trip.people.map(n => ({ name: n, tags: (diets()[n] || {}).tags || [], note: (diets()[n] || {}).note || '' }))
      .filter(p => p.tags.length).map(p => Object.assign(p, { avoid: Diet.avoidOf(p.tags) }));
  }
  /* Quiénes no pueden comer un producto y por qué */
  function whoCant(c, i, v, people) {
    const a = Diet.attrs(c, i, v);
    return (people || dietPeople()).map(p => ({ p, why: Diet.clash(a, p.avoid) })).filter(x => x.why.length);
  }
  const whyText = why => [...new Set(why.map(w => Diet.ATTR[w]))].join(', ');
  function dietWarnHTML(r) {
    if ((r.src || []).some(s => / · para /.test(s))) return '';          // ya es la porción adaptada
    const w = whoCant(r.c, r.i, r.v);
    return w.length ? `<div class="dw">${ic('alert')} No apto para ${w.map(x => `${esc(x.p.name)} (${esc(whyText(x.why))})`).join(', ')}</div>` : '';
  }
  const dietSummary = () => dietPeople().map(p => `${p.name} (${p.tags.map(Diet.dietName).join(', ').toLowerCase()})`).join(' · ');

  function openDiets() {
    draft = { _kind: 'diets' };
    openSheet(dietsHTML, releaseDraft(draft));
  }
  function dietsHTML() {
    const people = S().trip.people;
    return `<div class="sheet-title"><span class="st-ico" style="--c:linear-gradient(135deg,var(--lime),var(--cyan))">${ic('leaf')}</span><div><h2>Dietas y alergias</h2><p>Las recetas avisan y se adaptan para cada persona</p></div></div>
      ${people.length === 1 && people[0] === 'Yo' ? `<p class="tip-inline">${ic('alert')} Primero agrega a los participantes en la configuración del viaje.</p>` : ''}
      ${people.map(n => { const d = diets()[n] || {}, tags = d.tags || []; return `
        <div class="diet-person">
          <div class="dp-name">${esc(n)}${tags.length ? ` <small>${tags.length} ${tags.length === 1 ? 'restricción' : 'restricciones'}</small>` : ''}</div>
          <div class="chips wrap">${Diet.DIETS.map(t => `<button class="chip ${tags.includes(t.id) ? 'active' : ''}" style="--c:var(--teal)" data-act="dietTog" data-p="${esc(n)}" data-t="${t.id}">${esc(t.name)}</button>`).join('')}</div>
          <input class="diet-note" data-p="${esc(n)}" value="${esc(d.note || '')}" placeholder="Otra restricción o nota (ej. no le gusta el cilantro)" autocomplete="off">
        </div>`; }).join('')}
      <button class="btn primary block" style="margin-top:6px" data-act="close">Listo</button>`;
  }

  function updateCardFor(c, i, pop) {
    const cat = CATALOG.find(x => x.id === c);
    const it = cat && itemsOf(cat).find(x => x.n === i);
    const el = $(`[data-card="${CSS.escape(c + '|' + i)}"]`, view);
    if (el && it) {
      const tmp = document.createElement('div'); tmp.innerHTML = itemCard(cat, it);
      const nu = tmp.firstElementChild; el.replaceWith(nu);
      if (pop) nu.animate([{ transform: 'scale(.88)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    }
    updateCTA(); updateChipCounts(); updateBadge();
  }
  function updateChipCounts() {
    const ch = $('#shopChips'); if (!ch) return;
    const sl = ch.scrollLeft; ch.outerHTML = shopChips(); $('#shopChips').scrollLeft = sl;
  }
  function updateCTA() {
    const n = Object.keys(S().shop.sel).length;
    const c = $('#cta');
    if (ui.tab !== 'shop' || ui.shopMode !== 'catalog' || !n) { if (c) c.remove(); }
    else if (c) { const b = c.querySelector('.n'); b.textContent = n; bounce(b); }
    else view.insertAdjacentHTML('beforeend', ctaHTML(n));
    const segB = $('#shopSeg button[data-m="list"]');
    if (segB) segB.textContent = `Mi lista${n ? ` (${n})` : ''}`;
  }
  function updateListProgress() {
    const all = Object.values(S().shop.sel), d = all.filter(r => r.done).length;
    const bar = $('#lsBar'); if (bar) bar.style.width = (all.length ? d / all.length * 100 : 0) + '%';
    const ld = $('#lsDone'); if (ld) { ld.textContent = d; bounce(ld); }
    if (all.length && d === all.length) { confetti(innerWidth / 2, innerHeight / 3, 140, 1.4); toast('¡Lista completa!'); buzz([20, 40, 20, 40, 60]); }
  }

  function variantsHTML(c, name) {
    const cat = CATALOG.find(x => x.id === c);
    const it = itemsOf(cat).find(x => x.n === name);
    if (!it) return '';
    const sel = S().shop.sel;
    const opts = [''].concat(it.v);
    return `<div class="sheet-title"><span class="st-ico" style="--c:${cat.color}">${it.e}</span>
        <div><h2>${esc(it.n)}</h2><p>${esc(cat.name)} · elige una o varias variantes</p></div></div>
      ${opts.map(v => { const k = key(c, it.n, v), r = sel[k]; return `
        <div class="variant-row ${r ? 'on' : ''}" style="--c:${cat.color}" data-act="variant" data-c="${c}" data-i="${esc(it.n)}" data-v="${esc(v)}">
          <span class="check ${r ? 'on' : ''}">${CHECK}</span>
          <span class="vn">${v ? esc(v) : '<i style="opacity:.75">Sin especificar / cualquiera</i>'}</span>
          ${r ? `<div class="stepper"><button data-act="qty" data-k="${esc(k)}" data-d="-1">−</button><b>${r.q}</b><button data-act="qty" data-k="${esc(k)}" data-d="1">+</button></div>` : ''}
        </div>`; }).join('')}
      <div class="field-row" style="margin-top:14px;align-items:flex-end">
        <label class="field" style="margin:0"><span>¿Otra variante o marca?</span><input id="newVar" placeholder="Ej: ${esc(it.v[0] ? 'Marca, tamaño, sabor...' : 'Grande, light...')}" enterkeyhint="done" autocomplete="off"></label>
        <button class="btn sea" data-act="addVar" data-c="${c}" data-i="${esc(it.n)}" style="flex:none" aria-label="Agregar variante">${ic('plus')}</button>
      </div>
      <button class="btn primary block" style="margin-top:16px" data-act="close">Listo</button>
      ${it.custom ? `<button class="btn danger block" style="margin-top:10px" data-act="delItem" data-c="${c}" data-i="${esc(it.n)}">Eliminar del catálogo</button>` : ''}`;
  }

  function addItemHTML(c, name) {
    return `<div class="sheet-title"><span class="st-ico">${ic('plus')}</span><div><h2>Nuevo producto</h2><p>Se guarda en el catálogo y se agrega a tu lista</p></div></div>
      <label class="field"><span>Nombre</span><input id="niName" value="${esc(name || '')}" placeholder="Ej: Salsa pesto" autocomplete="off"></label>
      <div class="field-row">
        <label class="field" style="flex:0 0 92px"><span>Emoji</span><input id="niEmoji" placeholder="🛍️" maxlength="4"></label>
        <label class="field"><span>Categoría</span><select id="niCat">${CATALOG.map(x => `<option value="${x.id}" ${x.id === c ? 'selected' : ''}>${x.emoji} ${esc(x.name)}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Variantes (separadas por coma, opcional)</span><input id="niVars" placeholder="Ej: Grande, Chica, Light" autocomplete="off"></label>
      <button class="btn primary block shine" data-act="saveItem">Agregar al catálogo</button>`;
  }

  /* ================= DINERO ================= */
  function renderMoney() {
    const t = S().trip, ex = S().expenses;
    const spent = spentTotal(), budget = +t.budget || 0;
    const pct = budget ? spent / budget : 0, over = budget && spent > budget;
    const C = 2 * Math.PI * 44, off = C * (1 - Math.min(pct, 1));
    const byCat = EXPENSE_CATS.map(c => ({ c, v: ex.filter(e => e.cat === c.id).reduce((s, e) => s + (+e.amount || 0), 0) })).filter(x => x.v).sort((a, b) => b.v - a.v);
    const payers = {};
    ex.forEach(e => { const p = e.payer || 'Sin asignar'; payers[p] = (payers[p] || 0) + (+e.amount || 0); });
    const pp = Object.entries(payers).sort((a, b) => b[1] - a[1]);
    const PCOL = ['var(--pink)', 'var(--cyan)', 'var(--yellow)', 'var(--lime)', 'var(--violet)', 'var(--orange)'];
    const dates = [...new Set(ex.map(e => e.date))].sort().reverse();

    return `<div class="page">
      ${header('Finanzas del viaje', 'Dinero del viaje', `<button class="icon-btn" data-act="trip" aria-label="Configurar fondos" style="--i:1">${ic('settings')}</button>`)}
      <div class="stagger">
        <div class="balance ${over ? 'over' : ''}" style="--i:0">
          <div class="bl">
            <small>${budget ? (over ? 'Te pasaste por' : 'Saldo disponible') : 'Total gastado'}</small>
            <div class="bal-num" data-count="${budget ? Math.abs(budget - spent) : spent}">${money(budget ? Math.abs(budget - spent) : spent)}</div>
            <div class="bal-sub"><span>Fondos<b>${money(budget)}</b></span><span>Gastado<b>${money(spent)}</b></span><span>Gastos<b>${ex.length}</b></span></div>
          </div>
          <div class="ring">
            <svg viewBox="0 0 100 100"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="${over ? '#fecaca' : '#ffffff'}"/><stop offset="1" stop-color="${over ? '#fca5a5' : '#c7d2fe'}"/></linearGradient></defs>
              <circle class="rbg" cx="50" cy="50" r="44"/>
              <circle class="rfg" cx="50" cy="50" r="44" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${off}"/></svg>
            <div class="rl"><div>${budget ? Math.round(pct * 100) + '%' : '—'}<small>${budget ? 'usado' : 'sin fondos'}</small></div></div>
          </div>
        </div>
        ${!budget ? `<button class="btn sun block shine" style="margin-top:12px;--i:1" data-act="trip">${ic('wallet')} Definir fondos asignados</button>` : ''}
        <div class="actions4" style="--i:2">
          <button class="act" data-act="newExpense"><span style="background:var(--grad-hot)">${ic('plus')}</span>Gasto</button>
          <button class="act" data-act="split"><span style="background:var(--grad-sea)">${ic('calculator')}</span>Dividir</button>
          <button class="act" data-act="exp" data-k="financePDF"><span style="background:var(--grad-sun)">${ic('file')}</span>Carta PDF</button>
          <button class="act" data-act="exp" data-k="financeCSV"><span style="background:var(--grad-lime)">${ic('sheet')}</span>Excel</button>
        </div>
        <div class="money-links">${SEP.linkHTML()}${ex.length ? BOL.planillaLink() : ''}</div>
      </div>
      ${byCat.length ? `
        <div class="section-title"><h2>¿En qué se gasta el dinero?</h2></div>
        <div class="card bars">${byCat.map(x => `
          <div class="bar-row" style="--c:${x.c.color}"><div class="bh"><span>${x.c.emoji} ${esc(x.c.name)}</span><b>${money(x.v)}</b></div>
          <div class="bt"><i data-w="${spent ? x.v / spent * 100 : 0}%"></i></div></div>`).join('')}</div>` : ''}
      ${pp.length > 1 ? `
        <div class="section-title"><h2>¿Quién pagó?</h2></div>
        <div class="card bars">${pp.map(([p, v], i) => `
          <div class="bar-row" style="--c:${PCOL[i % PCOL.length]}"><div class="bh"><span>${esc(p)}</span><b>${money(v)}</b></div>
          <div class="bt"><i data-w="${spent ? v / spent * 100 : 0}%"></i></div></div>`).join('')}</div>` : ''}
      ${settleHTML()}
      <div class="section-title"><h2>Movimientos</h2><span class="link" style="color:var(--muted)">${ex.length} registros</span></div>
      ${dates.length ? dates.map(d => {
        const list = ex.filter(e => e.date === d).sort((a, b) => (b.created || 0) - (a.created || 0));
        return `<div class="day-h"><span>${esc(fmtDay(d))}</span><span>${money(list.reduce((s, e) => s + (+e.amount || 0), 0))}</span></div>
          ${list.map((e, i) => { const c = catOf(e.cat); return `
            <button class="exp-row" style="--c:${c.color};--i:${Math.min(i, 10)}" data-act="editExpense" data-id="${e.id}">
              <span class="ei">${c.emoji}</span>
              <span class="em"><span class="en">${esc(e.desc || c.name)}</span>
                <span class="es">${esc(c.name)}${e.payer ? ' · ' + esc(e.payer) : ''}${isPartial(e) ? ' · ' + ic('users') + ' entre ' + sharersOf(e).length : ''}${e.split ? ' · ' + ic('users') + ' cuentas separadas' : ''}${(e.photos || []).length ? ' · ' + ic('camera') + ' ' + e.photos.length : ''}</span></span>
              <span class="ea">${money(e.amount)}<small>${esc(e.method || '')}</small></span>
            </button>`; }).join('')}`;
      }).join('') : `<div class="card empty"><span class="ee">${ic('receipt')}</span><b>Sin gastos todavía</b>Registra cada compra, sube la foto de la boleta y genera la carta financiera al final.</div>`}
    </div><button class="fab" data-act="newExpense" aria-label="Nuevo gasto">${ic('plus')}</button>`;
  }

  function photosHTML() {
    return draft.photos.map(id => `<div class="photo"><img data-photo="${id}" alt="Comprobante"><button class="x" data-act="rmPhoto" data-id="${id}" aria-label="Quitar foto">✕</button></div>`).join('') +
      `<label class="photo-add"><div><span>${ic('camera')}</span>Foto o PDF</div><input type="file" accept="image/*,application/pdf" multiple hidden data-change="photos"></label>`;
  }
  function chipGroup(group, options, current, colorOf) {
    return `<div class="chips wrap">${options.map(o => {
      const v = typeof o === 'string' ? o : o.id, label = typeof o === 'string' ? esc(o) : `${o.emoji ? o.emoji + ' ' : ''}${esc(o.name)}`;
      return `<button class="chip ${String(current) === String(v) ? 'active' : ''}" style="--c:${colorOf ? colorOf(o) : 'var(--violet)'}" data-act="pick" data-g="${group}" data-v="${esc(v)}">${label}</button>`;
    }).join('')}</div>`;
  }
  function expenseHTML() {
    if (draft._bol) return BOL.reviewHTML();   // hoja "Revisa tu boleta" (analizador de boletas)
    if (draft._split) return SEP.html();       // hoja "Cuentas separadas"
    const d = draft, t = S().trip;
    return `<div class="sheet-title"><span class="st-ico">${ic('wallet')}</span><div><h2>${d.id ? 'Editar gasto' : 'Nuevo gasto'}</h2><p>Queda listo para la carta financiera</p></div></div>
      <div class="amount"><input id="exAmount" inputmode="decimal" placeholder="0" value="${esc(d.amount)}" autocomplete="off" aria-label="Monto">
        <small id="exAmountFmt">${esc(t.currency)} · ${money(parseAmount(d.amount))}</small></div>
      <div class="field"><span>Categoría</span>${chipGroup('cat', EXPENSE_CATS, d.cat, o => o.color)}</div>
      <label class="field"><span>Descripción</span><input id="exDesc" value="${esc(d.desc)}" placeholder="Ej: Cervezas en el bar del puerto" autocomplete="off"></label>
      <div class="field-row">
        <label class="field"><span>Fecha</span><input type="date" id="exDate" value="${esc(d.date)}"></label>
        <label class="field"><span>N° documento</span><input id="exDocNum" value="${esc(d.docNum)}" placeholder="Ej: 004512" autocomplete="off"></label>
      </div>
      <div class="field"><span>Tipo de comprobante</span>${chipGroup('docType', DOC_TYPES, d.docType)}</div>
      <div class="field"><span>Pagado por</span>${chipGroup('payer', [FUND].concat(t.people), d.payer, o => o === FUND ? 'var(--violet)' : 'var(--pink)')}</div>
      <p class="hint">¿Falta alguien? Agrégalo en la configuración del viaje.</p>
      <div id="exAmong">${amongHTML()}</div>
      <div class="field"><span>Medio de pago</span>${chipGroup('method', PAY_METHODS, d.method, () => 'var(--cyan)')}</div>
      <div class="field"><span>Fotos de boleta / comprobante</span><div class="photos" id="exPhotos">${photosHTML()}</div></div>
      <div id="bolBox">${BOL.buttonHTML()}</div>
      ${SEP.expenseButtonHTML()}
      <label class="field"><span>Notas</span><textarea id="exNotes" placeholder="Opcional">${esc(d.notes)}</textarea></label>
      <button class="btn primary block shine" data-act="saveExpense">Guardar gasto</button>
      ${d.id ? `<button class="btn danger block" style="margin-top:10px" data-act="delExpense">Eliminar gasto</button>` : ''}`;
  }
  /* Opcional: repartir el gasto solo entre algunos (ej. cervezas). Sin elegir a nadie = todos */
  function amongHTML() {
    const d = draft, people = S().trip.people;
    if (d.payer === FUND || people.length < 2) return '';
    const sel = (d.among || []).filter(p => people.includes(p)), all = !sel.length;
    const n = all ? people.length : sel.length;
    return `<div class="field"><span>¿Entre quiénes se reparte? <i class="among-n">${all ? 'Todos' : n} · ${money(parseAmount($('#exAmount') ? $('#exAmount').value : d.amount) / n)} c/u</i></span>
      <div class="chips wrap">
        <button class="chip ${all ? 'active' : ''}" style="--c:var(--lime)" data-act="amongAll">Todos</button>
        ${people.map(p => `<button class="chip ${sel.includes(p) ? 'active' : ''}" style="--c:var(--cyan)" data-act="amongTog" data-p="${esc(p)}">${esc(p)}</button>`).join('')}
      </div></div>
      <p class="hint" style="margin-top:-6px">Opcional: si fue solo de algunos (ej. cervezas), tócalos. Cuentas claras lo reparte solo entre ellos.</p>`;
  }
  const refreshAmong = () => { const b = $('#exAmong'); if (b && draft && draft._kind === 'expense') b.innerHTML = amongHTML(); };
  function openExpense(id, preset) {
    const ex = id ? S().expenses.find(e => e.id === id) : null;
    draft = ex ? JSON.parse(JSON.stringify(ex)) : Object.assign({
      id: null, amount: '', cat: 'super', desc: '', date: Store.today(), payer: +S().trip.budget ? FUND : (S().trip.people[0] || ''),
      method: 'Débito', docType: 'Boleta', docNum: '', photos: [], notes: ''
    }, preset || {});
    draft.photos = draft.photos || [];
    Object.assign(draft, { _kind: 'expense', _added: [], _removed: [] });
    const mine = draft;
    openSheet(expenseHTML, () => {
      if (!mine._saved) mine._added.forEach(pid => Store.photos.del(pid));
      if (draft === mine) draft = null;
    });
  }

  function splitHTML() {
    const d = draft;
    return `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-sea)">${ic('calculator')}</span><div><h2>Dividir cuenta</h2><p>Ideal para el bar o el restaurante</p></div></div>
      <div class="amount"><input id="spTotal" inputmode="decimal" placeholder="0" value="${esc(d.total)}" autocomplete="off" aria-label="Total de la cuenta"><small>Total de la cuenta</small></div>
      <div class="field"><span>Propina</span>${chipGroup('tip', ['0', '10', '15', '20'].map(x => ({ id: x, name: x === '0' ? 'Sin propina' : x + '%' })), d.tip, () => 'var(--cyan)')}</div>
      <div class="field"><span>¿Entre cuántos?</span>
        <div class="stepper" style="padding:6px"><button data-act="spN" data-d="-1">−</button><b id="spN" style="min-width:44px;font-size:22px">${d.n}</b><button data-act="spN" data-d="1">+</button></div></div>
      <div class="split-out"><div class="eyebrow" style="color:rgba(255,255,255,.85)">Cada uno paga</div><div class="pp" id="spPP">${money(0)}</div><div id="spTot" style="font-weight:700">Total con propina ${money(0)}</div></div>
      <button class="btn lime block" data-act="splitToExpense">Registrar como gasto</button>`;
  }
  function splitCalc() {
    const tot = parseAmount($('#spTotal') ? $('#spTotal').value : draft.total);
    const withTip = Math.round(tot * (1 + (+draft.tip || 0) / 100) * 100) / 100;
    return { tot, withTip, pp: withTip / Math.max(1, draft.n) };
  }
  function updateSplit() {
    if (!draft || draft._kind !== 'split') return;
    const r = splitCalc();
    $('#spPP').textContent = money(r.pp);
    $('#spTot').textContent = `Total con propina ${money(r.withTip)}`;
  }

  function tripHTML() {
    const t = S().trip;
    const CUR = [['CLP', 'Peso chileno'], ['USD', 'Dólar'], ['EUR', 'Euro'], ['ARS', 'Peso argentino'], ['PEN', 'Sol peruano'], ['BRL', 'Real'], ['MXN', 'Peso mexicano'], ['COP', 'Peso colombiano'], ['UYU', 'Peso uruguayo'], ['BOB', 'Boliviano']];
    return `<div class="sheet-title"><span class="st-ico">${ic('settings')}</span><div><h2>Tu viaje</h2><p>Datos para la agenda y la carta financiera</p></div></div>
      <button class="btn ${Sync.active ? '' : 'sea shine'} block" style="margin-bottom:16px" data-act="sync">
        ${Sync.active ? `${syncDot()} Viaje compartido · ${Sync.members.length} integrantes` : `${ic('users')} Compartir viaje con mi grupo`}</button>
      <label class="field"><span>Nombre del viaje</span><input id="tpName" value="${esc(t.name)}" placeholder="Ej: Gira de estudios Pucón 2026"></label>
      <div class="field-row">
        <label class="field"><span>Inicio</span><input type="date" id="tpStart" value="${esc(t.start)}"></label>
        <label class="field"><span>Término</span><input type="date" id="tpEnd" value="${esc(t.end)}"></label>
      </div>
      <label class="field"><span>Participantes (separados por coma)</span><input id="tpPeople" value="${esc(t.people.join(', '))}" placeholder="Ej: Ana, Pedro, Cami"></label>
      <button class="btn block diet-btn" data-act="diets">${ic('leaf')} Dietas y alergias${dietPeople().length ? ` · ${dietPeople().length} con restricciones` : ''}</button>
      <div class="section-title" style="margin-top:8px"><h2 style="font-size:18px">Fondos y rendición</h2></div>
      <div class="field-row">
        <label class="field"><span>Fondos asignados</span><input id="tpBudget" inputmode="decimal" value="${t.budget || ''}" placeholder="0"></label>
        <label class="field" style="flex:0 0 130px"><span>Moneda</span><select id="tpCur">${CUR.map(c => `<option value="${c[0]}" ${t.currency === c[0] ? 'selected' : ''}>${c[0]} · ${c[1]}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Entidad que entrega los fondos</span><input id="tpEntity" value="${esc(t.entity)}" placeholder="Ej: Universidad, empresa, municipalidad"></label>
      <div class="field"><span>Responsables (firman la carta financiera)</span>
        <div id="rpList">${(U.resps(t).length ? U.resps(t) : [{ name: '', rut: '' }]).map(respRow).join('')}</div>
        <button class="btn sm" data-act="rpAdd">${ic('plus')} Agregar responsable</button>
      </div>
      ${brandHTML(t)}
      <button class="btn primary block shine" data-act="saveTrip">Guardar</button>
      <div class="section-title"><h2 style="font-size:18px">Apariencia y lectura</h2></div>
      ${fontHTML()}
      <div class="section-title"><h2 style="font-size:18px">Tus datos</h2></div>
      <button class="btn block" style="margin-bottom:10px" data-act="trips">${ic('list')} Mis viajes y cuenta</button>
      <p class="hint" style="margin-top:-4px">${TR.signed() ? 'Tus viajes se guardan en tu cuenta. También puedes descargar un respaldo.' : 'Sin cuenta, todo se guarda solo en este equipo. Crea una cuenta en Mis viajes o haz un respaldo para pasarlo a otro celular.'}</p>
      <div class="btn-row">
        <button class="btn sm" data-act="backup">${ic('download')} Respaldo</button>
        <button class="btn sm" data-act="restore">${ic('upload')} Restaurar</button>
        <button class="btn sm danger" data-act="reset">${ic('trash')} Borrar todo</button>
      </div>
      <a class="btn block help-link" href="manual/" target="_blank" rel="noopener">${ic('book')} Manual de uso</a>`;
  }
  /* Logo de los documentos (carta financiera, PDF y PNG): el de Viajapp, el de la institución o empresa, o ninguno */
  const BRAND = [['viajapp', 'Viajapp'], ['custom', 'Mi logo'], ['none', 'Sin logo']];
  function brandHTML(t) {
    const b = t.brand || {}, mode = b.mode || 'viajapp';
    return `<div class="field"><span>Logo en la carta financiera y los documentos</span>
      <div class="chips wrap">${BRAND.map(([v, n]) => `<button class="chip ${mode === v ? 'active' : ''}" style="--c:var(--violet)" data-act="brandMode" data-v="${v}">${n}</button>`).join('')}</div>
      ${mode === 'custom' ? `<div class="brand-box">
        ${b.logo ? `<img src="${b.logo}" alt="Logo de los documentos">` : `<span class="brand-empty">${ic('image')}</span>`}
        <label class="btn sm">${ic('upload')} ${b.logo ? 'Cambiar logo' : 'Subir logo'}<input type="file" accept="image/*" hidden data-change="brandLogo"></label>
      </div>` : ''}
      <p class="hint" style="margin-top:6px">${mode === 'custom' ? 'Usa el logo de tu institución o empresa (PNG con fondo transparente se ve mejor).'
        : mode === 'none' ? 'Los documentos salen sin logo y sin la marca Viajapp.' : 'Puedes cambiarlo por el logo de tu institución o empresa.'}</p></div>`;
  }
  /* Achica el logo subido (máx. 600 px). PNG si tiene transparencia y pesa poco; si no, JPEG sobre blanco */
  function brandLogoData(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, 600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let out = c.toDataURL('image/png');
        if (out.length > 350000) { const w = document.createElement('canvas'); w.width = c.width; w.height = c.height; const x = w.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height); x.drawImage(c, 0, 0); out = w.toDataURL('image/jpeg', 0.88); }
        res(out);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Imagen no válida')); };
      img.src = url;
    });
  }

  /* Lee la hoja "Tu viaje" y guarda (sin cerrarla) */
  function persistTrip() {
    const t = S().trip;
    let s = $('#tpStart').value || Store.today(), e = $('#tpEnd').value || s;
    if (e < s) { const x = s; s = e; e = x; }
    const people = $('#tpPeople').value.split(',').map(x => x.trim()).filter(Boolean);
    Object.assign(t, {
      name: $('#tpName').value.trim() || 'Mi viaje', emoji: (draft && draft.emoji) || t.emoji, start: s, end: e,
      people: people.length ? [...new Set(people)] : ['Yo'], budget: parseAmount($('#tpBudget').value),
      currency: $('#tpCur').value, entity: $('#tpEntity').value.trim()
    });
    const rs = $$('.resp-row').map(r => ({ name: r.querySelector('.rp-name').value.trim(), rut: r.querySelector('.rp-rut').value.trim() })).filter(r => r.name);
    // `responsible`/`rut` se mantienen resumidos para versiones anteriores de la app
    Object.assign(t, { responsibles: rs, responsible: rs.map(r => r.name).join(', '), rut: rs.length ? rs[0].rut : '' });
    Store.save();
  }
  function respRow(r) {
    return `<div class="resp-row">
      <input class="rp-name" value="${esc(r.name)}" placeholder="Nombre completo" autocomplete="off">
      <input class="rp-rut" value="${esc(r.rut)}" placeholder="RUT" autocomplete="off">
      <button class="del" data-act="rpDel" aria-label="Quitar responsable">✕</button>
    </div>`;
  }

  /* ================= AGENDA ================= */
  const PH = { desayuno: 'Ej: Huevos revueltos con palta y café', almuerzo: 'Ej: Asado en la terraza', once: 'Ej: Pan con palta y té', cena: 'Ej: Pastas boloñesa', snack: 'Ej: Tabla de quesos y vino', actividad: 'Ej: Trekking al mirador' };

  function renderAgenda() {
    const m = ui.calMonth, y = m.getFullYear(), mo = m.getMonth();
    const off = (new Date(y, mo, 1).getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate();
    const cells = Math.ceil((off + dim) / 7) * 7, t = S().trip, today = Store.today();
    const byDate = {};
    S().events.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
    let days = '';
    for (let i = 0; i < cells; i++) {
      const d = new Date(y, mo, 1 - off + i), ds = iso(d), evs = byDate[ds] || [];
      const cls = ['cal-day', d.getMonth() !== mo && 'out', ds >= t.start && ds <= t.end && 'trip', ds === today && 'today', ds === ui.selDate && 'sel'].filter(Boolean).join(' ');
      const cols = [...new Set(evs.map(e => typeOf(e.type).color))].slice(0, 4);
      days += `<button class="${cls}" data-act="day" data-d="${ds}">${d.getDate()}<span class="dots">${cols.map(c => `<i style="--c:${c}"></i>`).join('')}</span></button>`;
    }
    const evs = (byDate[ui.selDate] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return `<div class="page">
      ${header('Agenda del viaje', 'Comidas y planes', `<button class="icon-btn" data-act="exp" data-k="agendaPDF" aria-label="Exportar agenda" style="--i:1">${ic('file')}</button>`)}
      <div class="card cal">
        <div class="cal-head">
          <button class="icon-btn" data-act="month" data-d="-1" aria-label="Mes anterior">‹</button>
          <h3 data-act="calToday" role="button">${U.MONTHS[mo]} ${y}</h3>
          <button class="icon-btn" data-act="month" data-d="1" aria-label="Mes siguiente">›</button>
        </div>
        <div class="cal-grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<div class="cal-dow">${x}</div>`).join('')}</div>
        <div class="cal-grid" id="calDays">${days}</div>
      </div>
      <div id="dayBox">
        <div class="section-title"><h2>${esc(cap(fmtDay(ui.selDate)))}</h2><span class="link" style="color:var(--muted)">${evs.length} ${evs.length === 1 ? 'plan' : 'planes'}</span></div>
        <div class="quick-add">${EVENT_TYPES.map(x => `<button class="qa" style="--c:${x.color}" data-act="newEvent" data-type="${x.id}"><span>${x.emoji}</span>${x.name}</button>`).join('')}</div>
        ${evs.length ? `<div class="timeline" style="margin-top:12px">${evs.map(evCard).join('')}</div>`
          : `<div class="card empty" style="margin-top:12px"><span class="ee">${ic('calendar')}</span><b>Día libre</b>Toca un tipo de comida arriba para agendarla.</div>`}
      </div>
    </div><button class="fab" data-act="newEvent" data-type="almuerzo" aria-label="Nuevo plan">${ic('plus')}</button>`;
  }

  function eventHTML() {
    const d = draft, tt = typeOf(d.type);
    const rr = d.recipe && getRecipe(d.recipe.id);
    return `<div class="sheet-title"><span class="st-ico" id="evIco" style="--c:${tt.color}">${tt.emoji}</span><div><h2>${d.id ? 'Editar plan' : 'Nuevo plan'}</h2><p>Desayunos, almuerzos, onces, cenas y más</p></div></div>
      ${rr ? `<div class="recipe-link" style="--c:${rcatOf(rr.c).color}"><span class="rl-e">${rr.e}</span><div><b>${esc(recLabel(rr, d.recipe.vi))}</b><small>Receta vinculada · ${d.recipe.p} personas</small></div></div>
        <div class="btn-row" style="margin-bottom:${d.id ? 8 : 16}px"><button class="btn sm lime" data-act="evToList">${ic('cart')} Ingredientes a la lista</button><button class="btn sm" data-act="evCook">${ic('book')} Ver receta</button></div>
        ${d.id ? (d.cooked
          ? `<button class="btn sm block cooked-btn" data-act="evUncook" style="margin-bottom:16px">${ic('check')} Cocinado · deshacer</button>`
          : `<button class="btn sm sea block" data-act="evCooked" style="margin-bottom:6px">${ic('box')} Marcar como cocinado</button><p class="hint" style="margin-bottom:16px">Descuenta sus ingredientes de la despensa.</p>`) : ''}` : ''}
      <div class="field"><span>Tipo</span>${chipGroup('type', EVENT_TYPES, d.type, o => o.color)}</div>
      <label class="field"><span>¿Qué vamos a comer / hacer?</span><input id="evTitle" value="${esc(d.title)}" placeholder="${esc(PH[d.type] || '')}" autocomplete="off"></label>
      <div class="field-row">
        <label class="field"><span>Fecha</span><input type="date" id="evDate" value="${esc(d.date)}"></label>
        <label class="field" style="flex:0 0 120px"><span>Hora</span><input type="time" id="evTime" value="${esc(d.time)}"></label>
      </div>
      <label class="field"><span>Lugar</span><input id="evPlace" value="${esc(d.place)}" placeholder="Ej: Cabaña, restaurante..." autocomplete="off"></label>
      <label class="field"><span>Encargado / quién cocina</span><input id="evWho" value="${esc(d.who)}" placeholder="Ej: Pedro y Cami" autocomplete="off" list="peopleList">
        <datalist id="peopleList">${S().trip.people.map(p => `<option value="${esc(p)}">`).join('')}</datalist></label>
      <label class="field"><span>Notas</span><textarea id="evNotes" placeholder="Ingredientes, reserva, etc.">${esc(d.notes)}</textarea></label>
      <button class="btn primary block shine" data-act="saveEvent">Guardar plan</button>
      ${d.id ? `<button class="btn danger block" style="margin-top:10px" data-act="delEvent">Eliminar plan</button>` : ''}`;
  }
  /* Copia lo escrito en la hoja del plan al borrador (para refrescarla sin perder cambios) */
  function readEventForm() {
    const v = id => { const el = $('#' + id); return el ? el.value : null; };
    [['title', 'evTitle'], ['date', 'evDate'], ['time', 'evTime'], ['place', 'evPlace'], ['who', 'evWho'], ['notes', 'evNotes']]
      .forEach(([k, id]) => { const x = v(id); if (x != null) draft[k] = x; });
  }
  function openEvent(id, type, preset) {
    const ev = id ? S().events.find(e => e.id === id) : null;
    const tt = typeOf(type || 'almuerzo');
    draft = ev ? JSON.parse(JSON.stringify(ev))
      : Object.assign({ id: null, type: tt.id, title: '', date: ui.selDate, time: tt.time, place: '', who: '', notes: '' }, preset || {});
    draft._kind = 'event'; draft._timeTouched = !!ev;
    openSheet(eventHTML, releaseDraft(draft));
  }

  /* ================= CUENTAS CLARAS (quién le debe a quién) ================= */
  /* Entre quiénes se reparte un gasto: `among` vacío o sin nombres vigentes = todos los participantes */
  function sharersOf(e) {
    const people = S().trip.people, sel = (e.among || []).filter(p => people.includes(p));
    return sel.length ? sel : people;
  }
  const isPartial = e => (e.among || []).filter(p => S().trip.people.includes(p)).length > 0 && sharersOf(e).length < S().trip.people.length;
  function settle() {
    const people = S().trip.people;
    if (people.length < 2) return null;
    const ex = S().expenses.filter(e => e.payer && e.payer !== FUND);
    const total = ex.reduce((s, e) => s + (+e.amount || 0), 0);
    if (!total) return null;
    const share = total / people.length, bal = {}, part = {};
    people.forEach(p => { bal[p] = 0; part[p] = 0; });
    ex.forEach(e => {
      const amt = +e.amount || 0, sep = SEP.shares(e);
      if (sep) Object.entries(sep).forEach(([p, v]) => { bal[p] = (bal[p] || 0) - v; part[p] = (part[p] || 0) + v; });   // cuentas separadas
      else { const who = sharersOf(e); who.forEach(p => { bal[p] -= amt / who.length; part[p] += amt / who.length; }); }
      bal[e.payer] = (bal[e.payer] || 0) + amt;
    });
    const partial = ex.filter(e => isPartial(e) || SEP.shares(e)).length;
    const deb = Object.entries(bal).filter(([, b]) => b < -0.5).map(([p, b]) => ({ p, b: -b })).sort((a, b) => b.b - a.b);
    const cred = Object.entries(bal).filter(([, b]) => b > 0.5).map(([p, b]) => ({ p, b })).sort((a, b) => b.b - a.b);
    const tr = [];
    let i = 0, j = 0;
    while (i < deb.length && j < cred.length) {
      const m = Math.min(deb[i].b, cred[j].b);
      tr.push({ from: deb[i].p, to: cred[j].p, amt: m });
      deb[i].b -= m; cred[j].b -= m;
      if (deb[i].b < 0.5) i++;
      if (cred[j].b < 0.5) j++;
    }
    return { total, share, bal, part, partial, tr };
  }
  function settleHTML() {
    const st = settle();
    if (!st) return '';
    return `<div class="section-title"><h2>Cuentas claras</h2><button class="link" data-act="copySettle">${ic('copy')} Copiar</button></div>
      <div class="card">
        <p class="hint" style="margin:0 0 10px">${st.partial
          ? `Gastos pagados por personas: ${money(st.total)}. ${st.partial === 1 ? '1 gasto se reparte' : st.partial + ' gastos se reparten'} solo entre algunos, así que a cada uno le toca su parte.`
          : `Gastos pagados por personas: ${money(st.total)} ÷ ${S().trip.people.length} = <b style="color:var(--strong)">${money(st.share)}</b> c/u.`} No incluye lo pagado con “${FUND}”.</p>
        ${Object.entries(st.bal).map(([p, b]) => `<div class="settle-row"><span>${esc(p)}${st.partial && st.part[p] !== undefined ? `<small class="sr-part">su parte ${money(st.part[p])}</small>` : ''}</span><b class="${b >= -0.5 ? 'pos' : 'neg'}">${b >= -0.5 ? '+' : '−'}${money(Math.abs(b))}</b></div>`).join('')}
        ${st.tr.length ? st.tr.map(t => `<div class="transfer"><span>${esc(t.from)}</span><span class="arrow">${ic('arrow')}</span><span>${esc(t.to)}</span><b>${money(t.amt)}</b></div>`).join('')
          : `<div class="transfer" style="justify-content:center">${ic('check')} Están a mano</div>`}
      </div>`;
  }

  /* ================= RECETAS ================= */
  const BUILTIN = new Set(RECIPES.map(r => r.id));
  const R_ = () => { const s = S(); s.recipes = s.recipes || { custom: {}, hidden: {} }; return s.recipes; };
  function allRecipes() {
    const rs = R_();
    const list = RECIPES.filter(r => !rs.hidden[r.id]).map(r => rs.custom[r.id] || r);
    Object.values(rs.custom).forEach(r => { if (!BUILTIN.has(r.id) && !rs.hidden[r.id]) list.push(r); });
    return list;
  }
  const getRecipe = id => R_().custom[id] || RECIPES.find(r => r.id === id);
  const rcatOf = id => RECIPE_CATS.find(c => c.id === id) || RECIPE_CATS[0];
  const recLabel = (r, vi) => r.vars[vi] ? `${r.n} · ${r.vars[vi].n}` : r.n;
  /* Ingredientes de la base + variante, sumando repetidos */
  function recipeIngs(r, vi) {
    const out = [], idx = {}, v = r.vars[vi];
    r.base.concat(v ? v.ing : []).forEach(g => {
      const k = key(g.c, g.i, g.v) + '|' + (g.q ? g.u : '');
      if (idx[k] != null) { out[idx[k]].q += g.q; return; }
      idx[k] = out.length; out.push(Object.assign({}, g));
    });
    return out;
  }
  /* Asegura que el producto exista en el catálogo (si viene de una receta propia) */
  function ensureCatalogItem(c, i, v) {
    const cat = CATALOG.find(x => x.id === c) || CATALOG.find(x => x.id === 'despensa');
    const it = itemsOf(cat).find(x => x.n === i);
    if (!it) (S().shop.custom[cat.id] = S().shop.custom[cat.id] || []).push({ n: i, e: cat.emoji, v: v ? [v] : [] });
    else if (v && !it.v.includes(v)) {
      const ex = S().shop.extraVar = S().shop.extraVar || {};
      (ex[cat.id + '|' + i] = ex[cat.id + '|' + i] || []).push(v);
    }
    return cat.id;
  }
  /* Plan de compra de una receta: adapta a las dietas del grupo y descuenta lo que hay en la despensa.
     mode: 'portion' (porción aparte para quien lo necesita) | 'all' (todo el plato apto) | 'none' (sin adaptar) */
  function cookPlan(r, vi, p, mode) {
    const people = dietPeople(), rows = [], issues = [], adapts = [];
    const push = (g, tot, extra) => rows.push(Object.assign({ c: g.c, i: g.i, v: g.v, u: g.u, fixed: !g.q, tot }, extra || {}));
    recipeIngs(r, vi).forEach(g => {
      const tot = g.q ? g.q * p : 0;
      const who = whoCant(g.c, g.i, g.v, people);
      if (!who.length || mode === 'none') { push(g, tot); if (who.length) issues.push({ g, who }); return; }
      const avoid = new Set((mode === 'all' ? people : who.map(x => x.p)).flatMap(pp => [...pp.avoid]));
      const sub = Diet.substitute(g, avoid);
      if (!sub) { push(g, tot); issues.push({ g, who }); return; }
      const k = mode === 'all' ? p : Math.min(p, who.length);
      if (p - k > 0) push(g, g.q ? g.q * (p - k) : 0);
      push(Object.assign({}, g, sub), g.q ? g.q * k : 0, { adapted: true, forWho: mode === 'all' ? null : who.map(x => x.p.name) });
      adapts.push({ g, sub, who });
    });
    rows.forEach(row => {
      row.k = key(row.c, row.i, row.v) + (row.adapted ? '|a' : '');
      const e = pantryOf(row.c, row.i, row.v);
      if (!e) return;
      row.have = e;
      if (row.fixed) row.covered = true;
      else if (e.a[row.u]) { row.need = Math.max(0, Math.round((row.tot - e.a[row.u]) * 100) / 100); row.covered = row.need <= 0; }
    });
    return { rows, issues, adapts };
  }
  /* Estado de una receta para el grupo: ok (apta), adapt (apta con reemplazos), no (alguien no puede) */
  function planStatus(pl) { return pl.issues.length ? 'no' : pl.adapts.length ? 'adapt' : 'ok'; }
  function recipeStatus(r) {
    if (!dietPeople().length) return null;
    const vis = r.vars.length ? r.vars.map((_, i) => i) : [-1];
    let best = null;
    for (const vi of vis) {
      const pl = cookPlan(r, vi, 4, 'portion'), s = planStatus(pl);
      if (s === 'ok') return { s };
      if (s === 'adapt') best = { s };
      else if (!best) best = { s, who: [...new Set(pl.issues.flatMap(x => x.who.map(w => w.p.name)))] };
    }
    return best;
  }
  function addPlanToList(plan, label, skip) {
    const sel = S().shop.sel;
    let n = 0;
    plan.rows.forEach(row => {
      const off = skip && row.k in skip ? skip[row.k] : !!row.covered;
      if (off) return;
      const c = ensureCatalogItem(row.c, row.i, row.v), k = key(c, row.i, row.v);
      const amt = row.need != null ? row.need : row.tot;
      let e = sel[k];
      // Si ya se había comprado, esa compra quedó en la despensa: se empieza una fila nueva
      if (!e || e.done) e = sel[k] = { c, i: row.i, v: row.v, q: 1, done: false };
      if (amt) { if (e.u === row.u) e.n = (e.n || 0) + amt; else if (!e.u) { e.n = amt; e.u = row.u; } }
      e.src = [...new Set((e.src || []).concat(row.forWho ? `${label} · para ${row.forWho.join(', ')}` : label))];
      n++;
    });
    Store.save(); updateBadge();
    return n;
  }

  function recCards(list) {
    return list.map(r => {
      const cat = rcatOf(r.c), st = recipeStatus(r);
      const badge = !st ? '' : st.s === 'ok' ? `<span class="db ok">${ic('check')} Apta para todos</span>`
        : st.s === 'adapt' ? `<span class="db adapt">${ic('leaf')} Se adapta</span>`
        : `<span class="db no">${ic('alert')} No apta: ${esc(st.who.join(', '))}</span>`;
      return `<button class="item-card" style="--c:${cat.color}" data-act="cook" data-id="${esc(r.id)}">
        <span class="ie">${r.e}</span>
        <span><span class="in">${esc(r.n)}</span><br><span class="iv">${r.vars.length ? r.vars.length + ' variantes' : recipeIngs(r, -1).length + ' ingredientes'}</span>${badge}</span>
        ${R_().custom[r.id] ? `<b class="ib">${ic('star')}</b>` : ''}
      </button>`;
    }).join('');
  }
  function recSections() {
    const q = norm(ui.recQ);
    let list = allRecipes();
    if (ui.recCat === 'mine') list = list.filter(r => R_().custom[r.id]);
    else if (ui.recCat === 'apt') list = list.filter(r => { const st = recipeStatus(r); return st && st.s !== 'no'; });
    else if (ui.recCat !== 'all' && !q) list = list.filter(r => r.c === ui.recCat);   // al buscar se recorre todo el recetario
    if (q) list = list.filter(r => norm(r.n).includes(q) || r.vars.some(v => norm(v.n).includes(q)) || r.base.concat(...r.vars.map(v => v.ing)).some(g => norm(g.i).includes(q)));
    if (!list.length) {
      return `<div class="empty"><span class="ee">${ic('pot')}</span><b>${ui.recCat === 'mine' && !q ? 'Aún no tienes recetas propias' : 'Sin resultados'}</b>Crea una receta con tus propios ingredientes.<br><br>
        <button class="btn primary" data-act="newRecipe">${ic('plus')} Nueva receta</button></div>`;
    }
    const hidden = Object.keys(R_().hidden).length;
    // En "Todas" (sin búsqueda) cada categoría muestra pocas recetas y un acceso al resto: el recetario no se satura
    const compact = ui.recCat === 'all' && !q, LIMIT = 6;
    return RECIPE_CATS.map(c => ({ c, rs: list.filter(r => r.c === c.id) })).filter(g => g.rs.length).map(g => `
      <section class="cat-section" style="--c:${g.c.color}">
        <div class="cat-head"><span class="cat-ico">${g.c.emoji}</span><h3>${esc(g.c.name)}</h3><span class="cat-n">${g.rs.length} recetas</span></div>
        <div class="grid-items">${recCards(compact ? g.rs.slice(0, LIMIT) : g.rs)}
          ${compact && g.rs.length > LIMIT ? `<button class="item-card add more-card" data-act="rcat" data-c="${g.c.id}"><span class="ie add-ic">${ic('arrow')}</span><span class="in">Ver las ${g.rs.length} recetas</span></button>` : ''}
        </div>
      </section>`).join('') +
      (hidden && !q ? `<div style="text-align:center;margin-top:18px"><button class="btn sm" data-act="rcUnhide">${ic('eye')} Mostrar ${hidden} receta(s) oculta(s)</button></div>` : '');
  }
  function recChips() {
    const mine = Object.keys(R_().custom).length;
    return `<div class="chips" id="recChips">
      <button class="chip ${ui.recCat === 'all' ? 'active' : ''}" data-act="rcat" data-c="all" style="--c:var(--pink)">Todas</button>
      ${dietPeople().length ? `<button class="chip ${ui.recCat === 'apt' ? 'active' : ''}" data-act="rcat" data-c="apt" style="--c:var(--teal)">${ic('leaf')} Aptas para el grupo</button>` : ''}
      <button class="chip ${ui.recCat === 'mine' ? 'active' : ''}" data-act="rcat" data-c="mine" style="--c:var(--yellow)">${ic('star')} Mías${mine ? ' · ' + mine : ''}</button>
      ${RECIPE_CATS.map(c => `<button class="chip ${ui.recCat === c.id ? 'active' : ''}" data-act="rcat" data-c="${c.id}" style="--c:${c.color}">${c.emoji} ${esc(c.name)}</button>`).join('')}
    </div>`;
  }
  function renderRecipes() {
    return `<div class="page">
      ${header(`Recetario · ${allRecipes().length} recetas`, '¿Qué cocinamos?')}
      <label class="search"><input type="search" id="recSearch" placeholder="Buscar: pesto, pollo, pisco sour..." value="${esc(ui.recQ)}" autocomplete="off"></label>
      ${dietPeople().length
        ? `<button class="diet-banner" data-act="diets">${ic('leaf')}<span><b>Dietas del grupo</b><small>${esc(dietSummary())}</small></span><i>Editar</i></button>`
        : `<button class="diet-banner empty" data-act="diets">${ic('leaf')}<span><b>¿Alguien tiene una dieta o alergia?</b><small>Agrégala y las recetas avisan y se adaptan solas</small></span></button>`}
      <div class="sticky-chips">${recChips()}</div>
      <div id="recGrid">${recSections()}</div>
    </div><button class="fab" data-act="newRecipe" aria-label="Nueva receta">${ic('plus')}</button>`;
  }

  /* Hoja "cocinar": variante, personas, ingredientes escalados */
  function openCook(id, vi, p) {
    if (!getRecipe(id)) return;
    const n = S().trip.people.length;
    draft = { _kind: 'cook', id, vi: vi || 0, p: p || (n > 1 ? n : 4), skip: {}, mode: 'portion' };
    openSheet(cookHTML, releaseDraft(draft));
  }
  const prodName = (i, v) => esc(i) + (v ? ' ' + esc(v.toLowerCase()) : '');
  /* Agrupa los problemas por persona: una línea por persona con todos sus productos */
  function issuesByPerson(issues) {
    const m = new Map();
    issues.forEach(x => x.who.forEach(w => {
      const e = m.get(w.p.name) || { name: w.p.name, prods: [], why: [] };
      e.prods.push(prodName(x.g.i, x.g.v)); e.why.push(...w.why);
      m.set(w.p.name, e);
    }));
    return [...m.values()];
  }
  function dietBoxHTML(r, d) {
    const people = dietPeople();
    if (!people.length) return '';
    const probe = cookPlan(r, d.vi, d.p, 'portion');
    if (planStatus(probe) === 'ok') return `<div class="diet-box ok">${ic('check')} Apta para todo el grupo (${esc(people.map(p => p.name).join(', '))})</div>`;
    const pl = cookPlan(r, d.vi, d.p, d.mode);
    const names = w => w.map(x => `<b>${esc(x.p.name)}</b>`).join(', ');
    return `<div class="diet-box">
      <div class="db-h">${ic('leaf')} Dietas del grupo</div>
      ${pl.adapts.map(a => `<div class="db-line">${names(a.who)}: ${prodName(a.g.i, a.g.v)} → <b>${prodName(a.sub.i, a.sub.v)}</b>${d.mode === 'portion' ? ' (porción aparte)' : ''}</div>`).join('')}
      ${issuesByPerson(pl.issues).map(x => `<div class="db-line bad">${ic('alert')} <b>${esc(x.name)}</b> no puede comer ${x.prods.join(', ')} (${esc(whyText(x.why))})${d.mode === 'none' ? '' : ': sin reemplazo, prepárale algo aparte'}.</div>`).join('')}
      <div class="chips wrap" style="margin-top:10px">${[['portion', 'Porción aparte'], ['all', 'Todo el plato apto'], ['none', 'Sin adaptar']].map(([m, l]) =>
        `<button class="chip ${d.mode === m ? 'active' : ''}" style="--c:var(--teal)" data-act="cookMode" data-m="${m}">${l}</button>`).join('')}</div>
    </div>`;
  }
  function cookHTML() {
    const d = draft, r = getRecipe(d.id), cat = rcatOf(r.c), sel = S().shop.sel;
    const people = dietPeople();
    const plan = cookPlan(r, d.vi, d.p, d.mode);
    const isOff = row => row.k in d.skip ? d.skip[row.k] : !!row.covered;
    const on = plan.rows.filter(row => !isOff(row)).length;
    const vClass = vi => people.length ? 'dv-' + planStatus(cookPlan(r, vi, d.p, 'portion')) : '';
    return `<div class="sheet-title"><span class="st-ico" style="--c:${cat.color}">${r.e}</span>
        <div><h2>${esc(r.n)}</h2><p>${esc(cat.name)}${R_().custom[r.id] ? ' · personalizada' : ''}</p></div></div>
      ${r.vars.length ? `<div class="field"><span>Variante</span><div class="chips wrap">${r.vars.map((v, i) =>
        `<button class="chip ${vClass(i)} ${i === d.vi ? 'active' : ''}" style="--c:${cat.color}" data-act="cookVar" data-i="${i}">${esc(v.n)}</button>`).join('')}</div></div>` : ''}
      <div class="field"><span>¿Para cuántas personas?</span>
        <div class="stepper" style="padding:6px"><button data-act="cookP" data-d="-1">−</button><b style="min-width:44px;font-size:22px">${d.p}</b><button data-act="cookP" data-d="1">+</button></div></div>
      ${dietBoxHTML(r, d)}
      <div class="field"><span>Ingredientes (${on}/${plan.rows.length}) · desmarca lo que ya tienes</span>
        ${plan.rows.map(row => {
          const off = isOff(row), partial = row.need != null && !row.covered;
          const amt = row.fixed ? 'x1' : U.amt(partial ? row.need : row.tot, row.u);
          const pantry = row.have ? ` <small class="inpantry">${row.covered ? 'en despensa' : 'despensa: ' + esc(pantryText(row.have))}</small>` : '';
          return `<div class="variant-row ${off ? '' : 'on'}" style="--c:${cat.color}" data-act="cookSkip" data-k="${esc(row.k)}">
            <span class="check ${off ? '' : 'on'}">${CHECK}</span>
            <span class="vn">${esc(row.i)}${row.v ? ` <small style="color:var(--muted)">· ${esc(row.v)}</small>` : ''}${row.adapted ? ` <small class="adapted">${row.forWho ? 'para ' + esc(row.forWho.join(', ')) : 'apto para todos'}</small>` : ''}${pantry}${sel[key(row.c, row.i, row.v)] ? ' <small class="inlist">en tu lista</small>' : ''}</span>
            <b class="amt">${partial ? 'faltan ' : ''}${esc(amt)}</b></div>`;
        }).join('')}</div>
      <button class="btn primary block shine" data-act="cookAdd">${ic('cart')} Agregar ${on} ingredientes a la lista</button>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn sea" data-act="cookAgenda">${ic('calendar')} Agendar</button>
        <button class="btn" data-act="editRecipe" data-id="${esc(r.id)}">${ic('edit')} Editar receta</button>
      </div>`;
  }

  /* Editor de recetas */
  const UNITS_ED = [['g', 'g'], ['ml', 'ml'], ['un', 'un'], ['lata', 'lata'], ['pq', 'paq.'], ['fr', 'frasco'], ['bot', 'botella'], ['bolsa', 'bolsa'], ['fijo', 'fijo']];
  let ingIndex = null;
  function buildIngIndex() {
    const map = new Map(), opts = [];
    CATALOG.forEach(cat => itemsOf(cat).forEach(it => {
      [''].concat(it.v).forEach(v => {
        const label = v ? `${it.n} · ${v}` : it.n, k = norm(label);
        if (!map.has(k)) { map.set(k, { c: cat.id, i: it.n, v }); opts.push(`<option value="${esc(label)}">`); }
      });
    }));
    ingIndex = { map, html: `<datalist id="ingList">${opts.join('')}</datalist>` };
  }
  const toRow = g => ({ t: g.v ? `${g.i} · ${g.v}` : g.i, q: g.q ? String(g.q) : '', u: g.q ? g.u : 'fijo' });
  const blankRow = () => ({ t: '', q: '', u: 'g' });
  function openRecipeEditor(id) {
    const r = id ? getRecipe(id) : null;
    buildIngIndex();
    const c0 = RECIPE_CATS.some(c => c.id === ui.recCat) ? ui.recCat : 'pastas';
    draft = {
      _kind: 'recipe', id: r ? r.id : null, n: r ? r.n : '', e: r ? r.e : '🍽️', c: r ? r.c : c0,
      base: r ? r.base.map(toRow) : [blankRow()],
      vars: r ? r.vars.map(v => ({ n: v.n, ing: v.ing.map(toRow) })) : []
    };
    openSheet(recipeEditHTML, releaseDraft(draft));
  }
  function ingRowsHTML(s, rows) {
    return rows.map((g, ri) => `<div class="ing-row" data-s="${s}" data-ri="${ri}">
        <input class="ing-t" list="ingList" value="${esc(g.t)}" placeholder="Producto (ej: Aceite · Maravilla)" autocomplete="off">
        <input class="ing-q" inputmode="decimal" value="${g.u === 'fijo' ? '' : esc(g.q)}" placeholder="Cant.">
        <select class="ing-u">${UNITS_ED.map(([v, l]) => `<option value="${v}" ${g.u === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="del" data-act="rcDelRow" data-s="${s}" data-ri="${ri}" aria-label="Quitar">✕</button>
      </div>`).join('') +
      `<button class="btn sm" style="margin:2px 0 6px" data-act="rcAddRow" data-s="${s}">${ic('plus')} Ingrediente</button>`;
  }
  function recipeEditHTML() {
    const d = draft, builtin = d.id && BUILTIN.has(d.id), edited = d.id && R_().custom[d.id];
    return `<div class="sheet-title"><span class="st-ico">${ic(d.id ? 'edit' : 'plus')}</span><div><h2>${d.id ? 'Editar receta' : 'Nueva receta'}</h2>
        <p>${builtin ? 'Tus cambios no borran la original' : 'Se guarda en Mías'}</p></div></div>
      <div class="field-row">
        <label class="field" style="flex:0 0 80px"><span>Emoji</span><input id="rcEmoji" value="${esc(d.e)}" maxlength="4"></label>
        <label class="field"><span>Nombre</span><input id="rcName" value="${esc(d.n)}" placeholder="Ej: Pastas de la abuela" autocomplete="off"></label>
      </div>
      <label class="field"><span>Categoría</span><select id="rcCat">${RECIPE_CATS.map(c => `<option value="${c.id}" ${d.c === c.id ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></label>
      <p class="hint">Cantidades <b>por persona</b>. Usa “fijo” para lo que se compra una sola vez (sal, aceite, especias). Elige del catálogo o escribe un producto nuevo.</p>
      <div class="section-title" style="margin-top:6px"><h2 style="font-size:17px">Ingredientes base</h2></div>
      ${ingRowsHTML('b', d.base)}
      <div class="section-title"><h2 style="font-size:17px">Variantes</h2></div>
      ${d.vars.map((v, vi) => `<div class="rc-var">
        <div class="field-row" style="align-items:flex-end">
          <label class="field" style="margin-bottom:8px"><span>Nombre de la variante</span><input class="rc-vname" data-vi="${vi}" value="${esc(v.n)}" placeholder="Ej: Boloñesa"></label>
          <button class="del" style="margin-bottom:14px" data-act="rcDelVar" data-vi="${vi}" aria-label="Eliminar variante">${ic('trash')}</button>
        </div>${ingRowsHTML(vi, v.ing)}</div>`).join('')}
      <button class="btn block" data-act="rcAddVar">${ic('plus')} Agregar variante</button>
      ${ingIndex.html}
      <button class="btn primary block shine" style="margin-top:18px" data-act="rcSave">Guardar receta</button>
      ${builtin && edited ? `<button class="btn block" style="margin-top:10px" data-act="rcRestore">${ic('undo')} Restaurar original</button>` : ''}
      ${d.id ? `<button class="btn danger block" style="margin-top:10px" data-act="rcDelete">${builtin ? 'Ocultar receta' : 'Eliminar receta'}</button>` : ''}`;
  }
  function readEditor() {
    const d = draft;
    d.n = $('#rcName').value; d.e = $('#rcEmoji').value; d.c = $('#rcCat').value;
    $$('.rc-vname').forEach(el => { d.vars[+el.dataset.vi].n = el.value; });
    $$('.ing-row').forEach(row => {
      const s = row.dataset.s, list = s === 'b' ? d.base : d.vars[+s].ing;
      list[+row.dataset.ri] = { t: row.querySelector('.ing-t').value, q: row.querySelector('.ing-q').value, u: row.querySelector('.ing-u').value };
    });
  }
  const rowsOf = s => s === 'b' ? draft.base : draft.vars[+s].ing;
  function rowToIng(g) {
    const t = g.t.trim();
    if (!t) return null;
    const ref = ingIndex.map.get(norm(t)) || { c: 'despensa', i: cap(t), v: '' };
    const q = parseFloat(String(g.q).replace(',', '.'));
    const fixed = g.u === 'fijo' || !(q > 0);
    return { c: ref.c, i: ref.i, v: ref.v, q: fixed ? 0 : q, u: fixed ? '' : g.u };
  }

  /* ================= VIAJE COMPARTIDO (Firebase) ================= */
  const syncDot = () => `<i class="dot ${Sync.status}"></i>`;
  const SYNC_TXT = {
    online: 'En línea · todo sincronizado', offline: 'Sin conexión · los cambios se envían al volver',
    connecting: 'Conectando…', error: 'No se pudo conectar con Firebase'
  };
  function syncErr(e) {
    const c = e && e.code;
    if (c === 'permission-denied') return 'Firebase no dio permiso: revisa las reglas de Firestore';
    if (c === 'timeout' || c === 'unavailable') return 'Sin conexión con Firebase, intenta de nuevo';
    if (c === 'auth/operation-not-allowed' || c === 'auth/admin-restricted-operation') return 'Activa el acceso Anónimo en Firebase Authentication';
    return (e && e.message) || 'Algo salió mal';
  }
  function openSync(code) {
    draft = { _kind: 'sync', code: code || '' };
    openSheet(syncHTML, releaseDraft(draft));
  }
  function syncHTML() {
    if (!Sync.active) {
      const p0 = S().trip.people[0];
      const nm = Sync.savedName() || (p0 && p0 !== 'Yo' ? p0 : '');
      const head = `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-sea)">${ic('users')}</span><div><h2>${draft.code ? 'Te invitaron a un viaje' : 'Viaje compartido'}</h2><p>Todo el grupo ve lo mismo en tiempo real</p></div></div>`;
      const name = `<label class="field"><span>Tu nombre</span><input id="syName" value="${esc(nm)}" placeholder="Ej: Ana" autocomplete="off"></label>`;
      const join = (main) => `<label class="field"><span>Enlace o código de invitación</span><input id="syCode" value="${esc(draft.code)}" placeholder="Pega aquí el enlace que te mandaron" autocomplete="off"></label>
        <button class="btn ${main ? 'primary shine' : 'sea'} block" data-act="syJoin">Unirme al viaje</button>
        <p class="hint" style="margin-top:8px">Tu viaje actual queda guardado en <b>Mis viajes</b>: puedes volver a él cuando quieras.</p>
        <p class="hint">¿Usas la app instalada y el QR se abrió en otro navegador? Copia el enlace, abre la app y pégalo aquí.</p>`;
      const create = (main) => `<button class="btn ${main ? 'primary shine' : ''} block" data-act="syCreate">Crear viaje compartido${main ? '' : ' propio'}</button>
        <p class="hint" style="margin-top:8px">Se suben tus datos actuales (lista, gastos, agenda, recetas) y te damos un enlace para invitar.</p>`;
      // Con invitación (?viaje=) lo primero es unirse; crear uno propio queda como alternativa
      if (draft.code) return `${head}${name}${join(true)}<div class="sy-or"><span>o crea uno propio</span></div>${create(false)}`;
      return `${head}
        <div class="card sy-feats">
          <div>${ic('cart')} Uno marca “comprado” en el súper y los demás lo ven al instante</div>
          <div>${ic('wallet')} Gastos y fotos de boletas de todos en un solo lugar</div>
          <div>${ic('calendar')} La misma agenda de comidas y las mismas recetas</div>
          <div>${ic('cloud')} Funciona sin señal: se sincroniza al volver</div>
        </div>
        ${name}${create(true)}<div class="sy-or"><span>o únete a uno</span></div>${join(false)}`;
    }
    const link = Sync.inviteLink(), me = Sync.uid;
    // Invitación a OTRO viaje mientras este equipo ya está en uno: ofrecer el cambio en vez de ignorarla
    const other = draft && draft.code && Sync.parseCode(draft.code) && Sync.parseCode(draft.code) !== Sync.tripId;
    const switchBox = other ? `<div class="card sy-switch">
        <b>Te invitaron a otro viaje compartido</b>
        <p class="hint">Ahora tienes abierto <b>«${esc(S().trip.name)}»</b>. Al unirte al nuevo, este queda guardado en <b>Mis viajes</b> y puedes volver a él cuando quieras.</p>
        <label class="field"><span>Tu nombre</span><input id="syName" value="${esc(Sync.savedName())}" placeholder="Ej: Ana" autocomplete="off"></label>
        <button class="btn sea block" data-act="sySwitch">${ic('users')} Unirme al viaje nuevo</button>
      </div>` : '';
    let qr = '';
    try { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch (e) { /* sin QR */ }
    const local = location.protocol === 'file:' || /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname);
    return `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-sea)">${ic('users')}</span><div><h2>Viaje compartido</h2><p>${syncDot()} ${SYNC_TXT[Sync.status] || ''}</p></div></div>
      ${switchBox}
      <div class="field"><span>Conectado a</span><div class="sy-trip">${esc(S().trip.name)}</div></div>
      <div class="field"><span>Integrantes (${Sync.members.length})</span><div class="chips wrap">
        ${Sync.members.map(u => `<span class="chip ${u === me ? 'active' : ''}" style="--c:var(--violet)">${esc(Sync.names[u] || 'Invitado')}${u === me ? ' (tú)' : ''}</span>`).join('')}</div></div>
      <div class="field"><span>Invita a tu grupo: escanea o comparte el enlace</span>
        <div class="qr-box">${qr}</div><div class="sy-link">${esc(link)}</div></div>
      ${local ? '<p class="hint">El enlace funcionará en otros celulares cuando la app esté publicada (por ejemplo en Netlify).</p>' : ''}
      <div class="btn-row"><button class="btn sm" data-act="syCopy">${ic('copy')} Copiar enlace</button><button class="btn sm sea" data-act="syShare">${ic('share')} Compartir</button></div>
      <button class="btn danger block" style="margin-top:18px" data-act="syLeave">${ic('logout')} Salir del viaje compartido</button>
      <p class="hint" style="margin-top:8px">Al salir, el viaje se quita de Mis viajes en este equipo y vuelves al anterior. Sigue disponible para los demás.</p>`;
  }
  /* Invitación a un viaje que ya está en Mis viajes: se abre ese en vez de unirse de nuevo */
  async function openKnown(cloudId) {
    const e = TR.byCloud(cloudId);
    if (!e) return false;
    if (Sync.tripId !== cloudId) await TR.switchTo(e.id);
    closeSheet(); render(true); toast(`Abriste «${S().trip.name}»`);
    return true;
  }
  async function busyRun(el, label, fn) {
    if (el.dataset.busy) return;
    el.dataset.busy = '1';
    const old = el.innerHTML; el.innerHTML = label; el.style.opacity = '.7';
    try { await fn(); }
    catch (e) { console.error(e); toast(syncErr(e), 3500); }
    finally { delete el.dataset.busy; if (el.isConnected) { el.innerHTML = old; el.style.opacity = ''; } }
  }

  /* Cambios remotos: re-render sin interrumpir a quien está escribiendo */
  let remotePending = false;
  function remoteRender() {
    const a = document.activeElement;
    if (a && view.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { remotePending = true; return; }
    render(false);
  }
  view.addEventListener('focusout', () => { if (remotePending) { remotePending = false; setTimeout(remoteRender, 60); } });
  addEventListener('viajapp:remote', () => {
    G.onRemote();
    if (typeof TR !== 'undefined') TR.touch();
    remoteRender();
    if (sheet.open && draft && draft._kind === 'sync') refreshSheet();
  });
  addEventListener('viajapp:syncmsg', e => toast(e.detail, 3500));

  /* Tu grupo (js/group.js): ¿Quién lleva qué?, Habitaciones y camas, Bitácora */
  const G = GroupModule({
    S, esc, ic, CHECK, $, $$, buzz, toast, confetti, openSheet, refreshSheet, closeSheet, render: a => render(a),
    confirmTap, myName, bounce, norm, cap, go: t => go(t), placeSeg, fmtDay
  });
  const log = G.log;

  /* Analizador de boletas (js/boletas.js): leer boleta con IA en el gasto + planilla Excel/Word */
  const BOL = BoletaModule({
    S, esc, ic, toast, money, buzz, confetti, refreshSheet, openSheet, closeSheet, $, $$, getDraft: () => draft, photoCache
  });

  /* Cuentas separadas (js/cuentas.js): dividir una boleta por lo que consumió cada uno, con propina */
  const SEP = SplitModule({
    S, esc, ic, toast, money, buzz, confetti, refreshSheet, openSheet, closeSheet, $, $$, getDraft: () => draft, setDraft: v => { draft = v; },
    photoCache, FUND, log, render: a => render(a), BOL
  });

  /* Mis viajes y cuenta (js/trips.js): varios viajes, plantillas y cuenta con correo o Google */
  const TR = TripsModule({
    S, esc, ic, toast, buzz, confetti, openSheet, refreshSheet, closeSheet, $, render: a => render(a), confirmTap, log,
    getDraft: () => draft, setDraft: v => { draft = v; }, releaseDraft,
    onSwitch: () => { ui.shopMode = 'catalog'; Object.keys(photoCache).forEach(k => delete photoCache[k]); },
    openTripSheet: () => ACT.trip(),
    nameFor: () => { const u = Sync.user(); return Sync.savedName() || (u && (u.name || (u.email || '').split('@')[0])) || myName() || 'Yo'; }
  });

  const RENDER = { home: renderHome, shop: renderShop, recipes: renderRecipes, money: renderMoney, agenda: renderAgenda, group: G.render };

  /* ================= Acciones ================= */
  const ACT = {
    go: el => go(el.dataset.to),
    close: () => closeSheet(),
    install: async () => {
      if (!ui.installEvt) return;
      ui.installEvt.prompt();
      await ui.installEvt.userChoice;
      ui.installEvt = null; render(false);
    },

    /* --- súper --- */
    shopMode: el => {
      const m = el.dataset.m; if (m === ui.shopMode) return;
      ui.shopMode = m; buzz(8);
      const seg = $('#shopSeg');
      if (seg) {
        const target = seg.querySelector(`button[data-m="${m}"]`);
        seg.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === target));
        placeSeg();
      }
      scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { render(false); const b = $('#shopBody'); if (b) b.classList.add('pop-in'); }, 230);
    },
    cat: el => {
      ui.shopCat = el.dataset.c; buzz(6);
      $$('#shopChips .chip').forEach(c => c.classList.toggle('active', c === el));
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      const box = $('#shopSections');
      box.innerHTML = shopSections();
      box.classList.remove('pop-in'); void box.offsetWidth; box.classList.add('pop-in');
      const top = box.getBoundingClientRect().top + scrollY - 80;
      if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
    },
    item: el => {
      const c = el.dataset.c, i = el.dataset.i;
      const cat = CATALOG.find(x => x.id === c), it = itemsOf(cat).find(x => x.n === i);
      if (!it) return;
      if (!it.v.length) {
        const on = toggleSel(c, i, ''); buzz(on ? 14 : 8);
        updateCardFor(c, i, true);
        return;
      }
      buzz(8);
      openSheet(() => variantsHTML(c, i));
    },
    variant: el => {
      const { c, i, v } = el.dataset;
      const on = toggleSel(c, i, v); buzz(on ? 14 : 8);
      refreshSheet(); updateCardFor(c, i, false);
    },
    addVar: el => {
      const inp = $('#newVar'), val = inp.value.trim();
      if (!val) { inp.focus(); return; }
      const { c, i } = el.dataset, k = c + '|' + i;
      const ex = S().shop.extraVar = S().shop.extraVar || {};
      const cat = CATALOG.find(x => x.id === c), it = itemsOf(cat).find(x => x.n === i);
      if (!it.v.some(v => norm(v) === norm(val))) (ex[k] = ex[k] || []).push(val);
      const real = it.v.find(v => norm(v) === norm(val)) || val;
      if (!S().shop.sel[key(c, i, real)]) toggleSel(c, i, real);
      Store.save(); buzz(14);
      refreshSheet(); updateCardFor(c, i, false);
    },
    addItem: el => openSheet(() => addItemHTML(el.dataset.c, el.dataset.name)),
    saveItem: () => {
      const n = cap($('#niName').value.trim());
      if (!n) { toast('Escribe un nombre'); $('#niName').focus(); return; }
      const c = $('#niCat').value, cat = CATALOG.find(x => x.id === c);
      if (itemsOf(cat).some(it => norm(it.n) === norm(n))) { toast('Ese producto ya existe en ' + cat.name); return; }
      const vars = $('#niVars').value.split(',').map(s => s.trim()).filter(Boolean);
      (S().shop.custom[c] = S().shop.custom[c] || []).push({ n, e: $('#niEmoji').value.trim() || cat.emoji, v: vars });
      toggleSel(c, n, vars.length ? vars[0] : '');
      ui.q = ''; ui.shopCat = c;
      closeSheet(); render(false);
      toast(`“${n}” agregado a ${cat.name}`);
    },
    delItem: el => {
      if (!confirmTap(el)) return;
      const { c, i } = el.dataset;
      S().shop.custom[c] = (S().shop.custom[c] || []).filter(x => x.n !== i);
      Object.keys(S().shop.sel).forEach(k => { const r = S().shop.sel[k]; if (r.c === c && r.i === i) delete S().shop.sel[k]; });
      Store.save(); closeSheet(); render(false); toast('Producto eliminado');
    },
    done: (el, e) => {
      const r = S().shop.sel[el.dataset.k]; if (!r) return;
      r.done = !r.done;
      // Comprado → entra a la despensa (y si se desmarca, se devuelve lo que se había sumado)
      if (r.done) { const b = boughtAmount(r); pantryAdd(r.c, r.i, r.v, b.n, b.u); r.pa = b; }
      else if (r.pa) { pantryTake(r.c, r.i, r.v, r.pa.n, r.pa.u); delete r.pa; }
      if (r.done) log('shop', n => n === 1 ? `compró ${r.i}${r.v ? ' ' + r.v.toLowerCase() : ''}` : `marcó ${n} productos como comprados`, 'bought');
      Store.save();
      el.classList.toggle('on', r.done);
      el.closest('.list-row').classList.toggle('done', r.done);
      buzz(r.done ? [10, 30, 10] : 8);
      if (r.done) confetti(e.clientX, e.clientY, 18, .6);
      updateListProgress(); updateBadge();
    },
    qty: el => {
      const r = S().shop.sel[el.dataset.k]; if (!r) return;
      r.q = Math.max(1, r.q + (+el.dataset.d)); Store.save(); buzz(6);
      const b = el.parentElement.querySelector('b'); if (b) { b.textContent = r.q; bounce(b); }
      if (el.closest('.sheet')) updateCardFor(r.c, r.i, false);
    },
    delRow: el => {
      const k = el.dataset.k, row = el.closest('.list-row');
      delete S().shop.sel[k]; Store.save(); buzz(15);
      row.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(70px) scale(.9)' }], { duration: 260, easing: 'ease-in' })
        .onfinish = () => render(false);
    },
    /* --- despensa --- */
    pAdd: () => {
      const t = $('#paName').value.trim();
      if (!t) { toast('Escribe un producto'); $('#paName').focus(); return; }
      if (!ingIndex) buildIngIndex();
      const ref = ingIndex.map.get(norm(t)) || { c: 'despensa', i: cap(t), v: '' };
      const q = parseFloat(String($('#paQty').value).replace(',', '.')) || 1, u = $('#paUnit').value;
      ensureCatalogItem(ref.c, ref.i, ref.v);
      pantryAdd(ref.c, ref.i, ref.v, q, u);
      log('shop', `agregó ${ref.i} a la despensa`);
      Store.save(); buzz(10); render(false);
      toast(`${ref.i} agregado a la despensa`);
    },
    pStep: el => {
      const e = P_().items[el.dataset.k]; if (!e) return;
      const u = el.dataset.u, st = STEP[u] || 1;
      if (+el.dataset.d > 0) pantryAdd(e.c, e.i, e.v, st, u); else pantryTake(e.c, e.i, e.v, st, u);
      Store.save(); buzz(6); render(false);
    },
    pDel: el => { delete P_().items[el.dataset.k]; Store.save(); buzz(10); render(false); },
    pToList: el => {
      const e = P_().items[el.dataset.k]; if (!e) return;
      const k = key(e.c, e.i, e.v), sel = S().shop.sel;
      if (!sel[k] || sel[k].done) sel[k] = { c: e.c, i: e.i, v: e.v, q: 1, done: false };
      delete P_().items[el.dataset.k];
      log('shop', `avisó que se acabó: ${e.i}`);
      Store.save(); render(false); toast(`${e.i} se acabó: pasó a tu lista`);
    },
    pCopy: async () => {
      const text = `Despensa · ${S().trip.name}\n` + Object.values(P_().items).map(e => `• ${e.i}${e.v ? ' ' + e.v : ''}: ${pantryText(e)}`).join('\n');
      try { await navigator.clipboard.writeText(text); toast('Copiado para WhatsApp'); }
      catch (e) { if (navigator.share) { try { await navigator.share({ text }); } catch (er) { /* cancelado */ } } else toast('No se pudo copiar'); }
    },
    pClear: el => {
      if (!confirmTap(el, '¿Vaciar? Toca otra vez')) return;
      P_().items = {}; Store.save(); render(false); toast('Despensa vaciada');
    },
    clearList: el => {
      if (!confirmTap(el, '¿Seguro? Toca otra vez')) return;
      S().shop.sel = {}; log('shop', 'vació la lista del súper'); Store.save(); render(false); toast('Lista vaciada');
    },

    /* --- exportaciones --- */
    exp: async el => {
      const k = el.dataset.k;
      if (k.startsWith('list') && !Object.keys(S().shop.sel).length) return toast('Tu lista está vacía');
      if (k.startsWith('finance') && !S().expenses.length) return toast('Aún no hay gastos registrados');
      if (k === 'agendaPDF' && !S().events.length) return toast('La agenda está vacía');
      if (el.dataset.busy) return;
      el.dataset.busy = '1';
      const old = el.innerHTML;
      el.style.opacity = '.6';
      toast('Generando archivo…', 1500);
      try {
        const r = await Exporter[k](!!el.dataset.share);
        if (r === 'downloaded') toast('Archivo listo');
        else if (r === 'shared') toast('Compartido');
      } catch (err) {
        console.error(err); toast('No se pudo generar el archivo');
      } finally {
        delete el.dataset.busy; el.style.opacity = ''; if (el.isConnected) el.innerHTML = old;
      }
    },

    /* --- dinero --- */
    newExpense: el => openExpense(null, el.dataset.cat ? { cat: el.dataset.cat, desc: el.dataset.cat === 'super' ? 'Compra supermercado' : '' } : null),
    editExpense: el => openExpense(el.dataset.id),
    pick: el => {
      if (!draft) return;
      const g = el.dataset.g, v = el.dataset.v;
      draft[g] = v; buzz(6);
      el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === el));
      bounce(el);
      if (draft._kind === 'split') updateSplit();
      if (draft._kind === 'expense' && g === 'payer') refreshAmong();
      if (draft._kind === 'event' && g === 'type') {
        const tt = typeOf(v), ico = $('#evIco');
        if (ico) { ico.textContent = tt.emoji; ico.style.setProperty('--c', tt.color); bounce(ico); }
        if (!draft._timeTouched) $('#evTime').value = tt.time;
        $('#evTitle').placeholder = PH[v] || '';
      }
    },
    brandMode: el => {
      persistTrip();
      const t = S().trip; t.brand = Object.assign({}, t.brand, { mode: el.dataset.v });
      Store.save(); buzz(8); refreshSheet();
    },
    setTheme: el => {
      LS.set('viajapp-theme', el.dataset.v); applyTheme(); buzz(8);
      $$('[data-act="setTheme"]').forEach(c => c.classList.toggle('active', c === el));
    },
    help: el => { draft = { _kind: 'help', s: el.dataset.s || ui.tab }; openSheet(helpHTML, releaseDraft(draft)); },
    fontSize: el => {
      LS.set('viajapp-font', el.dataset.v); applyFont(); buzz(8);
      $$('[data-act="fontSize"]').forEach(c => c.classList.toggle('active', c === el));
      placeSeg();
    },
    guideHide: () => { LS.set('viajapp-guide', 'off'); render(false); toast('Guía oculta. Puedes volver a verla con el botón ?'); },
    guideShow: () => { LS.set('viajapp-guide', ''); closeSheet(); render(true); },
    amongAll: () => { if (!draft) return; draft.among = []; buzz(6); refreshAmong(); },
    amongTog: el => {
      if (!draft) return;
      const p = el.dataset.p, people = S().trip.people;
      let sel = (draft.among || []).filter(x => people.includes(x));
      sel = sel.includes(p) ? sel.filter(x => x !== p) : sel.concat(p);
      draft.among = sel.length >= people.length ? [] : sel;   // todos marcados = "Todos"
      buzz(6); refreshAmong();
    },
    rmPhoto: el => {
      const id = el.dataset.id;
      draft.photos = draft.photos.filter(p => p !== id);
      if (draft._added.includes(id)) { draft._added = draft._added.filter(p => p !== id); Store.photos.del(id); }
      else draft._removed.push(id);
      $('#exPhotos').innerHTML = photosHTML(); loadThumbs(); buzz(10);
      if ($('#bolBox')) $('#bolBox').innerHTML = BOL.buttonHTML();
    },
    saveExpense: () => {
      const amt = parseAmount($('#exAmount').value);
      if (!(amt > 0)) {
        toast('Ingresa un monto válido');
        $('.amount').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        return;
      }
      const d = draft;
      const clean = {
        id: d.id || Store.uid(), amount: amt, cat: d.cat, desc: $('#exDesc').value.trim(), date: $('#exDate').value || Store.today(),
        payer: d.payer, method: d.method, docType: d.docType, docNum: $('#exDocNum').value.trim(), photos: d.photos,
        notes: $('#exNotes').value.trim(), created: d.created || Date.now()
      };
      const among = d.payer === FUND ? [] : (d.among || []).filter(p => S().trip.people.includes(p));
      if (among.length && among.length < S().trip.people.length) clean.among = among;   // solo se guarda si es parcial
      if (d.receipt) clean.receipt = d.receipt;   // productos leídos con el analizador de boletas
      if (d.split) clean.split = d.split;         // cuentas separadas
      d._removed.forEach(id => Store.photos.del(id));
      const list = S().expenses, i = list.findIndex(e => e.id === clean.id);
      if (i >= 0) list[i] = clean; else list.push(clean);
      log('money', i >= 0 ? `editó el gasto “${clean.desc || catOf(clean.cat).name}”` : `registró un gasto de ${money(amt)} (${clean.desc || catOf(clean.cat).name})`);
      Store.save(); d._saved = true;
      closeSheet(); render(ui.tab === 'money');
      toast(i >= 0 ? 'Gasto actualizado' : `Gasto de ${money(amt)} registrado`);
      buzz([10, 30, 10]);
      const t = S().trip;
      if (+t.budget && spentTotal() > +t.budget) setTimeout(() => toast('Atención: superaron los fondos asignados', 3000), 900);
    },
    delExpense: el => {
      if (!confirmTap(el)) return;
      const id = draft.id, ex = S().expenses.find(e => e.id === id);
      (ex.photos || []).forEach(p => Store.photos.del(p));
      log('money', `eliminó el gasto “${ex.desc || catOf(ex.cat).name}” (${money(ex.amount)})`);
      S().expenses = S().expenses.filter(e => e.id !== id);
      Store.save(); closeSheet(); render(false); toast('Gasto eliminado');
    },
    split: () => {
      const n = S().trip.people.length;
      draft = { _kind: 'split', total: '', tip: '10', n: n > 1 ? n : 2 };
      openSheet(splitHTML, releaseDraft(draft));
      updateSplit();
    },
    spN: el => {
      draft.n = Math.max(1, Math.min(99, draft.n + (+el.dataset.d)));
      const b = $('#spN'); b.textContent = draft.n; bounce(b); buzz(6); updateSplit();
    },
    splitToExpense: () => {
      const r = splitCalc();
      if (!(r.withTip > 0)) { toast('Ingresa el total de la cuenta'); return; }
      const n = draft.n, tip = draft.tip;
      openExpense(null, { amount: r.withTip, cat: 'bar', desc: `Cuenta dividida entre ${n}${+tip ? ` (propina ${tip}%)` : ''} · ${money(r.pp)} c/u` });
    },

    /* --- viaje --- */
    trip: () => {
      draft = { _kind: 'trip', emoji: S().trip.emoji };
      openSheet(tripHTML, releaseDraft(draft));
    },
    saveTrip: () => {
      persistTrip(); log('trip', 'actualizó los datos del viaje', 'trip'); closeSheet(); render(true);
      toast('Viaje actualizado');
    },
    diets: () => {
      if (draft && draft._kind === 'trip' && $('#tpName')) persistTrip();   // no perder lo escrito en la hoja del viaje
      openDiets();
    },
    dietTog: el => {
      const n = el.dataset.p, t = el.dataset.t, d = diets();
      const cur = d[n] || (d[n] = { tags: [], note: '' });
      cur.tags = cur.tags || [];
      const i = cur.tags.indexOf(t);
      if (i >= 0) cur.tags.splice(i, 1); else cur.tags.push(t);
      log('trip', 'actualizó las dietas del grupo', 'diets');
      Store.save(); buzz(6); refreshSheet();
      if (ui.tab === 'recipes' || ui.tab === 'shop') render(false);
    },
    rpAdd: () => {
      $('#rpList').insertAdjacentHTML('beforeend', respRow({ name: '', rut: '' }));
      const rows = $$('#rpList .rp-name'); rows[rows.length - 1].focus(); buzz(8);
    },
    rpDel: el => {
      const row = el.closest('.resp-row');
      if ($$('#rpList .resp-row').length > 1) row.remove();
      else row.querySelectorAll('input').forEach(i => { i.value = ''; });
      buzz(8);
    },
    backup: async () => {
      try {
        const json = await Store.backup();
        await Exporter.deliver(new Blob([json], { type: 'application/json' }), `respaldo-viajapp-${U.slug(S().trip.name)}.json`);
        toast('Respaldo descargado');
      } catch (e) { toast('No se pudo crear el respaldo'); }
    },
    restore: () => {
      if (Sync.active) { toast('Primero sal del viaje compartido'); return; }
      $('#importFile').click();
    },
    reset: async el => {
      if (Sync.active) { toast('Primero sal del viaje compartido'); return; }
      if (!confirmTap(el, '¿Borrar TODO? Toca de nuevo')) return;
      await Store.reset(); closeSheet(); ui.shopMode = 'catalog'; render(true); toast('Datos borrados');
    },

    /* --- agenda --- */
    month: el => {
      const d = +el.dataset.d;
      ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + d, 1);
      buzz(6); render(false);
      const g = $('#calDays'); g.style.setProperty('--dir', d); g.classList.add('anim');
    },
    calToday: () => {
      ui.selDate = Store.today();
      const d = U.parseDate(ui.selDate); ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      render(false); $('#dayBox').classList.add('pop-in');
    },
    day: el => {
      ui.selDate = el.dataset.d; buzz(6);
      const d = U.parseDate(ui.selDate);
      const changed = d.getMonth() !== ui.calMonth.getMonth() || d.getFullYear() !== ui.calMonth.getFullYear();
      ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      render(false);
      $('#dayBox').classList.add('pop-in');
      if (changed) $('#calDays').classList.add('anim');
    },
    newEvent: el => {
      if (ui.tab !== 'agenda') ui.selDate = Store.today();
      openEvent(null, el.dataset.type);
    },
    editEvent: el => openEvent(el.dataset.id),
    saveEvent: () => {
      const d = draft;
      const ev = {
        id: d.id || Store.uid(), type: d.type, title: $('#evTitle').value.trim(), date: $('#evDate').value || ui.selDate,
        time: $('#evTime').value, place: $('#evPlace').value.trim(), who: $('#evWho').value.trim(), notes: $('#evNotes').value.trim(),
        recipe: d.recipe || null, cooked: !!d.cooked, cookLog: d.cookLog || null
      };
      const list = S().events, i = list.findIndex(e => e.id === ev.id);
      if (i >= 0) list[i] = ev; else list.push(ev);
      log('agenda', i >= 0 ? `editó el plan “${ev.title || typeOf(ev.type).name}”` : `agendó ${typeOf(ev.type).name.toLowerCase()}: “${ev.title || typeOf(ev.type).name}” (${U.dmy(ev.date).slice(0, 5)} ${ev.time || ''})`);
      Store.save();
      ui.selDate = ev.date;
      const dd = U.parseDate(ev.date); ui.calMonth = new Date(dd.getFullYear(), dd.getMonth(), 1);
      closeSheet(); render(false);
      toast(i >= 0 ? 'Plan actualizado' : 'Plan agendado'); buzz([10, 30, 10]);
    },
    delEvent: el => {
      if (!confirmTap(el)) return;
      const gone = S().events.find(e => e.id === draft.id);
      if (gone) log('agenda', `eliminó el plan “${gone.title || typeOf(gone.type).name}”`);
      S().events = S().events.filter(e => e.id !== draft.id);
      Store.save(); closeSheet(); render(false); toast('Plan eliminado');
    },
    evToList: () => {
      const rc = draft.recipe, r = getRecipe(rc.id); if (!r) return;
      const n = addPlanToList(cookPlan(r, rc.vi, rc.p, rc.mode || 'portion'), recLabel(r, rc.vi));
      if (n) log('recipes', `agregó ${n} ingredientes de “${recLabel(r, rc.vi)}” a la lista`);
      toast(n ? `${n} ingredientes agregados a la lista` : 'Ya tienen todo en la despensa'); buzz([10, 30, 10]);
    },
    evCooked: () => {
      readEventForm();
      const ev = S().events.find(e => e.id === draft.id), rc = ev && ev.recipe, r = rc && getRecipe(rc.id);
      if (!r) return;
      const taken = [];
      cookPlan(r, rc.vi, rc.p, rc.mode || 'portion').rows.forEach(row => {
        if (row.fixed) return;
        const took = pantryTake(row.c, row.i, row.v, row.tot, row.u);
        if (took) taken.push({ c: row.c, i: row.i, v: row.v, n: took, u: row.u });
      });
      ev.cooked = draft.cooked = true; ev.cookLog = draft.cookLog = taken;
      log('agenda', `marcó “${ev.title || typeOf(ev.type).name}” como cocinado`);
      Store.save(); refreshSheet(); render(false);
      toast(taken.length ? `Cocinado: se descontaron ${taken.length} ingredientes de la despensa` : 'Marcado como cocinado'); buzz([10, 30, 10]);
    },
    evUncook: () => {
      readEventForm();
      const ev = S().events.find(e => e.id === draft.id); if (!ev) return;
      (ev.cookLog || []).forEach(x => pantryAdd(x.c, x.i, x.v, x.n, x.u));
      ev.cooked = draft.cooked = false; ev.cookLog = draft.cookLog = null;
      Store.save(); refreshSheet(); render(false);
      toast('Listo: los ingredientes volvieron a la despensa');
    },
    evCook: () => openCook(draft.recipe.id, draft.recipe.vi, draft.recipe.p),

    /* --- recetas --- */
    rcat: el => {
      ui.recCat = el.dataset.c; buzz(6);
      let chip = null;
      $$('#recChips .chip').forEach(c => { const on = c.dataset.c === ui.recCat; c.classList.toggle('active', on); if (on) chip = c; });
      if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      const box = $('#recGrid');
      box.innerHTML = recSections();
      box.classList.remove('pop-in'); void box.offsetWidth; box.classList.add('pop-in');
      const top = box.getBoundingClientRect().top + scrollY - 80;
      if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
    },
    cook: el => { buzz(8); openCook(el.dataset.id); },
    cookVar: el => { draft.vi = +el.dataset.i; draft.skip = {}; buzz(6); refreshSheet(); },
    cookP: el => { draft.p = Math.max(1, Math.min(99, draft.p + (+el.dataset.d))); buzz(6); refreshSheet(); },
    cookSkip: el => { draft.skip[el.dataset.k] = el.classList.contains('on'); buzz(6); refreshSheet(); },
    cookMode: el => { draft.mode = el.dataset.m; draft.skip = {}; buzz(6); refreshSheet(); },
    cookAdd: () => {
      const d = draft, r = getRecipe(d.id);
      const n = addPlanToList(cookPlan(r, d.vi, d.p, d.mode), recLabel(r, d.vi), d.skip);
      if (!n) { toast('No marcaste ningún ingrediente'); return; }
      log('recipes', `agregó ${n} ingredientes de “${recLabel(r, d.vi)}” a la lista`);
      closeSheet();
      if (ui.tab === 'shop') render(false);
      toast(`${n} ingredientes de “${recLabel(r, d.vi)}” en tu lista`, 2800);
      buzz([10, 30, 10]);
    },
    cookAgenda: () => {
      const d = draft, r = getRecipe(d.id);
      if (ui.tab !== 'agenda') ui.selDate = Store.today();
      openEvent(null, RECIPE_MEAL[r.c] || 'almuerzo', { title: recLabel(r, d.vi), recipe: { id: r.id, vi: d.vi, p: d.p, mode: d.mode } });
    },
    newRecipe: () => openRecipeEditor(null),
    editRecipe: el => openRecipeEditor(el.dataset.id),
    rcAddRow: el => {
      readEditor(); rowsOf(el.dataset.s).push(blankRow()); refreshSheet();
      const rows = $$(`.ing-row[data-s="${el.dataset.s}"] .ing-t`); if (rows.length) rows[rows.length - 1].focus();
    },
    rcDelRow: el => { readEditor(); rowsOf(el.dataset.s).splice(+el.dataset.ri, 1); buzz(8); refreshSheet(); },
    rcAddVar: () => {
      readEditor(); draft.vars.push({ n: '', ing: [blankRow()] }); refreshSheet();
      const names = $$('.rc-vname'); if (names.length) names[names.length - 1].focus();
    },
    rcDelVar: el => { readEditor(); draft.vars.splice(+el.dataset.vi, 1); buzz(8); refreshSheet(); },
    rcSave: () => {
      readEditor();
      const d = draft, name = d.n.trim();
      if (!name) { toast('Ponle un nombre a la receta'); $('#rcName').focus(); return; }
      const base = d.base.map(rowToIng).filter(Boolean);
      const vars = d.vars.filter(v => v.n.trim()).map(v => ({ n: v.n.trim(), ing: v.ing.map(rowToIng).filter(Boolean) }));
      if (!base.length && !vars.some(v => v.ing.length)) { toast('Agrega al menos un ingrediente'); return; }
      const id = d.id || 'u_' + Store.uid();
      R_().custom[id] = { id, n: cap(name), e: d.e.trim() || '🍽️', c: d.c, base, vars };
      log('recipes', d.id ? `editó la receta “${cap(name)}”` : `creó la receta “${cap(name)}”`);
      delete R_().hidden[id];
      Store.save(); closeSheet(); render(false);
      toast(d.id ? 'Receta actualizada' : 'Receta creada');
    },
    rcRestore: () => {
      delete R_().custom[draft.id];
      Store.save(); closeSheet(); render(false); toast('Receta original restaurada');
    },
    rcDelete: el => {
      if (!confirmTap(el)) return;
      const id = draft.id;
      if (BUILTIN.has(id)) R_().hidden[id] = true;
      delete R_().custom[id];
      Store.save(); closeSheet(); render(false); toast(BUILTIN.has(id) ? 'Receta oculta' : 'Receta eliminada');
    },
    rcUnhide: () => { R_().hidden = {}; Store.save(); render(false); toast('Recetas visibles otra vez'); },

    /* --- viaje compartido --- */
    sync: () => openSync(),
    syCreate: el => {
      const name = $('#syName').value.trim();
      if (!name) { toast('Escribe tu nombre'); $('#syName').focus(); return; }
      if (!navigator.onLine) { toast('Necesitas conexión a internet'); return; }
      return busyRun(el, 'Creando…', async () => {
        await Sync.create(name);
        log('group', 'creó el viaje compartido');
        refreshSheet(); render(true);
        toast('Viaje compartido creado. Invita a tu grupo', 3000); confetti(); buzz([10, 30, 10]);
      });
    },
    syJoin: el => {
      const code = $('#syCode').value, name = $('#syName').value.trim();
      if (!Sync.parseCode(code)) { toast('Pega el enlace o código de invitación'); $('#syCode').focus(); return; }
      if (!name) { toast('Escribe tu nombre'); $('#syName').focus(); return; }
      if (!navigator.onLine) { toast('Necesitas conexión a internet'); return; }
      return busyRun(el, 'Uniéndome…', async () => {
        if (await openKnown(Sync.parseCode(code))) return;
        const tripName = await Sync.join(code, name);
        log('group', 'se unió al viaje compartido');
        ui.shopMode = 'catalog';
        refreshSheet(); render(true);
        toast(`Te uniste a “${tripName}”`, 3000); confetti(); buzz([10, 30, 10]);
      });
    },
    sySwitch: el => {
      const code = draft && draft.code, name = $('#syName').value.trim();
      if (!name) { toast('Escribe tu nombre'); $('#syName').focus(); return; }
      if (!navigator.onLine) { toast('Necesitas conexión a internet'); return; }
      return busyRun(el, 'Cambiando…', async () => {
        if (await openKnown(Sync.parseCode(code))) return;
        const tripName = await Sync.join(code, name);   // el viaje actual queda en Mis viajes
        log('group', 'se unió al viaje compartido');
        draft.code = '';
        ui.shopMode = 'catalog';
        refreshSheet(); render(true);
        toast(`Te uniste a “${tripName}”`, 3000); confetti(); buzz([10, 30, 10]);
      });
    },
    syCopy: async () => {
      try { await navigator.clipboard.writeText(Sync.inviteLink()); toast('Enlace copiado'); }
      catch (e) { toast('No se pudo copiar, mantén presionado el enlace'); }
    },
    syShare: async () => {
      const data = { title: 'Viajapp', text: `Únete a nuestro viaje “${S().trip.name}” en Viajapp`, url: Sync.inviteLink() };
      if (navigator.share) { try { await navigator.share(data); } catch (e) { /* cancelado */ } }
      else ACT.syCopy();
    },
    syLeave: el => {
      if (!confirmTap(el, '¿Salir? Toca de nuevo')) return;
      return busyRun(el, 'Saliendo…', async () => {
        await Sync.leave();
        closeSheet(); render(true); toast('Saliste del viaje compartido');
      });
    },

    /* --- cuentas claras --- */
    copySettle: async () => {
      const st = settle(); if (!st) return;
      const text = `Cuentas claras · ${S().trip.name}\n` +
        (st.partial ? S().trip.people.map(p => `${p}: su parte ${money(st.part[p])}`).join('\n') : `Cada uno: ${money(st.share)}`) + '\n' +
        (st.tr.length ? st.tr.map(t => `• ${t.from} → ${t.to}: ${money(t.amt)}`).join('\n') : 'Están a mano');
      try { await navigator.clipboard.writeText(text); toast('Copiado para WhatsApp'); }
      catch (e) {
        if (navigator.share) { try { await navigator.share({ text }); } catch (er) { /* cancelado */ } }
        else toast('No se pudo copiar');
      }
    }
  };

  Object.assign(ACT, G.ACT);
  Object.assign(ACT, BOL.ACT);
  Object.assign(ACT, SEP.ACT);
  Object.assign(ACT, TR.ACT);

  /* ================= Eventos globales ================= */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.id === 'shopSearch') {
      ui.q = el.value;
      const box = $('#shopSections'); if (box) box.innerHTML = shopSections();
    } else if (el.id === 'recSearch') {
      ui.recQ = el.value;
      const box = $('#recGrid'); if (box) box.innerHTML = recSections();
    } else if (el.id === 'exAmount') {
      $('#exAmountFmt').textContent = `${S().trip.currency} · ${money(parseAmount(el.value))}`;
      refreshAmong();   // monto por persona
    } else if (el.id === 'spTotal') {
      updateSplit();
    } else if (el.classList.contains('diet-note')) {
      const d = diets(), n = el.dataset.p;
      (d[n] = d[n] || { tags: [], note: '' }).note = el.value;
      Store.save();
    } else if (el.id === 'evTime' && draft) {
      draft._timeTouched = true;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'newVar') { e.preventDefault(); const b = $('[data-act="addVar"]'); if (b) b.click(); }
    if (e.key === 'Escape' && sheet.open) closeSheet();
  });

  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.change === 'bolPhoto') { BOL.onPhoto(el); return; }
    if (el.dataset.change === 'sepPhoto') { SEP.onPhoto(el); return; }
    if (el.dataset.change === 'brandLogo') {
      const f = el.files[0]; el.value = '';
      if (!f) return;
      try {
        persistTrip();
        const t = S().trip; t.brand = { mode: 'custom', logo: await brandLogoData(f) };
        Store.save(); log('trip', 'cambió el logo de los documentos'); refreshSheet(); toast('Logo guardado: saldrá en la carta y los documentos');
      } catch (err) { toast('No se pudo leer la imagen'); }
      return;
    }
    if (el.dataset.change === 'photos') {
      const files = [...el.files]; el.value = '';
      if (!files.length || !draft) return;
      const mine = draft;
      toast(files.length > 1 ? `Procesando ${files.length} fotos…` : 'Procesando foto…', 1200);
      for (const f of files) {
        try {
          const url = await Store.compress(f);
          const id = 'ph_' + Store.uid();
          await Store.photos.put(id, url);
          photoCache[id] = url;
          if (draft === mine && sheet.open) { mine.photos.push(id); mine._added.push(id); }
          else Store.photos.del(id);
        } catch (err) { toast('No se pudo leer una imagen'); }
      }
      if (draft === mine && $('#exPhotos')) { $('#exPhotos').innerHTML = photosHTML(); loadThumbs(); buzz(15); }
      if (draft === mine && $('#bolBox')) $('#bolBox').innerHTML = BOL.buttonHTML();
    } else if (el.id === 'importFile') {
      const f = el.files[0]; el.value = '';
      if (!f) return;
      try {
        await Store.restore(await f.text());
        Object.keys(photoCache).forEach(k => delete photoCache[k]);
        closeSheet(); render(true); toast('Datos restaurados');
      } catch (err) { toast('Archivo de respaldo no válido'); }
    }
  });

  addEventListener('beforeinstallprompt', e => { e.preventDefault(); ui.installEvt = e; if (ui.tab === 'home') render(false); });

  /* ================= Inicio ================= */
  const initial = location.hash.slice(1);
  if (!RENDER[initial]) history.replaceState(null, '', '#home');
  go(RENDER[initial] ? initial : 'home');

  /* Viaje compartido: reconectar y abrir invitaciones (?viaje=ID) */
  const syncBoot = Sync.init().then(() => render(false));
  // Con cuenta: traer a Mis viajes los viajes creados en otros equipos
  if (Sync.hasAccount()) syncBoot.then(() => TR.pullRemote()).then(n => { if (n && ui.tab === 'home') render(false); }).catch(() => {});
  const invite = new URLSearchParams(location.search).get('viaje');
  if (invite) {
    history.replaceState(history.state, '', location.pathname + location.hash);
    // Se espera la reconexión: si ya está en otro viaje, la hoja ofrece cambiarse
    if (Sync.savedTrip() !== invite) syncBoot.then(() => setTimeout(async () => { if (!(await openKnown(invite).catch(() => false))) openSync(invite); }, 400));
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
