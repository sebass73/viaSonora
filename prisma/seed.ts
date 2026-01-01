import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = [
    {
      name: 'guitar',
      nameEs: 'Guitarra',
      nameIt: 'Chitarra',
      nameEn: 'Guitar',
      slug: 'guitar',
      description: 'Guitarras acústicas y eléctricas',
    },
    {
      name: 'piano',
      nameEs: 'Piano',
      nameIt: 'Pianoforte',
      nameEn: 'Piano',
      slug: 'piano',
      description: 'Pianos acústicos y digitales',
    },
    {
      name: 'drums',
      nameEs: 'Batería',
      nameIt: 'Batteria',
      nameEn: 'Drums',
      slug: 'drums',
      description: 'Baterías acústicas y electrónicas',
    },
    {
      name: 'violin',
      nameEs: 'Violín',
      nameIt: 'Violino',
      nameEn: 'Violin',
      slug: 'violin',
      description: 'Violines y instrumentos de cuerda',
    },
    {
      name: 'saxophone',
      nameEs: 'Saxofón',
      nameIt: 'Sassofono',
      nameEn: 'Saxophone',
      slug: 'saxophone',
      description: 'Saxofones y vientos',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categories created');

  // Get categories for use in instruments
  const guitarCategory = await prisma.category.findUnique({ where: { slug: 'guitar' } });
  const pianoCategory = await prisma.category.findUnique({ where: { slug: 'piano' } });
  const drumsCategory = await prisma.category.findUnique({ where: { slug: 'drums' } });
  const violinCategory = await prisma.category.findUnique({ where: { slug: 'violin' } });

  if (!guitarCategory || !pianoCategory || !drumsCategory || !violinCategory) {
    throw new Error('Categories not found');
  }

  // Create demo user (owner)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@viasonora.com' },
    update: {},
    create: {
      email: 'demo@viasonora.com',
      name: 'Juan',
      lastName: 'Músico',
      phone: '+54 9 11 1234-5678',
      whatsappUrl: 'https://wa.me/5491112345678',
      addressText: 'Av. Corrientes 1234',
      locationText: 'Palermo',
      lat: -34.5889,
      lng: -58.3974,
      roles: ['OWNER', 'CLIENT'],
      staffRole: 'NONE',
      onboardingCompleted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log('✅ Demo user created');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@viasonora.com' },
    update: {
      password: adminPassword, // Update password if user already exists
    },
    create: {
      email: 'admin@viasonora.com',
      name: 'Admin',
      lastName: 'ViaSonora',
      password: adminPassword,
      roles: ['OWNER', 'CLIENT'],
      staffRole: 'ADMIN',
      onboardingCompleted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log('✅ Admin user created');

  // Create instruments with photos and locations
  // Note: Using placeholder images. In production, these would be uploaded to Vercel Blob
  const placeholderImages = [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
  ];

  // Instrument 1: Guitarra en Buenos Aires
  const guitar1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Acústica Yamaha FG800',
      description: 'Hermosa guitarra acústica en excelente estado. Perfecta para viajeros. Incluye estuche rígido y cuerdas nuevas. Ideal para músicos que buscan calidad y portabilidad.',
      categoryId: guitarCategory.id,
      brand: 'Yamaha',
      model: 'FG800',
      condition: 'EXCELLENT',
      extras: 'Estuche rígido incluido, cuerdas nuevas, púa incluida',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
          { url: placeholderImages[2], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Buenos Aires',
            areaText: 'Palermo',
            lat: -34.5889,
            lng: -58.3974,
            isPrimary: true,
          },
          {
            city: 'Buenos Aires',
            areaText: 'San Telmo',
            lat: -34.6211,
            lng: -58.3731,
            isPrimary: false,
          },
        ],
      },
    },
  });

  // Instrument 2: Piano en Córdoba
  const piano1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Piano Digital Casio Privia PX-160',
      description: 'Piano digital compacto y ligero, perfecto para músicos viajeros. 88 teclas con acción martillo, sonido de alta calidad. Incluye pedal y soporte.',
      categoryId: pianoCategory.id,
      brand: 'Casio',
      model: 'Privia PX-160',
      condition: 'GOOD',
      extras: 'Pedal incluido, soporte plegable, cable de alimentación',
      photos: {
        create: [
          { url: placeholderImages[1], order: 0 },
          { url: placeholderImages[2], order: 1 },
          { url: placeholderImages[0], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Córdoba',
            areaText: 'Centro',
            lat: -31.4201,
            lng: -64.1888,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 3: Batería en Rosario
  const drums1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Batería Acústica Pearl Export',
      description: 'Batería completa en muy buen estado. Incluye todos los platillos, baquetas y hardware. Perfecta para ensayos y presentaciones.',
      categoryId: drumsCategory.id,
      brand: 'Pearl',
      model: 'Export',
      condition: 'GOOD',
      extras: 'Platillos incluidos (crash, ride, hi-hat), baquetas, hardware completo',
      photos: {
        create: [
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[0], order: 1 },
          { url: placeholderImages[1], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Rosario',
            areaText: 'Centro',
            lat: -32.9442,
            lng: -60.6505,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 4: Violín en Mendoza
  const violin1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Violín Clásico 4/4',
      description: 'Violín profesional en excelente estado. Incluye arco, estuche y resina. Perfecto para músicos clásicos y viajeros.',
      categoryId: violinCategory.id,
      brand: 'Stentor',
      model: 'Student II',
      condition: 'EXCELLENT',
      extras: 'Arco incluido, estuche rígido, resina, almohadilla',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
          { url: placeholderImages[2], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Mendoza',
            areaText: 'Centro',
            lat: -32.8895,
            lng: -68.8458,
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log('✅ Instruments created');

  // Limpiar posts existentes del demo user antes de crear nuevos
  await prisma.post.deleteMany({
    where: {
      ownerId: demoUser.id,
    },
  });

  // Create posts with different statuses
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() - 5); // 5 days ago (expired)

  // 3 Posts con PENDING_APPROVAL
  await prisma.post.create({
    data: {
      instrumentId: guitar1.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'Palermo',
      status: 'PENDING_APPROVAL',
      expiresAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: piano1.id,
      ownerId: demoUser.id,
      city: 'Córdoba',
      areaText: 'Centro',
      status: 'PENDING_APPROVAL',
      expiresAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: drums1.id,
      ownerId: demoUser.id,
      city: 'Rosario',
      areaText: 'Centro',
      status: 'PENDING_APPROVAL',
      expiresAt,
    },
  });

  // 1 Post con APPROVED
  await prisma.post.create({
    data: {
      instrumentId: violin1.id,
      ownerId: demoUser.id,
      city: 'Mendoza',
      areaText: 'Centro',
      status: 'APPROVED',
      expiresAt,
    },
  });

  // Crear instrumentos adicionales para los demás estados
  // Instrumento adicional para REJECTED
  const guitar2 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Eléctrica Fender Stratocaster',
      description: 'Guitarra eléctrica en buen estado. Ideal para conciertos y grabaciones.',
      categoryId: guitarCategory.id,
      brand: 'Fender',
      model: 'Stratocaster',
      condition: 'GOOD',
      extras: 'Cable incluido, estuche blando',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Buenos Aires',
            areaText: 'San Telmo',
            lat: -34.6211,
            lng: -58.3731,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // 1 Post con REJECTED
  await prisma.post.create({
    data: {
      instrumentId: guitar2.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'San Telmo',
      status: 'REJECTED',
      expiresAt,
    },
  });

  // Instrumento adicional para BANNED
  const piano2 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Piano Acústico Yamaha',
      description: 'Piano acústico de cola en excelente estado. Perfecto para estudios profesionales.',
      categoryId: pianoCategory.id,
      brand: 'Yamaha',
      model: 'C3',
      condition: 'EXCELLENT',
      extras: 'Banco incluido, pedales funcionando perfectamente',
      photos: {
        create: [
          { url: placeholderImages[1], order: 0 },
          { url: placeholderImages[2], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Córdoba',
            areaText: 'Nueva Córdoba',
            lat: -31.4201,
            lng: -64.1888,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // 1 Post con BANNED
  await prisma.post.create({
    data: {
      instrumentId: piano2.id,
      ownerId: demoUser.id,
      city: 'Córdoba',
      areaText: 'Nueva Córdoba',
      status: 'BANNED',
      expiresAt,
    },
  });

  // Instrumento adicional para EXPIRED
  const drums2 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Batería Acústica Tama',
      description: 'Batería completa con todos los platillos. En muy buen estado.',
      categoryId: drumsCategory.id,
      brand: 'Tama',
      model: 'Superstar',
      condition: 'GOOD',
      extras: 'Platillos incluidos, baquetas, fundas',
      photos: {
        create: [
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[0], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Rosario',
            areaText: 'Norte',
            lat: -32.9442,
            lng: -60.6505,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // 1 Post con EXPIRED
  await prisma.post.create({
    data: {
      instrumentId: drums2.id,
      ownerId: demoUser.id,
      city: 'Rosario',
      areaText: 'Norte',
      status: 'EXPIRED',
      expiresAt: expiredAt, // Fecha pasada para que esté expirado
    },
  });

  console.log('✅ Posts created');

  // Create client user for requests
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@viasonora.com' },
    update: {},
    create: {
      email: 'client@viasonora.com',
      name: 'María',
      lastName: 'Viajera',
      phone: '+54 9 11 9876-5432',
      whatsappUrl: 'https://wa.me/5491198765432',
      addressText: 'Av. Libertador 5678',
      locationText: 'Belgrano',
      lat: -34.5639,
      lng: -58.4558,
      roles: ['CLIENT'],
      staffRole: 'NONE',
      onboardingCompleted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log('✅ Client user created');

  // Get the APPROVED post (violin1)
  const approvedPost = await prisma.post.findFirst({
    where: {
      instrumentId: violin1.id,
      status: 'APPROVED',
    },
  });

  if (approvedPost) {
    // Create a REQUESTED request
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() + 5); // 5 days from now
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 7); // 7 days later

    await prisma.request.create({
      data: {
        postId: approvedPost.id,
        instrumentId: violin1.id,
        ownerId: demoUser.id,
        clientId: clientUser.id,
        fromDate,
        toDate,
        message: 'Necesito el violín para un concierto en Mendoza. ¿Está disponible para esas fechas?',
        accessories: 'Necesitaría también el arco y la resina si es posible.',
        status: 'REQUESTED',
      },
    });

    console.log('✅ Request created (REQUESTED)');
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo user credentials:');
  console.log('   Email: demo@viasonora.com');
  console.log('   (Login with Google OAuth - you may need to create this email in Google)');
  console.log('\n🔐 Admin user credentials:');
  console.log('   Email: admin@viasonora.com');
  console.log('   Password: admin123');
  console.log('\n📊 Created:');
  console.log(`   - ${categories.length} categories`);
  console.log('   - 1 demo user (OWNER + CLIENT)');
  console.log('   - 1 client user (CLIENT)');
  console.log('   - 1 admin user (ADMIN)');
  console.log('   - 7 instruments with photos and locations');
  console.log('   - 7 posts:');
  console.log('     • 3 PENDING_APPROVAL');
  console.log('     • 1 APPROVED');
  console.log('     • 1 REJECTED');
  console.log('     • 1 BANNED');
  console.log('     • 1 EXPIRED');
  console.log('   - 1 request (REQUESTED)');
  console.log('\n🗺️  Posts APPROVED will appear in the map!');
  console.log('\n👤 Client user credentials:');
  console.log('   Email: client@viasonora.com');
  console.log('   (Puedes crear este usuario con Google OAuth o email/password)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
