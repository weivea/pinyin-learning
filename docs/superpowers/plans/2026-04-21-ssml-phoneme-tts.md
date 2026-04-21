# SSML Phoneme TTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Edge TTS 的 SAPI `<phoneme>` SSML 标签按 `(pinyin, tone)` 精准合成声调音频，替换"借代表字"方案。

**Architecture:** 后端新增 `buildSsml` 纯函数构造 SAPI phoneme SSML，`EdgeTtsService.getOrGenerate` 升级签名接受 `TtsRequest`（含可选 pinyin+tone），走 `msedge-tts.rawToStream(ssml)`；缓存 key 在 pinyin+tone 存在时按 `sha256(voice|pinyin|tone)` 索引，与 fallback 字解耦。`/api/tts` 扩展 `pinyin`/`tone` 查询参数并在服务端 phoneme 失败时自动回落纯文本，通过 `X-TTS-Mode` header 告知客户端实际路径。前端新增 `stripTone` 工具与 `useAudio.playPinyin(pinyin, tone, fallback)`，`ToneButtons` 和 `AudioButton`/`ExampleWord` 在有 pinyin+tone 时走 phoneme，否则维持旧 `play` 行为，向后兼容。

**Tech Stack:** TypeScript, msedge-tts 2.0.5 (`rawToStream`), Express, Vitest + supertest, React, Vite.

**Spec:** `docs/superpowers/specs/2026-04-21-ssml-phoneme-tts-design.md`

---

## File Structure

- **Create** `server/src/services/ssml.ts` — `buildSsml(req)` 纯函数 + `escapeXml`
- **Modify** `server/src/services/edgeTts.ts` — 升级 `TtsGenerator` 签名、`getOrGenerate` 接收 `TtsRequest`、缓存 key 规则、调用 `rawToStream(ssml)`
- **Modify** `server/src/routes/tts.ts` — 解析 `pinyin`/`tone`、参数校验、phoneme→text 回落、写 `X-TTS-Mode`/`X-TTS-Cache` header
- **Create** `server/tests/ssml.test.ts` — `buildSsml` 单测
- **Modify** `server/tests/edgeTts.test.ts` — 补缓存 key 规则测试
- **Modify** `server/tests/tts.test.ts` — 补 route 参数校验、mode header、fallback 测试
- **Create** `client/src/utils/pinyin.ts` — `stripTone(pinyin)` 纯函数
- **Modify** `client/src/api/tts.ts` — `ttsUrl(text, opts?)` 支持 pinyin/tone/voice，ü→v
- **Modify** `client/src/hooks/useAudio.ts` — 增 `playPinyin(pinyin, tone, fallback)`
- **Modify** `client/src/components/ToneButtons.tsx` — 用 `playPinyin`
- **Modify** `client/src/components/AudioButton.tsx` — props 增 `pinyin?`, `tone?`
- **Modify** `client/src/components/ExampleWord.tsx` — 把 word.pinyin/word.tone 传给 AudioButton

---

### Task 1: `buildSsml` 纯函数骨架 + XML 转义

**Files:**
- Create: `server/src/services/ssml.ts`
- Create: `server/tests/ssml.test.ts`

- [ ] **Step 1: Write the failing test**

File: `server/tests/ssml.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { buildSsml } from '../src/services/ssml.js';

describe('buildSsml', () => {
  it('wraps plain text in speak+voice when no pinyin', () => {
    const ssml = buildSsml({ text: '妈' });
    expect(ssml).toBe(
      '<speak version="1.0" xml:lang="zh-CN">' +
        '<voice name="zh-CN-XiaoxiaoNeural">妈</voice>' +
      '</speak>'
    );
  });

  it('inserts SAPI phoneme tag when pinyin+tone provided', () => {
    const ssml = buildSsml({ text: '妈', pinyin: 'ma', tone: 1 });
    expect(ssml).toContain('<phoneme alphabet="sapi" ph="ma 1">妈</phoneme>');
    expect(ssml).toContain('<voice name="zh-CN-XiaoxiaoNeural">');
  });

  it('escapes XML-special characters in text', () => {
    const ssml = buildSsml({ text: 'A & <B>', pinyin: 'a', tone: 1 });
    expect(ssml).toContain('A &amp; &lt;B&gt;');
    expect(ssml).not.toContain('A & <B>');
  });

  it('uses custom voice when provided', () => {
    const ssml = buildSsml({ text: '你', voice: 'zh-CN-YunyangNeural' });
    expect(ssml).toContain('<voice name="zh-CN-YunyangNeural">');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix server test -- ssml
```

