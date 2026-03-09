import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

describe('Notification Routes Integration', () => {
  let token: string;
  let userId: string;

  const testUser = {
    email: `notification-test-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Notification Tester',
  };

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    token = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    await prisma.notificationLog.createMany({
      data: [
        {
          userId,
          title: '⚠️ Presupuesto en riesgo: Comida',
          body: 'Vas al 82% de tu presupuesto.',
          type: 'ATTACK',
          status: 'SENT',
        },
        {
          userId,
          title: '🛡️ Tu reino prospera',
          body: 'Buen trabajo hoy.',
          type: 'REWARD',
          status: 'SENT',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.notificationLog.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('should list notifications for authenticated user', async () => {
    const response = await request(app)
      .get('/api/notifications?limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data[0]).toHaveProperty('title');
    expect(response.body.data[0]).toHaveProperty('createdAt');
  });

  it('should return 401 for unauthenticated request', async () => {
    const response = await request(app).get('/api/notifications');
    expect(response.status).toBe(401);
  });

  it('should validate limit query parameter', async () => {
    const response = await request(app)
      .get('/api/notifications?limit=500')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation Error');
  });
});
