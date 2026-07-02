import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HanziDetailPage } from './HanziDetailPage';

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: { id: 1, nickname: '小明', avatar: '🐣' },
    logout: vi.fn(),
  })),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: vi.fn(() => ({ gameScores: [], learnPinyin: vi.fn() })),
}));

const playMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../hooks/useAudio', () => ({
  useAudio: vi.fn(() => ({ play: playMock })),
}));

describe('HanziDetailPage', () => {
  it('渲染汉字「花」的拼音、组词、造句模块', () => {
    render(
      <MemoryRouter initialEntries={['/hanzi/%E8%8A%B1']}>
        <Routes>
          <Route path="/hanzi/:char" element={<HanziDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: '朗读汉字 花' })).toBeInTheDocument();
    expect(screen.getByText('🧩 组词')).toBeInTheDocument();
    expect(screen.getByText('💬 造句')).toBeInTheDocument();
    expect(screen.getByText('花朵')).toBeInTheDocument();
  });

  it('未知汉字重定向到汉字表', () => {
    render(
      <MemoryRouter initialEntries={['/hanzi/%E9%BE%99%E9%BE%99']}>
        <Routes>
          <Route path="/hanzi/:char" element={<HanziDetailPage />} />
          <Route path="/hanzi" element={<div>汉字表首页</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('汉字表首页')).toBeInTheDocument();
  });
});
