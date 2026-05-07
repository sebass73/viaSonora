# Quickstart: Descubrimiento en mapa

## Objetivo
Validar manualmente el flujo de pins en mapa, card de seleccion y fallback de centrado.

## Precondiciones
- Aplicacion ejecutando en local.
- Base con al menos 1 `Post` `APPROVED` no expirado y con `InstrumentLocation` primaria.
- (Opcional) Un segundo post para validar reemplazo de card entre pins.

## Flujo principal
1. Abrir la landing de viaSonora.
2. Verificar que el mapa aparece como vista principal.
3. Confirmar que se renderizan pins de publicaciones aprobadas.
4. Seleccionar un pin.
5. Verificar card con foto (si existe), titulo, ciudad, boton solicitar y boton cerrar.
6. Presionar solicitar y confirmar navegacion al detalle de la publicacion.
7. Volver y presionar cerrar en una card abierta; verificar estado sin seleccion.

## Validaciones de clarificaciones
1. Con card abierta, seleccionar otro pin y verificar reemplazo inmediato de card.
2. Si un instrumento tiene multiples ubicaciones, verificar que la representacion del post usa una sola ubicacion primaria.
3. Confirmar orden de centrado inicial:
   - navegador (si permiso concedido),
   - IP (`/api/geo`) si falla navegador,
   - Buenos Aires si ambos fallan.
4. Al seleccionar pin, verificar que NO aparece popup/recuadro blanco del mapa y solo aparece la card.

## Edge cases
- Denegar permiso de geolocalizacion y recargar: mapa no bloquea uso y mantiene fallback.
- Simular ausencia de posts aprobados: mapa sin pins y sin mensaje adicional.
- Post sin foto: card sigue operativa con titulo/ciudad/acciones.

## Checklist de salida
- Solo posts aprobados/no expirados aparecen en pins.
- Card cumple campos y acciones requeridas.
- Cerrar card limpia seleccion.
- No aparece popup blanco de Leaflet al seleccionar pin.
- Mobile: card superpuesta sin romper navegacion del mapa.
- No se expone ubicacion exacta.

## Registro de ejecucion
- Validacion de implementacion completada sobre codigo actual del feature.
- Se confirmo uso de traduccion para accion de cierre en la card y claves presentes en los 5 locales.
