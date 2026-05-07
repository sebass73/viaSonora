---

description: "Task list for landing first-visit experience"
---

# Tasks: Experiencia de primera visita en landing

**Input**: Design documents from `/specs/002-landing-first-visit/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Validación funcional/manual según quickstart; no se solicita suite automatizada nueva en este alcance.

**Organization**: Tareas agrupadas por user story para implementación y validación independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencia directa)
- **[Story]**: US1, US2, US3 para trazabilidad con `spec.md`
- Todas las tareas incluyen ruta explícita

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar baseline de landing para cambios de jerarquía visual sin regresión funcional.

- [ ] T001 Revisar estructura actual de landing en `app/[locale]/page.tsx`
- [ ] T002 Revisar estado actual de controles de shell (login/idioma/theme) en `app/[locale]/layout.tsx`
- [ ] T003 [P] Revisar comportamiento actual de mapa en `components/map/MapView.tsx`
- [ ] T004 [P] Revisar contratos de feature en `specs/002-landing-first-visit/contracts/landing-first-visit-contracts.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Definir base de copy, jerarquía y no-regresión transversal para todas las historias.

- [ ] T005 Definir bloque de mensaje inicial (marca/tagline/propuesta dual) en `app/[locale]/page.tsx`
- [ ] T006 Definir contenedor dominante de exploración (buscador + mapa) en `app/[locale]/page.tsx`
- [ ] T007 [P] Agregar/ajustar claves i18n de landing en `messages/es.json`
- [ ] T008 [P] Agregar/ajustar claves i18n de landing en `messages/en.json`
- [ ] T009 [P] Agregar/ajustar claves i18n de landing en `messages/de.json`
- [ ] T010 [P] Agregar/ajustar claves i18n de landing en `messages/fr.json`
- [ ] T011 [P] Agregar/ajustar claves i18n de landing en `messages/it.json`
- [ ] T012 Verificar que login/selector idioma/selector theme no se remueven en `app/[locale]/layout.tsx` y `components/ui/`

**Checkpoint**: Base de landing e i18n lista, con restricción explícita de no-regresión del shell.

---

## Phase 3: User Story 1 - Entender valor en segundos (Priority: P1) 🎯 MVP

**Goal**: Comunicar qué es viaSonora en primera lectura con tagline y propuesta de valor dual.

**Independent Test**: Visitante nuevo abre landing y comprende propósito en primeros segundos sin interactuar.

### Implementation for User Story 1

- [ ] T013 [US1] Implementar jerarquía visual para que tagline sea primer texto de lectura en `app/[locale]/page.tsx`
- [ ] T014 [US1] Mostrar propuesta de valor para quien busca y para quien presta en `app/[locale]/page.tsx`
- [ ] T015 [P] [US1] Ajustar estilos responsivos de bloque inicial (desktop/mobile) en `app/[locale]/page.tsx`
- [ ] T016 [US1] Validar manualmente criterio de primera comprensión en `specs/002-landing-first-visit/quickstart.md`

**Checkpoint**: US1 funcional e independiente.

---

## Phase 4: User Story 2 - Explorar con buscador y mapa (Priority: P1)

**Goal**: Hacer que buscador y mapa sean dominantes y usables desde la vista inicial.

**Independent Test**: En desktop y mobile, visitante localiza buscador y explora mapa sin pasos intermedios.

### Implementation for User Story 2

- [ ] T017 [US2] Reorganizar layout para dominancia visual de buscador y mapa en `app/[locale]/page.tsx`
- [ ] T018 [US2] Implementar placeholder animado estable durante carga de mapa en `app/[locale]/page.tsx`
- [ ] T019 [P] [US2] Ajustar layout mobile: tagline+buscador arriba, mapa al resto del viewport en `app/[locale]/page.tsx`
- [ ] T020 [US2] Verificar que interacción de pins se mantiene sin cambios funcionales en `components/map/MapView.tsx`
- [ ] T021 [US2] Validar manualmente flujo de exploración desktop/mobile en `specs/002-landing-first-visit/quickstart.md`

