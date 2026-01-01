# Guía de Pruebas - Etapa 1: Core "WOW"

## 📋 Pre-requisitos

1. **Base de datos configurada:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

2. **Variables de entorno configuradas** (`.env`):
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (para subir fotos)

3. **App corriendo:**
   ```bash
   npm run dev
   ```

4. **Usuario autenticado:**
   - Iniciar sesión con Google OAuth

---

## ✅ Checklist de Pruebas

### 1. Perfil y Onboarding

#### 1.1 Completar Perfil
- [ ] Ir a `/profile` (o click en "Perfil" en la navegación)
- [ ] Verificar que se cargan los datos del usuario
- [ ] Completar campos:
  - [ ] Nombre y Apellido
  - [ ] Teléfono
  - [ ] URL de WhatsApp (opcional)
  - [ ] Dirección
  - [ ] Zona/Barrio
- [ ] Click en "Guardar"
- [ ] Verificar que se guarda correctamente
- [ ] Recargar página y verificar que los datos persisten

#### 1.2 Aceptar Términos y Condiciones
- [ ] En el formulario de perfil, marcar checkbox "Acepto los términos y condiciones"
- [ ] Guardar
- [ ] Verificar que `onboardingCompleted` se marca como `true`
- [ ] Verificar que `termsAcceptedAt` tiene una fecha

**Resultado esperado:** Perfil completo y T&C aceptados

---

### 2. CRUD Instrumentos

#### 2.1 Crear Instrumento
- [ ] Ir a `/instruments` (o click en "Mis instrumentos")
- [ ] Click en "Nuevo Instrumento"
- [ ] Completar formulario:
  - [ ] Título (obligatorio)
  - [ ] Categoría (seleccionar de la lista)
  - [ ] Descripción (mínimo 10 caracteres)
  - [ ] Marca (opcional)
  - [ ] Modelo (opcional)
  - [ ] Condición (Excelente/Bueno/Regular/Malo)
  - [ ] Extras/Accesorios (opcional)
- [ ] Subir fotos:
  - [ ] Subir al menos 3 fotos (mínimo requerido)
  - [ ] Subir hasta 10 fotos (máximo permitido)
  - [ ] Verificar que se muestran previews
  - [ ] Probar reordenar fotos (botones ↑ ↓)
  - [ ] Probar eliminar fotos (botón X)
- [ ] Agregar ubicaciones:
  - [ ] Click en "+ Agregar ubicación"
  - [ ] Completar: Ciudad, Zona/Barrio (opcional), Latitud, Longitud
  - [ ] Marcar una como "Principal"
  - [ ] Agregar múltiples ubicaciones (opcional)
- [ ] Click en "Guardar"
- [ ] Verificar que redirige a `/instruments`
- [ ] Verificar que el instrumento aparece en la lista

**Resultado esperado:** Instrumento creado con fotos y ubicaciones

#### 2.2 Ver Lista de Instrumentos
- [ ] Ir a `/instruments`
- [ ] Verificar que se muestran todos los instrumentos del usuario
- [ ] Verificar que cada card muestra:
  - [ ] Foto principal
  - [ ] Título
  - [ ] Categoría
  - [ ] Ciudad (de ubicación principal)
- [ ] Verificar botones "Editar" y "Eliminar" en cada card

**Resultado esperado:** Lista completa de instrumentos

#### 2.3 Editar Instrumento
- [ ] En `/instruments`, click en "Editar" de un instrumento
- [ ] Verificar que se cargan todos los datos
- [ ] Modificar algunos campos:
  - [ ] Cambiar título
  - [ ] Agregar/quitar fotos
  - [ ] Modificar ubicaciones
- [ ] Guardar
- [ ] Verificar que los cambios se reflejan en la lista

**Resultado esperado:** Instrumento actualizado correctamente

#### 2.4 Eliminar Instrumento
- [ ] En `/instruments`, click en "Eliminar" (ícono de basura)
- [ ] Confirmar eliminación en el diálogo
- [ ] Verificar que el instrumento desaparece de la lista
- [ ] Verificar que las fotos también se eliminan (cascade)

**Resultado esperado:** Instrumento eliminado completamente

---

### 3. CRUD Posts (Publicaciones)

#### 3.1 Crear Post
- [ ] Ir a `/posts` (o click en "Mis publicaciones")
- [ ] Click en "Nueva Publicación"
- [ ] Verificar que aparece lista de instrumentos disponibles
- [ ] Seleccionar un instrumento de la lista
- [ ] Verificar que se autocompleta ciudad y zona desde la ubicación principal del instrumento
- [ ] Modificar ciudad/zona si es necesario
- [ ] Click en "Crear Publicación"
- [ ] Verificar que redirige a `/posts`
- [ ] Verificar que el post aparece con status "Pendiente de aprobación"

**Resultado esperado:** Post creado en estado PENDING_APPROVAL

#### 3.2 Ver Lista de Posts
- [ ] Ir a `/posts`
- [ ] Verificar que se muestran todos los posts del usuario
- [ ] Verificar que cada card muestra:
  - [ ] Foto del instrumento
  - [ ] Título del instrumento
  - [ ] Categoría
  - [ ] Ciudad y zona
  - [ ] Status (badge con color)
  - [ ] Fecha de expiración
