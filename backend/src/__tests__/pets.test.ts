import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

const uniqueId = Date.now();
let clientToken: string;
let vetToken: string;
let clientUser: import('@prisma/client').User;
let createdPetId: string;

jest.setTimeout(30000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  clientUser = await prisma.user.create({
    data: { email: `pets-test-client-${uniqueId}@test.com`, password: hashed, role: 'CLIENT' },
  });
  const vetUser = await prisma.user.create({
    data: { email: `pets-test-vet-${uniqueId}@test.com`, password: hashed, role: 'VET' },
  });
  clientToken = jwt.sign({ userId: clientUser.id, email: clientUser.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  vetToken = jwt.sign({ userId: vetUser.id, email: vetUser.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
});

afterAll(async () => {
  const prefix = `pets-test-${uniqueId}`;
  await prisma.pet.deleteMany({ where: { owner: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

describe('POST /api/pets', () => {
  test('201 — crea mascota con todos los campos', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Firulais', species: 'Perro', breed: 'Labrador', age: 3, weight: 25.5 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Firulais');
    expect(res.body.data.species).toBe('Perro');
    expect(res.body.data.breed).toBe('Labrador');
    expect(res.body.data.age).toBe(3);
    expect(res.body.data.weight).toBe(25.5);
    expect(res.body.data.ownerId).toBe(clientUser.id);
    createdPetId = res.body.data.id;
  });

  test('201 — crea mascota solo con campos requeridos', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Minino', species: 'Gato' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Minino');
    expect(res.body.data.species).toBe('Gato');
  });

  test('400 — sin nombre', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ species: 'Perro' });
    expect(res.status).toBe(400);
  });

test('400 — sin especie', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Firulais' });
    expect(res.status).toBe(400);
  });

  test('400 — birthDate inválida da 400 (no 500)', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'FechaMala', species: 'Perro', birthDate: 'asdf' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Fecha de nacimiento inválida');
  });

  test('201 — birthDate válida se acepta', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'ConFecha', species: 'Perro', birthDate: '2021-05-12' });
    expect(res.status).toBe(201);
    expect(res.body.data.birthDate).toBeTruthy();
  });

  test('401 — sin token', async () => {
    const res = await request(app)
      .post('/api/pets')
      .send({ name: 'Firulais', species: 'Perro' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/pets', () => {
  test('200 — lista mascotas del cliente', async () => {
    const res = await request(app)
      .get('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  test('200 — paginación funciona', async () => {
    const res = await request(app)
      .get('/api/pets?page=1&limit=1')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/pets/:id', () => {
  test('200 — dueño ve su mascota', async () => {
    const res = await request(app)
      .get(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdPetId);
    expect(res.body.data.owner.email).toBe(clientUser.email);
  });

  test('404 — mascota inexistente', async () => {
    const res = await request(app)
      .get('/api/pets/id-inexistente')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(404);
  });

  test('200 — VET puede ver cualquier mascota', async () => {
    const res = await request(app)
      .get(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(200);
  });

  test('403 — otro CLIENT no puede ver', async () => {
    const otherClient = await prisma.user.create({
      data: { email: `pets-test-other-view-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const otherToken = jwt.sign({ userId: otherClient.id, email: otherClient.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .get(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: otherClient.id } });
  });
});

describe('PUT /api/pets/:id', () => {
  test('200 — dueño actualiza mascota', async () => {
    const res = await request(app)
      .put(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Firulais 2', weight: 26 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Firulais 2');
    expect(res.body.data.weight).toBe(26);
  });

  test('403 — otro CLIENT no puede actualizar', async () => {
    const otherClient = await prisma.user.create({
      data: { email: `pets-test-other-${uniqueId}@test.com`, password: 'hash', role: 'CLIENT' },
    });
    const otherToken = jwt.sign({ userId: otherClient.id, email: otherClient.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    const res = await request(app)
      .put(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
    await prisma.user.delete({ where: { id: otherClient.id } });
  });

  test('400 — edad inválida', async () => {
    const res = await request(app)
      .put(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ age: -1 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/pets/:id', () => {
  test('200 — dueño elimina mascota (soft delete)', async () => {
    const res = await request(app)
      .delete(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Mascota eliminada');
  });

  test('404 — mascota eliminada no se ve', async () => {
    const res = await request(app)
      .get(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/pets/:id/restore', () => {
  test('200 — dueño restaura mascota', async () => {
    const res = await request(app)
      .post(`/api/pets/${createdPetId}/restore`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdPetId);
  });

  test('200 — mascota visible después de restaurar', async () => {
    const res = await request(app)
      .get(`/api/pets/${createdPetId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
  });
});
