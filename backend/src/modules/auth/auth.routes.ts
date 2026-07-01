import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { registerController, loginController, logoutController, refreshController } from './auth.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);

const REFRESH_ENABLED = process.env.REFRESH_TOKENS !== 'false';
if (REFRESH_ENABLED) {
  router.post('/refresh', refreshController);
}

router.post('/logout', authenticate, logoutController);

export default router;