import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  createController,
  assignVetController,
  declineVetController,
  cancelController,
  completeController,
  getByIdController,
  getMyConsultationsController,
  getMyHistoryController,
  getAvailableVetsController,
  getMessagesController,
  sendMessageController,
  getPrescriptionsController,
  createPrescriptionController,
  createReviewController,
} from './consultations.controller';

const router = Router();

router.post('/', authenticate, createController);
router.get('/mine', authenticate, getMyConsultationsController);
router.get('/my-history', authenticate, getMyHistoryController);
router.get('/vets', authenticate, getAvailableVetsController);
router.get('/:id', authenticate, getByIdController);
router.patch('/:id/assign', authenticate, authorize(Role.VET, Role.ADMIN), assignVetController);
router.patch('/:id/decline', authenticate, authorize(Role.VET, Role.ADMIN), declineVetController);
router.patch('/:id/cancel', authenticate, cancelController);
router.patch('/:id/complete', authenticate, authorize(Role.VET, Role.ADMIN), completeController);
router.get('/:id/messages', authenticate, getMessagesController);
router.post('/:id/messages', authenticate, sendMessageController);
router.get('/:id/prescriptions', authenticate, getPrescriptionsController);
router.post('/:id/prescriptions', authenticate, authorize(Role.VET, Role.ADMIN), createPrescriptionController);
router.post('/:id/rating', authenticate, createReviewController);

export default router;