**Checkpoint**: US2 funcional e independiente.

---

## Phase 5: User Story 3 - Profundizar y actuar (Priority: P2)

**Goal**: Permitir acceso público a “Cómo funciona” y exponer dos CTAs primarios equilibrados.

**Independent Test**: Visitante entra a “Cómo funciona” sin registro y encuentra CTAs primarios para actuar.

### Implementation for User Story 3

- [ ] T022 [US3] Asegurar acceso visible a “Cómo funciona” sin autenticación en `app/[locale]/page.tsx`
- [ ] T023 [US3] Implementar dos CTAs primarios con igual peso visual (`Registrarme` y `Publicar instrumento`) en `app/[locale]/page.tsx`
- [ ] T024 [P] [US3] Verificar rutas/destinos de CTA de registro y publicación en `app/[locale]/page.tsx`
- [ ] T025 [US3] Validar manualmente recorrido informativo y acción en `specs/002-landing-first-visit/quickstart.md`

**Checkpoint**: US3 funcional e independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar no-regresiones del shell, consistencia visual y validación final integral.

- [ ] T026 [P] Ejecutar validación de no-regresión de login en `specs/002-landing-first-visit/quickstart.md`
- [ ] T027 [P] Ejecutar validación de no-regresión de selector de idioma en `specs/002-landing-first-visit/quickstart.md`
- [ ] T028 [P] Ejecutar validación de no-regresión de selector de theme en `specs/002-landing-first-visit/quickstart.md`
- [ ] T029 Ejecutar `npm run lint` y registrar resultado en `specs/002-landing-first-visit/quickstart.md`
- [ ] T030 Ejecutar recorrido completo de quickstart y registrar resultado en `specs/002-landing-first-visit/quickstart.md`
- [ ] T031 Documentar decisiones finales y riesgos residuales en `specs/002-landing-first-visit/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> US1 (Phase 3) -> US2 (Phase 4) -> US3 (Phase 5) -> Polish (Phase 6)

### User Story Dependencies

- **US1 (P1)**: depende de Phase 2; entrega comprensión inicial del valor (MVP comunicacional).
- **US2 (P1)**: depende de Phase 2 y se apoya en US1 para mantener coherencia de jerarquía visual.
- **US3 (P2)**: depende de US1+US2 para cerrar conversión y recorrido informativo.

### Dependency Graph

```text
T001-T004 -> T005-T012 -> T013-T016 -> T017-T021 -> T022-T025 -> T026-T031
```

---

## Parallel Opportunities

- Phase 1: `T003` y `T004` en paralelo con `T001-T002`.
- Phase 2: `T007-T011` paralelas por locale.
- US1: `T015` paralelo tras definición base de `T013`.
- US2: `T019` paralelo con `T018` una vez fijada estructura de `T017`.
- US3: `T024` paralelo con ajuste de CTAs en `T023`.
- Polish: `T026-T028` completamente paralelas.

### Parallel Example: User Story 1

```bash
Task: "T013 [US1] Implementar jerarquía visual de tagline en app/[locale]/page.tsx"
Task: "T015 [US1] Ajustar estilos responsivos iniciales en app/[locale]/page.tsx"
```

### Parallel Example: User Story 2

```bash
Task: "T018 [US2] Implementar placeholder estable de mapa en app/[locale]/page.tsx"
Task: "T019 [US2] Ajustar layout mobile en app/[locale]/page.tsx"
```

### Parallel Example: User Story 3

```bash
Task: "T023 [US3] Implementar CTAs primarios equilibrados en app/[locale]/page.tsx"
Task: "T024 [US3] Verificar destinos de CTAs en app/[locale]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3 (US1).
3. Validar comprensión inicial con quickstart.

### Incremental Delivery

1. Entregar US1 (mensaje/valor en primeros segundos).
2. Sumar US2 (dominancia de buscador+mapa y carga estable).
3. Sumar US3 (Cómo funciona + CTAs primarios equilibrados).
4. Cerrar con no-regresión shell + lint + validación integral.

### Suggested MVP Scope

- MVP sugerido: **solo User Story 1**.
