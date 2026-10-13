import type { GameType, PuzzleGameType } from '../types';

export const LEARNING_GAME_TYPES = ['listen', 'image', 'memory', 'hanzi'] as const;
export const PUZZLE_GAME_TYPES = ['pattern', 'sorting', 'maze', 'missing', 'shapes'] as const;
export const ALL_GAME_TYPES = [...LEARNING_GAME_TYPES, ...PUZZLE_GAME_TYPES];

interface GameInfo {
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const GAME_INFO: Record<GameType, GameInfo> = {
  listen: { label: '听音选字母', emoji: '🎧', color: '#8ecae6', description: '听一听，认一认拼音' },
  image: { label: '看图选拼音', emoji: '🖼', color: '#fb8500', description: '给图片找到它的拼音' },
  memory: { label: '翻牌配对', emoji: '🃏', color: '#06d6a0', description: '找到相同的拼音卡片' },
  hanzi: { label: '跟我写汉字', emoji: '✍️', color: '#bb8fce', description: '跟着笔顺描一描' },
  pattern: { label: '规律小火车', emoji: '🚂', color: '#f4a261', description: '看看下一节车厢装什么' },
  sorting: { label: '动物分类屋', emoji: '🏡', color: '#74c69d', description: '按种类、颜色和大小找家' },
  maze: { label: '小兔找萝卜', emoji: '🐇', color: '#8ecae6', description: '想一想，哪条小路能走通' },
  missing: { label: '谁藏起来了', emoji: '🙈', color: '#c3a6df', description: '记一记，找出藏起来的伙伴' },
  shapes: { label: '图形拼拼乐', emoji: '🧩', color: '#ffd166', description: '用小图形拼出大作品' },
};

export function isPuzzleGame(type: GameType): type is PuzzleGameType {
  return PUZZLE_GAME_TYPES.some(puzzleType => puzzleType === type);
}
