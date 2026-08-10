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
    .send({ petId: pet.id, notes: 'Motivo de prueba' });
  return res.body.data;
}

jest.setTimeout(30000);

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

  test('201 — CLIENT crea consulta eligiendo un vet online específico', async () => {
    await prisma.user.update({ where: { id: vetUser.id }, data: { isOnline: true } });
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Quiero que me atienda este doctor', vetId: vetUser.id });
    expect(res.status).toBe(201);
    expect(res.body.data.vetId).toBe(vetUser.id);
    expect(res.body.data.status).toBe('ACTIVE');
    await prisma.user.update({ where: { id: vetUser.id }, data: { isOnline: false } });
  });

  test('409 — vet offline no se puede elegir', async () => {
    await prisma.user.update({ where: { id: vetUser.id }, data: { isOnline: false } });
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: pet.id, notes: 'Elegí un vet que está offline', vetId: vetUser.id });
    expect(res.status).toBe(409);
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
  let c: any;

  beforeEach(async () => {
    c = await createFreshConsultation();
  });

  test('create, detail y /mine no incluyen password', async () => {
    for (const obj of [c.client, c.vet].filter(Boolean)) {
      expect(obj).not.toHaveProperty('password');
    }

    const detail = await request(app)
      .get(`/api/consultations/${c.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(detail.status).toBe(200);
    for (const obj of [detail.body.data.client, detail.body.data.vet].filter(Boolean)) {
      expect(obj).not.toHaveProperty('password');
    }
    expect(detail.body.data.messages).toBeDefined();

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
    const ids = res.body.data.map((c: any) => c.id);
    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(waiting.id);
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

describe('POST /api/consultations — autoasignación de vet online', () => {
  test('201 — asigna el primer vet online de la especie', async () => {
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
    expect(res.body.data.status).toBe('ACTIVE');

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
  test('201 — asigna la consulta WAITING pendiente al vet recién online', async () => {
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
    expect(detail.body.data.status).toBe('ACTIVE');
    expect(detail.body.data.vetId).toBe(vetUser.id);

    await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
  });
});

describe('POST /api/consultations — dos vets online reparten la cola', () => {
  test('cada consulta WAITING se asigna a un vet distinto sin dejar cola huérfana', async () => {
    const vet2 = await prisma.user.create({
      data: { email: `${prefix}-vet2-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
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
    expect(d1.body.data.status).toBe('ACTIVE');
    expect(d2.body.data.status).toBe('ACTIVE');
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
  });
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

describe('POST /api/consultations/:id/prescriptions', () => {
  let c: any;

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
  let c: any;

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
      .send({ rating: 4 });
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 3 });
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
      .send({ rating: 5 });
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
      .send({ rating: 5 });
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: stranger.id } });
  });

  test('400 — rating fuera de rango', async () => {
    const c = await makeCompletedConsultation();
    const res = await request(app)
      .post(`/api/consultations/${c.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 7 });
    expect(res.status).toBe(400);
  });
});


