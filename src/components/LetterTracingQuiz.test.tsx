import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LetterTracingQuiz } from './LetterTracingQuiz';

describe('LetterTracingQuiz', () => {
  it('渲染大小写切换与进度提示（A 有 3 笔）', () => {
    render(<LetterTracingQuiz upper="A" lower="a" />);
    expect(screen.getByRole('button', { name: '大写 A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '小写 a' })).toBeInTheDocument();
    expect(screen.getByText('按顺序描第 1 笔 / 共 3 笔')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新开始 A' })).toBeInTheDocument();
  });

  it('切换到小写会更新笔画数（a 有 2 笔）', () => {
    render(<LetterTracingQuiz upper="A" lower="a" />);
    fireEvent.click(screen.getByRole('button', { name: '小写 a' }));
    expect(screen.getByText('按顺序描第 1 笔 / 共 2 笔')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '字母 a 描红闯关' })).toBeInTheDocument();
  });
});
