# Implementation Plan: Experiencia de primera visita en landing

**Branch**: `001-map-instrument-pins` | **Date**: 2026-05-06 | **Spec**: `specs/002-landing-first-visit/spec.md`
**Input**: Feature specification from `specs/002-landing-first-visit/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Reorganizar la jerarquía visual de la landing para que un visitante nuevo comprenda
el valor de viaSonora en segundos, con tagline, buscador y mapa como foco,
manteniendo todas las funcionalidades existentes del shell (login, idioma, theme)
y conservando el comportamiento funcional actual del mapa.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, React 18, Next.js 14 App Router  
**Primary Dependencies**: next-intl, shadcn/Radix UI, Tailwind CSS, react-leaflet/Leaflet (ya existente)  
**Storage**: N/A (cambio de presentación UI; sin nuevo modelo persistente)  
**Testing**: Validación funcional manual guiada + `npm run lint`  
**Target Platform**: Web responsive (desktop + mobile)
**Project Type**: Aplicación web full-stack (App Router + API routes)  
**Performance Goals**: Mensaje principal visible en primera pantalla; placeholder del mapa sin saltos de layout perceptibles; buscador visible en carga inicial  
**Constraints**: Landing pública; preservar login/selector idioma/selector theme; no modificar comportamiento del mapa definido en `specs/map-instrument-pins/spec.md`  
**Scale/Scope**: Solo landing pública (`app/[locale]/page.tsx`) y textos asociados en 5 locales

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Confirm feature aligns with viaSonora scope: instrument lending between musicians; exclude e-commerce/social-network scope.
- Use domain vocabulary from `prisma/schema.prisma` (`User`, `Instrument`, `Post`, `Request`, `Category`, `FeatureFlag` + enums).
- Confirm stack constraints: Next.js App Router under `app/[locale]/`, Prisma+PostgreSQL direct in route handlers, NextAuth v5 via `auth()`, next-intl messages files, Radix+Tailwind+shadcn, Leaflet dynamic SSR-off, Vercel Blob for photos.
- Confirm auth/authz/resource ownership checks are designed (`if (!session?.user?.id) return 401`; staff helpers; ownerId checks).
- Confirm privacy and sensitive-data controls (no exact location exposure, Prisma `select` for user data, generic client errors).
- Confirm i18n additions planned for all locales: `es`, `en`, `de`, `fr`, `it`.

Resultado pre-diseno: PASS.
- Scope: fortalece descubrimiento para préstamo entre músicos.
- Dominio: mantiene términos `Instrument`, `Post`, `Category`.
- Stack: preserva App Router + next-intl + Leaflet dinámico existente.
- Auth/AuthZ: landing pública sin nuevas mutaciones.
- Privacidad: no cambia exposición de ubicación.
- i18n: textos nuevos planificados en los 5 locales.

## Project Structure

### Documentation (this feature)

```text
specs/002-landing-first-visit/
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
└── [locale]/
    └── page.tsx

components/
├── map/
│   └── MapView.tsx
└── ui/
    └── (header/navigation controls existentes)

messages/
└── {es,en,de,fr,it}.json
```

**Structure Decision**: Feature centrada en capa de presentación de landing dentro
de `app/[locale]/page.tsx`, reutilizando componentes existentes de mapa y shell
global, con ajustes de copy/jerarquía en archivos i18n.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

Re-evaluacion post-diseno: PASS (sin violaciones ni excepciones).
