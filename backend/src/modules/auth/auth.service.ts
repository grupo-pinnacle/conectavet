import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';
import { prisma } from '../../shared/prisma';
import { clearCache } from '../../shared/cache';
import { sendMail } from '../../shared/mailer';
import { ConflictError, AppError } from '../../shared/errors';

const SALT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'CLIENT' | 'VET';
  specialty?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthError extends AppError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
  }
}

function signAccessToken(user: { id: string; email: string; role: string; tokenVersion: number }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET as string,
    { algorithm: 'HS256', expiresIn: '2h' }
  );
}

function signRefreshToken(userId: string, tokenVersion: number) {
  return jwt.sign(
    { userId, type: 'refresh', tokenVersion, jti: randomUUID() },
    process.env.JWT_SECRET as string,
    // 7 días (era 30d). Ventana de exposición menor si un refresh se filtra;
    // el usuario sigue logueado y el refresh rota en cada uso.
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

/**
 * Revoca todas las sesiones del usuario: se incrementa tokenVersion y
 * cualquier access/refresh emitido antes queda invalidado.
 */
export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
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

  // Token de verificación de email (válido 24h). El envío es best-effort.
  const emailVerifyToken = randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  // Registro público: CLIENT siempre, o VET con aprobación posterior
  // (vetStatus = PENDING, ver ADR-012). El alta de ADMIN solo la hace un
  // ADMIN vía POST /api/users/admin/users.
  const role = input.role === 'VET' ? 'VET' : 'CLIENT';
  const vetStatus = role === 'VET' ? 'PENDING' : 'APPROVED';

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      role,
      vetStatus,
      specialty: role === 'VET' ? input.specialty || null : null,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      emailVerifyToken,
      emailVerifyExpires,
    }
  });

  // Verificación por email (no bloquea el registro si el mail falla).
  void sendMail(
    user.email,
    'Verificá tu email en VetConnect',
    `<p>Confirmá tu cuenta haciendo clic aquí: <a href="${process.env.WEB_URL ?? ''}/verify-email?token=${emailVerifyToken}">${process.env.WEB_URL ?? ''}/verify-email?token=${emailVerifyToken}</a></p>`
  ).catch(() => undefined);

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id, user.tokenVersion),
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

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id, user.tokenVersion),
    user: userWithoutPassword
  };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_SECRET as string, {
      algorithms: ['HS256'],
    }) as {
      userId: string;
      type: string;
      tokenVersion: number;
    };
    if (decoded.type !== 'refresh') {
      throw new AuthError('Token de refresco inválido', 401);
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new AuthError('Usuario no encontrado', 401);
    }
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AuthError('Sesión cerrada. Iniciá sesión de nuevo', 401);
    }
    const { password, ...userWithoutPassword } = user;
    return {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user.id, user.tokenVersion),
      user: userWithoutPassword,
    };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Token de refresco inválido o expirado', 401);
  }
}

/**
 * Verifica el email del usuario a partir del token enviado en el registro.
 * El token debe existir y no haber expirado.
 */
export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token, emailVerifyExpires: { gt: new Date() } },
  });
  if (!user) throw new ConflictError('Token de verificación inválido o expirado');
  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
  });
  return { verified: true };
}

/**
 * Inicia el restablecimiento de contraseña. Por seguridad, SIEMPRE devuelve
 * el mismo resultado: nunca revela si el email existe (anti-enumeración).
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
    const link = `${process.env.WEB_URL ?? ''}/reset-password?token=${token}`;
    await sendMail(
      email,
      'Restablecer tu contraseña',
      `<p>Restablecé tu contraseña aquí: <a href="${link}">${link}</a></p><p>Si no fuiste vos, ignorá este mensaje.</p>`
    ).catch(() => undefined);
  }
  return { requested: true };
}

/**
 * Cambia la contraseña usando un token de restablecimiento válido. Al hacerlo,
 * se incrementa tokenVersion para cerrar las sesiones activas del usuario.
 */
export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) throw new ConflictError('Token de restablecimiento inválido o expirado');
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpires: null,
      tokenVersion: { increment: 1 },
    },
  });
  return { reset: true };
}
