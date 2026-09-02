import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

const prefix = `conc-${Date.now()}`;
let clientUser: import('@prisma/client').User;
let vet1: import('@prisma/client').User;
let vet2: import('@prisma/client').User;
let clientToken: string;
let vet1Token: string;
let vet2Token: string;

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  [clientUser, vet1, vet2] = await Promise.all([
    prisma.user.create({ data: { email: `${prefix}-client@test.com`, password: hashed, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${prefix}-vet1@test.com`, password: hashed, role: 'VET', vetStatus: 'APPROVED' } }),
    prisma.user.create({ data: { email: `${prefix}-vet2@test.com`, password: hashed, role: 'VET', vetStatus: 'APPROVED' } }),
  ]);
  const sign = (u: import('@prisma/client').User, r: Role) =>
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

jest.setTimeout(30000);

async function createConsultation(customPet?: import('@prisma/client').Pet) {
  const targetPet = customPet || await prisma.pet.create({ data: { name: `Pet-${Date.now()}`, species: 'Perro', ownerId: clientUser.id } });
  const res = await request(app)
    .post('/api/consultations')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ petId: targetPet.id, notes: 'Motivo' });
  return res.body.data;
}

describe('Concurrencia: assign race (T-03 / A-05)', () => {
  test('dos vets reclamando a la vez → exactamente uno gana (200) y el otro recibe 409', async () => {
    const consult = await createConsultation();
    const [a, b] = await Promise.all([
      request(app).patch(`/api/consultations/${consult.id}/assign`).set('Authorization', `Bearer ${vet1Token}`),
      request(app).patch(`/api/consultations/${consult.id}/assign`).set('Authorization', `Bearer ${vet2Token}`),
    ]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([200, 409]);

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
    await prisma.consultation.update({
      where: { id: consult.id },
      data: { status: 'ACTIVE', vetId: vet1.id },
    });
    const clientMsgId = `dedup-${Date.now()}`;
    const payload = { content: 'Hola', clientMsgId };
    const [first, second] = await Promise.all([
      request(app).post(`/api/consultations/${consult.id}/messages`).set('Authorization', `Bearer ${clientToken}`).send(payload),
      request(app).post(`/api/consultations/${consult.id}/messages`).set('Authorization', `Bearer ${clientToken}`).send(payload),
    ]);
    expect([first.status, second.status]).toContain(201);

    const messages = await prisma.message.findMany({ where: { consultationId: consult.id, clientMsgId } });
    expect(messages.length).toBe(1);
  });
});
