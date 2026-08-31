import { createPetSchema, updatePetSchema } from './pets.schemas';
import { validate } from '../../shared/middlewares/validate.middleware';
﻿import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
  getMyPetsController,
  getManagedPetsController,
  getPetByIdController,
  getPetVetCardController,
  createPetController,
  updatePetController,
  deletePetController,
  restorePetController,
} from './pets.controller';

const router = Router();

router.get('/', authenticate, getMyPetsController);
router.get('/managed', authenticate, getManagedPetsController);
router.get('/:id', authenticate, getPetByIdController);
router.post('/', authenticate, validate(createPetSchema), createPetController);
router.put('/:id', authenticate, updatePetController);
router.patch('/:id', authenticate, validate(updatePetSchema), updatePetController);
router.delete('/:id', authenticate, deletePetController);
router.get('/:id/vetcard', authenticate, getPetVetCardController);
router.post('/:id/restore', authenticate, restorePetController);

export default router;

