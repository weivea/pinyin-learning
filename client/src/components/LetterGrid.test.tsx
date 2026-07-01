import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LetterGrid } from './LetterGrid';

describe('LetterGrid', () => {
  it('渲染 26 个字母卡片', () => {
    render(<LetterGrid onSelect={() => {}} />);
    // 每个字母卡 role=button，aria-label 形如 "字母 A"
    expect(screen.getByLabelText('字母 A')).toBeInTheDocument();
    expect(screen.getByLabelText('字母 Z')).toBeInTheDocument();
  });

  it('点击字母卡触发 onSelect(小写)', () => {
    const onSelect = vi.fn();
    render(<LetterGrid onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('字母 C'));
    expect(onSelect).toHaveBeenCalledWith('c');
  });

  it('点击喇叭不触发 onSelect（阻止冒泡），且不报错', () => {
    const onSelect = vi.fn();
    render(<LetterGrid onSelect={onSelect} />);
    const speaker = screen.getByLabelText('朗读字母 B');
    expect(() => fireEvent.click(speaker)).not.toThrow();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('标记已学字母显示 ⭐', () => {
    render(<LetterGrid onSelect={() => {}} learnedLetters={new Set(['a'])} />);
    const card = screen.getByLabelText('字母 A');
    expect(card.textContent).toContain('⭐');
  });
});
