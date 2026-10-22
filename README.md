# ViajAPP

Organizador de viajes en grupo, pensado para el celular: lista del súper con catálogo y variantes, recetas que llenan la lista, despensa de la cabaña, dietas y alergias, gastos con fotos de boletas, cuentas claras y carta financiera en PDF, agenda de comidas, ¿quién lleva qué?, piezas y camas, y bitácora. Todo el grupo ve lo mismo en tiempo real.

- **App:** https://viajapp-trip.web.app
- **Manual de uso:** https://viajapp-trip.web.app/manual/

## Tecnología
- HTML, CSS y JavaScript sin build (PWA instalable, funciona sin conexión con `sw.js`).
- Datos locales (`localStorage` + IndexedDB) y viaje compartido con Firebase (Auth anónima + Firestore, plan gratuito).
- Exportaciones con html2canvas y jsPDF (en `vendor/`).

## Correr en local
```
python -m http.server 8765
```
y abrir http://localhost:8765.

## Publicar
```
firebase deploy --only hosting:app --project viajapp-e589e
```
Antes, subir `CACHE` en `sw.js` para que los celulares tomen la versión nueva.

## Documentación interna
- `CONTEXTO.md`: arquitectura, modelo de datos, decisiones e historial de cambios.
- `tests/LEEME.md`: pruebas automáticas y cómo regenerar el manual.

Autor: Matías Gajardo ([@xhorus11](https://github.com/xhorus11))
