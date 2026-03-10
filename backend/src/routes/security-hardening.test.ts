import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../config/db';

describe('Security Hardening Integration', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let categoryId: string;

  const user1 = {
    email: `sec-u1-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Security User 1',
  };

  const user2 = {
    email: `sec-u2-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Security User 2',
  };

  beforeAll(async () => {
    const user1Register = await request(app).post('/api/auth/register').send(user1);
    const user2Register = await request(app).post('/api/auth/register').send(user2);

    user1Token = user1Register.body.data.token;
    user2Token = user2Register.body.data.token;
    user1Id = user1Register.body.data.user.id;
    user2Id = user2Register.body.data.user.id;

    const category = await prisma.category.findFirst({ where: { type: 'EXPENSE' } });
    if (!category) {
      throw new Error('No expense category found for tests');
    }

    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [user1.email, user2.email],
        },
      },
    });
  });

  it('should block cross-user transaction overwrite attempts in sync', async () => {
    const transactionId = uuidv4();
    const createdAt = new Date().toISOString();

    const firstSync = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: transactionId,
            amount: 25,
            type: 'EXPENSE',
            categoryId,
            date: createdAt,
            notes: 'User1 transaction',
            updatedAt: createdAt,
            deletedAt: null,
          },
        ],
      });

    expect(firstSync.status).toBe(200);

    const attackAttempt = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: transactionId,
            amount: 999,
            type: 'EXPENSE',
            categoryId,
            date: createdAt,
            notes: 'Malicious overwrite',
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          },
        ],
      });

    expect(attackAttempt.status).toBe(403);

    const storedTransaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(storedTransaction?.userId).toBe(user1Id);
    expect(Number(storedTransaction?.amount)).toBe(25);
  });

  it('should block cross-user budget overwrite attempts in sync', async () => {
    const budgetId = uuidv4();
    const updatedAt = new Date().toISOString();

    const firstSync = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [],
        budgets: [
          {
            id: budgetId,
            categoryId,
            limitAmount: 120,
            period: 'MONTHLY',
            updatedAt,
          },
        ],
      });

    expect(firstSync.status).toBe(200);

    const attackAttempt = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [],
        budgets: [
          {
            id: budgetId,
            categoryId,
            limitAmount: 999,
            period: 'MONTHLY',
            updatedAt: new Date().toISOString(),
          },
        ],
      });

    expect(attackAttempt.status).toBe(403);

    const storedBudget = await prisma.budget.findUnique({ where: { id: budgetId } });
    expect(storedBudget?.userId).toBe(user1Id);
    expect(Number(storedBudget?.limitAmount)).toBe(120);
  });

  it('should only allow token unregistration for the token owner', async () => {
    const pushToken = 'ExponentPushToken[securityHardeningToken123]';

    const register = await request(app)
      .post('/api/notifications/register')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ token: pushToken });

    expect(register.status).toBe(200);

    const nonOwnerUnregister = await request(app)
      .post('/api/notifications/unregister')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ token: pushToken });

    expect(nonOwnerUnregister.status).toBe(200);

    const stillOwnedToken = await prisma.userPushToken.findUnique({
      where: { tokenString: pushToken },
    });

    expect(stillOwnedToken?.userId).toBe(user1Id);

    const ownerUnregister = await request(app)
      .post('/api/notifications/unregister')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ token: pushToken });

    expect(ownerUnregister.status).toBe(200);

    const deletedToken = await prisma.userPushToken.findUnique({
      where: { tokenString: pushToken },
    });

    expect(deletedToken).toBeNull();
  });

  it('should require authentication for token unregistration', async () => {
    const response = await request(app)
      .post('/api/notifications/unregister')
      .send({ token: 'ExponentPushToken[unauthorizedAttempt]' });

    expect(response.status).toBe(401);
  });

  it('should reject tokens for users that no longer exist', async () => {
    const disposableUser = {
      email: `security-disposable-${Date.now().toString()}@example.com`,
      password: 'password123',
      name: 'Disposable User',
    };

    const registerRes = await request(app).post('/api/auth/register').send(disposableUser);
    const deletedUserId = registerRes.body.data.user.id as string;
    const deletedUserToken = registerRes.body.data.token as string;

    await prisma.user.delete({ where: { id: deletedUserId } });

    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${deletedUserToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('No autorizado, token inválido o usuario inexistente');
  });

  it('sanity check: each test user has a distinct account', async () => {
    expect(user1Id).not.toBe(user2Id);
  });
});
