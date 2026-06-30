import app from './app.js';
import { setupChatSocket } from './modules/consultations/chat.gateway.js';
import { prisma } from './shared/prisma.js';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

setupChatSocket(server);

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} recibida. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Conexiones cerradas. Adiós.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason: any) => {
  console.error('[UNHANDLED_REJECTION]', reason?.message || reason);
  process.exit(1);
});
