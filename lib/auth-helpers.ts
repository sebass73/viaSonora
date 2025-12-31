import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Verifica si el usuario actual tiene rol de ADMIN
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { staffRole: true },
  });

  return user?.staffRole === 'ADMIN';
}

/**
 * Verifica si el usuario actual tiene rol de ADMIN o OPERATOR
 */
export async function isAdminOrOperator(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { staffRole: true },
  });

  return user?.staffRole === 'ADMIN' || user?.staffRole === 'OPERATOR';
}

/**
 * Obtiene el usuario actual con su staffRole
 */
export async function getCurrentUserWithRole() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      staffRole: true,
    },
  });

  return user;
}

