import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EdgeTtsService, TtsGenerator } from '../src/services/edgeTts.js';
import { ttsRouter } from '../src/routes/tts.js';

describe('GET /api/tts', () => {
  let cacheDir: string;

  function buildAppWithGenerator(generator: TtsGenerator): { app: Express; tts: EdgeTtsService } {
    const tts = new EdgeTtsService({ cacheDir, generator });
    const app = express();
    app.use('/api/tts', ttsRouter(tts));
    return { app, tts };
  }

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'tts-route-'));
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('returns mp3 audio bytes', async () => {
    const { app } = buildAppWithGenerator(async () => Buffer.from('FAKE_MP3_BYTES'));
    const res = await request(app).get('/api/tts').query({ text: 'hello' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(res.body.toString()).toBe('FAKE_MP3_BYTES');
  });

  it('rejects empty text', async () => {
    const { app } = buildAppWithGenerator(async () => Buffer.from('x'));
    const res = await request(app).get('/api/tts').query({ text: '' });
    expect(res.status).toBe(400);
  });

  it('returns phoneme mode when pinyin+tone provided', async () => {
    const { app } = buildAppWithGenerator(async () => Buffer.from('x'));
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma', tone: '1' });
    expect(res.status).toBe(200);
    expect(res.headers['x-tts-mode']).toBe('phoneme');
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
  });

  it('400 when pinyin present but tone missing', async () => {
    const { app } = buildAppWithGenerator(async () => Buffer.from('x'));
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TONE');
  });

  it('400 when tone out of range', async () => {
    const { app } = buildAppWithGenerator(async () => Buffer.from('x'));
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma', tone: '9' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TONE');
  });

  it('text-only mode still works (backward compat)', async () => {
    const { app } = buildAppWithGenerator(async () => Buffer.from('x'));
    const res = await request(app).get('/api/tts').query({ text: '妈' });
    expect(res.status).toBe(200);
    expect(res.headers['x-tts-mode']).toBe('text');
  });

  it('falls back to text when phoneme generation fails', async () => {
    let call = 0;
    const generator: TtsGenerator = async () => {
      call++;
      if (call === 1) throw new Error('boom');
      return Buffer.from('OK');
    };
    const { app } = buildAppWithGenerator(generator);
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma', tone: '1' });
    expect(res.status).toBe(200);
    expect(res.headers['x-tts-mode']).toBe('fallback-text');
  });
});
