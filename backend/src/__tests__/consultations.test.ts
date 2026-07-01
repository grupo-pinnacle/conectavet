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
const prefix = `consult-test-${uniqueId}`;

async function createFreshConsultation() {
  const res = await request(app)
    .post('/api/consultations')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ petId: pet.id });
  return res.body.data;
}

beforeAll(async () => {
  const hashed = await bcrypt.hash('123456', 10);

  clientUser = await prisma.user.create({
    data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' },
  });
  vetUser = await prisma.user.create({
    data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET' },
  });

  clientToken = jwt.sign({ userId: clientUser.id, email: clientUser.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  vetToken = jwt.sign({ userId: vetUser.id, email: vetUser.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

  pet = await prisma.pet.create({
    data: { name: 'TestPet', species: 'Perro', ownerId: clientUser.id },
  });
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  await prisma.pet.deleteMany({ where: { owner: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

afterEach(async () => {
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
});

describe('POST /api/consultations', () => {
  test('201 — CLIENT crea consulta', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('WAITING');
    expect(res.body.data.clientId).toBe(clientUser.id);
  });

  test('401 — sin token', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .send({ petId: pet.id });
    expect(res.status).toBe(401);
  });

  test('400 — sin petId', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/consultations/:id/assign', () => {
  let c: any;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('200 — VET asigna consulta', async () => {
    const res = await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.vetId).toBe(vetUser.id);
  });

  test('409 — VET reasigna (ya asignada)', async () => {
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(409);
  });

  test('403 — CLIENT no puede asignar', async () => {
    const res = await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/consultations/:id/complete', () => {
  let c: any;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('200 — VET asignado cierra con notas', async () => {
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .patch(`/api/consultations/${c.id}/complete`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ notes: 'Paciente estable' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  test('403 — VET no asignado no puede cerrar', async () => {
    const otherVet = await prisma.user.create({
      data: { email: `${prefix}-othervet-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
    });
    const otherVetToken = jwt.sign({ userId: otherVet.id, email: otherVet.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .patch(`/api/consultations/${c.id}/complete`)
      .set('Authorization', `Bearer ${otherVetToken}`)
      .send({});
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: otherVet.id } });
  });
});

describe('GET /api/consultations/mine', () => {
  beforeEach(async () => {
    await createFreshConsultation();
  });

  test('200 — CLIENT ve sus consultas con paginación', async () => {
    const res = await request(app)
      .get('/api/consultations/mine')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('200 — VET ve consultas disponibles', async () => {
    const res = await request(app)
      .get('/api/consultations/mine')
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/consultations/:id/messages', () => {
  let c: any;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('200 — participante ve mensajes', async () => {
    const res = await request(app)
      .get(`/api/consultations/${c.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('403 — no participante no ve mensajes', async () => {
    const stranger = await prisma.user.create({
      data: { email: `${prefix}-stranger-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const strangerToken = jwt.sign({ userId: stranger.id, email: stranger.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .get(`/api/consultations/${c.id}/messages`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: stranger.id } });
  });
});

describe('GET /api/consultations/:id', () => {
  let c: any;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('200 — participante ve detalle', async () => {
    const res = await request(app)
      .get(`/api/consultations/${c.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(c.id);
  });

  test('403 — no participante no ve detalle', async () => {
    const stranger = await prisma.user.create({
      data: { email: `${prefix}-stranger2-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const strangerToken = jwt.sign({ userId: stranger.id, email: stranger.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .get(`/api/consultations/${c.id}`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: stranger.id } });
  });
});

describe('POST /api/auth/logout', () => {
  test('200 — VET logout setea isOnline=false', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: `${prefix}-vet@test.com`, password: '123456' });
    expect(loginRes.body.data.user.isOnline).toBe(true);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${vetToken}`);
    expect(logoutRes.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: vetUser.id } });
    expect(user?.isOnline).toBe(false);
  });
});
