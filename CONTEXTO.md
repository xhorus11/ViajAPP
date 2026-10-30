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
- **Diseño (desde sesión 17): temas Día y Noche** elegibles por equipo (Automático por defecto = sigue `prefers-color-scheme`). Noche = azul profundo (#0a1628, tarjetas #11203a); Día = claro celeste (#f2f8fd, tarjetas blancas con sombra suave). Celeste es el color principal y **cada módulo tiene su degradado** con la misma estructura (claro 300 → intenso 600): Inicio `--g-sky`, Súper `--g-teal`, Recetas `--g-peach`, Dinero `--g-indigo`, Agenda `--g-lilac` (se ve en la barra de pestañas `TAB_GRAD`, accesos rápidos y tarjetas). Fuentes: **Plus Jakarta Sans** (títulos) + **Inter**. Sin manchas desenfocadas ni `backdrop-filter` (pesados para la GPU); solo animaciones de `transform`/`opacity`. Animaciones spring, confeti (colores de la paleta nueva en `COLORS`) y vibración se mantienen.
- **Temas, cómo funcionan**: tokens en `css/styles.css` (`:root, html[data-theme="night"]` y `html[data-theme="day"]`): `--bg/--bg-grad/--card/--stroke/--text/--strong/--muted/--dim/--field/--tint-1/--tint-2/--track/--trip-bg/--sheet-bg/--tabbar-bg/--toast-*/--backdrop/--shadow/--card-shadow/--hero-shade` + colores con nombre antiguo remapeados (`--pink` = celeste principal, `--violet` índigo, `--lime` verde, `--yellow` ámbar, `--orange` durazno, `--teal`, `--rose`, `--lilac`, `--slate`) + tonos de texto `--pos/--neg/--teal-t/--warn-t/--link`. **No usar colores fijos nuevos**: en CSS/JS usar `var(--…)`; texto sobre degradados en blanco (`#fff`), sobre superficies `var(--strong)`. `index.html` fija `data-theme` en `<head>` antes de pintar; `applyTheme()`/`themeHTML()`/`ACT.setTheme` en app.js (clave `viajapp-theme` = auto|day|night; también actualiza `meta theme-color`). Selector en el botón ? y en ⚙️ Viaje → "Apariencia y lectura".
- El usuario quiere diseño **muy dinámico, colorido, "no tan Claude"**, pero **sin exceso de emojis** (le dijeron que se veía "vibecoding").
- **Regla de emojis**: solo como *contenido* (productos y categorías del súper, recetas y sus categorías, categorías de gastos y tipos de comida). Toda la UI (títulos, botones, avisos, hojas, menús) usa íconos SVG de línea: `ICONS` + `ic(nombre)` en `app.js` (settings, plus, cart, wallet, calendar, pot, file, receipt, image, share, download, upload, trash, check, users, copy, calculator, sheet, camera, edit, eye, undo, logout, star, arrow, search, book, list, phone, cloud). Estado de sync con `syncDot()` (punto de color). Confeti solo en momentos importantes (marcar comprado, lista completa, crear/unirse a viaje).
- **Logo OFICIAL Y DEFINITIVO** (sesión 18, el usuario no lo cambiará más): `Viajapp_logo_fondo_blanco.png` (perrito viajero sobre el globo + texto "Viajapp", 2508 px, fondo blanco; no se publica). Los logos anteriores (león, v2) se eliminaron. **Personaje en la tarjeta del viaje**: `Viajapp_ perro viajero sobre mapa mundial.png` (banner del perrito guiñando el ojo) → `python tests/make_hero_dog.py "Viajapp_ perro viajero sobre mapa mundial.png" icons` recorta al perrito sin fondo (rembg, modelo isnet-general-use) → `icons/perro-guino.webp` (`.hero-dog`: abajo a la derecha, patitas en el borde, **estático** por pedido del usuario). El encabezado de Inicio (izquierda) usa la insignia `logo-badge.png`. Originales excluidos del deploy (`Viajapp_*.png` en firebase.json). Derivados en `icons/` con `python tests/make_logo_icons.py "logo Viajapp v2.png" icons` (desde sesión 18): quita el blanco conectado a los bordes, y pone el **logo completo (con el nombre "Viajapp") dentro de una insignia circular blanca** → `logo-badge.png` (Inicio, PNG y PDF), `icon-192/512` y `favicon-64` (círculo blanco, fondo transparente), `icon-maskable-512` y `apple-touch-icon` (fondo blanco completo, insignia dentro de la zona segura; Android lo recorta en círculo), `logo-full-600.png`. **No recortar ni desvanecer el texto del logo** (al usuario no le gustó).

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Shell: fondo animado, `#view`, tabbar, hoja inferior `#sheetWrap`, toasts, canvas confeti, `#exportStage` |
| `css/styles.css` | Todo el estilo. Tokens en `:root`. Animaciones de entrada solo con `.view.animate` |
| `js/data.js` | `CATALOG` (18 categorías, items `[nombre, emoji, [variantes]]`), `EXPENSE_CATS`, `EVENT_TYPES` (con hora por defecto), `PAY_METHODS`, `DOC_TYPES` |
| `js/recipes.js` | Recetario base: **120 recetas / 339 variantes en 18 `RECIPE_CATS`** (`mundo` = "Latinoamérica", + `asia`, `europa`). Formato compacto `alias[/Variante][:cant unidad]` separados por `;`; alias `A` → `cat\|Item` del catálogo. Cantidad = **por persona** (g, ml, un, lata, pq, fr, bot, bolsa); sin cantidad = fijo (x1). Exporta `RECIPES` ya parseado `{id,n,e,c,base:[ing],vars:[{n,ing}]}`, ing = `{c,i,v,q,u}`, y `RECIPE_MEAL` (tipo de comida al agendar) |
| `js/diets.js` | `Diet`: `DIETS` (9 dietas con los atributos que evitan), `ATTR` (nombres), `attrs(c,i,v)` → atributos del producto (meat, fish, seafood, dairy, dairy_lf, egg, honey, gluten, pork, nuts, alcohol; las variantes "Sin gluten/Sin lactosa/Vegano/Vegetal/Vegana/Sin alcohol" los quitan), `avoidOf(tags)`, `clash`, `substitute(g, avoid)` (tabla `SUBS` de reemplazos del catálogo), `dietName` |
| `js/group.js` | `GroupModule(A)`: módulo independiente; `app.js` le pasa sus herramientas (S, esc, ic, openSheet, render, myName, go, placeSeg…) y recibe `{ render, homeCard, log, onRemote, ACT, ui }` (`ACT` se mezcla con `Object.assign`). Contiene ¿Quién lleva qué? (`SUGGEST`, fases ida/vuelta), Habitaciones (`BED` tipos+capacidad, `raffle()` respeta camas fijas `lock` y parejas `together` con union-find, `rouletteAnim`), Bitácora (`log(k, text|fn(n), mk)` con fusión de acciones seguidas por `mk` en 5 min, `onRemote()` muestra aviso de lo hecho por otros) |
| `js/boletas.js` | `BoletaModule(A)` (analizador de boletas, solo agrega): botón en el gasto (`buttonHTML` en `#bolBox`), hoja "Revisa tu boleta" (`reviewHTML`, se muestra cuando `draft._bol` existe; tabla editable con listener `input` propio y aviso cuadra/diferencia), `bolUse` completa el borrador y guarda `draft.receipt`; planilla `planilla`/`planillaGo` → Excel (SheetJS `vendor/xlsx.mini.min.js`) o Word (.docx a mano con `vendor/jszip.min.js`), cargados bajo demanda. URL del Worker: `window.BOLETAS_URL` o `https://viajapp-boletas.viajapp.workers.dev` |
| `js/cuentas.js` | `SplitModule(A)` **Cuentas separadas** (solo agrega): estado en `draft._split` (`people`, `items:[{n,p,q,u,who}]`, `tip` %, `payer` nombre/FUND/`__cada_uno__`, `photo`, `receipt`). Se abre desde Dinero (`sepOpen`, borrador propio `_kind:'sep'` que al guardar crea un gasto) o desde un gasto (`sepFromExpense` → vista dentro de `expenseHTML`; "Listo" deja `draft.split` y el monto con propina). `calc()` reparte cada producto entre sus `who` (sin asignar → entre todos) + propina proporcional; `rt` = pesos enteros que suman exacto. `shares(e)` lo usa `settle()`. Propina por defecto 10% solo si es bar. Lee boletas con `BOL.readPhoto(id)` |
| `worker/` | Cloudflare Worker `viajapp-boletas` (cuenta Cloudflare de mgajardod@utem.cl, subdominio `viajapp.workers.dev`): `index.mjs` (POST /leer, CORS solo app + localhost:8765, verifica token de Firebase RS256 contra las claves de Google, límites en KV `LIMITS` 40/persona/día y 600/día, Gemini `gemini-3.5-flash-lite` → `gemini-flash-lite-latest` → Workers AI `llama-4-scout`; si la suma no cuadra prueba el siguiente y devuelve la que cuadre), `boleta.mjs` (PROMPT + SCHEMA + `readWithGemini` + `check`), `wrangler.toml`. Secreto `GEMINI_API_KEY` (de la variable de entorno de usuario de Windows; nunca en el repo). Publicar: `cd worker; npx wrangler@4 deploy` |
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
expenses: [{ id, amount, cat, desc, date, payer, among?: [nombres], method, docType, docNum, photos: [photoId], notes, created,
            receipt?: { proveedor, razonSocial, rut, detalle, items: [{ orig, nombre, cant, unidad, pUnit, total }], neto, iva, propina, total, model, t },
            split?: { people: [nombres], items: [{ n, p, q, u, who: [nombres] }], tip, t } }]   // cuentas separadas
// payer puede ser "Fondo común"; among solo si se reparte entre algunos (ausente = todos); receipt = boleta leída con IA (analizador)
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
- Cuentas claras: `settle()` reparte cada gasto con `split` según `SEP.shares(e)` (cuentas separadas) y el resto entre `sharersOf(e)` (`among` filtrado a `trip.people`; vacío = todos) y calcula transferencias mínimas (greedy). Devuelve `part` (parte de cada uno) y `partial` (n° de gastos parciales: cambia el texto y muestra "su parte"). Formulario: `amongHTML()` en `#exAmong` (chips `amongAll`/`amongTog`, oculto con Fondo común, `refreshAmong()` al cambiar pagador o monto).

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

### Sesión 11 · 2026-10-22
- El piloto en Temuco funcionó; comentario: la app puede ser **poco intuitiva**. Propuesto: checklist "Primeros pasos" en Inicio, botón "?" con ayuda por pantalla (+ enlace al manual), bienvenida de 3 pantallas, íconos con nombre. Recomendado 1+2; pendiente que el usuario elija y cuente qué les costó.
- El usuario pidió algo **fácil para 10 a 90 años sin saturar la pantalla** y confió el diseño. Hecho ("Ayuda simple", todo en `app.js` junto a `header()`):
  - **Botón ?** (`helpBtn(s)`, ícono `help`) en el encabezado de todas las pantallas (`header()` lo agrega con `ui.tab`; Inicio y `group.js` a mano) → hoja `helpHTML()` con 3 pasos cortos de `HELP[s]` (íconos + texto simple), tamaño de letra, enlace a `manual/#sección` y "Entendido".
  - **Tu próximo paso** en Inicio (`guideHTML()`/`guideSteps()`): un paso a la vez (nombre del viaje → quiénes van → invitar → súper → comida → gasto), se marcan solos según los datos, puntos de progreso, se va al completar. "Ya sé usarla, ocultar guía" (`viajapp-guide`='off' en localStorage, por celular) y se reactiva desde el ? de Inicio. Mientras se ve, oculta el botón "Compartir con mi grupo"; en los pasos 1–2 muestra "¿Te invitaron a un viaje? Únete aquí".
  - **Tamaño de letra** Normal/Grande/Muy grande (`viajapp-font` = 1/1.15/1.3 aplicado con `zoom` en `<html>`, por celular) en el ? y en ⚙️ Viaje (sección "Lectura"). Probado sin scroll horizontal.
  - Prueba `tests/test-help.js` 22/22 (local y publicada); regresión completa OK (among, group, diet-pantry, recipes-view, resp, test2, sync real, join-trip). Manual: "¿No sabes qué hacer? La app te guía" en Primeros pasos (capturas 33–35), 2 FAQ; `shots.js` deja la guía oculta y la fotografía aparte. SW → `viajapp-v13`. Publicado.
  - El `puppeteer-core` del scratchpad se había borrado: se reinstaló (`npm i puppeteer-core@22.15.0` en `scratchpad/e2e`).
- **GitHub**: repo privado **https://github.com/xhorus11/ViajAPP** (rama `main`), autor Matías Gajardo con correo noreply. `gh` instalado (winget, `C:\Program Files\GitHub CLI\gh.exe`) y logueado como xhorus11; `gh auth setup-git` deja a git usar esa sesión. `README.md` y `.gitignore` nuevos (excluye `.claude/`, `.firebase/`, salidas de tests y un PDF personal de una beca que está en la carpeta). Regla nueva en `CLAUDE.md`/`AGENTS.md`: cada cambio termina con commit + push.

### Sesión 12 · 2026-10-23 — PLAN aprobado: Analizador de boletas (aún sin código)
- Idea del usuario: foto de boleta → la app reconoce productos, cantidades y precios → tabla editable → planilla. **Regla del usuario: solo AGREGAR; no modificar funciones existentes** (gastos, dividir, Cuentas claras, `among` quedan iguales).
- Boletas de muestra (viaje Pucón 2025, imágenes enviadas en el chat): restaurante Foods Jorge Isaías #12197 (14 líneas, total $145.530, la suma de líneas cuadra), Unimarc 2202019811 ($54.884, código + nombre abreviado + línea "cant x precio c/u" o peso "0,852 x 1 KG"), Eltit 0032618790 ($24.434, "2.000 X 2.390"). Planilla de referencia "Detalle de Gastos" UTEM: N°, Fecha, Proveedor, Detalle general, N° doc, Monto + total + notas (propinas).
- Decisiones: IA **Gemini Flash (free tier, Google AI Studio)** principal + **Cloudflare Workers AI** (10.000 neuronas/día) respaldo, confirmado con prueba previa. Intermediario **Cloudflare Worker** gratis sin tarjeta (`viajapp-boletas`) que guarda las claves (secretos puestos por el usuario en el panel de Cloudflare, nunca en el chat ni en el repo), verifica la sesión anónima de Firebase y limita lecturas. Planilla **Excel (.xlsx real) o Word (.docx) a elección del usuario** (librerías cargadas bajo demanda en `vendor/`). Reparto por producto → Etapa 4 (después).
- Etapas: **0)** prueba de lectura de las 3 boletas con Gemini y Workers AI vs. el papel (script en tests/) → elegir modelo. **1)** Worker: POST imagen → JSON {proveedor, rut, fecha, nDoc, tipoDoc, items:[{orig, nombre, cant, unidad, pUnit, total}], neto, iva, propina, total, medioPago, detalle}. **2)** App: botón "Leer boleta" junto a la foto del gasto → hoja "Revisa tu boleta" (tabla editable nombre/cantidad/precio, agregar/borrar filas, aviso cuadra/diferencia vs total) → "Usar estos datos" completa monto/fecha/N° doc/proveedor y guarda `items` en el gasto (campo nuevo opcional). **3)** Planilla de gastos tipo UTEM: Excel (hojas Resumen + Detalle) o Word. **4)** (luego) reparto por producto, despensa/lista. Cierre habitual: pruebas, manual, CACHE, deploy, GitHub, CONTEXTO.
- El usuario debe: crear cuenta Cloudflare (dash.cloudflare.com/sign-up) y clave Gemini (aistudio.google.com/app/apikey); `wrangler login` se autoriza en el navegador.

