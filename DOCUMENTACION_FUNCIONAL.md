# Documentación Funcional - ViaSonora

**Versión:** 1.3  
**Última actualización:** 2026-05-07 - Etapa 3 completada (moderación + reportes + feature flags)  
**Estado:** MVP en desarrollo - Etapa 3 completada ✅, Etapa 4 pendiente

---

## 📑 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Modelo de Datos y Estados](#modelo-de-datos-y-estados)
3. [Roles y Permisos](#roles-y-permisos)
4. [Flujos de Trabajo Principales](#flujos-de-trabajo-principales)
5. [Estados y Transiciones](#estados-y-transiciones)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Reglas de Negocio](#reglas-de-negocio)

---

## 1. Resumen Ejecutivo

### 1.1 Propósito del Sistema

ViaSonora es un marketplace que conecta músicos viajeros con propietarios de instrumentos musicales. El sistema permite:

- **OWNER**: Publicar instrumentos musicales con fotos y ubicación aproximada
- **CLIENT**: Buscar instrumentos por ciudad/tipo, ver posts en mapa o lista, y enviar solicitudes
- **ADMIN/OPERATOR**: Moderar publicaciones y gestionar el marketplace

### 1.2 Características Principales

- ✅ Autenticación (Google OAuth + Email/Password)
- ✅ Gestión de instrumentos (CRUD completo)
- ✅ Disponibilidad por instrumento (días de semana + rangos horarios)
- ✅ Publicaciones de instrumentos (Posts) con moderación
- ✅ Sistema de solicitudes (Requests) con revelación condicional de contacto
- ✅ Validación de solicitudes según disponibilidad del instrumento
- ✅ Sistema de reportes de posts (usuarios pueden reportar contenido inapropiado)
- ✅ Mapa interactivo con ubicaciones aproximadas (jitter)
- ✅ Panel de administración para moderación y gestión de reportes
- ✅ Multi-idioma (ES/EN/DE/FR/IT)

### 1.3 Entidades Principales

1. **User** - Usuarios del sistema
2. **Instrument** - Instrumentos musicales
3. **Post** - Publicaciones de instrumentos
4. **Request** - Solicitudes de alquiler/prestamo
5. **Category** - Categorías de instrumentos
6. **PostReport** - Reportes de posts por usuarios

---

## 2. Modelo de Datos y Estados

### 2.1 User (Usuario)

#### Campos Principales
- `id`, `name`, `lastName`, `email`, `image`
- `phone`, `whatsappUrl`, `addressText`, `locationText`
- `lat`, `lng` (ubicación exacta - nunca se expone directamente)
- `roles`: `UserRole[]` (OWNER, CLIENT)
- `staffRole`: `StaffRole` (NONE, OPERATOR, ADMIN)
- `onboardingCompleted`, `termsAcceptedAt`

#### Roles de Usuario
- **OWNER**: Puede crear/editar/eliminar instrumentos y posts, gestionar requests recibidos
- **CLIENT**: Puede ver posts, enviar requests, ver requests enviados
- **ADMIN**: Todos los permisos + administración completa
- **OPERATOR**: Moderar posts, aprobar owners, ver reportes

### 2.2 Instrument (Instrumento)

#### Campos Principales
- `id`, `ownerId`, `title`, `description`
- `categoryId`, `brand`, `model`, `condition`
- `extras` (accesorios opcionales)
- Relaciones: `photos[]`, `locations[]`, `posts[]`, `requests[]`, `availability[]`

#### Disponibilidad (InstrumentAvailability)
- Configuración opcional de días de la semana y horarios de disponibilidad
- Cada disponibilidad incluye: `dayOfWeek` (0=Domingo, 6=Sábado), `startTime`, `endTime`
- Si no se configura disponibilidad, el instrumento está disponible en cualquier fecha/hora
- Si se configura, las solicitudes deben respetar los días y horarios definidos

#### Estados
- No tiene estados propios (es una entidad base)
- Su visibilidad depende del estado de los Posts asociados

### 2.3 Post (Publicación)

#### Campos Principales
- `id`, `instrumentId`, `ownerId`
- `city`, `areaText` (para búsqueda)
- `status`: `PostStatus`
- `expiresAt` (30 días desde creación)

#### Estados: PostStatus

```
PENDING_APPROVAL → APPROVED → (ACTIVO)
                ↘ REJECTED
                ↘ BANNED
                ↘ EXPIRED (automático después de expiresAt)
```

**Descripción de Estados:**

| Estado | Descripción | Visibilidad Pública | Puede Recibir Requests |
|--------|-------------|---------------------|------------------------|
| `PENDING_APPROVAL` | Esperando moderación | ❌ No | ❌ No |
| `APPROVED` | Aprobado y activo | ✅ Sí | ✅ Sí |
| `REJECTED` | Rechazado por moderador | ❌ No | ❌ No |
| `BANNED` | Baneado por moderador | ❌ No | ❌ No |
| `EXPIRED` | Expirado (expiresAt < now) | ❌ No | ❌ No |

**Transiciones Permitidas:**

```
- PENDING_APPROVAL → APPROVED (por ADMIN/OPERATOR)
- PENDING_APPROVAL → REJECTED (por ADMIN/OPERATOR)
- APPROVED → BANNED (por ADMIN/OPERATOR)
- REJECTED → BANNED (por ADMIN/OPERATOR)
- BANNED → APPROVED (por ADMIN/OPERATOR - desbanear)
- Cualquier estado → EXPIRED (automático cuando expiresAt < now)
```

### 2.4 Request (Solicitud)

#### Campos Principales
- `id`, `postId`, `instrumentId`
- `ownerId`, `clientId`
- `status`: `RequestStatus`
- `fromDate`, `toDate` (período de uso)
- `message` (obligatorio, min 10 caracteres)
- `accessories` (opcional)

#### Estados: RequestStatus

```
REQUESTED → ACCEPTED → COMPLETED
         ↘ DECLINED
         ↘ CANCELLED (por CLIENT)
```

**Descripción de Estados:**

| Estado | Descripción | Quién Puede Cambiar | Contacto Visible |
|--------|-------------|---------------------|------------------|
| `REQUESTED` | Solicitud enviada, esperando respuesta | OWNER (aceptar/rechazar) o CLIENT (cancelar) | ❌ No |
| `ACCEPTED` | Aceptada por el OWNER | OWNER → COMPLETED, CLIENT → CANCELLED | ✅ Sí (para CLIENT) |
| `DECLINED` | Rechazada por el OWNER | ❌ No se puede cambiar | ❌ No |
| `CANCELLED` | Cancelada por el CLIENT | ❌ No se puede cambiar | ❌ No |
| `COMPLETED` | Completada (marcada por OWNER) | ❌ No se puede cambiar | ✅ Sí (para CLIENT) |

**Transiciones Permitidas:**

```
Por OWNER:
- REQUESTED → ACCEPTED
- REQUESTED → DECLINED
- ACCEPTED → COMPLETED

Por CLIENT:
- REQUESTED → CANCELLED
- ACCEPTED → CANCELLED

Reglas:
- COMPLETED, DECLINED, CANCELLED son estados finales (no se pueden cambiar)
- Solo se puede tener UNA request ACTIVA (REQUESTED o ACCEPTED) por post por CLIENT
```

### 2.5 Category (Categoría)

#### Campos Principales
- `id`, `name`, `nameEs`, `nameIt`, `nameEn`, `slug`
- `description`, `icon`

#### Estados
- No tiene estados (entidad de referencia estática)

---

## 3. Roles y Permisos

### 3.1 Matriz de Permisos

| Acción | OWNER | CLIENT | OPERATOR | ADMIN |
|--------|-------|--------|----------|-------|
| Crear Instrumento | ✅ | ❌ | ✅ | ✅ |
| Editar Instrumento (propio) | ✅ | ❌ | ❌ | ❌ |
| Eliminar Instrumento (propio) | ✅ | ❌ | ❌ | ❌ |
| Crear Post | ✅ | ❌ | ✅ | ✅ |
| Editar Post (propio) | ✅ | ❌ | ❌ | ❌ |
| Eliminar Post (propio) | ✅ | ❌ | ❌ | ❌ |
| Ver Posts Públicos | ✅ | ✅ | ✅ | ✅ |
| Enviar Request | ✅* | ✅ | ✅* | ✅* |
| Aceptar/Rechazar Request | ✅ (propias) | ❌ | ❌ | ❌ |
| Cancelar Request | ✅ (propias) | ✅ (propias) | ❌ | ❌ |
| Moderar Posts | ❌ | ❌ | ✅ | ✅ |
| Acceder a /admin | ❌ | ❌ | ✅ | ✅ |

\* OWNER, OPERATOR, ADMIN pueden enviar requests si tienen rol CLIENT también.

### 3.2 Reglas Especiales

- Un usuario puede tener múltiples roles: `roles: ['OWNER', 'CLIENT']`
- `staffRole` es independiente de `roles` (puede ser ADMIN sin ser OWNER/CLIENT)
- Para enviar requests, el usuario DEBE tener rol `CLIENT`
- OWNER no puede enviar request a sus propios posts

---

## 4. Flujos de Trabajo Principales

### 4.1 Flujo: Publicar Instrumento (OWNER)

```
1. Usuario inicia sesión (OWNER)
   ↓
2. Va a /instruments → "Nuevo Instrumento"
   ↓
3. Completa formulario:
   - Título, descripción, categoría
   - Marca, modelo, condición
   - Extras (opcional)
   - Sube 3-10 fotos
   - Agrega ubicaciones (ciudad, zona, lat/lng)
   ↓
4. Guarda → Instrumento creado
   ↓
5. Va a /posts → "Nuevo Post"
   ↓
6. Selecciona instrumento
   ↓
7. Post creado con status = PENDING_APPROVAL
   ↓
8. ADMIN/OPERATOR modera → APPROVED
   ↓
9. Post visible en mapa/explore
```

### 4.2 Flujo: Buscar y Solicitar Instrumento (CLIENT)

```
1. Usuario inicia sesión (CLIENT)
   ↓
2. Va a /explore o Home (mapa)
   ↓
3. Busca por ciudad/categoría/texto
   ↓
4. Ve posts APPROVED en mapa o lista
   ↓
5. Click en post → Detalle
   ↓
6. NO ve contacto (oculto)
   ↓
7. Click "Enviar Solicitud"
   ↓
8. Completa formulario:
   - Fecha inicio/fin (validadas según disponibilidad del instrumento)
   - Hora inicio/fin (validadas según disponibilidad del instrumento)
   - Mensaje (obligatorio)
   - Accesorios (opcional)
   ↓
9. Sistema valida que las fechas/horarios coincidan con disponibilidad del instrumento
   - Si no hay disponibilidad configurada: permite cualquier fecha/hora
   - Si hay disponibilidad: valida días de semana y rangos horarios
   ↓
10. Request creada con status = REQUESTED (si pasa validación)
   ↓
11. OWNER recibe notificación (en /requests)
    ↓
12. OWNER acepta → status = ACCEPTED
    ↓
13. CLIENT ve contacto en detalle del post
    ↓
14. CLIENT contacta al OWNER
    ↓
15. (Opcional) OWNER marca como COMPLETED
```

### 4.3 Flujo: Moderación de Posts (ADMIN/OPERATOR)

```
1. Usuario inicia sesión (ADMIN/OPERATOR)
   ↓
2. Va a /admin
   ↓
3. Ve lista de posts filtrados por status
   ↓
4. Selecciona post PENDING_APPROVAL
   ↓
5. Revisa información:
   - Detalles del instrumento
   - Fotos
   - Información del propietario
   ↓
6. Decisión:
   - Aprobar → status = APPROVED (post visible públicamente)
   - Rechazar → status = REJECTED (post oculto)
   - Banear → status = BANNED (post oculto, más severo)
   ↓
7. Post cambia de estado
   ↓
8. Si APPROVED: Post aparece en mapa/explore
```

### 4.4 Flujo: Gestión de Requests (OWNER)

```
1. OWNER inicia sesión
   ↓
2. Va a /requests → "Recibidas"
   ↓
3. Ve lista de requests REQUESTED
   ↓
4. Selecciona request
   ↓
5. Revisa:
   - Información del CLIENT
   - Fechas solicitadas
   - Mensaje
   - Accesorios
   ↓
6. Decisión:
   - Aceptar → status = ACCEPTED
     → Contacto se revela al CLIENT
   - Rechazar → status = DECLINED
     → Contacto permanece oculto
   ↓
7. Si ACCEPTED:
   - CLIENT puede ver contacto
   - OWNER puede marcar como COMPLETED después
```

### 4.5 Flujo: Cancelación de Request (CLIENT)

```
1. CLIENT inicia sesión
   ↓
2. Va a /requests → "Enviadas"
   ↓
3. Ve request con status = REQUESTED o ACCEPTED
   ↓
4. Click "Cancelar"
   ↓
5. Confirma cancelación
   ↓
6. Request cambia a status = CANCELLED
   ↓
7. Si estaba ACCEPTED:
   - Contacto deja de ser visible
   - OWNER es notificado (en su lista)
```

### 4.6 Flujo: Expiración de Posts (Automático)

```
1. Post creado con expiresAt = now + 30 días
   ↓
2. Post en estado APPROVED
   ↓
3. Cron job ejecuta (o manual)
   ↓
4. Busca posts con:
   - status = APPROVED
   - expiresAt <= now
   ↓
5. Cambia status = EXPIRED
   ↓
6. Post ya no visible públicamente
   ↓
7. Requests existentes siguen activas
   (el post expirado no afecta requests ya creadas)
```

---

## 5. Estados y Transiciones

### 5.1 Diagrama de Estados: Post

```
                    ┌──────────────┐
                    │ PENDING_     │
                    │ APPROVAL     │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌───────────┐  ┌──────────┐  ┌──────────┐
    │ APPROVED  │  │ REJECTED │  │  BANNED  │
    └─────┬─────┘  └─────┬────┘  └─────┬────┘
          │              │              │
          │              └──────┬───────┘
          │                     │
          │              ┌──────▼──────┐
          │              │   BANNED    │
          │              └─────────────┘
          │
          │ (expiresAt < now)
          ▼
    ┌───────────┐
    │  EXPIRED  │ (estado final)
    └───────────┘
```

**Actores y Acciones:**
- **ADMIN/OPERATOR**: PENDING_APPROVAL → APPROVED/REJECTED/BANNED
- **ADMIN/OPERATOR**: REJECTED/APPROVED → BANNED
- **ADMIN/OPERATOR**: BANNED → APPROVED (desbanear)
- **Sistema (Cron)**: APPROVED → EXPIRED (automático)

### 5.2 Diagrama de Estados: Request

```
                    ┌──────────┐
                    │ REQUESTED│
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    (OWNER)        (OWNER)        (CLIENT)
    acepta         rechaza        cancela
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ ACCEPTED │  │ DECLINED │  │ CANCELLED│
    └────┬─────┘  └──────────┘  └──────────┘
         │              │              │
         │         (final)       (final)
         │
    ┌────┴────┐
    │         │
(OWNER)   (CLIENT)
completa  cancela
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│COMPLETED│ │ CANCELLED│
└────────┘ └──────────┘
   │            │
(final)      (final)
```

**Actores y Acciones:**
- **OWNER**: REQUESTED → ACCEPTED/DECLINED
- **CLIENT**: REQUESTED/ACCEPTED → CANCELLED
- **OWNER**: ACCEPTED → COMPLETED
- **Estados finales**: COMPLETED, DECLINED, CANCELLED (no se pueden cambiar)

### 5.3 Revelación de Contacto

El contacto del OWNER (phone, email, whatsappUrl, addressText, locationText, lat/lng) se revela SOLO cuando:

```
Condiciones para revelar contacto:
┌─────────────────────────────────────┐
│ 1. Usuario es OWNER del post        │ → SIEMPRE ve su contacto
│ 2. Usuario es CLIENT con request    │
│    status = ACCEPTED para ese post  │ → Ve contacto del OWNER
│ 3. Cualquier otro caso              │ → NO ve contacto
└─────────────────────────────────────┘
```

**Implementación:**
- API `/api/posts/[id]` verifica si existe request ACCEPTED
- Si existe: incluye contacto en la respuesta
- Si no existe: excluye contacto (solo muestra name, lastName, image, locationText)

---

## 6. APIs y Endpoints

### 6.1 Autenticación

```
POST /api/auth/register      - Registrar usuario (email/password)
POST /api/auth/[...nextauth] - NextAuth (Google OAuth, Credentials)
```

### 6.2 Usuario

```
GET  /api/me                 - Obtener perfil del usuario logueado
PUT  /api/me                 - Actualizar perfil
```

### 6.3 Instrumentos

```
GET    /api/instruments      - Listar instrumentos del usuario
POST   /api/instruments      - Crear instrumento
GET    /api/instruments/[id] - Obtener instrumento
PUT    /api/instruments/[id] - Actualizar instrumento
DELETE /api/instruments/[id] - Eliminar instrumento
```

### 6.4 Posts

```
GET    /api/posts?my=true              - Listar mis posts
GET    /api/posts?city=...&categoryId= - Buscar posts públicos (APPROVED, no expirados)
POST   /api/posts                      - Crear post
GET    /api/posts/[id]                 - Obtener post (con contacto si request ACCEPTED)
PUT    /api/posts/[id]                 - Actualizar post (solo owner)
DELETE /api/posts/[id]                 - Eliminar post (solo owner)
```

### 6.5 Requests

```
GET    /api/requests?type=sent     - Listar requests enviadas
GET    /api/requests?type=received - Listar requests recibidas
GET    /api/requests               - Listar todas (sent + received)
POST   /api/requests               - Crear request (valida disponibilidad del instrumento)
GET    /api/requests/[id]          - Obtener request
PUT    /api/requests/[id]          - Actualizar status (aceptar/rechazar/cancelar/completar)
```

### 6.6 Categorías

```
GET /api/categories - Listar todas las categorías
```

### 6.7 Administración

```
GET /api/admin/posts?status=... - Listar posts para moderación
PUT /api/admin/posts/[id]       - Actualizar status de post (moderar)
```

### 6.8 Upload

```
POST /api/upload - Subir imagen (folder: 'instruments' o 'profile')
```

---

## 7. Reglas de Negocio

### 7.1 Reglas de Posts

1. **Creación:**
   - Solo usuarios con rol OWNER pueden crear posts
   - Post siempre se crea con status = PENDING_APPROVAL
   - expiresAt = now + 30 días (fijo)
   - Debe estar asociado a un Instrument existente del usuario

2. **Visibilidad:**
   - Solo posts con status = APPROVED y expiresAt > now son visibles públicamente
   - Owner siempre puede ver sus posts (cualquier estado)
   - Posts PENDING_APPROVAL, REJECTED, BANNED, EXPIRED no son visibles públicamente

3. **Moderación:**
   - Solo ADMIN/OPERATOR pueden cambiar status de posts
   - Transiciones válidas están definidas en sección 5.1

### 7.2 Reglas de Requests

1. **Creación:**
   - Solo usuarios con rol CLIENT pueden crear requests
   - No se puede enviar request a tu propio post (si eres OWNER)
   - Solo se puede enviar request a posts con status = APPROVED
   - Solo puede haber UNA request ACTIVA (REQUESTED o ACCEPTED) por post por CLIENT
   - message es obligatorio (min 10 caracteres)
   - toDate debe ser posterior a fromDate

2. **Gestión:**
   - OWNER puede aceptar/rechazar requests de sus posts
   - CLIENT puede cancelar sus propias requests (REQUESTED o ACCEPTED)
   - OWNER puede marcar como COMPLETED requests ACCEPTED
   - Estados finales (COMPLETED, DECLINED, CANCELLED) no se pueden cambiar

3. **Contacto:**
   - Contacto se revela SOLO si request.status = ACCEPTED
   - Owner siempre ve su propio contacto
   - Implementado mediante verificación en API /api/posts/[id]

### 7.3 Reglas de Instrumentos

1. **Creación:**
   - Solo usuarios con rol OWNER pueden crear instrumentos
   - Debe tener al menos 3 fotos (máximo 10)
   - Debe tener al menos 1 ubicación
   - Una ubicación debe ser marcada como isPrimary = true
   - Disponibilidad es opcional (si no se configura, el instrumento está disponible siempre)
   - Si se configura disponibilidad:
     - Puede definir disponibilidad por días de la semana (0=Domingo, 6=Sábado)
     - Cada día puede tener un rango horario (formato HH:mm)
     - endTime debe ser posterior a startTime
     - Puede configurar diferentes horarios para diferentes días

2. **Edición/Eliminación:**
   - Solo el owner puede editar/eliminar sus instrumentos
   - Si se elimina un instrumento, se eliminan en cascada:
     - Photos
     - Locations
     - Posts
     - Requests

### 7.4 Reglas de Privacidad (Ubicación)

1. **Almacenamiento:**
   - Se guardan coordenadas exactas (lat/lng) en base de datos
   - Solo se exponen coordenadas exactas al OWNER del post

2. **Visualización Pública:**
   - Coordenadas públicas se aplican "jitter" (ruido aleatorio)
   - Jitter: ±0.001-0.002 grados (~100-200m)
   - Función: `getPublicLatLng(lat, lng) => jittered coords`
   - Se muestra también `areaText` (zona/barrio) como referencia

3. **Revelación Exacta:**
   - Coordenadas exactas se revelan SOLO cuando:
     - Usuario es OWNER del post, O
     - Usuario es CLIENT con request ACCEPTED

### 7.5 Reglas de Autenticación

1. **Métodos:**
   - Google OAuth (NextAuth)
   - Email/Password (Credentials provider)

2. **Onboarding:**
   - Usuario debe completar perfil y aceptar T&C
   - `onboardingCompleted` se marca cuando se aceptan términos
   - No es obligatorio completar todos los campos para crear posts/requests

3. **Roles:**
   - Usuario puede tener múltiples roles: ['OWNER', 'CLIENT']
   - `staffRole` es independiente (NONE, OPERATOR, ADMIN)
   - Roles se asignan manualmente o por defecto al crear cuenta

### 7.6 Reglas de Moderación

1. **Acceso:**
   - Solo usuarios con staffRole = ADMIN o OPERATOR
   - Protegido mediante middleware/auth en /admin

2. **Acciones:**
   - Aprobar posts (PENDING_APPROVAL → APPROVED)
   - Rechazar posts (PENDING_APPROVAL → REJECTED)
   - Banear posts (cualquier estado → BANNED)
   - Desbanear posts (BANNED → APPROVED)

3. **Filtros:**
   - Pueden filtrar posts por status
   - Pueden ver todos los posts (incluso no públicos)

---

## 8. Diagramas de Flujo

### 8.1 Flujo Completo: CLIENT solicita instrumento

```
┌─────────────┐
│   CLIENT    │
│  inicia     │
│  sesión     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Busca posts en   │
│ /explore o mapa  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      ┌──────────────────┐
│ Ve post APPROVED │      │ Ve detalle post  │
│ (sin contacto)   │─────▶│ Contacto OCULTO  │
└──────┬───────────┘      └──────┬───────────┘
       │                         │
       │                         ▼
       │                  ┌──────────────┐
       │                  │ Click "Enviar│
       │                  │ Solicitud"   │
       │                  └──────┬───────┘
       │                         │
       │                         ▼
       │                  ┌──────────────┐
       │                  │ Completa      │
       │                  │ formulario    │
       │                  └──────┬───────┘
       │                         │
       │                         ▼
       └───────────────────▶ Request creada
                             status=REQUESTED
                                   │
                                   ▼
                            ┌──────────────┐
                            │ OWNER recibe │
                            │ notificación │
                            └──────┬───────┘
                                   │
                        ┌──────────┼──────────┐
                        │                      │
                   (Acepta)              (Rechaza)
                        │                      │
                        ▼                      ▼
                  ACCEPTED                DECLINED
                        │                      │
                        │                  (final)
                        │
                        ▼
                  ┌──────────────┐
                  │ CLIENT ve    │
                  │ CONTACTO     │
                  └──────────────┘
```

### 8.2 Flujo: Moderación de Post

```
┌─────────────┐
│ OWNER crea  │
│   Post      │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ PENDING_     │
│ APPROVAL     │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ ADMIN/      │
│ OPERATOR    │
│ revisa      │
└──────┬──────┘
       │
   ┌───┴────┐
   │        │        │
   ▼        ▼        ▼
APPROVED  REJECTED  BANNED
   │        │        │
   │    (oculto) (oculto)
   │
   ▼
┌──────────────┐
│ Post visible │
│ públicamente │
└──────────────┘
```

---

## 9. Casos de Uso Principales

### 9.1 UC-001: Publicar Instrumento

**Actor:** OWNER  
**Precondiciones:** Usuario autenticado con rol OWNER  
**Flujo Principal:**
1. OWNER crea instrumento con fotos y ubicaciones
2. OWNER crea post asociado al instrumento
3. Post queda en PENDING_APPROVAL
4. ADMIN/OPERATOR aprueba
5. Post queda APPROVED y visible

**Postcondiciones:** Post visible en mapa/explore

### 9.2 UC-002: Solicitar Instrumento

**Actor:** CLIENT  
**Precondiciones:** 
- Usuario autenticado con rol CLIENT
- Post APPROVED existe
- No hay request activa previa

**Flujo Principal:**
1. CLIENT busca y encuentra post
2. CLIENT envía request con fechas/horas y mensaje (validado según disponibilidad del instrumento)
3. OWNER recibe request
4. OWNER acepta
5. CLIENT ve contacto

**Postcondiciones:** Request ACCEPTED, contacto visible para CLIENT

### 9.3 UC-003: Moderar Post

**Actor:** ADMIN/OPERATOR  
**Precondiciones:** Post en PENDING_APPROVAL  
**Flujo Principal:**
1. ADMIN revisa post en /admin
2. ADMIN aprueba o rechaza
3. Post cambia de estado
4. Si aprobado: post visible públicamente

**Postcondiciones:** Post en estado final (APPROVED/REJECTED/BANNED)

---

## 10. Limitaciones y Consideraciones

### 10.1 Limitaciones Actuales (MVP)

- ❌ No hay sistema de notificaciones (email/push)
- ❌ No hay sistema de pagos (solo stub)
- ❌ No hay traducción automática de contenido
- ❌ Expiración de posts es manual (no hay cron job automatizado)
- ❌ No hay sistema de mensajería entre usuarios
- ❌ No hay calificaciones/reviews

### 10.2 Consideraciones Técnicas

- **Ubicación:** Jitter aplicado siempre en visualizaciones públicas
- **Fotos:** Máximo 10 por instrumento, mínimo 3
- **Expiración:** 30 días fijos desde creación
- **Requests:** Solo una activa por post por CLIENT
- **Permisos:** Validación en client y server-side

### 10.3 Mejoras Futuras (Fuera de MVP)

- Notificaciones en tiempo real (email/push) para nuevos reportes
- Sistema de pagos completo
- Mensajería interna
- Sistema de calificaciones/reviews
- Traducción automática de contenido
- Cron job automático para expiración
- Disponibilidad con horarios que cruzan medianoche (actualmente limitado a horarios dentro del mismo día)
- Estadísticas y análisis de reportes

---

## 11. Glosario

- **OWNER**: Usuario que publica instrumentos (propietario)
- **CLIENT**: Usuario que busca y solicita instrumentos (cliente)
- **Post**: Publicación de un instrumento (visible públicamente si APPROVED)
- **Request**: Solicitud de un CLIENT para usar un instrumento
- **Disponibilidad (InstrumentAvailability)**: Configuración de días de semana y horarios en que un instrumento está disponible
- **Jitter**: Ruido aleatorio aplicado a coordenadas para privacidad
- **Moderación**: Proceso de aprobar/rechazar posts por ADMIN/OPERATOR
- **Status**: Estado de una entidad (Post, Request, Report)
- **Expiración**: Proceso automático/manual de marcar posts como EXPIRED

---

**Fin del Documento**

