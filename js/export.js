/* Utilidades de formato + exportación PNG / PDF / CSV */
(function () {
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function money(n, cur) {
    cur = cur || (window.Store && Store.state.trip.currency) || 'CLP';
    const dec = ['CLP', 'ARS', 'COP', 'PYG'].includes(cur) ? 0 : 2;
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: cur, maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n || 0);
    } catch (e) {
      return '$' + Math.round(n || 0).toLocaleString('es-CL');
    }
  }
  const parseDate = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const dmy = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}-${m}-${y}`; };
  const longDate = s => { const d = parseDate(s); return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`; };
  /* Quita emojis (las fuentes del PDF no los soportan) */
  const plain = s => String(s || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/—|–/g, '-').trim();
  /* Cantidades de recetas: 1250 g → "1,3 kg", 2.4 lata → "3 latas" */
  const UNIT_NAMES = { un: ['un', 'un'], lata: ['lata', 'latas'], pq: ['paquete', 'paquetes'], fr: ['frasco', 'frascos'], bot: ['botella', 'botellas'], bolsa: ['bolsa', 'bolsas'] };
  const num1 = x => (Math.round(x * 10) / 10).toLocaleString('es-CL');
  function amt(n, u) {
    if (!u) return '';
    if (u === 'g') return n >= 1000 ? num1(n / 1000) + ' kg' : Math.ceil(n / 10) * 10 + ' g';
    if (u === 'ml') return n >= 1000 ? num1(n / 1000) + ' L' : Math.ceil(n / 10) * 10 + ' ml';
    const c = Math.max(1, Math.ceil(n - 0.15)), nm = UNIT_NAMES[u] || [u, u];
    return `${c} ${c === 1 ? nm[0] : nm[1]}`;
  }
  /* Responsables del viaje (compatibilidad con la versión que tenía uno solo) */
  const resps = t => {
    const list = Array.isArray(t.responsibles) ? t.responsibles.filter(r => r && r.name) : [];
    return list.length ? list : (t.responsible ? [{ name: t.responsible, rut: t.rut || '' }] : []);
  };
  const qtyText = r => r.u ? amt(r.n, r.u) + (r.q > 1 ? ` x${r.q}` : '') : 'x' + r.q;
  const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'viaje';

  /* Entrega un archivo: compartir (si se pide y el equipo puede) o descargar */
  async function deliver(blob, filename, share) {
    if (share && navigator.canShare) {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: filename }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancel'; }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  }

  /* Agrupa la selección del súper por categoría, en el orden del catálogo */
  function groupedList() {
    const sel = Store.state.shop.sel;
    return CATALOG.map(cat => ({
      cat,
      rows: Object.values(sel).filter(r => r.c === cat.id).sort((a, b) => a.i.localeCompare(b.i, 'es'))
    })).filter(g => g.rows.length);
  }

  /* Marca de los documentos: logo de Viajapp, el de la institución/empresa (trip.brand.logo) o ninguno */
  const brandOf = () => { const b = Store.state.trip.brand || {}; return b.mode === 'custom' && b.logo ? { mode: 'custom', logo: b.logo } : { mode: b.mode === 'none' || b.mode === 'custom' ? 'none' : 'viajapp' }; };
  const brandSign = () => { const t = Store.state.trip; return brandOf().mode === 'viajapp' ? 'Viajapp' : plain(t.entity); };

  /* ---------- Lista del súper → PNG ---------- */
  async function listPNG(share) {
    const groups = groupedList();
    const trip = Store.state.trip, brand = brandOf();
    const total = groups.reduce((s, g) => s + g.rows.length, 0);
    const cols = [[], []], weight = [0, 0];
    groups.forEach(g => { const k = weight[0] <= weight[1] ? 0 : 1; cols[k].push(g); weight[k] += g.rows.length + 2; });

    const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
    const groupHTML = g => `
      <div style="background:#ffffff;border:2px solid #dbe8f5;border-radius:24px;padding:20px 24px 10px;margin-bottom:22px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
          <div style="width:52px;height:52px;border-radius:16px;background:${rgba(g.cat.color, .18)};text-align:center;font-size:30px;line-height:52px">${g.cat.emoji}</div>
          <div style="font-family:'Plus Jakarta Sans',Inter,sans-serif;font-size:27px;font-weight:800;line-height:52px;color:#0f2742">${esc(g.cat.name)}</div>
        </div>
        ${g.rows.map(r => `
          <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-top:2px solid #edf3fa;font-size:23px;line-height:32px;color:#0f2742">
            <div style="width:30px;height:30px;border-radius:9px;flex:none;box-sizing:border-box;border:3px solid ${r.done ? '#0284c7' : '#9fc3e3'};background:${r.done ? '#0284c7' : '#ffffff'};color:#ffffff;font-size:20px;line-height:24px;text-align:center;font-weight:900">${r.done ? '✓' : ''}</div>
            <div style="flex:1;${r.done ? 'text-decoration:line-through;opacity:.5' : ''}"><b>${esc(r.i)}</b>${r.v ? ` <span style="color:#5b7a99">· ${esc(r.v)}</span>` : ''}</div>
            <div style="font-weight:800;color:#0369a1;font-size:22px;white-space:nowrap">${esc(qtyText(r))}</div>
          </div>`).join('')}
      </div>`;

    const stage = document.getElementById('exportStage');
    stage.innerHTML = `
      <div id="pngNode" style="width:1080px;padding:0 0 36px;font-family:Inter,system-ui,sans-serif;background:#f2f8fd;color:#0f2742">
        <div style="height:14px;background:linear-gradient(90deg,#38bdf8,#0284c7 55%,#6366f1)"></div>
        <div style="padding:44px 48px 0">
          <div style="display:flex;align-items:center;gap:24px;margin-bottom:34px">
            <div style="flex:1">
              <div style="font-size:24px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#0284c7">${esc(trip.name)}</div>
              <div style="font-family:'Plus Jakarta Sans',Inter,sans-serif;font-size:72px;font-weight:800;line-height:1.15;margin-top:8px;color:#0f2742">Lista del súper</div>
              <div style="font-size:25px;font-weight:600;margin-top:12px;color:#5b7a99">${total} productos · ${longDate(Store.today())}</div>
            </div>
            ${brand.mode === 'none' ? '' : brand.mode === 'custom'
              ? `<img src="${brand.logo}" alt="" style="max-width:260px;max-height:170px;flex:none;object-fit:contain">`
              : '<img src="icons/logo-badge.png" alt="" style="width:180px;height:180px;flex:none">'}
          </div>
          <div style="display:flex;gap:22px;align-items:flex-start">
            <div style="flex:1">${cols[0].map(groupHTML).join('')}</div>
            <div style="flex:1">${cols[1].map(groupHTML).join('')}</div>
          </div>
          ${brand.mode === 'viajapp' ? '<div style="text-align:center;color:#5b7a99;font-size:20px;font-weight:600;margin-top:6px">Hecho con Viajapp</div>' : ''}
        </div>
      </div>`;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvas = await html2canvas(stage.firstElementChild, { scale: 1, backgroundColor: null, useCORS: true, logging: false });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      return deliver(blob, `lista-super-${slug(trip.name)}.png`, share);
    } finally {
      stage.innerHTML = '';
    }
  }

  /* ---------- Cabecera común de PDFs ---------- */
  let VIAJAPP_LOGO = null, LOGO = '';
  async function loadLogo() {
    const b = brandOf();
    if (b.mode === 'custom') return (LOGO = b.logo);
    if (b.mode === 'none') return (LOGO = '');
    if (VIAJAPP_LOGO === null) {
      try {
        const blob = await (await fetch('icons/logo-badge.png')).blob();
        VIAJAPP_LOGO = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
      } catch (e) { VIAJAPP_LOGO = ''; }
    }
    return (LOGO = VIAJAPP_LOGO);
  }
  /* Paleta clara y formal de los documentos (celeste + azul marino) */
  const NAVY = [15, 39, 66], MUTED = [91, 122, 153], LINE = [219, 232, 245], ALT = [242, 248, 253], SKY = [3, 105, 161];
  const tint = (h, k) => hex(h).map(v => Math.round(255 - (255 - v) * k));
  function pdfHeader(doc, title, subtitle) {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(...hex('#38bdf8')); doc.rect(0, 0, W * 0.5, 2.2, 'F');
    doc.setFillColor(...hex('#0284c7')); doc.rect(W * 0.5, 0, W * 0.3, 2.2, 'F');
    doc.setFillColor(...hex('#6366f1')); doc.rect(W * 0.8, 0, W * 0.2, 2.2, 'F');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(title, 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...MUTED); doc.text(subtitle, 14, 25);
    let lx = W - 14;
    if (LOGO) {   // cabe en una caja de 42 × 28 mm, alineado a la derecha (logos anchos de instituciones también)
      const pr = doc.getImageProperties(LOGO), k = Math.min(42 / pr.width, 28 / pr.height), w = pr.width * k, h = pr.height * k;
      doc.addImage(LOGO, /png/i.test(LOGO.slice(0, 30)) ? 'PNG' : 'JPEG', W - 9 - w, 3 + (28 - h) / 2, w, h, 'doc-logo-' + LOGO.length, 'FAST');
      lx = W - 12 - w;
    }
    doc.setFontSize(9); doc.text('Emitido: ' + dmy(Store.today()), lx, 16, { align: 'right' });
    doc.setDrawColor(...LINE); doc.setLineWidth(0.5); doc.line(14, 35, W - 14, 35);
    doc.setTextColor(...NAVY);
    return 46;
  }
  function pdfFooters(doc) {
    const n = doc.internal.getNumberOfPages();
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text(`Página ${i} de ${n}`, W - 14, H - 8, { align: 'right' });
      doc.text([plain(Store.state.trip.name), brandSign()].filter(Boolean).join(' · '), 14, H - 8);
    }
  }
  const newPDF = () => new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
  const pdfBlob = doc => doc.output('blob');

  /* ---------- Lista del súper → PDF ---------- */
  async function listPDF(share) {
    await loadLogo();
    const trip = Store.state.trip;
    const groups = groupedList();
    const doc = newPDF();
    const total = groups.reduce((s, g) => s + g.rows.length, 0);
    let y = pdfHeader(doc, 'Lista del supermercado', `${plain(trip.name)} · ${total} productos`);
    const body = [];
    groups.forEach(g => {
      body.push([{ content: plain(g.cat.name).toUpperCase(), colSpan: 4, styles: { fillColor: tint(g.cat.color, .2), textColor: NAVY, fontStyle: 'bold', fontSize: 10 } }]);
      g.rows.forEach(r => body.push({ done: r.done, cells: ['', plain(r.i), plain(r.v) || '-', qtyText(r)] }));
    });
    doc.autoTable({
      startY: y,
      head: [['', 'Producto', 'Variante', 'Cant.']],
      body: body.map(r => r.cells || r),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2.6, lineColor: LINE, textColor: NAVY },
      headStyles: { fillColor: NAVY, textColor: 255 },
      columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' } },
      didDrawCell: d => {
        if (d.section !== 'body' || d.column.index !== 0) return;
        const src = body[d.row.index];
        if (!src || !src.cells) return;
        const s = 4.4, x = d.cell.x + (d.cell.width - s) / 2, yy = d.cell.y + (d.cell.height - s) / 2;
        doc.setDrawColor(...SKY); doc.setLineWidth(0.4); doc.roundedRect(x, yy, s, s, 0.8, 0.8);
        if (src.done) { doc.setDrawColor(34, 160, 90); doc.setLineWidth(0.7); doc.line(x + 0.9, yy + 2.3, x + 1.9, yy + 3.4); doc.line(x + 1.9, yy + 3.4, x + 3.7, yy + 1); }
      },
      margin: { left: 14, right: 14, bottom: 16 }
    });
    pdfFooters(doc);
    return deliver(pdfBlob(doc), `lista-super-${slug(trip.name)}.pdf`, share);
  }

  /* ---------- Carta financiera / rendición de gastos → PDF ---------- */
  function catOf(id) { return EXPENSE_CATS.find(c => c.id === id) || EXPENSE_CATS[EXPENSE_CATS.length - 1]; }
  function sortedExpenses() {
    return [...Store.state.expenses].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  }

  async function financePDF(share) {
    await loadLogo();
    const S = Store.state, trip = S.trip, cur = trip.currency;
    const exps = sortedExpenses();
    const total = exps.reduce((s, e) => s + (+e.amount || 0), 0);
    const budget = +trip.budget || 0;
    const diff = budget - total;
    const doc = newPDF();
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    let y = pdfHeader(doc, 'RENDICIÓN DE GASTOS', 'Carta financiera · ' + plain(trip.name));

    // Datos generales
    const rs = resps(trip);
    const respRows = rs.length
      ? rs.map((r, i) => [i ? '' : (rs.length > 1 ? 'Responsables' : 'Responsable'), plain(r.name) + (r.rut ? ' · RUT ' + plain(r.rut) : '')])
      : [['Responsable', '-']];
    const info = [
      ['Entidad', plain(trip.entity) || '-'],
      ...respRows,
      ['Período', `${dmy(trip.start)} al ${dmy(trip.end)}`],
      ['Participantes', (trip.people || []).map(plain).join(', ') || '-']
    ];
    doc.autoTable({
      startY: y, body: info, theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1.4, textColor: NAVY },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 34, textColor: SKY } },
      margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 6;

    // Carta
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
    const saludo = trip.entity ? `Señores ${plain(trip.entity)}:` : 'De mi consideración:';
    const names = rs.map(r => plain(r.name));
    const quien = names.length ? (names.length > 1 ? names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1] : names[0]) : 'quien suscribe';
    const texto = `Por medio de la presente, ${quien} ${names.length > 1 ? 'rinden' : 'rinde'} cuenta de los fondos asignados para el viaje "${plain(trip.name)}", realizado entre el ${longDate(trip.start)} y el ${longDate(trip.end)}. A continuación se detalla el uso de los recursos, con un total de ${exps.length} gasto(s) registrado(s), adjuntando en el anexo los comprobantes correspondientes.`;
    doc.text(saludo, 14, y); y += 6;
    const lines = doc.splitTextToSize(texto, W - 28);
    doc.text(lines, 14, y); y += lines.length * 5 + 4;

    // Tarjetas de resumen
    const boxes = [
      ['FONDOS ASIGNADOS', money(budget, cur), '#4f46e5'],
      ['TOTAL RENDIDO', money(total, cur), '#0284c7'],
      [diff >= 0 ? 'SALDO A DEVOLVER' : 'MONTO A REEMBOLSAR', money(Math.abs(diff), cur), diff >= 0 ? '#15803d' : '#c2410c']
    ];
    const bw = (W - 28 - 8) / 3;
    boxes.forEach((b, i) => {
      const x = 14 + i * (bw + 4);
      doc.setFillColor(...tint(b[2], .1)); doc.setDrawColor(...tint(b[2], .35)); doc.setLineWidth(0.3); doc.roundedRect(x, y, bw, 20, 3, 3, 'FD');
      doc.setTextColor(...hex(b[2])); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.text(b[0], x + 4, y + 7);
      doc.setFontSize(13); doc.setTextColor(...NAVY); doc.text(b[1], x + 4, y + 15);
    });
    doc.setTextColor(...NAVY);
    y += 28;

    // Detalle
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Detalle de gastos', 14, y); y += 2;
    doc.autoTable({
      startY: y,
      head: [['N°', 'Fecha', 'Categoría', 'Detalle', 'Documento', 'Pagó', 'Monto']],
      body: exps.map((e, i) => [
        i + 1, dmy(e.date), plain(catOf(e.cat).name), plain(e.desc) || '-',
        plain([e.docType, e.docNum].filter(Boolean).join(' ')) || '-',
        plain(e.payer) || '-', money(e.amount, cur)
      ]),
      foot: [[{ content: 'TOTAL', colSpan: 6, styles: { halign: 'right' } }, money(total, cur)]],
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2, textColor: NAVY, overflow: 'linebreak' },
      headStyles: { fillColor: NAVY, textColor: 255 },
      footStyles: { fillColor: hex('#0284c7'), textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: ALT },
      columnStyles: { 0: { cellWidth: 9, halign: 'center' }, 1: { cellWidth: 20 }, 6: { halign: 'right', cellWidth: 28, fontStyle: 'bold' } },
      didParseCell: d => { if (d.section === 'head' && d.column.index === 6) d.cell.styles.halign = 'right'; },
      margin: { left: 14, right: 14, bottom: 16 }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Resumen por categoría
    const byCat = EXPENSE_CATS.map(c => {
      const list = exps.filter(e => e.cat === c.id);
      return [plain(c.name), list.length, list.reduce((s, e) => s + (+e.amount || 0), 0)];
    }).filter(r => r[1]);
    if (byCat.length) {
      if (y > H - 50) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Resumen por categoría', 14, y); y += 2;
      doc.autoTable({
        startY: y,
        head: [['Categoría', 'N° gastos', 'Monto', '%']],
        body: byCat.map(r => [r[0], r[1], money(r[2], cur), total ? (r[2] / total * 100).toFixed(1) + '%' : '0%']),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, textColor: NAVY, lineColor: LINE },
        headStyles: { fillColor: NAVY, textColor: 255 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14, bottom: 16 }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Firmas: una por responsable + la entidad, en dos columnas
    const signers = (rs.length ? rs : [{ name: 'Responsable', rut: '' }])
      .map(r => [plain(r.name), 'Firma responsable' + (r.rut ? ' · ' + plain(r.rut) : '')])
      .concat([[plain(trip.entity) || 'Entidad', 'Recibido conforme']]);
    const rowsN = Math.ceil(signers.length / 2), rowH = 26, need = rowsN * rowH;
    if (y + 14 + need > H - 18) { doc.addPage(); y = 30; }
    y = Math.max(y + 14, H - 20 - need);
    const fw = 70;
    signers.forEach((s, i) => {
      const cx = i % 2 ? W - 14 - fw / 2 : 14 + fw / 2, sy = y + Math.floor(i / 2) * rowH;
      doc.setDrawColor(...NAVY); doc.setLineWidth(0.3); doc.line(cx - fw / 2, sy, cx + fw / 2, sy);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.text(s[0], cx, sy + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text(s[1], cx, sy + 10, { align: 'center' });
    });

    // Anexo de comprobantes
    const withPhotos = exps.map((e, i) => ({ e, n: i + 1 })).filter(x => (x.e.photos || []).length);
    if (withPhotos.length) {
      let slot = 2; // fuerza página nueva
      const slotH = (H - 46 - 20) / 2;
      for (const { e, n } of withPhotos) {
        for (let p = 0; p < e.photos.length; p++) {
          const url = await Store.photos.get(e.photos[p]);
          if (!url) continue;
          if (slot >= 2) { doc.addPage(); pdfHeader(doc, 'ANEXO · COMPROBANTES', plain(trip.name)); slot = 0; }
          const top = 44 + slot * (slotH + 4);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...SKY);
          const cap = `Comprobante N° ${n}${e.photos.length > 1 ? ` (${p + 1}/${e.photos.length})` : ''} · ${dmy(e.date)} · ${money(e.amount, cur)}`;
          doc.text(cap, 14, top);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(...NAVY); doc.setFontSize(9);
          doc.text(doc.splitTextToSize(`${plain(catOf(e.cat).name)} - ${plain(e.desc) || ''}`, W - 28)[0], 14, top + 5);
          const props = doc.getImageProperties(url);
          const maxW = W - 28, maxH = slotH - 12;
          const k = Math.min(maxW / props.width, maxH / props.height);
          const iw = props.width * k, ih = props.height * k;
          doc.addImage(url, 'JPEG', 14 + (maxW - iw) / 2, top + 8, iw, ih, undefined, 'FAST');
          doc.setDrawColor(...LINE); doc.rect(14 + (maxW - iw) / 2, top + 8, iw, ih);
          slot++;
        }
      }
    }

    pdfFooters(doc);
    return deliver(pdfBlob(doc), `carta-financiera-${slug(trip.name)}.pdf`, share);
  }

  /* ---------- Gastos → CSV (Excel) ---------- */
  function financeCSV(share) {
    const exps = sortedExpenses();
    const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [['N°', 'Fecha', 'Categoría', 'Detalle', 'Tipo documento', 'N° documento', 'Pagado por', 'Repartido entre', 'Medio de pago', 'Monto', 'Notas']];
    exps.forEach((e, i) => rows.push([i + 1, dmy(e.date), plain(catOf(e.cat).name), e.desc, e.docType, e.docNum, e.payer,
      (e.among || []).length ? e.among.join(', ') : 'Todos', e.method, e.amount, e.notes]));
    const csv = '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n');
    return deliver(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `gastos-${slug(Store.state.trip.name)}.csv`, share);
  }

  /* ---------- Agenda → PDF ---------- */
  async function agendaPDF(share) {
    await loadLogo();
    const S = Store.state;
    const evs = [...S.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const doc = newPDF();
    const y = pdfHeader(doc, 'Agenda del viaje', `${plain(S.trip.name)} · ${evs.length} actividades`);
    const body = [];
    let last = '';
    evs.forEach(e => {
      if (e.date !== last) {
        last = e.date;
        const d = parseDate(e.date);
        const label = d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        body.push([{ content: label.toUpperCase(), colSpan: 5, styles: { fillColor: tint('#0ea5e9', .15), textColor: NAVY, fontStyle: 'bold' } }]);
      }
      const t = EVENT_TYPES.find(x => x.id === e.type) || EVENT_TYPES[0];
      body.push([e.time || '-', plain(t.name), plain(e.title) || '-', plain(e.place) || '-', plain(e.who) || '-']);
    });
    doc.autoTable({
      startY: y,
      head: [['Hora', 'Tipo', 'Detalle', 'Lugar', 'Encargado']],
      body,
      theme: 'grid',
      styles: { fontSize: 9.5, cellPadding: 2.4, textColor: NAVY, lineColor: LINE },
      headStyles: { fillColor: NAVY, textColor: 255 },
      columnStyles: { 0: { cellWidth: 16, fontStyle: 'bold' }, 1: { cellWidth: 24 } },
      margin: { left: 14, right: 14, bottom: 16 }
    });
    pdfFooters(doc);
    return deliver(pdfBlob(doc), `agenda-${slug(S.trip.name)}.pdf`, share);
  }

  window.U = { resps, amt, qtyText, money, parseDate, dmy, longDate, esc, plain, slug, MONTHS };
  window.Exporter = { groupedList, listPNG, listPDF, financePDF, financeCSV, agendaPDF, deliver };
})();
