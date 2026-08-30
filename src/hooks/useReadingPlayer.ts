import { useCallback, useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../audio/speak';
import type { ReadingSentence } from '../types';

export type ReadingPlayerStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface ReadingPlayer {
  status: ReadingPlayerStatus;
  currentIndex: number;
  play: () => void;
  pause: () => void;
}

export function useReadingPlayer(
  sentences: readonly Pick<ReadingSentence, 'text'>[],
): ReadingPlayer {
  const [status, setStatus] = useState<ReadingPlayerStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const statusRef = useRef<ReadingPlayerStatus>('idle');
  const currentIndexRef = useRef(-1);
  const sentencesRef = useRef(sentences);
  const runIdRef = useRef(0);

  sentencesRef.current = sentences;

  const updateStatus = useCallback((next: ReadingPlayerStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const updateIndex = useCallback((next: number) => {
    currentIndexRef.current = next;
    setCurrentIndex(next);
  }, []);

  const playFrom = useCallback(async (startIndex: number, runId: number) => {
    for (let index = startIndex; index < sentencesRef.current.length; index++) {
      if (runIdRef.current !== runId || statusRef.current !== 'playing') return;
      updateIndex(index);
      await speak(sentencesRef.current[index].text, { rate: 0.88 });
      if (runIdRef.current !== runId || statusRef.current !== 'playing') return;
    }

    if (runIdRef.current === runId) {
      updateIndex(-1);
      updateStatus('finished');
    }
  }, [updateIndex, updateStatus]);

  const play = useCallback(() => {
    if (statusRef.current === 'playing' || sentencesRef.current.length === 0) return;

    const startIndex = statusRef.current === 'paused'
      ? Math.max(currentIndexRef.current, 0)
      : 0;
    const runId = ++runIdRef.current;
    updateStatus('playing');

    void (async () => {
      await stopSpeaking();
      if (runIdRef.current !== runId || statusRef.current !== 'playing') return;
      await playFrom(startIndex, runId);
    })();
  }, [playFrom, updateStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    runIdRef.current++;
    updateStatus('paused');
    void stopSpeaking();
  }, [updateStatus]);

  useEffect(() => {
    runIdRef.current++;
    updateIndex(-1);
    updateStatus('idle');
    void stopSpeaking();

    return () => {
      runIdRef.current++;
      void stopSpeaking();
    };
  }, [sentences, updateIndex, updateStatus]);

  return { status, currentIndex, play, pause };
}
