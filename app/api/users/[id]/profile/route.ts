import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RatingBucket {
  average: number | null;
  reviewCount: number;
  completedLoans: number;
}

// GET: Perfil público de un usuario — promedios por rol y reviews individuales.
// Sin verificación de sesión: visible para cualquier visitante, incluso sin login.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastName: true,
        image: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Promise.all instead of prisma.$transaction([...]): TypeScript loses the
    // literal generic type of review.groupBy's result when it sits inside a
    // $transaction tuple (verified — groupBy's _avg/_count typing collapses to
    // an untyped union only inside that array form, not standalone). These are
    // read-only aggregate queries, so the batching guarantee $transaction adds
    // is not required for correctness here.
    const [byRole, overall, lenderLoans, returnerLoans, reviews] = await Promise.all([
      prisma.review.groupBy({
        by: ['subjectRole'] as const,
        where: { subjectId: id },
        orderBy: { subjectRole: 'asc' },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.aggregate({
        where: { subjectId: id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.request.count({ where: { ownerId: id, status: 'COMPLETED' } }),
      prisma.request.count({ where: { clientId: id, status: 'COMPLETED' } }),
      prisma.review.findMany({
        where: { subjectId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          author: {
            select: { id: true, name: true, lastName: true, image: true },
          },
        },
      }),
    ]);

    const lenderRow = byRole.find((row) => row.subjectRole === 'LENDER');
    const returnerRow = byRole.find((row) => row.subjectRole === 'RETURNER');

    const asLender: RatingBucket = {
      average: lenderRow ? lenderRow._avg.rating : null,
      reviewCount: lenderRow ? lenderRow._count._all : 0,
      completedLoans: lenderLoans,
    };

    const asReturner: RatingBucket = {
      average: returnerRow ? returnerRow._avg.rating : null,
      reviewCount: returnerRow ? returnerRow._count._all : 0,
      completedLoans: returnerLoans,
    };

    // Seguro sumar: ownerId y clientId son usuarios distintos en la misma
    // request, así que ningún préstamo se cuenta dos veces.
    const overallBucket: RatingBucket = {
      average: overall._avg.rating,
      reviewCount: overall._count._all,
      completedLoans: lenderLoans + returnerLoans,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        image: user.image,
        city: user.city,
        state: user.state,
        country: user.country,
        memberSince: user.createdAt,
      },
      ratings: {
        overall: overallBucket,
        asLender,
        asReturner,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        subjectRole: review.subjectRole,
        reply: review.reply,
        repliedAt: review.repliedAt,
        author: review.author,
      })),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
