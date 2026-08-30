import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { READINGS } from '../data/readings';
import { markReadingVisited } from '../utils/readingProgress';
import { ReadingListPage } from './ReadingListPage';

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({
    user: { id: 1, nickname: '小明', avatar: '🐣' },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: () => ({ gameScores: [] }),
}));

describe('ReadingListPage', () => {
  beforeEach(() => localStorage.clear());

  it('shows all 20 passages and marks opened passages as read', () => {
    markReadingVisited(1, READINGS[0].id);
    render(
      <MemoryRouter>
        <ReadingListPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /第 \d+ 篇/ })).toHaveLength(20);
    expect(screen.getByText(`已读 1 / ${READINGS.length} 篇`)).toBeInTheDocument();
    expect(screen.getByRole('link', {
      name: `第 1 篇，${READINGS[0].title}，已读`,
    })).toBeInTheDocument();
  });
});
