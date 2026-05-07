# Implementation Plan: Recentrar mapa en ubicacion del usuario

**Branch**: `003-map-recenter-button` | **Date**: 2026-05-07 | **Spec**: `specs/003-map-recenter-button/spec.md`
**Input**: Feature specification from `specs/003-map-recenter-button/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Agregar un segundo boton flotante junto al filtro existente para recentrar el mapa
en la ubicacion del usuario. El flujo debe intentar geolocalizacion del navegador,
hacer fallback por IP cuando falle, y mantener el centro actual si ambos fallan,
sin romper filtros, categoria seleccionada ni comportamiento de pins/cards.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 14 App Router  
**Primary Dependencies**: next-intl, next-auth v5, Leaflet/react-leaflet, Radix UI, Tailwind, shadcn/ui, lucide-react  
**Storage**: N/A (sin cambios de persistencia; uso de datos de geolocalizacion en cliente y fallback existente)  
**Testing**: Validacion funcional manual en desktop/mobile + `npm run lint`  
**Target Platform**: Web responsive (desktop y mobile)
**Project Type**: Aplicacion web full-stack (App Router + API routes)  
**Performance Goals**: 95% de intentos de recentrado completan en <=3 segundos en red estandar  
**Constraints**: Preservar filtros/pins/cards; deshabilitar boton durante loading; no exponer ubicacion exacta; i18n en 5 locales  
**Scale/Scope**: Cambios acotados a UI/estado de landing y mensajes asociados; reutiliza `/api/geo` existente

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Confirm feature aligns with viaSonora scope: instrument lending between musicians; exclude e-commerce/social-network scope.
- Use domain vocabulary from `prisma/schema.prisma` (`User`, `Instrument`, `Post`, `Request`, `Category`, `FeatureFlag` + enums).
- Confirm stack constraints: Next.js App Router under `app/[locale]/`, Prisma+PostgreSQL direct in route handlers, NextAuth v5 via `auth()`, next-intl messages files, Radix+Tailwind+shadcn, Leaflet dynamic SSR-off, Vercel Blob for photos.
- Confirm auth/authz/resource ownership checks are designed (`if (!session?.user?.id) return 401`; staff helpers; ownerId checks).
- Confirm privacy and sensitive-data controls (no exact location exposure, Prisma `select` for user data, generic client errors).
- Confirm i18n additions planned for all locales: `es`, `en`, `de`, `fr`, `it`.

Resultado pre-diseno: PASS.
- Scope: mejora exploracion del mapa dentro del flujo core de descubrimiento.
- Dominio: no introduce nuevas entidades persistentes fuera de UI state.
- Stack: mantiene App Router, Leaflet SSR-off y componentes UI existentes.
- Auth/AuthZ: feature publica, sin mutaciones ni cambios de permisos.
- Privacidad: no expone direccion exacta; usa coordenadas de referencia para centrar.
- i18n: contempla textos nuevos en los 5 locales soportados.

## Project Structure

### Documentation (this feature)

```text
specs/003-map-recenter-button/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── [locale]/page.tsx
└── api/geo/route.ts

components/
├── map/MapView.tsx
└── ui/button.tsx

messages/
└── {es,en,de,fr,it}.json

specs/
└── map-instrument-pins/
```

**Structure Decision**: Implementar la accion de recentrado en la landing (`app/[locale]/page.tsx`)
reutilizando `MapView` y el endpoint `/api/geo` como fallback. No se agregan nuevas rutas
de mutacion ni almacenamiento.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

Re-evaluacion post-diseno: PASS (sin violaciones ni excepciones).