### Sesión 13 · 2026-10-23 — Analizador de boletas IMPLEMENTADO (etapas 0–3)
- Clave Gemini en variable de entorno de usuario `GEMINI_API_KEY` (el usuario mostró la primera en una captura → se rotó). `wrangler` 4 logueado por OAuth (el enlace caduca en ~2 min: generarlo cuando el usuario esté listo). Subdominio workers.dev registrado por API.
- **Etapa 0** (`tests/test-boletas.mjs`): Gemini 3.5 Flash Lite leyó las 3 boletas reales perfectas (~4 s); 3.8 Flash saturado. Workers AI: Llama 4 Scout aceptable (totales bien, a veces no cuadra), Gemma 4 vacío, Mistral JSON roto.
- **Etapa 1** Worker publicado (ver tabla Archivos). `tests/test-worker.mjs`: seguridad (401 sin sesión/token alterado, 403 otro origen, CORS) + 3 boletas → todo cuadra (Unimarc a veces requiere 2.ª lectura automática).
- **Etapa 2** app: `Sync.idToken()` nuevo en sync.js (sesión anónima sin conectar el viaje). En `app.js` solo se agregaron: módulo `BOL`, `if (draft._bol) return BOL.reviewHTML()` en `expenseHTML`, `#bolBox` tras las fotos (se refresca al agregar/quitar fotos), rama `data-change="bolPhoto"`, `clean.receipt` en `saveExpense`, enlace de planilla en Dinero. Nada de gastos/dividir/Cuentas claras cambió.
- **Etapa 3** planilla Excel/Word a elección; validadas abriéndolas con Word y Excel reales (COM) → PDF.
- Pruebas: `tests/test-boletas-app.js` 21/21 (local y publicada, usa el Worker real), regresión completa OK. `shots.js` intercepta el Worker con una respuesta fija (no gasta cuota) y saca capturas 36–41. Manual: "Leer la boleta con IA" y "Planilla de gastos" en Dinero + 2 FAQ. SW → `viajapp-v14` (SHELL con boletas.js, xlsx, jszip). `firebase.json` excluye `worker/**`, README, AGENTS. Publicado.
- Pendiente: **Etapa 4** (reparto por producto, despensa/lista desde la boleta). Ideas: categoría de restaurante a veces sale "comida" en vez de "bar".

