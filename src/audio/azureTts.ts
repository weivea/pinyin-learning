// 客户端 Azure Speech 合成：使用官方 SDK（microsoft-cognitiveservices-speech-sdk）、
// mp3 输出格式，在 WebView 内直接合成；音频以 object URL 形式返回，供 <audio> 播放。
//
// 安全提示：key 来自 import.meta.env.VITE_AZURE_SPEECH_KEY，会被打进 app bundle，
// 存在泄露风险（已与使用方确认接受）。请勿把真实 key 提交进仓库（见 .env.example）。
import { buildSsml } from './ssml';

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export interface AzureSynthesizeOptions {
  text: string;
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
  /** 相对百分比，如 "-20%"，透传给 SSML <prosody>。 */
  rate?: string;
}

interface AzureConfig {
  key: string;
  endpoint: string;
  voice: string;
}

function readConfig(): AzureConfig | null {
  const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
  const endpoint = import.meta.env.VITE_AZURE_SPEECH_ENDPOINT;
  if (!key || !endpoint) return null;
  return {
    key,
    endpoint,
    voice: import.meta.env.VITE_AZURE_SPEECH_VOICE || DEFAULT_VOICE,
  };
}

/** 是否配置了 Azure（key + endpoint 同时存在）。 */
export function isAzureConfigured(): boolean {
  return readConfig() !== null;
}

// 内存缓存：合成参数 -> object URL，避免同一段文本重复请求 Azure。
const urlCache = new Map<string, string>();

function cacheKey(o: AzureSynthesizeOptions, voice: string): string {
  const rate = o.rate ?? '';
  return o.pinyin && o.tone
    ? `${voice}|${o.pinyin}|${o.tone}|${rate}`
    : `${voice}|${o.text}|${rate}`;
}

/**
 * 用 Azure 合成一段中文音频，返回可直接喂给 `new Audio(url)` 的 object URL。
 * 未配置 / 合成失败时抛错，由调用方决定兜底。
 */
export async function synthesizeToUrl(o: AzureSynthesizeOptions): Promise<string> {
  const config = readConfig();
  if (!config) throw new Error('AZURE_NOT_CONFIGURED');

  const voice = o.voice ?? config.voice;
  const key = cacheKey(o, voice);
  const cached = urlCache.get(key);
  if (cached) return cached;

  const ssml = buildSsml({
    text: o.text,
    pinyin: o.pinyin,
    tone: o.tone,
    voice,
    rate: o.rate,
  });
  const audioData = await synthesize(ssml, voice, config);
  const blob = new Blob([audioData], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

/** 调用 Azure Speech SDK 合成，返回 mp3 的 ArrayBuffer。 */
async function synthesize(ssml: string, voice: string, config: AzureConfig): Promise<ArrayBuffer> {
  const sdk = await import('microsoft-cognitiveservices-speech-sdk');

  let speechConfig: import('microsoft-cognitiveservices-speech-sdk').SpeechConfig;
  try {
    // 归一化为 origin，兼容自定义域名端点（与 web 版一致）。
    const base = new URL(new URL(config.endpoint).origin);
    speechConfig = sdk.SpeechConfig.fromEndpoint(base, config.key);
  } catch (err) {
    throw new Error(`AZURE_SPEECH_CONFIG_INVALID: ${(err as Error).message}`);
  }
  speechConfig.speechSynthesisVoiceName = voice;
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

  // audioConfig = null：不走默认扬声器，把音频写入内存 result.audioData。
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  return await new Promise<ArrayBuffer>((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        try {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(result.audioData);
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cd = sdk.CancellationDetails.fromResult(result);
            reject(new Error(`AZURE_TTS_CANCELED: ${cd.reason} ${cd.errorDetails ?? ''}`.trim()));
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
}
