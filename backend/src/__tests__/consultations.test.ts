import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

let clientToken: string;
let vetToken: string;
let clientUser: import('@prisma/client').User;
let vetUser: import('@prisma/client').User;
let pet: import('@prisma/client').Pet;

const uniqueId = Date.now();
const prefix = `consult-test-${uniqueId}`;

async function createFreshConsultation() {
  const freshPet = await prisma.pet.create({
    data: { name: `Pet-${Date.now()}-${Math.floor(Math.random() * 100000)}`, species: 'Perro', ownerId: clientUser.id },
  });
  const res = await request(app)
    .post('/api/consultations')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ petId: freshPet.id, notes: 'Motivo de prueba' });
  return res.body.data;
}

jest.setTimeout(60000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);

  clientUser = await prisma.user.create({
    data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' },
  });
  vetUser = await prisma.user.create({
    data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET', vetStatus: 'APPROVED' },
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
  await prisma.user.updateMany({ where: { email: { startsWith: prefix } }, data: { isOnline: false } });
});

describe('POST /api/consultations', () => {
  test('201 — CLIENT crea consulta', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Motivo de prueba' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('WAITING');
    expect(res.body.data.clientId).toBe(clientUser.id);
  });

  test('401 — sin token', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .send({ petId: pet.id, notes: 'Motivo de prueba' });
    expect(res.status).toBe(401);
  });

  test('400 — sin petId', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('201 — CLIENT crea consulta eligiendo un vet: queda como oferta PENDING (el vet decide)', async () => {
    await prisma.user.update({ where: { id: vetUser.id }, data: { isOnline: true } });
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Quiero que me atienda este doctor', vetId: vetUser.id });
    expect(res.status).toBe(201);
    expect(res.body.data.vetId).toBe(vetUser.id);
    expect(res.body.data.status).toBe('PENDING');
    await prisma.user.update({ where: { id: vetUser.id }, data: { isOnline: false } });
  });

  test('201 — CLIENT elige un vet offline: igual queda PENDING para cuando se conecte', async () => {
    await prisma.user.update({ where: { id: vetUser.id }, data: { isOnline: false } });
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Elegí un vet que está offline', vetId: vetUser.id });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.vetId).toBe(vetUser.id);
  });

  test('404 — vet inexistente no se puede elegir', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Vet que no existe', vetId: 'id-que-no-existe' });
    expect(res.status).toBe(404);
  });

  test('404 — un CLIENT no puede ser elegido como vet', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Elegir un client como vet', vetId: clientUser.id });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/consultations — ownership de mascota (IDOR)', () => {
  test('403 — CLIENT no puede crear consulta con pet ajeno', async () => {
    const stranger = await prisma.user.create({
      data: { email: `${prefix}-stranger-owner-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const strangerPet = await prisma.pet.create({
      data: { name: 'PetAjeno', species: 'Gato', ownerId: stranger.id },
    });
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: strangerPet.id, notes: 'Intento de consulta sobre mascota ajena' });
    expect(res.status).toBe(403);
  });
});

describe('Seguridad — password no se expone en respuestas', () => {
  let c: import('@prisma/client').Consultation;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('create, detail y /mine no incluyen password', async () => {
    for (const obj of [(c as any).client, (c as any).vet].filter(Boolean)) {
      expect(obj).not.toHaveProperty('password');
    }

    const detail = await request(app)
      .get(`/api/consultations/${c.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(detail.status).toBe(200);
    for (const obj of [detail.body.data.client, detail.body.data.vet].filter(Boolean)) {
      expect(obj).not.toHaveProperty('password');
    }
    expect(detail.body.data.id).toBe(c.id);

    const mine = await request(app)
      .get('/api/consultations/mine')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(mine.status).toBe(200);
    for (const obj of [mine.body.data[0].client, mine.body.data[0].vet].filter(Boolean)) {
      expect(obj).not.toHaveProperty('password');
    }
  });

  test('messages no incluyen password del sender', async () => {
    await request(app)
      .post(`/api/consultations/${c.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hola doctor' });
    const res = await request(app)
      .get(`/api/consultations/${c.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const m of res.body.data) {
      expect(m.sender).not.toHaveProperty('password');
    }
  });
});

describe('GET /api/consultations/my-history', () => {
  test('VET solo ve sus consultas, no la cola ajena', async () => {
    const waiting = await createFreshConsultation();
    const mine = await createFreshConsultation();
    await request(app)
      .patch(`/api/consultations/${mine.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);

    const res = await request(app)
      .get('/api/consultations/my-history')
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((c: { id: string }) => c.id);
    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(waiting.id);
  });
});

describe('PATCH /api/consultations/:id/assign', () => {
  let c: import('@prisma/client').Consultation;

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

  test('409 — dos vets no toman la misma consulta WAITING (el primero gana, el claim es atómico)', async () => {
    const vet2 = await prisma.user.create({
      data: { email: `${prefix}-vet-concurrent-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
    });
    const vet2Token = jwt.sign(
      { userId: vet2.id, email: vet2.email, role: 'VET' as Role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    const [first, second] = await Promise.all([
      request(app).patch(`/api/consultations/${c.id}/assign`).set('Authorization', `Bearer ${vetToken}`),
      request(app).patch(`/api/consultations/${c.id}/assign`).set('Authorization', `Bearer ${vet2Token}`),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
    const detail = await request(app)
      .get(`/api/consultations/${c.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(detail.body.data.vetId).not.toBeNull();
    await prisma.user.delete({ where: { id: vet2.id } });
  });
});

describe('PATCH /api/consultations/:id/decline', () => {
  test('409 — no se puede rechazar una consulta WAITING sin oferta', async () => {
    const c = await createFreshConsultation();
    expect(c.status).toBe('WAITING');
    const res = await request(app)
      .patch(`/api/consultations/${c.id}/decline`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(409);
  });

  test('403 — CLIENT no puede rechazar', async () => {
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });
    const created = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Oferta para rechazar' });
    expect(created.body.data.status).toBe('PENDING');
    const res = await request(app)
      .patch(`/api/consultations/${created.body.data.id}/decline`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
  });

  test('409 — otro vet no puede rechazar la oferta ajena', async () => {
    const vet2 = await prisma.user.create({
      data: { email: `${prefix}-vet-ajeno2-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
    });
    const vet2Token = jwt.sign({ userId: vet2.id, email: vet2.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });
    const created = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Oferta ajena para rechazar' });
    expect(created.body.data.status).toBe('PENDING');
    const res = await request(app)
      .patch(`/api/consultations/${created.body.data.id}/decline`)
      .set('Authorization', `Bearer ${vet2Token}`);
    expect(res.status).toBe(409);
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
    await prisma.user.delete({ where: { id: vet2.id } });
  });
});

describe('PATCH /api/consultations/:id/complete', () => {
  let c: import('@prisma/client').Consultation;

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

describe('POST /api/consultations — autoasignación de vet online', () => {
  test('201 — ofrece al primer vet online de la especie (PENDING, el vet decide)', async () => {
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });

    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Motivo de prueba' });
    expect(res.status).toBe(201);
    expect(res.body.data.vetId).toBe(vetUser.id);
    expect(res.body.data.status).toBe('PENDING');

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
  });

  test('201 — sin vet online queda en espera', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Motivo de prueba' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('WAITING');
    expect(res.body.data.vetId).toBeNull();
  });
});

describe('POST /api/consultations — cola de espera: vet se pone online', () => {
  test('201 — al ponerse online recibe la WAITING como oferta PENDING y la puede aceptar', async () => {
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });

    const created = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'En cola de espera' });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('WAITING');
    expect(created.body.data.vetId).toBeNull();

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });

    const detail = await request(app)
      .get(`/api/consultations/${created.body.data.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(detail.body.data.status).toBe('PENDING');
    expect(detail.body.data.vetId).toBe(vetUser.id);

    const accept = await request(app)
      .patch(`/api/consultations/${created.body.data.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('ACTIVE');

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
  });

  test('200 — VET rechaza la oferta: vuelve a la cola sin vet asignado', async () => {
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });

    const created = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Para rechazar' });
    expect(created.body.data.status).toBe('PENDING');

    const decline = await request(app)
      .patch(`/api/consultations/${created.body.data.id}/decline`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(decline.status).toBe(200);
    expect(decline.body.data.status).toBe('WAITING');
    expect(decline.body.data.vetId).toBeNull();

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
  });

  test('409 — otro vet no puede aceptar la oferta ajena', async () => {
    const vet2 = await prisma.user.create({
      data: { email: `${prefix}-vet-ajeno-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
    });
    const vet2Token = jwt.sign({ userId: vet2.id, email: vet2.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });

    const created = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Oferta ajena' });
    expect(created.body.data.status).toBe('PENDING');

    const res = await request(app)
      .patch(`/api/consultations/${created.body.data.id}/assign`)
      .set('Authorization', `Bearer ${vet2Token}`);
    expect(res.status).toBe(409);

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
    await prisma.user.delete({ where: { id: vet2.id } });
  });
});

describe('POST /api/consultations — dos vets online reparten la cola', () => {
  test('cada consulta WAITING se asigna a un vet distinto sin dejar cola huérfana', async () => {
    const vet2 = await prisma.user.create({
      data: { email: `${prefix}-vet2-${uniqueId}@test.com`, password: 'hash', role: 'VET', vetStatus: 'APPROVED' },
    });
    const vet2Token = jwt.sign({ userId: vet2.id, email: vet2.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });

    const c1 = await createFreshConsultation();
    const c2 = await createFreshConsultation();
    expect(c1.status).toBe('WAITING');
    expect(c2.status).toBe('WAITING');

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vet2Token}`)
      .send({ isOnline: true });

    const d1 = await request(app)
      .get(`/api/consultations/${c1.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    const d2 = await request(app)
      .get(`/api/consultations/${c2.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(d1.body.data.status).toBe('PENDING');
    expect(d2.body.data.status).toBe('PENDING');
    expect(d1.body.data.vetId).not.toBe(d2.body.data.vetId);
    expect([d1.body.data.vetId, d2.body.data.vetId].sort()).toEqual([vetUser.id, vet2.id].sort());

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vet2Token}`)
      .send({ isOnline: false });
    await prisma.user.delete({ where: { id: vet2.id } });
  }, 60000);
});

describe('POST /api/consultations/:id/messages — solo en consulta ACTIVA', () => {
  test('409 — no se puede enviar mensaje en consulta WAITING', async () => {
    const c = await createFreshConsultation();
    const res = await request(app)
      .post(`/api/consultations/${c.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hola en cola' });
    expect(res.status).toBe(409);
  });

  test('201 — sí se puede enviar cuando está ACTIVE', async () => {
    const c = await createFreshConsultation();
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .post(`/api/consultations/${c.id}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hola cuando está activa' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/consultations/:id/messages', () => {
  let c: import('@prisma/client').Consultation;

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
  let c: import('@prisma/client').Consultation;

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

describe('POST /api/consultations/:id/prescriptions', () => {
  let c: import('@prisma/client').Consultation;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('201 — VET asignado crea receta', async () => {
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .post(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ content: 'Amoxicilina 500mg cada 8hs por 7 días' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vetId).toBe(vetUser.id);
  });

  test('201 — receta con campos estructurados', async () => {
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .post(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({
        content: 'Amoxicilina 500mg cada 8hs por 7 días',
        medication: 'Amoxicilina 500mg',
        dosage: '500 mg',
        frequency: 'Cada 8 horas',
        durationDays: '7',
        indications: 'Tomar después de comer',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.medication).toBe('Amoxicilina 500mg');
    expect(res.body.data.dosage).toBe('500 mg');
    expect(res.body.data.frequency).toBe('Cada 8 horas');
    expect(res.body.data.durationDays).toBe('7');
    expect(res.body.data.indications).toBe('Tomar después de comer');
  });

  test('400 — receta vacía', async () => {
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .post(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  test('403 — VET no asignado no puede crear receta', async () => {
    const otherVet = await prisma.user.create({
      data: { email: `${prefix}-othervet-rx-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
    });
    const otherVetToken = jwt.sign({ userId: otherVet.id, email: otherVet.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .post(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${otherVetToken}`)
      .send({ content: 'Receta de otro vet' });
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: otherVet.id } });
  });

  test('403 — CLIENT no puede crear receta', async () => {
    const res = await request(app)
      .post(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Receta del cliente' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/consultations/:id/prescriptions', () => {
  let c: import('@prisma/client').Consultation;

  beforeEach(async () => {
    c = await createFreshConsultation();
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    await request(app)
      .post(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ content: 'Ibuprofeno 400mg cada 12hs' });
  });

  test('200 — participante ve recetas', async () => {
    const res = await request(app)
      .get(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].content).toContain('Ibuprofeno');
  });

  test('403 — no participante no ve recetas', async () => {
    const stranger = await prisma.user.create({
      data: { email: `${prefix}-stranger3-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const strangerToken = jwt.sign({ userId: stranger.id, email: stranger.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .get(`/api/consultations/${c.id}/prescriptions`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: stranger.id } });
  });
});

describe('POST /api/consultations/:id/rating', () => {
  async function makeCompletedConsultation() {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Consulta para calificar' });
    const c = res.body.data;
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    await request(app)
      .patch(`/api/consultations/${c.id}/complete`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ notes: 'Cierre para rating' });
    return c;
  }

  afterEach(async () => {
    await prisma.review.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  });

  test('201 — CLIENT califica una consulta completada', async () => {
    const c = await makeCompletedConsultation();
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 5, comment: 'Excelente atención' });
    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.vetId).toBe(vetUser.id);
  });

  test('409 — no se puede calificar dos veces la misma consulta', async () => {
    const c = await makeCompletedConsultation();
    await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 4, comment: 'Muy buena la atención recibida' });
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 3, comment: 'Segunda opinión de prueba' });
    expect(res.status).toBe(409);
  });

  test('409 — no se puede calificar una consulta no finalizada', async () => {
    const c = await createFreshConsultation();
    await request(app)
      .patch(`/api/consultations/${c.id}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 5, comment: 'Opinión obligatoria de prueba' });
    expect(res.status).toBe(409);
  });

  test('403 — otro CLIENT no califica la consulta ajena', async () => {
    const c = await makeCompletedConsultation();
    const stranger = await prisma.user.create({
      data: { email: `${prefix}-stranger-rating-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const strangerToken = jwt.sign({ userId: stranger.id, email: stranger.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ rating: 5, comment: 'Opinión obligatoria de prueba' });
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: stranger.id } });
  });

  test('400 — rating fuera de rango', async () => {
    const c = await makeCompletedConsultation();
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 11, comment: 'Opinión obligatoria de prueba' });
    expect(res.status).toBe(400);
  });

  test('400 — comentario obligatorio (mínimo 10 caracteres)', async () => {
    const c = await makeCompletedConsultation();
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 8, comment: 'corto' });
    expect(res.status).toBe(400);
  });
});


