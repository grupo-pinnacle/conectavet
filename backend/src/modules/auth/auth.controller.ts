import { Request, Response } from 'express';
import { register, login, AuthError } from './auth.service';
import { Role } from '@prisma/client';

export async function registerController(req: Request, res: Response) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y rol son requeridos'
      });
    }

    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol debe ser CLIENT, VET o ADMIN'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await register({ email, password, role });

    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error en registerController:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const result = await login({ email, password });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error en loginController:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}