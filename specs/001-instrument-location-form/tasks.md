---

description: "Task list for instrument location form feature"
---

# Tasks: Ubicación de instrumento

**Input**: Design documents from `/specs/001-instrument-location-form/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: La feature se valida con pruebas funcionales/manuales; no se agrega suite automatizada nueva en este alcance.

**Organization**: Tareas agrupadas por user story para implementación y validación independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencia directa)
- **[Story]**: US1, US2, US3 para trazabilidad con `spec.md`
- Todas las tareas incluyen ruta explícita

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar baseline de formulario/autocomplete para el nuevo alcance.

- [ ] T001 Revisar estado actual de ubicaciones múltiples en `components/forms/InstrumentForm.tsx`
- [ ] T002 Revisar flujo actual de error de geocoding en `components/ui/city-autocomplete.tsx`
- [ ] T003 [P] Verificar contrato funcional en `specs/001-instrument-location-form/contracts/instrument-location-contracts.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reglas base que bloquean todas las historias.

- [ ] T004 Definir modelo de una sola ubicación en estado de formulario en `components/forms/InstrumentForm.tsx`
- [ ] T005 Definir validación de coordenadas obligatorias (`lat/lng` válidos y no `0,0`) en `components/forms/InstrumentForm.tsx`
- [ ] T006 [P] Verificar reglas de autenticación y 401 en rutas de instrumentos `app/api/instruments/route.ts` y `app/api/instruments/[id]/route.ts`
- [ ] T007 Preparar mensajes base de validación y error para 5 locales en `messages/es.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`

**Checkpoint**: Formulario listo para soportar exactamente una ubicación válida con mensajes i18n.

---

## Phase 3: User Story 1 - Registrar ubicación válida (Priority: P1) 🎯 MVP

**Goal**: Permitir seleccionar ciudad desde autocompletado y guardar ubicación válida única.

**Independent Test**: Usuario autenticado guarda instrumento con una ubicación seleccionada y persiste `city/country/lat/lng`.

### Implementation for User Story 1

- [ ] T008 [US1] Simplificar formulario a una única ubicación (remover array editable) en `components/forms/InstrumentForm.tsx`
- [ ] T009 [US1] Integrar selección de sugerencia para poblar `city/country/lat/lng` en `components/forms/InstrumentForm.tsx`
- [ ] T010 [P] [US1] Activar autocompletado solo para input de ciudad con 2+ caracteres en `components/ui/city-autocomplete.tsx`
- [ ] T011 [US1] Persistir ubicación única al guardar create/edit en `app/api/instruments/route.ts` y `app/api/instruments/[id]/route.ts`
- [ ] T012 [US1] Validar manualmente flujo feliz de US1 en `specs/001-instrument-location-form/quickstart.md`

**Checkpoint**: US1 funcional e independiente.

---

## Phase 4: User Story 2 - Bloquear guardado inválido (Priority: P2)

**Goal**: Impedir guardado sin selección válida o sin ubicación.

**Independent Test**: Guardado bloqueado si no hay ubicación o si ciudad fue escrita sin seleccionar sugerencia.

### Implementation for User Story 2

- [ ] T013 [US2] Bloquear envío cuando `lat/lng` sean inválidos o `0,0` en `components/forms/InstrumentForm.tsx`
- [ ] T014 [US2] Mostrar mensaje de ubicación obligatoria cuando no exista ubicación en `components/forms/InstrumentForm.tsx`
- [ ] T015 [P] [US2] Mostrar mensaje de ciudad inválida/no seleccionada en `components/forms/InstrumentForm.tsx`
- [ ] T016 [US2] Verificar que backend rechaza payload inválido de ubicación en `app/api/instruments/route.ts` y `app/api/instruments/[id]/route.ts`
- [ ] T017 [US2] Validar manualmente bloqueos de US2 en `specs/001-instrument-location-form/quickstart.md`

**Checkpoint**: US2 funcional e independiente.

---

