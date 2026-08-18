import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

const prefix = `conc-${Date.now()}`;
let clientUser: any;
let vet1: any;
let vet2: any;
let pet: any;
let clientToken: string;
let vet1Token: string;
let vet2Token: string;

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  [clientUser, vet1, vet2] = await Promise.all([
    prisma.user.create({ data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${prefix}-vet1@test.com`, password: hashed, role: 'VET' } }),
    prisma.user.create({ data: { email: `${prefix}-vet2@test.com`, password: hashed, role: 'VET' } }),
  ]);
  pet = await prisma.pet.create({ data: { name: 'TestPet', species: 'Perro', ownerId: clientUser.id } });
  const sign = (u: any, r: Role) =>
    jwt.sign({ userId: u.id, email: u.email, role: r }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  clientToken = sign(clientUser, 'CLIENT');
  vet1Token = sign(vet1, 'VET');
  vet2Token = sign(vet2, 'VET');
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { consultation: { client: { email: { startsWith: prefix } } } } });
  await prisma.consultation.deleteMany({ where: { client: { email: { startsWith: prefix } } } });
  await prisma.pet.deleteMany({ where: { owner: { email: { startsWith: prefix } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

async function createConsultation() {
  const res = await request(app)
    .post('/api/consultations')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ petId: pet.id, notes: 'Motivo' });
  return res.body.data;
}

describe('Concurrencia: assign race (T-03 / A-05)', () => {
  test('dos vets reclamando a la vez → exactamente uno gana (200) y el otro recibe 409', async () => {
    const consult = await createConsultation();
    const [a, b] = await Promise.all([
      request(app).patch(`/api/consultations/${consult.id}/assign`).set('Authorization', `Bearer ${vet1Token}`),
      request(app).patch(`/api/consultations/${consult.id}/assign`).set('Authorization', `Bearer ${vet2Token}`),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([409, 200]);

    const after = await request(app).get(`/api/consultations/${consult.id}`).set('Authorization', `Bearer ${clientToken}`);
    const assignedVet = after.body.data.vetId;
    expect([vet1.id, vet2.id]).toContain(assignedVet);
    // Una sola asignación ganadora.
    expect(assignedVet === vet1.id || assignedVet === vet2.id).toBe(true);
  });
});

describe('Concurrencia: dedup de message:send por clientMsgId (T-03)', () => {
  test('mismo clientMsgId enviado dos veces → un solo mensaje persistido', async () => {
    const consult = await createConsultation();
    const clientMsgId = `dedup-${Date.now()}`;
    const payload = { content: 'Hola', clientMsgId };
    const [first, second] = await Promise.all([
      request(app).post(`/api/consultations/${consult.id}/messages`).set('Authorization', `Bearer ${clientToken}`).send(payload),
      request(app).post(`/api/consultations/${consult.id}/messages`).set('Authorization', `Bearer ${clientToken}`).send(payload),
    ]);
    expect([first.status, second.status]).toContain(200);

    const messages = await prisma.message.findMany({ where: { consultationId: consult.id, clientMsgId } });
    expect(messages.length).toBe(1);
  });
});
