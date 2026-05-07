# Feature Specification: Ubicación de instrumento

**Feature Branch**: `001-instrument-location-form`  
**Created**: 2026-05-06  
**Status**: Ready for Implementation  
**Input**: User description: "Estandarizar ubicación validada en formulario de instrumento con una sola ubicación y error visible de geocoding"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar ubicación válida (Priority: P1)

Como dueño autenticado de instrumento, quiero seleccionar una ciudad válida desde autocompletado
para guardar una ubicación utilizable en el mapa público.

**Why this priority**: Sin ubicación validada con coordenadas, el instrumento no participa del
flujo principal de descubrimiento.

**Independent Test**: Desde `/instruments/new` o `/instruments/[id]/edit`, el usuario agrega una
única ubicación, selecciona una sugerencia y guarda el instrumento exitosamente.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado en el formulario de instrumento, **When** escribe 2 o más
   caracteres en ciudad y selecciona una sugerencia, **Then** el formulario guarda `city`,
   `country`, `lat`, `lng` y permite guardar.
2. **Given** una ciudad seleccionada, **When** completa barrio/zona opcional y guarda,
   **Then** la ubicación persiste junto al instrumento.

---

### User Story 2 - Bloquear guardado inválido (Priority: P2)

Como dueño autenticado, quiero que el formulario bloquee datos de ubicación inválidos para evitar
instrumentos sin georreferenciación útil.

**Why this priority**: Previene datos inconsistentes que rompen la visibilidad en mapa.

**Independent Test**: El formulario impide guardar si no hay ubicación o si solo hay texto libre
sin coordenadas válidas.

**Acceptance Scenarios**:

1. **Given** que el usuario escribe ciudad pero no selecciona sugerencia, **When** intenta guardar,
   **Then** el formulario bloquea el guardado porque `lat`/`lng` siguen inválidos.
2. **Given** que el usuario no agrega ubicación, **When** intenta guardar, **Then** el formulario
   muestra mensaje de ubicación obligatoria y bloquea el guardado.

---

### User Story 3 - Reintentar ante error de geocoding (Priority: P3)

Como dueño autenticado, quiero ver un error visible cuando falla la búsqueda de ciudades para poder
reintentar sin perder el flujo.

**Why this priority**: Evita fallos silenciosos y reduce abandono del formulario.

**Independent Test**: Si el servicio de sugerencias falla, el usuario ve un mensaje de error y puede
seguir editando/reintentando el campo.

**Acceptance Scenarios**:

1. **Given** una falla en geocoding, **When** el usuario escribe en ciudad, **Then** aparece mensaje
   de error visible y el campo sigue editable.
2. **Given** un error previo, **When** el usuario vuelve a escribir y obtiene sugerencias,
   **Then** puede seleccionar ciudad y continuar normalmente.

---

### Edge Cases

- Si Nominatim no responde, el campo muestra error visible y permite reintento.
- Si hay 0 resultados, se muestra mensaje de “sin resultados” con hint para reformular búsqueda.
- Si el usuario intenta guardar con `lat`/`lng` en `0,0` o no válidos, el guardado se bloquea.
- El formulario debe permitir exactamente una ubicación por instrumento (sin array editable múltiple).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST requerir sesión activa para crear/editar instrumento desde
  `/instruments/new` y `/instruments/[id]/edit`.
- **FR-002**: El formulario MUST permitir agregar exactamente una ubicación por instrumento.
- **FR-003**: El autocompletado de ciudad MUST activarse solo al escribir 2 o más caracteres.
- **FR-004**: Al seleccionar una sugerencia, el sistema MUST cargar automáticamente `city`,
  `country`, `lat`, `lng` en el estado del formulario.
- **FR-005**: El campo barrio/zona MUST ser opcional y aceptar texto libre sin validación adicional.
- **FR-006**: Si geocoding falla, el sistema MUST mostrar un mensaje de error visible en el campo
  de ciudad y permitir reintento inmediato.
- **FR-007**: Si el usuario escribe texto libre sin seleccionar sugerencia, el sistema MUST bloquear
  el guardado por coordenadas inválidas.
- **FR-008**: El sistema MUST bloquear guardado cuando no exista ubicación válida o las coordenadas
  sean `0,0`.
- **FR-009**: El cliente MUST consumir geocoding únicamente vía `/api/geocoding/search`.

### Constitution Alignment *(mandatory for viaSonora)*

- Scope check: fortalece el flujo core de préstamo entre músicos al asegurar ubicaciones útiles para
  descubrimiento; no introduce pagos/chat/red social.
- Domain terms: usa vocabulario canónico (`Instrument`, `InstrumentLocation`, `Post`, `PostStatus`).
- Auth/AuthZ check: el actor es usuario autenticado dueño del recurso en create/edit de instrumento.
- Privacy check: solo ciudad + zona/barrio + coordenadas aproximadas; no dirección exacta.
- i18n check: todos los mensajes/estados visibles se definen en `messages/es.json`,
  `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`.

### Key Entities *(include if feature involves data)*

- **Instrument**: Recurso editable por dueño autenticado; contiene ubicación operativa para publicación.
- **InstrumentLocation**: Ciudad, país, zona opcional y coordenadas aproximadas validadas por selección.
- **GeocodingSuggestion**: Resultado de búsqueda de ciudad usado para poblar campos canónicos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de instrumentos guardados desde este flujo contienen exactamente una ubicación
  válida con coordenadas distintas de `0,0`.
- **SC-002**: En validación funcional, 100% de intentos de guardado con ciudad no seleccionada son
  bloqueados con feedback visible.
- **SC-003**: En validación funcional, 100% de fallas de geocoding muestran error visible y permiten
  reintento sin recargar la página.
- **SC-004**: Al menos 95% de usuarios de prueba completan el registro de ubicación válida en menos
  de 90 segundos.

## Assumptions

- El backend existente de instrumentos mantiene política de usuario autenticado y propiedad del recurso.
- La validación de coordenadas inválidas se considera cumplida cuando no se permite `0,0` ni ausencia de coordenadas.
- El alcance simplifica el formulario a una única ubicación incluso si el modelo soporta varias.
- La precisión geográfica seguirá siendo aproximada según reglas de privacidad del proyecto.
