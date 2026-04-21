import type { DB } from '../db/connection.js';
import type { GameType } from '../types.js';

const VALID_GAME_TYPES: GameType[] = ['listen', 'image', 'memory'];

export class ProgressService {
  constructor(private db: DB) {}

  static isValidGameType(t: string): t is GameType {
    return (VALID_GAME_TYPES as string[]).includes(t);
  }

  recordPinyinLearned(userId: number, pinyin: string): { pinyin: string; learnedCount: number } {
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO pinyin_progress (user_id, pinyin, learned_count, last_learned_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, pinyin) DO UPDATE SET
        learned_count = learned_count + 1,
        last_learned_at = excluded.last_learned_at
    `).run(userId, pinyin, now);

    const row = this.db.prepare(
      'SELECT learned_count FROM pinyin_progress WHERE user_id = ? AND pinyin = ?'
    ).get(userId, pinyin) as { learned_count: number };

    return { pinyin, learnedCount: row.learned_count };
  }

  recordGameScore(userId: number, gameType: GameType, score: number, stars: number) {
    const prevBest = this.db.prepare(
      'SELECT MAX(score) as best FROM game_scores WHERE user_id = ? AND game_type = ?'
    ).get(userId, gameType) as { best: number | null };

    const now = Date.now();
    const result = this.db.prepare(
      'INSERT INTO game_scores (user_id, game_type, score, stars, played_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, gameType, score, stars, now);

    const isNewBest = prevBest.best === null || score > prevBest.best;
    return { id: Number(result.lastInsertRowid), gameType, score, stars, isNewBest };
  }

  getProgress(userId: number) {
    const pinyinProgress = (this.db.prepare(`
      SELECT pinyin, learned_count as learnedCount, last_learned_at as lastLearnedAt
      FROM pinyin_progress WHERE user_id = ?
    `).all(userId)) as Array<{ pinyin: string; learnedCount: number; lastLearnedAt: number }>;

    const gameScores = (this.db.prepare(`
      SELECT game_type as gameType, MAX(score) as bestScore, MAX(stars) as bestStars
      FROM game_scores WHERE user_id = ?
      GROUP BY game_type
    `).all(userId)) as Array<{ gameType: GameType; bestScore: number; bestStars: number }>;

    return { pinyinProgress, gameScores };
  }
}
