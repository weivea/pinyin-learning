import { useCallback, useRef } from 'react';
import { ttsUrl } from '../api/tts';

/**
 * 播放给定文本的 TTS 音频。失败时 fallback 到 Web Speech API。
 */
export function useAudio() {
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string) => {
    if (currentRef.current) {
      currentRef.current.pause();
      currentRef.current = null;
    }
    try {
      const audio = new Audio(ttsUrl(text));
      currentRef.current = audio;
      await audio.play();
    } catch (err) {
      console.warn('[useAudio] tts failed, fallback to speechSynthesis', err);
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (e2) {
        console.error('[useAudio] fallback also failed', e2);
      }
    }
  }, []);

  return { play };
}