Expected: FAIL — `Cannot find module '../src/services/ssml.js'`

- [ ] **Step 3: Write minimal implementation**

File: `server/src/services/ssml.ts`

```ts
export interface SsmlRequest {
  text: string;
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
}

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSsml(req: SsmlRequest): string {
  const voice = req.voice ?? DEFAULT_VOICE;
  const text = escapeXml(req.text);
  const inner = (req.pinyin && req.tone)
    ? `<phoneme alphabet="sapi" ph="${escapeXml(req.pinyin)} ${req.tone}">${text}</phoneme>`
    : text;
  return `<speak version="1.0" xml:lang="zh-CN"><voice name="${voice}">${inner}</voice></speak>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix server test -- ssml
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add server/src/services/ssml.ts server/tests/ssml.test.ts && \
  git commit -m "feat(server): add buildSsml pure function for SAPI phoneme SSML"
```

---

### Task 2: 升级 `EdgeTtsService` 签名接受 `TtsRequest`

**Files:**
- Modify: `server/src/services/edgeTts.ts`
- Modify: `server/tests/edgeTts.test.ts`

- [ ] **Step 1: Write the failing tests (extend existing file)**

Append to `server/tests/edgeTts.test.ts` inside the `describe('EdgeTtsService', ...)` block:

```ts
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
```

Also update the existing three tests to call the new API (they currently pass `(text, voice)`):

```ts
    // old: svc.getOrGenerate('hello', 'zh-CN-XiaoxiaoNeural')
    const result = await svc.getOrGenerate({ text: 'hello' });
    // ...
    const result = await svc.getOrGenerate({ text: 'hi' });
    // ...
    const [a, b] = await Promise.all([
      svc.getOrGenerate({ text: 'same', voice: 'v' }),
      svc.getOrGenerate({ text: 'same', voice: 'v' }),
    ]);
```

And update the `cachePathFor` helper call in the first test to match the new signature (see Step 3 — keep `cachePathFor(req)` accepting a `TtsRequest`).

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix server test -- edgeTts
```

Expected: FAIL — type errors / assertions about phoneme cache key

- [ ] **Step 3: Rewrite `server/src/services/edgeTts.ts`**

```ts
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSsml } from './ssml.js';

export interface TtsRequest {
  text: string;
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
}

export type TtsGenerator = (ssml: string, voice: string) => Promise<Buffer>;

export interface EdgeTtsOptions {
  cacheDir: string;
  generator?: TtsGenerator;
}

export interface TtsResult {
  path: string;
  fromCache: boolean;
}

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

async function defaultGenerator(ssml: string, voice: string): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.rawToStream(ssml);
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    audioStream.on('data', (c: Buffer) => chunks.push(c));
    audioStream.on('end', () => resolve(Buffer.concat(chunks)));
    audioStream.on('error', reject);
  });
}

export class EdgeTtsService {
  private cacheDir: string;
  private generator: TtsGenerator;
  private inFlight = new Map<string, Promise<TtsResult>>();

  constructor(opts: EdgeTtsOptions) {
    this.cacheDir = opts.cacheDir;
    this.generator = opts.generator ?? defaultGenerator;
    mkdirSync(this.cacheDir, { recursive: true });
  }

  cachePathFor(req: TtsRequest): string {
    const voice = req.voice ?? DEFAULT_VOICE;
    const keyInput = req.pinyin && req.tone
      ? `${voice}|${req.pinyin}|${req.tone}`
      : `${voice}|${req.text}`;
    const hash = createHash('sha256').update(keyInput).digest('hex');
    return join(this.cacheDir, `${hash}.mp3`);
  }

  async getOrGenerate(req: TtsRequest): Promise<TtsResult> {
    const voice = req.voice ?? DEFAULT_VOICE;
    const path = this.cachePathFor(req);
    if (existsSync(path)) return { path, fromCache: true };

    const existing = this.inFlight.get(path);
    if (existing) return existing;

    const ssml = buildSsml({ ...req, voice });
    const promise = (async () => {
      const buffer = await this.generator(ssml, voice);
      writeFileSync(path, buffer);
      return { path, fromCache: false };
    })().finally(() => {
      this.inFlight.delete(path);
    });

    this.inFlight.set(path, promise);
    return promise;
  }
}
```

