# Quickstart: Experiencia de primera visita en landing

## Objetivo
Validar que la landing comunique valor en segundos, priorice buscador/mapa y preserve funcionalidades existentes del shell.

## Precondiciones
- Aplicación corriendo localmente.
- Verificación en desktop y mobile.
- Prueba con usuario no autenticado y autenticado.

## Flujo principal
1. Abrir landing sin sesión.
2. Verificar que el primer texto jerarquizado sea el tagline.
3. Confirmar que buscador y mapa sean visualmente dominantes.
4. Mientras carga el mapa, validar placeholder animado sin saltos de layout.
5. Verificar acceso a “Cómo funciona” sin registro.
6. Confirmar visibilidad de CTAs primarios: `Registrarme` y `Publicar instrumento`.

## Validaciones mobile
1. Abrir landing en viewport mobile.
2. Confirmar tagline y buscador arriba.
3. Confirmar mapa ocupando el resto del alto disponible.

## Validaciones de no-regresión
- Login permanece visible y funcional.
- Selector de idioma permanece visible y funcional.
- Selector de tema permanece visible y funcional.
- Interacción de mapa/pins se mantiene según spec `map-instrument-pins`.

## Resultado esperado
- Visitante entiende qué es viaSonora rápidamente y puede explorar o actuar sin fricción.
