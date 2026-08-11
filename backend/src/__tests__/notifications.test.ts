import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

let clientToken: string;
let vetToken: string;
let clientUser: any;
let vetUser: any;
let pet: any;

const uniqueId = Date.now();
const prefix = `notif-test-${uniqueId}`;

jest.setTimeout(30000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('123456', 10);

  clientUser = await prisma.user.create({
    data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' },
  });
  vetUser = await prisma.user.create({
    data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET' },
  });

  clientToken = jwt.sign(
    { userId: clientUser.id, email: clientUser.email, role: 'CLIENT' as Role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
  vetToken = jwt.sign(
    { userId: vetUser.id, email: vetUser.email, role: 'VET' as Role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  pet = await prisma.pet.create({
    data: { name: 'TestPet', species: 'Perro', ownerId: clientUser.id },
  });
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { userId: clientUser.id } });
  await prisma.pushToken.deleteMany({ where: { userId: clientUser.id } });
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  await prisma.pet.deleteMany({ where: { owner: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

afterEach(async () => {
  await prisma.notification.deleteMany({ where: { userId: clientUser.id } });
  await prisma.pushToken.deleteMany({ where: { userId: clientUser.id } });
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
});

async function createWaitingConsultation() {
  // Insert directo a la BD: el endpoint público la crearía PENDING si hay
  // cualquier vet online (p.ej. los que dejan las suites paralelas), y este
  // test necesita una WAITING determinística para ejercitar el assign.
  return prisma.consultation.create({
    data: {
      clientId: clientUser.id,
      petId: pet.id,
      status: 'WAITING',
      notes: 'Motivo de prueba de notificación',
    },
  });
}

describe('POST /api/notifications/token', () => {
  test('201 — registra token push', async () => {
    const res = await request(app)
      .post('/api/notifications/token')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ token: 'ExponentPushToken[test-notif-123]', platform: 'android' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('ExponentPushToken[test-notif-123]');
  });

  test('400 — token inválido', async () => {
    const res = await request(app)
      .post('/api/notifications/token')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ token: '', platform: 'android' });
    expect(res.status).toBe(400);
  });

  test('401 — sin token', async () => {
    const res = await request(app).post('/api/notifications/token').send({
      token: 'ExponentPushToken[x]',
      platform: 'android',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/notifications', () => {
  test('200 — cliente recién creado no tiene notificaciones', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(0);
    expect(res.body.data.items.length).toBe(0);
  });
});

describe('Notificaciones por eventos', () => {
  test('asignar consulta crea notificación para el cliente', async () => {
    const consultation = await createWaitingConsultation();
    expect(consultation.status).toBe('WAITING');

    const res = await request(app)
      .patch(`/api/consultations/${consultation.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(200);

    const list = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
    const notif = list.body.data.items.find((n: any) => n.type === 'consultation_assigned');
    expect(notif).toBeTruthy();
    expect(notif.title).toBe('Un veterinario tomó tu consulta');
  });

  test('mensaje del cliente crea notificación para el vet', async () => {
    const consultation = await createWaitingConsultation();
    await request(app)
      .patch(`/api/consultations/${consultation.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);

    const msg = await request(app)
      .post(`/api/consultations/${consultation.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hola doc' });
    expect(msg.status).toBe(201);

    const list = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${vetToken}`);
    const notif = list.body.data.items.find((n: any) => n.type === 'message');
    expect(notif).toBeTruthy();
    expect(notif.title).toBe('Nuevo mensaje');
  });

  test('marcar como leída decrementa el contador', async () => {
    const consultation = await createWaitingConsultation();
    await request(app)
      .patch(`/api/consultations/${consultation.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);

    const list = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${clientToken}`);
    const target = list.body.data.items.find((n: any) => n.type === 'consultation_assigned');
    expect(target).toBeTruthy();

    const res = await request(app)
      .patch(`/api/notifications/${target.id}/read`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);

    const after = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(after.body.data.unreadCount).toBe(0);
  });
});

describe('POST /api/consultations/:id/messages — imagen adjunta', () => {
  test('201 — mensaje solo con imagen', async () => {
    const consultation = await createWaitingConsultation();
    await request(app)
      .patch(`/api/consultations/${consultation.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);

    const res = await request(app)
      .post(`/api/consultations/${consultation.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ attachmentUrl: '/uploads/test-foto.png' });
    expect(res.status).toBe(201);
    expect(res.body.data.attachmentUrl).toBe('/uploads/test-foto.png');
    expect(res.body.data.content).toBe('');
  });

  test('400 — sin contenido ni imagen', async () => {
    const consultation = await createWaitingConsultation();
    const res = await request(app)
      .post(`/api/consultations/${consultation.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('400 — attachmentUrl que no empieza con /uploads/', async () => {
    const consultation = await createWaitingConsultation();
    const res = await request(app)
      .post(`/api/consultations/${consultation.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ attachmentUrl: 'https://evil.com/x.png' });
    expect(res.status).toBe(400);
  });
});