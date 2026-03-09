import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import { v4 as uuidv4 } from 'uuid';

describe('Sync Routes Integration', () => {
  let token: string;
  let userId: string;
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
    userId = authRes.body.user.id as string;

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

  it('should apply incoming transaction updates when updatedAt is exactly equal', async () => {
    const txId = uuidv4();
    const sameTimestamp = new Date().toISOString();

    await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 100,
            type: 'EXPENSE',
            categoryId,
            date: sameTimestamp,
            notes: 'first state',
            updatedAt: sameTimestamp,
            deletedAt: null,
          },
        ],
      });

    const tieUpdate = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 55,
            type: 'EXPENSE',
            categoryId,
            date: sameTimestamp,
            notes: 'tie state',
            updatedAt: sameTimestamp,
            deletedAt: null,
          },
        ],
      });

    expect(tieUpdate.status).toBe(200);

    const storedTx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(Number(storedTx?.amount)).toBe(55);
    expect(storedTx?.notes).toBe('tie state');
  });

  it('should ignore older budget/inventory updates and accept equal timestamp updates', async () => {
    const budgetId = uuidv4();
    const baseTimestamp = new Date();
    const baseIso = baseTimestamp.toISOString();
    const olderIso = new Date(baseTimestamp.getTime() - 60 * 1000).toISOString();
    const shopItem = await prisma.shopItem.findFirst();

    if (!shopItem) {
      throw new Error('No shop item found for inventory sync test');
    }

    const inventory = await prisma.userInventory.create({
      data: {
        userId,
        itemId: shopItem.id,
        isEquipped: false,
        updatedAt: baseTimestamp,
      },
    });

    const setupSync = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [],
        budgets: [
          {
            id: budgetId,
            categoryId,
            limitAmount: 200,
            period: 'MONTHLY',
            updatedAt: baseIso,
          },
        ],
      });

    expect(setupSync.status).toBe(200);

    const stalePush = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [],
        budgets: [
          {
            id: budgetId,
            categoryId,
            limitAmount: 50,
            period: 'MONTHLY',
            updatedAt: olderIso,
          },
        ],
        inventory: [
          {
            id: inventory.id,
            isEquipped: true,
            updatedAt: olderIso,
          },
        ],
      });

    expect(stalePush.status).toBe(200);

    const budgetAfterStale = await prisma.budget.findUnique({ where: { id: budgetId } });
    const inventoryAfterStale = await prisma.userInventory.findUnique({ where: { id: inventory.id } });
    expect(Number(budgetAfterStale?.limitAmount)).toBe(200);
    expect(inventoryAfterStale?.isEquipped).toBe(false);

    const tiePush = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [],
        budgets: [
          {
            id: budgetId,
            categoryId,
            limitAmount: 180,
            period: 'MONTHLY',
            updatedAt: baseIso,
          },
        ],
        inventory: [
          {
            id: inventory.id,
            isEquipped: true,
            updatedAt: baseIso,
          },
        ],
      });

    expect(tiePush.status).toBe(200);

    const budgetAfterTie = await prisma.budget.findUnique({ where: { id: budgetId } });
    const inventoryAfterTie = await prisma.userInventory.findUnique({ where: { id: inventory.id } });
    expect(Number(budgetAfterTie?.limitAmount)).toBe(180);
    expect(inventoryAfterTie?.isEquipped).toBe(true);
  });

  it('should recover and sync successfully after a previous failed sync attempt', async () => {
    const txId = uuidv4();
    const nowIso = new Date().toISOString();

    const failedAttempt = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 'invalid',
            type: 'EXPENSE',
            categoryId,
            date: 'invalid-date',
            notes: 'bad payload',
            updatedAt: nowIso,
            deletedAt: null,
          },
        ],
      });

    expect(failedAttempt.status).toBe(400);

    const recoveredAttempt = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: null,
        transactions: [
          {
            id: txId,
            amount: 77.25,
            type: 'EXPENSE',
            categoryId,
            date: nowIso,
            notes: 'recovered payload',
            updatedAt: nowIso,
            deletedAt: null,
          },
        ],
      });

    expect(recoveredAttempt.status).toBe(200);

    const storedTx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(storedTx).toBeDefined();
    expect(Number(storedTx?.amount)).toBe(77.25);
  });
});
