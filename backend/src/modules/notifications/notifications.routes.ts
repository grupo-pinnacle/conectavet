import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { tokenSchema, deleteTokenSchema } from './notifications.schemas';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
  registerTokenController,
  deleteTokenController,
  listNotificationsController,
  markReadController,
} from './notifications.controller';

const router = Router();

router.post('/token', authenticate, registerTokenController);
router.delete('/token', authenticate, deleteTokenController);
router.get('/', authenticate, listNotificationsController);
router.patch('/:id/read', authenticate, markReadController);

export default router;
