import { describe, it, expect } from 'vitest';
import { HANZI, HANZI_GROUPS, getHanzi, getAdjacentHanzi } from './hanzi';

describe('hanzi data', () => {
  it('约 1000 个不重复汉字', () => {
    expect(HANZI.length).toBeGreaterThanOrEqual(990);
    const chars = HANZI.map((h) => h.char);
    expect(new Set(chars).size).toBe(HANZI.length);
  });

  it('每个字都有拼音、至少一个组词、至少一句造句', () => {
    for (const h of HANZI) {
      expect(h.char).toMatch(/^[\u4e00-\u9fa5]$/);
      expect(h.pinyin.length).toBeGreaterThan(0);
      expect(h.words.length).toBeGreaterThanOrEqual(1);
      expect(h.sentences.length).toBeGreaterThanOrEqual(1);
      for (const w of h.words) {
        expect(w.word).toContain(h.char);
        expect(w.pinyin.length).toBeGreaterThan(0);
      }
      for (const s of h.sentences) expect(s.length).toBeGreaterThan(0);
    }
  });

  it('分组覆盖全部字，且顺序正确', () => {
    const ids = HANZI_GROUPS.map((g) => g.id);
    expect(ids).toEqual(['g1a', 'g1b', 'g2a', 'g2b', 'extra']);
    const sum = HANZI_GROUPS.reduce((n, g) => n + g.items.length, 0);
    expect(sum).toBe(HANZI.length);
  });

  it('getHanzi 能按字查找', () => {
    const flower = getHanzi('花');
    expect(flower?.char).toBe('花');
    expect(flower?.pinyin).toBe('huā');
    expect(getHanzi('英')).toBeUndefined();
    expect(getHanzi(undefined)).toBeUndefined();
  });

  it('getAdjacentHanzi 首字无 prev、末字无 next', () => {
    const first = HANZI[0].char;
    const last = HANZI[HANZI.length - 1].char;
    expect(getAdjacentHanzi(first).prev).toBeUndefined();
    expect(getAdjacentHanzi(first).next).toBe(HANZI[1].char);
    expect(getAdjacentHanzi(last).next).toBeUndefined();
  });
});
