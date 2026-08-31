import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

const prefix = `authz-${Date.now()}`;
let clientUser: import('@prisma/client').User;
let vetUser: import('@prisma/client').User;
let adminUser: import('@prisma/client').User;
let clientToken: string;
let vetToken: string;
let adminToken: string;

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  [clientUser, vetUser, adminUser] = await Promise.all([
    prisma.user.create({ data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET' } }),
    prisma.user.create({ data: { email: `${prefix}-admin@test.com`, password: hashed, role: 'ADMIN' } }),
  ]);
  const sign = (u: import('@prisma/client').User, r: Role) =>
    jwt.sign({ userId: u.id, email: u.email, role: r }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  clientToken = sign(clientUser, 'CLIENT');
  vetToken = sign(vetUser, 'VET');
  adminToken = sign(adminUser, 'ADMIN');
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

describe('Matriz de autorización negativa (T-02)', () => {
  test('GET /api/users/vets — CLIENT bloqueado (403), VET/ADMIN permitidos (200)', async () => {
    const client = await request(app).get('/api/users/vets').set('Authorization', `Bearer ${clientToken}`);
    const vet = await request(app).get('/api/users/vets').set('Authorization', `Bearer ${vetToken}`);
    const admin = await request(app).get('/api/users/vets').set('Authorization', `Bearer ${adminToken}`);
    expect(client.status).toBe(403);
    expect(vet.status).toBe(200);
    expect(admin.status).toBe(200);
  });

  test('GET /api/users/vets sin token → 401', async () => {
    const res = await request(app).get('/api/users/vets');
    expect(res.status).toBe(401);
  });

  test('POST /api/consultations/:id/prescriptions — CLIENT bloqueado (403), VET/ADMIN pasan el gate (≠403)', async () => {
    const fakeId = 'clinicio-no-existe';
    const client = await request(app)
      .post(`/api/consultations/${fakeId}/prescriptions`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Indicaciones' });
    const vet = await request(app)
      .post(`/api/consultations/${fakeId}/prescriptions`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ content: 'Indicaciones' });
    const admin = await request(app)
      .post(`/api/consultations/${fakeId}/prescriptions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Indicaciones' });
    expect(client.status).toBe(403);
    expect(vet.status).not.toBe(403);
    expect(vet.status).not.toBe(401);
    expect(admin.status).not.toBe(403);
    expect(admin.status).not.toBe(401);
  });

  test('PATCH /api/consultations/:id/assign — CLIENT bloqueado (403), VET/ADMIN pasan el gate (≠403)', async () => {
    const fakeId = 'clinicio-no-existe';
    const client = await request(app)
      .patch(`/api/consultations/${fakeId}/assign`)
      .set('Authorization', `Bearer ${clientToken}`);
    const vet = await request(app)
      .patch(`/api/consultations/${fakeId}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    const admin = await request(app)
      .patch(`/api/consultations/${fakeId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(client.status).toBe(403);
    expect(vet.status).not.toBe(403);
    expect(vet.status).not.toBe(401);
    expect(admin.status).not.toBe(403);
    expect(admin.status).not.toBe(401);
  });
});
