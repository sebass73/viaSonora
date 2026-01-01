# Guía de Pruebas - Etapa 2: Requests + Contacto bloqueado

## 📋 Pre-requisitos

1. **Base de datos configurada y con seed actualizado:**
   ```bash
   npm run db:push
   npm run db:seed
   ```
   Asegúrate de que el seed crea:
   - Un usuario demo (OWNER + CLIENT): `demo@viasonora.com`
   - Un usuario cliente: `client@viasonora.com`
   - Un usuario admin: `admin@viasonora.com`
   - Posts en diferentes estados (al menos uno APPROVED)
   - Al menos una request de ejemplo

2. **Variables de entorno configuradas** (`.env`):
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (para subir fotos)

3. **App corriendo:**
   ```bash
   npm run dev
   ```

4. **Usuarios de prueba:**
   - **Demo user (OWNER + CLIENT):** `demo@viasonora.com` (Google OAuth o crear con email/password)
   - **Client user (CLIENT):** `client@viasonora.com` (crear cuenta nueva o usar Google OAuth)
   - **Admin user (ADMIN):** `admin@viasonora.com` / `admin123`

---

## ✅ Checklist de Pruebas

### 1. Enviar Solicitud (CLIENT)

#### 1.1 Navegación al Formulario
- [ ] Iniciar sesión como usuario CLIENT (o crear cuenta nueva con rol CLIENT).
- [ ] Ir a `/explore` o a la página principal.
- [ ] Seleccionar un post con status APPROVED.
- [ ] Hacer clic en el post para ver el detalle.
- [ ] Verificar que aparece el botón "Enviar Solicitud" (si no hay request aceptada).
- [ ] Verificar que NO aparece el contacto del propietario (email, teléfono, WhatsApp).
- [ ] Verificar que aparece el mensaje: "Para contactar al propietario, debes enviar una solicitud y esperar su aprobación."

**Resultado esperado:** El formulario de solicitud está accesible y el contacto está oculto.

#### 1.2 Formulario de Solicitud
- [ ] Hacer clic en "Enviar Solicitud".
- [ ] Verificar que aparece el formulario con los siguientes campos:
  - [ ] Fecha de inicio (datetime-local) *
  - [ ] Fecha de fin (datetime-local) *
  - [ ] Mensaje (textarea) *
  - [ ] Accesorios adicionales (textarea, opcional)
- [ ] Verificar que el botón de envío dice "Enviar Solicitud".

**Resultado esperado:** Formulario completo y claro.

#### 1.3 Validaciones del Formulario (Client-side)
- [ ] Intentar enviar sin completar ningún campo.
- [ ] Verificar que aparece mensaje de error (campos requeridos).
- [ ] Completar solo fecha de inicio, dejar fecha de fin vacía.
- [ ] Verificar que aparece mensaje de error.
- [ ] Completar fecha de inicio posterior a fecha de fin.
- [ ] Verificar que aparece mensaje: "La fecha de fin debe ser posterior a la fecha de inicio".
- [ ] Completar mensaje con menos de 10 caracteres.
- [ ] Verificar que aparece mensaje de error (mínimo 10 caracteres).

**Resultado esperado:** Validaciones client-side funcionando correctamente.

#### 1.4 Envío Exitoso de Solicitud
- [ ] Completar el formulario correctamente:
  - Fecha de inicio: 5 días desde hoy
  - Fecha de fin: 7 días después de la fecha de inicio
  - Mensaje: "Necesito el instrumento para un concierto. ¿Está disponible?"
  - Accesorios: "Necesitaría también el arco si es posible." (opcional)
- [ ] Hacer clic en "Enviar Solicitud".
- [ ] Verificar que aparece mensaje de éxito: "Solicitud enviada correctamente".
- [ ] Verificar que se redirige a `/requests` o se recarga la página.

**Resultado esperado:** La solicitud se crea correctamente y el usuario es notificado.

#### 1.5 Validaciones Server-side
- [ ] Intentar enviar solicitud sin estar autenticado (cerrar sesión, recargar, intentar enviar).
- [ ] Verificar que se redirige a login o muestra error de autenticación.
- [ ] Iniciar sesión como OWNER del post.
- [ ] Intentar enviar solicitud a tu propio post.
- [ ] Verificar que aparece error: "No puedes enviar una solicitud a tu propio post".
- [ ] Iniciar sesión como CLIENT diferente.
- [ ] Enviar una solicitud a un post.
- [ ] Intentar enviar otra solicitud al mismo post (sin cancelar la anterior).
- [ ] Verificar que aparece error: "Ya existe una solicitud activa para este post".

