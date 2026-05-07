---

description: "Task list for map recenter button feature"
---

# Tasks: Recentrar mapa en ubicacion del usuario

**Input**: Design documents from `/specs/003-map-recenter-button/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Validacion funcional/manual segun `quickstart.md`; no se solicita suite automatizada nueva.

**Organization**: Tareas agrupadas por user story para implementacion y validacion independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencia directa)
- **[Story]**: US1, US2, US3 para trazabilidad con `spec.md`
- Todas las tareas incluyen ruta explicita

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verificar baseline de landing y mapa antes de agregar el control de recentrado.

- [X] T001 Revisar estado actual de controles flotantes del mapa en `app/[locale]/page.tsx`
- [X] T002 [P] Revisar flujo de centro inicial y fallback por IP en `app/[locale]/page.tsx`
- [X] T003 [P] Revisar comportamiento actual de interaccion de pins/cards en `components/map/MapView.tsx`
- [X] T004 Verificar claves i18n existentes de estados de mapa en `messages/es.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preparar estado base del control de recentrado y contratos de no-regresion.

- [X] T005 Definir estado local del control de recentrado (`idle/loading/error`) en `app/[locale]/page.tsx`
- [X] T006 Implementar guarda de concurrencia para deshabilitar boton durante `loading` en `app/[locale]/page.tsx`
- [X] T007 Definir helper de recentrado con prioridad navegador -> IP en `app/[locale]/page.tsx`
- [X] T008 [P] Agregar claves i18n de loading/error de recentrado en `messages/es.json`
- [X] T009 [P] Agregar claves i18n de loading/error de recentrado en `messages/en.json`
- [X] T010 [P] Agregar claves i18n de loading/error de recentrado en `messages/de.json`
- [X] T011 [P] Agregar claves i18n de loading/error de recentrado en `messages/fr.json`
- [X] T012 [P] Agregar claves i18n de loading/error de recentrado en `messages/it.json`

**Checkpoint**: Base de estado + i18n lista para implementar historias sin ambiguedades.

---

## Phase 3: User Story 1 - Recentrar rapidamente el mapa (Priority: P1) 🎯 MVP

**Goal**: Permitir recentrar mapa desde un nuevo boton flotante junto al filtro.

**Independent Test**: En landing, tocar `recentrar` con permiso habilitado y confirmar que el centro del mapa cambia a ubicacion del usuario sin reiniciar filtros.

### Implementation for User Story 1

- [X] T013 [US1] Renderizar segundo boton flotante de recentrado junto al boton de filtros en `app/[locale]/page.tsx`
- [X] T014 [US1] Conectar accion del boton para obtener geolocalizacion del navegador y recenter en `app/[locale]/page.tsx`
- [X] T015 [P] [US1] Reflejar estado visual de `loading` y deshabilitado del boton de recentrado en `app/[locale]/page.tsx`
- [ ] T016 [US1] Validar manualmente flujo principal de US1 en `specs/003-map-recenter-button/quickstart.md`

**Checkpoint**: US1 funcional e independiente.

---

## Phase 4: User Story 2 - Mantener exploracion estable ante fallos (Priority: P2)

**Goal**: Aplicar fallback por IP y mantener centro actual cuando fallan ambas fuentes.

**Independent Test**: Denegar geolocalizacion, verificar fallback por IP y, ante doble fallo, comprobar que el centro actual se conserva con feedback breve.

### Implementation for User Story 2

- [X] T017 [US2] Implementar fallback por IP usando `/api/geo` cuando falle geolocalizacion en `app/[locale]/page.tsx`
- [X] T018 [US2] Implementar regla de conservar centro actual ante doble fallo en `app/[locale]/page.tsx`
- [X] T019 [P] [US2] Mostrar feedback breve no tecnico en fallo de recentrado en `app/[locale]/page.tsx`
- [ ] T020 [US2] Validar manualmente flujo de fallback y doble fallo en `specs/003-map-recenter-button/quickstart.md`

