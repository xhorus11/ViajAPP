/* ViajAPP · intermediario para leer boletas con IA (Cloudflare Worker).
   - Recibe POST /leer { image: base64, mime } con la sesión de Firebase en "Authorization: Bearer <idToken>".
   - Solo atiende a la app (CORS + verificación del token de Firebase) y limita lecturas por persona y por día.
   - Lee con Gemini (clave secreta GEMINI_API_KEY) y, si falla o se acaba la cuota, con Workers AI.
   Las claves nunca llegan al celular. */
import { PROMPT, SCHEMA, CATS, readWithGemini, check } from './boleta.mjs';

const GEMINI = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
// Respaldo en Cloudflare (probado con boletas reales: Llama 4 Scout fue el más fiable; Gemma 4 y Mistral fallaron)
const CF_MODELS = ['@cf/meta/llama-4-scout-17b-16e-instruct', '@cf/mistralai/mistral-small-3.1-24b-instruct'];
const MAX_B64 = 7_000_000;   // ~5 MB de imagen

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'access-control-allow-origin': allowed.includes(origin) ? origin : allowed[0] || '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-max-age': '86400',
      vary: 'origin'
    };
    const out = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json; charset=utf-8' } });
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'GET' && url.pathname === '/') return out(200, { ok: true, servicio: 'viajapp-boletas' });
    if (req.method !== 'POST' || url.pathname !== '/leer') return out(404, { ok: false, error: 'No encontrado' });
    if (origin && !allowed.includes(origin)) return out(403, { ok: false, error: 'Origen no permitido' });

    // 1) ¿Quién pide? Sesión de Firebase (anónima) válida del proyecto
    let uid;
    try { uid = await verifyFirebase((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''), env.FIREBASE_PROJECT); }
    catch (e) { return out(401, { ok: false, error: 'Sesión no válida. Abre la app con internet e intenta de nuevo.' }); }

    // 2) Límite diario por persona (y uno general para cuidar la cuota gratis)
    const day = new Date().toISOString().slice(0, 10);
    const per = +(env.LIMIT_PER_USER || 40), all = +(env.LIMIT_TOTAL || 600);
    const kU = `u:${uid}:${day}`, kT = `t:${day}`;
    const [nU, nT] = await Promise.all([env.LIMITS.get(kU), env.LIMITS.get(kT)]).then(v => v.map(x => +x || 0));
    if (nU >= per) return out(429, { ok: false, error: `Llegaste al máximo de ${per} boletas por hoy. Mañana puedes seguir.` });
    if (nT >= all) return out(429, { ok: false, error: 'Se alcanzó el máximo de lecturas de hoy. Intenta mañana.' });

    // 3) La imagen
    let body;
    try { body = await req.json(); } catch (e) { return out(400, { ok: false, error: 'Solicitud no válida' }); }
    const b64 = String(body.image || '').replace(/^data:[^,]+,/, ''), mime = /^image\/(jpeg|png|webp)$/.test(body.mime) ? body.mime : 'image/jpeg';
    if (!b64 || b64.length > MAX_B64) return out(413, { ok: false, error: 'La foto es muy grande o no llegó. Intenta con otra foto.' });

    // 4) Leer: Gemini → Gemini 2 → Workers AI (o el que se pida en "via", para pruebas)
    const order = body.via === 'cf' ? CF_MODELS.map(m => ['cf', m])
      : CF_MODELS.includes(body.via) ? [['cf', body.via]]
      : GEMINI.includes(body.via) ? [['g', body.via]]
      : GEMINI.map(m => ['g', m]).concat([['cf', CF_MODELS[0]]]);
    // Si la suma de productos no cuadra con el total, se intenta con el siguiente modelo y se devuelve
    // la primera lectura que cuadre (o, si ninguna cuadra, la que tenga menor diferencia).
    const fails = [], t0 = Date.now();
    let best = null;
    for (const [kind, model] of order) {
      try {
        const data = kind === 'g'
          ? await readWithGemini({ key: env.GEMINI_API_KEY, model, b64, mime })
          : await readWithWorkersAI(env, model, b64, mime);
        const clean = normalize(data);
        if (!clean.items.length && !clean.total) throw new Error('Respuesta vacía');
        const c = check(clean);
        if (!best || Math.abs(c.diff) < Math.abs(best.check.diff)) best = { model, data: clean, check: c };
        if (c.diff === 0) break;
        fails.push(`${model}: no cuadra por ${c.diff}`);
      } catch (e) {
        fails.push(`${model}: ${String(e.message || e).slice(0, 120)}`);
      }
    }
    if (best) {
      await Promise.all([env.LIMITS.put(kU, String(nU + 1), { expirationTtl: 172800 }), env.LIMITS.put(kT, String(nT + 1), { expirationTtl: 172800 })]);
      return out(200, { ok: true, model: best.model, ms: Date.now() - t0, data: best.data, check: best.check, intentos: fails, restantes: per - nU - 1 });
    }
    console.log('Fallaron todos', fails);
    return out(502, { ok: false, error: 'No se pudo leer la boleta ahora. Intenta en un rato o anótala a mano.', detalle: fails });
  }
};

