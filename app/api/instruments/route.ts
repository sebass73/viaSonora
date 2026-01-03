import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createInstrumentSchema, updateInstrumentAvailabilitySchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);
    
    const skip = (page - 1) * pageSize;

    // Obtener total de registros
    const total = await prisma.instrument.count({
      where: { ownerId: session.user.id },
    });

    const instruments = await prisma.instrument.findMany({
      where: { ownerId: session.user.id },
      include: {
        category: true,
        photos: {
          orderBy: { order: 'asc' },
        },
        locations: {
          where: { isPrimary: true },
          take: 1,
        },
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: instruments,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching instruments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { photos, locations, availability, ...instrumentData } = body;
    
    const validated = createInstrumentSchema.parse(instrumentData);
    
    // Validar disponibilidad si se proporciona
    if (availability && Array.isArray(availability)) {
      availability.forEach((avail: any) => {
        updateInstrumentAvailabilitySchema.parse([avail]);
      });
    }

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id: validated.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Crear instrumento con fotos y ubicaciones
    const instrument = await prisma.instrument.create({
      data: {
        ...validated,
        ownerId: session.user.id,
        photos: photos && Array.isArray(photos) ? {
          create: photos.map((url: string, index: number) => ({
            url,
            order: index,
          })),
        } : undefined,
        locations: locations && Array.isArray(locations) ? {
          create: locations.map((loc: any) => ({
            city: loc.city,
            areaText: loc.areaText,
            lat: loc.lat,
            lng: loc.lng,
            isPrimary: loc.isPrimary || false,
            useProfileLocation: Boolean(loc.useProfileLocation) || false,
          })),
        } : undefined,
        availability: availability && Array.isArray(availability) && availability.length > 0 ? {
          create: availability.map((avail: any) => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isAvailable: avail.isAvailable !== false,
          })),
        } : undefined,
      },
      include: {
        category: true,
        photos: {
          orderBy: { order: 'asc' },
        },
        locations: {
          orderBy: { isPrimary: 'desc' },
        },
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    return NextResponse.json(instrument, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error creating instrument:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


