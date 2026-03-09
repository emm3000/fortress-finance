import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type {
  ConfirmPasswordResetBody,
  LoginBody,
  RegisterBody,
  RequestPasswordResetBody,
} from '../validations/auth.validation';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

const PASSWORD_RESET_TTL_MINUTES = 60;

const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

const ensurePasswordResetTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const registerUser = async (data: RegisterBody) => {
  const { email, password, name } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(409, 'El usuario ya existe');
  }

  const passwordHash = await hashPassword(password);

  // Crear usuario y castillo en una transacción atómica
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
      },
    });

    await tx.castleState.create({
      data: {
        userId: newUser.id,
        hp: 100,
        maxHp: 100,
        level: 1,
        status: 'HEALTHY',
      },
    });

    await tx.userWallet.create({
      data: {
        userId: newUser.id,
        goldBalance: 50, // Pequeño regalo inicial
        streakDays: 0,
      },
    });

    return newUser;
  });

  const token = signToken({ userId: result.id });

  return {
    user: {
      id: result.id,
      email: result.email,
      name: result.name,
    },
    token,
  };
};

export const loginUser = async (data: LoginBody) => {
  const { email, password } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const isPasswordMatch = await comparePassword(password, user.passwordHash);

  if (!isPasswordMatch) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const token = signToken({ userId: user.id });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
};

export const requestPasswordReset = async (data: RequestPasswordResetBody) => {
  await ensurePasswordResetTable();

  const normalizedEmail = data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) {
    return {
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  await prisma.$executeRaw`
    INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
    VALUES (${randomUUID()}, ${user.id}::uuid, ${tokenHash}, ${expiresAt})
  `;

  return {
    message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
    ...(env.NODE_ENV !== 'production' ? { resetToken: token } : {}),
  };
};

export const confirmPasswordReset = async (data: ConfirmPasswordResetBody) => {
  await ensurePasswordResetTable();

  const tokenHash = hashResetToken(data.token);
  const [storedToken] = await prisma.$queryRaw<
    {
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
    }[]
  >`
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

  if (!storedToken) {
    throw new AppError(400, 'Token inválido o expirado');
  }

  if (storedToken.used_at !== null || storedToken.expires_at.getTime() <= Date.now()) {
    throw new AppError(400, 'Token inválido o expirado');
  }

  const newPasswordHash = await hashPassword(data.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: storedToken.user_id },
      data: { passwordHash: newPasswordHash },
    });

    await tx.$executeRaw`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ${storedToken.id}
    `;
  });

  return {
    message: 'Contraseña actualizada correctamente',
  };
};
