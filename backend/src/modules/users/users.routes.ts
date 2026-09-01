import { Router } from 'express';
import {
  getMeController,
  adminOnlyController,
  listVetsController,
  setAvailabilityController,
  getVetByIdController,
  updateProfileController,
  addFavoriteController,
  removeFavoriteController,
  listFavoritesController,
  createUserController,
  updateVetStatusController,
  listAllUsersController,
  getAdminStatsController,
} from './users.controller';
import {
  authenticate,
  authorize
} from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { updateProfileSchema } from './users.schemas.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/me', authenticate, getMeController);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfileController);
router.patch('/me/availability', authenticate, authorize(Role.VET, Role.ADMIN), setAvailabilityController);
router.get('/admin-only', authenticate, authorize(Role.ADMIN), adminOnlyController);
router.get('/vets', authenticate, listVetsController);

if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  router.get('/admin-only', authenticate, authorize(Role.ADMIN), adminOnlyController);
}
router.post('/admin/users', authenticate, authorize(Role.ADMIN), createUserController);
router.get('/favorites', authenticate, listFavoritesController);
router.post('/vets/:id/favorite', authenticate, addFavoriteController);
router.delete('/vets/:id/favorite', authenticate, removeFavoriteController);
router.get('/vets/:id', authenticate, getVetByIdController);
router.patch('/vets/:id/vet-status', authenticate, authorize(Role.ADMIN), updateVetStatusController);

// Admin routes
router.get('/admin/users', authenticate, authorize(Role.ADMIN), listAllUsersController);
router.get('/admin/stats', authenticate, authorize(Role.ADMIN), getAdminStatsController);

import { batchDeleteUsersController, getAuditLogsController } from './users.controller';
router.delete('/admin/users/batch', authenticate, authorize(Role.ADMIN), batchDeleteUsersController);
router.get('/admin/audit-logs', authenticate, authorize(Role.ADMIN), getAuditLogsController);

export default router;
