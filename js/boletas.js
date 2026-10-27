/* Analizador de boletas (módulo aparte, solo AGREGA a la app).
   - En el formulario del gasto: botón "Leer boleta" → foto → IA (Cloudflare Worker + Gemini) → hoja "Revisa tu boleta"
     con tabla editable (nombre, cantidad, precio) y aviso si la suma no cuadra → "Usar estos datos" completa el gasto
     y guarda los productos en el gasto (campo opcional `receipt`).
   - En Dinero: "Planilla de gastos" en Excel (.xlsx) o Word (.docx), a elección.
   app.js le pasa sus herramientas y recibe { ACT, buttonHTML, reviewHTML, onPhoto, planillaLink }. */
function BoletaModule(A) {
  const { S, esc, ic, toast, money, buzz, confetti, refreshSheet, openSheet, closeSheet, $, $$, getDraft, photoCache } = A;
  const WORKER = window.BOLETAS_URL || 'https://viajapp-boletas.viajapp.workers.dev';
  const fmt = n => Math.round(+n || 0).toLocaleString('es-CL');
  const num = v => { const s = String(v == null ? '' : v).trim().replace(/\s/g, ''); if (!s) return 0; const x = /,\d{1,3}$/.test(s) && !/\.\d{3},/.test(s) ? +s.replace(/\./g, '').replace(',', '.') : +s.replace(/\./g, '').replace(',', '.'); return isFinite(x) ? x : 0; };
  const qty = v => { const x = +String(v).replace(',', '.'); return isFinite(x) && x > 0 ? x : 0; };

  /* ---------- Llamada al intermediario ---------- */
  async function read(dataUrl) {
    const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
    if (!m) throw new Error('No se encontró la foto');
    if (!navigator.onLine) throw new Error('Necesitas internet para leer la boleta');
    const token = await Sync.idToken();
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 90000);
    try {
      const r = await fetch(WORKER + '/leer', {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ image: m[2], mime: m[1] })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'No se pudo leer la boleta');
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('La lectura tardó demasiado. Intenta de nuevo.');
      throw e;
    } finally { clearTimeout(t); }
  }

  /* Copia lo escrito en el formulario al borrador antes de cambiar de vista (para no perderlo) */
  function keepForm(d) {
    const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
    [['amount', 'exAmount'], ['desc', 'exDesc'], ['date', 'exDate'], ['docNum', 'exDocNum'], ['notes', 'exNotes']].forEach(([k, id]) => { const x = v(id); if (x !== null) d[k] = x; });
  }

  async function start(photoId) {
    const d = getDraft(); if (!d || d._kind !== 'expense') return;
    keepForm(d);
    d._bol = { st: 'loading', photo: photoId };
    refreshSheet();
    try {
      const url = photoCache[photoId] || await Store.photos.get(photoId);
      const j = await read(url);
      if (getDraft() !== d || !d._bol) return;   // el usuario cerró o volvió mientras tanto
      d._bol = { st: 'ok', photo: photoId, data: j.data, model: j.model, fresh: true };
      buzz([10, 30, 10]);
      if (j.data.legible === false) toast('La foto se ve poco clara: revisa bien los datos', 3500);
    } catch (e) {
      if (getDraft() !== d || !d._bol) return;
      d._bol = { st: 'error', photo: photoId, err: e.message };
    }
    refreshSheet();
  }

  /* ---------- Vistas ---------- */
  function buttonHTML() {
    const d = getDraft(), r = d && d.receipt;
    const last = d && d.photos && d.photos[d.photos.length - 1];
    return `<div class="bol-box">
      ${last ? `<button class="btn sea block" data-act="bolRead" data-id="${esc(last)}">${ic('receipt')} Leer boleta con IA</button>`
        : `<label class="btn sea block">${ic('camera')} Foto y leer boleta con IA<input type="file" accept="image/*" capture="environment" hidden data-change="bolPhoto"></label>`}
      <p class="hint" style="margin:6px 2px 0">${r ? `${ic('check')} Boleta leída: ${r.items.length} productos. <button class="link" data-act="bolEdit">Ver y editar</button>`
        : 'La IA anota el monto, la fecha, el N° y cada producto. Después lo puedes corregir.'}</p>
    </div>`;
  }

  function checkHTML(b) {
    const sum = b.items.reduce((s, it) => s + (+it.total || 0), 0) + (+b.propina || 0), diff = Math.round((+b.total || 0) - sum);
    return diff === 0
      ? `<div class="bol-check ok">${ic('check')} La suma de los productos cuadra con el total</div>`
      : `<div class="bol-check warn">${ic('alert')} Los productos suman ${money(sum)} y el total dice ${money(b.total)} (diferencia ${money(Math.abs(diff))}). Revisa los precios.</div>`;
  }
  function rowHTML(it, i) {
    return `<div class="bol-row" data-i="${i}">
      <div class="br-n"><input class="bi-n" value="${esc(it.nombre)}" placeholder="Producto" aria-label="Producto">
        ${it.orig && it.orig !== it.nombre ? `<small>${esc(it.orig)}</small>` : ''}</div>
      <input class="bi-q" inputmode="decimal" value="${String(it.cant).replace('.', ',')}" aria-label="Cantidad">
      <input class="bi-t" inputmode="numeric" value="${fmt(it.total)}" aria-label="Precio">
      <button class="del" data-act="bolDel" data-i="${i}" aria-label="Quitar producto">✕</button>
    </div>`;
  }
  function reviewHTML() {
    const d = getDraft(), B = d._bol;
    const head = (t, p) => `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-sea)">${ic('receipt')}</span><div><h2>${t}</h2><p>${p}</p></div></div>`;
    if (B.st === 'loading') return `${head('Leyendo tu boleta…', 'Toma unos segundos')}
      <div class="bol-loading"><span class="bol-spin"></span><p>La IA está leyendo los productos y precios.</p></div>
      <button class="btn block" data-act="bolBack">Cancelar</button>`;
    if (B.st === 'error') return `${head('No se pudo leer', 'Puedes intentarlo de nuevo o anotarla a mano')}
      <div class="bol-check warn">${ic('alert')} ${esc(B.err)}</div>
      <button class="btn primary block" data-act="bolRead" data-id="${esc(B.photo)}">Intentar de nuevo</button>
      <button class="btn block" style="margin-top:10px" data-act="bolBack">Volver al gasto</button>`;
    const b = B.data;
    return `${head('Revisa tu boleta', 'Corrige lo que la IA haya leído mal')}
      <div class="field"><span>Local o proveedor</span><input id="bolProv" value="${esc(b.proveedor)}" placeholder="Ej: Unimarc Pucón"></div>
      <div class="field-row">
        <label class="field"><span>Fecha</span><input type="date" id="bolFecha" value="${esc(b.fecha)}"></label>
        <label class="field"><span>N° documento</span><input id="bolDoc" value="${esc(b.nDoc)}"></label>
      </div>
      <div id="bolCheck">${checkHTML(b)}</div>
      <div class="bol-th"><span>Producto</span><span>Cant.</span><span>Precio</span><span></span></div>
      <div id="bolRows">${b.items.map(rowHTML).join('')}</div>
      <button class="btn sm" data-act="bolAdd" style="margin-top:8px">${ic('plus')} Agregar producto</button>
      <div class="field-row" style="margin-top:14px">
        <label class="field"><span>Total de la boleta</span><input id="bolTotal" inputmode="numeric" value="${fmt(b.total)}"></label>
        ${b.propina ? `<label class="field"><span>Propina</span><input id="bolTip" inputmode="numeric" value="${fmt(b.propina)}"></label>` : ''}
      </div>
      <button class="btn primary block shine" data-act="bolUse">${ic('check')} Usar estos datos</button>
      <button class="btn block" style="margin-top:10px" data-act="bolBack">Volver sin cambios</button>`;
  }

  /* Ediciones en la tabla: se guardan al instante y se recalcula el aviso sin redibujar (no pierde el foco) */
  document.addEventListener('input', e => {
    const d = getDraft(), el = e.target;
    if (!d || !d._bol || d._bol.st !== 'ok') return;
    const b = d._bol.data, row = el.closest('.bol-row');
    if (row) {
      const it = b.items[+row.dataset.i]; if (!it) return;
      if (el.classList.contains('bi-n')) it.nombre = el.value;
      if (el.classList.contains('bi-q')) {
        const q = qty(el.value); if (!q) return;
        it.cant = q;
        if (it.pUnit > 0) { it.total = Math.round(it.pUnit * q); row.querySelector('.bi-t').value = fmt(it.total); }
      }
      if (el.classList.contains('bi-t')) { it.total = Math.round(num(el.value)); it.pUnit = it.cant ? Math.round(it.total / it.cant) : it.total; }
    } else if (el.id === 'bolTotal') b.total = Math.round(num(el.value));
    else if (el.id === 'bolTip') b.propina = Math.round(num(el.value));
    else if (el.id === 'bolProv') b.proveedor = el.value;
    else if (el.id === 'bolFecha') b.fecha = el.value;
    else if (el.id === 'bolDoc') b.nDoc = el.value;
    else return;
    const c = $('#bolCheck'); if (c) c.innerHTML = checkHTML(b);
  });

  async function onPhoto(el) {
    const f = el.files[0]; el.value = '';
    const d = getDraft(); if (!f || !d || d._kind !== 'expense') return;
    try {
      const url = await Store.compress(f), id = 'ph_' + Store.uid();
      await Store.photos.put(id, url);
      photoCache[id] = url;
      d.photos.push(id); d._added.push(id);   // igual que "Agregar foto": queda como comprobante del gasto
      start(id);
    } catch (e) { toast('No se pudo leer la imagen'); }
  }

  const DOC = t => (DOC_TYPES.includes(t) ? t : /fact/i.test(t) ? 'Factura' : /ticket|voucher/i.test(t) ? 'Ticket / Voucher' : 'Boleta');
  const ACT = {
    bolRead: el => start(el.dataset.id),
    bolBack: () => { const d = getDraft(); if (d) { d._bol = null; refreshSheet(); } },
    bolEdit: () => { const d = getDraft(); if (!d || !d.receipt) return; keepForm(d); d._bol = { st: 'ok', data: JSON.parse(JSON.stringify(d.receipt)) }; refreshSheet(); },
    bolDel: el => { const d = getDraft(); d._bol.data.items.splice(+el.dataset.i, 1); refreshSheet(); },
    bolAdd: () => {
      const d = getDraft(); d._bol.data.items.push({ orig: '', nombre: '', cant: 1, unidad: 'un', pUnit: 0, total: 0 });
      refreshSheet(); const ins = $$('.bi-n'); if (ins.length) ins[ins.length - 1].focus();
    },
    bolUse: () => {
      const d = getDraft(), B = d._bol, b = B.data;
      b.items = b.items.filter(it => (it.nombre || '').trim() || it.total);
      if (!(b.total > 0)) b.total = b.items.reduce((s, it) => s + (+it.total || 0), 0) + (+b.propina || 0);
      if (b.total > 0) d.amount = String(b.total);
      if (b.fecha) d.date = b.fecha;
      if (b.nDoc) d.docNum = b.nDoc;
      d.docType = DOC(b.tipoDoc || 'Boleta');
      if (B.fresh) {   // solo en la primera lectura se proponen categoría, descripción y medio de pago
        if (b.categoria && EXPENSE_CATS.some(c => c.id === b.categoria)) d.cat = b.categoria;
        if (!String(d.desc || '').trim()) d.desc = [b.proveedor, b.detalle].filter(Boolean).join(' · ');
        if (PAY_METHODS.includes(b.medioPago)) d.method = b.medioPago;
      }
      d.receipt = {
        proveedor: b.proveedor, razonSocial: b.razonSocial || '', rut: b.rut || '', detalle: b.detalle || '',
        items: b.items.map(it => ({ orig: it.orig || '', nombre: (it.nombre || '').trim(), cant: it.cant, unidad: it.unidad || 'un', pUnit: it.pUnit, total: it.total })),
        neto: b.neto || 0, iva: b.iva || 0, propina: b.propina || 0, total: b.total, model: B.model || (d.receipt && d.receipt.model) || '', t: Date.now()
      };
      d._bol = null;
      refreshSheet(); buzz([10, 40, 10]);
      toast('Datos completados. Revisa y toca Guardar gasto', 3000);
    },

    /* ---------- Planilla de gastos ---------- */
    planilla: () => {
      if (!S().expenses.length) return toast('Aún no hay gastos registrados');
      openSheet(() => `<div class="sheet-title"><span class="st-ico" style="--c:var(--grad-lime)">${ic('sheet')}</span><div><h2>Planilla de gastos</h2><p>Para rendir: un resumen por boleta y el detalle de productos</p></div></div>
        <p class="hint">Elige el formato que te acomode:</p>
        <div class="bol-formats">
          <button class="bol-fmt" data-act="planillaGo" data-k="xlsx"><b>Excel</b><small>Para sumar, filtrar y editar (.xlsx)</small></button>
          <button class="bol-fmt" data-act="planillaGo" data-k="docx"><b>Word</b><small>Para imprimir o enviar (.docx)</small></button>
        </div>
        <p class="hint" style="margin-top:12px">${S().expenses.filter(e => e.receipt).length} de ${S().expenses.length} gastos tienen productos leídos con IA.</p>`);
    },
    planillaGo: async el => {
      if (el.dataset.busy) return; el.dataset.busy = '1'; el.style.opacity = '.6';
      toast('Generando planilla…', 1500);
      try {
        const r = await (el.dataset.k === 'xlsx' ? planillaXLSX() : planillaDOCX());
        toast(r === 'shared' ? 'Compartida' : 'Planilla lista'); closeSheet();
      } catch (e) { console.error(e); toast('No se pudo generar la planilla'); }
      finally { delete el.dataset.busy; el.style.opacity = ''; }
    }
  };

  /* ---------- Datos de la planilla (iguales para Excel y Word) ---------- */
  const catName = id => (EXPENSE_CATS.find(c => c.id === id) || { name: '' }).name;
  function planillaData() {
    const t = S().trip;
    const ex = S().expenses.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.created || 0) - (b.created || 0));
    const detOf = (e, prov) => {   // si la descripción empieza con el local ("Unimarc · Víveres"), no repetirlo
      let s = U.plain(e.desc || (e.receipt && e.receipt.detalle) || catName(e.cat));
      if (prov && s.toLowerCase().startsWith(prov.toLowerCase())) s = s.slice(prov.length).replace(/^\s*[·\-–:]\s*/, '') || s;
      return s;
    };
    const rows = ex.map((e, i) => ({
      n: i + 1, fecha: U.dmy(e.date), prov: (e.receipt && e.receipt.proveedor) || '', det: detOf(e, (e.receipt && e.receipt.proveedor) || ''),
      cat: catName(e.cat), doc: e.docNum || (e.docType === 'Sin comprobante' ? 'S/N' : ''), tipo: e.docType || '', pago: e.payer || '', monto: Math.round(+e.amount || 0), e
    }));
    const det = [];
    rows.forEach(r => (r.e.receipt ? r.e.receipt.items : []).forEach(it => det.push({ n: r.n, fecha: r.fecha, prov: r.prov, prod: it.nombre, orig: it.orig, cant: it.cant, unidad: it.unidad, pUnit: it.pUnit, total: it.total })));
    return {
      t, rows, det, total: rows.reduce((s, r) => s + r.monto, 0),
      title: `Planilla de Detalle de Gastos - ${U.plain(t.name)}`,
      meta: [t.entity ? `Entidad: ${t.entity}` : '', `Fechas: ${U.dmy(t.start)} al ${U.dmy(t.end)}`, `Moneda: ${t.currency || 'CLP'}`].filter(Boolean),
      file: `planilla-gastos-${U.slug(t.name)}`
    };
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src)); document.head.appendChild(s); });
  }

  async function planillaXLSX() {
    if (!window.XLSX) await loadScript('vendor/xlsx.mini.min.js');
    const P = planillaData(), wb = XLSX.utils.book_new();
    const res = [[P.title], ...P.meta.map(m => [m]), [],
      ['N°', 'Fecha', 'Proveedor', 'Detalle general', 'Categoría', 'Tipo doc.', 'N° Doc / Boleta', 'Pagado por', 'Monto'],
      ...P.rows.map(r => [r.n, r.fecha, r.prov, r.det, r.cat, r.tipo, r.doc, r.pago, r.monto]),
      ['', 'TOTAL', '', `Suma de ${P.rows.length} gastos`, '', '', '', '', P.total]];
    const ws = XLSX.utils.aoa_to_sheet(res);
    ws['!cols'] = [6, 12, 26, 38, 18, 14, 16, 16, 14].map(w => ({ wch: w }));
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    const dd = [['N° gasto', 'Fecha', 'Proveedor', 'Producto', 'Como sale en la boleta', 'Cantidad', 'Unidad', 'Precio unitario', 'Total'],
      ...P.det.map(x => [x.n, x.fecha, x.prov, x.prod, x.orig, x.cant, x.unidad, x.pUnit, x.total])];
    if (!P.det.length) dd.push(['', '', '', 'Aún no hay boletas leídas con IA']);
    const wd = XLSX.utils.aoa_to_sheet(dd);
    wd['!cols'] = [9, 12, 24, 34, 34, 10, 8, 15, 12].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wd, 'Detalle de productos');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return Exporter.deliver(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), P.file + '.xlsx');
  }

  /* Word (.docx) armado a mano con JSZip: título, datos, tabla resumen con total y detalle por boleta */
  async function planillaDOCX() {
    if (!window.JSZip) await loadScript('vendor/jszip.min.js');
    const P = planillaData();
    const x = s => U.plain(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.sz ? `<w:sz w:val="${o.sz}"/>` : ''}${o.c ? `<w:color w:val="${o.c}"/>` : ''}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    const par = (t, o = {}) => `<w:p><w:pPr>${o.al ? `<w:jc w:val="${o.al}"/>` : ''}<w:spacing w:after="${o.after == null ? 80 : o.after}"/></w:pPr>${run(t, o)}</w:p>`;
    const cell = (t, w, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}</w:tcPr>${par(String(t), { b: o.b, sz: 18, al: o.al, after: 0, c: o.c })}</w:tc>`;
    const table = (widths, head, body, foot) => `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => `<w:${b} w:val="single" w:sz="4" w:color="BBBBCC"/>`).join('')}</w:tblBorders><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr>
      <w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>
      <w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((h, i) => cell(h, widths[i], { b: true, fill: '2A1B5C', c: 'FFFFFF' })).join('')}</w:tr>
      ${body.map(r => `<w:tr>${r.map((v, i) => cell(v, widths[i], { al: typeof v === 'number' || /^\$/.test(v) ? 'right' : null })).join('')}</w:tr>`).join('')}
      ${foot ? `<w:tr>${foot.map((v, i) => cell(v, widths[i], { b: true, fill: 'EDE9FB', al: i === foot.length - 1 ? 'right' : null })).join('')}</w:tr>` : ''}</w:tbl>`;
    const $m = n => money(n);
    let body = par(P.title, { b: true, sz: 34, after: 120 }) + P.meta.map(m => par(m, { sz: 20 })).join('') + par('', {}) +
      par(`Resumen de gastos (${P.rows.length} documentos)`, { b: true, sz: 26, after: 120 }) +
      table([500, 1100, 1900, 2700, 1300, 1500], ['N°', 'Fecha', 'Proveedor', 'Detalle general', 'N° Doc / Boleta', 'Monto'],
        P.rows.map(r => [String(r.n), r.fecha, r.prov || '-', r.det, r.doc || '-', $m(r.monto)]),
        ['', 'TOTAL', '', `Suma de ${P.rows.length} gastos`, '', $m(P.total)]);
    const withItems = P.rows.filter(r => r.e.receipt && r.e.receipt.items.length);
    if (withItems.length) {
      body += par('', {}) + par('Detalle de productos por boleta', { b: true, sz: 26, after: 120 });
      withItems.forEach(r => {
        body += par(`${r.n}. ${r.prov || r.det} · ${r.fecha}${r.doc ? ' · N° ' + r.doc : ''} · ${$m(r.monto)}`, { b: true, sz: 20, after: 60 }) +
          table([4300, 1100, 1700, 1900], ['Producto', 'Cantidad', 'Precio unitario', 'Total'],
            r.e.receipt.items.map(it => [it.nombre, String(it.cant).replace('.', ',') + (it.unidad !== 'un' ? ' ' + it.unidad : ''), $m(it.pUnit), $m(it.total)])) + par('', {});
      });
    }
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1134" w:right="1000" w:bottom="1134" w:left="1000" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', doc);
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    return Exporter.deliver(blob, P.file + '.docx');
  }

  const planillaLink = () => `<button class="link bol-plink" data-act="planilla">${ic('sheet')} Planilla de gastos (Excel o Word)</button>`;
  /* Leer una foto ya guardada y devolver los datos (lo usa Cuentas separadas) */
  const readPhoto = async id => (await read(photoCache[id] || await Store.photos.get(id))).data;
  return { ACT, buttonHTML, reviewHTML, onPhoto, planillaLink, readPhoto };
}
