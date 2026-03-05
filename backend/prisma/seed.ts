import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Comida', type: 'EXPENSE', icon: 'fast-food' },
    { name: 'Transporte', type: 'EXPENSE', icon: 'bus' },
    { name: 'Salud', type: 'EXPENSE', icon: 'medical' },
    { name: 'Diversión', type: 'EXPENSE', icon: 'game-controller' },
    { name: 'Hogar', type: 'EXPENSE', icon: 'home' },
    { name: 'Sueldo', type: 'INCOME', icon: 'cash' },
    { name: 'Ahorro', type: 'INCOME', icon: 'wallet' },
    { name: 'Otros', type: 'EXPENSE', icon: 'ellipsis-horizontal' },
  ];

  console.log('🌱 Seed: Iniciando siembra de categorías...');

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy since we use name/type mostly or just create
      update: {},
      create: cat,
    });
  }

  // Better approach for seeding without fixed IDs: check existence by name
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type },
    });

    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }

  console.log('✅ Seed: Categorías sembradas con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
