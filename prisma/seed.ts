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
  const saxophoneCategory = await prisma.category.findUnique({ where: { slug: 'saxophone' } });

  if (!guitarCategory || !pianoCategory || !drumsCategory || !violinCategory || !saxophoneCategory) {
    throw new Error('Categories not found');
  }

  // Create demo user (owner)
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@viasonora.com' },
    update: {
      password: ownerPassword, // Update password if user already exists
    },
    create: {
      email: 'demo@viasonora.com',
      name: 'Juan',
      lastName: 'Músico',
      password: ownerPassword,
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
    // Guitarras
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800',
    'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800',
    // Pianos
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800',
    'https://images.unsplash.com/photo-1571974599782-87624638275c?w=800',
    // Baterías
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800',
    'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800',
    // Violines
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    // Saxofones
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    // Varios
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
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
          { url: placeholderImages[11], order: 0 },
          { url: placeholderImages[12], order: 1 },
          { url: placeholderImages[13], order: 2 },
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

  // Instrument 5: Saxofón en Buenos Aires
  const sax1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Saxofón Alto Yamaha YAS-280',
      description: 'Saxofón alto en perfecto estado. Ideal para estudiantes y profesionales. Incluye estuche y boquilla.',
      categoryId: saxophoneCategory.id,
      brand: 'Yamaha',
      model: 'YAS-280',
      condition: 'EXCELLENT',
      extras: 'Estuche rígido, boquilla, correa, paño de limpieza',
      photos: {
        create: [
          { url: placeholderImages[13], order: 0 },
          { url: placeholderImages[14], order: 1 },
          { url: placeholderImages[15], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Buenos Aires',
            areaText: 'Villa Crespo',
            lat: -34.5953,
            lng: -58.4378,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 6: Guitarra Eléctrica Les Paul
  const guitar3 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Eléctrica Epiphone Les Paul',
      description: 'Guitarra eléctrica Les Paul en excelente estado. Perfecta para rock y blues. Incluye amplificador pequeño.',
      categoryId: guitarCategory.id,
      brand: 'Epiphone',
      model: 'Les Paul Standard',
      condition: 'EXCELLENT',
      extras: 'Estuche, cable, amplificador pequeño, púas',
      photos: {
        create: [
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[3], order: 1 },
          { url: placeholderImages[0], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'La Plata',
            areaText: 'Centro',
            lat: -34.9215,
            lng: -57.9545,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 7: Piano Digital Kawai
  const piano3 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Piano Digital Kawai ES110',
      description: 'Piano digital portátil de 88 teclas. Ponderadas con tecnología AHA IV. Incluye pedal y soporte.',
      categoryId: pianoCategory.id,
      brand: 'Kawai',
      model: 'ES110',
      condition: 'GOOD',
      extras: 'Pedal, soporte plegable, manual, adaptador',
      photos: {
        create: [
          { url: placeholderImages[4], order: 0 },
          { url: placeholderImages[5], order: 1 },
          { url: placeholderImages[6], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Córdoba',
            areaText: 'Güemes',
            lat: -31.4201,
            lng: -64.1888,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 8: Batería Acústica DW
  const drums3 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Batería Acústica DW Performance',
      description: 'Batería profesional completa. Excelente estado. Ideal para estudios de grabación y conciertos.',
      categoryId: drumsCategory.id,
      brand: 'DW',
      model: 'Performance Series',
      condition: 'EXCELLENT',
      extras: 'Platillos Zildjian, baquetas, hardware completo, fundas',
      photos: {
        create: [
          { url: placeholderImages[7], order: 0 },
          { url: placeholderImages[8], order: 1 },
          { url: placeholderImages[9], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Buenos Aires',
            areaText: 'Belgrano',
            lat: -34.5639,
            lng: -58.4558,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 9: Violín Profesional
  const violin2 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Violín Profesional 4/4',
      description: 'Violín de nivel profesional. Sonido cálido y rico. Incluye arco profesional y estuche de calidad.',
      categoryId: violinCategory.id,
      brand: 'Yamaha',
      model: 'SV-250',
      condition: 'EXCELLENT',
      extras: 'Arco profesional, estuche rígido, resina, almohadilla de cuero',
      photos: {
        create: [
          { url: placeholderImages[12], order: 0 },
          { url: placeholderImages[11], order: 1 },
          { url: placeholderImages[13], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Mar del Plata',
            areaText: 'Centro',
            lat: -38.0055,
            lng: -57.5426,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 10: Saxofón Tenor
  const sax2 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Saxofón Tenor Selmer',
      description: 'Saxofón tenor profesional. Excelente para jazz y música clásica. En perfecto estado.',
      categoryId: saxophoneCategory.id,
      brand: 'Selmer',
      model: 'TS280',
      condition: 'GOOD',
      extras: 'Estuche, boquilla, correa, paño, grasa para corchos',
      photos: {
        create: [
          { url: placeholderImages[14], order: 0 },
          { url: placeholderImages[13], order: 1 },
          { url: placeholderImages[15], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Rosario',
            areaText: 'Pichincha',
            lat: -32.9442,
            lng: -60.6505,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 11: Guitarra Acústica Fender
  const guitar4 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Acústica Fender CD-60',
      description: 'Guitarra acústica económica pero de buena calidad. Perfecta para principiantes y viajeros.',
      categoryId: guitarCategory.id,
      brand: 'Fender',
      model: 'CD-60',
      condition: 'GOOD',
      extras: 'Estuche blando, cuerdas nuevas, púas',
      photos: {
        create: [
          { url: placeholderImages[1], order: 0 },
          { url: placeholderImages[0], order: 1 },
          { url: placeholderImages[3], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Tucumán',
            areaText: 'Centro',
            lat: -26.8083,
            lng: -65.2176,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 12: Piano Acústico Upright
  const piano4 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Piano Acústico Vertical',
      description: 'Piano acústico vertical en buen estado. Perfecto para estudios y escuelas de música.',
      categoryId: pianoCategory.id,
      brand: 'Yamaha',
      model: 'U1',
      condition: 'GOOD',
      extras: 'Banco ajustable, pedales funcionando',
      photos: {
        create: [
          { url: placeholderImages[6], order: 0 },
          { url: placeholderImages[4], order: 1 },
          { url: placeholderImages[5], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Córdoba',
            areaText: 'Villa Allende',
            lat: -31.2944,
            lng: -64.2954,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 13: Batería Electrónica
  const drums4 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Batería Electrónica Roland TD-17',
      description: 'Batería electrónica compacta. Perfecta para apartamentos y grabaciones. Incluye todo el hardware.',
      categoryId: drumsCategory.id,
      brand: 'Roland',
      model: 'TD-17KVX',
      condition: 'EXCELLENT',
      extras: 'Baquetas, manual, cables, soporte para pedales',
      photos: {
        create: [
          { url: placeholderImages[9], order: 0 },
          { url: placeholderImages[7], order: 1 },
          { url: placeholderImages[8], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Buenos Aires',
            areaText: 'Recoleta',
            lat: -34.5895,
            lng: -58.3974,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Instrument 14: Violonchelo
  const violin3 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Violonchelo 4/4',
      description: 'Violonchelo profesional en excelente estado. Incluye arco y estuche rígido.',
      categoryId: violinCategory.id,
      brand: 'Stentor',
      model: 'Cello',
      condition: 'GOOD',
      extras: 'Arco, estuche, resina, pica ajustable',
      photos: {
        create: [
          { url: placeholderImages[11], order: 0 },
          { url: placeholderImages[13], order: 1 },
          { url: placeholderImages[12], order: 2 },
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

  // Instrument 15: Guitarra Clásica
  const guitar5 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Clásica Alhambra',
      description: 'Guitarra clásica de cuerdas de nylon. Perfecta para música clásica y flamenco. Excelente estado.',
      categoryId: guitarCategory.id,
      brand: 'Alhambra',
      model: '5P',
      condition: 'EXCELLENT',
      extras: 'Estuche rígido, cuerdas nuevas, paño de limpieza',
      photos: {
        create: [
          { url: placeholderImages[3], order: 0 },
          { url: placeholderImages[2], order: 1 },
          { url: placeholderImages[1], order: 2 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Salta',
            areaText: 'Centro',
            lat: -24.7859,
            lng: -65.4117,
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

  // Posts con PENDING_APPROVAL (múltiples)
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

  await prisma.post.create({
    data: {
      instrumentId: sax1.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'Villa Crespo',
      status: 'PENDING_APPROVAL',
      expiresAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: guitar3.id,
      ownerId: demoUser.id,
      city: 'La Plata',
      areaText: 'Centro',
      status: 'PENDING_APPROVAL',
      expiresAt,
    },
  });

  // Posts con APPROVED (múltiples)
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

  await prisma.post.create({
    data: {
      instrumentId: piano3.id,
      ownerId: demoUser.id,
      city: 'Córdoba',
      areaText: 'Güemes',
      status: 'APPROVED',
      expiresAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: drums3.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'Belgrano',
      status: 'APPROVED',
      expiresAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: violin2.id,
      ownerId: demoUser.id,
      city: 'Mar del Plata',
      areaText: 'Centro',
      status: 'APPROVED',
      expiresAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: sax2.id,
      ownerId: demoUser.id,
      city: 'Rosario',
      areaText: 'Pichincha',
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
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[3], order: 1 },
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
          { url: placeholderImages[5], order: 0 },
          { url: placeholderImages[6], order: 1 },
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
          { url: placeholderImages[8], order: 0 },
          { url: placeholderImages[7], order: 1 },
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

  // Posts con REJECTED
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

  await prisma.post.create({
    data: {
      instrumentId: guitar4.id,
      ownerId: demoUser.id,
      city: 'Tucumán',
      areaText: 'Centro',
      status: 'REJECTED',
      expiresAt,
    },
  });

  // Posts con BANNED
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

  await prisma.post.create({
    data: {
      instrumentId: piano4.id,
      ownerId: demoUser.id,
      city: 'Córdoba',
      areaText: 'Villa Allende',
      status: 'BANNED',
      expiresAt,
    },
  });

  // Posts con EXPIRED
  await prisma.post.create({
    data: {
      instrumentId: drums2.id,
      ownerId: demoUser.id,
      city: 'Rosario',
      areaText: 'Norte',
      status: 'EXPIRED',
      expiresAt: expiredAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: drums4.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'Recoleta',
      status: 'EXPIRED',
      expiresAt: expiredAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: violin3.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      areaText: 'San Telmo',
      status: 'EXPIRED',
      expiresAt: expiredAt,
    },
  });

  await prisma.post.create({
    data: {
      instrumentId: guitar5.id,
      ownerId: demoUser.id,
      city: 'Salta',
      areaText: 'Centro',
      status: 'EXPIRED',
      expiresAt: expiredAt,
    },
  });

  console.log('✅ Posts created');

  // Create client user for requests
  const clientPassword = await bcrypt.hash('client123', 10);
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@viasonora.com' },
    update: {
      password: clientPassword, // Update password if user already exists
    },
    create: {
      email: 'client@viasonora.com',
      name: 'María',
      lastName: 'Viajera',
      password: clientPassword,
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
  console.log('\n📝 User credentials:');
  console.log('   Owner: demo@viasonora.com / Password: owner123');
  console.log('   Admin: admin@viasonora.com / Password: admin123');
  console.log('   Client: client@viasonora.com / Password: client123');
  console.log('\n📊 Created:');
  console.log(`   - ${categories.length} categories`);
  console.log('   - 1 demo user (OWNER + CLIENT)');
  console.log('   - 1 client user (CLIENT)');
  console.log('   - 1 admin user (ADMIN)');
  console.log('   - 15 instruments with photos and locations');
  console.log('   - 20 posts:');
  console.log('     • 5 PENDING_APPROVAL');
  console.log('     • 5 APPROVED');
  console.log('     • 2 REJECTED');
  console.log('     • 2 BANNED');
  console.log('     • 4 EXPIRED');
  console.log('   - 1 request (REQUESTED)');
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
