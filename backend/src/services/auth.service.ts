import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { RegisterBody, LoginBody } from '../validations/auth.validation';
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

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

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
