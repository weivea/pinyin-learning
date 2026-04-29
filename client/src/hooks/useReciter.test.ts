import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReciter } from './useReciter';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('useReciter', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('starts in idle with currentIndex -1', () => {
    const { result } = renderHook(() =>
      useReciter(items, { onItem: vi.fn().mockResolvedValue(undefined) }),
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.currentIndex).toBe(-1);
  });

  it('start() moves to playing and invokes onItem with index 0', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100 }));
    await act(async () => { result.current.start(); });
    expect(result.current.status).toBe('playing');
    expect(result.current.currentIndex).toBe(0);
    expect(onItem).toHaveBeenCalledWith(items[0], 0);
  });

  it('reset() returns to idle and currentIndex -1', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100 }));
    await act(async () => { result.current.start(); });
    act(() => { result.current.reset(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.currentIndex).toBe(-1);
  });

  it('advances to next item after gap and finishes at end', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 50 }));
    await act(async () => { result.current.start(); });
    // 第 1 个：playPromise resolve → 等 gap 100ms → 进入 index 1
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.currentIndex).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.currentIndex).toBe(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.status).toBe('finished');
    expect(onItem).toHaveBeenCalledTimes(3);
  });

  it('perItemTimeoutMs bounds a stuck onItem', async () => {
    const onItem = vi.fn().mockReturnValue(new Promise<void>(() => { /* never resolve */ }));
    const { result } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 200 }));
    await act(async () => { result.current.start(); });
    // 200ms 兜底 + 100ms gap = 300ms 后到达 index 1
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(result.current.currentIndex).toBe(1);
  });

  it('cleans up on unmount: no further onItem after unmount', async () => {
    const onItem = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useReciter(items, { onItem, gapMs: 100, perItemTimeoutMs: 50 }));
    await act(async () => { result.current.start(); });
    expect(onItem).toHaveBeenCalledTimes(1);
    unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onItem).toHaveBeenCalledTimes(1);
  });
});
