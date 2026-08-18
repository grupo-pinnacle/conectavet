import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
  registerController,
  loginController,
  logoutController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
} from './auth.controller';
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

// S-04: anti-abuse en forgot-password. Límite estricto por IP + email para
// evitar enumeración masiva y "notification fatigue" (spam de emails).
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Clave compuesta: misma IP o mismo email cuentan para el límite.
  keyGenerator: (req) => {
    const email = (req.body && typeof req.body.email === 'string' ? req.body.email : '').toLowerCase();
    return `${req.ip}:${email}`;
  },
  message: { success: false, message: 'Demasiados intentos. Intentá de nuevo más tarde.' },
});

// Recuperación de contraseña y verificación de email (no requieren sesión).
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.get('/verify-email', verifyEmailController);

export default router;