import { describe, it, expect } from 'vitest';
import { PINYIN_DATA } from './pinyin';

describe('pinyin data integrity', () => {
  it('has unique ids', () => {
    const ids = PINYIN_DATA.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has at least one example', () => {
    for (const item of PINYIN_DATA) {
      expect(item.examples.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('items with hasTones=true must include tones array of 4', () => {
    for (const item of PINYIN_DATA) {
      if (item.hasTones) {
        expect(item.tones).toBeDefined();
        expect(item.tones!.length).toBe(4);
      }
    }
  });

  it('every item has non-empty audioText', () => {
    for (const item of PINYIN_DATA) {
      expect(item.audioText.length).toBeGreaterThan(0);
    }
  });

  it('contains 63 pinyin items total', () => {
    expect(PINYIN_DATA.length).toBe(63);
  });
});
