CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pinyin_progress (
  user_id INTEGER NOT NULL,
  pinyin TEXT NOT NULL,
  learned_count INTEGER DEFAULT 0,
  last_learned_at INTEGER,
  PRIMARY KEY (user_id, pinyin),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  played_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_type ON game_scores(user_id, game_type);
