import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

describe('Auth Routes Integration', () => {
  const upperUserEmail = `upper-${Date.now().toString()}@example.com`;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
  };

  afterAll(async () => {
    // Cleanup: remove test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, upperUserEmail],
        },
      },
    });
  });

  it('should register a new user successfully', async () => {
    const response = await request(app).post('/api/auth/register').send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.token).toBeDefined();
  });

  it('should normalize email to lowercase during registration', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: upperUserEmail.toUpperCase(),
      password: 'password123',
      name: 'Upper User',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(upperUserEmail);
  });

  it('should not register a user with the same email (409 Conflict)', async () => {
    const response = await request(app).post('/api/auth/register').send(testUser);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('El usuario ya existe');
  });

  it('should login successfully with correct credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  it('should login with uppercase variant of a registered email', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: testUser.email.toUpperCase(),
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  it('should return 401 for wrong password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Credenciales inválidas');
  });

  it('should fail validation for invalid email', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: '123',
      name: 'T',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation Error');
  });
});
