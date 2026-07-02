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
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div
        className="page-main"
        style={{
          display: 'grid',
          gap: 'clamp(12px, 2vh, 24px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          alignContent: 'center',
          maxWidth: 720,
        }}
      >
        <HomeButton to="/letters" emoji="🔤" label="学字母" color="#ffb703" />
        <HomeButton to="/cards" emoji="📚" label="学拼音" color="#8ecae6" />
        <HomeButton to="/hanzi" emoji="🀄" label="学汉字" color="#ef476f" />
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
      padding: 'clamp(16px, 3vh, 32px)', fontSize: 'clamp(26px, 4vh, 36px)', textDecoration: 'none', color: '#333',
      background: '#fff', border: `4px solid ${color}`, borderRadius: 24,
    }}>
      <span style={{ fontSize: 'clamp(40px, 7vh, 64px)' }}>{emoji}</span>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </Link>
  );
}
