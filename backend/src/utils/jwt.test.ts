import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from './jwt';

describe('JWT Utility', () => {
  it('should sign and verify a token correctly', () => {
    const payload = { userId: 'test-uuid' };
    const token = signToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should throw an error for an invalid token', () => {
    const invalidToken = 'this.is.not.a.valid.token';
    expect(() => verifyToken(invalidToken)).toThrow();
  });
});
