import { describe, it, expect } from 'vitest';
import { buildSsml, escapeXml } from './ssml';

describe('buildSsml', () => {
  it('wraps plain text in speak+voice when no pinyin', () => {
    const ssml = buildSsml({ text: '妈' });
    expect(ssml).toBe(
      '<speak version="1.0" xml:lang="zh-CN">' +
        '<voice name="zh-CN-XiaoxiaoNeural">妈</voice>' +
      '</speak>',
    );
  });

  it('inserts SAPI phoneme tag when pinyin+tone provided', () => {
    const ssml = buildSsml({ text: '妈', pinyin: 'ma', tone: 1 });
    expect(ssml).toContain('<phoneme alphabet="sapi" ph="ma 1">妈</phoneme>');
    expect(ssml).toContain('<voice name="zh-CN-XiaoxiaoNeural">');
  });

  it('wraps in prosody when rate provided', () => {
    const ssml = buildSsml({ text: '妈', rate: '-20%' });
    expect(ssml).toContain('<prosody rate="-20%">妈</prosody>');
  });

  it('combines prosody and phoneme', () => {
    const ssml = buildSsml({ text: '乐', pinyin: 'yue', tone: 4, rate: '-35%' });
    expect(ssml).toContain('<prosody rate="-35%"><phoneme alphabet="sapi" ph="yue 4">乐</phoneme></prosody>');
  });

  it('escapes XML-special characters in text', () => {
    const ssml = buildSsml({ text: 'A & <B>', pinyin: 'a', tone: 1 });
    expect(ssml).toContain('A &amp; &lt;B&gt;');
    expect(ssml).not.toContain('A & <B>');
  });

  it('uses custom voice when provided', () => {
    const ssml = buildSsml({ text: '你', voice: 'zh-CN-YunyangNeural' });
    expect(ssml).toContain('<voice name="zh-CN-YunyangNeural">');
  });
});

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &apos;');
  });
});
