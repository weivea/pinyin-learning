export interface TtsOptions {
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
}

export function ttsUrl(text: string, opts?: TtsOptions): string {
  const params = new URLSearchParams({ text });
  if (opts?.pinyin) {
    // SAPI Mandarin 约定：ü 写作 v
    params.set('pinyin', opts.pinyin.replace(/ü/g, 'v'));
  }
  if (opts?.tone) params.set('tone', String(opts.tone));
  if (opts?.voice) params.set('voice', opts.voice);
  return `/api/tts?${params.toString()}`;
}
