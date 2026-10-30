/* Tu grupo: ¿Quién lleva qué? · Habitaciones y camas · Bitácora.
   Módulo independiente: app.js le entrega sus herramientas (A) y recibe { render, homeCard, log, onRemote, ACT }. */
window.GroupModule = function (A) {
  'use strict';
  const { S, esc, ic, CHECK, $, $$, buzz, toast, confetti, openSheet, refreshSheet, closeSheet, render, confirmTap, myName, bounce, norm, cap, go, placeSeg, fmtDay } = A;
  const ui = { mode: 'gear', phase: 'ida', logK: 'all', logWho: 'all' };
  const uid = () => Store.uid();
  const G_ = () => { const s = S(); s.gear = s.gear || { items: {} }; s.gear.items = s.gear.items || {}; return s.gear; };
  const R_ = () => { const s = S(); s.rooms = s.rooms || { list: [], together: [] }; s.rooms.list = s.rooms.list || []; s.rooms.together = s.rooms.together || []; return s.rooms; };
  const L_ = () => { const s = S(); s.log = s.log || []; return s.log; };
  const people = () => S().trip.people.filter(Boolean);
  const save = () => Store.save();
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const listAnd = xs => xs.length > 1 ? xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1] : (xs[0] || '');
  const PAL = ['var(--pink)', 'var(--cyan)', 'var(--yellow)', 'var(--lime)', 'var(--violet)', 'var(--orange)', 'var(--teal)', 'var(--rose)'];
  const colorOf = name => PAL[[...String(name)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % PAL.length];

  /* ======================= BITÁCORA ======================= */
  const LOG_K = {
    money: ['Dinero', 'wallet'], shop: ['Súper', 'cart'], agenda: ['Agenda', 'calendar'],
    group: ['Grupo', 'users'], trip: ['Viaje', 'settings'], recipes: ['Recetas', 'pot']
  };
  /* Registra una acción. Con mk (clave de fusión) las acciones repetidas seguidas se juntan:
     "marcó 6 productos como comprados" en vez de seis líneas. text puede ser función (n) => texto. */
  function log(k, text, mk) {
    const l = L_(), who = myName(), now = Date.now();
    const txt = n => typeof text === 'function' ? text(n) : text;
    if (mk) {
      let last = null;
      for (let i = l.length - 1; i >= 0; i--) if (l[i].who === who) { last = l[i]; break; }
      if (last && last.mk === mk && now - last.t < 5 * 60e3) { last.n = (last.n || 1) + 1; last.t = now; last.text = txt(last.n); save(); return; }
    }
    l.push({ id: uid(), t: now, who, k, mk: mk || null, n: 1, text: txt(1) });
    if (l.length > 400) { l.sort((a, b) => a.t - b.t); l.splice(0, l.length - 400); }
    save();
  }
  /* Aviso cuando otra persona del grupo hace algo (llega por la sincronización) */
  let seenT = Date.now();
  function onRemote() {
    const me = myName(), l = L_();
    const fresh = l.filter(e => e.t > seenT && e.who !== me).sort((a, b) => b.t - a.t);
    l.forEach(e => { if (e.t > seenT) seenT = e.t; });
    if (fresh.length) toast(`${fresh[0].who} ${fresh[0].text}${fresh.length > 1 ? ` (y ${fresh.length - 1} más)` : ''}`, 3500);
  }
  const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const isoOf = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function dayLabel(ds) {
    const today = Store.today(), y = new Date(); y.setDate(y.getDate() - 1);
    if (ds === today) return 'Hoy';
    if (ds === isoOf(y.getTime())) return 'Ayer';
    const s = fmtDay(ds); return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const avatar = who => `<span class="log-av" style="--c:${colorOf(who)}">${esc(String(who).charAt(0).toUpperCase())}</span>`;
  function logView() {
    const all = L_().slice().sort((a, b) => b.t - a.t);
    const whos = [...new Set(all.map(e => e.who))];
    const list = all.filter(e => (ui.logK === 'all' || e.k === ui.logK) && (ui.logWho === 'all' || e.who === ui.logWho)).slice(0, 200);
    let last = '', rows = '';
    list.forEach(e => {
      const d = isoOf(e.t);
      if (d !== last) { last = d; rows += `<div class="day-h"><span>${esc(dayLabel(d))}</span></div>`; }
      const kk = LOG_K[e.k] || LOG_K.group;
      rows += `<div class="log-row">${avatar(e.who)}<div class="lr-m"><div><b>${esc(e.who)}</b> ${esc(e.text)}</div><small>${ic(kk[1])} ${kk[0]} · ${hhmm(e.t)}</small></div></div>`;
    });
    return `
      <p class="hint" style="margin:0 4px 12px">Se registra solo lo que hace cada persona: gastos, compras, agenda, despensa, cosas y piezas. Con el viaje compartido ves también lo del resto del grupo.</p>
      <div class="chips" style="margin-bottom:4px">
        <button class="chip ${ui.logK === 'all' ? 'active' : ''}" data-act="gLogK" data-k="all" style="--c:var(--pink)">Todo</button>
        ${Object.entries(LOG_K).map(([k, v]) => `<button class="chip ${ui.logK === k ? 'active' : ''}" data-act="gLogK" data-k="${k}" style="--c:var(--violet)">${ic(v[1])} ${v[0]}</button>`).join('')}
      </div>
      ${whos.length > 1 ? `<div class="chips">
        <button class="chip ${ui.logWho === 'all' ? 'active' : ''}" data-act="gLogWho" data-w="all" style="--c:var(--cyan)">Todos</button>
        ${whos.map(w => `<button class="chip ${ui.logWho === w ? 'active' : ''}" data-act="gLogWho" data-w="${esc(w)}" style="--c:${colorOf(w)}">${esc(w)}</button>`).join('')}
      </div>` : ''}
      ${rows || `<div class="card empty" style="margin-top:12px"><span class="ee">${ic('list')}</span><b>Aún no hay movimientos</b>Cuando alguien registre un gasto, marque compras o agende un plan, aparecerá aquí.</div>`}`;
  }

  /* ======================= ¿QUIÉN LLEVA QUÉ? ======================= */
  const SUGGEST = [
    ['Parlante', '🔊'], ['Cooler', '🧊'], ['Parrilla', '♨️'], ['Ollas grandes', '🍲'], ['Sartén', '🍳'], ['Alargador', '🔌'],
    ['Cargador múltiple', '🔋'], ['Juegos de mesa', '🎲'], ['Naipes', '🃏'], ['Botiquín', '🩹'], ['Linterna', '🔦'], ['Toallas extra', '🛁'],
    ['Hervidor', '🫖'], ['Cafetera', '☕'], ['Termo y mate', '🧉'], ['Bloqueador', '🧴'], ['Repelente', '🦟'], ['Pelota', '⚽'],
    ['Guitarra', '🎸'], ['Proyector', '📽️'], ['Saco de dormir', '🛌'], ['Carpa', '⛺'], ['Cuchillo cocinero', '🔪'], ['Tabla de picar', '🪵'],
    ['Secador de pelo', '💨'], ['Silla de playa', '🏖️'], ['Bicicleta', '🚲'], ['Hielera de vino', '🍷']
  ];
  const gearList = () => Object.values(G_().items).sort((a, b) => a.t - b.t);
  const emojiFor = name => (SUGGEST.find(s => norm(s[0]) === norm(name)) || [0, '📦'])[1];
  function gearRow(x, ida) {
    const on = ida ? x.brought : x.returned;
    return `<div class="list-row gear-row ${on ? 'done' : ''}">
      <button class="check ${on ? 'on' : ''}" data-act="gCheck" data-id="${x.id}" aria-label="${ida ? 'Marcar llevado' : 'Marcar devuelto'}">${CHECK}</button>
      <span class="ge">${x.e || '📦'}</span>
      <div class="rm"><div class="rn">${esc(x.name)}${x.qty > 1 ? ` <small>x${x.qty}</small>` : ''}</div>
        <div class="rv">${x.owner ? `lleva <b style="color:var(--strong)">${esc(x.owner)}</b>` : '<span class="dw-inline">nadie lo lleva todavía</span>'}${x.note ? ' · ' + esc(x.note) : ''}</div></div>
      ${!x.owner && ida ? `<button class="btn sm sea mine" data-act="gMine" data-id="${x.id}">Lo llevo yo</button>` : ''}
      <button class="del" data-act="gEdit" data-id="${x.id}" aria-label="Editar">${ic('edit')}</button>
    </div>`;
  }
  function gearView() {
    const items = gearList(), ida = ui.phase === 'ida';
    const used = new Set(items.map(x => norm(x.name)));
    const pool = ida ? items : items.filter(x => x.owner);
    const done = pool.filter(x => ida ? x.brought : x.returned).length;
    const noOwner = items.filter(x => !x.owner);
    const owners = [...new Set(people().concat(items.map(x => x.owner).filter(Boolean)))];
    const groups = owners.map(o => ({ o, rows: items.filter(x => x.owner === o) })).filter(g => g.rows.length);
    return `
      <div class="card">
        <div class="list-summary"><div><div class="eyebrow">${ida ? 'Antes del viaje' : 'Al volver'}</div><span class="big">${done}</span> / ${pool.length} ${ida ? 'ya en la mochila' : 'devueltas a su dueño'}</div><span class="sum-ic">${ic('box')}</span></div>
        <div class="progress"><i data-w="${pool.length ? done / pool.length * 100 : 0}%"></i></div>
        <div class="chips wrap" style="margin-top:12px">
          <button class="chip ${ida ? 'active' : ''}" data-act="gPhase" data-p="ida" style="--c:var(--orange)">Antes del viaje</button>
          <button class="chip ${!ida ? 'active' : ''}" data-act="gPhase" data-p="vuelta" style="--c:var(--lime)">Al volver: devoluciones</button>
        </div>
      </div>
      ${ida ? `<div class="pantry-add gear-add">
        <input id="gName" placeholder="Agregar: ej. parlante, cooler, juegos…" autocomplete="off" enterkeyhint="done">
        <button class="btn sea" data-act="gAdd" aria-label="Agregar">${ic('plus')}</button>
      </div>
      <div class="chips gear-sug">${SUGGEST.filter(s => !used.has(norm(s[0]))).map(s => `<button class="chip" data-act="gSug" data-n="${esc(s[0])}" style="--c:var(--orange)">${s[1]} ${esc(s[0])}</button>`).join('')}</div>` : ''}
      ${ida && noOwner.length ? `<div class="list-group" style="--c:var(--warn-t)"><div class="list-group-h">${ic('alert')} Falta quien lo lleve <span style="color:var(--dim)">(${noOwner.length})</span></div>${noOwner.map(x => gearRow(x, ida)).join('')}</div>` : ''}
      ${groups.map(g => `<div class="list-group" style="--c:${colorOf(g.o)}"><div class="list-group-h">${avatar(g.o)} ${esc(g.o)} lleva <span style="color:var(--dim)">(${g.rows.length})</span></div>${g.rows.map(x => gearRow(x, ida)).join('')}</div>`).join('')}
      ${!items.length ? `<div class="card empty" style="margin-top:14px"><span class="ee">${ic('box')}</span><b>¿Qué llevamos?</b>Toca las sugerencias o escribe una cosa. Después cada uno elige lo que lleva y así no llegan tres parlantes y ninguna olla.</div>` : ''}
      ${items.length ? `<div class="btn-row" style="margin-top:16px"><button class="btn sm" data-act="gCopy">${ic('copy')} Copiar para WhatsApp</button></div>` : ''}`;
  }
  function addGear(name) {
    name = cap(name.trim());
    if (!name) return;
    if (gearList().some(x => norm(x.name) === norm(name))) { toast(`“${name}” ya está en la lista`); return; }
    const id = uid();
    G_().items[id] = { id, name, e: emojiFor(name), owner: '', qty: 1, brought: false, returned: false, note: '', t: Date.now() };
    log('group', n => n === 1 ? `agregó “${name}” a ¿Quién lleva qué?` : `agregó ${n} cosas a ¿Quién lleva qué?`, 'gearAdd');
    buzz(10); render(false);
    const inp = $('#gName'); if (inp) inp.focus();
  }
  let gEditId = null;
  function gearEditHTML() {
    const x = G_().items[gEditId]; if (!x) return '';
    return `<div class="sheet-title"><span class="st-ico" style="--c:linear-gradient(135deg,var(--orange),var(--yellow))"><span style="font-size:28px">${x.e || '📦'}</span></span><div><h2>${esc(x.name)}</h2><p>¿Quién lo lleva?</p></div></div>
      <div class="field"><span>Lo lleva</span><div class="chips wrap" id="gOwners">
        <button class="chip ${!x.owner ? 'active' : ''}" data-act="gOwnerPick" data-v="" style="--c:var(--slate)">Nadie todavía</button>
        ${people().map(p => `<button class="chip ${x.owner === p ? 'active' : ''}" data-act="gOwnerPick" data-v="${esc(p)}" style="--c:${colorOf(p)}">${esc(p)}</button>`).join('')}
      </div></div>
      <div class="field-row">
        <label class="field"><span>Nombre</span><input id="geName" value="${esc(x.name)}" autocomplete="off"></label>
        <label class="field" style="flex:0 0 90px"><span>Cantidad</span><input id="geQty" inputmode="numeric" value="${x.qty || 1}"></label>
      </div>
      <label class="field"><span>Nota</span><input id="geNote" value="${esc(x.note || '')}" placeholder="Ej: el de Bluetooth grande" autocomplete="off"></label>
      <button class="btn primary block" data-act="gSave">Guardar</button>
      <button class="btn danger block" style="margin-top:10px" data-act="gDel">Quitar de la lista</button>`;
  }

  /* ======================= HABITACIONES Y CAMAS ======================= */
  const BED = { double: ['Cama 2 plazas', 2], single: ['Cama single', 1], bunk_down: ['Litera abajo', 1], bunk_up: ['Litera arriba', 1], sofa: ['Sofá cama', 1], mattress: ['Colchón', 1] };
  const bedCap = b => (BED[b.type] || BED.single)[1];
  const bedName = b => (BED[b.type] || BED.single)[0];
  const bedSvg = type => type === 'double'
    ? '<svg class="bed-ic" viewBox="0 0 48 32"><rect x="2" y="12" width="44" height="14" rx="3"/><rect x="5" y="6" width="17" height="9" rx="3"/><rect x="26" y="6" width="17" height="9" rx="3"/><path d="M4 26v4M44 26v4"/></svg>'
    : type === 'bunk_up' || type === 'bunk_down'
      ? `<svg class="bed-ic" viewBox="0 0 32 32"><path d="M4 2v28M28 2v28"/><rect x="4" y="${type === 'bunk_up' ? 6 : 19}" width="24" height="7" rx="2" class="fillb"/><rect x="4" y="${type === 'bunk_up' ? 19 : 6}" width="24" height="7" rx="2"/></svg>`
      : type === 'sofa'
        ? '<svg class="bed-ic" viewBox="0 0 40 32"><rect x="3" y="12" width="34" height="12" rx="4"/><rect x="8" y="5" width="24" height="9" rx="3"/><path d="M6 24v4M34 24v4"/></svg>'
        : type === 'mattress'
          ? '<svg class="bed-ic" viewBox="0 0 40 32"><rect x="3" y="14" width="34" height="10" rx="5"/><path d="M10 14v10M20 14v10M30 14v10"/></svg>'
          : '<svg class="bed-ic" viewBox="0 0 36 32"><rect x="3" y="12" width="30" height="14" rx="3"/><rect x="6" y="6" width="13" height="9" rx="3"/><path d="M5 26v4M31 26v4"/></svg>';
  const allBeds = () => R_().list.flatMap(r => r.beds.map(b => ({ r, b })));
  const whereIs = p => allBeds().find(x => x.b.who.includes(p));
  function roomsView() {
    const R = R_(), ppl = people(), beds = allBeds();
    const assigned = ppl.filter(p => whereIs(p)), unassigned = ppl.filter(p => !whereIs(p));
    const spots = beds.reduce((s, x) => s + bedCap(x.b), 0), used = beds.reduce((s, x) => s + x.b.who.length, 0);
    if (!R.list.length) {
      return `<div class="card empty"><span class="ee">${bedSvg('double')}</span><b>Arma las piezas de la cabaña</b>Agrega cada pieza con sus camas y después asígnalas a mano o con el sorteo.<br><br>
        <div class="btn-row"><button class="btn primary" data-act="gRoomNew">${ic('plus')} Agregar pieza</button><button class="btn" data-act="gRoomExample">Usar un ejemplo</button></div></div>`;
    }
    return `
      <div class="card">
        <div class="list-summary"><div><div class="eyebrow">Camas</div><span class="big">${assigned.length}</span> / ${ppl.length} con cama</div><span class="sum-ic" style="color:var(--lilac);background:rgba(139,92,246,.15)">${bedSvg('double')}</span></div>
        <div class="progress"><i data-w="${ppl.length ? assigned.length / ppl.length * 100 : 0}%"></i></div>
        <p class="hint" style="margin:10px 0 0">${R.list.length} ${R.list.length === 1 ? 'pieza' : 'piezas'} · ${spots} lugares · ${Math.max(0, spots - used)} libres${spots < ppl.length ? ` · <b style="color:var(--warn-t)">faltan ${ppl.length - spots} lugares</b>` : ''}</p>
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn primary shine" data-act="gRaffle">${ic('shuffle')} Sortear camas</button>
        <button class="btn sm" data-act="gPrefs">${ic('users')} Juntos${R.together.length ? ` (${R.together.length})` : ''}</button>
        <button class="btn sm" data-act="gRoomNew">${ic('plus')} Pieza</button>
      </div>
      ${unassigned.length ? `<div class="no-bed">${ic('alert')} Sin cama: ${unassigned.map(p => `<b>${esc(p)}</b>`).join(', ')}</div>` : ''}
      <div class="rooms">${R.list.map(r => `
        <div class="room-card">
          <div class="room-h"><b>${esc(r.name)}</b><span>${r.beds.length} ${r.beds.length === 1 ? 'cama' : 'camas'}</span><button class="del" data-act="gRoomEdit" data-r="${r.id}" aria-label="Editar pieza">${ic('edit')}</button></div>
          <div class="beds">${r.beds.map(b => `
            <button class="bed bed-${b.type} ${b.who.length ? 'taken' : ''}" data-act="gBed" data-r="${r.id}" data-b="${b.id}">
              ${bedSvg(b.type)}<small>${bedName(b)}${b.lock ? ` ${ic('lock')}` : ''}</small>
              <span class="bed-who">${b.who.length ? b.who.map(p => `<i style="--c:${colorOf(p)}">${esc(p)}</i>`).join('') : '<em>libre</em>'}</span>
            </button>`).join('') || '<p class="hint" style="margin:6px">Sin camas: toca el lápiz para agregarlas.</p>'}</div>
        </div>`).join('')}</div>`;
  }
  let roomEdit = null, bedEdit = null;
  const roomById = id => R_().list.find(r => r.id === id);
  function roomEditHTML() {
    const r = roomById(roomEdit); if (!r) return '';
    return `<div class="sheet-title"><span class="st-ico" style="--c:linear-gradient(135deg,var(--violet),var(--cyan))">${bedSvg('single')}</span><div><h2>${esc(r.name)}</h2><p>Nombre de la pieza y sus camas</p></div></div>
      <label class="field"><span>Nombre</span><input id="rmName" value="${esc(r.name)}" autocomplete="off"></label>
      <div class="field"><span>Camas (${r.beds.length})</span>
        ${r.beds.map(b => `<div class="list-row"><span class="ge">${bedSvg(b.type)}</span><div class="rm"><div class="rn">${bedName(b)}</div><div class="rv">${b.who.length ? esc(listAnd(b.who)) : 'libre'}</div></div><button class="del" data-act="gBedDel" data-b="${b.id}" aria-label="Quitar cama">✕</button></div>`).join('') || '<p class="hint">Todavía no tiene camas.</p>'}
      </div>
      <div class="field"><span>Agregar cama</span><div class="chips wrap">${Object.entries(BED).map(([t, v]) => `<button class="chip" data-act="gBedAdd" data-t="${t}" style="--c:var(--violet)">+ ${v[0]}</button>`).join('')}</div></div>
      <button class="btn primary block" data-act="gRoomSave">Listo</button>
      <button class="btn danger block" style="margin-top:10px" data-act="gRoomDel">Eliminar pieza</button>`;
  }
  function bedEditHTML() {
    const r = roomById(bedEdit && bedEdit.r), b = r && r.beds.find(x => x.id === bedEdit.b);
    if (!b) return '';
    const capN = bedCap(b);
    return `<div class="sheet-title"><span class="st-ico" style="--c:linear-gradient(135deg,var(--violet),var(--pink))">${bedSvg(b.type)}</span><div><h2>${esc(r.name)} · ${bedName(b)}</h2><p>${capN === 1 ? '1 persona' : capN + ' personas'}</p></div></div>
      <div class="field"><span>¿Quién duerme aquí?</span><div class="chips wrap">
        ${people().map(p => { const w = whereIs(p), here = b.who.includes(p); return `<button class="chip ${here ? 'active' : ''}" data-act="gBedWho" data-p="${esc(p)}" style="--c:${colorOf(p)}">${esc(p)}${w && !here ? ` <small style="opacity:.7">· ${esc(w.r.name)}</small>` : ''}</button>`; }).join('')}
      </div></div>
      <button class="btn block ${b.lock ? 'sea' : ''}" data-act="gBedLock">${ic('lock')} ${b.lock ? 'Fija: el sorteo no la cambia' : 'Fijar esta cama (el sorteo no la cambia)'}</button>
      <div class="btn-row" style="margin-top:10px"><button class="btn" data-act="gBedClear">Liberar cama</button><button class="btn primary" data-act="close">Listo</button></div>`;
  }
  function prefsHTML() {
    const R = R_(), ppl = people();
    return `<div class="sheet-title"><span class="st-ico" style="--c:linear-gradient(135deg,var(--pink),var(--violet))">${ic('users')}</span><div><h2>Siempre juntos</h2><p>Parejas o amigos que el sorteo deja en la misma cama doble o pieza</p></div></div>
      ${R.together.map((t, i) => `<div class="list-row"><div class="rm"><div class="rn">${esc(t.a)} + ${esc(t.b)}</div></div><button class="del" data-act="gPairDel" data-i="${i}" aria-label="Quitar">✕</button></div>`).join('') || '<p class="hint">Aún no hay parejas.</p>'}
      <div class="field-row" style="align-items:flex-end;margin-top:8px">
        <label class="field"><span>Persona</span><select id="pA">${ppl.map(p => `<option>${esc(p)}</option>`).join('')}</select></label>
        <label class="field"><span>Con</span><select id="pB">${ppl.map((p, i) => `<option ${i === 1 ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
        <button class="btn sea" style="margin-bottom:14px" data-act="gPairAdd" aria-label="Agregar pareja">${ic('plus')}</button>
      </div>
      <button class="btn primary block" data-act="close">Listo</button>`;
  }
  /* Sorteo: respeta camas fijas; las parejas van a una cama doble libre o a la misma pieza; el resto prefiere camas individuales */
  function raffle() {
    const R = R_(), beds = allBeds();
    beds.forEach(({ b }) => { if (!b.lock) b.who = []; });
    const fixed = new Set(beds.flatMap(({ b }) => b.lock ? b.who : []));
    const todo = people().filter(p => !fixed.has(p));
    const parent = {}; todo.forEach(p => { parent[p] = p; });
    const find = p => parent[p] === p ? p : (parent[p] = find(parent[p]));
    R.together.forEach(t => { if (parent[t.a] && parent[t.b]) parent[find(t.a)] = find(t.b); });
    const map = {}; todo.forEach(p => { (map[find(p)] = map[find(p)] || []).push(p); });
    const units = shuffle(Object.values(map)).sort((a, b) => b.length - a.length);
    const free = () => beds.filter(x => !x.b.lock && x.b.who.length < bedCap(x.b));
    const left = [];
    units.forEach(u => {
      if (u.length === 2) {
        const d = shuffle(free().filter(x => bedCap(x.b) === 2 && !x.b.who.length))[0];
        if (d) { d.b.who.push(...u); return; }
      }
      if (u.length > 1) {
        const room = shuffle(R.list).find(r => r.beds.reduce((s, b) => s + (b.lock ? 0 : bedCap(b) - b.who.length), 0) >= u.length);
        if (room) {
          u.forEach(p => { const spot = free().filter(x => x.r === room).sort((a, b) => bedCap(a.b) - bedCap(b.b))[0]; spot.b.who.push(p); });
          return;
        }
      }
      u.forEach(p => {
        const f = shuffle(free()).sort((a, b) => bedCap(a.b) - bedCap(b.b));
        if (f.length) f[0].b.who.push(p); else left.push(p);
      });
    });
    return left;
  }
  function rouletteAnim(names, done) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !names.length) { done(); return; }
    const ov = document.createElement('div');
    ov.className = 'roulette';
    ov.innerHTML = `<div class="rl-card"><div class="rl-k">Sorteando camas…</div><div class="rl-name"></div><div class="rl-bar"><i></i></div></div>`;
    document.body.appendChild(ov);
    const el = ov.querySelector('.rl-name'), t0 = Date.now();
    let i = 0, delay = 45;
    const step = () => {
      el.textContent = names[i++ % names.length];
      el.animate([{ transform: 'translateY(-40%)', opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: Math.min(delay, 160) });
      buzz(4);
      if (Date.now() - t0 < 1800) { delay *= 1.11; setTimeout(step, delay); }
      else setTimeout(() => { ov.classList.add('out'); setTimeout(() => ov.remove(), 320); done(); }, 280);
    };
    step();
  }
  function example() {
    const mk = (name, types) => ({ id: uid(), name, beds: types.map(t => ({ id: uid(), type: t, who: [], lock: false })) });
    R_().list = [mk('Pieza principal', ['double']), mk('Pieza 2', ['single', 'single']), mk('Pieza 3', ['bunk_down', 'bunk_up']), mk('Living', ['sofa'])];
  }

  /* ======================= PANTALLA "TU GRUPO" ======================= */
  const TITLES = { gear: '¿Quién lleva qué?', rooms: 'Habitaciones', log: 'Bitácora' };
  function renderGroup() {
    const nNo = gearList().filter(x => !x.owner).length, ppl = people(), nOut = ppl.filter(p => !whereIs(p)).length;
    const body = ui.mode === 'rooms' ? roomsView() : ui.mode === 'log' ? logView() : gearView();
    return `<div class="page">
      <header class="top stagger">
        <button class="icon-btn" data-act="go" data-to="home" aria-label="Volver a Inicio" style="--i:0">${ic('back')}</button>
        <div class="grow" style="--i:1"><div class="eyebrow">Tu grupo</div><h1 class="title">${TITLES[ui.mode]}</h1></div>
        <button class="icon-btn help-btn" data-act="help" data-s="group" aria-label="Ayuda: ¿cómo se usa?" style="--i:2">${ic('help')}</button>
      </header>
      <div class="seg seg3" id="groupSeg"><span class="seg-ind"></span>
        <button class="${ui.mode === 'gear' ? 'active' : ''}" data-act="gMode" data-m="gear">Cosas${nNo ? ` (${nNo})` : ''}</button>
        <button class="${ui.mode === 'rooms' ? 'active' : ''}" data-act="gMode" data-m="rooms">Piezas${R_().list.length && nOut ? ` (${nOut})` : ''}</button>
        <button class="${ui.mode === 'log' ? 'active' : ''}" data-act="gMode" data-m="log">Bitácora</button>
      </div>
      <div id="groupBody">${body}</div>
    </div>`;
  }
  function homeCard() {
    const items = gearList(), noOwner = items.filter(x => !x.owner).length, ppl = people();
    const withBed = ppl.filter(p => whereIs(p)).length, last = L_().slice().sort((a, b) => b.t - a.t)[0];
    const short = s => s.length > 34 ? s.slice(0, 33) + '…' : s;
    return `<div class="section-title"><h2>Tu grupo</h2></div>
      <div class="group-tiles">
        <button class="g-tile" data-act="gOpen" data-m="gear" style="--c:var(--orange)">${ic('box')}<b>¿Quién lleva qué?</b><small>${items.length ? (noOwner ? `${noOwner} sin dueño` : `${items.length} cosas repartidas`) : 'Lo que lleva cada uno'}</small></button>
        <button class="g-tile" data-act="gOpen" data-m="rooms" style="--c:var(--violet)">${bedSvg('double')}<b>Habitaciones</b><small>${R_().list.length ? `${withBed}/${ppl.length} con cama` : 'Piezas, camas y sorteo'}</small></button>
        <button class="g-tile" data-act="gOpen" data-m="log" style="--c:var(--cyan)">${ic('list')}<b>Bitácora</b><small>${last ? esc(short(`${last.who} ${last.text}`)) : 'Lo que hace cada uno'}</small></button>
      </div>`;
  }
  function switchMode(m) {
    ui.mode = m; buzz(8);
    const seg = $('#groupSeg');
    if (seg) { seg.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.m === m)); placeSeg(); }
    setTimeout(() => { render(false); const b = $('#groupBody'); if (b) b.classList.add('pop-in'); }, 230);
  }

  /* ======================= ACCIONES ======================= */
  const ACT = {
    gOpen: el => { ui.mode = el.dataset.m; go('group'); },
    gMode: el => { if (el.dataset.m !== ui.mode) switchMode(el.dataset.m); },
    gLogK: el => { ui.logK = el.dataset.k; buzz(6); render(false); },
    gLogWho: el => { ui.logWho = el.dataset.w; buzz(6); render(false); },
    // Cosas
    gPhase: el => { ui.phase = el.dataset.p; buzz(6); render(false); },
    gAdd: () => { const inp = $('#gName'); if (!inp.value.trim()) { toast('Escribe qué hay que llevar'); inp.focus(); return; } addGear(inp.value); },
    gSug: el => addGear(el.dataset.n),
    gMine: el => {
      const x = G_().items[el.dataset.id], me = myName();
      if (!x) return;
      if (!people().includes(me)) { gEditId = x.id; openSheet(gearEditHTML); return; }
      x.owner = me; save();
      log('group', `se ofreció a llevar ${x.name}`);
      buzz([10, 30, 10]); render(false); toast(`Llevas: ${x.name}`);
    },
    gCheck: el => {
      const x = G_().items[el.dataset.id]; if (!x) return;
      const ida = ui.phase === 'ida', f = ida ? 'brought' : 'returned';
      x[f] = !x[f]; save(); buzz(x[f] ? [10, 30, 10] : 8);
      if (x[f]) {
        if (ida) log('group', n => n === 1 ? `ya tiene listo: ${x.name}` : `ya tiene listas ${n} cosas`, 'gearBrought');
        else log('group', n => n === 1 ? `devolvió ${x.name} a ${x.owner || 'su dueño'}` : `marcó ${n} cosas como devueltas`, 'gearReturned');
      }
      render(false);
      const pool = ida ? gearList() : gearList().filter(g => g.owner);
      if (pool.length && pool.every(g => g[f])) { confetti(innerWidth / 2, innerHeight / 3, 110, 1.3); toast(ida ? '¡Todo listo para el viaje!' : '¡Todo volvió a su dueño!'); }
    },
    gEdit: el => { gEditId = el.dataset.id; openSheet(gearEditHTML); },
    gOwnerPick: el => { $$('#gOwners .chip').forEach(c => c.classList.toggle('active', c === el)); bounce(el); buzz(6); },
    gSave: () => {
      const x = G_().items[gEditId]; if (!x) return;
      const sel = $('#gOwners .chip.active'), owner = sel ? sel.dataset.v : '';
      const changed = owner !== x.owner;
      x.owner = owner; x.name = cap($('#geName').value.trim()) || x.name;
      x.qty = Math.max(1, parseInt($('#geQty').value, 10) || 1); x.note = $('#geNote').value.trim();
      if (changed && owner) log('group', `asignó ${x.name} a ${owner}`);
      save(); closeSheet(); render(false);
    },
    gDel: el => {
      if (!confirmTap(el, '¿Quitar? Toca otra vez')) return;
      const x = G_().items[gEditId]; if (!x) return;
      delete G_().items[gEditId];
      log('group', `quitó “${x.name}” de ¿Quién lleva qué?`);
      save(); closeSheet(); render(false);
    },
    gCopy: async () => {
      const items = gearList(), owners = [...new Set(items.map(x => x.owner).filter(Boolean))];
      const text = `¿Quién lleva qué? · ${S().trip.name}\n` +
        owners.map(o => `• ${o}: ${items.filter(x => x.owner === o).map(x => x.name + (x.qty > 1 ? ' x' + x.qty : '')).join(', ')}`).join('\n') +
        (items.some(x => !x.owner) ? `\n• Falta quien lleve: ${items.filter(x => !x.owner).map(x => x.name).join(', ')}` : '');
      try { await navigator.clipboard.writeText(text); toast('Copiado para WhatsApp'); }
      catch (e) { if (navigator.share) { try { await navigator.share({ text }); } catch (er) { /* cancelado */ } } else toast('No se pudo copiar'); }
    },
    // Piezas
    gRoomExample: () => { example(); save(); log('group', 'armó las piezas de la cabaña'); render(false); },
    gRoomNew: () => {
      const R = R_(), r = { id: uid(), name: `Pieza ${R.list.length + 1}`, beds: [] };
      R.list.push(r); save(); roomEdit = r.id; render(false); openSheet(roomEditHTML);
    },
    gRoomEdit: el => { roomEdit = el.dataset.r; openSheet(roomEditHTML); },
    gBedAdd: el => {
      const r = roomById(roomEdit); if (!r) return;
      r.name = $('#rmName').value.trim() || r.name;
      r.beds.push({ id: uid(), type: el.dataset.t, who: [], lock: false });
      save(); buzz(8); refreshSheet(); render(false);
    },
    gBedDel: el => {
      const r = roomById(roomEdit); if (!r) return;
      r.name = $('#rmName').value.trim() || r.name;
      r.beds = r.beds.filter(b => b.id !== el.dataset.b);
      save(); buzz(8); refreshSheet(); render(false);
    },
    gRoomSave: () => { const r = roomById(roomEdit); if (r) r.name = $('#rmName').value.trim() || r.name; save(); closeSheet(); render(false); },
    gRoomDel: el => {
      if (!confirmTap(el, '¿Eliminar pieza? Toca otra vez')) return;
      R_().list = R_().list.filter(r => r.id !== roomEdit);
      save(); closeSheet(); render(false);
    },
    gBed: el => { bedEdit = { r: el.dataset.r, b: el.dataset.b }; openSheet(bedEditHTML); },
    gBedWho: el => {
      const r = roomById(bedEdit.r), b = r && r.beds.find(x => x.id === bedEdit.b), p = el.dataset.p;
      if (!b) return;
      if (b.who.includes(p)) b.who = b.who.filter(x => x !== p);
      else {
        allBeds().forEach(x => { x.b.who = x.b.who.filter(w => w !== p); });   // una persona, una cama
        if (b.who.length >= bedCap(b)) b.who.shift();                           // cama llena: reemplaza
        b.who.push(p);
        log('group', n => n === 1 ? `asignó a ${p} a ${r.name} (${bedName(b).toLowerCase()})` : `hizo ${n} cambios en las piezas`, 'rooms');
      }
      save(); buzz(8); refreshSheet(); render(false);
    },
    gBedLock: () => { const r = roomById(bedEdit.r), b = r && r.beds.find(x => x.id === bedEdit.b); if (!b) return; b.lock = !b.lock; save(); buzz(8); refreshSheet(); render(false); },
    gBedClear: () => { const r = roomById(bedEdit.r), b = r && r.beds.find(x => x.id === bedEdit.b); if (!b) return; b.who = []; b.lock = false; save(); refreshSheet(); render(false); },
    gPrefs: () => openSheet(prefsHTML),
    gPairAdd: () => {
      const a = $('#pA').value, b = $('#pB').value, R = R_();
      if (!a || !b || a === b) { toast('Elige dos personas distintas'); return; }
      if (R.together.some(t => (t.a === a && t.b === b) || (t.a === b && t.b === a))) { toast('Esa pareja ya está'); return; }
      R.together.push({ a, b }); save(); buzz(8); refreshSheet(); render(false);
    },
    gPairDel: el => { R_().together.splice(+el.dataset.i, 1); save(); refreshSheet(); render(false); },
    gRaffle: () => {
      if (!allBeds().length) { toast('Primero agrega camas a las piezas'); return; }
      rouletteAnim(shuffle(people()), () => {
        const left = raffle();
        save(); log('group', n => n === 1 ? 'sorteó las camas' : `sorteó las camas (${n} veces)`, 'raffle');
        render(false);
        $$('.bed').forEach((b, i) => { b.style.setProperty('--i', i); b.classList.add('reveal'); });
        confetti(innerWidth / 2, innerHeight / 3, 90, 1.1); buzz([20, 40, 20]);
        toast(left.length ? `Faltan camas: ${listAnd(left)} quedó sin cama` : '¡Camas sorteadas!', 3200);
      });
    }
  };

  // Enter en "Agregar cosa"
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'gName') { e.preventDefault(); ACT.gAdd(); } });

  return { render: renderGroup, homeCard, log, onRemote, ACT, ui };
};
