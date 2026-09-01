import { Router } from 'express';


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
