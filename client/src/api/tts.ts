/** Edge TTS URL（用于汉字例字朗读，不再用于拼音音节）。
 *  当同时提供 `pinyin` 和 `tone` 时，URL 带上 phoneme 提示，
 *  让后端走 SSML phoneme 模式以正确处理多音字。
 *  `rate` 形如 "-20%"，传给 SSML <prosody> 调速。 */
export function ttsUrl(
  text: string,
  opts?: { voice?: string; pinyin?: string; tone?: 1 | 2 | 3 | 4; rate?: string },
): string {
  const params = new URLSearchParams({ text });
  if (opts?.voice) params.set('voice', opts.voice);
  if (opts?.pinyin && opts?.tone) {
    params.set('pinyin', opts.pinyin);
    params.set('tone', String(opts.tone));
  }
  if (opts?.rate) params.set('rate', opts.rate);
  return `/api/tts?${params.toString()}`;
}
