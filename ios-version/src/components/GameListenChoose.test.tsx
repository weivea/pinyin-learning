import { describe, it, expect } from 'vitest';
import { starsForScore } from './gameUtils';

describe('starsForScore', () => {
  it('returns 3 stars for >= 90%', () => {
    expect(starsForScore(9, 10)).toBe(3);
    expect(starsForScore(10, 10)).toBe(3);
  });
  it('returns 2 stars for 70-89%', () => {
    expect(starsForScore(7, 10)).toBe(2);
    expect(starsForScore(8, 10)).toBe(2);
  });
  it('returns 1 star for 50-69%', () => {
    expect(starsForScore(5, 10)).toBe(1);
    expect(starsForScore(6, 10)).toBe(1);
  });
  it('returns 0 stars for < 50%', () => {
    expect(starsForScore(4, 10)).toBe(0);
    expect(starsForScore(0, 10)).toBe(0);
  });
});
