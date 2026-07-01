import app from './app.js';
import { setupChatSocket } from './modules/consultations/chat.gateway.js';
import { prisma } from './shared/prisma.js';
import { logger } from './shared/logger.js';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
});

setupChatSocket(server);

function gracefulShutdown(signal: string) {
  logger.info(`Señal ${signal} recibida. Cerrando servidor...`, { signal });
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Conexiones cerradas. Servidor detenido.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Excepción no capturada', { message: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason: any) => {
  logger.error('Promesa rechazada no manejada', { reason: reason?.message || reason });
  process.exit(1);
});
