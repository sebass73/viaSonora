# Data Model: Experiencia de primera visita en landing

## Entity: VisitanteLanding
- Purpose: Representa a la persona que llega por primera vez (autenticada o no).
- Attributes:
  - `isAuthenticated` (Boolean)
  - `deviceType` (`desktop` | `mobile`)
  - `language` (`es` | `en` | `de` | `fr` | `it`)
- Rules:
  - Debe poder acceder a landing y “Cómo funciona” sin bloqueo de autenticación.

## Entity: MensajeLanding
- Purpose: Define contenido textual visible para comprensión inicial.
- Attributes:
  - `brandName` (String)
  - `tagline` (String)
  - `valueForBorrower` (String)
  - `valueForLender` (String)
  - `howItWorksLabel` (String)
  - `ctaRegister` (String)
  - `ctaPublishInstrument` (String)
- Rules:
  - Todo texto nuevo existe en 5 locales.
  - Tagline debe ser el primer texto jerarquizado de lectura.

## Entity: BloqueExploracion
- Purpose: Estructura visual dominante para descubrimiento.
- Attributes:
  - `searchVisibleOnLoad` (Boolean)
  - `mapDominant` (Boolean)
  - `mapLoadingState` (`loading` | `ready`)
  - `placeholderStable` (Boolean)
- Rules:
  - En `loading`, placeholder ocupa el área final del mapa.
  - En mobile, tagline + buscador arriba; mapa ocupa resto del viewport disponible.

## State Model (Landing)
- `Initial`: Marca/tagline visibles y buscador disponible.
- `MapLoading`: Placeholder animado visible, sin saltos de layout.
- `MapReady`: Mapa interactivo con comportamiento existente.
- `ActionReady`: CTAs primarios `Registrarme` y `Publicar instrumento` visibles con igual peso.
