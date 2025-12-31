import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminOrOperator } from '@/lib/auth-helpers';
import { updatePostStatusSchema } from '@/lib/validation';

// PUT: Actualizar status de un post (moderación)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await isAdminOrOperator();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updatePostStatusSchema.parse(body);

    const session = await auth();
    const moderatorId = session?.user?.id;

    const post = await prisma.post.update({
      where: { id },
      data: {
        status: validated.status,
      },
      include: {
        instrument: {
          include: {
            category: true,
            photos: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            owner: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // TODO: En el futuro, registrar la acción de moderación en un log
    // await prisma.moderationLog.create({ ... });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error updating post status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

