import { Request, Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromCookie } from '../../shared/auth-cookies';
import { register, login, logout, refreshAccessToken, verifyEmail, requestPasswordReset, resetPassword, AuthError } from './auth.service';
import { ConflictError } from '../../shared/errors';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  // Registro público: un vet puede darse de alta, pero queda PENDING hasta
  // aprobación de un admin (ADR-012). Nunca se permite 'ADMIN' por esta vía.
  role: z.enum(['CLIENT', 'VET']).optional(),
  specialty: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
      });
    }
    const user = await register(parsed.data);
    setAuthCookies(res, user.accessToken, user.refreshToken);
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof AuthError) {
      // Evita enumeración de cuentas: mensaje genérico (no revela que el email
      // ya existe). NOTA: el status 409 sigue diferenciándose del 201; ocultarlo
      // por completo requiere coordinar el flujo del front (ver PRODUCTION_DEPLOYMENT.md).
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: 'No pudimos completar el registro con ese correo. Si ya tenés cuenta, iniciá sesión.',
        });
      }
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en registerController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function logoutController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    await logout(req.user.userId);
    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    console.error('Error en logoutController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken es requerido').optional(),
});

export async function refreshController(req: Request, res: Response) {
  try {
    const bodyToken = refreshSchema.safeParse(req.body).success
      ? (req.body.refreshToken as string | undefined)
      : undefined;
    const refreshToken = bodyToken || getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken es requerido' });
    }
    const result = await refreshAccessToken(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en refreshController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
      });
    }
    const result = await login(parsed.data);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en loginController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    // Siempre el mismo mensaje: no revela si el email existe.
    await requestPasswordReset(parsed.data.email);
    return res.status(200).json({
      success: true,
      message: 'Si el correo está registrado, te enviamos las instrucciones.',
    });
  } catch (error) {
    console.error('Error en forgotPasswordController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    await resetPassword(parsed.data.token, parsed.data.password);
    return res.status(200).json({ success: true, message: 'Contraseña actualizada. Iniciá sesión.' });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error en resetPasswordController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function verifyEmailController(req: Request, res: Response) {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token requerido' });
    }
    await verifyEmail(token);
    return res.status(200).json({ success: true, message: 'Email verificado. Ya podés iniciar sesión.' });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error en verifyEmailController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
