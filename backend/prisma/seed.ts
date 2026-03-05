import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Comida', type: TransactionType.EXPENSE, icon: 'fast-food' },
    { name: 'Transporte', type: TransactionType.EXPENSE, icon: 'bus' },
    { name: 'Salud', type: TransactionType.EXPENSE, icon: 'medical' },
    { name: 'Diversión', type: TransactionType.EXPENSE, icon: 'game-controller' },
    { name: 'Hogar', type: TransactionType.EXPENSE, icon: 'home' },
    { name: 'Sueldo', type: TransactionType.INCOME, icon: 'cash' },
    { name: 'Ahorro', type: TransactionType.INCOME, icon: 'wallet' },
    { name: 'Otros', type: TransactionType.EXPENSE, icon: 'ellipsis-horizontal' },
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

  // 2. Sembrar items de la tienda
  const shopItems = [
    {
      id: 'e1d1b1a1-1111-4444-8888-999999999991',
      name: 'Torre de Vigilancia',
      price: 150,
      assetUrl: 'tower_wood.png',
      type: 'TOWER',
    },
    {
      id: 'e1d1b1a1-1111-4444-8888-999999999992',
      name: 'Puerta de Hierro',
      price: 300,
      assetUrl: 'gate_iron.png',
      type: 'GATE',
    },
    {
      id: 'e1d1b1a1-1111-4444-8888-999999999993',
      name: 'Muralla de Piedra',
      price: 500,
      assetUrl: 'wall_stone.png',
      type: 'WALL',
    },
    {
      id: 'e1d1b1a1-1111-4444-8888-999999999994',
      name: 'Torre de Magos',
      price: 1000,
      assetUrl: 'tower_magic.png',
      type: 'TOWER',
    },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed: Items de tienda sembrados.');
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
