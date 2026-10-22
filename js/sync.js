/* Sincronización en grupo: Firebase Auth (anónima) + Firestore en tiempo real.
   Idea: Store.state sigue siendo la fuente local. Al guardar se compara contra lo último sincronizado
   (`last`, ruta → JSON estable) y se envían solo los documentos que cambiaron. Los cambios remotos
   se aplican sobre Store.state y se avisa a la interfaz con el evento `viajapp:remote`. */
(function () {
  const SESSION = 'viajapp-sync', LAST = 'viajapp-sync-last', BACKUP = 'viajapp-local-backup', NAME = 'viajapp-name';
  const SDK = ['vendor/firebase-app-compat.js', 'vendor/firebase-auth-compat.js', 'vendor/firebase-firestore-compat.js'];
  const COL_NAMES = ['shop', 'expenses', 'events', 'meta', 'pantry', 'gear', 'log'];

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* lleno o bloqueado */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* bloqueado */ } }
  };

  const Sync = { active: false, ready: false, tripId: null, uid: null, status: 'off', members: [], names: {} };
  let db = null, auth = null, unsubs = [], last = {}, seen = {}, sdkP = null, pushTimer = 0, emitTimer = 0, pendingName = null;

  /* JSON con claves ordenadas: permite comparar objetos sin importar el orden */
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    }
    return JSON.stringify(v === undefined ? null : v);
  }
  const clean = v => JSON.parse(JSON.stringify(v));
  const enc = k => encodeURIComponent(k).replace(/\./g, '%2E');
  const dec = id => decodeURIComponent(id);
  const split = p => { const i = p.indexOf('/'); return [p.slice(0, i), p.slice(i + 1)]; };
  const tripRef = () => db.collection('trips').doc(Sync.tripId);

  function emit() {
    clearTimeout(emitTimer);
    emitTimer = setTimeout(() => window.dispatchEvent(new CustomEvent('viajapp:remote')), 120);
  }
  function msg(text) { window.dispatchEvent(new CustomEvent('viajapp:syncmsg', { detail: text })); }
  function setStatus(s) { if (Sync.status !== s) { Sync.status = s; emit(); } }
  function onError(e) {
    console.warn('Sync:', e);
    if (e && e.code === 'permission-denied') msg('⚠️ Firebase rechazó el cambio (permisos)');
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('Tiempo de espera agotado'), { code: 'timeout' })), ms || 15000))]);
  }

  /* Cómo se lee/escribe cada colección dentro de Store.state */
  function arrCol(name) {
    return {
      list: s => s[name].map(x => [x.id, x]),
      set: (s, id, v) => { v.id = id; const i = s[name].findIndex(x => x.id === id); if (i >= 0) s[name][i] = v; else s[name].push(v); },
      del: (s, id) => { s[name] = s[name].filter(x => x.id !== id); }
    };
  }
  const COLS = {
    shop: {
      list: s => Object.entries(s.shop.sel).map(([k, v]) => [enc(k), v]),
      set: (s, id, v) => { s.shop.sel[dec(id)] = v; },
      del: (s, id) => { delete s.shop.sel[dec(id)]; }
    },
    pantry: {
      list: s => Object.entries((s.pantry || { items: {} }).items || {}).map(([k, v]) => [enc(k), v]),
      set: (s, id, v) => { s.pantry = s.pantry || { items: {} }; s.pantry.items[dec(id)] = v; },
      del: (s, id) => { if (s.pantry && s.pantry.items) delete s.pantry.items[dec(id)]; }
    },
    gear: {
      list: s => Object.entries((s.gear || { items: {} }).items || {}).map(([k, v]) => [enc(k), v]),
      set: (s, id, v) => { s.gear = s.gear || { items: {} }; s.gear.items[dec(id)] = v; },
      del: (s, id) => { if (s.gear && s.gear.items) delete s.gear.items[dec(id)]; }
    },
    log: {
      list: s => (s.log || []).map(x => [x.id, x]),
      set: (s, id, v) => { s.log = s.log || []; v.id = id; const i = s.log.findIndex(x => x.id === id); if (i >= 0) s.log[i] = v; else s.log.push(v); },
      del: (s, id) => { s.log = (s.log || []).filter(x => x.id !== id); }
    },
    expenses: arrCol('expenses'),
    events: arrCol('events'),
    meta: {
      list: s => [
        ['shop', { custom: s.shop.custom || {}, extraVar: s.shop.extraVar || {} }],
        ['recipes', s.recipes || { custom: {}, hidden: {} }],
        ['rooms', s.rooms || { list: [], together: [] }]
      ],
      set: (s, id, v) => {
        if (id === 'shop') { s.shop.custom = v.custom || {}; s.shop.extraVar = v.extraVar || {}; }
        else if (id === 'recipes') s.recipes = { custom: v.custom || {}, hidden: v.hidden || {} };
        else if (id === 'rooms') s.rooms = { list: v.list || [], together: v.together || [] };
      },
      del: () => {}
    }
  };

  function flatten(s) {
    const m = { trip: stable(s.trip) }, vals = { trip: s.trip };
    COL_NAMES.forEach(c => COLS[c].list(s).forEach(([id, v]) => { const p = c + '/' + id; m[p] = stable(v); vals[p] = v; }));
    s.expenses.forEach(e => (e.photos || []).forEach(id => { m['photos/' + id] = 'p'; }));
    return { m, vals };
  }
  const saveLast = () => { if (Sync.active) ls.set(LAST, last); };

  /* ---------- Envío de cambios locales ---------- */
  function push() { clearTimeout(pushTimer); pushTimer = setTimeout(flush, 60); }
  function flush() {
    clearTimeout(pushTimer);
    if (!Sync.active || !Sync.ready || !db) return;
    const { m, vals } = flatten(Store.state), ops = [];
    for (const p in m) if (last[p] !== m[p]) ops.push([p, 'set']);
    for (const p in last) if (!(p in m)) ops.push([p, 'del']);
    if (!ops.length) return;
    const trip = tripRef();
    let batch = db.batch(), n = 0;
    const commit = () => { batch.commit().catch(onError); batch = db.batch(); n = 0; };
    ops.forEach(([p, op]) => {
      if (op === 'set') last[p] = m[p]; else delete last[p];
      if (p.startsWith('photos/')) { photoOp(trip, p.slice(7), op); return; }
      if (p === 'trip') batch.update(trip, { trip: clean(Store.state.trip) });
      else {
        const [c, id] = split(p), ref = trip.collection(c).doc(id);
        if (op === 'set') batch.set(ref, clean(vals[p])); else batch.delete(ref);
      }
      if (++n >= 400) commit();
    });
    if (n) commit();
    saveLast();
  }

  /* Fotos: documentos aparte (máx. 1 MB c/u), comprimidas si hace falta */
  function shrink(url) {
    if (!url || url.length < 900000) return Promise.resolve(url);
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        let max = 1100, q = 0.7, out = url;
        const c = document.createElement('canvas'), ctx = c.getContext('2d');
        do {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL('image/jpeg', q); max -= 200; q -= 0.05;
        } while (out.length > 900000 && max > 400);
        res(out);
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }
  function photoOp(trip, id, op) {
    const ref = trip.collection('photos').doc(id);
    if (op === 'del') { ref.delete().catch(() => {}); return; }
    Store.photos.get(id).then(shrink).then(url => url && ref.set({ d: url })).catch(onError);
  }
  /* La foto puede subirse después que el gasto: se escucha su documento hasta que exista */
  const photoWatch = {};
  function fetchPhotos(exp) {
    (exp.photos || []).forEach(id => {
      last['photos/' + id] = 'p';
      if (photoWatch[id]) return;
      Store.photos.get(id).then(have => {
        if (have || photoWatch[id] || !Sync.active) return;
        photoWatch[id] = tripRef().collection('photos').doc(id).onSnapshot(d => {
          if (!d.exists) return;
          const off = photoWatch[id]; delete photoWatch[id]; if (off) off();
          Store.photos.put(id, d.data().d).then(emit);
        }, () => { delete photoWatch[id]; });
      }).catch(() => {});
    });
  }

  /* ---------- Recepción de cambios remotos ---------- */
  function markSeen(k) {
    seen[k] = true;
    if (!Sync.ready && seen.trip && COL_NAMES.every(c => seen[c])) {
      Sync.ready = true;
      const s = Store.state;
      if (pendingName) {
        if (s.trip.people.length === 1 && s.trip.people[0] === 'Yo') s.trip.people = [pendingName];
        else if (!s.trip.people.includes(pendingName)) s.trip.people.push(pendingName);
        pendingName = null;
      }
      saveLast(); Store.save(); emit();
    }
  }
  function onTrip(snap) {
    setStatus(snap.metadata.fromCache ? 'offline' : 'online');
    if (!snap.exists) {
      if (!snap.metadata.fromCache) { msg('El viaje compartido ya no existe'); stop(); }
      return;
    }
    const d = snap.data();
    Sync.members = d.members || []; Sync.names = d.names || {};
    if (!snap.metadata.fromCache && Sync.uid && !Sync.members.includes(Sync.uid)) { msg('Ya no eres parte de este viaje compartido'); stop(); return; }
    if (!snap.metadata.hasPendingWrites && d.trip) {
      const rj = stable(d.trip);
      if (rj !== last.trip && (!Sync.ready || stable(Store.state.trip) === last.trip)) {
        Store.state.trip = Object.assign({}, Store.state.trip, d.trip);
        last.trip = rj;
        saveLast(); Store.save();
      }
    }
    if (!snap.metadata.fromCache) markSeen('trip');
    emit();
  }
  function onCol(c, snap) {
    const s = Store.state, first = !seen[c], local = {};
    COLS[c].list(s).forEach(([id, v]) => { local[id] = v; });
    // Cambio local aún no enviado: gana lo local (se enviará en el próximo push)
    const dirty = id => Sync.ready && (local[id] !== undefined ? stable(local[id]) : undefined) !== last[c + '/' + id];
    let changed = false;
    const apply = (id, data) => {
      const p = c + '/' + id;
      if (data === null) { COLS[c].del(s, id); delete last[p]; }
      else { COLS[c].set(s, id, data); last[p] = stable(data); if (c === 'expenses') fetchPhotos(data); }
      changed = true;
    };
    if (first) {
      const ids = new Set(snap.docs.map(d => d.id));
      Object.keys(last).forEach(p => {
        if (!p.startsWith(c + '/')) return;
        const id = p.slice(c.length + 1);
        if (!ids.has(id) && !dirty(id)) apply(id, null);
      });
    }
    snap.docChanges().forEach(ch => {
      const d = ch.doc;
      if (d.metadata.hasPendingWrites || dirty(d.id)) return;
      apply(d.id, ch.type === 'removed' ? null : d.data());
    });
    // Para quedar "listo" al unirse se exige la respuesta del servidor (la caché puede venir vacía)
    if (!snap.metadata.fromCache) markSeen(c);
    if (changed) { saveLast(); Store.save(); emit(); }
  }
  function listen() {
    const trip = tripRef();
    unsubs.push(trip.onSnapshot({ includeMetadataChanges: true }, onTrip, onError));
    COL_NAMES.forEach(c => unsubs.push(trip.collection(c).onSnapshot({ includeMetadataChanges: true }, snap => onCol(c, snap), onError)));
  }

  /* ---------- Arranque ---------- */
  function ensureSDK() {
    if (window.firebase && window.firebase.firestore) return Promise.resolve();
    if (!sdkP) {
      sdkP = SDK.reduce((p, src) => p.then(() => new Promise((res, rej) => {
        const el = document.createElement('script');
        el.src = src; el.onload = res; el.onerror = () => rej(new Error('No se pudo cargar ' + src));
        document.head.appendChild(el);
      })), Promise.resolve());
    }
    return sdkP;
  }
  async function boot() {
    if (!window.FIREBASE_CONFIG) throw new Error('Falta la configuración de Firebase');
    await ensureSDK();
    if (!db) {
      if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      db = firebase.firestore();
      auth = firebase.auth();
      if (window.FIREBASE_EMULATOR) {   // solo en pruebas locales
        db.useEmulator('127.0.0.1', 8080);
        auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
      }
      try { await db.enablePersistence({ synchronizeTabs: true }); } catch (e) { console.warn('Firestore sin caché offline:', e.code); }
    }
    if (!Sync.uid) {
      const user = await new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }); });
      Sync.uid = user ? user.uid : (await withTimeout(auth.signInAnonymously())).user.uid;
    }
  }
  function connect(tripId, mode) {
    Object.assign(Sync, { active: true, tripId, ready: mode !== 'fresh' });
    seen = {};
    last = mode === 'resume' ? ls.get(LAST, {}) : {};
    ls.set(SESSION, { tripId });
    setStatus('connecting');
    if (mode === 'upload') flush();
    listen();
  }
  function stop() {
    unsubs.concat(Object.values(photoWatch)).forEach(u => { try { u(); } catch (e) { /* ya cerrado */ } });
    unsubs = [];
    Object.keys(photoWatch).forEach(k => delete photoWatch[k]);
    Object.assign(Sync, { active: false, ready: false, tripId: null, members: [], names: {} });
    last = {}; seen = {};
    ls.del(SESSION); ls.del(LAST);
    setStatus('off'); emit();
  }

  /* ---------- API pública ---------- */
  async function init() {
    const sess = ls.get(SESSION, null);
    if (!sess) return;
    try { await boot(); connect(sess.tripId, 'resume'); }
    catch (e) { console.warn(e); Object.assign(Sync, { active: true, tripId: sess.tripId }); setStatus('error'); }
  }
  async function create(name) {
    await boot();
    const s = Store.state, yo = s.trip.people.indexOf('Yo');
    // "Yo" pasa a ser el nombre de quien crea (para el resto del grupo "Yo" no dice nada)
    if (s.trip.people.includes(name)) { if (yo >= 0 && name !== 'Yo') s.trip.people.splice(yo, 1); }
    else if (yo >= 0) s.trip.people[yo] = name;
    else s.trip.people.push(name);
    if (s.trip.diets && s.trip.diets.Yo && !s.trip.diets[name]) { s.trip.diets[name] = s.trip.diets.Yo; delete s.trip.diets.Yo; }
    const ref = db.collection('trips').doc();
    await withTimeout(ref.set({
      members: [Sync.uid], names: { [Sync.uid]: name }, trip: clean(s.trip),
      created: firebase.firestore.FieldValue.serverTimestamp()
    }), 30000);
    ls.set(NAME, name);
    Store.save();
    connect(ref.id, 'upload');
    return ref.id;
  }
  async function join(code, name) {
    const id = parseCode(code);
    if (!id) throw Object.assign(new Error('Enlace o código no válido'), { code: 'bad-code' });
    await boot();
    const ref = db.collection('trips').doc(id);
    const snap = await withTimeout(ref.get({ source: 'server' }), 30000);
    if (!snap.exists) throw Object.assign(new Error('No encontramos ese viaje'), { code: 'not-found' });
    await withTimeout(ref.update({
      members: firebase.firestore.FieldValue.arrayUnion(Sync.uid),
      ['names.' + Sync.uid]: name
    }));
    ls.set(BACKUP, Store.state);           // respaldo de los datos locales
    ls.set(NAME, name);
    pendingName = name;
    Store.replace({});                     // se llenará con los datos del viaje
    connect(id, 'fresh');
    return (snap.data().trip || {}).name || 'el viaje';
  }
  async function leave() {
    const id = Sync.tripId, uid = Sync.uid;
    flush();
    stop();
    if (db && id) {
      try { await withTimeout(db.collection('trips').doc(id).update({ members: firebase.firestore.FieldValue.arrayRemove(uid) }), 8000); }
      catch (e) { console.warn('No se pudo salir en el servidor', e); }
    }
    const bk = ls.get(BACKUP, null);
    if (bk) { Store.replace(bk); ls.del(BACKUP); }
  }
  function parseCode(str) {
    const s = String(str || '').trim();
    const m = s.match(/viaje=([A-Za-z0-9]{10,40})/) || s.match(/^([A-Za-z0-9]{10,40})$/);
    return m ? m[1] : null;
  }
  const inviteLink = () => `${location.origin}${location.pathname}?viaje=${Sync.tripId}`;
  const savedTrip = () => (ls.get(SESSION, null) || {}).tripId || null;
  const savedName = () => ls.get(NAME, '');

  addEventListener('online', () => { if (Sync.active && Sync.status === 'offline') setStatus('connecting'); });
  addEventListener('offline', () => { if (Sync.active) setStatus('offline'); });

  window.Sync = Object.assign(Sync, { init, create, join, leave, push, flush, parseCode, inviteLink, savedTrip, savedName });
})();
