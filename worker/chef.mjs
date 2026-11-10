/* Chef IA: propone recetas con lo que hay en la despensa, respetando dietas, alergias y condiciones de salud.
   Recibe un resumen del viaje (sin nombres reales obligatorios ni datos personales) y devuelve 3 propuestas en JSON. */

const str = { type: 'string' }, num = { type: 'number' };
export const UNITS = ['g', 'kg', 'ml', 'l', 'un', 'cda', 'cdta', 'taza', 'pizca', 'al gusto'];
export const CATS = ['pastas', 'carnes', 'pollo', 'mar', 'arroz', 'chilena', 'sopas', 'sandwich', 'masas', 'mundo', 'asia', 'europa', 'ensaladas', 'desayuno', 'once', 'postres', 'tragos', 'picoteo'];

export const CHEF_SCHEMA = {
  type: 'object',
  properties: {
    intro: str,
    recetas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: str, emoji: str, minutos: num, categoria: { type: 'string', enum: CATS },
          dificultad: { type: 'string', enum: ['Fácil', 'Media', 'Difícil'] },
          porQue: str,
          base: str,
          ingredientes: {
            type: 'array',
            items: {
              type: 'object',
              properties: { nombre: str, cant: num, unidad: { type: 'string', enum: UNITS }, despensa: str },
              required: ['nombre', 'cant', 'unidad', 'despensa']
            }
          },
          pasos: { type: 'array', items: str },
          adaptaciones: { type: 'array', items: str },
          salud: str,
          tip: str
        },
        required: ['nombre', 'emoji', 'minutos', 'categoria', 'dificultad', 'porQue', 'base', 'ingredientes', 'pasos', 'adaptaciones', 'salud', 'tip']
      }
    }
  },
  required: ['intro', 'recetas']
};

export const CHEF_PROMPT = `Eres "Chef IA" de Viajapp, un chef chileno práctico que cocina para grupos de viaje (cabañas, camping, casas arrendadas).
Recibes en JSON: personas a cocinar, tiempo disponible, antojo (opcional), lo que hay en la despensa (con id), lo que está en la lista del súper por comprar, las restricciones de cada persona y el recetario de la app (id y nombre).

Propón EXACTAMENTE 3 recetas distintas entre sí (por ejemplo: una contundente, una liviana y una distinta o entretenida).
Reglas:
1. Usa al máximo lo que hay en la despensa. Lo que falte debe ser poco y fácil de conseguir en un supermercado chileno.
2. DIETAS Y ALERGIAS SON OBLIGATORIAS: nunca incluyas un ingrediente que alguien no puede comer sin darle una alternativa concreta. Si una persona necesita una porción distinta, explícalo en "adaptaciones" (ej: "Para Cami (celíaca): fideos sin gluten en una olla aparte"). Todo ingrediente de reemplazo que haya que usar (ej. "Fideos sin gluten") TAMBIÉN va en "ingredientes", con la cantidad para esas personas.
3. CONDICIONES DE SALUD: adapta el plato de forma responsable (diabetes: sin azúcar añadida y con pocos carbohidratos refinados; hipertensión o enfermedad renal: poca sal, sin caldos en cubo ni cecinas; colesterol alto: sin frituras ni grasas saturadas; embarazo: nada crudo ni alcohol, carnes bien cocidas; gota: sin mariscos ni cerveza; gastritis o reflujo: sin picante ni alcohol, poca grasa). En "salud" escribe en una frase cómo cuidaste esas condiciones (o "" si nadie tiene condiciones). No des consejos médicos ni dosis.
4. Respeta el tiempo: "minutos" es el tiempo total realista y no debe superar el disponible.
5. Cantidades TOTALES para el número de personas indicado, en las unidades permitidas. Para sal, aceite y especias usa "al gusto" o cucharadas.
6. En cada ingrediente, "despensa" es el id del producto de la despensa que se usa (ej "p3") o "" si hay que comprarlo.
7. Si una propuesta corresponde a una receta del recetario, pon su id en "base"; si no, "". "categoria" es la categoría del recetario que mejor le queda (mundo = Latinoamérica).
8. "pasos": entre 4 y 8 pasos cortos y claros, pensados para una cocina de cabaña.
9. "porQue": una frase de por qué conviene (qué aprovecha de la despensa).
10. "tip": un dato entretenido, truco de cocina o idea para hacerlo especial en el viaje.
11. "intro": una frase cálida resumiendo las 3 opciones.
Responde en español de Chile, con un tono cercano y amable, sin anglicismos, garabatos ni modismos exagerados.
La sal, el aceite y las especias básicas van en "ingredientes" como cualquier otro (con "despensa" vacío si no están en la lista).`;

