import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { registerController, loginController, logoutController, refreshController } from './auth.controller';
import { getMeController } from '../users/users.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);

const REFRESH_ENABLED = process.env.REFRESH_TOKENS !== 'false';
if (REFRESH_ENABLED) {
  router.post('/refresh', refreshController);
}

router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, getMeController);

export default router;