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

  it('appends pinyin+tone for phoneme mode', () => {
    const u = ttsUrl('乐', { pinyin: 'yue', tone: 4 });
    expect(u).toContain('pinyin=yue');
    expect(u).toContain('tone=4');
  });

  it('omits phoneme params if either pinyin or tone missing', () => {
    const u1 = ttsUrl('乐', { pinyin: 'yue' });
    expect(u1).not.toContain('pinyin=');
    expect(u1).not.toContain('tone=');
    const u2 = ttsUrl('乐', { tone: 4 });
    expect(u2).not.toContain('pinyin=');
    expect(u2).not.toContain('tone=');
  });
});
