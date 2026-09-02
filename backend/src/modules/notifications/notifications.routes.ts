import { Router } from 'express';


import { authenticate } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { tokenSchema, deleteTokenSchema } from './notifications.schemas';
import {
  registerTokenController,
  deleteTokenController,
  listNotificationsController,
  markReadController,
} from './notifications.controller';

const router = Router();

router.post('/token', authenticate, validate(tokenSchema), registerTokenController);
router.delete('/token', authenticate, validate(deleteTokenSchema), deleteTokenController);
router.get('/', authenticate, listNotificationsController);
router.patch('/:id/read', authenticate, markReadController);

export default router;
