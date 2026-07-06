import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { LetterGrid } from '../components/LetterGrid';
import { readVisitedLetters } from '../utils/letterProgress';
import { readFamiliarityMap } from '../utils/familiarity';

export function LettersPage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const navigate = useNavigate();

  const visited = useMemo(() => readVisitedLetters(user?.id), [user?.id]);
  const familiarity = useMemo(() => readFamiliarityMap('letters', user?.id), [user?.id]);

  if (!user) return null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div className="page-main fit-screen">
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 3.4vh, 30px)', color: '#fb8500', margin: '4px 0' }}>
          🔤 英文字母
        </h2>
        <p style={{ textAlign: 'center', fontSize: 16, color: '#888', marginTop: 0, marginBottom: 'clamp(8px, 1.6vh, 16px)' }}>
          点 🔊 听字母名，点字母卡片进入学习
        </p>
        <LetterGrid learnedLetters={visited} familiarity={familiarity} onSelect={lower => navigate(`/letters/${lower}`)} />
      </div>
    </div>
  );
}
