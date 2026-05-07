# Research: Experiencia de primera visita en landing

## Decision 1: Priorizar jerarquía de mensaje en el primer viewport
- Decision: Tagline y propuesta de valor se ubican por encima del mapa en la lectura inicial.
- Rationale: Cumple el objetivo de comprensión en primeros segundos y reduce abandono temprano.
- Alternatives considered:
  - Priorizar solo mapa en primer viewport: mejora impacto visual, pero retrasa entendimiento de valor.

## Decision 2: Buscador y mapa como bloque dominante de exploración
- Decision: Buscador y mapa mantienen el mayor protagonismo visual de la página.
- Rationale: Sostiene el flujo principal de descubrimiento para ambos perfiles (buscar/prestar).
- Alternatives considered:
  - Priorizar secciones informativas largas: reduce foco en acción y exploración inmediata.

## Decision 3: Preservación estricta del shell existente
- Decision: Login, selector de idioma y selector de tema se mantienen visibles y operativos.
- Rationale: Evita regresiones funcionales y cumple aclaración explícita de producto.
- Alternatives considered:
  - Ocultar controles en primera visita: simplifica visualmente, pero rompe funcionalidades vigentes.

## Decision 4: Placeholder estable durante carga de mapa
- Decision: Mostrar placeholder animado ocupando exactamente el área final del mapa.
- Rationale: Evita layout shift perceptible y sostiene calidad visual de primera impresión.
- Alternatives considered:
  - Spinner sin reserva de espacio: genera saltos de layout y lectura inestable.

## Decision 5: Reutilizar comportamiento de mapa existente
- Decision: No redefinir interacción de pins ni lógica de selección del mapa.
- Rationale: La spec `map-instrument-pins` ya define el comportamiento funcional y evita duplicación de alcance.
- Alternatives considered:
  - Reabrir comportamiento de mapa en esta feature: aumenta riesgo de scope creep y conflictos.
