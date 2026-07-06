import { useNavigate } from 'react-router-dom';
import { useMemo, useState, type CSSProperties } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { HANZI_GROUPS } from '../data/hanzi';
import { readVisitedHanzi } from '../utils/hanziProgress';
import { readFamiliarityMap } from '../utils/familiarity';
import { FamiliarityHearts } from '../components/FamiliarityHearts';

const GROUP_COLORS = ['#8ecae6', '#06d6a0', '#ffb703', '#fb8500', '#bb8fce'];

export function HanziPage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);

  const visited = useMemo(() => readVisitedHanzi(user?.id), [user?.id]);
  const familiarity = useMemo(() => readFamiliarityMap('hanzi', user?.id), [user?.id]);

  if (!user) return null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);
  const group = HANZI_GROUPS[activeIdx];
  const color = GROUP_COLORS[activeIdx % GROUP_COLORS.length];
  const learnedInGroup = group.items.filter((h) => visited.has(h.char)).length;

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div className="page-main fit-screen">
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 3.4vh, 30px)', color: '#fb8500', margin: '4px 0' }}>
          🀄 拼音学汉字
        </h2>
        <p style={{ textAlign: 'center', fontSize: 15, color: '#888', marginTop: 0, marginBottom: 12 }}>
          点汉字卡片，看拼音、听朗读、学组词和造句
        </p>

        {/* 分册选择 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
          {HANZI_GROUPS.map((g, i) => {
            const on = i === activeIdx;
            const c = GROUP_COLORS[i % GROUP_COLORS.length];
            return (
              <button
                key={g.id}
                onClick={() => setActiveIdx(i)}
                style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 15, fontWeight: 'bold',
                  border: `2px solid ${c}`, background: on ? c : '#fff', color: on ? '#fff' : '#555',
                  cursor: 'pointer',
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#999', margin: '0 0 12px' }}>
          共 {group.items.length} 字 · 已学 {learnedInGroup} 字
        </p>

        {/* 汉字网格 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
            gap: 10,
            paddingBottom: 24,
          }}
        >
          {group.items.map((h) => (
            <button
              key={h.char}
              onClick={() => navigate(`/hanzi/${encodeURIComponent(h.char)}`)}
              style={tileStyle(color, visited.has(h.char))}
              aria-label={`学习汉字 ${h.char}`}
            >
              {visited.has(h.char) && <span style={starBadge}>⭐</span>}
              <span style={{ fontSize: 12, color: '#999', lineHeight: 1 }}>{h.pinyin}</span>
              <span style={{ fontSize: 30, fontWeight: 'bold', lineHeight: 1.1 }}>{h.char}</span>
              {(familiarity[h.char] ?? 0) > 0 && (
                <FamiliarityHearts level={familiarity[h.char]} size={10} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function tileStyle(color: string, visited: boolean): CSSProperties {
  return {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    padding: '10px 4px', borderRadius: 16, background: visited ? `${color}22` : '#fff',
    border: `2px solid ${color}`, color: '#333', cursor: 'pointer', minHeight: 68,
  };
}

const starBadge: CSSProperties = {
  position: 'absolute', top: 2, right: 4, fontSize: 12, lineHeight: 1,
};
