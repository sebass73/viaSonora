# Guía: Publicidad y Monetización en ViaSonora

**Objetivo:** Especificar cómo integrar publicidad en la aplicación (AdSense/Ad Manager, anuncios directos, nativos, banners, interstitials), el modelo de datos, endpoints, pantalla de administración y consideraciones legales/privacidad.

---

## 1) Resumen ejecutivo ✅
- Propósito: monetizar la app mediante anuncios y/o venta de espacios publicitarios, manteniendo control administrativo, privacidad y buena UX.
- Alcance: definición de placements, CRUD de anuncios en admin, carga condicional en frontend, métricas (impresiones, clicks, CTR), soporte para proveedores programáticos y anuncios directos.

---

## 2) Formatos y modelos de monetización (prioridad recomendada) 🎯
- 🥇 **Publicaciones destacadas (RECOMENDADO)** — Publicidad interna (no banners): los OWNERs pagan para que su publicación:
  - Aparezca primero en listados y búsquedas
  - Lleve un badge "Destacado"
  - Tenga mejor visibilidad en el mapa (mayor prioridad / zoom)
  - Ejemplo de precio sugerido: **+USD 2 / 7 días** (muy buen ROI comparado con redes externas)
- 🥈 **Sponsoreo de marcas (futuro / escalado)** — Espacios para marcas (p.ej. marcas de instrumentos, casas de música, luthiers, escuelas):
  - Formato: "Marca sponsor del mes", card destacada, sección "Recomendado por..."
  - Alto valor cualitativo, tráfico más segmentado
- Otras opciones (opcionales): anuncios directos, nativos, banners (header/footer), interstitials
- **Opcional:** opción "Premium / Sin anuncios" por suscripción

---

## 3) Reglas de carga y privacidad ⚖️
- **Consentimiento obligatorio**: no cargar scripts/publicidad de terceros hasta consentimiento (cookie banner). Para **publicaciones destacadas internas** no se requieren scripts externos, pero sí debe informarse claramente al usuario que se trata de contenido promocionado.
- No mostrar promociones a usuarios premium/suscriptores sin anuncios.  
- Registrar eventos (impresión, click) en `PromotionEvent` para métricas, pricing y conciliación.  
- Mostrar de forma explícita el badge "Destacado" y la información de patrocinio; si se integran redes externas, cumplir sus políticas y evitar tráfico inválido.

---

## 4) Modelo de datos sugerido (Prisma) 🔧
Insertar en `prisma/schema.prisma` modelos mínimos para promociones internas:

```prisma
model FeaturedPost {
  id         String   @id @default(cuid())
  postId     String   @unique
  ownerId    String
  startAt    DateTime
  endAt      DateTime
  price      Float
  badgeText  String   @default("Destacado")
  mapBoost   Int      @default(1) // higher value = higher visibility/order
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  owner User @relation(fields: [ownerId], references: [id])
  post  Post @relation(fields: [postId], references: [id])
  @@index([ownerId])
  @@index([startAt, endAt])
}

model Sponsorship {
  id         String   @id @default(cuid())
  sponsorName String
  description String? @db.Text
  creativeUrl String?
  link        String?
  placement   String   // e.g. "sponsor_of_month", "recommended_section"
  startAt     DateTime
  endAt       DateTime
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model PromotionEvent {
  id        String   @id @default(cuid())
  featuredPostId String?
  sponsorshipId  String?
  type      String   // IMPRESSION|CLICK
  userId    String?
  meta      Json?
  createdAt DateTime @default(now())

  featuredPost FeaturedPost? @relation(fields: [featuredPostId], references: [id])
  sponsorship  Sponsorship?  @relation(fields: [sponsorshipId], references: [id])
  @@index([featuredPostId])
  @@index([sponsorshipId])
}
```

Notas:
- `FeaturedPost` controla promociones compradas por owners (precio, fecha y efectos en UI).
- `Sponsorship` gestiona acuerdos con marcas (cards, secciones dedicadas).
- `PromotionEvent` registra impresiones/clicks para reportes y conciliación.

