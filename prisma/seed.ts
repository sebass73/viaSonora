import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Categorías fijas. La UI usa slug + i18n (messages/categories). nameEs/nameIt/nameEn ya no se usan.
  const categories = [
    { name: 'instrumentos', slug: 'instrumentos', description: 'Instrumentos musicales' },
    { name: 'amplificadores', slug: 'amplificadores', description: 'Amplificadores y cabezales' },
    { name: 'altavoces', slug: 'altavoces', description: 'Altavoces y cajas' },
    { name: 'accesorios', slug: 'accesorios', description: 'Accesorios y complementos' },
    { name: 'otro', slug: 'otro', description: 'Otros productos' },
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
  const instrumentosCategory = await prisma.category.findUnique({ where: { slug: 'instrumentos' } });
  const amplificadoresCategory = await prisma.category.findUnique({ where: { slug: 'amplificadores' } });
  const altavocesCategory = await prisma.category.findUnique({ where: { slug: 'altavoces' } });
  const accesoriosCategory = await prisma.category.findUnique({ where: { slug: 'accesorios' } });
  const otroCategory = await prisma.category.findUnique({ where: { slug: 'otro' } });

  if (!instrumentosCategory || !amplificadoresCategory || !altavocesCategory || !accesoriosCategory || !otroCategory) {
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
      city: 'Buenos Aires',
      country: 'Argentina',
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

  // Instrument 1: Guitarra en Buenos Aires - SIN disponibilidad (permite cualquier fecha/hora)
  const guitar1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Acústica Yamaha FG800',
      description: 'Hermosa guitarra acústica en excelente estado. Perfecta para viajeros. Incluye estuche rígido y cuerdas nuevas. Ideal para músicos que buscan calidad y portabilidad.',
      categoryId: instrumentosCategory.id,
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
      // SIN disponibilidad - permite cualquier fecha/hora
    },
  });

  // Instrument 2: Piano en Córdoba - CON disponibilidad: Todos los días 09:00-18:00
  const piano1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Piano Digital Casio Privia PX-160',
      description: 'Piano digital compacto y ligero, perfecto para músicos viajeros. 88 teclas con acción martillo, sonido de alta calidad. Incluye pedal y soporte.',
      categoryId: instrumentosCategory.id,
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
      availability: {
        create: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Domingo
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Lunes
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Martes
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Miércoles
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Jueves
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Viernes
          { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isAvailable: true }, // Sábado
        ],
      },
    },
  });

  // Instrument 3: Batería en Rosario - CON disponibilidad: Solo días laborables (Lun-Vie) 10:00-20:00
  const drums1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Batería Acústica Pearl Export',
      description: 'Batería completa en muy buen estado. Incluye todos los platillos, baquetas y hardware. Perfecta para ensayos y presentaciones.',
      categoryId: instrumentosCategory.id,
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
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '20:00', isAvailable: true }, // Lunes
          { dayOfWeek: 2, startTime: '10:00', endTime: '20:00', isAvailable: true }, // Martes
          { dayOfWeek: 3, startTime: '10:00', endTime: '20:00', isAvailable: true }, // Miércoles
          { dayOfWeek: 4, startTime: '10:00', endTime: '20:00', isAvailable: true }, // Jueves
          { dayOfWeek: 5, startTime: '10:00', endTime: '20:00', isAvailable: true }, // Viernes
        ],
      },
    },
  });

  // Instrument 4: Violín en Mendoza - CON disponibilidad: Solo fines de semana (Dom-Sáb) 14:00-22:00
  const violin1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Violín Clásico 4/4',
      description: 'Violín profesional en excelente estado. Incluye arco, estuche y resina. Perfecto para músicos clásicos y viajeros.',
      categoryId: instrumentosCategory.id,
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
      availability: {
        create: [
          { dayOfWeek: 0, startTime: '14:00', endTime: '22:00', isAvailable: true }, // Domingo
          { dayOfWeek: 6, startTime: '14:00', endTime: '22:00', isAvailable: true }, // Sábado
        ],
      },
    },
  });

  // Instrument 5: Saxofón en Buenos Aires - CON disponibilidad: Horarios diferentes por día
  const sax1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Saxofón Alto Yamaha YAS-280',
      description: 'Saxofón alto en perfecto estado. Ideal para estudiantes y profesionales. Incluye estuche y boquilla.',
      categoryId: instrumentosCategory.id,
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
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Lunes
          { dayOfWeek: 3, startTime: '14:00', endTime: '22:00', isAvailable: true }, // Miércoles
          { dayOfWeek: 5, startTime: '10:00', endTime: '18:00', isAvailable: true }, // Viernes
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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

  // Instrument 15: Guitarra Clásica - SIN disponibilidad
  const guitar5 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Guitarra Clásica Alhambra',
      description: 'Guitarra clásica de cuerdas de nylon. Perfecta para música clásica y flamenco. Excelente estado.',
      categoryId: instrumentosCategory.id,
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
      // SIN disponibilidad
    },
  });

  // Instrument 16: Piano Digital - CON disponibilidad: Lun-Vie 08:00-19:00 (horario extendido)
  const piano5 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Piano Digital Yamaha P-125',
      description: 'Piano digital portátil de 88 teclas. Perfecto para músicos que necesitan flexibilidad horaria.',
      categoryId: instrumentosCategory.id,
      brand: 'Yamaha',
      model: 'P-125',
      condition: 'EXCELLENT',
      extras: 'Pedal, soporte, manual, adaptador',
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
            city: 'Buenos Aires',
            areaText: 'Recoleta',
            lat: -34.5895,
            lng: -58.3974,
            isPrimary: true,
          },
        ],
      },
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isAvailable: true }, // Lunes
          { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isAvailable: true }, // Martes
          { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isAvailable: true }, // Miércoles
          { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isAvailable: true }, // Jueves
          { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isAvailable: true }, // Viernes
        ],
      },
    },
  });

  // Instrument 17: Batería Electrónica - CON disponibilidad: Solo Martes y Jueves 18:00-22:00
  const drums5 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Batería Electrónica Alesis Nitro',
      description: 'Batería electrónica compacta. Perfecta para apartamentos. Solo disponible en horarios nocturnos específicos.',
      categoryId: instrumentosCategory.id,
      brand: 'Alesis',
      model: 'Nitro Mesh',
      condition: 'GOOD',
      extras: 'Baquetas, manual, cables',
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
            areaText: 'Palermo',
            lat: -34.5889,
            lng: -58.3974,
            isPrimary: true,
          },
        ],
      },
      availability: {
        create: [
          { dayOfWeek: 2, startTime: '18:00', endTime: '22:00', isAvailable: true }, // Martes
          { dayOfWeek: 4, startTime: '18:00', endTime: '22:00', isAvailable: true }, // Jueves
        ],
      },
    },
  });

  // Instrument 18: Violín - CON disponibilidad: Todos los días 00:00-23:59 (disponible siempre)
  const violin4 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Violín Profesional Stradivarius Réplica',
      description: 'Violín de alta calidad, réplica de Stradivarius. Disponible en cualquier momento.',
      categoryId: instrumentosCategory.id,
      brand: 'Yamaha',
      model: 'SV-250',
      condition: 'EXCELLENT',
      extras: 'Arco profesional, estuche rígido, resina',
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
            city: 'Buenos Aires',
            areaText: 'Belgrano',
            lat: -34.5639,
            lng: -58.4558,
            isPrimary: true,
          },
        ],
      },
      availability: {
        create: [
          { dayOfWeek: 0, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Domingo
          { dayOfWeek: 1, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Lunes
          { dayOfWeek: 2, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Martes
          { dayOfWeek: 3, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Miércoles
          { dayOfWeek: 4, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Jueves
          { dayOfWeek: 5, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Viernes
          { dayOfWeek: 6, startTime: '00:00', endTime: '23:59', isAvailable: true }, // Sábado
        ],
      },
    },
  });

  // Categoría Amplificadores
  const amp1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Amplificador Fender Twin Reverb',
      description: 'Amplificador de guitarra válvulas, sonido clásico y limpio. Ideal para estudio y conciertos. En excelente estado.',
      categoryId: amplificadoresCategory.id,
      brand: 'Fender',
      model: 'Twin Reverb',
      condition: 'EXCELLENT',
      extras: 'Fundas, manual',
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
            areaText: 'Palermo',
            lat: -34.5819,
            lng: -58.4054,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Categoría Altavoces
  const speaker1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Caja amplificada JBL EON 612',
      description: 'Altavoz activo profesional. Potencia y claridad para voces e instrumentos. Perfecto para ensayos y eventos pequeños.',
      categoryId: altavocesCategory.id,
      brand: 'JBL',
      model: 'EON 612',
      condition: 'GOOD',
      extras: 'Cable XLR incluido',
      photos: {
        create: [
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[3], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Córdoba',
            areaText: 'Nueva Córdoba',
            lat: -31.4189,
            lng: -64.1878,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Categoría Accesorios
  const accesorio1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Pedalera multiefectos Boss GT-1000',
      description: 'Procesador de efectos profesional. Múltiples simulaciones de amplificador y efectos. Ideal para guitarra y bajo.',
      categoryId: accesoriosCategory.id,
      brand: 'Boss',
      model: 'GT-1000',
      condition: 'EXCELLENT',
      extras: 'Fuente, manual, bolso',
      photos: {
        create: [
          { url: placeholderImages[4], order: 0 },
          { url: placeholderImages[5], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Rosario',
            areaText: 'Centro',
            lat: -32.9466,
            lng: -60.6393,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Categoría Otro
  const otro1 = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Metrónomo digital Korg MA-2',
      description: 'Metrónomo compacto con salida de auriculares. Tempo ajustable y ritmos. Indispensable para estudio y práctica.',
      categoryId: otroCategory.id,
      brand: 'Korg',
      model: 'MA-2',
      condition: 'EXCELLENT',
      extras: 'Pila incluida',
      photos: {
        create: [
          { url: placeholderImages[6], order: 0 },
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

  // ——— Ejemplos internacionales: Roma, Londres, Arabia Saudita (varios idiomas) ———

  // Roma (italiano)
  const romaGuitar = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Chitarra classica Ramirez',
      description: 'Chitarra classica a corde di nylon. Perfetta per musica classica e flamenco. Ottime condizioni.',
      categoryId: instrumentosCategory.id,
      brand: 'Ramirez',
      model: '1a',
      condition: 'EXCELLENT',
      extras: 'Custodia rigida, corde nuove',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Roma',
            areaText: 'Trastevere',
            lat: 41.8897,
            lng: 12.4696,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const romaPiano = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Pianoforte digitale Yamaha P-45',
      description: 'Pianoforte digitale portatile, 88 tasti. Ideale per musicisti in viaggio. Include pedale e supporto.',
      categoryId: instrumentosCategory.id,
      brand: 'Yamaha',
      model: 'P-45',
      condition: 'GOOD',
      extras: 'Pedale, supporto pieghevole',
      photos: {
        create: [
          { url: placeholderImages[4], order: 0 },
          { url: placeholderImages[5], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Roma',
            areaText: 'Centro Storico',
            lat: 41.9028,
            lng: 12.4964,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const romaAmp = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Amplificatore valvolare Fender Deluxe',
      description: 'Amplificatore per chitarra, suono vintage. Perfetto per studio e concerti. Eccellente stato.',
      categoryId: amplificadoresCategory.id,
      brand: 'Fender',
      model: 'Deluxe Reverb',
      condition: 'EXCELLENT',
      extras: 'Manuale, copertura',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Roma',
            areaText: 'Testaccio',
            lat: 41.8762,
            lng: 12.4766,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Londres (inglés)
  const londonGuitar = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Acoustic Guitar Martin D-28',
      description: 'Vintage-style acoustic guitar. Perfect for fingerpicking and folk. Excellent condition, hard case included.',
      categoryId: instrumentosCategory.id,
      brand: 'Martin',
      model: 'D-28',
      condition: 'EXCELLENT',
      extras: 'Hard case, spare strings, capo',
      photos: {
        create: [
          { url: placeholderImages[1], order: 0 },
          { url: placeholderImages[2], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'London',
            areaText: 'Shoreditch',
            lat: 51.5255,
            lng: -0.0754,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const londonDrums = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Drum kit Ludwig Classic Maple',
      description: 'Full acoustic drum set. Cymbals and hardware included. Great for rehearsals and small gigs.',
      categoryId: instrumentosCategory.id,
      brand: 'Ludwig',
      model: 'Classic Maple',
      condition: 'GOOD',
      extras: 'Cymbals, sticks, throne',
      photos: {
        create: [
          { url: placeholderImages[7], order: 0 },
          { url: placeholderImages[8], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'London',
            areaText: 'Camden',
            lat: 51.5390,
            lng: -0.1426,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const londonSpeaker = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'PA Speaker QSC K12',
      description: 'Active powered speaker. Clear sound for vocals and instruments. Ideal for small venues.',
      categoryId: altavocesCategory.id,
      brand: 'QSC',
      model: 'K12',
      condition: 'EXCELLENT',
      extras: 'XLR cable, cover',
      photos: {
        create: [
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[3], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'London',
            areaText: 'Soho',
            lat: 51.5115,
            lng: -0.1344,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Arabia Saudita — Riad (inglés)
  const riyadhGuitar = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Electric Guitar Gibson Les Paul',
      description: 'Les Paul Standard in great condition. Perfect for rock and blues. Comes with case and cable.',
      categoryId: instrumentosCategory.id,
      brand: 'Gibson',
      model: 'Les Paul Standard',
      condition: 'EXCELLENT',
      extras: 'Case, cable, picks',
      photos: {
        create: [
          { url: placeholderImages[2], order: 0 },
          { url: placeholderImages[3], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Riyadh',
            areaText: 'Al Olaya',
            lat: 24.6877,
            lng: 46.7219,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const riyadhKeyboard = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Keyboard Roland Juno-DS',
      description: '61-key synthesizer. Multiple sounds and rhythms. Ideal for bands and solo performers.',
      categoryId: instrumentosCategory.id,
      brand: 'Roland',
      model: 'Juno-DS61',
      condition: 'GOOD',
      extras: 'Power adapter, manual',
      photos: {
        create: [
          { url: placeholderImages[4], order: 0 },
          { url: placeholderImages[5], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Riyadh',
            areaText: 'Al Malaz',
            lat: 24.6533,
            lng: 46.7222,
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Arabia Saudita — Jeddah (árabe en título/descripción para variedad)
  const jeddahOud = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'عود تقليدي - Traditional Oud',
      description: 'Traditional Arabic oud in excellent condition. Rich sound, perfect for classical and folk. Case and picks included.',
      categoryId: instrumentosCategory.id,
      brand: 'Unknown',
      model: 'Traditional',
      condition: 'EXCELLENT',
      extras: 'Case, risha (pick), tuner',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Jeddah',
            areaText: 'Al Hamra',
            lat: 21.5433,
            lng: 39.1728,
            isPrimary: true,
          },
        ],
      },
    },
  });

  const jeddahAmp = await prisma.instrument.create({
    data: {
      ownerId: demoUser.id,
      title: 'Bass Amplifier Ampeg BA-210',
      description: 'Combo bass amp. 2x10 speakers, 450W. Great for rehearsals and small gigs. Good condition.',
      categoryId: amplificadoresCategory.id,
      brand: 'Ampeg',
      model: 'BA-210',
      condition: 'GOOD',
      extras: 'Cover, manual',
      photos: {
        create: [
          { url: placeholderImages[0], order: 0 },
          { url: placeholderImages[1], order: 1 },
        ],
      },
      locations: {
        create: [
          {
            city: 'Jeddah',
            areaText: 'Al Rawdah',
            lat: 21.4885,
            lng: 39.2312,
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
      areaText: 'Pichincha',
      status: 'APPROVED',
      expiresAt,
    },
  });

  // Posts APPROVED para otras categorías (Amplificadores, Altavoces, Accesorios, Otro)
  await prisma.post.create({
    data: {
      instrumentId: amp1.id,
      ownerId: demoUser.id,
      city: 'Buenos Aires',
      country: 'Argentina',
      areaText: 'Palermo',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: speaker1.id,
      ownerId: demoUser.id,
      city: 'Córdoba',
      country: 'Argentina',
      areaText: 'Nueva Córdoba',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: accesorio1.id,
      ownerId: demoUser.id,
      city: 'Rosario',
      country: 'Argentina',
      areaText: 'Centro',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: otro1.id,
      ownerId: demoUser.id,
      city: 'Mendoza',
      country: 'Argentina',
      areaText: 'Centro',
      status: 'APPROVED',
      expiresAt,
    },
  });

  // Posts APPROVED — Roma, Londres, Arabia Saudita (internacional)
  await prisma.post.create({
    data: {
      instrumentId: romaGuitar.id,
      ownerId: demoUser.id,
      city: 'Roma',
      country: 'Italy',
      areaText: 'Trastevere',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: romaPiano.id,
      ownerId: demoUser.id,
      city: 'Roma',
      country: 'Italy',
      areaText: 'Centro Storico',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: romaAmp.id,
      ownerId: demoUser.id,
      city: 'Roma',
      country: 'Italy',
      areaText: 'Testaccio',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: londonGuitar.id,
      ownerId: demoUser.id,
      city: 'London',
      country: 'United Kingdom',
      areaText: 'Shoreditch',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: londonDrums.id,
      ownerId: demoUser.id,
      city: 'London',
      country: 'United Kingdom',
      areaText: 'Camden',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: londonSpeaker.id,
      ownerId: demoUser.id,
      city: 'London',
      country: 'United Kingdom',
      areaText: 'Soho',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: riyadhGuitar.id,
      ownerId: demoUser.id,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      areaText: 'Al Olaya',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: riyadhKeyboard.id,
      ownerId: demoUser.id,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      areaText: 'Al Malaz',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: jeddahOud.id,
      ownerId: demoUser.id,
      city: 'Jeddah',
      country: 'Saudi Arabia',
      areaText: 'Al Hamra',
      status: 'APPROVED',
      expiresAt,
    },
  });
  await prisma.post.create({
    data: {
      instrumentId: jeddahAmp.id,
      ownerId: demoUser.id,
      city: 'Jeddah',
      country: 'Saudi Arabia',
      areaText: 'Al Rawdah',
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      categoryId: instrumentosCategory.id,
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      country: 'Argentina',
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
      city: 'Buenos Aires',
      country: 'Argentina',
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

  // Create some reports for testing
  const reportPost = await prisma.post.findFirst({
    where: {
      status: 'APPROVED',
      ownerId: demoUser.id,
    },
  });

  if (reportPost && clientUser) {
    // Create a PENDING report
    await prisma.postReport.create({
      data: {
        postId: reportPost.id,
        reporterId: clientUser.id,
        reason: 'SPAM',
        comment: 'Este post parece ser spam o contenido duplicado.',
        status: 'PENDING',
      },
    });

    // Create a RESOLVED report (need another approved post)
    const reportPost2 = await prisma.post.findFirst({
      where: {
        status: 'APPROVED',
        ownerId: demoUser.id,
        id: { not: reportPost.id },
      },
    });

    if (reportPost2) {
      await prisma.postReport.create({
        data: {
          postId: reportPost2.id,
          reporterId: clientUser.id,
          reason: 'INAPPROPRIATE',
          comment: 'Contenido inapropiado detectado.',
          status: 'RESOLVED',
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
        },
      });
    }

    console.log('✅ Reports created (PENDING and RESOLVED)');
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
  console.log('   - 28 instruments with photos and locations (incl. Roma, London, Riyadh, Jeddah)');
  console.log('   - Disponibilidad configurada:');
  console.log('     • SIN disponibilidad: guitar1, guitar5 (permite cualquier fecha/hora)');
  console.log('     • Todos los días 09:00-18:00: piano1');
  console.log('     • Solo Lun-Vie 10:00-20:00: drums1');
  console.log('     • Solo Dom-Sáb 14:00-22:00: violin1');
  console.log('     • Horarios diferentes por día: sax1 (Lun 09-17, Mié 14-22, Vie 10-18)');
  console.log('     • Lun-Vie 08:00-19:00: piano5');
  console.log('     • Solo Mar-Jue 18:00-22:00: drums5');
  console.log('     • Todos los días 00:00-23:59: violin4');
  console.log('   - 30 posts:');
  console.log('     • 5 PENDING_APPROVAL');
  console.log('     • 15 APPROVED (incl. Roma, London, Riyadh, Jeddah)');
  console.log('     • 2 REJECTED');
  console.log('     • 2 BANNED');
  console.log('     • 4 EXPIRED');
  console.log('   - 1 request (REQUESTED)');
  console.log('   - 2 reportes (1 PENDING, 1 RESOLVED)');
  console.log('\n🗺️  Posts APPROVED will appear in the map!');
  console.log('\n🧪 Para testing:');
  console.log('   - Ver GUIA_TESTS_MANUALES.md para guía completa de tests de disponibilidad');
  console.log('   - Ver GUIA_TESTS_REPORTES.md para guía completa de tests de reportes');
  console.log('   - Instrumentos con diferentes disponibilidades listos para probar');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
