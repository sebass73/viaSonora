# Feature Specification: Experiencia de primera visita en landing

**Feature Branch**: `002-landing-first-visit`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "Generar una spec para la experiencia de primera visita en la landing de viaSonora"

## Clarifications

### Session 2026-05-06

- Q: ¿Qué acción principal visible debe priorizar la landing cuando el visitante está listo para actuar? → A: Mostrar dos CTAs primarios con igual peso visual: `Registrarme` y `Publicar instrumento`.
- Q: ¿El rediseño de landing puede eliminar funcionalidades existentes del header/shell (login, selector de idioma, theme)? → A: No; deben mantenerse operativas y visibles en esta iteración.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender valor en segundos (Priority: P1)

Como visitante nuevo, quiero comprender en los primeros segundos qué es viaSonora para decidir si sigo explorando o actúo.

**Why this priority**: Si el valor no se entiende de inmediato, el visitante abandona antes de interactuar con los elementos principales.

**Independent Test**: Desde una sesión nueva y sin login, abrir la landing y verificar que nombre, tagline y propuesta de valor son visibles antes de cualquier interacción.

**Acceptance Scenarios**:

1. **Given** un visitante llega por primera vez, **When** la landing termina de renderizar su contenido inicial, **Then** el tagline es el primer texto jerarquizado que comunica el propósito de viaSonora.
2. **Given** un visitante aún no interactúa con la página, **When** observa la vista inicial, **Then** entiende que puede buscar un instrumento para tomar prestado o publicar uno para prestarlo.

---

### User Story 2 - Explorar con buscador y mapa (Priority: P1)

Como visitante (autenticado o no), quiero usar rápidamente buscador y mapa para explorar instrumentos disponibles.

**Why this priority**: Buscador y mapa son el núcleo de descubrimiento; deben dominar visualmente para reducir fricción de exploración.

**Independent Test**: Abrir la landing en desktop y mobile y confirmar que buscador y mapa son los elementos más prominentes y accesibles sin pasos intermedios.

**Acceptance Scenarios**:

1. **Given** un visitante quiere buscar, **When** llega a la landing, **Then** encuentra el buscador de forma inmediata y lo puede usar sin registro.
2. **Given** un visitante quiere explorar visualmente, **When** observa la landing, **Then** el mapa ocupa la mayor área funcional de la pantalla y permite interacción con pins según comportamiento existente.
3. **Given** un visitante usa mobile, **When** abre la landing, **Then** tagline y buscador se muestran arriba y el mapa ocupa el resto de la pantalla disponible.

---

### User Story 3 - Profundizar y actuar (Priority: P2)

Como visitante nuevo, quiero acceder a “Cómo funciona” y luego decidir si registrarme o publicar instrumento.

**Why this priority**: Reduce incertidumbre antes del registro y habilita conversión por dos caminos de valor (pedir prestado o prestar).

**Independent Test**: Desde landing pública, navegar a “Cómo funciona” sin login y volver para iniciar acciones de registro o publicación.

**Acceptance Scenarios**:

1. **Given** un visitante necesita más contexto, **When** selecciona “Cómo funciona”, **Then** accede sin requerir autenticación.
2. **Given** un visitante ya entendió la propuesta, **When** decide actuar, **Then** encuentra acciones claras para registrarse o publicar instrumento.

---

### Edge Cases

- Si el mapa tarda en cargar, se muestra un placeholder animado que conserva el espacio final del mapa y evita saltos de layout.
- Si el visitante entra directamente desde mobile en conexión lenta, el contenido superior (nombre/tagline/buscador) sigue legible y estable mientras el mapa termina de cargar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La landing MUST ser pública y accesible para visitantes autenticados y no autenticados.
- **FR-002**: La landing MUST mostrar nombre de marca y tagline con jerarquía visual inicial para comunicar el valor de viaSonora en primeros segundos.
- **FR-003**: El sistema MUST comunicar explícitamente valor para ambos perfiles: músico que busca instrumento para tomar prestado y músico que quiere prestar el suyo.
- **FR-004**: El buscador MUST estar disponible en la vista inicial y ser visualmente dominante junto al mapa.
- **FR-005**: El mapa de instrumentos MUST ocupar una posición visual dominante en la landing.
- **FR-006**: La disposición mobile MUST presentar tagline y buscador en la parte superior y mapa ocupando el resto del viewport disponible.
- **FR-007**: Mientras el mapa carga, el sistema MUST mostrar un placeholder animado visible que preserve dimensiones y evite layout shift.
- **FR-008**: La landing MUST ofrecer acceso visible a “Cómo funciona” sin exigir registro o inicio de sesión.
- **FR-009**: La landing MUST ofrecer acciones claras para registro y publicación de instrumento una vez comprendido el valor.
- **FR-011**: Cuando el visitante está listo para actuar, la landing MUST mostrar dos CTAs primarios con igual peso visual: `Registrarme` y `Publicar instrumento`.
- **FR-010**: Esta feature MUST respetar el comportamiento actual de interacción del mapa definido en la spec `map-instrument-pins`, limitando cambios a jerarquía visual y presentación en landing.
- **FR-012**: El rediseño de landing MUST preservar las funcionalidades existentes de navegación/shell (incluyendo login, selector de idioma y selector de tema) sin degradar su disponibilidad ni accesibilidad.

### Constitution Alignment *(mandatory for viaSonora)*

- Scope check: refuerza el flujo core de descubrimiento y préstamo de instrumentos entre músicos; no incorpora pagos, red social generalista ni chat en tiempo real.
- Domain terms: mantiene vocabulario canónico (`Instrument`, `Post`, `Category`) para la comunicación funcional de la landing.
- Auth/AuthZ check: la landing y “Cómo funciona” son públicos; no se agregan mutaciones ni permisos nuevos en este alcance.
- Privacy check: no se introducen datos sensibles nuevos ni exposición de ubicación exacta.
- i18n check: toda nueva copy de landing se agrega en `messages/es.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`.

### Key Entities *(include if feature involves data)*

- **VisitanteLanding**: Persona autenticada o no autenticada que llega por primera vez y evalúa si explorar o actuar.
- **MensajeLanding**: Conjunto de textos jerarquizados (nombre, tagline, propuesta de valor, CTAs, “Cómo funciona”).
- **BloqueExploracion**: Región principal de la landing compuesta por buscador y mapa con predominio visual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas moderadas de primera impresión, al menos 90% de visitantes identifica correctamente qué es viaSonora en los primeros 10 segundos.
- **SC-002**: En pruebas de tarea, al menos 95% de visitantes localiza el buscador sin ayuda en menos de 5 segundos desde carga inicial.
- **SC-003**: En mobile, el 100% de pantallas de referencia muestran tagline y buscador por encima del mapa, con el mapa ocupando el resto del alto disponible.
- **SC-004**: Durante carga de mapa, el placeholder evita saltos de layout perceptibles en el 100% de validaciones visuales definidas para la landing.
- **SC-005**: Al menos 90% de visitantes de prueba encuentra el acceso a “Cómo funciona” sin registrarse y completa ese recorrido informativo.

## Assumptions

- El comportamiento funcional del mapa (interacción con pins, selección y detalle) ya está resuelto y no se altera en esta feature.
- La landing actual ya dispone de accesos a registro/publicación que pueden ser rejerarquizados sin redefinir sus flujos.
- La validación de “primer texto visible” se realizará en evaluaciones de UX con criterios acordados por producto.
- No se incluirán módulos fuera de alcance (onboarding guiado, testimonios, métricas de plataforma o personalización por perfil).
