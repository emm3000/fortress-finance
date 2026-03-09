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
});