- [ ] Verificar botones "Ver" y "Eliminar"

**Resultado esperado:** Lista completa de posts con información relevante

#### 3.3 Ver Detalle de Post (Público)
- [ ] **Primero:** Aprobar un post manualmente (ver sección 3.4)
- [ ] Ir a `/explore` o al home
- [ ] Click en un post aprobado
- [ ] Verificar que se muestra:
  - [ ] Todas las fotos del instrumento
  - [ ] Título y descripción completa
  - [ ] Marca, modelo, condición
  - [ ] Extras/accesorios
  - [ ] Información del propietario (sin contacto)
  - [ ] Mensaje sobre solicitud de contacto
- [ ] Verificar que NO se muestra:
  - [ ] Teléfono del owner
  - [ ] Email del owner
  - [ ] WhatsApp del owner
  - [ ] Ubicación exacta (lat/lng reales)

**Resultado esperado:** Detalle completo sin información de contacto

#### 3.4 Aprobar Post Manualmente (MVP)
Para que los posts aparezcan en el mapa, necesitas aprobarlos manualmente:

**Opción A: Prisma Studio**
```bash
npm run db:studio
```
- [ ] Abrir Prisma Studio
- [ ] Ir a tabla `Post`
- [ ] Encontrar el post con `status: PENDING_APPROVAL`
- [ ] Cambiar `status` a `APPROVED`
- [ ] Guardar

**Opción B: SQL directo**
```sql
UPDATE "Post" SET status = 'APPROVED' WHERE id = 'post-id-aqui';
```

**Resultado esperado:** Post aprobado y visible públicamente

#### 3.5 Eliminar Post
- [ ] En `/posts`, click en "Eliminar" de un post
- [ ] Confirmar eliminación
- [ ] Verificar que desaparece de la lista
- [ ] Verificar que el instrumento asociado NO se elimina

**Resultado esperado:** Post eliminado, instrumento preservado

---

### 4. Mapa y Búsqueda

#### 4.1 Home - Mapa Principal
- [ ] Ir a `/` (home)
- [ ] Verificar que el mapa ocupa más del 50% de la altura visible
- [ ] Verificar que el mapa es visible sin hacer scroll
- [ ] Verificar que hay una barra de búsqueda sticky arriba del mapa
- [ ] Verificar que el mapa muestra tiles de OpenStreetMap

**Resultado esperado:** Home con mapa como elemento principal

#### 4.2 Pins en el Mapa
- [ ] Verificar que aparecen pins en el mapa para posts con:
  - [ ] `status = APPROVED`
  - [ ] `expiresAt > fecha actual`
- [ ] Verificar que los pins NO muestran ubicación exacta (jitter aplicado)
- [ ] Click en un pin
- [ ] Verificar que aparece un popup con:
  - [ ] Título del instrumento
  - [ ] Categoría
  - [ ] Ciudad
  - [ ] Botón "Ver detalles"

**Resultado esperado:** Pins interactivos con información básica

#### 4.3 Preview Card al Clickear Pin
- [ ] Click en un pin del mapa
- [ ] Verificar que aparece un card en la parte inferior con:
  - [ ] Foto del instrumento
  - [ ] Título
  - [ ] Categoría
  - [ ] Ciudad
  - [ ] Botón "Ver detalles"
- [ ] Click en "Ver detalles"
- [ ] Verificar que redirige a `/posts/[id]`

**Resultado esperado:** Preview card funcional con navegación

#### 4.4 Búsqueda en Home
- [ ] En el home, usar la barra de búsqueda:
  - [ ] Buscar por ciudad (ej: "Buenos Aires")
  - [ ] Buscar por texto (ej: "guitarra")
  - [ ] Buscar por ambos
- [ ] Click en "Buscar"
- [ ] Verificar que el mapa se actualiza con los resultados
- [ ] Verificar que solo aparecen posts APPROVED

**Resultado esperado:** Búsqueda funcional que filtra posts

#### 4.5 Página de Exploración
- [ ] Ir a `/explore`
- [ ] Verificar que muestra lista de posts APPROVED
- [ ] Verificar búsqueda por ciudad y texto
- [ ] Click en un card de post
- [ ] Verificar que redirige a `/posts/[id]`

**Resultado esperado:** Lista completa de posts públicos con búsqueda

---

### 5. Privacidad y Seguridad

#### 5.1 Jitter de Ubicación
- [ ] Crear un instrumento con ubicación conocida (ej: lat: -34.6037, lng: -58.3816)
- [ ] Crear un post desde ese instrumento
- [ ] Aprobar el post
- [ ] Ver el post en el mapa o en la API
- [ ] Verificar que las coordenadas mostradas NO son exactas
- [ ] Verificar que tienen variación de ±0.01 grados (≈1km)

**Resultado esperado:** Coordenadas aproximadas, no exactas

