import { useState } from 'react';
import * as usersApi from '../api/users';
import type { User } from '../types';

const AVATARS = ['🐰', '🐱', '🐶', '🦊', '🐻', '🐼', '🐯', '🐵', '🐸', '🦄', '🐧', '🐢'];

interface Props {
  onLogin: (user: User) => void;
}

export function NicknameLogin({ onLogin }: Props) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!nickname.trim()) { setError('请输入昵称'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const user = await usersApi.loginOrCreate(nickname.trim(), avatar);
      onLogin(user);
    } catch (err) {
      setError('登录失败，请稍后再试');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      maxWidth: 480, margin: '40px auto', padding: 32,
      borderRadius: 24, background: '#fff',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    }}>
      <h1 style={{ textAlign: 'center', fontSize: 36 }}>欢迎来学拼音 🎉</h1>

      <label style={{ fontSize: 22, display: 'block', marginTop: 24 }}>选个头像：</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {AVATARS.map(a => (
          <button
            key={a}
            onClick={() => setAvatar(a)}
            style={{
              fontSize: 36, padding: 8, width: 64, height: 64,
              borderRadius: 16,
              border: avatar === a ? '4px solid #fb8500' : '2px solid #eee',
              background: '#fff', cursor: 'pointer',
            }}
            aria-label={`选择头像 ${a}`}
          >
            {a}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 22, display: 'block', marginTop: 24 }}>你的昵称：</label>
      <input
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="例如：小明"
        maxLength={12}
        style={{
          width: '100%', fontSize: 28, padding: '12px 16px',
          borderRadius: 16, border: '3px solid #8ecae6', marginTop: 8,
        }}
      />

      {error && <div style={{ color: '#e63946', marginTop: 12 }}>{error}</div>}

      <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
        提示：本网站不需要密码。任何人输入相同昵称会看到 ta 的进度。
      </p>

      <button
        onClick={() => void handleSubmit()}
        disabled={submitting}
        style={{
          marginTop: 24, width: '100%', fontSize: 28, padding: '16px',
          borderRadius: 24, border: 'none', background: '#fb8500', color: '#fff',
          cursor: 'pointer',
        }}
      >
        {submitting ? '进入中...' : '开始学习 →'}
      </button>
    </div>
  );
}
