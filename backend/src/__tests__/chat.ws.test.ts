import { createServer } from 'http';
import { io as ioClient, type Socket } from 'socket.io-client';
import request from 'supertest';
import app from '../app';
import { setupChatSocket } from '../modules/consultations/chat.gateway';
import { prisma } from '../shared/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Evita rechazos CORS del gateway en el entorno de test (el cliente envía el token vía auth).
process.env.CORS_ORIGIN = '*';

const prefix = `ws-${Date.now()}`;
let server: import('http').Server;
let clientUser: import('@prisma/client').User;
let vetUser: import('@prisma/client').User;
let pet: import('@prisma/client').Pet;
let consult: import('@prisma/client').Consultation;
let clientToken: string;
let vetToken: string;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function connect(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const sock = ioClient(`http://localhost:${(server.address() as { port: number }).port}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
    sock.on('connect', () => resolve(sock));
    sock.on('connect_error', (err) => reject(err));
  });
}

function emitMessage(sock: Socket, payload: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve) => {
    sock.emit('message:send', payload, (ack: unknown) => resolve(ack));
  });
}

beforeAll(async () => {
  server = createServer(app);
  await setupChatSocket(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const hashed = await bcrypt.hash('12345678', 10);
  [clientUser, vetUser] = await Promise.all([
    prisma.user.create({ data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET' } }),
  ]);
  pet = await prisma.pet.create({ data: { name: 'TestPet', species: 'Perro', ownerId: clientUser.id } });
  const sign = (u: import('@prisma/client').User, r: Role) =>
    jwt.sign({ userId: u.id, email: u.email, role: r }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  clientToken = sign(clientUser, 'CLIENT');
  vetToken = sign(vetUser, 'VET');

  // Consulta ACTIVE para poder enviar mensajes.
  const created = await request(server)
    .post('/api/consultations')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ petId: pet.id, notes: 'Motivo' });
  consult = created.body.data;
  await request(server).patch(`/api/consultations/${consult.id}/assign`).set('Authorization', `Bearer ${vetToken}`);
  const after = await request(server).get(`/api/consultations/${consult.id}`).set('Authorization', `Bearer ${clientToken}`);
  consult = after.body.data;
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  await prisma.pet.deleteMany({ where: { owner: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('WebSocket: entrega en tiempo real (T-01)', () => {
  test('mensaje REST se propaga al socket del otro participante', async () => {
    const vetSock = await connect(vetToken);
    vetSock.emit('join:consultation', consult.id);
    await delay(150);
    const received = new Promise<any>((resolve) => vetSock.on('message:new', (m) => resolve(m)));
    await request(server)
      .post(`/api/consultations/${consult.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hola vet' });
    const msg = await received;
    expect(msg.content).toBe('Hola vet');
    vetSock.close();
  });

  test('dedup por clientMsgId: reenvío devuelve skipped:true', async () => {
    const sock = await connect(clientToken);
    sock.emit('join:consultation', consult.id);
    await delay(150);
    const first = (await emitMessage(sock, { consultationId: consult.id, content: 'dup', clientMsgId: 'ws-dup-1' })) as any;
    const second = (await emitMessage(sock, { consultationId: consult.id, content: 'dup', clientMsgId: 'ws-dup-1' })) as any;
    expect(first.skipped).not.toBe(true);
    expect(second.skipped).toBe(true);
    sock.close();
  });

  test('rate-limit: >10 mensajes rápidos → al menos uno bloqueado', async () => {
    const sock = await connect(clientToken);
    sock.emit('join:consultation', consult.id);
    await delay(150);
    let blocked = false;
    sock.on('error', (e: Error) => {
      if (e && e.message && e.message.includes('Demasiados')) blocked = true;
    });
    for (let i = 0; i < 15; i++) {
      sock.emit('message:send', { consultationId: consult.id, content: `ráfaga ${i}` });
    }
    await delay(600);
    expect(blocked).toBe(true);
    sock.close();
  });
});
