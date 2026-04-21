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
    const path = svc.cachePathFor('hello', 'zh-CN-XiaoxiaoNeural');
    writeFileSync(path, Buffer.from('FAKE_MP3'));

    const result = await svc.getOrGenerate('hello', 'zh-CN-XiaoxiaoNeural');
    expect(result.fromCache).toBe(true);
    expect(generator).not.toHaveBeenCalled();
    expect(existsSync(result.path)).toBe(true);
  });

  it('invokes generator and writes file when cache misses', async () => {
    const generator = vi.fn(async () => Buffer.from('GEN_MP3'));
    const svc = new EdgeTtsService({ cacheDir, generator });

    const result = await svc.getOrGenerate('hi', 'zh-CN-XiaoxiaoNeural');
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
      svc.getOrGenerate('same', 'v'),
      svc.getOrGenerate('same', 'v'),
    ]);
    expect(calls).toBe(1);
    expect(a.path).toBe(b.path);
  });
});
