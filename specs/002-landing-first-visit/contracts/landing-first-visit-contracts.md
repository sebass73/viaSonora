# Contracts: Landing First Visit

## 1) Public Access Contract

### Scope
- Landing pública accesible con y sin sesión.
- Acceso a “Cómo funciona” sin requerir autenticación.

### Acceptance Contract
- La carga inicial muestra nombre + tagline + buscador.
- No se bloquea navegación por ausencia de sesión.

## 2) Visual Hierarchy Contract

### Scope
- Definir prioridad visual de mensaje y exploración.

### Contract Rules
- Tagline debe ser primer texto jerarquizado de lectura.
- Buscador y mapa deben ser los elementos visuales dominantes.
- Los CTAs `Registrarme` y `Publicar instrumento` comparten peso visual primario.

## 3) Map Loading Contract

### Scope
- Estados de carga del mapa en landing.

### Contract Rules
- Durante carga, placeholder animado ocupa el espacio final del mapa.
- No debe haber saltos de layout perceptibles en la transición a mapa listo.

## 4) Mobile Layout Contract

### Scope
- Jerarquía visual en pantallas móviles.

### Contract Rules
- Tagline y buscador se muestran arriba.
- El mapa ocupa el resto del viewport disponible.

## 5) Shell Preservation Contract

### Scope
- Funcionalidades existentes de navegación/shell.

### Contract Rules
- Login, selector de idioma y selector de tema se mantienen operativos y accesibles.
- Este cambio de landing no elimina ni degrada dichas funcionalidades.
