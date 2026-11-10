// Prueba el prompt del Chef IA directo contra Gemini (sin Worker). Necesita GEMINI_API_KEY en el entorno.
// Uso: node tests/test-chef-ai.mjs [modelo]
import { chefWithGemini, cleanInput, normalizeChef } from '../worker/chef.mjs';

const input = cleanInput({
  personas: 8, minutos: 60, antojo: 'algo calentito para la noche',
  despensa: [
    { id: 'p1', n: 'Fideos spaghetti', cant: '1 kg' }, { id: 'p2', n: 'Salsa de tomate pomarola', cant: '2 un' },
    { id: 'p3', n: 'Carne molida 7% grasa', cant: '800 g' }, { id: 'p4', n: 'Cebolla', cant: '4 un' },
    { id: 'p5', n: 'Zapallo italiano', cant: '3 un' }, { id: 'p6', n: 'Queso rallado', cant: '200 g' },
    { id: 'p7', n: 'Papa', cant: '2 kg' }, { id: 'p8', n: 'Huevos', cant: '12 un' }, { id: 'p9', n: 'Arroz grado 1', cant: '1 kg' }
  ],
  lista: ['Pan marraqueta', 'Palta'],
  restricciones: [
    { quien: 'Cami', dietas: ['Celíaco / sin gluten'], salud: [], nota: '' },
    { quien: 'Don Luis', dietas: [], salud: ['Diabetes'], nota: '' }
  ],
  recetario: [{ id: 'pastas', n: 'Pastas' }, { id: 'pastelpapas', n: 'Pastel de papas' }, { id: 'arrozpollo', n: 'Arroz con pollo' }, { id: 'tortillaverduras', n: 'Tortilla de verduras' }]
});
const t0 = Date.now();
const raw = await chefWithGemini({ key: process.env.GEMINI_API_KEY, model: process.argv[2] || 'gemini-3.5-flash-lite', input });
const d = normalizeChef(raw, new Set(input.recetario.map(r => r.id)));
console.log(`${Date.now() - t0} ms · ${d.recetas.length} recetas\n${d.intro}\n`);
for (const r of d.recetas) {
  console.log(`${r.emoji} ${r.nombre} · ${r.minutos} min · ${r.dificultad} · base=${r.base || '-'}`);
  console.log('  ¿Por qué?', r.porQue);
  console.log('  Ingredientes:', r.ingredientes.map(g => `${g.nombre} ${g.cant || ''} ${g.unidad}${g.despensa ? ' [' + g.despensa + ']' : ''}`).join('; '));
  console.log('  Adaptaciones:', r.adaptaciones.join(' | '));
  console.log('  Salud:', r.salud, '\n  Tip:', r.tip, '\n  Pasos:', r.pasos.length);
}
