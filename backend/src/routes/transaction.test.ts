import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../config/db';

describe('Transaction Routes Integration', () => {
  let ownerToken: string;
  let attackerToken: string;
  let ownerId: string;
  let categoryId: string;
  let transactionId: string;

  const owner = {
    email: `trx-owner-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Transaction Owner',
  };

  const attacker = {
    email: `trx-attacker-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Transaction Attacker',
  };

  beforeAll(async () => {
    const ownerRegister = await request(app).post('/api/auth/register').send(owner);
    const attackerRegister = await request(app).post('/api/auth/register').send(attacker);

    ownerToken = ownerRegister.body.token;
    attackerToken = attackerRegister.body.token;
    ownerId = ownerRegister.body.user.id;

    const category = await prisma.category.findFirst({ where: { type: 'EXPENSE' } });
    if (!category) {
      throw new Error('No expense category found for tests');
    }
    categoryId = category.id;

    transactionId = uuidv4();
    await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: transactionId,
            amount: 55.5,
            type: 'EXPENSE',
            categoryId,
            date: new Date().toISOString(),
            notes: 'Initial transaction',
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          },
        ],
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [owner.email, attacker.email],
        },
      },
    });
  });

  it('should update owned transaction', async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amount: 99.9,
        type: 'EXPENSE',
        categoryId,
        date: new Date().toISOString(),
        notes: 'Edited transaction',
      });

    expect(response.status).toBe(200);
    expect(Number(response.body.amount)).toBe(99.9);

    const stored = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(Number(stored?.amount ?? 0)).toBe(99.9);
    expect(stored?.notes).toBe('Edited transaction');
  });

  it('should block cross-user transaction update', async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({
        amount: 123,
        type: 'EXPENSE',
        categoryId,
        date: new Date().toISOString(),
        notes: 'Malicious edit',
      });

    expect(response.status).toBe(403);
  });

  it('should soft-delete owned transaction', async () => {
    const response = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Transacción eliminada');

    const stored = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(stored?.deletedAt).not.toBeNull();
    expect(stored?.userId).toBe(ownerId);
  });

  it('should return 401 when deleting without token', async () => {
    const response = await request(app).delete(`/api/transactions/${transactionId}`);
    expect(response.status).toBe(401);
  });
});
