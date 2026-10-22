const fs = require('fs'), vm = require('vm'), path = require('path');
const APP = process.argv[2];
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/recipes.js']) vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), ctx);
const W = ctx.window;
let bad = 0, ings = 0, vars = 0;
const cats = new Set(W.RECIPE_CATS.map(c => c.id));
const ids = new Set();
for (const r of W.RECIPES) {
  if (ids.has(r.id)) { console.log('ID duplicado', r.id); bad++; } ids.add(r.id);
  if (!cats.has(r.c)) { console.log('Categoría?', r.id, r.c); bad++; }
  vars += r.vars.length;
  for (const ing of [...r.base, ...r.vars.flatMap(v => v.ing)]) {
    ings++;
    const cat = W.CATALOG.find(c => c.id === ing.c);
    const it = cat && cat.items.find(x => x[0] === ing.i);
    if (!it) { console.log('Producto?', r.id, ing.c, ing.i); bad++; continue; }
    if (ing.v && !it[2].includes(ing.v)) { console.log('Variante?', r.id, ing.i, '→', ing.v, '| opciones:', it[2].join(', ')); bad++; }
    if (ing.q && !['g', 'ml', 'un', 'lata', 'pq', 'fr', 'bot', 'bolsa'].includes(ing.u)) { console.log('Unidad?', r.id, ing.i, ing.u); bad++; }
  }
  if (!r.base.length && !r.vars.length) { console.log('Receta vacía', r.id); bad++; }
}
console.log(`${W.RECIPES.length} recetas, ${vars} variantes, ${ings} ingredientes revisados, ${bad} problemas`);
process.exit(bad ? 1 : 0);