#### 5.2 API Pública - Sin Contacto
- [ ] Hacer GET a `/api/posts/[id]` (sin autenticación)
- [ ] Verificar que NO incluye:
  - [ ] `phone` del owner
  - [ ] `email` del owner
  - [ ] `whatsappUrl` del owner
  - [ ] Coordenadas exactas (lat/lng reales)

**Resultado esperado:** API pública no expone información sensible

#### 5.3 Autorización - Solo Owner
- [ ] Intentar editar un instrumento de otro usuario (cambiar ID en URL)
- [ ] Verificar que retorna 403 Forbidden
- [ ] Intentar eliminar un post de otro usuario
- [ ] Verificar que retorna 403 Forbidden

**Resultado esperado:** Solo el owner puede modificar sus recursos

---

### 6. Validaciones

#### 6.1 Validación de Fotos
- [ ] Intentar crear instrumento con menos de 3 fotos
- [ ] Verificar que muestra error: "Debes subir al menos 3 fotos"
- [ ] Intentar subir más de 10 fotos
- [ ] Verificar que limita a 10 fotos

**Resultado esperado:** Validación de cantidad de fotos funciona

#### 6.2 Validación de Ubicaciones
- [ ] Intentar crear instrumento sin ubicaciones
- [ ] Verificar que muestra error: "Debes agregar al menos una ubicación"
- [ ] Intentar crear post desde instrumento sin ubicación
- [ ] Verificar que muestra error apropiado

**Resultado esperado:** Validación de ubicaciones funciona

#### 6.3 Validación de Campos Obligatorios
- [ ] Intentar crear instrumento sin título
- [ ] Intentar crear instrumento sin categoría
- [ ] Intentar crear instrumento sin descripción
- [ ] Verificar que el formulario no permite enviar

**Resultado esperado:** Validaciones de campos obligatorios funcionan

---

### 7. Estados de Post

#### 7.1 Estados Visibles
- [ ] Crear varios posts
- [ ] Cambiar manualmente sus estados:
  - [ ] `PENDING_APPROVAL` (amarillo)
  - [ ] `APPROVED` (verde)
  - [ ] `REJECTED` (rojo)
  - [ ] `BANNED` (rojo)
  - [ ] `EXPIRED` (gris)
- [ ] Verificar que cada estado muestra el badge correcto con color

**Resultado esperado:** Estados visuales correctos

#### 7.2 Filtrado por Estado
- [ ] Verificar que en `/api/posts` (público) solo aparecen `APPROVED`
- [ ] Verificar que en `/api/posts?my=true` aparecen todos los estados
- [ ] Verificar que posts `EXPIRED` no aparecen en búsquedas públicas

**Resultado esperado:** Filtrado correcto por estado

---

## 🐛 Problemas Comunes y Soluciones

### El mapa no carga
- **Causa:** Leaflet requiere ejecutarse solo en cliente
- **Solución:** Verificar que `MapView` usa `dynamic import` con `ssr: false`

### Fotos no se suben
- **Causa:** `BLOB_READ_WRITE_TOKEN` no configurado o inválido
- **Solución:** Verificar variable de entorno en `.env`

### Posts no aparecen en el mapa
- **Causa:** Posts están en `PENDING_APPROVAL` o `EXPIRED`
- **Solución:** Aprobar manualmente (ver sección 3.4)

### Error "Prisma Client not generated"
- **Causa:** Prisma Client no se generó
- **Solución:** Ejecutar `npm run db:generate`

### Coordenadas exactas en el mapa
- **Causa:** Jitter no se aplicó
- **Solución:** Verificar que la API aplica `getPublicLatLng()` antes de retornar

---

## ✅ Criterios de Aceptación

La Etapa 1 se considera completa cuando:

- [x] Usuario puede completar perfil y aceptar T&C
- [x] Usuario puede crear instrumentos con 3-10 fotos y múltiples ubicaciones
- [x] Usuario puede editar y eliminar sus instrumentos
- [x] Usuario puede crear posts desde sus instrumentos
- [x] Posts aparecen en el mapa cuando están APPROVED
- [x] Mapa muestra pins con ubicación aproximada (jitter)
- [x] Click en pin muestra preview card con link a detalle
- [x] Búsqueda funciona por ciudad y texto
- [x] Detalle de post NO muestra información de contacto
- [x] Validaciones funcionan correctamente
- [x] Privacidad protegida (jitter, sin contacto en APIs públicas)

---

## 📝 Notas Finales

- **Aprobación manual:** En MVP, los posts deben aprobarse manualmente. En Etapa 3 se implementará panel de moderación.
- **Contacto bloqueado:** El contacto solo se revelará en Etapa 2 cuando se implementen las Requests.
- **Expiración:** Posts expiran automáticamente a los 30 días (campo `expiresAt`).

---

## 🎯 Próximos Pasos (Etapa 2)

Una vez completada la Etapa 1, la Etapa 2 incluirá:
- Sistema de Requests (solicitudes)
- Revelación de contacto solo cuando owner acepta
- Disponibilidad por días/horarios
- Estados de request: REQUESTED → ACCEPTED → DECLINED → etc.


