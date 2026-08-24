import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

let clientToken: string;
let vetToken: string;
let strangerToken: string;
let clientUser: any;
let vetUser: any;
let pet: any;

const uniqueId = Date.now();
const prefix = `call-test-${uniqueId}`;

jest.setTimeout(30000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);

  clientUser = await prisma.user.create({
    data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' },
  });
  vetUser = await prisma.user.create({
    data: { email: `${prefix}-vet@test.com`, password: hashed, role: 'VET' },
  });
  const stranger = await prisma.user.create({
    data: { email: `${prefix}-stranger@test.com`, password: hashed, role: 'CLIENT' },
  });

  clientToken = jwt.sign({ userId: clientUser.id, email: clientUser.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  vetToken = jwt.sign({ userId: vetUser.id, email: vetUser.email, role: 'VET' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  strangerToken = jwt.sign({ userId: stranger.id, email: stranger.email, role: 'CLIENT' as Role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

  pet = await prisma.pet.create({
    data: { name: 'CallPet', species: 'Perro', ownerId: clientUser.id },
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

async function createActiveConsultation() {
  const consultation = await prisma.consultation.create({
    data: {
      petId: pet.id,
      clientId: clientUser.id,
      vetId: vetUser.id,
      status: 'ACTIVE',
      notes: 'Consulta activa para llamada',
    },
  });
  return consultation;
}

describe('POST /api/calls/:id/token', () => {
  test('401 — sin token', async () => {
    const res = await request(app).post('/api/calls/whatever/token');
    expect(res.status).toBe(401);
  });

  test('403 — un no participante no puede obtener token', async () => {
    const consultation = await createActiveConsultation();
    const res = await request(app)
      .post(`/api/calls/${consultation.id}/token`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
  });

  test('409 — la consulta debe estar ACTIVE para llamar', async () => {
    const consultation = await prisma.consultation.create({
      data: {
        petId: pet.id,
        clientId: clientUser.id,
        vetId: vetUser.id,
        status: 'PENDING',
        notes: 'Aún no aceptada',
      },
    });
    const res = await request(app)
      .post(`/api/calls/${consultation.id}/token`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(409);
  });

  test('200 o 503 — participante de consulta ACTIVE', async () => {
    const livekitConfigured = Boolean(
      process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
    );
    const consultation = await createActiveConsultation();
    const res = await request(app)
      .post(`/api/calls/${consultation.id}/token`)
      .set('Authorization', `Bearer ${clientToken}`);
    if (livekitConfigured) {
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.room).toBe(`consultation-${consultation.id}`);
    } else {
      expect(res.status).toBe(503);
    }
  });
});
