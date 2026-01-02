# Guía: Publicación y Gestión de Ads / Scripts de Tracking (Google Analytics, Meta Pixel, etc.)

**Objetivo:** Documentar cómo publicar, editar y administrar scripts de tracking (Google Analytics, Meta Pixel, píxeles de ads, y scripts personalizados) desde el panel de administración, y describir la pantalla/UX para agregar y controlar estos scripts de forma segura y compatible con privacidad.

---

## 1) Resumen y Supuestos ✅
- Se requiere que solo usuarios con rol `ADMIN`/`OPERATOR` gestionen scripts de tracking.
- Preferible evitar almacenar datos sensibles (ej.: tokens/secret keys de pasarelas) directamente en la DB; usar variables de entorno para secrets cuando sea posible.
- Debe respetarse el consentimiento de cookies (GDPR/CCPA): scripts de marketing no se cargan hasta que el usuario acepte.

---

## 2) Requisitos Funcionales 🎯
- CRUD para scripts de tracking desde el panel de admin (crear, editar, activar/desactivar, eliminar).
- Tipos de scripts soportados: **Google Analytics (GA4)**, **Meta Pixel**, **Google Tag Manager (opcional)**, **scripts personalizados** (JS/HTML) y etiquetas de Ads.
- Targeting: aplicar globalmente o por ruta(s)/páginas (ej: solo en páginas de promoción), por `locale`, por `role` (p.ej. sólo en versión pública).
- Prioridad/orden de ejecución (orden de carga), posición (head, body, beforeBodyEnd).
- Modo de prueba (sandbox) para activar scripts sólo para admins o para un % de usuarios.
- Historial/auditoría de cambios (quién editó, cuándo).

---

## 3) Modelo de Datos sugerido (Prisma) 🔧
Agregar modelo para scripts de tracking en `prisma/schema.prisma`:

```prisma
enum TrackingType { GA4 META_PIXEL GTM CUSTOM }

model TrackingScript {
  id         String       @id @default(cuid())
  name       String
  type       TrackingType
  provider   String?      // ejemplo: "google", "meta" (opcional)
  snippet    String       @db.Text    // el snippet JS/HTML que se inyectará
  enabled    Boolean      @default(false)
  global     Boolean      @default(true) // aplica a todo el site
  paths      String?      // json string o pattern list para rutas específicas
  locales    String?      // json array de locales permitidos
  position   String       @default("head") // head|body|beforeBodyEnd
  priority   Int          @default(0)
  testOnly   Boolean      @default(false) // sólo admins/perc subset
  createdBy  String
  updatedBy  String?
  createdAt  DateTime     @default(now())
  updatedAt  DateTime?    @updatedAt

  @@index([enabled])
  @@index([type])
}
```

Notas:
- `paths` podría ser un JSON con patrones (ej: ["/", "/posts/*"]). Si se espera mayor complejidad, normalizar a tabla `TrackingTarget`.
- Evitar guardar secrets como `apiKey` en el `snippet`; en su lugar, usar `envKey` que referencie `process.env.MY_GA_ID`.

---

## 4) Endpoints API (Backend) 🛠️
Rutas protegidas y separadas:
- `GET /api/admin/ads` → Lista (admin) con filtros
- `POST /api/admin/ads` → Crear script
- `PUT /api/admin/ads/[id]` → Actualizar
- `DELETE /api/admin/ads/[id]` → Eliminar
- `POST /api/admin/ads/[id]/toggle` → Activar / Desactivar
- `GET /api/public/ads?path=/posts/1&locale=es` → Devuelve lista de snippets activos para esa ruta (consumido por SSR o cliente)

Seguridad:
- Validar rol en admin routes.
- Sanitizar `snippet` antes de guardarlo (o validar origen/estructura) para evitar XSS al renderizar en admin.

---

## 5) Incorporación en Frontend (Carga Condicional) ⚡
- Patrón recomendado: el servidor (SSR) o un hook client-side solicita `GET /api/public/ads?path=...` para obtener snippets permitidos según `path` y `locale`.
- Cargar scripts sólo si:
  1) Están `enabled: true`.
  2) Coinciden con `path`/`locale` y `testOnly` (o el usuario está en grupo test).
  3) Usuario otorgó consentimiento (cookie consent) para marketing/analytics.
