# Guía: Panel de Estadísticas de Facturación y Ventas de Tokens (Admin)

**Objetivo:** Definir el alcance, el modelo de datos, los endpoints, la UI y el plan de implementación para un panel de estadísticas que permita al usuario *admin* visualizar y gestionar la facturación, ventas de tokens y transacciones relacionadas.

---

## 1) Resumen y Supuestos ✅
- El proyecto ya tiene un *stub* de pagos (`Payment`) en `TAREAS_PENDIENTES.md` (ver sección 3.2). Esta guía extiende esa base para cubrir ventas de tokens, facturación (invoices) y métricas analíticas.
- La autenticación usa `next-auth` y ya existen páginas de admin en `app/[locale]/admin`.
- El panel será accesible solo a roles `ADMIN`/`OPERATOR`.

---

## 2) Requisitos Funcionales 🎯
- Mostrar **resumen** (total ingresos, tokens vendidos, pagos completados, reembolsos) en un rango de fechas.
- Gráficos de tendencia (diario/semanal/mensual) para ingresos y tokens vendidos.
- Tabla paginada de **transacciones** y **ventas de tokens** con filtros (rango fecha, estado, método de pago, usuario).
- Gestión de **facturas** (listar, ver detalles, marcar como emitida/descargada o reemitir) y enlace a PDF/URL de la factura.
- Exportar CSV/Excel de transacciones e invoices.
- Métricas clave: ingresos netos, ingresos brutos, cantidad de ventas, tasa de fallos, MRR si aplica.

---

## 3) Modelo de Datos sugerido (Prisma) 🔧
Agregar / extender modelos en `prisma/schema.prisma`. Propuesta:

```prisma
enum PaymentStatus { PENDING COMPLETED FAILED REFUNDED }

model Payment {
  id            String        @id @default(cuid())
  userId        String
  amount        Float
  currency      String        @default("USD")
  status        PaymentStatus @default(PENDING)
  paymentMethod String?       // "stripe", "paypal", "tokens", etc.
  transactionId String?       // id de la pasarela o referencia
  metadata      Json?         // información adicional (p.ej. items)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([status])
}

model TokenSale {
  id            String   @id @default(cuid())
  buyerId       String
  tokens        Int
  unitPrice     Float    // price per token at sale time
  totalAmount   Float    // tokens * unitPrice
  currency      String   @default("USD")
  paymentId     String?  // relación con Payment si existe
  createdAt     DateTime @default(now())

  buyer User @relation(fields: [buyerId], references: [id])
  payment Payment? @relation(fields: [paymentId], references: [id])
  @@index([buyerId])
}

model Invoice {
  id           String   @id @default(cuid())
  invoiceNumber String  @unique
  paymentId    String
  issuedAt     DateTime @default(now())
  pdfUrl       String?  // link al PDF si aplica
  status       String   @default("ISSUED") // ISSUED, PAID, CANCELED

  payment Payment @relation(fields: [paymentId], references: [id])
  @@index([invoiceNumber])
}
```

Notas:
- `TokenSale` permite contabilizar ventas de token como entidad separada (útil para reportes por cantidad de tokens).
- Use `Json` en `Payment.metadata` para guardar ítems/comentarios o precios históricos.

---

## 4) Endpoints API (Backend) 🛠️
Crear rutas protegidas bajo `app/api/admin/billing/*`:
- `GET /api/admin/billing/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` → Resumen (totales, tot tokens, pagos por estado, reembolsos)
- `GET /api/admin/billing/series?metric=revenue|tokens&granularity=day|week|month&from=&to=` → Series temporales para charts
- `GET /api/admin/billing/transactions?status=&method=&userId=&limit=&cursor=&from=&to=` → Lista paginada de transacciones
- `GET /api/admin/billing/token-sales?from=&to=&limit=&cursor=` → Lista de ventas de tokens
- `GET /api/admin/billing/invoices?from=&to=&status=&userId=` → Listar facturas
- `POST /api/admin/billing/export?type=transactions|invoices` → Generar CSV / export

Seguridad:
- Validar sesión y rol en cada route (solo ADMIN/OPERATOR).
- Paginación con cursor para evitar sobrecarga.
- Validar parámetros de fecha y rangos.

---

## 5) Cálculos y Performance 📈
- Realizar agregaciones con Prisma `groupBy` o queries SQL directas para grandes volúmenes.
- Considerar jobs cron (cada noche) para materializar métricas diarias (si se esperan muchos registros).
- Índices en `createdAt`, `status` y `userId` para acelerar consultas.

