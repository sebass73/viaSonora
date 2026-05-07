---

description: "Task list for map instrument pins feature"
---

# Tasks: Descubrimiento en mapa

**Input**: Design documents from `/specs/map-instrument-pins/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: La especificacion pide validacion funcional; se incluyen tareas de validacion manual (no se agregan suites automatizadas nuevas en esta feature).

**Organization**: Las tareas se agrupan por user story para permitir implementacion y validacion independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencia directa)
- **[Story]**: US1, US2, US3 para trazabilidad con `spec.md`
- Todas las tareas incluyen ruta de archivo explicita

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar baseline y contexto de trabajo para la feature.

- [X] T001 Revisar y ajustar tipos locales de `Post` para mapa/card en `app/[locale]/page.tsx`
- [X] T002 Revisar y ajustar interfaz `Post` de mapa en `components/map/MapView.tsx`
- [X] T003 [P] Verificar consistencia del contrato documentado en `specs/map-instrument-pins/contracts/map-discovery-api.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reglas base que bloquean el resto de historias si no estan cerradas.

- [X] T004 Consolidar regla de privacidad (coordenadas aproximadas) en `app/api/posts/route.ts`
- [X] T005 Consolidar fallback de geolocalizacion (Navegador -> IP -> Buenos Aires) en `app/[locale]/page.tsx`
- [X] T006 [P] Verificar contrato de fallback geo y respuesta por defecto en `app/api/geo/route.ts`
- [X] T007 Definir criterio de salida funcional en `specs/map-instrument-pins/quickstart.md`

**Checkpoint**: Privacidad, centrado inicial y contratos base listos.

---

## Phase 3: User Story 1 - Ver instrumentos en mapa (Priority: P1) 🎯 MVP

**Goal**: Mostrar pins publicos de instrumentos aprobados para cualquier visitante.

**Independent Test**: Con al menos un `Post` aprobado/no expirado, abrir landing y verificar pins sin iniciar sesion.

### Implementation for User Story 1

- [X] T008 [US1] Asegurar filtro de publicaciones publicas (`APPROVED` y no expiradas) en `app/api/posts/route.ts`
- [X] T009 [US1] Asegurar uso de ubicacion primaria por post en `app/api/posts/route.ts`
- [X] T010 [P] [US1] Renderizar markers solo con coordenadas validas en `components/map/MapView.tsx`
- [X] T011 [US1] Conectar fetch de posts al render del mapa en `app/[locale]/page.tsx`
- [X] T012 [US1] Ejecutar validacion manual de US1 en `specs/map-instrument-pins/quickstart.md`

**Checkpoint**: US1 funcional e independiente (mapa + pins publicos).

---

## Phase 4: User Story 2 - Explorar un pin y abrir su publicacion (Priority: P2)

**Goal**: Permitir seleccion de pin y mostrar card con accion de solicitar.

**Independent Test**: Seleccionar pin y verificar card con foto/titulo/ciudad/solicitar; solicitar navega al detalle del post.

### Implementation for User Story 2

- [X] T013 [P] [US2] Remover `Popup` de Leaflet y mantener seleccion solo por click en marker en `components/map/MapView.tsx`
- [X] T014 [US2] Gestionar estado `selectedPost` y seleccion de marker en `app/[locale]/page.tsx`
- [X] T015 [US2] Renderizar card superpuesta con foto, titulo y ciudad en `app/[locale]/page.tsx`
- [X] T016 [US2] Implementar navegacion desde boton solicitar a `/posts/{id}` en `app/[locale]/page.tsx`
- [X] T017 [US2] Ejecutar validacion manual de US2 en `specs/map-instrument-pins/quickstart.md`

**Checkpoint**: US2 funcional e independiente (seleccion + card + navegacion).

---

## Phase 5: User Story 3 - Cerrar seleccion y volver al estado base (Priority: P3)

**Goal**: Cerrar card y mantener una sola seleccion activa al cambiar de pin.

**Independent Test**: Con card abierta, cerrar limpia seleccion; si se selecciona otro pin, la card previa se reemplaza.

### Implementation for User Story 3

