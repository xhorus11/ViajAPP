# Viajapp · Organizador de viajes

App web instalable (PWA) pensada para celular. Funciona sin internet una vez instalada y guarda todo en el propio teléfono.

## Módulos
- **Súper**: catálogo de unas 200 productos en 18 categorías, con variantes (ej. Aceite → Maravilla, Oliva…), cantidades, buscador, productos y variantes personalizadas. "Mi lista" permite marcar lo comprado y exportar en **PNG** o **PDF**, o compartirla.
- **Recetas**: 87 recetas con 282 variantes (ej. Pastas → boloñesa, pesto, crema, carbonara…). Eliges variante y personas, desmarcas lo que ya tienes y los ingredientes pasan a la lista del súper con su cantidad. Se pueden agendar y son totalmente editables (crear, editar, ocultar, restaurar).
- **Dinero**: "Cuentas claras" calcula quién le debe a quién (sin contar lo pagado con el Fondo común). Además: fondos asignados, saldo y % usado, gastos por categoría y por persona, fotos de boletas (cámara o galería), calculadora para dividir cuentas con propina. Exporta la **carta financiera / rendición en PDF** (con anexo de comprobantes) y un **CSV para Excel**.
- **Agenda**: calendario mensual con desayunos, almuerzos, onces, cenas, picoteos y actividades, con horario, lugar y encargado. Exporta la agenda en PDF.
- **⚙️ Configuración**: datos del viaje, participantes, moneda, entidad y responsable (aparecen en la carta). Respaldo y restauración en JSON para pasar los datos a otro celular.

## Probarla en el computador
```
python -m http.server 8765
```
Luego abre http://localhost:8765

## Usarla en el celular (recomendado)
Necesita estar publicada en HTTPS para instalarse y funcionar sin conexión. La forma más rápida y gratuita:
1. Entra a https://app.netlify.com/drop
2. Arrastra **esta carpeta completa**.
3. Abre el enlace que te entrega en el celular:
   - **Android (Chrome)**: menú ⋮ → *Instalar app* (o el botón "Instalar Viajapp" dentro de la app).
   - **iPhone (Safari)**: botón Compartir → *Agregar a pantalla de inicio*.

También sirve GitHub Pages, Vercel o Cloudflare Pages: la app es estática y no requiere compilación.

## Notas
- Los datos viven en cada teléfono (no se sincronizan solos entre personas). Para compartirlos usa ⚙️ → Respaldo / Restaurar.
- Estructura: `index.html`, `css/styles.css`, `js/data.js` (catálogo, edítalo para agregar productos), `js/store.js` (datos), `js/export.js` (PNG/PDF/CSV), `js/app.js` (interfaz), `sw.js` (modo sin conexión).