---

## 5) Endpoints API (sugeridos) 🛠️
Admin (protegidos):
- `GET /api/admin/promotions/featured` → listar promociones destacadas
- `POST /api/admin/promotions/featured` → crear/editar `FeaturedPost` (también puede ser accionada por owner al pagar)
- `POST /api/admin/promotions/featured/[id]/purchase` → endpoint para que un OWNER pague y active la promoción
- `GET /api/admin/promotions/sponsorships` → listar patrocinadores
- `POST /api/admin/promotions/sponsorships` → crear/editar sponsorship
- `GET /api/admin/promotions/stats?from=&to=&type=featured|sponsorship&id=` → métricas

Público:
- `GET /api/public/promotions?path=/posts/1&locale=es` → lista de promociones activas para esa ruta (consumido por frontend)
- `POST /api/public/promotions/events` → registrar `IMPRESSION` o `CLICK` sobre `FeaturedPost` o `Sponsorship` (puede ser batched)

Seguridad:
- Validar roles para rutas admin.
- Rate limit en `events` para evitar spam.
- Validar que solo el `owner` de un `Post` pueda iniciar la compra de una promoción y que la transacción quede reflejada en `Payment`.

---

## 6) UI - Admin y Frontend 🧩
Admin:
- `Promotions` dashboard:
  - `Featured Posts` tab: listar promociones activas, crear/editar, ver owner, fechas, precio y marcar como aprobadas
  - `Sponsorships` tab: gestionar marcas sponsor y creativos
  - `Metrics` view: impresiones, clicks, CTR, ingresos por promoción
Frontend:
- `FeaturedBadge` + `PromotedListing` components: badge "Destacado", visual priority in lists and map
- `PromotionPurchase` flow in `Post` edit page for OWNERs: elegir duración, mostrar precio, pagar (create `Payment` + activate `FeaturedPost`)
- `PublicPromotions` hook: `GET /api/public/promotions` y renderizar `Sponsorship` cards (e.g. "Marca sponsor del mes") or promote Listings
- Registrar impresiones/clicks (batched) contra `POST /api/public/promotions/events`

---

## 7) Instrumentación y reporting 📊
- Registrar `PromotionEvent` para cada impresión y click (incluye userId si existe).
- Batch job diario para agregar métricas y generar reportes CSV para conciliación y cálculo de ROI.
- Usar `Payment` y `FeaturedPost` para generar reportes de ingresos por promoción y conciliarlos con eventos.

---

## 8) Opciones de implementación (priorizadas) ✅
1. **Featured Posts**: crear modelo `FeaturedPost`, migración y endpoints + purchase flow (`Payment`). (1-2 días)  
2. UI para OWNERs: `PromotionPurchase` en la edición de Post y `PromotedListing` (1 día)  
3. Registrar `PromotionEvent` y panel de métricas (1-2 días)  
4. **Sponsorships**: modelo `Sponsorship`, admin CRUD y frontend card (1-2 días)  
5. Añadir opción Premium sin anuncios y controles de facturación / reports (1-2 días)  
6. Opcional: añadir soporte para anuncios externos o displays directos si se desea escalar.

---

## 9) Consideraciones legales y de producto 📌
- Revisar políticas de la red publicitaria elegida (AdSense, Ad Manager).  
- Añadir texto en la política de privacidad sobre terceros anuncios.  
- Implementar mecanismo para revocar consentimiento e impedir carga en usuarios que no lo otorgaron.

---

## 10) Siguientes pasos propuestos 🎯
- ¿Quieres que empiece por **crear los modelos Prisma y la migración** para `AdPlacement`, `Ad`, `AdEvent`?  
- O prefieres que haga primero la **UI admin** para crear placements y subir creatives?  

---

Si confirmas, puedo implementar el primer paso ahora y abrir PR con la migración y endpoints básicos.
