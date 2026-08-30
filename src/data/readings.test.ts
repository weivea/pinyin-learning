import { describe, expect, it } from 'vitest';
import { HANZI } from './hanzi';
import { READINGS } from './readings';

const HANZI_RE = /[\u3400-\u9fff]/u;

describe('reading data', () => {
  it('contains 20 balanced passages in nondecreasing difficulty order', () => {
    expect(READINGS).toHaveLength(20);
    expect(new Set(READINGS.map((reading) => reading.id)).size).toBe(20);

    const themeCounts = READINGS.reduce<Record<string, number>>((counts, reading) => {
      counts[reading.theme] = (counts[reading.theme] ?? 0) + 1;
      return counts;
    }, {});
    expect(themeCounts).toEqual({ 童话: 5, 生活: 5, 自然: 5, 校园: 5 });

    for (let index = 1; index < READINGS.length; index++) {
      expect(READINGS[index].difficulty).toBeGreaterThanOrEqual(READINGS[index - 1].difficulty);
    }
  });

  it('keeps every passage within the length and new-character limits', () => {
    const basicHanzi = new Set(HANZI.map((item) => item.char));

    for (const reading of READINGS) {
      expect(reading.characterCount).toBeGreaterThanOrEqual(80);
      expect(reading.characterCount).toBeLessThanOrEqual(120);
      expect(reading.newCharacters.length).toBeLessThanOrEqual(5);

      const tokens = [
        ...reading.titleTokens,
        ...reading.paragraphs.flatMap((paragraph) =>
          paragraph.sentences.flatMap((sentence) => sentence.tokens)),
      ];
      const generatedNewCharacters = new Set(
        tokens
          .filter((token) => HANZI_RE.test(token.text) && !basicHanzi.has(token.text))
          .map((token) => token.text),
      );
      expect(new Set(reading.newCharacters.map((item) => item.char))).toEqual(generatedNewCharacters);
    }
  });

  it('annotates every Chinese character and preserves the source sentence text', () => {
    for (const reading of READINGS) {
      expect(reading.titleTokens.map((token) => token.text).join('')).toBe(reading.title);

      for (const paragraph of reading.paragraphs) {
        for (const sentence of paragraph.sentences) {
          expect(sentence.tokens.map((token) => token.text).join('')).toBe(sentence.text);
          for (const token of sentence.tokens) {
            if (HANZI_RE.test(token.text)) {
              expect(token.pinyin, `${reading.id}: ${token.text} is missing pinyin`).toBeTruthy();
            }
          }
        }
      }
    }
  });

  it('uses contextual readings for known polyphonic and neutral-tone phrases', () => {
    const phrasePinyin = (readingId: string, phrase: string) => {
      const reading = READINGS.find((item) => item.id === readingId)!;
      const tokens = reading.paragraphs.flatMap((paragraph) =>
        paragraph.sentences.flatMap((sentence) => sentence.tokens));
      const text = tokens.map((token) => token.text).join('');
      const start = text.indexOf(phrase);
      expect(start, `${readingId}: missing phrase ${phrase}`).toBeGreaterThanOrEqual(0);
      return tokens.slice(start, start + [...phrase].length).map((token) => token.pinyin);
    };

    expect(phrasePinyin('06-sorting-greens', '转来转去')).toEqual(
      ['zhuǎn', 'lái', 'zhuǎn', 'qù'],
    );
    expect(phrasePinyin('16-new-tree-track', '种下')).toEqual(['zhòng', 'xià']);
    expect(phrasePinyin('16-new-tree-track', '长了')).toEqual(['zhǎng', 'le']);
    expect(phrasePinyin('18-grandpa-clock', '跑得')).toEqual(['pǎo', 'de']);
    expect(phrasePinyin('18-grandpa-clock', '倒好')).toEqual(['dào', 'hǎo']);
    expect(phrasePinyin('19-morning-mist', '露出来')).toEqual(['lòu', 'chū', 'lái']);
    expect(phrasePinyin('05-moon-guest', '月亮')).toEqual(['yuè', 'liang']);
  });
});
