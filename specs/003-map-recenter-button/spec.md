# Feature Specification: Recentrar mapa en ubicacion del usuario

**Feature Branch**: `003-map-recenter-button`  
**Created**: 2026-05-07  
**Status**: Draft  
**Input**: User description: "Quiero modificar la spec existente de `specs/map-instrument-pins/spec.md` para agregar una accion rapida que recentre el mapa en la ubicacion del usuario, manteniendo comportamiento actual de pins/cards y filtros."

## Clarifications

### Session 2026-05-07

- Q: Si fallan geolocalizacion y fallback por IP, ¿que centro debe conservar el mapa? → A: Mantener el centro actual del mapa.
- Q: ¿Como manejar taps repetidos durante recentrado? → A: Deshabilitar el boton de recentrado mientras este en estado de carga.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recentrar rapidamente el mapa (Priority: P1)

Como visitante de la landing, quiero un boton junto al filtro para centrar el mapa en mi ubicacion y explorar instrumentos cercanos sin navegar manualmente.

**Why this priority**: Es la mejora principal pedida y reduce friccion inmediata en el flujo de exploracion.

**Independent Test**: Abrir la landing, tocar el nuevo boton de recentrado y verificar que el mapa cambia su centro a la ubicacion obtenida sin afectar pins o filtros.

**Acceptance Scenarios**:

1. **Given** un visitante en la landing, **When** toca el boton de recentrado y el navegador entrega geolocalizacion valida, **Then** el mapa se centra en esas coordenadas.
2. **Given** un visitante con filtros activos, **When** recentra el mapa, **Then** los filtros activos y la seleccion de categoria se mantienen sin reinicio.

---

### User Story 2 - Mantener exploracion estable ante fallos (Priority: P2)

Como visitante, quiero que el recentrado tenga fallback y feedback claro para no perder continuidad si falla geolocalizacion.

**Why this priority**: Evita que la nueva accion degrade la experiencia en dispositivos con permisos denegados o geolocalizacion inestable.

**Independent Test**: Denegar geolocalizacion y confirmar fallback por IP; si tambien falla, el mapa sigue operativo con centro actual y feedback breve.

**Acceptance Scenarios**:

1. **Given** geolocalizacion denegada o fallida, **When** el visitante toca recentrar, **Then** el sistema intenta centrar por ubicacion aproximada de IP.
2. **Given** fallo de geolocalizacion y de fallback por IP, **When** el visitante toca recentrar, **Then** el mapa mantiene centro actual y muestra feedback breve no tecnico.

---

### User Story 3 - Conservar usabilidad mobile y desktop (Priority: P3)

Como visitante en desktop o mobile, quiero que el nuevo boton se vea y funcione junto al de filtros sin solapamientos que impidan uso.

**Why this priority**: Protege la accesibilidad y evita regresiones visuales en la zona critica de controles del mapa.

**Independent Test**: Verificar en desktop y mobile que existen dos botones flotantes contiguos (filtro y recentrado), con estados visuales claros y sin bloquear interacciones.

**Acceptance Scenarios**:

1. **Given** vista desktop o mobile, **When** carga la landing, **Then** se muestran dos botones flotantes con estilo coherente y accion independiente.
2. **Given** que el boton de recentrado esta obteniendo ubicacion, **When** se observa el control, **Then** refleja estado de carga hasta completar o fallar.

---

### Edge Cases

- Usuario rechaza permiso de ubicacion en el navegador.
- Geolocalizacion devuelve coordenadas invalidas o fuera de rango esperado.
- Fallback por IP no disponible temporalmente.
- Reintentos rapidos sobre el boton de recentrado mientras ya existe una solicitud en curso.
- Vista mobile con ancho reducido: los botones no deben superponerse ni ocultar acciones criticas del mapa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La landing MUST mostrar un segundo boton flotante de recentrado junto al boton de filtros existente, con estilo visual consistente.
- **FR-002**: Al activar recentrado, el sistema MUST intentar obtener ubicacion del navegador y centrar el mapa cuando la obtencion sea exitosa.
- **FR-003**: Si geolocalizacion falla o es denegada, el sistema MUST intentar centrar con ubicacion aproximada por IP.
- **FR-004**: Si tambien falla el fallback por IP, el sistema MUST mantener el centro actual sin romper interaccion del mapa.
- **FR-005**: El boton de recentrado MUST mostrar estado de carga mientras la ubicacion se resuelve.
- **FR-006**: Ante fallo de recentrado, el sistema MUST mostrar feedback breve y claro, sin mensajes tecnicos.
- **FR-007**: La accion de recentrado MUST preservar filtros activos, seleccion de categoria y comportamiento actual de pins/cards.
- **FR-008**: El boton de filtros existente MUST mantenerse intacto en funcionalidad y disponibilidad.
- **FR-009**: El comportamiento del recentrado MUST ser consistente en desktop y mobile, evitando solapamientos criticos de controles.
- **FR-010**: Todo texto nuevo visible asociado al recentrado MUST estar disponible en `es`, `en`, `de`, `fr`, `it`.
- **FR-011**: Mientras el recentrado este en progreso, el boton MUST quedar temporalmente deshabilitado para evitar solicitudes concurrentes.

### Constitution Alignment *(mandatory for viaSonora)*

- Scope check: mejora el descubrimiento de instrumentos en mapa y no introduce pagos, chat en tiempo real ni red social generalista.
- Domain terms: mantiene vocabulario canonico de la plataforma y no redefine entidades de negocio.
- Auth/AuthZ check: la funcionalidad es de exploracion publica; no agrega mutaciones ni cambios de permisos.
- Privacy check: usa ubicacion aproximada para recentrar y no expone direccion exacta.
- i18n check: cualquier texto nuevo de estado o error del boton de recentrado se agrega en `messages/es.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`.

### Key Entities *(include if feature involves data)*

- **MapControlAction**: Accion de UI sobre el mapa (filtro o recentrado) con estado visual (`idle`, `loading`, `error`).
- **UserApproxLocation**: Coordenadas de referencia para recentrado obtenidas por geolocalizacion del navegador o fallback de IP.
- **MapViewState**: Estado funcional del mapa (centro actual, filtros activos, pin seleccionado) que debe preservarse al recentrar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos 95% de intentos de recentrado completan centrado util en menos de 3 segundos en condiciones de red estandar.
- **SC-002**: En validacion funcional, 100% de escenarios con permiso denegado mantienen el mapa operativo y muestran feedback claro.
- **SC-003**: En validacion de regresion, 100% de pruebas confirman que filtros y seleccion de categoria permanecen intactos tras recentrar.
- **SC-004**: En validacion responsive, 100% de vistas de referencia desktop y mobile muestran ambos botones sin solapamientos criticos.

## Assumptions

- El endpoint de ubicacion por IP ya existe y continua disponible para fallback.
- El mapa ya soporta cambio de centro en tiempo de ejecucion sin reinicializar estado completo.
- La landing mantiene el boton de filtros como control base al que se le agrega el nuevo boton contiguo.
- El usuario puede revocar o denegar permisos de geolocalizacion en cualquier momento y la experiencia debe seguir siendo util.
- Esta especificacion extiende el comportamiento definido en `specs/map-instrument-pins/spec.md` en lugar de reemplazarlo.
