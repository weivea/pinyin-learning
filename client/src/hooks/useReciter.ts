import { useCallback, useEffect, useRef, useState } from 'react';

export type ReciterStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface ReciterOptions<T> {
  gapMs?: number;
  perItemTimeoutMs?: number;
  onItem?: (item: T, index: number) => Promise<void>;
}

export interface UseReciterResult {
  status: ReciterStatus;
  currentIndex: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  playOne: (index: number) => void;
}

export function useReciter<T>(items: T[], options: ReciterOptions<T> = {}): UseReciterResult {
  const { gapMs = 1500, perItemTimeoutMs = 3000, onItem } = options;
  const [status, setStatus] = useState<ReciterStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(-1);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onItemRef = useRef(onItem);
  onItemRef.current = onItem;
  const gapMsRef = useRef(gapMs);
  gapMsRef.current = gapMs;
  const perItemTimeoutRef = useRef(perItemTimeoutMs);
  perItemTimeoutRef.current = perItemTimeoutMs;

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playFrom = useCallback(async (startIdx: number, runId: number) => {
    for (let i = startIdx; i < itemsRef.current.length; i++) {
      if (cancelledRef.current || runIdRef.current !== runId) return;
      setCurrentIndex(i);
      const item = itemsRef.current[i];
      const playPromise = onItemRef.current
        ? onItemRef.current(item, i).catch(() => undefined)
        : Promise.resolve();
      const timeoutPromise = new Promise<void>((resolve) => {
        timerRef.current = setTimeout(resolve, perItemTimeoutRef.current);
      });
      await Promise.race([playPromise, timeoutPromise]);
      clearTimer();
      if (cancelledRef.current || runIdRef.current !== runId) return;
      await new Promise<void>((resolve) => {
        timerRef.current = setTimeout(resolve, gapMsRef.current);
      });
      clearTimer();
      if (cancelledRef.current || runIdRef.current !== runId) return;
    }
    if (runIdRef.current === runId) setStatus('finished');
  }, []);

  const start = useCallback(() => {
    if (status === 'playing') return;
    cancelledRef.current = false;
    runIdRef.current++;
    setStatus('playing');
    setCurrentIndex(-1);
    void playFrom(0, runIdRef.current);
  }, [status, playFrom]);

  const reset = useCallback(() => {
    runIdRef.current++;
    cancelledRef.current = true;
    clearTimer();
    setStatus('idle');
    setCurrentIndex(-1);
  }, []);

  const pause = useCallback(() => { /* stub for next task */ }, []);
  const resume = useCallback(() => { /* stub for next task */ }, []);
  const playOne = useCallback((_idx: number) => { /* stub */ }, []);

  useEffect(() => () => {
    cancelledRef.current = true;
    clearTimer();
  }, []);

  return { status, currentIndex, start, pause, resume, reset, playOne };
}
