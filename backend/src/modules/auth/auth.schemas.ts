import { z } from "zod";

export const registerSchema = z.object({
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
export const loginSchema = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(1, 'Contraseña requerida'),
    });
export const refreshSchema = z.object({
      refreshToken: z.string().min(1, 'refreshToken es requerido').optional(),
    });
export const forgotPasswordSchema = z.object({
      email: z.string().email('Email inválido'),
    });
export const resetPasswordSchema = z.object({
      token: z.string().min(1, 'Token requerido'),
      password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    });