---

## 6) UI (Frontend) - Estructura y Componentes 🧩
Ubicación sugerida: `app/[locale]/admin/billing/page.tsx` y componentes en `components/admin/`:
- `AdminBillingPanel.tsx` (vista principal)
  - Resumen con KPI cards: **Ingresos**, **Tokens vendidos**, **Pagos completados**, **Tasa de fallos** ✅
  - Controls: date range picker, granularity selector, export button
  - Charts: line chart (revenue), bar chart (tokens), pie chart (methods)
  - Tabs: `Transactions`, `Token Sales`, `Invoices`
- `TransactionsTable.tsx` (tabla con filtros y acciones: ver detalle, reintentar, reembolsar)
- `TokenSalesTable.tsx` (tabla de ventas de tokens)
- `InvoiceDetail.tsx` (panel lateral con datos de factura y link PDF)

Recomendación de librería de gráficas: `recharts` o `chart.js` (ligero y compatible con Next.js).

---

## 7) Experiencia de administración y acciones 🔧
- Acciones rápidas desde la UI: marcar pago como `REFUNDED`, descargar invoice, reemitir factura.
- Logs de auditoría (guardar adminId, acción, timestamp) para acciones críticas.

---

## 8) Tests & Criterios de Aceptación ✅
- Unit tests para endpoints: `summary`, `series`, `transactions` (validar filtros y permisos).
- E2E tests para flujo de export y filtrado (con Playwright/Cypress según stack).
- QA acceptance:
  - Al filtrar por rango, los KPIs y tablas deben coincidir con la consulta directa en DB
  - Export CSV debe contener columnas definidas y respetar filtros
  - Solo admins pueden acceder a las rutas

---

## 9) Plan de Implementación - Tareas (priorizadas) 📝
1. **Schema DB & Migrations** (Prisma) - Crear/actualizar `Payment`, `TokenSale`, `Invoice` (Prioridad: Alta)
2. **API Básica** - `summary`, `transactions` endpoints (Prioridad: Alta)
3. **UI - Panel Resumen** - KPI cards + date picker + charts (Prioridad: Alta)
4. **Tablas y filtros** - Transactions / TokenSales / Invoices (Prioridad: Media)
5. **Export & PDF linking** - Export CSV y gestión de `pdfUrl` en `Invoice` (Prioridad: Media)
6. **Jobs/Materialización** - Agregados nocturnos si necesario (Prioridad: Baja)
7. **Testing y documentación** - Tests unit/E2E y actualizar `DOCUMENTACION_FUNCIONAL.md` (Prioridad: Alta)

---

## 10) Estimaciones y Consideraciones Extra ⏱️
- Cambios de DB + migración: 1-2 días (según complejidad actual)
- API + endpoints agregados: 1-2 días
- UI inicial (KPI + charts): 1-2 días
- Tablas, export y detalles: 1-2 días
- Tests y QA: 1-2 días

Considerar que si se integra pasarela real (Stripe/PayPal), la complejidad aumenta por conciliación y webhook handling.

---

## 11) Archivos y rutas propuestas 🔧
- Prisma: `prisma/schema.prisma` (modelos Payment, TokenSale, Invoice)
- API: `app/api/admin/billing/route.ts` y rutas auxiliares en `app/api/admin/billing/*`
- UI: `app/[locale]/admin/billing/page.tsx`, `components/admin/AdminBillingPanel.tsx`, `components/admin/TransactionsTable.tsx`
- Helpers: `lib/payments.ts`, `lib/reports.ts`
- Tests: `tests/api/admin/billing/*.test.ts`, `e2e/admin-billing.spec.ts`

---

## 12) Criterios de privacidad y contabilidad 📌
- Almacenar solo lo necesario en la DB (evitar datos sensibles de tarjetas).
- Mantener metadatos en `Payment.metadata` y usar pasarelas para datos sensibles.
- Registrar IDs de transacción y referencias para conciliación contable.

---

## 13) Siguientes pasos propuestos (mi recomendación) ✅
1. Confirmar campos obligatorios para factura (razón social, CUIT/NIF, dirección) que requiere negocio.
2. Implementar modelos Prisma y generar migración.
3. Crear endpoints principales (`summary`, `transactions`) y un mock dataset para UI.
4. Entregar un primer prototipo UI con KPI y chart básicos.

---

Si quieres, puedo comenzar por **implementar el primer paso: el modelo Prisma + migración** y crear los endpoints `summary` y `transactions` básicos. ¿Quieres que lo haga ahora?
