import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getPublicLatLng } from '@/lib/privacy';

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
            locationText: true,
            email: true,
            phone: true,
            whatsappUrl: true,
            addressText: true,
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

    // Verificar si el usuario es el dueño del post
    const session = await auth();
    const isOwner = session?.user?.id === post.ownerId;

    // Si no es el dueño, solo mostrar posts APPROVED y no expirados
    if (!isOwner) {
      if (post.status !== 'APPROVED' || post.expiresAt <= now) {
        return NextResponse.json(
          { error: 'Post not available' },
          { status: 404 }
        );
      }
    }

    // Verificar si hay una request ACCEPTED del usuario logueado para este post
    let acceptedRequest = null;
    let showContact = isOwner; // El owner siempre ve su propio contacto

    if (session?.user?.id && !isOwner) {
      acceptedRequest = await prisma.request.findFirst({
        where: {
          postId: post.id,
          clientId: session.user.id,
          status: 'ACCEPTED',
        },
      });
      showContact = !!acceptedRequest;
    }

    // Preparar datos del owner (con o sin contacto según corresponda)
    const ownerData: any = {
      id: post.owner.id,
      name: post.owner.name,
      lastName: post.owner.lastName,
      image: post.owner.image,
      locationText: post.owner.locationText,
    };

    // Si hay request aceptada o es el owner, incluir contacto
    if (showContact) {
      ownerData.email = post.owner.email;
      ownerData.phone = post.owner.phone;
      ownerData.whatsappUrl = post.owner.whatsappUrl;
      ownerData.addressText = post.owner.addressText;
      // Incluir ubicación aproximada (con jitter) si existe
      if (post.owner.lat && post.owner.lng) {
        const jittered = getPublicLatLng(post.owner.lat, post.owner.lng);
        ownerData.lat = jittered.lat;
        ownerData.lng = jittered.lng;
      }
    }

    // Aplicar jitter a las coordenadas del instrumento
    const postWithJitter = {
      ...post,
      instrument: {
        ...post.instrument,
        locations: post.instrument.locations.map((loc) => {
          const jittered = getPublicLatLng(loc.lat, loc.lng);
          return {
            ...loc,
            lat: jittered.lat,
            lng: jittered.lng,
          };
        }),
      },
      owner: ownerData,
      // Incluir información sobre la request aceptada
      acceptedRequest: acceptedRequest ? {
        id: acceptedRequest.id,
        status: acceptedRequest.status,
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
    // En MVP, solo permitir actualizar ciudad/areaText
    const { city, areaText } = body;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(city && { city }),
        ...(areaText !== undefined && { areaText }),
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

