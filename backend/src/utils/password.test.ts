import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password';

describe('Password Utility', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'mySecretPassword';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should not match a wrong password', async () => {
    const password = 'mySecretPassword';
    const wrongPassword = 'wrongPassword';
    const hash = await hashPassword(password);

    const isMatch = await comparePassword(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});
