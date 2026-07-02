export type PinyinCategory = 'initial' | 'simple-final' | 'compound-final' | 'whole-syllable';
export type GameType = 'listen' | 'image' | 'memory';

export interface ToneVariant {
  tone: 1 | 2 | 3 | 4;
  text: string;
  audioText: string;
}

export interface ExampleWord {
  hanzi: string;
  pinyin: string;
  tone: 0 | 1 | 2 | 3 | 4;
  emoji: string;
}

export interface PinyinItem {
  id: string;
  display: string;
  category: PinyinCategory;
  hasTones: boolean;
  tones?: ToneVariant[];
  audioText: string;
  examples: ExampleWord[];
  mnemonic?: MnemonicAsset;
  rhyme?: RhymeData;
}

export interface User {
  id: number;
  nickname: string;
  avatar: string;
}

export interface PinyinProgress {
  pinyin: string;
  learnedCount: number;
  lastLearnedAt: number | null;
}

export interface GameBest {
  gameType: GameType;
  bestScore: number;
  bestStars: number;
}

export interface MnemonicAsset {
  /** 形象 emoji，例如 '📻'。 */
  emoji: string;
  /** 形似提示文字（≤8 字），例如 '像小喇叭'。 */
  hint: string;
  /** 预留：未来用 svgKey 查内置 SVG 表替换 emoji。 */
  svgKey?: string;
}

export interface RhymeData {
  /** 口诀展示文本，例如 '听广播 b b b'。 */
  text: string;
  /** 可选：人工指定的节奏切片，覆盖默认 tokenize 规则。 */
  tokens?: string[];
  /** 可选：TTS 朗读用文本（与 text 不同时启用）。 */
  audioText?: string;
}

export interface HanziWord {
  /** 组词，例如 '花朵'。 */
  word: string;
  /** 组词拼音（带声调、按词注音），例如 'huā duǒ'。 */
  pinyin: string;
}

export interface HanziItem {
  /** 汉字，例如 '花'。 */
  char: string;
  /** 单字拼音（带声调），例如 'huā'。 */
  pinyin: string;
  /** 年级：1 或 2。 */
  grade: number;
  /** 分组 id：'g1a' | 'g1b' | 'g2a' | 'g2b' | 'extra'。 */
  volumeId: string;
  /** 分组名，例如 '一年级上册' / '常用字'。 */
  volume: string;
  /** 组词（2-3 个）。 */
  words: HanziWord[];
  /** 造句（1-2 句，面向低龄）。 */
  sentences: string[];
}
