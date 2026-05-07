# Implementation Plan: Descubrimiento en mapa

**Branch**: `001-map-instrument-pins` | **Date**: 2026-05-06 | **Spec**: `specs/map-instrument-pins/spec.md`
**Input**: Feature specification from `specs/map-instrument-pins/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implementar y consolidar el flujo de descubrimiento en mapa para visitantes: pins de
publicaciones aprobadas/no expiradas, centrado con prioridad navegador -> IP -> Buenos Aires,
seleccion de pin con card superpuesta y sin popup blanco adicional.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, React 18, Next.js 14 App Router  
**Primary Dependencies**: Prisma, next-auth v5, next-intl, Leaflet/react-leaflet, Radix UI + shadcn + Tailwind  
**Storage**: PostgreSQL via Prisma (`Post`, `Instrument`, `InstrumentLocation`)  
**Testing**: Validacion funcional manual guiada por `quickstart.md`  
**Target Platform**: Web responsive (desktop y mobile)
**Project Type**: Aplicacion web full-stack (App Router + API routes)  
**Performance Goals**: Centro inicial visible en <=3s para 95% de sesiones; seleccion pin->card sin recarga de pagina  
**Constraints**: Privacidad de ubicacion aproximada; sin clustering; sin filtro por viewport; sin radio de distancia; sin popup blanco  
**Scale/Scope**: Landing publica para visitantes; consumo paginado de posts publicos (tamano actual 12)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Confirm feature aligns with viaSonora scope: instrument lending between musicians; exclude e-commerce/social-network scope.
- Use domain vocabulary from `prisma/schema.prisma` (`User`, `Instrument`, `Post`, `Request`, `Category`, `FeatureFlag` + enums).
- Confirm stack constraints: Next.js App Router under `app/[locale]/`, Prisma+PostgreSQL direct in route handlers, NextAuth v5 via `auth()`, next-intl messages files, Radix+Tailwind+shadcn, Leaflet dynamic SSR-off, Vercel Blob for photos.
- Confirm auth/authz/resource ownership checks are designed (`if (!session?.user?.id) return 401`; staff helpers; ownerId checks).
- Confirm privacy and sensitive-data controls (no exact location exposure, Prisma `select` for user data, generic client errors).
- Confirm i18n additions planned for all locales: `es`, `en`, `de`, `fr`, `it`.

Resultado pre-diseno: PASS.
- Scope: alineado al flujo core de descubrimiento para prestamos.
- Dominio: usa vocabulario canonico (`Post`, `Instrument`, `InstrumentLocation`, `PostStatus`).
- Stack: mantiene App Router + Prisma + Leaflet dinamico (`ssr: false`).
- Auth/AuthZ: flujo publico de lectura, sin mutaciones nuevas.
- Privacidad: coordenadas publicas aproximadas con jitter desde `/api/posts`.
- i18n: usa claves de traduccion para textos visibles (`close` incluida en 5 locales).

## Project Structure

### Documentation (this feature)

```text
specs/map-instrument-pins/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
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
├── [locale]/
│   └── page.tsx
└── api/
    ├── posts/route.ts
    └── geo/route.ts

components/
└── map/
    └── MapView.tsx

lib/
└── privacy.ts

messages/
└── {es,en,de,fr,it}.json
```

**Structure Decision**: Se preserva arquitectura existente y se limita el cambio funcional al
flujo mapa/card: `app/[locale]/page.tsx` orquesta estado y card; `components/map/MapView.tsx`
renderiza markers sin popup; APIs `app/api/posts/route.ts` y `app/api/geo/route.ts` mantienen
datos publicos y fallback de geolocalizacion.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

Re-evaluacion post-diseno: PASS (sin violaciones ni excepciones).

Decision final implementada: interaccion de marker sin `Popup` de Leaflet; la seleccion
del pin muestra exclusivamente la card superpuesta en landing.
