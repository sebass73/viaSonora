# ViaSonora

Marketplace de instrumentos para músicos viajeros (MVP)

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma
- NextAuth.js (Google OAuth)
- next-intl (ES/IT/EN)
- Vercel Blob (storage)
- Leaflet + OpenStreetMap (mapas)

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

Variables requeridas:
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `AUTH_SECRET`: Genera con `openssl rand -base64 32`
- `AUTH_URL`: URL de la app (http://localhost:3000 para dev)
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: Credenciales de Google OAuth
- `BLOB_READ_WRITE_TOKEN`: Token de Vercel Blob
- `NEXT_PUBLIC_APP_URL`: URL pública de la app

### 3. Configurar base de datos

```bash
# Generar Prisma Client
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Seed inicial
npm run db:seed
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en http://localhost:3000

## Estructura del proyecto

```
├── app/                    # Next.js App Router
│   ├── [locale]/          # Rutas internacionalizadas
│   └── api/               # API Routes
├── components/            # Componentes React
│   └── ui/               # Componentes shadcn/ui
├── lib/                  # Utilidades y helpers
├── prisma/               # Prisma schema y migrations
├── messages/             # Traducciones (next-intl)
└── i18n/                 # Configuración i18n
```

## Scripts disponibles

- `npm run dev` - Desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run db:generate` - Generar Prisma Client
- `npm run db:push` - Push schema a DB (dev)
- `npm run db:migrate` - Crear migración
- `npm run db:seed` - Ejecutar seed
- `npm run db:studio` - Abrir Prisma Studio

## Etapas de desarrollo

- ✅ **Etapa 0**: Setup & Fundaciones
- 🔄 **Etapa 1**: Core "WOW" (ABM Instrumentos + Posts + Mapa)
- ⏳ **Etapa 2**: Requests + Contacto bloqueado
- ⏳ **Etapa 3**: Admin/Operador (moderación)
- ⏳ **Etapa 4**: Stubs monetización

## Licencia

MIT

