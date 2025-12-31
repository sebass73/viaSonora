import { prisma } from '../lib/prisma';

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

  // Create posts with different statuses
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  // Post 1: APPROVED (will appear in map)
  await prisma.post.create({
    data: {
      instrumentId: guitar1.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'Palermo',
      status: 'APPROVED',
      expiresAt,
    },
  });

  // Post 2: APPROVED (will appear in map)
  await prisma.post.create({
    data: {
      instrumentId: piano1.id,
      ownerId: demoUser.id,
      city: 'Córdoba',
      areaText: 'Centro',
      status: 'APPROVED',
      expiresAt,
    },
  });

  // Post 3: PENDING_APPROVAL (won't appear in map)
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

  // Post 4: APPROVED (will appear in map)
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

  console.log('✅ Posts created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo user credentials:');
  console.log('   Email: demo@viasonora.com');
  console.log('   (Login with Google OAuth - you may need to create this email in Google)');
  console.log('\n📊 Created:');
  console.log(`   - ${categories.length} categories`);
  console.log('   - 1 demo user (OWNER + CLIENT)');
  console.log('   - 4 instruments with photos and locations');
  console.log('   - 4 posts (3 APPROVED, 1 PENDING_APPROVAL)');
  console.log('\n🗺️  Posts APPROVED will appear in the map!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
