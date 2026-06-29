import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
  getMyPetsController,
  getPetByIdController,
  createPetController,
  updatePetController,
  deletePetController,
} from './pets.controller';

const router = Router();

router.get('/', authenticate, getMyPetsController);
router.get('/:id', authenticate, getPetByIdController);
router.post('/', authenticate, createPetController);
router.put('/:id', authenticate, updatePetController);
router.delete('/:id', authenticate, deletePetController);

export default router;
