import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getPublicLatLng } from '@/lib/privacy';
import { updatePostSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET: Obtener post público individual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        instrument: {
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
                // NO incluir contacto aquí (se revela solo si request está ACCEPTED)
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
            city: true,
            country: true,
            locationText: true,
            email: true,
            phone: true,
            whatsappUrl: true,
            lat: true,
            lng: true,
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

    // Tipo con relaciones incluidas (owner, instrument)
    const postWithRelations = post as typeof post & {
      owner: { id: string; name: string | null; lastName: string | null; image: string | null; locationText: string | null; email?: string; phone?: string; whatsappUrl?: string; city?: string | null; country?: string | null; lat?: number | null; lng?: number | null };
      instrument: { id: string; locations: Array<{ lat: number; lng: number; [key: string]: unknown }>; [key: string]: unknown };
    };

    // Verificar si el usuario es el dueño del post
    const session = await auth();
    const isOwner = session?.user?.id === postWithRelations.ownerId;

    // Si no es el dueño, solo mostrar posts APPROVED y no expirados
    if (!isOwner) {
      if (postWithRelations.status !== 'APPROVED' || postWithRelations.expiresAt <= now) {
        return NextResponse.json(
          { error: 'Post not available' },
          { status: 404 }
        );
      }
    }

    // Verificar si hay una request del usuario logueado para este post (cualquier estado)
    let userRequest = null;
    let acceptedRequest = null;
    let showContact = isOwner; // El owner siempre ve su propio contacto

    if (session?.user?.id && !isOwner) {
      // Buscar cualquier request del cliente para este post
      userRequest = await prisma.request.findFirst({
        where: {
          postId: postWithRelations.id,
          clientId: session.user.id,
        },
        orderBy: { createdAt: 'desc' }, // La más reciente
      });

      // Si hay una request ACCEPTED, mostrar contacto
      if (userRequest?.status === 'ACCEPTED') {
        acceptedRequest = userRequest;
        showContact = true;
      }
    }

    // Preparar datos del owner (con o sin contacto según corresponda)
    const owner = postWithRelations.owner;
    const ownerData: Record<string, unknown> = {
      id: owner.id,
      name: owner.name,
      lastName: owner.lastName,
      image: owner.image,
      locationText: owner.locationText,
    };

    // Si hay request aceptada o es el owner, incluir contacto y ubicación (ciudad/provincia/país)
    if (showContact) {
      ownerData.email = owner.email;
      ownerData.phone = owner.phone;
      ownerData.whatsappUrl = owner.whatsappUrl;
      ownerData.city = owner.city;
      ownerData.country = owner.country;
      if (owner.lat != null && owner.lng != null) {
        const jittered = getPublicLatLng(owner.lat, owner.lng);
        ownerData.lat = jittered.lat;
        ownerData.lng = jittered.lng;
      }
    }

    // Aplicar jitter a las coordenadas del instrumento
    const instrument = postWithRelations.instrument;
    const postWithJitter = {
      ...postWithRelations,
      ownerId: postWithRelations.ownerId,
      instrument: {
        ...instrument,
        locations: instrument.locations.map((loc: { lat: number; lng: number }) => {
          const jittered = getPublicLatLng(loc.lat, loc.lng);
          return { ...loc, lat: jittered.lat, lng: jittered.lng };
        }),
      },
      owner: ownerData,
      // Incluir información sobre la request aceptada
      acceptedRequest: acceptedRequest ? {
        id: acceptedRequest.id,
        status: acceptedRequest.status,
      } : null,
      // Incluir información sobre cualquier request del usuario (para mostrar estado)
      userRequest: userRequest ? {
        id: userRequest.id,
        status: userRequest.status,
        createdAt: userRequest.createdAt.toISOString(),
      } : null,
    };

    return NextResponse.json(postWithJitter);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar post (solo owner, solo status en MVP)
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

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updatePostSchema.parse(body);

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(validated.city && { city: validated.city }),
        ...(validated.country !== undefined && { country: validated.country }),
        ...(validated.areaText !== undefined && { areaText: validated.areaText }),
      },
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
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar post (solo owner)
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

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

