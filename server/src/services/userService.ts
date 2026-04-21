import type { DB } from '../db/connection.js';
import type { User } from '../types.js';

export class UserService {
  constructor(private db: DB) {}

  upsertByNickname(nickname: string, avatar: string): User {
    const existing = this.db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname) as User | undefined;
    if (existing) return existing;

    const now = Date.now();
    const result = this.db.prepare(
      'INSERT INTO users (nickname, avatar, created_at) VALUES (?, ?, ?)'
    ).run(nickname, avatar, now);

    return {
      id: Number(result.lastInsertRowid),
      nickname,
      avatar,
      created_at: now,
    };
  }

  getById(id: number): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return row ?? null;
  }
}
