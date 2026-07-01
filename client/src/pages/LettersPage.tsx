import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { LetterGrid } from '../components/LetterGrid';
import { readVisitedLetters } from '../utils/letterProgress';

export function LettersPage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const navigate = useNavigate();

  const visited = useMemo(() => readVisitedLetters(user?.id), [user?.id]);

  if (!user) return null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 30, color: '#fb8500', margin: '8px 0 4px' }}>
          🔤 英文字母
        </h2>
        <p style={{ textAlign: 'center', fontSize: 18, color: '#888', marginTop: 0 }}>
          点 🔊 听字母名，点字母卡片进入学习
        </p>
        <LetterGrid learnedLetters={visited} onSelect={lower => navigate(`/letters/${lower}`)} />
      </div>
    </div>
  );
}
