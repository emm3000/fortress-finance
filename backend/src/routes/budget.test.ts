import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../config/db';

describe('Budget Routes Integration', () => {
  let token: string;
  let userId: string;
  let expenseCategoryId: string;

  const testUser = {
    email: `budget-test-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Budget Tester',
  };

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    token = registerRes.body.token;
    userId = registerRes.body.user.id;

    const expenseCategory = await prisma.category.findFirst({
      where: { type: 'EXPENSE' },
      select: { id: true },
    });

    if (!expenseCategory) {
      throw new Error('No expense category found for tests');
    }

    expenseCategoryId = expenseCategory.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('should create and update a budget for the same category', async () => {
    const createRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: expenseCategoryId,
        limitAmount: 500,
        period: 'MONTHLY',
      });

    expect(createRes.status).toBe(200);
    expect(Number(createRes.body.limitAmount)).toBe(500);

    const updateRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: expenseCategoryId,
        limitAmount: 700,
        period: 'MONTHLY',
      });

    expect(updateRes.status).toBe(200);
    expect(Number(updateRes.body.limitAmount)).toBe(700);

    const listRes = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
    expect(Number(listRes.body[0].limitAmount)).toBe(700);
  });

  it('should expose budget progress inputs through monthly dashboard totals', async () => {
    const now = new Date();
    const monthStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 2));

    await prisma.transaction.createMany({
      data: [
        {
          id: uuidv4(),
          userId,
          categoryId: expenseCategoryId,
          amount: 200,
          type: 'EXPENSE',
          date: monthStartDate,
          notes: 'budget-progress-1',
        },
        {
          id: uuidv4(),
          userId,
          categoryId: expenseCategoryId,
          amount: 150,
          type: 'EXPENSE',
          date: new Date(monthStartDate.getTime() + 24 * 60 * 60 * 1000),
          notes: 'budget-progress-2',
        },
      ],
    });

    const dashboardRes = await request(app)
      .get(`/api/dashboard/monthly?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.totals.expense).toBeGreaterThanOrEqual(350);

    interface TopExpenseCategory {
      categoryId: string;
      totalSpent: number;
    }

    const topExpenseCategories = dashboardRes.body.topExpenseCategories as TopExpenseCategory[];
    const topCategory = topExpenseCategories.find((item) => item.categoryId === expenseCategoryId);

    expect(topCategory).toBeDefined();
    expect(topCategory.totalSpent).toBeGreaterThanOrEqual(350);
  });
});
