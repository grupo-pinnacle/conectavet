import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { clearCache } from '../../shared/cache';

const SALT_ROUNDS = 10;

interface RegisterInput {
  email: string;
  password: string;
  role?: Role;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
  clearCache('vets:');
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
      role: input.role ?? 'CLIENT',
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    }
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const refreshTokenValue = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken: token,
    refreshToken: refreshTokenValue,
    user: userWithoutPassword,
  };
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

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const refreshTokenValue = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken: token,
    refreshToken: refreshTokenValue,
    user: userWithoutPassword
  };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_SECRET as string) as any;
    if (decoded.type !== 'refresh') {
      throw new AuthError('Token de refresco inválido', 401);
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new AuthError('Usuario no encontrado', 401);
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );
    const { password, ...userWithoutPassword } = user;
    return { accessToken: token, refreshToken: newRefreshToken, user: userWithoutPassword };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Token de refresco inválido o expirado', 401);
  }
}