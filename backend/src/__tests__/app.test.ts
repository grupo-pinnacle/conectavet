import request from 'supertest';
import app from '../app';

describe('App - Health & Routes', () => {
  test('GET /health — 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  test('GET /ruta-inexistente — 404', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/login sin body — 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });
});
