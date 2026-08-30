import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { READINGS } from '../data/readings';
import { readVisitedReadings } from '../utils/readingProgress';
import { ReadingDetailPage } from './ReadingDetailPage';

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({
    user: { id: 1, nickname: '小明', avatar: '🐣' },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: () => ({ gameScores: [] }),
}));

const playMock = vi.fn();
const pauseMock = vi.fn();
vi.mock('../hooks/useReadingPlayer', () => ({
  useReadingPlayer: () => ({
    status: 'idle',
    currentIndex: -1,
    play: playMock,
    pause: pauseMock,
  }),
}));

describe('ReadingDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    playMock.mockClear();
    pauseMock.mockClear();
  });

  it('renders per-character pinyin, controls, and records the passage as visited', () => {
    const reading = READINGS[0];
    const { container } = render(
      <MemoryRouter initialEntries={[`/readings/${reading.id}`]}>
        <Routes>
          <Route path="/readings/:readingId" element={<ReadingDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: reading.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶️ 播放' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⏸️ 暂停' })).toBeDisabled();
    expect(container.querySelectorAll('.reading-copy ruby').length).toBe(reading.characterCount);
    expect(readVisitedReadings(1).has(reading.id)).toBe(true);
  });

  it('opens a pinyin card when a marked new character is selected', () => {
    const reading = READINGS.find((item) => item.newCharacters.length > 0)!;
    const newCharacter = reading.newCharacters[0];
    render(
      <MemoryRouter initialEntries={[`/readings/${reading.id}`]}>
        <Routes>
          <Route path="/readings/:readingId" element={<ReadingDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole('button', {
      name: `查看生字 ${newCharacter.char}，拼音 ${newCharacter.pinyin}`,
    })[0]);
    expect(screen.getByRole('dialog', { name: '生字卡' })).toHaveTextContent(newCharacter.char);
    expect(screen.getByRole('dialog', { name: '生字卡' })).toHaveTextContent(newCharacter.pinyin);
  });

  it('redirects an unknown passage to the reading list', () => {
    render(
      <MemoryRouter initialEntries={['/readings/not-found']}>
        <Routes>
          <Route path="/readings/:readingId" element={<ReadingDetailPage />} />
          <Route path="/readings" element={<div>短文列表</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('短文列表')).toBeInTheDocument();
  });
});
