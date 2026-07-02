import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LetterGrid } from './LetterGrid';

const speakEnglishMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../audio/speak', () => ({
  speakEnglish: (...args: unknown[]) => speakEnglishMock(...args),
}));

describe('LetterGrid', () => {
  it('渲染 26 个字母卡片', () => {
    render(<LetterGrid onSelect={() => {}} />);
    expect(screen.getByLabelText('字母 A')).toBeInTheDocument();
    expect(screen.getByLabelText('字母 Z')).toBeInTheDocument();
  });

  it('点击字母卡触发 onSelect(小写)', () => {
    const onSelect = vi.fn();
    render(<LetterGrid onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('字母 C'));
    expect(onSelect).toHaveBeenCalledWith('c');
  });

  it('点击喇叭走 speakEnglish 且不触发 onSelect（阻止冒泡）', () => {
    const onSelect = vi.fn();
    render(<LetterGrid onSelect={onSelect} />);
    speakEnglishMock.mockClear();
    fireEvent.click(screen.getByLabelText('朗读字母 B'));
    expect(speakEnglishMock).toHaveBeenCalledWith('bee');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('标记已学字母显示 ⭐', () => {
    render(<LetterGrid onSelect={() => {}} learnedLetters={new Set(['a'])} />);
    expect(screen.getByLabelText('字母 A').textContent).toContain('⭐');
  });
});
