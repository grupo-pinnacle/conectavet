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
  batchDeleteUsersController,
  getAuditLogsController,
} from './users.controller';
import {
  authenticate,
  authorize
} from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { updateProfileSchema, createUserSchema, updateVetStatusSchema, availabilitySchema } from './users.schemas.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/me', authenticate, getMeController);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfileController);
router.patch('/me/availability', authenticate, authorize(Role.VET, Role.ADMIN), validate(availabilitySchema), setAvailabilityController);
router.get('/admin-only', authenticate, authorize(Role.ADMIN), adminOnlyController);
router.get('/vets', authenticate, listVetsController);
router.post('/admin/users', authenticate, authorize(Role.ADMIN), validate(createUserSchema), createUserController);
router.get('/favorites', authenticate, authorize(Role.CLIENT), listFavoritesController);
router.post('/vets/:id/favorite', authenticate, authorize(Role.CLIENT), addFavoriteController);
router.delete('/vets/:id/favorite', authenticate, authorize(Role.CLIENT), removeFavoriteController);
router.get('/vets/:id', authenticate, getVetByIdController);
router.patch('/vets/:id/vet-status', authenticate, authorize(Role.ADMIN), validate(updateVetStatusSchema), updateVetStatusController);

// Admin routes
router.get('/admin/users', authenticate, authorize(Role.ADMIN), listAllUsersController);
router.get('/admin/stats', authenticate, authorize(Role.ADMIN), getAdminStatsController);
router.delete('/admin/users/batch', authenticate, authorize(Role.ADMIN), batchDeleteUsersController);
router.get('/admin/audit-logs', authenticate, authorize(Role.ADMIN), getAuditLogsController);

export default router;
