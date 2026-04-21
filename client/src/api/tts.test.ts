import { describe, it, expect } from 'vitest';
import { ttsUrl } from './tts';

describe('ttsUrl', () => {
  it('text-only URL stays backward compatible', () => {
    const u = ttsUrl('妈');
    expect(u).toMatch(/^\/api\/tts\?/);
    expect(u).toContain('text=%E5%A6%88');
    expect(u).not.toContain('pinyin=');
    expect(u).not.toContain('tone=');
  });

  it('appends pinyin+tone when provided', () => {
    const u = ttsUrl('妈', { pinyin: 'ma', tone: 1 });
    expect(u).toContain('pinyin=ma');
    expect(u).toContain('tone=1');
  });

  it('converts ü to v in pinyin param', () => {
    const u = ttsUrl('绿', { pinyin: 'lü', tone: 4 });
    expect(u).toContain('pinyin=lv');
    expect(u).not.toContain('%C3%BC');
  });

  it('accepts custom voice', () => {
    const u = ttsUrl('你', { voice: 'zh-CN-YunyangNeural' });
    expect(u).toContain('voice=zh-CN-YunyangNeural');
  });
});