Also update the first test's `cachePathFor` call:

```ts
    const path = svc.cachePathFor({ text: 'hello' });
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix server test -- edgeTts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add server/src/services/edgeTts.ts server/tests/edgeTts.test.ts && \
  git commit -m "feat(server): EdgeTtsService accepts TtsRequest with pinyin+tone cache key"
```

---

### Task 3: `/api/tts` route 支持 pinyin/tone + fallback + headers

**Files:**
- Modify: `server/src/routes/tts.ts`
- Modify: `server/tests/tts.test.ts`

- [ ] **Step 1: Write the failing tests (extend)**

Append to `server/tests/tts.test.ts` (inside existing route describe block, or adapt existing helpers):

```ts
  it('returns phoneme mode when pinyin+tone provided', async () => {
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma', tone: '1' });
    expect(res.status).toBe(200);
    expect(res.headers['x-tts-mode']).toBe('phoneme');
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
  });

  it('400 when pinyin present but tone missing', async () => {
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TONE');
  });

  it('400 when tone out of range', async () => {
    const res = await request(app).get('/api/tts').query({ text: '妈', pinyin: 'ma', tone: '9' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TONE');
  });

  it('text-only mode still works (backward compat)', async () => {
    const res = await request(app).get('/api/tts').query({ text: '妈' });
    expect(res.status).toBe(200);
    expect(res.headers['x-tts-mode']).toBe('text');
  });

  it('falls back to text when phoneme generation fails', async () => {
    // Configure the test app so the generator throws on first (phoneme) call and succeeds on second (text).
    let call = 0;
    const generator = async () => {
      call++;
      if (call === 1) throw new Error('boom');
      return Buffer.from('OK');
    };
    const { app: localApp } = buildAppWithGenerator(generator); // helper added in Step 3
    const res = await request(localApp).get('/api/tts').query({ text: '妈', pinyin: 'ma', tone: '1' });
    expect(res.status).toBe(200);
    expect(res.headers['x-tts-mode']).toBe('fallback-text');
  });
```

> **Note on the helper:** if the existing `tts.test.ts` already constructs `app` via a shared factory, add a `buildAppWithGenerator(gen)` export alongside it. If not, inline an ad-hoc Express app in the test using `ttsRouter(new EdgeTtsService({ cacheDir, generator }))`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix server test -- tts
```

Expected: FAIL — headers / 400 codes / fallback behavior not implemented.

- [ ] **Step 3: Rewrite `server/src/routes/tts.ts`**

```ts
import { Router, Request, Response } from 'express';
import { EdgeTtsService, TtsRequest } from '../services/edgeTts.js';
import { createReadStream } from 'node:fs';

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

