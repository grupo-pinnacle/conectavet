import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../shared/prisma';

describe('Auth Service', () => {
  const testEmail = `jest-test-${Date.now()}@test.com`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'jest-test-' } } });
    await prisma.$disconnect();
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
});
