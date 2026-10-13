import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';
import { Preferences } from '@capacitor/preferences';
import { ALL_GAME_TYPES, GAME_INFO, PUZZLE_GAME_TYPES } from '../data/games';
import { buildPatternRound } from '../data/puzzleGames';
import { getPuzzleProgress, savePuzzleLevel } from '../storage/puzzleStore';
import { getProgress } from '../storage/progressStore';
import { GamePage } from './GamePage';

const mock = installPreferencesMock();

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ user: { id: 1, nickname: '小明', avatar: '🐣' }, logout: vi.fn() }),
}));
vi.mock('../audio/speak', () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../components/GameListenChoose', () => ({
  GameListenChoose: ({ onFinish }: { onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void }) => (
    <button onClick={() => onFinish(8, 2)}>完成听音游戏</button>
  ),
}));

async function openGames() {
  const view = render(<MemoryRouter><GamePage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: '规律小火车' })).toBeEnabled());
  return view;
}

async function solvePattern(level: number) {
  const round = buildPatternRound(level);
  fireEvent.click(screen.getByRole('button', { name: `选择${round.answer.label}` }));
  await screen.findByRole('button', { name: level === 49 ? /收下星星/ : /下一关/ });
}

describe('GamePage', () => {
  beforeEach(() => {
    mock.reset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('retains the original games and opens each fifty-level game from its menu card', async () => {
    await openGames();
    for (const type of ALL_GAME_TYPES) {
      expect(screen.getByRole('button', { name: GAME_INFO[type].label })).toBeInTheDocument();
    }
    for (const type of PUZZLE_GAME_TYPES) {
      await waitFor(() => expect(screen.getByRole('button', { name: GAME_INFO[type].label })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: GAME_INFO[type].label }));
      expect(screen.getByRole('region', { name: GAME_INFO[type].label })).toBeInTheDocument();
      expect(screen.getByText('第 1 / 50 关')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    }
    expect(await getPuzzleProgress(1)).toEqual([]);
  });

  it('persists level 50 and its result once before showing the completion screen', async () => {
    for (let level = 0; level < 49; level++) await savePuzzleLevel(1, 'pattern', level, 20);
    await openGames();
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    expect(screen.getByText('第 50 / 50 关')).toBeInTheDocument();
    let resolveSave!: () => void;
    const save = vi.spyOn(Preferences, 'set').mockImplementationOnce(({ key, value }) => new Promise(resolve => {
      resolveSave = () => { mock.raw.set(key, value); resolve(); };
    }));
    const answer = screen.getByRole('button', { name: `选择${buildPatternRound(49).answer.label}` });
    fireEvent.click(answer);
    fireEvent.click(answer);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: '正在保存本关…' })).toBeDisabled();
    await act(async () => { resolveSave(); });
    expect((await getPuzzleProgress(1))[0].levelScores).toHaveLength(50);
    fireEvent.click(screen.getByRole('button', { name: /收下星星/ }));
    expect(screen.getByText('得分：1000')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /新纪录/ })).toBeInTheDocument();
    expect(save).toHaveBeenCalledTimes(1);
    expect(mock.raw.has('pinyin:games:1')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '再选游戏' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '规律小火车' })).toBeEnabled());
    expect(screen.getByRole('button', { name: '规律小火车' })).toHaveTextContent('50 关已通关');
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    expect(screen.getByRole('heading', { name: /全部 50 关已完成/ })).toBeInTheDocument();
  });

  it('shows a failed level save and resumes only after a successful retry', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openGames();
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    const save = vi.spyOn(Preferences, 'set').mockRejectedValueOnce(new Error('full'));
    fireEvent.click(screen.getByRole('button', { name: `选择${buildPatternRound(0).answer.label}` }));
    expect(await screen.findByRole('alert')).toHaveTextContent('这一关的保存尚未确认');
    expect(await getPuzzleProgress(1)).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: '重试保存本关' }));
    await screen.findByRole('button', { name: /下一关/ });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(save).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenCalled();
    expect((await getPuzzleProgress(1))[0].levelScores).toEqual([20]);
    fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    expect(screen.getByRole('button', { name: '规律小火车' })).toHaveTextContent('继续第 2 关');
  });

  it('resumes after leaving and remounting, preserving completed levels but not unfinished attempts', async () => {
    const first = await openGames();
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    await solvePattern(0);
    fireEvent.click(screen.getByRole('button', { name: /下一关/ }));
    const round = buildPatternRound(1);
    const wrong = round.options.find(picture => picture.id !== round.answer.id)!;
    fireEvent.click(screen.getByRole('button', { name: `选择${wrong.label}` }));
    fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    expect(screen.getByRole('button', { name: '规律小火车' })).toHaveTextContent('已完成 1 / 50 关');
    first.unmount();
    await openGames();
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    expect(screen.getByText('第 2 / 50 关')).toBeInTheDocument();
    expect(screen.getByText('已保存 1 关 · 本轮累计 20 分')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect((await getPuzzleProgress(1))[0].levelScores).toEqual([20]);
  });

  it('blocks fresh puzzle starts on unreadable progress and allows retry without overwriting it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mock.raw.set('pinyin:puzzle-progress:1:pattern', '{broken');
    render(<MemoryRouter><GamePage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('进度暂时无法读取');
    expect(screen.getByRole('button', { name: '规律小火车' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '听音选字母' })).toBeEnabled();
    expect(mock.raw.get('pinyin:puzzle-progress:1:pattern')).toBe('{broken');
    mock.raw.delete('pinyin:puzzle-progress:1:pattern');
    fireEvent.click(screen.getByRole('button', { name: '重试读取进度' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '规律小火车' })).toBeEnabled());
  });

  it('refreshes the checkpoint when leaving after a lost save acknowledgement', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openGames();
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    vi.spyOn(Preferences, 'set').mockImplementationOnce(async ({ key, value }) => {
      mock.raw.set(key, value);
      throw new Error('lost acknowledgement');
    });
    fireEvent.click(screen.getByRole('button', { name: `选择${buildPatternRound(0).answer.label}` }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: /选游戏/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: '规律小火车' })).toBeEnabled());
    expect(screen.getByRole('button', { name: '规律小火车' })).toHaveTextContent('继续第 2 关');
    fireEvent.click(screen.getByRole('button', { name: '规律小火车' }));
    expect(screen.getByText('第 2 / 50 关')).toBeInTheDocument();
  });

  it('preserves the original games and their result-save retry flow', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openGames();
    fireEvent.click(screen.getByRole('button', { name: '听音选字母' }));
    vi.spyOn(Preferences, 'set').mockRejectedValueOnce(new Error('full'));
    fireEvent.click(screen.getByRole('button', { name: '完成听音游戏' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('成绩暂时没有保存');
    fireEvent.click(screen.getByRole('button', { name: '重试保存' }));
    await screen.findByRole('heading', { name: /新纪录/ });
    expect((await getProgress(1)).gameScores).toEqual([{ gameType: 'listen', bestScore: 8, bestStars: 2 }]);
    expect(await getPuzzleProgress(1)).toEqual([]);
  });
});
