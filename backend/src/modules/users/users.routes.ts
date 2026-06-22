import { Router } from 'express';
import { getMeController, adminOnlyController } from './users.controller';
import {
  authenticate,
  authorize
} from '../../shared/middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/me', authenticate, getMeController);
router.get(
  '/admin-only',
  authenticate,
  authorize(Role.ADMIN),
  adminOnlyController
);

export default router;
