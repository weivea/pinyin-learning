import type { PinyinProgress, GameBest, GameType } from '../types';
import * as store from '../storage/progressStore';

export interface ProgressResponse {
  pinyinProgress: PinyinProgress[];
  gameScores: GameBest[];
}

export function getProgress(userId: number): Promise<ProgressResponse> {
  return store.getProgress(userId);
}

export function recordPinyinLearned(userId: number, pinyin: string) {
  return store.recordPinyinLearned(userId, pinyin);
}

export function recordGameScore(userId: number, gameType: GameType, score: number, stars: number) {
  return store.recordGameScore(userId, gameType, score, stars);
}
