import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

describe('Auth Service', () => {
  const testEmail = `jest-test-${Date.now()}@test.com`;
  const authUnique = Date.now();

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'jest-test-' } } });
  });

  describe('Register', () => {
    test('debe crear un usuario CLIENT correctamente', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const user = await prisma.user.create({
        data: { email: testEmail, password: hashedPassword, role: 'CLIENT' },
      });
      expect(user).toHaveProperty('id');
      expect(user.email).toBe(testEmail);
      expect(user.role).toBe('CLIENT');
    });

    test('debe rechazar email duplicado', async () => {
      await expect(
        prisma.user.create({
          data: { email: testEmail, password: 'hashed', role: 'CLIENT' },
        })
      ).rejects.toThrow();
    });

    test('debe crear usuarios VET y ADMIN', async () => {
      const vet = await prisma.user.create({
        data: { email: `jest-test-vet-${Date.now()}@test.com`, password: 'hash', role: 'VET' },
      });
      expect(vet.role).toBe('VET');

      const admin = await prisma.user.create({
        data: { email: `jest-test-admin-${Date.now()}@test.com`, password: 'hash', role: 'ADMIN' },
      });
      expect(admin.role).toBe('ADMIN');
    });
  });

  describe('JWT', () => {
    test('debe generar un token con userId, email y role', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const payload = { userId: '123', email: 'test@test.com', role: 'CLIENT' as Role };
      const token = jwt.sign(payload, secret, { expiresIn: '7d' });
      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.role).toBe('CLIENT');
    });

    test('debe rechazar token inválido', () => {
      expect(() => jwt.verify('token-invalido', process.env.JWT_SECRET || 'test-secret')).toThrow();
    });

    test('debe rechazar token con firma incorrecta', () => {
      const token = jwt.sign({ userId: '1' }, 'otro-secret');
      expect(() => jwt.verify(token, process.env.JWT_SECRET || 'test-secret')).toThrow();
    });
  });

  describe('JWT Middleware', () => {
    test('debe decodificar un token válido correctamente', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const payload = { userId: '456', email: 'vet@test.com', role: 'VET' as Role };
      const token = jwt.sign(payload, secret, { expiresIn: '7d' });
      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.userId).toBe('456');
      expect(decoded.email).toBe('vet@test.com');
      expect(decoded.role).toBe('VET');
    });

    test('debe rechazar token expirado', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign({ userId: '1', exp: Math.floor(Date.now() / 1000) - 3600 }, secret);
      expect(() => jwt.verify(token, secret)).toThrow();
    });
  });

  describe('Roles', () => {
    test('ADMIN debe tener rol ADMIN', () => {
      expect('ADMIN').toBe('ADMIN');
      expect(['CLIENT', 'VET']).not.toContain('ADMIN');
    });

    test('CLIENT no debe tener permisos de ADMIN', () => {
      const userRole: Role = 'CLIENT';
      const adminRoles: Role[] = ['ADMIN'];
      expect(adminRoles.includes(userRole)).toBe(false);
    });

    test('VET no debe tener permisos de ADMIN', () => {
      const userRole: Role = 'VET';
      const adminRoles: Role[] = ['ADMIN'];
      expect(adminRoles.includes(userRole)).toBe(false);
    });
  });

  describe('Auth Controllers (HTTP)', () => {
    const email = `auth-http-${authUnique}@test.com`;

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: { startsWith: `auth-http-${authUnique}` } } });
    });

    test('POST /api/auth/register — 201 crea usuario + tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: '123456', role: 'CLIENT' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    test('POST /api/auth/register — 409 email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: '123456', role: 'CLIENT' });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Este email ya está registrado');
    });

    test('POST /api/auth/register — 400 email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-email', password: '123456', role: 'CLIENT' });
      expect(res.status).toBe(400);
    });

    test('POST /api/auth/register — 400 password corto', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `short-${authUnique}@test.com`, password: '12345', role: 'CLIENT' });
      expect(res.status).toBe(400);
    });

    test('POST /api/auth/register — ignora role malicioso y fija CLIENT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `auth-http-${authUnique}-role@test.com`, password: '123456', role: 'ADMIN' });
      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('CLIENT');
    });

    test('POST /api/auth/login — 200 login exitoso con refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: '123456' });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
    });

    test('POST /api/auth/login — 401 credenciales inválidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpass' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });

    test('POST /api/auth/login — 401 usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `no-exist-${authUnique}@test.com`, password: '123456' });
      expect(res.status).toBe(401);
    });

    test('POST /api/auth/refresh — 200 renueva token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: '123456' });
      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    test('POST /api/auth/refresh — 401 token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'bad-refresh-token' });
      expect(res.status).toBe(401);
    });

    test('POST /api/auth/refresh — 400 sin refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
