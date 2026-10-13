import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';
import { Preferences } from '@capacitor/preferences';
import { useProgress } from './useProgress';

const mock = installPreferencesMock();

describe('useProgress puzzle persistence', () => {
  beforeEach(() => mock.reset());
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('updates the live checkpoint and reloads it when the game screen reopens', async () => {
    const first = renderHook(() => useProgress(1));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await act(async () => { await first.result.current.savePuzzleLevel('pattern', 0, 18); });
    expect(first.result.current.puzzleProgress[0].levelScores).toEqual([18]);
    first.unmount();
    const second = renderHook(() => useProgress(1));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.puzzleProgress[0].levelScores).toEqual([18]);
  });

  it('reports read errors so the menu can block unsafe fresh starts', async () => {
    mock.raw.set('pinyin:puzzle-progress:1:maze', '{broken');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useProgress(1));
    await waitFor(() => expect(result.current.error).toBe('进度暂时无法读取，请重试。'));
    expect(result.current.loading).toBe(false);
    expect(warning).toHaveBeenCalled();
    mock.raw.delete('pinyin:puzzle-progress:1:maze');
    await act(async () => { await result.current.refresh(); });
    expect(result.current.error).toBeNull();
  });

  it('returns a visible-failure signal and leaves live progress unchanged if saving fails', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useProgress(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.spyOn(Preferences, 'set').mockRejectedValueOnce(new Error('full'));
    await act(async () => {
      expect(await result.current.savePuzzleLevel('missing', 0, 20)).toBeNull();
    });
    expect(result.current.puzzleProgress).toEqual([]);
    expect(warning).toHaveBeenCalled();
    await act(async () => { await result.current.savePuzzleLevel('missing', 0, 20); });
    expect(result.current.puzzleProgress[0].levelScores).toEqual([20]);
  });
});
