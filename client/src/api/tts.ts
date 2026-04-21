export function ttsUrl(text: string, voice = 'zh-CN-XiaoxiaoNeural'): string {
  const params = new URLSearchParams({ text, voice });
  return `/api/tts?${params.toString()}`;
}
