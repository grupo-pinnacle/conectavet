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
  sendMessageController,
  getPrescriptionsController,
  createPrescriptionController,
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
router.post('/:id/messages', authenticate, sendMessageController);
router.get('/:id/prescriptions', authenticate, getPrescriptionsController);
router.post('/:id/prescriptions', authenticate, authorize(Role.VET, Role.ADMIN), createPrescriptionController);

export default router;
