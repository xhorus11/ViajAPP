# Viajapp · Contexto del proyecto

> Archivo de contexto para retomar el trabajo sin releer todo el código.
> **Se actualiza al final de cada sesión de trabajo** (sección "Historial" + lo que cambie).

## Qué es
PWA mobile-first para organizar viajes en grupo (usuario chileno: español, CLP, "once").
Pestañas: **Inicio**, **Súper** (Catálogo / Mi lista / **Despensa**), **Recetas**, **Dinero**, **Agenda** + hoja **⚙️ Viaje** (con **Dietas y alergias**).
Pantalla **Tu grupo** (`#group`, sin pestaña propia: se abre desde la tarjeta de Inicio, la barra marca Inicio): **Cosas** (¿Quién lleva qué?) / **Piezas** (habitaciones y camas) / **Bitácora**.

## Stack y decisiones
- HTML + CSS + JS puro, **sin build** (se publica arrastrando la carpeta a Netlify Drop / GitHub Pages).
- Librerías locales en `vendor/`: html2canvas 1.4.1 (PNG), jsPDF 2.5.1 + autotable 3.8.2 (PDF).
- Datos **solo locales**: `localStorage` clave `viajapp-v1` + IndexedDB `viajapp-fotos` (store `photos`, fotos JPEG comprimidas a 1600px como dataURL).
- Offline vía `sw.js` (red primero para archivos propios, caché primero para Google Fonts). Subir `CACHE` si cambia la lista SHELL.
- Diseño: oscuro neón (#140c33), degradados vivos, blobs animados, glassmorphism, animaciones spring, confeti, vibración. Fuentes: Bricolage Grotesque (títulos) + Outfit.
- El usuario quiere diseño **muy dinámico, colorido, "no tan Claude"**, pero **sin exceso de emojis** (le dijeron que se veía "vibecoding").
- **Regla de emojis**: solo como *contenido* (productos y categorías del súper, recetas y sus categorías, categorías de gastos y tipos de comida). Toda la UI (títulos, botones, avisos, hojas, menús) usa íconos SVG de línea: `ICONS` + `ic(nombre)` en `app.js` (settings, plus, cart, wallet, calendar, pot, file, receipt, image, share, download, upload, trash, check, users, copy, calculator, sheet, camera, edit, eye, undo, logout, star, arrow, search, book, list, phone, cloud). Estado de sync con `syncDot()` (punto de color). Confeti solo en momentos importantes (marcar comprado, lista completa, crear/unirse a viaje).
- **Logo**: `logo Viajapp.png` (león viajero, original 1254 px, no se publica). Derivados en `icons/`: `logo-mark-256.png` (león+globo sin texto, desvanecido abajo; se usa en Inicio, PNG y PDF), `logo-full-600.png`, `icon-192/512`, `icon-maskable-512`, `apple-touch-icon`, `favicon-64` (fondo violeta oscuro de la app). Se regeneran con Pillow (script en scratchpad de la sesión 5: recorte `(150,40,1110,885)`).

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Shell: fondo animado, `#view`, tabbar, hoja inferior `#sheetWrap`, toasts, canvas confeti, `#exportStage` |
| `css/styles.css` | Todo el estilo. Tokens en `:root`. Animaciones de entrada solo con `.view.animate` |
| `js/data.js` | `CATALOG` (18 categorías, items `[nombre, emoji, [variantes]]`), `EXPENSE_CATS`, `EVENT_TYPES` (con hora por defecto), `PAY_METHODS`, `DOC_TYPES` |
| `js/recipes.js` | Recetario base: **120 recetas / 339 variantes en 18 `RECIPE_CATS`** (`mundo` = "Latinoamérica", + `asia`, `europa`). Formato compacto `alias[/Variante][:cant unidad]` separados por `;`; alias `A` → `cat\|Item` del catálogo. Cantidad = **por persona** (g, ml, un, lata, pq, fr, bot, bolsa); sin cantidad = fijo (x1). Exporta `RECIPES` ya parseado `{id,n,e,c,base:[ing],vars:[{n,ing}]}`, ing = `{c,i,v,q,u}`, y `RECIPE_MEAL` (tipo de comida al agendar) |
| `js/diets.js` | `Diet`: `DIETS` (9 dietas con los atributos que evitan), `ATTR` (nombres), `attrs(c,i,v)` → atributos del producto (meat, fish, seafood, dairy, dairy_lf, egg, honey, gluten, pork, nuts, alcohol; las variantes "Sin gluten/Sin lactosa/Vegano/Vegetal/Vegana/Sin alcohol" los quitan), `avoidOf(tags)`, `clash`, `substitute(g, avoid)` (tabla `SUBS` de reemplazos del catálogo), `dietName` |
| `js/group.js` | `GroupModule(A)`: módulo independiente; `app.js` le pasa sus herramientas (S, esc, ic, openSheet, render, myName, go, placeSeg…) y recibe `{ render, homeCard, log, onRemote, ACT, ui }` (`ACT` se mezcla con `Object.assign`). Contiene ¿Quién lleva qué? (`SUGGEST`, fases ida/vuelta), Habitaciones (`BED` tipos+capacidad, `raffle()` respeta camas fijas `lock` y parejas `together` con union-find, `rouletteAnim`), Bitácora (`log(k, text|fn(n), mk)` con fusión de acciones seguidas por `mk` en 5 min, `onRemote()` muestra aviso de lo hecho por otros) |
| `js/firebase-config.js` | `window.FIREBASE_CONFIG` del proyecto **viajapp-e589e** (público) |
| `js/sync.js` | `Sync`: sincronización en grupo (ver sección "Sincronización") |
| `firestore.rules` | Reglas de seguridad (probadas en emulador: el intruso no puede nada) |
| `tests/` | Scripts E2E/validación + `firebase.json` del emulador (ver `tests/LEEME.md`) |
| `js/store.js` | `Store`: `state`, `save()` (debounce), `photos.put/get/del/clear`, `compress`, `backup/restore` (JSON con fotos), `reset`, `uid`, `today` |
| `js/export.js` | `U` (money, dmy, longDate, esc, plain, slug, parseDate) y `Exporter` (groupedList, listPNG, listPDF, financePDF, financeCSV, agendaPDF, deliver) |
| `js/app.js` | Interfaz completa (ver patrones abajo) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA |

## Modelo de datos (`Store.state`)
```js
trip: { name, emoji, entity, responsibles: [{ name, rut }], responsible, rut, start, end, budget, currency, people: [],
        diets: { "Nombre": { tags: ["celiaco", ...], note } } }      // dietas por participante (se sincroniza con el doc del viaje)
pantry: { items: { "cat|item|variante": { c, i, v, a: { unidad: cantidad }, t } } }   // despensa; varias unidades por producto (ej. {g:440, un:1})
// responsibles = lista real; responsible/rut quedan como resumen para versiones antiguas. Leer siempre con U.resps(trip) (migra el formato viejo).
shop: {
  sel:      { "cat|item|variante": { c, i, v, q, done, n?, u?, src?: [], pa? } },  // v '' = sin especificar; n+u = cantidad de recetas; src = recetas de origen ("· para Cami" = porción adaptada); pa = lo que sumó a la despensa al marcar comprado
  custom:   { catId: [{ n, e, v: [] }] },                     // productos creados por el usuario
  extraVar: { "cat|item": ["variante extra"] }                // variantes agregadas
}
expenses: [{ id, amount, cat, desc, date, payer, among?: [nombres], method, docType, docNum, photos: [photoId], notes, created }]  // payer puede ser "Fondo común"; among solo si se reparte entre algunos (ausente = todos)
events:   [{ id, type, title, date, time, place, who, notes, recipe?: { id, vi, p, mode }, cooked?, cookLog?: [{c,i,v,n,u}] }]  // receta vinculada; cookLog = lo descontado de la despensa (para deshacer)
recipes:  { custom: { id: receta }, hidden: { id: true } }   // custom con id de una base = edición (override); ids propios "u_..."
gear:     { items: { id: { id, name, e, owner, qty, brought, returned, note, t } } }       // ¿Quién lleva qué? (owner '' = nadie)
rooms:    { list: [{ id, name, beds: [{ id, type, who: [nombres], lock }] }], together: [{ a, b }] }  // sin arrays anidados (Firestore no los acepta)
log:      [{ id, t, who, k: money|shop|agenda|group|trip|recipes, mk, n, text }]       // bitácora, máx. 400; who = myName()
```

## Patrones de `app.js`
- Navegación por hash (`#home|#shop|#money|#agenda`) → `go(tab)` → `render(anim)`; `RENDER = { home, shop, money, agenda }`.
- Las vistas son funciones que devuelven strings HTML. Los elementos fijos (FAB, CTA) van **fuera** de `.page` (el transform rompe `position: fixed`).
- Eventos por delegación: `data-act="x"` → `ACT.x(el, event)`. Inputs por id en el listener `input`; archivos con `data-change`.
- Hojas inferiores: `openSheet(renderFn, onClose)`, `refreshSheet()`, `closeSheet()` (integradas con el botón atrás vía `history.pushState`).
- Formularios: variable global `draft` con `_kind` (`expense|event|split|trip`). Al cerrar se usa `releaseDraft(mine)` (no anular un borrador que otra hoja reemplazó).
- Chips de selección: `data-act="pick" data-g="campo" data-v="valor"` → `draft[campo] = valor`.
- Confirmar sin `confirm()`: `confirmTap(el)` (dos toques).
- Actualizaciones puntuales sin re-render (catálogo y lista): `updateCardFor`, `updateCTA`, `updateChipCounts`, `updateListProgress`.
- Números animados: `data-count`; barras: `data-w`; anillo: `data-off`.
- Montos: `parseAmount()` entiende "45.990", "45990" y "12,5".
- Recetas: `allRecipes()` (base − ocultas, con overrides, + propias), `getRecipe(id)`, `recipeIngs(r, vi)` (base + variante, suma repetidos). **`cookPlan(r, vi, p, mode)`** → `{rows, issues, adapts}`: por ingrediente calcula quién no puede comerlo (`whoCant`), lo reemplaza con `Diet.substitute` en porción aparte (`mode 'portion'`: k personas apto + resto normal), todo el plato (`'all'`) o nada (`'none'`); cada fila trae `k` (clave, `|a` si adaptada), `tot`, `forWho`, y de la despensa `have`/`need`/`covered`. **`addPlanToList(plan, label, skip)`** agrega solo lo que falta (filas cubiertas por la despensa se omiten salvo override en `skip`), crea productos con `ensureCatalogItem` y si la fila ya estaba comprada empieza una nueva. `recipeStatus(r)`/`planStatus` → ok/adapt/no para insignias y filtro `ui.recCat='apt'`.
- Dietas: `dietPeople()` (participantes con tags + `avoid`), `whoCant(c,i,v)`, `dietWarnHTML(row)` (aviso "No apto para…" en lista y despensa), `issuesByPerson`, hoja `openDiets()` (chips `dietTog` guardan al instante; nota con `.diet-note` en el listener `input`). `ACT.diets` guarda antes la hoja del viaje con `persistTrip()`.
- Despensa: `P_()`, `pantryAdd/pantryTake(c,i,v,n,u)` (take devuelve lo sacado), `pantryOf`, `pantryText`, `boughtAmount(row)`. `ACT.done` suma/resta a la despensa (`row.pa`). `ACT.evCooked/evUncook` descuentan/devuelven según `cookPlan` y `cookLog` (usa `readEventForm()` para no perder lo escrito). Vista `pantryView()` en `ui.shopMode='pantry'` (agregar con `#paName` + datalist, `pStep`, `pToList`, `pDel`, `pCopy`, `pClear`). Hoja "cocinar" `openCook`; editor `openRecipeEditor` (filas leídas con `readEditor()`; productos vía `<datalist id="ingList">`, texto libre → producto nuevo en Despensa).
- Bitácora: `log = G.log` se llama en las acciones de todos los módulos (gasto creado/editado/eliminado, comprado [fusión 'bought'], agregar a la lista ['listAdd'], despensa, recetas a la lista, crear receta, agenda, cocinado, viaje ['trip'], dietas ['diets'], viaje compartido, y dentro de group.js). Ojo: no usar variables locales llamadas `log`. `myName()` = nombre en el viaje compartido, el guardado, o el primer participante.
- `placeSeg()` posiciona el indicador de cualquier `.seg` de la vista; `TAB_OF` mapea pantallas sin pestaña a la pestaña que se ilumina.
- Cantidades: `U.amt(n,u)` formatea (g→kg, ml→L, paquetes con redondeo hacia arriba); `U.qtyText(row)` en exportaciones.
- Cuentas claras: `settle()` reparte cada gasto que NO es "Fondo común" entre `sharersOf(e)` (`among` filtrado a `trip.people`; vacío = todos) y calcula transferencias mínimas (greedy). Devuelve `part` (parte de cada uno) y `partial` (n° de gastos parciales: cambia el texto y muestra "su parte"). Formulario: `amongHTML()` en `#exAmong` (chips `amongAll`/`amongTog`, oculto con Fondo común, `refreshAmong()` al cambiar pagador o monto).

## Pruebas
- Servidor: `python -m http.server 8765`.
- E2E con puppeteer-core 22 + Edge headless (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`), viewport 400×860 móvil; scripts en el scratchpad de la sesión (se rehacen si hace falta): recorren todos los flujos, descargan los exportables y revisan errores de consola.
- Validar recetas: script node que carga `data.js` + `recipes.js` en `vm` y comprueba que cada ingrediente exista en `CATALOG` (producto + variante + unidad). Ejecutarlo tras editar recetas o el catálogo.
- Revisar PDFs: PyMuPDF (`fitz`) para pasar las páginas a PNG.
- Node LTS instalado vía winget (si no está en PATH, recargar `$env:Path`).

## Estado / pendientes conocidos
- No publicado aún (se sugirió Netlify Drop). El enlace de invitación solo sirve con la app publicada en HTTPS.
- **Firebase del usuario**: Auth anónima ✅, Firestore ✅ creado con reglas publicadas. `tests/test-sync.js` contra el real: 21/21 OK (limpia sus datos al final).
- **PUBLICADA en https://viajapp-trip.web.app** (Firebase Hosting multisitio; CLI logueado como mgajardod@utem.cl). `viajapp.web.app` estaba reservado por otro proyecto. En `firebase.json` hay 2 targets (`.firebaserc`): `app` → sitio `viajapp-trip` (la app) y `legacy` → sitio `viajapp-e589e` (carpeta `legacy/`: redirección 301 a viajapp-trip conservando ruta y `?viaje=`; la raíz `/` sirve `legacy/index.html` con meta-refresh). Para republicar: en PowerShell `Remove-Item env:VSCODE_CWD; firebase deploy --only hosting --project viajapp-e589e --non-interactive` (publica ambos). Para comprobar si un nombre de sitio está libre sin crearlo: API `sites?siteId=X&validateOnly=true` con el access token de `~/.config/configstore/firebase-tools.json`. **Subir `CACHE` en `sw.js` en cada cambio** para que los celulares tomen la versión nueva. `firebase deploy` sin `--only` también publicaría `firestore.rules`. Archivos internos (CONTEXTO, tests, logo original, reglas) excluidos en `firebase.json` (verificado: 404).
- `tests/test-sync.js` contra el sitio publicado: 21/21 OK (tras offline→online Firestore tarda en reconectar por backoff; el test espera hasta 30 s).
- Los PDF quitan emojis (las fuentes de jsPDF no los soportan).
- Cuentas claras: cada gasto puede repartirse solo entre algunos (sesión 10).

## Sincronización (Firebase, plan gratuito Spark) — implementada
- Auth **anónima**; Firestore con `enablePersistence` (offline); SDK compat 10.14.1 en `vendor/`, cargado **bajo demanda** por `sync.js`. Sin Storage (exige Blaze): fotos como docs `{d: dataURL}` (<900 KB, se re-comprimen).
- Firestore: `trips/{id}` `{ members:[uid], names:{uid:nombre}, trip:{...}, created }` + subcolecciones `pantry` y `gear` (como `shop`), `log` (doc por entrada), `shop` (id = `encodeURIComponent(clave)` con `.`→`%2E`), `expenses`, `events`, `meta` (docs `shop` = {custom, extraVar}, `recipes` = {custom, hidden} y `rooms`), `photos`.
- Motor: `Store.save()` → `Sync.push()` → `flush()` compara `flatten(state)` (ruta → JSON estable con claves ordenadas) contra `last` (persistido en localStorage `viajapp-sync-last`) y manda batch de set/delete solo de lo cambiado. Remoto: `onSnapshot` en trip + 4 colecciones; se ignoran docs con `hasPendingWrites` y los que tienen cambio local sin enviar (`dirty`); en el primer snapshot se detectan borrados remotos. Avisa a la UI con `viajapp:remote` (re-render sin interrumpir inputs con foco) y mensajes con `viajapp:syncmsg`.
- Modos de `connect`: `upload` (crear: sube todo), `fresh` (unirse: estado vacío, `ready` solo tras snapshots **del servidor**), `resume` (al abrir la app).
- Unirse: `?viaje=ID` abre la hoja; `join` guarda respaldo local (`viajapp-local-backup`) que `leave` restaura. Fotos remotas: `fetchPhotos` escucha el doc de la foto hasta que exista.
- Sesión: `viajapp-sync` {tripId}, nombre en `viajapp-name`. Borrar todo / Restaurar respaldo bloqueados mientras hay viaje compartido.
- `Store` guarda de inmediato en `pagehide`/`visibilitychange` (antes se podía perder el último cambio).
- Emulador: si `window.FIREBASE_EMULATOR` → `useEmulator` (solo tests).

## Backlog de ideas
Hechas: Recetas → lista del súper, Cuentas claras, Sincronización en grupo (probada contra el Firestore real), varios responsables, manual.
**Hechas sesión 6**: Dietas y alergias, Despensa de la cabaña.
**Pendientes propuestas sesión 6**: 2) Planificador automático de menú (días, personas, presupuesto, preferencias → llena agenda + lista consolidada, sin IA, usa dietas) · 3) Repartirse el súper (asignar secciones/productos por persona, filtro "Lo mío", avance en vivo, reparto automático) · 4) "La vaca": ingresos/aportes por persona y varias fuentes de fondos con saldo propio; carta financiera por fuente · 5) Despensa de la cabaña (comprado → despensa, cocinar descuenta, avisa lo que ya hay, sobrantes al final).
**Hechas sesión 7**: ¿Quién lleva qué?, Habitaciones y camas, Bitácora del grupo.
**Pendientes propuestas sesión 7**: Informe final del viaje para la entidad (PDF con actividades de la agenda, participantes, fotos, resumen de gastos, conclusiones) · Mis viajes + plantillas (varios viajes, archivar, duplicar como plantilla) · ¿Quién lleva qué? (cosas compartidas por dueño y devolución) · Habitaciones y camas (asignar/sortear con ruleta, preferencias) · Calculadora de bencina y peajes por auto → gasto dividido por pasajeros · Bitácora del grupo (registro de quién hizo qué).
Otras: modo "en el súper", precios → gasto automático, OCR de boletas, multimoneda, presupuesto diario/por categoría, firma con el dedo en el PDF, turnos de cocina/aseo, recordatorios, clima, mapa, maleta/checklist, documentos y emergencias, votaciones, diario/álbum, "Resumen del viaje" estilo Wrapped, asistente IA para menús, gastos compartidos solo entre algunos participantes.

## Historial
### Sesión 1 · 2026-10-09
- Creada la app completa (Súper con catálogo + variantes + exportación PNG/PDF, Dinero con fotos + dividir cuenta + carta financiera PDF + CSV, Agenda con calendario de comidas, Configuración + respaldo).
- Bugs corregidos: el borrador se anulaba al encadenar hojas (dividir → gasto); sombras rotas en el PNG de html2canvas (no usar `box-shadow` en `#exportStage`).

### Sesión 2 · 2026-10-09
- Creado este `CONTEXTO.md` + `CLAUDE.md` (lo importa automáticamente). Regla: actualizarlo al terminar cada sesión.
- Entregada la lista de ideas (backlog arriba). Sin cambios de código.

### Sesión 3 · 2026-10-09
- Nuevo módulo **Recetas** (pestaña propia): 87 recetas con variantes, buscador, categorías, filtro ⭐ Mías; hoja "cocinar" (variante, personas, desmarcar lo que ya tengo, agregar a la lista, agendar); editor completo (crear, editar base como override, restaurar, ocultar/mostrar, variantes, unidades, productos libres).
- Lista del súper muestra cantidad (`n`,`u`) y receta de origen (`src`); PNG/PDF exportan la cantidad.
- Agenda: los eventos pueden tener receta vinculada (📖) con botones "Ingredientes a la lista" y "Ver receta".
- Dinero: pagador "Fondo común" (por defecto si hay fondos asignados) + sección **Cuentas claras 🤝** con transferencias y botón copiar para WhatsApp.
- Catálogo ampliado (salsas para pasta, repostería, postres en polvo, mix de mariscos, quinoa, apio, jengibre, berenjena, especias y variantes nuevas).
- Creado `firestore.rules`. SW → `viajapp-v2`.

### Sesión 4 · 2026-10-09
- **Sincronización en grupo** con Firebase (proyecto `viajapp-e589e`): `js/sync.js`, `js/firebase-config.js`, SDK en `vendor/`, QR (`vendor/qrcode.min.js`). UI: hoja "👥 Viaje compartido" (crear / unirse con enlace o código / integrantes / QR / copiar / compartir / salir), píldora de estado en Inicio, botón en ⚙️ y tarjeta "Comparte el viaje" en Inicio.
- Probado con emulador (Java 21 Temurin + firebase-tools 13.29.1 global): 21/21 OK (unirse, lista, comprado, recetas, gasto+foto, recetas propias, agenda, borrados, UI en vivo, offline→online, recarga, intruso bloqueado, salir y recuperar datos).
- Bugs corregidos: foto llegaba antes de existir (ahora se escucha); último cambio se perdía al cerrar la página (guardado inmediato al ocultar).
- SW → `viajapp-v3`. Pruebas guardadas en `tests/`.
- El usuario creó Firestore y publicó reglas → prueba real 21/21 OK. Timeouts de crear/unirse subidos a 30 s (la 1ª conexión a una BD recién creada falló por demora).
- Preparado deploy a Firebase Hosting (pendiente `firebase login` del usuario).

### Sesión 5 · 2026-10-09
- Limpieza de emojis decorativos → íconos SVG (`ICONS`/`ic()`), textos y avisos sin emojis, menos confeti. Se quitó el selector de emoji del viaje (campo `trip.emoji` queda sin uso).
- Logo del usuario integrado: íconos PWA nuevos, león en el encabezado de Inicio y en la portada, logo en el PNG de la lista y en la cabecera de todos los PDF (`loadLogo()` en export.js). SW → `viajapp-v4`.
- **Publicada en Firebase Hosting** y verificada con la prueba de 2 usuarios contra el sitio real.
- Dirección final **viajapp-trip.web.app** (sitio nuevo); la vieja `viajapp-e589e.web.app` redirige. Prueba de 2 usuarios en el dominio nuevo: 21/21 OK (el dominio funciona con Auth anónima sin agregarlo a dominios autorizados).
- **Varios responsables** en ⚙️ (filas nombre + RUT, `rpAdd`/`rpDel` manipulan el DOM sin refrescar la hoja; `saveTrip` las lee). Carta financiera: todos en datos y texto ("rinden"), una firma por responsable + entidad en 2 columnas. SW → `viajapp-v5`.
- **Manual de uso** en `manual/index.html` (publicado en https://viajapp-trip.web.app/manual/), con 22 capturas reales en `manual/img/*.webp` + PDF `manual/Manual-Viajapp.pdf` (16 págs, ~12 MB). Enlace "Manual de uso" al final de la hoja ⚙️. Si cambia la UI, regenerar con los scripts de `tests/` (ver `tests/LEEME.md`).
### Sesión 6 · 2026-10-10
- Propuestas 5 ideas nuevas (ver backlog). El usuario eligió 1 (Dietas) y 3 (Despensa).
- **Regla nueva del usuario**: cada cambio actualiza también el manual (capturas + PDF), `CACHE` del SW y la publicación (anotada en `CLAUDE.md`).
- **Dietas y alergias**: `js/diets.js`, hoja por participante (9 dietas + nota), banner y filtro "Aptas para el grupo" en Recetas, insignias Apta/Se adapta/No apta, puntos de color en variantes, caja de dietas al cocinar con modos Porción aparte / Todo el plato apto / Sin adaptar, avisos "No apto para…" en lista y despensa, aviso en la agenda. Catálogo: variantes nuevas (Sin gluten en fideos/harina/pan/panes/masa pizza/pan rallado/avena/galletas/cereal/soya/cerveza; Sin lactosa y Vegano/Vegetal en queso/yogurt/crema; Mayonesa vegana).
- **Despensa**: tercera pestaña en Súper; comprado → despensa (y deshacer), receta descuenta lo que hay ("en despensa"/"faltan X"), plan con receta "Marcar como cocinado"/deshacer, agregar/ajustar/se acabó→lista, copiar sobrantes, "En la despensa" en el catálogo. Sincroniza (colección `pantry`).
- Pruebas: `check-diets.js` (156 reemplazos OK), `test-diet-pantry.js` 19/19, `test-sync.js` contra Firestore real 24/24 (incluye despensa y dietas), regresión `test2` OK.
- Manual: secciones nuevas "Despensa de la cabaña" y "Dietas y alergias", FAQ, capturas 23–25 nuevas, PDF 20 págs. SW → `viajapp-v6`. Publicado.

### Sesión 7 · 2026-10-11
- Instalado **Google Drive para escritorio**: la carpeta del proyecto se sincroniza sola con el Drive del usuario (Mi PC). Drive crea `.tmp.driveupload/` dentro del proyecto → excluido en `firebase.json` (rompía el deploy con "content hash doesn't match").
- Nuevo módulo **Tu grupo** (`js/group.js`, pantalla `#group` desde tarjeta en Inicio, sin agregar pestañas): **¿Quién lleva qué?** (sugerencias, Lo llevo yo, asignar/cantidad/nota, llevado, devoluciones, copiar), **Habitaciones y camas** (piezas, 6 tipos de cama, ejemplo, Juntos, sorteo con ruleta, asignar a mano, fijar), **Bitácora** (registro automático en todos los módulos, fusión de acciones, filtros por módulo/persona, aviso en vivo de lo que hace otro).
- Sync: colecciones `gear` y `log`, doc `meta/rooms`. Store: `gear`, `rooms`, `log`.
- Pruebas: `test-group.js` 22/22, `test-sync.js` real 27/27 (incluye cosas, piezas y aviso en vivo), dietas/despensa y regresión OK.
- Manual: sección "Tu grupo" (capturas 26–31), FAQ; PDF 24 págs. SW → `viajapp-v7`. Publicado.

### Sesión 8 · 2026-10-11
- **+33 recetas** (búsqueda web de platos típicos): chilenas (curanto en olla, caldillo de congrio, pastel de papas, plateada al jugo, mariscos a la parmesana, tomaticán, ajiaco, pan amasado, mote con huesillo, calzones rotos; empanadas de mariscos; cola de mono en Tragos), Latinoamérica (chili con carne, arepas, pollo a la brasa, ají de gallina, causa limeña, feijoada, milanesa, enchiladas), Asia (sushi, poke, pad thai, curry thai, pollo teriyaki + chaufa y wok movidos), Europa y Mediterráneo (shawarma/gyros, falafel, tortilla española, moussaka, ratatouille, goulash, quiche), postres (tiramisú, churros).
- Catálogo: Congrio, Mote, Huesillos, Algas nori, Salsas asiáticas, Masas (hojaldre/quebrada); variantes Arroz para sushi, Fideos de arroz, Harina de maíz precocida, Porotos rojos, Vinagre de arroz, Clavo de olor, Pasta de curry, Ají amarillo, Papa amarilla, Mascarpone, Galletas champaña. Dietas: gluten en mote/masas/salsas asiáticas (no sriracha), no en fideos de arroz ni harina de maíz; masas con lácteos; reemplazos mote→quinoa y teriyaki→soya sin gluten.
- Recetario **compacto**: en "Todas" sin búsqueda máx. 6 recetas por categoría + tarjeta "Ver las N recetas" (`.more-card`, `data-act="rcat"`); la búsqueda ahora recorre todo el recetario aunque haya categoría elegida; el chip activo se marca por `data-c`.
- Pruebas: check-recipes 120/339/1269 OK, check-diets 165 OK, `test-recipes-view.js` 9/9, dietas/despensa, grupo y regresión OK. Manual actualizado (texto de Recetas, capturas, PDF). SW → `viajapp-v8`. Publicado.

### Sesión 9 · 2026-10-12
- **Bug reportado**: en la prueba con 2 celulares, el que escaneó el QR no veía Temuco (hero, días en el calendario, participantes, dietas). Diagnóstico: la sincronización del viaje funciona (prueba nueva por UI, local y publicada). En Firestore (leído por REST con el token del CLI) el viaje Temuco estaba bien y Nicolás se había unido; además había otro viaje compartido "Mi viaje" de "prueba" creado hoy. Causa: si un equipo ya estaba en otro viaje compartido, abrir la invitación solo mostraba el aviso "sal primero" y la hoja del viaje viejo → seguía viendo su viaje. Otra causa posible: el QR se abre en otro navegador (cámara/Safari) con almacenamiento aparte de la app instalada.
- Arreglo: la hoja Viaje compartido muestra **Conectado a «nombre»** y, si llega una invitación a otro viaje, una tarjeta `.sy-switch` con **Cambiarme al viaje nuevo** (`ACT.sySwitch` = `Sync.leave()` + `Sync.join()`); la invitación espera a `Sync.init()` antes de abrir la hoja. Nota en la hoja de unirse para la app instalada. Al crear, "Yo" se reemplaza por el nombre de quien crea (también su dieta).
- Prueba nueva `tests/test-join-trip.js` (17 verificaciones, real; local y publicada OK). Regresión: test-sync real, grupo, dietas/despensa OK. Se borraron viajes de prueba huérfanos de Firestore (test-sync deja uno sin miembros que la app no puede borrar: limpiar por REST).
- Manual: paso "Cambiarme al viaje nuevo", tip "¿En qué viaje estoy?", FAQ "Me uní con el QR pero no veo el viaje", capturas y PDF regenerados. SW → `viajapp-v9`. Publicado.
- Pedido del usuario: con invitación (`draft.code`) la hoja se titula **Te invitaron a un viaje** y muestra primero Unirme (botón principal) y después "o crea uno propio" (botón secundario); sin invitación sigue crear → unirse. Manual ajustado. SW → `viajapp-v10`. Publicado.
- **Bug de actualización**: el celular seguía con el `app.js` viejo porque Firebase Hosting servía js/css con `max-age=3600` y el SW usaba `fetch(req)` (caché HTTP). Arreglo: `firebase.json` pone `no-cache` a `**/*.@(js|css|html|webmanifest)`; el SW usa `fetch(req, {cache:'no-cache'})` e instala con `cache:'reload'`. SW → `viajapp-v11`. **Ojo**: no usar `Get-Content`/`Set-Content` de PowerShell 5 para subir `CACHE` (rompe los acentos); usar Edit.

### Sesión 10 · 2026-10-13 (horas antes del primer viaje real a Temuco)
- Lluvia de ideas final: 1) gastos solo entre algunos, 2) turnos de cocina/aseo, 3) ficha de emergencia, 4) checklist de maleta, 5) resumen del día, 6) foto rápida de boleta. El usuario eligió solo la 1. **Para más adelante**: analizador de boletas (foto → productos y precios con IA de visión → tabla/Excel, marcar qué es de quién; conviene sobre `among`); guardar boletas reales del viaje para probarlo.
- **Gastos solo entre algunos** (opcional, sin cambiar el módulo): campo `among` en el gasto, bloque "¿Entre quiénes se reparte?" (Todos + chips, monto c/u en vivo), Cuentas claras con "su parte", texto de Copiar con la parte de cada uno, "entre N" en Movimientos, columna "Repartido entre" en el Excel.
- Pruebas: `tests/test-among.js` 14/14 (local y publicada), test2, test-sync real, grupo (arreglada una falla al azar del test: Sofía ya quedaba en el sofá), dietas/despensa OK. Se borraron viajes huérfanos sin miembros (incluido un "Mi viaje" sin miembros, inaccesible).
- Manual: sección "Gastos solo entre algunos", captura 32, FAQ; `shots.js` con gasto e3 entre 3. SW → `viajapp-v12`. Publicado.

### (nota sesión 5)
- El usuario tenía la app en **Vercel**: ya no es necesaria si se publica en Firebase Hosting (recomendado: misma cuenta, dominio ya autorizado). Ojo: los datos locales son por dominio; para pasar datos usar el viaje compartido o Respaldo/Restaurar.
