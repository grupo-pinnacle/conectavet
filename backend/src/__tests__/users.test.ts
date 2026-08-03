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
  const hashed = await bcrypt.hash('123456', 10);
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
