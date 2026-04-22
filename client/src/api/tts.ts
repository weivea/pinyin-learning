/** Edge TTS URL（用于汉字例字朗读，不再用于拼音音节）。 */
export function ttsUrl(text: string, opts?: { voice?: string }): string {
  const params = new URLSearchParams({ text });
  if (opts?.voice) params.set('voice', opts.voice);
  return `/api/tts?${params.toString()}`;
}
