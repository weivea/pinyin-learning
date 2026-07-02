import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HanziStrokeAnimation } from './HanziStrokeAnimation';
import { loadStrokeData } from '../data/hanziStrokes';

vi.mock('../data/hanziStrokes', () => ({
  loadStrokeData: vi.fn(),
}));

const { create, animateCharacter, showCharacter, hideCharacter } = vi.hoisted(() => {
  const animateCharacter = vi.fn().mockResolvedValue(undefined);
  const showCharacter = vi.fn();
  const hideCharacter = vi.fn();
  const create = vi.fn(() => ({ animateCharacter, showCharacter, hideCharacter }));
  return { create, animateCharacter, showCharacter, hideCharacter };
});
vi.mock('hanzi-writer', () => ({ default: { create } }));

const mockedLoad = vi.mocked(loadStrokeData);

describe('HanziStrokeAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有笔顺数据时创建书写动画并显示重播按钮', async () => {
    mockedLoad.mockResolvedValue({ 花: { strokes: ['M0 0'], medians: [[[0, 0]]] } });
    render(<HanziStrokeAnimation char="花" />);
    expect(await screen.findByRole('button', { name: '再写一遍 花' })).toBeInTheDocument();
    expect(create).toHaveBeenCalled();
    expect(animateCharacter).toHaveBeenCalled();
  });

  it('缺少数据时显示降级提示', async () => {
    mockedLoad.mockResolvedValue({});
    render(<HanziStrokeAnimation char="花" />);
    expect(await screen.findByText('该字暂无笔顺演示')).toBeInTheDocument();
  });

  it('加载失败时显示降级提示', async () => {
    mockedLoad.mockRejectedValue(new Error('offline'));
    render(<HanziStrokeAnimation char="花" />);
    expect(await screen.findByText('该字暂无笔顺演示')).toBeInTheDocument();
  });
});
