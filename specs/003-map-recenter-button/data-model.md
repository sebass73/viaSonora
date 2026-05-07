# Data Model: Recentrar mapa en ubicacion del usuario

## Entity: MapControlAction
- Purpose: Representa acciones flotantes del mapa relacionadas con exploracion.
- Attributes:
  - `type` (`filter` | `recenter`)
  - `status` (`idle` | `loading` | `error`)
  - `disabled` (Boolean)
- Rules:
  - `recenter` pasa a `loading` durante resolucion de ubicacion.
  - En `loading`, `disabled` debe ser `true` para evitar solicitudes concurrentes.

## Entity: UserApproxLocation
- Purpose: Coordenadas de referencia para centrar mapa sin exponer direccion exacta.
- Attributes:
  - `source` (`browser` | `ip`)
  - `lat` (Float)
  - `lng` (Float)
  - `resolved` (Boolean)
- Rules:
  - Prioridad: `browser` sobre `ip`.
  - Si ninguna fuente resuelve, se conserva el centro actual.

## Entity: MapViewState
- Purpose: Estado funcional de exploracion que no debe perderse al recentrar.
- Attributes:
  - `center` ([lat, lng])
  - `selectedCategoryId` (String | null)
  - `selectedPostId` (String | null)
  - `isFilterOpen` (Boolean)
- Rules:
  - Recentrar solo modifica `center`.
  - `selectedCategoryId` y `selectedPostId` deben persistir tras la accion.

## State Model (Recentrado)
- `Idle`: boton habilitado, sin operacion activa.
- `Loading`: boton deshabilitado, resolviendo ubicacion.
- `Resolved`: centro actualizado por fuente valida.
- `FallbackResolved`: centro actualizado por fallback IP.
- `Failed`: centro sin cambios y feedback breve no tecnico.
