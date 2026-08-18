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
} from './users.controller';
import {
  authenticate,
  authorize
} from '../../shared/middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/me', authenticate, getMeController);
router.patch('/me', authenticate, updateProfileController);
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

// S-03: endpoint de debug que expone el payload del JWT. Se mantiene
// DESACTIVADO en producción; solo se registra si se habilita explícitamente.
if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  router.get('/admin-only', authenticate, authorize(Role.ADMIN), adminOnlyController);
}
router.post(
  '/admin/users',
  authenticate,
  authorize(Role.ADMIN),
  createUserController
);
router.get('/favorites', authenticate, listFavoritesController);
router.post('/vets/:id/favorite', authenticate, addFavoriteController);
router.delete('/vets/:id/favorite', authenticate, removeFavoriteController);
router.get('/vets/:id', authenticate, getVetByIdController);

export default router;
