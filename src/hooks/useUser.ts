import { useCallback, useEffect, useState } from 'react';
import type { User } from '../types';

const STORAGE_KEY = 'pinyin-learning:user';

// 模块级别的简易 pub/sub，让所有 useUser 实例共享同一份状态
type Listener = (u: User | null) => void;
const listeners = new Set<Listener>();

function readStored(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeStored(u: User | null) {
  if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  else localStorage.removeItem(STORAGE_KEY);
  listeners.forEach(l => l(u));
}

export function useUser() {
  const [user, setUser] = useState<User | null>(() => readStored());

  useEffect(() => {
    const listener: Listener = (u) => setUser(u);
    listeners.add(listener);
    // 挂载时同步一次最新值（防止挂载时机错过通知）
    setUser(readStored());
    return () => { listeners.delete(listener); };
  }, []);

  const login = useCallback((u: User) => writeStored(u), []);
  const logout = useCallback(() => writeStored(null), []);

  return { user, login, logout };
}
