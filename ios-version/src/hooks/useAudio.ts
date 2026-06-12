import { useCallback, useRef, useState } from 'react';
import { pinyinAudioUrl } from '../utils/pinyin';
import { speak, stopSpeaking } from '../audio/speak';
import type { SpellStep } from '../utils/spell';

/** 播放音频。`play(text)` 走原生 TTS（汉字例字）；
 *  `playPinyin(base, tone?)` 走静态拼音音节 mp3；
 *  `playSequence(steps)` 串行播放一组拼读段。 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);
  const seqIdRef = useRef(0);
  const [spellIndex, setSpellIndex] = useState(-1);

  const stopCurrent = async () => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
    await stopSpeaking();
  };

  const cancelSequence = () => {
    seqIdRef.current += 1;
    setSpellIndex(-1);
  };

  /** 播一段静态音频，等待 ended/error。返回是否成功。 */
  const playOnce = async (url: string): Promise<boolean> => {
    await stopCurrent();
    return new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      currentRef.current = audio;
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
      };
      audio.onended = () => { cleanup(); resolve(true); };
      audio.onerror = () => { cleanup(); resolve(false); };
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => { cleanup(); resolve(false); });
      }
    });
  };

  const play = useCallback(async (text: string) => {
    cancelSequence();
    await stopCurrent();
    await speak(text);
  }, []);

  /**
   * 播放拼音音节静态音频。
   * @param base  去掉声调的拼音（如 "a"、"üe"、"zhi"、"b"）
   * @param tone  1-4 带调；省略或 0 = 无调（声母 / 单读音节）
   * @param fallbackText  可选：当静态 mp3 失败时回退用的汉字（走原生 TTS）
   */
  const playPinyin = useCallback(async (
    base: string,
    tone?: 0 | 1 | 2 | 3 | 4,
    fallbackText?: string,
  ) => {
    cancelSequence();
    const url = pinyinAudioUrl(base, tone);
    const ok = await playOnce(url);
    if (!ok && fallbackText) {
      await speak(fallbackText);
    }
  }, []);

  /**
   * 串行播放一组拼读段。每段播完等 gapMs 再播下一段。
   * 期间通过 `spellIndex` 暴露当前段索引（-1 = 未播放）。
   * 调用时会取消上一次序列；调用 `play`/`playPinyin` 也会取消当前序列。
   */
  const playSequence = useCallback(async (
    steps: SpellStep[],
    opts?: { gapMs?: number },
  ): Promise<void> => {
    cancelSequence();
    await stopCurrent();
    const myId = ++seqIdRef.current;
    const gap = opts?.gapMs ?? 220;

    for (let i = 0; i < steps.length; i++) {
      if (seqIdRef.current !== myId) return;
      const step = steps[i];
      setSpellIndex(i);

      const url = pinyinAudioUrl(step.base, step.tone);
      const ok = await playOnce(url);
      if (!ok && step.hanzi) {
        if (seqIdRef.current !== myId) return;
        await speak(step.hanzi, { rate: 0.8 });
      }

      if (seqIdRef.current !== myId) return;
      if (i < steps.length - 1 && gap > 0) {
        await new Promise<void>((r) => setTimeout(r, gap));
      }
    }
    if (seqIdRef.current === myId) setSpellIndex(-1);
  }, []);

  return { play, playPinyin, playSequence, spellIndex };
}
