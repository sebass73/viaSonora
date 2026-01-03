# Guía de Tests Manuales - Disponibilidad de Instrumentos

**Fecha:** 2025-01-02  
**Funcionalidad:** Sistema de Disponibilidad por Instrumento (Días Semana + Rango Horario)

---

## 📋 Índice

1. [Tests de Configuración de Disponibilidad](#1-tests-de-configuración-de-disponibilidad)
2. [Tests de Solicitud de Request](#2-tests-de-solicitud-de-request)
3. [Tests de Validación Backend](#3-tests-de-validación-backend)
4. [Tests de Visualización](#4-tests-de-visualización)
5. [Casos Edge y Errores](#5-casos-edge-y-errores)

---

## 1. Tests de Configuración de Disponibilidad

### 1.1 Crear Instrumento SIN Disponibilidad

**Objetivo:** Verificar que se puede crear un instrumento sin configurar disponibilidad.

**Pasos:**
1. Iniciar sesión como usuario OWNER (demo@viasonora.com / owner123)
2. Ir a "Mis instrumentos" → "Nuevo Instrumento"
3. Completar todos los campos requeridos (título, categoría, descripción, etc.)
4. **NO** configurar disponibilidad (dejar la sección vacía)
5. Subir al menos 3 fotos
6. Agregar al menos una ubicación
7. Guardar el instrumento

**Resultado Esperado:**
- ✅ El instrumento se crea correctamente
- ✅ No aparece ninguna disponibilidad configurada
- ✅ Al crear un post con este instrumento, se permite cualquier fecha/hora en las solicitudes

---

### 1.2 Crear Instrumento CON Disponibilidad (Todos los Días)

**Objetivo:** Verificar que se puede configurar disponibilidad para todos los días de la semana.

**Pasos:**
1. Crear un nuevo instrumento
2. En la sección "Disponibilidad", hacer clic en todos los días (Dom, Lun, Mar, Mié, Jue, Vie, Sáb)
3. Configurar horarios:
   - Desde: 09:00
   - Hasta: 18:00
   - (Aplicar a todos los días)
4. Guardar el instrumento

**Resultado Esperado:**
- ✅ Todos los días aparecen seleccionados
- ✅ Todos tienen el mismo horario (09:00 - 18:00)
- ✅ El instrumento se guarda correctamente

---

### 1.3 Crear Instrumento CON Disponibilidad (Solo Días de Semana)

**Objetivo:** Verificar que se puede configurar disponibilidad solo para días laborables.

**Pasos:**
1. Crear un nuevo instrumento
2. En "Disponibilidad", seleccionar solo: Lun, Mar, Mié, Jue, Vie
3. Configurar horarios:
   - Desde: 10:00
   - Hasta: 20:00
4. Guardar el instrumento

**Resultado Esperado:**
- ✅ Solo los días laborables aparecen seleccionados
- ✅ Dom y Sáb NO están seleccionados
- ✅ El instrumento se guarda correctamente

---

### 1.4 Crear Instrumento CON Disponibilidad (Solo Fines de Semana)

**Objetivo:** Verificar que se puede configurar disponibilidad solo para fines de semana.

**Pasos:**
1. Crear un nuevo instrumento
2. En "Disponibilidad", seleccionar solo: Dom, Sáb
3. Configurar horarios:
   - Desde: 14:00
   - Hasta: 22:00
4. Guardar el instrumento

**Resultado Esperado:**
- ✅ Solo Dom y Sáb aparecen seleccionados
- ✅ Los días laborables NO están seleccionados
- ✅ El instrumento se guarda correctamente

---

### 1.5 Crear Instrumento CON Disponibilidad (Horarios Diferentes por Día)

**Objetivo:** Verificar que se pueden configurar horarios diferentes para cada día.

**Pasos:**
1. Crear un nuevo instrumento
2. Seleccionar varios días (ej: Lun, Mié, Vie)
3. Configurar horarios diferentes:
   - Lunes: 09:00 - 17:00
   - Miércoles: 14:00 - 22:00
   - Viernes: 10:00 - 18:00
4. Guardar el instrumento

**Resultado Esperado:**
- ✅ Cada día muestra su horario específico
- ✅ Los horarios se guardan correctamente
- ✅ El instrumento se guarda sin errores

---

### 1.6 Editar Disponibilidad de Instrumento Existente

**Objetivo:** Verificar que se puede editar la disponibilidad de un instrumento existente.

**Pasos:**
1. Ir a "Mis instrumentos"
2. Seleccionar un instrumento existente
3. Hacer clic en "Editar"
4. Modificar la disponibilidad:
   - Agregar/quitar días
   - Cambiar horarios
5. Guardar los cambios

**Resultado Esperado:**
- ✅ Los cambios se guardan correctamente
- ✅ La disponibilidad se actualiza en la base de datos
- ✅ No se pierden otros datos del instrumento

---

### 1.7 Eliminar Disponibilidad de Instrumento

**Objetivo:** Verificar que se puede eliminar toda la disponibilidad de un instrumento.

**Pasos:**
1. Editar un instrumento que tenga disponibilidad configurada
2. Deseleccionar todos los días (hacer clic en cada día seleccionado)
3. Guardar los cambios

**Resultado Esperado:**
- ✅ Todos los días se deseleccionan
- ✅ El instrumento se guarda sin disponibilidad
- ✅ En futuras solicitudes, se permite cualquier fecha/hora

---

## 2. Tests de Solicitud de Request

### 2.1 Enviar Solicitud a Instrumento SIN Disponibilidad

**Objetivo:** Verificar que se puede enviar una solicitud a un instrumento sin disponibilidad configurada.

**Pasos:**
1. Iniciar sesión como CLIENT (client@viasonora.com / client123)
2. Buscar un post de un instrumento SIN disponibilidad configurada
3. Hacer clic en "Enviar Solicitud"
4. Seleccionar cualquier fecha y hora:
   - Fecha inicio: Cualquier día futuro
   - Hora inicio: Cualquier hora
   - Fecha fin: Después de la fecha inicio
   - Hora fin: Después de la hora inicio
5. Completar el mensaje (mínimo 10 caracteres)
6. Enviar la solicitud

**Resultado Esperado:**
- ✅ El calendario permite seleccionar cualquier día
- ✅ No hay restricciones de horario
- ✅ La solicitud se envía correctamente
- ✅ No aparece mensaje de error de disponibilidad

---

### 2.2 Enviar Solicitud a Instrumento CON Disponibilidad (Día Disponible)

**Objetivo:** Verificar que se puede enviar una solicitud en un día y horario disponible.

**Pasos:**
1. Buscar un post de un instrumento CON disponibilidad configurada (ej: Lun-Vie 09:00-18:00)
2. Hacer clic en "Enviar Solicitud"
3. Seleccionar:
   - Fecha inicio: Un lunes (día disponible)
   - Hora inicio: 10:00 (dentro del rango 09:00-18:00)
   - Fecha fin: El mismo lunes o después
   - Hora fin: 17:00 (dentro del rango)
4. Completar el mensaje
5. Enviar la solicitud

**Resultado Esperado:**
- ✅ El calendario muestra el lunes como disponible
- ✅ No hay errores de validación
- ✅ La solicitud se envía correctamente

---

### 2.3 Intentar Solicitud en Día NO Disponible

**Objetivo:** Verificar que el calendario deshabilita días no disponibles.

**Pasos:**
1. Buscar un post de un instrumento con disponibilidad solo Lun-Vie
2. Hacer clic en "Enviar Solicitud"
3. Intentar seleccionar un sábado o domingo en el calendario

**Resultado Esperado:**
- ✅ Los sábados y domingos aparecen deshabilitados (grises, no clickeables)
- ✅ No se puede seleccionar un día no disponible
- ✅ El calendario muestra claramente qué días están disponibles

---

### 2.4 Intentar Solicitud con Hora FUERA del Rango

**Objetivo:** Verificar que se valida que la hora esté dentro del rango disponible.

**Pasos:**
1. Buscar un post de un instrumento con disponibilidad (ej: 09:00-18:00)
2. Hacer clic en "Enviar Solicitud"
3. Seleccionar un día disponible (ej: lunes)
4. Seleccionar hora inicio: 08:00 (antes del rango)
5. Intentar enviar la solicitud

**Resultado Esperado:**
- ✅ Aparece un mensaje de error: "La hora debe estar entre 09:00 y 18:00 para Lunes"
- ✅ El formulario no se envía
- ✅ El campo de hora muestra el error

**Repetir con:**
- Hora inicio: 19:00 (después del rango)
- Hora fin: 08:00 (antes del rango)
- Hora fin: 19:00 (después del rango)

---

### 2.5 Solicitud que Abarca Múltiples Días

**Objetivo:** Verificar que se valida correctamente cuando una solicitud abarca varios días.

**Pasos:**
1. Buscar un instrumento con disponibilidad Lun-Vie 09:00-18:00
2. Enviar solicitud con:
   - Fecha inicio: Lunes
   - Fecha fin: Miércoles
   - Horas dentro del rango
3. Enviar la solicitud

**Resultado Esperado:**
- ✅ Si todos los días (Lun, Mar, Mié) están disponibles → Solicitud se envía
- ✅ Si algún día intermedio no está disponible → Error específico

---

### 2.6 Validación de Fechas Pasadas

**Objetivo:** Verificar que no se pueden seleccionar fechas pasadas.

**Pasos:**
1. Abrir el formulario de solicitud
2. Intentar seleccionar una fecha anterior a hoy en el calendario

**Resultado Esperado:**
- ✅ Las fechas pasadas aparecen deshabilitadas (grises)
- ✅ No se puede seleccionar una fecha pasada

---

### 2.7 Validación de Fecha Fin Anterior a Fecha Inicio

**Objetivo:** Verificar que la fecha de fin debe ser posterior a la fecha de inicio.

**Pasos:**
1. Abrir el formulario de solicitud
2. Seleccionar fecha inicio: 15 de enero
3. Seleccionar fecha fin: 14 de enero (anterior)
4. Intentar enviar

**Resultado Esperado:**
- ✅ Aparece error: "La fecha de fin debe ser posterior a la fecha de inicio"
- ✅ El formulario no se envía

---

## 3. Tests de Validación Backend

### 3.1 Validación Backend - Día No Disponible

**Objetivo:** Verificar que el backend rechaza solicitudes en días no disponibles.

**Pasos:**
1. Usar Postman/Thunder Client o modificar temporalmente el frontend
2. Enviar una solicitud POST a `/api/requests` con:
   - `fromDate`: Un domingo (si el instrumento solo tiene Lun-Vie)
   - `toDate`: El mismo domingo
   - Datos válidos del resto

**Resultado Esperado:**
- ✅ Respuesta 400 Bad Request
- ✅ Mensaje: "El día Domingo no está disponible para este instrumento"

---

### 3.2 Validación Backend - Hora Fuera de Rango

**Objetivo:** Verificar que el backend rechaza solicitudes con horas fuera del rango.

**Pasos:**
1. Enviar solicitud con:
   - Día disponible (ej: lunes)
   - Hora inicio: 08:00 (fuera del rango 09:00-18:00)

**Resultado Esperado:**
- ✅ Respuesta 400 Bad Request
- ✅ Mensaje: "La hora de inicio debe estar entre 09:00 y 18:00 para Lunes"

---

### 3.3 Validación Backend - Rango de Múltiples Días

**Objetivo:** Verificar que el backend valida todos los días del rango.

**Pasos:**
1. Enviar solicitud que abarca:
   - Lunes (disponible)
   - Martes (disponible)
   - Miércoles (NO disponible - si el instrumento solo tiene Lun, Mar, Jue, Vie)

**Resultado Esperado:**
- ✅ Respuesta 400 Bad Request
- ✅ Mensaje: "El día Miércoles no está disponible para este instrumento"

---

## 4. Tests de Visualización

### 4.1 Ver Disponibilidad en PostDetail

**Objetivo:** Verificar que la disponibilidad se muestra correctamente en el detalle del post.

**Pasos:**
1. Buscar un post de un instrumento CON disponibilidad
2. Abrir el detalle del post
3. Revisar la sección "Disponibilidad"

**Resultado Esperado:**
- ✅ Se muestra una sección "Disponibilidad"
- ✅ Se listan todos los días configurados con sus horarios
- ✅ Formato: "Lunes: 09:00 - 18:00"
- ✅ Aparece la nota sobre coordinación directa

---

### 4.2 PostDetail SIN Disponibilidad

**Objetivo:** Verificar que no se muestra disponibilidad si no está configurada.

**Pasos:**
1. Buscar un post de un instrumento SIN disponibilidad
2. Abrir el detalle del post

**Resultado Esperado:**
- ✅ NO aparece la sección "Disponibilidad"
- ✅ El formulario de solicitud funciona normalmente

---

### 4.3 Calendario en RequestForm - Días Disponibles

**Objetivo:** Verificar que el calendario muestra correctamente los días disponibles.

**Pasos:**
1. Abrir formulario de solicitud para instrumento con disponibilidad
2. Observar el calendario

**Resultado Esperado:**
- ✅ Los días disponibles aparecen normales (clickeables)
- ✅ Los días NO disponibles aparecen deshabilitados (grises, no clickeables)
- ✅ Las flechas de navegación están correctamente espaciadas
- ✅ Los encabezados de días (Su, Mo, Tu, etc.) tienen el mismo tamaño

---

## 5. Casos Edge y Errores

### 5.1 Instrumento con Disponibilidad en Todos los Días

**Objetivo:** Verificar que funciona correctamente cuando todos los días están disponibles.

**Pasos:**
1. Crear instrumento con disponibilidad Dom-Sáb, 00:00-23:59
2. Enviar solicitud con cualquier fecha/hora

**Resultado Esperado:**
- ✅ Se puede seleccionar cualquier día
- ✅ Se puede seleccionar cualquier hora
- ✅ La solicitud se envía correctamente

---

### 5.2 Cambiar Disponibilidad de Instrumento con Solicitudes Activas

**Objetivo:** Verificar qué pasa cuando se cambia la disponibilidad de un instrumento que ya tiene solicitudes.

**Pasos:**
1. Crear instrumento con disponibilidad Lun-Vie
2. Enviar una solicitud para el lunes (aceptada)
3. Editar el instrumento y cambiar disponibilidad a solo Mar-Vie
4. Intentar enviar nueva solicitud para el lunes

**Resultado Esperado:**
- ✅ Las solicitudes existentes no se afectan
- ✅ Las nuevas solicitudes respetan la nueva disponibilidad
- ✅ No se puede enviar solicitud para lunes (ya no disponible)

---

### 5.3 Horarios Extremos

**Objetivo:** Verificar que funcionan horarios extremos (madrugada, noche).

**Pasos:**
1. Crear instrumento con disponibilidad:
   - Viernes: 22:00 - 02:00 (del día siguiente)
2. Intentar enviar solicitud

**Nota:** El sistema actual solo soporta horarios dentro del mismo día (no cruza medianoche). Este es un caso edge para documentar.

**Resultado Esperado:**
- ⚠️ El sistema valida que endTime > startTime
- ⚠️ No se puede configurar un horario que cruce medianoche (22:00-02:00)
- ✅ Se debe configurar como dos rangos separados si es necesario

---

### 5.4 Múltiples Instrumentos con Diferentes Disponibilidades

**Objetivo:** Verificar que cada instrumento mantiene su propia disponibilidad.

**Pasos:**
1. Crear 3 instrumentos:
   - Instrumento A: Sin disponibilidad
   - Instrumento B: Lun-Vie 09:00-18:00
   - Instrumento C: Dom-Sáb 14:00-22:00
2. Crear posts para cada uno
3. Enviar solicitudes a cada uno

**Resultado Esperado:**
- ✅ Cada instrumento respeta su propia disponibilidad
- ✅ No hay interferencia entre instrumentos
- ✅ Las solicitudes se validan correctamente según cada instrumento

---

## 📝 Checklist de Tests

### Configuración
- [ ] Crear instrumento sin disponibilidad
- [ ] Crear instrumento con disponibilidad todos los días
- [ ] Crear instrumento con disponibilidad solo días laborables
- [ ] Crear instrumento con disponibilidad solo fines de semana
- [ ] Crear instrumento con horarios diferentes por día
- [ ] Editar disponibilidad de instrumento existente
- [ ] Eliminar disponibilidad de instrumento

### Solicitudes
- [ ] Solicitud a instrumento sin disponibilidad (cualquier fecha/hora)
- [ ] Solicitud a instrumento con disponibilidad (día y hora válidos)
- [ ] Intentar solicitud en día no disponible (calendario deshabilita)
- [ ] Intentar solicitud con hora fuera de rango (validación frontend)
- [ ] Solicitud que abarca múltiples días
- [ ] Validación de fechas pasadas
- [ ] Validación fecha fin anterior a fecha inicio

### Backend
- [ ] Validación backend - día no disponible
- [ ] Validación backend - hora fuera de rango
- [ ] Validación backend - rango múltiples días

### Visualización
- [ ] Ver disponibilidad en PostDetail (con disponibilidad)
- [ ] PostDetail sin disponibilidad (no se muestra)
- [ ] Calendario muestra días disponibles/no disponibles correctamente

### Casos Edge
- [ ] Instrumento con todos los días disponibles
- [ ] Cambiar disponibilidad con solicitudes activas
- [ ] Horarios extremos (documentar limitación)
- [ ] Múltiples instrumentos con diferentes disponibilidades

---

## 🐛 Errores Conocidos / Limitaciones

1. **Horarios que cruzan medianoche:** No soportados. Si un instrumento está disponible de 22:00 a 02:00, se debe configurar como dos rangos separados (22:00-23:59 y 00:00-02:00).

2. **Zona horaria:** El sistema usa la zona horaria del servidor. Las horas se guardan en formato "HH:mm" sin información de zona horaria.

3. **Cambios de disponibilidad:** Si se cambia la disponibilidad de un instrumento, las solicitudes existentes no se validan nuevamente. Solo las nuevas solicitudes respetan la nueva disponibilidad.

---

**Última actualización:** 2025-01-02

