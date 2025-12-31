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

  // Create demo user (will be created via Auth.js on first login, but we can seed one)
  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