/* Workers AI (respaldo): mensajes con imagen + salida JSON según el mismo esquema */
async function readWithWorkersAI(env, model, b64, mime) {
  const r = await env.AI.run(model, {
    messages: [
      { role: 'system', content: PROMPT + '\nResponde únicamente con el JSON.' },
      { role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } }, { type: 'text', text: 'Lee esta boleta.' }] }
    ],
    response_format: { type: 'json_schema', json_schema: SCHEMA },
    max_tokens: 4096, temperature: 0
  });
  const res = r && r.response !== undefined ? r.response : r;
  if (res && typeof res === 'object') return res;
  const s = String(res || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
  return JSON.parse(s.slice(i, j + 1));
}

/* Deja la respuesta en un formato seguro y predecible para la app */
function normalize(d) {
  const n = v => { const x = typeof v === 'string' ? +v.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.') : +v; return isFinite(x) ? x : 0; };
  const s = (v, max = 120) => String(v == null ? '' : v).slice(0, max).trim();
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, 150).map(it => {
    const cant = n(it.cant) || 1, total = Math.round(n(it.total));
    return { orig: s(it.orig, 160), nombre: s(it.nombre) || s(it.orig), cant, unidad: ['un', 'kg', 'g', 'l', 'ml'].includes(it.unidad) ? it.unidad : 'un', pUnit: Math.round(n(it.pUnit)) || Math.round(total / cant), total };
  });
  return {
    proveedor: s(d.proveedor, 80), razonSocial: s(d.razonSocial, 120), rut: s(d.rut, 20), fecha: /^\d{4}-\d{2}-\d{2}$/.test(d.fecha) ? d.fecha : '',
    nDoc: s(d.nDoc, 30).replace(/^0+(?=\d)/, ''), tipoDoc: s(d.tipoDoc, 30) || 'Boleta', medioPago: s(d.medioPago, 30),
    categoria: CATS.includes(d.categoria) ? d.categoria : 'otros', detalle: s(d.detalle, 80),
    items, neto: Math.round(n(d.neto)), iva: Math.round(n(d.iva)), propina: Math.round(n(d.propina)), total: Math.round(n(d.total)),
    legible: d.legible !== false, avisos: (Array.isArray(d.avisos) ? d.avisos : []).slice(0, 8).map(x => s(x, 160))
  };
}

/* Verificación del token de Firebase (RS256) con las claves públicas de Google, sin librerías */
let JWKS = null, JWKS_EXP = 0;
async function verifyFirebase(token, project) {
  const [h, p, sig] = token.split('.');
  if (!sig) throw new Error('token');
  const dec = x => JSON.parse(new TextDecoder().decode(b64url(x)));
  const head = dec(h), pay = dec(p), now = Date.now() / 1000;
  if (head.alg !== 'RS256' || pay.aud !== project || pay.iss !== `https://securetoken.google.com/${project}` || !pay.sub || pay.exp < now || pay.iat > now + 300) throw new Error('claims');
  if (!JWKS || Date.now() > JWKS_EXP) {
    const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    JWKS = (await r.json()).keys; JWKS_EXP = Date.now() + 3600e3;
  }
  const jwk = JWKS.find(k => k.kid === head.kid);
  if (!jwk) throw new Error('kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('firma');
  return pay.sub;
}
function b64url(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}
