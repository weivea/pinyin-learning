import { describe, it, expect } from 'vitest';
import { LETTERS, getLetter, getAdjacent } from './letters';

describe('letters data', () => {
  it('has 26 letters A-Z in order', () => {
    expect(LETTERS).toHaveLength(26);
    expect(LETTERS.map(l => l.letter).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('每个字母 lower 是 letter 的小写', () => {
    for (const l of LETTERS) {
      expect(l.lower).toBe(l.letter.toLowerCase());
    }
  });

  it('每个字母有完整的介绍 / 例词 / 拼音读音字段', () => {
    for (const l of LETTERS) {
      expect(l.intro.length).toBeGreaterThan(0);
      expect(l.spokenName).toBeTruthy();
      expect(l.examples.length).toBeGreaterThan(0);
      for (const ex of l.examples) {
        expect(ex.word).toBeTruthy();
        expect(ex.emoji).toBeTruthy();
        expect(ex.zh).toBeTruthy();
      }
      expect(l.pinyinReading).toBeTruthy();
      expect(l.pinyinHanzi).toBeTruthy();
      expect(l.pinyinDesc).toBeTruthy();
    }
  });

  it('getLetter 大小写不敏感，非法输入返回 undefined', () => {
    expect(getLetter('a')?.letter).toBe('A');
    expect(getLetter('A')?.letter).toBe('A');
    expect(getLetter('z')?.letter).toBe('Z');
    expect(getLetter('1')).toBeUndefined();
    expect(getLetter('')).toBeUndefined();
    expect(getLetter(undefined)).toBeUndefined();
  });

  it('getAdjacent 正确返回上一个 / 下一个', () => {
    expect(getAdjacent('a')).toEqual({ prev: undefined, next: 'b' });
    expect(getAdjacent('z')).toEqual({ prev: 'y', next: undefined });
    expect(getAdjacent('m')).toEqual({ prev: 'l', next: 'n' });
  });
});
