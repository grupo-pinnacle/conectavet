import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../app';
import { prisma } from '../shared/prisma';

// E2E de contrato: simula el flujo real de un usuario contra el backend
// completo (auth -> mascota -> consulta -> vet -> mensaje -> historial).
// Corre en CI contra Postgres real (mismo harness que las integration tests).
// Protege el formato de la API ante refactors futuros.
const uniqueId = Date.now();
const prefix = `e2e-flow-${uniqueId}`;

let clientToken: string;
let vetToken: string;
let clientUser: import('@prisma/client').User;
let vetUser: import('@prisma/client').User;

jest.setTimeout(30000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  clientUser = await prisma.user.create({
    data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' },
  });
  vetUser = await prisma.user.create({
    data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET', vetStatus: 'APPROVED' },
  });
  const sign = (userId: string, email: string, role: Role) =>
    jwt.sign({ userId, email, role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  clientToken = sign(clientUser.id, clientUser.email, 'CLIENT' as Role);
  vetToken = sign(vetUser.id, vetUser.email, 'VET' as Role);
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  await prisma.pet.deleteMany({ where: { owner: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

describe('E2E — flujo principal cliente ↔ vet', () => {
  test('auth: registro y login reales responden token', async () => {
    const email = `${prefix}-auth-${Date.now()}@test.com`;
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, password: '12345678', firstName: 'E2E', lastName: 'Tester' });
    expect(reg.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email, password: '12345678' });
    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    expect(typeof login.body.data.accessToken).toBe('string');
  });

  test('mascota -> consulta -> asignar vet -> mensaje -> historial', async () => {
    const createPet = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Mascota E2E', species: 'Gato' });
    expect(createPet.status).toBe(201);
    const petId = createPet.body.data.id;

    const create = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId, notes: 'Consulta E2E' });
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe('WAITING');
    const consultationId = create.body.data.id;

    const assign = await request(app)
      .patch(`/api/consultations/${consultationId}/assign`)
      .set('Authorization', `Bearer ${vetToken}`);
    expect(assign.status).toBe(200);
    expect(assign.body.data.status).toBe('ACTIVE');

    const msg = await request(app)
      .post(`/api/consultations/${consultationId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ content: 'Hola doctor E2E' });
    expect(msg.status).toBe(201);
    expect(msg.body.data.content).toBe('Hola doctor E2E');

    const list = await request(app)
      .get(`/api/consultations/${consultationId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.some((m: { content: string }) => m.content === 'Hola doctor E2E')).toBe(true);

    const history = await request(app)
      .get('/api/consultations/my-history')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(history.status).toBe(200);
    expect(history.body.data.some((c: { id: string }) => c.id === consultationId)).toBe(true);
  });

  test('paginación cursor en /my-history no repite ítems', async () => {
    const page1 = await request(app)
      .get('/api/consultations/my-history?limit=1')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(page1.status).toBe(200);
    expect(page1.body.data.length).toBeLessThanOrEqual(1);
    if (page1.body.nextCursor) {
      const page2 = await request(app)
        .get(`/api/consultations/my-history?limit=1&cursor=${encodeURIComponent(page1.body.nextCursor)}`)
        .set('Authorization', `Bearer ${clientToken}`);
      expect(page2.status).toBe(200);
      const ids1 = page1.body.data.map((c: { id: string }) => c.id);
      const ids2 = page2.body.data.map((c: { id: string }) => c.id);
      expect(ids2.some((id: string) => ids1.includes(id))).toBe(false);
    }
  });
});
