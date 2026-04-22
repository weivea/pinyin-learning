import { useCallback, useRef, useState } from 'react';
import { ttsUrl } from '../api/tts';
import { pinyinAudioUrl } from '../utils/pinyin';
import type { SpellStep } from '../utils/spell';

/** 播放音频。`play(text)` 走 Edge TTS（用于汉字例字）；
 *  `playPinyin(base, tone?)` 走静态拼音音节 mp3；
 *  `playSequence(steps)` 串行播放一组拼读段。 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);
  const seqIdRef = useRef(0);
  const [spellIndex, setSpellIndex] = useState(-1);

  const stopCurrent = () => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
  };

  const cancelSequence = () => {
    seqIdRef.current += 1;
    setSpellIndex(-1);
  };

  const speechFallback = (text: string) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e2) {
      console.error('[useAudio] speech fallback failed', e2);
    }
  };

  /** 播一段，等待 ended/error。失败不抛，仅记录。 */
  const playOnce = async (url: string): Promise<void> => {
    stopCurrent();
    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      currentRef.current = audio;
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
      };
      audio.onended = () => { cleanup(); resolve(); };
      audio.onerror = () => { cleanup(); resolve(); };
      audio.play().catch(() => { cleanup(); resolve(); });
    });
  };

  const play = useCallback(async (text: string) => {
    cancelSequence();
    stopCurrent();
    try {
      const audio = new Audio(ttsUrl(text));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio.play] tts failed, fallback to speechSynthesis', err);
      speechFallback(text);
    }
  }, []);

  /**
   * 播放拼音音节静态音频。
   * @param base  去掉声调的拼音（如 "a"、"üe"、"zhi"、"b"）
   * @param tone  1-4 带调；省略或 0 = 无调（声母 / 单读音节）
   * @param fallbackText  可选：当静态 mp3 缺失时回退用的汉字（走 Edge TTS phoneme 模式）
   */
  const playPinyin = useCallback(async (
    base: string,
    tone?: 0 | 1 | 2 | 3 | 4,
    fallbackText?: string,
  ) => {
    cancelSequence();
    stopCurrent();
    const url = pinyinAudioUrl(base, tone);
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) throw new Error(`static audio ${head.status}`);
      const audio = new Audio(url);
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn(`[useAudio.playPinyin] static failed for ${base}${tone ?? ''}`, err);
      if (!fallbackText) return;
      try {
        const phonemeTone = tone && tone >= 1 && tone <= 4 ? (tone as 1 | 2 | 3 | 4) : undefined;
        const audio = new Audio(
          ttsUrl(fallbackText, phonemeTone ? { pinyin: base, tone: phonemeTone } : undefined),
        );
        currentRef.current = audio;
        await audio.play();
      } catch (err2) {
        console.warn('[useAudio.playPinyin] tts fallback failed, using speechSynthesis', err2);
        speechFallback(fallbackText);
      }
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
    stopCurrent();
    const myId = ++seqIdRef.current;
    const gap = opts?.gapMs ?? 400;

    for (let i = 0; i < steps.length; i++) {
      if (seqIdRef.current !== myId) return;
      const step = steps[i];
      setSpellIndex(i);

      // 决定 URL：先 HEAD 静态资源，未命中且 step.hanzi 存在则走 TTS phoneme。
      let url = pinyinAudioUrl(step.base, step.tone);
      try {
        const head = await fetch(url, { method: 'HEAD' });
        // 0 字节的响应也按失败处理（兼容某些代理把 404 转成空 200）。
        const len = Number(head.headers.get('content-length') ?? '');
        if (!head.ok || len === 0) throw new Error(`static ${head.status}/${len}`);
      } catch {
        if (step.hanzi) {
          url = ttsUrl(step.hanzi, step.tone ? { pinyin: step.base, tone: step.tone } : undefined);
        } else {
          // 既无静态资源也没汉字回退：跳过这一段
          continue;
        }
      }
      if (seqIdRef.current !== myId) return;
      await playOnce(url);

      if (seqIdRef.current !== myId) return;
      if (i < steps.length - 1 && gap > 0) {
        await new Promise<void>((r) => setTimeout(r, gap));
      }
    }
    if (seqIdRef.current === myId) setSpellIndex(-1);
  }, []);

  return { play, playPinyin, playSequence, spellIndex };
}
