import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import type { RegisterBody, LoginBody } from '../validations/auth.validation';
import { AppError } from '../utils/AppError';

export const registerUser = async (data: RegisterBody) => {
  const { email, password, name } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(409, 'El usuario ya existe');
  }

  const passwordHash = await hashPassword(password);

  // Crear usuario y castillo en una transacción atómica
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
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

  const user = await prisma.user.findUnique({
    where: { email },
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
