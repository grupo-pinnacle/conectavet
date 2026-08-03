import { Router } from 'express';
import { getMeController, adminOnlyController, listVetsController, setAvailabilityController } from './users.controller';
import {
  authenticate,
  authorize
} from '../../shared/middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/me', authenticate, getMeController);
router.patch(
  '/me/availability',
  authenticate,
  authorize(Role.VET, Role.ADMIN),
  setAvailabilityController
);
router.get(
  '/admin-only',
  authenticate,
  authorize(Role.ADMIN),
  adminOnlyController
);
router.get('/vets', authenticate, listVetsController);

export default router;
