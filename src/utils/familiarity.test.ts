import { describe, it, expect, beforeEach } from 'vitest';
import {
  readFamiliarityMap,
  getFamiliarity,
  setFamiliarity,
  clampFamiliarity,
  MAX_FAMILIARITY,
} from './familiarity';

describe('familiarity', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to 0 when nothing stored', () => {
    expect(getFamiliarity('letters', 1, 'a')).toBe(0);
    expect(readFamiliarityMap('pinyin', 1)).toEqual({});
  });

  it('stores and reads a level per (kind,user,id)', () => {
    setFamiliarity('letters', 1, 'a', 3);
    expect(getFamiliarity('letters', 1, 'a')).toBe(3);
    expect(readFamiliarityMap('letters', 1)).toEqual({ a: 3 });
  });

  it('clamps levels into 0..5 and rounds', () => {
    expect(clampFamiliarity(-2)).toBe(0);
    expect(clampFamiliarity(99)).toBe(MAX_FAMILIARITY);
    expect(clampFamiliarity(2.6)).toBe(3);
    expect(setFamiliarity('hanzi', 1, '花', 9)).toBe(MAX_FAMILIARITY);
    expect(getFamiliarity('hanzi', 1, '花')).toBe(MAX_FAMILIARITY);
  });

  it('setting level 0 removes the entry', () => {
    setFamiliarity('hanzi', 1, '花', 4);
    setFamiliarity('hanzi', 1, '花', 0);
    expect(getFamiliarity('hanzi', 1, '花')).toBe(0);
    expect(readFamiliarityMap('hanzi', 1)).toEqual({});
  });

  it('isolates by kind and by user', () => {
    setFamiliarity('letters', 1, 'a', 2);
    setFamiliarity('pinyin', 1, 'a', 4);
    setFamiliarity('letters', 2, 'a', 5);
    expect(getFamiliarity('letters', 1, 'a')).toBe(2);
    expect(getFamiliarity('pinyin', 1, 'a')).toBe(4);
    expect(getFamiliarity('letters', 2, 'a')).toBe(5);
  });

  it('treats missing user as guest bucket', () => {
    setFamiliarity('letters', undefined, 'a', 3);
    expect(getFamiliarity('letters', undefined, 'a')).toBe(3);
    expect(getFamiliarity('letters', 1, 'a')).toBe(0);
  });
});
