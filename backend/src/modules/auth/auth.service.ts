import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';
import { prisma } from '../../shared/prisma';
import { clearCache, getCached, setCache } from '../../shared/cache';
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
    // 7 dÃ­as (era 30d). Ventana de exposiciÃ³n menor si un refresh se filtra;
    // el usuario sigue logueado y el refresh rota en cada uso.
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

import { disconnectUserSockets, getIO } from '../consultations/chat.gateway.js';

/**
 * Revoca todas las sesiones del usuario: se incrementa tokenVersion y
 * cualquier access/refresh emitido antes queda invalidado.
 */
export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
  await clearCache('vets:');
  await clearCache(`user:tokenVersion:${userId}`);
  disconnectUserSockets(userId);
}

export function sanitizeUser<T extends Record<string, any>>(user: T) {
  const {
    password,
    emailVerifyToken,
    emailVerifyExpires,
    passwordResetToken,
    passwordResetExpires,
    ...clean
  } = user;
  return clean;
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new AuthError('No pudimos completar el registro con ese correo. Si ya tenÃ©s cuenta, iniciÃ¡ sesiÃ³n.', 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Token de verificaciÃ³n de email (vÃ¡lido 24h). El envÃ­o es best-effort.
  const emailVerifyToken = randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  // Registro pÃºblico: CLIENT siempre, o VET con aprobaciÃ³n posterior
  // (vetStatus = PENDING, ver ADR-012). El alta de ADMIN solo la hace un
  // ADMIN vÃ­a POST /api/users/admin/users.
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

  // VerificaciÃ³n por email (no bloquea el registro si el mail falla).
  void sendMail(
    user.email,
    'VerificÃ¡ tu email en VetConnect',
    `<p>ConfirmÃ¡ tu cuenta haciendo clic aquÃ­: <a href="${process.env.WEB_URL ?? ''}/verify-email?token=${emailVerifyToken}">${process.env.WEB_URL ?? ''}/verify-email?token=${emailVerifyToken}</a></p>`
  ).catch(() => undefined);

  const safeUser = sanitizeUser(user);

  try { const io = getIO(); if (io) io.to('admin:room').emit('admin:event', safeUser); } catch(e) {}
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id, user.tokenVersion),
    user: safeUser,
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

  const safeUser = sanitizeUser(user);

  try { const io = getIO(); if (io) io.to('admin:room').emit('admin:event', safeUser); } catch(e) {}
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id, user.tokenVersion),
    user: safeUser
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
      jti?: string;
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
    
    // Refresh Token Rotation (RTR) - FAANG Standard:
    // Evita ataques de replay de refresh tokens robados.
    if (decoded.jti) {
      const isUsed = await getCached<boolean>(`rtr:${decoded.jti}`);
      if (isUsed) {
        // Alerta crítica: El token ya fue usado. Esto implica que fue robado
        // y alguien intenta usarlo. Revocamos toda la familia de tokens al instante.
        await logout(user.id);
        throw new AuthError('Alerta de seguridad: Sesión comprometida. Por favor, vuelva a iniciar sesión.', 401);
      }
      // Marcar el token como usado (ttl = 7 días = 604800 seg, misma expiración del token)
      await setCache(`rtr:${decoded.jti}`, true, 604800);
    }

    const safeUser = sanitizeUser(user);
    try { const io = getIO(); if (io) io.to('admin:room').emit('admin:event', safeUser); } catch(e) {}
    
    return {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user.id, user.tokenVersion),
      user: safeUser,
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
  if (!user) throw new ConflictError('Token de verificaciÃ³n invÃ¡lido o expirado');
  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
  });
  return { verified: true };
}

import { createHash } from 'crypto';

/**
 * Inicia el restablecimiento de contraseÃ±a. Por seguridad, SIEMPRE devuelve
 * el mismo resultado: nunca revela si el email existe (anti-enumeraciÃ³n).
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken, passwordResetExpires: expires },
    });
    const link = `${process.env.WEB_URL ?? ''}/reset-password?token=${token}`;
    await sendMail(
      email,
      'Restablecer tu contraseÃ±a',
      `<p>RestablecÃ© tu contraseÃ±a aquÃ­: <a href="${link}">${link}</a></p><p>Si no fuiste vos, ignorÃ¡ este mensaje.</p>`
    ).catch(() => undefined);
  }
  return { requested: true };
}

/**
 * Cambia la contraseÃ±a usando un token de restablecimiento vÃ¡lido. Al hacerlo,
 * se incrementa tokenVersion para cerrar las sesiones activas del usuario.
 */
export async function resetPassword(token: string, newPassword: string) {
  const hashedToken = createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: hashedToken, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) throw new ConflictError('Token de restablecimiento invÃ¡lido o expirado');
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
  await clearCache(`user:tokenVersion:${user.id}`);
  disconnectUserSockets(user.id);
  return { reset: true };
}

