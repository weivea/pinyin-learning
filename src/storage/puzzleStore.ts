import { PUZZLE_GAME_TYPES } from '../data/games';
import { PUZZLE_ROUND_COUNT, puzzleStage } from '../data/puzzleGames';
import type { PuzzleGameType, PuzzleProgress } from '../types';
import { getJSON, setJSON } from './local';

const puzzleKey = (userId: number, type: PuzzleGameType) => `pinyin:puzzle-progress:${userId}:${type}`;

function validProgress(value: unknown, type: PuzzleGameType): value is PuzzleProgress {
  if (typeof value !== 'object' || value === null) return false;
  return 'gameType' in value && value.gameType === type
    && 'levelScores' in value && Array.isArray(value.levelScores)
    && value.levelScores.length <= PUZZLE_ROUND_COUNT
    && value.levelScores.every(score => Number.isInteger(score) && score >= 10 && score <= 20)
    && 'bestScore' in value
    && (value.bestScore === null || (typeof value.bestScore === 'number'
      && Number.isInteger(value.bestScore) && value.bestScore >= PUZZLE_ROUND_COUNT * 10
      && value.bestScore <= PUZZLE_ROUND_COUNT * 20))
    && 'isNewBest' in value && typeof value.isNewBest === 'boolean';
}

async function readPuzzle(userId: number, type: PuzzleGameType): Promise<PuzzleProgress | null> {
  const value = await getJSON<unknown>(puzzleKey(userId, type), null, { strict: true });
  if (value === null) return null;
  if (!validProgress(value, type)) throw new Error(`Invalid saved puzzle progress: ${type}`);
  return value;
}

export async function getPuzzleProgress(userId: number): Promise<PuzzleProgress[]> {
  const progress = await Promise.all(PUZZLE_GAME_TYPES.map(type => readPuzzle(userId, type)));
  return progress.filter((entry): entry is PuzzleProgress => entry !== null);
}

export async function savePuzzleLevel(
  userId: number,
  type: PuzzleGameType,
  level: number,
  score: number,
): Promise<PuzzleProgress> {
  puzzleStage(level);
  if (!Number.isInteger(score) || score < 10 || score > 20) throw new RangeError(`Invalid puzzle score: ${score}`);
  const current = await readPuzzle(userId, type) ?? { gameType: type, levelScores: [], bestScore: null, isNewBest: false };
  if (level < current.levelScores.length) {
    if (current.levelScores[level] !== score) throw new Error('This level has already been saved with a different score');
    return current;
  }
  if (level !== current.levelScores.length) throw new Error('Puzzle levels must be completed in order');
  const levelScores = [...current.levelScores, score];
  const total = levelScores.reduce((sum, value) => sum + value, 0);
  const isNewBest = levelScores.length === PUZZLE_ROUND_COUNT && (current.bestScore === null || total > current.bestScore);
  const next: PuzzleProgress = {
    gameType: type,
    levelScores,
    bestScore: isNewBest ? total : current.bestScore,
    isNewBest,
  };
  // The last level and its best score share one write, so a restart cannot lose the result.
  await setJSON(puzzleKey(userId, type), next);
  return next;
}

export async function restartPuzzle(userId: number, type: PuzzleGameType): Promise<PuzzleProgress> {
  const current = await readPuzzle(userId, type);
  if (!current || current.levelScores.length !== PUZZLE_ROUND_COUNT) {
    throw new Error('Only a completed puzzle run can be restarted');
  }
  const next: PuzzleProgress = { ...current, levelScores: [], isNewBest: false };
  await setJSON(puzzleKey(userId, type), next);
  return next;
}
