# Guía de Pruebas - Etapa 3: Admin/Operador (Moderación)

Esta guía te ayudará a probar todas las funcionalidades implementadas en la Etapa 3 del proyecto ViaSonora.

## 📋 Prerequisitos

Antes de comenzar, asegúrate de tener:

- ✅ Base de datos configurada y migrada
- ✅ Seed ejecutado (incluye usuario admin de prueba)
- ✅ Servidor de desarrollo corriendo (`npm run dev`)
- ✅ Al menos un post con estado `PENDING_APPROVAL` (creado en Etapa 1)

---

## 🔐 1. Configuración de Usuario Admin

### 1.1 Verificar Usuario Admin en Seed

El seed crea automáticamente un usuario admin:
- **Email:** `admin@viasonora.com`
- **Rol:** `ADMIN`

**Pasos:**
- [ ] Ejecutar `npm run db:seed` si aún no lo has hecho
- [ ] Verificar en Prisma Studio que existe el usuario con `staffRole = 'ADMIN'`

### 1.2 Crear Usuario Admin Manualmente (Opcional)

Si necesitas crear otro usuario admin:

**Opción A: Prisma Studio**
```bash
npm run db:studio
```
- [ ] Abrir Prisma Studio
- [ ] Ir a tabla `User`
- [ ] Crear o editar un usuario
- [ ] Cambiar `staffRole` a `ADMIN` o `OPERATOR`
- [ ] Guardar

**Opción B: SQL directo**
```sql
UPDATE "User" SET "staffRole" = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
```

**Resultado esperado:** Usuario con rol de administrador creado

---

## 🚪 2. Acceso al Panel de Administración

### 2.1 Verificar Navegación para Admin

- [ ] Iniciar sesión con un usuario que tenga `staffRole = 'ADMIN'` o `'OPERATOR'`
- [ ] Verificar que aparece el link "Admin" en la barra de navegación
- [ ] Verificar que el link NO aparece para usuarios sin rol de admin/operator

**Resultado esperado:** Link "Admin" visible solo para usuarios autorizados

### 2.2 Acceder al Panel

- [ ] Click en "Admin" en la navegación
- [ ] Verificar que redirige a `/admin`
- [ ] Verificar que se muestra el título "Panel de Administración"
- [ ] Verificar que se muestra el subtítulo "Gestiona y modera las publicaciones de la plataforma"

**Resultado esperado:** Panel de administración accesible y visible

### 2.3 Protección de Acceso

- [ ] Cerrar sesión
- [ ] Intentar acceder directamente a `/admin` (sin estar logueado)
- [ ] Verificar que redirige a `/login`

- [ ] Iniciar sesión con un usuario SIN rol de admin/operator
- [ ] Intentar acceder a `/admin`
- [ ] Verificar que redirige a la home (`/`)

**Resultado esperado:** Panel protegido, solo accesible para ADMIN/OPERATOR

---

## 📊 3. Listado de Posts para Moderación

### 3.1 Ver Posts Pendientes

- [ ] Acceder a `/admin` como admin
- [ ] Verificar que se muestra el filtro por estado (por defecto "Pendientes")
- [ ] Verificar que se listan los posts con estado `PENDING_APPROVAL`
- [ ] Verificar que cada post muestra:
  - [ ] Foto del instrumento
  - [ ] Título del instrumento
  - [ ] Categoría
  - [ ] Ciudad y zona
  - [ ] Badge con estado "Pendiente" (amarillo)
  - [ ] Información del propietario (nombre, email)
  - [ ] Fecha de creación
  - [ ] Fecha de expiración

**Resultado esperado:** Lista completa de posts pendientes con toda la información

### 3.2 Filtrar por Estado

- [ ] Click en el selector de filtro
- [ ] Seleccionar "Aprobados"
- [ ] Verificar que se muestran solo posts con estado `APPROVED`
- [ ] Verificar que el badge muestra "Aprobado" (verde)

- [ ] Seleccionar "Rechazados"
- [ ] Verificar que se muestran solo posts con estado `REJECTED`
- [ ] Verificar que el badge muestra "Rechazado" (rojo)

