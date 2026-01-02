import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createRequestSchema } from '@/lib/validation';

// GET: Listar requests del usuario (enviadas o recibidas)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent' | 'received' | null (ambos)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);
    
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (type === 'sent') {
      where.clientId = session.user.id;
    } else if (type === 'received') {
      where.ownerId = session.user.id;
    } else {
      // Ambos: requests donde el usuario es owner o client
      where.OR = [
        { ownerId: session.user.id },
        { clientId: session.user.id },
      ];
    }

    // Obtener total de registros
    const total = await prisma.request.count({ where });

    const requests = await prisma.request.findMany({
      where,
      include: {
        post: {
          include: {
            instrument: {
              include: {
                category: true,
                photos: {
                  orderBy: { order: 'asc' },
                  take: 1,
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
              take: 1,
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
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: requests,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createRequestSchema.parse(body);

    // Verificar que el usuario tiene rol CLIENT
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes('CLIENT')) {
      return NextResponse.json(
        { error: 'Solo usuarios con rol CLIENT pueden enviar solicitudes' },
        { status: 403 }
      );
    }

    // Verificar que el post existe y está APPROVED
    const post = await prisma.post.findUnique({
      where: { id: validated.postId },
      include: {
        instrument: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'El post debe estar aprobado para recibir solicitudes' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no es el owner del post
    if (post.ownerId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes enviar una solicitud a tu propio post' },
        { status: 400 }
      );
    }

    // Verificar que no existe ya una request activa para este post del mismo cliente
    const existingRequest = await prisma.request.findFirst({
      where: {
        postId: validated.postId,
        clientId: session.user.id,
        status: {
          in: ['REQUESTED', 'ACCEPTED'], // Solo considerar requests activas
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud activa para este post' },
        { status: 400 }
      );
    }

    // Crear la request
    const newRequest = await prisma.request.create({
      data: {
        postId: validated.postId,
        instrumentId: post.instrumentId,
        ownerId: post.ownerId,
        clientId: session.user.id,
        fromDate: new Date(validated.fromDate),
        toDate: new Date(validated.toDate),
        message: validated.message,
        accessories: validated.accessories || null,
        status: 'REQUESTED',
      },
      include: {
        post: {
          include: {
            instrument: {
              include: {
                category: true,
                photos: {
                  orderBy: { order: 'asc' },
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
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


