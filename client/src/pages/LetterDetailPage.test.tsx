import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LetterDetailPage } from './LetterDetailPage';

// 避免真实网络请求：mock 进度接口。
vi.mock('../api/progress', () => ({
  getProgress: vi.fn().mockResolvedValue({ pinyinProgress: [], gameScores: [] }),
  recordPinyinLearned: vi.fn(),
  recordGameScore: vi.fn(),
}));

function seedUser() {
  localStorage.setItem(
    'pinyin-learning:user',
    JSON.stringify({ id: 1, nickname: '小明', avatar: '🐣' }),
  );
}

describe('LetterDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    seedUser();
  });

  it('渲染字母 A 的各个模块', () => {
    render(
      <MemoryRouter initialEntries={['/letters/a']}>
        <Routes>
          <Route path="/letters/:letter" element={<LetterDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // 介绍区
    expect(screen.getByRole('button', { name: '朗读字母 A' })).toBeInTheDocument();
    // 五个学习模块标题
    expect(screen.getByText('✏️ 字母怎么写')).toBeInTheDocument();
    expect(screen.getByText('🀄 在拼音里怎么读')).toBeInTheDocument();
    expect(screen.getByText('🖼️ 用它开头的单词')).toBeInTheDocument();
    expect(screen.getByText('🖊️ 照着写一写')).toBeInTheDocument();
    // 例词
    expect(screen.getByText('Apple')).toBeInTheDocument();
    // 拼音读音
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