export async function chefWithGemini({ key, model, input }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: CHEF_PROMPT + '\n\nDATOS:\n' + JSON.stringify(input) }] }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: CHEF_SCHEMA, temperature: 0.8 }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok) throw Object.assign(new Error((j.error && j.error.message) || 'Error de Gemini'), { status: res.status });
  const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || '').join('');
  return JSON.parse(text);
}

export async function chefWithWorkersAI(env, model, input) {
  const r = await env.AI.run(model, {
    messages: [{ role: 'system', content: CHEF_PROMPT + '\nResponde únicamente con el JSON.' }, { role: 'user', content: JSON.stringify(input) }],
    response_format: { type: 'json_schema', json_schema: CHEF_SCHEMA },
    max_tokens: 4096, temperature: 0.7
  });
  const res = r && r.response !== undefined ? r.response : r;
  if (res && typeof res === 'object') return res;
  const s = String(res || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
  return JSON.parse(s.slice(i, j + 1));
}

/* Limpia la entrada que manda la app (tamaños acotados) */
export function cleanInput(b) {
  const s = (v, n = 80) => String(v == null ? '' : v).slice(0, n);
  const arr = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
  return {
    personas: Math.max(1, Math.min(200, Math.round(+b.personas || 4))),
    minutos: [0, 15, 30, 60].includes(+b.minutos) ? +b.minutos : 0,
    antojo: s(b.antojo, 300),
    despensa: arr(b.despensa, 150).map(x => ({ id: s(x.id, 8), n: s(x.n), cant: s(x.cant, 40) })),
    lista: arr(b.lista, 80).map(x => s(x)),
    restricciones: arr(b.restricciones, 60).map(x => ({ quien: s(x.quien, 40), dietas: arr(x.dietas, 12).map(y => s(y, 40)), salud: arr(x.salud, 12).map(y => s(y, 40)), nota: s(x.nota, 160) })),
    recetario: arr(b.recetario, 400).map(x => ({ id: s(x.id, 40), n: s(x.n, 60) })),
    ocasion: s(b.ocasion, 40)
  };
}

/* Deja la respuesta en un formato seguro para la app */
export function normalizeChef(d, ids) {
  const s = (v, max = 300) => String(v == null ? '' : v).slice(0, max).trim();
  const n = v => { const x = +v; return isFinite(x) && x > 0 ? Math.round(x * 100) / 100 : 0; };
  const recetas = (Array.isArray(d && d.recetas) ? d.recetas : []).slice(0, 3).map(r => ({
    nombre: s(r.nombre, 80), emoji: s(r.emoji, 8) || '🍽️', minutos: Math.round(n(r.minutos)) || 30, categoria: CATS.includes(r.categoria) ? r.categoria : 'chilena',
    dificultad: ['Fácil', 'Media', 'Difícil'].includes(r.dificultad) ? r.dificultad : 'Fácil',
    porQue: s(r.porQue), base: ids.has(r.base) ? r.base : '',
    ingredientes: (Array.isArray(r.ingredientes) ? r.ingredientes : []).slice(0, 30).map(g => ({
      nombre: s(g.nombre, 60), cant: n(g.cant), unidad: UNITS.includes(g.unidad) ? g.unidad : 'al gusto', despensa: /^p\d+$/.test(g.despensa) ? g.despensa : ''
    })).filter(g => g.nombre),
    pasos: (Array.isArray(r.pasos) ? r.pasos : []).slice(0, 12).map(x => s(x, 400)).filter(Boolean),
    adaptaciones: (Array.isArray(r.adaptaciones) ? r.adaptaciones : []).slice(0, 8).map(x => s(x)).filter(Boolean),
    salud: s(r.salud), tip: s(r.tip)
  })).filter(r => r.nombre && r.ingredientes.length && r.pasos.length);
  return { intro: s(d && d.intro), recetas };
}
