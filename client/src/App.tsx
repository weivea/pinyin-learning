import { Routes, Route, Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CardsPage } from './pages/CardsPage';
import { ProfilePage } from './pages/ProfilePage';
import { useUser } from './hooks/useUser';

function RequireUser({ children }: { children: JSX.Element }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireUser><HomePage /></RequireUser>} />
      <Route path="/cards" element={<RequireUser><CardsPage /></RequireUser>} />
      <Route path="/profile" element={<RequireUser><ProfilePage /></RequireUser>} />
      <Route path="/game" element={<RequireUser><div style={{padding:32}}>游戏页（Task 16+ 实现）</div></RequireUser>} />
    </Routes>
  );
}
