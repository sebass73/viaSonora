import { NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feature-flags
 * Lista todos los feature flags y su estado (puede usarse en cliente o en admin).
 */
export async function GET() {
  try {
    const flags = await getFeatureFlags();
    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Error al obtener feature flags' },
      { status: 500 }
    );
  }
}
