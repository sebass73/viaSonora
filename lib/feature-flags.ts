import { prisma } from '@/lib/prisma';

/**
 * Definición de feature flags conocidos en el sistema.
 * Para agregar una nueva funcionalidad: añadir aquí y opcionalmente crear la fila en DB (o queda disabled por defecto).
 */
export const FEATURE_FLAG_DEFINITIONS: Record<
  string,
  { key: string; labelKey: string; descriptionKey: string }
> = {
  PAYMENTS: {
    key: 'PAYMENTS',
    labelKey: 'payments',
    descriptionKey: 'paymentsDescription',
  },
  NOTIFICATIONS: {
    key: 'NOTIFICATIONS',
    labelKey: 'notifications',
    descriptionKey: 'notificationsDescription',
  },
  EXPIRE_AUTOMATIC: {
    key: 'EXPIRE_AUTOMATIC',
    labelKey: 'expireAutomatic',
    descriptionKey: 'expireAutomaticDescription',
  },
  AVAILABILITY_VALIDATION: {
    key: 'AVAILABILITY_VALIDATION',
    labelKey: 'availabilityValidation',
    descriptionKey: 'availabilityValidationDescription',
  },
  HOME_CARDS: {
    key: 'HOME_CARDS',
    labelKey: 'homeCards',
    descriptionKey: 'homeCardsDescription',
  },
};

export type FeatureFlagWithState = {
  key: string;
  enabled: boolean;
  labelKey: string;
  descriptionKey: string;
};

/**
 * Obtiene todos los feature flags con su estado desde la base de datos.
 * Los flags definidos en código que no existan en DB se devuelven con enabled: false.
 */
export async function getFeatureFlags(): Promise<FeatureFlagWithState[]> {
  const dbFlags = await prisma.featureFlag.findMany({
    where: { key: { in: Object.keys(FEATURE_FLAG_DEFINITIONS) } },
  });
  const dbMap = new Map(dbFlags.map((f) => [f.key, f.enabled]));

  return Object.entries(FEATURE_FLAG_DEFINITIONS).map(([key, def]) => ({
    key: def.key,
    labelKey: def.labelKey,
    descriptionKey: def.descriptionKey,
    enabled: dbMap.get(key) ?? false,
  }));
}

/**
 * Comprueba si un feature flag está habilitado (para usar en servidor).
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
  });
  return flag?.enabled ?? false;
}
