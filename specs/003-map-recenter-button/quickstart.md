# Quickstart: Recentrar mapa en ubicacion del usuario

## Objetivo
Validar que la landing permita recentrar el mapa con un boton flotante dedicado,
con fallback robusto y sin regresiones sobre filtros ni pins/cards.

## Precondiciones
- Aplicacion corriendo localmente.
- Prueba en desktop y mobile.
- Acceso a landing con mapa operativo.

## Flujo principal
1. Abrir landing y ubicar botones flotantes de `filtro` y `recentrar`.
2. Tocar `recentrar` con permiso de ubicacion habilitado.
3. Confirmar que el mapa se centra en ubicacion obtenida.
4. Confirmar que el boton `recentrar` se deshabilita mientras carga y vuelve a habilitarse al terminar.

## Flujo de fallback
1. Denegar permiso de geolocalizacion del navegador.
2. Tocar `recentrar`.
3. Confirmar intento de fallback por IP y recentrado por esa fuente cuando este disponible.

## Flujo de doble fallo
1. Forzar fallo de geolocalizacion y de fallback por IP.
2. Tocar `recentrar`.
3. Confirmar que el centro del mapa se mantiene sin cambios.
4. Confirmar feedback breve y no tecnico.

## No-regresion
- Los filtros activos se mantienen tras recentrar.
- La categoria seleccionada no se reinicia.
- La interaccion de pins/cards se mantiene funcional.
- En mobile no hay solapamiento critico entre botones flotantes.

## Resultado esperado
- La accion de recentrado mejora exploracion sin romper contexto de mapa ni controles existentes.

## Registro de validacion
- `npm run lint` ejecutado el 2026-05-07: PASS para esta feature; warning preexistente en `components/admin/ReportsList.tsx` sobre dependencia de `useEffect`.
