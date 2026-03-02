import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth-helpers';
import { FEATURE_FLAG_DEFINITIONS } from '@/lib/feature-flags';

type RouteParams = { params: Promise<{ key: string }> };

/**
 * PUT /api/admin/feature-flags/[key]
 * Activa o desactiva un feature flag. Solo ADMIN.
 * Body: { enabled: boolean }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const isAuthorized = await isAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { key } = await params;
    if (!key || !FEATURE_FLAG_DEFINITIONS[key]) {
      return NextResponse.json(
        { error: 'Feature flag no reconocido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const enabled = Boolean(body.enabled);
    const description = typeof body.description === 'string' ? body.description : null;

    const flag = await prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled, description },
      update: { enabled, ...(description !== null && { description }) },
    });

    return NextResponse.json(flag);
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Error al actualizar feature flag' },
      { status: 500 }
    );
  }
}
