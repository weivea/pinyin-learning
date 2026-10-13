import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { speak, stopSpeaking } from '../audio/speak';
import { PUZZLE_GAME_TYPES } from '../data/games';
import {
  PUZZLE_ROUND_COUNT,
  animalLabel,
  buildMazeRound,
  buildMissingRound,
  buildPatternRound,
  buildShapeRound,
  buildSortingRound,
  canPlaceShape,
  mazePath,
} from '../data/puzzleGames';
import type { PuzzleGameType, PuzzleProgress } from '../types';
import { GamePuzzle } from './GamePuzzle';

vi.mock('../audio/speak', () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn().mockResolvedValue(undefined),
}));

function checkpoint(type: PuzzleGameType, completed: number, points = 20): PuzzleProgress {
  return {
    gameType: type,
    levelScores: Array(completed).fill(points),
    bestScore: completed === PUZZLE_ROUND_COUNT ? completed * points : null,
    isNewBest: completed === PUZZLE_ROUND_COUNT,
  };
}

function startGame(type: PuzzleGameType, progress: PuzzleProgress | null = null) {
  const onFinish = vi.fn();
  const onExit = vi.fn();
  let saved = progress ?? checkpoint(type, 0);
  const onSaveLevel = vi.fn(async (_level: number, score: number): Promise<PuzzleProgress | null> => {
    const levelScores = [...saved.levelScores, score];
    const total = levelScores.reduce((sum, value) => sum + value, 0);
    const isNewBest = levelScores.length === PUZZLE_ROUND_COUNT && (saved.bestScore === null || total > saved.bestScore);
    saved = { ...saved, levelScores, bestScore: isNewBest ? total : saved.bestScore, isNewBest };
    return saved;
  });
  const onRestart = vi.fn(async (): Promise<PuzzleProgress | null> => {
    saved = { ...saved, levelScores: [], isNewBest: false };
    return saved;
  });
  return {
    ...render(<GamePuzzle type={type} progress={progress} onSaveLevel={onSaveLevel} onRestart={onRestart} onFinish={onFinish} onExit={onExit} />),
    onFinish, onExit, onSaveLevel, onRestart, getSaved: () => saved,
  };
}

function animalButton(animal: ReturnType<typeof buildSortingRound>['animals'][number]) {
  return screen.getByRole('button', { name: animalButtonName(animal) });
}

async function solveRound(type: PuzzleGameType, level: number) {
  switch (type) {
    case 'pattern': {
      const round = buildPatternRound(level);
      fireEvent.click(screen.getByRole('button', { name: `选择${round.answer.label}` }));
      break;
    }
    case 'sorting': {
      const round = buildSortingRound(level);
      for (const animal of round.animals) {
        fireEvent.click(animalButton(animal));
        const group = round.groups.find(item => item.value === animal[round.rule])!;
        fireEvent.click(screen.getByRole('button', { name: `送到${group.label}` }));
      }
      break;
    }
    case 'maze': {
      const maze = buildMazeRound(level);
      for (const cell of mazePath(maze, maze.start).slice(1)) {
        fireEvent.click(screen.getByRole('button', {
          name: new RegExp(`^第 ${Math.floor(cell / maze.width) + 1} 行第 ${cell % maze.width + 1} 格，`),
        }));
      }
      break;
    }
    case 'missing': {
      const round = buildMissingRound(level);
      fireEvent.click(screen.getByRole('button', { name: /我记住了/ }));
      fireEvent.click(screen.getByRole('button', { name: `选择${round.missing.label}` }));
      break;
    }
    case 'shapes': {
      const round = buildShapeRound(level);
      const available = [...round.pieces];
      for (const slot of round.slots) {
        const index = available.findIndex(piece => piece.kind === slot.kind
          && (round.canRotate || canPlaceShape(piece, slot, piece.rotation)));
        const piece = available.splice(index, 1)[0];
        fireEvent.click(screen.getByRole('button', { name: `选择${piece.label}` }));
        let rotation = piece.rotation;
        while (!canPlaceShape(piece, slot, rotation)) {
          fireEvent.click(screen.getByRole('button', { name: '旋转选中的图形' }));
          rotation = (rotation + 90) % 360;
        }
        fireEvent.click(screen.getByRole('button', { name: `放到${slot.label}` }));
      }
      break;
    }
  }
  await screen.findByRole('button', { name: level === PUZZLE_ROUND_COUNT - 1 ? /收下星星/ : /下一关/ });
}

