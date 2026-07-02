import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MnemonicSection } from './MnemonicSection';

// Mock speak module
vi.mock('../audio/speak', () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn().mockResolvedValue(undefined),
}));

// 内存版 Audio：play() 后立即 onended（成功），记录所有创建的 src。
const audioSrcs: string[] = [];
class MockAudio {
  src: string;
  playbackRate = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeupdate: (() => void) | null = null;
  onloadedmetadata: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
    audioSrcs.push(src);
  }
  play() {
    queueMicrotask(() => this.onended?.());
    return Promise.resolve();
  }
  pause() {}
}
(globalThis as unknown as { Audio: unknown }).Audio = MockAudio;

describe('MnemonicSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioSrcs.length = 0;
  });

  it('mnemonic 与 rhyme 均缺失时不渲染', () => {
    const { container } = render(<MnemonicSection pinyinId="b" />);
    expect(container.firstChild).toBeNull();
  });

  it('仅 mnemonic 时渲染 emoji 与 hint，无口诀按钮', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
      />
    );
    expect(screen.getByText('📻')).toBeInTheDocument();
    expect(screen.getByText('像小喇叭')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /听口诀/ })).toBeNull();
  });

  it('仅 rhyme 时渲染口诀区与按钮，无 emoji 块', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    expect(screen.queryByText('📻')).toBeNull();
    expect(screen.getAllByTestId('rhyme-token').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /听口诀/ })).toBeInTheDocument();
  });

  it('mnemonic 与 rhyme 都提供时全部渲染', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    expect(screen.getByText('📻')).toBeInTheDocument();
    expect(screen.getByText('像小喇叭')).toBeInTheDocument();
    expect(screen.getAllByTestId('rhyme-token').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /听口诀/ })).toBeInTheDocument();
  });

  it('点击 emoji 按钮会调用 speak(mnemonic.hint)', async () => {
    const { speak } = await import('../audio/speak');
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
      />
    );
    const btn = screen.getByRole('button', { name: /朗读：像小喇叭/ });
    fireEvent.click(btn);
    await waitFor(() => expect(speak).toHaveBeenCalledWith('像小喇叭'));
  });

  it('听口诀会播放拼音段静态音频（不被 HEAD 预检拦截）', async () => {
    render(
      <MnemonicSection
        pinyinId="b"
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /听口诀/ }));
    // 拼音段 b 应直接尝试播放打包静态音频，而不是因 HEAD 预检失败被跳过。
    await waitFor(() =>
      expect(audioSrcs.some(s => s.includes('audio/pinyin/b'))).toBe(true),
    );
  });
});
