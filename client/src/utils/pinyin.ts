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
