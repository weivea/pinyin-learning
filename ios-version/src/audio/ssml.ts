// 与 web 版 server/src/services/ssml.ts 保持一致的 SSML 构造逻辑。
// iOS 版直接在客户端构造同样的 SSML，发给 Azure Speech，保证发音/声调与 web 版一致。

export interface SsmlRequest {
  text: string;
  pinyin?: string;
  tone?: 1 | 2 | 3 | 4;
  voice?: string;
  /** 朗读速度，如 "-20%"。默认不调速。 */
  rate?: string;
}

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSsml(req: SsmlRequest): string {
  const voice = req.voice ?? DEFAULT_VOICE;
  const text = escapeXml(req.text);
  const core = (req.pinyin && req.tone)
    ? `<phoneme alphabet="sapi" ph="${escapeXml(req.pinyin)} ${req.tone}">${text}</phoneme>`
    : text;
  const inner = req.rate
    ? `<prosody rate="${escapeXml(req.rate)}">${core}</prosody>`
    : core;
  return `<speak version="1.0" xml:lang="zh-CN"><voice name="${voice}">${inner}</voice></speak>`;
}
