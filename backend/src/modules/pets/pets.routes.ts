import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
  getMyPetsController,
  getPetByIdController,
  createPetController,
  updatePetController,
  deletePetController,
  restorePetController,
} from './pets.controller';

const router = Router();

router.get('/', authenticate, getMyPetsController);
router.get('/:id', authenticate, getPetByIdController);
router.post('/', authenticate, createPetController);
router.put('/:id', authenticate, updatePetController);
router.patch('/:id', authenticate, updatePetController);
router.delete('/:id', authenticate, deletePetController);
router.post('/:id/restore', authenticate, restorePetController);

export default router;
