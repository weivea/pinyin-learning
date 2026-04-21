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