## Phase 5: User Story 3 - Reintentar ante error de geocoding (Priority: P3)

**Goal**: Exponer error visible de geocoding y permitir reintento.

**Independent Test**: Ante fallo de búsqueda, se muestra error visible y el campo continúa editable para reintentar.

### Implementation for User Story 3

- [ ] T018 [US3] Exponer estado de error de geocoding en `components/ui/city-autocomplete.tsx`
- [ ] T019 [US3] Renderizar mensaje de error visible en campo ciudad en `components/ui/city-autocomplete.tsx`
- [ ] T020 [P] [US3] Mantener comportamiento de reintento al seguir escribiendo tras error en `components/ui/city-autocomplete.tsx`
- [ ] T021 [US3] Mostrar estado “sin resultados” con hint en `components/ui/city-autocomplete.tsx`
- [ ] T022 [US3] Validar manualmente estados de error/reintento de US3 en `specs/001-instrument-location-form/quickstart.md`

**Checkpoint**: US3 funcional e independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consistencia final, i18n completo y validación integral.

- [ ] T023 [P] Confirmar textos finales de formulario en `messages/es.json`
- [ ] T024 [P] Confirmar textos finales de formulario en `messages/en.json`
- [ ] T025 [P] Confirmar textos finales de formulario en `messages/de.json`
- [ ] T026 [P] Confirmar textos finales de formulario en `messages/fr.json`
- [ ] T027 [P] Confirmar textos finales de formulario en `messages/it.json`
- [ ] T028 Ejecutar recorrido completo de quickstart y registrar resultado en `specs/001-instrument-location-form/quickstart.md`
- [ ] T029 Documentar decisiones finales y riesgos residuales en `specs/001-instrument-location-form/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> US1 (Phase 3) -> US2 (Phase 4) -> US3 (Phase 5) -> Polish (Phase 6)

### User Story Dependencies

- **US1 (P1)**: depende de Phase 2; entrega MVP de ubicación válida.
- **US2 (P2)**: depende de US1 para estado de ubicación ya estructurado.
- **US3 (P3)**: depende de US1 para flujo de autocompletado activo.

### Dependency Graph

```text
T001-T003 -> T004-T007 -> T008-T012 -> T013-T017 -> T018-T022 -> T023-T029
```

---

## Parallel Opportunities

- Phase 1: `T003` paralelo a `T001-T002`.
- Phase 2: `T006` paralelo a `T004-T005`; `T007` puede ejecutarse en paralelo una vez definidos mensajes.
- US1: `T010` paralelo con ajustes de estado en `T008-T009`.
- US2: `T015` paralelo con `T013-T014`.
- US3: `T020` y `T021` paralelos tras base de error en `T018`.
- Polish: `T023-T027` completamente paralelas por archivo locale.

### Parallel Example: User Story 1

```bash
Task: "T008 [US1] Simplificar formulario a una única ubicación en components/forms/InstrumentForm.tsx"
Task: "T010 [US1] Activar autocompletado 2+ caracteres en components/ui/city-autocomplete.tsx"
```

### Parallel Example: User Story 2

```bash
Task: "T013 [US2] Bloquear envío con coordenadas inválidas en components/forms/InstrumentForm.tsx"
Task: "T015 [US2] Mostrar mensaje de ciudad no seleccionada en components/forms/InstrumentForm.tsx"
```

### Parallel Example: User Story 3

```bash
Task: "T018 [US3] Exponer estado de error en components/ui/city-autocomplete.tsx"
Task: "T021 [US3] Mostrar estado sin resultados con hint en components/ui/city-autocomplete.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3 (US1).
3. Validar guardado con ubicación válida única.

### Incremental Delivery

1. Entregar US1 (ubicación válida única).
2. Sumar US2 (bloqueos de guardado inválido).
3. Sumar US3 (error visible de geocoding y reintento).
4. Cerrar con polish/i18n y validación integral.

### Suggested MVP Scope

- MVP sugerido: **solo User Story 1**.