**Resultado esperado:** Validaciones server-side funcionando correctamente.

### 2. Ver Mis Solicitudes (CLIENT y OWNER)

#### 2.1 Navegación
- [ ] Iniciar sesión como usuario CLIENT.
- [ ] Verificar que aparece el link "Mis Solicitudes" en la barra de navegación.
- [ ] Hacer clic en "Mis Solicitudes".
- [ ] Verificar que se redirige a `/requests`.

**Resultado esperado:** Navegación funcional.

#### 2.2 Lista de Solicitudes Enviadas (CLIENT)
- [ ] En la página `/requests`, verificar que hay una sección/tab "Enviadas".
- [ ] Verificar que se muestran todas las solicitudes que has enviado.
- [ ] Para cada solicitud, verificar que se muestra:
  - [ ] Foto del instrumento.
  - [ ] Título del instrumento.
  - [ ] Categoría y ubicación (ciudad, zona).
  - [ ] Estado de la solicitud (badge con color correspondiente):
    - REQUESTED: Amarillo/amarillo
    - ACCEPTED: Verde
    - DECLINED: Rojo
    - CANCELLED: Gris
    - COMPLETED: Azul
  - [ ] Fechas (desde/hasta).
  - [ ] Fecha de creación.
  - [ ] Mensaje (truncado o completo).
  - [ ] Accesorios (si se especificaron).
  - [ ] Botón "Ver Post" para ir al detalle del post.

**Resultado esperado:** Información completa y clara de las solicitudes enviadas.

#### 2.3 Lista de Solicitudes Recibidas (OWNER)
- [ ] Iniciar sesión como OWNER (demo@viasonora.com).
- [ ] Ir a `/requests`.
- [ ] Verificar que hay una sección/tab "Recibidas".
- [ ] Verificar que se muestran todas las solicitudes recibidas.
- [ ] Para cada solicitud, verificar que se muestra la misma información que en "Enviadas", pero desde la perspectiva del OWNER.

**Resultado esperado:** OWNER puede ver todas las solicitudes recibidas.

#### 2.4 Filtros y Tabs
- [ ] Verificar que existen tres tabs/secciones: "Todas", "Enviadas", "Recibidas".
- [ ] Hacer clic en "Todas".
- [ ] Verificar que se muestran todas las solicitudes (enviadas + recibidas).
- [ ] Hacer clic en "Enviadas".
- [ ] Verificar que solo se muestran las solicitudes enviadas.
- [ ] Hacer clic en "Recibidas".
- [ ] Verificar que solo se muestran las solicitudes recibidas.
- [ ] Verificar que los contadores en los tabs son correctos (ej: "Enviadas (3)").

**Resultado esperado:** Filtros funcionando correctamente.

#### 2.5 Estado Vacío
- [ ] Crear una cuenta nueva sin solicitudes.
- [ ] Ir a `/requests`.
- [ ] Verificar que aparece mensaje apropiado: "No tienes solicitudes" / "No has enviado solicitudes" / "No has recibido solicitudes".

**Resultado esperado:** Mensajes claros cuando no hay solicitudes.

### 3. Aceptar/Rechazar Solicitud (OWNER)

#### 3.1 Ver Solicitud Recibida
- [ ] Iniciar sesión como OWNER.
- [ ] Ir a `/requests` → tab "Recibidas".
- [ ] Seleccionar una solicitud con estado REQUESTED.
- [ ] Verificar que se muestran los botones de acción:
  - [ ] Botón "Aceptar" (verde).
  - [ ] Botón "Rechazar" (rojo).
  - [ ] Botón "Ver Post".

**Resultado esperado:** Botones de acción visibles y claros.

#### 3.2 Aceptar Solicitud
- [ ] Hacer clic en el botón "Aceptar" en una solicitud REQUESTED.
- [ ] Verificar que aparece un diálogo de confirmación: "¿Estás seguro de cambiar el estado a 'Aceptada'?".
- [ ] Confirmar.
- [ ] Verificar que la solicitud cambia de estado a ACCEPTED.
- [ ] Verificar que el badge cambia a verde con texto "Aceptada".
- [ ] Verificar que los botones "Aceptar" y "Rechazar" desaparecen (ya no aplicables).
- [ ] Verificar que aparece el botón "Marcar como Completada" (si corresponde).

**Resultado esperado:** Solicitud aceptada correctamente y UI actualizada.

