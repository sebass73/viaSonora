# Data Model: Ubicación de instrumento

## Entity: Instrument
- Purpose: Recurso editable por dueño autenticado.
- Relevant fields:
  - `id` (String)
  - `ownerId` (String)
  - Metadatos del instrumento (título, categoría, etc.)
- Relationships:
  - `Instrument` -> `InstrumentLocation` (1:1 funcional en este alcance de formulario)

## Entity: InstrumentLocation
- Purpose: Ubicación estandarizada para disponibilidad del instrumento.
- Relevant fields:
  - `instrumentId` (String)
  - `city` (String)
  - `country` (String | null)
  - `areaText` (String | null)
  - `lat` (Float)
  - `lng` (Float)
- Validation rules:
  - Ciudad obligatoria por selección de sugerencia
  - `lat/lng` obligatorios y distintos de `0,0`
  - `areaText` opcional y libre

## Entity: GeocodingSuggestion
- Purpose: Representa una opción retornada por geocoding para poblar campos canónicos.
- Relevant fields:
  - `city` (String)
  - `country` (String)
  - `lat` (Float)
  - `lng` (Float)

## State Model (Formulario)
- `Idle`: campo vacío o sin interacción.
- `Loading`: consulta de sugerencias en progreso (spinner visible).
- `Suggestions`: lista de sugerencias disponible.
- `NoResults`: sin resultados, con hint visible.
- `Error`: fallo de geocoding con mensaje visible y campo editable.
- `Selected`: ciudad seleccionada y coordenadas cargadas; guardado habilitable.
