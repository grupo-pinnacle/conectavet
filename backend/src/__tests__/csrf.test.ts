import request from 'supertest';
import app from '../app';
import { generateCsrfToken, getCsrfTokenFromCookie } from '../shared/auth-cookies';

describe('CSRF Protection & Auth Cookies', () => {
  describe('auth-cookies helper functions', () => {
    test('generateCsrfToken genera un token hexadecimal de 64 caracteres', () => {
      const token = generateCsrfToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });

    test('getCsrfTokenFromCookie extrae el token del header Cookie', () => {
      const mockReq = {
        headers: {
          cookie: 'access_token=xyz; csrf_token=test-token-123',
        },
      } as any;
      expect(getCsrfTokenFromCookie(mockReq)).toBe('test-token-123');
    });

    test('getCsrfTokenFromCookie cae de maduro a XSRF-TOKEN si csrf_token no está', () => {
      const mockReq = {
        headers: {
          cookie: 'XSRF-TOKEN=xsrf-val-456',
        },
      } as any;
      expect(getCsrfTokenFromCookie(mockReq)).toBe('xsrf-val-456');
    });
  });

  describe('GET /api/auth/csrf endpoint', () => {
    test('debe retornar csrfToken y establecer cookies csrf_token y XSRF-TOKEN', async () => {
      const res = await request(app).get('/api/auth/csrf');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.csrfToken).toBe('string');

      const rawCookies = res.headers['set-cookie'];
      const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      const hasCsrfCookie = cookies.some((c: string) => c.startsWith('csrf_token='));
      const hasXsrfCookie = cookies.some((c: string) => c.startsWith('XSRF-TOKEN='));
      expect(hasCsrfCookie).toBe(true);
      expect(hasXsrfCookie).toBe(true);
    });
  });

  describe('CSRF Middleware Enforcement', () => {
    const allowedOrigin = 'http://localhost:5173';
    const evilOrigin = 'http://evil.com';
    const csrfToken = 'valid-csrf-token-12345';
    const authCookie = 'access_token=fake-access-token';

    test('rechaza solicitud mutativa con cookie pero sin Origin ni Referer (403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [authCookie])
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Origen no proporcionado/);
    });

    test('rechaza solicitud mutativa con cookie y Origin no permitido (403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [authCookie])
        .set('Origin', evilOrigin)
        .set('x-csrf-token', csrfToken)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Origen no permitido/);
    });

    test('rechaza solicitud mutativa con cookie y Origin permitido pero sin token CSRF (403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [authCookie, `csrf_token=${csrfToken}`])
        .set('Origin', allowedOrigin)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Token CSRF inválido o ausente/);
    });

    test('rechaza solicitud mutativa con token CSRF desacoplado/mismatched (403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [authCookie, `csrf_token=${csrfToken}`])
        .set('Origin', allowedOrigin)
        .set('x-csrf-token', 'wrong-token')
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Token CSRF inválido o ausente/);
    });

    test('permite solicitud mutativa con cookie cuando Origin y token CSRF coinciden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [authCookie, `csrf_token=${csrfToken}`])
        .set('Origin', allowedOrigin)
        .set('x-csrf-token', csrfToken)
        .send({});

      // Pasa el middleware CSRF y llega a la validación del controlador (400 por body incompleto)
      expect(res.status).toBe(400);
      expect(res.body.message).not.toMatch(/CSRF/);
    });

    test('permite solicitud mutativa que usa Authorization: Bearer aunque tenga cookie (omite CSRF check)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [authCookie])
        .set('Authorization', 'Bearer fake-bearer-token')
        .send({});

      // Pasa el middleware CSRF porque tiene cabecera Bearer
      expect(res.status).toBe(400);
      expect(res.body.message).not.toMatch(/CSRF/);
    });

    test('permite solicitudes GET no mutativas sin comprobar CSRF', async () => {
      const res = await request(app)
        .get('/ruta-inexistente')
        .set('Cookie', [authCookie]);

      // No es bloqueada por CSRF (status no es 403 por CSRF, sino 404 por ruta inexistente)
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Ruta no encontrada');
    });
  });
});
