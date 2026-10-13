import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';
import { Preferences } from '@capacitor/preferences';
import { PUZZLE_GAME_TYPES } from '../data/games';
import { PUZZLE_ROUND_COUNT } from '../data/puzzleGames';
import { getProgress, recordGameScore } from './progressStore';
import { getPuzzleProgress, restartPuzzle, savePuzzleLevel } from './puzzleStore';

const mock = installPreferencesMock();

describe('saved puzzle levels', () => {
  beforeEach(() => mock.reset());
  afterEach(() => { vi.restoreAllMocks(); });

  it('saves every game separately, restores cumulative points, and isolates profiles', async () => {
    for (const type of PUZZLE_GAME_TYPES) {
      await savePuzzleLevel(1, type, 0, 20);
      await savePuzzleLevel(1, type, 1, 16);
    }
    await savePuzzleLevel(2, 'pattern', 0, 10);
    const progress = await getPuzzleProgress(1);
    expect(progress).toHaveLength(5);
    for (const type of PUZZLE_GAME_TYPES) {
      expect(progress.find(item => item.gameType === type)).toMatchObject({
        levelScores: [20, 16], bestScore: null,
      });
    }
    expect((await getPuzzleProgress(2))[0].levelScores).toEqual([10]);
    expect((await getProgress(1)).gameScores).toEqual([]);
  });

  it('counts a retried level only once, even if a write succeeded before reporting an error', async () => {
    vi.spyOn(Preferences, 'set').mockImplementationOnce(async ({ key, value }) => {
      mock.raw.set(key, value);
      throw new Error('lost acknowledgement');
    });
    await expect(savePuzzleLevel(1, 'maze', 0, 18)).rejects.toThrow('lost acknowledgement');
    expect((await savePuzzleLevel(1, 'maze', 0, 18)).levelScores).toEqual([18]);
    expect((await savePuzzleLevel(1, 'maze', 0, 18)).levelScores).toEqual([18]);
    await expect(savePuzzleLevel(1, 'maze', 0, 20)).rejects.toThrow('different score');
  });

  it('preserves the last checkpoint on failed writes and permits a successful retry', async () => {
    await savePuzzleLevel(1, 'missing', 0, 18);
    vi.spyOn(Preferences, 'set').mockRejectedValueOnce(new Error('storage full'));
    await expect(savePuzzleLevel(1, 'missing', 1, 20)).rejects.toThrow('storage full');
    expect((await getPuzzleProgress(1))[0].levelScores).toEqual([18]);
    expect((await savePuzzleLevel(1, 'missing', 1, 20)).levelScores).toEqual([18, 20]);
  });

  it('saves the fiftieth level and best score together, preserving best results when replaying', async () => {
    await recordGameScore(1, 'pattern', 100, 3);
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const progress = await savePuzzleLevel(1, 'pattern', level, 20);
      expect(progress.levelScores).toHaveLength(level + 1);
      expect(progress.bestScore).toBe(level === 49 ? 1000 : null);
    }
    expect((await getProgress(1)).gameScores).toEqual([{ gameType: 'pattern', bestScore: 1000, bestStars: 3 }]);
    const completed = (await getPuzzleProgress(1))[0];
    expect(completed.isNewBest).toBe(true);
    expect(await savePuzzleLevel(1, 'pattern', 49, 20)).toEqual(completed);
    expect((await restartPuzzle(1, 'pattern')).levelScores).toEqual([]);
    expect((await getProgress(1)).gameScores[0].bestScore).toBe(1000);
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) await savePuzzleLevel(1, 'pattern', level, 10);
    expect((await getPuzzleProgress(1))[0]).toMatchObject({ bestScore: 1000, isNewBest: false });
  });

  it('does not erase incomplete progress, skip levels, accept invalid points, or create level 51', async () => {
    await expect(savePuzzleLevel(1, 'shapes', 2, 20)).rejects.toThrow('in order');
    await expect(savePuzzleLevel(1, 'shapes', 0, 25)).rejects.toThrow(RangeError);
    await expect(savePuzzleLevel(1, 'shapes', 50, 20)).rejects.toThrow(RangeError);
    await savePuzzleLevel(1, 'shapes', 0, 20);
    await expect(restartPuzzle(1, 'shapes')).rejects.toThrow('completed');
    expect((await getPuzzleProgress(1))[0].levelScores).toEqual([20]);
  });

  it('never treats a read failure or corrupt checkpoint as a new empty game', async () => {
    await savePuzzleLevel(1, 'sorting', 0, 20);
    vi.spyOn(Preferences, 'get').mockRejectedValueOnce(new Error('read failure'));
    await expect(savePuzzleLevel(1, 'sorting', 1, 20)).rejects.toThrow('read failure');
    expect((await getPuzzleProgress(1))[0].levelScores).toEqual([20]);
    const key = 'pinyin:puzzle-progress:1:sorting';
    mock.raw.set(key, '{broken');
    await expect(getPuzzleProgress(1)).rejects.toThrow();
    await expect(savePuzzleLevel(1, 'sorting', 0, 20)).rejects.toThrow();
    expect(mock.raw.get(key)).toBe('{broken');
    mock.raw.set(key, JSON.stringify({ gameType: 'sorting', levelScores: [999], bestScore: null, isNewBest: false }));
    await expect(getPuzzleProgress(1)).rejects.toThrow('Invalid saved puzzle progress');
  });

  it('retains legacy best scores without inventing course progress', async () => {
    await recordGameScore(1, 'shapes', 100, 3);
    const progress = await getProgress(1);
    expect(progress.gameScores).toEqual([{ gameType: 'shapes', bestScore: 100, bestStars: 3 }]);
    expect(progress.puzzleProgress).toEqual([]);
  });
});
