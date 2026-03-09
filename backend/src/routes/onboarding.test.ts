import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

describe('Onboarding Routes Integration', () => {
  let token: string;
  let userId: string;

  const testUser = {
    email: `onboarding-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Onboarding Tester',
  };

  beforeAll(async () => {
    const registerResponse = await request(app).post('/api/auth/register').send(testUser);
    token = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('should save onboarding preferences for authenticated user', async () => {
    const response = await request(app)
      .post('/api/onboarding/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currency: 'usd',
        monthlyIncomeGoal: 3500.5,
      });

    expect(response.status).toBe(200);
    expect(response.body.currency).toBe('USD');
    expect(Number(response.body.monthlyIncomeGoal)).toBe(3500.5);

    const stored = await prisma.userPreference.findUnique({ where: { userId } });
    expect(stored).not.toBeNull();
    expect(stored?.currency).toBe('USD');
    expect(Number(stored?.monthlyIncomeGoal ?? 0)).toBe(3500.5);

    const initialCategories = await prisma.userInitialCategory.findMany({
      where: { userId },
    });
    expect(initialCategories.length).toBeGreaterThan(0);
  });

  it('should not duplicate initial categories on subsequent updates', async () => {
    const firstCount = await prisma.userInitialCategory.count({ where: { userId } });

    const response = await request(app)
      .post('/api/onboarding/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currency: 'EUR',
        monthlyIncomeGoal: 4200,
      });

    expect(response.status).toBe(200);

    const secondCount = await prisma.userInitialCategory.count({ where: { userId } });
    expect(secondCount).toBe(firstCount);
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app).post('/api/onboarding/preferences').send({
      currency: 'USD',
      monthlyIncomeGoal: 3000,
    });

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid payload', async () => {
    const response = await request(app)
      .post('/api/onboarding/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currency: 'US',
        monthlyIncomeGoal: -10,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });
});
