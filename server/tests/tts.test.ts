import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';
import { EdgeTtsService } from '../src/services/edgeTts.js';

describe('GET /api/tts', () => {
  let cacheDir: string;
  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'tts-route-'));
  });

  it('returns mp3 audio bytes', async () => {
    const tts = new EdgeTtsService({
      cacheDir,
      generator: async () => Buffer.from('FAKE_MP3_BYTES'),
    });
    const app = createApp({ db: createDb(':memory:'), tts });
    const res = await request(app).get('/api/tts').query({ text: 'hello' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(res.body.toString()).toBe('FAKE_MP3_BYTES');
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('rejects empty text', async () => {
    const tts = new EdgeTtsService({ cacheDir, generator: async () => Buffer.from('x') });
    const app = createApp({ db: createDb(':memory:'), tts });
    const res = await request(app).get('/api/tts').query({ text: '' });
    expect(res.status).toBe(400);
    rmSync(cacheDir, { recursive: true, force: true });
  });
});