### Sesión 14 · 2026-10-26 — Cuentas separadas
- Pedido: en Dinero, "cuentas separadas" para dividir una boleta por persona (lo que consumió cada uno, ej. bar), quitar/agregar personas, propina a elección, nombres y precios editables, boleta de respaldo, fácil de usar.
- Hecho `js/cuentas.js` (ver tabla). Entradas: botón **Cuentas separadas** en Dinero (fila `.money-links` junto a la planilla) y botón en el gasto bajo "Leer boleta". Funciones: foto + lectura IA (o a mano), ¿quiénes estaban? (+ persona externa), chips por producto (uno/varios/Todos), **Separar en N** para líneas con cantidad, propina Sin/10/15/Otro %, ¿quién pagó? (persona/Fondo común/Cada uno lo suyo), resultado por persona y "le devuelven a…", Copiar para WhatsApp, guardar como gasto (desc = local, cat, N°, foto, receipt, split).
- En `app.js` solo se agregó: módulo `SEP`, `if (draft._split) return SEP.html()`, botón en el gasto, `clean.split`, rama `sepPhoto`, fila de enlaces en Dinero, rama en `settle()` para gastos con `split` (los demás igual), "cuentas separadas" en Movimientos. `boletas.js` expone `readPhoto`.
- **Bug del service worker arreglado**: si una descarga fallaba un instante, el SW devolvía `index.html` en lugar del .js → "U is not defined" (app a medio cargar). Ahora reintenta una vez y solo usa la página de respaldo en navegación.
- `.firebaserc` apareció reescrito sin los targets `app`/`legacy` (alguna herramienta de Firebase); se restauró desde git. Revisarlo si un deploy con `hosting:app` falla.
- Pruebas: `tests/test-cuentas.js` 23/23 (local ×4 y publicada; respuesta de IA fija), regresión completa OK (among, help, group, diet-pantry, recipes-view, resp, test2, boletas-app con Worker real, sync real). Manual: sección "Cuentas separadas" (capturas 42–43) + FAQ Dividir vs entre algunos vs separadas. SW → `viajapp-v15`. Publicado.
- El borrado automático de viajes de prueba en Firestore (test-sync deja uno sin miembros) fue bloqueado por permisos: quedó pendiente, consultar al usuario.

