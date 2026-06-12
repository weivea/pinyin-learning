import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecitePage } from './RecitePage';

// Mock hooks
vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: { id: 'test-user', nickname: 'test', avatar: '🐣' },
    logout: vi.fn(),
  })),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: vi.fn(() => ({
    gameScores: [],
  })),
}));

vi.mock('../hooks/useReciter', () => ({
  useReciter: vi.fn((items, opts) => ({
    status: 'idle',
    currentIndex: -1,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
  })),
}));

// Mock speak module (for potential fallback)
vi.mock('../audio/speak', () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn().mockResolvedValue(undefined),
}));

describe('RecitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该能正常渲染而不出错', () => {
    render(
      <BrowserRouter>
        <RecitePage />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /声母/ })).toBeInTheDocument();
  });

  it('应该显示所有分类按钮', () => {
    render(
      <BrowserRouter>
        <RecitePage />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /声母/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /单韵母/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /复韵母/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /整体认读/ })).toBeInTheDocument();
  });
});

