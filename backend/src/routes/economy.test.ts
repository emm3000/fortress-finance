import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../config/db';

describe('Economy Routes Integration', () => {
  let token: string;
  let userId: string;
  let cheaperItemId: string;
  let expensiveItemId: string;
  const createdItemIds: string[] = [];

  const testUser = {
    email: `eco-test-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Economy Tester',
  };

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    token = registerRes.body.token;
    userId = registerRes.body.user.id;

    const items = await prisma.shopItem.findMany({ orderBy: { price: 'asc' }, take: 2 });

    if (items.length < 2) {
      const fallbackItems = await prisma.$transaction([
        prisma.shopItem.create({
          data: {
            id: uuidv4(),
            name: `Test Item Cheap ${Date.now().toString()}`,
            price: 150,
            assetUrl: 'test_cheap.png',
            type: 'TEST',
          },
        }),
        prisma.shopItem.create({
          data: {
            id: uuidv4(),
            name: `Test Item Expensive ${Date.now().toString()}`,
            price: 300,
            assetUrl: 'test_expensive.png',
            type: 'TEST',
          },
        }),
      ]);

      cheaperItemId = fallbackItems[0].id;
      expensiveItemId = fallbackItems[1].id;
      createdItemIds.push(fallbackItems[0].id, fallbackItems[1].id);
    } else {
      cheaperItemId = items[0].id;
      expensiveItemId = items[1].id;
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });

    if (createdItemIds.length > 0) {
      await prisma.shopItem.deleteMany({ where: { id: { in: createdItemIds } } });
    }

    await prisma.$disconnect();
  });

  it('should allow only one purchase under concurrent requests when balance is insufficient for both', async () => {
    await prisma.userWallet.update({
      where: { userId },
      data: { goldBalance: 300 },
    });

    const purchaseCheap = request(app)
      .post('/api/economy/inventory/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: cheaperItemId });

    const purchaseExpensive = request(app)
      .post('/api/economy/inventory/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: expensiveItemId });

    const [resA, resB] = await Promise.all([purchaseCheap, purchaseExpensive]);

    const statuses = [resA.status, resB.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 400]);

    const wallet = await prisma.userWallet.findUnique({ where: { userId } });
    expect(wallet).toBeDefined();
    expect(wallet!.goldBalance).toBeGreaterThanOrEqual(0);

    const inventoryCount = await prisma.userInventory.count({ where: { userId } });
    expect(inventoryCount).toBe(1);
  });
});
