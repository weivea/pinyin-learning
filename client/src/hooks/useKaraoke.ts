import { useEffect, useState } from 'react';

/**
 * 按节拍推进口诀高亮 index。
 * @param total       token 数量
 * @param isPlaying   是否在播放
 * @param durationMs  音频总时长（毫秒）
 * @returns currentIndex —— 当前应高亮的 token 下标；未播放或 total<=0 时为 -1
 */
export function useKaraoke(
  total: number,
  isPlaying: boolean,
  durationMs: number,
): { currentIndex: number } {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (!isPlaying || total <= 0 || durationMs <= 0) {
      setCurrentIndex(-1);
      return;
    }
    const start = performance.now();
    const perToken = durationMs / total;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const idx = Math.min(total - 1, Math.floor(elapsed / perToken));
      setCurrentIndex(idx);
      if (elapsed < durationMs) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setCurrentIndex(-1);
    };
  }, [total, isPlaying, durationMs]);

  return { currentIndex };
}
