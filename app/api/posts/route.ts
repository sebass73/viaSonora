import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPostSchema, searchPostsSchema } from '@/lib/validation';
import { getPublicLatLng } from '@/lib/privacy';

// GET: Listar posts públicos (APPROVED y no expirados) o mis posts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    
    const myPosts = searchParams.get('my') === 'true';
    
    // Si es "mis posts", requiere auth
    if (myPosts) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const posts = await prisma.post.findMany({
        where: { ownerId: session.user.id },
        include: {
          instrument: {
            include: {
              category: true,
              photos: {
                orderBy: { order: 'asc' },
                take: 1,
              },
              locations: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(posts);
    }

    // Posts públicos: solo APPROVED y no expirados
    const now = new Date();
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const categoryId = searchParams.get('categoryId');

    const where: any = {
      status: 'APPROVED',
      expiresAt: { gt: now },
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (categoryId) {
      where.instrument = {
        categoryId,
      };
    }

    if (search) {
      where.OR = [
        { instrument: { title: { contains: search, mode: 'insensitive' } } },
        { instrument: { description: { contains: search, mode: 'insensitive' } } },
        { instrument: { brand: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        instrument: {
          include: {
            category: true,
            photos: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            locations: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Límite para MVP
    });

    // Aplicar jitter a las coordenadas para proteger privacidad
    const postsWithJitter = posts.map((post) => {
      if (post.instrument.locations[0]) {
        const location = post.instrument.locations[0];
        const jittered = getPublicLatLng(location.lat, location.lng);
        return {
          ...post,
          instrument: {
            ...post.instrument,
            locations: [{
              ...location,
              lat: jittered.lat,
              lng: jittered.lng,
            }],
          },
        };
      }
      return post;
    });

    return NextResponse.json(postsWithJitter);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPostSchema.parse(body);

    // Verificar que el instrumento existe y pertenece al usuario
    const instrument = await prisma.instrument.findUnique({
      where: { id: validated.instrumentId },
      include: {
        locations: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!instrument) {
      return NextResponse.json(
        { error: 'Instrument not found' },
        { status: 404 }
      );
    }

    if (instrument.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verificar que tiene al menos una ubicación
    if (instrument.locations.length === 0) {
      return NextResponse.json(
        { error: 'Instrument must have at least one location' },
        { status: 400 }
      );
    }

    // Usar la ubicación primaria si no se especifica ciudad
    const location = instrument.locations[0];
    const postCity = validated.city || location.city;
    const postAreaText = validated.areaText || location.areaText;

    // Calcular fecha de expiración (30 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const post = await prisma.post.create({
      data: {
        instrumentId: validated.instrumentId,
        ownerId: session.user.id,
        city: postCity,
        areaText: postAreaText,
        status: 'PENDING_APPROVAL',
        expiresAt,
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

