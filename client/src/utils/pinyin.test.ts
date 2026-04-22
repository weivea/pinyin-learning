import { describe, it, expect } from 'vitest';
import { stripTone, pinyinAudioFile, pinyinAudioUrl } from './pinyin';

describe('stripTone', () => {
  it('removes tone marks from a/o/e/i/u', () => {
    expect(stripTone('mā')).toBe('ma');
    expect(stripTone('má')).toBe('ma');
    expect(stripTone('mǎ')).toBe('ma');
    expect(stripTone('mà')).toBe('ma');
    expect(stripTone('ò')).toBe('o');
    expect(stripTone('ē')).toBe('e');
    expect(stripTone('ī')).toBe('i');
    expect(stripTone('ū')).toBe('u');
  });

  it('preserves ü (does not convert to v)', () => {
    expect(stripTone('lǜ')).toBe('lü');
    expect(stripTone('üē')).toBe('üe');
  });

  it('passes through non-toned characters', () => {
    expect(stripTone('zi')).toBe('zi');
    expect(stripTone('')).toBe('');
  });
});

describe('pinyinAudioFile', () => {
  it('returns <base>.mp3 for initials / no tone', () => {
    expect(pinyinAudioFile('b')).toBe('b.mp3');
    expect(pinyinAudioFile('zh')).toBe('zh.mp3');
  });

  it('returns <base><tone>.mp3 for toned syllables', () => {
    expect(pinyinAudioFile('a', 1)).toBe('a1.mp3');
    expect(pinyinAudioFile('ma', 3)).toBe('ma3.mp3');
    expect(pinyinAudioFile('zhi', 4)).toBe('zhi4.mp3');
  });

  it('converts ü to v', () => {
    expect(pinyinAudioFile('ü', 2)).toBe('v2.mp3');
    expect(pinyinAudioFile('üe', 3)).toBe('ve3.mp3');
    expect(pinyinAudioFile('ün', 4)).toBe('vn4.mp3');
  });

  it('treats tone 0 (neutral) as no-tone', () => {
    expect(pinyinAudioFile('a', 0)).toBe('a.mp3');
  });
});

describe('pinyinAudioUrl', () => {
  it('returns full /api path', () => {
    expect(pinyinAudioUrl('a', 1)).toBe('/api/audio/pinyin/a1.mp3');
    expect(pinyinAudioUrl('üe', 3)).toBe('/api/audio/pinyin/ve3.mp3');
    expect(pinyinAudioUrl('b')).toBe('/api/audio/pinyin/b.mp3');
  });
});
