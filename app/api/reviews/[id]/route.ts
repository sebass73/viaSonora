import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { replyReviewSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// PATCH: El usuario calificado publica su única respuesta pública a una review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = replyReviewSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.subjectId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (review.reply !== null) {
      return NextResponse.json(
        { error: 'Esta review ya tiene una respuesta' },
        { status: 409 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        reply: validated.reply,
        repliedAt: new Date(),
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error replying to review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
