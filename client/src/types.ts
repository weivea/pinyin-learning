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
