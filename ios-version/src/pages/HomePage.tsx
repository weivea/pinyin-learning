import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';

export function HomePage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  if (!user) return null;
  const totalStars = gameScores.reduce((sum, g) => sum + g.bestStars, 0);

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ display: 'grid', gap: 24, padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <HomeButton to="/cards" emoji="📚" label="学拼音" color="#8ecae6" />
        <HomeButton to="/game" emoji="🎮" label="玩游戏" color="#fb8500" />
        <HomeButton to="/profile" emoji="🏆" label="我的进度" color="#06d6a0" />
        <HomeButton to="/recite" emoji="📖" label="背诵表" color="#bb8fce" />
      </div>
    </div>
  );
}

function HomeButton({ to, emoji, label, color }: { to: string; emoji: string; label: string; color: string }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: '32px', fontSize: 36, textDecoration: 'none', color: '#333',
      background: '#fff', border: `4px solid ${color}`, borderRadius: 24,
    }}>
      <span style={{ fontSize: 64 }}>{emoji}</span>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </Link>
  );
}