#### 3.3 Verificar Revelación de Contacto (CLIENT)
- [ ] Iniciar sesión como CLIENT que envió la solicitud.
- [ ] Ir al detalle del post donde se aceptó la solicitud (`/posts/[id]`).
- [ ] Verificar que ahora se muestra el contacto del propietario:
  - [ ] Email (clickeable: mailto:).
  - [ ] Teléfono (clickeable: tel:).
  - [ ] WhatsApp link (clickeable).
  - [ ] Dirección (si existe).
  - [ ] Zona/Barrio (si existe).
- [ ] Verificar que NO aparece el formulario de solicitud.
- [ ] Verificar que aparece mensaje: "Tu solicitud ha sido aceptada. El contacto del propietario se muestra arriba." (opcional).

**Resultado esperado:** Contacto revelado correctamente después de aceptar.

#### 3.4 Rechazar Solicitud
- [ ] Iniciar sesión como OWNER.
- [ ] Ir a `/requests` → tab "Recibidas".
- [ ] Seleccionar otra solicitud con estado REQUESTED.
- [ ] Hacer clic en el botón "Rechazar" (rojo).
- [ ] Confirmar en el diálogo.
- [ ] Verificar que la solicitud cambia de estado a DECLINED.
- [ ] Verificar que el badge cambia a rojo con texto "Rechazada".
- [ ] Verificar que los botones "Aceptar" y "Rechazar" desaparecen.

**Resultado esperado:** Solicitud rechazada correctamente.

#### 3.5 Verificar que Contacto NO se Revela (CLIENT)
- [ ] Iniciar sesión como CLIENT que envió la solicitud rechazada.
- [ ] Ir al detalle del post.
- [ ] Verificar que NO se muestra el contacto del propietario.
- [ ] Verificar que aparece el mensaje sobre enviar solicitud (o que ya existe una request).

**Resultado esperado:** Contacto permanece oculto para solicitudes rechazadas.

### 4. Cancelar Solicitud (CLIENT)

#### 4.1 Cancelar Solicitud en Estado REQUESTED
- [ ] Iniciar sesión como CLIENT.
- [ ] Ir a `/requests` → tab "Enviadas".
- [ ] Seleccionar una solicitud con estado REQUESTED.
- [ ] Verificar que aparece el botón "Cancelar" (gris).
- [ ] Hacer clic en "Cancelar".
- [ ] Confirmar en el diálogo.
- [ ] Verificar que la solicitud cambia de estado a CANCELLED.
- [ ] Verificar que el badge cambia a gris con texto "Cancelada".
- [ ] Verificar que el botón "Cancelar" desaparece.

**Resultado esperado:** Solicitud cancelada correctamente.

#### 4.2 Cancelar Solicitud en Estado ACCEPTED
- [ ] Como CLIENT, tener una solicitud ACCEPTED (o crear una nueva y aceptarla como OWNER).
- [ ] Ir a `/requests` → tab "Enviadas".
- [ ] Verificar que aparece el botón "Cancelar" en la solicitud ACCEPTED.
- [ ] Hacer clic en "Cancelar".
- [ ] Confirmar.
- [ ] Verificar que la solicitud cambia a CANCELLED.
- [ ] Verificar que el contacto ya no se muestra en el detalle del post.

**Resultado esperado:** CLIENT puede cancelar solicitudes ACCEPTED.

#### 4.3 No Poder Cancelar Solicitudes Finalizadas
- [ ] Verificar que en solicitudes CANCELLED, DECLINED o COMPLETED NO aparece el botón "Cancelar".

**Resultado esperado:** No se pueden cancelar solicitudes finalizadas.

### 5. Marcar como Completada (OWNER)

#### 5.1 Marcar Solicitud ACCEPTED como COMPLETED
- [ ] Iniciar sesión como OWNER.
- [ ] Ir a `/requests` → tab "Recibidas".
- [ ] Seleccionar una solicitud con estado ACCEPTED.
- [ ] Verificar que aparece el botón "Marcar como Completada" (azul).
- [ ] Hacer clic en el botón.
- [ ] Confirmar.
- [ ] Verificar que la solicitud cambia a COMPLETED.
- [ ] Verificar que el badge cambia a azul con texto "Completada".

**Resultado esperado:** Solicitud marcada como completada correctamente.

### 6. Flujos Completos

