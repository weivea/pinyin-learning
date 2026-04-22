import { describe, it, expect } from 'vitest';
import { ttsUrl } from './tts';

describe('ttsUrl', () => {
  it('builds text-only URL', () => {
    const u = ttsUrl('妈');
    expect(u).toMatch(/^\/api\/tts\?/);
    expect(u).toContain('text=%E5%A6%88');
  });

  it('accepts custom voice', () => {
    const u = ttsUrl('你', { voice: 'zh-CN-YunyangNeural' });
    expect(u).toContain('voice=zh-CN-YunyangNeural');
  });
});
