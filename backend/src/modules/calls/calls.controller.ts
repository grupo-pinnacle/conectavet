import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError } from '../../shared/errors';
import { createCallToken } from './calls.service';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";

export const createCallTokenController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
});
