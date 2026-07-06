import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  createController,
  assignVetController,
  completeController,
  getByIdController,
  getMyConsultationsController,
  getAvailableVetsController,
  getMessagesController,
} from './consultations.controller';

const router = Router();

router.post('/', authenticate, createController);
router.get('/mine', authenticate, getMyConsultationsController);
router.get('/my-history', authenticate, getMyConsultationsController);
router.get('/vets', authenticate, getAvailableVetsController);
router.get('/:id', authenticate, getByIdController);
router.patch('/:id/assign', authenticate, authorize(Role.VET, Role.ADMIN), assignVetController);
router.patch('/:id/complete', authenticate, authorize(Role.VET, Role.ADMIN), completeController);
router.get('/:id/messages', authenticate, getMessagesController);

export default router;
