import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EdgeTtsService } from '../src/services/edgeTts.js';

let cacheDir: string;

beforeEach(() => {
  cacheDir = mkdtempSync(join(tmpdir(), 'tts-cache-'));
});

afterEach(() => {
  rmSync(cacheDir, { recursive: true, force: true });
});

describe('EdgeTtsService', () => {
  it('returns cached file if exists without invoking generator', async () => {
    const generator = vi.fn();
    const svc = new EdgeTtsService({ cacheDir, generator });
    const path = svc.cachePathFor({ text: 'hello' });
    writeFileSync(path, Buffer.from('FAKE_MP3'));

    const result = await svc.getOrGenerate({ text: 'hello' });
    expect(result.fromCache).toBe(true);
    expect(generator).not.toHaveBeenCalled();
    expect(existsSync(result.path)).toBe(true);
  });

  it('invokes generator and writes file when cache misses', async () => {
    const generator = vi.fn(async () => Buffer.from('GEN_MP3'));
    const svc = new EdgeTtsService({ cacheDir, generator });

    const result = await svc.getOrGenerate({ text: 'hi' });
    expect(result.fromCache).toBe(false);
    expect(generator).toHaveBeenCalledOnce();
    expect(existsSync(result.path)).toBe(true);
  });

  it('dedupes concurrent requests for same key', async () => {
    let calls = 0;
    const generator = vi.fn(async () => {
      calls++;
      await new Promise(r => setTimeout(r, 30));
      return Buffer.from('X');
    });
    const svc = new EdgeTtsService({ cacheDir, generator });

    const [a, b] = await Promise.all([
      svc.getOrGenerate({ text: 'same', voice: 'v' }),
      svc.getOrGenerate({ text: 'same', voice: 'v' }),
    ]);
    expect(calls).toBe(1);
    expect(a.path).toBe(b.path);
  });

  it('uses pinyin+tone for cache key (independent of fallback text)', async () => {
    const generator = vi.fn(async () => Buffer.from('X'));
    const svc = new EdgeTtsService({ cacheDir, generator });

    const r1 = await svc.getOrGenerate({ text: '妈', pinyin: 'ma', tone: 1 });
    const r2 = await svc.getOrGenerate({ text: '麻麻', pinyin: 'ma', tone: 1 });

    expect(r1.path).toBe(r2.path);
    expect(generator).toHaveBeenCalledOnce();
  });

  it('differentiates cache by tone', async () => {
    const generator = vi.fn(async () => Buffer.from('X'));
    const svc = new EdgeTtsService({ cacheDir, generator });

    const r1 = await svc.getOrGenerate({ text: '妈', pinyin: 'ma', tone: 1 });
    const r2 = await svc.getOrGenerate({ text: '妈', pinyin: 'ma', tone: 3 });

    expect(r1.path).not.toBe(r2.path);
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it('passes built SSML to generator when pinyin+tone present', async () => {
    const generator = vi.fn(async () => Buffer.from('X'));
    const svc = new EdgeTtsService({ cacheDir, generator });

    await svc.getOrGenerate({ text: '妈', pinyin: 'ma', tone: 2 });

    const ssml = generator.mock.calls[0][0] as string;
    expect(ssml).toContain('<phoneme alphabet="sapi" ph="ma 2">妈</phoneme>');
  });

  it('throws and does NOT cache when generator returns empty buffer', async () => {
    const generator = vi.fn(async () => Buffer.alloc(0));
    const svc = new EdgeTtsService({ cacheDir, generator });

    await expect(svc.getOrGenerate({ text: '空' })).rejects.toThrow(/empty/i);
    const path = svc.cachePathFor({ text: '空' });
    expect(existsSync(path)).toBe(false);
  });

  it('regenerates when on-disk cache is a stale 0-byte file', async () => {
    const generator = vi.fn(async () => Buffer.from('REAL_MP3'));
    const svc = new EdgeTtsService({ cacheDir, generator });
    const path = svc.cachePathFor({ text: 'recover' });
    writeFileSync(path, Buffer.alloc(0));

    const result = await svc.getOrGenerate({ text: 'recover' });
    expect(result.fromCache).toBe(false);
    expect(generator).toHaveBeenCalledOnce();
  });
});
