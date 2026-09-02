import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { CustomRedisStore } from './shared/rate-limit-store.js';
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
import { authenticate, authorize, RequestWithUser } from './shared/middlewares/auth.middleware.js';
import { Role } from '@prisma/client';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface AppRequest extends Request {
  id: string;
}

if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET no estÃ¡ definido en las variables de entorno');
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

// Protección anti-CSRF para peticiones mutativas basadas en cookies
app.use((req: Request, res: Response, next: NextFunction) => {
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const cookieHeader = req.headers.cookie || '';
  const hasAuthCookie = cookieHeader.includes('access_token=');
  const authHeader = req.headers.authorization || '';
  const hasBearer = authHeader.startsWith('Bearer ');

  if (isMutating && hasAuthCookie && !hasBearer) {
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    if (origin) {
      const allowed = corsOrigins.includes(origin) || corsOrigins.includes('*');
      if (!allowed) {
        res.status(403).json({ success: false, message: 'Origen no permitido (CSRF Protection)' });
        return;
      }
    }
  }
  next();
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  const reqId = randomUUID();
  (req as AppRequest).id = reqId;
  logger.info('request', { reqId, method: req.method, path: req.path });
  next();
});

// O-02: mÃ©tricas mÃ­nimas en memoria (suficiente para alertas bÃ¡sicas en prod
// sin dependencias externas). Para observabilidad profunda se puede conectar
// Prometheus/OpenTelemetry mÃ¡s adelante.
const metrics = { total: 0, errors: 0, startTime: Date.now() };
app.use((_req: Request, res: Response, next: NextFunction) => {
  metrics.total++;
  res.on('finish', () => {
    if (res.statusCode >= 500) metrics.errors++;
  });
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
// El front tiene polling GET (consultas/mensajes c/10s) y varias pestaÃ±as:
// exentamos GET/HEAD para que el 429 global no tumbe el dashboard.
const isTest = process.env.NODE_ENV === 'test';
const limiter = rateLimit({
  store: new CustomRedisStore('rl:global:'),
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || isTest,
  message: { success: false, message: 'Demasiadas solicitudes, intentá de nuevo más tarde' },
});
app.use(limiter);

const authLimiter = rateLimit({
  store: new CustomRedisStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { success: false, message: 'Demasiados intentos de login, intentá de nuevo más tarde' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

const callsLimiter = rateLimit({
  store: new CustomRedisStore('rl:calls:'),
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
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
// Archivos subidos: requieren autenticaciÃ³n y participaciÃ³n en la consulta
// propietaria (o ser el uploader / admin). Evita exposiciÃ³n de PII mÃ©dica.
app.get('/metrics', authenticate, authorize(Role.ADMIN), (_req: RequestWithUser, res: Response) => {
  res.json({
    uptimeSeconds: Math.round((Date.now() - metrics.startTime) / 1000),
    totalRequests: metrics.total,
    serverErrors: metrics.errors,
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/uploads', authenticate, async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const rel = (req.path || '').replace(/^\/+/, '');
    if (!/^[\w.\-]+$/.test(rel)) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo invÃ¡lido' });
    }
    const fileUrl = '/uploads/' + rel;
    let allowed = false;
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
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'No tenÃ©s acceso a este archivo' });
    }
    res.sendFile(join(UPLOADS_DIR, rel), { headers: { 'X-Content-Type-Options': 'nosniff' } }, (err) => {
      if (err) return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
      return;
    });
    return;
  } catch (e) {
    return next(e);
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

