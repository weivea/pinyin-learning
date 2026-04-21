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
