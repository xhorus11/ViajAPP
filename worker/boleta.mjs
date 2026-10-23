/* Instrucciones y formato de respuesta para leer boletas chilenas con IA.
   Lo usan el Worker de Cloudflare (worker/index.mjs) y la prueba tests/test-boletas.mjs. */

export const CATS = ['super', 'bar', 'comida', 'transporte', 'combustible', 'alojamiento', 'actividades', 'salud', 'otros'];

export const PROMPT = `Eres un lector de boletas y facturas chilenas (supermercados, restaurantes, cafeterías, farmacias, bencineras).
Lee la imagen y devuelve SOLO el JSON pedido. Reglas:
- Montos en pesos chilenos como números enteros, sin puntos ni signo $ (ej. "$54.884" -> 54884).
- "items": cada producto o servicio cobrado, en el orden de la boleta. No incluyas líneas de neto, IVA, total, vuelto, medio de pago ni textos del timbre electrónico.
  - "orig": el texto tal como aparece impreso (abreviado o cortado).
  - "nombre": un nombre claro en español para una persona común, sin códigos de barra (ej. "CHAMPINON BDJA 20" -> "Champiñón bandeja 200 g"; "J. BLESS 1LT 21 MANGO" -> "Jugo Bless mango 1 L"). Si no se entiende, deja el texto original ordenado.
  - "cant": cantidad comprada (unidades, o kilos/litros con decimales si se vende a granel, ej. "0,852 x 1 KG" -> 0.852 con unidad "kg").
  - "unidad": "un" para todo lo que se cuenta por unidad o envase (botellas, cajas, bolsas, bandejas, platos), aunque el nombre diga "1 L" o "1 kg". Usa "kg", "g", "l" o "ml" solo si se vende a granel y la cantidad es un peso o volumen (ej. "0,852 x 1 KG").
  - "pUnit": precio por unidad (o por kg) si aparece o se puede calcular; si no, total/cant redondeado.
  - "total": valor de la línea (lo que se cobró por ese producto). Si una cantidad y precio unitario vienen en una línea aparte (ej. "2 x 1 UN $2190 c/u" o "2.000 X 2.390"), únelos al producto de arriba.
  - Descuentos u ofertas que restan: un item aparte con "total" negativo y nombre "Descuento ...".
- "total": el TOTAL a pagar de la boleta. "neto" e "iva" si aparecen (si no, 0). "propina" si aparece (si no, 0).
- "proveedor": nombre comercial corto (ej. "Unimarc Pucón", "Supermercados Eltit"); "razonSocial" y "rut" del emisor si aparecen.
- "fecha" en formato AAAA-MM-DD. "nDoc": número de boleta/factura (solo dígitos, sin ceros a la izquierda). "tipoDoc": "Boleta", "Factura" o "Ticket / Voucher".
- "medioPago": "Efectivo", "Débito", "Crédito" o "Transferencia" si se ve; si no, "".
- "categoria": una de ${CATS.join(', ')} (super = supermercado/almacén; bar = restaurante, hamburguesería, pizzería o bar donde se come en el local; comida = cafetería, panadería o comida al paso).
- "detalle": resumen de 2 a 6 palabras para una rendición de gastos (ej. "Víveres (pastas, verduras)", "Almuerzo grupal (hamburguesas)").
- "legible": false si la foto está tan borrosa o cortada que no se puede leer con confianza; "avisos": problemas concretos (ej. "No se lee el precio de la línea 4").`;

const num = { type: 'number' }, str = { type: 'string' };
export const SCHEMA = {
  type: 'object',
  properties: {
    proveedor: str, razonSocial: str, rut: str, fecha: str, nDoc: str, tipoDoc: str, medioPago: str,
    categoria: { type: 'string', enum: CATS }, detalle: str,
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { orig: str, nombre: str, cant: num, unidad: { type: 'string', enum: ['un', 'kg', 'g', 'l', 'ml'] }, pUnit: num, total: num },
        required: ['orig', 'nombre', 'cant', 'unidad', 'pUnit', 'total']
      }
    },
    neto: num, iva: num, propina: num, total: num,
    legible: { type: 'boolean' }, avisos: { type: 'array', items: str }
  },
  required: ['proveedor', 'fecha', 'nDoc', 'tipoDoc', 'categoria', 'detalle', 'items', 'total', 'legible']
};

/* Llamada a Gemini (API REST de Google AI Studio) con salida JSON según SCHEMA */
export async function readWithGemini({ key, model, b64, mime }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime || 'image/jpeg', data: b64 } }, { text: PROMPT }] }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: SCHEMA, temperature: 0 }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok) throw Object.assign(new Error((j.error && j.error.message) || 'Error de Gemini'), { status: res.status });
  const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || '').join('');
  return JSON.parse(text);
}

/* Revisión: ¿la suma de las líneas cuadra con el total? */
export function check(r) {
  const sum = (r.items || []).reduce((s, it) => s + (+it.total || 0), 0) + (+r.propina || 0);
  return { sum, diff: Math.round((+r.total || 0) - sum) };
}
