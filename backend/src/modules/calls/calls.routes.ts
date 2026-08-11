import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { createCallTokenController } from './calls.controller';

const router = Router();

router.post('/:id/token', authenticate, createCallTokenController);

export default router;
