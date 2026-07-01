import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LetterDetailPage } from './LetterDetailPage';

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: { id: 1, nickname: '小明', avatar: '🐣' },
    logout: vi.fn(),
  })),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: vi.fn(() => ({ gameScores: [], learnPinyin: vi.fn() })),
}));

const speakMock = vi.fn().mockResolvedValue(undefined);
const speakEnglishMock = vi.fn().mockResolvedValue(undefined);
const stopSpeakingMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../audio/speak', () => ({
  speak: (...args: unknown[]) => speakMock(...args),
  speakEnglish: (...args: unknown[]) => speakEnglishMock(...args),
  stopSpeaking: (...args: unknown[]) => stopSpeakingMock(...args),
}));

describe('LetterDetailPage', () => {
  it('渲染字母 A 的各个模块', () => {
    render(
      <MemoryRouter initialEntries={['/letters/a']}>
        <Routes>
          <Route path="/letters/:letter" element={<LetterDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: '朗读字母 A' })).toBeInTheDocument();
    expect(screen.getByText('✏️ 字母怎么写')).toBeInTheDocument();
    expect(screen.getByText('🀄 在拼音里怎么读')).toBeInTheDocument();
    expect(screen.getByText('🖼️ 用它开头的单词')).toBeInTheDocument();
    expect(screen.getByText('🖊️ 照着写一写')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('ā（啊）')).toBeInTheDocument();
  });

  it('非法字母重定向（不渲染详情）', () => {
    render(
      <MemoryRouter initialEntries={['/letters/1']}>
        <Routes>
          <Route path="/letters/:letter" element={<LetterDetailPage />} />
          <Route path="/letters" element={<div>字母表首页</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('字母表首页')).toBeInTheDocument();
  });
});
