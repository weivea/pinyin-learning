import { useCallback, useEffect, useState } from 'react';
import * as progressApi from '../api/progress';
import type { GameBest, GameType, PinyinProgress } from '../types';

export function useProgress(userId: number | undefined) {
  const [pinyinProgress, setPinyinProgress] = useState<PinyinProgress[]>([]);
  const [gameScores, setGameScores] = useState<GameBest[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await progressApi.getProgress(userId);
      setPinyinProgress(data.pinyinProgress);
      setGameScores(data.gameScores);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const learnPinyin = useCallback(async (pinyin: string) => {
    if (!userId) return;
    setPinyinProgress(prev => {
      const idx = prev.findIndex(p => p.pinyin === pinyin);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], learnedCount: next[idx].learnedCount + 1, lastLearnedAt: Date.now() };
        return next;
      }
      return [...prev, { pinyin, learnedCount: 1, lastLearnedAt: Date.now() }];
    });
    try {
      await progressApi.recordPinyinLearned(userId, pinyin);
    } catch (err) {
      console.warn('[useProgress] learnPinyin failed', err);
    }
  }, [userId]);

  const recordGame = useCallback(async (gameType: GameType, score: number, stars: number) => {
    if (!userId) return null;
    try {
      const result = await progressApi.recordGameScore(userId, gameType, score, stars);
      void refresh();
      return result;
    } catch (err) {
      console.warn('[useProgress] recordGame failed', err);
      return null;
    }
  }, [userId, refresh]);

  return { pinyinProgress, gameScores, loading, refresh, learnPinyin, recordGame };
}
