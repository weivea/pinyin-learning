import { useCallback, useRef } from 'react';
import { ttsUrl } from '../api/tts';
import { pinyinAudioUrl } from '../utils/pinyin';

/** 播放音频。`play(text)` 走 Edge TTS（用于汉字例字）；
 *  `playPinyin(base, tone?)` 走静态拼音音节 mp3。 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = () => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
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

  const play = useCallback(async (text: string) => {
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
    stopCurrent();
    const url = pinyinAudioUrl(base, tone);
    try {
      // 先 HEAD 一下避免 <audio> 静默吞掉 404。
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) throw new Error(`static audio ${head.status}`);
      const audio = new Audio(url);
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn(`[useAudio.playPinyin] static failed for ${base}${tone ?? ''}`, err);
      if (!fallbackText) return;
      // 回退：Edge TTS phoneme 模式（带 pinyin+tone 提示，多音字也能读对）。
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

  return { play, playPinyin };
}
