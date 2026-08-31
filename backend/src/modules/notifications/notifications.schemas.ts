import { z } from "zod";

export const tokenSchema = z.object({
      token: z.string().min(5, 'Token inválido').max(500, 'Token inválido'),
      platform: z.enum(['android', 'ios', 'web'], 'Plataforma inválida'),
    });
export const deleteTokenSchema = z.object({
      token: z.string().min(1, 'Token requerido').max(500),
    });
