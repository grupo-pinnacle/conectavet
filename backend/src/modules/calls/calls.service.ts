import { AccessToken } from 'livekit-server-sdk';
import { prisma } from '../../shared/prisma.js';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger.js';

const CALL_TTL_SECONDS = 10 * 60; // 10 minutos

/**
 * Emite un token de acceso a la sala LiveKit de una consulta.
 * Solo participantes de una consulta ACTIVA pueden entrar.
 */
export async function createCallToken(params: { consultationId: string; userId: string; name?: string }) {
  const { consultationId, userId, name } = params;

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.clientId !== userId && consultation.vetId !== userId) {
    throw new ForbiddenError('No participás de esta consulta');
  }
  if (consultation.status !== 'ACTIVE') {
    throw new ConflictError('Solo podés llamar cuando la consulta está en curso');
  }

  const livekitUrl = process.env.LIVEKIT_URL?.trim();
  const livekitKey = process.env.LIVEKIT_API_KEY?.trim();
  const livekitSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!livekitUrl || !livekitKey || !livekitSecret) {
    logger.error('LIVEKIT_URL/API_KEY/API_SECRET no están configurados en el backend');
    throw new AppError(
      'Las videollamadas aún no están habilitadas. Configurá las credenciales de LiveKit en el servidor.',
      503
    );
  }

  const room = `consultation-${consultation.id}`;
  const token = new AccessToken(livekitKey, livekitSecret, {
    identity: userId,
    name: name || userId,
    ttl: `${CALL_TTL_SECONDS}`,
    metadata: JSON.stringify({
      consultationId,
      role: consultation.vetId === userId ? 'VET' : 'CLIENT',
    }),
  });
  token.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    url: livekitUrl,
    room,
    token: await token.toJwt(),
    expiresIn: CALL_TTL_SECONDS,
  };
}
