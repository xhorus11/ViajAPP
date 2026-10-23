/* Etapa 0: prueba de lectura de boletas reales con Gemini.
   Uso: node tests/test-boletas.mjs <carpeta con 8.jpg 9.jpg 10.jpg> [modelo ...]
   La clave se lee de la variable de entorno de usuario GEMINI_API_KEY (nunca se imprime). */
import fs from 'node:fs';
import path from 'node:path';
import { readWithGemini, check } from '../worker/boleta.mjs';

const dir = process.argv[2];
const models = process.argv.slice(3).length ? process.argv.slice(3) : ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('Falta GEMINI_API_KEY'); process.exit(1); }

// Lo que dice el papel (verificado a mano)
const TRUTH = {
  '8.jpg': { total: 145530, nDoc: '12197', fecha: '2025-10-23', items: 14, cat: 'bar' },
  '9.jpg': { total: 54884, nDoc: '2202019811', fecha: '2025-10-24', items: 18, cat: 'super' },
  '10.jpg': { total: 24434, nDoc: '32618790', fecha: '2025-10-25', items: 7, cat: 'super' }
};

for (const model of models) {
  console.log(`\n===== ${model} =====`);
  for (const [file, t] of Object.entries(TRUTH)) {
    const b64 = fs.readFileSync(path.join(dir, file)).toString('base64');
    const t0 = Date.now();
    try {
      const r = await readWithGemini({ key, model, b64, mime: 'image/jpeg' });
      const c = check(r), secs = ((Date.now() - t0) / 1000).toFixed(1);
      const ok = (cond) => (cond ? '✅' : '❌');
      console.log(`\n${file} · ${r.proveedor} · ${secs}s`);
      console.log(`  total ${ok(r.total === t.total)} ${r.total} (papel ${t.total}) · suma líneas ${c.sum} ${ok(c.diff === 0)} · items ${ok(r.items.length === t.items)} ${r.items.length}/${t.items}`);
      console.log(`  nDoc ${ok(String(r.nDoc).replace(/^0+/, '') === t.nDoc)} ${r.nDoc} · fecha ${ok(r.fecha === t.fecha)} ${r.fecha} · cat ${ok(r.categoria === t.cat)} ${r.categoria} · ${r.tipoDoc} · "${r.detalle}"`);
      r.items.forEach(it => console.log(`    ${String(it.cant).padStart(5)} ${it.unidad.padEnd(2)} ${it.nombre.padEnd(38).slice(0, 38)} ${String(it.total).padStart(7)}   ← ${it.orig}`));
      if ((r.avisos || []).length) console.log('  avisos:', r.avisos.join(' | '));
    } catch (e) {
      console.log(`\n${file} · ERROR ${e.status || ''}: ${e.message.slice(0, 200)}`);
    }
  }
}