**Checkpoint**: US2 funcional e independiente.

---

## Phase 5: User Story 3 - Conservar usabilidad mobile y desktop (Priority: P3)

**Goal**: Garantizar usabilidad visual y no-regresion de interacciones en ambos formatos.

**Independent Test**: En desktop y mobile, confirmar que botones flotantes no se solapan y que pins/cards y filtros siguen operativos tras recentrar.

### Implementation for User Story 3

- [X] T021 [US3] Ajustar posicionamiento responsive de botones flotantes para evitar solapamientos en `app/[locale]/page.tsx`
- [X] T022 [US3] Verificar preservacion de `selectedCategoryId` y estado de filtro tras recentrar en `app/[locale]/page.tsx`
- [X] T023 [US3] Verificar que seleccion de pin/card no se rompe al recentrar en `app/[locale]/page.tsx`
- [X] T024 [P] [US3] Confirmar que `components/map/MapView.tsx` no requiere cambios funcionales para soportar recentrado
- [ ] T025 [US3] Validar manualmente escenario responsive/no-regresion en `specs/003-map-recenter-button/quickstart.md`

**Checkpoint**: US3 funcional e independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar validacion integral y consistencia documental.

- [X] T026 [P] Revisar consistencia de contrato UI/state en `specs/003-map-recenter-button/contracts/map-recenter-contracts.md`
- [X] T027 Ejecutar `npm run lint` y registrar resultado en `specs/003-map-recenter-button/quickstart.md`
- [ ] T028 Ejecutar recorrido completo de quickstart y registrar resultados en `specs/003-map-recenter-button/quickstart.md`
- [ ] T029 Documentar decisiones finales y riesgos residuales en `specs/003-map-recenter-button/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> US1 (Phase 3) -> US2 (Phase 4) -> US3 (Phase 5) -> Polish (Phase 6)

### User Story Dependencies

- **US1 (P1)**: depende de Phase 2; entrega el MVP del boton de recentrado.
- **US2 (P2)**: depende de US1 para enganchar fallback y comportamiento de fallo.
- **US3 (P3)**: depende de US1/US2 para validar no-regresiones y responsive final.

### Dependency Graph

```text
T001-T004 -> T005-T012 -> T013-T016 -> T017-T020 -> T021-T025 -> T026-T029
```

---

## Parallel Opportunities

- Phase 1: `T002` y `T003` en paralelo.
- Phase 2: `T008-T012` en paralelo por locale.
- US1: `T015` en paralelo con ajustes de accion en `T014`.
- US2: `T019` en paralelo con `T018` tras definir fallback (`T017`).
- US3: `T024` en paralelo con `T022-T023`.

### Parallel Example: User Story 1

```bash
Task: "T014 [US1] Conectar accion de geolocalizacion en app/[locale]/page.tsx"
Task: "T015 [US1] Reflejar estado loading/deshabilitado en app/[locale]/page.tsx"
```

### Parallel Example: User Story 2

```bash
Task: "T018 [US2] Conservar centro actual en doble fallo en app/[locale]/page.tsx"
Task: "T019 [US2] Mostrar feedback breve no tecnico en app/[locale]/page.tsx"
```

### Parallel Example: User Story 3

```bash
Task: "T022 [US3] Preservar selectedCategoryId tras recentrar en app/[locale]/page.tsx"
Task: "T024 [US3] Confirmar MapView sin cambios funcionales"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3 (US1).
3. Validar recentrado basico con geolocalizacion.

### Incremental Delivery

1. Entregar US1 (boton + recentrado base).
2. Entregar US2 (fallback + doble fallo estable).
3. Entregar US3 (responsive + no-regresion).
4. Cerrar con lint y validacion integral.

### Suggested MVP Scope

- MVP sugerido: **solo User Story 1**.
