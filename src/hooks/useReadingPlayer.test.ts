import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const speakMock = vi.fn();
const stopSpeakingMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../audio/speak', () => ({
  speak: (...args: unknown[]) => speakMock(...args),
  stopSpeaking: (...args: unknown[]) => stopSpeakingMock(...args),
}));

import { useReadingPlayer } from './useReadingPlayer';

const sentences = [
  { text: '第一句。' },
  { text: '第二句。' },
];

describe('useReadingPlayer', () => {
  beforeEach(() => {
    speakMock.mockReset();
    stopSpeakingMock.mockClear();
    stopSpeakingMock.mockResolvedValue(undefined);
  });

  it('plays all sentences in order and finishes', async () => {
    speakMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useReadingPlayer(sentences));

    await act(async () => {
      result.current.play();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(speakMock).toHaveBeenNthCalledWith(1, '第一句。', { rate: 0.88 });
    expect(speakMock).toHaveBeenNthCalledWith(2, '第二句。', { rate: 0.88 });
    expect(result.current.status).toBe('finished');
    expect(result.current.currentIndex).toBe(-1);
  });

  it('pauses immediately and resumes from the current sentence', async () => {
    let resolveFirst!: () => void;
    let resolveResume!: () => void;
    speakMock
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveResume = resolve; }));
    const { result } = renderHook(() => useReadingPlayer(sentences));

    await act(async () => {
      result.current.play();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => result.current.pause());
    expect(result.current.status).toBe('paused');
    expect(stopSpeakingMock).toHaveBeenCalled();

    await act(async () => {
      result.current.play();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(speakMock).toHaveBeenNthCalledWith(2, '第一句。', { rate: 0.88 });
    expect(result.current.currentIndex).toBe(0);

    await act(async () => {
      resolveFirst();
      resolveResume();
      await Promise.resolve();
      await Promise.resolve();
    });
  });
});
