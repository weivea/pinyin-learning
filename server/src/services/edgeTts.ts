import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type TtsGenerator = (text: string, voice: string) => Promise<Buffer>;

export interface EdgeTtsOptions {
  cacheDir: string;
  generator?: TtsGenerator;
}

export interface TtsResult {
  path: string;
  fromCache: boolean;
}

async function defaultGenerator(text: string, voice: string): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);
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

  cachePathFor(text: string, voice: string): string {
    const hash = createHash('sha256').update(`${voice}|${text}`).digest('hex');
    return join(this.cacheDir, `${hash}.mp3`);
  }

  async getOrGenerate(text: string, voice: string): Promise<TtsResult> {
    const path = this.cachePathFor(text, voice);
    if (existsSync(path)) return { path, fromCache: true };

    const key = path;
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = (async () => {
      const buffer = await this.generator(text, voice);
      writeFileSync(path, buffer);
      return { path, fromCache: false };
    })().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}
