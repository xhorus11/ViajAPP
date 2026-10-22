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

  /* Comprime una imagen a JPEG (máx 1600px) */
  function compress(file, max = 1600, q = 0.82) {
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
