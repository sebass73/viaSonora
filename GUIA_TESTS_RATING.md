# Guía de Pruebas Manuales - Devolución Bilateral, Rating y Perfil Público

**Fecha de creación:** 2026-08-23
**Versión:** 1.0
**Funcionalidad:** Confirmación de devolución bilateral + Rating bidireccional + Perfil público de usuario (change `loan-return-rating`)

---

## 📋 Índice

1. [Prerequisitos](#prerequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Pruebas de Confirmación de Devolución](#pruebas-de-confirmación-de-devolución)
4. [Pruebas de Rating](#pruebas-de-rating)
5. [Pruebas del Perfil Público](#pruebas-del-perfil-público)
6. [Pruebas de Validación](#pruebas-de-validación)
7. [Pruebas de Permisos y Seguridad](#pruebas-de-permisos-y-seguridad)
8. [Pruebas de UI/UX](#pruebas-de-uiux)
9. [Checklist Final](#checklist-final)
10. [Notas Adicionales](#notas-adicionales)
11. [Comandos Útiles para Testing](#comandos-útiles-para-testing)

---

## 1. Prerequisitos

### 1.1 Requisitos del Sistema
- Base de datos ejecutándose con la migración de `loan-return-rating` aplicada (`ownerReturnConfirmedAt`/`clientReturnConfirmedAt` en `Request`, modelo `Review` nuevo)
- Servidor de desarrollo corriendo (`npm run dev`)
- Seed ejecutado (`npx prisma db seed`) — carga los usuarios y préstamos de prueba de esta sección

### 1.2 Usuarios de Prueba (creados por el seed)
| Usuario | Email | Password | Rol en la demo |
|---|---|---|---|
| Juan (demo) | demo@viasonora.com | owner123 | Owner de todos los instrumentos |
| María | client@viasonora.com | client123 | Cliente en la mayoría de los préstamos |
| Carla | carla@viasonora.com | carla123 | Segundo cliente (variedad de casos) |
| Admin | admin@viasonora.com | admin123 | Sin préstamos — sirve para ver el perfil vacío |

### 1.3 Préstamos de Prueba (creados por el seed)
| Instrumento | Cliente | Estado | Qué demuestra |
|---|---|---|---|
| Violín Profesional 4/4 (violin1) | María | `REQUESTED` | Flujo previo (aceptar/rechazar), sin tocar |
| Piano Digital Kawai (piano3) | María | `COMPLETED` | Calificado por ambos lados + 1 respuesta pública del owner |
| Batería Acústica DW (drums3) | María | `COMPLETED` | Completado, **sin ninguna calificación** |
| Saxofón Tenor Selmer (sax2) | Carla | `COMPLETED` | Completado con un cliente distinto, sin calificar |
| Violín Profesional (violin2) | María | `ACCEPTED` | Solo el **owner** confirmó la devolución |
| Amplificador Fender Twin Reverb (amp1) | Carla | `ACCEPTED` | Solo el **cliente** confirmó la devolución |

---

## 2. Configuración Inicial

```bash
# Aplicar la migración de este change (si no corrió antes)
npx prisma migrate deploy   # o npx prisma db push si el flujo del proyecto usa push

# Regenerar el cliente de Prisma
npx prisma generate

# Cargar los datos de prueba
npx prisma db seed

# Levantar el servidor
npm run dev
```

Verificar en consola que el seed imprime la línea `✅ Completed loan with bidirectional reviews + reply created (piano3)` y las siguientes 4 líneas de préstamos — si no aparecen, el seed no llegó a esta sección.

---

## 3. Pruebas de Confirmación de Devolución

### 3.1 Confirmar devolución como cliente (primer lado)

**Objetivo:** Verificar que el cliente puede confirmar su parte sin esperar al owner.

**Pasos:**
1. Iniciar sesión como María (`client@viasonora.com`)
2. Ir a `/requests` → pestaña correspondiente al préstamo de **violin2** (`ACCEPTED`, el owner ya confirmó)
3. Verificar que la card muestra que el owner ya confirmó la devolución (badge/mensaje de estado)
4. Hacer clic en "Confirmar que devolví el instrumento"

**Resultado esperado:**
- La confirmación del cliente se registra
- Como el owner ya había confirmado antes, el préstamo pasa automáticamente a `COMPLETED` (sin ningún botón de "completar" manual)
- Aparece la opción de calificar a Juan (owner)

---

### 3.2 Confirmar devolución como owner (primer lado)

**Objetivo:** Verificar el camino inverso — el owner confirma antes que el cliente.

**Pasos:**
1. Iniciar sesión como Carla (`carla@viasonora.com`)
2. Ir al préstamo de **amp1** (`ACCEPTED`, ella ya confirmó como cliente)
3. Cerrar sesión, iniciar sesión como Juan (`demo@viasonora.com`)
4. Ir al mismo préstamo y hacer clic en "Confirmar que recibí el instrumento de vuelta"

**Resultado esperado:**
- El préstamo pasa a `COMPLETED` automáticamente (Carla ya había confirmado)
- Ambos ahora pueden calificarse mutuamente

---

### 3.3 Confirmar un solo lado — el préstamo NO se completa todavía

**Objetivo:** Verificar que con una sola confirmación el préstamo se queda en `ACCEPTED`.

**Pasos:**
1. Iniciar sesión como María
2. Buscar un préstamo `ACCEPTED` donde ninguno confirmó todavía (crear uno nuevo: solicitar un instrumento, que Juan lo acepte)
3. Confirmar solo del lado del cliente

**Resultado esperado:**
- El estado sigue en `ACCEPTED`
- La UI muestra "esperando que el owner confirme la devolución" (o equivalente)
- No aparece ninguna opción de calificar todavía

---

### 3.4 No se puede confirmar devolución si no está `ACCEPTED`

**Objetivo:** Verificar el guard de estado.

**Pasos:**
1. Ir al préstamo de **violin1** (`REQUESTED`, todavía no aceptado)
2. Verificar que no aparece ningún botón de confirmar devolución (ni para owner ni para cliente)
3. Ir a un préstamo ya `COMPLETED` (piano3) y verificar que tampoco aparecen los botones de confirmación

**Resultado esperado:**
- Los botones de confirmación solo existen mientras el estado es `ACCEPTED`

---

### 3.5 No se puede confirmar el rol del otro (cross-role)

**Objetivo:** Verificar que cada parte solo puede confirmar su propio lado.

**Pasos:**
1. Como María (cliente en violin2), intentar forzar la confirmación como owner vía consola del navegador:
   ```javascript
   fetch('/api/requests/<id-de-violin2>', {
     method: 'PUT',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ action: 'CONFIRM_RETURN', role: 'owner' })
   }).then(r => r.json()).then(console.log)
   ```

**Resultado esperado:**
- La API ignora el `role` del body (lo deriva del caller autenticado, no es seleccionable) o devuelve 403 — en ningún caso queda registrada una confirmación de owner hecha por María

---

## 4. Pruebas de Rating

### 4.1 Ver calificaciones ya cargadas (piano3)

**Objetivo:** Confirmar que el rating bidireccional con respuesta se ve bien.

**Pasos:**
1. Iniciar sesión con cualquier usuario (o sin sesión)
2. Ir al perfil público de Juan (desde `PostDetail` de cualquier instrumento suyo, o directo a `/es/users/<id-de-juan>`)
3. Buscar la reseña de María sobre el préstamo del piano

**Resultado esperado:**
- Se ve: 5 estrellas, comentario de María, y debajo la respuesta pública de Juan
- La respuesta aparece claramente diferenciada del comentario original (no como otro review)

---

### 4.2 Calificar un préstamo recién completado

**Objetivo:** Verificar el flujo de calificar de punta a punta.

**Pasos:**
1. Completar un préstamo nuevo (ver 3.1/3.2)
2. Como cada una de las dos partes, calificar a la otra: 1-5 estrellas + comentario opcional
3. Enviar

**Resultado esperado:**
- Ambas calificaciones se guardan de forma independiente
- Cada parte ve su propia calificación enviada y puede ver la de la otra parte una vez enviada
- El comentario es opcional — probar enviar sin comentario también funciona

---

### 4.3 Calificar es opcional y descartable

**Objetivo:** Verificar que no calificar no bloquea nada.

**Pasos:**
1. Completar un préstamo nuevo
2. Cerrar/descartar el diálogo de calificación sin calificar
3. Navegar libremente por el resto de la app

**Resultado esperado:**
- Ninguna otra funcionalidad queda bloqueada por no haber calificado
- El préstamo sigue apareciendo como `COMPLETED` en `/requests`
- Se puede volver a calificar más tarde (no hay plazo límite) — verificar que la opción de calificar sigue disponible

---

### 4.4 Una calificación por préstamo — no se puede duplicar

**Objetivo:** Verificar la unicidad `(requestId, authorId)`.

**Pasos:**
1. Calificar un préstamo ya calificado por el mismo usuario (ej. intentar que María califique dos veces el préstamo del piano)
2. Probar también vía consola del navegador:
   ```javascript
   fetch('/api/reviews', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ requestId: '<id-piano3>', rating: 3 })
   }).then(r => r.json()).then(console.log)
   ```

**Resultado esperado:**
- La UI no ofrece calificar de nuevo si ya se calificó
- El request directo a la API devuelve error (409 o similar) por violación de unicidad, no crea un segundo review

---

### 4.5 Una calificación es inmutable

**Objetivo:** Verificar que no hay edición ni borrado.

**Pasos:**
1. Buscar en la UI cualquier botón de "editar" o "borrar" sobre una calificación ya enviada (propia o ajena)

**Resultado esperado:**
- No existe ningún control de edición/borrado — ni siquiera para el autor de la reseña

---

### 4.6 Responder una reseña recibida (una sola respuesta)

**Objetivo:** Verificar la respuesta pública única.

**Pasos:**
1. Iniciar sesión como Juan
2. Ir a su perfil público, encontrar una reseña de María sin respuesta todavía (usar un préstamo `COMPLETED` nuevo, calificado, sin responder)
3. Responder la reseña
4. Intentar responder la misma reseña una segunda vez

**Resultado esperado:**
- La primera respuesta se publica y aparece debajo del comentario
- No hay forma de agregar una segunda respuesta a la misma reseña (no es un hilo)
- Solo Juan (el calificado, `subjectId`) puede responder — María no debería tener esa opción sobre su propia reseña

---

### 4.7 Calificar sin que el préstamo esté `COMPLETED`

**Objetivo:** Verificar el guard de estado para calificar.

**Pasos:**
1. Ir a un préstamo `ACCEPTED` (violin2 o amp1, todavía no completados del todo)
2. Verificar que no hay ninguna opción de calificar

**Resultado esperado:**
- La opción de calificar solo aparece cuando el `Request` está en `COMPLETED`

---

## 5. Pruebas del Perfil Público

### 5.1 Perfil con calificaciones (Juan, como prestador)

**Pasos:**
1. Sin iniciar sesión (ventana incógnito), navegar directo a `/es/users/<id-de-juan>`

**Resultado esperado:**
- Se ve accesible sin login
- Muestra promedio general + promedio "como prestador" (con al menos 1 reseña real, la del piano) + promedio "como quien devuelve"
- Lista de reseñas recibidas, incluyendo la del piano con su respuesta

---

### 5.2 Perfil con préstamos completados pero sin calificar (Carla, como quien devuelve)

**Pasos:**
1. Ir a `/es/users/<id-de-carla>`

**Resultado esperado:**
- El bloque "como quien devuelve" muestra el mensaje de "completó préstamos pero todavía no fue calificada" (o equivalente) — **no** un promedio de 0 estrellas
- El bloque "como prestador" muestra el estado vacío real ("no completó préstamos como prestador") porque Carla nunca publicó instrumentos

---

### 5.3 Perfil sin ningún préstamo completado (Admin)

**Pasos:**
1. Ir a `/es/users/<id-de-admin>`

**Resultado esperado:**
- Los tres bloques (general/prestador/quien-devuelve) muestran el estado vacío explícito, sin ningún promedio ni estrellas

---

### 5.4 El perfil no expone datos de contacto

**Objetivo:** Verificar que el perfil público no filtra email/teléfono/WhatsApp.

**Pasos:**
1. En cualquier perfil público, inspeccionar la página (Ver código fuente / Network tab)
2. Buscar el email, teléfono o link de WhatsApp del usuario

**Resultado esperado:**
- Ninguno de esos datos aparece en el HTML ni en la respuesta de `GET /api/users/[id]/profile`
- Esto es independiente del `showContact` que ya existe en `PostDetail` — no debe haber ninguna relación entre ambos

---

### 5.5 Navegar al perfil desde otras pantallas

**Pasos:**
1. Ir al detalle de cualquier post de Juan (`PostDetail`) y hacer clic en su nombre/foto
2. Ir a `/requests`, abrir una card de solicitud y hacer clic en el nombre de la otra parte

**Resultado esperado:**
- Ambos links llevan al perfil público correspondiente (`/es/users/<id>`)

---

## 6. Pruebas de Validación

### 6.1 Rating fuera de rango

**Pasos:**
```javascript
fetch('/api/reviews', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ requestId: '<id-de-un-completed-sin-calificar>', rating: 0 })
}).then(r => r.json()).then(console.log)

fetch('/api/reviews', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ requestId: '<id-de-un-completed-sin-calificar>', rating: 6 })
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:**
- Ambos devuelven error de validación (400), ningún review se crea con `rating` fuera de 1-5

---

### 6.2 Comentario vacío u omitido

**Pasos:**
1. Calificar un préstamo sin escribir comentario

**Resultado esperado:**
- Se guarda correctamente con `comment: null` — el comentario es opcional, no rompe nada

---

## 7. Pruebas de Permisos y Seguridad

### 7.1 Solo las partes del préstamo pueden confirmar/calificar

**Pasos:**
1. Iniciar sesión con un usuario que no es ni owner ni cliente de un préstamo (ej. Admin)
2. Intentar confirmar devolución o calificar ese préstamo vía API directa

**Resultado esperado:**
- 403 Forbidden en ambos casos

---

### 7.2 Confirmar/calificar sin autenticación

**Pasos:**
1. Cerrar sesión
2. Intentar los mismos requests de la API desde consola

**Resultado esperado:**
- 401 Unauthorized

---

### 7.3 `PostReport` y moderación siguen intactos

**Pasos:**
1. Como Usuario CLIENT, reportar un post (flujo existente, ver `GUIA_TESTS_REPORTES.md`)

**Resultado esperado:**
- El sistema de reportes funciona exactamente igual que antes — este cambio no lo tocó

---

## 8. Pruebas de UI/UX

### 8.1 Botones de confirmación de devolución

**Verificaciones:**
- [ ] El botón para el cliente dice algo equivalente a "Confirmar que devolví el instrumento"
- [ ] El botón para el owner dice algo equivalente a "Confirmar que recibí el instrumento de vuelta"
- [ ] Cuando una parte ya confirmó, se muestra un estado visual claro (badge/check) en vez del botón
- [ ] No queda ningún rastro del botón viejo "Marcar como completado"

### 8.2 Diálogo de calificación

**Verificaciones:**
- [ ] El selector de estrellas es claro y usable con mouse/touch
- [ ] Se puede enviar sin comentario
- [ ] Hay una opción visible de "ahora no" / cerrar sin calificar
- [ ] Después de calificar, el diálogo no vuelve a aparecer para ese préstamo

### 8.3 Perfil público

**Verificaciones:**
- [ ] Los tres bloques de promedio son visualmente distintos y fáciles de comparar
- [ ] El estado vacío se distingue claramente de un promedio bajo (no parece "mala reputación")
- [ ] El listado de reseñas es legible, con fecha, autor y estrellas
- [ ] La respuesta del calificado se distingue visualmente del comentario original
- [ ] El diseño es responsive (mobile)

### 8.4 Copy en los 5 idiomas

**Verificaciones:**
- [ ] Cambiar el idioma de la app (es/en/it/de/fr) y repetir 8.1-8.3 en cada uno
- [ ] Ningún texto nuevo queda sin traducir (placeholder tipo `requests.confirmReturn` visible como texto crudo)

---

## 9. Checklist Final

### Confirmación de devolución
- [ ] Cliente puede confirmar independientemente del owner
- [ ] Owner puede confirmar independientemente del cliente
- [ ] Con un solo lado confirmado, el préstamo sigue `ACCEPTED`
- [ ] Con ambos lados confirmados, pasa a `COMPLETED` automáticamente
- [ ] No se puede confirmar fuera de `ACCEPTED`
- [ ] No se puede confirmar el rol ajeno

### Rating
- [ ] Rating bidireccional funciona en ambas direcciones
- [ ] Comentario opcional funciona (con y sin comentario)
- [ ] Solo se puede calificar un `COMPLETED`
- [ ] Una calificación por (préstamo, autor)
- [ ] Calificación inmutable (sin editar/borrar)
- [ ] Respuesta pública única por reseña, solo del calificado
- [ ] Calificar es opcional y no bloquea nada más

### Perfil público
- [ ] Accesible sin login
- [ ] Los 3 estados por rol se ven correctamente (sin préstamos / sin calificar / calificado)
- [ ] No expone email/teléfono/WhatsApp
- [ ] Linkeado desde `PostDetail` y `RequestCard`

### Permisos y seguridad
- [ ] Solo las partes del préstamo pueden confirmar/calificar
- [ ] Todo lo anterior requiere autenticación
- [ ] `PostReport`/moderación no se vieron afectados

### No-goals (confirmar que NO existen)
- [ ] No hay ningún tracking de cancelaciones/no-shows
- [ ] No hay ningún "score de confiabilidad"
- [ ] No se puede editar el perfil de otro usuario
- [ ] No hay notificaciones/recordatorios para calificar

---

## 10. Notas Adicionales

### 10.1 Casos Edge a Considerar
- Préstamo `COMPLETED` desde antes de este cambio (sin timestamps de confirmación) — debe seguir siendo calificable igual, ya que el gate es el `status`, no los timestamps
- Confirmar devolución dos veces desde el mismo lado (debe ser un no-op idempotente, no debe romper nada)
- Un usuario con rol en ambos lados a lo largo del tiempo (prestó Y pidió prestado) — verificar que su perfil combina bien el promedio general

### 10.2 Limitaciones Conocidas
- La condición de carrera de confirmaciones simultáneas está probada por forma de query (`updateMany` guardado), no por una prueba de concurrencia real — confiarle a Postgres la semántica de locks documentada en `openspec/changes/loan-return-rating/design.md`
- No hay notificación ni recordatorio para calificar (fuera de alcance, ver proposal)

---

## 11. Comandos Útiles para Testing

### Ver préstamos completados y sus confirmaciones
```sql
SELECT id, status, "ownerReturnConfirmedAt", "clientReturnConfirmedAt", "ownerId", "clientId"
FROM "Request"
ORDER BY "updatedAt" DESC;
```

### Ver reviews con autor/calificado
```sql
SELECT
  r.id, r.rating, r.comment, r.reply, r."subjectRole",
  a.email as author_email,
  s.email as subject_email
FROM "Review" r
JOIN "User" a ON r."authorId" = a.id
JOIN "User" s ON r."subjectId" = s.id
ORDER BY r."createdAt" DESC;
```

### Promedio y contador manual por rol (para comparar contra el endpoint de perfil)
```sql
SELECT "subjectId", "subjectRole", AVG(rating)::numeric(10,2) as avg_rating, COUNT(*) as review_count
FROM "Review"
GROUP BY "subjectId", "subjectRole";
```

### Limpiar reviews de prueba (CUIDADO)
```sql
DELETE FROM "Review";
```

---

**Fin del Documento**

*Última actualización: 2026-08-23*
