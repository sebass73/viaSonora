# Implementation Plan: Ubicación de instrumento

**Branch**: `001-instrument-location-form` | **Date**: 2026-05-06 | **Spec**: `specs/001-instrument-location-form/spec.md`
**Input**: Feature specification from `specs/001-instrument-location-form/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Estandarizar la carga de ubicación en el formulario de instrumentos para que cada instrumento
use exactamente una ubicación válida (ciudad seleccionada + coordenadas), con error visible
de geocoding y bloqueo de guardado ante datos inválidos.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 14 App Router  
**Primary Dependencies**: Prisma, next-auth v5, next-intl, Zod, componentes UI existentes de formulario/autocomplete  
**Storage**: PostgreSQL vía Prisma (`Instrument`, `InstrumentLocation`)  
**Testing**: Validación funcional manual guiada + validación de formularios y APIs existentes  
**Target Platform**: Web responsive (desktop y mobile)
**Project Type**: Aplicación web full-stack (App Router + API routes)  
**Performance Goals**: Sugerencias visibles sin bloqueo perceptible para input >=2 caracteres; guardado validado en un intento para casos válidos  
**Constraints**: Una sola ubicación por instrumento; cliente usa `/api/geocoding/search`; privacidad de ubicación aproximada; sin dirección exacta  
**Scale/Scope**: Flujos autenticados de alta frecuencia en `/instruments/new` y `/instruments/[id]/edit`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Confirm feature aligns with viaSonora scope: instrument lending between musicians; exclude e-commerce/social-network scope.
- Use domain vocabulary from `prisma/schema.prisma` (`User`, `Instrument`, `Post`, `Request`, `Category`, `FeatureFlag` + enums).
- Confirm stack constraints: Next.js App Router under `app/[locale]/`, Prisma+PostgreSQL direct in route handlers, NextAuth v5 via `auth()`, next-intl messages files, Radix+Tailwind+shadcn, Leaflet dynamic SSR-off, Vercel Blob for photos.
- Confirm auth/authz/resource ownership checks are designed (`if (!session?.user?.id) return 401`; staff helpers; ownerId checks).
- Confirm privacy and sensitive-data controls (no exact location exposure, Prisma `select` for user data, generic client errors).
- Confirm i18n additions planned for all locales: `es`, `en`, `de`, `fr`, `it`.

Resultado pre-diseno: PASS.
- Scope: refuerza registro de instrumentos para descubrimiento en mapa.
- Dominio: usa `Instrument` e `InstrumentLocation` canónicos.
- Stack: mantiene App Router + Prisma + next-intl.
- Auth/AuthZ: actor autenticado y dueño del recurso.
- Privacidad: ubicación aproximada sin dirección exacta.
- i18n: mensajes definidos en 5 locales, sin hardcode.

## Project Structure

### Documentation (this feature)

```text
specs/001-instrument-location-form/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── [locale]/
│   └── instruments/
│       ├── new/
│       └── [id]/edit/
└── api/
    ├── geocoding/search/route.ts
    └── instruments/
        ├── route.ts
        └── [id]/route.ts

components/
├── forms/
│   └── InstrumentForm.tsx
└── ui/
    └── city-autocomplete.tsx

messages/
└── {es,en,de,fr,it}.json
```

**Structure Decision**: Se simplifica el formulario a una sola ubicación validada y se conserva
el contrato de geocoding vía `/api/geocoding/search`; los cambios principales viven en
`InstrumentForm.tsx` y `city-autocomplete.tsx`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

Re-evaluacion post-diseno: PASS (sin violaciones ni excepciones).
