import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReciter } from './useReciter';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as any;

describe('useReciter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

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
});