- Para GA4 o Meta Pixel prefiera inyectar los snippets oficiales con IDs, no ejecutar código libre directamente salvo que venga de una fuente confiable.

> Ejemplo (conceptual) de carga client-side:
> - Hook `useTrackingScripts(path, locale)` devuelve lista de `snippet`.
> - `useEffect` inserta `<script>` con `dangerouslySetInnerHTML` o crea tag `<script src>` según `snippet`.

---

## 6) UI de Administración (Diseño) 🧩
Ruta sugerida: `app/[locale]/admin/ads/page.tsx`
Componentes principales:
- **AdsList**: Tabla con columnas: `Name`, `Type`, `Enabled`, `Global/Targets`, `Position`, `Priority`, `Actions (Edit, Toggle, Delete)`.
- **AdForm (Modal / Page)**: Form con:
  - **Name** (string)
  - **Type** (select: GA4, META_PIXEL, GTM, CUSTOM)
  - **Snippet / ID** (textarea o campo ID para GA4)
  - **Global** (checkbox) / **Paths** (multi-input de patrones)
  - **Locales** (multi-select)
  - **Position** (head/body/beforeBodyEnd)
  - **Enabled** (switch)
  - **Test only** (switch con explicación)
  - **Preview / Validator**: Verificación sintáctica o validación mínima
  - **Audit metadata**: mostrar `createdBy`, `updatedAt`
- **Consent integration**: botón para probar el script aún sin consentimiento (solo para admins)

UX tips:
- Mostrar advertencia de privacidad cuando se active un script de marketing.
- Al guardar, pedir confirmación si `enabled=true` para evitar activaciones accidentales.

---

## 7) Consentimiento y Privacidad (Obligatorio) ⚖️
- No cargar scripts marketing hasta que el usuario acepte la categoría pertinente (analytics/marketing).
- Registrar el consentimiento (cookie/state) para auditoría y para cumplir con regulaciones.
- Proveer mecanismo para revocar consentimiento y remover scripts cargados.
- Clarificar en la política de privacidad qué terceros se usan.

> ⚠️ Importante: algunos scripts (p. ej. Meta Pixel) rastrean datos de usuarios; revisa si necesitas firmar acuerdos con proveedores o notificar en políticas.

---

## 8) Testing & QA ✅
- Tests E2E: comprobar que scripts se inyectan sólo tras aceptación de cookies y cuando la configuración aplica a la ruta/locale.
- Tests unitarios para endpoints de admin (validaciones, permisos).
- QA manual: probar GA4 y Meta Pixel en modo debug y comprobar eventos.

---

## 9) Seguridad y Buenas Prácticas 🔒
- Escapar/sanitizar `snippet` al mostrar en admin para evitar XSS en el dashboard.
- Para snippets con IDs, preferir guardar el ID y generar snippet dinámicamente en servidor usando un template seguro.
- Auditar cambios importantes y permitir rollback de versiones del snippet si hay problemas.

---

## 10) Consideraciones de Implementación - Pasos sugeridos 🛠️
1. Crear el modelo Prisma `TrackingScript` y migración.
2. Implementar endpoints de admin y `GET /api/public/ads` públicos.
3. Crear UI `app/[locale]/admin/ads/*` con CRUD y validaciones.
4. Implementar `useTrackingScripts` y el hook de carga condicional con chequeo de consentimiento.
5. Añadir tests E2E y documentación interna para el equipo legal.

---

## 11) Archivos propuestos
- `prisma/schema.prisma` (modelo `TrackingScript`)
- `app/api/admin/ads/*` (endpoints CRUD)
- `app/api/public/ads/route.ts` (endpoint público para la carga condicional)
- `app/[locale]/admin/ads/page.tsx`, `components/admin/AdsForm.tsx`, `components/admin/AdsList.tsx`
- `lib/tracking.ts` (helpers para dataLayer, event push y carga de scripts)
- Tests: `tests/api/admin/ads/*.test.ts`, `e2e/ads.spec.ts`

---

Si quieres, puedo comenzar a **implementar el modelo Prisma y la migración**, o directamente **crear la UI de admin** para CRUD de scripts. ¿Cuál prefieres que haga primero? 🧩