function parseTone(raw: unknown): 1 | 2 | 3 | 4 | null {
  if (typeof raw !== 'string' || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n as 1 | 2 | 3 | 4;
}

export function ttsRouter(tts: EdgeTtsService): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const text = typeof req.query.text === 'string' ? req.query.text : '';
    const voice = typeof req.query.voice === 'string' && req.query.voice ? req.query.voice : DEFAULT_VOICE;
    const pinyin = typeof req.query.pinyin === 'string' && req.query.pinyin ? req.query.pinyin : undefined;
    const toneRaw = req.query.tone;

    if (text.trim() === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'text required' } });
    }

    let tone: 1 | 2 | 3 | 4 | undefined;
    if (pinyin !== undefined || toneRaw !== undefined) {
      const parsed = parseTone(toneRaw);
      if (pinyin !== undefined && parsed === null) {
        return res.status(400).json({
          error: { code: 'INVALID_TONE', message: 'tone must be 1-4 when pinyin provided' },
        });
      }
      if (parsed === null && toneRaw !== undefined) {
        return res.status(400).json({
          error: { code: 'INVALID_TONE', message: 'tone must be 1-4' },
        });
      }
      tone = parsed ?? undefined;
    }

    const baseReq: TtsRequest = { text, voice };
    const phonemeReq: TtsRequest = pinyin && tone ? { text, voice, pinyin, tone } : baseReq;
    const phonemeMode = Boolean(pinyin && tone);

    let result;
    let mode: 'phoneme' | 'text' | 'fallback-text';
    try {
      result = await tts.getOrGenerate(phonemeReq);
      mode = phonemeMode ? 'phoneme' : 'text';
    } catch (err) {
      if (!phonemeMode) {
        console.error('[tts] generation failed:', err);
        return res.status(503).json({ error: { code: 'TTS_UNAVAILABLE', message: 'TTS service failed' } });
      }
      console.warn('[tts] phoneme failed, falling back to text:', err);
      try {
        result = await tts.getOrGenerate(baseReq);
        mode = 'fallback-text';
      } catch (err2) {
        console.error('[tts] fallback also failed:', err2);
        return res.status(503).json({ error: { code: 'TTS_UNAVAILABLE', message: 'TTS service failed' } });
      }
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-TTS-Mode', mode);
    res.setHeader('X-TTS-Cache', result.fromCache ? 'hit' : 'miss');
    createReadStream(result.path).pipe(res);
  });

  return router;
}
```

- [ ] **Step 4: Run all server tests**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix server test
```

Expected: PASS (all original + new)

- [ ] **Step 5: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add server/src/routes/tts.ts server/tests/tts.test.ts && \
  git commit -m "feat(server): /api/tts pinyin+tone params, X-TTS-Mode header, phoneme fallback"
```

---

### Task 4: 前端 `stripTone` 工具

**Files:**
- Create: `client/src/utils/pinyin.ts`
- Create: `client/src/utils/pinyin.test.ts`

- [ ] **Step 1: Write the failing test**

File: `client/src/utils/pinyin.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { stripTone } from './pinyin';

