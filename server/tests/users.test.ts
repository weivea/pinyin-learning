import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb, DB } from '../src/db/connection.js';

let db: DB;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db });
});

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ nickname: '小明', avatar: '🐰' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nickname: '小明', avatar: '🐰' });
    expect(typeof res.body.id).toBe('number');
  });

  it('returns existing user when nickname exists', async () => {
    const r1 = await request(app).post('/api/users').send({ nickname: '小红', avatar: '🐱' });
    const r2 = await request(app).post('/api/users').send({ nickname: '小红', avatar: '🐶' });
    expect(r2.body.id).toBe(r1.body.id);
    expect(r2.body.avatar).toBe('🐱');
  });

  it('rejects empty nickname', async () => {
    const res = await request(app).post('/api/users').send({ nickname: '', avatar: '🐰' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/users/:id', () => {
  it('returns user by id', async () => {
    const created = await request(app).post('/api/users').send({ nickname: '小蓝', avatar: '🐻' });
    const res = await request(app).get(`/api/users/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.nickname).toBe('小蓝');
  });

  it('returns 404 for missing user', async () => {
    const res = await request(app).get('/api/users/9999');
    expect(res.status).toBe(404);
  });
});
