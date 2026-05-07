# Quickstart: Ubicación de instrumento

## Objetivo
Validar que el formulario de instrumento guarde exactamente una ubicación válida y muestre errores de geocoding de forma visible.

## Precondiciones
- Usuario autenticado.
- Acceso a `/instruments/new` o `/instruments/[id]/edit`.

## Flujo principal
1. Completar datos base del instrumento.
2. Clic en "Agregar ubicación".
3. Escribir 2+ caracteres en ciudad.
4. Seleccionar una sugerencia.
5. Verificar carga automática de `city`, `country`, `lat`, `lng`.
6. (Opcional) completar barrio/zona.
7. Guardar y verificar persistencia.

## Validaciones clave
- El formulario permite una única ubicación.
- Sin selección de sugerencia, el guardado se bloquea.
- Sin ubicación, el guardado se bloquea con mensaje obligatorio.
- Si geocoding falla, se muestra error visible y se puede reintentar.

## Resultado esperado
- Instrumento guardado solo cuando existe una ubicación válida con coordenadas distintas de `0,0`.
