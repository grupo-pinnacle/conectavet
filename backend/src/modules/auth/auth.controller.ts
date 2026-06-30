import { Request, Response } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { register, login, logout, AuthError } from './auth.service';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['CLIENT', 'VET', 'ADMIN'], { error: 'El rol debe ser CLIENT, VET o ADMIN' }),
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
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof AuthError) {
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
    return res.status(200).json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    console.error('Error en logoutController:', error);
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
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en loginController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
