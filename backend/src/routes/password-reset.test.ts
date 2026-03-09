import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

describe('Password Reset Routes Integration', () => {
  const testUser = {
    email: `reset-test-${Date.now().toString()}@example.com`,
    password: 'password123',
    name: 'Reset Tester',
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send(testUser);
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { id: true },
    });

    if (user) {
      await prisma.$executeRaw`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}::uuid`;
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('should request password reset and return token in non-production', async () => {
    const response = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('Si el correo existe');
    expect(response.body.resetToken).toBeDefined();
  });

  it('should reset password with valid token and reject token reuse', async () => {
    const requestReset = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    const resetToken = requestReset.body.resetToken as string;

    const confirmResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'newPassword789' });

    expect(confirmResponse.status).toBe(200);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'newPassword789' });

    expect(loginResponse.status).toBe(200);

    const reuseResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'anotherPassword123' });

    expect(reuseResponse.status).toBe(400);
    expect(reuseResponse.body.error).toBe('Token inválido o expirado');
  });

  it('should reject expired or invalid token', async () => {
    const requestReset = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    const resetToken = requestReset.body.resetToken as string;
    const tokenHash = hashResetToken(resetToken);

    await prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET expires_at = NOW() - INTERVAL '5 minutes'
      WHERE token_hash = ${tokenHash}
    `;

    const expiredResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'expiredPassword123' });

    expect(expiredResponse.status).toBe(400);
    expect(expiredResponse.body.error).toBe('Token inválido o expirado');

    const invalidResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'totally-invalid-token', newPassword: 'whatever123' });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.error).toBe('Token inválido o expirado');
  });
});
