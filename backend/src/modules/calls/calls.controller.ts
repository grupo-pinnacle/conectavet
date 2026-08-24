import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError } from '../../shared/errors';
import { createCallToken } from './calls.service';

export async function createCallTokenController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { id } = req.params as { id: string };
    if (!id) {
      return res.status(400).json({ success: false, message: 'Consulta requerida' });
    }
    const data = await createCallToken({
      consultationId: id,
      userId: req.user.userId,
      name: req.user.email,
    });
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en createCallTokenController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
