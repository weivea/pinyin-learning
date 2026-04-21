import { Link } from 'react-router-dom';
import type { User } from '../types';

interface Props {
  user: User;
  totalStars: number;
  onLogout?: () => void;
}

export function TopBar({ user, totalStars, onLogout }: Props) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', background: '#fff', borderBottom: '3px solid #ffd166',
    }}>
      <Link to="/" style={{ fontSize: 24, fontWeight: 'bold', textDecoration: 'none', color: '#333' }}>
        🐣 拼音学习
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22 }}>
        <span>{user.avatar}</span>
        <span>{user.nickname}</span>
        <span>⭐ {totalStars}</span>
        {onLogout && (
          <button onClick={onLogout} style={{
            border: 'none', background: 'transparent', fontSize: 14, color: '#888', cursor: 'pointer',
          }}>退出</button>
        )}
      </div>
    </header>
  );
}
