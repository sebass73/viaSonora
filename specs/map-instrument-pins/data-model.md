# Data Model: Descubrimiento en mapa

## Entity: Post
- Purpose: Unidad publicable que aparece como pin en el mapa de descubrimiento.
- Relevant fields:
  - `id` (String): identificador unico del post.
  - `status` (`PostStatus`): debe ser `APPROVED` para visibilidad publica.
  - `expiresAt` (DateTime): debe ser futura para mantenerse visible.
  - `city` (String): texto de ciudad para la card.
  - `areaText` (String | null): zona opcional para mostrar contexto.
  - `instrumentId` (String): relacion con `Instrument`.
- Relationships:
  - `Post` -> `Instrument` (N:1).
- Validation rules:
  - Solo posts aprobados y no expirados se incluyen en el set de pins.

## Entity: Instrument
- Purpose: Activo musical representado por cada post del mapa.
- Relevant fields:
  - `id` (String): identificador unico.
  - `title` (String): titulo visible en card y popup.
- Relationships:
  - `Instrument` -> `InstrumentPhoto` (1:N).
  - `Instrument` -> `InstrumentLocation` (1:N).
  - `Instrument` -> `Category` (N:1) para contexto de tipo.
- Validation rules:
  - Para mapa se usa foto principal disponible (si existe); ausencia de foto no bloquea card.

## Entity: InstrumentLocation
- Purpose: Coordenadas de referencia para ubicar pins.
- Relevant fields:
  - `instrumentId` (String): FK hacia instrumento.
  - `lat`, `lng` (Float): coordenadas aproximadas para mapa publico.
  - `isPrimary` (Boolean): define ubicacion principal del instrumento.
- Relationships:
  - `InstrumentLocation` -> `Instrument` (N:1).
- Validation rules:
  - Seleccion de pin: usar ubicacion primaria cuando hay multiples ubicaciones.
  - Privacidad: coordenadas publicas deben llegar aproximadas (jitter) desde API publica.

## Entity: SessionGeoContext (derivada de API)
- Purpose: Centro inicial del mapa para experiencia de descubrimiento.
- Source fields:
  - `lat`, `lng` (Number): centro calculado.
  - `city`, `country` (String | undefined): contexto de fallback por IP.
- Resolution order:
  1. Geolocalizacion navegador.
  2. Fallback IP (`/api/geo`).
  3. Buenos Aires por defecto.

## State and Interaction Model
- Card state:
  - `selectedPost = null`: mapa sin seleccion.
  - `selectedPost = postId`: card visible para ese pin.
- Popup state:
  - Sin popup de mapa en estado de seleccion (solo card superpuesta).
- Transition rules:
  - Click en pin sin seleccion -> abre card del pin.
  - Click en pin con card abierta -> reemplaza por nueva card.
  - Click en "cerrar" -> vuelve a `selectedPost = null`.
