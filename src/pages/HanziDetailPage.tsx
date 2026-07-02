import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { useAudio } from '../hooks/useAudio';
import { TopBar } from '../components/TopBar';
import { getHanzi, getAdjacentHanzi } from '../data/hanzi';
import { markHanziVisited } from '../utils/hanziProgress';
import { HanziStrokeAnimation } from '../components/HanziStrokeAnimation';
import { HanziTracing } from '../components/HanziTracing';

export function HanziDetailPage() {
  const { char } = useParams<{ char: string }>();
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const { play } = useAudio();
  const navigate = useNavigate();

  const decoded = char ? decodeURIComponent(char) : undefined;
  const item = getHanzi(decoded);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && item) markHanziVisited(user.id, item.char);
  }, [user, item]);

  if (!user) return null;
  if (!item) return <Navigate to="/hanzi" replace />;

  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);
  const { prev, next } = getAdjacentHanzi(item.char);

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      <div className="page-main fit-screen" style={{ maxWidth: 720 }}>
        <Link to="/hanzi" style={backLink}>← 返回汉字表</Link>

        {/* 汉字 + 拼音 + 朗读 */}
        <section style={cardStyle}>
          <div style={{ fontSize: 22, color: '#888', fontWeight: 'bold' }}>{item.pinyin}</div>
          <div style={{ fontSize: 'clamp(96px, 20vh, 150px)', fontWeight: 'bold', lineHeight: 1.05, color: '#fb8500' }}>
            {item.char}
          </div>
          <button onClick={() => void play(item.char)} style={primaryBtn} aria-label={`朗读汉字 ${item.char}`}>
            🔊 读一读
          </button>
          <div style={{ marginTop: 10, fontSize: 14, color: '#aaa' }}>{item.volume}</div>
        </section>

        {/* 笔顺 */}
        <Section title="✏️ 笔顺" color="#ffb703">
          <HanziStrokeAnimation char={item.char} />
        </Section>

        {/* 描红练习 */}
        <Section title="🖊️ 描红练习" color="#06d6a0">
          <HanziTracing char={item.char} />
        </Section>

        {/* 组词 */}
        <Section title="🧩 组词" color="#8ecae6">
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14 }}>
            {item.words.map((w) => (
              <div key={w.word} style={wordCard}>
                <div style={{ fontSize: 14, color: '#999' }}>{w.pinyin}</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', margin: '2px 0 8px' }}>{w.word}</div>
                <button onClick={() => void play(w.word)} style={roundBtn} aria-label={`朗读 ${w.word}`}>
                  🔊
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* 造句 */}
        <Section title="💬 造句" color="#06d6a0">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {item.sentences.map((s, i) => (
              <div key={i} style={sentenceRow}>
                <span style={{ fontSize: 20, lineHeight: 1.6, textAlign: 'left', flex: 1 }}>{s}</span>
                <button onClick={() => void play(s)} style={{ ...roundBtn, flexShrink: 0 }} aria-label="朗读句子">
                  🔊
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* 上一个 / 下一个 */}
        <div style={{ margin: '24px 0 40px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => prev && navigate(`/hanzi/${encodeURIComponent(prev)}`)} disabled={!prev} style={navBtn(!prev)}>
            ← {prev ?? ''}
          </button>
          <button
            onClick={() => next && navigate(`/hanzi/${encodeURIComponent(next)}`)}
            disabled={!next}
            style={{ ...navBtn(!next), background: next ? '#06d6a0' : '#eee', color: next ? '#fff' : '#aaa' }}
          >
            {next ?? ''} →
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <section style={{ ...cardStyle, borderColor: color, textAlign: 'center' }}>
      <h3 style={{ fontSize: 24, color: '#444', marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

const backLink: CSSProperties = {
  display: 'inline-block', padding: '8px 16px', fontSize: 18, borderRadius: 12,
  border: '2px solid #ccc', background: '#fff', color: '#333', textDecoration: 'none',
};

const cardStyle: CSSProperties = {
  marginTop: 16, padding: 24, borderRadius: 28, background: '#fff',
  border: '4px solid #ffd166', textAlign: 'center',
};

const primaryBtn: CSSProperties = {
  fontSize: 20, padding: '12px 24px', borderRadius: 16,
  border: '3px solid #fb8500', background: '#fff', color: '#fb8500', fontWeight: 'bold', cursor: 'pointer',
};

const wordCard: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '12px 16px', borderRadius: 20, background: '#fff', border: '3px solid #8ecae6', minWidth: 110,
};

const sentenceRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px', borderRadius: 18, background: '#f7fff9', border: '2px solid #b8f0d8',
};

const roundBtn: CSSProperties = {
  width: 44, height: 44, borderRadius: 22, border: 'none', background: '#ffd166', fontSize: 20, cursor: 'pointer',
};

function navBtn(disabled: boolean): CSSProperties {
  return {
    fontSize: 26, fontWeight: 'bold', padding: '10px 26px', borderRadius: 16,
    border: '3px solid #8ecae6', background: disabled ? '#eee' : '#fff',
    color: disabled ? '#aaa' : '#333', cursor: disabled ? 'default' : 'pointer', minWidth: 96,
  };
}