- [ ] Seleccionar "Baneados"
- [ ] Verificar que se muestran solo posts con estado `BANNED`
- [ ] Verificar que el badge muestra "Baneado" (rojo)

- [ ] Seleccionar "Expirados"
- [ ] Verificar que se muestran solo posts con estado `EXPIRED`
- [ ] Verificar que el badge muestra "Expirado" (gris)

- [ ] Seleccionar "Todos"
- [ ] Verificar que se muestran posts de todos los estados

**Resultado esperado:** Filtros funcionando correctamente, mostrando solo los posts del estado seleccionado

### 3.3 Verificar Contador Total

- [ ] Verificar que se muestra "Total: X posts" en la parte superior
- [ ] Cambiar el filtro y verificar que el contador se actualiza correctamente

**Resultado esperado:** Contador muestra el total correcto según el filtro

---

## ✅ 4. Aprobar Posts

### 4.1 Aprobar Post Pendiente

- [ ] Ir a `/admin` y filtrar por "Pendientes"
- [ ] Encontrar un post con estado "Pendiente"
- [ ] Verificar que aparecen los botones:
  - [ ] "Aprobar" (verde)
  - [ ] "Rechazar" (rojo)
  - [ ] "Banear" (rojo)
  - [ ] "Ver Post" (outline)

- [ ] Click en "Aprobar"
- [ ] Verificar que el post desaparece de la lista de "Pendientes"
- [ ] Filtrar por "Aprobados"
- [ ] Verificar que el post ahora aparece en la lista de "Aprobados"
- [ ] Verificar que el badge cambió a "Aprobado" (verde)
- [ ] Verificar que los botones disponibles ahora son:
  - [ ] "Banear" (rojo)
  - [ ] "Rechazar" (outline)
  - [ ] "Ver Post" (outline)

**Resultado esperado:** Post aprobado correctamente, cambia de estado y aparece en la lista de aprobados

### 4.2 Verificar Post Aprobado en Mapa

- [ ] Ir a la home (`/`)
- [ ] Verificar que el post aprobado aparece en el mapa
- [ ] Click en el pin del post
- [ ] Verificar que se muestra el preview card
- [ ] Click en "Ver detalles"
- [ ] Verificar que se puede ver el detalle completo del post

**Resultado esperado:** Post aprobado visible públicamente en el mapa

---

## ❌ 5. Rechazar Posts

### 5.1 Rechazar Post Pendiente

- [ ] Ir a `/admin` y filtrar por "Pendientes"
- [ ] Encontrar un post con estado "Pendiente"
- [ ] Click en "Rechazar"
- [ ] Verificar que el post desaparece de la lista de "Pendientes"
- [ ] Filtrar por "Rechazados"
- [ ] Verificar que el post ahora aparece en la lista de "Rechazados"
- [ ] Verificar que el badge cambió a "Rechazado" (rojo)
- [ ] Verificar que los botones disponibles ahora son:
  - [ ] "Aprobar" (verde)
  - [ ] "Banear" (rojo)
  - [ ] "Ver Post" (outline)

**Resultado esperado:** Post rechazado correctamente, cambia de estado y aparece en la lista de rechazados

### 5.2 Verificar Post Rechazado NO Visible

- [ ] Ir a la home (`/`)
- [ ] Verificar que el post rechazado NO aparece en el mapa
- [ ] Intentar acceder directamente a `/posts/[id]` del post rechazado
- [ ] Verificar que muestra error "Post not available" (si no eres el owner)

**Resultado esperado:** Post rechazado no visible públicamente

### 5.3 Reaprobar Post Rechazado

- [ ] Ir a `/admin` y filtrar por "Rechazados"
- [ ] Encontrar el post rechazado
- [ ] Click en "Aprobar"
- [ ] Verificar que el post cambia a estado "Aprobado"
- [ ] Verificar que ahora aparece en la lista de "Aprobados"

**Resultado esperado:** Post rechazado puede ser re-aprobado

---

## 🚫 6. Banear Posts

### 6.1 Banear Post Pendiente

