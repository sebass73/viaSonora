<!--
Sync Impact Report
- Version change: N/A (template) -> 1.0.0
- Modified principles:
  - Placeholder Principle 1 -> I. Enfoque de Producto Delimitado
  - Placeholder Principle 2 -> II. Vocabulario de Dominio Canónico
  - Placeholder Principle 3 -> III. Stack y Arquitectura No Negociables
  - Placeholder Principle 4 -> IV. Autenticación, Autorización y Propiedad
  - Placeholder Principle 5 -> V. Privacidad y Manejo de Datos Sensibles
- Added sections:
  - Patrones Operativos Obligatorios
  - Constraints y Límites de Scope
- Removed sections:
  - Ninguna
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ✅ updated: README.md
- Deferred TODOs:
  - Ninguno
-->
# viaSonora Constitution

## Core Principles

### I. Enfoque de Producto Delimitado
viaSonora MUST enfocarse en préstamos de instrumentos entre músicos.
La plataforma sirve a dos perfiles: dueños de instrumentos y músicos
viajeros/locales que solicitan uso temporal. El producto NO es e-commerce
(sin pagos como flujo core) y NO es una red social generalista. Toda nueva
feature MUST reforzar publicación-moderación-solicitud de instrumentos.

### II. Vocabulario de Dominio Canónico
Las specs, APIs y UI MUST usar el vocabulario del schema en
`prisma/schema.prisma`: `User`, `Instrument`, `Post`, `Request`, `Category`,
`FeatureFlag`. Estados canónicos:
- `PostStatus`: `PENDING_APPROVAL` (requiere moderación), `APPROVED`
  (visible públicamente), `REJECTED` (rechazado por staff), `BANNED`
  (bloqueado por staff), `EXPIRED` (vencido por tiempo).
- `RequestStatus`: `REQUESTED` (enviada), `ACCEPTED` (aprobada por owner),
  `DECLINED` (rechazada por owner), `CANCELLED` (cancelada), `COMPLETED`
  (finalizada).
- `UserRole`: `OWNER` (publica instrumentos), `CLIENT` (solicita préstamos).
- `StaffRole`: `NONE`, `OPERATOR` (operación/moderación), `ADMIN`
  (administración total).
No se MUST introducir sinónimos de negocio para estas entidades/estados.

### III. Stack y Arquitectura No Negociables
La implementación MUST seguir el stack existente y sus patrones:
- Routing web en Next.js 14 App Router bajo `app/[locale]/`.
- Datos con Prisma + PostgreSQL desde route handlers, sin wrappers ORM
  adicionales.
- Auth con NextAuth v5; sesión obtenida con `auth()` desde `@/auth`.
- i18n con `next-intl`; toda string visible al usuario MUST vivir en
  `messages/{locale}.json`.
- UI con Radix UI + Tailwind + shadcn en `components/`; no reemplazar por
  librerías alternativas para componentes base.
- Mapas con Leaflet/react-leaflet usando dynamic import con `ssr: false`
  (patrón activo en `app/[locale]/page.tsx`).
- Fotos de instrumentos en Vercel Blob vía `app/api/upload/route.ts`.

### IV. Autenticación, Autorización y Propiedad
Google OAuth y Credentials (email/password con bcrypt) MUST coexistir bajo
estrategia JWT (`auth.ts`). En APIs y server components la sesión MUST leerse
con `auth()` y contemplar `session.user.id` y `session.user.staffRole`.
En route handlers autenticados, la primera validación MUST ser
`if (!session?.user?.id) return 401`.

Niveles de acceso obligatorios:
- Público: lectura de posts, instrumentos y categorías.
- Autenticado: crear posts, enviar requests, editar perfil propio.
- Staff: usar `isAdmin()` / `isAdminOrOperator()` de
  `lib/auth-helpers.ts`; nunca reimplementar esta lógica inline.

Antes de toda mutación, se MUST verificar propiedad de recurso
(`session.user.id` == owner del recurso). Estar autenticado no habilita
modificar recursos ajenos. Middleware protege `/admin` y `/profile`
(`auth.config.ts`), y las rutas admin MUST validar `staffRole` en handler.

### V. Privacidad y Manejo de Datos Sensibles
Contraseñas MUST almacenarse hasheadas con bcrypt y nunca exponerse en
respuestas. Las consultas de Prisma sobre usuario MUST usar `select` explícito
para excluir `password`, `emailVerified`, `accounts`, `sessions` y campos
internos no necesarios. La ubicación exacta NO se almacena ni expone: solo
ciudad/país/zona y lat/lng aproximado en `User` e `InstrumentLocation`, con
jitter público cuando corresponda (`lib/privacy`, `app/api/posts/route.ts`).
Errores al cliente MUST ser genéricos (`Unauthorized`, `Internal server error`)
y detalles técnicos MUST ir solo a logs de servidor (`console.error`).

## Patrones Operativos Obligatorios

- Rutas API MUST usar estructura `app/api/[recurso]/route.ts`.
- Validación de entrada MUST ejecutarse en el boundary del handler con Zod
  (patrón activo en `app/api/*/route.ts` vía schemas de `lib/validation`).
- Geocoding MUST pasar por `app/api/geocoding/search/route.ts`; el cliente
  nunca llama Nominatim directamente.
- Feature flags para rollout gradual MUST consultarse vía
  `app/api/feature-flags/route.ts` y administración en
  `app/api/admin/feature-flags/[key]/route.ts`.
- Todo texto nuevo visible al usuario MUST agregarse en los 5 locales:
  `messages/es.json`, `messages/en.json`, `messages/de.json`,
  `messages/fr.json`, `messages/it.json`.

## Constraints y Límites de Scope

- Privacidad no negociable: prohibido exponer ubicación exacta de usuarios o
  instrumentos; solo ciudad/zona y coordenada aproximada.
- Moderación no negociable: posts nuevos entran en `PENDING_APPROVAL` y
  requieren aprobación de staff antes de visibilidad pública.
- Internacionalización no negociable: soporte oficial en `es`, `en`, `de`,
  `fr`, `it`; no se aceptan strings hardcodeadas.
- Fuera de scope actual: pagos transaccionales en producción, chat en tiempo
  real, sistema de ratings/reviews y funcionalidades de red social general.
  Cualquier referencia existente a pagos/notificaciones opera como feature flag
  o stub, no como flujo core.

## Governance

- Esta constitución prevalece sobre prácticas ad hoc de implementación.
- Toda PR, plan y spec MUST incluir verificación explícita de cumplimiento
  (auth/authz, privacidad de ubicación, i18n, moderación y stack obligatorio).
- Enmiendas requieren: (1) cambio documentado en este archivo,
  (2) actualización de plantillas impactadas en `.specify/templates/`,
  (3) justificación de impacto en dominios/API/UI.
- Política de versionado de constitución: `MAJOR` para cambios incompatibles
  de principios, `MINOR` para nuevos principios/secciones normativas,
  `PATCH` para aclaraciones sin cambio semántico.
- Revisión de cumplimiento: en cada ciclo `/speckit.plan`, `/speckit.specify`
  y `/speckit.tasks` se MUST ejecutar el chequeo de constitución y registrar
  excepciones en "Complexity Tracking" cuando aplique.

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
