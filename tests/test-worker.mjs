/* Prueba del intermediario de boletas (Cloudflare Worker).
   Uso: node tests/test-worker.mjs <carpeta con 8.jpg 9.jpg 10.jpg> [via ...]
   via: (vacío = orden normal) | gemini-3.5-flash-lite | cf | @cf/... (un modelo de Workers AI) */
import fs from 'node:fs';
import path from 'node:path';

const W = process.env.WORKER_URL || 'https://viajapp-boletas.viajapp.workers.dev';
const ORIGIN = 'https://viajapp-trip.web.app';
const API_KEY = 'AIzaSyDds_lY1reNLpxLVhvGRBYPkNUnW1UHRj4';   // clave pública del proyecto (js/firebase-config.js)
const dir = process.argv[2];
const vias = (process.argv.slice(3).length ? process.argv.slice(3) : ['auto']).map(v => v === 'auto' ? '' : v);   // "auto" = orden normal
const TRUTH = { '8.jpg': 145530, '9.jpg': 54884, '10.jpg': 24434 };
let fails = 0;
const ok = (c, l) => { console.log((c ? '✅ ' : '❌ ') + l); if (!c) fails++; };

// Sesión anónima de Firebase, igual que la app
const su = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, { method: 'POST', headers: { 'content-type': 'application/json', referer: ORIGIN + '/' }, body: JSON.stringify({ returnSecureToken: true }) }).then(r => r.json());
const token = su.idToken;
ok(!!token, 'Sesión anónima de Firebase');
const call = (body, hdr = {}) => fetch(W + '/leer', { method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, ...hdr }, body: JSON.stringify(body) });

// Seguridad
const img = fs.readFileSync(path.join(dir, '10.jpg')).toString('base64');
ok((await call({ image: img })).status === 401, 'Sin sesión → 401');
ok((await call({ image: img }, { authorization: 'Bearer ' + token.slice(0, -5) + 'xxxxx' })).status === 401, 'Token alterado → 401');
ok((await call({ image: img }, { authorization: 'Bearer ' + token, origin: 'https://sitio-malo.com' })).status === 403, 'Otro sitio → 403');
ok((await fetch(W + '/leer', { method: 'OPTIONS', headers: { origin: ORIGIN, 'access-control-request-method': 'POST' } })).headers.get('access-control-allow-origin') === ORIGIN, 'CORS permite la app');

for (const via of vias) {
  console.log(`\n===== ${via || 'orden normal (Gemini → respaldo)'} =====`);
  for (const [file, total] of Object.entries(TRUTH)) {
    const t0 = Date.now();
    const r = await call({ image: fs.readFileSync(path.join(dir, file)).toString('base64'), mime: 'image/jpeg', via: via || undefined }, { authorization: 'Bearer ' + token });
    const j = await r.json();
    if (!j.ok) { ok(false, `${file}: ${r.status} ${j.error} ${(j.detalle || []).join(' | ')}`); continue; }
    const d = j.data;
    ok(d.total === total && j.check.diff === 0, `${file} · ${j.model} · ${((Date.now() - t0) / 1000).toFixed(1)}s · total ${d.total} (papel ${total}) · cuadra ${j.check.diff === 0} · ${d.items.length} productos · ${d.proveedor} · N° ${d.nDoc} · ${d.fecha} · ${d.categoria} · "${d.detalle}" · quedan ${j.restantes}`);
  }
}
console.log(fails ? `\nFALLARON ${fails}` : '\nTODO OK');
process.exit(fails ? 1 : 0);
