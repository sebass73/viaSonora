# Contracts: Map Recenter Control

## 1) UI Control Contract (Landing)

### Scope
- Comportamiento del nuevo boton flotante de recentrado junto al boton de filtros.

### Contract Rules
- Deben coexistir dos controles flotantes: `filter` y `recenter`.
- `recenter` refleja estados `idle`, `loading` y `error`.
- Durante `loading`, el boton `recenter` queda deshabilitado.
- El boton de `filter` mantiene comportamiento actual sin cambios.

## 2) Recenter Action Contract

### Scope
- Flujo de resolucion de ubicacion para recentrar mapa.

### Contract Rules
- Al activar recentrado, se intenta primero geolocalizacion del navegador.
- Si falla o se deniega, se intenta fallback por IP.
- Si ambos fallan, se mantiene el centro actual del mapa.
- En cualquier caso de fallo, se muestra feedback breve no tecnico.

## 3) Map State Preservation Contract

### Scope
- Reglas de no-regresion al aplicar recentrado.

### Contract Rules
- Recentrar no resetea `selectedCategoryId`.
- Recentrar no rompe seleccion de pin/card activa.
- Recentrar no altera disponibilidad del boton de filtros.

## 4) Localization Contract

### Scope
- Mensajes de estado y error visibles para el usuario.

### Contract Rules
- Todo texto nuevo de `recenter` existe en `messages/es.json`, `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`.
