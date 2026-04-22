import type { PinyinItem } from '../types';

export interface PickedAudio {
  /** 静态拼音音节 base，对应 pinyinAudioUrl 的第一个参数。 */
  base: string;
  /** 1-4 = 带调；undefined = 无调（声母 / 整体认读单读）。 */
  tone?: 1 | 2 | 3 | 4;
  /** 朗读用文本（汉字），用于静态资源缺失时回退 Edge TTS。 */
  text: string;
}

/**
 * 为一个 PinyinItem 选一个具体的播放音频：
 * - hasTones=false：直接用 item.id（无调）。
 * - hasTones=true：从 item.tones 里随机抽一个调。
 */
export function pickAudioForItem(
  item: PinyinItem,
  rng: () => number = Math.random,
): PickedAudio {
  if (!item.hasTones || !item.tones || item.tones.length === 0) {
    return { base: item.id, text: item.audioText };
  }
  const idx = Math.min(item.tones.length - 1, Math.floor(rng() * item.tones.length));
  const variant = item.tones[idx];
  return { base: item.id, tone: variant.tone, text: variant.audioText };
}
