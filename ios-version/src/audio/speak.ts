import { TextToSpeech } from '@capacitor-community/text-to-speech';

export interface SpeakOptions {
  /** 1 = normal speed; <1 is slower. */
  rate?: number;
}

export async function speak(text: string, opts?: SpeakOptions): Promise<void> {
  try {
    await TextToSpeech.stop();
    await TextToSpeech.speak({
      text,
      lang: 'zh-CN',
      rate: opts?.rate ?? 1,
    });
  } catch (error) {
    console.warn('[speak] native tts failed', error);
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await TextToSpeech.stop();
  } catch {
    // ignore
  }
}
