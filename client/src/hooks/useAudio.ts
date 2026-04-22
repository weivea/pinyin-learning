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
   */
  const playPinyin = useCallback(async (
    base: string,
    tone?: 0 | 1 | 2 | 3 | 4,
  ) => {
    stopCurrent();
    try {
      const audio = new Audio(pinyinAudioUrl(base, tone));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn(`[useAudio.playPinyin] failed for ${base}${tone ?? ''}`, err);
    }
  }, []);

  return { play, playPinyin };
}