describe('GamePuzzle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each(PUZZLE_GAME_TYPES)('completes all fifty %s levels and saves each exactly once', async type => {
    const { onFinish, onSaveLevel } = startGame(type);
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      expect(screen.getByText(`第 ${level + 1} / 50 关`)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(level));
      expect(screen.queryByRole('button', { name: /下一关|收下星星/ })).not.toBeInTheDocument();
      await solveRound(type, level);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(level + 1));
      expect(onFinish).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: level === 49 ? /收下星星/ : /下一关/ }));
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(1000, 3, true);
    expect(onSaveLevel.mock.calls.map(([level]) => level)).toEqual(Array.from({ length: 50 }, (_, level) => level));
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  }, 20_000);

  it('keeps wrong answers retryable, charges a repeated visual hint only once, and resets hints next round', async () => {
    const { onFinish } = startGame('pattern', checkpoint('pattern', 48));
    const round = buildPatternRound(48);
    const wrong = round.options.find(picture => picture.id !== round.answer.id)!;
    fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('一组一组排队');
    expect(screen.getByText('第 49 / 50 关')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    expect(screen.getByRole('button', { name: `选择${round.answer.label}` })).toHaveClass('is-hinted');
    await solveRound('pattern', 48);
    fireEvent.click(screen.getByRole('button', { name: /下一关/ }));
    expect(screen.queryByLabelText(/重复的一组/)).not.toBeInTheDocument();
    await solveRound('pattern', 49);
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(onFinish).toHaveBeenCalledWith(996, 3, true);
  });

  it('still gives at least one star after many mistakes', async () => {
    const { onFinish } = startGame('pattern', checkpoint('pattern', 49, 10));
    const round = buildPatternRound(49);
    const wrong = round.options.find(picture => picture.id !== round.answer.id)!;
    for (let attempt = 0; attempt < 8; attempt++) {
      fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    }
    await solveRound('pattern', 49);
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(onFinish).toHaveBeenCalledWith(500, 1, true);
  });

  it('focuses the continue control after solving and scrolls back to the new round', async () => {
    startGame('pattern');
    const game = screen.getByRole('region', { name: '规律小火车' });
    game.scrollTop = 200;
    await solveRound('pattern', 0);
    const next = screen.getByRole('button', { name: /下一关/ });
    await waitFor(() => expect(next).toHaveFocus());
    fireEvent.click(next);
    expect(game.scrollTop).toBe(0);
    expect(screen.getByRole('heading', { name: /规律小火车/ })).toHaveFocus();
  });

  it('waits for the child to start recalling and lets them peek after an incorrect answer', async () => {
    vi.useFakeTimers();
    const { onFinish } = startGame('missing');
    const round = buildMissingRound(0);
    act(() => { vi.advanceTimersByTime(120_000); });
    vi.useRealTimers();
    expect(screen.getByRole('group', { name: '记忆物品' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '找出藏起来的伙伴' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /我记住了/ }));
    const pictures = screen.getByRole('group', { name: '寻找藏起来的物品' });
    expect(within(pictures).queryByText(round.missing.label)).not.toBeInTheDocument();
    const wrong = round.options.find(picture => picture.id !== round.missing.id)!;
    fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('它还在上面呢');
    fireEvent.click(screen.getByRole('button', { name: /再看一眼/ }));
    expect(within(screen.getByRole('group', { name: '记忆物品' })).getByText(round.missing.label)).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
    await solveRound('missing', 0);
    expect(screen.getByRole('button', { name: /下一关/ })).toBeInTheDocument();
  });

  it('changes the sorting rule, keeps incorrectly sorted animals, and accepts drag-and-drop', async () => {
    startGame('sorting', checkpoint('sorting', 9));
    fireEvent.click(screen.getByRole('button', { name: /送到小兔屋/ }));
    expect(screen.getByRole('status')).toHaveTextContent('先点一只小动物');
    await solveRound('sorting', 9);
    fireEvent.click(screen.getByRole('button', { name: /下一关/ }));
    expect(screen.getByText('颜色', { selector: 'strong' })).toBeInTheDocument();
    const round = buildSortingRound(10);
    const animal = round.animals[0];
    fireEvent.click(animalButton(animal));
    const wrong = round.groups.find(group => group.value !== animal.color)!;
    fireEvent.click(screen.getByRole('button', { name: `送到${wrong.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('按颜色找家');
    expect(animalButton(animal)).toBeInTheDocument();
    const correct = round.groups.find(group => group.value === animal.color)!;
    fireEvent.drop(screen.getByRole('button', { name: `送到${correct.label}` }), {
      dataTransfer: { getData: () => animal.id },
    });
    expect(screen.queryByRole('button', { name: animalButtonName(animal) })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `送到${correct.label}` })).toHaveTextContent('已回家 1 只');
  });

  it('prevents maze teleportation and wall movement, permits backtracking, and updates path hints', () => {
    startGame('maze');
    const maze = buildMazeRound(0);
    const path = mazePath(maze, maze.start);
    const cellButton = (cell: number) => screen.getByRole('button', {
      name: new RegExp(`^第 ${Math.floor(cell / maze.width) + 1} 行第 ${cell % maze.width + 1} 格，`),
    });
    const forward = path[1] - path[0] === 1 ? 'ArrowRight' : 'ArrowDown';
    const backward = forward === 'ArrowRight' ? 'ArrowLeft' : 'ArrowUp';
    const goal = screen.getByRole('button', { name: /胡萝卜/ });
    fireEvent.click(goal);
    expect(screen.getByRole('status')).toHaveTextContent('一次走一格');
    fireEvent.click(screen.getByRole('button', { name: '向上走' }));
    expect(screen.getByRole('status')).toHaveTextContent('走不通');
    expect(screen.getByRole('button', { name: '第 1 行第 1 格，小兔' })).toBeInTheDocument();
    const board = screen.getByRole('group', { name: /小兔迷宫/ });
    fireEvent.keyDown(board, { key: forward });
    expect(cellButton(path[1])).toHaveAttribute('aria-current', 'location');
    fireEvent.keyDown(board, { key: backward });
    expect(screen.getByRole('button', { name: '第 1 行第 1 格，小兔' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    expect(cellButton(path[1])).toHaveClass('is-hinted');
    fireEvent.keyDown(board, { key: forward });
    expect(cellButton(path[2])).toHaveClass('is-hinted');
    expect(maze.start).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: /回到起点/ }));
    expect(screen.getByRole('button', { name: '第 1 行第 1 格，小兔' })).toBeInTheDocument();
  });

  it('rejects mismatched pieces and permits dragging a shape into its target', () => {
    startGame('shapes');
    const round = buildShapeRound(0);
    const square = round.pieces.find(piece => piece.kind === 'square')!;
    const triangle = round.pieces.find(piece => piece.kind === 'triangle')!;
    fireEvent.click(screen.getByRole('button', { name: `选择${square.label}` }));
    fireEvent.click(screen.getByRole('button', { name: '放到屋顶' }));
    expect(screen.getByRole('status')).toHaveTextContent('换一块图形');
    expect(screen.getByRole('button', { name: '放到屋顶' })).toBeEnabled();
    const transfer = new Map<string, string>();
    fireEvent.dragStart(screen.getByRole('button', { name: `选择${triangle.label}` }), {
      dataTransfer: { setData: (key: string, value: string) => transfer.set(key, value) },
    });
    fireEvent.drop(screen.getByRole('button', { name: '放到屋顶' }), {
      dataTransfer: { getData: (key: string) => transfer.get(key) },
    });
    expect(screen.getByRole('button', { name: '放到屋顶，已拼好' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: `选择${triangle.label}` })).not.toBeInTheDocument();
  });

  it('requires rotation in later shape rounds and reveals outlines on request', () => {
    startGame('shapes', checkpoint('shapes', 32));
    const round = buildShapeRound(32);
    const triangle = round.pieces.find(piece => piece.kind === 'triangle')!;
    const tail = screen.getByRole('button', { name: '放到左机翼' });
    expect(tail).toHaveClass('shape-slot-hidden');
    fireEvent.click(screen.getByRole('button', { name: `选择${triangle.label}` }));
    fireEvent.click(tail);
    expect(screen.getByRole('status')).toHaveTextContent('再转一转方向');
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    expect(tail).not.toHaveClass('shape-slot-hidden');
    for (let rotation = 0; rotation < 3; rotation++) {
      fireEvent.click(screen.getByRole('button', { name: '旋转选中的图形' }));
    }
    fireEvent.click(tail);
    expect(screen.getByRole('button', { name: '放到左机翼，已拼好' })).toBeDisabled();
  });

  it('does not wait for speech, stops it on exit, and keeps the saved level without finishing the course', async () => {
    vi.mocked(speak).mockImplementationOnce(() => new Promise(() => {}));
    const { onFinish, onExit, onSaveLevel, unmount } = startGame('pattern');
    await solveRound('pattern', 0);
    expect(screen.getByRole('button', { name: /下一关/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
    expect(onSaveLevel).toHaveBeenCalledTimes(1);
    unmount();
    expect(stopSpeaking).toHaveBeenCalled();
  });

  it.each(PUZZLE_GAME_TYPES)('resumes %s at the first unfinished level with earlier points intact', async type => {
    const game = startGame(type, checkpoint(type, 12, 18));
    expect(screen.getByText('第 13 / 50 关')).toBeInTheDocument();
    expect(screen.getByText('已保存 12 关 · 本轮累计 216 分')).toBeInTheDocument();
    await solveRound(type, 12);
    expect(game.getSaved().levelScores).toHaveLength(13);
    fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    const saved = game.getSaved();
    game.unmount();
    const resumed = startGame(type, saved);
    expect(screen.getByText('第 14 / 50 关')).toBeInTheDocument();
    expect(screen.getByText('已保存 13 关 · 本轮累计 236 分')).toBeInTheDocument();
    expect(resumed.onSaveLevel).not.toHaveBeenCalled();
  });

  it('keeps the solved board on a failed save and retries the same score without advancing', async () => {
    const { onSaveLevel } = startGame('pattern', checkpoint('pattern', 10));
    onSaveLevel.mockResolvedValueOnce(null);
    const round = buildPatternRound(10);
    fireEvent.click(screen.getByRole('button', { name: `选择${round.answer.label}` }));
    expect(await screen.findByRole('alert')).toHaveTextContent('这一关的保存尚未确认');
    expect(screen.queryByRole('button', { name: /下一关/ })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
    fireEvent.click(screen.getByRole('button', { name: '重试保存本关' }));
    await screen.findByRole('button', { name: /下一关/ });
    expect(onSaveLevel.mock.calls).toEqual([[10, 20], [10, 20]]);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '11');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('waits for a pending save and prevents duplicate completion writes', async () => {
    const { onSaveLevel } = startGame('pattern');
    let finishSave!: (progress: PuzzleProgress) => void;
    onSaveLevel.mockReturnValueOnce(new Promise(resolve => { finishSave = resolve; }));
    const answer = screen.getByRole('button', { name: `选择${buildPatternRound(0).answer.label}` });
    fireEvent.click(answer);
    fireEvent.click(answer);
    expect(screen.getByRole('button', { name: '正在保存本关…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /选游戏/ })).toBeDisabled();
    expect(onSaveLevel).toHaveBeenCalledTimes(1);
    await act(async () => { finishSave(checkpoint('pattern', 1)); });
    expect(screen.getByRole('button', { name: /下一关/ })).toBeEnabled();
  });

  it('opens a completed course without replaying level 50 or creating level 51', async () => {
    const { onSaveLevel, onFinish } = startGame('maze', checkpoint('maze', 50));
    expect(screen.getByRole('heading', { name: /全部 50 关已完成/ })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /小兔迷宫/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看成绩' }));
    expect(onFinish).toHaveBeenCalledWith(1000, 3, true);
    expect(onSaveLevel).not.toHaveBeenCalled();
  });

  it('only resets a completed course after a successful restart and preserves its best score', async () => {
    const { onRestart, getSaved } = startGame('shapes', checkpoint('shapes', 50));
    onRestart.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole('button', { name: '再玩一轮' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('原来的进度和成绩已保留');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    fireEvent.click(screen.getByRole('button', { name: '再玩一轮' }));
    await screen.findByText('第 1 / 50 关');
    expect(getSaved()).toMatchObject({ levelScores: [], bestScore: 1000 });
  });
});

function animalButtonName(animal: ReturnType<typeof buildSortingRound>['animals'][number]) {
  return `选择${animalLabel(animal)}，${Number(animal.id.split('-')[1]) + 1}号`;
}
