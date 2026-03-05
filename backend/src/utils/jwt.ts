import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
}

/**
 * Sign a new JWT token using the provided payload.
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify checking if the token is valid, returns the payload.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
