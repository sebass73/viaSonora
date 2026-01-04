# Guía de Pruebas Manuales - Sistema de Reportes de Posts

**Fecha de creación:** 2025-01-02  
**Versión:** 1.0  
**Funcionalidad:** Sistema de Reportes de Posts (2.1)

---

## 📋 Índice

1. [Prerequisitos](#prerequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Pruebas de Funcionalidad](#pruebas-de-funcionalidad)
4. [Casos de Uso Específicos](#casos-de-uso-específicos)
5. [Pruebas de Validación](#pruebas-de-validación)
6. [Pruebas de Permisos y Seguridad](#pruebas-de-permisos-y-seguridad)
7. [Pruebas de UI/UX](#pruebas-de-uiux)
8. [Checklist Final](#checklist-final)

---

## 1. Prerequisitos

### 1.1 Requisitos del Sistema
- Base de datos ejecutándose con las migraciones aplicadas
- Servidor de desarrollo corriendo (`npm run dev`)
- Al menos 2 usuarios de prueba:
  - **Usuario 1**: OWNER (propietario de posts)
  - **Usuario 2**: CLIENT (para reportar posts)
  - **Usuario 3**: ADMIN o OPERATOR (para gestionar reportes)

### 1.2 Datos de Prueba Necesarios
- Al menos 1 post aprobado y visible públicamente (creado por Usuario 1)
- Acceso a las cuentas de los usuarios de prueba
- Navegador web actualizado (Chrome, Firefox, Edge, Safari)

---

## 2. Configuración Inicial

### 2.1 Preparar Base de Datos
```bash
# Aplicar migraciones si aún no se han aplicado
npx prisma migrate dev --name add_post_reports

# Generar cliente de Prisma
npx prisma generate
```

### 2.2 Verificar Usuarios de Prueba
1. Iniciar sesión como Usuario 1 (OWNER)
2. Verificar que tiene al menos un post aprobado
3. Iniciar sesión como Usuario 2 (CLIENT)
4. Verificar que puede ver posts en `/explore`
5. Iniciar sesión como Usuario 3 (ADMIN/OPERATOR)
6. Verificar acceso a `/admin`

---

## 3. Pruebas de Funcionalidad

### 3.1 Crear Reporte de Post

**Objetivo:** Verificar que un usuario puede reportar un post

**Pasos:**
1. Iniciar sesión como Usuario 2 (CLIENT)
2. Navegar a `/explore`
3. Seleccionar un post (que no sea del Usuario 2)
4. Verificar que el botón "Reportar" está visible en la sección del propietario
5. Hacer clic en "Reportar"
6. Se debe abrir un diálogo modal

**Resultado Esperado:**
- El diálogo muestra:
  - Título: "Reportar Publicación"
  - Campo de selección para razón del reporte (obligatorio)
  - Campo de texto para comentario adicional (opcional)
  - Botones: "Cancelar" y "Enviar Reporte"
  - Contador de caracteres para comentario (0/1000)

**Razones disponibles:**
- Spam
- Contenido inapropiado
- Información falsa
- Información incorrecta
- Otro

---

### 3.2 Enviar Reporte con Todas las Razones

**Objetivo:** Verificar que todas las razones de reporte funcionan correctamente

**Pasos (repetir para cada razón):**
1. Para cada razón en la lista (SPAM, INAPPROPRIATE, FAKE, INCORRECT_INFO, OTHER):
   - Abrir el diálogo de reporte
   - Seleccionar la razón
   - (Opcional) Agregar un comentario
   - Hacer clic en "Enviar Reporte"
   - Verificar mensaje de éxito

**Resultado Esperado:**
- Para cada razón, el reporte se crea correctamente
- Aparece mensaje: "¡Reporte enviado exitosamente!"
- El diálogo se cierra automáticamente después de 1.5 segundos
- El reporte aparece en el panel de admin con status PENDING

---

### 3.3 Enviar Reporte con Comentario

**Objetivo:** Verificar que los comentarios se guardan correctamente

**Pasos:**
1. Abrir diálogo de reporte
2. Seleccionar una razón (ej: "Otro")
3. Escribir un comentario (ej: "Este post contiene información incorrecta sobre el instrumento")
4. Verificar que el contador muestra "XX/1000 caracteres"
5. Enviar el reporte

**Resultado Esperado:**
- El comentario se guarda correctamente
- Aparece en el panel de admin junto al reporte
- El límite de 1000 caracteres funciona correctamente

---

### 3.4 Validación de Campos Obligatorios

**Objetivo:** Verificar validación de campos requeridos

**Pasos:**
1. Abrir diálogo de reporte
2. NO seleccionar ninguna razón
3. Intentar enviar el reporte (hacer clic en "Enviar Reporte")

**Resultado Esperado:**
- Aparece mensaje de error: "Por favor selecciona una razón para el reporte"
- El reporte NO se envía
- El usuario puede corregir el error

---

### 3.5 Cancelar Reporte

**Objetivo:** Verificar que se puede cancelar el reporte

**Pasos:**
1. Abrir diálogo de reporte
2. Seleccionar una razón
3. Escribir un comentario (opcional)
4. Hacer clic en "Cancelar"

**Resultado Esperado:**
- El diálogo se cierra
- NO se crea ningún reporte
- Los campos se limpian

---

### 3.6 Intentar Reportar el Mismo Post Dos Veces

**Objetivo:** Verificar que un usuario no puede reportar el mismo post dos veces

**Pasos:**
1. Reportar un post como Usuario 2
2. Intentar reportar el mismo post nuevamente (sin cerrar sesión)

**Resultado Esperado:**
- El primer reporte se crea exitosamente
- El segundo intento muestra error: "Ya has reportado este post anteriormente"
- El código de estado HTTP es 400
- Solo existe un reporte para ese usuario/post

---

### 3.7 Reportar Post Propio (No Permitido)

**Objetivo:** Verificar que el botón de reportar no aparece para el owner

**Pasos:**
1. Iniciar sesión como Usuario 1 (OWNER)
2. Navegar a uno de sus propios posts
3. Buscar el botón "Reportar"

**Resultado Esperado:**
- El botón "Reportar" NO está visible
- Solo el owner puede ver sus posts con opción de editar/eliminar

---

### 3.8 Reportar Sin Autenticación

**Objetivo:** Verificar que usuarios no autenticados no pueden reportar

**Pasos:**
1. Cerrar sesión (o usar ventana incógnito)
2. Navegar a un post en `/explore`
3. Verificar la presencia del botón "Reportar"

**Resultado Esperado:**
- El botón "Reportar" NO está visible
- Se muestra opción para iniciar sesión si quieren enviar solicitud

---

## 4. Casos de Uso Específicos

### 4.1 Flujo Completo: Crear y Gestionar Reporte

**Objetivo:** Verificar el flujo completo desde crear reporte hasta resolverlo

**Pasos:**
1. **Como Usuario 2 (CLIENT):**
   - Reportar un post con razón "SPAM" y comentario "Este post parece ser spam"
   - Verificar mensaje de éxito

2. **Como Usuario 3 (ADMIN/OPERATOR):**
   - Iniciar sesión
   - Navegar a `/admin`
   - Cambiar a la pestaña "Reportes"
   - Verificar que el reporte aparece con status "PENDIENTE"

3. **Ver detalles del reporte:**
   - Verificar que se muestra:
     - Título del post reportado
     - Categoría del instrumento
     - Información del usuario que reportó
     - Información del propietario del post
     - Razón del reporte
     - Comentario (si existe)
     - Fecha de creación

4. **Gestionar el reporte:**
   - Hacer clic en "Marcar como Resuelto"
   - Verificar que el status cambia a "RESUELTO"
   - Verificar que se muestra información del revisor y fecha de revisión

---

### 4.2 Filtrar Reportes por Status

**Objetivo:** Verificar filtros en el panel de admin

**Pasos:**
1. Como ADMIN, crear varios reportes con diferentes status:
   - Crear reporte nuevo (PENDING)
   - Marcar uno como RESOLVED
   - Marcar uno como DISMISSED
   - Marcar uno como REVIEWED

2. Verificar cada filtro:
   - "Todos" - muestra todos los reportes
   - "Pendientes" - solo muestra PENDING
   - "Revisados" - solo muestra REVIEWED
   - "Resueltos" - solo muestra RESOLVED
   - "Descartados" - solo muestra DISMISSED

**Resultado Esperado:**
- Cada filtro muestra solo los reportes correspondientes
- Los reportes están ordenados por fecha (más recientes primero)

---

### 4.3 Navegar al Post desde el Reporte

**Objetivo:** Verificar que el botón "Ver Post" funciona correctamente

**Pasos:**
1. En el panel de admin, encontrar un reporte
2. Hacer clic en el botón "Ver Post"

**Resultado Esperado:**
- Se abre el post en una nueva pestaña/ventana
- El post se carga correctamente
- El usuario puede ver todos los detalles del post reportado

---

### 4.4 Gestionar Reporte Pendiente

**Objetivo:** Verificar acciones disponibles para reportes PENDING

**Pasos:**
1. Encontrar un reporte con status PENDING
2. Verificar botones disponibles:
   - "Ver Post"
   - "Marcar como Resuelto"
   - "Descartar"

3. Probar cada acción:
   - Marcar como Resuelto → status cambia a RESOLVED
   - Descartar → status cambia a DISMISSED

**Resultado Esperado:**
- Todas las acciones funcionan correctamente
- El status se actualiza inmediatamente
- Se muestra información del revisor y fecha de revisión

---

### 4.5 Gestionar Reporte Revisado

**Objetivo:** Verificar acciones disponibles para reportes REVIEWED

**Pasos:**
1. Encontrar un reporte con status REVIEWED
2. Verificar botones disponibles
3. Probar cambiar a RESOLVED o DISMISSED

**Resultado Esperado:**
- Se pueden realizar las acciones
- El status se actualiza correctamente
- La fecha de revisión se mantiene

---

## 5. Pruebas de Validación

### 5.1 Validar Longitud Máxima de Comentario

**Objetivo:** Verificar límite de 1000 caracteres en comentario

**Pasos:**
1. Abrir diálogo de reporte
2. Seleccionar una razón
3. Escribir más de 1000 caracteres en el comentario
4. Verificar que el campo limita la entrada
5. Verificar que el contador muestra el límite

**Resultado Esperado:**
- No se pueden escribir más de 1000 caracteres
- El contador muestra "1000/1000 caracteres"
- El reporte se envía correctamente con los primeros 1000 caracteres

---

### 5.2 Validar Caracteres Especiales en Comentario

**Objetivo:** Verificar que caracteres especiales se guardan correctamente

**Pasos:**
1. Crear reporte con comentario que incluya:
   - Caracteres especiales: !@#$%^&*()
   - Acentos: áéíóúñ
   - Emojis: 😀👍
   - Saltos de línea

**Resultado Esperado:**
- Todos los caracteres se guardan y muestran correctamente
- El formato se preserva en el panel de admin

---

### 5.3 Validar Post que No Existe

**Objetivo:** Verificar manejo de errores cuando el post no existe

**Pasos:**
1. Intentar crear un reporte con un postId que no existe (usando herramientas de desarrollador)
   - Abrir consola del navegador
   - Ejecutar: `fetch('/api/reports', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({postId: 'invalid-id', reason: 'SPAM'}) })`

**Resultado Esperado:**
- Se devuelve error 404: "Post not found"
- No se crea ningún reporte

---

## 6. Pruebas de Permisos y Seguridad

### 6.1 Acceso al Panel de Reportes (No Autorizado)

**Objetivo:** Verificar que usuarios sin permisos no pueden acceder

**Pasos:**
1. Iniciar sesión como Usuario 2 (CLIENT, sin rol ADMIN/OPERATOR)
2. Intentar acceder directamente a `/api/reports`:
   - Abrir consola del navegador
   - Ejecutar: `fetch('/api/reports').then(r => r.json())`

**Resultado Esperado:**
- Se devuelve error 403: "Forbidden"
- No se muestran reportes

---

### 6.2 Actualizar Status de Reporte (No Autorizado)

**Objetivo:** Verificar que solo ADMIN/OPERATOR pueden actualizar reportes

**Pasos:**
1. Como Usuario 2 (CLIENT), obtener ID de un reporte
2. Intentar actualizar el status:
   ```javascript
   fetch('/api/reports/[id]', {
     method: 'PUT',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({status: 'RESOLVED'})
   })
   ```

**Resultado Esperado:**
- Se devuelve error 403: "Forbidden"
- El status NO se actualiza

---

### 6.3 Crear Reporte sin Autenticación

**Objetivo:** Verificar que se requiere autenticación para crear reportes

**Pasos:**
1. Cerrar sesión
2. Intentar crear reporte desde consola:
   ```javascript
   fetch('/api/reports', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({postId: 'valid-id', reason: 'SPAM'})
   })
   ```

**Resultado Esperado:**
- Se devuelve error 401: "Unauthorized"
- No se crea ningún reporte

---

### 6.4 Verificar Usuario que Revisó

**Objetivo:** Verificar que se guarda correctamente quién revisó el reporte

**Pasos:**
1. Como ADMIN, marcar un reporte como RESOLVED
2. Verificar que en el reporte se muestra:
   - Nombre/email del admin que revisó
   - Fecha de revisión

**Resultado Esperado:**
- Se guarda correctamente el `reviewedBy`
- Se guarda correctamente el `reviewedAt`
- Se muestra la información en el panel de admin

---

## 7. Pruebas de UI/UX

### 7.1 Diseño del Diálogo de Reporte

**Objetivo:** Verificar diseño y usabilidad del diálogo

**Verificaciones:**
- [ ] El diálogo es modal (no se puede interactuar con el contenido detrás)
- [ ] El diálogo tiene un título claro: "Reportar Publicación"
- [ ] Tiene descripción explicativa
- [ ] Los campos están bien etiquetados
- [ ] El campo de razón es un select (dropdown)
- [ ] El campo de comentario es un textarea
- [ ] Los botones están bien posicionados
- [ ] El diseño es responsive (funciona en móvil)

---

### 7.2 Mensajes de Feedback

**Objetivo:** Verificar mensajes de éxito y error

**Verificaciones:**
- [ ] Mensaje de éxito es claro y visible
- [ ] Mensaje de error es claro y visible
- [ ] Los mensajes desaparecen apropiadamente
- [ ] Los mensajes tienen colores apropiados (verde para éxito, rojo para error)

---

### 7.3 Panel de Admin - Lista de Reportes

**Objetivo:** Verificar diseño y usabilidad del panel

**Verificaciones:**
- [ ] Los reportes se muestran en cards/tarjetas
- [ ] La información está bien organizada
- [ ] Los badges de status tienen colores apropiados
- [ ] Los botones de acción son claros
- [ ] Los filtros funcionan correctamente
- [ ] El diseño es responsive

---

### 7.4 Navegación y Accesibilidad

**Objetivo:** Verificar navegación y accesibilidad básica

**Verificaciones:**
- [ ] Se puede navegar con teclado (Tab, Enter, Escape)
- [ ] El diálogo se cierra con Escape
- [ ] Los campos son accesibles con lectores de pantalla (labels apropiados)
- [ ] Los colores tienen suficiente contraste

---

## 8. Checklist Final

### Funcionalidad Básica
- [ ] Crear reporte funciona
- [ ] Todas las razones de reporte funcionan
- [ ] Comentarios opcionales funcionan
- [ ] Validación de campos obligatorios funciona
- [ ] Cancelar reporte funciona
- [ ] Prevenir reportes duplicados funciona

### Panel de Admin
- [ ] Listar reportes funciona
- [ ] Filtrar por status funciona
- [ ] Ver detalles del reporte funciona
- [ ] Marcar como resuelto funciona
- [ ] Descartar reporte funciona
- [ ] Navegar al post funciona
- [ ] Información del revisor se guarda correctamente

### Permisos y Seguridad
- [ ] Solo usuarios autenticados pueden reportar
- [ ] Los owners no pueden reportar sus propios posts
- [ ] Solo ADMIN/OPERATOR pueden ver reportes
- [ ] Solo ADMIN/OPERATOR pueden actualizar reportes
- [ ] Validación de post existente funciona

### UI/UX
- [ ] Diseño es claro y usable
- [ ] Mensajes de feedback son apropiados
- [ ] El diseño es responsive
- [ ] Navegación con teclado funciona

### Datos y Persistencia
- [ ] Los reportes se guardan en la base de datos
- [ ] Los reportes se cargan correctamente
- [ ] Las actualizaciones se persisten
- [ ] Las relaciones (post, reporter, reviewer) funcionan

---

## 9. Notas Adicionales

### 9.1 Datos de Prueba Recomendados
- Crear al menos 5-10 reportes con diferentes razones y status
- Probar con posts de diferentes categorías
- Probar con diferentes usuarios reportando

### 9.2 Casos Edge a Considerar
- Reportar un post que luego se elimina
- Reportar un post que cambia de status (APPROVED → REJECTED)
- Múltiples usuarios reportando el mismo post
- Reportes con comentarios muy largos (cerca del límite)

### 9.3 Errores Conocidos o Limitaciones
- Actualmente no hay notificaciones automáticas para nuevos reportes
- No hay búsqueda de reportes (solo filtros)
- No hay paginación en la lista de reportes (puede ser necesario si hay muchos)

---

## 10. Comandos Útiles para Testing

### Limpiar Reportes de Prueba (Base de Datos)
```sql
-- CUIDADO: Esto elimina TODOS los reportes
DELETE FROM "PostReport";
```

### Ver Reportes en Base de Datos
```sql
SELECT 
  pr.id,
  pr.reason,
  pr.status,
  pr."createdAt",
  u.email as reporter_email,
  p.id as post_id
FROM "PostReport" pr
JOIN "User" u ON pr."reporterId" = u.id
JOIN "Post" p ON pr."postId" = p.id
ORDER BY pr."createdAt" DESC;
```

### Contar Reportes por Status
```sql
SELECT status, COUNT(*) as count
FROM "PostReport"
GROUP BY status;
```

---

**Fin del Documento**

*Última actualización: 2025-01-02*