- [X] T018 [US3] Implementar accion de cerrar card (`selectedPost = null`) en `app/[locale]/page.tsx`
- [X] T019 [US3] Implementar reemplazo de seleccion al clickear nuevo pin en `app/[locale]/page.tsx`
- [X] T020 [P] [US3] Validar comportamiento de superposicion de card en mobile en `app/[locale]/page.tsx`
- [X] T021 [US3] Ejecutar validacion manual de US3 en `specs/map-instrument-pins/quickstart.md`

**Checkpoint**: US3 funcional e independiente (cierre + reemplazo de seleccion).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finales de consistencia, accesibilidad y validacion integrada.

- [X] T022 [P] Revisar textos visibles y uso de claves existentes en `messages/es.json`
- [X] T023 [P] Revisar textos visibles y uso de claves existentes en `messages/en.json`
- [X] T024 [P] Revisar textos visibles y uso de claves existentes en `messages/de.json`
- [X] T025 [P] Revisar textos visibles y uso de claves existentes en `messages/fr.json`
- [X] T026 [P] Revisar textos visibles y uso de claves existentes en `messages/it.json`
- [ ] T027 Ejecutar recorrido completo de quickstart y registrar resultado en `specs/map-instrument-pins/quickstart.md`
- [ ] T028 Registrar evidencia de SC-002 con muestra minima de 20 sesiones (>=19/20 con centro <=3s) en `specs/map-instrument-pins/quickstart.md`
- [ ] T029 Registrar evidencia de SC-003 con muestra minima de 10 ejecuciones (>=9/10 en <=20s) en `specs/map-instrument-pins/quickstart.md`
- [ ] T030 Registrar evidencia de SC-004 con muestra minima de 3 viewports mobile (100% con card overlay correcta) en `specs/map-instrument-pins/quickstart.md`
- [X] T031 Documentar decisiones finales en `specs/map-instrument-pins/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> US1 (Phase 3) -> US2 (Phase 4) -> US3 (Phase 5) -> Polish (Phase 6)

### User Story Dependencies

- **US1 (P1)**: Depende de Phase 2; entrega MVP de descubrimiento en mapa.
- **US2 (P2)**: Depende de US1 para pins ya renderizados.
- **US3 (P3)**: Depende de US2 para card/seleccion ya operativas.

### Dependency Graph

```text
T001-T003 -> T004-T007 -> T008-T012 -> T013-T017 -> T018-T021 -> T022-T031
```

---

## Parallel Opportunities

- En **Phase 1**, T003 puede correr en paralelo con T001-T002.
- En **Phase 2**, T006 puede correr en paralelo con T004-T005.
- En **US1**, T010 puede correr en paralelo tras disponibilidad de contrato de datos.
- En **US2**, T013 puede correr en paralelo con T014 antes de integrar la card.
- En **US3**, T020 puede correr en paralelo con T018-T019 una vez implementado estado base.
- En **Polish**, T022-T026 son completamente paralelas por archivo de locale.

### Parallel Example: User Story 1

```bash
Task: "T008 [US1] Asegurar filtro de publicaciones publicas en app/api/posts/route.ts"
Task: "T010 [US1] Renderizar markers con coordenadas validas en components/map/MapView.tsx"
```

### Parallel Example: User Story 2

```bash
Task: "T013 [US2] Remover Popup de Leaflet en components/map/MapView.tsx"
Task: "T014 [US2] Gestionar estado selectedPost en app/[locale]/page.tsx"
```

### Parallel Example: User Story 3

```bash
Task: "T018 [US3] Implementar accion cerrar card en app/[locale]/page.tsx"
Task: "T020 [US3] Validar overlay mobile en app/[locale]/page.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3 (US1).
3. Validar criterio independiente de US1 en quickstart.

### Incremental Delivery

1. Entregar US1 (pins publicos).
2. Sumar US2 (card + solicitar).
3. Sumar US3 (cerrar + reemplazo de seleccion).
4. Ejecutar polish y validacion integral.

### Suggested MVP Scope

- MVP sugerido: **solo User Story 1** (pins publicos sobre mapa con centrado y fallback correctos).
