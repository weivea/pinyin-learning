import { useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { PINYIN_DATA } from '../data/pinyin';
import { StarRating } from '../components/StarRating';

const GAME_LABELS: Record<string, string> = {
  listen: '🎧 听音选字母',
  image: '🖼 看图选拼音',
  memory: '🃏 翻牌配对',
};

export function ProfilePage() {
  const { user, logout } = useUser();
  const { pinyinProgress, gameScores } = useProgress(user?.id);
  const learnedSet = useMemo(() => new Set(pinyinProgress.map(p => p.pinyin)), [pinyinProgress]);
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <h2 style={{ fontSize: 28 }}>已学拼音 ({learnedSet.size} / {PINYIN_DATA.length})</h2>
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

        <h2 style={{ fontSize: 28, marginTop: 32 }}>游戏成绩</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(['listen', 'image', 'memory'] as const).map(gt => {
            const score = gameScores.find(g => g.gameType === gt);
            return (
              <div key={gt} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 16, borderRadius: 16, background: '#fff', border: '2px solid #8ecae6',
              }}>
                <span style={{ fontSize: 22 }}>{GAME_LABELS[gt]}</span>
                {score
                  ? <span><StarRating stars={score.bestStars as 0 | 1 | 2 | 3} /> 最高 {score.bestScore} 分</span>
                  : <span style={{ color: '#888' }}>还没玩过</span>}
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
