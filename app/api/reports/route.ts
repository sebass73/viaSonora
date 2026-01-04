import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createReportSchema } from '@/lib/validation';
import { isAdminOrOperator } from '@/lib/auth-helpers';

// POST: Crear nuevo reporte
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createReportSchema.parse(body);

    // Verificar que el post existe
    const post = await prisma.post.findUnique({
      where: { id: validated.postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verificar que el usuario no ha reportado este post antes
    const existingReport = await prisma.postReport.findUnique({
      where: {
        postId_reporterId: {
          postId: validated.postId,
          reporterId: session.user.id,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'Ya has reportado este post anteriormente' },
        { status: 400 }
      );
    }

    // Crear el reporte
    const report = await prisma.postReport.create({
      data: {
        postId: validated.postId,
        reporterId: session.user.id,
        reason: validated.reason,
        comment: validated.comment || null,
        status: 'PENDING',
      },
      include: {
        post: {
          include: {
            instrument: {
              select: {
                title: true,
              },
            },
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Listar reportes (solo admin/operator)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es admin o operator
    const isAuthorized = await isAdminOrOperator();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' | null;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const reports = await prisma.postReport.findMany({
      where,
      include: {
        post: {
          include: {
            instrument: {
              select: {
                id: true,
                title: true,
                category: {
                  select: {
                    nameEs: true,
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
        },
        reporter: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

