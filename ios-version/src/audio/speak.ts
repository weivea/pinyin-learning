import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isAzureConfigured, synthesizeToUrl } from './azureTts';

export interface SpeakOptions {
  /** 1 = normal speed; <1 is slower. 同时用于换算 Azure 的相对百分比。 */
  rate?: number;
  /** Azure phoneme 模式：去声调拼音（如 "ma"）。 */
  pinyin?: string;
  /** Azure phoneme 模式：声调 1-4。 */
  tone?: 1 | 2 | 3 | 4;
  /** Azure 音色名，默认 zh-CN-XiaoxiaoNeural。 */
  voice?: string;
}

let currentAudio: HTMLAudioElement | null = null;

/** 把原生数字 rate 换算为 Azure SSML 的相对百分比（0.65 → "-35%"，0.8 → "-20%"）。 */
function rateToPercent(rate?: number): string | undefined {
  if (rate == null || rate === 1) return undefined;
  return `${Math.round((rate - 1) * 100)}%`;
}

/** 播放一个音频 URL，等待 ended/error。失败不抛。 */
function playUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    const done = () => {
      audio.onended = null;
      audio.onerror = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    const p = audio.play();
    if (p) p.catch(done);
  });
}

/**
 * 朗读中文文本。优先走 Azure（与 web 版同款 SSML：phoneme 声调 + prosody 调速），
 * Azure 未配置 / 合成失败 / 离线时退回 iOS 原生 TextToSpeech。失败静默兜底，不抛。
 */
export async function speak(text: string, opts?: SpeakOptions): Promise<void> {
  if (isAzureConfigured()) {
    try {
      const url = await synthesizeToUrl({
        text,
        pinyin: opts?.pinyin,
        tone: opts?.tone,
        voice: opts?.voice,
        rate: rateToPercent(opts?.rate),
      });
      await playUrl(url);
      return;
    } catch (error) {
      console.warn('[speak] azure tts failed, falling back to native', error);
    }
  }
  try {
    await TextToSpeech.stop();
    await TextToSpeech.speak({
      text,
      lang: 'zh-CN',
      rate: opts?.rate ?? 1,
    });
  } catch (error) {
    console.warn('[speak] native tts failed', error);
  }
}

export async function stopSpeaking(): Promise<void> {
  if (currentAudio) {
    try { currentAudio.pause(); } catch { /* ignore */ }
    currentAudio = null;
  }
  try {
    await TextToSpeech.stop();
  } catch {
    // ignore
  }
}

/**
 * 朗读英文文本（字母名 / 英文单词）。走 iOS 原生 TextToSpeech（en-US），
 * 不使用 Azure（Azure 配的是中文音色）。失败静默兜底，不抛。
 */
export async function speakEnglish(text: string, opts?: { rate?: number }): Promise<void> {
  const trimmed = text?.trim();
  if (!trimmed) return;
  try {
    await TextToSpeech.stop();
    await TextToSpeech.speak({
      text: trimmed,
      lang: 'en-US',
      rate: opts?.rate ?? 0.9,
    });
  } catch (error) {
    console.warn('[speakEnglish] native tts failed', error);
  }
}