### Sesión 15 · 2026-10-29 — Lentitud en la versión web
- Reporte: en el computador la app "va algo pegada". Mediciones (Edge visible en el PC del usuario + trazas de pintado): CPU de Edge ~3%; la GPU ya estaba en 32–36% **sin la app** (dwm 24% + otra pestaña de Chrome); con datos pesados (150 gastos con boletas, 400 de bitácora, 120 en la lista; 306 KB) todas las acciones < 0,15 s salvo la 1.ª apertura de Súper (~0,3 s, diseño de 211 tarjetas; la 2.ª 13 ms).
- **Causa encontrada**: la tarjeta del viaje en Inicio animaba `background-position` (`partyBg`) → el navegador repintaba ~120 veces/s mientras Inicio estaba abierto. Arreglo: el degradado ahora es una capa `.hero::after` (300%×300%) que se mueve con `transform` (`partyMove`, mismo ritmo de 12 s) + `isolation: isolate` y `::before` con `z-index:-1`. Visualmente idéntico (diferencia media 0,5–3/255); repintados en reposo: 0 en todas las pantallas y hojas. `.rl-card` (ruleta, pocos segundos) mantiene `partyBg`.
- Regla: **no animar background-position/box-shadow/tamaños en elementos que quedan en pantalla**; usar `transform`/`opacity`. Scripts de medición en el scratchpad (`perf*.js`: fps, GPU por WMI `Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine`, trazas `Paint`).
- Sin cambios visibles → manual sin cambios. SW → `viajapp-v16`. Publicado y verificado en el sitio.

