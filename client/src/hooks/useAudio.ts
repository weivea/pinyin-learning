import { useCallback, useRef } from 'react';
import { ttsUrl } from '../api/tts';

/** 播放给定文本的 TTS 音频。失败时 fallback 到 Web Speech API。 */
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
      console.warn('[useAudio] tts failed, fallback to speechSynthesis', err);
      speechFallback(text);
    }
  }, []);

  const playPinyin = useCallback(async (
    pinyin: string,
    tone: 1 | 2 | 3 | 4,
    fallback: string,
  ) => {
    stopCurrent();
    try {
      const url = ttsUrl(fallback, { pinyin, tone });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const mode = res.headers.get('X-TTS-Mode');
      if (import.meta.env.DEV && mode === 'fallback-text') {
        console.warn(`[useAudio] phoneme fallback for ${pinyin}${tone}`);
      }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio.playPinyin] failed, fallback to speechSynthesis', err);
      speechFallback(fallback);
    }
  }, []);

  return { play, playPinyin };
}
