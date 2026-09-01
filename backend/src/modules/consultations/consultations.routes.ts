import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { sendMessageSchema, createSchema, completeSchema, prescriptionSchema, reviewSchema } from './consultations.schemas.js';
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

router.post('/', authenticate, validate(createSchema), createController);
router.get('/mine', authenticate, getMyConsultationsController);
router.get('/my-history', authenticate, getMyHistoryController);
router.get('/vets', authenticate, getAvailableVetsController);
router.get('/:id', authenticate, getByIdController);
router.patch('/:id/assign', authenticate, authorize(Role.VET, Role.ADMIN), assignVetController);
router.patch('/:id/decline', authenticate, authorize(Role.VET, Role.ADMIN), declineVetController);
router.patch('/:id/cancel', authenticate, cancelController);
router.patch('/:id/complete', authenticate, authorize(Role.VET, Role.ADMIN), validate(completeSchema), completeController);
router.get('/:id/messages', authenticate, getMessagesController);
router.post('/:id/messages', authenticate, validate(sendMessageSchema), sendMessageController);
router.get('/:id/prescriptions', authenticate, getPrescriptionsController);
router.post('/:id/prescriptions', authenticate, authorize(Role.VET, Role.ADMIN), validate(prescriptionSchema), createPrescriptionController);
router.post('/:id/rating', authenticate, validate(reviewSchema), createReviewController);

export default router;

