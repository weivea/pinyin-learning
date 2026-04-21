import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/connection.js';

describe('createDb', () => {
  it('creates schema with users table', () => {
    const db = createDb(':memory:');
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    expect(stmt.get()).toEqual({ name: 'users' });
  });

  it('creates pinyin_progress and game_scores tables', () => {
    const db = createDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('pinyin_progress');
    expect(names).toContain('game_scores');
  });
});
