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
        instrument: {
          include: {
            availability: {
              orderBy: { dayOfWeek: 'asc' },
            },
          },
        },
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

    // Validar disponibilidad del instrumento (si está configurada)
    const availability = post.instrument.availability || [];
    if (availability.length > 0) {
      // Parsear las fechas recibidas (formato: YYYY-MM-DDTHH:mm:ss sin Z)
      // Esto preserva la fecha y hora local sin conversión UTC
      const fromDateStr = validated.fromDate;
      const toDateStr = validated.toDate;
      
      // Extraer fecha y hora del string (formato: YYYY-MM-DDTHH:mm:ss)
      const [fromDatePart, fromTimePart] = fromDateStr.split('T');
      const [toDatePart, toTimePart] = toDateStr.split('T');
      
      const [fromYear, fromMonth, fromDay] = fromDatePart.split('-').map(Number);
      const [fromHour, fromMin] = fromTimePart.split(':').map(Number);
      
      const [toYear, toMonth, toDay] = toDatePart.split('-').map(Number);
      const [toHour, toMin] = toTimePart.split(':').map(Number);

      // Crear fechas locales para validación (sin conversión UTC)
      const fromDateLocal = new Date(fromYear, fromMonth - 1, fromDay, fromHour, fromMin, 0, 0);
      const toDateLocal = new Date(toYear, toMonth - 1, toDay, toHour, toMin, 0, 0);

      // Validar cada día del rango
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const currentDate = new Date(fromDateLocal);
      currentDate.setHours(0, 0, 0, 0);
      const endDate = new Date(toDateLocal);
      endDate.setHours(23, 59, 59, 999);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
        
        if (!dayAvailability) {
          return NextResponse.json(
            { error: `El día ${days[dayOfWeek]} no está disponible para este instrumento` },
            { status: 400 }
          );
        }

        // Validar horas solo para el primer y último día
        const fromMinutes = fromHour * 60 + fromMin;
        const toMinutes = toHour * 60 + toMin;
        
        const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Si es el primer día, validar hora de inicio
        const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const fromDateStrCheck = `${fromYear}-${String(fromMonth).padStart(2, '0')}-${String(fromDay).padStart(2, '0')}`;
        
        if (currentDateStr === fromDateStrCheck) {
          if (fromMinutes < startMinutes || fromMinutes > endMinutes) {
            return NextResponse.json(
              { error: `La hora de inicio debe estar entre ${dayAvailability.startTime} y ${dayAvailability.endTime} para ${days[dayOfWeek]}` },
              { status: 400 }
            );
          }
        }

        // Si es el último día, validar hora de fin
        const toDateStrCheck = `${toYear}-${String(toMonth).padStart(2, '0')}-${String(toDay).padStart(2, '0')}`;
        if (currentDateStr === toDateStrCheck) {
          if (toMinutes < startMinutes || toMinutes > endMinutes) {
            return NextResponse.json(
              { error: `La hora de fin debe estar entre ${dayAvailability.startTime} y ${dayAvailability.endTime} para ${days[dayOfWeek]}` },
              { status: 400 }
            );
          }
        }

        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Parsear fechas para guardar en la base de datos
    // Las fechas vienen en formato YYYY-MM-DDTHH:mm:ss (sin Z)
    // Necesitamos convertirlas a Date objects para Prisma
    const [fromDatePart, fromTimePart] = validated.fromDate.split('T');
    const [toDatePart, toTimePart] = validated.toDate.split('T');
    const [fromYear, fromMonth, fromDay] = fromDatePart.split('-').map(Number);
    const [fromHour, fromMin] = fromTimePart.split(':').map(Number);
    const [toYear, toMonth, toDay] = toDatePart.split('-').map(Number);
    const [toHour, toMin] = toTimePart.split(':').map(Number);
    
    // Crear fechas en UTC para almacenar en la base de datos
    // Esto asegura que la fecha se almacene correctamente independientemente de la zona horaria del servidor
    const fromDateUTC = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay, fromHour, fromMin, 0, 0));
    const toDateUTC = new Date(Date.UTC(toYear, toMonth - 1, toDay, toHour, toMin, 0, 0));

    // Crear la request
    const newRequest = await prisma.request.create({
      data: {
        postId: validated.postId,
        instrumentId: post.instrumentId,
        ownerId: post.ownerId,
        clientId: session.user.id,
        fromDate: fromDateUTC,
        toDate: toDateUTC,
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


