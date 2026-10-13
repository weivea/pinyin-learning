import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';

const mock = installPreferencesMock();

import { recordPinyinLearned, recordGameScore, getProgress } from './progressStore';
import { PUZZLE_GAME_TYPES } from '../data/games';

describe('progressStore', () => {
  beforeEach(() => { mock.reset(); vi.clearAllMocks(); });

  it('accumulates learnedCount per (user,pinyin)', async () => {
    expect((await recordPinyinLearned(1, 'b')).learnedCount).toBe(1);
    expect((await recordPinyinLearned(1, 'b')).learnedCount).toBe(2);
    expect((await recordPinyinLearned(1, 'p')).learnedCount).toBe(1);
  });

  it('isolates progress between users', async () => {
    await recordPinyinLearned(1, 'b');
    await recordPinyinLearned(2, 'b');
    const u1 = await getProgress(1);
    expect(u1.pinyinProgress.find(p => p.pinyin === 'b')?.learnedCount).toBe(1);
  });

  it('keeps best game score and flags new best', async () => {
    const r1 = await recordGameScore(1, 'listen', 50, 2);
    expect(r1.isNewBest).toBe(true);
    const r2 = await recordGameScore(1, 'listen', 30, 1);
    expect(r2.isNewBest).toBe(false);
    const r3 = await recordGameScore(1, 'listen', 80, 3);
    expect(r3.isNewBest).toBe(true);

    const { gameScores } = await getProgress(1);
    const best = gameScores.find(g => g.gameType === 'listen');
    expect(best).toMatchObject({ bestScore: 80, bestStars: 3 });
  });

  it('persists separate puzzle records alongside existing games and isolates users', async () => {
    await recordGameScore(1, 'listen', 8, 2);
    for (const type of PUZZLE_GAME_TYPES) {
      expect((await recordGameScore(1, type, 90, 3)).isNewBest).toBe(true);
      expect((await recordGameScore(1, type, 60, 1)).isNewBest).toBe(false);
    }
    await recordGameScore(2, 'pattern', 50, 1);

    const first = await getProgress(1);
    expect(first.gameScores).toHaveLength(6);
    for (const type of PUZZLE_GAME_TYPES) {
      expect(first.gameScores.find(game => game.gameType === type)).toEqual({
        gameType: type, bestScore: 90, bestStars: 3,
      });
    }
    expect(first.gameScores.find(game => game.gameType === 'listen')?.bestScore).toBe(8);
    expect((await getProgress(2)).gameScores).toEqual([{ gameType: 'pattern', bestScore: 50, bestStars: 1 }]);
  });
});
