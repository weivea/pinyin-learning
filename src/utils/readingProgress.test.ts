import { beforeEach, describe, expect, it } from 'vitest';
import { markReadingVisited, readVisitedReadings } from './readingProgress';

describe('readingProgress', () => {
  beforeEach(() => localStorage.clear());

  it('stores unique visited passage ids per user', () => {
    markReadingVisited(1, '01-first');
    markReadingVisited(1, '01-first');
    markReadingVisited(1, '02-second');
    markReadingVisited(2, '03-third');

    expect([...readVisitedReadings(1)]).toEqual(['01-first', '02-second']);
    expect([...readVisitedReadings(2)]).toEqual(['03-third']);
  });

  it('returns an empty set for malformed storage data', () => {
    localStorage.setItem('pinyin-learning:visited-readings:1', '{bad json');
    expect(readVisitedReadings(1)).toEqual(new Set());
  });
});
