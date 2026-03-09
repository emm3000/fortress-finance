import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../config/db';

describe('Dashboard Routes Integration', () => {
  let token: string;
  let userId: string;
  let outsiderUserId: string;
  let expenseCategoryId: string;
  let incomeCategoryId: string;

  const createdCategoryIds: string[] = [];

  const testUser = {
    email: `dashboard-test-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Dashboard Tester',
  };

  const outsiderUser = {
    email: `dashboard-outsider-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Outsider Tester',
  };

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    token = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    const outsiderRes = await request(app).post('/api/auth/register').send(outsiderUser);
    outsiderUserId = outsiderRes.body.data.user.id;

    const existingExpenseCategory = await prisma.category.findFirst({
      where: { type: 'EXPENSE' },
      select: { id: true },
    });

    const existingIncomeCategory = await prisma.category.findFirst({
      where: { type: 'INCOME' },
      select: { id: true },
    });

    if (!existingExpenseCategory) {
      const created = await prisma.category.create({
        data: {
          id: uuidv4(),
          name: `Test Expense ${Date.now().toString()}`,
          type: 'EXPENSE',
          icon: 'sword',
        },
        select: { id: true },
      });
      expenseCategoryId = created.id;
      createdCategoryIds.push(created.id);
    } else {
      expenseCategoryId = existingExpenseCategory.id;
    }

    if (!existingIncomeCategory) {
      const created = await prisma.category.create({
        data: {
          id: uuidv4(),
          name: `Test Income ${Date.now().toString()}`,
          type: 'INCOME',
          icon: 'coin',
        },
        select: { id: true },
      });
      incomeCategoryId = created.id;
      createdCategoryIds.push(created.id);
    } else {
      incomeCategoryId = existingIncomeCategory.id;
    }
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({
      where: {
        user: {
          email: { in: [testUser.email, outsiderUser.email] },
        },
      },
    });

    await prisma.user.deleteMany({ where: { email: { in: [testUser.email, outsiderUser.email] } } });

    if (createdCategoryIds.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    }
  });

  it('should return monthly totals and top expense categories for the authenticated user only', async () => {
    await prisma.transaction.createMany({
      data: [
        {
          id: uuidv4(),
          userId,
          categoryId: incomeCategoryId,
          amount: 500,
          type: 'INCOME',
          date: new Date('2026-03-02'),
          notes: 'salary',
        },
        {
          id: uuidv4(),
          userId,
          categoryId: expenseCategoryId,
          amount: 100,
          type: 'EXPENSE',
          date: new Date('2026-03-03'),
          notes: 'food',
        },
        {
          id: uuidv4(),
          userId,
          categoryId: expenseCategoryId,
          amount: 50,
          type: 'EXPENSE',
          date: new Date('2026-03-12'),
          notes: 'transport',
        },
        {
          id: uuidv4(),
          userId,
          categoryId: expenseCategoryId,
          amount: 999,
          type: 'EXPENSE',
          date: new Date('2026-03-15'),
          notes: 'deleted expense',
          deletedAt: new Date('2026-03-20'),
        },
        {
          id: uuidv4(),
          userId,
          categoryId: expenseCategoryId,
          amount: 200,
          type: 'EXPENSE',
          date: new Date('2026-02-20'),
          notes: 'outside month',
        },
        {
          id: uuidv4(),
          userId: outsiderUserId,
          categoryId: expenseCategoryId,
          amount: 999,
          type: 'EXPENSE',
          date: new Date('2026-03-10'),
          notes: 'outsider tx',
        },
      ],
    });

    const response = await request(app)
      .get('/api/dashboard/monthly?year=2026&month=3')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('period');
    expect(response.body.data).toHaveProperty('totals');
    expect(response.body.data).toHaveProperty('topExpenseCategories');

    expect(response.body.data.period.year).toBe(2026);
    expect(response.body.data.period.month).toBe(3);

    expect(response.body.data.totals.income).toBe(500);
    expect(response.body.data.totals.expense).toBe(150);
    expect(response.body.data.totals.balance).toBe(350);

    expect(Array.isArray(response.body.data.topExpenseCategories)).toBe(true);
    expect(response.body.data.topExpenseCategories.length).toBeGreaterThan(0);
    expect(response.body.data.topExpenseCategories[0].categoryId).toBe(expenseCategoryId);
    expect(response.body.data.topExpenseCategories[0].totalSpent).toBe(150);
    expect(response.body.data.topExpenseCategories[0].txCount).toBe(2);
  });

  it('should return 401 if token is missing', async () => {
    const response = await request(app).get('/api/dashboard/monthly?year=2026&month=3');
    expect(response.status).toBe(401);
  });

  it('should validate query params', async () => {
    const response = await request(app)
      .get('/api/dashboard/monthly?year=1999&month=13')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation Error');
  });
});
