import { Routes, Route, Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { LoginPage } from './pages/LoginPage';
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
      <Route path="/" element={
        <RequireUser>
          <div style={{ padding: 32 }}><h1>已登录 🎉</h1></div>
        </RequireUser>
      } />
    </Routes>
  );
}
