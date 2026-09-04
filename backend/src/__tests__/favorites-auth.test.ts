/**
 * Reporte API — Cerco B: favoritos es concepto CLIENT.
 * ADMIN/VET reciben 403; CLIENT conserva 200. Integración con DB aislada.
 */
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

jest.setTimeout(60000);

const uniqueId = Date.now();
const prefix = `fav-auth-test-${uniqueId}`;

let adminToken: string;
let vetToken: string;
let clientToken: string;
let someVetId: string;

function sign(userId: string, email: string, role: Role) {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
}

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  const admin = await prisma.user.create({
    data: { email: `${prefix}-admin@test.com`, password: hashed, role: 'ADMIN' },
  });
  const vetUser = await prisma.user.create({
    data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET', vetStatus: 'APPROVED' },
  });
  const client = await prisma.user.create({
    data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' },
  });
  const target = await prisma.user.create({
    data: { email: `${prefix}-target@test.com`, password: hashed, role: 'VET', vetStatus: 'APPROVED' },
  });
  someVetId = target.id;
  adminToken = sign(admin.id, admin.email, 'ADMIN');
  vetToken = sign(vetUser.id, vetUser.email, 'VET');
  clientToken = sign(client.id, client.email, 'CLIENT');
});

afterAll(async () => {
  await prisma.favoriteVet.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

describe('Reporte API — favoritos solo CLIENT', () => {
  test('403 — ADMIN no lista favoritos (bug reportado)', async () => {
    const res = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  test('403 — ADMIN no puede agregar favorito', async () => {
    const res = await request(app)
      .post(`/api/users/vets/${someVetId}/favorite`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  test('403 — VET no lista ni agrega favoritos', async () => {
    const list = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${vetToken}`);
    expect(list.status).toBe(403);
    const add = await request(app)
      .post(`/api/users/vets/${someVetId}/favorite`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(add.status).toBe(403);
    const del = await request(app)
      .delete(`/api/users/vets/${someVetId}/favorite`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(del.status).toBe(403);
  });

  test('200 — CLIENT conserva el flujo completo', async () => {
    const add = await request(app)
      .post(`/api/users/vets/${someVetId}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(add.status).toBe(200);
    const list = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((f: { vet: { id: string } }) => f.vet.id === someVetId)).toBe(true);
    const del = await request(app)
      .delete(`/api/users/vets/${someVetId}/favorite`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(del.status).toBe(200);
  });
});
