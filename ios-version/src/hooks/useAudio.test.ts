import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Setup mocks before importing useAudio
const speakMock = vi.fn().mockResolvedValue(undefined);
const stopSpeakingMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../audio/speak.ts', () => ({
  speak: (...args: any[]) => speakMock(...args),
  stopSpeaking: (...args: any[]) => stopSpeakingMock(...args),
}));

vi.mock('../utils/pinyin.ts', () => ({
  pinyinAudioUrl: (base: string, tone?: number): string => {
    const t = tone && tone >= 1 && tone <= 4 ? tone : '';
    return `audio/pinyin/${base.replace(/ü/g, 'v')}${t}.mp3`;
  },
  stripTone: (p: string) => p,
}));

// Mock Audio globally
const audioMocks: any[] = [];
class MockAudio {
  src: string;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
    audioMocks.push(this);
  }
  async play() {
    // Simulate successful play - trigger onended after a tick
    if (this.onended) {
      setTimeout(() => this.onended?.(), 0);
    }
    return Promise.resolve();
  }
  pause() {}
}
(global as any).Audio = MockAudio;

import { useAudio } from './useAudio.js';

describe('useAudio', () => {
  beforeEach(() => {
    audioMocks.length = 0;
    speakMock.mockClear();
    stopSpeakingMock.mockClear();
  });

  it('play calls speak with text', async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => {
      await result.current.play('妈');
    });
    expect(speakMock).toHaveBeenCalledWith('妈', undefined);
  });

  it('playPinyin plays static audio on success', async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => {
      await result.current.playPinyin('ma', 1);
    });
    expect(audioMocks.length).toBe(1);
    expect(audioMocks[0]!.src).toBe('audio/pinyin/ma1.mp3');
    expect(speakMock).not.toHaveBeenCalled();
  }, { timeout: 10000 });

  it('playSequence plays multiple steps', async () => {
    const { result } = renderHook(() => useAudio());
    const steps = [
      { base: 'ma', tone: 1 as const, caption: 'mā' },
      { base: 'ma', tone: 0 as const, caption: 'ma' },
    ];
    await act(async () => {
      await result.current.playSequence(steps, { gapMs: 0 });
    });
    expect(audioMocks.length).toBe(2);
    expect(audioMocks[0]!.src).toBe('audio/pinyin/ma1.mp3');
    expect(audioMocks[1]!.src).toBe('audio/pinyin/ma.mp3');
  }, { timeout: 10000 });
});

