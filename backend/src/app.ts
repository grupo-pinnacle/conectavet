import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import petsRoutes from './modules/pets/pets.routes.js';
import { consultationsRoutes } from './modules/consultations/index.js';
import { callsRoutes } from './modules/calls/index.js';
import { mediaRoutes } from './modules/media/index.js';
import { notificationsRoutes } from './modules/notifications/index.js';
import { UPLOADS_DIR } from './modules/media/media.service.js';
import { prisma } from './shared/prisma.js';
import { logger } from './shared/logger.js';
import { AppError } from './shared/errors/index.js';
import { authenticate, RequestWithUser } from './shared/middlewares/auth.middleware.js';
import NodeCache from 'node-cache';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface AppRequest extends Request {
  id: string;
}

if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET no está definido en las variables de entorno');
  process.exit(1);
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
const allowCredentials = !corsOrigins.includes('*');
app.use(cors({
  origin: corsOrigins,
  credentials: allowCredentials,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(compression());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const reqId = randomUUID();
  (req as AppRequest).id = reqId;
  logger.info('request', { reqId, method: req.method, path: req.path });
  next();
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
    });
  }
});

// Rate limit global: solo mutaciones (POST/PATCH/DELETE).
// El front tiene polling GET (consultas/mensajes c/10s) y varias pestañas:
// exentamos GET/HEAD para que el 429 global no tumbe el dashboard.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD',
  message: { success: false, message: 'Demasiadas solicitudes, intentá de nuevo más tarde' },
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de login, intentá de nuevo más tarde' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

const callsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes de llamada, intentá de nuevo más tarde' },
});
app.use('/api/calls', callsLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationsRoutes);
// Archivos subidos: requieren autenticación y participación en la consulta
// propietaria (o ser el uploader / admin). Evita exposición de PII médica.
//
// Perf (chat): la autorización se cachea 2 min por usuario+archivo — cada
// imagen del chat antes hacía 1-2 queries SQL. Los archivos son inmutables
// (nombre único por subida), así que además mandamos Cache-Control para que
// el navegador no vuelva a pedir las que ya vio.
const uploadAuthCache = new NodeCache({ stdTTL: 120, checkperiod: 300 });
app.use('/uploads', authenticate, async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const rel = (req.path || '').replace(/^\/+/, '');
    if (!/^[\w.\-]+$/.test(rel)) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
    }
    const fileUrl = '/uploads/' + rel;
    const cacheKey = `${req.user!.userId}:${rel}`;
    let allowed = uploadAuthCache.get<boolean>(cacheKey) === true;
    if (!allowed) {
      const msg = await prisma.message.findFirst({
        where: { attachmentUrl: fileUrl },
        select: { consultationId: true },
      });
      if (msg) {
        const c = await prisma.consultation.findFirst({
          where: { id: msg.consultationId, OR: [{ clientId: req.user!.userId }, { vetId: req.user!.userId }] },
        });
        allowed = !!c;
      }
      if (!allowed) {
        const att = await prisma.attachment.findFirst({ where: { url: fileUrl, uploaderId: req.user!.userId } });
        allowed = !!att || req.user!.role === 'ADMIN';
      }
      // Solo cacheamos resultados positivos: si cambia un permiso negativo
      // no quedará bloqueado por el TTL.
      if (allowed) uploadAuthCache.set(cacheKey, true);
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'No tenés acceso a este archivo' });
    }
    res.sendFile(join(UPLOADS_DIR, rel), {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    }, (err) => {
      if (err) res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    });
  } catch (e) {
    next(e);
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const reqId = (req as AppRequest).id;
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message;
  logger.error(err.message, { reqId, statusCode, stack: err.stack });
  res.status(statusCode).json({ success: false, message });
});

export default app;
