import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('每个中文字符一个 token', () => {
    expect(tokenize('听广播')).toEqual(['听', '广', '播']);
  });

  it('中英混合：中文按字、英文按空格', () => {
    expect(tokenize('听广播 b b b')).toEqual(['听', '广', '播', 'b', 'b', 'b']);
  });

  it('忽略中英文标点', () => {
    expect(tokenize('你好，世界！')).toEqual(['你', '好', '世', '界']);
  });

  it('多空格视为一个分隔符', () => {
    expect(tokenize('b   b   b')).toEqual(['b', 'b', 'b']);
  });

  it('override 直接返回，不做切分', () => {
    expect(tokenize('听广播 b b b', ['广播', '广播', 'b', 'b', 'b'])).toEqual([
      '广播', '广播', 'b', 'b', 'b',
    ]);
  });

  it('空字符串返回空数组', () => {
    expect(tokenize('')).toEqual([]);
  });
});
