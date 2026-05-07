# Research: Ubicación de instrumento

## Decision 1: Una sola ubicación por instrumento
- Decision: El formulario permite exactamente una ubicación en create/edit.
- Rationale: La spec define alcance explícito y elimina complejidad innecesaria del array actual.
- Alternatives considered:
  - Mantener múltiples ubicaciones: contradice criterio de aceptación y aumenta validaciones.
  - Permitir 0 ubicaciones temporales: rompe el flujo de descubrimiento en mapa.

## Decision 2: Ciudad válida solo por selección de sugerencia
- Decision: El guardado solo es válido cuando `city/country/lat/lng` provienen de una sugerencia seleccionada.
- Rationale: Evita texto libre no georreferenciable y asegura consistencia para mapa.
- Alternatives considered:
  - Aceptar texto libre de ciudad: produce coordenadas inválidas o faltantes.

## Decision 3: Manejo de error de geocoding visible
- Decision: Mostrar mensaje de error visible en el campo ciudad si falla geocoding y mantener campo editable.
- Rationale: Evita fallos silenciosos y permite reintento sin perder contexto.
- Alternatives considered:
  - Error silencioso: degrada UX y dificulta completar formulario.

## Decision 4: Validación de coordenadas
- Decision: Bloquear guardado cuando no exista ubicación o coordenadas inválidas (`0,0` o vacías).
- Rationale: Garantiza que instrumentos guardados puedan ser publicados con ubicación útil.
- Alternatives considered:
  - Permitir guardado parcial: desplaza el error a fases posteriores y rompe consistencia de datos.

## Decision 5: Privacidad de ubicación
- Decision: Persistir ciudad + país + zona opcional + coordenadas aproximadas, nunca dirección exacta.
- Rationale: Cumple principios de privacidad del proyecto y minimiza exposición de datos sensibles.
- Alternatives considered:
  - Dirección exacta o número de calle: viola constitución.
