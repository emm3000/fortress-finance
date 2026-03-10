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
import { env } from '../config/env';
import { errorCatalog } from '../utils/errorCatalog';

const PASSWORD_RESET_TTL_MINUTES = 60;

const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const registerUser = async (data: RegisterBody) => {
  const { email, password, name } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw errorCatalog.auth.userExists();
  }

  const passwordHash = await hashPassword(password);

  // Create user and castle state in a single atomic transaction
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
        goldBalance: 50, // Small initial starter gift
        streakDays: 0,
      },
    });

    return newUser;
  });

  const token = signToken({ userId: result.id, sessionIssuedAt: Date.now() });

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
    throw errorCatalog.auth.invalidCredentials();
  }

  const isPasswordMatch = await comparePassword(password, user.passwordHash);

  if (!isPasswordMatch) {
    throw errorCatalog.auth.invalidCredentials();
  }

  const token = signToken({ userId: user.id, sessionIssuedAt: Date.now() });

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

  await prisma.$transaction(async (tx) => {
    // Keep only the latest active token to simplify validation and reduce abuse surface.
    await tx.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await tx.passwordResetToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  return {
    message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
    ...(env.NODE_ENV !== 'production' ? { resetToken: token } : {}),
  };
};

export const confirmPasswordReset = async (data: ConfirmPasswordResetBody) => {
  const tokenHash = hashResetToken(data.token);
  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!storedToken) {
    throw errorCatalog.auth.resetTokenInvalidOrExpired();
  }

  if (storedToken.usedAt !== null || storedToken.expiresAt.getTime() <= Date.now()) {
    throw errorCatalog.auth.resetTokenInvalidOrExpired();
  }

  const newPasswordHash = await hashPassword(data.newPassword);

  await prisma.$transaction(async (tx) => {
    const tokenUsage = await tx.passwordResetToken.updateMany({
      where: {
        id: storedToken.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (tokenUsage.count === 0) {
      throw errorCatalog.auth.resetTokenInvalidOrExpired();
    }

    await tx.user.update({
      where: { id: storedToken.userId },
      data: { passwordHash: newPasswordHash },
    });
  });

  return {
    message: 'Contraseña actualizada correctamente',
  };
};
