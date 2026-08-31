import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { validate } from '../../shared/middlewares/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas';
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


const router = Router();

router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);

const REFRESH_ENABLED = process.env.REFRESH_TOKENS !== 'false';
if (REFRESH_ENABLED) {
  router.post('/refresh', refreshController);
}

router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, getMeController);

// S-04: anti-abuse en forgot-password. LÃ­mite estricto por IP + email para
// evitar enumeraciÃ³n masiva y "notification fatigue" (spam de emails).
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Clave compuesta: misma IP o mismo email cuentan para el lÃ­mite.
  keyGenerator: (req) => {
    const email = (req.body && typeof req.body.email === 'string' ? req.body.email : '').toLowerCase();
    return `${ipKeyGenerator(req.ip ?? 'unknown')}:${email}`;
  },
  message: { success: false, message: 'Demasiados intentos. IntentÃ¡ de nuevo mÃ¡s tarde.' },
});

// RecuperaciÃ³n de contraseÃ±a y verificaciÃ³n de email (no requieren sesiÃ³n).
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. IntentÃ¡ de nuevo mÃ¡s tarde.' },
});

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPasswordController);
router.get('/verify-email', verifyEmailController);

export default router;
