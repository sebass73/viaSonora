# Feature Specification: Descubrimiento en mapa

**Feature Branch**: `001-map-instrument-pins`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "Visualizar pins de instrumentos en el mapa de la landing con card de detalle y fallback de geolocalizacion"

## Clarifications

### Session 2026-05-06

- Q: ?Que prioridad de fallback debe usar el centrado inicial del mapa? -> A: Navegador -> IP (`/api/geo`) -> Buenos Aires.
- Q: ?Como se representa un instrumento con multiples ubicaciones en el mapa? -> A: Unico pin usando ubicacion primaria.
- Q: ?Que pasa si el usuario selecciona otro pin con una card abierta? -> A: Se reemplaza la card por la nueva seleccion.
- Q: ?Al seleccionar pin debe mostrarse popup de Leaflet ademas de la card? -> A: No; solo card, sin popup blanco.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver instrumentos en mapa (Priority: P1)

Como visitante de viaSonora, quiero entrar a la landing y ver pins de publicaciones de
instrumentos para descubrir opciones cercanas de forma inmediata.

**Why this priority**: Es el flujo principal de descubrimiento para conectar oferta y demanda de
prestamos entre musicos.

**Independent Test**: Con publicaciones aprobadas existentes, al abrir la landing se visualizan pins
en el mapa sin necesidad de autenticacion.

**Acceptance Scenarios**:

1. **Given** que existen publicaciones aprobadas activas, **When** un visitante abre la landing,
   **Then** ve pins de instrumentos en el mapa.
2. **Given** que un visitante no inicio sesion, **When** abre la landing, **Then** igualmente ve el
   mapa y los pins publicos.

---

### User Story 2 - Explorar un pin y abrir su publicacion (Priority: P2)

Como visitante, quiero seleccionar un pin y ver una card resumida para decidir rapido si quiero
solicitar ese instrumento.

**Why this priority**: Convierte la exploracion visual en una accion concreta hacia la publicacion.

**Independent Test**: Al seleccionar cualquier pin visible, aparece una card con informacion minima
y acciones de solicitar/cerrar.

**Acceptance Scenarios**:

1. **Given** que un pin es seleccionado, **When** se abre la card, **Then** muestra foto, titulo,
   ciudad, boton "solicitar" y boton "cerrar".
2. **Given** que la card esta visible, **When** el visitante presiona "solicitar", **Then** navega a
   la publicacion del instrumento.

---

### User Story 3 - Cerrar seleccion y volver al estado base (Priority: P3)

Como visitante, quiero cerrar la card para limpiar la vista y continuar explorando el mapa.

**Why this priority**: Mantiene control simple del estado de exploracion, especialmente en mobile.

**Independent Test**: Con una card abierta, al presionar "cerrar" desaparece y el mapa queda sin
seleccion activa.

**Acceptance Scenarios**:

1. **Given** que hay una card abierta por un pin seleccionado, **When** el visitante presiona
   "cerrar", **Then** la card desaparece y no queda pin seleccionado.

---

### Edge Cases

- El usuario niega geolocalizacion del navegador: el mapa usa fallback por IP y, si no hay datos,
  inicia en Buenos Aires.
- El navegador no soporta geolocalizacion: el mapa usa fallback por IP y, si no hay datos,
  inicia en Buenos Aires.
- No hay publicaciones visibles en la zona o no hay publicaciones aprobadas activas:
  el mapa queda sin pins y sin mensaje adicional.
- Un pin sin foto disponible: la card mantiene titulo, ciudad y acciones para no bloquear la
  navegacion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar en la landing un mapa accesible para cualquier visitante,
  autenticado o no autenticado.
- **FR-002**: El sistema MUST intentar centrar inicialmente el mapa con la ubicacion del visitante.
- **FR-003**: Si la geolocalizacion del dispositivo falla, es denegada o no esta disponible,
  el sistema MUST aplicar este orden de fallback: geolocalizacion por IP y, de no obtener resultado
  valido, centrado en Buenos Aires.
