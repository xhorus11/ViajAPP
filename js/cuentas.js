/* Cuentas separadas (módulo aparte, solo AGREGA a la app).
   Dividir una boleta por lo que consumió cada uno (ej. el bar): productos y precios editables, a quién le toca
   cada producto (uno, varios o todos), propina a elección repartida según lo consumido, quién pagó y la boleta
   de respaldo. Se abre desde Dinero ("Cuentas separadas") o desde un gasto ya anotado.
   Se guarda en el gasto como `split` (campo opcional) y Cuentas claras cobra a cada uno lo suyo.
   app.js le pasa sus herramientas y recibe { ACT, linkHTML, expenseButtonHTML, html, onPhoto, shares }. */
function SplitModule(A) {
  const { S, esc, ic, toast, money, buzz, confetti, refreshSheet, openSheet, closeSheet, $, $$, getDraft, setDraft, photoCache, FUND, log, render, BOL } = A;
  const fmt = n => Math.round(+n || 0).toLocaleString('es-CL');
  const num = v => { const x = +String(v == null ? '' : v).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'); return isFinite(x) ? x : 0; };
  const TIPS = [0, 10, 15];
  const EACH = '__cada_uno__';   // "Cada uno pagó lo suyo"

  /* ---------- Cálculo: parte de cada persona (consumo + propina proporcional) ---------- */
  function calc(st) {
    const ppl = st.people, per = {}, sub = {};
    ppl.forEach(p => { sub[p] = 0; });
    let none = 0;
    st.items.forEach(it => {
      const who = (it.who || []).filter(p => ppl.includes(p)), p = +it.p || 0;
      if (who.length) who.forEach(w => { sub[w] += p / who.length; });
      else none += p;
    });
    if (none && ppl.length) ppl.forEach(p => { sub[p] += none / ppl.length; });   // lo sin asignar: entre todos
    const items = Object.values(sub).reduce((a, b) => a + b, 0), tip = items * (+st.tip || 0) / 100;
    ppl.forEach(p => { per[p] = { sub: sub[p], tip: sub[p] * (+st.tip || 0) / 100 }; per[p].total = per[p].sub + per[p].tip; per[p].rt = Math.round(per[p].total); });
    // Montos en pesos enteros que suman exactamente el total (la diferencia del redondeo va a quien más consumió)
    const total = items + tip, top = ppl.slice().sort((a, b) => per[b].total - per[a].total)[0];
    if (top) per[top].rt += Math.round(total) - ppl.reduce((a, p) => a + per[p].rt, 0);
    return { per, items, tip, total, none };
  }
  /* Para Cuentas claras: cuánto le toca a cada uno de un gasto con cuentas separadas (ajustado al monto del gasto) */
  function shares(e) {
    const s = e.split; if (!s || !(s.items || []).length) return null;
    const c = calc({ people: s.people || [], items: s.items, tip: s.tip });
    if (!c.total) return null;
    const k = (+e.amount || 0) / c.total, out = {};
    Object.entries(c.per).forEach(([p, v]) => { if (v.total > 0) out[p] = v.total * k; });
    return out;
  }

  /* ---------- Estado ---------- */
  const st = () => { const d = getDraft(); return d && d._split; };
  function fromReceipt(r) {
    return (r.items || []).map(it => ({ n: it.nombre || it.orig || '', p: Math.round(+it.total || 0), q: +it.cant || 1, u: it.unidad || 'un', who: [] }));
  }
  function newState(e) {
    const ppl = S().trip.people.slice();
    const s = { people: ppl, items: [], tip: e && e.cat !== 'bar' ? 0 : 10, payer: '', photo: null, prov: '', fecha: '', nDoc: '', receipt: null, st: 'edit' };
    if (e) {
      const last = (e.photos || [])[(e.photos || []).length - 1];
      s.photo = last || null;
      s.payer = e.payer === '' ? EACH : (e.payer || '');
      if (e.split) {
        Object.assign(s, { people: (e.split.people || ppl).slice(), tip: +e.split.tip || 0 });
        s.items = e.split.items.map(it => ({ n: it.n, p: it.p, q: it.q || 1, u: it.u || 'un', who: (it.who || []).slice() }));
      } else if (e.receipt) {
        s.items = fromReceipt(e.receipt);
        if (e.receipt.propina > 0) s.tip = 0;   // la boleta ya trae la propina: no se suma otra vez
      }
      if (e.receipt) Object.assign(s, { prov: e.receipt.proveedor || '', receipt: e.receipt });
    }
    return s;
  }

  /* ---------- Vista ---------- */
  const chip = (on, label, act, data, c) => `<button class="chip ${on ? 'active' : ''}" style="--c:${c || '#22d3ee'}" data-act="${act}" ${data}>${label}</button>`;
  function resHTML(s) {
    const c = calc(s), payer = s.payer;
    const rows = s.people.filter(p => c.per[p].total > 0.5).map(p => `<div class="sep-res-row"><span><b>${esc(p)}</b><small>${money(c.per[p].sub)}${s.tip ? ` + propina ${money(c.per[p].tip)}` : ''}</small></span><b>${money(c.per[p].rt)}</b></div>`).join('');
    const debts = payer && payer !== EACH && payer !== FUND
      ? s.people.filter(p => p !== payer && c.per[p].total > 0.5).map(p => `<div class="transfer"><span>${esc(p)}</span><span class="arrow">${ic('arrow')}</span><span>${esc(payer)}</span><b>${money(c.per[p].rt)}</b></div>`).join('') : '';
    const sumBol = s.receipt && s.receipt.total ? Math.round(s.items.reduce((a, it) => a + (+it.p || 0), 0) + (+s.receipt.propina || 0)) : 0;
    return `<div class="card sep-res">
        ${rows || '<p class="hint" style="margin:0">Agrega productos y elige quién los consumió.</p>'}
        <div class="sep-tot"><span>Total${s.tip ? ` con propina ${s.tip}%` : ''}</span><b>${money(c.total)}</b></div>
      </div>
      ${c.none ? `<div class="bol-check warn">${ic('alert')} ${money(c.none)} sin asignar: por ahora se reparte entre todos.</div>` : ''}
      ${s.receipt && s.receipt.total && sumBol !== Math.round(s.receipt.total) ? `<div class="bol-check warn">${ic('alert')} Los productos suman ${money(sumBol)} y la boleta dice ${money(s.receipt.total)}.</div>` : ''}
      ${debts ? `<div class="sep-debts"><div class="eyebrow" style="margin:4px 2px 8px">Le devuelven a ${esc(payer)}</div>${debts}</div>` : ''}`;
  }
  function itemHTML(it, i, s) {
    const all = s.people.length && s.people.every(p => it.who.includes(p));
    const split = it.q > 1 && Number.isInteger(it.q) && it.q <= 30;
    return `<div class="sep-item ${it.who.length ? '' : 'none'}" data-i="${i}">
      <div class="sep-item-top">
        <input class="si-n" value="${esc(it.n)}" placeholder="Producto" aria-label="Producto">
        <input class="si-p" inputmode="numeric" value="${fmt(it.p)}" aria-label="Precio">
        <button class="del" data-act="sepDel" data-i="${i}" aria-label="Quitar producto">✕</button>
      </div>
      <div class="chips wrap sep-who">
        ${chip(all, 'Todos', 'sepAll', `data-i="${i}"`, '#3ef08a')}
        ${s.people.map(p => chip(it.who.includes(p), esc(p), 'sepWho', `data-i="${i}" data-p="${esc(p)}"`)).join('')}
        ${split ? `<button class="link sep-unit" data-act="sepUnits" data-i="${i}">Separar en ${it.q}</button>` : ''}
      </div>
    </div>`;
  }
  function html() {
    const s = st(), d = getDraft();
    const head = `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-hot)">${ic('users')}</span><div><h2>Cuentas separadas</h2><p>Cada uno paga lo que consumió</p></div></div>`;
    if (s.st === 'loading') return `${head}<div class="bol-loading"><span class="bol-spin"></span><p>Leyendo la boleta…</p></div>`;
    const photo = s.photo ? `<img class="sep-photo" data-photo="${esc(s.photo)}" alt="Boleta de respaldo" data-act="sepZoom">` : '';
    return `${head}
      <div class="sep-bol">
        ${photo}
        <div class="sep-bol-txt">
          <b>${s.prov ? esc(s.prov) : s.photo ? 'Boleta de respaldo' : 'Boleta'}</b>
          <small>${s.items.length ? `${s.items.length} productos · ${money(s.items.reduce((a, it) => a + (+it.p || 0), 0))}` : 'Lee la boleta con IA o escribe los productos'}</small>
          ${s.photo ? `<button class="btn sm sea" data-act="sepRead">${ic('receipt')} ${s.items.length ? 'Leer de nuevo' : 'Leer boleta con IA'}</button>`
            : `<label class="btn sm sea">${ic('camera')} Foto de la boleta<input type="file" accept="image/*" capture="environment" hidden data-change="sepPhoto"></label>`}
        </div>
      </div>
      ${s.err ? `<div class="bol-check warn">${ic('alert')} ${esc(s.err)}</div>` : ''}
      <div class="field"><span>¿Quiénes estaban?</span><div class="chips wrap">
        ${S().trip.people.concat(s.people.filter(x => !S().trip.people.includes(x))).map(p => chip(s.people.includes(p), esc(p), 'sepPerson', `data-p="${esc(p)}"`, '#8b5cf6')).join('')}
      </div>
      <div class="sep-add"><input id="sepNewP" placeholder="Agregar otra persona" autocomplete="off"><button class="btn sm" data-act="sepAddP">${ic('plus')}</button></div></div>
      <div class="field"><span>¿Qué consumió cada uno? <i class="among-n">toca los nombres</i></span>
        <div id="sepItems">${s.items.map((it, i) => itemHTML(it, i, s)).join('')}</div>
        <button class="btn sm" data-act="sepAddI" style="margin-top:8px">${ic('plus')} Agregar producto</button>
      </div>
      <div class="field"><span>Propina</span><div class="chips wrap">
        ${TIPS.map(t => chip(+s.tip === t, t ? t + '%' : 'Sin propina', 'sepTip', `data-v="${t}"`, '#ffd23f')).join('')}
        <label class="sep-tip-other ${TIPS.includes(+s.tip) ? '' : 'on'}"><input id="sepTipO" inputmode="decimal" value="${TIPS.includes(+s.tip) ? '' : s.tip}" placeholder="Otro">%</label>
      </div></div>
      <div class="field"><span>¿Quién pagó la cuenta?</span><div class="chips wrap">
        ${s.people.map(p => chip(s.payer === p, esc(p), 'sepPayer', `data-v="${esc(p)}"`, '#ff3d8b')).join('')}
        ${chip(s.payer === FUND, FUND, 'sepPayer', `data-v="${FUND}"`, '#8b5cf6')}
        ${chip(s.payer === EACH, 'Cada uno lo suyo', 'sepPayer', `data-v="${EACH}"`, '#94a3b8')}
      </div></div>
      <div class="eyebrow" style="margin:6px 2px 8px">Cuánto paga cada uno</div>
      <div id="sepRes">${resHTML(s)}</div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn sm" data-act="sepCopy">${ic('copy')} Copiar para WhatsApp</button>
      </div>
      <button class="btn primary block shine" style="margin-top:12px" data-act="sepSave">${ic('check')} ${d._kind === 'expense' ? 'Listo, volver al gasto' : 'Guardar como gasto'}</button>
      <button class="btn block" style="margin-top:10px" data-act="sepBack">${d._kind === 'expense' ? 'Volver sin cambios' : 'Cerrar'}</button>`;
  }
  const updateRes = () => { const s = st(), r = $('#sepRes'); if (s && r) r.innerHTML = resHTML(s); };

  /* Ediciones en línea (nombre/precio/propina): se guardan al instante sin redibujar */
  document.addEventListener('input', e => {
    const s = st(), el = e.target; if (!s || s.st !== 'edit') return;
    const box = el.closest('.sep-item');
    if (box) {
      const it = s.items[+box.dataset.i]; if (!it) return;
      if (el.classList.contains('si-n')) it.n = el.value;
      if (el.classList.contains('si-p')) it.p = Math.round(num(el.value));
    } else if (el.id === 'sepTipO') {
      const v = +String(el.value).replace(',', '.');
      s.tip = isFinite(v) && v >= 0 ? Math.min(v, 100) : 0;
      $$('[data-act="sepTip"]').forEach(c => c.classList.toggle('active', +c.dataset.v === s.tip && el.value === ''));
      el.parentElement.classList.toggle('on', el.value !== '');
    } else return;
    updateRes();
  });

  async function readFrom(photoId) {
    const s = st(), d = getDraft(); if (!s) return;
    s.st = 'loading'; s.err = ''; refreshSheet();
    try {
      const r = await BOL.readPhoto(photoId);
      if (getDraft() !== d) return;
      s.items = fromReceipt(r);
      Object.assign(s, { prov: r.proveedor || s.prov, fecha: r.fecha || s.fecha, nDoc: r.nDoc || s.nDoc, receipt: r });
      if (r.propina > 0 || (r.categoria && r.categoria !== 'bar')) s.tip = 0;   // propina sugerida solo en bar/restaurante
      buzz([10, 30, 10]);
    } catch (e) { s.err = e.message || 'No se pudo leer la boleta'; }
    s.st = 'edit'; refreshSheet();
  }
  async function onPhoto(el) {
    const f = el.files[0]; el.value = '';
    const s = st(), d = getDraft(); if (!f || !s) return;
    try {
      const url = await Store.compress(f), id = 'ph_' + Store.uid();
      await Store.photos.put(id, url); photoCache[id] = url;
      if (d.photos) { d.photos.push(id); (d._added = d._added || []).push(id); }
      s.photo = id; readFrom(id);
    } catch (e) { toast('No se pudo leer la imagen'); }
  }

  function text(s) {
    const c = calc(s);
    const lines = s.people.filter(p => c.per[p].total > 0.5).map(p => `• ${p}: ${money(c.per[p].rt)}`);
    return `Cuentas separadas${s.prov ? ' · ' + s.prov : ''}\n${lines.join('\n')}\nTotal${s.tip ? ` (propina ${s.tip}% incluida)` : ''}: ${money(c.total)}` +
      (s.payer && s.payer !== EACH && s.payer !== FUND ? `\nPagó ${s.payer}: cada uno le devuelve su parte` : '');
  }
  const clean = s => ({ people: s.people.slice(), tip: +s.tip || 0, t: Date.now(),
    items: s.items.filter(it => String(it.n).trim() || it.p).map(it => ({ n: String(it.n).trim(), p: Math.round(+it.p || 0), q: it.q || 1, u: it.u || 'un', who: it.who.filter(p => s.people.includes(p)) })) });

  /* Desde Dinero: hoja propia que al final crea un gasto */
  function openStandalone() {
    const mine = { _kind: 'sep', photos: [], _added: [], _split: newState(null) };
    setDraft(mine);
    openSheet(html, () => {
      if (!mine._saved) mine._added.forEach(id => Store.photos.del(id));
      if (getDraft() === mine) setDraft(null);
    });
  }

  const ACT = {
    sepOpen: () => openStandalone(),
    sepFromExpense: () => {
      const d = getDraft(); if (!d || d._kind !== 'expense') return;
      ['exAmount', 'exDesc', 'exDate', 'exDocNum', 'exNotes'].forEach(id => { const el = document.getElementById(id); if (el) d[{ exAmount: 'amount', exDesc: 'desc', exDate: 'date', exDocNum: 'docNum', exNotes: 'notes' }[id]] = el.value; });
      d._split = newState(Object.assign({}, d, { payer: d.payer }));
      if (!d._split.prov && d.desc) d._split.prov = d.desc;
      refreshSheet();
    },
    sepBack: () => { const d = getDraft(); if (d && d._kind === 'expense') { d._split = null; refreshSheet(); } else closeSheet(); },
    sepRead: () => { const s = st(); if (s && s.photo) readFrom(s.photo); },
    sepZoom: el => { el.classList.toggle('big'); },
    sepPerson: el => {
      const s = st(), p = el.dataset.p;
      s.people = s.people.includes(p) ? s.people.filter(x => x !== p) : S().trip.people.filter(x => x === p || s.people.includes(x)).concat(s.people.filter(x => !S().trip.people.includes(x)));
      buzz(6); refreshSheet();
    },
    sepAddP: () => {
      const s = st(), inp = $('#sepNewP'), n = inp && inp.value.trim();
      if (!n) { toast('Escribe el nombre'); if (inp) inp.focus(); return; }
      if (!s.people.includes(n)) s.people.push(n);
      buzz(8); refreshSheet();
    },
    sepAddI: () => { const s = st(); s.items.push({ n: '', p: 0, q: 1, u: 'un', who: [] }); refreshSheet(); const ins = $$('.si-n'); if (ins.length) ins[ins.length - 1].focus(); },
    sepDel: el => { const s = st(); s.items.splice(+el.dataset.i, 1); refreshSheet(); },
    sepWho: el => {
      const s = st(), it = s.items[+el.dataset.i], p = el.dataset.p;
      it.who = it.who.includes(p) ? it.who.filter(x => x !== p) : it.who.concat(p);
      buzz(6); refreshSheet();
    },
    sepAll: el => { const s = st(), it = s.items[+el.dataset.i]; it.who = s.people.every(p => it.who.includes(p)) ? [] : s.people.slice(); buzz(6); refreshSheet(); },
    sepUnits: el => {   // "6 Jugo Mango $25.200" → 6 filas de $4.200 para que cada uno tome el suyo
      const s = st(), i = +el.dataset.i, it = s.items[i], q = it.q, each = Math.round(it.p / q);
      const rows = Array.from({ length: q }, (_, k) => ({ n: it.n, p: k === q - 1 ? it.p - each * (q - 1) : each, q: 1, u: it.u, who: [] }));
      s.items.splice(i, 1, ...rows); buzz(8); refreshSheet();
    },
    sepTip: el => { const s = st(); s.tip = +el.dataset.v; refreshSheet(); },
    sepPayer: el => { const s = st(); s.payer = s.payer === el.dataset.v ? '' : el.dataset.v; buzz(6); refreshSheet(); },
    sepCopy: async () => {
      const t = text(st());
      try { await navigator.clipboard.writeText(t); toast('Copiado para WhatsApp'); }
      catch (e) { if (navigator.share) { try { await navigator.share({ text: t }); } catch (er) { /* cancelado */ } } else toast('No se pudo copiar'); }
    },
    sepSave: () => {
      const d = getDraft(), s = st(), c = calc(s), sp = clean(s);
      if (!sp.items.length) return toast('Agrega al menos un producto');
      if (!s.people.length) return toast('Elige quiénes estaban');
      const total = Math.round(c.total);
      const payer = s.payer === EACH ? '' : s.payer;
      if (d._kind === 'expense') {   // vuelve al gasto con el reparto y el total con propina
        d.split = sp; d.amount = String(total);
        if (s.payer) d.payer = payer;
        if (s.receipt && !d.receipt) d.receipt = s.receipt;
        d._split = null; refreshSheet(); buzz([10, 40, 10]);
        return toast('Listo. Revisa y toca Guardar gasto', 3000);
      }
      if (!s.payer) return toast('Elige quién pagó la cuenta');
      const r = s.receipt;
      const e = {
        id: Store.uid(), amount: total, cat: (r && r.categoria) || 'bar', desc: s.prov || 'Cuentas separadas',
        date: s.fecha || Store.today(), payer, method: (r && PAY_METHODS.includes(r.medioPago) && r.medioPago) || 'Débito',
        docType: r ? 'Boleta' : 'Sin comprobante', docNum: s.nDoc || '', photos: d.photos.slice(), notes: '', created: Date.now(), split: sp
      };
      if (r) e.receipt = { proveedor: r.proveedor || '', razonSocial: r.razonSocial || '', rut: r.rut || '', detalle: r.detalle || '', items: r.items || [], neto: r.neto || 0, iva: r.iva || 0, propina: r.propina || 0, total: r.total || 0, model: r.model || '', t: Date.now() };
      S().expenses.push(e);
      log('money', `anotó cuentas separadas de ${money(total)} (${e.desc})`);
      Store.save(); d._saved = true;
      closeSheet(); render(true); confetti(); buzz([10, 30, 10]);
      toast(`Gasto de ${money(total)} guardado con cuentas separadas`, 3000);
    }
  };

  const linkHTML = () => `<button class="sep-link" data-act="sepOpen">${ic('users')} Cuentas separadas</button>`;
  const expenseButtonHTML = () => { const d = getDraft(); return `<button class="btn block sep-exp-btn" data-act="sepFromExpense">${ic('users')} ${d && d.split ? 'Cuentas separadas · ver y editar' : 'Cuentas separadas: dividir por persona'}</button>`; };
  return { ACT, linkHTML, expenseButtonHTML, html, onPhoto, shares, calc };
}
