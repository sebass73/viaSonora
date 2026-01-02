import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Para Neon/Vercel: usar POSTGRES_PRISMA_URL si está disponible (optimizado para Prisma)
// Fallback a DATABASE_URL para desarrollo local
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL o POSTGRES_PRISMA_URL debe estar configurada')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


