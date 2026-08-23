import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createReviewSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// POST: Crear una review bidireccional sobre una request COMPLETED
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createReviewSchema.parse(body);

    const existingRequest = await prisma.request.findUnique({
      where: { id: validated.requestId },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const isOwner = existingRequest.ownerId === session.user.id;
    const isClient = existingRequest.clientId === session.user.id;

    if (!isOwner && !isClient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (existingRequest.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Solo se puede calificar una solicitud COMPLETED' },
        { status: 400 }
      );
    }

    // El autor califica a la otra parte: cliente califica al owner (LENDER),
    // owner califica al cliente (RETURNER).
    const subjectId = isClient ? existingRequest.ownerId : existingRequest.clientId;
    const subjectRole = isClient ? 'LENDER' : 'RETURNER';

    const existingReview = await prisma.review.findUnique({
      where: {
        requestId_authorId: {
          requestId: validated.requestId,
          authorId: session.user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya has calificado esta solicitud' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        requestId: validated.requestId,
        authorId: session.user.id,
        subjectId,
        subjectRole,
        rating: validated.rating,
        comment: validated.comment || null,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya has calificado esta solicitud' },
        { status: 409 }
      );
    }
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
