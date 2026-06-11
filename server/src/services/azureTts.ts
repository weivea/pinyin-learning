import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { buildSsml } from './ssml.js';

export interface TtsRequest {
  text: string;
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
  /** 朗读速度，如 "-20%"。透传给 SSML <prosody>。 */
  rate?: string;
}

export type TtsGenerator = (ssml: string, voice: string) => Promise<Buffer>;

export interface AzureTtsOptions {
  cacheDir: string;
  generator?: TtsGenerator;
}

export interface TtsResult {
  path: string;
  fromCache: boolean;
}

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export interface AzureTtsConfig {
  /** Azure Speech 资源 key。 */
  key: string;
  /** Azure Speech 资源端点，形如 https://<resource>.cognitiveservices.azure.com/ */
  endpoint: string;
}

/**
 * 构造一个基于官方 Azure Speech SDK 的 TtsGenerator。
 * audioConfig=null → 音频写入内存 result.audioData（服务器无扬声器，不能用默认输出）。
 */
export function createAzureGenerator(config: AzureTtsConfig): TtsGenerator {
  return async (ssml, voice) => {
    const sdk = await import('microsoft-cognitiveservices-speech-sdk');

    let speechConfig: import('microsoft-cognitiveservices-speech-sdk').SpeechConfig;
    try {
      // 归一化为 origin，去掉多余路径，兼容自定义域名端点。
      const base = new URL(new URL(config.endpoint).origin);
      speechConfig = sdk.SpeechConfig.fromEndpoint(base, config.key);
    } catch (err) {
      throw new Error(`AZURE_SPEECH_CONFIG_INVALID: ${(err as Error).message}`);
    }
    speechConfig.speechSynthesisVoiceName = voice;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    return await new Promise<Buffer>((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          try {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              resolve(Buffer.from(result.audioData));
            } else if (result.reason === sdk.ResultReason.Canceled) {
              const cd = sdk.CancellationDetails.fromResult(result);
              reject(
                new Error(
                  `AZURE_TTS_CANCELED: ${cd.reason} ${cd.errorDetails ?? ''}`.trim(),
                ),
              );
            } else {
              reject(new Error(`AZURE_TTS_FAILED: reason ${result.reason}`));
            }
          } finally {
            synthesizer.close();
          }
        },
        (err) => {
          synthesizer.close();
          reject(new Error(`AZURE_TTS_ERROR: ${err}`));
        },
      );
    });
  };
}

async function defaultGenerator(ssml: string, voice: string): Promise<Buffer> {
  const key = process.env.AZURE_SPEECH_KEY;
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT;
  if (!key || !endpoint) {
    throw new Error(
      'AZURE_SPEECH_NOT_CONFIGURED: 缺少 AZURE_SPEECH_KEY / AZURE_SPEECH_ENDPOINT，请参考 .env.example 配置',
    );
  }
  return createAzureGenerator({ key, endpoint })(ssml, voice);
}

export class AzureTtsService {
  private cacheDir: string;
  private generator: TtsGenerator;
  private inFlight = new Map<string, Promise<TtsResult>>();

  constructor(opts: AzureTtsOptions) {
    this.cacheDir = opts.cacheDir;
    this.generator = opts.generator ?? defaultGenerator;
    mkdirSync(this.cacheDir, { recursive: true });
  }

  cachePathFor(req: TtsRequest): string {
    const voice = req.voice ?? DEFAULT_VOICE;
    const rate = req.rate ?? '';
    const keyInput = req.pinyin && req.tone
      ? `${voice}|${req.pinyin}|${req.tone}|${rate}`
      : `${voice}|${req.text}|${rate}`;
    const hash = createHash('sha256').update(keyInput).digest('hex');
    return join(this.cacheDir, `${hash}.mp3`);
  }

  async getOrGenerate(req: TtsRequest): Promise<TtsResult> {
    const voice = req.voice ?? DEFAULT_VOICE;
    const path = this.cachePathFor(req);
    if (existsSync(path)) {
      // 防御：早先版本可能写入过 0 字节的失败缓存；命中时清理掉重新生成。
      if (statSync(path).size > 0) return { path, fromCache: true };
      unlinkSync(path);
    }

    const existing = this.inFlight.get(path);
    if (existing) return existing;

    const ssml = buildSsml({ ...req, voice });
    const promise = (async () => {
      const buffer = await this.generator(ssml, voice);
      if (!buffer || buffer.length === 0) {
        throw new Error('TTS_EMPTY_AUDIO');
      }
      writeFileSync(path, buffer);
      return { path, fromCache: false };
    })().finally(() => {
      this.inFlight.delete(path);
    });

    this.inFlight.set(path, promise);
    return promise;
  }
}
