import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

const uniqueId = Date.now();
let clientToken: string;
let adminToken: string;
let vetToken: string;
let clientUser: any;

jest.setTimeout(30000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  clientUser = await prisma.user.create({
    data: { email: `users-test-client-${uniqueId}@test.com`, password: hashed, role: 'CLIENT' },
  });
  const adminUser = await prisma.user.create({
    data: { email: `users-test-admin-${uniqueId}@test.com`, password: hashed, role: 'ADMIN' },
  });
  const vetUser = await prisma.user.create({
    data: { email: `users-test-vet-${uniqueId}@test.com`, password: hashed, role: 'VET' },
  });
  clientToken = jwt.sign({ userId: clientUser.id, email: clientUser.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  adminToken = jwt.sign({ userId: adminUser.id, email: adminUser.email, role: 'ADMIN' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  vetToken = jwt.sign({ userId: vetUser.id, email: vetUser.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
});

afterAll(async () => {
  const prefix = `users-test-${uniqueId}`;
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

describe('GET /api/users/me', () => {
  test('200 — devuelve el perfil del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(clientUser.email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/admin-only', () => {
  test('200 — ADMIN accede', async () => {
    const res = await request(app)
      .get('/api/users/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Acceso permitido solo para administradores');
  });

  test('403 — CLIENT no accede', async () => {
    const res = await request(app)
      .get('/api/users/admin-only')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  test('403 — VET no accede', async () => {
    const res = await request(app)
      .get('/api/users/admin-only')
      .set('Authorization', `Bearer ${vetToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/users/vets', () => {
  test('200 — lista veterinarios con paginación', async () => {
    const res = await request(app)
      .get('/api/users/vets')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  test('200 — search filtra por nombre', async () => {
    const vet = await prisma.user.create({
      data: {
        email: `users-test-search-${uniqueId}@test.com`,
        password: 'hashed',
        role: 'VET',
        firstName: 'Zoila',
        lastName: 'Búsqueda',
      },
    });
    const res = await request(app)
      .get(`/api/users/vets?search=${encodeURIComponent('Zoila')}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(vet.id);
    await prisma.user.delete({ where: { id: vet.id } });
  });

  test('200 — search sin matches devuelve lista vacía', async () => {
    const res = await request(app)
      .get('/api/users/vets?search=zzznadieexistee')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  test('200 — online=true filtra solo vets en línea', async () => {
    const onlineVet = await prisma.user.create({
      data: {
        email: `users-test-online-${uniqueId}@test.com`,
        password: 'hashed',
        role: 'VET',
        isOnline: true,
      },
    });
    const res = await request(app)
      .get('/api/users/vets?online=true')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((v: any) => v.isOnline)).toBe(true);
    await prisma.user.delete({ where: { id: onlineVet.id } });
  });

  test('200 — la lista nunca expone passwords', async () => {
    const res = await request(app)
      .get('/api/users/vets')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((v: any) => !('password' in v))).toBe(true);
  });
});

describe('PATCH /api/users/me/availability', () => {
  test('200 — VET cambia su disponibilidad', async () => {
    const res = await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isOnline).toBe(true);

    const off = await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: false });
    expect(off.body.data.isOnline).toBe(false);
  });

  test('400 — isOnline no es booleano', async () => {
    const res = await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ isOnline: 'si' });
    expect(res.status).toBe(400);
  });

  test('403 — CLIENT no puede cambiar disponibilidad', async () => {
    const res = await request(app)
      .patch('/api/users/me/availability')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ isOnline: true });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/users/me — perfil editable', () => {
  test('200 — CLIENT actualiza nombre, teléfono y bio', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ firstName: 'María', lastName: 'Gómez', phone: '+54 11 5555 1234', bio: 'Amo a mi perro' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe('María');
    expect(res.body.data.phone).toBe('+54 11 5555 1234');
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('200 — VET actualiza especialidad', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ specialty: 'Cardiología felina' });
    expect(res.status).toBe(200);
    expect(res.body.data.specialty).toBe('Cardiología felina');
  });

  test('400 — body vacío', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('401 — sin token', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/vets/:id — detalle de veterinario', () => {
  test('200 — devuelve perfil público con rating', async () => {
    const vet = await prisma.user.create({
      data: {
        email: `users-test-detail-${uniqueId}@test.com`,
        password: 'hash',
        role: 'VET',
        firstName: 'Detalle',
        lastName: 'Vet',
        specialty: 'Dermatología',
        bio: 'Especialista en piel',
      },
    });
    const res = await request(app)
      .get(`/api/users/vets/${vet.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.specialty).toBe('Dermatología');
    expect(res.body.data.ratingAvg).toBe(null);
    expect(res.body.data.ratingCount).toBe(0);
    expect(res.body.data).not.toHaveProperty('password');
    await prisma.user.delete({ where: { id: vet.id } });
  });

  test('404 — id inexistente', async () => {
    const res = await request(app)
      .get('/api/users/vets/id-que-no-existe')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Favoritos — POST/DELETE /api/users/vets/:id/favorite', () => {
  let favVet: any;

  beforeEach(async () => {
    favVet = await prisma.user.create({
      data: { email: `users-test-fav-${uniqueId}@test.com`, password: 'hash', role: 'VET' },
    });
  });

  afterEach(async () => {
    await prisma.favoriteVet.deleteMany({ where: { vetId: favVet.id } });
    await prisma.user.delete({ where: { id: favVet.id } });
  });

  test('200 — CLIENT agrega y lista favoritos', async () => {
    const add = await request(app)
      .post(`/api/users/vets/${favVet.id}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(add.status).toBe(200);
    expect(add.body.data.favorited).toBe(true);

    const list = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((f: any) => f.vet.id === favVet.id)).toBe(true);
  });

  test('200 — agregar dos veces es idempotente', async () => {
    await request(app)
      .post(`/api/users/vets/${favVet.id}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    const again = await request(app)
      .post(`/api/users/vets/${favVet.id}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(again.status).toBe(200);
  });

  test('200 — DELETE quita el favorito', async () => {
    await request(app)
      .post(`/api/users/vets/${favVet.id}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    const del = await request(app)
      .delete(`/api/users/vets/${favVet.id}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(del.status).toBe(200);
    expect(del.body.data.favorited).toBe(false);

    const list = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(list.body.data.some((f: any) => f.vet.id === favVet.id)).toBe(false);
  });

  test('404 — favorito de vet inexistente', async () => {
    const res = await request(app)
      .post('/api/users/vets/id-que-no-existe/favorite')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(404);
  });

  test('200 — lista de vets marca isFavorite', async () => {
    await request(app)
      .post(`/api/users/vets/${favVet.id}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    const res = await request(app)
      .get('/api/users/vets')
      .set('Authorization', `Bearer ${clientToken}`);
    const found = res.body.data.find((v: any) => v.id === favVet.id);
    expect(found.isFavorite).toBe(true);
  });
});
