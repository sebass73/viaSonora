<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read:
`specs/003-map-recenter-button/plan.md`
<!-- SPECKIT END -->

## Estructura del proyecto

Next.js con App Router e internacionalización (`[locale]`).

### Rutas (`app/[locale]/`)

Cada directorio es una ruta localizada:
- `instruments/new/` y `instruments/[id]/edit/` — alta y edición de instrumentos
- `posts/new/`, `posts/[id]/`, `posts/[id]/edit/` — publicaciones
- `requests/` — solicitudes
- `profile/` — perfil de usuario
- `login/`, `register/` — autenticación
- `admin/` — panel administrativo
- `how/` — páginas informativas (overview, travelers, owners, care, transparency)
- `contact/`, `faq/`, `pricing/`, `privacy/`, `terms/` — páginas estáticas

### Componentes (`components/`)

**UI base (`components/ui/`)** — primitivos reutilizables en toda la app:
`button`, `input`, `label`, `select`, `dialog`, `card`, `badge`, `calendar`, `popover`, `pagination`, `emoji-picker-button`

**Por dominio:**
- `components/instruments/` — `AvailabilityForm`, `PhotoUpload`
- `components/posts/` — `PostForm`, `PostEditForm`, `PostDetail`
- `components/profile/` — `ProfileForm`
- `components/requests/` — `RequestForm`, `RequestCard`, `RequestList`
- `components/admin/` — `AdminFeaturesList`, `AdminPostCard`, `AdminPostList`
- `components/reports/` — `ReportPostDialog`

**Raíz de components:**
`navigation`, `CategoryChips`, `CategoryName`, `InstrumentAutocomplete`, `LanguageSwitcher`, `ThemeSwitcher`, `TrustBlock`

### Prioridad para revisiones de UI

1. `components/ui/` — los problemas aquí se propagan a toda la app
2. Formularios de dominio — mayor riesgo de violaciones de accesibilidad (labels, autocomplete, tipos de input, estados de error)
