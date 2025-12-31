import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validation';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        image: true,
        phone: true,
        whatsappUrl: true,
        addressText: true,
        locationText: true,
        lat: true,
        lng: true,
        roles: true,
        staffRole: true,
        onboardingCompleted: true,
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Si acepta términos, actualizar termsAcceptedAt
    const updateData: any = { ...validated };
    if (validated.termsAccepted === true) {
      updateData.termsAcceptedAt = new Date();
      updateData.onboardingCompleted = true;
    }
    delete updateData.termsAccepted;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        image: true,
        phone: true,
        whatsappUrl: true,
        addressText: true,
        locationText: true,
        lat: true,
        lng: true,
        roles: true,
        staffRole: true,
        onboardingCompleted: true,
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

