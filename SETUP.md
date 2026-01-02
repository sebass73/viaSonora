# Guía de Setup - Etapa 0

## Pasos para probar la Etapa 0

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Database (usa tu PostgreSQL local o remoto)
DATABASE_URL="postgresql://user:password@localhost:5432/viasonora?schema=public"

# NextAuth - Genera un secreto con: openssl rand -base64 32
AUTH_SECRET="tu-secreto-aqui"
AUTH_URL="http://localhost:3000"

# Google OAuth - Obtén las credenciales en:
# https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# Vercel Blob (opcional para Etapa 0, pero necesario para Etapa 1)
BLOB_READ_WRITE_TOKEN="tu-token-vercel-blob"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Setup de base de datos

```bash
# Generar Prisma Client
npm run db:generate

# Crear las tablas en la base de datos
npm run db:push

# Ejecutar seed (crea categorías)
npm run db:seed
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Verificar funcionalidades

#### ✅ Login con Google
1. Ir a http://localhost:3000
2. Click en "Iniciar sesión" / "Login"
3. Debería redirigir a Google OAuth
4. Después de autenticar, deberías estar logueado

#### ✅ Internacionalización
1. Probar URLs:
   - http://localhost:3000/es
   - http://localhost:3000/it
   - http://localhost:3000/en
2. El contenido debería cambiar según el idioma

#### ✅ Navegación
- Verificar que el navbar muestre los links correctos
- Si estás logueado, deberías ver "Mis instrumentos" y "Perfil"
- Si no estás logueado, solo "Explorar" y "Iniciar sesión"

#### ✅ Base de datos
```bash
# Abrir Prisma Studio para ver los datos
npm run db:studio
```
- Verificar que existan las categorías del seed
- Verificar que se haya creado tu usuario después del login

## Problemas comunes

### Error: "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### Error: "DATABASE_URL is not set"
Verifica que el archivo `.env` exista y tenga `DATABASE_URL` configurado.

### Error: "Invalid credentials" en Google OAuth
- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén correctos
- En Google Cloud Console, asegúrate de agregar `http://localhost:3000/api/auth/callback/google` como redirect URI

### Error: "next-intl" no funciona
- Verifica que el middleware esté en la raíz del proyecto
- Asegúrate de acceder a `/es`, `/it` o `/en` (no solo `/`)

## Checklist de verificación

- [ ] `npm install` ejecutado sin errores
- [ ] Archivo `.env` creado con todas las variables
- [ ] `npm run db:generate` ejecutado
- [ ] `npm run db:push` ejecutado sin errores
- [ ] `npm run db:seed` ejecutado y muestra "✅ Categories created"
- [ ] `npm run dev` inicia sin errores
- [ ] App carga en http://localhost:3000/es
- [ ] Login con Google funciona
- [ ] Cambio de idioma funciona (ES/IT/EN)
- [ ] Navegación muestra links correctos según estado de sesión

## Siguiente paso

Una vez que todo funcione, podemos proceder con la **Etapa 1: Core "WOW"** (ABM Instrumentos + Posts + Mapa).



