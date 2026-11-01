/* Estado persistente (localStorage) + fotos (IndexedDB) */
(function () {
  const KEY = 'viajapp-v1';

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const DEFAULT = () => ({
    trip: {
      name: 'Mi viaje',
      emoji: '🌴',
      entity: '',
      responsible: '',
      responsibles: [],
      rut: '',
      start: today(),
      end: today(),
      budget: 0,
      currency: 'CLP',
      people: ['Yo']
    },
    shop: { sel: {}, custom: {}, extraVar: {} },
    expenses: [],
    events: [],
    recipes: { custom: {}, hidden: {} },
    pantry: { items: {} },
    gear: { items: {} },                 // ¿Quién lleva qué?
    rooms: { list: [], together: [] },   // Habitaciones y camas
    log: []                              // Bitácora del grupo
  });

  let state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? Object.assign(DEFAULT(), JSON.parse(raw)) : DEFAULT();
    state.trip = Object.assign(DEFAULT().trip, state.trip);
    state.shop = Object.assign({ sel: {}, custom: {}, extraVar: {} }, state.shop);
  } catch (e) {
    state = DEFAULT();
  }

  let saveTimer = 0;
  function writeNow() {
    clearTimeout(saveTimer); saveTimer = 0;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('No se pudo guardar', e); }
    if (window.Sync && window.Sync.active) window.Sync.push();
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeNow, 120);
  }
  /* Si la app se cierra o pasa a segundo plano, guardar lo pendiente de inmediato */
  const flushPending = () => { if (saveTimer) writeNow(); if (window.Sync && window.Sync.active) window.Sync.flush(); };
  addEventListener('pagehide', flushPending);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushPending(); });

  /* ---- IndexedDB para imágenes ---- */
  let dbp;
  function db() {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open('viajapp-fotos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return dbp;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('photos', mode);
      const req = fn(t.objectStore('photos'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  }
  const photos = {
    put: (id, dataUrl) => tx('readwrite', s => s.put(dataUrl, id)),
    get: id => tx('readonly', s => s.get(id)),
    del: id => tx('readwrite', s => s.delete(id)),
    clear: () => tx('readwrite', s => s.clear())
  };

  /* Boleta electrónica en PDF → una sola imagen JPEG con sus páginas una bajo otra (máx. 4).
     pdf.js se carga solo la primera vez que se sube un PDF. */
  let pdfjs = null;
  function loadPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return pdfjs || (pdfjs = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'vendor/pdfjs/pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js'; res(window.pdfjsLib); };
      s.onerror = () => { pdfjs = null; rej(new Error('No se pudo abrir el PDF')); };
      document.head.appendChild(s);
    }));
  }
  async function pdfToJpeg(file, q) {
    const lib = await loadPdfjs();
    const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let i = 1; i <= Math.min(doc.numPages, 4); i++) {
      const p = await doc.getPage(i), v0 = p.getViewport({ scale: 1 });
      const v = p.getViewport({ scale: Math.min(3, 1100 / v0.width) });   // ~1100 px de ancho: se lee bien el detalle
      const c = document.createElement('canvas'); c.width = Math.round(v.width); c.height = Math.round(v.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await p.render({ canvasContext: ctx, viewport: v }).promise;
      pages.push(c);
    }
    const W = Math.max(...pages.map(c => c.width)), H = pages.reduce((s, c) => s + c.height, 0);
    const k = Math.min(1, 3200 / H);                                       // boletas largas: tope de alto
    const out = document.createElement('canvas'); out.width = Math.round(W * k); out.height = Math.round(H * k);
    const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height);
    let y = 0;
    pages.forEach(c => { o.drawImage(c, 0, y, c.width * k, c.height * k); y += c.height * k; });
    return out.toDataURL('image/jpeg', q);
  }
  const isPdf = f => f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''));

  /* Comprime una imagen a JPEG (máx 1600px). También acepta boletas electrónicas en PDF. */
  function compress(file, max = 1600, q = 0.82) {
    if (isPdf(file)) return pdfToJpeg(file, Math.max(q, 0.85));
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Imagen no válida')); };
      img.src = url;
    });
  }

  /* Respaldo completo (incluye fotos) */
  async function backup() {
    const ph = {};
    for (const e of state.expenses) {
      for (const id of e.photos || []) ph[id] = await photos.get(id);
    }
    return JSON.stringify({ app: 'viajapp', version: 1, state, photos: ph });
  }
  async function restore(text) {
    const data = JSON.parse(text);
    if (data.app !== 'viajapp' || !data.state) throw new Error('Archivo no válido');
    await photos.clear();
    for (const [id, url] of Object.entries(data.photos || {})) if (url) await photos.put(id, url);
    replace(data.state);
  }
  function replace(next) {
    const fresh = DEFAULT();
    Object.keys(fresh).forEach(k => { state[k] = next[k] !== undefined ? next[k] : fresh[k]; });
    state.trip = Object.assign(fresh.trip, state.trip);
    state.shop = Object.assign({ sel: {}, custom: {}, extraVar: {} }, state.shop);
    save();
  }
  async function reset() {
    await photos.clear();
    replace(DEFAULT());
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  window.Store = { get state() { return state; }, save, photos, compress, backup, restore, reset, replace, uid, today };
})();
