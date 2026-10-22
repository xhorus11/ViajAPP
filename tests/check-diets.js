/* Valida las dietas: cada reemplazo existe en el catálogo y casos clave dan lo esperado.
   Uso: node tests/check-diets.js .  */
const fs = require('fs'), vm = require('vm'), path = require('path');
const APP = process.argv[2] || '.';
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/recipes.js', 'js/diets.js']) vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), ctx);
const { CATALOG, Diet } = ctx.window;
let bad = 0, subs = 0;
const exists = (c, i, v) => { const cat = CATALOG.find(x => x.id === c); const it = cat && cat.items.find(x => x[0] === i); return it && (!v || it[2].includes(v)); };
for (const cat of CATALOG) for (const [i, , vars] of cat.items) for (const v of [''].concat(vars)) for (const d of Diet.DIETS) {
  const avoid = Diet.avoidOf([d.id]);
  if (!Diet.clash(Diet.attrs(cat.id, i, v), avoid).length) continue;
  const s = Diet.substitute({ c: cat.id, i, v }, avoid);
  if (!s) continue;
  subs++;
  if (!exists(s.c, s.i, s.v)) { console.log('Reemplazo inexistente:', cat.id, i, v, '→', s); bad++; }
  if (Diet.clash(Diet.attrs(s.c, s.i, s.v), avoid).length) { console.log('Reemplazo NO apto:', i, v, d.id, '→', s); bad++; }
}
const expect = (label, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { bad++; console.log('❌', label, 'obtuvo', JSON.stringify(got), 'esperaba', JSON.stringify(want)); } else console.log('✅', label); };
const sub = (c, i, v, tags) => { const s = Diet.substitute({ c, i, v }, Diet.avoidOf(tags)); return s && `${s.i} · ${s.v}`; };
const at = (c, i, v) => [...Diet.attrs(c, i, v)].sort();
expect('Fideos tienen gluten', at('despensa', 'Fideos', 'Spaghetti'), ['gluten']);
expect('Fideos sin gluten no tienen gluten', at('despensa', 'Fideos', 'Sin gluten'), []);
expect('Celíaco: spaghetti → sin gluten', sub('despensa', 'Fideos', 'Spaghetti', ['celiaco']), 'Fideos · Sin gluten');
expect('Sin lactosa: leche → sin lactosa', sub('lacteos', 'Leche', 'Entera', ['sin_lactosa']), 'Leche · Sin lactosa');
expect('Vegano: leche → avena', sub('lacteos', 'Leche', 'Entera', ['vegano']), 'Leche · Avena');
expect('Vegano: queso → vegano', sub('lacteos', 'Queso', 'Parmesano', ['vegano']), 'Queso · Vegano');
expect('Vegetariano: hamburguesa → vegetal', sub('carnes', 'Hamburguesas', 'Vacuno', ['vegetariano']), 'Hamburguesas · Vegetal');
expect('Vegetariano: asado sin reemplazo', sub('carnes', 'Vacuno', 'Asado de tira', ['vegetariano']), null);
expect('Sin cerdo: salame → jamón de pavo', sub('carnes', 'Fiambres', 'Salame', ['sin_cerdo']), 'Fiambres · Jamón de pavo');
expect('Sin alcohol: cerveza → sin alcohol', sub('alcohol', 'Cerveza', 'Lager', ['sin_alcohol']), 'Cerveza · Sin alcohol');
expect('Celíaco + sin alcohol: cerveza sin reemplazo', sub('alcohol', 'Cerveza', 'Lager', ['celiaco', 'sin_alcohol']), null);
expect('Pesto: frutos secos y lácteos', at('despensa', 'Salsas para pasta', 'Pesto'), ['dairy', 'nuts']);
expect('Mariscos: camarones', at('pescados', 'Camarones', 'Crudos'), ['fish', 'seafood']);
expect('Salmón no es marisco', at('pescados', 'Salmón', 'Filete'), ['fish']);
console.log(`${subs} reemplazos revisados, ${bad} problemas`);
process.exit(bad ? 1 : 0);
