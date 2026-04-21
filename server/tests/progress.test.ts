import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb, DB } from '../src/db/connection.js';

let db: DB;
let app: ReturnType<typeof createApp>;
let userId: number;

beforeEach(async () => {
  db = createDb(':memory:');
  app = createApp({ db });
  const r = await request(app).post('/api/users').send({ nickname: 'tester', avatar: '🐰' });
  userId = r.body.id;
});

describe('POST /api/progress/:userId/pinyin', () => {
  it('increments learned_count', async () => {
    const r1 = await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'b' });
    expect(r1.status).toBe(200);
    expect(r1.body.learnedCount).toBe(1);
    const r2 = await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'b' });
    expect(r2.body.learnedCount).toBe(2);
  });

  it('rejects missing pinyin', async () => {
    const res = await request(app).post(`/api/progress/${userId}/pinyin`).send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/progress/:userId/game', () => {
  it('records score and reports new best', async () => {
    const r1 = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'listen', score: 8, stars: 2 });
    expect(r1.body.isNewBest).toBe(true);

    const r2 = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'listen', score: 6, stars: 1 });
    expect(r2.body.isNewBest).toBe(false);

    const r3 = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'listen', score: 10, stars: 3 });
    expect(r3.body.isNewBest).toBe(true);
  });

  it('validates gameType', async () => {
    const res = await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'bad', score: 1, stars: 0 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/progress/:userId', () => {
  it('returns aggregated progress', async () => {
    await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'a' });
    await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'a' });
    await request(app).post(`/api/progress/${userId}/pinyin`).send({ pinyin: 'b' });
    await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'image', score: 7, stars: 2 });
    await request(app).post(`/api/progress/${userId}/game`).send({ gameType: 'image', score: 9, stars: 3 });

    const res = await request(app).get(`/api/progress/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.pinyinProgress).toEqual(expect.arrayContaining([
      expect.objectContaining({ pinyin: 'a', learnedCount: 2 }),
      expect.objectContaining({ pinyin: 'b', learnedCount: 1 }),
    ]));
    expect(res.body.gameScores).toEqual([
      expect.objectContaining({ gameType: 'image', bestScore: 9, bestStars: 3 }),
    ]);
  });
});
