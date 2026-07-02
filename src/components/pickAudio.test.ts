import { describe, it, expect } from 'vitest';
import { pickAudioForItem } from './pickAudio';
import type { PinyinItem } from '../types';

const noTone: PinyinItem = {
  id: 'b',
  display: 'b',
  category: 'initial',
  hasTones: false,
  audioText: '波',
  examples: [],
};

const fourTones: PinyinItem = {
  id: 'a',
  display: 'a',
  category: 'simple-final',
  hasTones: true,
  audioText: '阿',
  tones: [
    { tone: 1, text: 'ā', audioText: '啊' },
    { tone: 2, text: 'á', audioText: '啊' },
    { tone: 3, text: 'ǎ', audioText: '矮' },
    { tone: 4, text: 'à', audioText: '爱' },
  ],
  examples: [],
};

describe('pickAudioForItem', () => {
  it('uses item id as base and no tone for hasTones=false', () => {
    expect(pickAudioForItem(noTone, () => 0.5)).toEqual({ base: 'b', text: '波' });
  });

  it('returns one of the four tones for hasTones=true', () => {
    const r = pickAudioForItem(fourTones, () => 0);
    expect(r.base).toBe('a');
    expect(r.tone).toBe(1);
    expect(r.text).toBe('啊');
  });

  it('rng=0.99 picks the last tone', () => {
    const r = pickAudioForItem(fourTones, () => 0.99);
    expect(r.tone).toBe(4);
    expect(r.text).toBe('爱');
  });

  it('default rng selects a valid tone', () => {
    const r = pickAudioForItem(fourTones);
    expect([1, 2, 3, 4]).toContain(r.tone);
  });
});
