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
  shapeMatchesSlot,
  sortAnimalValue,
} from '../data/puzzleGames';
import type { PuzzleGameType, PuzzleProgress } from '../types';
import { GamePuzzle } from './GamePuzzle';
import { starsForScore } from './gameUtils';

vi.mock('../audio/speak', () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn().mockResolvedValue(undefined),
}));

function checkpoint(type: PuzzleGameType, completed: number, points = 20): PuzzleProgress {
  return {
    gameType: type,
    levelScores: Array(completed).fill(points),
    bestScore: completed === PUZZLE_ROUND_COUNT ? completed * points : null,
    bestStars: completed === PUZZLE_ROUND_COUNT ? starsForScore(completed * points, PUZZLE_ROUND_COUNT * 20) : 0,
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
    const stars = levelScores.length === PUZZLE_ROUND_COUNT ? starsForScore(total, PUZZLE_ROUND_COUNT * 20) : 0;
    saved = {
      ...saved, levelScores, bestScore: isNewBest ? total : saved.bestScore,
      bestStars: stars > saved.bestStars ? stars : saved.bestStars, isNewBest,
    };
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
      for (const gap of round.gaps) {
        fireEvent.click(screen.getByRole('button', { name: `选择${round.sequence[gap].label}` }));
      }
      break;
    }
    case 'sorting': {
      const round = buildSortingRound(level);
      for (const animal of round.animals) {
        fireEvent.click(animalButton(animal));
        const group = round.groups.find(item => item.value === sortAnimalValue(animal, round.rule))!;
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
      for (const missing of round.missing) {
        fireEvent.click(screen.getByRole('button', { name: `选择${missing.label}` }));
      }
      break;
    }
    case 'shapes': {
      const round = buildShapeRound(level);
      const available = [...round.pieces];
      for (const slot of round.slots) {
        const index = available.findIndex(piece => shapeMatchesSlot(piece, slot)
          && (round.canRotate || canPlaceShape(piece, slot, piece.rotation)));
        const piece = available.splice(index, 1)[0];
        fireEvent.click(screen.getByRole('button', { name: `选择${piece.label}` }));
        let rotation = piece.rotation;
        for (let turn = 0; turn < 4 && !canPlaceShape(piece, slot, rotation); turn++) {
          fireEvent.click(screen.getByRole('button', { name: '旋转选中的图形' }));
          rotation = (rotation + 90) % 360;
        }
        expect(canPlaceShape(piece, slot, rotation)).toBe(true);
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

  it.each(PUZZLE_GAME_TYPES)('completes all one hundred %s levels and saves each exactly once', async type => {
    const { onFinish, onSaveLevel } = startGame(type);
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      expect(screen.getByText(`第 ${level + 1} / 100 关`)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(level));
      expect(screen.queryByRole('button', { name: /下一关|收下星星/ })).not.toBeInTheDocument();
      await solveRound(type, level);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(level + 1));
      expect(onFinish).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: level === 99 ? /收下星星/ : /下一关/ }));
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(2000, 3, true);
    expect(onSaveLevel.mock.calls.map(([level]) => level)).toEqual(Array.from({ length: 100 }, (_, level) => level));
    expect(onSaveLevel.mock.calls.every(([, score]) => score === 20)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  }, 60_000);

  it('keeps wrong answers retryable, charges a repeated visual hint only once, and resets hints next round', async () => {
    const { onFinish } = startGame('pattern', checkpoint('pattern', 98));
    const round = buildPatternRound(98);
    const answer = round.sequence[round.gaps[0]];
    const wrong = round.options.find(picture => picture.id !== answer.id)!;
    fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('一组一组排队');
    expect(screen.getByText('第 99 / 100 关')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    expect(screen.getByRole('button', { name: `选择${answer.label}` })).toHaveClass('is-hinted');
    await solveRound('pattern', 98);
    fireEvent.click(screen.getByRole('button', { name: /下一关/ }));
    expect(screen.queryByLabelText(/重复的一组/)).not.toBeInTheDocument();
    await solveRound('pattern', 99);
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(onFinish).toHaveBeenCalledWith(1996, 3, true);
  });

  it('still gives at least one star after many mistakes', async () => {
    const { onFinish } = startGame('pattern', checkpoint('pattern', 99, 10));
    const round = buildPatternRound(99);
    const wrong = round.options.find(picture => picture.id !== round.sequence[round.gaps[0]].id)!;
    for (let attempt = 0; attempt < 8; attempt++) {
      fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    }
    await solveRound('pattern', 99);
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(onFinish).toHaveBeenCalledWith(1000, 1, true);
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
    expect(within(pictures).queryByText(round.missing[0].label)).not.toBeInTheDocument();
    const wrong = round.options.find(picture => picture.id !== round.missing[0].id)!;
    fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('它还在上面呢');
    fireEvent.click(screen.getByRole('button', { name: /再看一眼/ }));
    expect(within(screen.getByRole('group', { name: '记忆物品' })).getByText(round.missing[0].label)).toBeInTheDocument();
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

  it('waits for every pattern gap and moves the hint to the next unanswered wagon', async () => {
    const { onSaveLevel } = startGame('pattern', checkpoint('pattern', 80));
    const round = buildPatternRound(80);
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    for (const [index, gap] of round.gaps.entries()) {
      const answer = screen.getByRole('button', { name: `选择${round.sequence[gap].label}` });
      expect(answer).toHaveClass('is-hinted');
      expect(screen.getByLabelText(`第 ${gap + 1} 节车厢：问号`)).toHaveAttribute('aria-current', 'step');
      expect(onSaveLevel).not.toHaveBeenCalled();
      fireEvent.click(answer);
      if (index < round.gaps.length - 1) expect(screen.queryByRole('button', { name: /下一关/ })).not.toBeInTheDocument();
    }
    await screen.findByRole('button', { name: /下一关/ });
    expect(onSaveLevel.mock.calls).toEqual([[80, 18]]);
  });

  it('finds several hidden companions, rejects unfamiliar choices, and resets partial recall when peeking', async () => {
    const { onSaveLevel } = startGame('missing', checkpoint('missing', 80));
    const round = buildMissingRound(80);
    fireEvent.click(screen.getByRole('button', { name: /我记住了/ }));
    const board = screen.getByRole('group', { name: '寻找藏起来的物品' });
    for (const picture of round.missing) expect(within(board).queryByText(picture.label)).not.toBeInTheDocument();
    const outsider = round.options.find(picture => !round.pictures.includes(picture))!;
    fireEvent.click(screen.getByRole('button', { name: `选择${outsider.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('刚才没有出现');
    const first = screen.getByRole('button', { name: `选择${round.missing[0].label}` });
    fireEvent.click(first);
    fireEvent.click(first);
    expect(first).toBeDisabled();
    expect(screen.getByText('找齐 3 位伙伴，已找到 1 位')).toBeInTheDocument();
    expect(onSaveLevel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /再看一眼/ }));
    expect(screen.getByRole('group', { name: '记忆物品' })).toBeInTheDocument();
    await solveRound('missing', 80);
    expect(onSaveLevel.mock.calls).toEqual([[80, 16]]);
  });

  it.each([50, 80])('requires every sorting attribute at level index %i and keeps a small waiting tray', level => {
    const { onSaveLevel } = startGame('sorting', checkpoint('sorting', level));
    const round = buildSortingRound(level);
    const animal = round.animals[0];
    const correct = round.groups.find(group => group.value === sortAnimalValue(animal, round.rule))!;
    const wrong = round.groups.find(group => group.value !== correct.value && group.sample.kind === animal.kind)!;
    const tray = screen.getByRole('group', { name: '等待回家的小动物' });
    expect(within(tray).getAllByRole('button')).toHaveLength(4);
    fireEvent.click(animalButton(animal));
    fireEvent.click(screen.getByRole('button', { name: `送到${wrong.label}` }));
    expect(animalButton(animal)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    expect(screen.getByRole('button', { name: `送到${correct.label}` })).toHaveClass('is-hinted');
    expect(screen.getByRole('button', { name: `送到${wrong.label}` })).not.toHaveClass('is-hinted');
    fireEvent.drop(screen.getByRole('button', { name: `送到${correct.label}` }), {
      dataTransfer: { getData: () => animal.id },
    });
    expect(screen.queryByRole('button', { name: animalButtonName(animal) })).not.toBeInTheDocument();
    expect(within(tray).getAllByRole('button')).toHaveLength(4);
    expect(onSaveLevel).not.toHaveBeenCalled();
  });

  it('rejects a same-shape wrong-size piece and hints only a matching-size target', () => {
    startGame('shapes', checkpoint('shapes', 70));
    const round = buildShapeRound(70);
    const piece = round.pieces.find(item => item.kind === 'circle' && item.size === 110)!;
    const correct = round.slots.find(slot => shapeMatchesSlot(piece, slot))!;
    const wrong = round.slots.find(slot => slot.kind === piece.kind && slot.size !== piece.size)!;
    fireEvent.click(screen.getByRole('button', { name: `选择${piece.label}` }));
    fireEvent.click(screen.getByRole('button', { name: `放到${wrong.label}` }));
    expect(screen.getByRole('status')).toHaveTextContent('再比一比大小');
    fireEvent.click(screen.getByRole('button', { name: /帮帮我/ }));
    expect(screen.getByRole('button', { name: `放到${correct.label}` })).toHaveClass('is-hinted');
    expect(screen.getByRole('button', { name: `放到${wrong.label}` })).not.toHaveClass('is-hinted');
    fireEvent.click(screen.getByRole('button', { name: `放到${correct.label}` }));
    expect(screen.getByRole('button', { name: `放到${correct.label}，已拼好` })).toBeDisabled();
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
    expect(screen.getByText('第 13 / 100 关')).toBeInTheDocument();
    expect(screen.getByText('已保存 12 关 · 本轮累计 216 分')).toBeInTheDocument();
    await solveRound(type, 12);
    expect(game.getSaved().levelScores).toHaveLength(13);
    fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    const saved = game.getSaved();
    game.unmount();
    const resumed = startGame(type, saved);
    expect(screen.getByText('第 14 / 100 关')).toBeInTheDocument();
    expect(screen.getByText('已保存 13 关 · 本轮累计 236 分')).toBeInTheDocument();
    expect(resumed.onSaveLevel).not.toHaveBeenCalled();
  });

  it('keeps the solved board on a failed save and retries the same score without advancing', async () => {
    const { onSaveLevel } = startGame('pattern', checkpoint('pattern', 10));
    onSaveLevel.mockResolvedValueOnce(null);
    const round = buildPatternRound(10);
    fireEvent.click(screen.getByRole('button', { name: `选择${round.sequence[round.gaps[0]].label}` }));
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
    const round = buildPatternRound(0);
    const answer = screen.getByRole('button', { name: `选择${round.sequence[round.gaps[0]].label}` });
    fireEvent.click(answer);
    fireEvent.click(answer);
    expect(screen.getByRole('button', { name: '正在保存本关…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /选游戏/ })).toBeDisabled();
    expect(onSaveLevel).toHaveBeenCalledTimes(1);
    await act(async () => { finishSave(checkpoint('pattern', 1)); });
    expect(screen.getByRole('button', { name: /下一关/ })).toBeEnabled();
  });

  it.each(PUZZLE_GAME_TYPES)('continues a formerly completed %s course at level 51 without resetting awards', async type => {
    const progress: PuzzleProgress = { ...checkpoint(type, 50, 18), bestScore: 900, bestStars: 3, isNewBest: true };
    const { onSaveLevel, onFinish, getSaved } = startGame(type, progress);
    expect(screen.getByText('第 51 / 100 关')).toBeInTheDocument();
    expect(screen.getByText('进阶挑战 · 第 1 阶段')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '再玩一轮' })).not.toBeInTheDocument();
    await solveRound(type, 50);
    expect(onSaveLevel).toHaveBeenCalledWith(50, 20);
    expect(onFinish).not.toHaveBeenCalled();
    expect(getSaved()).toMatchObject({ bestScore: 900, bestStars: 3, isNewBest: false });
    expect(getSaved().levelScores).toEqual([...Array(50).fill(18), 20]);
  });

  it('opens a completed course without replaying level 100 or creating level 101', async () => {
    const { onSaveLevel, onFinish } = startGame('maze', checkpoint('maze', 100));
    expect(screen.getByRole('heading', { name: /全部 100 关已完成/ })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /小兔迷宫/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看成绩' }));
    expect(onFinish).toHaveBeenCalledWith(2000, 3, true);
    expect(onSaveLevel).not.toHaveBeenCalled();
  });

  it('only resets a completed course after a successful restart and preserves its best score', async () => {
    const { onRestart, getSaved } = startGame('shapes', checkpoint('shapes', 100));
    onRestart.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByRole('button', { name: '再玩一轮' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('原来的进度和成绩已保留');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    fireEvent.click(screen.getByRole('button', { name: '再玩一轮' }));
    await screen.findByText('第 1 / 100 关');
    expect(getSaved()).toMatchObject({ levelScores: [], bestScore: 2000, bestStars: 3 });
  });
});

function animalButtonName(animal: ReturnType<typeof buildSortingRound>['animals'][number]) {
  return `选择${animalLabel(animal)}，${Number(animal.id.split('-')[1]) + 1}号`;
}