- [ ] Ir a `/admin` y filtrar por "Pendientes"
- [ ] Encontrar un post con estado "Pendiente"
- [ ] Click en "Banear"
- [ ] Verificar que el post desaparece de la lista de "Pendientes"
- [ ] Filtrar por "Baneados"
- [ ] Verificar que el post ahora aparece en la lista de "Baneados"
- [ ] Verificar que el badge cambió a "Baneado" (rojo)
- [ ] Verificar que el botón disponible ahora es:
  - [ ] "Desbanear y Aprobar" (verde)
  - [ ] "Ver Post" (outline)

**Resultado esperado:** Post baneado correctamente

### 6.2 Banear Post Aprobado

- [ ] Ir a `/admin` y filtrar por "Aprobados"
- [ ] Encontrar un post aprobado
- [ ] Click en "Banear"
- [ ] Verificar que el post cambia a estado "Baneado"
- [ ] Verificar que desaparece del mapa (si estaba visible)

**Resultado esperado:** Post aprobado puede ser baneado

### 6.3 Verificar Post Baneado NO Visible

- [ ] Ir a la home (`/`)
- [ ] Verificar que el post baneado NO aparece en el mapa
- [ ] Intentar acceder directamente a `/posts/[id]` del post baneado
- [ ] Verificar que muestra error "Post not available" (si no eres el owner)

**Resultado esperado:** Post baneado no visible públicamente

### 6.4 Desbanear Post

- [ ] Ir a `/admin` y filtrar por "Baneados"
- [ ] Encontrar el post baneado
- [ ] Click en "Desbanear y Aprobar"
- [ ] Verificar que el post cambia a estado "Aprobado"
- [ ] Verificar que ahora aparece en la lista de "Aprobados"
- [ ] Verificar que el post vuelve a aparecer en el mapa

**Resultado esperado:** Post baneado puede ser desbaneado y aprobado

---

## 👁️ 7. Ver Detalle de Post desde Admin

### 7.1 Ver Post desde Panel

- [ ] Ir a `/admin`
- [ ] Encontrar cualquier post en la lista
- [ ] Click en "Ver Post"
- [ ] Verificar que se abre la página de detalle del post (`/posts/[id]`)
- [ ] Verificar que se muestra toda la información del post
- [ ] Verificar que como admin puedes ver posts en cualquier estado (incluso rechazados/baneados)

**Resultado esperado:** Link "Ver Post" funciona correctamente y permite ver el detalle completo

---

## 🔄 8. Flujos de Moderación Completos

### 8.1 Flujo: Pendiente → Aprobado → Baneado → Aprobado

- [ ] Crear un nuevo post (o usar uno existente con estado PENDING_APPROVAL)
- [ ] Ir a `/admin` y filtrar por "Pendientes"
- [ ] Aprobar el post
- [ ] Verificar que aparece en "Aprobados"
- [ ] Banear el post
- [ ] Verificar que aparece en "Baneados"
- [ ] Desbanear y aprobar
- [ ] Verificar que vuelve a "Aprobados"

**Resultado esperado:** Todos los cambios de estado funcionan correctamente

### 8.2 Flujo: Pendiente → Rechazado → Aprobado

- [ ] Crear un nuevo post (o usar uno existente con estado PENDING_APPROVAL)
- [ ] Ir a `/admin` y filtrar por "Pendientes"
- [ ] Rechazar el post
- [ ] Verificar que aparece en "Rechazados"
- [ ] Aprobar el post
- [ ] Verificar que aparece en "Aprobados"

**Resultado esperado:** Post puede ser rechazado y luego re-aprobado

---

## 🛡️ 9. Seguridad y Autorización

### 9.1 Verificar API Protegida

- [ ] Cerrar sesión
- [ ] Intentar hacer una petición directa a `GET /api/admin/posts`
- [ ] Verificar que retorna `403 Unauthorized`

- [ ] Iniciar sesión con usuario SIN rol de admin
- [ ] Intentar hacer una petición a `GET /api/admin/posts`
- [ ] Verificar que retorna `403 Unauthorized`

- [ ] Iniciar sesión con usuario ADMIN
- [ ] Hacer petición a `GET /api/admin/posts`
- [ ] Verificar que retorna `200 OK` con la lista de posts

