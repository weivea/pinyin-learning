/** 英文语音朗读工具。
 *  用于朗读英文字母名（'A' → "ay"）与英文单词（'Apple'）。
 *  走浏览器内置 SpeechSynthesis（en-US），离线可用、无需服务端 TTS。
 *  在不支持的环境（如测试用的 jsdom）里安全地静默返回。 */

function pickEnglishVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices?.() ?? [];
  // 优先挑一个明显的英语（美式）声音，退而求其次挑任意英语声音。
  return (
    voices.find(v => /^en[-_]US/i.test(v.lang)) ??
    voices.find(v => /^en/i.test(v.lang))
  );
}

/** 朗读一段英文文本。text 为空或环境不支持时静默返回。 */
export function speakEnglish(text: string, opts?: { rate?: number }): void {
  const trimmed = text?.trim();
  if (!trimmed) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.lang = 'en-US';
    // 稍微放慢，方便小朋友听清。
    utter.rate = opts?.rate ?? 0.85;
    utter.pitch = 1.1;
    const voice = pickEnglishVoice(synth);
    if (voice) utter.voice = voice;
    synth.cancel();
    synth.speak(utter);
  } catch (err) {
    console.warn('[speakEnglish] failed', err);
  }
}

/** 环境是否支持英文语音朗读。 */
export function canSpeakEnglish(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
