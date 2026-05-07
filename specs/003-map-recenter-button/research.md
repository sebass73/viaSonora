# Research: Recentrar mapa en ubicacion del usuario

## Decision 1: Prioridad de fuente de ubicacion
- Decision: Usar primero geolocalizacion del navegador y fallback por IP solo si geolocalizacion falla o se deniega.
- Rationale: La ubicacion del navegador suele ser mas precisa para exploracion local y el fallback evita bloqueo funcional.
- Alternatives considered:
  - Usar solo IP: menor precision para el usuario final.
  - Pedir ingreso manual de ubicacion: agrega friccion innecesaria para esta accion rapida.

## Decision 2: Comportamiento ante doble fallo (geo + IP)
- Decision: Mantener el centro actual del mapa cuando ambos metodos fallen.
- Rationale: Preserva contexto de exploracion y evita saltos inesperados.
- Alternatives considered:
  - Volver siempre al centro por defecto: puede desorientar cuando el usuario ya esta explorando otra zona.

## Decision 3: Concurrencia de interaccion
- Decision: Deshabilitar temporalmente el boton de recentrado mientras el estado sea `loading`.
- Rationale: Evita solicitudes concurrentes y estados de UI inconsistentes.
- Alternatives considered:
  - Debounce con taps permitidos: mas complejidad con beneficio limitado.
  - Permitir taps y cancelar anterior: aumenta riesgo de race conditions.

## Decision 4: Feedback de error para usuario
- Decision: Mostrar feedback breve y no tecnico cuando no se pueda centrar por geolocalizacion ni por IP.
- Rationale: Mantiene UX clara sin exponer detalles internos.
- Alternatives considered:
  - Silenciar error: genera incertidumbre.
  - Mostrar errores tecnicos: no aporta valor al usuario final.

## Decision 5: Impacto en estado del mapa
- Decision: Recentrar sin resetear filtros, categoria seleccionada ni seleccion de pin/card.
- Rationale: La accion debe complementar exploracion, no reiniciar contexto.
- Alternatives considered:
  - Recalcular estado completo tras recentrar: aumenta friccion y riesgo de regresion.
