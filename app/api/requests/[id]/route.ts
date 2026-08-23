import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateRequestBodySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET: Obtener request individual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const requestItem = await prisma.request.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            instrument: {
              include: {
                category: true,
                photos: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        instrument: {
          include: {
            category: true,
            photos: {
              orderBy: { order: 'asc' },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            lastName: true,
            image: true,
            email: true,
            phone: true,
            whatsappUrl: true,
            city: true,
            country: true,
            locationText: true,
            lat: true,
            lng: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            lastName: true,
            image: true,
            email: true,
          },
        },
      },
    });

    if (!requestItem) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Solo el owner o client pueden ver la request
    if (requestItem.ownerId !== session.user.id && requestItem.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(requestItem);
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar status de la request
export async function PUT(
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
    const validated = updateRequestBodySchema.parse(body);

    // Obtener la request actual
    const existingRequest = await prisma.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Validar permisos y transiciones de estado
    const isOwner = existingRequest.ownerId === session.user.id;
    const isClient = existingRequest.clientId === session.user.id;

    if (!isOwner && !isClient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentStatus = existingRequest.status;

    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED' || currentStatus === 'DECLINED') {
      return NextResponse.json(
        { error: 'No se puede modificar una solicitud finalizada' },
        { status: 400 }
      );
    }

    const requestInclude = {
      post: {
        include: {
          instrument: {
            include: {
              category: true,
              photos: {
                orderBy: { order: 'asc' as const },
                take: 1,
              },
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          lastName: true,
          image: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          lastName: true,
          image: true,
          email: true,
        },
      },
    };

    // Bilateral return confirmation: each party confirms independently;
    // completion is derived once both confirmations exist.
    if ('action' in validated && validated.action === 'CONFIRM_RETURN') {
      if (currentStatus !== 'ACCEPTED') {
        return NextResponse.json(
          { error: 'Solo se puede confirmar la devolución de una solicitud ACCEPTED' },
          { status: 400 }
        );
      }

      const myField = isOwner ? 'ownerReturnConfirmedAt' : 'clientReturnConfirmedAt';

      await prisma.$transaction(async (tx) => {
        await tx.request.updateMany({
          where: { id, status: 'ACCEPTED', [myField]: null },
          data: { [myField]: new Date() },
        });

        await tx.request.updateMany({
          where: {
            id,
            status: 'ACCEPTED',
            ownerReturnConfirmedAt: { not: null },
            clientReturnConfirmedAt: { not: null },
          },
          data: { status: 'COMPLETED' },
        });
      });

      const updatedRequest = await prisma.request.findUnique({
        where: { id },
        include: requestInclude,
      });

      return NextResponse.json(updatedRequest);
    }

    // Status transition branch (ACCEPTED/DECLINED/CANCELLED — no manual COMPLETED)
    const newStatus = (validated as { status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED' }).status;

    // Owner puede: ACCEPT, DECLINE
    if (isOwner) {
      if (currentStatus === 'REQUESTED' && (newStatus === 'ACCEPTED' || newStatus === 'DECLINED')) {
        // Permitido
      } else {
        return NextResponse.json(
          { error: 'Transición de estado no permitida para el propietario' },
          { status: 400 }
        );
      }
    }

    // Client puede: CANCEL (solo si está REQUESTED o ACCEPTED)
    if (isClient) {
      if ((currentStatus === 'REQUESTED' || currentStatus === 'ACCEPTED') && newStatus === 'CANCELLED') {
        // Permitido
      } else {
        return NextResponse.json(
          { error: 'Solo puedes cancelar una solicitud en estado REQUESTED o ACCEPTED' },
          { status: 400 }
        );
      }
    }

    // Actualizar la request
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status: newStatus,
      },
      include: requestInclude,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




