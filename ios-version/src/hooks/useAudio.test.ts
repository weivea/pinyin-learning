import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

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

import { useAudio } from './useAudio.js';

describe('useAudio', () => {
  beforeEach(() => {
    audioMocks.length = 0;
    failNextBySrc.clear();
    speakMock.mockClear();
    stopSpeakingMock.mockClear();
  });

  afterEach(() => {
    failNextBySrc.clear();
  });

  it('play calls speak with text', async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => {
      await result.current.play('妈');
    });
    expect(speakMock).toHaveBeenCalledWith('妈');
    expect(stopSpeakingMock).toHaveBeenCalled();
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

  it('playPinyin falls back to speak when static audio fails', async () => {
    const { result } = renderHook(() => useAudio());
    failNextBySrc.add('audio/pinyin/ma1.mp3');
    await act(async () => {
      await result.current.playPinyin('ma', 1, '妈');
    });
    expect(speakMock).toHaveBeenCalledWith('妈', { pinyin: 'ma', tone: 1 });
  }, { timeout: 10000 });

  it('playSequence uses speak fallback for hanzi when static audio fails', async () => {
    const { result } = renderHook(() => useAudio());
    failNextBySrc.add('audio/pinyin/ma1.mp3');
    await act(async () => {
      await result.current.playSequence([
        { base: 'ma', tone: 1 as const, hanzi: '妈', caption: 'mā' },
      ], { gapMs: 0 });
    });
    expect(speakMock).toHaveBeenCalledWith('妈', { rate: 0.8, pinyin: 'ma', tone: 1 });
  }, { timeout: 10000 });

  it('playSequence plays multiple steps', async () => {
    const { result } = renderHook(() => useAudio());
    const steps = [
      { base: 'ma', tone: 1 as const, caption: 'mā' },
      { base: 'ma', tone: 0 as const, caption: 'ma' },
    ];
    await act(async () => {
      await result.current.playSequence(steps as any, { gapMs: 0 });
    });
    expect(audioMocks.length).toBe(2);
    expect(audioMocks[0]!.src).toBe('audio/pinyin/ma1.mp3');
    expect(audioMocks[1]!.src).toBe('audio/pinyin/ma.mp3');
  }, { timeout: 10000 });
});

