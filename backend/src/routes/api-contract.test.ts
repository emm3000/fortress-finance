import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

describe('API Contract', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'contract-test-' } },
    });
  });

  it('should return success envelope on health route', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).not.toHaveProperty('error');
    expect(response.body.data).toEqual({
      status: 'OK',
      message: 'Servicio en línea',
    });
  });

  it('should return success envelope for user registration', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: `contract-test-${Date.now().toString()}@example.com`,
      password: 'password123',
      name: 'Contract Tester',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body).not.toHaveProperty('error');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');
  });

  it('should return error envelope for validation failures', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: '123',
      name: '',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body).not.toHaveProperty('data');
    expect(response.body.error.message).toBe('Validation Error');
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it('should return error envelope for unauthorized routes', async () => {
    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body).not.toHaveProperty('data');
    expect(response.body.error.message).toContain('No autorizado');
  });

  it('should return error envelope for domain auth errors', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'contract-test-non-existent@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body).not.toHaveProperty('data');
    expect(response.body.error.message).toBe('Credenciales inválidas');
    expect(typeof response.body.error.code).toBe('string');
  });
});

