import { describe, it, expect } from 'vitest';
import { buildSpellSteps } from './spell';

describe('buildSpellSteps', () => {
  it('两拼: 声母+韵母 -> [声母, 韵母, 加调字]', () => {
    expect(buildSpellSteps('爸', 'bà')).toEqual([
      { base: 'b', caption: 'b' },
      { base: 'a', tone: 4, caption: 'a' },
      { base: 'ba', tone: 4, hanzi: '爸', caption: 'bà 爸' },
    ]);
  });

  it('两拼: 后鼻韵母', () => {
    expect(buildSpellSteps('风', 'fēng')).toEqual([
      { base: 'f', caption: 'f' },
      { base: 'eng', tone: 1, caption: 'eng' },
      { base: 'feng', tone: 1, hanzi: '风', caption: 'fēng 风' },
    ]);
  });

  it('两拼: w + a（蛙）', () => {
    expect(buildSpellSteps('蛙', 'wā')).toEqual([
      { base: 'w', caption: 'w' },
      { base: 'a', tone: 1, caption: 'a' },
      { base: 'wa', tone: 1, hanzi: '蛙', caption: 'wā 蛙' },
    ]);
  });

  it('三拼: 声母+介母 i +韵母', () => {
    expect(buildSpellSteps('家', 'jiā')).toEqual([
      { base: 'j', caption: 'j' },
      { base: 'i', caption: 'i' },
      { base: 'a', tone: 1, caption: 'a' },
      { base: 'jia', tone: 1, hanzi: '家', caption: 'jiā 家' },
    ]);
  });

  it('三拼: 声母+介母 u +韵母', () => {
    expect(buildSpellSteps('瓜', 'guā')).toEqual([
      { base: 'g', caption: 'g' },
      { base: 'u', caption: 'u' },
      { base: 'a', tone: 1, caption: 'a' },
      { base: 'gua', tone: 1, hanzi: '瓜', caption: 'guā 瓜' },
    ]);
  });

  it('两拼: q + ün(写作 un)', () => {
    expect(buildSpellSteps('裙', 'qún')).toEqual([
      { base: 'q', caption: 'q' },
      { base: 'ün', tone: 2, caption: 'ün' },
      { base: 'qun', tone: 2, hanzi: '裙', caption: 'qún 裙' },
    ]);
  });

  it('两拼: x + üe(写作 ue)', () => {
    expect(buildSpellSteps('学', 'xué')).toEqual([
      { base: 'x', caption: 'x' },
      { base: 'üe', tone: 2, caption: 'üe' },
      { base: 'xue', tone: 2, hanzi: '学', caption: 'xué 学' },
    ]);
  });

  it('两拼: l + ü', () => {
    expect(buildSpellSteps('绿', 'lǜ')).toEqual([
      { base: 'l', caption: 'l' },
      { base: 'ü', tone: 4, caption: 'ü' },
      { base: 'lü', tone: 4, hanzi: '绿', caption: 'lǜ 绿' },
    ]);
  });

  it('两拼: j + ü(写作u)', () => {
    expect(buildSpellSteps('橘', 'jú')).toEqual([
      { base: 'j', caption: 'j' },
      { base: 'ü', tone: 2, caption: 'ü' },
      { base: 'ju', tone: 2, hanzi: '橘', caption: 'jú 橘' },
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
      { base: 'u', tone: 1, caption: 'u' },
      { base: 'zhu', tone: 1, hanzi: '猪', caption: 'zhū 猪' },
    ]);
  });

  it('三拼: ch + u + ang', () => {
    expect(buildSpellSteps('床', 'chuáng')).toEqual([
      { base: 'ch', caption: 'ch' },
      { base: 'u', caption: 'u' },
      { base: 'ang', tone: 2, caption: 'ang' },
      { base: 'chuang', tone: 2, hanzi: '床', caption: 'chuáng 床' },
    ]);
  });

  it('三拼: x + i + ong', () => {
    expect(buildSpellSteps('熊', 'xióng')).toEqual([
      { base: 'x', caption: 'x' },
      { base: 'i', caption: 'i' },
      { base: 'ong', tone: 2, caption: 'ong' },
      { base: 'xiong', tone: 2, hanzi: '熊', caption: 'xióng 熊' },
    ]);
  });

  it('三拼: x + i + an (ian)', () => {
    expect(buildSpellSteps('先', 'xiān')).toEqual([
      { base: 'x', caption: 'x' },
      { base: 'i', caption: 'i' },
      { base: 'an', tone: 1, caption: 'an' },
      { base: 'xian', tone: 1, hanzi: '先', caption: 'xiān 先' },
    ]);
  });

  it('三拼: q + ü + an (üan)', () => {
    expect(buildSpellSteps('全', 'quán')).toEqual([
      { base: 'q', caption: 'q' },
      { base: 'ü', caption: 'ü' },
      { base: 'an', tone: 2, caption: 'an' },
      { base: 'quan', tone: 2, hanzi: '全', caption: 'quán 全' },
    ]);
  });

  it('三拼: g + u + o (uo)', () => {
    expect(buildSpellSteps('果', 'guǒ')).toEqual([
      { base: 'g', caption: 'g' },
      { base: 'u', caption: 'u' },
      { base: 'o', tone: 3, caption: 'o' },
      { base: 'guo', tone: 3, hanzi: '果', caption: 'guǒ 果' },
    ]);
  });

  it('三拼: x + i + ao (iao)', () => {
    expect(buildSpellSteps('小', 'xiǎo')).toEqual([
      { base: 'x', caption: 'x' },
      { base: 'i', caption: 'i' },
      { base: 'ao', tone: 3, caption: 'ao' },
      { base: 'xiao', tone: 3, hanzi: '小', caption: 'xiǎo 小' },
    ]);
  });
});