#### 6.1 Flujo Completo: CLIENT envía → OWNER acepta → Contacto revelado
- [ ] **Paso 1:** Iniciar sesión como CLIENT.
- [ ] **Paso 2:** Ir a `/explore` y seleccionar un post APPROVED.
- [ ] **Paso 3:** Verificar que NO se muestra contacto.
- [ ] **Paso 4:** Hacer clic en "Enviar Solicitud".
- [ ] **Paso 5:** Completar y enviar el formulario.
- [ ] **Paso 6:** Verificar que la solicitud aparece en "Mis Solicitudes" → "Enviadas" con estado REQUESTED.
- [ ] **Paso 7:** Cerrar sesión e iniciar sesión como OWNER del post.
- [ ] **Paso 8:** Ir a `/requests` → "Recibidas".
- [ ] **Paso 9:** Verificar que aparece la solicitud con estado REQUESTED.
- [ ] **Paso 10:** Hacer clic en "Aceptar" y confirmar.
- [ ] **Paso 11:** Verificar que la solicitud cambia a ACCEPTED.
- [ ] **Paso 12:** Cerrar sesión e iniciar sesión como CLIENT.
- [ ] **Paso 13:** Ir al detalle del post (`/posts/[id]`).
- [ ] **Paso 14:** Verificar que ahora se muestra el contacto completo del propietario.

**Resultado esperado:** Flujo completo funcionando correctamente.

#### 6.2 Flujo Completo: CLIENT envía → OWNER rechaza
- [ ] Seguir pasos 1-9 del flujo anterior.
- [ ] **Paso 10 (modificado):** Hacer clic en "Rechazar" y confirmar.
- [ ] **Paso 11 (modificado):** Verificar que la solicitud cambia a DECLINED.
- [ ] **Paso 12-14 (modificado):** Como CLIENT, verificar que el contacto NO se muestra.

**Resultado esperado:** Solicitud rechazada y contacto no revelado.

#### 6.3 Flujo Completo: CLIENT cancela su solicitud
- [ ] CLIENT envía solicitud.
- [ ] CLIENT va a `/requests` → "Enviadas".
- [ ] CLIENT hace clic en "Cancelar" en una solicitud REQUESTED.
- [ ] Verificar que la solicitud cambia a CANCELLED.
- [ ] Como OWNER, verificar que la solicitud cancelada ya no aparece en "Recibidas" (o aparece con estado CANCELLED).

**Resultado esperado:** Cancelación funcionando correctamente.

### 7. Permisos y Seguridad

#### 7.1 OWNER no puede enviar solicitudes
- [ ] Iniciar sesión como OWNER.
- [ ] Ir al detalle de uno de tus propios posts.
- [ ] Verificar que NO aparece el botón "Enviar Solicitud".
- [ ] Verificar que se muestra el contacto directamente (owner ve su propio contacto).

**Resultado esperado:** OWNER no puede enviarse solicitudes a sí mismo.

#### 7.2 Solo CLIENT puede enviar solicitudes
- [ ] Verificar que usuarios sin rol CLIENT no pueden enviar solicitudes (si es aplicable).

**Resultado esperado:** Solo CLIENT puede crear requests.

#### 7.3 Solo OWNER puede aceptar/rechazar
- [ ] Como CLIENT, intentar acceder directamente a la API para cambiar status de una request recibida por otro usuario.
- [ ] Verificar que retorna error 403 Forbidden (o equivalente).
- [ ] Como OWNER, verificar que solo puedes aceptar/rechazar tus propias requests recibidas.

**Resultado esperado:** Permisos correctamente implementados.

#### 7.4 Contacto solo visible para CLIENT con request ACCEPTED
- [ ] Sin estar autenticado, ver un post.
- [ ] Verificar que NO se muestra contacto.
- [ ] Como CLIENT sin request, ver un post.
- [ ] Verificar que NO se muestra contacto.
- [ ] Como CLIENT con request REQUESTED, ver el post.
- [ ] Verificar que NO se muestra contacto.
- [ ] Como CLIENT con request ACCEPTED, ver el post.
- [ ] Verificar que SÍ se muestra contacto.
- [ ] Como OWNER, ver tu propio post.
- [ ] Verificar que SÍ se muestra tu contacto (owner siempre ve su contacto).

**Resultado esperado:** Lógica de revelación de contacto funcionando correctamente.

### 8. UI/UX y Responsive

#### 8.1 Layout Responsivo
- [ ] Probar `/requests` en diferentes tamaños de pantalla (desktop, tablet, mobile).
- [ ] Verificar que el layout se adapta correctamente.
- [ ] Verificar que los tabs/botones son clickeables en mobile.
- [ ] Verificar que las cards de requests se muestran correctamente.

**Resultado esperado:** UI responsive y funcional en todos los dispositivos.

#### 8.2 Estados de Carga
- [ ] Verificar que aparece "Cargando..." mientras se obtienen las requests.
- [ ] Verificar que aparece "Enviando..." mientras se envía una solicitud.
- [ ] Verificar que los botones se deshabilitan durante las operaciones.

