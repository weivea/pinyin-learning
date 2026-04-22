import { stripTone } from './pinyin';

export interface SpellStep {
  /** 该段去声调的拼音 base，用于查找静态音频或作为 TTS phoneme 的 pinyin。 */
  base: string;
  /** 1-4 = 加调播放（仅最后一段使用）；undefined = 无调音段。 */
  tone?: 1 | 2 | 3 | 4;
  /** 仅最后一段携带：用于静态音频缺失时的 Edge TTS phoneme 回退。 */
  hanzi?: string;
  /** 字幕展示文字。 */
  caption: string;
}

const INITIALS_LONG = ['zh', 'ch', 'sh'];
const INITIALS_SHORT = [
  'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
  'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's',
];

const WHOLE_SYLLABLES = new Set([
  'zhi', 'chi', 'shi', 'ri',
  'zi', 'ci', 'si',
  'yi', 'wu', 'yu',
  'ye', 'yue', 'yuan',
  'yin', 'yun', 'ying',
]);

const ZERO_INITIAL_BASES = new Set([
  'a', 'ai', 'an', 'ang', 'ao',
  'e', 'ei', 'en', 'eng', 'er',
  'o', 'ou',
]);

/** 三拼介母后允许的韵母尾部，用于切分三拼音节。 */
const TRI_TAILS = new Set([
  'a', 'o', 'e', 'ai', 'an', 'ang', 'ao', 'n',
]);

const TONE_NUM: Record<string, 1 | 2 | 3 | 4> = {
  ā: 1, á: 2, ǎ: 3, à: 4,
  ō: 1, ó: 2, ǒ: 3, ò: 4,
  ē: 1, é: 2, ě: 3, è: 4,
  ī: 1, í: 2, ǐ: 3, ì: 4,
  ū: 1, ú: 2, ǔ: 3, ù: 4,
  ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
};

function extractTone(pinyin: string): 1 | 2 | 3 | 4 | undefined {
  for (const ch of pinyin) {
    if (TONE_NUM[ch]) return TONE_NUM[ch];
  }
  return undefined;
}

function splitInitial(base: string): { initial: string; rest: string } {
  for (const i of INITIALS_LONG) {
    if (base.startsWith(i)) return { initial: i, rest: base.slice(i.length) };
  }
  for (const i of INITIALS_SHORT) {
    if (base.startsWith(i)) return { initial: i, rest: base.slice(i.length) };
  }
  return { initial: '', rest: base };
}

/**
 * 把例字与其拼音切分为 3 / 4 段拼读步骤。
 * 详见 docs/superpowers/specs/2026-04-22-pinyin-spelling-design.md
 */
export function buildSpellSteps(hanzi: string, pinyin: string): SpellStep[] {
  const base = stripTone(pinyin);
  const tone = extractTone(pinyin);
  const finalCaption = `${pinyin} ${hanzi}`;

  // 1. 整体认读音节
  if (WHOLE_SYLLABLES.has(base)) {
    return [
      { base, caption: base },
      { base, tone, hanzi, caption: finalCaption },
    ];
  }

  // 2. 零声母
  if (ZERO_INITIAL_BASES.has(base)) {
    return [
      { base, caption: base },
      { base, tone, hanzi, caption: finalCaption },
    ];
  }

  // 3. 拆声母
  const { initial, rest } = splitInitial(base);
  if (!initial || rest.length === 0) {
    // 兜底：作为整体认读处理
    return [
      { base, caption: base },
      { base, tone, hanzi, caption: finalCaption },
    ];
  }

  // 4. j/q/x 后的 u 实为 ü
  const restUe = (initial === 'j' || initial === 'q' || initial === 'x') && rest.startsWith('u')
    ? 'ü' + rest.slice(1)
    : rest;

  // 5. 三拼判定：rest 第一个字符是介母 i/u/ü，且剩下的部分是允许的韵母尾
  const head = restUe[0];
  if ((head === 'i' || head === 'u' || head === 'ü') && restUe.length > 1) {
    const tail = restUe.slice(1);
    if (TRI_TAILS.has(tail)) {
      return [
        { base: initial, caption: initial },
        { base: head, caption: head },
        { base: tail, caption: tail },
        { base: tail, tone, hanzi, caption: finalCaption },
      ];
    }
  }

  // 6. 两拼
  return [
    { base: initial, caption: initial },
    { base: restUe, caption: restUe },
    { base: restUe, tone, hanzi, caption: finalCaption },
  ];
}
