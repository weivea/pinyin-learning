import { useCallback, useEffect, useState } from 'react';
import * as progressApi from '../api/progress';
import type { GameBest, GameType, PinyinProgress, PuzzleGameType, PuzzleProgress } from '../types';

export function useProgress(userId: number | undefined) {
  const [pinyinProgress, setPinyinProgress] = useState<PinyinProgress[]>([]);
  const [gameScores, setGameScores] = useState<GameBest[]>([]);
  const [puzzleProgress, setPuzzleProgress] = useState<PuzzleProgress[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await progressApi.getProgress(userId);
      setPinyinProgress(data.pinyinProgress);
      setGameScores(data.gameScores);
      setPuzzleProgress(data.puzzleProgress);
      setError(null);
    } catch (err) {
      console.warn('[useProgress] refresh failed', err);
      setError('进度暂时无法读取，请重试。');
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

  const updatePuzzle = useCallback((progress: PuzzleProgress) => {
    setPuzzleProgress(previous => [...previous.filter(item => item.gameType !== progress.gameType), progress]);
    const bestScore = progress.bestScore;
    if (bestScore === null) return;
    setGameScores(previous => {
      const current = previous.find(item => item.gameType === progress.gameType);
      return [
        ...previous.filter(item => item.gameType !== progress.gameType),
        {
          gameType: progress.gameType,
          bestScore: Math.max(current?.bestScore ?? 0, bestScore),
          bestStars: Math.max(current?.bestStars ?? 0, progress.bestStars),
        },
      ];
    });
  }, []);

  const savePuzzleLevel = useCallback(async (type: PuzzleGameType, level: number, score: number) => {
    try {
      if (!userId) throw new Error('A user is required to save puzzle progress');
      const progress = await progressApi.savePuzzleLevel(userId, type, level, score);
      updatePuzzle(progress);
      return progress;
    } catch (err) {
      console.warn('[useProgress] savePuzzleLevel failed', err);
      return null;
    }
  }, [userId, updatePuzzle]);

  const restartPuzzle = useCallback(async (type: PuzzleGameType) => {
    try {
      if (!userId) throw new Error('A user is required to restart a puzzle');
      const progress = await progressApi.restartPuzzle(userId, type);
      updatePuzzle(progress);
      return progress;
    } catch (err) {
      console.warn('[useProgress] restartPuzzle failed', err);
      return null;
    }
  }, [userId, updatePuzzle]);

  return { pinyinProgress, gameScores, puzzleProgress, loading, error, refresh, learnPinyin, recordGame, savePuzzleLevel, restartPuzzle };
}
