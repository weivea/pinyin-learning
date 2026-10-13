import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { PINYIN_DATA } from '../data/pinyin';
import { HANZI, HANZI_GROUPS } from '../data/hanzi';
import { readVisitedHanzi } from '../utils/hanziProgress';
import { READINGS } from '../data/readings';
import { readVisitedReadings } from '../utils/readingProgress';
import { StarRating } from '../components/StarRating';
import { ALL_GAME_TYPES, GAME_INFO, isPuzzleGame } from '../data/games';
import { PUZZLE_ROUND_COUNT } from '../data/puzzleGames';

export function ProfilePage() {
  const { user, logout } = useUser();
  const { pinyinProgress, gameScores, puzzleProgress, error, refresh } = useProgress(user?.id);
  const learnedSet = useMemo(() => new Set(pinyinProgress.map(p => p.pinyin)), [pinyinProgress]);
  const visitedHanzi = useMemo(() => readVisitedHanzi(user?.id), [user?.id]);
  const visitedReadings = useMemo(() => readVisitedReadings(user?.id), [user?.id]);
  const visitedReadingCount = READINGS.filter(reading => visitedReadings.has(reading.id)).length;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div className="page-main fit-screen">
        <h2 style={{ fontSize: 'clamp(22px, 3vh, 28px)', marginTop: 0 }}>已学拼音 ({learnedSet.size} / {PINYIN_DATA.length})</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8,
        }}>
          {PINYIN_DATA.map(p => {
            const learned = learnedSet.has(p.id);
            return (
              <div key={p.id} style={{
                padding: 12, fontSize: 24, textAlign: 'center', borderRadius: 12,
                background: learned ? '#fff8e7' : '#f3f3f3',
                border: learned ? '2px solid #ffb703' : '2px solid #ddd',
                color: learned ? '#333' : '#aaa',
              }}>{p.display}{learned && ' ⭐'}</div>
            );
          })}
        </div>

        <h2 style={{ fontSize: 'clamp(22px, 3vh, 28px)', marginTop: 32 }}>
          已学汉字 ({visitedHanzi.size} / {HANZI.length})
        </h2>
        <Link to="/hanzi" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {HANZI_GROUPS.map((g, i) => {
              const learned = g.items.filter(h => visitedHanzi.has(h.char)).length;
              const colors = ['#8ecae6', '#06d6a0', '#ffb703', '#fb8500', '#bb8fce'];
              const c = colors[i % colors.length];
              return (
                <div key={g.id} style={{
                  padding: 14, borderRadius: 16, background: '#fff', border: `2px solid ${c}`, color: '#333',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{g.label}</div>
                  <div style={{ fontSize: 15, color: '#888', marginTop: 4 }}>已学 {learned} / {g.items.length} 字</div>
                </div>
              );
            })}
          </div>
        </Link>

        <h2 style={{ fontSize: 'clamp(22px, 3vh, 28px)', marginTop: 32 }}>
          已读短文 ({visitedReadingCount} / {READINGS.length})
        </h2>
        <Link to="/readings" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: 16, borderRadius: 16, background: '#fff', border: '2px solid #74c69d', color: '#333',
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>📗 短文阅读</div>
            <div style={{ marginTop: 5, color: '#777' }}>已打开 {visitedReadingCount} 篇短文</div>
          </div>
        </Link>

        <h2 style={{ fontSize: 28, marginTop: 32 }}>游戏成绩</h2>
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button onClick={() => void refresh()}>重试读取进度</button>
          </div>
        )}
        <div style={{ display: 'grid', gap: 12 }}>
          {ALL_GAME_TYPES.map(gt => {
            const score = gameScores.find(g => g.gameType === gt);
            const puzzle = puzzleProgress.find(progress => progress.gameType === gt);
            return (
              <div key={gt} role="group" aria-label={`${GAME_INFO[gt].label}成绩`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                padding: 16, borderRadius: 16, background: '#fff', border: '2px solid #8ecae6',
              }}>
                <div>
                  <span style={{ fontSize: 22 }}>{GAME_INFO[gt].emoji} {GAME_INFO[gt].label}</span>
                  {isPuzzleGame(gt) && (
                    <p style={{ margin: '6px 0 0', fontSize: 15, color: '#687684' }}>
                      已完成 {puzzle?.levelScores.length ?? 0} / {PUZZLE_ROUND_COUNT} 关
                      {puzzle && ` · 本轮累计 ${puzzle.levelScores.reduce((sum, value) => sum + value, 0)} 分`}
                    </p>
                  )}
                </div>
                {score
                  ? <span><StarRating stars={score.bestStars as 0 | 1 | 2 | 3} /> 最高 {score.bestScore} 分</span>
                  : <span style={{ color: '#888' }}>{puzzle?.levelScores.length ? `完成 ${PUZZLE_ROUND_COUNT} 关后领取星星` : '还没玩过'}</span>}
              </div>
            );
          })}
        </div>

        <button onClick={logout} style={{
          marginTop: 32, padding: '12px 24px', fontSize: 18, borderRadius: 16,
          border: '2px solid #e63946', background: '#fff', color: '#e63946', cursor: 'pointer',
        }}>退出登录</button>
      </div>
    </div>
  );
}
