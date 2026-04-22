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

/**
 * 把拼音音节映射到 du.hanyupinyin.cn 提供的 mp3 文件名。
 *
 * - 声母 / 无调音节: `b` → `b.mp3`
 * - 带调音节: `mā` 或 (base="ma", tone=1) → `ma1.mp3`
 * - ü → v 转换: `üě` → `ve3.mp3`
 *
 * 调用方需保证 base 是去声调后的拼音；轻声 (tone=0) 当作"无调"返回 `<base>.mp3`。
 */
export function pinyinAudioFile(base: string, tone?: 0 | 1 | 2 | 3 | 4): string {
  const v = base.replace(/ü/g, 'v').toLowerCase();
  if (tone && tone >= 1 && tone <= 4) {
    return `${v}${tone}.mp3`;
  }
  return `${v}.mp3`;
}

/** 完整的播放 URL（走后端静态路由）。 */
export function pinyinAudioUrl(base: string, tone?: 0 | 1 | 2 | 3 | 4): string {
  return `/api/audio/pinyin/${pinyinAudioFile(base, tone)}`;
}
