import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pinyinAudioRouter } from '../src/routes/pinyinAudio.js';

describe('GET /api/audio/pinyin/:filename', () => {
  let dir: string;

  function makeApp() {
    const app = express();
    app.use('/api/audio/pinyin', pinyinAudioRouter(dir));
    return app;
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pyaudio-'));
    writeFileSync(join(dir, 'a1.mp3'), Buffer.from('FAKE-MP3-A1'));
    writeFileSync(join(dir, 've3.mp3'), Buffer.from('FAKE-MP3-VE3'));
    writeFileSync(join(dir, 'b.mp3'), Buffer.from('FAKE-MP3-B'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('serves an existing toned syllable', async () => {
    const res = await request(makeApp()).get('/api/audio/pinyin/a1.mp3');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('audio/mpeg');
    expect(res.headers['cache-control']).toMatch(/max-age=31536000/);
    expect(res.body.toString()).toBe('FAKE-MP3-A1');
  });

  it('serves an initial (no tone)', async () => {
    const res = await request(makeApp()).get('/api/audio/pinyin/b.mp3');
    expect(res.status).toBe(200);
    expect(res.body.toString()).toBe('FAKE-MP3-B');
  });

  it('serves ü-as-v finals', async () => {
    const res = await request(makeApp()).get('/api/audio/pinyin/ve3.mp3');
    expect(res.status).toBe(200);
    expect(res.body.toString()).toBe('FAKE-MP3-VE3');
  });

  it('returns 404 for missing file', async () => {
    const res = await request(makeApp()).get('/api/audio/pinyin/zzz4.mp3');
    expect(res.status).toBe(404);
  });

  it('rejects path traversal', async () => {
    const res = await request(makeApp()).get('/api/audio/pinyin/..%2Fpasswd.mp3');
    expect(res.status).toBe(400);
  });

  it('rejects non-mp3 extensions', async () => {
    const res = await request(makeApp()).get('/api/audio/pinyin/a1.wav');
    expect(res.status).toBe(400);
  });

  it('rejects uppercase / digits in name', async () => {
    const r1 = await request(makeApp()).get('/api/audio/pinyin/A1.mp3');
    expect(r1.status).toBe(400);
    const r2 = await request(makeApp()).get('/api/audio/pinyin/a12.mp3');
    expect(r2.status).toBe(400);
  });
});
