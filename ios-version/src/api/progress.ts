import { apiFetch } from './client';
import type { PinyinProgress, GameBest, GameType } from '../types';

export interface ProgressResponse {
  pinyinProgress: PinyinProgress[];
  gameScores: GameBest[];
}

export function getProgress(userId: number): Promise<ProgressResponse> {
  return apiFetch<ProgressResponse>(`/api/progress/${userId}`);
}

export function recordPinyinLearned(userId: number, pinyin: string) {
  return apiFetch<{ pinyin: string; learnedCount: number }>(`/api/progress/${userId}/pinyin`, {
    method: 'POST',
    body: JSON.stringify({ pinyin }),
  });
}

export function recordGameScore(userId: number, gameType: GameType, score: number, stars: number) {
  return apiFetch<{ id: number; gameType: GameType; score: number; stars: number; isNewBest: boolean }>(
    `/api/progress/${userId}/game`,
    { method: 'POST', body: JSON.stringify({ gameType, score, stars }) },
  );
}