**Resultado esperado:** APIs protegidas correctamente, solo accesibles para ADMIN/OPERATOR

### 9.2 Verificar Actualización de Estado Protegida

- [ ] Cerrar sesión
- [ ] Intentar hacer `PUT /api/admin/posts/[id]` con `{ status: 'APPROVED' }`
- [ ] Verificar que retorna `403 Unauthorized`

- [ ] Iniciar sesión con usuario SIN rol de admin
- [ ] Intentar hacer `PUT /api/admin/posts/[id]` con `{ status: 'APPROVED' }`
- [ ] Verificar que retorna `403 Unauthorized`

**Resultado esperado:** Actualización de estado protegida, solo accesible para ADMIN/OPERATOR

---

## 📱 10. Responsive y UX

### 10.1 Verificar Responsive en Mobile

- [ ] Abrir `/admin` en un dispositivo móvil o reducir el ancho del navegador
- [ ] Verificar que el layout se adapta correctamente
- [ ] Verificar que los cards de posts se apilan verticalmente
- [ ] Verificar que los botones son accesibles y tienen buen tamaño táctil

**Resultado esperado:** Panel responsive y usable en mobile

### 10.2 Verificar Estados de Carga

- [ ] Recargar la página `/admin`
- [ ] Verificar que se muestra "Cargando..." mientras se obtienen los posts
- [ ] Verificar que desaparece cuando los posts se cargan

**Resultado esperado:** Estados de carga visibles y claros

### 10.3 Verificar Mensaje de Lista Vacía

- [ ] Filtrar por un estado que no tenga posts (ej: "Baneados" si no hay ninguno)
- [ ] Verificar que se muestra el mensaje "No hay posts con este estado"

**Resultado esperado:** Mensaje claro cuando no hay posts para mostrar

---

## 🐛 11. Casos Edge y Errores

### 11.1 Post No Encontrado

- [ ] Intentar actualizar el estado de un post con ID inválido
- [ ] Verificar que se maneja el error correctamente

**Resultado esperado:** Errores manejados correctamente, no se rompe la aplicación

### 11.2 Estado Inválido

- [ ] Intentar actualizar un post con un estado inválido (usando herramientas de desarrollador)
- [ ] Verificar que se retorna error de validación

**Resultado esperado:** Validación de estados funciona correctamente

### 11.3 Múltiples Moderaciones Rápidas

- [ ] Aprobar un post
- [ ] Inmediatamente rechazarlo
- [ ] Inmediatamente banearlo
- [ ] Verificar que todos los cambios se aplican correctamente

**Resultado esperado:** Múltiples cambios de estado funcionan sin problemas

---

## ✅ Criterios de Aceptación

La Etapa 3 se considera completa cuando:

- [x] Usuario con rol ADMIN/OPERATOR puede acceder a `/admin`
- [x] Panel muestra lista de posts con filtros por estado
- [x] Admin puede aprobar posts pendientes
- [x] Admin puede rechazar posts pendientes
- [x] Admin puede banear posts (de cualquier estado)
- [x] Admin puede desbanear posts
- [x] Posts aprobados aparecen en el mapa
- [x] Posts rechazados/baneados NO aparecen en el mapa
- [x] APIs protegidas correctamente (solo ADMIN/OPERATOR)
- [x] Navegación muestra link "Admin" solo para usuarios autorizados
- [x] Panel responsive y usable en mobile
- [x] Estados de carga y mensajes de error funcionan correctamente

---

## 📝 Notas Finales

- **Roles disponibles:** `ADMIN` y `OPERATOR` tienen los mismos permisos en esta etapa
- **Estados de post:** `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `BANNED`, `EXPIRED`
- **Usuario admin de prueba:** `admin@viasonora.com` (creado en seed)
- **Próximas mejoras:** Logs de moderación, notificaciones por email, estadísticas

---

## 🎯 Próximos Pasos (Etapa 2)

Una vez completada la Etapa 3, la Etapa 2 incluirá:
- Sistema de Requests (solicitudes)
- Revelación de contacto solo cuando owner acepta
- Disponibilidad por días/horarios
- Estados de request: REQUESTED → ACCEPTED → DECLINED → etc.


