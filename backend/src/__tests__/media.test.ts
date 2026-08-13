import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { prisma } from '../shared/prisma';

let token: string;
let userId: string;

const uniqueId = Date.now();
const prefix = `media-test-${uniqueId}`;

jest.setTimeout(30000);

beforeAll(async () => {
  const hashed = await bcrypt.hash('12345678', 10);
  const user = await prisma.user.create({
    data: { email: `${prefix}@test.com`, password: hashed, role: 'CLIENT' },
  });
  userId = user.id;
  token = jwt.sign(
    { userId, email: user.email, role: 'CLIENT' as Role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
});

afterAll(async () => {
  await prisma.attachment.deleteMany({ where: { uploaderId: userId } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
});

describe('POST /api/media', () => {
  test('201 — CLIENT sube una imagen y recibe la URL', async () => {
    const res = await request(app)
      .post('/api/media')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('contenido-de-imagen'), {
        filename: 'foto.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/^\/uploads\//);
    expect(res.body.data.mimeType).toBe('image/png');
  });

  test('400 — sin archivo adjunto', async () => {
    const res = await request(app).post('/api/media').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('400 — archivo que no es imagen', async () => {
    const res = await request(app)
      .post('/api/media')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('hola'), { filename: 'nota.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  test('401 — sin token', async () => {
    const res = await request(app)
      .post('/api/media')
      .attach('file', Buffer.from('x'), { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });

  test('201 — la extensión se deriva del MIME, NO del nombre del cliente (previene SVG XSS)', async () => {
    const res = await request(app)
      .post('/api/media')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('contenido'), {
        filename: 'virus.svg',
        contentType: 'image/png',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.url).not.toMatch(/\.svg$/);
    expect(res.body.data.url).toMatch(/\.png$/);
  });

  test('400 — SVG rechazado (no está en los MIME permitidos)', async () => {
    const res = await request(app)
      .post('/api/media')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<svg></svg>'), {
        filename: 'x.svg',
        contentType: 'image/svg+xml',
      });
    expect(res.status).toBe(400);
  });
});
