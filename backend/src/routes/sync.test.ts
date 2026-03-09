import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import { v4 as uuidv4 } from 'uuid';

describe('Sync Routes Integration', () => {
  let token: string;
  let categoryId: string;
  const testUser = {
    email: `sync-test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Sync Tester',
  };

  beforeAll(async () => {
    // 1. Registrar usuario y obtener token
    const authRes = await request(app).post('/api/auth/register').send(testUser);
    token = authRes.body.token;

    // 2. Obtener una categoría válida del seed
    const cat = await prisma.category.findFirst();
    categoryId = cat!.id;
  });

  afterAll(async () => {
    // Limpieza
    await prisma.transaction.deleteMany({ where: { user: { email: testUser.email } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  it('should synchronize transactions (PUSH)', async () => {
    const txId = uuidv4();
    const syncData = {
      lastSyncTimestamp: null,
      transactions: [
        {
          id: txId,
          amount: 50.5,
          type: 'EXPENSE',
          categoryId: categoryId,
          date: new Date().toISOString(),
          notes: 'Test sync logic',
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      ],
    };

    const response = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send(syncData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('syncTimestamp');

    // Verificar que se guardó en DB
    const savedTx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(savedTx).toBeDefined();
    expect(Number(savedTx?.amount)).toBe(50.5);
  });

  it('should pull changes from server (PULL)', async () => {
    // Simulamos que el cliente sincronizó hace 1 hora
    const anHourAgo = new Date(Date.now() - 3600000).toISOString();

    const response = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: anHourAgo,
        transactions: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.changes).toHaveProperty('transactions');
    expect(response.body.changes).toHaveProperty('budgets');
    expect(response.body.changes).toHaveProperty('castle');
    expect(Array.isArray(response.body.changes.transactions)).toBe(true);
    expect(response.body.changes.transactions.length).toBeGreaterThan(0); // Debería traer la TX del test anterior
  });

  it('should fail if unauthorized', async () => {
    const response = await request(app)
      .post('/api/sync')
      .send({ lastSyncTimestamp: null, transactions: [] });

    expect(response.status).toBe(401);
  });

  it('should fail validation for invalid transaction payload', async () => {
    const response = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: uuidv4(),
            amount: 'invalid-amount',
            type: 'EXPENSE',
            categoryId,
            date: 'invalid-date',
            notes: 'bad payload',
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });

  it('should synchronize soft-deleted transactions and return deletedAt on pull', async () => {
    const txId = uuidv4();
    const createdAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const deletedAt = new Date().toISOString();

    const firstSync = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 22.5,
            type: 'EXPENSE',
            categoryId,
            date: createdAt,
            notes: 'to delete',
            updatedAt: createdAt,
            deletedAt: null,
          },
        ],
      });

    expect(firstSync.status).toBe(200);

    const deleteSync = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 22.5,
            type: 'EXPENSE',
            categoryId,
            date: createdAt,
            notes: 'to delete',
            updatedAt: deletedAt,
            deletedAt,
          },
        ],
      });

    expect(deleteSync.status).toBe(200);

    const deletedTx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(deletedTx?.deletedAt).toBeTruthy();

    const pullDeleted = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: new Date(Date.now() - 60 * 1000).toISOString(),
        transactions: [],
      });

    expect(pullDeleted.status).toBe(200);
    interface PullTransaction {
      id: string;
      deletedAt: string | null;
    }
    const pulledTransactions = pullDeleted.body.changes.transactions as PullTransaction[];
    const pulledTx = pulledTransactions.find((tx) => tx.id === txId);
    expect(pulledTx).toBeDefined();
    expect(pulledTx.deletedAt).toBeTruthy();
  });

  it('should ignore incoming transaction updates older than server updatedAt', async () => {
    const txId = uuidv4();
    const newerTimestamp = new Date().toISOString();
    const olderTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 120,
            type: 'EXPENSE',
            categoryId,
            date: newerTimestamp,
            notes: 'newest state',
            updatedAt: newerTimestamp,
            deletedAt: null,
          },
        ],
      });

    const outdatedPush = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 40,
            type: 'EXPENSE',
            categoryId,
            date: olderTimestamp,
            notes: 'outdated state',
            updatedAt: olderTimestamp,
            deletedAt: null,
          },
        ],
      });

    expect(outdatedPush.status).toBe(200);

    const storedTx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(Number(storedTx?.amount)).toBe(120);
    expect(storedTx?.notes).toBe('newest state');
  });
});
