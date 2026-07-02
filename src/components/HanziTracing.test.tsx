import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { HanziTracing } from './HanziTracing';
import { loadStrokeData } from '../data/hanziStrokes';

vi.mock('../data/hanziStrokes', () => ({
  loadStrokeData: vi.fn(),
}));

const { create, quiz, cancelQuiz, highlightStroke, store } = vi.hoisted(() => {
  const store: { opts: Record<string, (arg: unknown) => void> | null } = { opts: null };
  const quiz = vi.fn((o: Record<string, (arg: unknown) => void>) => {
    store.opts = o;
    return Promise.resolve();
  });
  const cancelQuiz = vi.fn();
  const highlightStroke = vi.fn(() => Promise.resolve());
  const create = vi.fn(() => ({ quiz, cancelQuiz, highlightStroke }));
  return { create, quiz, cancelQuiz, highlightStroke, store };
});
vi.mock('hanzi-writer', () => ({ default: { create } }));

const mockedLoad = vi.mocked(loadStrokeData);

describe('HanziTracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.opts = null;
    localStorage.clear();
  });

  it('有数据时启动描红 quiz 并显示重来按钮', async () => {
    mockedLoad.mockResolvedValue({ 花: { strokes: ['M0 0', 'M1 1', 'M2 2'], medians: [[[0, 0]]] } });
    render(<HanziTracing char="花" />);
    expect(await screen.findByRole('button', { name: '重新描红 花' })).toBeInTheDocument();
    expect(quiz).toHaveBeenCalled();
    expect(screen.getByText(/用手指按笔顺/)).toBeInTheDocument();
  });

  it('完成后显示庆祝与星星', async () => {
    mockedLoad.mockResolvedValue({ 花: { strokes: ['M0 0', 'M1 1'], medians: [[[0, 0]]] } });
    render(<HanziTracing char="花" />);
    await screen.findByRole('button', { name: '重新描红 花' });
    act(() => {
      store.opts?.onComplete?.({ character: '花', totalMistakes: 0 });
    });
    expect(await screen.findByText('🎉 写对啦！')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再描一遍 花' })).toBeInTheDocument();
  });

  it('缺少数据时显示降级提示', async () => {
    mockedLoad.mockResolvedValue({});
    render(<HanziTracing char="花" />);
    expect(await screen.findByText('该字暂无描红练习')).toBeInTheDocument();
  });

  it('默认不自动提示：showHintAfterMisses=false，不主动高亮', async () => {
    mockedLoad.mockResolvedValue({ 花: { strokes: ['M0 0', 'M1 1'], medians: [[[0, 0]]] } });
    render(<HanziTracing char="花" />);
    await screen.findByRole('button', { name: '重新描红 花' });
    expect(store.opts?.showHintAfterMisses).toBe(false);
    expect(highlightStroke).not.toHaveBeenCalled();
  });

  it('点「提示这一笔」高亮当前笔（首笔=0）', async () => {
    mockedLoad.mockResolvedValue({ 花: { strokes: ['M0 0', 'M1 1'], medians: [[[0, 0]]] } });
    render(<HanziTracing char="花" />);
    const btn = await screen.findByRole('button', { name: '提示当前笔画' });
    fireEvent.click(btn);
    expect(highlightStroke).toHaveBeenCalledWith(0);
  });

  it('描对一笔后，提示高亮下一笔', async () => {
    mockedLoad.mockResolvedValue({ 花: { strokes: ['M0 0', 'M1 1', 'M2 2'], medians: [[[0, 0]]] } });
    render(<HanziTracing char="花" />);
    await screen.findByRole('button', { name: '提示当前笔画' });
    act(() => {
      store.opts?.onCorrectStroke?.({ strokeNum: 0 });
    });
    fireEvent.click(screen.getByRole('button', { name: '提示当前笔画' }));
    expect(highlightStroke).toHaveBeenCalledWith(1);
  });
});