- **FR-004**: El sistema MUST mostrar pins exclusivamente para publicaciones activas y aprobadas.
- **FR-004a**: Cuando un instrumento tenga multiples ubicaciones, el sistema MUST mostrar un
  unico pin usando su ubicacion primaria.
- **FR-005**: Al seleccionar un pin, el sistema MUST mostrar una card con foto (si existe),
  titulo del instrumento, ciudad, boton "solicitar" y boton "cerrar".
- **FR-005a**: Al seleccionar un pin, el sistema MUST mostrar unicamente la card superpuesta;
  no MUST mostrarse popup/recuadro adicional del mapa con nombre, tipo o ubicacion.
- **FR-006**: Al presionar "solicitar", el sistema MUST navegar a la pagina de detalle de la
  publicacion asociada al pin.
- **FR-007**: Al presionar "cerrar", el sistema MUST limpiar la seleccion actual y ocultar la card.
- **FR-007a**: Si el visitante selecciona un nuevo pin con una card ya abierta, el sistema MUST
  reemplazar la seleccion previa y mostrar la card del nuevo pin.
- **FR-008**: En mobile, el sistema MUST priorizar el mapa como vista principal y mostrar la card
  superpuesta cuando exista una seleccion.
- **FR-009**: Esta feature MUST mantener fuera de alcance el clustering de pins, el filtrado por
  desplazamiento del mapa y el calculo de radio de distancia al usuario.

### Constitution Alignment *(mandatory for viaSonora)*

- **Scope check**: La feature refuerza el flujo core de descubrimiento de instrumentos para
  prestamos entre musicos y no introduce pagos, chat en tiempo real ni funciones de red social.
- **Domain terms**: Se usa vocabulario canonico de dominio: `Post`, `Instrument` y estado
  `PostStatus.APPROVED` para visibilidad publica.
- **Auth/AuthZ check**: El flujo es publico de lectura; no agrega mutaciones ni requiere permisos
  de usuario o staff.
- **Privacy check**: Se respetan reglas de la constitucion (seccion V): ubicacion aproximada
  unicamente, sin direccion exacta ni coordenadas precisas de origen.
- **i18n check**: Esta feature usa claves de traduccion para acciones visibles y contempla
  la clave `close` en `messages/es.json`, `messages/en.json`, `messages/de.json`,
  `messages/fr.json`, `messages/it.json`.

### Key Entities *(include if feature involves data)*

- **Post**: Publicacion visible en mapa cuando esta aprobada y activa; aporta ciudad y referencia
  al instrumento.
- **Instrument**: Activo asociado al post; aporta titulo, fotos y ubicacion aproximada usada
  para posicionar el pin.
- **InstrumentLocation**: Ubicacion aproximada del instrumento mostrada al publico para
  descubrimiento geoespacial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas funcionales, el 100% de pins visibles corresponden a publicaciones
  aprobadas y activas.
- **SC-002**: Al menos 95% de visitas a la landing visualizan el mapa centrado en una ubicacion
  valida (usuario, IP o Buenos Aires) dentro de los primeros 3 segundos.
- **SC-003**: En pruebas de usabilidad, al menos 90% de usuarios completan el flujo
  "seleccionar pin -> ver card -> abrir publicacion" en menos de 20 segundos.
- **SC-004**: En pruebas mobile, el 100% de casos con pin seleccionado muestran la card
  superpuesta sin ocultar totalmente el contexto del mapa.

## Assumptions

- Existen publicaciones aprobadas y activas en ambientes de prueba para validar pins.
- El comportamiento de "sin resultados" permanece intencionalmente silencioso (sin empty state).
- El fallback por IP se mantiene como apoyo de geolocalizacion inicial, no como garantia de
  precision.
- La privacidad de ubicacion aproximada definida en la constitucion permanece obligatoria para
  cualquier cambio futuro del mapa.
