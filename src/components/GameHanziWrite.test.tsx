import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GameHanziWrite, orderedWriteCandidates, scoreFor, starsFor } from './GameHanziWrite';
import { loadStrokeData } from '../data/hanziStrokes';
import { HANZI } from '../data/hanzi';

vi.mock('../data/hanziStrokes', () => ({ loadStrokeData: vi.fn() }));
vi.mock('../hooks/useAudio', () => ({ useAudio: () => ({ play: vi.fn() }) }));

const { create, quiz, cancelQuiz, highlightStroke, animateCharacter, hideCharacter, store } = vi.hoisted(() => {
  const store: { opts: Record<string, (arg: unknown) => void> | null } = { opts: null };
  const quiz = vi.fn((o: Record<string, (arg: unknown) => void>) => {
    store.opts = o;
    return Promise.resolve();
  });
  const cancelQuiz = vi.fn();
  const highlightStroke = vi.fn(() => Promise.resolve());
  const animateCharacter = vi.fn(() => Promise.resolve());
  const hideCharacter = vi.fn();
  const create = vi.fn(() => ({ quiz, cancelQuiz, highlightStroke, animateCharacter, hideCharacter }));
  return { create, quiz, cancelQuiz, highlightStroke, animateCharacter, hideCharacter, store };
});
vi.mock('hanzi-writer', () => ({ default: { create } }));

const mockedLoad = vi.mocked(loadStrokeData);
const strokeData = { strokes: ['M0 0', 'M1 1'], medians: [[[0, 0]]] };
// 任何字都返回笔顺数据，保证选字与描红流程可跑通。
const strokeMap = new Proxy({} as Record<string, typeof strokeData>, { get: () => strokeData });

describe('scoreFor', () => {
  it('满分 100（无错）', () => {
    expect(scoreFor([0, 0, 0, 0, 0])).toBe(100);
  });
  it('每错一笔扣 2 分，单字最低 0', () => {
    expect(scoreFor([1, 2, 0, 0, 0])).toBe(94);
    expect(scoreFor([20])).toBe(0);
  });
});

describe('starsFor', () => {
  it('0 错 3 星，1–4 错 2 星，其余 1 星', () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(4)).toBe(2);
    expect(starsFor(5)).toBe(1);
  });
});

describe('orderedWriteCandidates', () => {
  it('已学过的字排在最前', () => {
    const known = HANZI.find((h) => h.volumeId !== 'g1a')?.char ?? HANZI[0].char;
    const out = orderedWriteCandidates(new Set([known]));
    expect(out[0].char).toBe(known);
    expect(out.length).toBeGreaterThan(5);
  });
  it('没有已学字时回退到一年级上册', () => {
    const out = orderedWriteCandidates(new Set());
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out.every((h) => h.volumeId === 'g1a')).toBe(true);
    expect(new Set(out.map((h) => h.char)).size).toBe(out.length);
  });
});

describe('GameHanziWrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.opts = null;
    localStorage.clear();
    mockedLoad.mockResolvedValue(strokeMap);
  });

  it('加载后显示第 1 / 5 字并启动描红 quiz', async () => {
    render(<GameHanziWrite userId={1} onFinish={vi.fn()} />);
    expect(await screen.findByText(/第 1 \/ 5 字/)).toBeInTheDocument();
    expect(quiz).toHaveBeenCalled();
  });

  it('写完一个字显示庆祝，未到最后一字提示下一个', async () => {
    render(<GameHanziWrite userId={1} onFinish={vi.fn()} />);
    await screen.findByText(/第 1 \/ 5 字/);
    act(() => {
      store.opts?.onComplete?.({ character: '字', totalMistakes: 0 });
    });
    expect(await screen.findByText(/写对啦/)).toBeInTheDocument();
  });
});
