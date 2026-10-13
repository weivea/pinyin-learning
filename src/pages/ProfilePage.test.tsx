import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_GAME_TYPES, GAME_INFO, PUZZLE_GAME_TYPES } from '../data/games';
import type { GameBest, PuzzleProgress } from '../types';
import { ProfilePage } from './ProfilePage';

const state = vi.hoisted(() => {
  const gameScores: GameBest[] = [];
  const puzzleProgress: PuzzleProgress[] = [];
  return { gameScores, puzzleProgress };
});

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ user: { id: 1, nickname: '小明', avatar: '🐣' }, logout: vi.fn() }),
}));
vi.mock('../hooks/useProgress', () => ({
  useProgress: () => ({ pinyinProgress: [], gameScores: state.gameScores, puzzleProgress: state.puzzleProgress }),
}));

describe('ProfilePage game progress', () => {
  beforeEach(() => {
    localStorage.clear();
    state.gameScores = [];
    state.puzzleProgress = [];
  });
  afterEach(cleanup);

  it('lists all nine games, including unplayed puzzle games', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    for (const type of ALL_GAME_TYPES) {
      const info = GAME_INFO[type];
      expect(screen.getByText(`${info.emoji} ${info.label}`)).toBeInTheDocument();
    }
    expect(screen.getAllByText('还没玩过')).toHaveLength(9);
  });

  it('shows each new best score separately and includes their stars in the total', () => {
    state.gameScores = PUZZLE_GAME_TYPES.map((type, index) => ({
      gameType: type, bestScore: 90 + index * 2, bestStars: 3,
    }));
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    for (const [index, type] of PUZZLE_GAME_TYPES.entries()) {
      const info = GAME_INFO[type];
      const row = screen.getByRole('group', { name: `${info.label}成绩` });
      expect(within(row).getByText(`最高 ${90 + index * 2} 分`, { exact: false })).toBeInTheDocument();
    }
    expect(screen.getByText('⭐ 15')).toBeInTheDocument();
    expect(screen.getAllByText('还没玩过')).toHaveLength(4);
  });

  it('shows saved partial-course progress and points before a final best score exists', () => {
    state.puzzleProgress = [{
      gameType: 'sorting', levelScores: [20, 18, 16], bestScore: null, isNewBest: false,
    }];
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    const row = screen.getByRole('group', { name: '动物分类屋成绩' });
    expect(within(row).getByText('已完成 3 / 50 关 · 本轮累计 54 分')).toBeInTheDocument();
    expect(within(row).queryByText('还没玩过')).not.toBeInTheDocument();
    expect(within(row).getByText('完成 50 关后领取星星')).toBeInTheDocument();
  });
});
