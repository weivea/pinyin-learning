import type { GameType, PinyinProgress, GameBest, PuzzleProgress } from '../types';
import { getJSON, setJSON } from './local';
import { getPuzzleProgress } from './puzzleStore';

interface GameScoreRow { gameType: GameType; score: number; stars: number; playedAt: number; }

const pinyinKey = (userId: number) => `pinyin:progress:${userId}`;
const gameKey = (userId: number) => `pinyin:games:${userId}`;

export async function recordPinyinLearned(
  userId: number,
  pinyin: string,
): Promise<{ pinyin: string; learnedCount: number }> {
  const list = await getJSON<PinyinProgress[]>(pinyinKey(userId), []);
  const now = Date.now();
  const idx = list.findIndex(p => p.pinyin === pinyin);
  if (idx >= 0) {
    list[idx] = { ...list[idx], learnedCount: list[idx].learnedCount + 1, lastLearnedAt: now };
  } else {
    list.push({ pinyin, learnedCount: 1, lastLearnedAt: now });
  }
  await setJSON(pinyinKey(userId), list);
  const learnedCount = list.find(p => p.pinyin === pinyin)!.learnedCount;
  return { pinyin, learnedCount };
}

export async function recordGameScore(
  userId: number,
  gameType: GameType,
  score: number,
  stars: number,
): Promise<{ gameType: GameType; score: number; stars: number; isNewBest: boolean }> {
  const rows = await getJSON<GameScoreRow[]>(gameKey(userId), []);
  const prevBest = rows
    .filter(r => r.gameType === gameType)
    .reduce<number | null>((max, r) => (max === null ? r.score : Math.max(max, r.score)), null);
  rows.push({ gameType, score, stars, playedAt: Date.now() });
  await setJSON(gameKey(userId), rows);
  const isNewBest = prevBest === null || score > prevBest;
  return { gameType, score, stars, isNewBest };
}

export async function getProgress(
  userId: number,
): Promise<{ pinyinProgress: PinyinProgress[]; gameScores: GameBest[]; puzzleProgress: PuzzleProgress[] }> {
  const pinyinProgress = await getJSON<PinyinProgress[]>(pinyinKey(userId), []);
  const rows = await getJSON<GameScoreRow[]>(gameKey(userId), []);
  const puzzleProgress = await getPuzzleProgress(userId);

  const byType = new Map<GameType, GameBest>();
  for (const r of rows) {
    const cur = byType.get(r.gameType);
    if (!cur) {
      byType.set(r.gameType, { gameType: r.gameType, bestScore: r.score, bestStars: r.stars });
    } else {
      cur.bestScore = Math.max(cur.bestScore, r.score);
      cur.bestStars = Math.max(cur.bestStars, r.stars);
    }
  }
  for (const progress of puzzleProgress) {
    if (progress.bestScore === null) continue;
    const current = byType.get(progress.gameType);
    byType.set(progress.gameType, {
      gameType: progress.gameType,
      bestScore: Math.max(current?.bestScore ?? 0, progress.bestScore),
      bestStars: Math.max(current?.bestStars ?? 0, progress.bestStars),
    });
  }
  return { pinyinProgress, gameScores: [...byType.values()], puzzleProgress };
}
