export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  created_at: number;
}

export interface PinyinProgressRow {
  user_id: number;
  pinyin: string;
  learned_count: number;
  last_learned_at: number | null;
}

export interface GameScoreRow {
  id: number;
  user_id: number;
  game_type: 'listen' | 'image' | 'memory';
  score: number;
  stars: number;
  played_at: number;
}

export type GameType = 'listen' | 'image' | 'memory';
