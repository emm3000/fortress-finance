import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

describe('Category Routes Integration', () => {
  let token: string;
  const testUser = {
    email: `cat-test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Category Tester',
  };

  beforeAll(async () => {
    // Registrar usuario y obtener token
    const response = await request(app).post('/api/auth/register').send(testUser);
    token = response.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  it('should get all categories if authenticated', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('type');
    expect(response.body[0]).toHaveProperty('icon');
  });

  it('should fail if no token provided', async () => {
    const response = await request(app).get('/api/categories');
    expect(response.status).toBe(401);
  });
});
