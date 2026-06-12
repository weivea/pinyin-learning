import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecitePage } from './RecitePage';

const speakMock = vi.fn().mockResolvedValue(undefined);
const stopSpeakingMock = vi.fn().mockResolvedValue(undefined);
const audioMocks: MockAudio[] = [];
const failNextBySrc = new Set<string>();

class MockAudio {
  src: string;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
    audioMocks.push(this);
  }
  async play() {
    if (failNextBySrc.has(this.src)) {
      failNextBySrc.delete(this.src);
      this.onerror?.();
      return Promise.reject(new Error('mock audio failure'));
    }
    queueMicrotask(() => this.onended?.());
    return Promise.resolve();
  }
  pause() {}
}
(globalThis as any).Audio = MockAudio;

vi.mock('../hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: { id: 1, nickname: 'test', avatar: '🐣' },
    logout: vi.fn(),
  })),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: vi.fn(() => ({
    gameScores: [],
  })),
}));

vi.mock('../hooks/useReciter', () => ({
  useReciter: vi.fn(() => ({
    status: 'idle',
    currentIndex: -1,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock('../audio/speak', () => ({
  speak: (...args: unknown[]) => speakMock(...args),
  stopSpeaking: (...args: unknown[]) => stopSpeakingMock(...args),
}));

vi.mock('../components/RecitationTable', () => ({
  RecitationTable: ({ onCellClick }: { onCellClick: (item: { id: string }) => void }) => (
    <button onClick={() => onCellClick({ id: 'mock-item' })}>mock-cell</button>
  ),
}));

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div>topbar</div>,
}));

vi.mock('../components/RecitationControls', () => ({
  RecitationControls: ({ onScopeChange }: { onScopeChange: (scope: string) => void }) => (
    <div>
      <button onClick={() => onScopeChange('all')}>声母</button>
      <button onClick={() => onScopeChange('simple-final')}>单韵母</button>
      <button onClick={() => onScopeChange('compound-final')}>复韵母</button>
      <button onClick={() => onScopeChange('whole-syllable')}>整体认读</button>
    </div>
  ),
}));

vi.mock('../data/pinyin', () => ({
  getByCategory: vi.fn((category: string) => {
    const item = {
      id: `${category}-id`,
      display: category,
      category,
      hasTones: true,
      audioText: '妈',
      examples: [],
    };
    return [item];
  }),
}));

vi.mock('../components/pickAudio', () => ({
  pickAudioForItem: vi.fn(() => ({ base: 'ma', tone: 1, text: '妈' })),
}));

vi.mock('../utils/pinyin', () => ({
  pinyinAudioUrl: (base: string, tone?: number): string => {
    const t = tone && tone >= 1 && tone <= 4 ? tone : '';
    return `audio/pinyin/${base}${t}.mp3`;
  },
}));

describe('RecitePage', () => {
  beforeEach(() => {
    audioMocks.length = 0;
    failNextBySrc.clear();
    speakMock.mockClear();
    stopSpeakingMock.mockClear();
  });

  afterEach(() => {
    failNextBySrc.clear();
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

  it('静态音频失败时会回退到 speak', async () => {
    failNextBySrc.add('audio/pinyin/ma1.mp3');
    render(
      <BrowserRouter>
        <RecitePage />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'mock-cell' }));
    await waitFor(() => expect(speakMock).toHaveBeenCalledWith('妈', { rate: 0.8 }));
  });
});

