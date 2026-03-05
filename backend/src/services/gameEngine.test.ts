import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../config/db';
import * as gameEngine from './gameEngine.service';
import { hashPassword } from '../utils/password';

describe('GameEngine Service - Liquidation', () => {
  let userId: string;
  let categoryId: string;

  beforeEach(async () => {
    // Cleanup - Solo lo que pertenece al usuario de prueba o tablas de log
    // Evitar borrar 'category' si otros tests dependen del seed global
    await prisma.gameEventLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.castleState.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-engine-${Date.now()}@example.com`,
        passwordHash: await hashPassword('password123'),
        name: 'Engine Tester',
      },
    });
    userId = user.id;


    // The castle is automatically created via the trigger in auth.service/registerUser
    // but here we are using prisma.user.create directly. 
    // Wait, I should use auth.service to be consistent or create castle manually here.
    await prisma.castleState.create({
      data: {
        userId,
        hp: 100,
        maxHp: 100,
        level: 1,
        status: 'HEALTHY',
      },
    });

    const category = await prisma.category.create({
      data: {
        name: 'Comida',
        type: 'EXPENSE',
        icon: 'food',
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should damage castle if budget is exceeded', async () => {
    // 1. Set a budget of 100
    await prisma.budget.create({
      data: {
        userId,
        categoryId,
        limitAmount: 100,
        period: 'MONTHLY',
      },
    });

    // 2. Add an expense of 150 (exceeds by 50)
    await prisma.transaction.create({
      data: {
        userId,
        categoryId,
        amount: 150,
        type: 'EXPENSE',
        date: new Date(),
      },
    });

    // 3. Run liquidation
    const result = await gameEngine.liquidateUser(userId);

    expect(result.status).toBe('success');
    expect(result.totalDamage).toBeGreaterThan(0);

    // 4. Verify Castle state
    const castle = await prisma.castleState.findUnique({ where: { userId } });
    expect(castle?.hp).toBeLessThan(100);
    expect(castle?.status).toBe('UNDER_ATTACK');

    // 5. Verify Event Log
    const logs = await prisma.gameEventLog.findMany({ where: { userId } });
    expect(logs.length).toBe(1);
    expect(logs[0].hpImpact).toBeLessThan(0);
  });

  it('should heal castle if no budgets are exceeded', async () => {
    // 1. Lower castle HP manually
    await prisma.castleState.update({
      where: { userId },
      data: { hp: 50 },
    });

    // 2. Set a budget of 500
    await prisma.budget.create({
      data: {
        userId,
        categoryId,
        limitAmount: 500,
        period: 'MONTHLY',
      },
    });

    // 3. Add an expense of 100 (well within budget)
    await prisma.transaction.create({
      data: {
        userId,
        categoryId,
        amount: 100,
        type: 'EXPENSE',
        date: new Date(),
      },
    });

    // 4. Run liquidation
    await gameEngine.liquidateUser(userId);

    // 5. Verify Castle state (should heal)
    const castle = await prisma.castleState.findUnique({ where: { userId } });
    expect(castle?.hp).toBeGreaterThan(50);
    expect(castle?.status).toBe('HEALTHY');

    // 6. Verify Event Log
    const logs = await prisma.gameEventLog.findMany({ where: { userId } });
    expect(logs.some(l => l.hpImpact > 0)).toBe(true);
  });
});
