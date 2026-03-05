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

  // eslint-disable-next-line no-console
  console.log('🌱 Seed: Iniciando siembra de categorías...');

  // Single idempotent loop: skip if already exists, create otherwise
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type },
    });

    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed: Categorías sembradas con éxito.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
