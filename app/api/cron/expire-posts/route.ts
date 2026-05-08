import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return true;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  return authHeader === `Bearer ${expectedSecret}`;
}

/**
 * POST /api/cron/expire-posts
 * Marca como EXPIRED los posts APPROVED vencidos.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const result = await prisma.post.updateMany({
      where: {
        status: 'APPROVED',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return NextResponse.json({
      expiredCount: result.count,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error expiring posts via cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