describe('stripTone', () => {
  it('removes tone marks from a/o/e/i/u', () => {
    expect(stripTone('mā')).toBe('ma');
    expect(stripTone('má')).toBe('ma');
    expect(stripTone('mǎ')).toBe('ma');
    expect(stripTone('mà')).toBe('ma');
    expect(stripTone('ò')).toBe('o');
    expect(stripTone('ē')).toBe('e');
    expect(stripTone('ī')).toBe('i');
    expect(stripTone('ū')).toBe('u');
  });

  it('preserves ü (does not convert to v)', () => {
    expect(stripTone('lǜ')).toBe('lü');
    expect(stripTone('üē')).toBe('üe');
  });

  it('passes through non-toned characters', () => {
    expect(stripTone('zi')).toBe('zi');
    expect(stripTone('')).toBe('');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test -- pinyin
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

File: `client/src/utils/pinyin.ts`

```ts
const TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
};

/** 去掉声调符号，返回 base pinyin（保留 ü，不转 v）。 */
export function stripTone(pinyin: string): string {
  return [...pinyin].map(ch => TONE_MAP[ch] ?? ch).join('');
}
```

- [ ] **Step 4: Run to verify passing**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test -- pinyin
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add client/src/utils/pinyin.ts client/src/utils/pinyin.test.ts && \
  git commit -m "feat(client): add stripTone pinyin utility"
```

---

### Task 5: 升级 `ttsUrl` 支持 pinyin/tone 且做 ü→v

**Files:**
- Modify: `client/src/api/tts.ts`
- Create: `client/src/api/tts.test.ts`

- [ ] **Step 1: Write the failing test**

File: `client/src/api/tts.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { ttsUrl } from './tts';

describe('ttsUrl', () => {
  it('text-only URL stays backward compatible', () => {
    const u = ttsUrl('妈');
    expect(u).toMatch(/^\/api\/tts\?/);
    expect(u).toContain('text=%E5%A6%88');
    expect(u).not.toContain('pinyin=');
    expect(u).not.toContain('tone=');
  });

  it('appends pinyin+tone when provided', () => {
    const u = ttsUrl('妈', { pinyin: 'ma', tone: 1 });
    expect(u).toContain('pinyin=ma');
    expect(u).toContain('tone=1');
  });

  it('converts ü to v in pinyin param', () => {
    const u = ttsUrl('绿', { pinyin: 'lü', tone: 4 });
    expect(u).toContain('pinyin=lv');
    expect(u).not.toContain('%C3%BC'); // encoded ü
  });

  it('accepts custom voice', () => {
    const u = ttsUrl('你', { voice: 'zh-CN-YunyangNeural' });
    expect(u).toContain('voice=zh-CN-YunyangNeural');
  });
});
```

- [ ] **Step 2: Run to verify failing**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test -- api/tts
```

Expected: FAIL — `ttsUrl` does not accept `opts`.

- [ ] **Step 3: Implement**

Replace `client/src/api/tts.ts`:

```ts
export interface TtsOptions {
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
}

export function ttsUrl(text: string, opts?: TtsOptions): string {
  const params = new URLSearchParams({ text });
  if (opts?.pinyin) {
    // SAPI Mandarin 约定：ü 写作 v
    params.set('pinyin', opts.pinyin.replace(/ü/g, 'v'));
  }
  if (opts?.tone) params.set('tone', String(opts.tone));
  if (opts?.voice) params.set('voice', opts.voice);
  return `/api/tts?${params.toString()}`;
}
```

- [ ] **Step 4: Run to verify passing; also run full client tests**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test
```

Expected: PASS — new tests pass; existing `useAudio`/components still work because `ttsUrl('x')` branch is unchanged (the old second `voice` positional arg no longer exists — search callers below).

- [ ] **Step 5: Grep for callers that relied on positional voice arg**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && grep -rn "ttsUrl(" client/src
```

Expected: only `useAudio.ts` calls `ttsUrl(text)` with one arg. No fix needed. If any caller passes a second string, migrate it to `ttsUrl(text, { voice })`.

- [ ] **Step 6: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add client/src/api/tts.ts client/src/api/tts.test.ts && \
  git commit -m "feat(client): ttsUrl accepts pinyin/tone/voice opts with ü→v"
```

---

### Task 6: `useAudio.playPinyin` 方法

**Files:**
- Modify: `client/src/hooks/useAudio.ts`

- [ ] **Step 1: Rewrite the hook to add `playPinyin` alongside `play`**

File: `client/src/hooks/useAudio.ts`

```ts
import { useCallback, useRef } from 'react';
import { ttsUrl } from '../api/tts';

/** 播放给定文本的 TTS 音频。失败时 fallback 到 Web Speech API。 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = () => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
  };

  const speechFallback = (text: string) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e2) {
      console.error('[useAudio] speech fallback failed', e2);
    }
  };

  const play = useCallback(async (text: string) => {
    stopCurrent();
    try {
      const audio = new Audio(ttsUrl(text));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio] tts failed, fallback to speechSynthesis', err);
      speechFallback(text);
    }
  }, []);

  const playPinyin = useCallback(async (
    pinyin: string,
    tone: 1 | 2 | 3 | 4,
    fallback: string,
  ) => {
    stopCurrent();
    try {
      const url = ttsUrl(fallback, { pinyin, tone });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const mode = res.headers.get('X-TTS-Mode');
      if (import.meta.env.DEV && mode === 'fallback-text') {
        console.warn(`[useAudio] phoneme fallback for ${pinyin}${tone}`);
      }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio.playPinyin] failed, fallback to speechSynthesis', err);
      speechFallback(fallback);
    }
  }, []);

  return { play, playPinyin };
}
```

- [ ] **Step 2: Run full client tests (regression)**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test
```

Expected: PASS (existing tests unaffected; `play` signature unchanged).

- [ ] **Step 3: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add client/src/hooks/useAudio.ts && \
  git commit -m "feat(client): add useAudio.playPinyin for phoneme-based TTS"
```

---

### Task 7: `ToneButtons` 切换到 `playPinyin`

**Files:**
- Modify: `client/src/components/ToneButtons.tsx`

- [ ] **Step 1: Rewrite the component**

File: `client/src/components/ToneButtons.tsx`

```tsx
import type { ToneVariant, PinyinItem } from '../types';
import { useAudio } from '../hooks/useAudio';
import { stripTone } from '../utils/pinyin';

interface Props {
  tones: ToneVariant[];
  /** 拼音基底（如 "a"、"üe"）。若未传，则从 tones[0].text 推导。 */
  basePinyin?: string;
  onPlay?: (tone: ToneVariant) => void;
}

export function ToneButtons({ tones, basePinyin, onPlay }: Props) {
  const { playPinyin } = useAudio();
  const base = basePinyin ?? stripTone(tones[0]?.text ?? '');
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {tones.map(t => (
        <button
          key={t.tone}
          onClick={() => { void playPinyin(base, t.tone, t.audioText); onPlay?.(t); }}
          aria-label={`播放 ${t.text}`}
          style={{
            fontSize: 56, padding: '16px 28px', minWidth: 96,
            borderRadius: 24, border: '4px solid #ffb703', background: '#fff',
            cursor: 'pointer',
          }}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
```

Note: `PinyinItem` import is unused here — remove the line if lint complains. Keep only `ToneVariant`.

- [ ] **Step 2: Check call sites for passing `basePinyin`**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && grep -rn "ToneButtons" client/src
```

Expected caller: `PinyinCard.tsx`. Update it to pass `basePinyin={item.display}` so compound finals with multiple chars resolve correctly (e.g., `üe`, `ang`):

In `PinyinCard.tsx`, find `<ToneButtons tones={item.tones} ... />` and add:

```tsx
<ToneButtons tones={item.tones} basePinyin={item.display} />
```

- [ ] **Step 3: Run client tests**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test
```

Expected: PASS. If a ToneButtons test mocks `useAudio().play`, update it to mock `playPinyin`.

- [ ] **Step 4: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add client/src/components/ToneButtons.tsx client/src/components/PinyinCard.tsx && \
  git commit -m "feat(client): ToneButtons uses playPinyin for accurate tone audio"
```

---

### Task 8: `AudioButton` + `ExampleWord` 接受 pinyin/tone

**Files:**
- Modify: `client/src/components/AudioButton.tsx`
- Modify: `client/src/components/ExampleWord.tsx`

- [ ] **Step 1: Upgrade `AudioButton.tsx`**

```tsx
import { useAudio } from '../hooks/useAudio';
import { stripTone } from '../utils/pinyin';

interface Props {
  text: string;
  pinyin?: string;
  tone?: 0 | 1 | 2 | 3 | 4;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioButton({ text, pinyin, tone, label = '🔊', size = 'md' }: Props) {
  const { play, playPinyin } = useAudio();
  const sizes = { sm: 32, md: 48, lg: 72 };
  const px = sizes[size];

  const handleClick = () => {
    if (pinyin && tone && tone >= 1) {
      const base = stripTone(pinyin);
      void playPinyin(base, tone as 1 | 2 | 3 | 4, text);
    } else {
      void play(text);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`播放 ${text}`}
      style={{
        width: px, height: px, borderRadius: px / 2,
        border: 'none', background: '#ffd166', fontSize: px * 0.5,
      }}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Upgrade `ExampleWord.tsx` to forward pinyin/tone**

```tsx
import type { ExampleWord as EW } from '../types';
import { EmojiTile } from './EmojiTile';
import { AudioButton } from './AudioButton';

interface Props { word: EW; }

export function ExampleWord({ word }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 16, borderRadius: 24, background: '#fff', border: '3px solid #8ecae6',
      gap: 8, minWidth: 120,
    }}>
      <EmojiTile emoji={word.emoji} size={64} />
      <div style={{ fontSize: 36, fontWeight: 'bold' }}>{word.hanzi}</div>
      <div style={{ fontSize: 24, color: '#666' }}>{word.pinyin}</div>
      <AudioButton
        text={word.hanzi}
        pinyin={word.pinyin}
        tone={word.tone}
        size="sm"
      />
    </div>
  );
}
```

- [ ] **Step 3: Run full client tests**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm --prefix client test
```

Expected: PASS. `tone === 0`（轻声）走旧 `play(text)` 路径，维持当前行为。

- [ ] **Step 4: Commit**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git add client/src/components/AudioButton.tsx client/src/components/ExampleWord.tsx && \
  git commit -m "feat(client): AudioButton/ExampleWord use phoneme TTS when pinyin+tone available"
```

---

### Task 9: 全量回归 + 手工验收

**Files:** 无代码变更

- [ ] **Step 1: 全量测试**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm test
```

Expected: 全部 client + server 测试通过。

- [ ] **Step 2: 启动 dev 手测**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && npm run dev
```

打开 http://localhost:5173，执行以下清单：

- [ ] 点 `a` 的二声 `á` → 听到清晰 á（不再是代表字的一声）
- [ ] 点 `üe` 的三声 → 清晰的第三声调形
- [ ] 点 `en` / `eng` 的 1/2 声（无常用字组合）→ 能听到接近目标声调
- [ ] 点 `ri` 的 2/3 声（整体认读无字）→ 合成有声调，非"日"
- [ ] 点例字 `马` → 念 `mǎ`（不会被误读成多音字）
- [ ] 点例字 `了` (tone=0 轻声) → 走旧文本路径，正常发音
- [ ] DevTools Network：响应 header 含 `X-TTS-Mode: phoneme` / `text`
- [ ] 同一 (pinyin, tone) 不同 fallback 字 → Network 第二次 `X-TTS-Cache: hit`
- [ ] 手动把 Edge TTS WebSocket 断掉（或改错 voice）→ 回落 `fallback-text` 或 Web Speech，不白屏

- [ ] **Step 3: 打 tag**

```bash
cd /Users/jianliwei/personal-repos/pinyin-learning && \
  git tag -a v0.2.0 -m "SSML phoneme TTS: accurate tone audio via SAPI phoneme" && \
  git log --oneline -12
```

---

## Self-Review

**1. Spec coverage:**
- `buildSsml` 纯函数 → Task 1 ✓
- `EdgeTtsService.getOrGenerate` 签名升级 + 缓存 key → Task 2 ✓
- `/api/tts` pinyin/tone + INVALID_TONE 校验 + X-TTS-Mode header + fallback → Task 3 ✓
- `stripTone` 工具 → Task 4 ✓
- `ttsUrl` 升级 + ü→v → Task 5 ✓
- `useAudio.playPinyin` → Task 6 ✓
- `ToneButtons` 切换 → Task 7 ✓
- `AudioButton`/`ExampleWord` props → Task 8 ✓
- 手工验收 → Task 9 ✓
- Spike 任务：spec 说 "首步是 spike"，但在撰写此 plan 过程中已通过读 `node_modules/msedge-tts/dist/MsEdgeTTS.d.ts` 确认 `rawToStream(requestSSML)` API 存在，spike 风险消化到 Task 2 Step 4 测试集成默认 generator 间接验证；手测验收（Task 9）再做端到端确认。

**2. Placeholder scan:** 无 TBD/TODO；每个代码步骤都给出完整代码；测试命令和期望输出都具体。

**3. Type consistency:**
- `TtsRequest` 字段 `text/pinyin/tone/voice` 在 Task 1/2/3 保持一致
- `TtsGenerator` 签名在 Task 2 改为 `(ssml, voice)` — Task 3 的 fallback 测试里 `generator` 调用同签名 ✓
- `tone` 类型 `1|2|3|4` 在 route/service/hook 一致；`AudioButton` 额外接受 `0` 表示轻声，运行时分支到 `play` 而非传给 `playPinyin` ✓
- `ttsUrl` 第二个参数从 `voice: string` 变为 `opts?: TtsOptions`（含 `voice`）— Task 5 Step 5 显式 grep 确认唯一调用点不传第二参数，无破坏 ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-21-ssml-phoneme-tts.md`. Two execution options:

1. **Subagent-Driven (recommended)** — 每 task 派发独立 subagent，两阶段 review，迭代快
2. **Inline Execution** — 在当前 session 里按 executing-plans 批量推进并留 checkpoint

Which approach?
