/* Clima del destino (Open-Meteo: gratis, sin clave ni cuenta).
   - Botón en la tarjeta del viaje (pill) → hoja con el pronóstico de los días del viaje.
   - Si el viaje empieza en más de 16 días (el pronóstico aún no existe) muestra cómo estuvo el clima
     en esas mismas fechas el año pasado.
   - Guarda la última consulta en `viajapp-wx` (por destino): sirve sin internet. */
window.WeatherModule = function (A) {
  const { S, esc, ic, openSheet, refreshSheet, toast, log } = A;
  const KEY = 'viajapp-wx', FRESH = 3 * 3600e3, DAYS = 16;
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { mem = {}; }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* almacenamiento lleno */ } };
  const norm = s => (s || '').trim().toLowerCase();
  const place = () => (S().trip.place || '').trim();
  const entry = () => mem[norm(place())];

  /* Fechas "AAAA-MM-DD" en hora local */
  const toD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (s, n) => { const d = toD(s); d.setDate(d.getDate() + n); return iso(d); };
  const between = (a, b) => Math.round((toD(b) - toD(a)) / 864e5);
  const yearAgo = s => { const d = toD(s); d.setFullYear(d.getFullYear() - 1); return iso(d); };
  const dayName = s => { const t = toD(s).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }); return t.charAt(0).toUpperCase() + t.slice(1); };

  /* Códigos del tiempo (WMO) → texto e ícono */
  function wmo(c) {
    if (c === 0) return ['Despejado', 'sun'];
    if (c === 1) return ['Mayormente despejado', 'csun'];
    if (c === 2) return ['Parcialmente nublado', 'csun'];
    if (c === 3) return ['Nublado', 'cloud'];
    if (c === 45 || c === 48) return ['Niebla', 'fog'];
    if (c >= 51 && c <= 57) return ['Llovizna', 'rain'];
    if (c >= 61 && c <= 67) return [c >= 65 ? 'Lluvia fuerte' : 'Lluvia', 'rain'];
    if (c >= 71 && c <= 77) return ['Nieve', 'snow'];
    if (c >= 80 && c <= 82) return ['Chubascos', 'rain'];
    if (c === 85 || c === 86) return ['Chubascos de nieve', 'snow'];
    if (c >= 95) return ['Tormenta', 'storm'];
    return ['Sin datos', 'cloud'];
  }

  /* Qué días mostrar: pronóstico (hasta 16 días), año pasado (viaje lejano) o próximos días (viaje terminado) */
  function plan() {
    const t = S().trip, today = Store.today(), lastFc = addDays(today, DAYS - 1);
    let from = t.start || today;
    const to = t.end && t.end >= from ? t.end : from;
    if (to < today) return { mode: 'over', from: today, to: addDays(today, 6) };
    if (from < today) from = today;
    if (from <= lastFc) return { mode: 'fc', from, to: to > lastFc ? lastFc : to, cut: to > lastFc, lastFc };
    const pto = between(from, to) > 13 ? addDays(from, 13) : to;
    return { mode: 'past', from, to: pto, pfrom: yearAgo(from), pto: yearAgo(pto), cut: pto !== to };
  }

  async function getJSON(url) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 10000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('http');
      return await r.json();
    } finally { clearTimeout(tm); }
  }
  async function geocode(q) {
    const [name, ...rest] = q.split(','), hint = norm(rest.join(' '));
    const r = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name.trim())}&count=10&language=es&format=json`);
    const list = r.results || [];
    if (!list.length) throw new Error('nf');
    const where = x => norm([x.admin1, x.admin2, x.country].join(' '));
    // "Pucón, Chile" → filtra por región o país; si no, prefiere Chile (la app es chilena) y luego el más poblado
    const g = (hint && list.find(x => where(x).includes(hint))) || list.find(x => x.country_code === 'CL') || list[0];
    return { name: g.name, region: [g.admin1, g.country].filter(Boolean).join(', '), lat: g.latitude, lon: g.longitude };
  }
  const daily = (r, prob) => {
    const d = r.daily || {};
    return (d.time || []).map((t, i) => ({
      d: t, code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i],
      pp: prob ? d.precipitation_probability_max[i] : null, mm: d.precipitation_sum[i]
    })).filter(x => x.max != null);
  };
  const forecast = g => getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=${DAYS}`).then(r => daily(r, true));
  const archive = (g, a, b) => getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${g.lat}&longitude=${g.lon}&start_date=${a}&end_date=${b}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`).then(r => daily(r, false));

  let busy = false, err = '', errFor = '', open = false;
  async function load(force) {
    const q = place();
    if (!q || busy) return;
    const k = norm(q), e = mem[k] || {}, p = plan();
    const needFc = p.mode !== 'past' && (force || !e.fc || Date.now() - e.fc.t > FRESH);
    const needPast = p.mode === 'past' && (force || !e.past || e.past.from !== p.pfrom || e.past.to !== p.pto);
    if (e.geo && !needFc && !needPast) return;
    if (!navigator.onLine) { if (force) toast('Sin conexión: se muestra la última consulta'); return; }
    busy = true; err = ''; paint();
    try {
      if (!e.geo) e.geo = await geocode(q);
      if (needFc) e.fc = { t: Date.now(), days: await forecast(e.geo) };
      if (needPast) e.past = { t: Date.now(), from: p.pfrom, to: p.pto, days: await archive(e.geo, p.pfrom, p.pto) };
      mem[k] = e; keep();
    } catch (x) {
      errFor = k;
      err = x.message === 'nf' ? 'No encontramos ese lugar. Prueba con la ciudad o comuna (ej: Pucón) o agrega el país (ej: Mendoza, Argentina).'
        : 'No se pudo consultar el clima. Revisa tu conexión e inténtalo de nuevo.';
    }
    busy = false; paint();
  }
  function paint() {
    const el = document.getElementById('wxPill');
    if (el) el.outerHTML = pill();
    if (open) refreshSheet();
  }

  /* Botón en la tarjeta del viaje */
  function pill() {
    const q = place();
    if (!q) return `<button class="wx-pill" id="wxPill" data-act="wx">${ic('csun')} Ver el clima</button>`;
    const e = entry(), p = plan();
    if (!busy && errFor !== norm(q)) setTimeout(() => load(false), 0);   // si la consulta es vieja, se actualiza sola
    const day = e && e.fc && p.mode !== 'past' && e.fc.days.find(x => x.d === p.from);
    if (!day) return `<button class="wx-pill" id="wxPill" data-act="wx">${ic('csun')} Clima en ${esc(q)}</button>`;
    const [txt, icn] = wmo(day.code);
    return `<button class="wx-pill" id="wxPill" data-act="wx" aria-label="Clima: ${esc(txt)}">${ic(icn)} ${p.from === Store.today() ? 'Hoy' : 'Al llegar'} <b>${Math.round(day.max)}°</b> / ${Math.round(day.min)}°</button>`;
  }

  /* Consejos según el pronóstico */
  function tips(days, past) {
    const out = [], mn = Math.round(Math.min(...days.map(d => d.min))), mx = Math.round(Math.max(...days.map(d => d.max)));
    if (days.some(d => d.pp != null ? d.pp >= 60 : d.mm >= 2)) out.push(['rain', past ? 'Suele llover en esas fechas: lleven paraguas o impermeable.' : 'Viene lluvia: lleven paraguas o impermeable.']);
    if (days.some(d => (d.code >= 71 && d.code <= 77) || d.code === 85 || d.code === 86)) out.push(['snow', 'Puede nevar: ropa impermeable y, si van en auto, cadenas.']);
    if (days.some(d => d.code >= 95)) out.push(['storm', 'Puede haber tormentas: revisen el pronóstico antes de salir.']);
    if (mn <= 5) out.push(['moon', `Noches frías (hasta ${mn}°): ropa abrigada y frazadas.`]);
    if (mx >= 28) out.push(['sun', `Calor (hasta ${mx}°): bloqueador, gorro y harta agua.`]);
    return out;
  }
  function dayRow(x, label) {
    const [txt, icn] = wmo(x.code);
    const extra = x.pp != null ? (x.pp >= 20 ? ` · ${x.pp}% lluvia` : '') : (x.mm >= 1 ? ` · ${Math.round(x.mm)} mm` : '');
    return `<div class="wx-day"><span class="wd">${esc(label)}</span><span class="wi wx-${icn}">${ic(icn)}</span>
      <span class="wt">${esc(txt)}<small>${esc(extra)}</small></span><b class="wm">${Math.round(x.max)}°</b><span class="wn">${Math.round(x.min)}°</span></div>`;
  }

  function sheetHTML() {
    const q = place(), e = entry(), p = plan();
    const head = `<div class="sheet-title"><span class="st-ico" style="background:var(--g-sky)">${ic('csun')}</span>
        <div><h2>${q ? 'Clima en ' + esc(e && e.geo ? e.geo.name : q) : 'Clima del destino'}</h2><p>${e && e.geo ? esc(e.geo.region) : 'Para los días del viaje'}</p></div></div>
      <div class="wx-place"><input id="wxPlace" value="${esc(q)}" placeholder="¿A dónde van? Ej: Pucón" autocomplete="off">
        <button class="btn sea" data-act="wxSet">${q ? 'Cambiar' : 'Ver clima'}</button></div>`;
    if (!q) return head + `<p class="hint">Escribe la ciudad o comuna de destino. También se puede poner en el engranaje del viaje.</p>`;
    if (err) return head + `<p class="wx-err">${ic('alert')} ${esc(err)}</p><button class="btn block" data-act="wxRefresh">${ic('undo')} Reintentar</button>`;
    const past = p.mode === 'past', src = past ? e && e.past : e && e.fc;
    if (!src) return head + `<div class="wx-load">${ic('csun')} Consultando el clima…</div>`;
    let rows, intro;
    if (past) {
      rows = src.days.map((x, i) => dayRow(x, dayName(addDays(p.from, i))));
      intro = `Faltan más de 16 días y el pronóstico todavía no existe. Así estuvo el clima en esas mismas fechas <b>el año pasado</b>:`;
    } else {
      const days = src.days.filter(x => x.d >= p.from && x.d <= p.to);
      rows = days.map(x => dayRow(x, x.d === Store.today() ? 'Hoy' : dayName(x.d)));
      intro = p.mode === 'over' ? 'El viaje ya terminó. Pronóstico de los próximos días:' : 'Pronóstico para los días del viaje:';
    }
    const list = past ? src.days : src.days.filter(x => x.d >= p.from && x.d <= p.to);
    const tp = list.length ? tips(list, past) : [];
    const t = new Date(src.t), hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return head + `<p class="hint">${intro}</p>
      ${tp.length ? `<div class="wx-tips">${tp.map(([i, s]) => `<div>${ic(i)}<span>${esc(s)}</span></div>`).join('')}</div>` : ''}
      <div class="wx-days">${rows.join('') || '<p class="hint">Sin datos para esas fechas.</p>'}</div>
      ${p.cut ? `<p class="hint">${past ? 'Se muestran las primeras dos semanas del viaje.' : `Los días siguientes aparecen más cerca de la fecha (el pronóstico llega a 16 días).`}</p>` : ''}
      <p class="hint wx-src">Datos: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · ${busy ? 'actualizando…' : `consultado a las ${hhmm}${navigator.onLine ? '' : ' (sin conexión)'}`}</p>
      <button class="btn block" data-act="wxRefresh">${ic('undo')} Actualizar</button>`;
  }

  function setPlace() {
    const inp = document.getElementById('wxPlace'), v = inp ? inp.value.trim() : '';
    if (!v) { toast('Escribe el destino'); if (inp) inp.focus(); return; }
    const t = S().trip;
    if (v !== (t.place || '')) { t.place = v; Store.save(); log('trip', `puso como destino ${v}`, 'place'); }
    err = ''; errFor = ''; delete mem[norm(v)]; paint(); load(true);
  }

  const ACT = {
    wx: () => { open = true; openSheet(sheetHTML, () => { open = false; }); load(false); },
    wxSet: setPlace,
    wxRefresh: () => { err = ''; errFor = ''; load(true); }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'wxPlace') { e.preventDefault(); setPlace(); } });

  return { ACT, pill };
};