**Resultado esperado:** Feedback visual adecuado durante operaciones asíncronas.

#### 8.3 Navegación y Links
- [ ] Verificar que el botón "Ver Post" en cada request lleva al detalle correcto del post.
- [ ] Verificar que los links de contacto (mailto, tel, WhatsApp) funcionan correctamente.
- [ ] Verificar que la navegación de "Volver" en PostDetail funciona.

**Resultado esperado:** Navegación fluida y links funcionales.

### 9. Edge Cases y Validaciones Adicionales

#### 9.1 Múltiples Solicitudes al Mismo Post
- [ ] Como CLIENT, enviar una solicitud a un post.
- [ ] Intentar enviar otra solicitud al mismo post (sin cancelar la primera).
- [ ] Verificar que aparece error: "Ya existe una solicitud activa para este post".
- [ ] Cancelar la primera solicitud.
- [ ] Intentar enviar otra solicitud.
- [ ] Verificar que ahora SÍ se permite (porque la anterior está cancelada).

**Resultado esperado:** Validación de solicitudes duplicadas funcionando.

#### 9.2 Fechas Inválidas
- [ ] Intentar enviar solicitud con fecha de inicio en el pasado.
- [ ] Verificar que se permite (o mostrar mensaje si no se permite).
- [ ] Intentar enviar solicitud con fecha de fin antes de fecha de inicio.
- [ ] Verificar que aparece error de validación.

**Resultado esperado:** Validación de fechas funcionando.

#### 9.3 Post Aprobado vs No Aprobado
- [ ] Intentar enviar solicitud a un post PENDING_APPROVAL (si es posible acceder).
- [ ] Verificar que aparece error: "El post debe estar aprobado para recibir solicitudes".
- [ ] Verificar que solo posts APPROVED aceptan solicitudes.

**Resultado esperado:** Solo posts aprobados aceptan solicitudes.

### 10. Integración con Otras Funcionalidades

#### 10.1 Request con Post Eliminado
- [ ] Crear una solicitud.
- [ ] Como OWNER, eliminar el post asociado.
- [ ] Verificar que la solicitud también se elimina (cascade delete) o se maneja apropiadamente.

**Resultado esperado:** Integridad referencial mantenida.

#### 10.2 Request con Post Expirado
- [ ] Verificar que las requests existentes siguen siendo accesibles incluso si el post expira (o se maneja apropiadamente).

**Resultado esperado:** Comportamiento apropiado con posts expirados.

---

## 📝 Notas Finales

- Esta guía cubre la funcionalidad completa de Requests y revelación de contacto.
- La disponibilidad del instrumento (días semana + horarios) NO está implementada en esta etapa.
- Los estados de las requests son: REQUESTED → ACCEPTED/DECLINED/CANCELLED → COMPLETED.
- El contacto se revela SOLO cuando request.status === ACCEPTED.
- OWNER siempre ve su propio contacto en sus posts.

---

## 🐛 Problemas Comunes

1. **"No puedes enviar una solicitud a tu propio post"**
   - Verificar que estás usando una cuenta diferente del owner del post.

2. **"Ya existe una solicitud activa para este post"**
   - Cancelar la solicitud anterior o esperar a que sea rechazada/completada.

3. **Contacto no aparece después de aceptar**
   - Verificar que la solicitud realmente cambió a ACCEPTED.
   - Recargar la página del post.
   - Verificar que estás usando la cuenta del CLIENT que envió la solicitud.

4. **Botones de acción no aparecen**
   - Verificar que estás usando la cuenta correcta (OWNER para aceptar/rechazar, CLIENT para cancelar).
   - Verificar que la solicitud está en el estado correcto para esa acción.

---

## ✅ Criterios de Éxito

La Etapa 2 se considera completada cuando:

1. ✅ CLIENT puede enviar solicitudes desde el detalle de un post.
2. ✅ OWNER puede ver solicitudes recibidas en `/requests`.
3. ✅ OWNER puede aceptar o rechazar solicitudes.
4. ✅ CLIENT puede ver solicitudes enviadas en `/requests`.
5. ✅ CLIENT puede cancelar sus solicitudes (REQUESTED o ACCEPTED).
6. ✅ Contacto se revela SOLO cuando request está ACCEPTED.
7. ✅ Validaciones client-side y server-side funcionando.
8. ✅ Permisos correctamente implementados.
9. ✅ UI responsive y funcional.
10. ✅ Flujos completos funcionando de extremo a extremo.


