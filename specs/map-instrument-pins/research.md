# Research: Descubrimiento en mapa

## Decision 1: Orden de centrado inicial del mapa
- Decision: Priorizar geolocalizacion del navegador, luego fallback por IP (`/api/geo`) y por ultimo Buenos Aires.
- Rationale: Mantiene la mejor precision posible para el usuario, evita bloquear la experiencia cuando se deniega permiso y respeta el flujo ya implementado en landing.
- Alternatives considered:
  - Navegador -> Buenos Aires directo: descarta una mejora util de precision disponible por IP.
  - IP primero: reduce precision cuando el navegador si permite ubicacion.

## Decision 2: Elegibilidad de pins publicos
- Decision: Mostrar solo `Post` con estado `APPROVED` y no expirados.
- Rationale: Alinea descubrimiento con moderacion y evita exponer contenido no aprobado o vencido.
- Alternatives considered:
  - Incluir `PENDING_APPROVAL`: viola reglas de moderacion.
  - Incluir todos los estados: genera ruido y posibles exposiciones no deseadas.

## Decision 3: Privacidad de ubicacion en pins
- Decision: Consumir coordenadas publicas aproximadas ya tratadas con jitter en `/api/posts`.
- Rationale: Cumple constitucion (no ubicacion exacta) y evita exponer lat/lng precisos de usuarios o instrumentos.
- Alternatives considered:
  - Coordenadas exactas: incumple privacidad del producto.
  - Ocultar completamente ubicaciones: rompe el flujo principal de descubrimiento.

## Decision 4: Multiples ubicaciones por instrumento
- Decision: Representar cada `Post` con un unico pin usando la ubicacion primaria del instrumento.
- Rationale: Reduce complejidad visual y evita ambiguedad de seleccion para la card en el alcance actual.
- Alternatives considered:
  - Un pin por ubicacion: aumenta ruido y cambia alcance funcional.
  - Ubicacion aleatoria: comportamiento no deterministico y dificil de validar.

## Decision 5: Seleccion de pin con card abierta
- Decision: Reemplazar la card actual por la del nuevo pin seleccionado.
- Rationale: Mantiene una sola seleccion activa y mejora usabilidad mobile sin acumulacion de overlays.
- Alternatives considered:
  - Bloquear nuevos clicks: friccion innecesaria de exploracion.
  - Multiples cards simultaneas: complejiza estado y layout.

## Decision 6: Presentacion visual al seleccionar un pin
- Decision: Mostrar solo la card superpuesta del post; no mostrar popup/recuadro blanco de Leaflet.
- Rationale: Evita duplicidad de informacion (popup + card), simplifica la interaccion y mantiene foco en la accion de solicitar/cerrar.
- Alternatives considered:
  - Popup + card simultaneos: ruido visual y experiencia redundante.
  - Solo popup sin card: pierde CTA principal y consistencia con el flujo definido.
