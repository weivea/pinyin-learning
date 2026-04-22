import { describe, it, expect } from 'vitest';
import { buildSpellSteps } from './spell';

describe('buildSpellSteps', () => {
  it('两拼: 声母+韵母 -> [声母, 韵母, 加调字]', () => {
    expect(buildSpellSteps('爸', 'bà')).toEqual([
      { base: 'b', caption: 'b' },
      { base: 'a', caption: 'a' },
      { base: 'a', tone: 4, hanzi: '爸', caption: 'bà 爸' },
    ]);
  });

  it('两拼: 后鼻韵母', () => {
    expect(buildSpellSteps('风', 'fēng')).toEqual([
      { base: 'f', caption: 'f' },
      { base: 'eng', caption: 'eng' },
      { base: 'eng', tone: 1, hanzi: '风', caption: 'fēng 风' },
    ]);
  });

  it('三拼: 声母+介母 i +韵母', () => {
    expect(buildSpellSteps('家', 'jiā')).toEqual([
      { base: 'j', caption: 'j' },
      { base: 'i', caption: 'i' },
      { base: 'a', caption: 'a' },
      { base: 'a', tone: 1, hanzi: '家', caption: 'jiā 家' },
    ]);
  });

  it('三拼: 声母+介母 u +韵母', () => {
    expect(buildSpellSteps('瓜', 'guā')).toEqual([
      { base: 'g', caption: 'g' },
      { base: 'u', caption: 'u' },
      { base: 'a', caption: 'a' },
      { base: 'a', tone: 1, hanzi: '瓜', caption: 'guā 瓜' },
    ]);
  });

  it('三拼: q + ü(写作u) + an', () => {
    expect(buildSpellSteps('裙', 'qún')).toEqual([
      { base: 'q', caption: 'q' },
      { base: 'ü', caption: 'ü' },
      { base: 'n', caption: 'n' },
      { base: 'n', tone: 2, hanzi: '裙', caption: 'qún 裙' },
    ]);
  });

  it('三拼: x + ü(写作u) + e', () => {
    expect(buildSpellSteps('学', 'xué')).toEqual([
      { base: 'x', caption: 'x' },
      { base: 'ü', caption: 'ü' },
      { base: 'e', caption: 'e' },
      { base: 'e', tone: 2, hanzi: '学', caption: 'xué 学' },
    ]);
  });

  it('两拼: l + ü', () => {
    expect(buildSpellSteps('绿', 'lǜ')).toEqual([
      { base: 'l', caption: 'l' },
      { base: 'ü', caption: 'ü' },
      { base: 'ü', tone: 4, hanzi: '绿', caption: 'lǜ 绿' },
    ]);
  });

  it('两拼: j + ü(写作u)', () => {
    expect(buildSpellSteps('橘', 'jú')).toEqual([
      { base: 'j', caption: 'j' },
      { base: 'ü', caption: 'ü' },
      { base: 'ü', tone: 2, hanzi: '橘', caption: 'jú 橘' },
    ]);
  });

  it('整体认读: yu', () => {
    expect(buildSpellSteps('鱼', 'yú')).toEqual([
      { base: 'yu', caption: 'yu' },
      { base: 'yu', tone: 2, hanzi: '鱼', caption: 'yú 鱼' },
    ]);
  });

  it('整体认读: yuan', () => {
    expect(buildSpellSteps('元', 'yuán')).toEqual([
      { base: 'yuan', caption: 'yuan' },
      { base: 'yuan', tone: 2, hanzi: '元', caption: 'yuán 元' },
    ]);
  });

  it('整体认读: zhi', () => {
    expect(buildSpellSteps('知', 'zhī')).toEqual([
      { base: 'zhi', caption: 'zhi' },
      { base: 'zhi', tone: 1, hanzi: '知', caption: 'zhī 知' },
    ]);
  });

  it('零声母: a 开头', () => {
    expect(buildSpellSteps('爱', 'ài')).toEqual([
      { base: 'ai', caption: 'ai' },
      { base: 'ai', tone: 4, hanzi: '爱', caption: 'ài 爱' },
    ]);
  });

  it('零声母: e 开头 (er)', () => {
    expect(buildSpellSteps('儿', 'ér')).toEqual([
      { base: 'er', caption: 'er' },
      { base: 'er', tone: 2, hanzi: '儿', caption: 'ér 儿' },
    ]);
  });

  it('两拼: 翘舌 zh + 韵母', () => {
    expect(buildSpellSteps('猪', 'zhū')).toEqual([
      { base: 'zh', caption: 'zh' },
      { base: 'u', caption: 'u' },
      { base: 'u', tone: 1, hanzi: '猪', caption: 'zhū 猪' },
    ]);
  });

  it('三拼: zh + u + ang', () => {
    expect(buildSpellSteps('床', 'chuáng')).toEqual([
      { base: 'ch', caption: 'ch' },
      { base: 'u', caption: 'u' },
      { base: 'ang', caption: 'ang' },
      { base: 'ang', tone: 2, hanzi: '床', caption: 'chuáng 床' },
    ]);
  });
});
