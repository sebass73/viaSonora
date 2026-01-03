import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateInstrumentSchema, updateInstrumentAvailabilitySchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instrument = await prisma.instrument.findUnique({
      where: { id },
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
        owner: {
          select: {
            id: true,
            name: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    if (!instrument) {
      return NextResponse.json(
        { error: 'Instrument not found' },
        { status: 404 }
      );
    }

    // Solo el owner puede ver sus instrumentos
    if (instrument.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(instrument);
  } catch (error) {
    console.error('Error fetching instrument:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verificar ownership
    const existing = await prisma.instrument.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Instrument not found' },
        { status: 404 }
      );
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { photos, locations, availability, ...instrumentData } = body;
    
    const validated = updateInstrumentSchema.parse(instrumentData);
    
    // Validar disponibilidad si se proporciona
    if (availability && Array.isArray(availability)) {
      availability.forEach((avail: any) => {
        updateInstrumentAvailabilitySchema.parse([avail]);
      });
    }

    // Actualizar instrumento
    const updateData: any = { ...validated };
    
    // Si se envían fotos, reemplazar todas
    if (photos && Array.isArray(photos)) {
      // Eliminar fotos existentes
      await prisma.instrumentPhoto.deleteMany({
        where: { instrumentId: id },
      });
      // Crear nuevas fotos
      updateData.photos = {
        create: photos.map((url: string, index: number) => ({
          url,
          order: index,
        })),
      };
    }

    // Si se envían ubicaciones, reemplazar todas
    if (locations && Array.isArray(locations)) {
      // Eliminar ubicaciones existentes
      await prisma.instrumentLocation.deleteMany({
        where: { instrumentId: id },
      });
      // Crear nuevas ubicaciones
      updateData.locations = {
        create: locations.map((loc: any) => ({
          city: loc.city,
          areaText: loc.areaText,
          lat: loc.lat,
          lng: loc.lng,
          isPrimary: loc.isPrimary || false,
          useProfileLocation: Boolean(loc.useProfileLocation) || false,
        })),
      };
    }

    // Si se envía disponibilidad, reemplazar todas
    if (availability !== undefined) {
      // Eliminar disponibilidad existente
      await prisma.instrumentAvailability.deleteMany({
        where: { instrumentId: id },
      });
      // Crear nueva disponibilidad solo si hay elementos
      if (Array.isArray(availability) && availability.length > 0) {
        updateData.availability = {
          create: availability.map((avail: any) => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isAvailable: avail.isAvailable !== false,
          })),
        };
      }
    }

    const instrument = await prisma.instrument.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(instrument);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error updating instrument:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar ownership
    const existing = await prisma.instrument.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Instrument not found' },
        { status: 404 }
      );
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Eliminar (cascade eliminará fotos y ubicaciones)
    await prisma.instrument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instrument:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


