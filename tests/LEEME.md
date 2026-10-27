# Pruebas de Viajapp

Requisitos (una vez): Node LTS, `npm i puppeteer-core@22.15.0` en esta carpeta, Microsoft Edge.
Servidor de la app (desde la raíz del proyecto): `python -m http.server 8765 --bind 127.0.0.1`

| Script | Qué prueba | Cómo correrlo |
|---|---|---|
| `check-recipes.js` | Que cada ingrediente de `js/recipes.js` exista en el catálogo | `node tests/check-recipes.js .` |
| `test2.js` | Recetas, editor, agenda, lista con cantidades, cuentas claras, exportaciones | `node tests/test2.js` (descargas en `tests/out2/`) |
| `check-diets.js` | Que cada reemplazo de dieta exista en el catálogo y sea apto + casos clave (fideos→sin gluten, leche vegana, etc.) | `node tests/check-diets.js .` |
| `test-diet-pantry.js` | Dietas (hoja, banner, filtro, insignias, porción aparte / todo apto, avisos en la lista) y Despensa (comprado→despensa, deshacer, receta descuenta, cocinado/deshacer, agregar/ajustar/se acabó) — 19 verificaciones | `node tests/test-diet-pantry.js` |
| `test-group.js` | Tu grupo: tarjetas en Inicio, ¿Quién lleva qué? (sugerencias, Lo llevo yo, asignar, llevado, devoluciones), Piezas (ejemplo, Juntos, sorteo, asignar a mano, fijar, agregar cama) y Bitácora (registros, fusión, filtros) — 22 verificaciones | `node tests/test-group.js` |
| `test-recipes-view.js` | Recetario compacto (máx. 6 por categoría + "Ver las N"), categorías Asia/Europa, búsqueda global, receta nueva (sushi) a la lista | `node tests/test-recipes-view.js` |
| `test-boletas.mjs` | Lectura directa con Gemini de 3 boletas reales (fotos fuera del repo) vs. el papel; necesita `GEMINI_API_KEY` en el entorno | `node tests/test-boletas.mjs <carpeta> [modelo...]` |
| `test-worker.mjs` | Worker de boletas publicado: seguridad (401/403/CORS) y lectura de las 3 boletas por modelo (`auto`, `gemini-...`, `@cf/...`) | `node tests/test-worker.mjs <carpeta> [via...]` |
| `test-boletas-app.js` | Analizador en la app: foto → Revisa tu boleta → editar nombre/cantidad/precio, agregar/quitar, aviso de diferencia → usar → guardar con productos → Ver y editar → planillas Excel y Word — 21 verificaciones (usa el Worker real) | `node tests/test-boletas-app.js <carpeta> [URL]` |
| `test-cuentas.js` | Cuentas separadas: abrir desde Dinero, leer boleta (respuesta fija, no gasta IA), asignar por persona, Separar en N, editar nombre/precio, propina sin/10%/otro, persona extra, quién pagó, guardar como gasto, Cuentas claras, gasto normal igual que antes, reabrir desde el gasto — 23 verificaciones | `node tests/test-cuentas.js <foto.jpg> [URL]` |
| `test-help.js` | Ayuda simple: guía "Tu próximo paso" (avanza sola, ocultar/mostrar, Únete aquí), botón ? en cada pantalla (3 pasos + enlace al manual), tamaño de letra (se recuerda, sin scroll horizontal) — 22 verificaciones; capturas en `tests/out-help/` | `node tests/test-help.js URL` |
| `test-among.js` | Gastos solo entre algunos: Todos/chips, monto c/u, Fondo común lo oculta, Cuentas claras con "su parte", editar, Excel — 14 verificaciones | `node tests/test-among.js URL` |
| `test-join-trip.js` | Datos del viaje entre celulares usando la interfaz (nombre, fechas, participantes, dietas; en vivo, recarga, tercero con datos propios, cambiarse desde otro viaje compartido) — 17 verificaciones, contra el Firebase real | `node tests/test-join-trip.js URL` (deja 1 viaje huérfano: borrarlo por REST) |
| `test-sync.js` | Sincronización con 2 usuarios + intruso, offline, recarga, salir (21 verificaciones) | ver abajo |

## Manual de uso (`manual/`)
1. `node tests/shots.js https://viajapp-trip.web.app/index.html` → 22 capturas con datos de ejemplo en `tests/shots/` (+ PNG y PDF exportados en `shots/dl`). No toca Firebase (simula el viaje compartido).
2. `python tests/make_manual_imgs.py tests/shots manual/img` → convierte a WebP (también páginas de la carta).
3. Con el servidor local: `node tests/manual-pdf.js http://127.0.0.1:8765/manual/index.html manual/Manual-Viajapp.pdf tests` → PDF del manual (abre las preguntas frecuentes antes de imprimir).
Otros: `test-resp.js` (varios responsables + migración), `make_logo_icons.py` (íconos desde `logo Viajapp.png`).

## Sincronización con el emulador de Firebase
Necesita Java 21 (Temurin) y `npm i -g firebase-tools@13.29.1`.
En PowerShell, dentro de VS Code hay que quitar `VSCODE_CWD` (si no, firebase-tools busca mal sus plantillas):
```
Remove-Item env:VSCODE_CWD
copy ..\firestore.rules .
firebase emulators:start --only "firestore,auth" --project viajapp-e589e --config firebase.json
node test-sync.js ..            # usa el emulador
node test-sync.js .. URL real   # contra el Firebase real (crea datos de prueba)
```
La app usa el emulador solo si la página define `window.FIREBASE_EMULATOR = true` (lo hace el test).
