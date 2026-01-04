import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateReportStatusSchema } from '@/lib/validation';
import { isAdminOrOperator } from '@/lib/auth-helpers';

// PUT: Actualizar status de reporte (solo admin/operator)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es admin o operator
    const isAuthorized = await isAdminOrOperator();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateReportStatusSchema.parse(body);

    // Verificar que el reporte existe
    const existingReport = await prisma.postReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Actualizar el reporte
    const report = await prisma.postReport.update({
      where: { id },
      data: {
        status: validated.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
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
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

