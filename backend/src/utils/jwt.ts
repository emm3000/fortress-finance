import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-change-it';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
}

/**
 * Sign a new JWT token using the provided payload.
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify checking if the token is valid, returns the payload.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
