import { apiFetch } from './client';
import type { User } from '../types';

export function loginOrCreate(nickname: string, avatar: string): Promise<User> {
  return apiFetch<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify({ nickname, avatar }),
  });
}

export function getUser(id: number): Promise<User> {
  return apiFetch<User>(`/api/users/${id}`);
}
