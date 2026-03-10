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
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('should request password reset and return token in non-production', async () => {
    const response = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    expect(response.status).toBe(200);
    expect(response.body.data.message).toContain('Si el correo existe');
    expect(response.body.data.resetToken).toBeDefined();
  });

  it('should reset password with valid token and reject token reuse', async () => {
    const requestReset = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    const resetToken = requestReset.body.data.resetToken as string;

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
    expect(reuseResponse.body.error.message).toBe('Token inválido o expirado');
  });

  it('should reject expired or invalid token', async () => {
    const requestReset = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    const resetToken = requestReset.body.data.resetToken as string;
    const tokenHash = hashResetToken(resetToken);

    await prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    const expiredResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'expiredPassword123' });

    expect(expiredResponse.status).toBe(400);
    expect(expiredResponse.body.error.message).toBe('Token inválido o expirado');

    const invalidResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'totally-invalid-token', newPassword: 'whatever123' });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.error.message).toBe('Token inválido o expirado');
  });

  it('should invalidate previously issued access tokens after password reset', async () => {
    const loginBeforeReset = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'newPassword789' });

    expect(loginBeforeReset.status).toBe(200);
    const staleAccessToken = loginBeforeReset.body.data.token as string;

    const requestReset = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: testUser.email });

    const resetToken = requestReset.body.data.resetToken as string;

    const confirmResponse = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'newPassword999' });

    expect(confirmResponse.status).toBe(200);

    const protectedWithStaleToken = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${staleAccessToken}`);

    expect(protectedWithStaleToken.status).toBe(401);
    expect(protectedWithStaleToken.body.error.message).toBe(
      'No autorizado, sesión expirada. Inicia sesión nuevamente',
    );

    const loginWithNewPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'newPassword999' });

    expect(loginWithNewPassword.status).toBe(200);
  });
});
