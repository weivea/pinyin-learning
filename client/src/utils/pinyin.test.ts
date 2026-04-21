import { describe, it, expect } from 'vitest';
import { stripTone } from './pinyin';

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
