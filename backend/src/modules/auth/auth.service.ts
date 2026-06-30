import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';

const SALT_ROUNDS = 10;

interface RegisterInput {
  email: string;
  password: string;
  role: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: false },
  });
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new AuthError('Este email ya está registrado', 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      role: input.role
    }
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw new AuthError('Credenciales inválidas', 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new AuthError('Credenciales inválidas', 401);
  }

  if (user.role === 'VET') {
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const { password, ...userWithoutPassword } = user;

  return {
    token,
    user: { ...userWithoutPassword, isOnline: user.role === 'VET' ? true : userWithoutPassword.isOnline }
  };
}