### Sesión 16 · 2026-10-29 — Logo nuevo
- Logo cambiado a `logo Viajapp v2.png` (perrito viajero). `tests/make_logo_icons.py` reescrito: quita el fondo blanco (flood fill desde los bordes + borde suavizado; conserva letras, nubes y avión), recorta y genera todos los íconos. Revisado en Inicio, carta PDF y PNG de la lista. Manual: textos "león" → "perrito viajero", capturas y PDF regenerados. `firebase.json` excluye `logo Viajapp*.png`. SW → `viajapp-v17`. Publicado.
- Consulta del usuario sobre una licencia MIT "para proteger que la app sea copiada": se le explicó que MIT **permite** copiar, modificar y vender; para proteger corresponde "Todos los derechos reservados" (licencia propietaria). Pendiente su decisión.

### Sesión 17 · 2026-10-29 — Rediseño: temas Día y Noche
- Tirones en el computador: **causa = Chrome del usuario con la aceleración por hardware DESACTIVADA** (Local State `hardware_acceleration_mode.enabled=false`). Medido en Chrome: con aceleración 60 fps y 0 tirones; sin ella 11–12 fps. El usuario la activará (chrome://settings/system). Se agregó FAQ al manual.
- El usuario pidió un diseño más profesional "para vender", con celestes y un color por módulo. Maqueta previa (scratchpad `maqueta/`) con A·Azul profundo y B·Claro celeste → eligió **ambos como temas Noche/Día** a elección.
- Implementado con scripts de transformación (scratchpad `theme_css.py`, `theme_js.py`): tokens por tema, ~70 colores fijos del CSS y los neón del JS (`group.js`, `cuentas.js`, `app.js`) pasados a variables, sin blobs/grain (se quitaron del HTML) ni `backdrop-filter`, punto "en línea" sin animar box-shadow, tarjeta del viaje celeste con halo blanco detrás del logo, saldo índigo, fuentes nuevas, `manifest` y `theme-color` #0a1628. Íconos regenerados con fondo azul marino y brillo celeste/índigo (`make_logo_icons.py`). Manual pasado a la paleta nueva + texto "Apariencia Día o Noche", captura `44-tema-noche`, 2 FAQ (tema y aceleración). `shots.js` acepta `SHOTS_THEME` y `SHOTS_OUT`.
- Pruebas: toda la batería OK (help, among, group, diet-pantry, recipes-view, resp, test2, cuentas, boletas-app con Worker real, join-trip, sync real). Ajustadas 2 pruebas frágiles: join-trip (viaje que cruza de mes) y boletas-app (centrar el gasto antes de tocarlo; el FAB lo tapaba). Verificado en el sitio: Automático sigue al equipo, Día/Noche se aplican al instante y se recuerdan. SW → `viajapp-v18`. Publicado.
- (Exportaciones y licencia resueltas en sesión 18.)

### Sesión 18 · 2026-10-30 — Exportaciones claras, ícono redondo y limpieza
- **Exportaciones en versión clara y formal** (pedido: claro, no oscuro): PNG de la lista con fondo #f2f8fd, tarjetas blancas, texto azul marino, casillas celestes y franja celeste→índigo arriba; PDF (lista, carta financiera, agenda) con cabecera blanca, franja celeste, títulos azul marino, tablas con encabezado azul marino y filas alternas celestes, tarjetas de resumen con tinte suave (constantes `NAVY/MUTED/LINE/ALT/SKY` y `tint()` en export.js); planilla Word con encabezado azul marino y totales celestes.
- **Ícono y logo**: al usuario no le gustó el logo recortado sin el texto con desvanecido (se veía raro en la pantalla de carga del celular). Ahora insignia circular blanca con el logo completo (ver Logo arriba). `logo-mark-256.png` eliminado → `logo-badge.png`; el halo del logo en la tarjeta del viaje se quitó.
- **Licencia**: el usuario decidió **no usar licencia** (repo privado, sin archivo LICENSE).
- **Firestore limpio**: borrados 6 viajes de prueba sin miembros (por REST con el token del CLI, script en el scratchpad `fs-list.js`). Quedan solo "Temuco" (real, 2 miembros) y "Mi viaje" de "prueba" (1 miembro, 12-10).
- Pruebas: test2, help, resp, among OK; exportaciones revisadas a ojo. Manual: capturas y PDF regenerados. SW → `viajapp-v19`. Publicado.
- Luego: **logo oficial definitivo** aplicado (íconos, insignia, PNG/PDF) y **perrito guiñando el ojo** en la tarjeta azul del viaje en vez de repetir el logo (ver Logo arriba); fechas del viaje sin cortarse a mitad (`.nw`). test2/help/join-trip OK (el huérfano de join-trip se borró). SW → `viajapp-v20`. Publicado. Después, a pedido, el perrito quedó sin movimiento (SW → `viajapp-v21`).

### (nota sesión 5)
- El usuario tenía la app en **Vercel**: ya no es necesaria si se publica en Firebase Hosting (recomendado: misma cuenta, dominio ya autorizado). Ojo: los datos locales son por dominio; para pasar datos usar el viaje compartido o Respaldo/Restaurar.
