# Tareas Pendientes - ViaSonora

**Fecha de creación:** 2025-01-02  
**Última actualización:** 2025-01-02  
**Estado actual:** Etapas 1-3 completas ✅, Etapa 4 pendiente  
**Objetivo:** Completar funcionalidades faltantes según planificación de etapas

---

## 📋 Índice

2. [Etapa 3 - Funcionalidades Faltantes](#etapa-3---funcionalidades-faltantes)
3. [Etapa 4 - Funcionalidades Faltantes](#etapa-4---funcionalidades-faltantes)
4. [Priorización](#priorización)
5. [Detalles Técnicos](#detalles-técnicos)

---
## 2. Etapa 3 - Funcionalidades Faltantes

### ✅ 2.1 Sistema de Reportes de Posts

**Estado:** ✅ Completado  
**Prioridad:** Alta  
**Complejidad:** Media

#### Descripción
Permitir que usuarios reporten posts por diversas razones (contenido inapropiado, spam, información incorrecta, etc.). Los administradores pueden revisar y gestionar estos reportes.

#### Requisitos
- Cualquier usuario puede reportar un post
- Razones predefinidas (enum): SPAM, INAPPROPRIATE, FAKE, OTHER
- Campo de comentario opcional
- Panel de admin para ver y gestionar reportes
- Un usuario no puede reportar el mismo post dos veces
- Los reportes deben asociarse al post reportado

#### Tareas Técnicas

**2.1.1 Schema/Base de Datos**
- [x] Crear enum `ReportReason` en Prisma
  ```prisma
  enum ReportReason {
    SPAM
    INAPPROPRIATE
    FAKE
    INCORRECT_INFO
    OTHER
  }
  ```
- [x] Crear modelo `PostReport` en Prisma
  ```prisma
  model PostReport {
    id          String      @id @default(cuid())
    postId      String
    reporterId  String      // Usuario que reporta
    reason      ReportReason
    comment     String?     @db.Text
    status      ReportStatus @default(PENDING) // PENDING, REVIEWED, RESOLVED, DISMISSED
    reviewedBy  String?     // Admin/Operator que revisó
    reviewedAt  DateTime?
    createdAt   DateTime    @default(now())
    
    post        Post        @relation(fields: [postId], references: [id], onDelete: Cascade)
    reporter    User        @relation("Reporter", fields: [reporterId], references: [id])
    reviewer    User?       @relation("Reviewer", fields: [reviewedBy], references: [id])
    
    @@unique([postId, reporterId]) // Un usuario no puede reportar el mismo post dos veces
    @@index([postId])
    @@index([status])
    @@index([reporterId])
  }
  ```
- [x] Crear enum `ReportStatus`
- [x] Agregar relaciones a `Post` y `User`
- [x] Crear y ejecutar migración

**2.1.2 Validación Backend**
- [x] Crear schema Zod para crear reporte (`lib/validation.ts`)
- [x] Validar que el usuario no haya reportado el mismo post antes

**2.1.3 API - Reportes**
- [x] `POST /api/reports` - Crear nuevo reporte
- [x] `GET /api/reports?status=PENDING` - Listar reportes (solo admin/operator)
- [x] `PUT /api/reports/[id]` - Actualizar status (marcar como revisado/resuelto)

**2.1.4 UI - Reportar Post**
- [x] Agregar botón "Reportar" en `PostDetail.tsx` (solo si no es el owner)
- [x] Crear componente `ReportPostDialog.tsx`
  - Select para razón del reporte
  - Textarea para comentario opcional
  - Botón de envío
- [x] Validación y mensaje de éxito/error

**2.1.5 UI - Panel de Admin**
- [x] Crear página `/admin/reports` o agregar sección en `/admin`
- [x] Listar reportes pendientes con:
  - Post reportado (con link)
  - Usuario que reportó
  - Razón
  - Comentario
  - Fecha
- [x] Botones de acción:
  - "Ver Post" - Link al post
  - "Marcar como Resuelto" - Cambiar status a RESOLVED
  - "Descartar" - Cambiar status a DISMISSED
- [x] Filtros por status (PENDING, REVIEWED, RESOLVED, DISMISSED)

**2.1.6 Testing**
- [x] Usuario reporta post → debe crear reporte
- [x] Usuario intenta reportar mismo post dos veces → debe rechazar
- [x] Admin ve reportes pendientes
- [x] Admin marca reporte como resuelto
- [x] Guía de tests manuales creada (`GUIA_TESTS_REPORTES.md`)

---

### 🟡 2.2 Aprobar Owners

**Estado:** ❌ No implementado  
**Prioridad:** Media  
**Complejidad:** Baja-Media

#### Descripción
Permitir que operadores/admins aprueben usuarios antes de que puedan ser OWNERs. Esto puede ser un sistema de verificación manual o automático.

#### Requisitos
- Opcional: Campo `ownerApproved` en User (Boolean)
- Opcional: Si es manual, panel de admin para aprobar owners
- Si es automático, todos los usuarios con rol OWNER están aprobados por defecto

#### Tareas Técnicas (Si se decide implementar manual)

**2.2.1 Schema/Base de Datos (Opcional)**
- [ ] Agregar campo `ownerApproved Boolean @default(false)` a modelo `User`
- [ ] Crear y ejecutar migración

**2.2.2 API (Opcional)**
- [ ] `PUT /api/admin/users/[id]/approve-owner` - Aprobar usuario como owner
- [ ] Validar que solo ADMIN/OPERATOR pueden aprobar

**2.2.3 UI - Panel de Admin (Opcional)**
- [ ] Lista de usuarios con rol OWNER pero no aprobados
- [ ] Botón "Aprobar Owner" por usuario
- [ ] Ver información del usuario antes de aprobar

**2.2.4 Lógica de Negocio (Opcional)**
- [ ] Validar que usuarios no aprobados no puedan crear posts
- [ ] O mostrar mensaje informativo si no están aprobados

**Nota:** Esta funcionalidad puede no ser necesaria si todos los usuarios con rol OWNER están aprobados automáticamente.

---

## 3. Etapa 4 - Funcionalidades Faltantes

### ✅ 3.1 Cron Job Automático para Expiración

**Estado:** ✅ Implementado (Vercel Cron + endpoint protegido)  
**Prioridad:** Media  
**Complejidad:** Media

#### Descripción
Actualmente los posts tienen `expiresAt` pero no hay un proceso automático que marque posts como EXPIRED. Se necesita un cron job que ejecute periódicamente.

#### Requisitos
- Ejecutar diariamente (o según configuración)
- Buscar posts con `status = APPROVED` y `expiresAt <= now`
- Cambiar status a `EXPIRED`
- Logging de posts expirados

#### Tareas Técnicas

**3.1.1 API Endpoint**
- [x] Crear `POST /api/cron/expire-posts` (protegido con secret key)
- [x] Lógica para buscar y actualizar posts expirados
- [x] Retornar cantidad de posts expirados

**3.1.2 Cron Job (Vercel)**
- [x] Configurar Vercel Cron Job en `vercel.json`
  ```json
  {
    "crons": [{
      "path": "/api/cron/expire-posts",
      "schedule": "0 0 * * *"  // Diario a medianoche
    }]
  }
  ```
- [x] Agregar variable de entorno `CRON_SECRET` para proteger endpoint
- [x] Validar secret en el endpoint

**3.1.3 Alternativa: API Route manual**
- [x] Si no se usa Vercel Cron, crear endpoint ejecutable manualmente
- [x] Documentar cómo ejecutarlo periódicamente

**3.1.4 Testing**
- [ ] Crear post con expiresAt en el pasado
- [ ] Ejecutar cron job
- [ ] Verificar que el post cambió a EXPIRED

---

### 🔴 3.2 Tabla Payment Stub

**Estado:** ❌ No implementado  
**Prioridad:** Baja (Stub/Mock)  
**Complejidad:** Baja

#### Descripción
Crear estructura básica para pagos (sin integración real de pago). Solo stub/mock para preparar la base para futura implementación.

#### Requisitos
- Tabla Payment con campos básicos
- Relación con Request
- Estados de pago (PENDING, COMPLETED, FAILED, REFUNDED)
- Sin integración real de pago (solo estructura)

#### Tareas Técnicas

**3.2.1 Schema/Base de Datos**
- [ ] Crear enum `PaymentStatus`
  ```prisma
  enum PaymentStatus {
    PENDING
    COMPLETED
    FAILED
    REFUNDED
  }
  ```
- [ ] Crear modelo `Payment` en Prisma
  ```prisma
  model Payment {
    id            String        @id @default(cuid())
    requestId     String        @unique
    amount        Float
    currency      String        @default("USD")
    status        PaymentStatus @default(PENDING)
    paymentMethod String?       // "credit_card", "paypal", etc. (mock)
    transactionId String?       // ID mock de transacción
    paidAt        DateTime?
    failedAt      DateTime?
    refundedAt    DateTime?
    createdAt     DateTime      @default(now())
    updatedAt     DateTime      @updatedAt
    
    request Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
    
    @@index([requestId])
    @@index([status])
  }
  ```
- [ ] Agregar relación `payment Payment?` a modelo `Request`
- [ ] Crear y ejecutar migración

**3.2.2 API (Opcional - Solo si se necesita UI)**
- [ ] `POST /api/payments` - Crear pago mock (solo para testing)
- [ ] `GET /api/payments/[id]` - Obtener pago
- [ ] `PUT /api/payments/[id]` - Actualizar status (mock)

**3.2.3 UI (Opcional)**
- [ ] Mostrar estado de pago en RequestDetail (si aplica)
- [ ] Solo mostrar estructura, sin funcionalidad real

**Nota:** Esta es solo estructura. La integración real de pago será futura.

---

### ✅ 3.3 Feature Flags

**Estado:** ✅ Implementado (database + API + panel admin)  
**Prioridad:** Baja  
**Complejidad:** Media

#### Descripción
Sistema básico de feature flags para habilitar/deshabilitar funcionalidades sin deploy. Puede ser simple (env vars) o más complejo (DB).

#### Opción A: Simple (Env Vars)
- Usar variables de entorno
- No requiere base de datos
- Requiere redeploy para cambiar

#### Opción B: Complejo (Database)
- Tabla `FeatureFlag` en base de datos
- Panel de admin para gestionar flags
- Cambios sin redeploy

#### Tareas Técnicas (Opción A - Simple)

**3.3.1 Variables de Entorno**
- [ ] Definir flags en `.env.example`
  ```
  NEXT_PUBLIC_FEATURE_PAYMENTS=false
  NEXT_PUBLIC_FEATURE_NOTIFICATIONS=false
  FEATURE_EXPIRE_AUTOMATIC=true
  ```

**3.3.2 Utilidad**
- [ ] Crear `lib/feature-flags.ts`
  ```typescript
  export const FEATURES = {
    PAYMENTS: process.env.NEXT_PUBLIC_FEATURE_PAYMENTS === 'true',
    NOTIFICATIONS: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS === 'true',
    EXPIRE_AUTOMATIC: process.env.FEATURE_EXPIRE_AUTOMATIC === 'true',
  };
  ```

**3.3.3 Uso**
- [ ] Usar flags en código donde corresponda
- [ ] Ejemplo: `if (FEATURES.PAYMENTS) { ... }`

#### Tareas Técnicas (Opción B - Database) - Implementada

**3.3.1 Schema/Base de Datos**
- [x] Crear modelo `FeatureFlag`
  ```prisma
  model FeatureFlag {
    id          String   @id @default(cuid())
    key         String   @unique
    enabled     Boolean  @default(false)
    description String?
    updatedAt   DateTime @updatedAt
  }
  ```

**3.3.2 API**
- [x] `GET /api/feature-flags` - Listar flags (público para client-side)
- [x] `PUT /api/admin/feature-flags/[key]` - Actualizar flag (solo admin)

**3.3.3 UI - Panel de Admin**
- [x] Lista de feature flags
- [x] Toggle para habilitar/deshabilitar
- [x] Descripción de cada flag

**Recomendación:** Empezar con Opción A (env vars) y migrar a Opción B si es necesario.

---

## 4. Priorización

### 🔴 Alta Prioridad (Implementar primero)

~~2. **Sistema de Reportes (2.1)**~~ ✅ Completado

### 🟡 Media Prioridad (Después)

3. **Aprobar Owners (2.2)** - Evaluar si es necesario

### 🟢 Baja Prioridad (Puede esperar)

4. **Payment Stub (3.2)** - Solo estructura, no funcionalidad real

---

## 5. Detalles Técnicos

### 5.1 Orden Recomendado de Implementación (Histórico)

1. **Día 1 - Mañana:**
   - Disponibilidad por Instrumento (Schema + Migración)
   - Disponibilidad por Instrumento (UI Formulario)

2. **Día 1 - Tarde:**
   - Disponibilidad por Instrumento (Validación + API)
   - Disponibilidad por Instrumento (Testing)

3. **Día 2 - Mañana:**
   - Sistema de Reportes (Schema + Migración)
   - Sistema de Reportes (API)

4. **Día 2 - Tarde:**
   - Sistema de Reportes (UI - Reportar)
   - Sistema de Reportes (UI - Panel Admin)

5. **Día 3:**
   - Payment Stub (Schema)
   - Ajustes operativos adicionales según priorización

### 5.2 Consideraciones Importantes

- **Migraciones:** Ejecutar migraciones en orden, hacer backup antes
- **Testing:** Probar cada funcionalidad antes de continuar
- **Documentación:** Actualizar `DOCUMENTACION_FUNCIONAL.md` después de cada implementación
- **Traducciones:** Agregar textos a `messages/es.json`, `messages/en.json`, `messages/it.json`

### 5.3 Archivos Clave a Modificar

- `prisma/schema.prisma` - Modelos y enums
- `lib/validation.ts` - Schemas Zod
- `app/api/*` - Endpoints API
- `components/*` - Componentes UI
- `messages/*.json` - Traducciones
- `DOCUMENTACION_FUNCIONAL.md` - Actualizar documentación

---

## 6. Notas Adicionales

### 6.1 Funcionalidades Opcionales/No Clarificadas

- **Aprobar Owners (2.2):** Evaluar si realmente se necesita aprobación manual o si todos los usuarios con rol OWNER están automáticamente aprobados.

### 6.2 Mejoras Futuras (Fuera del Alcance Actual)

Según `DOCUMENTACION_FUNCIONAL.md`, estas están fuera del MVP:
- Sistema de notificaciones (email/push)
- Traducción automática de contenido
- Sistema de mensajería entre usuarios
- Sistema de calificaciones/reviews
- Sistema de pagos completo (solo stub en Etapa 4)

---

## 7. Resumen de Completados

### ✅ Etapa 2 - Completada

**1.1 Disponibilidad por Instrumento** ✅
- Schema y migración implementados
- Validación backend completa
- UI completa (formulario, visualización, solicitud)
- APIs implementadas
- Testing y documentación completados
- Seed actualizado con datos de prueba
- Guía de tests manuales creada (`GUIA_TESTS_MANUALES.md`)
- Calendario mejorado con días disponibles resaltados
- Correcciones de seguridad (direcciones completas)

### ✅ Etapa 3 - Funcionalidades Completadas

**2.1 Sistema de Reportes de Posts** ✅
- Schema y migración implementados (ReportReason, ReportStatus, PostReport)
- Validación backend completa (schemas Zod, validación de duplicados)
- APIs implementadas (POST, GET, PUT /api/reports)
- UI completa (ReportPostDialog, botón en PostDetail, panel de admin)
- Panel de admin con tabs (Publicaciones y Reportes)
- Filtros por status (PENDING, REVIEWED, RESOLVED, DISMISSED)
- Guía de tests manuales creada (`GUIA_TESTS_REPORTES.md`)

---

**Fin del Documento**

*Última actualización: 2025-01-02*
