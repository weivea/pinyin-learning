import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { READINGS } from '../data/readings';
import { useProgress } from '../hooks/useProgress';
import { useUser } from '../hooks/useUser';
import { readVisitedReadings } from '../utils/readingProgress';
import type { ReadingTheme } from '../types';
import './ReadingPages.css';

const THEME_EMOJI: Record<ReadingTheme, string> = {
  童话: '🪄',
  生活: '🏠',
  自然: '🌿',
  校园: '🏫',
};

export function ReadingListPage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const visited = useMemo(() => readVisitedReadings(user?.id), [user?.id]);
  const visitedCount = READINGS.filter((reading) => visited.has(reading.id)).length;

  if (!user) return null;
  const totalStars = gameScores.reduce((sum, game) => sum + game.bestStars, 0);

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <main className="page-main fit-screen">
        <div className="reading-list-heading">
          <h2>📗 短文阅读</h2>
          <p>每个字都有拼音，跟着朗读慢慢读</p>
          <div className="reading-progress" aria-label={`已读 ${visitedCount} 篇，共 ${READINGS.length} 篇`}>
            <span style={{ width: `${(visitedCount / READINGS.length) * 100}%` }} />
          </div>
          <strong>已读 {visitedCount} / {READINGS.length} 篇</strong>
        </div>

        <div className="reading-grid">
          {READINGS.map((reading, index) => {
            const isVisited = visited.has(reading.id);
            return (
              <Link
                className={`reading-card${isVisited ? ' is-visited' : ''}`}
                key={reading.id}
                to={`/readings/${reading.id}`}
                aria-label={`第 ${index + 1} 篇，${reading.title}${isVisited ? '，已读' : ''}`}
              >
                <span className="reading-card-number">{String(index + 1).padStart(2, '0')}</span>
                {isVisited && <span className="reading-card-visited">⭐ 已读</span>}
                <span className="reading-card-theme">
                  {THEME_EMOJI[reading.theme]} {reading.theme}
                </span>
                <h3>{reading.title}</h3>
                <div className="reading-card-meta">
                  <span>{reading.characterCount} 字</span>
                  <span>难度 {'●'.repeat(reading.difficulty)}{'○'.repeat(5 - reading.difficulty)}</span>
                </div>
                <span className="reading-card-new">
                  {reading.newCharacters.length > 0
                    ? `生字 ${reading.newCharacters.length} 个`
                    : '全部是已学字'}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
