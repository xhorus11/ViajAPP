/* Mis viajes y cuenta (módulo aparte).
   - Varios viajes en el mismo equipo: el abierto vive en Store (`viajapp-v1`); los demás en `viajapp-trip:<id>`.
     Índice en `viajapp-trips` = { active, list: [{ id, name, start, end, n, cloud, t, remote }] }
     (cloud = ID del viaje en Firestore si es compartido o está en la cuenta; remote = está en la cuenta pero aún no en este equipo).
   - Plantillas: crear un viaje nuevo a partir de otro (participantes, lista, agenda corrida a las nuevas fechas…).
   - Cuenta con correo o Google: la sesión anónima se vincula (no se pierde nada) y los viajes se guardan en la cuenta.
   app.js le pasa sus herramientas y recibe { ACT, homeButton, open, byCloud, switchTo, pullRemote, touch }. */
function TripsModule(A) {
  const { S, esc, ic, toast, buzz, confetti, openSheet, refreshSheet, closeSheet, $, render, confirmTap, log, getDraft, setDraft, releaseDraft, onSwitch, openTripSheet, nameFor } = A;
  const IDX = 'viajapp-trips', SLOT = id => 'viajapp-trip:' + id;
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* bloqueado */ } }
  };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (ds, k) => { const d = U.parseDate(ds); d.setDate(d.getDate() + k); return iso(d); };
  const daysBetween = (a, b) => Math.round((U.parseDate(b) - U.parseDate(a)) / 864e5);
  const metaOf = st => ({ name: st.trip.name || 'Mi viaje', start: st.trip.start || '', end: st.trip.end || '', n: (st.trip.people || []).length });

  /* ---------- Índice ---------- */
  let idx = ls.get(IDX, null);
  const saveIdx = () => ls.set(IDX, idx);
  if (!idx || !Array.isArray(idx.list) || !idx.list.length) {   // primera vez: el viaje que ya había pasa a ser el primero de la lista
    const id = Store.uid();
    idx = { active: id, list: [Object.assign({ id, cloud: Sync.savedTrip(), t: Date.now() }, metaOf(S()))] };
    saveIdx();
  }
  if (!idx.list.some(e => e.id === idx.active)) { idx.active = idx.list[0].id; saveIdx(); }
  const cur = () => idx.list.find(e => e.id === idx.active);
  const byCloud = id => id ? idx.list.find(e => e.cloud === id) : null;
  const signed = () => !!Sync.user();
  function touch() {
    const e = cur(); if (!e) return;
    Object.assign(e, metaOf(S()));
    if (Sync.active && Sync.tripId) e.cloud = Sync.tripId;
    saveIdx();
  }

  /* ---------- Cambiar de viaje ---------- */
  async function switchTo(id) {
    const target = idx.list.find(e => e.id === id);
    if (!target || id === idx.active) return;
    Store.writeNow(); touch();
    Sync.pause();                                   // el viaje compartido actual queda en pausa (no se sale)
    if (!ls.set(SLOT(idx.active), S())) {           // sin espacio: se vuelve al viaje actual
      const c = cur(); if (c.cloud) await Sync.open(c.cloud, false).catch(() => {});
      throw new Error('No hay espacio en este equipo para guardar el viaje');
    }
    const st = ls.get(SLOT(id), null);
    idx.active = id; target.t = Date.now(); saveIdx();
    Store.replace(st || {}); Store.writeNow();
    ls.del(SLOT(id));
    onSwitch();
    if (target.cloud) {
      try { await Sync.open(target.cloud, !st); target.remote = false; saveIdx(); }
      catch (e) { toast('Sin conexión: el viaje se abrirá cuando vuelva internet', 3500); }
    }
  }
  /* Agrega un viaje (con sus datos) y lo abre. Con cuenta, se guarda en la nube */
  async function addTrip(st) {
    const id = Store.uid();
    if (!ls.set(SLOT(id), st)) throw new Error('No hay espacio en este equipo');
    idx.list.push(Object.assign({ id, cloud: null, t: Date.now() }, metaOf(st))); saveIdx();
    await switchTo(id);
    if (signed() && navigator.onLine) { try { await Sync.create(nameFor()); } catch (e) { console.warn(e); } }
  }
  /* Quitar un viaje de este equipo (y de la cuenta, o salir si es compartido) */
  async function removeTrip(id) {
    const e = idx.list.find(x => x.id === id); if (!e) return;
    if (id === idx.active) {
      const next = idx.list.filter(x => x.id !== id).sort((a, b) => b.t - a.t)[0];
      if (next) await switchTo(next.id);
      else { await addTrip(Store.DEFAULT()); }
    }
    const st = ls.get(SLOT(id), null);
    if (st && !e.cloud) for (const pid of Store.photoIds(st)) await Store.photos.del(pid);
    ls.del(SLOT(id));
    idx.list = idx.list.filter(x => x.id !== id); saveIdx();
    if (e.cloud) await Sync.removeTrip(e.cloud);
  }

  /* ---------- Ganchos que llama Sync ---------- */
  const hooks = {
    // Unirse a un viaje compartido: el actual queda guardado y se abre uno nuevo para el viaje del grupo
    beforeJoin(cloudId, name) {
      Store.writeNow(); touch();
      ls.set(SLOT(idx.active), S());
      const old = byCloud(cloudId);
      if (old) { ls.del(SLOT(old.id)); idx.list = idx.list.filter(x => x !== old); }
      const id = Store.uid();
      idx.list.push({ id, cloud: cloudId, name: name || 'Viaje compartido', start: '', end: '', n: 0, t: Date.now() });
      idx.active = id; saveIdx();
    },
    // Salir del viaje compartido: se quita de la lista y se vuelve al último viaje usado
    async afterLeave(cloudId) {
      const e = byCloud(cloudId) || cur();
      idx.list = idx.list.filter(x => x !== e); ls.del(SLOT(e.id));
      const next = idx.list.slice().sort((a, b) => b.t - a.t)[0];
      if (!next) { const id = Store.uid(); idx.list.push(Object.assign({ id, cloud: null, t: Date.now() }, metaOf(Store.DEFAULT()))); idx.active = id; saveIdx(); Store.replace({}); onSwitch(); return; }
      const st = ls.get(SLOT(next.id), null);
      idx.active = next.id; next.t = Date.now(); saveIdx();
      Store.replace(st || {}); Store.writeNow(); ls.del(SLOT(next.id)); onSwitch();
      if (next.cloud) await Sync.open(next.cloud, !st).catch(() => {});
    },
    onCloud(cloudId) { const e = cur(); if (e) { e.cloud = cloudId; e.remote = false; saveIdx(); } },
    onDetached(cloudId) { idx.list.forEach(e => { if (e.cloud === cloudId) e.cloud = null; }); idx.list = idx.list.filter(e => !e.remote || e.cloud); saveIdx(); }
  };
  window.Trips = hooks;

  /* ---------- Cuenta ---------- */
  /* Trae a la lista los viajes de la cuenta que no están en este equipo */
  async function pullRemote() {
    if (!signed()) return 0;
    const list = await Sync.myTrips();
    let added = 0;
    list.forEach(r => {
      const e = byCloud(r.cloud);
      if (e) { if (e.remote) Object.assign(e, { name: r.name, start: r.start, end: r.end, n: r.n }); }
      else { idx.list.push({ id: Store.uid(), cloud: r.cloud, name: r.name, start: r.start, end: r.end, n: r.n, t: 0, remote: true }); added++; }
    });
    idx.list = idx.list.filter(e => !e.remote || list.some(r => r.cloud === e.cloud));
    saveIdx();
    return added;
  }
  /* Después de entrar o crear la cuenta: todos los viajes de este equipo quedan en la cuenta */
  async function syncAccount() {
    Store.writeNow(); touch();
    const name = nameFor(), active = cur();
    Sync.pause();
    for (const e of idx.list) if (e.cloud && !e.remote) { try { await Sync.rejoin(e.cloud, name); } catch (er) { console.warn('rejoin', er); } }
    for (const e of idx.list) if (!e.cloud && e.id !== active.id) {
      const st = ls.get(SLOT(e.id), null);
      if (st) { try { e.cloud = await Sync.uploadState(st, name); saveIdx(); } catch (er) { console.warn('upload', er); } }
    }
    if (active.cloud) await Sync.open(active.cloud, false);
    else await Sync.create(name);
    await pullRemote().catch(() => 0);
  }
  /* Cerrar sesión: los viajes de la cuenta salen de este equipo (siguen en la cuenta); los de solo este equipo se quedan */
  async function signOut() {
    Store.writeNow(); touch();
    await Sync.signOut();
    const keep = idx.list.filter(e => !e.cloud);
    idx.list.filter(e => e.cloud).forEach(e => ls.del(SLOT(e.id)));
    if (cur().cloud) {
      const next = keep.sort((a, b) => b.t - a.t)[0];
      if (next) { const st = ls.get(SLOT(next.id), null); idx.active = next.id; Store.replace(st || {}); ls.del(SLOT(next.id)); }
      else { const id = Store.uid(); keep.push(Object.assign({ id, cloud: null, t: Date.now() }, metaOf(Store.DEFAULT()))); idx.active = id; Store.replace({}); }
      Store.writeNow();
    }
    idx.list = keep; saveIdx(); onSwitch();
  }

  /* ---------- Plantillas ---------- */
  const TPL = [['people', 'Participantes y dietas'], ['shop', 'Lista del súper (sin marcar)'], ['agenda', 'Agenda y comidas (en las nuevas fechas)'],
    ['group', 'Quién lleva qué y piezas'], ['recipes', 'Recetas propias'], ['funds', 'Fondos, entidad, responsables y logo']];
  const stateOf = id => id === idx.active ? JSON.parse(JSON.stringify(S())) : ls.get(SLOT(id), null);
  function fromTemplate(src, o) {
    const out = Store.DEFAULT(), t = src.trip;
    const len = t.start && t.end ? Math.max(0, daysBetween(t.start, t.end)) : 0, shift = t.start ? daysBetween(t.start, o.start) : 0;
    Object.assign(out.trip, { name: o.name, start: o.start, end: addDays(o.start, len), currency: t.currency || 'CLP' });
    if (o.people) Object.assign(out.trip, { people: (t.people || []).slice(), diets: t.diets || {} });
    if (o.funds) ['entity', 'responsibles', 'responsible', 'rut', 'budget', 'brand'].forEach(k => { if (t[k] !== undefined) out.trip[k] = t[k]; });
    out.shop.custom = (src.shop && src.shop.custom) || {}; out.shop.extraVar = (src.shop && src.shop.extraVar) || {};
    if (o.shop) Object.entries((src.shop && src.shop.sel) || {}).forEach(([k, r]) => { const x = Object.assign({}, r, { done: false }); delete x.pa; out.shop.sel[k] = x; });
    if (o.agenda) out.events = (src.events || []).map(e => { const x = Object.assign({}, e, { id: Store.uid(), date: e.date ? addDays(e.date, shift) : e.date }); delete x.cooked; delete x.cookLog; return x; });
    if (o.group) {
      Object.values((src.gear && src.gear.items) || {}).forEach(g => { out.gear.items[g.id] = Object.assign({}, g, { brought: false, returned: false, owner: o.people ? g.owner : '' }); });
      const rooms = JSON.parse(JSON.stringify(src.rooms || { list: [], together: [] }));
      if (!o.people) { rooms.list.forEach(r => (r.beds || []).forEach(b => { b.who = []; b.lock = false; })); rooms.together = []; }
      out.rooms = rooms;
    }
    if (o.recipes) out.recipes = src.recipes || { custom: {}, hidden: {} };
    return out;
  }

  /* ---------- Vistas ---------- */
  const GOOGLE = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const range = e => e.start ? `${U.dmy(e.start)}${e.end && e.end !== e.start ? ' → ' + U.dmy(e.end) : ''}` : 'Sin fechas';
  function accountHTML() {
    const u = Sync.user();
    if (u) return `<div class="card acct on">
        <span class="acct-ico">${ic('cloud')}</span>
        <div class="acct-txt"><b>${esc(u.email || u.name || 'Tu cuenta')}</b><small>Tus viajes se guardan en tu cuenta: entra con ella en otro celular o en el computador y los verás ahí.</small></div>
        <button class="link" data-act="acctOut">Cerrar sesión</button>
      </div>`;
    return `<div class="card acct">
        <b>Guarda tus viajes en una cuenta</b>
        <small>Así no los pierdes si cambias de celular y los ves también en el computador. Todo lo que ya tienes se conserva.</small>
        <button class="btn block google-btn" data-act="acctGoogle">${GOOGLE} Continuar con Google</button>
        <button class="btn block" data-act="acctEmail">${ic('mail')} Usar mi correo</button>
      </div>`;
  }
  function itemHTML(e) {
    const on = e.id === idx.active;
    const tag = e.remote ? '<i class="ti-tag">En tu cuenta · toca para abrir</i>'
      : e.cloud ? `<i class="ti-tag sky">${signed() ? 'En tu cuenta' : 'Compartido'}</i>` : '<i class="ti-tag">Solo en este equipo</i>';
    return `<div class="trip-item ${on ? 'on' : ''}">
      <button class="ti-main" data-act="tripOpen" data-id="${e.id}" ${on ? 'aria-current="true"' : ''}>
        <b>${esc(e.name)}</b>
        <small>${ic('calendar')} ${range(e)}${e.n ? ` · ${ic('users')} ${e.n}` : ''}</small>
        <span class="ti-tags">${on ? '<i class="ti-tag now">Abierto ahora</i>' : ''}${tag}</span>
      </button>
      <div class="ti-acts">
        ${e.remote ? '' : `<button class="btn sm" data-act="tripTpl" data-id="${e.id}">${ic('copy')} Usar como plantilla</button>`}
        <button class="btn sm ti-del" data-act="tripDel" data-id="${e.id}">${ic('trash')} Quitar</button>
      </div>
    </div>`;
  }
  function tripsHTML() {
    touch();
    const list = idx.list.slice().sort((a, b) => (b.id === idx.active) - (a.id === idx.active) || (a.remote ? 1 : 0) - (b.remote ? 1 : 0) || b.t - a.t);
    return `<div class="sheet-title"><span class="st-ico">${ic('list')}</span><div><h2>Mis viajes</h2><p>Cambia de viaje o repite uno como plantilla</p></div></div>
      ${accountHTML()}
      <div class="trip-list">${list.map(itemHTML).join('')}</div>
      <button class="btn primary block shine" data-act="tripNew">${ic('plus')} Nuevo viaje</button>
      <p class="hint" style="margin-top:8px">¿Repites un viaje parecido? Toca <b>Usar como plantilla</b> en uno anterior y se copian la lista, la agenda y el grupo con las fechas nuevas.</p>`;
  }
  function emailHTML() {
    return `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-sea)">${ic('mail')}</span><div><h2>Tu cuenta con correo</h2><p>Lo que tienes en este equipo se guarda en la cuenta</p></div></div>
      <label class="field"><span>Correo</span><input id="acEmail" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@ejemplo.cl"></label>
      <label class="field"><span>Contraseña</span><input id="acPass" type="password" autocomplete="current-password" placeholder="Mínimo 6 caracteres"></label>
      <button class="btn primary block shine" data-act="acctCreate">Crear mi cuenta</button>
      <button class="btn block" style="margin-top:10px" data-act="acctLogin">Ya tengo cuenta: entrar</button>
      <button class="link" style="margin-top:12px" data-act="acctReset">Olvidé mi contraseña</button>`;
  }
  function tplHTML() {
    const d = getDraft(), src = idx.list.find(e => e.id === d.src) || {};
    const len = src.start && src.end ? daysBetween(src.start, src.end) + 1 : 1;
    return `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-lime)">${ic('copy')}</span><div><h2>Repetir un viaje</h2><p>Usa «${esc(src.name)}» como plantilla</p></div></div>
      <label class="field"><span>Nombre del viaje nuevo</span><input id="tplName" value="${esc(d.name)}" autocomplete="off"></label>
      <label class="field"><span>¿Cuándo empieza?</span><input type="date" id="tplStart" value="${esc(d.start)}"></label>
      <p class="hint" style="margin-top:-6px">Dura ${len} ${len === 1 ? 'día' : 'días'}, igual que el original.</p>
      <div class="field"><span>¿Qué copiamos?</span><div class="chips wrap">
        ${TPL.map(([k, n]) => `<button class="chip ${d.o[k] ? 'active' : ''}" style="--c:var(--lime)" data-act="tplTog" data-k="${k}">${d.o[k] ? '✓ ' : ''}${n}</button>`).join('')}
      </div></div>
      <p class="hint">No se copian los gastos, la despensa ni la bitácora: el viaje nuevo parte en cero en eso.</p>
      <button class="btn primary block shine" data-act="tplGo">${ic('plus')} Crear viaje</button>`;
  }
  const open = () => { const d = { _kind: 'trips' }; setDraft(d); openSheet(tripsHTML, releaseDraft(d)); if (signed()) pullRemote().then(n => { if (n && getDraft() === d) refreshSheet(); }).catch(() => {}); };
  const homeButton = () => `<button class="trips-btn" data-act="trips" aria-label="Mis viajes">${ic('list')} Mis viajes${idx.list.length > 1 ? ` <b>${idx.list.length}</b>` : ''}</button>`;

  async function busy(el, label, fn) {
    if (el.dataset.busy) return;
    el.dataset.busy = '1'; const old = el.innerHTML; el.innerHTML = label; el.style.opacity = '.7';
    try { await fn(); } catch (e) { console.error(e); toast(e.message || 'No se pudo completar', 3800); }
    finally { delete el.dataset.busy; if (el.isConnected) { el.innerHTML = old; el.style.opacity = ''; } }
  }
  const creds = () => ({ email: ($('#acEmail').value || '').trim(), pass: $('#acPass').value || '' });
  async function afterLogin(r) {
    toast('Guardando tus viajes en la cuenta…', 2500);
    await syncAccount();
    render(true); open();
    toast(r.mode === 'linked' ? 'Listo: tus viajes quedaron guardados en tu cuenta' : 'Entraste a tu cuenta. Tus viajes están en Mis viajes', 3500);
    confetti(); buzz([10, 30, 10]);
  }

  const ACT = {
    trips: () => open(),
    tripOpen: el => {
      if (el.dataset.id === idx.active) { closeSheet(); return; }
      return busy(el, '<b>Abriendo…</b>', async () => {
        const e = idx.list.find(x => x.id === el.dataset.id);
        if (e.remote && !navigator.onLine) throw new Error('Necesitas internet para abrir un viaje de tu cuenta por primera vez');
        await switchTo(el.dataset.id);
        closeSheet(); render(true); toast(`Abriste «${cur().name}»`); buzz(10);
      });
    },
    tripNew: el => busy(el, 'Creando…', async () => {
      const st = Store.DEFAULT(); st.trip.name = 'Nuevo viaje';
      if (S().trip.people.length && S().trip.people[0] !== 'Yo') st.trip.people = [nameFor()];
      await addTrip(st);
      closeSheet(); render(true); toast('Viaje nuevo creado: ponle nombre y fechas'); setTimeout(openTripSheet, 380);
    }),
    tripDel: el => {
      const e = idx.list.find(x => x.id === el.dataset.id); if (!e) return;
      const others = e.cloud && !signed();
      if (!confirmTap(el, e.cloud ? (others ? '¿Salir del viaje? Toca de nuevo' : '¿Quitar de tu cuenta? Toca de nuevo') : '¿Borrar este viaje? Toca de nuevo')) return;
      return busy(el, 'Quitando…', async () => {
        await removeTrip(e.id); refreshSheet(); render(true); toast(`Se quitó «${e.name}»`);
      });
    },
    tripTpl: el => {
      const src = idx.list.find(x => x.id === el.dataset.id); if (!src) return;
      const d = { _kind: 'tpl', src: src.id, name: src.name.replace(/\b(20\d\d)\b/, y => +y + 1), start: Store.today(), o: { people: true, shop: true, agenda: true, group: true, recipes: true, funds: true } };
      setDraft(d); openSheet(tplHTML, releaseDraft(d));
    },
    tplTog: el => { const d = getDraft(); d.name = $('#tplName').value; d.start = $('#tplStart').value || d.start; d.o[el.dataset.k] = !d.o[el.dataset.k]; buzz(6); refreshSheet(); },
    tplGo: el => {
      const d = getDraft(), name = $('#tplName').value.trim(), start = $('#tplStart').value;
      if (!name) { toast('Ponle un nombre al viaje'); $('#tplName').focus(); return; }
      if (!start) { toast('Elige cuándo empieza'); return; }
      return busy(el, 'Creando…', async () => {
        const src = stateOf(d.src), srcName = (idx.list.find(e => e.id === d.src) || {}).name || '';
        if (!src) throw new Error('No se encontraron los datos de ese viaje en este equipo');
        await addTrip(fromTemplate(src, Object.assign({ name, start }, d.o)));
        log('trip', `creó el viaje a partir de «${srcName}»`);
        closeSheet(); render(true); toast(`Viaje «${name}» creado a partir de «${srcName}»`, 3200); confetti(); buzz([10, 30, 10]);
      });
    },
    acctGoogle: el => {
      if (!navigator.onLine) { toast('Necesitas conexión a internet'); return; }
      return busy(el, 'Abriendo Google…', async () => { await afterLogin(await Sync.google()); });
    },
    acctEmail: () => { const d = { _kind: 'acct' }; setDraft(d); openSheet(emailHTML, releaseDraft(d)); },
    acctCreate: el => {
      const c = creds();
      if (!c.email || !c.pass) { toast('Escribe tu correo y una contraseña'); return; }
      return busy(el, 'Creando cuenta…', async () => { await afterLogin(await Sync.createAccount(c.email, c.pass)); });
    },
    acctLogin: el => {
      const c = creds();
      if (!c.email || !c.pass) { toast('Escribe tu correo y tu contraseña'); return; }
      return busy(el, 'Entrando…', async () => { await afterLogin(await Sync.signInEmail(c.email, c.pass)); });
    },
    acctReset: el => {
      const c = creds();
      if (!c.email) { toast('Escribe tu correo arriba'); $('#acEmail').focus(); return; }
      return busy(el, 'Enviando…', async () => { await Sync.resetPassword(c.email); toast('Te enviamos un correo para crear una contraseña nueva', 4000); });
    },
    acctOut: el => {
      if (!confirmTap(el, '¿Cerrar sesión? Toca de nuevo')) return;
      return busy(el, 'Cerrando…', async () => {
        await signOut(); closeSheet(); render(true);
        toast('Cerraste sesión. Tus viajes siguen en tu cuenta', 3500);
      });
    }
  };

  return { ACT, homeButton, open, byCloud, switchTo, pullRemote, touch, signed };
}
