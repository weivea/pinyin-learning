import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { useAudio } from '../hooks/useAudio';
import { TopBar } from '../components/TopBar';
import { LetterStrokeAnimation } from '../components/LetterStrokeAnimation';
import { TracingCanvas } from '../components/TracingCanvas';
import { LetterTracingQuiz } from '../components/LetterTracingQuiz';
import { getLetter, getAdjacent } from '../data/letters';
import { markLetterVisited } from '../utils/letterProgress';
import { useFamiliarity } from '../hooks/useFamiliarity';
import { FamiliarityEditor } from '../components/FamiliarityHearts';
import { speakEnglish } from '../audio/speak';

export function LetterDetailPage() {
  const { letter } = useParams<{ letter: string }>();
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const { play } = useAudio();
  const navigate = useNavigate();

  const item = getLetter(letter);
  const [famLevel, setFamLevel] = useFamiliarity('letters', user?.id, item?.lower);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && item) markLetterVisited(user.id, item.lower);
  }, [user, item]);

  if (!user) return null;
  if (!item) return <Navigate to="/letters" replace />;

  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);
  const { prev, next } = getAdjacent(item.lower);

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      <div className="page-main fit-screen" style={{ maxWidth: 720 }}>
        <Link to="/letters" style={{
          display: 'inline-block', padding: '8px 16px', fontSize: 18, borderRadius: 12,
          border: '2px solid #ccc', background: '#fff', color: '#333', textDecoration: 'none',
        }}>← 返回字母表</Link>

        {/* 字母 + 介绍 */}
        <section style={cardStyle}>
          <div style={{ fontSize: 'clamp(84px, 16vh, 120px)', fontWeight: 'bold', lineHeight: 1, color: '#fb8500' }}>
            {item.letter}<span style={{ color: '#219ebc' }}>{item.lower}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => void speakEnglish(item.spokenName)} style={primaryBtn} aria-label={`朗读字母 ${item.letter}`}>
              🔊 读字母
            </button>
          </div>
          <p style={{ fontSize: 19, color: '#555', lineHeight: 1.7, marginTop: 20 }}>{item.intro}</p>
          <button onClick={() => void play(item.intro)} style={ghostBtn} aria-label="朗读介绍">
            🔊 朗读介绍
          </button>
        </section>

        {/* 熟悉程度（自己调整） */}
        <Section title="❤️ 熟悉程度" color="#ef476f">
          <p style={{ fontSize: 16, color: '#888', margin: '0 0 12px' }}>点 ♥️ 记录你有多熟这个字母</p>
          <FamiliarityEditor level={famLevel} onChange={setFamLevel} />
        </Section>

        {/* 书写轨迹 */}
        <Section title="✏️ 字母怎么写" color="#fb8500">
          <LetterStrokeAnimation upper={item.letter} lower={item.lower} />
        </Section>

        {/* 在拼音里的读音 */}
        <Section title="🀄 在拼音里怎么读" color="#06d6a0">
          <div style={{ fontSize: 40, fontWeight: 'bold', color: '#06a37a' }}>{item.pinyinReading}</div>
          <p style={{ fontSize: 18, color: '#666', margin: '10px 0' }}>{item.pinyinDesc}</p>
          <button onClick={() => void play(item.pinyinHanzi)} style={{ ...primaryBtn, borderColor: '#06d6a0', color: '#06a37a' }}>
            🔊 听拼音读音
          </button>
        </Section>

        {/* 例词 */}
        <Section title="🖼️ 用它开头的单词" color="#8ecae6">
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16 }}>
            {item.examples.map(ex => (
              <div key={ex.word} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: 16, borderRadius: 20, background: '#fff', border: '3px solid #8ecae6', minWidth: 140,
              }}>
                <span style={{ fontSize: 56 }}>{ex.emoji}</span>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{ex.word}</div>
                <div style={{ fontSize: 18, color: '#888' }}>{ex.zh}</div>
                <button onClick={() => void speakEnglish(ex.word)} style={{
                  width: 40, height: 40, borderRadius: 20, border: 'none', background: '#ffd166', fontSize: 20, cursor: 'pointer',
                }} aria-label={`朗读 ${ex.word}`}>🔊</button>
              </div>
            ))}
          </div>
        </Section>

        {/* 仿照描写 */}
        <Section title="🖊️ 照着写一写" color="#bb8fce">
          <TracingCanvas upper={item.letter} lower={item.lower} />
        </Section>

        {/* 闯关描红 */}
        <Section title="🏆 闯关描红" color="#06d6a0">
          <LetterTracingQuiz upper={item.letter} lower={item.lower} />
        </Section>

        {/* 上一个 / 下一个 */}
        <div style={{ margin: '24px 0 40px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => prev && navigate(`/letters/${prev}`)} disabled={!prev} style={navBtn(!prev)}>
            ← {prev ? prev.toUpperCase() : ''}
          </button>
          <button onClick={() => next && navigate(`/letters/${next}`)} disabled={!next} style={{ ...navBtn(!next), background: next ? '#06d6a0' : '#eee', color: next ? '#fff' : '#aaa' }}>
            {next ? next.toUpperCase() : ''} →
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

const cardStyle: CSSProperties = {
  marginTop: 16, padding: 24, borderRadius: 28, background: '#fff',
  border: '4px solid #ffd166', textAlign: 'center',
};

const primaryBtn: CSSProperties = {
  fontSize: 20, padding: '12px 24px', borderRadius: 16,
  border: '3px solid #fb8500', background: '#fff', color: '#fb8500', fontWeight: 'bold', cursor: 'pointer',
};

const ghostBtn: CSSProperties = {
  fontSize: 16, padding: '8px 18px', borderRadius: 14, marginTop: 8,
  border: '2px solid #8ecae6', background: '#fff', color: '#219ebc', cursor: 'pointer',
};

function navBtn(disabled: boolean): CSSProperties {
  return {
    fontSize: 22, fontWeight: 'bold', padding: '12px 28px', borderRadius: 16,
    border: '3px solid #8ecae6', background: disabled ? '#eee' : '#fff',
    color: disabled ? '#aaa' : '#333', cursor: disabled ? 'default' : 'pointer', minWidth: 100,
  };
}
