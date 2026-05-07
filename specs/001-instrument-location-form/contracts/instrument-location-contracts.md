# Contracts: Instrument Location Form

## 1) Geocoding Autocomplete

### Endpoint
- `GET /api/geocoding/search?q=<query>`

### Consumer
- Formulario de instrumento (`/instruments/new`, `/instruments/[id]/edit`).

### Input Rules
- Se consulta solo con `q` de longitud >= 2.

### Output Contract (conceptual)
- Lista de sugerencias con:
  - `city`
  - `country`
  - `lat`
  - `lng`

### Error Contract
- Si el servicio falla, el cliente recibe señal de error y muestra mensaje visible en el campo.

## 2) Instrument Save (Create/Edit)

### Endpoints
- `POST /api/instruments`
- `PUT /api/instruments/[id]`

### Auth Contract
- Requiere sesión activa; sin sesión retorna `401`.

### Location Validation Contract
- Debe enviarse exactamente una ubicación válida en el formulario.
- Guardado bloqueado si faltan coordenadas válidas o quedan en `0,0`.
- `areaText` es opcional.

## Non-Goals Enforced by Contract
- Sin múltiples ubicaciones por instrumento en este flujo.
- Sin preview de pin en mapa durante selección.
- Sin edición manual de coordenadas.
- Sin filtro de geocoding por país/región fija.
